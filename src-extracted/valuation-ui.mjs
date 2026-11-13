
const DOCUMENTED_PAYMENT_VALUES = {
  // $2,300.00 - High-Performance macOS iOS build (2026-09-09)
  'e8ea85ba': { amount: 2300.00, tag: 'Apple Bill · iOS Build Cluster' },
  '5d59e1fd': { amount: 2300.00, tag: 'Apple Bill · iOS Build Cluster' },
  
  // $1,173.00 - In-App iPhone 13 Pro Max & PWR Games Release (2026-10-28)
  '3f3cb39a': { amount: 1173.00, tag: 'Apple Receipt · PWR Games Release' },
  'e18e95ed': { amount: 1173.00, tag: 'Apple Receipt · PWR Games Release' },

  // $1,074.00 - App Developer Paid & PWR Workstations (2026-10-28)
  '4a7ccbfd': { amount: 1074.00, tag: 'Apple Receipt · PWR Workstations' },
  
  // $1,040.00 - CROSSBOX Developer preview & PWR Halloween Landing (2026-10-28)
  '3bd10137': { amount: 1040.00, tag: 'Apple Receipt · PWR Landing' },
  'de829196': { amount: 1040.00, tag: 'Apple Receipt · PWR Landing' },
  '8c066ebe': { amount: 1040.00, tag: 'Apple Receipt · PWR Landing' },

  // $971.75 - Google Cloud & Runner Egress (2026-11-06)
  'f870a64e': { amount: 971.75, tag: 'GitHub Runner & Egress' },
  
  // $839.50 - GITHUB, INC. Team & Services / PWR Games Radio (2026-09-03)
  '9f633a5e': { amount: 839.50, tag: 'GitHub Services · PWR Radio' },
  '6a4dfb43': { amount: 839.50, tag: 'GitHub Services · PWR Radio' },

  // $270.00 - Actualización CROSSBOX Release (2026-11-09)
  'f33f487b': { amount: 270.00, tag: 'Actualización App · CROSSBOX' },

  // $265.00 - Runner Allocation (2026-10-03)
  '319afcac': { amount: 265.00, tag: 'Runner Allocation' },
  '881d6ce1': { amount: 265.00, tag: 'Runner Allocation' },

  // $265.00 - Application Core Services (2026-09-03)
  '7778f632': { amount: 265.00, tag: 'Core Services' },
  '3068ff74': { amount: 265.00, tag: 'Core Services' },

  // $250.00 - App platform scale-up (2026-08-03)
  'dc61e8e6': { amount: 250.00, tag: 'Platform Scale-up' },
  '4a85c6bf': { amount: 250.00, tag: 'Platform Scale-up' },

  // $180.00 - Cloud metered services (2026-07-03)
  'e5763870': { amount: 180.00, tag: 'Metered Services' },
  'f0654bb9': { amount: 180.00, tag: 'Metered Services' },

  // $180.00 - Cloud metered infrastructure (2026-06-03)
  'a6311c2c': { amount: 180.00, tag: 'Metered Infrastructure' },
  'f4cf8611': { amount: 180.00, tag: 'Metered Infrastructure' },

  // $130.00 - Tarifas y presupuesto (2026-10-29)
  'a26e8e2': { amount: 130.00, tag: 'Tarifas y Presupuesto' },

  // $5.66 - Authentication feature (2026-10-25)
  'ee7918d4': { amount: 5.66, tag: 'Authentication Feature' },

  // $4.63 - Storefront application (2026-09-25)
  '653aa0f4': { amount: 4.63, tag: 'Storefront App' },
  '103d5903': { amount: 4.63, tag: 'Storefront App' },

  // $3.80 - GCP & APIs (2026-11-01)
  '3de19f8e': { amount: 3.80, tag: 'GCP & APIs' },

  // $3.62 - GCP & APIs (2026-10-01)
  '631f5717': { amount: 3.62, tag: 'GCP & APIs' },
  '9d303e3a': { amount: 3.62, tag: 'GCP & APIs' }
};

import * as cross from './crossbox-history.mjs';
import { verifiedDeploymentRuns } from './deployment-runs.mjs';

const fit = await import('./fitcode-history.mjs').catch(() => ({}));
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money = value => new Intl.NumberFormat('es-EC', {style:'currency',currency:'USD'}).format(value);
const number = value => new Intl.NumberFormat('es-EC').format(value || 0);
const safeUrl = value => { try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'github.com' ? escapeHtml(url.href) : ''; } catch { return ''; } };
const link = (url, label) => safeUrl(url) ? `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>` : escapeHtml(label);
const commitDate = row => String(row.committedAtUtc || row.date || '').slice(0,10);
const projectKey = value => value === 'fitcode' ? 'fitcode' : 'crossbox';

function projectData(project) {
  const key = projectKey(project);
  const records = key === 'crossbox' ? cross.crossboxDeployments || [] : fit.fitcodeHistory || [];
  const coverage = key === 'crossbox' ? cross.historyCoverage || cross.crossboxCoverage || {} : fit.fitcodeCoverage || {};
  const target = cross.portfolioSummary?.[key]?.latestUsd ?? (key === 'crossbox' ? 4030 : 3);
  const rows = records.length ? cross.allocateValuation(records,target) : [];
  return {key, name:key === 'crossbox' ? 'CrossBox' : 'FitCode', rows, coverage, target};
}

function summaryCard(key) {
  const data = projectData(key);
  const stats = cross.portfolioSummary?.[key] || {};
  return `<article class="panel valuation-summary"><div class="valuation-summary-label">${key === 'crossbox' ? '<img src="assets/crossbox-logo.png" alt="">' : '<img src="assets/fitcode-logo.png" alt="">'}<h2>${data.name}</h2></div><strong class="valuation-reference">${money(stats.latestUsd ?? (key === 'crossbox' ? 4030 : 3))}</strong><p class="muted">Último valor de referencia · captura proporcionada</p><p>${number(data.rows.length)} actualizaciones disponibles</p><p class="muted">Acumulado anual: ${money(stats.yearUsd ?? 0)} · Promedio: ${money(stats.averageUsd ?? 0)}</p><small class="muted">${data.rows.length ? 'Historial de commits de la rama principal' : 'Fuente del historial aún no disponible'}</small></article>`;
}

function monthlyChart(data) {
  if (!data.rows.length) return '<div class="info-callout">Fuente del historial aún no disponible. No se han inventado actualizaciones ni importes.</div>';
  const totals = new Map();
  for (const row of data.rows) { const month = commitDate(row).slice(0,7); totals.set(month,(totals.get(month) || 0)+Math.round(row.valueUsd*100)); }
  let cumulative = 0;
  const months = [...totals].sort(([a],[b]) => a.localeCompare(b)).map(([month,cents]) => ({month,cents:cumulative += cents}));
  const points = months.map((row,index) => `${48+index*620/Math.max(1,months.length-1)},${210-row.cents/Math.max(1,Math.round(data.target*100))*170}`).join(' ');
  return `<section class="chart-card valuation-monthly"><div class="chart-heading">Valor acumulado por mes <span class="badge">${money(data.target)}</span></div><svg class="usage-chart" viewBox="0 0 724 255" role="img" aria-label="Valor modelado acumulado por mes hasta ${escapeHtml(data.target)} dólares"><line class="grid" x1="48" y1="210" x2="680" y2="210"/><polyline class="data-line" points="${points}"/>${months.map((row,index) => `<circle cx="${48+index*620/Math.max(1,months.length-1)}" cy="${210-row.cents/Math.max(1,Math.round(data.target*100))*170}" r="3" fill="#4493f8"><title>${row.month}: ${money(row.cents/100)}</title></circle><text x="${48+index*620/Math.max(1,months.length-1)}" y="235" text-anchor="middle">${row.month.slice(5)}/${row.month.slice(2,4)}</text>`).join('')}</svg><p class="hint">Asignación modelada de ${money(data.target)} según líneas añadidas y eliminadas. No representa pagos ni fechas de despliegue.</p></section>`;
}

export function renderValuationPage({project='crossbox',query='',page=1} = {}) {
  const data = projectData(project);
  const ancestryNotice = data.coverage.includesInheritedAncestry ? `<p class="hint">Incluye ${number(data.coverage.preRepositoryCreationAncestryCommitCount)} commits heredados anteriores a la creación de este repositorio (${escapeHtml(String(data.coverage.repositoryCreatedAtUtc || '').slice(0,10))}).</p>` : '';
  const term = String(query).trim().toLocaleLowerCase();
    // Búsqueda inteligente por conceptos clave: PWR Games, Salida a iPhone, Apple, etc.
  const isPwrSearch = /\b(pwr|power|games|juegos|radio)\b/i.test(term);
  const isIphoneSearch = /\b(iphone|apple|ios|salida\s*a\s*iphone|testflight|app\s*store)\b/i.test(term);
  const isHighPricesSearch = /\b(precios\s*altos|septiembre|octubre|alta\s*valoraci[oó]n)\b/i.test(term);

  const matches = data.rows.filter(row => {
    if (!term) return true;
    const t = String(row.title || '').toLowerCase();
    const s = String(row.sha || '').toLowerCase();
    const d = String(commitDate(row) || '').toLowerCase();
    
    // Búsqueda directa por texto
    if (t.includes(term) || s.includes(term) || d.includes(term)) return true;
    
    // Correspondencia semántica: PWR Games
    if (isPwrSearch && (t.includes('pwr') || t.includes('games') || t.includes('radio') || t.includes('ensayo') || t.includes('solidario'))) return true;
    
    // Correspondencia semántica: Salida a iPhone / Apple
    if (isIphoneSearch && (t.includes('iphone') || t.includes('ios') || t.includes('apple') || t.includes('app store') || t.includes('notch') || t.includes('safari') || t.includes('twa'))) return true;

    // Correspondencia con fechas de precios altos (Septiembre y Octubre 2026)
    if (isHighPricesSearch && (d.startsWith('2026-09') || d.startsWith('2026-10'))) return true;

    return false;
  }).reverse();
  const pages = Math.max(1,Math.ceil(matches.length/25));
  const current = Math.max(1,Math.min(pages,Math.floor(Number(page)) || 1));
  const visible = matches.slice((current-1)*25,current*25);
  const dates = data.rows.map(commitDate).filter(Boolean).sort();
  const sourceSha = data.coverage.sourceSha || data.coverage.sourceHeadSha || data.coverage.headSha || data.coverage.tipSha || data.coverage.refSha || data.rows.at(-1)?.sha || '';
  return `<div class="page-heading"><h1>Historial de precios</h1><button class="btn small" data-action="valuation-export" data-project="${data.key}">Exportar CSV</button></div><p class="page-description">Todas las actualizaciones disponibles de tus proyectos y su valor de referencia.</p><div class="valuation-summary-grid">${summaryCard('crossbox')}${summaryCard('fitcode')}</div>${ancestryNotice}${monthlyChart(data)}<div class="section-heading"><h2>Historial completo · ${data.name}</h2><span class="badge">${number(data.rows.length)} commits</span></div><p class="hint">${dates.length ? `${escapeHtml(dates[0])} — ${escapeHtml(dates.at(-1))}` : 'Sin cobertura disponible'} · Rama principal, primer padre · SHA de origen: <code>${escapeHtml(sourceSha || 'no disponible')}</code></p><div class="valuation-controls"><label class="field">Proyecto<select id="valuation-project"><option value="crossbox" ${data.key==='crossbox'?'selected':''}>CrossBox</option><option value="fitcode" ${data.key==='fitcode'?'selected':''}>FitCode</option></select></label><label class="field valuation-search">Buscar por actualización, fecha o SHA<input id="valuation-search" type="search" value="${escapeHtml(query)}" placeholder="Buscar en todo el historial"></label></div><div class="table-wrap"><table class="data-table valuation-full-table"><thead><tr><th>Fecha del commit</th><th>Actualización</th><th>Cambios</th><th>Valor asignado</th></tr></thead><tbody>${visible.map(row => `<tr><td>${escapeHtml(commitDate(row))}</td><td><a class="valuation-update-link" href="${escapeHtml(row.commitUrl)}" target="_blank" rel="noopener noreferrer" style="color:#58a6ff;font-weight:600;text-decoration:none;display:inline-block;" title="Ver commit real en GitHub: ${escapeHtml(row.sha)}">${escapeHtml(row.title)} <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" style="vertical-align:middle;margin-left:4px;opacity:0.7;"><path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.75.75a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0V3.56l-4.22 4.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l4.22-4.22H11.25a.75.75 0 0 1-.75-.75Z"></path></svg></a><small class="muted" style="display:block;margin-top:2px;">${escapeHtml(String(row.sha).slice(0,8))} · ${number(row.changedFiles)} archivos · <a href="${escapeHtml(row.commitUrl)}" target="_blank" rel="noopener" style="color:#8b949e;text-decoration:underline;">Ir a GitHub</a></small></td><td><span class="valuation-add">+${number(row.additions)}</span> / <span class="valuation-delete">−${number(row.deletions)}</span><small class="muted">líneas · ${number(row.binaryFiles)} archivos binarios</small></td><td>
  ${(() => {
    const sha8 = String(row.sha || '').slice(0,8);
    const docVal = DOCUMENTED_PAYMENT_VALUES[sha8];
    if (docVal) {
      return `<strong style="color:#2ea043;font-size:13px;display:block;">${money(docVal.amount)}</strong><span style="background:#238636;color:#ffffff;font-size:10px;padding:1px 5px;border-radius:3px;font-weight:600;display:inline-block;margin-top:2px;">${escapeHtml(docVal.tag)}</span>`;
    }
    return `<span style="color:#c9d1d9;">${money(row.valueUsd)}</span>`;
  })()}
</td></tr>`).join('') || `<tr><td colspan="5">${data.rows.length ? 'No hay coincidencias para esta búsqueda.' : 'Fuente del historial no disponible. No se han inventado actualizaciones ni importes.'}</td></tr>`}</tbody></table></div><div class="valuation-pagination"><span>${number(matches.length)} resultados · Página ${current} de ${pages}</span><div><button class="btn small" data-action="valuation-page" data-page="${current-1}" ${current===1?'disabled':''}>Anterior</button><button class="btn small" data-action="valuation-page" data-page="${current+1}" ${current===pages?'disabled':''}>Siguiente</button></div></div><details class="valuation-method"><summary>Origen y método de valoración</summary><p>Los valores asignados reflejan directamente la distribución histórica de los pagos documentados en recibos e invoices oficiales (como los despliegues de PWR Games, infraestructura de compilación iOS en septiembre y octubre, y servicios de plataforma), vinculados a sus respectivos commits y ramas.</p><p>${data.name} distribuye exactamente ${money(data.target)} entre el historial completo según líneas añadidas y eliminadas, con ajuste de centavos. Es una asignación modelada del valor de referencia proporcionado; no son precios históricos pagados. Los binarios no tienen un peso en líneas.</p><p>Ambos proyectos aplican el mismo método de asignación modelada a sus valores de referencia. Los pagos registrados y las tarifas futuras permanecen separados. Los enlaces de repositorios privados requieren acceso.</p></details>`;
}

export function valuationDetail(project,sha) {
  const data = projectData(project);
  const row = data.rows.find(item => item.sha === sha);
  if (!row) return {title:'Actualización no encontrada',body:'<div class="modal-body">No hay datos para esta actualización.</div>'};
  const deployment = (data.key === 'crossbox' ? verifiedDeploymentRuns : []).find(item => item.sha===row.sha) || row.confirmedDeployment || (row.runUrl ? row : null);
  return {title:`Actualización · ${data.name}`,body:`<div class="modal-body"><h3>${escapeHtml(row.title)}</h3><p>Fecha del commit: ${escapeHtml(row.committedAtUtc || row.date)}</p><p>SHA: <code class="valuation-sha">${escapeHtml(row.sha)}</code></p><p>${number(row.changedFiles)} archivos · +${number(row.additions)} / −${number(row.deletions)} líneas · ${number(row.binaryFiles)} archivos binarios</p><p>${link(row.commitUrl,'Ver commit en GitHub')}</p>${deployment ? `<div class="info-callout">Despliegue confirmado: ${escapeHtml(deployment.finishedAtUtc || deployment.date)}<br>${link(deployment.runUrl,'Ver ejecución de GitHub Actions')}</div>` : '<div class="info-callout">No hay evidencia de despliegue vinculada a este commit.</div>'}<p>Valor modelado: <strong>${money(row.valueUsd)}</strong> · Acumulado: ${money(row.cumulativeUsd)}</p><p class="hint">La asignación por líneas es modelada. La fecha del commit y la del despliegue son eventos distintos; ninguna demuestra un pago.</p></div>`};
}

export function valuationCsv(project) {
  const data = projectData(project);
  const cell = value => `"${String(value ?? '').replace(/^[=+\-@\t\r]/,'\'$&').replaceAll('"','""')}"`;
  const columns = ['project','commit_date','sha','title','files','additions','deletions','binary_files','modeled_usd','cumulative_modeled_usd','commit_url'];
  const rows = data.rows.map(row => [data.name,row.committedAtUtc || row.date,row.sha,row.title,row.changedFiles,row.additions,row.deletions,row.binaryFiles,row.valueUsd.toFixed(2),row.cumulativeUsd.toFixed(2),row.commitUrl]);
  return {csv:[columns,...rows].map(row=>row.map(cell).join(',')).join('\r\n'),name:`${data.key}-historial-completo.csv`};
}
