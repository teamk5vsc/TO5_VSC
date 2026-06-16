/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  BarChart2, 
  AlertTriangle, 
  Flame, 
  TrendingUp, 
  Activity, 
  BookOpen, 
  Award, 
  CheckCircle, 
  HelpCircle,
  BrainCircuit,
  Search,
  ChevronRight,
  Sparkles,
  Bot,
  Download,
  FolderSync,
  RefreshCw,
  FileText,
  Presentation
} from 'lucide-react';
import { StudentProfile, MistakeLog, Attempt } from '../types';
import { useLanguage } from '../lib/LanguageContext';

interface TeacherMetricsProps {
  students: StudentProfile[];
  attempts: Attempt[];
  mistakes: MistakeLog[];
}

// Predefined class student database for comprehensive diagnostics
const MOCK_CLASS_STUDENTS: StudentProfile[] = [
  {
    id: 'student_minh',
    name: 'Hoàng Minh',
    classId: 'class_6a1',
    xp: 140,
    level: 2,
    badges: ['decimal_pioneer'],
    completedLessons: ['lesson_1', 'lesson_2'],
    completedUnits: [],
    streakDays: 3,
    lastActiveDate: new Date().toISOString()
  },
  {
    id: 'student_nam',
    name: 'Lê Nam',
    classId: 'class_6a1',
    xp: 220,
    level: 3,
    badges: ['decimal_pioneer', 'thoughtful_reviewer'],
    completedLessons: ['lesson_1', 'lesson_2', 'lesson_3'],
    completedUnits: [],
    streakDays: 5,
    lastActiveDate: new Date().toISOString()
  },
  {
    id: 'student_mai',
    name: 'Nguyễn Mai',
    classId: 'class_6a1',
    xp: 90,
    level: 1,
    badges: [],
    completedLessons: ['lesson_1'],
    completedUnits: [],
    streakDays: 1,
    lastActiveDate: new Date().toISOString()
  },
  {
    id: 'student_chloe',
    name: 'Chloe Smith',
    classId: 'class_6a1',
    xp: 310,
    level: 4,
    badges: ['decimal_pioneer', 'thoughtful_reviewer'],
    completedLessons: ['lesson_1', 'lesson_2', 'lesson_3', 'lesson_4'],
    completedUnits: ['unit_1'],
    streakDays: 8,
    lastActiveDate: new Date().toISOString()
  },
  {
    id: 'student_duc',
    name: 'Trần Đức',
    classId: 'class_6a1',
    xp: 180,
    level: 2,
    badges: ['decimal_pioneer'],
    completedLessons: ['lesson_1', 'lesson_2'],
    completedUnits: [],
    streakDays: 2,
    lastActiveDate: new Date().toISOString()
  },
  {
    id: 'student_linh',
    name: 'Phạm Linh',
    classId: 'class_6a1',
    xp: 110,
    level: 2,
    badges: [],
    completedLessons: ['lesson_1', 'lesson_2'],
    completedUnits: [],
    streakDays: 0,
    lastActiveDate: new Date().toISOString()
  }
];

// Speed (seconds/question) and Accuracy (%) metrics for scatter plot representation
const STUDENT_PERFORMANCE_METRICS: Record<string, { accuracy: number; speed: number; quadrant: string }> = {
  student_minh: { accuracy: 78, speed: 22, quadrant: 'Master' },
  student_nam: { accuracy: 92, speed: 18, quadrant: 'Master' },
  student_mai: { accuracy: 52, speed: 45, quadrant: 'Struggling' },
  student_chloe: { accuracy: 96, speed: 12, quadrant: 'Master' },
  student_duc: { accuracy: 64, speed: 15, quadrant: 'Careless' },
  student_linh: { accuracy: 84, speed: 38, quadrant: 'Stuck' }
};

export default function TeacherMetrics({ students, attempts, mistakes }: TeacherMetricsProps) {
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Moodle Sync States
  const [moodleSyncStatus, setMoodleSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');
  const [syncTime, setSyncTime] = useState<string>('');

  // Exporter Loading States
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [isExportingPptx, setIsExportingPptx] = useState<boolean>(false);

  // Merge mock class students with real active student
  const activeStudentsList = MOCK_CLASS_STUDENTS.map(s => {
    if (s.id === 'student_minh' && students.length > 0 && students[0].id === 'student_minh') {
      // sync actual completed count and XP
      return { ...s, xp: students[0].xp, completedLessons: students[0].completedLessons, streakDays: students[0].streakDays };
    }
    return s;
  });

  // Compute stats
  const totalStudents = activeStudentsList.length;
  const totalCorrectAttempts = attempts.filter(a => a.isCorrect).length;
  const totalAttempts = attempts.length;
  
  // Class accuracy average weighted
  const mockClassAccuracySum = Object.values(STUDENT_PERFORMANCE_METRICS).reduce((acc, curr) => acc + curr.accuracy, 0);
  const classAccuracy = Math.round(mockClassAccuracySum / totalStudents);

  // Filter student profiles
  const filteredStudents = activeStudentsList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStudent = activeStudentsList.find(s => s.id === selectedStudentId);
  const selectedStudentMistakes = mistakes.filter(m => m.studentId === selectedStudentId);

  // Word Document download trigger
  const handleExportDocx = async (studentId: string) => {
    setIsExportingDocx(true);
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const selectedModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';
      const response = await fetch(`/api/export/docx?studentId=${studentId}&lang=${language}&apiKey=${encodeURIComponent(apiKey)}&model=${encodeURIComponent(selectedModel)}`);
      if (!response.ok) throw new Error("Failed to export DOCX");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedStudent?.name || 'MathExplorer'}_Homework_Worksheet.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(language === 'vi' ? 'Không thể xuất tài liệu Word. Vui lòng kiểm tra lại kết nối máy chủ.' : 'Could not generate Word document. Please verify backend server is running.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // PowerPoint download trigger
  const handleExportPptx = async (studentId: string) => {
    setIsExportingPptx(true);
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const selectedModel = localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview';
      const response = await fetch(`/api/export/pptx?studentId=${studentId}&lang=${language}&apiKey=${encodeURIComponent(apiKey)}&model=${encodeURIComponent(selectedModel)}`);
      if (!response.ok) throw new Error("Failed to export PPTX");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedStudent?.name || 'MathExplorer'}_Lesson_Review.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(language === 'vi' ? 'Không thể xuất slide PowerPoint. Vui lòng kiểm tra lại kết nối máy chủ.' : 'Could not generate PowerPoint slides. Please verify backend server is running.');
    } finally {
      setIsExportingPptx(false);
    }
  };

  // Moodle Sync Trigger
  const handleMoodleSync = () => {
    setMoodleSyncStatus('syncing');
    setTimeout(() => {
      setMoodleSyncStatus('success');
      const timeStr = new Date().toLocaleTimeString();
      setSyncTime(timeStr);
    }, 2000);
  };

  // Group mistakes by category
  const mistakesByCategory = mistakes.reduce((acc, curr) => {
    acc[curr.mistakeCategory] = (acc[curr.mistakeCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const displayMistakes = language === 'vi' ? {
    "Nhầm lẫn dịch dấu phẩy khi nhân 100/1000": mistakesByCategory["Sai lệch chữ số Thập phân (Dịch dấu phẩy)"] || 5,
    "Lỗi tịnh tiến giá trị hàng đơn vị thập phân": 3,
    "Quên tối giản phân số về dạng gốc tối giản": mistakesByCategory["Phép chia Phân số chưa rút gọn"] || 4,
    "Chia sai tổng số phần trong tỉ lệ chia kẹo": mistakesByCategory["Chia nhầm tổng số phần Tỉ lệ"] || 2,
    "Nhầm lẫn tọa độ trục hoành và trục tung": mistakesByCategory["Lỗi đối xứng và biến hình"] || 1,
  } : {
    "Decimal placement shift error (x100/x1000)": mistakesByCategory["Decimal Placement Error"] || 5,
    "Decimal unit value translation error": 3,
    "Failing to simplify fractions to lowest terms": mistakesByCategory["Fractions Equivalence Error"] || 4,
    "Incorrect total parts division in ratio sharing": mistakesByCategory["Ratio/Proportion Scaling Error"] || 2,
    "Coordinate axis reflection swap error": mistakesByCategory["Transformation Geometry Error"] || 1,
  };

  // Suggested interventions
  const pedagogicalRecommendations = language === 'vi' ? [
    {
      id: 'rec_1',
      target: 'Phép Nhân Số Thập Phân (Lớp 6A1)',
      problem: '35% học sinh nhầm lẫn dịch chuyển dấu phẩy thập phân quá 2 chữ số khi thực hiện làm tròn hoặc nhân 100.',
      action: 'Tạo phiếu bài tập vẽ trục tịnh tiến lực kéo để minh họa vị trí dịch dấu phẩy.',
      priority: 'Cao (High)'
    },
    {
      id: 'rec_2',
      target: 'Tỉ Lệ Và Chia Phần (Nhóm Minh, Chloe)',
      problem: 'Gặp vướng mắc khi chia tổng tỉ phần 2:3 sang khối lượng bột mì thực tế.',
      action: 'Sử dụng hình vẽ thanh mô hình (Bar models) chuẩn Cambridge để các em trực quan hóa tổng số phần trước khi thực hiện phép chia.',
      priority: 'Trung bình (Medium)'
    },
    {
      id: 'rec_3',
      target: 'Cá nhân hóa Hoàng Minh',
      problem: 'Tính nhẩm nhanh tốt nhưng bài đòi hỏi tính toán chi tiết 3 chữ số thập phân còn vội vàng kết luận.',
      action: 'Khuyến khích Minh bật AI Math Coach, đối chiếu socratic nháp tính chậm để tự rà soát số dư.',
      priority: 'Ưu tiên cao'
    }
  ] : [
    {
      id: 'rec_1',
      target: 'Decimal Multiplication (Class 6A1)',
      problem: '35% of students incorrectly shift the decimal point by more than 2 digits when rounding or multiplying by 100.',
      action: 'Create a worksheet with vector translations to help visualize decimal point shifts.',
      priority: 'High'
    },
    {
      id: 'rec_2',
      target: 'Ratio and Proportion (Minh, Chloe Group)',
      problem: 'Difficulty partitioning total parts in a 2:3 ratio to calculate actual flour weights.',
      action: 'Use standard Cambridge Bar Models to help visualize total parts before executing division.',
      priority: 'Medium'
    },
    {
      id: 'rec_3',
      target: 'Personalized: Hoang Minh',
      problem: 'Strong mental calculation skills, but tends to rush when resolving 3-place decimal details.',
      action: 'Encourage Minh to activate the Socratic AI Coach to self-review calculations step-by-step.',
      priority: 'High'
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="teacher_workspace_root">
      
      {/* Analytics Summary Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8" id="analytics_metrics_top_row">
        
        {/* Metric Card 1 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('totalStudents')}</p>
            <h3 className="font-mono text-xl font-bold text-slate-800">{totalStudents} {language === 'vi' ? 'Học sinh' : 'Students'}</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">● 100% Active</p>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('classAccuracy')}</p>
            <h3 className="font-mono text-xl font-bold text-slate-800">{classAccuracy}%</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{language === 'vi' ? 'Mục tiêu chất lượng: 80%' : 'Target Quality: 80%'}</p>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-red-50 p-3 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('criticalErrors')}</p>
            <h3 className="font-mono text-xl font-bold text-slate-800">{mistakes.length || 7} {language === 'vi' ? 'Điểm hụt' : 'Gaps' }</h3>
            <p className="text-[10px] text-red-600 font-semibold mt-0.5">{language === 'vi' ? 'Đã gom nhóm AI' : 'AI-Categorized'}</p>
          </div>
        </div>

        {/* Metric Card 4 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('badgesAwarded')}</p>
            <h3 className="font-mono text-xl font-bold text-slate-800">12 Unlocked</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{language === 'vi' ? 'Khích lệ kịp thời' : 'Immediate Praise'}</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* LEFT COLUMN: Student Profile List & Search */}
        <div className="lg:col-span-5 space-y-6" id="students_selection_panel">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base">{t('diagnosticsTitle')}</h3>
              <p className="text-xs text-slate-500">{t('diagnosticsSubtitle')}</p>
            </div>

            {/* Simple Search bar */}
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full rounded-xl border border-slate-250 bg-slate-50/50 pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            {/* List of profiles */}
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1" id="student_list_container">
              {filteredStudents.map(student => {
                const isActive = student.id === selectedStudentId;
                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id === selectedStudentId ? null : student.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3.5 transition-all ${
                      isActive 
                        ? 'border-indigo-500 bg-indigo-50/20' 
                        : 'border-slate-150 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 uppercase">
                        {student.name.substring(0, 2)}
                      </div>
                      <div className="text-left text-xs">
                        <p className="font-bold text-slate-800">{student.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">XP: {student.xp} • Lvl: {student.level}</p>
                      </div>
                    </div>
                    
                    <div className="text-right text-xs">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold text-slate-600">
                        {student.completedLessons.length} {language === 'vi' ? 'bài học' : 'lessons'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{language === 'vi' ? 'Lớp 6A1' : 'Class 6A1'}</p>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Moodle Sync Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FolderSync className="h-4.5 w-4.5 text-indigo-650" />
              {language === 'vi' ? 'Tích hợp Moodle LMS' : 'Moodle LMS Integration'}
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {language === 'vi'
                ? 'Đồng bộ danh sách lớp học và xuất kết quả học tập tự ngẫm (Reflection) về sổ điểm chính thức.'
                : 'Synchronize classroom rosters and export reflection portfolios directly to the gradebook.'}
            </p>

            {moodleSyncStatus === 'syncing' ? (
              <div className="space-y-1 text-center">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 animate-pulse rounded-full" style={{ width: '70%' }} />
                </div>
                <span className="text-[9px] font-semibold text-indigo-600 animate-pulse uppercase">
                  {language === 'vi' ? 'Đang đồng bộ...' : 'Syncing data...'}
                </span>
              </div>
            ) : moodleSyncStatus === 'success' ? (
              <div className="rounded-lg bg-emerald-50 border border-emerald-150 p-2.5 text-[10px] text-emerald-800 flex items-center justify-between font-medium">
                <span>✓ {language === 'vi' ? `Đã đồng bộ lúc ${syncTime}` : `Synced successfully at ${syncTime}`}</span>
                <button onClick={handleMoodleSync} className="text-indigo-600 hover:underline text-[9px] font-bold">
                  {language === 'vi' ? 'Đồng bộ lại' : 'Sync again'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleMoodleSync}
                className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {language === 'vi' ? 'Đồng bộ Ngay' : 'Sync Now'}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Micro diagnostics & interventions */}
        <div className="lg:col-span-7 space-y-6" id="teacher_diagnostics_panel">
          
          {/* Selected Student Details */}
          {selectedStudent ? (
            <div className="rounded-2xl border border-indigo-150 bg-indigo-50/10 p-5 space-y-4 shadow-sm" id="custom_student_diagnostics">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div>
                  <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">
                    {language === 'vi' ? 'Phân tích chẩn đoán' : 'Diagnostic Analysis'}
                  </span>
                  <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base">{selectedStudent.name}</h3>
                </div>
                <button 
                  onClick={() => setSelectedStudentId(null)}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                >
                  {t('closeDiagnosticsBtn')}
                </button>
              </div>

              {/* Sub statistics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                  <p className="text-[9px] text-slate-400 uppercase font-medium">{language === 'vi' ? 'Điểm XP' : 'Current XP'}</p>
                  <p className="font-mono text-sm font-bold text-slate-800">{selectedStudent.xp} XP</p>
                </div>
                <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                  <p className="text-[9px] text-slate-400 uppercase font-medium">{language === 'vi' ? 'Hoàn thành' : 'Completed'}</p>
                  <p className="font-mono text-sm font-bold text-slate-800">{selectedStudent.completedLessons.length} L</p>
                </div>
                <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                  <p className="text-[9px] text-slate-400 uppercase font-medium">{language === 'vi' ? 'Độ chính xác' : 'Accuracy'}</p>
                  <p className="font-mono text-sm font-bold text-emerald-600">
                    {STUDENT_PERFORMANCE_METRICS[selectedStudent.id]?.accuracy || 75}%
                  </p>
                </div>
              </div>

              {/* Personalized Resource Generator */}
              <div className="rounded-xl border border-indigo-200 bg-white p-4 space-y-3">
                <h4 className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                  {language === 'vi' ? 'Tạo tài liệu ôn tập cá nhân hóa (AI)' : 'AI Personalized Worksheet Generator'}
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {language === 'vi'
                    ? 'Xuất học liệu riêng biệt theo các lỗi sai của học sinh. Bài tập sẽ tự sinh số liệu tương đồng với bài sai.'
                    : 'Download individualized review worksheets matching the student\'s logged gaps.'}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleExportDocx(selectedStudent.id)}
                    disabled={isExportingDocx}
                    className="py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isExportingDocx ? (
                      <span className="animate-spin text-white">⚙</span>
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <span>{language === 'vi' ? 'Phiếu Word (.docx)' : 'Homework Word (.docx)'}</span>
                  </button>

                  <button
                    onClick={() => handleExportPptx(selectedStudent.id)}
                    disabled={isExportingPptx}
                    className="py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isExportingPptx ? (
                      <span className="animate-spin text-white">⚙</span>
                    ) : (
                      <Presentation className="h-4 w-4" />
                    )}
                    <span>{language === 'vi' ? 'Review Slide (.pptx)' : 'Review Slide (.pptx)'}</span>
                  </button>
                </div>
              </div>

              {/* Logged Errors */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('mistakeHistoryTitle')}</p>
                {selectedStudentMistakes.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStudentMistakes.map(m => (
                      <div key={m.id} className="rounded-lg bg-white border border-slate-150 p-3 text-xs">
                        <div className="flex justify-between font-bold text-slate-800 mb-1">
                          <span>{language === 'vi' ? 'Mạch' : 'Topic'}: {m.topic}</span>
                          <span className="text-[10px] font-semibold text-rose-500 font-mono bg-rose-50 px-1.5 rounded">{m.mistakeCategory}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mb-2">{language === 'vi' ? 'Kỹ năng' : 'Skill'}: {m.skill}</p>
                        <div className="flex gap-4 font-mono text-[10px] bg-slate-50 p-2 rounded">
                          <span className="text-rose-600">{language === 'vi' ? 'Đáp án học sinh' : 'Student answer'}: "{m.userAnswer}"</span>
                          <span className="text-emerald-600">{language === 'vi' ? 'Đáp án chuẩn' : 'Correct answer'}: "{m.correctAnswer}"</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-white border border-slate-150 p-6 text-center text-xs text-slate-500">
                    {t('noMistakesLogged')}
                  </div>
                )}
              </div>

            </div>
          ) : null}

          {/* D3-style SVG Speed vs. Accuracy Scatter Plot */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1">
                <BarChart2 className="h-5 w-5 text-indigo-600" />
                {language === 'vi' ? 'Biểu đồ Tốc độ vs. Độ chính xác cả lớp' : 'Class Speed vs. Accuracy Scatter Plot'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'vi'
                  ? 'Phân nhóm học sinh theo bốn góc phần tư dựa trên tốc độ và tỉ lệ chính xác.'
                  : 'Map classroom cohorts into quadrants representing proficiency vs. speed thresholds.'}
              </p>
            </div>

            {/* SVG scatter plot */}
            <div className="relative border border-slate-150 bg-slate-50/50 rounded-xl p-2">
              <svg viewBox="0 0 400 240" className="w-full h-auto">
                {/* Quadrant backgrounds */}
                {/* Top Left: Master (x: 0-200, y: 0-120) */}
                <rect x="0" y="0" width="200" height="120" fill="rgba(16, 185, 129, 0.03)" />
                {/* Bottom Left: Careless (x: 0-200, y: 120-240) */}
                <rect x="0" y="120" width="200" height="120" fill="rgba(245, 158, 11, 0.03)" />
                {/* Top Right: Slow/Stuck (x: 200-400, y: 0-120) */}
                <rect x="200" y="0" width="200" height="120" fill="rgba(59, 130, 246, 0.03)" />
                {/* Bottom Right: Struggling (x: 200-400, y: 120-240) */}
                <rect x="200" y="120" width="200" height="120" fill="rgba(239, 68, 68, 0.03)" />

                {/* Grid lines and Quadrant Dividers */}
                <line x1="200" y1="0" x2="200" y2="240" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />

                {/* Axis Labels */}
                <text x="390" y="135" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="end">
                  {language === 'vi' ? 'Tốc độ (s) ➔' : 'Time per Q (s) ➔'}
                </text>
                <text x="210" y="10" fill="#64748b" fontSize="8" fontWeight="bold" transform="rotate(90, 210, 10)" textAnchor="start">
                  {language === 'vi' ? 'Chính xác (%) ➔' : 'Accuracy (%) ➔'}
                </text>

                {/* Quadrant Titles */}
                <text x="10" y="15" fill="#047857" fontSize="8" fontWeight="bold">
                  {language === 'vi' ? 'THÀNH THẠO (Master)' : 'MASTER (Fast & Correct)'}
                </text>
                <text x="10" y="230" fill="#b45309" fontSize="8" fontWeight="bold">
                  {language === 'vi' ? 'ẨU / VỘI VÀNG (Careless)' : 'CARELESS (Fast & Error-prone)'}
                </text>
                <text x="390" y="15" fill="#1d4ed8" fontSize="8" fontWeight="bold" textAnchor="end">
                  {language === 'vi' ? 'CHẬM / VƯỚNG (Stuck)' : 'STUCK (Slow & Correct)'}
                </text>
                <text x="390" y="230" fill="#b91c1c" fontSize="8" fontWeight="bold" textAnchor="end">
                  {language === 'vi' ? 'CẦN HỖ TRỢ (Struggling)' : 'STRUGGLING (Slow & Gaps)'}
                </text>

                {/* Student Nodes */}
                {activeStudentsList.map(student => {
                  const perf = STUDENT_PERFORMANCE_METRICS[student.id] || { accuracy: 70, speed: 25 };
                  
                  // Coordinate mappings
                  // X speed range [0, 50s] -> [30, 370]
                  const cx = 30 + (perf.speed / 50) * 340;
                  // Y accuracy range [40, 100%] -> [210, 20]
                  const cy = 210 - ((perf.accuracy - 40) / 60) * 190;

                  const isSelected = student.id === selectedStudentId;

                  return (
                    <g key={student.id} className="cursor-pointer" onClick={() => setSelectedStudentId(student.id)}>
                      {/* Node halo highlight if selected */}
                      {isSelected && (
                        <circle cx={cx} cy={cy} r="10" fill="none" stroke="#4f46e5" strokeWidth="2" className="animate-ping" />
                      )}
                      
                      {/* Node Dot */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? "6" : "5"}
                        fill={
                          perf.quadrant === 'Master' ? '#10b981' :
                          perf.quadrant === 'Careless' ? '#f59e0b' :
                          perf.quadrant === 'Stuck' ? '#3b82f6' : '#ef4444'
                        }
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      
                      {/* Node label */}
                      <text
                        x={cx}
                        y={cy - 8}
                        fill="#1e293b"
                        fontSize="7"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="bg-white/80"
                      >
                        {student.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            <p className="text-[10px] text-slate-400 italic">
              {language === 'vi'
                ? 'Nhấn vào nút tròn đại diện cho học sinh để mở chẩn đoán và tạo học liệu cá nhân.'
                : 'Click any student node to expand diagnostic records and issue AI learning packets.'}
            </p>
          </div>

          {/* Skill Heatmap Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4" id="skill_heatmap_widget">
            
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base">{t('errorProfileTitle')}</h3>
              <p className="text-xs text-slate-500">{t('errorProfileSubtitle')}</p>
            </div>

            {/* Progress bars representations */}
            <div className="space-y-3.5 text-xs">
              {Object.entries(displayMistakes).map(([label, count]) => {
                const maxVal = 10;
                const ratio = Math.min((count * 100) / maxVal, 100);

                return (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-700">{label}</span>
                      <span className="font-mono text-slate-500 font-bold">{count} {language === 'vi' ? 'em mắc phải' : 'students affected'}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full transition-all duration-500" 
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* AI-powered Recommended Intervention Plans */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4" id="pedagogical_interventions">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1">
                  <Bot className="h-5 w-5 text-indigo-650" />
                  {t('pedagogicalInterventionsTitle')}
                </h3>
                <p className="text-xs text-slate-500">{t('pedagogicalInterventionsSubtitle')}</p>
              </div>
              <span className="rounded bg-indigo-100 text-indigo-700 font-bold text-[9px] px-2 py-0.5 uppercase tracking-wider">
                Real-time
              </span>
            </div>

            {/* Proposals list */}
            <div className="space-y-3">
              {pedagogicalRecommendations.map((rec) => (
                <div key={rec.id} className="rounded-xl border border-slate-150 p-4 text-xs space-y-2 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-bold text-slate-800">{rec.target}</span>
                    <span className="rounded bg-amber-50 text-amber-700 font-bold text-[9px] px-2 py-0.5 border border-amber-100 uppercase">
                      {t('priorityLabel')}: {rec.priority}
                    </span>
                  </div>
                  <p className="text-slate-500 leading-relaxed"><strong className="text-slate-700">{t('phenomenonLabel')}:</strong> {rec.problem}</p>
                  <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <strong className="text-indigo-650">{t('recommendedActionLabel')}:</strong> {rec.action}
                  </p>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
