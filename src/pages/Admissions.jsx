import { Calendar, ShieldCheck, ChevronRight, IndianRupee, Award, Users, CheckCircle, Download, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const Admissions = () => {
    const { t } = useTranslation()

    const currentYear = new Date().getFullYear()
    const academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`

    const steps = [
        {
            number: '01',
            title: t('admissions.step1_title'),
            description: t('admissions.step1_desc'),
            color: 'bg-brand-navy-100 text-brand-navy-600'
        },
        {
            number: '02',
            title: t('admissions.step2_title'),
            description: t('admissions.step2_desc'),
            color: 'bg-brand-gold-100 text-brand-gold-700'
        },
        {
            number: '03',
            title: t('admissions.step3_title'),
            description: t('admissions.step3_desc'),
            color: 'bg-brand-crimson-100 text-brand-crimson-600'
        },
        {
            number: '04',
            title: t('admissions.step4_title'),
            description: t('admissions.step4_desc'),
            color: 'bg-emerald-100 text-emerald-600'
        }
    ]

    const requirements = [
        t('admissions.doc1'),
        t('admissions.doc2'),
        t('admissions.doc3'),
        t('admissions.doc4'),
        t('admissions.doc5'),
        t('admissions.doc6')
    ]

    return (
        <div className="bg-white">
            {/* Header Section */}
            <section className="relative pt-24 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-brand-navy-950 text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-800/40 via-brand-navy-950 to-brand-navy-900/40 z-0"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 z-0"></div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-bold tracking-[0.3em] uppercase backdrop-blur-xl mb-10">
                        {t('admissions.header_label', { year: academicYear })}
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-[1.1] tracking-tight">
                        {t('admissions.header_title')}
                    </h1>
                    <p className="text-lg md:text-xl text-brand-navy-300 max-w-2xl mx-auto font-medium leading-relaxed">
                        {t('admissions.header_subtitle')}
                    </p>
                </div>
            </section>

            {/* Admission Info Section */}
            <section className="py-12 md:py-20 lg:py-32 bg-brand-cream-dark">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
                        <span className="text-brand-crimson-600 font-bold tracking-wider uppercase text-sm mb-4 block">{t('admissions.info_label')}</span>
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-brand-navy-900 mb-6">{t('admissions.guide_title')}</h2>
                        <p className="text-xl text-brand-navy-400">{t('admissions.guide_subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-lg border border-brand-navy-100/50 hover:shadow-xl transition-shadow duration-300">
                            <div className="w-16 h-16 bg-brand-navy-50 text-brand-navy-600 rounded-2xl flex items-center justify-center mb-8">
                                <Calendar size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-brand-navy-800 mb-6">{t('admissions.dates_title')}</h3>
                            <ul className="space-y-4">
                                <li className="flex justify-between items-center text-brand-navy-500 pb-4 border-b border-brand-navy-100/50">
                                    <span className="font-semibold text-brand-navy-800">{t('admissions.app_starts')}</span>
                                    <span>{t('admissions.app_starts_date')}</span>
                                </li>
                                <li className="flex justify-between items-center text-brand-navy-500 pb-4 border-b border-brand-navy-100/50">
                                    <span className="font-semibold text-brand-navy-800">{t('admissions.early_bird')}</span>
                                    <span>{t('admissions.early_bird_date')}</span>
                                </li>
                                <li className="flex justify-between items-center text-brand-navy-500 pb-4 border-b border-brand-navy-100/50">
                                    <span className="font-semibold text-brand-navy-800">{t('admissions.session')}</span>
                                    <span>{t('admissions.session_date')}</span>
                                </li>
                                <li className="flex justify-between items-center text-brand-navy-500">
                                    <span className="font-semibold text-brand-navy-800">{t('admissions.rolling')}</span>
                                    <span>{t('admissions.rolling_desc')}</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white p-10 rounded-[2.5rem] shadow-lg border border-brand-navy-100/50 hover:shadow-xl transition-shadow duration-300">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8">
                                <ShieldCheck size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-brand-navy-800 mb-6">{t('admissions.fee_title')}</h3>
                            <div className="space-y-6">
                                <p className="text-brand-navy-500 leading-relaxed">
                                    {t('admissions.fee_desc')}
                                </p>
                                <div className="p-6 bg-brand-cream rounded-2xl border border-brand-navy-100/30">
                                    <h4 className="font-bold text-brand-navy-900 mb-2">{t('admissions.fee_request_title')}</h4>
                                    <p className="text-sm text-brand-navy-400 mb-4">{t('admissions.fee_request_desc')}</p>
                                    <Link to="/contact" className="inline-flex items-center text-brand-crimson-600 font-bold hover:gap-2 transition-all">
                                        {t('admissions.enquire_now')} <ChevronRight size={18} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Financial Aid & Scholarships Section */}
            <section className="py-14 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-10 md:mb-20">
                        <span className="text-brand-crimson-600 font-bold tracking-wider uppercase text-sm mb-4 block">{t('admissions.fin_aid_label')}</span>
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-brand-navy-900 mb-6">{t('admissions.fin_aid_title')}</h2>
                        <p className="text-xl text-brand-navy-400">
                            {t('admissions.fin_aid_subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-brand-cream p-10 rounded-[2.5rem] border border-brand-navy-100/30 hover:border-brand-navy-200 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                            <div className="w-16 h-16 bg-brand-navy-100 text-brand-navy-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-brand-navy-600 group-hover:text-white transition-colors duration-300">
                                <IndianRupee size={32} />
                            </div>
                            <h4 className="text-2xl font-bold text-brand-navy-900 mb-4">{t('admissions.need_aid_title')}</h4>
                            <p className="text-brand-navy-500 leading-relaxed italic mb-4">
                                {t('admissions.need_aid_quote')}
                            </p>
                            <p className="text-brand-navy-500 leading-relaxed">
                                {t('admissions.need_aid_desc')}
                            </p>
                        </div>

                        <div className="bg-brand-cream p-10 rounded-[2.5rem] border border-brand-navy-100/30 hover:border-brand-gold-200 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                            <div className="w-16 h-16 bg-brand-gold-100 text-brand-gold-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-brand-gold-600 group-hover:text-white transition-colors duration-300">
                                <Award size={32} />
                            </div>
                            <h4 className="text-2xl font-bold text-brand-navy-900 mb-4">{t('admissions.merit_title')}</h4>
                            <p className="text-brand-navy-500 leading-relaxed italic mb-4">
                                {t('admissions.merit_quote')}
                            </p>
                            <p className="text-brand-navy-500 leading-relaxed">
                                {t('admissions.merit_desc')}
                            </p>
                        </div>

                        <div className="bg-brand-cream p-10 rounded-[2.5rem] border border-brand-navy-100/30 hover:border-emerald-200 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                                <Users size={32} />
                            </div>
                            <h4 className="text-2xl font-bold text-brand-navy-900 mb-4">{t('admissions.sibling_title')}</h4>
                            <p className="text-brand-navy-500 leading-relaxed italic mb-4">
                                {t('admissions.sibling_quote')}
                            </p>
                            <ul className="space-y-2 text-brand-navy-500">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span>{t('admissions.sibling_desc1')}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span>{t('admissions.sibling_desc2')}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Process Steps */}
            <section className="py-14 md:py-24 bg-brand-cream">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10 md:mb-20">
                        <span className="text-brand-crimson-600 font-bold tracking-wider uppercase text-sm mb-4 block">{t('admissions.process_label')}</span>
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-brand-navy-900">{t('admissions.process_title')}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="relative group">
                                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center text-2xl font-black mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                                    {step.number}
                                </div>
                                <h4 className="text-xl font-bold text-brand-navy-900 mb-3 group-hover:text-brand-crimson-600 transition-colors">{step.title}</h4>
                                <p className="text-brand-navy-500 leading-relaxed font-medium">{step.description}</p>
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-8 right-0 w-1/2 h-0.5 bg-brand-navy-200 -mr-4 transform translate-x-1/2"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Documentation */}
            <section className="py-14 md:py-24 bg-brand-navy-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
                        <div>
                            <span className="text-brand-gold-400 font-bold tracking-wider uppercase text-sm mb-4 block">{t('admissions.docs_label')}</span>
                            <h2 className="text-4xl lg:text-5xl font-extrabold mb-8 leading-tight">{t('admissions.docs_title')}</h2>
                            <p className="text-xl text-brand-navy-300 mb-10 leading-relaxed">{t('admissions.docs_subtitle')}</p>

                            <ul className="space-y-4 mb-12">
                                {requirements.map((req, index) => (
                                    <li key={index} className="flex items-center gap-4 text-lg text-brand-navy-200 font-medium">
                                        <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                                        {req}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-wrap gap-4">
                                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-navy-800 border border-brand-navy-700 hover:bg-brand-navy-700 hover:border-brand-gold-500 transition-all text-white font-semibold">
                                    <Download size={20} /> {t('admissions.prospectus')}
                                </button>
                                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-navy-800 border border-brand-navy-700 hover:bg-brand-navy-700 hover:border-brand-gold-500 transition-all text-white font-semibold">
                                    <FileText size={20} /> {t('admissions.uniform')}
                                </button>
                            </div>
                        </div>

                        <div className="bg-brand-navy-800/50 p-8 md:p-12 rounded-[2.5rem] border border-brand-navy-700 backdrop-blur-sm">
                            <div className="flex items-start gap-6 mb-8">
                                <div className="w-14 h-14 bg-brand-navy-500/20 rounded-2xl flex items-center justify-center text-brand-gold-400 flex-shrink-0">
                                    <FileText size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-white">{t('admissions.guidelines')}</h3>
                            </div>
                            <div className="space-y-8 text-brand-navy-300 leading-relaxed font-medium">
                                <p>{t('admissions.guidelines_desc')}</p>
                                <p>{t('admissions.transfer_desc')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Banner */}
            <section className="py-24 bg-brand-cream">
                <div className="container mx-auto px-4">
                    <div className="bg-gradient-to-br from-brand-navy-700 to-brand-navy-900 rounded-[3rem] p-12 lg:p-20 text-center text-white relative overflow-hidden shadow-2xl mx-auto max-w-5xl">
                        <div className="relative z-10">
                            <h2 className="text-4xl lg:text-5xl font-extrabold mb-6">{t('admissions.cta_title')}</h2>
                            <p className="text-xl text-brand-navy-200 mb-10 max-w-2xl mx-auto">{t('admissions.cta_subtitle', { year: academicYear })}</p>
                            <div className="flex flex-col sm:flex-row justify-center gap-6">
                                <Link to="/contact" className="inline-flex items-center justify-center bg-brand-crimson-600 text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-brand-crimson-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    {t('admissions.reg_online')}
                                </Link>
                                <Link to="/contact" className="inline-flex items-center justify-center bg-transparent border-2 border-white text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-white/10 hover:-translate-y-1 transition-all duration-300">
                                    {t('admissions.enquire_now')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Admissions
