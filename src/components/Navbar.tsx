/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Compass, 
  GraduationCap, 
  User, 
  Trophy, 
  Flame, 
  TrendingUp, 
  LayoutDashboard,
  Settings
} from 'lucide-react';
import { StudentProfile } from '../types';
import { GamificationService } from '../lib/gamification';
import { useLanguage } from '../lib/LanguageContext';

interface NavbarProps {
  currentMode: 'student' | 'teacher';
  onModeChange: (mode: 'student' | 'teacher') => void;
  student: StudentProfile;
  onOpenSettings: () => void;
  hasApiKey: boolean;
}

export default function Navbar({ 
  currentMode, 
  onModeChange, 
  student, 
  onOpenSettings, 
  hasApiKey 
}: NavbarProps) {
  const { language, setLanguage, t } = useLanguage();
  const currentLevel = GamificationService.calculateLevel(student.xp);
  const progressPercent = GamificationService.getLevelProgressPercentage(student.xp);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md" id="header_navigation">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200">
            <Compass className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Math Explorer <span className="text-blue-600">6</span>
            </h1>
            <p className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">
              Cambridge & Vinschool Stage 6
            </p>
          </div>
        </div>

        {/* Global Statistics & Progression (Student Centered) */}
        {currentMode === 'student' && (
          <div className="hidden items-center gap-6 md:flex" id="gamified_indicators">
            
            {/* Level Counter */}
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 border border-slate-100">
              <Trophy className="h-4 w-4 text-amber-500" />
              <div className="text-xs">
                <p className="font-semibold text-slate-700">{t('level')} {currentLevel}</p>
                <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                  <div 
                    className="h-full rounded-full bg-amber-500 transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* XP Stats */}
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('xp')}</p>
              <p className="font-mono text-sm font-bold text-blue-600">{student.xp} XP</p>
            </div>

            {/* Hot Streak */}
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50/50 px-3 py-1.5 border border-red-100 text-red-600">
              <Flame className="h-4.5 w-4.5 fill-current text-red-500" />
              <div className="text-xs">
                <p className="font-bold">{student.streakDays} {t('streak')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Role Toggle Switch, Language Selector & Avatar */}
        <div className="flex items-center gap-4">
          
          {/* Settings Button with API key Warning */}
          <div className="flex items-center gap-2" id="settings_trigger_wrapper">
            {!hasApiKey && (
              <span className="text-[10px] sm:text-xs font-semibold text-red-600 animate-pulse bg-red-50 border border-red-200 px-2 py-1 rounded-md">
                {language === 'vi' ? 'Lấy API key để sử dụng app' : 'Get API key to use app'}
              </span>
            )}
            <button
              onClick={onOpenSettings}
              className="flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
              title={language === 'vi' ? 'Thiết lập AI Key & Model' : 'AI Settings'}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {/* Language Selector (EN / VI) */}
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-250" id="language_switcher">
            <button
              onClick={() => setLanguage('en')}
              className={`rounded-md px-2 py-1 text-[10px] font-bold transition-all ${
                language === 'en'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-450 hover:text-slate-700'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('vi')}
              className={`rounded-md px-2 py-1 text-[10px] font-bold transition-all ${
                language === 'vi'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-450 hover:text-slate-700'
              }`}
            >
              VI
            </button>
          </div>

          {/* Role Toggle */}
          <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200" id="role_selector_wrapper">
            <button
              onClick={() => onModeChange('student')}
              id="btn_select_student_mode"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                currentMode === 'student'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>{language === 'vi' ? 'Học sinh' : 'Student'}</span>
            </button>
            <button
              onClick={() => onModeChange('teacher')}
              id="btn_select_teacher_mode"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                currentMode === 'teacher'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>{language === 'vi' ? 'Giáo viên' : 'Teacher'}</span>
            </button>
          </div>

          {/* User info avatar summary */}
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100 p-0.5">
              <div className={`flex h-full w-full items-center justify-center rounded-full text-sm font-bold text-white ${
                currentMode === 'student' ? 'bg-blue-600' : 'bg-red-600'
              }`}>
                {currentMode === 'student' ? 'HM' : 'TM'}
              </div>
            </div>
            <div className="hidden lg:block text-left text-xs">
              <p className="font-semibold text-slate-800">
                {currentMode === 'student' ? (language === 'vi' ? 'Hoàng Minh (Lớp 6A1)' : 'Hoang Minh (Class 6A1)') : (language === 'vi' ? 'Cô Tuyết Mai' : 'Ms. Tuyet Mai')}
              </p>
              <p className="text-[10px] text-slate-500">
                {currentMode === 'student' ? 'Vinschool Times City' : 'Lead Teacher'}
              </p>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
