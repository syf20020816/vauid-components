---
title: Vauid Components
order: 0
---

# Vauid Components

高性能 Web 音视频协作组件库，专为音视频会议、远程协作、在线教育等场景设计。提供从布局引擎到媒体渲染、交互控制的全套组件解决方案。

## 核心特性

- **虚拟布局引擎**：DOM 恒定 + Transform 驱动，布局切换时 iframe/视频零重载、60fps 丝滑过渡
- **智能末尾填补**：删除实体时用末尾实体填补空缺，Transform 计算量从 O(N) 降至 O(1)
- **Web Worker 计算**：布局计算异步执行，不阻塞主线程，超时自动回退到同步计算
- **多端适配**：桌面端/移动端差异化默认参数，容器尺寸变化时自动重算
- **框架无关引擎**：纯计算核心，可在 React/Vue/原生 JS 中使用
- **开箱即用组件**：Tile（Video/Audio/Note）、控制栏、参会者列表、状态指示等

## 快速开始

```bash
pnpm install vauid-components
```

```tsx
import { Button, Tag, Avatar, ParticipantItem } from 'vauid-components';

export default () => (
  <div style={{ padding: '20px' }}>
    <h3 style={{ marginBottom: '16px' }}>基础组件示例</h3>
    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
      <Button>主要按钮</Button>
      <Button round>圆角按钮</Button>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Avatar name="张三" />
      <ParticipantItem
        name="张三"
        role="participant"
        audioEnabled
        videoEnabled
      />
    </div>
  </div>
);
```
