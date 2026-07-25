---
title: Dropdown 下拉菜单
order: 16
---

# Dropdown 下拉菜单

下拉菜单组件。

## 基础用法

```tsx
import { Dropdown } from 'vauid-components';

export default () => (
  <Dropdown
    items={[
      { key: '1', label: 'Option 1' },
      { key: '2', label: 'Option 2' },
      { key: '3', label: 'Option 3', danger: true },
    ]}
  >
    <button>点击展开</button>
  </Dropdown>
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `trigger` | `"click" \| "hover"` | `"click"` | 触发方式 |
| `placement` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 弹出方向 |
| `direction` | `"vertical" \| "horizontal"` | `"vertical"` | 排列方向 |
| `items` | `{ key, label, disabled?, danger?, onClick? }[]` | - | 选项列表 |
| `popup` | `ReactNode` | - | 自定义下拉内容 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `onOpenChange` | `(open: boolean) => void` | - | 打开状态变化回调 |
