/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Parses and formats mathematical text (including raw fractions, LaTeX, exponents, etc.)
 * into HTML string.
 */
export function formatMathText(text: string): string {
  if (!text) return '';
  
  // 1. Escape HTML first to prevent injection
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Helper to format math tokens
  const formatMath = (mathStr: string) => {
    let res = mathStr;
    
    // LaTeX fraction: \frac{a}{b} -> vertical fraction
    let prevRes = '';
    while (res !== prevRes) {
      prevRes = res;
      res = res.replace(/\\frac\{((?:[^{}]+|\{[^{}]*\})*)\}\{((?:[^{}]+|\{[^{}]*\})*)\}/g, (_, num, den) => {
        return `<span class="inline-flex flex-col items-center justify-center font-serif align-middle mx-1" style="font-size: 0.9em; line-height: 1.15;"><span class="border-b border-indigo-650 dark:border-indigo-400 px-1.5 text-center leading-none pb-0.5">${num}</span><span class="text-center leading-none pt-0.5">${den}</span></span>`;
      });
    }

    // LaTeX symbols
    res = res
      .replace(/\\times/g, '<span class="mx-1 font-sans font-bold text-indigo-650 dark:text-indigo-450 text-sm">×</span>')
      .replace(/\\div/g, '<span class="mx-1 font-sans font-bold text-indigo-650 dark:text-indigo-450 text-sm">÷</span>')
      .replace(/\\rightarrow/g, '<span class="mx-1.5 text-slate-500">→</span>')
      .replace(/\\quad/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
      .replace(/\\text\{([^}]+)\}/g, '<span class="font-sans font-normal text-slate-650 dark:text-slate-450">$1</span>');

    // Exponents & Degrees
    res = res
      .replace(/\^\{\\circ\}/g, '°')
      .replace(/\^\\circ/g, '°')
      .replace(/\^2/g, '<sup>2</sup>')
      .replace(/\^3/g, '<sup>3</sup>')
      .replace(/\^\{\\text\{C\}\}/g, '°C')
      .replace(/\^\\text\{C\}/g, '°C')
      .replace(/\^([a-zA-Z\d]+)/g, '<sup>$1</sup>');

    // Raw fractions: e.g. 8/12, 2/3, x/28
    res = res.replace(/\b(\d+|[xXyYnN])\/(\d+)\b/g, (_, num, den) => {
      return `<span class="inline-flex flex-col items-center justify-center font-serif align-middle mx-1" style="font-size: 0.9em; line-height: 1.15;"><span class="border-b border-indigo-650 dark:border-indigo-400 px-1.5 text-center leading-none pb-0.5">${num}</span><span class="text-center leading-none pt-0.5">${den}</span></span>`;
    });

    return res;
  };

  // 2. Parse inline math $...$ first (giving them styled background containers)
  const parts = html.split('$');
  let parsedHtml = '';
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      const formatted = formatMath(parts[i]);
      parsedHtml += `<span class="font-mono bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-150/40 font-bold text-xs inline-block mx-0.5 align-middle">${formatted}</span>`;
    } else {
      const formattedText = formatMath(parts[i]);
      parsedHtml += formattedText;
    }
  }

  // 3. Parse bold markdown **text**
  parsedHtml = parsedHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  return parsedHtml;
}

export function RenderMath({ text, className = '' }: { text: string; className?: string }) {
  const formattedHtml = formatMathText(text);
  return <span className={className} dangerouslySetInnerHTML={{ __html: formattedHtml }} />;
}
