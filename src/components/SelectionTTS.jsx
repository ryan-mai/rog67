import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TiVolumeUp } from "react-icons/ti";

const DEFAULT_VOICE_ID = "gU0LNdkMOQCOrPrwtbee";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

const normalizeSelectedText = (text) => {
  if (!text) return "";
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
};

const SelectionTTS = () => {
  const [selectionText, setSelectionText] = useState("");
  const [selectionRect, setSelectionRect] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const modelId = import.meta.env.VITE_ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID;

  const canSpeak = Boolean(apiKey);

  const iconPosition = useMemo(() => {
    if (!selectionRect) return null;

    const ICON_SIZE = 40;
    const PADDING = 8;

    let left = selectionRect.right + PADDING;
    let top = selectionRect.top - ICON_SIZE - PADDING;

    if (left + ICON_SIZE > window.innerWidth - PADDING) {
      left = selectionRect.left - ICON_SIZE - PADDING;
    }

    if (left < PADDING) {
      left = PADDING;
    }

    if (top < PADDING) {
      top = selectionRect.bottom + PADDING;
    }

    if (top + ICON_SIZE > window.innerHeight - PADDING) {
      top = window.innerHeight - ICON_SIZE - PADDING;
    }

    return { left, top };
  }, [selectionRect]);

  const clearSelection = useCallback(() => {
    setSelectionText("");
    setSelectionRect(null);
  }, []);

  const updateSelectionFromDom = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      clearSelection();
      return;
    }

    const rawText = selection.toString();
    const text = normalizeSelectedText(rawText);

    if (!text) {
      clearSelection();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (!rect || (rect.width === 0 && rect.height === 0)) {
      clearSelection();
      return;
    }

    setSelectionText(text);
    setSelectionRect(rect);
  }, [clearSelection]);

  useEffect(() => {
    const handleMouseUp = (event) => {
      if (event.button !== 0) return;
      requestAnimationFrame(updateSelectionFromDom);
    };

    const handleSelectionChange = () => {
      updateSelectionFromDom();
    };

    const handleScroll = () => {
      if (selectionText) {
        updateSelectionFromDom();
      }
    };

    const handleMouseDown = (event) => {
      if (event.button !== 0) return;
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.closest("[data-tts-trigger]")) return;
      clearSelection();
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [clearSelection, selectionText, updateSelectionFromDom]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const handleSpeak = async () => {
    if (!selectionText || !canSpeak) return;

    try {
      setIsSpeaking(true);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: selectionText,
            model_id: modelId,
            voice_settings: {
              stability: 0.45,
              similarity_boost: 0.65,
            },
          }),
        }
      );

      if (!response.ok) {
        setIsSpeaking(false);
        return;
      }

      const audioBlob = await response.blob();

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = audioRef.current || new Audio();
      audioRef.current = audio;
      audio.src = audioUrl;
      await audio.play();
    } finally {
      setIsSpeaking(false);
    }
  };

  if (!selectionText || !iconPosition) return null;

  return (
    <button
      type="button"
      data-tts-trigger
      onClick={handleSpeak}
      disabled={!canSpeak || isSpeaking}
      style={{ left: iconPosition.left, top: iconPosition.top }}
      className="fixed z-[200] flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-white shadow-lg backdrop-blur transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Play selected text"
    >
      <TiVolumeUp className="text-xl" />
    </button>
  );
};

export default SelectionTTS;
