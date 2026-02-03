@echo off
echo Baslatiliyor: Gum2Git (Release)...
cd /d "%~dp0"
if exist "release\0.0.0\win-unpacked\Gum2Git.exe" (
    start "" "release\0.0.0\win-unpacked\Gum2Git.exe"
) else (
    echo.
    echo HATA: Build dosyasi bulunamadi!
    echo Once 'npm run build' komutunu calistirmalisiniz veya 'start_dev.bat' kullanin.
    pause
)
