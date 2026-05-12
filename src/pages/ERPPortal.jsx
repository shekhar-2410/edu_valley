import {
    BarChart2,
    Bell,
    BookOpen,
    Calendar,
    Check,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    ClipboardList,
    CreditCard,
    GraduationCap,
    Home,
    Loader2,
    LogOut,
    Menu,
    Phone,
    Plus,
    Printer,
    Receipt,
    Save,
    School,
    TrendingUp,
    User,
    UserMinus,
    UserPlus,
    Users,
    X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { API_ENDPOINTS } from '../config/api'
import { printReceiptPDF, printInvoicePDF, shareReceiptWhatsApp } from '../utils/pdfPrint'

// ── Utilities ───────────────────────────────────────────────────────────────

const money = (paise = 0) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((paise || 0) / 100)

const formatDate = (value) => {
    if (!value) return '—'
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

const today = () => new Date().toISOString().slice(0, 10)

const getBalance = (invoice) => Math.max(0, (invoice?.amount_paise || 0) - (invoice?.paid_paise || 0))

const gradeColor = (grade) => {
    if (!grade) return 'text-slate-500'
    if (grade.startsWith('A')) return 'text-emerald-700'
    if (grade.startsWith('B')) return 'text-sky-700'
    if (grade.startsWith('C')) return 'text-amber-700'
    return 'text-rose-700'
}

const statusStyles = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    partial: 'bg-sky-50 text-sky-700 border-sky-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    leave: 'bg-amber-50 text-amber-700 border-amber-200',
    absent: 'bg-rose-50 text-rose-700 border-rose-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    transferred: 'bg-sky-50 text-sky-700 border-sky-200',
    withdrawn: 'bg-slate-50 text-slate-600 border-slate-200',
    expelled: 'bg-rose-50 text-rose-700 border-rose-200',
}

// ── Shared Components ────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${statusStyles[status] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
        {status}
    </span>
)

const StatTile = ({ label, value, icon, tone = 'navy', sub }) => {
    const tones = {
        navy: 'bg-brand-navy-50 text-brand-navy-700',
        crimson: 'bg-brand-crimson-50 text-brand-crimson-700',
        gold: 'bg-brand-gold-50 text-brand-gold-700',
        slate: 'bg-slate-100 text-slate-700',
        emerald: 'bg-emerald-50 text-emerald-700',
    }
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span>
            </div>
            <p className="text-2xl font-black tracking-tight text-slate-950">{value}</p>
            <p className="mt-0.5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
            {sub && <p className="mt-1 text-xs font-medium text-slate-400">{sub}</p>}
        </div>
    )
}

const EmptyState = ({ title, icon }) => (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        {icon && <div className="mb-3 text-slate-300">{icon}</div>}
        <p className="font-bold text-slate-500">{title}</p>
    </div>
)

const Info = ({ label, value }) => (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1 font-black text-slate-900">{value || '—'}</p>
    </div>
)

const Field = ({ label, value, onChange, type = 'text', required = false, children }) => (
    <div>
        <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-400">{label}</label>
        {children || (
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-bold text-slate-800 outline-none transition-all focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-100"
                required={required}
            />
        )}
    </div>
)

const loadRazorpay = () =>
    new Promise((resolve) => {
        if (window.Razorpay) { resolve(true); return }
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
    })

// ── Navigation Config ─────────────────────────────────────────────────────────

const studentNav = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { id: 'attendance', label: 'Attendance', icon: <ClipboardList size={18} /> },
    { id: 'marks', label: 'Marks', icon: <BookOpen size={18} /> },
    { id: 'fees', label: 'Fees', icon: <CreditCard size={18} /> },
    { id: 'timetable', label: 'Timetable', icon: <Calendar size={18} /> },
    { id: 'exams', label: 'Exams', icon: <GraduationCap size={18} /> },
]

const teacherNav = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { id: 'attendance', label: 'Attendance', icon: <ClipboardList size={18} /> },
    { id: 'students', label: 'Students', icon: <Users size={18} /> },
    { id: 'leaves', label: 'Leaves', icon: <Bell size={18} /> },
    { id: 'marks', label: 'Marks', icon: <BookOpen size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
]

const BOTTOM_NAV_COUNT = 5

// ── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar = ({ user, activeTab, setActiveTab, logout, drawerOpen, setDrawerOpen }) => {
    const navItems = user?.role === 'teacher' ? teacherNav : studentNav
    const drawerRef = useRef(null)

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false) }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [setDrawerOpen])

    const NavContent = () => (
        <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-5 py-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                        <School size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">NEV School</p>
                        <p className="text-sm font-black text-white">ERP Portal</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => { setActiveTab(item.id); setDrawerOpen(false) }}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-black transition-all ${
                            activeTab === item.id
                                ? 'bg-white/15 text-white'
                                : 'text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {item.icon}
                        {item.label}
                        {activeTab === item.id && <ChevronRight size={14} className="ml-auto" />}
                    </button>
                ))}
            </nav>

            <div className="border-t border-white/10 p-4">
                <div className="mb-3 flex items-center gap-3 px-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white">
                        <User size={14} />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">{user?.full_name}</p>
                        <p className="text-xs font-bold capitalize text-white/50">{user?.role}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white/60 transition-all hover:bg-white/10 hover:text-white"
                >
                    <LogOut size={15} />
                    Logout
                </button>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-brand-navy-700 lg:flex lg:flex-col">
                <NavContent />
            </aside>

            {/* Mobile drawer overlay */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 lg:hidden" ref={drawerRef}>
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setDrawerOpen(false)}
                    />
                    <div className="absolute left-0 top-0 h-full w-72 bg-brand-navy-700 shadow-2xl">
                        <NavContent />
                    </div>
                </div>
            )}
        </>
    )
}

// ── Mobile Bottom Tabs ────────────────────────────────────────────────────────

const BottomTabs = ({ user, activeTab, setActiveTab, keyboardOffset }) => {
    const navItems = user?.role === 'teacher' ? teacherNav : studentNav
    const primaryItems = navItems.slice(0, BOTTOM_NAV_COUNT)

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white lg:hidden"
            style={{
                paddingBottom: `max(env(safe-area-inset-bottom), 4px)`,
                transform: `translateY(calc(-1 * ${keyboardOffset}))`,
            }}
        >
            <div className="flex">
                {primaryItems.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        style={{ touchAction: 'manipulation', userSelect: 'none' }}
                        className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                            activeTab === item.id
                                ? 'text-brand-navy-700'
                                : 'text-slate-400 hover:text-slate-700'
                        }`}
                    >
                        <span className={`${activeTab === item.id ? 'text-brand-navy-700' : 'text-slate-400'}`}>
                            {item.icon}
                        </span>
                        {item.label}
                    </button>
                ))}
            </div>
        </nav>
    )
}

// ── Main Portal Shell ─────────────────────────────────────────────────────────

const ERPPortal = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('erpUser') || 'null') } catch { return null }
    })
    const [dashboard, setDashboard] = useState(null)
    const [activeTab, setActiveTab] = useState('dashboard')
    const [loading, setLoading] = useState(true)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [receiptData, setReceiptData] = useState(null)
    const [receiptLoadingId, setReceiptLoadingId] = useState(null)
    const [busyId, setBusyId] = useState(null)
    const [keyboardOffset, setKeyboardOffset] = useState('0px')

    const token = localStorage.getItem('erpToken')

    // Android keyboard detection
    useEffect(() => {
        const handler = () => {
            const keyboardOpen = window.visualViewport && window.visualViewport.height < window.innerHeight * 0.75
            setKeyboardOffset(keyboardOpen ? `${window.innerHeight - window.visualViewport.height}px` : '0px')
        }
        window.visualViewport?.addEventListener('resize', handler)
        return () => window.visualViewport?.removeEventListener('resize', handler)
    }, [])

    const apiRequest = async (url, options = {}) => {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('erpToken')}`,
                ...(options.headers || {}),
            },
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.detail || 'ERP request failed')
        return data
    }

    const fetchDashboard = async () => {
        if (!localStorage.getItem('erpToken')) { navigate('/erp-login'); return }
        setLoading(true)
        try {
            const savedUser = JSON.parse(localStorage.getItem('erpUser') || 'null')
            const endpoint = savedUser?.role === 'teacher' ? API_ENDPOINTS.erpTeacherDashboard : API_ENDPOINTS.erpStudentDashboard
            const data = await apiRequest(endpoint)
            setDashboard(data)
            setUser(data.user)
            localStorage.setItem('erpUser', JSON.stringify(data.user))
        } catch (err) {
            toast.error(err.message || 'Could not load ERP dashboard')
            localStorage.removeItem('erpToken')
            localStorage.removeItem('erpUser')
            navigate('/erp-login')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchDashboard() }, []) // eslint-disable-line

    const logout = () => {
        localStorage.removeItem('erpToken')
        localStorage.removeItem('erpUser')
        navigate('/erp-login')
    }

    const handlePay = async (invoice) => {
        setBusyId(invoice.id)
        try {
            const order = await apiRequest(API_ENDPOINTS.erpRazorpayOrder, {
                method: 'POST',
                body: JSON.stringify({ invoice_id: invoice.id }),
            })
            if (!order.razorpay_available) { toast.info(order.message || 'Razorpay not configured'); return }
            const ready = await loadRazorpay()
            if (!ready) { toast.error('Could not load Razorpay'); return }
            const checkout = new window.Razorpay({
                key: order.key_id,
                amount: order.amount_paise,
                currency: order.currency,
                name: 'Narendra Edu Valley',
                description: invoice.title,
                order_id: order.order_id,
                prefill: { name: user?.full_name, email: user?.email, contact: dashboard?.profile?.guardian_phone },
                theme: { color: '#1B3A6B' },
                handler: async (response) => {
                    await apiRequest(API_ENDPOINTS.erpRazorpayVerify, {
                        method: 'POST',
                        body: JSON.stringify({ invoice_id: invoice.id, ...response }),
                    })
                    toast.success('Payment verified')
                    fetchDashboard()
                },
            })
            checkout.on('payment.failed', (r) => toast.error(r.error?.description || 'Payment failed'))
            checkout.open()
        } catch (err) {
            toast.error(err.message || 'Payment could not be started')
        } finally {
            setBusyId(null)
        }
    }

    const openReceipt = async (payment) => {
        setReceiptLoadingId(payment.id)
        try {
            const data = await apiRequest(`${API_ENDPOINTS.erpReceipts}/${payment.id}`)
            setReceiptData(data)
        } catch (err) {
            toast.error(err.message || 'Could not load receipt')
        } finally {
            setReceiptLoadingId(null)
        }
    }

    const createLeave = async (payload) => {
        await apiRequest(API_ENDPOINTS.erpLeaves, { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Leave request submitted')
        fetchDashboard()
    }

    const updateLeave = async (leave, status) => {
        setBusyId(`${leave.id}-${status}`)
        try {
            await apiRequest(`${API_ENDPOINTS.erpLeaves}/${leave.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status, reviewer_note: status === 'approved' ? 'Approved by class teacher' : 'Rejected by class teacher' }),
            })
            toast.success(`Leave ${status}`)
            fetchDashboard()
        } catch (err) {
            toast.error(err.message || 'Could not update leave')
        } finally {
            setBusyId(null)
        }
    }

    const createMark = async (payload) => {
        await apiRequest(API_ENDPOINTS.erpMarks, { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Marks saved')
        fetchDashboard()
    }

    const studentMap = useMemo(() => {
        const map = {}
        dashboard?.students?.forEach((s) => { map[s.profile.id] = s })
        return map
    }, [dashboard])

    if (!token || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 font-black text-slate-600 shadow-sm">
                    <Loader2 className="animate-spin" size={20} />
                    Loading ERP
                </div>
            </div>
        )
    }

    if (!dashboard) return (
        <div className="flex min-h-screen items-center justify-center">
            <EmptyState title="ERP dashboard could not be loaded" icon={<School size={40} />} />
        </div>
    )

    const currentPageLabel = (user?.role === 'teacher' ? teacherNav : studentNav).find((n) => n.id === activeTab)?.label || 'Dashboard'

    return (
        <div className="min-h-[100dvh] bg-slate-50 lg:pl-64">
            {/* Mobile top bar */}
            <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
                <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
                    aria-label="Open menu"
                >
                    <Menu size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <School size={16} className="text-brand-navy-700" />
                    <span className="text-sm font-black text-slate-900">{currentPageLabel}</span>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy-100 text-xs font-black text-brand-navy-700">
                    {user?.full_name?.[0] || '?'}
                </div>
            </header>

            <Sidebar
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                logout={logout}
                drawerOpen={drawerOpen}
                setDrawerOpen={setDrawerOpen}
            />

            {/* Main content */}
            <main className="min-h-[100dvh] pb-24 lg:pb-10">
                <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
                    {user?.role === 'teacher' ? (
                        <>
                            {activeTab === 'dashboard' && <TeacherDashboard dashboard={dashboard} setActiveTab={setActiveTab} />}
                            {activeTab === 'attendance' && <TeacherAttendance apiRequest={apiRequest} dashboard={dashboard} />}
                            {activeTab === 'students' && <TeacherStudents dashboard={dashboard} studentMap={studentMap} apiRequest={apiRequest} />}
                            {activeTab === 'leaves' && <TeacherLeaves dashboard={dashboard} updateLeave={updateLeave} busyId={busyId} studentMap={studentMap} />}
                            {activeTab === 'marks' && <TeacherMarks dashboard={dashboard} createMark={createMark} studentMap={studentMap} />}
                            {activeTab === 'analytics' && <TeacherAnalytics apiRequest={apiRequest} dashboard={dashboard} />}
                        </>
                    ) : (
                        <>
                            {activeTab === 'dashboard' && <StudentDashboardView dashboard={dashboard} />}
                            {activeTab === 'attendance' && <StudentAttendance dashboard={dashboard} />}
                            {activeTab === 'marks' && <StudentMarks dashboard={dashboard} />}
                            {activeTab === 'fees' && <FeesPanel dashboard={dashboard} handlePay={handlePay} openReceipt={openReceipt} busyId={busyId} receiptLoadingId={receiptLoadingId} />}
                            {activeTab === 'timetable' && <StudentTimetable apiRequest={apiRequest} dashboard={dashboard} />}
                            {activeTab === 'exams' && <StudentExams apiRequest={apiRequest} dashboard={dashboard} />}
                        </>
                    )}
                </div>
            </main>

            <BottomTabs user={user} activeTab={activeTab} setActiveTab={setActiveTab} keyboardOffset={keyboardOffset} />

            {receiptData && <ReceiptModal receiptData={receiptData} onClose={() => setReceiptData(null)} />}
        </div>
    )
}

// ── Student Views ─────────────────────────────────────────────────────────────

const StudentDashboardView = ({ dashboard }) => {
    const pendingInvoices = dashboard.invoices.filter((inv) => inv.status !== 'paid')
    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-navy-500">Welcome back</p>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{dashboard.user.full_name}</h1>
                <p className="text-sm font-medium text-slate-500">
                    Class {dashboard.profile.class_name}-{dashboard.profile.section} · Roll {dashboard.profile.roll_no || '—'}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatTile label="Fee Due" value={money(dashboard.stats.fee_due_paise)} icon={<CreditCard size={19} />} tone="crimson" />
                <StatTile label="Attendance" value={`${dashboard.stats.attendance_percent}%`} icon={<ClipboardList size={19} />} tone="navy" />
                <StatTile label="Avg Marks" value={`${dashboard.stats.average_percent}%`} icon={<BookOpen size={19} />} tone="gold" />
                <StatTile label="Receipts" value={dashboard.stats.receipt_count} icon={<Receipt size={19} />} tone="slate" />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-black text-slate-950">Student Details</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Info label="Admission No" value={dashboard.profile.admission_no} />
                        <Info label="Class" value={`${dashboard.profile.class_name}-${dashboard.profile.section}`} />
                        <Info label="Blood Group" value={dashboard.profile.blood_group} />
                        <Info label="Guardian" value={dashboard.profile.guardian_name} />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-black text-slate-950">Priority Items</h2>
                    <div className="space-y-3">
                        {pendingInvoices.length === 0 ? (
                            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">All fee invoices paid ✓</p>
                        ) : pendingInvoices.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                                <div>
                                    <p className="font-black text-slate-900">{inv.title}</p>
                                    <p className="text-xs text-slate-500">Due {formatDate(inv.due_date)}</p>
                                </div>
                                <p className="font-black text-brand-crimson-700">{money(getBalance(inv))}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-black text-slate-950">Latest Marks</h2>
                {dashboard.marks.length === 0
                    ? <EmptyState title="No marks published yet" icon={<BookOpen size={32} />} />
                    : <MarksTable marks={dashboard.marks.slice(0, 6)} />}
            </div>
        </div>
    )
}

const StudentAttendance = ({ dashboard }) => {
    const byMonth = {}
    dashboard.attendance.forEach((record) => {
        const key = record.date.slice(0, 7)
        if (!byMonth[key]) byMonth[key] = { present: 0, absent: 0, leave: 0, total: 0 }
        byMonth[key][record.status] = (byMonth[key][record.status] || 0) + 1
        byMonth[key].total++
    })
    const months = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0]))

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black text-slate-950">Attendance</h1>

            <div className="grid gap-3 sm:grid-cols-3">
                <StatTile
                    label="Attendance %"
                    value={`${dashboard.stats.attendance_percent}%`}
                    icon={<ClipboardList size={19} />}
                    tone="navy"
                />
                <StatTile
                    label="Present"
                    value={dashboard.attendance.filter((r) => r.status === 'present').length}
                    icon={<Check size={19} />}
                    tone="emerald"
                />
                <StatTile
                    label="Absent"
                    value={dashboard.attendance.filter((r) => r.status === 'absent').length}
                    icon={<X size={19} />}
                    tone="crimson"
                />
            </div>

            {months.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-black text-slate-950">Monthly Summary</h2>
                    <div className="space-y-3">
                        {months.map(([month, data]) => (
                            <div key={month} className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-3">
                                <div className="w-20 text-sm font-black text-slate-700">{month}</div>
                                <div className="flex-1">
                                    <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                                        <span>{data.present}P · {data.absent}A · {data.leave}L</span>
                                        <span>{data.total > 0 ? Math.round(data.present / data.total * 100) : 0}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-200">
                                        <div
                                            className="h-full rounded-full bg-brand-navy-600 transition-all"
                                            style={{ width: `${data.total > 0 ? (data.present / data.total * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-black text-slate-950">All Records</h2>
                {dashboard.attendance.length === 0
                    ? <EmptyState title="No attendance records yet" icon={<ClipboardList size={32} />} />
                    : (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {dashboard.attendance.map((record) => (
                                <div key={record.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                                    <div>
                                        <p className="font-black text-slate-900">{formatDate(record.date)}</p>
                                        {record.note && <p className="text-xs text-slate-500">{record.note}</p>}
                                    </div>
                                    <StatusBadge status={record.status} />
                                </div>
                            ))}
                        </div>
                    )}
            </div>
        </div>
    )
}

const StudentMarks = ({ dashboard }) => {
    const byExam = {}
    dashboard.marks.forEach((m) => {
        if (!byExam[m.exam_name]) byExam[m.exam_name] = []
        byExam[m.exam_name].push(m)
    })

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black text-slate-950">Marks</h1>
            {Object.entries(byExam).length === 0
                ? <EmptyState title="No marks published yet" icon={<BookOpen size={32} />} />
                : Object.entries(byExam).map(([examName, marks]) => {
                    const totalObt = marks.reduce((s, m) => s + m.marks_obtained, 0)
                    const totalMax = marks.reduce((s, m) => s + m.max_marks, 0)
                    const pct = totalMax > 0 ? Math.round(totalObt / totalMax * 100) : 0
                    return (
                        <div key={examName} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-black text-slate-950">{examName}</h2>
                                <span className={`text-xl font-black ${pct >= 75 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                                    {pct}%
                                </span>
                            </div>
                            <MarksTable marks={marks} />
                        </div>
                    )
                })}
        </div>
    )
}

const FeesPanel = ({ dashboard, handlePay, openReceipt, busyId, receiptLoadingId }) => (
    <div className="space-y-6">
        <h1 className="text-2xl font-black text-slate-950">Fees</h1>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-black text-slate-950">Invoices</h2>
            </div>
            <div className="divide-y divide-slate-100">
                {dashboard.invoices.map((inv) => (
                    <div key={inv.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-black text-slate-950">{inv.title}</p>
                            <p className="text-xs font-bold text-slate-500">{inv.invoice_no} · {inv.term}</p>
                            <p className="mt-1 text-xs text-slate-400">Due {formatDate(inv.due_date)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="text-right mr-2">
                                <p className="font-black text-slate-950">{money(inv.amount_paise)}</p>
                                {getBalance(inv) > 0 && <p className="text-xs font-black text-brand-crimson-700">Due {money(getBalance(inv))}</p>}
                            </div>
                            <StatusBadge status={inv.status} />
                            <button
                                type="button"
                                onClick={() => printInvoicePDF({ inv, student: { ...dashboard.profile, full_name: dashboard.user.full_name } })}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                                title="Download Invoice PDF"
                            >
                                <Printer size={13} /> Invoice
                            </button>
                            {inv.status !== 'paid' && (
                                <button
                                    type="button"
                                    onClick={() => handlePay(inv)}
                                    disabled={busyId === inv.id}
                                    className="inline-flex items-center gap-2 rounded-xl bg-brand-navy-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-brand-navy-700 disabled:opacity-60"
                                >
                                    {busyId === inv.id ? <Loader2 className="animate-spin" size={14} /> : <CreditCard size={14} />}
                                    Pay
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-black text-slate-950">Payment History</h2>
            </div>
            {dashboard.payments.length === 0 ? (
                <div className="p-6"><EmptyState title="No payments yet" /></div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {dashboard.payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between gap-4 p-5">
                            <div>
                                <p className="font-black text-slate-950">{payment.receipt_no || 'Receipt pending'}</p>
                                <p className="text-xs font-bold text-slate-500">{formatDate(payment.paid_at)} · {payment.method}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <p className="font-black text-slate-950">{money(payment.amount_paise)}</p>
                                <button
                                    type="button"
                                    onClick={() => openReceipt(payment)}
                                    disabled={receiptLoadingId === payment.id}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-brand-navy-700 hover:bg-brand-navy-50 disabled:opacity-60"
                                >
                                    {receiptLoadingId === payment.id ? <Loader2 className="animate-spin" size={14} /> : <Receipt size={14} />}
                                    Receipt
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
)

const StudentTimetable = ({ apiRequest, dashboard }) => {
    const [slots, setSlots] = useState([])
    const [loading, setLoading] = useState(true)
    const classSectionId = dashboard.profile.class_section_id

    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const todayDow = (new Date().getDay() + 6) % 7 // 0=Mon

    useEffect(() => {
        if (!classSectionId) { setLoading(false); return }
        apiRequest(`${API_ENDPOINTS.erpTimetable}/${classSectionId}`)
            .then(setSlots)
            .catch(() => toast.error('Could not load timetable'))
            .finally(() => setLoading(false))
    }, [classSectionId]) // eslint-disable-line

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-brand-navy-600" size={32} /></div>

    if (!classSectionId || slots.length === 0) return (
        <div className="space-y-4">
            <h1 className="text-2xl font-black text-slate-950">Timetable</h1>
            <EmptyState title="No timetable set up yet" icon={<Calendar size={32} />} />
        </div>
    )

    const periods = [...new Set(slots.map((s) => s.period_no))].sort((a, b) => a - b)
    const byDay = {}
    DAYS.forEach((_, i) => { byDay[i] = {} })
    slots.forEach((s) => { byDay[s.day_of_week][s.period_no] = s })

    const subjectColors = ['bg-brand-navy-100 text-brand-navy-800', 'bg-brand-crimson-50 text-brand-crimson-800',
        'bg-brand-gold-50 text-amber-800', 'bg-emerald-50 text-emerald-800', 'bg-purple-50 text-purple-800', 'bg-pink-50 text-pink-800']
    const subjectColorMap = {}
    let colorIdx = 0
    slots.forEach((s) => {
        if (s.subject && !subjectColorMap[s.subject.name]) {
            subjectColorMap[s.subject.name] = subjectColors[colorIdx % subjectColors.length]
            colorIdx++
        }
    })

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black text-slate-950">Timetable</h1>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-[640px] w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="w-24 py-3 pl-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Period</th>
                            {DAYS.map((day, i) => (
                                <th key={day} className={`py-3 px-3 text-center text-xs font-black uppercase tracking-wider ${i === todayDow ? 'text-brand-navy-700' : 'text-slate-400'}`}>
                                    {day}
                                    {i === todayDow && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-brand-navy-600 align-middle" />}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {periods.map((period) => {
                            const sampleSlot = byDay[0][period] || byDay[1][period]
                            const isBreak = sampleSlot?.is_break
                            return (
                                <tr key={period} className={`border-b border-slate-100 last:border-0 ${isBreak ? 'bg-slate-50' : ''}`}>
                                    <td className="py-2 pl-4 text-xs font-black text-slate-400">
                                        {sampleSlot?.start_time && <span>{sampleSlot.start_time}–{sampleSlot.end_time}</span>}
                                    </td>
                                    {DAYS.map((_, dayIdx) => {
                                        const slot = byDay[dayIdx][period]
                                        if (!slot) return <td key={dayIdx} className="px-3 py-2" />
                                        if (slot.is_break) return (
                                            <td key={dayIdx} className="px-3 py-2 text-center text-xs font-bold text-slate-400">Break</td>
                                        )
                                        const colorClass = slot.subject ? (subjectColorMap[slot.subject.name] || 'bg-slate-100 text-slate-700') : 'bg-slate-100 text-slate-500'
                                        return (
                                            <td key={dayIdx} className={`px-3 py-2 ${dayIdx === todayDow ? 'bg-brand-navy-50' : ''}`}>
                                                <div className={`rounded-lg px-2 py-1.5 text-center text-xs font-black ${colorClass}`}>
                                                    {slot.subject?.name || '—'}
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const StudentExams = ({ apiRequest, dashboard }) => {
    const [exams, setExams] = useState([])
    const [loading, setLoading] = useState(true)
    const classSectionId = dashboard.profile.class_section_id

    useEffect(() => {
        const url = classSectionId
            ? `${API_ENDPOINTS.erpExamSchedules}?class_section_id=${classSectionId}`
            : API_ENDPOINTS.erpExamSchedules
        apiRequest(url)
            .then(setExams)
            .catch(() => toast.error('Could not load exam schedule'))
            .finally(() => setLoading(false))
    }, [classSectionId]) // eslint-disable-line

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-brand-navy-600" size={32} /></div>

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black text-slate-950">Exam Schedule</h1>
            {exams.length === 0
                ? <EmptyState title="No exams scheduled" icon={<GraduationCap size={32} />} />
                : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {exams.map((exam) => (
                            <div key={exam.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="mb-1 text-xs font-black uppercase tracking-wider text-brand-navy-600">{exam.exam_name}</p>
                                <p className="text-xl font-black text-slate-950">{exam.subject?.name || '—'}</p>
                                <div className="mt-4 space-y-1.5 text-sm font-bold text-slate-600">
                                    <p>📅 {formatDate(exam.exam_date)}</p>
                                    {exam.start_time && <p>🕐 {exam.start_time} – {exam.end_time}</p>}
                                    {exam.venue && <p>📍 {exam.venue}{exam.hall_no ? ` · Hall ${exam.hall_no}` : ''}</p>}
                                    <p>✏️ Max Marks: {exam.max_marks}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
        </div>
    )
}

// ── Teacher Views ─────────────────────────────────────────────────────────────

const TeacherDashboard = ({ dashboard, setActiveTab }) => {
    const pendingLeaves = (dashboard.leaves || []).filter((l) => l.status === 'pending')
    const assignedClasses = dashboard.stats.assigned_class_sections || []
    const needsAttentionCount = dashboard.stats.needs_attention_count || 0
    const attendanceMarkedToday = dashboard.stats.attendance_marked_today || false
    const allClear = attendanceMarkedToday && pendingLeaves.length === 0 && needsAttentionCount === 0

    // Build student name lookup from dashboard students
    const nameById = {}
    ;(dashboard.students || []).forEach((s) => { nameById[s.profile.id] = s.user.full_name })

    const snapshotStudents = (dashboard.students || []).slice(0, 6)

    const ActionCard = ({ onClick, color, icon, title, sub }) => {
        const colors = {
            amber: 'border-amber-200 bg-amber-50 hover:bg-amber-100',
            rose: 'border-rose-200 bg-rose-50 hover:bg-rose-100',
            orange: 'border-orange-200 bg-orange-50 hover:bg-orange-100',
        }
        const iconColors = {
            amber: 'bg-amber-400 text-white',
            rose: 'bg-rose-500 text-white',
            orange: 'bg-orange-500 text-white',
        }
        const textColors = {
            amber: ['text-amber-900', 'text-amber-700', 'text-amber-400'],
            rose: ['text-rose-900', 'text-rose-700', 'text-rose-400'],
            orange: ['text-orange-900', 'text-orange-700', 'text-orange-400'],
        }
        const [titleColor, subColor, chevronColor] = textColors[color]
        return (
            <button type="button" onClick={onClick}
                className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors ${colors[color]}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconColors[color]}`}>{icon}</div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black ${titleColor}`}>{title}</p>
                    <p className={`text-xs font-bold ${subColor}`}>{sub}</p>
                </div>
                <ChevronRight size={18} className={chevronColor} />
            </button>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-navy-500">Teacher Portal</p>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{dashboard.user.full_name}</h1>
                <p className="text-sm font-medium text-slate-500">
                    {[dashboard.profile.department, dashboard.profile.subject, dashboard.profile.class_teacher_of].filter(Boolean).join(' · ')}
                </p>
            </div>

            {/* Today's Focus */}
            <div className="space-y-2.5">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Today's Focus</p>
                {!attendanceMarkedToday && (
                    <ActionCard
                        onClick={() => setActiveTab('attendance')}
                        color="amber"
                        icon={<ClipboardList size={20} />}
                        title="Attendance not marked today"
                        sub="Tap to mark attendance now"
                    />
                )}
                {pendingLeaves.length > 0 && (
                    <ActionCard
                        onClick={() => setActiveTab('leaves')}
                        color="rose"
                        icon={<Bell size={20} />}
                        title={`${pendingLeaves.length} leave request${pendingLeaves.length > 1 ? 's' : ''} pending`}
                        sub="Tap to review and approve"
                    />
                )}
                {needsAttentionCount > 0 && (
                    <ActionCard
                        onClick={() => setActiveTab('students')}
                        color="orange"
                        icon={<Users size={20} />}
                        title={`${needsAttentionCount} student${needsAttentionCount > 1 ? 's' : ''} need attention`}
                        sub="Low attendance or marks — tap to view"
                    />
                )}
                {allClear && (
                    <div className="flex items-center gap-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                            <Check size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-emerald-900">All caught up!</p>
                            <p className="text-xs font-bold text-emerald-700">Attendance marked · No pending actions</p>
                        </div>
                    </div>
                )}
            </div>

            {/* My Classes */}
            {assignedClasses.length > 0 && (
                <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">My Classes</p>
                    <div className="flex flex-wrap gap-2">
                        {assignedClasses.map((cs) => (
                            <button key={cs.id} type="button"
                                onClick={() => setActiveTab('students')}
                                className="flex items-center gap-2 rounded-xl border border-brand-navy-200 bg-brand-navy-50 px-4 py-2.5 text-sm font-black text-brand-navy-700 hover:bg-brand-navy-100"
                            >
                                <GraduationCap size={15} />
                                Class {cs.class_name}-{cs.section}
                                <span className="font-bold text-brand-navy-400">{cs.academic_year}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatTile label="My Students" value={dashboard.stats.student_count} icon={<Users size={19} />} tone="navy" />
                <StatTile label="Class Avg" value={`${dashboard.stats.class_average_percent}%`} icon={<TrendingUp size={19} />} tone="gold" />
                <StatTile label="Pending Leaves" value={pendingLeaves.length} icon={<Bell size={19} />} tone="crimson" />
                <StatTile label="Need Attention" value={needsAttentionCount} icon={<BookOpen size={19} />} tone="slate" />
            </div>

            {/* Pending Leave Requests preview */}
            {pendingLeaves.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <h2 className="text-base font-black text-slate-950">Pending Leaves</h2>
                        <button type="button" onClick={() => setActiveTab('leaves')}
                            className="text-xs font-black text-brand-navy-600 hover:underline">
                            Review All →
                        </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {pendingLeaves.slice(0, 4).map((leave) => (
                            <div key={leave.id} className="flex items-center gap-4 px-5 py-3.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-navy-100 text-xs font-black text-brand-navy-700">
                                    {(nameById[leave.student_id] || 'S')[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-black text-slate-950">
                                        {nameById[leave.student_id] || `Student #${leave.student_id}`}
                                    </p>
                                    <p className="text-xs font-bold text-slate-400">
                                        {formatDate(leave.from_date)} → {formatDate(leave.to_date)} · {leave.days_count} day{leave.days_count > 1 ? 's' : ''}
                                    </p>
                                </div>
                                <span className="shrink-0 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700">Pending</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Class Snapshot */}
            {snapshotStudents.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <h2 className="text-base font-black text-slate-950">Class Snapshot</h2>
                        <button type="button" onClick={() => setActiveTab('students')}
                            className="text-xs font-black text-brand-navy-600 hover:underline">
                            View All →
                        </button>
                    </div>
                    <div className="p-4">
                        <TeacherStudentTable students={snapshotStudents} />
                    </div>
                </div>
            )}
        </div>
    )
}

const TeacherAttendance = ({ apiRequest, dashboard }) => {
    const [classSections, setClassSections] = useState([])
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedDate, setSelectedDate] = useState(today())
    const [students, setStudents] = useState([])
    const [loadingStudents, setLoadingStudents] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)

    useEffect(() => {
        apiRequest(API_ENDPOINTS.erpClassSections).then((sections) => {
            setClassSections(sections)
            if (sections.length === 1) setSelectedClass(String(sections[0].id))
        }).catch(() => {})
    }, []) // eslint-disable-line

    const loadStudents = async (classId, dateStr) => {
        if (!classId) return
        setLoadingStudents(true)
        try {
            const data = await apiRequest(`${API_ENDPOINTS.erpAttendanceClass}/${classId}/date/${dateStr}`)
            setStudents(data.map((s) => ({ ...s, status: s.status || 'present' })))
        } catch {
            toast.error('Could not load students')
        } finally {
            setLoadingStudents(false)
        }
    }

    useEffect(() => {
        if (selectedClass) loadStudents(selectedClass, selectedDate)
    }, [selectedClass, selectedDate]) // eslint-disable-line

    const toggle = (studentId) => {
        setStudents((prev) => prev.map((s) => s.student_id === studentId
            ? { ...s, status: s.status === 'present' ? 'absent' : 'present' }
            : s
        ))
    }

    const absentCount = students.filter((s) => s.status === 'absent').length

    const submit = async () => {
        if (!selectedClass) return
        setSubmitting(true)
        try {
            await apiRequest(API_ENDPOINTS.erpAttendanceBulk, {
                method: 'POST',
                body: JSON.stringify({
                    class_section_id: Number(selectedClass),
                    date: selectedDate,
                    records: students.map((s) => ({ student_id: s.student_id, status: s.status, note: s.note || null })),
                }),
            })
            setSubmitSuccess(true)
            setTimeout(() => setSubmitSuccess(false), 2000)
        } catch (err) {
            toast.error(err.message || 'Could not submit attendance')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-0">
            {/* Sticky control bar */}
            <div className="sticky top-14 z-10 -mx-4 border-b border-slate-200 bg-white px-4 py-3 md:-mx-6 md:px-6 lg:-mx-8 lg:top-0 lg:px-8">
                <div className="flex items-center gap-3">
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-bold outline-none focus:border-brand-navy-500"
                    >
                        <option value="">Select Class</option>
                        {classSections.map((cs) => (
                            <option key={cs.id} value={cs.id}>Class {cs.class_name}-{cs.section}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-bold outline-none focus:border-brand-navy-500"
                    />
                    {students.length > 0 && (
                        <div className="hidden text-sm font-black text-slate-500 sm:block">
                            {absentCount} absent
                        </div>
                    )}
                </div>
                {students.length > 0 && (
                    <div className="mt-2 text-xs font-bold text-slate-500 sm:hidden">
                        {students.length} students · {absentCount} absent
                    </div>
                )}
            </div>

            {/* Student chip grid */}
            {!selectedClass ? (
                <div className="pt-6"><EmptyState title="Select a class to mark attendance" icon={<ClipboardList size={32} />} /></div>
            ) : loadingStudents ? (
                <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-brand-navy-600" size={32} /></div>
            ) : students.length === 0 ? (
                <div className="pt-6"><EmptyState title="No students in this class" icon={<Users size={32} />} /></div>
            ) : (
                <>
                    <div
                        className="grid gap-2 pt-4"
                        style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        {students.map((student) => {
                            const isAbsent = student.status === 'absent'
                            return (
                                <button
                                    key={student.student_id}
                                    type="button"
                                    onClick={() => toggle(student.student_id)}
                                    onContextMenu={(e) => e.preventDefault()}
                                    style={{ touchAction: 'manipulation', userSelect: 'none', minHeight: 56 }}
                                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                                        isAbsent
                                            ? 'border-rose-200 bg-rose-50'
                                            : 'border-brand-navy-200 bg-brand-navy-50'
                                    }`}
                                >
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                                        isAbsent ? 'bg-rose-200 text-rose-800' : 'bg-brand-navy-200 text-brand-navy-800'
                                    }`}>
                                        {student.student_name?.charAt(0) || '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`truncate text-sm font-black ${isAbsent ? 'text-rose-800 line-through' : 'text-brand-navy-900'}`}>
                                            {student.student_name}
                                        </p>
                                        {student.roll_no && (
                                            <p className={`text-xs font-bold ${isAbsent ? 'text-rose-500' : 'text-brand-navy-500'}`}>
                                                Roll {student.roll_no}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    <div className="sticky bottom-[calc(56px+env(safe-area-inset-bottom))] pt-4 lg:static lg:pt-4">
                        <button
                            type="button"
                            onClick={submit}
                            disabled={submitting}
                            className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-widest text-white transition-all ${
                                submitSuccess
                                    ? 'bg-emerald-600'
                                    : 'bg-brand-navy-700 hover:bg-brand-navy-800'
                            } disabled:opacity-60`}
                        >
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : submitSuccess ? <Check size={18} /> : <ClipboardList size={18} />}
                            {submitSuccess ? 'Submitted!' : 'Submit Attendance'}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

const AddStudentModal = ({ classSections: initialSections, onClose, onSuccess, apiRequest }) => {
    const currentYear = `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(-2)}`
    const [form, setForm] = useState({
        full_name: '', email: '', phone: '', admission_no: '', roll_no: '',
        class_name: '', section: '', class_section_id: '', academic_year: currentYear,
        guardian_name: '', guardian_phone: '', address: '',
        date_of_birth: '', blood_group: '',
    })
    const [saving, setSaving] = useState(false)
    const [defaultPwd, setDefaultPwd] = useState(null)
    const [sections, setSections] = useState(initialSections)
    const [showCreateClass, setShowCreateClass] = useState(false)
    const [newClass, setNewClass] = useState({ class_name: '', section: '', academic_year: currentYear })
    const [creatingClass, setCreatingClass] = useState(false)

    const selectClass = (cs) => {
        setForm((f) => ({ ...f, class_section_id: cs.id, class_name: cs.class_name, section: cs.section }))
        setShowCreateClass(false)
    }

    const createClass = async () => {
        if (!newClass.class_name.trim() || !newClass.section.trim()) {
            toast.error('Class name and section are required')
            return
        }
        setCreatingClass(true)
        try {
            const created = await apiRequest(API_ENDPOINTS.erpClassSections, {
                method: 'POST',
                body: JSON.stringify(newClass),
            })
            setSections((prev) => [...prev, created])
            selectClass(created)
            setNewClass({ class_name: '', section: '', academic_year: currentYear })
            toast.success(`Class ${created.class_name}-${created.section} created`)
        } catch (err) {
            toast.error(err.message || 'Could not create class')
        } finally {
            setCreatingClass(false)
        }
    }

    const submit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                ...form,
                class_section_id: form.class_section_id ? Number(form.class_section_id) : null,
                date_of_birth: form.date_of_birth || null,
                phone: form.phone || null,
                roll_no: form.roll_no || null,
                guardian_name: form.guardian_name || null,
                guardian_phone: form.guardian_phone || null,
                address: form.address || null,
                blood_group: form.blood_group || null,
                academic_year: form.academic_year || null,
            }
            const res = await apiRequest(`${API_ENDPOINTS.erpBase}/teacher/students`, {
                method: 'POST',
                body: JSON.stringify(payload),
            })
            setDefaultPwd({ password: res.default_password, email: res.email })
        } catch (err) {
            toast.error(err.message || 'Could not add student')
        } finally {
            setSaving(false)
        }
    }

    if (defaultPwd) {
        return (
            <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4">
                <div className="w-full max-w-md rounded-t-3xl bg-white p-8 shadow-2xl sm:rounded-2xl">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <Check size={28} />
                    </div>
                    <h2 className="text-xl font-black text-slate-950">Student Added!</h2>
                    <p className="mt-2 text-sm text-slate-500">Share these login credentials with the student.</p>
                    <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-5">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Email</p>
                            <p className="mt-1 font-black text-slate-900">{defaultPwd.email}</p>
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Default Password</p>
                            <p className="mt-1 font-black text-brand-navy-700">{defaultPwd.password}</p>
                            <p className="mt-1 text-xs text-slate-400">{form.date_of_birth ? 'Date of birth as DDMMYYYY' : 'Default — student should change this'}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => { onSuccess(); onClose() }}
                        className="mt-6 w-full rounded-xl bg-brand-navy-700 py-3.5 text-sm font-black uppercase tracking-widest text-white"
                    >
                        Done
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
                <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                    <h2 className="text-lg font-black text-slate-950">Add New Student</h2>
                    <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
                </div>
                <form onSubmit={submit} className="space-y-5 p-6">
                    <div className="rounded-xl bg-brand-navy-50 px-4 py-3 text-xs font-bold text-brand-navy-700">
                        Default password = Date of birth (DDMMYYYY). If DOB not provided, password is "student123".
                    </div>

                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Student Info</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Full Name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
                        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                        <Field label="Phone (optional)" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                        <Field label="Date of Birth" type="date" value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Admission No" value={form.admission_no} onChange={(v) => setForm({ ...form, admission_no: v })} required />
                        <Field label="Roll No" value={form.roll_no} onChange={(v) => setForm({ ...form, roll_no: v })} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Blood Group">
                            <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-bold outline-none focus:border-brand-navy-500">
                                <option value="">Not known</option>
                                {['A+','A−','B+','B−','O+','O−','AB+','AB−'].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                        </Field>
                        <Field label="Academic Year" value={form.academic_year} onChange={(v) => setForm({ ...form, academic_year: v })} />
                    </div>

                    {/* Class Assignment */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Class Assignment</p>
                        <button
                            type="button"
                            onClick={() => setShowCreateClass((v) => !v)}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black text-brand-navy-600 hover:bg-brand-navy-50"
                        >
                            <Plus size={13} />
                            {showCreateClass ? 'Cancel' : 'New Class'}
                        </button>
                    </div>

                    {showCreateClass ? (
                        <div className="rounded-2xl border border-brand-navy-200 bg-brand-navy-50 p-4 space-y-3">
                            <p className="text-xs font-black text-brand-navy-700">Create a new class section</p>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <Field label="Class (e.g. 9)" value={newClass.class_name} onChange={(v) => setNewClass((n) => ({ ...n, class_name: v }))} />
                                <Field label="Section (e.g. B)" value={newClass.section} onChange={(v) => setNewClass((n) => ({ ...n, section: v }))} />
                                <Field label="Year (e.g. 2025-26)" value={newClass.academic_year} onChange={(v) => setNewClass((n) => ({ ...n, academic_year: v }))} />
                            </div>
                            <button
                                type="button"
                                disabled={creatingClass}
                                onClick={createClass}
                                className="flex items-center gap-2 rounded-xl bg-brand-navy-700 px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
                            >
                                {creatingClass ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />}
                                Create Class
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {sections.map((cs) => (
                                <button key={cs.id} type="button"
                                    style={{ touchAction: 'manipulation' }}
                                    onClick={() => selectClass(cs)}
                                    className={`rounded-xl border px-4 py-2 text-sm font-black transition-all ${form.class_section_id === cs.id ? 'border-brand-navy-500 bg-brand-navy-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-navy-300'}`}>
                                    Class {cs.class_name}-{cs.section}
                                </button>
                            ))}
                            {sections.length === 0 && (
                                <p className="text-sm text-slate-400">No classes yet. Create one using "New Class" above.</p>
                            )}
                        </div>
                    )}

                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Guardian Info</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Guardian Name" value={form.guardian_name} onChange={(v) => setForm({ ...form, guardian_name: v })} />
                        <Field label="Guardian Phone" type="tel" value={form.guardian_phone} onChange={(v) => setForm({ ...form, guardian_phone: v })} />
                    </div>
                    <Field label="Address">
                        <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="min-h-16 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-bold outline-none focus:border-brand-navy-500" />
                    </Field>

                    <button type="submit" disabled={saving}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy-700 py-3.5 text-sm font-black uppercase tracking-widest text-white disabled:opacity-60">
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                        Add Student
                    </button>
                </form>
            </div>
        </div>
    )
}

const StudentProfileCard = ({ student, onDisable, disabling }) => {
    const [open, setOpen] = useState(false)
    const isActive = (student.profile.status || 'active') === 'active'

    return (
        <div className={`rounded-2xl border bg-white shadow-sm transition-all ${!isActive ? 'opacity-60' : ''} ${open ? 'border-brand-navy-300' : 'border-slate-200'}`}>
            {/* Summary row — always visible */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                style={{ touchAction: 'manipulation' }}
                className="flex w-full items-start justify-between gap-4 p-4 text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-navy-100 text-sm font-black text-brand-navy-700">
                        {student.user.full_name?.[0]}
                    </div>
                    <div>
                        <p className="font-black text-slate-950">{student.user.full_name}</p>
                        <p className="text-xs font-bold text-slate-500">
                            Class {student.profile.class_name}-{student.profile.section}
                            {student.profile.roll_no ? ` · Roll ${student.profile.roll_no}` : ''}
                            {' · '}{student.profile.admission_no}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status={student.profile.status || 'active'} />
                    {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </button>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-px border-t border-slate-100 bg-slate-100">
                <div className="bg-white px-3 py-2 text-center">
                    <p className="text-xs font-black text-slate-400">Attendance</p>
                    <p className="font-black text-slate-900">{student.attendance_percent}%</p>
                </div>
                <div className="bg-white px-3 py-2 text-center">
                    <p className="text-xs font-black text-slate-400">Avg Marks</p>
                    <p className="font-black text-slate-900">{student.latest_average_percent}%</p>
                </div>
                <div className="bg-white px-3 py-2 text-center">
                    <p className="text-xs font-black text-rose-400">Fee Due</p>
                    <p className="font-black text-rose-700">{money(student.fee_due_paise)}</p>
                </div>
            </div>

            {/* Expanded profile */}
            {open && (
                <div className="border-t border-slate-100 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {student.profile.date_of_birth && <Info label="Date of Birth" value={formatDate(student.profile.date_of_birth)} />}
                        {student.profile.blood_group && <Info label="Blood Group" value={student.profile.blood_group} />}
                        <Info label="Guardian" value={student.profile.guardian_name} />
                        {student.profile.guardian_phone && (
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Guardian Phone</p>
                                <a href={`tel:${student.profile.guardian_phone}`} className="mt-1 flex items-center gap-1.5 font-black text-brand-navy-700">
                                    <Phone size={14} /> {student.profile.guardian_phone}
                                </a>
                            </div>
                        )}
                        {student.user.phone && (
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Student Phone</p>
                                <a href={`tel:${student.user.phone}`} className="mt-1 flex items-center gap-1.5 font-black text-brand-navy-700">
                                    <Phone size={14} /> {student.user.phone}
                                </a>
                            </div>
                        )}
                        {student.profile.address && (
                            <div className="rounded-xl bg-slate-50 px-4 py-3 sm:col-span-2">
                                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Address</p>
                                <p className="mt-1 font-bold text-slate-900">{student.profile.address}</p>
                            </div>
                        )}
                        <Info label="Email" value={student.user.email} />
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={() => onDisable(student)}
                            disabled={disabling}
                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-60 ${
                                isActive
                                    ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                        >
                            {disabling ? <Loader2 className="animate-spin" size={14} /> : isActive ? <UserMinus size={14} /> : <UserPlus size={14} />}
                            {isActive ? 'Disable Student' : 'Re-enable Student'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

const TeacherStudents = ({ dashboard, studentMap, apiRequest }) => {
    const [search, setSearch] = useState('')
    const [selectedSection, setSelectedSection] = useState(null) // null = all
    const [showAddModal, setShowAddModal] = useState(false)
    const [classSections, setClassSections] = useState([])
    const [allStudents, setAllStudents] = useState([])
    const [loadingAll, setLoadingAll] = useState(true)
    const [classStudents, setClassStudents] = useState(null) // fetched for a specific class
    const [loadingClass, setLoadingClass] = useState(false)
    const [disablingId, setDisablingId] = useState(null)
    const [confirmDisable, setConfirmDisable] = useState(null) // student object pending confirmation

    useEffect(() => {
        // Load all students (not just teacher's class) for the full browse view
        apiRequest(API_ENDPOINTS.erpStudents)
            .then(setAllStudents)
            .catch(() => toast.error('Could not load students'))
            .finally(() => setLoadingAll(false))
        apiRequest(API_ENDPOINTS.erpClassSections).then(setClassSections).catch(() => {})
    }, []) // eslint-disable-line

    const selectSection = async (cs) => {
        if (selectedSection?.id === cs?.id) return
        setSelectedSection(cs)
        if (!cs) {
            setClassStudents(null)
            return
        }
        setLoadingClass(true)
        try {
            const data = await apiRequest(API_ENDPOINTS.erpClassSectionStudents(cs.id))
            setClassStudents(data)
        } catch {
            toast.error('Could not load class students')
            setClassStudents([])
        } finally {
            setLoadingClass(false)
        }
    }

    const students = selectedSection ? (classStudents ?? []) : allStudents

    const filtered = students.filter((s) => {
        const q = search.toLowerCase()
        return s.user.full_name.toLowerCase().includes(q) ||
            s.profile.admission_no?.toLowerCase().includes(q)
    })

    const active = filtered.filter((s) => (s.profile.status || 'active') === 'active')
    const inactive = filtered.filter((s) => (s.profile.status || 'active') !== 'active')

    const applyStatusChange = (profileId, newStatus) => {
        const updater = (prev) => prev.map((s) =>
            s.profile.id === profileId ? { ...s, profile: { ...s.profile, status: newStatus } } : s
        )
        setAllStudents(updater)
        if (classStudents) setClassStudents(updater)
    }

    const handleDisable = async (student) => {
        const isActive = (student.profile.status || 'active') === 'active'
        const newStatus = isActive ? 'withdrawn' : 'active'
        setDisablingId(student.profile.id)
        setConfirmDisable(null)
        try {
            await apiRequest(`${API_ENDPOINTS.erpBase}/teacher/students/${student.profile.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            })
            applyStatusChange(student.profile.id, newStatus)
            toast.success(`Student ${isActive ? 'disabled' : 're-enabled'}`)
        } catch (err) {
            toast.error(err.message || 'Could not update student status')
        } finally {
            setDisablingId(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-slate-950">Students</h1>
                <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-navy-700 px-4 py-2.5 text-sm font-black uppercase tracking-wider text-white hover:bg-brand-navy-800"
                >
                    <UserPlus size={16} />
                    Add Student
                </button>
            </div>

            {/* Class filter chips — always visible, from all class sections */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ overscrollBehavior: 'contain' }}>
                <button
                    type="button"
                    style={{ touchAction: 'manipulation' }}
                    onClick={() => selectSection(null)}
                    className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-black transition-all ${!selectedSection ? 'border-brand-navy-500 bg-brand-navy-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-navy-300'}`}
                >All</button>
                {classSections.map((cs) => (
                    <button key={cs.id} type="button"
                        style={{ touchAction: 'manipulation' }}
                        onClick={() => selectSection(cs)}
                        className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-black transition-all ${selectedSection?.id === cs.id ? 'border-brand-navy-500 bg-brand-navy-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-navy-300'}`}
                    >
                        {cs.class_name}-{cs.section}
                    </button>
                ))}
            </div>

            <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or admission no..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-bold outline-none focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-100"
            />

            {selectedSection && (
                <div className="flex items-center gap-2 rounded-xl bg-brand-navy-50 px-4 py-2.5 text-sm font-bold text-brand-navy-700">
                    <Users size={15} />
                    Class {selectedSection.class_name}-{selectedSection.section} · {selectedSection.academic_year}
                </div>
            )}

            {(loadingAll && !selectedSection) || loadingClass ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-brand-navy-400" size={28} /></div>
            ) : filtered.length === 0 ? (
                <EmptyState title="No students found" icon={<Users size={32} />} />
            ) : (
                <div className="space-y-3">
                    {active.map((student) => (
                        <StudentProfileCard
                            key={student.profile.id}
                            student={student}
                            onDisable={(s) => setConfirmDisable(s)}
                            disabling={disablingId === student.profile.id}
                        />
                    ))}
                    {inactive.length > 0 && (
                        <>
                            <p className="pt-2 text-xs font-black uppercase tracking-wider text-slate-400">Inactive / Left School</p>
                            {inactive.map((student) => (
                                <StudentProfileCard
                                    key={student.profile.id}
                                    student={student}
                                    onDisable={(s) => setConfirmDisable(s)}
                                    disabling={disablingId === student.profile.id}
                                />
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* Inline confirm modal (replaces window.confirm) */}
            {confirmDisable && (
                <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4">
                    <div className="w-full max-w-sm rounded-t-3xl bg-white p-7 shadow-2xl sm:rounded-2xl">
                        <h3 className="text-base font-black text-slate-950">
                            {(confirmDisable.profile.status || 'active') === 'active' ? 'Disable student?' : 'Re-enable student?'}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            {(confirmDisable.profile.status || 'active') === 'active'
                                ? `${confirmDisable.user.full_name} will not be able to log in until re-enabled.`
                                : `${confirmDisable.user.full_name} will be able to log in again.`}
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmDisable(null)}
                                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600"
                            >Cancel</button>
                            <button
                                type="button"
                                onClick={() => handleDisable(confirmDisable)}
                                className={`flex-1 rounded-xl py-3 text-sm font-black text-white ${(confirmDisable.profile.status || 'active') === 'active' ? 'bg-rose-600' : 'bg-emerald-600'}`}
                            >
                                {(confirmDisable.profile.status || 'active') === 'active' ? 'Disable' : 'Re-enable'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAddModal && (
                <AddStudentModal
                    classSections={classSections}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        // Refresh whichever list is visible
                        if (selectedSection) {
                            selectSection(selectedSection)
                        }
                        // Always refresh the all-students list
                        apiRequest(API_ENDPOINTS.erpStudents).then(setAllStudents).catch(() => {})
                    }}
                    apiRequest={apiRequest}
                />
            )}
        </div>
    )
}

const TeacherLeaves = ({ dashboard, updateLeave, busyId, studentMap }) => (
    <div className="space-y-4">
        <h1 className="text-2xl font-black text-slate-950">Leave Requests</h1>
        {dashboard.leaves.length === 0 ? (
            <EmptyState title="No leave requests yet" icon={<Bell size={32} />} />
        ) : (
            <div className="space-y-3">
                {dashboard.leaves.map((leave) => (
                    <div key={leave.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="font-black text-slate-950">{studentMap[leave.student_id]?.user?.full_name || 'Student'}</p>
                                <p className="text-sm font-bold text-slate-500">{formatDate(leave.from_date)} to {formatDate(leave.to_date)} · {leave.days_count} day(s)</p>
                                <p className="mt-2 text-sm text-slate-600">{leave.reason}</p>
                            </div>
                            <StatusBadge status={leave.status} />
                        </div>
                        {leave.status === 'pending' && (
                            <div className="mt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => updateLeave(leave, 'approved')}
                                    disabled={busyId === `${leave.id}-approved`}
                                    className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-black uppercase tracking-wider text-white disabled:opacity-60"
                                >
                                    {busyId === `${leave.id}-approved` ? <Loader2 className="mx-auto animate-spin" size={16} /> : 'Approve'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateLeave(leave, 'rejected')}
                                    disabled={busyId === `${leave.id}-rejected`}
                                    className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-black uppercase tracking-wider text-white disabled:opacity-60"
                                >
                                    {busyId === `${leave.id}-rejected` ? <Loader2 className="mx-auto animate-spin" size={16} /> : 'Reject'}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
    </div>
)

const TeacherMarks = ({ dashboard, createMark, studentMap }) => {
    const [form, setForm] = useState({
        student_id: '',
        subject: dashboard.profile.subject || '',
        exam_name: '',
        marks_obtained: '',
        max_marks: '100',
        grade: '',
        remarks: '',
        exam_date: today(),
    })
    const [saving, setSaving] = useState(false)

    const submit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await createMark({
                ...form,
                student_id: Number(form.student_id),
                marks_obtained: Number(form.marks_obtained),
                max_marks: Number(form.max_marks),
                grade: form.grade || null,
                remarks: form.remarks || null,
            })
            setForm({ ...form, exam_name: '', marks_obtained: '', grade: '', remarks: '' })
        } catch (err) {
            toast.error(err.message || 'Could not save marks')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black text-slate-950">Marks</h1>
            <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
                <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-lg font-black text-slate-950">Add Marks</h2>
                    <div className="space-y-4">
                        <Field label="Student">
                            <select
                                value={form.student_id}
                                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-bold outline-none focus:border-brand-navy-500"
                                required
                            >
                                <option value="">Select student</option>
                                {dashboard.students.map((s) => (
                                    <option key={s.profile.id} value={s.profile.id}>
                                        {s.user.full_name} ({s.profile.class_name}-{s.profile.section})
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} required />
                            <Field label="Exam" value={form.exam_name} onChange={(v) => setForm({ ...form, exam_name: v })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Marks" type="number" value={form.marks_obtained} onChange={(v) => setForm({ ...form, marks_obtained: v })} required />
                            <Field label="Max" type="number" value={form.max_marks} onChange={(v) => setForm({ ...form, max_marks: v })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Grade" value={form.grade} onChange={(v) => setForm({ ...form, grade: v })} />
                            <Field label="Date" type="date" value={form.exam_date} onChange={(v) => setForm({ ...form, exam_date: v })} required />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-400">Remarks</label>
                            <textarea
                                value={form.remarks}
                                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                                className="min-h-20 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-bold outline-none focus:border-brand-navy-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy-700 py-3.5 text-sm font-black uppercase tracking-widest text-white hover:bg-brand-navy-800 disabled:opacity-60"
                        >
                            {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                            Save Marks
                        </button>
                    </div>
                </form>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-black text-slate-950">Recorded Marks</h2>
                    {dashboard.marks.length === 0
                        ? <EmptyState title="No marks yet" icon={<BookOpen size={32} />} />
                        : <MarksTable marks={dashboard.marks} studentMap={studentMap} />}
                </div>
            </div>
        </div>
    )
}

const PercentBar = ({ value, max = 100, color = 'bg-brand-navy-600' }) => {
    const pct = Math.min(100, Math.round((value / max) * 100))
    const barColor = value >= 75 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-400' : 'bg-rose-500'
    return (
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
                className={`absolute left-0 top-0 h-full rounded-full transition-all ${color === 'auto' ? barColor : color}`}
                style={{ width: `${pct}%` }}
            />
        </div>
    )
}

const GradePill = ({ grade, count, total }) => {
    const colors = {
        'A+': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'A': 'bg-emerald-50 text-emerald-700 border-emerald-100',
        'B+': 'bg-sky-100 text-sky-800 border-sky-200',
        'B': 'bg-sky-50 text-sky-700 border-sky-100',
        'C': 'bg-amber-50 text-amber-700 border-amber-100',
        'D': 'bg-rose-50 text-rose-700 border-rose-100',
    }
    if (count === 0) return null
    const pct = total > 0 ? Math.round(count / total * 100) : 0
    return (
        <div className={`flex flex-col items-center rounded-xl border px-3 py-2.5 ${colors[grade] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
            <span className="text-lg font-black">{grade}</span>
            <span className="text-xs font-black">{count} <span className="font-bold opacity-60">({pct}%)</span></span>
        </div>
    )
}

const TeacherAnalytics = ({ apiRequest, dashboard }) => {
    const [classSections, setClassSections] = useState([])
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedLabel, setSelectedLabel] = useState('')
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        apiRequest(API_ENDPOINTS.erpClassSections).then((sections) => {
            setClassSections(sections)
            if (sections.length === 1) {
                setSelectedClass(String(sections[0].id))
                setSelectedLabel(`Class ${sections[0].class_name}-${sections[0].section}`)
            }
        }).catch(() => {})
    }, []) // eslint-disable-line

    useEffect(() => {
        if (!selectedClass) return
        setLoading(true)
        setAnalytics(null)
        apiRequest(`${API_ENDPOINTS.erpClassAnalytics}/${selectedClass}`)
            .then(setAnalytics)
            .catch(() => toast.error('Could not load analytics'))
            .finally(() => setLoading(false))
    }, [selectedClass]) // eslint-disable-line

    const totalGrades = analytics
        ? Object.values(analytics.grade_distribution).reduce((a, b) => a + b, 0)
        : 0

    const monthLabel = (m) => {
        const [year, month] = m.split('-')
        return new Date(year, month - 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-slate-950">Analytics</h1>
                    {selectedLabel && <p className="text-sm font-bold text-slate-500">{selectedLabel}</p>}
                </div>
                {classSections.length > 1 && (
                    <select
                        value={selectedClass}
                        onChange={(e) => {
                            setSelectedClass(e.target.value)
                            const cs = classSections.find((c) => String(c.id) === e.target.value)
                            if (cs) setSelectedLabel(`Class ${cs.class_name}-${cs.section}`)
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-bold outline-none focus:border-brand-navy-500"
                    >
                        <option value="">Select class</option>
                        {classSections.map((cs) => (
                            <option key={cs.id} value={cs.id}>Class {cs.class_name}-{cs.section}</option>
                        ))}
                    </select>
                )}
            </div>

            {!selectedClass && <EmptyState title="Select a class to view analytics" icon={<BarChart2 size={32} />} />}
            {loading && <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-brand-navy-600" size={32} /></div>}

            {analytics && !loading && (
                <div className="space-y-6">

                    {/* KPI row — academic focus */}
                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        <StatTile
                            label="Students"
                            value={analytics.student_count}
                            icon={<Users size={19} />}
                            tone="navy"
                        />
                        <StatTile
                            label="Avg Attendance"
                            value={analytics.overall_attendance_percent > 0 ? `${analytics.overall_attendance_percent}%` : '—'}
                            icon={<ClipboardList size={19} />}
                            tone={analytics.overall_attendance_percent >= 75 ? 'emerald' : analytics.overall_attendance_percent > 0 ? 'gold' : 'slate'}
                            sub={analytics.overall_attendance_percent > 0 && analytics.overall_attendance_percent < 75 ? 'Below 75% threshold' : null}
                        />
                        <StatTile
                            label="Class Average"
                            value={analytics.overall_average_percent > 0 ? `${analytics.overall_average_percent}%` : '—'}
                            icon={<BookOpen size={19} />}
                            tone={analytics.overall_average_percent >= 60 ? 'navy' : analytics.overall_average_percent > 0 ? 'gold' : 'slate'}
                        />
                        <StatTile
                            label="Need Attention"
                            value={analytics.needs_attention.length}
                            icon={<Bell size={19} />}
                            tone={analytics.needs_attention.length > 0 ? 'crimson' : 'slate'}
                            sub={analytics.needs_attention.length > 0 ? 'Low marks or attendance' : 'All on track'}
                        />
                    </div>

                    {/* Needs Attention — most actionable, shown first */}
                    {analytics.needs_attention.length > 0 && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Bell size={18} className="text-rose-600" />
                                <h2 className="text-lg font-black text-rose-900">Students Needing Attention</h2>
                            </div>
                            <p className="mb-4 text-xs font-bold text-rose-600">Attendance below 75% or marks average below 50%</p>
                            <div className="space-y-3">
                                {analytics.needs_attention.map((s) => {
                                    const attLow = s.attendance_count > 0 && s.attendance_percent < 75
                                    const marksLow = s.marks_count > 0 && s.average_percent < 50
                                    return (
                                        <div key={s.student_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                                            <div>
                                                <p className="font-black text-slate-950">{s.name}</p>
                                                {s.roll_no && <p className="text-xs text-slate-400">Roll {s.roll_no}</p>}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {attLow && (
                                                    <span className="rounded-lg bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">
                                                        Attendance {s.attendance_percent}%
                                                    </span>
                                                )}
                                                {marksLow && (
                                                    <span className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                                                        Marks avg {s.average_percent}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid gap-6 xl:grid-cols-2">
                        {/* Subject performance */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-1 text-lg font-black text-slate-950">Subject Performance</h2>
                            <p className="mb-5 text-xs font-bold text-slate-400">Class average per subject</p>
                            {analytics.marks_by_subject.length === 0 ? (
                                <EmptyState title="No marks entered yet" icon={<BookOpen size={28} />} />
                            ) : (
                                <div className="space-y-4">
                                    {analytics.marks_by_subject.map((sub) => (
                                        <div key={sub.subject}>
                                            <div className="mb-1.5 flex items-center justify-between">
                                                <span className="text-sm font-black text-slate-800">{sub.subject}</span>
                                                <span className={`text-sm font-black ${sub.average_percent >= 75 ? 'text-emerald-700' : sub.average_percent >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                                                    {sub.average_percent}%
                                                </span>
                                            </div>
                                            <PercentBar value={sub.average_percent} color="auto" />
                                            <p className="mt-1 text-xs text-slate-400">
                                                {sub.average_percent >= 75 ? 'Strong' : sub.average_percent >= 50 ? 'Needs improvement' : 'Weak — needs focus'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Attendance trend */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-1 text-lg font-black text-slate-950">Attendance by Month</h2>
                            <p className="mb-5 text-xs font-bold text-slate-400">Present days as % of school days</p>
                            {analytics.attendance_by_month.length === 0 ? (
                                <EmptyState title="No attendance marked yet" icon={<ClipboardList size={28} />} />
                            ) : (
                                <div className="space-y-3">
                                    {analytics.attendance_by_month.map((m) => (
                                        <div key={m.month}>
                                            <div className="mb-1.5 flex items-center justify-between">
                                                <span className="text-sm font-black text-slate-700">{monthLabel(m.month)}</span>
                                                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                                    <span className="text-emerald-700">{m.present}P</span>
                                                    <span className="text-rose-600">{m.absent}A</span>
                                                    {m.leave > 0 && <span className="text-amber-600">{m.leave}L</span>}
                                                    <span className={`font-black ${m.percent >= 75 ? 'text-emerald-700' : 'text-rose-600'}`}>{m.percent}%</span>
                                                </div>
                                            </div>
                                            <PercentBar value={m.percent} color="auto" />
                                        </div>
                                    ))}
                                    <div className="mt-2 flex items-center gap-4 text-xs font-bold text-slate-400">
                                        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />≥75% good</span>
                                        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />50–74% concern</span>
                                        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-rose-500" />&lt;50% critical</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Grade distribution + top performers */}
                    <div className="grid gap-6 xl:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-1 text-lg font-black text-slate-950">Grade Distribution</h2>
                            <p className="mb-5 text-xs font-bold text-slate-400">Across all marks entries ({totalGrades} total)</p>
                            {totalGrades === 0 ? (
                                <EmptyState title="No marks entered yet" icon={<BarChart2 size={28} />} />
                            ) : (
                                <>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(analytics.grade_distribution).map(([grade, count]) => (
                                            <GradePill key={grade} grade={grade} count={count} total={totalGrades} />
                                        ))}
                                    </div>
                                    <div className="mt-5 space-y-2">
                                        {Object.entries(analytics.grade_distribution)
                                            .filter(([, count]) => count > 0)
                                            .map(([grade, count]) => (
                                                <div key={grade} className="flex items-center gap-3">
                                                    <span className="w-7 text-xs font-black text-slate-600">{grade}</span>
                                                    <div className="flex-1">
                                                        <div className="h-2 rounded-full bg-slate-100">
                                                            <div
                                                                className={`h-full rounded-full ${grade.startsWith('A') ? 'bg-emerald-500' : grade.startsWith('B') ? 'bg-sky-500' : grade === 'C' ? 'bg-amber-400' : 'bg-rose-500'}`}
                                                                style={{ width: `${Math.round(count / totalGrades * 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <span className="w-6 text-right text-xs font-black text-slate-500">{count}</span>
                                                </div>
                                            ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-1 text-lg font-black text-slate-950">Top Performers</h2>
                            <p className="mb-5 text-xs font-bold text-slate-400">By average marks percentage</p>
                            {analytics.top_performers.length === 0 ? (
                                <EmptyState title="No marks data yet" icon={<TrendingUp size={28} />} />
                            ) : (
                                <div className="space-y-3">
                                    {analytics.top_performers.map((s, i) => (
                                        <div key={s.student_id}>
                                            <div className="mb-1.5 flex items-center gap-3">
                                                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${i === 0 ? 'bg-amber-400 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>
                                                    {i + 1}
                                                </span>
                                                <span className="flex-1 truncate text-sm font-black text-slate-900">{s.name}</span>
                                                <span className="text-sm font-black text-emerald-700">{s.average_percent}%</span>
                                            </div>
                                            <PercentBar value={s.average_percent} color="bg-emerald-500" />
                                        </div>
                                    ))}
                                    {analytics.struggling_students.length > 0 && (
                                        <>
                                            <p className="pt-2 text-xs font-black uppercase tracking-wider text-slate-400">Struggling</p>
                                            {analytics.struggling_students.map((s) => (
                                                <div key={s.student_id}>
                                                    <div className="mb-1.5 flex items-center gap-3">
                                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-black text-rose-600">!</span>
                                                        <span className="flex-1 truncate text-sm font-black text-slate-900">{s.name}</span>
                                                        <span className="text-sm font-black text-rose-600">{s.average_percent}%</span>
                                                    </div>
                                                    <PercentBar value={s.average_percent} color="bg-rose-400" />
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
    )
}

// ── Shared Table Components ──────────────────────────────────────────────────

const MarksTable = ({ marks, studentMap }) => (
    <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
            <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-400">
                    {studentMap && <th className="pb-3 pr-4 text-left">Student</th>}
                    <th className="pb-3 pr-4 text-left">Exam</th>
                    <th className="pb-3 pr-4 text-left">Subject</th>
                    <th className="pb-3 pr-4 text-left">Date</th>
                    <th className="pb-3 pr-4 text-left">Marks</th>
                    <th className="pb-3 pr-4 text-left">Grade</th>
                </tr>
            </thead>
            <tbody>
                {marks.map((mark) => (
                    <tr key={mark.id} className="border-b border-slate-100 last:border-0">
                        {studentMap && <td className="py-3 pr-4 font-black text-slate-950">{studentMap[mark.student_id]?.user?.full_name || '—'}</td>}
                        <td className="py-3 pr-4 font-black text-slate-950">{mark.exam_name}</td>
                        <td className="py-3 pr-4 font-bold text-slate-600">{mark.subject}</td>
                        <td className="py-3 pr-4 font-bold text-slate-500">{formatDate(mark.exam_date)}</td>
                        <td className="py-3 pr-4 font-black text-slate-950">{mark.marks_obtained}/{mark.max_marks}</td>
                        <td className={`py-3 pr-4 font-black ${gradeColor(mark.grade)}`}>{mark.grade || '—'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)

const TeacherStudentTable = ({ students }) => (
    <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
            <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pr-4 text-left">Student</th>
                    <th className="pb-3 pr-4 text-left">Class</th>
                    <th className="pb-3 pr-4 text-left">Attendance</th>
                    <th className="pb-3 pr-4 text-left">Avg Marks</th>
                    <th className="pb-3 pr-4 text-left">Fee Due</th>
                </tr>
            </thead>
            <tbody>
                {students.map((student) => (
                    <tr key={student.profile.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-4">
                            <p className="font-black text-slate-950">{student.user.full_name}</p>
                            <p className="text-xs font-bold text-slate-400">{student.profile.admission_no}</p>
                        </td>
                        <td className="py-3 pr-4 font-bold text-slate-600">{student.profile.class_name}-{student.profile.section}</td>
                        <td className="py-3 pr-4 font-black text-slate-950">{student.attendance_percent}%</td>
                        <td className="py-3 pr-4 font-black text-brand-navy-700">{student.latest_average_percent}%</td>
                        <td className="py-3 pr-4 font-black text-brand-crimson-700">{money(student.fee_due_paise)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)

// ── Receipt Modal ─────────────────────────────────────────────────────────────

const ReceiptModal = ({ receiptData, onClose }) => {
    const r = receiptData
    const balance = Math.max(0, (r.invoice.amount_paise || 0) - (r.invoice.paid_paise || 0))
    return (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="max-h-[95dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
                {/* Modal header bar */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                            <Receipt size={17} className="text-emerald-700" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Payment Receipt</p>
                            <p className="text-sm font-black text-slate-950">{r.receipt_no}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {r.profile.guardian_phone ? (
                            <button
                                type="button"
                                onClick={() => shareReceiptWhatsApp(r)}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-[#1ebe5d]"
                                title={`Share with guardian (${r.profile.guardian_phone})`}
                            >
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                Share
                            </button>
                        ) : (
                            <span className="text-[10px] font-bold text-slate-400" title="No guardian phone on file">No guardian phone</span>
                        )}
                        <button
                            type="button"
                            onClick={() => printReceiptPDF(r)}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand-navy-700 px-3 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-brand-navy-800"
                        >
                            <Printer size={13} /> PDF
                        </button>
                        <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                            <X size={17} />
                        </button>
                    </div>
                </div>

                {/* Document preview */}
                <div className="p-6 sm:p-8">
                    {/* School header */}
                    <div className="mb-6 flex items-start justify-between gap-4 border-b-2 border-brand-gold-500 pb-5">
                        <div className="flex items-center gap-4">
                            <img src="/images/logo.png" alt="NEV Logo" className="h-16 w-16 object-contain" onError={(e) => { e.target.style.display = 'none' }} />
                            <div>
                                <h1 className="font-display text-xl font-black text-brand-navy-900">Narendra Edu Valley</h1>
                                <p className="text-[10px] font-bold tracking-widest text-brand-gold-600 uppercase">सा विद्या या विमुक्तये</p>
                                <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">Naya Gao Chainpur Siswan, Siwan, Bihar 841203<br />+91 70504 21421 · info@nevalley.edu.in</p>
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="text-[9px] font-black uppercase tracking-[.2em] text-brand-crimson-600">Payment Receipt</p>
                            <p className="font-display text-lg font-black text-slate-950">{r.receipt_no}</p>
                            <p className="text-xs text-slate-500">Issued {formatDate(r.issued_at)}</p>
                            <span className="mt-2 inline-block rounded-full border-2 border-emerald-500 bg-emerald-50 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">● PAID</span>
                        </div>
                    </div>

                    {/* Student details */}
                    <p className="mb-2 text-[9px] font-black uppercase tracking-[.2em] text-slate-400">Student Details</p>
                    <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                        {[
                            { label: 'Student Name', value: r.student.full_name },
                            { label: 'Admission No', value: r.profile.admission_no },
                            { label: 'Class & Section', value: `${r.profile.class_name}-${r.profile.section}` },
                            { label: 'Guardian', value: r.profile.guardian_name || '—' },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                                <p className="text-sm font-bold text-slate-950">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Invoice table */}
                    <p className="mb-2 text-[9px] font-black uppercase tracking-[.2em] text-slate-400">Invoice Details</p>
                    <div className="mb-5 overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-brand-navy-900 text-white">
                                    <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-wider">Invoice No</th>
                                    <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-wider">Description</th>
                                    <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-wider">Term</th>
                                    <th className="px-4 py-2.5 text-right text-[9px] font-black uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-2.5 text-right text-[9px] font-black uppercase tracking-wider">Paid</th>
                                    <th className="px-4 py-2.5 text-right text-[9px] font-black uppercase tracking-wider">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-slate-100">
                                    <td className="px-4 py-3 font-bold text-slate-950">{r.invoice.invoice_no}</td>
                                    <td className="px-4 py-3 text-slate-700">{r.invoice.title}</td>
                                    <td className="px-4 py-3 text-slate-500">{r.invoice.term || '—'}</td>
                                    <td className="px-4 py-3 text-right font-bold">{money(r.invoice.amount_paise)}</td>
                                    <td className="px-4 py-3 text-right font-black text-emerald-700">{money(r.payment.amount_paise)}</td>
                                    <td className={`px-4 py-3 text-right font-black ${balance > 0 ? 'text-brand-crimson-600' : 'text-emerald-700'}`}>{money(balance)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-200 bg-slate-50">
                                    <td colSpan={4} className="px-4 py-2.5 text-xs font-bold text-slate-500">Total for this receipt</td>
                                    <td className="px-4 py-2.5 text-right text-base font-black text-slate-950">{money(r.payment.amount_paise)}</td>
                                    <td className={`px-4 py-2.5 text-right font-black ${balance > 0 ? 'text-brand-crimson-600' : 'text-emerald-700'}`}>{money(balance)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Payment details */}
                    <p className="mb-2 text-[9px] font-black uppercase tracking-[.2em] text-slate-400">Payment Details</p>
                    <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Method</p>
                            <p className="text-sm font-bold capitalize text-slate-950">{r.payment.method}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Payment Date</p>
                            <p className="text-sm font-bold text-slate-950">{formatDate(r.payment.paid_at)}</p>
                        </div>
                        {r.payment.razorpay_payment_id && (
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Transaction ID</p>
                                <p className="text-xs font-bold text-slate-700 break-all">{r.payment.razorpay_payment_id}</p>
                            </div>
                        )}
                    </div>

                    {/* Signature row */}
                    <div className="mt-2 flex items-end justify-between border-t border-slate-200 pt-6">
                        <div className="w-36 text-center">
                            <div className="mb-1.5 h-10 border-b-2 border-slate-800" />
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Authorised Signatory</p>
                        </div>
                        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-[3px] border-emerald-500 text-center">
                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 leading-tight">PAID</span>
                        </div>
                        <div className="w-36 text-center">
                            <div className="mb-1.5 h-10 border-b-2 border-slate-800" />
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Principal / Director</p>
                        </div>
                    </div>

                    <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-[.15em] text-slate-300">
                        Computer-generated document · Narendra Edu Valley ERP
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ERPPortal
