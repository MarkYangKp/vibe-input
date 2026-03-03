#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { networkInterfaces, platform } = require('os');

const PORT = 3900;
const PLATFORM = platform();

function getLocalIP() {
  const nets = networkInterfaces();
  const preferred = ['en0', 'en1', 'Wi-Fi', 'Ethernet', 'wlan0', 'eth0', 'enp'];
  for (const name of preferred) {
    if (nets[name]) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  const skip = /^(zt|feth|utun|awdl|llw|bridge|vmnet|vboxnet|docker|veth|br-|lo)/i;
  for (const name of Object.keys(nets)) {
    if (skip.test(name)) continue;
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

function copyToClipboard(text) {
  switch (PLATFORM) {
    case 'darwin':
      execSync('pbcopy', { input: text });
      break;
    case 'win32':
      execSync('powershell -NoProfile -Command "Set-Clipboard -Value $input"', { input: text });
      break;
    case 'linux':
      try {
        execSync('xclip -selection clipboard', { input: text });
      } catch {
        execSync('xsel --clipboard --input', { input: text });
      }
      break;
    default:
      throw new Error(`不支持的操作系统：${PLATFORM}`);
  }
}

function simulatePaste() {
  switch (PLATFORM) {
    case 'darwin':
      execSync('osascript -e \'tell application "System Events" to keystroke "v" using command down\'');
      break;
    case 'win32':
      execSync('powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^v\')"');
      break;
    case 'linux':
      execSync('xdotool key ctrl+v');
      break;
    default:
      throw new Error(`不支持的操作系统：${PLATFORM}`);
  }
}

function getPermissionHint() {
  switch (PLATFORM) {
    case 'darwin':
      return '⚠️  确保终端已获得 macOS「辅助功能」权限\n   系统设置 → 隐私与安全性 → 辅助功能 → 勾选终端应用';
    case 'win32':
      return '⚠️  如遇粘贴失败，请以管理员身份运行终端';
    case 'linux':
      return '⚠️  请确保已安装 xdotool 和 xclip\n   sudo apt install xdotool xclip';
    default:
      return '';
  }
}

async function generateQRCodeASCII(url) {
  const QRCode = require('qrcode');
  return await QRCode.toString(url, { type: 'terminal', small: true });
}

function getPublicPath() {
  return path.join(__dirname, 'public');
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/type') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { text } = JSON.parse(body);
        if (!text || text.trim().length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: '文本不能为空' }));
          return;
        }
        copyToClipboard(text);
        setTimeout(() => {
          try {
            simulatePaste();
            console.log(`✅ 已上屏："${text.slice(0, 40)}${text.length > 40 ? '…' : ''}"`);
          } catch (e) {
            console.error('❌ 粘贴失败:', e.message);
          }
        }, 100);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: '处理失败' }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/qrcode') {
    const ip = getLocalIP();
    const inputUrl = `http://${ip}:${PORT}/input`;
    const QRCode = require('qrcode');
    QRCode.toDataURL(inputUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    }, (err, dataUrl) => {
      if (err) {
        res.writeHead(500);
        res.end('Error generating QR code');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(dataUrl.split(',')[1], 'base64');
    });
    return;
  }

  let filePath = req.url;
  if (filePath === '/' || filePath === '/desktop.html') {
    filePath = '/desktop.html';
  } else if (filePath === '/input' || filePath === '/index.html') {
    filePath = '/index.html';
  }

  const fullPath = path.join(getPublicPath(), filePath);
  const ext = path.extname(fullPath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg'
  };

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

const ip = getLocalIP();
const url = `http://${ip}:${PORT}`;

server.listen(PORT, '0.0.0.0', async () => {
  console.log('');
  console.log('🎙️  Vibe Input 已启动');
  console.log(`   平台：${PLATFORM}`);
  console.log(`   本地：http://localhost:${PORT}`);
  console.log(`   网络：${url}`);
  console.log('');
  console.log('📱 用手机扫描下方二维码打开输入页面：');
  console.log('');
  
  try {
    const qr = await generateQRCodeASCII(url + '/input');
    console.log(qr);
  } catch (e) {
    console.log(`   ${url}/input`);
  }
  
  console.log('');
  console.log(getPermissionHint());
  console.log('');
  console.log('按 Ctrl+C 停止服务');
});

process.on('SIGINT', () => {
  console.log('\n👋 正在停止服务...');
  server.close(() => {
    console.log('✅ 服务已停止');
    process.exit(0);
  });
});
