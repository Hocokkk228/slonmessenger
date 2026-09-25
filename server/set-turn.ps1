# Подключение TURN-сервера ExpressTURN к SLON (качество звонков и демки).
# Запуск: правой кнопкой по файлу → «Выполнить с помощью PowerShell»
# Скрипт спросит данные из кабинета expressturn.com и сам положит их в секреты сервера.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Write-Host ''
Write-Host '=== SLON: подключение TURN (ExpressTURN) ===' -ForegroundColor Cyan
Write-Host 'Открой кабинет expressturn.com — там будут Server, Username и Password.'
Write-Host ''
$server = Read-Host 'Server (например relay1.expressturn.com:3478)'
$server = $server.Trim() -replace '^(turns?:)', ''
if ($server -notmatch ':') { $server = "$server`:3478" }
$hostName = $server.Split(':')[0]
$user = (Read-Host 'Username').Trim()
$sec = Read-Host 'Password' -AsSecureString
$pass = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
if (-not $hostName -or -not $user -or -not $pass) { Write-Host 'Не все поля заполнены' -ForegroundColor Red; Read-Host 'Enter — закрыть'; exit 1 }

# UDP + TCP + TLS на 443 (проходит почти через любые сети)
$urls = "turn:$server,turn:$server`?transport=tcp,turns:$hostName`:443?transport=tcp"

# Все три секрета одной командой: временный JSON-файл, сразу удаляется
$tmp = Join-Path $env:TEMP ('slon-turn-' + [guid]::NewGuid().ToString('N') + '.json')
@{ TURN_URLS = $urls; TURN_USER = $user; TURN_PASS = $pass } | ConvertTo-Json | Out-File -Encoding utf8 $tmp
try {
  Write-Host 'Записываю на сервер…'
  npx --yes wrangler@4 secret bulk $tmp
  if ($LASTEXITCODE -ne 0) { throw 'wrangler secret bulk' }
} catch {
  Write-Host ('Ошибка: ' + $_) -ForegroundColor Red; Read-Host 'Enter — закрыть'; exit 1
} finally { Remove-Item $tmp -Force -ErrorAction SilentlyContinue }
Write-Host ''
Write-Host 'Готово! Звонки сами перейдут на новый TURN (перезайди в SLON).' -ForegroundColor Green
Read-Host 'Enter — закрыть'
