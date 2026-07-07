// Rebuild today's HTML report using the updated parser
const fs = require('fs');
const path = require('path');
const { parseReportToHTML } = require('./lib/report-parser');

const PROJECT = path.resolve(__dirname, '..', '..');
const tradingDay = process.argv[2] || '2026-07-07';
const mdFile = process.argv[3] || `report_${tradingDay}_v3.md`;

const finalMd = path.join(PROJECT, 'reports', mdFile);
const finalHtml = path.join(PROJECT, 'reports', `report_${tradingDay}_final.html`);
const templatePath = path.join(PROJECT, 'reports', 'template.html');
const cacheDir = path.join(PROJECT, 'cache', tradingDay);

console.log(`Rebuilding HTML for ${tradingDay} from ${mdFile}`);

const report = fs.readFileSync(finalMd, 'utf-8');
let template = fs.readFileSync(templatePath, 'utf-8');

// Read price data
let allPrices = {};
const pricePath = path.join(cacheDir, 'price_snapshot.json');
if (fs.existsSync(pricePath)) {
  allPrices = JSON.parse(fs.readFileSync(pricePath, 'utf-8'));
}

// Read verdicts
let verdicts = [];
let round = 1;
while (fs.existsSync(path.join(PROJECT, 'reports', `report_${tradingDay}_verdict_v${round}.json`))) {
  try {
    verdicts.push(JSON.parse(fs.readFileSync(
      path.join(PROJECT, 'reports', `report_${tradingDay}_verdict_v${round}.json`), 'utf-8')));
  } catch {}
  round++;
}
const confidence = verdicts.length > 0 ? (verdicts[verdicts.length-1]?.confidence || 'medium') : 'medium';

// Parse
const parsed = parseReportToHTML(report, allPrices);

// Dates
const dateCN = `${tradingDay.slice(0,4)}年${parseInt(tradingDay.slice(5,7))}月${parseInt(tradingDay.slice(8,10))}日`;
function prevDay(d) { const dt = new Date(d+'T00:00:00'); dt.setDate(dt.getDate()-1); while(dt.getDay()===0||dt.getDay()===6) dt.setDate(dt.getDate()-1); return dt.toISOString().slice(0,10); }
function nextDay(d) { const dt = new Date(d+'T00:00:00'); dt.setDate(dt.getDate()+1); while(dt.getDay()===0||dt.getDay()===6) dt.setDate(dt.getDate()+1); return dt.toISOString().slice(0,10); }

const confLabel = confidence === 'high' ? `✅ 高置信度 · ${verdicts.length}轮校验通过`
  : confidence === 'medium' ? `⚠️ 中等置信度 · ${verdicts.length}轮校验`
  : `❌ 低置信度`;

// Count stats
const pulse = fs.existsSync(path.join(cacheDir,'sector_pulse_raw.json'))
  ? JSON.parse(fs.readFileSync(path.join(cacheDir,'sector_pulse_raw.json'),'utf-8')) : [];
const news = fs.existsSync(path.join(cacheDir,'news_raw.json'))
  ? JSON.parse(fs.readFileSync(path.join(cacheDir,'news_raw.json'),'utf-8')) : {};
const newsN = Object.values(news).reduce((s,n) => s + (Array.isArray(n)?n.length:0), 0);

let html = template
  .replace(/\{\{REPORT_DATE\}\}/g, tradingDay)
  .replace(/\{\{REPORT_DATE_CN\}\}/g, dateCN)
  .replace(/\{\{PREV_DATE\}\}/g, prevDay(tradingDay))
  .replace(/\{\{NEXT_DATE\}\}/g, nextDay(tradingDay))
  .replace(/\{\{CONFIDENCE_LEVEL\}\}/g, confidence)
  .replace(/\{\{CONFIDENCE_LABEL\}\}/g, confLabel)
  .replace(/\{\{SEARCH_COUNT\}\}/g, String(pulse.length + newsN))
  .replace(/\{\{FETCH_COUNT\}\}/g, String(newsN))
  .replace(/\{\{TRADING_DAY\}\}/g, tradingDay)
  .replace(/\{\{LOOP_ROUNDS\}\}/g, String(verdicts.length))
  .replace(/\{\{MARKET_TABLE\}\}/g, parsed.marketTable)
  .replace(/\{\{MARKET_ATTRIBUTION\}\}/g, parsed.marketAttribution)
  .replace(/\{\{STOCK_CARDS\}\}/g, parsed.stockCards)
  .replace(/\{\{WATCHLIST_SECTION\}\}/g, parsed.watchlist)
  .replace(/\{\{DISCLAIMER\}\}/g, parsed.disclaimer)
  .replace(/\{\{MISSING_DATA_SECTION\}\}/g, '')
  .replace(/\{\{GENERATED_AT\}\}/g, new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})+' 北京时间');

fs.writeFileSync(finalHtml, html, 'utf-8');
console.log(`Done! ${finalHtml} (${fs.statSync(finalHtml).size} bytes)`);
