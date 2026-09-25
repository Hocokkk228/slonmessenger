# Подключение пушей Google (FCM) для Android-приложения SLON — как в Telegram.
# Запуск: двойной клик по set-fcm.cmd
# Скрипт попросит выбрать JSON-файл сервисного аккаунта Firebase и положит его в секреты сервера.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Add-Type -AssemblyName System.Windows.Forms
Write-Host ''
Write-Host '=== SLON: подключение пушей Google (FCM) ===' -ForegroundColor Cyan
Write-Host 'Выбери файл сервисного аккаунта (скачан из Firebase: Настройки проекта → Сервисные аккаунты → Создать закрытый ключ)'
$dlg = New-Object System.Windows.Forms.OpenFileDialog
$dlg.Filter = 'JSON (*.json)|*.json'
$dlg.InitialDirectory = [Environment]::GetFolderPath('UserProfile') + '\Downloads'
if ($dlg.ShowDialog() -ne 'OK') { Write-Host 'Отменено'; Read-Host 'Enter — закрыть'; exit 1 }
$json = Get-Content -Raw -Encoding UTF8 $dlg.FileName
try { $o = $json | ConvertFrom-Json } catch { Write-Host 'Это не JSON' -ForegroundColor Red; Read-Host 'Enter'; exit 1 }
if (-not $o.private_key -or -not $o.client_email -or -not $o.project_id) { Write-Host 'Это не файл сервисного аккаунта' -ForegroundColor Red; Read-Host 'Enter'; exit 1 }
Write-Host ('Проект: ' + $o.project_id)
$json | npx --yes wrangler@4 secret put FCM_SA
if ($LASTEXITCODE -ne 0) { Write-Host 'Ошибка' -ForegroundColor Red; Read-Host 'Enter'; exit 1 }
Write-Host ''
Write-Host 'Готово! Сервер теперь будит Android-приложение пушами Google.' -ForegroundColor Green
Write-Host 'Файл ключа можно удалить из Загрузок — на сервере он уже есть.'
Read-Host 'Enter — закрыть'
