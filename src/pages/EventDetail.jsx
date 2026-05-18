import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin } from 'lucide-react'
import { API_ENDPOINTS } from '../config/api'

const EventDetail = () => {
    const { id } = useParams()
    const [event, setEvent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await fetch(API_ENDPOINTS.eventById(id))
                if (!response.ok) {
                    setError(true)
                    return
                }
                const data = await response.json()
                setEvent(data)
            } catch {
                setError(true)
            } finally {
                setLoading(false)
            }
        }
        fetchEvent()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="skeleton h-32 w-full max-w-xl rounded-3xl" />
            </div>
        )
    }

    if (error || !event) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4 py-20 bg-brand-cream">
                <div className="max-w-xl mx-auto text-center">
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-brand-navy-900 mb-4">
                        Event Not Found
                    </h1>
                    <p className="text-brand-navy-600 mb-8">
                        The event you're looking for may have been removed or never existed.
                    </p>
                    <Link
                        to="/events"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-navy-700 text-white font-semibold hover:bg-brand-navy-800 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Events
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-brand-cream py-12 md:py-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link
                    to="/events"
                    className="inline-flex items-center gap-2 text-brand-navy-700 font-semibold mb-6 hover:gap-3 transition-all"
                >
                    <ArrowLeft size={18} />
                    All events
                </Link>
                {event.image_url && (
                    <div className="rounded-3xl overflow-hidden mb-8 shadow-xl aspect-[16/9] bg-brand-navy-100">
                        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                )}
                <h1 className="font-display text-3xl md:text-5xl font-bold text-brand-navy-900 mb-4">
                    {event.title}
                </h1>
                <div className="flex flex-wrap gap-4 mb-8 text-brand-navy-600">
                    <span className="inline-flex items-center gap-2">
                        <Calendar size={18} />
                        {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { dateStyle: 'full' })}
                    </span>
                    {event.location && (
                        <span className="inline-flex items-center gap-2">
                            <MapPin size={18} />
                            {event.location}
                        </span>
                    )}
                </div>
                <div className="prose prose-lg max-w-none text-brand-navy-700 whitespace-pre-line leading-relaxed">
                    {event.description}
                </div>
            </div>
        </div>
    )
}

export default EventDetail
