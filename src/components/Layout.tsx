import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { Avatar } from './ui'
import BrandLogo from './BrandLogo'
import LanguageToggle from './LanguageToggle'
import { useLanguage } from '../i18n/LanguageContext'
import type { User, Role } from '../types'

interface NavItem {
  id: string
  label: string
  icon: ReactNode
  group?: string
}

export function getInitialPage(navItems: NavItem[], fallback: string) {
  const requestedPage = new URLSearchParams(window.location.search).get('page')
  if (requestedPage === 'profile') return 'profile'
  return requestedPage && navItems.some(item => item.id === requestedPage) ? requestedPage : fallback
}

interface LayoutProps {
  user: User
  navItems: NavItem[]
  currentPage: string
  onNavigate: (page: string) => void
  onLogout: () => void
  children: ReactNode
  roleLabel: string
  roleColor: string
}


export default function Layout({
  user, navItems, currentPage, onNavigate, onLogout, children, roleLabel
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { lang, t } = useLanguage()

  useEffect(() => {
    const restorePage = () => {
      const requestedPage = new URLSearchParams(window.location.search).get('page')
      if (requestedPage === 'profile') {
        onNavigate('profile')
      } else if (requestedPage && navItems.some(item => item.id === requestedPage)) {
        onNavigate(requestedPage)
      }
    }
    window.addEventListener('popstate', restorePage)
    return () => window.removeEventListener('popstate', restorePage)
  }, [navItems, onNavigate])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('page') === currentPage) return
    url.searchParams.set('page', currentPage)
    window.history.replaceState({ page: currentPage }, '', url)
  }, [currentPage])

  const navigate = (page: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', page)
    window.history.pushState({ page }, '', url)
    onNavigate(page)
  }

  // Dynamic translated nav item helper with full portal coverage
  const getNavLabel = (item: NavItem) => {
    const navItemTranslations: Record<string, { en: string; vi: string }> = {
      'overview': { en: 'Overview', vi: 'Tổng Quan' },
      'browse-facilities': { en: 'Find a Facility', vi: 'Tìm Cơ Sở Kho' },
      'browse-units': { en: 'Available Units', vi: 'Phòng Kho Còn Trống' },
      'reservations': { en: 'Storage Reservations', vi: 'Đơn Đặt Giữ Kho' },
      'my-rentals': { en: 'My Rentals', vi: 'Hợp Đồng Của Tôi' },
      'payments': { en: 'Payments', vi: 'Lịch Sử Thanh Toán' },
      'support': { en: 'Support', vi: 'Hỗ Trợ Khách Hàng' },
      'tasks': { en: 'Daily Tasks', vi: 'Nhiệm Vụ Hàng Ngày' },
      'checkin': { en: 'Check-in / Handover', vi: 'Bàn Giao & Nhận Kho' },
      'return': { en: 'Return Inspection', vi: 'Nghiệm Thu Trả Kho' },
      'dashboard': { en: 'Dashboard', vi: 'Bảng Điều Khiển' },
      'reports': { en: 'Facility Reports', vi: 'Báo Cáo Cơ Sở' },
      'units': { en: 'Unit Management', vi: 'Quản Lý Kho' },
      'staff': { en: 'Staff Assignment', vi: 'Phân Công Nhân Viên' },
      'rentals': { en: 'Rentals & Payments', vi: 'Hợp Đồng & Cước Thuê' },
      'overdue': { en: 'Overdue Management', vi: 'Quản Lý Nợ Quá Hạn' },
      'facilities': { en: 'Facility Management', vi: 'Quản Lý Cơ Sở' },
      'performance': { en: 'Performance Reports', vi: 'Hiệu Suất Vận Hành' },
      'policies': { en: 'Rental Policies', vi: 'Chính Sách Thuê' },
      'pricing': { en: 'Pricing & Fees', vi: 'Bảng Giá & Biểu Phí' },
      'discounts': { en: 'Discounts & Promotions', vi: 'Khuyến Mãi & Voucher' },
      'revenue': { en: 'Revenue Reports', vi: 'Báo Cáo Doanh Thu' },
      'users': { en: 'User Management', vi: 'Quản Lý Người Dùng' },
      'roles': { en: 'Roles & Permissions', vi: 'Vai Trò & Phân Quyền' },
      'login-history': { en: 'Login History', vi: 'Lịch Sử Đăng Nhập' },
      'activity': { en: 'Activity Logs', vi: 'Nhật Ký Hoạt Động' },
      'settings': { en: 'System Settings', vi: 'Cài Đặt Hệ Thống' },
      'profile': { en: 'My Profile', vi: 'Hồ Sơ Cá Nhân' },
    }
    const mapping = navItemTranslations[item.id]
    if (mapping) return mapping[lang]
    const key = `nav.${item.id}`
    return t(key, item.label)
  }

  const getNavGroup = (group?: string) => {
    if (!group) return undefined
    const gLower = group.toLowerCase().trim()
    const groupMap: Record<string, { en: string; vi: string }> = {
      'my storage': { en: 'My Storage', vi: 'Kho Của Tôi' },
      'kho của tôi': { en: 'My Storage', vi: 'Kho Của Tôi' },
      'find storage': { en: 'Find Storage', vi: 'Tìm Phòng Kho' },
      'tìm phòng kho': { en: 'Find Storage', vi: 'Tìm Phòng Kho' },
      'bookings': { en: 'Bookings', vi: 'Đặt Giữ Kho' },
      'đặt phòng': { en: 'Bookings', vi: 'Đặt Giữ Kho' },
      'đặt phòng kho': { en: 'Bookings', vi: 'Đặt Giữ Kho' },
      'đặt giữ kho': { en: 'Bookings', vi: 'Đặt Giữ Kho' },
      'account': { en: 'Account', vi: 'Tài Khoản' },
      'tài khoản': { en: 'Account', vi: 'Tài Khoản' },
      'work queue': { en: 'Work Queue', vi: 'Ca Làm Việc' },
      'ca làm việc': { en: 'Work Queue', vi: 'Ca Làm Việc' },
      'customer service': { en: 'Customer Service', vi: 'Dịch Vụ Khách Hàng' },
      'dịch vụ khách hàng': { en: 'Customer Service', vi: 'Dịch Vụ Khách Hàng' },
      'support': { en: 'Support', vi: 'Chăm Sóc & Hỗ Trợ' },
      'chăm sóc & hỗ trợ': { en: 'Support', vi: 'Chăm Sóc & Hỗ Trợ' },
      'overview': { en: 'Overview', vi: 'Tổng Quan' },
      'tổng quan': { en: 'Overview', vi: 'Tổng Quan' },
      'facility operations': { en: 'Facility Operations', vi: 'Vận Hành Cơ Sở' },
      'vận hành cơ sở': { en: 'Facility Operations', vi: 'Vận Hành Cơ Sở' },
      'rentals & finance': { en: 'Rentals & Finance', vi: 'Hợp Đồng & Tài Chính' },
      'hợp đồng & tài chính': { en: 'Rentals & Finance', vi: 'Hợp Đồng & Tài Chính' },
      'portfolio': { en: 'Portfolio', vi: 'Danh Mục Cơ Sở' },
      'danh mục': { en: 'Portfolio', vi: 'Danh Mục Cơ Sở' },
      'commercial': { en: 'Commercial', vi: 'Thương Mại & Biểu Phí' },
      'thương mại': { en: 'Commercial', vi: 'Thương Mại & Biểu Phí' },
      'reporting': { en: 'Reporting', vi: 'Báo Cáo Thống Kê' },
      'báo cáo': { en: 'Reporting', vi: 'Báo Cáo Thống Kê' },
      'administration': { en: 'Administration', vi: 'Quản Trị Hệ Thống' },
      'quản trị': { en: 'Administration', vi: 'Quản Trị Hệ Thống' },
      'security & audit': { en: 'Security & Audit', vi: 'An Ninh & Giám Sát' },
      'bảo mật & giám sát': { en: 'Security & Audit', vi: 'An Ninh & Giám Sát' },
      'system': { en: 'System', vi: 'Hệ Thống' },
      'hệ thống': { en: 'System', vi: 'Hệ Thống' },
      'leasing operations': { en: 'Leasing Operations', vi: 'Vận Hành Kho' },
      'finance & risk': { en: 'Finance & Risk', vi: 'Tài Chính & Rủi Ro' },
      'governance & audit': { en: 'Governance & Audit', vi: 'Quản Trị & Giám Sát' },
    }
    const match = groupMap[gLower]
    if (match) return match[lang]
    return group
  }

  const getTranslatedRole = () => {
    const lower = roleLabel.toLowerCase()
    if (lower.includes('staff')) return t('role.staff', 'Staff')
    if (lower.includes('customer')) return t('role.customer', 'Customer')
    if (lower.includes('manager')) return t('role.manager', 'Facility Manager')
    if (lower.includes('business')) return t('role.business', 'Commercial Partner')
    if (lower.includes('admin')) return t('role.admin', 'System Admin')
    return roleLabel
  }

  const notificationCandidates = [
    { page: 'payments', vi: 'Có hóa đơn mới cần kiểm tra', en: 'A new invoice is ready for review', timeVi: '5 phút trước', timeEn: '5 minutes ago' },
    { page: 'reservations', vi: 'Đơn đặt giữ kho đã được cập nhật', en: 'A storage reservation has been updated', timeVi: '20 phút trước', timeEn: '20 minutes ago' },
    { page: 'overdue', vi: 'Có tài khoản quá hạn cần xử lý', en: 'An overdue account needs attention', timeVi: '30 phút trước', timeEn: '30 minutes ago' },
    { page: 'tasks', vi: 'Nhiệm vụ trong ca làm việc vừa thay đổi', en: 'A shift task was updated', timeVi: '1 giờ trước', timeEn: '1 hour ago' },
    { page: 'activity', vi: 'Nhật ký hệ thống có hoạt động mới', en: 'New system activity was recorded', timeVi: '2 giờ trước', timeEn: '2 hours ago' },
    { page: 'support', vi: 'Yêu cầu hỗ trợ có phản hồi mới', en: 'A support request has a new reply', timeVi: '2 giờ trước', timeEn: '2 hours ago' },
    { page: 'units', vi: 'Trạng thái gian kho vừa được cập nhật', en: 'A storage unit status was updated', timeVi: '3 giờ trước', timeEn: '3 hours ago' },
  ]
  const notifications = notificationCandidates.filter(item => navItems.some(nav => nav.id === item.page)).slice(0, 3)

  return (
    <div className="flex h-full bg-[#f3f2eb]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#292a27] border-r border-[#44453f] text-white flex flex-col transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#44453f] flex items-center justify-between">
          <BrandLogo light subtitle={lang === 'vi' ? 'Lưu trữ an toàn' : 'Secure self-storage'} />
        </div>

        {/* Role badge & Language Switcher in sidebar for easy mobile access */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] uppercase tracking-[.08em] font-semibold bg-[#3a3933] text-[#f3c675] border border-[#4b4940]">
            {getTranslatedRole()}
          </span>
          <div className="lg:hidden">
            <LanguageToggle />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto" aria-label={`${roleLabel} navigation`}>
          {navItems.map((item, index) => {
            const groupText = getNavGroup(item.group)
            const prevGroupText = getNavGroup(navItems[index - 1]?.group)
            return (
              <Fragment key={item.id}>
                {groupText && groupText !== prevGroupText && (
                  <p className={`px-2 pb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500 ${index === 0 ? 'mt-1' : 'mt-5'}`}>
                    {groupText}
                  </p>
                )}
                <button
                  onClick={() => { navigate(item.id); setSidebarOpen(false) }}
                  className={`sidebar-link w-full mb-0.5 ${currentPage === item.id ? 'active' : ''}`}
                >
                  <span className="w-5 h-5 flex-shrink-0 opacity-70" aria-hidden="true">{item.icon}</span>
                  <span>{getNavLabel(item)}</span>
                </button>
              </Fragment>
            )
          })}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-[#44453f]">
          <button
            type="button"
            onClick={() => { navigate('profile'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition text-left mb-2.5 group ${
              currentPage === 'profile'
                ? 'bg-[#3a3933] border border-[#4b4940] shadow-sm'
                : 'hover:bg-white/5'
            }`}
            title="View Profile & Settings"
          >
            <Avatar name={user.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-stone-100 truncate group-hover:text-amber-200 transition">{user.name}</p>
              <p className="text-xs text-stone-400 truncate">{user.email}</p>
            </div>
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded transition ${
              currentPage === 'profile' ? 'bg-[#e9a12c] text-[#292a27] font-semibold' : 'text-stone-400 group-hover:text-stone-200'
            }`}>
              {t('header.profile', 'Profile')}
            </span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => { navigate('profile'); setSidebarOpen(false) }}
              className={`sidebar-link flex-1 ${currentPage === 'profile' ? 'active' : ''}`}
            >
              <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t('nav.account', 'My Account')}
            </button>
            <button
              onClick={onLogout}
              className="sidebar-link px-3 text-stone-400 hover:bg-red-950/30 hover:text-red-300"
              title={t('nav.signout', 'Sign Out')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-[#deddd2] h-16 flex items-center px-4 lg:px-7 gap-3 lg:gap-4 flex-shrink-0">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-700 p-1"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <BrandLogo className="lg:hidden" />
          <div className="hidden lg:block">
            <p className="text-xs text-stone-400 font-mono uppercase tracking-wider">{getTranslatedRole()} {t('header.portal', 'Portal')}</p>
            <p className="text-sm font-semibold text-stone-800">{t('header.tagline', 'StorageHub Intelligent Facility Management')}</p>
          </div>
          <div className="flex-1" />

          {/* Language Switcher Button on Header */}
          <div className="hidden sm:block">
            <LanguageToggle />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(open => !open)}
              className="relative text-stone-400 hover:text-stone-700 transition p-2 rounded-lg hover:bg-stone-100"
              aria-label={lang === 'vi' ? 'Xem thông báo' : 'View notifications'}
              aria-expanded={notificationsOpen}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[#e9a12c] rounded-full ring-2 ring-white" />}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl">
                <div className="border-b border-stone-100 px-4 py-3">
                  <p className="font-semibold text-stone-900">{lang === 'vi' ? 'Thông báo' : 'Notifications'}</p>
                </div>
                {notifications.length ? notifications.map(item => (
                  <button
                    type="button"
                    key={item.page}
                    onClick={() => { navigate(item.page); setNotificationsOpen(false) }}
                    className="block w-full border-b border-stone-100 px-4 py-3 text-left transition last:border-0 hover:bg-amber-50"
                  >
                    <span className="block text-sm font-medium text-stone-800">{lang === 'vi' ? item.vi : item.en}</span>
                    <span className="mt-1 block text-xs text-stone-400">{lang === 'vi' ? item.timeVi : item.timeEn}</span>
                  </button>
                )) : (
                  <p className="px-4 py-6 text-center text-sm text-stone-500">{lang === 'vi' ? 'Chưa có thông báo mới' : 'No new notifications'}</p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('profile')}
            className={`p-0.5 rounded-full ring-offset-2 transition ${currentPage === 'profile' ? 'ring-2 ring-[#e9a12c]' : 'hover:opacity-80'}`}
            title="Go to profile"
          >
            <Avatar name={user.name} size="sm" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-7 fade-in">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>

        </main>
      </div>
    </div>
  )
}

// ─── Nav Icon helpers ─────────────────────────────────────────────────────────

export const Icon = {
  home: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  building: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  box: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  calendar: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  credit: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  support: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  tasks: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  users: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  chart: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  policy: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  tag: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
  shield: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  log: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7" /></svg>,
  key: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
  alert: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  search: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  eye: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  refresh: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  plus: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  login: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>,
  dollar: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  cog: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  clipboard: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  check: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  truck: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>,
}
