import { Bell, Calendar, Edit2, Image, LogOut, Plus, Trash2, User, X, Check, ChevronDown, BookOpen, School, UserPlus, ChevronRight, Loader2, CreditCard, Receipt, Printer } from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { toast } from 'react-toastify'
import { printReceiptPDF, printInvoicePDF, shareReceiptWhatsApp } from '../utils/pdfPrint'
 
// Premium Delete Action Component
const DeleteAction = ({ onDelete }) => {
    const [isConfirming, setIsConfirming] = useState(false)

    if (isConfirming) {
        return (
            <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-3 duration-300">
                <button 
                    type="button"
                    onClick={() => {
                        onDelete()
                        setIsConfirming(false)
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
                >
                    <Check size={12} /> Confirm
                </button>
                <button 
                    type="button"
                    onClick={() => setIsConfirming(false)}
                    className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        )
    }

    return (
        <button 
            type="button"
            className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
            onClick={(e) => {
                e.stopPropagation()
                setIsConfirming(true)
            }}
            title="Delete Item"
        >
            <Trash2 size={16} />
        </button>
    )
}

const Admin = () => {
    const [activeTab, setActiveTab] = useState('events')
    const [showAddForm, setShowAddForm] = useState(false)
    const navigate = useNavigate()

    const handleLogout = () => {
        localStorage.removeItem('adminAuthenticated')
        localStorage.removeItem('adminToken')
        navigate('/admin-login')
    }

    const getAuthHeaders = () => {
        const token = localStorage.getItem('adminToken')
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    }

    const tabs = [
        { id: 'events', label: 'Events', icon: <Calendar size={20} /> },
        { id: 'announcements', label: 'Announcements', icon: <Bell size={20} /> },
        { id: 'faculty', label: 'Faculty', icon: <User size={20} /> },
        { id: 'gallery', label: 'Gallery', icon: <Image size={20} /> },
        { id: 'erp', label: 'ERP', icon: <School size={20} /> },
    ]

    return (
        <div className="bg-brand-cream min-h-screen">
            {/* Header Section */}
            <section className="bg-white border-b border-slate-200">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="w-10 h-1 text-brand-navy-600 bg-brand-navy-600 rounded-full"></span>
                                <span className="text-xs font-black text-brand-navy-600 uppercase tracking-[0.3em]">Administrator</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">Dashboard</h1>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                                {activeTab !== 'erp' && (
                                <button
                                    className={`flex-1 md:flex-none inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-2xl shadow-lg transition-all active:scale-95 ${
                                        showAddForm
                                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        : 'bg-brand-navy-600 text-white hover:bg-brand-navy-700 shadow-brand-navy-600/20'
                                    }`}
                                    onClick={() => setShowAddForm(!showAddForm)}
                                >
                                    {showAddForm ? 'Hide Form' : `Add ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                                </button>
                                )}
                            <button 
                                className="inline-flex items-center justify-center p-4 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all active:scale-95" 
                                onClick={handleLogout}
                                title="Sign Out"
                            >
                                <LogOut size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-12">
                <div className="container mx-auto px-4">
                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 mb-10 bg-slate-200/50 p-2 rounded-2xl w-fit">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-white text-brand-navy-600 shadow-sm' 
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                                }`}
                                onClick={() => {
                                    setActiveTab(tab.id)
                                    setShowAddForm(false)
                                }}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Panel */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                        <div className="p-8 lg:p-12">
                            {activeTab === 'events' && <EventsManager showForm={showAddForm} setShowForm={setShowAddForm} getAuthHeaders={getAuthHeaders} />}
                            {activeTab === 'announcements' && <AnnouncementsManager showForm={showAddForm} setShowForm={setShowAddForm} getAuthHeaders={getAuthHeaders} />}
                            {activeTab === 'faculty' && <FacultyManager showForm={showAddForm} setShowForm={setShowAddForm} getAuthHeaders={getAuthHeaders} />}
                            {activeTab === 'gallery' && <GalleryManager showForm={showAddForm} setShowForm={setShowAddForm} getAuthHeaders={getAuthHeaders} />}
                            {activeTab === 'erp' && <ERPManager getAuthHeaders={getAuthHeaders} />}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

// Image Picker Component
const ImagePicker = ({ onSelect, onClose }) => {
    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    React.useEffect(() => {
        fetchImages()
    }, [])

    const fetchImages = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.gallery)
            const data = await response.json()
            setImages(data)
        } catch (error) {
            toast.error('Failed to load gallery')
        } finally {
            setLoading(false)
        }
    }

    const filteredImages = images.filter(img => 
        img.title?.toLowerCase().includes(search.toLowerCase()) || 
        img.category?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl max-h-[80vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Select Image</h3>
                        <p className="text-slate-500 text-sm">Choose from existing gallery images</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>
                
                <div className="p-4 bg-brand-cream border-b border-slate-100">
                    <input
                        type="text"
                        placeholder="Search by title or category..."
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy-600"></div>
                        </div>
                    ) : filteredImages.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Image size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No images found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredImages.map((img) => (
                                <button
                                    key={img.id}
                                    onClick={() => onSelect(img.image_url)}
                                    className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border-2 border-transparent hover:border-brand-navy-500 transition-all focus:outline-none focus:ring-4 focus:ring-brand-navy-500/20"
                                >
                                    <img 
                                        src={img.image_url} 
                                        alt={img.title} 
                                        className="w-full h-full object-cover" 
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-xs font-bold truncate">{img.title}</p>
                                        <p className="text-slate-300 text-[10px] truncate">{img.category}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Events Manager Component
const EventsManager = ({ showForm, setShowForm, getAuthHeaders }) => {
    const [events, setEvents] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [showImagePicker, setShowImagePicker] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        image_url: ''
    })

    React.useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.events)
            const data = await response.json()
            setEvents(data)
        } catch (error) {
            toast.error('Failed to fetch events')
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setIsUploading(true)
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)

        try {
            const response = await fetch(API_ENDPOINTS.upload, {
                method: 'POST',
                body: uploadFormData
            })

            if (response.ok) {
                const data = await response.json()
                setFormData(prev => ({ ...prev, image_url: data.url }))
                toast.success('Event image uploaded')
            } else {
                toast.error('Upload failed')
            }
        } catch (error) {
            toast.error('Upload connection error')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const url = editingId ? `${API_ENDPOINTS.events}/${editingId}` : API_ENDPOINTS.events
            const method = editingId ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                toast.success(`Event ${editingId ? 'updated' : 'added'} successfully`)
                fetchEvents()
                resetForm()
            } else {
                toast.error('Operation failed. Please check your inputs.')
            }
        } catch (error) {
            toast.error('Connection error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = (event) => {
        setFormData({
            title: event.title,
            description: event.description,
            date: event.date,
            location: event.location || '',
            image_url: event.image_url || ''
        })
        setEditingId(event.id)
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`${API_ENDPOINTS.events}/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            if (response.ok) {
                toast.success('Event deleted successfully')
                fetchEvents()
            } else {
                const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
                toast.error(`Failed to delete event: ${error.detail || response.statusText}`)
            }
        } catch (error) {
            toast.error('Connection error: ' + error.message)
        }
    }

    const resetForm = () => {
        setFormData({ title: '', description: '', date: '', location: '', image_url: '' })
        setEditingId(null)
        setShowForm(false)
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {showForm && (
                <div className="bg-brand-cream p-6 md:p-8 rounded-3xl border border-slate-200 shadow-inner">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                            {editingId ? 'Edit Event' : 'Create New Event'}
                        </h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <Plus size={24} className="rotate-45" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Event Title</label>
                                <input
                                    type="text"
                                    placeholder="Enter event name..."
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 outline-none focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-500/10 transition-all"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Event Description</label>
                                <textarea
                                    placeholder="Describe the event details..."
                                    rows={4}
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 outline-none focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-500/10 transition-all resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 outline-none focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-500/10 transition-all"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Location</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Auditorium OR Auditorium https://maps..."
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 outline-none focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-500/10 transition-all"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                                <p className="mt-1 text-[10px] text-slate-400 font-medium italic">Tip: Use a space to separate name and URL</p>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Image</label>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="https://..."
                                            className="flex-1 bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 outline-none focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-500/10 transition-all"
                                            value={formData.image_url}
                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        />
                                        <label className={`flex items-center justify-center px-4 bg-slate-100 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-200 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={isUploading}
                                            />
                                            {isUploading ? (
                                                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Image size={20} className="text-slate-500" />
                                            )}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowImagePicker(true)}
                                            className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-bold text-sm transition-all"
                                        >
                                            Select from Gallery
                                        </button>
                                    </div>
                                    {formData.image_url && (
                                        <div className="relative w-full h-32 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 group">
                                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white text-xs font-bold uppercase tracking-widest">Preview</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-2 flex items-center justify-end gap-4 pt-4 border-t border-slate-200/60">
                            <button 
                                type="button" 
                                onClick={resetForm}
                                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200/50 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting || isUploading}
                                className="bg-brand-navy-600 hover:bg-brand-navy-700 text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-brand-navy-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isSubmitting ? 'Saving...' : editingId ? 'Update Event' : 'Save Event'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {showImagePicker && (
                <ImagePicker 
                    onSelect={(url) => {
                        setFormData({ ...formData, image_url: url })
                        setShowImagePicker(false)
                    }} 
                    onClose={() => setShowImagePicker(false)} 
                />
            )}

            <div className="overflow-x-auto rounded-3xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-brand-cream border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Title</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Location</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {events.map((event) => (
                            <tr key={event.id} className="hover:bg-brand-cream/50 transition-colors group">
                                <td className="px-6 py-4 font-bold text-slate-900">{event.title}</td>
                                <td className="px-6 py-4 text-slate-600 font-medium">
                                    {new Date(event.date).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })}
                                </td>
                                <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">
                                    {event.location?.startsWith('http') ? (
                                        <a href={event.location} target="_blank" rel="noopener noreferrer" className="text-brand-navy-600 hover:underline">
                                            View Map
                                        </a>
                                    ) : (
                                        event.location || 'Not set'
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            className="p-2 bg-brand-navy-50 text-brand-navy-600 rounded-lg hover:bg-brand-navy-600 hover:text-white transition-all shadow-sm"
                                            onClick={() => handleEdit(event)}
                                            title="Edit Event"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <DeleteAction onDelete={() => handleDelete(event.id)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// Announcements Manager
const AnnouncementsManager = ({ showForm, setShowForm, getAuthHeaders }) => {
    const [announcements, setAnnouncements] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'normal'
    })

    React.useEffect(() => {
        fetchAnnouncements()
    }, [])

    const fetchAnnouncements = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.announcements)
            const data = await response.json()
            setAnnouncements(data)
        } catch (error) {
            toast.error('Failed to fetch announcements')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const url = editingId ? `${API_ENDPOINTS.announcements}/${editingId}` : API_ENDPOINTS.announcements
            const method = editingId ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                toast.success(`Announcement ${editingId ? 'updated' : 'added'} successfully`)
                fetchAnnouncements()
                resetForm()
            } else {
                toast.error('Operation failed')
            }
        } catch (error) {
            toast.error('Connection error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = (item) => {
        setFormData({
            title: item.title,
            content: item.content,
            priority: item.priority || 'normal'
        })
        setEditingId(item.id)
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`${API_ENDPOINTS.announcements}/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            if (response.ok) {
                toast.success('Announcement removed')
                fetchAnnouncements()
            } else {
                const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
                toast.error(`Delete failed: ${error.detail || response.statusText}`)
            }
        } catch (error) {
            toast.error('Connection error: ' + error.message)
        }
    }

    const resetForm = () => {
        setFormData({ title: '', content: '', priority: 'normal' })
        setEditingId(null)
        setShowForm(false)
    }

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'high': return 'bg-rose-100 text-rose-700 border-rose-200'
            case 'normal': return 'bg-brand-navy-100 text-brand-navy-700 border-brand-navy-200'
            case 'low': return 'bg-slate-100 text-slate-700 border-slate-200'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {showForm && (
                <div className="bg-brand-cream p-6 md:p-8 rounded-3xl border border-slate-200 shadow-inner">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                            {editingId ? 'Edit Announcement' : 'Post New Announcement'}
                        </h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <Plus size={24} className="rotate-45" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Title</label>
                            <input
                                type="text"
                                placeholder="Give this announcement a catchy title..."
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 outline-none focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-500/10 transition-all font-bold"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Content</label>
                            <textarea
                                placeholder="Type the announcement details here..."
                                rows={4}
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 outline-none focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-500/10 transition-all resize-none"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Priority Level</label>
                            <div className="flex flex-wrap gap-4">
                                {['low', 'normal', 'high'].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setFormData({...formData, priority: p})}
                                        className={`px-6 py-2 rounded-lg border-2 font-black uppercase text-xs tracking-widest transition-all ${
                                            formData.priority === p 
                                            ? 'bg-brand-navy-600 border-brand-navy-600 text-white shadow-lg shadow-brand-navy-600/20' 
                                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200/60">
                            <button type="button" onClick={resetForm} className="font-bold text-slate-500 px-6 py-3">Cancel</button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="bg-brand-navy-600 hover:bg-brand-navy-700 text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-brand-navy-600/20 transition-all active:scale-95"
                            >
                                {isSubmitting ? 'Posting...' : editingId ? 'Update' : 'Post Now'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto rounded-3xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-brand-cream border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Title</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Priority</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {announcements.map((item) => (
                            <tr key={item.id} className="hover:bg-brand-cream/50 transition-colors group">
                                <td className="px-6 py-4 font-bold text-slate-900">{item.title}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getPriorityColor(item.priority)}`}>
                                        {item.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-sm">{new Date(item.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 bg-brand-navy-50 text-brand-navy-600 rounded-lg hover:bg-brand-navy-600 hover:text-white" onClick={() => handleEdit(item)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <DeleteAction onDelete={() => handleDelete(item.id)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// Faculty Manager
const FacultyManager = ({ showForm, setShowForm, getAuthHeaders }) => {
    const [faculty, setFaculty] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [showImagePicker, setShowImagePicker] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        department: '',
        email: '',
        phone: '',
        bio: '',
        image_url: ''
    })

    React.useEffect(() => {
        fetchFaculty()
    }, [])

    const fetchFaculty = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.faculty)
            const data = await response.json()
            setFaculty(data)
        } catch (error) {
            toast.error('Failed to load faculty list')
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setIsUploading(true)
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)

        try {
            const response = await fetch(API_ENDPOINTS.upload, {
                method: 'POST',
                body: uploadFormData
            })

            if (response.ok) {
                const data = await response.json()
                setFormData(prev => ({ ...prev, image_url: data.url }))
                toast.success('Profile photo uploaded')
            } else {
                toast.error('Upload failed')
            }
        } catch (error) {
            toast.error('Upload connection error')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const url = editingId ? `${API_ENDPOINTS.faculty}/${editingId}` : API_ENDPOINTS.faculty
            const method = editingId ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            })
            if (response.ok) {
                toast.success(`${formData.name} successfully ${editingId ? 'updated' : 'added'}`)
                fetchFaculty()
                resetForm()
            } else {
                toast.error('Failed to save profile')
            }
        } catch (error) {
            toast.error('Connection error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = (item) => {
        setFormData({
            name: item.name,
            position: item.position,
            department: item.department,
            email: item.email || '',
            phone: item.phone || '',
            bio: item.bio || '',
            image_url: item.image_url || ''
        })
        setEditingId(item.id)
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`${API_ENDPOINTS.faculty}/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            if (response.ok) {
                toast.success('Member removed')
                fetchFaculty()
            } else {
                const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
                toast.error(`Delete failed: ${error.detail || response.statusText}`)
            }
        } catch (error) {
            toast.error('Connection error: ' + error.message)
        }
    }

    const resetForm = () => {
        setFormData({ name: '', position: '', department: '', email: '', phone: '', bio: '', image_url: '' })
        setEditingId(null)
        setShowForm(false)
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {showForm && (
                <div className="bg-brand-cream p-6 md:p-8 rounded-3xl border border-slate-200 shadow-inner">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                            {editingId ? 'Edit Faculty Member' : 'Add New Faculty Member'}
                        </h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <Plus size={24} className="rotate-45" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Position</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Senior Principal"
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Department</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Mathematics"
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone</label>
                                    <input
                                        type="tel"
                                        placeholder="Phone Number"
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Short Bio</label>
                                <textarea
                                    placeholder="Tell us about this member..."
                                    rows={2}
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all resize-none"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Profile Photo</label>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="https://..."
                                            className="flex-1 bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all"
                                            value={formData.image_url}
                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        />
                                        <label className={`flex items-center justify-center px-4 bg-slate-100 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-200 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={isUploading}
                                            />
                                            {isUploading ? (
                                                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Image size={20} className="text-slate-500" />
                                            )}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowImagePicker(true)}
                                            className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-bold text-sm transition-all"
                                        >
                                            Select from Gallery
                                        </button>
                                    </div>
                                    {formData.image_url && (
                                        <div className="relative w-full h-32 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 group">
                                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white text-xs font-bold uppercase tracking-widest">Preview</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-2 flex items-center justify-end gap-4 pt-6 border-t border-slate-200/60">
                            <button type="button" onClick={resetForm} className="font-bold text-slate-500 px-6 py-3 hover:bg-slate-200/50 rounded-xl transition-all">Cancel</button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting || isUploading}
                                className="bg-brand-navy-600 hover:bg-brand-navy-700 text-white font-black px-10 py-3 rounded-xl shadow-lg shadow-brand-navy-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isSubmitting ? 'Processing...' : editingId ? 'Update Member' : 'Add Member'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {showImagePicker && (
                <ImagePicker 
                    onSelect={(url) => {
                        setFormData({ ...formData, image_url: url })
                        setShowImagePicker(false)
                    }} 
                    onClose={() => setShowImagePicker(false)} 
                />
            )}

            <div className="overflow-x-auto rounded-3xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-brand-cream border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Name</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Department</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {faculty.map((item) => (
                            <tr key={item.id} className="hover:bg-brand-cream/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                            {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                                        </div>
                                        <span className="font-bold text-slate-900">{item.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-medium">{item.position}</td>
                                <td className="px-6 py-4 text-slate-500">{item.department}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 bg-brand-navy-50 text-brand-navy-600 rounded-lg hover:bg-brand-navy-600 hover:text-white" onClick={() => handleEdit(item)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <DeleteAction onDelete={() => handleDelete(item.id)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// Gallery Manager
const GalleryManager = ({ showForm, setShowForm, getAuthHeaders }) => {
    const [images, setImages] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isAddingNewCategory, setIsAddingNewCategory] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        image_url: '',
        category: '',
        description: ''
    })

    React.useEffect(() => {
        fetchImages()
    }, [])

    const fetchImages = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.gallery)
            const data = await response.json()
            setImages(data)
        } catch (error) {
            toast.error('Failed to load gallery')
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setIsUploading(true)
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)

        try {
            const response = await fetch(API_ENDPOINTS.upload, {
                method: 'POST',
                // No headers needed, browser sets multipart/form-data automatically
                body: uploadFormData
            })

            if (response.ok) {
                const data = await response.json()
                setFormData(prev => ({ ...prev, image_url: data.url }))
                toast.success('Image uploaded successfully')
            } else {
                toast.error('Image upload failed')
            }
        } catch (error) {
            toast.error('Upload connection error')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const url = editingId ? `${API_ENDPOINTS.gallery}/${editingId}` : API_ENDPOINTS.gallery
            const method = editingId ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                toast.success(`Image ${editingId ? 'updated' : 'added'} successfully`)
                fetchImages()
                resetForm()
            } else {
                toast.error('Failed to save image')
            }
        } catch (error) {
            toast.error('Connection error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = (item) => {
        setFormData({
            title: item.title,
            image_url: item.image_url,
            category: item.category || '',
            description: item.description || ''
        })
        setEditingId(item.id)
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`${API_ENDPOINTS.gallery}/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            if (response.ok) {
                toast.success('Image deleted')
                fetchImages()
            } else {
                const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
                toast.error(`Delete failed: ${error.detail || response.statusText}`)
            }
        } catch (error) {
            toast.error('Connection error: ' + error.message)
        }
    }

    const resetForm = () => {
        setFormData({ title: '', image_url: '', category: '', description: '' })
        setEditingId(null)
        setShowForm(false)
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {showForm && (
                <div className="bg-brand-cream p-6 md:p-8 rounded-3xl border border-slate-200 shadow-inner">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                            {editingId ? 'Edit Image Info' : 'Add New Gallery Image'}
                        </h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                            <Plus size={24} className="rotate-45" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Image Title</label>
                                <input
                                    type="text"
                                    placeholder="Enter title..."
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all font-bold"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                                {isAddingNewCategory ? (
                                    <div className="flex gap-2 animate-fade-in">
                                        <input
                                            type="text"
                                            placeholder="Type new category..."
                                            className="min-w-0 flex-1 bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            autoFocus
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setIsAddingNewCategory(false)
                                                setFormData({...formData, category: ''})
                                            }}
                                            className="px-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200"
                                            title="Cancel"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <select
                                                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-10 outline-none focus:border-brand-navy-500 transition-all appearance-none"
                                                value={formData.category}
                                                onChange={(e) => {
                                                    if (e.target.value === '___NEW_CATEGORY___') {
                                                        setIsAddingNewCategory(true)
                                                        setFormData({ ...formData, category: '' })
                                                    } else {
                                                        setFormData({ ...formData, category: e.target.value })
                                                    }
                                                }}
                                            >
                                                <option value="">Select Category...</option>
                                                {Array.from(new Set([
                                                    ...images.map(img => img.category).filter(Boolean)
                                                ])).sort().map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                                <option value="___NEW_CATEGORY___" className="font-bold text-brand-navy-600 bg-brand-navy-50">+ Add New Category...</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                        </div>
                                        {formData.category && (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!window.confirm(`Delete category "${formData.category}" from all images?`)) return
                                                    
                                                    const imagesToUpdate = images.filter(img => img.category === formData.category)
                                                    const toastId = toast.loading(`Removing category from ${imagesToUpdate.length} images...`)
                                                    
                                                    try {
                                                        await Promise.all(imagesToUpdate.map(img => 
                                                            fetch(`${API_ENDPOINTS.gallery}/${img.id}`, {
                                                                method: 'PUT',
                                                                headers: getAuthHeaders(),
                                                                body: JSON.stringify({ ...img, category: '' })
                                                            })
                                                        ))
                                                        toast.update(toastId, { render: 'Category removed details updated', type: 'success', isLoading: false, autoClose: 3000 })
                                                        setFormData(prev => ({ ...prev, category: '' }))
                                                        fetchImages()
                                                    } catch (error) {
                                                        toast.update(toastId, { render: 'Failed to remove category', type: 'error', isLoading: false, autoClose: 3000 })
                                                    }
                                                }}
                                                className="px-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 border border-rose-100 transition-colors"
                                                title="Delete this category"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Image</label>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter image URL or upload..."
                                            className="flex-1 bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all font-mono text-sm"
                                            value={formData.image_url}
                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                            required
                                        />
                                        <label className={`flex items-center justify-center px-4 bg-slate-100 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-200 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={isUploading}
                                            />
                                            {isUploading ? (
                                                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Image size={20} className="text-slate-500" />
                                            )}
                                        </label>
                                    </div>
                                    {formData.image_url && (
                                        <div className="relative w-full h-32 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 group">
                                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white text-xs font-bold uppercase tracking-widest">Preview</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Description (Optional)</label>
                                <textarea
                                    placeholder="Brief details about the photo..."
                                    rows={1}
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 flex items-center justify-end gap-4 pt-6 border-t border-slate-200/60">
                            <button type="button" onClick={resetForm} className="font-bold text-slate-500 px-6 py-3">Cancel</button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting || isUploading}
                                className="bg-brand-navy-600 hover:bg-brand-navy-700 text-white font-black px-10 py-3 rounded-xl shadow-lg shadow-brand-navy-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isSubmitting ? 'Saving...' : editingId ? 'Update Info' : 'Add to Gallery'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto rounded-3xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-brand-cream border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Preview</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Details</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {images.map((item) => (
                            <tr key={item.id} className="hover:bg-brand-cream/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="w-20 h-14 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                                    <span className="text-xs font-black text-brand-navy-500 uppercase tracking-widest">{item.category}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-sm">{new Date(item.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 bg-brand-navy-50 text-brand-navy-600 rounded-lg hover:bg-brand-navy-600 hover:text-white" onClick={() => handleEdit(item)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <DeleteAction onDelete={() => handleDelete(item.id)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}


// ── ERP Manager ───────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || ''

const ERPManager = ({ getAuthHeaders }) => {
    const [section, setSection] = useState('teachers')
    const [teachers, setTeachers] = useState([])
    const [classes, setClasses] = useState([])
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedTeacher, setExpandedTeacher] = useState(null)
    const [showAddTeacher, setShowAddTeacher] = useState(false)
    const [showAddClass, setShowAddClass] = useState(false)
    const [showAddSubject, setShowAddSubject] = useState(false)
    const [assigning, setAssigning] = useState(null) // teacher profile id being assigned

    const adminFetch = async (url, options = {}) => {
        const res = await fetch(url, { ...options, headers: getAuthHeaders() })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Request failed')
        return data
    }

    const load = async () => {
        setLoading(true)
        try {
            const [t, c, s] = await Promise.all([
                adminFetch(`${API_BASE}/admin/erp/teachers`),
                adminFetch(`${API_BASE}/admin/erp/class-sections`),
                adminFetch(`${API_BASE}/admin/erp/subjects`),
            ])
            setTeachers(t)
            setClasses(c)
            setSubjects(s)
        } catch (e) {
            toast.error(e.message || 'Could not load ERP data')
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => { load() }, []) // eslint-disable-line

    const removeAssignment = async (assignmentId, teacherProfileId) => {
        try {
            await adminFetch(`${API_BASE}/admin/erp/teacher-assignments/${assignmentId}`, { method: 'DELETE' })
            toast.success('Assignment removed')
            setTeachers((prev) => prev.map((t) =>
                t.profile.id === teacherProfileId
                    ? { ...t, assignments: t.assignments.filter((a) => a.id !== assignmentId) }
                    : t
            ))
        } catch (e) {
            toast.error(e.message)
        }
    }

    const Field = ({ label, ...props }) => (
        <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{label}</label>
            <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-navy-500" {...props} />
        </div>
    )

    const AddTeacherForm = () => {
        const [form, setForm] = useState({ full_name: '', email: '', phone: '', department: '', subject: '', class_teacher_of: '', password: 'teacher123' })
        const [saving, setSaving] = useState(false)
        const submit = async (e) => {
            e.preventDefault()
            setSaving(true)
            try {
                await adminFetch(`${API_BASE}/admin/erp/teachers`, { method: 'POST', body: JSON.stringify(form) })
                toast.success(`Teacher ${form.full_name} created · Password: ${form.password}`)
                setShowAddTeacher(false)
                load()
            } catch (err) {
                toast.error(err.message)
            } finally {
                setSaving(false)
            }
        }
        return (
            <div className="rounded-2xl border border-brand-navy-200 bg-brand-navy-50 p-5 mb-6">
                <h3 className="font-black text-slate-900 mb-4">New ERP Teacher Account</h3>
                <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
                    <Field label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                    <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    <Field label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    <Field label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                    <Field label="Primary Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                    <Field label="Initial Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <div className="sm:col-span-2 flex gap-2">
                        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-brand-navy-700 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60">
                            {saving ? <Loader2 className="animate-spin" size={15} /> : <UserPlus size={15} />} Create Teacher
                        </button>
                        <button type="button" onClick={() => setShowAddTeacher(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600">Cancel</button>
                    </div>
                </form>
            </div>
        )
    }

    const AssignClassForm = ({ teacher }) => {
        const [form, setForm] = useState({ class_section_id: '', subject_id: '', is_class_teacher: false })
        const [saving, setSaving] = useState(false)
        const submit = async (e) => {
            e.preventDefault()
            if (!form.class_section_id || !form.subject_id) { toast.error('Select class and subject'); return }
            setSaving(true)
            try {
                const newA = await adminFetch(`${API_BASE}/admin/erp/teacher-assignments`, {
                    method: 'POST',
                    body: JSON.stringify({ teacher_profile_id: teacher.profile.id, class_section_id: Number(form.class_section_id), subject_id: Number(form.subject_id), is_class_teacher: form.is_class_teacher }),
                })
                toast.success('Assignment added')
                setAssigning(null)
                setTeachers((prev) => prev.map((t) =>
                    t.profile.id === teacher.profile.id ? { ...t, assignments: [...t.assignments, newA] } : t
                ))
            } catch (err) {
                toast.error(err.message)
            } finally {
                setSaving(false)
            }
        }
        return (
            <form onSubmit={submit} className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Assign Class & Subject</p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-1">Class Section</label>
                        <select value={form.class_section_id} onChange={(e) => setForm({ ...form, class_section_id: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-navy-500">
                            <option value="">Select class…</option>
                            {classes.map((c) => <option key={c.id} value={c.id}>Class {c.class_name}-{c.section} ({c.academic_year})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-1">Subject</label>
                        <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-navy-500">
                            <option value="">Select subject…</option>
                            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                        </select>
                    </div>
                </div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={form.is_class_teacher} onChange={(e) => setForm({ ...form, is_class_teacher: e.target.checked })} className="rounded" />
                    Set as Class Teacher for this section
                </label>
                <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-brand-navy-700 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Assign
                    </button>
                    <button type="button" onClick={() => setAssigning(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600">Cancel</button>
                </div>
            </form>
        )
    }

    const AddClassForm = () => {
        const currentYear = `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(-2)}`
        const [form, setForm] = useState({ class_name: '', section: '', academic_year: currentYear })
        const [saving, setSaving] = useState(false)
        const submit = async (e) => {
            e.preventDefault()
            setSaving(true)
            try {
                await adminFetch(`${API_BASE}/admin/erp/class-sections`, { method: 'POST', body: JSON.stringify(form) })
                toast.success(`Class ${form.class_name}-${form.section} created`)
                setShowAddClass(false)
                load()
            } catch (err) {
                toast.error(err.message)
            } finally {
                setSaving(false)
            }
        }
        return (
            <div className="rounded-2xl border border-brand-navy-200 bg-brand-navy-50 p-5 mb-6">
                <h3 className="font-black text-slate-900 mb-4">New Class Section</h3>
                <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
                    <Field label="Class (e.g. 8)" value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} required />
                    <Field label="Section (e.g. A)" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} required />
                    <Field label="Academic Year" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} required />
                    <div className="sm:col-span-3 flex gap-2">
                        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-brand-navy-700 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60">
                            {saving ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />} Create Class
                        </button>
                        <button type="button" onClick={() => setShowAddClass(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600">Cancel</button>
                    </div>
                </form>
            </div>
        )
    }

    const AddSubjectForm = () => {
        const [form, setForm] = useState({ name: '', code: '', description: '' })
        const [saving, setSaving] = useState(false)
        const submit = async (e) => {
            e.preventDefault()
            setSaving(true)
            try {
                await adminFetch(`${API_BASE}/admin/erp/subjects`, { method: 'POST', body: JSON.stringify(form) })
                toast.success(`Subject ${form.name} created`)
                setShowAddSubject(false)
                load()
            } catch (err) {
                toast.error(err.message)
            } finally {
                setSaving(false)
            }
        }
        return (
            <div className="rounded-2xl border border-brand-navy-200 bg-brand-navy-50 p-5 mb-6">
                <h3 className="font-black text-slate-900 mb-4">New Subject</h3>
                <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
                    <Field label="Subject Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    <Field label="Code (e.g. MATH)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                    <Field label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    <div className="sm:col-span-3 flex gap-2">
                        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-brand-navy-700 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60">
                            {saving ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />} Create Subject
                        </button>
                        <button type="button" onClick={() => setShowAddSubject(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600">Cancel</button>
                    </div>
                </form>
            </div>
        )
    }

    if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-navy-400" size={32} /></div>

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-8">
                {[
                    { id: 'teachers', label: 'Teachers', icon: <User size={16} /> },
                    { id: 'classes', label: 'Classes & Subjects', icon: <BookOpen size={16} /> },
                    { id: 'timetable', label: 'Timetable', icon: <Calendar size={16} /> },
                    { id: 'fees', label: 'Fees', icon: <CreditCard size={16} /> },
                ].map((s) => (
                    <button key={s.id} type="button"
                        onClick={() => setSection(s.id)}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-black transition-all ${section === s.id ? 'border-brand-navy-500 bg-brand-navy-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-navy-300'}`}>
                        {s.icon}{s.label}
                    </button>
                ))}
            </div>

            {/* Teachers section */}
            {section === 'teachers' && (
                <div>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-black text-slate-900">ERP Teachers ({teachers.length})</h2>
                        <button type="button" onClick={() => setShowAddTeacher((v) => !v)}
                            className="flex items-center gap-2 rounded-xl bg-brand-navy-700 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-navy-800">
                            <UserPlus size={15} /> Add Teacher
                        </button>
                    </div>
                    {showAddTeacher && <AddTeacherForm />}
                    {teachers.length === 0 ? (
                        <p className="text-slate-400 font-bold text-sm">No ERP teachers yet. Add one above.</p>
                    ) : (
                        <div className="space-y-3">
                            {teachers.map((t) => (
                                <div key={t.profile.id} className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${expandedTeacher === t.profile.id ? 'border-brand-navy-300' : 'border-slate-200'}`}>
                                    <button type="button"
                                        onClick={() => setExpandedTeacher(expandedTeacher === t.profile.id ? null : t.profile.id)}
                                        className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-navy-100 text-sm font-black text-brand-navy-700">
                                                {t.user.full_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900">{t.user.full_name}</p>
                                                <p className="text-xs font-bold text-slate-400">{t.user.email} · {t.profile.department || '—'} · {t.profile.subject || '—'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="shrink-0 rounded-lg bg-brand-navy-100 px-2.5 py-1 text-xs font-black text-brand-navy-700">
                                                {t.assignments.length} class{t.assignments.length !== 1 ? 'es' : ''}
                                            </span>
                                            {expandedTeacher === t.profile.id ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                        </div>
                                    </button>

                                    {expandedTeacher === t.profile.id && (
                                        <div className="border-t border-slate-100 p-5">
                                            <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Class Assignments</p>
                                            {t.assignments.length === 0 ? (
                                                <p className="text-sm font-bold text-slate-400 mb-3">No class assignments yet.</p>
                                            ) : (
                                                <div className="space-y-2 mb-3">
                                                    {t.assignments.map((a) => (
                                                        <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                                                            <div>
                                                                <p className="text-sm font-black text-slate-900">
                                                                    Class {a.class_section?.class_name}-{a.class_section?.section}
                                                                    {a.is_class_teacher && <span className="ml-2 rounded-md bg-brand-navy-100 px-1.5 py-0.5 text-xs font-black text-brand-navy-700">Class Teacher</span>}
                                                                </p>
                                                                <p className="text-xs font-bold text-slate-400">{a.subject?.name || '—'} · {a.academic_year}</p>
                                                            </div>
                                                            <button type="button"
                                                                onClick={() => removeAssignment(a.id, t.profile.id)}
                                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {assigning === t.profile.id ? (
                                                <AssignClassForm teacher={t} />
                                            ) : (
                                                <button type="button"
                                                    onClick={() => setAssigning(t.profile.id)}
                                                    className="flex items-center gap-2 rounded-xl border border-dashed border-brand-navy-300 px-4 py-2.5 text-sm font-black text-brand-navy-600 hover:bg-brand-navy-50">
                                                    <Plus size={15} /> Assign Class & Subject
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Classes & Subjects section */}
            {section === 'classes' && (
                <div className="grid gap-8 md:grid-cols-2">
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-black text-slate-900">Class Sections ({classes.length})</h2>
                            <button type="button" onClick={() => setShowAddClass((v) => !v)}
                                className="flex items-center gap-2 rounded-xl bg-brand-navy-700 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-navy-800">
                                <Plus size={15} /> Add Class
                            </button>
                        </div>
                        {showAddClass && <AddClassForm />}
                        <div className="space-y-2">
                            {classes.map((c) => (
                                <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="font-black text-slate-900">Class {c.class_name}-{c.section}</p>
                                    <span className="text-xs font-bold text-slate-400">{c.academic_year}</span>
                                </div>
                            ))}
                            {classes.length === 0 && <p className="text-sm font-bold text-slate-400">No classes yet.</p>}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-black text-slate-900">Subjects ({subjects.length})</h2>
                            <button type="button" onClick={() => setShowAddSubject((v) => !v)}
                                className="flex items-center gap-2 rounded-xl bg-brand-navy-700 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-navy-800">
                                <Plus size={15} /> Add Subject
                            </button>
                        </div>
                        {showAddSubject && <AddSubjectForm />}
                        <div className="space-y-2">
                            {subjects.map((s) => (
                                <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="font-black text-slate-900">{s.name}</p>
                                    <span className="text-xs font-bold text-slate-400">{s.code}</span>
                                </div>
                            ))}
                            {subjects.length === 0 && <p className="text-sm font-bold text-slate-400">No subjects yet.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Timetable section */}
            {section === 'timetable' && (
                <TimetableEditor
                    classes={classes}
                    subjects={subjects}
                    teachers={teachers}
                    adminFetch={adminFetch}
                />
            )}

            {/* Fees section */}
            {section === 'fees' && <FeesManager adminFetch={adminFetch} />}
        </div>
    )
}

// ── Fees Manager ─────────────────────────────────────────────────────────────

const fmt = (paise) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const FeesManager = ({ adminFetch }) => {
    const [summary, setSummary] = useState(null)
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [expanded, setExpanded] = useState(null)
    const [addingInvoice, setAddingInvoice] = useState(null) // student_id
    const [payingInvoice, setPayingInvoice] = useState(null) // invoice object
    const [downloadingReceiptId, setDownloadingReceiptId] = useState(null)
    const [sharingReceiptId, setSharingReceiptId] = useState(null)

    const downloadReceipt = async (paymentId) => {
        setDownloadingReceiptId(paymentId)
        try {
            const data = await adminFetch(`${API_BASE}/admin/erp/receipts/${paymentId}`)
            printReceiptPDF(data)
        } catch (e) {
            toast.error(e.message || 'Could not load receipt')
        } finally {
            setDownloadingReceiptId(null)
        }
    }

    const shareReceipt = async (paymentId) => {
        setSharingReceiptId(paymentId)
        try {
            const data = await adminFetch(`${API_BASE}/admin/erp/receipts/${paymentId}`)
            const hadPhone = shareReceiptWhatsApp(data)
            if (!hadPhone) toast.info('No guardian phone on file — WhatsApp opened without a pre-filled number')
        } catch (e) {
            toast.error(e.message || 'Could not load receipt')
        } finally {
            setSharingReceiptId(null)
        }
    }

    const load = async () => {
        setLoading(true)
        try {
            const [sum, stds] = await Promise.all([
                adminFetch(`${API_BASE}/admin/erp/fees/summary`),
                adminFetch(`${API_BASE}/admin/erp/fees/students`),
            ])
            setSummary(sum)
            setStudents(stds)
        } catch (e) {
            toast.error(e.message || 'Could not load fees')
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => { load() }, []) // eslint-disable-line

    const filtered = students.filter((s) =>
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.admission_no?.toLowerCase().includes(search.toLowerCase())
    )

    const statusColor = (status) => ({
        paid: 'bg-emerald-100 text-emerald-700',
        partial: 'bg-amber-100 text-amber-700',
        pending: 'bg-rose-100 text-rose-700',
    }[status] || 'bg-slate-100 text-slate-600')

    const AddInvoiceForm = ({ studentId, onDone }) => {
        const today = new Date().toISOString().split('T')[0]
        const [form, setForm] = useState({ title: '', term: '', amount: '', due_date: today })
        const [saving, setSaving] = useState(false)
        const submit = async (e) => {
            e.preventDefault()
            if (!form.title || !form.amount || !form.due_date) { toast.error('Fill all required fields'); return }
            setSaving(true)
            try {
                const inv = await adminFetch(`${API_BASE}/admin/erp/fee-invoices`, {
                    method: 'POST',
                    body: JSON.stringify({
                        student_id: studentId,
                        title: form.title,
                        term: form.term || null,
                        amount_paise: Math.round(parseFloat(form.amount) * 100),
                        due_date: form.due_date,
                    }),
                })
                toast.success(`Invoice ${inv.invoice_no} created`)
                onDone()
                load()
            } catch (err) {
                toast.error(err.message)
            } finally {
                setSaving(false)
            }
        }
        return (
            <form onSubmit={submit} className="mt-3 rounded-xl border border-brand-navy-200 bg-brand-navy-50 p-4 space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-brand-navy-700">New Invoice</p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-1">Title *</label>
                        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                            placeholder="e.g. Q1 Tuition Fee"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-brand-navy-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-1">Term</label>
                        <input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}
                            placeholder="e.g. Q1 2025-26"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-brand-navy-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-1">Amount (₹) *</label>
                        <input type="number" step="0.01" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required
                            placeholder="e.g. 15000"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-brand-navy-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-1">Due Date *</label>
                        <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-brand-navy-500" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button type="submit" disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-brand-navy-700 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Create Invoice
                    </button>
                    <button type="button" onClick={onDone} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600">Cancel</button>
                </div>
            </form>
        )
    }

    const RecordPaymentForm = ({ invoice, onDone }) => {
        const balanceRs = (invoice.balance_paise / 100).toFixed(2)
        const [form, setForm] = useState({ amount: balanceRs, method: 'cash' })
        const [saving, setSaving] = useState(false)
        const submit = async (e) => {
            e.preventDefault()
            setSaving(true)
            try {
                const result = await adminFetch(`${API_BASE}/admin/erp/fee-payments/manual`, {
                    method: 'POST',
                    body: JSON.stringify({
                        invoice_id: invoice.id,
                        amount_paise: Math.round(parseFloat(form.amount) * 100),
                        method: form.method,
                    }),
                })
                toast.success(`Payment recorded · Receipt: ${result.receipt_no}`)
                onDone()
                load()
            } catch (err) {
                toast.error(err.message)
            } finally {
                setSaving(false)
            }
        }
        return (
            <form onSubmit={submit} className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Record Payment — {invoice.title}</p>
                <p className="text-xs font-bold text-slate-500">Outstanding: {fmt(invoice.balance_paise)}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-1">Amount (₹)</label>
                        <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-1">Method</label>
                        <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold bg-white outline-none focus:border-emerald-500">
                            <option value="cash">Cash</option>
                            <option value="cheque">Cheque</option>
                            <option value="upi">UPI</option>
                            <option value="neft">NEFT</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button type="submit" disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Record Payment
                    </button>
                    <button type="button" onClick={onDone} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600">Cancel</button>
                </div>
            </form>
        )
    }

    if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-navy-400" size={32} /></div>

    return (
        <div className="space-y-6">
            {/* Summary tiles */}
            {summary && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {[
                        { label: 'Total Billed', value: fmt(summary.total_billed_paise), color: 'bg-slate-100 text-slate-700' },
                        { label: 'Collected', value: fmt(summary.total_collected_paise), color: 'bg-emerald-100 text-emerald-700' },
                        { label: 'Outstanding', value: fmt(summary.outstanding_paise), color: 'bg-rose-100 text-rose-700' },
                    ].map((t) => (
                        <div key={t.label} className={`rounded-2xl ${t.color} px-5 py-4`}>
                            <p className="text-xs font-black uppercase tracking-wider opacity-70">{t.label}</p>
                            <p className="mt-1 text-xl font-black">{t.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Student fee list */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black text-slate-900">Students</h2>
                    <p className="text-xs font-bold text-slate-400">{filtered.length} shown</p>
                </div>
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or admission no…"
                    className="mb-4 w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-brand-navy-500"
                />
                <div className="space-y-3">
                    {filtered.map((s) => (
                        <div key={s.student_id} className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${expanded === s.student_id ? 'border-brand-navy-300' : 'border-slate-200'}`}>
                            {/* Student row */}
                            <button type="button"
                                onClick={() => setExpanded(expanded === s.student_id ? null : s.student_id)}
                                className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-slate-50">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-navy-100 text-xs font-black text-brand-navy-700">
                                        {s.full_name[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate font-black text-slate-900">{s.full_name}</p>
                                        <p className="text-xs font-bold text-slate-400">{s.admission_no} · Class {s.class_name}-{s.section}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {s.fee_due_paise > 0 ? (
                                        <span className="rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700">Due {fmt(s.fee_due_paise)}</span>
                                    ) : (
                                        <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">Paid up</span>
                                    )}
                                    {expanded === s.student_id ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                </div>
                            </button>

                            {expanded === s.student_id && (
                                <div className="border-t border-slate-100 p-4 space-y-3">
                                    {/* Invoices */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Invoices</p>
                                        <button type="button"
                                            onClick={() => setAddingInvoice(addingInvoice === s.student_id ? null : s.student_id)}
                                            className="flex items-center gap-1 rounded-lg border border-dashed border-brand-navy-300 px-3 py-1.5 text-xs font-black text-brand-navy-600 hover:bg-brand-navy-50">
                                            <Plus size={12} /> Add Invoice
                                        </button>
                                    </div>
                                    {addingInvoice === s.student_id && <AddInvoiceForm studentId={s.student_id} onDone={() => setAddingInvoice(null)} />}
                                    {s.invoices.length === 0 ? (
                                        <p className="text-sm font-bold text-slate-400">No invoices yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {s.invoices.map((inv) => (
                                                <div key={inv.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-black text-slate-900 truncate">{inv.title}</p>
                                                            <p className="text-xs font-bold text-slate-400">{inv.invoice_no}{inv.term ? ` · ${inv.term}` : ''} · Due {fmtDate(inv.due_date)}</p>
                                                        </div>
                                                        <div className="shrink-0 text-right">
                                                            <p className="text-sm font-black text-slate-900">{fmt(inv.amount_paise)}</p>
                                                            {inv.balance_paise > 0 && <p className="text-xs font-black text-rose-600">Due {fmt(inv.balance_paise)}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex items-center flex-wrap gap-2">
                                                        <span className={`rounded-md px-2 py-0.5 text-xs font-black ${statusColor(inv.status)}`}>{inv.status}</span>
                                                        <button type="button"
                                                            onClick={() => printInvoicePDF({ inv, student: s })}
                                                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-slate-600 hover:bg-slate-50">
                                                            <Printer size={11} /> Invoice PDF
                                                        </button>
                                                        {inv.balance_paise > 0 && (
                                                            <button type="button"
                                                                onClick={() => setPayingInvoice(payingInvoice?.id === inv.id ? null : inv)}
                                                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-black text-white hover:bg-emerald-700">
                                                                <Receipt size={11} /> Record Payment
                                                            </button>
                                                        )}
                                                    </div>
                                                    {payingInvoice?.id === inv.id && (
                                                        <RecordPaymentForm invoice={inv} onDone={() => setPayingInvoice(null)} />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Payment history */}
                                    {s.payments.length > 0 && (
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Payment History</p>
                                            <div className="space-y-1.5">
                                                {s.payments.map((p) => (
                                                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-black text-slate-800">{p.receipt_no}</p>
                                                            <p className="text-xs font-bold text-slate-400">{fmtDate(p.paid_at)} · {p.method}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <p className="text-sm font-black text-emerald-700 mr-1">{fmt(p.amount_paise)}</p>
                                                            <button type="button"
                                                                onClick={() => shareReceipt(p.id)}
                                                                disabled={sharingReceiptId === p.id}
                                                                title="Share via WhatsApp"
                                                                className="flex items-center gap-1 rounded-lg bg-[#25D366] px-2 py-1 text-xs font-black text-white hover:bg-[#1ebe5d] disabled:opacity-50">
                                                                {sharingReceiptId === p.id ? <Loader2 className="animate-spin" size={10} /> : <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>}
                                                                Share
                                                            </button>
                                                            <button type="button"
                                                                onClick={() => downloadReceipt(p.id)}
                                                                disabled={downloadingReceiptId === p.id}
                                                                title="Download PDF"
                                                                className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2 py-1 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                                                                {downloadingReceiptId === p.id ? <Loader2 className="animate-spin" size={10} /> : <Printer size={10} />} PDF
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {filtered.length === 0 && <p className="text-sm font-bold text-slate-400">No students found.</p>}
                </div>
            </div>
        </div>
    )
}

// ── Timetable Editor ──────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DEFAULT_PERIODS = [
    { period_no: 1, start_time: '08:00', end_time: '08:45', is_break: false },
    { period_no: 2, start_time: '08:45', end_time: '09:30', is_break: false },
    { period_no: 3, start_time: '09:30', end_time: '10:15', is_break: false },
    { period_no: 4, start_time: '10:15', end_time: '10:30', is_break: true },
    { period_no: 5, start_time: '10:30', end_time: '11:15', is_break: false },
    { period_no: 6, start_time: '11:15', end_time: '12:00', is_break: false },
    { period_no: 7, start_time: '12:00', end_time: '12:45', is_break: false },
    { period_no: 8, start_time: '12:45', end_time: '13:30', is_break: false },
]

const TimetableEditor = ({ classes, subjects, teachers, adminFetch }) => {
    const currentYear = `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(-2)}`
    const [selectedClassId, setSelectedClassId] = useState('')
    const [academicYear, setAcademicYear] = useState(currentYear)
    const [periods, setPeriods] = useState(DEFAULT_PERIODS)
    // grid[`${day}-${period_no}`] = subject_id | null
    const [grid, setGrid] = useState({})
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [loaded, setLoaded] = useState(false)

    // For each subject in a given class, find which teacher is assigned
    const getTeacherForSubject = (subjectId, classSectionId) => {
        if (!subjectId) return null
        const t = teachers.find((t) =>
            t.assignments.some((a) => a.subject_id === subjectId && a.class_section_id === classSectionId)
        )
        return t?.profile?.id || null
    }

    const loadTimetable = async () => {
        if (!selectedClassId) return
        setLoading(true)
        setLoaded(false)
        try {
            const slots = await adminFetch(
                `${API_BASE}/admin/erp/timetable/${selectedClassId}?academic_year=${academicYear}`
            )
            if (slots.length === 0) {
                setPeriods(DEFAULT_PERIODS)
                setGrid({})
            } else {
                // Reconstruct period structure from day=0 slots
                const day0 = slots
                    .filter((s) => s.day_of_week === 0)
                    .sort((a, b) => a.period_no - b.period_no)
                setPeriods(
                    day0.map((s) => ({
                        period_no: s.period_no,
                        start_time: s.start_time || '',
                        end_time: s.end_time || '',
                        is_break: s.is_break,
                    }))
                )
                // Reconstruct grid from all slots
                const g = {}
                slots.forEach((s) => {
                    if (!s.is_break) g[`${s.day_of_week}-${s.period_no}`] = s.subject_id || null
                })
                setGrid(g)
            }
            setLoaded(true)
        } catch (e) {
            toast.error(e.message || 'Could not load timetable')
        } finally {
            setLoading(false)
        }
    }

    const saveTimetable = async () => {
        if (!selectedClassId) return
        setSaving(true)
        const slots = []
        DAYS.forEach((_, day) => {
            periods.forEach((p) => {
                const subjectId = p.is_break ? null : (grid[`${day}-${p.period_no}`] || null)
                slots.push({
                    day_of_week: day,
                    period_no: p.period_no,
                    start_time: p.start_time || null,
                    end_time: p.end_time || null,
                    is_break: p.is_break,
                    subject_id: subjectId,
                    teacher_id: p.is_break ? null : getTeacherForSubject(subjectId, Number(selectedClassId)),
                })
            })
        })
        try {
            await adminFetch(`${API_BASE}/admin/erp/timetable/${selectedClassId}`, {
                method: 'PUT',
                body: JSON.stringify({ academic_year: academicYear, slots }),
            })
            toast.success('Timetable saved!')
        } catch (e) {
            toast.error(e.message || 'Could not save timetable')
        } finally {
            setSaving(false)
        }
    }

    const updatePeriod = (idx, field, value) => {
        setPeriods((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
        // If toggling to break, clear all grid cells for this period
        if (field === 'is_break' && value === true) {
            setGrid((prev) => {
                const next = { ...prev }
                DAYS.forEach((_, day) => { delete next[`${day}-${periods[idx].period_no}`] })
                return next
            })
        }
    }

    const addPeriod = () => {
        const lastPeriod = periods[periods.length - 1]
        const newNo = lastPeriod ? lastPeriod.period_no + 1 : 1
        setPeriods((prev) => [...prev, { period_no: newNo, start_time: '', end_time: '', is_break: false }])
    }

    const removePeriod = () => {
        if (periods.length <= 1) return
        const last = periods[periods.length - 1]
        const next = { ...grid }
        DAYS.forEach((_, day) => { delete next[`${day}-${last.period_no}`] })
        setGrid(next)
        setPeriods((prev) => prev.slice(0, -1))
    }

    const selectedClass = classes.find((c) => String(c.id) === String(selectedClassId))

    return (
        <div className="space-y-6">
            <div className="flex items-end gap-3 flex-wrap">
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Class Section</label>
                    <select
                        value={selectedClassId}
                        onChange={(e) => { setSelectedClassId(e.target.value); setLoaded(false) }}
                        className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-brand-navy-500 bg-white min-w-[160px]"
                    >
                        <option value="">Select class…</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>Class {c.class_name}-{c.section}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Academic Year</label>
                    <input
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-brand-navy-500 w-28"
                        placeholder="2025-26"
                    />
                </div>
                <button
                    type="button"
                    onClick={loadTimetable}
                    disabled={!selectedClassId || loading}
                    className="flex items-center gap-2 rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50 hover:bg-slate-800"
                >
                    {loading ? <Loader2 className="animate-spin" size={15} /> : <ChevronRight size={15} />}
                    Load
                </button>
            </div>

            {!selectedClassId && (
                <p className="text-sm font-bold text-slate-400">Select a class to edit its timetable.</p>
            )}

            {selectedClassId && loaded && (
                <>
                    {/* Period structure */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
                                Period Times — Class {selectedClass?.class_name}-{selectedClass?.section}
                            </h3>
                            <div className="flex gap-2">
                                <button type="button" onClick={addPeriod}
                                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50">
                                    <Plus size={12} /> Period
                                </button>
                                <button type="button" onClick={removePeriod}
                                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-rose-50 hover:text-rose-600">
                                    <Trash2 size={12} /> Remove Last
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[480px] text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-400">
                                        <th className="pb-2 pr-4 text-left w-12">No.</th>
                                        <th className="pb-2 pr-4 text-left">Start</th>
                                        <th className="pb-2 pr-4 text-left">End</th>
                                        <th className="pb-2 text-left">Break?</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {periods.map((p, idx) => (
                                        <tr key={p.period_no} className={`border-b border-slate-100 ${p.is_break ? 'bg-amber-50' : ''}`}>
                                            <td className="py-2 pr-4 font-black text-slate-500">{p.period_no}</td>
                                            <td className="py-2 pr-4">
                                                <input type="time" value={p.start_time}
                                                    onChange={(e) => updatePeriod(idx, 'start_time', e.target.value)}
                                                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold outline-none focus:border-brand-navy-500 w-28" />
                                            </td>
                                            <td className="py-2 pr-4">
                                                <input type="time" value={p.end_time}
                                                    onChange={(e) => updatePeriod(idx, 'end_time', e.target.value)}
                                                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold outline-none focus:border-brand-navy-500 w-28" />
                                            </td>
                                            <td className="py-2">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={p.is_break}
                                                        onChange={(e) => updatePeriod(idx, 'is_break', e.target.checked)}
                                                        className="rounded" />
                                                    {p.is_break && <span className="text-xs font-black text-amber-700">Break</span>}
                                                </label>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Weekly schedule grid */}
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-3">Weekly Schedule</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-[700px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="pb-2 pr-3 text-left text-xs font-black uppercase tracking-wider text-slate-400 w-24">Period</th>
                                        {DAYS.map((d) => (
                                            <th key={d} className="pb-2 px-2 text-center text-xs font-black uppercase tracking-wider text-slate-400">{d}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {periods.map((p) => (
                                        <tr key={p.period_no} className={`border-b border-slate-100 ${p.is_break ? 'bg-amber-50' : ''}`}>
                                            <td className="py-2 pr-3">
                                                <p className="text-xs font-black text-slate-700">P{p.period_no}</p>
                                                {p.start_time && (
                                                    <p className="text-xs font-bold text-slate-400">{p.start_time}–{p.end_time}</p>
                                                )}
                                            </td>
                                            {p.is_break ? (
                                                <td colSpan={6} className="py-2 px-2 text-center text-xs font-black uppercase tracking-wider text-amber-600">
                                                    — Break —
                                                </td>
                                            ) : (
                                                DAYS.map((_, day) => (
                                                    <td key={day} className="py-1.5 px-1.5">
                                                        <select
                                                            value={grid[`${day}-${p.period_no}`] || ''}
                                                            onChange={(e) => setGrid((g) => ({
                                                                ...g,
                                                                [`${day}-${p.period_no}`]: e.target.value ? Number(e.target.value) : null,
                                                            }))}
                                                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold outline-none focus:border-brand-navy-500"
                                                        >
                                                            <option value="">—</option>
                                                            {subjects.map((s) => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                ))
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={saveTimetable}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-brand-navy-700 px-6 py-3 text-sm font-black text-white disabled:opacity-60 hover:bg-brand-navy-800"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                        Save Timetable
                    </button>
                </>
            )}
        </div>
    )
}

export default Admin
