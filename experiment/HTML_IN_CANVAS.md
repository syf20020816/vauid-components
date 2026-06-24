# HTML-in-Canvas 实验性文档

> 基于 PixiJS v8.19.0+ 的 HTML-in-Canvas 能力在 Vauid Components 中的应用评估

## 背景

PixiJS v8.19.0 引入了 `HTML-in-Canvas` 能力，允许将真实 DOM 元素渲染为 texture 并纳入 GPU 渲染管线。这意味着：
- HTML 元素可以保持交互能力（可编辑、可点击、CSS 动画继续运行）
- 同时被 PixiJS 当作纹理参与渲染（位移、缩放、滤镜、混合模式等）

## 适用场景分析

### ✅ 推荐使用

#### 1. 特效层（Effects Layer）⭐⭐⭐⭐⭐

**适用度：极高**

特效层是 HTML-in-Canvas 最自然的应用场景：

- **虚拟背景**：可以用 HTML 写背景选择器 UI，作为纹理融入渲染管线
- **滤镜效果**：对包含 HTML UI 的整个画面应用滤镜、混合模式
- **后处理效果**：模糊、色彩调整等 GPU 后处理可以作用于包含 HTML 的纹理

**原因：**
- 特效层天然需要 GPU 渲染能力
- 需要保持 UI 交互性的同时应用视觉效果
- PixiJS 的滤镜系统和后处理管线可以直接使用

**示例场景：**
```tsx
// 虚拟背景选择面板作为 HTML，渲染为 texture
// 然后对整个视频流 + UI 应用背景模糊效果
const bgPanel = document.createElement('div');
bgPanel.innerHTML = `
  <div class="bg-selector">
    <button data-bg="blur">模糊</button>
    <button data-bg="image">图片</button>
  </div>
`;

const sprite = Sprite.from(
  new HTMLSource({ resource: bgPanel, autoUpdate: true })
);
// 可以对 sprite 应用 PixiJS 滤镜
sprite.filters = [new BlurFilter()];
```

#### 2. 白板组件（Whiteboard）⭐⭐⭐⭐

**适用度：高**

- **工具栏 UI**：用 HTML 写画笔、颜色、形状选择器，作为纹理放在白板场景中
- **富文本标注**：HTML 的文本排版能力 + Canvas 的渲染能力
- **协作光标**：HTML 元素作为光标指示器，可以被 GPU 渲染管线处理

**原因：**
- 白板需要复杂的 UI 控件（工具选择、颜色面板等）
- 同时需要高性能的画布渲染
- HTML-in-Canvas 可以让两者无缝融合

#### 3. 交互层 - 标注功能（Interaction Layer - Annotation）⭐⭐⭐⭐

**适用度：高**

- **实时标注**：用 HTML 写标注工具 UI，渲染为 texture 后叠加在视频上
- **鼠标指示器**：自定义光标可以用 HTML 元素实现，保持交互性
- **标注面板**：标注类型选择、颜色选择等 UI

**原因：**
- 标注需要与视频画面合成
- 标注工具 UI 需要保持交互能力
- GPU 渲染可以保证标注与视频同步

#### 4. Tile 组件 - 覆盖层（Tile Overlay）⭐⭐⭐

**适用度：中等偏高**

- **参与者信息面板**：姓名、状态、网络质量等 UI 覆盖在视频上
- **控制按钮**：静音、关闭摄像头等按钮作为 overlay
- **状态指示器**：录音中、共享屏幕等状态

**原因：**
- Tile 是媒体渲染单元，经常需要 overlay UI
- 当前方案是 DOM 浮在 video 上，HTML-in-Canvas 可以让 overlay 真正融入渲染
- 需要对整个 tile（视频 + UI）应用统一效果时特别有用

**注意事项：**
- 简单的 overlay 用当前 DOM 方案已经足够
- 只有在需要 GPU 效果（滤镜、混合模式、统一导出）时才需要 HTML-in-Canvas

### ⚠️ 谨慎使用

#### 5. 布局组件（Layout）⭐⭐

**适用度：中等**

**可能的用途：**
- 布局切换动画：用 PixiJS 的动画系统处理布局过渡
- 整体布局效果：对整个布局应用视觉效果

**原因（谨慎）：**
- 当前布局引擎已经非常成熟（虚拟布局 + Transform 驱动 + 60fps）
- 布局计算是纯计算层，不需要 GPU 渲染
- 引入 PixiJS 会增加复杂度和包体积
- **只有在需要特殊动画效果时才考虑**

#### 6. 控制栏（Controller）⭐⭐

**适用度：中等**

**可能的用途：**
- 控制栏整体作为 texture 参与渲染（例如录制时包含控制栏）
- 对控制栏应用视觉效果

**原因（谨慎）：**
- 控制栏是标准 UI 组件，DOM 渲染已经足够
- 控制栏通常不需要 GPU 特效
- **只有在需要将控制栏合成到视频流中时才考虑**

### ❌ 不推荐使用

#### 7. 基础 UI 组件 ⭐

**包括：** Button、Toggle、Dropdown、Slider 等

**原因：**
- 这些是标准 UI 组件，DOM 是最合适的渲染方式
- 不需要 GPU 渲染能力
- 不需要与 Canvas/WebGL 合成
- 使用 HTML-in-Canvas 反而会增加复杂度和性能开销
- 浏览器原生 UI 组件的交互、无障碍、样式系统已经非常成熟

#### 8. 音频组件（Audio）⭐

**原因：**
- 音频组件主要处理音频播放/可视化
- 音频可视化用 Canvas 2D 或 WebGL 直接绘制更高效
- HTML-in-Canvas 对音频场景没有明显优势
- 如果需要复杂音频可视化，直接用 PixiJS 的图形 API 更好

#### 9. 视频组件核心渲染 ⭐

**原因：**
- `<video>` 元素本身已经是硬件加速的
- 浏览器对 video 的渲染已经高度优化
- HTML-in-Canvas 主要用于将 HTML UI 转为 texture，不是用于视频渲染
- 如果需要视频特效处理，应该用 WebGL shader 而不是 HTML-in-Canvas

## 技术评估

### 优势

1. **真正的 DOM + Canvas 融合**：不是截图，不是 html2canvas，是浏览器原生能力
2. **保持交互性**：输入框可编辑、按钮可点击、CSS 动画继续运行
3. **GPU 渲染管线**：可以对 HTML 内容应用滤镜、混合模式、后处理
4. **统一渲染链路**：HTML 和 Canvas 内容可以一起导出、截图、录制

### 限制

1. **实验性功能**：PixiJS 的 HTML-in-Canvas 仍在实验阶段
2. **浏览器兼容性**：依赖浏览器的 HTML-in-Canvas 能力
3. **性能开销**：DOM 转 texture 有性能成本，不适合高频更新场景
4. **包体积增加**：引入 PixiJS 会显著增加 bundle size（~100KB+）
5. **学习成本**：团队需要学习 PixiJS 的 API 和渲染概念

### 性能考虑

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 简单 UI overlay | DOM + CSS | 轻量、成熟、无额外依赖 |
| 需要 GPU 特效的 UI | HTML-in-Canvas | 可以对 HTML 应用滤镜等效果 |
| 高频动画 UI | PixiJS 原生 API | 直接渲染比 DOM 转 texture 更高效 |
| 静态 HTML 内容 | ElementImageSource | 静态快照比实时渲染更轻量 |
| 复杂图形渲染 | PixiJS + WebGL | 原生 GPU 渲染性能最好 |

## 实施建议

### 阶段一：探索（当前）

1. 在特效层中实验 HTML-in-Canvas
2. 评估虚拟背景场景的实际效果
3. 测试性能影响和兼容性

### 阶段二：验证

1. 在白板组件中尝试工具栏集成
2. 评估标注功能的实现方案
3. 对比 DOM overlay 和 HTML-in-Canvas 的差异

### 阶段三：决策

1. 根据实验结果决定是否在生产环境使用
2. 确定哪些组件真正需要 HTML-in-Canvas
3. 制定性能优化策略

## 结论

**最适合使用 HTML-in-Canvas 的组件：**
1. 特效层（虚拟背景、滤镜）
2. 白板组件（工具栏、富文本）
3. 交互层（标注工具）

**不需要使用 HTML-in-Canvas 的组件：**
1. 基础 UI 组件（Button、Toggle、Dropdown 等）
2. 音频组件
3. 视频核心渲染

**关键原则：**
- 只在需要 GPU 渲染能力时使用 HTML-in-Canvas
- 简单 UI 优先使用 DOM
- 高频动画优先使用 PixiJS 原生 API
- 保持组件的可选依赖，不强制引入 PixiJS
