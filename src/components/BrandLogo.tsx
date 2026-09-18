interface BrandLogoProps {
  light?: boolean
  subtitle?: string
  className?: string
}

export default function BrandLogo({ light = false, subtitle, className = '' }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label="StorageHub">
      <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="shrink-0">
        <rect width="48" height="48" rx="12" fill="#E89520" />
        <path d="M24 12L34 18V30L24 36L14 30V18L24 12Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M28 20C28 18.5 26.5 17.5 24 17.5C20.5 17.5 19.5 19.5 19.5 21C19.5 24 28.5 23.5 28.5 27C28.5 29 27 30.5 24 30.5C20.5 30.5 19.5 28.5 19.5 27" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="min-w-0">
        <span className={`block text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-slate-800'}`}>
          Storage<span className="text-[#E89520]">Hub</span>
        </span>
        {subtitle && <span className={`mt-0.5 block font-mono text-[10px] uppercase tracking-[.08em] ${light ? 'text-stone-400' : 'text-stone-500'}`}>{subtitle}</span>}
      </span>
    </div>
  )
}
