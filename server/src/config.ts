import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import type { Config } from '../../shared/types.js';

function loadDefaultPrompt(): string {
  const userPromptPath = path.join(getConfigDir(), 'prompt.txt');
  try {
    if (fs.existsSync(userPromptPath)) {
      return fs.readFileSync(userPromptPath, 'utf-8').trim();
    }
  } catch { /* fall through */ }

  try {
    const thisDir = path.dirname(fileURLToPath(import.meta.url));
    const bundledPrompt = path.join(thisDir, 'prompt.txt');
    if (fs.existsSync(bundledPrompt)) {
      return fs.readFileSync(bundledPrompt, 'utf-8').trim();
    }
  } catch { /* fall through */ }

  return '请将以下语音输入的文字进行最小化修正：修正错别字，去除明显冗余的语气词，保留用户的原始表达意图和用词风格。只输出修正后的文字。';
}

const DEFAULT_CONFIG: Config = {
  llm: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    prompt: '',
    enabled: true,
  },
};

export function getPromptPath(): string {
  return path.join(getConfigDir(), 'prompt.txt');
}

export function getConfigDir(): string {
  return path.join(os.homedir(), '.vibe-input');
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

export function loadConfig(): Config {
  const configPath = getConfigPath();
  try {
    if (!fs.existsSync(configPath)) {
      const config = structuredClone(DEFAULT_CONFIG);
      config.llm.prompt = loadDefaultPrompt();
      saveConfig(config);
      return config;
    }
    const raw = fs.readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(raw) as Partial<Config>;
    const config: Config = {
      llm: {
        ...DEFAULT_CONFIG.llm,
        ...userConfig.llm,
      },
    };
    if (!config.llm.prompt) {
      config.llm.prompt = loadDefaultPrompt();
    }
    return config;
  } catch {
    const config = structuredClone(DEFAULT_CONFIG);
    config.llm.prompt = loadDefaultPrompt();
    return config;
  }
}

export function saveConfig(config: Config): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  } else {
    // Retroactively fix permissions on existing directory
    try {
      fs.chmodSync(dir, 0o700);
    } catch { /* best effort */ }
  }
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  });
  // Retroactively fix permissions on existing config file
  try {
    fs.chmodSync(configPath, 0o600);
  } catch { /* best effort */ }
}

export function isLLMConfigured(config: Config): boolean {
  return config.llm.enabled && config.llm.apiKey.length > 0;
}
