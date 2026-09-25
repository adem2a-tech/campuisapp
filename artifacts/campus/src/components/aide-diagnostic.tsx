import { useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { AlertTriangle, Brain, Lightbulb, Search, StickyNote } from "lucide-react";
import { diagnoseFromProtocols } from "@/lib/protocol-diagnostic";
import { cn } from "@/lib/utils";

const SINCE_OPTIONS = [
  "Aujourd’hui / aigu",
  "Quelques jours",
  "1–2 semaines",
  "1 mois ou plus",
  "Chronique (> 3 mois)",
];

type PsychoChoice = "yes" | "no" | "unknown";

/** Aide pratique — orientation vers les protocoles ventouses du catalogue uniquement. */
export function AideDiagnostic() {
  const [age, setAge] = useState("");
  const [where, setWhere] = useState("");
  const [since, setSince] = useState(SINCE_OPTIONS[1]!);
  const [notes, setNotes] = useState("");
  const [psycho, setPsycho] = useState<PsychoChoice>("unknown");
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => {
    if (!submitted) return null;
    const ageNum = age.trim() ? Number(age) : null;
    return diagnoseFromProtocols({
      age: ageNum != null && !Number.isNaN(ageNum) ? ageNum : null,
      where,
      since,
      notes,
      psychological: psycho === "yes" ? true : psycho === "no" ? false : null,
    });
  }, [submitted, age, where, since, notes, psycho]);

  function run(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="page-stack space-y-5" data-testid="aide-diagnostic">
      <div className="surface overflow-hidden rounded-2xl transition-shadow duration-300 hover:shadow-lg">
        <div className="flex items-start gap-3 bg-[#132338] px-5 py-4 text-white">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/90 shadow-lg shadow-primary/25">
            <Lightbulb size={18} />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">Aide · Orientation</p>
            <p className="mt-0.5 text-sm font-semibold">Trouver un protocole ventouse</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/70">
              Âge, zone, durée, notes et orientation psycho / physique. La suggestion ne sort{" "}
              <strong className="font-semibold text-sky-200">que</strong> des protocoles ventouses du catalogue CAMPUS.
              Si ce n’est pas dans les fiches, on ne trouve rien.
            </p>
          </div>
        </div>

        <form onSubmit={run} className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-xs font-medium text-muted-foreground">
              Âge du patient
              <input
                value={age}
                onChange={(e) => {
                  setAge(e.target.value.replace(/\D/g, "").slice(0, 3));
                  setSubmitted(false);
                }}
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="ex. 42"
                inputMode="numeric"
                data-testid="input-aide-age"
              />
            </label>
            <label className="block text-xs font-medium text-muted-foreground sm:col-span-2">
              Où a-t-il mal ? (zone ou plainte)
              <input
                value={where}
                onChange={(e) => {
                  setWhere(e.target.value);
                  setSubmitted(false);
                }}
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="ex. lombaires, nuque, migraine…"
                data-testid="input-aide-where"
              />
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Brain size={13} /> Problème plutôt psychologique ?
            </legend>
            <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
              Oui → on priorise les fiches stress / anxiété / sommeil du catalogue. Non → on reste sur les plaintes de zone.
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "yes" as const, label: "Oui — stress, anxiété…" },
                  { id: "no" as const, label: "Non — plutôt physique" },
                  { id: "unknown" as const, label: "Je ne sais pas" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setPsycho(opt.id);
                    setSubmitted(false);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-[12px] font-medium transition duration-200",
                    psycho === opt.id
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-primary/40 hover:bg-white",
                  )}
                  data-testid={`chip-aide-psycho-${opt.id}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-medium text-muted-foreground">Depuis combien de temps ?</legend>
            <div className="flex flex-wrap gap-2">
              {SINCE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setSince(opt);
                    setSubmitted(false);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-[12px] font-medium transition duration-200",
                    since === opt
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-primary/40 hover:bg-white",
                  )}
                  data-testid={`chip-aide-since-${opt.slice(0, 8)}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <StickyNote size={13} /> Notes supplémentaires
            </span>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setSubmitted(false);
              }}
              rows={3}
              className="mt-1.5 w-full resize-y rounded-xl border border-input bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Ex. sommeil agité, tensions épaules permanentes, après un choc émotionnel, ballonnements le soir…"
              data-testid="input-aide-notes"
            />
            <span className="mt-1 block text-[11px] font-normal text-slate-500">
              Plus les notes sont précises, mieux on retrouve la fiche catalogue correspondante.
            </span>
          </label>

          <button
            type="submit"
            className="btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition active:scale-[0.98]"
            data-testid="button-aide-search"
          >
            <Search size={16} /> Chercher dans les protocoles
          </button>
        </form>
      </div>

      {result ? (
        <div className="page-enter space-y-3" key={`${where}-${notes}-${psycho}-${result.matches.map((m) => m.protocol.id).join("-")}`}>
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700" />
            <p>
              Ceci n’est <strong>pas un diagnostic médical</strong>. C’est une aide pour retrouver les fiches
              protocoles ventouses déjà présentes dans CAMPUS.
            </p>
          </div>

          {result.emptyReason ? (
            <p className="surface rounded-2xl p-5 text-sm leading-relaxed text-slate-700" data-testid="aide-empty">
              {result.emptyReason}
            </p>
          ) : (
            <ul className="space-y-3">
              {result.matches.map(({ protocol, reasons }, i) => (
                <li
                  key={protocol.id}
                  className="surface match-card rounded-2xl p-4"
                  style={{ animationDelay: `${i * 55}ms` }}
                  data-testid={`aide-match-${protocol.number}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                        {i === 0 ? "Meilleure correspondance" : `Suggestion ${i + 1}`} · Protocole {protocol.number}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">{protocol.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{protocol.objective}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                      {i === 0 ? "Meilleure correspondance" : i === 1 ? "Très proche" : i < 4 ? "Proche" : "Possible"}
                    </span>
                  </div>
                  {reasons.length > 0 ? (
                    <ul className="mt-3 space-y-1">
                      {reasons.map((r) => (
                        <li key={r} className="text-[12px] text-slate-600">
                          — {r}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/formation/protocole/${protocol.number}`}
                      className="inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:brightness-105 active:scale-[0.98]"
                    >
                      Ouvrir Que faire
                    </Link>
                    <Link
                      href="/sessions/new"
                      className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-primary/40 hover:bg-slate-50 active:scale-[0.98]"
                    >
                      Nouvelle session
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
