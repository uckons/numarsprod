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
Console.WriteLine($"[windows-dotnet-print-agent] datatype: {dataType}");

while (true)
{
    var ctx = await listener.GetContextAsync();
    _ = Task.Run(() => HandleRequest(ctx, token, printerName, dataType));
}

static async Task HandleRequest(HttpListenerContext ctx, string token, string printerName, string dataType)
{
    try
    {
        var req = ctx.Request;
        var res = ctx.Response;

        if (req.HttpMethod == "GET" && req.Url?.AbsolutePath == "/")
        {
            await Json(res, 200, new { ok = true, service = "windows-dotnet-print-agent", hint = "use POST /print/receipt", dataType });
            return;
        }

        if (req.HttpMethod == "GET" && req.Url?.AbsolutePath == "/health")
        {
            await Json(res, 200, new { ok = true, service = "windows-dotnet-print-agent", dataType });
            return;
        }

        if (req.HttpMethod == "GET" && req.Url?.AbsolutePath == "/printers")
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


        if (req.HttpMethod == "POST" && req.Url?.AbsolutePath == "/print/test")
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

            var targetPrinter = !string.IsNullOrWhiteSpace(payload.Printer_Name)
                ? payload.Printer_Name
                : (string.IsNullOrWhiteSpace(printerName) ? RawPrinterHelper.GetDefaultPrinterName() : printerName);

            if (string.IsNullOrWhiteSpace(targetPrinter))
            {
                await Json(res, 500, new { message = "No printer found. Set PRINT_AGENT_PRINTER or set default printer in Windows." });
                return;
            }

            var testRaw = "NUMARS TEST PRINT\n------------------------\nJika ini tercetak, koneksi VPS -> agent -> printer OK.\n\n\x1dV\x00";
            var ok = RawPrinterHelper.SendStringToPrinter(targetPrinter, testRaw, dataType, out var errCode, out var errMessage);
            if (!ok)
            {
                var list = PrinterSettings.InstalledPrinters.Cast<string>().ToList();
                await Json(res, 500, new
                {
                    message = "Failed sending raw bytes to printer",
                    printer = targetPrinter,
                    dataType,
                    errorCode = errCode,
                    errorMessage = errMessage,
                    defaultPrinter = RawPrinterHelper.GetDefaultPrinterName(),
                    printers = list
                });
                return;
            }

            await Json(res, 200, new { success = true, printer = targetPrinter, mode = "test-print", dataType });
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
            var requestedPrinter = payload.Printer_Name;
            var targetPrinter = !string.IsNullOrWhiteSpace(requestedPrinter)
                ? requestedPrinter
                : (string.IsNullOrWhiteSpace(printerName) ? RawPrinterHelper.GetDefaultPrinterName() : printerName);

            if (string.IsNullOrWhiteSpace(targetPrinter))
            {
                await Json(res, 500, new { message = "No printer found. Set PRINT_AGENT_PRINTER or set default printer in Windows." });
                return;
            }

            var ok = RawPrinterHelper.SendStringToPrinter(targetPrinter, raw, dataType, out var errCode, out var errMessage);
            if (!ok)
            {
                var list = PrinterSettings.InstalledPrinters.Cast<string>().ToList();
                await Json(res, 500, new
                {
                    message = "Failed sending raw bytes to printer",
                    printer = targetPrinter,
                    dataType,
                    errorCode = errCode,
                    errorMessage = errMessage,
                    defaultPrinter = RawPrinterHelper.GetDefaultPrinterName(),
                    printers = list
                });
                return;
            }

            await Json(res, 200, new { success = true, printer = targetPrinter, dataType });
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

    public static bool SendStringToPrinter(string printerName, string data, string preferredDataType, out int errorCode, out string errorMessage)
    {
        errorCode = 0;
        errorMessage = string.Empty;

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

            foreach (var attempt in dataTypes)
            {
                var di = new DOCINFO { pDataType = attempt.DataType };
                if (!StartDocPrinter(hPrinter, 1, di))
                {
                    errorCode = Marshal.GetLastWin32Error();
                    errorMessage = $"StartDocPrinter({attempt.DataType}) failed: {new Win32Exception(errorCode).Message}";
                    if (errorCode == 1804) continue;
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
            }

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
        if (string.IsNullOrWhiteSpace(preferredDataType) || string.Equals(preferredDataType, "AUTO", StringComparison.OrdinalIgnoreCase))
        {
            return new List<DataTypeAttempt>
            {
                new("RAW", "RAW", AppendFormFeed: false),
                new("RAW", "RAW + FF", AppendFormFeed: true),
                new("NT EMF 1.008", "NT EMF 1.008", AppendFormFeed: false),
                new("NT EMF 1.007", "NT EMF 1.007", AppendFormFeed: false),
                new("TEXT", "TEXT", AppendFormFeed: false)
            };
        }

        var normalized = preferredDataType.Trim().ToUpperInvariant();
        if (normalized == "RAW")
        {
            return new List<DataTypeAttempt>
            {
                new("RAW", "RAW", AppendFormFeed: false),
                new("RAW", "RAW + FF", AppendFormFeed: true),
                new("NT EMF 1.008", "NT EMF 1.008", AppendFormFeed: false),
                new("NT EMF 1.007", "NT EMF 1.007", AppendFormFeed: false),
                new("TEXT", "TEXT", AppendFormFeed: false)
            };
        }

        return new List<DataTypeAttempt> { new(normalized, normalized, AppendFormFeed: false) };
    }

    private sealed record DataTypeAttempt(string DataType, string Label, bool AppendFormFeed);
}
