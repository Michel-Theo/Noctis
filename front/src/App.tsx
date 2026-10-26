import './App.css'
import './pages/product.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSmoothScroll } from './lib/scroll'
import { Header } from './components/Header'
import { Cursor } from './components/Cursor'
import { PageTransition } from './components/PageTransition'
import { HomePage } from './pages/HomePage'
import { ProductPage } from './pages/ProductPage'

export default function App() {
  useSmoothScroll()

  return (
    <>
      <Cursor />
      <Header />
      {/* Avant les routes : ses effets doivent passer avant ceux de la page (transition FLIP). */}
      <PageTransition />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/collection/:slug" element={<ProductPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
