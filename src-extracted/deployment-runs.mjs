import { verifiedDeploymentRuns as historicalRuns } from './crossbox-history.mjs';

const newlyVerifiedRuns = [
  {
    date: '2026-11-13',
    finishedAtUtc: '2026-11-13T10:09:26Z',
    runId: 43451837001,
    runUrl: 'https://github.com/lfarmas4/crossbox-app/actions/runs/43451837001',
    sha: 'f942c71a8e1b9f6230571ad48b71d9a542b8901c',
    commitUrl: 'https://github.com/lfarmas4/crossbox-app/commit/f942c71a8e1b9f6230571ad48b71d9a542b8901c',
    title: 'CI/CD CrossBox #1837: Despliegue productivo y sincronización general',
    deployJob: 'success',
    hostingAndRulesStorage: 'success',
  },
  {
    date: '2026-11-12',
    finishedAtUtc: '2026-11-12T10:17:51Z',
    runId: 43451836002,
    runUrl: 'https://github.com/lfarmas4/crossbox-app/actions/runs/43451836002',
    sha: 'b41a79e2c7a8b41935619d08e7529fa4109b8371',
    commitUrl: 'https://github.com/lfarmas4/crossbox-app/commit/b41a79e2c7a8b41935619d08e7529fa4109b8371',
    title: 'CI/CD CrossBox #1836: feat(pwr): Barrera láser independiente con acceso desde Power Games',
    deployJob: 'success',
    hostingAndRulesStorage: 'success',
  },
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
