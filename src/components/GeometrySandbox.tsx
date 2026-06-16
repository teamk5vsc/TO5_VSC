/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { RefreshCw, PenTool, Move, RotateCw, Sparkles, Trash2 } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

export default function GeometrySandbox() {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'transform' | 'symmetry'>('transform');

  // Transform States
  const [vertices, setVertices] = useState<Point[]>([
    { x: 1, y: 1 },
    { x: 3, y: 1 },
    { x: 2, y: 3 }
  ]);
  const [transformed, setTransformed] = useState<Point[] | null>(null);
  const [transformType, setTransformType] = useState<string>('');
  
  // Sliders for Translation
  const [dx, setDx] = useState<number>(2);
  const [dy, setDy] = useState<number>(-1);
  
  // Selection for Reflection
  const [reflectAxis, setReflectAxis] = useState<'x' | 'y'>('x');

  // Selection for Rotation
  const [rotateAngle, setRotateAngle] = useState<90 | 180 | 270>(90);

  // Symmetry States
  const [symmetryOrder, setSymmetryOrder] = useState<number>(4);
  const [brushColor, setBrushColor] = useState<string>('#4f46e5'); // Indigo
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const canvasRefTransform = useRef<HTMLCanvasElement | null>(null);
  const canvasRefSymmetry = useRef<HTMLCanvasElement | null>(null);

  // Draw Transform Grid
  useEffect(() => {
    if (activeTab !== 'transform' || !canvasRefTransform.current) return;
    const canvas = canvasRefTransform.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const step = width / 12; // -6 to 6 coordinate range

    // Draw grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 1; i < 12; i++) {
      // Vertical
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, height);
      ctx.stroke();

      // Horizontal
      ctx.beginPath();
      ctx.moveTo(0, i * step);
      ctx.lineTo(width, i * step);
      ctx.stroke();
    }

    // Draw main axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Axis markings
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let val = -5; val <= 5; val++) {
      if (val === 0) continue;
      const xPos = centerX + val * step;
      const yPos = centerY - val * step;
      ctx.fillText(val.toString(), xPos, centerY + 5);
      ctx.fillText(val.toString(), centerX - 12, yPos - 5);
    }

    // Helper coordinate converter
    const toCanvas = (pt: Point) => ({
      x: centerX + pt.x * step,
      y: centerY - pt.y * step
    });

    // Draw Original Polygon (Red dotted)
    const drawPolygon = (pts: Point[], isTransformed: boolean) => {
      if (pts.length < 3) return;
      ctx.beginPath();
      const first = toCanvas(pts[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < pts.length; i++) {
        const next = toCanvas(pts[i]);
        ctx.lineTo(next.x, next.y);
      }
      ctx.closePath();

      if (isTransformed) {
        ctx.fillStyle = 'rgba(79, 70, 229, 0.15)';
        ctx.fill();
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
      }

      // Draw and label vertices
      pts.forEach((pt, idx) => {
        const canvPt = toCanvas(pt);
        ctx.beginPath();
        ctx.arc(canvPt.x, canvPt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = isTransformed ? '#4f46e5' : '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = isTransformed ? '#312e81' : '#7f1d1d';
        const label = String.fromCharCode(65 + idx) + (isTransformed ? "'" : "");
        ctx.fillText(`${label}(${pt.x},${pt.y})`, canvPt.x + 8, canvPt.y - 12);
      });
    };

    drawPolygon(vertices, false);
    if (transformed) {
      drawPolygon(transformed, true);
    }
  }, [vertices, transformed, activeTab]);

  // Draw symmetry background guides
  useEffect(() => {
    if (activeTab !== 'symmetry' || !canvasRefSymmetry.current) return;
    const canvas = canvasRefSymmetry.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas to white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw radial divisions
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < symmetryOrder; i++) {
      const angle = (i * 2 * Math.PI) / symmetryOrder;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * centerX * 1.5,
        centerY + Math.sin(angle) * centerY * 1.5
      );
      ctx.stroke();
    }

    // Draw concentric circles
    ctx.strokeStyle = '#f8fafc';
    for (let r = 50; r <= centerX; r += 50) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Small center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
  }, [symmetryOrder, activeTab]);

  // Operations
  const handleTranslate = () => {
    const next = vertices.map(v => ({
      x: Number((v.x + dx).toFixed(1)),
      y: Number((v.y + dy).toFixed(1))
    }));
    setTransformed(next);
    setTransformType('translation');
  };

  const handleReflect = () => {
    const next = vertices.map(v => {
      if (reflectAxis === 'x') {
        return { x: v.x, y: -v.y };
      } else {
        return { x: -v.x, y: v.y };
      }
    });
    setTransformed(next);
    setTransformType('reflection');
  };

  const handleRotate = () => {
    const next = vertices.map(v => {
      const rad = (rotateAngle * Math.PI) / 180;
      // Counterclockwise rotation round origin
      // x' = x cos θ - y sin θ
      // y' = x sin θ + y cos θ
      // Since 90 CCW: cos 90 = 0, sin 90 = 1 -> x' = -y, y' = x
      // 180: cos 180 = -1, sin 180 = 0 -> x' = -x, y' = -y
      // 270: cos 270 = 0, sin 270 = -1 -> x' = y, y' = -x
      let rx = v.x;
      let ry = v.y;
      if (rotateAngle === 90) {
        rx = -v.y;
        ry = v.x;
      } else if (rotateAngle === 180) {
        rx = -v.x;
        ry = -v.y;
      } else if (rotateAngle === 270) {
        rx = v.y;
        ry = -v.x;
      }
      return { x: rx, y: ry };
    });
    setTransformed(next);
    setTransformType('rotation');
  };

  const handleReset = () => {
    setTransformed(null);
    setTransformType('');
  };

  // Drawing in Symmetry Canvas
  const getCanvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRefSymmetry.current) return { x: 0, y: 0 };
    const rect = canvasRefSymmetry.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const drawSymmetricLine = (x1: number, y1: number, x2: number, y2: number) => {
    if (!canvasRefSymmetry.current) return;
    const canvas = canvasRefSymmetry.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Convert inputs relative to center
    const rx1 = x1 - centerX;
    const ry1 = y1 - centerY;
    const rx2 = x2 - centerX;
    const ry2 = y2 - centerY;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    for (let i = 0; i < symmetryOrder; i++) {
      const angle = (i * 2 * Math.PI) / symmetryOrder;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Rotate coordinates: (x cos - y sin, x sin + y cos)
      const tx1 = rx1 * cosA - ry1 * sinA + centerX;
      const ty1 = rx1 * sinA + ry1 * cosA + centerY;
      const tx2 = rx2 * cosA - ry2 * sinA + centerX;
      const ty2 = rx2 * sinA + ry2 * cosA + centerY;

      ctx.beginPath();
      ctx.moveTo(tx1, ty1);
      ctx.lineTo(tx2, ty2);
      ctx.stroke();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasMousePos(e);
    setIsDrawing(true);
    lastPoint.current = pos;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint.current) return;
    const pos = getCanvasMousePos(e);
    drawSymmetricLine(lastPoint.current.x, lastPoint.current.y, pos.x, pos.y);
    lastPoint.current = pos;
  };

  const handleMouseUpOrLeave = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const handleClearSymmetry = () => {
    if (!canvasRefSymmetry.current) return;
    const canvas = canvasRefSymmetry.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw guidelines
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < symmetryOrder; i++) {
      const angle = (i * 2 * Math.PI) / symmetryOrder;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * centerX * 1.5, centerY + Math.sin(angle) * centerY * 1.5);
      ctx.stroke();
    }

    ctx.strokeStyle = '#f8fafc';
    for (let r = 50; r <= centerX; r += 50) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('transform')}
          className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 text-center ${
            activeTab === 'transform'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {language === 'vi' ? 'Lưới Biến đổi Tọa độ (Unit 16)' : 'Coordinate Transformation Grid (Unit 16)'}
        </button>
        <button
          onClick={() => setActiveTab('symmetry')}
          className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 text-center ${
            activeTab === 'symmetry'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {language === 'vi' ? 'Sân chơi Đối xứng Quay (Unit 6)' : 'Rotational Symmetry Playground (Unit 6)'}
        </button>
      </div>

      {activeTab === 'transform' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Canvas grid column */}
          <div className="md:col-span-6 flex flex-col items-center">
            <canvas
              ref={canvasRefTransform}
              width={320}
              height={320}
              className="border border-slate-200 rounded-xl shadow-xs bg-slate-50"
            />
            <div className="mt-3 flex gap-4 text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-red-650">
                <span className="h-2 w-4 inline-block border border-dashed border-red-500 bg-red-500/10" />
                {language === 'vi' ? 'Hình gốc ABC' : 'Original Shape ABC'}
              </span>
              {transformed && (
                <span className="flex items-center gap-1 text-indigo-600">
                  <span className="h-2 w-4 inline-block bg-indigo-500/20 border border-indigo-500" />
                  {language === 'vi' ? "Hình ảnh biến đổi A'B'C'" : "Transformed Shape A'B'C'"}
                </span>
              )}
            </div>
          </div>

          {/* Operation Controls Column */}
          <div className="md:col-span-6 space-y-4">
            {/* Translation block */}
            <div className="rounded-xl border border-slate-150 p-4 space-y-3 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Move className="h-4 w-4 text-indigo-600" />
                {language === 'vi' ? '1. Phép Tịnh Tiến' : '1. Translation'}
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {language === 'vi'
                  ? 'Trượt đa giác theo trục ngang X (dx) và trục đứng Y (dy):'
                  : 'Slide the shape horizontally (dx) and vertically (dy):'}
              </p>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">dx: {dx}</label>
                  <input
                    type="range"
                    min="-4"
                    max="4"
                    step="1"
                    value={dx}
                    onChange={(e) => setDx(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">dy: {dy}</label>
                  <input
                    type="range"
                    min="-4"
                    max="4"
                    step="1"
                    value={dy}
                    onChange={(e) => setDy(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>

              <button
                onClick={handleTranslate}
                className="w-full py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors"
              >
                {language === 'vi' ? 'Thực hiện Tịnh tiến' : 'Apply Translation'}
              </button>
            </div>

            {/* Reflection block */}
            <div className="rounded-xl border border-slate-150 p-4 space-y-3 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                {language === 'vi' ? '2. Phép Đối Xứng Trục' : '2. Axis Reflection'}
              </h4>
              <p className="text-[10px] text-slate-500">
                {language === 'vi' ? 'Lật đa giác qua trục đối xứng:' : 'Flip shape across the reflecting mirror axis:'}
              </p>

              <div className="flex gap-4 text-xs font-bold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={reflectAxis === 'x'}
                    onChange={() => setReflectAxis('x')}
                    className="accent-indigo-600"
                  />
                  <span>{language === 'vi' ? 'Trục hoành X' : 'Horizontal X-axis'}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={reflectAxis === 'y'}
                    onChange={() => setReflectAxis('y')}
                    className="accent-indigo-600"
                  />
                  <span>{language === 'vi' ? 'Trục tung Y' : 'Vertical Y-axis'}</span>
                </label>
              </div>

              <button
                onClick={handleReflect}
                className="w-full py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors"
              >
                {language === 'vi' ? 'Thực hiện Đối xứng' : 'Apply Reflection'}
              </button>
            </div>

            {/* Rotation block */}
            <div className="rounded-xl border border-slate-150 p-4 space-y-3 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <RotateCw className="h-4 w-4 text-indigo-600" />
                {language === 'vi' ? '3. Phép Quay quanh Gốc' : '3. Rotation around Origin'}
              </h4>
              <p className="text-[10px] text-slate-500">
                {language === 'vi' ? 'Xoay đa giác ngược chiều kim đồng hồ:' : 'Turn shape counterclockwise around O(0,0):'}
              </p>

              <div className="flex gap-4 text-xs font-bold">
                {([90, 180, 270] as const).map(angle => (
                  <label key={angle} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={rotateAngle === angle}
                      onChange={() => setRotateAngle(angle)}
                      className="accent-indigo-600"
                    />
                    <span>{angle}°</span>
                  </label>
                ))}
              </div>

              <button
                onClick={handleRotate}
                className="w-full py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors"
              >
                {language === 'vi' ? 'Thực hiện Phép quay' : 'Apply Rotation'}
              </button>
            </div>

            {transformed && (
              <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl space-y-2 text-[10.5px]">
                <div className="flex justify-between items-center font-bold text-indigo-900">
                  <span>{language === 'vi' ? 'Công thức Tọa độ biến đổi:' : 'Transformation Formula:'}</span>
                  <button onClick={handleReset} className="text-[9px] hover:underline flex items-center gap-0.5 text-slate-500">
                    <RefreshCw className="h-2.5 w-2.5" />
                    Reset
                  </button>
                </div>
                <div className="font-mono text-slate-700 space-y-1">
                  {transformType === 'translation' && (
                    <>
                      <p>A(1,1) → A'(1+{dx}, 1+{dy}) = A'({transformed[0].x}, {transformed[0].y})</p>
                      <p>B(3,1) → B'(3+{dx}, 1+{dy}) = B'({transformed[1].x}, {transformed[1].y})</p>
                      <p>C(2,3) → C'(2+{dx}, 3+{dy}) = C'({transformed[2].x}, {transformed[2].y})</p>
                    </>
                  )}
                  {transformType === 'reflection' && (
                    <>
                      <p>{language === 'vi' ? 'Công thức: (x, y) → ' : 'Formula: (x, y) → '}{reflectAxis === 'x' ? '(x, -y)' : '(-x, y)'}</p>
                      <p>A(1,1) → A'({transformed[0].x}, {transformed[0].y})</p>
                      <p>B(3,1) → B'({transformed[1].x}, {transformed[1].y})</p>
                      <p>C(2,3) → C'({transformed[2].x}, {transformed[2].y})</p>
                    </>
                  )}
                  {transformType === 'rotation' && (
                    <>
                      <p>{language === 'vi' ? `Quay ${rotateAngle}° CCW quanh tâm O(0,0)` : `Rotate ${rotateAngle}° CCW around O(0,0)`}</p>
                      <p>A(1,1) → A'({transformed[0].x}, {transformed[0].y})</p>
                      <p>B(3,1) → B'({transformed[1].x}, {transformed[1].y})</p>
                      <p>C(2,3) → C'({transformed[2].x}, {transformed[2].y})</p>
                    </>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Drawing Canvas */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="relative">
              <canvas
                ref={canvasRefSymmetry}
                width={320}
                height={320}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                className="border border-slate-200 rounded-xl shadow-xs cursor-crosshair bg-white"
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-400 text-center italic">
              {language === 'vi'
                ? 'Hãy rê chuột vẽ ở một góc bất kỳ, nét vẽ sẽ được nhân bản đối xứng quay!'
                : 'Click and drag to draw on the canvas and watch the pattern rotate symmetrically!'}
            </p>
          </div>

          {/* Control parameters */}
          <div className="md:col-span-6 space-y-4">
            <div className="rounded-xl border border-slate-150 p-4 space-y-4 bg-slate-50/50">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <PenTool className="h-4 w-4 text-indigo-600" />
                  {language === 'vi' ? 'Bậc Đối Xứng Quay' : 'Rotational Symmetry Order'}
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {language === 'vi'
                    ? 'Chọn số trục xoay đối xứng. Nét vẽ sẽ tự động lặp lại theo bội số tương ứng.'
                    : 'Choose the order of rotational symmetry. The canvas rotates and repeats your strokes.'}
                </p>
              </div>

              {/* Order selector buttons */}
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 5, 6, 8].map(order => (
                  <button
                    key={order}
                    onClick={() => setSymmetryOrder(order)}
                    className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs transition-all border ${
                      symmetryOrder === order
                        ? 'bg-indigo-600 text-white border-indigo-650 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    N = {order}
                  </button>
                ))}
              </div>

              {/* Brush Color Picker */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{language === 'vi' ? 'Màu vẽ' : 'Brush Color'}</label>
                <div className="flex gap-2">
                  {['#4f46e5', '#ef4444', '#10b981', '#0f172a'].map(color => (
                    <button
                      key={color}
                      onClick={() => setBrushColor(color)}
                      style={{ backgroundColor: color }}
                      className={`h-6 w-6 rounded-full border-2 transition-transform ${
                        brushColor === color ? 'border-amber-400 scale-110' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Clear button */}
              <button
                onClick={handleClearSymmetry}
                className="w-full py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {language === 'vi' ? 'Xóa bảng vẽ' : 'Clear Canvas'}
              </button>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-150 rounded-xl text-[10.5px] leading-relaxed space-y-1">
              <p className="font-bold text-indigo-950">{language === 'vi' ? 'Ứng dụng thực tế:' : 'Real-world application:'}</p>
              <p className="text-slate-700">
                {language === 'vi'
                  ? `Mỗi khi bạn xoay hình một góc 360° / ${symmetryOrder} = ${360 / symmetryOrder}°, nét vẽ sẽ hoàn toàn trùng khít lên nét vẽ khác.`
                  : `Each time you rotate the canvas by 360° / ${symmetryOrder} = ${360 / symmetryOrder}°, the pattern will fit perfectly onto itself.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
