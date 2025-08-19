import { HashRouter, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import AppRouter from './router'
import { Layout } from './ui'

/**
 * App envuelve el router y aplica animaciones entre páginas.
 * Cada cambio de ruta se anima usando framer-motion.
 */
function AnimatedRoutes() {
    const location = useLocation()
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.2 }}
            >
                <AppRouter />
            </motion.div>
        </AnimatePresence>
    )
}

export default function App() {
    return (
        <HashRouter>
            <Layout>
                {/* AppRouter renderiza las páginas con animación */}
                <AnimatedRoutes />
            </Layout>
        </HashRouter>
    )
}
