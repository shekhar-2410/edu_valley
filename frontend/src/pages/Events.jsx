import { Calendar, MapPin, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { API_ENDPOINTS } from '../config/api'

const Events = () => {
    const { t, i18n } = useTranslation()
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.events)
            if (response.ok) {
                const data = await response.json()
                setEvents(data)
            } else {
                throw new Error('Failed to fetch')
            }
        } catch (error) {
            console.error('Error fetching events:', error)
            setEvents([])
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString, format = 'full') => {
        const date = new Date(dateString)
        if (format === 'day') return date.getDate()
        if (format === 'month') return date.toLocaleString(i18n.language === 'en' ? 'en-US' : 'hi-IN', { month: 'short' })
        
        const options = { year: 'numeric', month: 'long', day: 'numeric' }
        return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'hi-IN', options)
    }

    const isUpcoming = (dateString) => {
        return new Date(dateString) >= new Date()
    }

    const translateDynamic = (str, category) => {
        if (!str) return '';
        const key = `${category}.${str.toLowerCase().replace(/ /g, '_')}`;
        return t(key, { defaultValue: str });
    }

    const upcomingEvents = events.filter(event => isUpcoming(event.date))
    const pastEvents = events.filter(event => !isUpcoming(event.date))

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="bg-white">
            {/* Header Section */}
            <section className="relative pt-16 pb-14 lg:pt-40 lg:pb-32 overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[2px]"></div>
                
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="max-w-4xl mx-auto">
                        <span className="inline-block px-4 py-2 rounded-full bg-blue-600/30 border border-blue-400/40 text-blue-200 text-sm font-bold tracking-widest uppercase backdrop-blur-md mb-8">{t('events.header_label')}</span>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-8 md:mb-10 leading-[1.1] tracking-tight">
                            {t('events.header_title')}
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
                            {t('events.header_subtitle')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Upcoming Events */}
            <section className="py-12 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    {upcomingEvents.length > 0 && (
                        <div className="mb-12 md:mb-24">
                             <div className="flex items-center justify-between mb-8 md:mb-12">
                                <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 border-l-8 border-blue-600 pl-6">{t('events.upcoming')}</h2>
                                <div className="hidden md:block w-1/3 h-px bg-slate-200"></div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {upcomingEvents.map((event) => (
                                    <div key={event.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col h-full">
                                        <div className="relative h-56 overflow-hidden">
                                            {event.image_url ? (
                                                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-200">
                                                    <Calendar size={64} />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl text-center shadow-lg border border-white/50">
                                                <span className="block text-2xl font-black text-slate-900">{formatDate(event.date, 'day')}</span>
                                                <span className="block text-xs font-bold text-blue-600 uppercase">{formatDate(event.date, 'month')}</span>
                                            </div>
                                        </div>
                                        <div className="p-8 flex flex-col flex-grow">
                                            <h3 className="text-xl font-bold text-slate-900 mb-4 line-clamp-2 min-h-[3.5rem]">{translateDynamic(event.title, 'events')}</h3>
                                            
                                            <div className="space-y-3 mb-6">
                                                {event.location && (
                                                    <div className="flex items-start gap-3 text-slate-500 text-sm font-medium">
                                                        <MapPin size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                        <span>{translateDynamic(event.location, 'events')}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">{translateDynamic(event.description, 'events')}</p>
                                            
                                            <div className="mt-auto">
                                                <button className="w-full py-3 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-600 hover:text-white transition-all duration-300 text-sm">
                                                    {t('events.learn_more')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {pastEvents.length > 0 && (
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-8 md:mb-12">
                                <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 border-l-8 border-slate-400 pl-6 text-slate-400">{t('events.past')}</h2>
                                <div className="hidden md:block w-1/3 h-px bg-slate-200"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 grayscale hover:grayscale-0 transition-all duration-500">
                                {pastEvents.map((event) => (
                                    <div key={event.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-lg border border-slate-100 flex flex-col h-full hover:shadow-xl transition-shadow">
                                        <div className="relative h-48 overflow-hidden">
                                            {event.image_url ? (
                                                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                                    <Calendar size={64} />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4 bg-slate-100/90 backdrop-blur-sm px-4 py-2 rounded-xl text-center shadow-lg">
                                                <span className="block text-2xl font-black text-slate-600">{formatDate(event.date, 'day')}</span>
                                                <span className="block text-xs font-bold text-slate-500 uppercase">{formatDate(event.date, 'month')}</span>
                                            </div>
                                        </div>
                                        <div className="p-8 flex flex-col flex-grow">
                                            <h3 className="text-xl font-bold text-slate-700 mb-2">{translateDynamic(event.title, 'events')}</h3>
                                            <p className="text-slate-500 text-sm mb-2">{formatDate(event.date)}</p>
                                            {event.location && (
                                                <div className="flex items-start gap-2 text-slate-400 text-xs font-medium mb-4">
                                                    <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                                                    <span>{translateDynamic(event.location, 'events')}</span>
                                                </div>
                                            )}
                                            <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{translateDynamic(event.description, 'events')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {events.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-[3rem]">
                            <Calendar size={64} className="mx-auto text-slate-300 mb-6" />
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('events.no_events')}</h3>
                            <p className="text-slate-500">{t('events.try_different')}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Banner Section */}
            <section className="py-12 md:py-24 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[3rem] p-12 lg:p-20 text-center text-white relative overflow-hidden shadow-2xl mx-auto max-w-5xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
                        
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 md:mb-8 leading-tight">{t('events.calendar_title')}</h2>
                            <p className="text-xl text-blue-100 mb-8 md:mb-10 max-w-2xl mx-auto">{t('events.calendar_desc')}</p>
                            <a href="/contact" className="inline-flex items-center justify-center bg-white text-blue-700 font-bold text-lg px-8 py-4 rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                {t('events.sync_cal')}
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Events
