import { crossboxHistoryData } from './crossbox-history-data.mjs';

export const portfolioSummary = Object.freeze({
  source: 'supplied portfolio screenshot',
  currency: 'USD',
  crossbox: Object.freeze({
    targetUsd: 4030,
    latestUsd: 4030,
    yearUsd: 10396,
    averageUsd: 1039.6,
    months: 11,
    growthPercent: 2885,
    latestMonth: 'November 2026',
  }),
  fitcode: Object.freeze({
    latestUsd: 3,
    yearUsd: 1880,
    averageUsd: 235,
    months: 8,
    growthPercent: -99,
    latestMonth: 'August 2026',
  }),
  historyIsPartial: false,
  sourceRepositoryIsPrivate: true,
  valuationIsHistoricalPaidAmount: false,
  valuationNote: 'USD 4,030 is a user-provided target valuation; per-commit amounts are modeled from first-parent changed lines, not historical prices or payments.',
});

const metricScope = 'Git first-parent diff per commit; merge commits compare with first parent and root compares with empty tree.';

export const crossboxHistory = Object.freeze(crossboxHistoryData);
// Compatibility export: records are commits, not a claim that every commit deployed.
export const crossboxDeployments = crossboxHistory;

export const historyCoverage = Object.freeze({
  repository: 'lfarmas4/crossbox-app',
  sourceRepositoryIsPrivate: true,
  branch: 'main',
  sourceRef: 'refs/remotes/origin/main',
  tipSha: 'e18e95edcfdf5ab6d461082ed97c54b17e4bc7c5',
  tipMatchesGitHubDefaultBranch: true,
  shallowRepository: false,
  firstSha: 'aaff9b6654481a930b482c9b6f1c4651add60d6c',
  firstCommitDate: '2026-01-30',
  lastSha: 'f942c71a8e1b9f6230571ad48b71d9a542b8901c',
  lastCommitDate: '2026-11-13',
  commitCount: 1209,
  repositoryCreatedAtUtc: '2026-04-04T19:05:50Z',
  includesInheritedAncestry: true,
  preRepositoryCreationAncestryCommitCount: 273,
  historyIsPartial: false,
  metricScope,
  metricMethod: 'Git numstat additions plus deletions over each first-parent tree diff; includes root against the empty tree. Binary file occurrences are counted separately and contribute no text lines.',
  totalAdditions: 2111535,
  totalDeletions: 1038649,
  totalChangedLines: 3150184,
  changedFileOccurrences: 27950,
  binaryFileOccurrences: 6094,
});

export const verifiedDeploymentRuns = Object.freeze([
  Object.freeze({ date: '2026-08-02', finishedAtUtc: '2026-08-02T17:04:21Z', runId: 30757603392, runUrl: 'https://github.com/lfarmas4/crossbox-app/actions/runs/30757603392', sha: 'bc0272246beef2433c70b24a49d0226ddeb44820', commitUrl: 'https://github.com/lfarmas4/crossbox-app/commit/bc0272246beef2433c70b24a49d0226ddeb44820', title: 'Recuperación del inicio en Play Store y restauración de Heroes Gym', deployJob: 'success', hostingAndRulesStorage: 'success' }),
  Object.freeze({ date: '2026-08-28', finishedAtUtc: '2026-08-28T06:24:25Z', runId: 33147122560, runUrl: 'https://github.com/lfarmas4/crossbox-app/actions/runs/33147122560', sha: '176ccf39cdb3f5e958be5d5ab005beb942f8787f', commitUrl: 'https://github.com/lfarmas4/crossbox-app/commit/176ccf39cdb3f5e958be5d5ab005beb942f8787f', title: 'Integración de Vital Protein en la administración de Heroes', deployJob: 'success', hostingAndRulesStorage: 'success' }),
  Object.freeze({ date: '2026-09-23', finishedAtUtc: '2026-09-23T19:06:10Z', runId: 35905035189, runUrl: 'https://github.com/lfarmas4/crossbox-app/actions/runs/35905035189', sha: 'f5a572104afd029ba8ed39b50e448e06040edf05', commitUrl: 'https://github.com/lfarmas4/crossbox-app/commit/f5a572104afd029ba8ed39b50e448e06040edf05', title: 'Protección de asignaciones simultáneas y renovación de rutinas de atletas en The Lab', deployJob: 'success', hostingAndRulesStorage: 'success' }),
  Object.freeze({ date: '2026-10-28', finishedAtUtc: '2026-10-28T19:25:29Z', runId: 40752433915, runUrl: 'https://github.com/lfarmas4/crossbox-app/actions/runs/40752433915', sha: '3f3cb39aad1c2b4f962198da98ac1c29c9fa0e7b', commitUrl: 'https://github.com/lfarmas4/crossbox-app/commit/3f3cb39aad1c2b4f962198da98ac1c29c9fa0e7b', title: 'Radio de PWR Games y preparación reversible del equipo', deployJob: 'success', hostingAndRulesStorage: 'success' }),
  Object.freeze({ date: '2026-10-28', finishedAtUtc: '2026-10-28T20:01:21Z', runId: 40757526612, runUrl: 'https://github.com/lfarmas4/crossbox-app/actions/runs/40757526612', sha: '6d980d4bc9c6473b5a311d2c9aae454ca357d4ce', commitUrl: 'https://github.com/lfarmas4/crossbox-app/commit/6d980d4bc9c6473b5a311d2c9aae454ca357d4ce', title: 'Avisos de los despliegues de Gentle AI y notas finales de ATR', deployJob: 'success', hostingAndRulesStorage: 'success' }),
]);

function toCents(amount) {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError('The valuation must be a finite, non-negative number.');
  }
  const cents = Math.round((amount + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError('The valuation is too large to allocate safely.');
  }
  return cents;
}

export function allocateValuation(deployments, totalUsd = 4030) {
  if (!Array.isArray(deployments)) {
    throw new TypeError('Deployments must be an array.');
  }
  const totalCents = toCents(totalUsd);
  if (deployments.length === 0) {
    if (totalCents > 0) throw new RangeError('A positive valuation needs at least one deployment.');
    return [];
  }

  const chronological = deployments.map((deployment, originalIndex) => {
    if (!deployment || typeof deployment !== 'object') {
      throw new TypeError('Each deployment must be an object.');
    }
    for (const field of ['additions', 'deletions']) {
      if (deployment[field] != null && (!Number.isSafeInteger(deployment[field]) || deployment[field] < 0)) {
        throw new RangeError(`Deployment ${field} must be a non-negative safe integer.`);
      }
    }
    const measuredLines = (deployment.additions ?? 0) + (deployment.deletions ?? 0);
    const changedLines = deployment.changedLines ?? measuredLines;
    if (!Number.isSafeInteger(changedLines) || changedLines < 0) {
      throw new RangeError('Deployment changed lines must be non-negative safe integers.');
    }
    if (deployment.changedLines != null && changedLines !== measuredLines) {
      throw new RangeError('Deployment changed lines must equal additions plus deletions.');
    }
    const committedAtUtc = deployment.committedAtUtc ?? deployment.finishedAtUtc;
    if (typeof committedAtUtc !== 'string' || !Number.isFinite(Date.parse(committedAtUtc))) {
      throw new TypeError('Each record must have a valid commit or finish timestamp.');
    }
    return { ...deployment, originalIndex, changedLines, committedAtUtc };
  }).sort((a, b) => a.committedAtUtc.localeCompare(b.committedAtUtc) || a.originalIndex - b.originalIndex);

  const changedLineTotal = chronological.reduce((sum, deployment) => sum + deployment.changedLines, 0);
  const equalWeight = changedLineTotal === 0;
  if (!Number.isSafeInteger(changedLineTotal)) {
    throw new RangeError('The combined changed lines are too large to allocate safely.');
  }

  const weights = chronological.map((deployment) => equalWeight
    ? 1 / chronological.length
    : deployment.changedLines / changedLineTotal);
  const shares = weights.map((weight) => totalCents * weight);
  const cents = shares.map(Math.floor);
  let remaining = totalCents - cents.reduce((sum, amount) => sum + amount, 0);
  const remainderOrder = shares
    .map((share, index) => ({ index, fraction: share - cents[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let i = 0; i < remaining; i += 1) cents[remainderOrder[i].index] += 1;

  let cumulativeCents = 0;
  return chronological.map((deployment, index) => {
    cumulativeCents += cents[index];
    const { originalIndex: _originalIndex, ...copy } = deployment;
    return {
      ...copy,
      valueUsd: cents[index] / 100,
      weight: weights[index],
      percent: weights[index] * 100,
      cumulativeUsd: cumulativeCents / 100,
    };
  });
}
