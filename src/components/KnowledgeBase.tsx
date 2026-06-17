import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Trash2, 
  Send, 
  Sparkles, 
  FileText, 
  Database, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Clock,
  Layers,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { extractTextFromPDF } from '../lib/pdfExtractor';
import { 
  addDocument, 
  deleteDocument, 
  getDocumentsMetadata, 
  compileContextForChat, 
  DocumentMetadata 
} from '../lib/knowledgeStore';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isOffline?: boolean;
}

export default function KnowledgeBase() {
  const { language, t } = useLanguage();
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load documents metadata on mount
  useEffect(() => {
    loadDocuments();
    initGreeting();
  }, [language]);

  // Keep chat scrolled to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const loadDocuments = () => {
    const list = getDocumentsMetadata();
    setDocuments(list);
  };

  const initGreeting = () => {
    const welcomeMessage: Message = {
      id: 'welcome_kb',
      role: 'model',
      text: t('chatWelcome'),
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setErrorText('');
    setSuccessText('');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processUploadedFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorText('');
    setSuccessText('');
    const files = e.target.files;
    if (files && files.length > 0) {
      await processUploadedFile(files[0]);
      if (fileInputRef.current) fileInputRef.current.value = ''; // clear input
    }
  };

  // Process and extract text from PDF or TXT
  const processUploadedFile = async (file: File) => {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    if (fileType !== 'pdf' && fileType !== 'txt') {
      setErrorText(t('onlyTextAndPdf'));
      return;
    }

    // Max file size: 150MB
    const maxSize = 150 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorText(language === 'vi' 
        ? 'Kích thước file vượt quá 150MB. Vui lòng chọn file nhỏ hơn.' 
        : 'File size exceeds 150MB. Please select a smaller file.');
      return;
    }

    setIsProcessingFile(true);
    try {
      if (fileType === 'pdf') {
        // Extract using pdfjs-dist utility
        const result = await extractTextFromPDF(file);
        
        if (result.pageCount > 400) {
          setErrorText(language === 'vi'
            ? 'Tài liệu vượt quá 400 trang. Vui lòng chọn file nhỏ hơn.'
            : 'Document exceeds 400 pages. Please select a smaller file.');
          setIsProcessingFile(false);
          return;
        }

        await addDocument(file.name, 'pdf', file.size, result.pageCount, result.pages);
      } else {
        // Process plain text file
        const textContent = await readTextFile(file);
        const pages = [{ pageNum: 1, text: textContent }];
        await addDocument(file.name, 'txt', file.size, 1, pages);
      }

      setSuccessText(t('extractSuccess'));
      loadDocuments();
    } catch (err) {
      console.error('Error processing file:', err);
      setErrorText(t('extractError'));
    } finally {
      setIsProcessingFile(false);
    }
  };

  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const handleDeleteDocument = async (id: string, name: string) => {
    if (window.confirm(`${t('deleteDocConfirm')}\n"${name}"`)) {
      setErrorText('');
      setSuccessText('');
      await deleteDocument(id);
      loadDocuments();
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    
    const queryText = textOverride || inputText;
    if (!queryText.trim() || isTyping) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: queryText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textOverride) setInputText('');
    setIsTyping(true);
    setErrorText('');

    try {
      const context = await compileContextForChat();
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
            context,
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
        console.warn("Backend API failed. Initiating client-side direct Gemini / Search fallback.", backendErr);
        
        let clientFallbackSuccess = false;

        const isValidGeminiKey = (key: string | null | undefined): boolean => {
          if (!key) return false;
          const k = key.trim();
          return k.startsWith("AIzaSy") && k.length > 15;
        };

        if (isValidGeminiKey(apiKey)) {
          try {
            // Client-side prompt construction
            const systemPrompt = language === 'en'
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
                  { role: 'user', parts: [{ text: queryText }] }
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
            isOfflineMode = false;
            clientFallbackSuccess = true;
          } catch (googleErr) {
            console.warn("Direct Google API call failed. Falling back to offline search.", googleErr);
          }
        }

        if (!clientFallbackSuccess) {
          // Offline local keyword search logic
          if (!context || context.trim() === '' || context === 'No documents uploaded yet.') {
            responseText = language === 'vi'
              ? "Không có dữ liệu tài liệu học tập. Vui lòng kéo thả file sách/tài liệu ở cột bên trái trước."
              : "No document context is available. Please upload documents first.";
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
                bestChunk = pageText.trim().substring(0, 400) + "...";
                bestSource = `[📄 ${fileName}, trang ${pageNum}]`;
              }
            }

            if (maxMatches > 0) {
              responseText = language === 'vi'
                ? `[Chế độ Ngoại tuyến] Tìm thấy đoạn liên quan trong tài liệu:\n\n"${bestChunk}"\n\nNguồn: ${bestSource}`
                : `[Offline Mode] Found matching snippet in documents:\n\n"${bestChunk}"\n\nSource: ${bestSource}`;
            } else {
              responseText = language === 'vi'
                ? "Hệ thống đang chạy ngoại tuyến và không tìm thấy từ khóa trùng khớp trong tài liệu đã tải lên. Em hãy đặt câu hỏi khác hoặc kiểm tra kết nối mạng."
                : "System is offline, and no direct matches were found in documents. Please enter a different query or restore internet connection.";
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
      setErrorText(err.message || 'Error communicating with AI Assistant.');
    } finally {
      setIsTyping(false);
    }
  };

  // Helper formatting to render bullet points, bold text, citations, and LaTeX math style beautifully
  const renderMessageContent = (text: string) => {
    // 1. Escape HTML entities
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Parse inline LaTeX formulas \( ... \)
    html = html.replace(/\\\((.*?)\\\)/g, (_, formula) => {
      return `<span class="font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-150/40 font-semibold text-xs inline-block">${formula}</span>`;
    });

    // 3. Parse block LaTeX formulas $$ ... $$
    html = html.replace(/\$\$(.*?)\$\$/g, (_, formula) => {
      return `<div class="font-mono bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 p-3 my-2 rounded-xl border border-indigo-150/30 text-center font-bold text-sm block overflow-x-auto">${formula}</div>`;
    });

    // 4. Parse citations [📄 filename, page X] or [📄 filename]
    html = html.replace(/\[📄\s*(.*?),?\s*(?:page|trang)?\s*(\d+)?\]/gi, (_, filename, page) => {
      const pageInfo = page ? `, p.${page}` : '';
      return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200/50 shadow-sm ml-1 select-none pointer-events-none hover:bg-indigo-200 transition-colors" title="${filename}">📄 ${filename.substring(0, 15)}${filename.length > 15 ? '...' : ''}${pageInfo}</span>`;
    });

    // 5. Parse bold markdown **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 6. Parse bullet points
    const lines = html.split('\n');
    let inList = false;
    let listHtml = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList) {
          listHtml += '<ul class="list-disc pl-5 my-2 space-y-1">';
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
    if (inList) {
      listHtml += '</ul>';
    }

    return <div dangerouslySetInnerHTML={{ __html: listHtml }} className="space-y-1.5 break-words text-sm leading-relaxed" />;
  };

  // Helper stats
  const totalStats = () => {
    const docsCount = documents.length;
    const totalPages = documents.reduce((sum, doc) => sum + doc.pageCount, 0);
    const totalBytes = documents.reduce((sum, doc) => sum + doc.sizeBytes, 0);
    
    let sizeStr = '0 KB';
    if (totalBytes < 1024 * 1024) {
      sizeStr = `${(totalBytes / 1024).toFixed(1)} KB`;
    } else {
      sizeStr = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return { docsCount, totalPages, sizeStr };
  };

  const stats = totalStats();

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full h-[calc(100vh-100px)] min-h-[550px] text-slate-800 dark:text-slate-200">
      
      {/* LEFT COLUMN: Document Manager */}
      <div className="w-full lg:w-[320px] xl:w-[360px] flex flex-col gap-4 h-full shrink-0">
        
        {/* Document list & upload card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-xl flex flex-col p-5 h-full overflow-hidden">
          
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-sm">
              {t('uploadSectionTitle')}
            </h2>
          </div>

          {/* Drag and drop upload zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
              isDragOver 
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.98]' 
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt"
              className="hidden" 
            />
            {isProcessingFile ? (
              <>
                <RefreshCw className="h-7 w-7 text-indigo-500 animate-spin" />
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">
                  {t('processingPdf')}
                </p>
              </>
            ) : (
              <>
                <div className="p-2.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t('uploadPlaceholder')}
                </p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {t('fileLimitWarning')}
                </span>
              </>
            )}
          </div>

          {/* Alert text boxes */}
          <AnimatePresence>
            {errorText && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorText}</span>
              </motion.div>
            )}
            {successText && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-2 text-emerald-700 dark:text-emerald-300 text-xs"
              >
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successText}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Document list */}
          <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-2.5">
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8 text-slate-400 dark:text-slate-500 h-full">
                <FileText className="h-8 w-8 stroke-[1.5] mb-2 opacity-55" />
                <p className="text-xs font-medium max-w-[200px]">
                  {t('noDocuments')}
                </p>
              </div>
            ) : (
              documents.map((doc) => (
                <div 
                  key={doc.id}
                  className="group relative flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/60 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 hover:border-indigo-150/40 dark:hover:border-indigo-900/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-6">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-slate-700 dark:text-slate-200" title={doc.fileName}>
                        {doc.fileName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                        <span className="font-semibold px-1 rounded bg-slate-200/60 dark:bg-slate-800 uppercase text-[8px]">
                          {doc.fileType}
                        </span>
                        <span>•</span>
                        <span>{doc.pageCount} {t('docPages')}</span>
                        <span>•</span>
                        <span>{(doc.sizeBytes / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Statistics summary */}
          <div className="border-t border-slate-200/60 dark:border-slate-800/80 pt-4 mt-3 space-y-2 text-xs">
            <h3 className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[9px]">
              {t('totalStats')}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 dark:bg-slate-800/30 p-2 rounded-xl text-center border border-slate-100 dark:border-slate-800/30">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t('statsDocs')}</p>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">{stats.docsCount}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/30 p-2 rounded-xl text-center border border-slate-100 dark:border-slate-800/30">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t('statsPages')}</p>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">{stats.totalPages}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/30 p-2 rounded-xl text-center border border-slate-100 dark:border-slate-800/30">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t('statsSize')}</p>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 text-[11px] leading-6 mt-0.5 truncate">{stats.sizeStr}</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* RIGHT COLUMN: AI Chat Q&A */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-xl flex flex-col h-full overflow-hidden">
          
          {/* Chat header */}
          <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200 dark:shadow-none animate-pulse-subtle">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base leading-tight">
                  {t('aiChatTitle')}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                    {language === 'vi' ? 'Sẵn sàng tư vấn' : 'Agent Ready'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Database indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <Database className="h-3 w-3 text-indigo-500" />
              <span>
                {documents.length > 0 ? `${documents.length} source(s) cached` : '0 sources'}
              </span>
            </div>
          </div>

          {/* Chat bubbles container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Profile icon */}
                <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs shadow-sm border select-none ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-gradient-to-tr from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-150/40 dark:border-slate-700'
                }`}>
                  {msg.role === 'user' ? 'HS' : <Sparkles className="h-4 w-4 text-indigo-500" />}
                </div>

                {/* Message bubble */}
                <div className="space-y-1">
                  <div className={`p-3.5 rounded-2xl shadow-sm border ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white border-indigo-700 rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-800/80 rounded-tl-none text-slate-700 dark:text-slate-200'
                  }`}>
                    {renderMessageContent(msg.text)}
                  </div>
                  
                  {/* Timestamp & Offline badge */}
                  <div className={`flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 px-1 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <Clock className="h-2.5 w-2.5" />
                    <span>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.isOffline && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/40 font-bold uppercase tracking-wider text-[8px]">
                        {language === 'vi' ? 'Ngoại tuyến' : 'Offline'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 mr-auto max-w-[80%]">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-indigo-950/20 border border-indigo-150/40 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <RefreshCw className="h-4 w-4 text-indigo-500 animate-spin" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/40 dark:border-slate-800/60 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium italic">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce delay-75"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce delay-150"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce delay-300"></span>
                  <span className="ml-1">{language === 'vi' ? 'Đang phân tích tài liệu...' : 'Reading context...'}</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions bar */}
          <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-800/10 border-t border-slate-200/60 dark:border-slate-800/80 flex gap-2 overflow-x-auto shrink-0 select-none no-scrollbar">
            <button 
              disabled={documents.length === 0 || isTyping}
              onClick={() => handleSendMessage(undefined, language === 'vi' ? 'Hãy tóm tắt nội dung chính của tài liệu này giúp em.' : 'Summarize the core topics in these documents.')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-900 shadow-sm shrink-0 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              📝 {t('suggestSummary')}
            </button>
            <button 
              disabled={documents.length === 0 || isTyping}
              onClick={() => handleSendMessage(undefined, language === 'vi' ? 'Liệt kê các quy tắc toán học và công thức có trong tài liệu.' : 'List all mathematical rules and formulas in the documents.')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-900 shadow-sm shrink-0 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              🧮 {t('suggestFormulas')}
            </button>
            <button 
              disabled={documents.length === 0 || isTyping}
              onClick={() => handleSendMessage(undefined, language === 'vi' ? 'Giải thích các khái niệm cốt lõi trong các tài liệu này.' : 'Explain the core math concepts taught in these files.')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-900 shadow-sm shrink-0 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              💡 {t('suggestExplain')}
            </button>
            <button 
              disabled={documents.length === 0 || isTyping}
              onClick={() => handleSendMessage(undefined, language === 'vi' ? 'Hãy kiểm tra kiến thức của em bằng 3 câu hỏi trắc nghiệm dựa trên nội dung tài liệu này.' : 'Quiz me with 3 multiple choice questions based on the materials.')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-900 shadow-sm shrink-0 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              ❓ {t('suggestQuiz')}
            </button>
          </div>

          {/* Chat input form */}
          <form 
            onSubmit={handleSendMessage}
            className="p-4 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2.5 shrink-0 bg-slate-50/50 dark:bg-slate-800/20"
          >
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={documents.length === 0 || isTyping}
              placeholder={documents.length === 0 ? t('noDocuments') : t('kbChatPlaceholder')}
              className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs md:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner disabled:bg-slate-100 dark:disabled:bg-slate-900/60 disabled:cursor-not-allowed transition-all"
            />
            
            <button
              type="submit"
              disabled={!inputText.trim() || documents.length === 0 || isTyping}
              className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-none hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.96] shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
