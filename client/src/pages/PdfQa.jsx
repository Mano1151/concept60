import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { extractPdfText } from '../utils/pdf';
import { fontClass, modeClass, sizeClass } from '../utils/accessibility';
import { getAccessibilitySettings, setAccessibilitySettings, updateLearningProgress } from '../utils/localStorage';

const defaultSettings = {
  font: 'Inter',
  fontSize: 'medium',
  playbackSpeed: 1,
  readingMode: 'normal',
  listenMode: false,
  theme: 'dark',
};

function PdfQa() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => getAccessibilitySettings() ?? defaultSettings);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfText, setPdfText] = useState('');
  const [pdfQuestion, setPdfQuestion] = useState('');
  const [pdfAnswer, setPdfAnswer] = useState('');
  const [pdfStatus, setPdfStatus] = useState('idle');
  const [pdfError, setPdfError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.font = settings.font;
  }, [settings]);

  const handlePdfFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPdfError('');
    setPdfAnswer('');
    setPdfQuestion('');
    setPdfText('');
    setPdfFileName(file.name);
    setPdfStatus('extracting');

    try {
      const text = await extractPdfText(file);
      if (!text.trim()) {
        throw new Error('No text detected in the uploaded PDF.');
      }
      setPdfText(text);
      setPdfStatus('ready');
      showToast('PDF loaded successfully. Ask a question about the document.', 'success');
    } catch (err) {
      console.error('PDF parse error:', err);
      const errorMessage = 'Unable to read the PDF. Please upload a valid PDF file.';
      setPdfError(errorMessage);
      setPdfStatus('error');
      showToast(errorMessage, 'error');
    }
  };

  const handleAskPdfQuestion = async () => {
    if (!pdfText) {
      const errorMessage = 'Upload a PDF before asking a question.';
      setPdfError(errorMessage);
      showToast(errorMessage, 'error');
      return;
    }
    if (!pdfQuestion.trim()) {
      const errorMessage = 'Please type a question for the PDF content.';
      setPdfError(errorMessage);
      showToast(errorMessage, 'error');
      return;
    }

    setPdfStatus('asking');
    setPdfError('');
    setPdfAnswer('');

    try {
      const response = await apiClient.post('/api/qa/pdf-question', {
        pdfText,
        question: pdfQuestion.trim(),
      });
      setPdfAnswer(response.data.answer || 'No answer could be generated.');
      updateLearningProgress({ pdfQuestionsAnswered: 1 });
      showToast('PDF answer generated successfully.', 'success');
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        'Unable to answer the question. Please try again later.';
      setPdfError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setPdfStatus('idle');
    }
  };

  return (
    <section className={`space-y-6 ${fontClass(settings.font)} ${sizeClass(settings.fontSize)} ${modeClass(settings.readingMode)}`}>
      <div className="rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">PDF Q&amp;A</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Ask questions from any PDF</h1>
            <p className="mt-3 text-slate-300 max-w-2xl">
              Upload a PDF, then ask a question in natural language. The app reads the document and returns a concise answer.
            </p>
          </div>
          <Button variant="primary" type="button" onClick={() => navigate('/')} className="px-5 py-3">
            Back to search
          </Button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 rounded-3xl bg-white/5 p-6">
            <label className="block text-sm font-semibold text-slate-300">Upload PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePdfFileChange}
              className="w-full rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-slate-200"
            />
            {pdfFileName && <p className="text-sm text-slate-400">Loaded: {pdfFileName}</p>}

            <label className="block text-sm font-semibold text-slate-300">Ask a question</label>
            <textarea
              rows="4"
              value={pdfQuestion}
              onChange={(event) => setPdfQuestion(event.target.value)}
              placeholder="Ask about the uploaded PDF..."
              className="w-full rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-slate-200"
            />
            <Button
              variant="primary"
              type="button"
              onClick={handleAskPdfQuestion}
              disabled={pdfStatus === 'asking' || pdfStatus === 'extracting'}
              className="px-6 py-3"
            >
              {pdfStatus === 'asking' ? 'Answering...' : 'Ask PDF'}
            </Button>

            {pdfError && <p className="text-sm text-rose-300">{pdfError}</p>}
          </div>

          <div className="rounded-3xl bg-white/5 p-6 text-slate-300">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Answer output</p>
            <div className="mt-4 min-h-[220px] rounded-3xl bg-slate-950/90 p-6 text-sm leading-7 text-slate-200 whitespace-pre-wrap">
              {pdfAnswer ? (
                <p>{pdfAnswer}</p>
              ) : (
                <p className="text-slate-500">Upload a PDF and ask a question to see the response here.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PdfQa;
