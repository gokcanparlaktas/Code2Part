import { onRequest } from 'firebase-functions/v2/https';

import { createResolverHttpHandler } from '@/backend/http/createCloudFunctionHandler';

/**
 * Runtime cost-safety limits (not requests-per-minute rate limiting).
 * maxInstances + concurrency cap concurrent processing and scale-out cost.
 * App Check, Auth, and true rate limiting are future hardening steps.
 */
export const identify = onRequest(
  {
    region: 'europe-west3',
    memory: '256MiB',
    timeoutSeconds: 20,
    maxInstances: 1,
    concurrency: 10,
  },
  createResolverHttpHandler('identify')
);

export const compare = onRequest(
  {
    region: 'europe-west3',
    memory: '256MiB',
    timeoutSeconds: 30,
    maxInstances: 1,
    concurrency: 5,
  },
  createResolverHttpHandler('compare')
);

export const equivalents = onRequest(
  {
    region: 'europe-west3',
    memory: '256MiB',
    timeoutSeconds: 30,
    maxInstances: 1,
    concurrency: 5,
  },
  createResolverHttpHandler('equivalents')
);
