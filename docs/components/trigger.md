---
title: Trigger 选择触发器
order: 17
---

# Trigger 选择触发器

选择触发器组件，带下拉选项。

## 基础用法

```tsx
import { Trigger } from "vauid-components";

export default () => (
  <Trigger
    ellipsis={false}
    options={[
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
      { label: "Option 3", value: "3" },
    ]}
  />
);
```

## API

| 属性          | 类型                      | 默认值     | 说明         |
| ------------- | ------------------------- | ---------- | ------------ |
| `prefix`      | `ReactNode`               | -          | 前缀图标     |
| `options`     | `{ label, value }[]`      | -          | 选项列表     |
| `activeKey`   | `string`                  | -          | 当前选中值   |
| `showLabel`   | `boolean`                 | `true`     | 是否显示标签 |
| `placeholder` | `string`                  | `"Select"` | 占位文本     |
| `ellipsis`    | `boolean`                 | `true`     | 是否截断     |
| `maxLength`   | `number`                  | `6`        | 最大显示长度 |
| `onChange`    | `(value: string) => void` | -          | 变更回调     |
