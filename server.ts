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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  const fileName = `MathExplorer_Homework_${studentId}_${Date.now()}.docx`;
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
  const fileName = `MathExplorer_Review_${studentId}_${Date.now()}.pptx`;
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
    You are a Senior Cambridge Math Educator grading student reflection logs for Grade 6.
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

// AI Knowledge Base Chat Route
app.post('/api/gemini/knowledge-chat', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { 
      query, 
      context, // Compiled text content from all uploaded docs
      history = [], // array of { role: 'user' | 'model', text: string }
      lang = 'vi'
    } = req.body;

    const apiKeyHeader = req.headers['x-api-key'] as string | undefined;
    const modelHeader = req.headers['x-gemini-model'] as string | undefined;
    const ai = createDynamicClient(apiKeyHeader);

    // Fallback: If no Gemini API key, run local offline search
    if (!ai) {
      console.warn("No API key provided or dynamic client failed. Initiating offline Knowledge Base search.");
      if (!context || context.trim() === '' || context === 'No documents uploaded yet.') {
        const fallbackMsg = lang === 'en'
          ? "No document context is available. Please upload documents first."
          : "Không có dữ liệu tài liệu. Vui lòng tải lên tài liệu trước.";
        res.json({ text: fallbackMsg, isOfflineMode: true });
        return;
      }

      const queryWords = query.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
        .split(/\s+/)
        .filter((w: string) => w.length > 2); // only keep words > 2 chars
      
      let bestChunk = "";
      let bestSource = "";
      let maxMatches = 0;

      // Extract sources and text contents
      // Our context has "[Source: filename, Page: X]" format
      const pages = context.split(/\[Source: (.*?), Page: (\d+)\]/g);
      // pages is flat array: [pre-text, filename1, pageNum1, text1, filename2, pageNum2, text2, ...]
      for (let idx = 1; idx < pages.length; idx += 3) {
        const fileName = pages[idx];
        const pageNum = pages[idx + 1];
        const pageText = pages[idx + 2] || "";
        if (!fileName || !pageNum) continue;
        
        let matches = 0;
        queryWords.forEach((word: string) => {
          if (pageText.toLowerCase().includes(word)) {
            matches++;
          }
        });

        if (matches > maxMatches) {
          maxMatches = matches;
          bestChunk = pageText.trim().substring(0, 400) + "...";
          bestSource = `[📄 ${fileName}, trang ${pageNum}]`;
        }
      }

      let responseText = "";
      if (maxMatches > 0) {
        responseText = lang === 'en'
          ? `[Offline Mode] Found matching information in documents:\n\n"${bestChunk}"\n\nSource: ${bestSource}`
          : `[Chế độ Ngoại tuyến] Tìm thấy thông tin liên quan trong tài liệu:\n\n"${bestChunk}"\n\nNguồn: ${bestSource}`;
      } else {
        responseText = lang === 'en'
          ? "I am currently offline, and I couldn't find any direct keyword matches in your uploaded documents. Please check your network connection or enter a different question."
          : "Hiện tại hệ thống đang ngoại tuyến và không tìm thấy từ khóa trùng khớp trực tiếp trong tài liệu của em. Em vui lòng kiểm tra lại kết nối mạng hoặc thử câu hỏi khác nhé.";
      }

      res.json({ text: responseText, isOfflineMode: true });
      return;
    }

    // Build the system prompt
    const systemPrompt = lang === 'en'
      ? `You are a helpful AI study assistant for Grade 5-6 students studying Cambridge Primary Mathematics.
The student has uploaded their own study materials. Below is the full text content extracted from these materials.

----------------------
STUDENT UPLOADED MATERIALS CONTEXT:
${context}
----------------------

YOUR INSTRUCTIONS:
1. Answer questions ONLY based on the provided document context. Do not use external knowledge unless it is directly helpful to explain a mathematical term present in the text.
2. If the answer cannot be found in the provided documents, state clearly: "This information is not available in the uploaded documents." or "Thông tin này không có trong tài liệu đã upload." based on the student's language.
3. Always cite the exact source document and page number in your response in the format: [📄 filename, page X] (e.g. [📄 lesson6.pdf, page 4]). If the source is a text file with no pages, write [📄 filename].
4. Use clear, encouraging, and age-appropriate language (suitable for 10-12 year old children).
5. Render all mathematical expressions beautifully using standard LaTeX formatting (e.g. \\(E=mc^2\\) or \\(\\frac{1}{2}\\)) so they look premium and elegant.
6. Respond in English.`
      : `Bạn là trợ lý học tập AI hữu ích cho học sinh lớp 5-6 đang học môn Toán Tiểu học Cambridge (Cambridge Primary Mathematics).
Học sinh đã tải lên tài liệu học tập của mình. Dưới đây là toàn bộ nội dung văn bản trích xuất từ tài liệu đó.

----------------------
BỐI CẢNH TÀI LIỆU HỌC SINH TẢI LÊN:
${context}
----------------------

HƯỚNG DẪN DÀNG CHO BẠN:
1. TRẢ LỜI CÂU HỎI CHỈ DỰA TRÊN bối cảnh tài liệu được cung cấp ở trên. Không sử dụng kiến thức bên ngoài trừ khi điều đó trực tiếp giúp giải thích thuật ngữ toán học có trong văn bản.
2. Nếu câu trả lời không tìm thấy trong tài liệu được cung cấp, hãy nói rõ: "Thông tin này không có trong tài liệu đã upload."
3. Luôn trích dẫn chính xác tài liệu nguồn và số trang trong câu trả lời của bạn dưới định dạng: [📄 tên_file, trang X] (ví dụ: [📄 bài_giảng.pdf, trang 4]). Nếu nguồn là file văn bản không chia trang, hãy viết [📄 tên_file].
4. Sử dụng ngôn ngữ rõ ràng, ấm áp, khuyến khích và phù hợp với lứa tuổi học sinh lớp 5-6 (10-12 tuổi).
5. Định dạng tất cả các công thức toán học và biểu thức bằng LaTeX tiêu chuẩn (ví dụ: \\(A = \\pi r^2\\) hoặc \\(\\frac{a}{b}\\)) để hiển thị cao cấp và đẹp mắt.
6. Trả lời bằng tiếng Việt.`;

    const contents: any[] = [];
    
    // Add history
    for (const h of history) {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      });
    }

    // Add current query as current user input
    contents.push({
      role: 'user',
      parts: [{ text: query }]
    });

    console.log(`[Knowledge Chat] Sending prompt to Gemini with fallback...`);
    const response = await generateContentWithFallback(
      ai,
      contents,
      systemPrompt,
      modelHeader,
      0.6 // Slightly lower temperature for more factual QA
    );

    console.log("[Knowledge Chat] Response fetched from Gemini successfully.");
    res.json({
      text: response.text || (lang === 'en' 
        ? "I am analyzing the documents... Please try asking your question again!" 
        : "Thầy cô đang xem lại tài liệu một chút... Em hãy thử hỏi lại xem sao nhé!"),
      isOfflineMode: false
    });

  } catch (error: any) {
    console.error("Error inside Knowledge Chat AI Route:", error);
    const isRateLimit = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
    const status = isRateLimit ? 429 : 500;
    res.status(status).json({
      error: error.message || "Could not request Socratic response"
    });
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
      `You are an veteran EdTech AI Math Coach for Grade 6 students studying Cambridge Primary Mathematics.
Your pedagogical philosophy is Socrates' method:
1. NEVER reveal the final correct answer under any circumstances.
2. ALWAYS respond warmly and encouragingly in English.
3. If the student made a mistake, analyze their work (student input: "${studentAnswer}", expected: "${correctAnswer}", common mistake: "${commonMistake}"). Do not criticize; ask leading, scaffolded, bite-sized questions in English to guide them.
4. Promote "${thinkingSkill}" thinking skills (Thinking and Working Mathematically - TWM).
5. Give clues related to the hint: "${hint}".
6. Make them verify their calculations. Be concise, friendly, and highly engaging for 11-year-olds. Do not write extremely long explanations. Keep comments down to 3-4 simple sentences maximum per turn.` 
      : 
      `You are an veteran EdTech AI Math Coach for Grade 6 students studying Cambridge Primary Mathematics.
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

const LESSON_PDF_MAPPING: Record<string, { vol: 1 | 2; start: number; end: number; topic: string }> = {
  lesson_1: { vol: 1, start: 49, end: 62, topic: "Place value tenths, hundredths, thousandths" },
  lesson_2: { vol: 1, start: 36, end: 48, topic: "Rounding decimals" },
  lesson_3: { vol: 1, start: 63, end: 83, topic: "Equivalent fractions and comparing fractions" },
  lesson_4: { vol: 1, start: 84, end: 97, topic: "Fractions, decimals and percentages" },
  lesson_5: { vol: 2, start: 164, end: 175, topic: "Ratio and proportion" },
  lesson_6: { vol: 2, start: 229, end: 252, topic: "Coordinate transformations, tịnh tiến, đối xứng, quay" },
  lesson_7: { vol: 2, start: 223, end: 228, topic: "Rotational symmetry, đối xứng quay" },
  lesson_8: { vol: 1, start: 10, end: 19, topic: "Counting and sequences, phép đếm và dãy số" },
  lesson_9: { vol: 1, start: 20, end: 35, topic: "Special numbers, prime numbers, squares, cubes" },
  lesson_10: { vol: 2, start: 133, end: 146, topic: "Positive and negative integers, số nguyên âm" },
  lesson_11: { vol: 1, start: 114, end: 122, topic: "Adding and subtracting decimals, cộng trừ số thập phân" },
  lesson_12: { vol: 2, start: 147, end: 163, topic: "Quadrilaterals and circles, hình tứ giác và hình tròn" },
  lesson_13: { vol: 1, start: 98, end: 113, topic: "Exploring measures, rectangles area and time" },
  lesson_14: { vol: 1, start: 123, end: 132, topic: "Mode, median, mean and range statistics" },
  lesson_15: { vol: 1, start: 123, end: 132, topic: "Probability scales, mô tả và dự đoán xác suất" },
  lesson_16: { vol: 2, start: 133, end: 146, topic: "Multiplication and division, phép nhân và phép chia" },
  lesson_17: { vol: 2, start: 191, end: 202, topic: "Multiplying and dividing fractions and decimals" },
  lesson_18: { vol: 2, start: 223, end: 228, topic: "The laws of arithmetic, các tính chất số học" },
  lesson_19: { vol: 2, start: 147, end: 163, topic: "3D shapes and nets, hình trải phẳng của hình khối" },
  lesson_20: { vol: 2, start: 176, end: 190, topic: "Angles in a triangle, đo và tính các góc" },
  lesson_21: { vol: 2, start: 203, end: 222, topic: "Frequency diagrams, line graphs and data" }
};

// AI Textbook Extractor endpoint
app.post('/api/textbook/extract', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { lessonId, lang = 'vi' } = req.body;
    const apiKeyHeader = req.headers['x-api-key'] as string | undefined;
    const modelHeader = req.headers['x-gemini-model'] as string | undefined;

    const mapping = LESSON_PDF_MAPPING[lessonId];
    if (!mapping) {
      res.status(400).json({ error: "Invalid lessonId or no mapping found" });
      return;
    }

    const pdfName = mapping.vol === 1 ? "Stage 6_LB_Vol 1 (1).pdf" : "Stage 6_LB_Vol 2.pdf";
    const pdfPath = path.join(process.cwd(), pdfName);

    const uvPath = `C:\\Users\\Hoang Trung Hieu\\.local\\bin\\uv.exe`;
    const command = `"${uvPath}" run extract_pages.py "${pdfPath}" ${mapping.start} ${mapping.end}`;

    console.log(`[Textbook Extract] Executing: ${command}`);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Textbook Extract] Error: ${error.message}`);
        res.status(500).json({ error: "Failed to extract PDF contents", details: error.message });
        return;
      }

      const ai = createDynamicClient(apiKeyHeader);
      if (!ai) {
        const mockSummary = lang === 'vi'
          ? `### 📚 TÀI LIỆU SÁCH GIÁO KHOA (${mapping.topic})
          
*Đang chạy ở chế độ ngoại tuyến.*

**Dải trang gốc:** Sách Học Sinh Tập ${mapping.vol}, trang ${mapping.start} - ${mapping.end}.

**Nội dung thô trích xuất:**
${stdout.slice(0, 1000)}...`
          : `### 📚 TEXTBOOK REFERENCE (Chapter: ${mapping.topic})

*Running in offline mode.*

**Original page range:** Learner's Book Vol ${mapping.vol}, pages ${mapping.start} - ${mapping.end}.

**Extracted raw text snippet:**
${stdout.slice(0, 1000)}...`;

        res.json({ text: mockSummary, rawText: stdout });
        return;
      }

      const systemPrompt = `
      You are a friendly Grade 6 Math Coach. 
      Below is raw text extracted from the Cambridge Primary Mathematics Stage 6 Learner's Book for the topic: "${mapping.topic}".
      Please write a highly structured, kid-friendly study guide (tờ tóm tắt kiến thức) in ${lang === 'vi' ? 'Vietnamese' : 'English'} based on this textbook content.
      
      Format the output using markdown. Use a lot of emojis and keep it very encouraging and visual.
      Organize it exactly under these headers:
      🌟 **Khái niệm cốt lõi (Core Concept)**: A clear, simple explanation for 11-year-olds.
      📝 **Quy tắc & Công thức (Rules & Formulas)**: Short step-by-step instructions.
      💡 **Ví dụ trực quan (Visual Examples)**: An example demonstrating the rule.
      🧠 **Mẹo nhớ nhanh (Memory Trick)**: A fun way to remember.
      
      Keep it clean, concise, and direct. Do not enclose it in raw markdown blocks.
      `;

      const userPrompt = `
      Format this textbook content into a study guide:
      ---
      ${stdout.slice(0, 8000)}
      ---
      `;

      generateContentWithFallback(ai, [{ role: 'user', parts: [{ text: userPrompt }] }], systemPrompt, modelHeader, 0.3)
        .then(response => {
          res.json({
            text: response.text || "Could not format textbook content.",
            rawText: stdout
          });
        })
        .catch(err => {
          console.error("[Textbook Extract] Gemini formatting failed:", err);
          res.status(500).json({ error: err.message || "Failed to format content with AI" });
        });
    });

  } catch (error: any) {
    console.error("Error in textbook extract route:", error);
    res.status(500).json({ error: error.message });
  }
});

// Excellent Student Model Solution AI route
app.post('/api/gemini/model-solution', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { 
      questionText, 
      correctAnswer, 
      studentAnswer, 
      hint, 
      thinkingSkill, 
      topic,
      chosenLanguage = 'vi'
    } = req.body;

    const apiKeyHeader = req.headers['x-api-key'] as string | undefined;
    const modelHeader = req.headers['x-gemini-model'] as string | undefined;
    const ai = createDynamicClient(apiKeyHeader);

    const systemPrompt = chosenLanguage === 'en' ?
      `You are an AI Math Coach showing a model step-by-step solution written by a top-performing ("Học sinh Giỏi") Grade 6 student studying Cambridge Mathematics.
      Show exactly how a student should write down their calculation and explanation to get full marks.
      Use clear logical steps, proper math vocabulary (e.g. place value, denominator), and include brief explanations for why each step makes sense.
      Keep the tone encouraging, structured, and easy to follow. Use bolding and LaTeX formatting (e.g., \\frac{a}{b}) for clarity.
      Format like this:
      🏆 **Perfect Student Solution:**
      - **Step 1:** [Step title and details]
      - **Step 2:** [Step title and details]
      - **Final Answer:** [State final answer clearly]
      💡 **Pro Writing Tip:** [Explain a key tip for writing proofs or checking answers]`
      :
      `You are an AI Math Coach showing a model step-by-step solution written by a top-performing ("Học sinh Giỏi") Grade 6 student studying Cambridge Mathematics.
      Hãy chỉ ra chính xác cách viết lời giải và các bước tính toán chi tiết của một học sinh xuất sắc để đạt điểm tối đa.
      Trình bày các bước logic, sử dụng thuật ngữ toán học chuẩn mực (ví dụ: quy đồng mẫu số, hàng phần mười), và giải thích ngắn gọn tại sao lại làm như vậy.
      Giữ giọng văn tích cực, dễ học tập theo. Sử dụng định dạng in đậm và LaTeX (ví dụ: \\frac{a}{b}) cho các công thức.
      Định dạng như sau:
      🏆 **Bài giải mẫu của Học sinh Giỏi:**
      - **Bước 1:** [Tiêu đề bước và chi tiết thực hiện]
      - **Bước 2:** [Tiêu đề bước và chi tiết thực hiện]
      - **Kết luận:** [Nêu đáp số rõ ràng]
      💡 **Mẹo trình bày bài thi:** [Giải thích mẹo viết lời giải hoặc cách soát lỗi]`;

    const userPrompt = chosenLanguage === 'en' ?
      `Generate an excellent student model solution for:
      - Topic: ${topic}
      - Question: "${questionText}"
      - Expected Answer: "${correctAnswer}"
      - Hint: "${hint}"
      - Thinking Skill: ${thinkingSkill}`
      :
      `Hãy viết bài giải mẫu của học sinh giỏi cho bài toán sau:
      - Chủ đề: ${topic}
      - Đề bài: "${questionText}"
      - Đáp số đúng: "${correctAnswer}"
      - Gợi ý: "${hint}"
      - Kỹ năng tư duy: ${thinkingSkill}`;

    if (!ai) {
      const offlineSolution = chosenLanguage === 'en' ?
        `🏆 **Perfect Student Solution (Offline Mode):**
- **Step 1:** Identify the key parameters: topic is ${topic}. The problem asks: "${questionText}".
- **Step 2:** Apply the standard calculation. Since the correct answer is "${correctAnswer}", we verify it step-by-step using the hint: "${hint}".
- **Final Answer:** The answer is "${correctAnswer}".
💡 **Pro Writing Tip:** Double check your decimal point positions or fractions scaling before submitting!`
        :
        `🏆 **Bài giải mẫu của Học sinh Giỏi (Chế độ Ngoại tuyến):**
- **Bước 1:** Phân tích dữ kiện đề bài: Chủ đề ${topic}. Đề bài yêu cầu: "${questionText}".
- **Bước 2:** Thực hiện phép tính. Dựa trên đáp án đúng là "${correctAnswer}", quy đổi hoặc tính toán theo gợi ý: "${hint}".
- **Kết luận:** Đáp án chính xác là "${correctAnswer}".
💡 **Mẹo trình bày bài thi:** Luôn kiểm tra lại cách rút gọn phân số hoặc vị trí của dấu phẩy số thập phân trước khi kết luận!`;

      res.json({ text: offlineSolution, isOfflineMode: true });
      return;
    }

    const response = await generateContentWithFallback(ai, [{ role: 'user', parts: [{ text: userPrompt }] }], systemPrompt, modelHeader, 0.5);
    res.json({
      text: response.text || "Could not generate model solution.",
      isOfflineMode: false
    });

  } catch (error: any) {
    console.error("Error in model-solution route:", error);
    res.status(500).json({ error: error.message || "Failed to generate solution guide" });
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
