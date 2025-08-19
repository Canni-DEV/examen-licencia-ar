import { HashRouter, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import AppRouter from './router'
import { Layout } from './ui'

/**
 * App envuelve el router y aplica animaciones entre páginas.
 * Se utiliza AnimatePresence para mantener la ruta anterior mientras se anima la nueva.
 */
function AnimatedAppRouter() {
    const location = useLocation()
    return (
        <AnimatePresence mode="wait">
            <AppRouter location={location} key={location.pathname} />
        </AnimatePresence>
    )
}

export default function App() {
    return (
        <HashRouter>
            <Layout>
                {/* AppRouter renderiza las páginas con animación */}
                <AnimatedAppRouter />
            </Layout>
        </HashRouter>
    )
}
