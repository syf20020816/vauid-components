---
title: Select 下拉选择器
order: 22
---

# Select 下拉选择器

受控 / 非受控的下拉单选，基于 @rc-component/trigger 实现。选项复用 Trigger 统一的 `Option` 类型，与 Dropdown 菜单项共享同一套样式体系（含 `icon` / `danger` / `disabled`）。支持 `forwardRef` 指向触发器根元素。

选中后触发器展示选中项的 `label`（而非 `value`）。

## 基础用法

```tsx
import { Select } from 'vauid-components';

export default () => (
  <div style={{ width: 240 }}>
    <Select
      placeholder="选择语言"
      options={[
        { value: 'zh-CN', label: '简体中文' },
        { value: 'en-US', label: 'English' },
        { value: 'ja-JP', label: '日本語' },
      ]}
      onChange={(value, option) => console.log(value, option)}
    />
  </div>
);
```

## 受控模式

通过 `value` + `onChange` 完全受控：

```tsx
import { Select } from 'vauid-components';
import { useState } from 'react';

export default () => {
  const [value, setValue] = useState('focus');
  return (
    <div style={{ width: 240 }}>
      <Select
        value={value}
        onChange={(v) => setValue(v)}
        options={[
          { value: 'grid', label: '网格' },
          { value: 'focus', label: '聚焦' },
          { value: 'fullscreen', label: '全屏' },
        ]}
      />
    </div>
  );
};
```

## 完整选项能力

选项对齐 Trigger 组件的 `Option` 能力：`icon` 图标、`danger` 危险项（红色强调）、`disabled` 禁用项、`onClick`（每次点击都触发）、`onSelect`（仅切换选中时触发，点击已选中项不触发）：

```tsx
import { Select } from 'vauid-components';
import { Users, UserX, Trash2 } from 'lucide-react';

export default () => (
  <div style={{ width: 260 }}>
    <Select
      defaultValue="all"
      options={[
        { value: 'all', label: '全部成员', icon: <Users size={14} /> },
        { value: 'guest', label: '仅访客', icon: <UserX size={14} /> },
        { value: 'exit', label: '退出会议', danger: true },
        { value: 'off', label: '已下线', disabled: true },
      ]}
      onChange={(value) => console.log('onChange', value)}
    />
  </div>
);
```

`onClick` 与 `onSelect` 的触发时机与 Trigger 一致：点击已选中项只触发 `onClick`，切换选中项时先 `onChange` / `onSelect` 后 `onClick`。`onChange` 仅在选中值变化时触发。

## 自定义样式

通过 `classNames` 精确控制各部分类名，菜单项样式与 Dropdown 共用 `dropdown-item` 体系（`--active` / `--disabled` / `--danger` 修饰符）：

```tsx
import { Select } from 'vauid-components';

export default () => (
  <div style={{ width: 240 }}>
    <Select
      defaultValue="b"
      classNames={{
        trigger: 'my-select-trigger',
        dropdown: 'my-select-dropdown',
        option: 'my-select-option',
      }}
      options={[
        { value: 'a', label: '选项 A' },
        { value: 'b', label: '选项 B' },
        { value: 'c', label: '选项 C' },
      ]}
    />
  </div>
);
```

## 禁用状态

```tsx
import { Select } from 'vauid-components';

export default () => (
  <div style={{ width: 240 }}>
    <Select
      disabled
      defaultValue="zh-CN"
      options={[
        { value: 'zh-CN', label: '简体中文' },
        { value: 'en-US', label: 'English' },
      ]}
    />
  </div>
);
```

## API

### SelectProps

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string \| number` | - | 受控选中值 |
| `defaultValue` | `string \| number` | - | 非受控默认值 |
| `options` | `Option[]` | - | 选项列表 |
| `onChange` | `(value, option) => void` | - | 选中变化回调（仅切换时触发） |
| `placeholder` | `string` | `"请选择"` | 无选中时占位文本 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `classNames.trigger` | `string` | - | 触发器根元素附加类名 |
| `classNames.dropdown` | `string` | - | 弹层菜单附加类名 |
| `classNames.option` | `string` | - | 菜单项附加类名 |

其余属性透传至触发器根元素（继承 `HTMLAttributes<HTMLDivElement>`）。

### Option

与 [Trigger](/components/trigger) 共用同一选项类型：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `ReactNode` | - | 选项文本（选中后触发器展示它） |
| `value` | `string \| number` | - | 唯一标识 |
| `icon` | `ReactNode` | - | 选项图标（渲染在 label 前，仅菜单内展示） |
| `disabled` | `boolean` | `false` | 禁用该项（不可点击） |
| `danger` | `boolean` | `false` | 危险项（红色强调，用于删除/退出等操作） |
| `onClick` | `(value, e) => FnReturn<void>` | - | 每次点击该项时触发（无论是否切换选中） |
| `onSelect` | `(value, e) => FnReturn<void>` | - | 切换选中时触发（点击已选中项不触发） |
