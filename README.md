# Vauid Components

高性能 Web 音视频协作组件库，专为音视频会议、远程协作、在线教育等场景设计。提供从布局引擎到媒体渲染、交互控制的全套组件解决方案。

## 核心特性

- **虚拟布局引擎**：DOM 恒定 + Transform 驱动，布局切换时 iframe/视频零重载、60fps 丝滑过渡
- **智能末尾填补**：删除实体时用末尾实体填补空缺，Transform 计算量从 O(N) 降至 O(1)
- **Web Worker 计算**：布局计算异步执行，不阻塞主线程，超时自动回退到同步计算
- **多端适配**：桌面端/移动端差异化默认参数，容器尺寸变化时自动重算
- **框架无关引擎**：纯计算核心，可在 React/Vue/原生 JS 中使用
- **开箱即用组件**：Tile（Video/Audio/Iframe/Canvas）、白板、控制栏、特效层等

## 组件列表

### 布局组件

| 组件 | 描述 |
|------|------|
| `Layout` | 虚拟布局容器，支持 Grid / Focus / Fullscreen 模式 |
| `Tile` | 媒体渲染单元，支持 Video / Audio / Iframe / Canvas 等多种内容类型 |

### 计划中组件

- **白板组件**：协作白板，支持画笔、形状、文字等
- **控制栏**：退出连接、麦克风切换、摄像头切换等
- **交互层**：鼠标映射层、标注层
- **特效层**：虚拟背景、滤镜等

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
        tileStyle={(node) => ({
          /* 自定义样式 */
        })}
        renderTile={(node) => (
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
├── layout/              # 布局模块（已完成）
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
│   └── README.md        # 布局引擎详细文档
├── tile/                # Tile 组件
│   └── index.tsx
├── whiteboard/          # 白板组件（计划中）
├── controls/            # 控制栏组件（计划中）
├── interaction/         # 交互层组件（计划中）
├── effects/             # 特效层组件（计划中）
└── _std/                # 标准工具函数
    └── index.ts
```

## 开发

```bash
pnpm install    # 安装依赖
pnpm dev        # 启动开发服务器
pnpm build      # 构建
pnpm test       # 运行测试
pnpm lint       # 代码检查
```

## License

MIT
