---
title: Settings 设置
order: 21
---

# Settings 设置

设置面板 `SettingsPanel`，聚焦音视频场景能力：常规 / 音频 / 视频 / 系统四分区。设置项通过 `useSettings` 自动 localStorage 持久化（key: `vauid-settings`）。包含基础件 `Select` / `Checkbox` / `LangSelect` 与系统统计卡片。

## SettingsPanel 基础用法

左侧分区导航 + 右侧内容区。内部需在 `RoomCtxProvider` 内使用（视频分区的"布局单页人数"联动 `engine.setPageSize`）。

```tsx
import { RoomCtxProvider, SettingsPanel, type SelectOption } from 'vauid-components';

const LANG_OPTIONS: SelectOption[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
  { value: 'ja-JP', label: '日本語' },
];

export default () => (
  <RoomCtxProvider>
    <SettingsPanel
      style={{ width: 680, height: 440 }}
      langOptions={LANG_OPTIONS}
      network={{ bandwidth: 2048, lossRate: 0.2, jitter: 12, rtt: 45, networkType: 'wifi' }}
      audio={{ bitrate: 48, inputVolume: 80, outputVolume: 60 }}
      video={{ resolution: '1280×720', frameRate: 30, bitrate: 1200 }}
    />
  </RoomCtxProvider>
);
```

切换到"系统"分区可看到四类统计卡片；"视频"分区的单页人数会实时驱动布局引擎。

## 分区说明

| 分区 | 设置项 |
|------|--------|
| 常规 | 通知（会议开始 / 参会者进出）、性能模式（标准 / 节能 / 仅音频）、语言 |
| 音频 | 麦克风（Device 组件）、输入音量（DeviceSlider 真实增益）、扬声器、输出音量、噪声消除、自动调节、音量增强（0 = 不增强） |
| 视频 | 摄像头（Device 组件）、自动开启摄像头、视频镜像、布局单页人数（1-9，联动引擎） |
| 系统 | 负载 / 网络状态 / 音频 / 视频四类统计卡片 |

## Select 下拉选择

受控/非受控单选，选项复用 dropdown-item 样式体系，显示选中项 label。

```tsx
import { Select } from 'vauid-components';

export default () => (
  <Select
    style={{ minWidth: 160 }}
    options={[
      { label: '标准', value: 'standard' },
      { label: '节能', value: 'powerSaving' },
      { label: '仅音频', value: 'audioOnly' },
    ]}
    defaultValue="standard"
    onChange={(v) => console.log('change', v)}
  />
);
```

## Checkbox 复选框

label 整体作为点击热区。

```tsx
import { Checkbox } from 'vauid-components';

export default () => (
  <div style={{ display: 'flex', gap: 16 }}>
    <Checkbox label="噪声消除" defaultChecked />
    <Checkbox label="自动调节" />
    <Checkbox label="禁用项" disabled />
  </div>
);
```

## LangSelect 语言选择

基于 Select 的语言选择器，`value` / `onChange` 收窄为 `LangType`（BCP 47 语言代码，预置常用项自动补全，兼容任意自定义语言）。语言列表不内置，由使用方传入：

```tsx
import { LangSelect, type SelectOption } from 'vauid-components';

const LANG_OPTIONS: SelectOption[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en-US', label: 'English' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'ko-KR', label: '한국어' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'es-ES', label: 'Español' },
];

export default () => (
  <LangSelect
    options={LANG_OPTIONS}
    defaultValue="zh-CN"
    onChange={(lang) => console.log(lang)}
  />
);
```

## 系统统计卡片

四类预设卡片，stats 由 props 驱动（使用方从 RTCStats 取值传入），缺项显示 `-`。也可用 `StatCard` 自定义标题与条目。

```tsx
import { LoadCard, NetworkCard, AudioStatsCard, VideoStatsCard, StatCard } from 'vauid-components';

export default () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 220px)', gap: 12 }}>
    <LoadCard stats={{ cpuCores: 10, memoryTotal: 16, appMemory: 128 }} />
    <NetworkCard stats={{ bandwidth: 2048, lossRate: 0.2, jitter: 12, rtt: 45, networkType: 'wifi' }} />
    <AudioStatsCard stats={{ bitrate: 48, inputVolume: 80, outputVolume: 60 }} />
    <VideoStatsCard stats={{ resolution: '1280×720', frameRate: 30, bitrate: 1200 }} />
    <StatCard title="自定义" items={[{ label: '任意项', value: '值' }, { label: '缺省项' }]} />
  </div>
);
```

## 消费设置值

`useSettings` 可独立于面板使用，读取/更新同一份持久化状态（如用 `mirror` 决定视频镜像）：

```ts
import { useSettings } from 'vauid-components';

// 组件内：
const { settings, update } = useSettings();
// <VideoTile mirror={settings.mirror} />
```

## API

### SettingsPanelProps

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tab` | `SettingsTab` | - | 受控当前分区 |
| `defaultTab` | `SettingsTab` | `"general"` | 非受控默认分区 |
| `onTabChange` | `(tab: SettingsTab) => void` | - | 分区切换回调 |
| `load` | `LoadStats` | - | 负载统计（不传则内部用 performance API 采样兜底） |
| `network` | `NetworkStats` | - | 网络统计（RTCStats 驱动） |
| `audio` | `AudioStats` | - | 音频统计（RTCStats 驱动） |
| `video` | `VideoStats` | - | 视频统计（RTCStats 驱动） |
| `langOptions` | `SelectOption[]` | - | 语言选项（传入后常规分区才展示语言行） |
| `className` / `style` | - | - | 根元素样式 |

`SettingsTab = "general" | "audio" | "video" | "system"`

### useSettings

| 返回 | 类型 | 说明 |
|------|------|------|
| `settings` | `SettingsState` | 当前设置（含 13 项，见 `SettingsState` 定义） |
| `update` | `<K>(key: K, value: SettingsState[K]) => void` | 更新单项并自动 localStorage 持久化 |

### SelectProps

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string \| number` | - | 受控选中值 |
| `defaultValue` | `string \| number` | - | 非受控默认值 |
| `options` | `SelectOption[]`（`{ label, value, disabled? }`） | - | 选项列表 |
| `onChange` | `(value, option) => void` | - | 选中变化回调 |
| `placeholder` | `string` | `"请选择"` | 无选中时占位文本 |
| `disabled` | `boolean` | `false` | 是否禁用 |

### CheckboxProps

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `checked` | `boolean` | - | 受控选中态 |
| `defaultChecked` | `boolean` | `false` | 非受控默认选中 |
| `onChange` | `(checked: boolean) => void` | - | 选中变化回调 |
| `label` | `ReactNode` | - | 标签文本（整体热区） |
| `disabled` | `boolean` | `false` | 是否禁用 |

### LangSelectProps

继承 SelectProps（去掉 `value` / `defaultValue` / `onChange`），`options` 必传（语言列表由使用方提供）；`value` / `defaultValue` 收窄为 `LangType`，`onChange(lang: LangType)`。`LangType` 为 BCP 47 语言代码联合类型（`"zh-CN" | "en-US" | ...`），保留字符串兜底可扩展自定义语言。

### 统计卡片

`LoadCard` / `NetworkCard` / `AudioStatsCard` / `VideoStatsCard` 接收 `PresetCardProps & { stats?: XxxStats }`（title / items 内置）；`StatCard` 为通用底座：

| 属性 | 类型 | 说明 |
|------|------|------|
| `title` | `ReactNode` | 卡片标题 |
| `icon` | `ReactNode` | 标题前图标 |
| `items` | `{ label, value? }[]` | 统计项，value 为 undefined 时显示 `-` |

| 统计类型 | 字段 |
|----------|------|
| `LoadStats` | `cpuCores` / `memoryTotal`(GB) / `appCpu`(%) / `appMemory`(MB) |
| `NetworkStats` | `bandwidth`(kbps) / `lossRate`(%) / `jitter`(ms) / `rtt`(ms) / `networkType` |
| `AudioStats` | `bitrate`(kbps) / `inputVolume` / `outputVolume` |
| `VideoStats` | `resolution` / `frameRate`(fps) / `bitrate`(kbps) |
