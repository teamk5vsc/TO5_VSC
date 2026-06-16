/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environmental variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini API Client wrapper (fallback only)
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

// Dynamic Client Initializer
function createDynamicClient(apiKey: string | undefined) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key || key.trim() === '' || key.includes('MY_GEMINI_API_KEY')) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Model Fallback Retry Helper
async function generateContentWithFallback(
  ai: any,
  contents: any,
  systemPrompt: string,
  preferredModel: string | undefined,
  temperature: number = 0.7
) {
  const defaultModels = ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash'];
  
  const queue: string[] = [];
  if (preferredModel && preferredModel.trim() !== '') {
    queue.push(preferredModel.trim());
  }
  for (const m of defaultModels) {
    if (!queue.includes(m)) {
      queue.push(m);
    }
  }

  console.log(`[AI Fallback] Preferred Model: ${preferredModel}. Queue: ${JSON.stringify(queue)}`);

  let lastError: any = null;
  for (const model of queue) {
    try {
      console.log(`[AI Fallback] Trying model: ${model}`);
      const response = await ai.models.generateContent({
        model: model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: temperature,
        }
      });
      console.log(`[AI Fallback] Success with model: ${model}`);
      return response;
    } catch (err: any) {
      console.error(`[AI Fallback] Failed with model ${model}: ${err.message || err}`);
      lastError = err;
    }
  }

  throw lastError || new Error("All models in the fallback queue failed to generate content.");
}

// Health status endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Personalized Homework DOCX Export
app.get('/api/export/docx', (req: express.Request, res: express.Response) => {
  const { studentId = 'student_minh', lang = 'vi', apiKey = '' } = req.query;
  const fileName = `Vinschool_Homework_${studentId}_${Date.now()}.docx`;
  const exportDir = path.join(process.cwd(), 'assets', 'exports');
  const filePath = path.join(exportDir, fileName);

  // Ensure export directory exists
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const uvPath = `C:\\Users\\Hoang Trung Hieu\\.local\\bin\\uv.exe`;
  const command = `"${uvPath}" run generate_docx.py ${studentId} ${lang} "${filePath}"`;

  console.log(`[DOCX] Executing command: ${command}`);

  const apiKeyStr = (apiKey as string) || process.env.GEMINI_API_KEY || '';
  exec(command, { env: { ...process.env, GEMINI_API_KEY: apiKeyStr } }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[DOCX] Generation error: ${error.message}`);
      console.error(`stderr: ${stderr}`);
      res.status(500).json({ error: "Failed to generate DOCX document", details: error.message });
      return;
    }
    console.log(`[DOCX] stdout: ${stdout}`);
    res.download(filePath, (err) => {
      if (err) {
        console.error("[DOCX] Error sending file:", err);
      }
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn("[DOCX] Could not delete temporary file:", e);
      }
    });
  });
});

// Personalized Review Slides PPTX Export
app.get('/api/export/pptx', (req: express.Request, res: express.Response) => {
  const { studentId = 'student_minh', lang = 'vi', apiKey = '' } = req.query;
  const fileName = `Vinschool_Review_${studentId}_${Date.now()}.pptx`;
  const exportDir = path.join(process.cwd(), 'assets', 'exports');
  const filePath = path.join(exportDir, fileName);

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const uvPath = `C:\\Users\\Hoang Trung Hieu\\.local\\bin\\uv.exe`;
  const command = `"${uvPath}" run generate_pptx.py ${studentId} ${lang} "${filePath}"`;

  console.log(`[PPTX] Executing command: ${command}`);

  const apiKeyStr = (apiKey as string) || process.env.GEMINI_API_KEY || '';
  exec(command, { env: { ...process.env, GEMINI_API_KEY: apiKeyStr } }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[PPTX] Generation error: ${error.message}`);
      console.error(`stderr: ${stderr}`);
      res.status(500).json({ error: "Failed to generate PPTX document", details: error.message });
      return;
    }
    console.log(`[PPTX] stdout: ${stdout}`);
    res.download(filePath, (err) => {
      if (err) {
        console.error("[PPTX] Error sending file:", err);
      }
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn("[PPTX] Could not delete temporary file:", e);
      }
    });
  });
});

// AI Multi-Agent Reflection Proof Grader
app.post('/api/gemini/grade-reflection', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { studentId, lessonId, answers, lang = 'vi' } = req.body;
    const apiKeyHeader = req.headers['x-api-key'] as string | undefined;
    const modelHeader = req.headers['x-gemini-model'] as string | undefined;
    const ai = createDynamicClient(apiKeyHeader);

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({ error: "Answers list is required" });
      return;
    }

    // Fallback logic if Gemini is offline/disabled
    if (!ai) {
      console.warn("No API key provided or dynamic client failed. Initiating offline Smart AI Grader logic.");
      let totalLength = 0;
      let containsMathSymbols = false;
      const mathKeywords = ['denomin', 'decimal', 'place', 'value', 'fraction', 'mẫu số', 'tử số', 'quy đồng', 'phẩy', 'quay', 'đối xứng', 'tịnh tiến'];
      
      answers.forEach(a => {
        const text = (a.response || '').toLowerCase();
        totalLength += text.length;
        if (mathKeywords.some(kw => text.includes(kw)) || /[\d\/\+\-\*]/.test(text)) {
          containsMathSymbols = true;
        }
      });

      let grade = "Good";
      let feedback = "";
      if (totalLength < 10) {
        grade = "Needs Work";
        feedback = lang === 'en'
          ? "Your reflection is very brief. Please elaborate on your mathematical steps next time."
          : "Phần tự ngẫm của em khá ngắn. Lần tới em hãy giải thích chi tiết hơn các bước tư duy nhé.";
      } else if (containsMathSymbols && totalLength > 25) {
        grade = "Master";
        feedback = lang === 'en'
          ? "Excellent mathematical reasoning. You correctly justified your steps using key terminology."
          : "Lập luận toán học xuất sắc. Em đã giải thích các bước của mình rất rõ ràng bằng thuật ngữ chính xác.";
      } else {
        grade = "Good";
        feedback = lang === 'en'
          ? "Good effort in your reflection. Focus on explaining why your calculations make sense."
          : "Nội dung tự ngẫm tốt. Em nên tập trung giải thích rõ hơn lý do đằng sau các phép tính.";
      }

      res.json({ grade, feedback, isOfflineMode: true });
      return;
    }

    // Multi-Agent Gemini Prompt Workflow
    const systemPrompt = `
    You are a Senior Cambridge Math Educator grading student reflection logs for Grade 6 Vinschool.
    Evaluate the student's mathematical proof and reasoning.
    Provide a grade: 'Master' (Thành thạo), 'Good' (Khá), or 'Needs Work' (Cần hoàn thiện).
    Also write a warm, encouraging feedback sentence in ${lang === 'vi' ? 'Vietnamese' : 'English'} (max 2 sentences).
    Analyze these points:
    1. Did they understand the concept?
    2. Did they use proper terms like "place value", "denominator", "tịnh tiến", "đối xứng"?
    
    Format your response EXACTLY as a JSON object matching this schema:
    {
      "grade": "Master" | "Good" | "Needs Work",
      "feedback": "Your feedback text here"
    }
    Do not add any markdown blocks around it. Return raw JSON.
    `;

    const userPrompt = `
    Student ID: ${studentId}
    Lesson: ${lessonId}
    Reflection Logs:
    ${answers.map((a, i) => `Question ${i+1}: "${a.question}"\nResponse: "${a.response}"`).join('\n\n')}
    `;

    console.log(`Sending reflection log to Gemini with fallback grading...`);
    const contents = [{ role: 'user', parts: [{ text: userPrompt }] }];
    const response = await generateContentWithFallback(
      ai,
      contents,
      systemPrompt,
      modelHeader,
      0.2
    );

    const resultText = response.text || '';
    console.log(`Gemini response: ${resultText}`);
    
    try {
      const parsed = JSON.parse(resultText.trim());
      res.json(parsed);
    } catch (e) {
      res.json({
        grade: "Good",
        feedback: lang === 'en' 
          ? "Thank you for sharing your thoughts. Keep working hard!" 
          : "Cảm ơn em đã chia sẻ suy nghĩ. Hãy tiếp tục cố gắng nhé!"
      });
    }
  } catch (error: any) {
    console.error("Error in AI Grader route:", error);
    const isRateLimit = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
    const status = isRateLimit ? 429 : 500;
    res.status(status).json({ error: error.message || "Failed to grade reflection" });
  }
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

    const apiKeyHeader = req.headers['x-api-key'] as string | undefined;
    const modelHeader = req.headers['x-gemini-model'] as string | undefined;
    const ai = createDynamicClient(apiKeyHeader);

    // Fallback: If no Gemini API key, generate Socratic response locally based on language
    if (!ai) {
      console.warn("No API key provided or dynamic client failed. Initiating offline Smart AI Coach logic.");
      
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

    console.log(`Sending prompt to Gemini with fallback...`);
    const response = await generateContentWithFallback(
      ai,
      contents,
      systemPrompt,
      modelHeader,
      0.7
    );

    console.log("Response fetched from Gemini successfully.");
    res.json({
      text: response.text || (chosenLanguage === 'en' 
        ? "I'm thinking... Try verifying your calculations again!" 
        : "Thầy cô đang suy nghĩ một chút... Em hãy thử tính lại xem sao nhé!"),
      isOfflineMode: false
    });

  } catch (error: any) {
    console.error("Error inside Socratic AI Tutor Route:", error);
    const isRateLimit = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
    const status = isRateLimit ? 429 : 500;
    res.status(status).json({
      error: error.message || "Could not request Socratic response"
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
