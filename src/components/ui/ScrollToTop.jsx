import { ChevronUp } from 'lucide-react'
import { useState, useEffect } from 'react'

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false)

    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true)
        } else {
            setIsVisible(false)
        }
    }

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility)
        return () => window.removeEventListener('scroll', toggleVisibility)
    }, [])

    return (
        <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 p-2 ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-50 pointer-events-none'}`}>
            <button
                onClick={scrollToTop}
                className="group relative flex items-center justify-center w-14 h-14 bg-brand-navy-600 text-white rounded-2xl shadow-2xl hover:bg-brand-crimson-600 transition-all duration-300 hover:-translate-y-2 active:scale-95"
                aria-label="Scroll to top"
            >
                <div className="absolute inset-x-0 -inset-y-2 bg-brand-navy-400 blur-2xl opacity-0 group-hover:opacity-40 transition-opacity rounded-full"></div>
                <ChevronUp className="relative z-10 w-7 h-7 stroke-[3px] animate-bounce-subtle" />
            </button>
        </div>
    )
}

export default ScrollToTop
