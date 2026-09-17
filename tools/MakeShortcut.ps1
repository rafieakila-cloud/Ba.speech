param([string]$Target, [string]$Link, [string]$Icon)
$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut($Link)
$s.TargetPath = $Target
$s.WorkingDirectory = Split-Path $Target
if ($Icon) { $s.IconLocation = $Icon }
$s.Save()
