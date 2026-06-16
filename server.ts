/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environmental variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini API Client wrapper
let aiClient: any = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('MY_GEMINI_API_KEY')) {
    return null;
  }
  
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Health status endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// AI Socratic Math Coach endpoint
app.post('/api/gemini/tutor', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { 
      questionText, 
      correctAnswer, 
      studentAnswer, 
      hint, 
      commonMistake, 
      thinkingSkill, 
      topic,
      history = [], // array of { role: 'user' | 'model', text: string }
      chosenLanguage = 'vi' // 'en' or 'vi'
    } = req.body;

    const ai = getGeminiClient();

    // Fallback: If no Gemini API key, generate Socratic response locally based on language
    if (!ai) {
      console.warn("GEMINI_API_KEY is not defined. Initiating offline Smart AI Coach logic.");
      
      let mockReply = "";
      if (chosenLanguage === 'en') {
        if (history.length === 0) {
          mockReply = `Hello! I see you entered **"${studentAnswer}"** for the question on **${topic}**. 
\nLet me give you a clue: This question tests your **${thinkingSkill}** skills. Remember: *${hint}*. 
\nCould it be that you made this common error: *${commonMistake}*? Try checking your calculation steps again!`;
        } else {
          mockReply = `Keep going! I'm here to guide your mathematical thinking. 
\n*Hint:* Analyze the decimal place movement or check your fractions common denominator. I know you can self-correct and solve it! Enter a new calculation result to try again.`;
        }
      } else {
        if (history.length === 0) {
          mockReply = `Chào em! Thầy cô thấy em trả lời là **"${studentAnswer}"** cho câu hỏi về **${topic}**. 
\nGợi ý một chút nhé: Câu này đòi hỏi kỹ năng **${thinkingSkill}**. Em hãy nhớ lại: *${hint}*. 
\nCó phải em đang gặp vướng mắc ở lỗi này không: *${commonMistake}*? Em hãy thử kiểm tra lại phép tính của mình nhé!`;
        } else {
          mockReply = `Cố gắng lên em! Thầy cô ở đây để giúp em tư duy độc lập. Hãy đọc kỹ phần giải thích quy tắc học tập: 
\n*Gợi ý:* Hãy phân tích kỹ tử số và mẫu số hoặc xem dấu phẩy thập phân dịch chuyển mấy vị trí. Thầy cô tin em tự tìm ra lỗi sai và giải lại được! Em hãy thử nhập đáp án mới sau khi tính lại xem sao?`;
        }
      }

      res.json({
        text: mockReply,
        isOfflineMode: true,
        message: "Socratic Feedback crafted locally by Edge Intelligence."
      });
      return;
    }

    // Build the Socratic system prompts based on chosen language
    const systemPrompt = chosenLanguage === 'en' ? 
      `You are an veteran EdTech AI Math Coach for Grade 6 students studying Cambridge Primary / Vinschool Mathematics.
Your pedagogical philosophy is Socrates' method:
1. NEVER reveal the final correct answer under any circumstances.
2. ALWAYS respond warmly and encouragingly in English.
3. If the student made a mistake, analyze their work (student input: "${studentAnswer}", expected: "${correctAnswer}", common mistake: "${commonMistake}"). Do not criticize; ask leading, scaffolded, bite-sized questions in English to guide them.
4. Promote "${thinkingSkill}" thinking skills (Thinking and Working Mathematically - TWM).
5. Give clues related to the hint: "${hint}".
6. Make them verify their calculations. Be concise, friendly, and highly engaging for 11-year-olds. Do not write extremely long explanations. Keep comments down to 3-4 simple sentences maximum per turn.` 
      : 
      `You are an veteran EdTech AI Math Coach for Grade 6 students studying Cambridge Primary / Vinschool Mathematics.
Your pedagogical philosophy is Socrates' method:
1. NEVER reveal the final correct answer under any circumstances.
2. ALWAYS respond warmly and encouragingly in Vietnamese.
3. If the student made a mistake, analyze their work (student input: "${studentAnswer}", expected: "${correctAnswer}", common mistake: "${commonMistake}"). Do not say they are bad; ask leading, scaffolded, bite-sized questions in Vietnamese to guide them.
4. Promote "${thinkingSkill}" thinking skills (Tư duy và Làm việc theo Toán học - TWM).
5. Give clues related to the hint: "${hint}".
6. Make them verify their calculations. Be concise, cozy, and highly engaging for 11-year-olds. Do not write extremely long explanations. Keep comments down to 3-4 simple sentences maximum per turn.`;

    // Map conversation logs to generative contents format
    const contents: any[] = [];
    
    // Add history
    for (const h of history) {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      });
    }

    // Add current question state as current user input
    const userPrompt = chosenLanguage === 'en' ? 
      `I am working on the question: "${questionText}". 
My answer is "${studentAnswer}", but the expected answer is "${correctAnswer}". 
The hint is: "${hint}".
The common mistake is: "${commonMistake}".
Ask me a leading question to activate my "${thinkingSkill}" thinking skill so I can calculate it again, without giving me the correct answer!` 
      : 
      `Em đang làm câu: "${questionText}". 
Đáp án đúng là "${correctAnswer}" nhưng em ghi đáp án là: "${studentAnswer}". 
Gợi ý cho câu này là: "${hint}". 
Hành vi lỗi thường gặp là: "${commonMistake}".
Hãy đặt cho em 1 câu hỏi gợi mở, giúp em kích hoạt kỹ năng "${thinkingSkill}" để em tự tính lại mà không cho em biết đáp án đúng!`;

    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    console.log(`Sending prompt to Gemini-3.5-flash in ${chosenLanguage.toUpperCase()}...`);
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    console.log("Response fetched from Gemini successfully.");
    res.json({
      text: response.text || (chosenLanguage === 'en' 
        ? "I'm thinking... Try verifying your calculations again!" 
        : "Thầy cô đang suy nghĩ một chút... Em hãy thử tính lại xem sao nhé!"),
      isOfflineMode: false
    });

  } catch (error: any) {
    console.error("Error inside Socratic AI Tutor Route:", error);
    res.status(500).json({
      error: "Could not request Socratic response",
      details: error.message
    });
  }
});

// Configure Vite middleware in development or static distribution in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log("Booting Vite in Middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets compiled inside dist/
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Math Explorer Stage 6 dynamic server running on http://localhost:${PORT}`);
  });
}

startServer();
