import type { ReactNode } from 'react'

type Props = { children: ReactNode; className?: string }

export default function Card({ children, className = '' }: Props) {
  return (
    <div className={`rounded-2xl border border-line bg-card p-6 ${className}`}>
      {children}
    </div>
  )
}