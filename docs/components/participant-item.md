---
title: ParticipantItem 参会者项
order: 3
---

# ParticipantItem 参会者项

参会者列表项组件，包含头像、名称、角色和音视频状态。

## 基础用法

```tsx
import { ParticipantItem } from 'vauid-components';

export default () => (
  <div style={{ width: 300 }}>
    <ParticipantItem
      name="张三"
      role="participant"
      audioEnabled
      videoEnabled
    />
    <ParticipantItem
      name="John"
      role="host"
      audioEnabled
      videoEnabled={false}
    />
    <ParticipantItem
      name="Alice"
      role="manager"
      audioEnabled={false}
      videoEnabled
    />
    <ParticipantItem
      name="Bob"
      role="guest"
      audioEnabled={false}
      videoEnabled={false}
    />
  </div>
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | `string` | - | 参会者名称 |
| `avatarSrc` | `string` | - | 头像图片地址 |
| `role` | `"host" \| "participant" \| "manager" \| "guest"` | - | 角色类型 |
| `extra` | `ReactNode` | - | 额外信息 |
| `audioEnabled` | `boolean` | - | 音频是否开启 |
| `videoEnabled` | `boolean` | - | 视频是否开启 |
| `avatarSize` | `number` | `36` | 头像尺寸 |
