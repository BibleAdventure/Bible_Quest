import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import TeacherDashboard from './pages/TeacherDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/teacher" replace />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/:tab" element={<TeacherDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
