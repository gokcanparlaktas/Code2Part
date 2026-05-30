import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';

import { createResolverHttpHandler } from '@/backend/http/createCloudFunctionHandler';

setGlobalOptions({
  region: 'europe-west3',
  maxInstances: 10,
});

export const identify = onRequest(createResolverHttpHandler('identify'));
export const compare = onRequest(createResolverHttpHandler('compare'));
export const equivalents = onRequest(createResolverHttpHandler('equivalents'));
