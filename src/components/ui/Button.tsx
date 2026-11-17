import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'brand'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-page',
  secondary: 'border border-line bg-card text-ink',
  brand: 'bg-brand text-on-brand',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

export default function Button({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      type="button"
      className={`rounded-full px-5 py-2 text-sm font-medium transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}