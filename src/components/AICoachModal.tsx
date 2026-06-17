/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Bot, 
  Send, 
  HelpCircle, 
  Sparkles, 
  X, 
  ArrowRight, 
  CheckCircle,
  Lightbulb,
  AlertOctagon
} from 'lucide-react';
import { Question, StudentProfile } from '../types';
import { useLanguage } from '../lib/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  studentAnswer: string;
  student: StudentProfile;
  onCoachMessageLogged?: () => void;
}

export default function AICoachModal({ 
  isOpen, 
  onClose, 
  question, 
  studentAnswer,
  student,
  onCoachMessageLogged 
}: AICoachModalProps) {
  const { language, t, getLangText } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [activeTab, setActiveTab] = useState<'socratic' | 'solution'>('socratic');
  const [modelSolutionText, setModelSolutionText] = useState('');
  const [isLoadingSolution, setIsLoadingSolution] = useState(false);
  const [solutionError, setSolutionError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize consultation once opened
  useEffect(() => {
    if (isOpen && question) {
      setErrorText('');
      // Setup Initial Coach Message
      const isVi = language === 'vi';
      const studentName = student?.name || (isVi ? 'Học sinh' : 'Student');
      const introText = isVi
        ? `Chào ${studentName}! Thầy cô thấy em đang làm câu về bài **${question.topic}** với đáp án **"${studentAnswer}"** nhưng chưa khớp. \nĐừng lo lắng nhé! Hãy quan sát kỹ đề bài: *"${getLangText(question.questionText)}"*. \nKỹ năng liên quan đến bài này là **${question.thinkingSkill}**. Em hãy thử suy nghĩ lại xem, em đã tính toán thế nào để có đáp án đó? Có điều gì em bỏ sót không?`
        : `Hi ${studentName}! I see your answer is **"${studentAnswer}"** for the question about **${question.topic}**, but it doesn't match. \nDon't worry! Read the question carefully: *"${getLangText(question.questionText)}"*. \nThis question involves **${question.thinkingSkill}** skills. Can you think about how you calculated that answer? Is there something you might have missed?`;

      const introMessage: Message = {
        id: 'initial_greet',
        role: 'model',
        text: introText,
        timestamp: new Date()
      };
      setMessages([introMessage]);
    }
  }, [isOpen, question, studentAnswer, language, student]);

  // Reset solution tab when question changes
  useEffect(() => {
    setActiveTab('socratic');
    setModelSolutionText('');
    setSolutionError('');
  }, [question]);

  // Fetch excellent student solution when tab changes to solution
  useEffect(() => {
    if (activeTab === 'solution') {
      handleFetchModelSolution();
    }
  }, [activeTab]);

  const handleFetchModelSolution = async () => {
    if (modelSolutionText) return;

    setIsLoadingSolution(true);
    setSolutionError('');
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const selectedModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';

      let responseText = '';
      try {
        const response = await fetch('/api/gemini/model-solution', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'x-gemini-model': selectedModel
          },
          body: JSON.stringify({
            questionText: getLangText(question.questionText),
            correctAnswer: getLangText(question.correctAnswer),
            studentAnswer: studentAnswer,
            hint: getLangText(question.hint),
            thinkingSkill: question.thinkingSkill,
            topic: question.topic,
            chosenLanguage: language
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        responseText = data.text;
      } catch (backendErr) {
        console.warn("Backend API failed for model solution. Initiating client-side direct Gemini fallback.", backendErr);
        
        let clientFallbackSuccess = false;

        const isValidGeminiKey = (key: string | null | undefined): boolean => {
          if (!key) return false;
          const k = key.trim();
          return k.startsWith("AIzaSy") && k.length > 15;
        };

        if (isValidGeminiKey(apiKey)) {
          try {
            const systemPrompt = language === 'en' ?
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

            const userPrompt = language === 'en' ?
              `Generate an excellent student model solution for:
- Topic: ${question.topic}
- Question: "${getLangText(question.questionText)}"
- Expected Answer: "${getLangText(question.correctAnswer)}"
- Hint: "${getLangText(question.hint)}"
- Thinking Skill: ${question.thinkingSkill}`
              :
              `Hãy viết bài giải mẫu của học sinh giỏi cho bài toán sau:
- Chủ đề: ${question.topic}
- Đề bài: "${getLangText(question.questionText)}"
- Đáp số đúng: "${getLangText(question.correctAnswer)}"
- Gợi ý: "${getLangText(question.hint)}"
- Kỹ năng tư duy: ${question.thinkingSkill}`;

            let targetModel = selectedModel;
            if (targetModel.includes('gemini-3-flash')) targetModel = 'gemini-2.5-flash';
            if (targetModel.includes('gemini-3-pro')) targetModel = 'gemini-2.5-pro';

            const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { temperature: 0.5 }
              })
            });

            if (!googleResponse.ok) {
              throw new Error(`Google API status ${googleResponse.status}`);
            }

            const googleData = await googleResponse.json();
            responseText = googleData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            clientFallbackSuccess = true;
          } catch (googleErr) {
            console.warn("Direct Google API model solution call failed. Falling back to offline mode.", googleErr);
          }
        }

        if (!clientFallbackSuccess) {
          responseText = language === 'en' ?
            `🏆 **Perfect Student Solution (Offline Mode):**
- **Step 1:** Identify the key parameters: topic is ${question.topic}. The problem asks: "${getLangText(question.questionText)}".
- **Step 2:** Apply the standard calculation. Since the correct answer is "${getLangText(question.correctAnswer)}", we verify it step-by-step using the hint: "${getLangText(question.hint)}".
- **Final Answer:** The answer is "${getLangText(question.correctAnswer)}".
💡 **Pro Writing Tip:** Double check your decimal point positions or fractions scaling before submitting!`
            :
            `🏆 **Bài giải mẫu của Học sinh Giỏi (Chế độ Ngoại tuyến):**
- **Bước 1:** Phân tích dữ kiện đề bài: Chủ đề ${question.topic}. Đề bài yêu cầu: "${getLangText(question.questionText)}".
- **Bước 2:** Thực hiện phép tính. Dựa trên đáp án đúng là "${getLangText(question.correctAnswer)}", quy đổi hoặc tính toán theo gợi ý: "${getLangText(question.hint)}".
- **Kết luận:** Đáp án chính xác là "${getLangText(question.correctAnswer)}".
💡 **Mẹo trình bày bài thi:** Luôn kiểm tra lại cách rút gọn phân số hoặc vị trí của dấu phẩy số thập phân trước khi kết luận!`;
        }
      }

      setModelSolutionText(responseText);
    } catch (err: any) {
      console.error(err);
      setSolutionError(err.message || 'Unknown error');
    } finally {
      setIsLoadingSolution(false);
    }
  };

  // Keep scrolled to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsgText = inputText;
    const userMsg: Message = {
      id: Math.random().toString(),
      role: 'user',
      text: userMsgText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setErrorText('');

    try {
      // Map history context correctly (matching schema in server.ts)
      const historyContext = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const selectedModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';

      let responseText = '';
      try {
        const response = await fetch('/api/gemini/tutor', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'x-gemini-model': selectedModel
          },
          body: JSON.stringify({
            questionText: getLangText(question.questionText),
            correctAnswer: getLangText(question.correctAnswer),
            studentAnswer: studentAnswer,
            hint: getLangText(question.hint),
            commonMistake: getLangText(question.commonMistake),
            thinkingSkill: question.thinkingSkill,
            topic: question.topic,
            history: historyContext,
            chosenLanguage: language
          })
        });

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        responseText = data.text;
      } catch (backendErr) {
        console.warn("Backend API call failed for tutor, attempting direct Gemini client-side call:", backendErr);
        
        let clientFallbackSuccess = false;

        const isValidGeminiKey = (key: string | null | undefined): boolean => {
          if (!key) return false;
          const k = key.trim();
          return k.startsWith("AIzaSy") && k.length > 15;
        };

        if (isValidGeminiKey(apiKey)) {
          try {
            const systemPrompt = language === 'en' ? 
              `You are an veteran EdTech AI Math Coach for Grade 6 students studying Cambridge Primary Mathematics.
Your pedagogical philosophy is Socrates' method:
1. NEVER reveal the final correct answer under any circumstances.
2. ALWAYS respond warmly and encouragingly in English.
3. If the student made a mistake, analyze their work (student input: "${studentAnswer}", expected: "${getLangText(question.correctAnswer)}", common mistake: "${getLangText(question.commonMistake)}"). Do not criticize; ask leading, scaffolded, bite-sized questions in English to guide them.
4. Promote "${question.thinkingSkill}" thinking skills (Thinking and Working Mathematically - TWM).
5. Give clues related to the hint: "${getLangText(question.hint)}".
6. Make them verify their calculations. Be concise, friendly, and highly engaging for 11-year-olds. Do not write extremely long explanations. Keep comments down to 3-4 simple sentences maximum per turn.` 
              : 
              `You are an veteran EdTech AI Math Coach for Grade 6 students studying Cambridge Primary Mathematics.
Your pedagogical philosophy is Socrates' method:
1. NEVER reveal the final correct answer under any circumstances.
2. ALWAYS respond warmly and encouragingly in Vietnamese.
3. If the student made a mistake, analyze their work (student input: "${studentAnswer}", expected: "${getLangText(question.correctAnswer)}", common mistake: "${getLangText(question.commonMistake)}"). Do not say they are bad; ask leading, scaffolded, bite-sized questions in Vietnamese to guide them.
4. Promote "${question.thinkingSkill}" thinking skills (Tư duy và Làm việc theo Toán học - TWM).
5. Give clues related to the hint: "${getLangText(question.hint)}".
6. Make them verify their calculations. Be concise, cozy, and highly engaging for 11-year-olds. Do not write extremely long explanations. Keep comments down to 3-4 simple sentences maximum per turn.`;

            const userPrompt = language === 'en' ? 
              `I am working on the question: "${getLangText(question.questionText)}". 
My answer is "${studentAnswer}", but the expected answer is "${getLangText(question.correctAnswer)}". 
The hint is: "${getLangText(question.hint)}".
The common mistake is: "${getLangText(question.commonMistake)}".
Ask me a leading question to activate my "${question.thinkingSkill}" thinking skill so I can calculate it again, without giving me the correct answer!` 
              : 
              `Em đang làm câu: "${getLangText(question.questionText)}". 
Đáp án đúng là "${getLangText(question.correctAnswer)}" nhưng em ghi đáp án là: "${studentAnswer}". 
Gợi ý cho câu này là: "${getLangText(question.hint)}". 
Hành vi lỗi thường gặp là: "${getLangText(question.commonMistake)}".
Hãy đặt cho em 1 câu hỏi gợi mở, giúp em kích hoạt kỹ năng "${question.thinkingSkill}" để em tự tính lại mà không cho em biết đáp án đúng!`;

            let targetModel = selectedModel;
            if (targetModel.includes('gemini-3-flash')) targetModel = 'gemini-2.5-flash';
            if (targetModel.includes('gemini-3-pro')) targetModel = 'gemini-2.5-pro';

            // Filter out welcome message or any leading model message from Gemini history
            const filteredHistory = historyContext.map(h => ({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }]
            }));
            
            while (filteredHistory.length > 0 && filteredHistory[0].role === 'model') {
              filteredHistory.shift();
            }

            const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  ...filteredHistory,
                  { role: 'user', parts: [{ text: userPrompt }] }
                ],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { temperature: 0.6 }
              })
            });

            if (!googleResponse.ok) {
              throw new Error(`Google API status ${googleResponse.status}`);
            }

            const googleData = await googleResponse.json();
            responseText = googleData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            clientFallbackSuccess = true;
          } catch (googleErr) {
            console.warn("Direct Google API Socratic coach call failed. Falling back to offline dialogue.", googleErr);
          }
        }

        if (!clientFallbackSuccess) {
          if (language === 'en') {
            responseText = historyContext.length === 0
              ? `Hello! I see you entered **"${studentAnswer}"** for the question on **${question.topic}**. \nLet me give you a clue: This question tests your **${question.thinkingSkill}** skills. Remember: *${getLangText(question.hint)}*. \nCould it be that you made this common error: *${getLangText(question.commonMistake)}*? Try checking your calculation steps again!`
              : `Keep going! I'm here to guide your mathematical thinking. \n*Hint:* Analyze the decimal place movement or check your fractions common denominator. I know you can self-correct and solve it! Enter a new calculation result to try again.`;
          } else {
            responseText = historyContext.length === 0
              ? `Chào em! Thầy cô thấy em trả lời là **"${studentAnswer}"** cho câu hỏi về **${question.topic}**. \nGợi ý một chút nhé: Câu này đòi hỏi kỹ năng **${question.thinkingSkill}**. Em hãy nhớ lại: *${getLangText(question.hint)}*. \nCó phải em đang gặp vướng mắc ở lỗi này không: *${getLangText(question.commonMistake)}*? Em hãy thử kiểm tra lại phép tính của mình nhé!`
              : `Cố gắng lên em! Thầy cô ở đây để giúp em tư duy độc lập. Hãy đọc kỹ phần giải thích quy tắc học tập: \n*Gợi ý:* Hãy phân tích kỹ tử số và mẫu số hoặc xem dấu phẩy thập phân dịch chuyển mấy vị trí. Thầy cô tin em tự tìm ra lỗi sai và giải lại được! Em hãy thử nhập đáp án mới sau khi tính lại xem sao?`;
          }
        }
      }

      const coachMsg: Message = {
        id: Math.random().toString(),
        role: 'model',
        text: responseText || (language === 'vi' 
          ? "Cô đang xem phép tính của em... Em có muốn kiểm tra lại vị trí dấu thập phân hoặc chia nhỏ tỉ lệ không?"
          : "I'm checking your calculation... Would you like to re-verify the decimal place value or check the scaling factor?"),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, coachMsg]);
      
      if (onCoachMessageLogged) {
        onCoachMessageLogged();
      }
    } catch (e: any) {
      console.error("Failed Socratic communication request", e);
      setErrorText(e.message || 'Unknown error');
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/45 backdrop-blur-xs" id="modal_ai_tutor_backdrop">
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="flex h-full w-full flex-col bg-white shadow-2xl md:max-w-md lg:max-w-lg"
        id="modal_ai_tutor_drawer"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-blue-600 px-4 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm sm:text-base flex items-center gap-1.5">
                {t('aiCoachHeader')} <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">Socratic</span>
              </h3>
              <p className="text-[10px] text-blue-100">{t('aiCoachSubtitle')}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Question Context Strip */}
        <div className="bg-slate-50 border-b border-slate-150 p-3.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-amber-500" />
            {t('questionContext')}
          </p>
          <div className="rounded-lg bg-white border border-slate-200 p-2 text-xs">
            <p className="font-semibold text-slate-800 line-clamp-2">{getLangText(question.questionText)}</p>
            <div className="mt-2 flex gap-1.5 flex-wrap">
              <span className="rounded bg-blue-55 px-2 py-0.5 font-mono text-[9px] font-semibold text-blue-600">
                {question.thinkingSkill}
              </span>
              <span className="rounded bg-red-50 px-2 py-0.5 text-[9px] font-semibold text-red-600">
                {t('commonMistakeLabel')}: {getLangText(question.commonMistake)}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Socratic Robot vs Model Solution) */}
        <div className="flex border-b border-slate-100 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('socratic')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'socratic'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200/55'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>🤖</span>
            <span>{language === 'vi' ? 'Robot gợi mở' : 'AI Socratic'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('solution')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'solution'
                ? 'bg-white text-indigo-650 shadow-sm border border-slate-200/55'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>🏆</span>
            <span>{language === 'vi' ? 'Bài giải mẫu HS Giỏi' : 'Model Solution'}</span>
          </button>
        </div>

        {activeTab === 'solution' ? (
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4" id="model_solution_scroll_area">
            {isLoadingSolution ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mx-auto" />
                <p className="font-bold text-indigo-700 animate-pulse text-xs text-center">
                  {language === 'vi' ? 'Gia sư AI đang viết lời giải mẫu...' : 'AI Tutor drafting excellent solution...'}
                </p>
              </div>
            ) : solutionError ? (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-xs font-semibold space-y-2">
                <p>{language === 'vi' ? 'Không thể tải cách giải mẫu:' : 'Could not load model solution:'}</p>
                <p className="font-mono text-[10.5px] bg-red-100/50 p-2 rounded">{solutionError}</p>
                <p className="text-[10px] font-normal leading-relaxed text-red-500">
                  {language === 'vi' 
                    ? 'Lưu ý: Hãy chắc chắn em đã nhập API key ở mục thiết lập (nút răng cưa ở thanh tiêu đề).'
                    : 'Please verify that you have entered your API Key in settings.'}
                </p>
              </div>
            ) : (
              <div className="prose max-w-none text-slate-700 leading-relaxed font-medium whitespace-pre-line bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
                {modelSolutionText}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Chat History View */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" id="chat_scroll_area">
              {messages.map((msg) => {
                const isCoach = msg.role === 'model';
                return (
                  <div 
                    key={msg.id} 
                    className={`flex gap-2.5 ${isCoach ? 'justify-start' : 'justify-end'}`}
                  >
                    {isCoach && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 border border-amber-200 shadow-xs relative overflow-hidden">
                        <span className="text-base">🤖</span>
                      </div>
                    )}
                    
                    <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm relative border ${
                      isCoach 
                        ? 'bg-amber-50 text-amber-900 rounded-tl-none border-amber-100/70' 
                        : 'bg-blue-50 text-blue-900 rounded-tr-none border-blue-100/70'
                    }`}>
                      <div className={`absolute top-0 w-3 h-3 ${
                        isCoach 
                          ? '-left-2 bg-amber-50 border-l border-t border-amber-100/70 [clip-path:polygon(100%_0,0_0,100%_100%)]' 
                          : '-right-2 bg-blue-50 border-r border-t border-blue-100/70 [clip-path:polygon(0_0,100%_0,0_100%)]'
                      }`} />
                      <p className="whitespace-pre-line font-semibold">{msg.text}</p>
                      <p className={`mt-1.5 font-mono text-[8px] text-right ${isCoach ? 'text-amber-500' : 'text-blue-500'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex gap-2.5 justify-start">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 border border-amber-200 shadow-xs relative overflow-hidden">
                    <span className="text-base">🤖</span>
                  </div>
                  <div className="rounded-2xl bg-amber-50 border border-amber-100/70 px-4 py-3 text-xs text-slate-500 rounded-tl-none relative">
                    <div className="absolute top-0 -left-2 w-3 h-3 bg-amber-50 border-l border-t border-amber-100/70 [clip-path:polygon(100%_0,0_0,100%_100%)]" />
                    <div className="flex gap-1 py-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-100" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-200" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-300" />
                    </div>
                  </div>
                </div>
              )}
              {errorText && (
                <div className="rounded-xl bg-red-50 border border-red-250 p-3.5 text-red-750 flex gap-2.5 items-start text-xs font-semibold" id="ai_coach_error_block">
                  <AlertOctagon className="h-4.5 w-4.5 text-red-550 shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <p className="font-bold">
                      {language === 'vi' ? 'Lỗi phản hồi từ AI' : 'AI Response Error'}
                    </p>
                    <p className="font-mono mt-1 text-[10.5px] bg-red-100/50 p-1.5 rounded border border-red-200/50 break-all">
                      {errorText}
                    </p>
                    <p className="mt-1.5 text-[9.5px] text-red-500/80 font-normal leading-relaxed">
                      {language === 'vi' 
                        ? 'Hãy kiểm tra lại API Key hoặc đổi sang Model khác trong mục Thiết lập (nút răng cưa ở thanh tiêu đề).'
                        : 'Please check your API Key or try a different Model in settings (gear icon on the top bar).'}
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Prompts */}
            <div className="px-4 py-2 flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-slate-50" id="ai_quick_suggestions">
              <button 
                type="button"
                onClick={() => setInputText(language === 'vi' ? "Em vẫn chưa hiểu rõ quy tắc tính nhanh? Thầy cô giúp em với." : "I don't understand the calculation rules yet. Can you help me?")}
                className="shrink-0 rounded-full bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-650 transition-colors px-3 py-1.5 text-[10px] font-bold text-slate-650"
              >
                {t('suggestRule')}
              </button>
              <button 
                type="button"
                onClick={() => setInputText(language === 'vi' ? "Có hình vẽ minh họa hoặc ví dụ mẫu tương tự không cô?" : "Is there a diagram or a similar example I can look at?")}
                className="shrink-0 rounded-full bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-650 transition-colors px-3 py-1.5 text-[10px] font-bold text-slate-650"
              >
                {t('suggestExample')}
              </button>
              <button 
                type="button"
                onClick={() => setInputText(language === 'vi' ? "Em đã tính nháp lại rồi nhưng vẫn ra đáp án cũ cô ơi!" : "I worked on the scratchpad but still got the same answer!")}
                className="shrink-0 rounded-full bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-650 transition-colors px-3 py-1.5 text-[10px] font-bold text-slate-650"
              >
                {t('suggestStuck')}
              </button>
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-4 flex gap-2 bg-white" id="ai_chat_input_form">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isTyping}
                placeholder={t('inputPlaceholder')}
                className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="rounded-xl bg-blue-600 p-2.5 text-white hover:bg-blue-700 active:scale-95 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:scale-100"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
