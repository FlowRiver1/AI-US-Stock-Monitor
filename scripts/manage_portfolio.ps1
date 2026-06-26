# AI US Stock Monitor - 持仓管理工具 (GUI)
# 双击运行或: powershell -ExecutionPolicy Bypass -File manage_portfolio.ps1

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$PortfolioFile = Join-Path $ProjectDir "config\portfolio.json"

# ========== 股票数据库 ==========
$StockDB = @{
    "A"="Agilent Technologies Inc.|healthcare"
    "AA"="Alcoa Corporation|materials"
    "AAPL"="Apple Inc.|consumer_tech"
    "ABBV"="AbbVie Inc.|healthcare"
    "ABNB"="Airbnb Inc.|travel"
    "ABT"="Abbott Laboratories|healthcare"
    "ACN"="Accenture plc|consulting"
    "ADBE"="Adobe Inc.|enterprise_tech"
    "ADI"="Analog Devices Inc.|semiconductor"
    "AMD"="Advanced Micro Devices Inc.|semiconductor"
    "AMGN"="Amgen Inc.|healthcare"
    "AMZN"="Amazon.com Inc.|ecommerce_cloud"
    "ANET"="Arista Networks Inc.|networking"
    "ARM"="Arm Holdings plc|semiconductor"
    "ASML"="ASML Holding N.V.|semiconductor"
    "AVGO"="Broadcom Inc.|semiconductor"
    "BABA"="Alibaba Group Holding Limited|ecommerce"
    "BAC"="Bank of America Corporation|banking"
    "BIDU"="Baidu Inc.|internet"
    "BRK.B"="Berkshire Hathaway Inc.|conglomerate"
    "CAT"="Caterpillar Inc.|industrial"
    "COIN"="Coinbase Global Inc.|crypto"
    "COST"="Costco Wholesale Corporation|retail"
    "CRM"="Salesforce Inc.|enterprise_tech"
    "CRWD"="CrowdStrike Holdings Inc.|cybersecurity"
    "CSCO"="Cisco Systems Inc.|networking"
    "CVX"="Chevron Corporation|energy"
    "DAL"="Delta Air Lines Inc.|airline"
    "DELL"="Dell Technologies Inc.|hardware"
    "DIS"="The Walt Disney Company|entertainment"
    "DKNG"="DraftKings Inc.|gambling"
    "EA"="Electronic Arts Inc.|gaming"
    "EBAY"="eBay Inc.|ecommerce"
    "ENPH"="Enphase Energy Inc.|solar"
    "F"="Ford Motor Company|auto"
    "FCX"="Freeport-McMoRan Inc.|mining"
    "FSLR"="First Solar Inc.|solar"
    "FTNT"="Fortinet Inc.|cybersecurity"
    "GE"="General Electric Company|industrial"
    "GFS"="GlobalFoundries Inc.|semiconductor"
    "GILD"="Gilead Sciences Inc.|healthcare"
    "GM"="General Motors Company|auto"
    "GOOGL"="Alphabet Inc.|internet"
    "GS"="The Goldman Sachs Group Inc.|finance"
    "HD"="The Home Depot Inc.|retail"
    "HON"="Honeywell International Inc.|industrial"
    "HOOD"="Robinhood Markets Inc.|fintech"
    "IBM"="International Business Machines Corporation|enterprise_tech"
    "INTC"="Intel Corporation|semiconductor"
    "INTU"="Intuit Inc.|fintech"
    "ISRG"="Intuitive Surgical Inc.|healthcare"
    "JD"="JD.com Inc.|ecommerce"
    "JNJ"="Johnson & Johnson|healthcare"
    "JPM"="JPMorgan Chase & Co.|banking"
    "KKR"="KKR & Co. Inc.|finance"
    "KLAC"="KLA Corporation|semiconductor"
    "KO"="The Coca-Cola Company|consumer"
    "LI"="Li Auto Inc.|ev"
    "LLY"="Eli Lilly and Company|healthcare"
    "LMT"="Lockheed Martin Corporation|defense"
    "LRCX"="Lam Research Corporation|semiconductor"
    "LULU"="Lululemon Athletica Inc.|retail"
    "MA"="Mastercard Incorporated|fintech"
    "MCD"="McDonald's Corporation|restaurant"
    "MDB"="MongoDB Inc.|enterprise_tech"
    "MELI"="MercadoLibre Inc.|ecommerce"
    "META"="Meta Platforms Inc.|social_media"
    "MRNA"="Moderna Inc.|healthcare"
    "MRVL"="Marvell Technology Inc.|semiconductor"
    "MS"="Morgan Stanley|finance"
    "MSFT"="Microsoft Corporation|enterprise_tech"
    "MU"="Micron Technology Inc.|semiconductor"
    "NFLX"="Netflix Inc.|streaming"
    "NIO"="NIO Inc.|ev"
    "NKE"="NIKE Inc.|retail"
    "NOW"="ServiceNow Inc.|enterprise_tech"
    "NVDA"="NVIDIA Corporation|semiconductor"
    "NVO"="Novo Nordisk A/S|healthcare"
    "ORCL"="Oracle Corporation|enterprise_tech"
    "PANW"="Palo Alto Networks Inc.|cybersecurity"
    "PDD"="PDD Holdings Inc.|ecommerce"
    "PEP"="PepsiCo Inc.|consumer"
    "PFE"="Pfizer Inc.|healthcare"
    "PG"="The Procter & Gamble Company|consumer"
    "PLTR"="Palantir Technologies Inc.|enterprise_tech"
    "PYPL"="PayPal Holdings Inc.|fintech"
    "QCOM"="QUALCOMM Incorporated|semiconductor"
    "RBLX"="Roblox Corporation|gaming"
    "RIVN"="Rivian Automotive Inc.|ev"
    "RKLB"="Rocket Lab USA Inc.|aerospace"
    "ROKU"="Roku Inc.|streaming"
    "RTX"="RTX Corporation|defense"
    "SBUX"="Starbucks Corporation|restaurant"
    "SCHW"="The Charles Schwab Corporation|finance"
    "SHOP"="Shopify Inc.|ecommerce"
    "SMCI"="Super Micro Computer Inc.|hardware"
    "SNAP"="Snap Inc.|social_media"
    "SNOW"="Snowflake Inc.|enterprise_tech"
    "SNPS"="Synopsys Inc.|enterprise_tech"
    "SOFI"="SoFi Technologies Inc.|fintech"
    "SPOT"="Spotify Technology S.A.|streaming"
    "SQ"="Block Inc.|fintech"
    "TGT"="Target Corporation|retail"
    "TMO"="Thermo Fisher Scientific Inc.|healthcare"
    "TSLA"="Tesla Inc.|ev"
    "TSM"="Taiwan Semiconductor Manufacturing Company Limited|semiconductor"
    "TTD"="The Trade Desk Inc.|adtech"
    "TXN"="Texas Instruments Incorporated|semiconductor"
    "UBER"="Uber Technologies Inc.|ride_hailing"
    "UNH"="UnitedHealth Group Incorporated|healthcare"
    "V"="Visa Inc.|fintech"
    "VRT"="Vertiv Holdings Co|data_center"
    "WDAY"="Workday Inc.|enterprise_tech"
    "WFC"="Wells Fargo & Company|banking"
    "WMT"="Walmart Inc.|retail"
    "WOLF"="Wolfspeed Inc.|semiconductor"
    "XOM"="Exxon Mobil Corporation|energy"
    "XPEV"="XPeng Inc.|ev"
    "ZM"="Zoom Video Communications Inc.|enterprise_tech"
    "ZS"="Zscaler Inc.|cybersecurity"
    "AAOI"="Applied Optoelectronics Inc.|optical_networking"
    "ASTS"="AST SpaceMobile Inc.|space"
    "RDDT"="Reddit Inc.|social_media"
    "CAVA"="CAVA Group Inc.|restaurant"
}

# ========== 读取持仓 ==========
function Load-Portfolio {
    if (Test-Path $PortfolioFile) {
        $data = Get-Content $PortfolioFile -Raw -Encoding UTF8 | ConvertFrom-Json
        return @{
            Holdings = [System.Collections.ArrayList]::new(@($data.holdings))
            Indices = $data.indices
        }
    }
    return @{ Holdings = [System.Collections.ArrayList]::new(); Indices = @() }
}

# ========== 保存持仓 ==========
function Save-Portfolio {
    $output = @{
        holdings = @($script:Portfolio.Holdings)
        indices = $script:Portfolio.Indices
    }
    $json = ConvertTo-Json -InputObject $output -Depth 5
    [System.IO.File]::WriteAllText($PortfolioFile, $json, [System.Text.UTF8Encoding]::new($false))
}

# ========== GUI ==========
$script:Portfolio = Load-Portfolio

$form = New-Object System.Windows.Forms.Form
$form.Text = "⚙️ 持仓管理 - AI US Stock Monitor"
$form.Size = New-Object System.Drawing.Size(720, 620)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.Font = New-Object System.Drawing.Font("Microsoft YaHei", 9)

# -- 标题 --
$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "📋 当前持仓"
$lblTitle.Font = New-Object System.Drawing.Font("Microsoft YaHei", 12, [System.Drawing.FontStyle]::Bold)
$lblTitle.Location = New-Object System.Drawing.Point(20, 15)
$lblTitle.Size = New-Object System.Drawing.Size(200, 30)
$form.Controls.Add($lblTitle)

$lblCount = New-Object System.Windows.Forms.Label
$lblCount.Location = New-Object System.Drawing.Point(210, 18)
$lblCount.Size = New-Object System.Drawing.Size(100, 24)
$form.Controls.Add($lblCount)

# -- 持仓列表 --
$listView = New-Object System.Windows.Forms.ListView
$listView.Location = New-Object System.Drawing.Point(20, 50)
$listView.Size = New-Object System.Drawing.Size(670, 320)
$listView.View = "Details"
$listView.FullRowSelect = $true
$listView.GridLines = $true
$listView.Columns.Add("股票代码", 85)
$listView.Columns.Add("公司名称", 250)
$listView.Columns.Add("行业", 140)
$listView.Columns.Add("关注度", 75)
$form.Controls.Add($listView)

# -- 移除按钮 --
$btnRemove = New-Object System.Windows.Forms.Button
$btnRemove.Text = "🗑️ 移除选中"
$btnRemove.Location = New-Object System.Drawing.Point(20, 380)
$btnRemove.Size = New-Object System.Drawing.Size(120, 32)
$btnRemove.FlatStyle = "Flat"
$btnRemove.BackColor = [System.Drawing.Color]::FromArgb(248, 113, 113)
$btnRemove.ForeColor = [System.Drawing.Color]::White
$form.Controls.Add($btnRemove)

# -- 添加区域分隔 --
$lblAdd = New-Object System.Windows.Forms.Label
$lblAdd.Text = "➕ 添加持仓"
$lblAdd.Font = New-Object System.Drawing.Font("Microsoft YaHei", 11, [System.Drawing.FontStyle]::Bold)
$lblAdd.Location = New-Object System.Drawing.Point(20, 425)
$lblAdd.Size = New-Object System.Drawing.Size(200, 28)
$form.Controls.Add($lblAdd)

# -- 代码输入 --
$txtTicker = New-Object System.Windows.Forms.TextBox
$txtTicker.Location = New-Object System.Drawing.Point(20, 458)
$txtTicker.Size = New-Object System.Drawing.Size(100, 28)
$txtTicker.Font = New-Object System.Drawing.Font("Consolas", 11, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($txtTicker)

$lblTickerHint = New-Object System.Windows.Forms.Label
$lblTickerHint.Text = "股票代码"
$lblTickerHint.Location = New-Object System.Drawing.Point(20, 485)
$lblTickerHint.Size = New-Object System.Drawing.Size(80, 16)
$lblTickerHint.ForeColor = [System.Drawing.Color]::Gray
$form.Controls.Add($lblTickerHint)

# -- 查询按钮 --
$btnLookup = New-Object System.Windows.Forms.Button
$btnLookup.Text = "🔍 查询"
$btnLookup.Location = New-Object System.Drawing.Point(130, 458)
$btnLookup.Size = New-Object System.Drawing.Size(80, 28)
$btnLookup.FlatStyle = "Flat"
$form.Controls.Add($btnLookup)

$lblLookupStatus = New-Object System.Windows.Forms.Label
$lblLookupStatus.Location = New-Object System.Drawing.Point(220, 462)
$lblLookupStatus.Size = New-Object System.Drawing.Size(300, 22)
$form.Controls.Add($lblLookupStatus)

# -- 公司名 --
$txtName = New-Object System.Windows.Forms.TextBox
$txtName.Location = New-Object System.Drawing.Point(20, 505)
$txtName.Size = New-Object System.Drawing.Size(280, 28)
$form.Controls.Add($txtName)

$lblNameHint = New-Object System.Windows.Forms.Label
$lblNameHint.Text = "公司名称（自动填入）"
$lblNameHint.Location = New-Object System.Drawing.Point(20, 535)
$lblNameHint.Size = New-Object System.Drawing.Size(200, 16)
$lblNameHint.ForeColor = [System.Drawing.Color]::Gray
$form.Controls.Add($lblNameHint)

# -- 行业 --
$txtSector = New-Object System.Windows.Forms.TextBox
$txtSector.Location = New-Object System.Drawing.Point(320, 505)
$txtSector.Size = New-Object System.Drawing.Size(160, 28)
$form.Controls.Add($txtSector)

$lblSectorHint = New-Object System.Windows.Forms.Label
$lblSectorHint.Text = "行业（自动填入）"
$lblSectorHint.Location = New-Object System.Drawing.Point(320, 535)
$lblSectorHint.Size = New-Object System.Drawing.Size(150, 16)
$lblSectorHint.ForeColor = [System.Drawing.Color]::Gray
$form.Controls.Add($lblSectorHint)

# -- 关注度 --
$cboWeight = New-Object System.Windows.Forms.ComboBox
$cboWeight.Location = New-Object System.Drawing.Point(500, 505)
$cboWeight.Size = New-Object System.Drawing.Size(120, 28)
$cboWeight.DropDownStyle = "DropDownList"
$cboWeight.Items.AddRange(@("medium", "high", "low"))
$cboWeight.SelectedIndex = 0
$form.Controls.Add($cboWeight)

$lblWeightHint = New-Object System.Windows.Forms.Label
$lblWeightHint.Text = "关注度"
$lblWeightHint.Location = New-Object System.Drawing.Point(500, 535)
$lblWeightHint.Size = New-Object System.Drawing.Size(100, 16)
$lblWeightHint.ForeColor = [System.Drawing.Color]::Gray
$form.Controls.Add($lblWeightHint)

# -- 添加按钮 --
$btnAdd = New-Object System.Windows.Forms.Button
$btnAdd.Text = "✅ 确认添加"
$btnAdd.Location = New-Object System.Drawing.Point(640, 505)
$btnAdd.Size = New-Object System.Drawing.Size(50, 28)
$btnAdd.FlatStyle = "Flat"
$btnAdd.BackColor = [System.Drawing.Color]::FromArgb(96, 165, 250)
$btnAdd.ForeColor = [System.Drawing.Color]::White
$btnAdd.Enabled = $false
$form.Controls.Add($btnAdd)

# -- 状态栏 --
$statusBar = New-Object System.Windows.Forms.Label
$statusBar.Location = New-Object System.Drawing.Point(20, 555)
$statusBar.Size = New-Object System.Drawing.Size(670, 22)
$statusBar.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
$form.Controls.Add($statusBar)

# ========== 刷新列表 ==========
function Refresh-List {
    $listView.Items.Clear()
    foreach ($h in $script:Portfolio.Holdings) {
        $item = New-Object System.Windows.Forms.ListViewItem($h.ticker)
        $item.SubItems.Add($h.name) | Out-Null
        $item.SubItems.Add($h.sector) | Out-Null
        $item.SubItems.Add($h.weight) | Out-Null
        $listView.Items.Add($item) | Out-Null
    }
    $lblCount.Text = "共 $($script:Portfolio.Holdings.Count) 只"
}

# ========== 查询股票 ==========
$btnLookup.Add_Click({
    $ticker = $txtTicker.Text.Trim().ToUpper()
    if ($ticker -eq "") { return }

    if ($StockDB.ContainsKey($ticker)) {
        $parts = $StockDB[$ticker] -split '\|'
        $txtName.Text = $parts[0]
        $txtSector.Text = $parts[1]
        $lblLookupStatus.Text = "✓ 已识别"
        $lblLookupStatus.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
        $btnAdd.Enabled = $true
    } else {
        $txtName.Text = ""
        $txtSector.Text = ""
        $txtName.Focus()
        $lblLookupStatus.Text = "未在数据库中，请手动输入公司名和行业"
        $lblLookupStatus.ForeColor = [System.Drawing.Color]::FromArgb(251, 191, 36)
        $btnAdd.Enabled = $true
    }
})

# ========== 代码输入实时转大写 ==========
$txtTicker.Add_TextChanged({
    $txtTicker.Text = $txtTicker.Text.ToUpper()
    $txtTicker.SelectionStart = $txtTicker.Text.Length
    $lblLookupStatus.Text = ""
    $btnAdd.Enabled = $false
})

# ========== 回车查询 ==========
$txtTicker.Add_KeyDown({
    if ($_.KeyCode -eq "Enter") {
        $_.SuppressKeyPress = $true
        $btnLookup.PerformClick()
    }
})

# ========== 添加持仓 ==========
$btnAdd.Add_Click({
    $ticker = $txtTicker.Text.Trim().ToUpper()
    $name = $txtName.Text.Trim()
    $sector = $txtSector.Text.Trim()
    $weight = $cboWeight.SelectedItem

    if ($ticker -eq "") {
        $statusBar.Text = "❌ 请输入股票代码"
        $statusBar.ForeColor = [System.Drawing.Color]::FromArgb(248, 113, 113)
        return
    }
    if ($name -eq "") {
        $statusBar.Text = "❌ 请输入公司名称"
        $statusBar.ForeColor = [System.Drawing.Color]::FromArgb(248, 113, 113)
        return
    }
    # Check duplicate
    foreach ($h in $script:Portfolio.Holdings) {
        if ($h.ticker -eq $ticker) {
            $statusBar.Text = "❌ $ticker 已在持仓列表中"
            $statusBar.ForeColor = [System.Drawing.Color]::FromArgb(248, 113, 113)
            return
        }
    }

    $newHolding = @{
        ticker = $ticker
        name = $name
        sector = if ($sector) { $sector } else { "other" }
        weight = $weight
    }
    $script:Portfolio.Holdings.Add($newHolding) | Out-Null

    Save-Portfolio
    Refresh-List

    $txtTicker.Text = ""
    $txtName.Text = ""
    $txtSector.Text = ""
    $lblLookupStatus.Text = ""
    $btnAdd.Enabled = $false
    $statusBar.Text = "✅ $ticker 已添加并保存到 portfolio.json"
    $statusBar.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
})

# ========== 移除持仓 ==========
$btnRemove.Add_Click({
    if ($listView.SelectedItems.Count -eq 0) {
        $statusBar.Text = "⚠️ 请先在列表中选择要移除的股票"
        $statusBar.ForeColor = [System.Drawing.Color]::FromArgb(251, 191, 36)
        return
    }

    $selectedTicker = $listView.SelectedItems[0].Text
    $result = [System.Windows.Forms.MessageBox]::Show(
        "确认将 $selectedTicker 从持仓中移除？`n`n移除后当日生效，后续日报不再分析该股。",
        "确认移除",
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question
    )

    if ($result -eq "Yes") {
        $toRemove = @()
        foreach ($h in $script:Portfolio.Holdings) {
            if ($h.ticker -eq $selectedTicker) {
                $toRemove += $h
            }
        }
        foreach ($r in $toRemove) {
            $script:Portfolio.Holdings.Remove($r) | Out-Null
        }

        Save-Portfolio
        Refresh-List
        $statusBar.Text = "🗑️ $selectedTicker 已移除并保存"
        $statusBar.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
    }
})

# ========== 初始化 ==========
Refresh-List
$form.ShowDialog() | Out-Null
