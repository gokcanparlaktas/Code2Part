import {
  getResolverApiBaseUrl,
  getResolverRequestTimeoutMs,
} from './resolverConfig';
import type {
  CompareProductsResponseDto,
  FindEquivalentsResponseDto,
  IdentifyProductResponseDto,
  ResolverApiErrorBody,
} from './resolverApiTypes';

export type ResolverApiErrorCode =
  | 'network'
  | 'timeout'
  | 'validation'
  | 'server'
  | 'unknown';

export class ResolverApiError extends Error {
  readonly code: ResolverApiErrorCode;
  readonly status?: number;

  constructor(message: string, code: ResolverApiErrorCode, status?: number) {
    super(message);
    this.name = 'ResolverApiError';
    this.code = code;
    this.status = status;
  }
}

export function mapResolverApiErrorMessage(error: unknown): string {
  if (error instanceof ResolverApiError) {
    switch (error.code) {
      case 'timeout':
        return 'Sunucu yanıt vermedi. Lütfen tekrar deneyin.';
      case 'network':
        return 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
      case 'validation':
        return error.message || 'Girilen ürün kodu geçersiz.';
      case 'server':
        return 'Sunucu şu anda yanıt veremiyor. Lütfen daha sonra tekrar deneyin.';
      default:
        return 'Beklenmeyen bir hata oluştu.';
    }
  }

  return 'Beklenmeyen bir hata oluştu.';
}

async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function postJson<T>(endpoint: string, body: Record<string, string>): Promise<T> {
  const baseUrl = getResolverApiBaseUrl();
  const controller = new AbortController();
  const timeoutMs = getResolverRequestTimeoutMs();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = (await readJsonBody(response)) as T & ResolverApiErrorBody;

    if (!response.ok) {
      const message =
        typeof payload?.error === 'string' && payload.error.trim()
          ? payload.error
          : 'Sunucu isteği reddetti.';
      const code =
        payload?.code === 'validation_error'
          ? 'validation'
          : response.status >= 500
            ? 'server'
            : 'unknown';
      throw new ResolverApiError(message, code, response.status);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ResolverApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ResolverApiError('Bağlantı zaman aşımına uğradı.', 'timeout');
    }

    throw new ResolverApiError('Sunucuya bağlanılamadı.', 'network');
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function identifyProductRemote(code: string): Promise<IdentifyProductResponseDto> {
  return postJson<IdentifyProductResponseDto>('identify', { code });
}

export async function compareProductsRemote(
  sourceCode: string,
  candidateCode: string
): Promise<CompareProductsResponseDto> {
  return postJson<CompareProductsResponseDto>('compare', { sourceCode, candidateCode });
}

export async function findEquivalentsRemote(code: string): Promise<FindEquivalentsResponseDto> {
  return postJson<FindEquivalentsResponseDto>('equivalents', { code });
}

export function buildResolverEndpointUrl(endpoint: 'identify' | 'compare' | 'equivalents'): string {
  return `${getResolverApiBaseUrl()}/${endpoint}`;
}
