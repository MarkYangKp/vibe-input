# 贡献指南

感谢你对 Vibe Input 的关注！这份文档将帮助你了解如何参与贡献，以及本项目的开发规范。

## 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境](#开发环境)
- [项目架构](#项目架构)
- [开发工作流](#开发工作流)
- [代码规范](#代码规范)
- [测试规范](#测试规范)
- [安全规范](#安全规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [发布流程](#发布流程)
- [许可证](#许可证)

## 行为准则

本项目遵循 [Contributor Covenant](https://www.contributor-covenant.org/) 行为准则。简单来说：

- 保持友善和包容
- 尊重不同观点
- 接受建设性批评
- 聚焦于对社区最有利的事情

违反行为准则的参与者可能会被移除出社区。

## 如何贡献

### 报告 Bug

1. 搜索 [Issues](https://github.com/MarkYangKp/vibe-input/issues) 确认该 Bug 未被报告
2. 使用 Bug Report 模板创建新 Issue
3. 包含以下信息：
   - **问题描述**：清晰描述发生了什么
   - **复现步骤**：具体操作步骤
   - **预期行为**：你期望发生什么
   - **实际行为**：实际发生了什么
   - **环境信息**：操作系统、Node.js 版本、Vibe Input 版本、连接方式
   - **截图/日志**（如有）

### 建议新功能

1. 搜索 Issues 确认该功能未被提出
2. 使用 Feature Request 模板创建 Issue
3. 描述：
   - 这个功能解决什么问题
   - 你期望的方案
   - 具体的用例场景

### 贡献代码

1. Fork 项目
2. 从 `develop` 分支创建功能分支
3. 编写代码和测试
4. 确保所有检查通过
5. 提交 PR 到 `develop` 分支

> 不确定从哪里开始？寻找标记为 `good first issue` 的 Issue。

## 开发环境

### 前置要求

| 工具 | 最低版本 | 说明 |
|------|----------|------|
| Node.js | 18+ | 运行环境和包管理 |
| npm | 9+ | 随 Node.js 一起安装 |

**移动端开发额外要求**：

| 工具 | 平台 | 说明 |
|------|------|------|
| Android Studio | 全平台 | Android 模拟器和 SDK |
| Xcode | 仅 macOS | iOS 模拟器和签名 |
| Capacitor CLI | 全平台 | 通过 `npx cap` 使用 |

### 环境搭建

```bash
# 1. 克隆仓库
git clone https://github.com/MarkYangKp/vibe-input.git
cd vibe-input

# 2. 安装所有依赖（workspaces）
npm install

# 3. 验证环境
npm run typecheck   # TypeScript 类型检查
npm run lint        # ESLint 检查
npm test            # 运行全部测试
```

### 常用命令

```bash
# ── 开发 ──────────────────────────
npm run dev              # 启动电脑端服务器（自动重启）
npm run build:app        # 构建手机 APP
npm run cap:sync         # 同步 Capacitor 配置

# ── 质量检查 ──────────────────────
npm run typecheck        # 全项目类型检查
npm run lint             # 全项目 ESLint 检查
npm test                 # 运行全部测试

# ── 构建 ──────────────────────────
npm run build            # 构建所有产物
npm run build:server     # 仅构建电脑端

# ── 移动端 ────────────────────────
npm run cap:android      # 在 Android Studio 中打开
npm run cap:ios          # 在 Xcode 中打开

# ── 调试 ──────────────────────────
VIBE_INPUT_DEBUG=1 npm run dev    # 启用详细日志
```

## 项目架构

Vibe Input 是一个 **npm workspaces monorepo**，包含三个包：

```
vibe-input/
├── app/                          # 手机APP（React + Vite + Capacitor 6）
│   ├── src/
│   │   ├── components/          # 可复用 UI 组件
│   │   │   ├── DeviceCard.tsx   #   设备卡片组件
│   │   │   ├── ErrorBoundary.tsx #   错误边界
│   │   │   └── PreviewOverlay.tsx # AI 整理预览弹窗
│   │   ├── pages/               # 页面级组件
│   │   │   ├── DeviceListPage.tsx  # 设备列表
│   │   │   ├── AddDevicePage.tsx   # 添加设备
│   │   │   ├── InputPage.tsx       # 文本输入
│   │   │   └── SettingsPage.tsx    # 设置
│   │   ├── hooks/               # 自定义 React Hooks
│   │   │   ├── useApi.ts        #   API 调用（含 loading/error 状态）
│   │   │   ├── useDevices.ts    #   设备管理
│   │   │   ├── useTheme.ts      #   主题切换
│   │   │   └── useToast.ts      #   消息提示
│   │   ├── services/            # 服务层
│   │   │   ├── api.ts           #   HTTP 请求封装
│   │   │   └── storage.ts       #   本地持久化存储
│   │   ├── store/               # 全局状态
│   │   │   └── AppContext.tsx   #   Context + useReducer
│   │   └── styles.css           # 全局样式
│   ├── capacitor.config.ts
│   └── package.json
│
├── server/                       # 桌面端 Node.js 服务器
│   ├── src/
│   │   ├── vibe-input.ts        # HTTP 服务器（路由、认证、剪贴板）
│   │   ├── config.ts            # 配置文件管理（~/.vibe-input/）
│   │   ├── llm.ts               # LLM API 调用（OpenAI 兼容）
│   │   ├── setup.ts             # CLI 交互式配置向导
│   │   └── prompt.txt           # 默认系统提示词
│   ├── test/                    # Node.js Test Runner 测试
│   └── package.json
│
├── shared/                       # 共享 TypeScript 类型（@vibe-input/shared）
│   ├── types.ts                 # Device, ApiResponse, LLMConfig 等
│   └── package.json
│
├── package.json                  # 根配置（workspaces）
├── tsconfig.json                 # TypeScript 项目引用
├── eslint.config.mjs             # ESLint 9 flat config
├── README.md                     # 使用文档
├── CONTRIBUTING.md               # 本文档
└── LICENSE                       # MIT 许可证
```

### 架构设计原则

1. **关注点分离**：组件只负责 UI，hooks 封装业务逻辑，services 处理 I/O
2. **单一数据流**：全局状态通过 Context + useReducer 管理，单向数据流
3. **不可变性**：所有状态更新返回新对象，不修改原对象
4. **类型安全**：所有公共 API 有显式类型，`shared/types.ts` 是类型的单一事实来源
5. **防御性编程**：所有 I/O 操作有 try-catch，所有用户输入有验证

### 数据流

```
手机 App                        桌面服务器
┌──────────┐                   ┌──────────────┐
│  InputPage │── POST /api/type ──→│  copyToClipboard │
│            │                   │  simulatePaste   │
│            │── POST /api/polish →│  llm.polishText  │
│            │←── JSON response ──│                  │
│            │── GET /api/config ──→│  config.llm      │
└──────────┘                   └──────────────┘
      │                                │
      │  X-Pairing-Token               │  配对令牌
      │  (QR 码扫码获取)                │  (启动时生成)
      │                                │
      └──────── 同一局域网 ─────────────┘
```

## 开发工作流

### 分支策略

本项目采用简化版 **Git Flow**：

```
main ─────●──────────●──────────●──────  (稳定发布)
           ╲          ╲          ╲
develop ────●────●─────●────●─────●────  (集成分支)
              ╲    ╲     ╲    ╲
feature/xxx ──●     fix/yyy ──●          (功能/修复分支)
```

| 分支 | 用途 | 直接提交 | 说明 |
|------|------|----------|------|
| `main` | 生产发布 | ❌ 仅通过 PR 从 develop 合并 | 始终可部署 |
| `develop` | 开发集成 | ❌ 仅通过 PR 合并 | 功能集成分支 |
| `feature/<name>` | 新功能 | ✅ | 从 develop 分出，PR 到 develop |
| `fix/<name>` | Bug 修复 | ✅ | 从 develop 分出，PR 到 develop |
| `docs/<name>` | 文档更新 | ✅ | 从 develop 分出，PR 到 develop |
| `refactor/<name>` | 重构 | ✅ | 从 develop 分出，PR 到 develop |
| `release/x.y.z` | 发布准备 | ✅ | 从 develop 分出，PR 到 main |

**外部贡献者：**
```bash
# Fork 后从 develop 创建分支
git checkout develop
git pull upstream develop
git checkout -b feature/my-feature
# ... 开发、测试 ...
# 提交 PR，目标分支选择 develop
```

**维护者：**
```bash
# 审核并合并 PR 到 develop
git checkout develop
git merge --no-ff feature/my-feature

# 发布时合并到 main
git checkout main
git merge --no-ff develop
git tag v2.1.0
```

### 开发循环

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 1. 编写   │───→│ 2. 运行   │───→│ 3. 实现   │───→│ 4. 重构   │
│    测试   │    │    测试   │    │    代码   │    │          │
│  (RED)   │    │  (FAIL)  │    │  (GREEN) │    │ (CLEAN) │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                     │
                     ┌───────────────────────────────┘
                     ▼
              ┌──────────┐    ┌──────────┐
              │ 5. 质量   │───→│ 6. 提交   │
              │    检查   │    │    代码   │
              └──────────┘    └──────────┘
```

每一步的具体操作：

```bash
# 1-2. 先写测试（TDD）
# 在 test/ 目录下编写测试文件

# 3. 运行测试确认失败
npm test

# 4. 实现功能使测试通过
npm test   # 确认通过

# 5. 质量检查
npm run typecheck   # 类型检查
npm run lint        # 代码规范
npm test            # 全部测试

# 6. 提交（提交到你的功能分支）
git add -A
git commit -m "feat(scope): description"

# 7. 推送并创建 PR（目标分支：develop）
git push origin feature/my-feature
# 在 GitHub 上创建 PR，base 选择 develop
```

### 本地测试桌面端服务器

```bash
# 1. 构建
npm run build:server

# 2. 启动
npm start

# 3. 在终端中查看二维码和配对码
# 手机 APP 扫描二维码或手动输入配对码即可连接
```

## 代码规范

### TypeScript

本项目使用 **strict 模式**，所有代码必须通过 `tsc --noEmit` 检查。

**类型注解**：
```typescript
// ✅ 公共 API 必须有显式类型
export function polishText(text: string, config: LLMConfig): Promise<string> { ... }

// ✅ 使用 interface 定义对象形状
interface Device {
  id: string;
  name: string;
  ip: string;
  port: number;
}

// ✅ 使用 type 定义联合类型
type Theme = 'system' | 'light' | 'dark';

// ❌ 避免 any
function getErrorMessage(error: any): string { ... }  // 错误

// ✅ 使用 unknown 并安全窄化
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return '未知错误';
}
```

**ESLint 规则**（见 `eslint.config.mjs`）：
- `@typescript-eslint/no-unused-vars`: warn（`_` 前缀的参数忽略）
- `@typescript-eslint/no-explicit-any`: warn
- 所有 `console.log` 允许（项目性质决定需要终端输出），但前端代码应避免

### React（app/ 目录）

**组件规范**：

```typescript
// ✅ 使用命名 interface 定义 props
interface DeviceCardProps {
  device: Device;
  onClick: () => void;
}

// ✅ 函数组件，不使用 React.FC
export function DeviceCard({ device, onClick }: DeviceCardProps) {
  return ( ... );
}
```

**Hooks 规范**：
- 自定义 Hook 必须以 `use` 开头（`useApi`, `useDevices`, `useTheme`, `useToast`）
- `useCallback` 的依赖数组必须包含所有引用的外部变量
- `useEffect` 返回清理函数以取消订阅/中止请求

```typescript
// ✅ 正确处理组件卸载
useEffect(() => {
  let cancelled = false;
  getConfig(device).then(result => {
    if (!cancelled && result.ok) {
      dispatch({ type: 'SET_LLM_CONFIGURED', payload: true });
    }
  });
  return () => { cancelled = true; };
}, [device]);
```

**状态管理**：
- 全局状态使用 Context + useReducer（`AppContext.tsx`）
- 组件本地状态使用 `useState`
- Reducer 必须是**纯函数**，不产生副作用
- 副作用（API 调用、存储读写）放在 hooks 或 services 中

**错误边界**：
- 每个页面应在 `ErrorBoundary` 包裹内
- 网络错误应在 hook 层处理，通过 toast 展示给用户

### Node.js（server/ 目录）

**模块组织**：
- `vibe-input.ts` — HTTP 服务器入口，路由分发
- 独立功能模块（`config.ts`, `llm.ts`, `setup.ts`）— 单一职责

**错误处理**：
```typescript
// ✅ 所有 async 操作有 try-catch
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  log('error', '操作失败', error);
  throw new Error('用户友好的错误信息');
}
```

**安全要求**：
- 所有 API 端点的输入必须验证（长度、格式、范围）
- LLM API Key 不记录到日志、不暴露到 GET /api/config 响应
- 配置文件存储权限为 0600

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `device-card.tsx`, `use-devices.ts` |
| 变量/函数 | camelCase | `getDevices`, `isConfigured` |
| 布尔变量 | `is`/`has`/`should`/`can` 前缀 | `isLoading`, `hasError`, `llmEnabled` |
| React 组件 | PascalCase | `DeviceCard`, `PreviewOverlay` |
| React Hooks | camelCase + `use` 前缀 | `useApi`, `useDevices` |
| 接口/类型 | PascalCase | `Device`, `ApiResponse`, `LLMConfig` |
| 常量 | UPPER_SNAKE_CASE | `MAX_BODY_SIZE`, `DEFAULT_TIMEOUT` |
| 枚举值 | UPPER_SNAKE_CASE | `'SET_DEVICES'`, `'SHOW_TOAST'` |
| CSS 类名 | kebab-case | `.device-card`, `.preview-overlay` |

### 文件组织

**多个小文件优于少量大文件**：
- 单文件目标 200-400 行，硬上限 800 行
- 按功能/领域组织，不是按文件类型
- 提取可复用工具函数到独立模块

**目录规范**：
- `components/` — 可复用的无状态/低状态 UI 组件
- `pages/` — 路由级别的页面组件（含业务逻辑）
- `hooks/` — 可复用的逻辑封装
- `services/` — I/O 层（API 调用、存储、剪贴板等）
- `store/` — 全局状态定义

### 不可变性

```typescript
// ❌ 直接修改
function updateDevice(device: Device, name: string): Device {
  device.name = name;
  return device;
}

// ✅ 返回新对象
function updateDevice(device: Device, name: string): Device {
  return { ...device, name };
}
```

## 测试规范

### 测试框架

| 包 | 框架 | 运行 |
|----|------|------|
| `server/` | Node.js Test Runner | `node --import tsx --test test/*.test.ts` |
| `app/` | Vitest + Testing Library | `npx vitest run` |

### 测试结构

使用 **AAA 模式**（Arrange-Act-Assert）：

```typescript
test('loadConfig should return default config when file does not exist', () => {
  // Arrange
  const config = loadConfig();

  // Act — (包含在 loadConfig 中)

  // Assert
  assert.equal(typeof config.llm.baseUrl, 'string');
  assert.equal(typeof config.llm.enabled, 'boolean');
});
```

### 测试命名

```typescript
// ✅ 描述行为
test('returns empty array when no devices are stored', () => {});
test('throws error when API key is missing', () => {});
test('falls back to system theme when no preference is saved', () => {});

// ❌ 过于笼统
test('test devices', () => {});
test('it works', () => {});
```

### 覆盖率要求

- 目标：**80%+** 代码覆盖率
- 新功能**必须**包含测试
- Bug 修复**应该**包含回归测试

### 必须测试的场景

1. **正常路径** — 预期输入产生预期输出
2. **边界条件** — 空值、极值、边界
3. **错误路径** — 网络失败、数据损坏、无效输入
4. **异步行为** — Promise 成功/失败、loading 状态

## 安全规范

Vibe Input 是一个局域网工具，但仍需注意以下安全要求：

### API 安全

- 所有写操作（POST /api/type, POST /api/polish, POST /api/config）必须验证 `X-Pairing-Token`
- 使用 `crypto.timingSafeEqual` 进行令牌比较（防时序攻击）
- Rate limiting 保护所有状态变更端点

### 密钥管理

```typescript
// ❌ 绝对不允许硬编码密钥
const apiKey = "sk-proj-xxxxx";

// ✅ 从配置文件读取，文件权限 0600
const config = loadConfig();
const apiKey = config.llm.apiKey;
```

- API Key 不出现在日志中
- API Key 不在 GET /api/config 响应中暴露
- 配置文件 `~/.vibe-input/config.json` 权限必须为 0600

### 输入验证

- 所有外部输入必须验证（文本长度、URL 格式、字段长度）
- 使用 `MAX_BODY_SIZE`（1MB）限制请求体
- 使用 `MAX_TEXT_LENGTH`（50000 字符）限制文本
- LLM 用户输入使用分隔符包裹防 prompt injection

### 安全检查清单

提交代码前确认：
- [ ] 无硬编码密钥或凭据
- [ ] 所有用户输入已验证
- [ ] 错误信息不泄露敏感数据
- [ ] 新 API 端点有认证和限流
- [ ] 文件写入使用了安全权限（0600/0700）

## 提交规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式。

### 格式

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(app): 添加扫码配对功能` |
| `fix` | Bug 修复 | `fix(server): 修复 Linux 剪贴板粘贴失败` |
| `docs` | 文档更新 | `docs: 更新 API 文档` |
| `style` | 代码格式（不影响逻辑） | `style: 统一缩进格式` |
| `refactor` | 重构（非新功能/非修 Bug） | `refactor(server): 提取路由处理模块` |
| `test` | 测试相关 | `test(app): 添加 DeviceCard 单元测试` |
| `chore` | 构建/工具/依赖 | `chore: 升级 TypeScript 到 6.0` |
| `perf` | 性能优化 | `perf(server): 优化剪贴板操作延迟` |
| `ci` | CI/CD 配置 | `ci: 添加 GitHub Actions 工作流` |

### Scope

| Scope | 说明 |
|-------|------|
| `app` | 手机 APP 相关 |
| `server` | 桌面服务器相关 |
| `shared` | 共享类型定义 |
| 空/无 | 影响全项目 |

### 规范要求

- Subject 使用**祈使语气**（"添加" 而不是 "添加了"）
- Subject 不超过 72 个字符
- Body 解释**为什么**做这个变更，而不是怎么做的
- 关联 Issue 使用 `Fixes #123` 或 `Refs #123`

## Pull Request 流程

### 提交 PR

1. 确保分支基于最新的 `develop`
2. 完成代码和测试
3. 通过所有质量检查
4. 推送分支并创建 PR（**目标分支选择 `develop`**）

### 提交前检查清单

```
□ 代码通过 TypeScript 类型检查 (npm run typecheck)
□ 代码通过 ESLint 检查 (npm run lint)
□ 所有测试通过 (npm test)
□ 新功能包含测试
□ 文档已更新（如需要）
□ 无 console.log 调试残留
□ Commit message 符合 Conventional Commits
□ 已从 develop 合并最新代码，无冲突
```

### PR 标题

```
feat(app): 添加设备扫码配对功能
fix(server): 修复 POST /api/config baseUrl 验证
```

### PR 描述模板

```markdown
## Summary
简要描述这个 PR 做了什么

## Related Issue
Fixes #123

## Changes
- 具体变更 1
- 具体变更 2

## Screenshots (if UI changes)
截图

## Test Plan
- [ ] typecheck 通过
- [ ] lint 通过
- [ ] 测试通过
- [ ] 手动测试完成
```

### Code Review

PR 提交后将进行 Code Review：

| 严重程度 | 含义 | 处理 |
|----------|------|------|
| 🔴 CRITICAL | 安全漏洞或数据丢失 | **必须修复** |
| 🟠 HIGH | Bug 或重大质量问题 | **应修复** |
| 🟡 MEDIUM | 可维护性问题 | 建议修复 |
| 🟢 LOW | 风格或建议 | 可选 |

### 合并条件

- 至少 1 位维护者 Approve
- 所有 CI 检查通过
- 无 CRITICAL 或 HIGH 级别的 Review 问题
- 合并到 `develop` 由维护者执行

## 发布流程

仅维护者可执行发布。发布是将 `develop` 的已验证代码合并到 `main` 并打 tag。

```bash
# 1. 确保 develop 最新且通过所有检查
git checkout develop
git pull origin develop
npm run typecheck && npm run lint && npm test

# 2. 创建 release 分支
git checkout -b release/2.1.0 develop

# 3. 更新版本号
# 修改根 package.json 和 app/package.json 中的 version

# 4. 提交版本更新
git add -A
git commit -m "chore: bump version to 2.1.0"

# 5. 合并到 main
git checkout main
git merge --no-ff release/2.1.0
git tag -a v2.1.0 -m "v2.1.0"

# 6. 合并回 develop（确保 develop 包含版本提交）
git checkout develop
git merge --no-ff release/2.1.0

# 7. 删除 release 分支
git branch -d release/2.1.0

# 8. 推送
git push origin main develop --tags
```

版本号遵循 [Semantic Versioning](https://semver.org/)（MAJOR.MINOR.PATCH）：
- **MAJOR**: 不兼容的 API 变更
- **MINOR**: 向后兼容的新功能
- **PATCH**: 向后兼容的 Bug 修复

## 许可证

Vibe Input 使用 [MIT License](./LICENSE)。

贡献代码即表示你同意在该许可证下发布你的贡献。

---

**感谢你的贡献！** 
