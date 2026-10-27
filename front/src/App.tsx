import './App.css'
import './pages/product.css'
import './pages/cart.css'
import './pages/account/account.css'
import './pages/vitrine/vitrine.css'
import './pages/admin/admin.css'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSmoothScroll } from './lib/scroll'
import { Header } from './components/Header'
import { Cursor } from './components/Cursor'
import { PageTransition } from './components/PageTransition'
import { CartDrawer } from './components/CartDrawer'
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const ProductPage = lazy(() => import('./pages/ProductPage').then((m) => ({ default: m.ProductPage })))
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })))
const CheckoutPage = lazy(() => import('./pages/checkout/CheckoutPage').then((m) => ({ default: m.CheckoutPage })))
const PaymentPage = lazy(() => import('./pages/checkout/PaymentPage').then((m) => ({ default: m.PaymentPage })))
const ConfirmationPage = lazy(() => import('./pages/checkout/ConfirmationPage').then((m) => ({ default: m.ConfirmationPage })))
const AccountPage = lazy(() => import('./pages/account/AccountPage').then((m) => ({ default: m.AccountPage })))
const ForgotPasswordPage = lazy(() => import('./pages/account/PasswordPages').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/account/PasswordPages').then((m) => ({ default: m.ResetPasswordPage })))
const CollectionPage = lazy(() => import('./pages/vitrine/CollectionPage').then((m) => ({ default: m.CollectionPage })))
const AtelierPage = lazy(() => import('./pages/vitrine/AtelierPage').then((m) => ({ default: m.AtelierPage })))
const JournalPage = lazy(() => import('./pages/vitrine/JournalPage').then((m) => ({ default: m.JournalPage })))
const ArticlePage = lazy(() => import('./pages/vitrine/ArticlePage').then((m) => ({ default: m.ArticlePage })))
const ContactPage = lazy(() => import('./pages/vitrine/ContactPage').then((m) => ({ default: m.ContactPage })))
const LegalPage = lazy(() => import('./pages/vitrine/LegalPage').then((m) => ({ default: m.LegalPage })))
const NotFoundPage = lazy(() => import('./pages/vitrine/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const AdminApp = lazy(() => import('./pages/admin/AdminApp').then((m) => ({ default: m.AdminApp })))

export default function App() {
  useSmoothScroll()

  return (
    <>
      <Cursor />
      <Header />
      {/* Avant les routes : ses effets doivent passer avant ceux de la page (transition FLIP). */}
      <PageTransition />
      <Suspense fallback={null}>
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
      </Suspense>
      <CartDrawer />
    </>
  )
}
