import { useEffect } from 'react'
import { X } from 'lucide-react'

const SideSheet = ({ open, title, description, onClose, children, footer }) => {
  useEffect(() => {
    if (!open) return undefined
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl transition-transform duration-200 ease-out" style={{ animation: 'sheet-in 200ms ease-out' }}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-950">{title}</h2>
            {description && <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer && (
          <div className="border-t border-slate-200 bg-white px-6 py-4">
            {footer}
          </div>
        )}
      </aside>
    </div>
  )
}

export default SideSheet
