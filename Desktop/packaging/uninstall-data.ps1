# Called only after the uninstaller receives explicit consent. A base override
# allows the same deletion checks to be tested against isolated fixture data.
param([string]$AppDataRoot = $env:APPDATA)
$ErrorActionPreference = 'Stop'
try {
    if (-not [IO.Path]::IsPathRooted($AppDataRoot)) { throw 'AppData must be an absolute path.' }
    $base = [IO.Path]::GetFullPath($AppDataRoot).TrimEnd('\')
    if ($base -eq [IO.Path]::GetPathRoot($base).TrimEnd('\')) { throw 'Refusing a drive root.' }
    $target = [IO.Path]::GetFullPath((Join-Path $base 'SteamAccountManagerApp'))
    if ([IO.Path]::GetDirectoryName($target) -ne $base) { throw 'Data path is outside AppData.' }
    if (-not (Test-Path -LiteralPath $target)) { exit 0 }
    # Never follow a junction or symbolic link, including in the parent chain.
    $parent = Get-Item -LiteralPath $target -Force
    while ($null -ne $parent) {
        if ($parent.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Linked data paths are preserved.' }
        $parent = $parent.Parent
    }
    $pending = New-Object 'System.Collections.Generic.Stack[string]'
    $pending.Push($target)
    while ($pending.Count -gt 0) {
        foreach ($entry in Get-ChildItem -LiteralPath $pending.Pop() -Force) {
            if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Linked data files are preserved.' }
            if ($entry.PSIsContainer) { $pending.Push($entry.FullName) }
        }
    }
    $running = Get-CimInstance Win32_Process | Where-Object {
        $_.ProcessId -ne $PID -and (
            $_.Name -eq 'Steam Account Manager App.exe' -or
            ($_.Name -match '^(chrome|sam-native)\.exe$' -and $_.CommandLine -and
                $_.CommandLine.IndexOf($target, [StringComparison]::OrdinalIgnoreCase) -ge 0)
        )
    }
    if ($running) { throw 'Close Steam Account Manager App and its account browsers first.' }
    # Both the absolute target and its parent were checked above.
    Remove-Item -LiteralPath $target -Recurse -Force
    Write-Output 'App data erased.'
    exit 0
} catch {
    Write-Output $_.Exception.Message
    exit 1
}
