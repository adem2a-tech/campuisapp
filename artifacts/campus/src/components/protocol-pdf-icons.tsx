/** Icônes style PDF protocoles (trait doré / bleu app). */

import type { ReactNode } from "react";

type IconProps = { className?: string; size?: number };

const stroke = "#c9a227";
const strokeDark = "#0b6e99";

function Svg({ size = 22, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconObjectif(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.5" stroke={stroke} strokeWidth="1.4" />
      <circle cx="12" cy="12" r="1.6" fill={stroke} />
    </Svg>
  );
}

export function IconOk(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" stroke="#2d6a59" strokeWidth="1.6" />
      <path d="M7.5 12.2 10.4 15l6.1-6.5" stroke="#2d6a59" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconStop(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" stroke="#a44c3d" strokeWidth="1.6" />
      <path d="M8.2 8.2 15.8 15.8M15.8 8.2 8.2 15.8" stroke="#a44c3d" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IconVentouse(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 10c0-3.2 2.2-5.5 5-5.5s5 2.3 5 5.5v2.2c0 1.4-.6 2.6-1.6 3.4L14 17.5H10l-1.4-1.9C7.6 14.8 7 13.6 7 12.2V10Z" stroke={stroke} strokeWidth="1.5" />
      <path d="M9.5 20h5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IconPompe(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4.5" y="8" width="7" height="10" rx="2" stroke={stroke} strokeWidth="1.5" />
      <path d="M11.5 11h4.2a2 2 0 0 1 2 2v1.5a2 2 0 0 1-2 2H14" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 6.5V8" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5.2" r="1.3" stroke={stroke} strokeWidth="1.3" />
    </Svg>
  );
}

export function IconHuile(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M10 4h4v3.2l1.4 1.6V19a2 2 0 0 1-2 2h-2.8a2 2 0 0 1-2-2v-10L10 7.2V4Z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 13.5c1.4-1.2 2.3-2.4 2.3-3.5 0-1.1-.9-1.7-2.3-1.7S9.7 8.9 9.7 10c0 1.1.9 2.3 2.3 3.5Z" stroke={stroke} strokeWidth="1.3" />
    </Svg>
  );
}

export function IconServiette(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="5" y="7" width="14" height="3.2" rx="1" stroke={stroke} strokeWidth="1.4" />
      <rect x="5.8" y="11" width="12.4" height="3.2" rx="1" stroke={stroke} strokeWidth="1.4" />
      <rect x="6.5" y="15" width="11" height="3.2" rx="1" stroke={stroke} strokeWidth="1.4" />
    </Svg>
  );
}

export function IconFiche(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="6" y="3.5" width="12" height="17" rx="2" stroke={stroke} strokeWidth="1.5" />
      <path d="M9 8.5h6M9 12h6M9 15.5h4" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      <rect x="9" y="2.5" width="6" height="2.2" rx="0.6" stroke={stroke} strokeWidth="1.2" />
    </Svg>
  );
}

export function IconStarPro(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        d="M12 3.5 13.9 9h5.6l-4.5 3.4 1.7 5.5L12 14.8 7.3 17.9l1.7-5.5L4.5 9h5.6L12 3.5Z"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconStepEval(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="5" y="4" width="14" height="16" rx="2" stroke={strokeDark} strokeWidth="1.4" />
      <circle cx="9.2" cy="9" r="1.6" stroke={strokeDark} strokeWidth="1.2" />
      <path d="M12.2 8.2h4.3M12.2 10.2h3.2M8 14h8M8 16.5h5.5" stroke={strokeDark} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

export function IconStepPrep(p: IconProps) {
  return <IconHuile {...p} />;
}

export function IconStepApply(p: IconProps) {
  return <IconVentouse {...p} />;
}

export function IconStepDuree(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="13" r="7" stroke={strokeDark} strokeWidth="1.5" />
      <path d="M12 9.5v4l2.5 1.5" stroke={strokeDark} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 4.5h6" stroke={strokeDark} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IconStepRetrait(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 14c0-2.8 1.8-4.8 4-4.8s4 2 4 4.8" stroke={strokeDark} strokeWidth="1.5" />
      <path d="M9.5 18h5" stroke={strokeDark} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 5v5M9.5 7.2 12 5l2.5 2.2" stroke={strokeDark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconStepSoins(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 19c3.5-3.2 5.5-5.8 5.5-8.2A5.5 5.5 0 0 0 12 5.3 5.5 5.5 0 0 0 6.5 10.8C6.5 13.2 8.5 15.8 12 19Z" stroke={strokeDark} strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  );
}

/** Associe un libellé matériel PDF → icône. */
export function materialIconFor(label: string) {
  const s = label.toLowerCase();
  if (s.includes("ventouse")) return IconVentouse;
  if (s.includes("pompe") || s.includes("aspiration")) return IconPompe;
  if (s.includes("huile")) return IconHuile;
  if (s.includes("serviette")) return IconServiette;
  if (s.includes("fiche") || s.includes("suivi")) return IconFiche;
  return IconFiche;
}

/** Associe un titre d'étape → icône. */
export function stepIconFor(title: string) {
  const s = title.toLowerCase();
  if (s.includes("évalu")) return IconStepEval;
  if (s.includes("prépar")) return IconStepPrep;
  if (s.includes("applic")) return IconStepApply;
  if (s.includes("dur")) return IconStepDuree;
  if (s.includes("retrait")) return IconStepRetrait;
  if (s.includes("soin") || s.includes("après")) return IconStepSoins;
  return IconStepEval;
}
