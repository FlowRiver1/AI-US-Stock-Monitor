// Prompt builder — reads prompts/*.md and injects data
// Preserves all 8 attribution rules from the original executor prompt

const fs = require('fs');
const path = require('path');

function readPrompt(name) {
  const promptPath = path.join(__dirname, '..', '..', '..', 'prompts', `${name}.md`);
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt file not found: prompts/${name}.md`);
  }
  return fs.readFileSync(promptPath, 'utf-8');
}

// Build the user message for Executor — contains all raw data
function buildExecutorUserMessage({ date, sectorPulse, prices, news, history, marketIndexData }) {
  let msg = '';

  msg += `## 任务：为 ${date} 生成美股持仓日报\n\n`;

  // Price snapshot
  msg += '### 价格快照\n\n';
  msg += '| Ticker | Price | Change % | Open | High | Low |\n';
  msg += '|--------|-------|----------|------|------|-----|\n';
  for (const [ticker, data] of Object.entries(prices)) {
    if (data) {
      const sign = data.change_pct >= 0 ? '+' : '';
      msg += `| ${ticker} | $${data.price?.toFixed(2) || 'N/A'} | ${sign}${data.change_pct?.toFixed(2) || 'N/A'}% | $${data.open?.toFixed(2) || 'N/A'} | $${data.high?.toFixed(2) || 'N/A'} | $${data.low?.toFixed(2) || 'N/A'} |\n`;
    }
  }
  msg += '\n';

  // Market indices
  if (marketIndexData && Object.keys(marketIndexData).length > 0) {
    msg += '### 大盘指数\n\n';
    msg += '| Index | Price | Change % |\n|-------|-------|----------|\n';
    for (const [symbol, data] of Object.entries(marketIndexData)) {
      if (data) {
        const sign = data.change_pct >= 0 ? '+' : '';
        msg += `| ${symbol} | ${data.price?.toLocaleString() || 'N/A'} | ${sign}${data.change_pct?.toFixed(2) || 'N/A'}% |\n`;
      }
    }
    msg += '\n';
  }

  // Phase 0: Sector Pulse (⭐ read first!)
  msg += '### ⭐ 板块脉搏（行业级新闻 — 先阅读此部分）\n\n';
  if (sectorPulse && sectorPulse.length > 0) {
    for (const item of sectorPulse) {
      msg += `- **${item.title}**\n`;
      if (item.summary) msg += `  ${item.summary}\n`;
      if (item.url) msg += `  来源: ${item.url}\n`;
      msg += `  搜索词: ${item.keyword}\n\n`;
    }
  }
  msg += '\n';

  // Individual stock news
  msg += '### 个股新闻\n\n';
  for (const [ticker, newsItems] of Object.entries(news)) {
    msg += `#### ${ticker}\n\n`;
    if (newsItems && newsItems.length > 0) {
      for (const item of newsItems) {
        msg += `- **${item.title}**`;
        if (item.source) msg += ` [${item.source}]`;
        if (item.url) msg += `(${item.url})`;
        msg += '\n';
        if (item.summary) msg += `  ${item.summary}\n`;
        msg += '\n';
      }
    } else {
      msg += '(未找到相关新闻)\n\n';
    }
  }

  // History context
  if (history && history.reports && history.reports.length > 0) {
    msg += '### 历史趋势\n\n';
    const lastReport = history.reports[0];
    msg += `最近报告: ${lastReport.date}\n`;
    if (lastReport.dominant_themes) {
      msg += `近期主题: ${lastReport.dominant_themes.join('; ')}\n`;
    }
    if (history.trends) {
      msg += '\n各持仓趋势:\n';
      for (const [ticker, trend] of Object.entries(history.trends)) {
        msg += `- ${ticker}: ${trend.trend_direction === 'falling' ? '↓' : '↑'} ${trend.note}\n`;
      }
    }
    msg += '\n';
  }

  msg += `请严格按照 Executor 角色的要求，基于以上数据生成 ${date} 的美股持仓日报。`;
  msg += `所有 8 条分析准则必须遵守，特别注意行业层归因优先（第 8 条）和跨股票因果关联（第 7 条）。\n`;

  return msg;
}

// Build the user message for Verifier
function buildVerifierUserMessage({ report, sectorPulse, prices, news }) {
  let msg = '';

  msg += '## 待审查的报告\n\n';
  msg += report;
  msg += '\n\n---\n\n';

  msg += '## 原始数据（用于交叉验证）\n\n';

  // Sector pulse
  msg += '### 板块脉搏数据\n\n';
  if (sectorPulse && sectorPulse.length > 0) {
    for (const item of sectorPulse) {
      msg += `- **${item.title}**\n`;
      if (item.summary) msg += `  ${item.summary}\n`;
      if (item.url) msg += `  来源: ${item.url}\n\n`;
    }
  }
  msg += '\n';

  // Price data
  msg += '### 价格快照\n\n';
  for (const [ticker, data] of Object.entries(prices)) {
    if (data) {
      const sign = data.change_pct >= 0 ? '+' : '';
      msg += `- ${ticker}: $${data.price?.toFixed(2) || 'N/A'} (${sign}${data.change_pct?.toFixed(2) || 'N/A'}%)\n`;
    }
  }
  msg += '\n';

  // News
  msg += '### 个股新闻\n\n';
  for (const [ticker, newsItems] of Object.entries(news)) {
    msg += `#### ${ticker}\n`;
    if (newsItems && newsItems.length > 0) {
      for (const item of newsItems) {
        msg += `- ${item.title} [${item.source || 'unknown'}](${item.url || '#'})\n`;
        if (item.summary) msg += `  ${item.summary}\n`;
      }
    }
    msg += '\n';
  }

  msg += '请严格按照 Verifier 角色的要求（7 项校验标准），审查上述报告。输出 JSON 格式的审查结果。\n';

  return msg;
}

// Build the fix prompt for Executor (Round 2+)
function buildFixPrompt({ report, verdict, sectorPulse, prices, news }) {
  let msg = '';

  msg += '## 修正任务\n\n';
  msg += '以下是 Verifier 在上轮审查中发现的问题，请仅修改标记的段落：\n\n';

  msg += '### 待修正问题\n\n';
  for (const issue of verdict.issues || []) {
    msg += `- **${issue.section}**: ${issue.explanation}\n`;
    msg += `  建议: ${issue.suggestion}\n\n`;
  }
  msg += '\n';

  msg += '### 当前报告（请仅修改有问题的段落）\n\n';
  msg += report;
  msg += '\n\n';

  msg += '请输出修正后的完整报告，并用 `<!-- modified -->` 标记修改过的段落。\n';

  return msg;
}

module.exports = {
  readPrompt,
  buildExecutorUserMessage,
  buildVerifierUserMessage,
  buildFixPrompt
};
