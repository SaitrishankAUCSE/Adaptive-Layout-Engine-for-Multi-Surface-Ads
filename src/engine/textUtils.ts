let measureCanvasContext: CanvasRenderingContext2D | null = null;

/**
 * Accurately measures the width of a given string in pixels using the DOM Canvas API.
 * This ensures exact bounding boxes instead of naive character counts.
 */
export function measureTextWidth(text: string, fontSize: number, fontWeight: number | string = 800, fontFamily: string = "'Inter', sans-serif"): number {
  if (typeof window === "undefined") {
    // Fallback for SSR/tests where canvas isn't available
    return text.length * fontSize * 0.55; 
  }

  if (!measureCanvasContext) {
    const canvas = document.createElement("canvas");
    measureCanvasContext = canvas.getContext("2d");
  }

  if (!measureCanvasContext) {
    return text.length * fontSize * 0.55; 
  }

  measureCanvasContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const metrics = measureCanvasContext.measureText(text);
  return metrics.width;
}

/**
 * Calculates the precise number of lines a string will take up when wrapped
 * inside a container of `maxWidth`.
 */
export function calculateWrappedLines(text: string, maxWidth: number, fontSize: number, fontWeight: number | string = 800, fontFamily: string = "'Inter', sans-serif"): number {
  if (!text.trim()) return 0;
  
  const words = text.split(/\s+/);
  let lines = 1;
  let currentLineWidth = 0;
  const spaceWidth = measureTextWidth(" ", fontSize, fontWeight, fontFamily);

  for (const word of words) {
    const wordWidth = measureTextWidth(word, fontSize, fontWeight, fontFamily);
    
    // If the word itself is wider than the max width, it will break.
    // For simplicity, we count it as a line and continue, but CSS word-break
    // might wrap it into multiple lines. We'll approximate very long words.
    if (wordWidth > maxWidth && maxWidth > 0) {
      if (currentLineWidth > 0) lines++;
      lines += Math.floor(wordWidth / maxWidth);
      currentLineWidth = wordWidth % maxWidth;
      continue;
    }

    if (currentLineWidth + wordWidth + (currentLineWidth > 0 ? spaceWidth : 0) > maxWidth) {
      lines++;
      currentLineWidth = wordWidth;
    } else {
      currentLineWidth += (currentLineWidth > 0 ? spaceWidth : 0) + wordWidth;
    }
  }

  return lines;
}
