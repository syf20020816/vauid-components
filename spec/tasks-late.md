# 后期任务清单（第 10-15 周）

> 对应 [plan.md](./plan.md) 后期阶段。优先级：P0=必须 / P1=重要 / P2=可选

## W10-11：业务层扩展

| # | 任务 | 涉及文件 | 验收标准 | 优先级 |
|---|------|----------|----------|--------|
| 10.1 | `Classroom` 在线课堂 | `components/classroom/`（新建） | Layout + Whiteboard + ChatPanel + ControlBar 组合；白板协作可用 | P0 |
| 10.2 | `LiveStream` 直播 | `components/livestream/`（新建） | Layout + AudioLevel + 聊天 + 观看人数 | P1 |
| 10.3 | 白板 `Whiteboard` | `components/whiteboard/`（新建） | Canvas/SVG 渲染；多人实时同步（CRDT/OT）；撤销重做、导出 | P0 |

## W12-13：远程协作

| # | 任务 | 涉及文件 | 验收标准 | 优先级 |
|---|------|----------|----------|--------|
| 12.1 | `RemoteSupport` 远程支持 | `components/remote-support/`（新建） | ScreenShare + MouseMapper + AnnotationLayer 组合 | P1 |
| 12.2 | `MouseMapper` 鼠标映射 | `components/remote-support/mouse.tsx` | PointerEvent 捕获、坐标转换、DataChannel 传输 | P1 |
| 12.3 | `AnnotationLayer` 标注层 | `components/remote-support/annotation.tsx` | Canvas 叠加标注；多人分层；撤销/清除 | P1 |
| 12.4 | `EffectsLayer` 特效层 | `components/effects/`（新建） | 虚拟背景（MediaPipe/TensorFlow）、美颜、滤镜（WebGL） | P2 |

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
