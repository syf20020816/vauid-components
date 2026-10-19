---
title: VideoTile 视频 Tile
order: 12
---

# VideoTile 视频 Tile

视频渲染单元组件。组件只负责 `<video>` 元素与样式，媒体源（如 livekit track）由使用方通过 `bind`/`unbind` 挂载。

## 基础用法

```tsx
import { VideoTile } from 'vauid-components';

export default () => (
  <div style={{ width: 320, height: 240 }}>
    <VideoTile style={{ width: '100%', height: '100%' }} />
  </div>
);
```

## 配合 TileWrap 展示悬浮层

`TileWrap` 提供名称、聚焦等悬浮层，`VideoTile` 作为其内容层：

```tsx
import { TileWrap, VideoTile } from 'vauid-components';

const mockNode = (id: string, label: string, isFocus = false) => ({
  entity: { id, label },
  x: 0, y: 0, width: 300, height: 300,
  area: "grid", page: 0, isFocus, zIndex: 0, hidden: false,
});

export default () => (
  <div style={{ width: 320, height: 240 }}>
    <TileWrap node={mockNode("video", "John")}>
      <VideoTile
        bind={(el) => console.log("bind", el)}
        unbind={(el) => console.log("unbind", el)}
        style={{ width: '100%', height: '100%' }}
      />
    </TileWrap>
  </div>
);
```

## 挂载媒体源（ref 直挂 MediaStream）

`ref` 转发到内部 `<video>` 元素。拿到流后直接挂 `srcObject` 即可出画面（组件已带 `autoPlay` / `playsInline` / `muted`）。典型组合是配合 `DeviceTrigger.ScreenShare`——按钮负责采集共享流并挂到 ref 指向的元素：

```tsx
import { useRef } from 'react';
import { VideoTile, DeviceTrigger } from 'vauid-components';

export default () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <div>
      <div style={{ width: 320, height: 240, marginBottom: 12 }}>
        <VideoTile ref={videoRef} style={{ width: '100%', height: '100%' }} />
      </div>
      {/* 点击后浏览器弹出选屏对话框，共享画面自动挂到上面的 Tile */}
      <DeviceTrigger.ScreenShare element={videoRef} />
    </div>
  );
};
```

也可以自行获取流后挂载（摄像头、合成流等任意 MediaStream）：

```ts
const videoRef = useRef<HTMLVideoElement>(null);

const startCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  // 组件内部已处理自动播放兜底，这里只需挂源
  videoRef.current!.srcObject = stream;
};
```

## 挂载媒体源（以 livekit 为例）

RTC SDK 场景推荐 `bind`/`unbind`：元素挂载/卸载时收到同一元素回调，适合 `track.attach(el)` 这类有配套解绑的资源：

```ts
const bind = useCallback((el: HTMLVideoElement) => {
  track.attach(el);
}, [track]);

const unbind = useCallback((el: HTMLVideoElement) => {
  track.detach(el);
}, [track]);

<VideoTile bind={bind} unbind={unbind} />
```

> 元素卸载时 React 会先把 ref 置为 `null` 再执行 effect cleanup，因此 `VideoTile` 在挂载时捕获元素并在卸载前把**同一元素**传给 `unbind`，使用方无需自己维护 ref。

> 两种方式对照：`ref` 直挂适合一次性挂流的场景（`srcObject`），由使用方管理生命周期；`bind`/`unbind` 适合资源有 attach/detach 配对语义的场景，挂载与释放时机由组件保证。

## 0 帧渲染（性能优化）

布局引擎会把非当前页的 Tile 计算为 `hidden`（渲染为 `opacity: 0`）。将布局信号接到 `visible` prop 后，不可见的 Tile 会 `video.pause()` 停止解码（0 帧渲染），恢复可见自动续播。`video` 为 muted，会议音频走 audio 管道，暂停不影响收听：

```tsx
import { VideoTile } from 'vauid-components';
import { useState } from 'react';

export default () => {
  const [visible, setVisible] = useState(true);
  return (
    <div style={{ width: 320 }}>
      <div style={{ width: '100%', height: 240, marginBottom: 12 }}>
        <VideoTile visible={visible} style={{ width: '100%', height: '100%' }} />
      </div>
      <label>
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
        />
        可见（取消勾选后视频暂停、停止解码）
      </label>
    </div>
  );
};
```

布局场景由 `Layout` 的 `renderEntity` 把节点的 `hidden` 传入：

```ts
// renderEntity 拿到布局节点，hidden 为 true 表示非当前页/不可见
<Layout
  nodes={nodes}
  renderEntity={(node) => <VideoTile visible={!node.hidden} />}
/>
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `screenShare` | `boolean` | `false` | 是否屏幕分享 |
| `bind` | `(el: HTMLVideoElement) => FnReturn<void>` | - | 元素挂载后触发，用于挂载媒体源 |
| `unbind` | `(el: HTMLVideoElement) => FnReturn<void>` | - | 元素卸载前触发，入参为 `bind` 传入的同一元素 |
| `visible` | `boolean` | `true` | 可见性：false 时暂停视频停止解码（0 帧渲染），恢复自动续播；布局场景传 `visible={!node.hidden}` |

其余属性透传给 `<video>` 元素；`ref` 转发到内部 `<video>` 元素。
