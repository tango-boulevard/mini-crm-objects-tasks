$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host 'npm was not found.' -ForegroundColor Red
    Write-Host 'Install Node.js 20 or newer, reopen PowerShell, and run this script again.' -ForegroundColor Yellow
    exit 1
}

function Invoke-Npm {
    param([Parameter(Mandatory)][string[]]$Arguments)

    & npm @Arguments

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'package-lock.json'))) {
    Write-Host 'Preparing npm dependencies and package-lock.json' -ForegroundColor Cyan
    Invoke-Npm @('install')
}

Write-Host '1/4 TypeScript' -ForegroundColor Cyan
Invoke-Npm @('run', 'typecheck')

Write-Host '2/4 ESLint' -ForegroundColor Cyan
Invoke-Npm @('run', 'lint')

Write-Host '3/4 Vitest' -ForegroundColor Cyan
Invoke-Npm @('test')

Write-Host '4/4 Production build' -ForegroundColor Cyan
Invoke-Npm @('run', 'build')

Write-Host 'All quality gates passed.' -ForegroundColor Green
