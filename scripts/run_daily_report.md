# Daily Report Orchestration Workflow

当用户说 "run daily report" 或 "运行日报" 时，按以下步骤执行。

**设计原则：第一性原理，不过度设计。每个环节只做必须做的事。**

## 变量解析
- `$DATE` = 今日日期 (YYYY-MM-DD)
- `$TRADING_DAY` = 最近一个美股交易日 (YYYY-MM-DD)
- `$PROJECT` = `H:\ClaudeCode_Coding\MyProject_New\AI US Stock Monitor`

## Step 0: 交易日判断

```
1. 读取 config/market_calendar.json
2. 计算 $TRADING_DAY：基于北京时间→美东时间映射
3. 周六/周日 → 输出 "今日休市（周末）"，终止
4. 假期 → 输出 "今日美股休市"，终止
```

## Step 1: 数据采集

```
1. 读取 config/portfolio.json 获取持仓列表

2. Phase 0 — 板块脉搏（⭐ 最先执行，解决个股搜索的行业盲区）
   - 统计 portfolio 中板块集中度（如 5/7 为半导体 → 核心板块）
   - web_search: 板块级行业新闻 2-3 条，不挂载到具体 ticker
     搜索词面向当前持仓集中度自动调整，典型：
       · "{核心板块} industry competitive landscape today"
       · "{核心板块} supply chain foundry capacity news"
       · "hyperscaler custom chip strategy Google Microsoft Amazon Meta"
   - 存入 cache/{日期}/sector_pulse_raw.json
   - 目的：捕获跨公司的行业级事件（竞争格局、供应链、技术路线、
           自研芯片替代等），这些事件影响多只持仓但不会出现在任何
           一只股的个股搜索结果中

3. Phase 1 — 基础搜索（全部持仓 + 大盘）：
   - 检查 cache/$TRADING_DAY/ 是否存在 → 跳过
   - web_search: 每只持仓 2 条 + 大盘 2 条
   - 价格: WebFetch Yahoo Finance
   - 存入 cache/{日期}/price_snapshot.json

4. Phase 2 — 深搜（仅变动 >2% 的持仓）：
   - 追加 analyst/earnings/sector 关键词搜索
```

## Step 2: Executor → Verifier Loop

**无 Summarizer。** Executor 和 Verifier 直接消费原始搜索结果。理由：7 只持仓的数据量不大，加浓缩层增加信息损失和一次 API 调用，不符合第一性原理。

```
SET $ROUND = 1, $MAX_ROUNDS = 3, $PASSED = false

WHILE $ROUND <= $MAX_ROUNDS AND $PASSED == false:

  ┌─── Executor (Sonnet) ───┐
  │ 1. 读取 prompts/executor.md
  │ 2. 读取 cache/$TRADING_DAY/ 下所有搜索原始数据（直接读原文）
  │ 3. 读取 price_snapshot.json
  │ 4. 读取 memory/history.json + 上期 user_notes.md
  │ 5. 如果 $ROUND > 1：仅修改 Verifier 标注段落
  │ 6. 生成 Markdown 报告
  │ 7. 保存 reports/report_{$TRADING_DAY}_v{$ROUND}.md
  └──────────────────────────┘
           ↓
  ┌─── Verifier (Sonnet) ───┐
  │ 1. 读取 prompts/verifier.md
  │ 2. 读取原始搜索数据（同 Executor 数据源）
  │ 3. 读取 Executor 输出的 Markdown 报告
  │ 4. 读取 price_snapshot.json
  │ 5. 第 2+ 轮仅检查 modified 段落
  │ 6. 逐条审查，输出问题清单 JSON
  │ 7. 保存 verdict JSON
  └──────────────────────────┘
           ↓
  IF verdict.passed → $PASSED = true
  ELSE → $ROUND += 1

END WHILE
```

## Step 3: 渲染输出（模板替换，非 AI 生成）

```
1. 读取 reports/template.html（HTML 壳子）
2. 读取 Executor 最终输出的 Markdown 报告
3. 将 Markdown 内容注入模板的 {{REPORT_BODY}} 占位符
4. 替换元数据变量：日期、置信度、搜索统计等
5. 保存 reports/report_{$TRADING_DAY}_final.html

※ 不使用 Agent 生成 HTML。模板是固定的，只有内容在变。
   用 Claude Code 直接执行字符串替换即可。
```

## Step 4: 收尾

```
1. 更新 memory/history.json
2. 清理 >7 天旧缓存
3. 输出总结给用户
```

## 关键纪律
1. **缓存优先** — 同日不重复搜索
2. **精简数据流** — 搜索结果直接喂 Agent，无中间浓缩层
3. **模板渲染** — HTML 壳子 + Markdown 内容，不让 AI 做格式化
4. **每轮保存快照** — 不覆盖历史版本
5. **从不丢弃输出** — 失败也输出 + 置信度标注
