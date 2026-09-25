/**
 * Réponses préenregistrées CAMPUS — 0 token, hors ligne.
 * Saluts / au revoir personnalisés ; le reste = fiches prédéfinies uniquement.
 */

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

export type ClientBrief = {
  id: number | string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  sessionsCount?: number;
};

type Reply = { keys: string[]; answer: string; path?: string };

/** Questions / sujets autorisés (hors saluts). */
export const CAMPUS_PRESET_QUESTIONS = [
  "Comment ajouter un client ?",
  "Aide sur un client",
  "Ouvre formation",
  "Ouvre clients",
  "Nouvelle session",
  "Comment facturer ?",
  "Code PIN facturation",
  "Protocole lombaire",
  "Contre-indications",
  "Anxiété et stress",
  "Anamnèse client",
] as const;

const REPLIES: Reply[] = [
  {
    keys: ["ajouter un client", "comment ajouter", "nouveau client", "creer un client"],
    answer:
      "Clients → Ajouter. 1) Identité (prénom, nom, e-mail, téléphone). 2) Formulaire d’inscription + anamnèse. 3) Validez. Étape Formation : « Accueillir et ouvrir le dossier ».",
    path: "/clients?ajouter=1",
  },
  {
    keys: ["aide sur un client", "aide client", "dossier client", "info client"],
    answer:
      "Dites le prénom du client (ex. « Adem ») : je vous rappelle le dossier. Sinon : Clients → ouvrez la fiche → anamnèse + séances.",
    path: "/clients",
  },
  {
    keys: ["dashboard", "vue d ensemble", "accueil"],
    answer: "Vue d’ensemble : RDV du jour, clients, sessions. Bouton « Nouvelle session » pour démarrer.",
    path: "/dashboard",
  },
  {
    keys: ["agenda", "rendez vous", "rdv"],
    answer: "Agenda : créez un RDV (client, horaire). Avant la séance : dossier + consentement à jour.",
    path: "/agenda",
  },
  {
    keys: ["clients", "carnet"],
    answer: "Clients : liste, recherche, ajout. Ouvrez une fiche pour anamnèse et coach de séance.",
    path: "/clients",
  },
  {
    keys: ["nouvelle session", "documenter", "session"],
    answer: "Nouvelle session : client → plainte / zone → protocole → ressenti avant/après → enregistrer.",
    path: "/sessions/new",
  },
  {
    keys: ["toutes les sessions", "historique"],
    answer: "Toutes les sessions : historique et évolution (ex. 7/10 +2).",
    path: "/sessions",
  },
  {
    keys: ["anatomie", "corps", "carte douleur"],
    answer: "La carte anatomie a été retirée. Utilisez Formation → Protocoles, ou Nouvelle session pour documenter la zone.",
    path: "/formation",
  },
  {
    keys: ["formation", "suivi pas a pas", "protocole 150", "que faire"],
    answer: "Formation : Suivi pas à pas (étapes), Protocoles (150 fiches), PDF. Suivez l’ordre du parcours.",
    path: "/formation",
  },
  {
    keys: ["facturer", "facture", "facturation"],
    answer: "Facturation (PIN 5 chiffres) : modèles, SIRET/TVA, envoi e-mail / SMS. Documentez la séance avant.",
    path: "/facturation",
  },
  {
    keys: ["pin", "code pin", "mot de passe"],
    answer: "PIN à 5 chiffres : ouvre CAMPUS et protège Facturation. Paramètres pour le changer.",
  },
  {
    keys: ["contre indication", "contre-indication", "grossesse", "anticoagulant", "pacemaker"],
    answer:
      "Absolues = stop (grossesse, cancer actif, TVP, fièvre, plaies, pacemaker appareils). Relatives = adapter (diabète, TA, anticoagulants…). Doute = avis médical.",
  },
  {
    keys: ["lombaire", "sciatique", "bas du dos", "protocole lombaire"],
    answer: "Lombaire / sciatique : BL23, 25, 40 · GV4 · GB30 · ventouses 6–8 cm · 15–20 min. Pas en grossesse sur sacrum/lombaires.",
  },
  {
    keys: ["anxiete", "stress"],
    answer: "Anxiété / stress : trapèze, nuque, interscapulaire. Formation → chercher « anxiété » → Que faire → Ajouter au client.",
  },
  {
    keys: ["anamnese", "formulaire", "inscription", "intake"],
    answer:
      "Anamnèse : identité, santé, médicaments, allergies, sommeil, stress. À remplir à l’ajout client, puis à mettre à jour.",
  },
  {
    keys: ["nuque", "cervical", "cou"],
    answer: "Cervical : BL10–13, GB21, GV14 · 4–6 cm · ~10 min. Éviter succion sur les épineux.",
  },
];

export type CampusChatAction =
  | { type: "navigate"; path: string; message: string }
  | { type: "speak"; message: string };

export type AnswerOpts = {
  userFirstName?: string;
  clients?: ClientBrief[];
};

function firstNameOf(full?: string) {
  const n = (full || "").trim().split(/\s+/)[0];
  return n || "praticien";
}

function matchGreeting(t: string): "hello" | "evening" | "bye" | null {
  if (/^(bonjour|salut|hello|hey|coucou)(\s|$|!|\.)/.test(t) || t === "bonjour" || t === "salut") {
    return "hello";
  }
  if (/^(bonsoir)(\s|$|!|\.)/.test(t) || t === "bonsoir") return "evening";
  if (/^(au revoir|bye|a bientot|bonne soiree|bonne journee)(\s|$|!|\.)/.test(t)) return "bye";
  return null;
}

function findClientMention(t: string, clients: ClientBrief[]): ClientBrief | null {
  for (const c of clients) {
    const fn = normalize(c.firstName);
    const ln = normalize(c.lastName);
    const full = `${fn} ${ln}`;
    if (fn.length >= 2 && (t.includes(fn) || t.includes(full) || (ln.length >= 2 && t.includes(ln)))) {
      return c;
    }
  }
  return null;
}

function clientHelpMessage(c: ClientBrief): string {
  const name = `${c.firstName} ${c.lastName}`.trim();
  const parts = [
    `Dossier ${name}.`,
    c.phone ? `Tél. ${c.phone}.` : null,
    c.email ? `E-mail ${c.email}.` : null,
    typeof c.sessionsCount === "number" ? `${c.sessionsCount} séance(s) enregistrée(s).` : null,
    "Ouvrez la fiche pour anamnèse, coach et historique. Besoin d’aide : Formation → Suivi pas à pas.",
  ].filter(Boolean);
  return parts.join(" ");
}

/** Réponse locale uniquement — saluts + fiches prédéfinies + aide client nommé. */
export function answerCampusChat(raw: string, opts: AnswerOpts = {}): CampusChatAction {
  const t = normalize(raw);
  const you = firstNameOf(opts.userFirstName);

  const greet = matchGreeting(t);
  if (greet === "hello") {
    return { type: "speak", message: `Bonjour ${you} — je suis l’assistant CAMPUS. Choisissez une question ci-dessous, ou dites le prénom d’un client.` };
  }
  if (greet === "evening") {
    return { type: "speak", message: `Bonsoir ${you} — prêt pour la suite ? Une question préenregistrée, ou le prénom d’un client.` };
  }
  if (greet === "bye") {
    return { type: "speak", message: `Au revoir ${you} — bonne pratique.` };
  }

  const clients = opts.clients ?? [];
  const mentioned = findClientMention(t, clients);
  if (mentioned && (/(client|dossier|aide|info|ouvr|fiche|qui|comment)/.test(t) || t.split(/\s+/).length <= 3)) {
    const wantsOpen = /(ouvre|montre|affiche|fiche)/.test(t);
    if (wantsOpen) {
      return {
        type: "navigate",
        path: `/clients/${mentioned.id}`,
        message: `J’ouvre le dossier de ${mentioned.firstName}. ${clientHelpMessage(mentioned)}`,
      };
    }
    return { type: "speak", message: clientHelpMessage(mentioned) };
  }

  for (const item of REPLIES) {
    if (item.keys.some((k) => t.includes(normalize(k)))) {
      const navigate =
        !!item.path &&
        (/(ouvre|aller|va |montre|affiche)/.test(t) || /^(ouvre|va|aller)/.test(t));
      if (navigate && item.path) {
        return { type: "navigate", path: item.path, message: item.answer };
      }
      return { type: "speak", message: item.answer };
    }
  }

  const navOnly: Array<{ re: RegExp; path: string; msg: string }> = [
    { re: /ouvre.*(formation)/, path: "/formation", msg: "J’ouvre Formation." },
    { re: /ouvre.*(client)/, path: "/clients", msg: "J’ouvre Clients." },
    { re: /ouvre.*(factur)/, path: "/facturation", msg: "J’ouvre Facturation." },
    { re: /ouvre.*(agenda|rdv)/, path: "/agenda", msg: "J’ouvre l’Agenda." },
    { re: /ouvre.*(session)/, path: "/sessions/new", msg: "J’ouvre Nouvelle session." },
  ];
  for (const n of navOnly) {
    if (n.re.test(t)) return { type: "navigate", path: n.path, message: n.msg };
  }

  return {
    type: "speak",
    message: `Désolé ${you} — je réponds seulement aux questions proposées, aux saluts (bonjour / bonsoir / au revoir), ou au prénom d’un client. Touchez une pastille ci-dessous.`,
  };
}

/** @deprecated */
export function answerFromKnowledge(text: string): string | null {
  return answerCampusChat(text).message;
}
