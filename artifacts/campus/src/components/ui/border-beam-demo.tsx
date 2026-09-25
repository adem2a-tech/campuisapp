import { BorderBeam } from "@/components/ui/border-beam";

/** Démo BorderBeam (référence visuelle) — non montée dans le routeur. */
export default function BorderBeamDemo() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 600,
        maxWidth: "100%",
        minHeight: 360,
        margin: "0 auto",
        background: "#0d0d0f",
        borderRadius: 24,
      }}
    >
      <BorderBeam size="md" colorVariant="colorful">
        <div
          style={{
            width: 348,
            maxWidth: "100%",
            borderRadius: 20,
            background: "#1d1d1d",
            padding: 16,
            color: "#caccd2",
            fontSize: 13,
          }}
        >
          Champ démo BorderBeam — l’assistant CAMPUS utilise le même effet.
        </div>
      </BorderBeam>
    </div>
  );
}
