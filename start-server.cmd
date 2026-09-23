@echo off
set "BUNDLED=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%BUNDLED%" (
  "%BUNDLED%" "%~dp0server.cjs"
  exit /b %errorlevel%
)
where node >nul 2>nul
if %errorlevel%==0 (
  node "%~dp0server.cjs"
  exit /b %errorlevel%
)
echo Node.js was not found. Install Node.js or use the bundled runtime path.
pause
