using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.ComponentModel;
using System.Drawing;
using System.Drawing.Printing;
using Microsoft.Win32;

Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

var config = AgentConfig.Load();
if (!string.IsNullOrWhiteSpace(config.ConfigPath))
{
    Console.WriteLine($"[windows-dotnet-print-agent] config loaded: {config.ConfigPath}");
}
else
{
    Console.WriteLine("[windows-dotnet-print-agent] config not found, using defaults/env");
}

static string Pick(string? envValue, string? configValue, string fallback)
{
    if (!string.IsNullOrWhiteSpace(envValue)) return envValue.Trim();
    if (!string.IsNullOrWhiteSpace(configValue)) return configValue.Trim();
    return fallback;
}

var host = Pick(Environment.GetEnvironmentVariable("PRINT_AGENT_HOST"), config.Host, "localhost");
var port = Pick(Environment.GetEnvironmentVariable("PRINT_AGENT_PORT"), config.Port, "19000");
var token = Pick(Environment.GetEnvironmentVariable("PRINT_AGENT_TOKEN"), config.Token, string.Empty);
var printerName = Pick(Environment.GetEnvironmentVariable("PRINT_AGENT_PRINTER"), config.PrinterName, string.Empty);
var dataType = Pick(Environment.GetEnvironmentVariable("PRINT_AGENT_DATATYPE"), config.DataType, "AUTO").ToUpperInvariant();
var portName = Pick(Environment.GetEnvironmentVariable("PRINT_AGENT_PORT_NAME"), config.PortName, string.Empty);
var runtime = new AgentRuntimeState(host, port, token, printerName, dataType, portName, config.ConfigPath);

var prefix = $"http://{host}:{port}/";
var listener = new HttpListener();
listener.Prefixes.Add(prefix);

try
{
    listener.Start();
}
catch (HttpListenerException ex) when (ex.ErrorCode == 5)
{
    Console.WriteLine("[ERROR] HttpListener access denied.");
    Console.WriteLine($"[HINT] Jalankan sebagai Administrator, atau daftarkan URL ACL:");
    Console.WriteLine($"       netsh http add urlacl url={prefix} user=Everyone");
    Console.WriteLine("[HINT] Alternatif paling mudah: pakai host=localhost di agent-config.json / PRINT_AGENT_HOST.");
    throw;
}

Console.WriteLine($"[windows-dotnet-print-agent] listening on {prefix}");
Console.WriteLine(string.IsNullOrWhiteSpace(runtime.PrinterName)
    ? "[windows-dotnet-print-agent] printer: default windows printer"
    : $"[windows-dotnet-print-agent] printer: {runtime.PrinterName}");
Console.WriteLine($"[windows-dotnet-print-agent] datatype: {runtime.DataType}");
Console.WriteLine(string.IsNullOrWhiteSpace(runtime.PortName)
    ? "[windows-dotnet-print-agent] port: auto-detect from printer"
    : $"[windows-dotnet-print-agent] port: {runtime.PortName} (direct USB mode)");
Console.WriteLine($"[windows-dotnet-print-agent] UIX: {prefix}uix");

while (true)
{
    var ctx = await listener.GetContextAsync();
    _ = Task.Run(() => HandleRequest(ctx, runtime));
}

static async Task HandleRequest(HttpListenerContext ctx, AgentRuntimeState runtime)
{
    try
    {
        var req = ctx.Request;
        var res = ctx.Response;

        var path = req.Url?.AbsolutePath ?? "/";

        if (req.HttpMethod == "GET" && path == "/")
        {
            await Json(res, 200, new { ok = true, service = "windows-dotnet-print-agent", hint = "use POST /print/receipt", dataType = runtime.DataType, portName = runtime.PortName, uix = "/uix" });
            return;
        }

        if (req.HttpMethod == "GET" && path == "/uix")
        {
            await Html(res, 200, BuildUixHtml(runtime));
            return;
        }

        if (req.HttpMethod == "GET" && path == "/health")
        {
            await Json(res, 200, new { ok = true, service = "windows-dotnet-print-agent", dataType = runtime.DataType });
            return;
        }

        if (req.HttpMethod == "GET" && path == "/printers")
        {
            var list = PrinterSettings.InstalledPrinters.Cast<string>().ToList();
            await Json(res, 200, new
            {
                ok = true,
                service = "windows-dotnet-print-agent",
                defaultPrinter = RawPrinterHelper.GetDefaultPrinterName(),
                printers = list
            });
            return;
        }

        if (req.HttpMethod == "GET" && path == "/ports")
        {
            var ports = DirectPortWriter.ListAvailablePorts();
            await Json(res, 200, new { ok = true, ports, hint = "Set portName in config to use direct USB mode (bypasses spooler)" });
            return;
        }

        if (req.HttpMethod == "GET" && path == "/config")
        {
            await Json(res, 200, runtime.GetPublicConfig());
            return;
        }

        if (req.HttpMethod == "POST" && path == "/config/update")
        {
            using var reader = new StreamReader(req.InputStream, req.ContentEncoding ?? Encoding.UTF8);
            var body = await reader.ReadToEndAsync();
            var payload = JsonSerializer.Deserialize<AgentConfigUpdate>(body, JsonOptions.Default) ?? new AgentConfigUpdate();

            var updated = runtime.Update(payload);
            var saved = false;
            if (payload.Save_To_File)
            {
                saved = runtime.SaveToConfigFile();
            }

            await Json(res, 200, new
            {
                ok = true,
                saved,
                message = "Config updated di runtime. Ubah host/port butuh restart agent agar listener pindah.",
                config = updated
            });
            return;
        }


        if (req.HttpMethod == "POST" && path == "/print/test")
        {
            if (!CheckToken(req, runtime, out var tokenErr))
            {
                await Json(res, 401, new { message = tokenErr });
                return;
            }

            using var reader = new StreamReader(req.InputStream, req.ContentEncoding ?? Encoding.UTF8);
            var body = await reader.ReadToEndAsync();
            var payload = JsonSerializer.Deserialize<PrintPayload>(body, JsonOptions.Default) ?? new PrintPayload();

            var targetPrinter = ResolvePrinter(payload.Printer_Name, runtime);
            if (string.IsNullOrWhiteSpace(targetPrinter) && string.IsNullOrWhiteSpace(runtime.PortName))
            {
                await Json(res, 500, new { message = "No printer or port found. Set printerName or portName in config." });
                return;
            }

            var testReceipt = new ReceiptModel
            {
                Title = "NUMARS TEST PRINT",
                Divider = "------------------------",
                Printed_At = DateTime.Now.ToString("HH:mm"),
                Total = 0,
                Items = new List<ReceiptItem>
                {
                    new ReceiptItem { Service_Name = "Tes koneksi agent", Qty = 1, Subtotal = 0 }
                }
            };

            if (!string.IsNullOrWhiteSpace(targetPrinter) && (runtime.DataType == "GDI_RECEIPT" || runtime.DataType == "GDI_LAYOUT"))
            {
                var gdiOk = GdiReceiptPrinter.PrintReceipt(targetPrinter, testReceipt, out var gdiError);
                if (!gdiOk)
                {
                    var list = PrinterSettings.InstalledPrinters.Cast<string>().ToList();
                    await Json(res, 500, new
                    {
                        message = "Failed printing via GDI receipt mode",
                        printer = targetPrinter,
                        portName = runtime.PortName,
                        dataType = runtime.DataType,
                        method = "gdi-layout",
                        errorCode = 0,
                        errorMessage = gdiError,
                        attemptTrace = "GDI_RECEIPT",
                        defaultPrinter = RawPrinterHelper.GetDefaultPrinterName(),
                        printers = list
                    });
                    return;
                }

                await Json(res, 200, new { success = true, printer = targetPrinter, portName = runtime.PortName, mode = "test-print", method = "gdi-layout", dataType = runtime.DataType });
                return;
            }

            var testRaw = BuildTestReceipt();
            var result = PrintBytes(targetPrinter, runtime, Encoding.GetEncoding(437).GetBytes(testRaw));

            if (!result.Ok)
            {
                var list = PrinterSettings.InstalledPrinters.Cast<string>().ToList();
                await Json(res, 500, new
                {
                    message = "Failed sending raw bytes to printer",
                    printer = targetPrinter,
                    portName = runtime.PortName,
                    dataType = runtime.DataType,
                    method = result.Method,
                    errorCode = result.ErrorCode,
                    errorMessage = result.ErrorMessage,
                    attemptTrace = result.AttemptTrace,
                    defaultPrinter = RawPrinterHelper.GetDefaultPrinterName(),
                    printers = list
                });
                return;
            }

            await Json(res, 200, new { success = true, printer = targetPrinter, portName = runtime.PortName, mode = "test-print", method = result.Method, dataType = runtime.DataType });
            return;
        }

        if (req.HttpMethod == "POST" && path == "/print/receipt")
        {
            if (!CheckToken(req, runtime, out var tokenErr))
            {
                await Json(res, 401, new { message = tokenErr });
                return;
            }

            using var reader = new StreamReader(req.InputStream, req.ContentEncoding ?? Encoding.UTF8);
            var body = await reader.ReadToEndAsync();
            var payload = JsonSerializer.Deserialize<PrintPayload>(body, JsonOptions.Default) ?? new PrintPayload();

            var raw = ReceiptBuilder.BuildRaw(payload.Receipt);
            var targetPrinter = ResolvePrinter(payload.Printer_Name, runtime);

            if (string.IsNullOrWhiteSpace(targetPrinter) && string.IsNullOrWhiteSpace(runtime.PortName))
            {
                await Json(res, 500, new { message = "No printer or port found. Set printerName or portName in config." });
                return;
            }

            if (!string.IsNullOrWhiteSpace(targetPrinter) && (runtime.DataType == "GDI_RECEIPT" || runtime.DataType == "GDI_LAYOUT"))
            {
                var gdiOk = GdiReceiptPrinter.PrintReceipt(targetPrinter, payload.Receipt, out var gdiError);
                if (!gdiOk)
                {
                    var list = PrinterSettings.InstalledPrinters.Cast<string>().ToList();
                    await Json(res, 500, new
                    {
                        message = "Failed printing via GDI receipt mode",
                        printer = targetPrinter,
                        portName = runtime.PortName,
                        dataType = runtime.DataType,
                        method = "gdi-layout",
                        errorCode = 0,
                        errorMessage = gdiError,
                        attemptTrace = "GDI_RECEIPT",
                        defaultPrinter = RawPrinterHelper.GetDefaultPrinterName(),
                        printers = list
                    });
                    return;
                }

                await Json(res, 200, new { success = true, printer = targetPrinter, portName = runtime.PortName, method = "gdi-layout", dataType = runtime.DataType });
                return;
            }

            var bytes = Encoding.GetEncoding(437).GetBytes(raw);
            var result = PrintBytes(targetPrinter, runtime, bytes);

            if (!result.Ok)
            {
                var list = PrinterSettings.InstalledPrinters.Cast<string>().ToList();
                await Json(res, 500, new
                {
                    message = "Failed sending raw bytes to printer",
                    printer = targetPrinter,
                    portName = runtime.PortName,
                    dataType = runtime.DataType,
                    method = result.Method,
                    errorCode = result.ErrorCode,
                    errorMessage = result.ErrorMessage,
                    attemptTrace = result.AttemptTrace,
                    defaultPrinter = RawPrinterHelper.GetDefaultPrinterName(),
                    printers = list
                });
                return;
            }

            await Json(res, 200, new { success = true, printer = targetPrinter, portName = runtime.PortName, method = result.Method, dataType = runtime.DataType });
            return;
        }

        await Json(ctx.Response, 404, new { message = "Not found" });
    }
    catch (Exception ex)
    {
        await Json(ctx.Response, 500, new { message = ex.Message });
    }
}

static PrintResult PrintBytes(string? printerName, AgentRuntimeState runtime, byte[] bytes)
{
    var traces = new List<string>();

    var portToUse = runtime.PortName;
    if (!string.IsNullOrWhiteSpace(portToUse))
    {
        var portOk = DirectPortWriter.Write(portToUse, bytes, out var portErr);
        if (portOk)
        {
            return new PrintResult(true, "direct-port", 0, string.Empty, string.Empty);
        }
        traces.Add($"[direct-port] {portErr}");
    }

    if (string.IsNullOrWhiteSpace(printerName))
    {
        return new PrintResult(false, "none", 0, "No printer name or port configured.", string.Join(" | ", traces));
    }

    var spoolerOk = RawPrinterHelper.SendBytesToPrinter(printerName, bytes, runtime.DataType, out var errCode, out var errMsg, out var spoolerTrace);
    if (spoolerOk)
    {
        return new PrintResult(true, "spooler", 0, string.Empty, string.Empty);
    }
    traces.Add($"[spooler] {spoolerTrace}");

    var gdiOk = GdiPrinter.Print(printerName, bytes, out var gdiErr);
    if (gdiOk)
    {
        return new PrintResult(true, "gdi-passthrough", 0, string.Empty, string.Empty);
    }
    traces.Add($"[gdi] {gdiErr}");

    return new PrintResult(false, "all-failed", errCode, errMsg, string.Join(" | ", traces));
}

static bool CheckToken(HttpListenerRequest req, AgentRuntimeState runtime, out string error)
{
    error = string.Empty;
    if (string.IsNullOrEmpty(runtime.Token)) return true;
    var incoming = req.Headers["x-print-agent-token"] ?? string.Empty;
    if (string.Equals(incoming, runtime.Token, StringComparison.Ordinal)) return true;
    error = "invalid print agent token";
    return false;
}

static string? ResolvePrinter(string? requested, AgentRuntimeState runtime)
{
    if (!string.IsNullOrWhiteSpace(requested)) return requested;
    if (!string.IsNullOrWhiteSpace(runtime.PrinterName)) return runtime.PrinterName;
    return RawPrinterHelper.GetDefaultPrinterName();
}

static string BuildTestReceipt()
{
    var sb = new StringBuilder();
    sb.AppendLine("NUMARS TEST PRINT");
    sb.AppendLine("------------------------");
    sb.AppendLine("Jika ini tercetak,");
    sb.AppendLine("koneksi OK!");
    sb.AppendLine();
    sb.AppendLine(DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss"));
    sb.AppendLine();
    sb.AppendLine();
    sb.AppendLine();
    sb.Append(''); sb.Append('@');
    sb.Append('\x1d'); sb.Append('V'); sb.Append('\x00');
    return sb.ToString();
}

static async Task Html(HttpListenerResponse res, int code, string html)
{
    res.StatusCode = code;
    res.ContentType = "text/html; charset=utf-8";
    var bytes = Encoding.UTF8.GetBytes(html);
    await res.OutputStream.WriteAsync(bytes);
    res.OutputStream.Close();
}

static string BuildUixHtml(AgentRuntimeState runtime)
{
    var escapedToken = WebUtility.HtmlEncode(runtime.Token);
    var escapedPrinter = WebUtility.HtmlEncode(runtime.PrinterName);
    var escapedDataType = WebUtility.HtmlEncode(runtime.DataType);
    var escapedPortName = WebUtility.HtmlEncode(runtime.PortName);

    return $$"""
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>NUMARS Print Agent UIX</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 24px; background: #111; color: #f2f2f2; }
    .card { max-width: 900px; border: 1px solid #333; border-radius: 12px; padding: 16px; background: #1a1a1a; }
    h1 { margin-top: 0; color: #d4af37; }
    h3 { color: #d4af37; }
    .grid { display: grid; gap: 10px; }
    label { display: grid; gap: 6px; font-size: 14px; }
    input, select, textarea { background: #0e0e0e; border: 1px solid #444; color: #fff; border-radius: 8px; padding: 10px; }
    button { margin-right: 8px; margin-top: 10px; border: 1px solid #555; border-radius: 8px; padding: 10px 14px; background: #262626; color: #fff; cursor: pointer; }
    button.primary { background: #d4af37; color: #111; border-color: #d4af37; font-weight: 600; }
    .hint { color: #bbb; font-size: 13px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; background: #d4af37; color: #111; margin-left: 8px; }
    pre { background: #0f0f0f; border: 1px solid #333; padding: 12px; border-radius: 8px; overflow: auto; }
  </style>
</head>
<body>
  <div class="card">
    <h1>NUMARS Print Agent UIX</h1>
    <p class="hint">Gunakan halaman ini untuk cek status, test print, dan ubah config agent.</p>

    <div class="grid">
      <label>Token (untuk test endpoint)
        <input id="token" value="{{escapedToken}}" />
      </label>
      <label>Printer Name (Windows printer name)
        <input id="printerName" value="{{escapedPrinter}}" placeholder="kosong = default printer" />
      </label>
      <label>Port Name (USB/COM langsung — bypass spooler) <span class="badge">BARU</span>
        <input id="portName" value="{{escapedPortName}}" placeholder="contoh: USB001 / COM3" />
      </label>
      <p class="hint">Jika error 1804, isi Port Name agar direct-port diprioritaskan.</p>
      <label>DataType
        <select id="dataType">
          <option value="AUTO">AUTO (recommended thermal)</option>
          <option value="AUTO_EXTENDED">AUTO_EXTENDED (RAW + EMF + TEXT)</option>
          <option value="GDI_RECEIPT">GDI_RECEIPT (browser-like layout)</option>
          <option value="RAW">RAW</option>
          <option value="TEXT">TEXT</option>
          <option value="NT EMF 1.008">NT EMF 1.008</option>
          <option value="NT EMF 1.007">NT EMF 1.007</option>
        </select>
      </label>
      <label>Host
        <input id="host" value="{{WebUtility.HtmlEncode(runtime.Host)}}" />
      </label>
      <label>Port (HTTP)
        <input id="port" value="{{WebUtility.HtmlEncode(runtime.Port)}}" />
      </label>
      <label><input type="checkbox" id="saveFile" /> Simpan ke agent-config.json</label>
    </div>

    <div>
      <button class="primary" onclick="saveConfig()">Simpan Config</button>
      <button onclick="checkStatus()">Cek Status</button>
      <button onclick="testPrint()">Test Print</button>
      <button onclick="loadPrinters()">Daftar Printer</button>
      <button onclick="loadPorts()">Daftar Port USB/COM</button>
    </div>

    <h3>Output</h3>
    <pre id="output">ready</pre>
  </div>

  <script>
    document.getElementById('dataType').value = '{{escapedDataType}}';

    const out = (obj) => {
      const text = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
      document.getElementById('output').textContent = text;
    };

    const headers = () => {
      const token = document.getElementById('token').value.trim();
      const h = { 'Content-Type': 'application/json' };
      if (token) h['x-print-agent-token'] = token;
      return h;
    };

    async function req(url, options = {}) {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw data;
      return data;
    }

    async function checkStatus() {
      try {
        const [health, cfg, printers, ports] = await Promise.all([
          req('/health', { headers: headers() }),
          req('/config', { headers: headers() }),
          req('/printers', { headers: headers() }),
          req('/ports', { headers: headers() })
        ]);
        out({ health, config: cfg, printers, ports });
      } catch (e) { out(e); }
    }

    async function loadPrinters() {
      try { out(await req('/printers', { headers: headers() })); } catch (e) { out(e); }
    }

    async function loadPorts() {
      try { out(await req('/ports', { headers: headers() })); } catch (e) { out(e); }
    }

    async function saveConfig() {
      try {
        const payload = {
          host: document.getElementById('host').value.trim(),
          port: document.getElementById('port').value.trim(),
          token: document.getElementById('token').value,
          printer_name: document.getElementById('printerName').value.trim(),
          port_name: document.getElementById('portName').value.trim(),
          data_type: document.getElementById('dataType').value,
          save_to_file: document.getElementById('saveFile').checked
        };
        out(await req('/config/update', { method: 'POST', headers: headers(), body: JSON.stringify(payload) }));
      } catch (e) { out(e); }
    }

    async function testPrint() {
      try {
        const payload = { printer_name: document.getElementById('printerName').value.trim() || null };
        out(await req('/print/test', { method: 'POST', headers: headers(), body: JSON.stringify(payload) }));
      } catch (e) { out(e); }
    }
  </script>
</body>
</html>
""";
}


static async Task Json(HttpListenerResponse res, int code, object data)
{
    res.StatusCode = code;
    res.ContentType = "application/json";
    var json = JsonSerializer.Serialize(data);
    var bytes = Encoding.UTF8.GetBytes(json);
    await res.OutputStream.WriteAsync(bytes);
    res.OutputStream.Close();
}

internal sealed record PrintResult(bool Ok, string Method, int ErrorCode, string ErrorMessage, string AttemptTrace);

internal sealed class PrintPayload
{
    public string? Printer_Name { get; set; }
    public ReceiptModel Receipt { get; set; } = new();
}

internal sealed class ReceiptModel
{
    public string? Title { get; set; }
    public string? Divider { get; set; }
    public int Order_Id { get; set; }
    public string? Created_At { get; set; }
    public string? Branch_Name { get; set; }
    public string? Branch_Address { get; set; }
    public string? Branch_Phone { get; set; }
    public string? Branch_Logo_Url { get; set; }
    public string? Cashier_Name { get; set; }
    public string? Room_Name { get; set; }
    public string? Therapist_Name { get; set; }
    public string? Payment_Method { get; set; }
    public decimal Payment_Amount { get; set; }
    public decimal Change_Amount { get; set; }
    public List<ReceiptItem> Items { get; set; } = new();
    public decimal Total { get; set; }
    public string? Printed_At { get; set; }
}

internal sealed class ReceiptItem
{
    public string? Service_Name { get; set; }
    public int Qty { get; set; }
    public decimal Subtotal { get; set; }
    public string? Therapist_Name { get; set; }
}

internal static class ReceiptBuilder
{
    // ESC/POS command helpers
    private static readonly byte[] ESC_INIT         = { 0x1B, 0x40 };           // ESC @ — initialize
    private static readonly byte[] ALIGN_CENTER      = { 0x1B, 0x61, 0x01 };    // ESC a 1
    private static readonly byte[] ALIGN_LEFT        = { 0x1B, 0x61, 0x00 };    // ESC a 0
    private static readonly byte[] ALIGN_RIGHT       = { 0x1B, 0x61, 0x02 };    // ESC a 2
    private static readonly byte[] BOLD_ON           = { 0x1B, 0x45, 0x01 };    // ESC E 1
    private static readonly byte[] BOLD_OFF          = { 0x1B, 0x45, 0x00 };    // ESC E 0
    private static readonly byte[] DOUBLE_SIZE_ON    = { 0x1B, 0x21, 0x30 };    // ESC ! 48 — double width + height
    private static readonly byte[] DOUBLE_SIZE_OFF   = { 0x1B, 0x21, 0x00 };    // ESC ! 0
    private static readonly byte[] DOUBLE_WIDTH_ON   = { 0x1B, 0x21, 0x20 };    // ESC ! 32 — double width only
    private static readonly byte[] UNDERLINE_ON      = { 0x1B, 0x2D, 0x01 };    // ESC - 1
    private static readonly byte[] UNDERLINE_OFF     = { 0x1B, 0x2D, 0x00 };    // ESC - 0
    private static readonly byte[] CUT               = { 0x1D, 0x56, 0x00 };    // GS V 0 — full cut
    private static readonly byte[] LF                = { 0x0A };                 // line feed

    public static byte[] BuildRawBytes(ReceiptModel receipt)
    {
        const int WIDTH = 32; // characters per line for 58mm printer
        var enc = Encoding.GetEncoding(437);
        using var ms = new MemoryStream();

        void Write(byte[] b)  => ms.Write(b, 0, b.Length);
        void WriteStr(string s) => ms.Write(enc.GetBytes(s), 0, enc.GetByteCount(s));
        void WriteLine(string s = "") { WriteStr(s); Write(LF); }
        void Divider(char c = '-') => WriteLine(new string(c, WIDTH));

        // ── Header ───────────────────────────────────────────────────────────
        Write(ESC_INIT);
        Write(ALIGN_CENTER);

        // Branch name — big and bold
        Write(BOLD_ON);
        Write(DOUBLE_WIDTH_ON);
        WriteLine(Center(receipt.Branch_Name ?? receipt.Title ?? "NUMARS POS", WIDTH / 2));
        Write(DOUBLE_SIZE_OFF);
        Write(BOLD_OFF);

        if (!string.IsNullOrWhiteSpace(receipt.Branch_Address))
            WriteLine(receipt.Branch_Address);
        if (!string.IsNullOrWhiteSpace(receipt.Branch_Phone))
            WriteLine($"Telp: {receipt.Branch_Phone}");

        Write(LF);
        Divider('=');

        // ── Order info ───────────────────────────────────────────────────────
        Write(ALIGN_LEFT);
        if (receipt.Order_Id > 0)
        {
            Write(BOLD_ON);
            WriteLine($"Order# : {receipt.Order_Id}");
            Write(BOLD_OFF);
        }
        if (!string.IsNullOrWhiteSpace(receipt.Created_At))
            WriteLine($"Tanggal: {receipt.Created_At}");
        if (!string.IsNullOrWhiteSpace(receipt.Cashier_Name))
            WriteLine($"Kasir  : {receipt.Cashier_Name}");
        if (!string.IsNullOrWhiteSpace(receipt.Therapist_Name))
            WriteLine($"Terapis: {receipt.Therapist_Name}");
        if (!string.IsNullOrWhiteSpace(receipt.Room_Name))
            WriteLine($"Room   : {receipt.Room_Name}");

        Divider('-');

        // ── Column header ────────────────────────────────────────────────────
        Write(BOLD_ON);
        WriteLine(PadRow("Layanan", "Subtotal", WIDTH));
        Write(BOLD_OFF);
        Divider('-');

        // ── Items ────────────────────────────────────────────────────────────
        foreach (var item in receipt.Items)
        {
            var name    = item.Service_Name ?? "-";
            var sub     = FormatRp(item.Subtotal);
            var qtyLine = $"  {item.Qty}x @ {FormatRp(item.Subtotal / (item.Qty > 0 ? item.Qty : 1))}";

            // service name left, subtotal right
            WriteLine(PadRow(Truncate(name, WIDTH - sub.Length - 1), sub, WIDTH));
            // qty detail indented
            WriteLine(qtyLine);

            if (!string.IsNullOrWhiteSpace(item.Therapist_Name))
                WriteLine($"  Terapis: {item.Therapist_Name}");
        }

        Divider('-');

        // ── Totals ───────────────────────────────────────────────────────────
        Write(ALIGN_LEFT);
        var payAmount = receipt.Payment_Amount > 0 ? receipt.Payment_Amount : receipt.Total;

        // TOTAL — bold + double width
        Write(BOLD_ON);
        WriteLine(PadRow("TOTAL", FormatRp(receipt.Total), WIDTH));
        Write(BOLD_OFF);

        WriteLine(PadRow("Bayar", FormatRp(payAmount), WIDTH));

        Write(BOLD_ON);
        WriteLine(PadRow("Kembali", FormatRp(receipt.Change_Amount), WIDTH));
        Write(BOLD_OFF);

        Write(LF);
        Write(ALIGN_LEFT);
        WriteLine($"Metode : {receipt.Payment_Method ?? "CASH"}");
        WriteLine($"Jam    : {receipt.Printed_At ?? DateTime.Now.ToString("dd/MM/yyyy HH:mm")}");

        Divider('=');

        // ── Footer ───────────────────────────────────────────────────────────
        Write(ALIGN_CENTER);
        Write(BOLD_ON);
        WriteLine("Terima kasih!");
        Write(BOLD_OFF);
        WriteLine("Semoga sehat selalu :)");
        Write(LF);
        Write(LF);
        Write(LF);

        // ── Cut ──────────────────────────────────────────────────────────────
        Write(CUT);

        return ms.ToArray();
    }

    // Keep old string-based method for compatibility
    public static string BuildRaw(ReceiptModel receipt)
        => Encoding.GetEncoding(437).GetString(BuildRawBytes(receipt));

    // ── Helpers ──────────────────────────────────────────────────────────────
    private static string FormatRp(decimal amount)
        => $"Rp{amount:N0}".Replace(',', '.');

    private static string Center(string text, int width)
    {
        if (text.Length >= width) return text;
        var pad = (width - text.Length) / 2;
        return text.PadLeft(text.Length + pad).PadRight(width);
    }

    private static string PadRow(string left, string right, int width)
    {
        var gap = width - left.Length - right.Length;
        if (gap <= 0) return (left + " " + right)[..Math.Min(width, left.Length + 1 + right.Length)];
        return left + new string(' ', gap) + right;
    }

    private static string Truncate(string s, int max)
        => s.Length <= max ? s : s[..(max - 1)] + "~";
}

internal static class GdiReceiptPrinter
{
    public static bool PrintReceipt(string printerName, ReceiptModel receipt, out string errorMessage)
    {
        errorMessage = string.Empty;
        try
        {
            using var doc = new PrintDocument();
            doc.PrinterSettings.PrinterName = printerName;
            if (!doc.PrinterSettings.IsValid)
            {
                errorMessage = $"Printer tidak valid: {printerName}";
                return false;
            }

            const float mmToHundredthInch = 3.93701f;
            var width = (int)Math.Round(58f * mmToHundredthInch);
            doc.DefaultPageSettings.PaperSize = new PaperSize("NUMARS58", width, 3500);
            doc.DefaultPageSettings.Margins   = new Margins(8, 8, 8, 8);

            doc.PrintPage += (sender, ev) =>
            {
                var g        = ev.Graphics!;
                var left     = (float)ev.MarginBounds.Left;
                var maxWidth = (float)ev.MarginBounds.Width;
                var y        = (float)ev.MarginBounds.Top;

                // ── Fonts ─────────────────────────────────────────────────────
                using var fAddr    = new Font("Arial",  7f,   FontStyle.Regular);
                using var fLabel   = new Font("Arial",  7.5f, FontStyle.Regular);
                using var fBold    = new Font("Arial",  7.5f, FontStyle.Bold);
                using var fTotal   = new Font("Arial",  9f,   FontStyle.Bold);
                using var fFooter  = new Font("Arial",  7.5f, FontStyle.Italic);

                using var sfC = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Near };
                using var sfL = new StringFormat { Alignment = StringAlignment.Near,   LineAlignment = StringAlignment.Near };
                using var sfR = new StringFormat { Alignment = StringAlignment.Far,    LineAlignment = StringAlignment.Near };

                using var penThin  = new Pen(Color.Black, 0.5f);
                using var penThick = new Pen(Color.Black, 1.5f);
                var brush = Brushes.Black;

                // helper: draw a left-right label/value row
                void LabelRow(string lbl, string val, Font f)
                {
                    g.DrawString(lbl, f, brush, new RectangleF(left,                    y, maxWidth * 0.42f, 13), sfL);
                    g.DrawString(val, f, brush, new RectangleF(left + maxWidth * 0.42f, y, maxWidth * 0.58f, 13), sfL);
                    y += 12;
                }

                // ── Brand header — auto-shrink font to fit single line ─────────
                var brandName = receipt.Branch_Name ?? receipt.Title ?? "NUMARS POS";
                var brandFontSize = 11f;
                Font fBrand;
                // Shrink font until brand name fits in one line
                while (true)
                {
                    fBrand = new Font("Arial", brandFontSize, FontStyle.Bold);
                    var measured = g.MeasureString(brandName, fBrand);
                    if (measured.Width <= maxWidth || brandFontSize <= 7f) break;
                    fBrand.Dispose();
                    brandFontSize -= 0.5f;
                }
                using (fBrand)
                {
                    var brandHeight = fBrand.GetHeight(g) + 2f;
                    g.DrawString(brandName, fBrand, brush, new RectangleF(left, y, maxWidth, brandHeight + 4), sfC);
                    y += brandHeight;
                }

                // Auto-shrink address/phone to always fit single line
                void SingleLine(string text, float startSize = 7f)
                {
                    var fs = startSize;
                    Font f;
                    while (true)
                    {
                        f = new Font("Arial", fs, FontStyle.Regular);
                        if (g.MeasureString(text, f).Width <= maxWidth || fs <= 5.5f) break;
                        f.Dispose(); fs -= 0.5f;
                    }
                    using (f)
                    {
                        g.DrawString(text, f, brush, new RectangleF(left, y, maxWidth, f.GetHeight(g) + 2), sfC);
                        y += f.GetHeight(g) + 1;
                    }
                }

                if (!string.IsNullOrWhiteSpace(receipt.Branch_Address))
                    SingleLine(receipt.Branch_Address);
                if (!string.IsNullOrWhiteSpace(receipt.Branch_Phone))
                    SingleLine($"Telp: {receipt.Branch_Phone}");

                y += 3;
                g.DrawLine(penThick, left, y, left + maxWidth, y); y += 6;

                // ── Order info ────────────────────────────────────────────────
                if (receipt.Order_Id > 0)          LabelRow("Order#", $"{receipt.Order_Id}",     fBold);
                if (!string.IsNullOrWhiteSpace(receipt.Created_At))      LabelRow("Tanggal",   receipt.Created_At,      fLabel);
                if (!string.IsNullOrWhiteSpace(receipt.Cashier_Name))    LabelRow("Kasir",     receipt.Cashier_Name,    fLabel);
                if (!string.IsNullOrWhiteSpace(receipt.Therapist_Name))  LabelRow("Terapis",   receipt.Therapist_Name,  fLabel);
                if (!string.IsNullOrWhiteSpace(receipt.Room_Name))       LabelRow("Room",      receipt.Room_Name,       fLabel);

                y += 3;
                g.DrawLine(penThin, left, y, left + maxWidth, y); y += 5;

                // ── Column headers ────────────────────────────────────────────
                g.DrawString("Layanan",  fBold, brush, new RectangleF(left,                    y, maxWidth * 0.50f, 13), sfL);
                g.DrawString("Qty",      fBold, brush, new RectangleF(left + maxWidth * 0.50f, y, maxWidth * 0.15f, 13), sfC);
                g.DrawString("Subtotal", fBold, brush, new RectangleF(left + maxWidth * 0.65f, y, maxWidth * 0.35f, 13), sfR);
                y += 13;
                g.DrawLine(penThin, left, y, left + maxWidth, y); y += 5;

                // ── Items ─────────────────────────────────────────────────────
                foreach (var item in receipt.Items)
                {
                    var sub = $"Rp{item.Subtotal:N0}".Replace(',', '.');
                    g.DrawString(item.Service_Name ?? "-", fLabel, brush, new RectangleF(left,                    y, maxWidth * 0.50f, 13), sfL);
                    g.DrawString($"{item.Qty}x",           fLabel, brush, new RectangleF(left + maxWidth * 0.50f, y, maxWidth * 0.15f, 13), sfC);
                    g.DrawString(sub,                      fLabel, brush, new RectangleF(left + maxWidth * 0.65f, y, maxWidth * 0.35f, 13), sfR);
                    y += 13;
                    if (!string.IsNullOrWhiteSpace(item.Therapist_Name))
                    { g.DrawString($"  ↳ {item.Therapist_Name}", fAddr, Brushes.DarkGray, new RectangleF(left, y, maxWidth, 12), sfL); y += 11; }
                }

                y += 4;
                g.DrawLine(penThick, left, y, left + maxWidth, y); y += 6;

                // ── TOTAL row — inverted (black bg, white text) ───────────────
                var payAmount = receipt.Payment_Amount > 0 ? receipt.Payment_Amount : receipt.Total;
                var totalStr  = $"Rp{receipt.Total:N0}".Replace(',', '.');
                g.FillRectangle(Brushes.Black, new RectangleF(left - 2, y - 1, maxWidth + 4, 18));
                g.DrawString("TOTAL",   fTotal, Brushes.White, new RectangleF(left,                    y, maxWidth * 0.5f, 17), sfL);
                g.DrawString(totalStr,  fTotal, Brushes.White, new RectangleF(left + maxWidth * 0.5f,  y, maxWidth * 0.5f, 17), sfR);
                y += 18; y += 4;

                LabelRow("Bayar",   $"Rp{payAmount:N0}".Replace(',', '.'),               fLabel);
                LabelRow("Kembali", $"Rp{receipt.Change_Amount:N0}".Replace(',', '.'),   fBold);

                y += 3;
                g.DrawLine(penThin, left, y, left + maxWidth, y); y += 5;

                LabelRow("Metode", receipt.Payment_Method ?? "CASH",                                          fLabel);
                LabelRow("Jam",    receipt.Printed_At ?? DateTime.Now.ToString("dd/MM/yyyy HH:mm"),           fLabel);

                y += 5;
                g.DrawLine(penThin, left, y, left + maxWidth, y); y += 8;

                // ── Footer ────────────────────────────────────────────────────
                g.DrawString("Terima kasih atas kunjungan Anda!", fFooter, brush, new RectangleF(left, y, maxWidth, 13), sfC); y += 12;
                g.DrawString("Semoga sehat selalu :)",            fFooter, brush, new RectangleF(left, y, maxWidth, 13), sfC);

                ev.HasMorePages = false;
            };

            doc.Print();
            return true;
        }
        catch (Exception ex)
        {
            errorMessage = ex.Message;
            return false;
        }
    }
}

internal static class GdiPrinter
{
    [DllImport("gdi32.dll")] private static extern int Escape(IntPtr hdc, int nEscape, int cbInput, byte[] lpvInData, IntPtr lpvOutData);
    private const int PASSTHROUGH = 19;

    public static bool Print(string printerName, byte[] data, out string errorMessage)
    {
        errorMessage = string.Empty;
        try
        {
            var buffer = new byte[2 + data.Length];
            buffer[0] = (byte)(data.Length & 0xFF);
            buffer[1] = (byte)((data.Length >> 8) & 0xFF);
            Array.Copy(data, 0, buffer, 2, data.Length);

            var printed = false;
            var pd = new PrintDocument();
            pd.PrinterSettings.PrinterName = printerName;
            if (!pd.PrinterSettings.IsValid)
            {
                errorMessage = $"Printer '{printerName}' is not valid/available.";
                return false;
            }

            pd.PrintPage += (sender, e) =>
            {
                try
                {
                    if (e.Graphics == null) return;
                    var hdc = e.Graphics.GetHdc();
                    try
                    {
                        var result = Escape(hdc, PASSTHROUGH, buffer.Length, buffer, IntPtr.Zero);
                        if (result > 0) printed = true;
                    }
                    finally
                    {
                        e.Graphics.ReleaseHdc(hdc);
                    }
                }
                finally
                {
                    e.HasMorePages = false;
                }
            };

            pd.Print();
            return printed || string.IsNullOrEmpty(errorMessage);
        }
        catch (Exception ex)
        {
            errorMessage = $"GDI print exception: {ex.Message}";
            return false;
        }
    }
}

internal static class DirectPortWriter
{
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern IntPtr CreateFile(string lpFileName, uint dwDesiredAccess, uint dwShareMode, IntPtr lpSecurityAttributes, uint dwCreationDisposition, uint dwFlagsAndAttributes, IntPtr hTemplateFile);
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool WriteFile(IntPtr hFile, byte[] lpBuffer, uint nNumberOfBytesToWrite, out uint lpNumberOfBytesWritten, IntPtr lpOverlapped);
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool CloseHandle(IntPtr hObject);

    private const uint GENERIC_WRITE = 0x40000000;
    private const uint FILE_SHARE_READ = 0x00000001;
    private const uint OPEN_EXISTING = 3;
    private const uint FILE_ATTRIBUTE_NORMAL = 0x80;
    private static readonly IntPtr INVALID_HANDLE_VALUE = new(-1);

    public static bool Write(string portName, byte[] data, out string errorMessage)
    {
        errorMessage = string.Empty;
        var devicePath = portName.StartsWith(@"\\.\") ? portName : $@"\\.\{portName}";
        var handle = CreateFile(devicePath, GENERIC_WRITE, FILE_SHARE_READ, IntPtr.Zero, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, IntPtr.Zero);

        if (handle == INVALID_HANDLE_VALUE)
        {
            var code = Marshal.GetLastWin32Error();
            errorMessage = $"CreateFile({devicePath}) failed: {new Win32Exception(code).Message} (code {code})";
            return false;
        }

        try
        {
            var ok = WriteFile(handle, data, (uint)data.Length, out _, IntPtr.Zero);
            if (!ok)
            {
                var code = Marshal.GetLastWin32Error();
                errorMessage = $"WriteFile({devicePath}) failed: {new Win32Exception(code).Message} (code {code})";
                return false;
            }
            return true;
        }
        finally
        {
            CloseHandle(handle);
        }
    }

    public static List<PortInfo> ListAvailablePorts()
    {
        var result = new List<PortInfo>();

        for (int i = 1; i <= 9; i++)
        {
            var name = $"USB00{i}";
            var device = $@"\\.\{name}";
            var handle = CreateFile(device, GENERIC_WRITE, FILE_SHARE_READ, IntPtr.Zero, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, IntPtr.Zero);
            if (handle != INVALID_HANDLE_VALUE)
            {
                CloseHandle(handle);
                result.Add(new PortInfo(name, device, "USB printer port"));
            }
        }

        for (int i = 1; i <= 20; i++)
        {
            var name = $"COM{i}";
            var device = $@"\\.\{name}";
            var handle = CreateFile(device, GENERIC_WRITE, FILE_SHARE_READ, IntPtr.Zero, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, IntPtr.Zero);
            if (handle != INVALID_HANDLE_VALUE)
            {
                CloseHandle(handle);
                result.Add(new PortInfo(name, device, "COM/Serial port"));
            }
        }

        try
        {
            var printers = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Control\Print\Printers");
            if (printers != null)
            {
                foreach (var printerKey in printers.GetSubKeyNames())
                {
                    var sub = printers.OpenSubKey(printerKey);
                    var port = sub?.GetValue("Port") as string;
                    if (!string.IsNullOrWhiteSpace(port) && !result.Any(r => r.Name.Equals(port, StringComparison.OrdinalIgnoreCase)))
                    {
                        result.Add(new PortInfo(port, $@"\\.\{port}", $"Port of printer: {printerKey}"));
                    }
                }
            }
        }
        catch { }

        return result;
    }

    public sealed record PortInfo(string Name, string DevicePath, string Description);
}

internal sealed class AgentConfig
{
    public string? Host { get; set; }
    public string? Port { get; set; }
    public string? Token { get; set; }
    public string? PrinterName { get; set; }
    public string? DataType { get; set; }
    public string? PortName { get; set; }
    public string? ConfigPath { get; set; }

    public static AgentConfig Load()
    {
        var candidates = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "agent-config.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "agent-config.json")
        }.Distinct().ToArray();

        foreach (var path in candidates)
        {
            if (!File.Exists(path)) continue;

            try
            {
                var json = File.ReadAllText(path);
                var cfg = JsonSerializer.Deserialize<AgentConfig>(json, JsonOptions.Default) ?? new AgentConfig();
                cfg.ConfigPath = path;
                return cfg;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WARN] gagal parse config: {path}");
                Console.WriteLine($"[WARN] {ex.Message}");
                return new AgentConfig();
            }
        }

        return new AgentConfig();
    }
}

internal sealed class AgentConfigUpdate
{
    public string? Host { get; set; }
    public string? Port { get; set; }
    public string? Token { get; set; }
    public string? Printer_Name { get; set; }
    public string? Data_Type { get; set; }
    public string? Port_Name { get; set; }
    public bool Save_To_File { get; set; }
}

internal sealed class AgentRuntimeState
{
    private readonly object _sync = new();

    public AgentRuntimeState(string host, string port, string token, string printerName, string dataType, string portName, string? configPath)
    {
        Host = host;
        Port = port;
        Token = token;
        PrinterName = printerName;
        DataType = string.IsNullOrWhiteSpace(dataType) ? "AUTO" : dataType.Trim().ToUpperInvariant();
        PortName = portName.Trim();
        ConfigPath = string.IsNullOrWhiteSpace(configPath)
            ? Path.Combine(AppContext.BaseDirectory, "agent-config.json")
            : configPath;
    }

    public string Host { get; private set; }
    public string Port { get; private set; }
    public string Token { get; private set; }
    public string PrinterName { get; private set; }
    public string DataType { get; private set; }
    public string PortName { get; private set; }
    public string ConfigPath { get; }

    public object GetPublicConfig()
    {
        lock (_sync)
        {
            return new
            {
                ok = true,
                host = Host,
                port = Port,
                token = Token,
                printer_name = PrinterName,
                data_type = DataType,
                port_name = PortName,
                config_path = ConfigPath
            };
        }
    }

    public object Update(AgentConfigUpdate payload)
    {
        lock (_sync)
        {
            if (payload.Host is not null) Host = payload.Host.Trim();
            if (payload.Port is not null) Port = payload.Port.Trim();
            if (payload.Token is not null) Token = payload.Token.Trim();
            if (payload.Printer_Name is not null) PrinterName = payload.Printer_Name.Trim();
            if (payload.Data_Type is not null) DataType = payload.Data_Type.Trim().ToUpperInvariant();
            if (payload.Port_Name is not null) PortName = payload.Port_Name.Trim();

            return new
            {
                host = Host,
                port = Port,
                token = Token,
                printer_name = PrinterName,
                data_type = DataType,
                port_name = PortName,
                config_path = ConfigPath
            };
        }
    }

    public bool SaveToConfigFile()
    {
        lock (_sync)
        {
            try
            {
                var dir = Path.GetDirectoryName(ConfigPath);
                if (!string.IsNullOrWhiteSpace(dir) && !Directory.Exists(dir))
                {
                    Directory.CreateDirectory(dir);
                }

                var cfg = new
                {
                    host = Host,
                    port = Port,
                    token = Token,
                    printerName = PrinterName,
                    dataType = DataType,
                    portName = PortName
                };
                var json = JsonSerializer.Serialize(cfg, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(ConfigPath, json);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WARN] gagal simpan config file: {ex.Message}");
                return false;
            }
        }
    }
}

internal static class JsonOptions
{
    public static readonly JsonSerializerOptions Default = new()
    {
        PropertyNameCaseInsensitive = true
    };
}

internal static class RawPrinterHelper
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private class DOCINFO
    {
        [MarshalAs(UnmanagedType.LPWStr)] public string pDocName = "NUMARS POS";
        [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile = string.Empty;
        [MarshalAs(UnmanagedType.LPWStr)] public string pDataType = "RAW";
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool OpenPrinter(string src, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", SetLastError = true)]
    private static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", SetLastError = true)]
    private static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In] DOCINFO di);

    [DllImport("winspool.Drv", SetLastError = true)]
    private static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", SetLastError = true)]
    private static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", SetLastError = true)]
    private static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", SetLastError = true)]
    private static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    [DllImport("winspool.Drv", CharSet = CharSet.Unicode)]
    private static extern bool GetDefaultPrinter(StringBuilder pszBuffer, ref int pcchBuffer);

    public static string GetDefaultPrinterName()
    {
        var size = 0;
        GetDefaultPrinter(new StringBuilder(), ref size);
        if (size <= 0) return string.Empty;

        var sb = new StringBuilder(size);
        return GetDefaultPrinter(sb, ref size) ? sb.ToString() : string.Empty;
    }

    public static bool SendBytesToPrinter(string printerName, byte[] data, string preferredDataType, out int errorCode, out string errorMessage, out string attemptTrace)
    {
        errorCode = 0;
        errorMessage = string.Empty;
        attemptTrace = string.Empty;

        IntPtr pUnmanagedBytes = IntPtr.Zero;
        IntPtr hPrinter = IntPtr.Zero;

        var dataWithFF = new byte[data.Length + 1];
        Array.Copy(data, dataWithFF, data.Length);
        dataWithFF[data.Length] = 0x0C;

        try
        {
            if (!OpenPrinter(printerName, out hPrinter, IntPtr.Zero))
            {
                errorCode = Marshal.GetLastWin32Error();
                errorMessage = new Win32Exception(errorCode).Message;
                return false;
            }

            var dataTypes = BuildDataTypeAttempts(preferredDataType);
            var traces = new List<string>();

            foreach (var attempt in dataTypes)
            {
                var di = new DOCINFO { pDataType = attempt.DataType };
                if (!StartDocPrinter(hPrinter, 1, di))
                {
                    errorCode = Marshal.GetLastWin32Error();
                    errorMessage = $"StartDocPrinter({attempt.DataType}) failed: {new Win32Exception(errorCode).Message}";
                    traces.Add($"{attempt.Label}: {errorMessage} (code {errorCode})");
                    if (errorCode == 1804) continue;
                    attemptTrace = string.Join(" | ", traces);
                    return false;
                }

                if (!StartPagePrinter(hPrinter))
                {
                    errorCode = Marshal.GetLastWin32Error();
                    errorMessage = new Win32Exception(errorCode).Message;
                    EndDocPrinter(hPrinter);
                    return false;
                }

                var bytesToWrite = attempt.AppendFormFeed ? dataWithFF : data;
                pUnmanagedBytes = Marshal.AllocCoTaskMem(bytesToWrite.Length);
                Marshal.Copy(bytesToWrite, 0, pUnmanagedBytes, bytesToWrite.Length);

                var ok = WritePrinter(hPrinter, pUnmanagedBytes, bytesToWrite.Length, out _);
                EndPagePrinter(hPrinter);
                EndDocPrinter(hPrinter);

                if (ok) return true;

                errorCode = Marshal.GetLastWin32Error();
                errorMessage = $"WritePrinter({attempt.Label}) failed: {new Win32Exception(errorCode).Message}";
                traces.Add($"{attempt.Label}: {errorMessage} (code {errorCode})");
            }

            attemptTrace = string.Join(" | ", traces);
            return false;
        }
        finally
        {
            if (pUnmanagedBytes != IntPtr.Zero) Marshal.FreeCoTaskMem(pUnmanagedBytes);
            if (hPrinter != IntPtr.Zero) ClosePrinter(hPrinter);
        }
    }

    public static bool SendStringToPrinter(string printerName, string data, string preferredDataType, out int errorCode, out string errorMessage, out string attemptTrace)
    {
        var bytes = Encoding.GetEncoding(437).GetBytes(data);
        return SendBytesToPrinter(printerName, bytes, preferredDataType, out errorCode, out errorMessage, out attemptTrace);
    }

    private static List<DataTypeAttempt> BuildDataTypeAttempts(string preferredDataType)
    {
        var normalized = string.IsNullOrWhiteSpace(preferredDataType)
            ? "AUTO"
            : preferredDataType.Trim().ToUpperInvariant();

        if (normalized == "AUTO")
        {
            // Default AUTO is optimized for thermal printer compatibility.
            return new List<DataTypeAttempt>
            {
                new("RAW", "RAW", AppendFormFeed: false),
                new("RAW", "RAW + FF", AppendFormFeed: true)
            };
        }

        if (normalized == "AUTO_EXTENDED" || normalized == "AUTO-EXTENDED")
        {
            // Extended fallback for non-thermal printers.
            return new List<DataTypeAttempt>
            {
                new("RAW", "RAW", AppendFormFeed: false),
                new("RAW", "RAW + FF", AppendFormFeed: true),
                new("NT EMF 1.008", "NT EMF 1.008", AppendFormFeed: false),
                new("NT EMF 1.007", "NT EMF 1.007", AppendFormFeed: false),
                new("TEXT", "TEXT", AppendFormFeed: false)
            };
        }

        if (normalized == "RAW")
        {
            return new List<DataTypeAttempt>
            {
                new("RAW", "RAW", AppendFormFeed: false),
                new("RAW", "RAW + FF", AppendFormFeed: true)
            };
        }

        return new List<DataTypeAttempt> { new(normalized, normalized, AppendFormFeed: false) };
    }

    private sealed record DataTypeAttempt(string DataType, string Label, bool AppendFormFeed);
}
