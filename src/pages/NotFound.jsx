import { Link } from 'react-router-dom'

const NotFound = () => (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-8xl font-black text-brand-navy-100 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-brand-navy-900 mb-4">Page Not Found</h2>
        <p className="text-brand-navy-400 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/" className="bg-brand-crimson-600 text-white px-8 py-4 rounded-full font-bold hover:bg-brand-crimson-700 transition-colors">
            Go Home
        </Link>
    </div>
)

export default NotFound
