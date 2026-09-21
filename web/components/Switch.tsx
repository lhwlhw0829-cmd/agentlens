"use client";

import { motion } from "framer-motion";

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-7 w-[52px] shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
        checked
          ? "border-accent/40 bg-gradient-to-r from-accent to-accent2 shadow-glow"
          : "border-border bg-white/[0.06]"
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
        style={{ marginLeft: checked ? "calc(100% - 22px)" : "3px" }}
      />
    </button>
  );
}
