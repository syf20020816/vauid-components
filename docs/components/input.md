---
title: Input 输入框
order: 15
---

# Input 输入框

输入框组件，支持多种类型。

## 基础用法

```tsx
import { Input, TextArea, Password, NumberInput } from 'vauid-components';

export default () => (
  <>
    <Input placeholder="普通输入" />
    <TextArea placeholder="多行文本" />
    <Password placeholder="密码" />
    <NumberInput defaultValue={0} />
  </>
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `disabled` | `boolean` | `false` | 是否禁用 |
| `bordered` | `boolean` | `true` | 是否有边框 |
| `block` | `boolean` | `false` | 是否块级 |
| `type` | `string` | - | 输入类型 |

### TextArea

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `rows` | `number` | - | 行数 |

### NumberInput

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `min` | `number` | - | 最小值 |
| `max` | `number` | - | 最大值 |
| `step` | `number` | `1` | 步长 |
