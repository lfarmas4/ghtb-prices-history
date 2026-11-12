import { allocateValuation, crossboxHistory, portfolioSummary } from './crossbox-history.mjs';
import { verifiedDeploymentRuns } from './deployment-runs.mjs';

const PAYMENT_STATUSES = new Set(['success', 'pending', 'failed']);
const GITHUB_STATUSES = new Set(['deployed', 'pending', 'failed']);
const LOCAL_DEPLOYMENT_STATUSES = new Set(['ready', 'deploying', 'deployed', 'failed']);
const DEPLOYMENT_TRANSITIONS = new Map([
  ['ready', new Set(['ready', 'deploying'])],
  ['deploying', new Set(['deploying', 'deployed', 'failed'])],
  ['failed', new Set(['failed', 'deploying'])],
  ['deployed', new Set(['deployed'])],
]);
const LEGACY_SAMPLE_PAYMENT_IDS = new Set(['19T5IGEN', '09FAPWZ5']);
const historyValuesBySha = new Map(
  allocateValuation(crossboxHistory, portfolioSummary.crossbox.targetUsd)
    .map((record) => [record.sha, record.valueUsd]),
);
const historyBySha = new Map(crossboxHistory.map((record) => [record.sha, record]));

function validName(name) {
  if (typeof name !== 'string') throw new TypeError('Name must be a string.');
  const normalized = name.trim();
  if (!normalized || normalized.length > 100) throw new RangeError('Name must contain 1 to 100 characters.');
  return normalized;
}

function validDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new TypeError('Date must use YYYY-MM-DD format.');
  }
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new RangeError('Date must be a real calendar date.');
  }
  return date;
}

function validAmount(amount) {
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) {
    throw new RangeError('Amount must be between 0 and 1,000,000 USD.');
  }
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function validStatus(status, allowedStatuses) {
  if (typeof status !== 'string' || !allowedStatuses.has(status)) {
    throw new RangeError(`Status must be one of: ${[...allowedStatuses].join(', ')}.`);
  }
  return status;
}

function localTimestamp(date) {
  return `${date}T12:00:00.000Z`;
}

function applyOverride(row, overrides) {
  const override = overrides[row.id];
  if (override == null) return row;
  if (typeof override !== 'object' || Array.isArray(override)) {
    throw new TypeError(`Override for ${row.id} must be an object.`);
  }

  const result = { ...row };
  if (Object.hasOwn(override, 'name')) result.name = validName(override.name);
  if (Object.hasOwn(override, 'date')) result.date = validDate(override.date);
  if (Object.hasOwn(override, 'status')) {
    result.status = validStatus(override.status, row.source === 'github' ? GITHUB_STATUSES : PAYMENT_STATUSES);
  }
  if (Object.hasOwn(override, 'amount')) result.amount = validAmount(override.amount);
  return result;
}

function sortLatestFirst(rows) {
  return rows.sort((a, b) => b.date.localeCompare(a.date)
    || b.createdAt.localeCompare(a.createdAt)
    || a.id.localeCompare(b.id));
}

export function buildDeploymentRows({ payments = [], overrides = {}, includeLegacySamples = false } = {}) {
  if (!Array.isArray(payments)) throw new TypeError('Payments must be an array.');
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new TypeError('Overrides must be an object keyed by row ID.');
  }

  const githubRows = verifiedDeploymentRuns.map((run) => {
    const historyRecord = historyBySha.get(run.sha);
    const date = validDate(run.date);
    const row = {
      id: `github:${run.runId}`,
      name: run.title,
      date,
      createdAt: run.finishedAtUtc,
      amount: historyValuesBySha.get(run.sha) ?? null,
      amountKind: 'valuation',
      source: 'github',
      status: run.deployJob === 'success' && run.hostingAndRulesStorage === 'success' ? 'deployed' : 'failed',
      files: [],
      fileCount: historyRecord?.changedFiles ?? 0,
      sha: run.sha,
      runUrl: run.runUrl,
      paymentId: null,
    };
    return applyOverride(row, overrides);
  });

  const localPayments = payments.filter((payment) => {
    if (!payment || typeof payment !== 'object' || Array.isArray(payment)) {
      throw new TypeError('Each payment must be an object.');
    }
    return !payment.deletedAt && payment.purpose !== 'budget';
  });
  const localRows = localPayments.map((payment) => {
    if (!payment || typeof payment !== 'object' || Array.isArray(payment)) {
      throw new TypeError('Each payment must be an object.');
    }
    if (typeof payment.id !== 'string' || !payment.id.trim()) {
      throw new TypeError('Each payment must have a stable ID.');
    }
    const date = validDate(payment.date);
    const createdAt = payment.createdAt == null ? localTimestamp(date) : payment.createdAt;
    if (typeof createdAt !== 'string' || !Number.isFinite(Date.parse(createdAt))) {
      throw new TypeError('Payment createdAt must be a valid timestamp.');
    }
    const row = {
      id: `payment:${payment.id}`,
      name: validName(payment.name),
      date,
      createdAt,
      amount: validAmount(payment.amount),
      amountKind: 'payment',
      source: 'local',
      status: payment.status == null ? 'success' : validStatus(payment.status, PAYMENT_STATUSES),
      deploymentStatus: payment.deploymentStatus == null
        ? 'deployed'
        : validStatus(payment.deploymentStatus, LOCAL_DEPLOYMENT_STATUSES),
      files: Array.isArray(payment.files) ? [...payment.files] : [],
      fileCount: Array.isArray(payment.files) ? payment.files.length : 0,
      sha: payment.sha ?? null,
      runUrl: payment.runUrl ?? null,
      paymentId: payment.id,
    };
    return applyOverride(row, overrides);
  }).filter((row) => includeLegacySamples || !LEGACY_SAMPLE_PAYMENT_IDS.has(row.paymentId));

  return sortLatestFirst([...githubRows, ...localRows]);
}

export function editPaymentRecord(payments, id, changes) {
  if (!Array.isArray(payments)) throw new TypeError('Payments must be an array.');
  if (typeof id !== 'string' || !id) throw new TypeError('Payment ID must be a non-empty string.');
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    throw new TypeError('Changes must be an object.');
  }
  const index = payments.findIndex((payment) => payment?.id === id);
  if (index < 0) throw new RangeError(`Payment ${id} was not found.`);

  const current = payments[index];
  const nextRecord = {
    ...current,
    name: validName(Object.hasOwn(changes, 'name') ? changes.name : current.name),
    date: validDate(Object.hasOwn(changes, 'date') ? changes.date : current.date),
    amount: validAmount(Object.hasOwn(changes, 'amount') ? changes.amount : current.amount),
    status: validStatus(Object.hasOwn(changes, 'status') ? changes.status : (current.status ?? 'success'), PAYMENT_STATUSES),
  };
  const nextPayments = [...payments];
  nextPayments[index] = nextRecord;
  return nextPayments;
}

export function setDeploymentState(payments, paymentId, state, { at = new Date().toISOString() } = {}) {
  if (!Array.isArray(payments)) throw new TypeError('Payments must be an array.');
  if (typeof paymentId !== 'string' || !paymentId) throw new TypeError('Payment ID must be a non-empty string.');
  validStatus(state, LOCAL_DEPLOYMENT_STATUSES);
  if (typeof at !== 'string' || !Number.isFinite(Date.parse(at))) {
    throw new TypeError('Deployment timestamp must be a valid date-time string.');
  }

  const index = payments.findIndex((payment) => payment?.id === paymentId);
  if (index < 0) throw new RangeError(`Payment ${paymentId} was not found.`);
  const current = payments[index];
  if (current.deletedAt) throw new RangeError('Deleted payments cannot be deployed.');
  if (current.status != null && current.status !== 'success') {
    throw new RangeError('Only successful payments can be deployed.');
  }
  const currentState = current.deploymentStatus == null
    ? 'deployed'
    : validStatus(current.deploymentStatus, LOCAL_DEPLOYMENT_STATUSES);
  if (!DEPLOYMENT_TRANSITIONS.get(currentState).has(state)) {
    throw new RangeError(`Deployment cannot move from ${currentState} to ${state}.`);
  }

  const nextRecord = { ...current, deploymentStatus: state };
  if (state === 'deploying') nextRecord.startedAt = at;
  if (state === 'deployed') nextRecord.deployedAt = at;
  const nextPayments = [...payments];
  nextPayments[index] = nextRecord;
  return nextPayments;
}

function amountToCents(amount) {
  return Math.round((validAmount(amount) + Number.EPSILON) * 100);
}

export function deploymentSummary(rows, payments) {
  if (!Array.isArray(rows) || !Array.isArray(payments)) {
    throw new TypeError('Rows and payments must be arrays.');
  }
  const representedPaymentIds = new Set(rows
    .filter((row) => row.source === 'local' && row.paymentId != null && row.status === 'success')
    .map((row) => row.paymentId));
  const actualPayments = payments.filter((payment) => representedPaymentIds.has(payment.id)
    && !payment.deletedAt
    && payment.purpose !== 'budget'
    && (payment.status == null || payment.status === 'success'));
  const paymentCents = actualPayments.reduce((sum, payment) => sum + amountToCents(payment.amount), 0);
  if (!Number.isSafeInteger(paymentCents)) throw new RangeError('Payment total is too large.');
  const latest = [...rows].sort((a, b) => b.date.localeCompare(a.date)
    || b.createdAt.localeCompare(a.createdAt)
    || a.id.localeCompare(b.id))[0] ?? null;
  const latestPayment = [...actualPayments].sort((a, b) => {
    const aDate = a.createdAt ?? localTimestamp(validDate(a.date));
    const bDate = b.createdAt ?? localTimestamp(validDate(b.date));
    return b.date.localeCompare(a.date) || bDate.localeCompare(aDate) || String(a.id).localeCompare(String(b.id));
  })[0] ?? null;

  return {
    counts: {
      total: rows.length,
      github: rows.filter((row) => row.source === 'github').length,
      local: rows.filter((row) => row.source === 'local').length,
    },
    paymentCount: actualPayments.length,
    totalPayments: paymentCents / 100,
    latest,
    latestPayment,
  };
}
