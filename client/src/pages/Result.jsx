import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import TimerAnimation from '../components/TimerAnimation';
import VoicePlayer from '../components/VoicePlayer';
import FocusReader from '../components/FocusReader';
import VideoPreview from '../components/VideoPreview';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { fontClass, modeClass, sizeClass } from '../utils/accessibility';
import TOPIC_DESCRIPTIONS from '../data/topicDescriptions';
import { getAccessibilitySettings, addRecentSearch, getLearningProgress, updateLearningProgress } from '../utils/localStorage';

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

const defaultSettings = {
  font: 'Inter',
  fontSize: 'medium',
  playbackSpeed: 1,
  readingMode: 'normal',
  listenMode: false,
  theme: 'dark',
};

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialConcept = location.state?.concept || '';
  const initialCategory = location.state?.category || 'General';

  const [concept] = useState(initialConcept);
  const [category] = useState(initialCategory);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(initialConcept ? 'loading' : 'idle');
  const [error, setError] = useState('');
  
  const [videoData, setVideoData] = useState(null);
  const [videoStatus, setVideoStatus] = useState('idle');
  const [videoError, setVideoError] = useState('');

  const [settings, setSettings] = useState(() => getAccessibilitySettings() ?? defaultSettings);
  const [activeSection, setActiveSection] = useState('scenario');
  const [progress, setProgress] = useState(getLearningProgress());
  const [lessonSaved, setLessonSaved] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showQuizAnswers, setShowQuizAnswers] = useState(false);
  const progressRef = useRef(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!concept) {
      return;
    }

    const controller = new AbortController();

    async function fetchResult() {
      setStatus('loading');
      setError('');

      try {
        const response = await apiClient.post(
          '/api/concept',
          { concept, category },
          { signal: controller.signal }
        );
          // Log the raw API response for debugging
          console.log('API response:', response.data);

          // Sanitize and normalize fields to avoid placeholder or invalid LLM outputs
          const normalizeField = (s) => {
            if (typeof s !== 'string') return null;
            const trimmed = s.trim();
            if (trimmed.length < 6) return null;
            if (/\b(oops|sorry|error)\b/i.test(trimmed)) return null;
            return trimmed;
          };

          const normalizeList = (value) => {
            if (Array.isArray(value)) {
              return value
                .filter((item) => typeof item === 'string' && item.trim().length > 2)
                .map((item) => item.trim());
            }
            if (typeof value === 'string') {
              return value
                .split(/[,;\n]/)
                .map((item) => item.trim())
                .filter((item) => item.length > 2);
            }
            return [];
          };

          // Parse keywords that may be objects { term, definition } or plain strings
          const normalizeKeywordsRaw = (value) => {
            const items = Array.isArray(value)
              ? value
              : typeof value === 'string'
              ? value.split(/[,;\n]/)
              : [];
            return items
              .map((item) => {
                if (item && typeof item === 'object') {
                  const term = String(item.term || item.word || item.keyword || '').trim();
                  const definition = String(item.definition || item.desc || '').trim();
                  return term ? { term, definition } : null;
                }
                if (typeof item === 'string' && item.trim().length > 2) {
                  return { term: item.trim(), definition: '' };
                }
                return null;
              })
              .filter(Boolean);
          };

          const apiData = response.data || {};
          const keywordsRaw = normalizeKeywordsRaw(apiData.keywords);
          const normalized = {
            ...apiData,
            oneLiner: normalizeField(apiData.oneLiner) || 'Definition not available — try again.',
            scenario: normalizeField(apiData.scenario) || (apiData.scenario || ''),
            exampleScenarios: normalizeList(apiData.exampleScenarios),
            keywords: keywordsRaw.map((k) => k.term),
            keywordDefinitions: Object.fromEntries(
              keywordsRaw.map((k) => [k.term.toLowerCase(), k.definition])
            ),
          };

          setData(normalized);
        setStatus('success');
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Unable to load the concept explanation. Please try again.'
        );
        setStatus('error');
      }
    }

    fetchResult();

    return () => controller.abort();
  }, [concept, category]);

  useEffect(() => {
    if (!concept) return;

    const controller = new AbortController();

    async function fetchVideo() {
      setVideoStatus('loading');
      setVideoError('');
      try {
        const response = await apiClient.post(
          '/api/video',
          { concept, category },
          { signal: controller.signal }
        );
        setVideoData(response.data);
        setVideoStatus('success');
      } catch (err) {
        if (controller.signal.aborted) return;
        setVideoError(
          err?.response?.data?.message ||
            err?.message ||
            'Unable to generate video.'
        );
        setVideoStatus('error');
      }
    }

    fetchVideo();

    return () => controller.abort();
  }, [concept, category]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.font = settings.font;
  }, [settings]);

  useEffect(() => {
    if (settings.readingMode === 'focus') {
      setActiveSection('scenario');
    }
  }, [settings.readingMode]);

  useEffect(() => {
    if (data) {
      addRecentSearch({
        concept,
        category,
        oneLiner: data.oneLiner,
        scenario: data.scenario,
        searchedAt: new Date().toISOString(),
      });
    }
  }, [data, concept, category]);

  useEffect(() => {
    if (data && !progressRef.current) {
      const nextProgress = updateLearningProgress({ conceptsReviewed: 1 });
      setProgress(nextProgress);
      progressRef.current = true;
    }
  }, [data]);

  const copyResultText = async () => {
    const extraExamples = data.exampleScenarios?.length
      ? `\n\nExamples:\n${data.exampleScenarios.map((item, index) => `${index + 1}. ${item}`).join('\n')}`
      : '';
    const extraKeywords = data.keywords?.length ? `\n\nKeywords: ${data.keywords.join(', ')}` : '';
    const text = `${data.concept}\n\n${data.scenario}${extraExamples}${extraKeywords}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Explanation copied to clipboard.', 'success');
    } catch (err) {
      showToast('Unable to copy to clipboard.', 'error');
    }
  };

  const shareConcept = async () => {
    const extraExamples = data.exampleScenarios?.length
      ? `\n\nExamples:\n${data.exampleScenarios.map((item, index) => `${index + 1}. ${item}`).join('\n')}`
      : '';
    const extraKeywords = data.keywords?.length ? `\n\nKeywords: ${data.keywords.join(', ')}` : '';
    const payload = {
      title: data.concept,
      text: `${data.scenario}${extraExamples}${extraKeywords}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(payload);
      } catch (err) {
        showToast('Sharing canceled.', 'error');
      }
      return;
    }

    await copyResultText();
    showToast('Share not supported. Explanation copied instead.', 'info');
  };

  const printExplanation = () => {
    window.print();
  };

  const updateProgressState = (delta) => {
    const next = updateLearningProgress(delta);
    setProgress(next);
    return next;
  };

  const buildKeywordDefinition = (keyword) =>
    `A key idea connected to ${concept}: ${keyword}. Use it to remember the concept and how it applies.`;

  const quizQuestions = useMemo(() => {
    if (!data) return [];

    return [
      {
        question: `What real-world scenario explains ${concept}?`,
        answer: data.scenario,
      },
      {
        question: `Which keyword best captures the main idea of ${concept}?`,
        answer: data.keywords?.[0] || 'Review the keywords above.',
      },
      {
        question: `What is one practical use case for ${concept}?`,
        answer: data.exampleScenarios?.[0] || data.scenario,
      },
    ];
  }, [concept, data]);

  const flashcards = useMemo(() => {
    if (!data?.keywords?.length) return [];
    const normalize = (str) =>
      String(str || '')
        .toLowerCase()
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[\s_]+/g, ' ')
        .trim();

    const lookupDescription = (kw) => {
      const plain = normalize(kw);
      if (TOPIC_DESCRIPTIONS[plain]) return TOPIC_DESCRIPTIONS[plain];
      // try variants: replace spaces with hyphens and vice versa
      const hyphen = plain.replace(/\s+/g, '-');
      if (TOPIC_DESCRIPTIONS[hyphen]) return TOPIC_DESCRIPTIONS[hyphen];
      const spaced = plain.replace(/-/g, ' ');
      if (TOPIC_DESCRIPTIONS[spaced]) return TOPIC_DESCRIPTIONS[spaced];
      return null;
    };

    return data.keywords.map((keyword) => {
      const aiDef = data.keywordDefinitions?.[keyword.toLowerCase()];
      const mapped = lookupDescription(keyword);
      return {
        term: keyword,
        definition:
          aiDef && aiDef.length > 5
            ? aiDef
            : mapped || buildKeywordDefinition(keyword),
      };
    });
  }, [data]);

  const lessonContentText = () => {
    const examples = data.exampleScenarios?.length
      ? `\n\nExamples:\n${data.exampleScenarios.map((item, index) => `${index + 1}. ${item}`).join('\n')}`
      : '';
    const keywords = data.keywords?.length ? `\n\nKeywords: ${data.keywords.join(', ')}` : '';
    return `${data.concept}\n\n${data.scenario}${examples}${keywords}`;
  };

  const handleSaveLesson = () => {
    if (lessonSaved) {
      showToast('This lesson is already saved.', 'info');
      return;
    }

    addRecentSearch({
      concept,
      category,
      oneLiner: data.oneLiner,
      scenario: data.scenario,
      searchedAt: new Date().toISOString(),
    });
    setLessonSaved(true);
    updateProgressState({ lessonsSaved: 1 });
    showToast('Lesson saved to your learning library.', 'success');
  };

  const handleExportLesson = () => {
    const content = lessonContentText();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${concept.replace(/[^a-zA-Z0-9_-]/g, '_')}_lesson.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Lesson notes downloaded.', 'success');
  };

  const handleQuizComplete = () => {
    if (!quizCompleted) {
      updateProgressState({ quizzesCompleted: 1 });
      setQuizCompleted(true);
      showToast('Quiz completed! Progress saved.', 'success');
    }
    setShowQuizAnswers((prev) => !prev);
  };

  const sections = useMemo(() => {
    if (!data) return [];
    return [
      {
        key: 'scenario',
        title: 'Real-world scenario',
        label: 'Scenario',
        text: data.scenario,
        sentences: splitSentences(data.scenario),
      },
    ];
  }, [data]);

  if (!concept) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft backdrop-blur-md">
          <h2 className="text-2xl font-semibold text-white">No concept selected</h2>
          <p className="mt-3 text-slate-300">Start from the home page and search for a concept to see the AI explanation.</p>
          <div className="mt-6">
            <Button variant="primary" onClick={() => navigate('/')}>Back to search</Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`space-y-6 ${fontClass(settings.font)} ${sizeClass(settings.fontSize)} ${modeClass(settings.readingMode)}`}>
      {status === 'loading' ? (
        <>
          <TimerAnimation />
          <LoadingSkeleton />
        </>
      ) : status === 'error' ? (
        <div className="rounded-3xl border border-rose-400/20 bg-[#2f1d29]/80 p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-white">Something went wrong</h2>
          <p className="mt-3 text-slate-300">{error}</p>
          <div className="mt-6">
            <Button variant="primary" onClick={() => navigate('/')}>Search again</Button>
          </div>
        </div>
      ) : (
        data && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Concept overview</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">{data.concept}</h2>
                {data.oneLiner && (
                  <p className="mt-2 text-sm text-slate-300 italic">{data.oneLiner}</p>
                )}
              </div>
              <div className="mt-6 rounded-3xl bg-white/5 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Real-world scenario</p>
                <p className="mt-3 text-lg text-slate-200 leading-8">{data.scenario}</p>
                {data.keywords?.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Keywords</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {data.keywords.map((keyword, index) => (
                        <span key={index} className="rounded-full bg-slate-900/90 px-3 py-1 text-xs uppercase tracking-[0.15em] text-slate-100">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {(data.exampleScenarios?.length > 0 || data.keywords?.length > 0) && (
                <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
                  <div className="space-y-6">
                    {data.exampleScenarios?.[0] && (
                      <div className="rounded-3xl bg-white/5 p-6">
                        <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Another real-world scenario</p>
                        <p className="mt-4 text-lg text-slate-200 leading-8">{data.exampleScenarios[0]}</p>
                      </div>
                    )}

                    {data.exampleScenarios?.length > 1 && (
                      <div className="rounded-3xl bg-white/5 p-6">
                        <p className="text-sm uppercase tracking-[0.35em] text-slate-400">More real-world examples</p>
                        <div className="mt-4 space-y-3 text-slate-200">
                          {data.exampleScenarios.slice(1).map((example, index) => (
                            <p key={index} className="leading-7">
                              <span className="font-semibold text-white">Example {index + 2}:</span> {example}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft">
              <div className="grid gap-8 xl:grid-cols-[1.4fr_0.9fr]">
                <div className="space-y-6">
                  <div className="rounded-3xl bg-white/5 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                       
                        <h3 className="mt-3 text-xl font-semibold text-white">Practice with quick questions</h3>
                      </div>
                      <Button onClick={handleQuizComplete} className="px-4 py-2">{showQuizAnswers ? 'Hide answers' : quizCompleted ? 'Review answers' : 'Show answers'}</Button>
                    </div>
                    <div className="mt-6 space-y-4">
                      {quizQuestions.map(({ question, answer }, index) => (
                        <div key={question} className="rounded-3xl bg-slate-950/80 p-4">
                          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Question {index + 1}</p>
                          <p className="mt-3 text-base text-slate-200">{question}</p>
                          {showQuizAnswers && (
                            <div className="mt-3 rounded-3xl bg-white/5 p-4 text-sm text-slate-100">
                              <span className="font-semibold text-white">Answer:</span> {answer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white/5 p-6">
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Flashcards</p>
                    <h3 className="mt-3 text-xl font-semibold text-white">Keyword flashcards</h3>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {flashcards.map((card) => (
                        <div key={card.term} className="rounded-3xl border border-white/10 bg-slate-900/90 p-5">
                          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{card.term}</p>
                          <p className="mt-3 text-sm leading-6 text-slate-200">{card.definition}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                <aside className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300 shadow-soft">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Learning progress</p>
                    <h3 className="mt-3 text-xl font-semibold text-white">Track your lesson activity</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-3xl bg-slate-950/80 p-4">
                      <p className="text-sm text-slate-400">Concepts reviewed</p>
                      <p className="mt-2 text-3xl font-semibold text-white">{progress.conceptsReviewed}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-950/80 p-4">
                      <p className="text-sm text-slate-400">Quizzes completed</p>
                      <p className="mt-2 text-3xl font-semibold text-white">{progress.quizzesCompleted}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-950/80 p-4">
                      <p className="text-sm text-slate-400">PDF answers generated</p>
                      <p className="mt-2 text-3xl font-semibold text-white">{progress.pdfQuestionsAnswered}</p>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-950/80 p-4">
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Lesson tools</p>
                    <Button variant="ghost" className="mt-4 w-full text-left" onClick={handleSaveLesson}>{lessonSaved ? 'Lesson saved' : 'Save lesson'}</Button>
                    <Button variant="primary" className="mt-3 w-full" onClick={handleExportLesson}>Export lesson notes</Button>
                  </div>
                </aside>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400">{category}</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">{data.concept}</h2>
                </div>
                <div className="rounded-3xl bg-white/5 px-4 py-2 text-sm text-slate-300">
                  AI explanation ready
                </div>
              </div>

              <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
                <div className="space-y-6">
                  <VoicePlayer sections={sections} speed={settings.playbackSpeed} autoPlay={settings.listenMode} />

                  <FocusReader
                    sections={sections}
                    mode={settings.readingMode}
                    activeSection={activeSection}
                    onSelectSection={setActiveSection}
                  />

                  {videoStatus === 'loading' && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-slate-400">
                      Generating video... This may take a minute.
                    </div>
                  )}
                  {videoStatus === 'error' && (
                    <div className="rounded-3xl border border-rose-400/20 bg-[#2f1d29]/80 p-6 text-center text-rose-200">
                      {videoError}
                    </div>
                  )}
                  {videoStatus === 'success' && videoData && videoData.type === 'video' && (
                    <VideoPreview videoUrl={videoData.videoUrl} summary={videoData.summary} />
                  )}
                </div>

                <aside className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300 shadow-soft">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Quick actions</p>
                    <p className="mt-3 text-base text-white">Share, copy, print, or search for another concept.</p>
                  </div>
                  <div className="space-y-3">
                    <Button variant="ghost" className="w-full text-left" onClick={copyResultText}>Copy full explanation</Button>
                    <Button variant="ghost" className="w-full text-left" onClick={shareConcept}>Share concept</Button>
                    <Button variant="ghost" className="w-full text-left" onClick={printExplanation}>Print summary</Button>
                    <Button variant="primary" className="w-full text-left" onClick={() => navigate('/')}>Search again</Button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        )
      )}
    </section>
  );
}

export default Result;
