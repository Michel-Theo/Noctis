import './App.css'
import './pages/product.css'
import './pages/cart.css'
import './pages/account/account.css'
import './pages/vitrine/vitrine.css'
import './pages/admin/admin.css'
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
import { ForgotPasswordPage, ResetPasswordPage } from './pages/account/PasswordPages'
import { CollectionPage } from './pages/vitrine/CollectionPage'
import { AtelierPage } from './pages/vitrine/AtelierPage'
import { JournalPage } from './pages/vitrine/JournalPage'
import { ArticlePage } from './pages/vitrine/ArticlePage'
import { ContactPage } from './pages/vitrine/ContactPage'
import { LegalPage } from './pages/vitrine/LegalPage'
import { NotFoundPage } from './pages/vitrine/NotFoundPage'
import { AdminApp } from './pages/admin/AdminApp'
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
        <Route path="/compte/mot-de-passe" element={<ForgotPasswordPage />} />
        <Route path="/compte/reinitialiser" element={<ResetPasswordPage />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/atelier" element={<AtelierPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/journal/:slug" element={<ArticlePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/informations" element={<Navigate to="/informations/cgv" replace />} />
        <Route path="/informations/:slug" element={<LegalPage />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <CartDrawer />
    </>
  )
}
