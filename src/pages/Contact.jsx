import { Mail, MapPin, Phone, Send, Clock, Facebook, Instagram, Youtube, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { API_ENDPOINTS } from '../config/api'

const Contact = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    })

    useEffect(() => {
        const prefillSubject = searchParams.get('subject')
        if (prefillSubject) {
            setFormData((prev) => ({ ...prev, subject: prefillSubject }))
        }
    }, [searchParams])

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const [activeMap, setActiveMap] = useState('old')
    const maps = {
        old: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1544.7578278065036!2d84.34110328906662!3d25.968779831934986!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399257002047970b%3A0xe5a3632cb63e120d!2sNarendra%20edu%20valley!5e1!3m2!1sen!2sin!4v1738153494791!5m2!1sen!2sin",
        new: "" // TODO: paste new campus Google Maps embed URL here
    }

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [submitError, setSubmitError] = useState(false)
    const [errors, setErrors] = useState({})

    const validate = () => {
        const newErrors = {}
        if (!formData.name.trim()) newErrors.name = 'Name is required'
        if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email required'
        if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = 'Enter valid 10-digit mobile number'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        setIsSubmitting(true)
        setSubmitError(false)
        try {
            const response = await fetch(API_ENDPOINTS.contacts, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
            if (response.ok) {
                setSubmitSuccess(true)
                setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
                setTimeout(() => navigate('/thank-you'), 800)
            } else {
                setSubmitError(true)
            }
        } catch {
            setSubmitError(true)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-white">
            {/* Header Section */}
            <section className="relative pt-16 pb-14 lg:pt-40 lg:pb-32 overflow-hidden bg-brand-navy-950 text-white">
                <div className="absolute top-0 right-0 w-full lg:w-1/3 h-full bg-brand-gold-400/5 skew-x-[-10deg] translate-x-20 hidden lg:block"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl">
                        <span className="inline-block px-4 py-2 rounded-full bg-brand-gold-500/20 border border-brand-gold-400/30 text-brand-gold-300 text-sm font-bold tracking-widest uppercase mb-6 md:mb-8">{t('contact.header_label')}</span>
                        <h1 className="text-3xl md:text-5xl lg:text-7xl font-black mb-6 md:mb-8 leading-[1.1] tracking-tight">
                            {t('contact.header_title')}
                        </h1>
                        <p className="text-lg md:text-xl text-brand-navy-200 max-w-2xl font-medium leading-relaxed">
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
                                <h2 className="text-3xl md:text-4xl font-extrabold text-brand-navy-900 mb-6 md:mb-8">{t('contact.get_in_touch')}</h2>
                                <p className="text-lg text-brand-navy-400 font-medium leading-relaxed">{t('contact.touch_subtitle')}</p>
                            </div>

                            <div className="space-y-8 md:space-y-10">
                                <div className="flex items-start gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-navy-50 flex items-center justify-center text-brand-navy-600 group-hover:bg-brand-navy-600 group-hover:text-white transition-all duration-300 shadow-sm flex-shrink-0">
                                        <MapPin size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-brand-navy-900 mb-3">{t('contact.campuses')}</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="font-bold text-brand-crimson-600 text-sm uppercase tracking-wider mb-1">Old Campus</p>
                                                <p className="text-brand-navy-500 font-medium">Naya Gao Chainpur Siswan, Siwan, Bihar 841203</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-brand-crimson-600 text-sm uppercase tracking-wider mb-1">New Campus</p>
                                                <p className="text-brand-navy-500 font-medium">Chainpur Rasulpur Road, Banger Be Bari</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-navy-50 flex items-center justify-center text-brand-navy-600 group-hover:bg-brand-navy-600 group-hover:text-white transition-all duration-300 shadow-sm flex-shrink-0">
                                        <Phone size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-brand-navy-900 mb-3">{t('contact.call_us')}</h4>
                                        <div className="space-y-1">
                                            <p className="text-xl font-bold text-brand-navy-700">+91 70504 21421</p>
                                            <p className="text-brand-navy-400 font-medium">Mon - Sat, 8AM - 4PM</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-gold-50 flex items-center justify-center text-brand-gold-600 group-hover:bg-brand-gold-600 group-hover:text-white transition-all duration-300 shadow-sm flex-shrink-0">
                                        <Mail size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-brand-navy-900 mb-3">{t('contact.email_us')}</h4>
                                        <div className="space-y-1">
                                            <p className="text-xl font-bold text-brand-navy-700">narendra.eduvalley@gmail.com</p>
                                            <p className="text-brand-navy-400 font-medium">Response within 24 hours</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-crimson-50 flex items-center justify-center text-brand-crimson-600 group-hover:bg-brand-crimson-600 group-hover:text-white transition-all duration-300 shadow-sm flex-shrink-0">
                                        <Clock size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-brand-navy-900 mb-3">{t('contact.timings')}</h4>
                                        <div className="space-y-1">
                                            <p className="text-brand-navy-700 font-medium">Morning: 8:00 AM - 1:30 PM</p>
                                            <p className="text-brand-navy-700 font-medium">Office: 8:00 AM - 4:00 PM</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-brand-navy-100/50">
                                <h4 className="text-sm font-bold text-brand-navy-300 uppercase tracking-widest mb-6">Social Networks</h4>
                                <div className="flex gap-4">
                                    <a href="https://www.facebook.com/nevalley?rdid=EcL20dwNcYIwSLCq&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1J5oCqFxVe%2F#" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-brand-navy-50 flex items-center justify-center text-brand-navy-400 hover:bg-brand-navy-600 hover:text-white transition-all"><Facebook size={20} /></a>
                                    <a href="https://www.instagram.com/p/DMmqb9Vib70/?igsh=OTRvNHhseXA4NXF5" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-brand-navy-50 flex items-center justify-center text-brand-navy-400 hover:bg-brand-crimson-600 hover:text-white transition-all"><Instagram size={20} /></a>
                                    <a href="https://youtube.com/@narendraeduvalley5232?si=WNFFhpFRVT_Fh26S" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-brand-navy-50 flex items-center justify-center text-brand-navy-400 hover:bg-red-600 hover:text-white transition-all"><Youtube size={20} /></a>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-7">
                            <div className="bg-brand-cream p-8 md:p-12 lg:p-16 rounded-[3rem] shadow-sm border border-brand-navy-100/30">
                                <h3 className="text-2xl font-bold text-brand-navy-900 mb-8 md:mb-10">{t('contact.send_message')}</h3>
                                <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                        <div className="space-y-2">
                                            <label htmlFor="contact-name" className="text-sm font-bold text-brand-navy-700 ml-4">{t('contact.form_name')}</label>
                                            <input
                                                id="contact-name"
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className={`w-full px-6 py-4 rounded-2xl bg-white border focus:outline-none focus:ring-4 focus:ring-brand-navy-500/10 focus:border-brand-navy-500 transition-all font-medium ${errors.name ? 'border-brand-crimson-400' : 'border-brand-navy-200/50'}`}
                                                placeholder="Your Name"
                                            />
                                            {errors.name && <p className="text-brand-crimson-600 text-sm mt-1 ml-4">{errors.name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="contact-email" className="text-sm font-bold text-brand-navy-700 ml-4">{t('contact.form_email')}</label>
                                            <input
                                                id="contact-email"
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className={`w-full px-6 py-4 rounded-2xl bg-white border focus:outline-none focus:ring-4 focus:ring-brand-navy-500/10 focus:border-brand-navy-500 transition-all font-medium ${errors.email ? 'border-brand-crimson-400' : 'border-brand-navy-200/50'}`}
                                                placeholder="Your Email"
                                            />
                                            {errors.email && <p className="text-brand-crimson-600 text-sm mt-1 ml-4">{errors.email}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                        <div className="space-y-2">
                                            <label htmlFor="contact-phone" className="text-sm font-bold text-brand-navy-700 ml-4">{t('contact.form_phone')}</label>
                                            <input
                                                id="contact-phone"
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className={`w-full px-6 py-4 rounded-2xl bg-white border focus:outline-none focus:ring-4 focus:ring-brand-navy-500/10 focus:border-brand-navy-500 transition-all font-medium ${errors.phone ? 'border-brand-crimson-400' : 'border-brand-navy-200/50'}`}
                                                placeholder="Your Phone Number"
                                            />
                                            {errors.phone && <p className="text-brand-crimson-600 text-sm mt-1 ml-4">{errors.phone}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="contact-subject" className="text-sm font-bold text-brand-navy-700 ml-4">{t('contact.form_subject')}</label>
                                            <input
                                                id="contact-subject"
                                                type="text"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-6 py-4 rounded-2xl bg-white border border-brand-navy-200/50 focus:outline-none focus:ring-4 focus:ring-brand-navy-500/10 focus:border-brand-navy-500 transition-all font-medium"
                                                placeholder="Admission Inquiry"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="contact-message" className="text-sm font-bold text-brand-navy-700 ml-4">{t('contact.form_message')}</label>
                                        <textarea
                                            id="contact-message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows="6"
                                            className="w-full px-6 py-4 rounded-2xl bg-white border border-brand-navy-200/50 focus:outline-none focus:ring-4 focus:ring-brand-navy-500/10 focus:border-brand-navy-500 transition-all font-medium resize-none"
                                            placeholder="Write your message here..."
                                        ></textarea>
                                    </div>
                                    {submitSuccess && (
                                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                                            <CheckCircle size={20} />
                                            {t('contact.success_msg')}
                                        </div>
                                    )}
                                    {submitError && (
                                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-brand-crimson-50 border border-brand-crimson-200 text-brand-crimson-700 font-bold">
                                            Failed to send message. Please try again or call us at +91 70504 21421.
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex items-center justify-center gap-3 bg-brand-crimson-600 text-white font-black text-lg px-10 py-5 rounded-2xl hover:bg-brand-crimson-700 transition-all shadow-xl hover:shadow-brand-crimson-500/20 group w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? t('contact.form_sending', { defaultValue: 'Sending...' }) : t('contact.form_btn')}
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
                    <div className="flex gap-3 mb-6">
                        {['old', 'new'].map(campus => (
                            <button key={campus} onClick={() => setActiveMap(campus)}
                                className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeMap === campus ? 'bg-brand-navy-900 text-white' : 'bg-brand-navy-100 text-brand-navy-600 hover:bg-brand-navy-200'}`}>
                                {campus === 'old' ? 'Old Campus' : 'New Campus'}
                            </button>
                        ))}
                    </div>
                    <div className="h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-brand-cream-dark">
                        {maps[activeMap] ? (
                            <iframe
                                key={activeMap}
                                src={maps[activeMap]}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title={`${activeMap === 'old' ? 'Old' : 'New'} Campus Location`}
                            ></iframe>
                        ) : (
                            <div className="w-full h-full bg-brand-navy-50 flex items-center justify-center text-brand-navy-400 font-medium">
                                New campus map coming soon
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Contact
