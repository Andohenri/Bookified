'use client';

import { useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';
import { Messages } from '@/types';

interface TranscriptProps {
  messages: Messages[];
  currentMessage: string;
  currentUserMessage: string;
}

const Transcript = ({ messages, currentMessage, currentUserMessage }: TranscriptProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentMessage, currentUserMessage]);

  const hasContent =
    messages.length > 0 || currentMessage.length > 0 || currentUserMessage.length > 0;

  if (!hasContent) {
    return (
      <div className="transcript-container">
        <div className="transcript-empty">
          <Mic className="w-12 h-12 text-gray-400 mb-3" />
          <p className="transcript-empty-text">No conversation yet</p>
          <p className="transcript-empty-hint">
            Click the mic button above to start talking
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="transcript-container">
      <div className="transcript-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`transcript-message ${
              msg.role === 'user'
                ? 'transcript-message-user'
                : 'transcript-message-assistant'
            }`}
          >
            <div
              className={`transcript-bubble ${
                msg.role === 'user'
                  ? 'transcript-bubble-user'
                  : 'transcript-bubble-assistant'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {currentMessage && (
          <div className="transcript-message transcript-message-assistant">
            <div className="transcript-bubble transcript-bubble-assistant">
              {currentMessage}
              <span className="transcript-cursor" />
            </div>
          </div>
        )}

        {currentUserMessage && (
          <div className="transcript-message transcript-message-user">
            <div className="transcript-bubble transcript-bubble-user">
              {currentUserMessage}
              <span className="transcript-cursor" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default Transcript;
