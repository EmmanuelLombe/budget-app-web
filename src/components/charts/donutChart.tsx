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
const GAP = 8

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
      return { slice, start, length, drawn: Math.max(length - gap, 0.5) }
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

          {arcs.map(({ slice, start, length }) => {
            const isSelected = slice.id === selectedId
            const width = isSelected ? STROKE_SELECTED : STROKE

  // Round caps stick out by half the stroke width at each end, so the dash
  // is shortened by a full stroke width plus the gap, then nudged inwards.
            const room = length - gap - width
            const drawn = Math.max(room, 0.01)
  // A slice too small for a dash becomes a dot, centred in its slice.
            const offset = room > 0 ? start + gap / 2 + width / 2 : start + length / 2

            return (
              <circle
                key={slice.id}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={slice.color}
                strokeLinecap="round"
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
                className="cursor-pointer transition-all duration-200 motion-reduce:transition-none"
                style={{
                  strokeWidth: width,
                  strokeDasharray: `${drawn} ${CIRCUMFERENCE - drawn}`,
                  strokeDashoffset: -offset,
                  opacity: selectedId && !isSelected ? 0.25 : 1,
                }}
                onClick={() => onSelect(isSelected ? null : slice.id)}
              />
            )
})}
        </svg>

        {selected ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="pointer-events-auto flex size-48 cursor-pointer flex-col items-center justify-center rounded-full px-6 text-center transition-colors hover:bg-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Label className="w-full truncate">{selected.name}</Label>
              <Amount cents={selected.cents} size="sm" className="mt-1" />
              <span className="mt-0.5 block text-xs text-muted">
                {percent(selected.cents)}%
              </span>
              <span className="mt-2 block text-xs text-muted">← Back to overview</span>
            </button>
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
            <Label className="w-full truncate">{totalLabel}</Label>
            <Amount cents={total} size="sm" className="mt-1" />
          </div>
        )}

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