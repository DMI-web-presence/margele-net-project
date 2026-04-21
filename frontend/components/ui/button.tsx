import { ButtonHTMLAttributes, forwardRef } from 'react';

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const baseStyles =
      'inline-flex cursor-pointer items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2';
    const variantStyles =
      variant === 'secondary'
        ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
        : 'bg-indigo-600 text-white hover:bg-indigo-700';

    return <button ref={ref} className={cn(baseStyles, variantStyles, className)} {...props} />;
  },
);

Button.displayName = 'Button';
