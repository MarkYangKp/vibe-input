import readline from 'node:readline';
import type { Config, LLMConfig } from '../../shared/types.js';
import { saveConfig, getPromptPath } from './config.js';

interface Provider {
  name: string;
  baseUrl: string;
  defaultModel: string;
  needsApiKey: boolean;
}

const PROVIDERS: Provider[] = [
  { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini', needsApiKey: true },
  { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat', needsApiKey: true },
  { name: 'Moonshot', baseUrl: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-8k', needsApiKey: true },
  { name: 'Ollama (本地)', baseUrl: 'http://localhost:11434/v1', defaultModel: 'qwen2.5:7b', needsApiKey: false },
];

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      resolve(answer.trim());
    });
  });
}

function askSecret(_question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(_question);
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;

    // Ensure raw mode is restored on unexpected exit
    const restoreRawMode = (): void => {
      if (stdin.isRaw !== wasRaw) {
        try { stdin.setRawMode(wasRaw); } catch { /* ignore */ }
      }
    };
    process.once('SIGINT', () => { restoreRawMode(); process.exit(0); });

    try {
      stdin.setRawMode(true);
    } catch { /* Non-TTY stdin, proceed without masking */ }

    let input = '';
    const onData = (ch: Buffer) => {
      const c = ch.toString();
      if (c === '\n' || c === '\r') {
        if (wasRaw) stdin.setRawMode(wasRaw);
        stdin.removeListener('data', onData);
        console.log('');
        resolve(input.trim());
      } else if (c === '\u007F' || c === '\b') {
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else if (c === '\u0003') {
        process.exit(0);
      } else {
        input += c;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

export async function setupLLMConfig(config: Config): Promise<Config> {
  const hr = '─'.repeat(44);

  console.log('');
  console.log(`  ${hr}`);
  console.log('  AI 整理功能尚未配置');
  console.log('  配置后可对语音输入进行智能整理润色');
  console.log(`  ${hr}`);
  console.log('');

  console.log('  请选择 LLM 服务商:');
  PROVIDERS.forEach((p, i) => {
    console.log(`    ${i + 1}. ${p.name}`);
  });
  console.log(`    ${PROVIDERS.length + 1}. 自定义 (OpenAI 兼容 API)`);
  console.log(`    0. 跳过，稍后配置`);
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const choice = await ask(rl, '  请输入编号 [0]: ');
    const idx = parseInt(choice, 10);

    if (idx === 0 || isNaN(idx)) {
      console.log('');
      console.log('  已跳过。稍后可编辑配置文件:');
      console.log(`  ${process.env.HOME || '~'}/.vibe-input/config.json`);
      console.log('');
      return config;
    }

    let provider: Provider;
    if (idx >= 1 && idx <= PROVIDERS.length) {
      provider = PROVIDERS[idx - 1];
    } else if (idx === PROVIDERS.length + 1) {
      const baseUrl = await ask(rl, '  API Base URL: ');
      const modelName = await ask(rl, '  模型名称: ');
      provider = {
        name: '自定义',
        baseUrl: baseUrl || 'https://api.openai.com/v1',
        defaultModel: modelName || 'gpt-4o-mini',
        needsApiKey: true,
      };
    } else {
      console.log('  无效选择，跳过配置。');
      return config;
    }

    let apiKey = '';
    if (provider.needsApiKey) {
      apiKey = await askSecret('  API Key: ');
      if (!apiKey) {
        console.log('');
        console.log('  API Key 不能为空，已跳过配置。');
        return config;
      }
    }

    const model = await ask(rl, `  模型名称 [${provider.defaultModel}]: `);

    const llm: LLMConfig = {
      baseUrl: provider.baseUrl,
      apiKey,
      model: model || provider.defaultModel,
      prompt: config.llm.prompt || '',
      enabled: true,
    };

    config.llm = llm;
    saveConfig(config);

    console.log('');
    console.log(`  ${hr}`);
    console.log(`  配置完成!`);
    console.log(`  服务商      ${provider.name}`);
    console.log(`  模型        ${config.llm.model}`);
    console.log(`  提示词      ${getPromptPath()}`);
    console.log(`  配置文件    ${process.env.HOME || '~'}/.vibe-input/config.json`);
    console.log(`  ${hr}`);
    console.log('');

    return config;
  } finally {
    rl.close();
  }
}
