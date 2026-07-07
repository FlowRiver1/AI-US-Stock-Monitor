# 📊 AI US Stock Monitor

面向个人投资者的美股持仓日报工具。配置模型 API 和持仓后，系统自动采集市场数据，通过 AI 多轮校验生成专业归因日报。

## ✨ 核心特性

- **AI 驱动的归因分析** — Executor 生成报告 → Verifier 逐条审查 → 不通过自动修正（最多 3 轮）
- **行业层归因优先** — Phase 0 板块脉搏先于个股搜索，捕获跨公司的行业级事件
- **跨股票因果关联** — 自动识别持仓间的因果链（上游→下游、板块联动）
- **内置 Paper 设计系统** — 简洁、纸白风格，涨红色跌绿色（中国习惯）
- **一键部署** — 纯前端可发布到飞书妙搭，零成本托管

## 🚀 快速开始

### 方式一：完整功能（本地运行）

```bash
# 1. 安装依赖
cd scripts/server
npm install

# 2. 启动服务
node server.js

# 3. 打开浏览器
# http://localhost:8765
```

或双击项目根目录的 `start.ps1` 一键启动。

### 方式二：仅浏览 UI（在线体验）

打开 [妙搭链接](https://vwxx9iaco8c.aiforce.cloud/app/app_179njw8pczs) 浏览界面（日报生成需本地服务器）。

## 📖 使用步骤

1. **配置 API** — 填入 DeepSeek API Key（支持 Anthropic 兼容端点）
2. **添加持仓** — 输入美股代码，系统自动补全公司名和行业
3. **生成日报** — 一键触发完整流程：
   - Phase 0 板块脉搏（行业级新闻搜索）
   - Phase 1 基础数据采集（价格 + 新闻）
   - Phase 2 深搜（变动 >2% 的持仓）
   - Executor 生成 Markdown 报告
   - Verifier 7 项校验标准审查
   - 模板渲染 HTML 输出

## 🏗️ 架构

```
浏览器 (Paper SPA)
    │
    ▼ HTTP
本地服务器 (Node.js)
    │
    ├── Yahoo Finance (价格 + 新闻)
    └── DeepSeek API (Executor + Verifier)
         │
         ▼
    reports/*.html (Paper 风格日报)
```

## 📁 目录结构

```
config/          ← 持仓配置、交易日历
prompts/         ← Executor/Verifier prompt 模板
scripts/server/  ← Node.js 日报引擎
  lib/
    pipeline.js        ← 日报生成管道（Executor→Verifier 循环）
    report-parser.js   ← Markdown→HTML 语义解析器
    deepseek-client.js ← AI API 客户端
    yahoo-finance.js   ← 市场数据采集
public/          ← 前端 SPA（Paper 设计系统）
reports/         ← 生成的日报 HTML
memory/          ← 跨日历史数据
docs/            ← 部署文档
```

## 🔧 技术栈

| 层 | 技术 |
|---|---|
| 前端 | 纯 HTML/CSS/JS（Paper 编辑风格） |
| 后端 | Node.js + Express |
| AI 引擎 | DeepSeek v4 Pro（Anthropic 兼容端点） |
| 数据源 | Yahoo Finance（免费、免 API Key） |
| 部署 | 飞书妙搭（免费静态托管） |

## 📊 报告示例

日报包含以下模块：

- **大盘概览** — 三大指数涨跌 + 归因分析
- **板块脉搏** — 行业级事件（竞争格局、供应链变化）
- **持仓个股** — 每只股票的归因卡片：
  - 主要原因 / 次要因素 / 积极对冲 标签
  - 来源链接
  - 跨股关联标注
  - 趋势观察
- **其他值得关注** — 板块异动 + 因果链
- **数据完整性声明** — 搜索量、置信度、校验轮次

## 🎨 设计

采用 Paper 编辑风格（纸白 + 墨绿），参考 Linear / Notion 的信息架构理念：
- 涨红色、跌绿色（中国市场习惯）
- 等宽字体标签、细线分隔、大面积留白
- 响应式布局，支持移动端

## 📄 许可

MIT License — 自由使用、修改、分享。

## 🔗 链接

- 在线体验：https://vwxx9iaco8c.aiforce.cloud/app/app_179njw8pczs
- GitHub：https://github.com/FlowRiver1/AI-US-Stock-Monitor
- 部署文档：[docs/deploy-miaoda.md](docs/deploy-miaoda.md)
