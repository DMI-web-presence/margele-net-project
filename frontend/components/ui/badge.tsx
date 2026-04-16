import { ComponentPropsWithoutRef } from 'react';

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type BadgeProps = ComponentPropsWithoutRef<'span'>;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'rounded-full bg-slate-100 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-700',
        className,
      )}
      {...props}
    />
  );
}
