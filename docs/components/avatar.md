---
title: Avatar 头像
order: 4
---

# Avatar 头像

用户头像组件，支持文字和图片。

## 基础用法

```tsx
import { Avatar } from 'vauid-components';

export default () => (
  <>
    <Avatar name="张三" />
    <Avatar name="John" size={40} />
    <Avatar name="Alice" size={60} />
    <Avatar
      src="//example.com/avatar.png"
      name="测试"
      size={40}
    />
  </>
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | `string` | - | 用户名称 |
| `src` | `string` | - | 头像图片地址 |
| `size` | `number` | `36` | 头像尺寸 |
