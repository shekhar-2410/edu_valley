import { BookOpen, Calculator, FlaskConical, Globe, Music, Palette } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const Academics = () => {
    const { t } = useTranslation()
    const programs = [
        {
            icon: <BookOpen size={40} />,
            title: t('academics.english'),
            description: t('academics.english_desc')
        },
        {
            icon: <Calculator size={40} />,
            title: t('academics.math'),
            description: t('academics.math_desc')
        },
        {
            icon: <FlaskConical size={40} />,
            title: t('academics.science'),
            description: t('academics.science_desc')
        },
        {
            icon: <Globe size={40} />,
            title: t('academics.social'),
            description: t('academics.social_desc')
        },
        {
            icon: <Palette size={40} />,
            title: t('academics.arts'),
            description: t('academics.arts_desc')
        },
        {
            icon: <Music size={40} />,
            title: t('academics.music'),
            description: t('academics.music_desc')
        }
    ]

    const grades = [
        {
            level: t('academics.elementary_title'),
            description: t('academics.elementary_desc'),
            highlights: [t('academics.elementary_h1'), t('academics.elementary_h2'), t('academics.elementary_h3')],
            color: 'bg-orange-50 text-orange-600',
            border: 'border-orange-100'
        },
        {
            level: t('academics.middle_title'),
            description: t('academics.middle_desc'),
            highlights: [t('academics.middle_h1'), t('academics.middle_h2'), t('academics.middle_h3')],
            color: 'bg-blue-50 text-blue-600',
            border: 'border-blue-100'
        },
        {
            level: t('academics.high_title'),
            description: t('academics.high_desc'),
            highlights: [t('academics.high_h1'), t('academics.high_h2'), t('academics.high_h3')],
            color: 'bg-emerald-50 text-emerald-600',
            border: 'border-emerald-100'
        }
    ]

    return (
        <div className="bg-white">
            {/* Header Section */}
            <section className="relative pt-16 pb-16 lg:pt-40 lg:pb-40 overflow-hidden bg-slate-950 text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=2000')] bg-fixed bg-cover bg-center opacity-10"></div>
                
                {/* Abstract Shapes */}
                <div className="absolute top-20 left-10 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-5xl mx-auto text-center">
                        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-sm font-black tracking-[0.2em] uppercase backdrop-blur-md mb-10">
                            {t('academics.header_label')}
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-10 leading-[1.1] tracking-tight">
                            {t('academics.header_title')}
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
                            {t('academics.header_subtitle')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Our Programs */}
            <section className="py-12 md:py-20 lg:py-32">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6">{t('academics.programs_title')}</h2>
                        <p className="text-xl text-slate-600">{t('academics.programs_subtitle')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {programs.map((program, index) => (
                            <div key={index} className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                    {program.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">{program.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{program.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Grade Levels */}
            <section className="py-12 md:py-24 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10 md:mb-16">
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900">{t('academics.grades_title')}</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {grades.map((grade, index) => (
                            <div key={index} className={`bg-white p-8 rounded-[2.5rem] shadow-lg border ${grade.border} hover:shadow-xl transition-all duration-300 h-full flex flex-col`}>
                                <div className={`inline-block px-4 py-2 rounded-full ${grade.color} font-bold text-sm tracking-wide mb-6 w-max`}>
                                    {grade.level}
                                </div>
                                <p className="text-slate-600 text-lg mb-8 flex-grow">{grade.description}</p>
                                <ul className="space-y-4">
                                    {grade.highlights.map((highlight, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                                            <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">✓</div>
                                            {highlight}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-12 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10 md:mb-16">
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6">{t('academics.features_title')}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        {[
                            { title: t('academics.feat1_title'), desc: t('academics.feat1_desc') },
                            { title: t('academics.feat2_title'), desc: t('academics.feat2_desc') },
                            { title: t('academics.feat3_title'), desc: t('academics.feat3_desc') },
                            { title: t('academics.feat4_title'), desc: t('academics.feat4_desc') },
                            { title: t('academics.feat5_title'), desc: t('academics.feat5_desc') },
                            { title: t('academics.feat6_title'), desc: t('academics.feat6_desc') },
                        ].map((feature, i) => (
                            <div key={i} className="flex gap-6 items-start p-6 rounded-2xl hover:bg-slate-50 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-xl">
                                    {i + 1}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h4>
                                    <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Scholarships */}
            <section className="py-16 md:py-24 bg-slate-900 text-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10 md:mb-16">
                        <span className="text-blue-400 font-bold tracking-wider uppercase text-sm mb-4 block">{t('academics.scholarships_label')}</span>
                        <h2 className="text-4xl lg:text-5xl font-extrabold mb-6">{t('academics.scholarships_title')}</h2>
                        <p className="text-xl text-slate-300 max-w-3xl mx-auto">{t('academics.scholarships_subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-10 md:mb-16">
                        <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 hover:border-blue-500 transition-colors">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                                {t('academics.ntse_title')}
                            </h3>
                            <div className="space-y-4 text-slate-300">
                                <p><strong className="text-white">{t('academics.conducted_by')}:</strong> NCERT</p>
                                <p><strong className="text-white">{t('academics.for_classes')}:</strong> Class 10</p>
                                <p><strong className="text-white">{t('academics.benefits')}:</strong> {t('faculty.read_profile')}</p>
                                <div className="mt-6 pt-6 border-t border-slate-700">
                                    <h4 className="text-white font-bold mb-3">{t('academics.resources')}:</h4>
                                    <div className="flex flex-wrap gap-4">
                                        <a href="https://ncert.nic.in/national-talent-examination.php" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Official NTSE Portal</a>
                                        <a href="https://www.education.gov.in/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Ministry of Education</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 hover:border-purple-500 transition-colors">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
                                {t('academics.olympiads_title')}
                            </h3>
                            <div className="space-y-4 text-slate-300">
                                <p><strong className="text-white">{t('academics.conducted_by')}:</strong> SOF & others</p>
                                <p><strong className="text-white">Major Exams:</strong> IMO, NSO, NCO, IEO, IGKO</p>
                                <div className="mt-6 pt-6 border-t border-slate-700">
                                    <h4 className="text-white font-bold mb-3">{t('academics.resources')}:</h4>
                                    <div className="flex flex-wrap gap-4">
                                        <a href="https://www.sofworld.org/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">Science Olympiad Foundation</a>
                                        <a href="https://olympiads.hbcse.tifr.res.in/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">HBCSE Olympiads</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 hover:border-emerald-500 transition-colors">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                                {t('academics.inspire_title')}
                            </h3>
                            <div className="space-y-4 text-slate-300">
                                <p><strong className="text-white">{t('academics.conducted_by')}:</strong> Dept of Science & Technology</p>
                                <p><strong className="text-white">For:</strong> Top 1% students in Board Exams</p>
                                <p><strong className="text-white">{t('academics.benefits')}:</strong> ₹80,000/year scholarship</p>
                                <div className="mt-6 pt-6 border-t border-slate-700">
                                    <h4 className="text-white font-bold mb-3">{t('academics.resources')}:</h4>
                                    <div className="flex flex-wrap gap-4">
                                        <a href="https://online-inspire.gov.in/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">INSPIRE Official Portal</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 hover:border-amber-500 transition-colors">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
                                {t('academics.state_scholarships')}
                            </h3>
                            <div className="space-y-4 text-slate-300">
                                <p><strong className="text-white">Schemes:</strong> Post-Matric, NMMS, Bihar Student Credit Card</p>
                                <p><strong className="text-white">Portals:</strong> NSP, e-Kalyan</p>
                                <div className="mt-6 pt-6 border-t border-slate-700">
                                    <h4 className="text-white font-bold mb-3">{t('academics.resources')}:</h4>
                                    <div className="flex flex-wrap gap-4">
                                        <a href="https://scholarships.gov.in/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">National Scholarship Portal</a>
                                        <a href="https://ekalyan.bih.nic.in/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">Bihar e-Kalyan</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* School Support */}
                    <div className="bg-slate-800/50 p-10 rounded-[2.5rem] border border-slate-700">
                        <h3 className="text-3xl font-bold text-white mb-10 text-center">{t('academics.support_title')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { title: t('academics.support1_title'), desc: t('academics.support1_desc') },
                                { title: t('academics.support2_title'), desc: t('academics.support2_desc') },
                                { title: t('academics.support3_title'), desc: t('academics.support3_desc') },
                                { title: t('academics.support4_title'), desc: t('academics.support4_desc') }
                            ].map((support, i) => (
                                <div key={i} className="text-center p-6 bg-slate-800 rounded-2xl">
                                    <h4 className="text-xl font-bold text-blue-400 mb-3">{support.title}</h4>
                                    <p className="text-slate-300">{support.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-blue-50">
                <div className="container mx-auto px-4">
                    <div className="bg-white rounded-[3rem] p-12 lg:p-20 text-center shadow-xl border border-blue-100 max-w-4xl mx-auto">
                        <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-6">{t('academics.cta_title')}</h2>
                        <p className="text-xl text-slate-600 mb-10">{t('academics.cta_subtitle')}</p>
                        <Link to="/contact" className="inline-block bg-blue-600 text-white font-bold text-lg px-10 py-5 rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            {t('academics.cta_btn')}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Academics
