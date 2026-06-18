/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { RefreshCw, PenTool, Move, RotateCw, Sparkles, Trash2, Box, Rotate3d, Play, Pause } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Face3D {
  name: string;
  vertices: Point3D[];
  colorBase: string; // HSL prefix e.g. 'hsl(243, 75%, '
}

// Computes 3D face coordinates depending on selected shape and foldRatio (0 = flat 2D net, 1 = fully folded 3D shape)
function getGeometry3DData(shape: string, foldRatio: number): Face3D[] {
  const faces: Face3D[] = [];

  if (shape === 'cube') {
    // 6 faces of Cube
    const theta = (Math.PI / 2) * foldRatio; // fold angle (0 to 90 degrees)

    // Face 1: Base (Bottom) - stays flat
    faces.push({
      name: 'Base',
      colorBase: 'hsl(243, 75%, ', // Indigo
      vertices: [
        { x: -0.5, y: -0.5, z: -0.5 },
        { x: 0.5, y: -0.5, z: -0.5 },
        { x: 0.5, y: 0.5, z: -0.5 },
        { x: -0.5, y: 0.5, z: -0.5 }
      ]
    });

    // Face 2: Front (folds around y = -0.5)
    // Flat: extends to y = -1.5
    const getFrontPt = (x: number, flatY: number) => {
      const d = -0.5 - flatY; // distance from hinge y=-0.5
      return {
        x,
        y: -0.5 - d * Math.cos(theta),
        z: -0.5 + d * Math.sin(theta)
      };
    };
    faces.push({
      name: 'Front',
      colorBase: 'hsl(243, 75%, ',
      vertices: [
        getFrontPt(-0.5, -1.5),
        getFrontPt(0.5, -1.5),
        getFrontPt(0.5, -0.5),
        getFrontPt(-0.5, -0.5)
      ]
    });

    // Face 3: Back (folds around y = 0.5)
    // Flat: extends to y = 1.5
    const getBackPt = (x: number, flatY: number) => {
      const d = flatY - 0.5; // distance from hinge y=0.5
      return {
        x,
        y: 0.5 + d * Math.cos(theta),
        z: -0.5 + d * Math.sin(theta)
      };
    };
    faces.push({
      name: 'Back',
      colorBase: 'hsl(243, 75%, ',
      vertices: [
        getBackPt(-0.5, 0.5),
        getBackPt(0.5, 0.5),
        getBackPt(0.5, 1.5),
        getBackPt(-0.5, 1.5)
      ]
    });

    // Face 4: Left (folds around x = -0.5)
    // Flat: extends to x = -1.5
    const getLeftPt = (flatX: number, y: number) => {
      const d = -0.5 - flatX;
      return {
        x: -0.5 - d * Math.cos(theta),
        y,
        z: -0.5 + d * Math.sin(theta)
      };
    };
    faces.push({
      name: 'Left',
      colorBase: 'hsl(243, 75%, ',
      vertices: [
        getLeftPt(-1.5, -0.5),
        getLeftPt(-0.5, -0.5),
        getLeftPt(-0.5, 0.5),
        getLeftPt(-1.5, 0.5)
      ]
    });

    // Face 5: Right (folds around x = 0.5)
    // Flat: extends to x = 1.5
    const getRightPt = (flatX: number, y: number) => {
      const d = flatX - 0.5;
      return {
        x: 0.5 + d * Math.cos(theta),
        y,
        z: -0.5 + d * Math.sin(theta)
      };
    };
    faces.push({
      name: 'Right',
      colorBase: 'hsl(243, 75%, ',
      vertices: [
        getRightPt(0.5, -0.5),
        getRightPt(1.5, -0.5),
        getRightPt(1.5, 0.5),
        getRightPt(0.5, 0.5)
      ]
    });

    // Face 6: Top (connected to Back face, hinge relative to Back is at y = 1.5)
    // Flat: extends to y = 2.5
    const getTopPt = (x: number, flatY: number) => {
      const d = flatY - 1.5;
      return {
        x,
        y: 0.5 + Math.cos(theta) + d * Math.cos(2 * theta),
        z: -0.5 + Math.sin(theta) + d * Math.sin(2 * theta)
      };
    };
    faces.push({
      name: 'Top',
      colorBase: 'hsl(280, 75%, ', // Purple top face to differentiate
      vertices: [
        getTopPt(-0.5, 1.5),
        getTopPt(0.5, 1.5),
        getTopPt(0.5, 2.5),
        getTopPt(-0.5, 2.5)
      ]
    });
  } else if (shape === 'pyramid') {
    // Square Pyramid: 1 base (square), 4 side triangular faces
    // Height of triangles h = sqrt(3)/2 ≈ 0.866. Base size S = 1.0.
    // Closed angle thetaClosed = acos(-0.5 / h) ≈ 125.26 degrees
    const h = Math.sqrt(3) / 2;
    const thetaClosed = Math.acos(-0.5 / h);
    const theta = thetaClosed * foldRatio;

    // Face 1: Base (stays flat)
    faces.push({
      name: 'Base',
      colorBase: 'hsl(25, 95%, ', // Amber
      vertices: [
        { x: -0.5, y: -0.5, z: -0.3 },
        { x: 0.5, y: -0.5, z: -0.3 },
        { x: 0.5, y: 0.5, z: -0.3 },
        { x: -0.5, y: 0.5, z: -0.3 }
      ]
    });

    // Face 2: Front Triangle (hinge at y = -0.5)
    const getFrontPt = (x: number, flatY: number) => {
      const d = -0.5 - flatY;
      return {
        x,
        y: -0.5 - d * Math.cos(theta),
        z: -0.3 + d * Math.sin(theta)
      };
    };
    faces.push({
      name: 'Front Face',
      colorBase: 'hsl(35, 90%, ',
      vertices: [
        getFrontPt(-0.5, -0.5),
        getFrontPt(0.5, -0.5),
        getFrontPt(0, -0.5 - h)
      ]
    });

    // Face 3: Back Triangle (hinge at y = 0.5)
    const getBackPt = (x: number, flatY: number) => {
      const d = flatY - 0.5;
      return {
        x,
        y: 0.5 + d * Math.cos(theta),
        z: -0.3 + d * Math.sin(theta)
      };
    };
    faces.push({
      name: 'Back Face',
      colorBase: 'hsl(35, 90%, ',
      vertices: [
        getBackPt(-0.5, 0.5),
        getBackPt(0.5, 0.5),
        getBackPt(0, 0.5 + h)
      ]
    });

    // Face 4: Left Triangle (hinge at x = -0.5)
    const getLeftPt = (flatX: number, y: number) => {
      const d = -0.5 - flatX;
      return {
        x: -0.5 - d * Math.cos(theta),
        y,
        z: -0.3 + d * Math.sin(theta)
      };
    };
    faces.push({
      name: 'Left Face',
      colorBase: 'hsl(35, 90%, ',
      vertices: [
        getLeftPt(-0.5, -0.5),
        getLeftPt(-0.5, 0.5),
        getLeftPt(-0.5 - h, 0)
      ]
    });

    // Face 5: Right Triangle (hinge at x = 0.5)
    const getRightPt = (flatX: number, y: number) => {
      const d = flatX - 0.5;
      return {
        x: 0.5 + d * Math.cos(theta),
        y,
        z: -0.3 + d * Math.sin(theta)
      };
    };
    faces.push({
      name: 'Right Face',
      colorBase: 'hsl(35, 90%, ',
      vertices: [
        getRightPt(0.5, -0.5),
        getRightPt(0.5, 0.5),
        getRightPt(0.5 + h, 0)
      ]
    });
  } else if (shape === 'prism') {
    // Triangular Prism: 3 rectangular faces, 2 triangular caps
    // Base is Middle rectangle
    const thetaRect = (2 * Math.PI / 3) * foldRatio; // 120 degrees max fold
    const thetaTri = (Math.PI / 2) * foldRatio; // 90 degrees max fold
    const h = Math.sqrt(3) / 2; // height of cap triangle

    // Face 1: Base Rectangle (stays flat)
    faces.push({
      name: 'Base',
      colorBase: 'hsl(162, 75%, ', // Emerald
      vertices: [
        { x: -0.5, y: -0.5, z: -0.2 },
        { x: 0.5, y: -0.5, z: -0.2 },
        { x: 0.5, y: 0.5, z: -0.2 },
        { x: -0.5, y: 0.5, z: -0.2 }
      ]
    });

    // Face 2: Left Rectangle (hinge at x = -0.5)
    const getLeftPt = (flatX: number, y: number) => {
      const d = -0.5 - flatX;
      return {
        x: -0.5 - d * Math.cos(thetaRect),
        y,
        z: -0.2 + d * Math.sin(thetaRect)
      };
    };
    faces.push({
      name: 'Left Face',
      colorBase: 'hsl(162, 75%, ',
      vertices: [
        getLeftPt(-1.5, -0.5),
        getLeftPt(-0.5, -0.5),
        getLeftPt(-0.5, 0.5),
        getLeftPt(-1.5, 0.5)
      ]
    });

    // Face 3: Right Rectangle (hinge at x = 0.5)
    const getRightPt = (flatX: number, y: number) => {
      const d = flatX - 0.5;
      return {
        x: 0.5 + d * Math.cos(thetaRect),
        y,
        z: -0.2 + d * Math.sin(thetaRect)
      };
    };
    faces.push({
      name: 'Right Face',
      colorBase: 'hsl(162, 75%, ',
      vertices: [
        getRightPt(0.5, -0.5),
        getRightPt(1.5, -0.5),
        getRightPt(1.5, 0.5),
        getRightPt(0.5, 0.5)
      ]
    });

    // Face 4: Front Triangle Cap (hinge at y = -0.5)
    const getFrontPt = (x: number, flatY: number) => {
      const d = -0.5 - flatY;
      return {
        x,
        y: -0.5 - d * Math.cos(thetaTri),
        z: -0.2 + d * Math.sin(thetaTri)
      };
    };
    faces.push({
      name: 'Front Cap',
      colorBase: 'hsl(172, 70%, ',
      vertices: [
        getFrontPt(-0.5, -0.5),
        getFrontPt(0.5, -0.5),
        getFrontPt(0, -0.5 - h)
      ]
    });

    // Face 5: Back Triangle Cap (hinge at y = 0.5)
    const getBackPt = (x: number, flatY: number) => {
      const d = flatY - 0.5;
      return {
        x,
        y: 0.5 + d * Math.cos(thetaTri),
        z: -0.2 + d * Math.sin(thetaTri)
      };
    };
    faces.push({
      name: 'Back Cap',
      colorBase: 'hsl(172, 70%, ',
      vertices: [
        getBackPt(-0.5, 0.5),
        getBackPt(0.5, 0.5),
        getBackPt(0, 0.5 + h)
      ]
    });
  }

  return faces;
}

export default function GeometrySandbox() {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'transform' | 'symmetry' | '3d'>('transform');

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

  // 3D States
  const [selected3dShape, setSelected3dShape] = useState<'cube' | 'prism' | 'pyramid'>('cube');
  const [foldRatio, setFoldRatio] = useState<number>(0.5);
  const [pitch, setPitch] = useState<number>(-0.5); // Tilt angle X
  const [yaw, setYaw] = useState<number>(0.6);      // Tilt angle Y
  const [autoSpin, setAutoSpin] = useState<boolean>(true);
  const [isAnimatingFold, setIsAnimatingFold] = useState<boolean>(false);
  const [foldDirection, setFoldDirection] = useState<'fold' | 'unfold'>('fold');
  const [isDragging3d, setIsDragging3d] = useState<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRefTransform = useRef<HTMLCanvasElement | null>(null);
  const canvasRefSymmetry = useRef<HTMLCanvasElement | null>(null);
  const canvasRef3d = useRef<HTMLCanvasElement | null>(null);

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

  // Auto spin animation loop for 3D sandbox
  useEffect(() => {
    if (!autoSpin || isDragging3d || activeTab !== '3d') return;
    let animId: number;
    const tick = () => {
      setYaw(prev => prev + 0.006);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [autoSpin, isDragging3d, activeTab]);

  // Fold/unfold animation loop for 3D sandbox
  useEffect(() => {
    if (!isAnimatingFold || activeTab !== '3d') return;
    let animId: number;
    const tick = () => {
      setFoldRatio(prev => {
        let next = prev + (foldDirection === 'fold' ? 0.015 : -0.015);
        if (next >= 1.0) {
          next = 1.0;
          setFoldDirection('unfold');
        } else if (next <= 0.0) {
          next = 0.0;
          setFoldDirection('fold');
        }
        return Number(next.toFixed(3));
      });
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isAnimatingFold, foldDirection, activeTab]);

  // Render 3D Canvas
  useEffect(() => {
    if (activeTab !== '3d' || !canvasRef3d.current) return;
    const canvas = canvasRef3d.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 110; // Zoom scale factor

    // Get 3D faces under current fold ratio
    const faces = getGeometry3DData(selected3dShape, foldRatio);

    // Compute rotated coordinates and calculate depth Z
    const facesWithDepth = faces.map(face => {
      const rotatedVerts = face.vertices.map(v => {
        // Rotate Y (Yaw)
        const x1 = v.x * Math.cos(yaw) + v.z * Math.sin(yaw);
        const z1 = -v.x * Math.sin(yaw) + v.z * Math.cos(yaw);
        // Rotate X (Pitch)
        const y2 = v.y * Math.cos(pitch) - z1 * Math.sin(pitch);
        const z2 = v.y * Math.sin(pitch) + z1 * Math.cos(pitch);
        return { x: x1, y: y2, z: z2 };
      });

      // Painter's algorithm depth Z
      const avgZ = rotatedVerts.reduce((sum, v) => sum + v.z, 0) / rotatedVerts.length;

      return {
        face,
        rotatedVerts,
        avgZ
      };
    });

    // Depth sort: render back faces first
    facesWithDepth.sort((a, b) => a.avgZ - b.avgZ);

    // Camera light vector: pointing upper-left-front
    const lightDir = { x: 0.3, y: 0.5, z: 0.8 };
    const lightLen = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
    const lightNorm = { x: lightDir.x / lightLen, y: lightDir.y / lightLen, z: lightDir.z / lightLen };

    facesWithDepth.forEach(({ face, rotatedVerts }) => {
      if (rotatedVerts.length < 3) return;

      // Project vertices to screen coordinates
      const screenPoints = rotatedVerts.map(v => ({
        x: centerX + v.x * scale,
        y: centerY - v.y * scale
      }));

      // Calculate face normal in camera-rotated space for dynamic shading
      // Vector A = v1 - v0
      const A = {
        x: rotatedVerts[1].x - rotatedVerts[0].x,
        y: rotatedVerts[1].y - rotatedVerts[0].y,
        z: rotatedVerts[1].z - rotatedVerts[0].z
      };
      // Vector B = v2 - v0
      const B = {
        x: rotatedVerts[2].x - rotatedVerts[0].x,
        y: rotatedVerts[2].y - rotatedVerts[0].y,
        z: rotatedVerts[2].z - rotatedVerts[0].z
      };
      // Normal vector = A x B
      const N = {
        x: A.y * B.z - A.z * B.y,
        y: A.z * B.x - A.x * B.z,
        z: A.x * B.y - A.y * B.x
      };
      const NLen = Math.sqrt(N.x * N.x + N.y * N.y + N.z * N.z);
      const NNorm = NLen > 0 ? { x: N.x / NLen, y: N.y / NLen, z: N.z / NLen } : { x: 0, y: 0, z: 1 };

      // Lighting intensity factor (dot product)
      const dot = NNorm.x * lightNorm.x + NNorm.y * lightNorm.y + NNorm.z * lightNorm.z;
      const intensity = Math.max(0.25, Math.min(1.0, 0.45 + 0.55 * dot));

      // Draw face polygon
      ctx.beginPath();
      ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
      for (let i = 1; i < screenPoints.length; i++) {
        ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
      }
      ctx.closePath();

      // Semi-transparent shaded HSL
      ctx.fillStyle = face.colorBase + `${35 + Math.round(40 * intensity)}%, 0.85)`;
      ctx.fill();

      // Sharp edge drawing
      ctx.strokeStyle = face.colorBase + `${15 + Math.round(20 * intensity)}%, 0.95)`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Vertex dots
      screenPoints.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = face.colorBase + '25%, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    });
  }, [activeTab, selected3dShape, foldRatio, pitch, yaw]);

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

  // Mouse drag 3D rotation handlers
  const handleMouseDown3d = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging3d(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove3d = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging3d) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;

    setYaw(prev => prev + dx * 0.012);
    setPitch(prev => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev - dy * 0.012)));

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp3d = () => {
    setIsDragging3d(false);
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
          {language === 'vi' ? 'Biến đổi Tọa độ 2D (Unit 16)' : '2D Transformations (Unit 16)'}
        </button>
        <button
          onClick={() => setActiveTab('symmetry')}
          className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 text-center ${
            activeTab === 'symmetry'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {language === 'vi' ? 'Đối xứng Quay 2D (Unit 6)' : '2D Rotational Symmetry (Unit 6)'}
        </button>
        <button
          onClick={() => setActiveTab('3d')}
          className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 text-center ${
            activeTab === '3d'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {language === 'vi' ? 'Hình học 3D & Hình trải phẳng (Unit 14)' : '3D Shapes & Nets (Unit 14)'}
        </button>
      </div>

      {activeTab === 'transform' && (
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
      )}

      {activeTab === 'symmetry' && (
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
                  <PenTool className="h-4 w-4 text-indigo-650" />
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
                        ? 'bg-indigo-650 bg-indigo-600 text-white border-indigo-650 shadow-xs'
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

      {activeTab === '3d' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Canvas column */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="relative">
              <canvas
                ref={canvasRef3d}
                width={320}
                height={320}
                onMouseDown={handleMouseDown3d}
                onMouseMove={handleMouseMove3d}
                onMouseUp={handleMouseUp3d}
                onMouseLeave={handleMouseUp3d}
                className="border border-slate-200 rounded-xl shadow-xs cursor-grab active:cursor-grabbing bg-slate-50"
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-400 text-center italic">
              {language === 'vi'
                ? 'Hãy nhấp giữ và rê chuột trực tiếp trên khung hình để xoay tự do!'
                : 'Click and drag on the canvas to rotate the shape in 3D space!'}
            </p>
          </div>

          {/* Controls column */}
          <div className="md:col-span-6 space-y-4">
            <div className="rounded-xl border border-slate-150 p-4 space-y-4 bg-slate-50/50">
              {/* Shape Selection */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Box className="h-4 w-4 text-indigo-650" />
                  {language === 'vi' ? 'Hình khối 3D & Hình trải phẳng' : '3D Shapes & Nets'}
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelected3dShape('cube'); setFoldRatio(0.5); }}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all border ${
                      selected3dShape === 'cube'
                        ? 'bg-indigo-600 text-white border-indigo-650 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {language === 'vi' ? 'Lập phương' : 'Cube'}
                  </button>
                  <button
                    onClick={() => { setSelected3dShape('prism'); setFoldRatio(0.5); }}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all border ${
                      selected3dShape === 'prism'
                        ? 'bg-emerald-600 text-white border-emerald-650 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {language === 'vi' ? 'Lăng trụ tam giác' : 'Prism'}
                  </button>
                  <button
                    onClick={() => { setSelected3dShape('pyramid'); setFoldRatio(0.5); }}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all border ${
                      selected3dShape === 'pyramid'
                        ? 'bg-amber-600 text-white border-amber-650 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {language === 'vi' ? 'Chóp tứ giác' : 'Pyramid'}
                  </button>
                </div>
              </div>

              {/* Fold Ratio control & animation play */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">
                    {language === 'vi' ? 'Tỷ lệ gấp hình trải phẳng:' : 'Folding ratio (Net):'} {Math.round(foldRatio * 100)}%
                  </label>
                  <button
                    onClick={() => setIsAnimatingFold(!isAnimatingFold)}
                    className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {isAnimatingFold ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {isAnimatingFold 
                      ? (language === 'vi' ? 'Tạm dừng' : 'Pause') 
                      : (language === 'vi' ? 'Tự động gấp/mở' : 'Auto fold/unfold')}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-bold">2D Net</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={foldRatio}
                    onChange={(e) => {
                      setFoldRatio(Number(e.target.value));
                      setIsAnimatingFold(false); // Disable animation on drag
                    }}
                    className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                  />
                  <span className="text-[10px] text-indigo-650 font-bold">3D Solid</span>
                </div>
              </div>

              {/* View options */}
              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={autoSpin}
                    onChange={(e) => setAutoSpin(e.target.checked)}
                    className="accent-indigo-600"
                  />
                  <span className="flex items-center gap-1">
                    <Rotate3d className="h-3.5 w-3.5 text-slate-400" />
                    {language === 'vi' ? 'Tự động xoay 3D' : 'Auto-spin 3D'}
                  </span>
                </label>

                <button
                  onClick={() => {
                    setPitch(-0.5);
                    setYaw(0.6);
                  }}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-0.5"
                >
                  <RefreshCw className="h-3 w-3" />
                  {language === 'vi' ? 'Đặt lại góc nhìn' : 'Reset view'}
                </button>
              </div>
            </div>

            {/* Metric properties table & Euler validation */}
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <h5 className="font-bold text-slate-800 text-xs">
                  {language === 'vi' ? 'Đặc tính khối hình:' : 'Shape properties:'}
                </h5>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[10px] font-bold text-indigo-700">
                  Euler: F + V - E = 2
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded-lg border border-slate-150 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    {language === 'vi' ? 'Mặt (F)' : 'Faces (F)'}
                  </div>
                  <div className="text-lg font-bold text-slate-800 mt-0.5">
                    {selected3dShape === 'cube' ? 6 : selected3dShape === 'prism' ? 5 : 5}
                  </div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-150 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    {language === 'vi' ? 'Đỉnh (V)' : 'Vertices (V)'}
                  </div>
                  <div className="text-lg font-bold text-slate-800 mt-0.5">
                    {selected3dShape === 'cube' ? 8 : selected3dShape === 'prism' ? 6 : 5}
                  </div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-150 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    {language === 'vi' ? 'Cạnh (E)' : 'Edges (E)'}
                  </div>
                  <div className="text-lg font-bold text-slate-800 mt-0.5">
                    {selected3dShape === 'cube' ? 12 : selected3dShape === 'prism' ? 9 : 8}
                  </div>
                </div>
              </div>

              {/* Math validation explanation */}
              <div className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-[10px] text-indigo-900 leading-relaxed font-mono flex flex-col items-center">
                <span className="font-bold">
                  {language === 'vi' ? 'Kiểm chứng công thức Euler:' : 'Euler\'s Formula check:'}
                </span>
                <span className="text-sm font-bold text-indigo-700 mt-1">
                  {selected3dShape === 'cube' 
                    ? 'Mặt(6) + Đỉnh(8) - Cạnh(12) = 2' 
                    : selected3dShape === 'prism'
                      ? 'Mặt(5) + Đỉnh(6) - Cạnh(9) = 2'
                      : 'Mặt(5) + Đỉnh(5) - Cạnh(8) = 2'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
