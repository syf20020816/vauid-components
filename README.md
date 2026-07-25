# Vauid Components

高性能 Web 音视频协作组件库，专为音视频会议、远程协作、在线教育等场景设计。提供从布局引擎到媒体渲染、交互控制的全套组件解决方案。

## 核心特性

- **虚拟布局引擎**：DOM 恒定 + Transform 驱动，布局切换时 iframe/视频零重载、60fps 丝滑过渡
- **智能末尾填补**：删除实体时用末尾实体填补空缺，Transform 计算量从 O(N) 降至 O(1)
- **Web Worker 计算**：布局计算异步执行，不阻塞主线程，超时自动回退到同步计算
- **多端适配**：桌面端/移动端差异化默认参数，容器尺寸变化时自动重算
- **框架无关引擎**：纯计算核心，可在 React/Vue/原生 JS 中使用
- **开箱即用组件**：Tile（Video/Audio/Note）、控制栏、参会者列表、状态指示等
- **组件文档**：使用 Dumi 构建，提供完整的组件示例和 API 文档

## 组件列表

### 布局组件

| 组件 | 描述 |
|------|------|
| `Layout` | 虚拟布局容器，支持 Grid / Focus / Fullscreen 模式 |
| `useEngine` | Layout 引擎 Hook，管理布局状态和操作 |
| `LayoutTypes` / `DeviceTypes` | 布局类型和设备类型枚举 |

### 媒体 Tile

| 组件 | 描述 |
|------|------|
| `VideoTile` | 视频渲染单元，支持屏幕分享标识 |
| `AudioTile` | 音频渲染单元，带波形动画 |
| `NoteTile` | 文本/备注 Tile，支持 Markdown 渲染 |

### 控制器

| 组件 | 描述 |
|------|------|
| `Controller` | 会议控制栏，包含设备切换、退出按钮 |
| `Controller.Leave` | 退出房间按钮 |
| `Controller.Device` | 设备选择触发器（麦克风/摄像头/屏幕共享） |

### 参会者

| 组件 | 描述 |
|------|------|
| `ParticipantItem` | 参会者列表项，含头像、名称、角色、音视频状态 |
| `ParticipantName` | 参会者名称，带音视频状态图标 |
| `ParticipantNum` | 参会人数徽章 |
| `Avatar` | 用户头像，支持文字和图片 |
| `Role` | 角色标签（主持人/参会者/管理员/游客） |

### 状态指示

| 组件 | 描述 |
|------|------|
| `During` | 会议时长和录制状态 |
| `Focus` | 焦点状态指示 |
| `FullScreen` | 全屏切换按钮 |
| `RaiseHand` | 举手按钮，举手中显示警告色 |
| `NetworkStatus` | 网络信号强度（颜色分级，白色背景） |
| `NetworkUpload` / `NetworkDownload` | 上传/下载速率显示 |

### 通用 UI

| 组件 | 描述 |
|------|------|
| `Button` | 按钮，支持图标、尺寸、圆角 |
| `Tag` | 标签组件 |
| `Input` | 输入框，支持 TextArea / Password / Number |
| `Dropdown` | 下拉菜单，基于 @rc-component/trigger |
| `Trigger` | 选择触发器，带下拉选项 |
| `Icon` | 图标组件，基于 Lucide React |

### 工具

| 导出 | 描述 |
|------|------|
| `DEFAULT_COLORS` | 全局颜色配置，包含 status 颜色（success/warning/error/info）的多状态值 |

## 安装

```bash
pnpm install vauid-components
```

## 快速开始

### 基础用法

```tsx
import { Layout, useEngine, LayoutTypes, DeviceTypes } from 'vauid-components';
import { useRef, useEffect } from 'react';

function MyLayout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { engine, nodes } = useEngine();

  useEffect(() => {
    if (!containerRef.current) return;

    const entities = [
      { id: '1', name: 'Track 1' },
      { id: '2', name: 'Track 2' },
      { id: '3', name: 'Track 3' },
    ];

    engine.init(entities, containerRef.current, {
      pageSize: 6,
      layoutType: LayoutTypes.Grid,
      deviceType: DeviceTypes.Desktop,
    });
  }, [engine]);

  return (
    <div ref={containerRef}>
      <Layout
        nodes={nodes}
        renderEntity={(node) => (
          <div key={node.entityId}>
            <video src={`stream-${node.entityId}`} autoPlay muted />
          </div>
        )}
      />
    </div>
  );
}
```

### 焦点布局

```tsx
// 设置焦点实体，进入 Focus 布局
engine.focus(entity);

// 取消焦点，回到 Grid 布局
engine.unFocus();
```

### 设备适配

```tsx
// 切换到移动端，自动更新 pageSize=3, aspectRatio=9:16
engine.setDeviceType(DeviceTypes.Mobile, true);

// 切换到桌面端，自动更新 pageSize=6, aspectRatio=16:9
engine.setDeviceType(DeviceTypes.Desktop, true);
```

### Web Worker 计算

```tsx
engine.init(entities, container, {
  pageSize: 6,
  worker: {
    enabled: true,
    workerUrl: '/layout-worker.js',
    timeout: 5000, // 超时后自动回退到同步计算
  },
});
```

## 布局模式

| 模式 | 描述 | 适用场景 |
|------|------|----------|
| **Grid** | 标准网格布局，自动计算最优行列数 | 多人会议、画廊视图 |
| **Focus** | 主视口 + rail 布局，桌面端 rail 在左，移动端 rail 在下 | 演讲者模式、焦点跟踪 |
| **Fullscreen** | 单个实体占满容器 | 全屏查看、沉浸式体验 |

## 配置参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `pageSize` | `number` | 桌面 6 / 移动 3 | 每页显示实体数量 |
| `railWidth` | `number` | `220` | 桌面端 rail 区域宽度 |
| `railHeight` | `number` | `140` | 移动端 rail 区域高度 |
| `fixedSize` | `boolean` | `true` | 是否保持固定宽高比 |
| `gridFixedSize` | `boolean` | `false` | Grid 布局是否保持固定宽高比 |
| `aspectRatio` | `{ w, h }` | 桌面 16:9 / 移动 9:16 | 实体宽高比 |
| `smart` | `boolean` | `true` | 是否开启智能末尾填补 |
| `layoutType` | `LayoutType` | `Grid` | 布局模式 |
| `deviceType` | `DeviceType` | `Desktop` | 设备类型 |

## API

### Engine 方法

```typescript
// 状态操作
engine.focus(entity);           // 设置焦点
engine.unFocus();               // 取消焦点
engine.setFullScreen(true);     // 全屏模式
engine.setPage(2);              // 切换页码
engine.nextPage();              // 下一页
engine.prevPage();              // 上一页
engine.setEntities(entities);   // 更新实体列表
engine.removeEntity(id);        // 删除实体
engine.setLayoutType(type);     // 切换布局类型
engine.setDeviceType(type, auto); // 切换设备类型
engine.setAspectRatio(w, h);    // 设置宽高比

// 动画配置
engine.setAnimationOptions("enableFlip");
engine.setAnimationOptions("normal");
engine.setAnimationOptions("define", { transitionDuration: 300 });

// 生命周期监听
engine.on('onUpdate', () => { /* 状态更新 */ });
engine.on('onResize', (w, h) => { /* 容器尺寸变化 */ });

// 获取结果
const nodes = engine.getNodes();
```

## 架构

```text
┌─────────────────────────────────────────────────────────┐
│                   表现层 (UI Components)                  │
│  - Layout / Tile / 白板 / 控制栏 / 交互层 / 特效层        │
└───────────────────────────┬─────────────────────────────┘
                            │ (useEngine Hook 等)
┌───────────────────────────▼─────────────────────────────┐
│                   状态管理层 (Engine)                     │
│  - 状态管理 / 智能填补 / 动画配置 / Worker 代理           │
└───────────────────────────┬─────────────────────────────┘
                            │ (调用)
┌───────────────────────────▼─────────────────────────────┐
│                 布局计算层 (LayoutCompute)                │
│  - Grid / Focus / Fullscreen 布局计算                    │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                   基础设施层                              │
│  - ResizeObserver / LRU Cache / Web Worker               │
└─────────────────────────────────────────────────────────┘
```

## 项目结构

```text
components/
├── layout/              # 布局模块
│   ├── engine/          # 布局引擎核心
│   │   ├── compute.ts   # 布局计算逻辑
│   │   ├── cache.ts     # LRU 缓存
│   │   ├── index.ts     # Engine 主类
│   │   ├── stylesheet.ts # 样式生成
│   │   ├── watcher/     # 尺寸/节点监听器
│   │   └── worker/      # Web Worker 相关
│   ├── hooks/           # React Hooks
│   │   └── useEngine.ts
│   ├── types.ts         # 类型定义
│   ├── entity.tsx       # Entity 渲染组件
│   └── index.tsx        # Layout 组件
├── tile/                # 媒体 Tile
│   ├── video.tsx        # 视频 Tile
│   ├── auido.tsx        # 音频 Tile
│   ├── note.tsx         # 备注 Tile
│   ├── iframe.tsx       # 内嵌网页 Tile
│   └── types.ts
├── controller/          # 控制器
│   ├── index.tsx        # Controller 主组件
│   ├── device.tsx       # 设备选择器
│   └── leave.tsx        # 退出按钮
├── participant/         # 参会者相关
│   ├── avatar.tsx       # 头像
│   ├── item.tsx         # 参会者列表项
│   ├── name.tsx         # 名称组件
│   ├── num.tsx          # 人数徽章
│   ├── role.tsx         # 角色标签
│   └── hooks/           # 自定义 Hooks
├── status/              # 状态指示
│   ├── during.tsx       # 会议时长
│   ├── focus.tsx        # 焦点状态
│   ├── fullScreen.tsx   # 全屏切换
│   ├── raise.tsx        # 举手按钮
│   ├── network.tsx      # 网络状态
│   └── tooltip.tsx      # 提示组件
├── button/              # 按钮组件
├── input/               # 输入框系列
├── tag/                 # 标签组件
├── dropdown/            # 下拉菜单
├── trigger/             # 选择触发器
├── svg/                 # 图标定义
├── style/               # 全局样式和主题
│   ├── global.scss      # SCSS 主题变量
│   └── global.ts        # TS 主题变量
└── std/                 # 标准工具函数
```

## 开发

```bash
pnpm install          # 安装依赖
pnpm dev              # 启动开发服务器
pnpm build            # 构建组件库
pnpm test             # 运行测试
pnpm lint             # 代码检查
pnpm docs:dev         # 启动文档开发服务器
pnpm docs:build       # 构建文档
```

## 文档

组件文档使用 [Dumi](https://d.umijs.org/) 构建，提供完整的组件示例和 API 文档。

- **文档地址**：访问 `pnpm docs:dev` 启动后在浏览器打开
- **文档构建**：`pnpm docs:build` 将文档输出到 `docs-dist` 目录
- **GitHub Pages 部署**：将 `docs-dist` 目录部署到 GitHub Pages 即可

## License

MIT
