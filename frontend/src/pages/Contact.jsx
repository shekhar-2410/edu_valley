import { Mail, MapPin, Phone, Send, Clock, Facebook, Instagram, Youtube } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const Contact = () => {
    const { t } = useTranslation()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log('Form submitted:', formData)
        alert(t('contact.success_msg'))
    }

    return (
        <div className="bg-white">
            {/* Header Section */}
            <section className="relative pt-16 pb-14 lg:pt-40 lg:pb-32 overflow-hidden bg-slate-50 text-slate-900">
                <div className="absolute top-0 right-0 w-full lg:w-1/3 h-full bg-blue-600/5 skew-x-[-10deg] translate-x-20 hidden lg:block"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl">
                        <span className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-bold tracking-widest uppercase mb-6 md:mb-8">{t('contact.header_label')}</span>
                        <h1 className="text-3xl md:text-5xl lg:text-7xl font-black mb-6 md:mb-8 leading-[1.1] tracking-tight">
                            {t('contact.header_title')}
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 max-w-2xl font-medium leading-relaxed">
                            {t('contact.header_subtitle')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Contact Section */}
            <section className="py-12 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20">
                        {/* Contact Info */}
                        <div className="lg:col-span-5 space-y-12 md:space-y-16">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 md:mb-8">{t('contact.get_in_touch')}</h2>
                                <p className="text-lg text-slate-500 font-medium leading-relaxed">{t('contact.touch_subtitle')}</p>
                            </div>

                            <div className="space-y-8 md:space-y-10">
                                <div className="flex items-start gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm flex-shrink-0">
                                        <MapPin size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-900 mb-3">{t('contact.campuses')}</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="font-bold text-blue-600 text-sm uppercase tracking-wider mb-1">Old Campus</p>
                                                <p className="text-slate-600 font-medium">Naya Gao Chainpur Siswan, Siwan, Bihar 841203</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-blue-600 text-sm uppercase tracking-wider mb-1">New Campus</p>
                                                <p className="text-slate-600 font-medium">Chainpur Rasulpur Road, Banger Be Bari</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm flex-shrink-0">
                                        <Phone size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-900 mb-3">{t('contact.call_us')}</h4>
                                        <div className="space-y-1">
                                            <p className="text-xl font-bold text-slate-700">+91 70504 21421</p>
                                            <p className="text-slate-500 font-medium">Mon - Sat, 8AM - 4PM</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm flex-shrink-0">
                                        <Mail size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-900 mb-3">{t('contact.email_us')}</h4>
                                        <div className="space-y-1">
                                            <p className="text-xl font-bold text-slate-700">narendra.eduvalley@gmail.com</p>
                                            <p className="text-slate-500 font-medium">Response within 24 hours</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-sm flex-shrink-0">
                                        <Clock size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-900 mb-3">{t('contact.timings')}</h4>
                                        <div className="space-y-1">
                                            <p className="text-slate-700 font-medium">Morning: 8:00 AM - 1:30 PM</p>
                                            <p className="text-slate-700 font-medium">Office: 8:00 AM - 4:00 PM</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Social Networks</h4>
                                <div className="flex gap-4">
                                    <a href="https://www.facebook.com/nevalley?rdid=EcL20dwNcYIwSLCq&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1J5oCqFxVe%2F#" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all"><Facebook size={20} /></a>
                                    <a href="https://www.instagram.com/p/DMmqb9Vib70/?igsh=OTRvNHhseXA4NXF5" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-pink-600 hover:text-white transition-all"><Instagram size={20} /></a>
                                    <a href="https://youtube.com/@narendraeduvalley5232?si=WNFFhpFRVT_Fh26S" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-600 hover:text-white transition-all"><Youtube size={20} /></a>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-7">
                            <div className="bg-slate-50 p-8 md:p-12 lg:p-16 rounded-[3rem] shadow-sm border border-slate-100">
                                <h3 className="text-2xl font-bold text-slate-900 mb-8 md:mb-10">{t('contact.send_message')}</h3>
                                <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 ml-4">{t('contact.form_name')}</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 ml-4">{t('contact.form_email')}</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 ml-4">{t('contact.form_phone')}</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                                placeholder="+91 12345 67890"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 ml-4">{t('contact.form_subject')}</label>
                                            <input
                                                type="text"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                                placeholder="Admission Inquiry"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 ml-4">{t('contact.form_message')}</label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows="6"
                                            className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium resize-none"
                                            placeholder="Write your message here..."
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center gap-3 bg-blue-600 text-white font-black text-lg px-10 py-5 rounded-2xl hover:bg-slate-900 transition-all shadow-xl hover:shadow-blue-500/20 group w-full sm:w-auto"
                                    >
                                        {t('contact.form_btn')}
                                        <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="py-12 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-slate-50">
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1544.7578278065036!2d84.34110328906662!3d25.968779831934986!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399257002047970b%3A0xe5a3632cb63e120d!2sNarendra%20edu%20valley!5e1!3m2!1sen!2sin!4v1738153494791!5m2!1sen!2sin" 
                            width="100%" 
                            height="100%" 
                            style={{ border: 0 }} 
                            allowFullScreen="" 
                            loading="lazy" 
                            referrerPolicy="no-referrer-when-downgrade"
                            title="School Location"
                        ></iframe>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Contact
