import { ChevronUp } from 'lucide-react'
import { useState, useEffect } from 'react'

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false)

    // Show button when page is scrolled down
    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true)
        } else {
            setIsVisible(false)
        }
    }

    // Set the top coordinate to 0
    // make scrolling smooth
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
                className="group relative flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl hover:bg-blue-700 transition-all duration-300 hover:-translate-y-2 active:scale-95"
                aria-label="Scroll to top"
            >
                {/* Background Glow */}
                <div className="absolute inset-x-0 -inset-y-2 bg-blue-400 blur-2xl opacity-0 group-hover:opacity-40 transition-opacity rounded-full"></div>
                
                <ChevronUp className="relative z-10 w-7 h-7 stroke-[3px] animate-bounce-subtle" />
                
                {/* Simple animation defined in index.css or inline */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes bounce-subtle {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-3px); }
                    }
                    .animate-bounce-subtle {
                        animation: bounce-subtle 2s infinite ease-in-out;
                    }
                ` }} />
            </button>
        </div>
    )
}

export default ScrollToTop
