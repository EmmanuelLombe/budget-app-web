import { Home, PieChart, Receipt, Settings } from 'lucide-react'

export const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/expenses', label: 'Expenses', icon: Receipt, end: false },
  { to: '/buckets', label: 'Buckets', icon: PieChart, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]