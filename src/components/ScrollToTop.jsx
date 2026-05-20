import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop — scrolls the window to (0, 0) on every
 * route change.  Placed once inside <BrowserRouter> so
 * it covers every public, protected, and admin route.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
