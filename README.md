# Ba.speech — Snake Tools

## Isi

- `snake.html` — **Snake speech to text**: ubah suara jadi teks (Indonesia/Inggris/Arab), gratis tanpa API key, unduh .txt/.doc
- `bacapi.html/css/js` — Bacapi AI desktop (Work, plugins Word/Excel/PDF/gambar, mindmap, deep search)
- `bacapi-app/` — sumber aplikasi Electron (`main.js`, ikon)
- `InstallBacapi.bat` — installer Windows: rakit `Bacapi.exe` + shortcut Desktop/Start Menu
- `install.html` — halaman download animasi + terminal (`hit.bacapi`)
- `bacapi-logo.svg`, `tools/` (ikon generator, shortcut maker)
- `cube.html/css/js`, `nimcaal.*`, `mtsn10.*` — varian AI lain
- `index.html`, `app.js` — browser Hubbase/Bicom

## Download (Windows 64-bit)

Ambil versi jadi di tab **Releases**: `Bacapi-5.6.0-win64.zip` → ekstrak → jalankan `Bacapi.exe`. Tanpa install, tanpa admin.

## Syarat

- Windows 64-bit
- API key OpenRouter: https://openrouter.ai/keys (tidak ikut di repo — isi di aplikasi, sekali saja)

## Cara pakai

1. Buka `install.html` → terminal: `hit.bacapi` → `install`.
2. Jalankan `InstallBacapi.bat` hasil unduhan (taruh sejajar folder ini).
3. Buka Bacapi → setup nama + API key sekali → jadi.

## Keamanan

Jangan commit API key. Key hanya tersimpan di localStorage browser masing-masing.
