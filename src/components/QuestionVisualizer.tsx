/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Play, RotateCw, RefreshCw, Sparkles, HelpCircle, Check, ArrowRight } from 'lucide-react';
import { Question } from '../types';

interface QuestionVisualizerProps {
  question: Question;
  userAnswer: string;
  onChangeAnswer: (val: string) => void;
}

export default function QuestionVisualizer({
  question,
  userAnswer,
  onChangeAnswer
}: QuestionVisualizerProps) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // State for coordinate transformations (q16, q17, q18)
  const [plotPoint, setPlotPoint] = useState<{ x: number; y: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0); // 0 to 1
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  // State for rotational symmetry (q19, q20)
  const [rotationAngle, setRotationAngle] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [matchedAngles, setMatchedAngles] = useState<number[]>([]);

  // State for proportion scaling (q13, q14, q15)
  const [proportionScale, setProportionScale] = useState(1);

  // State for fraction equivalence (q8)
  const [fractionSlider, setFractionSlider] = useState(1);

  // Reset local states when question changes
  useEffect(() => {
    setPlotPoint(null);
    setIsAnimating(false);
    setAnimationProgress(0);
    setRotationAngle(0);
    setMatchesCount(0);
    setMatchedAngles([]);
    setProportionScale(1);
    setFractionSlider(1);
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, [question.id]);

  // Coordinate conversion helper for 2D Grid
  const gridRange = 5; // -5 to 5
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    startPt: { x: number; y: number; label: string },
    targetPt?: { x: number; y: number; label: string },
    lineSymmetry?: 'x' | 'y',
    isRotating?: boolean
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const step = width / (gridRange * 2 + 2); // grid size plus margins

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw Grid Lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let i = -gridRange; i <= gridRange; i++) {
      const x = centerX + i * step;
      const y = centerY - i * step;

      // Vertical
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Horizontal
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Mirror Line (if symmetry)
    if (lineSymmetry) {
      ctx.strokeStyle = '#c084fc'; // purple
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (lineSymmetry === 'x') {
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
      } else {
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, height);
      }
      ctx.stroke();

      // Label mirror
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#a855f7';
      if (lineSymmetry === 'x') {
        ctx.fillText(isVi ? 'Trục đối xứng X' : 'Mirror Line X', 10, centerY - 8);
      } else {
        ctx.fillText(isVi ? 'Trục Y' : 'Mirror Y', centerX + 8, 15);
      }
    }

    // Draw Axes
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // X Axis
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    // Y Axis
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Axis numbers
    ctx.font = '9px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = -gridRange; i <= gridRange; i++) {
      if (i === 0) continue;
      const x = centerX + i * step;
      const y = centerY - i * step;
      ctx.fillText(i.toString(), x, centerY + 10);
      ctx.fillText(i.toString(), centerX - 10, y);
    }
    // Origin O
    ctx.fillText('0', centerX - 8, centerY + 8);

    const toCanvas = (pt: { x: number; y: number }) => ({
      x: centerX + pt.x * step,
      y: centerY - pt.y * step
    });

    // Draw Starting Point
    const canvStart = toCanvas(startPt);
    ctx.beginPath();
    ctx.arc(canvStart.x, canvStart.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444'; // red
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#991b1b';
    ctx.textAlign = 'left';
    ctx.fillText(`${startPt.label}(${startPt.x},${startPt.y})`, canvStart.x + 8, canvStart.y - 8);

    // Draw Target/Animation
    if (targetPt) {
      const canvTarget = toCanvas(targetPt);

      if (isAnimating) {
        // Linear path or rotation path
        let currentX = startPt.x + (targetPt.x - startPt.x) * animationProgress;
        let currentY = startPt.y + (targetPt.y - startPt.y) * animationProgress;

        if (isRotating) {
          // Angle rotates CCW from start to target
          const startAngle = Math.atan2(startPt.y, startPt.x);
          const radius = Math.sqrt(startPt.x * startPt.x + startPt.y * startPt.y);
          const currentAngle = startAngle + (Math.PI / 2) * animationProgress; // 90 deg rotation
          currentX = radius * Math.cos(currentAngle);
          currentY = radius * Math.sin(currentAngle);

          // Draw rotation arc guide
          ctx.strokeStyle = 'rgba(79, 70, 229, 0.2)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * step, -startAngle, -currentAngle, true);
          ctx.stroke();
        } else if (lineSymmetry === 'x') {
          // Reflection perpendicular guide line
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(canvStart.x, canvStart.y);
          ctx.lineTo(canvStart.x, centerY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        const canvCurrent = toCanvas({ x: currentX, y: currentY });

        // Draw animating dot
        ctx.beginPath();
        ctx.arc(canvCurrent.x, canvCurrent.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#4f46e5'; // indigo
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (animationProgress >= 1) {
        // Draw static target point
        ctx.beginPath();
        ctx.arc(canvTarget.x, canvTarget.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981'; // green
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#065f46';
        ctx.fillText(`${targetPt.label}(${targetPt.x},${targetPt.y})`, canvTarget.x + 8, canvTarget.y - 8);

        // Vector path arrow
        if (!lineSymmetry && !isRotating) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(canvStart.x, canvStart.y);
          ctx.lineTo(canvTarget.x, canvTarget.y);
          ctx.stroke();

          // Draw simple arrowhead
          const angle = Math.atan2(canvTarget.y - canvStart.y, canvTarget.x - canvStart.x);
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.moveTo(canvTarget.x, canvTarget.y);
          ctx.lineTo(
            canvTarget.x - 8 * Math.cos(angle - Math.PI / 6),
            canvTarget.y - 8 * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            canvTarget.x - 8 * Math.cos(angle + Math.PI / 6),
            canvTarget.y - 8 * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Draw Plot Point (Student selected point)
    if (plotPoint) {
      const canvPlot = toCanvas(plotPoint);
      ctx.beginPath();
      ctx.arc(canvPlot.x, canvPlot.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(79, 70, 229, 0.4)';
      ctx.fill();
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#312e81';
      ctx.textAlign = 'center';
      ctx.fillText(`(${plotPoint.x},${plotPoint.y})`, canvPlot.x, canvPlot.y - 12);
    }
  };

  // Click handler on grid canvas to select coordinates
  const handleGridClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isAnimating) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const xClick = e.clientX - rect.left;
    const yClick = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const step = width / (gridRange * 2 + 2);

    // Convert canvas back to grid units, rounded to nearest integer
    const gridX = Math.round((xClick - centerX) / step);
    const gridY = Math.round((centerY - yClick) / step);

    if (Math.abs(gridX) <= gridRange && Math.abs(gridY) <= gridRange) {
      setPlotPoint({ x: gridX, y: gridY });
      onChangeAnswer(`(${gridX},${gridY})`);
    }
  };

  // Run Animation
  const startSimulation = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimationProgress(0);
    const startTime = performance.now();
    const duration = 1200; // 1.2 seconds

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  // Coordinate grid useEffect rendering
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (question.id === 'q16') {
      // Translation: A(2,3) by (1,-2) -> (3,1)
      drawGrid(ctx, canvas.width, canvas.height, { x: 2, y: 3, label: 'A' }, { x: 3, y: 1, label: "A'" });
    } else if (question.id === 'q17') {
      // Reflection: P(4,2) across x-axis -> (4,-2)
      drawGrid(ctx, canvas.width, canvas.height, { x: 4, y: 2, label: 'P' }, { x: 4, y: -2, label: "P'" }, 'x');
    } else if (question.id === 'q18') {
      // Rotation: Q(1,2) 90 deg CCW -> (-2,1)
      drawGrid(ctx, canvas.width, canvas.height, { x: 1, y: 2, label: 'Q' }, { x: -2, y: 1, label: "Q'" }, undefined, true);
    }
  }, [question.id, plotPoint, isAnimating, animationProgress]);

  // Rotational symmetry check for matching angles
  useEffect(() => {
    if (question.id === 'q19') {
      // Octagon (matches every 45 deg)
      const order = 8;
      const step = 360 / order;
      const currentStep = Math.round(rotationAngle / step);
      const diff = Math.abs(rotationAngle - currentStep * step);
      if (diff < 3) {
        const angleValue = currentStep * step;
        if (angleValue > 0 && angleValue <= 360 && !matchedAngles.includes(angleValue)) {
          setMatchedAngles(prev => [...prev, angleValue]);
          setMatchesCount(c => c + 1);
        }
      }
    } else if (question.id === 'q20') {
      // Hexagon (matches every 60 deg)
      const order = 6;
      const step = 360 / order;
      const currentStep = Math.round(rotationAngle / step);
      const diff = Math.abs(rotationAngle - currentStep * step);
      if (diff < 3) {
        const angleValue = currentStep * step;
        if (angleValue > 0 && angleValue <= 360 && !matchedAngles.includes(angleValue)) {
          setMatchedAngles(prev => [...prev, angleValue]);
          setMatchesCount(c => c + 1);
        }
      }
    }
  }, [rotationAngle, question.id]);

  // Visual aid helpers
  const renderVisualSimulation = () => {
    // 1. PLACE VALUE QUESTIONS (q1, q2, q3)
    if (question.id === 'q1' || question.id === 'q2') {
      const numStr = question.id === 'q1' ? '809.46' : '8.094';
      const highlightDigit = question.id === 'q1' ? '9' : '4';
      const highlightCol = question.id === 'q1' ? 'ones' : 'thousandths';

      const columns = [
        { key: 'hundreds', en: 'Hundreds', vi: 'Hàng trăm', val: '100' },
        { key: 'tens', en: 'Tens', vi: 'Hàng chục', val: '10' },
        { key: 'ones', en: 'Ones', vi: 'Đơn vị', val: '1' },
        { key: 'dot', en: '.', vi: '.', val: '.' },
        { key: 'tenths', en: 'Tenths', vi: 'Phần mười', val: '1/10' },
        { key: 'hundreds_dec', keyVal: 'hundredths', en: 'Hundredths', vi: 'Phần trăm', val: '1/100' },
        { key: 'thousandths', en: 'Thousandths', vi: 'Phần nghìn', val: '1/1000' }
      ];

      // Digit positions mapping for 809.46
      // index: [Hundreds: 8, Tens: 0, Ones: 9, Tenths: 4, Hundredths: 6]
      const digitMap: Record<string, string> = question.id === 'q1' 
        ? { hundreds: '8', tens: '0', ones: '9', tenths: '4', hundredths: '6' }
        : { ones: '8', tenths: '0', hundredths: '9', thousandths: '4' };

      return (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 space-y-3">
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
            {isVi ? 'Bảng Phân Tích Hàng Số Thập Phân:' : 'Place Value Grid Analysis:'}
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-center border border-indigo-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-indigo-600 text-white text-[10px] font-semibold">
                  {columns.map((col, idx) => {
                    const isColHighlighted = col.key === highlightCol || col.keyVal === highlightCol;
                    return (
                      <th 
                        key={idx} 
                        className={`p-2 border border-indigo-500 ${isColHighlighted ? 'bg-amber-500 text-white font-extrabold' : ''}`}
                      >
                        <div>{isVi ? col.vi : col.en}</div>
                        <div className="font-mono text-[9px] opacity-80">({col.val})</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white font-mono text-sm font-bold text-slate-800">
                  {columns.map((col, idx) => {
                    const colKey = col.keyVal || col.key;
                    const isColHighlighted = colKey === highlightCol;
                    const digit = col.key === 'dot' ? '.' : (digitMap[colKey] || '0');
                    return (
                      <td 
                        key={idx} 
                        className={`p-2.5 border border-indigo-100 ${
                          isColHighlighted 
                            ? 'bg-amber-50 text-amber-600 scale-105 border-2 border-amber-400' 
                            : 'text-slate-700'
                        }`}
                      >
                        {digit}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[10.5px] text-slate-500 italic text-center">
            {question.id === 'q1' 
              ? (isVi 
                  ? 'Chữ số 9 nằm ngay bên trái dấu phẩy thập phân thuộc hàng đơn vị.' 
                  : 'The digit 9 lies right to the left of the decimal point, representing Ones.')
              : (isVi 
                  ? 'Chữ số 4 nằm ở vị trí thứ ba sau dấu phẩy thập phân thuộc hàng phần nghìn.' 
                  : 'The digit 4 is at the third position after the decimal point, representing Thousandths.')}
          </p>
        </div>
      );
    }

    if (question.id === 'q3') {
      // Expanded form addition: 500 + 7 + 0.02 + 0.006
      return (
        <div className="rounded-xl border border-blue-100 bg-blue-50/20 p-4 flex flex-col items-center">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2 self-start">
            {isVi ? 'Phép Tính Đặt Dọc Căn Hàng Giá Trị:' : 'Vertical Column Addition (Place Value Alignment):'}
          </p>
          <div className="font-mono text-right text-xs text-slate-700 space-y-1 bg-white border border-slate-100 p-4 rounded-lg shadow-xs w-48">
            <div className="tracking-wide">500.000</div>
            <div className="tracking-wide">+ &nbsp;&nbsp;7.000</div>
            <div className="tracking-wide">+ &nbsp;&nbsp;0.020</div>
            <div className="tracking-wide">+ &nbsp;&nbsp;0.006</div>
            <div className="border-t border-slate-400 my-1 pt-1 font-bold text-blue-600 tracking-wide">
              507.026
            </div>
          </div>
          <p className="mt-2 text-[10.5px] text-slate-500 text-center">
            {isVi 
              ? 'Thêm số 0 giữ chỗ để các chữ số cùng hàng (Hàng chục, phần mười) thẳng cột với nhau.' 
              : 'Trailing zeros added to align all place value positions vertically.'}
          </p>
        </div>
      );
    }

    // 2. COMPARING FRACTIONS (q7, q8, q9)
    if (question.id === 'q7') {
      // Simplify 8/12 -> 2/3
      return (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-4 space-y-3">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            {isVi ? 'Mô Hình Trực Quan Rút Gọn Phân Số (8/12 = 2/3):' : 'Visual Fraction Model for Simplifying (8/12 = 2/3):'}
          </p>
          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="text-[10px] text-slate-550 mb-1">{isVi ? 'Thanh 8/12 (12 phần bằng nhau):' : '8/12 Bar (12 equal parts):'}</div>
              <div className="flex h-7 w-full border border-slate-200 rounded overflow-hidden">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 flex items-center justify-center border-r border-slate-100 text-[9px] font-bold ${
                      i < 8 ? 'bg-indigo-550 text-white' : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    1/12
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center text-slate-400">
              <ArrowRight className="h-4 w-4 rotate-90" />
            </div>

            <div>
              <div className="text-[10px] text-slate-550 mb-1">{isVi ? 'Thanh 2/3 (rút gọn về 3 phần bằng nhau):' : '2/3 Bar (simplified to 3 equal parts):'}</div>
              <div className="flex h-7 w-full border border-slate-200 rounded overflow-hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 flex items-center justify-center border-r border-slate-150 text-[10px] font-bold ${
                      i < 2 ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    1/3
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center text-[10.5px] text-slate-500">
            {isVi 
              ? 'Tử và mẫu cùng chia cho 4. Độ dài phần tô màu không đổi!' 
              : 'Both numerator and denominator divided by 4. Shaded area length remains identical!'}
          </div>
        </div>
      );
    }

    if (question.id === 'q8') {
      // Equivalent fractions: 3/7 = x/28 (x=12)
      return (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              {isVi ? 'Tìm Phân Số Bằng Nhau Bằng Cách Kéo Trượt:' : 'Drag Slider to Find Equivalent Fraction:'}
            </p>
            <span className="text-xs font-bold text-indigo-650">x = {fractionSlider}</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="text-[10px] text-slate-500 mb-1">{isVi ? 'Thanh mẫu 3/7 (tô đậm 3 phần):' : 'Reference 3/7 Bar (3 parts shaded):'}</div>
              <div className="flex h-6 w-full border border-slate-200 rounded overflow-hidden bg-slate-50">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 flex items-center justify-center border-r border-slate-150 text-[9px] font-bold ${
                      i < 3 ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    1/7
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 mb-1">
                {isVi ? `Thanh x/28 (đang tô ${fractionSlider}/28 phần):` : `Equivalent x/28 Bar (${fractionSlider}/28 parts shaded):`}
              </div>
              <div className="flex h-6 w-full border border-slate-200 rounded overflow-hidden bg-slate-50">
                {Array.from({ length: 28 }).map((_, i) => {
                  const isShaded = i < fractionSlider;
                  const isCorrectMatch = fractionSlider === 12;
                  return (
                    <div 
                      key={i} 
                      className={`flex-1 border-r border-slate-100 ${
                        isShaded 
                          ? (isCorrectMatch ? 'bg-emerald-500' : 'bg-indigo-400') 
                          : ''
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Slider */}
            <div>
              <input 
                type="range"
                min="1"
                max="28"
                step="1"
                value={fractionSlider}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFractionSlider(val);
                  if (val === 12) {
                    onChangeAnswer('12');
                  }
                }}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650"
              />
              <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                <span>1/28</span>
                <span>12/28 {isVi ? '(Khớp 3/7!)' : '(Matches 3/7!)'}</span>
                <span>28/28</span>
              </div>
            </div>
          </div>

          {fractionSlider === 12 ? (
            <div className="p-2 bg-emerald-50 border border-emerald-150 rounded-lg text-emerald-800 text-[10.5px] font-bold flex items-center gap-1.5 justify-center">
              <Check className="h-4 w-4" />
              <span>{isVi ? 'Đã tìm được x = 12 trùng khớp chính xác!' : 'Found x = 12, perfectly matching!'}</span>
            </div>
          ) : (
            <div className="text-center text-[10.5px] text-indigo-500 italic font-medium">
              {isVi 
                ? 'Hãy trượt để tô kín thanh thứ hai trùng với chiều dài của thanh 3/7.' 
                : 'Drag the slider to match the length of the 3/7 reference bar.'}
            </div>
          )}
        </div>
      );
    }

    if (question.id === 'q9') {
      // Compare 3/4 and 5/6
      const is34LargerSelected = userAnswer === '3/4';
      const is56LargerSelected = userAnswer === '5/6';

      return (
        <div className="rounded-xl border border-amber-100 bg-amber-50/20 p-4 space-y-3">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
            {isVi ? 'Nhấp Chọn Phân Số Lớn Hơn Bằng Mô Hình Trực Quan:' : 'Click Larger Fraction using Grid Bars:'}
          </p>
          <div className="space-y-3">
            {/* 3/4 Bar */}
            <button
              type="button"
              onClick={() => onChangeAnswer('3/4')}
              className={`w-full text-left p-2 rounded-lg border transition-all ${
                is34LargerSelected ? 'border-amber-500 bg-amber-50 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-350'
              }`}
            >
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>3/4 {isVi ? '(quy đồng thành 9/12)' : '(equivalent to 9/12)'}</span>
                {is34LargerSelected && <span className="text-amber-600 text-[10px]">✓ Selected</span>}
              </div>
              <div className="flex h-5 w-full border border-slate-200 rounded overflow-hidden">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 border-r border-slate-150 ${
                      i < 9 ? 'bg-amber-400' : 'bg-slate-50'
                    }`}
                  />
                ))}
              </div>
            </button>

            {/* 5/6 Bar */}
            <button
              type="button"
              onClick={() => onChangeAnswer('5/6')}
              className={`w-full text-left p-2 rounded-lg border transition-all ${
                is56LargerSelected ? 'border-emerald-500 bg-emerald-50 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-350'
              }`}
            >
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>5/6 {isVi ? '(quy đồng thành 10/12)' : '(equivalent to 10/12)'}</span>
                {is56LargerSelected && <span className="text-emerald-600 text-[10px]">✓ Selected</span>}
              </div>
              <div className="flex h-5 w-full border border-slate-200 rounded overflow-hidden">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 border-r border-slate-150 ${
                      i < 10 ? 'bg-emerald-500' : 'bg-slate-50'
                    }`}
                  />
                ))}
              </div>
            </button>
          </div>
          <p className="text-center text-[10.5px] text-slate-500">
            {isVi 
              ? 'Quy đồng mẫu số chung là 12. 5/6 (10/12) lớn hơn 3/4 (9/12) đúng 1 phần.' 
              : 'Common denominator is 12. 5/6 (10/12) is larger than 3/4 (9/12) by 1 part.'}
          </p>
        </div>
      );
    }

    // 3. PERCENTAGES (q10, q11, q12)
    if (question.id === 'q10' || question.id === 'q11') {
      const pct = question.id === 'q10' ? 25 : 75;
      const amount = question.id === 'q10' ? '$120' : '60m';
      const ans = question.id === 'q10' ? '30' : '45';

      return (
        <div className="rounded-xl border border-blue-100 bg-blue-50/20 p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 36 36" className="h-full w-full rotate-270">
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3.5"
                strokeDasharray={`${pct} ${100 - pct}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-sm font-extrabold text-blue-600">{pct}%</span>
              <span className="text-[8px] text-slate-400 font-bold">({ans})</span>
            </div>
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-700">
              {isVi ? `Biểu đồ Tỉ lệ phần trăm (${pct}% của tổng ${amount}):` : `Percentage Pie Chart (${pct}% of ${amount}):`}
            </p>
            <p className="text-slate-550 mt-1 leading-relaxed text-[11px]">
              {question.id === 'q10' 
                ? (isVi 
                    ? '25% tương đương 1/4 hình tròn. Chia $120 thành 4 phần bằng nhau, mỗi phần trị giá $30.' 
                    : '25% equals 1/4 of a circle. Divide $120 into 4 equal parts; each part is $30.')
                : (isVi 
                    ? '75% tương đương 3/4 hình tròn. 1/4 là 15, vậy 3 phần là 15 × 3 = 45 mét.' 
                    : '75% equals 3/4 of a circle. 1/4 is 15m, so 3 parts is 15 × 3 = 45 meters.')}
            </p>
          </div>
        </div>
      );
    }

    if (question.id === 'q12') {
      // 10% discount of $90 -> $81
      return (
        <div className="rounded-xl border border-rose-100 bg-rose-50/20 p-4 space-y-3">
          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
            {isVi ? 'Thanh Trực Quan Hóa Mức Giảm Giá (Giảm 10%):' : 'Discount Visualizer (10% Reduction):'}
          </p>
          <div className="font-mono text-xs space-y-2">
            <div className="text-[9px] text-slate-450 flex justify-between">
              <span>{isVi ? 'Giá gốc: $90 (100%)' : 'Original price: $90 (100%)'}</span>
              <span className="text-rose-500 font-bold">{isVi ? 'Được giảm: $9 (10%)' : 'Discount: $9 (10%)'}</span>
            </div>
            
            <div className="h-6 w-full flex border border-slate-200 rounded overflow-hidden">
              <div className="w-[90%] bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                {isVi ? 'Giá bán: $81 (90%)' : 'Sale price: $81 (90%)'}
              </div>
              <div className="w-[10%] bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-[9px] border-l border-rose-200">
                -10%
              </div>
            </div>
          </div>
          <p className="text-center text-[10.5px] text-slate-550">
            {isVi 
              ? 'Lấy 10% của $90 được $9. Giá bán thực tế bằng $90 - $9 = $81.' 
              : 'Calculate 10% of $90 which is $9. The sale price is $90 - $9 = $81.'}
          </p>
        </div>
      );
    }

    // 4. PROPORTION (q13, q14, q15)
    if (question.id === 'q13' || question.id === 'q14' || question.id === 'q15') {
      const config = question.id === 'q13' ? {
        titleVi: 'Trục Số Kép Tỉ Lệ Thuận (Số Vở vs Giá Tiền):',
        titleEn: 'Double Number Line Scale (Notebooks vs Cost):',
        topLabelVi: 'Số quyển vở',
        topLabelEn: 'Notebooks',
        botLabelVi: 'Giá tiền ($)',
        botLabelEn: 'Cost ($)',
        topPoints: [0, 4, 8, 12],
        botPoints: [0, 20, 40, 60],
        maxVal: 12,
        scale: 3
      } : question.id === 'q14' ? {
        titleVi: 'Trục Số Kép Tỉ Lệ Thuận (Số Người vs Bột Mì):',
        titleEn: 'Double Number Line Scale (People vs Flour):',
        topLabelVi: 'Số người ăn',
        topLabelEn: 'People',
        botLabelVi: 'Bột mì (g)',
        botLabelEn: 'Flour (g)',
        topPoints: [0, 3, 6, 9],
        botPoints: [0, 150, 300, 450],
        maxVal: 9,
        scale: 1.5
      } : {
        titleVi: 'Trục Số Kép Tỉ Lệ Thuận (Quãng Đường vs Xăng):',
        titleEn: 'Double Number Line Scale (Distance vs Petrol):',
        topLabelVi: 'Quãng đường (km)',
        topLabelEn: 'Distance (km)',
        botLabelVi: 'Xăng tiêu thụ (L)',
        botLabelEn: 'Petrol (L)',
        topPoints: [0, 150, 300, 450, 600],
        botPoints: [0, 10, 20, 30, 40],
        maxVal: 600,
        scale: 4
      };

      return (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 space-y-4">
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
            {isVi ? config.titleVi : config.titleEn}
          </p>

          <div className="relative pt-4 pb-2 px-6">
            {/* Horizontal timeline line */}
            <div className="absolute top-[48px] left-6 right-6 h-0.5 bg-slate-350" />
            
            <div className="flex justify-between relative">
              {config.topPoints.map((val, idx) => {
                const isTarget = idx === config.topPoints.length - 1;
                return (
                  <div key={idx} className="flex flex-col items-center relative z-10">
                    <span className={`text-[10px] font-bold ${isTarget ? 'text-indigo-600 font-extrabold text-xs' : 'text-slate-650'}`}>
                      {val}
                    </span>
                    <div className={`h-3 w-0.5 my-1 ${isTarget ? 'bg-indigo-600 h-4 w-1' : 'bg-slate-400'}`} />
                    <span className={`text-[10px] font-bold ${isTarget ? 'text-indigo-600 font-extrabold text-xs' : 'text-slate-650'}`}>
                      {config.botPoints[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Arrow indicating scaling */}
            <div className="absolute -top-1.5 left-[15%] right-[15%] flex flex-col items-center">
              <span className="text-[9px] font-bold text-indigo-550 bg-white px-2 border border-indigo-100 rounded-full">
                ×{config.scale}
              </span>
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 px-2 font-semibold">
            <span>{isVi ? `Dòng trên: ${config.topLabelVi}` : `Top Line: ${config.topLabelEn}`}</span>
            <span>{isVi ? `Dòng dưới: ${config.botLabelVi}` : `Bottom Line: ${config.botLabelEn}`}</span>
          </div>
        </div>
      );
    }

    // 5. COORDINATE GEOMETRY (q16, q17, q18)
    if (question.id === 'q16' || question.id === 'q17' || question.id === 'q18') {
      const hintMsg = question.id === 'q16'
        ? (isVi 
            ? 'Nhấp chuột trực tiếp vào ô lưới tọa độ bên dưới để lựa chọn đáp án mong muốn.' 
            : 'Click directly on the grid below to plot your coordinate guess.')
        : (isVi
            ? 'Hãy kéo trượt hoặc nhấp trên bảng lưới để tìm điểm đối xứng chính xác.'
            : 'Click on the coordinate grid below to plot the matching transformation point.');

      return (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/25 p-4 flex flex-col items-center gap-3">
          <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider align-middle">
              {isVi ? 'Lưới Tọa Độ Tương Tác 2D:' : 'Interactive Coordinate Grid:'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startSimulation}
                disabled={isAnimating}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
              >
                <Play className="h-3 w-3" />
                {isVi ? 'Xem Mô phỏng' : 'Simulate'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlotPoint(null);
                  onChangeAnswer('');
                }}
                className="rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold text-[10px] px-3 py-1.5 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Reset
              </button>
            </div>
          </div>

          <div className="relative">
            <canvas
              ref={canvasRef}
              width={260}
              height={260}
              onClick={handleGridClick}
              className="border border-slate-200 rounded-xl bg-slate-50 cursor-crosshair shadow-sm"
            />
          </div>

          <div className="text-center text-[10px] text-slate-450 max-w-sm flex items-center gap-1 justify-center leading-relaxed">
            <HelpCircle className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span>{hintMsg}</span>
          </div>

          {plotPoint && (
            <div className="text-[11px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-150 px-3 py-1 rounded-full flex items-center gap-1">
              <span>{isVi ? `Đã chọn: (${plotPoint.x}, ${plotPoint.y})` : `Selected Point: (${plotPoint.x}, ${plotPoint.y})`}</span>
            </div>
          )}
        </div>
      );
    }

    // 6. ROTATIONAL SYMMETRY (q19, q20)
    if (question.id === 'q19' || question.id === 'q20') {
      const order = question.id === 'q19' ? 8 : 6;
      const step = 360 / order;

      return (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 flex flex-col items-center gap-4">
          <div className="w-full flex justify-between items-center">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              {isVi ? `Thử Nghiệm Xoay Đối Xứng (${order} Cạnh):` : `Rotational Symmetry Slider (${order} sides):`}
            </span>
            <span className="font-mono text-xs font-bold text-indigo-700">{rotationAngle}°</span>
          </div>

          {/* SVG Shape Container */}
          <div className="h-28 w-28 relative flex items-center justify-center">
            {/* Outline Reference */}
            <svg viewBox="0 0 100 100" className="absolute h-full w-full opacity-15 text-slate-800">
              {question.id === 'q19' ? (
                <polygon points="50,5 82,18 95,50 82,82 50,95 18,82 5,50 18,18" fill="none" stroke="currentColor" strokeWidth="3" />
              ) : (
                <polygon points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5" fill="none" stroke="currentColor" strokeWidth="3" />
              )}
            </svg>

            {/* Rotated Shape */}
            <svg 
              viewBox="0 0 100 100" 
              style={{ transform: `rotate(${rotationAngle}deg)`, transition: isAnimating ? 'transform 0.05s linear' : 'none' }}
              className="absolute h-full w-full text-indigo-600 transition-transform"
            >
              {question.id === 'q19' ? (
                <polygon 
                  points="50,5 82,18 95,50 82,82 50,95 18,82 5,50 18,18" 
                  fill="rgba(79, 70, 229, 0.12)" 
                  stroke="currentColor" 
                  strokeWidth="3.5" 
                />
              ) : (
                <polygon 
                  points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5" 
                  fill="rgba(79, 70, 229, 0.12)" 
                  stroke="currentColor" 
                  strokeWidth="3.5" 
                />
              )}
              {/* Highlight Vertex to watch rotation */}
              <circle cx="50" cy="5" r="4.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
            </svg>

            {/* Small center pivot dot */}
            <div className="h-2 w-2 rounded-full bg-slate-800 absolute z-10" />
          </div>

          {/* Slider */}
          <div className="w-full space-y-2">
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={rotationAngle}
              onChange={(e) => setRotationAngle(Number(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650"
            />
            
            <div className="flex justify-between text-[9px] text-slate-450 font-bold font-mono">
              <span>0°</span>
              {Array.from({ length: order - 1 }).map((_, i) => (
                <span key={i}>{(i + 1) * step}°</span>
              ))}
              <span>360°</span>
            </div>
          </div>

          {/* Stats / Matches */}
          <div className="w-full flex justify-between items-center text-[10.5px] border-t border-indigo-100 pt-2.5 px-1 font-semibold text-slate-650">
            <div>
              {isVi ? 'Số lần trùng khớp:' : 'Perfect Matches:'}{' '}
              <span className="font-mono text-emerald-600 font-extrabold text-sm">{matchesCount}</span> / {order}
            </div>
            <button
              type="button"
              onClick={() => {
                setRotationAngle(0);
                setMatchesCount(0);
                setMatchedAngles([]);
              }}
              className="text-[9px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5 border border-slate-250 px-2 py-0.5 rounded bg-white shadow-3xs"
            >
              Reset
            </button>
          </div>

          <div className="text-[10.5px] text-slate-500 italic text-center max-w-sm">
            {isVi 
              ? `Xoay đa giác và đếm xem có bao nhiêu lần hình khớp hoàn toàn với đường viền cũ. (Xoay mỗi ${step}° để tìm một trùng khớp).`
              : `Rotate the shape and count overlaps. Matches perfectly every ${step}° of rotation.`}
          </div>
        </div>
      );
    }

    return null;
  };

  const simulationBlock = renderVisualSimulation();
  if (!simulationBlock) return null;

  return (
    <div className="my-5 border-y border-slate-100 py-4 shrink-0 w-full" id={`visualizer_${question.id}`}>
      {simulationBlock}
    </div>
  );
}
