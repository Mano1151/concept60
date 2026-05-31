import { useEffect, useMemo, useRef, useState } from 'react';
import { isVoiceSupported } from '../utils/speech';

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function VoicePlayer({ sections, speed = 1, autoPlay = false }) {
  const [status, setStatus] = useState('idle');
  const [currentSentence, setCurrentSentence] = useState(0);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef(null);
  const sentenceOffsetsRef = useRef([]);

  const sentences = useMemo(() => {
    const list = [];
    sections.forEach((section) => {
      splitSentences(section.text).forEach((sentence) => {
        list.push({ sectionTitle: section.label, sentence });
      });
    });
    return list;
  }, [sections]);

  const combinedText = useMemo(
    () => sections.map((section) => `${section.label}: ${section.text}`).join(' '),
    [sections]
  );

  useEffect(() => {
    setSupported(isVoiceSupported());
  }, []);

  useEffect(() => {
    sentenceOffsetsRef.current = sentences.reduce((acc, item, index) => {
      const priorText = sentences.slice(0, index).map((entry) => entry.sentence).join(' ');
      acc.push(priorText.length + (index > 0 ? 1 : 0));
      return acc;
    }, []);
  }, [sentences]);

  const startSpeech = () => {
    if (!supported) return;

    const utterance = new SpeechSynthesisUtterance(combinedText);
    utterance.rate = speed;
    utterance.lang = 'en-US';
    utterance.onend = () => {
      setStatus('finished');
      setCurrentSentence(sentences.length - 1);
    };
    utterance.onerror = () => {
      setStatus('error');
    };
    utterance.onboundary = (event) => {
      if (event.name !== 'word') return;
      const index = sentenceOffsetsRef.current.findIndex((offset, pos) => {
        const nextOffset = sentenceOffsetsRef.current[pos + 1] ?? Infinity;
        return event.charIndex >= offset && event.charIndex < nextOffset;
      });
      if (index !== -1) {
        setCurrentSentence(index);
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setStatus('playing');
  };

  const handlePlay = () => {
    if (!supported) return;
    if (status === 'paused') {
      window.speechSynthesis.resume();
      setStatus('playing');
      return;
    }
    if (window.speechSynthesis.speaking) {
      return;
    }
    setCurrentSentence(0);
    startSpeech();
  };

  useEffect(() => {
    if (autoPlay && supported && status === 'idle') {
      handlePlay();
    }
    return () => {
      window.speechSynthesis.cancel();
      setStatus('idle');
      setCurrentSentence(0);
    };
  }, [autoPlay, supported]);

  useEffect(() => {
    if (!supported || status !== 'playing') {
      return;
    }

    window.speechSynthesis.cancel();
    setStatus('idle');
    setCurrentSentence(0);
    startSpeech();
  }, [speed, supported]);

  const handlePause = () => {
    if (!supported || !window.speechSynthesis.speaking) return;
    window.speechSynthesis.pause();
    setStatus('paused');
  };

  const handleStop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setStatus('idle');
    setCurrentSentence(0);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-panel/80 p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Listen</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Voice playback</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePlay}
            disabled={!supported}
            className="rounded-3xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#594be3] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'playing' ? 'Playing' : 'Play'}
          </button>
          <button
            type="button"
            onClick={handlePause}
            disabled={!supported || status !== 'playing'}
            className="rounded-3xl bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={handleStop}
            disabled={!supported || (status !== 'playing' && status !== 'paused')}
            className="rounded-3xl bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Stop
          </button>
        </div>
      </div>

      {!supported ? (
        <p className="mt-4 text-sm text-rose-300">Speech synthesis is not supported in this browser.</p>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-300">Current speed: {speed}x • Sentence {currentSentence + 1} of {sentences.length}</p>
          <div className="grid gap-2 rounded-3xl bg-white/5 p-4 text-sm">
            {sentences.slice(0, 5).map((item, index) => (
              <p key={`${item.sectionTitle}-${index}`} className={index === currentSentence ? 'rounded-2xl bg-accent/10 px-3 py-2 text-white' : 'text-slate-300'}>
                <span className="font-semibold text-slate-100">{item.sectionTitle}:</span> {item.sentence}
              </p>
            ))}
            {sentences.length > 5 ? <p className="text-xs text-slate-400">...more sentences available in the full explanation.</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default VoicePlayer;
