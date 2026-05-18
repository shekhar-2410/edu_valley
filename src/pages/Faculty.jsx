import { Mail, Phone, User, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { API_ENDPOINTS } from '../config/api'
import SEO from '../components/SEO'
import { PAGE_META } from '../config/seo'

const Faculty = () => {
    const { t } = useTranslation()
    const [faculty, setFaculty] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [selectedDept, setSelectedDept] = useState('All')

    useEffect(() => {
        fetchFaculty()
    }, [])

    const fetchFaculty = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.faculty)
            if (!response.ok) {
                console.error(`Failed to fetch faculty: ${response.status}`)
                setError(true)
                setFaculty([])
                return
            }
            const data = await response.json()
            if (!Array.isArray(data)) {
                console.error('Expected array from /faculty endpoint, got:', data)
                setError(true)
                setFaculty([])
                return
            }
            setFaculty(data)
        } catch (error) {
            console.error('Network error fetching faculty:', error)
            setError(true)
            setFaculty([])
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <>
            <SEO {...PAGE_META.faculty} />
            <div className="bg-white">
                <section className="relative pt-16 pb-14 lg:pt-40 lg:pb-32 overflow-hidden bg-brand-navy-950">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl">
                            <div className="skeleton-dark h-8 w-40 mb-8 rounded-full"></div>
                            <div className="skeleton-dark h-16 w-3/4 mb-6"></div>
                            <div className="skeleton-dark h-6 w-1/2"></div>
                        </div>
                    </div>
                </section>
                <section className="py-12 md:py-24 bg-brand-cream-dark">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <div className="skeleton h-12 w-80 mx-auto mb-6"></div>
                            <div className="skeleton h-5 w-64 mx-auto"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-white rounded-[2.5rem] overflow-hidden border border-brand-navy-100/50">
                                    <div className="skeleton h-80 rounded-none"></div>
                                    <div className="p-8 space-y-3">
                                        <div className="skeleton h-6 w-24 rounded-full"></div>
                                        <div className="skeleton h-7 w-3/4"></div>
                                        <div className="skeleton h-4 w-1/2"></div>
                                        <div className="skeleton h-4 w-full"></div>
                                        <div className="skeleton h-4 w-5/6"></div>
                                        <div className="flex gap-3 pt-4">
                                            <div className="skeleton h-12 flex-1"></div>
                                            <div className="skeleton h-12 flex-1"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
            </>
        )
    }

    return (
        <>
            <SEO {...PAGE_META.faculty} />
            <div className="bg-white">
            {/* Header Section */}
            <section className="relative pt-16 pb-14 lg:pt-40 lg:pb-32 overflow-hidden bg-brand-navy-950 text-white">
                <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full bg-brand-crimson-600/5 skew-x-[-15deg] translate-x-32 hidden lg:block"></div>
                <div className="container mx-auto px-4 relative z-10 text-center lg:text-left">
                    <div className="max-w-4xl">
                        <span className="inline-block px-4 py-2 rounded-full bg-brand-gold-500/20 border border-brand-gold-400/30 text-brand-gold-300 text-sm font-black tracking-[0.2em] uppercase backdrop-blur-md mb-8">{t('faculty.header_label')}</span>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
                            {t('faculty.header_title')}
                        </h1>
                        <p className="text-lg md:text-xl text-brand-navy-200 font-medium leading-relaxed max-w-2xl">
                            {t('faculty.header_subtitle')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Faculty Grid */}
            <section className="py-12 md:py-24 bg-brand-cream-dark">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-brand-navy-900 mb-6">{t('faculty.meet_facilitators')}</h2>
                        <p className="text-lg text-brand-navy-400 font-medium max-w-2xl mx-auto">{t('faculty.facilitators_subtitle')}</p>
                    </div>

                    {faculty.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-3 mb-10">
                            {['All', ...[...new Set(faculty.map(f => f.department))].filter(Boolean).sort()].map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => setSelectedDept(dept)}
                                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all border ${selectedDept === dept ? 'bg-brand-navy-900 text-white border-brand-navy-900' : 'bg-white text-brand-navy-500 border-brand-navy-200 hover:border-brand-navy-400'}`}
                                >
                                    {dept}
                                </button>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-20 bg-brand-crimson-50 rounded-[3rem] border border-brand-crimson-100 mb-10">
                            <Users size={64} className="mx-auto text-brand-crimson-300 mb-6" />
                            <h3 className="text-2xl font-bold text-brand-navy-900 mb-2">{t('faculty.error_title', { defaultValue: 'Unable to load faculty' })}</h3>
                            <p className="text-brand-navy-400 mb-6">{t('faculty.error_desc', { defaultValue: 'Please check your connection and try again.' })}</p>
                            <button onClick={() => { setError(false); setLoading(true); fetchFaculty(); }} className="px-8 py-3 bg-brand-crimson-600 text-white font-bold rounded-xl hover:bg-brand-crimson-700 transition-colors">
                                {t('faculty.retry', { defaultValue: 'Retry' })}
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                        {faculty.filter(f => selectedDept === 'All' || f.department === selectedDept).map((member) => (
                            <div key={member.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-brand-navy-100/50 group">
                                <div className="h-80 overflow-hidden relative">
                                    {member.image_url ? (
                                        <img
                                            src={member.image_url}
                                            alt={member.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full w-full bg-brand-navy-100 text-brand-navy-400">
                                            <User size={48} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <div className="p-8">
                                    <div className="mb-4">
                                        <span className="inline-block px-3 py-1 bg-brand-navy-50 text-brand-navy-600 text-xs font-bold rounded-full uppercase tracking-wider mb-3">
                                            {member.position}
                                        </span>
                                        <h3 className="text-2xl font-black text-brand-navy-900 mb-2">{member.name}</h3>
                                        <p className="text-brand-navy-400 font-medium text-sm">{member.department}</p>
                                    </div>
                                    <p className="text-brand-navy-500 leading-relaxed mb-6 line-clamp-3">
                                        {member.bio}
                                    </p>
                                    <div className="flex gap-3 pt-6 border-t border-brand-navy-100/50">
                                        <a
                                            href={`mailto:${member.email}`}
                                            className="flex-1 flex items-center justify-center gap-2 bg-brand-navy-50 text-brand-navy-700 py-3 rounded-xl hover:bg-brand-navy-600 hover:text-white transition-all font-bold text-sm"
                                        >
                                            <Mail size={16} />
                                            Email
                                        </a>
                                        {member.phone && (
                                            <a
                                                href={`tel:${member.phone}`}
                                                className="flex-1 flex items-center justify-center gap-2 bg-brand-navy-50 text-brand-navy-700 py-3 rounded-xl hover:bg-brand-navy-600 hover:text-white transition-all font-bold text-sm"
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
                    <div className="bg-brand-navy-800 rounded-[3rem] p-12 md:p-16 lg:p-20 text-center text-white relative overflow-hidden shadow-2xl max-w-5xl mx-auto border-t-4 border-brand-gold-400">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold-400/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-crimson-600/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 md:mb-8 leading-tight">{t('faculty.join_title')}</h2>
                            <p className="text-xl text-brand-navy-200 mb-8 md:mb-10 max-w-2xl mx-auto">{t('faculty.join_desc')}</p>
                            <a href="/contact" className="inline-flex items-center justify-center bg-brand-crimson-600 text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-brand-crimson-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                {t('faculty.apply_now')}
                            </a>
                        </div>
                    </div>
                </div>
            </section>
            </div>
        </>
    )
}

export default Faculty
