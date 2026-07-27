import { ComponentPropsWithoutRef } from 'react';

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type SkeletonProps = ComponentPropsWithoutRef<'div'>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/80', className)}
      {...props}
    />
  );
}
