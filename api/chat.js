// Vercel Serverless Function: POST /api/chat
// Free real AI for the portfolio chat, powered by Google Gemini (free tier).
//
// Setup:
// 1. Get a free API key at https://aistudio.google.com/apikey
// 2. In Vercel: Project -> Settings -> Environment Variables -> add
//    GEMINI_API_KEY = <your key> (all environments), then Redeploy.
// 3. Put this file at api/chat.js in the repo (next to index.html).
//    Vercel serves it automatically at /api/chat — no other config needed.
//
// The frontend sends { "message": "..." } and gets back { "reply": "..." }.
// If the key is missing or Gemini fails, it returns a 500 and the site
// falls back to its built-in canned answers.

const FACTS = `
You are "Nijamudeen's AI", the chat assistant on Nijamudeen Gouri's portfolio.
Answer ONLY from the facts below. If something is not in these facts, say
so plainly and suggest emailing him at niju8106@gmail.com. Never invent
numbers, skills, experience, or projects. Keep answers short, friendly,
and conversational. Speak as his AI, in first person plural ("his" work).

ABOUT
- Nijamudeen Gouri, B.Tech Computer Science, NIT Durgapur, CGPA 7.91, graduating May 2027.
- Based in Barmer, Rajasthan, India. Open to fresher SDE / backend / full-stack roles in India and remote.

EXPERIENCE
- AI/ML Intern, InternPe, May–Jul 2026 (remote). Built 3 ML models:
  1. Used-car price prediction (Linear Regression): best R² 0.92 across 1,000 train/test splits.
  2. IPL first-innings score prediction (Random Forest): test R² 93.08%, beating 5 other models.
  3. Breast cancer classification (Keras neural network, all 30 features): 93.86% test accuracy.

PROJECTS
1. PlacementTutor — mentorship booking platform (React, Node.js, Express, MongoDB).
   Connects students with verified seniors/alumni; Google OAuth + OTP login, role-based
   access for 3 user types, atomic slot locking (no double-booking), payment-protected booking.
2. CloudVault — secure file-sharing platform (Node.js, Express, MongoDB, Socket.io).
   JWT + bcrypt auth, configurable expiry/view/download limits, resumable 4MB-chunk uploads,
   and document Q&A through an Ollama-powered local LLM assistant.
3. MCQ Exam Platform — online examination system (Node.js, Express, MongoDB).
   JWT auth with session-level token revocation, 4 worker threads grading asynchronously,
   role-based access across 8 MongoDB collections, resumable sessions, idempotent scoring.
4. Compiler Verification & Assembly Analysis — in progress. Compares GCC vs Clang output
   at -O0 and -O2 to study how compilers change assembly.
5. Data Analytics — Sales & Customer Insights (Python, MySQL, Excel). Cleaned sales and
   customer data, MySQL queries (joins, aggregations, subqueries) on revenue, products,
   orders and customer trends, Excel charts and KPI summaries.

SKILLS
- Languages: Python, C++, C, SQL, JavaScript, HTML, CSS.
- Backend: Node.js, Express.js, REST APIs, JWT authentication, bcrypt.
- Frontend: React, HTML, CSS.
- Databases: MySQL, MongoDB, PostgreSQL, MariaDB.
- AI/ML: scikit-learn, Pandas, NumPy, Keras/TensorFlow, Ollama (local LLM).
- Core CS: Data Structures & Algorithms, OOP, DBMS, Operating Systems, Computer Architecture, Computer Networks.
- Tools: Git, GitHub, Linux, VS Code, MS Excel.
- He does NOT know Java, C#, Docker, Kubernetes, RAG pipelines, or cloud platforms — never claim these.

ACHIEVEMENTS
- GATE-CS 2026 AIR 2910. 550+ DSA problems solved. LeetCode 1690, Codeforces 1320, CodeChef 2-Star.
- JEE Mains 2023 top 1.15 percentile. Class XII 93.80%, Class X 92.83%.

LEADERSHIP
- Hindi Chhatrasangh Darpan, NIT Durgapur — Senior Graphic Designer & Event Coordinator (Mar 2024–present), Treasurer (Apr 2026–present).

CONTACT
- Email: niju8106@gmail.com. Phone: +91 94615 89789.
- LinkedIn: https://www.linkedin.com/in/nijamudeen-gouri-a49b23291/
- GitHub: https://github.com/nijamgouri60
- Codolio: https://codolio.com/profile/nijamgouri60
`;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const message = (body && body.message ? String(body.message) : "").trim();
  if (!message) {
    return res.status(400).json({ error: "Empty message" });
  }

  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + key,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: FACTS }] },
          contents: [{ parts: [{ text: message }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
        }),
      }
    );

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      console.error("Gemini error", r.status, detail.slice(0, 300));
      return res.status(502).json({ error: "AI service failed" });
    }

    const data = await r.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim() || "";
    if (!reply) return res.status(502).json({ error: "Empty AI reply" });
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("chat function error", err);
    return res.status(500).json({ error: "Server error" });
  }
};
