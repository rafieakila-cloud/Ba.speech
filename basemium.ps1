Write-Host ""
Write-Host "  ____    _    ____  _____ __  __ ___ _   _ __  __ " -ForegroundColor Green
Write-Host " | __ )  / \  / ___|| ____|  \/  |_ _| | | |  \/  |" -ForegroundColor Green
Write-Host " |  _ \ / _ \ \___ \|  _| | |\/| || || | | | |\/| |" -ForegroundColor Green
Write-Host " | |_) / ___ \ ___) | |___| |  | || || |_| | |  | |" -ForegroundColor Green
Write-Host " |____/_/   \_\____/|_____|_|  |_|___|\___/|_|  |_|" -ForegroundColor Green
Write-Host "              S O F T W A R E  G R A T I S" -ForegroundColor Yellow
Write-Host ""

Write-Host "STEP 1: Pilih versi:" -ForegroundColor Yellow
Write-Host "1. 1.22.89 FULL - terbaru kompleks 5.7 GB"
Write-Host "2. 1.22.89 LITE - ringan 340 MB (60-78% performa, cukup)"
Write-Host "3. 1.22.88 - lama, optimal Windows 9 ke bawah"
Write-Host "4. Pt.1.22.LT - Chromebook/ChromeOS, laptop lama Linux/Mac/Windows"
$ver = Read-Host "Pilih (1/2/3/4)"
$verName = @{ "1"="1.22.89"; "2"="1.22.89 LITE"; "3"="1.22.88"; "4"="Pt.1.22.LT" }[$ver]
if (-not $verName) { $verName = "1.22.89 LITE" }

Write-Host ""
Write-Host "Pilih OS:" -ForegroundColor Yellow
Write-Host "1. Windows  2. Linux  3. macOS  4. ChromeOS"
$os = Read-Host "Pilih (1/2/3/4)"
$osName = @{ "1"="Windows"; "2"="Linux"; "3"="macOS"; "4"="ChromeOS" }[$os]
if (-not $osName) { $osName = "Windows" }

$q = "Basemium $verName download for $osName"
$url = "https://www.google.com/search?q=" + [uri]::EscapeDataString($q)
Write-Host ""
Write-Host "Membuka tab baru: $url" -ForegroundColor Green
Start-Process $url

Add-Type -AssemblyName System.Windows.Forms
[void][System.Windows.Forms.MessageBox]::Show("Download for $osName ?`nVersi: $verName", "Basemium Download", "OKCancel", "Question")

Write-Host ""
Write-Host "STEP 2: Pindah ke Document..." -ForegroundColor Yellow
$doc = [Environment]::GetFolderPath("MyDocuments")
$base = Join-Path $doc "Basemium"
New-Item -ItemType Directory -Force -Path $base | Out-Null
"Basemium Servering optimal" | Set-Content (Join-Path $base "Basemium-Servering.Vb.txt")
Write-Host "Dipindah ke: $base (lebih optimal)" -ForegroundColor Green

Write-Host ""
Write-Host "STEP 3: Install berkas dan system..." -ForegroundColor Yellow
$inst = Join-Path $base "installer.T.program.gp.Basemium-folder"
New-Item -ItemType Directory -Force -Path $inst | Out-Null
for ($i=1; $i -le 100; $i+=10) {
  Write-Progress -Activity "Downloading Basemium $verName" -Status "$i%" -PercentComplete $i
  Start-Sleep -Milliseconds 200
}
"done" | Set-Content (Join-Path $inst "done.txt")
Write-Progress -Completed -Activity "done"
Write-Host "Berkas ke-download di: $inst" -ForegroundColor Green

Write-Host ""
Write-Host "STEP 4: Run.page.mage.P0{Basemium} - setup + Kode TCCP" -ForegroundColor Yellow
Start-Process ("https://www.google.com/search?q=" + [uri]::EscapeDataString("Basemium setup TCCP"))
$c1 = Read-Host "Kode 1 [GO/nnnm]"
$c2 = Read-Host "Kode 2 [mmbnn]"
$c3 = Read-Host "Kode 3 [9000]"
$c4 = Read-Host "Kode 4 [basemium-done-setup]"
if ($c1 -ne "GO/nnnm" -or $c2 -ne "mmbnn" -or $c3 -ne "9000" -or $c4 -ne "basemium-done-setup") {
  Write-Host "Kode TCCP salah, tapi lanjut mode friendly." -ForegroundColor Red
} else {
  Write-Host "<Done> berkas dan friendly OK" -ForegroundColor Green
}

Write-Host ""
Write-Host "STEP 5: Install 45 plugins..." -ForegroundColor Yellow
for ($p=1; $p -le 45; $p++) {
  Write-Progress -Activity "Install plugin" -Status "plugin $p/45" -PercentComplete (($p/45)*100)
  Start-Sleep -Milliseconds 80
}
Write-Progress -Completed -Activity "done"
Write-Host "45 plugins kepasang." -ForegroundColor Green

Write-Host ""
Write-Host "  ____   ___  _   _ _____ " -ForegroundColor Cyan
Write-Host " |  _ \ / _ \| \ | | ____|" -ForegroundColor Cyan
Write-Host " | | | | | | |  \| |  _|  " -ForegroundColor Cyan
Write-Host " | |_| | |_| | |\  | |___ " -ForegroundColor Cyan
Write-Host " |____/ \___/|_| \_|_____|" -ForegroundColor Cyan
Write-Host " Laptop kamu optimal sedikit. Selamat!" -ForegroundColor Yellow

Write-Host ""
Write-Host "Animasi Bulan:" -ForegroundColor Gray
$moons = @("🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘")
for ($k=0; $k -lt 2; $k++) {
  foreach ($m in $moons) { Write-Host -NoNewline "`r$m "; Start-Sleep -Milliseconds 300 }
}
Write-Host ""

Write-Host ""
Write-Host "Wiki kecil (Wikipedia API, kosongkan = keluar):" -ForegroundColor Yellow
while ($true) {
  $key = Read-Host "Cari wiki"
  if ([string]::IsNullOrWhiteSpace($key)) { break }
  try {
    $r = Invoke-RestMethod ("https://id.wikipedia.org/api/rest_v1/page/summary/" + [uri]::EscapeDataString($key))
    Write-Host ("== " + $r.title + " ==") -ForegroundColor Green
    Write-Host ($r.extract.Substring(0, [Math]::Min(500, $r.extract.Length)))
  } catch { Write-Host "Tidak ketemu, coba kata lain." -ForegroundColor Red }
}
Write-Host "Basemium selesai. Enjoy hal unik dan seru!" -ForegroundColor Cyan
