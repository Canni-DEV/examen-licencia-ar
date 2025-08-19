import { HashRouter } from 'react-router-dom'
import AppRouter from './router'
import { Layout } from './ui'

/** App envuelve el router para animaciones globales */
export default function App() {
    // Nota: animamos a nivel de páginas individuales para simplicidad, ver pages/*
    return (
        <HashRouter>
            <Layout>
                {/* AppRouter renderiza las páginas */}
                <AppRouter />
            </Layout>
        </HashRouter>
    )
}
