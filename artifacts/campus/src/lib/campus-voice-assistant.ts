import { answerCampusChat, type AnswerOpts, type CampusChatAction } from "@/lib/campus-knowledge";

export type CampusVoiceAction = CampusChatAction;

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/** Assistant local — réponses préenregistrées + saluts, 0 token. */
export function parseCampusVoiceCommand(raw: string, opts: AnswerOpts = {}): CampusVoiceAction {
  const t = normalize(raw);
  const action = answerCampusChat(raw, opts);

  if (action.type === "speak") {
    const forced = answerCampusChat(`ouvre ${raw}`, opts);
    if (/(ouvre|aller|va |montre|affiche)/.test(t) && forced.type === "navigate") {
      return forced;
    }
  }

  return action;
}

let voicesReady = false;

function loadFrenchVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.startsWith("fr") && /google|thomas|amélie|hortense|denise/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("fr"))
  );
}

export function speakFrench(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "fr-FR";
    utter.rate = 1.02;
    const voice = loadFrenchVoice();
    if (voice) utter.voice = voice;
    if (!voicesReady) {
      window.speechSynthesis.onvoiceschanged = () => {
        voicesReady = true;
        const v = loadFrenchVoice();
        if (v) utter.voice = v;
      };
    }
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });
}

export async function ensureMicrophoneAccess(): Promise<"granted" | "denied" | "unsupported"> {
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return "granted";
  } catch {
    return "denied";
  }
}
