# AI US Stock Monitor — 项目约定

## 📍 当前进度 (2026-06-26)

### 已完成
- [x] 需求梳理 & V3 方案定稿：Summarizer → Executor ↔ Verifier 循环架构
- [x] 成本优化设计：Summarizer 浓缩 + 模型分层，月度 $6-18，实测单次 ~$0.58
- [x] 项目骨架 + 三个 Agent Prompt（summarizer/executor/verifier）
- [x] H5 报告模板（暗色主题、响应式、涨跌色标注、日期导航栏）
- [x] 美股假期配置（2026 全年）
- [x] **首次全流程测试通过** — 2026-06-25 数据，2 轮循环修正（High 置信度）
- [x] Loop Engineering 验证：Verifier 发现"美光暴跌→暴涨"事实错误 → Executor 修正 → 通过
- [x] 持仓管理：PowerShell GUI 工具 + Web UI（增删即时生效写入 portfolio.json）
- [x] 本地 API 服务 `portfolio_server.ps1`（localhost:8765，CORS 支持）
- [x] 报告总览页 `reports/index.html`（日期列表、置信度统计）
- [x] 股票自动查询（~300 只内置数据库，输入代码自动填入公司名/行业）
- [x] 当前持仓：NVDA / TSLA / GOOGL / MU / AVGO / AAOI / MRVL（7 只）
- [x] 已推送 GitHub：https://github.com/FlowRiver1/AI-US-Stock-Monitor

### 下次继续
- [ ] 手动跑几天日报，观察归因准确性和循环触发频率
- [ ] 根据实际效果调优 Prompt（executor/verifier）
- [ ] 设置每日 cron 自动触发
- [ ] 连续跑 3-5 天，积累 history.json 跨日趋势数据
- [ ] Phase 2：H5 图表（Chart.js）+ Windows 桌面通知
- [ ] Phase 3：X 热点发现 / 未持仓异动股票

## 项目定位
单人使用、本地运行、零部署成本的美股持仓每日归因分析 Agent。
核心实践 Loop Engineering：Summarizer 浓缩 → Executor 生成 → Verifier 逐条审查 → 不通过则自动修正循环（最多 3 轮）。

## 目录约定
```
config/          ← 用户编辑的配置（portfolio/settings/calendar）
prompts/         ← Agent prompt 模板（summarizer/executor/verifier）
scripts/         ← 编排脚本（run_daily_report.ps1）
cache/           ← 每日搜索原始缓存（按日期分目录，7天自动清理）
summaries/       ← Summarizer 浓缩产物（按日期命名）
memory/          ← 跨日记忆（history.json）
reports/         ← 日报输出（HTML + user_notes）
```

## 命名约定
- 缓存文件：`{YYYY-MM-DD}/{TICKER}_search_raw.json`
- 摘要文件：`{YYYY-MM-DD}_digest.json`
- 报告文件：`report_{YYYY-MM-DD}_final.html`
- 版本快照：`report_{YYYY-MM-DD}_v{N}.md`
- 纠错记录：`report_{YYYY-MM-DD}_user_notes.md`

## 运行方式
- 自动触发：cron 每日 06:30 北京时间
- 手动触发：告诉我 "run daily report" 或 "运行日报"
- 调试触发：告诉我 "run daily report --tickers NVDA,AAPL" 只分析特定持仓

## 模型分层（成本控制）
- Summarizer：Haiku（$0.04/次，一次性）
- Executor：Sonnet（$0.15/次/轮）
- Verifier：Sonnet（$0.12/次/轮）
- 月度预算：$6-$18

## 核心设计原则
1. 肥数据不进 Agent — 搜索结果必须先经 Summarizer 浓缩
2. 查缓存再搜索 — 同日缓存复用，不重复浪费
3. 不丢弃输出 — 就算校验不通过也输出 + 置信度标注
4. 缓存自动清理 — 7 天前数据自动删除

## 验证命令
- 跑日报：告诉我 "run daily report"
- 查成本：查看 reports/ 下生成的报告中的 token 消耗记录
- 查缓存：ls cache/ 看目录结构

## 红线
- 不修改 .env、密钥、token（本项目无这些）
- 不安装全局依赖
- 不改动 prompts/ 目录下的 prompt 文件（除非明确要求调优）
- 不删除 reports/ 下的历史报告
