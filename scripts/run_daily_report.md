# Daily Report Orchestration Workflow

当用户说 "run daily report" 或 "运行日报" 时，按以下步骤执行。

## 变量解析

- `$DATE` = 今日日期 (YYYY-MM-DD)
- `$TRADING_DAY` = 最近一个美股交易日 (YYYY-MM-DD)
- `$PROJECT` = `H:\ClaudeCode_Coding\MyProject_New\AI US Stock Monitor`

## Step 0: 交易日判断

```
1. 读取 config/market_calendar.json
2. 计算 $TRADING_DAY：
   - 基于当前北京时间，映射到美东时间
   - 如果美东当前时间是当天 16:00 之前 → $TRADING_DAY = 前一天
   - 如果美东当前时间是当天 16:00 之后 → $TRADING_DAY = 当天
3. 判断 $TRADING_DAY 是周几：
   - 周六/周日 → 输出 "今日休市（周末），无报告"，终止
4. 判断 $TRADING_DAY 是否在 holidays 列表：
   - 是 → 输出 "今日美股休市（{holiday}），无报告"，终止
5. 如果缓存目录 cache/$TRADING_DAY/ 已存在，跳过搜索步骤
```

## Step 1: 数据采集

```
1. 读取 config/portfolio.json 获取持仓列表和指数列表
2. 读取 config/settings.json 获取 search_depth 参数

3. Phase 1 搜索（基础）：
   FOR EACH holding IN portfolio.holdings:
     检查 cache/$TRADING_DAY/{TICKER}_search_raw.json 是否存在
     如果不存在：
       web_search: "{TICKER} {company_name} stock news {TRADING_DAY}"
       web_search: "{TICKER} stock price movement reason {TRADING_DAY}"
       将结果存入 cache/$TRADING_DAY/{TICKER}_search_raw.json
   
   FOR EACH index IN portfolio.indices:
     web_search: "{index_name} today performance {TRADING_DAY}"

4. 价格快照：
   FOR EACH holding:
     WebFetch: https://finance.yahoo.com/quote/{TICKER}
     提取: open, close, high, low, volume, change_percent
   存入 cache/$TRADING_DAY/price_snapshot.json

5. Phase 2 搜索（仅变动 > price_change_threshold 的持仓）：
   获取 price_snapshot 中 change_percent > 2.0 或 < -2.0 的持仓
   FOR EACH:
     web_search: "{TICKER} analyst rating change"
     web_search: "{TICKER} earnings guidance news"
   追加到对应的 cache 文件

6. 关键文章抓取：
   从搜索结果中选 5-10 篇最重要的文章 URL
   FOR EACH url:
     WebFetch url（获取全文）
   存为 cache/$TRADING_DAY/fetched_articles.json
```

## Step 2: Summarizer 浓缩

```
1. 检查 summaries/$TRADING_DAY_digest.json 是否存在
2. 若存在 → 直接使用
3. 若不存在：
   - 读取 cache/$TRADING_DAY/ 下所有原始数据
   - 读取 prompts/summarizer.md 作为 system prompt
   - 调用 Agent (model: haiku, subagent_type: general-purpose)
     输入：将 {SEARCH_RESULTS} 替换为实际缓存数据
   - 解析输出的 JSON
   - 存入 summaries/$TRADING_DAY_digest.json
```

## Step 3: Loop — Executor → Verifier 循环

```
SET $ROUND = 1
SET $MAX_ROUNDS = settings.loop_max_rounds (默认 3)
SET $PASSED = false
SET $REPORT_CONTENT = ""

WHILE $ROUND <= $MAX_ROUNDS AND $PASSED == false:

  ┌─── Executor (Sonnet) ───┐
  │ 1. 读取 prompts/executor.md 作为 system prompt
  │ 2. 读取 summaries/$TRADING_DAY_digest.json
  │ 3. 读取 cache/$TRADING_DAY/price_snapshot.json
  │ 4. 读取 memory/history.json（若存在）
  │ 5. 读取 reports/report_{上一交易日}_user_notes.md（若存在）
  │ 6. 如果 $ROUND > 1：
  │    - 读取上一轮 Verifier 输出的 issue list
  │    - 仅修改 Verifier 标记的段落
  │    - 修改部分用 <!-- modified --> 标注
  │ 7. 调用 Agent (model: sonnet)
  │ 8. 输出保存为 reports/report_{$TRADING_DAY}_v{$ROUND}.md
  └──────────────────────────┘
           ↓
  ┌─── Verifier (Sonnet) ───┐
  │ 1. 读取 prompts/verifier.md 作为 system prompt
  │ 2. 读取 summaries/$TRADING_DAY_digest.json
  │ 3. 读取 reports/report_{$TRADING_DAY}_v{$ROUND}.md (Executor 输出)
  │ 4. 读取 cache/$TRADING_DAY/price_snapshot.json
  │ 5. 如果 $ROUND > 1：只检查 <!-- modified --> 段落
  │ 6. 调用 Agent (model: sonnet)
  │ 7. 解析输出的 JSON
  │ 8. 保存为 reports/report_{$TRADING_DAY}_v{$ROUND}_verdict.json
  └──────────────────────────┘
           ↓
  IF verdict.passed == true:
    $PASSED = true
    $REPORT_CONTENT = Executor 输出
    $CONFIDENCE = verdict.confidence
  ELSE:
    $ROUND += 1

END WHILE

IF $PASSED == false AND $ROUND > $MAX_ROUNDS:
  $REPORT_CONTENT = 最后一轮 Executor 输出
  $CONFIDENCE = "low"
```

## Step 4: 渲染输出

```
1. 读取 reports/template.html
2. 替换模板变量：
   - {{REPORT_DATE}} = $TRADING_DAY
   - {{REPORT_DATE_CN}} = 中文日期格式
   - {{CONFIDENCE_LEVEL}} = high/medium/low
   - {{CONFIDENCE_LABEL}} = 对应中文标签
   - {{TRADING_DAY}} = $TRADING_DAY
   - {{SEARCH_COUNT}} / {{FETCH_COUNT}} / {{LOOP_ROUNDS}} = 实际值
   - {{MARKET_TABLE}} = 从 price_snapshot 构建大盘表格 HTML
   - {{MARKET_ATTRIBUTION}} = 从报告提取大盘归因
   - {{STOCK_CARDS}} = 从报告构建个股卡片 HTML
   - {{WATCHLIST_SECTION}} = 报告中的"其他值得关注"部分
   - {{MISSING_DATA_SECTION}} = 缺失数据提示
   - {{GENERATED_AT}} = 当前北京时间
3. 保存为 reports/report_{$TRADING_DAY}_final.html
```

## Step 5: 收尾

```
1. 更新 memory/history.json：
   - 追加今日 report 摘要
   - 更新 trends（连续日数、趋势方向）
   - 保留最近 7 条

2. 清理旧缓存：
   - 删除 >7 天前的 cache/{日期}/ 目录
   - 删除对应的 summaries/{日期}_digest.json

3. 输出总结给用户：
   - 报告路径
   - 循环轮次
   - 置信度
   - Token 消耗（如果能获取）
```

## 关键纪律

1. **缓存优先**：Step 0 就要检查缓存，已有则跳过搜索
2. **不重复浓缩**：summaries/ 已有则跳过 Summarizer
3. **每轮保存快照**：不要覆盖之前轮次的版本
4. **从不丢弃输出**：$MAX_ROUNDS 后仍失败也要输出
5. **Yahoo Finance 可能被限制**：如果 WebFetch 失败，用 web_search "{TICKER} stock price {DATE}" 作为替代
