import { demoBundles, identifyPricingFile } from './pricing.mjs';

const maxUploadFiles = 100;
const maxUploadFileBytes = 100 * 1024 * 1024;
const maxUploadTotalBytes = 250 * 1024 * 1024;
const zipExtension = /\.zip$/i;
const catalogFilesWithHashes = demoBundles
  .flatMap(bundle => bundle.files)
  .filter(file => typeof file.sha256 === 'string' && file.sha256.length === 64);

function validateUploadFiles(files) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('Selecciona al menos un archivo para analizar.');
  }
  if (files.length > maxUploadFiles) {
    throw new Error(`Puedes analizar hasta ${maxUploadFiles} archivos a la vez.`);
  }

  let totalBytes = 0;
  for (const file of files) {
    if (!file || typeof file.name !== 'string' || !file.name.trim() || !Number.isSafeInteger(file.size) || file.size < 0) {
      throw new Error('Uno de los archivos tiene metadatos inválidos.');
    }
    if (file.size > maxUploadFileBytes) {
      throw new Error('Cada archivo debe pesar como máximo 100 MB.');
    }
    totalBytes += file.size;
    if (!Number.isSafeInteger(totalBytes) || totalBytes > maxUploadTotalBytes) {
      throw new Error('El total de archivos debe pesar como máximo 250 MB.');
    }
  }
}

export async function analyzeUploadFiles(files, {
  onStage = () => {},
  delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
  durations = [650, 850, 650],
} = {}) {
  validateUploadFiles(files);
  if (typeof onStage !== 'function' || typeof delay !== 'function' || !Array.isArray(durations) || durations.length !== 3 || durations.some(value => !Number.isFinite(value) || value < 0)) {
    throw new Error('La configuración del análisis no es válida.');
  }

  const name = files.length === 1 ? files[0].name : `${files.length} archivos`;
  await onStage({ name, stage: 'reading', percent: 20 });
  await delay(durations[0]);

  const identified = [];
  for (const file of files) identified.push(await identifyPricingFile(file));

  await onStage({ name, stage: 'analyzing', percent: 65 });
  await delay(durations[1]);
  await onStage({ name, stage: 'pricing', percent: 95 });
  await delay(durations[2]);
  return identified;
}

function makeCheck(name, passed) {
  return { name, passed: Boolean(passed) };
}

async function loadAttachments(files, loadFile) {
  if (files.length === 0 || typeof loadFile !== 'function') return { available: false, loaded: [] };
  const loaded = [];
  try {
    for (const file of files) {
      if (!file || typeof file.name !== 'string' || !Number.isSafeInteger(file.size) || file.size < 0) {
        return { available: false, loaded };
      }
      const blob = await loadFile(file);
      if (!blob || !Number.isSafeInteger(blob.size) || typeof blob.arrayBuffer !== 'function' || blob.size !== file.size) {
        return { available: false, loaded };
      }
      loaded.push({ file, blob });
    }
  } catch {
    return { available: false, loaded };
  }
  return { available: loaded.length === files.length, loaded };
}

async function checkFileIntegrity(files, loaded, available) {
  if (!available || files.length === 0) return false;
  const loadedByFile = new Map(loaded.map(item => [item.file, item.blob]));
  for (const file of files) {
    const blob = loadedByFile.get(file);
    if (!blob) return false;

    if (zipExtension.test(file.name)) {
      if (typeof blob.slice !== 'function') return false;
      const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
      if (header.length !== 4 || header[0] !== 0x50 || header[1] !== 0x4b || header[2] !== 0x03 || header[3] !== 0x04) {
        return false;
      }

      const catalogFile = catalogFilesWithHashes.find(candidate => candidate.name === file.name);
      if (catalogFile) {
        const identified = await identifyPricingFile({
          name: file.name,
          size: blob.size,
          arrayBuffer: () => blob.arrayBuffer(),
        });
        if (identified.pricingKey !== catalogFile.pricingKey || identified.sha256 !== catalogFile.sha256) return false;
      }
    }
  }
  return true;
}

export async function runDeploymentChecks(record, { loadFile, delay = async () => {} } = {}) {
  if (typeof delay !== 'function') throw new Error('La función de espera no es válida.');
  const checks = [];
  const addCheck = async (name, passed) => {
    checks.push(makeCheck(name, passed));
    await delay();
  };

  const files = Array.isArray(record?.files)
    ? record.files
    : Array.isArray(record?.attachments) ? record.attachments : [];
  await addCheck('Pago completado', record?.status === 'success');
  await addCheck('Archivos adjuntos', files.length > 0);

  const loadedResult = await loadAttachments(files, loadFile);
  await addCheck('Archivos disponibles y tamaños correctos', loadedResult.available);

  let integrityPassed = false;
  try {
    integrityPassed = await checkFileIntegrity(files, loadedResult.loaded, loadedResult.available);
  } catch {
    integrityPassed = false;
  }
  await addCheck('Integridad y huella de los archivos', integrityPassed);

  if (checks.some(check => !check.passed)) {
    const error = new Error('No se pudo validar el despliegue. Revisa los checks y vuelve a intentarlo.');
    error.checks = checks;
    throw error;
  }
  return checks;
}
