# AI US Stock Monitor — 项目约定

## 📍 当前进度 (2026-06-25)

### 已完成
- [x] 需求梳理 & 方案设计（brainstorming 完成，见 `docs/superpowers/specs/` 下的设计文档）
- [x] V3 方案定稿：Summarizer → Executor ↔ Verifier 循环架构
- [x] 成本优化设计：Summarizer 浓缩 + 模型分层，月度 $6-18
- [x] 项目骨架搭建（config/prompts/scripts/cache/summaries/memory/reports）
- [x] 持仓配置：8 只美股（NVDA/AAPL/MSFT/TSLA/AMZN/AVGO/META/AMD）
- [x] 三个 Prompt 编写：Summarizer(Haiku) / Executor(Sonnet) / Verifier(Sonnet)
- [x] H5 报告 HTML 模板（暗色主题、响应式、涨跌色标注）
- [x] 编排流程文档 `scripts/run_daily_report.md`
- [x] 美股假期配置 `config/market_calendar.json`（2026 全年）

### 待完成（明天继续）
- [ ] **首次全流程测试** — 告诉我 "run daily report" 或 "运行日报"
- [ ] 验证数据采集是否正常（web_search + WebFetch）
- [ ] 验证 Summarizer 浓缩质量
- [ ] 验证 Executor → Verifier 循环是否触发多轮修正
- [ ] 验证 H5 报告渲染效果
- [ ] 调优 Prompt（根据首次测试结果）
- [ ] 设置每日 06:30 cron 自动触发
- [ ] 连续跑 3-5 天，积累 history.json 趋势数据

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
