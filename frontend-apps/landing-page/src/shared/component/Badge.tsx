import type { ReactNode } from "react";

interface BadgeProps {
  icon: ReactNode;
  label: string;
  variant?: "default" | "highlight";
}

export default function Badge({
  icon,
  label,
  variant = "default",
}: BadgeProps) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition-colors";
  const variants = {
    default: "bg-[#252526] border-[#727273] text-white",
    highlight: "bg-[#ddda2a20] border-[#ddda2a] text-[#ddda2a]",
  };

  return (
    <span className={`${base} ${variants[variant]}`}>
      {icon}
      {label}
    </span>
  );
}
