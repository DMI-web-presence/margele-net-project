import { ComponentPropsWithoutRef } from 'react';

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type CardProps = ComponentPropsWithoutRef<'div'>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        className,
      )}
      {...props}
    />
  );
}
