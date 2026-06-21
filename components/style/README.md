# Vauid Components - Style System

极简主义 + 黑暗科技风全局样式系统，高亮色为电光橙。提供完整的 CSS 变量、Sass Map、Mixin 和工具类。

## 快速开始

### 引入默认样式

```scss
// 在你的入口文件中引入
@use 'vauid-components/style/global';
```

这会自动输出所有 CSS 变量、基础重置、排版、交互元素样式和工具类。

## 自定义主题

### 方式一：覆盖 Sass Map（推荐）

使用 `@use ... with ()` 语法覆盖默认 token：

```scss
@use 'vauid-components/style/global' with (
  $default-colors: (
    accent: #00ff88,        // 改为绿色高亮
    accent-hover: #33ffaa,
    bg-primary: #050505,
  ),
  $default-radius: (
    md: 12px,               // 更大的圆角
  ),
);
```

### 可覆盖的 Map

| Map 名称 | 说明 |
|----------|------|
| `$default-colors` | 颜色令牌（背景、边框、文字、高亮、状态色） |
| `$default-fonts` | 字体族（sans / mono） |
| `$default-radius` | 圆角尺寸（sm / md / lg / full） |
| `$default-spacing` | 间距尺寸（xs / sm / md / lg / xl / 2xl） |
| `$default-shadows` | 阴影（sm / md / lg / glow） |
| `$default-transitions` | 过渡（ease-out / ease-spring / duration） |
| `$default-z-index` | 层级（base / dropdown / sticky / overlay / modal / toast / tooltip） |

### 方式二：CSS 变量覆盖

在运行时通过 CSS 变量覆盖（支持动态主题切换）：

```css
:root {
  --vauid-color-accent: #00ff88;
  --vauid-color-bg-primary: #050505;
  --vauid-radius-md: 12px;
}
```

## 使用 Helper Functions

在组件样式中使用内置函数获取 token 值：

```scss
@use 'vauid-components/style/global' as vauid;

.card {
  background: vauid.color('bg-secondary');
  border-radius: vauid.radius('md');
  padding: vauid.space('md');
  box-shadow: vauid.shadow('md');
  font-family: vauid.font('sans');
}
```

| 函数 | 参数 | 返回 |
|------|------|------|
| `color($name)` | token 名称 | 颜色值 |
| `font($name)` | `sans` / `mono` | 字体族 |
| `radius($name)` | `sm` / `md` / `lg` / `full` | 圆角值 |
| `space($name)` | `xs` / `sm` / `md` / `lg` / `xl` / `2xl` | 间距值 |
| `shadow($name)` | `sm` / `md` / `lg` / `glow` | 阴影值 |
| `transition($name)` | `ease-out` / `ease-spring` / `duration-*` | 过渡值 |
| `z-index($name)` | 层级名称 | z-index 值 |

## 使用 Mixins

### 排版 Mixins

```scss
@use 'vauid-components/style/global' as vauid;

h1 { @include vauid.heading(2.5rem); }
p { @include vauid.paragraph; }
a { @include vauid.link; }
code { @include vauid.code; }
pre { @include vauid.pre; }
```

### 交互元素 Mixins

```scss
// 按钮基础交互
.btn {
  @include vauid.button;
  // 添加你自己的样式
  background: vauid.color('accent');
  color: vauid.color('text-inverse');
  padding: vauid.space('sm') vauid.space('md');
  border-radius: vauid.radius('md');
}

// 输入框基础交互
.input {
  @include vauid.input;
  // 添加你自己的样式
}
```

### 布局 Mixins

```scss
.wrapper {
  @include vauid.container(1200px);
}

.center {
  @include vauid.flex-center;
}

.between {
  @include vauid.flex-between;
}
```

### 滚动条 Mixins

```scss
.scrollable {
  max-height: 400px;
  overflow-y: auto;
  @include vauid.scrollbar(4px); // 自定义宽度
}
```

### 状态指示点

```scss
.status {
  @include vauid.status-dot;
}
```

### 无障碍支持

```scss
.component {
  @include vauid.reduced-motion;
}
```

### 生成 CSS 变量

从自定义 map 生成 CSS 变量：

```scss
$my-tokens: (
  primary: #ff5c00,
  secondary: #111113,
);

:root {
  @include vauid.generate-css-vars($my-tokens, 'my-prefix');
}

// 输出:
// --my-prefix-primary: #ff5c00;
// --my-prefix-secondary: #111113;
```

## CSS 变量参考

所有变量以 `--vauid-` 为前缀：

### 颜色

```css
--vauid-color-bg-primary      /* #0a0a0b */
--vauid-color-bg-secondary    /* #111113 */
--vauid-color-bg-tertiary     /* #1a1a1d */
--vauid-color-bg-elevated     /* #222226 */
--vauid-color-surface         /* #161618 */
--vauid-color-surface-hover   /* #1e1e21 */
--vauid-color-surface-active  /* #28282c */
--vauid-color-border-subtle   /* rgba(255,255,255,0.06) */
--vauid-color-border-default  /* rgba(255,255,255,0.1) */
--vauid-color-border-strong   /* rgba(255,255,255,0.18) */
--vauid-color-text-primary    /* rgba(255,255,255,0.92) */
--vauid-color-text-secondary  /* rgba(255,255,255,0.6) */
--vauid-color-text-tertiary   /* rgba(255,255,255,0.38) */
--vauid-color-text-inverse    /* #0a0a0b */
--vauid-color-accent          /* #ff5c00 */
--vauid-color-accent-hover    /* #ff7a2e */
--vauid-color-accent-active   /* #e04e00 */
--vauid-color-accent-subtle   /* rgba(255,92,0,0.12) */
--vauid-color-accent-glow     /* rgba(255,92,0,0.25) */
--vauid-color-success         /* #22c55e */
--vauid-color-warning         /* #f59e0b */
--vauid-color-error           /* #ef4444 */
--vauid-color-info            /* #3b82f6 */
```

### 字体

```css
--vauid-font-sans   /* Inter, system-ui, sans-serif */
--vauid-font-mono   /* JetBrains Mono, SF Mono, monospace */
```

### 圆角

```css
--vauid-radius-sm     /* 4px */
--vauid-radius-md     /* 8px */
--vauid-radius-lg     /* 12px */
--vauid-radius-full   /* 9999px */
```

### 间距

```css
--vauid-space-xs    /* 4px */
--vauid-space-sm    /* 8px */
--vauid-space-md    /* 16px */
--vauid-space-lg    /* 24px */
--vauid-space-xl    /* 32px */
--vauid-space-2xl   /* 48px */
```

### 阴影

```css
--vauid-shadow-sm   /* 0 1px 2px rgba(0,0,0,0.4) */
--vauid-shadow-md   /* 0 4px 12px rgba(0,0,0,0.5) */
--vauid-shadow-lg   /* 0 8px 32px rgba(0,0,0,0.6) */
--vauid-shadow-glow /* 0 0 20px var(--vauid-color-accent-glow) */
```

### 过渡

```css
--vauid-ease-out        /* cubic-bezier(0.16, 1, 0.3, 1) */
--vauid-ease-spring     /* cubic-bezier(0.34, 1.56, 0.64, 1) */
--vauid-duration-fast   /* 150ms */
--vauid-duration-normal /* 250ms */
--vauid-duration-slow   /* 400ms */
```

### 层级

```css
--vauid-z-base      /* 1 */
--vauid-z-dropdown  /* 100 */
--vauid-z-sticky    /* 200 */
--vauid-z-overlay   /* 300 */
--vauid-z-modal     /* 400 */
--vauid-z-toast     /* 500 */
--vauid-z-tooltip   /* 600 */
```

## 工具类

### 文字

| 类名 | 效果 |
|------|------|
| `.text-mono` | 等宽字体 |
| `.text-accent` | 高亮色文字 |
| `.text-secondary` | 次要文字色 |
| `.text-tertiary` | 三级文字色 |

### 背景

| 类名 | 效果 |
|------|------|
| `.bg-primary` | 主背景色 |
| `.bg-secondary` | 次背景色 |
| `.bg-tertiary` | 三级背景色 |
| `.bg-elevated` | 浮层背景色 |

### 边框

| 类名 | 效果 |
|------|------|
| `.border-subtle` | 极淡边框 |
| `.border-default` | 默认边框 |
| `.border-strong` | 强调边框 |

### 布局

| 类名 | 效果 |
|------|------|
| `.container` | 居中容器，max-width 1400px |
| `.flex-center` | flex 居中对齐 |
| `.flex-between` | flex 两端对齐 |

### 状态

| 类名 | 效果 |
|------|------|
| `.status-dot.online` | 绿色在线状态点 |
| `.status-dot.offline` | 灰色离线状态点 |
| `.status-dot.busy` | 黄色忙碌状态点 |
| `.status-dot.error` | 红色错误状态点 |
