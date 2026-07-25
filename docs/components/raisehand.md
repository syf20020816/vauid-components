---
title: RaiseHand 举手
order: 9
---

# RaiseHand 举手

举手按钮组件，举手中显示警告色。

## 基础用法

```tsx
import { RaiseHand } from 'vauid-components';

export default () => (
  <>
    <RaiseHand />
    <RaiseHand raised />
  </>
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `raised` | `boolean` | `false` | 是否举手中 |
| `onClick` | `() => void` | - | 点击回调 |
