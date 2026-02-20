import { Mail, Phone, GraduationCap, Award, BookOpen, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { API_ENDPOINTS } from '../config/api'

const Faculty = () => {
    const { t } = useTranslation()
    const [faculty, setFaculty] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchFaculty()
    }, [])

    const fetchFaculty = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.faculty)
            const data = await response.json()
            setFaculty(data)
        } catch (error) {
            console.error('Error fetching faculty:', error)
            setFaculty([])
        } finally {
            setLoading(false)
        }
    }



    return (
        <div className="bg-white">
            {/* Header Section */}
            <section className="relative pt-16 pb-14 lg:pt-40 lg:pb-32 overflow-hidden bg-slate-950 text-white">
                <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full bg-blue-600/10 skew-x-[-15deg] translate-x-32 hidden lg:block"></div>
                <div className="container mx-auto px-4 relative z-10 text-center lg:text-left">
                    <div className="max-w-4xl">
                        <span className="inline-block px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-black tracking-[0.2em] uppercase backdrop-blur-md mb-8">{t('faculty.header_label')}</span>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
                            {t('faculty.header_title')}
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed max-w-2xl">
                            {t('faculty.header_subtitle')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Faculty Grid */}
            <section className="py-12 md:py-24 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">{t('faculty.meet_facilitators')}</h2>
                        <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">{t('faculty.facilitators_subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                        {faculty.map((member) => (
                            <div key={member.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 group">
                                <div className="h-80 overflow-hidden relative">
                                    <img 
                                        src={member.image_url || `https://i.pravatar.cc/400?u=${member.id}`} 
                                        alt={member.name} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <div className="p-8">
                                    <div className="mb-4">
                                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full uppercase tracking-wider mb-3">
                                            {member.position}
                                        </span>
                                        <h3 className="text-2xl font-black text-slate-900 mb-2">{member.name}</h3>
                                        <p className="text-slate-500 font-medium text-sm">{member.department}</p>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed mb-6 line-clamp-3">
                                        {member.bio}
                                    </p>
                                    <div className="flex gap-3 pt-6 border-t border-slate-100">
                                        <a 
                                            href={`mailto:${member.email}`} 
                                            className="flex-1 flex items-center justify-center gap-2 bg-slate-50 text-slate-700 py-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-bold text-sm"
                                        >
                                            <Mail size={16} />
                                            Email
                                        </a>
                                        {member.phone && (
                                            <a 
                                                href={`tel:${member.phone}`} 
                                                className="flex-1 flex items-center justify-center gap-2 bg-slate-50 text-slate-700 py-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-bold text-sm"
                                            >
                                                <Phone size={16} />
                                                Call
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Join Team CTA */}
            <section className="py-12 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[3rem] p-12 md:p-16 lg:p-20 text-center text-white relative overflow-hidden shadow-2xl max-w-5xl mx-auto">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
                        
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 md:mb-8 leading-tight">{t('faculty.join_title')}</h2>
                            <p className="text-xl text-blue-100 mb-8 md:mb-10 max-w-2xl mx-auto">{t('faculty.join_desc')}</p>
                            <a href="/contact" className="inline-flex items-center justify-center bg-white text-blue-700 font-bold text-lg px-8 py-4 rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                {t('faculty.apply_now')}
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Faculty
