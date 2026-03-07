import { Lock, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const AdminLogin = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            navigate('/admin');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(API_ENDPOINTS.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('adminToken', data.access_token);
                localStorage.setItem('adminAuthenticated', 'true');
                navigate('/admin');
            } else {
                setError(data.detail || 'Invalid email or password');
            }
        } catch (err) {
            setError('Could not connect to the server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-96 h-96 bg-brand-navy-600/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-crimson-600/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 animate-pulse delay-700"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-brand-navy-800/50 backdrop-blur-xl p-8 lg:p-12 rounded-[2.5rem] border border-brand-navy-700 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-brand-navy-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-navy-600/30">
                            <Lock size={40} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Admin Gate</h1>
                        <p className="text-brand-navy-300">Secure access to the school dashboard</p>
                    </div>

                    {error && (
                        <div className="bg-brand-crimson-500/10 border border-brand-crimson-500/20 text-brand-crimson-400 p-4 rounded-xl text-center mb-8 font-bold animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-navy-300 uppercase tracking-widest ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy-400 group-focus-within:text-brand-gold-400 transition-colors" size={20} />
                                <input
                                    type="email"
                                    placeholder="admin@nev.edu"
                                    className="w-full bg-brand-navy-900/50 border border-brand-navy-700 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-brand-gold-500 focus:ring-4 focus:ring-brand-gold-500/10 transition-all"
                                    value={credentials.email}
                                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-navy-300 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy-400 group-focus-within:text-brand-gold-400 transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-brand-navy-900/50 border border-brand-navy-700 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-brand-gold-500 focus:ring-4 focus:ring-brand-gold-500/10 transition-all"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-crimson-600 hover:bg-brand-crimson-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-brand-crimson-600/20 transition-all active:scale-[0.98] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Authorizing...' : 'Authorize Access'}
                        </button>

                        <div className="pt-6 border-t border-brand-navy-700/50">
                            <div className="bg-brand-navy-900/50 p-4 rounded-xl border border-brand-navy-700/50 text-center">
                                <p className="text-xs font-bold text-brand-navy-400 uppercase">Authorized Personnel Only</p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
