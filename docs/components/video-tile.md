---
title: VideoTile 视频 Tile
order: 12
---

# VideoTile 视频 Tile

视频渲染单元组件。

## 基础用法

```tsx
import { VideoTile } from 'vauid-components';

export default () => (
  <div style={{ width: 320, height: 240 }}>
    <VideoTile label="张三" style={{ width: '100%', height: '100%' }} />
  </div>
);
```

## 屏幕分享

```tsx
import { VideoTile, TileWrap } from 'vauid-components';

const mockNode = (id: string, label: string, isFocus = false) => ({
  entity: { id, label },
  x: 0, y: 0, width: 300, height: 300,
  area: "grid", page: 0, isFocus, zIndex: 0, hidden: false,
});

export default () => (
  <div style={{ width: 320, height: 240 }}>
    <TileWrap node={mockNode("video", "John")}>
    <VideoTile
      label="John (屏幕分享)"
      screenShare
      style={{ width: '100%', height: '100%' }}
    />
    </TileWrap>
  </div>
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | - | 视频标签 |
| `screenShare` | `boolean` | `false` | 是否屏幕分享 |
