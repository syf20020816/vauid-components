---
title: Focus 焦点状态
order: 7
---

# Focus 焦点状态

焦点状态指示组件。

## 基础用法

```tsx
import { Focus } from 'vauid-components';

export default () => (
  <>
    <Focus />
    <Focus focused />
  </>
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `focused` | `boolean` | `false` | 是否处于焦点状态 |
