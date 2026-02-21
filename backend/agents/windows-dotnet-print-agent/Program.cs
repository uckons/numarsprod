using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.ComponentModel;
using System.Drawing.Printing;

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
var runtime = new AgentRuntimeState(host, port, token, printerName, dataType, config.ConfigPath);

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
            await Json(res, 200, new { ok = true, service = "windows-dotnet-print-agent", hint = "use POST /print/receipt", dataType = runtime.DataType, uix = "/uix" });
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
            if (!string.IsNullOrEmpty(runtime.Token))
            {
                var incoming = req.Headers["x-print-agent-token"] ?? string.Empty;
                if (!string.Equals(incoming, runtime.Token, StringComparison.Ordinal))
                {
                    await Json(res, 401, new { message = "invalid print agent token" });
                    return;
                }
            }

            using var reader = new StreamReader(req.InputStream, req.ContentEncoding ?? Encoding.UTF8);
            var body = await reader.ReadToEndAsync();
            var payload = JsonSerializer.Deserialize<PrintPayload>(body, JsonOptions.Default) ?? new PrintPayload();

            var targetPrinter = !string.IsNullOrWhiteSpace(payload.Printer_Name)
                ? payload.Printer_Name
                : (string.IsNullOrWhiteSpace(runtime.PrinterName) ? RawPrinterHelper.GetDefaultPrinterName() : runtime.PrinterName);

            if (string.IsNullOrWhiteSpace(targetPrinter))
            {
                await Json(res, 500, new { message = "No printer found. Set PRINT_AGENT_PRINTER or set default printer in Windows." });
                return;
            }

            var testRaw = "NUMARS TEST PRINT\n------------------------\nJika ini tercetak, koneksi VPS -> agent -> printer OK.\n\n\x1dV\x00";
            var ok = RawPrinterHelper.SendStringToPrinter(targetPrinter, testRaw, runtime.DataType, out var errCode, out var errMessage, out var attemptTrace);
            if (!ok)
            {
                var list = PrinterSettings.InstalledPrinters.Cast<string>().ToList();
                await Json(res, 500, new
                {
                    message = "Failed sending raw bytes to printer",
                    printer = targetPrinter,
                    dataType = runtime.DataType,
                    errorCode = errCode,
                    errorMessage = errMessage,
                    attemptTrace,
                    defaultPrinter = RawPrinterHelper.GetDefaultPrinterName(),
                    printers = list
                });
                return;
            }

            await Json(res, 200, new { success = true, printer = targetPrinter, mode = "test-print", dataType = runtime.DataType });
            return;
        }

        if (req.HttpMethod == "POST" && path == "/print/receipt")
        {
            if (!string.IsNullOrEmpty(runtime.Token))
            {
                var incoming = req.Headers["x-print-agent-token"] ?? string.Empty;
                if (!string.Equals(incoming, runtime.Token, StringComparison.Ordinal))
                {
                    await Json(res, 401, new { message = "invalid print agent token" });
                    return;
                }
            }

            using var reader = new StreamReader(req.InputStream, req.ContentEncoding ?? Encoding.UTF8);
            var body = await reader.ReadToEndAsync();
            var payload = JsonSerializer.Deserialize<PrintPayload>(body, JsonOptions.Default) ?? new PrintPayload();

            var raw = ReceiptBuilder.BuildRaw(payload.Receipt);
            var requestedPrinter = payload.Printer_Name;
            var targetPrinter = !string.IsNullOrWhiteSpace(requestedPrinter)
                ? requestedPrinter
                : (string.IsNullOrWhiteSpace(runtime.PrinterName) ? RawPrinterHelper.GetDefaultPrinterName() : runtime.PrinterName);

            if (string.IsNullOrWhiteSpace(targetPrinter))
            {
                await Json(res, 500, new { message = "No printer found. Set PRINT_AGENT_PRINTER or set default printer in Windows." });
                return;
            }

            var ok = RawPrinterHelper.SendStringToPrinter(targetPrinter, raw, runtime.DataType, out var errCode, out var errMessage, out var attemptTrace);
            if (!ok)
            {
                var list = PrinterSettings.InstalledPrinters.Cast<string>().ToList();
                await Json(res, 500, new
                {
                    message = "Failed sending raw bytes to printer",
                    printer = targetPrinter,
                    dataType = runtime.DataType,
                    errorCode = errCode,
                    errorMessage = errMessage,
                    attemptTrace,
                    defaultPrinter = RawPrinterHelper.GetDefaultPrinterName(),
                    printers = list
                });
                return;
            }

            await Json(res, 200, new { success = true, printer = targetPrinter, dataType = runtime.DataType });
            return;
        }

        await Json(ctx.Response, 404, new { message = "Not found" });
    }
    catch (Exception ex)
    {
        await Json(ctx.Response, 500, new { message = ex.Message });
    }
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

    return $$"""
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>NUMARS Print Agent UIX</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 24px; background: #111; color: #f2f2f2; }
    .card { max-width: 860px; border: 1px solid #333; border-radius: 12px; padding: 16px; background: #1a1a1a; }
    h1 { margin-top: 0; color: #d4af37; }
    .grid { display: grid; gap: 10px; }
    label { display: grid; gap: 6px; font-size: 14px; }
    input, select, textarea { background: #0e0e0e; border: 1px solid #444; color: #fff; border-radius: 8px; padding: 10px; }
    button { margin-right: 8px; margin-top: 10px; border: 1px solid #555; border-radius: 8px; padding: 10px 14px; background: #262626; color: #fff; cursor: pointer; }
    button.primary { background: #d4af37; color: #111; border-color: #d4af37; font-weight: 600; }
    pre { background: #0f0f0f; border: 1px solid #333; padding: 12px; border-radius: 8px; overflow: auto; }
    .hint { color: #bbb; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>NUMARS Print Agent UIX</h1>
    <p class="hint">Gunakan halaman ini untuk cek status, test print, dan ubah config agent (runtime + optional simpan file).</p>

    <div class="grid">
      <label>Token (untuk test endpoint)
        <input id="token" value="{{escapedToken}}" />
      </label>
      <label>Printer Name
        <input id="printerName" value="{{escapedPrinter}}" placeholder="kosong = default printer" />
      </label>
      <label>DataType
        <select id="dataType">
          <option value="AUTO">AUTO (recommended thermal)</option>
          <option value="AUTO_EXTENDED">AUTO_EXTENDED (RAW + EMF + TEXT)</option>
          <option value="RAW">RAW</option>
          <option value="TEXT">TEXT</option>
          <option value="NT EMF 1.008">NT EMF 1.008</option>
          <option value="NT EMF 1.007">NT EMF 1.007</option>
        </select>
      </label>
      <label>Host
        <input id="host" value="{{WebUtility.HtmlEncode(runtime.Host)}}" />
      </label>
      <label>Port
        <input id="port" value="{{WebUtility.HtmlEncode(runtime.Port)}}" />
      </label>
      <label><input type="checkbox" id="saveFile" /> Simpan ke agent-config.json</label>
    </div>

    <div>
      <button class="primary" onclick="saveConfig()">Simpan Config</button>
      <button onclick="checkStatus()">Cek Status</button>
      <button onclick="testPrint()">Test Print</button>
      <button onclick="loadPrinters()">Refresh Printers</button>
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
        const [health, cfg, printers] = await Promise.all([
          req('/health', { headers: headers() }),
          req('/config', { headers: headers() }),
          req('/printers', { headers: headers() })
        ]);
        out({ health, config: cfg, printers });
      } catch (e) { out(e); }
    }

    async function loadPrinters() {
      try {
        const data = await req('/printers', { headers: headers() });
        out(data);
      } catch (e) { out(e); }
    }

    async function saveConfig() {
      try {
        const payload = {
          host: document.getElementById('host').value.trim(),
          port: document.getElementById('port').value.trim(),
          token: document.getElementById('token').value,
          printer_name: document.getElementById('printerName').value.trim(),
          data_type: document.getElementById('dataType').value,
          save_to_file: document.getElementById('saveFile').checked
        };
        const data = await req('/config/update', { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
        out(data);
      } catch (e) { out(e); }
    }

    async function testPrint() {
      try {
        const payload = { printer_name: document.getElementById('printerName').value.trim() || null };
        const data = await req('/print/test', { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
        out(data);
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

internal sealed class PrintPayload
{
    public string? Printer_Name { get; set; }
    public ReceiptModel Receipt { get; set; } = new();
}

internal sealed class ReceiptModel
{
    public string? Title { get; set; }
    public string? Divider { get; set; }
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
    public static string BuildRaw(ReceiptModel receipt)
    {
        var sb = new StringBuilder();
        sb.AppendLine(receipt.Title ?? "NUMARS POS");
        sb.AppendLine(receipt.Divider ?? "------------------------");

        foreach (var i in receipt.Items)
        {
            sb.AppendLine($"{i.Service_Name} x{i.Qty}");
            if (!string.IsNullOrWhiteSpace(i.Therapist_Name))
                sb.AppendLine($"  Terapis: {i.Therapist_Name}");
            sb.AppendLine($"Rp {i.Subtotal:N0}".Replace(',', '.'));
        }

        sb.AppendLine(receipt.Divider ?? "------------------------");
        sb.AppendLine($"TOTAL : Rp {receipt.Total:N0}".Replace(',', '.'));
        sb.AppendLine();
        sb.AppendLine(receipt.Printed_At ?? DateTime.Now.ToString("dd/MM/yyyy HH:mm"));

        // GS V 0 (full cut)
        sb.Append('\x1d');
        sb.Append('V');
        sb.Append('\x00');

        return sb.ToString();
    }
}

internal sealed class AgentConfig
{
    public string? Host { get; set; }
    public string? Port { get; set; }
    public string? Token { get; set; }
    public string? PrinterName { get; set; }
    public string? DataType { get; set; }
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
    public bool Save_To_File { get; set; }
}

internal sealed class AgentRuntimeState
{
    private readonly object _sync = new();

    public AgentRuntimeState(string host, string port, string token, string printerName, string dataType, string? configPath)
    {
        Host = host;
        Port = port;
        Token = token;
        PrinterName = printerName;
        DataType = string.IsNullOrWhiteSpace(dataType) ? "AUTO" : dataType.Trim().ToUpperInvariant();
        ConfigPath = string.IsNullOrWhiteSpace(configPath)
            ? Path.Combine(AppContext.BaseDirectory, "agent-config.json")
            : configPath;
    }

    public string Host { get; private set; }
    public string Port { get; private set; }
    public string Token { get; private set; }
    public string PrinterName { get; private set; }
    public string DataType { get; private set; }
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

            return new
            {
                host = Host,
                port = Port,
                token = Token,
                printer_name = PrinterName,
                data_type = DataType,
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
                    dataType = DataType
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

    public static bool SendStringToPrinter(string printerName, string data, string preferredDataType, out int errorCode, out string errorMessage, out string attemptTrace)
    {
        errorCode = 0;
        errorMessage = string.Empty;
        attemptTrace = string.Empty;

        var bytes = Encoding.GetEncoding(437).GetBytes(data);
        var bytesWithFormFeed = Encoding.GetEncoding(437).GetBytes(data + "\f");
        IntPtr pUnmanagedBytes = IntPtr.Zero;
        IntPtr hPrinter = IntPtr.Zero;

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

                var bytesToWrite = attempt.AppendFormFeed ? bytesWithFormFeed : bytes;
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
