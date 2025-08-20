import { Routes, Route, Navigate, type Location } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import Home from './pages/Home'
import StudyPage from './pages/StudyPage'
import ExamSimulatorPage from './pages/ExamSimulatorPage'
import TheoryExamPage from './pages/exam/TheoryExamPage'
import SignsExamPage from './pages/exam/SignsExamPage'
import PsychoTestsPage from './pages/psycho/PsychoTestsPage'
import FullExamPage from './pages/exam/FullExamPage'
import ResultsPage from './pages/exam/ResultsPage'

function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

export default function AppRouter({ location }: { location: Location }) {
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Page><Home /></Page>} />
      <Route path="/estudio" element={<Page><StudyPage /></Page>} />
      <Route path="/simulador" element={<Page><ExamSimulatorPage /></Page>} />
      <Route path="/simulador/teorico" element={<Page><TheoryExamPage /></Page>} />
      <Route path="/simulador/senales" element={<Page><SignsExamPage /></Page>} />
      <Route path="/simulador/psicofisico" element={<Page><PsychoTestsPage /></Page>} />
      <Route path="/simulador/completo" element={<Page><FullExamPage /></Page>} />
      <Route path="/resultado" element={<Page><ResultsPage /></Page>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
