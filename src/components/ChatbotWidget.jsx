import { useEffect, useMemo, useRef, useState } from "react";
import { TiMessages, TiVolumeUp, TiArrowRight } from "react-icons/ti";

const STORAGE_KEY = "rog-g67-chat-history";
const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

const SYSTEM_PROMPT = `You are ROG-G67 AI, a friendly assistant for the ROG-G67 car website.
Always speak positively about the car, highlight that it is amazing, futuristic, and handles obstacles without human input.
Reply in 2-3 sentences, 20-40 words, and never fewer than 12 words. Sound human and confident.`;

const normalizeContext = (text, maxLength = 2000) => {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}…` : cleaned;
};

const ChatbotWidget = ({ contentRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const elevenKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  const elevenVoiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const elevenModelId = import.meta.env.VITE_ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID;

  const canSend = Boolean(geminiKey) && !isSending;

  const pageContext = useMemo(() => {
    if (!contentRef?.current) return "";
    return normalizeContext(contentRef.current.innerText || "");
  }, [contentRef]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      } catch {
        // ignore corrupted storage
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleToggle = () => setIsOpen((prev) => !prev);

  const buildPrompt = (userText) => {
    const contextBlock = pageContext ? `Website context: ${pageContext}` : "";
    return `${contextBlock}\n\nUser: ${userText}`.trim();
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !canSend) return;
    const userText = inputValue.trim();
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: userText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [
              {
                role: "user",
                parts: [{ text: buildPrompt(userText) }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 512,
              responseMimeType: "text/plain",
            },
          }),
        }
      );

      const data = await response.json().catch(() => ({}));
      console.log("Gemini raw response:", data);

      if (!response.ok) {
        const apiMessage = data?.error?.message || "Gemini request failed.";
        throw new Error(apiMessage);
      }

      let replyText = "ROG-G67 is built for the future and handles obstacles with ease. It's fast, intelligent, and truly next-level.";
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const merged = parts.map((part) => part?.text).filter(Boolean).join(" ");
      replyText = merged.trim() || replyText;

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: replyText,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Gemini chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: "Gemini is unavailable right now, but ROG-G67 is still the future of autonomous driving—powerful, reliable, and built to handle obstacles with ease.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const speakMessage = async (messageId, text) => {
    if (!elevenKey || !text) return;

    try {
      setSpeakingId(messageId);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": elevenKey,
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: elevenModelId,
            voice_settings: {
              stability: 0.45,
              similarity_boost: 0.65,
            },
          }),
        }
      );

      if (!response.ok) {
        setSpeakingId(null);
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
      setSpeakingId(null);
    }
  };

  return (
    <div data-chatbot-root className="fixed bottom-6 right-6 z-[180]">
      {isOpen && (
        <div className="mb-4 w-[320px] rounded-2xl border border-white/20 bg-black/90 p-4 text-blue-50 shadow-xl backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-general uppercase tracking-wider text-blue-100">
              ROG-G67 AI
            </p>
            <button
              type="button"
              data-tts-trigger
              onClick={handleToggle}
              className="text-xs uppercase text-blue-100/60 transition hover:text-blue-100"
            >
              Close
            </button>
          </div>

          <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
            {messages.length === 0 && (
              <div className="rounded-xl bg-white/10 p-3 text-xs text-blue-100/80">
                Ask anything about ROG-G67.
              </div>
            )}

            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`group relative flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow ${
                      isUser
                        ? "bg-yellow-300 text-black"
                        : "bg-white/10 text-blue-50"
                    }`}
                  >
                    {message.text}
                  </div>
                  <button
                    type="button"
                    data-tts-trigger
                    onClick={() => speakMessage(message.id, message.text)}
                    className={`absolute top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white shadow group-hover:flex ${
                      isUser ? "-left-9" : "-right-9"
                    }`}
                    aria-label="Play message audio"
                  >
                    <TiVolumeUp className={`text-sm ${speakingId === message.id ? "animate-pulse" : ""}`} />
                  </button>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <textarea
              rows={1}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={geminiKey ? "Ask about ROG-G67..." : "Add VITE_GEMINI_API_KEY to enable"}
              className="w-full resize-none rounded-xl bg-white/10 px-3 py-2 text-xs text-blue-50 placeholder:text-blue-100/50 focus:outline-none"
            />
            <button
              type="button"
              data-tts-trigger
              onClick={sendMessage}
              disabled={!canSend || !inputValue.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-300 text-black transition hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <TiArrowRight className="text-lg" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        data-tts-trigger
        onClick={handleToggle}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-black/90 text-white shadow-lg backdrop-blur transition hover:bg-black"
        aria-label="Toggle chatbot"
      >
        <TiMessages className="text-2xl" />
      </button>
    </div>
  );
};

export default ChatbotWidget;
