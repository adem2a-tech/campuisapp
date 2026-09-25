import { useMemo, useState } from "react";
import { BodyMap } from "@/components/body-map";
import { BODY_ZONE_PROTOCOLS, getProtocolBySlug, type ZoneProtocol } from "@/lib/campus-protocols";
import { cotationForZone, indicationOptions } from "@/lib/ventouse-cotation";
import { cn } from "@/lib/utils";
import { Check, Search } from "lucide-react";

export type BodymapInvoiceDraft = {
  zoneSlug: string;
  zoneLabel: string;
  code: string;
  description: string;
  unitPriceHt: number;
  customLabel: string;
  indication: string;
  chronic: boolean;
  operated: boolean;
  clientId?: number;
  clientName: string;
};

type ClientOpt = { id: number; firstName: string; lastName: string; email?: string; phone?: string };

type Props = {
  clients: ClientOpt[];
  defaultPrice?: number;
  onValidate: (draft: BodymapInvoiceDraft) => void;
  className?: string;
};

/**
 * Bodymap facturation style Milo :
 * clic zone → options → cotation auto → Valider.
 */
export function BillingBodymap({ clients, defaultPrice = 65, onValidate, className }: Props) {
  const [zone, setZone] = useState<ZoneProtocol | null>(() => getProtocolBySlug("chest") ?? null);
  const [query, setQuery] = useState("");
  const [operated, setOperated] = useState(false);
  const [chronic, setChronic] = useState(true);
  const [indication, setIndication] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [clientId, setClientId] = useState("");

  const cotation = useMemo(
    () => (zone ? cotationForZone(zone, { chronic, operated, defaultPrice }) : null),
    [zone, chronic, operated, defaultPrice],
  );

  const inds = zone ? indicationOptions(zone) : [];
  const activeIndication = indication || inds[0] || "";

  function selectZone(z: ZoneProtocol) {
    setZone(z);
    setQuery(z.label);
    setIndication(z.indications[0] || "");
    setCustomLabel("");
  }

  function handleValidate() {
    if (!zone || !cotation) return;
    const client = clients.find((c) => String(c.id) === clientId);
    const name = client ? `${client.firstName} ${client.lastName}` : customLabel.trim() || "Client";
    if (!client && !customLabel.trim() && !clientId) {
      // allow with generic name — parent may toast if needed
    }
    onValidate({
      zoneSlug: zone.slug,
      zoneLabel: zone.label,
      code: cotation.code,
      description: customLabel.trim()
        ? `${cotation.code} — ${customLabel.trim()}`
        : `${cotation.code} — ${zone.label}${activeIndication ? ` · ${activeIndication}` : ""}`,
      unitPriceHt: cotation.unitPriceHt,
      customLabel: customLabel.trim() || zone.label,
      indication: activeIndication,
      chronic,
      operated,
      clientId: client?.id,
      clientName: name,
    });
    if (favorite) {
      try {
        const raw = localStorage.getItem("campus-bodymap-favorites-v1");
        const list = raw ? JSON.parse(raw) : [];
        const next = Array.isArray(list) ? list : [];
        next.unshift({
          zoneSlug: zone.slug,
          label: customLabel.trim() || zone.label,
          code: cotation.code,
          price: cotation.unitPriceHt,
          at: new Date().toISOString(),
        });
        localStorage.setItem("campus-bodymap-favorites-v1", JSON.stringify(next.slice(0, 30)));
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div
      className={cn("grid overflow-hidden rounded-2xl border border-slate-200 bg-[#0f1419] lg:grid-cols-[1.05fr_1fr]", className)}
      data-testid="billing-bodymap"
    >
      <div className="relative border-b border-white/10 bg-[#121820] p-4 lg:border-b-0 lg:border-r">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[.16em] text-emerald-400">Partie du corps</p>
        <BodyMap
          variant="full"
          activeTone="green"
          highlightSlug={zone?.slug}
          selectedSlugs={zone ? [zone.slug] : []}
          onSelectZone={selectZone}
          className="[&_img]:opacity-95"
        />
        <p className="mt-3 text-center text-[11px] text-slate-400">
          Cliquez une zone · Face / Dos / Profil
        </p>
      </div>

      <div className="flex flex-col bg-[#1a222c] p-4 text-slate-100 md:p-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une zone…"
            className="h-10 w-full rounded-lg border border-white/15 bg-[#0f1419] pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
            data-testid="input-bodymap-search"
          />
        </div>
        {query.trim().length >= 2 ? <ZoneSearchResults query={query} onPick={selectZone} /> : null}

        {zone ? (
          <>
            <p className="mt-4 text-lg font-semibold text-white">{zone.label}</p>

            <div className="mt-4 space-y-3">
              <ToggleRow label="Est-il opéré ?" checked={operated} onChange={setOperated} />
              <ToggleRow label="Pathologie chronique" checked={chronic} onChange={setChronic} />
            </div>

            <div className="mt-4 space-y-2">
              {inds.map((ind) => (
                <label
                  key={ind}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                    activeIndication === ind
                      ? "border-emerald-500/60 bg-emerald-500/10 text-white"
                      : "border-white/10 text-slate-300 hover:border-white/25",
                  )}
                >
                  <input
                    type="radio"
                    name="indication"
                    className="accent-emerald-500"
                    checked={activeIndication === ind}
                    onChange={() => setIndication(ind)}
                  />
                  {ind}
                </label>
              ))}
            </div>

            {cotation ? (
              <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-3">
                <p className="text-sm font-semibold text-emerald-300">
                  Cotation trouvée : {cotation.code}{" "}
                  <span className="text-white">{cotation.unitPriceHt.toFixed(2).replace(".", ",")} €</span>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">{cotation.description}</p>
              </div>
            ) : null}

            <label className="mt-4 block text-xs font-medium text-slate-400">
              Libellé (obligatoire)
              <input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder={`ex. ${zone.label} — ${activeIndication || "séance"}`}
                className="mt-1.5 h-10 w-full rounded-lg border border-white/15 bg-[#0f1419] px-3 text-sm text-white outline-none focus:border-emerald-500"
                data-testid="input-bodymap-label"
              />
            </label>

            <label className="mt-3 block text-xs font-medium text-slate-400">
              Client
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-white/15 bg-[#0f1419] px-3 text-sm text-white outline-none focus:border-emerald-500"
                data-testid="select-bodymap-client"
              >
                <option value="">— Saisie libre (libellé) —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </label>

            <ToggleRow label="Ajouter aux favoris" checked={favorite} onChange={setFavorite} className="mt-3" />

            <button
              type="button"
              onClick={handleValidate}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e11d48] text-sm font-bold text-white shadow-lg transition hover:bg-[#be123c]"
              data-testid="button-bodymap-validate"
            >
              <Check size={18} /> Valider & facturer
            </button>
          </>
        ) : (
          <p className="mt-8 text-center text-sm text-slate-400">Sélectionnez une partie du corps</p>
        )}
      </div>
    </div>
  );
}

function ZoneSearchResults({ query, onPick }: { query: string; onPick: (z: ZoneProtocol) => void }) {
  const q = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  const hits = BODY_ZONE_PROTOCOLS.filter((z) => {
    const hay = `${z.label} ${z.indications.join(" ")}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    return hay.includes(q);
  }).slice(0, 6);
  if (!hits.length) return null;
  return (
    <ul className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-white/10 bg-[#0f1419]">
      {hits.map((z) => (
        <li key={z.slug}>
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
            onClick={() => onPick(z)}
          >
            {z.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  className,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <span className="text-sm text-slate-200">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-emerald-500" : "bg-slate-600",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}
