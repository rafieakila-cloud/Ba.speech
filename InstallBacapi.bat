@echo off
title Bacapi Desktop Installer
setlocal
set SRC=%~dp0
set DST=%LOCALAPPDATA%\Bacapi
set APPDST=%LOCALAPPDATA%\BacapiApp
set ELEC=%SRC%BitBrowser\node_modules\electron\dist
set DESK=%USERPROFILE%\Desktop
if not exist "%DESK%" set DESK=%USERPROFILE%\OneDrive\Desktop
if not exist "%DESK%" set DESK=%PUBLIC%\Desktop
echo ==========================================
echo  Bacapi Desktop Installer (Bacium V5.6)
echo ==========================================
if not exist "%ELEC%\electron.exe" (
  echo GAGAL: runtime Electron tidak ketemu.
  echo Taruh file .bat ini di folder project - sejajar bacapi.html dan BitBrowser - lalu jalankan lagi.
  pause & exit /b 1
)
taskkill /F /IM Bacapi.exe 2>nul
echo [1/5] Menyalin file web...
mkdir "%DST%" 2>nul
copy /Y "%SRC%bacapi.html" "%DST%\" >nul
copy /Y "%SRC%bacapi.css" "%DST%\" >nul
copy /Y "%SRC%bacapi.js" "%DST%\" >nul
copy /Y "%SRC%bacapi-logo.svg" "%DST%\" >nul
echo [2/5] Menyalin runtime Electron (agak lama)...
mkdir "%APPDST%" 2>nul
xcopy "%ELEC%" "%APPDST%\" /E /I /Y /Q >nul
del "%APPDST%\resources\default_app.asar" 2>nul
echo [3/5] Menanam aplikasi Bacapi...
mkdir "%APPDST%\resources\app" 2>nul
copy /Y "%SRC%bacapi-app\package.json" "%APPDST%\resources\app\" >nul
copy /Y "%SRC%bacapi-app\main.js" "%APPDST%\resources\app\" >nul
copy /Y "%SRC%bacapi-app\icon.png" "%APPDST%\resources\app\" >nul
copy /Y "%SRC%bacapi-app\icon.ico" "%APPDST%\resources\app\" >nul
copy /Y "%SRC%bacapi.html" "%APPDST%\resources\app\" >nul
copy /Y "%SRC%bacapi.css" "%APPDST%\resources\app\" >nul
copy /Y "%SRC%bacapi.js" "%APPDST%\resources\app\" >nul
copy /Y "%SRC%bacapi-logo.svg" "%APPDST%\resources\app\" >nul
if exist "%APPDST%\Bacapi.exe" del "%APPDST%\Bacapi.exe" >nul 2>&1
ren "%APPDST%\electron.exe" Bacapi.exe
if not exist "%APPDST%\Bacapi.exe" ( echo GAGAL saat merakit Bacapi.exe. & pause & exit /b 1 )
echo [4/5] Membuat shortcut Desktop + Start Menu...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SRC%tools\MakeShortcut.ps1" -Target "%APPDST%\Bacapi.exe" -Link "%DESK%\Bacapi.lnk" -Icon "%APPDST%\resources\app\icon.ico"
mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Bacapi" 2>nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%SRC%tools\MakeShortcut.ps1" -Target "%APPDST%\Bacapi.exe" -Link "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Bacapi\Bacapi.lnk" -Icon "%APPDST%\resources\app\icon.ico"
echo [5/5] Membuka Bacapi...
start "" "%APPDST%\Bacapi.exe"
echo.
echo SELESAI. Bacapi.exe ada di Desktop (klik kanan - Pin to taskbar).
echo Saat pertama dibuka: isi Nama akun + API key SEKALI SAJA.
pause
