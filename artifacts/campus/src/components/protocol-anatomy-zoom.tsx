import { useMemo, useState } from "react";
import { Maximize2, ZoomIn } from "lucide-react";
import {
  REGION_ZOOM,
  inferBodyRegion,
  markerLayout,
  type BodyFocusRegion,
} from "@/lib/protocol-body-focus";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  applicationPoints: string[];
  className?: string;
};

/** Position/échelle object-fit pour zoomer sur une zone du corps entier (vue dos). */
const IMAGE_FOCUS: Record<BodyFocusRegion, { pos: string; scale: number }> = {
  tete: { pos: "50% 4%", scale: 2.8 },
  nuque: { pos: "50% 10%", scale: 2.6 },
  trapeze: { pos: "50% 18%", scale: 2.4 },
  epaule: { pos: "72% 18%", scale: 2.5 },
  dorsal: { pos: "50% 28%", scale: 2.3 },
  thorax: { pos: "50% 26%", scale: 2.3 },
  lombaires: { pos: "50% 42%", scale: 2.5 },
  abdomen: { pos: "50% 40%", scale: 2.3 },
  sacrum: { pos: "50% 50%", scale: 2.6 },
  hanche: { pos: "50% 54%", scale: 2.4 },
  bras: { pos: "78% 32%", scale: 2.4 },
  jambe: { pos: "50% 72%", scale: 2.2 },
  genou: { pos: "50% 78%", scale: 2.5 },
  pied: { pos: "50% 94%", scale: 2.6 },
  corps: { pos: "50% 45%", scale: 1 },
};

/** Corps anatomique complet (jambes incluses) + zoom zone + pastilles. */
export function ProtocolAnatomyZoom({ title, applicationPoints, className }: Props) {
  const region = useMemo(
    () => inferBodyRegion(applicationPoints, title),
    [applicationPoints, title],
  );
  const [fullBody, setFullBody] = useState(true);
  const [lightbox, setLightbox] = useState(false);

  const focus: BodyFocusRegion = fullBody ? "corps" : region;
  const zoomMeta = REGION_ZOOM[focus];
  const imgFocus = IMAGE_FOCUS[focus];
  const markers = markerLayout(applicationPoints.length);

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-white", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-primary">2 · Schéma anatomique</p>
          <p className="mt-0.5 text-sm text-slate-600">
            Corps entier (jambes incluses) · {zoomMeta.label}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFullBody((v) => !v)}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition",
            !fullBody ? "bg-primary text-primary-foreground" : "bg-secondary text-primary",
          )}
        >
          {fullBody ? <ZoomIn size={14} /> : <Maximize2 size={14} />}
          {fullBody ? "Zoomer la zone" : "Voir tout le corps"}
        </button>
      </div>

      <button
        type="button"
        className="relative block w-full overflow-hidden bg-gradient-to-b from-white to-slate-100"
        style={{ height: fullBody ? 520 : 420 }}
        onClick={() => setLightbox(true)}
        title="Agrandir"
      >
        <img
          src="/anatomy-back.png"
          alt="Corps anatomique vue postérieure"
          className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-out"
          style={
            fullBody
              ? { objectPosition: "50% 50%", transform: "scale(1)" }
              : {
                  objectPosition: imgFocus.pos,
                  transform: `scale(${imgFocus.scale})`,
                  transformOrigin: imgFocus.pos,
                }
          }
        />

        {!fullBody && (
          <div className="pointer-events-none absolute inset-0">
            {applicationPoints.map((point, i) => {
              const m = markers[i] ?? { x: 0.5, y: 0.5 };
              return (
                <span
                  key={point}
                  className="absolute flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg ring-2 ring-white"
                  style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                >
                  {i + 1}
                </span>
              );
            })}
          </div>
        )}

        {fullBody && (
          <div
            className="pointer-events-none absolute left-1/2 w-[42%] -translate-x-1/2 rounded-2xl border-2 border-primary/50 bg-primary/10"
            style={{
              top: `${Math.max(4, Number(IMAGE_FOCUS[region].pos.split(" ")[1]?.replace("%", "") || 40) - 8)}%`,
              height: "18%",
            }}
          />
        )}
      </button>

      <p className="px-4 py-2 text-center text-xs text-slate-500">
        Corps entier visible · basculez pour zoomer sur la zone de pose
      </p>

      <ol className="grid gap-2 border-t border-border/70 p-4 sm:grid-cols-2">
        {applicationPoints.map((point, idx) => (
          <li
            key={point}
            className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-3 text-sm font-medium text-slate-800"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {idx + 1}
            </span>
            {point}
          </li>
        ))}
      </ol>

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
        >
          <div
            className="relative max-h-[92vh] w-full max-w-md overflow-hidden rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src="/anatomy-back.png"
              alt="Corps anatomique agrandi"
              className="mx-auto max-h-[78vh] w-auto object-contain"
            />
            <p className="mt-2 text-center text-sm text-slate-600">{zoomMeta.label}</p>
            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
              onClick={() => setLightbox(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
