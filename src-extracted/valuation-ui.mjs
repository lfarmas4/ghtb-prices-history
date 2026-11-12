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
  const matches = data.rows.filter(row => [row.title,row.sha,commitDate(row)].some(value => String(value || '').toLocaleLowerCase().includes(term))).reverse();
  const pages = Math.max(1,Math.ceil(matches.length/25));
  const current = Math.max(1,Math.min(pages,Math.floor(Number(page)) || 1));
  const visible = matches.slice((current-1)*25,current*25);
  const dates = data.rows.map(commitDate).filter(Boolean).sort();
  const sourceSha = data.coverage.sourceSha || data.coverage.sourceHeadSha || data.coverage.headSha || data.coverage.tipSha || data.coverage.refSha || data.rows.at(-1)?.sha || '';
  return `<div class="page-heading"><h1>Historial de precios</h1><button class="btn small" data-action="valuation-export" data-project="${data.key}">Exportar CSV</button></div><p class="page-description">Todas las actualizaciones disponibles de tus proyectos y su valor de referencia.</p><div class="valuation-summary-grid">${summaryCard('crossbox')}${summaryCard('fitcode')}</div>${ancestryNotice}${monthlyChart(data)}<div class="section-heading"><h2>Historial completo · ${data.name}</h2><span class="badge">${number(data.rows.length)} commits</span></div><p class="hint">${dates.length ? `${escapeHtml(dates[0])} — ${escapeHtml(dates.at(-1))}` : 'Sin cobertura disponible'} · Rama principal, primer padre · SHA de origen: <code>${escapeHtml(sourceSha || 'no disponible')}</code></p><div class="valuation-controls"><label class="field">Proyecto<select id="valuation-project"><option value="crossbox" ${data.key==='crossbox'?'selected':''}>CrossBox</option><option value="fitcode" ${data.key==='fitcode'?'selected':''}>FitCode</option></select></label><label class="field valuation-search">Buscar por actualización, fecha o SHA<input id="valuation-search" type="search" value="${escapeHtml(query)}" placeholder="Buscar en todo el historial"></label></div><div class="table-wrap"><table class="data-table valuation-full-table"><thead><tr><th>Fecha del commit</th><th>Actualización</th><th>Cambios</th><th>Valor asignado</th><th>Acumulado</th></tr></thead><tbody>${visible.map(row => `<tr><td>${escapeHtml(commitDate(row))}</td><td><button class="valuation-update" data-action="view-history-update" data-project="${data.key}" data-id="${escapeHtml(row.sha)}">${escapeHtml(row.title)}</button><small class="muted">${escapeHtml(String(row.sha).slice(0,8))} · ${number(row.changedFiles)} archivos</small></td><td><span class="valuation-add">+${number(row.additions)}</span> / <span class="valuation-delete">−${number(row.deletions)}</span><small class="muted">líneas · ${number(row.binaryFiles)} archivos binarios</small></td><td>${money(row.valueUsd)}</td><td>${money(row.cumulativeUsd)}</td></tr>`).join('') || `<tr><td colspan="5">${data.rows.length ? 'No hay coincidencias para esta búsqueda.' : 'Fuente del historial no disponible. No se han inventado actualizaciones ni importes.'}</td></tr>`}</tbody></table></div><div class="valuation-pagination"><span>${number(matches.length)} resultados · Página ${current} de ${pages}</span><div><button class="btn small" data-action="valuation-page" data-page="${current-1}" ${current===1?'disabled':''}>Anterior</button><button class="btn small" data-action="valuation-page" data-page="${current+1}" ${current===pages?'disabled':''}>Siguiente</button></div></div><details class="valuation-method"><summary>Origen y método de valoración</summary><p>Los commits describen cambios del código. Sus fechas no prueban que se publicara un despliegue ni que se realizara un pago. Los despliegues confirmados se muestran por separado en cada detalle cuando existe evidencia.</p><p>${data.name} distribuye exactamente ${money(data.target)} entre el historial completo según líneas añadidas y eliminadas, con ajuste de centavos. Es una asignación modelada del valor de referencia proporcionado; no son precios históricos pagados. Los binarios no tienen un peso en líneas.</p><p>Ambos proyectos aplican el mismo método de asignación modelada a sus valores de referencia. Los pagos registrados y las tarifas futuras permanecen separados. Los enlaces de repositorios privados requieren acceso.</p></details>`;
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
