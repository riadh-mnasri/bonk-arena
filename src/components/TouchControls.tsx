// © 2026 Riadh MNASRI

"use client";

import type { Dictionary } from "@/i18n/dictionary";
import type { InputFrame } from "@/game/types";

interface Props {
  dict: Dictionary;
  onChange: (key: keyof InputFrame, down: boolean) => void;
}

interface PadProps {
  k: keyof InputFrame;
  label: string;
  glyph: string;
  className: string;
  onChange: Props["onChange"];
}

function Pad({ k, label, glyph, className, onChange }: PadProps) {
  const set = (v: boolean) => onChange(k, v);
  return (
    <button
      type="button"
      aria-label={label}
      className={`touch-btn ${className}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        set(true);
      }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
      onLostPointerCapture={() => set(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {glyph}
    </button>
  );
}

/** On-screen pad for tablets, used in 1 player mode. */
export function TouchControls({ dict, onChange }: Props) {
  return (
    <div className="flex items-end justify-between gap-4 px-2 pt-3 select-none touch-none">
      <div className="grid grid-cols-3 grid-rows-2 gap-2">
        <span />
        <Pad onChange={onChange} k="up" label={dict.jump} glyph="↑" className="bg-sky" />
        <span />
        <Pad onChange={onChange} k="left" label={dict.move} glyph="←" className="bg-sky" />
        <Pad onChange={onChange} k="down" label={dict.crouch} glyph="↓" className="bg-sky" />
        <Pad onChange={onChange} k="right" label={dict.move} glyph="→" className="bg-sky" />
      </div>
      <div className="flex items-end gap-2">
        <div className="flex flex-col items-center gap-1">
          <Pad onChange={onChange} k="punch" label={dict.punch} glyph="👊" className="bg-sun" />
          <span className="text-xs font-bold">{dict.punch}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Pad onChange={onChange} k="kick" label={dict.kick} glyph="🦶" className="bg-orange" />
          <span className="text-xs font-bold">{dict.kick}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Pad onChange={onChange} k="special" label={dict.specialMove} glyph="⭐" className="bg-tomato text-white" />
          <span className="text-xs font-bold">{dict.specialMove}</span>
        </div>
      </div>
    </div>
  );
}
