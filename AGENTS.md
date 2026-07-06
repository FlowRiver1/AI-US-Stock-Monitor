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

### 架构变更 (2026-06-29)
- [x] 去 Summarizer：Executor/Verifier 直接读原始搜索数据，减少信息损失
- [x] HTML 模板渲染：不用 AI 生成 HTML，改为模板替换，每次省 ~$0.20-0.30
- [x] 新增"第一性原理"设计原则：不过度设计，文件优于服务
- [x] Executor prompt 新增第 7 条"跨股票因果关联"规则
- [x] 修复报告导航按钮永久置灰 bug

## 项目定位
单人使用、本地运行、零部署成本的美股持仓每日归因分析 Agent。
核心实践 Loop Engineering：数据采集 → Executor 生成 → Verifier 逐条审查 → 不通过则自动修正循环（最多 3 轮）。精简架构，不过度设计。

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
- Executor：Sonnet（生成报告）
- Verifier：Sonnet（审查修正）
- 月度预算：$6-$18
- HTML 渲染：模板替换（非 AI 生成），零成本

## 核心设计原则（第一性原理）
1. **不过度设计** — 能直接做的事不加中间层。7 只股票的数据量不需要 Summarizer 浓缩
2. **模板优于生成** — HTML 壳子是固定的，只有内容在变。不让 AI 做格式化工作
3. **查缓存再搜索** — 同日缓存复用，不重复浪费
4. **不丢弃输出** — 校验不通过也输出 + 置信度标注
5. **文件优于服务** — 能不启动后台服务就不启动。持仓管理是例外（用户明确要求保留）

## 验证命令
- 跑日报：告诉我 "run daily report"
- 查成本：查看 reports/ 下生成的报告中的 token 消耗记录
- 查缓存：ls cache/ 看目录结构

## 红线
- 不修改 .env、密钥、token（本项目无这些）
- 不安装全局依赖
- 不改动 prompts/ 目录下的 prompt 文件（除非明确要求调优）
- 不删除 reports/ 下的历史报告
