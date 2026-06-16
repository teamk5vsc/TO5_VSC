/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BilingualOrString = string | {
  en: string;
  vi: string;
};

export interface Unit {
  id: string;
  code: string; // e.g., "U1"
  title: BilingualOrString;
  description: BilingualOrString;
}

export interface Lesson {
  id: string;
  unitId: string;
  title: BilingualOrString;
  code: string; // e.g., "L1"
  learningObjectives: string[]; // Cambridge mapped objectives
  
  // Lesson Stages Content
  explore: {
    scenario: BilingualOrString;
    question: BilingualOrString;
    initialHint: BilingualOrString;
  };
  learn: {
    content: BilingualOrString; // Markdown text introducing concepts
    visualAidType?: 'fraction-bar' | 'decimal-grid' | 'percentage-circle' | 'none';
    visualAidParams?: any;
  };
  example: {
    problem: BilingualOrString;
    steps: {
      title: BilingualOrString;
      description: BilingualOrString;
      mathExpression?: string;
    }[];
  };
  reflection: {
    prompt: BilingualOrString;
    guidingQuestions: BilingualOrString[];
  };
}

export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface Question {
  id: string;
  lessonId: string;
  unitId: string;
  topic: string; // Keep simple for tracking topic maps
  skill: string; // Keep simple for skill maps
  difficulty: QuestionDifficulty;
  questionText: BilingualOrString;
  type: 'multiple-choice' | 'text-input' | 'numeric';
  options?: string[]; // If multiple-choice
  correctAnswer: string; // Plain string representing correct answer
  solution: BilingualOrString; // Detailed step-by-step solution
  hint: BilingualOrString;
  explanation: BilingualOrString;
  commonMistake: BilingualOrString;
  thinkingSkill: string; // Analytical, logical, estimation, spatial, etc.
}

export interface StudentProfile {
  id: string;
  name: string;
  classId: string;
  xp: number;
  level: number;
  badges: string[]; // id list
  completedLessons: string[]; // lessonIds
  completedUnits: string[]; // unitIds
  streakDays: number;
  lastActiveDate: string | null;
}

export interface TeacherProfile {
  id: string;
  name: string;
  classes: {
    id: string;
    name: string;
    studentCount: number;
  }[];
}

export interface Attempt {
  id: string;
  studentId: string;
  questionId: string;
  lessonId: string;
  unitId: string;
  userAnswer: string;
  isCorrect: boolean;
  scoreGained?: number;
  timestamp: string;
}

export interface MistakeLog {
  id: string;
  studentId: string;
  studentName: string;
  questionId: string;
  topic: string;
  skill: string;
  userAnswer: string;
  correctAnswer: string;
  mistakeCategory: string; // "Calculation Error", "Decimal Placement", "Denominator Misunderstanding", etc.
  thinkingSkillImpacted: string;
  timestamp: string;
}

export interface ReflectionResponse {
  id: string;
  studentId: string;
  lessonId: string;
  answers: {
    question: string;
    response: string;
  }[];
  timestamp: string;
}

export interface GamificationBadge {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  xpRequirement: number;
}
