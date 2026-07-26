---
title: 组件概览
nav:
  title: 组件
  order: 1
---

# 组件总览

Vauid Components 提供了一套完整的音视频协作场景组件，覆盖通用 UI、参会者、状态指示、控制器和媒体渲染等多个类别。

## 快速开始

```tsx
import { Button, Tag, Avatar } from 'vauid-components';

export default () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <Button>按钮</Button>
    <Tag>标签</Tag>
    <Avatar name="张三" />
  </div>
);
```

## 组件分类

### 通用组件

- [Button 按钮](/components/button) — 基础按钮，支持图标、尺寸、圆角
- [Tag 标签](/components/tag) — 状态标签、分类标签
- [Input 输入框](/components/input) — 文本输入、密码输入、数字输入、文本域
- [Dropdown 下拉菜单](/components/dropdown) — 下拉选项菜单
- [Trigger 触发器](/components/trigger) — 选择触发器组件

### 参会者组件

- [ParticipantItem 参会者列表项](/components/participant-item) — 参会者列表项，含头像、名称、角色、音视频状态
- [ParticipantName 参会者名称](/components/participant-name) — 带音视频状态图标的名称显示
- [ParticipantNum 参会人数](/components/participant-num) — 参会人数徽章
- [Avatar 头像](/components/avatar) — 用户头像，支持文字和图片
- [Role 角色标签](/components/role) — 主持人、参会者、管理员、游客

### 状态指示

- [During 会议时长](/components/during) — 会议时长和录制状态
- [Focus 焦点状态](/components/focus) — 焦点状态指示
- [FullScreen 全屏](/components/fullscreen) — 全屏切换按钮
- [RaiseHand 举手](/components/raisehand) — 举手状态按钮
- [NetworkStatus 网络状态](/components/network) — 网络信号强度指示

### 控制器

- [Controller 控制栏](/components/controller) — 会议控制栏，包含设备切换、退出按钮

### 媒体组件

- [VideoTile 视频 Tile](/components/video-tile) — 视频渲染单元
- [AudioTile 音频 Tile](/components/audio-tile) — 音频渲染单元
- [NoteTile 备注 Tile](/components/note-tile) — 文本/备注 Tile
