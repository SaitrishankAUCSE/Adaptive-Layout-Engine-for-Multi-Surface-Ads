import React from "react";
import type { PositionedElement } from "../engine/types";

interface Props {
  el: PositionedElement;
  scale: number;
}

/**
 * Renders a single ad element at its exact pixel position (as computed by the
 * engine). The parent container is scaled via CSS transform, so all values here
 * are in real surface pixels — no math needed at render time.
 */
const AdElement: React.FC<Props> = ({ el }) => {
  if (!el.visible) return null;

  const base: React.CSSProperties = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    overflow: "hidden",
    borderRadius: el.borderRadius ?? 0,
    boxSizing: "border-box",
    transition:
      "left 150ms ease-out, top 150ms ease-out, width 150ms ease-out, height 150ms ease-out, opacity 150ms ease-out, font-size 150ms ease-out",
  };

  switch (el.type) {
    case "image":
      if (!el.content) return null;
      const focalPos = el.focalPoint
        ? `${Math.round(el.focalPoint.x * 100)}% ${Math.round(el.focalPoint.y * 100)}%`
        : "center";
      return (
        <div style={base}>
          <img
            src={el.content}
            alt="Ad image"
            style={{
              width: "100%",
              height: "100%",
              objectFit: el.imageFit ?? "cover",
              objectPosition: focalPos,
              display: "block",
            }}
            loading="lazy"
          />
        </div>
      );

    case "logo":
      if (!el.content) return null;
      return (
        <div style={base}>
          <img
            src={el.content}
            alt="Brand logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: el.imageFit ?? "contain",
              objectPosition: "left center",
              display: "block",
            }}
            loading="lazy"
          />
        </div>
      );

    case "headline":
      if (!el.content?.trim()) return null;
      return (
        <div
          style={{
            ...base,
            fontSize: el.fontSize,
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#ffffff",
            fontFamily: "'Inter', sans-serif",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            letterSpacing: "-0.02em",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            textAlign: el.textAlign || "left",
          }}
        >
          {el.content}
        </div>
      );

    case "subtext":
      if (!el.content?.trim()) return null;
      return (
        <div
          style={{
            ...base,
            fontSize: el.fontSize,
            fontWeight: 400,
            lineHeight: 1.35,
            color: "rgba(255,255,255,0.85)",
            fontFamily: "'Inter', sans-serif",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            textAlign: el.textAlign || "left",
          }}
        >
          {el.content}
        </div>
      );

    case "cta":
      if (!el.content?.trim()) return null;
      return (
        <div
          style={{
            ...base,
            background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: el.fontSize,
            fontWeight: 700,
            color: "#ffffff",
            fontFamily: "'Inter', sans-serif",
            cursor: "pointer",
            letterSpacing: "0.02em",
            boxShadow: "0 4px 20px rgba(255, 107, 53, 0.45)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            padding: "0 12px",
          }}
        >
          {el.content}
        </div>
      );

    default:
      return null;
  }
};

export default AdElement;
