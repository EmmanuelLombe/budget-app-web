type Props = {
  percent: number
  color: string
  label: string
  className?: string
}

export default function Progress({ percent, color, label, className = '' }: Props) {
  const width = Math.min(Math.max(percent, 0), 100)

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
      className={`h-2 w-full overflow-hidden rounded-full bg-line ${className}`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  )
}