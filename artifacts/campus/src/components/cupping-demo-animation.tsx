import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Animation légère « pose de ventouses » pour rassurer le client (pas de vidéo API). */
export function CuppingDemoAnimation({
  points,
  label,
  running,
}: {
  points: string[];
  label: string;
  running: boolean;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!running || points.length === 0) {
      setStep(0);
      return;
    }
    setStep(0);
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % (points.length + 1));
    }, 900);
    return () => window.clearInterval(id);
  }, [running, points]);

  const visible = running ? Math.min(step, points.length) : points.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-secondary/50 to-white p-4">
      <p className="text-xs font-semibold text-primary">Démo visuelle — pose des ventouses</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
      <div className="relative mx-auto mt-4 h-56 w-40">
        {/* Silhouette dos simplifiée */}
        <svg viewBox="0 0 120 200" className="h-full w-full">
          <ellipse cx="60" cy="22" rx="16" ry="18" fill="#e8b4a0" />
          <rect x="52" y="38" width="16" height="14" rx="4" fill="#e8b4a0" />
          <path d="M30 55 C45 48 75 48 90 55 L95 120 C80 130 40 130 25 120 Z" fill="#c45c4a" />
          <path d="M35 118 C50 112 70 112 85 118 L90 155 C75 165 45 165 30 155 Z" fill="#b4533e" />
          <path d="M40 152 L48 198 L58 198 L62 155 Z" fill="#e8b4a0" />
          <path d="M80 152 L72 198 L62 198 L58 155 Z" fill="#e8b4a0" />
          {points.slice(0, 6).map((_, i) => {
            const positions = [
              { cx: 60, cy: 70 },
              { cx: 48, cy: 85 },
              { cx: 72, cy: 85 },
              { cx: 60, cy: 100 },
              { cx: 45, cy: 110 },
              { cx: 75, cy: 110 },
            ];
            const p = positions[i]!;
            const on = i < visible;
            return (
              <g key={i} className={cn(on ? "opacity-100" : "opacity-0")} style={{ transition: "opacity .4s" }}>
                <circle cx={p.cx} cy={p.cy} r="9" fill="rgba(14,116,144,0.25)" stroke="#0e7490" strokeWidth="2" />
                <circle cx={p.cx} cy={p.cy} r="4" fill="#0e7490" />
                <text x={p.cx} y={p.cy + 3} textAnchor="middle" fontSize="7" fill="white" fontWeight="700">
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <ul className="mt-2 space-y-1">
        {points.map((pt, i) => (
          <li
            key={pt}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition",
              i < visible ? "bg-primary/10 font-semibold text-primary" : "text-slate-400",
            )}
          >
            <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] text-white">{i + 1}</span>
            {pt}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        {running ? "Animation en cours — expliquez la pose au client" : "Relancez la démo pour montrer la pose"}
      </p>
    </div>
  );
}
