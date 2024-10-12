const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cheerio = require('cheerio');
const tools = require('./fix-link.js');

function formatSize(sizeInBytes) {
  if (sizeInBytes === null) return 'N/A';
  const sizeInMo = (sizeInBytes / (1024 * 1024)).toFixed(2); // Conversion en Mo
  return `${sizeInMo}`;
}

async function getFileSize(url) {
  const response = await fetch(url, { method: 'HEAD' }); // Effectuer une requête HEAD pour obtenir les en-têtes
  const size = response.headers.get('Content-Length'); // Récupérer la taille
  return parseInt(size, 10); // Convertir en entier
}

async function search(args) {
  let res = (await fetch(tools.api(5, '/apps/search', {
    query: args,
    limit: 1000
  })));

  let ress = {};
  res = (await res.json());
  ress = res.datalist.list.map(v => {
    return {
      name: v.name,
      id: v.package
    };
  });

  return ress;
}

async function download(id) {
  let res = (await fetch(tools.api(5, '/apps/search', {
    query: id,
    limit: 1
  })));

  res = (await res.json());
  let name = res.datalist.list[0].name;
  let package = res.datalist.list[0].package;
  let icon = res.datalist.list[0].icon;
  let dllink = res.datalist.list[0].file.path;
  let lastup = res.datalist.list[0].updated;
  let sizeInBytes = await getFileSize(dllink); // Récupérer la taille en octets
  let size = formatSize(sizeInBytes); // Formater la taille en Mo

  return {
    name,
    lastup,
    package,
    size,
    icon,
    dllink
  };
}

module.exports = { search, download };
