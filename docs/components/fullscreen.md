---
title: FullScreen 全屏切换
order: 8
---

# FullScreen 全屏切换

全屏切换按钮组件。

## 基础用法

```tsx
import { FullScreen } from 'vauid-components';

export default () => (
  <>
    <FullScreen />
    <FullScreen fullScreen />
  </>
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fullScreen` | `boolean` | `false` | 是否全屏状态 |
| `onClick` | `() => void` | - | 点击回调 |
