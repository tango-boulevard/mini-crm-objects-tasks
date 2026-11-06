$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host 'npx was not found. Install Node.js 20 or newer.' -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host 'Docker was not found. Install and start Docker Desktop.' -ForegroundColor Red
    exit 1
}

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory)][string]$Command,
        [Parameter(Mandatory)][string[]]$Arguments
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

Write-Host '1/3 Starting local Supabase' -ForegroundColor Cyan
Invoke-CheckedCommand 'npx' @('supabase', 'start')

Write-Host '2/3 Rebuilding local database from migrations' -ForegroundColor Cyan
Invoke-CheckedCommand 'npx' @('supabase', 'db', 'reset')

Write-Host '3/3 Running database tests' -ForegroundColor Cyan
Invoke-CheckedCommand 'npx' @('supabase', 'test', 'db')

Write-Host 'All database quality gates passed.' -ForegroundColor Green
