import type { Device, ApiResponse, HealthResponse, ConfigResponse, PolishResponse } from '../../../shared/types';

const DEFAULT_TIMEOUT = 5000;
const POLISH_TIMEOUT = 30000;

function getBaseUrl(device: Device): string {
  return `http://${device.ip}:${device.port}`;
}

function getHeaders(device: Device): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (device.token) {
    headers['X-Pairing-Token'] = device.token;
  }
  return headers;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkHealth(
  device: Device,
): Promise<{ ok: boolean; data?: HealthResponse; error?: string }> {
  try {
    const response = await fetchWithTimeout(`${getBaseUrl(device)}/api/health`);
    if (response.ok) {
      const data = await response.json() as HealthResponse;
      return { ok: true, data };
    }
    return { ok: false, error: `HTTP ${response.status}` };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { ok: false, error: '连接超时' };
      }
      return { ok: false, error: error.message };
    }
    return { ok: false, error: '连接失败' };
  }
}

export async function sendText(
  device: Device,
  text: string,
): Promise<ApiResponse> {
  try {
    const response = await fetchWithTimeout(`${getBaseUrl(device)}/api/type`, {
      method: 'POST',
      headers: getHeaders(device),
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as ApiResponse;
      return { ok: false, error: body.error || `HTTP ${response.status}` };
    }
    const data = await response.json() as ApiResponse;
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { ok: false, error: '发送超时' };
      }
      return { ok: false, error: error.message };
    }
    return { ok: false, error: '发送失败' };
  }
}

export async function polishText(
  device: Device,
  text: string,
): Promise<PolishResponse> {
  try {
    const response = await fetchWithTimeout(
      `${getBaseUrl(device)}/api/polish`,
      {
        method: 'POST',
        headers: getHeaders(device),
        body: JSON.stringify({ text }),
      },
      POLISH_TIMEOUT,
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as PolishResponse;
      return { ok: false, error: body.error || `HTTP ${response.status}` };
    }
    const data = await response.json() as PolishResponse;
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { ok: false, error: '整理超时' };
      }
      return { ok: false, error: error.message };
    }
    return { ok: false, error: '整理失败' };
  }
}

export async function getConfig(
  device: Device,
): Promise<{ ok: boolean; data?: ConfigResponse; error?: string }> {
  try {
    const response = await fetchWithTimeout(`${getBaseUrl(device)}/api/config`, {
      headers: getHeaders(device),
    });
    if (response.ok) {
      const data = await response.json() as ConfigResponse;
      return { ok: true, data };
    }
    const body = await response.json().catch(() => ({})) as ConfigResponse;
    return { ok: false, error: body.error || `HTTP ${response.status}` };
  } catch (error) {
    if (error instanceof Error) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: '获取配置失败' };
  }
}

export async function testConnection(
  device: Device,
): Promise<{ ok: boolean; error?: string }> {
  const result = await checkHealth(device);
  return { ok: result.ok, error: result.error };
}
