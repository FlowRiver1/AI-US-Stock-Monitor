# AI US Stock Monitor — 一键启动脚本
# 启动 Node.js 服务器 + 打开浏览器

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n📊 AI US Stock Monitor" -ForegroundColor Green
Write-Host "   正在启动服务...`n" -ForegroundColor Gray

# Check Node.js
$nodeVersion = & node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ 未找到 Node.js，请先安装: https://nodejs.org" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
}
Write-Host "   Node.js $nodeVersion" -ForegroundColor Gray

# Start server
$ServerDir = Join-Path $ProjectDir "scripts\server"
Set-Location $ServerDir

Write-Host "   启动服务器 (localhost:8765)...`n" -ForegroundColor Gray
Start-Sleep -Seconds 1

# Open browser
Start-Process "http://localhost:8765"

# Run server
node server.js
