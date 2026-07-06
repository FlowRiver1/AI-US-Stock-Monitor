import type { Holding, ProviderOption, SampleReport } from "./ui-types";

export const PROVIDERS: ProviderOption[] = [
  { id: "openai", label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4.1-mini" },
  { id: "deepseek", label: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  { id: "kimi", label: "Kimi", baseUrl: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k" },
  { id: "claude", label: "Claude", baseUrl: "https://api.anthropic.com/v1", model: "claude-sonnet-4-20250514" },
  { id: "minimax", label: "MiniMax", baseUrl: "https://api.minimax.chat/v1", model: "MiniMax-M1" },
  { id: "mimo", label: "Mimo", baseUrl: "https://api.mimo.ai/v1", model: "mimo-chat" }
];

export const STOCKS: Record<string, Omit<Holding, "ticker" | "weight">> = {
  AAPL: { name: "Apple Inc.", sector: "消费科技" },
  AAOI: { name: "Applied Optoelectronics Inc.", sector: "光通信" },
  AMD: { name: "Advanced Micro Devices Inc.", sector: "半导体" },
  AMZN: { name: "Amazon.com Inc.", sector: "云计算/电商" },
  AVGO: { name: "Broadcom Inc.", sector: "半导体" },
  GOOGL: { name: "Alphabet Inc.", sector: "互联网" },
  META: { name: "Meta Platforms Inc.", sector: "社交媒体" },
  MRVL: { name: "Marvell Technology Inc.", sector: "半导体" },
  MSFT: { name: "Microsoft Corporation", sector: "企业软件" },
  MU: { name: "Micron Technology Inc.", sector: "半导体" },
  NVDA: { name: "NVIDIA Corporation", sector: "半导体" },
  PLTR: { name: "Palantir Technologies Inc.", sector: "企业软件" },
  TSLA: { name: "Tesla Inc.", sector: "电动车" }
};

export const DEFAULT_PORTFOLIO: Holding[] = [
  { ticker: "NVDA", name: "NVIDIA Corporation", sector: "半导体", weight: "high" },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "电动车", weight: "high" },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "互联网", weight: "medium" },
  { ticker: "MU", name: "Micron Technology Inc.", sector: "半导体", weight: "medium" }
];

export const SAMPLE_REPORT: SampleReport = {
  date: "示例报告",
  title: "今日归因报告",
  summary: "这里展示原日报生成结果的承载样式。真实内容应由原本地 Loop Engineering 流程生成，前端只负责读取和呈现。",
  integrity: {
    searchCount: 19,
    articleCount: 8,
    loopRounds: 2,
    coverage: "盘后公开数据窗口",
    confidence: "high"
  },
  indices: [
    { name: "NASDAQ Composite", close: "25,832.67", change: "-0.80%", driver: "半导体板块承压，AI 算力资本开支担忧升温" },
    { name: "S&P 500", close: "7,483.24", change: "+0.00%", driver: "科技下跌与防御板块上涨抵消" },
    { name: "Dow Jones Industrial Average", close: "52,900.07", change: "+1.14%", driver: "资金流向价值/防御板块" }
  ],
  marketReasons: [
    {
      label: "主要原因",
      title: "半导体板块第二轮暴跌，资金从 AI 链条转向防御",
      explanation: "示例：SOX 连续下跌，市场重新评估 AI 资本开支、定制芯片竞争和存储需求变化对估值的影响。",
      sourceName: "原报告来源位",
      sourceUrl: "#"
    },
    {
      label: "次要因素",
      title: "宏观数据影响利率预期",
      explanation: "示例：就业、利率和美元走势改变市场风险偏好，进而影响成长股估值。",
      sourceName: "原报告来源位",
      sourceUrl: "#"
    }
  ],
  stocks: [
    {
      ticker: "NVDA",
      name: "NVIDIA Corporation",
      sector: "半导体",
      change: "-1.40%",
      priceLine: "开盘 $197.58 · 收盘 $194.83 · 最低 $192.35 · 仓位：高",
      attributions: [
        {
          label: "主要原因",
          title: "行业层冲击优先展示",
          explanation: "真实报告应把跨股票、跨公司的行业事件挂到所有受影响持仓上，而不是只展示 NVDA 个股新闻。",
          sourceName: "原报告来源位",
          sourceUrl: "#"
        },
        {
          label: "次要因素",
          title: "个股层消息补充解释",
          explanation: "公司新闻、分析师评级、产品和订单变化作为第二层原因补充。",
          sourceName: "原报告来源位",
          sourceUrl: "#"
        }
      ],
      observation: "示例观察：前端样式保留归因层级、来源链接和价格线，不参与生成结论。"
    },
    {
      ticker: "MU",
      name: "Micron Technology Inc.",
      sector: "半导体",
      change: "-5.50%",
      priceLine: "开盘 $1,032.28 · 收盘 $975.56 · 最低 $950.28 · 仓位：中",
      attributions: [
        {
          label: "主要原因",
          title: "存储/半导体板块系统性抛售",
          explanation: "真实报告应明确说明板块联动、同业表现和该股票相对跌幅。",
          sourceName: "原报告来源位",
          sourceUrl: "#"
        }
      ],
      observation: "示例观察：异常大跌需要更高密度来源和更具体价格表现。"
    }
  ]
};
