// import type { ReactNode } from 'react'

// const sizes = { md: 'text-xl', lg: 'text-4xl', xl: 'text-5xl' }

// type Props = {
//   children: ReactNode
//   size?: keyof typeof sizes
//   className?: string
// }

// export default function Amount({ children, size = 'md', className = '' }: Props) {
//   return (
//     <p className={`font-mono tabular-nums ${sizes[size]} ${className}`}>{children}</p>
//   )
// }

import { formatZAR } from '../../lib/money'
import type { Cents } from '../../lib/types'

const sizes = { md: 'text-xl', lg: 'text-4xl', xl: 'text-5xl' }

type Props = {
  cents: Cents
  size?: keyof typeof sizes
  className?: string
}

export default function Amount({ cents, size = 'md', className = '' }: Props) {
  return (
    <p className={`font-mono tabular-nums ${sizes[size]} ${className}`}>
      {formatZAR(cents)}
    </p>
  )
}