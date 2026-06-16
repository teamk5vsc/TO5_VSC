/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { ArrowUp, ArrowDown, Award, Play } from 'lucide-react';
import { Question } from '../types';

interface MathRunnerGameProps {
  question: Question;
  onAnswerSubmit: (answer: string) => void;
  isCorrect: boolean | null;
  hasSubmitted: boolean;
  onNext: () => void;
}

export default function MathRunnerGame({
  question,
  onAnswerSubmit,
  isCorrect,
  hasSubmitted,
  onNext
}: MathRunnerGameProps) {
  const { language, getLangText } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game states
  const [playerLane, setPlayerLane] = useState<number>(1); // 0 = top, 1 = middle, 2 = bottom
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameFeedback, setGameFeedback] = useState<string>('');

  const animRef = useRef<number | null>(null);
  const scrollOffset = useRef<number>(0);
  const obstacleX = useRef<number>(500);
  const collisionOccurred = useRef<boolean>(false);

  // Generate 3 choices (1 correct, 2 incorrect)
  const choicesRef = useRef<string[]>([]);
  
  useEffect(() => {
    // Generate choices whenever the question changes
    const correctVal = getLangText(question.correctAnswer).trim();
    const incorrectChoices: string[] = [];

    // Parse numeric base
    const numValue = parseFloat(correctVal);
    if (!isNaN(numValue)) {
      // Create interesting distractors (e.g. shifted decimal places or typical addition/scaling errors)
      if (numValue === 0) {
        incorrectChoices.push('1', '-1');
      } else {
        const factor = numValue > 5 ? 10 : 2;
        incorrectChoices.push(
          (numValue * 10).toString(), // Decimal shift error
          (numValue / 2).toString(),  // Partition error
          (numValue + factor).toString(),
          (numValue - (numValue > 2 ? 2 : 1)).toString()
        );
      }
    } else {
      // Text answers distractors
      incorrectChoices.push('(1,5)', '(-1,-2)', '(2,1)', '4', '6', '120');
    }

    // Try to parse commonMistake number as a distractor
    const extractNum = getLangText(question.commonMistake).match(/\d+/);
    if (extractNum && extractNum[0] !== correctVal) {
      incorrectChoices.unshift(extractNum[0]);
    }

    // Filter unique choices that are not the correct answer
    const filteredIncorrect = Array.from(new Set(incorrectChoices))
      .filter(c => c.toLowerCase().replace(/\s/g, '') !== correctVal.toLowerCase().replace(/\s/g, ''));

    // Select 2 distractors
    const distractor1 = filteredIncorrect[0] || '10';
    const distractor2 = filteredIncorrect[1] || '0';

    // Shuffle them
    const list = [correctVal, distractor1, distractor2].sort(() => Math.random() - 0.5);
    choicesRef.current = list;

    // Reset game positions
    obstacleX.current = 500;
    collisionOccurred.current = false;
    setGameFeedback('');
    setIsPlaying(true);
  }, [question, getLangText]);

  // Canvas Game Engine Loop
  useEffect(() => {
    if (!isPlaying || hasSubmitted) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lanePositions = [45, 95, 145];
    let speed = 3;

    const gameLoop = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      // Draw scrolling background math grid
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      scrollOffset.current = (scrollOffset.current - 1.5) % 40;
      for (let x = scrollOffset.current; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw lanes
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      // Lane 1 divider
      ctx.beginPath();
      ctx.moveTo(0, 70);
      ctx.lineTo(width, 70);
      ctx.stroke();
      // Lane 2 divider
      ctx.beginPath();
      ctx.moveTo(0, 120);
      ctx.lineTo(width, 120);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw player avatar (Vinschool Runner)
      const playerX = 60;
      const playerY = lanePositions[playerLane];

      // Draw animated runner body (cute circle with shield/hat)
      ctx.fillStyle = '#ef4444'; // Red theme
      ctx.beginPath();
      ctx.arc(playerX, playerY, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(playerX + 5, playerY - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(playerX + 6, playerY - 4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Running legs (simple sine animation)
      const legCycle = Date.now() / 100;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Leg 1
      ctx.moveTo(playerX - 5, playerY + 12);
      ctx.lineTo(playerX - 8 + Math.sin(legCycle) * 6, playerY + 22);
      // Leg 2
      ctx.moveTo(playerX + 5, playerY + 12);
      ctx.lineTo(playerX + 2 + Math.cos(legCycle) * 6, playerY + 22);
      ctx.stroke();

      // Update Obstacle
      obstacleX.current -= speed;
      if (obstacleX.current < -100 && !collisionOccurred.current) {
        obstacleX.current = width; // Respawn if missed
      }

      // Draw Obstacle/Portals containing answers
      const obsX = obstacleX.current;
      choicesRef.current.forEach((choice, idx) => {
        const portalY = lanePositions[idx];

        // Draw portal ring
        ctx.fillStyle = 'rgba(79, 70, 229, 0.1)';
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(obsX, portalY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glowing particles inside portal
        const pulse = Math.sin(Date.now() / 200) * 3;
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(obsX, portalY, 23 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Choice text
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#1e1b4b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(choice, obsX, portalY);

        // Lane marker (e.g. Lane numbers to guide)
        ctx.font = '8px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`L${idx + 1}`, obsX - 35, portalY);
      });

      // Collision Detection
      if (Math.abs(obsX - playerX) < 25 && !collisionOccurred.current) {
        collisionOccurred.current = true;
        const chosenAnswer = choicesRef.current[playerLane];
        onAnswerSubmit(chosenAnswer);
        setIsPlaying(false);
      }

      animRef.current = requestAnimationFrame(gameLoop);
    };

    animRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, playerLane, onAnswerSubmit, hasSubmitted]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'w') {
      setPlayerLane(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowDown' || e.key === 's') {
      setPlayerLane(prev => Math.min(2, prev + 1));
    }
  };

  return (
    <div 
      className="space-y-4 outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl bg-slate-50 border border-slate-200 p-4"
      tabIndex={0}
      onKeyDown={handleKeyPress}
    >
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150">
          🎮 {language === 'vi' ? 'CHẾ ĐỘ TRÒ CHƠI HOẠT HÌNH' : 'ANIMATED GAME MODE'}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {language === 'vi' ? 'Dùng Phím mũi tên Lên/Xuống để chuyển làn' : 'Use Up/Down Arrow keys to switch lanes'}
        </span>
      </div>

      {/* Main Game Screen */}
      <div className="relative flex justify-center bg-white rounded-xl overflow-hidden border border-slate-200 shadow-inner">
        <canvas
          ref={canvasRef}
          width={500}
          height={190}
          className="w-full max-w-full"
        />

        {/* Start Game overlay */}
        {!isPlaying && !hasSubmitted && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3">
            <p className="font-bold text-sm text-center px-4">
              {language === 'vi' ? 'Sẵn sàng chạy và tính toán?' : 'Ready to Run & Calculate?'}
            </p>
            <button
              onClick={() => setIsPlaying(true)}
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold active:scale-95 transition-all shadow-md"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{language === 'vi' ? 'Bắt đầu chạy' : 'Start Running'}</span>
            </button>
          </div>
        )}

        {/* Feedback Overlay upon collision */}
        {hasSubmitted && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center ${
            isCorrect ? 'bg-emerald-900/80' : 'bg-rose-900/80'
          }`}>
            <Award className={`h-10 w-10 mb-1 ${isCorrect ? 'text-amber-400 animate-bounce' : 'text-slate-300'}`} />
            <p className="font-bold text-sm">
              {isCorrect 
                ? (language === 'vi' ? 'Chính xác! Cú nhảy tuyệt vời!' : 'Correct! Awesome Leap!')
                : (language === 'vi' ? 'Ôi! Vấp ngã rồi! Xem gợi ý bên dưới.' : 'Oops! You stumbled! See review below.')
              }
            </p>
            <button
              onClick={onNext}
              className="mt-3 px-4 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              {language === 'vi' ? 'Tiếp tục chạy' : 'Continue Running'}
            </button>
          </div>
        )}
      </div>

      {/* Direct Lane Switcher Buttons (for touch/click convenience) */}
      <div className="flex justify-center items-center gap-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'vi' ? 'Chuyển làn:' : 'Switch Lane:'}</span>
        <div className="flex gap-2">
          {[0, 1, 2].map(lane => (
            <button
              key={lane}
              onClick={() => setPlayerLane(lane)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                playerLane === lane
                  ? 'bg-indigo-600 text-white border-indigo-650'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {language === 'vi' ? `Làn ${lane + 1}` : `Lane ${lane + 1}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
