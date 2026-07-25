---
title: During 会议时长
order: 6
---

# During 会议时长

会议时长和录制状态显示组件。

## 基础用法

```tsx
import { During } from 'vauid-components';

export default () => (
  <>
    <During roomStartTime={Date.now() - 3723000} />
    <During
      roomStartTime={Date.now() - 3723000}
      recording
      recordingStartTime={Date.now() - 120000}
    />
  </>
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `roomStartTime` | `number` | - | 房间开始时间戳 |
| `recording` | `boolean` | `false` | 是否正在录制 |
| `recordingStartTime` | `number` | - | 录制开始时间戳 |
