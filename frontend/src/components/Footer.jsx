import { Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const Footer = () => {
    const { t } = useTranslation()
    return (
        <footer className="bg-slate-900 text-white pt-24 pb-10 rounded-t-[3rem] mt-20">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    <div className="flex flex-col gap-6">
                        <Link to="/" className="flex items-center gap-4 group">
                            <img src="/images/logo.svg" alt="Narendra Edu Valley" className="h-20 md:h-24 w-auto transition-transform group-hover:scale-105" />
                            <div className="flex flex-col">
                                <span className="font-outfit text-2xl font-extrabold text-white">Narendra Edu Valley</span>
                                <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase">सा विद्या या विमुक्तये</span>
                            </div>
                        </Link>
                        <p className="text-slate-400 leading-relaxed">
                            {t('footer.about_desc')}
                        </p>
                        <div className="flex gap-4">
                            <a href="https://www.facebook.com/nevalley?rdid=EcL20dwNcYIwSLCq&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1J5oCqFxVe%2F#" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-blue-600 hover:-translate-y-1 transition-all"><Facebook size={20} /></a>
                            <a href="https://www.instagram.com/p/DMmqb9Vib70/?igsh=OTRvNHhseXA4NXF5" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-pink-600 hover:-translate-y-1 transition-all"><Instagram size={20} /></a>
                            <a href="https://youtube.com/@narendraeduvalley5232?si=WNFFhpFRVT_Fh26S" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-red-600 hover:-translate-y-1 transition-all"><Youtube size={20} /></a>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <h3 className="text-xl font-bold text-white">{t('footer.quick_links')}</h3>
                        <ul className="space-y-4">
                            <li><Link to="/about" className="text-slate-400 hover:text-blue-500 hover:pl-2 transition-all flex items-center gap-2"><ArrowRight size={14} /> {t('navbar.about')}</Link></li>
                            <li><Link to="/academics" className="text-slate-400 hover:text-blue-500 hover:pl-2 transition-all flex items-center gap-2"><ArrowRight size={14} /> {t('navbar.academics')}</Link></li>
                            <li><Link to="/admissions" className="text-slate-400 hover:text-blue-500 hover:pl-2 transition-all flex items-center gap-2"><ArrowRight size={14} /> {t('navbar.admissions')}</Link></li>
                            <li><Link to="/events" className="text-slate-400 hover:text-blue-500 hover:pl-2 transition-all flex items-center gap-2"><ArrowRight size={14} /> {t('navbar.events')}</Link></li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-6">
                        <h3 className="text-xl font-bold text-white">{t('footer.contact_info')}</h3>
                        <ul className="space-y-4">
                            <li><Link to="/contact" className="text-slate-400 hover:text-blue-500 hover:pl-2 transition-all flex items-center gap-2"><ArrowRight size={14} /> {t('navbar.contact')}</Link></li>
                            <li className="text-slate-400 flex items-center gap-2"><ArrowRight size={14} /> Student Portal</li>
                            <li className="text-slate-400 flex items-center gap-2"><ArrowRight size={14} /> Parent Portal</li>
                            <li className="text-slate-400 flex items-center gap-2"><ArrowRight size={14} /> Careers</li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-6">
                        <h3 className="text-xl font-bold text-white">{t('footer.newsletter_title')}</h3>
                        <p className="text-slate-400 text-sm">{t('footer.newsletter_desc')}</p>
                        <div className="flex gap-2">
                            <input type="email" placeholder="Email" className="bg-white/10 border-none rounded-xl px-4 py-2 w-full outline-none focus:ring-2 focus:ring-blue-500" />
                            <button className="bg-blue-600 px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors">{t('footer.sub_btn')}</button>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Narendra Edu Valley. {t('footer.rights_reserved')}</p>
                    <div className="flex gap-8">
                        <Link to="/" className="hover:text-blue-500 transition-colors">Privacy Policy</Link>
                        <Link to="/" className="hover:text-blue-500 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
