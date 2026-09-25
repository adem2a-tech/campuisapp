import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Pencil } from "lucide-react";
import {
  HEALTH_CONDITIONS,
  TREATMENT_GOALS,
  emptyIntake,
  intakeCompleteness,
  isIntakeConfirmed,
  loadClientIntake,
  markIntakeConfirmed,
  saveClientIntake,
  type ClientIntake,
} from "@/lib/client-intake";
import { formationPdfHref, getDocumentById } from "@/lib/formation-resources";
import { cn } from "@/lib/utils";

type Props = {
  clientKey: string;
  clientName?: string;
  compact?: boolean;
  hideActions?: boolean;
  /** Une section à la fois (défaut : true). */
  stepped?: boolean;
  onSaved?: () => void;
  /** Après enregistrement : quitte le formulaire et affiche le succès (modifiable ensuite). */
  leaveOnSave?: boolean;
};

const STEPS = [
  { id: "inscription", title: "Inscription", page: "PAGE 3" },
  { id: "anamnese", title: "Anamnèse", page: "PAGE 4" },
  { id: "medicaments", title: "Médicaments & allergies", page: "PAGE 5" },
  { id: "lifestyle", title: "Mode de vie", page: "PAGE 6" },
  { id: "objectifs", title: "Objectifs aujourd’hui", page: "PAGE 7" },
] as const;

export function ClientIntakeForm({
  clientKey,
  clientName,
  compact,
  hideActions,
  stepped = true,
  onSaved,
  leaveOnSave = true,
}: Props) {
  const [intake, setIntake] = useState<ClientIntake>(() => loadClientIntake(clientKey));
  const [saved, setSaved] = useState("");
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(() => !isIntakeConfirmed(clientKey));
  const evalDoc = getDocumentById("evaluation-professionnelle");
  const guideDoc = getDocumentById("guide-points");

  useEffect(() => {
    const loaded = loadClientIntake(clientKey);
    setIntake(loaded);
    setStep(0);
    setSaved("");
    setEditing(!isIntakeConfirmed(clientKey));
  }, [clientKey]);

  function patch<K extends keyof ClientIntake>(key: K, value: ClientIntake[K]) {
    setIntake((prev) => {
      const next = { ...prev, [key]: value };
      saveClientIntake({ ...next, clientKey });
      return next;
    });
  }

  function toggleList(key: "conditions" | "goals", value: string) {
    setIntake((prev) => {
      const list = prev[key];
      let nextList = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
      if (key === "conditions" && value === "Aucune des réponses précédentes") {
        nextList = nextList.includes(value) ? [value] : nextList.filter((x) => x !== value);
      } else if (key === "conditions") {
        nextList = nextList.filter((x) => x !== "Aucune des réponses précédentes");
      }
      const next = { ...prev, [key]: nextList };
      saveClientIntake({ ...next, clientKey });
      return next;
    });
  }

  function handleSave() {
    saveClientIntake({ ...intake, clientKey });
    markIntakeConfirmed(clientKey);
    setSaved("Suivi enregistré avec succès");
    onSaved?.();
    if (leaveOnSave) {
      setEditing(false);
      setStep(0);
    } else {
      window.setTimeout(() => setSaved(""), 2500);
    }
  }

  const pct = intakeCompleteness(intake);
  const last = step >= STEPS.length - 1;

  if (leaveOnSave && !editing) {
    return (
      <div
        className={cn("surface overflow-hidden rounded-2xl", compact && "p-0")}
        data-testid="client-intake-saved"
      >
        <div className="border-b border-border/70 bg-[#132338] px-5 py-4 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/70">Fiche de suivi</p>
          <p className="mt-1 text-sm font-semibold">{clientName || "Client"}</p>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Check size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Suivi bien enregistré</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600">
                Les informations sont sauvegardées. Vous pouvez les modifier à tout moment, puis réenregistrer.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            <p>
              Complétion : <strong className="text-slate-900">{pct}%</strong>
            </p>
            {intake.goals.length > 0 ? (
              <p className="mt-1">Objectifs : {intake.goals.slice(0, 3).join(" · ")}{intake.goals.length > 3 ? "…" : ""}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setSaved("");
            }}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-primary/40 hover:bg-sky-50"
            data-testid="button-edit-client-intake"
          >
            <Pencil size={15} /> Modifier le suivi
          </button>
        </div>
      </div>
    );
  }

  const sectionInscription = (
    <section className="rounded-2xl border border-[#c9a227]/40 bg-[#fffdf8] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#8a6b12]">1 · Inscription (PAGE 3)</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <FrenchBirthDate
          value={intake.birthDate}
          onChange={(iso) => {
            patch("birthDate", iso);
            if (iso) {
              const age = ageFromIso(iso);
              if (age != null) patch("age", String(age));
            }
          }}
        />
        <Field label="Âge">
          <input value={intake.age} onChange={(e) => patch("age", e.target.value)} className={inputCls} placeholder="ex. 42" inputMode="numeric" />
        </Field>
        <div className="sm:col-span-2">
          <ChoicePills
            label="Genre"
            value={intake.gender}
            onChange={(v) => patch("gender", v)}
            options={["Femelle", "Mâle", "Non-binaire"]}
          />
        </div>
        <Field label="Profession">
          <input value={intake.profession} onChange={(e) => patch("profession", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Adresse">
          <input value={intake.address} onChange={(e) => patch("address", e.target.value)} className={inputCls} />
        </Field>
        <CityField value={intake.city} onChange={(v) => patch("city", v)} />
        <Field label="Contact d’urgence">
          <input value={intake.emergencyContact} onChange={(e) => patch("emergencyContact", e.target.value)} className={inputCls} placeholder="Nom du contact" />
        </Field>
        <Field label="Numéro de téléphone">
          <input
            value={intake.emergencyPhone}
            onChange={(e) => patch("emergencyPhone", e.target.value)}
            className={inputCls}
            placeholder="06 …"
            inputMode="tel"
            data-testid="input-intake-emergency-phone"
          />
        </Field>
        <Field label="Référé par">
          <input value={intake.referredBy} onChange={(e) => patch("referredBy", e.target.value)} className={inputCls} />
        </Field>
      </div>
    </section>
  );

  const sectionAnamnese = (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">2 · Anamnèse médicale (PAGE 4)</p>
      <p className="mt-1 text-xs text-slate-500">Conditions actuelles — touchez pour sélectionner.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {HEALTH_CONDITIONS.map((c) => (
          <ToggleChip key={c} label={c} active={intake.conditions.includes(c)} onClick={() => toggleList("conditions", c)} />
        ))}
      </div>
      <Field label="Notes complémentaires">
        <textarea value={intake.healthNotes} onChange={(e) => patch("healthNotes", e.target.value)} rows={2} className={cn(inputCls, "mt-1")} />
      </Field>
    </section>
  );

  const sectionMedicaments = (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">3 · Médicaments & allergies (PAGE 5)</p>
      <div className="mt-3 grid gap-3">
        <Field label="Médicaments actuels (nom, dosage, fréquence)">
          <textarea value={intake.medications} onChange={(e) => patch("medications", e.target.value)} rows={2} className={inputCls} placeholder="ex. Anticoagulant — 1 cp / jour" />
        </Field>
        <Field label="Allergies connues">
          <textarea value={intake.allergies} onChange={(e) => patch("allergies", e.target.value)} rows={2} className={inputCls} placeholder="Médicaments, cosmétiques, huiles…" />
        </Field>
        <Field label="Restrictions médicales">
          <textarea value={intake.medicalRestrictions} onChange={(e) => patch("medicalRestrictions", e.target.value)} rows={2} className={inputCls} />
        </Field>
      </div>
    </section>
  );

  const sectionLifestyle = (
    <section className="rounded-2xl border border-[#c9a227]/35 bg-[#fffdf8] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#8a6b12]">4 · Mode de vie (PAGE 6)</p>
      <div className="mt-3 space-y-4">
        <ChoicePills label="Hydratation" value={intake.hydration} onChange={(v) => patch("hydration", v)} options={["Faible (<1L)", "Modéré (1–1,5L)", "Bon (1,5–2L)", "Excellent (>2L)"]} />
        <ChoicePills label="Activité physique" value={intake.activity} onChange={(v) => patch("activity", v)} options={["Sédentaire", "Légère (1–2 j/sem)", "Modérée (3 j/sem)", "Actif (4–5 j/sem)", "Athlète"]} />
        <ChoicePills label="Qualité du sommeil" value={intake.sleepQuality} onChange={(v) => patch("sleepQuality", v)} options={["Faible (<5h)", "Moyenne (5–6h)", "Bonne (7–8h)", "Excellente (>8h)"]} />
        <Field label="Heures de sommeil / nuit">
          <input value={intake.sleepHours} onChange={(e) => patch("sleepHours", e.target.value)} className={inputCls} placeholder="ex. 6h30" />
        </Field>
        <ChoicePills label="Niveau de stress" value={intake.stressLevel} onChange={(v) => patch("stressLevel", v)} options={["Faible", "Modéré", "Élevé", "Très élevé / Chronique"]} />
        <ChoicePills label="Nutrition" value={intake.nutrition} onChange={(v) => patch("nutrition", v)} options={["Équilibrée", "Végétarien / végan", "Restrictif", "Sans restriction", "Suivi nutritionniste"]} />
      </div>
      <Field label="Autres habitudes (tabac, alcool, caféine, écrans…)">
        <textarea value={intake.otherHabits} onChange={(e) => patch("otherHabits", e.target.value)} rows={2} className={cn(inputCls, "mt-2")} />
      </Field>
      <Field label="Observations mode de vie">
        <textarea value={intake.lifestyleNotes} onChange={(e) => patch("lifestyleNotes", e.target.value)} rows={2} className={cn(inputCls, "mt-2")} />
      </Field>
    </section>
  );

  const sectionObjectifs = (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">5 · Objectifs aujourd’hui</p>
      <p className="mt-1 text-sm text-slate-600">Quels sont les objectifs aujourd’hui pour ce client ?</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {TREATMENT_GOALS.map((g) => (
          <ToggleChip key={g} label={g} active={intake.goals.includes(g)} onClick={() => toggleList("goals", g)} />
        ))}
      </div>
      <Field label="Précisions">
        <textarea value={intake.goalsNotes} onChange={(e) => patch("goalsNotes", e.target.value)} rows={2} className={cn(inputCls, "mt-2")} />
      </Field>
    </section>
  );

  const sections = [sectionInscription, sectionAnamnese, sectionMedicaments, sectionLifestyle, sectionObjectifs];

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#8a6b12]">
            Suivi d’entretien · Évaluation professionnelle
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {clientName ? `En face de ${clientName} — ` : ""}
            une étape à la fois.
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[11px] text-slate-500">Complété {pct}%</p>
          <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-[#c9a227]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[12px]">
        {evalDoc && (
          <a href={formationPdfHref(evalDoc, 3)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#8a6b12] hover:underline">
            PDF Évaluation <ExternalLink size={12} />
          </a>
        )}
        {guideDoc && (
          <a href={formationPdfHref(guideDoc)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#8a6b12] hover:underline">
            Guide des points <ExternalLink size={12} />
          </a>
        )}
      </div>

      {stepped ? (
        <>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Étapes du suivi">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === step}
                onClick={() => setStep(i)}
                title={`${s.title} (${s.page})`}
                className={cn(
                  "h-2 flex-1 rounded-full transition",
                  i < step ? "bg-sky-500" : i === step ? "bg-sky-600" : "bg-slate-200",
                )}
              />
            ))}
          </div>
          <p className="text-center text-xs font-medium text-slate-600">
            Étape {step + 1}/{STEPS.length} · {STEPS[step].title}
            <span className="ml-1 text-slate-400">({STEPS[step].page})</span>
          </p>

          <div className="min-h-[220px]">{sections[step]}</div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 disabled:opacity-40"
              data-testid="button-intake-prev"
            >
              <ArrowLeft size={16} /> Précédent
            </button>
            {!last ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm"
                data-testid="button-intake-next"
              >
                Suivant <ArrowRight size={16} />
              </button>
            ) : !hideActions ? (
              <button type="button" onClick={handleSave} className="btn-primary inline-flex min-h-11 items-center gap-1.5" data-testid="button-save-client-intake">
                <Check size={16} /> Enregistrer le suivi
              </button>
            ) : (
              <span className="text-xs font-medium text-emerald-700">Dernière étape — validez en bas</span>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-5">
          {sections}
        </div>
      )}

      {!hideActions && !stepped && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleSave} className="btn-primary" data-testid="button-save-client-intake">
            Enregistrer le suivi
          </button>
          <button type="button" className="btn-ghost" onClick={() => setIntake(emptyIntake(clientKey))}>
            Réinitialiser
          </button>
          {saved ? <span className="text-sm font-medium text-emerald-700">{saved}</span> : null}
        </div>
      )}

      {!hideActions && stepped && saved ? (
        <span className="text-sm font-medium text-emerald-700">{saved}</span>
      ) : null}
    </div>
  );
}

const inputCls =
  "mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20";

function ageFromIso(iso: string): number | null {
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

const CITIES_CORSE = [
  "Ajaccio", "Bastia", "Porto-Vecchio", "Calvi", "Corte", "Bonifacio",
  "Propriano", "Sartène", "L'Île-Rousse", "Ghisonaccia", "Autre…",
];

/** Date FR : JJ / MM / AAAA — saisie libre des chiffres. */
function FrenchBirthDate({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const parts = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split("-") : ["", "", ""];
  const [y, setY] = useState(parts[0] || "");
  const [m, setM] = useState(parts[1] || "");
  const [d, setD] = useState(parts[2] || "");

  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [yy, mm, dd] = value.split("-");
      setY(yy || "");
      setM(mm || "");
      setD(dd || "");
    }
  }, [value]);

  function emit(ny: string, nm: string, nd: string) {
    setY(ny);
    setM(nm);
    setD(nd);
    const yy = ny.replace(/\D/g, "").slice(0, 4);
    const mm = nm.replace(/\D/g, "").slice(0, 2);
    const dd = nd.replace(/\D/g, "").slice(0, 2);
    if (yy.length === 4 && mm.length === 2 && dd.length === 2) {
      const mi = Number(mm);
      const di = Number(dd);
      if (mi >= 1 && mi <= 12 && di >= 1 && di <= 31) onChange(`${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`);
      else onChange("");
    } else {
      onChange("");
    }
  }

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-500">Date de naissance</p>
      <div className="mt-1 grid grid-cols-3 gap-2">
        <input
          value={d}
          onChange={(e) => emit(y, m, e.target.value)}
          className={inputCls}
          placeholder="JJ"
          inputMode="numeric"
          maxLength={2}
          aria-label="Jour"
        />
        <input
          value={m}
          onChange={(e) => emit(y, e.target.value, d)}
          className={inputCls}
          placeholder="MM"
          inputMode="numeric"
          maxLength={2}
          aria-label="Mois"
        />
        <input
          value={y}
          onChange={(e) => emit(e.target.value, m, d)}
          className={inputCls}
          placeholder="AAAA"
          inputMode="numeric"
          maxLength={4}
          aria-label="Année"
        />
      </div>
      <p className="mt-1 text-[10px] text-slate-400">Tapez les chiffres : jour · mois · année</p>
    </div>
  );
}

function CityField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const known = CITIES_CORSE.filter((c) => c !== "Autre…");
  const effective = value || "Ajaccio";
  const isOther = value !== "" && !known.includes(value);
  const selectValue = isOther ? "Autre…" : effective;

  return (
    <div className="space-y-2">
      <Field label="Ville">
        <select
          value={selectValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "Autre…") onChange(isOther ? value : "");
            else onChange(v);
          }}
          className={inputCls}
        >
          {CITIES_CORSE.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      {(selectValue === "Autre…" || isOther) && (
        <input
          value={isOther ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
          placeholder="Nom de la ville"
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-500">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ChoicePills({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-500">{label}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(active ? "" : o)}
              className={cn(
                "min-h-11 rounded-xl border px-2.5 py-2.5 text-left text-[12px] font-medium leading-snug transition active:scale-[0.98]",
                active
                  ? "border-sky-500 bg-sky-600 text-white shadow-sm shadow-sky-500/25"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300 hover:bg-sky-50",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] font-medium transition active:scale-[0.98]",
        active
          ? "border-sky-500 bg-sky-600 text-white shadow-sm shadow-sky-500/20"
          : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50",
      )}
    >
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-md border text-[11px] font-bold",
          active ? "border-white/40 bg-white/20 text-white" : "border-slate-300 bg-slate-100 text-transparent",
        )}
        aria-hidden
      >
        ✓
      </span>
      {label}
    </button>
  );
}
