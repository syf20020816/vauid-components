---
title: Prejoin 预加入房间
order: 20
---

# Prejoin 预加入房间

预加入房间组件，包含房间名输入、本地摄像头/麦克风启用与设备选择、音量调节以及加入按钮。

## 基础用法

```tsx
import { Prejoin } from 'vauid-components';

export default () => (
  <Prejoin />
);
```

## 受控房间名

`roomName` 传入则切换为受控，输入内容由外部维护；不传则内部维护（可用 `defaultRoomName` 设初始值）。

```tsx
import { useState } from "react";
import { Prejoin } from "vauid-components";

export default () => {
  const [joining, setJoining] = useState(false);
  return (
    <Prejoin
      defaultRoomName="会议室A"
      joining={joining}
      onJoin={(roomName) => {
        setJoining(true);
        // 调用实际的加入房间逻辑
      }}
    />
  );
};
```

## 本地视频预览

Prejoin 内部已集成摄像头本地预览：点击摄像头开关即开始采集，再次点击停止。若需在组件外单独实现本地视频预览，可改用下述 `useVideoPreview` Hook。

### useVideoPreview

用于「把一路媒体流挂到某个 `<video>` 上」的本地预览控制：

```tsx
import { useRef } from "react";
import { useVideoPreview } from "vauid-components/prejoin/hooks/useVideoPreview";

export default () => {
  const { videoRef, play, pause, clear, streaming } = useVideoPreview();
  return (
    <>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: 320 }} />
      <button onClick={() => navigator.mediaDevices.getUserMedia({ video: true }).then(play)}>
        打开摄像头
      </button>
      <button onClick={pause}>暂停</button>
      <button onClick={clear}>关闭并释放</button>
      {!streaming && <span>当前无画面</span>}
    </>
  );
};
```

#### 返回值

| 值                 | 类型                                | 说明                                                           |
| ------------------ | ----------------------------------- | ------------------------------------------------------------ |
| `videoRef`         | `RefObject<HTMLVideoElement>`       | 绑定到 `<video ref>` 的元素引用                                 |
| `play`             | `(src?: MediaStream) => Promise<void>` | 播放传入的视频流（以每次传入的最新流为准）；点 `video.play()`，失败仅 `console.error` 不抛错 |
| `pause`            | `() => void`                        | 暂停并解绑 `srcObject`                                        |
| `clear`            | `() => void`                        | 停止当前流的所有轨道并暂停（组件卸载清理用）                   |
| `loading`          | `boolean`                           | `play` 执行中的加载状态                                        |
| `streaming`        | `boolean`                           | 是否有流在播放（无流为 `false`，可驱动占位图渲染）             |
| `showPlaceholder`  | `boolean`                           | `!streaming` 的简写，占位图显示开关                           |
| `setLoading`       | `(v: boolean) => void`             | 手动控制 loading 状态                                         |

> 注意：`play` 抛空参数错误时不会自行捕获，若需 fail-soft 请在调用处 `try/catch`。每次开关设备都会产生新流，hook 不缓存旧流，以调用方传入的最新流为准。

## API

| 属性               | 类型                   | 默认值  | 说明                             |
| ------------------ | ---------------------- | ------- | -------------------------------- |
| `roomName`         | `string`               | -       | 房间名（受控），不传则组件内部维护 |
| `defaultRoomName`  | `string`               | `""`    | 非受控模式的初始房间名            |
| `onRoomNameChange` | `(roomName: string)`   | -       | 房间名变化回调                    |
| `onJoin`           | `(roomName: string)`   | -       | 点击 Join 回调，携带当前输入房间名 |
| `joining`          | `boolean`              | `false` | 加入中状态，禁用按钮并显示 loading |
| `className`        | `string`               | -       | 自定义类名                        |