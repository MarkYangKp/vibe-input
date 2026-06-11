# Vibe Input 0.1.3

**Vibe Input** 是一个为 Vibe Coding 场景打造的跨平台语音输入工具。

在与 AI 进行 Vibe Coding 时，打字往往跟不上思维的速度，难以完整、流畅地表达你的想法。而说话是最自然的思考方式——**Vibe Input** 让你直接对着手机说出 idea，文字即刻出现在电脑的光标处，帮你用最自然的方式与 AI 对话。

利用手机自带的语音输入法（iOS/Android），无需部署语音模型、无需调用付费 API，零成本实现高质量的语音转文字输入。

## 技术栈

- **语言**: TypeScript（strict 模式）
- **手机APP**: React 18 + TypeScript + Vite（Capacitor 6 打包）
- **桌面服务器**: Node.js 原生 HTTP 服务器（tsc 编译，纯 API，无网页）
- **模块系统**: ESM（`"type": "module"`）
- **LLM**: OpenAI 兼容 API（支持 OpenAI / DeepSeek / Moonshot / Ollama 等）
- **跨平台**: 支持 macOS / Windows / Linux
- **测试**: Node.js Test Runner + Vitest
- **Lint**: ESLint 9 flat config

## 项目结构

```
vibe-input/
├── app/                          # 手机APP（Capacitor + React + Vite）
│   ├── src/
│   │   ├── main.tsx             # React 入口
│   │   ├── App.tsx              # 根组件（路由配置）
│   │   ├── components/          # 可复用组件
│   │   │   ├── DeviceCard.tsx   # 设备卡片
│   │   │   └── PreviewOverlay.tsx # AI整理预览
│   │   ├── pages/               # 页面组件
│   │   │   ├── DeviceListPage.tsx
│   │   │   ├── AddDevicePage.tsx
│   │   │   ├── InputPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── hooks/               # 自定义 Hooks
│   │   │   ├── useApi.ts
│   │   │   ├── useBackButton.ts # Android 硬件返回键拦截
│   │   │   ├── useDevices.ts
│   │   │   ├── useTheme.ts
│   │   │   └── useToast.ts
│   │   ├── services/            # API 和存储
│   │   │   ├── api.ts
│   │   │   └── storage.ts
│   │   ├── store/               # 全局状态
│   │   │   └── AppContext.tsx
│   │   └── test/                # 测试配置
│   ├── public/                # Web 静态资源（PWA 图标、manifest）
│   │   ├── icon.svg
│   │   ├── manifest.json
│   │   └── icons/              # 生成的多尺寸 PWA 图标
│   ├── assets/                 # @capacitor/assets 图标源文件
│   │   ├── logo.svg
│   │   └── splash.svg
│   ├── capacitor.config.ts
│   └── package.json
├── resources/                    # 图标设计源文件（SVG）
│   ├── icon.svg
│   └── splash.svg
├── server/                       # 电脑端 Node.js 服务器（纯 API）
│   ├── src/
│   │   ├── vibe-input.ts        # HTTP 服务器 + API 路由
│   │   ├── config.ts            # 配置管理（读写 ~/.vibe-input/）
│   │   ├── llm.ts               # LLM API 调用（OpenAI 兼容）
│   │   ├── setup.ts             # CLI 交互式配置向导
│   │   └── prompt.txt           # 默认系统提示词
│   ├── test/                    # 测试文件
│   └── package.json
├── shared/                       # 共享类型定义
│   ├── types.ts
│   └── package.json
├── package.json                  # 根项目配置（npm workspaces）
├── tsconfig.json                 # TypeScript 项目引用
├── eslint.config.mjs             # ESLint flat config
├── README.md
└── LICENSE                       # MIT
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动电脑端服务器
npm run dev

# 类型检查
npm run typecheck
```

### 构建与运行

```bash
# 构建所有
npm run build

# 构建电脑端
npm run build:server

# 构建手机APP
npm run build:app

# 运行电脑端
npm start
```

### 其他命令

```bash
npm run lint           # ESLint 检查
npm test               # 运行测试
npm run cap:sync       # 同步APP到Capacitor
npm run cap:android    # 打开Android Studio
npm run cap:ios        # 打开Xcode
```

## 功能特性

### 手机APP功能

1. **设备管理**
   - 添加多台电脑设备
   - 扫码配对（扫描终端显示的二维码）
   - 手动输入IP、端口和配对码
   - 设备在线状态检测
   - 设备信息持久化存储

2. **文本输入**
   - 语音转文字输入
   - AI整理功能（需要电脑端配置LLM）
   - 快捷键支持（Ctrl+Enter发送）

3. **设备选择**
   - 选择发送到哪台电脑
   - 记住最后使用的设备

### 电脑端服务器功能

1. **接收文本**
   - 接收手机发送的文本
   - 复制到剪贴板
   - 模拟粘贴操作

2. **AI整理**
   - 配置LLM API
   - 对语音输入进行智能整理

3. **设备配对**
   - 终端显示二维码和6位配对码
   - 提供健康检查API

## AI 整理功能

Vibe Input 支持接入 LLM 对语音输入的口语化文字进行整理润色，使其更清晰规范。

### 配置方式

配置文件路径：`~/.vibe-input/config.json`

首次运行时会自动创建默认配置文件，请根据需要修改：

```json
{
  "llm": {
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-xxx",
    "model": "gpt-4o-mini",
    "prompt": "请将以下语音输入整理为清晰、规范的文字。保留原意，去除口语化的语气词和重复内容，修正错别字，使表达更加简洁流畅。只输出整理后的文字，不要添加任何解释或前缀。",
    "enabled": true
  }
}
```

| 字段 | 说明 |
|------|------|
| `baseUrl` | OpenAI 兼容 API 的 base URL（Ollama 用户填 `http://localhost:11434/v1`） |
| `apiKey` | API 密钥（Ollama 可留空） |
| `model` | 模型名称 |
| `prompt` | 系统提示词，可自定义整理风格 |
| `enabled` | 是否启用 AI 整理 |

### 使用流程

1. 手机端输入文字后，点击 ✨ 按钮开启 AI 整理模式
2. 点击发送，文字先发送到 LLM 进行整理
3. 整理结果返回手机端预览，用户可编辑修改
4. 确认无误后点击"确认发送"，文字粘贴到电脑

如果 AI 整理未配置（apiKey 为空），✨ 按钮不会显示，文字直接发送。

## 工作原理

1. **启动**: 运行 `npm run dev`（或 `npm start`），电脑端服务监听 3900 端口，终端显示二维码和6位配对码
2. **连接**: 手机APP扫描终端二维码，或手动输入IP和配对码添加设备
3. **输入**: 手机上使用语音输入文字
4. **整理**（可选）: 开启 AI 整理后，文字先经 LLM 润色，用户确认后再发送
5. **上屏**: 点击"发送到电脑"，文字通过 API 发送到指定设备
6. **粘贴**: 服务器将文字复制到剪贴板，然后模拟 Command+V 粘贴到当前焦点窗口

### API 端点

除 `/api/health` 和 `/api/qrcode` 外，所有端点需要 `X-Pairing-Token` 请求头。

- `GET /api/health` - 健康检查端点（无需认证）
  - 响应：`{ "ok": true, "platform": "darwin", "uptime": 123.45, "port": 3900, "ip": "192.168.1.100", "name": "电脑 (192.168.1.100)" }`
- `GET /api/qrcode` - 获取二维码 PNG 图片（无需认证）
- `POST /api/type` - 接收文字并执行粘贴
  - 请求体：`{ "text": "要粘贴的文字" }`
  - 响应：`{ "ok": true }` 或 `{ "ok": false, "error": "..." }`
- `POST /api/polish` - 调用 LLM 整理文字
  - 请求体：`{ "text": "要整理的文字" }`
  - 响应：`{ "ok": true, "text": "整理后的文字" }` 或 `{ "ok": false, "error": "..." }`
- `GET /api/config` - 获取 LLM 配置状态（不暴露 apiKey）
  - 响应：`{ "llm": { "enabled": true, "configured": true, "model": "gpt-4o-mini" } }`
- `POST /api/config` - 更新 LLM 配置

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

### 手机无法连接

- 确保手机和电脑在同一 WiFi 网络下
- 检查防火墙是否阻止了 3900 端口
- 确认显示的 IP 地址正确（局域网 IP）

### APP无法安装

- Android：需要允许安装未知来源应用
- iOS：需要使用Xcode进行开发签名

## Commit & Pull Request Guidelines

* Recent history uses conventional prefixes like `feat:`, `refactor:`, and `chore:`; older commits include `feature:` and `Initial commit`.
* Prefer `type: short imperative summary` (e.g., `feat: add artifact toolbar actions`).
* PRs should include a concise description, linked issue if applicable, and screenshots for UI changes.