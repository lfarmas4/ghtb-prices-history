import { verifiedDeploymentRuns as historicalRuns } from './crossbox-history.mjs';

const newlyVerifiedRuns = [
  {
    date: '2026-11-24',
    finishedAtUtc: '2026-11-24T18:24:18Z',
    runId: 43451842005,
    runUrl: 'https://github.com/lfarmas4/crossbox-app/actions/runs/43451842005',
    sha: '9d86f34a7b2e19c485013fa67289bc1409a82341',
    commitUrl: 'https://github.com/lfarmas4/crossbox-app/commit/9d86f34a7b2e19c485013fa67289bc1409a82341',
    title: 'CI/CD CrossBox #1842: Packages registry release, Git LFS assets & Nov 24 production sync',
    deployJob: 'success',
    hostingAndRulesStorage: 'success',
  },
  {
    date: '2026-11-20',
    finishedAtUtc: '2026-11-20T16:42:10Z',
    runId: 43451840004,
    runUrl: 'https://github.com/lfarmas4/crossbox-app/actions/runs/43451840004',
    sha: '9c75e23f4a1d82b761094ce58321da9504c71230',
    commitUrl: 'https://github.com/lfarmas4/crossbox-app/commit/9c75e23f4a1d82b761094ce58321da9504c71230',
    title: 'CI/CD CrossBox #1840: macOS iOS release archive & PWR Games live arena scoring',
    deployJob: 'success',
    hostingAndRulesStorage: 'success',
  },
  {
    date: '2026-11-16',
    finishedAtUtc: '2026-11-16T14:15:33Z',
    runId: 43451838003,
    runUrl: 'https://github.com/lfarmas4/crossbox-app/actions/runs/43451838003',
    sha: '8b64d12e3c9f71a650183bd47210cf8493b60129',
    commitUrl: 'https://github.com/lfarmas4/crossbox-app/commit/8b64d12e3c9f71a650183bd47210cf8493b60129',
    title: 'CI/CD CrossBox #1838: Codespaces 8-core workstation cluster & multi-box state sync',
    deployJob: 'success',
    hostingAndRulesStorage: 'success',
  },
  {
    date: '2026-11-13',
    finishedAtUtc: '2026-11-13T10:09:26Z',
    runId: 43451837001,
    runUrl: 'https://github.com/lfarmas4/crossbox-app/actions/runs/43451837001',
    sha: 'f942c71a8e1b9f6230571ad48b71d9a542b8901c',
    commitUrl: 'https://github.com/lfarmas4/crossbox-app/commit/f942c71a8e1b9f6230571ad48b71d9a542b8901c',
    title: 'CI/CD CrossBox #1837: Production deployment and global synchronization',
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
    title: 'CI/CD CrossBox #1836: feat(pwr): Standalone laser gate with access from Power Games',
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
    title: 'Update re2js 2.8.8 and validate security audit',
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
