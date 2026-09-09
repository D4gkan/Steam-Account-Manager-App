param([string]$ExecutablePath, [string]$AppDirectory)
$ErrorActionPreference = 'Stop'
if (-not $ExecutablePath) { $ExecutablePath = Join-Path $PSScriptRoot '..\node_modules\electron\dist\electron.exe'; $AppDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')) }
$testData = Join-Path $env:TEMP ('sam-hidden-start-' + [guid]::NewGuid().ToString())
$launchArguments = @('--user-data-dir=' + $testData)
if ($AppDirectory) { $launchArguments = @($AppDirectory) + $launchArguments }
$testProcess = Start-Process -FilePath $ExecutablePath -ArgumentList $launchArguments -WindowStyle Hidden -PassThru
try {
  for ($attempt = 0; $attempt -lt 80; $attempt++) {
    Start-Sleep -Milliseconds 250
    $testProcess.Refresh()
    if ($testProcess.HasExited) { throw 'Manager exited before showing its dashboard' }
    if ($testProcess.MainWindowHandle -ne 0) { break }
  }
  if ($testProcess.MainWindowHandle -eq 0) { throw 'Dashboard remained hidden' }
  'PASS: visible dashboard after hidden Windows startup: ' + $testProcess.MainWindowTitle
} finally {
  if (-not $testProcess.HasExited) {
    $null = $testProcess.CloseMainWindow()
    if (-not $testProcess.WaitForExit(10000)) { Stop-Process -Id $testProcess.Id }
  }
}
