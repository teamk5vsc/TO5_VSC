/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState } from 'react';
import { BilingualOrString } from '../types';

export type Language = 'en' | 'vi';

export interface TranslationDict {
  [key: string]: {
    en: string;
    vi: string;
  };
}

const TRANSLATIONS: TranslationDict = {
  // Navbar & Global
  studentMode: { en: 'Student Portal', vi: 'Cổng Học Sinh' },
  teacherMode: { en: 'Teacher Dashboard', vi: 'Bảng Điều Khiển Giáo Viên' },
  level: { en: 'Level', vi: 'Cấp độ' },
  xp: { en: 'XP', vi: 'Điểm XP' },
  streak: { en: 'day streak', vi: 'ngày liên tục' },
  resetPractice: { en: 'Reset Progress', vi: 'Làm mới Luyện tập' },
  coreArchitecture: { en: 'Core Architecture', vi: 'Kiến trúc Core' },
  architectureBannerText: {
    en: 'Stage 6 Cambridge/Vinschool Math Portal enabled. Content dynamically loaded from parsed textbooks.',
    vi: 'Cổng Toán học lớp 6 Cambridge/Vinschool đã kích hoạt. Nội dung tải động từ sách giáo khoa.'
  },
  understandBtn: { en: 'I understand', vi: 'Tôi đã hiểu' },
  footerTitle: { en: 'Math Explorer 6 - Cambridge/Vinschool Portal', vi: 'Math Explorer 6 - Cổng Toán Cambridge/Vinschool' },
  footerSubtitle: { en: 'Designed for competency-based diagnostic assessments. Stage 6 compliant.', vi: 'Thiết kế cho đánh giá chẩn đoán theo năng lực. Tuân thủ Stage 6.' },

  // Student Paths
  explore: { en: 'Explore', vi: 'Khám phá' },
  learn: { en: 'Learn', vi: 'Học tập' },
  example: { en: 'Example', vi: 'Ví dụ' },
  practice: { en: 'Practice', vi: 'Luyện tập' },
  reflection: { en: 'Reflection', vi: 'Tự đánh giá' },
  scratchpad: { en: 'Scratchpad', vi: 'Nháp nháp' },
  scratchpadPlaceholder: { en: 'Use this space for calculations or sketches...', vi: 'Nháp các phép tính hoặc vẽ nháp tại đây...' },
  submitBtn: { en: 'Submit', vi: 'Nộp bài' },
  nextQuestionBtn: { en: 'Next Question', vi: 'Câu tiếp theo' },
  tryAgainBtn: { en: 'Try Again', vi: 'Tính toán lại' },
  needHintBtn: { en: 'Socratic AI Help', vi: 'Nhờ AI Coach gợi ý' },
  correctAnswerMsg: { en: 'Excellent! Your mathematical thinking is correct.', vi: 'Tuyệt vời! Em đã phân tích toán học chính xác rồi.' },
  incorrectAnswerMsg: { en: 'Answer does not match. Try using the Socratic AI Coach or use the scratchpad.', vi: 'Đáp án chưa khớp. Hãy thử nhờ cậy Socratic AI Coach hoặc tính nháp lại nhé.' },
  unitCompleteTitle: { en: 'Unit Completed!', vi: 'Học phần Hoàn thành!' },
  lessonCompleteTitle: { en: 'Lesson Completed!', vi: 'Bài học Hoàn thành!' },
  nextLessonBtn: { en: 'Next Lesson', vi: 'Bài học tiếp theo' },
  guidingQuestionsTitle: { en: 'Guiding Questions:', vi: 'Câu hỏi gợi ý suy ngẫm:' },
  submitReflectionBtn: { en: 'Submit Reflection', vi: 'Gửi tự đánh giá' },
  reflectionSuccessMsg: { en: 'Reflection submitted! You gained 30 XP.', vi: 'Đã lưu phản hồi tự đánh giá! Em nhận được 30 XP.' },

  // AI Coach Modal
  aiCoachHeader: { en: 'AI Math Coach', vi: 'AI Math Coach' },
  aiCoachSubtitle: { en: 'Socratic dialogue to help you find mistakes', vi: 'Khuyến khích học sinh tự sửa sai từng bước' },
  questionContext: { en: 'Question in progress', vi: 'Câu hỏi đang làm' },
  commonMistakeLabel: { en: 'Common mistake', vi: 'Lỗi thường gặp' },
  aiTyping: { en: 'Coach is analyzing...', vi: 'Thầy cô đang xem bài...' },
  inputPlaceholder: { en: 'Ask the Socratic Coach for a clue...', vi: 'Trao đổi với AI Math Coach...' },
  suggestRule: { en: 'Do not understand the calculation rules?', vi: 'Chưa hiểu quy tắc tính?' },
  suggestExample: { en: 'Give me a similar example', vi: 'Cần ví dụ tương tự' },
  suggestStuck: { en: 'Calculated again but got same result', vi: 'Vẫn ra đáp án cũ' },

  // Teacher Dashboard
  totalStudents: { en: 'Total Students', vi: 'Tổng sĩ số' },
  classAccuracy: { en: 'Class Accuracy', vi: 'Tỉ lệ chính xác lớp' },
  criticalErrors: { en: 'Critical Errors Found', vi: 'Lỗi nặng phát hiện' },
  badgesAwarded: { en: 'Badges Awarded', vi: 'Huy hiệu đã trao' },
  diagnosticsTitle: { en: 'Student Competency Diagnostics', vi: 'Hồ sơ Năng lực Học sinh' },
  diagnosticsSubtitle: { en: 'Click a student to view details and common mistakes', vi: 'Bấm chọn tên để xem phân tích chi tiết lỗi sai của em' },
  searchPlaceholder: { en: 'Search student by name...', vi: 'Tìm học sinh theo tên...' },
  closeDiagnosticsBtn: { en: 'Close Diagnostics', vi: 'Đóng phân tích' },
  mistakeHistoryTitle: { en: 'Actual Mistake Logs (Student History):', vi: 'Nhật ký lỗi sai thực tế (Lịch sử làm bài):' },
  noMistakesLogged: { en: 'No mistakes logged for this session.', vi: 'Chưa ghi nhận lỗi sai cục bộ nào từ lúc bắt đầu phiên.' },
  errorProfileTitle: { en: 'Class Error Profile Heatmap', vi: 'Biểu đồ Lỗi sai Trọng tâm lớp' },
  errorProfileSubtitle: { en: 'AI-grouped class vulnerability report', vi: 'Báo cáo chẩn đoán của hệ thống dựa trên lỗ hổng kiến thức' },
  pedagogicalInterventionsTitle: { en: 'AI-Powered Pedagogical Interventions', vi: 'Đề xuất Can thiệp sư phạm (AI Interventions)' },
  pedagogicalInterventionsSubtitle: { en: 'Automated remediation plans based on class errors', vi: 'Hệ thống phân tích thông minh dựa trên rủi ro của từng lớp' },
  priorityLabel: { en: 'Priority', vi: 'Mức độ ưu tiên' },
  phenomenonLabel: { en: 'Phenomenon', vi: 'Hiện tượng' },
  recommendedActionLabel: { en: 'Recommended Corrective Action', vi: 'Hành động khắc phục đề xuất' }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getLangText: (val: BilingualOrString | undefined) => string;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = React.useState<Language>(() => {
    const saved = localStorage.getItem('math_explorer_lang');
    return (saved as Language) || 'vi'; // default to Vietnamese
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('math_explorer_lang', lang);
  };

  const t = (key: string): string => {
    const translation = TRANSLATIONS[key];
    if (!translation) {
      return key;
    }
    return translation[language];
  };

  const getLangText = (val: BilingualOrString | undefined): string => {
    if (!val) return '';
    if (typeof val === 'string') {
      return val;
    }
    return val[language] || val['en'] || '';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getLangText }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
