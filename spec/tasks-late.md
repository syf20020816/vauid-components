# 后期任务清单（第 10-15 周）

> 对应 [plan.md](./plan.md) 后期阶段。优先级：P0=必须 / P1=重要 / P2=可选

## W10-11：业务层扩展

> 10.1 Classroom / 10.2 LiveStream 已移除（业务层组合，非组件库职责）。
> 白板协作与远程协作的技术选型见 [collab-survey.md](../.trae/documents/collab-survey.md)：白板同步 = Yjs（CRDT）；传输 = 注入式 CollabTransport（DataChannel unreliable 控制流 + reliable 状态流）；统一二进制/JSON envelope。

| # | 任务 | 涉及文件 | 验收标准 | 优先级 |
|---|------|----------|----------|--------|
| 10.3a ✅ | 协作基座 `CollabTransport` | `components/collab/` | Transport 接口 + envelope 编解码（二进制/JSON）+ seq/ack；内存通道单测 | P0 |
| 10.3b ✅ | Yjs 桥 | `components/collab/yjs.ts` | doc update / awareness 桥接到 Transport；REMOTE_ORIGIN 回环防护 | P0 |
| 10.3c ✅ | 白板协作化 | `components/whiteboard/` | Y.Array 模型；UndoManager 撤销；远程光标（归一化坐标）；不传 collab 行为不变 | P0 |

## W12-13：远程协作

| # | 任务 | 涉及文件 | 验收标准 | 优先级 |
|---|------|----------|----------|--------|
| 12.1 | `RemoteSupport` 远程支持 | `components/remote-support/`（新建） | ScreenShare + MouseMapper + AnnotationLayer 组合 | P1 |
| 12.2 | `MouseMapper` 鼠标映射 | `components/remote-support/mouse.tsx` | PointerEvent 捕获、0-1 归一化坐标、unreliable 二进制帧（latest-wins 节流） | P1 |
| 12.3 | `AnnotationLayer` 标注层 | `components/remote-support/annotation.tsx` | Canvas 叠加标注；多人分层；撤销/清除（reliable 事件） | P1 |
| 12.4 | `EffectsLayer` 特效层 | `components/effects/`（新建） | 虚拟背景（MediaPipe/TensorFlow）、美颜、滤镜（WebGL） | P2（暂缓） |

## W14：工程质量

| # | 任务 | 涉及文件 | 验收标准 | 优先级 |
|---|------|----------|----------|--------|
| 14.1 | 无障碍 | 全局组件 | 键盘导航、aria 属性、高对比度、字体缩放 | P1 |
| 14.2 | 安全 | `components/tile/iframe.tsx` 等 | CSP 支持、iframe 沙箱、XSS 防护（输入转义） | P1 |
| 14.3 | 移动端适配 | 全局 | 触控手势、iOS Safari / Android Chrome 兼容 | P1 |
| 14.4 | 测试覆盖率 | `**/__tests__/` | 核心逻辑 >80%、UI >60%；Benchmark 报告 | P1 |

## W15：发布

| # | 任务 | 涉及文件 | 验收标准 | 优先级 |
|---|------|----------|----------|--------|
| 15.1 | npm 发布流程 | `package.json`、`.github/workflows/` | 发布脚本、CI/CD 自动化、changelog 规范 | P0 |
| 15.2 | dumi 文档补全 | `docs/**` | 全部组件文档齐备、demo 可运行 | P0 |
| 15.3 | v1.0 发布 | 全局 | 版本打标、发布验证、README 更新 | P0 |
