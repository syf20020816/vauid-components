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

## 挂载媒体源（以 livekit 为例）

通过 `bind`/`unbind` 将厂商音频 track 挂载到内部 `<audio>` 元素，挂载后波形由真实音量驱动：

```ts
const bind = useCallback((el: HTMLAudioElement) => {
  track.attach(el);
}, [track]);

const unbind = useCallback((el: HTMLAudioElement) => {
  track.detach(el);
}, [track]);

<AudioTile bind={bind} unbind={unbind} />
```

> 元素卸载时 React 会先把 ref 置为 `null` 再执行 effect cleanup，因此 `AudioTile` 在挂载时捕获元素并在卸载前把**同一元素**传给 `unbind`，使用方无需自己维护 ref。`speaking` 仅在未绑定音频流时生效。

## API

| 属性        | 类型                                       | 默认值  | 说明                                     |
| ----------- | ------------------------------------------ | ------- | ---------------------------------------- |
| `name`      | `string`                                   | `""`    | 用户名称                                 |
| `avatar`    | `ReactNode`                                | -       | 自定义头像                               |
| `avatarSrc` | `string`                                   | -       | 头像图片地址                             |
| `speaking`  | `boolean`                                  | `false` | 静态活跃度（未绑定音频流时生效）         |
| `bind`      | `(el: HTMLAudioElement) => FnReturn<void>` | -       | 元素挂载后触发，用于挂载媒体源           |
| `unbind`    | `(el: HTMLAudioElement) => FnReturn<void>` | -       | 元素卸载前触发，入参为 `bind` 的同一元素 |

其余属性透传给根元素；`ref` 转发到内部 `<audio>` 元素。
