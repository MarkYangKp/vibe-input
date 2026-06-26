export interface Device {
  id: string;
  name: string;
  ip: string;
  port: number;
  token?: string;
  lastConnected: number;
  isOnline: boolean;
}

export interface QRCodeData {
  type: 'vibe-input';
  ip: string;
  port: number;
  token: string;
}

export interface ApiResponse {
  ok: boolean;
  error?: string;
}

export interface PolishResponse {
  ok: boolean;
  error?: string;
  text?: string;
}

export interface HealthResponse {
  ok: boolean;
  platform: string;
  uptime: number;
  port: number;
  ip: string;
  name: string;
}

export interface ConfigResponse {
  ok: boolean;
  error?: string;
  llm: {
    enabled: boolean;
    configured: boolean;
    model: string;
    baseUrl?: string;
    prompt?: string;
  };
}

export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  prompt: string;
  enabled: boolean;
}

export interface ServerConfig {
  /** 持久化的配对令牌，重启后保持不变 */
  pairingToken?: string;
}

export interface Config {
  llm: LLMConfig;
  server?: ServerConfig;
}
