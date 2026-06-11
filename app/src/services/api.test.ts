import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkHealth, sendText, polishText, getConfig, testConnection } from './api';

const mockDevice = {
  id: 'device_1',
  name: 'Test Device',
  ip: '192.168.1.100',
  port: 3900,
  lastConnected: Date.now(),
  isOnline: true,
};

const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = mockFetch;
});

describe('checkHealth', () => {
  it('returns ok when server responds', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, platform: 'darwin' }),
    });

    const result = await checkHealth(mockDevice);
    expect(result.ok).toBe(true);
    expect(result.data?.platform).toBe('darwin');
  });

  it('returns error when server fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await checkHealth(mockDevice);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('HTTP 500');
  });

  it('returns timeout error on abort', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await checkHealth(mockDevice);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('连接超时');
  });
});

describe('sendText', () => {
  it('returns ok on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const result = await sendText(mockDevice, 'Hello');
    expect(result.ok).toBe(true);
  });

  it('returns error on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    const result = await sendText(mockDevice, 'Hello');
    expect(result.ok).toBe(false);
  });
});

describe('polishText', () => {
  it('returns polished text on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, text: 'Polished text' }),
    });

    const result = await polishText(mockDevice, 'Raw text');
    expect(result.ok).toBe(true);
    expect(result.text).toBe('Polished text');
  });

  it('returns timeout error for long requests', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await polishText(mockDevice, 'Text');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('整理超时');
  });
});

describe('getConfig', () => {
  it('returns config on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ok: true,
        llm: { enabled: true, configured: true, model: 'gpt-4' },
      }),
    });

    const result = await getConfig(mockDevice);
    expect(result.ok).toBe(true);
    expect(result.data?.llm.model).toBe('gpt-4');
  });
});

describe('testConnection', () => {
  it('returns ok when health check passes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const result = await testConnection(mockDevice);
    expect(result.ok).toBe(true);
  });

  it('returns error when health check fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await testConnection(mockDevice);
    expect(result.ok).toBe(false);
  });
});
