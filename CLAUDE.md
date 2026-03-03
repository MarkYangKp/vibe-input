# Vibe Input

**Vibe Input** 是一个为 Vibe Coding 场景打造的跨平台语音输入工具。

在与 AI 进行 Vibe Coding 时，打字往往跟不上思维的速度，难以完整、流畅地表达你的想法。而说话是最自然的思考方式——**Vibe Input** 让你直接对着手机说出 idea，文字即刻出现在电脑的光标处，帮你用最自然的方式与 AI 对话。

利用手机自带的语音输入法（iOS/Android），无需部署语音模型、无需调用付费 API，零成本实现高质量的语音转文字输入。

## 技术栈

- **前端**: 原生 HTML/CSS/JS（无框架）
- **后端**: Node.js 原生 HTTP 服务器
- **跨平台**: 支持 macOS / Windows / Linux

## 项目结构

```
vibe-input/
├── vibe-input.js        # 主程序入口
├── package.json          # 项目配置
├── public/
│   ├── index.html       # 手机端输入页面 (/input)
│   └── desktop.html     # 桌面端显示二维码页面 (/)
└── README.md            # 使用说明
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 运行

```bash
# 方式 1：直接运行
node vibe-input.js

# 方式 2：全局安装（推荐）
npm link
vibe-input
```

## 工作原理

1. **启动**: 运行 `node vibe-input.js`，服务监听 3000 端口
2. **连接**: 电脑显示二维码，手机扫码访问 `http://<IP>:3000/input`
3. **输入**: 手机上使用语音输入文字
4. **上屏**: 点击"发送到电脑"，文字通过 API 发送到服务器
5. **粘贴**: 服务器将文字复制到剪贴板，然后模拟 Command+V 粘贴到当前焦点窗口

### API 端点

- `POST /api/type` - 接收文字并执行粘贴
  - 请求体：`{ "text": "要粘贴的文字" }`
  - 响应：`{ "ok": true }` 或 `{ "ok": false, "error": "..." }`

## 已知问题与解决方案

### macOS 终端无法粘贴

**问题**: 运行后无法模拟粘贴操作。

**原因**: macOS 需要 Accessibility（辅助功能）权限才能模拟键盘输入。

**解决方案**:
1. 打开 **系统设置** → **隐私与安全性** → **辅助功能**
2. 点击 **+** 添加你的终端应用（如 Terminal、iTerm2）
3. 确保终端应用被启用

### Windows 终端无法粘贴

**解决方案**: 以管理员身份运行终端

### Linux 无法粘贴

**解决方案**: 安装必要工具
```bash
sudo apt install xdotool xclip
```

### 手机无法访问

- 确保手机和电脑在同一 WiFi 网络下
- 检查防火墙是否阻止了 3000 端口
- 确认显示的 IP 地址正确（局域网 IP）

## Commit & Pull Request Guidelines

* Recent history uses conventional prefixes like `feat:`, `refactor:`, and `chore:`; older commits include `feature:` and `Initial commit`.
* Prefer `type: short imperative summary` (e.g., `feat: add artifact toolbar actions`).
* PRs should include a concise description, linked issue if applicable, and screenshots for UI changes.
