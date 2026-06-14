# 布局引擎 - 当前实现状态

## 1. 已实现的核心能力

### 1.1 框架无关的布局计算引擎

- **纯计算类 (LayoutCompute)**：所有数据通过方法参数传入，不维护任何内部状态，可在任何框架（React/Vue/原生 JS）中使用
- **统一状态管理 (Engine)**：所有布局状态（实体、尺寸、布局类型、分页等）由 Engine 统一管理，各处理器仅通过参数接收数据
- **生命周期事件系统**：支持 `onInit`、`onResize`、`onUpdate`、`onEntityUpdate`、`onDestroy` 等生命周期回调

### 1.2 布局模式

- **Grid 布局**：标准网格布局，根据容器尺寸和实体数量自动计算行列数
- **Focus 布局**：主视口 + 侧边栏（rail）布局
  - 桌面端：主视口在右，rail 在左垂直排列
  - 移动端：主视口在上，rail 在下水平排列
- **Fullscreen 模式**：单个实体占满整个容器

### 1.3 尺寸与宽高比控制

- **fixedSize 模式**：
  - Grid：根据容器尺寸自动修正为标准宽高比（16:9、4:3 等），单元格保持固定比例
  - Focus rail：高度 = `(容器高度 - gap) / (pageSize - 1)`，宽度根据宽高比推导
- **非 fixedSize 模式**：单元格均分容器空间，不限制宽高比
- **railWidth 配置**：可自定义 rail 宽度，默认 140px

### 1.4 分页与可见性

- **虚拟分页**：支持海量实体，通过 `pageSize` 控制每页显示数量
- **hidden 字段**：节点包含 `hidden` 属性，标识实体是否在当前页（用于渲染层控制显隐）
- **页码导航**：支持 `nextPage()`、`prevPage()`、`setPage()` 等方法

### 1.5 容器尺寸监听

- **LayoutSizeWatcher**：使用 `ResizeObserver` 监听容器尺寸变化
- **防抖机制**：100ms 防抖，避免频繁触发计算
- **无状态设计**：不存储容器引用，仅负责监听和报告尺寸

### 1.6 节点变化检测

- **LayoutNodeWatcher**：对比新旧节点，检测新增、删除、物理/非物理更新
- **智能缓存**：非当前页节点变化不触发重新计算，页码变化可快速重用缓存

### 1.7 布局缓存

- **LayoutCache**：基于容器尺寸、实体数量、布局类型等维度生成缓存键
- **LRU 淘汰策略**：支持缓存数量限制和过期时间
- **尺寸比例推导**：支持基于缓存结果快速推导新尺寸下的节点布局

### 1.8 样式表

- **EntityStyleSheet**：根据节点布局属性生成完整样式（transform、opacity、pointerEvents、transition 等）
- **框架无关**：使用 `LayoutStyleProperties` 接口，不依赖任何框架的 CSS 类型

### 1.9 React 适配层

- **useEngine Hook**：将 Engine 与 React 组件集成，管理引擎初始化和状态同步
- **自动渲染**：引擎计算结果自动同步到 React 状态

---

## 2. 当前架构

```text
┌─────────────────────────────────────────────────────────┐
│                   表现层 (UI Components)                  │
│  - TestLayout (测试页面)                                  │
│  - Tile (复用组件，接收 x/y/width/height/hidden 等属性)   │
└───────────────────────────┬─────────────────────────────┘
                            │ (useEngine Hook)
┌───────────────────────────▼─────────────────────────────┐
│                   状态管理层 (Engine)                     │
│  - 维护所有布局状态 (entities, size, layoutType, page...) │
│  - 提供状态更新接口 (focus, setPage, setEntities...)      │
│  - 触发计算并缓存结果                                     │
└───────────────────────────┬─────────────────────────────┘
                            │ (调用)
┌───────────────────────────▼─────────────────────────────┐
│                 布局计算层 (LayoutCompute)                │
│  - 纯静态类，无状态                                       │
│  - computeGridLayout / computeFocusLayout                 │
│  - 支持 fixedSize 宽高比约束                              │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                   监视器层 (Watchers)                     │
│  - LayoutSizeWatcher: ResizeObserver 监听容器尺寸         │
│  - LayoutNodeWatcher: 检测节点增删改变化                  │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                   缓存层 (LayoutCache)                    │
│  - LRU 缓存策略                                           │
│  - 尺寸比例快速推导                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 与 README 设计的差异

| README 设计 | 当前实现 | 状态 |
|:---|:---|:---|
| Web Worker 异步计算 | 主线程同步计算 | ❌ 未实现 |
| 智能末尾填补算法 | 标准分页布局 | ❌ 未实现 |
| 0 帧渲染（暂停视频解码） | 仅 `hidden` 字段标识 | ⚠️ 部分实现 |
| 弱网自适应策略 | 无 | ❌ 未实现 |
| DOM 恒定 + Transform 驱动 | 支持，但需渲染层配合 | ⚠️ 部分实现 |
| 框架无关设计 | ✅ 已实现 | ✅ 已完成 |
| LRU 缓存 | ✅ 已实现 | ✅ 已完成 |
| ResizeObserver 防抖 | ✅ 已实现 | ✅ 已完成 |
| 虚拟分页 | ✅ 已实现 | ✅ 已完成 |

---

## 4. 待实现的功能

### 高优先级
- [ ] **Web Worker 计算**：将 LayoutCompute 移至 Worker，避免阻塞主线程
- [ ] **智能末尾填补算法**：优化 Focus 布局切换时的 Transform 计算量
- [ ] **0 帧渲染控制**：在渲染层实现非当前页 Tile 的视频暂停/恢复

### 中优先级
- [ ] **弱网自适应策略**：与流控模块联动，自动降级布局
- [ ] **布局切换动画**：使用 CSS transition 实现平滑过渡
- [ ] **更完善的缓存策略**：支持基于历史尺寸的快速推导

### 低优先级
- [ ] **更多布局模式**：如 Sidebar、Custom 等
- [ ] **拖拽排序**：支持用户手动调整实体位置
- [ ] **键盘导航**：支持键盘切换焦点实体

---

## 5. 核心 API

### Engine 初始化
```typescript
const engine = new Engine<Entity>();
engine.init(entities, container, {
  pageSize: 6,
  railWidth: 140,
  fixedSize: true,
  aspectRatio: { w: 16, h: 9 },
  layoutType: LayoutTypes.Grid,
  deviceType: DeviceTypes.Desktop,
});
```

### 状态更新
```typescript
engine.focus(entity);        // 设置焦点实体（进入 Focus 布局）
engine.unFocus();            // 取消焦点（回到 Grid 布局）
engine.setFullScreen(true);  // 全屏模式
engine.setPage(2);           // 切换页码
engine.nextPage();           // 下一页
engine.prevPage();           // 上一页
engine.setEntities(newEntities); // 更新实体列表
engine.setLayoutType(LayoutTypes.Focus); // 切换布局类型
engine.setDeviceType(DeviceTypes.Mobile); // 切换设备类型
```

### 生命周期监听
```typescript
engine.on('onInit', () => { /* 初始化完成 */ });
engine.on('onResize', (width, height) => { /* 容器尺寸变化 */ });
engine.on('onUpdate', () => { /* 任何状态更新 */ });
engine.on('onEntityUpdate', (type) => { /* 实体增删改 */ });
engine.on('onDestroy', () => { /* 引擎销毁 */ });
```

### 获取计算结果
```typescript
const nodes = engine.getNodes(); // Map<entityId, LayoutNode>
// LayoutNode 包含: x, y, width, height, zIndex, hidden, styleSheet, area, page, isFocus
```
