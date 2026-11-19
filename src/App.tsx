import { Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Design from './pages/Design'
import Home from './pages/Home'

function Placeholder({ title }: { title: string }) {
  return <h1 className="text-3xl">{title}</h1>
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/expenses" element={<Placeholder title="Expenses" />} />
        <Route path="/buckets" element={<Placeholder title="Buckets" />} />
        <Route path="/settings" element={<Placeholder title="Settings" />} />
      </Route>
      <Route path="/design" element={<Design />} />
    </Routes>
  )
}