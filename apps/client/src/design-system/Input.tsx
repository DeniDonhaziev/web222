import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
}

const fieldBase =
  'w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldWrapperProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    return (
      <label className="block">
        {label && <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>}
        <input ref={ref} id={id} className={`${fieldBase} ${error ? 'border-red-400' : ''} ${className}`} {...props} />
        {hint && !error && <span className="mt-1 block text-xs text-ink-300">{hint}</span>}
        {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
      </label>
    );
  },
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldWrapperProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <label className="block">
        {label && <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>}
        <textarea ref={ref} className={`${fieldBase} min-h-[90px] resize-none ${className}`} {...props} />
        {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
      </label>
    );
  },
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldWrapperProps>(
  ({ label, error, className = '', children, ...props }, ref) => {
    return (
      <label className="block">
        {label && <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>}
        <select ref={ref} className={`${fieldBase} ${className}`} {...props}>
          {children}
        </select>
        {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
      </label>
    );
  },
);
Select.displayName = 'Select';
