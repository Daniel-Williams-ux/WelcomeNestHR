import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-[#121212] dark:border-gray-800',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'p-4 border-b border-gray-100 dark:border-gray-800',
      className
    )}
    {...props}
  />
);

const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      'font-semibold text-gray-800 dark:text-gray-100 text-base',
      className
    )}
    {...props}
  />
);

const CardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-4', className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardContent };