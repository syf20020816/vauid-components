---
title: Controller 控制器
order: 11
---

# Controller 控制器

会议控制栏组件，包含设备切换和退出按钮。

## 基础用法

```tsx
import { Controller } from 'vauid-components';

export default () => (
  <Controller />
);
```

## 自定义位置

```tsx
import { Controller } from 'vauid-components';

export default () => (
  <Controller position="center" />
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `position` | `"start" \| "end" \| "center"` | - | 设备按钮对齐方式 |
| `showMore` | `boolean` | `true` | 是否显示更多按钮 |
| `moreOptions` | `Option[]` | `[]` | 更多选项 |
| `other` | `ReactNode` | - | 自定义额外内容 |
| `onLeave` | `() => void` | - | 退出回调 |
