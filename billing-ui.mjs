const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const positive=value=>Math.max(0,Number.isFinite(Number(value))?Number(value):0);
const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(positive(value));
const button=(label,action,primary=false)=>`<button type="button" class="btn ${primary?'primary':''}" data-action="${action}">${label}</button>`;
const card=(label,value,note='',extra='')=>`<article class="billing-metric ${extra}"><span>${label}</span><strong>${money(value)}</strong>${note?`<small>${note}</small>`:''}</article>`;
const payButton=summary=>positive(summary.amountDue)>0?button(`Pay balance ${money(summary.amountDue)}`,'pay-budget',true):'';
const remaining=summary=>Math.max(0,positive(summary.budget)-positive(summary.totalUsage));
function paymentDeadline(period) {
  const match=String(period??'').match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if(!match)return 'end of month';
  const lastDay=new Date(Date.UTC(Number(match[1]),Number(match[2]),0));
  return lastDay.toLocaleDateString('en-US',{day:'numeric',month:'long',timeZone:'UTC'});
}

export function usageSummaryHtml(summary={}) {
  return `<section class="billing-metrics" aria-label="Monthly usage summary">
    ${card('Monthly budget',summary.budget)}
    ${card('Current month usage',summary.totalUsage)}
    ${card('Remaining budget',remaining(summary),'Unspent','billing-paid')}
    <article class="billing-metric billing-deadline"><span>Payment due date</span><strong>${paymentDeadline(summary.period)}</strong><small>${positive(summary.amountDue)>0?'Pay your usage balance before the end of the month.':'Usage settled.'}</small></article>
  </section>`;
}

export function usageBannerHtml(summary={}) {
  const excess=Math.max(0,positive(summary.totalUsage)-positive(summary.budget));
  const percentage=Number.isFinite(Number(summary.percentUsed))?positive(summary.percentUsed):positive(summary.budget)?positive(summary.totalUsage)/positive(summary.budget)*100:0;
  const formattedPercentage=Number(percentage.toFixed(1)).toLocaleString('en-US');
  const rawPercentage=positive(summary.budget)?positive(summary.totalUsage)/positive(summary.budget)*100:percentage;
  const level=rawPercentage>=100?100:rawPercentage>=90?90:rawPercentage>=80?80:0;
  const heading=level?`Budget alert: ${level}% reached. `:'';
  const reminder=positive(summary.amountDue)>0?`Please pay your usage balance before ${paymentDeadline(summary.period)}.`:`Your usage balance is settled. Period closes on ${paymentDeadline(summary.period)}.`;
  const text=`${heading}You have used ${money(summary.totalUsage)} of your ${money(summary.budget)} budget (${formattedPercentage}%). ${excess>0?'Budget exceeded. ':''}${reminder}`;
  const paymentAction=positive(summary.amountDue)>0?button('Pay now','pay-budget',true):'<span class="billing-payment-settled">Payment settled</span>';
  return `<div class="notice billing-notice billing-alert-${level}" data-budget-alert="${level}" role="status">
    <span class="billing-notice-symbol" aria-hidden="true">${level?'!':'i'}</span><span>${text}</span>
    <div class="billing-notice-actions">${paymentAction}${button('Edit budget','budget')}<button type="button" class="close" data-action="dismiss-budget" aria-label="Dismiss notice">×</button></div>
  </div>`;
}

export function budgetPageHtml(summary={},state={}) {
  const due=positive(summary.amountDue),budget=positive(summary.budget),total=positive(summary.totalUsage);
  const excess=Math.max(0,total-budget);
  const percent=Number.isFinite(Number(summary.percentUsed))?positive(summary.percentUsed):budget?total/budget*100:total?100:0;
  const percentLabel=Number(percent.toFixed(1)).toLocaleString('en-US');
  const initialCredit=positive(summary.openingCredit),paid=positive(summary.totalPaid);
  const fields=[['budget','Monthly budget',state.budget??budget],['baseUsage','Opening month usage',state.baseUsage??summary.baseUsage],['openingCredit','Opening credit applied',state.openingCredit??initialCredit]];
  const status=excess>0?(due>0?'Budget exceeded':'Budget exceeded, balance settled'):'Within budget';
  return `<div class="page-heading"><h1>Budgets and alerts</h1><div class="billing-header-actions">${button('Trash','trash')}<a class="btn small" href="#usage">View usage</a></div></div>
    <p class="page-description">Manage your budget, review monthly usage, and settle any pending balance.</p>
    <div class="billing-period"><strong>${escapeHtml(summary.period)}</strong><span class="badge">${escapeHtml(summary.invoiceId||'Monthly summary')}</span></div>
    ${usageSummaryHtml(summary)}
    <section class="panel billing-budget-panel ${excess>0?'over-budget':'within-budget'}">
      <div class="billing-budget-heading"><h2>Budget usage</h2><span class="billing-status ${excess>0?'pending':'paid'}">${status}</span></div>
      <div class="billing-progress-label"><span>${money(total)} of ${money(budget)}</span><strong>${percentLabel}% used</strong></div>
      <div class="billing-progress" role="progressbar" aria-label="Monthly budget usage" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100,percent)}" aria-valuetext="${escapeHtml(percentLabel)}% of budget used"><span style="width:${Math.min(100,percent)}%"></span></div>
      <p class="hint">${excess>0?`Usage exceeds budget by ${money(excess)}. Budget overage and usage balance due are tracked separately.`:`You have ${money(remaining(summary))} remaining in your monthly budget.`}</p>
      <dl class="billing-breakdown">
        <div><dt>Opening usage</dt><dd>${money(summary.baseUsage)}</dd></div>
        <div><dt>Monthly updates</dt><dd>${money(summary.deploymentUsage)}</dd></div>
        <div><dt>Total usage</dt><dd>${money(total)}</dd></div>
        <div><dt>Opening credit applied</dt><dd>−${money(initialCredit)}</dd></div>
        <div><dt>Already paid updates</dt><dd>−${money(summary.paidDeployments)}</dd></div>
        <div><dt>Monthly balance settlements</dt><dd>−${money(summary.paidSettlements)}</dd></div>
        <div class="billing-breakdown-total"><dt>Usage balance due</dt><dd>${money(due)}</dd></div>
      </dl>
      <p class="hint">Usage balance due = total usage − opening credit − already paid updates − monthly balance settlements, with a minimum of $0.00. The ${money(paid)} recorded as payments are not billed again. Usage balance due is independent of the budget limit.</p>
      <div class="billing-pay-actions">${payButton(summary)}<a href="#payment-history">View recorded payments</a></div>
    </section>
    <form id="budget-settings-form" class="panel billing-settings"><h2>Monthly settings</h2>
      <p class="hint">Opening credit represents a balance applied at the start of the period. Opening usage incorporates activity prior to new updates.</p>
      <div class="billing-settings-fields">${fields.map(([name,label,value])=>`<label class="field">${label} (USD)<input name="${name}" type="number" min="0" max="1000000" step="0.01" required value="${positive(value)}"></label>`).join('')}</div>
      <div class="form-error" role="alert" id="budget-settings-error"></div><div class="form-actions">${button('Reset settings','reset-budget')}<button type="submit" class="btn primary">Save</button></div>
    </form>`;
}
