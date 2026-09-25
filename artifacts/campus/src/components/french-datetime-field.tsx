import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const inputCls =
  "h-11 w-full rounded-xl border border-input bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15";

function splitIso(iso: string) {
  if (!iso) return { date: "", time: "" };
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return { date: "", time: "" };
  const d = String(dt.getDate()).padStart(2, "0");
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const y = String(dt.getFullYear());
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return { date: `${d}/${m}/${y}`, time: `${hh}:${mm}` };
}

function parseFrDate(dateStr: string): { y: number; m: number; d: number } | null {
  const m = dateStr.trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

function parseFrTime(timeStr: string): { h: number; min: number } | null {
  const m = timeStr.trim().match(/^(\d{1,2})\s*[h:]\s*(\d{0,2})$/i);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2] || "0");
  if (h > 23 || min > 59) return null;
  return { h, min };
}

function toIso(dateStr: string, timeStr: string): string {
  const date = parseFrDate(dateStr);
  const time = parseFrTime(timeStr);
  if (!date || !time) return "";
  const dt = new Date(date.y, date.m - 1, date.d, time.h, time.min, 0, 0);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString();
}

/** Formate la saisie date au fur et à mesure (ajoute les /). */
function maskDate(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function maskTime(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

type Props = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  "data-testid"?: string;
  className?: string;
};

/** Date + heure FR : 2 champs lisibles (JJ/MM/AAAA · HH:mm). */
export function FrenchDateTimeField({ label, value, onChange, className, ...rest }: Props) {
  const initial = splitIso(value);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);

  useEffect(() => {
    if (!value) return;
    const next = splitIso(value);
    setDate(next.date);
    setTime(next.time);
  }, [value]);

  function emit(nextDate: string, nextTime: string) {
    setDate(nextDate);
    setTime(nextTime);
    onChange(toIso(nextDate, nextTime));
  }

  return (
    <div className={cn(className)} data-testid={rest["data-testid"]}>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="grid grid-cols-[1.4fr_0.9fr] gap-2">
        <input
          value={date}
          onChange={(e) => emit(maskDate(e.target.value), time)}
          className={inputCls}
          placeholder="JJ/MM/AAAA"
          inputMode="numeric"
          autoComplete="off"
          aria-label={`${label} — date`}
        />
        <input
          value={time}
          onChange={(e) => emit(date, maskTime(e.target.value))}
          className={inputCls}
          placeholder="HH:mm"
          inputMode="numeric"
          autoComplete="off"
          aria-label={`${label} — heure`}
        />
      </div>
      <p className="mt-1 text-[10px] text-slate-400">ex. 25/09/2026 · 14:30</p>
    </div>
  );
}

export function defaultAppointmentRange() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 45 * 60_000);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}
