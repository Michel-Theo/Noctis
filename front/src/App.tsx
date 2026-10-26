import './App.css'
import './pages/product.css'
import './pages/cart.css'
import './pages/account/account.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSmoothScroll } from './lib/scroll'
import { Header } from './components/Header'
import { Cursor } from './components/Cursor'
import { PageTransition } from './components/PageTransition'
import { HomePage } from './pages/HomePage'
import { ProductPage } from './pages/ProductPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/checkout/CheckoutPage'
import { PaymentPage } from './pages/checkout/PaymentPage'
import { ConfirmationPage } from './pages/checkout/ConfirmationPage'
import { AccountPage } from './pages/account/AccountPage'
import { CartDrawer } from './components/CartDrawer'

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
        <Route path="/panier" element={<CartPage />} />
        <Route path="/commande" element={<CheckoutPage />} />
        <Route path="/commande/paiement" element={<PaymentPage />} />
        <Route path="/commande/confirmation/:reference" element={<ConfirmationPage />} />
        <Route path="/compte" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CartDrawer />
    </>
  )
}
