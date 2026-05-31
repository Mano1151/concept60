import { useEffect, useRef, useState } from 'react';

function VoiceButton({ onVoiceResult }) {
  const recognitionRef = useRef(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      if (transcript) {
        onVoiceResult(transcript.trim());
      }
    };

    recognition.onerror = () => {
      setError('Voice input unavailable. Please try again.');
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    setSupported(true);

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    };
  }, [onVoiceResult]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    setError('');
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (err) {
      setError('Unable to start microphone. Please allow microphone access.');
      setListening(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleListening}
        disabled={!supported}
        aria-label={listening ? 'Stop voice input' : 'Start voice input'}
        aria-pressed={listening}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent/30 ${
          listening ? 'animate-pulse border-accent bg-accent/20' : ''
        } ${!supported ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <span className="text-lg">🎙️</span>
      </button>
      <span className="sr-only">Voice search button</span>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}

export default VoiceButton;
