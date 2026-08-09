---
title: Thumbnail 布局缩略图
order: 2
---

# Thumbnail 布局缩略图

布局缩略图选择器，以可视化预览的方式展示 Focus / Grid / Fullscreen 三种布局模式，用户点击缩略图即可切换布局。

组件内部基于 `Dropdown` 实现，通过 `forwardRef` 复用 `Dropdown` 暴露的 `popupClassName` 和 `itemClassName`，使自定义 popup 保持与下拉菜单一致的样式（边框、圆角、间距等）。

## 基础用法

```tsx
import { Thumbnail } from 'vauid-components/layout/thumbnail';

export default () => (
  <Thumbnail showLabel />
);
```

## 隐藏文字

```tsx
import { Thumbnail } from 'vauid-components/layout/thumbnail';

export default () => (
  <Thumbnail />
);
```

## 缩略图预览类型

`Thumbnail` 内置三种布局缩略图组件，通过 `Dropdown` 的 `popupClassName` 复用菜单样式，`itemClassName` 复用菜单项样式：

| 缩略图组件 | 对应布局 | 视觉效果 |
|------------|----------|----------|
| `LayoutFocusTb` | Focus 布局 | 左侧侧边栏 + 右侧主视口 |
| `LayoutGridTb` | Grid 布局 | 2×2 网格 |
| `LayoutFullScreenTb` | Fullscreen 布局 | 单个主视口占满 |

## API

### ThumbnailProps

继承 `DropdownProps`，额外支持以下属性：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showLabel` | `boolean` | `true` | 是否显示「布局」文字标签 |
