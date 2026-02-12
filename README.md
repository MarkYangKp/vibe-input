# Vibe Input

**Vibe Input** 是一个为 Vibe Coding 场景打造的跨平台语音输入工具。

在与 AI 进行 Vibe Coding 时，打字往往跟不上思维的速度，难以完整、流畅地表达你的想法。而说话是最自然的思考方式——**Vibe Input** 让你直接对着手机说出 idea，文字即刻出现在电脑的光标处，帮你用最自然的方式与 AI 对话。

利用手机自带的语音输入法（iOS/Android），无需部署语音模型、无需调用付费 API，零成本实现高质量的语音转文字输入。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16-green.svg)

## ✨ 特性

- **跨平台**：支持 macOS、Windows、Linux。
- **零 App 安装**：手机端无需下载任何 App，扫描二维码直接使用（纯 Web 实现）。
- **极速上屏**：利用局域网传输 + 系统原生粘贴，毫秒级响应。
- **隐私安全**：数据仅在局域网内传输，不经过任何第三方服务器。
- **可编辑**：手机端提供大文本框，语音识别后可确认或修改，再一键发送。
- **无缝衔接**：自动适配中文/特殊字符，不受电脑端输入法状态（中/英）影响。

## 🛠️ 前置要求

- **Node.js** v16 或更高版本。
- 手机和电脑需连接到 **同一个 WiFi**。
- 各平台额外依赖：

| 平台 | 剪贴板 | 按键模拟 | 备注 |
|------|--------|---------|------|
| **macOS** | `pbcopy`（系统自带） | `osascript`（系统自带） | 需授权「辅助功能」权限 |
| **Windows** | `PowerShell`（系统自带） | `SendKeys`（系统自带） | 可能需要管理员权限运行 |
| **Linux** | `xclip` 或 `xsel` | `xdotool` | 需安装：`sudo apt install xdotool xclip` |

## 📦 安装与运行

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/vibe-input.git
   cd vibe-input
   ```

2. **安装依赖**
   ```bash
   npm install
   ```
   > 仅依赖 `express` 和 `qrcode-terminal`，非常轻量。

3. **Linux 用户需额外安装系统工具**
   ```bash
   sudo apt install xdotool xclip
   ```

4. **启动服务**
   ```bash
   npm start
   ```

5. **系统权限设置**（仅首次需要）

   <details>
   <summary><b>macOS</b></summary>

   打开 **系统设置** → **隐私与安全性** → **辅助功能** → 勾选你的终端应用（Terminal / iTerm / VS Code）。
   </details>

   <details>
   <summary><b>Windows</b></summary>

   如遇粘贴失败，请 **以管理员身份** 运行命令提示符或 PowerShell。
   </details>

   <details>
   <summary><b>Linux</b></summary>

   确保 `xdotool` 和 `xclip` 已安装，且桌面环境为 X11。Wayland 环境下可能需要额外配置。
   </details>

## 📱 使用指南

1. 服务启动后，终端会显示一个 **二维码**。
2. 使用手机相机或微信扫描二维码。
3. 手机浏览器打开页面，点击文本框。
4. 使用键盘上的 **麦克风图标** 开始语音输入。
5. 确认文字无误后，点击 **「发送到电脑」**。
6. 文字将出现在你电脑当前光标闪烁的位置！

## ❓ 常见问题

**Q: 扫码后无法打开网页？**
- 检查手机和电脑是否在同一 WiFi 下。
- 检查电脑防火墙是否拦截了 3000 端口。
- 尝试在手机浏览器手动输入终端显示的 URL (如 `http://192.168.1.x:3000`)。

**Q: 手机显示发送成功，但电脑没反应？**
- 检查终端是否有报错信息。
- **macOS**：终端没有「辅助功能」权限。请前往系统设置授权，并重启终端。
- **Windows**：尝试以管理员身份运行终端。
- **Linux**：确认 `xdotool` 和 `xclip` 已安装（`which xdotool xclip`）。
- 确保电脑光标焦点在一个可输入的编辑框内。

**Q: 二维码生成的 IP 地址不对？**
- 程序会自动过滤虚拟网卡（如 ZeroTier/Docker），优先选择物理网卡。如果有误，请手动查看本机 IP 并在手机输入。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
