import { Image as ImageIcon, ZoomIn, Filter } from 'lucide-react'
import { useEffect, useState } from 'react'
import { API_ENDPOINTS } from '../config/api'

const ImageRotator = ({ slotIndex, images }) => {
    // Determine which images this slot will rotate through
    // For a more varied look, each slot starts at a different offset
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
            {/* Fallback if no images */}
            {slotImages.length === 0 && (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <ImageIcon className="text-slate-700" size={32} />
                </div>
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-20"></div>
        </div>
    )
}

const Gallery = () => {
    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('All')

    useEffect(() => {
        fetchGallery()
    }, [])

    const fetchGallery = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.gallery)
            const data = await response.json()
            setImages(data)
        } catch (error) {
            console.error('Error fetching gallery:', error)
            setImages([]) // Rely on database, no hardcoded fallbacks
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
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="bg-white">
            {/* Header Section */}
            <section className="relative pt-16 pb-14 lg:pt-28 lg:pb-20 overflow-hidden bg-slate-50 text-slate-900 border-b border-slate-100">
                <div className="absolute top-0 left-0 w-full lg:w-1/2 h-full bg-slate-900 skew-x-[15deg] -translate-x-32 hidden lg:block"></div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-12">
                        <div className="lg:w-1/2 hidden lg:block">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div className="h-48 bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                                        <ImageRotator slotIndex={0} images={images} />
                                    </div>
                                    <div className="h-64 bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                                        <ImageRotator slotIndex={1} images={images} />
                                    </div>
                                </div>
                                <div className="space-y-6 pt-12">
                                    <div className="h-64 bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                                        <ImageRotator slotIndex={2} images={images} />
                                    </div>
                                    <div className="h-48 bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                                        <ImageRotator slotIndex={3} images={images} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-1/2 text-center lg:text-left">
                            <span className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-bold tracking-widest uppercase mb-6 md:mb-8">Visual Journey</span>
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 md:mb-8 leading-[1.1] tracking-tight text-white lg:text-slate-900">
                                Captured <br />
                                <span className="text-blue-600">Moments.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-300 lg:text-slate-500 max-w-2xl font-medium leading-relaxed">A window into life at Narendra Edu Valley. Explore our vibrant campus, events, and student achievements.</p>
                        </div>
                    </div>
                </div>
            </section>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes crossfade {
                    0%, 100% { opacity: 0; transform: scale(1.1); }
                    5%, 25% { opacity: 1; transform: scale(1); }
                    30% { opacity: 0; transform: scale(1); }
                }
                .rotator-img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    opacity: 0;
                    animation: crossfade 16s infinite;
                    transition: transform 0.5s ease-in-out;
                }
            `}} />

            {/* Gallery Section */}
            <section className="py-12 md:py-24 bg-white min-h-screen">
                <div className="container mx-auto px-4">
                    {/* Filters */}
                    <div className="flex flex-wrap justify-center gap-4 mb-8 md:mb-16">
                         <div className="inline-flex items-center p-1.5 bg-slate-100 rounded-full border border-slate-200">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                                        selectedCategory === category 
                                        ? 'bg-white text-blue-600 shadow-lg scale-105' 
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                                    }`}
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Gallery Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredImages.map((image) => (
                            <div key={image.id} className="group relative rounded-[2rem] overflow-hidden aspect-[4/3] bg-slate-100 shadow-lg cursor-pointer">
                                {image.image_url ? (
                                    <img 
                                        src={image.image_url} 
                                        alt={image.title} 
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <ImageIcon size={64} />
                                    </div>
                                )}
                                
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-8">
                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                                            {image.category}
                                        </span>
                                        <h3 className="text-2xl font-bold text-white mb-2">{image.title}</h3>
                                        <p className="text-slate-300 text-sm line-clamp-2">{image.description}</p>
                                    </div>
                                </div>
                                
                                {/* Zoom Icon */}
                                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transform translate-y--4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                                    <ZoomIn size={20} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredImages.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-[3rem]">
                            <ImageIcon size={64} className="mx-auto text-slate-300 mb-6" />
                            <h3 className="text-2xl font-bold text-slate-700 mb-2">No Images Found</h3>
                            <p className="text-slate-500">There are no images in this category yet.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

export default Gallery
