---
title: Trigger 选择触发器
order: 17
---

# Trigger 选择触发器

选择触发器组件，带下拉选项。支持受控/非受控、横向/纵向两种触发器形态。

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

## 受控模式

传入 `value` 时切换为受控，选中值由外部状态驱动，通过 `onChange` 通知变更；不传 `value` 则非受控，options 异步加载完成后自动选中第一个。

```tsx
import { useState } from "react";
import { Trigger } from "vauid-components";

export default () => {
  const [value, setValue] = useState("1");
  return (
    <Trigger
      prefix={<span>🌨</span>}
      value={value}
      onChange={setValue}
      options={[
        { label: "钢笔", value: "pen" },
        { label: "水笔", value: "brush" },
        { label: "铅笔", value: "pencil" },
      ]}
    />
  );
};
```

## 前缀与图标

通过 `prefix` 传入前置图标；`showLabel={false}` 可隐藏标签只显示图标与下拉箭头。适配工具栏等图标场景（如白板的笔/形状切换）。

```tsx
import { Pencil, Square } from "lucide-react";
import { Trigger } from "vauid-components";

export default () => (
  <Trigger
    showLabel={false}
    prefix={<Pencil size={16} />}
    options={[
      { label: "钢笔", value: "pen", icon: <Square size={16} /> },
      { label: "水笔", value: "brush" },
      { label: "铅笔", value: "pencil" },
    ]}
  />
);
```

## 纵向

`direction="vertical"` 时触发器按钮与下拉箭头纵向堆叠，适配纵向工具栏。

```tsx
import { Trigger } from "vauid-components";

export default () => (
  <Trigger
    direction="vertical"
    showLabel={false}
    prefix={<span>🌨</span>}
    options={[
      { label: "雪", value: "snow" },
      { label: "雨", value: "rain" },
      { label: "晴", value: "sunny" },
    ]}
  />
);
```

## 禁用与危险项

Option 支持 `disabled`（置灰不可点击）与 `danger`（红色强调），适配「退出房间」「删除」等操作项。选中项通过 `active` 高亮显示。

```tsx
import { Trigger } from "vauid-components";

export default () => (
  <Trigger
    value="member"
    options={[
      { label: "成员列表", value: "member" },
      { label: "房间设置", value: "settings", disabled: true },
      { label: "退出房间", value: "leave", danger: true },
    ]}
  />
);
```

## API

### Trigger

| 属性          | 类型                                 | 默认值       | 说明                                             |
| ------------- | ------------------------------------ | ------------ | ------------------------------------------------ |
| `prefix`      | `ReactNode`                          | -            | 前缀图标                                         |
| `options`     | `Option[]`                           | -            | 选项列表                                         |
| `value`       | `string` \| `number`                 | -            | 当前选中值（受控模式），不传则非受控并自动选中第一个 |
| `direction`   | `"horizontal"` \| `"vertical"`       | `"horizontal"` | 触发器形态，纵向时按钮与箭头垂直堆叠          |
| `showLabel`   | `boolean`                            | `true`       | 是否显示选中项标签                               |
| `placeholder` | `string`                             | `"Select"`   | 无匹配项时的占位文本                             |
| `ellipsis`    | `boolean`                            | `true`       | 标签超长是否截断                                 |
| `maxLength`   | `number`                             | `6`          | 标签最大显示长度                                 |
| `styles`      | `{ icon, trigger, button, dropdown }` | -           | 各子元素内联样式（`React.CSSProperties`）        |
| `classNames`  | `{ trigger, icon, button, dropdown }` | -           | 各子元素追加类名                                 |
| `onChange`    | `(value) => void`                    | -            | 选中值变化回调（仅切换时触发）                   |
| `onClick`     | `(e) => void`                        | -            | 点击触发器本体回调（不切换不触发 onChange）       |

### Option

| 属性       | 类型                 | 说明                         |
| ---------- | -------------------- | ---------------------------- |
| `label`    | `ReactNode`          | 选项标签（仅字符串可截断）   |
| `value`    | `string` \| `number` | 选项值                       |
| `icon`     | `ReactNode`          | 选项图标                     |
| `disabled` | `boolean`            | 禁用该项（置灰不可点击）     |
| `danger`   | `boolean`            | 危险项（红色强调）           |
| `active`   | `boolean`            | 选中态（Dropdown 自定义 popup 时可复用） |
| `onClick`  | `(value, e) => void` | 点击选项回调（每次点击都触发） |
| `onSelect` | `(value, e) => void` | 选中回调（仅切换时触发）     |