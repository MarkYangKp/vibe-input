const express = require('express');
const path = require('path');
const { execSync, exec } = require('child_process');
const { networkInterfaces, platform } = require('os');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = 3000;
const PLATFORM = platform(); // 'darwin' | 'win32' | 'linux'

// ---------- Middleware ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- 获取局域网 IP ----------
function getLocalIP() {
  const nets = networkInterfaces();

  // 各平台常见物理网卡名称，优先匹配
  const preferred = [
    'en0', 'en1',              // macOS WiFi / Ethernet
    'Wi-Fi', 'Ethernet',       // Windows
    'wlan0', 'eth0', 'enp',    // Linux
  ];
  for (const name of preferred) {
    if (nets[name]) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }

  // 回退：取任意非虚拟网卡的 IPv4
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

// ---------- 跨平台：写入剪贴板 ----------
function copyToClipboard(text) {
  switch (PLATFORM) {
    case 'darwin':
      execSync('pbcopy', { input: text });
      break;
    case 'win32':
      // PowerShell 的 Set-Clipboard 完美支持 Unicode
      execSync(
        `powershell -NoProfile -Command "Set-Clipboard -Value $input"`,
        { input: text }
      );
      break;
    case 'linux':
      // 优先 xclip，其次 xsel
      try {
        execSync('xclip -selection clipboard', { input: text });
      } catch {
        execSync('xsel --clipboard --input', { input: text });
      }
      break;
    default:
      throw new Error(`不支持的操作系统: ${PLATFORM}`);
  }
}

// ---------- 跨平台：模拟粘贴快捷键 ----------
function simulatePaste() {
  switch (PLATFORM) {
    case 'darwin':
      execSync(
        `osascript -e 'tell application "System Events" to keystroke "v" using command down'`
      );
      break;
    case 'win32':
      // PowerShell + SendKeys 模拟 Ctrl+V
      execSync(
        `powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"`
      );
      break;
    case 'linux':
      // xdotool 模拟 Ctrl+V
      execSync('xdotool key ctrl+v');
      break;
    default:
      throw new Error(`不支持的操作系统: ${PLATFORM}`);
  }
}

// ---------- 跨平台：权限提示 ----------
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

// ---------- 核心接口：接收文本并粘贴上屏 ----------
app.post('/api/type', (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ ok: false, error: '文本不能为空' });
  }

  try {
    // 1. 写入系统剪贴板
    copyToClipboard(text);

    // 2. 模拟粘贴快捷键
    simulatePaste();

    console.log(`✅ 已上屏: "${text.slice(0, 40)}${text.length > 40 ? '…' : ''}"`);
    res.json({ ok: true });
  } catch (err) {
    console.error('❌ 粘贴失败:', err.message);
    res.status(500).json({ ok: false, error: '粘贴失败，请检查系统权限' });
  }
});

// ---------- 启动服务 ----------
app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  const url = `http://${ip}:${PORT}`;

  console.log('');
  console.log('🎙️  Vibe Input 已启动');
  console.log(`   平台: ${PLATFORM}`);
  console.log(`   本地: http://localhost:${PORT}`);
  console.log(`   网络: ${url}`);
  console.log('');
  console.log('📱 用手机扫描下方二维码打开输入页面:');
  console.log('');
  qrcode.generate(url, { small: true });
  console.log('');
  console.log(getPermissionHint());
  console.log('');
});
