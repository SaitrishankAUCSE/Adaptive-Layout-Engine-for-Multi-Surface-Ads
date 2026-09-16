import React, { useCallback, useState, useRef, useEffect } from "react";
import { UploadCloud, FileImage, X } from "lucide-react";
import { cn } from "../lib/utils";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export const FileUploadField: React.FC<Props> = ({ value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  // Track any blob URL we create so we can revoke it on unmount or replacement
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      // Clean up any object URL we created when this component unmounts
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const applyFile = useCallback(
    (file: File) => {
      // Revoke the previous blob URL before creating a new one
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      blobUrlRef.current = url;
      onChange(url);
    },
    [onChange]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) applyFile(file);
    },
    [applyFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) applyFile(file);
    },
    [applyFile]
  );

  const handleClear = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    onChange("");
  }, [onChange]);

  return (
    <div className="flex flex-col gap-3">
      {value ? (
        <div className="relative group overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-2">
          <img
            src={value}
            alt="Preview"
            className="w-full h-28 object-contain rounded-lg"
          />
          <button
            onClick={handleClear}
            title="Remove image"
            className="absolute top-3 right-3 p-1.5 bg-black/70 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white text-muted-foreground cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <label
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden group",
            isDragging
              ? "border-primary/60 bg-primary/5 scale-[0.98]"
              : "border-white/10 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/20"
          )}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-10 transition-opacity group-hover:opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "16px 16px",
            }}
          />

          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <UploadCloud
              className="w-6 h-6 transition-transform group-hover:-translate-y-0.5"
            />
            <p className="text-xs font-medium">
              Drop file or{" "}
              <span className="text-primary">click to browse</span>
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              PNG, JPG, SVG, GIF
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
          />
        </label>
      )}

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-white/5" />
        <span className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider">
          or url
        </span>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      <div className="relative">
        <FileImage className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.png"
          className="field-input pl-9"
        />
      </div>
    </div>
  );
};
