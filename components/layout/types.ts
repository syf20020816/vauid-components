import type { FnReturn, Nullable } from "../_std";

/**
 * # 实体类别
 * 这个枚举定义了实体的类别，帮助布局引擎和渲染层区分不同类别的实体，以便应用不同的布局策略和渲染方式。
 * 例如，参与者类别的实体通常会被优先放在主区，而自定义类别的实体可能会被放在缩略区或特殊区域。
 * 这个分类并不严格，业务层可以根据实际需求灵活使用和扩展，但建议至少区分参与者相关的实体和其他自定义实体，以便布局引擎做出更合理的布局决策。
 */
export const Categories = {
  /**
   * 代表一个参与者的实体，通常对应一个 Tile 宿主
   * - Video
   * - Audio
   * - ScreenShare
   * - ... Tracks
   * 只要是与参与者相关的实体都可以归为这个类别，布局引擎会默认给它们更高的优先级和特殊的布局策略，
   * 例如在焦点布局中优先把它们放在主区，并且在页码切换时优先保留它们的位置信息。
   */
  Participant: "participant",
  /**
   *  代表一个自定义分组的实体，例如白板、文档等非媒体流实体
   */
  Custom: "custom",
  /**
   * Floating 代表一个悬浮的实体，例如小窗、悬浮工具栏等不受布局引擎控制的特殊 UI 元素
   */
  Floating: "floating",
} as const;

export type Category = (typeof Categories)[keyof typeof Categories];

/**
 * # 实体来源
 * 这个枚举定义了实体的来源类型，帮助布局引擎和渲染层区分不同来源的实体，以便应用不同的布局策略和渲染方式。
 */
export const Sources = {
  /** 摄像头视频流 */
  Camera: "camera",
  /** 麦克风音频流 */
  Microphone: "microphone",
  /** 屏幕共享流 */
  ScreenShare: "screen_share",
  /** 自定义来源，例如白板、文档等非媒体流实体 */
  Custom: "custom",
} as const;

export type Source = (typeof Sources)[keyof typeof Sources];

/**
 * # 实体区域
 * 这个枚举定义了布局引擎中不同的实体展示区域，帮助布局引擎和渲染层区分主区、缩略区和普通网格区，以便应用不同的布局策略和渲染方式。
 * - 网格区适合展示多个同等重要的实体，例如参与者列表、文档缩略图等。
 * - 主区适合聚焦显示一个重要实体，例如当前发言者的视频流、共享屏幕等。
 * - 缩略区适合放置次要内容或预览，例如其他参与者的小窗、工具栏等。
 * 这个分类并不严格，业务层可以根据实际需求灵活使用和扩展，但建议至少区分主区和非主区，以便布局引擎做出更合理的布局决策。
 */
export const Areas = {
  /** 网格区，布局引擎默认的实体分布区域，适合展示多个同等重要的实体 */
  Grid: "grid",
  /** 主区，布局引擎优先展示的重要实体区域，用于聚焦显示关键内容 */
  Main: "main",
  /** 缩略区，布局引擎次要展示的实体区域，适合放置次要内容或预览 */
  Rail: "rail",
};

export type Area = (typeof Areas)[keyof typeof Areas];

/**
 * # 布局类型
 * 布局引擎支持网格和焦点两种基本布局类型，业务层可以根据实际需求选择合适的布局类型来展示实体。
 */
export const LayoutTypes = {
  /** 网格布局，所有实体在同一网格区展示，适合参与者列表等场景 */
  Grid: "grid",
  /** 焦点布局，主实体在主区展示，其他实体在缩略区展示，适合发言者聚焦等场景 */
  Focus: "focus",
} as const;

export type LayoutType = (typeof LayoutTypes)[keyof typeof LayoutTypes];

export const DeviceTypes = {
  /** 移动端 */
  Mobile: "mobile",
  /** 桌面端 */
  Desktop: "desktop",
} as const;

export type DeviceType = (typeof DeviceTypes)[keyof typeof DeviceTypes];

/**
 * 布局引擎依赖的最小实体抽象。
 *
 * 这个接口只要求一个稳定 id，确保布局库可以脱离 LiveKit 独立存在。
 * 如果业务层还需要保留原始对象，可以放在 payload 中回传给渲染层使用。
 */
export interface LayoutEntity<Payload = unknown> {
  // 稳定且唯一的实体标识。布局层只依赖这个字段判断节点身份。
  id: string;
  // 可选的实体类型信息，给上层做样式或策略分流使用。
  type?: string;
  // 可选的实体分组信息
  category?: Category;
  // 可选的来源信息
  source?: Source;
  // 可选的业务标签，方便上层做筛选和调试。
  label?: string;
  // 原始业务对象。布局引擎不依赖它，只透传给渲染层。
  payload?: Payload;
}

/**
 * # 布局节点信息
 *
 * 布局引擎输出的节点信息。每个节点对应一个布局实体和它在布局舞台上的位置尺寸等元信息
 *
 * 这个接口是布局引擎和渲染层的契约，渲染层可以根据这些信息来决定如何渲染每个节点
 */
export interface LayoutNode<Entity extends LayoutEntity = LayoutEntity> {
  // 当前布局节点对应的布局实体，外部渲染层可以基于它找到对应的 Tile 宿主
  entity: Entity;
  // 节点左上角在布局舞台中的 x 坐标
  x: number;
  // 节点左上角在布局舞台中的 y 坐标
  y: number;
  // 节点目标宽度
  width: number;
  // 节点目标高度
  height: number;
  // 节点所属区域，用于外部渲染层区分主区、缩略区和普通网格区
  area: Area;
  // 当前节点归属的页码。focus 布局下主节点和 rail 节点会共享同一页码
  page: number;
  // 是否为当前焦点节点。外部可以用它决定是否高亮、置顶或绑定特殊交互
  isFocus: boolean;
  // 渲染层级，便于后续做 transform 过渡时保持主节点始终覆盖缩略区
  zIndex: number;
}

/**
 * # 布局状态
 * 布局引擎输出的整体布局状态，包括当前所有布局节点的信息、分页信息、布局类型和尺寸信息等。
 *
 * **这个接口是布局引擎和渲染层的契约，渲染层可以根据这些信息来决定如何渲染整个布局舞台，以及提供分页切换等交互功能**
 */
export interface LayoutState<Entity extends LayoutEntity = LayoutEntity> {
  /** 布局节点列表 */
  nodes: LayoutNode<Entity>[];
  /** 当前页码 */
  currentPage: number;
  /** 总页数 */
  totalPages: number;
  /** 布局类型 */
  layoutType: LayoutType;
  /** 布局宽度 */
  width: number;
  /** 布局高度 */
  height: number;
  /** 当前焦点实体 */
  focusEntity: Nullable<Entity>;
  /** 设置页码 */
  setPage: (page: number) => FnReturn<void>;
  /** 下一页 */
  nextPage: () => FnReturn<void>;
  /** 上一页 */
  prevPage: () => FnReturn<void>;
}

export type LayoutNodes<Entity extends LayoutEntity = LayoutEntity> = Map<
  string,
  LayoutNode<Entity>
>;

export type EngineCallback = () => FnReturn<void>;

/**
 * ## NodeUpdate - 节点变化类型
 * 当节点更新时，但这不一定会让布局引擎触发重新计算
 * ### 物理属性更新
 * 1. 位置
 * 2. 尺寸
 */
export const NodeUpdates = {
  /** 节点增加 */
  Add: "add",
  /** 节点删除 */
  Remove: "remove",
  /** 节点非物理属性更新 */
  NonPhysicalUpdate: "non-physical-update",
  /** 节点物理属性更新 */
  PhysicalUpdate: "physical-update",
};

export type NodeUpdate = (typeof NodeUpdates)[keyof typeof NodeUpdates];


export const LifeTimes = {
  /** 引擎初始化时触发 */
  onInit: "onInit",
  /** 引擎运行时触发 */
  onRun: "onRun",
  /** 引擎中监听容器尺寸变化触发 */
  onResize: "onResize",
  /** 引擎中任何 state 出现更新时触发 */
  onUpdate: "onUpdate",
  /** 引擎中监听实体更新触发, 包括实体的增加/删除/更新 */
  onEntityUpdate: "onEntityUpdate",
  /** 引擎销毁时触发 */
  onDestroy: "onDestroy",
};

export type LifeTime = (typeof LifeTimes)[keyof typeof LifeTimes];

/** 事件类型映射 - 每个生命周期事件对应不同的参数签名 */
export interface LifeTimeEventMap {
  [LifeTimes.onInit]: () => FnReturn<void>;
  [LifeTimes.onRun]: () => FnReturn<void>;
  [LifeTimes.onResize]: (width: number, height: number) => FnReturn<void>;
  [LifeTimes.onUpdate]: () => FnReturn<void>;
  [LifeTimes.onEntityUpdate]: (
    entities: LayoutNodes<LayoutEntity>,
    type: NodeUpdate,
  ) => FnReturn<void>;
  [LifeTimes.onDestroy]: () => FnReturn<void>;
}

export type LifeTimeEvent<T extends LifeTime = LifeTime> = LifeTimeEventMap[T];
