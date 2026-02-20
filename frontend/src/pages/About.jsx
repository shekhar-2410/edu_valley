import { Award, Eye, Target, Users, CheckCircle, Heart, Star, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const About = () => {
    const { t } = useTranslation()
    return (
        <div className="bg-white">
            {/* Header Section */}
            <section className="relative pt-12 pb-12 lg:pt-20 lg:pb-20 overflow-hidden bg-slate-950 text-white">
                <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/images/about-hero.jpg')" }}></div>
                <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full bg-blue-600/10 skew-x-[-15deg] translate-x-32 hidden lg:block"></div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl">
                        <span className="inline-block px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-bold tracking-widest uppercase backdrop-blur-sm mb-6 animate-fade-in">{t('about.header_label')}</span>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 leading-[1.1] tracking-tight text-white">
                            {t('about.header_title')}
                        </h1>
                        <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed max-w-2xl">
                            {t('about.header_subtitle')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Intro Section */}
            <section className="py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                        <div className="space-y-8">
                            <span className="text-blue-600 font-bold tracking-wider uppercase text-sm">{t('about.history_label')}</span>
                            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">{t('about.history_title')}</h2>
                            <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                                <p>{t('about.history_p1')}</p>
                                <p>{t('about.history_p2')}</p>
                            </div>
                        </div>
                        <div className="relative">
                            <img 
                                src="/images/campus-overview.jpg" 
                                alt="Students in classroom" 
                                className="w-full h-auto rounded-[2.5rem] shadow-2xl relative z-10"
                            />
                            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[2rem] shadow-xl z-20 hidden md:block animate-bounce border border-slate-100">
                                <h3 className="text-5xl font-extrabold text-blue-600 mb-2">10+</h3>
                                <span className="text-slate-500 font-bold uppercase tracking-wider text-sm">{t('about.years_success')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-12 md:py-20 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                        <div className="bg-white p-10 lg:p-14 rounded-[2.5rem] shadow-lg border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-8">
                                <Target size={32} />
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800 mb-6">{t('about.mission_title')}</h3>
                            <p className="text-slate-600 leading-relaxed text-lg">{t('about.mission_desc')}</p>
                        </div>
                        <div className="bg-white p-10 lg:p-14 rounded-[2.5rem] shadow-lg border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-8">
                                <Eye size={32} />
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800 mb-6">{t('about.vision_title')}</h3>
                            <p className="text-slate-600 leading-relaxed text-lg">{t('about.vision_desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-12 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-10 md:mb-20">
                        <span className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-4 block">{t('about.values_label')}</span>
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6">{t('about.values_title')}</h2>
                        <p className="text-xl text-slate-600">{t('about.values_subtitle')}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: CheckCircle, title: t('about.excellence'), desc: t('about.excellence_desc'), color: "text-emerald-500", bg: "bg-emerald-50" },
                            { icon: Heart, title: t('about.compassion'), desc: t('about.compassion_desc'), color: "text-rose-500", bg: "bg-rose-50" },
                            { icon: Star, title: t('about.innovation'), desc: t('about.innovation_desc'), color: "text-amber-500", bg: "bg-amber-50" },
                            { icon: Shield, title: t('about.integrity'), desc: t('about.integrity_desc'), color: "text-blue-500", bg: "bg-blue-50" },
                        ].map((item, i) => (
                            <div key={i} className="text-center p-8 rounded-[2rem] hover:bg-slate-50 transition-colors duration-300 group">
                                <div className={`w-20 h-20 mx-auto rounded-full ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon size={32} />
                                </div>
                                <h4 className="text-2xl font-bold text-slate-800 mb-4">{item.title}</h4>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Achievements */}
            <section className="py-12 md:py-24 bg-blue-900 text-white overflow-hidden relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-800/30 skew-x-12"></div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
                        <div>
                            <span className="text-blue-300 font-bold tracking-wider uppercase text-sm mb-4 block">{t('about.success_label')}</span>
                            <h2 className="text-4xl lg:text-5xl font-extrabold mb-12 leading-tight">{t('about.success_title')}</h2>
                            
                            <div className="space-y-10">
                                {[
                                    { title: t('about.achievement1_title'), desc: t('about.achievement1_desc') },
                                    { title: t('about.achievement2_title'), desc: t('about.achievement2_desc') },
                                    { title: t('about.achievement3_title'), desc: t('about.achievement3_desc') }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="text-5xl font-black text-white/10 group-hover:text-white/30 transition-colors">0{i+1}</div>
                                        <div>
                                            <h4 className="text-2xl font-bold mb-3 text-white">{item.title}</h4>
                                            <p className="text-blue-200 leading-relaxed text-lg">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-600 rounded-[2.5rem] rotate-6 opacity-30"></div>
                            <img 
                                src="/images/achievement.jpg" 
                                alt="School event" 
                                className="w-full h-auto rounded-[2.5rem] shadow-2xl relative z-10 rotate-0 hover:rotate-2 transition-transform duration-500" 
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Banner */}
            <section className="py-12 md:py-24 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[3rem] p-8 md:p-12 lg:p-20 text-center text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/pattern.svg')] opacity-10"></div>
                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-4xl lg:text-6xl font-extrabold mb-6 md:mb-8 leading-tight">{t('about.cta_title')}</h2>
                            <p className="text-xl text-blue-100 mb-10 leading-relaxed">{t('about.cta_subtitle')}</p>
                            <Link to="/admissions" className="inline-block bg-white text-blue-700 font-bold text-lg px-10 py-5 rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300">
                                {t('about.cta_btn')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default About
