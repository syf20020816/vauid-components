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
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2', disabled: true },
      { value: '3', label: 'Option 3', danger: true },
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
      { value: '1', label: 'Grid' },
      { value: '2', label: 'Focus' },
      { value: '3', label: 'Fullscreen' },
    ]}
  >
    <Button>布局模式</Button>
  </Dropdown>
);
```

## 触发方式

`trigger` 支持三种触发方式，默认 `"click"`，设为 `"hover"` 时鼠标悬停即可展开（有 100ms 延迟防误触），设为 `"contextMenu"` 时右键宿主元素在鼠标位置弹出。

```tsx
import { Dropdown, Button } from 'vauid-components';

export default () => (
  <div style={{ display: 'flex', gap: 24 }}>
    <Dropdown
      trigger="click"
      items={[
        { value: '1', label: 'Click Option' },
      ]}
    >
      <Button>点击触发</Button>
    </Dropdown>
    <Dropdown
      trigger="hover"
      items={[
        { value: '1', label: 'Hover Option' },
      ]}
    >
      <Button>悬停触发</Button>
    </Dropdown>
    <Dropdown
      trigger="contextMenu"
      items={[
        { value: '1', label: 'Context Option' },
      ]}
    >
      <Button>右键触发</Button>
    </Dropdown>
  </div>
);
```

> `contextMenu` 模式下弹层定位在鼠标坐标（alignPoint），`placement` 仅作为防溢出调整方向；在空白处再次右键可移动菜单位置。

## 右键菜单（RightCtxMenu）

`RightCtxMenu` 是 Dropdown 的音视频场景预设：默认右键触发，用于参与者列表项、画面、白板等宿主的操作菜单（静音 / 设为焦点 / 移出房间等，items 由使用方传入）；`trigger="click"` 时可作为 more 按钮的展开层。

```tsx
import { RightCtxMenu, ParticipantItem } from 'vauid-components';

const items = [
  { value: 'mute', label: '静音' },
  { value: 'focus', label: '设为焦点' },
  { value: 'remove', label: '移出房间', danger: true },
];

export default () => (
  <div style={{ width: 300 }}>
    <RightCtxMenu items={items}>
      <ParticipantItem name="张三" audioEnabled videoEnabled />
    </RightCtxMenu>
  </div>
);
```

试试在上方列表项上点击右键。

## 弹出位置

`placement` 控制弹出方向：`"top"` / `"bottom"`（默认） / `"left"` / `"right"`。底部工具栏场景推荐 `"top"` 向上弹出。

```tsx
import { Dropdown, Button } from 'vauid-components';

export default () => (
  <div style={{ display: 'flex', gap: 24 }}>
    <Dropdown
      placement="top"
      items={[{ value: '1', label: '向上弹出' }]}
    >
      <Button>top</Button>
    </Dropdown>
    <Dropdown
      placement="bottom"
      items={[{ value: '1', label: '向下弹出' }]}
    >
      <Button>bottom</Button>
    </Dropdown>
    <Dropdown
      placement="left"
      items={[{ value: '1', label: '向左弹出' }]}
    >
      <Button>left</Button>
    </Dropdown>
    <Dropdown
      placement="right"
      items={[{ value: '1', label: '向右弹出' }]}
    >
      <Button>right</Button>
    </Dropdown>
  </div>
);
```

## 禁用

`disabled` 为 `true` 时触发器置灰且无法展开。

```tsx
import { Dropdown, Button } from 'vauid-components';

export default () => (
  <Dropdown
    disabled
    items={[
      { value: '1', label: 'Option 1' },
    ]}
  >
    <Button>禁用状态</Button>
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
| `trigger` | `"click" \| "hover" \| "contextMenu"` | `"click"` | 触发方式；`contextMenu` 为右键在鼠标位置弹出 |
| `placement` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | 弹出方向 |
| `direction` | `"vertical" \| "horizontal"` | `"vertical"` | 排列方向 |
| `items` | `Omit<Option, "onSelect">[]`（`{ value, label, icon?, disabled?, danger?, active?, onClick? }`） | - | 选项列表，与 Trigger 的 Option 同构（onSelect 不适用） |
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

### RightCtxMenuProps

`Omit<DropdownProps, "trigger">`，仅调整默认值：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `trigger` | `"contextMenu" \| "click"` | `"contextMenu"` | 右键触发（默认）；`click` 用于 more 按钮展开 |
| `placement` | 同 Dropdown | `"bottom"` | 右键模式下仅作为防溢出方向 |

ref 需在组件内通过 hook 获取（dumi demo 同样遵守 Rules of Hooks）。ref 在 commit 阶段才赋值，需配合 `useLayoutEffect` 读取：

```tsx
import { useLayoutEffect, useRef, useState } from 'react';
import { Dropdown, Button, type DropdownRef } from 'vauid-components';

export default () => {
  const ref = useRef<DropdownRef>(null);
  const [classNames, setClassNames] = useState('');

  useLayoutEffect(() => {
    const { triggerClassName, popupClassName, itemClassName } = ref.current ?? {};
    setClassNames(
      [
        `triggerClassName → ${triggerClassName}`,
        `popupClassName    → ${popupClassName}`,
        `itemClassName     → ${itemClassName}`,
      ].join('\n'),
    );
  }, []);

  return (
    <>
      <Dropdown ref={ref} items={[{ value: '1', label: 'Option 1' }]}>
        <Button>点击展开</Button>
      </Dropdown>
      <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{classNames}</pre>
    </>
  );
};
```
