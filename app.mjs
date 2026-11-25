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
const localMoney = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
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
  },
  {
    id: '8B64D12E',
    date: '2026-11-16',
    name: 'GitHub Codespaces — 8-Core Cloud Compute (Workstation Hours)',
    kind: 'Codespaces',
    method: 'American Express ending in 1989',
    amount: 340.00,
    sku: 'codespaces_compute_d4',
    productLine: 'GitHub Codespaces core hours',
    unit: 'hrs',
    quantity: '944.44 hrs',
    rawQty: 944.4444444444445,
    unitRate: 0.36,
    rate: '0.36',
    rateStr: '$0.36/hr',
    period: 'Nov 01, 2026 - Nov 16, 2026',
    files: [{ ...demoBundles[1].files[0] }],
    invoiceData: {
      sku: 'codespaces_compute_d4',
      productLine: 'GitHub Codespaces core hours',
      description: 'GitHub Codespaces — 8-Core Cloud Compute (Workstation Hours)',
      period: 'Nov 01, 2026 - Nov 16, 2026',
      quantity: '944.44 hrs',
      rate: '0.36',
      rateStr: '$0.36/hr',
      unit: 'hrs',
      amount: '$340.00',
      invoiceDate: 'Nov 16, 2026',
      dueDate: 'Nov 16, 2026'
    },
    receiptData: {
      sku: 'codespaces_compute_d4',
      description: 'GitHub Codespaces — 8-Core Cloud Compute (Workstation Hours)',
      period: 'Nov 01, 2026 - Nov 16, 2026',
      quantity: '944.44 hrs',
      rateStr: '$0.36/hr',
      amount: '$340.00 USD'
    }
  },
  {
    id: '9C75E23F',
    date: '2026-11-20',
    name: 'GitHub Actions — macOS & Linux Runners (CI/CD Deployment Minutes)',
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
    period: 'Nov 01, 2026 - Nov 20, 2026',
    files: [{ ...demoBundles[0].files[0] }],
    invoiceData: {
      sku: 'actions_macos',
      productLine: 'GitHub Actions minutes',
      description: 'GitHub Actions — macOS & Linux Runners (CI/CD Deployment Minutes)',
      period: 'Nov 01, 2026 - Nov 20, 2026',
      quantity: '3,312.5 min',
      rate: '0.080',
      rateStr: '$0.080/min',
      unit: 'min',
      amount: '$265.00',
      invoiceDate: 'Nov 20, 2026',
      dueDate: 'Nov 20, 2026'
    },
    receiptData: {
      sku: 'actions_macos',
      description: 'GitHub Actions — macOS & Linux Runners (CI/CD Deployment Minutes)',
      period: 'Nov 01, 2026 - Nov 20, 2026',
      quantity: '3,312.5 min',
      rateStr: '$0.080/min',
      amount: '$265.00 USD'
    }
  },
  {
    id: '9D86F34A',
    date: '2026-11-24',
    name: 'GitHub Packages & Git LFS — Shared Storage & Bandwidth Egress (GB-Months)',
    kind: 'Storage',
    method: 'American Express ending in 0388',
    amount: 135.00,
    sku: 'packages_storage',
    productLine: 'GitHub Packages & Git LFS storage',
    unit: 'GB',
    quantity: '540 GB',
    rawQty: 540.0,
    unitRate: 0.25,
    rate: '0.25',
    rateStr: '$0.25/GB',
    period: 'Nov 01, 2026 - Nov 24, 2026',
    files: [{ ...demoBundles[2].files[0] }],
    invoiceData: {
      sku: 'packages_storage',
      productLine: 'GitHub Packages & Git LFS storage',
      description: 'GitHub Packages & Git LFS — Shared Storage & Bandwidth Egress (GB-Months)',
      period: 'Nov 01, 2026 - Nov 24, 2026',
      quantity: '540 GB',
      rate: '0.25',
      rateStr: '$0.25/GB',
      unit: 'GB',
      amount: '$135.00',
      invoiceDate: 'Nov 24, 2026',
      dueDate: 'Nov 24, 2026'
    },
    receiptData: {
      sku: 'packages_storage',
      description: 'GitHub Packages & Git LFS — Shared Storage & Bandwidth Egress (GB-Months)',
      period: 'Nov 01, 2026 - Nov 24, 2026',
      quantity: '540 GB',
      rateStr: '$0.25/GB',
      amount: '$135.00 USD'
    }
  }
];

export const DEPLOYMENT_COMMITS = {
  '08JUNE3A': {
    date: '2026-06-03',
    sha: 'a6311c2c',
    title: 'Merge: purge does not delete shared Auth/identity (duplicate Angelo case)',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/a6311c2c8308deaac11896cf9dbb40b0297e586d'
  },
  '1B78C49E': {
    date: '2026-07-03',
    sha: 'e5763870',
    title: 'merge: legacy IndexedDB anti-cache guard in discovery (branch dreamy-meitner)',
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
    title: 'test(rules): Heroes admin uploads Vital promo_cards background (#303)',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/6a4dfb432c93aff31e9854a8890a46c28eed2b00'
  },
  '3E92B67C': {
    date: '2026-09-03',
    sha: '7778f632',
    title: 'feat(nexo): Vital Promo Studio + Heroes Gym activation (#302)',
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
    title: 'Merge PR #380: claude/local review handoff 148905',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/653aa0f4c23b461fbc56ffd39bfdf8d830623365'
  },
  '362GCLD1': {
    date: '2026-10-01',
    sha: '631f5717',
    title: 'Merge PR #398: docs/rotated keystore',
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
    title: 'Merge PR #557: claude/hyrox charity podiums docs',
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
    title: 'Merge PR #608: claude/pwr stable landing test',
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
  },
  '8B64D12E': {
    date: '2026-11-16',
    sha: '8b64d12e',
    title: 'CI/CD CrossBox #1838: Codespaces 8-core workstation cluster & multi-box state sync',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/8b64d12e3c9f71a650183bd47210cf8493b60129'
  },
  '9C75E23F': {
    date: '2026-11-20',
    sha: '9c75e23f',
    title: 'CI/CD CrossBox #1840: macOS iOS release archive & PWR Games live arena scoring',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/9c75e23f4a1d82b761094ce58321da9504c71230'
  },
  '9D86F34A': {
    date: '2026-11-24',
    sha: '9d86f34a',
    title: 'CI/CD CrossBox #1842: Packages registry release, Git LFS assets & Nov 24 production sync',
    url: 'https://github.com/lfarmas4/crossbox-app/commit/9d86f34a7b2e19c485013fa67289bc1409a82341'
  }
};

const PAYMENTS_DATA_VERSION = 8;
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
  { id: 'b-account', scope: 'Account', product: 'Monthly Account Budget (All Services)', limit: 900.00, spent: 740.00 },
  { id: 'b-codespaces', scope: 'Account', product: 'Codespaces', limit: 400.00, spent: 340.00 },
  { id: 'b-actions', scope: 'Account', product: 'Actions', limit: 320.00, spent: 265.00 },
  { id: 'b-packages', scope: 'Account', product: 'Packages', limit: 120.00, spent: 95.00 },
  { id: 'b-git-lfs', scope: 'Account', product: 'Git LFS', limit: 60.00, spent: 40.00 }
];

let budgets = (() => {
  try {
    const raw = localStorage.getItem('codeweight-budgets-v5');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...DEFAULT_BUDGETS];
})();

function saveBudgets() {
  try {
    localStorage.setItem('codeweight-budgets-v5', JSON.stringify(budgets));
  } catch {}
}

let toastTimer;
let dbPromise;

function database() {
  if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('codeweight-files', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { dbPromise = undefined; reject(new Error('Could not open file storage.')); };
    request.onblocked = () => reject(new Error('Close other CodeWeight tabs and try again.'));
  });
  return dbPromise;
}
async function saveBlob(key, blob) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(blob, key);
    tx.oncomplete = resolve;
    tx.onerror = tx.onabort = () => reject(new Error('Not enough space to save the file. Record was not created.'));
  });
}
async function loadBlob(key) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction('files').objectStore('files').get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Could not retrieve the file.'));
  });
}
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 4000); }
function today() { return new Intl.DateTimeFormat('en-CA', {timeZone:'America/Guayaquil',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
function validDate(date) { return /^\d{4}-\d{2}-\d{2}$/.test(date) && new Date(`${date}T12:00:00Z`).toISOString().slice(0,10) === date; }
const btn = (text, action, cls = '', extra = '') => `<button type="button" class="btn ${cls}" data-action="${action}" ${extra}>${text}</button>`;
function heading(title, action = '', cls = '') { return `<div class="page-heading ${cls}"><h1>${title}</h1>${action}</div>`; }
function avatar(small = false) { return `<button class="avatar ${small ? 'small' : ''}" data-action="${small ? 'account-menu' : 'avatar'}" aria-label="${small ? 'Open account menu' : 'Add profile photo'}" title="${small ? 'Account' : 'Add your photo'}">${profile.avatar ? `<img src="${e(profile.avatar)}" alt="Your profile photo">` : icon('person')}</button>`; }
function renderHeader() {
  $('#topbar').innerHTML = `<button class="icon-button" data-action="navigation" aria-label="Open navigation">${icon('menu')}</button><a href="#overview" title="GitHub" aria-label="Homepage" style="display:flex;align-items:center;text-decoration:none;color:#ffffff;">${profile.logo && profile.logo !== 'icon.svg' ? `<img class="brand" src="${e(profile.logo)}" alt="GitHub" style="width:32px;height:32px;border-radius:50%;">` : `<svg class="brand" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" style="display:block;fill:#ffffff;"><path fill-rule="evenodd" clip-rule="evenodd" d="M16 0C7.16 0 0 7.16 0 16C0 23.08 4.58 29.06 10.94 31.18C11.74 31.32 12.04 30.84 12.04 30.42C12.04 30.04 12.02 28.78 12.02 27.44C8 28.18 6.96 26.46 6.64 25.56C6.46 25.1 5.68 23.68 5 23.3C4.44 23 3.64 22.26 4.98 22.24C6.24 22.22 7.14 23.4 7.44 23.88C8.88 26.3 11.18 25.62 12.1 25.2C12.24 24.16 12.66 23.46 13.12 23.06C9.56 22.66 5.84 21.28 5.84 15.16C5.84 13.42 6.46 11.98 7.48 10.86C7.32 10.46 6.76 8.82 7.64 6.62C7.64 6.62 8.98 6.2 12.04 8.26C13.32 7.9 14.68 7.72 16.04 7.72C17.4 7.72 18.76 7.9 20.04 8.26C23.1 6.18 24.44 6.62 24.44 6.62C25.32 8.82 24.76 10.46 24.6 10.86C25.62 11.98 26.24 13.4 26.24 15.16C26.24 21.3 22.5 22.66 18.94 23.06C19.52 23.56 20.02 24.52 20.02 26.02C20.02 28.16 20 29.88 20 30.42C20 30.84 20.3 31.34 21.1 31.18C27.42 29.06 32 23.06 32 16C32 7.16 24.84 0 16 0V0Z"/></svg>`}</a><span class="top-title">Settings</span><div class="top-actions"><button class="top-search" data-action="search">${icon('search')}<span>Type <kbd>/</kbd> to search</span></button><button class="icon-button desktop" data-action="organizations-menu" aria-label="Organizations">${icon('users')}${icon('chevron')}</button><span class="separator desktop"></span><button class="icon-button" data-action="new-menu" aria-label="Create new">${icon('plus')}${icon('chevron')}</button><button class="icon-button optional" data-action="activity" aria-label="Activity">${icon('issue')}</button><button class="icon-button optional" data-action="deployments" aria-label="Deployments">${icon('branch')}</button><button class="icon-button optional" data-action="repositories" aria-label="Repositories">${icon('repo')}</button><button class="icon-button desktop" data-action="notifications" aria-label="Notifications">${icon('inbox')}</button>${avatar(true)}</div>`;
  $('#account-heading').innerHTML = `${avatar()}<div><div class="account-name">${e(profile.name)} <span>(${e(profile.username)})</span></div><div class="account-caption">Your personal account</div></div>`;
}
const mainLinks = [['public-profile','Public profile','person'],['account','Account','gear'],['appearance','Appearance','brush'],['accessibility','Accessibility','access'],['notifications','Notifications','bell']];
const billingLinks = [['overview','Overview'],['usage','Usage'],['ai-usage','AI usage'],['budgets','Budgets and alerts'],['licensing','Licensing'],['payment-information','Payment information'],['payment-history','Payment history'],['billing-details','Additional billing details'],['education','Education benefits']];
const accessLinks = [['emails','Emails','mail'],['authentication','Password and authentication','shield'],['sessions','Sessions','signal'],['keys','SSH and GPG keys','key'],['credentials','Credentials','shield'],['organizations','Organizations','org'],['enterprises','Enterprises','globe'],['moderation','Moderation','message']];
const codeLinks = [['valuation','Price history','card'],['repositories','Repositories','repo'],['codespaces','Codespaces','terminal'],['packages','Packages','box'],['copilot','Copilot','users'],['pages','Pages','page']];
function navLink([id,title,ico], sub = false) { return `<a class="nav-link ${activePage === id ? 'active' : ''} ${['organizations','usage','payment-history','deployments'].includes(id) ? 'mobile-tab' : ''}" href="#${id}" ${activePage === id ? 'aria-current="page"' : ''}>${ico ? icon(ico) : ''}<span>${title}</span>${id === 'deployments' ? '<span class="nav-new">New</span>' : ''}</a>`; }
function renderSidebar() {
  const billingActive = billingLinks.some(([id]) => id === activePage);
  $('#sidebar').innerHTML = `<div class="nav-group">${mainLinks.map(x=>navLink(x)).join('')}</div><div class="nav-section"><div class="nav-label">Access</div><button class="nav-toggle" data-action="toggle-billing" aria-expanded="${billOpen || billingActive}">${icon('card')}<span>Billing and licensing</span>${icon('chevron','chevron')}</button><div class="nav-sub ${billOpen || billingActive ? '' : 'hidden'}">${billingLinks.map(x=>navLink(x,true)).join('')}</div>${accessLinks.map(x=>navLink(x)).join('')}</div><div class="nav-section"><div class="nav-label">Code, planning, and automation</div>${navLink(['deployments','Deployments','rocket'])}${codeLinks.map(x=>navLink(x)).join('')}</div><div class="nav-section"><div class="nav-label">Integrations</div>${navLink(['applications','Applications','box'])}${navLink(['settings','Workspace settings','gear'])}</div>`;
  if(profile.mascot) $('#sidebar').insertAdjacentHTML('beforeend',`<div class="workspace-art"><button data-action="mascot" title="Change workspace image"><img src="${e(profile.mascot)}" alt="Workspace image"></button></div>`);
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
  else if (activePage === 'codespaces') renderCodespaces();
  else if (activePage === 'applications') renderApplications();
  else renderOther();
  document.title = `${pageTitle()} · GitHub`;
}
function pageTitle() { return [...mainLinks,...billingLinks,...accessLinks,...codeLinks,['deployments','Deployments'],['settings','Workspace settings']].find(([id])=>id===activePage)?.[1] || 'Developer settings'; }
function navigate(id) { if (activePage === id) render(); else location.hash = id; }
function renderOrganizations() {
  $('#main').className = 'organization-page';
  $('#main').innerHTML = `${heading('Organizations',btn('New organization','new-organization','small'),'no-border')}<div>${organizations.length ? organizations.map(o=>`<div class="org-card">${icon('org')}<div><strong>${e(o.name)}</strong><div class="muted">${e(o.description || 'Your organization')}</div></div><span class="badge" style="margin-left:auto">Owner</span></div>`).join('') : '<div class="empty-org">You are not a member of any organizations.</div>'}</div><section class="move-org"><h2>Move to an organization</h2><p>Your personal account cannot be converted to an organization. You must create a new organization and transfer your repositories and projects to it instead. You can then rename your personal account and the organization if you want your organization to have the same name that you are currently using for your personal account.</p>${btn('Move work to an organization','move-organization')}</section>`;
}
function statusBadge(status='success') {
  const labels={success:'Success',deployed:'Deployed',pending:'Pending',failed:'Failed',ready:'Ready',deploying:'Deploying'};
  return `<span class="status status-${e(status)}">${labels[status]||'Success'}</span>`;
}
function deploymentStateBadge(row) { return statusBadge(row.source==='local'&&row.status==='success'?row.deploymentStatus:row.status); }
function deploymentStartButton(row) {
  if(row.source!=='local'||row.status!=='success'||row.deploymentStatus==='deployed') return '';
  return btn(row.deploymentStatus==='deploying'?'Continue':'Deploy','deploy-now','small primary',`data-id="${e(row.paymentId)}"`);
}
function recordRows(records, detailed = false) {
  return records.map(p=>`<tr><td>${e(p.date)}</td><td class="mono">${e(p.id)}</td>${detailed ? `<td>${e(p.name)}</td><td>${formatBytes((p.files || []).reduce((s,f)=>s+f.size,0))}</td>` : `<td>${icon('card')} ${e(p.method)}</td>`}<td>${money(p.amount)}</td><td>${statusBadge(p.status)}</td><td style="white-space:nowrap;"><button class="table-action" data-action="download-receipt" data-id="${e(p.id)}" title="Download official PDF receipt" aria-label="Download receipt ${e(p.id)}">${icon('download')}</button><button class="table-action" data-action="open-receipt-generator" data-id="${e(p.id)}" title="View official receipt in new tab" aria-label="View receipt ${e(p.id)}">${icon('eye')}</button></td>${detailed ? '' : `<td style="white-space:nowrap;"><button class="table-action" data-action="download-invoice" data-id="${e(p.id)}" title="Download official PDF invoice" aria-label="Download invoice ${e(p.id)}">${icon('download')}</button></td>`}</tr>`).join('');
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
          Deployment date: <strong>${e(p.date)}</strong> · Invoice: <strong style="color:#e6edf3;">${e(generateNumericInvoiceNum(p.id))}</strong> · Commit: <span style="background:#161b22;padding:2px 5px;border-radius:3px;color:#58a6ff;">${e(dep.sha)}</span>
          ${p.quantity ? ` · <span style="color:#7ee787;font-weight:600;">${e(p.quantity)}</span> (${e(p.sku || '')}${p.rateStr ? ` @ ${e(p.rateStr)}` : ''})` : ''}
        </div>
      </div>
      <div>
        <a href="${e(dep.url)}" target="_blank" rel="noopener noreferrer" class="btn small" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:4px 10px;text-decoration:none;">
          ${icon('link')} View changes
        </a>
      </div>
    </li>`;
  }).join('');

  $('#main').className = 'history-page';
  $('#main').innerHTML = `${heading('Payment history')}<div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>ID</th><th>Payment Method</th><th>Amount</th><th>Status</th><th>Receipt</th><th>Invoice</th></tr></thead><tbody>${recordRows(records)}</tbody></table></div><p class="currency-note">Amounts shown in USD</p>
  <div style="margin-top:35px;background:#0d1117;border:1px solid #30363d;border-radius:6px;overflow:hidden;">
    <div style="background:#161b22;padding:12px 16px;border-bottom:1px solid #30363d;display:flex;justify-content:space-between;align-items:center;">
      <h3 style="margin:0;font-size:13px;font-weight:600;color:#c9d1d9;display:flex;align-items:center;gap:8px;">
        ${icon('rocket')} Verified production deployments executed on these dates (GitHub Actions / Commits)
      </h3>
      <span style="font-size:11px;color:#8b949e;">${records.length} verified deployments</span>
    </div>
    <ul style="list-style:none;margin:0;padding:0;background:#0d1117;">
      ${deploysListHtml}
    </ul>
  </div>`;
}
function usageRecords() { return activePayments(payments).filter(p => p.purpose!=='budget' && p.status!=='failed' && p.date.startsWith(usageMonth) && (!usageSearch || `${p.name} ${p.id} ${p.files?.map(f=>f.name).join(' ')}`.toLowerCase().includes(usageSearch.toLowerCase()))); }
function chartMarkup() {
  const pts = [
    [1, 18.50],
    [3, 62.00],
    [5, 118.40],
    [7, 176.00],
    [9, 245.50],
    [11, 312.00],
    [13, 378.80],
    [16, 485.00],
    [18, 558.20],
    [20, 628.00],
    [22, 686.50],
    [24, 740.00]
  ];

  const left = 48, right = 690, top = 20, bottom = 220;
  const maxVal = 800.0;

  const points = pts.map(([day, val]) => {
    const x = left + (day - 1) * (right - left) / 23.0;
    const y = bottom - (val / maxVal) * (bottom - top);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const gridY = [800, 640, 480, 320, 160, 0];
  const gridLines = gridY.map(v => {
    const y = bottom - (v / maxVal) * (bottom - top);
    return `
      <text x="${left - 10}" y="${y + 4}" text-anchor="end" fill="#7d8590" font-size="11">$${v}</text>
      <line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#21262d" stroke-width="1" />
    `;
  }).join('');

  const xLabels = pts.map(([day]) => {
    const x = left + (day - 1) * (right - left) / 23.0;
    return `<text x="${x.toFixed(1)}" y="${bottom + 20}" text-anchor="middle" fill="#7d8590" font-size="10">Nov ${day}</text>`;
  }).join('');

  return `
    <svg class="usage-chart" viewBox="0 0 720 255" style="width:100%;height:auto;overflow:visible;" role="img" aria-label="Metered usage chart November 1 - November 24, 2026 reaching $740.00">
      ${gridLines}
      <polyline points="${points}" fill="none" stroke="#2f81f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ${pts.map(([day, val]) => {
        const x = left + (day - 1) * (right - left) / 23.0;
        const y = bottom - (val / maxVal) * (bottom - top);
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="#2f81f7"><title>Nov ${day}: $${val.toFixed(2)}</title></circle>`;
      }).join('')}
      ${xLabels}
    </svg>
  `;
}

function renderUsage() {
  $('#main').className = 'usage-page';
  
  const records = [...usageRecords()].sort((a,b)=>a.date.localeCompare(b.date));

  $('#main').innerHTML = `
    <div class="page-heading">
      <h1>Metered usage</h1>
      <button class="btn small" data-action="usage-report">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"></path><path d="M7.25 1.75v7.69L4.47 6.66a.749.749 0 0 0-1.06 1.06l3.75 3.75a.749.749 0 0 0 1.06 0l3.75-3.75a.749.749 0 1 0-1.06-1.06L8.75 9.44V1.75a.75.75 0 0 0-1.5 0Z"></path></svg>
        Get usage report
      </button>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
      <div style="flex:1;min-width:240px;position:relative;">
        <input id="usage-search" value="${e(usageSearch)}" placeholder="Search or filter usage" style="width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:6px 12px 6px 32px;color:#c9d1d9;font-size:12px;" aria-label="Search or filter usage">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="#7d8590" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);"><path d="m21 21-5.1-5.1M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0"></path></svg>
      </div>
      <div style="background:#161b22;border:1px solid #30363d;padding:6px 12px;border-radius:6px;font-size:12px;color:#c9d1d9;">
        Group by: None <span style="font-size:10px;">▾</span>
      </div>
      <div style="background:#161b22;border:1px solid #30363d;padding:6px 12px;border-radius:6px;font-size:12px;color:#c9d1d9;">
        Timeframe: Current month <span style="font-size:10px;">▾</span>
      </div>
    </div>

    <div style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:20px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <div>
          <h2 style="font-size:14px;font-weight:600;color:#c9d1d9;margin:0 0 4px 0;">Metered usage</h2>
          <span style="font-size:12px;color:#8b949e;">Nov 1 - Nov 24, 2026</span>
        </div>
        <div style="display:flex;gap:8px;color:#8b949e;">
          <button style="background:none;border:none;color:#8b949e;cursor:pointer;">•••</button>
          <button style="background:none;border:none;color:#8b949e;cursor:pointer;">⚙</button>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <span style="width:16px;height:2px;background:#2f81f7;display:inline-block;"></span>
        <span style="font-size:12px;color:#c9d1d9;">Usage ($740.00 net spent as of Nov 24)</span>
      </div>

      ${chartMarkup()}
    </div>

    <div style="margin-top:24px;">
      <h2 style="font-size:14px;font-weight:600;color:#c9d1d9;margin:0 0 4px 0;">Usage breakdown</h2>
      <p style="font-size:12px;color:#8b949e;margin:0 0 16px 0;">Usage for Nov 1 - Nov 24, 2026. Budget usage ($740.00 net) distributed across cloud services.</p>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity / Consumption</th>
              <th>Gross Spend</th>
              <th>Included Discount</th>
              <th>Net Billed</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>GitHub Codespaces core hours</strong></td>
              <td>944.44 hrs</td>
              <td>$340.00</td>
              <td>—</td>
              <td>$340.00</td>
            </tr>
            <tr>
              <td><strong>GitHub Actions minutes</strong> (macOS & Linux)</td>
              <td>3,428.25 min</td>
              <td>$274.26</td>
              <td>-$9.26</td>
              <td>$265.00</td>
            </tr>
            <tr>
              <td><strong>GitHub Packages storage</strong></td>
              <td>380 GB</td>
              <td>$95.00</td>
              <td>—</td>
              <td>$95.00</td>
            </tr>
            <tr>
              <td><strong>Git Large File Storage (LFS)</strong></td>
              <td>80 GB Bandwidth</td>
              <td>$40.00</td>
              <td>—</td>
              <td>$40.00</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="font-weight:600;border-top:2px solid #30363d;background:#161b22;">
              <td>Total current cycle (Nov 1 – Nov 24, 2026)</td>
              <td>4 active services</td>
              <td>$749.26</td>
              <td>-$9.26</td>
              <td><strong>$740.00</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div style="margin-top:28px;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:18px;">
        <div style="flex:1;min-width:280px;">
          <h3 style="font-size:14px;font-weight:600;color:#c9d1d9;margin:0 0 4px 0;display:flex;align-items:center;gap:8px;">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="#58a6ff"><path d="M1.5 3A1.5 1.5 0 0 1 3 1.5h10A1.5 1.5 0 0 1 14.5 3v10a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 13V3ZM3 2.5a.5.5 0 0 0-.5.5v1h11V3a.5.5 0 0 0-.5-.5H3Zm11 2.5H2v8a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V5Z"></path><path d="M4.5 7.5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Zm4 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Zm-4 3a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Zm4 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Z"></path></svg>
            Month-end estimate and closing projection (Nov 30, 2026)
          </h3>
          <p style="font-size:12px;color:#8b949e;margin:0 0 10px 0;">
            Projected calculation for the current <strong>November 2026</strong> billing cycle. Assigned budget of <strong>$900.00 USD</strong> with continuous monitoring and configured threshold alerts.
          </p>
          <div style="background:#161b22;border:1px solid #30363d;border-radius:6px;padding:8px 12px;font-size:11px;color:#8b949e;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span style="display:inline-flex;align-items:center;gap:5px;color:#7ee787;font-weight:600;">
              <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#2ea043;"></span> Budget alerts: On
            </span>
            <span>· Monthly limit: <strong style="color:#c9d1d9;">$900.00 USD</strong></span>
            <span>· Alerts at: <strong>75% ($675)</strong> and <strong>90% ($810)</strong></span>
            <span style="color:#58a6ff;">· Available headroom today: $160.00 USD</span>
          </div>
        </div>
        <div style="display:flex;gap:24px;align-items:flex-end;">
          <div style="text-align:right;">
            <span style="font-size:11px;color:#8b949e;text-transform:uppercase;letter-spacing:0.5px;">Current month net</span>
            <strong style="display:block;font-size:24px;color:#c9d1d9;font-weight:600;">$740.00</strong>
            <small style="color:#8b949e;font-size:11px;">As of Nov 24</small>
          </div>
          <div style="text-align:right;">
            <span style="font-size:11px;color:#8b949e;text-transform:uppercase;letter-spacing:0.5px;">Projected net (Nov 30)</span>
            <strong style="display:block;font-size:24px;color:#c9d1d9;font-weight:600;">$865.00</strong>
            <small style="color:#8b949e;font-size:11px;">Set budget: $900.00</small>
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Usage as of Nov 24</th>
              <th>Daily rate</th>
              <th>Projected by Nov 30</th>
              <th>Projected net billed</th>
              <th>Estimated next month</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>GitHub Codespaces</strong> core hours</td>
              <td>944.44 hrs ($340.00 net)</td>
              <td>39.4 hrs/day ($14.17/day)</td>
              <td>1,111.11 hrs</td>
              <td><strong style="color:#c9d1d9;">$400.00</strong></td>
              <td>$360.00 – $400.00</td>
            </tr>
            <tr>
              <td><strong>GitHub Actions</strong> (macOS & Linux)</td>
              <td>3,428.25 min ($274.26 gross / $265.00 net)</td>
              <td>142.8 min/day ($11.04/day)</td>
              <td>3,990 min ($319.26 gross)</td>
              <td><strong style="color:#c9d1d9;">$310.00</strong> <small style="color:#8b949e;">(-$9.26 disc.)</small></td>
              <td>$250.00 – $310.00</td>
            </tr>
            <tr>
              <td><strong>GitHub Packages</strong> storage</td>
              <td>380 GB ($95.00)</td>
              <td>CI/CD artifacts and cache</td>
              <td>420 GB</td>
              <td><strong style="color:#c9d1d9;">$105.00</strong></td>
              <td>$90.00 – $115.00</td>
            </tr>
            <tr>
              <td><strong>Git Large File Storage (LFS)</strong></td>
              <td>80 GB Bandwidth ($40.00)</td>
              <td>Media & release assets</td>
              <td>100 GB</td>
              <td><strong style="color:#c9d1d9;">$50.00</strong></td>
              <td>$40.00 – $55.00</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="font-weight:600;border-top:2px solid #30363d;background:#161b22;">
              <td>Estimated monthly total</td>
              <td>$740.00 net used</td>
              <td>—</td>
              <td>Full 30 days</td>
              <td><span style="color:#c9d1d9;">$865.00 USD</span></td>
              <td>$740.00 – $880.00</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div style="margin-top:28px;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <h3 style="font-size:14px;font-weight:600;color:#c9d1d9;margin:0 0 4px 0;display:flex;align-items:center;gap:8px;">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="#3fb950"><path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 15H2.75A1.75 1.75 0 0 1 1 13.25V2.75Zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25H2.75ZM8 4a.75.75 0 0 1 .75.75v.27c1.173.23 2 1.155 2 2.23 0 1.25-.97 2.25-2.25 2.25H7.5c-.414 0-.75.336-.75.75s.336.75.75.75h2a.75.75 0 0 1 0 1.5v.25a.75.75 0 0 1-1.5 0v-.27c-1.173-.23-2-1.155-2-2.23 0-1.25.97-2.25 2.25-2.25H9c.414 0 .75-.336.75-.75s-.336-.75-.75-.75H7a.75.75 0 0 1 0-1.5V4.75A.75.75 0 0 1 8 4Z"></path></svg>
            Allocated budget distribution (Payment Overview Reconciliation)
          </h3>
          <p style="font-size:12px;color:#8b949e;margin:0;">
            Allocated budgets distributed by product, directly reconciled with the historical total of <strong>$9,695.96 USD</strong> in Payment Overview (monthly average: <strong>$1,615.99 USD</strong>).
          </p>
        </div>
        <div style="text-align:right;">
          <span style="font-size:11px;color:#8b949e;text-transform:uppercase;letter-spacing:0.5px;">Total Accumulated Budget</span>
          <strong style="display:block;font-size:22px;color:#c9d1d9;font-weight:600;">$9,695.96</strong>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;margin-bottom:16px;">
        <div style="background:#161b22;border:1px solid #30363d;border-radius:6px;padding:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:600;color:#c9d1d9;">Codespaces Workstations</span>
            <span style="font-size:11px;color:#8b949e;">70.0%</span>
          </div>
          <div style="font-size:18px;font-weight:600;color:#c9d1d9;margin-bottom:4px;">$6,784.00</div>
          <div style="width:100%;background:#21262d;height:6px;border-radius:3px;overflow:hidden;margin-bottom:6px;">
            <div style="width:100%;height:100%;background:#388bfd;"></div>
          </div>
          <p style="font-size:11px;color:#8b949e;margin:0;">Allocated budget for development workstations and 8-core / 16-core instances (+$340.00 in Nov).</p>
        </div>

        <div style="background:#161b22;border:1px solid #30363d;border-radius:6px;padding:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:600;color:#c9d1d9;">Actions Runners</span>
            <span style="font-size:11px;color:#8b949e;">20.1%</span>
          </div>
          <div style="font-size:18px;font-weight:600;color:#c9d1d9;margin-bottom:4px;">$1,945.00</div>
          <div style="width:100%;background:#21262d;height:6px;border-radius:3px;overflow:hidden;margin-bottom:6px;">
            <div style="width:98%;height:100%;background:#2ea043;"></div>
          </div>
          <p style="font-size:11px;color:#8b949e;margin:0;">Native iOS (macOS) builds, Android APK, cluster runners, and CI/CD workflows (+$265.00 in Nov).</p>
        </div>

        <div style="background:#161b22;border:1px solid #30363d;border-radius:6px;padding:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:600;color:#c9d1d9;">Packages & Storage</span>
            <span style="font-size:11px;color:#8b949e;">7.4%</span>
          </div>
          <div style="font-size:18px;font-weight:600;color:#c9d1d9;margin-bottom:4px;">$715.00</div>
          <div style="width:100%;background:#21262d;height:6px;border-radius:3px;overflow:hidden;margin-bottom:6px;">
            <div style="width:94%;height:100%;background:#d29922;"></div>
          </div>
          <p style="font-size:11px;color:#8b949e;margin:0;">Storage for npm packages, Docker containers, and deployment artifacts (+$95.00 in Nov).</p>
        </div>

        <div style="background:#161b22;border:1px solid #30363d;border-radius:6px;padding:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:600;color:#c9d1d9;">Git LFS & Egress</span>
            <span style="font-size:11px;color:#8b949e;">2.6%</span>
          </div>
          <div style="font-size:18px;font-weight:600;color:#c9d1d9;margin-bottom:4px;">$251.96</div>
          <div style="width:100%;background:#21262d;height:6px;border-radius:3px;overflow:hidden;margin-bottom:6px;">
            <div style="width:90%;height:100%;background:#a371f7;"></div>
          </div>
          <p style="font-size:11px;color:#8b949e;margin:0;">Bandwidth for large Power Games assets, trailers, and data egress (+$40.00 in Nov).</p>
        </div>
      </div>

      <div style="display:flex;gap:12px;align-items:center;justify-content:flex-end;">
        <a href="#payment-history" class="btn small" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;">
          View 20 receipts in Payment history
        </a>
        <a href="#budgets" class="btn small primary" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;">
          Adjust limits in Budgets and alerts
        </a>
      </div>
    </div>
  `;
}

function renderValuation() {
  $('#main').className='valuation-page';
  $('#main').innerHTML=renderValuationPage(valuationState);
}
function fileRows(files, kind) {
  return files.map((file,i)=>`<div class="file-row">${icon('file')}<div class="file-info"><span class="file-name">${e(file.name)}</span><small>${formatBytes(file.size)}</small></div><button type="button" class="bare-icon" data-action="remove-${kind}" data-index="${i}" aria-label="Remove ${e(file.name)}">${icon('close')}</button></div>`).join('');
}
function deploymentRows() { return buildDeploymentRows({payments,overrides:deploymentOverrides}); }
function paidTotal() { return activePayments(payments).filter(p=>(p.status??'success')==='success').reduce((sum,p)=>sum+Math.round(p.amount*100),0)/100; }
function deploymentActivityMarkup() {
  const all=deploymentRows();
  const filtered=all.filter(row=>(deploymentSource==='all'||row.source===deploymentSource)&&`${row.name} ${row.date} ${row.sha||''}`.toLowerCase().includes(deploymentQuery.toLowerCase()));
  const pages=Math.max(1,Math.ceil(filtered.length/10));
  deploymentPage=Math.max(1,Math.min(deploymentPage,pages));
  const visible=filtered.slice((deploymentPage-1)*10,deploymentPage*10);
  return `<section id="deployments-list"><div class="section-heading"><h2>Recent deployments</h2>${btn(`${icon('plus')} Record deployment`,'new-record','small')}</div><p class="hint">Verified production runs on GitHub and deployments you record here, from newest to oldest.</p><div class="deployment-controls"><select id="deployment-source" class="select" aria-label="Deployment source"><option value="all" ${deploymentSource==='all'?'selected':''}>All sources</option><option value="github" ${deploymentSource==='github'?'selected':''}>GitHub · production</option><option value="local" ${deploymentSource==='local'?'selected':''}>My deployments</option></select><label class="search-field">${icon('search')}<input id="deployment-search" value="${e(deploymentQuery)}" placeholder="Search name, date, or commit" aria-label="Search deployments"></label></div><div class="table-wrap"><table class="data-table deployments-table"><thead><tr><th>Date</th><th>Deployment</th><th>Source</th><th>Size</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>${visible.map(row=>`<tr><td>${e(row.date)}</td><td><button type="button" class="deployment-name" data-action="view-deployment" data-id="${e(row.id)}">${e(row.name)}</button><small class="muted">${row.sha?e(row.sha.slice(0,8)):e(row.paymentId)} · ${row.fileCount} files</small></td><td><span class="badge">${row.source==='github'?'GitHub':'Local'}</span></td><td>${row.source==='local'?formatBytes(row.files.reduce((n,f)=>n+f.size,0)):'—'}</td><td>${row.amount===null?'—':money(row.amount)}<small class="muted">${row.amountKind==='valuation'?'Valuation':'Recorded payment'}</small></td><td>${deploymentStateBadge(row)}</td><td>${deploymentStartButton(row)}${row.source==='local'?`<button type="button" class="table-action" data-action="delete-payment" data-id="${e(row.paymentId)}" aria-label="Delete ${e(row.name)}">${icon('close')}</button>`:''}<button type="button" class="table-action" data-action="edit-deployment" data-id="${e(row.id)}" aria-label="Edit ${e(row.name)}">${icon('gear')}</button></td></tr>`).join('')||'<tr><td colspan="7" class="empty-search">No matching deployments found.</td></tr>'}</tbody></table></div><div class="deployment-pagination"><span class="muted">${filtered.length} records · Page ${deploymentPage} of ${pages}</span><div>${btn('Previous','deployment-page','small',`data-page="${deploymentPage-1}" ${deploymentPage===1?'disabled':''}`)} ${btn('Next','deployment-page','small',`data-page="${deploymentPage+1}" ${deploymentPage===pages?'disabled':''}`)}</div></div></section>`;
}
let overviewProductTab = 'copilot';

function renderOverview() {
  $('#main').className = 'overview-page';
  
  const tabContent = () => {
    if (overviewProductTab === 'copilot') {
      return `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;padding-top:8px;">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:13px;color:#c9d1d9;font-weight:600;">Copilot usage</span>
              <a href="#usage" style="font-size:11px;color:#58a6ff;text-decoration:none;">View details</a>
            </div>
            <strong style="font-size:24px;color:#c9d1d9;font-weight:600;display:block;margin:6px 0;">$0</strong>
            <p style="font-size:11px;color:#8b949e;margin:0;line-height:1.4;">Total gross spend on Copilot for the selected timeframe including licenses and AI credits.</p>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:13px;color:#c9d1d9;font-weight:600;">Additional usage <span style="color:#7d8590;font-size:12px;">ⓘ</span></span>
              <a href="#usage" style="font-size:11px;color:#58a6ff;text-decoration:none;">View details</a>
            </div>
            <strong style="font-size:24px;color:#c9d1d9;font-weight:600;display:block;margin:6px 0;">$0</strong>
            <p style="font-size:11px;color:#8b949e;margin:0;line-height:1.4;">Based on 0 additional AI credits beyond your included usage.</p>
          </div>
        </div>
      `;
    } else if (overviewProductTab === 'actions') {
      return `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;padding-top:8px;">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:13px;color:#c9d1d9;font-weight:600;">Actions gross metered usage</span>
              <a href="#usage" style="font-size:11px;color:#58a6ff;text-decoration:none;">View details</a>
            </div>
            <strong style="font-size:24px;color:#c9d1d9;font-weight:600;display:block;margin:6px 0;">$274.26</strong>
            <p style="font-size:11px;color:#8b949e;margin:0;line-height:1.4;">Included usage discount: -$9.26 · Net billed: $265.00</p>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:13px;color:#c9d1d9;font-weight:600;">Workflows & CI/CD Runs</span>
              <a href="#payment-history" style="font-size:11px;color:#58a6ff;text-decoration:none;">View payments</a>
            </div>
            <strong style="font-size:24px;color:#c9d1d9;font-weight:600;display:block;margin:6px 0;">1,842 runs</strong>
            <p style="font-size:11px;color:#8b949e;margin:0;line-height:1.4;">Latest run: CI/CD CrossBox #1842 (Nov 24, 2026)</p>
          </div>
        </div>
      `;
    } else if (overviewProductTab === 'codespaces') {
      return `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;padding-top:8px;">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:13px;color:#c9d1d9;font-weight:600;">Codespaces workstation hours</span>
              <a href="#codespaces" style="font-size:11px;color:#58a6ff;text-decoration:none;">View details</a>
            </div>
            <strong style="font-size:24px;color:#c9d1d9;font-weight:600;display:block;margin:6px 0;">$340.00</strong>
            <p style="font-size:11px;color:#8b949e;margin:0;line-height:1.4;">944.44 core-hours in Nov ($1,414.00 cumulative with Oct) @ $0.36/hr</p>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:13px;color:#c9d1d9;font-weight:600;">Configured workstations</span>
              <a href="#codespaces" style="font-size:11px;color:#58a6ff;text-decoration:none;">Open Codespaces</a>
            </div>
            <strong style="font-size:24px;color:#c9d1d9;font-weight:600;display:block;margin:6px 0;">2 active</strong>
            <p style="font-size:11px;color:#8b949e;margin:0;line-height:1.4;">lfarmas4/crossbox-app (main & pwr-games-release)</p>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;padding-top:8px;">
          <div>
            <span style="font-size:13px;color:#c9d1d9;font-weight:600;display:block;">Shared packages & asset storage</span>
            <strong style="font-size:24px;color:#c9d1d9;font-weight:600;display:block;margin:6px 0;">$135.00</strong>
            <p style="font-size:11px;color:#8b949e;margin:0;">$95.00 Packages storage + $40.00 Git LFS bandwidth (Nov 1 – Nov 24, 2026).</p>
          </div>
        </div>
      `;
    }
  };

  $('#main').innerHTML = `
    <div class="page-heading">
      <h1>Overview</h1>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:20px;">
      <div style="padding:16px 20px;background:#0d1117;border:1px solid #30363d;border-radius:6px;">
        <span style="font-size:12px;color:#c9d1d9;font-weight:600;display:block;">Current metered usage</span>
        <strong style="font-size:28px;color:#c9d1d9;font-weight:600;display:block;margin:6px 0;">$749.26</strong>
        <span style="font-size:11px;color:#8b949e;">Gross metered usage for November 1 - November 24, 2026 ($740.00 net).</span>
      </div>

      <div style="padding:16px 20px;background:#0d1117;border:1px solid #30363d;border-radius:6px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;color:#c9d1d9;font-weight:600;">Current included usage</span>
          <a href="#usage" style="font-size:11px;color:#58a6ff;text-decoration:none;">More details</a>
        </div>
        <strong style="font-size:28px;color:#c9d1d9;font-weight:600;display:block;margin:6px 0;">$9.26</strong>
        <span style="font-size:11px;color:#8b949e;">Included usage discounts for November 1 - November 24, 2026.</span>
      </div>

      <div style="padding:16px 20px;background:#0d1117;border:1px solid #30363d;border-radius:6px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;color:#c9d1d9;font-weight:600;">Next payment due</span>
          <a href="#payment-history" style="font-size:11px;color:#58a6ff;text-decoration:none;">Payment history</a>
        </div>
        <strong style="font-size:28px;color:#3fb950;font-weight:600;display:block;margin:6px 0;">$0.00</strong>
        <span style="font-size:11px;color:#8b949e;">$740.00 current cycle budget settled through Nov 24, 2026.</span>
      </div>
    </div>

    <div style="margin-top:20px;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:16px 20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:12px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <h2 style="font-size:14px;font-weight:600;color:#c9d1d9;margin:0;">Monthly spending limit & alerts</h2>
            <span style="background:#238636;color:#ffffff;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;">Alerts: On</span>
          </div>
          <p style="font-size:11px;color:#8b949e;margin:0;">Monthly limit set to <strong>$900.00 USD</strong>. Automatic email notifications at 75% ($675.00), 90% ($810.00), and preventive cap alert at 100% ($900.00).</p>
        </div>
        <div style="display:flex;gap:24px;align-items:baseline;">
          <div>
            <span style="font-size:11px;color:#8b949e;text-transform:uppercase;letter-spacing:0.5px;">Current month net</span>
            <strong style="display:block;font-size:22px;color:#c9d1d9;font-weight:600;">$740.00</strong>
            <small style="color:#8b949e;font-size:11px;">As of Nov 24</small>
          </div>
          <div>
            <span style="font-size:11px;color:#8b949e;text-transform:uppercase;letter-spacing:0.5px;">Projected net (Nov 30)</span>
            <strong style="display:block;font-size:22px;color:#c9d1d9;font-weight:600;">$865.00</strong>
            <small style="color:#8b949e;font-size:11px;">Month-end estimate</small>
          </div>
          <div>
            <span style="font-size:11px;color:#8b949e;text-transform:uppercase;letter-spacing:0.5px;">Set budget</span>
            <strong style="display:block;font-size:22px;color:#58a6ff;font-weight:600;">$900.00</strong>
            <small style="color:#8b949e;font-size:11px;"><a href="#budgets" style="color:#58a6ff;text-decoration:none;">Edit limit</a></small>
          </div>
        </div>
      </div>
      <div style="background:#21262d;height:8px;border-radius:4px;overflow:hidden;position:relative;margin:12px 0 6px 0;">
        <div style="background:#2ea043;height:100%;width:82.2%;position:absolute;left:0;top:0;" title="Actual usage: $740.00 (82.2%)"></div>
        <div style="background:#388bfd33;border-right:2px solid #58a6ff;height:100%;width:96.1%;position:absolute;left:0;top:0;" title="Projected by Nov 30: $865.00 (96.1%)"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#8b949e;">
        <span>Actual usage: <strong>$740.00</strong> (82.2%)</span>
        <span>Projected by month-end: <strong>$865.00</strong> (96.1% of budget)</span>
        <span style="color:#7ee787;">✓ Safe headroom ($160.00 available today before maximum cap)</span>
      </div>
    </div>

    <div style="margin-top:28px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h2 style="font-size:14px;font-weight:600;color:#c9d1d9;margin:0;">Subscriptions</h2>
        <a href="#payment-history" style="font-size:12px;color:#58a6ff;text-decoration:none;">Manage subscriptions</a>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;">
        <div style="padding:16px 20px;background:#0d1117;border:1px solid #30363d;border-radius:6px;">
          <span style="font-size:13px;color:#c9d1d9;font-weight:600;display:block;">GitHub Free</span>
          <div style="margin-top:6px;">
            <strong style="font-size:20px;color:#c9d1d9;font-weight:600;">$0.00</strong>
            <span style="font-size:12px;color:#8b949e;"> per month</span>
          </div>
        </div>
        <div style="padding:16px 20px;background:#0d1117;border:1px solid #30363d;border-radius:6px;">
          <span style="font-size:13px;color:#c9d1d9;font-weight:600;display:block;">Copilot Free</span>
          <div style="margin-top:6px;">
            <strong style="font-size:20px;color:#c9d1d9;font-weight:600;">$0.00</strong>
            <span style="font-size:12px;color:#8b949e;"> per month</span>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-top:28px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h2 style="font-size:14px;font-weight:600;color:#c9d1d9;margin:0;">Metered usage</h2>
        <div style="font-size:12px;background:#161b22;border:1px solid #30363d;padding:4px 10px;border-radius:6px;color:#c9d1d9;display:inline-flex;align-items:center;gap:4px;">
          Timeframe: Current month <span style="font-size:10px;">▾</span>
        </div>
      </div>

      <div style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:20px;">
        <h3 style="font-size:13px;color:#c9d1d9;font-weight:600;margin:0 0 16px 0;">Usage by products</h3>

        <div style="display:flex;gap:4px;border-bottom:1px solid #21262d;margin-bottom:20px;overflow-x:auto;">
          ${['copilot', 'actions', 'codespaces', 'security', 'lfs', 'models', 'packages', 'more'].map(tab => {
            const labels = {
              copilot: 'Copilot',
              actions: 'Actions',
              codespaces: 'Codespaces',
              security: 'Advanced Security',
              lfs: 'Git LFS',
              models: 'Models',
              packages: 'Packages',
              more: 'More ▾'
            };
            const active = overviewProductTab === tab;
            return `
              <button data-action="overview-tab" data-tab="${tab}" style="background:none;border:none;border-bottom:2px solid ${active ? '#f78166' : 'transparent'};padding:8px 12px;font-size:12px;font-weight:${active ? '600' : '400'};color:${active ? '#c9d1d9' : '#8b949e'};cursor:pointer;white-space:nowrap;">
                ${labels[tab]}
              </button>
            `;
          }).join('')}
        </div>

        <div id="overview-tab-container">
          ${tabContent()}
        </div>
      </div>
    </div>

    <div style="margin-top:32px;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div>
          <h3 style="font-size:14px;color:#c9d1d9;font-weight:600;margin:0 0 4px 0;">Consolidated monthly history · GitHub Payments</h3>
          <p style="margin:0;font-size:11px;color:#8b949e;">Billed and audited amounts corresponding to official receipts and invoices.</p>
        </div>
        <button class="btn small" data-action="paid-history" style="font-size:11px;">View 20 invoices</button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>CrossBox</th>
              <th>FitCode</th>
              <th>Total Billed</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>June 2026</td><td>$180.00</td><td>$89.00</td><td>$269.00</td></tr>
            <tr><td>July 2026</td><td>$180.00</td><td>$56.00</td><td>$236.00</td></tr>
            <tr><td>August 2026</td><td>$250.00</td><td>$3.00</td><td>$253.00</td></tr>
            <tr><td>September 2026</td><td>$3,409.13</td><td>—</td><td>$3,409.13</td></tr>
            <tr><td>October 2026</td><td>$3,691.28</td><td>—</td><td>$3,691.28</td></tr>
            <tr style="background:#161b22;"><td>November 2026 (Active · as of Nov 24)</td><td>$1,985.55</td><td>—</td><td>$1,985.55</td></tr>
          </tbody>
          <tfoot>
            <tr style="font-weight:600;">
              <td>Total Annual Accumulated</td>
              <td style="color:#c9d1d9;">$9,695.96</td>
              <td style="color:#c9d1d9;">$148.00</td>
              <td style="color:#c9d1d9;">$9,843.96</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
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

      <div class="budgets-count">${budgets.length} budgets</div>

      <div class="budget-card-list">
        ${budgets.map(b => {
          const limit = Number(b.limit) || 1;
          const spent = Number(b.spent) || 0;
          const pct = Math.min(100, Math.round((spent / limit) * 100));
          const barColor = b.product === 'Codespaces' ? '#388bfd' : b.product === 'Actions' ? '#2ea043' : b.product === 'Packages' ? '#d29922' : b.product.includes('AI') ? '#a371f7' : '#58a6ff';
          return `
          <div class="budget-card-item">
            <div>
              <div class="budget-item-scope">${e(b.scope || 'Account')}</div>
              <div class="budget-item-name">${icon('globe')} ${e(profile.username || 'lfarmas4')} · ${e(b.product)}</div>
            </div>
            <div class="budget-item-spent">${money(spent)} / ${money(limit)} spent</div>
            <div class="budget-item-progress-wrap">
              <div class="budget-item-bar" style="background:#21262d;height:6px;border-radius:3px;overflow:hidden;position:relative;">
                <div class="budget-item-fill" style="width:${pct}%;height:100%;background:${barColor};border-radius:3px;"></div>
              </div>
              <span class="budget-item-percent" style="color:#c9d1d9;font-weight:600;">${pct}%</span>
            </div>
            <div><button class="bare-icon" style="color:var(--muted);" aria-label="Options">···</button></div>
          </div>`;
        }).join('')}
      </div>

      <div class="budget-pagination">1-${budgets.length} of ${budgets.length}</div>
    </div>
  `;
}
function openBudgetCheckout() {
  if(deploymentBusy||recordMutationBusy)return;
  const summary=getBillingSummary(billingState,payments);
  if(summary.amountDue<=0) { toast('The monthly balance is already settled.'); return; }
  const invoiceFile=new File([JSON.stringify({period:summary.period,invoiceId:summary.invoiceId,usage:summary.totalUsage,credit:summary.openingCredit,paid:summary.totalPaid,amount:summary.amountDue},null,2)],`usage-${summary.period}.json`,{type:'application/json'});
  checkout={mode:'budget',invoice:summary,quote:{total:summary.amountDue,bytes:invoiceFile.size,count:1},files:[{name:invoiceFile.name,size:invoiceFile.size,blob:invoiceFile}],processing:false,locked:false,cancelled:false};
  modal('Settle monthly balance',checkoutReviewHtml({quote:checkout.quote,files:[],profile,date:today(),mode:'budget',invoice:summary}),760);
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
  modal('Delete record',`<div class="modal-body"><h3>${e(record.name)}</h3><p>This record will be removed from your lists, totals, and budget payments as applicable.</p><p class="hint">Attached files are preserved and you can restore it from the trash.</p><div class="checkout-line"><span>${e(record.date)}</span><strong>${money(record.amount)}</strong></div><div class="form-actions">${btn('Cancel','close-modal')}${btn('Delete record','confirm-delete-payment','danger',`data-id="${e(id)}"`)}</div></div>`);
}
async function deletePayment(id) {
  if(recordMutationBusy||deploymentBusy)return;
  const record=findRecord(id); if(!record||record.deletedAt)return;
  recordMutationBusy=true;
  try {
    modal('Deleting record',deleteProcessingHtml(record.name));
    await delayFlow(650);
    const next=softDeletePayment(payments,id); write('payments',next); payments=next;
    recordMutationBusy=false; closeModal(); render();
    clearTimeout(toastTimer); $('#toast').innerHTML=`Record deleted. <button type="button" data-action="restore-payment" data-id="${e(id)}">Restore</button>`; $('#toast').classList.add('show'); toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),7000);
  } catch(error) { recordMutationBusy=false; closeModal(); toast(error.message); }
}
function showTrash() {
  const records=payments.filter(p=>p.deletedAt).sort((a,b)=>b.deletedAt.localeCompare(a.deletedAt));
  modal('Record trash',`<div class="modal-body"><p class="hint">Restoring preserves the payment, its status, and original files.</p>${records.map(p=>`<div class="file-row"><div class="file-info"><strong>${e(p.name)}</strong><small>${e(p.date)} · ${money(p.amount)}</small></div>${btn('Restore','restore-payment','small',`data-id="${e(p.id)}"`)}</div>`).join('')||'<p>No deleted records.</p>'}</div>`,true);
}
function openResetScenario(kind) {
  const budget=kind==='budget';
  const ids=activePayments(payments).filter(p=>budget?p.purpose==='budget'&&p.invoiceId===billingState.invoiceId:isExamplePayment(p)).map(p=>p.id);
  modal(budget?'Reset budget':'Reset examples',`<div class="modal-body"><p>${budget?'The budget will reset to $300, base usage to $260, and opening credit to $130.':'Payments for atr-sistem and PWR Games will be removed so you can upload the ZIP archives again.'}</p><p class="hint">${ids.length} records will move to the trash. Your other payments will not be modified.</p><div class="form-actions">${btn('Cancel','close-modal')}${btn('Reset','confirm-reset','danger',`data-kind="${kind}"`)}</div></div>`);
}
async function resetScenario(kind) {
  if(recordMutationBusy||deploymentBusy)return;
  recordMutationBusy=true;
  try {
    modal('Resetting scenario',deleteProcessingHtml(kind==='budget'?'Monthly budget':'Sample updates'));
    await delayFlow(700);
    let next=payments;
    const ids=activePayments(payments).filter(p=>kind==='budget'?p.purpose==='budget'&&p.invoiceId===billingState.invoiceId:isExamplePayment(p)).map(p=>p.id);
    for(const id of ids)next=softDeletePayment(next,id);
    write('payments',next); payments=next;
    if(kind==='budget') { const nextBilling=resetBillingState(billingState); write('billing',nextBilling); billingState=nextBilling; showBudgetNotice=true; }
    selectedFiles=[]; recordMutationBusy=false; closeModal(); render(); toast('Scenario ready to test again.');
  } catch(error) { recordMutationBusy=false; closeModal(); toast(error.message); }
}
async function loadDeploymentFile(file) {
  if(file.key) { const blob=await loadBlob(file.key); if(!blob)throw new Error(`File ${file.name} was not found.`); return blob; }
  const known=demoBundles.flatMap(bundle=>bundle.files).find(item=>item.source===file.source&&item.name===file.name);
  if(!known)throw new Error('Source file is unavailable.');
  const response=await fetch(known.source); if(!response.ok)throw new Error('Could not read the deployment file.');
  return response.blob();
}
function viewDeployment(id) {
  const row=deploymentRows().find(item=>item.id===id); if(!row)return;
  if(row.source==='local') { viewPayment(findRecord(row.paymentId)); return; }
  modal('Deployment details',`<div class="modal-body"><h3>${e(row.name)}</h3><div class="checkout-line"><span class="muted">Date in your workspace</span><span>${row.date}</span></div><div class="checkout-line"><span class="muted">Source</span><span>GitHub · production</span></div><div class="checkout-line"><span class="muted">Status</span>${statusBadge(row.status)}</div><div class="checkout-line"><span class="muted">Assigned valuation</span><strong>${row.amount===null?'—':money(row.amount)}</strong></div><div class="info-callout" style="word-break:break-all">Commit: ${e(row.sha)}<br>Production confirmed: ${e(row.createdAt)}</div><p class="hint">Valuation is proportional to commit weight. The source deployment retains its original data on GitHub.</p><div class="form-actions">${btn('Edit record','edit-deployment','',`data-id="${e(row.id)}"`)}<a class="btn primary" href="${e(row.runUrl)}" target="_blank" rel="noopener noreferrer">View on GitHub</a></div></div>`);
}
function openDeploymentEdit(id) {
  const row=deploymentRows().find(item=>item.id===id); if(!row)return;
  const statuses=row.source==='github'?[['deployed','Deployed'],['pending','Pending'],['failed','Failed']]:[['success','Paid'],['pending','Pending'],['failed','Failed']];
  modal('Edit deployment',`<form id="deployment-edit-form" class="modal-body"><input type="hidden" name="id" value="${e(row.id)}"><div class="form-grid"><label class="field full">Deployment name<input name="name" value="${e(row.name)}" maxlength="100" required></label><label class="field">Deployment date<input name="date" type="date" value="${e(row.date)}" required></label><label class="field">${row.source==='github'?'Valuation':'Amount paid'} (USD)<input name="amount" type="number" min="0" max="1000000" step="0.01" value="${row.amount??0}" required></label><label class="field full">${row.source==='local'?'Payment status':'Deployment status'}<select name="status">${statuses.map(([value,label])=>`<option value="${value}" ${value===row.status?'selected':''}>${label}</option>`).join('')}</select></label></div><p class="hint">${row.source==='github'?'These changes are saved in your workspace; the GitHub record is not modified.':'Changes are reflected in Overview, Usage, and Payment history. Your attached files are preserved.'}</p><div class="form-error" role="alert"></div><div class="form-actions">${btn('Cancel','close-modal')}<button class="btn primary" type="submit">Save changes</button></div></form>`);
}
function renderDeployments() {
  const q = calculateQuote(selectedFiles,config);
  $('#main').className = 'deploy-page';
  $('#main').innerHTML = `${heading('Deployments',btn(`${icon('clock')} History`,'show-deployments','small' ))}<p class="page-description">Upload your next project. Measure its size and calculate its deployment cost.</p><section class="upload-card"><div class="card-header"><strong>${icon('repo')} New deployment</strong><span class="badge">App or feature</span></div><div class="drop-zone" id="drop-zone">${icon('upload')}<strong>Drag and drop your project files here</strong><p>A complete application or a feature you just finished.</p><span class="btn">Select files</span><input class="file-picker" id="deploy-files" type="file" multiple aria-label="Select files to value"></div>${selectedFiles.length ? `<div class="files-list">${fileRows(selectedFiles,'selected')}</div>` : ''}<div class="upload-foot"><span>${icon('lock')} Your files stay in this browser</span><span>Up to 100 MB per file</span></div><div class="quote-bar"><div class="quote-metric"><span>Files</span><strong>${q.count.toString().padStart(2,'0')}</strong></div><div class="quote-metric"><span>Total size</span><strong>${formatBytes(q.bytes)}</strong></div><div class="quote-total"><span>Deployment cost</span><strong>${money(q.total)} <span style="display:inline;font-size:10px">USD</span></strong></div>${btn('Confirm payment','checkout','primary',selectedFiles.length&&!fileReading?'':'disabled')}</div></section><div class="section-heading"><h2>Try with a sample project</h2><div>${btn('Reset examples','reset-examples','small')} <span class="subtle-link">Download, drag, and compare</span></div></div><div class="example-grid">${demoBundles.map(bundle=>{const quote=calculateQuote(bundle.files,config);return `<article class="example-card"><div class="example-top">${icon(bundle.icon)}<h3>${e(bundle.name)}</h3><span class="badge">${bundle.kind}</span></div><p>${e(bundle.description)}</p><div class="example-data"><span class="muted">${formatBytes(quote.bytes)}</span><strong>${money(quote.total)}</strong></div><div class="language"><span class="language-dot" style="background:${bundle.color}"></span>${bundle.language}</div><div class="example-actions">${btn('Use example','use-example','small',`data-id="${bundle.id}"`)}<a class="btn small" href="${bundle.files[0].source}" download aria-label="Download ${e(bundle.files[0].name)}">${icon('download')}</a></div></article>`;}).join('')}</div><div class="activity-panel">${deploymentActivityMarkup()}</div><footer class="page-footer"><span>© 2026 CodeWeight</span><a href="#organizations">Organizations</a><a href="#usage">Usage</a><a href="#payment-history">Payment history</a></footer>`;
  $('#main .page-description').insertAdjacentHTML('afterend',`<div class="project-valuation-strip"><img src="assets/crossbox-logo.png" alt="CrossBox"><div><strong>CrossBox</strong><span>Current value · ${localMoney(portfolioSummary.crossbox.latestUsd)}</span></div><a href="#valuation">View history ${icon('chevron')}</a></div>`);
  const drop = $('#drop-zone');
  if(fileReading && fileAnalysisState) { drop.innerHTML=fileAnalysisHtml(fileAnalysisState); drop.classList.add('analyzing'); }
  ['dragenter','dragover'].forEach(type=>drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add('dragover');}));
  ['dragleave','drop'].forEach(type=>drop.addEventListener(type,event=>{event.preventDefault();drop.classList.remove('dragover');}));
  drop.addEventListener('drop',event=>addSelected(Array.from(event.dataTransfer.files)));
}
function validateFiles(files) {
  if (files.length > 100) throw new Error('Select a maximum of 100 files.');
  if (files.some(f=>!Number.isSafeInteger(f.size)||f.size<0||f.size>100_000_000)) throw new Error('Each file must be up to 100 MB.');
  if (files.reduce((s,f)=>s+f.size,0)>250_000_000) throw new Error('Total maximum size is 250 MB.');
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
      toast('File analyzed. Price calculated.');
    } catch(error) { toast(error.message); }
    finally { fileReading=false; fileAnalysisState=null; if(activePage==='deployments')renderDeployments(); }
  };
  uploadQueue=uploadQueue.then(operation,operation);
  return uploadQueue;
}
function modal(title, body, wide = false) {
  closePopover(); const dialog=$('#modal'); dialog.style.width=typeof wide==='number'?`min(${wide}px, calc(100vw - 30px))`:wide?'min(560px, calc(100vw - 30px))':'';
  $('#modal-content').innerHTML = `<div class="modal-header"><h2>${title}</h2><button class="bare-icon" data-action="close-modal" aria-label="Close">${icon('close')}</button></div>${body}`;
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
  modal('Record deployment and payment',`<form id="record-form" class="modal-body"><p class="record-prompt">${icon('calendar')} A single record for Usage and Payment history.</p><div class="form-grid"><label class="field full">Deployment name<input name="name" placeholder="e.g. Authentication feature" required maxlength="100"></label><label class="field">Deployment and payment date<input type="date" name="date" value="${today()}" required></label><label class="field">Amount paid (USD)<input name="amount" type="number" min="0" max="1000000" step="0.01" placeholder="0.00" required></label><label class="field">Type<select name="kind"><option>Feature</option><option>App</option></select></label><label class="field">Payment method<select name="method"><option>MasterCard ending in 2791</option><option>Visa ending in 4242</option><option>Bank transfer</option><option>PayPal</option><option>Cash</option></select></label><label class="field full">Reference (optional)<input name="reference" maxlength="40" placeholder="e.g. Wire #001234"></label><div class="field full"><span>Deployment files</span><div class="file-upload-small"><input id="record-files" type="file" multiple aria-label="Attach payment files"><div class="hint">Or add an already available sample file:</div><select id="record-example" class="select"><option value="">Select example…</option>${demoBundles.map(b=>`<option value="${b.id}">${e(b.name)} · ${formatBytes(b.files[0].size)}</option>`).join('')}</select></div><div id="record-attachments"></div><small>Files are stored in this browser with the selected date.</small></div></div><div class="form-error" id="record-error" role="alert"></div><div class="form-actions">${btn('Cancel','close-modal')}<button class="btn primary" type="submit">Save record</button></div></form>`,true);
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
  if (!validDate(values.date) || !values.name.trim() || values.name.length>100 || !Number.isFinite(amount)||amount<0||amount>1_000_000) throw new Error('Check the name, date, and amount.');
  if (!files.length) throw new Error('Attach at least one file or select an example.');
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
  modal('Confirm payment',checkoutReviewHtml({quote:checkout.quote,files:checkout.files,profile,date:today()}),760);
}
const delayFlow = milliseconds => new Promise(resolve=>setTimeout(resolve,milliseconds));
async function confirmPayment(values) {
  const operation=checkout;
  if(!operation||operation.processing)return;
  const card=validatePaymentFields(values);
  const budgetPayment=operation.mode==='budget';
  if(budgetPayment) {
    const current=getBillingSummary(billingState,payments);
    if(current.invoiceId!==operation.invoice.invoiceId||current.amountDue!==operation.quote.total)throw new Error('The balance has changed. Review the budget before confirming.');
  }
  const safeValues=budgetPayment?
    {name:`Monthly usage · ${operation.invoice.period}`,date:today(),kind:'Billing',method:card.method,amount:operation.quote.total,purpose:'budget',invoiceId:operation.invoice.invoiceId,period:operation.invoice.period}:
    {name:values.name,date:values.date,kind:values.kind,method:card.method,amount:operation.quote.total,deploymentStatus:'ready',scenarioKeys:(operation.quote.projectCharges||[]).map(item=>item.pricingKey)};
  operation.processing=true;
  const active=()=>checkout===operation&&!operation.cancelled&&$('#modal').open;
  try {
    for(const [stage,duration] of [['checking',850],['processing',1350]]) {
      modal('Confirming your payment',processingHtml({stage,quote:operation.quote,name:safeValues.name,mode:operation.mode}),760);
      await delayFlow(duration);
      if(!active())return;
    }
    operation.locked=true;
    modal('Confirming your payment',processingHtml({stage:'processing',quote:operation.quote,name:safeValues.name,mode:operation.mode}),760);
    const record=await createRecord(safeValues,operation.files);
    if(!budgetPayment)selectedFiles=[]; usageMonth=record.date.slice(0,7); deploymentPage=1;
    modal('Payment processed',processingHtml({stage:'confirmed',quote:operation.quote,name:record.name,mode:operation.mode}),760);
    await delayFlow(950);
    modal('Preparing your deployment',processingHtml({stage:'preparing',quote:operation.quote,name:record.name,mode:operation.mode}),760);
    await delayFlow(950);
    checkout=null; render(); paymentSuccess(record);
  } catch(error) {
    operation.locked=false;
    if(checkout===operation) {
      checkout=null;
      modal('Could not complete payment',`<div class="modal-body"><p class="form-error">${e(error.message)}</p><div class="form-actions">${btn('Return to payment','checkout','primary')}${btn('Close','close-modal')}</div></div>`);
    }
  } finally { operation.processing=false; }
}
function paymentSuccess(record) { modal('Payment confirmed',paymentReadyHtml(record),760); }
async function beginDeployment(id) {
  if(deploymentBusy)return;
  const record=findRecord(id); if(!record)throw new Error('Deployment not found.');
  if(record.deletedAt||record.purpose==='budget')throw new Error('This record does not correspond to an active deployment.');
  if((record.status??'success')!=='success')throw new Error('Confirm payment for this deployment first.');
  if((record.deploymentStatus??'deployed')==='deployed') { modal('Deployment complete',deploymentCompleteHtml(record),760); return; }
  deploymentBusy=true;
  try {
    if(record.deploymentStatus!=='deploying') {
      const next=setDeploymentState(payments,id,'deploying'); write('payments',next); payments=next;
    }
    render();
    modal('Running suite',deploymentProcessingHtml(findRecord(id),'suite',[]),760);
    await delayFlow(450);
    const checks=await runDeploymentChecks(findRecord(id),{loadFile:loadDeploymentFile});
    for(let i=0;i<checks.length;i++) {
      const visible=checks.map((check,index)=>({...check,passed:index<=i?check.passed:undefined}));
      modal('Running suite',deploymentProcessingHtml(findRecord(id),'suite',visible),760);
      await delayFlow(420);
    }
    const checkedRecord={...findRecord(id),validation:{checks,checkedAt:new Date().toISOString()}};
    const checkedPayments=payments.map(payment=>payment.id===id?checkedRecord:payment); write('payments',checkedPayments); payments=checkedPayments;
    for(const [stage,duration] of [['uploading',900],['building',1300],['publishing',1000]]) {
      modal('Deploying your update',deploymentProcessingHtml(findRecord(id),stage),760);
      await delayFlow(duration);
    }
    const next=setDeploymentState(payments,id,'deployed'); write('payments',next); payments=next;
    deploymentBusy=false; render(); modal('Deployment complete',deploymentCompleteHtml(findRecord(id)),760);
  } catch(error) {
    try { if(findRecord(id)?.deploymentStatus==='deploying') { const next=setDeploymentState(payments,id,'failed'); write('payments',next); payments=next; } } catch {}
    deploymentBusy=false; render();
    modal('Could not complete deployment',`<div class="modal-body"><p class="form-error">${e(error.message)}</p><div class="form-actions">${btn('Retry','deploy-now','primary',`data-id="${e(id)}"`)}</div></div>`);
  }
}

function openReceiptGenerator(record) {
  if (!record) return;
  modal('Official Receipt (GitHub)', receiptModalHtml(record, profile, activePayments(payments)), 820);
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
    if (pctEl) pctEl.textContent = `${pct}% used`;
    if (remEl) remEl.textContent = `Remaining: $${rem.toFixed(2)} USD`;
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

  const actionsBudget = budgets.find(b => b.product === 'Actions');
  if (actionsBudget) {
    sel.value = actionsBudget.id;
    inLimit.value = actionsBudget.limit > 0 ? actionsBudget.limit.toFixed(2) : '320.00';
    inSpent.value = actionsBudget.spent > 0 ? actionsBudget.spent.toFixed(2) : '265.00';
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
      toast(`Budget ${budgets[idx].product} updated: $${budgets[idx].spent.toFixed(2)} spent of $${budgets[idx].limit.toFixed(2)} USD.`);
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
  modal('Official Invoice (GitHub Invoice)', invoiceModalHtml(record, profile, activePayments(payments)), 840);
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
  if (file.key) { const blob=await loadBlob(file.key); if (!blob) throw new Error('File is not available in this browser.'); downloadBlob(blob,file.name); }
  else { const known=demoBundles.flatMap(b=>b.files).find(f=>f.source===file.source); if (!known) throw new Error('File unavailable.'); const a=document.createElement('a'); a.href=known.source; a.download=known.name; a.click(); }
}
function viewPayment(record) {
  if (!record) return;
  modal('Payment details',`<div class="modal-body"><h3>${e(record.name)}</h3><div class="checkout-line"><span class="muted">ID</span><span>${e(record.id)}</span></div><div class="checkout-line"><span class="muted">GitHub SKU</span><span class="mono" style="font-weight:600;color:#58a6ff;">${e(record.sku || 'actions_linux')}</span></div>${record.quantity ? `<div class="checkout-line"><span class="muted">Metric / Usage</span><strong style="color:#7ee787;">${e(record.quantity)}</strong> (@ ${e(record.rateStr || `$${record.rate}`)})</div>` : ''}<div class="checkout-line"><span class="muted">Deployment & payment date</span><span>${e(record.date)}</span></div><div class="checkout-line"><span class="muted">Payment method</span><span>${e(record.method)}</span></div><div class="checkout-line"><span class="muted">Amount</span><strong>${money(record.amount)}</strong></div>${record.reference?`<div class="checkout-line"><span class="muted">Reference</span><span>${e(record.reference)}</span></div>`:''}<h3 style="margin-top:23px">Deployment files</h3>${record.files.map((f,i)=>`<div class="file-row">${icon('file')}<div class="file-info"><span class="file-name">${e(f.name)}</span><small>${formatBytes(f.size)} · ${f.size.toLocaleString('en-US')} bytes</small></div><button class="table-action" data-action="download-file" data-id="${e(record.id)}" data-index="${i}" aria-label="Download ${e(f.name)}">${icon('download')}</button></div>`).join('')}<div class="form-actions" style="display:flex;gap:8px;flex-wrap:wrap;">${btn('Download receipt','download-receipt','',`data-id="${e(record.id)}"`)} ${btn('View receipt','open-receipt-generator','',`data-id="${e(record.id)}"`)} ${btn('Download invoice','download-invoice','primary',`data-id="${e(record.id)}"`)} ${btn('View invoice (modal)','view-invoice-modal','',`data-id="${e(record.id)}"`)}</div></div>`);
  const actions=`<div class="payment-detail-actions">${record.purpose!=='budget'&&(record.status??'success')==='success'&&record.deploymentStatus&&record.deploymentStatus!=='deployed'?btn('Deploy now','deploy-now','primary',`data-id="${e(record.id)}"`):''}${!record.deletedAt?btn('Delete record','delete-payment','danger',`data-id="${e(record.id)}"`):''}</div>`;
  $('#modal-content .modal-body').insertAdjacentHTML('beforeend',actions);
}
function openRates() {
  modal('Valuation preferences',`<form id="rates-form" class="modal-body"><p class="internal-note">Internal workspace settings. Amounts are recalculated when saved.</p><div class="form-grid">${[['base','Base charge (USD)'],['perMB','Price per MB (USD)'],['includedMB','Included MB'],['minimum','Minimum amount (USD)'],['atrPrice','atr-sistem rate (USD)'],['pwrPrice','PWR Games rate (USD)']].map(([key,label])=>`<label class="field">${label}<input name="${key}" type="number" min="0" max="1000000" step="any" value="${config[key]??defaultConfig[key]}" required></label>`).join('')}</div><div class="info-callout">Total = maximum between minimum amount and base charge + billable MB × price per MB. 1 MB = 1,000,000 bytes.</div><div id="rates-error" class="form-error"></div><div class="form-actions">${btn('Cancel','close-modal')}<button type="submit" class="btn primary">Save configuration</button></div></form>`);
}
function closePopover() { $('.popover')?.remove(); }
function popover(anchor,content) {
  closePopover(); const element=document.createElement('div'); element.className='popover'; element.innerHTML=content; document.body.append(element);
  const rect=anchor.getBoundingClientRect(); element.style.top=`${rect.bottom+7}px`; element.style.left=`${Math.max(8,Math.min(rect.right-element.offsetWidth,innerWidth-element.offsetWidth-8))}px`;
}
function renderCodespaces() {
  $('#main').className = 'codespaces-page';

  $('#main').innerHTML = `
    <div class="page-heading">
      <h1>Codespaces</h1>
      <button class="btn primary small" onclick="window.open('https://github.com/lfarmas4/crossbox-app','_blank')">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"></path></svg>
        New codespace
      </button>
    </div>
    <p class="page-description">Cloud-powered development environments for your repositories and workstations.</p>

    <div style="margin-top:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h2 style="font-size:14px;font-weight:600;color:#c9d1d9;margin:0;">Active & Recent Codespaces</h2>
        <span style="font-size:12px;color:#8b949e;">2 workstations configured</span>
      </div>

      <div style="background:#0d1117;border:1px solid #30363d;border-radius:6px;overflow:hidden;">
        <div style="padding:16px;border-bottom:1px solid #21262d;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:36px;height:36px;background:#161b22;border:1px solid #30363d;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#58a6ff;">
              <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M2 3.75C2 2.784 2.784 2 3.75 2h8.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5Zm1.75-.25a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25h-8.5Z"></path><path d="m5 5.5 2.5 2.5L5 10.5M8.5 10.5h3"></path></svg>
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <a href="https://github.com/lfarmas4/crossbox-app" target="_blank" rel="noopener noreferrer" style="font-weight:600;font-size:13px;color:#58a6ff;text-decoration:none;">lfarmas4/crossbox-app</a>
                <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;background:#23863626;color:#3fb950;border:1px solid #23863640;padding:1px 6px;border-radius:10px;font-weight:600;">
                  <span style="width:6px;height:6px;border-radius:50%;background:#3fb950;"></span> Available
                </span>
              </div>
              <div style="font-size:12px;color:#8b949e;margin-top:4px;">
                Branch: <strong style="color:#c9d1d9;">main</strong> · Commit: <span style="color:#58a6ff;background:#161b22;padding:1px 4px;border-radius:3px;">9d86f34a</span> · 4-Core · 16 GB RAM · 64 GB Storage
              </div>
              <div style="font-size:11px;color:#7d8590;margin-top:2px;">
                Last active: Today (Nov 24, 2026) · Region: US East · Retention: 30 days
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <a href="https://github.com/lfarmas4/crossbox-app" target="_blank" rel="noopener noreferrer" class="btn small" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;padding:5px 12px;color:#c9d1d9;text-decoration:none;">
              Open in VS Code
            </a>
          </div>
        </div>

        <div style="padding:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;background:#0d1117;">
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:36px;height:36px;background:#161b22;border:1px solid #30363d;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#8b949e;">
              <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M2 3.75C2 2.784 2.784 2 3.75 2h8.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5Zm1.75-.25a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25h-8.5Z"></path><path d="m5 5.5 2.5 2.5L5 10.5M8.5 10.5h3"></path></svg>
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <a href="https://github.com/lfarmas4/crossbox-app" target="_blank" rel="noopener noreferrer" style="font-weight:600;font-size:13px;color:#58a6ff;text-decoration:none;">lfarmas4/crossbox-app</a>
                <span style="font-size:11px;background:#30363d;color:#8b949e;padding:1px 6px;border-radius:10px;font-weight:500;">
                  Stopped
                </span>
              </div>
              <div style="font-size:12px;color:#8b949e;margin-top:4px;">
                Branch: <strong style="color:#c9d1d9;">codex/pwr-games-release</strong> · Commit: <span style="color:#58a6ff;background:#161b22;padding:1px 4px;border-radius:3px;">3f3cb39a</span> · 4-Core Workstation Hours
              </div>
              <div style="font-size:11px;color:#7d8590;margin-top:2px;">
                Last active: Oct 28, 2026 · Auto-prune in 14 days
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <button class="btn small" onclick="alert('Starting recovery codespace...')">Restart</button>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-top:28px;background:#161b22;border:1px solid #30363d;border-radius:6px;padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <div>
          <h2 style="font-size:14px;font-weight:600;color:#c9d1d9;margin:0 0 4px 0;">Codespaces usage and linked billing</h2>
          <p style="margin:0;font-size:12px;color:#8b949e;">Official record of invoices and receipts associated with cloud compute hours for CrossBox.</p>
        </div>
        <button class="btn small" data-action="paid-history" style="font-size:11px;">
          View in GitHub Payments
        </button>
      </div>

      <div style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:16px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;align-items:center;">
          <div>
            <span style="font-size:11px;color:#8b949e;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;display:block;margin-bottom:4px;">Total billed for Codespaces</span>
            <strong style="font-size:22px;color:#c9d1d9;font-weight:600;">$1,414.00</strong>
            <span style="font-size:11px;color:#7d8590;display:block;margin-top:2px;">Verified payments ($1,074.00 Oct + $340.00 Nov) · MasterCard •• 2791 &amp; Amex •• 1989</span>
          </div>
          <div>
            <span style="font-size:11px;color:#8b949e;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;display:block;margin-bottom:4px;">Compute consumed</span>
            <strong style="font-size:18px;color:#c9d1d9;font-weight:600;">3,927.78 core-hours</strong>
            <span style="font-size:11px;color:#7d8590;display:block;margin-top:2px;">Official rate: $0.36 / hour (4-Core · 944.44 hrs Nov MTD)</span>
          </div>
          <div>
            <span style="font-size:11px;color:#8b949e;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;display:block;margin-bottom:4px;">Invoice &amp; Receipt</span>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
              <button class="btn small primary" data-action="view-invoice-modal" data-id="8B64D12E" style="font-size:11px;padding:4px 10px;">
                View Invoice #INV-8B64D12E ($340.00)
              </button>
              <button class="btn small" data-action="open-receipt-generator" data-id="8B64D12E" style="font-size:11px;padding:4px 10px;">
                View Receipt #8B64D12E
              </button>
              <button class="btn small" data-action="view-invoice-modal" data-id="1074APPL" style="font-size:11px;padding:4px 10px;">
                View Invoice #INV-1074APPL ($1,074.00)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-top:28px;">
      <h2 style="font-size:14px;font-weight:600;color:#c9d1d9;margin:0 0 16px 0;">Codespaces Preferences</h2>
      
      <div style="background:#0d1117;border:1px solid #30363d;border-radius:6px;overflow:hidden;">
        <div style="padding:16px;border-bottom:1px solid #21262d;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong style="font-size:13px;color:#c9d1d9;display:block;">Default editor</strong>
            <span style="font-size:12px;color:#8b949e;">Choose your preferred editor when opening codespaces.</span>
          </div>
          <select style="background:#161b22;border:1px solid #30363d;color:#c9d1d9;padding:5px 10px;border-radius:6px;font-size:12px;">
            <option selected>Visual Studio Code (Web)</option>
            <option>Visual Studio Code (Desktop)</option>
            <option>Cursor</option>
            <option>JetBrains Gateway</option>
          </select>
        </div>

        <div style="padding:16px;border-bottom:1px solid #21262d;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong style="font-size:13px;color:#c9d1d9;display:block;">Default idle timeout</strong>
            <span style="font-size:12px;color:#8b949e;">Codespaces will automatically stop after this duration of inactivity.</span>
          </div>
          <select style="background:#161b22;border:1px solid #30363d;color:#c9d1d9;padding:5px 10px;border-radius:6px;font-size:12px;">
            <option selected>30 minutes</option>
            <option>60 minutes</option>
            <option>120 minutes</option>
          </select>
        </div>

        <div style="padding:16px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong style="font-size:13px;color:#c9d1d9;display:block;">Default retention period</strong>
            <span style="font-size:12px;color:#8b949e;">Stopped codespaces are automatically deleted after this time.</span>
          </div>
          <select style="background:#161b22;border:1px solid #30363d;color:#c9d1d9;padding:5px 10px;border-radius:6px;font-size:12px;">
            <option selected>30 days</option>
            <option>60 days</option>
            <option>90 days</option>
          </select>
        </div>
      </div>
    </div>
  `;
}


const COST_DATA = {"summary": {"project": "crossbox-668a3", "window": "Accumulated history (as of 2026-11-24)", "rate": 0.004245, "totalSeconds": 2283980, "totalUsd": 9695.96, "cat": {"platform": {"seconds": 1995615, "usd": 5220.0}, "gyms": {"seconds": 177258, "usd": 2540.0}, "events": {"seconds": 88567, "usd": 1545.96}, "ironmeet": {"seconds": 18400, "usd": 235.0}, "stores": {"seconds": 4140, "usd": 155.0}}, "topPlatform": [["setauthclaims", 1995615], ["invalidateusercache", 130452], ["api", 7078], ["seorender", 4908], ["processpendingemails", 4545]], "setAuthClaims": {"seconds": 1995615, "calls": 1812, "usd": 4590.0}, "firestore": {"reads": 2518420, "writes": 124850, "deletes": 2048}}, "events": [{"id": "pwr-games-hyrox-2026-5ceba", "name": "PWR GAMES 2026 — HYROX", "type": "Live", "date": "2026-11-21", "organizer": "tandem-armenia", "confirmed": 96, "actions": 348, "seconds": 12485, "usd": 1513.0}, {"id": "pwr-games-ensayo-hyrox-2026-10-31", "name": "PWR Games · HYROX Halloween Edition — Oct 31, 2026", "type": "Rehearsal / training", "date": "2026-10-31", "organizer": "—", "confirmed": 28, "actions": 59, "seconds": 2236, "usd": 1040.0}, {"id": "hyrox-solidario-2026", "name": "HYROX Charity Event for Danny & Ale Siguenza", "type": "Live", "date": "2026-10-24", "organizer": "tandem-armenia", "confirmed": 31, "actions": 55, "seconds": 2211, "usd": 1074.0}, {"id": "pwr-games-capacitacion-jueces-2026-11-08", "name": "PWR Games · Judge Training — Sunday, Nov 8", "type": "Rehearsal / training", "date": "2026-11-08", "organizer": "tandem-armenia", "confirmed": 42, "actions": 48, "seconds": 2479, "usd": 620.0}, {"id": "pwr-games-capacitacion-jueces-2026-11-07", "name": "PWR Games · Judge Training — TEST", "type": "Test", "date": "2026-11-07", "organizer": "tandem-armenia", "confirmed": 28, "actions": 10, "seconds": 977, "usd": 270.0}, {"id": "simulacro-pwr-prueba-aiumf", "name": "PWR Simulation (test)", "type": "Test", "date": "2026-10-30", "organizer": "—", "confirmed": 9, "actions": 0, "seconds": 231, "usd": 165.0}, {"id": "SPfwn1IaNbDhkJ6j7EYR", "name": "Last Round 2026", "type": "Live", "date": "2026-12-12", "organizer": "hangar-cross", "confirmed": 15, "actions": 39, "seconds": 1640, "usd": 605.0}, {"id": "NjccMcBAHBNOGpC16Hpj", "name": "HYROX CHARITY PARTY", "type": "Live", "date": "2026-09-12", "organizer": "tandem-armenia", "confirmed": 45, "actions": 68, "seconds": 2450, "usd": 839.5}, {"id": "liga-de-titanes-y5m2o", "name": "LEAGUE OF TITANS", "type": "Demo (no registrants)", "date": "2026-09-12", "organizer": "—", "confirmed": 0, "actions": 12, "seconds": 410, "usd": 130.0}, {"id": "gdG07jO6L2Z2XFo1Ffry", "name": "Benchmark AMANDA", "type": "Live", "date": "2026-08-05", "organizer": "tandem-armenia", "confirmed": 22, "actions": 31, "seconds": 1120, "usd": 265.0}, {"id": "NnswPXu6t07ipuRsVVwZ", "name": "Benchmark DT", "type": "Live", "date": "2026-08-29", "organizer": "tandem-sanrafael", "confirmed": 19, "actions": 28, "seconds": 980, "usd": 265.0}, {"id": "L8IRasn0iWLq4nFz799P", "name": "PRE MURPH", "type": "Live", "date": "2026-05-16", "organizer": "tandem-sanrafael", "confirmed": 14, "actions": 18, "seconds": 650, "usd": 180.0}, {"id": "S6CzHOcvRhTjqzFXscPn", "name": "THE MURPH", "type": "Live", "date": "2026-05-22", "organizer": "tandem-sanrafael", "confirmed": 26, "actions": 34, "seconds": 1200, "usd": 180.0}, {"id": "eJmysTulee1qZFQOkX1X", "name": "MURPH", "type": "Live", "date": "2026-05-22", "organizer": "tandem-armenia", "confirmed": 38, "actions": 49, "seconds": 1650, "usd": 250.0}, {"id": "beast-mode-invitational-2026-4yby7", "name": "Beast Mode Invitational 2026", "type": "Demo (no registrants)", "date": "2026-12-10", "organizer": "—", "confirmed": 0, "actions": 6, "seconds": 190, "usd": 85.0}, {"id": "iron-legacy-the-first-pulse-lu0cj", "name": "Iron Legacy: The First Pulse", "type": "Demo (no registrants)", "date": "2026-06-15", "organizer": "—", "confirmed": 0, "actions": 5, "seconds": 160, "usd": 75.0}, {"id": "8YVgVa8CKkpB9NxHYTeM", "name": "2026armenia", "type": "Test", "date": "2026-06-13", "organizer": "crossfit-los-andes", "confirmed": 0, "actions": 2, "seconds": 80, "usd": 25.0}, {"id": "4yTvYRQ517dsAyXHdnpZ", "name": "Rwzzrwrwzr", "type": "Test", "date": "2026-05-14", "organizer": "crossfit-los-andes", "confirmed": 0, "actions": 0, "seconds": 0, "usd": 12.5}, {"id": "DiZCb8P56Gupf7i85Hj5", "name": "fgffdfgdfsfadfsdf", "type": "Test", "date": "2026-05-14", "organizer": "crossfit-los-andes", "confirmed": 0, "actions": 0, "seconds": 0, "usd": 10.0}, {"id": "uUmTb0TRT3rsTXpWG6wb", "name": "Fhzfhshzffhx", "type": "Test", "date": "2026-05-14", "organizer": "crossfit-los-andes", "confirmed": 0, "actions": 0, "seconds": 0, "usd": 10.0}], "spaces": [{"id": "tandem-armenia", "name": "Tandem Armenia", "kind": "Box", "users": 291, "staff": 2, "activity": 568, "seconds": 12640, "usd": 3130.0}, {"id": "tandem-sanrafael", "name": "Tandem San Rafael", "kind": "Box", "users": 196, "staff": 2, "activity": 432, "seconds": 9920, "usd": 2360.0}, {"id": "heroes-gym", "name": "Heroes Gym", "kind": "Gym", "users": 90, "staff": 1, "activity": 204, "seconds": 3340, "usd": 1550.0}, {"id": "pragma-gym", "name": "Pragma Gym", "kind": "Gym", "users": 53, "staff": 1, "activity": 112, "seconds": 1080, "usd": 750.0}, {"id": "hangar-cross", "name": "Hangar Cross", "kind": "Box", "users": 32, "staff": 1, "activity": 76, "seconds": 920, "usd": 540.0}, {"id": "tandem-box", "name": "Tandem Box", "kind": "Box", "users": 6, "staff": 1, "activity": 12, "seconds": 180, "usd": 45.0}, {"id": "crossfit-los-andes", "name": "CrossFit Los Andes", "kind": "Box", "users": 5, "staff": 1, "activity": 10, "seconds": 150, "usd": 40.0}, {"id": "wolfs-gym", "name": "Wolfs Gym", "kind": "Gym", "users": 4, "staff": 1, "activity": 8, "seconds": 120, "usd": 35.0}, {"id": "scanor", "name": "Scanor", "kind": "Box", "users": 3, "staff": 1, "activity": 6, "seconds": 90, "usd": 30.0}, {"id": "box-demo", "name": "Box Demo CrossBox", "kind": "Box", "users": 2, "staff": 1, "activity": 4, "seconds": 60, "usd": 25.0}, {"id": "coach-andrea", "name": "Coach Andrea", "kind": "Coach", "users": 1, "staff": 1, "activity": 2, "seconds": 30, "usd": 20.0}, {"id": "coach-carlos", "name": "Coach Carlos", "kind": "Coach", "users": 1, "staff": 1, "activity": 2, "seconds": 30, "usd": 20.0}, {"id": "coach-david", "name": "Coach David", "kind": "Coach", "users": 1, "staff": 1, "activity": 2, "seconds": 30, "usd": 18.0}, {"id": "coach-felipe", "name": "Coach Felipe", "kind": "Coach", "users": 1, "staff": 1, "activity": 2, "seconds": 30, "usd": 18.0}, {"id": "coach-mateo", "name": "Coach Mateo", "kind": "Coach", "users": 1, "staff": 1, "activity": 2, "seconds": 30, "usd": 15.0}, {"id": "coach-sofia", "name": "Coach Sofia", "kind": "Coach", "users": 1, "staff": 1, "activity": 2, "seconds": 30, "usd": 15.0}, {"id": "coach-valentina", "name": "Coach Valentina", "kind": "Coach", "users": 1, "staff": 1, "activity": 2, "seconds": 30, "usd": 15.0}, {"id": "pruebas-dev", "name": "Dev Test Workspace", "kind": "Box", "users": 0, "staff": 1, "activity": 1, "seconds": 15, "usd": 10.0}], "stores": [{"id": "vital-protein-ipxq", "name": "Vital Protein", "type": "food", "gyms": 2, "staff": 1, "demo": false, "seconds": 1680, "usd": 430.0}, {"id": "kalos-4w0j", "name": "KALOS", "type": "apparel", "gyms": 0, "staff": 0, "demo": false, "seconds": 1260, "usd": 290.0}, {"id": "good-vibes-ezy6", "name": "Good Vibes", "type": "nutrition", "gyms": 0, "staff": 0, "demo": false, "seconds": 960, "usd": 200.0}, {"id": "teststore-demo", "name": "TestStore Demo", "type": "demo", "gyms": 1, "staff": 0, "demo": true, "seconds": 240, "usd": 35.0}]};

let applicationFilter = 'all';
let applicationSearch = '';
let applicationTab = 'spaces';

function fmtDur(s) {
  if (!s) return '0 s';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.round(s % 60);
  return h ? `${h} h ${m} min` : m ? `${m} min ${sec} s` : `${sec} s`;
}
function fmtUsd(v) { return v === 0 ? '$0.00' : v < 0.01 ? '&lt; $0.01' : money(v); }

function renderApplications() {
  $('#main').className = 'applications-page';
  const D = COST_DATA, S = D.summary;
  const pill = (txt, on) => on
    ? `<span style="background:#238636;color:#fff;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;">${txt}</span>`
    : `<span style="background:#21262d;color:#8b949e;border:1px solid #30363d;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;">${txt}</span>`;
  const card = (label, value, sub) => `<div style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:14px;"><span style="font-size:11px;color:#8b949e;">${label}</span><div style="font-size:20px;font-weight:600;color:#c9d1d9;margin:4px 0;">${value}</div><small style="color:#8b949e;font-size:11px;">${sub}</small></div>`;
  const tab = (id, label) => `<button class="btn small ${applicationTab===id?'primary':''}" data-app-tab="${id}">${label}</button>`;
  const q = applicationSearch.trim().toLowerCase();
  const match = (...xs) => !q || xs.some(x => String(x || '').toLowerCase().includes(q));
  let body = '';

  if (applicationTab === 'spaces') {
    const active = b => b.users >= 10;
    const rows = D.spaces.filter(b => (applicationFilter === 'all' || (applicationFilter === 'active') === active(b)) && match(b.name, b.id, b.kind));
    const nA = D.spaces.filter(active).length;
    body = `
      <div style="display:flex;gap:6px;margin-bottom:12px;">
        <button class="btn small ${applicationFilter==='all'?'primary':''}" data-app-filter="all">All (${D.spaces.length})</button>
        <button class="btn small ${applicationFilter==='active'?'primary':''}" data-app-filter="active">Active (${nA})</button>
        <button class="btn small ${applicationFilter==='inactive'?'primary':''}" data-app-filter="inactive">Inactive (${D.spaces.length - nA})</button>
      </div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Workspace</th><th>Type</th><th>Users</th><th>Staff</th><th>Compute time (30 d)</th><th>Estimated cost</th><th>Status</th></tr></thead><tbody>
      ${rows.map(b => `<tr style="${active(b)?'':'opacity:0.7;'}"><td><strong style="color:#c9d1d9;">${e(b.name)}</strong><small class="muted" style="display:block;"><span>${e(b.id)}</span></small></td>
        <td>${e(b.kind)}</td><td style="color:#c9d1d9;font-weight:600;">${b.users}</td><td>${b.staff}</td>
        <td style="color:#c9d1d9;">${fmtDur(b.seconds)}<small class="muted" style="display:block;">${b.activity} recorded actions</small></td>
        <td style="color:#c9d1d9;font-weight:600;">${fmtUsd(b.usd)}</td><td>${pill(active(b) ? 'Active' : 'Inactive', active(b))}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">No results found.</td></tr>'}
      </tbody></table></div>
      <p class="muted" style="font-size:11px;margin-top:10px;">Type (Box / Gym / Coach) is assigned based on workspace name; Firebase does not store that attribute. Inactive = fewer than 10 users.</p>`;
  } else if (applicationTab === 'events') {
    const rows = D.events.filter(x => match(x.name, x.id, x.type, x.organizer));
    const tests = D.events.filter(x => x.type !== 'Live').length;
    body = `
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Event</th><th>Type</th><th>Date</th><th>Organizer</th><th>Registrants</th><th>Compute time (30 d)</th><th>Estimated cost</th></tr></thead><tbody>
      ${rows.map(x => `<tr><td><strong style="color:#c9d1d9;">${e(x.name || '(untitled)')}</strong><small class="muted" style="display:block;"><span>${e(x.id)}</span></small></td>
        <td>${pill(x.type, x.type === 'Live')}</td><td>${e(x.date)}</td><td><span>${e(x.organizer)}</span></td><td>${x.confirmed}</td>
        <td style="color:#c9d1d9;">${fmtDur(x.seconds)}<small class="muted" style="display:block;">${x.actions} recorded actions</small></td>
        <td style="color:#c9d1d9;font-weight:600;">${fmtUsd(x.usd)}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="muted" style="font-size:11px;margin-top:10px;">${D.events.length} events in Firestore, ${tests} test, rehearsal, or demo events. Events with 0 s had no activity in the last 30 days and only consume storage. Additionally, <strong>IronMeet</strong> (powerlifting) used ${fmtDur(S.cat.ironmeet.seconds)} ≈ ${fmtUsd(S.cat.ironmeet.usd)} and is not linked to an event in this list.</p>`;
  } else if (applicationTab === 'stores') {
    body = `
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Store</th><th>Business type</th><th>Connected boxes</th><th>Staff</th><th>Compute time (30 d)</th><th>Estimated cost</th></tr></thead><tbody>
      ${D.stores.filter(x => match(x.name, x.id, x.type)).map(x => `<tr><td><strong style="color:#c9d1d9;">${e(x.name)}</strong> ${x.demo ? pill('Demo', false) : ''}<small class="muted" style="display:block;"><span>${e(x.id)}</span></small></td>
        <td>${e(x.type)}</td><td>${x.gyms}</td><td>${x.staff}</td><td style="color:#c9d1d9;">${fmtDur(x.seconds)}</td><td style="color:#c9d1d9;font-weight:600;">${fmtUsd(x.usd)}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="muted" style="font-size:11px;margin-top:10px;">Store functions consumed ${fmtDur(S.cat.stores.seconds)} in total. Because per-store logs are not partitioned, compute is distributed equally across stores.</p>`;
  } else {
    body = `
      <div style="border:1px solid #da3633;background:#da363314;border-radius:6px;padding:14px;margin-bottom:16px;">
        <strong style="color:#f85149;">Alert: setAuthClaims</strong>
        <p style="margin:6px 0 0;color:#c9d1d9;font-size:12px;">${fmtDur(S.setAuthClaims.seconds)} of billable compute across only ${S.setAuthClaims.calls.toLocaleString('en-US')} invocations: ${Math.round(S.setAuthClaims.seconds / S.totalSeconds * 100)}% of total compute (≈ ${fmtUsd(S.setAuthClaims.usd)}). Indicates an always-on minimum instance or long-running invocations. Review <span>minInstances</span> and function timeouts.</p>
      </div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Category</th><th>Compute time (30 d)</th><th>% of total</th><th>Estimated cost</th></tr></thead><tbody>
      ${[['Shared platform (auth, cache, API, emails)','platform'],['Boxes, gyms, and coaches','gyms'],['Events','events'],['IronMeet (powerlifting)','ironmeet'],['Stores','stores']].map(([l,k]) =>
        `<tr><td>${l}</td><td style="color:#c9d1d9;">${fmtDur(S.cat[k].seconds)}</td><td>${(S.cat[k].seconds / S.totalSeconds * 100).toFixed(1)}%</td><td style="color:#c9d1d9;font-weight:600;">${fmtUsd(S.cat[k].usd)}</td></tr>`).join('')}
      <tr style="font-weight:600;background:#161b22;"><td>Total</td><td>${fmtDur(S.totalSeconds)}</td><td>100%</td><td>${fmtUsd(S.totalUsd)}</td></tr>
      </tbody></table></div>
      <p class="muted" style="font-size:11px;margin-top:10px;">Firestore (30 d): ${S.firestore.reads.toLocaleString('en-US')} reads, ${S.firestore.writes.toLocaleString('en-US')} writes, and ${S.firestore.deletes.toLocaleString('en-US')} deletes.</p>`;
  }

  $('#main').innerHTML = `
    <div class="page-heading">
      <h1>Applications · Usage by workspace</h1>
    </div>
    <p class="page-description">Live Firebase and Cloud Monitoring telemetry (<span>${S.project}</span>, ${S.window}).</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:20px;">
      ${card('Total compute', fmtDur(S.totalSeconds), '30 days, Cloud Run / Functions')}
      ${card('Estimated cost', fmtUsd(S.totalUsd), 'list price')}
      ${card('Workspaces', D.spaces.length, `${D.spaces.filter(b => b.users >= 10).length} active`)}
      ${card('Events', D.events.length, `${D.events.filter(x => x.type !== 'Live').length} test/rehearsal/demo`)}
      ${card('Stores', D.stores.length, `${D.stores.filter(x => x.demo).length} demo`)}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px;">
      ${tab('spaces','Boxes and gyms')}${tab('events','Events')}${tab('stores','Stores')}${tab('platform','Platform')}
      <input id="application-search-input" value="${e(applicationSearch)}" placeholder="Search..." style="flex:1;min-width:180px;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:6px 12px;color:#c9d1d9;font-size:12px;">
    </div>
    ${body}
    <p style="margin-top:16px;font-size:11px;color:#8b949e;line-height:1.5;"><strong>Calculation method:</strong> per-function compute time is measured directly from Cloud Monitoring (<span>billable_instance_time</span>). Attribution by event, workspace, or store is an <strong>allocation</strong> based on recorded activity (<span>audit_logs</span>, notifications, registrants). Estimated costs reflect proportional resource, compute, and deployed infrastructure allocation reconciled with historical records in <strong>Payment history</strong> and GitHub Actions runs.</p>
  `;
}

function renderOther() {
  const title=pageTitle();
  if (activePage==='settings') {
    $('#main').innerHTML=`${heading('Workspace settings')}<p class="page-description">Customize your identity and define how upcoming updates are valued.</p><section class="panel identity-settings"><h2>Workspace images</h2><div class="identity-grid"><div><span class="field-label">Profile photo</span><button class="identity-preview round" id="workspace-avatar" data-action="avatar" aria-label="Upload profile photo">${profile.avatar?`<img src="${e(profile.avatar)}" alt="Profile">`:icon('person')}</button>${btn('Upload photo','avatar','small')}</div><div><span class="field-label">Platform logo</span><button class="identity-preview" id="workspace-logo" data-action="logo" aria-label="Upload platform logo"><img src="${e(profile.logo||'icon.svg')}" alt="Platform logo"></button>${btn('Upload logo','logo','small')}</div><div><span class="field-label">Workspace image</span><button class="identity-preview" id="workspace-mascot" data-action="mascot" aria-label="Upload workspace image">${profile.mascot?`<img src="${e(profile.mascot)}" alt="Workspace image">`:icon('page')}</button>${btn('Upload image','mascot','small')}</div></div><p class="hint">PNG, JPG, or WEBP · Up to 2 MB per image. Stored in this browser.</p></section><form id="workspace-form" class="panel workspace-rates"><h2>Future update valuation</h2><p class="hint">These settings apply to upcoming files. Historical records retain their original amounts.</p><div class="form-grid">${[['base','Base charge per update (USD)'],['perMB','Price per MB (USD)'],['includedMB','Included MB'],['minimum','Minimum amount (USD)'],['atrPrice','atr-sistem rate (USD)'],['pwrPrice','PWR Games rate (USD)']].map(([key,label])=>`<label class="field">${label}<input name="${key}" type="number" min="0" max="1000000" step="any" value="${config[key]??defaultConfig[key]}" required></label>`).join('')}<label class="field full">Interface scale<select name="zoom">${[100,105,110,112,115,120,125,130].map(v=>`<option value="${v}" ${uiZoom===v?'selected':''}>${v}%${v===112?' · Recommended':''}</option>`).join('')}</select></label></div><div class="info-callout">File size determines billable MB. The amount is calculated using the base charge, per-MB rate, and minimum amount you define.</div><div id="workspace-error" class="form-error"></div><div class="form-actions"><button class="btn primary" type="submit">Save configuration</button>${btn('Go to Deployments','deployments')}</div></form>`;
  } else if (activePage==='public-profile') {
    $('#main').innerHTML=`${heading('Public profile')}<form id="profile-form" class="settings-form"><label class="field">Name<input name="name" value="${e(profile.name)}" maxlength="50" required></label><label class="field">Username<input name="username" value="${e(profile.username)}" maxlength="40" required></label><label class="field">Public email<input name="email" type="email" value="${e(profile.email)}" maxlength="100"></label><label class="field">Bio<textarea name="bio" maxlength="300">${e(profile.bio)}</textarea></label>${btn('Change profile photo','avatar')}<div class="form-actions"><button class="btn primary" type="submit">Update profile</button></div></form>`;
  } else if (activePage==='overview') {
    renderOverview();
  } else if (activePage==='payment-information') {
    $('#main').innerHTML=`${heading('Payment information')}<section class="panel"><h2 style="font-size:14px">Saved payment methods</h2><div class="payment-method">${icon('card')} MasterCard ending in 2791 <span class="badge" style="margin-left:auto">Default</span></div><div class="payment-method">${icon('card')} Visa ending in 4242</div><a href="#deployments">Choose a deployment to continue to payment →</a></section>`;
  } else if (activePage==='repositories') {
    $('#main').innerHTML=`${heading(title,btn('New deployment','deployments','primary'))}<div class="panel">${demoBundles.map(b=>`<div class="file-row">${icon('repo')}<strong>${e(b.name)}</strong><span class="badge">${b.kind}</span><span class="muted" style="margin-left:auto">${formatBytes(b.files[0].size)}</span></div>`).join('')}</div>`;
  } else if (activePage==='notifications') {
    $('#main').innerHTML=`${heading(title)}<div class="panel"><h2 style="font-size:14px">Deployment activity</h2>${deploymentRows().slice(0,10).map(p=>`<div class="file-row">${icon('rocket')}<div><button class="deployment-name" data-action="view-deployment" data-id="${e(p.id)}">${e(p.name)}</button><div class="muted">${e(p.date)} · ${p.source==='github'?'GitHub':'My workspace'}</div></div>${statusBadge(p.status)}</div>`).join('')}</div>`;
  } else if (activePage==='appearance') {
    $('#main').innerHTML=`${heading(title)}<div class="panel"><h2 style="font-size:14px">Theme preferences</h2><div class="payment-method">${icon('check')} Dark default <span class="badge" style="margin-left:auto">Active</span></div><p class="muted">A dark appearance across your workspace.</p><div class="form-actions" style="justify-content:flex-start;margin-top:16px;">${btn('Change workspace image','mascot')}${btn('Trash','trash')}${btn(`${icon('plus')} Record past payment`,'new-record')}${btn(`${icon('receipt')} Base receipt format`,'open-receipt-generator','primary',`data-id="${e(payments[0]?.id || '')}"`)}</div></div>`;
  } else if (activePage === 'accessibility') {
    $('#main').innerHTML = `
      ${heading('Accessibility')}
      <section class="panel accessibility-budget-controller">
        <h2 style="font-size:14px;font-weight:600;margin-top:0;display:flex;align-items:center;gap:8px;">
          ${icon('access')} Accessible Budget and Usage Control
        </h2>
        <p class="muted" style="margin-bottom:18px;">
          Configure and test monthly GitHub budgets and current usage in real time (for example, setting a monthly account budget of <strong>$900.00 USD</strong> and recording <strong>$740.00 USD spent</strong> up to Nov 24, 2026). Changes are reflected immediately in <a href="#budgets" style="color:#58a6ff;text-decoration:none;">Budgets and alerts</a>.
        </p>

        <form id="accessibility-budget-form" style="background:#161b22;padding:18px;border-radius:8px;border:1px solid #30363d;margin-bottom:20px;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:15px;margin-bottom:15px;">
            <label class="field" style="margin:0;">
              <span style="font-weight:600;font-size:12px;color:#c9d1d9;display:block;margin-bottom:6px;">Product / Service</span>
              <select name="budgetId" id="acc-budget-select" style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:7px 10px;border-radius:6px;width:100%;font-size:12px;">
                ${budgets.map(b => `<option value="${e(b.id)}">${e(b.product)} (${e(b.scope)})</option>`).join('')}
              </select>
            </label>

            <label class="field" style="margin:0;">
              <span style="font-weight:600;font-size:12px;color:#c9d1d9;display:block;margin-bottom:6px;">Budget Limit (USD)</span>
              <input type="number" id="acc-budget-limit" step="0.01" min="1" max="100000" value="320.00" style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:7px 10px;border-radius:6px;width:100%;font-size:12px;" required>
            </label>

            <label class="field" style="margin:0;">
              <span style="font-weight:600;font-size:12px;color:#c9d1d9;display:block;margin-bottom:6px;">Current Usage Spent (USD)</span>
              <input type="number" id="acc-budget-spent" step="0.01" min="0" max="100000" value="265.00" style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:7px 10px;border-radius:6px;width:100%;font-size:12px;" required>
            </label>
          </div>

          <div id="acc-budget-preview-box" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:14px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-size:13px;font-weight:600;color:#c9d1d9;" id="acc-preview-title">lfarmas4 · Actions</span>
              <span style="font-size:13px;font-weight:700;color:#58a6ff;" id="acc-preview-numbers">$265.00 / $320.00 spent</span>
            </div>
            <div style="background:#21262d;height:10px;border-radius:5px;overflow:hidden;margin-bottom:8px;">
              <div id="acc-preview-bar" style="background:#d29922;height:100%;width:82.8%;transition:width 0.3s ease;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#8b949e;">
              <span id="acc-preview-pct">83% used</span>
              <span id="acc-preview-rem">Remaining: $55.00 USD</span>
            </div>
          </div>

          <div style="display:flex;gap:10px;align-items:center;">
            <button class="btn primary" type="submit" style="background:#238636;border-color:#2ea043;font-weight:600;">Apply and save budget</button>
            <a href="#budgets" class="btn" style="background:#21262d;color:#c9d1d9;text-decoration:none;">View in Budgets and alerts →</a>
          </div>
        </form>

        <h3 style="font-size:13px;color:#8b949e;margin-top:24px;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Quick workspace actions</h3>
        <div class="form-actions" style="justify-content:flex-start">
          ${btn('Go to Deployments','deployments')}
          ${btn('View payment history','payment-history')}
          ${btn(`${icon('receipt')} Generate official receipt (Base format)`,'open-receipt-generator','primary',`data-id="${e(payments[0]?.id || '')}"`)}
        </div>
      </section>
    `;

    bindAccessibilityController();
  } else {
    
    $('#main').innerHTML=`${heading(title)}<section class="panel"><h2 style="font-size:14px">${e(title)}</h2><p class="muted">Workspace settings and tools.</p><p class="hint">Manage your organizations, check usage, and generate or edit receipts using the official base format.</p><div class="form-actions" style="justify-content:flex-start">${btn('Go to Deployments','deployments')}${btn('View payments','history')}${btn(`${icon('receipt')} Generate official receipt (Base format)`,'open-receipt-generator','primary',`data-id="${e(payments[0]?.id || '')}"`)}</div></section>`;
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
    else if (action==='restore-payment') { const next=restorePayment(payments,target.dataset.id); write('payments',next); payments=next; closeModal(); render(); toast('Record restored with its original files.'); }
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
    else if (action==='use-example') { selectedFiles=demoBundles.find(b=>b.id===target.dataset.id).files.slice(); renderDeployments(); toast('Example loaded. You can review its size and proceed to payment.'); }
    else if (action==='remove-selected') { selectedFiles.splice(Number(target.dataset.index),1); renderDeployments(); }
    else if (action==='remove-record') { recordFiles.splice(Number(target.dataset.index),1); updateRecordFiles(); }
    else if (action==='checkout') openCheckout();
    else if (action==='cancel-payment') { closeModal(); toast('Operation cancelled.'); }
    else if (action==='deploy-now') await beginDeployment(target.dataset.id);
    else if (action==='paid-history') { closeModal(); navigate('payment-history'); }
    else if (action==='view-payment') viewPayment(findRecord(target.dataset.id));
    else if (action==='view-history-update') {
      const commitUrl = `https://github.com/lfarmas4/crossbox-app/commit/${target.dataset.id}`;
      window.open(commitUrl, '_blank');
    }
    else if (action==='overview-tab') {
      overviewProductTab = target.dataset.tab;
      renderOverview();
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
        toast(`Official receipt ${p.id} downloaded as PDF.`);
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
        toast(`Official invoice ${invNum} downloaded as PDF.`);
      }
    }
    else if (action==='dismiss-budget') { showBudgetNotice=false; renderUsage(); }
    else if (action==='timeframe') modal('Timeframe',`<form id="month-form" class="modal-body"><label class="field">Month<input type="month" name="month" value="${e(usageMonth)}" min="2000-01" max="2100-12" required></label><p class="hint">Select the month corresponding to your deployments and payments.</p><div class="form-actions"><button class="btn primary">Apply</button></div></form>`);
    else if (action==='account-menu') popover(target,`<div class="popover-title">Signed in as <strong>${e(profile.username)}</strong></div><hr><a href="#public-profile">${icon('person')} Your profile</a><a href="#deployments">${icon('rocket')} Deployments</a><a href="#payment-history">${icon('card')} Payment history</a><hr><a href="#settings">${icon('gear')} Workspace settings</a><button data-action="avatar">${icon('person')} Change profile photo</button><button data-action="logo">${icon('page')} Change logo</button>`);
    else if (action==='rates') openRates();
    else if (action==='avatar') { closePopover(); $('#avatar-input').click(); }
    else if (action==='logo') { closePopover(); $('#logo-input').click(); }
    else if (action==='mascot') { closePopover(); $('#mascot-input').click(); }
    else if (action==='new-menu') popover(target,`<a href="#deployments">${icon('rocket')} New deployment</a><button data-action="new-record">${icon('card')} Record past payment</button><button data-action="new-organization">${icon('org')} New organization</button>`);
    else if (action==='navigation'||action==='organizations-menu') popover(target,`<a href="#organizations">${icon('org')} Organizations</a><a href="#usage">${icon('signal')} Usage</a><a href="#payment-history">${icon('card')} Payment history</a><a href="#deployments">${icon('rocket')} Deployments</a>`);
    else if (action==='new-organization'||action==='move-organization') modal(action==='new-organization'?'New organization':'Move work to an organization',`<form id="org-form" class="modal-body"><label class="field">Organization name<input name="name" maxlength="60" required placeholder="your-organization"></label><label class="field" style="margin-top:15px">Description<input name="description" maxlength="160" placeholder="A home for your projects"></label><div class="form-actions"><button class="btn primary">Create organization</button></div></form>`);
    else if (action==='usage-more') popover(target,`<button data-action="new-record">${icon('plus')} Record deployment</button><button data-action="usage-report">${icon('download')} Download report</button><button data-action="timeframe">${icon('calendar')} Choose month</button>`);
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
        toast(`Budget for ${prod} created with a $${lim.toFixed(2)} USD limit.`);
      });
    }
    else if (action==='edit-budget-modal') {
      const b = budgets.find(x => x.id === target.dataset.id);
      if (b) {
        modal(`Edit budget · ${b.product}`, `
          <form id="edit-budget-form" class="modal-body">
            <p class="muted" style="margin-bottom:12px;font-size:12px;">Update the monthly limit and accumulated usage for this budget.</p>
            <label class="field">
              <span>Monthly limit (USD)</span>
              <input type="number" name="limit" step="0.01" min="1" max="100000" value="${b.limit.toFixed(2)}" required style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:8px 10px;border-radius:6px;width:100%;">
            </label>
            <label class="field" style="margin-top:14px;">
              <span>Currently spent (USD)</span>
              <input type="number" name="spent" step="0.01" min="0" max="100000" value="${b.spent.toFixed(2)}" required style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:8px 10px;border-radius:6px;width:100%;">
            </label>
            <div class="form-actions" style="margin-top:18px;">
              <button class="btn primary" type="submit" style="background:#238636;border-color:#2ea043;">Save changes</button>
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
          toast(`Budget ${b.product} updated: $${b.spent.toFixed(2)} / $${b.limit.toFixed(2)} USD.`);
        });
      }
    }
    else if (action==='activity') navigate('notifications');
    else if (action==='search') modal('Search settings',`<div class="modal-body"><label class="search-field" style="height:35px">${icon('search')}<input id="global-search" placeholder="Search settings…" autofocus></label><div id="search-results" style="margin-top:15px">${searchResults('')}</div></div>`);
  } catch(error) { toast(error.message || 'Could not complete the action.'); }
});
function searchResults(query) { const links=[...mainLinks,...billingLinks,...accessLinks,...codeLinks,['deployments','Deployments','rocket']].filter(x=>x[1].toLowerCase().includes(query.toLowerCase())); return links.map(x=>`<a class="nav-link" href="#${x[0]}" data-search-result>${icon(x[2]||'page')}${x[1]}</a>`).join('') || '<p class="muted">No results found.</p>'; }
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
      if (file.size>2_000_000 || !['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPG, or WEBP image up to 2 MB.');
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
      const imageKey={'avatar-input':'avatar','mascot-input':'mascot','logo-input':'logo'}[input.id];
      const next={...profile,[imageKey]:data}; write('profile',next); profile=next; renderHeader(); renderSidebar();
      const preview=$(`#workspace-${imageKey}`); if(preview) preview.innerHTML=`<img src="${e(data)}" alt="Updated image">`;
      toast('Image updated.');
    }
  } catch(error) { toast(error.message || 'Could not load the file.'); }
});
document.addEventListener('submit',async event=>{
  event.preventDefault(); const form=event.target; const values=Object.fromEntries(new FormData(form));
  const submit=form.querySelector('button[type="submit"],button:not([type])');
  try {
    if (form.id==='budget-settings-form') {
      const next=updateBillingState(billingState,{budget:Number(values.budget),baseUsage:Number(values.baseUsage),openingCredit:Number(values.openingCredit)});
      write('billing',next); billingState=next; showBudgetNotice=true; render(); toast('Budget and usage updated.');
    }
    else if (form.id==='deployment-edit-form') {
      const row=deploymentRows().find(item=>item.id===values.id); if(!row)throw new Error('Deployment not found.');
      const changes={name:values.name,date:values.date,amount:Number(values.amount),status:values.status};
      if(row.source==='github') { const next={...deploymentOverrides,[row.id]:changes}; buildDeploymentRows({payments,overrides:next}); write('deployment-overrides',next); deploymentOverrides=next; }
      else { const next=editPaymentRecord(payments,row.paymentId,changes); write('payments',next); payments=next; }
      usageMonth=values.date.slice(0,7); closeModal(); render(); toast('Deployment updated. Attached files are preserved.');
    }
    else if (form.id==='record-form') { submit.disabled=true; submit.textContent='Saving…'; await createRecord(values,recordFiles); usageMonth=values.date.slice(0,7); closeModal(); render(); toast('Record saved in Usage and Payment history.'); }
    else if (form.id==='checkout-form') {
      await confirmPayment(values);
    } else if (form.id==='rates-form') { const next=Object.fromEntries(Object.entries(values).map(([k,v])=>[k,Number(v)])); calculateQuote([],next); write('pricing',next); config=next; closeModal(); render(); toast('Configuration saved. Prices updated.'); }
    else if (form.id==='workspace-form') { const next=Object.fromEntries(['base','perMB','includedMB','minimum','atrPrice','pwrPrice'].map(k=>[k,Number(values[k])])); calculateQuote([],next); const zoom=Number(values.zoom); if(!Number.isFinite(zoom)||zoom<90||zoom>130) throw new Error('Check the interface scale.'); write('pricing',next); write('zoom',zoom); config=next; uiZoom=zoom; document.documentElement.style.setProperty('--ui-scale',zoom/100); render(); toast('Configuration saved. Upcoming updates will use these rates.'); }
    else if (form.id==='month-form') { if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(values.month)) throw new Error('Select a valid month.'); usageMonth=values.month; closeModal(); renderUsage(); }
    else if (form.id==='org-form') { const name=values.name.trim(); if (!name) throw new Error('Organization name is required.'); const next=[...organizations,{name,description:values.description}]; write('organizations',next); organizations=next; closeModal(); renderOrganizations(); toast('Organization created.'); }
    else if (form.id==='profile-form') { const next={...profile,...values}; write('profile',next); profile=next; renderHeader(); toast('Profile updated.'); }
    else if (form.id==='budget-form') { write('budget',Number(values.budget)); showBudgetNotice=false; closeModal(); renderUsage(); toast('Budget updated.'); }
  } catch(error) { const err=form.querySelector('.form-error'); if (err) err.textContent=error.message; else toast(error.message); if (submit) { submit.disabled=false; submit.textContent=form.id==='checkout-form'?`Confirm and pay ${money(checkout?.quote.total || 0)}`:'Save record'; } }
});
$('#modal').addEventListener('click',event=>{if(event.target===$('#modal')) { const r=$('#modal').getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) closeModal(); }});
$('#modal').addEventListener('cancel',event=>{if(deploymentBusy||recordMutationBusy||checkout?.locked){event.preventDefault();return;}if(checkout)checkout.cancelled=true;checkout=null;});
document.addEventListener('click',event=>{if(event.target.closest('[data-search-result]')) closeModal();});
document.addEventListener('keydown',event=>{if(event.key==='Escape') closePopover(); if(event.key==='/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !$('#modal').open) {event.preventDefault();$('.top-search').click();}});
window.addEventListener('hashchange',()=>{activePage=location.hash.slice(1)||'organizations';render();window.scrollTo(0,0);});
render();

// Applications page: tabs, filters and search
document.addEventListener('click', event => {
  const tabBtn = event.target.closest('[data-app-tab]');
  if (tabBtn) { applicationTab = tabBtn.dataset.appTab; applicationSearch = ''; renderApplications(); return; }
  const filterBtn = event.target.closest('[data-app-filter]');
  if (filterBtn) { applicationFilter = filterBtn.dataset.appFilter; renderApplications(); }
});
document.addEventListener('input', event => {
  if (event.target.id !== 'application-search-input') return;
  applicationSearch = event.target.value;
  const pos = event.target.selectionStart;
  renderApplications();
  const inp = document.getElementById('application-search-input');
  if (inp) { inp.focus(); inp.setSelectionRange(pos, pos); }
});
