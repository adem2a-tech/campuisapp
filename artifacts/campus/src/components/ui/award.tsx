import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AwardsComponentProps {
  variant?: "stamp" | "award" | "certificate" | "badge" | "sticker" | "id-card";
  title: string;
  subtitle?: string;
  description?: string;
  date?: string;
  recipient?: string;
  level?: "bronze" | "silver" | "gold" | "platinum";
  className?: string;
  showIcon?: boolean;
  customIcon?: React.ReactNode;
}

function serratedPath() {
  const radius = 96;
  const teeth = 40;
  const innerRadius = radius - 8;
  let path = "";
  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * 2 * Math.PI;
    const r = i % 2 === 0 ? radius : innerRadius;
    const x = Math.cos(angle) * r + radius;
    const y = Math.sin(angle) * r + radius;
    path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return `${path} Z`;
}

function arcPath(r: number) {
  return `M ${96 - r} 96 A ${r} ${r} 0 0 1 ${96 + r} 96`;
}

/** Badge décoratif TOP 1 — variante stamp utilisée dans le header. */
export function Awards({
  variant = "badge",
  title,
  subtitle,
  date,
  recipient,
  className,
  showIcon = true,
}: AwardsComponentProps) {
  if (variant !== "stamp") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold",
          className,
        )}
      >
        <span>{title}</span>
        {subtitle ? <span className="text-muted-foreground">{subtitle}</span> : null}
      </div>
    );
  }

  return (
    <div className={cn("relative mx-auto flex h-48 w-48 items-center justify-center", className)}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 192 192" aria-hidden>
        <defs>
          <path id="award-top-curve" d={arcPath(55)} fill="none" />
          <path id="award-bottom-curve" d={arcPath(60)} fill="none" transform="rotate(180 96 96)" />
        </defs>
        <path d={serratedPath()} strokeWidth="0.2" className="fill-white stroke-black" />
        <circle cx="96" cy="96" r="78" className="fill-white stroke-black" strokeWidth="0.2" />
        <text className="text-xl font-bold">
          <textPath href="#award-top-curve" startOffset="50%" textAnchor="middle" className="fill-black">
            {title}
          </textPath>
        </text>
        <text className="text-[10px] tracking-wider">
          <textPath href="#award-bottom-curve" startOffset="50%" textAnchor="middle" className="fill-black">
            {subtitle}
          </textPath>
        </text>
      </svg>
      <div className="relative z-10 text-center">
        {showIcon ? (
          <div className="mb-1 flex justify-center text-2xl">
            <Star className="fill-primary text-primary" />
          </div>
        ) : null}
        {recipient ? <div className="mt-2 text-[14px] text-primary">{recipient}</div> : null}
        {date ? <div className="text-[10px] italic">{date}</div> : null}
      </div>
    </div>
  );
}
