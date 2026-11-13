const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export const GITHUB_OCTOCAT_INVOICE_SVG = `<svg viewBox="0 0 16 16" width="68" height="68" fill="currentColor" aria-hidden="true" style="display:block;color:#000;">
  <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9 1.01 1.28.32.43.91 1.28 2.53.94 0 .64.01 1.18.01 1.34 0 .21-.15.46-.55.38A8.013 8.013 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
</svg>`;

export function invoiceModalHtml(record, profile = {}, allPayments = []) {
  const custom = record.invoiceData || {};
  export function generateNumericInvoiceNum(id) {
  if (!id) return 'INV163022783';
  if (id === '19T5IGEN') return 'INV163022783';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const suffix = String(positive).padStart(6, '0').slice(-6);
  return `INV1630${suffix}`;
}

export function generateNumericTransactionRef(id) {
  if (!id) return 'P-99836064';
  if (id === '19T5IGEN') return 'P-99836064';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 3) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const suffix = String(positive).padStart(6, '0').slice(-6);
  return `P-9983${suffix}`;
}

  const invoiceNum = custom.invoiceNum || generateNumericInvoiceNum(record.id);
  const invoiceDate = custom.invoiceDate || (record.date ? formatInvoiceDate(record.date) : 'Oct 25, 2026');
  const dueDate = custom.dueDate || invoiceDate;
  const terms = custom.terms || 'Due Upon Receipt';
  const currency = custom.currency || 'USD';
  
  const billName = custom.billName || 'Fernando Armas';
  const billCompany = custom.billCompany || 'ESPE';
  const billAddress1 = custom.billAddress1 || 'Casa 345';
  const billAddress2 = custom.billAddress2 || 'Sangolquí, Pichincha, Ecuador, Pichincha';
  const billPostal = custom.billPostal || '171103';
  const billCountry = custom.billCountry || 'Ecuador';

  const desc = custom.description || (record.purpose === 'budget' ? 'GitHub Actions & Compute Usage' : (record.name || 'GitHub Actions Usage'));
  const period = custom.period || `${(record.date || '2026-10-25').slice(0, 7)}-01 - ${(record.date || '2026-10-25').slice(0, 7)}-30`;
  const amtNum = Number(record.amount || 5.66).toFixed(2);
  const qty = custom.quantity || amtNum;
  const rate = custom.rate || '1.00';
  const amountStr = custom.amount || `$${amtNum}`;
  const transactionRef = custom.transactionRef || generateNumericTransactionRef(record.id);

  const currentRecordId = record.id || '';
  const options = allPayments.map(p => `
    <option value="${escapeHtml(p.id)}" ${p.id === currentRecordId ? 'selected' : ''}>
      ${escapeHtml(p.id)} · ${escapeHtml(p.date)} · $${Number(p.amount||0).toFixed(2)} USD (${escapeHtml(p.name || p.method)})
    </option>
  `).join('');

  return `
    <div class="invoice-dialog-body">
      <div class="invoice-form-panel">
        <h3 class="receipt-form-title">Editar campos de la Factura Oficial</h3>
        <p class="receipt-form-hint">Modifica los datos de la factura oficial de GitHub. Puedes guardarla y vincularla a este pago.</p>
        
        <form id="invoice-editor-form" class="receipt-fields-grid">
          <label class="field full">
            <span>Vincular con registro de pago</span>
            <select name="linkedPaymentId" id="inv-field-linked" class="select" style="width:100%;height:32px;background:#0d1117;color:var(--text);border:1px solid #30363d;border-radius:6px;padding:4px 8px;">
              <option value="">-- Seleccionar pago --</option>
              ${options}
            </select>
          </label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <label class="field">
              <span>Invoice #</span>
              <input name="invoiceNum" id="inv-field-num" value="${escapeHtml(invoiceNum)}" required>
            </label>
            <label class="field">
              <span>Invoice Date</span>
              <input name="invoiceDate" id="inv-field-date" value="${escapeHtml(invoiceDate)}" required>
            </label>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <label class="field">
              <span>Terms</span>
              <input name="terms" id="inv-field-terms" value="${escapeHtml(terms)}" required>
            </label>
            <label class="field">
              <span>Due Date</span>
              <input name="dueDate" id="inv-field-duedate" value="${escapeHtml(dueDate)}" required>
            </label>
          </div>
          
          <h4 style="margin:10px 0 4px;font-size:12px;color:#58a6ff;">Datos del Cliente (BILL TO)</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <label class="field">
              <span>Nombre cliente</span>
              <input name="billName" id="inv-field-billname" value="${escapeHtml(billName)}" required>
            </label>
            <label class="field">
              <span>Institución / Empresa</span>
              <input name="billCompany" id="inv-field-billcompany" value="${escapeHtml(billCompany)}">
            </label>
          </div>
          <label class="field full">
            <span>Dirección (Línea 1)</span>
            <input name="billAddress1" id="inv-field-billaddr1" value="${escapeHtml(billAddress1)}">
          </label>
          <label class="field full">
            <span>Ciudad / Provincia (Línea 2)</span>
            <input name="billAddress2" id="inv-field-billaddr2" value="${escapeHtml(billAddress2)}">
          </label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <label class="field">
              <span>Código Postal</span>
              <input name="billPostal" id="inv-field-billpostal" value="${escapeHtml(billPostal)}">
            </label>
            <label class="field">
              <span>País</span>
              <input name="billCountry" id="inv-field-billcountry" value="${escapeHtml(billCountry)}">
            </label>
          </div>

          <h4 style="margin:10px 0 4px;font-size:12px;color:#58a6ff;">Concepto y Valores</h4>
          <label class="field full">
            <span>Descripción</span>
            <input name="description" id="inv-field-desc" value="${escapeHtml(desc)}" required>
          </label>
          <label class="field full">
            <span>Período del servicio</span>
            <input name="period" id="inv-field-period" value="${escapeHtml(period)}" required>
          </label>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
            <label class="field">
              <span>Quantity</span>
              <input name="quantity" id="inv-field-qty" value="${escapeHtml(qty)}">
            </label>
            <label class="field">
              <span>Rate ($)</span>
              <input name="rate" id="inv-field-rate" value="${escapeHtml(rate)}">
            </label>
            <label class="field">
              <span>Amount ($)</span>
              <input name="amount" id="inv-field-amt" value="${escapeHtml(amountStr)}">
            </label>
          </div>
          <label class="field full">
            <span>Ref. Pago Aplicado (Applied transaction)</span>
            <input name="transactionRef" id="inv-field-txref" value="${escapeHtml(transactionRef)}">
          </label>
        </form>

        <div class="receipt-form-actions">
          <button type="button" class="btn primary" id="btn-save-invoice-template" style="background:#238636;border-color:#2ea043;font-weight:600;">Guardar formato y vincular a factura</button>
          <button type="button" class="btn" id="btn-download-html-invoice">Descargar Factura HTML</button>
          <button type="button" class="btn" id="btn-print-invoice">Imprimir / Guardar PDF Oficial</button>
        </div>
      </div>

      <div class="receipt-preview-panel" style="background:#eef1f5;">
        <div class="invoice-card-sheet" id="invoice-printable-content">
          <div class="inv-topbar-black"></div>
          
          <div class="inv-header">
            <div class="inv-brand-col">
              <div class="inv-github-wordmark">GitHub</div>
              <div class="inv-title">INVOICE</div>
            </div>
            <div class="inv-logo-col">
              ${GITHUB_OCTOCAT_INVOICE_SVG}
            </div>
          </div>

          <div class="inv-info-row">
            <div class="inv-github-address">
              <div>GitHub, Inc.</div>
              <div><a href="https://support.github.com/contact" target="_blank" rel="noopener">Support Contact</a></div>
              <div>88 Colin P. Kelly Jr. St.</div>
              <div>San Francisco, CA 94107</div>
            </div>

            <div class="inv-billto-block">
              <div class="inv-billto-title">BILL TO</div>
              <div class="inv-billto-name" contenteditable="true" id="inv-p-billname">${escapeHtml(billName)}</div>
              <div contenteditable="true" id="inv-p-billcompany">${escapeHtml(billCompany)}</div>
              <div contenteditable="true" id="inv-p-billaddr1">${escapeHtml(billAddress1)}</div>
              <div contenteditable="true" id="inv-p-billaddr2">${escapeHtml(billAddress2)}</div>
              <div contenteditable="true" id="inv-p-billpostal">${escapeHtml(billPostal)}</div>
              <div contenteditable="true" id="inv-p-billcountry">${escapeHtml(billCountry)}</div>
            </div>

            <table class="inv-metadata-table">
              <tbody>
                <tr>
                  <td>Invoice #</td>
                  <td contenteditable="true" id="inv-p-num">${escapeHtml(invoiceNum)}</td>
                </tr>
                <tr>
                  <td>Invoice Date</td>
                  <td contenteditable="true" id="inv-p-date">${escapeHtml(invoiceDate)}</td>
                </tr>
                <tr>
                  <td>Terms</td>
                  <td contenteditable="true" id="inv-p-terms">${escapeHtml(terms)}</td>
                </tr>
                <tr>
                  <td>Due Date</td>
                  <td contenteditable="true" id="inv-p-duedate">${escapeHtml(dueDate)}</td>
                </tr>
                <tr>
                  <td>Currency</td>
                  <td contenteditable="true" id="inv-p-currency">${escapeHtml(currency)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <table class="inv-items-table">
            <thead>
              <tr>
                <th style="width:15%;">QUANTITY</th>
                <th style="width:55%;">DESCRIPTION</th>
                <th style="width:15%;">RATE</th>
                <th style="width:15%;text-align:right;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td contenteditable="true" id="inv-p-qty">${escapeHtml(qty)}</td>
                <td>
                  <div class="inv-item-title" contenteditable="true" id="inv-p-desc">${escapeHtml(desc)}</div>
                  <div class="inv-item-sub" contenteditable="true" id="inv-p-period">${escapeHtml(period)}</div>
                </td>
                <td contenteditable="true" id="inv-p-rate">$${escapeHtml(rate)}</td>
                <td style="text-align:right;" contenteditable="true" id="inv-p-amt">${escapeHtml(amountStr)}</td>
              </tr>
            </tbody>
          </table>

          <div class="inv-totals-container">
            <table class="inv-totals-table">
              <tbody>
                <tr>
                  <td>SUBTOTAL:</td>
                  <td id="inv-p-subtotal">${escapeHtml(amountStr)}</td>
                </tr>
                <tr>
                  <td>TAX:</td>
                  <td>$0.00</td>
                </tr>
                <tr class="inv-total-row">
                  <td>INVOICE TOTAL:</td>
                  <td id="inv-p-invtotal">${escapeHtml(amountStr)}</td>
                </tr>
                <tr class="inv-applied-row">
                  <td colspan="2">
                    <div style="font-weight:600;margin-bottom:3px;">APPLIED TRANSACTIONS:</div>
                    <div style="display:flex;justify-content:space-between;color:#333;">
                      <span><span id="inv-p-txref">${escapeHtml(transactionRef)}</span> &nbsp; <span id="inv-p-txdate">${escapeHtml(invoiceDate)}</span></span>
                      <span id="inv-p-txamt">-${escapeHtml(amountStr)}</span>
                    </div>
                  </td>
                </tr>
                <tr class="inv-balancedue-row">
                  <td>BALANCE DUE:</td>
                  <td>$0.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="inv-footer-notes">
            <span style="font-weight:700;">Notes</span>
            <span>*VAT is included in the sales price when and where applicable.</span>
          </div>

          <div class="inv-page-num">Page 1 of 1</div>
        </div>
      </div>
    </div>
  `;
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

export function buildStandaloneInvoiceHtml(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${escapeHtml(data.invoiceNum || 'GitHub')}</title>
  <style>
    @page {
      size: letter;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    body {
      display: flex;
      justify-content: center;
      padding: 35px 25px;
    }
    .invoice-card-sheet {
      width: 100%;
      max-width: 720px;
      min-height: 980px;
      position: relative;
      background: #ffffff;
      display: flex;
      flex-direction: column;
    }
    .inv-topbar-black {
      height: 18px;
      background: #000000;
      width: 82%;
      margin-left: auto;
      margin-bottom: 24px;
    }
    .inv-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
    }
    .inv-github-wordmark {
      font-size: 26px;
      font-weight: 800;
      color: #000000;
      letter-spacing: -0.5px;
      margin-bottom: 28px;
    }
    .inv-title {
      font-size: 20px;
      font-weight: 800;
      color: #000000;
      letter-spacing: 0.5px;
    }
    .inv-logo-col svg {
      width: 72px;
      height: 72px;
      display: block;
      color: #000;
    }
    .inv-info-row {
      display: grid;
      grid-template-columns: 28% 42% 30%;
      gap: 15px;
      font-size: 12.5px;
      line-height: 1.45;
      color: #000000;
      margin-bottom: 35px;
    }
    .inv-github-address a {
      color: #0969da;
      text-decoration: underline;
    }
    .inv-billto-title {
      font-weight: 800;
      margin-bottom: 4px;
    }
    .inv-billto-name {
      font-weight: 700;
    }
    .inv-metadata-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }
    .inv-metadata-table td:first-child {
      color: #000000;
      padding: 2px 0;
      width: 48%;
    }
    .inv-metadata-table td:last-child {
      font-weight: 700;
      color: #000000;
      padding: 2px 0;
    }
    .inv-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      margin-bottom: 30px;
    }
    .inv-items-table th {
      border-bottom: 1.5px solid #000000;
      padding: 8px 0;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      color: #000000;
    }
    .inv-items-table td {
      padding: 14px 0;
      vertical-align: top;
      color: #000000;
    }
    .inv-item-title {
      font-weight: 700;
      margin-bottom: 3px;
    }
    .inv-item-sub {
      color: #222;
      font-size: 12px;
    }
    .inv-totals-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 50px;
    }
    .inv-totals-table {
      width: 50%;
      border-collapse: collapse;
      font-size: 12.5px;
    }
    .inv-totals-table td {
      padding: 6px 0;
    }
    .inv-totals-table td:first-child {
      width: 60%;
      color: #000000;
    }
    .inv-totals-table td:last-child {
      width: 40%;
      text-align: right;
      font-weight: 700;
      color: #000000;
    }
    .inv-totals-table tr {
      border-bottom: 1px solid #d0d7de;
    }
    .inv-total-row td, .inv-balancedue-row td {
      font-weight: 700;
    }
    .inv-footer-notes {
      font-size: 12.5px;
      color: #000000;
      display: flex;
      gap: 50px;
      margin-top: auto;
      padding-top: 40px;
      padding-bottom: 30px;
    }
    .inv-page-num {
      text-align: right;
      font-size: 11px;
      color: #000000;
    }
    @media print {
      body {
        padding: 30px 40px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card-sheet">
    <div class="inv-topbar-black"></div>
    
    <div class="inv-header">
      <div class="inv-brand-col">
        <div class="inv-github-wordmark">GitHub</div>
        <div class="inv-title">INVOICE</div>
      </div>
      <div class="inv-logo-col">
        ${GITHUB_OCTOCAT_INVOICE_SVG}
      </div>
    </div>

    <div class="inv-info-row">
      <div class="inv-github-address">
        <div>GitHub, Inc.</div>
        <div><a href="https://support.github.com/contact">Support Contact</a></div>
        <div>88 Colin P. Kelly Jr. St.</div>
        <div>San Francisco, CA 94107</div>
      </div>

      <div class="inv-billto-block">
        <div class="inv-billto-title">BILL TO</div>
        <div class="inv-billto-name">${escapeHtml(data.billName)}</div>
        <div>${escapeHtml(data.billCompany)}</div>
        <div>${escapeHtml(data.billAddress1)}</div>
        <div>${escapeHtml(data.billAddress2)}</div>
        <div>${escapeHtml(data.billPostal)}</div>
        <div>${escapeHtml(data.billCountry)}</div>
      </div>

      <table class="inv-metadata-table">
        <tbody>
          <tr>
            <td>Invoice #</td>
            <td>${escapeHtml(data.invoiceNum)}</td>
          </tr>
          <tr>
            <td>Invoice Date</td>
            <td>${escapeHtml(data.invoiceDate)}</td>
          </tr>
          <tr>
            <td>Terms</td>
            <td>${escapeHtml(data.terms)}</td>
          </tr>
          <tr>
            <td>Due Date</td>
            <td>${escapeHtml(data.dueDate)}</td>
          </tr>
          <tr>
            <td>Currency</td>
            <td>${escapeHtml(data.currency)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <table class="inv-items-table">
      <thead>
        <tr>
          <th style="width:15%;">QUANTITY</th>
          <th style="width:55%;">DESCRIPTION</th>
          <th style="width:15%;">RATE</th>
          <th style="width:15%;text-align:right;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(data.quantity)}</td>
          <td>
            <div class="inv-item-title">${escapeHtml(data.description)}</div>
            <div class="inv-item-sub">${escapeHtml(data.period)}</div>
          </td>
          <td>$${escapeHtml(data.rate)}</td>
          <td style="text-align:right;">${escapeHtml(data.amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="inv-totals-container">
      <table class="inv-totals-table">
        <tbody>
          <tr>
            <td>SUBTOTAL:</td>
            <td>${escapeHtml(data.amount)}</td>
          </tr>
          <tr>
            <td>TAX:</td>
            <td>$0.00</td>
          </tr>
          <tr class="inv-total-row">
            <td>INVOICE TOTAL:</td>
            <td>${escapeHtml(data.amount)}</td>
          </tr>
          <tr class="inv-applied-row">
            <td colspan="2">
              <div style="font-weight:600;margin-bottom:3px;">APPLIED TRANSACTIONS:</div>
              <div style="display:flex;justify-content:space-between;color:#333;">
                <span>${escapeHtml(data.transactionRef)} &nbsp; ${escapeHtml(data.invoiceDate)}</span>
                <span>-${escapeHtml(data.amount)}</span>
              </div>
            </td>
          </tr>
          <tr class="inv-balancedue-row">
            <td>BALANCE DUE:</td>
            <td>$0.00</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="inv-footer-notes">
      <span style="font-weight:700;">Notes</span>
      <span>*VAT is included in the sales price when and where applicable.</span>
    </div>

    <div class="inv-page-num">Page 1 of 1</div>
  </div>
</body>
</html>`;
}
