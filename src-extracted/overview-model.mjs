const LEGACY_SAMPLE_PAYMENT_IDS = new Set(['19T5IGEN', '09FAPWZ5']);
const MONTHLY_VALUES = [
  ['2026-01', null, 435],
  ['2026-02', null, 545],
  ['2026-03', null, 342],
  ['2026-04', null, 224],
  ['2026-05', null, 186],
  ['2026-06', 180.00, 89],
  ['2026-07', 180.00, 56],
  ['2026-08', 250.00, 3],
  ['2026-09', 3409.13, null],
  ['2026-10', 3691.28, null],
  ['2026-11', 1245.55, null],
  ['2026-12', null, null],
];

export const overviewMonthlyHistory = Object.freeze(MONTHLY_VALUES.map(([period, crossbox, fitcode]) => Object.freeze({
  period,
  crossbox,
  fitcode,
  total: crossbox == null && fitcode == null ? null : roundCurrency((crossbox ?? 0) + (fitcode ?? 0)),
})));

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isRealDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function previousPeriod(period) {
  const [year, month] = period.split('-').map(Number);
  return month === 1
    ? `${String(year - 1).padStart(4, '0')}-12`
    : `${year}-${String(month - 1).padStart(2, '0')}`;
}

function requireToday(today) {
  if (!isRealDate(today)) throw new TypeError('today must be a real YYYY-MM-DD date.');
  return today.slice(0, 7);
}

function requireTrackingSince(trackingSince) {
  if (typeof trackingSince !== 'string' || !Number.isFinite(Date.parse(trackingSince))) {
    throw new TypeError('trackingSince must be a valid ISO timestamp.');
  }
  return Date.parse(trackingSince);
}

function validPaymentAmount(amount) {
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) {
    throw new RangeError('Payment amount must be between 0 and 1,000,000 USD.');
  }
  return Math.round((amount + Number.EPSILON) * 100);
}

function isSuccessful(payment) {
  return payment.status == null || payment.status === 'success';
}

export function buildOverviewSummary(payments, { today = new Date().toISOString().slice(0, 10), trackingSince } = {}) {
  if (!Array.isArray(payments)) throw new TypeError('Payments must be an array.');
  const currentPeriod = requireToday(today);
  const trackingSinceMs = requireTrackingSince(trackingSince);
  const prevPeriod = previousPeriod(currentPeriod);
  const byPeriod = new Map(overviewMonthlyHistory.map((row) => [row.period, row]));
  const additions = new Map();
  const seenIds = new Set();
  let newPaymentsCents = 0;
  let newDeploymentCount = 0;
  let yearCents = 0;

  for (const payment of payments) {
    if (!payment || typeof payment !== 'object' || Array.isArray(payment)) continue;
    if (payment.deletedAt || LEGACY_SAMPLE_PAYMENT_IDS.has(payment.id) || !isSuccessful(payment)) continue;
    if (typeof payment.id === 'string' && seenIds.has(payment.id)) continue;
    if (typeof payment.id === 'string') seenIds.add(payment.id);
    if (!isRealDate(payment.date) || typeof payment.createdAt !== 'string') continue;
    const createdAtMs = Date.parse(payment.createdAt);
    if (!Number.isFinite(createdAtMs) || createdAtMs < trackingSinceMs) continue;

    const amountCents = validPaymentAmount(payment.amount);
    const period = payment.date.slice(0, 7);
    additions.set(period, (additions.get(period) ?? 0) + amountCents);
    newPaymentsCents += amountCents;
    if (payment.purpose !== 'budget') newDeploymentCount += 1;
    if (period.startsWith(`${currentPeriod.slice(0, 4)}-`)) yearCents += amountCents;
  }

  const historicalRows = [...overviewMonthlyHistory];
  const periods = new Set([...historicalRows.map((row) => row.period), ...additions.keys(), currentPeriod, prevPeriod]);
  const rows = [...periods].sort().map((period) => {
    const historical = byPeriod.get(period);
    const crossbox = historical?.crossbox ?? null;
    const fitcode = historical?.fitcode ?? null;
    const historicalValues = [crossbox, fitcode].filter((value) => value != null);
    const historicalTotal = historicalValues.length
      ? roundCurrency(historicalValues.reduce((sum, value) => sum + value, 0))
      : null;
    const newPayments = (additions.get(period) ?? 0) / 100;
    const total = historicalTotal == null && newPayments === 0
      ? null
      : roundCurrency((historicalTotal ?? 0) + newPayments);
    if (period.startsWith(`${currentPeriod.slice(0, 4)}-`) && historicalTotal != null) {
      yearCents += Math.round(historicalTotal * 100);
    }
    return { period, crossbox, fitcode, historicalTotal, newPayments, total };
  });

  const currentRow = rows.find((row) => row.period === currentPeriod);
  const previousRow = rows.find((row) => row.period === prevPeriod);
  return {
    previousPeriod: prevPeriod,
    previousMonthTotal: previousRow?.total ?? null,
    currentPeriod,
    currentMonthTotal: currentRow?.total ?? null,
    currentHistoricalTotal: currentRow?.historicalTotal ?? null,
    newPaymentsTotal: roundCurrency(newPaymentsCents / 100),
    newDeploymentCount,
    yearTotal: roundCurrency(yearCents / 100),
    rows,
  };
}
