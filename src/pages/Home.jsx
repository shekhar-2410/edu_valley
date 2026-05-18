import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    ArrowRight,
    ChevronRight,
    CheckCircle2,
    Users,
    Star,
    Clock,
    BookOpen,
    GraduationCap,
} from 'lucide-react'
import { API_ENDPOINTS } from '../config/api'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const Home = () => {
    const [announcements, setAnnouncements] = useState([])
    const [events, setEvents] = useState([])
    const { t } = useTranslation()

    useEffect(() => {
        fetchAnnouncements()
        fetchEvents()
    }, [])

    const fetchAnnouncements = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.announcements)
            if (response.ok) {
                const data = await response.json()
                setAnnouncements(data.slice(0, 3))
            }
        } catch (error) {
            // fetch failed silently - fallback announcements shown
        }
    }

    const fetchEvents = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.events)
            if (response.ok) {
                const data = await response.json()
                setEvents(data.slice(0, 3))
            }
        } catch (error) {
            // fetch failed silently - section hidden when empty
        }
    }

    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

    return (
        <div className="home-elearning">
            {/* Hero Section */}
            <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-32 bg-brand-cream overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.06] -z-10"></div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-navy-50/60 -skew-x-12 translate-x-32 -z-20"></div>

                <div className="absolute top-0 -left-20 w-96 h-96 bg-brand-gold-100/40 rounded-full blur-3xl -z-10 animate-blob"></div>
                <div className="absolute top-20 -right-20 w-96 h-96 bg-brand-crimson-100/30 rounded-full blur-3xl -z-10 animate-blob" style={{ animationDelay: '2s' }}></div>

                <div className="container mx-auto px-4 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-10">
                            <div className="inline-flex items-center gap-3 mb-8 font-bold text-brand-crimson-600 bg-brand-crimson-50 px-5 py-2.5 rounded-full border border-brand-crimson-200 shadow-sm transition-transform hover:scale-105">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-crimson-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-crimson-500"></span>
                                </span>
                                <span className="text-[12px] md:text-xs uppercase tracking-[0.2em] font-black">Admissions Open {academicYear}</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-brand-navy-900 leading-[1.1] mb-8 tracking-tight">
                                {t('home.hero_title')}
                            </h1>
                            <p className="text-lg md:text-xl text-brand-navy-400 mb-10 max-w-xl leading-relaxed font-medium">
                                {t('home.hero_subtitle')}
                            </p>

                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mb-12">
                                <Link to="/academics" className="group flex items-center gap-2 bg-brand-crimson-600 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-brand-crimson-700 hover:shadow-2xl hover:-translate-y-1 transition-all">
                                    {t('home.hero_cta')}
                                    <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
                                </Link>
                                <Link to="/admissions" className="flex items-center gap-2 text-brand-navy-800 font-bold text-lg hover:text-brand-crimson-600 transition-colors group">
                                    {t('home.admission_cta')}
                                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            <div className="flex flex-wrap justify-center lg:justify-start gap-8 lg:gap-12">
                                <div className="flex items-center gap-3 font-bold text-brand-navy-700">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-navy-50 text-brand-navy-600 flex items-center justify-center shadow-sm border border-brand-navy-100"><CheckCircle2 size={24} /></div>
                                    <span className="text-lg">{t('home.cbse_pattern')}</span>
                                </div>
                                <div className="flex items-center gap-3 font-bold text-brand-navy-700">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-gold-50 text-brand-gold-600 flex items-center justify-center shadow-sm border border-brand-gold-100"><CheckCircle2 size={24} /></div>
                                    <span className="text-lg">{t('home.expert_teachers')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 flex justify-center lg:justify-end mt-10 lg:mt-0">
                            <div className="relative w-full max-w-lg lg:max-w-xl">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-navy-600/10 rounded-full blur-3xl -z-10"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] border-[40px] border-brand-navy-600/10 rounded-full -z-10 animate-float"></div>

                                <img
                                    src="/images/home-hero.jpg"
                                    alt="Students at Narendra Edu Valley"
                                    onError={(e) => { e.target.src = '/images/campus-overview.jpg' }}
                                    className="w-full h-auto rounded-[3rem] shadow-2xl border-8 border-white group transition-transform duration-700 hover:scale-[1.02] relative z-10"
                                />

                                <div className="hidden md:flex absolute -top-10 -left-4 md:-left-12 bg-white/95 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl shadow-brand-navy-900/10 items-center gap-4 hover:scale-110 transition-transform cursor-default z-20 border border-white/50">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-navy-600 text-white flex items-center justify-center shadow-lg shadow-brand-navy-600/30"><Users size={28} /></div>
                                    <div className="flex flex-col">
                                        <strong className="text-3xl font-black text-brand-navy-900 leading-none">500+</strong>
                                        <span className="text-sm uppercase font-black text-brand-navy-300 mt-1 tracking-wider">Students</span>
                                    </div>
                                </div>

                                <div className="hidden md:flex absolute -bottom-10 right-4 lg:-right-8 bg-white/95 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl shadow-brand-gold-900/10 items-center gap-4 hover:scale-110 transition-transform cursor-default z-20 border border-white/50">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-gold-400 text-white flex items-center justify-center shadow-lg shadow-brand-gold-400/30"><Star size={28} /></div>
                                    <div className="flex flex-col">
                                        <strong className="text-3xl font-black text-brand-navy-900 leading-none">4.9</strong>
                                        <span className="text-sm uppercase font-black text-brand-navy-300 mt-1 tracking-wider">Avg Rating</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Announcements Marquee */}
            <section className="py-12 border-b border-brand-navy-100/30 bg-white">
                <div className="container mx-auto px-4">
                    <p className="text-center font-bold text-brand-navy-300 text-xs md:text-sm tracking-[0.2em] uppercase mb-10">{t('home.announcements_label')}</p>
                    <div className="w-full relative overflow-hidden"
                         style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                        <div className="flex gap-16 w-max animate-scroll py-2">
                            {announcements.length > 0 ? (
                                <>
                                    {[...announcements, ...announcements].map((ann, idx) => {
                                        const isHigh = ann.priority === 'high';
                                        const isLow = ann.priority === 'low';
                                        return (
                                            <div key={idx} className={`font-black text-lg md:text-xl transition-all flex items-center gap-4 px-8 py-4 rounded-2xl border shadow-sm ${
                                                isHigh ? 'text-brand-crimson-700 bg-brand-crimson-50 border-brand-crimson-200 ring-4 ring-brand-crimson-500/10' :
                                                isLow ? 'text-brand-navy-400 bg-brand-navy-50 border-brand-navy-200' :
                                                'text-brand-navy-700 bg-brand-navy-50 border-brand-navy-200'
                                            }`}>
                                                <span className={`relative flex h-3 w-3`}>
                                                    {isHigh && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-crimson-400 opacity-75"></span>}
                                                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isHigh ? 'bg-brand-crimson-600' : isLow ? 'bg-brand-navy-300' : 'bg-brand-navy-600'}`}></span>
                                                </span>
                                                {ann.title}
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <>
                                    {['CBSE Affiliated', 'Fit India School', 'Dream Siwan', 'Smart Class', 'CCTV Secured'].map((text, i) => (
                                        <div key={i} className="font-black text-lg text-brand-navy-700 bg-brand-navy-50 border border-brand-navy-200 px-8 py-4 rounded-2xl flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-brand-navy-400 inline-block"></span>
                                            {text}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>


            {/* Popular Academic Programs */}
            <section className="py-20 md:py-32 bg-brand-cream-dark">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 md:mb-20 gap-8">
                        <div className="max-w-2xl">
                            <span className="text-brand-crimson-600 font-bold uppercase tracking-widest text-sm mb-4 block">Academic Excellence</span>
                            <h2 className="text-4xl lg:text-5xl font-black text-brand-navy-900 leading-tight">
                                {t('home.popular_programs')}
                            </h2>
                        </div>
                        <Link to="/academics" className="inline-flex items-center gap-2 bg-white text-brand-navy-600 px-8 py-4 rounded-2xl font-black shadow-lg shadow-brand-navy-900/5 hover:-translate-y-1 transition-all">
                            {t('home.explore_all')} <ChevronRight size={20}/>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[
                            { title: t("home.primary_title"), img: "/images/students-group.jpg", classes: t("home.primary_classes"), icon: <BookOpen size={18}/>, badge: "Foundation" },
                            { title: t("home.secondary_title"), img: "/images/campus-overview.jpg", classes: t("home.secondary_classes"), icon: <GraduationCap size={18}/>, badge: "Board Prep" },
                            { title: t("home.clubs_title"), img: "/images/achievement.jpg", classes: t("home.clubs_classes"), icon: <Star size={18}/>, badge: "Co-curricular" }
                        ].map((prog, i) => (
                            <div key={i} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-brand-navy-100/50 group">
                                <div className="h-72 relative overflow-hidden">
                                    <img src={prog.img} alt={prog.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute top-6 left-6 bg-white/90 backdrop-blur text-brand-navy-800 text-xs font-black px-4 py-2 rounded-xl shadow-sm tracking-wider uppercase">{prog.badge}</div>
                                </div>
                                <div className="p-10">
                                    <div className="flex gap-6 mb-6 text-brand-navy-400 text-sm font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-2"><Clock size={16} className="text-brand-navy-500" /> <span>{prog.classes}</span></div>
                                        <div className="flex items-center gap-2"><Users size={16} className="text-brand-navy-500" /> <span>30 / Sec</span></div>
                                    </div>
                                    <h3 className="text-2xl font-black text-brand-navy-800 mb-8 group-hover:text-brand-crimson-600 transition-colors">{prog.title}</h3>
                                    <div className="flex justify-end items-center pt-8 border-t border-brand-navy-50">
                                        <Link to="/admissions" className="text-brand-crimson-600 font-black text-lg hover:text-brand-crimson-800 inline-flex items-center gap-1 group/link">
                                            {t('home.apply')}
                                            <ArrowRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Story / About Preview */}
            <section className="py-20 md:py-32 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-brand-navy-600/5 rounded-[3rem] rotate-3 -z-10"></div>
                            <img
                                src="/images/about-hero.jpg"
                                alt="Modern School Campus"
                                loading="lazy"
                                className="w-full h-[500px] lg:h-[700px] object-cover rounded-[3rem] shadow-2xl relative z-10"
                            />
                            <div className="absolute -bottom-10 lg:bottom-12 right-0 lg:-right-12 bg-white/95 backdrop-blur-md p-10 lg:p-12 rounded-[3rem] border border-white/50 shadow-2xl max-w-sm z-20 mx-4 lg:mx-0">
                                <h3 className="text-2xl font-black text-brand-navy-900 mb-4 tracking-tight">{t('home.story_title')}</h3>
                                <p className="text-brand-navy-400 font-medium mb-8 leading-relaxed">{t('home.story_desc')}</p>
                                <Link to="/about" className="inline-flex items-center justify-center w-full bg-brand-navy-600 text-white font-black py-5 px-8 rounded-2xl hover:bg-brand-navy-700 transition-all shadow-xl shadow-brand-navy-600/20 active:scale-95">
                                    {t('home.read_story')} <ArrowRight size={20} className="ml-3"/>
                                </Link>
                            </div>
                        </div>
                        <div className="mt-20 lg:mt-0">
                            <span className="inline-block text-brand-crimson-600 font-black uppercase tracking-[0.2em] text-sm mb-6">{t('home.why_choose_label')}</span>
                            <h2 className="text-4xl lg:text-6xl font-black text-brand-navy-900 mb-10 leading-[1.1] tracking-tight">
                                {t('home.why_choose_title')}
                            </h2>
                            <ul className="space-y-10">
                                {[
                                    { title: t("home.holistic_title"), desc: t("home.holistic_desc") },
                                    { title: t("home.smart_class_title"), desc: t("home.smart_class_desc") },
                                    { title: t("home.mentoring_title"), desc: t("home.mentoring_desc") }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-6 group">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-brand-navy-50 text-brand-navy-600 flex items-center justify-center shrink-0 group-hover:bg-brand-crimson-600 group-hover:text-white transition-all duration-300 shadow-sm border border-brand-navy-100">
                                            <CheckCircle2 size={32}/>
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-brand-navy-900 mb-2">{item.title}</h4>
                                            <p className="text-brand-navy-400 font-medium text-lg leading-relaxed">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    )
}

export default Home
