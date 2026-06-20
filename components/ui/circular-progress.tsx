import * as React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Render the progress arc in a neutral gray (e.g. for stale readings). */
  muted?: boolean;
}

export function CircularProgress({
  value,
  max,
  size = 24,
  strokeWidth = 3,
  className,
  muted = false,
}: CircularProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on utilization
  const getColor = () => {
    if (muted) return "rgb(163, 163, 163)"; // neutral-400 — stale/unreliable
    if (percentage < 40) return "rgb(34, 197, 94)"; // green
    if (percentage < 70) return "rgb(234, 179, 8)"; // yellow
    return "#C8102E"; // Northeastern red
  };

  const color = getColor();

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-200 dark:text-neutral-800"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
    </div>
  );
}
