# 高性能虚拟布局引擎 - 架构与设计文档

## 1. 核心设计理念

1. **DOM 恒定与虚拟映射**：所有 Tile 在 DOM 中始终存在，视觉上的"网格"或"主视口"仅是通过 CSS `transform` 映射出的虚拟位置。
2. **GPU 加速与主动分层**：布局切换不触发 Reflow，仅触发 Composite。通过 `will-change: transform` 主动将 Tile 提升为独立的合成层，由 GPU 处理位移。
3. **智能末尾填补算法**：删除实体时，由当前页/末页的最后一个实体直接填补空缺，将 Transform 计算量从 O(N) 降至 O(1)。
4. **按需渲染与 0 帧策略**：非当前页的 Tile 设置为 `opacity: 0` 且 `pointer-events: none`，使用者可据此暂停视频解码。
5. **异步计算与缓存**：布局计算可剥离至 Web Worker，避免阻塞主线程；计算结果基于容器尺寸、实体数量、布局模式等维度缓存。

---

## 2. 系统架构

```text
┌─────────────────────────────────────────────────────────┐
│                   表现层 (UI Components)                  │
│  - Layout (外层封装，支持 forwardRef)                     │
│  - Tile (复用组件，接收 x/y/width/height/hidden 等属性)   │
└───────────────────────────┬─────────────────────────────┘
                            │ (useEngine Hook)
┌───────────────────────────▼─────────────────────────────┐
│                   状态管理层 (Engine)                     │
│  - 维护所有布局状态 (entities, size, layoutType, page...) │
│  - 提供状态更新接口 (focus, setPage, setEntities...)      │
│  - 智能末尾填补 (applySmartFillBeforeCompute)             │
│  - 动画配置管理 (setAnimationOptions/getAnimationOptions) │
│  - Worker 代理 (LayoutWorkerProxy)                        │
└───────────────────────────┬─────────────────────────────┘
                            │ (调用)
┌───────────────────────────▼─────────────────────────────┐
│                 布局计算层 (LayoutCompute)                │
│  - 纯静态类，无状态                                       │
│  - computeGridLayout / computeFocusLayout                 │
│  - 支持 fixedSize 宽高比约束                              │
│  - 支持 gridFixedSize 动态行列计算                        │
│  - 智能分页切片 (getEntitiesForCurrentPage)               │
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

## 3. 布局模式

### 3.1 Grid 布局

标准网格布局，根据容器尺寸和实体数量自动计算行列数。

- **动态行列计算**：根据容器宽高比和 pageSize 自动选择最优行列配置
- **gridFixedSize**：`false` 时实体均分容器空间，`true` 时保持固定宽高比
- **响应式适配**：容器尺寸变化时自动选择最优排列方式

### 3.2 Focus 布局

主视口 + 侧边栏（rail）布局。

- **桌面端**：主视口在右，rail 在左垂直排列
  - `railWidth` 控制 rail 区域宽度（默认 220px）
  - rail 实体宽度 = `railWidth`，高度根据宽高比推导
- **移动端**：主视口在上，rail 在下水平排列
  - `railHeight` 控制 rail 区域高度（默认 140px）
  - rail 实体宽度 = `主容器宽度 / (pageSize - 1)`，高度根据宽高比推导
  - Main 区域高度 = `容器高度 - rail 高度 - gap`

### 3.3 Fullscreen 模式

单个实体占满整个容器。

---

## 4. 设备适配

引擎根据设备类型自动调整默认参数：

| 参数 | 桌面端默认值 | 移动端默认值 |
|------|-------------|-------------|
| `pageSize` | 6 | 3 |
| `aspectRatio` | 16:9 | 9:16 |

```typescript
// 切换设备类型时自动更新默认参数
engine.setDeviceType(DeviceTypes.Mobile, true); // auto=true 时自动切换 pageSize 和 aspectRatio
```

---

## 5. 核心 API

### 初始化

```typescript
const engine = new Engine<Entity>();
await engine.init(entities, container, {
  pageSize: 6,
  railWidth: 220,       // 桌面端 rail 宽度
  railHeight: 140,      // 移动端 rail 高度
  fixedSize: true,      // 是否保持固定宽高比
  gridFixedSize: false, // Grid 布局是否保持固定宽高比
  aspectRatio: { w: 16, h: 9 },
  layoutType: LayoutTypes.Grid,
  deviceType: DeviceTypes.Desktop,
  smart: true,          // 是否开启智能末尾填补算法
  worker: {             // Web Worker 配置
    enabled: true,
    workerUrl: '/path/to/worker.js',
    timeout: 5000,
  },
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
engine.removeEntity(id);     // 删除实体（自动触发智能末尾填补）
engine.setLayoutType(LayoutTypes.Focus); // 切换布局类型
engine.setDeviceType(DeviceTypes.Mobile, true); // 切换设备类型（auto=true 自动更新默认参数）
engine.setAspectRatio(16, 9); // 设置宽高比
```

### 动画配置

```typescript
engine.setAnimationOptions("enableFlip");  // 启用翻转动画（默认）
engine.setAnimationOptions("normal");      // 普通过渡动画
engine.setAnimationOptions("define", {     // 自定义动画
  transitionDuration: 300,
  transitionEasing: "ease-in-out",
});
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

---

## 6. 智能末尾填补算法

### Grid 布局
- 当前页满且有下页时，删除任意实体 → 用末页最后一个实体填补被删除位置
- 当前页未满时，删除任意实体 → 用当前页最后一个实体填补被删除位置

### Focus 布局
- 当前页满且有下页时，删除非 focus 实体 → 用末页最后一个实体填补被删除位置
- 当前页未满时，删除非 focus 实体 → 用当前页最后一个实体填补被删除位置
- 删除 focus 实体 → 退回 Grid 布局，同样用末尾实体填补

**效果**：每次删除只移动 1 个非删除实体，Transform 计算量从 O(N) 降至 O(1)。

---

## 7. 已实现功能

### 核心布局与渲染
- [x] 虚拟布局引擎：支持 Grid, Focus, Fullscreen 模式无缝切换
- [x] DOM 恒定与 Transform 驱动：切换布局无 DOM 增删
- [x] 智能末尾填补算法：最小化布局切换时的 Transform 元素数量
- [x] GPU 主动分层：自动注入 `will-change: transform`

### 性能与资源管理
- [x] Web Worker 计算：布局计算异步执行，不阻塞主线程
- [x] LRU 计算结果缓存：相同配置下的计算结果快速返回
- [x] 自适应 Resize：内置 ResizeObserver，窗口变化时平滑过渡
- [x] 虚拟分页：支持海量实体，通过 pageSize 控制每页显示数量
- [x] **0 帧渲染控制**：由hidden属性暴露，使用时自行控制

### 设备适配
- [x] 桌面端/移动端差异化默认参数
- [x] railWidth（桌面端）/ railHeight（移动端）独立配置
- [x] 响应式网格布局：根据容器尺寸自动选择最优行列配置

### 动画系统
- [x] 三种预设动画类型：enableFlip / normal / define
- [x] 自定义动画参数支持

---

## 8. 待实现功能

### 中优先级
- [ ] **弱网自适应策略**：与流控模块联动，自动降级布局（已计划分离为独立模块）
- [ ] **更完善的缓存策略**：支持基于历史尺寸的快速推导

### 低优先级
- [ ] **更多布局模式**：如 Sidebar、Custom 等
- [ ] **拖拽排序**：支持用户手动调整实体位置
- [ ] **键盘导航**：支持键盘切换焦点实体
