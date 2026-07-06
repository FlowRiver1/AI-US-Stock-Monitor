export type ProviderId = "openai" | "deepseek" | "kimi" | "claude" | "minimax" | "mimo";

export type Weight = "high" | "medium" | "low";

export type AppStep = "intro" | "setup" | "portfolio" | "report";

export type ProviderOption = {
  id: ProviderId;
  label: string;
  baseUrl: string;
  model: string;
};

export type ApiConfigDraft = {
  provider: ProviderId;
  baseUrl: string;
  model: string;
  apiKey: string;
  connected: boolean;
};

export type Holding = {
  ticker: string;
  name: string;
  sector: string;
  weight: Weight;
};

export type Attribution = {
  label: "主要原因" | "次要因素" | "积极对冲" | "待确认";
  title: string;
  explanation: string;
  sourceName: string;
  sourceUrl: string;
};

export type SampleReport = {
  date: string;
  title: string;
  summary: string;
  integrity: {
    searchCount: number;
    articleCount: number;
    loopRounds: number;
    coverage: string;
    confidence: "high" | "medium" | "low";
  };
  indices: Array<{
    name: string;
    close: string;
    change: string;
    driver: string;
  }>;
  marketReasons: Attribution[];
  stocks: Array<{
    ticker: string;
    name: string;
    sector: string;
    change: string;
    priceLine: string;
    attributions: Attribution[];
    observation: string;
  }>;
};
