import { Route, Routes } from 'react-router-dom'
import Design from './pages/Design'

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="p-8">
            <h1 className="text-3xl">Budget App</h1>
          </div>
        }
      />
      <Route path="/design" element={<Design />} />
    </Routes>
  )
}