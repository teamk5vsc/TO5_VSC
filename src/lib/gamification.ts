/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GamificationBadge, StudentProfile } from '../types';

export const BADGE_LIBRARY: Record<string, GamificationBadge> = {
  decimal_pioneer: {
    id: 'decimal_pioneer',
    title: 'Decimal Pioneer (Khai phá Thập phân)',
    description: 'Solve 3 decimal-related calculation questions successfully.',
    icon: 'Binary',
    rarity: 'Common',
    xpRequirement: 50
  },
  fraction_champion: {
    id: 'fraction_champion',
    title: 'Fraction Champion (Vô địch Phân số)',
    description: 'Gain ultimate mastery of fraction simplification and equivalence.',
    icon: 'PieChart',
    rarity: 'Rare',
    xpRequirement: 120
  },
  ratio_ranger: {
    id: 'ratio_ranger',
    title: 'Ratio Ranger (Chiến binh Tỉ lệ)',
    description: 'Successfully partition shares correctly using advanced scales.',
    icon: 'Scale',
    rarity: 'Epic',
    xpRequirement: 250
  },
  socratic_apprentice: {
    id: 'socratic_apprentice',
    title: 'Socratic Scholar (Học trò Socratic)',
    description: 'Exchange 4 Socratic questions with the AI Coach to self-correct a mistake.',
    icon: 'Bot',
    rarity: 'Legendary',
    xpRequirement: 400
  },
  thoughtful_reviewer: {
    id: 'thoughtful_reviewer',
    title: 'Reflective thinker (Tư duy Độc lập)',
    description: 'Submit detailed answers for 3 reflective self-assessment questions.',
    icon: 'Brain',
    rarity: 'Rare',
    xpRequirement: 200
  }
};

/**
 * Replaceable gamification service.
 * Enforces levels, XP gains, streak benefits, and achievement assessments.
 */
export const GamificationService = {
  XP_PER_CORRECT_ANSWER: 20,
  XP_PER_REFLECTION: 30,

  /**
   * Calculates what level a student should be based on their XP.
   * Progression rule: Level = floor( sqrt(XP / 50) ) + 1
   */
  calculateLevel(xp: number): number {
    if (xp <= 0) return 1;
    return Math.floor(Math.sqrt(xp / 50)) + 1;
  },

  /**
   * Tracks target thresholds for the next level.
   */
  getXpThresholdForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 50;
  },

  /**
   * Calculates the relative percentage progress of the student to complete their current level.
   */
  getLevelProgressPercentage(xp: number): number {
    const currentLevel = this.calculateLevel(xp);
    const baseVal = this.getXpThresholdForLevel(currentLevel);
    const maxVal = this.getXpThresholdForLevel(currentLevel + 1);
    const range = maxVal - baseVal;
    if (range <= 0) return 0;
    const gained = xp - baseVal;
    return Math.min(Math.max(Math.floor((gained * 100) / range), 0), 100);
  },

  /**
   * Evaluates if any new badges are unlocked based on student status.
   * Returns newly unlocked badge IDs.
   */
  evaluateBadgeUnlocks(
    profile: StudentProfile,
    solvedCountMap: Record<string, number>, // { topic: count }
    coachDialogueCount: number,
    completedReflectionCount: number
  ): string[] {
    const currentBadges = new Set(profile.badges);
    const unlocked: string[] = [];

    // 1. Decimal Pioneer: 3 decimal questions
    if (!currentBadges.has('decimal_pioneer')) {
      const decimalCount = (solvedCountMap['Decimal Shift'] || 0) + 
                          (solvedCountMap['Decimal Shift Extra Digits'] || 0) + 
                          (solvedCountMap['Decimal Multiplication'] || 0) + 
                          (solvedCountMap['Word Problems decimals'] || 0);
      if (decimalCount >= 3) {
        unlocked.push('decimal_pioneer');
      }
    }

    // 2. Fraction Champion: 3 fractions/percentage questions
    if (!currentBadges.has('fraction_champion')) {
      const fracCount = (solvedCountMap['Fractions'] || 0) +
                        (solvedCountMap['Fraction Equivalence'] || 0) +
                        (solvedCountMap['Percentages'] || 0) +
                        (solvedCountMap['Word problems percents'] || 0);
      if (fracCount >= 3) {
        unlocked.push('fraction_champion');
      }
    }

    // 3. Ratio Ranger: 2 ratios/proportional sharing problems
    if (!currentBadges.has('ratio_ranger')) {
      const ratioCount = (solvedCountMap['Ratios'] || 0) +
                         (solvedCountMap['Three part ratio'] || 0) +
                         (solvedCountMap['Ratios with variable targets'] || 0);
      if (ratioCount >= 2) {
        unlocked.push('ratio_ranger');
      }
    }

    // 4. Socratic Apprentice: Coach Dialogue turns >= 4
    if (!currentBadges.has('socratic_apprentice')) {
      if (coachDialogueCount >= 4) {
        unlocked.push('socratic_apprentice');
      }
    }

    // 5. Thoughtful Reviewer: Reflection Count >= 2
    if (!currentBadges.has('thoughtful_reviewer')) {
      if (completedReflectionCount >= 2) {
        unlocked.push('thoughtful_reviewer');
      }
    }

    return unlocked;
  }
};
