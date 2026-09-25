/**
 * Aide contextuelle = étapes du suivi pas à pas, mappées à l’écran courant.
 * Textes courts, mots simples, thème Formation.
 */

import {
  FORMATION_PARCOURS,
  loadParcoursProgress,
  type ParcoursStep,
} from "@/lib/formation-parcours";

export type AideScreen =
  | "dashboard"
  | "clients"
  | "client-add"
  | "client-detail"
  | "agenda"
  | "session-new"
  | "sessions"
  | "formation"
  | "facturation";

export type AideHint = {
  screen: AideScreen;
  where: string;
  hook: string;
  step: ParcoursStep;
  moduleTitle: string;
};

const FLAT = FORMATION_PARCOURS.flatMap((mod) =>
  mod.steps.map((step) => ({ step, moduleTitle: mod.title })),
);

function stepById(id: string) {
  return FLAT.find((x) => x.step.id === id) ?? FLAT[0]!;
}

const BY_SCREEN: Record<
  AideScreen,
  { where: string; hook: string; stepId: string }
> = {
  dashboard: {
    where: "la vue d’ensemble",
    hook: "Par où commencer aujourd’hui ?",
    stepId: "d1-s1",
  },
  clients: {
    where: "Clients",
    hook: "Besoin d’aide sur un dossier ?",
    stepId: "d1-s2",
  },
  "client-add": {
    where: "Ajouter un client",
    hook: "Vous créez un client — voici l’étape exacte.",
    stepId: "d1-s1",
  },
  "client-detail": {
    where: "le dossier client",
    hook: "Complétez l’anamnèse avant toute séance.",
    stepId: "d1-s2",
  },
  agenda: {
    where: "l’Agenda",
    hook: "Avant le RDV : dossier + consentement.",
    stepId: "d1-s4",
  },
  "session-new": {
    where: "Nouvelle session",
    hook: "Notez la plainte, puis la zone, puis le protocole.",
    stepId: "d2-s1",
  },
  sessions: {
    where: "Toutes les sessions",
    hook: "Comparez les scores pour ajuster.",
    stepId: "a1-s1",
  },
  formation: {
    where: "Formation",
    hook: "Suivez l’étape en cours du parcours.",
    stepId: "d1-s1",
  },
  facturation: {
    where: "Facturation",
    hook: "Documentez la séance avant de facturer.",
    stepId: "d2-s4",
  },
};

export function aideScreenFromPath(path: string): AideScreen | null {
  const [pathname, search = ""] = path.split("?");
  const q = new URLSearchParams(search);
  const adding = q.get("ajouter") === "1" || q.get("add") === "1";

  if (pathname === "/dashboard" || pathname === "/") return "dashboard";
  if (pathname === "/agenda") return "agenda";
  if (pathname === "/clients" && adding) return "client-add";
  if (pathname === "/clients") return "clients";
  if (pathname?.startsWith("/clients/")) return "client-detail";
  if (pathname === "/sessions/new") return "session-new";
  if (pathname === "/sessions" || pathname?.startsWith("/sessions/")) return "sessions";
  if (pathname?.startsWith("/formation")) return "formation";
  if (pathname === "/facturation") return "facturation";
  return null;
}

export function aideHintForPath(path: string): AideHint | null {
  const screen = aideScreenFromPath(path);
  if (!screen) return null;
  const meta = BY_SCREEN[screen];

  if (screen === "formation") {
    const progress = loadParcoursProgress();
    const current = progress?.stepId
      ? stepById(progress.stepId)
      : stepById(meta.stepId);
    return {
      screen,
      where: meta.where,
      hook: meta.hook,
      step: current.step,
      moduleTitle: current.moduleTitle,
    };
  }

  const found = stepById(meta.stepId);
  return {
    screen,
    where: meta.where,
    hook: meta.hook,
    step: found.step,
    moduleTitle: found.moduleTitle,
  };
}
