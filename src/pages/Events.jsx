import { Calendar, MapPin, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'

const Events = () => {
    const { t, i18n } = useTranslation()
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState('all') // 'all' | 'upcoming' | 'past'

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.events)
            if (!response.ok) {
                console.error(`Failed to fetch events: ${response.status}`)
                setError(true)
                setEvents([])
                return
            }
            const data = await response.json()
            if (!Array.isArray(data)) {
                console.error('Expected array from /events endpoint, got:', data)
                setError(true)
                setEvents([])
                return
            }
            setEvents(data)
        } catch (error) {
            console.error('Network error fetching events:', error)
            setError(true)
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

    const searchedEvents = events.filter((e) => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
            e.title?.toLowerCase().includes(q) ||
            e.description?.toLowerCase().includes(q) ||
            e.location?.toLowerCase().includes(q)
        )
    })

    const upcomingEvents = searchedEvents.filter(event => isUpcoming(event.date))
    const pastEvents = searchedEvents.filter(event => !isUpcoming(event.date))

    const showUpcoming = filter === 'all' || filter === 'upcoming'
    const showPast = filter === 'all' || filter === 'past'

    if (loading) {
        return (
            <div className="bg-white">
                <section className="relative pt-16 pb-14 lg:pt-40 lg:pb-32 overflow-hidden bg-brand-navy-950">
                    <div className="container mx-auto px-4 text-center">
                        <div className="skeleton-dark h-8 w-40 mx-auto mb-8 rounded-full"></div>
                        <div className="skeleton-dark h-14 w-3/4 mx-auto mb-6"></div>
                        <div className="skeleton-dark h-6 w-1/2 mx-auto"></div>
                    </div>
                </section>
                <section className="py-12 md:py-24">
                    <div className="container mx-auto px-4">
                        <div className="skeleton h-10 w-64 mb-12"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="rounded-[2rem] overflow-hidden border border-brand-navy-100/50">
                                    <div className="skeleton h-56 rounded-none"></div>
                                    <div className="p-8 space-y-4">
                                        <div className="skeleton h-6 w-3/4"></div>
                                        <div className="skeleton h-4 w-1/2"></div>
                                        <div className="skeleton h-4 w-full"></div>
                                        <div className="skeleton h-4 w-5/6"></div>
                                        <div className="skeleton h-12 w-full mt-4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        )
    }

    return (
        <div className="bg-white">
            {/* Header Section */}
            <section className="relative pt-16 pb-14 lg:pt-40 lg:pb-32 overflow-hidden bg-brand-navy-950 text-white">
                <div className="absolute inset-0 bg-[url('/images/events-hero.jpg')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-brand-navy-600/10 backdrop-blur-[2px]"></div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="max-w-4xl mx-auto">
                        <span className="inline-block px-4 py-2 rounded-full bg-brand-gold-500/20 border border-brand-gold-400/30 text-brand-gold-300 text-sm font-bold tracking-widest uppercase backdrop-blur-md mb-8">{t('events.header_label')}</span>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-8 md:mb-10 leading-[1.1] tracking-tight">
                            {t('events.header_title')}
                        </h1>
                        <p className="text-lg md:text-xl text-brand-navy-200 font-medium leading-relaxed max-w-2xl mx-auto">
                            {t('events.header_subtitle')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Search + Filter */}
            <section className="pt-10 md:pt-16">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy-400" />
                            <input
                                type="search"
                                placeholder={t('events.search_placeholder', { defaultValue: 'Search events…' })}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-brand-navy-200 text-brand-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-navy-300"
                            />
                        </div>
                        <div className="inline-flex gap-2 rounded-xl bg-white border border-brand-navy-200 p-1 self-start md:self-auto">
                            {['all', 'upcoming', 'past'].map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                                        filter === f
                                            ? 'bg-brand-navy-700 text-white'
                                            : 'text-brand-navy-600 hover:bg-brand-navy-50'
                                    }`}
                                >
                                    {t(`events.filter_${f}`, { defaultValue: f })}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Upcoming Events */}
            <section className="py-12 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    {showUpcoming && upcomingEvents.length > 0 && (
                        <div className="mb-12 md:mb-24">
                             <div className="flex items-center justify-between mb-8 md:mb-12">
                                <h2 className="text-3xl lg:text-4xl font-extrabold text-brand-navy-900 border-l-8 border-brand-crimson-600 pl-6">{t('events.upcoming')}</h2>
                                <div className="hidden md:block w-1/3 h-px bg-brand-navy-100"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {upcomingEvents.map((event) => (
                                    <Link key={event.id} to={`/events/${event.id}`} className="group bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-brand-navy-100/50 flex flex-col h-full">
                                        <div className="relative h-56 overflow-hidden">
                                            {event.image_url ? (
                                                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full bg-brand-navy-50 flex items-center justify-center text-brand-navy-200">
                                                    <Calendar size={64} />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl text-center shadow-lg border border-white/50">
                                                <span className="block text-2xl font-black text-brand-navy-900">{formatDate(event.date, 'day')}</span>
                                                <span className="block text-xs font-bold text-brand-crimson-600 uppercase">{formatDate(event.date, 'month')}</span>
                                            </div>
                                        </div>
                                        <div className="p-8 flex flex-col flex-grow">
                                            <h3 className="text-xl font-bold text-brand-navy-900 mb-4 line-clamp-2 min-h-[3.5rem]">{translateDynamic(event.title, 'events')}</h3>

                                            <div className="space-y-3 mb-6">
                                                {event.location && (
                                                    <div className="flex items-start gap-3 text-brand-navy-400 text-sm font-medium">
                                                        <MapPin size={16} className="text-brand-navy-500 mt-0.5 flex-shrink-0" />
                                                        <span>{translateDynamic(event.location, 'events')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-brand-navy-500 text-sm leading-relaxed mb-6 line-clamp-3">{translateDynamic(event.description, 'events')}</p>

                                            <div className="mt-auto">
                                                <span className="block w-full text-center py-3 rounded-xl bg-brand-navy-50 text-brand-navy-600 font-bold group-hover:bg-brand-crimson-600 group-hover:text-white transition-all duration-300 text-sm">
                                                    {t('events.learn_more')}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {showPast && pastEvents.length > 0 && (
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-8 md:mb-12">
                                <h2 className="text-3xl lg:text-4xl font-extrabold text-brand-navy-300 border-l-8 border-brand-navy-300 pl-6">{t('events.past')}</h2>
                                <div className="hidden md:block w-1/3 h-px bg-brand-navy-100"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {pastEvents.map((event) => (
                                    <Link key={event.id} to={`/events/${event.id}`} className="group bg-white rounded-[2rem] overflow-hidden shadow-lg border border-brand-navy-100/50 flex flex-col h-full hover:shadow-xl transition-all duration-500 grayscale hover:grayscale-0">
                                        <div className="relative h-48 overflow-hidden">
                                            {event.image_url ? (
                                                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-brand-navy-50 flex items-center justify-center text-brand-navy-200">
                                                    <Calendar size={64} />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4 bg-brand-navy-50/90 backdrop-blur-sm px-4 py-2 rounded-xl text-center shadow-lg">
                                                <span className="block text-2xl font-black text-brand-navy-500">{formatDate(event.date, 'day')}</span>
                                                <span className="block text-xs font-bold text-brand-navy-400 uppercase">{formatDate(event.date, 'month')}</span>
                                            </div>
                                        </div>
                                        <div className="p-8 flex flex-col flex-grow">
                                            <h3 className="text-xl font-bold text-brand-navy-600 mb-2">{translateDynamic(event.title, 'events')}</h3>
                                            <p className="text-brand-navy-400 text-sm mb-2">{formatDate(event.date)}</p>
                                            {event.location && (
                                                <div className="flex items-start gap-2 text-brand-navy-300 text-xs font-medium mb-4">
                                                    <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                                                    <span>{translateDynamic(event.location, 'events')}</span>
                                                </div>
                                            )}
                                            <p className="text-brand-navy-400 text-sm leading-relaxed line-clamp-2">{translateDynamic(event.description, 'events')}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-20 bg-brand-crimson-50 rounded-[3rem] border border-brand-crimson-100">
                            <Calendar size={64} className="mx-auto text-brand-crimson-300 mb-6" />
                            <h3 className="text-2xl font-bold text-brand-navy-900 mb-2">{t('events.error_title', { defaultValue: 'Unable to load events' })}</h3>
                            <p className="text-brand-navy-400 mb-6">{t('events.error_desc', { defaultValue: 'Please check your connection and try again.' })}</p>
                            <button onClick={() => { setError(false); setLoading(true); fetchEvents(); }} className="px-8 py-3 bg-brand-crimson-600 text-white font-bold rounded-xl hover:bg-brand-crimson-700 transition-colors">
                                {t('events.retry', { defaultValue: 'Retry' })}
                            </button>
                        </div>
                    )}

                    {!error && events.length === 0 && (
                        <div className="text-center py-20 bg-brand-cream rounded-[3rem]">
                            <Calendar size={64} className="mx-auto text-brand-navy-200 mb-6" />
                            <h3 className="text-2xl font-bold text-brand-navy-900 mb-2">{t('events.no_events')}</h3>
                            <p className="text-brand-navy-400">{t('events.try_different')}</p>
                        </div>
                    )}

                    {!error && events.length > 0 && (
                        (!showUpcoming || upcomingEvents.length === 0) &&
                        (!showPast || pastEvents.length === 0)
                    ) && (
                        <div className="text-center py-20 bg-brand-cream rounded-[3rem]">
                            <Search size={48} className="mx-auto text-brand-navy-200 mb-6" />
                            <h3 className="text-2xl font-bold text-brand-navy-900 mb-2">{t('events.no_results_title', { defaultValue: 'No matching events' })}</h3>
                            <p className="text-brand-navy-400">{t('events.no_results_desc', { defaultValue: 'Try a different search term or filter.' })}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
                    <div className="bg-white rounded-[2.5rem] max-w-2xl w-full p-10 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedEvent(null)} className="absolute top-6 right-6 text-brand-navy-400 hover:text-brand-navy-900 transition-colors">
                            <X size={24} />
                        </button>
                        {selectedEvent.image_url && (
                            <img src={selectedEvent.image_url} alt={selectedEvent.title} className="w-full h-56 object-cover rounded-2xl mb-8" />
                        )}
                        <h2 className="text-3xl font-black text-brand-navy-900 mb-4">{translateDynamic(selectedEvent.title, 'events')}</h2>
                        <p className="text-brand-navy-500 leading-relaxed mb-6">{translateDynamic(selectedEvent.description, 'events')}</p>
                        <div className="flex items-center gap-6 text-brand-navy-400 text-sm font-medium">
                            <span className="flex items-center gap-2"><Calendar size={16} /> {formatDate(selectedEvent.date)}</span>
                            {selectedEvent.location && <span className="flex items-center gap-2"><MapPin size={16} /> {translateDynamic(selectedEvent.location, 'events')}</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* CTA Banner Section */}
            <section className="py-12 md:py-24 bg-brand-cream">
                <div className="container mx-auto px-4">
                    <div className="bg-gradient-to-br from-brand-navy-700 to-brand-navy-900 rounded-[3rem] p-12 lg:p-20 text-center text-white relative overflow-hidden shadow-2xl mx-auto max-w-5xl">
                        <div className="absolute inset-0 bg-[url('/images/events-hero.jpg')] bg-cover bg-center opacity-10"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold-400/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-crimson-600/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 md:mb-8 leading-tight">{t('events.calendar_title')}</h2>
                            <p className="text-xl text-brand-navy-200 mb-8 md:mb-10 max-w-2xl mx-auto">{t('events.calendar_desc')}</p>
                            <a href="/contact?subject=Event+Calendar+Updates" className="inline-flex items-center justify-center bg-brand-crimson-600 text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-brand-crimson-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                Get Event Updates
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Events
