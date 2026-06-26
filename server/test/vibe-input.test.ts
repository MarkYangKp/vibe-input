import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getLocalIP,
  getPort,
  getPermissionHint,
  PLATFORM,
} from '../src/vibe-input.js';

import { loadConfig, isLLMConfigured, getConfigPath, getConfigDir, getOrCreatePairingToken } from '../src/config.js';

describe('getLocalIP', () => {
  it('should return a string', () => {
    const ip = getLocalIP();
    assert.equal(typeof ip, 'string');
  });

  it('should return a valid IPv4 address or loopback', () => {
    const ip = getLocalIP();
    const ipv4Regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    assert.ok(ipv4Regex.test(ip), `Expected IPv4 format, got: ${ip}`);
  });
});

describe('getPort', () => {
  it('should return default 3900 when no env/arg set', () => {
    const port = getPort();
    assert.equal(port, 3900);
  });
});

describe('getPermissionHint', () => {
  it('should return a string', () => {
    const hint = getPermissionHint();
    assert.ok(typeof hint === 'string');
  });

  it('should contain platform-relevant content when applicable', () => {
    const hint = getPermissionHint();
    if (PLATFORM === 'darwin') {
      assert.ok(hint.includes('辅助功能'));
    } else if (PLATFORM === 'linux') {
      // Linux hint may be empty if xdotool/xclip are installed
      if (hint.length > 0) {
        assert.ok(hint.includes('xdotool') || hint.includes('apt'));
      }
    }
  });
});

describe('PLATFORM', () => {
  it('should be a recognized platform', () => {
    assert.ok(['darwin', 'win32', 'linux'].includes(PLATFORM));
  });
});

describe('config', () => {
  it('getConfigDir should return a path under home', () => {
    const dir = getConfigDir();
    assert.ok(dir.includes('.vibe-input'), `Expected .vibe-input in path, got: ${dir}`);
  });

  it('getConfigPath should end with config.json', () => {
    const p = getConfigPath();
    assert.ok(p.endsWith('config.json'), `Expected config.json, got: ${p}`);
  });

  it('loadConfig should return a valid config object', () => {
    const config = loadConfig();
    assert.ok(typeof config.llm === 'object');
    assert.equal(typeof config.llm.baseUrl, 'string');
    assert.equal(typeof config.llm.apiKey, 'string');
    assert.equal(typeof config.llm.model, 'string');
    assert.equal(typeof config.llm.prompt, 'string');
    assert.equal(typeof config.llm.enabled, 'boolean');
    assert.ok(typeof config.server === 'object');
  });

  it('getOrCreatePairingToken should return a 6-digit token', () => {
    const config = loadConfig();
    const token = getOrCreatePairingToken(config);
    assert.equal(typeof token, 'string');
    assert.equal(token.length, 6);
    assert.ok(/^\d{6}$/.test(token), `Expected 6-digit number, got: ${token}`);
  });

  it('getOrCreatePairingToken should return the same token on second call', () => {
    const config = loadConfig();
    const token1 = getOrCreatePairingToken(config);
    const token2 = getOrCreatePairingToken(config);
    assert.equal(token1, token2);
  });

  it('getOrCreatePairingToken with forceRegenerate should return a different token', () => {
    const config = loadConfig();
    const token1 = getOrCreatePairingToken(config);
    const token2 = getOrCreatePairingToken(config, true);
    assert.notEqual(token1, token2);
    assert.equal(token2.length, 6);
    assert.ok(/^\d{6}$/.test(token2));
  });

  it('isLLMConfigured should return false when apiKey is empty', () => {
    const config = loadConfig();
    if (!config.llm.apiKey) {
      assert.equal(isLLMConfigured(config), false);
    }
  });
});
