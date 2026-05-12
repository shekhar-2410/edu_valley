import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import About from './pages/About'
import Academics from './pages/Academics'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import Admissions from './pages/Admissions'
import Contact from './pages/Contact'
import Events from './pages/Events'
import ERPLogin from './pages/ERPLogin'
import ERPPortal from './pages/ERPPortal'
import Faculty from './pages/Faculty'
import Gallery from './pages/Gallery'
import Home from './pages/Home'
import Resources from './pages/Resources'
import NotFound from './pages/NotFound'
import ScrollToTop from './components/ui/ScrollToTop'
import ScrollToTopReset from './components/ui/ScrollToTopReset'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('adminToken') !== null
  return isAuthenticated ? children : <Navigate to="/admin-login" replace />
}

const ProtectedERPRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('erpToken') !== null
  return isAuthenticated ? children : <Navigate to="/erp-login" replace />
}

function AppContent() {
  const location = useLocation()
  const isErpRoute = location.pathname === '/erp' || location.pathname === '/erp-login'

  return (
    <div className={`flex flex-col min-h-screen font-body overflow-x-hidden ${isErpRoute ? 'bg-slate-50' : 'bg-brand-cream'}`}>
      {!isErpRoute && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/events" element={<Events />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/erp-login" element={<ERPLogin />} />
          <Route
            path="/erp"
            element={
              <ProtectedERPRoute>
                <ERPPortal />
              </ProtectedERPRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isErpRoute && <Footer />}
      {!isErpRoute && <ScrollToTop />}
      {!isErpRoute && (
        <a
          href="https://wa.me/917050421421?text=Hello%2C%20I%20want%20to%20enquire%20about%20admissions"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl hover:scale-110 transition-transform"
          title="Chat on WhatsApp"
        >
          <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="56" height="56">
            <circle cx="24" cy="24" r="24" fill="#25D366"/>
            <path fill="#fff" d="M34.5 13.5A14.9 14.9 0 0 0 24 9C16.27 9 10 15.27 10 23c0 2.64.7 5.22 2.02 7.5L10 39l8.72-2.28A14.9 14.9 0 0 0 24 38c7.73 0 14-6.27 14-14 0-3.74-1.46-7.26-4-9.9zM24 35.5a12.3 12.3 0 0 1-6.28-1.72l-.45-.27-4.67 1.22 1.25-4.56-.3-.47A12.4 12.4 0 0 1 11.5 23c0-6.9 5.6-12.5 12.5-12.5 3.34 0 6.47 1.3 8.83 3.67A12.4 12.4 0 0 1 36.5 23c0 6.9-5.6 12.5-12.5 12.5zm6.87-9.37c-.38-.19-2.23-1.1-2.57-1.22-.35-.13-.6-.19-.85.19s-.97 1.22-1.19 1.48c-.22.25-.44.28-.82.09-.38-.19-1.6-.59-3.05-1.88-1.13-1-1.89-2.24-2.11-2.62-.22-.38-.02-.58.16-.77.17-.17.38-.44.57-.66.19-.22.25-.38.38-.63.13-.25.06-.47-.03-.66-.09-.19-.85-2.05-1.16-2.8-.31-.74-.62-.63-.85-.64H17c-.22 0-.57.08-.87.38s-1.13 1.1-1.13 2.69 1.16 3.12 1.32 3.34c.16.22 2.28 3.48 5.53 4.88.77.33 1.37.53 1.84.68.77.24 1.47.21 2.02.13.62-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.13-.31-.22-.66-.38z"/>
          </svg>
        </a>
      )}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

function App() {
  return (
    <Router>
      <ScrollToTopReset />
      <AppContent />
    </Router>
  )
}

export default App
