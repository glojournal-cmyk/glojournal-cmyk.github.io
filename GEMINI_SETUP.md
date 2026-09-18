# Scholar's Garden — Gemini inline explanations

The production app is hosted on GitHub Pages. Gemini is called only through the Vercel serverless function at /api/ask-ai so the API key is never exposed to the browser.

Required Vercel environment variable:

- GEMINI_API_KEY — Google AI Studio key (server-side only)
- GEMINI_MODEL — optional; defaults to gemini-3.5-flash

The browser sends only educational question context: subject, year, topic, question, submitted answer, official answer, approved explanation, format and error type. It does not send the student's display name, school, progress totals, wardrobe or reward state.

AI output is explanatory only and cannot change official marking, XP, review scheduling or Mastery.
