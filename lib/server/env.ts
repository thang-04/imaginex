const DEFAULT_CLOUDFLARE_IMAGE_MODEL_ID = '@cf/black-forest-labs/flux-2-klein-9b';

export type CloudflareEnv = {
  apiToken: string;
  apiUrl: string;
  modelId: string;
};

export function getOptionalServerEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function getCloudflareEnv(): CloudflareEnv {
  const modelId =
    getOptionalServerEnv('CLOUDFLARE_IMAGE_MODEL_ID') ?? DEFAULT_CLOUDFLARE_IMAGE_MODEL_ID;
  const explicitUrl = getOptionalServerEnv('CLOUDFLARE_API_URL');
  const accountId = getOptionalServerEnv('CLOUDFLARE_ACCOUNT_ID');
  const apiToken = getOptionalServerEnv('CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_AUTH_TOKEN');

  if (!apiToken) {
    throw new Error(
      'Missing Cloudflare token. Set CLOUDFLARE_API_TOKEN (preferred) or CLOUDFLARE_AUTH_TOKEN.',
    );
  }

  if (explicitUrl) {
    return {
      apiToken: apiToken.replace(/^Bearer\s+/i, '').trim(),
      apiUrl: explicitUrl,
      modelId,
    };
  }

  if (!accountId) {
    throw new Error(
      'Missing Cloudflare endpoint configuration. Set CLOUDFLARE_API_URL or CLOUDFLARE_ACCOUNT_ID.',
    );
  }

  return {
    apiToken: apiToken.replace(/^Bearer\s+/i, '').trim(),
    apiUrl: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelId}`,
    modelId,
  };
}

export { DEFAULT_CLOUDFLARE_IMAGE_MODEL_ID };
