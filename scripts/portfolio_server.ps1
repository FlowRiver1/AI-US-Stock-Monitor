<#
  AI US Stock Monitor - Portfolio API Server
  Starts HTTP listener on localhost:8765
  Reads/writes config/portfolio.json directly
  Usage: powershell -ExecutionPolicy Bypass -File portfolio_server.ps1
#>
param()

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$PortfolioFile = Join-Path $ProjectDir "config\portfolio.json"
$ManagePage = Join-Path $ProjectDir "config\manage.html"
$Port = 8765

# Ensure portfolio.json exists
if (-not (Test-Path $PortfolioFile)) {
    $default = [PSCustomObject]@{
        holdings = @()
        indices = @(
            [PSCustomObject]@{symbol="^IXIC"; name="NASDAQ Composite"},
            [PSCustomObject]@{symbol="^GSPC"; name="S&P 500"},
            [PSCustomObject]@{symbol="^DJI"; name="Dow Jones Industrial Average"}
        )
    }
    $json = ConvertTo-Json -InputObject $default -Depth 5
    [System.IO.File]::WriteAllText($PortfolioFile, $json, [System.Text.UTF8Encoding]::new($false))
}

function Add-CorsHeaders($response) {
    $response.Headers.Add("Access-Control-Allow-Origin", "*")
    $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
    $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
    $response.Headers.Add("Content-Type", "application/json; charset=utf-8")
}

function Get-PortfolioJson {
    return [System.IO.File]::ReadAllText($PortfolioFile, [System.Text.UTF8Encoding]::new($false))
}

function Save-PortfolioJson($body) {
    try {
        # Validate JSON structure
        $obj = $body | ConvertFrom-Json
        if (-not $obj.holdings) {
            return $false
        }
        $json = ConvertTo-Json -InputObject $obj -Depth 5
        [System.IO.File]::WriteAllText($PortfolioFile, $json, [System.Text.UTF8Encoding]::new($false))
        return $true
    } catch {
        return $false
    }
}

# Start HTTP Listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")

try {
    $listener.Start()
    Write-Host "[OK] Portfolio API server started on http://localhost:$Port" -ForegroundColor Green
    Write-Host "[OK] Management page: http://localhost:$Port/manage" -ForegroundColor Cyan
    Write-Host "[..] Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed to start: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check if port $Port is already in use or run as Administrator" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Request loop
while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $path = $request.Url.AbsolutePath
        $method = $request.HttpMethod

        # CORS preflight
        if ($method -eq "OPTIONS") {
            Add-CorsHeaders $response
            $response.StatusCode = 204
            $response.Close()
            continue
        }

        Add-CorsHeaders $response

        # Route: /api/portfolio
        if ($path -eq "/api/portfolio") {
            if ($method -eq "GET") {
                $data = Get-PortfolioJson
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($data)
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                Write-Host "$(Get-Date -Format 'HH:mm:ss') GET /api/portfolio -> 200" -ForegroundColor Gray
            }
            elseif ($method -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream)
                $body = $reader.ReadToEnd()
                $reader.Close()
                if (Save-PortfolioJson $body) {
                    $msg = '{"ok":true,"message":"saved"}'
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($msg)
                    $response.StatusCode = 200
                    Write-Host "$(Get-Date -Format 'HH:mm:ss') POST /api/portfolio -> 200" -ForegroundColor Green
                } else {
                    $msg = '{"ok":false,"message":"invalid data"}'
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($msg)
                    $response.StatusCode = 400
                    Write-Host "$(Get-Date -Format 'HH:mm:ss') POST /api/portfolio -> 400" -ForegroundColor Red
                }
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
        }

        # Route: /manage
        elseif ($path -eq "/manage") {
            if (Test-Path $ManagePage) {
                $html = [System.IO.File]::ReadAllText($ManagePage, [System.Text.UTF8Encoding]::new($false))
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
                $response.ContentLength64 = $buffer.Length
                $response.Headers["Content-Type"] = "text/html; charset=utf-8"
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            } else {
                $response.StatusCode = 404
            }
        }

        # Route: / (redirect)
        elseif ($path -eq "/") {
            $response.StatusCode = 302
            $response.Headers["Location"] = "/manage"
            $response.Close()
            continue
        }

        # Route: /reports (redirect to index)
        elseif ($path -eq "/reports") {
            $response.StatusCode = 302
            $response.Headers["Location"] = "/reports/index.html"
        }

        # Route: /reports/* (static files)
        elseif ($path -like "/reports/*") {
            $fileName = $path.Substring(9)  # remove "/reports/"
            $reportFile = Join-Path $ProjectDir "reports" $fileName
            if ((Test-Path $reportFile) -and ($reportFile -match "\.html$")) {
                $html = [System.IO.File]::ReadAllText($reportFile, [System.Text.UTF8Encoding]::new($false))
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
                $response.ContentLength64 = $buffer.Length
                $response.Headers["Content-Type"] = "text/html; charset=utf-8"
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                Write-Host "$(Get-Date -Format 'HH:mm:ss') GET $path -> 200" -ForegroundColor Gray
            } else {
                $msg = '{"error":"report not found"}'
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($msg)
                $response.StatusCode = 404
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
        }

        # 404
        else {
            $msg = '{"error":"not found"}'
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($msg)
            $response.StatusCode = 404
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }

        $response.Close()

    } catch {
        if ($_.Exception.Message -notmatch "I/O") {
            Write-Host "[WARN] $($_.Exception.Message)" -ForegroundColor DarkYellow
        }
    }
}

$listener.Stop()
Write-Host "[OK] Server stopped" -ForegroundColor Yellow
