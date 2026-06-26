#!/usr/bin/env node

import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { exec, execSync, spawn } from 'node:child_process';
import { networkInterfaces, platform } from 'node:os';
import QRCode from 'qrcode';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadConfig, isLLMConfigured, saveConfig, getOrCreatePairingToken } from './config.js';
import { polishText } from './llm.js';
import { setupLLMConfig } from './setup.js';

// ─── Logger ──────────────────────────────────────────────────────────────────

const DEBUG = process.env.VIBE_INPUT_DEBUG === '1';

function log(level: 'info' | 'warn' | 'error', message: string, detail?: unknown): void {
  const ts = new Date().toISOString().slice(11, 23);
  const prefix = { info: ' ℹ', warn: ' ⚠', error: ' ✖' }[level];
  const line = `[${ts}]${prefix} ${message}`;
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
  if (detail && DEBUG) {
    console.error('    ── debug detail ──');
    console.error(detail);
  }
}

// ─── Rate limiter ────────────────────────────────────────────────────────────

interface RateEntry {
  count: number;
  reset: number;
}

const rateStore = new Map<string, RateEntry>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateStore) {
    if (now > entry.reset) rateStore.delete(key);
  }
}, 5 * 60_000).unref();

function rateLimit(
  ip: string,
  endpoint: string,
  limit: number,
  windowMs: number,
): boolean {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const entry = rateStore.get(key);
  if (!entry || now > entry.reset) {
    rateStore.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= limit) {
    log('warn', `Rate limit hit: ${key} (${entry.count}/${limit})`);
    return false;
  }
  entry.count++;
  return true;
}

function getPort(): number {
  const argIndex = process.argv.indexOf('--port');
  if (argIndex !== -1 && process.argv[argIndex + 1]) {
    const port = parseInt(process.argv[argIndex + 1], 10);
    if (port > 0 && port < 65536) return port;
  }
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (port > 0 && port < 65536) return port;
  }
  return 3900;
}

const PORT = getPort();
const MAX_BODY_SIZE = 1024 * 1024;
const MAX_TEXT_LENGTH = 50_000;
const PLATFORM = platform();
const config = loadConfig();

// 持久化配对令牌：重启后端后仍保持有效，设备无需重新配对
// 使用 --regenerate-token 参数可重新生成令牌并使旧设备失效
const shouldRegenerate = process.argv.includes('--regenerate-token');
const PAIRING_CODE = getOrCreatePairingToken(config, shouldRegenerate);
if (shouldRegenerate) {
  log('info', `Pairing token regenerated (old devices invalidated): ${PAIRING_CODE}`);
} else {
  log('info', `Pairing token: ${PAIRING_CODE} (persistent across restarts)`);
}

function getLocalIP(): string {
  const nets = networkInterfaces();
  const preferred = ['en0', 'en1', 'Wi-Fi', 'WLAN', 'Ethernet', 'wlan0', 'eth0', 'enp'];
  for (const name of preferred) {
    if (nets[name]) {
      for (const net of nets[name]!) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  const skip = /^(zt|feth|utun|awdl|llw|bridge|vmnet|vboxnet|docker|veth|br-|lo|fc|tun|tap)/i;
  for (const name of Object.keys(nets)) {
    if (skip.test(name)) continue;
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

function copyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let cmd: string;
    let args: string[];
    switch (PLATFORM) {
      case 'darwin':
        cmd = 'pbcopy';
        args = [];
        break;
      case 'win32':
        cmd = 'cmd';
        args = ['/c', 'chcp 65001 > nul && clip'];
        break;
      case 'linux':
        cmd = 'xclip';
        args = ['-selection', 'clipboard'];
        break;
      default:
        return reject(new Error(`不支持的操作系统：${PLATFORM}`));
    }

    const child = spawn(cmd, args, { timeout: 5000 });
    child.stdin.write(text);
    child.stdin.end();

    // On Linux, xclip forks to background; unref so Node doesn't wait
    if (PLATFORM === 'linux') {
      child.on('error', () => { /* xclip not found; may still succeed via PATH */ });
      child.unref();
      resolve();
      return;
    }

    child.on('error', (err: Error) => reject(err));
    child.on('close', (code: number | null) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

function simulatePaste(): Promise<void> {
  return new Promise((resolve, reject) => {
    let cmd: string;
    switch (PLATFORM) {
      case 'darwin':
        cmd = 'osascript -e \'tell application "System Events" to keystroke "v" using command down\'';
        break;
      case 'win32':
        cmd = 'powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^v\')"';
        break;
      case 'linux':
        cmd = 'xdotool key ctrl+v';
        break;
      default:
        return reject(new Error(`不支持的操作系统：${PLATFORM}`));
    }
    exec(cmd, { timeout: 5000, env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0' } }, (err?: Error | null) => err ? reject(err) : resolve());
  });
}

function getPermissionHint(): string {
  switch (PLATFORM) {
    case 'darwin':
      return '  粘贴功能需要辅助功能权限\n  系统设置 → 隐私与安全性 → 辅助功能 → 勾选终端应用';
    case 'win32':
      return '  如遇粘贴失败，请以管理员身份运行终端';
    case 'linux':
      try {
        execSync('which xdotool xclip', { stdio: 'ignore' });
        return '';
      } catch {
        return '  请安装必要工具: sudo apt install xdotool xclip';
      }
    default:
      return '';
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

function isAuthorized(req: http.IncomingMessage): boolean {
  const token = req.headers['x-pairing-token'] as string | undefined;
  if (!token) return false;
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(PAIRING_CODE),
    );
  } catch {
    return false;
  }
}

// ─── QR Code ─────────────────────────────────────────────────────────────────

let qrCodeBuffer: Buffer | null = null;

function getQRData(ip: string): string {
  return JSON.stringify({
    type: 'vibe-input',
    ip,
    port: PORT,
    token: PAIRING_CODE,
  });
}

async function generateQRCodeASCII(data: string): Promise<string> {
  return QRCode.toString(data, { type: 'terminal', small: true });
}

async function cacheQRCode(): Promise<void> {
  const ip = getLocalIP();
  const qrData = getQRData(ip);
  const dataUrl = await QRCode.toDataURL(qrData, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
  qrCodeBuffer = Buffer.from(dataUrl.split(',')[1], 'base64');
}

// ─── Request helpers ─────────────────────────────────────────────────────────

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    let bodySize = 0;
    let destroyed = false;
    req.on('data', (chunk: Buffer) => {
      if (destroyed) return;
      bodySize += chunk.length;
      if (bodySize > MAX_BODY_SIZE) {
        destroyed = true;
        reject(new Error('请求体过大'));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      if (!destroyed) resolve(body);
    });
    req.on('error', reject);
  });
}

function jsonResponse(res: http.ServerResponse, statusCode: number, data: Record<string, unknown>): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(data));
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    // Allow localhost and common LAN IPs
    return (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(url.hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url.hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(url.hostname)
    );
  } catch {
    return false;
  }
}

function getClientIP(req: http.IncomingMessage): string {
  return req.socket.remoteAddress || '127.0.0.1';
}

// ─── HTTP Server ─────────────────────────────────────────────────────────────

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  const clientIP = getClientIP(req);
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // CORS: reflect origin if allowed, otherwise omit
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Pairing-Token');
  res.setHeader('Access-Control-Expose-Headers', 'X-RateLimit-Remaining');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // ── POST /api/polish ───────────────────────────────────────────────────
  if (req.method === 'POST' && pathname === '/api/polish') {
    if (!isAuthorized(req)) {
      jsonResponse(res, 401, { ok: false, error: '未授权的请求' });
      return;
    }
    if (!rateLimit(clientIP, 'polish', 10, 60_000)) {
      jsonResponse(res, 429, { ok: false, error: '请求过于频繁，请稍后再试' });
      return;
    }
    readBody(req).then(async (body) => {
      try {
        const { text } = JSON.parse(body) as { text: string };
        if (!text || text.trim().length === 0) {
          jsonResponse(res, 400, { ok: false, error: '文本不能为空' });
          return;
        }
        if (text.length > MAX_TEXT_LENGTH) {
          jsonResponse(res, 400, { ok: false, error: `文本超过最大长度限制 (${MAX_TEXT_LENGTH} 字符)` });
          return;
        }
        if (!isLLMConfigured(config)) {
          jsonResponse(res, 400, { ok: false, error: 'LLM 未配置，请先配置 API Key' });
          return;
        }
        log('info', `Polish request: ${text.slice(0, 50)}${text.length > 50 ? '...' : ''}`);
        const polished = await polishText(text, config.llm);
        log('info', `Polish result: ${polished.slice(0, 50)}${polished.length > 50 ? '...' : ''}`);
        jsonResponse(res, 200, { ok: true, text: polished });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log('error', `Polish failed`, msg);
        jsonResponse(res, 500, { ok: false, error: 'AI 整理失败，请稍后重试' });
      }
    }).catch((e) => {
      const msg = e instanceof Error ? e.message : String(e);
      jsonResponse(res, 413, { ok: false, error: msg });
    });
    return;
  }

  // ── POST /api/type ─────────────────────────────────────────────────────
  if (req.method === 'POST' && pathname === '/api/type') {
    if (!isAuthorized(req)) {
      jsonResponse(res, 401, { ok: false, error: '未授权的请求' });
      return;
    }
    if (!rateLimit(clientIP, 'type', 30, 60_000)) {
      jsonResponse(res, 429, { ok: false, error: '请求过于频繁，请稍后再试' });
      return;
    }
    readBody(req).then(async (body) => {
      try {
        const { text } = JSON.parse(body) as { text: string };
        if (!text || text.trim().length === 0) {
          jsonResponse(res, 400, { ok: false, error: '文本不能为空' });
          return;
        }
        if (text.length > MAX_TEXT_LENGTH) {
          jsonResponse(res, 400, { ok: false, error: `文本超过最大长度限制 (${MAX_TEXT_LENGTH} 字符)` });
          return;
        }
        await copyToClipboard(text);
        await new Promise<void>(r => setTimeout(r, 50));
        await simulatePaste();
        log('info', `Type sent: ${text.slice(0, 50)}${text.length > 50 ? '...' : ''}`);
        jsonResponse(res, 200, { ok: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log('error', `Type failed`, msg);
        jsonResponse(res, 500, { ok: false, error: '发送失败，请确认系统权限设置正确' });
      }
    }).catch((e) => {
      const msg = e instanceof Error ? e.message : String(e);
      jsonResponse(res, 413, { ok: false, error: msg });
    });
    return;
  }

  // ── GET /api/config ────────────────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/config') {
    if (!isAuthorized(req)) {
      jsonResponse(res, 401, { ok: false, error: '未授权的请求' });
      return;
    }
    jsonResponse(res, 200, {
      llm: {
        enabled: config.llm.enabled,
        configured: isLLMConfigured(config),
        model: config.llm.model,
      },
    });
    return;
  }

  // ── POST /api/config ───────────────────────────────────────────────────
  if (req.method === 'POST' && pathname === '/api/config') {
    if (!isAuthorized(req)) {
      jsonResponse(res, 401, { ok: false, error: '未授权的请求' });
      return;
    }
    if (!rateLimit(clientIP, 'config', 5, 60_000)) {
      jsonResponse(res, 429, { ok: false, error: '请求过于频繁，请稍后再试' });
      return;
    }
    readBody(req).then((body) => {
      try {
        const data = JSON.parse(body) as {
          baseUrl?: string;
          apiKey?: string;
          model?: string;
          prompt?: string;
          enabled?: boolean;
        };
        // Validate all fields first, then apply (avoid partial mutation on error)
        if (data.baseUrl !== undefined) {
          try {
            const parsed = new URL(data.baseUrl);
            if (!['https:', 'http:'].includes(parsed.protocol)) {
              throw new Error('不支持的协议');
            }
          } catch {
            jsonResponse(res, 400, { ok: false, error: '无效的 baseUrl' });
            return;
          }
        }
        if (data.apiKey !== undefined && data.apiKey.length > 512) {
          jsonResponse(res, 400, { ok: false, error: 'API Key 过长' });
          return;
        }
        if (data.model !== undefined && data.model.length > 128) {
          jsonResponse(res, 400, { ok: false, error: '模型名称过长' });
          return;
        }
        if (data.prompt !== undefined && data.prompt.length > 8192) {
          jsonResponse(res, 400, { ok: false, error: '提示词过长' });
          return;
        }
        // All validations passed — apply changes
        if (data.baseUrl !== undefined) config.llm.baseUrl = data.baseUrl;
        if (data.apiKey !== undefined) config.llm.apiKey = data.apiKey;
        if (data.model !== undefined) config.llm.model = data.model;
        if (data.prompt !== undefined) config.llm.prompt = data.prompt;
        if (data.enabled !== undefined) config.llm.enabled = data.enabled;
        saveConfig(config);
        log('info', `Config updated: model=${config.llm.model}, configured=${isLLMConfigured(config)}`);
        jsonResponse(res, 200, {
          ok: true,
          llm: {
            enabled: config.llm.enabled,
            configured: isLLMConfigured(config),
            model: config.llm.model,
            baseUrl: config.llm.baseUrl,
            prompt: config.llm.prompt,
          },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        jsonResponse(res, 400, { ok: false, error: msg });
      }
    }).catch((e) => {
      const msg = e instanceof Error ? e.message : String(e);
      jsonResponse(res, 413, { ok: false, error: msg });
    });
    return;
  }

  // ── GET /api/qrcode (public — contains the pairing token itself) ────────
  if (req.method === 'GET' && pathname === '/api/qrcode') {
    if (!qrCodeBuffer) {
      res.writeHead(503);
      res.end('QR code not ready');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(qrCodeBuffer);
    return;
  }

  // ── GET /api/health (public discovery endpoint) ────────────────────────
  if (req.method === 'GET' && pathname === '/api/health') {
    jsonResponse(res, 200, {
      ok: true,
      platform: PLATFORM,
      uptime: process.uptime(),
      port: PORT,
      ip: getLocalIP(),
      name: `电脑 (${getLocalIP()})`,
    });
    return;
  }

  // 404 for all unmatched routes
  res.writeHead(404);
  res.end('Not Found');
});

server.timeout = 30000;
server.setTimeout(30000);

function isMainEntry(): boolean {
  if (!process.argv[1]) return false;
  try {
    const realArgv1 = fs.realpathSync(process.argv[1]);
    const realThis = fileURLToPath(import.meta.url);
    const realThisResolved = fs.realpathSync(realThis);
    return pathToFileURL(realArgv1).href === pathToFileURL(realThisResolved).href;
  } catch {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  }
}

const isMainModule = isMainEntry();

if (isMainModule) {
  const ip = getLocalIP();
  const url = `http://${ip}:${PORT}`;

  if (!isLLMConfigured(config)) {
    await setupLLMConfig(config);
  }

  server.listen(PORT, '0.0.0.0', async () => {
    const hr = '══════════════════════════════════════════════';

    console.log('');
    console.log(hr);
    console.log('  Vibe Input 0.1.2');
    console.log(hr);
    console.log('');

    console.log(`配对码: ${PAIRING_CODE}`);
    console.log('');

    try {
      const qr = await generateQRCodeASCII(getQRData(ip));
      const qrLines = qr.split('\n');
      for (const line of qrLines) {
        console.log(`  ${line}`);
      }
    } catch {
      console.log('  (QR code generation failed)');
    }

    console.log('');
    console.log('使用 Vibe Input APP 扫描二维码，或手动输入配对码');
    console.log('');
    console.log(`  ${url}`);
    console.log(`  http://localhost:${PORT}`);
    console.log('');

    console.log(`平台: ${PLATFORM}`);

    const llmStatus = isLLMConfigured(config)
      ? `已配置 · ${config.llm.model}`
      : '未配置';
    console.log(`AI 整理: ${llmStatus}`);
    console.log('');
    console.log('按 Ctrl+C 停止');
    console.log(hr);
    console.log('');

    await cacheQRCode();
  });

  let isShuttingDown = false;

  process.on('SIGINT', () => {
    if (isShuttingDown) {
      process.exit(1);
    }
    isShuttingDown = true;
    console.log('\n  正在停止服务... (再按 Ctrl+C 强制退出)');
    server.closeAllConnections?.();
    server.close(() => {
      console.log('  已停止。\n');
      process.exit(0);
    });
  });
}

export {
  getLocalIP,
  getPort,
  copyToClipboard,
  simulatePaste,
  getPermissionHint,
  PORT,
  PLATFORM,
};
