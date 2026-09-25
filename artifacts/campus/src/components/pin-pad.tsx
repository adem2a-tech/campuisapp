import { useState } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  subtitle?: string;
  error?: string;
  onComplete: (pin: string) => void;
  length?: number;
};

/** Clavier PIN style iPhone (5 chiffres). */
export function PinPad({
  title = "Code d’accès",
  subtitle = "Saisissez votre code à 5 chiffres",
  error,
  onComplete,
  length = 5,
}: Props) {
  const [digits, setDigits] = useState("");

  function push(d: string) {
    if (digits.length >= length) return;
    const next = digits + d;
    setDigits(next);
    if (next.length === length) {
      window.setTimeout(() => {
        onComplete(next);
        setDigits("");
      }, 80);
    }
  }

  function backspace() {
    setDigits((d) => d.slice(0, -1));
  }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div className="mx-auto w-full max-w-xs text-center" data-testid="pin-pad">
      <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-primary">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-6 flex justify-center gap-3">
        {Array.from({ length }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-3.5 rounded-full border-2 transition",
              i < digits.length ? "border-primary bg-primary" : "border-slate-300 bg-transparent",
            )}
          />
        ))}
      </div>
      {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : <div className="mt-3 h-5" />}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {keys.map((k, i) => {
          if (k === "") return <span key={`empty-${i}`} />;
          if (k === "⌫") {
            return (
              <button
                key="back"
                type="button"
                onClick={backspace}
                className="grid h-14 place-items-center rounded-2xl text-slate-600 transition hover:bg-muted"
                aria-label="Effacer"
              >
                <Delete size={20} />
              </button>
            );
          }
          return (
            <button
              key={k}
              type="button"
              onClick={() => push(k)}
              className="h-14 rounded-2xl bg-white text-xl font-semibold text-slate-900 shadow-sm ring-1 ring-border/60 transition hover:bg-secondary active:scale-95"
              data-testid={`pin-key-${k}`}
            >
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
}
