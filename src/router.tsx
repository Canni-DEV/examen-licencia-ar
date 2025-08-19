import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import StudyPage from './pages/StudyPage'
import ExamSimulatorPage from './pages/ExamSimulatorPage'
import TheoryExamPage from './pages/exam/TheoryExamPage'
import SignsExamPage from './pages/exam/SignsExamPage'
import PsychoTestsPage from './pages/psycho/PsychoTestsPage'
import FullExamPage from './pages/exam/FullExamPage'
import ResultsPage from './pages/exam/ResultsPage'

export default function AppRouter() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/estudio" element={<StudyPage />} />
        <Route path="/simulador" element={<ExamSimulatorPage />} />
        <Route path="/simulador/teorico" element={<TheoryExamPage />} />
        <Route path="/simulador/senales" element={<SignsExamPage />} />
        <Route path="/simulador/psicofisico" element={<PsychoTestsPage />} />
        <Route path="/simulador/completo" element={<FullExamPage />} />
        <Route path="/resultado" element={<ResultsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  )
}
