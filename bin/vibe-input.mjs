#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const compiledPath = path.join(rootDir, 'server', 'dist', 'server', 'src', 'vibe-input.js');
const sourcePath = path.join(rootDir, 'server', 'src', 'vibe-input.ts');
const args = process.argv.slice(2);

// Prefer compiled output if available (fast startup), otherwise use tsx
if (existsSync(compiledPath)) {
  const child = spawn(process.execPath, [compiledPath, ...args], {
    stdio: 'inherit',
    cwd: rootDir,
  });
  child.on('exit', (code) => process.exit(code || 0));
} else {
  // Dev mode: run TypeScript source directly via tsx
  const child = spawn(process.execPath, ['--import', 'tsx', sourcePath, ...args], {
    stdio: 'inherit',
    cwd: rootDir,
  });
  child.on('exit', (code) => process.exit(code || 0));
}
