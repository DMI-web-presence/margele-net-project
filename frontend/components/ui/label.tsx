import { LabelHTMLAttributes } from 'react';

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn('text-sm font-semibold text-slate-950 leading-none', className)}
      {...props}
    />
  );
}
