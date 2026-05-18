import { Link } from 'react-router-dom'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { CONTACT } from '../config/contact'

const ThankYou = () => {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-20 bg-brand-cream">
            <div className="max-w-xl mx-auto text-center">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 text-green-600 mb-8">
                    <CheckCircle size={48} strokeWidth={2.5} />
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-brand-navy-900 mb-4">
                    Thank You
                </h1>
                <p className="text-lg text-brand-navy-600 mb-8 leading-relaxed">
                    We've received your message and will get back to you within 24 hours. For urgent enquiries, please call <a href={`tel:${CONTACT.phoneTel}`} className="text-brand-navy-700 font-semibold underline">{CONTACT.phoneFormatted}</a>.
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-navy-700 text-white font-semibold hover:bg-brand-navy-800 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Home
                </Link>
            </div>
        </div>
    )
}

export default ThankYou
