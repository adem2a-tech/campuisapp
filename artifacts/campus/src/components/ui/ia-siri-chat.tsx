import { Loader2, Mic, MicOff, Sparkles, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ensureMicrophoneAccess } from "@/lib/campus-voice-assistant";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface VoiceChatProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  onTranscript?: (text: string) => void | Promise<void>;
  onVolumeChange?: (volume: number) => void;
  className?: string;
  demoMode?: boolean;
  compact?: boolean;
  /** État vocal externe (synthèse en cours) */
  externalSpeaking?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  opacity: number;
  velocity: { x: number; y: number };
}

function mapRecognitionError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Micro refusé. Autorisez le micro dans les paramètres du navigateur, puis réessayez.";
    case "no-speech":
      return "Je n'ai rien entendu. Parlez plus fort ou plus près du micro.";
    case "aborted":
      return "Écoute interrompue.";
    case "audio-capture":
      return "Aucun micro détecté. Branchez un micro ou utilisez Chrome.";
    case "network":
      return "Reconnaissance vocale indisponible (connexion requise).";
    default:
      return "Je n'ai pas pu entendre. Réessayez en appuyant sur le micro.";
  }
}

export function VoiceChat({
  onStart,
  onStop,
  onTranscript,
  onVolumeChange,
  className,
  demoMode = false,
  compact = false,
  externalSpeaking = false,
}: VoiceChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [volume, setVolume] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lastTranscript, setLastTranscript] = useState("");
  const [particles, setParticles] = useState<Particle[]>([]);
  const [waveformData, setWaveformData] = useState<number[]>(Array(32).fill(0));
  const [micReady, setMicReady] = useState<boolean | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const animationRef = useRef<number | undefined>(undefined);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);
  const durationRef = useRef(0);
  const finalTranscriptRef = useRef("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  const isSpeaking = externalSpeaking;

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 16; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 320,
        y: Math.random() * 320,
        opacity: Math.random() * 0.3 + 0.1,
        velocity: { x: (Math.random() - 0.5) * 0.4, y: (Math.random() - 0.5) * 0.4 },
      });
    }
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    const animateParticles = () => {
      setParticles((prev) =>
        prev.map((particle) => ({
          ...particle,
          x: (particle.x + particle.velocity.x + 320) % 320,
          y: (particle.y + particle.velocity.y + 320) % 320,
        })),
      );
      animationRef.current = requestAnimationFrame(animateParticles);
    };
    animationRef.current = requestAnimationFrame(animateParticles);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const stopAudioMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    analyserRef.current = null;
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setVolume(0);
    setWaveformData(Array(32).fill(0));
  }, []);

  const startAudioMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const level = Math.min(100, avg * 1.8);
        setVolume(level);
        onVolumeChange?.(level);
        setWaveformData(Array.from(data).map((v) => (v / 255) * 100));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      setMicReady(true);
    } catch {
      setMicReady(false);
    }
  }, [onVolumeChange]);

  useEffect(() => {
    if (isListening) {
      intervalRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
      }, 1000);
      void startAudioMeter();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopAudioMeter();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopAudioMeter();
    };
  }, [isListening, startAudioMeter, stopAudioMeter]);

  useEffect(() => {
    if (!demoMode) return;
    let cancelled = false;
    const demoSequence = async () => {
      if (cancelled) return;
      setIsListening(true);
      onStart?.();
      await new Promise((r) => setTimeout(r, 2500));
      if (cancelled) return;
      setIsListening(false);
      setIsProcessing(true);
      onStop?.(durationRef.current);
      await new Promise((r) => setTimeout(r, 1500));
      if (cancelled) return;
      setIsProcessing(false);
      durationRef.current = 0;
      setDuration(0);
      setTimeout(demoSequence, 1500);
    };
    const timeout = setTimeout(demoSequence, 800);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [demoMode, onStart, onStop]);

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      recognitionRef.current?.abort();
    }
  }, []);

  const processTranscript = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setLastTranscript("Je n'ai rien compris. Réessayez.");
        return;
      }
      setIsProcessing(true);
      onStop?.(durationRef.current);
      try {
        await onTranscript?.(text);
      } finally {
        setIsProcessing(false);
        durationRef.current = 0;
        setDuration(0);
      }
    },
    [onStop, onTranscript],
  );

  const handleToggleListening = useCallback(async () => {
    if (demoMode) return;

    if (isListening) {
      listeningRef.current = false;
      stopRecognition();
      setIsListening(false);
      const text = finalTranscriptRef.current.trim();
      if (text) await processTranscript(text);
      else {
        onStop?.(durationRef.current);
        durationRef.current = 0;
        setDuration(0);
      }
      return;
    }

    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setLastTranscript("Reconnaissance vocale non supportée. Utilisez Chrome ou Edge.");
      return;
    }

    const mic = await ensureMicrophoneAccess();
    if (mic === "denied") {
      setMicReady(false);
      setLastTranscript("Autorisez le micro dans votre navigateur, puis réessayez.");
      return;
    }
    if (mic === "unsupported") {
      setLastTranscript("Micro non disponible sur cet appareil.");
      return;
    }
    setMicReady(true);

    const recognition = new Ctor();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    finalTranscriptRef.current = "";
    durationRef.current = 0;
    setDuration(0);
    setLastTranscript("");
    setIsListening(true);
    listeningRef.current = true;
    onStart?.();

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const chunk = result[0].transcript.trim();
        if (result.isFinal) finalText += `${chunk} `;
        else interim = chunk;
      }
      const display = (finalText || interim).trim();
      if (display) {
        setLastTranscript(display);
        if (finalText) finalTranscriptRef.current = finalText.trim();
        else if (interim) finalTranscriptRef.current = interim;
      }
    };

    recognition.onerror = (event) => {
      listeningRef.current = false;
      setIsListening(false);
      setIsProcessing(false);
      if (event.error !== "aborted" && event.error !== "no-speech") {
        setLastTranscript(mapRecognitionError(event.error));
      } else if (event.error === "no-speech" && !finalTranscriptRef.current) {
        setLastTranscript(mapRecognitionError("no-speech"));
      }
      recognitionRef.current = null;
    };

    recognition.onend = async () => {
      const wasListening = listeningRef.current;
      listeningRef.current = false;
      setIsListening(false);
      recognitionRef.current = null;
      if (wasListening) {
        const text = finalTranscriptRef.current.trim();
        if (text) await processTranscript(text);
      }
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setLastTranscript("Impossible de démarrer le micro. Réessayez.");
    }
  }, [demoMode, isListening, onStart, onStop, processTranscript, stopRecognition]);

  useEffect(() => {
    return () => {
      stopRecognition();
      stopAudioMeter();
    };
  }, [stopRecognition, stopAudioMeter]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = () => {
    if (micReady === false) return "Micro bloqué";
    if (isListening) return "J'écoute… (appuyez pour terminer)";
    if (isProcessing) return "Traitement…";
    if (isSpeaking) return "Je réponds…";
    return "Appuyez pour parler";
  };

  const getStatusColor = () => {
    if (micReady === false) return "text-destructive";
    if (isListening) return "text-blue-500";
    if (isProcessing) return "text-amber-500";
    if (isSpeaking) return "text-emerald-500";
    return "text-muted-foreground";
  };

  const btnSize = compact ? "w-20 h-20" : "w-28 h-28";
  const iconSize = compact ? "w-9 h-9" : "w-11 h-11";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden",
        compact ? "py-4" : "min-h-[420px] py-8",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute h-1 w-1 rounded-full bg-primary/25"
            style={{ left: particle.x, top: particle.y, opacity: particle.opacity }}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <motion.div className="relative" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <motion.button
            type="button"
            onClick={handleToggleListening}
            disabled={isProcessing || isSpeaking}
            aria-label={isListening ? "Arrêter l'écoute" : "Parler à l'assistant"}
            className={cn(
              "relative flex items-center justify-center rounded-full border-2 transition-all",
              "bg-gradient-to-br from-primary/20 to-primary/5",
              btnSize,
              isListening
                ? "border-blue-500 shadow-lg shadow-blue-500/20"
                : isProcessing
                  ? "border-amber-500 shadow-lg shadow-amber-500/20"
                  : isSpeaking
                    ? "border-emerald-500 shadow-lg shadow-emerald-500/20"
                    : "border-border hover:border-primary/40",
              (isProcessing || isSpeaking) && "cursor-not-allowed opacity-80",
            )}
            animate={{
              boxShadow: isListening
                ? ["0 0 0 0 rgba(59,130,246,0.35)", "0 0 0 16px rgba(59,130,246,0)"]
                : undefined,
            }}
            transition={{ duration: 1.4, repeat: isListening ? Infinity : 0 }}
          >
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Loader2 className={cn(iconSize, "animate-spin text-amber-500")} />
                </motion.div>
              ) : isSpeaking ? (
                <motion.div key="speaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Volume2 className={cn(iconSize, "text-emerald-500")} />
                </motion.div>
              ) : micReady === false ? (
                <motion.div key="muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <MicOff className={cn(iconSize, "text-destructive")} />
                </motion.div>
              ) : (
                <motion.div key="mic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Mic className={cn(iconSize, isListening ? "text-blue-500" : "text-muted-foreground")} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        <div className="flex h-12 items-center justify-center gap-1">
          {waveformData.map((height, index) => (
            <motion.div
              key={index}
              className={cn(
                "w-1 rounded-full",
                isListening ? "bg-blue-500" : isProcessing ? "bg-amber-500" : isSpeaking ? "bg-emerald-500" : "bg-muted",
              )}
              animate={{ height: `${Math.max(4, height * 0.5)}px` }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>

        <div className="max-w-xs space-y-2 text-center">
          <p className={cn("text-sm font-medium", getStatusColor())}>{getStatusText()}</p>
          <p className="font-mono text-xs text-muted-foreground">{formatTime(duration)}</p>
          {lastTranscript && (
            <p className="text-xs leading-5 text-muted-foreground">« {lastTranscript} »</p>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Assistant CAMPUS · français · gratuit</span>
        </div>
      </div>
    </div>
  );
}
