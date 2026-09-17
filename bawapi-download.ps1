Write-Host ""
Write-Host "  ____    _    __        __    _    ____  ___ " -ForegroundColor Cyan
Write-Host " | __ )  / \   \ \      / /   / \  |  _ \|_ _|" -ForegroundColor Cyan
Write-Host " |  _ \ / _ \   \ \ /\ / /   / _ \ | |_) || | " -ForegroundColor Cyan
Write-Host " | |_) / ___ \   \ V  V /   / ___ \|  __/ | | " -ForegroundColor Cyan
Write-Host " |____/_/   \_\   \_/\_/   /_/   \_\_|   |___|" -ForegroundColor Cyan
Write-Host "        D O W N L O A D  S Y S T E M" -ForegroundColor Yellow
Write-Host ""

$app = Read-Host "Mau download apa? (contoh: chrome / python / vscode / firefox)"
if ([string]::IsNullOrWhiteSpace($app)) { $app = "chrome" }
$app = $app.ToLower().Trim()

Write-Host ""
Write-Host "Pilih OS:" -ForegroundColor Yellow
Write-Host "1. Windows"
Write-Host "2. Linux"
Write-Host "3. macOS"
$os = Read-Host "Pilih (1/2/3)"
if ([string]::IsNullOrWhiteSpace($os)) { $os = "1" }

$maps = @{
  "chrome"  = @{ "1" = "https://www.google.com/chrome/"; "2" = "https://www.google.com/chrome/"; "3" = "https://www.google.com/chrome/" }
  "python"  = @{ "1" = "https://www.python.org/downloads/windows/"; "2" = "https://www.python.org/downloads/source/"; "3" = "https://www.python.org/downloads/macos/" }
  "vscode"  = @{ "1" = "https://code.visualstudio.com/download#windows"; "2" = "https://code.visualstudio.com/download#linux"; "3" = "https://code.visualstudio.com/download#mac" }
  "firefox" = @{ "1" = "https://www.mozilla.org/firefox/new/"; "2" = "https://www.mozilla.org/firefox/new/"; "3" = "https://www.mozilla.org/firefox/new/" }
}

$url = $null
if ($maps.ContainsKey($app) -and $maps[$app].ContainsKey($os)) {
  $url = $maps[$app][$os]
} else {
  $osName = @{ "1" = "windows"; "2" = "linux"; "3" = "macos" }[$os]
  if (-not $osName) { $osName = "windows" }
  $url = "https://www.google.com/search?q=" + [uri]::EscapeDataString("download $app for $osName official site")
}

Write-Host ""
Write-Host "Membuka tab baru: $url" -ForegroundColor Green
Start-Process $url
Write-Host "Selesai. Lanjut download via browser, lalu pakai BawapiinstallerVIA buat install." -ForegroundColor Gray
