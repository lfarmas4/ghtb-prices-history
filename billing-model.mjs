const LEGACY_SAMPLE_PAYMENT_IDS = new Set(['19T5IGEN', '09FAPWZ5']);
const MAX_AMOUNT = 1_000_000;
const DEFAULTS_VERSION = 2;
const DEFAULTS = Object.freeze({ budget: 300, baseUsage: 260, openingCredit: 130 });
const BASE_CHARGE_WEIGHTS = Object.freeze([35, 40, 55, 45, 85]);

function cents(value, label = 'Amount') {
  if (!Number.isFinite(value) || value < 0 || value > MAX_AMOUNT) {
    throw new RangeError(`${label} must be between 0 and ${MAX_AMOUNT} USD.`);
  }
  return Math.round((value + Number.EPSILON) * 100);
}

function validPeriod(period) {
  if (typeof period !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    throw new TypeError('Period must use YYYY-MM format.');
  }
  return period;
}

function validTimestamp(at) {
  if (typeof at !== 'string' || !Number.isFinite(Date.parse(at))) {
    throw new TypeError('Timestamp must be a valid date-time string.');
  }
  return at;
}

function invoiceId(period, version) {
  return `${period}-v${version}`;
}

function makeBaseCharges(period, baseUsage = DEFAULTS.baseUsage) {
  const totalCents = cents(baseUsage, 'Base usage');
  const weightTotal = BASE_CHARGE_WEIGHTS.reduce((sum, value) => sum + value, 0);
  let assigned = 0;
  const charges = BASE_CHARGE_WEIGHTS.map((weight, index) => {
    const share = Math.floor(totalCents * weight / weightTotal);
    assigned += share;
    return {
      date: `${period}-${String([2, 7, 12, 18, 26][index]).padStart(2, '0')}`,
      amountCents: share,
      source: 'base',
    };
  });
  charges[charges.length - 1].amountCents += totalCents - assigned;
  return charges.map(({ date, amountCents, source }) => ({ date, amount: amountCents / 100, source }));
}

function validateState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) throw new TypeError('Billing state must be an object.');
  validPeriod(state.period);
  if (!Number.isSafeInteger(state.invoiceVersion) || state.invoiceVersion < 1) {
    throw new RangeError('Invoice version must be a positive integer.');
  }
  if (state.invoiceId !== invoiceId(state.period, state.invoiceVersion)) {
    throw new RangeError('Invoice ID must match the period and version.');
  }
}

function paymentStatus(payment) {
  return payment.status == null ? 'success' : payment.status;
}

function paymentPeriod(payment) {
  if (typeof payment.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(payment.date)
    || !Number.isFinite(Date.parse(`${payment.date}T00:00:00Z`))) {
    throw new TypeError('Payment date must use YYYY-MM-DD format.');
  }
  return payment.date.slice(0, 7);
}

function appendCharge(charges, date, amountCents, source) {
  if (!amountCents) return;
  const key = `${date}:${source}`;
  const existing = charges.get(key);
  if (existing) existing.amountCents += amountCents;
  else charges.set(key, { date, amountCents, source });
}

export function createBillingState(period = new Date().toISOString().slice(0, 7)) {
  validPeriod(period);
  return {
    period,
    invoiceVersion: 1,
    invoiceId: invoiceId(period, 1),
    defaultsVersion: DEFAULTS_VERSION,
    ...DEFAULTS,
    baseCharges: makeBaseCharges(period),
  };
}

export function migrateBillingState(state) {
  validateState(state);
  if (state.defaultsVersion != null && state.defaultsVersion >= DEFAULTS_VERSION) return { ...state };
  const next = { ...state, defaultsVersion: DEFAULTS_VERSION };
  if (state.defaultsVersion == null && state.budget === 130) next.budget = DEFAULTS.budget;
  return next;
}

export function updateBillingState(state, changes = {}) {
  validateState(state);
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    throw new TypeError('Billing changes must be an object.');
  }
  const next = { ...state };
  for (const key of ['budget', 'baseUsage', 'openingCredit']) {
    if (Object.hasOwn(changes, key)) next[key] = cents(changes[key], key) / 100;
  }
  if (Object.hasOwn(changes, 'baseUsage')) next.baseCharges = makeBaseCharges(state.period, next.baseUsage);
  return next;
}

export function resetBillingState(state) {
  validateState(state);
  if (state.invoiceVersion >= Number.MAX_SAFE_INTEGER) throw new RangeError('Invoice version is exhausted.');
  const version = state.invoiceVersion + 1;
  return {
    period: state.period,
    invoiceVersion: version,
    invoiceId: invoiceId(state.period, version),
    defaultsVersion: DEFAULTS_VERSION,
    ...DEFAULTS,
    baseCharges: makeBaseCharges(state.period),
  };
}

export function activePayments(payments) {
  if (!Array.isArray(payments)) throw new TypeError('Payments must be an array.');
  return payments.filter((payment) => payment && typeof payment === 'object' && !payment.deletedAt);
}

export function softDeletePayment(payments, id, { at = new Date().toISOString() } = {}) {
  if (!Array.isArray(payments)) throw new TypeError('Payments must be an array.');
  if (typeof id !== 'string' || !id) throw new TypeError('Payment ID must be a non-empty string.');
  validTimestamp(at);
  const index = payments.findIndex((payment) => payment?.id === id);
  if (index < 0) throw new RangeError(`Payment ${id} was not found.`);
  if (payments[index].deletedAt) throw new RangeError(`Payment ${id} is already deleted.`);
  const next = [...payments];
  next[index] = { ...payments[index], deletedAt: at };
  return next;
}

export function restorePayment(payments, id) {
  if (!Array.isArray(payments)) throw new TypeError('Payments must be an array.');
  if (typeof id !== 'string' || !id) throw new TypeError('Payment ID must be a non-empty string.');
  const index = payments.findIndex((payment) => payment?.id === id);
  if (index < 0) throw new RangeError(`Payment ${id} was not found.`);
  if (!payments[index].deletedAt) throw new RangeError(`Payment ${id} is not deleted.`);
  const { deletedAt, ...restoredRecord } = payments[index];
  const next = [...payments];
  next[index] = restoredRecord;
  return next;
}

export function getBillingSummary(state, payments, { period = state?.period } = {}) {
  validateState(state);
  validPeriod(period);
  if (!Array.isArray(payments)) throw new TypeError('Payments must be an array.');
  const currentPeriod = period === state.period;
  const baseUsageCents = currentPeriod ? cents(state.baseUsage, 'Base usage') : 0;
  const budgetCents = cents(state.budget, 'Budget');
  const openingCreditCents = currentPeriod ? cents(state.openingCredit, 'Opening credit') : 0;
  const invoice = currentPeriod ? state.invoiceId : null;
  const charges = new Map();

  if (currentPeriod) {
    for (const charge of state.baseCharges) {
      const date = paymentPeriod({ date: charge.date });
      appendCharge(charges, charge.date, cents(charge.amount, 'Base charge'), 'base');
    }
  }

  let deploymentUsageCents = 0;
  let paidDeploymentsCents = 0;
  let paidSettlementsCents = 0;
  for (const payment of activePayments(payments)) {
    if (LEGACY_SAMPLE_PAYMENT_IDS.has(payment.id) || paymentStatus(payment) !== 'success') continue;
    const amountCents = cents(payment.amount, 'Payment amount');
    if (payment.purpose === 'budget') {
      if (invoice && payment.invoiceId === invoice) paidSettlementsCents += amountCents;
      continue;
    }
    if (paymentPeriod(payment) !== period) continue;
    deploymentUsageCents += amountCents;
    paidDeploymentsCents += amountCents;
    appendCharge(charges, payment.date, amountCents, 'deployment');
  }

  const totalUsageCents = baseUsageCents + deploymentUsageCents;
  const totalPaidCents = paidDeploymentsCents + paidSettlementsCents;
  const amountDueCents = Math.max(0, totalUsageCents - openingCreditCents - totalPaidCents);
  if (![totalUsageCents, totalPaidCents, amountDueCents, paidSettlementsCents].every(Number.isSafeInteger)) {
    throw new RangeError('Billing total is too large.');
  }
  const chargeRows = [...charges.values()]
    .sort((a, b) => a.date.localeCompare(b.date) || a.source.localeCompare(b.source))
    .map(({ date, amountCents, source }) => ({ date, amount: amountCents / 100, source }));

  return {
    period,
    invoiceId: invoice,
    budget: budgetCents / 100,
    remainingBudget: Math.max(0, budgetCents - totalUsageCents) / 100,
    baseUsage: baseUsageCents / 100,
    deploymentUsage: deploymentUsageCents / 100,
    totalUsage: totalUsageCents / 100,
    openingCredit: openingCreditCents / 100,
    paidDeployments: paidDeploymentsCents / 100,
    paidSettlements: paidSettlementsCents / 100,
    totalPaid: totalPaidCents / 100,
    amountDue: amountDueCents / 100,
    overBudget: totalUsageCents > budgetCents,
    percentUsed: budgetCents === 0 ? (totalUsageCents === 0 ? 0 : 100) : Math.round(totalUsageCents / budgetCents * 1000) / 10,
    settled: amountDueCents === 0,
    charges: chargeRows,
  };
}
