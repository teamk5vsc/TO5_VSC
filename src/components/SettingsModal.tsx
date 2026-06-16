/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Settings, X, Key, Cpu, AlertCircle, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSave: (key: string, model: string) => void;
  selectedModel: string;
  isMandatory?: boolean;
}

export default function SettingsModal({
  isOpen,
  onClose,
  apiKey: initialApiKey,
  onSave,
  selectedModel: initialModel,
  isMandatory = false
}: SettingsModalProps) {
  const { language } = useLanguage();
  const [keyInput, setKeyInput] = useState<string>(initialApiKey);
  const [modelSelect, setModelSelect] = useState<string>(initialModel || 'gemini-3-flash-preview');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setErrorMsg(
        language === 'vi' 
          ? 'Vui lòng nhập API Key để sử dụng các tính năng AI Socratic.' 
          : 'Please enter a valid API Key to enable Socratic AI features.'
      );
      return;
    }
    
    setErrorMsg('');
    onSave(keyInput.trim(), modelSelect);
    onClose();
  };

  const modelDescriptions = language === 'vi' ? {
    'gemini-3-flash-preview': 'Mặc định - Phản hồi nhanh chóng và tối ưu cho Grade 6.',
    'gemini-3-pro-preview': 'Lập luận cao - Chuyên sâu giải quyết các bài toán chứng minh phức tạp.',
    'gemini-2.5-flash': 'Cơ bản - Model Flash ổn định tốc độ cao.'
  } : {
    'gemini-3-flash-preview': 'Default - Fast response, optimized for Grade 6 math tutoring.',
    'gemini-3-pro-preview': 'High Reasoning - Deep mathematical analysis for complex proofs.',
    'gemini-2.5-flash': 'Legacy - Highly stable and cost-effective Flash engine.'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div 
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-600 animate-spin" />
            <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base">
              {language === 'vi' ? 'Thiết lập AI Math Coach' : 'Configure AI Math Coach'}
            </h3>
          </div>
          {!isMandatory && (
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-650 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {isMandatory && (
          <div className="rounded-lg bg-amber-50 border border-amber-150 p-3 text-[11px] text-amber-800 flex gap-2 items-start font-medium">
            <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {language === 'vi' ? 'Yêu cầu API Key' : 'API Key Required'}
              </p>
              <p className="mt-0.5">
                {language === 'vi' 
                  ? 'Để kích hoạt trợ lý AI Socratic và bắt đầu ôn tập, em cần thiết lập API Key ban đầu.'
                  : 'To unlock Socratic AI agents and start practicing, you must configure a Gemini API key first.'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Model Cards selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {language === 'vi' ? '1. Chọn Model AI' : '1. Select AI Model'}
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {(['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash'] as const).map(model => {
                const isSelected = modelSelect === model;
                return (
                  <button
                    key={model}
                    type="button"
                    onClick={() => setModelSelect(model)}
                    className={`text-left rounded-xl border p-3.5 transition-all flex items-start gap-3 w-full ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/30' 
                        : 'border-slate-200 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-indigo-600' : 'border-slate-300'
                    }`}>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-1.5 font-mono text-[10.5px]">
                        <Cpu className="h-3.5 w-3.5 text-indigo-500" />
                        {model}
                        {model === 'gemini-3-flash-preview' && (
                          <span className="rounded bg-indigo-100 text-indigo-700 text-[8px] font-bold px-1.5 uppercase font-sans">Default</span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">{modelDescriptions[model]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API key section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Key className="h-3 w-3 text-slate-400" />
                {language === 'vi' ? '2. Nhập Gemini API Key' : '2. Enter Gemini API Key'}
              </label>
              <a 
                href="https://aistudio.google.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
              >
                {language === 'vi' ? 'Lấy API key tại đây' : 'Get API Key'}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-mono focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
            
            {errorMsg && (
              <p className="text-[10px] text-red-600 font-semibold">{errorMsg}</p>
            )}

            <p className="text-[9.5px] text-slate-400 leading-relaxed italic">
              {language === 'vi'
                ? 'ℹ API Key sẽ được lưu an toàn trong localStorage của trình duyệt, không truyền lên server ngoài luồng xử lý AI.'
                : 'ℹ The API key is stored securely in localStorage and is only sent to initialize Gemini queries.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-center active:scale-98 transition-all"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-center active:scale-98 transition-all shadow-md shadow-indigo-100"
            >
              {language === 'vi' ? 'Lưu Thiết lập' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
