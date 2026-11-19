import Amount from '../../components/ui/Amount'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Label from '../../components/ui/Label'
import Progress from '../../components/ui/Progress'
import { formatZAR } from '../../lib/money'
import type { BucketSummary } from '../../lib/summary'
import { barColor } from './barColour'

type Props = {
  summary: BucketSummary
  color: string
  onBack: () => void
}

function statusLine(s: BucketSummary) {
  if (s.allocatedCents === 0) {
    return s.spentCents > 0
      ? { text: `${formatZAR(s.spentCents)} spent with nothing allocated`, cls: 'text-over' }
      : { text: 'Nothing allocated this month', cls: 'text-muted' }
  }
  if (s.status === 'over') {
    return { text: `${formatZAR(-s.remainingCents)} over budget`, cls: 'text-over' }
  }
  if (s.status === 'near') {
    return { text: `${formatZAR(s.remainingCents)} left, nearly at the limit`, cls: 'text-warn' }
  }
  return { text: `${formatZAR(s.remainingCents)} left`, cls: 'text-muted' }
}

export default function BucketDetail({ summary, color, onBack }: Props) {
  const line = statusLine(summary)

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="size-3 rounded" style={{ backgroundColor: color }} />
          <h3 className="text-xl">{summary.name}</h3>
        </div>
        <Button variant="secondary" onClick={onBack}>
          Back to overview
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 divide-x divide-line">
        <div className="pr-4">
          <Label>Spent</Label>
          <Amount cents={summary.spentCents} size="md" className="mt-1" />
        </div>
        <div className="pl-6">
          <Label>Allocated</Label>
          <Amount cents={summary.allocatedCents} size="md" className="mt-1" />
        </div>
      </div>

      <Progress
        percent={summary.usedPercent ?? 0}
        color={barColor(summary.status, color)}
        label={`${summary.name} budget used`}
        className="mt-6"
      />

      <div className="mt-3 flex items-baseline justify-between text-sm">
        <p className={line.cls}>{line.text}</p>
        <p className="font-mono text-xs tabular-nums text-muted">
          {summary.usedPercent ?? 0}% used
        </p>
      </div>
    </Card>
  )
}