import type { BuildInPlacements } from "@rc-component/trigger";

export function getPopupContainer(): HTMLElement {
  let el = document.getElementById("vauid-popup-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "vauid-popup-root";
    el.style.cssText =
      "position:fixed;inset:0;z-index:9999;pointer-events:none";
    document.body.appendChild(el);
  }
  return el;
}

export const builtinPlacements: BuildInPlacements = {
  bottomLeft: {
    points: ["tl", "bl"],
    offset: [0, 4],
    overflow: {
      adjustX: true,
      adjustY: true,
      shiftX: true,
      shiftY: true,
    },
  },
  bottomRight: {
    points: ["tr", "br"],
    offset: [0, 4],
    overflow: {
      adjustX: true,
      adjustY: true,
      shiftX: true,
      shiftY: true,
    },
  },
  topLeft: {
    points: ["bl", "tl"],
    offset: [0, -4],
    overflow: {
      adjustX: true,
      adjustY: true,
      shiftX: true,
      shiftY: true,
    },
  },
  topRight: {
    points: ["br", "tr"],
    offset: [0, -4],
    overflow: {
      adjustX: true,
      adjustY: true,
      shiftX: true,
      shiftY: true,
    },
  },
  leftTop: {
    points: ["tr", "tl"],
    offset: [-4, 0],
    overflow: {
      adjustX: true,
      adjustY: true,
      shiftX: true,
      shiftY: true,
    },
  },
  leftBottom: {
    points: ["br", "bl"],
    offset: [-4, 0],
    overflow: {
      adjustX: true,
      adjustY: true,
      shiftX: true,
      shiftY: true,
    },
  },
  rightTop: {
    points: ["tl", "tr"],
    offset: [4, 0],
    overflow: {
      adjustX: true,
      adjustY: true,
      shiftX: true,
      shiftY: true,
    },
  },
  rightBottom: {
    points: ["bl", "br"],
    offset: [4, 0],
    overflow: {
      adjustX: true,
      adjustY: true,
      shiftX: true,
      shiftY: true,
    },
  },
};
