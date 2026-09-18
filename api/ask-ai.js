const ALLOWED_ORIGINS = new Set([
  "https://glojournal-cmyk.github.io",
]);

const hits = new Map();
const cache = new Map();

function cors(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) || /^http:\/\/localhost(?::\d+)?$/.test(origin || "");
  return {
    allowed,
    headers: {
      "Access-Control-Allow-Origin": allowed ? origin : "https://glojournal-cmyk.github.io",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
      "Cache-Control": "no-store",
    },
  };
}

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
}

function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const max = 24;
  const recent = (hits.get(ip) || []).filter((time) => now - time < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > max;
}

function clean(value, max = 3000) {
  return String(value ?? "").slice(0, max).trim();
}

function getModelChain() {
  const preferred = clean(process.env.GEMINI_MODEL, 100) || "gemini-3.1-flash-lite";
  return [...new Set([
    preferred,
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
  ])];
}

function actionInstruction(action, correct) {
  const map = {
    why_correct: "Explain why the student's answer is correct.",
    where_wrong: "Explain exactly where the student's answer went wrong, then state the governing rule.",
    explain_rule: "Explain the underlying rule clearly, then apply it to this question.",
    simpler: "Explain the same idea in simpler language without becoming childish.",
    similar_example: "Give one closely related example after a short explanation. Put the answer after a clear ANSWER heading.",
    chinese: "Explain in concise Traditional Chinese, while keeping official subject terminology in English, Latin or French where useful.",
  };
  return map[action] || (correct ? map.why_correct : map.where_wrong);
}

function buildPrompt(body) {
  const action = clean(body.action, 40);
  const correct = !!body.correct;
  const subject = clean(body.subject, 40) || "school subject";
  const year = clean(body.year, 10) || "9";
  const topic = clean(body.topic, 160);
  const question = clean(body.question, 2000);
  const stimulus = clean(body.stimulus, 1800);
  const studentAnswer = clean(body.studentAnswer, 1200);
  const officialAnswer = clean(body.officialAnswer, 1600);
  const staticExplanation = clean(body.staticExplanation, 2200);
  const errorKind = clean(body.errorKind, 80);
  const format = clean(body.format, 80);

  return [
    "You are the optional explanation layer inside a Year 9 revision app for a 13-year-old student.",
    "The app's official answer and approved explanation are the marking source. Do not silently change or override them.",
    "If the official answer appears genuinely inconsistent with the question, say 'This may need checking' and explain the concern without re-marking the student.",
    "Be concise, accurate and educational. Usually 90-160 words.",
    "Use rule → application → one example when helpful.",
    "For Latin and French, explain grammar precisely. For science, distinguish terminology, concept, calculation and units.",
    "Do not discuss XP, Mastery or rewards. Do not award marks.",
    "",
    `Subject: ${subject}`,
    `School year: Year ${year}`,
    topic ? `Topic: ${topic}` : "",
    format ? `Question format: ${format}` : "",
    `Question: ${question}`,
    stimulus ? `Stimulus/context: ${stimulus}` : "",
    `Student answer: ${studentAnswer || "(blank)"}`,
    `Official answer: ${officialAnswer}`,
    staticExplanation ? `Approved explanation: ${staticExplanation}` : "",
    errorKind ? `Recorded error type: ${errorKind}` : "",
    `Student was marked: ${correct ? "correct" : "incorrect"}`,
    "",
    `Task: ${actionInstruction(action, correct)}`,
    "Return plain text only.",
  ].filter(Boolean).join("\n");
}

function extractText(data) {
  return (data?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.text || "")
    .join("\n")
    .trim();
}

function cacheKeyFor(prompt, models) {
  let h = 2166136261;
  const value = models.join(",") + "|" + prompt;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return String(h >>> 0);
}

function canFallback(status) {
  return status === 404 || status === 429 || status >= 500;
}

async function callGemini(model, prompt, {
  temperature = 0.2,
  maxOutputTokens = 900,
  thinkingLevel = "minimal",
} = {}) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens,
            thinkingConfig: { thinkingLevel },
          },
        }),
      }
    );

    const data = await response.json().catch(() => ({}));
    const finishReason = clean(data?.candidates?.[0]?.finishReason, 80) || "";
    return {
      ok: response.ok,
      status: response.status,
      data,
      text: response.ok ? extractText(data) : "",
      finishReason,
      code: clean(data?.error?.status || data?.error?.code, 80) || "unknown",
      message: clean(data?.error?.message, 500) || "",
    };
  } catch (error) {
    return {
      ok: false,
      status: 599,
      data: {},
      text: "",
      finishReason: "",
      code: "NETWORK_OR_RUNTIME_ERROR",
      message: clean(error?.message, 500) || "Gemini request could not be completed.",
    };
  }
}

async function callWithFallback(prompt, options = {}) {
  const models = getModelChain();
  const attempts = [];
  const baseMax = Number(options.maxOutputTokens) || 900;

  for (const model of models) {
    let result = await callGemini(model, prompt, options);
    attempts.push({
      model,
      status: result.status,
      code: result.code,
      finishReason: result.finishReason || undefined,
    });

    if (result.ok && result.text) {
      return { ok: true, modelUsed: model, text: result.text, attempts };
    }

    if (result.ok && !result.text && result.finishReason === "MAX_TOKENS") {
      result = await callGemini(model, prompt, {
        ...options,
        maxOutputTokens: Math.max(baseMax * 2, 1200),
        thinkingLevel: "minimal",
      });
      attempts.push({
        model,
        status: result.status,
        code: result.code,
        finishReason: result.finishReason || undefined,
        retry: "larger_output_budget",
      });

      if (result.ok && result.text) {
        return { ok: true, modelUsed: model, text: result.text, attempts };
      }
    }

    if (result.ok && !result.text) {
      const blocked = result.data?.promptFeedback?.blockReason || result.finishReason;
      if (blocked && blocked !== "MAX_TOKENS") {
        return {
          ok: false,
          modelUsed: model,
          status: result.status,
          code: clean(blocked, 80) || "EMPTY_RESPONSE",
          message: `Gemini could not answer this request (${blocked}).`,
          attempts,
        };
      }
      // Empty/MAX_TOKENS after retry: try the next free-tier model.
      continue;
    }

    if (!canFallback(result.status)) {
      return {
        ok: false,
        modelUsed: model,
        status: result.status,
        code: result.code,
        message: result.message,
        attempts,
      };
    }
  }

  const last = attempts.at(-1) || {};
  return {
    ok: false,
    modelUsed: last.model || models.at(-1),
    status: last.status || 503,
    code: last.code || last.finishReason || "UNAVAILABLE",
    message: "All available free-tier Gemini models are temporarily unavailable.",
    attempts,
  };
}

function publicError(result) {
  const status = result.status || 502;
  let error = "AI explanation is unavailable right now.";
  if (status === 400) error = "Gemini rejected the explanation request.";
  else if (status === 401 || status === 403) error = "Gemini rejected the API key or its permissions.";
  else if (status === 404) error = "The selected Gemini models are not available to this project.";
  else if (status === 429) error = "Gemini free-tier limit reached. Please try again later.";
  else if (status >= 500) error = "Gemini is temporarily busy. Please try again shortly.";
  return error;
}

export default async function handler(req, res) {
  const origin = String(req.headers.origin || "");
  const access = cors(origin);
  for (const [key, value] of Object.entries(access.headers)) res.setHeader(key, value);

  if (req.method === "OPTIONS") return res.status(204).end();

  const models = getModelChain();

  if (req.method === "GET") {
    const configured = !!process.env.GEMINI_API_KEY;
    const wantsTest = String(req.query?.test || "") === "1";

    if (!wantsTest) {
      return res.status(200).json({
        ok: true,
        provider: "google-gemini",
        configured,
        model: models[0],
        fallbackModels: models.slice(1),
      });
    }

    if (!configured) {
      return res.status(503).json({
        ok: false,
        provider: "google-gemini",
        configured: false,
        model: models[0],
        fallbackModels: models.slice(1),
        diagnostic: "missing_key",
      });
    }

    const test = await callWithFallback("Reply with exactly OK", {
      temperature: 0,
      maxOutputTokens: 128,
      thinkingLevel: "minimal",
    });

    if (test.ok) {
      return res.status(200).json({
        ok: true,
        provider: "google-gemini",
        configured: true,
        model: models[0],
        fallbackModels: models.slice(1),
        modelUsed: test.modelUsed,
        generation: test.text || "OK",
        attempts: test.attempts,
      });
    }

    return res.status(200).json({
      ok: false,
      provider: "google-gemini",
      configured: true,
      model: models[0],
      fallbackModels: models.slice(1),
      modelUsed: test.modelUsed,
      googleStatus: test.status,
      googleCode: test.code,
      message: clean(test.message, 500) || "Gemini request failed.",
      attempts: test.attempts,
    });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  if (!access.allowed) return res.status(403).json({ error: "Origin not allowed." });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: "Gemini is not configured yet." });

  const ip = clientIp(req);
  if (rateLimited(ip)) return res.status(429).json({ error: "Too many AI requests. Please try again later." });

  const body = req.body && typeof req.body === "object" ? req.body : {};
  if (!body.question || !body.officialAnswer) return res.status(400).json({ error: "Question context is incomplete." });

  const prompt = buildPrompt(body);
  if (prompt.length > 10000) return res.status(413).json({ error: "Question context is too large." });

  const cacheKey = cacheKeyFor(prompt, models);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < 24 * 60 * 60 * 1000) {
    return res.status(200).json({
      explanation: cached.text,
      cached: true,
      modelUsed: cached.modelUsed,
    });
  }

  const result = await callWithFallback(prompt);

  if (!result.ok) {
    console.error("Gemini API failure", result.status, result.code, result.attempts);
    return res.status(502).json({
      error: publicError(result),
      diagnostic: result.code,
      googleStatus: result.status,
      detail: clean(result.message, 400),
      triedModels: result.attempts.map((attempt) => attempt.model),
    });
  }

  cache.set(cacheKey, { text: result.text, modelUsed: result.modelUsed, at: Date.now() });
  return res.status(200).json({
    explanation: result.text,
    modelUsed: result.modelUsed,
  });
}
