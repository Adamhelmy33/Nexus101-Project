import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import Navbar          from './components/Navbar'
import Footer          from './components/Footer'
import WhatsAppButton  from './components/WhatsAppButton'
import ProtectedRoute  from './components/ProtectedRoute'
import ScrollProgress  from './components/ScrollProgress'
import BackToTop       from './components/BackToTop'

import Home            from './pages/Home'
import Store           from './pages/Store'
import Team            from './pages/Team'
import Contact         from './pages/Contact'
import Login           from './pages/Login'
import Checkout        from './pages/Checkout'
import CheckoutSuccess from './pages/CheckoutSuccess'
import MyCourses       from './pages/MyCourses'
import CourseViewer    from './pages/CourseViewer'
import Admin           from './pages/Admin'
import Dashboard       from './pages/Dashboard'
import Wallet          from './pages/Wallet'
import CustomCourseBuilder from './pages/CustomCourseBuilder'
import CustomCoursePlayer  from './pages/CustomCoursePlayer'

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()

  // Hide global chrome inside fullscreen flows
  const noChrome =
    location.pathname.startsWith('/admin-nexus') ||
    location.pathname === '/login'
  const noNavFooter =
    noChrome ||
    location.pathname.startsWith('/learn') ||
    /^\/custom-course\/[^/]+$/.test(location.pathname)   // hide chrome only in the playlist player, not the builder

  return (
    <div className="min-h-screen bg-white">
      {!noNavFooter && <ScrollProgress />}
      {!noNavFooter && <Navbar />}

      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>

          {/* ── Public ── */}
          <Route path="/"        element={<PageTransition><Home /></PageTransition>} />
          <Route path="/store"   element={<PageTransition><Store /></PageTransition>} />
          <Route path="/team"    element={<PageTransition><Team /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
          <Route path="/login"   element={<PageTransition><Login /></PageTransition>} />

          {/* Legacy redirects */}
          <Route path="/booking" element={<PageTransition><Store /></PageTransition>} />
          <Route path="/courses" element={<PageTransition><Store /></PageTransition>} />

          {/* ── Protected (any logged-in user) ── */}
          <Route path="/checkout/:courseId"          element={<ProtectedRoute><PageTransition><Checkout /></PageTransition></ProtectedRoute>} />
          <Route path="/checkout/:courseId/success"  element={<ProtectedRoute><PageTransition><CheckoutSuccess /></PageTransition></ProtectedRoute>} />
          <Route path="/my-courses"                  element={<ProtectedRoute><PageTransition><MyCourses /></PageTransition></ProtectedRoute>} />
          <Route path="/dashboard"                   element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
          <Route path="/wallet"                      element={<ProtectedRoute><PageTransition><Wallet /></PageTransition></ProtectedRoute>} />
          <Route path="/custom-course"               element={<ProtectedRoute><PageTransition><CustomCourseBuilder /></PageTransition></ProtectedRoute>} />
          <Route path="/custom-course/:playlistId"   element={<ProtectedRoute><CustomCoursePlayer /></ProtectedRoute>} />
          <Route path="/learn/:courseId"             element={<ProtectedRoute><CourseViewer /></ProtectedRoute>} />

          {/* ── Admin only ── */}
          <Route path="/admin-nexus" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

          {/* ── 404 ── */}
          <Route path="*" element={
            <PageTransition>
              <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
                <p className="text-8xl mb-6">📚</p>
                <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Page not found
                </h1>
                <p className="text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
                <a href="/" className="btn-primary">Go Home</a>
              </div>
            </PageTransition>
          } />
        </Routes>
      </AnimatePresence>

      {!noNavFooter && <Footer />}
      {!noChrome     && <BackToTop />}
      {!noChrome     && <WhatsAppButton />}
    </div>
  )
}
