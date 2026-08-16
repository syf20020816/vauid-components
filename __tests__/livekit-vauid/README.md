# livekit-vauid

vauid-components 组件库的 LiveKit 集成测试项目（Next.js 16 + React 19）。

## 功能

- **Prejoin**：输入房间名 → 摄像头/麦克风预览 → Join（使用 `vauid-components/prejoin`）
- **房间页**：本地/远端视频网格 + 控制栏（使用 `vauid-components/controller` 与 `vauid-components/participant/num`）
- **Token 服务**：`/api/token` 服务端用 `livekit-server-sdk` 生成接入 token，房间由首个参与者加入时自动创建

## 快速开始

```bash
# 1. 使用项目指定的 Node 版本（Next.js 16 要求 >= 20.9）
nvm use

# 2. 安装依赖
pnpm install

# 3. 配置环境变量（从 LiveKit Cloud 项目设置获取）
cp .env.example .env
# LIVEKIT_API_KEY=xxx
# LIVEKIT_API_SECRET=xxx
# LIVEKIT_URL=wss://your-livekit-server.com

# 4. 启动
pnpm dev
# 打开 http://localhost:3000
```

## 项目结构

```
app/
  page.tsx            # 主页状态机：未加入 → Prejoin，已加入 → Room
  pages/prejoin.tsx   # Prejoin 页面：连接房间 + 发布本地音视频
  pages/room.tsx      # 房间页面：视频网格 + Controller 控制栏
  api/token/route.ts  # 服务端生成 LiveKit token
lib/livekit.ts        # livekit-client 连接辅助（connectRoom / enableCamera / ...）
```

## 组件库联动

`vauid-components/*` 通过 webpack alias / tsconfig paths 直接指向组件库源码（`../../components`），
改动组件库源码无需重新构建即可生效。
