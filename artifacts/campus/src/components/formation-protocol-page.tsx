import { Link } from "wouter";
import { getVentouseProtocol } from "@/lib/ventouse-protocols";
import { ProtocolQueFaire } from "@/components/protocol-que-faire";

/** Page dédiée « Que faire » — fiable (pas de modal). */
export function FormationProtocolPage({ protocolNumber }: { protocolNumber: number }) {
  const params = new URLSearchParams(window.location.search);
  const clientIdRaw = params.get("clientId");
  const preselectedClientId = clientIdRaw ? Number(clientIdRaw) : undefined;
  const protocol = getVentouseProtocol(protocolNumber);

  if (!protocol) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-lg font-semibold">Protocole introuvable</p>
        <Link href="/formation" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">
          ← Retour Formation
        </Link>
      </div>
    );
  }

  return (
    <ProtocolQueFaire
      protocol={protocol}
      backHref="/formation"
      backLabel="Protocoles"
      eyebrow="Que faire"
      preselectedClientId={Number.isFinite(preselectedClientId) ? preselectedClientId : undefined}
    />
  );
}
