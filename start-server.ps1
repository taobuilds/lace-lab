$bundled = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$entry = Join-Path $PSScriptRoot 'server.cjs'
if (Test-Path -LiteralPath $bundled) {
  & $bundled $entry
  exit $LASTEXITCODE
}
if (Get-Command node -ErrorAction SilentlyContinue) {
  & node $entry
  exit $LASTEXITCODE
}
Write-Error 'Node.js was not found. Install Node.js or run the bundled runtime path from the project instructions.'
