const atrPricingKey = 'atr-sistem';
const atrArchiveName = 'atr-sistem.zip';
const atrArchiveSize = 1_304;
const atrArchiveSha256 = 'fb3612ff529fea5e54f045d1f12f2aca87723e5f03695c295dc743bce62b67be';
const pwrPricingKey = 'pwr-games-agent-bar';
const pwrArchiveName = 'mejora-agente-barra-pwr-games.zip';
const pwrArchiveSize = 1_524;
const pwrArchiveSha256 = '32f79dc2fb022e1dc9b190366da67573f5cd33aa0b59703c33e938379350c780';
const pricedProjects = Object.freeze([
  Object.freeze({ pricingKey: atrPricingKey, archiveName: atrArchiveName, archiveSize: atrArchiveSize, sha256: atrArchiveSha256, configKey: 'atrPrice', defaultPrice: 150, name: 'atr-sistem' }),
  Object.freeze({ pricingKey: pwrPricingKey, archiveName: pwrArchiveName, archiveSize: pwrArchiveSize, sha256: pwrArchiveSha256, configKey: 'pwrPrice', defaultPrice: 350, name: 'Mejora agente barra · PWR Games' }),
]);
const identifiedPricingFiles = new WeakSet();
const catalogPricingFiles = new WeakSet();

export const defaultConfig = Object.freeze({ base: 1, perMB: 0.15, includedMB: 0, minimum: 0, atrPrice: 150, pwrPrice: 350 });

async function sha256Hex(file) {
  if (typeof file.arrayBuffer !== 'function' || !globalThis.crypto?.subtle) {
    throw new Error('SHA-256 fingerprinting is unavailable in this browser context.');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function identifyPricingFile(file) {
  if (!file || typeof file.name !== 'string' || !Number.isSafeInteger(file.size) || file.size < 0) {
    throw new Error('Invalid file metadata');
  }
  const metadata = { name: file.name, size: file.size, blob: file };
  const project = pricedProjects.find(candidate => file.name === candidate.archiveName && file.size === candidate.archiveSize);
  if (!project) return metadata;

  const sha256 = await sha256Hex(file);
  if (sha256 !== project.sha256) return metadata;

  const identified = { ...metadata, pricingKey: project.pricingKey, sha256 };
  identifiedPricingFiles.add(identified);
  return identified;
}

function isTrustedPricingFile(file) {
  if (catalogPricingFiles.has(file) || identifiedPricingFiles.has(file)) return true;
  return false;
}

function validateConfig(config) {
  const required = ['base', 'perMB', 'includedMB', 'minimum'];
  if (!config || required.some(key => !Number.isFinite(config[key]) || config[key] < 0 || config[key] > 1_000_000)) {
    throw new Error('Invalid pricing configuration');
  }
  for (const project of pricedProjects) {
    const price = config[project.configKey] ?? project.defaultPrice;
    if (!Number.isFinite(price) || price < 0 || price > 1_000_000) {
      throw new Error('Invalid pricing configuration');
    }
  }
}

function calculateStandardQuote(files, config) {
  const bytes = files.reduce((sum, file) => sum + file.size, 0);
  if (!Number.isSafeInteger(bytes)) throw new Error('Invalid file total');
  const mb = bytes / 1_000_000;
  const billableMB = Math.max(0, mb - config.includedMB);
  const variable = billableMB * config.perMB;
  const total = files.length ? Math.round(Math.max(config.minimum, config.base + variable) * 100) / 100 : 0;
  return { bytes, mb, billableMB, variable, base: files.length ? config.base : 0, total, count: files.length };
}

export function calculateQuote(files, config = defaultConfig) {
  validateConfig(config);
  if (!Array.isArray(files) || files.some(f => !Number.isSafeInteger(f.size) || f.size < 0)) throw new Error('Invalid file metadata');
  const specialFiles = files.filter(isTrustedPricingFile);
  const standardFiles = files.filter(file => !isTrustedPricingFile(file));
  const standardQuote = calculateStandardQuote(standardFiles, config);
  const bytes = files.reduce((sum, file) => sum + file.size, 0);
  if (!Number.isSafeInteger(bytes)) throw new Error('Invalid file total');
  const projectCharges = pricedProjects.flatMap(project => {
    const quantity = specialFiles.filter(file => file.pricingKey === project.pricingKey).length;
    if (quantity === 0) return [];
    const unitPrice = config[project.configKey] ?? project.defaultPrice;
    return [{ pricingKey: project.pricingKey, name: project.name, quantity, unitPrice, total: Math.round(quantity * unitPrice * 100) / 100 }];
  });
  const projectTotal = projectCharges.reduce((sum, charge) => sum + charge.total, 0);
  const total = Math.round((standardQuote.total + projectTotal) * 100) / 100;
  const result = {
    ...standardQuote,
    bytes,
    mb: bytes / 1_000_000,
    count: files.length,
    total,
    projectCharges,
  };
  for (const project of pricedProjects) {
    const charge = projectCharges.find(item => item.pricingKey === project.pricingKey);
    if (charge) {
      const alias = project === pricedProjects[0] ? 'atr' : 'pwr';
      result[`${alias}Count`] = charge.quantity;
      result[`${alias}UnitPrice`] = charge.unitPrice;
      result[`${alias}Total`] = charge.total;
    }
  }
  return {
    ...result,
  };
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const power = Math.min(3, Math.floor(Math.log10(bytes) / 3));
  return `${(bytes / (1000 ** power)).toFixed(power ? 2 : 0)} ${units[power]}`;
}

export const demoBundles = Object.freeze([
  { id: 'auth', name: 'Autenticación', kind: 'Feature', description: 'Login, registro y recuperación de cuenta.', language: 'TypeScript', color: '#3178c6', icon: 'shield', files: [{ name: 'feature-auth.zip', size: 1_200_000, source: 'examples/feature-auth.zip' }] },
  { id: 'chat', name: 'Chat en tiempo real', kind: 'Feature', description: 'Conversaciones, mensajes y notificaciones.', language: 'JavaScript', color: '#f1e05a', icon: 'message', files: [{ name: 'feature-chat.zip', size: 4_800_000, source: 'examples/feature-chat.zip' }] },
  { id: 'store', name: 'Storefront', kind: 'App', description: 'Catálogo, carrito y panel de productos.', language: 'TypeScript', color: '#3178c6', icon: 'repo', files: [{ name: 'app-storefront.zip', size: 18_000_000, source: 'examples/app-storefront.zip' }] },
  { id: atrPricingKey, title: 'atr-sistem', name: 'atr-sistem', kind: 'Feature', description: 'Configuración tipada y estado básico para un sistema ATR.', language: 'TypeScript', color: '#3178c6', icon: 'repo', pricingKey: atrPricingKey, files: [{ name: atrArchiveName, size: atrArchiveSize, source: 'examples/atr-sistem.zip', pricingKey: atrPricingKey, sha256: atrArchiveSha256 }] },
  { id: pwrPricingKey, title: 'Mejora agente barra · PWR Games', name: 'Mejora agente barra · PWR Games', kind: 'Feature', description: 'Resumen tipado de estado y marcador para la barra de agente de PWR Games.', language: 'TypeScript', color: '#3178c6', icon: 'repo', pricingKey: pwrPricingKey, files: [{ name: pwrArchiveName, size: pwrArchiveSize, source: 'examples/mejora-agente-barra-pwr-games.zip', pricingKey: pwrPricingKey, sha256: pwrArchiveSha256 }] }
]);

for (const file of demoBundles.flatMap(bundle => bundle.files)) {
  if (pricedProjects.some(project => file.pricingKey === project.pricingKey && file.name === project.archiveName && file.size === project.archiveSize && file.sha256 === project.sha256)) {
    catalogPricingFiles.add(file);
  }
}
