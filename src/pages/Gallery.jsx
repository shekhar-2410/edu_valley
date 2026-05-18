import { Image as ImageIcon, ZoomIn, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { API_ENDPOINTS } from '../config/api'

const ImageRotator = ({ slotIndex, images }) => {
    const slotImages = []
    if (images.length > 0) {
        for (let i = 0; i < 4; i++) {
            const imgIndex = (slotIndex + i * 2) % images.length
            slotImages.push(images[imgIndex])
        }
    }

    return (
        <div className="w-full h-full relative">
            {slotImages.map((img, i) => (
                <img
                    key={`${slotIndex}-${i}`}
                    src={img.image_url}
                    alt=""
                    className="rotator-img"
                    style={{ animationDelay: `${i * 4}s` }}
                />
            ))}
            {slotImages.length === 0 && (
                <div className="w-full h-full bg-brand-navy-800 flex items-center justify-center">
                    <ImageIcon className="text-brand-navy-600" size={32} />
                </div>
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-20"></div>
        </div>
    )
}

const Gallery = () => {
    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [lightbox, setLightbox] = useState(null)

    useEffect(() => {
        fetchGallery()
    }, [])

    const fetchGallery = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.gallery)
            if (!response.ok) {
                console.error(`Failed to fetch gallery: ${response.status}`)
                setError(true)
                setImages([])
                return
            }
            const data = await response.json()
            if (!Array.isArray(data)) {
                console.error('Expected array from /gallery endpoint, got:', data)
                setError(true)
                setImages([])
                return
            }
            setImages(data)
        } catch (error) {
            console.error('Network error fetching gallery:', error)
            setError(true)
            setImages([])
        } finally {
            setLoading(false)
        }
    }

    const categories = ['All', ...[...new Set(images.map(img => img.category))].sort()]

    const filteredImages = selectedCategory === 'All'
        ? images
        : images.filter(img => img.category === selectedCategory)

    if (loading) {
        return (
            <div className="bg-white">
                <section className="relative pt-16 pb-14 lg:pt-28 lg:pb-20 bg-brand-navy-950">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col lg:flex-row items-center gap-12">
                            <div className="lg:w-1/2 hidden lg:block">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div className="skeleton-dark h-48 rounded-[2.5rem]"></div>
                                        <div className="skeleton-dark h-64 rounded-[2.5rem]"></div>
                                    </div>
                                    <div className="space-y-6 pt-12">
                                        <div className="skeleton-dark h-64 rounded-[2.5rem]"></div>
                                        <div className="skeleton-dark h-48 rounded-[2.5rem]"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:w-1/2 text-center lg:text-left">
                                <div className="skeleton-dark h-8 w-40 mb-8 rounded-full"></div>
                                <div className="skeleton-dark h-14 w-3/4 mb-6"></div>
                                <div className="skeleton-dark h-6 w-full"></div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="py-12 md:py-24">
                    <div className="container mx-auto px-4">
                        <div className="flex justify-center mb-16">
                            <div className="skeleton h-14 w-96 rounded-full"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="skeleton aspect-[4/3] rounded-[2rem]"></div>
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
            <section className="relative pt-16 pb-14 lg:pt-28 lg:pb-20 overflow-hidden bg-brand-navy-950 text-white">
                <div className="absolute top-0 left-0 w-full lg:w-1/2 h-full bg-brand-navy-900 skew-x-[15deg] -translate-x-32 hidden lg:block"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-12">
                        <div className="lg:w-1/2 hidden lg:block">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div className="h-48 bg-brand-navy-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                                        <ImageRotator slotIndex={0} images={images} />
                                    </div>
                                    <div className="h-64 bg-brand-navy-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                                        <ImageRotator slotIndex={1} images={images} />
                                    </div>
                                </div>
                                <div className="space-y-6 pt-12">
                                    <div className="h-64 bg-brand-navy-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                                        <ImageRotator slotIndex={2} images={images} />
                                    </div>
                                    <div className="h-48 bg-brand-navy-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                                        <ImageRotator slotIndex={3} images={images} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-1/2 text-center lg:text-left">
                            <span className="inline-block px-4 py-2 rounded-full bg-brand-gold-50 text-brand-gold-700 text-sm font-bold tracking-widest uppercase mb-6 md:mb-8">Visual Journey</span>
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 md:mb-8 leading-[1.1] tracking-tight text-white">
                                Captured <br />
                                <span className="text-brand-crimson-600">Moments.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-brand-navy-200 max-w-2xl font-medium leading-relaxed">A window into life at Narendra Edu Valley. Explore our vibrant campus, events, and student achievements.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section className="py-12 md:py-24 bg-white min-h-screen">
                <div className="container mx-auto px-4">
                    {/* Filters */}
                    <div className="flex flex-wrap justify-center gap-3 mb-8 md:mb-16">
                        {categories.map((category) => (
                            <button
                                key={category}
                                className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 border ${
                                    selectedCategory === category
                                    ? 'bg-brand-crimson-600 text-white border-brand-crimson-600 shadow-lg'
                                    : 'bg-white text-brand-navy-500 border-brand-navy-200 hover:border-brand-navy-400'
                                }`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Gallery Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredImages.map((image) => (
                            <div key={image.id} onClick={() => setLightbox(image)} className="group relative rounded-[2rem] overflow-hidden aspect-[4/3] bg-brand-navy-50 shadow-lg cursor-pointer">
                                {image.image_url ? (
                                    <img
                                        src={image.image_url}
                                        alt={image.title}
                                        loading="lazy"
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-brand-navy-200">
                                        <ImageIcon size={64} />
                                    </div>
                                )}

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-900/90 via-brand-navy-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-8">
                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <span className="inline-block px-3 py-1 bg-brand-crimson-600 text-white text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                                            {image.category}
                                        </span>
                                        <h3 className="text-2xl font-bold text-white mb-2">{image.title}</h3>
                                        <p className="text-brand-navy-200 text-sm line-clamp-2">{image.description}</p>
                                    </div>
                                </div>

                                {/* Zoom Icon */}
                                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-3 rounded-full text-white opacity-0 group-hover:opacity-100 -translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                                    <ZoomIn size={20} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="text-center py-20 bg-brand-crimson-50 rounded-[3rem] border border-brand-crimson-100">
                            <ImageIcon size={64} className="mx-auto text-brand-crimson-300 mb-6" />
                            <h3 className="text-2xl font-bold text-brand-navy-900 mb-2">Unable to load gallery</h3>
                            <p className="text-brand-navy-400 mb-6">Please check your connection and try again.</p>
                            <button onClick={() => { setError(false); setLoading(true); fetchGallery(); }} className="px-8 py-3 bg-brand-crimson-600 text-white font-bold rounded-xl hover:bg-brand-crimson-700 transition-colors">
                                Retry
                            </button>
                        </div>
                    )}

                    {lightbox && (
                        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
                            <button onClick={() => setLightbox(null)} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
                                <X size={32} />
                            </button>
                            <img
                                src={lightbox.image_url}
                                alt={lightbox.title}
                                className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            />
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-white">
                                <h3 className="text-xl font-bold mb-1">{lightbox.title}</h3>
                                <span className="text-white/60 text-sm uppercase tracking-wider">{lightbox.category}</span>
                            </div>
                        </div>
                    )}

                    {!error && filteredImages.length === 0 && (
                        <div className="text-center py-20 bg-brand-cream rounded-[3rem]">
                            <ImageIcon size={64} className="mx-auto text-brand-navy-200 mb-6" />
                            <h3 className="text-2xl font-bold text-brand-navy-700 mb-2">No Images Found</h3>
                            <p className="text-brand-navy-400">There are no images in this category yet.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

export default Gallery
