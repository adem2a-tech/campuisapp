/** Modèles de programmes issus des PDF de référence (côté front). */

export const PROGRAM_TEMPLATES = [
  {
    name: "Protocole ventouses — Dos & nuque (4 sem.)",
    durationDays: 28,
    objective: "Réduire douleur cervicale et tension du haut du dos.",
    message: "Programme basé sur le Guide des Points Thérapeutiques — réévaluation à 4 semaines.",
    exerciseNames: ["Ventouses — Dos cervical & nuque", "Auto-évaluation douleur (0–10)"],
  },
  {
    name: "Protocole ventouses — Lombaire (6 sem.)",
    durationDays: 42,
    objective: "Soulager lombalgie et améliorer la mobilité.",
    message: "Fréquence adaptée phase aiguë puis entretien.",
    exerciseNames: ["Ventouses — Lombaire & sciatique", "Auto-évaluation douleur (0–10)"],
  },
  {
    name: "Accompagnement stress & sommeil (3 sem.)",
    durationDays: 21,
    objective: "Réduire stress et favoriser le sommeil.",
    message: "Combinaison ventouses légères et points auriculaires si indiqué.",
    exerciseNames: ["Ventouses — Insomnie & stress", "Ventouses — Anxiété & stress"],
  },
  {
    name: "Suivi professionnel — 8 séances",
    durationDays: 56,
    objective: "Documenter et optimiser le protocole sur 8 séances.",
    message: "Révision clinique aux séances 4 et 8 selon le système d'évaluation professionnelle.",
    exerciseNames: ["Suivi progrès — 8 séances", "Évaluation initiale — Screening", "Auto-évaluation douleur (0–10)"],
  },
] as const;

export const EXERCISE_CATEGORY_LABELS: Record<string, string> = {
  mobility: "Mobilité",
  breathing: "Respiration",
  stretching: "Étirements",
  recovery: "Récupération",
  relaxation: "Relaxation",
};
