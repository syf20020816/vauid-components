---
title: Tag 标签
order: 2
---

# Tag 标签

标签组件，用于标记和分类。

## 基础用法

```tsx
import { Tag } from 'vauid-components';

export default () => (
  <>
    <Tag>普通标签</Tag>
    <Tag round={false}>直角标签</Tag>
  </>
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `children` | `ReactNode` | - | 标签内容 |
| `icon` | `ReactNode` | - | 图标 |
| `iconPosition` | `"left" \| "right"` | `"left"` | 图标位置 |
| `round` | `boolean` | `true` | 是否圆角 |
