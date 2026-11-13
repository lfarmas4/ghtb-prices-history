const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const positive=value=>Math.max(0,Number.isFinite(Number(value))?Number(value):0);
const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(positive(value));
const button=(label,action,primary=false)=>`<button type="button" class="btn ${primary?'primary':''}" data-action="${action}">${label}</button>`;
const card=(label,value,note='',extra='')=>`<article class="billing-metric ${extra}"><span>${label}</span><strong>${money(value)}</strong>${note?`<small>${note}</small>`:''}</article>`;
const payButton=summary=>positive(summary.amountDue)>0?button(`Pagar saldo ${money(summary.amountDue)}`,'pay-budget',true):'';
const remaining=summary=>Math.max(0,positive(summary.budget)-positive(summary.totalUsage));
function paymentDeadline(period) {
  const match=String(period??'').match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if(!match)return 'fin de mes';
  const lastDay=new Date(Date.UTC(Number(match[1]),Number(match[2]),0));
  return lastDay.toLocaleDateString('es-EC',{day:'numeric',month:'long',timeZone:'UTC'});
}

export function usageSummaryHtml(summary={}) {
  return `<section class="billing-metrics" aria-label="Resumen de consumo mensual">
    ${card('Presupuesto mensual',summary.budget)}
    ${card('Consumo del mes',summary.totalUsage)}
    ${card('Disponible del presupuesto',remaining(summary),'Sin consumir','billing-paid')}
    <article class="billing-metric billing-deadline"><span>Fecha límite de pago</span><strong>${paymentDeadline(summary.period)}</strong><small>${positive(summary.amountDue)>0?'Paga tu consumo antes de fin de mes.':'Consumo regularizado.'}</small></article>
  </section>`;
}

export function usageBannerHtml(summary={}) {
  const excess=Math.max(0,positive(summary.totalUsage)-positive(summary.budget));
  const percentage=Number.isFinite(Number(summary.percentUsed))?positive(summary.percentUsed):positive(summary.budget)?positive(summary.totalUsage)/positive(summary.budget)*100:0;
  const formattedPercentage=Number(percentage.toFixed(1)).toLocaleString('es-EC');
  const rawPercentage=positive(summary.budget)?positive(summary.totalUsage)/positive(summary.budget)*100:percentage;
  const level=rawPercentage>=100?100:rawPercentage>=90?90:rawPercentage>=80?80:0;
  const heading=level?`Alerta de presupuesto: ${level}% alcanzado. `:'';
  const reminder=positive(summary.amountDue)>0?`Recuerda pagar tu consumo antes del ${paymentDeadline(summary.period)}.`:`Tu consumo está regularizado. El período cierra el ${paymentDeadline(summary.period)}.`;
  const text=`${heading}Has consumido ${money(summary.totalUsage)} de tu presupuesto de ${money(summary.budget)} (${formattedPercentage}%). ${excess>0?'Presupuesto superado. ':''}${reminder}`;
  const paymentAction=positive(summary.amountDue)>0?button('Pagar ahora','pay-budget',true):'<span class="billing-payment-settled">Pago regularizado</span>';
  return `<div class="notice billing-notice billing-alert-${level}" data-budget-alert="${level}" role="status">
    <span class="billing-notice-symbol" aria-hidden="true">${level?'!':'i'}</span><span>${text}</span>
    <div class="billing-notice-actions">${paymentAction}${button('Editar presupuesto','budget')}<button type="button" class="close" data-action="dismiss-budget" aria-label="Cerrar aviso">×</button></div>
  </div>`;
}

export function budgetPageHtml(summary={},state={}) {
  const due=positive(summary.amountDue),budget=positive(summary.budget),total=positive(summary.totalUsage);
  const excess=Math.max(0,total-budget);
  const percent=Number.isFinite(Number(summary.percentUsed))?positive(summary.percentUsed):budget?total/budget*100:total?100:0;
  const percentLabel=Number(percent.toFixed(1)).toLocaleString('es-EC');
  const initialCredit=positive(summary.openingCredit),paid=positive(summary.totalPaid);
  const fields=[['budget','Presupuesto mensual',state.budget??budget],['baseUsage','Consumo inicial del mes',state.baseUsage??summary.baseUsage],['openingCredit','Crédito inicial aplicado',state.openingCredit??initialCredit]];
  const status=excess>0?(due>0?'Presupuesto superado':'Presupuesto superado, saldo regularizado'):'Dentro del presupuesto';
  return `<div class="page-heading"><h1>Budgets and alerts</h1><div class="billing-header-actions">${button('Papelera','trash')}<a class="btn small" href="#usage">Ver consumo</a></div></div>
    <p class="page-description">Controla el presupuesto, revisa el consumo del mes y regulariza el saldo pendiente.</p>
    <div class="billing-period"><strong>${escapeHtml(summary.period)}</strong><span class="badge">${escapeHtml(summary.invoiceId||'Resumen mensual')}</span></div>
    ${usageSummaryHtml(summary)}
    <section class="panel billing-budget-panel ${excess>0?'over-budget':'within-budget'}">
      <div class="billing-budget-heading"><h2>Uso del presupuesto</h2><span class="billing-status ${excess>0?'pending':'paid'}">${status}</span></div>
      <div class="billing-progress-label"><span>${money(total)} de ${money(budget)}</span><strong>${percentLabel}% utilizado</strong></div>
      <div class="billing-progress" role="progressbar" aria-label="Uso del presupuesto mensual" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100,percent)}" aria-valuetext="${escapeHtml(percentLabel)}% del presupuesto utilizado"><span style="width:${Math.min(100,percent)}%"></span></div>
      <p class="hint">${excess>0?`El consumo supera el presupuesto por ${money(excess)}. El exceso del presupuesto y el saldo por consumo son importes distintos.`:`Te quedan ${money(remaining(summary))} disponibles del presupuesto mensual.`}</p>
      <dl class="billing-breakdown">
        <div><dt>Consumo inicial</dt><dd>${money(summary.baseUsage)}</dd></div>
        <div><dt>Actualizaciones del mes</dt><dd>${money(summary.deploymentUsage)}</dd></div>
        <div><dt>Consumo total</dt><dd>${money(total)}</dd></div>
        <div><dt>Crédito inicial aplicado</dt><dd>−${money(initialCredit)}</dd></div>
        <div><dt>Actualizaciones ya pagadas</dt><dd>−${money(summary.paidDeployments)}</dd></div>
        <div><dt>Pagos del saldo mensual</dt><dd>−${money(summary.paidSettlements)}</dd></div>
        <div class="billing-breakdown-total"><dt>Saldo por consumo</dt><dd>${money(due)}</dd></div>
      </dl>
      <p class="hint">Saldo por consumo = consumo total − crédito inicial − actualizaciones ya pagadas − pagos del saldo mensual, con un mínimo de $0.00. Los ${money(paid)} registrados como pagos no se vuelven a cobrar. El saldo por consumo es independiente del límite del presupuesto.</p>
      <div class="billing-pay-actions">${payButton(summary)}<a href="#payment-history">Consultar pagos registrados</a></div>
    </section>
    <form id="budget-settings-form" class="panel billing-settings"><h2>Configuración del mes</h2>
      <p class="hint">El crédito inicial representa un saldo aplicado al comienzo del período. El consumo inicial incorpora actividad anterior a las nuevas actualizaciones.</p>
      <div class="billing-settings-fields">${fields.map(([name,label,value])=>`<label class="field">${label} (USD)<input name="${name}" type="number" min="0" max="1000000" step="0.01" required value="${positive(value)}"></label>`).join('')}</div>
      <div class="form-error" role="alert" id="budget-settings-error"></div><div class="form-actions">${button('Restablecer configuración','reset-budget')}<button type="submit" class="btn primary">Guardar</button></div>
    </form>`;
}
