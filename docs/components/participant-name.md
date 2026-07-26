---
title: ParticipantName 参会者名称
order: 18
---

# ParticipantName 参会者名称

参会者名称组件，带音视频状态图标。

## 基础用法

```tsx
import { ParticipantName } from 'vauid-components';

export default () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <ParticipantName name="张三" audioEnabled videoEnabled />
    <ParticipantName name="John" audioEnabled videoEnabled={false} />
    <ParticipantName name="Alice" audioEnabled={false} videoEnabled={false} />
  </div>
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | `string` | - | 参会者名称 |
| `audioEnabled` | `boolean` | - | 音频是否开启 |
| `videoEnabled` | `boolean` | - | 视频是否开启 |
| `screenShare` | `boolean` | - | 是否屏幕分享 |
