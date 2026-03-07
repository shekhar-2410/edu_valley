import { Bell, Calendar, Edit2, Image, LogOut, MessageSquare, Plus, Trash2, User, X, Check, ChevronDown } from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { toast } from 'react-toastify'
 
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
        { id: 'contacts', label: 'Messages', icon: <MessageSquare size={20} /> },
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
                            {activeTab !== 'contacts' && (
                                <button
                                    className={`flex-1 md:flex-none inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-2xl shadow-lg transition-all active:scale-95 ${
                                        showAddForm 
                                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                                        : 'bg-brand-navy-600 text-white hover:bg-brand-navy-700 shadow-brand-navy-600/20'
                                    }`}
                                    onClick={() => setShowAddForm(!showAddForm)}
                                >
                                    {showAddForm ? 'Hide Form' : `Add ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}`}
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
                            {activeTab === 'contacts' && <ContactsManager getAuthHeaders={getAuthHeaders} />}
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
                                    placeholder="e.g., Dr. John Doe"
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
                                        placeholder="email@nev.edu"
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone</label>
                                    <input
                                        type="tel"
                                        placeholder="+91..."
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

// Contacts Manager
const ContactsManager = ({ getAuthHeaders }) => {
    const [contacts, setContacts] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    React.useEffect(() => {
        fetchContacts()
    }, [])

    const fetchContacts = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(API_ENDPOINTS.contacts)
            const data = await response.json()
            setContacts(data)
        } catch (error) {
            toast.error('Failed to load messages')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`${API_ENDPOINTS.contacts}/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            if (response.ok) {
                toast.success('Message deleted')
                fetchContacts()
            } else {
                const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
                toast.error(`Delete failed: ${error.detail || response.statusText}`)
            }
        } catch (error) {
            toast.error('Connection error: ' + error.message)
        }
    }

    if (isLoading && contacts.length === 0) {
        return <div className="py-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Loading Messages...</div>
    }

    return (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 animate-fade-in">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-brand-cream border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Sender</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Subject</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {contacts.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="px-6 py-20 text-center text-slate-400 font-medium">No messages found.</td>
                        </tr>
                    ) : (
                        contacts.map((item) => (
                            <tr key={item.id} className="hover:bg-brand-cream/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{item.name}</div>
                                    <div className="text-xs text-slate-500">{item.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-slate-700 font-medium truncate max-w-xs">{item.subject}</div>
                                    <div className="text-sm text-slate-400 truncate max-w-xs">{item.message}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-sm">{new Date(item.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                        <DeleteAction onDelete={() => handleDelete(item.id)} title="Delete Message" />
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default Admin
