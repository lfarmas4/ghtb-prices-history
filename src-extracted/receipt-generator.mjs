const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export const GITHUB_OCTOCAT_SVG = `<svg viewBox="0 0 16 16" width="56" height="56" fill="currentColor" aria-hidden="true" style="display:block;margin:0 auto 14px;color:#000;">
  <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9 1.01 1.28.32.43.91 1.28 2.53.94 0 .64.01 1.18.01 1.34 0 .21-.15.46-.55.38A8.013 8.013 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
</svg>`;

export function receiptModalHtml(record, profile = {}, allPayments = []) {
  const custom = record.receiptData || {};
  const accountBilled = custom.accountBilled || `${profile.username || 'lfarmas4'} (${profile.email || 'luisfernando1942.a@gmail.com'})`;
  const transactionId = custom.transactionId || record.transactionId || (record.id ? `ch_3UUVcRJFr6CCHwli${record.id}` : 'ch_3UUVcRJFr6CCHwli19T5iGEN');
  const chargedTo = custom.chargedTo || (record.method ? record.method.replace(' ending in ', ' (5*** **** **** ') + ')' : 'MasterCard (5*** **** **** 2791)');
  const dateStr = custom.date || `${record.date || '2026-10-25'} 10:54AM PDT`;
  const desc = custom.description || (record.purpose === 'budget' ? 'GitHub Budgets & Usage' : (record.description || `${record.name || 'GitHub Actions Usage'}`));
  const period = custom.period || record.period || `${(record.date || '2026-10-25').slice(0, 7)}-01 - ${(record.date || '2026-10-25').slice(0, 7)}-30`;
  const amountStr = custom.amount || `$${Number(record.amount || 0).toFixed(2)} USD`;
  const watermarkText = custom.watermark || 'Thank you.';
  const currentRecordId = record.id || '';

  const options = allPayments.map(p => `
    <option value="${escapeHtml(p.id)}" ${p.id === currentRecordId ? 'selected' : ''}>
      ${escapeHtml(p.id)} · ${escapeHtml(p.date)} · $${Number(p.amount||0).toFixed(2)} USD (${escapeHtml(p.name || p.method)})
    </option>
  `).join('');

  return `
    <div class="receipt-dialog-body">
      <div class="receipt-form-panel">
        <h3 class="receipt-form-title">Editar campos del recibo</h3>
        <p class="receipt-form-hint">Modifica los campos del recibo. Puedes guardar este formato y vincularlo directamente con cualquier pago del historial.</p>
        
        <form id="receipt-editor-form" class="receipt-fields-grid">
          <label class="field full">
            <span>Vincular con registro de pago</span>
            <select name="linkedPaymentId" id="rcpt-field-linked" class="select" style="width:100%;height:32px;background:#0d1117;color:var(--text);border:1px solid #30363d;border-radius:6px;padding:4px 8px;">
              <option value="">-- Sin vincular o nuevo recibo --</option>
              ${options}
            </select>
          </label>
          <label class="field full">
            <span>Fecha y hora (Date)</span>
            <input name="date" id="rcpt-field-date" value="${escapeHtml(dateStr)}" required>
          </label>
          <label class="field full">
            <span>Cuenta facturada (Account billed)</span>
            <input name="accountBilled" id="rcpt-field-account" value="${escapeHtml(accountBilled)}" required>
          </label>
          <label class="field full">
            <span>ID de Transacción (Transaction ID)</span>
            <input name="transactionId" id="rcpt-field-txid" value="${escapeHtml(transactionId)}" required>
          </label>
          <label class="field full">
            <span>Cobrado a (Charged to)</span>
            <input name="chargedTo" id="rcpt-field-charged" value="${escapeHtml(chargedTo)}" required>
          </label>
          <label class="field full">
            <span>Descripción del concepto (Description)</span>
            <input name="description" id="rcpt-field-desc" value="${escapeHtml(desc)}" required>
          </label>
          <label class="field">
            <span>Período o detalle</span>
            <input name="period" id="rcpt-field-period" value="${escapeHtml(period)}" required>
          </label>
          <label class="field">
            <span>Importe (Amount / Total)</span>
            <input name="amount" id="rcpt-field-amount" value="${escapeHtml(amountStr)}" required>
          </label>
          <label class="field full">
            <span>Marca de agua (Watermark)</span>
            <input name="watermark" id="rcpt-field-watermark" value="${escapeHtml(watermarkText)}" required>
          </label>
          <label class="field full">
            <span>Enlace de soporte (Questions URL)</span>
            <input name="supportUrl" id="rcpt-field-support" value="https://support.github.com/contact" required>
          </label>
        </form>

        <div class="receipt-form-actions">
          <button type="button" class="btn primary" id="btn-save-receipt-template" style="background:#238636;border-color:#2ea043;font-weight:600;">Guardar formato y vincular a pago</button>
          <button type="button" class="btn" id="btn-download-html-receipt">Descargar Recibo HTML</button>
          <button type="button" class="btn" id="btn-print-receipt">Imprimir / Guardar PDF (Exacto)</button>
        </div>
      </div>

      <div class="receipt-preview-panel">
        <div class="receipt-card-sheet" id="receipt-printable-content">
          <div class="rcpt-header">
            ${GITHUB_OCTOCAT_SVG}
            <h1 class="rcpt-title" contenteditable="true" id="rcpt-preview-title">Receipt</h1>
          </div>

          <div class="rcpt-intro">
            <p>Thanks for your purchase!</p>
            <p>Questions? Visit <a href="https://support.github.com/contact" target="_blank" rel="noopener" id="rcpt-preview-support-link">https://support.github.com/contact</a>.</p>
          </div>

          <table class="rcpt-meta-table">
            <tbody>
              <tr>
                <td class="rcpt-label">Date</td>
                <td class="rcpt-value" contenteditable="true" id="rcpt-preview-date">${escapeHtml(dateStr)}</td>
              </tr>
              <tr>
                <td class="rcpt-label">Account billed</td>
                <td class="rcpt-value" contenteditable="true" id="rcpt-preview-account">${escapeHtml(accountBilled)}</td>
              </tr>
              <tr>
                <td class="rcpt-label">Transaction ID</td>
                <td class="rcpt-value" contenteditable="true" id="rcpt-preview-txid">${escapeHtml(transactionId)}</td>
              </tr>
              <tr>
                <td class="rcpt-label">Charged to</td>
                <td class="rcpt-value" contenteditable="true" id="rcpt-preview-charged">${escapeHtml(chargedTo)}</td>
              </tr>
            </tbody>
          </table>

          <table class="rcpt-items-table">
            <thead>
              <tr>
                <th class="rcpt-col-desc">Description</th>
                <th class="rcpt-col-amt">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="rcpt-item-desc">
                  <div class="rcpt-item-name" contenteditable="true" id="rcpt-preview-desc">${escapeHtml(desc)}</div>
                  <div class="rcpt-item-sub" contenteditable="true" id="rcpt-preview-period">${escapeHtml(period)}</div>
                </td>
                <td class="rcpt-item-amt" contenteditable="true" id="rcpt-preview-amount">${escapeHtml(amountStr)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="rcpt-total-label">Total</td>
                <td class="rcpt-total-value" contenteditable="true" id="rcpt-preview-total">${escapeHtml(amountStr)}*</td>
              </tr>
            </tfoot>
          </table>

          <div class="rcpt-bottom-section">
            <div class="rcpt-watermark" contenteditable="true" id="rcpt-preview-watermark">${escapeHtml(watermarkText)}</div>
            
            <div class="rcpt-footer-content">
              <div class="rcpt-footer-brand">GitHub</div>
              <div class="rcpt-footer-columns">
                <div class="rcpt-footer-address">
                  <div>GitHub, Inc.</div>
                  <div>88 Colin P. Kelly Jr. Street</div>
                  <div>San Francisco, CA 94107</div>
                  <div>United States</div>
                </div>
                <div class="rcpt-footer-contact">
                  <div>https://support.github.com/contact</div>
                </div>
              </div>
              <div class="rcpt-footer-vat">* VAT/GST paid directly by GitHub, where applicable</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function buildStandaloneReceiptHtml(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${escapeHtml(data.accountBilled || 'GitHub')}</title>
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
      background-color: #ffffff;
      color: #24292f;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    body {
      display: flex;
      justify-content: center;
      padding: 40px 20px;
    }
    .receipt-container {
      width: 100%;
      max-width: 680px;
      min-height: 980px;
      position: relative;
      background: #ffffff;
      display: flex;
      flex-direction: column;
    }
    .rcpt-header {
      text-align: center;
      margin-top: 15px;
      margin-bottom: 30px;
    }
    .rcpt-header svg {
      width: 56px;
      height: 56px;
      margin: 0 auto 14px;
      display: block;
      color: #000;
    }
    .rcpt-title {
      font-size: 34px;
      font-weight: 300;
      margin: 0;
      color: #1f2328;
      letter-spacing: -0.5px;
    }
    .rcpt-intro {
      margin-bottom: 34px;
      font-size: 14px;
      line-height: 1.5;
      color: #24292f;
    }
    .rcpt-intro p {
      margin: 0 0 5px;
    }
    .rcpt-intro a {
      color: #0969da;
      text-decoration: none;
    }
    .rcpt-meta-table, .rcpt-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .rcpt-meta-table {
      margin-bottom: 28px;
    }
    .rcpt-meta-table tr {
      border-top: 1px solid #d0d7de;
    }
    .rcpt-meta-table tr:last-child {
      border-bottom: 1px solid #d0d7de;
    }
    .rcpt-meta-table td {
      padding: 13px 0;
      vertical-align: top;
    }
    .rcpt-label {
      width: 32%;
      color: #24292f;
      font-weight: 400;
    }
    .rcpt-value {
      width: 68%;
      color: #1f2328;
      font-weight: 600;
    }
    .rcpt-items-table th {
      text-align: left;
      font-weight: 600;
      padding: 13px 0;
      color: #1f2328;
      border-bottom: 1px solid #d0d7de;
    }
    .rcpt-col-desc {
      width: 68%;
    }
    .rcpt-col-amt {
      width: 32%;
      text-align: left;
    }
    .rcpt-items-table td {
      padding: 18px 0;
      vertical-align: top;
    }
    .rcpt-item-name {
      color: #24292f;
      font-weight: 400;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .rcpt-item-sub {
      color: #57606a;
      font-size: 13px;
    }
    .rcpt-item-amt {
      color: #1f2328;
      font-weight: 600;
      font-size: 14px;
      text-align: left;
    }
    .rcpt-items-table tfoot tr {
      border-top: 1px solid #d0d7de;
    }
    .rcpt-total-label {
      padding: 16px 0;
      color: #24292f;
      font-weight: 400;
      font-size: 14px;
    }
    .rcpt-total-value {
      padding: 16px 0;
      color: #1f2328;
      font-weight: 600;
      font-size: 14px;
      text-align: left;
    }
    .rcpt-bottom-section {
      margin-top: 170px;
      position: relative;
    }
    .rcpt-watermark {
      font-size: 64px;
      font-weight: 800;
      color: #f1f3f5;
      letter-spacing: -1.5px;
      line-height: 1;
      margin-bottom: 24px;
      user-select: none;
      pointer-events: none;
    }
    .rcpt-footer-content {
      font-size: 13px;
      line-height: 1.55;
      color: #57606a;
    }
    .rcpt-footer-brand {
      font-size: 16px;
      font-weight: 700;
      color: #1f2328;
      margin-bottom: 12px;
    }
    .rcpt-footer-columns {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 20px;
    }
    .rcpt-footer-address {
      flex: 1;
    }
    .rcpt-footer-contact {
      flex: 1;
    }
    .rcpt-footer-vat {
      font-size: 12px;
      color: #57606a;
      margin-top: 8px;
    }
    @media print {
      body {
        padding: 48px 56px;
        background: #fff;
      }
      .receipt-container {
        max-width: 100%;
        min-height: auto;
      }
      .rcpt-bottom-section {
        margin-top: 160px;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="rcpt-header">
      ${GITHUB_OCTOCAT_SVG}
      <h1 class="rcpt-title">${escapeHtml(data.title || 'Receipt')}</h1>
    </div>

    <div class="rcpt-intro">
      <p>Thanks for your purchase!</p>
      <p>Questions? Visit <a href="${escapeHtml(data.supportUrl || 'https://support.github.com/contact')}">${escapeHtml(data.supportUrl || 'https://support.github.com/contact')}</a>.</p>
    </div>

    <table class="rcpt-meta-table">
      <tbody>
        <tr>
          <td class="rcpt-label">Date</td>
          <td class="rcpt-value">${escapeHtml(data.date)}</td>
        </tr>
        <tr>
          <td class="rcpt-label">Account billed</td>
          <td class="rcpt-value">${escapeHtml(data.accountBilled)}</td>
        </tr>
        <tr>
          <td class="rcpt-label">Transaction ID</td>
          <td class="rcpt-value">${escapeHtml(data.transactionId)}</td>
        </tr>
        <tr>
          <td class="rcpt-label">Charged to</td>
          <td class="rcpt-value">${escapeHtml(data.chargedTo)}</td>
        </tr>
      </tbody>
    </table>

    <table class="rcpt-items-table">
      <thead>
        <tr>
          <th class="rcpt-col-desc">Description</th>
          <th class="rcpt-col-amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="rcpt-item-desc">
            <div class="rcpt-item-name">${escapeHtml(data.description)}</div>
            <div class="rcpt-item-sub">${escapeHtml(data.period)}</div>
          </td>
          <td class="rcpt-item-amt">${escapeHtml(data.amount)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td class="rcpt-total-label">Total</td>
          <td class="rcpt-total-value">${escapeHtml(data.amount)}*</td>
        </tr>
      </tfoot>
    </table>

    <div class="rcpt-bottom-section">
      <div class="rcpt-watermark">${escapeHtml(data.watermark || 'Thank you.')}</div>
      
      <div class="rcpt-footer-content">
        <div class="rcpt-footer-brand">GitHub</div>
        <div class="rcpt-footer-columns">
          <div class="rcpt-footer-address">
            <div>GitHub, Inc.</div>
            <div>88 Colin P. Kelly Jr. Street</div>
            <div>San Francisco, CA 94107</div>
            <div>United States</div>
          </div>
          <div class="rcpt-footer-contact">
            <div>${escapeHtml(data.supportUrl || 'https://support.github.com/contact')}</div>
          </div>
        </div>
        <div class="rcpt-footer-vat">* VAT/GST paid directly by GitHub, where applicable</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
