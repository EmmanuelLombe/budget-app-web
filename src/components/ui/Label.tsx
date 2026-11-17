import type { ReactNode } from 'react'

type Props = { children: ReactNode; className?: string }

export default function Label({ children, className = '' }: Props) {
  return (
    <p className={`font-mono text-xs uppercase tracking-widest text-muted ${className}`}>
      {children}
    </p>
  )
}