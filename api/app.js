const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cheerio = require('cheerio');
const tools = require('../fix-link.js');

const app = express();
const PORT = 3000;

function formatSize(sizeInBytes) {
  if (sizeInBytes === null) return 'N/A';
  const sizeInMo = (sizeInBytes / (1024 * 1024)).toFixed(2);
  return `${sizeInMo} MB`;
}

async function getFileSize(url) {
  const response = await fetch(url, { method: 'HEAD' });
  const size = response.headers.get('Content-Length');
  return parseInt(size, 10);
}

async function searchApps(query) {
  const res = await fetch(tools.api(5, '/apps/search', { query, limit: 1000 }));
  const data = await res.json();
  return data.datalist.list.map(v => ({
    name: v.name,
    id: v.package
  }));
}

async function downloadApp(id) {
  const res = await fetch(tools.api(5, '/apps/search', { query: id, limit: 1 }));
  const data = await res.json();
  const app = data.datalist.list[0];
  const sizeInBytes = await getFileSize(app.file.path);
  const size = formatSize(sizeInBytes);

  return {
    name: app.name,
    lastUpdate: app.updated,
    package: app.package,
    size,
    icon: app.icon,
    downloadLink: app.file.path
  };
}

app.get('/', async (req, res) => {
  res.return("online")
})

app.get('/aptoide', async (req, res) => {
  const { q, type } = req.query;

  if (!q || !type) {
    return res.status(400).json({ error: 'Missing query parameters: q and type are required.' });
  }

  try {
    if (type === 'search') {
      const results = await searchApps(q);
      res.json({ results });
    } else if (type === 'download') {
      const appDetails = await downloadApp(q);
      res.json(appDetails);
    } else {
      res.status(400).json({ error: 'Invalid type. Use "search" or "download".' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
