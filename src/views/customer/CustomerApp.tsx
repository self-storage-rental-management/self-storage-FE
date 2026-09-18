import { useState } from 'react'
import Layout, { getInitialPage, Icon } from '../../components/Layout'
import { Badge, Button, Card, StatCard, Table, Thead, Tbody, Th, Td, Tr, SectionHeader, Modal, Input, Select, Tabs, Avatar } from '../../components/ui'
import { useLanguage } from '../../i18n/LanguageContext'
import type { User } from '../../types'
import { FACILITIES, UNITS, MY_RENTALS, PAYMENTS, RESERVATIONS, TICKETS, type TicketItem } from '../../data/demoDatabase'
import ProfileView from '../ProfileView'

const statusLabelMap: Record<string, Record<string, string>> = {
  vi: {
    active: 'Đang hoạt động',
    available: 'Còn trống',
    paid: 'Đã thanh toán',
    resolved: 'Đã giải quyết',
    pending: 'Chờ xử lý',
    medium: 'Trung bình',
    overdue: 'Quá hạn',
    high: 'Khẩn cấp',
    open: 'Mở mới',
    'in-progress': 'Đang khắc phục',
    ended: 'Đã kết thúc',
    closed: 'Đã đóng',
    low: 'Tiêu chuẩn',
  },
  en: {
    active: 'Active',
    available: 'Available',
    paid: 'Paid',
    resolved: 'Resolved',
    pending: 'Pending',
    medium: 'Medium',
    overdue: 'Overdue',
    high: 'High',
    open: 'Open',
    'in-progress': 'In Progress',
    ended: 'Ended',
    closed: 'Closed',
    low: 'Low',
  }
}


const badgeFor = (status: string) => {
  const variant: Record<string, string> = {
    active: 'success', available: 'success', paid: 'success', resolved: 'success',
    pending: 'warning', medium: 'warning', overdue: 'error', high: 'error',
    open: 'info', ended: 'muted', closed: 'muted', low: 'muted',
  }
  return <Badge variant={variant[status] ?? 'muted'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
}

const featureLabel = (unit: typeof UNITS[number]) => unit.climate ? 'Climate controlled' : 'Standard ventilation'

interface UnitCardProps {
  unit: typeof UNITS[number]
  lang: 'vi' | 'en'
  featureLabel: (unit: typeof UNITS[number]) => string
  openDetail: (unit: typeof UNITS[number]) => void
  startReservation: (unit: typeof UNITS[number]) => void
}

function UnitCard({ unit, lang, featureLabel, openDetail, startReservation }: UnitCardProps) {
  return (
    <Card className="p-5 stat-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[.08em] text-amber-700">
            {lang === 'vi' ? `Gian kho ${unit.id}` : `Unit ${unit.id}`}
          </p>
          <h3 className="mt-1 text-xl font-bold text-stone-900">{unit.size} ft · {unit.sqft} sq ft</h3>
          <p className="text-sm text-stone-500">{unit.facility} · {lang === 'vi' ? `Tầng ${unit.floor}` : `Floor ${unit.floor}`}</p>
        </div>
        <Badge variant="success">{lang === 'vi' ? 'Còn trống' : 'Available'}</Badge>
      </div>
      <div className="my-4 rounded-lg border border-stone-200 bg-[#f8f7f1] p-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[.08em] text-stone-500">
          {lang === 'vi' ? 'Tiện ích tiêu chuẩn' : 'Included features'}
        </p>
        <p className="mt-1 text-sm text-stone-700">
          {featureLabel(unit)} · {lang === 'vi' ? 'Camera an ninh 24/7 · Mở khóa điện tử' : 'CCTV monitoring · Digital access'}
        </p>
      </div>
      <div className="flex items-end justify-between border-t border-stone-100 pt-4">
        <p className="text-2xl font-bold text-stone-900">${unit.price}<span className="text-sm font-normal text-stone-500">/{lang === 'vi' ? 'th' : 'mo'}</span></p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openDetail(unit)}>{lang === 'vi' ? 'Chi tiết' : 'Details'}</Button>
          <Button size="sm" onClick={() => startReservation(unit)}>{lang === 'vi' ? 'Giữ kho' : 'Reserve storage'}</Button>
        </div>
      </div>
    </Card>
  )
}

interface CustomerAppProps { user: User; onLogout: () => void }

export default function CustomerApp({ user, onLogout }: CustomerAppProps) {
  const { lang, t } = useLanguage()

  const NAV = [
    { id: 'overview', label: lang === 'vi' ? 'Tổng quan' : 'Overview', icon: Icon.home, group: lang === 'vi' ? 'Kho của tôi' : 'My Storage' },
    { id: 'browse-facilities', label: lang === 'vi' ? 'Tìm cơ sở kho' : 'Find a Facility', icon: Icon.building, group: lang === 'vi' ? 'Tìm phòng kho' : 'Find Storage' },
    { id: 'browse-units', label: lang === 'vi' ? 'Phòng kho còn trống' : 'Available Units', icon: Icon.box, group: lang === 'vi' ? 'Tìm phòng kho' : 'Find Storage' },
    { id: 'reservations', label: lang === 'vi' ? 'Đơn đặt giữ kho' : 'Storage Reservations', icon: Icon.calendar, group: lang === 'vi' ? 'Đặt giữ kho' : 'Bookings' },
    { id: 'my-rentals', label: lang === 'vi' ? 'Hợp đồng của tôi' : 'My Rentals', icon: Icon.key, group: lang === 'vi' ? 'Đặt phòng kho' : 'Bookings' },
    { id: 'payments', label: lang === 'vi' ? 'Lịch sử thanh toán' : 'Payments', icon: Icon.credit, group: lang === 'vi' ? 'Tài khoản' : 'Account' },
    { id: 'support', label: lang === 'vi' ? 'Hỗ trợ khách hàng' : 'Support Desk', icon: Icon.support, group: lang === 'vi' ? 'Tài khoản' : 'Account' },
  ]

  const [page, setPage] = useState(() => getInitialPage(NAV, 'overview'))
  const [previousPage, setPreviousPage] = useState('overview')
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<typeof UNITS[number] | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [bookOpen, setBookOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [rentals, setRentals] = useState(MY_RENTALS)
  const [reservations, setReservations] = useState(() => RESERVATIONS.filter(item => item.customer === user.name))
  const [payments, setPayments] = useState(PAYMENTS)
  const [tickets, setTickets] = useState<TicketItem[]>(TICKETS)
  const [paymentTarget, setPaymentTarget] = useState<{ rentalId?: string; paymentId?: string } | null>(null)
  const [sizeFilter, setSizeFilter] = useState('All')
  const [searchFacility, setSearchFacility] = useState('')
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketCategory, setTicketCategory] = useState('Access & Entry')
  const [ticketPriority, setTicketPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [ticketDescription, setTicketDescription] = useState('')
  const [goodsType, setGoodsType] = useState('Đồ gia dụng')
  const [goodsMaterial, setGoodsMaterial] = useState('Gỗ, nhựa, vải')
  const [packageCount, setPackageCount] = useState(1)
  const [goodsWeight, setGoodsWeight] = useState(10)
  const [cargoLength, setCargoLength] = useState(50)
  const [cargoWidth, setCargoWidth] = useState(50)
  const [cargoHeight, setCargoHeight] = useState(50)
  const [goodsCondition, setGoodsCondition] = useState('Nguyên vẹn, khô ráo')
  const dimWeight = Math.max(1, Math.ceil((cargoLength * cargoWidth * cargoHeight) / 5000))

  const badgeFor = (status: string) => {
    const variant: Record<string, string> = {
      active: 'success', available: 'success', paid: 'success', resolved: 'success',
      pending: 'warning', medium: 'warning', overdue: 'error', high: 'error',
      open: 'info', ended: 'muted', closed: 'muted', low: 'muted',
    }
    const label = statusLabelMap[lang]?.[status] || (status.charAt(0).toUpperCase() + status.slice(1))
    return <Badge variant={variant[status] ?? 'muted'}>{label}</Badge>
  }

  const featureLabel = (unit: typeof UNITS[number]) => {
    if (lang === 'vi') return unit.climate ? 'Có điều hòa & kiểm soát độ ẩm' : 'Thông gió tự nhiên'
    return unit.climate ? 'Climate controlled' : 'Standard ventilation'
  }

  // Support conversation state
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)
  const [conversationOpen, setConversationOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [supportTab, setSupportTab] = useState('All')
  const [supportSearch, setSupportSearch] = useState('')

  // Toast
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const selectedFacility = FACILITIES.find(facility => facility.id === selectedFacilityId) ?? null
  const availableUnits = UNITS.filter(unit =>
    unit.status === 'available' &&
    (!selectedFacility || unit.facility === selectedFacility.name) &&
    (sizeFilter === 'All' || unit.type === sizeFilter)
  )
  const matchingFacilities = FACILITIES.filter(facility =>
    `${facility.name} ${facility.address} ${facility.city}`.toLowerCase().includes(searchFacility.toLowerCase())
  )
  const activeRentals = rentals.filter(rental => rental.status === 'active')
  const outstanding = payments.filter(payment => payment.status !== 'paid').reduce((sum, payment) => sum + payment.amount, 0)

  const navigateTo = (nextPage: string, options?: { facilityId?: string | null }) => {
    setPreviousPage(page)
    if (nextPage === 'browse-units') {
      setSelectedFacilityId(options?.facilityId ?? null)
    }
    setPage(nextPage)
  }

  const handleLayoutNavigate = (nextPage: string) => {
    if (nextPage === page) return
    setPreviousPage(page)
    if (nextPage === 'browse-units') setSelectedFacilityId(null)
    setPage(nextPage)
  }

  const openDetail = (unit: typeof UNITS[number]) => {
    setSelectedUnit(unit)
    setDetailOpen(true)
  }

  const startReservation = (unit: typeof UNITS[number]) => {
    setSelectedUnit(unit)
    setDetailOpen(false)
    setBookOpen(true)
  }

  const confirmReservation = () => {
    if (!selectedUnit) return
    const suffix = Date.now().toString().slice(-6)
    setReservations(current => [...current, {
      id: `RSV-${suffix}`,
      customer: user.name,
      phone: 'Not provided',
      unit: selectedUnit.id,
      facility: selectedUnit.facility,
      facilityAddress: FACILITIES.find(item => item.name === selectedUnit.facility)?.address ?? '',
      email: user.email,
      identityId: 'Chờ đối chiếu khi check-in',
      size: selectedUnit.size,
      moveIn: new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      payment: 'pending',
      paid: false,
      status: 'pending',
      emailVerified: false,
      goodsType,
      material: goodsMaterial,
      packageCount,
      weightKg: goodsWeight,
      dimensionsCm: `${cargoLength} × ${cargoWidth} × ${cargoHeight}`,
      dimWeightKg: dimWeight,
      initialCondition: goodsCondition,
      evidence: [`REQ-${suffix} · Yêu cầu đặt giữ kho được tạo`],
    }])
    setRentals(current => [...current, {
      id: `rent-${suffix}`,
      unit: selectedUnit.id,
      facility: selectedUnit.facility,
      size: selectedUnit.size,
      status: 'active',
      paid: false,
      amount: selectedUnit.price,
      startDate: new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      nextDue: lang === 'vi' ? 'Đến hạn ngay' : 'Due now',
    }])
    setPayments(current => [...current, {
      id: `INV-${suffix}`,
      date: new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      description: lang === 'vi' ? `Kho ${selectedUnit.id} · Phí khởi tạo & cọc` : `Unit ${selectedUnit.id} · Initial payment`,
      method: lang === 'vi' ? 'Chờ thanh toán' : 'Payment method pending',
      amount: selectedUnit.price,
      status: 'overdue',
    }])
    setBookOpen(false)
    setSelectedUnit(null)
    setPage('reservations')
    showToast(lang === 'vi' ? `Đã tạo yêu cầu giữ kho và gửi email xác nhận đến ${user.email}` : `Storage hold created and confirmation sent to ${user.email}`)
  }

  const completePayment = () => {
    if (paymentTarget?.rentalId) {
      const rental = rentals.find(item => item.id === paymentTarget.rentalId)
      setRentals(current => current.map(item => item.id === paymentTarget.rentalId ? { ...item, paid: true } : item))
      if (rental) setPayments(current => current.map(item => item.description.includes(`Unit ${rental.unit}`) || item.description.includes(`Kho ${rental.unit}`) ? { ...item, status: 'paid', method: 'Visa ending 3456' } : item))
    }
    if (paymentTarget?.paymentId) {
      const payment = payments.find(item => item.id === paymentTarget.paymentId)
      setPayments(current => current.map(item => item.id === paymentTarget.paymentId ? { ...item, status: 'paid', method: 'Visa ending 3456' } : item))
      if (payment) setRentals(current => current.map(item => payment.description.includes(`Unit ${item.unit}`) || payment.description.includes(`Kho ${item.unit}`) ? { ...item, paid: true } : item))
    }
    setPaymentTarget(null)
    setPayOpen(false)
    showToast(lang === 'vi' ? 'Thanh toán thành công!' : 'Payment completed successfully!')
  }

  const submitTicket = () => {
    if (!ticketSubject.trim()) return
    setTickets(current => [{
      id: `TKT-${Date.now().toString().slice(-4)}`,
      customer: user.name,
      email: user.email,
      subject: ticketSubject,
      category: ticketCategory,
      priority: ticketPriority,
      status: 'open',
      created: lang === 'vi' ? 'Hôm nay' : 'Today',
      facility: activeRentals[0]?.facility ?? FACILITIES[0].name,
      unit: activeRentals[0]?.unit ?? 'Chưa chỉ định',
      messages: [{
        id: `m-${Date.now()}`,
        sender: user.name,
        role: 'customer',
        time: lang === 'vi' ? 'Vừa xong' : 'Just now',
        text: ticketDescription || ticketSubject
      }]
    }, ...current])
    setTicketSubject('')
    setTicketDescription('')
    setTicketOpen(false)
    showToast(lang === 'vi' ? 'Yêu cầu hỗ trợ đã được gửi!' : 'Support request submitted!')
  }

  return (
    <Layout
      user={user}
      navItems={NAV}
      currentPage={page}
      onNavigate={handleLayoutNavigate}
      onLogout={onLogout}
      roleLabel="Customer"
      roleColor=""
    >
      {page === 'overview' && (
        <div className="fade-in">
          <SectionHeader
            eyebrow={lang === 'vi' ? 'CỔNG KHÁCH HÀNG · KHÁCH THUÊ' : 'CUSTOMER PORTAL · TENANT'}
            title={lang === 'vi' ? `Chào mừng trở lại, ${user.name}` : `Welcome back, ${user.name.split(' ')[0]}`}
            subtitle={lang === 'vi' ? 'Quản lý kho lưu trữ, thanh toán và quyền ra vào tại một nơi duy nhất' : 'Your storage, payments and access details in one place'}
            action={<Button onClick={() => navigateTo('browse-units')}>{Icon.search} {lang === 'vi' ? 'Tìm phòng kho' : 'Find a unit'}</Button>}
          />

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Account summary">
            <StatCard title={lang === 'vi' ? 'Kho đang thuê' : 'Active rentals'} value={activeRentals.length} icon={Icon.box} />
            <StatCard title={lang === 'vi' ? 'Đơn đặt giữ kho' : 'Storage reservations'} value={reservations.length} icon={Icon.calendar} />
            <StatCard title={lang === 'vi' ? 'Dư nợ cần thanh toán' : 'Outstanding balance'} value={`$${outstanding}`} icon={Icon.credit} iconBg={outstanding ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'} />
            <StatCard title={lang === 'vi' ? 'Yêu cầu hỗ trợ đang mở' : 'Open support requests'} value={tickets.filter(ticket => ticket.status === 'open').length} icon={Icon.support} />
          </section>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
                <div>
                  <p className="eyebrow">{lang === 'vi' ? 'Kho hiện tại' : 'Current rental'}</p>
                  <h2 className="mt-1 font-bold text-stone-900">{lang === 'vi' ? 'Quyền truy cập kho của bạn' : 'Your storage access'}</h2>
                </div>
                {activeRentals[0] && badgeFor(activeRentals[0].status)}
              </div>
              {activeRentals[0] ? (
                <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <p className="font-mono text-xs font-semibold uppercase tracking-[.08em] text-stone-400">
                      {lang === 'vi' ? `Phòng ${activeRentals[0].unit}` : `Unit ${activeRentals[0].unit}`}
                    </p>
                    <p className="mt-2 text-xl font-bold text-stone-900">{activeRentals[0].facility}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {activeRentals[0].size} ft · {lang === 'vi' ? 'Kỳ hạn thanh toán kế tiếp' : 'Next payment'} {activeRentals[0].nextDue}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="success">{lang === 'vi' ? 'Đang kích hoạt quyền mở cửa' : 'Access active'}</Badge>
                      <Badge variant="muted">{lang === 'vi' ? 'Camera an ninh 24/7' : '24/7 security'}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigateTo('my-rentals')}>
                      {lang === 'vi' ? 'Quản lý kho' : 'Manage'}
                    </Button>
                    {!activeRentals[0].paid && (
                      <Button onClick={() => { setPaymentTarget({ rentalId: activeRentals[0].id }); setPayOpen(true) }}>
                        {lang === 'vi' ? 'Thanh toán ngay' : 'Pay now'}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="font-semibold text-stone-700">{lang === 'vi' ? 'Bạn chưa có hợp đồng thuê kho nào' : 'You do not have an active rental'}</p>
                  <p className="mt-1 text-sm text-stone-500">{lang === 'vi' ? 'Tìm không gian lưu trữ an toàn, vừa vặn với nhu cầu của bạn.' : 'Find a secure space that fits your needs.'}</p>
                  <Button className="mt-4" onClick={() => navigateTo('browse-units')}>
                    {lang === 'vi' ? 'Xem các phòng kho còn trống' : 'Browse available units'}
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <p className="eyebrow">{lang === 'vi' ? 'Thao tác nhanh' : 'Quick actions'}</p>
              <h2 className="mt-1 font-bold text-stone-900">{lang === 'vi' ? 'Bạn muốn làm gì tiếp theo?' : 'What would you like to do?'}</h2>
              <div className="mt-4 grid gap-2">
                <button onClick={() => setPage('browse-facilities')} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 text-left hover:border-amber-400 hover:bg-amber-50/40 transition">
                  <span className="text-amber-700">{Icon.building}</span>
                  <span>
                    <b className="block text-sm">{lang === 'vi' ? 'Tìm cơ sở kho StorageHub' : 'Find a facility'}</b>
                    <small className="text-stone-500">{lang === 'vi' ? 'Xem vị trí thuận tiện và tỷ lệ phòng trống' : 'Compare locations and availability'}</small>
                  </span>
                </button>
                <button onClick={() => setPage('payments')} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 text-left hover:border-amber-400 hover:bg-amber-50/40 transition">
                  <span className="text-amber-700">{Icon.credit}</span>
                  <span>
                    <b className="block text-sm">{lang === 'vi' ? 'Xem lịch sử thanh toán' : 'View payments'}</b>
                    <small className="text-stone-500">{lang === 'vi' ? 'Hóa đơn, biên lai và số dư còn lại' : 'Invoices, receipts and balance'}</small>
                  </span>
                </button>
                <button onClick={() => setTicketOpen(true)} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 text-left hover:border-amber-400 hover:bg-amber-50/40 transition">
                  <span className="text-amber-700">{Icon.support}</span>
                  <span>
                    <b className="block text-sm">{lang === 'vi' ? 'Gửi yêu cầu hỗ trợ' : 'Get support'}</b>
                    <small className="text-stone-500">{lang === 'vi' ? 'Đội ngũ trực sẽ phản hồi trong vòng 2 giờ' : 'We usually reply within two hours'}</small>
                  </span>
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {page === 'browse-facilities' && (
        <div className="fade-in">
          <SectionHeader
            title={lang === 'vi' ? 'Hệ Thống Cơ Sở Lưu Kho' : 'Find a Facility'}
            subtitle={lang === 'vi' ? 'So sánh và lựa chọn vị trí kho bãi StorageHub gần bạn nhất' : 'Compare secure StorageHub locations near you'}
            action={
              <label className="relative block w-full sm:w-72">
                <span className="sr-only">Search facilities</span>
                <input
                  value={searchFacility}
                  onChange={event => setSearchFacility(event.target.value)}
                  placeholder={lang === 'vi' ? 'Tìm theo thành phố, quận hoặc địa chỉ...' : 'Search city, area or address'}
                  className="pl-10"
                />
                <span className="pointer-events-none absolute left-3 top-2.5 text-stone-400">{Icon.search}</span>
              </label>
            }
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {matchingFacilities.map(facility => (
              <Card key={facility.id} className="overflow-hidden stat-card-hover">
                <div className="relative h-44 bg-stone-200">
                  <img src={`https://images.unsplash.com/${facility.image}?w=720&h=352&fit=crop&auto=format`} alt={`${facility.name} storage facility`} className="h-full w-full object-cover" />
                  <div className="absolute left-3 top-3">
                    <Badge variant={UNITS.filter(unit => unit.facility === facility.name && unit.status === 'available').length > 0 ? 'success' : 'warning'}>
                      {UNITS.filter(unit => unit.facility === facility.name && unit.status === 'available').length} {lang === 'vi' ? 'phòng còn trống' : 'units available'}
                    </Badge>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] font-semibold text-amber-700">{facility.id.toUpperCase()}</p>
                      <h2 className="font-bold text-stone-900">{facility.name}</h2>
                      <p className="mt-1 text-xs text-stone-500">{facility.address}</p>
                    </div>
                    <span className="text-sm font-semibold text-amber-700">★ {facility.rating}</span>
                  </div>
                  <div className="my-4 flex flex-wrap gap-2">
                    <Badge variant="muted">{lang === 'vi' ? 'Bảo vệ an ninh 24/7' : '24/7 security'}</Badge>
                    {facility.climate && <Badge variant="info">{lang === 'vi' ? 'Điều hòa độ ẩm' : 'Climate control'}</Badge>}
                  </div>
                  <div className="flex items-end justify-between border-t border-stone-100 pt-4">
                    <div>
                      <p className="text-xs text-stone-500">{lang === 'vi' ? 'Giá chỉ từ' : 'Starting from'}</p>
                      <p className="text-xl font-bold text-stone-900">{facility.price}<span className="text-xs font-normal text-stone-500">/{lang === 'vi' ? 'tháng' : 'month'}</span></p>
                    </div>
                    <Button size="sm" onClick={() => navigateTo('browse-units', { facilityId: facility.id })}>
                      {lang === 'vi' ? 'Xem các phòng' : 'View units'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {page === 'browse-units' && (
        <div className="fade-in">
          <SectionHeader
            title={selectedFacility
              ? (lang === 'vi' ? `Phòng Trống Tại ${selectedFacility.name}` : `Available Units at ${selectedFacility.name}`)
              : (lang === 'vi' ? 'Danh Sách Phòng Kho Trống' : 'Available Units')}
            subtitle={selectedFacility
              ? `${selectedFacility.address} · ${availableUnits.length} ${lang === 'vi' ? 'gian kho sẵn sàng đặt ngay' : 'spaces ready to reserve'}`
              : (lang === 'vi' ? 'Phòng trống được phân theo từng cơ sở kho' : 'Available units grouped by facility')}
            action={
              <Select value={sizeFilter} onChange={event => setSizeFilter(event.target.value)} className="w-full sm:w-48">
                <option value="All">{lang === 'vi' ? 'Tất cả kích thước' : 'All sizes'}</option>
                <option value="Small">{lang === 'vi' ? 'Nhỏ (Small)' : 'Small'}</option>
                <option value="Medium">{lang === 'vi' ? 'Vừa (Medium)' : 'Medium'}</option>
                <option value="Large">{lang === 'vi' ? 'Lớn (Large)' : 'Large'}</option>
                <option value="Extra Large">{lang === 'vi' ? 'Cực lớn (XL)' : 'Extra Large'}</option>
              </Select>
            }
          />
          {!selectedFacility && FACILITIES.map(facility => {
            const facilityUnits = availableUnits.filter(unit => unit.facility === facility.name)
            return (
              <section key={facility.id} className="mb-8">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">{facility.name}</h2>
                    <p className="text-sm text-stone-500">{facility.address}</p>
                  </div>
                  <Badge variant={facilityUnits.length ? 'success' : 'muted'}>
                    {facilityUnits.length} {lang === 'vi' ? 'phòng còn trống' : 'available units'}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {facilityUnits.map(unit => (
                    <UnitCard key={unit.id} unit={unit} lang={lang} featureLabel={featureLabel} openDetail={openDetail} startReservation={startReservation} />
                  ))}
                </div>
              </section>
            )
          })}
          {selectedFacility && <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {availableUnits.map(unit => (
              <UnitCard key={unit.id} unit={unit} lang={lang} featureLabel={featureLabel} openDetail={openDetail} startReservation={startReservation} />
            ))}
          </div>}
        </div>
      )}

      {page === 'reservations' && (
        <div className="fade-in">
          <SectionHeader
            title={lang === 'vi' ? 'Đơn Đặt Giữ Kho Của Tôi' : 'Storage Reservations'}
            subtitle={lang === 'vi' ? 'Theo dõi xuyên suốt yêu cầu, xác nhận email, check-in và bàn giao kho' : 'Track requests, email confirmation, check-in and handover'}
            action={<Button size="sm" onClick={() => navigateTo('browse-units')}>{Icon.plus} {lang === 'vi' ? 'Đặt giữ kho mới' : 'New reservation'}</Button>}
          />
          {reservations.length ? (
            <div className="grid gap-3">
              {reservations.map(reservation => (
                <Card key={reservation.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs font-semibold text-stone-400">{reservation.id}</p>
                      <h2 className="mt-1 font-bold text-stone-900">{lang === 'vi' ? `Gian kho ${reservation.unit}` : `Unit ${reservation.unit}`}</h2>
                      <p className="text-sm font-medium text-stone-700">{reservation.facility}</p>
                      <p className="text-xs text-stone-500">{reservation.facilityAddress}</p>
                      <p className="mt-1 text-sm text-stone-500">{lang === 'vi' ? 'Ngày nhận kho: ' : 'Move-in '} {reservation.moveIn}</p>
                      <p className="mt-2 text-xs text-stone-600">{reservation.goodsType} · {reservation.packageCount} kiện · {reservation.weightKg} kg · DIM {reservation.dimWeightKg} kg</p>
                      <div className="mt-3 flex flex-wrap gap-1 text-[11px]">
                        <Badge variant="success">1. {lang === 'vi' ? 'Đã gửi yêu cầu' : 'Requested'}</Badge>
                        <Badge variant={reservation.emailVerified ? 'success' : 'warning'}>2. {lang === 'vi' ? 'Xác nhận email' : 'Email verified'}</Badge>
                        <Badge variant={reservation.status === 'confirmed' ? 'success' : 'muted'}>3. {lang === 'vi' ? 'Duyệt giữ kho' : 'Hold approved'}</Badge>
                        <Badge variant="muted">4. Check-in</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {badgeFor(reservation.payment)}
                      {badgeFor(reservation.status)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-10 text-center">
              <div className="mx-auto w-fit text-stone-300">{Icon.calendar}</div>
              <h2 className="mt-3 font-semibold text-stone-700">{lang === 'vi' ? 'Chưa có đơn đặt giữ kho nào' : 'No upcoming reservations'}</h2>
              <p className="mt-1 text-sm text-stone-500">{lang === 'vi' ? 'Đơn đặt kho mới của bạn sẽ hiển thị tại đây.' : 'Your next reservation will appear here.'}</p>
              <Button className="mt-4" size="sm" onClick={() => navigateTo('browse-units')}>
                {lang === 'vi' ? 'Khám phá phòng kho' : 'Browse units'}
              </Button>
            </Card>
          )}
        </div>
      )}

      {page === 'my-rentals' && (
        <div className="fade-in">
          <SectionHeader
            title={lang === 'vi' ? 'Kho Đang Thuê Của Tôi' : 'My Rentals'}
            subtitle={lang === 'vi' ? 'Quản lý hợp đồng, kiểm tra mã cổng và trạng thái thanh toán' : 'Access and manage your current storage units'}
            action={<Button variant="outline" size="sm" onClick={() => setPage(previousPage || 'overview')}>← {lang === 'vi' ? 'Quay lại' : 'Back'}</Button>}
          />
          <div className="grid gap-4">
            {rentals.map(rental => (
              <Card key={rental.id} className="overflow-hidden">
                <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-stone-900">{lang === 'vi' ? `Gian kho ${rental.unit}` : `Unit ${rental.unit}`}</h2>
                      {badgeFor(rental.status)}
                      {rental.status === 'active' && !rental.paid && (
                        <Badge variant="error">{lang === 'vi' ? 'Chưa thanh toán kỳ này' : 'Payment overdue'}</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-stone-500">{rental.facility} · {rental.size} ft</p>
                    <p className="mt-2 text-xs text-stone-400">
                      {lang === 'vi' ? 'Bắt đầu thuê: ' : 'Started '} {rental.startDate} · {lang === 'vi' ? 'Hạn thanh toán tiếp theo: ' : 'Next payment '} {rental.nextDue}
                    </p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-2xl font-bold text-stone-900">${rental.amount}<span className="text-sm font-normal text-stone-500">/{lang === 'vi' ? 'tháng' : 'month'}</span></p>
                    {rental.status === 'active' && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!rental.paid && (
                          <Button size="sm" onClick={() => { setPaymentTarget({ rentalId: rental.id }); setPayOpen(true) }}>
                            {lang === 'vi' ? 'Thanh toán cước' : 'Pay now'}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => showToast(lang === 'vi' ? 'Yêu cầu gia hạn hợp đồng đã được tiếp nhận!' : 'Renewal request submitted!')}>
                          {lang === 'vi' ? 'Gia hạn thuê' : 'Renew'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => showToast(lang === 'vi' ? 'Bộ phận chăm sóc sẽ liên hệ hỗ trợ thủ tục bàn giao.' : 'Move-out instructions dispatched to your email.')}>
                          {lang === 'vi' ? 'Trả kho' : 'Move out'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {page === 'payments' && (
        <div className="fade-in">
          <SectionHeader
            title={lang === 'vi' ? 'Lịch Sử Thanh Toán & Hóa Đơn' : 'Payments'}
            subtitle={lang === 'vi' ? 'Biên lai VAT điện tử, hạn đóng cước và phương thức thẻ' : 'Invoices, receipts and payment methods'}
            action={<Button size="sm" onClick={() => { setPaymentTarget(null); setPayOpen(true) }}>{Icon.plus} {lang === 'vi' ? 'Thêm thẻ thanh toán' : 'Add payment method'}</Button>}
          />
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title={lang === 'vi' ? 'Tổng tiền đã thanh toán' : 'Total paid'} value={`$${payments.filter(item => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0)}`} icon={Icon.dollar} iconBg="bg-emerald-50 text-emerald-700" />
            <StatCard title={lang === 'vi' ? 'Cước phí còn nợ' : 'Outstanding'} value={`$${outstanding}`} icon={Icon.alert} iconBg="bg-red-50 text-red-700" />
            <StatCard title={lang === 'vi' ? 'Kho đang thuê' : 'Active rentals'} value={activeRentals.length} icon={Icon.box} />
          </div>
          <Card>
            <Table>
              <Thead>
                <tr>
                  <Th>{lang === 'vi' ? 'Mã Hóa Đơn' : 'Invoice'}</Th>
                  <Th>{lang === 'vi' ? 'Ngày' : 'Date'}</Th>
                  <Th>{lang === 'vi' ? 'Nội Dung' : 'Description'}</Th>
                  <Th>{lang === 'vi' ? 'Phương Thức' : 'Method'}</Th>
                  <Th>{lang === 'vi' ? 'Số Tiền' : 'Amount'}</Th>
                  <Th>{lang === 'vi' ? 'Trạng Thái' : 'Status'}</Th>
                  <Th>{lang === 'vi' ? 'Thao Tác' : 'Action'}</Th>
                </tr>
              </Thead>
              <Tbody>
                {payments.map(payment => (
                  <Tr key={payment.id}>
                    <Td><span className="font-mono text-xs text-stone-500">{payment.id}</span></Td>
                    <Td>{payment.date}</Td>
                    <Td>{payment.description}</Td>
                    <Td><span className="text-xs text-stone-500">{payment.method}</span></Td>
                    <Td><b>${payment.amount}</b></Td>
                    <Td>{badgeFor(payment.status)}</Td>
                    <Td>
                      {payment.status === 'overdue' ? (
                        <Button variant="danger" size="sm" onClick={() => { setPaymentTarget({ paymentId: payment.id }); setPayOpen(true) }}>
                          {lang === 'vi' ? 'Nộp cước ngay' : 'Pay now'}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => showToast(lang === 'vi' ? `Tải biên lai điện tử ${payment.id} thành công!` : `Receipt ${payment.id} downloaded!`)}>
                          {lang === 'vi' ? 'Biên lai' : 'Receipt'}
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ── SUPPORT ─────────────────────────────────────────── */}
      {page === 'support' && (() => {
        const filteredTickets = tickets.filter(t => {
          const matchTab =
            supportTab === 'All' ||
            (supportTab === 'open' && t.status === 'open') ||
            (supportTab === 'in-progress' && t.status === 'in-progress') ||
            (supportTab === 'resolved' && t.status === 'resolved')
          const query = supportSearch.toLowerCase().trim()
          const matchSearch =
            !query ||
            t.subject.toLowerCase().includes(query) ||
            t.id.toLowerCase().includes(query) ||
            t.category.toLowerCase().includes(query)
          return matchTab && matchSearch
        })

        return (
          <div className="fade-in space-y-6">
            <SectionHeader
              title={lang === 'vi' ? 'Tổng Đài Hỗ Trợ & Khiếu Nại' : 'Customer Support & Helpdesk'}
              subtitle={lang === 'vi' ? 'Gửi yêu cầu trợ giúp kỹ thuật, kiểm tra tiến độ xử lý hoặc tra cứu cẩm nang' : 'Submit inquiries, monitor ticket resolution progress, or consult self-service guides'}
              action={
                <Button size="sm" onClick={() => setTicketOpen(true)}>
                  {Icon.plus} {lang === 'vi' ? 'Tạo yêu cầu mới' : 'New Request'}
                </Button>
              }
            />

            {/* Self-service Knowledge Base Quick Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card
                className="p-4 hover:border-amber-400 transition cursor-pointer group"
                onClick={() => showToast(lang === 'vi' ? 'Mẹo mở cổng: Nhập 4 chữ số bí mật + phím # trên bàn phím số.' : 'Access Guide: Keypad PIN is 4 digits + # sign. Try re-entering slowly.')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-50 text-amber-800 group-hover:bg-[#e9a12c] group-hover:text-[#292a27] transition">
                    {Icon.key}
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 text-sm">{lang === 'vi' ? 'Mã Cổng & Khóa Cửa' : 'Gate & Unit Access'}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">{lang === 'vi' ? 'Đồng bộ PIN & mở khóa số' : 'PIN code sync & digital locks'}</p>
                  </div>
                </div>
              </Card>

              <Card
                className="p-4 hover:border-amber-400 transition cursor-pointer group"
                onClick={() => showToast(lang === 'vi' ? 'Cước phí thuê kho được khấu trừ tự động vào ngày 1 hàng tháng.' : 'Billing Guide: Auto-pay charges occur on the 1st of every month.')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-[#e9a12c] group-hover:text-[#292a27] transition">
                    {Icon.credit}
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 text-sm">{lang === 'vi' ? 'Hóa Đơn & Cước Phí' : 'Billing & Invoices'}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">{lang === 'vi' ? 'Biên lai, VAT & tự động trừ nợ' : 'Receipts, VAT & auto-pay'}</p>
                  </div>
                </div>
              </Card>

              <Card
                className="p-4 hover:border-amber-400 transition cursor-pointer group"
                onClick={() => showToast(lang === 'vi' ? 'Hệ thống phòng điều hòa duy trì nhiệt độ ổn định 21°C - 23°C.' : 'Facility Notice: Air conditioning and climate units maintain 21°C - 23°C.')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 text-blue-800 group-hover:bg-[#e9a12c] group-hover:text-[#292a27] transition">
                    {Icon.box}
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 text-sm">{lang === 'vi' ? 'Bảo Quản & Nhận Kho' : 'Unit Care & Move-in'}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">{lang === 'vi' ? 'Kệ xếp đồ, đổi size kho & xe đẩy' : 'Shelving, size upgrade & carts'}</p>
                  </div>
                </div>
              </Card>

              <Card
                className="p-4 hover:border-amber-400 transition cursor-pointer group"
                onClick={() => showToast(lang === 'vi' ? 'Đường dây nóng khẩn cấp 24/7: 1900 8888 (Quản lý trực).' : 'Emergency Hotline: +84 28 3822 8888 (24/7 on-call manager).')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-rose-50 text-rose-800 group-hover:bg-[#e9a12c] group-hover:text-[#292a27] transition">
                    {Icon.support}
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 text-sm">{lang === 'vi' ? 'Cấp Cứu Sự Cố 24/7' : '24/7 Emergency Support'}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">{lang === 'vi' ? 'Hotline trực ca an ninh' : 'Immediate security hotline'}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <Tabs
                tabs={lang === 'vi' ? ['Tất cả', 'open', 'in-progress', 'resolved'] : ['All', 'open', 'in-progress', 'resolved']}
                active={supportTab === 'All' && lang === 'vi' ? 'Tất cả' : supportTab}
                onChange={val => setSupportTab(val === 'Tất cả' ? 'All' : val)}
              />
              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder={lang === 'vi' ? 'Tìm theo tiêu đề, danh mục yêu cầu...' : 'Search tickets by subject, category...'}
                  value={supportSearch}
                  onChange={e => setSupportSearch(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Ticket List */}
            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <Card className="p-10 text-center text-stone-400">
                  <p className="font-semibold text-stone-700">{lang === 'vi' ? 'Không có yêu cầu hỗ trợ nào' : 'No support requests found'}</p>
                  <p className="text-xs mt-1">{lang === 'vi' ? 'Nếu bạn gặp sự cố hoặc có câu hỏi, bấm "Tạo yêu cầu mới" ở trên.' : 'If you have any issues or questions, click "New Request" above.'}</p>
                </Card>
              ) : (
                filteredTickets.map(ticket => {
                  const latestMessage = ticket.messages?.[ticket.messages.length - 1]
                  return (
                    <Card key={ticket.id} className="p-5 hover:border-stone-300 transition">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                              {ticket.id}
                            </span>
                            <h2 className="font-bold text-stone-900 text-base">{ticket.subject}</h2>
                            <Badge variant={ticket.status === 'open' ? 'info' : ticket.status === 'in-progress' ? 'warning' : 'success'}>
                              {ticket.status === 'open' ? (lang === 'vi' ? 'Mới mở' : 'open') : ticket.status === 'in-progress' ? (lang === 'vi' ? 'Đang xử lý' : 'in-progress') : (lang === 'vi' ? 'Đã giải quyết' : 'resolved')}
                            </Badge>
                            <Badge variant={ticket.priority === 'high' ? 'error' : ticket.priority === 'medium' ? 'warning' : 'muted'}>
                              {ticket.priority === 'high' ? (lang === 'vi' ? 'Ưu tiên cao' : 'high priority') : ticket.priority === 'medium' ? (lang === 'vi' ? 'Ưu tiên vừa' : 'medium priority') : (lang === 'vi' ? 'Tiêu chuẩn' : 'normal priority')}
                            </Badge>
                          </div>
                          <p className="text-xs text-stone-500 flex items-center gap-3">
                            <span>{lang === 'vi' ? 'Danh mục' : 'Category'}: <strong className="text-stone-700">{ticket.category}</strong></span>
                            <span>•</span>
                            <span>{lang === 'vi' ? 'Cơ sở' : 'Facility'}: {ticket.facility}</span>
                            <span>•</span>
                            <span>{lang === 'vi' ? 'Gửi lúc' : 'Created'}: {ticket.created}</span>
                          </p>
                          {latestMessage && (
                            <p className="text-xs text-stone-600 bg-[#fbfaf6] p-2.5 rounded border border-stone-100 line-clamp-1">
                              <strong className="text-stone-800">{latestMessage.sender}:</strong> {latestMessage.text}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket)
                              setConversationOpen(true)
                            }}
                          >
                            {lang === 'vi' ? `Xem trao đổi (${ticket.messages?.length ?? 1})` : `Open Conversation (${ticket.messages?.length ?? 1})`}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        )
      })()}

      {/* ── PROFILE PAGE ─────────────────────────────────────── */}
      {page === 'profile' && (
        <div className="fade-in">
          <ProfileView user={user} />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#292a27] text-white px-5 py-3 rounded-lg shadow-2xl border border-amber-500/50 flex items-center gap-3 fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-[#e9a12c] animate-ping" />
          <p className="text-sm font-medium">{toast}</p>
        </div>
      )}

      {/* ── MODALS ────────────────────────────────────────────── */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        size="xl"
        title={selectedUnit ? (lang === 'vi' ? `Chi tiết gian kho ${selectedUnit.id}` : `Unit ${selectedUnit.id} details`) : (lang === 'vi' ? 'Chi tiết gian kho' : 'Unit details')}
      >
        {selectedUnit && (
          <div className="space-y-5">
            <div className="rounded-lg bg-[#292a27] p-5 text-white">
              <p className="font-mono text-xs uppercase tracking-[.08em] text-[#e9a12c]">{selectedUnit.facility}</p>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">{selectedUnit.size} ft</p>
                  <p className="text-sm text-stone-400">{selectedUnit.sqft} sq ft · {lang === 'vi' ? `Tầng ${selectedUnit.floor}` : `Floor ${selectedUnit.floor}`}</p>
                </div>
                <p className="text-2xl font-bold">${selectedUnit.price}<span className="text-sm font-normal text-stone-400">/{lang === 'vi' ? 'th' : 'mo'}</span></p>
              </div>
            </div>
            <div>
              <p className="font-semibold text-stone-900">{lang === 'vi' ? 'Đặc điểm không gian lưu trữ' : 'What this space includes'}</p>
              <ul className="mt-3 grid gap-2 text-sm text-stone-600">
                <li>✓ {featureLabel(selectedUnit)}</li>
                <li>✓ {lang === 'vi' ? 'Mã số mở cổng và cửa kho điện tử riêng biệt' : 'Digital gate and unit access'}</li>
                <li>✓ {lang === 'vi' ? 'Hệ thống camera giám sát an ninh 24/7' : '24/7 CCTV monitoring'}</li>
                <li>✓ {lang === 'vi' ? 'Hợp đồng linh hoạt thanh toán theo tháng' : 'Flexible month-to-month rental'}</li>
              </ul>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-stone-200 p-3"><p className="text-xs text-stone-500">{lang === 'vi' ? 'Cơ sở' : 'Facility'}</p><p className="mt-1 font-semibold">{selectedUnit.facility}</p></div>
              <div className="rounded-lg border border-stone-200 p-3"><p className="text-xs text-stone-500">{lang === 'vi' ? 'Mã kho / tầng' : 'Unit / floor'}</p><p className="mt-1 font-semibold">{selectedUnit.id} / {selectedUnit.floor}</p></div>
              <div className="rounded-lg border border-stone-200 p-3"><p className="text-xs text-stone-500">{lang === 'vi' ? 'Thể tích tham khảo' : 'Reference volume'}</p><p className="mt-1 font-semibold">~{selectedUnit.sqft * 2.4} ft³</p></div>
              <div className="rounded-lg border border-stone-200 p-3"><p className="text-xs text-stone-500">{lang === 'vi' ? 'Trạng thái' : 'Status'}</p><p className="mt-1 font-semibold text-emerald-700">{lang === 'vi' ? 'Sẵn sàng giữ kho' : 'Ready to reserve'}</p></div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
              <p className="font-semibold">{lang === 'vi' ? 'Cách tính DIM cho hàng cồng kềnh' : 'DIM pricing for bulky goods'}</p>
              <p className="mt-1">DIM (kg) = Dài × Rộng × Cao (cm) / 5.000. Khối lượng tính giá là số lớn hơn giữa khối lượng thực tế và DIM; giá cuối cùng được xác nhận sau khi nhân viên cân đo lúc check-in.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                {lang === 'vi' ? 'Đóng lại' : 'Close'}
              </Button>
              <Button onClick={() => startReservation(selectedUnit)}>
                {lang === 'vi' ? 'Giữ kho này' : 'Reserve this storage unit'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        size="xl"
        title={selectedUnit ? (lang === 'vi' ? `Yêu cầu giữ kho ${selectedUnit.id}` : `Reserve Unit ${selectedUnit.id}`) : (lang === 'vi' ? 'Yêu cầu giữ kho' : 'Reserve a unit')}
      >
        {selectedUnit && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">{lang === 'vi' ? 'Kích thước gian kho' : 'Unit size'}</span>
                <b>{selectedUnit.size} ft ({selectedUnit.sqft} sq ft)</b>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-stone-600">{lang === 'vi' ? 'Giá thuê hàng tháng' : 'Monthly rate'}</span>
                <b className="text-amber-800">${selectedUnit.price}/{lang === 'vi' ? 'tháng' : 'month'}</b>
              </div>
            </div>
            <Input label={lang === 'vi' ? 'Ngày dự kiến dọn vào' : 'Move-in date'} type="date" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label={lang === 'vi' ? 'Loại hàng hóa' : 'Goods category'} value={goodsType} onChange={event => setGoodsType(event.target.value)} />
              <Input label={lang === 'vi' ? 'Chất liệu chính' : 'Primary materials'} value={goodsMaterial} onChange={event => setGoodsMaterial(event.target.value)} />
              <Input label={lang === 'vi' ? 'Số kiện' : 'Package count'} type="number" value={packageCount.toString()} onChange={event => setPackageCount(Number(event.target.value))} />
              <Input label={lang === 'vi' ? 'Khối lượng thực (kg)' : 'Actual weight (kg)'} type="number" value={goodsWeight.toString()} onChange={event => setGoodsWeight(Number(event.target.value))} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-stone-700">{lang === 'vi' ? 'Kích thước kiện đại diện (D × R × C, cm)' : 'Package dimensions (L × W × H, cm)'}</p>
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" value={cargoLength.toString()} onChange={event => setCargoLength(Number(event.target.value))} />
                <Input type="number" value={cargoWidth.toString()} onChange={event => setCargoWidth(Number(event.target.value))} />
                <Input type="number" value={cargoHeight.toString()} onChange={event => setCargoHeight(Number(event.target.value))} />
              </div>
              <div className="mt-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                <b>DIM: {dimWeight} kg</b> · {lang === 'vi' ? `Khối lượng tính giá: ${Math.max(goodsWeight, dimWeight)} kg (lấy số lớn hơn giữa thực tế và DIM).` : `Billable weight: ${Math.max(goodsWeight, dimWeight)} kg.`}
              </div>
            </div>
            <Input label={lang === 'vi' ? 'Tình trạng hàng hóa ban đầu' : 'Initial goods condition'} value={goodsCondition} onChange={event => setGoodsCondition(event.target.value)} />
            <Select label={lang === 'vi' ? 'Thời hạn hợp đồng' : 'Lease term'}>
              <option>{lang === 'vi' ? 'Theo từng tháng (Linh hoạt)' : 'Month-to-month'}</option>
              <option>{lang === 'vi' ? 'Gói 3 tháng' : '3 months'}</option>
              <option>{lang === 'vi' ? 'Gói 6 tháng (Giảm 5%)' : '6 months (5% off)'}</option>
              <option>{lang === 'vi' ? 'Gói 12 tháng (Giảm 10%)' : '12 months (10% off)'}</option>
            </Select>
            <Select label={lang === 'vi' ? 'Phương thức thanh toán' : 'Payment method'}>
              <option>{lang === 'vi' ? 'Thẻ tín dụng / Ghi nợ quốc tế' : 'Add new card'}</option>
              <option>{lang === 'vi' ? 'Chuyển khoản ngân hàng (QR Code)' : 'Bank Transfer (QR)'}</option>
            </Select>
            <label className="flex items-start gap-2 text-sm text-stone-600">
              <input type="checkbox" className="mt-0.5 !w-4" defaultChecked />
              <span>{lang === 'vi' ? 'Tôi đồng ý với các điều khoản thuê kho và quy chế ra vào cơ sở StorageHub.' : 'I agree to the rental terms and facility access policy.'}</span>
            </label>
            <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
              <Button variant="outline" onClick={() => setBookOpen(false)}>
                {lang === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button onClick={confirmReservation}>
                {lang === 'vi' ? 'Gửi yêu cầu giữ kho' : 'Submit storage hold'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title={lang === 'vi' ? 'Chi Tiết Thanh Toán' : 'Payment details'}>
        <div className="space-y-4">
          <Input label={lang === 'vi' ? 'Số thẻ thanh toán' : 'Card number'} placeholder="1234 5678 9012 3456" />
          <div className="grid grid-cols-2 gap-3">
            <Input label={lang === 'vi' ? 'Hạn thẻ (MM/YY)' : 'Expiry'} placeholder="MM/YY" />
            <Input label="CVV" placeholder="123" />
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" className="!w-4" defaultChecked />
            {lang === 'vi' ? 'Lưu thẻ an toàn cho các kỳ thanh toán tiếp theo' : 'Save this card securely'}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              {lang === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button onClick={completePayment}>
              {paymentTarget ? (lang === 'vi' ? 'Thanh toán bảo mật' : 'Pay securely') : (lang === 'vi' ? 'Lưu thẻ' : 'Save payment method')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ticket Conversation Thread Modal */}
      <Modal
        open={conversationOpen}
        onClose={() => setConversationOpen(false)}
        title={lang === 'vi' ? 'Trao Đổi Trực Tuyến Với Bộ Phận Hỗ Trợ' : 'Support Ticket Conversation'}
      >
        {selectedTicket && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="rounded-lg bg-[#292a27] p-4 text-white">
              <div className="flex justify-between items-center text-xs font-mono text-[#e9a12c]">
                <span>{selectedTicket.id}</span>
                <span className="uppercase">{selectedTicket.category}</span>
              </div>
              <h3 className="font-bold text-base mt-1 text-stone-100">{selectedTicket.subject}</h3>
              <p className="text-xs text-stone-400 mt-1">
                {lang === 'vi' ? 'Cơ sở' : 'Facility'}: {selectedTicket.facility} · {lang === 'vi' ? 'Gian kho' : 'Unit'}: {selectedTicket.unit}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant={selectedTicket.status === 'open' ? 'info' : selectedTicket.status === 'in-progress' ? 'warning' : 'success'}>
                  {selectedTicket.status === 'open' ? (lang === 'vi' ? 'Đang mở' : 'open') : selectedTicket.status === 'in-progress' ? (lang === 'vi' ? 'Đang xử lý' : 'in-progress') : (lang === 'vi' ? 'Đã giải quyết' : 'resolved')}
                </Badge>
                <Badge variant={selectedTicket.priority === 'high' ? 'error' : selectedTicket.priority === 'medium' ? 'warning' : 'muted'}>
                  {selectedTicket.priority === 'high' ? (lang === 'vi' ? 'Ưu tiên cao' : 'high priority') : selectedTicket.priority === 'medium' ? (lang === 'vi' ? 'Ưu tiên vừa' : 'medium priority') : (lang === 'vi' ? 'Tiêu chuẩn' : 'normal priority')}
                </Badge>
              </div>
            </div>

            {/* Conversation message stream */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {selectedTicket.messages?.map(msg => {
                const isMe = msg.role === 'customer'
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mb-0.5">
                      <span className="font-medium text-stone-700">{msg.sender}</span>
                      <span>•</span>
                      <span>{msg.time}</span>
                    </div>
                    <div
                      className={`p-3 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                        isMe
                          ? 'bg-[#e9a12c] text-[#292a27] font-medium rounded-tr-none'
                          : 'bg-stone-100 text-stone-800 rounded-tl-none border border-stone-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Reply Input Box */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <textarea
                rows={2}
                placeholder={lang === 'vi' ? 'Nhập tin nhắn phản hồi của bạn...' : 'Type your reply to the support team...'}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="w-full border border-stone-300 rounded-lg p-2.5 text-xs text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTickets(prev =>
                      prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'resolved' } : t)
                    )
                    setSelectedTicket(prev => prev ? { ...prev, status: 'resolved' } : null)
                    showToast(lang === 'vi' ? 'Yêu cầu đã được đánh dấu giải quyết!' : 'Ticket marked as resolved!')
                  }}
                >
                  {lang === 'vi' ? 'Đã giải quyết xong' : 'Mark Resolved'}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setConversationOpen(false)}>
                    {lang === 'vi' ? 'Đóng' : 'Close'}
                  </Button>
                  <Button
                    size="sm"
                    disabled={!replyText.trim()}
                    onClick={() => {
                      const newMsg = {
                        id: `msg-${Date.now()}`,
                        sender: user.name,
                        role: 'customer' as const,
                        time: lang === 'vi' ? 'Vừa xong' : 'Just now',
                        text: replyText.trim()
                      }
                      const updatedTicket = {
                        ...selectedTicket,
                        messages: [...(selectedTicket.messages || []), newMsg]
                      }
                      setSelectedTicket(updatedTicket)
                      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t))
                      setReplyText('')
                      showToast(lang === 'vi' ? 'Tin nhắn đã được gửi đến ban quản lý kho!' : 'Reply dispatched to facility support team!')
                    }}
                  >
                    {lang === 'vi' ? 'Gửi tin nhắn' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Enhanced New Support Ticket Modal */}
      <Modal
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        title={lang === 'vi' ? 'Tạo Yêu Cầu Hỗ Trợ Mới' : 'Create New Support Request'}
      >
        <div className="space-y-4">
          <Input
            label={lang === 'vi' ? 'Tiêu đề yêu cầu' : 'Subject'}
            value={ticketSubject}
            onChange={event => setTicketSubject(event.target.value)}
            placeholder={lang === 'vi' ? 'Mô tả tóm tắt sự cố (ví dụ: Lỗi mã khóa PIN, câu hỏi hóa đơn)' : 'Briefly describe the issue (e.g. Keypad access, receipt question)'}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={lang === 'vi' ? 'Phân loại' : 'Category'}
              value={ticketCategory}
              onChange={e => setTicketCategory(e.target.value)}
            >
              <option>{lang === 'vi' ? 'Cửa & Khóa số' : 'Access & Entry'}</option>
              <option>{lang === 'vi' ? 'Cước phí & Hóa đơn' : 'Billing & Invoices'}</option>
              <option>{lang === 'vi' ? 'Tình trạng phòng kho' : 'Unit Condition'}</option>
              <option>{lang === 'vi' ? 'Khác / Chung' : 'Other / General'}</option>
            </Select>
            <Select
              label={lang === 'vi' ? 'Mức độ ưu tiên' : 'Priority'}
              value={ticketPriority}
              onChange={e => setTicketPriority(e.target.value as any)}
            >
              <option value="low">{lang === 'vi' ? 'Thấp (Câu hỏi thông thường)' : 'Low (General inquiry)'}</option>
              <option value="medium">{lang === 'vi' ? 'Trung bình (Cần hỗ trợ)' : 'Medium (Standard request)'}</option>
              <option value="high">{lang === 'vi' ? 'Cao (Sự cố vào kho khẩn cấp)' : 'High (Urgent access issue)'}</option>
            </Select>
          </div>
          <Select label={lang === 'vi' ? 'Gian kho liên quan' : 'Related Storage Unit'}>
            <option>{activeRentals[0] ? (lang === 'vi' ? `Gian kho ${activeRentals[0].unit} · ${activeRentals[0].facility}` : `Unit ${activeRentals[0].unit} · ${activeRentals[0].facility}`) : (lang === 'vi' ? 'Không có kho nào' : 'No active rental')}</option>
          </Select>
          <div className="space-y-1">
            <label htmlFor="support-description" className="text-sm font-medium text-stone-700">
              {lang === 'vi' ? 'Mô tả chi tiết nội dung' : 'Detailed Description'}
            </label>
            <textarea
              id="support-description"
              rows={4}
              value={ticketDescription}
              onChange={e => setTicketDescription(e.target.value)}
              placeholder={lang === 'vi' ? 'Cung cấp chi tiết sự việc, thời gian xảy ra và điều bạn cần chúng tôi trợ giúp...' : 'Tell us what happened, when it occurred, and how we can assist you'}
              className="w-full border border-stone-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
            <Button variant="outline" onClick={() => setTicketOpen(false)}>
              {lang === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button
              disabled={!ticketSubject.trim()}
              onClick={() => {
                const newTkt: TicketItem = {
                  id: `TKT-${Math.floor(1050 + Math.random() * 900)}`,
                  customer: user.name,
                  email: user.email,
                  subject: ticketSubject.trim(),
                  category: ticketCategory,
                  priority: ticketPriority,
                  status: 'open',
                  created: lang === 'vi' ? 'Hôm nay · Vừa xong' : 'Today · Just now',
                  facility: activeRentals[0]?.facility || 'Downtown Storage',
                  unit: activeRentals[0]?.unit || 'B-208',
                  messages: [
                    {
                      id: `msg-${Date.now()}`,
                      sender: user.name,
                      role: 'customer',
                      time: lang === 'vi' ? 'Vừa xong' : 'Just now',
                      text: ticketDescription || ticketSubject
                    }
                  ]
                }
                setTickets([newTkt, ...tickets])
                setTicketOpen(false)
                setTicketSubject('')
                setTicketDescription('')
                showToast(lang === 'vi' ? `Yêu cầu hỗ trợ ${newTkt.id} đã được gửi thành công!` : `Support ticket ${newTkt.id} submitted! Support team notified.`)
              }}
            >
              {lang === 'vi' ? 'Gửi yêu cầu' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
