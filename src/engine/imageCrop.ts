import type { FocalPoint } from "./types";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Computes intelligent crop rects and CSS object-fit positioning
 * based on surface target dimensions, image aspect ratio, and optional focal point.
 */
export function computeImageCrop(
  containerWidth: number,
  containerHeight: number,
  imageAspectRatio: number,
  fit: "cover" | "contain" = "cover",
  focalPoint?: FocalPoint
): {
  objectFit: "cover" | "contain";
  objectPosition: string;
  renderedWidth: number;
  renderedHeight: number;
} {
  const containerAR = containerWidth / Math.max(1, containerHeight);
  const focalX = focalPoint ? Math.max(0, Math.min(1, focalPoint.x)) : 0.5;
  const focalY = focalPoint ? Math.max(0, Math.min(1, focalPoint.y)) : 0.5;
  const objectPosition = `${Math.round(focalX * 100)}% ${Math.round(focalY * 100)}%`;

  if (fit === "contain") {
    if (imageAspectRatio > containerAR) {
      const renderedWidth = containerWidth;
      const renderedHeight = Math.round(containerWidth / imageAspectRatio);
      return { objectFit: "contain", objectPosition, renderedWidth, renderedHeight };
    } else {
      const renderedHeight = containerHeight;
      const renderedWidth = Math.round(containerHeight * imageAspectRatio);
      return { objectFit: "contain", objectPosition, renderedWidth, renderedHeight };
    }
  }

  // "cover" fit ensures container is filled without distortion
  return {
    objectFit: "cover",
    objectPosition,
    renderedWidth: containerWidth,
    renderedHeight: containerHeight,
  };
}
