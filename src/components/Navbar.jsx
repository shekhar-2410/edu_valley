import { Menu, X, Languages, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [moreOpen, setMoreOpen] = useState(false)
    const moreRef = useRef(null)
    const location = useLocation()

    const { t, i18n } = useTranslation()

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const primaryItems = [
        { path: '/', label: t('navbar.home') },
        { path: '/about', label: t('navbar.about') },
        { path: '/academics', label: t('navbar.academics') },
        { path: '/admissions', label: t('navbar.admissions') },
        { path: '/events', label: t('navbar.events') },
        { path: '/contact', label: t('navbar.contact') },
    ]

    const moreItems = [
        { path: '/faculty', label: t('navbar.faculty') },
        { path: '/gallery', label: t('navbar.gallery') },
        { path: '/resources', label: t('navbar.resources') },
    ]

    const navItems = [...primaryItems, ...moreItems]

    const toggleLanguage = () => {
        const nextLang = i18n.language === 'en' ? 'hi' : 'en'
        i18n.changeLanguage(nextLang)
    }

    const toggleMenu = () => setIsOpen(!isOpen)

    const isActive = (path) => location.pathname === path

    const mobileMenu = createPortal(
        <div className={`fixed inset-0 bg-white z-[9999] flex flex-col pt-24 px-8 gap-6 transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <button className="absolute top-6 right-4 text-brand-navy-800 p-2" onClick={toggleMenu}>
                 <X size={32} />
            </button>
             {navItems.map((item) => (
                <Link
                    key={item.path}
                    to={item.path}
                    className={`text-xl font-bold p-2 transition-all ${isActive(item.path) ? 'border-l-4 border-brand-crimson-600 pl-3 text-brand-crimson-600' : 'text-brand-navy-800'}`}
                    onClick={() => setIsOpen(false)}
                >
                    {item.label}
                </Link>
            ))}
            <div className="flex flex-col gap-4 mt-8">
                <button
                    onClick={toggleLanguage}
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border-2 border-brand-navy-100 text-brand-navy-800 font-bold text-lg"
                >
                    <Languages size={24} />
                    {i18n.language === 'en' ? 'Switch to हिन्दी' : 'Switch to English'}
                </button>
                <Link to="/admissions" className="bg-brand-crimson-600 text-white text-center py-4 rounded-xl font-bold text-lg shadow-lg shadow-brand-crimson-600/20" onClick={() => setIsOpen(false)}>
                    {t('navbar.enroll')}
                </Link>
            </div>
        </div>,
        document.body
    )

    return (
        <>
            <nav className={`sticky top-0 w-full z-[1000] transition-all duration-300 ${scrolled ? 'bg-white/98 shadow-md' : 'bg-white/95'} backdrop-blur-md border-b border-brand-navy-100/40 py-3 md:py-4`}>
                <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3 md:gap-4 group shrink-0">
                        <img src="/images/logo.svg" alt="Narendra Edu Valley Logo" className="h-16 md:h-18 w-auto transition-transform group-hover:scale-105" />
                        <div className="flex flex-col justify-center gap-0.5 md:gap-1">
                            <span className="font-display text-base md:text-lg lg:text-xl font-black text-brand-navy-800 leading-none">Narendra Edu Valley</span>
                            <span className="text-[9px] md:text-[10px] lg:text-[11px] font-bold text-brand-gold-600 tracking-[0.1em] md:tracking-[0.15em] uppercase">सा विद्या या विमुक्तये</span>
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center gap-6 xl:gap-10">
                        <div className="flex items-center gap-5 xl:gap-8 border-r border-brand-navy-100/30 pr-8 xl:pr-10">
                            {primaryItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`text-[14px] font-semibold tracking-tight transition-all duration-300 relative whitespace-nowrap ${isActive(item.path) ? 'text-brand-crimson-600' : 'text-brand-navy-700 hover:text-brand-crimson-600'}`}
                                >
                                    {item.label}
                                    {isActive(item.path) && (
                                        <span className="absolute -bottom-1.5 left-0 w-full h-[3px] bg-brand-crimson-600 rounded-full shadow-[0_2px_4px_rgba(201,42,42,0.3)]" />
                                    )}
                                </Link>
                            ))}
                            {/* More dropdown */}
                            <div className="relative" ref={moreRef}>
                                <button
                                    onClick={() => setMoreOpen(v => !v)}
                                    className={`flex items-center gap-1 text-[14px] font-semibold tracking-tight transition-all duration-300 whitespace-nowrap ${moreItems.some(i => isActive(i.path)) ? 'text-brand-crimson-600' : 'text-brand-navy-700 hover:text-brand-crimson-600'}`}
                                >
                                    More <ChevronDown size={14} className={`transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {moreOpen && (
                                    <div className="absolute top-full left-0 mt-3 bg-white rounded-2xl shadow-2xl border border-brand-navy-100/50 py-2 min-w-[160px] z-50">
                                        {moreItems.map((item) => (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setMoreOpen(false)}
                                                className={`block px-5 py-3 text-[14px] font-semibold transition-colors ${isActive(item.path) ? 'text-brand-crimson-600 bg-brand-crimson-50' : 'text-brand-navy-700 hover:text-brand-crimson-600 hover:bg-brand-navy-50'}`}
                                            >
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 xl:gap-5 shrink-0">
                            <button
                                onClick={toggleLanguage}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-navy-200 text-brand-navy-700 hover:text-brand-navy-600 hover:border-brand-navy-400 hover:bg-brand-navy-50 transition-all text-xs font-bold uppercase tracking-wider"
                                title={i18n.language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
                            >
                                <Languages size={15} />
                                {i18n.language === 'en' ? 'हिन्दी' : 'English'}
                            </button>
                            <Link to="/admissions" className="bg-brand-crimson-600 text-white px-8 xl:px-10 py-3 rounded-xl font-bold text-[14px] hover:bg-brand-crimson-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all whitespace-nowrap shadow-md shadow-brand-crimson-600/20">
                                {t('navbar.enroll')}
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="lg:hidden text-brand-navy-800 hover:text-brand-crimson-600 transition-colors p-2" onClick={toggleMenu} aria-label="Toggle menu">
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </nav>

            {/* Mobile menu portaled to document.body to escape backdrop-blur stacking context */}
            {mobileMenu}
        </>
    )
}

export default Navbar
