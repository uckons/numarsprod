using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;

var config = AgentConfig.Load();

var host = Environment.GetEnvironmentVariable("PRINT_AGENT_HOST") ?? config.Host ?? "localhost";
var port = Environment.GetEnvironmentVariable("PRINT_AGENT_PORT") ?? config.Port ?? "19000";
var token = Environment.GetEnvironmentVariable("PRINT_AGENT_TOKEN") ?? config.Token ?? string.Empty;
var printerName = Environment.GetEnvironmentVariable("PRINT_AGENT_PRINTER") ?? config.PrinterName ?? string.Empty;

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
Console.WriteLine(string.IsNullOrWhiteSpace(printerName)
    ? "[windows-dotnet-print-agent] printer: default windows printer"
    : $"[windows-dotnet-print-agent] printer: {printerName}");

while (true)
{
    var ctx = await listener.GetContextAsync();
    _ = Task.Run(() => HandleRequest(ctx, token, printerName));
}

static async Task HandleRequest(HttpListenerContext ctx, string token, string printerName)
{
    try
    {
        var req = ctx.Request;
        var res = ctx.Response;

        if (req.HttpMethod == "GET" && req.Url?.AbsolutePath == "/")
        {
            await Json(res, 200, new { ok = true, service = "windows-dotnet-print-agent", hint = "use POST /print/receipt" });
            return;
        }

        if (req.HttpMethod == "GET" && req.Url?.AbsolutePath == "/health")
        {
            await Json(res, 200, new { ok = true, service = "windows-dotnet-print-agent" });
            return;
        }

        if (req.HttpMethod == "POST" && req.Url?.AbsolutePath == "/print/receipt")
        {
            if (!string.IsNullOrEmpty(token))
            {
                var incoming = req.Headers["x-print-agent-token"] ?? string.Empty;
                if (!string.Equals(incoming, token, StringComparison.Ordinal))
                {
                    await Json(res, 401, new { message = "invalid print agent token" });
                    return;
                }
            }

            using var reader = new StreamReader(req.InputStream, req.ContentEncoding ?? Encoding.UTF8);
            var body = await reader.ReadToEndAsync();
            var payload = JsonSerializer.Deserialize<PrintPayload>(body, JsonOptions.Default) ?? new PrintPayload();

            var raw = ReceiptBuilder.BuildRaw(payload.Receipt);
            var targetPrinter = string.IsNullOrWhiteSpace(printerName) ? RawPrinterHelper.GetDefaultPrinterName() : printerName;

            if (string.IsNullOrWhiteSpace(targetPrinter))
            {
                await Json(res, 500, new { message = "No printer found. Set PRINT_AGENT_PRINTER or set default printer in Windows." });
                return;
            }

            var ok = RawPrinterHelper.SendStringToPrinter(targetPrinter, raw);
            if (!ok)
            {
                await Json(res, 500, new { message = "Failed sending raw bytes to printer" });
                return;
            }

            await Json(res, 200, new { success = true, printer = targetPrinter });
            return;
        }

        await Json(ctx.Response, 404, new { message = "Not found" });
    }
    catch (Exception ex)
    {
        await Json(ctx.Response, 500, new { message = ex.Message });
    }
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

    public static AgentConfig Load()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "agent-config.json");
        if (!File.Exists(path)) return new AgentConfig();

        try
        {
            var json = File.ReadAllText(path);
            return JsonSerializer.Deserialize<AgentConfig>(json, JsonOptions.Default) ?? new AgentConfig();
        }
        catch
        {
            return new AgentConfig();
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
    private class DOCINFOA
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
    private static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In] DOCINFOA di);

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

    public static bool SendStringToPrinter(string printerName, string data)
    {
        var bytes = Encoding.GetEncoding(437).GetBytes(data);
        IntPtr pUnmanagedBytes = IntPtr.Zero;
        IntPtr hPrinter = IntPtr.Zero;

        try
        {
            if (!OpenPrinter(printerName, out hPrinter, IntPtr.Zero)) return false;
            var di = new DOCINFOA();
            if (!StartDocPrinter(hPrinter, 1, di)) return false;
            if (!StartPagePrinter(hPrinter)) return false;

            pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
            Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);

            var ok = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out _);
            EndPagePrinter(hPrinter);
            EndDocPrinter(hPrinter);
            return ok;
        }
        finally
        {
            if (pUnmanagedBytes != IntPtr.Zero) Marshal.FreeCoTaskMem(pUnmanagedBytes);
            if (hPrinter != IntPtr.Zero) ClosePrinter(hPrinter);
        }
    }
}
