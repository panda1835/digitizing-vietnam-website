"use client";

export type LayoutMode = "side" | "stack" | "image-only" | "text-only";

interface LayoutToggleProps {
  mode: LayoutMode;
  onChange: (mode: LayoutMode) => void;
}

const buttons: { mode: LayoutMode; label: string; title: string }[] = [
  { mode: "side", label: "Side by side", title: "Side by side" },
  { mode: "stack", label: "Stacked", title: "Stacked" },
  { mode: "image-only", label: "Image", title: "Image only" },
  { mode: "text-only", label: "Text", title: "Text only" },
];

export default function LayoutToggle({ mode, onChange }: LayoutToggleProps) {
  return (
    <div className="inline-flex rounded-md overflow-hidden border border-[#e1e1de]" role="group" aria-label="Layout mode">
      {buttons.map((btn, i) => (
        <button
          key={btn.mode}
          onClick={() => onChange(btn.mode)}
          title={btn.title}
          className={`px-3 py-1 text-sm font-light transition-colors ${
            i > 0 ? "border-l border-[#e1e1de]" : ""
          } ${
            mode === btn.mode
              ? "bg-branding-black text-white"
              : "bg-transparent text-branding-black hover:bg-branding-brown/10 hover:text-branding-brown"
          }`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
