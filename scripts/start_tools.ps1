# AI US Stock Monitor - 启动持仓管理工具
# 启动本地服务 + 打开浏览器

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerScript = Join-Path $ScriptDir "portfolio_server.ps1"

Write-Host "🚀 AI US Stock Monitor - 启动中..." -ForegroundColor Cyan

# 检查端口是否已被占用（服务已在运行）
$portCheck = netstat -ano 2>$null | Select-String "8765.*LISTENING"
if ($portCheck) {
    Write-Host "✅ 服务已在运行中，直接打开管理页面" -ForegroundColor Green
} else {
    # 启动后台服务
    Write-Host "📡 启动后端服务..." -ForegroundColor Yellow
    $proc = Start-Process powershell -ArgumentList "-NoExit -ExecutionPolicy Bypass -File `"$ServerScript`"" -WindowStyle Minimized -PassThru
    Start-Sleep -Seconds 2
    Write-Host "✅ 后端服务已启动 (PID: $($proc.Id))" -ForegroundColor Green
}

# 打开浏览器
Start-Process "http://localhost:8765/manage"
Write-Host "🌐 管理页面已打开: http://localhost:8765/manage" -ForegroundColor Cyan
Write-Host ""
Write-Host "提示: 关闭 PowerShell 窗口可停止后端服务" -ForegroundColor Gray
