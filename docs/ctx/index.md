---
title: 上下文
nav:
  title: 上下文
  order: 3
---

# RoomCtx 房间上下文

房间级别的 React 上下文，**只维护布局引擎与使用者放入的额外数据**，不关心具体音视频厂商。连接、参会者等业务状态由使用方自行管理。

包含三部分：

- `RoomCtxProvider` — 提供者，创建并持有唯一的 `Engine` 实例

- `useRoomCtx` — 在子组件中读取上下文

- `RoomCtx` — 上下文类型

## 基础用法

```tsx
import { RoomCtxProvider, useRoomCtx } from "vauid-components";

const Grid = () => {
  const ctx = useRoomCtx();
  // 布局引擎实例（全局唯一）
  const { layout } = ctx!;
  // 布局节点（LayoutNodes，即 Map），通过 getState() 读取
  const nodeCount = layout.getState().entities.size;
  return <div>当前实体数：{nodeCount}</div>;
};

export default () => (
  <RoomCtxProvider>
    <Grid />
  </RoomCtxProvider>
);
```

## 注入/读取额外数据

通过 `extra` prop 放入任意数据，子组件经 `useRoomCtx().extra` 读取。常用于跨组件共享房间元信息等。

```tsx
import { RoomCtxProvider, useRoomCtx } from "vauid-components";

const Title = () => {
  const { extra } = useRoomCtx()!;
  return <h1>{extra?.roomName}</h1>;
};

export default () => (
  <RoomCtxProvider extra={{ roomName: "Meeting A" }}>
    <Title />
  </RoomCtxProvider>
);
```

> 提示：`RoomCtxProvider` 内部用 `useRef` 持有 `extra`（React Compiler 禁止渲染期写 ref，改为 effect 中同步），因此 `extra` 传内联对象不会引起 context 值变化导致的重新渲染。但子组件在 `extra` 更新后需自行触发渲染以读取最新值。

## API

### RoomCtxProvider

| 属性         | 类型                              | 说明         |
| ---------- | ------------------------------- | ---------- |
| `extra`    | `Record<string \| symbol, any>` | 放入上下文的额外数据 |
| `children` | `ReactNode`                     | 子组件        |

### useRoomCtx

```typescript
useRoomCtx(): RoomCtx | null
```

必须在 `<RoomCtxProvider>` 内使用；未在 Provider 内时返回 `null` 并输出警告。

### RoomCtx

| 属性       | 类型                              | 说明                 |
| -------- | ------------------------------- | ------------------ |
| `layout` | `Engine`                        | 布局引擎实例（全局唯一，卸载时销毁） |
| `extra`  | `Record<string \| symbol, any>` | 使用者注入的额外数据         |

