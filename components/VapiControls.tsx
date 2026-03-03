'use client';

import useVapi from '@/hooks/useVapi';
import { IBook } from '@/types'
import { Mic, MicOff } from 'lucide-react'
import Image from 'next/image';
import Transcript from '@/components/Transcript';

const VapiControls = ({ book }: { book: IBook }) => {
  const {
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
  } = useVapi(book);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  return (
    <>
      <section className="vapi-header-card w-full">
        {/* Cover + mic button */}
        <div className="vapi-cover-wrapper">
          <Image
            src={book.coverURL || "/assets/no-cover.png"}
            alt={`Cover of ${book.title}`}
            width={130}
            height={195}
            className="vapi-cover-image"
          />
          <div className="vapi-mic-wrapper">
            {isActive && <span className="vapi-pulse-ring" />}
            <button onClick={isActive ? stop : start} disabled={status === 'connecting'} className={`vapi-mic-btn ${isActive ? 'vapi-mic-btn-active' : 'vapi-mic-btn-inactive'}`} aria-label="Toggle microphone">
              {isActive ? <Mic className="w-6 h-6 text-[#663820]" /> : <MicOff className="w-6 h-6 text-gray-500" />}
            </button>
          </div>
        </div>

        {/* Book info */}
        <div className="flex flex-col justify-center gap-3">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#212a3b]">
              {book.title}
            </h1>
            <p className="text-[#3d485e] text-base mt-1">by {book.author}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="vapi-status-indicator">
              <span className={"vapi-status-dot " + (status === 'idle' ? 'vapi-status-dot-ready' : status === 'connecting' ? 'vapi-status-dot-connecting' : status === 'starting' ? 'vapi-status-dot-starting' : status === 'listening' ? 'vapi-status-dot-listening' : status === 'thinking' ? 'vapi-status-dot-thinking' : status === 'speaking' ? 'vapi-status-dot-speaking' : 'vapi-status-dot-unknown')} />
              <span className="vapi-status-text">{status === 'idle' ? 'Ready' : status === 'connecting' ? 'Connecting...' : status === 'starting' ? 'Starting...' : status === 'listening' ? 'Listening...' : status === 'thinking' ? 'Thinking...' : status === 'speaking' ? 'Speaking...' : 'Unknown'}</span>
            </span>

            <span className="vapi-status-indicator">
              <span className="vapi-status-text">Voice: {book.persona || "Daniel"}</span>
            </span>

            <span className="vapi-status-indicator">
              <span className="vapi-status-text">{formatTime(duration)}/{formatTime(maxDurationSeconds)}</span>
            </span>
          </div>
        </div>
      </section>

      {limitError && (
        <div className="error-banner">
          <div className="error-banner-content">
            <p className="text-sm text-red-700 font-medium">{limitError}</p>
          </div>
        </div>
      )}

      <section className="vapi-transcript-wrapper">
        <Transcript
          messages={messages}
          currentMessage={currentMessage}
          currentUserMessage={currentUserMessage}
        />
      </section>
    </>
  )
}

export default VapiControls