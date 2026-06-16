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
import { Question } from '../types';
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
  onCoachMessageLogged?: () => void;
}

export default function AICoachModal({ 
  isOpen, 
  onClose, 
  question, 
  studentAnswer,
  onCoachMessageLogged 
}: AICoachModalProps) {
  const { language, t, getLangText } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorText, setErrorText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize consultation once opened
  useEffect(() => {
    if (isOpen && question) {
      setErrorText('');
      // Setup Initial Coach Message
      const isVi = language === 'vi';
      const introText = isVi
        ? `Chào Hoàng Minh! Thầy cô thấy em đang làm câu về bài **${question.topic}** với đáp án **"${studentAnswer}"** nhưng chưa khớp. \nĐừng lo lắng nhé! Hãy quan sát kỹ đề bài: *"${getLangText(question.questionText)}"*. \nKỹ năng liên quan đến bài này là **${question.thinkingSkill}**. Em hãy thử suy nghĩ lại xem, em đã tính toán thế nào để có đáp án đó? Có điều gì em bỏ sót không?`
        : `Hi Hoang Minh! I see your answer is **"${studentAnswer}"** for the question about **${question.topic}**, but it doesn't match. \nDon't worry! Read the question carefully: *"${getLangText(question.questionText)}"*. \nThis question involves **${question.thinkingSkill}** skills. Can you think about how you calculated that answer? Is there something you might have missed?`;

      const introMessage: Message = {
        id: 'initial_greet',
        role: 'model',
        text: introText,
        timestamp: new Date()
      };
      setMessages([introMessage]);
    }
  }, [isOpen, question, studentAnswer, language]);

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
          chosenLanguage: language // Send active language state to backend
        })
      });

      if (response.status !== 200) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const coachMsg: Message = {
        id: Math.random().toString(),
        role: 'model',
        text: data.text || (language === 'vi' 
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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                )}
                
                <div className={`max-w-[82%] rounded-xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                  isCoach 
                    ? 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50' 
                    : 'bg-blue-600 text-white rounded-tr-none'
                }`}>
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>
                  <p className={`mt-1.5 font-mono text-[8px] text-right ${isCoach ? 'text-slate-400' : 'text-blue-200'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-2.5 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div className="rounded-xl bg-slate-100 border border-slate-200/50 px-4 py-3 text-xs text-slate-500 rounded-tl-none">
                <div className="flex gap-1 py-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-100" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-200" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-300" />
                </div>
              </div>
            </div>
          )}
          {errorText && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-red-700 flex gap-2.5 items-start text-xs font-semibold" id="ai_coach_error_block">
              <AlertOctagon className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5 animate-bounce" />
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
            className="shrink-0 rounded-full bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-colors px-3 py-1.5 text-[10px] font-medium text-slate-600"
          >
            {t('suggestRule')}
          </button>
          <button 
            type="button"
            onClick={() => setInputText(language === 'vi' ? "Có hình vẽ minh họa hoặc ví dụ mẫu tương tự không cô?" : "Is there a diagram or a similar example I can look at?")}
            className="shrink-0 rounded-full bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-colors px-3 py-1.5 text-[10px] font-medium text-slate-600"
          >
            {t('suggestExample')}
          </button>
          <button 
            type="button"
            onClick={() => setInputText(language === 'vi' ? "Em đã tính nháp lại rồi nhưng vẫn ra đáp án cũ cô ơi!" : "I worked on the scratchpad but still got the same answer!")}
            className="shrink-0 rounded-full bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-colors px-3 py-1.5 text-[10px] font-medium text-slate-600"
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

      </motion.div>
    </div>
  );
}
