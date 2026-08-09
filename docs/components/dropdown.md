---
title: Dropdown 下拉菜单
order: 16
---

# Dropdown 下拉菜单

下拉菜单组件，基于 @rc-component/trigger 实现。支持 `forwardRef`，通过 ref 暴露已处理好的 className，方便自定义 popup 时复用统一样式。

## 基础用法

```tsx
import { Dropdown, Button } from 'vauid-components';

export default () => (
  <Dropdown
    items={[
      { key: '1', label: 'Option 1' },
      { key: '2', label: 'Option 2' },
      { key: '3', label: 'Option 3', danger: true },
    ]}
  >
    <Button>点击展开</Button>
  </Dropdown>
);
```

## 横向排列

```tsx
import { Dropdown, Button } from 'vauid-components';

export default () => (
  <Dropdown
    direction="horizontal"
    items={[
      { key: '1', label: 'Grid' },
      { key: '2', label: 'Focus' },
      { key: '3', label: 'Fullscreen' },
    ]}
  >
    <Button>布局模式</Button>
  </Dropdown>
);
```

## 自定义 popup（通过 ref 复用样式）

`Dropdown` 通过 `forwardRef` 暴露 `DropdownRef`，包含已处理好的 className，无需二次重写：

```tsx
import { useRef, useState, useLayoutEffect } from 'react';
import { Dropdown, Button, type DropdownRef } from 'vauid-components';

export default () => {
  const dropdownRef = useRef<DropdownRef>(null);
  const [popupClassName, setPopupClassName] = useState('');

  // ref 在 commit 阶段才赋值，需同步到 state 驱动重渲染
  useLayoutEffect(() => {
    setPopupClassName(dropdownRef.current?.popupClassName ?? '');
  }, []);

  return (
    <Dropdown
      ref={dropdownRef}
      popup={
        <div className={popupClassName} style={{ flexDirection: 'column' }}>
          <div style={{ padding: '8px 16px', cursor: 'pointer' }}>自定义项 A</div>
          <div style={{ padding: '8px 16px', cursor: 'pointer' }}>自定义项 B</div>
        </div>
      }
    >
      <Button>自定义内容</Button>
    </Dropdown>
  );
};
```

## API

### DropdownProps

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `trigger` | `"click" \| "hover"` | `"click"` | 触发方式 |
| `placement` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 弹出方向 |
| `direction` | `"vertical" \| "horizontal"` | `"vertical"` | 排列方向 |
| `items` | `{ key, label, disabled?, danger?, onClick? }[]` | - | 选项列表 |
| `popup` | `ReactNode` | - | 自定义下拉内容（优先级高于 items） |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `classNames` | `{ trigger?, dropdown?, item? }` | - | 各部分自定义 className |
| `styles` | `{ trigger?, dropdown?, item? }` | - | 各部分自定义样式 |
| `onOpenChange` | `(open: boolean) => void` | - | 打开状态变化回调 |

### DropdownRef（通过 ref 获取）

| 属性 | 类型 | 说明 |
|------|------|------|
| `triggerClassName` | `string` | 触发器 className（含 `--open` / `--disabled` 修饰） |
| `popupClassName` | `string` | 弹出菜单 className（含 `--vertical` / `--horizontal` 修饰） |
| `itemClassName` | `string` | 菜单项基础 className |

```tsx
import { useRef } from 'react';
import { Dropdown, type DropdownRef } from 'vauid-components';

const ref = useRef<DropdownRef>(null);
// ref.current?.popupClassName  → "vauid-dropdown-menu vauid-dropdown-menu--vertical"
// ref.current?.triggerClassName → "vauid-dropdown-trigger"
// ref.current?.itemClassName    → "vauid-dropdown-item"
```
