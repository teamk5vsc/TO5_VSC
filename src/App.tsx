/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentPaths from './components/StudentPaths';
import TeacherMetrics from './components/TeacherMetrics';
import AICoachModal from './components/AICoachModal';
import SettingsModal from './components/SettingsModal';
import { storageProvider } from './lib/firebase';
import { LanguageProvider, useLanguage } from './lib/LanguageContext';
import { 
  DEMO_UNITS, 
  DEMO_LESSONS, 
  DEMO_QUESTIONS 
} from './data/curriculumData';
import { 
  StudentProfile, 
  Attempt, 
  MistakeLog, 
  ReflectionResponse,
  Question
} from './types';
import { 
  BookOpen, 
  Award, 
  Bot, 
  Info, 
  Flame, 
  GraduationCap, 
  Users, 
  ListTodo,
  TrendingUp,
  FolderSync,
  RefreshCw
} from 'lucide-react';

const INITIAL_STUDENT: StudentProfile = {
  id: 'student_minh',
  name: 'Hoàng Minh',
  classId: 'class_5a1',
  xp: 140, // Decentered start to make progress bars visually interesting
  level: 2,
  badges: ['decimal_pioneer'],
  completedLessons: ['lesson_1'],
  completedUnits: [],
  streakDays: 3,
  lastActiveDate: new Date().toISOString()
};

function AppContent() {
  const { t } = useLanguage();
  const [currentMode, setCurrentMode] = useState<'student' | 'teacher'>('student');
  
  // Real-time synced core stores
  const [student, setStudent] = useState<StudentProfile>(INITIAL_STUDENT);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [mistakes, setMistakes] = useState<MistakeLog[]>([]);
  const [reflections, setReflections] = useState<ReflectionResponse[]>([]);

  // Dynamic Gemini API configuration states
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem('gemini_selected_model') || 'gemini-3-flash-preview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Socratic Modal Controls
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [coachActiveQuestion, setCoachActiveQuestion] = useState<Question | null>(null);
  const [coachActiveStudentAnswer, setCoachActiveStudentAnswer] = useState('');
  const [coachCallCount, setCoachCallCount] = useState(0);

  // Notification states
  const [showConfigNotice, setShowConfigNotice] = useState(true);

  // Show modal automatically on mount if key is missing
  useEffect(() => {
    if (!apiKey) {
      setIsSettingsOpen(true);
    }
  }, [apiKey]);

  // Load Initial Persistent State
  useEffect(() => {
    // Seed initial demo profile locally if none exists
    storageProvider.seedLocal('students', { 'student_minh': INITIAL_STUDENT });
    
    // Load student
    const fetchProfile = async () => {
      const stored = await storageProvider.get('students', 'student_minh');
      if (stored) {
        setStudent(stored);
      }
    };

    // Load attempts, mistakes, reflections
    const fetchTransactions = async () => {
      const allAttempts = await storageProvider.queryAll('attempts');
      const allMistakes = await storageProvider.queryAll('mistakes');
      const allReflections = await storageProvider.queryAll('reflections');

      setAttempts(allAttempts);
      setMistakes(allMistakes);
      setReflections(allReflections);
    };

    fetchProfile();
    fetchTransactions();
  }, [coachCallCount]);

  // Save changes to persistent engines safely
  const handleUpdateStudent = async (updater: (prev: StudentProfile) => StudentProfile) => {
    setStudent(prev => {
      const updated = updater(prev);
      // async side effect
      storageProvider.save('students', 'student_minh', updated);
      return updated;
    });
  };

  const handleSaveAttempt = async (attempt: Attempt) => {
    setAttempts(prev => [attempt, ...prev]);
    await storageProvider.save('attempts', attempt.id, attempt);
  };

  const handleSaveMistake = async (mistake: MistakeLog) => {
    setMistakes(prev => [mistake, ...prev]);
    await storageProvider.save('mistakes', mistake.id, mistake);
  };

  const handleSaveReflection = async (reflection: ReflectionResponse) => {
    setReflections(prev => [reflection, ...prev]);
    await storageProvider.save('reflections', reflection.id, reflection);
  };

  // Triggers the AI Coach Side Drawer
  const handleOpenAICoach = (question: Question, currentAnswer: string) => {
    setCoachActiveQuestion(question);
    setCoachActiveStudentAnswer(currentAnswer);
    setIsCoachOpen(true);
  };

  const handleCoachMessageLogged = () => {
    setCoachCallCount(prev => prev + 1);
  };

  const handleSaveSettings = (key: string, model: string) => {
    localStorage.setItem('gemini_api_key', key);
    localStorage.setItem('gemini_selected_model', model);
    setApiKey(key);
    setSelectedModel(model);
  };

  const handleResetData = () => {
    const isVietnamese = localStorage.getItem('math_explorer_lang') !== 'en';
    const confirmMsg = isVietnamese 
      ? "Em có chắc chắn muốn làm mới toàn bộ kết quả học tập để luyện tập lại từ đầu?"
      : "Are you sure you want to reset all learning progress to start over?";
    if (confirm(confirmMsg)) {
      localStorage.clear();
      setStudent(INITIAL_STUDENT);
      setAttempts([]);
      setMistakes([]);
      setReflections([]);
      location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="app_root_viewport">
      
      {/* Upper Architecture Notification Strip */}
      {showConfigNotice && currentMode === 'teacher' && (
        <div className="bg-slate-900 text-white border-b border-white/10" id="architectural_banner">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <span className="rounded bg-blue-500/25 border border-blue-500 px-2 py-0.5 text-[10px] font-bold text-blue-400 uppercase tracking-widest shrink-0">
                {t('coreArchitecture')}
              </span>
              <p className="text-slate-300 leading-relaxed font-mono text-[10.5px]">
                <strong className="text-white">Stage 6 Platform:</strong> {t('architectureBannerText')}
              </p>
            </div>
            <button 
              onClick={() => setShowConfigNotice(false)}
              className="text-slate-400 hover:text-white transition-colors hover:underline text-[11px] font-bold shrink-0"
            >
              {t('understandBtn')}
            </button>
          </div>
        </div>
      )}

      {/* Global Interactive Header */}
      <Navbar 
        currentMode={currentMode} 
        onModeChange={setCurrentMode} 
        student={student}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasApiKey={!!apiKey}
      />

      {/* Main Core Workspaces */}
      <main className="flex-1">
        {currentMode === 'student' ? (
          <StudentPaths 
            units={DEMO_UNITS}
            lessons={DEMO_LESSONS}
            questions={DEMO_QUESTIONS}
            student={student}
            onUpdateStudent={handleUpdateStudent}
            onSaveAttempt={handleSaveAttempt}
            onSaveMistake={handleSaveMistake}
            onSaveReflection={handleSaveReflection}
            openAICoach={handleOpenAICoach}
            coachCallCount={coachCallCount}
          />
        ) : (
          <TeacherMetrics 
            students={[student]} // standard class profile containing our student
            attempts={attempts}
            mistakes={mistakes}
          />
        )}
      </main>

      {/* Right-aligned Socratic Draw Chat Drawer */}
      {coachActiveQuestion && (
        <AICoachModal 
          isOpen={isCoachOpen}
          onClose={() => setIsCoachOpen(false)}
          question={coachActiveQuestion}
          studentAnswer={coachActiveStudentAnswer}
          onCoachMessageLogged={handleCoachMessageLogged}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        selectedModel={selectedModel}
        onSave={handleSaveSettings}
        isMandatory={!apiKey}
      />

      {/* Footer System Control and Reset parameters */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center" id="global_footer">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <p className="text-xs font-bold text-slate-700">{t('footerTitle')}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{t('footerSubtitle')}</p>
            <p className="text-[10px] text-slate-400 mt-1">Được phát triển bởi Ms.Ngọc Mai</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={handleResetData}
              id="btn_reset_progress"
              className="flex items-center gap-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 transition-all text-[11px]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{t('resetPractice')}</span>
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-[10px] text-slate-400 font-mono">STAGE 6 BUILD V2.0.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
