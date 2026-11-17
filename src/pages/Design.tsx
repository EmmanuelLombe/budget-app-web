import ThemeToggle from '../components/ThemeToggle'
import Amount from '../components/ui/Amount'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Label from '../components/ui/Label'

const colours = [
  { name: 'page', cls: 'bg-page' },
  { name: 'card', cls: 'bg-card' },
  { name: 'line', cls: 'bg-line' },
  { name: 'ink', cls: 'bg-ink' },
  { name: 'muted', cls: 'bg-muted' },
  { name: 'brand', cls: 'bg-brand' },
]

export default function Design() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl">Design system</h1>
        <ThemeToggle />
      </header>

      <section>
        <Label>Colours</Label>
        <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-6">
          {colours.map((c) => (
            <div key={c.name}>
              <div className={`h-16 rounded-xl border border-line ${c.cls}`} />
              <p className="mt-2 font-mono text-xs text-muted">{c.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <Label>Type</Label>
        <div className="mt-4 space-y-4">
          <h2 className="text-5xl">Where did my money go?</h2>
          <h2 className="text-3xl">Section heading</h2>
          <h3 className="text-xl">Card heading</h3>
          <p>Body text sits at the default size and weight.</p>
          <p className="text-sm text-muted">Secondary text for hints and captions.</p>
          <Label>Small label</Label>
        </div>
      </section>

      <section>
        <Label>Amounts</Label>
        <div className="mt-4 space-y-2">
          <Amount size="md">R1,500</Amount>
          <Amount size="lg">R12,480.50</Amount>
          <Amount size="xl">R12,480.50</Amount>
        </div>
      </section>

      <section>
        <Label>Buttons</Label>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="brand">Brand</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section>
        <Label>Card</Label>
        <Card className="mt-4 max-w-sm">
          <Label>Emergency fund</Label>
          <Amount size="lg" className="mt-2">R1,500</Amount>
          <p className="mt-1 text-sm text-muted">25% of income</p>
        </Card>
      </section>
    </div>
  )
}