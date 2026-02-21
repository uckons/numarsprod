# Local Print Agent (VPS -> Local Device)

Gunakan arsitektur ini jika backend ada di VPS, tetapi printer USB ada di PC kasir lokal.

## Windows quick start (PC kasir)

> Karena PC kasir Windows dan kasir hanya pakai browser, agent ini jalan di background. Browser tetap dipakai seperti biasa.

1. Install **Node.js LTS** (v18/v20) di PC kasir Windows.
2. Buka **Command Prompt** lalu masuk ke folder backend:

```cmd
cd backend
```

3. Install dependency (sekali saja):

```cmd
npm install
```

4. Set env lalu jalankan agent:

```cmd
set PRINT_AGENT_PORT=19000
set PRINT_AGENT_TOKEN=secret123
npm run print-agent:win
```

5. Alternatif paling gampang (double click):

```cmd
backend\scripts\run-print-agent.cmd
```

> Script `.cmd` akan cek Node.js, dan otomatis `npm install` jika `node_modules` belum ada.

6. Health check lokal:

```bash
curl http://127.0.0.1:19000/health
```

## Koneksi dari VPS backend

Set env di backend VPS:

```bash
PRINT_AGENT_URL=http://IP-PC-KASIR:19000
PRINT_AGENT_TOKEN=secret123
```

Backend `POST /api/printers/print-order` otomatis kirim job ke print agent jika `PRINT_AGENT_URL` tersedia.

## Optional override per request

Kirim body:

```json
{
  "order_id": 123,
  "printer": {
    "agent_url": "http://192.168.1.10:19000",
    "agent_token": "secret123"
  }
}
```

Jika `agent_url` tidak diisi, backend fallback ke mode USB lokal (printer harus terpasang langsung di host backend).

## Catatan penting untuk Windows USB thermal

- Pastikan printer terdeteksi di Windows.
- Jika USB tidak terbaca dari Node/escpos-usb, biasanya perlu driver USB generic (WinUSB/libusb) sesuai chipset printer clone.
- Buka firewall inbound untuk port agent (default `19000`) **hanya** dari jaringan terpercaya (VPN/private network).
- Rekomendasi produksi: hubungkan VPS ke PC kasir lewat VPN private (WireGuard/Tailscale/ZeroTier), bukan expose publik langsung.


## Troubleshooting npm di Windows

Jika muncul error seperti:

- `Cannot find module ...\node_modules\npm\bin\npm-cli.js`
- `Cannot find module ...\node_modules\npm\bin\npm-prefix.js`

artinya instalasi Node.js di PC kasir tidak lengkap (npm hilang), biasanya karena folder Node di-copy manual.

Langkah perbaikan:

1. Hapus instalasi Node yang rusak.
2. Install ulang **Node.js LTS v18/v20** dari installer resmi `.msi` di https://nodejs.org/.
3. Tutup dan buka lagi Command Prompt.
4. Verifikasi:

```cmd
node -v
npm -v
```

5. Ulangi dari langkah:

```cmd
cd backend
npm install
npm run print-agent:win
```

> `run-print-agent.cmd` sekarang juga akan mendeteksi jika `npm` tidak ada dan menampilkan pesan perbaikan otomatis.


## Opsi paling mudah (tanpa install Node di kasir): PrintNode App

Kalau install Node di Windows terasa susah, gunakan **PrintNode Client** (aplikasi siap pakai).

### Cara kerja
- Install aplikasi PrintNode di PC kasir (Windows).
- Printer USB dipilih di dashboard PrintNode.
- Backend VPS kirim job ke API PrintNode (tanpa local Node agent).

### Setup
1. Install aplikasi: https://www.printnode.com/download
2. Login PrintNode di PC kasir, pastikan printer USB muncul online.
3. Ambil **API Key** dari akun PrintNode.
4. Ambil **Printer ID** dari dashboard PrintNode.
5. Set env di backend VPS:

```bash
PRINT_PROVIDER=printnode
PRINTNODE_API_KEY=xxxxxxxx
PRINTNODE_PRINTER_ID=123456
```

Setelah itu endpoint `POST /api/printers/print-order` akan langsung kirim ke PrintNode.

### Optional override per request

```json
{
  "order_id": 123,
  "printer": {
    "mode": "printnode",
    "printnode_api_key": "xxxxxxxx",
    "printnode_printer_id": 123456
  }
}
```


## Alternatif tanpa Node: Agent kecil pakai Visual Studio (.NET)

Kalau lebih nyaman pakai Visual Studio, gunakan project ini:

- Folder: `backend/agents/windows-dotnet-print-agent`
- Project: `WindowsDotnetPrintAgent.csproj`
- Endpoint kompatibel dengan backend saat ini:
  - `GET /health`
  - `POST /print/receipt`

### Cara run di Windows (Visual Studio)

1. Buka `WindowsDotnetPrintAgent.csproj` di Visual Studio 2022.
2. Jalankan (F5) atau Publish sebagai single exe.
3. Set manual IP/port (dua pilihan):

   **A. Via Environment Variables**
   - `PRINT_AGENT_HOST` (contoh: `+` untuk semua interface, atau `192.168.1.10`)
   - `PRINT_AGENT_PORT` (default `19000`)
   - `PRINT_AGENT_TOKEN` (token auth, optional)
   - `PRINT_AGENT_PRINTER` (nama printer Windows; kalau kosong pakai default printer)

   **B. Via file config `agent-config.json`** di folder hasil build EXE (copy dari `agent-config.example.json`):

```json
{
  "host": "+",
  "port": "19000",
  "token": "secret123",
  "printerName": "EPSON TM-T82 Receipt"
}
```

   > Prioritas: Env var akan override nilai dari file config.

### Koneksi dari VPS

Tetap sama seperti mode local print agent:

```bash
PRINT_AGENT_URL=http://IP-PC-KASIR:19000
PRINT_AGENT_TOKEN=secret123
```

Jadi ini cocok untuk tim yang tidak ingin instal/runtime Node.js di kasir.
