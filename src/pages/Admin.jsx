import { AlertCircle, Archive, Bell, BookOpen, Calendar, Check, CheckCircle2, ChevronDown, ChevronRight, Clock, CreditCard, Edit2, Image, Inbox, LayoutDashboard, Loader2, LogOut, Mail, Menu, MessageSquare, Plus, Printer, Receipt, School, Search, Trash2, User, UserPlus, X } from 'lucide-react'
import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { toast } from 'react-toastify'
import { printReceiptPDF, printInvoicePDF, shareReceiptWhatsApp } from '../utils/pdfPrint'
import SideSheet from '../components/ui/SideSheet'
import DataTable from '../components/ui/DataTable'

// Centralised admin fetch wrapper. Attaches the admin bearer token and
// detects expired/forged sessions (401) so the user is redirected to
// /admin-login instead of staring at a half-broken dashboard. New admin
// fetch sites SHOULD use this helper rather than calling fetch() directly.
//
// Note: this returns the raw Response (like fetch). The existing
// `adminFetch` helper inside ERPManager wraps this and parses JSON.
//
// TODO(session-expiry): the remaining direct fetch(..., { headers: getAuthHeaders() })
// call sites in this file (events/announcements/faculty/gallery managers,
// content delete/restore helpers) still handle 401 locally. Migrate them
// to adminApiFetch over time so 401 handling stays in one place.
export const adminApiFetch = async (url, options = {}) => {
    const token = localStorage.getItem('adminToken')
    const { headers: extraHeaders, ...rest } = options
    const response = await fetch(url, {
        ...rest,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(extraHeaders || {}),
        },
    })
    if (response.status === 401) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminAuthenticated')
        toast.error('Session expired. Please log in again.')
        window.location.href = '/admin-login'
        throw new Error('Session expired')
    }
    return response
}

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
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-[10px] font-semibold text-white shadow-lg shadow-rose-600/30 transition-all hover:bg-rose-700 active:scale-95"
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

const websiteSections = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'messages', label: 'Messages', icon: <Mail size={18} /> },
    { id: 'activity', label: 'Activity', icon: <Clock size={18} /> },
    { id: 'announcements', label: 'Announcements', icon: <Bell size={18} /> },
    { id: 'events', label: 'Events', icon: <Calendar size={18} /> },
    { id: 'faculty', label: 'Faculty', icon: <User size={18} /> },
    { id: 'gallery', label: 'Gallery', icon: <Image size={18} /> },
]

const erpSections = [
    { id: 'teachers', label: 'Teachers', icon: <User size={18} /> },
    { id: 'classes', label: 'Classes & Subjects', icon: <BookOpen size={18} /> },
    { id: 'timetable', label: 'Timetable', icon: <Calendar size={18} /> },
    { id: 'fees', label: 'Fees & Invoices', icon: <CreditCard size={18} /> },
]

const Admin = () => {
    const [showAddForm, setShowAddForm] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

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

    const createTabs = ['events', 'announcements', 'faculty', 'gallery']
    const createLabels = {
        events: 'Add Event',
        announcements: 'New Announcement',
        faculty: 'Add Faculty',
        gallery: 'Upload Image',
    }

    const pathParts = location.pathname.split('/').filter(Boolean)
    const areaParam = pathParts[1]
    const sectionParam = pathParts[2]
    const activeArea = areaParam === 'erp' ? 'erp' : 'website'
    const activeSection = sectionParam || (activeArea === 'erp' ? 'teachers' : 'overview')
    const activeSectionList = activeArea === 'erp' ? erpSections : websiteSections
    const currentTab = activeSectionList.find((item) => item.id === activeSection) || activeSectionList[0]
    const canCreate = activeArea === 'website' && createTabs.includes(activeSection)

    React.useEffect(() => {
        if (location.pathname === '/admin') {
            navigate('/admin/website/overview', { replace: true })
            return
        }
        const validArea = areaParam === 'website' || areaParam === 'erp'
        const validSection = activeSectionList.some((item) => item.id === activeSection)
        if (!validArea || !validSection) {
            navigate('/admin/website/overview', { replace: true })
        }
    }, [activeArea, activeSection, activeSectionList, areaParam, location.pathname, navigate])

    const goToSection = (areaId, sectionId, shouldOpenForm = false) => {
        navigate(`/admin/${areaId}/${sectionId}`)
        setShowAddForm(shouldOpenForm && areaId === 'website' && createTabs.includes(sectionId))
        setDrawerOpen(false)
    }

    const jumpTo = (sectionId, shouldOpenForm = false) => {
        goToSection('website', sectionId, shouldOpenForm)
    }

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-5 py-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                        <School size={19} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Admin</p>
                        <p className="text-sm font-bold text-white">Edu Valley</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">Website</p>
                <div className="space-y-1">
                    {websiteSections.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => goToSection('website', item.id)}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                                activeArea === 'website' && activeSection === item.id
                                    ? 'bg-white/15 text-white'
                                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>

                <p className="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-widest text-white/40">School ERP</p>
                <div className="space-y-1">
                    {erpSections.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => goToSection('erp', item.id)}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                                activeArea === 'erp' && activeSection === item.id
                                    ? 'bg-white/15 text-white'
                                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>
            </nav>

            <div className="border-t border-white/10 p-4">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white/60 transition-all hover:bg-white/10 hover:text-white"
                >
                    <LogOut size={15} />
                    Logout
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 lg:pl-72">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 bg-brand-navy-700 lg:block">
                <SidebarContent />
            </aside>

            {drawerOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
                    <aside className="absolute left-0 top-0 h-full w-72 bg-brand-navy-700 shadow-2xl">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="px-4 py-4 md:px-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(true)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
                                aria-label="Open admin menu"
                            >
                                <Menu size={19} />
                            </button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="h-1 w-9 rounded-full bg-brand-navy-600" />
                                    <span className="text-xs font-semibold uppercase tracking-widest text-brand-navy-600">
                                        {activeArea === 'erp' ? 'School ERP' : 'Website'}
                                    </span>
                                </div>
                                <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-slate-900">{currentTab.label}</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <AdminNotificationCenter getAuthHeaders={getAuthHeaders} />
                            {canCreate && (
                                <button
                                    type="button"
                                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold shadow-lg transition-all active:scale-95 ${
                                        showAddForm
                                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            : 'bg-brand-navy-600 text-white shadow-brand-navy-600/20 hover:bg-brand-navy-700'
                                    }`}
                                    onClick={() => setShowAddForm(!showAddForm)}
                                >
                                    {showAddForm ? 'Hide Form' : createLabels[activeSection]}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-4 py-6 md:px-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
                    {activeArea === 'website' && activeSection === 'overview' && <AdminOverview getAuthHeaders={getAuthHeaders} onNavigate={jumpTo} />}
                    {activeArea === 'website' && activeSection === 'messages' && <MessagesManager getAuthHeaders={getAuthHeaders} />}
                    {activeArea === 'website' && activeSection === 'activity' && <ActivityManager getAuthHeaders={getAuthHeaders} />}
                    {activeArea === 'website' && activeSection === 'events' && <EventsManager showForm={showAddForm} setShowForm={setShowAddForm} getAuthHeaders={getAuthHeaders} />}
                    {activeArea === 'website' && activeSection === 'announcements' && <AnnouncementsManager showForm={showAddForm} setShowForm={setShowAddForm} getAuthHeaders={getAuthHeaders} />}
                    {activeArea === 'website' && activeSection === 'faculty' && <FacultyManager showForm={showAddForm} setShowForm={setShowAddForm} getAuthHeaders={getAuthHeaders} />}
                    {activeArea === 'website' && activeSection === 'gallery' && <GalleryManager showForm={showAddForm} setShowForm={setShowAddForm} getAuthHeaders={getAuthHeaders} />}
                    {activeArea === 'erp' && <ERPManager getAuthHeaders={getAuthHeaders} section={activeSection} onSectionChange={(id) => goToSection('erp', id)} />}
                </div>
            </main>
        </div>
    )
}

const adminMoney = (paise = 0) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((paise || 0) / 100)

const adminDate = (value) => {
    if (!value) return '—'
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

const timeAgo = (value) => {
    if (!value) return 'Just now'
    const diff = Date.now() - new Date(value).getTime()
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    if (diff < minute) return 'Just now'
    if (diff < hour) return `${Math.floor(diff / minute)}m ago`
    if (diff < day) return `${Math.floor(diff / hour)}h ago`
    return `${Math.floor(diff / day)}d ago`
}

const deleteWithUndo = ({ label, commit, onOptimisticRemove, onUndo }) => {
    let undone = false
    onOptimisticRemove?.()
    const toastId = toast(
        ({ closeToast }) => (
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{label} deleted.</span>
                <button
                    type="button"
                    onClick={() => {
                        undone = true
                        onUndo?.()
                        closeToast()
                    }}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-brand-navy-700"
                >
                    Undo
                </button>
            </div>
        ),
        { autoClose: 10000, closeOnClick: false }
    )
    window.setTimeout(async () => {
        if (undone) return
        try {
            await commit()
        } catch (error) {
            onUndo?.()
            toast.error(error.message || 'Delete failed')
        } finally {
            toast.dismiss(toastId)
        }
    }, 10000)
}

const contentUrl = (endpoint, showTrash) => `${endpoint}${showTrash ? '?trash=true' : ''}`

const commitContentDeletes = async (endpoint, ids, getAuthHeaders) => {
    const responses = await Promise.all(ids.map((id) => fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    })))
    const failed = responses.find((response) => !response.ok)
    if (failed) {
        const error = await failed.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(error.detail || failed.statusText)
    }
}

const restoreContentRows = async (endpoint, ids, getAuthHeaders) => {
    const responses = await Promise.all(ids.map((id) => fetch(`${endpoint}/${id}/restore`, {
        method: 'PATCH',
        headers: getAuthHeaders()
    })))
    const failed = responses.find((response) => !response.ok)
    if (failed) {
        const error = await failed.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(error.detail || failed.statusText)
    }
}

const buildImageUploadFormData = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    if (!file.type.startsWith('image/')) return formData
    try {
        const bitmap = await createImageBitmap(file)
        const max = 360
        const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(bitmap.width * scale))
        canvas.height = Math.max(1, Math.round(bitmap.height * scale))
        const ctx = canvas.getContext('2d')
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.78))
        if (blob) {
            formData.append('thumbnail', new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' }))
        }
        bitmap.close?.()
    } catch {
        return formData
    }
    return formData
}

const getStoredMessageState = () => {
    try {
        return JSON.parse(localStorage.getItem('adminMessageState') || '{}')
    } catch {
        return {}
    }
}

const AdminOverview = ({ getAuthHeaders, onNavigate }) => {
    const [data, setData] = useState({
        contacts: [],
        events: [],
        announcements: [],
        gallery: [],
        leaves: [],
        feeSummary: null,
    })
    const [loading, setLoading] = useState(true)
    const baseUrl = import.meta.env.VITE_API_URL || ''

    React.useEffect(() => {
        const fetchJson = async (url, auth = false) => {
            const response = auth
                ? await adminApiFetch(url)
                : await fetch(url)
            if (!response.ok) throw new Error('Overview request failed')
            return response.json()
        }

        const load = async () => {
            setLoading(true)
            const [contacts, events, announcements, gallery, leaves, feeSummary] = await Promise.allSettled([
                fetchJson(API_ENDPOINTS.contacts, true),
                fetchJson(API_ENDPOINTS.events),
                fetchJson(API_ENDPOINTS.announcements),
                fetchJson(API_ENDPOINTS.gallery),
                fetchJson(`${baseUrl}/admin/erp/leaves`, true),
                fetchJson(`${baseUrl}/admin/erp/fees/summary`, true),
            ])

            setData({
                contacts: contacts.status === 'fulfilled' ? contacts.value : [],
                events: events.status === 'fulfilled' ? events.value : [],
                announcements: announcements.status === 'fulfilled' ? announcements.value : [],
                gallery: gallery.status === 'fulfilled' ? gallery.value : [],
                leaves: leaves.status === 'fulfilled' ? leaves.value : [],
                feeSummary: feeSummary.status === 'fulfilled' ? feeSummary.value : null,
            })
            setLoading(false)
        }

        load()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const now = new Date()
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(now.getDate() + 7)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)

    const unreadMessages = data.contacts.filter((message) => message.status !== 'archived' && !message.read).length
    const upcomingEvents = data.events.filter((event) => {
        const date = new Date(event.date)
        return date >= new Date(now.toDateString()) && date <= sevenDaysFromNow
    }).length
    const pendingLeaves = data.leaves.filter((leave) => leave.status === 'pending').length
    const recentGallery = data.gallery.filter((image) => new Date(image.created_at) >= sevenDaysAgo).length

    const kpis = [
        { label: 'Unread messages', value: unreadMessages, sub: `${data.contacts.length} total`, icon: <Inbox size={22} />, tone: 'bg-brand-crimson-50 text-brand-crimson-700' },
        { label: 'Upcoming events', value: upcomingEvents, sub: 'Next 7 days', icon: <Calendar size={22} />, tone: 'bg-brand-navy-50 text-brand-navy-700' },
        { label: 'Pending leaves', value: pendingLeaves, sub: 'Needs review', icon: <AlertCircle size={22} />, tone: 'bg-amber-50 text-amber-700' },
        { label: 'Fee dues', value: data.feeSummary ? adminMoney(data.feeSummary.outstanding_paise) : '—', sub: 'Outstanding', icon: <CreditCard size={22} />, tone: 'bg-rose-50 text-rose-700' },
        { label: 'Announcements', value: data.announcements.length, sub: 'Active posts', icon: <Bell size={22} />, tone: 'bg-brand-gold-50 text-brand-gold-700' },
        { label: 'Gallery uploads', value: recentGallery, sub: 'Last 7 days', icon: <Image size={22} />, tone: 'bg-slate-100 text-slate-700' },
    ]

    const activity = [
        ...data.contacts.map((item) => ({ id: `contact-${item.id}`, actor: item.name, action: 'sent a message', entity: item.subject, at: item.created_at, icon: <Mail size={15} /> })),
        ...data.events.map((item) => ({ id: `event-${item.id}`, actor: 'Admin', action: 'published event', entity: item.title, at: item.created_at, icon: <Calendar size={15} /> })),
        ...data.announcements.map((item) => ({ id: `announcement-${item.id}`, actor: 'Admin', action: 'posted announcement', entity: item.title, at: item.created_at, icon: <Bell size={15} /> })),
        ...data.gallery.map((item) => ({ id: `gallery-${item.id}`, actor: 'Admin', action: 'uploaded image', entity: item.title, at: item.created_at, icon: <Image size={15} /> })),
    ].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)).slice(0, 15)

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-20 rounded-2xl bg-slate-100" />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-32 rounded-2xl bg-slate-100" />)}
                </div>
                <div className="h-72 rounded-2xl bg-slate-100" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col justify-between gap-4 rounded-3xl border border-brand-navy-100 bg-brand-navy-50 p-6 md:flex-row md:items-center">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-brand-navy-600">Today</p>
                    <h2 className="mt-1 font-display text-3xl font-bold text-slate-950">Good day, Admin</h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">{new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => onNavigate('announcements', true)} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy-700 shadow-sm hover:bg-brand-navy-100">New Announcement</button>
                    <button type="button" onClick={() => onNavigate('events', true)} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy-700 shadow-sm hover:bg-brand-navy-100">New Event</button>
                    <button type="button" onClick={() => onNavigate('gallery', true)} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy-700 shadow-sm hover:bg-brand-navy-100">Upload Image</button>
                    <button type="button" onClick={() => onNavigate('messages')} className="rounded-xl bg-brand-navy-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-navy-800">View Messages</button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${kpi.tone}`}>{kpi.icon}</div>
                        <p className="font-display text-3xl font-bold text-slate-900">{kpi.value}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">{kpi.label}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{kpi.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-lg font-bold text-slate-950">Recent activity</h2>
                    </div>
                    {activity.length === 0 ? (
                        <div className="p-6">
                            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-medium text-slate-500">No recent website activity yet.</div>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {activity.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">{item.icon}</div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-900">{item.actor} <span className="font-medium text-slate-500">{item.action}</span></p>
                                        <p className="truncate text-xs text-slate-500">{item.entity}</p>
                                    </div>
                                    <time className="shrink-0 font-mono text-xs font-medium text-slate-400">{timeAgo(item.at)}</time>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-950">Pending messages</h2>
                        <button type="button" onClick={() => onNavigate('messages')} className="text-xs font-semibold text-brand-navy-600 hover:text-brand-navy-800">Open inbox</button>
                    </div>
                    {data.contacts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-medium text-slate-500">No contact messages yet.</div>
                    ) : (
                        <div className="space-y-3">
                            {data.contacts.slice(0, 5).map((message) => (
                                <button key={message.id} type="button" onClick={() => onNavigate('messages')} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-brand-navy-200 hover:bg-brand-navy-50">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="truncate text-sm font-semibold text-slate-900">{message.name}</p>
                                        <span className="font-mono text-[11px] font-medium text-slate-400">{timeAgo(message.created_at)}</span>
                                    </div>
                                    <p className="mt-1 truncate text-xs font-medium text-slate-500">{message.subject}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const MessagesManager = ({ getAuthHeaders }) => {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')

    const load = async () => {
        setLoading(true)
        try {
            const response = await adminApiFetch(API_ENDPOINTS.contacts)
            if (!response.ok) throw new Error('Could not load contact messages')
            const data = await response.json()
            setMessages(data)
            if (!selectedId && data.length > 0) setSelectedId(data[0].id)
        } catch (error) {
            toast.error(error.message || 'Failed to load messages')
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const statusOf = (message) => message.status || 'new'
    const isRead = (message) => Boolean(message.read)

    const markMessage = async (id, updates) => {
        setMessages((prev) => prev.map((message) => (
            message.id === id ? { ...message, ...updates } : message
        )))
        try {
            const response = await adminApiFetch(`${API_ENDPOINTS.contacts}/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(updates),
            })
            if (!response.ok) throw new Error('Could not update message')
            const updated = await response.json()
            setMessages((prev) => prev.map((message) => (
                message.id === id ? updated : message
            )))
        } catch (error) {
            toast.error(error.message || 'Message update failed')
            load()
        }
    }

    const selected = messages.find((message) => message.id === selectedId) || null

    React.useEffect(() => {
        if (selected && !isRead(selected)) markMessage(selected.id, { read: true })
    }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

    const counts = messages.reduce((acc, message) => {
        const status = statusOf(message)
        acc.all += 1
        if (status === 'archived') acc.archived += 1
        else if (status === 'responded') acc.responded += 1
        else if (!isRead(message)) acc.unread += 1
        return acc
    }, { all: 0, unread: 0, responded: 0, archived: 0 })

    const filtered = messages.filter((message) => {
        const status = statusOf(message)
        const matchesFilter =
            filter === 'all' ||
            (filter === 'unread' && status !== 'archived' && !isRead(message)) ||
            (filter === 'responded' && status === 'responded') ||
            (filter === 'archived' && status === 'archived')
        const query = search.trim().toLowerCase()
        const matchesSearch = !query || [message.name, message.email, message.subject, message.message].some((value) => value?.toLowerCase().includes(query))
        return matchesFilter && matchesSearch
    })

    const deleteMessage = async (id) => {
        try {
            const response = await adminApiFetch(`${API_ENDPOINTS.contacts}/${id}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Could not delete message')
            setMessages((prev) => prev.filter((message) => message.id !== id))
            setSelectedId((prev) => prev === id ? null : prev)
            toast.success('Message deleted')
        } catch (error) {
            toast.error(error.message || 'Delete failed')
        }
    }

    const mailtoHref = selected
        ? `mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}&body=${encodeURIComponent(`Hi ${selected.name},\n\n\n\n--\nNarendra Edu Valley\n\nOriginal message:\n${selected.message}`)}`
        : '#'

    if (loading) {
        return (
            <div className="grid gap-6 xl:grid-cols-[360px_1fr] animate-pulse">
                <div className="h-[520px] rounded-2xl bg-slate-100" />
                <div className="h-[520px] rounded-2xl bg-slate-100" />
            </div>
        )
    }

    return (
        <div className="grid min-h-[560px] gap-6 xl:grid-cols-[380px_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-4">
                    <div className="relative">
                        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search messages"
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-100"
                        />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {[
                            ['all', 'All', counts.all],
                            ['unread', 'Unread', counts.unread],
                            ['responded', 'Responded', counts.responded],
                            ['archived', 'Archived', counts.archived],
                        ].map(([id, label, count]) => (
                            <button key={id} type="button" onClick={() => setFilter(id)}
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === id ? 'bg-brand-navy-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                {label} {count}
                            </button>
                        ))}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="p-6">
                        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                            <Inbox size={30} className="mx-auto mb-3 text-slate-300" />
                            <p className="text-sm font-semibold text-slate-500">No messages match this filter.</p>
                        </div>
                    </div>
                ) : (
                    <div className="max-h-[640px] divide-y divide-slate-100 overflow-y-auto">
                        {filtered.map((message) => {
                            const unread = statusOf(message) !== 'archived' && !isRead(message)
                            return (
                                <button key={message.id} type="button" onClick={() => setSelectedId(message.id)}
                                    className={`flex w-full gap-3 px-4 py-4 text-left transition-colors ${selectedId === message.id ? 'bg-brand-navy-50' : 'hover:bg-slate-50'}`}>
                                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${unread ? 'bg-brand-crimson-500' : 'bg-transparent'}`} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="truncate text-sm font-semibold text-slate-900">{message.name}</p>
                                            <time className="shrink-0 font-mono text-[11px] font-medium text-slate-400">{timeAgo(message.created_at)}</time>
                                        </div>
                                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-600">{message.subject}</p>
                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{message.message}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                {!selected ? (
                    <div className="flex h-full min-h-[480px] flex-col items-center justify-center p-10 text-center">
                        <MessageSquare size={42} className="mb-4 text-slate-300" />
                        <p className="text-base font-semibold text-slate-600">Select a message from the list to view it.</p>
                    </div>
                ) : (
                    <div className="flex h-full flex-col">
                        <div className="border-b border-slate-100 p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-brand-navy-50 px-3 py-1 text-xs font-semibold text-brand-navy-700">{statusOf(selected)}</span>
                                        <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-slate-400"><Clock size={13} /> {adminDate(selected.created_at)}</span>
                                    </div>
                                    <h2 className="font-display text-2xl font-bold text-slate-950">{selected.subject}</h2>
                                    <p className="mt-1 text-sm font-medium text-slate-500">{selected.name} · {selected.email}{selected.phone ? ` · ${selected.phone}` : ''}</p>
                                </div>
                                <button type="button" onClick={() => deleteMessage(selected.id)} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete message">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-6">
                            <div className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">{selected.message}</div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4">
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => markMessage(selected.id, { status: 'responded', read: true })} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
                                    <CheckCircle2 size={16} /> Mark Responded
                                </button>
                                <button type="button" onClick={() => markMessage(selected.id, { status: 'archived', read: true })} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                                    <Archive size={16} /> Archive
                                </button>
                            </div>
                            <a href={mailtoHref} className="inline-flex items-center gap-2 rounded-xl bg-brand-navy-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-800">
                                <Mail size={16} /> Reply via Email
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Image Picker Component
const ImagePicker = ({ onSelect, onClose }) => {
    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [uploading, setUploading] = useState(false)

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

    const uploadAndSelect = async (file) => {
        if (!file) return
        setUploading(true)
        try {
            const body = await buildImageUploadFormData(file)
            const response = await fetch(API_ENDPOINTS.upload, { method: 'POST', body })
            if (!response.ok) throw new Error('Upload failed')
            const data = await response.json()
            toast.success('Image uploaded')
            onSelect(data.url)
        } catch (error) {
            toast.error(error.message || 'Image upload failed')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl max-h-[80vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-display font-bold text-slate-900">Select Image</h3>
                        <p className="text-slate-500 text-sm">Choose from existing gallery images</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <div className="space-y-3 border-b border-slate-100 bg-brand-cream p-4">
                    <input
                        type="text"
                        placeholder="Search by title or category..."
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                    <label
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                            event.preventDefault()
                            uploadAndSelect(event.dataTransfer.files?.[0])
                        }}
                        className={`flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-brand-navy-200 bg-white px-4 py-5 text-sm font-semibold text-brand-navy-700 transition-all hover:border-brand-navy-400 ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                    >
                        <input type="file" accept="image/*" className="hidden" onChange={(event) => uploadAndSelect(event.target.files?.[0])} />
                        {uploading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Image size={16} className="mr-2" />}
                        Drag an image here or choose a file
                    </label>
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

const ActivityManager = ({ getAuthHeaders }) => {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)

    React.useEffect(() => {
        adminApiFetch(`${API_BASE}/admin/activity`)
            .then((response) => {
                if (!response.ok) throw new Error('Could not load activity')
                return response.json()
            })
            .then(setRows)
            .catch((error) => toast.error(error.message || 'Activity failed to load'))
            .finally(() => setLoading(false))
    }, []) // eslint-disable-line

    if (loading) {
        return <div className="skeleton h-72 rounded-2xl" />
    }

    const entityTypes = Array.from(new Set(rows.map((row) => row.entity_type).filter(Boolean))).sort()

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="font-display text-2xl font-bold text-slate-950">Recent Activity</h2>
                    <p className="text-sm font-medium text-slate-500">Server-side mutation history across admin and ERP actions.</p>
                </div>
            </div>
            <DataTable
                rows={rows}
                searchPlaceholder="Search activity by actor, action, or entity"
                emptyMessage="No activity has been recorded yet."
                getRowKey={(row) => row.id}
                filters={[
                    {
                        key: 'entity',
                        label: 'All entities',
                        accessor: (row) => row.entity_type,
                        options: entityTypes.map((type) => ({ value: type, label: type.replaceAll('_', ' ') })),
                    },
                ]}
                columns={[
                    {
                        key: 'created_at',
                        header: 'When',
                        accessor: (row) => row.created_at,
                        sortValue: (row) => row.created_at,
                        render: (row) => <span className="font-mono text-xs font-medium text-slate-600">{adminDate(row.created_at)} · {timeAgo(row.created_at)}</span>,
                    },
                    {
                        key: 'actor',
                        header: 'Actor',
                        accessor: (row) => row.actor_email || row.actor_kind,
                        render: (row) => <span className="font-semibold text-slate-900">{row.actor_email || row.actor_kind}</span>,
                    },
                    {
                        key: 'action',
                        header: 'Action',
                        accessor: (row) => `${row.action} ${row.entity_type} ${row.entity_id || ''}`,
                        render: (row) => (
                            <div>
                                <p className="font-semibold capitalize text-slate-900">{row.action}</p>
                                <p className="text-xs font-medium text-slate-500">{row.entity_type.replaceAll('_', ' ')} {row.entity_id ? `#${row.entity_id}` : ''}</p>
                            </div>
                        ),
                    },
                    {
                        key: 'details',
                        header: 'Details',
                        sortable: false,
                        searchable: false,
                        export: false,
                        render: (row) => (
                            <details className="max-w-md">
                                <summary className="cursor-pointer text-xs font-semibold text-brand-navy-600">View payload</summary>
                                <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600">
                                    {JSON.stringify({ before: row.before_json ? JSON.parse(row.before_json) : null, after: row.after_json ? JSON.parse(row.after_json) : null }, null, 2)}
                                </pre>
                            </details>
                        ),
                    },
                ]}
            />
        </div>
    )
}

const AdminNotificationCenter = ({ getAuthHeaders }) => {
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState([])

    const load = async () => {
        try {
            const response = await adminApiFetch(`${API_BASE}/admin/notifications`)
            if (!response.ok) throw new Error('Could not load notifications')
            setItems(await response.json())
        } catch {
            setItems([])
        }
    }

    React.useEffect(() => { load() }, []) // eslint-disable-line

    const unread = items.filter((item) => !item.read)

    const markRead = async (item) => {
        if (item.read) return
        const response = await adminApiFetch(`${API_BASE}/admin/notifications/${item.id}/read`, {
            method: 'PATCH',
        })
        if (response.ok) {
            const updated = await response.json()
            setItems((current) => current.map((row) => row.id === item.id ? updated : row))
        }
    }

    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen((value) => !value)} className="relative rounded-xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50" aria-label="Notifications">
                <Bell size={18} />
                {unread.length > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-crimson-600 px-1 text-[10px] font-bold text-white">{unread.length}</span>}
            </button>
            {open && (
                <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <p className="font-bold text-slate-950">Notifications</p>
                        <button type="button" onClick={load} className="text-xs font-semibold text-brand-navy-600">Refresh</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {items.length === 0 ? (
                            <div className="p-6 text-center text-sm font-medium text-slate-500">No notifications yet.</div>
                        ) : items.map((item) => (
                            <button key={item.id} type="button" onClick={() => markRead(item)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 ${item.read ? 'bg-white' : 'bg-brand-navy-50'}`}>
                                <p className="text-sm font-bold text-slate-950">{item.title}</p>
                                {item.body && <p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p>}
                                <p className="mt-1 font-mono text-[11px] text-slate-400">{timeAgo(item.created_at)}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
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
    const [showTrash, setShowTrash] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        image_url: ''
    })

    React.useEffect(() => {
        fetchEvents()
    }, [showTrash])

    const fetchEvents = async () => {
        try {
            const response = await fetch(contentUrl(API_ENDPOINTS.events, showTrash), { headers: getAuthHeaders() })
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
        const uploadFormData = await buildImageUploadFormData(file)

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
                toast.success('Event saved')
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
    }

    const handleDelete = async (id) => {
        const previous = events
        deleteWithUndo({
            label: 'Event',
            onOptimisticRemove: () => setEvents((current) => current.filter((event) => event.id !== id)),
            onUndo: () => setEvents(previous),
            commit: async () => {
                await commitContentDeletes(API_ENDPOINTS.events, [id], getAuthHeaders)
            },
        })
    }

    const handleBulkDelete = async (rows) => {
        const ids = rows.map((event) => event.id)
        const previous = events
        deleteWithUndo({
            label: `${ids.length} event${ids.length === 1 ? '' : 's'}`,
            onOptimisticRemove: () => setEvents((current) => current.filter((event) => !ids.includes(event.id))),
            onUndo: () => setEvents(previous),
            commit: async () => commitContentDeletes(API_ENDPOINTS.events, ids, getAuthHeaders),
        })
    }

    const handleRestore = async (ids) => {
        try {
            await restoreContentRows(API_ENDPOINTS.events, ids, getAuthHeaders)
            setEvents((current) => current.filter((event) => !ids.includes(event.id)))
            toast.success(`${ids.length} event${ids.length === 1 ? '' : 's'} restored`)
        } catch (error) {
            toast.error(error.message || 'Restore failed')
        }
    }

    const resetForm = () => {
        setFormData({ title: '', description: '', date: '', location: '', image_url: '' })
        setEditingId(null)
        setShowForm(false)
    }

    React.useEffect(() => {
        if (!showForm && editingId) {
            setFormData({ title: '', description: '', date: '', location: '', image_url: '' })
            setEditingId(null)
        }
    }, [showForm, editingId])

    return (
        <div className="space-y-8 animate-fade-in">
            <SideSheet
                open={showForm}
                onClose={resetForm}
                title={editingId ? 'Edit Event' : 'Create Event'}
                description={editingId ? 'Update the selected event without losing your place in the list.' : 'Add a new event to the website calendar.'}
                footer={(
                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="event-manager-form"
                            disabled={isSubmitting || isUploading}
                            className="rounded-xl bg-brand-navy-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-navy-700/20 hover:bg-brand-navy-800 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Event'}
                        </button>
                    </div>
                )}
            >
                <form id="event-manager-form" onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-xs font-medium text-slate-600">Event Title</label>
                        <input
                            type="text"
                            placeholder="Enter event name..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-100"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-medium text-slate-600">Event Description</label>
                        <textarea
                            placeholder="Describe the event details..."
                            rows={5}
                            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-100"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-medium text-slate-600">Date</label>
                        <input
                            type="date"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition-all focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-100"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-medium text-slate-600">Location</label>
                        <input
                            type="text"
                            placeholder="e.g., Auditorium OR Auditorium https://maps..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-100"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                        <p className="mt-1 text-[11px] font-medium text-slate-400">Tip: Use a space to separate name and URL.</p>
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-medium text-slate-600">Image</label>
                        <div className="space-y-3">
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-100"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                />
                                <div className="flex gap-2">
                                    <label className={`flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 transition-all hover:bg-slate-200 ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                        />
                                        {isUploading ? (
                                            <Loader2 size={18} className="animate-spin text-slate-500" />
                                        ) : (
                                            <Image size={18} className="text-slate-500" />
                                        )}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowImagePicker(true)}
                                        className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-200"
                                    >
                                        Gallery
                                    </button>
                                </div>
                            </div>
                            {formData.image_url && (
                                <div className="relative h-36 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                    <img src={formData.image_url} alt="Preview" className="h-full w-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </SideSheet>
            {showImagePicker && (
                <ImagePicker
                    onSelect={(url) => {
                        setFormData({ ...formData, image_url: url })
                        setShowImagePicker(false)
                    }}
                    onClose={() => setShowImagePicker(false)}
                />
            )}

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => {
                        resetForm()
                        setShowTrash((current) => !current)
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                    <Archive size={16} />
                    {showTrash ? 'Active Events' : 'Trash'}
                </button>
            </div>

            <DataTable
                rows={events}
                searchPlaceholder={showTrash ? 'Search deleted events' : 'Search events by title, date, or location'}
                emptyMessage={showTrash ? 'No deleted events in trash.' : 'No events match the current view.'}
                getRowKey={(event) => event.id}
                rowClassName={(event) => editingId === event.id ? 'bg-brand-navy-50' : 'hover:bg-brand-cream/50'}
                bulkActions={showTrash ? [
                    {
                        label: 'Restore selected',
                        icon: <CheckCircle2 size={15} />,
                        onClick: (rows) => handleRestore(rows.map((event) => event.id)),
                    },
                ] : [
                    {
                        label: 'Delete selected',
                        icon: <Trash2 size={15} />,
                        tone: 'danger',
                        onClick: handleBulkDelete,
                    },
                ]}
                filters={[
                    {
                        key: 'period',
                        label: 'All dates',
                        accessor: (event) => {
                            const eventDate = new Date(event.date)
                            const todayDate = new Date(new Date().toDateString())
                            return eventDate >= todayDate ? 'upcoming' : 'past'
                        },
                        options: [
                            { value: 'upcoming', label: 'Upcoming' },
                            { value: 'past', label: 'Past' },
                        ],
                    },
                ]}
                columns={[
                    {
                        key: 'title',
                        header: 'Title',
                        accessor: (event) => event.title,
                        render: (event) => <span className="font-bold text-slate-900">{event.title}</span>,
                    },
                    {
                        key: 'date',
                        header: 'Date',
                        accessor: (event) => event.date,
                        sortValue: (event) => event.date,
                        render: (event) => (
                            <span className="font-mono text-sm font-medium text-slate-600">
                                {new Date(event.date).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                })}
                            </span>
                        ),
                    },
                    {
                        key: 'location',
                        header: 'Location',
                        accessor: (event) => event.location || '',
                        render: (event) => (
                            <span className="block max-w-[220px] truncate text-slate-500">
                                {event.location?.startsWith('http') ? (
                                    <a href={event.location} target="_blank" rel="noopener noreferrer" className="text-brand-navy-600 hover:underline">
                                        View Map
                                    </a>
                                ) : (
                                    event.location || 'Not set'
                                )}
                            </span>
                        ),
                    },
                    {
                        key: 'actions',
                        header: 'Actions',
                        sortable: false,
                        searchable: false,
                        export: false,
                        className: 'text-right',
                        cellClassName: 'text-right',
                        render: (event) => (
                            <div className="flex items-center justify-end gap-2">
                                {showTrash ? (
                                    <button
                                        type="button"
                                        className="rounded-lg bg-emerald-50 p-2 text-emerald-700 shadow-sm transition-all hover:bg-emerald-600 hover:text-white"
                                        onClick={() => handleRestore([event.id])}
                                        title="Restore Event"
                                    >
                                        <CheckCircle2 size={16} />
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className="rounded-lg bg-brand-navy-50 p-2 text-brand-navy-600 shadow-sm transition-all hover:bg-brand-navy-600 hover:text-white"
                                            onClick={() => handleEdit(event)}
                                            title="Edit Event"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <DeleteAction onDelete={() => handleDelete(event.id)} />
                                    </>
                                )}
                            </div>
                        ),
                    },
                ]}
            />
        </div>
    )
}

// Announcements Manager
const AnnouncementsManager = ({ showForm, setShowForm, getAuthHeaders }) => {
    const [announcements, setAnnouncements] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showTrash, setShowTrash] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'normal'
    })

    React.useEffect(() => {
        fetchAnnouncements()
    }, [showTrash])

    const fetchAnnouncements = async () => {
        try {
            const response = await fetch(contentUrl(API_ENDPOINTS.announcements, showTrash), { headers: getAuthHeaders() })
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
    }

    const handleDelete = async (id) => {
        const previous = announcements
        deleteWithUndo({
            label: 'Announcement',
            onOptimisticRemove: () => setAnnouncements((current) => current.filter((item) => item.id !== id)),
            onUndo: () => setAnnouncements(previous),
            commit: async () => {
                await commitContentDeletes(API_ENDPOINTS.announcements, [id], getAuthHeaders)
            },
        })
    }

    const handleBulkDelete = async (rows) => {
        const ids = rows.map((item) => item.id)
        const previous = announcements
        deleteWithUndo({
            label: `${ids.length} announcement${ids.length === 1 ? '' : 's'}`,
            onOptimisticRemove: () => setAnnouncements((current) => current.filter((item) => !ids.includes(item.id))),
            onUndo: () => setAnnouncements(previous),
            commit: async () => commitContentDeletes(API_ENDPOINTS.announcements, ids, getAuthHeaders),
        })
    }

    const handleRestore = async (ids) => {
        try {
            await restoreContentRows(API_ENDPOINTS.announcements, ids, getAuthHeaders)
            setAnnouncements((current) => current.filter((item) => !ids.includes(item.id)))
            toast.success(`${ids.length} announcement${ids.length === 1 ? '' : 's'} restored`)
        } catch (error) {
            toast.error(error.message || 'Restore failed')
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
            <SideSheet
                open={showForm}
                onClose={resetForm}
                title={editingId ? 'Edit Announcement' : 'Post Announcement'}
                description="Keep the announcement list in view while creating or editing content."
            >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="mb-2 ml-1 block text-xs font-medium text-slate-600">Title</label>
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
                            <label className="mb-2 ml-1 block text-xs font-medium text-slate-600">Content</label>
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
                            <label className="mb-2 ml-1 block text-xs font-medium text-slate-600">Priority Level</label>
                            <div className="flex flex-wrap gap-4">
                                {['low', 'normal', 'high'].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setFormData({...formData, priority: p})}
                                        className={`px-6 py-2 rounded-lg border-2 text-xs font-semibold capitalize transition-all ${
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
                                className="bg-brand-navy-600 hover:bg-brand-navy-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-brand-navy-600/20 transition-all active:scale-95"
                            >
                                {isSubmitting ? 'Posting...' : editingId ? 'Update' : 'Post Now'}
                            </button>
                        </div>
                    </form>
            </SideSheet>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => {
                        resetForm()
                        setShowTrash((current) => !current)
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                    <Archive size={16} />
                    {showTrash ? 'Active Announcements' : 'Trash'}
                </button>
            </div>

            <DataTable
                rows={announcements}
                searchPlaceholder={showTrash ? 'Search deleted announcements' : 'Search announcements by title, content, or priority'}
                emptyMessage={showTrash ? 'No deleted announcements in trash.' : 'No announcements match the current view.'}
                getRowKey={(item) => item.id}
                rowClassName={(item) => editingId === item.id ? 'bg-brand-navy-50' : 'hover:bg-brand-cream/50'}
                bulkActions={showTrash ? [
                    {
                        label: 'Restore selected',
                        icon: <CheckCircle2 size={15} />,
                        onClick: (rows) => handleRestore(rows.map((item) => item.id)),
                    },
                ] : [
                    {
                        label: 'Delete selected',
                        icon: <Trash2 size={15} />,
                        tone: 'danger',
                        onClick: handleBulkDelete,
                    },
                ]}
                filters={[
                    {
                        key: 'priority',
                        label: 'All priorities',
                        accessor: (item) => item.priority || 'normal',
                        options: [
                            { value: 'high', label: 'High' },
                            { value: 'normal', label: 'Normal' },
                            { value: 'low', label: 'Low' },
                        ],
                    },
                ]}
                columns={[
                    {
                        key: 'title',
                        header: 'Title',
                        accessor: (item) => `${item.title} ${item.content}`,
                        render: (item) => (
                            <div>
                                <p className="font-bold text-slate-900">{item.title}</p>
                                <p className="mt-1 max-w-[420px] truncate text-sm text-slate-500">{item.content}</p>
                            </div>
                        ),
                    },
                    {
                        key: 'priority',
                        header: 'Priority',
                        accessor: (item) => item.priority || 'normal',
                        render: (item) => (
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getPriorityColor(item.priority)}`}>
                                {item.priority || 'normal'}
                            </span>
                        ),
                    },
                    {
                        key: 'created_at',
                        header: 'Date',
                        accessor: (item) => item.created_at,
                        sortValue: (item) => item.created_at,
                        render: (item) => <span className="font-mono text-sm font-medium text-slate-600">{adminDate(item.created_at)}</span>,
                    },
                    {
                        key: 'actions',
                        header: 'Actions',
                        sortable: false,
                        searchable: false,
                        export: false,
                        className: 'text-right',
                        cellClassName: 'text-right',
                        render: (item) => (
                            <div className="flex items-center justify-end gap-2">
                                {showTrash ? (
                                    <button
                                        type="button"
                                        className="rounded-lg bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                                        onClick={() => handleRestore([item.id])}
                                        title="Restore announcement"
                                    >
                                        <CheckCircle2 size={16} />
                                    </button>
                                ) : (
                                    <>
                                        <button className="rounded-lg bg-brand-navy-50 p-2 text-brand-navy-600 hover:bg-brand-navy-600 hover:text-white" onClick={() => handleEdit(item)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <DeleteAction onDelete={() => handleDelete(item.id)} />
                                    </>
                                )}
                            </div>
                        ),
                    },
                ]}
            />
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
    const [showTrash, setShowTrash] = useState(false)
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
    }, [showTrash])

    const fetchFaculty = async () => {
        try {
            const response = await fetch(contentUrl(API_ENDPOINTS.faculty, showTrash), { headers: getAuthHeaders() })
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
        const uploadFormData = await buildImageUploadFormData(file)

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
    }

    const handleDelete = async (id) => {
        const previous = faculty
        deleteWithUndo({
            label: 'Faculty member',
            onOptimisticRemove: () => setFaculty((current) => current.filter((item) => item.id !== id)),
            onUndo: () => setFaculty(previous),
            commit: async () => {
                await commitContentDeletes(API_ENDPOINTS.faculty, [id], getAuthHeaders)
            },
        })
    }

    const handleBulkDelete = async (rows) => {
        const ids = rows.map((item) => item.id)
        const previous = faculty
        deleteWithUndo({
            label: `${ids.length} faculty member${ids.length === 1 ? '' : 's'}`,
            onOptimisticRemove: () => setFaculty((current) => current.filter((item) => !ids.includes(item.id))),
            onUndo: () => setFaculty(previous),
            commit: async () => commitContentDeletes(API_ENDPOINTS.faculty, ids, getAuthHeaders),
        })
    }

    const handleRestore = async (ids) => {
        try {
            await restoreContentRows(API_ENDPOINTS.faculty, ids, getAuthHeaders)
            setFaculty((current) => current.filter((item) => !ids.includes(item.id)))
            toast.success(`${ids.length} faculty member${ids.length === 1 ? '' : 's'} restored`)
        } catch (error) {
            toast.error(error.message || 'Restore failed')
        }
    }

    const resetForm = () => {
        setFormData({ name: '', position: '', department: '', email: '', phone: '', bio: '', image_url: '' })
        setEditingId(null)
        setShowForm(false)
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <SideSheet
                open={showForm}
                onClose={resetForm}
                title={editingId ? 'Edit Faculty Member' : 'Add Faculty Member'}
                description="Create or update faculty profiles without losing list context."
            >
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 ml-1 block text-xs font-medium text-slate-600">Full Name</label>
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
                                <label className="mb-2 ml-1 block text-xs font-medium text-slate-600">Position</label>
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
                                <label className="mb-2 ml-1 block text-xs font-medium text-slate-600">Department</label>
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
                                    <label className="mb-2 ml-1 block text-xs font-medium text-slate-600">Email</label>
                                    <input
                                        type="email"
                                        inputMode="email"
                                        placeholder="Email Address"
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 ml-1 block text-xs font-medium text-slate-600">Phone</label>
                                    <input
                                        type="tel"
                                        inputMode="tel"
                                        placeholder="Phone Number"
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 ml-1 block text-xs font-medium text-slate-600">Short Bio</label>
                                <textarea
                                    placeholder="Tell us about this member..."
                                    rows={2}
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-brand-navy-500 transition-all resize-none"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-2 ml-1 block text-xs font-medium text-slate-600">Profile Photo</label>
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
                                className="bg-brand-navy-600 hover:bg-brand-navy-700 text-white font-semibold px-10 py-3 rounded-xl shadow-lg shadow-brand-navy-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isSubmitting ? 'Processing...' : editingId ? 'Update Member' : 'Add Member'}
                            </button>
                        </div>
                    </form>
            </SideSheet>
            {showImagePicker && (
                <ImagePicker
                    onSelect={(url) => {
                        setFormData({ ...formData, image_url: url })
                        setShowImagePicker(false)
                    }}
                    onClose={() => setShowImagePicker(false)}
                />
            )}

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => {
                        resetForm()
                        setShowTrash((current) => !current)
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                    <Archive size={16} />
                    {showTrash ? 'Active Faculty' : 'Trash'}
                </button>
            </div>

            <DataTable
                rows={faculty}
                searchPlaceholder={showTrash ? 'Search deleted faculty' : 'Search faculty by name, role, department, email, or phone'}
                emptyMessage={showTrash ? 'No deleted faculty profiles in trash.' : 'No faculty profiles match the current view.'}
                getRowKey={(item) => item.id}
                rowClassName={(item) => editingId === item.id ? 'bg-brand-navy-50' : 'hover:bg-brand-cream/50'}
                bulkActions={showTrash ? [
                    {
                        label: 'Restore selected',
                        icon: <CheckCircle2 size={15} />,
                        onClick: (rows) => handleRestore(rows.map((item) => item.id)),
                    },
                ] : [
                    {
                        label: 'Delete selected',
                        icon: <Trash2 size={15} />,
                        tone: 'danger',
                        onClick: handleBulkDelete,
                    },
                ]}
                filters={[
                    {
                        key: 'department',
                        label: 'All departments',
                        accessor: (item) => item.department || 'Unassigned',
                        options: Array.from(new Set(faculty.map((item) => item.department || 'Unassigned'))).sort().map((department) => ({ value: department, label: department })),
                    },
                ]}
                columns={[
                    {
                        key: 'name',
                        header: 'Name',
                        accessor: (item) => `${item.name} ${item.email || ''} ${item.phone || ''}`,
                        render: (item) => (
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
                                    {item.image_url && <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{item.name}</p>
                                    {item.email && <p className="text-xs text-slate-500">{item.email}</p>}
                                </div>
                            </div>
                        ),
                    },
                    {
                        key: 'position',
                        header: 'Role',
                        accessor: (item) => item.position,
                        render: (item) => <span className="font-medium text-slate-600">{item.position}</span>,
                    },
                    {
                        key: 'department',
                        header: 'Department',
                        accessor: (item) => item.department || 'Unassigned',
                        render: (item) => <span className="text-slate-500">{item.department || 'Unassigned'}</span>,
                    },
                    {
                        key: 'actions',
                        header: 'Actions',
                        sortable: false,
                        searchable: false,
                        export: false,
                        className: 'text-right',
                        cellClassName: 'text-right',
                        render: (item) => (
                            <div className="flex items-center justify-end gap-2">
                                {showTrash ? (
                                    <button
                                        type="button"
                                        className="rounded-lg bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                                        onClick={() => handleRestore([item.id])}
                                        title="Restore faculty member"
                                    >
                                        <CheckCircle2 size={16} />
                                    </button>
                                ) : (
                                    <>
                                        <button className="rounded-lg bg-brand-navy-50 p-2 text-brand-navy-600 hover:bg-brand-navy-600 hover:text-white" onClick={() => handleEdit(item)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <DeleteAction onDelete={() => handleDelete(item.id)} />
                                    </>
                                )}
                            </div>
                        ),
                    },
                ]}
            />
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
    const [showTrash, setShowTrash] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        image_url: '',
        category: '',
        description: ''
    })

    React.useEffect(() => {
        fetchImages()
    }, [showTrash])

    const fetchImages = async () => {
        try {
            const response = await fetch(contentUrl(API_ENDPOINTS.gallery, showTrash), { headers: getAuthHeaders() })
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
        const uploadFormData = await buildImageUploadFormData(file)

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
    }

    const handleDelete = async (id) => {
        const previous = images
        deleteWithUndo({
            label: 'Gallery image',
            onOptimisticRemove: () => setImages((current) => current.filter((item) => item.id !== id)),
            onUndo: () => setImages(previous),
            commit: async () => {
                await commitContentDeletes(API_ENDPOINTS.gallery, [id], getAuthHeaders)
            },
        })
    }

    const handleBulkDelete = async (rows) => {
        const ids = rows.map((item) => item.id)
        const previous = images
        deleteWithUndo({
            label: `${ids.length} gallery image${ids.length === 1 ? '' : 's'}`,
            onOptimisticRemove: () => setImages((current) => current.filter((item) => !ids.includes(item.id))),
            onUndo: () => setImages(previous),
            commit: async () => commitContentDeletes(API_ENDPOINTS.gallery, ids, getAuthHeaders),
        })
    }

    const handleRestore = async (ids) => {
        try {
            await restoreContentRows(API_ENDPOINTS.gallery, ids, getAuthHeaders)
            setImages((current) => current.filter((item) => !ids.includes(item.id)))
            toast.success(`${ids.length} gallery image${ids.length === 1 ? '' : 's'} restored`)
        } catch (error) {
            toast.error(error.message || 'Restore failed')
        }
    }

    const resetForm = () => {
        setFormData({ title: '', image_url: '', category: '', description: '' })
        setEditingId(null)
        setShowForm(false)
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <SideSheet
                open={showForm}
                onClose={resetForm}
                title={editingId ? 'Edit Image Info' : 'Add Gallery Image'}
                description="Manage gallery metadata from a side panel."
            >
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 ml-1 block text-xs font-medium text-slate-600">Image Title</label>
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
                                <label className="mb-2 ml-1 block text-xs font-medium text-slate-600">Category</label>
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
                                <label className="mb-2 ml-1 block text-xs font-medium text-slate-600">Image</label>
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
                                <label className="mb-2 ml-1 block text-xs font-medium text-slate-600">Description (Optional)</label>
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
                                className="bg-brand-navy-600 hover:bg-brand-navy-700 text-white font-semibold px-10 py-3 rounded-xl shadow-lg shadow-brand-navy-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isSubmitting ? 'Saving...' : editingId ? 'Update Info' : 'Add to Gallery'}
                            </button>
                        </div>
                    </form>
            </SideSheet>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => {
                        resetForm()
                        setShowTrash((current) => !current)
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                    <Archive size={16} />
                    {showTrash ? 'Active Gallery' : 'Trash'}
                </button>
            </div>

            <DataTable
                rows={images}
                searchPlaceholder={showTrash ? 'Search deleted gallery images' : 'Search gallery by title, category, or description'}
                emptyMessage={showTrash ? 'No deleted gallery images in trash.' : 'No gallery images match the current view.'}
                getRowKey={(item) => item.id}
                rowClassName={(item) => editingId === item.id ? 'bg-brand-navy-50' : 'hover:bg-brand-cream/50'}
                bulkActions={showTrash ? [
                    {
                        label: 'Restore selected',
                        icon: <CheckCircle2 size={15} />,
                        onClick: (rows) => handleRestore(rows.map((item) => item.id)),
                    },
                ] : [
                    {
                        label: 'Delete selected',
                        icon: <Trash2 size={15} />,
                        tone: 'danger',
                        onClick: handleBulkDelete,
                    },
                ]}
                filters={[
                    {
                        key: 'category',
                        label: 'All categories',
                        accessor: (item) => item.category || 'Uncategorised',
                        options: Array.from(new Set(images.map((item) => item.category || 'Uncategorised'))).sort().map((category) => ({ value: category, label: category })),
                    },
                ]}
                columns={[
                    {
                        key: 'preview',
                        header: 'Preview',
                        accessor: (item) => item.title,
                        render: (item) => (
                            <div className="h-14 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                                <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                            </div>
                        ),
                    },
                    {
                        key: 'details',
                        header: 'Details',
                        accessor: (item) => `${item.title} ${item.category || ''} ${item.description || ''}`,
                        render: (item) => (
                            <div>
                                <h4 className="font-bold text-slate-900">{item.title}</h4>
                                <span className="text-xs font-semibold text-brand-navy-600">{item.category || 'Uncategorised'}</span>
                            </div>
                        ),
                    },
                    {
                        key: 'created_at',
                        header: 'Date',
                        accessor: (item) => item.created_at,
                        sortValue: (item) => item.created_at,
                        render: (item) => <span className="font-mono text-sm font-medium text-slate-600">{adminDate(item.created_at)}</span>,
                    },
                    {
                        key: 'actions',
                        header: 'Actions',
                        sortable: false,
                        searchable: false,
                        export: false,
                        className: 'text-right',
                        cellClassName: 'text-right',
                        render: (item) => (
                            <div className="flex items-center justify-end gap-2">
                                {showTrash ? (
                                    <button
                                        type="button"
                                        className="rounded-lg bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                                        onClick={() => handleRestore([item.id])}
                                        title="Restore gallery image"
                                    >
                                        <CheckCircle2 size={16} />
                                    </button>
                                ) : (
                                    <>
                                        <button className="rounded-lg bg-brand-navy-50 p-2 text-brand-navy-600 hover:bg-brand-navy-600 hover:text-white" onClick={() => handleEdit(item)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <DeleteAction onDelete={() => handleDelete(item.id)} />
                                    </>
                                )}
                            </div>
                        ),
                    },
                ]}
            />
        </div>
    )
}


// ── ERP Manager ───────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || ''

const ERPManager = ({ getAuthHeaders, section = 'teachers', onSectionChange }) => {
    const [teachers, setTeachers] = useState([])
    const [classes, setClasses] = useState([])
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedTeacher, setExpandedTeacher] = useState(null)
    const [showAddTeacher, setShowAddTeacher] = useState(false)
    const [showAddClass, setShowAddClass] = useState(false)
    const [showAddSubject, setShowAddSubject] = useState(false)
    const [assigning, setAssigning] = useState(null) // teacher profile id being assigned

    // Thin wrapper around the module-level adminApiFetch helper that also
    // parses JSON and throws on non-OK responses (401s are already handled
    // centrally inside adminApiFetch).
    const adminFetch = async (url, options = {}) => {
        const res = await adminApiFetch(url, options)
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

    const Field = ({ label, ...props }) => {
        // Auto-derive mobile keyboard hints when not explicitly provided
        const type = props.type
        const inputMode = props.inputMode ?? (
            type === 'tel' ? 'tel'
                : type === 'email' ? 'email'
                    : type === 'number' ? 'numeric'
                        : undefined
        )
        const pattern = props.pattern ?? (type === 'number' ? '[0-9]*' : undefined)
        return (
            <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                <input
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-navy-500"
                    {...props}
                    inputMode={inputMode}
                    pattern={pattern}
                />
            </div>
        )
    }

    const AddTeacherForm = () => {
        const [form, setForm] = useState({ full_name: '', email: '', phone: '', department: '', subject: '', class_teacher_of: '', password: '' })
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
                    <Field label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
                <p className="text-xs font-semibold text-slate-500">Assign Class & Subject</p>
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
                        onClick={() => onSectionChange ? onSectionChange(s.id) : null}
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
                                            <p className="text-xs font-semibold text-slate-400 mb-3">Class Assignments</p>
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
                <p className="text-xs font-semibold text-brand-navy-700">New Invoice</p>
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
                        <input type="number" inputMode="decimal" step="0.01" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required
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
                <p className="text-xs font-semibold text-emerald-700">Record Payment — {invoice.title}</p>
                <p className="text-xs font-bold text-slate-500">Outstanding: {fmt(invoice.balance_paise)}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-1">Amount (₹)</label>
                        <input type="number" inputMode="decimal" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required
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
                            <p className="text-xs font-semibold opacity-70">{t.label}</p>
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
                                        <p className="text-xs font-semibold text-slate-400">Invoices</p>
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
                                            <p className="text-xs font-semibold text-slate-400 mb-2">Payment History</p>
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Class Section</label>
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Academic Year</label>
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
                            <h3 className="text-sm font-semibold text-slate-500">
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
                                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400">
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
                        <h3 className="text-sm font-semibold text-slate-500 mb-3">Weekly Schedule</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-[700px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="pb-2 pr-3 text-left text-xs font-semibold text-slate-400 w-24">Period</th>
                                        {DAYS.map((d) => (
                                            <th key={d} className="pb-2 px-2 text-center text-xs font-semibold text-slate-400">{d}</th>
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
                                                <td colSpan={6} className="py-2 px-2 text-center text-xs font-semibold text-amber-600">
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
