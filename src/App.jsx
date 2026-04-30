import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import About from './pages/About'
import Academics from './pages/Academics'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import Admissions from './pages/Admissions'
import Contact from './pages/Contact'
import Events from './pages/Events'
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

function App() {
  return (
    <Router>
      <ScrollToTopReset />
      <div className="flex flex-col min-h-screen font-body bg-brand-cream overflow-x-hidden">
        <Navbar />
        <main className="flex-grow"> {/* Sticky navbar handles its own space */}
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
        <Footer />
        <ScrollToTop />
        <a
          href="https://wa.me/917050421421?text=Hello%2C%20I%20want%20to%20enquire%20about%20admissions"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 hover:bg-green-600 transition-all"
          title="Chat on WhatsApp"
        >
          <MessageCircle size={28} />
        </a>
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
    </Router>
  )
}

export default App
