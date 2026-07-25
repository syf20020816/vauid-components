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
import { VideoTile } from 'vauid-components';

export default () => (
  <div style={{ width: 320, height: 240 }}>
    <VideoTile
      label="John (屏幕分享)"
      screenShare
      style={{ width: '100%', height: '100%' }}
    />
  </div>
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | - | 视频标签 |
| `screenShare` | `boolean` | `false` | 是否屏幕分享 |
