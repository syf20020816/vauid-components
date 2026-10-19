import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  type RefObject,
} from "react";
import { Avatar } from "../participant/avatar";
import "../participant/index.scss";
import "./index.scss";
import { useCls } from "../std/hooks/cls";
import { DEFAULT_COLORS } from "../style/global";
import type { FnReturn } from "vauid-components/std";

export interface AudioTileProps extends HTMLAttributes<HTMLDivElement> {
  name?: string;
  avatar?: ReactNode;
  avatarSrc?: string;
  /** 未绑定音频流时的静态活跃度；绑定流后波形由真实音量驱动，此属性失效 */
  speaking?: boolean;
  /** 元素挂载后触发，用于将媒体源挂载到该元素（如厂商 track.attach(el)） */
  bind?: (el: HTMLAudioElement) => FnReturn<void>;
  /** 元素卸载前触发，入参为 bind 时传入的同一元素（如 track.detach(el)） */
  unbind?: (el: HTMLAudioElement) => FnReturn<void>;
}

export const AudioTile = forwardRef<HTMLAudioElement, AudioTileProps>(
  (
    {
      name = "",
      avatar,
      avatarSrc,
      speaking = false,
      bind,
      unbind,
      className,
      onClick,
      ...props
    },
    ref,
  ) => {
    const { cls, vcls } = useCls("audio-tile", className);
    const audioRef = useRef<HTMLAudioElement>(null);

    useImperativeHandle(ref, () => audioRef.current!);

    useEffect(() => {
      // setup 时捕获元素；unmount 时 ref.current 已被 React 置 null，
      // cleanup 必须复用此闭包变量才能拿到元素
      const el = audioRef.current;
      if (!el) return;
      bind?.(el);
      return () => {
        if (unbind) void unbind(el);
      };
    }, [bind, unbind]);

    return (
      <div className={cls} onClick={onClick} {...props}>
        <div className={vcls("avatar")}>
          {avatar ? avatar : <Avatar name={name} size={64} src={avatarSrc} />}
        </div>

        <div className={vcls("waveform")}>
          <AudioLevel
            source={audioRef}
            variant="voice"
            barCount={48}
            height={64}
            active={speaking}
            color={
              speaking
                ? DEFAULT_COLORS.success.main
                : DEFAULT_COLORS.textSecondary
            }
          />
        </div>

        <audio ref={audioRef} autoPlay />
      </div>
    );
  },
);

AudioTile.displayName = "AudioTile";

// --------- audio-level -------------------------------------------

export type AudioLevelVariant = "bars" | "circle" | "wave" | "voice";

/** 音频源：MediaStream 直传，或媒体元素 ref（读取其 srcObject） */
export type AudioLevelSource = MediaStream | RefObject<HTMLMediaElement | null>;

export interface AudioLevelProps extends HTMLAttributes<HTMLDivElement> {
  /** 音频源（MediaStream 或媒体元素 ref），异步挂载的流会被自动捕获 */
  source?: AudioLevelSource;
  /** 展示形态：bars 频谱条（默认）/ circle 圆环 / wave 波形 / voice 语音条（大量圆角竖条，iMessage 风格） */
  variant?: AudioLevelVariant;
  /** 频谱采样桶数（bars/circle 的段数），默认 24 */
  barCount?: number;
  /** 主色，默认 currentColor（继承文字颜色），变更即时生效不重建分析链 */
  color?: string;
  /** 容器高度（px），默认 32；circle 模式以 min(宽, 高) 为基准自适应 */
  height?: number;
  /** 活跃度档位：true 时模拟波动幅度更大（对应说话中），默认 false */
  active?: boolean;
  /** 静默/无流时模拟波动保持视觉活跃，默认 true */
  simulate?: boolean;
  /** 可见性：false 时跳过全部计算与绘制（0 帧渲染，分析链保留），默认 true。布局场景可传 visible={!node.hidden} */
  visible?: boolean;
  /** 绘制帧率上限（fps），undefined 为全速；用于限帧降负载，跳帧期间缓动状态保留 */
  fps?: number;
}

/** 解析音频源为 MediaStream */
const resolveStream = (source?: AudioLevelSource): MediaStream | null => {
  if (!source) return null;
  if (source instanceof MediaStream) return source;
  const el = source.current;
  return el?.srcObject instanceof MediaStream ? el.srcObject : null;
};

/** 静默模拟：叠加双正弦生成 0..1 伪电平 */
const simulateLevel = (i: number, t: number): number => {
  const a = Math.sin(t * 2.1 + i * 0.55) * 0.5 + 0.5;
  const b = Math.sin(t * 3.3 + i * 1.7) * 0.5 + 0.5;
  return 0.06 + (a * 0.55 + b * 0.45) * 0.5;
};

/** 中点二次贝塞尔平滑连线（假定当前路径位置已在 pts[0]） */
const smoothTo = (ctx: CanvasRenderingContext2D, pts: [number, number][]) => {
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0], last[1]);
};

/** 按 variant 绘制频谱（w/h 为 CSS 像素，变换已由调用方设置） */
const draw = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  levels: Float32Array,
  variant: AudioLevelVariant,
  color: string,
) => {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  const n = levels.length;

  // bars / voice：居中对称的圆角竖条（数据不同：bars 为频谱桶，voice 为能量包络×形状）
  if (variant === "bars" || variant === "voice") {
    const slot = w / n;
    const barW = Math.max(2, slot * 0.55);
    for (let i = 0; i < n; i++) {
      const bh = Math.max(2, levels[i] * h * 0.92);
      const x = i * slot + (slot - barW) / 2;
      ctx.beginPath();
      ctx.roundRect(x, (h - bh) / 2, barW, bh, barW / 2);
      ctx.fill();
    }
    return;
  }

  if (variant === "wave") {
    // 平滑包络曲线（中点贝塞尔，上沿 + 镜像下沿）填充
    const amp = h * 0.92;
    const top: [number, number][] = [];
    const bottom: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * w;
      top.push([x, h / 2 - (levels[i] * amp) / 2]);
      bottom.push([x, h / 2 + (levels[i] * amp) / 2]);
    }
    bottom.reverse();
    ctx.beginPath();
    ctx.moveTo(top[0][0], top[0][1]);
    smoothTo(ctx, top);
    ctx.lineTo(bottom[0][0], bottom[0][1]);
    smoothTo(ctx, bottom);
    ctx.closePath();
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }

  // circle：中心圆随音量（RMS）脉动 + 外圈环形频谱
  const cx = w / 2;
  const cy = h / 2;
  const base = Math.min(w, h) * 0.22;
  let rms = 0;
  for (let i = 0; i < n; i++) rms += levels[i];
  rms /= n;

  ctx.beginPath();
  ctx.arc(cx, cy, base * (0.85 + rms * 0.7), 0, Math.PI * 2);
  ctx.globalAlpha = 0.9;
  ctx.fill();
  ctx.globalAlpha = 1;

  const r0 = base * 1.35;
  ctx.lineWidth = Math.max(1.5, base * 0.12);
  ctx.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
    const len = levels[i] * Math.min(w, h) * 0.22;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
    ctx.lineTo(
      cx + Math.cos(ang) * (r0 + len),
      cy + Math.sin(ang) * (r0 + len),
    );
    ctx.stroke();
  }
};

/**
 * # AudioLevel - 音频电平指示器
 * AnalyserNode + rAF 驱动的实时频谱可视化，支持四种形态：
 * - `bars`：居中对称的频谱条（默认，数据为频谱桶）
 * - `voice`：语音条——大量细圆角竖条随音量自然起伏（iMessage 风格，建议 barCount 40+）
 * - `circle`：音量脉动圆环（适配头像叠加场景）
 * - `wave`：包络波形填充
 *
 * 数据源可传 MediaStream（如 getUserMedia 麦克风流）或挂载了流的
 * audio/video 元素 ref；流异步挂载时自动捕获。无流或静默时默认
 * 以模拟波动保持视觉活跃（simulate 关闭后显示最低电平）。
 */
export const AudioLevel = ({
  source,
  variant = "bars",
  barCount = 24,
  color = "currentColor",
  height = 32,
  active = false,
  simulate = true,
  visible = true,
  fps,
  className,
  style,
  ...props
}: AudioLevelProps) => {
  const { cls } = useCls("audio-level", className);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 动态 props 转存 ref：rAF 内每帧读取，变更即时生效且不触发分析链/画布循环重建
  const sourceRef = useRef<AudioLevelSource | undefined>(source);
  const dynamicRef = useRef({ variant, color, active, simulate, visible, fps });
  useEffect(() => {
    sourceRef.current = source;
    dynamicRef.current = { variant, color, active, simulate, visible, fps };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    const createFreqBuffer = (n: number) => new Uint8Array(n);
    let freq: ReturnType<typeof createFreqBuffer> | null = null;
    let boundStream: MediaStream | null = null;
    let raf = 0;
    let lastW = 0;
    let lastH = 0;
    // 上次实际绘制的时刻（fps 限帧用）
    let lastDraw = 0;
    const levels = new Float32Array(barCount);
    // 本帧原始目标值（未经平滑），levels 为缓动后的渲染值
    const targets = new Float32Array(barCount);
    // voice 形态的固定形状权重（伪随机 0.4~1，每次挂载形态一致，起伏自然且无频谱左右偏斜）
    const shape = new Float32Array(barCount);
    for (let i = 0; i < barCount; i++) {
      const r = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      shape[i] = 0.4 + 0.6 * (r - Math.floor(r));
    }

    // 惰性建立分析链：source 出现/变更时重建（AudioContext 可多实例共存，互不影响）
    const ensureAnalyser = (stream: MediaStream) => {
      if (boundStream === stream && analyser) return;
      audioCtx?.close().catch(() => {});
      audioCtx = new AudioContext();
      const src = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      src.connect(analyser);
      freq = createFreqBuffer(analyser.frequencyBinCount);
      boundStream = stream;
      // 无用户手势场景下浏览器可能挂起，尝试恢复
      audioCtx.resume().catch(() => {});
    };

    const tick = (now: number) => {
      // 循环排队提前：任何 early return（限帧 / 不可见）都不会断掉绘制循环
      raf = requestAnimationFrame(tick);
      const { variant, color, active, simulate, visible, fps } =
        dynamicRef.current;
      // 0 帧渲染：不可见时跳过全部计算与绘制（rAF 空转开销可忽略，页面后台时浏览器自动暂停）
      if (!visible) return;
      // 限帧：距上次绘制不足 1/fps 秒时跳帧，缓动状态保留、恢复无跳变
      if (fps !== undefined && now - lastDraw < 1000 / fps) return;
      lastDraw = now;
      // 模拟幅度两档：对应"说话中 / 静默"的视觉区分（对齐原 useAudioWave 的 max 1 / 0.45）
      const simAmp = active ? 1 : 0.45;
      const t = now / 1000;
      const stream = resolveStream(sourceRef.current);
      if (stream) ensureAnalyser(stream);

      // 计算本帧目标电平（0..1）
      if (variant === "voice") {
        // 语音条：全局能量包络驱动整体高度，固定形状权重制造条间自然起伏
        let env = 0;
        if (analyser && freq) {
          let sum = 0;
          for (let j = 0; j < freq.length; j++) sum += freq[j];
          // 增益补偿：语音的频域均值偏低，拉到可用动态区间
          env = Math.min(1, (sum / freq.length / 255) * 2.2);
        } else if (simulate) {
          env =
            simAmp *
            (0.25 +
              0.75 *
                ((Math.sin(t * 1.9) * 0.5 + 0.5) *
                  (0.6 + 0.4 * (Math.sin(t * 0.7 + 1) * 0.5 + 0.5))));
        }
        for (let i = 0; i < barCount; i++) {
          targets[i] = Math.max(
            0.05,
            env * shape[i] * (0.85 + 0.15 * Math.sin(t * 2.6 + i * 0.9)),
          );
        }
      } else if (analyser && freq) {
        analyser.getByteFrequencyData(freq);
        const usable = Math.floor(freq.length * 0.7); // 高频段多为空，截去
        const step = Math.max(1, Math.floor(usable / barCount));
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) sum += freq[i * step + j] ?? 0;
          const v = sum / step / 255;
          targets[i] = Math.max(
            simulate && v < 0.06 ? simulateLevel(i, t) * simAmp * 0.25 : v,
            0.05,
          );
        }
      } else if (simulate) {
        for (let i = 0; i < barCount; i++)
          targets[i] = simulateLevel(i, t) * simAmp;
      } else {
        targets.fill(0.05);
      }

      // 丝滑管线：空间三点平滑（消除相邻桶锯齿）+ 时间缓动（消除帧间抖动，约 100ms 收敛）
      for (let i = 0; i < barCount; i++) {
        const l = levels[Math.max(0, i - 1)];
        const r = levels[Math.min(barCount - 1, i + 1)];
        const spatial = (l + levels[i] * 2 + r) / 4;
        levels[i] = spatial + (targets[i] - spatial) * 0.35;
      }

      // 画布尺寸跟随容器（dpr 适配，尺寸变化时才重设避免每帧触发布局）
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      if (w !== lastW || h !== lastH) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        lastW = w;
        lastH = h;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, w, h, levels, variant, color);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      audioCtx?.close().catch(() => {});
    };
    // 动态 props（variant/color/active/simulate/source）经 ref 每帧读取，不进依赖
  }, [barCount]);

  return (
    <div {...props} className={cls} style={{ height, ...style }}>
      <canvas ref={canvasRef} />
    </div>
  );
};
