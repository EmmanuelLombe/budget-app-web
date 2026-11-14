import type { ReactNode } from 'react'
import ThemeToggle from '../components/ThemeToggle'

const colours = [
  { name: 'page', cls: 'bg-page' },
  { name: 'card', cls: 'bg-card' },
  { name: 'line', cls: 'bg-line' },
  { name: 'ink', cls: 'bg-ink' },
  { name: 'muted', cls: 'bg-muted' },
  { name: 'brand', cls: 'bg-brand' },
]

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-widest text-muted">
      {children}
    </p>
  )
}

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
          <p className="font-mono text-4xl tabular-nums">R12,480.50</p>
        </div>
      </section>

      <section>
        <Label>Buttons</Label>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-full bg-ink px-5 py-2 text-sm text-page">
            Primary
          </button>
          <button className="rounded-full border border-line bg-card px-5 py-2 text-sm">
            Secondary
          </button>
          <button className="rounded-full bg-brand px-5 py-2 text-sm text-on-brand">
            Brand
          </button>
        </div>
      </section>

      <section>
        <Label>Card</Label>
        <div className="mt-4 max-w-sm rounded-2xl border border-line bg-card p-6">
          <Label>Emergency fund</Label>
          <p className="mt-2 font-mono text-4xl tabular-nums">R1,500</p>
          <p className="mt-1 text-sm text-muted">25% of income</p>
        </div>
      </section>
    </div>
  )
}