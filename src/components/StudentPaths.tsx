/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Compass, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Lightbulb, 
  Play, 
  Check, 
  ChevronRight, 
  Flame, 
  Sparkles, 
  PenTool, 
  Bot, 
  Award,
  RefreshCw,
  X
} from 'lucide-react';
import { Unit, Lesson, Question, QuestionDifficulty, StudentProfile } from '../types';
import { BADGE_LIBRARY, GamificationService } from '../lib/gamification';
import { useLanguage } from '../lib/LanguageContext';
import GeometrySandbox from './GeometrySandbox';
import MathRunnerGame from './MathRunnerGame';
import { formatMathText } from '../lib/mathFormatter';
import QuestionVisualizer from './QuestionVisualizer';
import { getDocumentsMetadata, getDocumentPageText } from '../lib/knowledgeStore';

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

interface StudentPathsProps {
  units: Unit[];
  lessons: Lesson[];
  questions: Question[];
  student: StudentProfile;
  onUpdateStudent: (updater: (prev: StudentProfile) => StudentProfile) => void;
  onSaveAttempt: (attempt: any) => void;
  onSaveMistake: (mistakeLog: any) => void;
  onSaveReflection: (reflection: any) => void;
  openAICoach: (question: Question, currentAnswer: string) => void;
  coachCallCount: number;
}

export default function StudentPaths({
  units,
  lessons,
  questions,
  student,
  onUpdateStudent,
  onSaveAttempt,
  onSaveMistake,
  onSaveReflection,
  openAICoach,
  coachCallCount
}: StudentPathsProps) {
  const { language, t, getLangText } = useLanguage();

  const renderFormattedText = (text: string) => {
    return <span dangerouslySetInnerHTML={{ __html: formatMathText(text) }} />;
  };

  // Navigation State
  const [activeUnitId, setActiveUnitId] = useState<string>(units[0]?.id || 'unit_1');
  const [activeLessonId, setActiveLessonId] = useState<string>('lesson_1');
  const [activePhase, setActivePhase] = useState<'explore' | 'learn' | 'example' | 'practice' | 'reflection'>('explore');

  // Active Lesson Content
  const activeLesson = lessons.find(l => l.id === activeLessonId) || lessons[0];
  const lessonQuestions = questions.filter(q => q.lessonId === activeLessonId);

  // Practice Phase States
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [gameMode, setGameMode] = useState<boolean>(false);
  const activeQuestion = lessonQuestions[questionIndex] || lessonQuestions[0];
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [practiceFeedback, setPracticeFeedback] = useState<string>('');

  // Scratchpad Draw Toggle
  const [showScratchpad, setShowScratchpad] = useState<boolean>(false);
  const [scratchpadText, setScratchpadText] = useState<string>('');

  // Reflection Inputs
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, string>>({});
  const [reflectionSubmitted, setReflectionSubmitted] = useState<boolean>(false);
  const [reflectionGrade, setReflectionGrade] = useState<string>('');
  const [reflectionFeedback, setReflectionFeedback] = useState<string>('');
  const [isGrading, setIsGrading] = useState<boolean>(false);

  // Local Achievement Alert
  const [latestAwardMessage, setLatestAwardMessage] = useState<string | null>(null);

  // Textbook Extractor States
  const [isTextbookOpen, setIsTextbookOpen] = useState(false);
  const [textbookContent, setTextbookContent] = useState('');
  const [isExtractingTextbook, setIsExtractingTextbook] = useState(false);
  const [textbookError, setTextbookError] = useState('');

  // Curriculum & Objectives Modal States
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
  const [curriculumTab, setCurriculumTab] = useState<'core' | 'map'>('core');

  // Sync state whenever lesson changes
  useEffect(() => {
    setQuestionIndex(0);
    setUserAnswer('');
    setHasSubmitted(false);
    setIsCurrentCorrect(null);
    setShowHint(false);
    setPracticeFeedback('');
    setReflectionAnswers({});
    setReflectionSubmitted(false);
    setReflectionGrade('');
    setReflectionFeedback('');
    setIsGrading(false);
    setActivePhase('explore');
    setIsTextbookOpen(false);
    setTextbookContent('');
    setTextbookError('');
  }, [activeLessonId]);

  const handleOpenTextbook = async () => {
    setIsTextbookOpen(true);
    if (textbookContent && textbookContent.includes(`<!-- ${activeLessonId} -->`)) {
      return;
    }

    setIsExtractingTextbook(true);
    setTextbookError('');
    
    const mapping = LESSON_PDF_MAPPING[activeLessonId];
    if (!mapping) {
      setIsExtractingTextbook(false);
      setTextbookError(language === 'vi' ? 'Không tìm thấy thông tin trang sách cho bài học này.' : 'No page mapping found for this lesson.');
      return;
    }

    const targetPdfName = mapping.vol === 1 ? "Stage 6_LB_Vol 1 (1).pdf" : "Stage 6_LB_Vol 2.pdf";
    
    // Check if textbook exists in local IndexedDB
    try {
      const docs = getDocumentsMetadata();
      const matchedDoc = docs.find(d => 
        d.fileName.toLowerCase().includes(targetPdfName.toLowerCase()) || 
        (mapping.vol === 1 && d.fileName.toLowerCase().includes("vol 1")) ||
        (mapping.vol === 2 && d.fileName.toLowerCase().includes("vol 2"))
      );

      if (matchedDoc) {
        console.log(`[Textbook Client-Side] Found matching uploaded document locally: ${matchedDoc.fileName}`);
        let localText = '';
        for (let pNum = mapping.start; pNum <= mapping.end; pNum++) {
          const pageText = await getDocumentPageText(matchedDoc.fileName, pNum);
          if (pageText) {
            localText += `--- Page ${pNum} ---\n${pageText}\n\n`;
          }
        }

        if (localText.trim()) {
          const apiKey = localStorage.getItem('gemini_api_key') || '';
          if (apiKey && apiKey.trim().startsWith("AIzaSy")) {
            try {
              const selectedModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';
              let targetModel = selectedModel;
              if (targetModel.includes('gemini-3-flash')) targetModel = 'gemini-2.5-flash';
              if (targetModel.includes('gemini-3-pro')) targetModel = 'gemini-2.5-pro';

              const systemPrompt = language === 'vi' ? 
                `Bạn là giáo viên Toán lớp 6. Hãy tóm tắt nội dung thô sách giáo khoa này thành một tờ tóm tắt kiến thức ngắn gọn, dễ hiểu cho trẻ 11 tuổi bằng tiếng Việt.
Hãy định dạng đẹp bằng markdown, dùng icon sinh động.
Tổ chức thành 4 mục:
🌟 **Khái niệm cốt lõi (Core Concept)**
📝 **Quy tắc & Công thức (Rules & Formulas)**
💡 **Ví dụ trực quan (Visual Examples)**
🧠 **Mẹo nhớ nhanh (Memory Trick)`
                :
                `You are a friendly Grade 6 Math Coach. Create a kid-friendly study guide in English based on this textbook content.
Use markdown, emojis.
Organize into:
🌟 **Core Concept**
📝 **Rules & Formulas**
💡 **Visual Examples**
🧠 **Memory Trick`;

              const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ role: 'user', parts: [{ text: `Format this content:\n\n${localText.substring(0, 10000)}` }] }],
                  systemInstruction: { parts: [{ text: systemPrompt }] },
                  generationConfig: { temperature: 0.3 }
                })
              });

              if (googleResponse.ok) {
                const googleData = await googleResponse.json();
                const formattedText = googleData.candidates?.[0]?.content?.parts?.[0]?.text;
                if (formattedText) {
                  setTextbookContent(`<!-- ${activeLessonId} -->\n${formattedText}`);
                  setIsExtractingTextbook(false);
                  return;
                }
              }
            } catch (err) {
              console.warn("Client-side AI formatting of local textbook content failed, showing raw:", err);
            }
          }

          const rawTextGuide = language === 'vi' 
            ? `### 📚 TÀI LIỆU SÁCH GIÁO KHOA (${mapping.topic})\n*(Đang hiển thị nội dung trích xuất thô từ tài liệu đã nạp ở Kho Kiến Thức)*\n\n${localText}`
            : `### 📚 TEXTBOOK REFERENCE (${mapping.topic})\n*(Displaying raw extracted text from the document loaded in your Knowledge Base)*\n\n${localText}`;
          setTextbookContent(`<!-- ${activeLessonId} -->\n${rawTextGuide}`);
          setIsExtractingTextbook(false);
          return;
        }
      }
    } catch (localErr) {
      console.warn("Local IndexedDB lookup/extraction failed, trying backend:", localErr);
    }

    // Fallback: request backend server
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const selectedModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';

      let responseText = '';
      try {
        const response = await fetch('/api/textbook/extract', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'x-gemini-model': selectedModel
          },
          body: JSON.stringify({
            lessonId: activeLessonId,
            lang: language
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        responseText = data.text;
      } catch (backendErr) {
        console.warn("Backend API call failed for textbook extract, attempting static client-side fallback:", backendErr);
        responseText = language === 'vi'
          ? `### 📚 TÀI LIỆU SÁCH GIÁO KHOA (${mapping.topic})
          
*Không tìm thấy file "${targetPdfName}" trong Kho Kiến Thức và hệ thống không kết nối được với máy chủ để tự động tải.*

**Hướng dẫn cách tự khắc phục:**
1. Em (hoặc Thầy Cô) hãy vào mục **"Kho Kiến Thức"** ở thanh menu trên đầu.
2. Tải lên file sách giáo khoa **"${targetPdfName}"** (hoặc bất kỳ file PDF nào của học phần này).
3. Sau khi tải lên, nút **"Đọc Sách Giáo Khoa"** này sẽ tự động phân giải các trang ${mapping.start}-${mapping.end} và hiển thị trực tiếp cho em!`
          : `### 📚 TEXTBOOK REFERENCE (${mapping.topic})
          
*The file "${targetPdfName}" was not found in your local Knowledge Base, and the server could not be reached.*

**How to resolve:**
1. Go to the **"Knowledge Base"** tab in the top header.
2. Upload the textbook PDF file **"${targetPdfName}"** (or any PDF representing this Stage 6 volume).
3. Once uploaded, this **"Read Textbook"** button will automatically resolve pages ${mapping.start}-${mapping.end} and display them here!`;
      }
      setTextbookContent(`<!-- ${activeLessonId} -->\n${responseText}`);
    } catch (err: any) {
      console.error(err);
      setTextbookError(err.message || 'Unknown error');
    } finally {
      setIsExtractingTextbook(false);
    }
  };

  const handleOpenCurriculumModal = (tab: 'core' | 'map') => {
    setCurriculumTab(tab);
    setIsCurriculumModalOpen(true);
  };

  const executeAnswerEvaluation = (submittedAns: string) => {
    if (!submittedAns.trim()) return;

    let cleanUserAns = submittedAns.trim().toLowerCase().replace(/\s/g, '');
    let cleanCorrectAns = getLangText(activeQuestion.correctAnswer).trim().toLowerCase().replace(/\s/g, '');
    
    // Support basic alternative representations
    const isCorrect = cleanUserAns === cleanCorrectAns;

    setIsCurrentCorrect(isCorrect);
    setHasSubmitted(true);

    // Save Attempt log (compatible with our persistent store)
    const newAttempt = {
      id: Math.random().toString(36).substring(2, 9),
      studentId: student.id,
      questionId: activeQuestion.id,
      lessonId: activeLesson.id,
      unitId: activeUnitId,
      userAnswer: submittedAns,
      isCorrect: isCorrect,
      timestamp: new Date().toISOString()
    };
    onSaveAttempt(newAttempt);

    if (isCorrect) {
      setPracticeFeedback(t('correctAnswerMsg'));
      
      // Update student profile with XP and complete lessons
      onUpdateStudent(prev => {
        let newXp = prev.xp + GamificationService.XP_PER_CORRECT_ANSWER;
        let updatedCompletedLessons = [...prev.completedLessons];
        if (questionIndex === lessonQuestions.length - 1 && !updatedCompletedLessons.includes(activeLessonId)) {
          updatedCompletedLessons.push(activeLessonId);
        }

        // Streak computation
        const computedStreak = prev.streakDays + 1;

        // Auto badge logic
        const dummySolvedMap: Record<string, number> = {};
        dummySolvedMap[activeQuestion.topic] = 3; // simulate sufficient for badge
        const newlyUnlockedBadges = GamificationService.evaluateBadgeUnlocks(
          prev,
          dummySolvedMap,
          coachCallCount,
          prev.completedLessons.length
        );

        let finalBadges = [...prev.badges];
        if (newlyUnlockedBadges.length > 0) {
          finalBadges = [...finalBadges, ...newlyUnlockedBadges];
          const badgeTitles = newlyUnlockedBadges.map(bid => BADGE_LIBRARY[bid]?.title).join(", ");
          setLatestAwardMessage(language === 'vi' ? `🎉 Em vừa nhận huy hiệu mới: ${badgeTitles}!` : `🎉 You just unlocked a new badge: ${badgeTitles}!`);
        }

        return {
          ...prev,
          xp: newXp,
          streakDays: computedStreak,
          completedLessons: updatedCompletedLessons,
          badges: finalBadges,
          lastActiveDate: new Date().toISOString()
        };
      });

    } else {
      setPracticeFeedback(t('incorrectAnswerMsg'));
      
      // Save mistake profile for teacher diagnostics
      let category = language === 'vi' ? "Lỗi tính toán cơ bản" : "Calculation Error";
      if (activeQuestion.topic.includes("Decimal")) {
        category = language === 'vi' ? "Sai lệch chữ số Thập phân (Dịch dấu phẩy)" : "Decimal Placement Error";
      } else if (activeQuestion.topic.includes("Fraction") || activeQuestion.topic.includes("Equal")) {
        category = language === 'vi' ? "Phép chia Phân số chưa rút gọn" : "Fractions Equivalence Error";
      } else if (activeQuestion.topic.includes("Ratio") || activeQuestion.topic.includes("Proportion")) {
        category = language === 'vi' ? "Chia sai tổng số phần Tỉ lệ" : "Ratio/Proportion Scaling Error";
      } else if (activeQuestion.topic.includes("Transform") || activeQuestion.topic.includes("Symmetry")) {
        category = language === 'vi' ? "Lỗi đối xứng và biến hình" : "Transformation Geometry Error";
      }

      const newMistake = {
        id: Math.random().toString(36).substring(2, 9),
        studentId: student.id,
        studentName: student.name,
        questionId: activeQuestion.id,
        topic: activeQuestion.topic,
        skill: activeQuestion.skill,
        userAnswer: submittedAns,
        correctAnswer: getLangText(activeQuestion.correctAnswer),
        mistakeCategory: category,
        thinkingSkillImpacted: activeQuestion.thinkingSkill,
        timestamp: new Date().toISOString()
      };
      onSaveMistake(newMistake);
    }
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeAnswerEvaluation(userAnswer);
  };

  const handleNextQuestion = () => {
    if (questionIndex < lessonQuestions.length - 1) {
      setQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setHasSubmitted(false);
      setIsCurrentCorrect(null);
      setShowHint(false);
      setPracticeFeedback('');
    } else {
      // Completed all exercises, route to reflections
      setActivePhase('reflection');
    }
  };

  const handleReflectionSubmit = async () => {
    // Structure answers list
    const mappedAnswers = Object.entries(reflectionAnswers).map(([qText, ansVal]) => ({
      question: qText,
      response: ansVal
    }));

    setIsGrading(true);
    setReflectionSubmitted(true);

    const apiKey = localStorage.getItem('gemini_api_key') || '';
    const selectedModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';

    try {
      let grade = 'Good';
      let feedback = '';

      try {
        const response = await fetch('/api/gemini/grade-reflection', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'x-gemini-model': selectedModel
          },
          body: JSON.stringify({
            studentId: student.id,
            lessonId: activeLesson.id,
            answers: mappedAnswers,
            lang: language
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const result = await response.json();
        grade = result.grade || 'Good';
        feedback = result.feedback || '';
      } catch (backendErr) {
        console.warn("Backend API call failed for reflection grade, running client-side grading fallback:", backendErr);
        
        let totalLength = 0;
        let containsMathSymbols = false;
        const mathKeywords = ['denomin', 'decimal', 'place', 'value', 'fraction', 'mẫu số', 'tử số', 'quy đồng', 'phẩy', 'quay', 'đối xứng', 'tịnh tiến'];
        
        mappedAnswers.forEach(a => {
          const text = (a.response || '').toLowerCase();
          totalLength += text.length;
          if (mathKeywords.some(kw => text.includes(kw)) || /[\d\/\+\-\*]/.test(text)) {
            containsMathSymbols = true;
          }
        });

        if (totalLength < 10) {
          grade = "Needs Work";
          feedback = language === 'en'
            ? "Your reflection is very brief. Please elaborate on your mathematical steps next time."
            : "Phần tự ngẫm của em khá ngắn. Lần tới em hãy giải thích chi tiết hơn các bước tư duy nhé.";
        } else if (containsMathSymbols && totalLength > 25) {
          grade = "Master";
          feedback = language === 'en'
            ? "Excellent mathematical reasoning. You correctly justified your steps using key terminology."
            : "Lập luận toán học xuất sắc. Em đã giải thích các bước của mình rất rõ ràng bằng thuật ngữ chính xác.";
        } else {
          grade = "Good";
          feedback = language === 'en'
            ? "Good effort in your reflection. Focus on explaining why your calculations make sense."
            : "Nội dung tự ngẫm tốt. Em nên tập trung giải thích rõ hơn lý do đằng sau các phép tính.";
        }
      }

      setReflectionGrade(grade);
      setReflectionFeedback(feedback);

      // Save reflection record in local storage
      const loggedResponse = {
        id: Math.random().toString(36).substring(2, 9),
        studentId: student.id,
        lessonId: activeLesson.id,
        answers: mappedAnswers,
        timestamp: new Date().toISOString()
      };
      onSaveReflection(loggedResponse);

      // Reward for reflection thinking skills
      onUpdateStudent(prev => {
        let finalBadges = [...prev.badges];
        
        // Auto unlock Reviewer badge on reflection submission
        if (!finalBadges.includes('thoughtful_reviewer')) {
          finalBadges.push('thoughtful_reviewer');
          setLatestAwardMessage(language === 'vi' ? `🎉 Em vừa nhận huy hiệu: ${BADGE_LIBRARY['thoughtful_reviewer'].title}!` : `🎉 You just unlocked a new badge: ${BADGE_LIBRARY['thoughtful_reviewer'].title}!`);
        }

        return {
          ...prev,
          xp: prev.xp + GamificationService.XP_PER_REFLECTION,
          badges: finalBadges
        };
      });

    } catch (e: any) {
      console.error(e);
      setReflectionGrade('error');
      setReflectionFeedback(e.message || 'Unknown error');
    } finally {
      setIsGrading(false);
    }
  };

  // Renders dynamic, high-contrast, Cambridge standard fractions/decimals visualization
  const renderVisualAid = (type: string) => {
    if (type === 'fraction-bar') {
      return (
        <div className="my-5 rounded-xl border border-blue-100 bg-blue-50/40 p-4 shrink-0">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">
            {language === 'vi' ? 'Thanh phân số mẫu (12 phần bằng nhau):' : 'Fraction bar model (12 equal parts):'}
          </p>
          <div className="overflow-hidden rounded-lg border border-blue-200 bg-white shadow-xs">
            <div className="flex h-10 w-full font-mono">
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i} 
                  style={{ width: `${100 / 12}%` }}
                  className={`flex h-full items-center justify-center border-r border-blue-200 text-[10px] font-bold transition-all ${
                    i < 8 ? 'bg-blue-500 text-white' : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  1/12
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-blue-600">
              {language === 'vi' ? 'Đã tô màu: 8 ô (8/12)' : 'Shaded: 8 boxes (8/12)'}
            </span>
            <span className="font-semibold text-slate-600">
              {language === 'vi' ? 'Còn trống: 4 ô (4/12)' : 'Empty: 4 boxes (4/12)'}
            </span>
          </div>
        </div>
      );
    }

    if (type === 'decimal-grid') {
      return (
        <div className="my-5 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 shrink-0">
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">
            {language === 'vi' ? 'Hệ giá trị hàng số thập phân (Shift x10):' : 'Decimal Place Value Grid (Shift x10):'}
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-center font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-indigo-100 text-indigo-800">
                  <th className="border border-indigo-200 p-2 text-[10px]">{language === 'vi' ? 'Trăm (100)' : 'Hundreds (100)'}</th>
                  <th className="border border-indigo-200 p-2 text-[10px]">{language === 'vi' ? 'Chục (10)' : 'Tens (10)'}</th>
                  <th className="border border-indigo-200 p-2 text-[10px]">{language === 'vi' ? 'Đơn vị (1)' : 'Ones (1)'}</th>
                  <th className="border-y border-indigo-200 p-2 text-indigo-600 font-bold text-sm">.</th>
                  <th className="border border-indigo-200 p-2 text-[10px] text-indigo-600">{language === 'vi' ? 'Phần mười (1/10)' : 'Tenths (1/10)'}</th>
                  <th className="border border-indigo-200 p-2 text-[10px] text-indigo-600">{language === 'vi' ? 'Phần trăm (1/100)' : 'Hundredths (1/100)'}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="border border-indigo-100 p-2 text-slate-400">0</td>
                  <td className="border border-indigo-100 p-2 text-slate-400">0</td>
                  <td className="border border-indigo-100 p-2 font-bold text-slate-800">3</td>
                  <td className="p-2 font-bold text-indigo-600 text-base">.</td>
                  <td className="border border-indigo-100 p-2 font-bold text-slate-800">4</td>
                  <td className="border border-indigo-100 p-2 font-bold text-slate-800">5</td>
                </tr>
                <tr className="bg-indigo-50/50">
                  <td className="border border-indigo-100 p-2 text-slate-400">0</td>
                  <td className="border border-indigo-100 p-2 font-bold text-indigo-600">3</td>
                  <td className="border border-indigo-100 p-2 font-bold text-indigo-600">4</td>
                  <td className="p-2 font-bold text-indigo-600 text-base">.</td>
                  <td className="border border-indigo-100 p-2 font-bold text-indigo-600">5</td>
                  <td className="border border-indigo-100 p-2 text-slate-400">0</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 text-center italic">
            {language === 'vi'
              ? 'Khi nhân 3,45 với 10, mỗi chữ số dịch chuyển sang trái 1 cột tương đương dấu phẩy dịch sang phải tạo thành 34,5'
              : 'When multiplying 3.45 by 10, each digit shifts one column to the left, which is equivalent to moving the decimal point one place to the right to make 34.5'}
          </p>
        </div>
      );
    }

    if (type === 'percentage-circle') {
      return (
        <div className="my-5 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            <svg viewBox="0 0 36 36" className="h-20 w-20">
              <path
                className="text-slate-100 fill-none stroke-current"
                strokeWidth="4"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 fill-none stroke-current"
                strokeWidth="4"
                strokeDasharray="60, 100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-display text-xs font-bold text-emerald-600">
              60%
            </div>
          </div>
          <div className="text-xs">
            <p className="font-semibold text-slate-700">
              {language === 'vi' ? 'Biểu đồ phần trăm hình tròn:' : 'Percentage Circle Diagram:'}
            </p>
            <p className="text-slate-500 mt-1">
              {language === 'vi'
                ? 'Đại diện cho phân số 3/5. Tử số 3 chiếm 3 phần trên tổng 5 phần bằng nhau tạo nên tỉ số: 60/100 hay 60%.'
                : 'Represents the fraction 3/5. The numerator 3 occupies 3 out of 5 equal parts, creating the ratio 60/100 or 60%.'}
            </p>
          </div>
        </div>
      );
    }

    if (type === 'transform-sandbox' || type === 'symmetry-playground') {
      return (
        <div className="my-5">
          <GeometrySandbox />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="student_workspace_root">
      
      {/* Dynamic Unlocks/Alert Messages */}
      <AnimatePresence>
        {latestAwardMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800"
            id="gamification_toast"
          >
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600 animate-bounce" />
              <p className="text-xs font-bold">{latestAwardMessage}</p>
            </div>
            <button 
              onClick={() => setLatestAwardMessage(null)}
              className="text-xs font-semibold hover:underline text-emerald-600 ml-4"
            >
              {language === 'vi' ? 'Đồng ý' : 'Dismiss'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* LEFT COLUMN: Topic Sidebar navigation map */}
        <div className="lg:col-span-4" id="curriculum_roadmap_panel">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            
            {/* Title */}
            <div className="mb-4">
              <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base">
                {language === 'vi' ? 'Hạt nhân Lộ trình học' : 'Curriculum Pathway'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'vi' ? 'Giáo trình chuẩn Cambridge' : 'Cambridge CAIE Standards'}
              </p>
            </div>

            {/* Unit Toggle Tabs */}
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1 mb-5" id="unit_selector_tabs">
              {units.map(unit => (
                <button
                  key={unit.id}
                  onClick={() => {
                    setActiveUnitId(unit.id);
                    // Match first lesson of that new unit
                    const firstL = lessons.find(l => l.unitId === unit.id);
                    if (firstL) {
                      setActiveLessonId(firstL.id);
                    }
                  }}
                  className={`rounded-lg py-2 text-[11px] font-bold transition-all ${
                    activeUnitId === unit.id
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {unit.code}
                </button>
              ))}
            </div>

            {/* Active Unit Description */}
            <div className="mb-4 rounded-xl bg-blue-50/40 border border-blue-50 p-3.5">
              <p className="text-[10px] font-bold tracking-wider text-blue-600 uppercase mb-1">
                {language === 'vi' ? 'Đang học chương' : 'Active Unit'}
              </p>
              <h4 className="text-xs font-bold text-slate-800">
                {getLangText(units.find(u => u.id === activeUnitId)?.title)}
              </h4>
            </div>

            {/* Lesson timeline list inside Active Unit */}
            <div className="space-y-2" id="lessons_list_timeline">
              {lessons.filter(l => l.unitId === activeUnitId).map(lesson => {
                const isCompleted = student.completedLessons.includes(lesson.id);
                const isActive = lesson.id === activeLessonId;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLessonId(lesson.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all relative overflow-hidden ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50/20' 
                        : 'border-slate-150 hover:bg-slate-50'
                    }`}
                  >
                    {/* Tick for completion status */}
                    <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      isCompleted 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600' 
                        : 'border-slate-300 bg-white text-slate-400'
                    }`}>
                      {isCompleted ? <Check className="h-3 w-3" /> : <Play className="h-2 w-2 ml-0.5" />}
                    </div>

                    <div className="text-xs">
                      <p className={`font-semibold ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                        {lesson.code} - {getLangText(lesson.title)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {lesson.learningObjectives.map((obj, oi) => (
                          <span key={oi} className="rounded bg-slate-100 border border-slate-200 text-[8.5px] px-1 text-slate-500">
                            {obj.split(' - ')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Active Lesson Study & Play Stage */}
        <div className="lg:col-span-8" id="lesson_stage_stage_panel">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            
            {/* Lesson Title Summary Header */}
            <div className="mb-6 flex flex-col justify-between border-b border-slate-100 pb-5 md:flex-row md:items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeLesson.code} • Lesson Course</p>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl font-display">{getLangText(activeLesson.title)}</h2>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 md:mt-0">
                <button
                  type="button"
                  onClick={handleOpenTextbook}
                  className="rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1 text-[10px] font-bold text-emerald-700 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>📚 {language === 'vi' ? 'Đọc Sách Giáo Khoa' : 'Read Textbook'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCurriculumModal('core')}
                  className="rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-1 text-[10px] font-bold text-blue-700 transition-all cursor-pointer"
                >
                  Cambridge Core
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCurriculumModal('map')}
                  className="rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-1 text-[10px] font-bold text-rose-700 transition-all cursor-pointer"
                >
                  Cambridge Math Map
                </button>
              </div>
            </div>

            {/* Stepper Phase selector as a Journey Roadmap */}
            <div className="mb-8 p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100/60" id="lesson_stepper_strip">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 text-center">
                {language === 'vi' ? 'Hành trình chinh phục bài học 🚀' : 'Learning Journey Roadmap 🚀'}
              </p>
              <nav className="flex items-center justify-between gap-2 max-w-xl mx-auto text-xs relative px-4">
                {/* Connector line */}
                <div className="absolute top-1/2 left-6 right-6 h-1 bg-slate-200 -translate-y-1/2 z-0" />
                
                {(['explore', 'learn', 'example', 'practice', 'reflection'] as const).map((phase, idx) => {
                  const isActive = activePhase === phase;
                  const labelMap = {
                    explore: language === 'vi' ? 'Khám phá 🔍' : 'Explore 🔍',
                    learn: language === 'vi' ? 'Bài học 📖' : 'Theory 📖',
                    example: language === 'vi' ? 'Ví dụ 💡' : 'Example 💡',
                    practice: language === 'vi' ? 'Thử thách ⚡' : 'Practice ⚡',
                    reflection: language === 'vi' ? 'Nhật ký ✍️' : 'Diary ✍️'
                  };

                  return (
                    <button
                      key={phase}
                      type="button"
                      onClick={() => setActivePhase(phase)}
                      className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none"
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold transition-all shadow-sm border ${
                        isActive 
                          ? 'bg-blue-600 text-white border-blue-600 scale-110 ring-4 ring-blue-100' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={`text-[9.5px] sm:text-[10px] font-bold tracking-tight whitespace-nowrap transition-colors ${
                        isActive ? 'text-blue-650 font-extrabold' : 'text-slate-550'
                      }`}>
                        {labelMap[phase]}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* SECTION 1: EXPLORE VIEW */}
            {activePhase === 'explore' && (
              <div className="space-y-5" id="explore_view_container">
                <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5">
                  <div className="flex gap-2 mb-2 text-blue-600">
                    <Compass className="h-5 w-5 animate-spin" />
                    <span className="text-[11px] font-bold tracking-widest uppercase">
                      {language === 'vi' ? 'Tình huống khám phá (Real Scenario)' : 'Real-World Exploration'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700 font-medium whitespace-pre-line">
                    {renderFormattedText(getLangText(activeLesson.explore.scenario))}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">
                    {language === 'vi' ? 'Thách thức tư duy toán:' : 'Mathematical Challenge:'}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    {renderFormattedText(getLangText(activeLesson.explore.question))}
                  </p>
                  
                  {/* Step Hint */}
                  <div className="mt-4 border-l-4 border-amber-500 bg-amber-50/50 p-3 text-[11px] text-slate-700">
                    <strong>{language === 'vi' ? 'Gợi ý ban đầu của thầy cô:' : 'Initial Teacher Hint:'}</strong> {renderFormattedText(getLangText(activeLesson.explore.initialHint))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActivePhase('learn')}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 text-xs font-bold active:scale-95 transition-all"
                  >
                    <span>{language === 'vi' ? 'Vào học Kiến thức cốt lõi' : 'Proceed to Learn Core Theory'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 2: LEARN VIEW */}
            {activePhase === 'learn' && (
              <div className="space-y-6" id="learn_view_container">
                
                {/* Visualaid render component */}
                {activeLesson.learn.visualAidType && renderVisualAid(activeLesson.learn.visualAidType)}

                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                    {language === 'vi' ? 'Khung kiến thức toán học' : 'Theoretical Concepts'}
                  </h3>
                  <div className="text-slate-700 text-xs leading-relaxed whitespace-pre-line prose max-w-none">
                    {renderFormattedText(getLangText(activeLesson.learn.content))}
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setActivePhase('explore')}
                    className="flex items-center gap-1 px-4 py-3 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                  >
                    {language === 'vi' ? 'Xem lại tình huống' : 'Back to Exploration'}
                  </button>
                  <button
                    onClick={() => setActivePhase('example')}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 text-xs font-bold active:scale-95 transition-all"
                  >
                    <span>{language === 'vi' ? 'Xem Ví dụ mẫu từng bước' : 'View Step-by-Step Example'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 3: EXAMPLE VIEW */}
            {activePhase === 'example' && (
              <div className="space-y-6" id="example_view_container">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-5">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">
                    {language === 'vi' ? 'Mẫu toán chuẩn' : 'Mathematical Example'}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 leading-relaxed font-display">
                    {renderFormattedText(getLangText(activeLesson.example.problem))}
                  </h4>
                </div>

                {/* Step-by-Step Accordion List */}
                <div className="space-y-3">
                  {activeLesson.example.steps.map((step, sIdx) => (
                    <div key={sIdx} className="rounded-xl border border-slate-150 bg-white p-4 text-xs font-medium relative">
                      <div className="absolute top-4 left-4 h-6 w-6 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[10px] flex items-center justify-center border border-indigo-100">
                        {sIdx + 1}
                      </div>
                      <div className="ml-8">
                        <p className="font-bold text-slate-800 mb-1">{renderFormattedText(getLangText(step.title))}</p>
                        <p className="text-slate-500 text-[11px] leading-relaxed mb-2">{renderFormattedText(getLangText(step.description))}</p>
                        {step.mathExpression && (
                          <div className="rounded-lg bg-slate-50 border border-slate-100 p-2 font-mono text-indigo-600 font-bold text-xs">
                            {renderFormattedText(step.mathExpression)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setActivePhase('learn')}
                    className="flex items-center gap-1 px-4 py-3 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                  >
                    {language === 'vi' ? 'Xem lý thuyết' : 'Review Theory'}
                  </button>
                  <button
                    onClick={() => setActivePhase('practice')}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 text-xs font-bold active:scale-95 transition-all animate-bounce"
                  >
                    <span>{language === 'vi' ? 'Vào Luyện tập Nhận XP!' : 'Go to Practice & Earn XP!'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 4: PRACTICE VIEW (QUIZ ENGINE) */}
            {activePhase === 'practice' && (
              <div className="space-y-6" id="practice_view_container">
                {!activeQuestion ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
                    <p className="text-xs text-slate-500 font-medium">
                      {language === 'vi' 
                        ? 'Bài học này hiện chưa có câu hỏi luyện tập tự động.'
                        : 'This lesson does not have practice questions yet.'}
                    </p>
                    <p className="text-xs text-slate-700 font-bold">
                      {language === 'vi'
                        ? 'Em hãy nhấp nút "Đọc Sách Giáo Khoa 📚" ở góc trên bên phải để xem tài liệu tóm tắt kiến thức của bài học nhé!'
                        : 'Click the "Read Textbook 📚" button in the top right to study the summarized textbook contents!'}
                    </p>
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={handleOpenTextbook}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <span>📚 {language === 'vi' ? 'Đọc Sách Giáo Khoa' : 'Read Textbook'}</span>
                      </button>
                    </div>
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => setActivePhase('reflection')}
                        className="text-xs text-blue-650 hover:underline font-bold cursor-pointer"
                      >
                        {language === 'vi' ? 'Đi thẳng tới phần Nhật ký học tập ✍️' : 'Go directly to Learning Diary ✍️'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Active Question progress header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="text-xs">
                    <span className="font-bold text-slate-500">{language === 'vi' ? 'Bài tập: ' : 'Question: '}</span>
                    <span className="font-mono font-bold text-blue-600">{questionIndex + 1}</span> / <span className="font-mono">{lessonQuestions.length}</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: lessonQuestions.length }).map((_, qi) => {
                      const evaluated = qi < questionIndex;
                      const isCurrent = qi === questionIndex;
                      return (
                        <div 
                          key={qi} 
                          className={`h-1.5 w-6 rounded-full transition-all ${
                            isCurrent ? 'bg-blue-600 w-8' : evaluated ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Game Mode Selector Toggle */}
                <div className="flex justify-end mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGameMode(!gameMode);
                      // Reset answers on toggle
                      setUserAnswer('');
                      setHasSubmitted(false);
                      setIsCurrentCorrect(null);
                    }}
                    className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all ${
                      gameMode 
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{gameMode ? '📝 ' + (language === 'vi' ? 'Luyện tập Thường' : 'Standard Quiz') : '🎮 ' + (language === 'vi' ? 'Luyện tập Game' : 'Gamified Practice')}</span>
                  </button>
                </div>

                {gameMode ? (
                  <MathRunnerGame
                    question={activeQuestion}
                    onAnswerSubmit={(ans) => {
                      setUserAnswer(ans);
                      executeAnswerEvaluation(ans);
                    }}
                    isCorrect={isCurrentCorrect}
                    hasSubmitted={hasSubmitted}
                    onNext={handleNextQuestion}
                  />
                ) : (
                  <>
                    {/* Main Question Display */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4" id="active_quiz_card">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="rounded bg-indigo-50 border border-indigo-150 px-2 py-0.5 text-indigo-700">
                          {language === 'vi' ? 'Chủ đề' : 'Topic'}: {activeQuestion.topic}
                        </span>
                        <span className={`px-2 py-0.5 rounded uppercase tracking-wider ${
                          activeQuestion.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700' :
                          activeQuestion.difficulty === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {activeQuestion.difficulty}
                        </span>
                      </div>

                      <p className="text-slate-800 font-display font-medium text-sm leading-relaxed whitespace-pre-line pt-2">
                        {renderFormattedText(getLangText(activeQuestion.questionText))}
                      </p>

                      <QuestionVisualizer 
                        question={activeQuestion}
                        userAnswer={userAnswer}
                        onChangeAnswer={setUserAnswer}
                      />
                    </div>

                    {/* Scratchpad drafting tool */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs" id="scratchpad_tool">
                      <button
                        type="button"
                        onClick={() => setShowScratchpad(!showScratchpad)}
                        className="flex w-full items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        <span className="flex items-center gap-1.5">
                          <PenTool className="h-4 w-4 text-slate-500" />
                          {t('scratchpad')}
                        </span>
                        <span>{showScratchpad ? (language === 'vi' ? 'Đóng nháp' : 'Close pad') : (language === 'vi' ? 'Mở nháp' : 'Open pad')}</span>
                      </button>

                      {showScratchpad && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={scratchpadText}
                            onChange={(e) => setScratchpadText(e.target.value)}
                            placeholder={t('scratchpadPlaceholder')}
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 p-2 text-xs font-mono bg-slate-50/50 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Form submit logic */}
                    <form onSubmit={handleAnswerSubmit} className="space-y-4" id="quiz_form">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                          {language === 'vi' ? 'ĐIỀN ĐÁP ÁN CỦA EM' : 'ENTER YOUR ANSWER'}
                        </p>

                        {activeQuestion.type === 'numeric' || activeQuestion.type === 'text-input' ? (
                          <input
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            disabled={hasSubmitted}
                            placeholder={activeQuestion.type === 'numeric' ? (language === 'vi' ? 'Ghi kết quả dạng số (e.g., 34.2 hoặc 2/3)...' : 'Enter a numeric value (e.g., 34.2 or 2/3)...') : (language === 'vi' ? 'Nhập câu trả lời tối giản...' : 'Enter simplified text answer...')}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed font-semibold focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        ) : null}
                      </div>

                      {/* Submission and error diagnostics */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        
                        {/* Consult Socratic Coach Option */}
                        <div>
                          {!hasSubmitted ? (
                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setShowHint(!showHint)}
                                className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
                              >
                                <Lightbulb className="h-4.5 w-4.5" />
                                <span>{showHint ? (language === 'vi' ? 'Ẩn gợi ý toán học' : 'Hide mathematical hint') : (language === 'vi' ? 'Xem gợi ý toán học' : 'Show mathematical hint')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleOpenTextbook}
                                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                              >
                                <BookOpen className="h-4.5 w-4.5" />
                                <span>{language === 'vi' ? 'Đọc Sách Giáo Khoa 📚' : 'Read Textbook 📚'}</span>
                              </button>
                            </div>
                          ) : !isCurrentCorrect ? (
                            <button
                              type="button"
                              onClick={() => openAICoach(activeQuestion, userAnswer)}
                              className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 text-xs font-bold transition-all animate-pulse"
                            >
                              <Bot className="h-4.5 w-4.5" />
                              <span>{language === 'vi' ? 'Hỏi AI Math Coach (Tự Sửa Lỗi Sai)' : 'Ask AI Math Coach (Self-Correct)'}</span>
                            </button>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                          {!hasSubmitted ? (
                            <button
                              type="submit"
                              disabled={!userAnswer.trim()}
                              className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-6 py-3 text-xs font-bold transition-all disabled:opacity-55 disabled:scale-100"
                            >
                              {t('submitBtn')}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleNextQuestion}
                              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 text-xs font-bold transition-all"
                            >
                              <span>{questionIndex === lessonQuestions.length - 1 ? (language === 'vi' ? 'Vào phần Tự Ngẫm' : 'Go to Reflection') : (language === 'vi' ? 'Tiếp tục bài sau' : 'Next Question')}</span>
                              <ChevronRight className="h-4.5 w-4.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </form>
                  </>
                )}

                {/* Socratic static hint sheet */}
                {showHint && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 font-medium text-xs text-slate-700"
                  >
                    <p className="font-bold text-amber-800 flex items-center gap-1 mb-1">
                      <Lightbulb className="h-4 w-4" />
                      {language === 'vi' ? 'Gợi ý giáo viên của em:' : 'Teacher Hint:'}
                    </p>
                    <p>{renderFormattedText(getLangText(activeQuestion.hint))}</p>
                  </motion.div>
                )}

                {/* Submitting visual feedback result state */}
                {hasSubmitted && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-2xl p-5 border flex flex-col md:flex-row gap-4 items-start ${
                      isCurrentCorrect 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                        : 'bg-red-50/70 border-red-100 text-slate-800'
                    }`}
                  >
                    <div className="shrink-0 mt-1">
                      {isCurrentCorrect ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-sm mb-1">
                        {isCurrentCorrect ? (language === 'vi' ? 'Chính xác! (+20 XP)' : 'Correct! (+20 XP)') : (language === 'vi' ? 'Có một chút nhầm lẫn rồi!' : 'Not quite right!')}
                      </p>
                      <p className="leading-relaxed mb-3">{practiceFeedback}</p>
                      
                      {!isCurrentCorrect && (
                        <div className="rounded-xl bg-white border border-red-100 p-3.5 space-y-2 text-slate-600">
                          <p className="font-bold text-red-600">{language === 'vi' ? 'Học hỏi từ điểm sai:' : 'Learning from mistake:'}</p>
                          <p><strong className="text-slate-800">{language === 'vi' ? 'Lỗi thường gặp:' : 'Common mistake:'}</strong> {renderFormattedText(getLangText(activeQuestion.commonMistake))}</p>
                          <p><strong className="text-slate-800">{language === 'vi' ? 'Phương án giải khoa học:' : 'Explanation:'}</strong> {renderFormattedText(getLangText(activeQuestion.explanation))}</p>
                        </div>
                      )}

                      {isCurrentCorrect && (
                        <div className="rounded-xl bg-white border border-emerald-150 p-3 text-slate-600">
                          <p className="font-bold text-emerald-700">{language === 'vi' ? 'Tư duy được phát triển:' : 'Thinking skill developed:'} {activeQuestion.thinkingSkill}</p>
                          <p className="mt-1">{renderFormattedText(getLangText(activeQuestion.solution))}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
                  </>
                )}

              </div>
            )}

            {/* SECTION 5: REFLECTION VIEW */}
            {activePhase === 'reflection' && (
              <div className="space-y-6" id="reflection_view_container">
                <div className="rounded-xl border border-blue-100 bg-blue-50/25 p-5">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                    {language === 'vi' ? 'Nhật ký Toán học của em ✍️' : 'My Math Diary ✍️'}
                  </p>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {getLangText(activeLesson.reflection.prompt)}
                  </p>
                </div>

                {!reflectionSubmitted ? (
                  <div className="space-y-4">
                    {activeLesson.reflection.guidingQuestions.map((qText, qi) => {
                      const questionStr = getLangText(qText);
                      return (
                        <div key={qi} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs">
                          <p className="font-bold text-slate-800">{questionStr}</p>
                          <textarea
                            placeholder={language === 'vi' ? 'Điền tự đánh giá, cách tư duy hay cách giải khác của em...' : 'Enter your reflection, thinking process, or alternative solution...'}
                            rows={3}
                            value={reflectionAnswers[questionStr] || ''}
                            onChange={(e) => setReflectionAnswers(prev => ({
                              ...prev,
                              [questionStr]: e.target.value
                            }))}
                            className="w-full rounded-lg border border-slate-200 p-2.5 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      );
                    })}

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleReflectionSubmit}
                        disabled={Object.keys(reflectionAnswers).length < activeLesson.reflection.guidingQuestions.length}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-xs font-bold transition-all disabled:opacity-55"
                      >
                        {t('submitReflectionBtn')} (+30 XP)
                      </button>
                    </div>
                  </div>
                ) : isGrading ? (
                  <div className="rounded-2xl border border-indigo-150 bg-indigo-50/20 p-6 text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mx-auto" />
                    <p className="text-xs font-bold text-indigo-700 uppercase animate-pulse">
                      {language === 'vi' ? 'AI Coach đang đánh giá lập luận toán học...' : 'AI Coach grading mathematical proof...'}
                    </p>
                  </div>
                ) : reflectionGrade === 'error' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-red-150 bg-red-50/40 p-6 text-center space-y-4 font-sans"
                  >
                    <XCircle className="h-10 w-10 text-red-600 mx-auto animate-pulse" />
                    <div>
                      <h3 className="font-display font-bold text-red-800 text-base">
                        {language === 'vi' ? 'Đã dừng do lỗi' : 'Stopped due to error'}
                      </h3>
                      <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                        {language === 'vi'
                          ? `Hệ thống phản hồi lỗi: "${reflectionFeedback}". Em hãy kiểm tra lại cấu hình API key.`
                          : `System reported error: "${reflectionFeedback}". Please check your API key settings.`}
                      </p>
                    </div>
                    <div className="flex justify-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          setReflectionSubmitted(false);
                          setReflectionGrade('');
                          setReflectionFeedback('');
                        }}
                        className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md"
                      >
                        {language === 'vi' ? 'Thử lại' : 'Retry'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 text-center space-y-4"
                  >
                    <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto animate-bounce" />
                    <div>
                      <h3 className="font-display font-bold text-emerald-800 text-base">
                        {language === 'vi' ? 'Hoàn tất buổi học rực rỡ!' : 'Lesson Completed Brilliantly!'}
                      </h3>
                      <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                        {language === 'vi'
                          ? 'Thầy cô đã nhận được ý kiến tự ngẫm và lập định luận lý toán học của em. Level và XP của em đã tăng vượt trội!'
                          : 'Your reflection and mathematical reasoning have been recorded. Your Level and XP have increased!'}
                      </p>
                    </div>

                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs px-4 py-1.5 font-bold">
                      <Award className="h-4 w-4" />
                      {language === 'vi' ? 'Ghi nhận +30 XP thành quả tư duy' : 'Gained +30 XP for reflective thinking'}
                    </div>

                    {reflectionGrade && (
                      <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200 text-left space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">{language === 'vi' ? 'Nhận xét từ AI Math Coach:' : 'AI Coach Proof Feedback:'}</span>
                          <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] border ${
                            reflectionGrade === 'Master' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            reflectionGrade === 'Good' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {language === 'vi' 
                              ? (reflectionGrade === 'Master' ? 'Thành thạo (Master)' : reflectionGrade === 'Good' ? 'Đạt chuẩn (Good)' : 'Cần cố gắng (Needs Work)')
                              : reflectionGrade}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          "{reflectionFeedback}"
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Back button */}
                <div className="flex justify-start">
                  <button
                    onClick={() => setActivePhase('practice')}
                    className="flex items-center gap-1 px-4 py-3 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                  >
                    {language === 'vi' ? 'Xem lại bài tập luyện tập' : 'Review practice questions'}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>

      {/* Textbook Companion Modal */}
      {isTextbookOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col max-h-[85vh] relative" role="dialog">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600 animate-pulse" />
                <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base">
                  {language === 'vi' ? 'Sách Giáo Khoa Thông Minh 📖' : 'Smart Textbook Reference 📖'}
                </h3>
              </div>
              <button 
                onClick={() => setIsTextbookOpen(false)} 
                className="text-slate-400 hover:text-slate-650 transition-colors p-1.5 rounded-lg hover:bg-slate-50 border border-slate-200"
              >
                <span className="font-bold text-xs">{language === 'vi' ? 'Đóng' : 'Close'}</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              {isExtractingTextbook ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" />
                  <p className="font-bold text-emerald-700 animate-pulse">
                    {language === 'vi' ? 'Đang mở sách và trích xuất kiến thức...' : 'Opening textbook and extracting concepts...'}
                  </p>
                </div>
              ) : textbookError ? (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 font-semibold space-y-2">
                  <p>{language === 'vi' ? 'Không thể mở sách tự động:' : 'Could not open textbook:'}</p>
                  <p className="font-mono text-[10.5px] bg-red-100/50 p-2 rounded">{textbookError}</p>
                  <p className="text-[10px] font-normal leading-relaxed text-red-550">
                    {language === 'vi' 
                      ? 'Lưu ý: Hãy chắc chắn em đã nhập API key ở mục thiết lập (nút răng cưa ở thanh tiêu đề).'
                      : 'Please verify that you have entered your API Key in settings (gear icon on header).'}
                  </p>
                </div>
              ) : (
                <div className="prose max-w-none text-slate-700 leading-relaxed font-medium whitespace-pre-line bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                  {textbookContent.replace(/<!--.*?-->\n/, '')}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                onClick={() => setIsTextbookOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center transition-colors shadow-md cursor-pointer"
              >
                {language === 'vi' ? 'Đã hiểu!' : 'Got it!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Curriculum & Objectives Modal */}
      {isCurriculumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col max-h-[85vh] relative" role="dialog">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-150 pb-3.5">
              <div className="flex items-center gap-2.5">
                <Compass className="h-5.5 w-5.5 text-blue-600" />
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base tracking-wide">
                    {language === 'vi' ? 'Bản Đồ Chương Trình & Tiêu Chuẩn Cambridge' : 'Cambridge Standards & Learning Map'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{activeLesson.code} • Stage 6 Math</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCurriculumModalOpen(false)} 
                className="text-slate-450 hover:text-slate-700 transition-colors p-1.5 rounded-xl hover:bg-slate-50 border border-slate-250 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Tab Selection */}
            <div className="flex mt-4 bg-slate-50 p-1 rounded-2xl border border-slate-150 shrink-0">
              <button
                type="button"
                onClick={() => setCurriculumTab('core')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                  curriculumTab === 'core'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-100'
                    : 'text-slate-550 hover:text-slate-850'
                }`}
              >
                🎯 Cambridge Core Standards
              </button>
              <button
                type="button"
                onClick={() => setCurriculumTab('map')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                  curriculumTab === 'map'
                    ? 'bg-white text-rose-600 shadow-xs border border-slate-100'
                    : 'text-slate-550 hover:text-slate-850'
                }`}
              >
                🗺️ Cambridge Math Map (Stage 6)
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto py-5 space-y-4 pr-1">
              {curriculumTab === 'core' ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-blue-50/50 border border-blue-150/50 p-4.5 shadow-3xs">
                    <h4 className="text-xs font-bold text-blue-800 mb-3 flex items-center gap-1.5">
                      <span>📌</span>
                      <span>{language === 'vi' ? 'Chuẩn đầu ra & Mục tiêu học tập:' : 'Learning Objectives:'}</span>
                    </h4>
                    <ul className="space-y-3">
                      {activeLesson.learningObjectives && activeLesson.learningObjectives.map((obj, oIdx) => {
                        const isVinschool = obj.includes('VSE');
                        return (
                          <li key={oIdx} className="flex gap-2.5 text-xs text-slate-700 items-start">
                            <span className={`shrink-0 text-[8.5px] font-extrabold px-2 py-0.5 rounded border mt-0.5 uppercase tracking-wide ${
                              isVinschool 
                                ? 'bg-red-50 text-red-600 border-red-200/60' 
                                : 'bg-blue-50 text-blue-600 border-blue-200/60'
                            }`}>
                              {isVinschool ? 'Vinschool' : 'Cambridge'}
                            </span>
                            <span className="font-semibold leading-relaxed text-slate-750">{obj}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-150/70">
                    <p className="font-bold text-slate-750 mb-1 flex items-center gap-1">
                      <span>ℹ️</span>
                      <span>{language === 'vi' ? 'Giới thiệu về Tiêu chuẩn Cambridge:' : 'About Cambridge Core Standards:'}</span>
                    </p>
                    {language === 'vi' 
                      ? 'Khung chương trình Toán Tiểu học Cambridge (Cambridge Primary Mathematics) được thiết kế nhằm giúp học sinh phát triển năng lực tư duy, lập luận và giải quyết vấn đề toán học một cách có hệ thống, chuẩn bị nền tảng vững chắc cho các cấp học tiếp theo.'
                      : 'The Cambridge Primary Mathematics curriculum framework is designed to help students think mathematically, develop deep understanding, and build problem-solving skills for future academic success.'}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs text-slate-500 font-bold mb-1 pl-1 flex items-center gap-1">
                    <span>🗺️</span>
                    <span>{language === 'vi' ? 'Lộ trình bài học trong Học phần này:' : 'Lesson Progression in this Unit:'}</span>
                  </div>

                  {/* Vertical Progression Map */}
                  <div className="relative border-l-2 border-slate-250 pl-6 ml-4 space-y-5">
                    {lessons.filter(l => l.unitId === activeLesson.unitId).map((l, index) => {
                      const isCurrent = l.id === activeLesson.id;
                      const isCompleted = student.completedLessons?.includes(l.id);
                      return (
                        <div key={l.id} className="relative">
                          {/* Circle indicator */}
                          <div className={`absolute -left-[32.5px] top-1 h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all ${
                            isCurrent
                              ? 'bg-blue-650 border-blue-650 ring-4 ring-blue-100 text-white'
                              : isCompleted
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-3xs'
                                : 'bg-white border-slate-350 text-slate-400 shadow-3xs'
                          }`}>
                            {isCompleted ? (
                              <span className="text-[9.5px] font-extrabold">✓</span>
                            ) : (
                              <span className="text-[9px] font-bold font-mono">{index + 1}</span>
                            )}
                          </div>

                          <div className={`p-3.5 rounded-2xl border transition-all ${
                            isCurrent
                              ? 'bg-blue-50/50 border-blue-200 shadow-2xs'
                              : 'bg-slate-50/30 border-slate-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[9.5px] font-extrabold font-mono text-slate-400 uppercase tracking-wide">{l.code}</span>
                              {isCurrent && (
                                <span className="bg-blue-100 text-blue-700 text-[8.5px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider scale-95">
                                  {language === 'vi' ? 'Bạn đang học' : 'Active'}
                                </span>
                              )}
                              {isCompleted && !isCurrent && (
                                <span className="bg-emerald-100 text-emerald-700 text-[8.5px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider scale-95">
                                  {language === 'vi' ? 'Hoàn thành' : 'Done'}
                                </span>
                              )}
                            </div>
                            <h5 className="text-xs font-bold text-slate-750 mt-1.5 font-display">{getLangText(l.title)}</h5>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-150 pt-3.5 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsCurriculumModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-md cursor-pointer active:scale-95"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
