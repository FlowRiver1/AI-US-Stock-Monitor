// Report parser — converts Executor markdown to Paper-styled HTML
// Strategy: minimal transformation. Keep Executor's markdown structure intact,
// just add semantic CSS classes. Don't reinvent the layout.

function parseReportToHTML(report, prices) {
  return {
    marketTable: buildMarketTable(report),
    marketAttribution: buildMarketAttribution(report),
    stockCards: buildStockCards(report, prices),
    watchlist: buildWatchlist(report),
    disclaimer: buildDisclaimer(report)
  };
}

// ---- Market Table ----
function buildMarketTable(report) {
  const match = report.match(/\| 指数 \| 收盘价 \| 涨跌幅 \| 关键驱动 \|([\s\S]*?)(?=\n\n|### 大盘)/);
  if (!match) return '';
  const rows = match[1].trim().split('\n').filter(l => l.includes('|'))
    .map(line => {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length < 3) return '';
      const cls = cells[2].startsWith('+') ? 'positive' : cells[2].startsWith('-') ? 'negative' : '';
      return `<tr><td><strong>${cells[0]}</strong></td><td>${cells[1]}</td><td class="${cls}">${cells[2]}</td><td>${cells[3] || '-'}</td></tr>`;
    }).join('');
  return `<table class="market-table"><thead><tr><th>指数</th><th>收盘价</th><th>涨跌幅</th><th>关键驱动</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// ---- Market Attribution ----
function buildMarketAttribution(report) {
  const match = report.match(/### 大盘变动归因\n([\s\S]*?)(?=\n## )/);
  if (!match) return '';
  return `<div class="market-drivers">${mdToHTML(match[1])}</div>`;
}

// ---- Stock Cards ----
function buildStockCards(report, prices) {
  // Split on ### TICKER boundaries
  const sections = report.split(/\n(?=### [A-Z]+ - )/);
  const cards = [];

  for (const section of sections) {
    const tickerMatch = section.match(/^### ([A-Z]+)/);
    if (!tickerMatch) continue;
    const ticker = tickerMatch[1];
    const priceData = prices[ticker] || {};
    const chg = priceData.change_pct || 0;

    // Extract subsections
    const priceLine = extractSection(section, '今日表现');
    const attribution = extractSection(section, '变动归因');
    const trendObs = extractSection(section, '趋势观察');
    const crossStock = extractCrossStock(section);

    const sign = chg >= 0 ? '+' : '';
    const cls = chg >= 0.01 ? 'positive' : chg <= -0.01 ? 'negative' : '';

    cards.push(`
      <div class="stock-card">
        <div class="stock-top">
          <div>
            <h3>${ticker}</h3>
            <div class="name">${ticker}</div>
          </div>
          <div class="change ${cls}">${sign}${chg.toFixed(2)}%</div>
        </div>
        <div class="stock-meta">
          <span>开盘 $${(priceData.open || 0).toFixed(2)}</span>
          <span>收盘 $${(priceData.price || 0).toFixed(2)}</span>
          <span>最高 $${(priceData.high || 0).toFixed(2)}</span>
          <span>最低 $${(priceData.low || 0).toFixed(2)}</span>
        </div>
        ${attribution ? `<div class="reason-list">${parseAttributionItems(attribution)}</div>` : ''}
        ${crossStock}
        ${trendObs ? `<div class="trend-note">📈 ${mdInline(trendObs)}</div>` : ''}
      </div>
    `);
  }
  return cards.join('');
}

// Extract a bold-labeled section: **标签：** content
function extractSection(text, label) {
  const regex = new RegExp(`\\*\\*${label}[：:]\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*|\\n⚠️|\\n---|$)`, '');
  const m = text.match(regex);
  if (!m) return '';
  return m[1].trim();
}

// Parse 变动归因 items — match original report layout
function parseAttributionItems(attrText) {
  const items = attrText.split(/\n(?=\d+\.\s)/);
  return items.map(item => {
    let content = item.replace(/^\d+\.\s*/, '').trim();
    content = content.replace(/<!--[\s\S]*?-->/g, '').trim();
    if (!content) return '';

    // Extract label
    let label = '';
    let labelClass = 'tag-secondary';
    const labelMatch = content.match(/^\*\*(主要原因|次要因素|积极对冲|行业层|个股层|宏观层|资金面)\*\*[：:]?\s*/);
    if (labelMatch) {
      label = labelMatch[1];
      content = content.slice(labelMatch[0].length);
      if (label === '主要原因' || label === '行业层') labelClass = 'tag-primary';
      if (label === '积极对冲') labelClass = 'tag-positive';
    }

    // Remove source/type/持续性 lines — they're meta, not display content
    // Handles both: - **来源**：xxx and - 来源：xxx
    let source = '';
    let sourceURL = '';
    content = content.replace(/-\s*\*{0,2}来源[：:]\*{0,2}\s*(.+?)(?=\n-|\n\n|$)/, (_, val) => {
      const v = val.trim();
      if (v && v !== '无') { source = v; sourceURL = (content.match(/https?:\/\/[^\s)\]]+/) || [''])[0]; }
      return '';
    });
    content = content.replace(/-\s*\*{0,2}(?:类型|持续性)[：:]\*{0,2}\s*.+?(?=\n-|\n\n|$)/g, '');

    // Aggressive cleanup: strip any remaining meta-like lines
    content = content.replace(/^[-–—\s]*(来源|类型|持续性)[：:]\s*.+$/gim, '');
    content = content.replace(/\n\s*[-–—\s]*(来源|类型|持续性)[：:]\s*.+$/gim, '');
    content = content.trim();

    return `
      <div class="reason-item">
        ${label ? `<span class="${labelClass}">${label}</span>` : ''}
        <span class="reason-body">${mdInline(content)}</span>
        ${source ? `<span class="source-link"> · <a href="${sourceURL || '#'}" target="_blank">${escapeHTML(source)}</a></span>` : ''}
      </div>
    `;
  }).filter(Boolean).join('');
}

// Cross-stock alert: ⚠️ **跨股关联：** text
function extractCrossStock(text) {
  const m = text.match(/⚠️\s*\*\*跨股关联[：:]\*\*\s*(.+?)(?=\n\n|$)/);
  if (!m) return '';
  return `<div class="cross-stock">⚠️ <strong>跨股关联：</strong>${escapeHTML(m[1].trim())}</div>`;
}

// ---- Watchlist ----
function buildWatchlist(report) {
  const match = report.match(/## 💡 其他值得关注\n([\s\S]*?)(?=## 📝)/);
  if (!match) return '';
  return `<h2>💡 其他值得关注</h2><div class="watch-section">${mdToHTML(match[1])}</div>`;
}

// ---- Disclaimer ----
function buildDisclaimer(report) {
  const match = report.match(/## 📝 免责声明\n([\s\S]*?)$/);
  if (!match) return '';
  return `<div class="disclaimer">⚠️ ${escapeHTML(match[1].trim()).replace(/\n/g, '<br>')}</div>`;
}

// ---- Markdown→HTML (for narrative text sections) ----
function mdToHTML(text) {
  // Strip comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  // Convert paragraphs
  const paras = text.trim().split(/\n\n+/);
  return paras.map(p => {
    p = p.trim();
    // Bullet list items: lines starting with -
    if (p.startsWith('- ')) {
      const items = p.split(/\n(?=- )/).map(li => `<li>${mdInline(li.slice(2))}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    // Numbered list
    if (/^\d+\.\s/.test(p)) {
      const items = p.split(/\n(?=\d+\.\s)/).map(li => `<li>${mdInline(li.replace(/^\d+\.\s*/, ''))}</li>`).join('');
      return `<ol>${items}</ol>`;
    }
    return `<p>${mdInline(p)}</p>`;
  }).join('');
}

// Inline formatting: bold, links only. No HTML entity escaping of our own tags.
function mdInline(text) {
  // First escape, then format
  let html = escapeHTML(text.trim());
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  return html;
}

function escapeHTML(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { parseReportToHTML };
