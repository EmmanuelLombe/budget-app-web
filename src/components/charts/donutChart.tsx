import type { Cents } from '../../lib/types'
import Amount from '../ui/Amount'
import Label from '../ui/Label'

export type DonutSlice = {
  id: string
  name: string
  cents: Cents
  color: string
}

type Props = {
  slices: DonutSlice[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  totalLabel?: string
}

const SIZE = 240
const CENTER = SIZE / 2
const RADIUS = 104
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const STROKE = 18
const STROKE_SELECTED = 28
const GAP = 3

export default function DonutChart({
  slices,
  selectedId,
  onSelect,
  totalLabel = 'Total',
}: Props) {
  const total = slices.reduce((sum, s) => sum + s.cents, 0)
  const selected = slices.find((s) => s.id === selectedId) ?? null
  const percent = (cents: Cents) =>
    total === 0 ? 0 : Math.round((cents / total) * 100)

  // Only slices with money get an arc. Zero slices still appear in the legend.
  const visible = slices.filter((s) => s.cents > 0)
  const gap = visible.length > 1 ? GAP : 0

  const arcs = visible.map((slice, i) => {
    const length = (slice.cents / total) * CIRCUMFERENCE
    const start = visible
      .slice(0, i)
      .reduce((sum, s) => sum + (s.cents / total) * CIRCUMFERENCE, 0)
    return { slice, start, drawn: Math.max(length - gap, 0.5) }
  })

  return (
    <div>
      <div className="relative mx-auto size-72">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full" aria-hidden="true">
          {total === 0 && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="var(--line)"
              strokeWidth={STROKE}
            />
          )}

          {arcs.map(({ slice, start, drawn }) => {
            const isSelected = slice.id === selectedId
            return (
              <circle
                key={slice.id}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={slice.color}
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
                className="cursor-pointer transition-all duration-200 motion-reduce:transition-none"
                style={{
                  strokeWidth: isSelected ? STROKE_SELECTED : STROKE,
                  strokeDasharray: `${drawn} ${CIRCUMFERENCE - drawn}`,
                  strokeDashoffset: -start,
                  opacity: selectedId && !isSelected ? 0.25 : 1,
                }}
                onClick={() => onSelect(isSelected ? null : slice.id)}
              />
            )
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
          <Label className="w-full truncate">
            {selected ? selected.name : totalLabel}
          </Label>
          <Amount
            cents={selected ? selected.cents : total}
            size="sm"
            className="mt-1"
          />
          {selected && (
            <p className="mt-0.5 text-xs text-muted">{percent(selected.cents)}%</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {slices.map((s) => {
          const active = s.id === selectedId
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(active ? null : s.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                active
                  ? 'border-line bg-page text-ink'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              <span
                className="size-2.5 rounded-full border"
                style={{
                  borderColor: s.color,
                  backgroundColor: s.cents > 0 ? s.color : 'transparent',
                }}
              />
              {s.name}
              {s.cents === 0 && <span className="font-mono text-xs">0%</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}