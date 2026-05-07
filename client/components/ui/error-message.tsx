import { AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  message: string
  className?: string
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  return (
    <div className={cn(
      "flex items-center justify-center p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg",
      className
    )}>
      <AlertTriangle className="w-5 h-5 mr-2" />
      <span>{message}</span>
    </div>
  )
} 