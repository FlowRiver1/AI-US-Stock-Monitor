# AI US Stock Monitor — 项目约定

## 📍 当前进度 (2026-07-07)

### 已完成
- [x] 需求梳理 & V3 方案定稿 → 产品化改造完成
- [x] 所有核心能力：Executor↔Verifier 循环、Phase 0 板块脉搏、跨股关联
- [x] **Node.js 独立日报引擎** — 不依赖 Claude Code，用户自带 API Key
- [x] **Paper 设计系统** — 前端 SPA + 报告模板统一纸白风格
- [x] **飞书妙搭部署** — 免登陆公开访问 (app_179njw8pczs)
- [x] **README.md** — 完整项目介绍 + 架构文档
- [x] 当前持仓：NVDA / TSLA / GOOGL / MU / AVGO / AAOI / MRVL（7 只）
- [x] 已推送 GitHub：https://github.com/FlowRiver1/AI-US-Stock-Monitor

### 在线体验
- 妙搭：https://vwxx9iaco8c.aiforce.cloud/app/app_179njw8pczs
- 本地：`start.ps1` → http://localhost:8765
- [x] 持仓管理：PowerShell GUI + Web UI（localhost:8765）
- [x] 报告总览页 `reports/index.html`
- [x] 股票自动查询数据库（~300 只）
- [x] 当前持仓：NVDA / TSLA / GOOGL / MU / AVGO / AAOI / MRVL（7 只）
- [x] 去 Summarizer：Executor/Verifier 直接读原始搜索数据
- [x] HTML 模板渲染替代 AI 生成（每次省 ~$0.20-0.30）
- [x] Executor prompt 新增跨股票因果关联规则（第 7 条）
- [x] 修复报告导航按钮永久置灰 bug
- [x] **2026-07-02 日报生成**（SOX 两日暴跌 11%+，7 只持仓全跌，High 置信度 1 轮通过）
- [x] **Phase 0「板块脉搏」行业搜索**：数据采集从一维（个股）升级为二维（个股 + 行业）
- [x] **Executor prompt 新增第 8 条「行业层归因优先校验」**规则
- [x] **项目级权限预授权**：WebSearch/WebFetch/Bash/Write/Edit/Read/Glob/Grep 免确认
- [x] 已推送 GitHub：https://github.com/FlowRiver1/AI-US-Stock-Monitor

### 下次继续
- [ ] 观察归因准确性和循环触发频率（发现行业新闻遗漏问题，已通过 Phase 0 修复）
- [ ] 设置每日 cron 自动触发
- [ ] 连续跑 3-5 天，积累 history.json 跨日趋势数据
- [ ] Phase 2：H5 图表（Chart.js）+ Windows 桌面通知
- [ ] **产品化改造**：Web 工具 + API Key 配置 + 一键生成（见下方计划）

### 产品化改造计划 (2026-07-03 启动)
- [ ] 方案设计：Hybrid SPA + 本地代理服务器（Node.js）
- [ ] 备份当前版本（git tag v1.0-pre-productization）
- [ ] 服务器升级：portfolio_server.ps1 → Node.js server（API 代理 + AI 编排）
- [ ] 前端重设计：Linear/Notion 美学 SPA（落地页 → 设置向导 → 主页 → 日报）
- [ ] AI 管道：Yahoo Finance 数据 + DeepSeek Executor → Verifier 循环
- [ ] 多用户支持：每人独立 API Key + 独立持仓

## 📝 完整变更日志

### 2026-07-03 — 日报生成 + 架构改进 + 产品化启动
**运行 2026-07-02 日报：**
- 7 只持仓全跌，SOX 两日暴跌 11%+，Meta 出售 AI 算力触发全链恐慌
- 6 月非农 +5.7 万远低预期，道指创历史新高 52,900
- 1 轮校验通过，High 置信度
- 生成文件：`reports/report_2026-07-02_final.html`（33KB）、v1.md、verdict_v1.json
- 更新 `memory/history.json`（新增 07-02 条目）、`reports/index.html`（4 份报告）

**发现行业新闻遗漏问题：**
- 用户反馈：Anthropic+三星合作自研芯片的新闻未被覆盖
- 根因分析：数据采集仅按个股维度搜索，跨公司的行业级事件成为盲区
- 影响：5/7 持仓为半导体，行业层是每日最大波动来源，遗漏导致报告可信度下降

**架构改进 — Phase 0「板块脉搏」：**
- `scripts/run_daily_report.md`：新增 Phase 0 行业搜索，在个股搜索之前执行
  - 统计板块集中度 → 生成行业级搜索词（2-3 条）
  - 存入 `cache/{日期}/sector_pulse_raw.json`
  - 目的：捕获跨公司的竞争格局、供应链、技术路线变化
- `prompts/executor.md`：新增第 8 条规则「行业层归因优先校验」
  - 分析持仓前先通读 Phase 0 行业数据
  - 行业事件必须显式出现在所有受影响持仓归因中
  - 归因顺序强制：行业层第一 → 个股层第二
  - 反例检查：SOX 跌 5% 只解释了一件事 → 大概率漏了
- 成本影响：每日 +2-3 条搜索，月度 +$0.20

**权限优化：**
- `.claude/settings.local.json`：预授权 WebSearch/WebFetch/Bash/Write/Edit/Read/Glob/Grep
- 日报流程弹窗从 ~20 次降到 0 次
- 红线操作（git push、删文件、改 .env 等）仍依赖 CLAUDE.md 指令约束

### 2026-06-29 — 架构精简
- 去 Summarizer：Executor/Verifier 直接读原始搜索数据
- HTML 模板渲染：不用 AI 生成 HTML，每次省 ~$0.20-0.30
- Executor prompt 新增第 7 条「跨股票因果关联」规则
- 修复报告导航按钮永久置灰 bug
- 新增第一性原理设计原则

### 2026-06-25/26 — 初始开发
- 需求梳理 & V3 方案定稿
- 项目骨架 + 三个 Agent Prompt
- H5 报告模板 + 美股假期配置
- 首次全流程测试通过
- 持仓管理工具（PowerShell GUI + Web UI）
- GitHub 推送
