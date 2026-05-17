import { BookOpen, Lock, Mail, School, Shield, ShieldCheck, User, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'

const roleOptions = [
    {
        id: 'student',
        label: 'Student',
        icon: <User size={20} />,
        email: '',
        password: '',
        notes: ['Fee history', 'Marks', 'Leaves', 'Receipts'],
    },
    {
        id: 'teacher',
        label: 'Teacher',
        icon: <Users size={20} />,
        email: '',
        password: '',
        notes: ['Class overview', 'Leave approvals', 'Marks entry', 'Student records'],
    },
    {
        id: 'guardian',
        label: 'Guardian',
        icon: <Shield size={20} />,
        email: '',
        password: '',
        notes: ["Child's fees", 'Attendance', 'Leave status', 'Messages'],
    },
]

const ERPLogin = () => {
    const [role, setRole] = useState('student')
    const [credentials, setCredentials] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (localStorage.getItem('erpToken')) {
            navigate('/erp')
        }
    }, [navigate])

    const selectRole = (nextRole) => {
        const option = roleOptions.find((item) => item.id === nextRole)
        setRole(nextRole)
        setCredentials({ email: option.email, password: option.password })
        setError('')
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch(API_ENDPOINTS.erpLogin, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            })
            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.detail || 'Invalid ERP credentials')
            }
            localStorage.setItem('erpToken', data.access_token)
            localStorage.setItem('erpUser', JSON.stringify(data.user))
            navigate('/erp')
        } catch (err) {
            setError(err.message || 'Could not connect to ERP')
        } finally {
            setLoading(false)
        }
    }

    const selectedRole = roleOptions.find((item) => item.id === role)

    return (
        <div className="min-h-screen bg-slate-50">
            <section className="border-b border-slate-200 bg-white">
                <div className="container py-8 md:py-10">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="mb-3 flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-navy-600 text-white">
                                    <School size={20} />
                                </span>
                                <span className="text-xs font-black uppercase tracking-[0.25em] text-brand-navy-500">School ERP</span>
                            </div>
                            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-950 md:text-4xl">ERP Login</h1>
                            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
                                Secure access for students and teachers of Narendra Edu Valley.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-slate-100 p-2">
                            {roleOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => selectRole(option.id)}
                                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wider transition-all ${
                                        role === option.id
                                            ? 'bg-white text-brand-navy-700 shadow-sm'
                                            : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'
                                    }`}
                                >
                                    {option.icon}
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="container grid gap-8 py-10 lg:grid-cols-[1fr_420px] lg:items-start">
                <div className="grid gap-4 md:grid-cols-3">
                    {roleOptions.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => selectRole(option.id)}
                            className={`rounded-2xl border bg-white p-6 text-left shadow-sm transition-all ${
                                role === option.id
                                    ? 'border-brand-navy-500 ring-4 ring-brand-navy-100'
                                    : 'border-slate-200 hover:border-brand-navy-200'
                            }`}
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${role === option.id ? 'bg-brand-navy-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {option.icon}
                                </span>
                                {role === option.id && <ShieldCheck className="text-brand-navy-600" size={22} />}
                            </div>
                            <h2 className="text-xl font-black text-slate-950">{option.label} Portal</h2>
                            <div className="mt-5 grid grid-cols-2 gap-2">
                                {option.notes.map((note) => (
                                    <span key={note} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                                        {note}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-8 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-crimson-50 text-brand-crimson-600">
                            <BookOpen size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-950">{selectedRole.label} Access</h2>
                            <p className="text-sm font-medium text-slate-500">Use your registered ERP account.</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                                <input
                                    type="email"
                                    value={credentials.email}
                                    onChange={(event) => setCredentials({ ...credentials, email: event.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-12 pr-4 font-bold text-slate-800 outline-none transition-all focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-100"
                                    placeholder={`${role}@nev.edu`}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                                <input
                                    type="password"
                                    value={credentials.password}
                                    onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-12 pr-4 font-bold text-slate-800 outline-none transition-all focus:border-brand-navy-500 focus:ring-4 focus:ring-brand-navy-100"
                                    placeholder="Password"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-crimson-600 px-5 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-brand-crimson-600/20 transition-all hover:bg-brand-crimson-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? 'Signing in...' : `Open ${selectedRole.label} Portal`}
                        </button>
                    </form>
                </div>
            </section>
        </div>
    )
}

export default ERPLogin
