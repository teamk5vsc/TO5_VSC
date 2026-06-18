/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { RefreshCw, PenTool, Move, RotateCw, Sparkles, Trash2, Box, Rotate3d, Play, Pause, Sparkle } from 'lucide-react';

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

const SHAPE_PRESETS_2D = {
  triangle: [
    { x: 1, y: 1 },
    { x: 3, y: 1 },
    { x: 2, y: 3 }
  ],
  rectangle: [
    { x: 1, y: 1 },
    { x: 4, y: 1 },
    { x: 4, y: 3 },
    { x: 1, y: 3 }
  ],
  parallelogram: [
    { x: 1, y: 1 },
    { x: 4, y: 1 },
    { x: 5, y: 3 },
    { x: 2, y: 3 }
  ],
  lshape: [
    { x: 1, y: 1 },
    { x: 3, y: 1 },
    { x: 3, y: 2 },
    { x: 2, y: 2 },
    { x: 2, y: 4 },
    { x: 1, y: 4 }
  ]
};
// Helper: rotates a point around an arbitrary axis on the z = -0.3 plane
const rotateAroundHinge = (
  pt: Point3D,
  origin: { x: number; y: number },
  axisAngleRad: number,
  theta: number
): Point3D => {
  const dx = pt.x - origin.x;
  const dy = pt.y - origin.y;
  const dz = pt.z - (-0.3);

  // Rotate around Z to align hinge with X-axis
  const cosA = Math.cos(-axisAngleRad);
  const sinA = Math.sin(-axisAngleRad);
  const rx1 = dx * cosA - dy * sinA;
  const ry1 = dx * sinA + dy * cosA;
  const rz1 = dz;

  // Rotate around X (folding up)
  const rx2 = rx1;
  const ry2 = ry1 * Math.cos(theta) - rz1 * Math.sin(theta);
  const rz2 = ry1 * Math.sin(theta) + rz1 * Math.cos(theta);

  // Rotate back around Z
  const cosB = Math.cos(axisAngleRad);
  const sinB = Math.sin(axisAngleRad);
  const fx = rx2 * cosB - ry2 * sinB + origin.x;
  const fy = rx2 * sinB + ry2 * cosB + origin.y;
  const fz = rz2 + (-0.3);

  return { x: fx, y: fy, z: fz };
};

function makeRegularPrism(
  N: number,
  W: number,
  H: number,
  colorBase: string,
  foldRatio: number
): Face3D[] {
  const faces: Face3D[] = [];
  const thetaRect = (2 * Math.PI / N) * foldRatio;
  const thetaCap = (Math.PI / 2) * foldRatio;
  const zBase = -0.25;

  const N_left = Math.floor((N - 1) / 2);
  const N_right = N - 1 - N_left;

  // 1. Rectangular Faces
  // Base rectangle (stays flat)
  faces.push({
    name: 'Base Rectangle',
    colorBase,
    vertices: [
      { x: -W/2, y: -H/2, z: zBase },
      { x: W/2, y: -H/2, z: zBase },
      { x: W/2, y: H/2, z: zBase },
      { x: -W/2, y: H/2, z: zBase }
    ]
  });

  // Helper to evaluate vertices of rectangle R_k (right)
  const getRightRectPt = (flatX: number, y: number, k: number) => {
    let x_hinge = W/2;
    let z_hinge = zBase;
    for (let i = 1; i < k; i++) {
      x_hinge += W * Math.cos(i * thetaRect);
      z_hinge += W * Math.sin(i * thetaRect);
    }
    const d = flatX - (W/2 + (k - 1) * W);
    return {
      x: x_hinge + d * Math.cos(k * thetaRect),
      y,
      z: z_hinge + d * Math.sin(k * thetaRect)
    };
  };

  for (let k = 1; k <= N_right; k++) {
    faces.push({
      name: `Right Face ${k}`,
      colorBase,
      vertices: [
        getRightRectPt(W/2 + (k-1)*W, -H/2, k),
        getRightRectPt(W/2 + k*W, -H/2, k),
        getRightRectPt(W/2 + k*W, H/2, k),
        getRightRectPt(W/2 + (k-1)*W, H/2, k)
      ]
    });
  }

  // R_k for k < 0 (left)
  const getLeftRectPt = (flatX: number, y: number, j: number) => {
    let x_hinge = -W/2;
    let z_hinge = zBase;
    for (let i = 1; i < j; i++) {
      x_hinge -= W * Math.cos(i * thetaRect);
      z_hinge += W * Math.sin(i * thetaRect);
    }
    const d = -W/2 - (j - 1) * W - flatX;
    return {
      x: x_hinge - d * Math.cos(j * thetaRect),
      y,
      z: z_hinge + d * Math.sin(j * thetaRect)
    };
  };

  for (let j = 1; j <= N_left; j++) {
    faces.push({
      name: `Left Face ${j}`,
      colorBase,
      vertices: [
        getLeftRectPt(-W/2 - j*W, -H/2, j),
        getLeftRectPt(-W/2 - (j-1)*W, -H/2, j),
        getLeftRectPt(-W/2 - (j-1)*W, H/2, j),
        getLeftRectPt(-W/2 - j*W, H/2, j)
      ]
    });
  }

  // 2. Caps (Regular N-gons)
  const R_in = W / (2 * Math.tan(Math.PI / N));
  const R_out = W / (2 * Math.sin(Math.PI / N));

  // Top Cap (hinge at y = H/2)
  const getTopCapPt = (flatPt: Point) => {
    const d_y = flatPt.y - H/2;
    return {
      x: flatPt.x,
      y: H/2 + d_y * Math.cos(thetaCap),
      z: zBase + d_y * Math.sin(thetaCap)
    };
  };

  const topCapVertsFlat: Point[] = [];
  for (let i = 0; i < N; i++) {
    topCapVertsFlat.push({
      x: R_out * Math.sin(i * (2 * Math.PI / N) - Math.PI / N),
      y: (H/2 + R_in) - R_out * Math.cos(i * (2 * Math.PI / N) - Math.PI / N)
    });
  }

  faces.push({
    name: 'Top Cap',
    colorBase,
    vertices: topCapVertsFlat.map(getTopCapPt)
  });

  // Bottom Cap (hinge at y = -H/2)
  const getBottomCapPt = (flatPt: Point) => {
    const d_y = -H/2 - flatPt.y;
    return {
      x: flatPt.x,
      y: -H/2 - d_y * Math.cos(thetaCap),
      z: zBase + d_y * Math.sin(thetaCap)
    };
  };

  const bottomCapVertsFlat: Point[] = [];
  for (let i = 0; i < N; i++) {
    bottomCapVertsFlat.push({
      x: -R_out * Math.sin(i * (2 * Math.PI / N) - Math.PI / N),
      y: (-H/2 - R_in) + R_out * Math.cos(i * (2 * Math.PI / N) - Math.PI / N)
    });
  }

  faces.push({
    name: 'Bottom Cap',
    colorBase,
    vertices: bottomCapVertsFlat.map(getBottomCapPt)
  });

  return faces;
}

function makeRegularPyramid(
  N: number,
  R_out: number,
  hFace: number,
  colorBase: string,
  foldRatio: number
): Face3D[] {
  const faces: Face3D[] = [];
  const zBase = -0.3;

  // Base vertices:
  const baseVerts: Point3D[] = [];
  for (let i = 0; i < N; i++) {
    const angle = Math.PI / 2 + i * (2 * Math.PI / N);
    baseVerts.push({
      x: R_out * Math.cos(angle),
      y: R_out * Math.sin(angle),
      z: zBase
    });
  }

  faces.push({
    name: 'Base',
    colorBase,
    vertices: [...baseVerts].reverse()
  });

  const R_in = R_out * Math.cos(Math.PI / N);
  const thetaClosed = Math.PI - Math.acos(R_in / hFace);
  const theta = thetaClosed * foldRatio;

  for (let i = 0; i < N; i++) {
    const V_curr = baseVerts[i];
    const V_next = baseVerts[(i + 1) % N];

    const M_x = (V_curr.x + V_next.x) / 2;
    const M_y = (V_curr.y + V_next.y) / 2;

    const scaleFactor = 1 + hFace / R_in;
    const flatApex = {
      x: M_x * scaleFactor,
      y: M_y * scaleFactor,
      z: zBase
    };

    const axisAngleRad = Math.atan2(V_next.y - V_curr.y, V_next.x - V_curr.x);
    const rotatedApex = rotateAroundHinge(flatApex, V_curr, axisAngleRad, theta);

    faces.push({
      name: `Side Face ${i + 1}`,
      colorBase,
      vertices: [
        V_curr,
        V_next,
        rotatedApex
      ]
    });
  }

  return faces;
}

const SHAPE_3D_METADATA: Record<string, {
  id: string;
  nameVi: string;
  nameEn: string;
  faces: number;
  vertices: number;
  edges: number;
  eulerFormulaVi: string;
  eulerFormulaEn: string;
  colorClass: string;
}> = {
  cube: {
    id: 'cube',
    nameVi: 'Lập phương',
    nameEn: 'Cube',
    faces: 6,
    vertices: 8,
    edges: 12,
    eulerFormulaVi: 'Mặt(6) + Đỉnh(8) - Cạnh(12) = 2',
    eulerFormulaEn: 'Faces(6) + Vertices(8) - Edges(12) = 2',
    colorClass: 'bg-blue-600 border-blue-700'
  },
  cuboid: {
    id: 'cuboid',
    nameVi: 'Hộp chữ nhật',
    nameEn: 'Cuboid',
    faces: 6,
    vertices: 8,
    edges: 12,
    eulerFormulaVi: 'Mặt(6) + Đỉnh(8) - Cạnh(12) = 2',
    eulerFormulaEn: 'Faces(6) + Vertices(8) - Edges(12) = 2',
    colorClass: 'bg-blue-600 border-blue-700'
  },
  prism: {
    id: 'prism',
    nameVi: 'Lăng trụ tam giác',
    nameEn: 'Triangular Prism',
    faces: 5,
    vertices: 6,
    edges: 9,
    eulerFormulaVi: 'Mặt(5) + Đỉnh(6) - Cạnh(9) = 2',
    eulerFormulaEn: 'Faces(5) + Vertices(6) - Edges(9) = 2',
    colorClass: 'bg-emerald-600 border-emerald-700'
  },
  hex_prism: {
    id: 'hex_prism',
    nameVi: 'Lăng trụ lục giác',
    nameEn: 'Hexagonal Prism',
    faces: 8,
    vertices: 12,
    edges: 18,
    eulerFormulaVi: 'Mặt(8) + Đỉnh(12) - Cạnh(18) = 2',
    eulerFormulaEn: 'Faces(8) + Vertices(12) - Edges(18) = 2',
    colorClass: 'bg-emerald-600 border-emerald-700'
  },
  cylinder: {
    id: 'cylinder',
    nameVi: 'Hình trụ (12 cạnh)',
    nameEn: 'Cylinder (12-sided)',
    faces: 14,
    vertices: 24,
    edges: 36,
    eulerFormulaVi: 'Mặt(14) + Đỉnh(24) - Cạnh(36) = 2',
    eulerFormulaEn: 'Faces(14) + Vertices(24) - Edges(36) = 2',
    colorClass: 'bg-teal-600 border-teal-700'
  },
  tri_pyramid: {
    id: 'tri_pyramid',
    nameVi: 'Chóp tam giác',
    nameEn: 'Tri-Pyramid',
    faces: 4,
    vertices: 4,
    edges: 6,
    eulerFormulaVi: 'Mặt(4) + Đỉnh(4) - Cạnh(6) = 2',
    eulerFormulaEn: 'Faces(4) + Vertices(4) - Edges(6) = 2',
    colorClass: 'bg-rose-600 border-rose-700'
  },
  pyramid: {
    id: 'pyramid',
    nameVi: 'Chóp tứ giác',
    nameEn: 'Pyramid',
    faces: 5,
    vertices: 5,
    edges: 8,
    eulerFormulaVi: 'Mặt(5) + Đỉnh(5) - Cạnh(8) = 2',
    eulerFormulaEn: 'Faces(5) + Vertices(5) - Edges(8) = 2',
    colorClass: 'bg-amber-600 border-amber-700'
  },
  pent_pyramid: {
    id: 'pent_pyramid',
    nameVi: 'Chóp ngũ giác',
    nameEn: 'Pentagonal Pyramid',
    faces: 6,
    vertices: 6,
    edges: 10,
    eulerFormulaVi: 'Mặt(6) + Đỉnh(6) - Cạnh(10) = 2',
    eulerFormulaEn: 'Faces(6) + Vertices(6) - Edges(10) = 2',
    colorClass: 'bg-amber-600 border-amber-700'
  },
  cone: {
    id: 'cone',
    nameVi: 'Hình nón (12 cạnh)',
    nameEn: 'Cone (12-sided)',
    faces: 13,
    vertices: 13,
    edges: 24,
    eulerFormulaVi: 'Mặt(13) + Đỉnh(13) - Cạnh(24) = 2',
    eulerFormulaEn: 'Faces(13) + Vertices(13) - Edges(24) = 2',
    colorClass: 'bg-orange-600 border-orange-700'
  },
  house: {
    id: 'house',
    nameVi: 'Ngôi nhà phức hợp',
    nameEn: 'Composite House',
    faces: 9,
    vertices: 10,
    edges: 17,
    eulerFormulaVi: 'Mặt(9) + Đỉnh(10) - Cạnh(17) = 2',
    eulerFormulaEn: 'Faces(9) + Vertices(10) - Edges(17) = 2',
    colorClass: 'bg-indigo-600 border-indigo-700'
  },
  tower: {
    id: 'tower',
    nameVi: 'Tháp lâu đài phức hợp',
    nameEn: 'Composite Tower',
    faces: 9,
    vertices: 9,
    edges: 16,
    eulerFormulaVi: 'Mặt(9) + Đỉnh(9) - Cạnh(16) = 2',
    eulerFormulaEn: 'Faces(9) + Vertices(9) - Edges(16) = 2',
    colorClass: 'bg-violet-600 border-violet-700'
  }
};

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
  } else if (shape === 'cuboid') {
    // Cuboid: Width = 1.2, Depth = 0.8, Height = 0.6
    const W = 1.2;
    const D = 0.8;
    const H = 0.6;
    const theta = (Math.PI / 2) * foldRatio;

    // Face 1: Base (Bottom)
    faces.push({
      name: 'Base',
      colorBase: 'hsl(200, 80%, ', // Teal-blue
      vertices: [
        { x: -W/2, y: -D/2, z: -0.5 },
        { x: W/2, y: -D/2, z: -0.5 },
        { x: W/2, y: D/2, z: -0.5 },
        { x: -W/2, y: D/2, z: -0.5 }
      ]
    });

    // Face 2: Front (hinge at y = -D/2)
    const getFrontPt = (x: number, flatY: number) => {
      const d = -D/2 - flatY;
      return {
        x,
        y: -D/2 - d * Math.cos(theta),
        z: -0.5 + d * Math.sin(theta)
      };
    };
    faces.push({
      name: 'Front',
      colorBase: 'hsl(200, 80%, ',
      vertices: [
        getFrontPt(-W/2, -D/2 - H),
        getFrontPt(W/2, -D/2 - H),
        getFrontPt(W/2, -D/2),
        getFrontPt(-W/2, -D/2)
      ]
    });

    // Face 3: Back (hinge at y = D/2)
    const getBackPt = (x: number, flatY: number) => {
      const d = flatY - D/2;
      return {
        x,
        y: D/2 + d * Math.cos(theta),
        z: -0.5 + d * Math.sin(theta)
      };
    };
    faces.push({
      name: 'Back',
      colorBase: 'hsl(200, 80%, ',
      vertices: [
        getBackPt(-W/2, D/2),
        getBackPt(W/2, D/2),
        getBackPt(W/2, D/2 + H),
        getBackPt(-W/2, D/2 + H)
      ]
    });

    // Face 4: Left (hinge at x = -W/2)
    const getLeftPt = (flatX: number, y: number) => {
      const d = -W/2 - flatX;
      return {
        x: -W/2 - d * Math.cos(theta),
        y,
        z: -0.5 + d * Math.sin(theta)
      };
    };
    faces.push({
      name: 'Left',
      colorBase: 'hsl(200, 80%, ',
      vertices: [
        getLeftPt(-W/2 - H, -D/2),
        getLeftPt(-W/2, -D/2),
        getLeftPt(-W/2, D/2),
        getLeftPt(-W/2 - H, D/2)
      ]
    });

    // Face 5: Right (hinge at x = W/2)
    const getRightPt = (flatX: number, y: number) => {
      const d = flatX - W/2;
      return {
        x: W/2 + d * Math.cos(theta),
        y,
        z: -0.5 + d * Math.sin(theta)
      };
    };
    faces.push({
      name: 'Right',
      colorBase: 'hsl(200, 80%, ',
      vertices: [
        getRightPt(W/2, -D/2),
        getRightPt(W/2 + H, -D/2),
        getRightPt(W/2 + H, D/2),
        getRightPt(W/2, D/2)
      ]
    });

    // Face 6: Top (connected to Back at y = D/2 + H)
    const getTopPt = (x: number, flatY: number) => {
      const d = flatY - (D/2 + H);
      return {
        x,
        y: D/2 + H * Math.cos(theta) + d * Math.cos(2 * theta),
        z: -0.5 + H * Math.sin(theta) + d * Math.sin(2 * theta)
      };
    };
    faces.push({
      name: 'Top',
      colorBase: 'hsl(215, 75%, ',
      vertices: [
        getTopPt(-W/2, D/2 + H),
        getTopPt(W/2, D/2 + H),
        getTopPt(W/2, D/2 + H + D),
        getTopPt(-W/2, D/2 + H + D)
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
  } else if (shape === 'tri_pyramid') {
    // Triangular Pyramid (Tetrahedron)
    // Base is an equilateral triangle centered at (0,0) in z = -0.3 plane.
    const L = 1.1; // Side length
    const hFace = L * Math.sqrt(3) / 2; // Height of face triangle
    const r = L * Math.sqrt(3) / 6; // distance from centroid to edge (0.317)
    const R = L * Math.sqrt(3) / 3; // distance from centroid to vertex (0.635)
    
    // Base vertices:
    const V0 = { x: 0, y: R, z: -0.3 };
    const V1 = { x: -L/2, y: -r, z: -0.3 };
    const V2 = { x: L/2, y: -r, z: -0.3 };

    // Closed angle for regular tetrahedron is acos(1/3) ~ 70.53 degrees.
    // Total rotation from flat is 180 - 70.53 = 109.47 degrees ~ 1.91 radians.
    const thetaClosed = Math.PI - Math.acos(1/3);
    const theta = thetaClosed * foldRatio;

    // Face 1: Base (stays flat)
    faces.push({
      name: 'Base',
      colorBase: 'hsl(340, 75%, ', // Rose
      vertices: [V1, V2, V0]
    });

    // Helper: rotate 2D point around (0,0) by angle
    const rotate2D = (x: number, y: number, angle: number) => {
      return {
        x: x * Math.cos(angle) - y * Math.sin(angle),
        y: x * Math.sin(angle) + y * Math.cos(angle)
      };
    };

    // Bottom Face (hinge bottom edge, origin V1, angle 0)
    // Flat: apex at (0, -r - hFace, -0.3)
    const bottomApexFlat = { x: 0, y: -r - hFace, z: -0.3 };
    faces.push({
      name: 'Bottom Face',
      colorBase: 'hsl(350, 70%, ',
      vertices: [
        V1,
        V2,
        rotateAroundHinge(bottomApexFlat, V1, 0, theta)
      ]
    });

    // Left Face (hinge left edge V1-V0, angle 60 degrees = PI/3, origin V1)
    // Flat left face is bottom face rotated by +120 degrees (2*PI/3)
    const leftApexFlat2D = rotate2D(bottomApexFlat.x, bottomApexFlat.y, 2 * Math.PI / 3);
    const leftApexFlat = { x: leftApexFlat2D.x, y: leftApexFlat2D.y, z: -0.3 };
    faces.push({
      name: 'Left Face',
      colorBase: 'hsl(350, 70%, ',
      vertices: [
        V1,
        V0,
        rotateAroundHinge(leftApexFlat, V1, Math.PI / 3, theta)
      ]
    });

    // Right Face (hinge right edge V0-V2, angle -60 degrees = -PI/3, origin V0)
    // Flat right face is bottom face rotated by -120 degrees (-2*PI/3)
    const rightApexFlat2D = rotate2D(bottomApexFlat.x, bottomApexFlat.y, -2 * Math.PI / 3);
    const rightApexFlat = { x: rightApexFlat2D.x, y: rightApexFlat2D.y, z: -0.3 };
    faces.push({
      name: 'Right Face',
      colorBase: 'hsl(350, 70%, ',
      vertices: [
        V0,
        V2,
        rotateAroundHinge(rightApexFlat, V0, -Math.PI / 3, theta)
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
  } else if (shape === 'hex_prism') {
    // Hexagonal Prism: 6 rectangular faces, 2 hexagonal caps
    return makeRegularPrism(6, 0.45, 1.0, 'hsl(142, 70%, ', foldRatio);
  } else if (shape === 'cylinder') {
    // Cylinder: 12 rectangular faces, 2 dodecagonal caps
    return makeRegularPrism(12, 0.22, 1.0, 'hsl(190, 75%, ', foldRatio);
  } else if (shape === 'pent_pyramid') {
    // Pentagonal Pyramid: 1 pentagonal base, 5 triangular sides
    return makeRegularPyramid(5, 0.55, 0.8, 'hsl(36, 90%, ', foldRatio);
  } else if (shape === 'cone') {
    // Cone: 1 dodecagonal base, 12 triangular sides
    return makeRegularPyramid(12, 0.55, 0.8, 'hsl(25, 95%, ', foldRatio);
  } else if (shape === 'house') {
    const W = 0.9;
    const D = 0.7;
    const H_wall = 0.5;
    const H_roof = 0.35;
    const zBase = -0.3;
    const L_slope = Math.sqrt((W/2)*(W/2) + H_roof*H_roof);
    const thetaWall = (Math.PI / 2) * foldRatio;

    // Base Face (bottom)
    faces.push({
      name: 'Base',
      colorBase: 'hsl(215, 60%, ',
      vertices: [
        { x: -W/2, y: -D/2, z: zBase },
        { x: W/2, y: -D/2, z: zBase },
        { x: W/2, y: D/2, z: zBase },
        { x: -W/2, y: D/2, z: zBase }
      ]
    });

    // Front Wall + Gable
    const getFrontPt = (x: number, dY: number) => {
      return {
        x,
        y: -D/2 - dY * Math.cos(thetaWall),
        z: zBase + dY * Math.sin(thetaWall)
      };
    };
    faces.push({
      name: 'Front Wall',
      colorBase: 'hsl(215, 60%, ',
      vertices: [
        getFrontPt(-W/2, 0),
        getFrontPt(W/2, 0),
        getFrontPt(W/2, H_wall),
        getFrontPt(-W/2, H_wall)
      ]
    });
    faces.push({
      name: 'Front Gable',
      colorBase: 'hsl(215, 60%, ',
      vertices: [
        getFrontPt(-W/2, H_wall),
        getFrontPt(W/2, H_wall),
        getFrontPt(0, H_wall + H_roof)
      ]
    });

    // Back Wall + Gable
    const getBackPt = (x: number, dY: number) => {
      return {
        x,
        y: D/2 + dY * Math.cos(thetaWall),
        z: zBase + dY * Math.sin(thetaWall)
      };
    };
    faces.push({
      name: 'Back Wall',
      colorBase: 'hsl(215, 60%, ',
      vertices: [
        getBackPt(W/2, 0),
        getBackPt(-W/2, 0),
        getBackPt(-W/2, H_wall),
        getBackPt(W/2, H_wall)
      ]
    });
    faces.push({
      name: 'Back Gable',
      colorBase: 'hsl(215, 60%, ',
      vertices: [
        getBackPt(W/2, H_wall),
        getBackPt(-W/2, H_wall),
        getBackPt(0, H_wall + H_roof)
      ]
    });

    // Left Wall
    const getLeftPt = (y: number, dX: number) => {
      return {
        x: -W/2 - dX * Math.cos(thetaWall),
        y,
        z: zBase + dX * Math.sin(thetaWall)
      };
    };
    faces.push({
      name: 'Left Wall',
      colorBase: 'hsl(215, 60%, ',
      vertices: [
        getLeftPt(D/2, 0),
        getLeftPt(-D/2, 0),
        getLeftPt(-D/2, H_wall),
        getLeftPt(D/2, H_wall)
      ]
    });

    // Right Wall
    const getRightPt = (y: number, dX: number) => {
      return {
        x: W/2 + dX * Math.cos(thetaWall),
        y,
        z: zBase + dX * Math.sin(thetaWall)
      };
    };
    faces.push({
      name: 'Right Wall',
      colorBase: 'hsl(215, 60%, ',
      vertices: [
        getRightPt(-D/2, 0),
        getRightPt(D/2, 0),
        getRightPt(D/2, H_wall),
        getRightPt(-D/2, H_wall)
      ]
    });

    // Left Roof Slope
    const getLeftRoofPt = (y: number, d: number) => {
      const alpha = Math.atan(H_roof / (W/2));
      const psi = Math.PI - (Math.PI - alpha) * foldRatio;
      const x_hinge = -W/2 - H_wall * Math.cos(thetaWall);
      const z_hinge = zBase + H_wall * Math.sin(thetaWall);
      return {
        x: x_hinge + d * Math.cos(psi),
        y,
        z: z_hinge + d * Math.sin(psi)
      };
    };
    faces.push({
      name: 'Left Roof',
      colorBase: 'hsl(12, 75%, ',
      vertices: [
        getLeftRoofPt(D/2, 0),
        getLeftRoofPt(-D/2, 0),
        getLeftRoofPt(-D/2, L_slope),
        getLeftRoofPt(D/2, L_slope)
      ]
    });

    // Right Roof Slope
    const getRightRoofPt = (y: number, d: number) => {
      const alpha = Math.atan(H_roof / (W/2));
      const psi = (Math.PI - alpha) * foldRatio;
      const x_hinge = W/2 + H_wall * Math.cos(thetaWall);
      const z_hinge = zBase + H_wall * Math.sin(thetaWall);
      return {
        x: x_hinge + d * Math.cos(psi),
        y,
        z: z_hinge + d * Math.sin(psi)
      };
    };
    faces.push({
      name: 'Right Roof',
      colorBase: 'hsl(12, 75%, ',
      vertices: [
        getRightRoofPt(-D/2, 0),
        getRightRoofPt(D/2, 0),
        getRightRoofPt(D/2, L_slope),
        getRightRoofPt(-D/2, L_slope)
      ]
    });
  } else if (shape === 'tower') {
    const W = 0.8;
    const D = 0.8;
    const H_wall = 0.8;
    const H_roof = 0.6;
    const zBase = -0.3;
    const h_face = Math.sqrt((W/2)*(W/2) + H_roof*H_roof);
    const thetaWall = (Math.PI / 2) * foldRatio;

    // Base Face
    faces.push({
      name: 'Base',
      colorBase: 'hsl(45, 10%, ',
      vertices: [
        { x: -W/2, y: -D/2, z: zBase },
        { x: W/2, y: -D/2, z: zBase },
        { x: W/2, y: D/2, z: zBase },
        { x: -W/2, y: D/2, z: zBase }
      ]
    });

    // Front Wall
    const getFrontPt = (x: number, dY: number) => {
      return {
        x,
        y: -D/2 - dY * Math.cos(thetaWall),
        z: zBase + dY * Math.sin(thetaWall)
      };
    };
    faces.push({
      name: 'Front Wall',
      colorBase: 'hsl(45, 10%, ',
      vertices: [
        getFrontPt(-W/2, 0),
        getFrontPt(W/2, 0),
        getFrontPt(W/2, H_wall),
        getFrontPt(-W/2, H_wall)
      ]
    });

    // Back Wall
    const getBackPt = (x: number, dY: number) => {
      return {
        x,
        y: D/2 + dY * Math.cos(thetaWall),
        z: zBase + dY * Math.sin(thetaWall)
      };
    };
    faces.push({
      name: 'Back Wall',
      colorBase: 'hsl(45, 10%, ',
      vertices: [
        getBackPt(W/2, 0),
        getBackPt(-W/2, 0),
        getBackPt(-W/2, H_wall),
        getBackPt(W/2, H_wall)
      ]
    });

    // Left Wall
    const getLeftPt = (y: number, dX: number) => {
      return {
        x: -W/2 - dX * Math.cos(thetaWall),
        y,
        z: zBase + dX * Math.sin(thetaWall)
      };
    };
    faces.push({
      name: 'Left Wall',
      colorBase: 'hsl(45, 10%, ',
      vertices: [
        getLeftPt(D/2, 0),
        getLeftPt(-D/2, 0),
        getLeftPt(-D/2, H_wall),
        getLeftPt(D/2, H_wall)
      ]
    });

    // Right Wall
    const getRightPt = (y: number, dX: number) => {
      return {
        x: W/2 + dX * Math.cos(thetaWall),
        y,
        z: zBase + dX * Math.sin(thetaWall)
      };
    };
    faces.push({
      name: 'Right Wall',
      colorBase: 'hsl(45, 10%, ',
      vertices: [
        getRightPt(-D/2, 0),
        getRightPt(D/2, 0),
        getRightPt(D/2, H_wall),
        getRightPt(-D/2, H_wall)
      ]
    });

    // Front Roof Apex
    const getFrontRoofApex = () => {
      const y_hinge = -D/2 - H_wall * Math.cos(thetaWall);
      const z_hinge = zBase + H_wall * Math.sin(thetaWall);
      const beta = Math.acos((W/2) / h_face);
      const psi = Math.PI - (Math.PI - beta) * foldRatio;
      return {
        x: 0,
        y: y_hinge + h_face * Math.cos(psi),
        z: z_hinge + h_face * Math.sin(psi)
      };
    };
    faces.push({
      name: 'Front Roof',
      colorBase: 'hsl(200, 80%, ',
      vertices: [
        getFrontPt(-W/2, H_wall),
        getFrontPt(W/2, H_wall),
        getFrontRoofApex()
      ]
    });

    // Back Roof Apex
    const getBackRoofApex = () => {
      const y_hinge = D/2 + H_wall * Math.cos(thetaWall);
      const z_hinge = zBase + H_wall * Math.sin(thetaWall);
      const beta = Math.acos((W/2) / h_face);
      const psi = (Math.PI - beta) * foldRatio;
      return {
        x: 0,
        y: y_hinge + h_face * Math.cos(psi),
        z: z_hinge + h_face * Math.sin(psi)
      };
    };
    faces.push({
      name: 'Back Roof',
      colorBase: 'hsl(200, 80%, ',
      vertices: [
        getBackPt(W/2, H_wall),
        getBackPt(-W/2, H_wall),
        getBackRoofApex()
      ]
    });

    // Left Roof Apex
    const getLeftRoofApex = () => {
      const x_hinge = -W/2 - H_wall * Math.cos(thetaWall);
      const z_hinge = zBase + H_wall * Math.sin(thetaWall);
      const beta = Math.acos((W/2) / h_face);
      const psi = Math.PI - (Math.PI - beta) * foldRatio;
      return {
        x: x_hinge + h_face * Math.cos(psi),
        y: 0,
        z: z_hinge + h_face * Math.sin(psi)
      };
    };
    faces.push({
      name: 'Left Roof',
      colorBase: 'hsl(200, 80%, ',
      vertices: [
        getLeftPt(D/2, H_wall),
        getLeftPt(-D/2, H_wall),
        getLeftRoofApex()
      ]
    });

    // Right Roof Apex
    const getRightRoofApex = () => {
      const x_hinge = W/2 + H_wall * Math.cos(thetaWall);
      const z_hinge = zBase + H_wall * Math.sin(thetaWall);
      const beta = Math.acos((W/2) / h_face);
      const psi = (Math.PI - beta) * foldRatio;
      return {
        x: x_hinge + h_face * Math.cos(psi),
        y: 0,
        z: z_hinge + h_face * Math.sin(psi)
      };
    };
    faces.push({
      name: 'Right Roof',
      colorBase: 'hsl(200, 80%, ',
      vertices: [
        getRightPt(-D/2, H_wall),
        getRightPt(D/2, H_wall),
        getRightRoofApex()
      ]
    });
  }

  return faces;
}

// Draw the background guidelines and optional textbook templates clearly
function drawSymmetryBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  order: number,
  challenge: string | null
) {
  // Clear to white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;

  // 1. Concentric circles (clear slate-200 lines)
  ctx.strokeStyle = '#e2e8f0'; 
  ctx.lineWidth = 1;
  for (let r = 40; r <= centerX; r += 40) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 2. Radial divisions (clear dashed slate-300 lines)
  ctx.strokeStyle = '#cbd5e1'; 
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  for (let i = 0; i < order; i++) {
    const angle = (i * 2 * Math.PI) / order;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * centerX * 1.5,
      centerY + Math.sin(angle) * centerY * 1.5
    );
    ctx.stroke();
  }
  ctx.setLineDash([]); // Reset dash for drawing shapes

  // 3. Draw textbook problem templates (bold dashed slate-450)
  if (challenge) {
    ctx.strokeStyle = '#64748b'; // bold slate-500
    ctx.lineWidth = 2.5;
    ctx.setLineDash([3, 4]);

    if (challenge === 'windmill') {
      // Windmill blade outline (order 4)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.quadraticCurveTo(centerX + 60, centerY - 60, centerX + 10, centerY - 80);
      ctx.quadraticCurveTo(centerX - 15, centerY - 35, centerX, centerY);
      ctx.stroke();
    } else if (challenge === 'starfish') {
      // Starfish arm outline (order 5)
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY - 15);
      ctx.lineTo(centerX, centerY - 85);
      ctx.lineTo(centerX + 10, centerY - 15);
      ctx.stroke();
    } else if (challenge === 'snowflake') {
      // Snowflake branch outline (order 6)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX, centerY - 95);
      
      // Side sub-branches
      ctx.moveTo(centerX, centerY - 35);
      ctx.lineTo(centerX - 15, centerY - 50);
      ctx.moveTo(centerX, centerY - 35);
      ctx.lineTo(centerX + 15, centerY - 50);
      
      ctx.moveTo(centerX, centerY - 65);
      ctx.lineTo(centerX - 10, centerY - 75);
      ctx.moveTo(centerX, centerY - 65);
      ctx.lineTo(centerX + 10, centerY - 75);
      ctx.stroke();
    } else if (challenge === 'roadsign') {
      // Road sign curved arrow (order 2)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.bezierCurveTo(centerX - 45, centerY - 15, centerX - 45, centerY - 75, centerX, centerY - 75);
      // Arrow point
      ctx.moveTo(centerX - 8, centerY - 67);
      ctx.lineTo(centerX, centerY - 75);
      ctx.lineTo(centerX - 8, centerY - 83);
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset
  }

  // 4. Center hub dot
  ctx.beginPath();
  ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#475569'; // slate-600
  ctx.fill();
}

export default function GeometrySandbox() {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'transform' | 'symmetry' | '3d'>('transform');

  // Transform States
  const [selected2dShape, setSelected2dShape] = useState<'triangle' | 'rectangle' | 'parallelogram' | 'lshape'>('triangle');
  const [vertices, setVertices] = useState<Point[]>(SHAPE_PRESETS_2D.triangle);
  const [transformed, setTransformed] = useState<Point[] | null>(null);
  const [transformType, setTransformType] = useState<string>('');
  
  // Sliders for Translation
  const [dx, setDx] = useState<number>(1);
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
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null); // null = Free Draw

  // 3D States
  const [selected3dShape, setSelected3dShape] = useState<string>('cube');
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

  // Sync 2D shape preset updates
  useEffect(() => {
    setVertices(SHAPE_PRESETS_2D[selected2dShape]);
    setTransformed(null);
    setTransformType('');
  }, [selected2dShape]);

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

    drawSymmetryBackground(ctx, canvas.width, canvas.height, symmetryOrder, activeChallenge);
  }, [symmetryOrder, activeChallenge, activeTab]);

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

    drawSymmetryBackground(ctx, canvas.width, canvas.height, symmetryOrder, activeChallenge);
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

  // Handle Challenge selection
  const handleSelectChallenge = (challenge: string | null) => {
    setActiveChallenge(challenge);
    if (challenge === 'windmill') {
      setSymmetryOrder(4);
    } else if (challenge === 'starfish') {
      setSymmetryOrder(5);
    } else if (challenge === 'snowflake') {
      setSymmetryOrder(6);
    } else if (challenge === 'roadsign') {
      setSymmetryOrder(2);
    }
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
                {language === 'vi' ? 'Hình gốc' : 'Original'}
              </span>
              {transformed && (
                <span className="flex items-center gap-1 text-blue-600">
                  <span className="h-2 w-4 inline-block bg-blue-500/20 border border-blue-500" />
                  {language === 'vi' ? "Hình ảnh biến đổi" : "Transformed"}
                </span>
              )}
            </div>
          </div>

          {/* Operation Controls Column */}
          <div className="md:col-span-6 space-y-4">
            
            {/* Shape Selector 2D */}
            <div className="rounded-xl border border-slate-150 p-4 space-y-3 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Box className="h-4 w-4 text-blue-600" />
                {language === 'vi' ? 'Chọn Hình 2D Cần Biến Hình' : 'Select 2D Shape to Transform'}
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelected2dShape('triangle')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all border ${
                    selected2dShape === 'triangle'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {language === 'vi' ? '▲ Tam giác' : 'Triangle'}
                </button>
                <button
                  onClick={() => setSelected2dShape('rectangle')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all border ${
                    selected2dShape === 'rectangle'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {language === 'vi' ? '█ Hình chữ nhật' : 'Rectangle'}
                </button>
                <button
                  onClick={() => setSelected2dShape('parallelogram')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all border ${
                    selected2dShape === 'parallelogram'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {language === 'vi' ? '▰ Hình bình hành' : 'Parallelogram'}
                </button>
                <button
                  onClick={() => setSelected2dShape('lshape')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all border ${
                    selected2dShape === 'lshape'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {language === 'vi' ? '┖ Hình chữ L' : 'L-Shape'}
                </button>
              </div>
            </div>

            {/* Translation block */}
            <div className="rounded-xl border border-slate-150 p-4 space-y-3 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Move className="h-4 w-4 text-blue-600" />
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
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              <button
                onClick={handleTranslate}
                className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                {language === 'vi' ? 'Thực hiện Tịnh tiến' : 'Apply Translation'}
              </button>
            </div>

            {/* Reflection block */}
            <div className="rounded-xl border border-slate-150 p-4 space-y-3 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-blue-600" />
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
                    className="accent-blue-600"
                  />
                  <span>{language === 'vi' ? 'Trục hoành X' : 'Horizontal X-axis'}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={reflectAxis === 'y'}
                    onChange={() => setReflectAxis('y')}
                    className="accent-blue-600"
                  />
                  <span>{language === 'vi' ? 'Trục tung Y' : 'Vertical Y-axis'}</span>
                </label>
              </div>

              <button
                onClick={handleReflect}
                className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                {language === 'vi' ? 'Thực hiện Đối xứng' : 'Apply Reflection'}
              </button>
            </div>

            {/* Rotation block */}
            <div className="rounded-xl border border-slate-150 p-4 space-y-3 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <RotateCw className="h-4 w-4 text-blue-600" />
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
                      className="accent-blue-600"
                    />
                    <span>{angle}°</span>
                  </label>
                ))}
              </div>

              <button
                onClick={handleRotate}
                className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                {language === 'vi' ? 'Thực hiện Phép quay' : 'Apply Rotation'}
              </button>
            </div>

            {transformed && (
              <div className="p-3 bg-blue-50 border border-blue-150 rounded-xl space-y-2 text-[10.5px]">
                <div className="flex justify-between items-center font-bold text-blue-900">
                  <span>{language === 'vi' ? 'Công thức Tọa độ biến đổi:' : 'Transformation Formula:'}</span>
                  <button onClick={handleReset} className="text-[9px] hover:underline flex items-center gap-0.5 text-slate-500 cursor-pointer">
                    <RefreshCw className="h-2.5 w-2.5" />
                    Reset
                  </button>
                </div>
                <div className="font-mono text-slate-700 space-y-1">
                  {transformType === 'translation' && (
                    <div className="space-y-1">
                      <p className="font-bold text-blue-900 mb-1">
                        {language === 'vi' ? 'Tịnh tiến: (x, y) → (x + dx, y + dy)' : 'Translation: (x, y) → (x + dx, y + dy)'}
                      </p>
                      {vertices.map((v, idx) => {
                        const label = String.fromCharCode(65 + idx);
                        return (
                          <p key={idx}>
                            {label}({v.x},{v.y}) → {label}'({v.x}+{dx}, {v.y}{dy >= 0 ? `+${dy}` : dy}) = {label}'({transformed?.[idx].x}, {transformed?.[idx].y})
                          </p>
                        );
                      })}
                    </div>
                  )}
                  {transformType === 'reflection' && (
                    <div className="space-y-1">
                      <p className="font-bold text-blue-900 mb-1">
                        {language === 'vi' 
                          ? `Đối xứng qua trục ${reflectAxis === 'x' ? 'hoành X' : 'tung Y'}: (x, y) → ${reflectAxis === 'x' ? '(x, -y)' : '(-x, y)'}` 
                          : `Reflection across ${reflectAxis === 'x' ? 'X-axis' : 'Y-axis'}: (x, y) → ${reflectAxis === 'x' ? '(x, -y)' : '(-x, y)'}`}
                      </p>
                      {vertices.map((v, idx) => {
                        const label = String.fromCharCode(65 + idx);
                        return (
                          <p key={idx}>
                            {label}({v.x},{v.y}) → {label}'({transformed?.[idx].x}, {transformed?.[idx].y})
                          </p>
                        );
                      })}
                    </div>
                  )}
                  {transformType === 'rotation' && (
                    <div className="space-y-1">
                      <p className="font-bold text-blue-900 mb-1">
                        {language === 'vi' 
                          ? `Quay ${rotateAngle}° CCW quanh gốc O(0,0)` 
                          : `Rotate ${rotateAngle}° CCW around origin O(0,0)`}
                      </p>
                      {vertices.map((v, idx) => {
                        const label = String.fromCharCode(65 + idx);
                        return (
                          <p key={idx}>
                            {label}({v.x},{v.y}) → {label}'({transformed?.[idx].x}, {transformed?.[idx].y})
                          </p>
                        );
                      })}
                    </div>
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
                ? 'Hãy rê chuột vẽ đè lên hình mẫu nét đứt để hoàn thành thử thách!'
                : 'Click and drag to trace the dashed template shape and see it rotate!'}
            </p>
          </div>

          {/* Control parameters */}
          <div className="md:col-span-6 space-y-4">
            
            {/* Textbook Challenges Section */}
            <div className="rounded-xl border border-slate-150 p-4 space-y-3 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkle className="h-4 w-4 text-blue-600 animate-spin" style={{ animationDuration: '3s' }} />
                {language === 'vi' ? 'Thử thách Đối xứng quay (Sách giáo khoa)' : 'Rotational Symmetry Challenges'}
              </h4>
              <p className="text-[10px] text-slate-500">
                {language === 'vi' ? 'Chọn hình mẫu từ SGK để HS thực hành hoàn thiện đối xứng:' : 'Select a textbook pattern template for students to complete:'}
              </p>

              {/* Challenge Grid Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSelectChallenge(null)}
                  className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all border text-left flex items-center justify-between cursor-pointer ${
                    activeChallenge === null
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{language === 'vi' ? '🎨 Vẽ tự do' : 'Free Draw'}</span>
                </button>
                <button
                  onClick={() => handleSelectChallenge('windmill')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all border text-left flex items-center justify-between cursor-pointer ${
                    activeChallenge === 'windmill'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{language === 'vi' ? '🎐 Chong chóng (N=4)' : 'Windmill (N=4)'}</span>
                </button>
                <button
                  onClick={() => handleSelectChallenge('starfish')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all border text-left flex items-center justify-between cursor-pointer ${
                    activeChallenge === 'starfish'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{language === 'vi' ? '⭐ Sao biển (N=5)' : 'Starfish (N=5)'}</span>
                </button>
                <button
                  onClick={() => handleSelectChallenge('snowflake')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all border text-left flex items-center justify-between cursor-pointer ${
                    activeChallenge === 'snowflake'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{language === 'vi' ? '❄️ Hoa tuyết (N=6)' : 'Snowflake (N=6)'}</span>
                </button>
              </div>

              {/* Roadsign button spanning full width */}
              <button
                onClick={() => handleSelectChallenge('roadsign')}
                className={`w-full py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all border text-left flex items-center justify-between cursor-pointer ${
                  activeChallenge === 'roadsign'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{language === 'vi' ? '🚏 Biển báo giao thông (N=2)' : 'Road Sign (N=2)'}</span>
              </button>
            </div>

            {/* Symmetry Order Selector */}
            <div className="rounded-xl border border-slate-150 p-4 space-y-3 bg-slate-50/50">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <PenTool className="h-4 w-4 text-blue-600" />
                  {language === 'vi' ? 'Tùy chỉnh Bậc Đối Xứng' : 'Custom Symmetry Order'}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {language === 'vi' ? 'Tự do tùy chỉnh số cánh xoay trục đối xứng:' : 'Manually customize the rotational symmetry count:'}
                </p>
              </div>

              {/* Order selector buttons */}
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 5, 6, 8].map(order => (
                  <button
                    key={order}
                    disabled={activeChallenge !== null}
                    onClick={() => setSymmetryOrder(order)}
                    className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs transition-all border ${
                      symmetryOrder === order
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                    } ${activeChallenge !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    N = {order}
                  </button>
                ))}
              </div>

              {/* Brush Color Picker */}
              <div className="space-y-2 pt-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">{language === 'vi' ? 'Màu vẽ nét' : 'Brush Color'}</label>
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
                className="w-full py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {language === 'vi' ? 'Xóa bảng vẽ' : 'Clear Canvas'}
              </button>
            </div>

            {/* Help / Real-world Application block */}
            <div className="p-4 bg-blue-50 border border-blue-150 rounded-xl text-[10.5px] leading-relaxed space-y-1">
              <p className="font-bold text-blue-950">{language === 'vi' ? 'Nguyên lý hoạt động:' : 'Symmetry Explanation:'}</p>
              <p className="text-slate-700">
                {activeChallenge === 'windmill' && (
                  language === 'vi'
                    ? "Chong chóng có đối xứng quay bậc 4. Mỗi lần xoay 360° / 4 = 90°, hình chong chóng lại trùng khớp lên chính nó."
                    : "Windmill has rotational symmetry of order 4. Every rotation of 360° / 4 = 90° aligns the shape with itself."
                )}
                {activeChallenge === 'starfish' && (
                  language === 'vi'
                    ? "Sao biển có đối xứng quay bậc 5. Mỗi lần xoay 360° / 5 = 72°, hình sao biển lại trùng khớp lên chính nó."
                    : "Starfish has rotational symmetry of order 5. Every rotation of 360° / 5 = 72° aligns the shape with itself."
                )}
                {activeChallenge === 'snowflake' && (
                  language === 'vi'
                    ? "Hoa tuyết có đối xứng quay bậc 6. Mỗi lần xoay 360° / 6 = 60°, bông hoa tuyết lại trùng khớp lên chính nó."
                    : "Snowflake has rotational symmetry of order 6. Every rotation of 360° / 6 = 60° aligns the shape with itself."
                )}
                {activeChallenge === 'roadsign' && (
                  language === 'vi'
                    ? "Biển báo có đối xứng quay bậc 2. Mỗi lần xoay 360° / 2 = 180° (nửa vòng), biển báo lại trùng khớp lên chính nó."
                    : "Road sign has rotational symmetry of order 2. Every rotation of 360° / 2 = 180° aligns the shape with itself."
                )}
                {activeChallenge === null && (
                  language === 'vi'
                    ? `Mỗi khi bạn xoay hình một góc 360° / ${symmetryOrder} = ${360 / symmetryOrder}°, nét vẽ sẽ hoàn toàn trùng khít lên nét vẽ khác.`
                    : `Each time you rotate the canvas by 360° / ${symmetryOrder} = ${360 / symmetryOrder}°, the pattern will fit perfectly onto itself.`
                )}
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
                  <Box className="h-4 w-4 text-blue-600" />
                  {language === 'vi' ? 'Hình khối 3D & Hình trải phẳng' : '3D Shapes & Nets'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.values(SHAPE_3D_METADATA).map((meta) => (
                    <button
                      key={meta.id}
                      onClick={() => { setSelected3dShape(meta.id); setFoldRatio(0.5); }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all border cursor-pointer ${
                        selected3dShape === meta.id
                          ? `${meta.colorClass} text-white shadow-xs`
                          : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {language === 'vi' ? meta.nameVi : meta.nameEn}
                    </button>
                  ))}
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
                    className="text-[10px] font-bold text-blue-650 flex items-center gap-1 hover:underline cursor-pointer"
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
                    className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-650"
                  />
                  <span className="text-[10px] text-blue-600 font-bold">3D Solid</span>
                </div>
              </div>

              {/* View options */}
              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={autoSpin}
                    onChange={(e) => setAutoSpin(e.target.checked)}
                    className="accent-blue-600"
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
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  {language === 'vi' ? 'Đặt lại góc nhìn' : 'Reset view'}
                </button>
              </div>
            </div>

            {/* Metric properties table & Euler validation */}
            {(() => {
              const currentMeta = SHAPE_3D_METADATA[selected3dShape] || SHAPE_3D_METADATA.cube;
              return (
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-slate-800 text-xs">
                      {language === 'vi' ? 'Đặc tính khối hình:' : 'Shape properties:'}
                    </h5>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[10px] font-bold text-blue-700">
                      Euler: F + V - E = 2
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded-lg border border-slate-150 shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        {language === 'vi' ? 'Mặt (F)' : 'Faces (F)'}
                      </div>
                      <div className="text-lg font-bold text-slate-800 mt-0.5">
                        {currentMeta.faces}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-150 shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        {language === 'vi' ? 'Đỉnh (V)' : 'Vertices (V)'}
                      </div>
                      <div className="text-lg font-bold text-slate-800 mt-0.5">
                        {currentMeta.vertices}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-150 shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        {language === 'vi' ? 'Cạnh (E)' : 'Edges (E)'}
                      </div>
                      <div className="text-lg font-bold text-slate-800 mt-0.5">
                        {currentMeta.edges}
                      </div>
                    </div>
                  </div>

                  {/* Math validation explanation */}
                  <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-lg text-[10px] text-blue-900 leading-relaxed font-mono flex flex-col items-center">
                    <span className="font-bold">
                      {language === 'vi' ? 'Kiểm chứng công thức Euler:' : 'Euler\'s Formula check:'}
                    </span>
                    <span className="text-sm font-bold text-blue-700 mt-1">
                      {language === 'vi' ? currentMeta.eulerFormulaVi : currentMeta.eulerFormulaEn}
                    </span>
                  </div>

                  {(selected3dShape === 'cylinder' || selected3dShape === 'cone') && (
                    <div className="p-2 bg-amber-50/50 border border-amber-100 rounded-lg text-[9px] text-amber-950 leading-relaxed italic text-center">
                      {language === 'vi'
                        ? '* Lưu ý: Thực tế hình trụ/nón có các mặt cong và không có các đỉnh/cạnh thẳng. Ở đây ta dùng mô hình đa diện xấp xỉ 12 cạnh để minh họa hình trải phẳng.'
                        : '* Note: Real cylinders/cones have curved surfaces and no straight edges/vertices. We use a 12-sided polyhedral approximation here to visualize the net folding.'}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
