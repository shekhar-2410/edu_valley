import { Facebook, Instagram, Youtube, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const Footer = () => {
    const { t } = useTranslation()
    return (
        <footer className="bg-brand-navy-900 text-white pt-24 pb-10 rounded-t-[3rem] mt-20">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    <div className="flex flex-col gap-6">
                        <Link to="/" className="flex items-center gap-4 group">
                            <img src="/images/logo.svg" alt="Narendra Edu Valley" className="h-20 md:h-24 w-auto transition-transform group-hover:scale-105" />
                            <div className="flex flex-col">
                                <span className="font-display text-2xl font-extrabold text-white">Narendra Edu Valley</span>
                                <span className="text-brand-gold-400 text-[10px] font-bold tracking-widest uppercase">सा विद्या या विमुक्तये</span>
                            </div>
                        </Link>
                        <p className="text-brand-navy-300 leading-relaxed">
                            {t('footer.about_desc')}
                        </p>
                        <div className="flex gap-4">
                            <a href="https://www.facebook.com/nevalley?rdid=EcL20dwNcYIwSLCq&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1J5oCqFxVe%2F#" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-brand-navy-500 hover:-translate-y-1 transition-all"><Facebook size={20} /></a>
                            <a href="https://www.instagram.com/p/DMmqb9Vib70/?igsh=OTRvNHhseXA4NXF5" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-brand-crimson-600 hover:-translate-y-1 transition-all"><Instagram size={20} /></a>
                            <a href="https://youtube.com/@narendraeduvalley5232?si=WNFFhpFRVT_Fh26S" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-red-600 hover:-translate-y-1 transition-all"><Youtube size={20} /></a>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <h3 className="text-xl font-display font-bold text-white">{t('footer.quick_links')}</h3>
                        <ul className="space-y-4">
                            <li><Link to="/about" className="text-brand-navy-300 hover:text-brand-gold-400 hover:pl-2 transition-all flex items-center gap-2"><ArrowRight size={14} /> {t('navbar.about')}</Link></li>
                            <li><Link to="/academics" className="text-brand-navy-300 hover:text-brand-gold-400 hover:pl-2 transition-all flex items-center gap-2"><ArrowRight size={14} /> {t('navbar.academics')}</Link></li>
                            <li><Link to="/admissions" className="text-brand-navy-300 hover:text-brand-gold-400 hover:pl-2 transition-all flex items-center gap-2"><ArrowRight size={14} /> {t('navbar.admissions')}</Link></li>
                            <li><Link to="/events" className="text-brand-navy-300 hover:text-brand-gold-400 hover:pl-2 transition-all flex items-center gap-2"><ArrowRight size={14} /> {t('navbar.events')}</Link></li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-6">
                        <h3 className="text-xl font-display font-bold text-white">{t('footer.contact_info')}</h3>
                        <ul className="space-y-4">
                            <li><Link to="/contact" className="text-brand-navy-300 hover:text-brand-gold-400 hover:pl-2 transition-all flex items-center gap-2"><ArrowRight size={14} /> {t('navbar.contact')}</Link></li>
                            <li className="text-brand-navy-300 flex items-center gap-2"><ArrowRight size={14} /> Student Portal</li>
                            <li className="text-brand-navy-300 flex items-center gap-2"><ArrowRight size={14} /> Parent Portal</li>
                            <li className="text-brand-navy-300 flex items-center gap-2"><ArrowRight size={14} /> Careers</li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-6">
                        <h3 className="text-xl font-display font-bold text-white">Join Us</h3>
                        <p className="text-brand-navy-300 text-sm">Admissions open for the new academic year. Enroll your child today.</p>
                        <Link to="/admissions" className="bg-brand-crimson-600 text-white text-center py-3 px-6 rounded-xl font-bold block hover:bg-brand-crimson-700 transition-colors">
                            Enroll Now →
                        </Link>
                        <a href="tel:+917050421421" className="text-brand-navy-300 hover:text-white transition-colors font-medium text-center">
                            📞 +91 70504 21421
                        </a>
                    </div>
                </div>

                <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-brand-navy-400 text-sm">
                    <p>&copy; {new Date().getFullYear()} Narendra Edu Valley. {t('footer.rights_reserved')}</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
