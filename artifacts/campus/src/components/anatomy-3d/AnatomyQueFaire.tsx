import { Link } from "wouter";
import { getAnatomyZone, resolveZoneProtocol } from "@/lib/anatomy-zones";
import { formationPdfHref, getDocumentById } from "@/lib/formation-resources";
import { ProtocolQueFaire } from "@/components/protocol-que-faire";

export function AnatomyQueFaire({ zoneId }: { zoneId: string }) {
  const zone = getAnatomyZone(zoneId);
  const protocol = zone ? resolveZoneProtocol(zone) : null;
  const pdfDoc = getDocumentById("protocoles-ventouses");
  const pdfHref = pdfDoc ? formationPdfHref(pdfDoc) : undefined;

  if (!zone) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-lg font-semibold">Zone introuvable</p>
        <Link href="/anatomie" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">
          ← Retour à l&apos;anatomie
        </Link>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link
          href="/anatomie"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Anatomie 3D
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Que faire</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{zone.painQuestion}</h2>
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          Aucun protocole ventouses trouvé pour cette zone. Consultez le PDF des 150 protocoles.
          {pdfHref && (
            <a href={pdfHref} target="_blank" rel="noreferrer" className="mt-3 block font-semibold underline">
              Ouvrir le PDF
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <ProtocolQueFaire
      protocol={protocol}
      backHref="/anatomie"
      backLabel="Anatomie 3D"
      eyebrow="Que faire"
      titleOverride={zone.painQuestion}
    />
  );
}
