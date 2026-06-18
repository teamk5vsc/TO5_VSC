/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  Send, 
  X, 
  BookMarked, 
  Clock, 
  Maximize2,
  Database,
  FileText,
  AlertOctagon,
  RefreshCw,
  Search,
  Eye
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { formatMathText } from '../lib/mathFormatter';
import { 
  getDocumentsMetadata, 
  compileContextForChat, 
  getDocumentPageText,
  DocumentMetadata,
  getChatThreads,
  getActiveThreadId
} from '../lib/knowledgeStore';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isOffline?: boolean;
}

export default function FloatingKnowledgeBase() {
  const { language, t } = useLanguage();
  const isVi = language === 'vi';
  
  const [isOpen, setIsOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorText, setErrorText] = useState('');
  
  // Citation Preview Overlay State
  const [previewSource, setPreviewSource] = useState<{ fileName: string; pageNum?: number } | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load documents metadata and initialize chat greeting on mount or language change
  useEffect(() => {
    if (isOpen) {
      loadDocs();
      if (messages.length === 0) {
        initGreeting();
      }
    }
  }, [isOpen, language]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const loadDocs = () => {
    const list = getDocumentsMetadata();
    setDocuments(list);
  };

  const initGreeting = () => {
    setMessages([
      {
        id: 'floating_greet',
        role: 'model',
        text: isVi
          ? "Chào em! Thầy cô đã mở Kho Từ Điển & Tài Liệu học tập của lớp. Em có thể tra cứu nhanh thuật ngữ hoặc đặt câu hỏi về tài liệu bất kỳ lúc nào tại đây nhé! 📖"
          : "Hello! The Class Document Dictionary is open. You can look up math terms or ask questions about uploaded materials at any time! 📖",
        timestamp: new Date()
      }
    ]);
  };

  // Click handler for citations using event delegation on the chat message wrapper
  const handleBubbleClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const citationBtn = target.closest('.citation-btn') as HTMLElement;
    if (!citationBtn) return;

    const fileName = citationBtn.getAttribute('data-file');
    const pageStr = citationBtn.getAttribute('data-page');
    if (!fileName) return;

    const pageNum = pageStr ? parseInt(pageStr, 10) : undefined;
    setPreviewSource({ fileName, pageNum });
    
    setIsLoadingPreview(true);
    setPreviewText(null);
    try {
      const text = await getDocumentPageText(fileName, pageNum);
      setPreviewText(text || (isVi ? 'Không tìm thấy nội dung văn bản cho trang này.' : 'No text content found for this page.'));
    } catch (err) {
      console.error(err);
      setPreviewText(isVi ? 'Lỗi khi tải nội dung nguồn.' : 'Error loading source content.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const queryText = inputText;
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: queryText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setErrorText('');

    try {
      const activeId = getActiveThreadId();
      const currentThreads = getChatThreads();
      const activeThread = currentThreads.find(t => t.id === activeId);
      const docIds = activeThread ? activeThread.selectedDocIds : undefined;
      const context = await compileContextForChat(docIds);
      const historyContext = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const selectedModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';

      let responseText = '';
      let isOfflineMode = false;

      try {
        const response = await fetch('/api/gemini/knowledge-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'x-gemini-model': selectedModel
          },
          body: JSON.stringify({
            query: queryText,
            docIds,
            history: historyContext,
            lang: language
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        responseText = data.text;
        isOfflineMode = !!data.isOfflineMode;
      } catch (backendErr) {
        console.warn("Backend Q&A API failed. Trying direct Gemini/Search client fallback.", backendErr);
        
        let clientFallbackSuccess = false;

        const isValidGeminiKey = (key: string | null | undefined): boolean => {
          if (!key) return false;
          const k = key.trim();
          return k.startsWith("AIzaSy") && k.length > 15;
        };

        if (isValidGeminiKey(apiKey)) {
          try {
            const systemPrompt = isVi ? 
              `Bạn là trợ lý học tập AI hữu ích cho học sinh đang tra cứu tài liệu lớp học.
Dưới đây là nội dung trích xuất từ tài liệu học sinh tải lên:
----------------------
${context}
----------------------
HƯỚNG DẪN DÀNG CHO BẠN:
1. TRẢ LỜI CÂU HỎI CHỈ DỰA TRÊN bối cảnh tài liệu được cung cấp ở trên.
2. Nếu câu trả lời không có trong tài liệu, hãy nói rõ: "Thông tin này không có trong tài liệu đã upload."
3. Luôn trích dẫn chính xác nguồn dưới định dạng: [📄 tên_file, trang X] (ví dụ: [📄 baitap.pdf, trang 3]). Nếu file txt không có trang, viết [📄 tên_file].
4. Dùng ngôn ngữ ấm áp, khuyến khích trẻ lớp 5-6 học tập. Trả lời bằng tiếng Việt.`
              :
              `You are a helpful AI study assistant answering questions based on the uploaded materials:
----------------------
${context}
----------------------
INSTRUCTIONS:
1. Answer questions ONLY based on the provided document context.
2. If not found, say: "This information is not available in the uploaded documents."
3. Always cite the exact source and page number in the format: [📄 filename, page X].
4. Warm and encouraging tone, respond in English.`;

            let targetModel = selectedModel;
            if (targetModel.includes('gemini-3-flash')) targetModel = 'gemini-2.5-flash';
            if (targetModel.includes('gemini-3-pro')) targetModel = 'gemini-2.5-pro';

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
                  { role: 'user', parts: [{ text: queryText }] }
                ],
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
            console.warn("Direct Google API call failed. Falling back to offline search.", googleErr);
          }
        }

        if (!clientFallbackSuccess) {
          // Offline Search Fallback
          if (!context || context.trim() === '' || context === 'No documents uploaded yet.') {
            responseText = isVi
              ? "Lớp học chưa tải lên tài liệu học tập nào. Thầy cô hãy vào mục 'Kho Kiến Thức' ở thanh menu để tải lên sách giáo khoa hoặc đề cương ôn tập nhé."
              : "No document context is available. Please upload files in the 'Kho Kiến Thức' tab first.";
          } else {
            const queryWords = queryText.toLowerCase()
              .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
              .split(/\s+/)
              .filter((w: string) => w.length > 2);
            
            let bestChunk = "";
            let bestSource = "";
            let maxMatches = 0;

            const pages = context.split(/\[Source: (.*?), Page: (\d+)\]/g);
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
                bestChunk = pageText.trim().substring(0, 320) + "...";
                bestSource = `[📄 ${fileName}, trang ${pageNum}]`;
              }
            }

            if (maxMatches > 0) {
              responseText = isVi
                ? `[Ngoại tuyến] Đã tìm thấy một phần thông tin liên quan trong tài liệu:\n\n"${bestChunk}"\n\nNguồn trích xuất: ${bestSource}`
                : `[Offline] Found matching information in documents:\n\n"${bestChunk}"\n\nSource: ${bestSource}`;
            } else {
              responseText = isVi
                ? "Thầy cô đang chạy ngoại tuyến và không tìm thấy kết quả từ khóa khớp trong tài liệu đã tải. Hãy kết nối internet để nhận câu trả lời đầy đủ từ AI."
                : "Offline mode: No keyword matches found in document pages. Please reconnect to get detailed AI feedback.";
            }
          }
          isOfflineMode = true;
        }
      }

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        role: 'model',
        text: responseText,
        timestamp: new Date(),
        isOffline: isOfflineMode
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Error processing request.');
    } finally {
      setIsTyping(false);
    }
  };

  // Format citations into clickable buttons to support "rõ nguồn"
  const renderMessageHTML = (text: string) => {
    // 1. Format math, bold, and escape HTML
    let html = formatMathText(text);

    // 2. Render citations as CLICKABLE buttons with data attributes
    html = html.replace(/\[📄\s*(.*?)(?:,?\s*(?:page|trang|p\.?|trang:|page:)?\s*(\d+))?\]/gi, (_, filename, page) => {
      let cleanFilename = filename.trim();
      if (cleanFilename.endsWith(',')) {
        cleanFilename = cleanFilename.slice(0, -1).trim();
      }
      const pageInfo = page ? `, p.${page}` : '';
      return `<button type="button" class="citation-btn inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 dark:hover:bg-indigo-900 text-[10px] font-bold border border-indigo-200/50 hover:border-indigo-350 shadow-3xs cursor-pointer transition-all active:scale-95" data-file="${cleanFilename}" data-page="${page || ''}">📄 ${cleanFilename.substring(0, 12)}${cleanFilename.length > 12 ? '...' : ''}${pageInfo} <span class="text-[8px] bg-indigo-250 dark:bg-indigo-800 text-indigo-850 px-1 rounded-full"><kbd class="font-sans">click</kbd></span></button>`;
    });

    // 3. Render bullet points
    const lines = html.split('\n');
    let inList = false;
    let listHtml = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList) {
          listHtml += '<ul class="list-disc pl-4 my-1.5 space-y-0.5">';
          inList = true;
        }
        listHtml += `<li>${line.substring(2)}</li>`;
      } else {
        if (inList) {
          listHtml += '</ul>';
          inList = false;
        }
        listHtml += line + (i < lines.length - 1 ? '<br />' : '');
      }
    }
    if (inList) listHtml += '</ul>';

    return <div dangerouslySetInnerHTML={{ __html: listHtml }} onClick={handleBubbleClick} className="space-y-1" />;
  };

  return (
    <>
      {/* Floating Action Button (FAB) at Bottom-Right */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3" id="floating_kb_widget">
        
        {/* Helper tooltip indicator when closed */}
        {!isOpen && documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900 text-white text-[10.5px] font-bold py-1.5 px-3 rounded-xl shadow-md border border-white/10 max-w-xs text-center select-none"
          >
            📚 {isVi ? `Tra cứu ${documents.length} tài liệu học tập lớp học` : `Ask Class Docs (${documents.length} files)`}
          </motion.div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-650 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer relative group border border-indigo-400"
          title={isVi ? 'Tra cứu từ điển tài liệu' : 'Class Document Dictionary'}
        >
          {isOpen ? <X className="h-6 w-6 animate-spin-once" /> : <BookOpen className="h-6 w-6 animate-pulse" />}
          {documents.length > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white border-2 border-white">
              {documents.length}
            </span>
          )}
        </button>
      </div>

      {/* Floating Side Drawer Q&A Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-6 z-40 w-full max-w-[390px] h-[520px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            id="floating_kb_panel"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-650 px-4 py-3 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <BookMarked className="h-4.5 w-4.5 text-indigo-200" />
                <div>
                  <h3 className="font-display font-bold text-xs sm:text-sm tracking-wide">
                    {isVi ? 'Từ Điển & Tra Cứu Tài Liệu' : 'Math Class Dictionary'}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5 text-[8.5px] text-indigo-150">
                    <Database className="h-2.5 w-2.5" />
                    <span>{documents.length} {isVi ? 'tài liệu được nạp' : 'files loaded'}</span>
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setIsOpen(false);
                  setPreviewSource(null);
                }} 
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Main Q&A Area */}
            <div className="flex-1 flex flex-col h-full min-h-0 relative">
              
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-900/50">
                {messages.map((msg) => {
                  const isCoach = msg.role === 'model';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      <div className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] shadow-3xs border ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white border-indigo-700'
                          : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-150/40'
                      }`}>
                        {msg.role === 'user' ? 'HS' : '📖'}
                      </div>
                      
                      <div className="space-y-1">
                        <div className={`p-3 rounded-2xl text-[11.5px] leading-relaxed shadow-3xs border ${
                          msg.role === 'user' 
                            ? 'bg-indigo-600 text-white border-indigo-700 rounded-tr-none' 
                            : 'bg-white dark:bg-slate-850 border-slate-200/55 dark:border-slate-800/80 rounded-tl-none text-slate-700 dark:text-slate-200'
                        }`}>
                          {renderMessageHTML(msg.text)}
                        </div>
                        <div className={`flex items-center gap-1 text-[8px] text-slate-400 px-1 ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}>
                          <Clock className="h-2.5 w-2.5" />
                          <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.isOffline && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-200/40 font-bold uppercase tracking-wider text-[7.5px]">
                              {isVi ? 'Offline' : 'Offline'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex gap-2 mr-auto max-w-[80%]">
                    <div className="h-7 w-7 rounded-full bg-white dark:bg-slate-800 border border-indigo-150/40 flex items-center justify-center shrink-0">
                      <RefreshCw className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
                    </div>
                    <div className="bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/40 p-2.5 rounded-2xl rounded-tl-none flex items-center gap-1 text-[11px] text-slate-500 font-medium italic">
                      <span className="h-1 w-1 rounded-full bg-indigo-500 animate-bounce delay-75"></span>
                      <span className="h-1 w-1 rounded-full bg-indigo-500 animate-bounce delay-150"></span>
                      <span className="h-1 w-1 rounded-full bg-indigo-500 animate-bounce delay-300"></span>
                      <span className="ml-1">{isVi ? 'Đang đọc nguồn...' : 'Reading sources...'}</span>
                    </div>
                  </div>
                )}
                {errorText && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-750 flex gap-2 items-start text-[11px] font-semibold">
                    <AlertOctagon className="h-4 w-4 text-red-500 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <p className="font-bold">{isVi ? 'Lỗi kết nối AI' : 'AI Connection Error'}</p>
                      <p className="font-mono mt-0.5 text-[9.5px] bg-red-100/30 p-1 rounded break-all">{errorText}</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Source page text preview drawer (CITATION PREVIEW overlay) */}
              <AnimatePresence>
                {previewSource && (
                  <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', damping: 22 }}
                    className="absolute inset-x-0 bottom-0 top-[20%] bg-slate-900 text-slate-100 z-10 rounded-t-3xl shadow-2xl flex flex-col p-4 border-t border-slate-800"
                    id="citation_preview_drawer"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold truncate pr-4">
                        <Eye className="h-4 w-4" />
                        <span className="truncate" title={previewSource.fileName}>
                          {previewSource.fileName}
                        </span>
                        {previewSource.pageNum && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-350">
                            p. {previewSource.pageNum}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewSource(null)}
                        className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto text-[11px] leading-relaxed font-mono whitespace-pre-line bg-slate-950 border border-slate-800 p-3 rounded-xl text-slate-300">
                      {isLoadingPreview ? (
                        <div className="flex flex-col items-center justify-center h-full py-8 space-y-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent" />
                          <span className="text-slate-500 text-[10px] font-sans">{isVi ? 'Đang trích xuất đoạn văn...' : 'Extracting document page...'}</span>
                        </div>
                      ) : (
                        previewText
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Input form */}
              <form 
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 shrink-0 bg-white"
              >
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={documents.length === 0 || isTyping}
                  placeholder={documents.length === 0 ? (isVi ? 'Hãy upload tài liệu trước...' : 'Upload documents first...') : (isVi ? 'Tra cứu hoặc hỏi tài liệu...' : 'Query dictionary/sources...')}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
                />
                
                <button
                  type="submit"
                  disabled={!inputText.trim() || documents.length === 0 || isTyping}
                  className="p-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white shadow-md disabled:opacity-50 transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
