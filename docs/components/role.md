---
title: Role 角色标签
order: 5
---

# Role 角色标签

角色标签组件，支持预设角色和自定义颜色。

## 预设角色

```tsx
import { Role } from 'vauid-components';

export default () => (
  <>
    <Role role="host" />
    <Role role="participant" />
    <Role role="manager" />
    <Role role="guest" />
  </>
);
```

## 自定义

```tsx
import { Role } from 'vauid-components';

export default () => (
  <Role text="自定义" color="#fff" backgroundColor="#8b5cf6" />
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `role` | `"host" \| "participant" \| "manager" \| "guest"` | - | 预设角色类型 |
| `text` | `string` | - | 自定义文本 |
| `color` | `string` | - | 自定义文字颜色 |
| `backgroundColor` | `string` | - | 自定义背景色 |
