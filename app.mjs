import { invoiceModalHtml, buildStandaloneInvoiceHtml, GITHUB_OCTOCAT_INVOICE_SVG, generateNumericInvoiceNum, generateNumericTransactionRef } from './invoice-generator.mjs';
import { receiptModalHtml, buildStandaloneReceiptHtml, GITHUB_OCTOCAT_SVG } from './receipt-generator.mjs';
import { calculateQuote, defaultConfig, demoBundles, formatBytes, identifyPricingFile } from './pricing.mjs';
import { buildDeploymentRows, deploymentSummary, editPaymentRecord, setDeploymentState } from './deployments-model.mjs';
import { checkoutReviewHtml, validatePaymentFields, processingHtml, paymentReadyHtml, deploymentProcessingHtml, deploymentCompleteHtml, fileAnalysisHtml, deleteProcessingHtml } from './checkout-flow.mjs';
import { createBillingState, getBillingSummary, updateBillingState, resetBillingState, softDeletePayment, restorePayment, activePayments, migrateBillingState } from './billing-model.mjs';
import { budgetPageHtml, usageBannerHtml, usageSummaryHtml } from './billing-ui.mjs';
import { analyzeUploadFiles, runDeploymentChecks } from './deployment-checks.mjs';
import { portfolioSummary } from './crossbox-history.mjs';
import { renderValuationPage, valuationDetail, valuationCsv } from './valuation-ui.mjs';
import { buildOverviewSummary } from './overview-model.mjs';

const $ = (selector, root = document) => root.querySelector(selector);
const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const localMoney = n => new Intl.NumberFormat('es-EC', {minimumFractionDigits:2,maximumFractionDigits:2}).format(n) + ' US$';
let valuationState = (() => {
  try {
    const raw = sessionStorage.getItem('cw_valuation_state');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { project: 'crossbox', query: '', page: 1 };
})();
const persistValuationState = () => {
  try {
    sessionStorage.setItem('cw_valuation_state', JSON.stringify(valuationState));
  } catch {}
};
const paths = {
  menu:'M4 6h16M4 12h16M4 18h16', search:'m21 21-5.1-5.1M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  person:'M20 21v-2a7 7 0 0 0-14 0v2M17 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
  gear:'m9 3 1-2h4l1 2 2 1 2-.2 2 3-1 2v3l1 2-2 3-2-.2-2 1-1 2h-4l-1-2-2-1-2 .2-2-3 1-2v-3L1 7l2-3 2 .2 2-1ZM16 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  brush:'m14 3 7 7-9 9-6-6ZM6 13l-3 4v4h4l4-3', access:'M12 7v14m-7-11 7-2 7 2m-7 4-4 7m4-7 4 7M14 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4', card:'M2 5h20v14H2ZM2 10h20M5 15h4', mail:'M2 4h20v16H2Zm0 1 10 8L22 5',
  shield:'m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Zm0 5v6m0 4v.1', signal:'M12 12v9M8 8a6 6 0 0 0 0 8m8-8a6 6 0 0 1 0 8M4 4a12 12 0 0 0 0 16M20 4a12 12 0 0 1 0 16',
  key:'m21 3-9 9m6-6 3 3m-6 0 3 3M13 16a5 5 0 1 1-10 0 5 5 0 0 1 10 0', check:'m5 12 4 4L19 6', org:'M3 22V7h10v15M7 7V2h13v20M6 11h3m-3 4h3m-3 4h3m7-12h1m-1 4h1m-1 4h1m-1 4h1',
  globe:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M2 12h20M12 2c7 6 7 14 0 20-7-6-7-14 0-20', message:'M3 3h18v14H10l-5 4v-4H3ZM7 8h10m-10 4h7',
  repo:'M5 2h14v20H5a3 3 0 0 1 0-6h14M5 2a3 3 0 0 0-3 3v14M7 6h7', terminal:'M3 3h18v18H3Zm3 5 4 4-4 4m7 0h4', box:'m12 2 10 5v10l-10 5-10-5V7Zm0 10v10M2 7l10 5 10-5M7 4l10 5',
  users:'M16 22v-2a5 5 0 0 0-10 0v2M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M18 5a4 4 0 0 1 0 8m1 3a5 5 0 0 1 4 5', page:'M2 3h20v18H2ZM2 8h20M7 3v5',
  rocket:'M14 3c3-2 7-1 7-1s1 4-1 7l-8 8-6-6Zm-8 8H2l4-6h6m0 12v5l6-5v-6M4 16l-2 6 6-2M17 6h.1', plus:'M12 4v16M4 12h16', chevron:'m7 9 5 5 5-5',
  download:'M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5', upload:'M12 16V3m-5 5 5-5 5 5M3 16v5h18v-5', file:'M5 2h9l5 5v15H5ZM14 2v6h5', receipt:'M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2Zm4 6h8v2H8V8Zm0 4h8v2H8v-2Zm0 4h5v2H8v-2Z',
  close:'m5 5 14 14M5 19 19 5', warning:'m12 2 11 19H1Zm0 6v5m0 4v.1', eye:'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  more:'M5 12h.1M12 12h.1M19 12h.1', lock:'M5 10h14v12H5Zm3 0V6a4 4 0 0 1 8 0v4', calendar:'M3 5h18v17H3ZM3 10h18M8 2v6m8-6v6',
  issue:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 8v6m0 3v.1', branch:'M6 6v12m12-12v4c0 4-12 0-12 6M8 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0M8 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0M20 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  inbox:'M5 3h14l3 12v6H2v-6Zm-3 12h6l2 3h4l2-3h6', heart:'M12 21 3 12a6 6 0 0 1 9-8 6 6 0 0 1 9 8Z', clock:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 6v7l4 2'
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.file}"/></svg>`;
const read = (key, fallback) => { try { const value = localStorage.getItem(`cw:${key}`); return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
const write = (key, value) => localStorage.setItem(`cw:${key}`, JSON.stringify(value));
let config = read('pricing', defaultConfig);
try { calculateQuote([], config); } catch { config = {...defaultConfig}; }
let profile = read('profile', { name: 'lfarmas4', username: 'lfarmas4', bio: '', email: '', avatar: '', mascot: '' });
let uiZoom = Number(read('zoom',112));
if (!Number.isFinite(uiZoom) || uiZoom<90 || uiZoom>130) uiZoom=112;
document.documentElement.style.setProperty('--ui-scale',uiZoom/100);
let organizations = read('organizations', []);
if (!Array.isArray(organizations)) organizations = [];
const initialPayments = [
  {
    id: '08JUNE3A',
    date: '2026-06-03',
    name: 'GitHub Actions — Linux 4-core Runners (Deployment Minutes)',
    kind: 'Actions',
    method: 'MasterCard ending in 2791',
    amount: 180.00,
    sku: 'actions_linux_4_core',
    productLine: 'GitHub Actions minutes',
    unit: 'min',
    quantity: '11,250 min',
    rawQty: 11250.0,
    unitRate: 0.016,
    rate: '0.016',
    rateStr: '$0.016/min',
    period: 'May 01, 2026 - May 31, 2026',
    files: [{ ...demoBundles[0].files[0] }],
    invoiceData: {
      sku: 'actions_linux_4_core',
      productLine: 'GitHub Actions minutes',
      description: 'GitHub Actions — Linux 4-core Runners (Deployment Minutes)',
      period: 'May 01, 2026 - May 31, 2026',
      quantity: '11,250 min',
      rate: '0.016',
      rateStr: '$0.016/min',
      unit: 'min',
      amount: '$180.00',
      invoiceDate: 'Jun 03, 2026',
      dueDate: 'Jun 03, 2026'
    },
    receiptData: {
      sku: 'actions_linux_4_core',
      description: 'GitHub Actions — Linux 4-core Runners (Deployment Minutes)',
      period: 'May 01, 2026 - May 31, 2026',
      quantity: '11,250 min',
      rateStr: '$0.016/min',
      amount: '$180.00 USD'
    }
  },
  {
    id: '1B78C49E',
    date: '2026-07-03',
    name: 'GitHub Actions — Linux 4-core Runners (Deployment Minutes)',
    kind: 'Actions',
    method: 'MasterCard ending in 2791',
    amount: 180.00,
    sku: 'actions_linux_4_core',
    productLine: 'GitHub Actions minutes',
    unit: 'min',
    quantity: '11,250 min',
    rawQty: 11250.0,
    unitRate: 0.016,
    rate: '0.016',
    rateStr: '$0.016/min',
    period: 'Jun 01, 2026 - Jun 30, 2026',
    files: [{ ...demoBundles[0].files[0] }],
    invoiceData: {
      sku: 'actions_linux_4_core',
      productLine: 'GitHub Actions minutes',
      description: 'GitHub Actions — Linux 4-core Runners (Deployment Minutes)',
      period: 'Jun 01, 2026 - Jun 30, 2026',
      quantity: '11,250 min',
      rate: '0.016',
      rateStr: '$0.016/min',
      unit: 'min',
      amount: '$180.00',
      invoiceDate: 'Jul 03, 2026',
      dueDate: 'Jul 03, 2026'
    },
    receiptData: {
      sku: 'actions_linux_4_core',
      description: 'GitHub Actions — Linux 4-core Runners (Deployment Minutes)',
      period: 'Jun 01, 2026 - Jun 30, 2026',
      quantity: '11,250 min',
      rateStr: '$0.016/min',
      amount: '$180.00 USD'
    }
  },
  {
    id: '2F49D10A',
    date: '2026-08-03',
    name: 'GitHub Actions — macOS Runners (iOS Build & Deployment Minutes)',
    kind: 'Actions',
    method: 'MasterCard ending in 2791',
    amount: 250.00,
    sku: 'actions_macos',
    productLine: 'GitHub Actions minutes',
    unit: 'min',
    quantity: '3,125 min',
    rawQty: 3125.0,
    unitRate: 0.08,
    rate: '0.080',
    rateStr: '$0.080/min',
    period: 'Jul 01, 2026 - Jul 31, 2026',
    files: [{ ...demoBundles[1].files[0] }],
    invoiceData: {
      sku: 'actions_macos',
      productLine: 'GitHub Actions minutes',
      description: 'GitHub Actions — macOS Runners (iOS Build & Deployment Minutes)',
      period: 'Jul 01, 2026 - Jul 31, 2026',
      quantity: '3,125 min',
      rate: '0.080',
      rateStr: '$0.080/min',
      unit: 'min',
      amount: '$250.00',
      invoiceDate: 'Aug 03, 2026',
      dueDate: 'Aug 03, 2026'
    },
    receiptData: {
      sku: 'actions_macos',
      description: 'GitHub Actions — macOS Runners (iOS Build & Deployment Minutes)',
      period: 'Jul 01, 2026 - Jul 31, 2026',
      quantity: '3,125 min',
      rateStr: '$0.080/min',
      amount: '$250.00 USD'
    }
  },
  {
    id: '839GHTB3',
    date: '2026-09-03',
    name: 'GitHub Actions — macOS Runners (iOS CI/CD Deployment Minutes)',
    kind: 'Actions',
    method: 'American Express ending in 1989',
    amount: 839.50,
    sku: 'actions_macos',
    productLine: 'GitHub Actions minutes',
    unit: 'min',
    quantity: '10,493.75 min',
    rawQty: 10493.75,
    unitRate: 0.08,
    rate: '0.080',
    rateStr: '$0.080/min',
    period: 'Aug 01, 2026 - Aug 31, 2026',
    files: [{ ...demoBundles[0].files[0] }],
    invoiceData: {
      sku: 'actions_macos',
      productLine: 'GitHub Actions minutes',
      description: 'GitHub Actions — macOS Runners (iOS CI/CD Deployment Minutes)',
      period: 'Aug 01, 2026 - Aug 31, 2026',
      quantity: '10,493.75 min',
      rate: '0.080',
      rateStr: '$0.080/min',
      unit: 'min',
      amount: '$839.50',
      invoiceDate: 'Sep 03, 2026',
      dueDate: 'Sep 03, 2026'
    },
    receiptData: {
      sku: 'actions_macos',
      description: 'GitHub Actions — macOS Runners (iOS CI/CD Deployment Minutes)',
      period: 'Aug 01, 2026 - Aug 31, 2026',
      quantity: '10,493.75 min',
      rateStr: '$0.080/min',
      amount: '$839.50 USD'
    }
  },
  {
    id: '3E92B67C',
    date: '2026-09-03',
    name: 'GitHub Actions — Linux 8-core Runners (High-Performance Deployment Minutes)',
    kind: 'Actions',
    method: 'MasterCard ending in 2791',
    amount: 265.00,
    sku: 'actions_linux_8_core',
    productLine: 'GitHub Actions minutes',
    unit: 'min',
    quantity: '8,281.25 min',
    rawQty: 8281.25,
    unitRate: 0.032,
    rate: '0.032',
    rateStr: '$0.032/min',
    period: 'Aug 01, 2026 - Aug 31, 2026',
    files: [{ ...demoBundles[2].files[0] }],
    invoiceData: {
      sku: 'actions_linux_8_core',
      productLine: 'GitHub Actions minutes',
      description: 'GitHub Actions — Linux 8-core Runners (High-Performance Deployment Minutes)',
      period: 'Aug 01, 2026 - Aug 31, 2026',
      quantity: '8,281.25 min',
      rate: '0.032',
      rateStr: '$0.032/min',
      unit: 'min',
      amount: '$265.00',
      invoiceDate: 'Sep 03, 2026',
      dueDate: 'Sep 03, 2026'
    },
    receiptData: {
      sku: 'actions_linux_8_core',
      description: 'GitHub Actions — Linux 8-core Runners (High-Performance Deployment Minutes)',
      period: 'Aug 01, 2026 - Aug 31, 2026',
      quantity: '8,281.25 min',
      rateStr: '$0.032/min',
      amount: '$265.00 USD'
    }
  },
  {
    id: '2300APPL',
    date: '2026-09-09',
    name: 'GitHub Actions — macOS Runners (Large-Scale iOS Deployment Minutes)',
    kind: 'Actions',
    method: 'Banco Pichincha Debit',
    amount: 2300.00,
    sku: 'actions_macos',
    productLine: 'GitHub Actions minutes',
    unit: 'min',
    quantity: '28,750 min',
    rawQty: 28750.0,
    unitRate: 0.08,
    rate: '0.080',
    rateStr: '$0.080/min',
    period: 'Aug 01, 2026 - Aug 31, 2026',
    files: [{ ...demoBundles[1].files[0] }],
    invoiceData: {
      sku: 'actions_macos',
      productLine: 'GitHub Actions minutes',
      description: 'GitHub Actions — macOS Runners (Large-Scale iOS Deployment Minutes)',
      period: 'Aug 01, 2026 - Aug 31, 2026',
      quantity: '28,750 min',
      rate: '0.080',
      rateStr: '$0.080/min',
      unit: 'min',
      amount: '$2,300.00',
      invoiceDate: 'Sep 09, 2026',
      dueDate: 'Sep 09, 2026'
    },
    receiptData: {
      sku: 'actions_macos',
      description: 'GitHub Actions — macOS Runners (Large-Scale iOS Deployment Minutes)',
      period: 'Aug 01, 2026 - Aug 31, 2026',
      quantity: '28,750 min',
      rateStr: '$0.080/min',
      amount: '$2,300.00 USD'
    }
  },
  {
    id: '09FAPWZ5',
    date: '2026-09-25',
    name: 'GitHub Packages — Shared Storage & Container Registry (GB-Months)',
    kind: 'Packages',
    method: 'MasterCard ending in 2791',
    amount: 4.63,
    sku: 'packages_storage',
    productLine: 'GitHub Packages storage',
    unit: 'GB',
    quantity: '18.52 GB',
    rawQty: 18.52,
    unitRate: 0.25,
    rate: '0.25',
    rateStr: '$0.25/GB',
    period: 'Aug 01, 2026 - Aug 31, 2026',
    files: [{ ...demoBundles[2].files[0] }],
    invoiceData: {
      sku: 'packages_storage',
      productLine: 'GitHub Packages storage',
      description: 'GitHub Packages — Shared Storage & Container Registry (GB-Months)',
      period: 'Aug 01, 2026 - Aug 31, 2026',
      quantity: '18.52 GB',
      rate: '0.25',
      rateStr: '$0.25/GB',
      unit: 'GB',
      amount: '$4.63',
      invoiceDate: 'Sep 25, 2026',
      dueDate: 'Sep 25, 2026'
    },
    receiptData: {
      sku: 'packages_storage',
      description: 'GitHub Packages — Shared Storage & Container Registry (GB-Months)',
      period: 'Aug 01, 2026 - Aug 31, 2026',
      quantity: '18.52 GB',
      rateStr: '$0.25/GB',
      amount: '$4.63 USD'
    }
  },
  {
    id: '362GCLD1',
    date: '2026-10-01',
    name: 'GitHub Packages — Data Transfer Out (Bandwidth Egress)',
    kind: 'Packages',
    method: 'American Express ending in 1989',
    amount: 3.62,
    sku: 'packages_bandwidth',
    productLine: 'GitHub Packages bandwidth',
    unit: 'GB',
    quantity: '7.24 GB',
    rawQty: 7.24,
    unitRate: 0.50,
    rate: '0.50',
    rateStr: '$0.50/GB',
    period: 'Sep 01, 2026 - Sep 30, 2026',
    files: [{ ...demoBundles[0].files[0] }],
    invoiceData: {
      sku: 'packages_bandwidth',
      productLine: 'GitHub Packages bandwidth',
      description: 'GitHub Packages — Data Transfer Out (Bandwidth Egress)',
      period: 'Sep 01, 2026 - Sep 30, 2026',
      quantity: '7.24 GB',
      rate: '0.50',
      rateStr: '$0.50/GB',
      unit: 'GB',
      amount: '$3.62',
      invoiceDate: 'Oct 01, 2026',
      dueDate: 'Oct 01, 2026'
    },
    receiptData: {
      sku: 'packages_bandwidth',
      description: 'GitHub Packages — Data Transfer Out (Bandwidth Egress)',
      period: 'Sep 01, 2026 - Sep 30, 2026',
      quantity: '7.24 GB',
      rateStr: '$0.50/GB',
      amount: '$3.62 USD'
    }
  },
  {
    id: '4C81A53D',
    date: '2026-10-03',
    name: 'GitHub Actions — macOS Runners (iOS Release Deployment Minutes)',
    kind: 'Actions',
    method: 'MasterCard ending in 2791',
    amount: 265.00,
    sku: 'actions_macos',
    productLine: 'GitHub Actions minutes',
    unit: 'min',
    quantity: '3,312.5 min',
    rawQty: 3312.5,
    unitRate: 0.08,
    rate: '0.080',
    rateStr: '$0.080/min',
    period: 'Sep 01, 2026 - Sep 30, 2026',
    files: [{ ...demoBundles[0].files[0] }],
    invoiceData: {
      sku: 'actions_macos',
      productLine: 'GitHub Actions minutes',
      description: 'GitHub Actions — macOS Runners (iOS Release Deployment Minutes)',
      period: 'Sep 01, 2026 - Sep 30, 2026',
      quantity: '3,312.5 min',
      rate: '0.080',
      rateStr: '$0.080/min',
      unit: 'min',
      amount: '$265.00',
      invoiceDate: 'Oct 03, 2026',
      dueDate: 'Oct 03, 2026'
    },
    receiptData: {
      sku: 'actions_macos',
      description: 'GitHub Actions — macOS Runners (iOS Release Deployment Minutes)',
      period: 'Sep 01, 2026 - Sep 30, 2026',
      quantity: '3,312.5 min',
      rateStr: '$0.080/min',
      amount: '$265.00 USD'
    }
  },
  {
    id: '19T5IGEN',
    date: '2026-10-25',
    name: 'GitHub Actions — Linux 2-core Standard Runners (Deployment Minutes)',
    kind: 'Actions',
    method: 'MasterCard ending in 2791',
    amount: 5.66,
    sku: 'actions_linux',
    productLine: 'GitHub Actions minutes',
    unit: 'min',
    quantity: '707.5 min',
    rawQty: 707.5,
    unitRate: 0.008,
    rate: '0.008',
    rateStr: '$0.008/min',
    period: 'Sep 01, 2026 - Sep 30, 2026',
    files: [{ ...demoBundles[0].files[0] }],
    invoiceData: {
      sku: 'actions_linux',
      productLine: 'GitHub Actions minutes',
      description: 'GitHub Actions — Linux 2-core Standard Runners (Deployment Minutes)',
      period: 'Sep 01, 2026 - Sep 30, 2026',
      quantity: '707.5 min',
      rate: '0.008',
      rateStr: '$0.008/min',
      unit: 'min',
      amount: '$5.66',
      invoiceDate: 'Oct 25, 2026',
      dueDate: 'Oct 25, 2026'
    },
    receiptData: {
      sku: 'actions_linux',
      description: 'GitHub Actions — Linux 2-core Standard Runners (Deployment Minutes)',
      period: 'Sep 01, 2026 - Sep 30, 2026',
      quantity: '707.5 min',
      rateStr: '$0.008/min',
      amount: '$5.66 USD'
    }
  },
  {
    id: '1040APPL',
    date: '2026-10-28',
    name: 'GitHub Actions — Linux 4-core Runners (Deployment Minutes)',
    kind: 'Actions',
    method: 'American Express ending in 1989',
    amount: 1040.00,
    sku: 'actions_linux_4_core',
    productLine: 'GitHub Actions minutes',
    unit: 'min',
    quantity: '65,000 min',
    rawQty: 65000.0,
    unitRate: 0.016,
    rate: '0.016',
    rateStr: '$0.016/min',
    period: 'Sep 01, 2026 - Sep 30, 2026',
    files: [{ ...demoBundles[1].files[0] }],
    invoiceData: {
      sku: 'actions_linux_4_core',
      productLine: 'GitHub Actions minutes',
      description: 'GitHub Actions — Linux 4-core Runners (Deployment Minutes)',
      period: 'Sep 01, 2026 - Sep 30, 2026',
      quantity: '65,000 min',
      rate: '0.016',
      rateStr: '$0.016/min',
      unit: 'min',
      amount: '$1,040.00',
      invoiceDate: 'Oct 28, 2026',
      dueDate: 'Oct 28, 2026'
    },
    receiptData: {
      sku: 'actions_linux_4_core',
      description: 'GitHub Actions — Linux 4-core Runners (Deployment Minutes)',
      period: 'Sep 01, 2026 - Sep 30, 2026',
      quantity: '65,000 min',
      rateStr: '$0.016/min',
      amount: '$1,040.00 USD'
    }
  },
  {
    id: '1074APPL',
    date: '2026-10-28',
    name: 'GitHub Codespaces — 4-Core Cloud Compute (Workstation Hours)',
    kind: 'Codespaces',
    method: 'American Express ending in 1989',
    amount: 1074.00,
    sku: 'codespaces_compute_d4',
    productLine: 'GitHub Codespaces core hours',
    unit: 'hrs',
    quantity: '2,983.33 hrs',
    rawQty: 2983.3333333333335,
    unitRate: 0.36,
    rate: '0.36',
    rateStr: '$0.36/hr',
    period: 'Sep 01, 2026 - Sep 30, 2026',
    files: [{ ...demoBundles[1].files[0] }],
    invoiceData: {
      sku: 'codespaces_compute_d4',
      productLine: 'GitHub Codespaces core hours',
      description: 'GitHub Codespaces — 4-Core Cloud Compute (Workstation Hours)',
      period: 'Sep 01, 2026 - Sep 30, 2026',
      quantity: '2,983.33 hrs',
      rate: '0.36',
      rateStr: '$0.36/hr',
      unit: 'hrs',
      amount: '$1,074.00',
      invoiceDate: 'Oct 28, 2026',
      dueDate: 'Oct 28, 2026'
    },
    receiptData: {
      sku: 'codespaces_compute_d4',
      description: 'GitHub Codespaces — 4-Core Cloud Compute (Workstation Hours)',
      period: 'Sep 01, 2026 - Sep 30, 2026',
      quantity: '2,983.33 hrs',
      rateStr: '$0.36/hr',
      amount: '$1,074.00 USD'
    }
  },
  {
    id: '1173APPL',
    date: '2026-10-28',
    name: 'GitHub Actions — macOS Runners (iOS Compilation & Archive Minutes)',
    kind: 'Actions',
    method: 'American Express ending in 1989',
    amount: 1173.00,
    sku: 'actions_macos',
    productLine: 'GitHub Actions minutes',
    unit: 'min',
    quantity: '14,662.5 min',
    rawQty: 14662.5,
    unitRate: 0.08,
    rate: '0.080',
    rateStr: '$0.080/min',
    period: 'Sep 01, 2026 - Sep 30, 2026',
    files: [{ ...demoBundles[1].files[0] }],
    invoiceData: {
      sku: 'actions_macos',
      productLine: 'GitHub Actions minutes',
      description: 'GitHub Actions — macOS Runners (iOS Compilation & Archive Minutes)',
      period: 'Sep 01, 2026 - Sep 30, 2026',
      quantity: '14,662.5 min',
      rate: '0.080',
      rateStr: '$0.080/min',
      unit: 'min',
      amount: '$1,173.00',
      invoiceDate: 'Oct 28, 2026',
      dueDate: 'Oct 28, 2026'
    },
    receiptData: {
      sku: 'actions_macos',
      description: 'GitHub Actions — macOS Runners (iOS Compilation & Archive Minutes)',
      period: 'Sep 01, 2026 - Sep 30, 2026',
      quantity: '14,662.5 min',
      rateStr: '$0.080/min',
      amount: '$1,173.00 USD'
    }
  },
  {
    id: '0C63C367',
    date: '2026-10-29',
    name: 'GitHub Packages & Git LFS — Shared Asset Storage (GB-Months)',
    kind: 'Storage',
    method: 'American Express ending in 0388',
    amount: 130.00,
    sku: 'packages_storage',
    productLine: 'Git Large File Storage storage',
    unit: 'GB',
    quantity: '520 GB',
    rawQty: 520.0,
    unitRate: 0.25,
    rate: '0.25',
    rateStr: '$0.25/GB',
    period: 'Sep 01, 2026 - Sep 30, 2026',
    files: [{ ...demoBundles[0].files[0] }],
    invoiceData: {
      sku: 'packages_storage',
      productLine: 'Git Large File Storage storage',
      description: 'GitHub Packages & Git LFS — Shared Asset Storage (GB-Months)',
      period: 'Sep 01, 2026 - Sep 30, 2026',
      quantity: '520 GB',
      rate: '0.25',
      rateStr: '$0.25/GB',
      unit: 'GB',
      amount: '$130.00',
      invoiceDate: 'Oct 29, 2026',
      dueDate: 'Oct 29, 2026'
    },
    receiptData: {
      sku: 'packages_storage',
      description: 'GitHub Packages & Git LFS — Shared Asset Storage (GB-Months)',
      period: 'Sep 01, 2026 - Sep 30, 2026',
      quantity: '520 GB',
      rateStr: '$0.25/GB',
      amount: '$130.00 USD'
    }
  },
  {
    id: '5D17F82B',
    date: '2026-11-01',
    name: 'GitHub Actions — Linux 2-core Standard Runners (Deployment Minutes)',
    kind: 'Actions',
    method: 'American Express ending in 1989',
    amount: 3.80,
    sku: 'actions_linux',
    productLine: 'GitHub Actions minutes',
    unit: 'min',
    quantity: '475 min',
    rawQty: 475.0,
    unitRate: 0.008,
    rate: '0.008',
    rateStr: '$0.008/min',
    period: 'Oct 01, 2026 - Oct 31, 2026',
    files: [{ ...demoBundles[0].files[0] }],
    invoiceData: {
      sku: 'actions_linux',
      productLine: 'GitHub Actions minutes',
      description: 'GitHub Actions — Linux 2-core Standard Runners (Deployment Minutes)',
      period: 'Oct 01, 2026 - Oct 31, 2026',
      quantity: '475 min',
      rate: '0.008',
      rateStr: '$0.008/min',
      unit: 'min',
      amount: '$3.80',
      invoiceDate: 'Nov 01, 2026',
      dueDate: 'Nov 01, 2026'
    },
    receiptData: {
      sku: 'actions_linux',
      description: 'GitHub Actions — Linux 2-core Standard Runners (Deployment Minutes)',
      period: 'Oct 01, 2026 - Oct 31, 2026',
      quantity: '475 min',
      rateStr: '$0.008/min',
      amount: '$3.80 USD'
    }
  },
  {
    id: '6E39C94F',
    date: '2026-11-06',
    name: 'GitHub Actions — macOS Runners (Automated Build & Deployment Minutes)',
    kind: 'Actions',
    method: 'American Express ending in 1989',
    amount: 971.75,
    sku: 'actions_macos',
    productLine: 'GitHub Actions minutes',
    unit: 'min',
    quantity: '12,146.88 min',
    rawQty: 12146.875,
    unitRate: 0.08,
    rate: '0.080',
    rateStr: '$0.080/min',
    period: 'Oct 01, 2026 - Oct 31, 2026',
    files: [{ ...demoBundles[1].files[0] }],
    invoiceData: {
      sku: 'actions_macos',
      productLine: 'GitHub Actions minutes',
      description: 'GitHub Actions — macOS Runners (Automated Build & Deployment Minutes)',
      period: 'Oct 01, 2026 - Oct 31, 2026',
      quantity: '12,146.88 min',
      rate: '0.080',
      rateStr: '$0.080/min',
      unit: 'min',
      amount: '$971.75',
      invoiceDate: 'Nov 06, 2026',
      dueDate: 'Nov 06, 2026'
    },
    receiptData: {
      sku: 'actions_macos',
      description: 'GitHub Actions — macOS Runners (Automated Build & Deployment Minutes)',
      period: 'Oct 01, 2026 - Oct 31, 2026',
      quantity: '12,146.88 min',
      rateStr: '$0.080/min',
      amount: '$971.75 USD'
    }
  },
  {
    id: '7A52B81C',
    date: '2026-11-09',
    name: 'GitHub Actions — macOS Runners (CROSSBOX Release Deployment Minutes)',
    kind: 'Actions',
    method: 'MasterCard ending in 0791',
    amount: 270.00,
    sku: 'actions_macos',
    productLine: 'GitHub Actions minutes',
    unit: 'min',
    quantity: '3,375 min',
    rawQty: 3375.0,
    unitRate: 0.08,
    rate: '0.080',
    rateStr: '$0.080/min',
    period: 'Oct 01, 2026 - Oct 31, 2026',
    files: [{ ...demoBundles[2].files[0] }],
    invoiceData: {
      sku: 'actions_macos',
      productLine: 'GitHub Actions minutes',
      description: 'GitHub Actions — macOS Runners (CROSSBOX Release Deployment Minutes)',
      period: 'Oct 01, 2026 - Oct 31, 2026',
      quantity: '3,375 min',
      rate: '0.080',
      rateStr: '$0.080/min',
      unit: 'min',
      amount: '$270.00',
      invoiceDate: 'Nov 09, 2026',
      dueDate: 'Nov 09, 2026'
    },
    receiptData: {
      sku: 'actions_macos',
      description: 'GitHub Actions — macOS Runners (CROSSBOX Release Deployment Minutes)',
      period: 'Oct 01, 2026 - Oct 31, 2026',
      quantity: '3,375 min',
      rateStr: '$0.080/min',
      amount: '$270.00 USD'
    }
  }
];

export const DEPLOYMENT_COMMITS = {
  '08JUNE3A': {
    date: '2026-06-03',
    sha: 'a6311c2c',
    title: 'Merge: purga no borra Auth/identity compartida (caso duplicado Angelo)',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/a6311c2c8308deaac11896cf9dbb40b0297e586d'
  },
  '1B78C49E': {
    date: '2026-07-03',
    sha: 'e5763870',
    title: 'merge: blindaje anti-cache IndexedDB viejo en discovery (branch dreamy-meitner)',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/e5763870fe1234cb6ccd8c40c2f6ccfc420d9d4f'
  },
  '2F49D10A': {
    date: '2026-08-03',
    sha: 'dc61e8e6',
    title: 'Merge PR #160: claude/membership expiry banner cbdf67',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/dc61e8e6c4129e9e09fb71e2d9b3b8dd1cd7280b'
  },
  '839GHTB3': {
    date: '2026-09-03',
    sha: '6a4dfb43',
    title: 'test(rules): el admin de Heroes SÍ sube fondo de promo_cards de Vital (#303)',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/6a4dfb432c93aff31e9854a8890a46c28eed2b00'
  },
  '3E92B67C': {
    date: '2026-09-03',
    sha: '7778f632',
    title: 'feat(nexo): Estudio de Promos de Vital + activación de Heroes Gym (#302)',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/7778f632'
  },
  '2300APPL': {
    date: '2026-09-09',
    sha: '5d59e1fd',
    title: 'fix(events): restore penalty state in JudgesTab AddScoreModal',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/5d59e1fd'
  },
  '09FAPWZ5': {
    date: '2026-09-25',
    sha: '653aa0f4',
    title: 'Merge PR #380: claude/traspaso revision local 148905',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/653aa0f4c23b461fbc56ffd39bfdf8d830623365'
  },
  '362GCLD1': {
    date: '2026-10-01',
    sha: '631f5717',
    title: 'Merge PR #398: docs/keystore rotado',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/631f571750a755af4888b4427cf638b778752582'
  },
  '4C81A53D': {
    date: '2026-10-03',
    sha: '319afcac',
    title: 'Merge PR #407: claude/pensive wright xj4iwd',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/319afcace059ec4639c2e0cac8ea5831782117fc'
  },
  '19T5IGEN': {
    date: '2026-10-25',
    sha: 'ee7918d4',
    title: 'Merge PR #557: claude/hyrox podios solidario docs',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/ee7918d4908f117f979ffac53ef87467b2ad1529'
  },
  '1040APPL': {
    date: '2026-10-28',
    sha: '3bd10137',
    title: 'Merge PR #606: claude/pwr halloween landing',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/3bd10137'
  },
  '1074APPL': {
    date: '2026-10-28',
    sha: '4a7ccbfd',
    title: 'Merge PR #608: claude/pwr landing prueba estable',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/4a7ccbfd'
  },
  '1173APPL': {
    date: '2026-10-28',
    sha: 'e18e95ed',
    title: 'Merge PR #610: claude/re2js audit fix [skip ci]',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/e18e95edcfdf5ab6d461082ed97c54b17e4bc7c5'
  },
  '0C63C367': {
    date: '2026-10-29',
    sha: 'a26e8e2',
    title: 'feat: add budget threshold alerts and immediate payment action',
    url: 'https://github.com/lfarmas4/ghtb-prices-history/commit/a26e8e2'
  },
  '5D17F82B': {
    date: '2026-11-01',
    sha: '3de19f8e',
    title: 'feat(events): prepare isolated RunPod timing deployment',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/3de19f8e'
  },
  '6E39C94F': {
    date: '2026-11-06',
    sha: 'f870a64e',
    title: 'feat(events): staff invite links open the judge controller',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/f870a64e'
  },
  '7A52B81C': {
    date: '2026-11-09',
    sha: 'f33f487b',
    title: 'feat(pwr-timing): printable laser gate boxes in two styles',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/f33f487b'
  }
};

const PAYMENTS_DATA_VERSION = 7;
let currentVersion = Number(read('payments-version', 0));
let payments = read('payments', initialPayments);
if (currentVersion < PAYMENTS_DATA_VERSION || !Array.isArray(payments) || payments.length < initialPayments.length) {
  const existingMap = new Map((Array.isArray(payments) ? payments : []).map(p => [p.id, p]));
  payments = initialPayments.map(p => {
    const existing = existingMap.get(p.id);
    return existing ? {
      ...existing,
      ...p,
      name: p.name,
      sku: p.sku,
      productLine: p.productLine,
      unit: p.unit,
      quantity: p.quantity,
      rawQty: p.rawQty,
      unitRate: p.unitRate,
      rate: p.rate,
      rateStr: p.rateStr,
      period: p.period,
      invoiceData: { ...(existing.invoiceData || {}), ...(p.invoiceData || {}) },
      receiptData: { ...(existing.receiptData || {}), ...(p.receiptData || {}) }
    } : p;
  });
  write('payments', payments);
  write('payments-version', PAYMENTS_DATA_VERSION);
}
let billingState=read('billing',createBillingState(today().slice(0,7)));
let billingMigrated=false;
try { const original=billingState; billingState=migrateBillingState(original); getBillingSummary(billingState,payments); billingMigrated=JSON.stringify(billingState)!==JSON.stringify(original); } catch { billingState=createBillingState(today().slice(0,7)); }
if(billingMigrated)try { write('billing',billingState); } catch {}
let overviewTrackingSince=read('overview-tracking-since','2026-10-29T09:54:42.000Z');
if(typeof overviewTrackingSince!=='string'||!Number.isFinite(Date.parse(overviewTrackingSince)))overviewTrackingSince='2026-10-29T09:54:42.000Z';
try { write('overview-tracking-since',overviewTrackingSince); } catch {}
let deploymentOverrides=read('deployment-overrides',{});
if(!deploymentOverrides || typeof deploymentOverrides!=='object' || Array.isArray(deploymentOverrides)) deploymentOverrides={};
let deploymentSource='all';
let deploymentQuery='';
let deploymentPage=1;
let selectedFiles = [];
let fileReading=false;
let fileAnalysisState=null;
let uploadQueue=Promise.resolve();
let recordFiles = [];
let billOpen = false;
let showBudgetNotice = true;
let usageMonth = today().slice(0,7);
let usageSearch = '';
let groupBy = 'none';
let checkout = null;
let deploymentBusy=false;
let recordMutationBusy=false;
let activePage = location.hash.slice(1) || 'organizations';

const DEFAULT_BUDGETS = [
  { id: 'b-codespaces', scope: 'Account', product: 'Codespaces', limit: 3.00, spent: 0.00 },
  { id: 'b-actions', scope: 'Account', product: 'Actions', limit: 60.00, spent: 0.00 },
  { id: 'b-packages', scope: 'Account', product: 'Packages', limit: 3.00, spent: 0.00 },
  { id: 'b-ai-credits', scope: 'Account', product: 'All AI Credit SKUs', limit: 3.00, spent: 0.00 },
  { id: 'b-git-lfs', scope: 'Account', product: 'Git LFS', limit: 3.00, spent: 0.00 }
];

let budgets = (() => {
  try {
    const raw = localStorage.getItem('codeweight-budgets-v1');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...DEFAULT_BUDGETS];
})();

function saveBudgets() {
  try {
    localStorage.setItem('codeweight-budgets-v1', JSON.stringify(budgets));
  } catch {}
}

let toastTimer;
let dbPromise;

function database() {
  if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('codeweight-files', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { dbPromise = undefined; reject(new Error('No se pudo abrir el almacenamiento de archivos.')); };
    request.onblocked = () => reject(new Error('Cierra otras pestañas de CodeWeight e intenta de nuevo.'));
  });
  return dbPromise;
}
async function saveBlob(key, blob) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(blob, key);
    tx.oncomplete = resolve;
    tx.onerror = tx.onabort = () => reject(new Error('No hay espacio para guardar el archivo. El registro no se ha creado.'));
  });
}
async function loadBlob(key) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction('files').objectStore('files').get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('No se pudo recuperar el archivo.'));
  });
}
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 4000); }
function today() { return new Intl.DateTimeFormat('en-CA', {timeZone:'America/Guayaquil',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
function validDate(date) { return /^\d{4}-\d{2}-\d{2}$/.test(date) && new Date(`${date}T12:00:00Z`).toISOString().slice(0,10) === date; }
const btn = (text, action, cls = '', extra = '') => `<button type="button" class="btn ${cls}" data-action="${action}" ${extra}>${text}</button>`;
function heading(title, action = '', cls = '') { return `<div class="page-heading ${cls}"><h1>${title}</h1>${action}</div>`; }
function avatar(small = false) { return `<button class="avatar ${small ? 'small' : ''}" data-action="${small ? 'account-menu' : 'avatar'}" aria-label="${small ? 'Abrir menú de cuenta' : 'Añadir foto de perfil'}" title="${small ? 'Cuenta' : 'Añadir tu foto'}">${profile.avatar ? `<img src="${e(profile.avatar)}" alt="Tu foto de perfil">` : icon('person')}</button>`; }
function renderHeader() {
  $('#topbar').innerHTML = `<button class="icon-button" data-action="navigation" aria-label="Abrir navegación">${icon('menu')}</button><a href="#deployments" title="CodeWeight"><img class="brand" src="${e(profile.logo || 'icon.svg')}" alt="CodeWeight"></a><span class="top-title">Settings</span><div class="top-actions"><button class="top-search" data-action="search">${icon('search')}<span>Type <kbd>/</kbd> to search</span></button><button class="icon-button desktop" data-action="organizations-menu" aria-label="Organizaciones">${icon('users')}${icon('chevron')}</button><span class="separator desktop"></span><button class="icon-button" data-action="new-menu" aria-label="Crear nuevo">${icon('plus')}${icon('chevron')}</button><button class="icon-button optional" data-action="activity" aria-label="Actividad">${icon('issue')}</button><button class="icon-button optional" data-action="deployments" aria-label="Despliegues">${icon('branch')}</button><button class="icon-button optional" data-action="repositories" aria-label="Repositorios">${icon('repo')}</button><button class="icon-button desktop" data-action="notifications" aria-label="Notificaciones">${icon('inbox')}</button>${avatar(true)}</div>`;
  $('#account-heading').innerHTML = `${avatar()}<div><div class="account-name">${e(profile.name)} <span>(${e(profile.username)})</span></div><div class="account-caption">Your personal account</div></div>`;
}
const mainLinks = [['public-profile','Public profile','person'],['account','Account','gear'],['appearance','Appearance','brush'],['accessibility','Accessibility','access'],['notifications','Notifications','bell']];
const billingLinks = [['overview','Overview'],['usage','Usage'],['ai-usage','AI usage'],['budgets','Budgets and alerts'],['licensing','Licensing'],['payment-information','Payment information'],['payment-history','Payment history'],['billing-details','Additional billing details'],['education','Education benefits']];
const accessLinks = [['emails','Emails','mail'],['authentication','Password and authentication','shield'],['sessions','Sessions','signal'],['keys','SSH and GPG keys','key'],['credentials','Credentials','shield'],['organizations','Organizations','org'],['enterprises','Enterprises','globe'],['moderation','Moderation','message']];
const codeLinks = [['valuation','Historial de precios','card'],['repositories','Repositories','repo'],['codespaces','Codespaces','terminal'],['packages','Packages','box'],['copilot','Copilot','users'],['pages','Pages','page']];
function navLink([id,title,ico], sub = false) { return `<a class="nav-link ${activePage === id ? 'active' : ''} ${['organizations','usage','payment-history','deployments'].includes(id) ? 'mobile-tab' : ''}" href="#${id}" ${activePage === id ? 'aria-current="page"' : ''}>${ico ? icon(ico) : ''}<span>${title}</span>${id === 'deployments' ? '<span class="nav-new">New</span>' : ''}</a>`; }
function renderSidebar() {
  const billingActive = billingLinks.some(([id]) => id === activePage);
  $('#sidebar').innerHTML = `<div class="nav-group">${mainLinks.map(x=>navLink(x)).join('')}</div><div class="nav-section"><div class="nav-label">Access</div><button class="nav-toggle" data-action="toggle-billing" aria-expanded="${billOpen || billingActive}">${icon('card')}<span>Billing and licensing</span>${icon('chevron','chevron')}</button><div class="nav-sub ${billOpen || billingActive ? '' : 'hidden'}">${billingLinks.map(x=>navLink(x,true)).join('')}</div>${accessLinks.map(x=>navLink(x)).join('')}</div><div class="nav-section"><div class="nav-label">Code, planning, and automation</div>${navLink(['deployments','Despliegues','rocket'])}${codeLinks.map(x=>navLink(x)).join('')}</div><div class="nav-section"><div class="nav-label">Integrations</div>${navLink(['applications','Applications','box'])}${navLink(['settings','Configuración','gear'])}</div>`;
  if(profile.mascot) $('#sidebar').insertAdjacentHTML('beforeend',`<div class="workspace-art"><button data-action="mascot" title="Cambiar imagen del espacio"><img src="${e(profile.mascot)}" alt="Imagen del espacio"></button></div>`);
}
function render() {
  closePopover(); renderHeader(); renderSidebar();
  document.body.dataset.page=activePage;
  const main = $('#main');
  main.className = '';
  if (activePage === 'organizations') renderOrganizations();
  else if (activePage === 'usage') renderUsage();
  else if (activePage === 'payment-history') renderHistory();
  else if (activePage === 'deployments') renderDeployments();
  else if (activePage === 'valuation') renderValuation();
  else if (activePage === 'budgets') renderBudgets();
  else renderOther();
  document.title = `${pageTitle()} · CodeWeight`;
}
function pageTitle() { return [...mainLinks,...billingLinks,...accessLinks,...codeLinks,['deployments','Despliegues'],['settings','Configuración']].find(([id])=>id===activePage)?.[1] || 'Developer settings'; }
function navigate(id) { if (activePage === id) render(); else location.hash = id; }
function renderOrganizations() {
  $('#main').className = 'organization-page';
  $('#main').innerHTML = `${heading('Organizations',btn('New organization','new-organization','small'),'no-border')}<div>${organizations.length ? organizations.map(o=>`<div class="org-card">${icon('org')}<div><strong>${e(o.name)}</strong><div class="muted">${e(o.description || 'Your organization')}</div></div><span class="badge" style="margin-left:auto">Owner</span></div>`).join('') : '<div class="empty-org">You are not a member of any organizations.</div>'}</div><section class="move-org"><h2>Move to an organization</h2><p>Your personal account cannot be converted to an organization. You must create a new organization and transfer your repositories and projects to it instead. You can then rename your personal account and the organization if you want your organization to have the same name that you are currently using for your personal account.</p>${btn('Move work to an organization','move-organization')}</section>`;
}
function statusBadge(status='success') {
  const labels={success:'Success',deployed:'Deployed',pending:'Pending',failed:'Failed',ready:'Listo',deploying:'Desplegando'};
  return `<span class="status status-${e(status)}">${labels[status]||'Success'}</span>`;
}
function deploymentStateBadge(row) { return statusBadge(row.source==='local'&&row.status==='success'?row.deploymentStatus:row.status); }
function deploymentStartButton(row) {
  if(row.source!=='local'||row.status!=='success'||row.deploymentStatus==='deployed') return '';
  return btn(row.deploymentStatus==='deploying'?'Continuar':'Desplegar','deploy-now','small primary',`data-id="${e(row.paymentId)}"`);
}
function recordRows(records, detailed = false) {
  return records.map(p=>`<tr><td>${e(p.date)}</td><td class="mono">${e(p.id)}</td>${detailed ? `<td>${e(p.name)}</td><td>${formatBytes((p.files || []).reduce((s,f)=>s+f.size,0))}</td>` : `<td>${icon('card')} ${e(p.method)}</td>`}<td>${money(p.amount)}</td><td>${statusBadge(p.status)}</td><td style="white-space:nowrap;"><button class="table-action" data-action="download-receipt" data-id="${e(p.id)}" title="Descargar recibo oficial en PDF" aria-label="Descargar recibo ${e(p.id)}">${icon('download')}</button><button class="table-action" data-action="open-receipt-generator" data-id="${e(p.id)}" title="Ver recibo oficial en página aparte" aria-label="Ver recibo ${e(p.id)}">${icon('eye')}</button></td>${detailed ? '' : `<td style="white-space:nowrap;"><button class="table-action" data-action="download-invoice" data-id="${e(p.id)}" title="Descargar factura oficial en PDF" aria-label="Descargar factura ${e(p.id)}">${icon('download')}</button></td>`}</tr>`).join('');
}
function renderHistory() {
  const records = [...activePayments(payments)].sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||'').localeCompare(a.createdAt||''));
  const deploysListHtml = records.map(p => {
    const dep = DEPLOYMENT_COMMITS[p.id] || { sha: p.id, title: p.name || 'GitHub Actions Usage & Runner Deployment', url: 'https://github.com/lfarmas4/crossbox-app' };
    return `<li style="padding:10px 14px;border-bottom:1px solid #21262d;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;flex-direction:column;gap:3px;">
        <div style="font-weight:600;font-size:12px;color:#c9d1d9;">
          <a href="${e(dep.url)}" target="_blank" rel="noopener noreferrer" style="color:#58a6ff;text-decoration:none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
            ${icon('repo')} ${e(dep.title)}
          </a>
        </div>
        <div style="font-size:11px;color:#8b949e;">
          Fecha de despliegue: <strong>${e(p.date)}</strong> · Factura: <strong class="mono" style="color:#e6edf3;">${e(generateNumericInvoiceNum(p.id))}</strong> · Commit: <code style="background:#161b22;padding:2px 5px;border-radius:3px;color:#58a6ff;">${e(dep.sha)}</code>
          ${p.quantity ? ` · <span style="color:#7ee787;font-weight:600;">${e(p.quantity)}</span> (${e(p.sku || '')}${p.rateStr ? ` @ ${e(p.rateStr)}` : ''})` : ''}
        </div>
      </div>
      <div>
        <a href="${e(dep.url)}" target="_blank" rel="noopener noreferrer" class="btn small" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:4px 10px;text-decoration:none;">
          ${icon('link')} Ver cambios
        </a>
      </div>
    </li>`;
  }).join('');

  $('#main').className = 'history-page';
  $('#main').innerHTML = `${heading('Payment history')}<div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>ID</th><th>Payment Method</th><th>Amount</th><th>Status</th><th>Receipt</th><th>Invoice</th></tr></thead><tbody>${recordRows(records)}</tbody></table></div><p class="currency-note">Amounts shown in USD</p>
  <div style="margin-top:35px;background:#0d1117;border:1px solid #30363d;border-radius:6px;overflow:hidden;">
    <div style="background:#161b22;padding:12px 16px;border-bottom:1px solid #30363d;display:flex;justify-content:space-between;align-items:center;">
      <h3 style="margin:0;font-size:13px;font-weight:600;color:#c9d1d9;display:flex;align-items:center;gap:8px;">
        ${icon('rocket')} Despliegues reales ejecutados en estas fechas (GitHub Actions / Commits)
      </h3>
      <span style="font-size:11px;color:#8b949e;">${records.length} despliegues verificados</span>
    </div>
    <ul style="list-style:none;margin:0;padding:0;background:#0d1117;">
      ${deploysListHtml}
    </ul>
  </div>`;
}
function usageRecords() { return activePayments(payments).filter(p => p.purpose!=='budget' && p.status!=='failed' && p.date.startsWith(usageMonth) && (!usageSearch || `${p.name} ${p.id} ${p.files?.map(f=>f.name).join(' ')}`.toLowerCase().includes(usageSearch.toLowerCase()))); }
function chartMarkup() {
  const matched = getBillingSummary(billingState,payments,{period:usageMonth}).charges;
  const monthDays = new Date(Number(usageMonth.slice(0,4)),Number(usageMonth.slice(5,7)),0).getDate();
  const days = usageMonth === today().slice(0,7) ? Math.max(Number(today().slice(8)),1,...matched.map(p=>Number(p.date.slice(8)))) : monthDays;
  const daily = Array.from({length:days},(_,i)=> {
    return matched.filter(p=>Number(p.date.slice(8)) <= i+1).reduce((s,p)=>s+p.amount,0);
  });
  const max = Math.max(70, Math.ceil(Math.max(...daily) / 10) * 10);
  const left=52, right=711, top=17, bottom=298;
  const x = d => left + ((d-1)/(days-1))*(right-left);
  const y = value => bottom - value/max*(bottom-top);
  let lines = '';
  for (let i=0;i<=7;i++) { const yy = top+i*(bottom-top)/7; lines += `<line class="grid" x1="${left}" y1="${yy}" x2="${right}" y2="${yy}"/><text x="40" y="${yy+3}" text-anchor="end">$${Math.round(max*(7-i)/7)}</text>`; }
  for (let day=2;day<=days;day+=2) { const xx=x(day); lines += `<line class="grid" x1="${xx}" y1="${top}" x2="${xx}" y2="${bottom}"/><text x="${xx}" y="319" text-anchor="middle">${new Date(`${usageMonth}-01T12:00:00Z`).toLocaleString('en-US',{month:'short',timeZone:'UTC'})} ${day}</text>`; }
  const points = daily.map((value,i)=>`${x(i+1)},${y(value)}`).join(' ');
  return `<svg class="usage-chart" viewBox="0 0 724 331" role="img" aria-label="Cumulative deployment usage for ${e(usageMonth)}">${lines}<text transform="translate(17 157) rotate(-90)" text-anchor="middle">Billing</text><polyline class="data-line" points="${points}"/>${daily.map((v,i)=>`<circle cx="${x(i+1)}" cy="${y(v)}" r="6" fill="transparent"><title>${usageMonth}-${String(i+1).padStart(2,'0')}: ${money(v)}</title></circle>`).join('')}</svg>`;
}
function renderUsage() {
  const monthly=getBillingSummary(billingState,payments,{period:usageMonth});
  const end = new Date(Number(usageMonth.slice(0,4)),Number(usageMonth.slice(5,7)),0).getDate();
  const m = new Date(`${usageMonth}-01T12:00:00Z`).toLocaleString('en-US',{month:'short',timeZone:'UTC'});
  const records = [...usageRecords()].sort((a,b)=>a.date.localeCompare(b.date));
  $('#main').className = 'usage-page';
  $('#main').innerHTML = `${showBudgetNotice?usageBannerHtml(monthly):''}${heading('Metered usage',btn(`${icon('download')} Get usage report`,'usage-report'))}${usageSummaryHtml(monthly)}<div class="filters"><label class="search-field">${icon('search')}<input id="usage-search" value="${e(usageSearch)}" placeholder="Search or filter usage" aria-label="Search or filter usage"></label><select class="select" id="group-by" aria-label="Group usage"><option value="none" ${groupBy==='none'?'selected':''}>Group by: None</option><option value="type" ${groupBy==='type'?'selected':''}>Group by: Type</option></select><button class="btn" data-action="timeframe">Timeframe: ${usageMonth===today().slice(0,7) ? 'Current month' : e(usageMonth)} ${icon('chevron')}</button></div><section class="chart-card"><div class="chart-heading"><div>Metered usage<div class="chart-dates">${m} 1 - ${m} ${end}, ${usageMonth.slice(0,4)}</div></div><div><button class="bare-icon" data-action="usage-more" aria-label="Opciones de uso">${icon('more')}</button><button class="bare-icon" data-action="timeframe" aria-label="Configurar fechas">${icon('gear')}</button></div></div><div class="chart-legend">Usage</div>${chartMarkup()}</section><section class="usage-activity"><div class="section-heading"><h2>Deployment activity</h2>${btn(`${icon('plus')} Registrar despliegue`,'new-record','small')}</div><p class="hint">La fecha y los archivos de cada registro también aparecen en Payment history.</p>${records.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>ID</th><th>${groupBy==='type'?'Type / deployment':'Deployment'}</th><th>Size</th><th>Amount</th><th>Status</th><th>Files</th></tr></thead><tbody>${recordRows(groupBy==='type' ? [...records].sort((a,b)=>a.kind.localeCompare(b.kind)).map(p=>({...p,name:`${p.kind} / ${p.name}`})) : records,true)}</tbody></table></div>` : '<div class="activity-empty">No deployments for this date range.</div>'}</section>`;
}
function renderValuation() {
  $('#main').className='valuation-page';
  $('#main').innerHTML=renderValuationPage(valuationState);
}
function fileRows(files, kind) {
  return files.map((file,i)=>`<div class="file-row">${icon('file')}<div class="file-info"><span class="file-name">${e(file.name)}</span><small>${formatBytes(file.size)}</small></div><button type="button" class="bare-icon" data-action="remove-${kind}" data-index="${i}" aria-label="Quitar ${e(file.name)}">${icon('close')}</button></div>`).join('');
}
function deploymentRows() { return buildDeploymentRows({payments,overrides:deploymentOverrides}); }
function paidTotal() { return activePayments(payments).filter(p=>(p.status??'success')==='success').reduce((sum,p)=>sum+Math.round(p.amount*100),0)/100; }
function deploymentActivityMarkup() {
  const all=deploymentRows();
  const filtered=all.filter(row=>(deploymentSource==='all'||row.source===deploymentSource)&&`${row.name} ${row.date} ${row.sha||''}`.toLowerCase().includes(deploymentQuery.toLowerCase()));
  const pages=Math.max(1,Math.ceil(filtered.length/10));
  deploymentPage=Math.max(1,Math.min(deploymentPage,pages));
  const visible=filtered.slice((deploymentPage-1)*10,deploymentPage*10);
  return `<section id="deployments-list"><div class="section-heading"><h2>Últimos despliegues</h2>${btn(`${icon('plus')} Registrar despliegue`,'new-record','small')}</div><p class="hint">Producción verificada en GitHub y los despliegues que registras aquí, del más reciente al más antiguo.</p><div class="deployment-controls"><select id="deployment-source" class="select" aria-label="Origen de los despliegues"><option value="all" ${deploymentSource==='all'?'selected':''}>Todos los orígenes</option><option value="github" ${deploymentSource==='github'?'selected':''}>GitHub · producción</option><option value="local" ${deploymentSource==='local'?'selected':''}>Mis despliegues</option></select><label class="search-field">${icon('search')}<input id="deployment-search" value="${e(deploymentQuery)}" placeholder="Buscar nombre, fecha o commit" aria-label="Buscar despliegues"></label></div><div class="table-wrap"><table class="data-table deployments-table"><thead><tr><th>Fecha</th><th>Despliegue</th><th>Origen</th><th>Peso</th><th>Importe</th><th>Estado</th><th></th></tr></thead><tbody>${visible.map(row=>`<tr><td>${e(row.date)}</td><td><button type="button" class="deployment-name" data-action="view-deployment" data-id="${e(row.id)}">${e(row.name)}</button><small class="muted">${row.sha?e(row.sha.slice(0,8)):e(row.paymentId)} · ${row.fileCount} archivos</small></td><td><span class="badge">${row.source==='github'?'GitHub':'Local'}</span></td><td>${row.source==='local'?formatBytes(row.files.reduce((n,f)=>n+f.size,0)):'—'}</td><td>${row.amount===null?'—':money(row.amount)}<small class="muted">${row.amountKind==='valuation'?'Valoración':'Pago registrado'}</small></td><td>${deploymentStateBadge(row)}</td><td>${deploymentStartButton(row)}${row.source==='local'?`<button type="button" class="table-action" data-action="delete-payment" data-id="${e(row.paymentId)}" aria-label="Eliminar ${e(row.name)}">${icon('close')}</button>`:''}<button type="button" class="table-action" data-action="edit-deployment" data-id="${e(row.id)}" aria-label="Editar ${e(row.name)}">${icon('gear')}</button></td></tr>`).join('')||'<tr><td colspan="7" class="empty-search">No hay despliegues que coincidan.</td></tr>'}</tbody></table></div><div class="deployment-pagination"><span class="muted">${filtered.length} registros · Página ${deploymentPage} de ${pages}</span><div>${btn('Anterior','deployment-page','small',`data-page="${deploymentPage-1}" ${deploymentPage===1?'disabled':''}`)} ${btn('Siguiente','deployment-page','small',`data-page="${deploymentPage+1}" ${deploymentPage===pages?'disabled':''}`)}</div></div></section>`;
}
function renderOverview() {
  const rows=deploymentRows(), summary=deploymentSummary(rows,payments), latest=summary.latest;
  const expenses=buildOverviewSummary(payments,{today:today(),trackingSince:overviewTrackingSince});
  const year=today().slice(0,4);
  const history=expenses.rows.filter(row=>row.period.startsWith(`${year}-`));
  const monthLabel=period=>new Date(`${period}-01T12:00:00Z`).toLocaleDateString('es-EC',{month:'long',year:'numeric',timeZone:'UTC'});
  const historicalTotal=key=>history.reduce((sum,row)=>sum+(row[key]??0),0);
  const currency=value=>value==null?'—':localMoney(value);
  $('#main').className='overview-page';
  $('#main').innerHTML=`${heading('Billing overview',btn('Configuración','settings','small'))}
    <section class="panel overview-expense-summary">
      <div class="checkout-line"><span>Current plan</span><span class="badge">Free</span></div>
      <div class="checkout-line"><span>Gastos del mes anterior <small class="muted">· ${monthLabel(expenses.previousPeriod)}</small></span><strong>${currency(expenses.previousMonthTotal)}</strong></div>
      <div class="checkout-line"><span>Gastos de este mes <small class="muted">· ${monthLabel(expenses.currentPeriod)}</small></span><strong>${currency(expenses.currentMonthTotal)}</strong></div>
      <div class="checkout-line"><span>Nuevos pagos desde ahora</span><button class="metric-link" data-action="history">${money(expenses.newPaymentsTotal)}</button></div>
      <div class="checkout-line"><span>Deployments</span><button class="metric-link" data-action="show-deployments">${summary.counts.total}</button></div>
      <p class="hint">${summary.counts.github} en producción de GitHub · ${summary.counts.local} registrados en tu espacio · ${expenses.newDeploymentCount} nuevos desde el inicio del seguimiento</p>
      <div class="form-actions">${btn('View usage','usage')}${btn('Payment history','history')}${btn('Papelera','trash')}${btn('Ver despliegues','show-deployments')}</div>
    </section>
    <section class="overview-monthly-history"><div class="section-heading"><h2>Gastos mensuales · ${year}</h2><span class="badge">CrossBox + FitCode</span></div>
      <div class="table-wrap"><table class="data-table overview-expenses-table"><thead><tr><th>Mes</th><th>CrossBox</th><th>FitCode</th><th>Nuevos pagos</th><th>Total</th></tr></thead>
      <tbody>${history.map(row=>`<tr class="${row.period===expenses.currentPeriod?'current-month':''}"><td>${e(new Date(`${row.period}-01T12:00:00Z`).toLocaleDateString('es-EC',{month:'long',timeZone:'UTC'}))}${row.period===expenses.currentPeriod?' <span class="badge">Este mes</span>':''}</td><td>${currency(row.crossbox)}</td><td>${currency(row.fitcode)}</td><td>${row.newPayments?currency(row.newPayments):'—'}</td><td>${currency(row.total)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>Total del año</td><td>${currency(historicalTotal('crossbox'))}</td><td>${currency(historicalTotal('fitcode'))}</td><td>${currency(historicalTotal('newPayments'))}</td><td>${currency(expenses.yearTotal)}</td></tr></tfoot></table></div>
      <p class="hint">Histórico proporcionado para este resumen. Los nuevos pagos confirmados se suman desde el inicio del seguimiento; al eliminar o restaurar un registro, sus importes se descuentan o vuelven a sumar.</p>
    </section>
    <section class="panel overview-latest"><h2>Último despliegue</h2>${latest?`<button class="deployment-name" data-action="view-deployment" data-id="${e(latest.id)}">${e(latest.name)}</button><div class="latest-meta"><span>${e(latest.date)}</span><span class="badge">${latest.source==='github'?'GitHub · producción':'Mi espacio'}</span>${deploymentStateBadge(latest)}</div>${btn('Editar registro','edit-deployment','small',`data-id="${e(latest.id)}"`)}`:'<p class="muted">Todavía no hay despliegues.</p>'}</section>`;
}
function renderBudgets() {
  $('#main').className = 'budget-page';
  $('#main').innerHTML = `
    <div class="budgets-container">
      <div class="budgets-header">
        <h1 style="font-size:20px;font-weight:400;margin:0;">Budgets and alerts</h1>
        <div class="budgets-header-actions">
          <button class="btn" style="background:#21262d;font-weight:600;font-size:11px;">Included usage alerts: On <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z"></path></svg></button>
          <button class="btn primary" style="background:#238636;border-color:#2ea043;font-weight:600;font-size:11px;">+ New budget</button>
        </div>
      </div>
      
      <p class="budgets-description">
        Budgets let you set monthly usage limits for specific GitHub products or SKUs. If no budget is set, usage for that product is unlimited. <a href="https://docs.github.com/billing" target="_blank" rel="noopener" style="color:#58a6ff;">Learn more</a>.
      </p>

      <div class="budgets-filter-bar">
        <div class="search-field" style="flex:1;height:32px;display:flex;align-items:center;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:0 10px;">
          ${icon('search')}
          <input placeholder="Filter by scope, repository, product or SKU" style="background:none;border:none;color:var(--text);width:100%;font-size:12px;margin-left:8px;outline:none;">
        </div>
        <button class="btn" style="background:#21262d;font-size:11px;height:32px;">Scope: All <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z"></path></svg></button>
      </div>

      <div class="budgets-count">5 budgets</div>

      <div class="budget-card-list">
        <div class="budget-card-item">
          <div>
            <div class="budget-item-scope">Account</div>
            <div class="budget-item-name">${icon('globe')} ${e(profile.username || 'lfarmas4')} · Codespaces</div>
          </div>
          <div class="budget-item-spent">$0.00 / $3.00 spent</div>
          <div class="budget-item-progress-wrap">
            <div class="budget-item-bar"><div class="budget-item-fill" style="width:0%;"></div></div>
            <span class="budget-item-percent">0%</span>
          </div>
          <div><button class="bare-icon" style="color:var(--muted);">···</button></div>
        </div>

        <div class="budget-card-item">
          <div>
            <div class="budget-item-scope">Account</div>
            <div class="budget-item-name">${icon('globe')} ${e(profile.username || 'lfarmas4')} · Actions</div>
          </div>
          <div class="budget-item-spent">$0.00 / $60.00 spent</div>
          <div class="budget-item-progress-wrap">
            <div class="budget-item-bar"><div class="budget-item-fill" style="width:0%;"></div></div>
            <span class="budget-item-percent">0%</span>
          </div>
          <div><button class="bare-icon" style="color:var(--muted);">···</button></div>
        </div>

        <div class="budget-card-item">
          <div>
            <div class="budget-item-scope">Account</div>
            <div class="budget-item-name">${icon('globe')} ${e(profile.username || 'lfarmas4')} · Packages</div>
          </div>
          <div class="budget-item-spent">$0.00 / $3.00 spent</div>
          <div class="budget-item-progress-wrap">
            <div class="budget-item-bar"><div class="budget-item-fill" style="width:0%;"></div></div>
            <span class="budget-item-percent">0%</span>
          </div>
          <div><button class="bare-icon" style="color:var(--muted);">···</button></div>
        </div>

        <div class="budget-card-item">
          <div>
            <div class="budget-item-scope">Account</div>
            <div class="budget-item-name">${icon('globe')} ${e(profile.username || 'lfarmas4')} · All AI Credit SKUs</div>
          </div>
          <div class="budget-item-spent">$0.00 / $3.00 spent</div>
          <div class="budget-item-progress-wrap">
            <div class="budget-item-bar"><div class="budget-item-fill" style="width:0%;"></div></div>
            <span class="budget-item-percent">0%</span>
          </div>
          <div><button class="bare-icon" style="color:var(--muted);">···</button></div>
        </div>

        <div class="budget-card-item">
          <div>
            <div class="budget-item-scope">Account</div>
            <div class="budget-item-name">${icon('globe')} ${e(profile.username || 'lfarmas4')} · Git LFS</div>
          </div>
          <div class="budget-item-spent">$0.00 / $3.00 spent</div>
          <div class="budget-item-progress-wrap">
            <div class="budget-item-bar"><div class="budget-item-fill" style="width:0%;"></div></div>
            <span class="budget-item-percent">0%</span>
          </div>
          <div><button class="bare-icon" style="color:var(--muted);">···</button></div>
        </div>
      </div>

      <div class="budget-pagination">1-5 of 5</div>
    </div>
  `;
}
function openBudgetCheckout() {
  if(deploymentBusy||recordMutationBusy)return;
  const summary=getBillingSummary(billingState,payments);
  if(summary.amountDue<=0) { toast('El saldo del mes ya está regularizado.'); return; }
  const invoiceFile=new File([JSON.stringify({period:summary.period,invoiceId:summary.invoiceId,usage:summary.totalUsage,credit:summary.openingCredit,paid:summary.totalPaid,amount:summary.amountDue},null,2)],`consumo-${summary.period}.json`,{type:'application/json'});
  checkout={mode:'budget',invoice:summary,quote:{total:summary.amountDue,bytes:invoiceFile.size,count:1},files:[{name:invoiceFile.name,size:invoiceFile.size,blob:invoiceFile}],processing:false,locked:false,cancelled:false};
  modal('Regularizar saldo mensual',checkoutReviewHtml({quote:checkout.quote,files:[],profile,date:today(),mode:'budget',invoice:summary}),760);
}
function exportUsageReport() {
  const summary=getBillingSummary(billingState,payments,{period:usageMonth});
  const rows=[['Date','Source','Description','Amount USD'],...summary.charges.map(charge=>[charge.date,charge.source,charge.source==='base'?'Metered consumption':'Deployment already paid',charge.amount]),[usageMonth,'Summary','Monthly budget',summary.budget],[usageMonth,'Summary','Total usage',summary.totalUsage],[usageMonth,'Summary','Opening credit',summary.openingCredit],[usageMonth,'Summary','Paid deployments',summary.paidDeployments],[usageMonth,'Summary','Paid monthly balance',summary.paidSettlements],[usageMonth,'Summary','Amount due',summary.amountDue]];
  const csv=rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(',')).join('\r\n');
  downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`usage-${usageMonth}.csv`); closePopover();
}
function isExamplePayment(record) { return ['atr-sistem','pwr-games-agent-bar'].includes(record.scenarioKey)||(record.scenarioKeys||[]).some(key=>['atr-sistem','pwr-games-agent-bar'].includes(key)); }
function openDeletePayment(id) {
  const record=findRecord(id); if(!record||record.deletedAt)return;
  modal('Eliminar registro',`<div class="modal-body"><h3>${e(record.name)}</h3><p>Se quitará este registro de tus listados, totales y pagos del presupuesto, según corresponda.</p><p class="hint">Los archivos se conservan y podrás restaurarlo desde la papelera.</p><div class="checkout-line"><span>${e(record.date)}</span><strong>${money(record.amount)}</strong></div><div class="form-actions">${btn('Cancelar','close-modal')}${btn('Eliminar registro','confirm-delete-payment','danger',`data-id="${e(id)}"`)}</div></div>`);
}
async function deletePayment(id) {
  if(recordMutationBusy||deploymentBusy)return;
  const record=findRecord(id); if(!record||record.deletedAt)return;
  recordMutationBusy=true;
  try {
    modal('Eliminando registro',deleteProcessingHtml(record.name));
    await delayFlow(650);
    const next=softDeletePayment(payments,id); write('payments',next); payments=next;
    recordMutationBusy=false; closeModal(); render();
    clearTimeout(toastTimer); $('#toast').innerHTML=`Registro eliminado. <button type="button" data-action="restore-payment" data-id="${e(id)}">Restaurar</button>`; $('#toast').classList.add('show'); toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),7000);
  } catch(error) { recordMutationBusy=false; closeModal(); toast(error.message); }
}
function showTrash() {
  const records=payments.filter(p=>p.deletedAt).sort((a,b)=>b.deletedAt.localeCompare(a.deletedAt));
  modal('Papelera de registros',`<div class="modal-body"><p class="hint">Restaurar conserva el pago, su estado y sus archivos originales.</p>${records.map(p=>`<div class="file-row"><div class="file-info"><strong>${e(p.name)}</strong><small>${e(p.date)} · ${money(p.amount)}</small></div>${btn('Restaurar','restore-payment','small',`data-id="${e(p.id)}"`)}</div>`).join('')||'<p>No hay registros eliminados.</p>'}</div>`,true);
}
function openResetScenario(kind) {
  const budget=kind==='budget';
  const ids=activePayments(payments).filter(p=>budget?p.purpose==='budget'&&p.invoiceId===billingState.invoiceId:isExamplePayment(p)).map(p=>p.id);
  modal(budget?'Reiniciar presupuesto':'Reiniciar ejemplos',`<div class="modal-body"><p>${budget?'El presupuesto volverá a $300, el consumo base a $260 y el saldo inicial a favor a $130.':'Se quitarán los pagos de atr-sistem y PWR Games para que puedas cargar los ZIP otra vez.'}</p><p class="hint">${ids.length} registros pasarán a la papelera. Tus otros pagos no se modifican.</p><div class="form-actions">${btn('Cancelar','close-modal')}${btn('Reiniciar','confirm-reset','danger',`data-kind="${kind}"`)}</div></div>`);
}
async function resetScenario(kind) {
  if(recordMutationBusy||deploymentBusy)return;
  recordMutationBusy=true;
  try {
    modal('Reiniciando escenario',deleteProcessingHtml(kind==='budget'?'Presupuesto mensual':'Ejemplos de actualizaciones'));
    await delayFlow(700);
    let next=payments;
    const ids=activePayments(payments).filter(p=>kind==='budget'?p.purpose==='budget'&&p.invoiceId===billingState.invoiceId:isExamplePayment(p)).map(p=>p.id);
    for(const id of ids)next=softDeletePayment(next,id);
    write('payments',next); payments=next;
    if(kind==='budget') { const nextBilling=resetBillingState(billingState); write('billing',nextBilling); billingState=nextBilling; showBudgetNotice=true; }
    selectedFiles=[]; recordMutationBusy=false; closeModal(); render(); toast('Escenario listo para volver a probar.');
  } catch(error) { recordMutationBusy=false; closeModal(); toast(error.message); }
}
async function loadDeploymentFile(file) {
  if(file.key) { const blob=await loadBlob(file.key); if(!blob)throw new Error(`No se encontró el archivo ${file.name}.`); return blob; }
  const known=demoBundles.flatMap(bundle=>bundle.files).find(item=>item.source===file.source&&item.name===file.name);
  if(!known)throw new Error('El archivo de origen no está disponible.');
  const response=await fetch(known.source); if(!response.ok)throw new Error('No se pudo leer el archivo del despliegue.');
  return response.blob();
}
function viewDeployment(id) {
  const row=deploymentRows().find(item=>item.id===id); if(!row)return;
  if(row.source==='local') { viewPayment(findRecord(row.paymentId)); return; }
  modal('Detalle del despliegue',`<div class="modal-body"><h3>${e(row.name)}</h3><div class="checkout-line"><span class="muted">Fecha en tu espacio</span><span>${row.date}</span></div><div class="checkout-line"><span class="muted">Origen</span><span>GitHub · producción</span></div><div class="checkout-line"><span class="muted">Estado</span>${statusBadge(row.status)}</div><div class="checkout-line"><span class="muted">Valoración asignada</span><strong>${row.amount===null?'—':money(row.amount)}</strong></div><div class="info-callout" style="word-break:break-all">Commit: ${e(row.sha)}<br>Producción confirmada: ${e(row.createdAt)}</div><p class="hint">La valoración es proporcional al peso del commit. El despliegue de origen conserva sus datos originales en GitHub.</p><div class="form-actions">${btn('Editar registro','edit-deployment','',`data-id="${e(row.id)}"`)}<a class="btn primary" href="${e(row.runUrl)}" target="_blank" rel="noopener noreferrer">Ver en GitHub</a></div></div>`);
}
function openDeploymentEdit(id) {
  const row=deploymentRows().find(item=>item.id===id); if(!row)return;
  const statuses=row.source==='github'?[['deployed','Desplegado'],['pending','Pendiente'],['failed','Fallido']]:[['success','Pagado'],['pending','Pendiente'],['failed','Fallido']];
  modal('Editar despliegue',`<form id="deployment-edit-form" class="modal-body"><input type="hidden" name="id" value="${e(row.id)}"><div class="form-grid"><label class="field full">Nombre del despliegue<input name="name" value="${e(row.name)}" maxlength="100" required></label><label class="field">Fecha del despliegue<input name="date" type="date" value="${e(row.date)}" required></label><label class="field">${row.source==='github'?'Valoración':'Importe pagado'} (USD)<input name="amount" type="number" min="0" max="1000000" step="0.01" value="${row.amount??0}" required></label><label class="field full">${row.source==='local'?'Estado del pago':'Estado del despliegue'}<select name="status">${statuses.map(([value,label])=>`<option value="${value}" ${value===row.status?'selected':''}>${label}</option>`).join('')}</select></label></div><p class="hint">${row.source==='github'?'Estos cambios se guardan en tu espacio; el registro de GitHub no se modifica.':'Los cambios se reflejan en Overview, Usage y Payment history. Tus archivos adjuntos se conservan.'}</p><div class="form-error" role="alert"></div><div class="form-actions">${btn('Cancelar','close-modal')}<button class="btn primary" type="submit">Guardar cambios</button></div></form>`);
}
function renderDeployments() {
  const q = calculateQuote(selectedFiles,config);
  $('#main').className = 'deploy-page';
  $('#main').innerHTML = `${heading('Despliegues',btn(`${icon('clock')} Historial`,'show-deployments','small' ))}<p class="page-description">Sube tu próximo proyecto. Conoce su peso y cuánto cuesta desplegarlo.</p><section class="upload-card"><div class="card-header"><strong>${icon('repo')} Nuevo despliegue</strong><span class="badge">App o feature</span></div><div class="drop-zone" id="drop-zone">${icon('upload')}<strong>Arrastra aquí los archivos de tu proyecto</strong><p>Una app completa o esa feature que acabas de terminar.</p><span class="btn">Seleccionar archivos</span><input class="file-picker" id="deploy-files" type="file" multiple aria-label="Seleccionar archivos para valorar"></div>${selectedFiles.length ? `<div class="files-list">${fileRows(selectedFiles,'selected')}</div>` : ''}<div class="upload-foot"><span>${icon('lock')} Tus archivos se mantienen en este navegador</span><span>Hasta 100 MB por archivo</span></div><div class="quote-bar"><div class="quote-metric"><span>Archivos</span><strong>${q.count.toString().padStart(2,'0')}</strong></div><div class="quote-metric"><span>Peso total</span><strong>${formatBytes(q.bytes)}</strong></div><div class="quote-total"><span>Costo de despliegue</span><strong>${money(q.total)} <span style="display:inline;font-size:10px">USD</span></strong></div>${btn('Confirmar pago','checkout','primary',selectedFiles.length&&!fileReading?'':'disabled')}</div></section><div class="section-heading"><h2>Prueba con un proyecto de ejemplo</h2><div>${btn('Reiniciar ejemplos','reset-examples','small')} <span class="subtle-link">Descarga, arrastra y compara</span></div></div><div class="example-grid">${demoBundles.map(bundle=>{const quote=calculateQuote(bundle.files,config);return `<article class="example-card"><div class="example-top">${icon(bundle.icon)}<h3>${e(bundle.name)}</h3><span class="badge">${bundle.kind}</span></div><p>${e(bundle.description)}</p><div class="example-data"><span class="muted">${formatBytes(quote.bytes)}</span><strong>${money(quote.total)}</strong></div><div class="language"><span class="language-dot" style="background:${bundle.color}"></span>${bundle.language}</div><div class="example-actions">${btn('Usar ejemplo','use-example','small',`data-id="${bundle.id}"`)}<a class="btn small" href="${bundle.files[0].source}" download aria-label="Descargar ${e(bundle.files[0].name)}">${icon('download')}</a></div></article>`;}).join('')}</div><div class="activity-panel">${deploymentActivityMarkup()}</div><footer class="page-footer"><span>© 2026 CodeWeight</span><a href="#organizations">Organizations</a><a href="#usage">Usage</a><a href="#payment-history">Payment history</a></footer>`;
  $('#main .page-description').insertAdjacentHTML('afterend',`<div class="project-valuation-strip"><img src="assets/crossbox-logo.png" alt="CrossBox"><div><strong>CrossBox</strong><span>Valor actual · ${localMoney(portfolioSummary.crossbox.latestUsd)}</span></div><a href="#valuation">Ver historial ${icon('chevron')}</a></div>`);
  const drop = $('#drop-zone');
  if(fileReading && fileAnalysisState) { drop.innerHTML=fileAnalysisHtml(fileAnalysisState); drop.classList.add('analyzing'); }
  ['dragenter','dragover'].forEach(type=>drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add('dragover');}));
  ['dragleave','drop'].forEach(type=>drop.addEventListener(type,event=>{event.preventDefault();drop.classList.remove('dragover');}));
  drop.addEventListener('drop',event=>addSelected(Array.from(event.dataTransfer.files)));
}
function validateFiles(files) {
  if (files.length > 100) throw new Error('Selecciona un máximo de 100 archivos.');
  if (files.some(f=>!Number.isSafeInteger(f.size)||f.size<0||f.size>100_000_000)) throw new Error('Cada archivo debe pesar hasta 100 MB.');
  if (files.reduce((s,f)=>s+f.size,0)>250_000_000) throw new Error('El total máximo es de 250 MB.');
}
async function wrapFiles(files) { return Promise.all(files.map(identifyPricingFile)); }
function addSelected(files) {
  const operation=async()=>{
    try {
      validateFiles([...selectedFiles,...files]); fileReading=true;
      const identified=await analyzeUploadFiles(files,{onStage:state=>{
        fileAnalysisState=state;
        if(activePage==='deployments')renderDeployments();
      }});
      const next=[...selectedFiles,...identified]; validateFiles(next); selectedFiles=next;
      toast('Archivo analizado. El precio ya está calculado.');
    } catch(error) { toast(error.message); }
    finally { fileReading=false; fileAnalysisState=null; if(activePage==='deployments')renderDeployments(); }
  };
  uploadQueue=uploadQueue.then(operation,operation);
  return uploadQueue;
}
function modal(title, body, wide = false) {
  closePopover(); const dialog=$('#modal'); dialog.style.width=typeof wide==='number'?`min(${wide}px, calc(100vw - 30px))`:wide?'min(560px, calc(100vw - 30px))':'';
  $('#modal-content').innerHTML = `<div class="modal-header"><h2>${title}</h2><button class="bare-icon" data-action="close-modal" aria-label="Cerrar">${icon('close')}</button></div>${body}`;
  $('.modal-header button').disabled=Boolean(deploymentBusy||recordMutationBusy||checkout?.locked);
  if (!dialog.open) dialog.showModal();
}
function closeModal() {
  if(deploymentBusy||recordMutationBusy||checkout?.locked)return;
  if(checkout)checkout.cancelled=true;
  $('#modal').close(); checkout=null;
}
function openRecord() {
  recordFiles=[];
  modal('Registrar despliegue y pago',`<form id="record-form" class="modal-body"><p class="record-prompt">${icon('calendar')} Un solo registro para Usage y Payment history.</p><div class="form-grid"><label class="field full">Nombre del despliegue<input name="name" placeholder="Ej. Feature de autenticación" required maxlength="100"></label><label class="field">Fecha de despliegue y pago<input type="date" name="date" value="${today()}" required></label><label class="field">Importe pagado (USD)<input name="amount" type="number" min="0" max="1000000" step="0.01" placeholder="0.00" required></label><label class="field">Tipo<select name="kind"><option>Feature</option><option>App</option></select></label><label class="field">Método de pago<select name="method"><option>MasterCard ending in 2791</option><option>Visa ending in 4242</option><option>Bank transfer</option><option>PayPal</option><option>Cash</option></select></label><label class="field full">Referencia (opcional)<input name="reference" maxlength="40" placeholder="Ej. Transferencia #001234"></label><div class="field full"><span>Archivos del despliegue</span><div class="file-upload-small"><input id="record-files" type="file" multiple aria-label="Adjuntar archivos del pago"><div class="hint">O añade un archivo que ya está disponible:</div><select id="record-example" class="select"><option value="">Seleccionar ejemplo…</option>${demoBundles.map(b=>`<option value="${b.id}">${e(b.name)} · ${formatBytes(b.files[0].size)}</option>`).join('')}</select></div><div id="record-attachments"></div><small>Los archivos se guardan en este navegador con la fecha que elijas.</small></div></div><div class="form-error" id="record-error" role="alert"></div><div class="form-actions">${btn('Cancelar','close-modal')}<button class="btn primary" type="submit">Guardar registro</button></div></form>`,true);
}
function updateRecordFiles() { $('#record-attachments').innerHTML = `<div class="attachments">${fileRows(recordFiles,'record')}</div>`; }
async function persistFiles(files) {
  const result=[];
  for (const file of files) {
    if (file.blob) { const key=crypto.randomUUID(); await saveBlob(key,file.blob); result.push({name:file.name,size:file.size,key}); }
    else { result.push({name:file.name,size:file.size,source:file.source}); }
  }
  return result;
}
async function createRecord(values,files) {
  const amount=Number(values.amount);
  if (!validDate(values.date) || !values.name.trim() || values.name.length>100 || !Number.isFinite(amount)||amount<0||amount>1_000_000) throw new Error('Revisa el nombre, la fecha y el importe.');
  if (!files.length) throw new Error('Adjunta al menos un archivo o selecciona un ejemplo.');
  validateFiles(files);
  const savedFiles=await persistFiles(files);
  const record={id:crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase(),name:values.name.trim(),date:values.date,amount:Math.round(amount*100)/100,method:values.method,kind:values.kind,reference:values.reference || '',files:savedFiles,createdAt:new Date().toISOString(),status:'success',deploymentStatus:values.deploymentStatus==='ready'?'ready':'deployed'};
  if(values.purpose==='budget') { record.purpose='budget'; record.invoiceId=String(values.invoiceId); record.period=String(values.period); }
  else { record.purpose='deployment'; record.scenarioKeys=(values.scenarioKeys||[]).filter(key=>['atr-sistem','pwr-games-agent-bar'].includes(key)); if(record.scenarioKeys.length===1)record.scenarioKey=record.scenarioKeys[0]; }
  const next=[record,...payments]; write('payments',next); payments=next;
  return record;
}
function openCheckout() {
  if (!selectedFiles.length || deploymentBusy || fileReading) return;
  checkout={quote:calculateQuote(selectedFiles,config),files:[...selectedFiles],processing:false,locked:false,cancelled:false};
  modal('Confirmar pago',checkoutReviewHtml({quote:checkout.quote,files:checkout.files,profile,date:today()}),760);
}
const delayFlow = milliseconds => new Promise(resolve=>setTimeout(resolve,milliseconds));
async function confirmPayment(values) {
  const operation=checkout;
  if(!operation||operation.processing)return;
  const card=validatePaymentFields(values);
  const budgetPayment=operation.mode==='budget';
  if(budgetPayment) {
    const current=getBillingSummary(billingState,payments);
    if(current.invoiceId!==operation.invoice.invoiceId||current.amountDue!==operation.quote.total)throw new Error('El saldo cambió. Revisa el presupuesto antes de confirmar.');
  }
  const safeValues=budgetPayment?
    {name:`Consumo mensual · ${operation.invoice.period}`,date:today(),kind:'Billing',method:card.method,amount:operation.quote.total,purpose:'budget',invoiceId:operation.invoice.invoiceId,period:operation.invoice.period}:
    {name:values.name,date:values.date,kind:values.kind,method:card.method,amount:operation.quote.total,deploymentStatus:'ready',scenarioKeys:(operation.quote.projectCharges||[]).map(item=>item.pricingKey)};
  operation.processing=true;
  const active=()=>checkout===operation&&!operation.cancelled&&$('#modal').open;
  try {
    for(const [stage,duration] of [['checking',850],['processing',1350]]) {
      modal('Confirmando tu pago',processingHtml({stage,quote:operation.quote,name:safeValues.name,mode:operation.mode}),760);
      await delayFlow(duration);
      if(!active())return;
    }
    operation.locked=true;
    modal('Confirmando tu pago',processingHtml({stage:'processing',quote:operation.quote,name:safeValues.name,mode:operation.mode}),760);
    const record=await createRecord(safeValues,operation.files);
    if(!budgetPayment)selectedFiles=[]; usageMonth=record.date.slice(0,7); deploymentPage=1;
    modal('Pago procesado',processingHtml({stage:'confirmed',quote:operation.quote,name:record.name,mode:operation.mode}),760);
    await delayFlow(950);
    modal('Preparando tu despliegue',processingHtml({stage:'preparing',quote:operation.quote,name:record.name,mode:operation.mode}),760);
    await delayFlow(950);
    checkout=null; render(); paymentSuccess(record);
  } catch(error) {
    operation.locked=false;
    if(checkout===operation) {
      checkout=null;
      modal('No se pudo completar el pago',`<div class="modal-body"><p class="form-error">${e(error.message)}</p><div class="form-actions">${btn('Volver al pago','checkout','primary')}${btn('Cerrar','close-modal')}</div></div>`);
    }
  } finally { operation.processing=false; }
}
function paymentSuccess(record) { modal('Pago confirmado',paymentReadyHtml(record),760); }
async function beginDeployment(id) {
  if(deploymentBusy)return;
  const record=findRecord(id); if(!record)throw new Error('No se encontró el despliegue.');
  if(record.deletedAt||record.purpose==='budget')throw new Error('Este registro no corresponde a un despliegue activo.');
  if((record.status??'success')!=='success')throw new Error('Primero confirma el pago del despliegue.');
  if((record.deploymentStatus??'deployed')==='deployed') { modal('Despliegue completado',deploymentCompleteHtml(record),760); return; }
  deploymentBusy=true;
  try {
    if(record.deploymentStatus!=='deploying') {
      const next=setDeploymentState(payments,id,'deploying'); write('payments',next); payments=next;
    }
    render();
    modal('Corriendo suite',deploymentProcessingHtml(findRecord(id),'suite',[]),760);
    await delayFlow(450);
    const checks=await runDeploymentChecks(findRecord(id),{loadFile:loadDeploymentFile});
    for(let i=0;i<checks.length;i++) {
      const visible=checks.map((check,index)=>({...check,passed:index<=i?check.passed:undefined}));
      modal('Corriendo suite',deploymentProcessingHtml(findRecord(id),'suite',visible),760);
      await delayFlow(420);
    }
    const checkedRecord={...findRecord(id),validation:{checks,checkedAt:new Date().toISOString()}};
    const checkedPayments=payments.map(payment=>payment.id===id?checkedRecord:payment); write('payments',checkedPayments); payments=checkedPayments;
    for(const [stage,duration] of [['uploading',900],['building',1300],['publishing',1000]]) {
      modal('Desplegando tu actualización',deploymentProcessingHtml(findRecord(id),stage),760);
      await delayFlow(duration);
    }
    const next=setDeploymentState(payments,id,'deployed'); write('payments',next); payments=next;
    deploymentBusy=false; render(); modal('Despliegue completado',deploymentCompleteHtml(findRecord(id)),760);
  } catch(error) {
    try { if(findRecord(id)?.deploymentStatus==='deploying') { const next=setDeploymentState(payments,id,'failed'); write('payments',next); payments=next; } } catch {}
    deploymentBusy=false; render();
    modal('No se pudo completar el despliegue',`<div class="modal-body"><p class="form-error">${e(error.message)}</p><div class="form-actions">${btn('Reintentar','deploy-now','primary',`data-id="${e(id)}"`)}</div></div>`);
  }
}

function openReceiptGenerator(record) {
  if (!record) return;
  modal('Recibo Oficial (GitHub)', receiptModalHtml(record, profile, activePayments(payments)), 820);
  bindReceiptModalActions(record);
}


function bindAccessibilityController() {
  const sel = $('#acc-budget-select');
  const inLimit = $('#acc-budget-limit');
  const inSpent = $('#acc-budget-spent');
  const form = $('#accessibility-budget-form');
  if (!sel || !inLimit || !inSpent || !form) return;

  function updatePreview() {
    const bId = sel.value;
    const b = budgets.find(x => x.id === bId) || budgets[0];
    const limit = Number(inLimit.value || 0);
    const spent = Number(inSpent.value || 0);
    const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
    const rem = Math.max(0, limit - spent);
    const isWarning = pct >= 80;
    const isDanger = pct >= 100;
    const color = isDanger ? '#f85149' : (isWarning ? '#d29922' : '#2ea043');

    const titleEl = $('#acc-preview-title');
    const numsEl = $('#acc-preview-numbers');
    const barEl = $('#acc-preview-bar');
    const pctEl = $('#acc-preview-pct');
    const remEl = $('#acc-preview-rem');

    if (titleEl) titleEl.textContent = `lfarmas4 · ${b ? b.product : 'Product'}`;
    if (numsEl) numsEl.textContent = `$${spent.toFixed(2)} / $${limit.toFixed(2)} spent`;
    if (barEl) {
      barEl.style.width = `${pct}%`;
      barEl.style.background = color;
    }
    if (pctEl) pctEl.textContent = `${pct}% consumido`;
    if (remEl) remEl.textContent = `Restante: $${rem.toFixed(2)} USD`;
  }

  sel.addEventListener('change', () => {
    const b = budgets.find(x => x.id === sel.value);
    if (b) {
      inLimit.value = b.limit.toFixed(2);
      inSpent.value = b.spent.toFixed(2);
      updatePreview();
    }
  });

  inLimit.addEventListener('input', updatePreview);
  inSpent.addEventListener('input', updatePreview);

  // default initial values for demonstration
  const actionsBudget = budgets.find(b => b.product === 'Actions');
  if (actionsBudget) {
    sel.value = actionsBudget.id;
    inLimit.value = actionsBudget.limit > 0 ? actionsBudget.limit.toFixed(2) : '60.00';
    inSpent.value = actionsBudget.spent > 0 ? actionsBudget.spent.toFixed(2) : '35.00';
  }
  updatePreview();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bId = sel.value;
    const idx = budgets.findIndex(x => x.id === bId);
    if (idx !== -1) {
      budgets[idx].limit = parseFloat(inLimit.value) || 0;
      budgets[idx].spent = parseFloat(inSpent.value) || 0;
      saveBudgets();
      toast(`Presupuesto ${budgets[idx].product} actualizado: $${budgets[idx].spent.toFixed(2)} consumidos de $${budgets[idx].limit.toFixed(2)} USD.`);
    }
  });
}

function bindReceiptModalActions(record) {
  const btnPrint = $('#btn-print-receipt');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      const data = {
        title: 'Receipt',
        date: record.receiptData?.date || `${record.date || '2026-10-25'} 10:54AM PDT`,
        accountBilled: record.receiptData?.accountBilled || `${profile.username || 'lfarmas4'} (${profile.email || 'luisfernando1942.a@gmail.com'})`,
        transactionId: record.receiptData?.transactionId || `ch_3UUVcRJFr6CCHwli${record.id}`,
        chargedTo: record.receiptData?.chargedTo || (record.method ? record.method.replace(' ending in ', ' (5*** **** **** ') + ')' : 'MasterCard (5*** **** **** 2791)'),
        sku: record.sku || record.receiptData?.sku || '',
        quantity: record.quantity || record.receiptData?.quantity || '',
        rateStr: record.rateStr || record.receiptData?.rateStr || '',
        description: record.receiptData?.description || record.name || 'GitHub Actions Usage',
        period: record.receiptData?.period || record.period || `${(record.date || '2026-10-25').slice(0, 7)}-01 - ${(record.date || '2026-10-25').slice(0, 7)}-30`,
        amount: record.receiptData?.amount || `$${Number(record.amount || 0).toFixed(2)} USD`,
        watermark: 'Thank you.',
        supportUrl: 'https://support.github.com/contact'
      };
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(buildStandaloneReceiptHtml(data));
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 400);
      } else {
        window.print();
      }
    });
  }
}

function openInvoiceGenerator(record) {
  if (!record) return;
  modal('Factura Oficial (GitHub Invoice)', invoiceModalHtml(record, profile, activePayments(payments)), 840);
  bindInvoiceModalActions(record);
}

function bindInvoiceModalActions(record) {
  const btnPrintInv = $('#btn-print-invoice');
  if (btnPrintInv) {
    btnPrintInv.addEventListener('click', () => {
      const amtNum = Number(record.amount || 5.66).toFixed(2);
      const invDate = record.invoiceData?.invoiceDate || (record.date ? formatInvoiceDate(record.date) : 'Oct 25, 2026');
      const invoiceData = {
        invoiceNum: record.invoiceData?.invoiceNum || generateNumericInvoiceNum(record.id),
        invoiceDate: invDate,
        terms: 'Due Upon Receipt',
        dueDate: invDate,
        currency: 'USD',
        billName: 'Fernando Armas',
        billCompany: 'ESPE',
        billAddress1: 'Casa 345',
        billAddress2: 'Sangolquí, Pichincha, Ecuador, Pichincha',
        billPostal: '171103',
        billCountry: 'Ecuador',
        sku: record.invoiceData?.sku || record.sku || '',
        productLine: record.invoiceData?.productLine || record.productLine || '',
        description: record.invoiceData?.description || record.name || 'GitHub Actions Usage',
        period: record.invoiceData?.period || record.period || (record.date ? `${record.date.slice(0, 7)}-01 - ${record.date.slice(0, 7)}-30` : 'Sep 01, 2026 - Sep 30, 2026'),
        quantity: record.invoiceData?.quantity || record.quantity || amtNum,
        rate: record.invoiceData?.rateStr || record.invoiceData?.rate || record.rateStr || record.rate || '1.00',
        amount: record.invoiceData?.amount || `$${amtNum}`,
        transactionRef: generateNumericTransactionRef(record.id)
      };
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(buildStandaloneInvoiceHtml(invoiceData));
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 400);
      } else {
        window.print();
      }
    });
  }
}

function formatInvoiceDate(isoDate) {
  try {
    const [y, m, d] = isoDate.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[Number(m)-1]} ${d}, ${y}`;
  } catch {
    return isoDate;
  }
}

function findRecord(id) { return payments.find(p=>p.id===id); }
function receiptText(record,invoice=false) { return `${invoice?'INVOICE':'PAYMENT RECEIPT'} — CodeWeight\n\nID: ${record.id}\nDate: ${record.date}\nDeployment: ${record.name}\nMethod: ${record.method}\nAmount: ${money(record.amount)} USD\nStatus: ${record.status??'success'}\n${record.reference?`Reference: ${record.reference}\n`:''}\nFiles:\n${record.files.map(f=>`${f.name} — ${formatBytes(f.size)} (${f.size} bytes)`).join('\n')}\n`; }
function downloadBlob(blob,name) { const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
async function downloadAttachment(record,index) {
  const file=record?.files[index]; if (!file) return;
  if (file.key) { const blob=await loadBlob(file.key); if (!blob) throw new Error('El archivo no está disponible en este navegador.'); downloadBlob(blob,file.name); }
  else { const known=demoBundles.flatMap(b=>b.files).find(f=>f.source===file.source); if (!known) throw new Error('Archivo no disponible.'); const a=document.createElement('a'); a.href=known.source; a.download=known.name; a.click(); }
}
function viewPayment(record) {
  if (!record) return;
  modal('Payment details',`<div class="modal-body"><h3>${e(record.name)}</h3><div class="checkout-line"><span class="muted">ID</span><span>${e(record.id)}</span></div><div class="checkout-line"><span class="muted">SKU de GitHub</span><span class="mono" style="font-weight:600;color:#58a6ff;">${e(record.sku || 'actions_linux')}</span></div>${record.quantity ? `<div class="checkout-line"><span class="muted">Métrica / Consumo</span><strong style="color:#7ee787;">${e(record.quantity)}</strong> (@ ${e(record.rateStr || `$${record.rate}`)})</div>` : ''}<div class="checkout-line"><span class="muted">Deployment & payment date</span><span>${e(record.date)}</span></div><div class="checkout-line"><span class="muted">Payment method</span><span>${e(record.method)}</span></div><div class="checkout-line"><span class="muted">Amount</span><strong>${money(record.amount)}</strong></div>${record.reference?`<div class="checkout-line"><span class="muted">Reference</span><span>${e(record.reference)}</span></div>`:''}<h3 style="margin-top:23px">Archivos del despliegue</h3>${record.files.map((f,i)=>`<div class="file-row">${icon('file')}<div class="file-info"><span class="file-name">${e(f.name)}</span><small>${formatBytes(f.size)} · ${f.size.toLocaleString('en-US')} bytes</small></div><button class="table-action" data-action="download-file" data-id="${e(record.id)}" data-index="${i}" aria-label="Descargar ${e(f.name)}">${icon('download')}</button></div>`).join('')}<div class="form-actions" style="display:flex;gap:8px;flex-wrap:wrap;">${btn('Descargar recibo','download-receipt','',`data-id="${e(record.id)}"`)} ${btn('Ver recibo','open-receipt-generator','',`data-id="${e(record.id)}"`)} ${btn('Descargar factura','download-invoice','primary',`data-id="${e(record.id)}"`)} ${btn('Ver factura (modal)','view-invoice-modal','',`data-id="${e(record.id)}"`)}</div></div>`);
  const actions=`<div class="payment-detail-actions">${record.purpose!=='budget'&&(record.status??'success')==='success'&&record.deploymentStatus&&record.deploymentStatus!=='deployed'?btn('Desplegar ahora','deploy-now','primary',`data-id="${e(record.id)}"`):''}${!record.deletedAt?btn('Eliminar registro','delete-payment','danger',`data-id="${e(record.id)}"`):''}</div>`;
  $('#modal-content .modal-body').insertAdjacentHTML('beforeend',actions);
}
function openRates() {
  modal('Preferencias de valoración',`<form id="rates-form" class="modal-body"><p class="internal-note">Ajustes internos de tu espacio. Los importes se recalculan al guardar.</p><div class="form-grid">${[['base','Cargo base (USD)'],['perMB','Precio por MB (USD)'],['includedMB','MB incluidos'],['minimum','Importe mínimo (USD)'],['atrPrice','Tarifa atr-sistem (USD)'],['pwrPrice','Tarifa PWR Games (USD)']].map(([key,label])=>`<label class="field">${label}<input name="${key}" type="number" min="0" max="1000000" step="any" value="${config[key]??defaultConfig[key]}" required></label>`).join('')}</div><div class="info-callout">Total = máximo entre el mínimo y el cargo base + MB facturables × precio por MB. 1 MB = 1.000.000 bytes.</div><div id="rates-error" class="form-error"></div><div class="form-actions">${btn('Cancelar','close-modal')}<button type="submit" class="btn primary">Guardar configuración</button></div></form>`);
}
function closePopover() { $('.popover')?.remove(); }
function popover(anchor,content) {
  closePopover(); const element=document.createElement('div'); element.className='popover'; element.innerHTML=content; document.body.append(element);
  const rect=anchor.getBoundingClientRect(); element.style.top=`${rect.bottom+7}px`; element.style.left=`${Math.max(8,Math.min(rect.right-element.offsetWidth,innerWidth-element.offsetWidth-8))}px`;
}
function renderOther() {
  const title=pageTitle();
  if (activePage==='settings') {
    $('#main').innerHTML=`${heading('Configuración del espacio')}<p class="page-description">Personaliza tu identidad y define cómo se valoran las próximas actualizaciones.</p><section class="panel identity-settings"><h2>Imágenes de tu espacio</h2><div class="identity-grid"><div><span class="field-label">Foto de perfil</span><button class="identity-preview round" id="workspace-avatar" data-action="avatar" aria-label="Subir foto de perfil">${profile.avatar?`<img src="${e(profile.avatar)}" alt="Perfil">`:icon('person')}</button>${btn('Subir foto','avatar','small')}</div><div><span class="field-label">Logo de la plataforma</span><button class="identity-preview" id="workspace-logo" data-action="logo" aria-label="Subir logo de la plataforma"><img src="${e(profile.logo||'icon.svg')}" alt="Logo de la plataforma"></button>${btn('Subir logo','logo','small')}</div><div><span class="field-label">Imagen del espacio</span><button class="identity-preview" id="workspace-mascot" data-action="mascot" aria-label="Subir imagen del espacio">${profile.mascot?`<img src="${e(profile.mascot)}" alt="Imagen del espacio">`:icon('page')}</button>${btn('Subir imagen','mascot','small')}</div></div><p class="hint">PNG, JPG o WEBP · Hasta 2 MB por imagen. Se guardan en este navegador.</p></section><form id="workspace-form" class="panel workspace-rates"><h2>Valor de las futuras actualizaciones</h2><p class="hint">Estos ajustes se aplican a los próximos archivos. Los registros históricos conservan su importe.</p><div class="form-grid">${[['base','Cargo base por actualización (USD)'],['perMB','Precio por MB (USD)'],['includedMB','MB incluidos'],['minimum','Importe mínimo (USD)'],['atrPrice','Tarifa atr-sistem (USD)'],['pwrPrice','Tarifa PWR Games (USD)']].map(([key,label])=>`<label class="field">${label}<input name="${key}" type="number" min="0" max="1000000" step="any" value="${config[key]??defaultConfig[key]}" required></label>`).join('')}<label class="field full">Tamaño de la interfaz<select name="zoom">${[100,105,110,112,115,120,125,130].map(v=>`<option value="${v}" ${uiZoom===v?'selected':''}>${v}%${v===112?' · Recomendado':''}</option>`).join('')}</select></label></div><div class="info-callout">El peso del archivo determina sus MB facturables. El importe se calcula con el cargo base, la tarifa por MB y el mínimo que definas.</div><div id="workspace-error" class="form-error"></div><div class="form-actions"><button class="btn primary" type="submit">Guardar configuración</button>${btn('Ir a Despliegues','deployments')}</div></form>`;
  } else if (activePage==='public-profile') {
    $('#main').innerHTML=`${heading('Public profile')}<form id="profile-form" class="settings-form"><label class="field">Name<input name="name" value="${e(profile.name)}" maxlength="50" required></label><label class="field">Username<input name="username" value="${e(profile.username)}" maxlength="40" required></label><label class="field">Public email<input name="email" type="email" value="${e(profile.email)}" maxlength="100"></label><label class="field">Bio<textarea name="bio" maxlength="300">${e(profile.bio)}</textarea></label>${btn('Change profile photo','avatar')}<div class="form-actions"><button class="btn primary" type="submit">Update profile</button></div></form>`;
  } else if (activePage==='overview') {
    renderOverview();
  } else if (activePage==='payment-information') {
    $('#main').innerHTML=`${heading('Payment information')}<section class="panel"><h2 style="font-size:14px">Saved payment methods</h2><div class="payment-method">${icon('card')} MasterCard ending in 2791 <span class="badge" style="margin-left:auto">Default</span></div><div class="payment-method">${icon('card')} Visa ending in 4242</div><a href="#deployments">Choose a deployment to continue to payment →</a></section>`;
  } else if (activePage==='repositories') {
    $('#main').innerHTML=`${heading(title,btn('Nuevo despliegue','deployments','primary'))}<div class="panel">${demoBundles.map(b=>`<div class="file-row">${icon('repo')}<strong>${e(b.name)}</strong><span class="badge">${b.kind}</span><span class="muted" style="margin-left:auto">${formatBytes(b.files[0].size)}</span></div>`).join('')}</div>`;
  } else if (activePage==='notifications') {
    $('#main').innerHTML=`${heading(title)}<div class="panel"><h2 style="font-size:14px">Deployment activity</h2>${deploymentRows().slice(0,10).map(p=>`<div class="file-row">${icon('rocket')}<div><button class="deployment-name" data-action="view-deployment" data-id="${e(p.id)}">${e(p.name)}</button><div class="muted">${e(p.date)} · ${p.source==='github'?'GitHub':'Mi espacio'}</div></div>${statusBadge(p.status)}</div>`).join('')}</div>`;
  } else if (activePage==='appearance') {
    $('#main').innerHTML=`${heading(title)}<div class="panel"><h2 style="font-size:14px">Theme preferences</h2><div class="payment-method">${icon('check')} Dark default <span class="badge" style="margin-left:auto">Active</span></div><p class="muted">A dark appearance across your workspace.</p><div class="form-actions" style="justify-content:flex-start;margin-top:16px;">${btn('Cambiar imagen del espacio','mascot')}${btn('Papelera','trash')}${btn(`${icon('plus')} Registrar pago anterior`,'new-record')}${btn(`${icon('receipt')} Formato base`,'open-receipt-generator','primary',`data-id="${e(payments[0]?.id || '')}"`)}</div></div>`;
  } else if (activePage === 'accessibility') {
    $('#main').innerHTML = `
      ${heading('Accessibility')}
      <section class="panel accessibility-budget-controller">
        <h2 style="font-size:16px;margin-top:0;display:flex;align-items:center;gap:8px;">
          ${icon('access')} Control de Presupuesto y Consumo Accesible
        </h2>
        <p class="muted" style="margin-bottom:18px;">
          Configura y prueba en tiempo real los presupuestos mensuales de GitHub y su consumo actual (por ejemplo, definir un presupuesto de <strong>$60.00 USD</strong> y registrar <strong>$35.00 USD consumidos</strong>). Los cambios se reflejan inmediatamente en <a href="#budgets" style="color:#58a6ff;text-decoration:none;">Budgets and alerts</a>.
        </p>

        <form id="accessibility-budget-form" style="background:#161b22;padding:18px;border-radius:8px;border:1px solid #30363d;margin-bottom:20px;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:15px;margin-bottom:15px;">
            <label class="field" style="margin:0;">
              <span style="font-weight:600;font-size:12px;color:#c9d1d9;display:block;margin-bottom:6px;">Producto / Servicio</span>
              <select name="budgetId" id="acc-budget-select" style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:7px 10px;border-radius:6px;width:100%;font-size:13px;">
                ${budgets.map(b => `<option value="${e(b.id)}">${e(b.product)} (${e(b.scope)})</option>`).join('')}
              </select>
            </label>

            <label class="field" style="margin:0;">
              <span style="font-weight:600;font-size:12px;color:#c9d1d9;display:block;margin-bottom:6px;">Límite de Presupuesto (USD)</span>
              <input type="number" id="acc-budget-limit" step="0.01" min="1" max="100000" value="60.00" style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:7px 10px;border-radius:6px;width:100%;font-size:13px;" required>
            </label>

            <label class="field" style="margin:0;">
              <span style="font-weight:600;font-size:12px;color:#c9d1d9;display:block;margin-bottom:6px;">Consumo Actual Realizado (USD)</span>
              <input type="number" id="acc-budget-spent" step="0.01" min="0" max="100000" value="35.00" style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:7px 10px;border-radius:6px;width:100%;font-size:13px;" required>
            </label>
          </div>

          <div id="acc-budget-preview-box" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:14px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-size:13px;font-weight:600;color:#c9d1d9;" id="acc-preview-title">lfarmas4 · Actions</span>
              <span style="font-size:13px;font-weight:700;color:#58a6ff;" id="acc-preview-numbers">$35.00 / $60.00 spent</span>
            </div>
            <div style="background:#21262d;height:10px;border-radius:5px;overflow:hidden;margin-bottom:8px;">
              <div id="acc-preview-bar" style="background:#2ea043;height:100%;width:58.3%;transition:width 0.3s ease;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#8b949e;">
              <span id="acc-preview-pct">58% consumido</span>
              <span id="acc-preview-rem">Restante: $25.00 USD</span>
            </div>
          </div>

          <div style="display:flex;gap:10px;align-items:center;">
            <button class="btn primary" type="submit" style="background:#238636;border-color:#2ea043;font-weight:600;">Aplicar y guardar presupuesto</button>
            <a href="#budgets" class="btn" style="background:#21262d;color:#c9d1d9;text-decoration:none;">Ver en Budgets and alerts →</a>
          </div>
        </form>

        <h3 style="font-size:13px;color:#8b949e;margin-top:24px;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Acciones rápidas de espacio</h3>
        <div class="form-actions" style="justify-content:flex-start">
          ${btn('Ir a Despliegues','deployments')}
          ${btn('Ver historial de pagos','payment-history')}
          ${btn(`${icon('receipt')} Generar recibo oficial (Formato base)`,'open-receipt-generator','primary',`data-id="${e(payments[0]?.id || '')}"`)}
        </div>
      </section>
    `;

    bindAccessibilityController();
  } else {
    
    $('#main').innerHTML=`${heading(title)}<section class="panel"><h2 style="font-size:14px">${e(title)}</h2><p class="muted">Configuración y herramientas del espacio de trabajo.</p><p class="hint">Gestiona tus organizaciones, consulta el consumo y genera o edita recibos con el formato base oficial.</p><div class="form-actions" style="justify-content:flex-start">${btn('Ir a Despliegues','deployments')}${btn('Ver pagos','history')}${btn(`${icon('receipt')} Generar recibo oficial (Formato base)`,'open-receipt-generator','primary',`data-id="${e(payments[0]?.id || '')}"`)}</div></section>`;
  }
}

document.addEventListener('click',async event=>{
  const target=event.target.closest('[data-action]');
  if (!target) { if (!event.target.closest('.popover')) closePopover(); return; }
  const action=target.dataset.action;
  try {
    if (['deployments','usage','repositories','notifications','settings','budgets'].includes(action)) { if(deploymentBusy||recordMutationBusy||checkout?.locked)return; closeModal(); navigate(action); closePopover(); }
    else if (action==='history') navigate('payment-history');
    else if (action==='pay-budget') openBudgetCheckout();
    else if (action==='delete-payment') openDeletePayment(target.dataset.id);
    else if (action==='confirm-delete-payment') await deletePayment(target.dataset.id);
    else if (action==='restore-payment') { const next=restorePayment(payments,target.dataset.id); write('payments',next); payments=next; closeModal(); render(); toast('Registro restaurado con sus archivos originales.'); }
    else if (action==='trash') showTrash();
    else if (action==='reset-budget') openResetScenario('budget');
    else if (action==='reset-examples') openResetScenario('examples');
    else if (action==='confirm-reset') await resetScenario(target.dataset.kind);
    else if (action==='show-deployments') { if(deploymentBusy||recordMutationBusy||checkout?.locked)return; closeModal(); navigate('deployments'); setTimeout(()=>$('#deployments-list')?.scrollIntoView({behavior:'smooth',block:'start'}),50); }
    else if (action==='edit-deployment') openDeploymentEdit(target.dataset.id);
    else if (action==='view-deployment') viewDeployment(target.dataset.id);
    else if (action==='deployment-page') { deploymentPage=Number(target.dataset.page); renderDeployments(); }
    else if (action==='toggle-billing') { billOpen=!billOpen; renderSidebar(); }
    else if (action==='close-modal') closeModal();
    else if (action==='new-record') openRecord();
    else if (action==='use-example') { selectedFiles=demoBundles.find(b=>b.id===target.dataset.id).files.slice(); renderDeployments(); toast('Ejemplo cargado. Ya puedes revisar su peso y continuar al pago.'); }
    else if (action==='remove-selected') { selectedFiles.splice(Number(target.dataset.index),1); renderDeployments(); }
    else if (action==='remove-record') { recordFiles.splice(Number(target.dataset.index),1); updateRecordFiles(); }
    else if (action==='checkout') openCheckout();
    else if (action==='cancel-payment') { closeModal(); toast('Operación cancelada.'); }
    else if (action==='deploy-now') await beginDeployment(target.dataset.id);
    else if (action==='paid-history') { closeModal(); navigate('payment-history'); }
    else if (action==='view-payment') viewPayment(findRecord(target.dataset.id));
    else if (action==='view-history-update') {
      const commitUrl = `https://github.com/lfarmas4/crossbox-app/commit/${target.dataset.id}`;
      window.open(commitUrl, '_blank');
    }
    else if (action==='valuation-page') { valuationState.page=Number(target.dataset.page); persistValuationState(); renderValuation(); }
    else if (action==='valuation-export') { const data=valuationCsv(target.dataset.project); downloadBlob(new Blob([data.csv],{type:'text/csv;charset=utf-8'}),data.name); }
    else if (action==='download-file') await downloadAttachment(findRecord(target.dataset.id),Number(target.dataset.index));
    else if (action==='open-invoice-generator') {
      const p = findRecord(target.dataset.id);
      if (p) {
        window.open(`assets/pdf/invoice-${p.id}.pdf`, '_blank');
      }
    }
    else if (action==='view-invoice-modal') {
      openInvoiceGenerator(findRecord(target.dataset.id));
    }
    else if (action==='open-receipt-generator') {
      const p = findRecord(target.dataset.id);
      if (p) {
        window.open(`assets/pdf/receipt-${p.id}.pdf`, '_blank');
      }
    }
    else if (action==='download-receipt') {
      const p = findRecord(target.dataset.id);
      if (p) {
        const a = document.createElement('a');
        a.href = `assets/pdf/receipt-${p.id}.pdf`;
        a.download = `receipt-${p.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast(`Recibo oficial ${p.id} descargado en PDF.`);
      }
    }
    else if (action==='download-invoice') {
      const p = findRecord(target.dataset.id);
      if (p) {
        const invNum = generateNumericInvoiceNum(p.id);
        const a = document.createElement('a');
        a.href = `assets/pdf/invoice-${p.id}.pdf`;
        a.download = `invoice-${invNum}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast(`Factura oficial ${invNum} descargada en PDF.`);
      }
    }
    else if (action==='dismiss-budget') { showBudgetNotice=false; renderUsage(); }
    else if (action==='timeframe') modal('Timeframe',`<form id="month-form" class="modal-body"><label class="field">Month<input type="month" name="month" value="${e(usageMonth)}" min="2000-01" max="2100-12" required></label><p class="hint">Selecciona el mes correspondiente a la fecha de tus despliegues y pagos.</p><div class="form-actions"><button class="btn primary">Apply</button></div></form>`);
    else if (action==='account-menu') popover(target,`<div class="popover-title">Signed in as <strong>${e(profile.username)}</strong></div><hr><a href="#public-profile">${icon('person')} Your profile</a><a href="#deployments">${icon('rocket')} Despliegues</a><a href="#payment-history">${icon('card')} Payment history</a><hr><a href="#settings">${icon('gear')} Configuración del espacio</a><button data-action="avatar">${icon('person')} Cambiar foto de perfil</button><button data-action="logo">${icon('page')} Cambiar logo</button>`);
    else if (action==='rates') openRates();
    else if (action==='avatar') { closePopover(); $('#avatar-input').click(); }
    else if (action==='logo') { closePopover(); $('#logo-input').click(); }
    else if (action==='mascot') { closePopover(); $('#mascot-input').click(); }
    else if (action==='new-menu') popover(target,`<a href="#deployments">${icon('rocket')} Nuevo despliegue</a><button data-action="new-record">${icon('card')} Registrar pago anterior</button><button data-action="new-organization">${icon('org')} New organization</button>`);
    else if (action==='navigation'||action==='organizations-menu') popover(target,`<a href="#organizations">${icon('org')} Organizations</a><a href="#usage">${icon('signal')} Usage</a><a href="#payment-history">${icon('card')} Payment history</a><a href="#deployments">${icon('rocket')} Despliegues</a>`);
    else if (action==='new-organization'||action==='move-organization') modal(action==='new-organization'?'New organization':'Move work to an organization',`<form id="org-form" class="modal-body"><label class="field">Organization name<input name="name" maxlength="60" required placeholder="your-organization"></label><label class="field" style="margin-top:15px">Description<input name="description" maxlength="160" placeholder="A home for your projects"></label><div class="form-actions"><button class="btn primary">Create organization</button></div></form>`);
    else if (action==='usage-more') popover(target,`<button data-action="new-record">${icon('plus')} Registrar despliegue</button><button data-action="usage-report">${icon('download')} Download report</button><button data-action="timeframe">${icon('calendar')} Choose month</button>`);
    else if (action==='usage-report') exportUsageReport();
    else if (action==='budget') navigate('budgets');
    else if (action==='new-budget-modal') {
      modal('New budget', `
        <form id="new-budget-form" class="modal-body">
          <label class="field">
            <span>Product or SKU</span>
            <select name="product" required style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:8px 10px;border-radius:6px;width:100%;">
              <option value="Actions">GitHub Actions</option>
              <option value="Codespaces">GitHub Codespaces</option>
              <option value="Packages">GitHub Packages</option>
              <option value="Git LFS">Git Large File Storage (LFS)</option>
              <option value="Copilot">GitHub Copilot</option>
              <option value="All AI Credit SKUs">All AI Credit SKUs</option>
            </select>
          </label>
          <label class="field" style="margin-top:14px;">
            <span>Monthly limit (USD)</span>
            <input type="number" name="limit" step="0.01" min="1" max="100000" placeholder="e.g. 60.00" value="60.00" required style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:8px 10px;border-radius:6px;width:100%;">
          </label>
          <div class="form-actions" style="margin-top:18px;">
            <button class="btn primary" type="submit" style="background:#238636;border-color:#2ea043;">Create budget</button>
          </div>
        </form>
      `);
      $('#new-budget-form')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        const prod = fd.get('product') || 'Custom';
        const lim = parseFloat(fd.get('limit')) || 10.0;
        const newB = {
          id: 'b-' + Date.now(),
          scope: 'Account',
          product: prod,
          limit: lim,
          spent: 0.00
        };
        budgets.push(newB);
        saveBudgets();
        closeModal();
        renderBudgets();
        toast(`Presupuesto para ${prod} creado exitosamente con límite de $${lim.toFixed(2)} USD.`);
      });
    }
    else if (action==='edit-budget-modal') {
      const b = budgets.find(x => x.id === target.dataset.id);
      if (b) {
        modal(`Edit budget · ${b.product}`, `
          <form id="edit-budget-form" class="modal-body">
            <p class="muted" style="margin-bottom:12px;font-size:12px;">Modifica el límite mensual y el consumo acumulado de este presupuesto.</p>
            <label class="field">
              <span>Límite mensual (USD)</span>
              <input type="number" name="limit" step="0.01" min="1" max="100000" value="${b.limit.toFixed(2)}" required style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:8px 10px;border-radius:6px;width:100%;">
            </label>
            <label class="field" style="margin-top:14px;">
              <span>Consumido actualmente (USD)</span>
              <input type="number" name="spent" step="0.01" min="0" max="100000" value="${b.spent.toFixed(2)}" required style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:8px 10px;border-radius:6px;width:100%;">
            </label>
            <div class="form-actions" style="margin-top:18px;">
              <button class="btn primary" type="submit" style="background:#238636;border-color:#2ea043;">Guardar cambios</button>
            </div>
          </form>
        `);
        $('#edit-budget-form')?.addEventListener('submit', (ev) => {
          ev.preventDefault();
          const fd = new FormData(ev.target);
          b.limit = parseFloat(fd.get('limit')) || 0;
          b.spent = parseFloat(fd.get('spent')) || 0;
          saveBudgets();
          closeModal();
          renderBudgets();
          toast(`Presupuesto ${b.product} actualizado: $${b.spent.toFixed(2)} / $${b.limit.toFixed(2)} USD.`);
        });
      }
    }
    else if (action==='activity') navigate('notifications');
    else if (action==='search') modal('Search settings',`<div class="modal-body"><label class="search-field" style="height:35px">${icon('search')}<input id="global-search" placeholder="Search settings…" autofocus></label><div id="search-results" style="margin-top:15px">${searchResults('')}</div></div>`);
  } catch(error) { toast(error.message || 'No se pudo completar la acción.'); }
});
function searchResults(query) { const links=[...mainLinks,...billingLinks,...accessLinks,...codeLinks,['deployments','Despliegues','rocket']].filter(x=>x[1].toLowerCase().includes(query.toLowerCase())); return links.map(x=>`<a class="nav-link" href="#${x[0]}" data-search-result>${icon(x[2]||'page')}${x[1]}</a>`).join('') || '<p class="muted">No results found.</p>'; }
document.addEventListener('input',event=>{
  if (event.target.id==='global-search') $('#search-results').innerHTML=searchResults(event.target.value);
  if (event.target.id==='valuation-search') { valuationState.query=event.target.value; valuationState.page=1; persistValuationState(); const pos=event.target.selectionStart; renderValuation(); $('#valuation-search').focus(); $('#valuation-search').setSelectionRange(pos,pos); }
  if (event.target.id==='usage-search') { usageSearch=event.target.value; const start=event.target.selectionStart; renderUsage(); $('#usage-search').focus(); $('#usage-search').setSelectionRange(start,start); }
  if (event.target.id==='deployment-search') { deploymentQuery=event.target.value; deploymentPage=1; const pos=event.target.selectionStart; renderDeployments(); $('#deployment-search').focus(); $('#deployment-search').setSelectionRange(pos,pos); }
});
document.addEventListener('change',async event=>{
  const input=event.target;
  try {
    if (input.id==='deploy-files') addSelected(Array.from(input.files));
    else if (input.id==='record-files') { const combined=[...recordFiles,...await wrapFiles(Array.from(input.files))]; validateFiles(combined); recordFiles=combined; updateRecordFiles(); input.value=''; }
    else if (input.id==='record-example' && input.value) { const combined=[...recordFiles,...demoBundles.find(b=>b.id===input.value).files.map(f=>({...f}))]; validateFiles(combined); recordFiles=combined; updateRecordFiles(); input.value=''; }
    else if (input.id==='group-by') { groupBy=input.value; renderUsage(); }
    else if (input.id==='valuation-project') { valuationState={project:input.value,query:'',page:1}; persistValuationState(); renderValuation(); }
    else if (input.id==='deployment-source') { deploymentSource=input.value; deploymentPage=1; renderDeployments(); }
    else if (['avatar-input','mascot-input','logo-input'].includes(input.id)) {
      const file=input.files[0]; if (!file) return;
      if (file.size>2_000_000 || !['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Elige una imagen PNG, JPG o WEBP de hasta 2 MB.');
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
      const imageKey={'avatar-input':'avatar','mascot-input':'mascot','logo-input':'logo'}[input.id];
      const next={...profile,[imageKey]:data}; write('profile',next); profile=next; renderHeader(); renderSidebar();
      const preview=$(`#workspace-${imageKey}`); if(preview) preview.innerHTML=`<img src="${e(data)}" alt="Imagen actualizada">`;
      toast('Imagen actualizada.');
    }
  } catch(error) { toast(error.message || 'No se pudo cargar el archivo.'); }
});
document.addEventListener('submit',async event=>{
  event.preventDefault(); const form=event.target; const values=Object.fromEntries(new FormData(form));
  const submit=form.querySelector('button[type="submit"],button:not([type])');
  try {
    if (form.id==='budget-settings-form') {
      const next=updateBillingState(billingState,{budget:Number(values.budget),baseUsage:Number(values.baseUsage),openingCredit:Number(values.openingCredit)});
      write('billing',next); billingState=next; showBudgetNotice=true; render(); toast('Presupuesto y consumo actualizados.');
    }
    else if (form.id==='deployment-edit-form') {
      const row=deploymentRows().find(item=>item.id===values.id); if(!row)throw new Error('No se encontró el despliegue.');
      const changes={name:values.name,date:values.date,amount:Number(values.amount),status:values.status};
      if(row.source==='github') { const next={...deploymentOverrides,[row.id]:changes}; buildDeploymentRows({payments,overrides:next}); write('deployment-overrides',next); deploymentOverrides=next; }
      else { const next=editPaymentRecord(payments,row.paymentId,changes); write('payments',next); payments=next; }
      usageMonth=values.date.slice(0,7); closeModal(); render(); toast('Despliegue actualizado. Los archivos adjuntos se conservan.');
    }
    else if (form.id==='record-form') { submit.disabled=true; submit.textContent='Guardando…'; await createRecord(values,recordFiles); usageMonth=values.date.slice(0,7); closeModal(); render(); toast('Registro guardado en Usage y Payment history.'); }
    else if (form.id==='checkout-form') {
      await confirmPayment(values);
    } else if (form.id==='rates-form') { const next=Object.fromEntries(Object.entries(values).map(([k,v])=>[k,Number(v)])); calculateQuote([],next); write('pricing',next); config=next; closeModal(); render(); toast('Configuración guardada. Precios actualizados.'); }
    else if (form.id==='workspace-form') { const next=Object.fromEntries(['base','perMB','includedMB','minimum','atrPrice','pwrPrice'].map(k=>[k,Number(values[k])])); calculateQuote([],next); const zoom=Number(values.zoom); if(!Number.isFinite(zoom)||zoom<90||zoom>130) throw new Error('Revisa el tamaño de interfaz.'); write('pricing',next); write('zoom',zoom); config=next; uiZoom=zoom; document.documentElement.style.setProperty('--ui-scale',zoom/100); render(); toast('Configuración guardada. Las próximas actualizaciones usarán estas tarifas.'); }
    else if (form.id==='month-form') { if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(values.month)) throw new Error('Selecciona un mes válido.'); usageMonth=values.month; closeModal(); renderUsage(); }
    else if (form.id==='org-form') { const name=values.name.trim(); if (!name) throw new Error('Organization name is required.'); const next=[...organizations,{name,description:values.description}]; write('organizations',next); organizations=next; closeModal(); renderOrganizations(); toast('Organization created.'); }
    else if (form.id==='profile-form') { const next={...profile,...values}; write('profile',next); profile=next; renderHeader(); toast('Profile updated.'); }
    else if (form.id==='budget-form') { write('budget',Number(values.budget)); showBudgetNotice=false; closeModal(); renderUsage(); toast('Budget updated.'); }
  } catch(error) { const err=form.querySelector('.form-error'); if (err) err.textContent=error.message; else toast(error.message); if (submit) { submit.disabled=false; submit.textContent=form.id==='checkout-form'?`Confirmar y pagar ${money(checkout?.quote.total || 0)}`:'Guardar registro'; } }
});
$('#modal').addEventListener('click',event=>{if(event.target===$('#modal')) { const r=$('#modal').getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) closeModal(); }});
$('#modal').addEventListener('cancel',event=>{if(deploymentBusy||recordMutationBusy||checkout?.locked){event.preventDefault();return;}if(checkout)checkout.cancelled=true;checkout=null;});
document.addEventListener('click',event=>{if(event.target.closest('[data-search-result]')) closeModal();});
document.addEventListener('keydown',event=>{if(event.key==='Escape') closePopover(); if(event.key==='/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !$('#modal').open) {event.preventDefault();$('.top-search').click();}});
window.addEventListener('hashchange',()=>{activePage=location.hash.slice(1)||'organizations';render();window.scrollTo(0,0);});
render();
