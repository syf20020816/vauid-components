---
title: AudioTile 音频 Tile
order: 13
---

# AudioTile 音频 Tile

音频渲染单元组件，带波形动画。

## 基础用法

```tsx
import { AudioTile, TileWrap } from "vauid-components";

const mockNode = (id: string, label: string, isFocus = false) => ({
  entity: { id, label },
  x: 0,
  y: 0,
  width: 300,
  height: 300,
  area: "grid",
  page: 0,
  isFocus,
  zIndex: 0,
  hidden: false,
});

export default () => (
  <TileWrap
    node={mockNode("audio", "Join")}
    style={{ height: 300, width: 300, backgroundColor: "#363636ff" }}
  >
    <AudioTile name="张三" />
  </TileWrap>
);
```

## API

| 属性      | 类型         | 默认值 | 说明     |
| --------- | ------------ | ------ | -------- |
| `name`    | `string`     | -      | 用户名称 |
| `onClick` | `() => void` | -      | 点击回调 |
