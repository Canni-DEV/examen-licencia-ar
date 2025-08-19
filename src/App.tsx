import Header from './components/Header'
import Footer from './components/Footer'
import { AnimatePresence, motion } from 'framer-motion'
import { HashRouter } from 'react-router-dom'
import AppRouter from './router'

/** App envuelve el router para animaciones globales */
export default function App() {
    // Nota: animamos a nivel de páginas individuales para simplicidad, ver pages/*
    return (
        <HashRouter>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
                    {/* AppRouter renderiza las páginas */}
                    <AppRouter />
                </main>
                <Footer />
            </div>
        </HashRouter>
    )
}
