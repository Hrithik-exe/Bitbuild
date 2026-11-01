// API Request Dispatcher for BitBuild Local Development Server
import {
  registerUser,
  loginUser,
  getUserFromSession,
  logoutUser,
  getUserProgress,
  saveUserProgress
} from './db.js';

function getSessionToken(req) {
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = req.headers['cookie'] || '';
  const match = cookies.match(/bitbuild_token=([^;]+)/);
  return match ? match[1] : null;
}

export async function handleApiRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method.toUpperCase();

  // CORS & headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Parse JSON Body
  let body = {};
  if (method === 'POST') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf8');
      if (raw) body = JSON.parse(raw);
    } catch (_e) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
      return;
    }
  }

  try {
    // 1. Auth Register
    if (pathname === '/api/auth/register' && method === 'POST') {
      const { username, email, password } = body;
      const { user, token } = registerUser(username, email, password);
      res.setHeader('Set-Cookie', `bitbuild_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
      res.statusCode = 201;
      res.end(JSON.stringify({ user, token }));
      return;
    }

    // 2. Auth Login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const { usernameOrEmail, password } = body;
      const { user, token } = loginUser(usernameOrEmail, password);
      res.setHeader('Set-Cookie', `bitbuild_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
      res.statusCode = 200;
      res.end(JSON.stringify({ user, token }));
      return;
    }

    // 3. Auth Logout
    if (pathname === '/api/auth/logout' && method === 'POST') {
      const token = getSessionToken(req);
      logoutUser(token);
      res.setHeader('Set-Cookie', 'bitbuild_token=; Path=/; HttpOnly; Max-Age=0');
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // 4. Auth Current User (/api/auth/me)
    if (pathname === '/api/auth/me' && method === 'GET') {
      const token = getSessionToken(req);
      const user = getUserFromSession(token);
      if (!user) {
        res.statusCode = 200;
        res.end(JSON.stringify({ user: null }));
        return;
      }
      res.statusCode = 200;
      res.end(JSON.stringify({ user }));
      return;
    }

    // 5. User Progress (GET & POST)
    if (pathname === '/api/progress') {
      const token = getSessionToken(req);
      const user = getUserFromSession(token);
      if (!user) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Authentication required for persistent cloud/local progress' }));
        return;
      }

      if (method === 'GET') {
        const progress = getUserProgress(user.id) || {
          currentXp: 0,
          completedLessonIds: [],
          completedPieceIds: [],
          currentLessonId: 'move',
          codeDrafts: {}
        };
        res.statusCode = 200;
        res.end(JSON.stringify({ progress }));
        return;
      }

      if (method === 'POST') {
        const progress = saveUserProgress(user.id, body);
        res.statusCode = 200;
        res.end(JSON.stringify({ progress }));
        return;
      }
    }

    // 6. AI Diagnosis Endpoint (/api/ai/diagnose)
    if (pathname === '/api/ai/diagnose' && method === 'POST') {
      const { code, error, language, lessonTitle, lessonNote } = body;
      const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

      if (apiKey && process.env.GEMINI_API_KEY) {
        // Genuine Gemini API integration
        try {
          const prompt = `You are BitBuild's AI Game Engine Coding Mentor. A student wrote the following ${language} code for the game simulation lesson "${lessonTitle}".
Lesson Context: ${JSON.stringify(lessonNote?.body || '')}
Student Code:
\`\`\`${language}
${code}
\`\`\`
Runtime / Compiler Error: "${error || 'None explicitly thrown'}"

Analyze the code. Return ONLY a valid JSON object with the following schema:
{
  "issue": "Concise summary of the bug (e.g. Frame-Rate Coupling Bug, Syntax Error, Unbounded Position)",
  "explanation": "Clear, friendly explanation of why this happens in a game loop physics context",
  "recommendation": "Step-by-step guidance on how to fix it",
  "suggestedCode": "The fully corrected starter code for this lesson"
}`;

          const geminiResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json' }
              })
            }
          );

          if (geminiResp.ok) {
            const data = await geminiResp.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              res.statusCode = 200;
              res.end(JSON.stringify({
                ...parsed,
                isAiGenerated: true,
                mode: 'AI-Powered (Gemini 1.5 Flash API)'
              }));
              return;
            }
          }
        } catch (apiErr) {
          console.warn('[AI Service] External API call failed, using heuristic fallback:', apiErr.message);
        }
      }

      // Transparent Heuristic Fallback (No API key or external service unreachable)
      let diag = {
        issue: 'Code Check & Performance Optimization',
        explanation: 'Your code structure compiles. Ensure your collision bounding checks and velocity increments account for delta time.',
        recommendation: 'Verify that state coordinates stay within world boundaries using Math.max and Math.min.',
        suggestedCode: code
      };

      if (error) {
        diag = {
          issue: 'Syntax or Runtime Exception Detected',
          explanation: `The execution engine encountered an error: "${error}". This typically indicates a missing closing brace, an undefined variable, or an incorrect method call.`,
          recommendation: 'Check the line number indicated in red in your editor and verify variable names against the lesson API.',
          suggestedCode: code
        };
      } else if (!code.includes('dt')) {
        diag = {
          issue: 'Frame-Rate Coupling Bug',
          explanation: 'Your position or velocity updates do not multiply by deltaTime (dt). On a 120Hz/144Hz screen, the player will move twice as fast as on a 60Hz monitor!',
          recommendation: 'Multiply velocity and position changes by dt: e.g. state.x += speed * dt;',
          suggestedCode: code.replace(/(\w+\s*\+=\s*[^;\n]+)/g, '$1 * dt')
        };
      }

      res.statusCode = 200;
      res.end(JSON.stringify({
        ...diag,
        isAiGenerated: false,
        mode: 'Heuristic Fallback (No API Key Configured in Environment)'
      }));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: `Route not found: ${method} ${pathname}` }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
  }
}
