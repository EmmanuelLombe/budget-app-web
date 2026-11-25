import SplitEditor from '../features/split/SplitEditor'

export default function Buckets() {
  return (
    <div>
      <header>
        <h1 className="text-3xl">Buckets</h1>
      </header>
      <div className="mt-8 max-w-xl">
        <SplitEditor />
      </div>
    </div>
  )
}