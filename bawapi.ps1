Write-Host ""
Write-Host "  ____    _    __        __    _    ____  ___ " -ForegroundColor Cyan
Write-Host " | __ )  / \   \ \      / /   / \  |  _ \|_ _|" -ForegroundColor Cyan
Write-Host " |  _ \ / _ \   \ \ /\ / /   / _ \ | |_) || | " -ForegroundColor Cyan
Write-Host " | |_) / ___ \   \ V  V /   / ___ \|  __/ | | " -ForegroundColor Cyan
Write-Host " |____/_/   \_\   \_/\_/   /_/   \_\_|   |___|" -ForegroundColor Cyan
Write-Host "           I N S T A L L E R  V I A" -ForegroundColor Yellow
Write-Host ""

$want = Read-Host "Apa yang kamu inginkan download? (contoh: chrome)"
if ([string]::IsNullOrWhiteSpace($want)) { $want = "chrome" }

$query = "download " + $want + " official site windows"
$url = "https://www.google.com/search?q=" + [uri]::EscapeDataString($query)
Write-Host "Membuka Google: $url" -ForegroundColor Green
Start-Process $url

Write-Host ""
Write-Host "1. Download file .exe nya via browser yang kebuka" -ForegroundColor White
Write-Host "2. Kalau sudah ke-download, lanjut di sini" -ForegroundColor White
Write-Host ""
$folder = Read-Host "Ketik folder download kamu (Enter = Downloads)"
if ([string]::IsNullOrWhiteSpace($folder)) {
  $folder = Join-Path $HOME "Downloads"
}

if (-not (Test-Path $folder)) {
  Write-Host "Folder tidak ketemu: $folder" -ForegroundColor Red
  exit 1
}

$files = Get-ChildItem -Path $folder -Filter *.exe | Sort-Object LastWriteTime -Descending | Select-Object -First 10
if (-not $files) {
  Write-Host "Tidak ada .exe di $folder" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "File terbaru di ${folder} :" -ForegroundColor Yellow
$i = 1
foreach ($f in $files) {
  Write-Host "$i. $($f.Name)"
  $i++
}
Write-Host ""
$pilih = Read-Host "Ketik nomor file (1-$($files.Count))"
try { $idx = [int]$pilih - 1 } catch { Write-Host "Nomor salah"; exit 1 }
if ($idx -lt 0 -or $idx -ge $files.Count) { Write-Host "Nomor salah"; exit 1 }

$target = $files[$idx].FullName
Add-Type -AssemblyName System.Windows.Forms
$res = [System.Windows.Forms.MessageBox]::Show("Mau install:`n$target ?", "Bawapi Installer", "YesNo", "Question")
if ($res -eq "Yes") {
  Write-Host "Menjalankan: $target" -ForegroundColor Green
  Start-Process $target
} else {
  Write-Host "Batal." -ForegroundColor Gray
}
