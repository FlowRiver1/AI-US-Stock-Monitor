# AI US Stock Monitor UI Only

这是从当前 Web MVP 中单独抽离出来的纯前端 UI 方案，目的是给后续开发继续复用界面设计。

## 重要边界

- 这里不包含任何日报获取逻辑。
- 这里不包含行情抓取、新闻搜索、模型调用、Executor/Verifier、报告质量校验。
- 这里不包含 `/api/*` 后端接口。
- 点击“生成日报”只展示待接入提示，不会调用网络。

后续正确开发方向应该是：保留原项目的本地 Loop Engineering 日报链路，只把这个 UI 作为外壳接入：

- API Key 配置 UI → 传给原本地运行流程或写入用户本地配置。
- 持仓管理 UI → 写入原项目 `config/portfolio.json`。
- 生成日报按钮 → 触发原项目 `scripts/run_daily_report.*` 或等价入口。
- 报告展示区 → 读取原项目 `reports/report_YYYY-MM-DD_final.html` 或转换后的结构化结果。

## 文件说明

- `app/page.tsx`：完整纯前端页面，包含首页、说明弹窗、三步引导、配置面板、持仓管理、报告预览。
- `app/globals.css`：视觉样式，浅色、简约、金融工具风格。
- `lib/ui-data.ts`：供应商、默认持仓、示例报告等 mock 数据。
- `lib/ui-types.ts`：仅用于 UI 的类型定义。

## 运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 给后续 AI 的提醒

不要用这里的 mock 报告替代原日报逻辑。这个目录只解决产品化 UI 和用户录入流程，核心日报能力必须接回原项目已有实现。
