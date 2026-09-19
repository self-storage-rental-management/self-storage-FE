import { useState, useEffect } from 'react'
import Layout, { getInitialPage, Icon } from '../../components/Layout'
import { Badge, Button, Card, StatCard, Table, Thead, Tbody, Th, Td, Tr, SectionHeader, Modal, Input, Select, Tabs, Avatar, ProgressBar } from '../../components/ui'
import { useLanguage } from '../../i18n/LanguageContext'
import type { User } from '../../types'
import type { StorageUnit, StorageHold } from '../../types/storageHub'
import { useStorageHub } from '../../store/StorageHubContext'
import { evaluatePromotion } from '../../utils/promotions'
import ProfileView from '../ProfileView'
import type { TicketItem } from '../../data/demoDatabase'

const statusLabelMap: Record<string, Record<string, string>> = {
  vi: {
    active: 'Đang hoạt động',
    available: 'Còn trống',
    held: 'Đang giữ kho',
    assigned: 'Đã phân kho',
    occupied: 'Đã thuê',
    inspection: 'Đang kiểm tra',
    maintenance: 'Bảo trì',
    paid: 'Đã thanh toán',
    resolved: 'Đã giải quyết',
    pending: 'Chờ xử lý',
    awaiting_email: 'Chờ xác nhận email',
    awaiting_review: 'Chờ nhân viên duyệt',
    awaiting_payment: 'Chờ thanh toán cọc',
    approved: 'Đã duyệt',
    confirmed: 'Đã xác nhận',
    deposit_paid: 'Đã cọc giữ chỗ',
    contract_signed: 'Đã ký hợp đồng',
    fully_paid: 'Đã thanh toán đủ',
    unit_assigned: 'Đã phân kho',
    scheduled: 'Đã lên lịch check-in',
    checked_in: 'Đã bàn giao kho',
    rejected: 'Đã từ chối',
    expired: 'Đã hết hạn',
    return_requested: 'Chờ trả kho',
    completed: 'Đã hoàn tất',
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
    held: 'Held',
    assigned: 'Assigned',
    occupied: 'Occupied',
    inspection: 'Inspection',
    maintenance: 'Maintenance',
    paid: 'Paid',
    resolved: 'Resolved',
    pending: 'Pending',
    awaiting_email: 'Awaiting Email',
    awaiting_review: 'Awaiting Review',
    awaiting_payment: 'Awaiting Payment',
    approved: 'Approved',
    confirmed: 'Confirmed',
    deposit_paid: 'Deposit Paid',
    contract_signed: 'Contract Signed',
    fully_paid: 'Fully Paid',
    unit_assigned: 'Unit Assigned',
    scheduled: 'Scheduled Check-in',
    checked_in: 'Checked In',
    rejected: 'Rejected',
    expired: 'Expired',
    return_requested: 'Return Requested',
    completed: 'Completed',
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

interface SizeCategoryCardProps {
  facility: Facility
  unitType: UnitType
  availableCount: number
  lang: 'vi' | 'en'
  onReserve: (facility: Facility, unitType: UnitType) => void
  onViewSpecs: (facility: Facility, unitType: UnitType) => void
}

function SizeCategoryCard({ facility, unitType, availableCount, lang, onReserve, onViewSpecs }: SizeCategoryCardProps) {
  const deposit20Pct = Math.round((unitType.monthlyPrice * 2) * 0.2)
  const isAvailable = availableCount > 0

  return (
    <Card className="p-5 stat-card-hover flex flex-col justify-between border-t-4 border-t-amber-500">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="text-base font-bold text-stone-900">{unitType.name}</h3>
            <p className="font-mono text-xs text-amber-800 font-semibold mt-0.5">
              {unitType.lengthM}m × {unitType.widthM}m × {unitType.heightM}m · <b>{unitType.areaM2} m²</b> ({unitType.volumeM3} m³)
            </p>
          </div>
          <Badge variant={isAvailable ? 'success' : 'muted'}>
            {isAvailable
              ? (lang === 'vi' ? `${availableCount} kho còn trống` : `${availableCount} available`)
              : (lang === 'vi' ? 'Hết kho' : 'Sold out')}
          </Badge>
        </div>

        {/* Detailed specs box */}
        <div className="my-3 rounded-lg border border-stone-200 bg-[#f8f7f1] p-3 space-y-1.5 text-xs text-stone-700">
          <div className="flex justify-between">
            <span className="text-stone-500">{lang === 'vi' ? 'Tải trọng sàn tối đa:' : 'Max floor load:'}</span>
            <span className="font-semibold text-stone-800">{unitType.maxLoadKg} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">{lang === 'vi' ? 'Tiện ích phòng:' : 'Features:'}</span>
            <span className="font-semibold text-emerald-800">{lang === 'vi' ? 'Điều hòa & Kiểm soát độ ẩm 24/7' : 'Climate & Humidity Control'}</span>
          </div>
          <p className="text-[11px] text-stone-600 pt-1.5 border-t border-stone-200/80">
            <span className="font-medium">{lang === 'vi' ? unitType.descriptionVi : unitType.descriptionEn}</span>
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-stone-100 pt-4 mt-2">
        <div>
          <p className="text-2xl font-bold text-stone-900">${unitType.monthlyPrice}<span className="text-sm font-normal text-stone-500">/{lang === 'vi' ? 'tháng' : 'mo'}</span></p>
          <p className="text-[11px] text-amber-800 font-medium">
            {lang === 'vi' ? `Cọc giữ chỗ 20%: $${deposit20Pct}` : `20% Deposit: $${deposit20Pct}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onViewSpecs(facility, unitType)}>
            {lang === 'vi' ? 'Chi tiết' : 'Details'}
          </Button>
          <Button
            size="sm"
            disabled={!isAvailable}
            onClick={() => onReserve(facility, unitType)}
          >
            {isAvailable ? (lang === 'vi' ? 'Đặt giữ chỗ' : 'Reserve') : (lang === 'vi' ? 'Hết kho' : 'Sold Out')}
          </Button>
        </div>
      </div>
    </Card>
  )
}

interface CustomerAppProps { user: User; onLogout: () => void }

export default function CustomerApp({ user, onLogout }: CustomerAppProps) {
  const { lang, t } = useLanguage()
  const {
    facilities,
    units,
    holds,
    rentals,
    tickets,
    config,
    unitTypes,
    validateAndCreateReservation,
    calculateDIMAndQuote,
    createStorageHold,
    verifyHoldEmail,
    resendHoldEmail,
    payStorageHold,
    contracts,
    payments,
    applyDiscountToReservation,
    scheduleCheckIn,
    requestReturn,
    requestRenewal,
    cancelReservation,
    renewals,
    createSupportTicket,
    respondSupportTicket
  } = useStorageHub()

  const NAV = [
    { id: 'overview', label: lang === 'vi' ? 'Tổng quan' : 'Overview', icon: Icon.home, group: lang === 'vi' ? 'Kho của tôi' : 'My Storage' },
    { id: 'browse-facilities', label: lang === 'vi' ? 'Tìm cơ sở kho' : 'Find a Facility', icon: Icon.building, group: lang === 'vi' ? 'Tìm gian kho' : 'Find Storage' },
    { id: 'browse-units', label: lang === 'vi' ? 'Cỡ kho khả dụng' : 'Available Sizes', icon: Icon.box, group: lang === 'vi' ? 'Tìm gian kho' : 'Find Storage' },
    { id: 'reservations', label: lang === 'vi' ? 'Đơn đặt giữ kho' : 'Storage Reservations', icon: Icon.calendar, group: lang === 'vi' ? 'Đặt giữ kho' : 'Bookings' },
    { id: 'my-rentals', label: lang === 'vi' ? 'Hồ sơ thuê của tôi' : 'My Rentals', icon: Icon.key, group: lang === 'vi' ? 'Đặt giữ kho' : 'Bookings' },
    { id: 'contracts', label: lang === 'vi' ? 'Hợp đồng của tôi' : 'My Contracts', icon: Icon.policy, group: lang === 'vi' ? 'Đặt giữ kho' : 'Bookings' },
    { id: 'payments', label: lang === 'vi' ? 'Lịch sử thanh toán' : 'Payments', icon: Icon.credit, group: lang === 'vi' ? 'Tài khoản' : 'Account' },
    { id: 'policies', label: lang === 'vi' ? 'Quy định & Chính sách' : 'Rental Policies', icon: Icon.policy, group: lang === 'vi' ? 'Tài khoản' : 'Account' },
    { id: 'support', label: lang === 'vi' ? 'Hỗ trợ khách hàng' : 'Support', icon: Icon.help, group: lang === 'vi' ? 'Hỗ trợ' : 'Support' }
  ]

  const [page, setPage] = useState(() => getInitialPage(NAV, 'overview'))
  const [previousPage, setPreviousPage] = useState('overview')
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('facilityId') || new URLSearchParams(window.location.search).get('facility')
  })
  const [selectedTarget, setSelectedTarget] = useState<{ facility: Facility; unitType: UnitType } | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<StorageUnit | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [bookOpen, setBookOpen] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromoCode, setAppliedPromoCode] = useState('')
  const [promoFeedback, setPromoFeedback] = useState<{ valid: boolean; message: string } | null>(null)

  // Step modals
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [activeHoldForEmail, setActiveHoldForEmail] = useState<StorageHold | null>(null)
  const [inputToken, setInputToken] = useState('')

  const [payModalOpen, setPayModalOpen] = useState(false)
  const [activeHoldForPayment, setActiveHoldForPayment] = useState<StorageHold | null>(null)
  const [payDiscountCode, setPayDiscountCode] = useState('')
  const [payDiscountMsg, setPayDiscountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('Chuyển khoản VietQR')

  // Post-payment Digital Contract & Receipt Email Modal
  const [contractEmailModalOpen, setContractEmailModalOpen] = useState(false)
  const [activeHoldForContract, setActiveHoldForContract] = useState<StorageHold | null>(null)
  const [contractTab, setContractTab] = useState<'contract' | 'receipt'>('contract')

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [activeHoldForSchedule, setActiveHoldForSchedule] = useState<StorageHold | null>(null)
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')

  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [activeRentalForReturn, setActiveRentalForReturn] = useState<typeof rentals[0] | null>(null)
  const [returnTargetDate, setReturnTargetDate] = useState('2026-09-30')
  const [returnReason, setReturnReason] = useState('Hết nhu cầu lưu trữ')

  const [renewalModalOpen, setRenewalModalOpen] = useState(false)
  const [activeRentalForRenewal, setActiveRentalForRenewal] = useState<typeof rentals[0] | null>(null)
  const [renewalTargetDate, setRenewalTargetDate] = useState('')

  // Search & Filter state
  const [sizeFilter, setSizeFilter] = useState('All')
  const [searchFacility, setSearchFacility] = useState('')

  // Validation violation state in booking modal
  const [validationViolation, setValidationViolation] = useState<{
    reason: string
    suggestedUnitTypeId?: string
    suggestedUnitTypeName?: string
    suggestedVolumeM3?: number
  } | null>(null)

  // Live timer tick
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatCountdown = (expiresAt?: string) => {
    if (!expiresAt) return { text: '--:--', isUrgent: false, isExpired: false }
    const diff = Math.floor((new Date(expiresAt).getTime() - now) / 1000)
    if (diff <= 0) return { text: '00:00 (Hết hạn)', isUrgent: true, isExpired: true }
    const mins = Math.floor(diff / 60)
    const secs = diff % 60
    const text = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return { text, isUrgent: diff <= 300, isExpired: false }
  }

  // Goods declaration form in Booking Modal
  const [goodsType, setGoodsType] = useState('Đồ gia dụng & nội thất')
  const [goodsMaterial, setGoodsMaterial] = useState('Gỗ, nhựa, vải')
  const [packageCount, setPackageCount] = useState(6)
  const [goodsWeight, setGoodsWeight] = useState(80)
  const [cargoLength, setCargoLength] = useState(80)
  const [cargoWidth, setCargoWidth] = useState(60)
  const [cargoHeight, setCargoHeight] = useState(70)
  const [goodsCondition, setGoodsCondition] = useState('6 kiện nguyên vẹn, bao gói cẩn thận')
  const [moveInDate, setMoveInDate] = useState('2026-09-22')
  const [rentalMonths, setRentalMonths] = useState(3)
  const [customerIdCard, setCustomerIdCard] = useState('079203009988')
  const [customerPhone, setCustomerPhone] = useState(user.facility || '+84 908 123 456')

  // Support
  const [ticketOpen, setTicketOpen] = useState(false)
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketCategory, setTicketCategory] = useState('Access & Entry')
  const [ticketPriority, setTicketPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [ticketDescription, setTicketDescription] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)
  const [conversationOpen, setConversationOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [supportTab, setSupportTab] = useState('All')
  const [supportSearch, setSupportSearch] = useState('')

  // Toast
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const badgeFor = (status: string) => {
    const variant: Record<string, string> = {
      active: 'success', available: 'success', paid: 'success', resolved: 'success',
      confirmed: 'success', checked_in: 'success', approved: 'success',
      pending: 'warning', awaiting_email: 'warning', awaiting_review: 'info',
      awaiting_payment: 'warning', scheduled: 'purple', held: 'warning',
      overdue: 'error', rejected: 'error', expired: 'error',
      return_requested: 'warning', completed: 'muted', open: 'info', 'in-progress': 'warning',
      ended: 'muted', closed: 'muted', low: 'muted', medium: 'warning', high: 'error'
    }
    const label = statusLabelMap[lang]?.[status] || (status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '))
    return <Badge variant={variant[status] ?? 'muted'}>{label}</Badge>
  }

  const featureLabel = (unit: StorageUnit) => {
    if (lang === 'vi') return unit.climate ? 'Có điều hòa & kiểm soát độ ẩm' : 'Thông gió tự nhiên'
    return unit.climate ? 'Climate controlled' : 'Standard ventilation'
  }

  // Data scoping for Customer (P1.4)
  const myHolds = holds.filter(h => h.customerId === user.id || h.customerName === user.name || h.customerEmail === user.email)
  const myRentals = rentals.filter(r => r.customerId === user.id || r.customerName === user.name || r.customerEmail === user.email)
  const activeRentals = myRentals.filter(r => r.status === 'active' || r.status === 'return_requested')

  const selectedFacility = facilities.find(facility => facility.id === selectedFacilityId) ?? null
  const availableUnits = units.filter(unit =>
    (!selectedFacility || unit.facilityName === selectedFacility.name || unit.facilityId === selectedFacility.id) &&
    (sizeFilter === 'All' || unit.type === sizeFilter)
  )
  const matchingFacilities = facilities.filter(facility =>
    `${facility.name} ${facility.address} ${facility.city}`.toLowerCase().includes(searchFacility.toLowerCase())
  )

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

  const handleStartReservation = (facility: Facility, unitType: UnitType) => {
    setSelectedTarget({ facility, unitType })
    const repUnit: StorageUnit = {
      id: '',
      code: unitType.name,
      facilityId: facility.id,
      facilityName: facility.name,
      floor: 1,
      zone: 'Tiêu chuẩn',
      type: unitType.name.split(' ')[0] as any,
      areaM2: unitType.areaM2,
      dimensions: { lengthM: unitType.lengthM, widthM: unitType.widthM, heightM: unitType.heightM },
      doorDimensions: { widthM: 1.1, heightM: 2.2 },
      volumeM3: unitType.volumeM3,
      maxLoadKg: unitType.maxLoadKg,
      allowedGoods: ['Đồ gia dụng', 'Thiết bị văn phòng', 'Tài liệu, hồ sơ', 'Hàng thương mại điện tử'],
      prohibitedGoods: ['Chất dễ cháy nổ', 'Hóa chất độc hại', 'Hàng cấm theo luật', 'Thực phẩm tươi sống'],
      price: unitType.monthlyPrice,
      deposit: unitType.monthlyPrice,
      climate: true,
      status: 'available',
      reservedPeriods: [],
      version: 1
    }
    setSelectedUnit(repUnit)
    setPromoCode('')
    setAppliedPromoCode('')
    setPromoFeedback(null)
    setDetailOpen(false)
    setBookOpen(true)
  }

  const handleOpenSpecs = (facility: Facility, unitType: UnitType) => {
    setSelectedTarget({ facility, unitType })
    const repUnit: StorageUnit = {
      id: '',
      code: unitType.name,
      facilityId: facility.id,
      facilityName: facility.name,
      floor: 1,
      zone: 'Tiêu chuẩn',
      type: unitType.name.split(' ')[0] as any,
      areaM2: unitType.areaM2,
      dimensions: { lengthM: unitType.lengthM, widthM: unitType.widthM, heightM: unitType.heightM },
      doorDimensions: { widthM: 1.1, heightM: 2.2 },
      volumeM3: unitType.volumeM3,
      maxLoadKg: unitType.maxLoadKg,
      allowedGoods: ['Đồ gia dụng', 'Thiết bị văn phòng', 'Tài liệu, hồ sơ', 'Hàng thương mại điện tử'],
      prohibitedGoods: ['Chất dễ cháy nổ', 'Hóa chất độc hại', 'Hàng cấm theo luật', 'Thực phẩm tươi sống'],
      price: unitType.monthlyPrice,
      deposit: unitType.monthlyPrice,
      climate: true,
      status: 'available',
      reservedPeriods: [],
      version: 1
    }
    setSelectedUnit(repUnit)
    setDetailOpen(true)
  }

  // Quote preview for currently open booking modal
  const currentQuote = selectedUnit
    ? (typeof calculateDIMAndQuote === 'function'
        ? calculateDIMAndQuote(selectedUnit, {
            lengthCm: cargoLength,
            widthCm: cargoWidth,
            heightCm: cargoHeight,
            weightKg: goodsWeight,
            packageCount
          })
        : {
            quoteId: `QUO-${Date.now().toString().slice(-4)}`,
            unitId: selectedUnit.id,
            facilityId: selectedUnit.facilityId,
            baseMonthlyPrice: selectedUnit.price,
            depositAmount: selectedUnit.deposit || selectedUnit.price,
            dimSurcharge: 0,
            totalFirstPayment: (selectedUnit.price * 2),
            dimWeightKg: Math.ceil((cargoLength * cargoWidth * cargoHeight * packageCount) / 5000),
            actualWeightKg: goodsWeight,
            billableWeightKg: Math.max(goodsWeight, Math.ceil((cargoLength * cargoWidth * cargoHeight * packageCount) / 5000)),
            dimDivisor: 5000,
            quotedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
    : null

  const appliedPromotion = selectedUnit && currentQuote && appliedPromoCode
    ? evaluatePromotion(appliedPromoCode, {
        facilityName: selectedUnit.facilityName,
        unitType: selectedUnit.type,
        rentalMonths,
        baseMonthlyPrice: currentQuote.baseMonthlyPrice,
        dimSurcharge: currentQuote.dimSurcharge
      })
    : null
  const promotionDiscount = appliedPromotion?.discountAmount ?? 0
  const discountedFirstPayment = currentQuote ? Math.max(0, currentQuote.totalFirstPayment - promotionDiscount) : 0

  const applyPromotionCode = () => {
    if (!selectedUnit || !currentQuote || !promoCode.trim()) {
      setAppliedPromoCode('')
      setPromoFeedback({ valid: false, message: lang === 'vi' ? 'Vui lòng nhập mã giảm giá.' : 'Enter a promotion code.' })
      return
    }

    const result = evaluatePromotion(promoCode, {
      facilityName: selectedUnit.facilityName,
      unitType: selectedUnit.type,
      rentalMonths,
      baseMonthlyPrice: currentQuote.baseMonthlyPrice,
      dimSurcharge: currentQuote.dimSurcharge
    })
    const valid = result.discountAmount > 0
    setAppliedPromoCode(valid ? result.promotion?.code ?? '' : '')
    setPromoCode(result.promotion?.code ?? promoCode.trim().toUpperCase())
    setPromoFeedback({ valid, message: lang === 'vi' ? result.messageVi : result.messageEn })
  }

  // Submit reservation: Uses single atomic validation transaction (PASS / SOFT_EXCEPTION / HARD_VIOLATION)
  const confirmReservation = () => {
    if (!selectedUnit || !currentQuote) return

    const targetFacilityId = selectedTarget ? selectedTarget.facility.id : selectedUnit.facilityId
    const targetUnitTypeId = selectedTarget
      ? selectedTarget.unitType.id
      : selectedUnit.type === 'Medium'
      ? 'medium'
      : selectedUnit.type === 'Large'
      ? 'large'
      : selectedUnit.type === 'Extra Large'
      ? 'xlarge'
      : 'small'

    const result = validateAndCreateReservation({
      customer: user,
      unitTypeId: targetUnitTypeId,
      facilityId: targetFacilityId,
      goods: {
        category: goodsType,
        packageCount,
        lengthCm: cargoLength,
        widthCm: cargoWidth,
        heightCm: cargoHeight,
        weightKg: goodsWeight,
        dimWeightKg: currentQuote.dimWeightKg,
        material: goodsMaterial,
        condition: goodsCondition,
        fragile: false
      },
      rentalMonths,
      moveInDate,
      identityId: customerIdCard,
      customerPhone,
      promoCode: undefined,
      largestItemDimensionsCm: {
        lengthCm: cargoLength,
        widthCm: cargoWidth,
        heightCm: cargoHeight
      }
    })

    if (result.outcome === 'HARD_VIOLATION') {
      setValidationViolation({
        reason: result.rejectionReason,
        suggestedUnitTypeId: result.suggestedUnitTypeId,
        suggestedUnitTypeName: result.suggestedUnitTypeName,
        suggestedVolumeM3: result.suggestedVolumeM3
      })
      showToast(lang === 'vi' ? 'Vi phạm quy chuẩn! Không thể giữ gian kho này.' : 'Physical incompatibility detected!')
      return
    }

    setValidationViolation(null)
    setBookOpen(false)
    setSelectedUnit(null)
    setPromoCode('')
    setAppliedPromoCode('')
    setPromoFeedback(null)

    if (result.outcome === 'SOFT_EXCEPTION') {
      setPage('reservations')
      showToast(lang === 'vi' ? 'Đơn ngoại lệ đang chờ nhân viên duyệt (15 phút). Kho đã được tạm giữ!' : 'Soft exception! Unit held for 15 minutes awaiting staff review.')
    } else {
      // PASS: Directly prompt deposit payment
      setActiveHoldForPayment(result.hold)
      setPayModalOpen(true)
      setPage('reservations')
      showToast(lang === 'vi' ? 'Đơn giữ kho đã được duyệt tự động! Vui lòng nộp cọc trong vòng 15 phút.' : 'Auto-approved! Please complete deposit within 15 minutes.')
    }
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
      {/* ── OVERVIEW ───────────────────────────────────────────── */}
      {page === 'overview' && (
        <div className="fade-in">
          <SectionHeader
            eyebrow={lang === 'vi' ? 'CỔNG KHÁCH HÀNG · KHÁCH THUÊ KHO' : 'CUSTOMER PORTAL · TENANT'}
            title={lang === 'vi' ? `Chào mừng trở lại, ${user.name}` : `Welcome back, ${user.name}`}
            subtitle={lang === 'vi' ? 'Quản lý yêu cầu giữ kho, hồ sơ thuê và mã mở cửa an toàn' : 'Manage storage holds, active rentals and secure gate codes'}
            action={<Button onClick={() => navigateTo('browse-units')}>{Icon.search} {lang === 'vi' ? 'Tìm gian kho' : 'Find a unit'}</Button>}
          />

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Account summary">
            <StatCard title={lang === 'vi' ? 'Hồ sơ thuê đang hoạt động' : 'Active rentals'} value={activeRentals.length} icon={Icon.key} iconBg="bg-blue-50 text-blue-700" />
            <StatCard title={lang === 'vi' ? 'Đơn đặt giữ kho' : 'Storage reservations'} value={myHolds.length} icon={Icon.calendar} iconBg="bg-amber-50 text-amber-700" />
            <StatCard title={lang === 'vi' ? 'Kho đang giữ chờ hoàn tất' : 'Pending holds'} value={myHolds.filter(h => h.status !== 'checked_in' && h.status !== 'rejected').length} icon={Icon.clock} iconBg="bg-emerald-50 text-emerald-700" />
            <StatCard title={lang === 'vi' ? 'Yêu cầu hỗ trợ đang mở' : 'Open tickets'} value={tickets.filter(t => t.status === 'open').length} icon={Icon.support} />
          </section>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
                <div>
                  <p className="eyebrow">{lang === 'vi' ? 'Kho hiện tại' : 'Active storage space'}</p>
                  <h2 className="mt-1 font-bold text-stone-900">{lang === 'vi' ? 'Quyền truy cập kho của bạn' : 'Your storage access credential'}</h2>
                </div>
                {activeRentals[0] && badgeFor(activeRentals[0].status)}
              </div>
              {activeRentals[0] ? (
                <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <p className="font-mono text-xs font-semibold uppercase tracking-[.08em] text-amber-700">
                      {lang === 'vi' ? `Gian kho ${activeRentals[0].unitId}` : `Unit ${activeRentals[0].unitId}`}
                    </p>
                    <p className="mt-2 text-xl font-bold text-stone-900">{activeRentals[0].facilityName}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {activeRentals[0].unitType} · {activeRentals[0].areaM2} m² · {lang === 'vi' ? 'Kỳ hạn tiếp theo:' : 'Next payment:'} {activeRentals[0].nextDue}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <div className="rounded-lg bg-[#292a27] px-3 py-1.5 text-white font-mono text-sm font-bold flex items-center gap-2">
                        <span> {lang === 'vi' ? 'Mã mở cổng:' : 'Gate PIN:'}</span>
                        <span className="text-[#e9a12c]">{activeRentals[0].gateCode}</span>
                      </div>
                      <Badge variant="success">{lang === 'vi' ? 'Quyền vào 24/7' : '24/7 access'}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigateTo('my-rentals')}>
                      {lang === 'vi' ? 'Chi tiết hồ sơ thuê' : 'Rental details'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="font-semibold text-stone-700">{lang === 'vi' ? 'Bạn chưa có hồ sơ thuê kho đang hoạt động' : 'You do not have an active rental'}</p>
                  <p className="mt-1 text-sm text-stone-500">{lang === 'vi' ? 'Hãy khám phá các gian kho còn trống và giữ kho phù hợp với hàng hóa của bạn.' : 'Browse available units and reserve a unit suited for your items.'}</p>
                  <Button className="mt-4" onClick={() => navigateTo('browse-units')}>
                    {lang === 'vi' ? 'Xem các gian kho còn trống' : 'Browse available units'}
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <p className="eyebrow">{lang === 'vi' ? 'Thao tác nhanh' : 'Quick actions'}</p>
              <h2 className="mt-1 font-bold text-stone-900">{lang === 'vi' ? 'Quy trình thuê kho khép kín' : 'Storage lifecycle steps'}</h2>
              <div className="mt-4 grid gap-2">
                <button onClick={() => navigateTo('browse-units')} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 text-left hover:border-amber-400 hover:bg-amber-50/40 transition">
                  <span className="text-amber-700">{Icon.building}</span>
                  <span>
                    <b className="block text-sm">{lang === 'vi' ? '1. Chọn kho & Khai báo hàng hóa' : '1. Choose unit & Goods DIM'}</b>
                    <small className="text-stone-500">{lang === 'vi' ? 'Hệ thống tính DIM và đề xuất kho tối ưu' : 'Automated DIM & size recommendation'}</small>
                  </span>
                </button>
                <button onClick={() => navigateTo('reservations')} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 text-left hover:border-amber-400 hover:bg-amber-50/40 transition">
                  <span className="text-amber-700">{Icon.calendar}</span>
                  <span>
                    <b className="block text-sm">{lang === 'vi' ? '2. Tiến độ đơn đặt giữ kho' : '2. Storage hold progress'}</b>
                    <small className="text-stone-500">{lang === 'vi' ? 'Xác thực email, thanh toán cọc và đặt lịch check-in' : 'Verify email, pay deposit & schedule check-in'}</small>
                  </span>
                </button>
                <button onClick={() => setTicketOpen(true)} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 text-left hover:border-amber-400 hover:bg-amber-50/40 transition">
                  <span className="text-amber-700">{Icon.support}</span>
                  <span>
                    <b className="block text-sm">{lang === 'vi' ? '3. Hỗ trợ kỹ thuật & Mở cổng' : '3. Support desk'}</b>
                    <small className="text-stone-500">{lang === 'vi' ? 'Đội ngũ trực cơ sở hỗ trợ 24/7' : 'Facility staff support round the clock'}</small>
                  </span>
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── BROWSE FACILITIES ──────────────────────────────────── */}
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
                  className="pl-10 w-full border border-stone-300 rounded-lg py-2 text-sm focus:ring-2 focus:ring-amber-500"
                />
                <span className="pointer-events-none absolute left-3 top-2.5 text-stone-400">{Icon.search}</span>
              </label>
            }
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {matchingFacilities.map(facility => {
              const facUnits = units.filter(u => u.facilityId === facility.id || u.facilityName === facility.name)
              const availCount = facUnits.filter(u => u.status === 'available').length

              return (
                <Card key={facility.id} className="overflow-hidden stat-card-hover">
                  <div className="relative h-44 bg-stone-200">
                    <img src={`https://images.unsplash.com/${facility.image}?w=720&h=352&fit=crop&auto=format`} alt={`${facility.name} storage facility`} className="h-full w-full object-cover" />
                    <div className="absolute left-3 top-3">
                      <Badge variant={availCount > 0 ? 'success' : 'warning'}>
                        {availCount} {lang === 'vi' ? 'gian kho còn trống' : 'units available'}
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
                      <span className="text-sm font-semibold text-amber-700"> {facility.rating}</span>
                    </div>
                    <div className="my-4 flex flex-wrap gap-2">
                      <Badge variant="muted">{lang === 'vi' ? 'Camera 24/7' : '24/7 security'}</Badge>
                      {facility.climate && <Badge variant="info">{lang === 'vi' ? 'Điều hòa độ ẩm' : 'Climate control'}</Badge>}
                    </div>
                    <div className="flex items-end justify-between border-t border-stone-100 pt-4">
                      <div>
                        <p className="text-xs text-stone-500">{lang === 'vi' ? 'Giá chỉ từ' : 'Starting from'}</p>
                        <p className="text-xl font-bold text-stone-900">{facility.price}<span className="text-xs font-normal text-stone-500">/{lang === 'vi' ? 'tháng' : 'month'}</span></p>
                      </div>
                      <Button size="sm" onClick={() => navigateTo('browse-units', { facilityId: facility.id })}>
                        {lang === 'vi' ? 'Xem các gian kho' : 'View units'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ── BROWSE UNITS / SIZES BY FACILITY ─────────────────── */}
      {page === 'browse-units' && (() => {
        const displayedFacilities = selectedFacility
          ? [selectedFacility]
          : facilities.filter(f =>
              `${f.name} ${f.address} ${f.city}`.toLowerCase().includes(searchFacility.toLowerCase())
            )

        const displayedUnitTypes = sizeFilter === 'All'
          ? unitTypes
          : unitTypes.filter(ut => ut.name.toLowerCase().includes(sizeFilter.toLowerCase()))

        return (
          <div className="fade-in space-y-6">
            <SectionHeader
              title={selectedFacility
                ? (lang === 'vi' ? `Các Cỡ Kho Tại ${selectedFacility.name}` : `Storage Sizes at ${selectedFacility.name}`)
                : (lang === 'vi' ? 'Khám Phá Các Cỡ Kho Theo Cơ Sở' : 'Available Storage Sizes by Facility')}
              subtitle={selectedFacility
                ? `${selectedFacility.address} · ${lang === 'vi' ? 'Chọn cỡ kho phù hợp nhu cầu. Quản lý sẽ phân bổ gian kho cụ thể sau khi đặt.' : 'Select a size category. Facility manager assigns unit code after booking.'}`
                : (lang === 'vi' ? 'Chọn cơ sở và cỡ kho mong muốn. Quản lý cơ sở sẽ bố trí gian kho cụ thể sau khi tiếp nhận đặt cọc.' : 'Choose facility and unit size. Specific unit code is assigned by facility manager.')}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  {selectedFacility && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedFacilityId(null)}
                    >
                      ← {lang === 'vi' ? 'Tất cả cơ sở' : 'All Facilities'}
                    </Button>
                  )}
                  <Select value={sizeFilter} onChange={event => setSizeFilter(event.target.value)} className="w-full sm:w-56">
                    <option value="All">{lang === 'vi' ? 'Tất cả kích thước' : 'All sizes'}</option>
                    <option value="Small">{lang === 'vi' ? 'Nhỏ (Small · ~2.25 m²)' : 'Small (~2.25 m²)'}</option>
                    <option value="Medium">{lang === 'vi' ? 'Vừa (Medium · ~6.0 m²)' : 'Medium (~6.0 m²)'}</option>
                    <option value="Large">{lang === 'vi' ? 'Lớn (Large · ~12.0 m²)' : 'Large (~12.0 m²)'}</option>
                    <option value="Extra Large">{lang === 'vi' ? 'Cực lớn (XL · ~18.0 m²)' : 'Extra Large (~18.0 m²)'}</option>
                  </Select>
                </div>
              }
            />

            {selectedFacility && (
              <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-amber-800 font-semibold"> {lang === 'vi' ? 'Đang xem cơ sở:' : 'Facility:'}</span>
                  <b className="text-stone-900">{selectedFacility.name}</b>
                  <span className="text-stone-500 text-[11px]">({selectedFacility.address})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFacilityId(null)}
                  className="text-amber-900 font-semibold hover:underline text-xs flex items-center gap-1"
                >
                  {lang === 'vi' ? 'Xem toàn bộ cơ sở' : 'Show all'} ✕
                </button>
              </div>
            )}

            {/* List Facilities with their 3-4 Unit Sizes */}
            <div className="space-y-8">
              {displayedFacilities.map(facility => {
                const facUnits = units.filter(u => u.facilityId === facility.id || u.facilityName === facility.name)
                const totalAvail = facUnits.filter(u => u.status === 'available').length

                return (
                  <section key={facility.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {facility.id.toUpperCase()}
                          </span>
                          <h3 className="text-lg font-bold text-stone-900">{facility.name}</h3>
                          <span className="text-xs font-semibold text-amber-600">★ {facility.rating}</span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">{facility.address}, {facility.city}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={totalAvail > 0 ? 'success' : 'muted'}>
                          {totalAvail} {lang === 'vi' ? 'kho khả dụng' : 'available'}
                        </Badge>
                        {!selectedFacility && (
                          <Button size="sm" variant="outline" onClick={() => setSelectedFacilityId(facility.id)}>
                            {lang === 'vi' ? 'Lọc riêng cơ sở này' : 'View only'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 3-4 Size Categories Grid for this facility */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      {displayedUnitTypes.map(ut => {
                        const targetUnits = facUnits.filter(u =>
                          u.type.toLowerCase().includes(ut.name.split(' ')[0].toLowerCase())
                        )
                        const availableCount = targetUnits.filter(u => u.status === 'available').length

                        return (
                          <SizeCategoryCard
                            key={ut.id}
                            facility={facility}
                            unitType={ut}
                            availableCount={availableCount}
                            lang={lang}
                            onReserve={handleStartReservation}
                            onViewSpecs={handleOpenSpecs}
                          />
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── STORAGE RESERVATIONS (HOLDS) ─────────────────────── */}
      {page === 'reservations' && (
        <div className="fade-in space-y-4">
          <SectionHeader
            title={lang === 'vi' ? 'Đơn Đặt Giữ Kho Của Tôi' : 'Storage Reservations'}
            subtitle={lang === 'vi' ? 'Theo dõi vòng đời: Đặt giữ kho → Xác nhận email → Nhân viên duyệt → Thanh toán cọc → Bàn giao' : 'Lifecycle: Hold → Verify Email → Staff Review → Pay Deposit → Handover'}
            action={<Button size="sm" onClick={() => navigateTo('browse-units')}>{Icon.plus} {lang === 'vi' ? 'Đặt giữ kho mới' : 'New hold'}</Button>}
          />

          {myHolds.length ? (
            <div className="grid gap-4">
              {myHolds.map(hold => (
                <Card key={hold.id} className="p-5 border-l-4 border-l-amber-500">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-700">{hold.id}</span>
                        {badgeFor(hold.status)}
                        {hold.payment.status === 'paid' && <Badge variant="success">{lang === 'vi' ? 'Đã cọc giữ chỗ 20%' : '20% Deposit Paid'}</Badge>}
                      </div>
                      <h2 className="mt-1 text-lg font-bold text-stone-900">
                        {hold.assignedUnitId ? (lang === 'vi' ? `Gian kho ${hold.assignedUnitId}` : `Unit ${hold.assignedUnitId}`) : (hold.unitTypeName || hold.unitId)} · {hold.facilityName}
                      </h2>
                      <p className="text-xs text-stone-500">
                        {lang === 'vi' ? 'Ngày dự kiến dọn vào:' : 'Expected move-in:'} <b>{hold.moveInDate}</b> · {lang === 'vi' ? 'Kỳ thuê:' : 'Period:'} {hold.rentalMonths} {lang === 'vi' ? 'tháng' : 'months'} ({hold.startDate} → {hold.endDate})
                      </p>

                      <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p><b>Hàng hóa khai báo:</b> {hold.goods.category} ({hold.goods.packageCount} kiện, {hold.goods.weightKg}kg)</p>
                          {hold.assignedUnitId ? (
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                               Gian kho được phân: <b>{hold.assignedUnitId}</b>
                            </span>
                          ) : (
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                              Chờ Facility Manager phân kho theo khoảng ngày
                            </span>
                          )}
                        </div>
                        <p><b>{lang === 'vi' ? 'Kích thước kiện & Thể tích:' : 'Package specs & Volume:'}</b> {hold.goods.lengthCm}×{hold.goods.widthCm}×{hold.goods.heightCm}cm (~{Math.round((hold.goods.lengthCm * hold.goods.widthCm * hold.goods.heightCm * hold.goods.packageCount) / 1000) / 1000} m³)</p>
                        
                        {/* Financial breakdown: Reservation Deposit vs Security Deposit */}
                        <div className="mt-2 pt-2 border-t border-stone-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <span className="text-stone-500 block">{lang === 'vi' ? 'Cọc giữ chỗ (20%):' : 'Reservation Dep:'}</span>
                            <span className="font-bold text-emerald-700">${hold.reservationDepositAmount ?? Math.round((hold.firstMonthRent || hold.quote.baseMonthlyPrice) * 2 * 0.2)}</span>
                          </div>
                          <div>
                            <span className="text-stone-500 block">{lang === 'vi' ? 'Cọc bảo đảm (HĐ):' : 'Security Dep:'}</span>
                            <span className="font-bold text-stone-800">${hold.securityDepositAmount ?? hold.firstMonthRent ?? hold.quote.depositAmount}</span>
                          </div>
                          <div>
                            <span className="text-stone-500 block">{lang === 'vi' ? 'Thuê tháng đầu:' : '1st Month Rent:'}</span>
                            <span className="font-bold text-stone-800">${hold.firstMonthRent ?? hold.quote.baseMonthlyPrice}</span>
                          </div>
                          <div>
                            <span className="text-stone-500 block">{lang === 'vi' ? 'Còn thanh toán tại cơ sở:' : 'Balance Due:'}</span>
                            <span className="font-bold text-amber-800">${hold.remainingAmount ?? 0}</span>
                          </div>
                        </div>

                        {hold.depositConvertedAt && (
                          <p className="text-[11px] text-emerald-700 font-medium pt-1">
                             {lang === 'vi' ? 'Cọc giữ chỗ 20% đã được chuyển đổi thành cọc bảo đảm hợp đồng.' : 'Reservation deposit was converted to contract security deposit.'}
                          </p>
                        )}

                        {hold.generatedAccessPin && (
                          <div className="mt-2 rounded bg-[#292a27] p-2 text-white font-mono text-xs flex items-center justify-between">
                            <span>{lang === 'vi' ? 'Mã PIN hệ thống cấp (Kích hoạt sau check-in):' : 'System-generated Gate PIN:'}</span>
                            <span className="text-[#e9a12c] font-bold text-sm tracking-widest">{hold.generatedAccessPin}</span>
                          </div>
                        )}
                      </div>

                      {/* Canonical Lifecycle Indicators */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-semibold text-stone-600">{lang === 'vi' ? 'Vòng đời:' : 'Lifecycle:'}</span>
                        <Badge variant={hold.status === 'CREATED' ? 'warning' : 'success'}>1. {lang === 'vi' ? 'Tạo đơn' : 'Created'}</Badge>
                        <Badge variant={['DEPOSIT_PAID', 'UNIT_RESERVED', 'READY_FOR_CHECKIN', 'COMPLETED'].includes(hold.status) ? 'success' : 'muted'}>
                          2. {lang === 'vi' ? 'Cọc 20% (DEPOSIT_PAID)' : 'Deposit Paid'}
                        </Badge>
                        <Badge variant={['UNIT_RESERVED', 'READY_FOR_CHECKIN', 'COMPLETED'].includes(hold.status) ? 'success' : 'muted'}>
                          3. {lang === 'vi' ? 'Phân kho (UNIT_RESERVED)' : 'Unit Reserved'}
                        </Badge>
                        <Badge variant={['READY_FOR_CHECKIN', 'COMPLETED'].includes(hold.status) ? 'purple' : 'muted'}>
                          4. {lang === 'vi' ? 'Sẵn sàng check-in (READY)' : 'Ready'}
                        </Badge>
                        <Badge variant={hold.status === 'COMPLETED' ? 'success' : 'muted'}>
                          5. {lang === 'vi' ? 'Hoàn tất (COMPLETED)' : 'Completed'}
                        </Badge>
                      </div>
                    </div>

                    {/* Action buttons based on canonical status */}
                    <div className="flex flex-col gap-2 items-end">
                      <div className="text-right">
                        <p className="text-xs text-stone-500">{lang === 'vi' ? 'Tổng ban đầu:' : 'Total initial:'}</p>
                        <p className="text-xl font-bold text-stone-900">${hold.totalInitialAmount ?? hold.quote.totalFirstPayment}</p>
                        <p className="text-xs text-amber-800">
                          {lang === 'vi' ? 'Đã cọc' : 'Deposit'}: ${hold.reservationDepositAmount ?? hold.payment.amount} · {lang === 'vi' ? 'Còn lại' : 'Balance'}: ${hold.remainingAmount}
                        </p>
                      </div>

                      {/* View Contract & Receipt */}
                      {hold.payment.status === 'paid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveHoldForContract(hold)
                            setContractEmailModalOpen(true)
                          }}
                        >
                          {lang === 'vi' ? 'Xem điều khoản & biên lai' : 'Terms & receipt'}
                        </Button>
                      )}

                      {/* UNIT_RESERVED: Manager assigned, prompt customer to visit facility */}
                      {hold.status === 'UNIT_RESERVED' && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-right text-xs space-y-1">
                          <p className="font-semibold text-amber-900">
                            {lang === 'vi' ? 'Đã phân bổ kho! Vui lòng đến cơ sở:' : 'Unit assigned! Please visit facility:'}
                          </p>
                          <p className="text-[11px] text-stone-600">
                            {lang === 'vi' ? '• Xuất trình CCCD/Hộ chiếu gốc' : '• Present original ID/Passport'}<br />
                            {lang === 'vi' ? '• Ký hợp đồng giấy tại quầy' : '• Sign paper contract at desk'}<br />
                            {lang === 'vi' ? `• Thanh toán phần còn lại ($${hold.remainingAmount})` : `• Pay remaining balance ($${hold.remainingAmount})`}
                          </p>
                        </div>
                      )}

                      {/* READY_FOR_CHECKIN: Contract & payment complete, ready for handover */}
                      {hold.status === 'READY_FOR_CHECKIN' && (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-300 p-2.5 text-right text-xs space-y-1">
                          <p className="font-bold text-emerald-900">
                             {lang === 'vi' ? 'Sẵn sàng nhận bàn giao kho' : 'Ready for Check-in'}
                          </p>
                          <p className="text-[11px] text-stone-600">
                            {lang === 'vi' ? 'Nhân viên sẽ chụp ảnh hiện trạng và kích hoạt mã PIN mở cửa.' : 'Staff will inspect unit and activate your gate PIN.'}
                          </p>
                        </div>
                      )}

                      {/* COMPLETED: Check-in complete, show rental */}
                      {hold.status === 'COMPLETED' && (
                        <Button variant="primary" size="sm" onClick={() => navigateTo('my-rentals')}>
                          {lang === 'vi' ? 'Xem hồ sơ thuê kho' : 'View active rental'}
                        </Button>
                      )}

                      {/* Cancel Reservation Action */}
                      {['CREATED', 'DEPOSIT_PAID', 'UNIT_RESERVED'].includes(hold.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 text-xs"
                          onClick={() => {
                            if (window.confirm(lang === 'vi' ? 'Bạn có chắc chắn muốn hủy đơn đặt giữ kho này?' : 'Cancel this reservation?')) {
                              cancelReservation(hold.id, user, 'Khách hàng chủ động hủy')
                              showToast(lang === 'vi' ? 'Đã hủy đơn đặt giữ kho thành công.' : 'Reservation cancelled.')
                            }
                          }}
                        >
                          ✕ {lang === 'vi' ? 'Hủy đặt chỗ' : 'Cancel booking'}
                        </Button>
                      )}

                      {hold.status === 'CANCELLED' && (
                        <div className="rounded-lg bg-stone-100 border border-stone-300 px-3 py-1.5 text-xs text-stone-600 text-right">
                          <p className="font-bold text-red-700">✕ {lang === 'vi' ? 'Đơn đã hủy' : 'Cancelled'}</p>
                          <p className="text-[11px] mt-0.5">{lang === 'vi' ? 'Gian kho đã được giải phóng.' : 'Unit capacity released.'}</p>
                        </div>
                      )}

                      {hold.status === 'EXPIRED' && (
                        <div className="rounded-lg bg-stone-100 border border-stone-300 px-3 py-1.5 text-xs text-stone-600 text-right">
                          <p className="font-bold text-stone-700"> {lang === 'vi' ? 'Đơn đã hết hạn (Quá hạn/No-show)' : 'Expired (No-show)'}</p>
                          <p className="text-[11px] mt-0.5">{lang === 'vi' ? 'Gian kho đã được hoàn lại danh mục.' : 'Unit capacity returned.'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-10 text-center">
              <div className="mx-auto w-fit text-stone-300">{Icon.calendar}</div>
              <h2 className="mt-3 font-semibold text-stone-700">{lang === 'vi' ? 'Chưa có đơn đặt giữ kho nào' : 'No reservations'}</h2>
              <p className="mt-1 text-sm text-stone-500">{lang === 'vi' ? 'Đơn đặt giữ kho của bạn sẽ hiển thị tại đây.' : 'Your next reservation will appear here.'}</p>
              <Button className="mt-4" size="sm" onClick={() => navigateTo('browse-units')}>
                {lang === 'vi' ? 'Khám phá gian kho' : 'Browse units'}
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* ── MY RENTALS (HỒ SƠ THUÊ CỦA TÔI) ───────────────────── */}
      {page === 'my-rentals' && (
        <div className="fade-in space-y-4">
          <SectionHeader
            title={lang === 'vi' ? 'Hồ Sơ Thuê Kho Của Tôi' : 'My Rentals'}
            subtitle={lang === 'vi' ? 'Hồ sơ thuê thực tế (kích hoạt sau check-in), mã mở cửa và thủ tục trả kho' : 'Active storage profiles, gate access codes and move-out procedures'}
            action={<Button variant="outline" size="sm" onClick={() => setPage(previousPage || 'overview')}>← {lang === 'vi' ? 'Quay lại' : 'Back'}</Button>}
          />

          {myRentals.length ? (
            <div className="grid gap-4">
              {myRentals.map(rental => (
                <Card key={rental.id} className="overflow-hidden">
                  <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-amber-700">{rental.id}</span>
                        <h2 className="text-lg font-bold text-stone-900">{lang === 'vi' ? `Gian kho ${rental.unitId}` : `Unit ${rental.unitId}`}</h2>
                        {badgeFor(rental.status)}
                      </div>
                      <p className="mt-1 text-sm text-stone-600">{rental.facilityName} · {rental.unitType} ({rental.areaM2} m² · {rental.volumeM3 || 15} m³)</p>
                      <p className="mt-2 text-xs text-stone-400">
                        {lang === 'vi' ? 'Kỳ thuê: ' : 'Term: '} {rental.startDate} → {rental.endDate} · {lang === 'vi' ? 'Hạn đóng cước: ' : 'Next due: '} {rental.nextDue}
                      </p>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="rounded-md bg-[#292a27] px-3 py-1 text-white font-mono text-xs flex items-center gap-2">
                          <span className="text-stone-400">{lang === 'vi' ? 'Mã mở cổng:' : 'PIN:'}</span>
                          <span className="text-[#e9a12c] font-bold tracking-wider">{rental.gateCode}</span>
                        </div>
                        <span className="text-xs text-stone-500">{lang === 'vi' ? 'Cọc bảo đảm:' : 'Security deposit:'} <b>${rental.securityDeposit ?? rental.deposit}</b></span>
                      </div>
                    </div>

                    <div className="md:text-right">
                      <p className="text-2xl font-bold text-stone-900">${rental.monthlyRate}<span className="text-sm font-normal text-stone-500">/{lang === 'vi' ? 'tháng' : 'month'}</span></p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const matchingHold = holds.find(h => h.unitId === rental.unitId || h.id === rental.id)
                            if (matchingHold) {
                              setActiveHoldForContract(matchingHold)
                            } else {
                              const syntheticHold: StorageHold = {
                                id: `CTR-${rental.id}`,
                                customerId: rental.customerId,
                                customerName: rental.customerName,
                                customerEmail: rental.customerEmail,
                                customerPhone: user.facility || '+84 908 123 456',
                                identityId: '079203009988',
                                facilityId: rental.facilityId,
                                facilityName: rental.facilityName,
                                unitId: rental.unitId,
                                rentalMonths: 3,
                                moveInDate: rental.startDate,
                                status: 'checked_in',
                                goods: {
                                  category: 'Đồ gia dụng & nội thất',
                                  packageCount: 6,
                                  lengthCm: 80,
                                  widthCm: 60,
                                  heightCm: 70,
                                  weightKg: 80,
                                  dimWeightKg: 67,
                                  material: 'Gỗ, nhựa, vải',
                                  condition: rental.initialCondition || 'Tiêu chuẩn',
                                  fragile: false
                                },
                                quote: {
                                  quoteId: `Q-${rental.unitId}`,
                                  unitId: rental.unitId,
                                  facilityId: rental.facilityId,
                                  baseMonthlyPrice: rental.monthlyRate,
                                  depositAmount: rental.deposit,
                                  dimSurcharge: 0,
                                  totalFirstPayment: rental.monthlyRate + rental.deposit,
                                  dimWeightKg: 67,
                                  actualWeightKg: 80,
                                  billableWeightKg: 80,
                                  dimDivisor: 5000,
                                  quotedAt: rental.startDate,
                                  expiresAt: rental.endDate
                                },
                                emailVerification: {
                                  token: 'VERIFIED',
                                  verified: true,
                                  sentAt: rental.startDate,
                                  expiresAt: rental.endDate,
                                  attemptCount: 1
                                },
                                payment: {
                                  amount: rental.monthlyRate + rental.deposit,
                                  status: 'paid',
                                  method: 'Chuyển khoản VietQR',
                                  transactionId: `TX-RNT-${rental.unitId}`,
                                  paidAt: rental.startDate
                                },
                                appointmentDate: rental.startDate,
                                appointmentTime: '10:00 AM',
                                expiresAt: rental.endDate,
                                evidence: rental.evidencePhotos || [],
                                createdAt: rental.startDate
                              }
                              setActiveHoldForContract(syntheticHold)
                            }
                            setContractTab('contract')
                            setContractEmailModalOpen(true)
                          }}
                        >
                          {lang === 'vi' ? 'Hợp đồng thuê' : 'Rental contract'}
                        </Button>

                        {rental.status === 'active' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveRentalForRenewal(rental)
                                setRenewalTargetDate('')
                                setRenewalModalOpen(true)
                              }}
                            >
                               {lang === 'vi' ? 'Yêu cầu gia hạn' : 'Request renewal'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveRentalForReturn(rental)
                                setReturnModalOpen(true)
                              }}
                            >
                               {lang === 'vi' ? 'Yêu cầu trả kho' : 'Request move-out'}
                            </Button>
                          </>
                        )}
                        {rental.status === 'return_requested' && (
                          <Badge variant="warning">{lang === 'vi' ? 'Đã gửi yêu cầu trả kho' : 'Move-out requested'}</Badge>
                        )}
                        {rental.status === 'completed' && (
                          <Badge variant="muted">{lang === 'vi' ? 'Đã thanh lý & hoàn cọc' : 'Completed & settled'}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-10 text-center">
              <div className="mx-auto w-fit text-stone-300">{Icon.key}</div>
              <h2 className="mt-3 font-semibold text-stone-700">{lang === 'vi' ? 'Chưa có hồ sơ thuê nào đang hoạt động' : 'No active rentals'}</h2>
              <p className="mt-1 text-sm text-stone-500">
                {lang === 'vi' ? 'Hồ sơ thuê chỉ được tạo sau khi đơn giữ kho được nhân viên bàn giao thành công.' : 'Rental profiles are activated after staff handover and check-in.'}
              </p>
              <Button className="mt-4" size="sm" onClick={() => navigateTo('browse-units')}>
                {lang === 'vi' ? 'Tìm gian kho trống' : 'Find a unit'}
              </Button>
            </Card>
          )}
        </div>
      )}

      {page === 'contracts' && <div className="fade-in space-y-4">
        <SectionHeader title={lang === 'vi' ? 'Hợp đồng của tôi' : 'My Contracts'} subtitle={lang === 'vi' ? 'Bản scan hợp đồng giấy đã ký tại cơ sở' : 'Signed paper contract scans from the facility'} />
        {contracts.filter(c => myHolds.some(h => h.id === c.reservationId)).length ? contracts.filter(c => myHolds.some(h => h.id === c.reservationId)).map(c => <Card key={c.id} className="p-4 text-sm space-y-1">
          <p className="font-bold">{c.contractNumber} · {c.status}</p>
          <p>{lang === 'vi' ? 'Ngày ký' : 'Signed'}: {c.signedAt} · {lang === 'vi' ? 'Hiệu lực' : 'Term'}: {c.startDate} – {c.endDate}</p>
          <p>{lang === 'vi' ? 'Bản scan' : 'Scan'}: {c.scannedFileName}</p>
          <div className="flex gap-4"><a href={c.scannedFileUrl} target="_blank" rel="noopener noreferrer" className="underline text-amber-800">{lang === 'vi' ? 'Xem hợp đồng' : 'View contract'}</a><a href={c.scannedFileUrl} download={c.scannedFileName} className="underline text-amber-800">{lang === 'vi' ? 'Tải bản scan' : 'Download scan'}</a></div>
        </Card>) : <Card className="p-4 text-sm text-stone-500">{lang === 'vi' ? 'Chưa có hợp đồng giấy đã ký. Hợp đồng sẽ xuất hiện sau khi nhân viên lưu bản scan.' : 'No signed paper contract scan yet.'}</Card>}
      </div>}

      {/* ── PAYMENTS ─────────────────────────────────────────── */}
      {page === 'payments' && (
        <div className="fade-in space-y-4">
          <SectionHeader
            title={lang === 'vi' ? 'Lịch Sử Thanh Toán & Quyết Toán' : 'Payments & Billing'}
            subtitle={lang === 'vi' ? 'Hóa đơn tiền thuê, phí giữ kho và quyết toán hoàn cọc' : 'Invoices, deposits and return settlement receipts'}
          />

          <Card className="p-4 text-sm space-y-2">
            <p className="font-bold">{lang === 'vi' ? 'Biên nhận đặt giữ kho' : 'Reservation payment receipts'}</p>
            {payments.filter(p => myHolds.some(h => h.id === p.reservationId)).map(p => <p key={p.id}>
              {p.type === 'RESERVATION_DEPOSIT' ? (lang === 'vi' ? 'Cọc giữ chỗ' : 'Reservation deposit') : (lang === 'vi' ? 'Thanh toán còn lại' : 'Remaining balance')} · {p.reservationId} · ${p.amount} · {p.id}
            </p>)}
            {!payments.some(p => myHolds.some(h => h.id === p.reservationId)) && <p className="text-stone-500">{lang === 'vi' ? 'Chưa có biên nhận.' : 'No receipts yet.'}</p>}
          </Card>

          <Card>
            <Table>
              <Thead>
                <tr>
                  <Th>{lang === 'vi' ? 'Mã Giao Dịch' : 'Reference'}</Th>
                  <Th>{lang === 'vi' ? 'Gian Kho' : 'Unit'}</Th>
                  <Th>{lang === 'vi' ? 'Nội Dung' : 'Description'}</Th>
                  <Th>{lang === 'vi' ? 'Phương Thức' : 'Method'}</Th>
                  <Th>{lang === 'vi' ? 'Số Tiền' : 'Amount'}</Th>
                  <Th>{lang === 'vi' ? 'Trạng Thái' : 'Status'}</Th>
                </tr>
              </Thead>
              <Tbody>
                {myHolds.filter(h => h.payment.status === 'paid').map(h => (
                  <Tr key={h.id}>
                    <Td><span className="font-mono text-xs text-stone-600">{h.payment.transactionId || h.id}</span></Td>
                    <Td><b>{h.unitId}</b> ({h.facilityName})</Td>
                    <Td>{lang === 'vi' ? 'Tiền cọc & cước tháng đầu' : 'Deposit & first month'}</Td>
                    <Td><span className="text-xs text-stone-500">{h.payment.method || 'VietQR'}</span></Td>
                    <Td><b>${h.payment.amount}</b></Td>
                    <Td><Badge variant="success">{lang === 'vi' ? 'Đã thu' : 'Paid'}</Badge></Td>
                  </Tr>
                ))}
                {myRentals.map(r => (
                  <Tr key={r.id}>
                    <Td><span className="font-mono text-xs text-stone-600">{r.id}</span></Td>
                    <Td><b>{r.unitId}</b></Td>
                    <Td>{lang === 'vi' ? `Kỳ thuê kho ${r.startDate} - ${r.nextDue}` : `Rental term ${r.startDate}`}</Td>
                    <Td><span className="text-xs text-stone-500">Auto-Debit Card</span></Td>
                    <Td><b>${r.monthlyRate}</b></Td>
                    <Td><Badge variant="success">{lang === 'vi' ? 'Hiệu lực' : 'Settled'}</Badge></Td>
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
          return matchTab && (!query || t.subject.toLowerCase().includes(query) || t.id.toLowerCase().includes(query))
        })

        return (
          <div className="fade-in space-y-6">
            <SectionHeader
              title={lang === 'vi' ? 'Tổng Đài Hỗ Trợ Khách Hàng' : 'Customer Support Desk'}
              subtitle={lang === 'vi' ? 'Gửi yêu cầu đổi mã PIN, hỏi cước phí hoặc xử lý sự cố ra vào kho' : 'Submit questions, report keypad glitches or request assistance'}
              action={
                <Button size="sm" onClick={() => setTicketOpen(true)}>
                  {Icon.plus} {lang === 'vi' ? 'Tạo yêu cầu mới' : 'New Request'}
                </Button>
              }
            />

            <div className="flex items-center justify-between gap-4">
              <Tabs
                tabs={lang === 'vi' ? ['Tất Cả', 'Đang Mở', 'Đang Khắc Phục', 'Đã Xong'] : ['All', 'Open', 'In Progress', 'Resolved']}
                active={supportTab === 'All' ? (lang === 'vi' ? 'Tất Cả' : 'All') : supportTab}
                onChange={newTab => {
                  if (newTab === 'Tất Cả' || newTab === 'All') setSupportTab('All')
                  else if (newTab === 'Đang Mở' || newTab === 'Open') setSupportTab('open')
                  else if (newTab === 'Đang Khắc Phục' || newTab === 'In Progress') setSupportTab('in-progress')
                  else setSupportTab('resolved')
                }}
              />
              <input
                type="text"
                placeholder={lang === 'vi' ? 'Tìm phiếu...' : 'Search tickets...'}
                value={supportSearch}
                onChange={e => setSupportSearch(e.target.value)}
                className="text-xs border border-stone-300 rounded-lg px-3 py-1.5"
              />
            </div>

            <Card>
              <Table>
                <Thead>
                  <tr>
                    <Th>{lang === 'vi' ? 'Mã Phiếu' : 'Ticket'}</Th>
                    <Th>{lang === 'vi' ? 'Tiêu Đề' : 'Subject'}</Th>
                    <Th>{lang === 'vi' ? 'Phân Loại' : 'Category'}</Th>
                    <Th>{lang === 'vi' ? 'Kho' : 'Unit'}</Th>
                    <Th>{lang === 'vi' ? 'Trạng Thái' : 'Status'}</Th>
                    <Th className="text-right">{lang === 'vi' ? 'Thao Tác' : 'Action'}</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {filteredTickets.map(ticket => (
                    <Tr key={ticket.id}>
                      <Td><span className="font-mono text-xs text-stone-600">{ticket.id}</span></Td>
                      <Td>
                        <p className="font-medium text-stone-900 text-sm">{ticket.subject}</p>
                        <p className="text-xs text-stone-400">{ticket.created}</p>
                      </Td>
                      <Td><Badge variant="muted">{ticket.category}</Badge></Td>
                      <Td>{ticket.facility} · {ticket.unit}</Td>
                      <Td>{badgeFor(ticket.status)}</Td>
                      <Td className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setConversationOpen(true)
                          }}
                        >
                          {lang === 'vi' ? 'Hộp thoại' : 'View'} ({ticket.messages.length})
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
          </div>
        )
      })()}

      {/* ── POLICIES PAGE ─────────────────────────────────────── */}
      {page === 'policies' && (
        <div className="fade-in space-y-6">
          <SectionHeader
            title={lang === 'vi' ? 'Quy Định & Chính Sách Thuê Kho' : 'Rental Policies & Tenant Handbook'}
            subtitle={lang === 'vi' ? 'Quy chuẩn minh bạch áp dụng cho toàn bộ khách hàng lưu trữ tại StorageHub' : 'Official rental terms, safety standards and deposit refund guarantees'}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <span className="text-2xl"></span>
              <h3 className="font-bold text-stone-900 text-sm mt-2">{lang === 'vi' ? 'Hoàn cọc 100% trong 24 giờ' : '100% Deposit Refund in 24h'}</h3>
              <p className="text-xs text-stone-500 mt-1">{lang === 'vi' ? 'Cam kết hoàn tiền cọc bảo đảm đầy đủ về tài khoản ngân hàng ngay sau khi nghiệm thu trả kho sạch sẽ.' : 'Full deposit returned within 24h of clean return inspection.'}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <span className="text-2xl"></span>
              <h3 className="font-bold text-stone-900 text-sm mt-2">{lang === 'vi' ? 'Ra vào tự do 24/7 với mã PIN' : '24/7 Access with Gate PIN'}</h3>
              <p className="text-xs text-stone-500 mt-1">{lang === 'vi' ? 'Mã mở cổng điện tử cá nhân hóa cấp riêng cho bạn, vào ra cơ sở bất kỳ lúc nào mà không phụ thuộc giờ hành chính.' : 'Personal gate PIN for round-the-clock entry without office hour restrictions.'}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <span className="text-2xl"></span>
              <h3 className="font-bold text-stone-900 text-sm mt-2">{lang === 'vi' ? 'Gia hạn thanh toán 7 ngày' : '7-Day Grace Period'}</h3>
              <p className="text-xs text-stone-500 mt-1">{lang === 'vi' ? 'Không phát sinh bất kỳ phí phạt hay khóa cổng nào trong vòng 7 ngày đầu kể từ ngày đến hạn đóng cước.' : 'No late penalty fees or gate overlocks within the first 7 days past due.'}</p>
            </div>
          </div>

          <Card className="p-5">
            <h3 className="font-bold text-stone-900 text-base mb-3">{lang === 'vi' ? 'Quy Định Chung & Danh Mục Cấm' : 'General Rules & Prohibited Items'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-700">
              <div className="space-y-2 border-r border-stone-100 pr-4">
                <p className="font-semibold text-stone-900"> {lang === 'vi' ? 'Quyền lợi khách hàng:' : 'Tenant Rights:'}</p>
                <p>• {lang === 'vi' ? 'Được sử dụng miễn phí xe đẩy 4 bánh, xe nâng tay và thang máy tại sảnh cơ sở.' : 'Complimentary flatbed carts, pallet jacks and elevators on-site.'}</p>
                <p>• {lang === 'vi' ? 'Hàng hóa được bảo quản trong môi trường kiểm soát nhiệt độ 22°C–25°C, chống ẩm mốc liên tục.' : '24/7 climate-controlled environment keeping items dry and mold-free.'}</p>
                <p>• {lang === 'vi' ? 'Bản scan hợp đồng giấy đã ký được lưu trong Hợp đồng của tôi để xem và tải về.' : 'View and download your signed paper contract scan in My Contracts.'}</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-rose-700"> {lang === 'vi' ? 'Danh mục hàng hóa nghiêm cấm lưu trữ:' : 'Prohibited Items:'}</p>
                <p>• {lang === 'vi' ? 'Chất lỏng dễ cháy (xăng, dầu hỏa, bình gas nén, hóa chất ăn mòn, sơn công nghiệp).' : 'Flammable liquids, compressed gas, toxic chemicals or fireworks.'}</p>
                <p>• {lang === 'vi' ? 'Vũ khí, chất nổ hoặc hàng hóa trái quy định pháp luật Việt Nam.' : 'Illegal weapons, explosives or contraband.'}</p>
                <p>• {lang === 'vi' ? 'Động thực vật còn sống, thực phẩm tươi sống dễ ôi thiu phát sinh côn trùng.' : 'Live animals, perishable food or biological hazards.'}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

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

      {/* ── MODAL 1: UNIT DETAILS ─────────────────────────────── */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        size="xl"
        title={selectedTarget ? (lang === 'vi' ? `Hồ Sơ Kỹ Thuật: ${selectedTarget.unitType.name} · ${selectedTarget.facility.name}` : `Technical Specifications: ${selectedTarget.unitType.name} · ${selectedTarget.facility.name}`) : (selectedUnit ? (lang === 'vi' ? `Hồ Sơ Kỹ Thuật & Chi Tiết Cỡ Kho` : `Technical Specifications`) : '')}
      >
        {selectedUnit && (() => {
          const areaM2 = selectedUnit.areaM2
          const capacityDetails =
            areaM2 <= 5
              ? {
                  boxes: lang === 'vi' ? '25 – 35 thùng carton tiêu chuẩn (60×40×40cm)' : '25 – 35 standard boxes',
                  items: lang === 'vi' ? '20–30 thùng hàng, 1 xe máy, vali đồ cá nhân, thiết bị gia đình nhỏ, hồ sơ tài liệu' : '20–30 cargo boxes, 1 motorcycle, suitcases, small household gear, file archives',
                  fit: lang === 'vi' ? 'Tương đương thể tích thùng xe bán tải / xe van 1.0 tấn' : 'Equivalent to 1.0-ton van / pickup truck capacity'
                }
              : areaM2 <= 10
              ? {
                  boxes: lang === 'vi' ? '50 – 70 thùng carton tiêu chuẩn (60×40×40cm)' : '50 – 70 standard boxes',
                  items: lang === 'vi' ? 'Bàn ghế, tủ kệ gia đình (sofa, tủ lạnh, máy giặt), tồn kho shop bán lẻ, thiết bị văn phòng' : 'Home furniture (sofa, fridge, washer), retail store inventory, office equipment',
                  fit: lang === 'vi' ? 'Tương đương thể tích thùng xe tải chở hàng 1.5 – 2.0 tấn' : 'Equivalent to 1.5–2.0 ton cargo truck capacity'
                }
              : areaM2 <= 20
              ? {
                  boxes: lang === 'vi' ? '100 – 150 thùng carton tiêu chuẩn (60×40×40cm)' : '100 – 150 standard boxes',
                  items: lang === 'vi' ? 'Toàn bộ đồ đạc dọn nhà, hàng tồn kho thương mại điện tử, lưu trữ chứng từ doanh nghiệp' : 'Full home moving contents, e-commerce business inventory, company archives',
                  fit: lang === 'vi' ? 'Tương đương thể tích 2 xe tải chở hàng 2.5 tấn' : 'Equivalent to two 2.5-ton moving trucks'
                }
              : {
                  boxes: lang === 'vi' ? '150 – 250+ thùng hàng hoặc 6–10 pallet tiêu chuẩn' : '150 – 250+ boxes or 6–10 standard pallets',
                  items: lang === 'vi' ? 'Pallet hàng hóa thương mại, máy móc công nghiệp, vật tư sự kiện, thiết bị cơ điện' : 'Commercial pallets, industrial machinery, event supplies, mechanical equipment',
                  fit: lang === 'vi' ? 'Tương đương thùng xe container 20 feet' : 'Equivalent to a 20ft shipping container'
                }

          return (
            <div className="space-y-5">
              {/* Top Banner */}
              <div className="rounded-xl bg-gradient-to-r from-[#292a27] to-[#3a3b37] p-5 text-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-xs uppercase tracking-[.1em] text-[#e9a12c]">
                    {selectedTarget ? `${selectedTarget.facility.name} · ${selectedTarget.facility.address}` : selectedUnit.facilityName}
                  </p>
                  <Badge variant={selectedUnit.status === 'available' ? 'success' : selectedUnit.status === 'held' ? 'warning' : 'muted'}>
                    {selectedUnit.status === 'available' ? (lang === 'vi' ? 'Sẵn sàng tiếp nhận đặt chỗ' : 'Available for Booking') : selectedUnit.status === 'held' ? (lang === 'vi' ? 'Đang được giữ chỗ' : 'Temporarily Reserved') : selectedUnit.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedTarget ? selectedTarget.unitType.name : selectedUnit.type} · {areaM2} m² (~{selectedUnit.volumeM3} m³)</h3>
                    <p className="text-sm text-stone-300 mt-1">
                      {lang === 'vi'
                        ? `Quy cách tiêu chuẩn: ${selectedUnit.dimensions.lengthM}m (Dài) × ${selectedUnit.dimensions.widthM}m (Rộng) × ${selectedUnit.dimensions.heightM}m (Chiều cao trần)`
                        : `Dimensions: ${selectedUnit.dimensions.lengthM}m (L) × ${selectedUnit.dimensions.widthM}m (W) × ${selectedUnit.dimensions.heightM}m (H)`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">${selectedUnit.price}<span className="text-sm font-normal text-stone-300">/{lang === 'vi' ? 'tháng' : 'mo'}</span></p>
                    <p className="text-xs text-amber-300/90 font-medium">{lang === 'vi' ? `Cọc giữ chỗ 20%: $${Math.round((selectedUnit.price * 2) * 0.2)} · Cọc bảo đảm: $${selectedUnit.deposit}` : `20% Hold Deposit: $${Math.round((selectedUnit.price * 2) * 0.2)} · Security Deposit: $${selectedUnit.deposit}`}</p>
                  </div>
                </div>
              </div>

              {/* 1. Technical Specs & Structure */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">
                  {lang === 'vi' ? '1. Thông số kết cấu & Kỹ thuật xây dựng' : '1. Structural & Technical Specifications'}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3">
                    <p className="text-[11px] text-stone-500 font-medium">{lang === 'vi' ? 'Dung tích chứa hữu ích' : 'Usable Volume'}</p>
                    <p className="mt-1 font-bold text-base text-stone-900">{selectedUnit.volumeM3} m³</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{lang === 'vi' ? 'Trần cao thoáng đãng' : 'Full ceiling clearance'}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3">
                    <p className="text-[11px] text-stone-500 font-medium">{lang === 'vi' ? 'Cửa cuốn kim loại' : 'Roll-up Door'}</p>
                    <p className="mt-1 font-bold text-base text-stone-900">{selectedUnit.doorDimensions.widthM}m × {selectedUnit.doorDimensions.heightM}m</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{lang === 'vi' ? 'Thép mạ kẽm, khóa an toàn kép' : 'Galvanized steel with double lock'}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3">
                    <p className="text-[11px] text-stone-500 font-medium">{lang === 'vi' ? 'Tải trọng sàn tối đa' : 'Floor Load Capacity'}</p>
                    <p className="mt-1 font-bold text-base text-stone-900">{selectedUnit.maxLoadKg} kg</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{lang === 'vi' ? 'Bê tông phủ Epoxy chống ẩm' : 'Epoxy sealed concrete slab'}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3">
                    <p className="text-[11px] text-stone-500 font-medium">{lang === 'vi' ? 'Hệ thống vi khí hậu' : 'Environment'}</p>
                    <p className="mt-1 font-bold text-base text-emerald-800">{featureLabel(selectedUnit)}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{lang === 'vi' ? '22°C–25°C, độ ẩm <60%' : '22°C–25°C, humidity <60%'}</p>
                  </div>
                </div>
              </div>

              {/* 2. Realistic Capacity Estimation */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-700"></span>
                  <p className="font-bold text-sm text-stone-900">
                    {lang === 'vi' ? '2. Khuyến nghị sức chứa & Loại đồ đạc phù hợp' : '2. Capacity Recommendation & Suitable Goods'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg bg-white p-3 border border-amber-200/80">
                    <span className="text-stone-500 block font-medium mb-1">{lang === 'vi' ? 'Số lượng thùng chứa:' : 'Box capacity:'}</span>
                    <span className="font-bold text-stone-900">{capacityDetails.boxes}</span>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-amber-200/80">
                    <span className="text-stone-500 block font-medium mb-1">{lang === 'vi' ? 'Đồ đạc tương thích:' : 'Typical items:'}</span>
                    <span className="font-medium text-stone-800">{capacityDetails.items}</span>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-amber-200/80">
                    <span className="text-stone-500 block font-medium mb-1">{lang === 'vi' ? 'Quy mô tải trọng tương đương:' : 'Transport volume equivalent:'}</span>
                    <span className="font-bold text-emerald-700">{capacityDetails.fit}</span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 mt-2.5 flex items-center gap-1.5">
                  <span></span>
                  <span>{lang === 'vi' ? 'Tại sảnh cơ sở luôn trang bị sẵn xe nâng tay, xe đẩy 4 bánh tải trọng 500kg và thang máy chở hàng cỡ lớn miễn phí cho bạn.' : 'Complimentary 500kg flatbed carts, pallet jacks and large cargo elevators available on-site.'}</span>
                </p>
              </div>

              {/* 3. Safety, Security & Operating Standards */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-mono">
                  {lang === 'vi' ? '3. Tiêu chuẩn an ninh, PCCC & Vận hành 24/7' : '3. Safety, Security & 24/7 Operations'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-700">
                  <div className="rounded-lg border border-stone-200 p-3 bg-white space-y-1">
                    <p className="font-bold text-stone-900 flex items-center gap-1.5">
                      <span className="text-blue-600"></span> {lang === 'vi' ? 'An ninh & Ra vào độc quyền 24/7' : '24/7 Secured Gate Access'}
                    </p>
                    <p className="text-stone-500 text-[11px]">
                      {lang === 'vi' ? 'Cổng tự động mở bằng mã PIN số cá nhân hóa do bạn sở hữu. Camera CCTV Full-HD góc rộng giám sát 24/7 từng hành lang và cửa kho.' : 'Automated access via personal gate PIN. 24/7 Full-HD CCTV surveillance covering all corridors.'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-stone-200 p-3 bg-white space-y-1">
                    <p className="font-bold text-stone-900 flex items-center gap-1.5">
                      <span className="text-rose-600"></span> {lang === 'vi' ? 'Hệ thống PCCC tự động đạt chuẩn' : 'Certified Automated Fire Suppression'}
                    </p>
                    <p className="text-stone-500 text-[11px]">
                      {lang === 'vi' ? 'Tích hợp cảm biến khói nhiệt quang học và đầu phun nước tự động Sprinkler riêng biệt cho từng gian kho, thẩm duyệt PCCC định kỳ.' : 'Equipped with optical smoke/heat detectors and independent overhead sprinkler heads.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Reservation & Financial Transparency Guarantee */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-950">
                <p className="font-bold text-sm text-emerald-900 mb-1 flex items-center gap-1.5">
                  <span></span> {lang === 'vi' ? 'Chính sách bảo đảm & Minh bạch tài chính' : 'Transparency & Deposit Guarantee'}
                </p>
                <ul className="list-disc list-inside space-y-1 text-emerald-900/90 text-[11px]">
                  <li>{lang === 'vi' ? 'Khách hàng đăng ký chọn kích cỡ kho tại cơ sở mong muốn. Quản lý cơ sở sẽ kiểm tra và phân bổ gian kho trống phù hợp.' : 'Customers choose size category at the desired facility. Facility Manager assigns an available vacant unit.'}</li>
                  <li>{lang === 'vi' ? 'Cọc giữ chỗ 20% được bảo lưu trong suốt quá trình thẩm định hàng hóa.' : '20% hold deposit is reserved during goods verification.'}</li>
                  <li>{lang === 'vi' ? `Tiền cọc bảo đảm ($${selectedUnit.deposit}) được hoàn trả 100% trong vòng 24 giờ sau khi nghiệm thu trả kho nguyên vẹn.` : `Security deposit ($${selectedUnit.deposit}) refunded 100% within 24 hours of clean move-out inspection.`}</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>{lang === 'vi' ? 'Đóng lại' : 'Close'}</Button>
                <Button
                  onClick={() => {
                    if (selectedTarget) {
                      handleStartReservation(selectedTarget.facility, selectedTarget.unitType)
                    } else {
                      setDetailOpen(false)
                      setBookOpen(true)
                    }
                  }}
                >
                  {lang === 'vi' ? 'Khai báo hàng & Đặt giữ chỗ' : 'Declare goods & Reserve'}
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ── MODAL 2: GOODS DECLARATION & HOLD (P0.1, P0.3, P1.1) ─ */}
      <Modal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        size="xl"
        title={selectedTarget ? (lang === 'vi' ? `Khai Báo Hàng Hóa & Đặt Giữ Cỡ Kho: ${selectedTarget.unitType.name}` : `Goods Declaration & Hold - ${selectedTarget.unitType.name}`) : (selectedUnit ? (lang === 'vi' ? `Khai Báo Hàng Hóa & Đặt Giữ Kho` : `Goods Declaration & Hold`) : '')}
      >
        {selectedUnit && currentQuote && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-stone-700">{lang === 'vi' ? 'Cỡ kho đã chọn:' : 'Selected size category:'}</span>
                <b>{selectedTarget ? `${selectedTarget.unitType.name} · ${selectedTarget.facility.name} (${selectedTarget.unitType.areaM2} m²)` : `${selectedUnit.facilityName} (${selectedUnit.type} · ${selectedUnit.areaM2} m²)`}</b>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-stone-700">{lang === 'vi' ? 'Kích thước & Sức chịu tải:' : 'Dimensions & Floor limit:'}</span>
                <span>{selectedUnit.dimensions.lengthM}m × {selectedUnit.dimensions.widthM}m × {selectedUnit.dimensions.heightM}m (~{selectedUnit.volumeM3} m³) · Max {selectedUnit.maxLoadKg} kg</span>
              </div>
              <div className="mt-2 text-xs text-amber-900 bg-amber-100/70 p-2.5 rounded-lg">
                {lang === 'vi'
                  ? 'Lưu ý: Quý khách đang chọn Kích Thước Kho. Quản lý cơ sở sẽ phân bổ gian kho cụ thể (mã kho, tầng) sau khi tiếp nhận và duyệt đơn cọc giữ chỗ.'
                  : 'Note: You are reserving a storage size. The Facility Manager will assign the specific vacant unit number and floor upon receiving and approving your deposit.'}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label={lang === 'vi' ? 'Họ và tên người thuê' : 'Full Name'} value={user.name} disabled />
              <Input label={lang === 'vi' ? 'Số CCCD / Hộ chiếu (Đối chiếu lúc check-in)' : 'ID / Passport'} value={customerIdCard} onChange={e => setCustomerIdCard(e.target.value)} />
              <Input label={lang === 'vi' ? 'Số điện thoại liên hệ' : 'Phone'} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
              <Input label={lang === 'vi' ? 'Ngày dự kiến dọn vào' : 'Move-in date'} type="date" value={moveInDate} onChange={e => setMoveInDate(e.target.value)} />
            </div>

            {/* Goods Declaration */}
            <div className="border-t border-stone-200 pt-3">
              <p className="font-semibold text-stone-900 text-sm mb-2">{lang === 'vi' ? 'Khai báo chi tiết hàng hóa lưu trữ' : 'Goods Declaration'}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label={lang === 'vi' ? 'Loại hàng hóa' : 'Goods type'} value={goodsType} onChange={e => setGoodsType(e.target.value)} />
                <Input label={lang === 'vi' ? 'Chất liệu chính' : 'Primary materials'} value={goodsMaterial} onChange={e => setGoodsMaterial(e.target.value)} />
                <Input label={lang === 'vi' ? 'Số kiện hàng' : 'Package count'} type="number" value={packageCount.toString()} onChange={e => setPackageCount(Math.max(1, Number(e.target.value)))} />
                <Input label={lang === 'vi' ? 'Tổng cân nặng thực tế (kg)' : 'Actual total weight (kg)'} type="number" value={goodsWeight.toString()} onChange={e => setGoodsWeight(Math.max(1, Number(e.target.value)))} />
              </div>

              <div className="mt-3">
                <p className="text-xs font-medium text-stone-700 mb-1">{lang === 'vi' ? 'Kích thước kiện hàng lớn nhất (Dài × Rộng × Cao, cm)' : 'Dimensions (L × W × H, cm)'}</p>
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" label="Dài (cm)" value={cargoLength.toString()} onChange={e => setCargoLength(Math.max(1, Number(e.target.value)))} />
                  <Input type="number" label="Rộng (cm)" value={cargoWidth.toString()} onChange={e => setCargoWidth(Math.max(1, Number(e.target.value)))} />
                  <Input type="number" label="Cao (cm)" value={cargoHeight.toString()} onChange={e => setCargoHeight(Math.max(1, Number(e.target.value)))} />
                </div>
              </div>

              <div className="mt-2">
                <Input label={lang === 'vi' ? 'Hiện trạng ban đầu lúc gửi' : 'Initial condition note'} value={goodsCondition} onChange={e => setGoodsCondition(e.target.value)} />
              </div>
            </div>

            {/* Storage Space & Cost Breakdown */}
            {(() => {
              const goodsVolM3 = Math.round((cargoLength * cargoWidth * cargoHeight * packageCount) / 1000) / 1000
              const spaceOccupancyPercent = selectedUnit.volumeM3 ? Math.min(100, Math.round((goodsVolM3 / selectedUnit.volumeM3) * 100)) : 0
              const remainingVol = Math.max(0, Math.round((selectedUnit.volumeM3 - goodsVolM3) * 1000) / 1000)
              const isOverload = goodsWeight > selectedUnit.maxLoadKg

              return (
                <div className="rounded-xl border border-stone-200 bg-gradient-to-b from-stone-50/90 to-amber-50/40 p-4 text-xs text-stone-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <div>
                      <p className="font-bold text-sm text-stone-900">{lang === 'vi' ? 'Dự Toán Chi Phí & Đối Chiếu Không Gian Lưu Trữ' : 'Space & Cost Estimation'}</p>
                      <p className="text-[11px] text-stone-500">{lang === 'vi' ? 'Phân tích mức độ tương thích giữa thể tích hàng và dung tích gian kho' : 'Volume fit and weight check for selected storage unit'}</p>
                    </div>
                    <Badge variant={spaceOccupancyPercent <= 85 ? 'success' : 'warning'}>
                      {spaceOccupancyPercent <= 85 ? (lang === 'vi' ? 'Không gian rất thoải mái' : 'Optimal Fit') : (lang === 'vi' ? 'Gần đầy gian kho' : 'Tight Fit')}
                    </Badge>
                  </div>

                  {/* Volume and Space Compatibility */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white rounded-lg p-3 border border-stone-100">
                    <div>
                      <span className="text-stone-500 block text-[11px]">{lang === 'vi' ? 'Thể tích hàng hóa khai báo:' : 'Declared goods volume:'}</span>
                      <span className="font-bold text-stone-900 text-sm">{goodsVolM3} m³</span>
                      <span className="text-[10px] text-stone-400 block">({cargoLength}×{cargoWidth}×{cargoHeight}cm · {packageCount} {lang === 'vi' ? 'kiện' : 'pkgs'})</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[11px]">{lang === 'vi' ? 'Dung tích gian kho khả dụng:' : 'Unit usable volume:'}</span>
                      <span className="font-bold text-emerald-800 text-sm">{selectedUnit.volumeM3} m³</span>
                      <span className="text-[10px] text-stone-400 block">({selectedUnit.type} · {selectedUnit.areaM2} m²)</span>
                    </div>
                  </div>

                  {/* Occupancy Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-stone-600 mb-1">
                      <span>{lang === 'vi' ? 'Tỷ lệ chiếm dụng thể tích kho:' : 'Space utilization rate:'}</span>
                      <span className="font-semibold text-stone-900">{spaceOccupancyPercent}% ({lang === 'vi' ? `còn trống ${remainingVol} m³` : `${remainingVol} m³ free space`})</span>
                    </div>
                    <ProgressBar value={spaceOccupancyPercent} max={100} color={spaceOccupancyPercent > 85 ? 'bg-amber-500' : 'bg-emerald-500'} />
                  </div>

                  {/* Floor Weight Check */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-stone-600">{lang === 'vi' ? 'Tải trọng hàng hóa thực tế:' : 'Total actual weight:'}</span>
                    <span className={isOverload ? 'font-bold text-red-700' : 'font-semibold text-emerald-700'}>
                      {goodsWeight} kg / {lang === 'vi' ? 'Sức chịu tải sàn' : 'Floor limit'} {selectedUnit.maxLoadKg} kg {isOverload ? (lang === 'vi' ? '(Vượt tải trọng)' : '(Overloaded)') : ''}
                    </span>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="border-t border-stone-200 pt-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-stone-600">{lang === 'vi' ? 'Tiền thuê gian kho (Tháng đầu):' : 'Monthly rent (1st month):'}</span>
                      <span className="font-semibold text-stone-900">${currentQuote.baseMonthlyPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">{lang === 'vi' ? 'Tiền cọc bảo đảm (Hoàn lại 100% khi trả kho đạt chuẩn):' : 'Security deposit (100% refundable):'}</span>
                      <span className="font-semibold text-stone-900">${currentQuote.depositAmount}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>{lang === 'vi' ? 'Dịch vụ an ninh, PCCC & Kiểm soát nhiệt độ 24/7:' : 'Security, Fire Safety & Climate control:'}</span>
                      <span className="text-emerald-700 font-medium">{lang === 'vi' ? 'Đã bao gồm ($0)' : 'Included ($0)'}</span>
                    </div>
                    {currentQuote.dimSurcharge > 0 && (
                      <div className="flex justify-between text-amber-800 font-medium">
                        <span>{lang === 'vi' ? 'Phụ phí tăng cường tải trọng sàn:' : 'Floor reinforcement surcharge:'}</span>
                        <span>+${currentQuote.dimSurcharge}</span>
                      </div>
                    )}
                    <div className="border-t border-stone-200 pt-2 flex justify-between font-bold text-base text-stone-900">
                      <span>{lang === 'vi' ? 'Tổng số tiền thanh toán khi được duyệt:' : 'Total due upon approval:'}</span>
                      <span className="text-emerald-700 font-mono">${discountedFirstPayment.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-amber-100/60 p-2.5 text-[11px] text-amber-950 space-y-1">
                    <p className="font-medium">
                       {lang === 'vi' ? 'Cam kết minh bạch của StorageHub:' : 'StorageHub Transparency Guarantee:'}
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                      <li>{lang === 'vi' ? 'Khoảng giữ chỗ được bảo lưu 15 phút trong khi thanh toán cọc giữ chỗ.' : 'Hold reservation is active for 15 minutes during deposit payment.'}</li>
                      <li>{lang === 'vi' ? 'Chưa phát sinh bất kỳ khoản phí hay hồ sơ thuê active nào trước khi bạn thanh toán cọc.' : 'No active rental or invoice created until you pay deposit and accept handover.'}</li>
                      <li>{lang === 'vi' ? `Tiền cọc bảo đảm ($${currentQuote.depositAmount}) sẽ được hoàn trả 100% trong vòng 24 giờ sau khi nghiệm thu trả kho nguyên vẹn.` : `Security deposit ($${currentQuote.depositAmount}) refunded 100% within 24 hours of clean return.`}</li>
                    </ul>
                  </div>
                </div>
              )
            })()}

            {validationViolation && (
              <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-xs space-y-3 fade-in">
                <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                  <span></span>
                  <span>{lang === 'vi' ? 'Không Thể Đặt Giữ Kho (Vi Phạm Quy Chuẩn Vật Lý)' : 'Reservation Blocked (Physical Incompatibility)'}</span>
                </div>
                <p className="text-red-700 leading-relaxed font-medium">
                  {validationViolation.reason}
                </p>

                {validationViolation.suggestedUnitTypeId && (
                  <div className="rounded-lg border border-amber-300 bg-amber-100/80 p-3 space-y-2 text-amber-950">
                    <p className="font-bold flex items-center gap-1.5">
                      <span></span>
                      <span>{lang === 'vi' ? 'Hệ thống đề xuất nâng cấp loại gian kho phù hợp:' : 'Recommended Storage Upgrade:'}</span>
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      {lang === 'vi'
                        ? `Kiện hàng của bạn cần thể tích kho lớn hơn hoặc chiều dài rộng hơn. Hãy chuyển sang gian kho `
                        : `Your declared cargo requires larger volume or length. Upgrade to `}
                      <b className="text-amber-900 font-bold">{validationViolation.suggestedUnitTypeName} (~{validationViolation.suggestedVolumeM3} m³)</b>.
                    </p>
                    <div className="pt-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          const targetTypePrefix = validationViolation.suggestedUnitTypeName?.split(' ')[0] || ''
                          const upgradeType = unitTypes.find(
                            ut => ut.id === validationViolation.suggestedUnitTypeId ||
                                  ut.name.toLowerCase().includes(targetTypePrefix.toLowerCase())
                          )
                          if (upgradeType && selectedTarget) {
                            handleStartReservation(selectedTarget.facility, upgradeType)
                            setValidationViolation(null)
                            showToast(lang === 'vi' ? `Đã chuyển sang cỡ kho ${upgradeType.name}!` : `Upgraded to ${upgradeType.name}!`)
                          } else {
                            showToast(lang === 'vi' ? 'Không tìm thấy cỡ kho nâng cấp phù hợp.' : 'No upgrade size found.')
                          }
                        }}
                      >
                         {lang === 'vi' ? `Chuyển ngay sang ${validationViolation.suggestedUnitTypeName}` : `Upgrade to ${validationViolation.suggestedUnitTypeName}`}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
              <Button variant="outline" onClick={() => { setBookOpen(false); setValidationViolation(null); }}>{lang === 'vi' ? 'Hủy' : 'Cancel'}</Button>
              <Button onClick={confirmReservation}>
                {lang === 'vi' ? 'Kiểm tra điều kiện & Đặt giữ kho' : 'Validate & Reserve Unit'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL 3: EMAIL VERIFICATION SIMULATION (P0.4) ─────── */}
      <Modal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title={lang === 'vi' ? 'Xác Nhận Địa Chỉ Email Giữ Kho' : 'Verify Email Address'}
      >
        {activeHoldForEmail && (
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900">
              <p className="font-bold text-sm mb-1"> {lang === 'vi' ? 'Email xác minh đã được gửi tới:' : 'Verification email sent to:'} {activeHoldForEmail.customerEmail}</p>
              <p>{lang === 'vi' ? 'Để tránh tình trạng giữ kho ảo, hệ thống yêu cầu xác nhận email trước khi nhân viên tiếp nhận phê duyệt hồ sơ.' : 'To prevent fictitious bookings, email verification is required.'}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 block">
                {lang === 'vi' ? 'Mã token xác minh (Trích xuất từ đường link trong email):' : 'Verification Token:'}
              </label>
              <input
                value={inputToken}
                onChange={e => setInputToken(e.target.value)}
                className="w-full font-mono text-xs border border-stone-300 rounded-lg p-2.5 bg-stone-50"
              />
              <p className="text-[11px] text-stone-400">
                {lang === 'vi' ? 'Token có hiệu lực trong 24 giờ. Hết hạn sẽ tự động giải phóng gian kho.' : 'Token is single-use and expires in 24 hours.'}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-stone-100 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resendHoldEmail(activeHoldForEmail.id)
                  showToast(lang === 'vi' ? 'Đã cấp lại mã token và gửi email mới!' : 'New verification token generated!')
                }}
              >
                 {lang === 'vi' ? 'Gửi lại email' : 'Resend email'}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEmailModalOpen(false)}>
                  {lang === 'vi' ? 'Để sau' : 'Later'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const success = verifyHoldEmail(activeHoldForEmail.id, inputToken)
                    if (success) {
                      setEmailModalOpen(false)
                      showToast(lang === 'vi' ? 'Email đã được xác nhận thành công! Hồ sơ đã gửi tới nhân viên ca trực.' : 'Email verified! Application forwarded to facility staff.')
                    } else {
                      showToast(lang === 'vi' ? 'Mã token không hợp lệ hoặc đã hết hạn!' : 'Invalid or expired token!')
                    }
                  }}
                >
                   {lang === 'vi' ? 'Xác thực ngay' : 'Verify now'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL 4: PAY DEPOSIT (AFTER STAFF REVIEW) ─────────── */}
      <Modal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={lang === 'vi' ? 'Thanh Toán Cọc Giữ Chỗ' : 'Pay Reservation Deposit'}
      >
        {activeHoldForPayment && (() => {
          const originalRent = activeHoldForPayment.originalMonthlyRate ?? activeHoldForPayment.quote.baseMonthlyPrice
          const depositAmt = activeHoldForPayment.quote.depositAmount
          const totalDue = originalRent + depositAmt
          const reservationDeposit = Math.round(totalDue * 0.2 * 100) / 100

          return (
            <div className="space-y-4">
              {/* Price Snapshot & Detailed Breakdown */}
              <div className="rounded-lg bg-stone-50 border border-stone-200 p-4 text-xs space-y-2.5">
                <div className="flex justify-between items-start border-b border-stone-200 pb-2">
                  <div>
                    <p className="font-bold text-sm text-stone-900">{lang === 'vi' ? `Thanh toán cho đơn giữ kho ${activeHoldForPayment.id}` : `Payment for ${activeHoldForPayment.id}`}</p>
                    <p className="text-stone-500">{lang === 'vi' ? 'Loại kho' : 'Unit type'}: <b>{activeHoldForPayment.unitTypeName}</b> · {lang === 'vi' ? 'Cơ sở' : 'Facility'}: <b>{activeHoldForPayment.facilityName}</b></p>
                  </div>
                  <Badge variant="info">{activeHoldForPayment.unitTypeName || 'Standard'}</Badge>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-stone-600">{lang === 'vi' ? 'Tiền thuê tháng đầu:' : 'First month rent:'}</span>
                    <span className="font-semibold text-stone-900">${originalRent}</span>
                  </div>

                  <div className="flex justify-between border-t border-stone-200 pt-1.5">
                    <span className="text-stone-600">{lang === 'vi' ? 'Tiền cọc bảo đảm (Hoàn lại 100% khi trả kho):' : 'Security deposit (100% refundable):'}</span>
                    <span className="font-semibold text-stone-900">${depositAmt}</span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-emerald-700 pt-2 border-t border-stone-300">
                    <span>{lang === 'vi' ? 'Tổng ban đầu (chưa thu hết):' : 'Total initial amount (not yet due):'}</span>
                    <span className="font-mono">${totalDue}</span>
                  </div>
                  <div className="flex justify-between font-bold text-amber-800"><span>{lang === 'vi' ? 'Cọc giữ chỗ cần thanh toán (20%):' : 'Reservation deposit due (20%):'}</span><span>${reservationDeposit}</span></div>
                  <div className="flex justify-between"><span>{lang === 'vi' ? 'Còn lại sau khi ký hợp đồng giấy:' : 'Remaining after paper contract signing:'}</span><span>${Math.max(0, totalDue - reservationDeposit)}</span></div>
                </div>
              </div>

              <Select
                label={lang === 'vi' ? 'Phương thức thanh toán' : 'Payment Method'}
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                <option value="Chuyển khoản VietQR">Chuyển khoản VietQR (Khuyên dùng)</option>
                <option value="Thẻ tín dụng Visa/MasterCard">Thẻ tín dụng Visa/MasterCard</option>
                <option value="Ví điện tử MoMo / ZaloPay">Ví điện tử MoMo / ZaloPay</option>
              </Select>

              <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
                <Button variant="outline" onClick={() => setPayModalOpen(false)}>{lang === 'vi' ? 'Hủy' : 'Cancel'}</Button>
                <Button
                  onClick={() => {
                    payStorageHold(activeHoldForPayment.id, paymentMethod)
                    const targetHold: StorageHold = {
                      ...activeHoldForPayment,
                      status: 'deposit_paid',
                      reservationDepositAmount: reservationDeposit,
                      remainingAmount: Math.max(0, totalDue - reservationDeposit),
                      appointmentDate: undefined,
                      appointmentTime: undefined,
                      quote: { ...activeHoldForPayment.quote, totalFirstPayment: totalDue },
                      payment: {
                        ...activeHoldForPayment.payment,
                        amount: reservationDeposit,
                        status: 'paid',
                        method: paymentMethod,
                        transactionId: `TX-${Date.now().toString().slice(-8)}`,
                        paidAt: new Date().toISOString()
                      }
                    }
                    setPayModalOpen(false)
                    setActiveHoldForContract(targetHold)
                    setContractTab('contract')
                    setContractEmailModalOpen(true)
                    showToast(lang === 'vi' ? 'Đã ghi nhận cọc giữ chỗ; phần còn lại thu sau khi ký hợp đồng giấy.' : 'Reservation deposit recorded; balance is due after paper contract signing.')
                  }}
                >
                   {lang === 'vi' ? 'Xác nhận thanh toán' : 'Confirm Payment'}
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ── MODAL 4B: PAPER CONTRACT & PAYMENT RECEIPTS ─── */}
      <Modal
        open={contractEmailModalOpen}
        onClose={() => setContractEmailModalOpen(false)}
        title={lang === 'vi' ? 'Hợp đồng thuê & biên nhận' : 'Rental contract & receipts'}
        size="xl"
      >
        {activeHoldForContract && (
          <div className="space-y-4">
            {/* Notification alert */}
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-full shrink-0">
              </div>
              <div className="text-xs text-emerald-950 space-y-0.5">
                <p className="font-bold text-sm text-emerald-900">
                  {lang === 'vi' ? 'Hồ sơ thanh toán và điều khoản của ' : 'Payment and terms record for '}
                  <span className="underline font-mono">{activeHoldForContract.customerEmail}</span>
                </p>
                <p className="text-emerald-800">
                  {lang === 'vi'
                    ? 'Đã ghi nhận cọc giữ chỗ. Hợp đồng giấy chỉ xuất hiện sau khi hai bên ký và nhân viên lưu bản scan; phần còn lại thu tại cơ sở.'
                    : 'Reservation deposit recorded. The signed paper contract appears after on-site signing and scan upload; the balance is paid on site.'}
                </p>
              </div>
            </div>

            {/* Tab switch */}
            <div className="flex border-b border-stone-200">
              <button
                type="button"
                onClick={() => setContractTab('contract')}
                className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  contractTab === 'contract'
                    ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <span>{lang === 'vi' ? 'Hợp Đồng Thuê' : 'Rental Contract'}</span>
              </button>
              <button
                type="button"
                onClick={() => setContractTab('receipt')}
                className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  contractTab === 'receipt'
                    ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <span>{lang === 'vi' ? 'Biên nhận & Thanh toán' : 'Receipts & Payments'}</span>
              </button>
            </div>

            {/* Tab 1: Official Digital Lease Agreement */}
            {contractTab === 'contract' && <div className="rounded-lg border border-stone-200 bg-white p-4 text-xs space-y-2">
              {(() => {
                const signed = contracts.find(c => c.reservationId === activeHoldForContract.id && c.status === 'SIGNED')
                return signed ? <>
                  <p className="font-bold text-emerald-800">{lang === 'vi' ? 'Đã ký hợp đồng' : 'Contract signed'}</p>
                  <p>{lang === 'vi' ? 'Số hợp đồng' : 'Contract number'}: {signed.contractNumber}</p>
                  <p>{lang === 'vi' ? 'Ngày ký' : 'Signed'}: {signed.signedAt} · {lang === 'vi' ? 'Hiệu lực' : 'Term'}: {signed.startDate} – {signed.endDate}</p>
                  <p>{lang === 'vi' ? 'Bản scan' : 'Signed scan'}: {signed.scannedFileName}</p>
                  <div className="flex gap-2"><a href={signed.scannedFileUrl} target="_blank" rel="noopener noreferrer" className="underline text-amber-800">{lang === 'vi' ? 'Xem hợp đồng đã ký' : 'View signed contract'}</a><a href={signed.scannedFileUrl} download={signed.scannedFileName} className="underline text-amber-800">{lang === 'vi' ? 'Tải bản scan' : 'Download scan'}</a></div>
                </> : <>
                  <p className="font-bold text-amber-800">{activeHoldForContract.status === 'deposit_paid'
                    ? (lang === 'vi' ? 'Chờ khách đặt lịch hẹn' : 'Awaiting customer appointment')
                    : (lang === 'vi' ? 'Chờ ký hợp đồng giấy' : 'Awaiting paper contract signing')}</p>
                  <p>{lang === 'vi' ? 'Lịch hẹn' : 'Appointment'}: {activeHoldForContract.status !== 'deposit_paid' && activeHoldForContract.appointmentDate ? `${activeHoldForContract.appointmentDate} ${activeHoldForContract.appointmentTime ?? ''}` : (lang === 'vi' ? 'Chưa đặt lịch' : 'Not scheduled yet')}</p>
                  <p>{lang === 'vi' ? 'Địa điểm' : 'Location'}: {activeHoldForContract.facilityName}</p>
                  <p>{lang === 'vi' ? 'Cọc giữ chỗ đã thanh toán (20%)' : 'Reservation deposit paid (20%)'}: ${activeHoldForContract.reservationDepositAmount ?? activeHoldForContract.payment.amount}</p>
                  <p>{lang === 'vi' ? 'Số tiền còn lại' : 'Remaining balance'}: ${activeHoldForContract.remainingAmount ?? Math.max(0, activeHoldForContract.quote.totalFirstPayment - activeHoldForContract.payment.amount)}</p>
                  <p>{lang === 'vi' ? 'Chưa có PDF hợp đồng đã ký.' : 'No signed contract scan is available yet.'}</p>
                </>
              })()}
            </div>}
            {contractTab === 'receipt' && <div className="rounded-lg border border-stone-200 bg-white p-4 text-xs space-y-2">
              <p className="font-bold">{lang === 'vi' ? 'Biên nhận & Thanh toán' : 'Receipts & Payments'} · {activeHoldForContract.id}</p>
              <p>{lang === 'vi' ? 'Cọc giữ chỗ đã thu' : 'Reservation deposit paid'}: ${activeHoldForContract.reservationDepositAmount ?? activeHoldForContract.payment.amount}</p>
              <p>{lang === 'vi' ? 'Còn lại cần thu sau ký hợp đồng' : 'Balance due after signing'}: ${activeHoldForContract.remainingAmount ?? Math.max(0, activeHoldForContract.quote.totalFirstPayment - activeHoldForContract.payment.amount)}</p>
              <p>{lang === 'vi' ? 'Lịch hẹn' : 'Appointment'}: {activeHoldForContract.status !== 'deposit_paid' && activeHoldForContract.appointmentDate ? `${activeHoldForContract.appointmentDate} ${activeHoldForContract.appointmentTime ?? ''}` : (lang === 'vi' ? 'Chưa đặt lịch' : 'Not scheduled yet')} · {activeHoldForContract.facilityName}</p>
              <p>{lang === 'vi' ? 'Booking / loại kho' : 'Booking / unit type'}: {activeHoldForContract.id} · {activeHoldForContract.unitTypeName ?? '—'}</p>
              {payments.filter(p => p.reservationId === activeHoldForContract.id).map(p => <p key={p.id}>{p.type === 'RESERVATION_DEPOSIT' ? (lang === 'vi' ? 'Cọc giữ chỗ' : 'Reservation deposit') : (lang === 'vi' ? 'Thanh toán còn lại' : 'Remaining payment')}: ${p.amount} · {p.id} · {p.status}</p>)}
            </div>}
          </div>
        )}
      </Modal>

      {/* ── MODAL 5: SCHEDULE CHECK-IN ────────────────────────── */}
      <Modal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={lang === 'vi' ? 'Đặt Lịch Hẹn Bàn Giao & Check-in' : 'Schedule Move-in Walkthrough'}
      >
        {activeHoldForSchedule && (
          <div className="space-y-4">
            <p className="text-xs text-stone-600">
              {lang === 'vi' ? 'Chọn ngày giờ bạn sẽ đến cơ sở để cùng nhân viên đối chiếu CCCD, cân đo hàng hóa thực tế và nhận mã PIN mở cửa:' : 'Pick a time to visit the facility, verify ID, measure actual cargo and receive your gate access code:'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={lang === 'vi' ? 'Ngày hẹn' : 'Appointment Date'}
                type="date"
                value={appointmentDate}
                min={new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })}
                onChange={e => setAppointmentDate(e.target.value)}
              />
              <Select
                label={lang === 'vi' ? 'Khung giờ' : 'Time Slot'}
                value={appointmentTime}
                onChange={e => setAppointmentTime(e.target.value)}
              >
                <option value="">{lang === 'vi' ? 'Chọn khung giờ' : 'Choose a time slot'}</option>
                <option value="09:00 AM">09:00 AM - 10:00 AM</option>
                <option value="11:00 AM">11:00 AM - 12:00 PM</option>
                <option value="02:00 PM">02:00 PM - 03:00 PM</option>
                <option value="04:00 PM">04:00 PM - 05:00 PM</option>
              </Select>
            </div>

            <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
              <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>{lang === 'vi' ? 'Hủy' : 'Cancel'}</Button>
              <Button
                disabled={!appointmentDate || !appointmentTime}
                onClick={() => {
                  try {
                    scheduleCheckIn(activeHoldForSchedule.id, appointmentDate, appointmentTime)
                    setScheduleModalOpen(false)
                    showToast(lang === 'vi' ? `Đã lên lịch check-in vào ${appointmentTime} ngày ${appointmentDate}!` : 'Appointment confirmed!')
                  } catch (error) {
                    showToast(error instanceof Error ? error.message : 'Không thể đặt lịch hẹn.')
                  }
                }}
              >
                 {lang === 'vi' ? 'Xác nhận lịch hẹn' : 'Confirm Slot'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL 6: REQUEST RETURN ───────────────────────────── */}
      <Modal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        title={lang === 'vi' ? 'Yêu Cầu Thanh Lý & Trả Kho' : 'Request Unit Move-Out'}
      >
        {activeRentalForReturn && (
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              <p className="font-semibold">{lang === 'vi' ? `Gian kho ${activeRentalForReturn.unitId} (${activeRentalForReturn.facilityName})` : `Unit ${activeRentalForReturn.unitId}`}</p>
              <p>{lang === 'vi' ? 'Tiền cọc bảo đảm sẽ được hoàn trả đầy đủ sau khi nhân viên nghiệm thu kho không có hư hại.' : 'Your security deposit will be refunded after inspection confirms clean condition.'}</p>
            </div>

            <Input
              label={lang === 'vi' ? 'Ngày dự kiến dọn đồ & bàn giao' : 'Planned move-out date'}
              type="date"
              value={returnTargetDate}
              onChange={e => setReturnTargetDate(e.target.value)}
            />

            <Select
              label={lang === 'vi' ? 'Lý do kết thúc' : 'Reason for move-out'}
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
            >
              <option value="Hết nhu cầu lưu trữ">Hết nhu cầu lưu trữ</option>
              <option value="Chuyển sang nhà/văn phòng mới">Chuyển sang nhà/văn phòng mới</option>
              <option value="Đổi sang gian kho kích thước khác">Đổi sang gian kho kích thước khác</option>
              <option value="Khác">Lý do khác</option>
            </Select>

            <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
              <Button variant="outline" onClick={() => setReturnModalOpen(false)}>{lang === 'vi' ? 'Hủy' : 'Cancel'}</Button>
              <Button
                onClick={() => {
                  requestReturn(activeRentalForReturn.id, returnTargetDate, user, returnReason)
                  setReturnModalOpen(false)
                  showToast(lang === 'vi' ? 'Yêu cầu trả kho đã được tiếp nhận. Nhân viên sẽ chuẩn bị biên bản nghiệm thu!' : 'Move-out request registered!')
                }}
              >
                 {lang === 'vi' ? 'Gửi yêu cầu trả kho' : 'Submit Move-Out'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL: REQUEST RENEWAL ────────────────────────────── */}
      <Modal
        open={renewalModalOpen}
        onClose={() => setRenewalModalOpen(false)}
        title={lang === 'vi' ? 'Yêu Cầu Gia Hạn Hợp Đồng Thuê' : 'Request Rental Renewal'}
      >
        {activeRentalForRenewal && (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-950 space-y-1">
              <p className="font-semibold">{lang === 'vi' ? `Gian kho ${activeRentalForRenewal.unitId} (${activeRentalForRenewal.facilityName})` : `Unit ${activeRentalForRenewal.unitId}`}</p>
              <p>{lang === 'vi' ? `Hạn hợp đồng hiện tại: ${activeRentalForRenewal.endDate}. Giá thuê: $${activeRentalForRenewal.monthlyRate}/tháng.` : `Current end date: ${activeRentalForRenewal.endDate}. Rate: $${activeRentalForRenewal.monthlyRate}/mo.`}</p>
              <p className="text-[11px] text-blue-800">
                {lang === 'vi' ? 'Facility Manager sẽ kiểm tra xung đột lịch đặt trước khi phê duyệt gia hạn cho bạn.' : 'Facility Manager will verify schedule conflicts before approving your renewal.'}
              </p>
            </div>

            <Input
              label={lang === 'vi' ? 'Ngày kết thúc mới mong muốn' : 'Requested new end date'}
              type="date"
              value={renewalTargetDate}
              onChange={e => setRenewalTargetDate(e.target.value)}
            />

            <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
              <Button variant="outline" onClick={() => setRenewalModalOpen(false)}>{lang === 'vi' ? 'Hủy' : 'Cancel'}</Button>
              <Button
                disabled={!renewalTargetDate || renewalTargetDate <= activeRentalForRenewal.endDate}
                onClick={() => {
                  try {
                    requestRenewal(activeRentalForRenewal.id, renewalTargetDate, user)
                    setRenewalModalOpen(false)
                    showToast(lang === 'vi' ? 'Đã gửi yêu cầu gia hạn tới Facility Manager!' : 'Renewal request submitted to Facility Manager!')
                  } catch (err: any) {
                    showToast(err?.message || 'Error requesting renewal')
                  }
                }}
              >
                 {lang === 'vi' ? 'Gửi yêu cầu gia hạn' : 'Submit Renewal'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL 7: SUPPORT TICKET CONVERSATION ───────────────── */}
      <Modal
        open={conversationOpen}
        onClose={() => setConversationOpen(false)}
        title={lang === 'vi' ? 'Trao Đổi Trực Tuyến Hỗ Trợ' : 'Support Ticket'}
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#292a27] p-4 text-white">
              <div className="flex justify-between items-center text-xs font-mono text-[#e9a12c]">
                <span>{selectedTicket.id}</span>
                <span>{selectedTicket.category}</span>
              </div>
              <h3 className="font-bold text-base mt-1 text-stone-100">{selectedTicket.subject}</h3>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {selectedTicket.messages.map(msg => (
                <div key={msg.id} className={`p-3 rounded-lg text-xs ${msg.role === 'customer' ? 'bg-amber-100 text-amber-950 ml-6' : 'bg-stone-100 text-stone-800 mr-6'}`}>
                  <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                    <b>{msg.sender}</b>
                    <span>{msg.time}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-100 space-y-2">
              <textarea
                rows={2}
                placeholder={lang === 'vi' ? 'Nhập tin nhắn của bạn...' : 'Type your message...'}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="w-full border border-stone-300 rounded-lg p-2 text-xs"
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  disabled={!replyText.trim()}
                  onClick={() => {
                    respondSupportTicket(selectedTicket.id, replyText, selectedTicket.status, user)
                    setReplyText('')
                    showToast(lang === 'vi' ? 'Đã gửi tin nhắn!' : 'Message dispatched!')
                  }}
                >
                  {lang === 'vi' ? 'Gửi tin nhắn' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL 8: CREATE TICKET ─────────────────────────────── */}
      <Modal
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        title={lang === 'vi' ? 'Tạo Yêu Cầu Hỗ Trợ Mới' : 'Create New Support Request'}
      >
        <div className="space-y-4">
          <Input
            label={lang === 'vi' ? 'Tiêu đề yêu cầu' : 'Subject'}
            value={ticketSubject}
            onChange={e => setTicketSubject(e.target.value)}
            placeholder={lang === 'vi' ? 'Tóm tắt sự cố (ví dụ: Khóa cổng không nhận mã PIN)' : 'Summary'}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select label={lang === 'vi' ? 'Phân loại' : 'Category'} value={ticketCategory} onChange={e => setTicketCategory(e.target.value)}>
              <option>Access & Entry</option>
              <option>Billing & Invoices</option>
              <option>Unit Condition</option>
              <option>General Inquiry</option>
            </Select>
            <Select label={lang === 'vi' ? 'Mức độ ưu tiên' : 'Priority'} value={ticketPriority} onChange={e => setTicketPriority(e.target.value as any)}>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Khẩn cấp</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">{lang === 'vi' ? 'Chi tiết' : 'Description'}</label>
            <textarea
              rows={3}
              value={ticketDescription}
              onChange={e => setTicketDescription(e.target.value)}
              className="w-full border border-stone-300 rounded-lg p-2 text-xs"
              placeholder={lang === 'vi' ? 'Mô tả vấn đề bạn đang gặp phải...' : 'Details...'}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
            <Button variant="outline" onClick={() => setTicketOpen(false)}>{lang === 'vi' ? 'Hủy' : 'Cancel'}</Button>
            <Button
              disabled={!ticketSubject.trim()}
              onClick={() => {
                createSupportTicket({
                  customer: user.name,
                  email: user.email,
                  subject: ticketSubject.trim(),
                  category: ticketCategory,
                  priority: ticketPriority,
                  status: 'open',
                  facility: activeRentals[0]?.facilityName || 'Downtown Storage',
                  unit: activeRentals[0]?.unitId || 'A-104'
                }, ticketDescription || ticketSubject)
                setTicketOpen(false)
                setTicketSubject('')
                setTicketDescription('')
                showToast(lang === 'vi' ? 'Đã gửi yêu cầu hỗ trợ tới ban quản lý!' : 'Ticket submitted!')
              }}
            >
              {lang === 'vi' ? 'Gửi yêu cầu' : 'Submit'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
