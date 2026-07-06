"use client";

import { FormEvent, useMemo, useState } from "react";
import { DEFAULT_PORTFOLIO, PROVIDERS, SAMPLE_REPORT, STOCKS } from "@/lib/ui-data";
import type { ApiConfigDraft, AppStep, Holding, ProviderId, SampleReport, Weight } from "@/lib/ui-types";

const firstProvider = PROVIDERS[0];

const INITIAL_CONFIG: ApiConfigDraft = {
  provider: firstProvider.id,
  baseUrl: firstProvider.baseUrl,
  model: firstProvider.model,
  apiKey: "",
  connected: false
};

const steps: Array<{ id: Exclude<AppStep, "intro">; label: string; title: string; body: string }> = [
  {
    id: "setup",
    label: "配置 API",
    title: "先配置你的模型 API",
    body: "首次使用时录入供应商、Base URL、模型名和 API Key。后续真实开发时，这里应接入原流程的本地安全配置。"
  },
  {
    id: "portfolio",
    label: "管理持仓",
    title: "添加需要分析的美股持仓",
    body: "用户只需要输入股票代码和关注程度。真实开发时，这里应写入原项目的 config/portfolio.json。"
  },
  {
    id: "report",
    label: "生成日报",
    title: "触发原本地日报流程并展示结果",
    body: "这里不生成日报，只展示 UI 承载方式。真实开发时必须调用原 Loop Engineering 链路。"
  }
];

export default function Page() {
  const [activeStep, setActiveStep] = useState<AppStep>("intro");
  const [showModal, setShowModal] = useState(false);
  const [config, setConfig] = useState<ApiConfigDraft>(INITIAL_CONFIG);
  const [portfolio, setPortfolio] = useState<Holding[]>(DEFAULT_PORTFOLIO);
  const [tickerInput, setTickerInput] = useState("");
  const [weightInput, setWeightInput] = useState<Weight>("medium");
  const [message, setMessage] = useState("这是纯前端 UI 版本，未接入任何行情、新闻或模型接口。");

  const progress = useMemo(() => {
    return Number(config.connected) + Number(portfolio.length > 0);
  }, [config.connected, portfolio.length]);

  function chooseProvider(providerId: ProviderId) {
    const provider = PROVIDERS.find((item) => item.id === providerId) || firstProvider;
    setConfig({
      provider: provider.id,
      baseUrl: provider.baseUrl,
      model: provider.model,
      apiKey: "",
      connected: false
    });
    setMessage(`已切换到 ${provider.label}。这是 UI 状态变更，没有发起连接测试。`);
  }

  function saveApiConfig() {
    setConfig((current) => ({ ...current, connected: true }));
    setActiveStep("portfolio");
    setMessage("UI 已标记 API 配置完成。真实开发时，这一步应调用原项目需要的本地配置写入逻辑。");
  }

  function addHolding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ticker = tickerInput.trim().toUpperCase();
    if (!/^[A-Z]{1,5}$/.test(ticker)) {
      setMessage("请输入 1-5 位美股代码。");
      return;
    }
    if (portfolio.some((item) => item.ticker === ticker)) {
      setMessage(`${ticker} 已经在持仓列表中。`);
      return;
    }

    const found = STOCKS[ticker];
    setPortfolio((current) => [
      ...current,
      {
        ticker,
        name: found?.name || ticker,
        sector: found?.sector || "其他",
        weight: weightInput
      }
    ]);
    setTickerInput("");
    setMessage(`${ticker} 已添加。真实开发时，这里应同步写入 config/portfolio.json。`);
  }

  function simulateGenerate() {
    setActiveStep("report");
    setMessage("生成日报按钮已触发。这里故意不调用接口，后续请接入原 scripts/run_daily_report.* 流程。");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <button className="brand" onClick={() => setActiveStep("intro")}>
          <span className="brandMark">AI</span>
          <span>AI US Stock Monitor</span>
        </button>
        <div className="topActions">
          <span className={config.connected ? "status good" : "status"}>
            {config.connected ? "API 配置完成" : "API 未配置"}
          </span>
          <button className="ghostButton" onClick={() => setShowModal(true)}>
            它如何工作
          </button>
        </div>
      </header>

      {activeStep === "intro" ? (
        <Intro onStart={() => setActiveStep(config.connected ? "portfolio" : "setup")} onExplain={() => setShowModal(true)} />
      ) : (
        <section className="workspace">
          <aside className="rail">
            <div>
              <span className="eyebrow">Guided Setup</span>
              <h2>还差 {Math.max(0, 2 - progress)} 步可交给原流程</h2>
              <p>这个版本只负责用户录入与界面承载。日报生成能力必须由原本地链路提供。</p>
            </div>
            <div className="stepList">
              {steps.map((step) => (
                <button
                  className={activeStep === step.id ? "stepCard active" : "stepCard"}
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                >
                  <span>{step.id === "setup" && config.connected ? "已完成" : step.id === "portfolio" && portfolio.length ? "已完成" : "待处理"}</span>
                  <strong>{step.label}</strong>
                </button>
              ))}
            </div>
            <div className="railNote">
              <strong>交接边界</strong>
              <span>UI 可以复用；报告采集、Executor、Verifier、HTML 输出都不要复用这个目录里的 mock。</span>
            </div>
          </aside>

          <section className="stage">
            <StageHeader activeStep={activeStep as Exclude<AppStep, "intro">} onBack={() => setActiveStep("intro")} />
            <div className="notice">{message}</div>
            {activeStep === "setup" && (
              <SetupPanel config={config} setConfig={setConfig} chooseProvider={chooseProvider} saveApiConfig={saveApiConfig} />
            )}
            {activeStep === "portfolio" && (
              <PortfolioPanel
                portfolio={portfolio}
                setPortfolio={setPortfolio}
                tickerInput={tickerInput}
                setTickerInput={setTickerInput}
                weightInput={weightInput}
                setWeightInput={setWeightInput}
                addHolding={addHolding}
                goReport={() => setActiveStep("report")}
              />
            )}
            {activeStep === "report" && (
              <ReportPanel portfolio={portfolio} onGenerate={simulateGenerate} sampleReport={SAMPLE_REPORT} />
            )}
          </section>
        </section>
      )}

      {showModal && <HowItWorksModal onClose={() => setShowModal(false)} onStart={() => {
        setShowModal(false);
        setActiveStep(config.connected ? "portfolio" : "setup");
      }} />}
    </main>
  );
}

function Intro({ onStart, onExplain }: { onStart: () => void; onExplain: () => void }) {
  return (
    <section className="hero">
      <div className="heroCopy">
        <span className="eyebrow">Loop Engineering Daily Brief</span>
        <h1>AI US Stock Monitor</h1>
        <p>
          面向初级美股用户的持仓日报工具。用户配置自己的模型 API 和持仓后，系统应调用原本地日报流程，
          输出大盘波动、行业联动、个股归因、来源链接和校验结果。
        </p>
        <div className="actions">
          <button className="primaryButton" onClick={onStart}>我要使用</button>
          <button className="secondaryButton" onClick={onExplain}>了解它如何工作</button>
        </div>
      </div>
      <HeroVisual />
      <div className="introStrip">
        <div><strong>1. 用户配置 API</strong><span>录入模型供应商、Base URL、模型名和 API Key。</span></div>
        <div><strong>2. 用户维护持仓</strong><span>新增、删除 ticker，确认关注程度和行业信息。</span></div>
        <div><strong>3. 原流程生成日报</strong><span>由原本地 Loop Engineering 链路负责，不在 UI 层重写。</span></div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="heroVisual" aria-hidden="true">
      <div className="browserDots"><span /><span /><span /></div>
      <div className="visualGrid">
        <div className="visualPane">
          <h3>配置状态</h3>
          <div className="miniRow"><span>DeepSeek</span><strong>已配置</strong></div>
          <div className="miniRow"><span>Portfolio</span><strong>7 只</strong></div>
          <div className="miniRow"><span>Report flow</span><strong>待接入</strong></div>
        </div>
        <div className="visualPane">
          <h3>报告结构</h3>
          <div className="miniRow"><span>大盘概览</span><strong>来源可点</strong></div>
          <div className="miniRow"><span>板块脉搏</span><strong>优先归因</strong></div>
          <div className="miniRow"><span>持仓个股</span><strong>逐只解释</strong></div>
        </div>
      </div>
      <div className="reportMini">
        <span>NVDA</span>
        <strong className="negative">-1.40%</strong>
        <p>半导体板块联动 → 个股消息 → 来源链接 → Verifier 校验</p>
      </div>
    </div>
  );
}

function HowItWorksModal({ onClose, onStart }: { onClose: () => void; onStart: () => void }) {
  return (
    <div className="modalBackdrop" onClick={onClose}>
      <section className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modalTop">
          <span className="eyebrow">Product Overview</span>
          <button className="closeButton" onClick={onClose} aria-label="关闭">x</button>
        </div>
        <h2>它是做什么的？</h2>
        <p className="lead">
          它不是交易软件，而是一个每日复盘助手：把用户持仓、大盘变化、行业新闻、公司消息和模型校验整理成一份中文归因日报。
        </p>
        <div className="explainGrid">
          <article><span>01</span><h3>用户输入</h3><p>用户提供模型 API 和持仓列表。UI 只负责录入、编辑和引导。</p></article>
          <article><span>02</span><h3>原流程执行</h3><p>后端应触发原项目的数据采集、Executor、Verifier 循环和 HTML 报告模板。</p></article>
          <article><span>03</span><h3>结果展示</h3><p>前端读取原报告，展示大盘归因、板块脉搏、个股卡片、来源链接和数据完整性。</p></article>
          <article><span>04</span><h3>产品化边界</h3><p>这里不重写日报算法，不生成 fallback 报告，不用浅层新闻标题替代原分析。</p></article>
        </div>
        <div className="actions">
          <button className="primaryButton" onClick={onStart}>开始配置</button>
          <button className="secondaryButton" onClick={onClose}>继续查看</button>
        </div>
      </section>
    </div>
  );
}

function StageHeader({ activeStep, onBack }: { activeStep: Exclude<AppStep, "intro">; onBack: () => void }) {
  const step = steps.find((item) => item.id === activeStep) || steps[0];
  return (
    <div className="stageHeader">
      <div>
        <span className="pill">第 {steps.findIndex((item) => item.id === activeStep) + 1} 步 / 3</span>
        <h1>{step.title}</h1>
        <p>{step.body}</p>
      </div>
      <button className="secondaryButton" onClick={onBack}>返回介绍</button>
    </div>
  );
}

function SetupPanel({
  config,
  setConfig,
  chooseProvider,
  saveApiConfig
}: {
  config: ApiConfigDraft;
  setConfig: (config: ApiConfigDraft) => void;
  chooseProvider: (provider: ProviderId) => void;
  saveApiConfig: () => void;
}) {
  return (
    <section className="panel">
      <div className="toolbar">
        <h3>模型 API 配置</h3>
        <span className={config.connected ? "status good" : "status"}>{config.connected ? "UI 已保存" : "等待录入"}</span>
      </div>
      <div className="providerGrid">
        {PROVIDERS.map((provider) => (
          <button
            className={config.provider === provider.id ? "providerChip active" : "providerChip"}
            key={provider.id}
            onClick={() => chooseProvider(provider.id)}
          >
            {provider.label}
          </button>
        ))}
      </div>
      <div className="twoCol">
        <label className="field">
          <span>Base URL</span>
          <input value={config.baseUrl} onChange={(event) => setConfig({ ...config, baseUrl: event.target.value, connected: false })} />
        </label>
        <label className="field">
          <span>Model</span>
          <input value={config.model} onChange={(event) => setConfig({ ...config, model: event.target.value, connected: false })} />
        </label>
      </div>
      <label className="field">
        <span>API Key</span>
        <input
          type="password"
          value={config.apiKey}
          placeholder="这里仅为 UI 输入框，未接入真实保存"
          onChange={(event) => setConfig({ ...config, apiKey: event.target.value, connected: false })}
        />
      </label>
      <div className="actions">
        <button className="primaryButton" onClick={saveApiConfig}>保存配置并进入下一步</button>
      </div>
    </section>
  );
}

function PortfolioPanel({
  portfolio,
  setPortfolio,
  tickerInput,
  setTickerInput,
  weightInput,
  setWeightInput,
  addHolding,
  goReport
}: {
  portfolio: Holding[];
  setPortfolio: (portfolio: Holding[]) => void;
  tickerInput: string;
  setTickerInput: (value: string) => void;
  weightInput: Weight;
  setWeightInput: (value: Weight) => void;
  addHolding: (event: FormEvent<HTMLFormElement>) => void;
  goReport: () => void;
}) {
  return (
    <section className="panel">
      <div className="toolbar">
        <h3>持仓管理</h3>
        <span className="status good">{portfolio.length} 只股票</span>
      </div>
      <div className="holdingList">
        {portfolio.map((holding) => (
          <div className="holdingRow" key={holding.ticker}>
            <div>
              <strong className="ticker">{holding.ticker}</strong>
              <p>{holding.name} · {holding.sector}</p>
            </div>
            <div className="rowActions">
              <span className="pill">{holding.weight}</span>
              <button className="dangerButton" onClick={() => setPortfolio(portfolio.filter((item) => item.ticker !== holding.ticker))}>
                移除
              </button>
            </div>
          </div>
        ))}
      </div>
      <form className="addForm" onSubmit={addHolding}>
        <label className="field">
          <span>股票代码</span>
          <input value={tickerInput} placeholder="NVDA" onChange={(event) => setTickerInput(event.target.value.toUpperCase())} />
        </label>
        <label className="field compactField">
          <span>关注程度</span>
          <select value={weightInput} onChange={(event) => setWeightInput(event.target.value as Weight)}>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>
        </label>
        <button className="primaryButton" type="submit">添加持仓</button>
      </form>
      <div className="actions">
        <button className="primaryButton" onClick={goReport}>持仓确认，去生成日报</button>
      </div>
    </section>
  );
}

function ReportPanel({
  portfolio,
  onGenerate,
  sampleReport
}: {
  portfolio: Holding[];
  onGenerate: () => void;
  sampleReport: SampleReport;
}) {
  return (
    <div className="reportLayout">
      <section className="panel sidePanel">
        <div className="toolbar">
          <h3>生成日报</h3>
          <button className="primaryButton" onClick={onGenerate}>生成日报</button>
        </div>
        <p className="muted">按钮只保留交互位置。真实开发时请触发原项目日报脚本，然后读取原 HTML 报告。</p>
        <div className="portfolioDigest">
          {portfolio.map((holding) => (
            <span key={holding.ticker}>{holding.ticker}</span>
          ))}
        </div>
      </section>
      <ReportPreview report={sampleReport} />
    </div>
  );
}

function ReportPreview({ report }: { report: SampleReport }) {
  return (
    <article className="reportPreview">
      <div className="reportTitle">
        <div>
          <span className="eyebrow">{report.date}</span>
          <h2>{report.title}</h2>
          <p>{report.summary}</p>
        </div>
        <span className="status good">{report.integrity.confidence}</span>
      </div>

      <section className="integrity">
        <strong>数据完整性</strong>
        <div>
          <span>搜索：{report.integrity.searchCount} 条</span>
          <span>抓取：{report.integrity.articleCount} 篇</span>
          <span>校验：{report.integrity.loopRounds} 轮</span>
          <span>{report.integrity.coverage}</span>
        </div>
      </section>

      <section>
        <h3>大盘概览</h3>
        <div className="indexTable">
          <div className="indexHead"><span>指数</span><span>收盘价</span><span>涨跌幅</span><span>关键驱动</span></div>
          {report.indices.map((index) => (
            <div className="indexRow" key={index.name}>
              <strong>{index.name}</strong>
              <span>{index.close}</span>
              <span className={index.change.startsWith("-") ? "negative" : "positive"}>{index.change}</span>
              <span>{index.driver}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>大盘变动归因</h3>
        <div className="reasonList">
          {report.marketReasons.map((reason) => <ReasonCard reason={reason} key={reason.title} />)}
        </div>
      </section>

      <section>
        <h3>持仓个股</h3>
        <div className="stockList">
          {report.stocks.map((stock) => (
            <article className="stockCard" key={stock.ticker}>
              <div className="stockTop">
                <div>
                  <h4>{stock.ticker}</h4>
                  <p>{stock.name} · {stock.sector}</p>
                </div>
                <strong className={stock.change.startsWith("-") ? "negative" : "positive"}>{stock.change}</strong>
              </div>
              <p className="priceLine">{stock.priceLine}</p>
              <div className="reasonList">
                {stock.attributions.map((reason) => <ReasonCard reason={reason} key={`${stock.ticker}-${reason.title}`} />)}
              </div>
              <p className="observation">{stock.observation}</p>
            </article>
          ))}
        </div>
      </section>
    </article>
  );
}

function ReasonCard({ reason }: { reason: SampleReport["marketReasons"][number] }) {
  return (
    <div className="reasonCard">
      <div className="reasonTitle">
        <span className={reason.label === "主要原因" ? "reasonBadge primary" : "reasonBadge"}>{reason.label}</span>
        <strong>{reason.title}</strong>
      </div>
      <p>{reason.explanation}</p>
      <a href={reason.sourceUrl}>{reason.sourceName}</a>
    </div>
  );
}
