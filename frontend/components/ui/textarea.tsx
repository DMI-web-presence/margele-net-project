import { TextareaHTMLAttributes, forwardRef } from 'react';

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100',
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
