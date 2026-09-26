# Секреты для сервера SLON на Яндексе: пуши Google (FCM) и сервер звонков (TURN).
# Запуск: двойной клик по set-secrets.cmd. Секреты кладутся в %USERPROFILE%\.slon\yc-env.json
# (вне репозитория) и уезжают в настройки функции. Никому их не присылай.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Add-Type -AssemblyName System.Windows.Forms
$f = Join-Path $env:USERPROFILE '.slon\yc-env.json'
$cfg = @{}
if (Test-Path $f) { (Get-Content -Raw $f | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $cfg[$_.Name] = $_.Value } }

Write-Host ''
Write-Host '=== SLON: секреты для нового сервера ===' -ForegroundColor Cyan
Write-Host '1) Пуши: выбери JSON сервисного аккаунта Firebase (тот же, что для set-fcm.cmd). Отмена — пропустить.'
$dlg = New-Object System.Windows.Forms.OpenFileDialog
$dlg.Filter = 'JSON (*.json)|*.json'
$dlg.InitialDirectory = [Environment]::GetFolderPath('UserProfile') + '\Downloads'
if ($dlg.ShowDialog() -eq 'OK') {
  $o = Get-Content -Raw -Encoding UTF8 $dlg.FileName | ConvertFrom-Json
  if ($o.private_key -and $o.client_email) { $cfg['FCM_SA'] = ($o | ConvertTo-Json -Compress -Depth 5); Write-Host '   FCM: ок' -ForegroundColor Green }
  else { Write-Host '   Это не файл сервисного аккаунта — пропущено' -ForegroundColor Yellow }
}
Write-Host '2) Звонки (TURN) — из кабинета ExpressTURN. Enter без ввода — оставить как есть/пропустить.'
$u = Read-Host '   TURN адреса (через запятую, например turn:relay1.expressturn.com:3478)'
if ($u) { $cfg['TURN_URLS'] = $u }
$n = Read-Host '   TURN логин'
if ($n) { $cfg['TURN_USER'] = $n }
$p = Read-Host '   TURN пароль'
if ($p) { $cfg['TURN_PASS'] = $p }

$cfg | ConvertTo-Json -Compress | Set-Content -Encoding UTF8 $f
Write-Host ''
Write-Host 'Выкладываю функцию с новыми секретами…'
node (Join-Path $PSScriptRoot 'deploy.js')
Write-Host ''
Write-Host 'Готово! Пуши и звонки на новом сервере настроены.' -ForegroundColor Green
Read-Host 'Enter — закрыть'
