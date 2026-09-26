import React, { useState, useEffect, useRef } from 'react';

interface GradeNumberInputProps {
  value: number | null | undefined;
  onChange: (valStr: string) => void;
  disabled?: boolean;
  placeholder?: string;
  theme?: 'primary' | 'indigo' | 'secondary';
  min?: number;
  max?: number;
  allowDecimals?: boolean;
  title?: string;
  className?: string;
}

export const GradeNumberInput: React.FC<GradeNumberInputProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = '—',
  theme = 'primary',
  min = 0,
  max = 100,
  allowDecimals = true,
  title = 'Masukkan nilai (0 - 100)',
  className = '',
}) => {
  // Local display string to ensure fluid typing without cursor jump
  const [localVal, setLocalVal] = useState<string>(() => {
    return value !== null && value !== undefined ? String(value) : '';
  });
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value when NOT focused
  useEffect(() => {
    if (!isFocused) {
      const nextStr = value !== null && value !== undefined ? String(value) : '';
      setLocalVal(nextStr);
    }
  }, [value, isFocused]);

  // Clean and clamp input string
  const sanitizeAndClamp = (raw: string): { display: string; numericStr: string } => {
    if (raw === '') return { display: '', numericStr: '' };

    // Standardize comma to dot
    let cleaned = raw.replace(',', '.');

    if (allowDecimals) {
      // Allow only digits and at most one decimal point
      cleaned = cleaned.replace(/[^0-9.]/g, '');
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
      }
    } else {
      // Digits only
      cleaned = cleaned.replace(/[^0-9]/g, '');
    }

    if (cleaned === '' || cleaned === '.') {
      return { display: cleaned, numericStr: '' };
    }

    // Check numerical range
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      if (num > max) {
        return { display: String(max), numericStr: String(max) };
      }
      if (num < min) {
        return { display: String(min), numericStr: String(min) };
      }
    }

    return { display: cleaned, numericStr: cleaned };
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. Allow control & navigation keys
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Home' ||
      e.key === 'End'
    ) {
      if (e.key === 'Enter') {
        inputRef.current?.blur();
      }
      return;
    }

    // 2. Allow shortcuts (Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Meta+A, etc.)
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    // 3. Arrow Up / Arrow Down to increment / decrement
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseFloat(localVal) || 0;
      const step = e.shiftKey ? 5 : 1;
      let next = e.key === 'ArrowUp' ? current + step : current - step;
      next = Math.min(max, Math.max(min, Math.round(next * 10) / 10));
      const nextStr = String(next);
      setLocalVal(nextStr);
      onChange(nextStr);
      return;
    }

    // 4. Handle decimal point / comma
    if (allowDecimals && (e.key === '.' || e.key === ',')) {
      if (localVal.includes('.')) {
        // Prevent multiple decimal points
        e.preventDefault();
      }
      return;
    }

    // 5. Allow only numeric digits 0-9
    if (/^[0-9]$/.test(e.key)) {
      // Check if typing this digit would exceed max (e.g. typing 101 or 999)
      const input = e.currentTarget;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const projected = localVal.slice(0, start) + e.key + localVal.slice(end);
      const projectedNum = parseFloat(projected);

      if (!isNaN(projectedNum) && projectedNum > max) {
        e.preventDefault();
        setLocalVal(String(max));
        onChange(String(max));
      }
      return;
    }

    // 6. Block any letters, symbols (+, -, *, /), scientific 'e', or spaces!
    e.preventDefault();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const { display, numericStr } = sanitizeAndClamp(raw);
    setLocalVal(display);
    onChange(numericStr);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const { display, numericStr } = sanitizeAndClamp(pastedText);
    setLocalVal(display);
    onChange(numericStr);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Remove any trailing dot on blur (e.g. "85." -> "85")
    let cleaned = localVal.replace(/\.+$/, '');
    if (cleaned !== localVal) {
      setLocalVal(cleaned);
      onChange(cleaned);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Auto-select text for fast continuous typing
    e.target.select();
  };

  // Theme styling definitions
  const themeStyles = {
    primary:
      'bg-surface-container-lowest text-on-surface border-surface-container-high focus:border-primary focus:ring-2 focus:ring-primary/40',
    indigo:
      'bg-surface-container-lowest text-indigo-950 border-indigo-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/40',
    secondary:
      'bg-surface-container-lowest text-on-surface border-surface-container-high focus:border-secondary focus:ring-2 focus:ring-secondary/40',
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      pattern="[0-9]*"
      autoComplete="off"
      spellCheck="false"
      disabled={disabled}
      title={title}
      placeholder={placeholder}
      value={localVal}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      onPaste={handlePaste}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`w-14 text-center py-1.5 px-1 rounded-lg font-mono tabular-nums font-bold text-xs shadow-xs border transition-all outline-none disabled:opacity-60 disabled:bg-surface-container disabled:cursor-not-allowed ${themeStyles[theme]} ${className}`}
    />
  );
};
