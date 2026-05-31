import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PROVIDER = process.env.AI_PROVIDER?.toLowerCase() || 'anthropic';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_VIDEO_MODEL = process.env.OPENAI_VIDEO_MODEL || 'gpt-video-1';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5';

const anthropicClient = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const geminiModel = genAI ? genAI.getGenerativeModel({ model: GEMINI_MODEL }) : null;

function isGeminiQuotaError(error) {
  const quotaFailure = Array.isArray(error?.errorDetails)
    ? error.errorDetails.some((detail) => detail?.['@type']?.includes('QuotaFailure'))
    : false;

  return (
    error?.status === 429 ||
    (typeof error?.message === 'string' && error.message.toLowerCase().includes('quota')) ||
    quotaFailure
  );
}

function getFallbackProvider() {
  if (PROVIDER !== 'anthropic' && anthropicClient) {
    return 'anthropic';
  }
  if (PROVIDER !== 'openai' && openaiClient) {
    return 'openai';
  }
  return null;
}

function buildStoryboardPrompt(concept) {
  return `You are an expert educational animator.
Create a short, 3-scene animated storyboard to explain the concept "${concept}".

Respond ONLY in valid JSON format:
{
  "summary": "A brief overall description of the animation.",
  "storyboard": [
    {
      "scene": 1,
      "visuals": "Describe the animation visually (e.g., A bright yellow sun pops onto the screen...).",
      "narration": "The voiceover text.",
      "duration": 5
    }
  ]
}

Rules:
* Exactly 3 scenes
* Duration in seconds (integer between 3 and 7)
* Use vivid, descriptive language for visuals
* Keep narration simple and concise
* No extra text outside the JSON
`;
}

function buildPrompt(concept) {
  return `You are an expert tutor helping students learn quickly.

Explain the concept "${concept}" with the following output:
1. A one-line simple definition
2. A real-world scenario that demonstrates it
3. Two additional short real-world examples
4. A set of relevant keywords

Respond ONLY in valid JSON format:
{
  "oneLiner": "A single sentence definition - maximum 15 words",
  "scenario": "A concrete real-world example - maximum 50 words",
  "exampleScenarios": [
    "A second short real-world example - maximum 30 words",
    "A third short real-world example - maximum 30 words"
  ],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Rules:
* Keep the one-liner simple and direct
* Make every scenario vivid, concrete, and easy to picture
* Keep additional examples short and distinct from the main scenario
* Provide 4 to 6 relevant keyword terms
* Use plain, everyday language
* No markdown or extra formatting
* No extra text outside the JSON
`;
}

async function generateAnthropicResponse(prompt) {
  if (!anthropicClient) {
    throw new Error('Anthropic client not initialized. Check AI_PROVIDER and ANTHROPIC_API_KEY.');
  }

  const response = await anthropicClient.messages.create({
    model: ANTHROPIC_MODEL,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens_to_sample: 400,
    temperature: 0.2,
  });

  return (
    response?.completion ||
    response?.output?.[0]?.content?.[0]?.text ||
    response?.output?.[0]?.content ||
    response?.text ||
    ''
  );
}

async function generateOpenAIResponse(prompt) {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Check AI_PROVIDER and OPENAI_API_KEY.');
  }

  const response = await openaiClient.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 400,
    temperature: 0.2,
  });

  return response?.choices?.[0]?.message?.content || '';
}

async function generateGeminiResponse(prompt) {
  if (!geminiModel) {
    throw new Error('Gemini model not initialized. Check AI_PROVIDER and GEMINI_API_KEY.');
  }

  try {
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json|```/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      return JSON.stringify(parsed);
    } catch (error) {
      const fallback = {
        oneLiner: cleaned.split('\n')[0] || 'Explanation not available.',
        scenario: cleaned.split('\n').slice(1).join(' ') || 'Scenario not available.',
      };
      return JSON.stringify(fallback);
    }
  } catch (error) {
    if (isGeminiQuotaError(error)) {
      const fallbackProvider = getFallbackProvider();
      if (fallbackProvider === 'openai') {
        console.warn('Gemini quota exceeded, falling back to OpenAI.');
        return await generateOpenAIResponse(prompt);
      }
      if (fallbackProvider === 'anthropic') {
        console.warn('Gemini quota exceeded, falling back to Anthropic.');
        return await generateAnthropicResponse(prompt);
      }
    }
    throw error;
  }
}

async function generateGenericResponse(prompt) {
  if (PROVIDER === 'openai') {
    try {
      return await generateOpenAIResponse(prompt);
    } catch (error) {
      console.warn('OpenAI generic response failed, attempting fallback:', error.message);
      if (anthropicClient) {
        return await generateAnthropicResponse(prompt);
      }
      if (geminiModel) {
        return await generateGeminiResponse(prompt);
      }
      throw error;
    }
  }

  if (PROVIDER === 'anthropic') {
    try {
      return await generateAnthropicResponse(prompt);
    } catch (error) {
      console.warn('Anthropic generic response failed, attempting fallback:', error.message);
      if (openaiClient) {
        return await generateOpenAIResponse(prompt);
      }
      if (geminiModel) {
        return await generateGeminiResponse(prompt);
      }
      throw error;
    }
  }

  if (PROVIDER === 'gemini') {
    try {
      return await generateGeminiResponse(prompt);
    } catch (error) {
      console.warn('Gemini generic response failed, attempting fallback:', error.message);
      if (openaiClient) {
        return await generateOpenAIResponse(prompt);
      }
      if (anthropicClient) {
        return await generateAnthropicResponse(prompt);
      }
      throw error;
    }
  }

  // Fallback default order.
  if (openaiClient) {
    return await generateOpenAIResponse(prompt);
  }
  if (anthropicClient) {
    return await generateAnthropicResponse(prompt);
  }
  if (geminiModel) {
    return await generateGeminiResponse(prompt);
  }
  throw new Error('No AI provider available for generic response.');
}

function buildPdfQuestionPrompt(question, pdfText) {
  const context = pdfText.length > 6000 ? `${pdfText.slice(0, 6000)}\n\n...document truncated...` : pdfText;
  return `You are an expert learning assistant. Use the document text below to answer the question accurately and clearly.

Document text:
${context}

Question: ${question}

Answer with a few short, plain-language bullet points. Do not return JSON, code blocks, markdown, or any additional formatting.

Answer:
`;
}

function extractJsonString(text) {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex >= 0 && endIndex > startIndex) {
    return text.slice(startIndex, endIndex + 1);
  }
  return null;
}

function formatPdfAnswerObject(parsed) {
  const lines = [];

  if (typeof parsed.oneLiner === 'string' && parsed.oneLiner.trim()) {
    lines.push(`• ${parsed.oneLiner.trim()}`);
  }

  if (typeof parsed.scenario === 'string' && parsed.scenario.trim()) {
    lines.push(`• ${parsed.scenario.trim()}`);
  }

  if (Array.isArray(parsed.exampleScenarios)) {
    parsed.exampleScenarios
      .filter((item) => typeof item === 'string' && item.trim())
      .forEach((item) => lines.push(`• ${item.trim()}`));
  }

  if (Array.isArray(parsed.keywords)) {
    const keywords = parsed.keywords.filter((item) => typeof item === 'string' && item.trim());
    if (keywords.length) {
      lines.push(`• Keywords: ${keywords.join(', ')}`);
    }
  }

  if (typeof parsed.answer === 'string' && parsed.answer.trim()) {
    lines.push(`• ${parsed.answer.trim()}`);
  }

  if (lines.length) {
    return lines.join('\n');
  }

  return null;
}

function parseJsonLikeFields(text) {
  const matches = Array.from(text.matchAll(/"?(oneLiner|scenario|answer|exampleScenarios|keywords)"?\s*[:=]\s*("[^"]*"|\[[^\]]*\]|[^,\n]+)/gi));
  const lines = [];
  for (const match of matches) {
    const value = match[2]?.trim();
    if (!value) continue;
    const cleanValue = value.replace(/^"|"$/g, '').replace(/\[|\]|\{/g, '').trim();
    if (cleanValue) {
      lines.push(`• ${cleanValue}`);
    }
  }
  return lines.length ? lines.join('\n') : null;
}

function normalizePdfAnswer(rawResponse) {
  const rawText = String(rawResponse || '');
  const cleaned = rawText.replace(/```json|```/g, '').trim();

  const jsonString = extractJsonString(cleaned);
  if (jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = formatPdfAnswerObject(parsed);
      if (formatted) {
        return formatted;
      }
    } catch (err) {
      const parsedLines = parseJsonLikeFields(cleaned);
      if (parsedLines) {
        return parsedLines;
      }
    }
  }

  const fieldLines = parseJsonLikeFields(cleaned);
  if (fieldLines) {
    return fieldLines;
  }

  const stripped = cleaned.replace(/^Answer\s*[:\-]?\s*/i, '').trim();
  return stripped || 'I could not answer this question right now.';
}

export async function generatePdfAnswer(question, pdfText) {
  const prompt = buildPdfQuestionPrompt(question, pdfText);
  const rawResponse = await generateGenericResponse(prompt);
  return normalizePdfAnswer(rawResponse);
}

export async function generateConceptResponse(concept) {
  const prompt = buildPrompt(concept);

  if (PROVIDER === 'openai') {
    try {
      return String((await generateOpenAIResponse(prompt)) || '').trim();
    } catch (error) {
      console.warn('OpenAI error, attempting fallback:', error.message);
      if (anthropicClient) {
        try {
          return String((await generateAnthropicResponse(prompt)) || '').trim();
        } catch (anthropicErr) {
          console.warn('Anthropic fallback also failed:', anthropicErr.message);
          throw anthropicErr;
        }
      }
      throw error;
    }
  }

  if (PROVIDER === 'gemini') {
    try {
      return String((await generateGeminiResponse(prompt)) || '').trim();
    } catch (error) {
      console.warn('Gemini error, attempting fallback:', error.message);
      if (openaiClient) {
        try {
          return String((await generateOpenAIResponse(prompt)) || '').trim();
        } catch (openaiErr) {
          console.warn('OpenAI fallback failed:', openaiErr.message);
          throw openaiErr;
        }
      }
      if (anthropicClient) {
        try {
          return String((await generateAnthropicResponse(prompt)) || '').trim();
        } catch (anthropicErr) {
          console.warn('Anthropic fallback failed:', anthropicErr.message);
          throw anthropicErr;
        }
      }
      throw error;
    }
  }

  // Default to Anthropic with fallback
  try {
    return String((await generateAnthropicResponse(prompt)) || '').trim();
  } catch (error) {
    console.warn('Anthropic error, attempting fallback:', error.message);
    if (openaiClient) {
      try {
        return String((await generateOpenAIResponse(prompt)) || '').trim();
      } catch (openaiErr) {
        console.warn('OpenAI fallback failed:', openaiErr.message);
        throw openaiErr;
      }
    }
    console.warn('All APIs exhausted:', error.message || error);
    throw error;
  }
}

function buildRealVideoPrompt(concept) {
  return `Create a realistic, live-action style short video script for the concept "${concept}". Use real-world visuals, clear scenes, and simple narration.

Describe the scene as if it is filmed in a natural environment with everyday objects, people, and locations. Avoid cartoon or abstract imagery. Keep the video short and easy to understand.

Example structure:
- First scene: introduce the concept with a real-world image.
- Second scene: show the concept in action with a short live example.
- Third scene: conclude with the main takeaway and next step.

Do not return JSON. Just use this prompt for the video generation model.`;
}

export async function generateVideoResponse(concept) {
  const prompt = buildStoryboardPrompt(concept);
  let rawText = '';

  if (PROVIDER === 'gemini') {
    try {
      rawText = await generateGeminiResponse(prompt);
    } catch (error) {
      console.warn('Gemini error in video generation, attempting fallback:', error.message);
      if (openaiClient) {
        try {
          rawText = await generateOpenAIResponse(prompt);
        } catch (openaiErr) {
          console.warn('OpenAI fallback failed:', openaiErr.message);
          throw openaiErr;
        }
      } else if (anthropicClient) {
        try {
          rawText = await generateAnthropicResponse(prompt);
        } catch (anthropicErr) {
          console.warn('Anthropic fallback failed:', anthropicErr.message);
          throw anthropicErr;
        }
      } else {
        throw error;
      }
    }
  } else if (PROVIDER === 'openai') {
    try {
      rawText = await generateOpenAIResponse(prompt);
    } catch (error) {
      console.warn('OpenAI error in video generation, attempting fallback:', error.message);
      if (anthropicClient) {
        try {
          rawText = await generateAnthropicResponse(prompt);
        } catch (anthropicErr) {
          console.warn('Anthropic fallback failed:', anthropicErr.message);
          throw anthropicErr;
        }
      } else {
        throw error;
      }
    }
  } else {
    try {
      rawText = await generateAnthropicResponse(prompt);
    } catch (error) {
      console.warn('Anthropic error in video generation, attempting fallback:', error.message);
      if (openaiClient) {
        try {
          rawText = await generateOpenAIResponse(prompt);
        } catch (openaiErr) {
          console.warn('OpenAI fallback failed:', openaiErr.message);
          throw openaiErr;
        }
      } else {
        throw error;
      }
    }
  }

  let parsed;
  try {
    const cleanedText = typeof rawText === 'string' ? rawText.replace(/```json|```/g, '').trim() : '';
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in model response.');
    }
    parsed = JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.warn('JSON parsing failed for video output:', error.message, 'raw:', rawText);
    throw new Error('Unable to parse video storyboard from model response.');
  }

  if (!parsed.storyboard || !Array.isArray(parsed.storyboard)) {
    console.warn('Invalid storyboard structure from model response.');
    throw new Error('Invalid storyboard structure received from model.');
  }

  const storyboardWithImages = parsed.storyboard.map(slide => ({
    ...slide,
    imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(slide.visuals + ' minimalistic illustration')}?width=800&height=450&nologo=true`
  }));

  return {
    type: 'storyboard',
    storyboard: storyboardWithImages,
    summary: parsed.summary || `An animated storyboard explaining ${concept}.`
  };
}
