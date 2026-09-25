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

function Put-Secret($name, $value) {
  Write-Host "→ $name" -NoNewline
  $value | npx --yes wrangler@4 secret put $name 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { Write-Host '  ошибка' -ForegroundColor Red; throw "wrangler secret put $name" }
  Write-Host '  ok' -ForegroundColor Green
}
Put-Secret 'TURN_URLS' $urls
Put-Secret 'TURN_USER' $user
Put-Secret 'TURN_PASS' $pass
Write-Host ''
Write-Host 'Готово! Звонки сами перейдут на новый TURN (перезайди в SLON).' -ForegroundColor Green
Read-Host 'Enter — закрыть'
