import { endVoiceSession, startSessionVoice } from "@/lib/actions/session.action";
import { ASSISTANT_ID, DEFAULT_VOICE, VOICE_SETTINGS } from "@/lib/constants";
import { IBook, Messages } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { getVoice } from "@/lib/utils";

export type CallStatus = 'idle' | 'connecting' | 'starting' | 'listening' | 'thinking' | 'speaking';

const useLatestRef = <T>(value: T) => {
  const ref = useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY!;

let vapi: InstanceType<typeof Vapi> | null = null;

function getVapi(){
  if (!vapi) {
    if (!VAPI_API_KEY) {
      throw new Error("VAPI API key is missing. Please set NEXT_PUBLIC_VAPI_API_KEY in your environment variables.");
    }
    vapi = new Vapi(VAPI_API_KEY);
  }
  return vapi;
}

export const useVapi = (book: IBook) => {
  const { userId } = useAuth();

  const [status, setStatus] = useState<CallStatus>('idle');
  const [messages, setMessages] = useState<Messages[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentUserMessage, setCurrentUserMessage] = useState('');
  const [duration, setDuration] = useState(0);
  const [maxDurationSeconds, setMaxDurationSeconds] = useState(15 * 60); // default 15 min, updated on start
  const [limitError, setLimitError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isStoppingRef = useRef<boolean>(false);

  const bookRef = useLatestRef(book);
  const durationRef = useLatestRef(duration);
  const maxDurationRef = useLatestRef(maxDurationSeconds);
  const voice = book.persona || DEFAULT_VOICE;

  const isActive = status === 'listening' || status === 'thinking' || status === 'speaking' || status === 'starting';

  // ── Timer helpers ──
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setDuration((prev) => {
        const next = prev + 1;
        // Auto-stop when limit exceeded
        if (next >= maxDurationRef.current && !isStoppingRef.current) {
          isStoppingRef.current = true;
          getVapi().stop();
        }
        return next;
      });
    }, 1000);
  }, [maxDurationRef]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Deduplicated append helper ──
  const appendMessage = useCallback((role: string, content: string) => {
    setMessages((prev) => {
      // Skip if the last message from the same role has the same content
      const last = prev[prev.length - 1];
      if (last && last.role === role && last.content === content) return prev;
      return [...prev, { role, content }];
    });
  }, []);

  // ── VAPI event listeners ──
  useEffect(() => {
    const vapiInstance = getVapi();

    const onCallStart = () => {
      setStatus('listening');
      startTimer();
    };

    const onCallEnd = () => {
      stopTimer();
      // Flush any remaining streaming text as final messages
      setCurrentMessage((prev) => {
        if (prev) appendMessage('assistant', prev);
        return '';
      });
      setCurrentUserMessage((prev) => {
        if (prev) appendMessage('user', prev);
        return '';
      });

      // Persist session duration
      if (sessionIdRef.current) {
        endVoiceSession(sessionIdRef.current, durationRef.current).catch((err) =>
          console.error('Error ending voice session:', err)
        );
        sessionIdRef.current = null;
      }

      const wasOverLimit = durationRef.current >= maxDurationRef.current;
      setStatus('idle');
      isStoppingRef.current = false;

      if (wasOverLimit) {
        setLimitError('Session time limit reached. Redirecting...');
        setTimeout(() => { window.location.href = '/'; }, 2000);
      }
    };

    const onSpeechStart = () => {
      setStatus('speaking');
    };

    const onSpeechEnd = () => {
      setStatus('listening');
    };

    const onMessage = (msg: any) => {
      if (msg.type === 'transcript') {
        const { role, transcriptType, transcript } = msg;

        if (role === 'user') {
          if (transcriptType === 'partial') {
            setCurrentUserMessage(transcript);
          } else if (transcriptType === 'final') {
            setCurrentUserMessage('');
            setStatus('thinking');
            appendMessage('user', transcript);
          }
        } else if (role === 'assistant') {
          if (transcriptType === 'partial') {
            setCurrentMessage(transcript);
          } else if (transcriptType === 'final') {
            setCurrentMessage('');
            appendMessage('assistant', transcript);
          }
        }
      }
    };

    const onError = (err: any) => {
      console.error('VAPI error:', err);
      setStatus('idle');
    };

    vapiInstance.on('call-start', onCallStart);
    vapiInstance.on('call-end', onCallEnd);
    vapiInstance.on('speech-start', onSpeechStart);
    vapiInstance.on('speech-end', onSpeechEnd);
    vapiInstance.on('message', onMessage);
    vapiInstance.on('error', onError);

    return () => {
      vapiInstance.off('call-start', onCallStart);
      vapiInstance.off('call-end', onCallEnd);
      vapiInstance.off('speech-start', onSpeechStart);
      vapiInstance.off('speech-end', onSpeechEnd);
      vapiInstance.off('message', onMessage);
      vapiInstance.off('error', onError);
      stopTimer();
    };
  }, [appendMessage, startTimer, stopTimer, durationRef, maxDurationRef]);

  const start = async () => {
    if (!userId) {
      setLimitError("You must be signed in to use this feature.");
      return;
    }
    setLimitError(null);
    setStatus('connecting');

    try {
      const result = await startSessionVoice(userId, bookRef.current._id);

      if (!result.success || !result.sessionId) {
        setStatus('idle');
        setLimitError(result.error || "Failed to start session. Please try again.");
        return;
      }

      sessionIdRef.current = result.sessionId || null;
      if (result.maxDurationMinutes) {
        setMaxDurationSeconds(result.maxDurationMinutes * 60);
      }
      setDuration(0);
      setStatus('starting');
      const firstMessage = `Hey, good to meet you. Quick question before we dive in - have you actually read ${book.title} yet, or are we starting fresh?`;
      await getVapi().start(ASSISTANT_ID, {
        firstMessage,
        variableValues: {
          bookId: bookRef.current._id,
          title: bookRef.current.title,
          author: bookRef.current.author,
        },
        voice: {
          provider: "11labs" as const,
          voiceId: getVoice(voice).id,
          model: "eleven_flash_v2_5",
          stability: VOICE_SETTINGS.stability,
          similarityBoost: VOICE_SETTINGS.similarityBoost,
          style: VOICE_SETTINGS.style,
          useSpeakerBoost: VOICE_SETTINGS.useSpeakerBoost,
        },
      })
      
    } catch (error) {
      console.error("Error starting VAPI session:", error);
      setStatus('idle');
      if(sessionIdRef.current) {
        endVoiceSession(sessionIdRef.current, 0).catch((err) => console.error("Error ending session after failed start:", err));
        sessionIdRef.current = null;
      }
      setLimitError("An error occurred while connecting. Please try again.");
    }

  }
  const stop = async () => { 
    isStoppingRef.current = true;
    await getVapi().stop();
  }
  const clearErrors = async () => { }


  return {
    status,
    messages,
    currentMessage,
    currentUserMessage,
    duration,
    maxDurationSeconds,
    limitError,
    isActive,
    start,
    stop,
    clearErrors
  }
}

export default useVapi;