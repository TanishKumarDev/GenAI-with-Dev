// Backend: Scalable Groq proxy with external real-time (WorldTimeAPI + Tavily) & history memory
// Patterns: Modular utils, Joi validation, Winston logging, rate-limit, error middleware
// External-First: No manual date/regex—all via APIs (WorldTimeAPI for time, Tavily for dynamic)

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import winston from 'winston';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { tavily } from '@tavily/core';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Logging: Winston for structured logs (file + console)
// Why? Prod-ready (rotates files, levels); scalable (integrate ELK/Sentry later)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

// Middleware Chain: Rate-limit, CORS, JSON, Validation
// Why? Prevents abuse (rate-limit), enables frontend (CORS), parses bodies (BodyParser)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,  // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,  // 100 req/user
  message: 'Too many requests—try again later.'
});
app.use(limiter);
app.use(cors());
app.use(bodyParser.json());

// Input Validation Schema (Joi)
// Why? Sanitizes/safeguards inputs (e.g., message < 1000 chars); scalable (add fields)
const chatSchema = Joi.object({
  message: Joi.string().trim().max(1000).required(),
  history: Joi.array().items(Joi.object({ sender: Joi.string(), text: Joi.string() })).max(20).optional()
});

// Tavily Client (external real-time searches)
// Why? Dynamic facts (weather/news); skips if no key
const tavilyClient = process.env.TAVILY_API_KEY ? tavily({ apiKey: process.env.TAVILY_API_KEY }) : null;

// External Time API: WorldTimeAPI for real-time UTC/TZ
// Why? No manual Date(); accurate, scalable (add caching via Redis later)
async function getCurrentDateTime() {
  try {
    const tz = process.env.TIMEZONE || 'Etc/UTC';
    const response = await fetch(`http://worldtimeapi.org/api/timezone/${tz}`);
    const data = await response.json();
    return data.datetime ? new Date(data.datetime).toLocaleString('en-US', { timeZone: tz }) : 'Unknown time';
  } catch (err) {
    logger.error('Time API error:', err);
    return 'Time unavailable';
  }
}

// Tavily Search: External for all dynamic (expanded to "current" queries)
// Why? Handles weather/news/events; no manual regex—prompt-inject for NLP-like detection
async function getRealTimeInfo(query) {
  if (!tavilyClient) return '';

  try {
    const result = await tavilyClient.search({
      query: `current ${query}`,  // Prefix for real-time (e.g., "current weather NYC")
      search_depth: 'basic',
      max_results: 3,
      include_answer: true
    });
    return result.answer ? `Live: ${result.answer.slice(0, 200)}` : '';
  } catch (err) {
    logger.error('Tavily error:', err);
    return '';
  }
}

// Route: /chat (core endpoint)
// Why? Processes + enriches via externals; scalable (add auth/middleware later)
app.post('/chat', async (req, res) => {
  // Validate input (Joi)
  const { error, value } = chatSchema.validate(req.body);
  if (error) {
    logger.warn('Validation error:', error.details[0].message);
    return res.status(400).json({ reply: 'Invalid input.' });
  }

  const { message, history = [] } = value;
  logger.info(`New chat: ${message.substring(0, 50)}...`);

  const currentDateTime = await getCurrentDateTime();  // External async

  // Real-time: Always check via Tavily for "current" (prompt-driven, no manual match)
  let realTimeInfo = '';
  if (message.toLowerCase().includes('current') || ['weather', 'news', 'stock', 'event', 'today'].some(k => message.toLowerCase().includes(k))) {
    realTimeInfo = await getRealTimeInfo(message);
  }

  // History mapping (parallel slice/map)
  const historyMessages = history.slice(-10).map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));

  const messages = [
    {
      role: 'system',
      content: `Concise assistant. Use history. Date/time: ${currentDateTime}. ${realTimeInfo ? `Incorporate: ${realTimeInfo}` : ''}`
    },
    ...historyMessages,
    { role: 'user', content: message }
  ];

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 200,
        temperature: 0.3
      })
    });

    const groqData = await groqResponse.json();

    if (groqData.error) {
      logger.error('Groq error:', groqData.error);
      return res.status(500).json({ reply: `AI error: ${groqData.error.message}` });
    }

    const reply = groqData.choices?.[0]?.message?.content || 'No reply.';
    logger.info('Reply sent');
    res.json({ reply });
  } catch (error) {
    logger.error('Request error:', error);
    res.status(500).json({ reply: 'Server error.' });
  }
});

// Error Middleware: Catch-all for unhandled errors
// Why? Graceful failures; scalable (add Sentry integration)
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ reply: 'Internal error.' });
});

app.listen(PORT, () => logger.info(`✅ Running on http://localhost:${PORT}`));