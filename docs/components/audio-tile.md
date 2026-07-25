---
title: AudioTile 音频 Tile
order: 13
---

# AudioTile 音频 Tile

音频渲染单元组件，带波形动画。

## 基础用法

```tsx
import { AudioTile } from 'vauid-components';

export default () => (
  <AudioTile
    name="张三"
    style={{ height: 280, width: 200 }}
    onClick={() => console.log('click')}
  />
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | `string` | - | 用户名称 |
| `onClick` | `() => void` | - | 点击回调 |
