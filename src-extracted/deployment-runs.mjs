import { verifiedDeploymentRuns as historicalRuns } from './crossbox-history.mjs';

const newlyVerifiedRuns = [
  {
    date: '2026-10-28',
    finishedAtUtc: '2026-10-28T23:48:01Z',
    runId: 40788759025,
    runUrl: 'https://github.com/lfarmas4/crossbox-app/actions/runs/40788759025',
    sha: 'e18e95edcfdf5ab6d461082ed97c54b17e4bc7c5',
    commitUrl: 'https://github.com/lfarmas4/crossbox-app/commit/e18e95edcfdf5ab6d461082ed97c54b17e4bc7c5',
    title: 'Actualización de re2js 2.8.8 y validación de la auditoría de seguridad',
    deployJob: 'success',
    hostingAndRulesStorage: 'success',
  },
];

const runsById = new Map();
for (const run of [...historicalRuns, ...newlyVerifiedRuns]) {
  runsById.set(run.runId, Object.freeze({ ...run }));
}

export const verifiedDeploymentRuns = Object.freeze(
  [...runsById.values()].sort((a, b) => b.finishedAtUtc.localeCompare(a.finishedAtUtc)),
);

export const latestVerifiedDeploymentRun = verifiedDeploymentRuns[0];
