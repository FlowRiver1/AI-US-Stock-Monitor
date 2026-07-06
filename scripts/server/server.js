// AI US Stock Monitor — Local API Server
// Replaces portfolio_server.ps1 with full report generation pipeline

const express = require('express');
const fs = require('fs');
const path = require('path');
const { generateReport } = require('./lib/pipeline');

const app = express();
const PORT = 8765;
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// --- Middleware ---
app.use(express.json({ limit: '10mb' }));

// CORS — allow all origins (local tool)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// No caching — always serve fresh files
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// --- Helpers ---
function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

const PORTFOLIO_PATH = path.join(PROJECT_ROOT, 'config', 'portfolio.json');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'config', 'server-config.json');

function ensureConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    writeJSON(CONFIG_PATH, { apiKey: '', baseUrl: 'https://api.deepseek.com/anthropic', model: 'deepseek-v4-pro', connected: false });
  }
}

// === API Routes ===

// GET /api/config — read current config (mask API key)
app.get('/api/config', (req, res) => {
  ensureConfig();
  const config = readJSON(CONFIG_PATH);
  res.json({
    baseUrl: config.baseUrl || 'https://api.deepseek.com/anthropic',
    model: config.model || 'deepseek-v4-pro',
    connected: !!config.apiKey,
    apiKeyPreview: config.apiKey ? config.apiKey.slice(0, 6) + '…' : ''
  });
});

// POST /api/config — save API key + settings
app.post('/api/config', (req, res) => {
  const { apiKey, baseUrl, model } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API Key 不能为空' });
  writeJSON(CONFIG_PATH, {
    apiKey: apiKey.trim(),
    baseUrl: (baseUrl || 'https://api.deepseek.com/anthropic').trim(),
    model: (model || 'deepseek-v4-pro').trim(),
    connected: true
  });
  res.json({ ok: true, message: 'API 配置已保存' });
});

// POST /api/config/test — test API connection
app.post('/api/config/test', async (req, res) => {
  ensureConfig();
  const config = readJSON(CONFIG_PATH);
  if (!config.apiKey) return res.status(400).json({ error: '请先配置 API Key' });

  try {
    // Send a minimal message to verify API connectivity
    const resp = await fetch(`${config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });
    if (resp.ok) {
      res.json({ ok: true, message: 'API 连接成功' });
    } else {
      const text = await resp.text();
      let hint = '';
      if (resp.status === 401) hint = ' — API Key 无效或已过期';
      else if (resp.status === 403) hint = ' — 无权限访问该模型';
      else if (resp.status === 404) hint = ' — Base URL 或端点路径不正确';
      else if (resp.status === 429) hint = ' — 请求频率过高，稍后再试';
      res.json({ ok: false, message: `连接失败: HTTP ${resp.status}${hint}` });
    }
  } catch (err) {
    res.json({ ok: false, message: `网络错误: ${err.message}` });
  }
});

// GET /api/portfolio
app.get('/api/portfolio', (req, res) => {
  const data = readJSON(PORTFOLIO_PATH);
  res.json(data);
});

// POST /api/portfolio
app.post('/api/portfolio', (req, res) => {
  const { holdings } = req.body;
  if (!Array.isArray(holdings)) return res.status(400).json({ error: 'holdings 必须是数组' });
  const current = readJSON(PORTFOLIO_PATH);
  current.holdings = holdings;
  writeJSON(PORTFOLIO_PATH, current);
  res.json({ ok: true, count: holdings.length });
});

// POST /api/report/generate — the main pipeline
app.post('/api/report/generate', async (req, res) => {
  const { date } = req.body; // optional: YYYY-MM-DD, defaults to latest trading day
  ensureConfig();
  const config = readJSON(CONFIG_PATH);
  if (!config.apiKey) return res.status(400).json({ error: '请先在设置中配置 API Key' });

  // SSE stream for progress updates
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const emit = (type, data) => res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  try {
    const report = await generateReport(date, PROJECT_ROOT, config, emit);
    emit('done', { report });
    res.end();
  } catch (err) {
    console.error('Report generation error:', err.stack || err.message);
    emit('error', { message: err.message, stack: (err.stack || '').split('\n').slice(0, 3).join(' | ') });
    res.end();
  }
});

// GET /api/reports — list historical reports
app.get('/api/reports', (req, res) => {
  const reportsDir = path.join(PROJECT_ROOT, 'reports');
  const historyPath = path.join(PROJECT_ROOT, 'memory', 'history.json');

  let historyEntries = [];
  if (fs.existsSync(historyPath)) {
    const history = readJSON(historyPath);
    historyEntries = history.reports || [];
  }

  // Also check for final HTML files
  const htmlReports = [];
  if (fs.existsSync(reportsDir)) {
    const files = fs.readdirSync(reportsDir);
    for (const f of files) {
      const match = f.match(/^report_(\d{4}-\d{2}-\d{2})_final\.html$/);
      if (match) htmlReports.push(match[1]);
    }
  }

  const merged = htmlReports.map(date => {
    const entry = historyEntries.find(e => e.date === date || e.trading_day === date);
    return {
      date,
      confidence: entry?.confidence || 'unknown',
      nasdaq_change: entry?.index_changes?.nasdaq || null,
      loop_rounds: entry?.loop_rounds || null,
      dominant_themes: entry?.dominant_themes?.slice(0, 3) || []
    };
  }).sort((a, b) => b.date.localeCompare(a.date));

  res.json(merged);
});

// GET /api/report/:date — get a specific report data
app.get('/api/report/:date', (req, res) => {
  const { date } = req.params;
  const historyPath = path.join(PROJECT_ROOT, 'memory', 'history.json');
  const htmlPath = path.join(PROJECT_ROOT, 'reports', `report_${date}_final.html`);

  let report = { date, exists: false };

  if (fs.existsSync(historyPath)) {
    const history = readJSON(historyPath);
    const entry = (history.reports || []).find(e => e.trading_day === date || e.date === date);
    if (entry) {
      report = { ...report, ...entry, exists: true };
    }
  }

  if (fs.existsSync(htmlPath)) {
    report.htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    report.exists = true;
  }

  res.json(report);
});

// Static file serving — reports directory
app.use('/reports', express.static(path.join(PROJECT_ROOT, 'reports')));

// Static file serving — public/ (the SPA frontend)
app.use(express.static(path.join(PROJECT_ROOT, 'public')));

// Fallback — redirect to public/index.html
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`\n📊 AI US Stock Monitor Server`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   按 Ctrl+C 停止\n`);
});
