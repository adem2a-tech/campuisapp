import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Country = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
  /** Local mobile prefixes without country code (FR 06/07…) */
  localStarts?: string[];
};

const COUNTRIES: Country[] = [
  { iso: "FR", name: "France", dial: "33", flag: "🇫🇷", localStarts: ["06", "07", "01", "02", "03", "04", "05", "09"] },
  { iso: "BE", name: "Belgique", dial: "32", flag: "🇧🇪" },
  { iso: "CH", name: "Suisse", dial: "41", flag: "🇨🇭" },
  { iso: "LU", name: "Luxembourg", dial: "352", flag: "🇱🇺" },
  { iso: "MC", name: "Monaco", dial: "377", flag: "🇲🇨" },
  { iso: "MA", name: "Maroc", dial: "212", flag: "🇲🇦" },
  { iso: "DZ", name: "Algérie", dial: "213", flag: "🇩🇿" },
  { iso: "TN", name: "Tunisie", dial: "216", flag: "🇹🇳" },
  { iso: "CA", name: "Canada", dial: "1", flag: "🇨🇦" },
  { iso: "US", name: "États-Unis", dial: "1", flag: "🇺🇸" },
  { iso: "GB", name: "Royaume-Uni", dial: "44", flag: "🇬🇧" },
  { iso: "DE", name: "Allemagne", dial: "49", flag: "🇩🇪" },
  { iso: "ES", name: "Espagne", dial: "34", flag: "🇪🇸" },
  { iso: "IT", name: "Italie", dial: "39", flag: "🇮🇹" },
  { iso: "PT", name: "Portugal", dial: "351", flag: "🇵🇹" },
];

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

export function detectPhoneCountry(raw: string): Country {
  const d = digitsOnly(raw);
  if (!d) return COUNTRIES[0]!;

  // International with leading 00
  const intl = d.startsWith("00") ? d.slice(2) : d.startsWith("011") ? d.slice(3) : d;

  // Explicit + / country codes (longest first)
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  if (raw.trim().startsWith("+") || d.startsWith("00")) {
    for (const c of sorted) {
      if (intl.startsWith(c.dial)) return c;
    }
  }

  // French local
  for (const c of COUNTRIES) {
    if (c.localStarts?.some((p) => d.startsWith(p))) return c;
  }

  for (const c of sorted) {
    if (intl.startsWith(c.dial) && intl.length >= c.dial.length + 6) return c;
  }

  return COUNTRIES[0]!;
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  name?: string;
  required?: boolean;
  "data-testid"?: string;
  id?: string;
};

/** Téléphone avec drapeau du pays détecté (ou choisi). */
export function PhoneField({
  value,
  onChange,
  placeholder = "06 00 00 00 00",
  className,
  inputClassName,
  name,
  required,
  id,
  "data-testid": testId,
}: Props) {
  const detected = useMemo(() => detectPhoneCountry(value), [value]);
  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState<Country | null>(null);
  const country = forced && value.trim() === "" ? forced : forced && digitsOnly(value).startsWith(forced.dial) ? forced : detected;

  return (
    <div className={cn("relative flex h-11 overflow-hidden rounded-xl border border-input bg-white transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex shrink-0 items-center gap-1 border-r border-slate-100 bg-slate-50/80 px-2.5 text-sm hover:bg-slate-100"
        title={`${country.name} (+${country.dial})`}
        data-testid={testId ? `${testId}-flag` : undefined}
        aria-label="Choisir le pays"
      >
        <span className="text-base leading-none" aria-hidden>
          {country.flag}
        </span>
        <span className="font-mono text-[10px] text-slate-500">+{country.dial}</span>
        <ChevronDown size={12} className="text-slate-400" />
      </button>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required={required}
        value={value}
        onChange={(e) => {
          setForced(null);
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className={cn("min-w-0 flex-1 bg-transparent px-3 text-sm outline-none", inputClassName)}
        data-testid={testId}
      />
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-40" aria-label="Fermer" onClick={() => setOpen(false)} />
          <ul className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-56 w-56 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
            {COUNTRIES.map((c) => (
              <li key={`${c.iso}-${c.dial}-${c.name}`}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-sky-50",
                    c.iso === country.iso && c.name === country.name ? "bg-sky-50 font-medium" : "",
                  )}
                  onClick={() => {
                    setForced(c);
                    setOpen(false);
                    if (!value.trim()) onChange(`+${c.dial} `);
                  }}
                >
                  <span>{c.flag}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">+{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
