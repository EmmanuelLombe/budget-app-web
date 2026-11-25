import { bucketColor } from '../../components/charts/bucketColour'
import Amount from '../../components/ui/Amount'
import Card from '../../components/ui/Card'
import Label from '../../components/ui/Label'
import Progress from '../../components/ui/Progress'
import { formatZAR } from '../../lib/money'
import type { PeriodSummary } from '../../lib/summary'
import { barColor } from './barColour'

type Props = {
  summary: PeriodSummary
  onSelect: (id: string) => void
}

export default function Overview({ summary, onSelect }: Props) {
  return (
    <Card>
      {/* <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Income</Label>
          <Amount cents={summary.incomeCents} size="sm" className="mt-1" />
        </div>
        <div>
          <Label>Spent</Label>
          <Amount cents={summary.spentCents} size="sm" className="mt-1" />
        </div>
        <div>
          <Label>Remaining</Label>
          <Amount
            cents={summary.remainingCents}
            size="sm"
            className={`mt-1 ${summary.remainingCents < 0 ? 'text-over' : ''}`}
          />
        </div>
      </div> */}


      <div className="@container">
        <div className="grid grid-cols-1 divide-y divide-line @lg:grid-cols-3 @lg:gap-4 @lg:divide-y-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <Label>Income</Label>
            <Amount cents={summary.incomeCents} size="md" className="@lg:mt-1" />
          </div>
          <div className="flex items-baseline justify-between py-2 @lg:block @lg:py-0">
            <Label>Spent</Label>
            <Amount cents={summary.spentCents} size="md" className="@lg:mt-1" />
          </div>
          <div className="flex items-baseline justify-between py-2 @lg:block @lg:py-0">
            <Label>Remaining</Label>
            <Amount
              cents={summary.remainingCents}
              size="md"
              className={`@lg:mt-1 ${summary.remainingCents < 0 ? 'text-over' : ''}`}
            />
          </div>
        </div>
      </div>

      <ul className="mt-6 divide-y divide-line">
        {summary.buckets.map((b) => {
          const color = bucketColor(b.sortOrder)
          return (
            <li key={b.bucketId}>
              <button
                type="button"
                onClick={() => onSelect(b.bucketId)}
                className="w-full rounded-lg py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="flex items-center gap-2 text-sm">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {b.name}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted">
                    {formatZAR(b.spentCents)} / {formatZAR(b.allocatedCents)}
                  </span>
                </div>
                <Progress
                  percent={b.usedPercent ?? 0}
                  color={barColor(b.status, color)}
                  label={`${b.name} budget used`}
                  className="mt-2"
                />
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}