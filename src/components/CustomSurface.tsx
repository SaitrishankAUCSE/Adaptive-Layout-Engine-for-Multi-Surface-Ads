import React, { useState } from "react";
import { Plus, X, Scan } from "lucide-react";
import type { Surface } from "../engine/types";
import { classifySurface } from "../engine/classify";

interface Props {
  onAdd: (surface: Surface) => void;
}

let customIdCounter = 1;

const SHAPE_META = {
  WIDE: { label: "WIDE", desc: "Horizontal layout", color: "#f59e0b" },
  SQUARE: { label: "SQUARE", desc: "Centered stack", color: "#6366f1" },
  TALL: { label: "TALL", desc: "Vertical stack", color: "#10b981" },
};

const CustomSurface: React.FC<Props> = ({ onAdd }) => {
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(400);
  const [expanded, setExpanded] = useState(false);

  const shape = classifySurface({ id: "tmp", name: "", width, height });
  const meta = SHAPE_META[shape];
  const ar = (width / height).toFixed(2);

  const handleAdd = () => {
    if (width < 50 || height < 50) return;
    onAdd({
      id: `custom-${customIdCounter++}`,
      name: `Custom ${width}×${height}`,
      width,
      height,
      custom: true,
    });
    setExpanded(false);
  };

  return (
    <div className="custom-surface-widget">
      <button
        className={`custom-toggle-btn ${expanded ? "active" : ""}`}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <X size={14} /> : <Plus size={14} />}
        Custom Surface
      </button>

      {expanded && (
        <div className="custom-surface-popover">
          <div className="popover-header">
            <Scan size={14} />
            <span>Add custom size</span>
          </div>

          <div className="custom-inputs">
            <div className="custom-field">
              <label>Width</label>
              <div className="number-input-wrap">
                <input
                  type="number"
                  min={50}
                  max={3000}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                />
                <span className="input-unit">px</span>
              </div>
            </div>

            <div className="custom-divider">×</div>

            <div className="custom-field">
              <label>Height</label>
              <div className="number-input-wrap">
                <input
                  type="number"
                  min={50}
                  max={3000}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                />
                <span className="input-unit">px</span>
              </div>
            </div>
          </div>

          {/* Live shape preview */}
          <div className="shape-preview-row">
            <div className="shape-ar">AR {ar}</div>
            <div className="shape-arrow">→</div>
            <div className="shape-badge" style={{ color: meta.color, borderColor: `${meta.color}40`, background: `${meta.color}12` }}>
              {meta.label}
            </div>
            <div className="shape-desc" style={{ color: meta.color }}>{meta.desc}</div>
          </div>

          <button className="custom-add-btn" onClick={handleAdd}>
            <Plus size={14} />
            Add to Grid
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomSurface;
