import { useState, useEffect } from 'react'
import Layout, { getInitialPage, Icon } from '../../components/Layout'
import { Badge, Button, Card, StatCard, Table, Thead, Tbody, Th, Td, Tr, SectionHeader, Modal, Tabs, Avatar, Input, Select } from '../../components/ui'
import ProfileView from '../ProfileView'
import { useLanguage } from '../../i18n/LanguageContext'
import type { User } from '../../types'
import { useStorageHub, normalizeCheckin } from '../../store/StorageHubContext'
import type { StorageHold, CheckInRecord, ReturnCase, DamageClassification } from '../../types/storageHub'
import { TASKS, POLICIES, type TicketItem } from "../../data/demoDatabase"

const taskTitleVi: Record<string, string> = {
  'task-1': 'Kiểm tra hệ thống cảm biến nhiệt độ & độ ẩm Tầng 2',
  'task-2': 'Nghiệm thu gian kho B-04 chuẩn bị thủ tục trả kho cho khách',
  'task-3': 'Hỗ trợ khách hàng đổi mã PIN và kích hoạt thẻ từ cổng',
  'task-4': 'Đi tuần tra kiểm tra an ninh toàn bộ khuôn viên kho',
  'task-5': 'Rà soát danh sách chốt khóa kho nợ quá hạn'
}

const statusLabelMap: Record<string, Record<string, string>> = {
  vi: {
    CREATED: 'Đã tạo đơn',
    DEPOSIT_PAID: 'Đã cọc giữ chỗ',
    UNIT_RESERVED: 'Đã phân kho',
    READY_FOR_CHECKIN: 'Sẵn sàng nhận kho',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã hủy',
    EXPIRED: 'Đã hết hạn / No-show',
    confirmed: 'Đã xác nhận',
    deposit_paid: 'Đã cọc giữ chỗ',
    contract_signed: 'Đã ký hợp đồng',
    fully_paid: 'Đã thanh toán đủ',
    unit_assigned: 'Đã phân kho',
    pending: 'Chờ duyệt',
    review_required: 'Chờ duyệt ngoại lệ',
    awaiting_deposit: 'Chờ đóng tiền cọc',
    awaiting_email: 'Chờ xác nhận email',
    awaiting_review: 'Chờ duyệt ngoại lệ',
    awaiting_payment: 'Chờ đóng tiền cọc',
    approved: 'Đã duyệt hồ sơ',
    scheduled: 'Đã lên lịch',
    checked_in: 'Đã bàn giao kho',
    rejected: 'Đã từ chối',
    expired: 'Đã hết hạn',
    completed: 'Hoàn tất',
    inspected: 'Đã nghiệm thu',
    refunded: 'Đã hoàn cọc',
    open: 'Chờ xử lý',
    'in-progress': 'Đang xử lý',
    resolved: 'Đã giải quyết',
    closed: 'Đã đóng',
    high: 'Khẩn cấp',
    medium: 'Trung bình',
    low: 'Tiêu chuẩn',
  },
  en: {
    CREATED: 'Created',
    DEPOSIT_PAID: 'Deposit Paid',
    UNIT_RESERVED: 'Unit Reserved',
    READY_FOR_CHECKIN: 'Ready for Check-in',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired / No-show',
    confirmed: 'Confirmed',
    deposit_paid: 'Deposit Paid',
    contract_signed: 'Contract Signed',
    fully_paid: 'Fully Paid',
    unit_assigned: 'Unit Assigned',
    pending: 'Pending',
    review_required: 'Review Required',
    awaiting_deposit: 'Awaiting Deposit',
    awaiting_email: 'Awaiting Email',
    awaiting_review: 'Review Required',
    awaiting_payment: 'Awaiting Deposit',
    approved: 'Approved',
    scheduled: 'Scheduled',
    checked_in: 'Checked In',
    rejected: 'Rejected',
    expired: 'Expired',
    completed: 'Completed',
    inspected: 'Inspected',
    refunded: 'Refunded',
    open: 'Open',
    'in-progress': 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }
}

export default function StaffApp({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { lang, t } = useLanguage()
  const {
    holds,
    contracts,
    payments,
    checkins,
    returns,
    units,
    tickets,
    config,
    accessCredentials,
    reviewStorageHold,
    staffReviewReservation,
    completeCheckIn,
    signPaperContract,
    recordRemainingPayment,
    expireReservation,
    cancelReservation,
    completeReturnInspection,
    respondSupportTicket
  } = useStorageHub()

  const NAV = [
    { id: 'tasks', label: lang === 'vi' ? 'Nhiệm vụ trong ngày' : 'Daily Tasks', icon: Icon.tasks, group: lang === 'vi' ? 'Ca làm việc' : 'Work Queue' },
    { id: 'reservations', label: lang === 'vi' ? 'Xác nhận đặt giữ kho' : 'Reservations', icon: Icon.calendar, group: lang === 'vi' ? 'Dịch vụ khách hàng' : 'Customer Service' },
    { id: 'checkin', label: lang === 'vi' ? 'Bàn giao & Nhận kho' : 'Check-in / Handover', icon: Icon.truck, group: lang === 'vi' ? 'Dịch vụ khách hàng' : 'Customer Service' },
    { id: 'return', label: lang === 'vi' ? 'Nghiệm thu trả kho' : 'Return Inspection', icon: Icon.clipboard, group: lang === 'vi' ? 'Dịch vụ khách hàng' : 'Customer Service' },
    { id: 'support', label: lang === 'vi' ? 'Hỗ trợ khách hàng' : 'Support Tickets', icon: Icon.support, group: lang === 'vi' ? 'Chăm sóc & Hỗ trợ' : 'Support' },
    { id: 'policies', label: lang === 'vi' ? 'Quy chế vận hành' : 'Operating Policies', icon: Icon.policy, group: lang === 'vi' ? 'Chăm sóc & Hỗ trợ' : 'Support' },
  ]

  const [page, setPage] = useState(() => getInitialPage(NAV, 'tasks'))
  const [tasks, setTasks] = useState(TASKS)

  // Modals & Selected items
  const [inspectModal, setInspectModal] = useState(false)
  const [checkinModal, setCheckinModal] = useState(false)
  const [holdModal, setHoldModal] = useState(false)
  const [selectedHold, setSelectedHold] = useState<StorageHold | null>(null)
  const [selectedCheckin, setSelectedCheckin] = useState<CheckInRecord | null>(null)
  const [selectedReturn, setSelectedReturn] = useState<ReturnCase | null>(null)

  // P0.5: Check-in Checklist & Handover state
  const [chkIdVerified, setChkIdVerified] = useState(false)
  const [chkUnitWalkthrough, setChkUnitWalkthrough] = useState(false)
  const [chkAccessCodeIssued, setChkAccessCodeIssued] = useState(false)

  // Remaining payment form state
  const [remPayMethod, setRemPayMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH')
  const [remPayRef, setRemPayRef] = useState('')
  const [remPayProof, setRemPayProof] = useState('')

  const [goodsCount, setGoodsCount] = useState(0)
  const [goodsCategory, setGoodsCategory] = useState('')
  const [goodsWeight, setGoodsWeight] = useState(0)
  const [goodsNotes, setGoodsNotes] = useState('')
  const [handoverPhoto, setHandoverPhoto] = useState('')
  const [handoverItems, setHandoverItems] = useState({ key: false, card: false })
  const [checkinCustomerConfirmed, setCheckinCustomerConfirmed] = useState(false)
  const [contractNumber, setContractNumber] = useState('')
  const [contractSignedAt, setContractSignedAt] = useState('')
  const [contractStartAt, setContractStartAt] = useState('')
  const [contractEndAt, setContractEndAt] = useState('')
  const [contractFileName, setContractFileName] = useState('')
  const [contractFileData, setContractFileData] = useState('')
  const [actConditionNotes, setActConditionNotes] = useState('Kho sạch, đèn và khóa thông minh hoạt động tốt. Kiện hàng nguyên niêm phong.')

  // P0.6: Return Inspection form state
  const [invMatch, setInvMatch] = useState<'match' | 'missing' | 'excess'>('match')
  const [damageClass, setDamageClass] = useState<DamageClassification>('no_damage')
  const [damageFee, setDamageFee] = useState(0)
  const [outstandingFee, setOutstandingFee] = useState(0)
  const [cleaningFee, setCleaningFee] = useState(0)
  const [lostItemFee, setLostItemFee] = useState(0)
  const [overdueFee, setOverdueFee] = useState(0)
  const [returnedItems, setReturnedItems] = useState({ key: false, card: false, lock: false })
  const [returnCustomerConfirmed, setReturnCustomerConfirmed] = useState(false)
  const [returnPhoto, setReturnPhoto] = useState('')
  const [returnStaffNotes, setReturnStaffNotes] = useState('Kho trả đúng hạn, sạch sẽ không hư hại.')

  // Support Tickets state
  const [ticketTab, setTicketTab] = useState('Open')
  const [selectedStaffTicket, setSelectedStaffTicket] = useState<TicketItem | null>(null)
  const [respondModal, setRespondModal] = useState(false)
  const [staffReplyText, setStaffReplyText] = useState('')
  const [ticketNewStatus, setTicketNewStatus] = useState<TicketItem['status']>('in-progress')

  const [toast, setToast] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatCountdown = (expiresAt?: string) => {
    if (!expiresAt) return { text: '--:--', isUrgent: false, isExpired: false }
    const diff = Math.floor((new Date(expiresAt).getTime() - now) / 1000)
    if (diff <= 0) return { text: lang === 'vi' ? '00:00 (Hết hạn)' : '00:00 (Expired)', isUrgent: true, isExpired: true }
    const mins = Math.floor(diff / 60)
    const secs = diff % 60
    const text = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return { text, isUrgent: diff <= 300, isExpired: false }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const s = (v: string, map: Record<string, string>) => {
    const label = statusLabelMap[lang]?.[v] || (v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' '))
    return <Badge variant={map[v] ?? 'muted'}>{label}</Badge>
  }

  // Facility Scoping (P1.4): staff sees items belonging to user.facility
  const scopedFacility = user.facility && user.facility !== 'All facilities' ? user.facility : null
  const scopedHolds = holds.filter(h => !scopedFacility || h.facilityName === scopedFacility)
  const scopedCheckins = checkins.map(normalizeCheckin).filter(c => {
    const hold = holds.find(h => h.id === c.holdId)
    return !scopedFacility || hold?.facilityName === scopedFacility || c.facilityId === 'fac-001'
  })
  const scopedReturns = returns.filter(r => !scopedFacility || r.facilityName === scopedFacility)
  const scopedTickets = tickets.filter(t => !scopedFacility || t.facility === scopedFacility)

  const completedCount = tasks.filter(t => t.done).length
  const totalCount = tasks.length

  // Helper when opening checkin modal
  const openCheckinProcess = (rawCheckin: CheckInRecord) => {
    try {
      const c = normalizeCheckin(rawCheckin)
      const checklist = c.checklist || {}
      const hold = holds.find(h => h.id === c.holdId)
      setSelectedCheckin(c)
      setChkIdVerified(Boolean(checklist.identityVerified))
      setChkUnitWalkthrough(Boolean(checklist.unitWalkthrough))
      setChkAccessCodeIssued(false)
      setRemPayMethod('CASH')
      setRemPayRef(`PT-${Date.now().toString().slice(-6)}`)
      setRemPayProof('')
      setGoodsCount(hold?.goods.packageCount ?? 0)
      setGoodsCategory(hold?.goods.category ?? '')
      setGoodsWeight(hold?.goods.weightKg ?? 0)
      setGoodsNotes(hold?.goods.notes ?? '')
      setHandoverPhoto('')
      setHandoverItems({ key: false, card: false })
      setCheckinCustomerConfirmed(false)
      setContractNumber('')
      setContractSignedAt(c.scheduledDate)
      setContractStartAt(c.scheduledDate)
      setContractEndAt('')
      setContractFileName('')
      setContractFileData('')
      setActConditionNotes(
        lang === 'vi'
          ? (c.initialCondition || 'Kho sạch, đèn và khóa thông minh hoạt động tốt. Kiện hàng nguyên niêm phong.')
          : (c.initialConditionEn ?? 'The unit is clean; lighting and the electronic lock work properly. All packages are sealed.')
      )
      setCheckinModal(true)
    } catch (err) {
      console.error('Failed to open checkin modal:', err)
      showToast(lang === 'vi' ? 'Không thể mở modal check-in' : 'Could not open check-in modal')
    }
  }

  // Helper when opening return inspection modal
  const openReturnInspect = (r: ReturnCase) => {
    setSelectedReturn(r)
    setInvMatch(r.inventoryMatch || 'match')
    setDamageClass(r.damageClassification || 'no_damage')
    setDamageFee(r.damageFee || 0)
    setOutstandingFee(r.outstandingFee || 0)
    setCleaningFee(r.cleaningFee || 0)
    setLostItemFee(r.lostItemFee || 0)
    setOverdueFee(r.overdueFee || 0)
    setReturnedItems({ key: false, card: false, lock: false })
    setReturnCustomerConfirmed(false)
    setReturnPhoto('')
    setReturnStaffNotes(r.staffNotes || (lang === 'vi' ? 'Đã kiểm tra kho, tường và sàn nguyên trạng.' : 'The unit, walls, and floor have been inspected and remain intact.'))
    setInspectModal(true)
  }

  return (
    <Layout
      user={user}
      navItems={NAV}
      currentPage={page}
      onNavigate={setPage}
      onLogout={onLogout}
      roleLabel="Staff"
      roleColor="bg-green-100 text-green-700"
    >
      {/* ── DAILY TASKS ───────────────────────────────────────── */}
      {page === 'tasks' && (
        <div className="fade-in">
          <SectionHeader
            eyebrow={lang === 'vi' ? 'CỔNG NHÂN VIÊN · XÁC NHẬN NGHIỆP VỤ' : 'STAFF PORTAL · OPERATIONAL VERIFICATION'}
            title={t('tasks.title', 'Daily Tasks')}
            subtitle={`${scopedFacility ? `${scopedFacility} · ` : ''}${new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard title={t('tasks.total', 'Total Tasks')} value={totalCount} icon={Icon.tasks} iconBg="bg-blue-50" />
            <StatCard title={t('tasks.completed', 'Completed')} value={completedCount} icon={Icon.check} iconBg="bg-green-50" />
            <StatCard title={t('tasks.remaining', 'Remaining')} value={totalCount - completedCount} icon={Icon.alert} iconBg="bg-amber-50" />
          </div>

          <Card className="divide-y divide-slate-100">
            {tasks.map(tItem => (
              <div key={tItem.id} className={`flex items-center gap-4 p-4 ${tItem.done ? 'opacity-50' : ''}`}>
                <button
                  onClick={() => setTasks(ts => ts.map(tt => tt.id === tItem.id ? { ...tt, done: !tt.done } : tt))}
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${tItem.done ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-blue-400'}`}
                >
                  {tItem.done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${tItem.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {lang === 'vi' && taskTitleVi[tItem.id] ? taskTitleVi[tItem.id] : tItem.title}
                  </p>
                  <p className="text-xs text-slate-400">{tItem.time}</p>
                </div>
                {s(tItem.priority, { high: 'error', medium: 'warning', low: 'muted' })}
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── RESERVATIONS / HOLDS (P0.1, P0.2) ─────────────────── */}
      {page === 'reservations' && (
        <div className="fade-in space-y-6">
          <SectionHeader
            eyebrow={lang === 'vi' ? 'CỔNG NHÂN VIÊN · KIỂM DUYỆT NGOẠI LỆ' : 'STAFF PORTAL · EXCEPTION TRIAGE'}
            title={lang === 'vi' ? 'Thẩm Định & Duyệt Ngoại Lệ Giữ Kho' : 'Reservation Verification & Exception Review'}
            subtitle={lang === 'vi' ? 'Thẩm định hồ sơ Soft Exception (SLA 15 phút), kiểm tra DIM hàng hóa và phê duyệt' : 'Review soft exceptions (15-min SLA), verify cargo DIM and approve holds'}
          />

          {/* Exception Review Queue Section (Soft Exception: 85% < DIM <= 100%, Restricted items) */}
          {(() => {
            const reviewRequiredHolds = scopedHolds.filter(h => h.status === 'review_required' || h.status === 'awaiting_review')
            return (
              <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-orange-50/40 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-sm shadow"></span>
                    <div>
                      <h3 className="font-bold text-base text-amber-950 uppercase tracking-wide">
                        {lang === 'vi' ? 'EXCEPTION REVIEW · HÀNG ĐỢI DUYỆT NGOẠI LỆ (SLA: 15 PHÚT)' : 'EXCEPTION REVIEW · SOFT EXCEPTION QUEUE (15-MIN SLA)'}
                      </h3>
                      <p className="text-xs text-amber-800">
                        {lang === 'vi' ? 'Kho đang tạm giữ 15 phút. Nếu nhân viên không xử lý trước hạn, hệ thống tự động hết hạn (EXPIRED) và giải phóng vị trí kho.' : 'Capacity is reserved for 15 minutes. Automatically expires and releases capacity if unhandled.'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={reviewRequiredHolds.length > 0 ? 'warning' : 'success'}>
                    {reviewRequiredHolds.length} {lang === 'vi' ? 'đơn chờ duyệt' : 'pending reviews'}
                  </Badge>
                </div>

                {reviewRequiredHolds.length === 0 ? (
                  <div className="py-6 text-center text-xs text-stone-500">
                     {lang === 'vi' ? 'Hiện không có đơn ngoại lệ nào cần xử lý. Tất cả đơn tiêu chuẩn đã được hệ thống tự động duyệt (AUTO PASS).' : 'No pending exception reviews. All standard bookings were auto-approved.'}
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviewRequiredHolds.map(hold => {
                      const { text: countdownText, isUrgent, isExpired } = formatCountdown(hold.reviewExpiresAt || hold.expiresAt)
                      return (
                        <div
                          key={hold.id}
                          className={`rounded-xl border p-4 bg-white shadow-sm flex flex-col justify-between transition-all ${isUrgent ? 'border-red-400 bg-red-50/20 ring-1 ring-red-300' : 'border-amber-200 hover:border-amber-400'
                            }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                                  #{hold.id}
                                </span>
                                <h4 className="mt-1 font-bold text-stone-900 text-sm">
                                  {hold.unitTypeName || `Gian kho ${hold.unitId}`} · {hold.customerName}
                                </h4>
                                <p className="text-xs text-stone-500">{hold.customerPhone} · {hold.facilityName}</p>
                              </div>
                              <div className="text-right">
                                <div className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1 rounded-full border ${isUrgent
                                  ? 'bg-red-100 text-red-800 border-red-300 animate-pulse'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                                  }`}>
                                  <span></span>
                                  <span>{countdownText} remaining</span>
                                </div>
                                {isUrgent && !isExpired && (
                                  <p className="text-[10px] text-red-600 font-bold mt-1"> {lang === 'vi' ? 'Cảnh báo: Còn dưới 5 phút!' : 'Warning: Less than 5 minutes remaining!'}</p>
                                )}
                              </div>
                            </div>

                            <div className="my-3 rounded-lg bg-stone-50 border border-stone-200 p-2.5 text-xs space-y-1">
                              <p className="font-semibold text-stone-800 flex items-center gap-1">
                                <span className="text-amber-600"></span>
                                <span>{lang === 'vi' ? 'Ngoại lệ:' : 'Exception:'}</span>
                                <span className="text-amber-900 font-bold">{hold.exceptionDetails || hold.exceptionReason || (lang === 'vi' ? 'DIM gần giới hạn (>85%)' : 'DIM is near the limit (>85%)')}</span>
                              </p>
                              <p className="text-stone-600 text-[11px]">
                                • {lang === 'vi' ? 'Hàng hóa' : 'Cargo'}: {hold.goods.category} ({hold.goods.packageCount} {lang === 'vi' ? 'kiện' : 'packages'}, {hold.goods.weightKg} kg)
                              </p>
                              <p className="text-stone-600 text-[11px]">
                                • {lang === 'vi' ? 'Kiện lớn nhất' : 'Largest package'}: {hold.largestItemDimensionsCm?.lengthCm || hold.goods.lengthCm}×{hold.largestItemDimensionsCm?.widthCm || hold.goods.widthCm}×{hold.largestItemDimensionsCm?.heightCm || hold.goods.heightCm} cm
                              </p>
                              {hold.goods.notes && (
                                <p className="text-amber-900 italic text-[11px]">
                                  • {lang === 'vi' ? 'Yêu cầu khách' : 'Customer request'}: "{hold.goods.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setSelectedHold(hold); setHoldModal(true) }}>
                              {lang === 'vi' ? 'Xem hồ sơ' : 'View'}
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-700 hover:bg-red-50 border-red-300 font-medium"
                                onClick={() => {
                                  staffReviewReservation(hold.id, false, user, 'Từ chối: Kích thước hoặc điều kiện hàng không đảm bảo.')
                                  showToast(lang === 'vi' ? `Đã từ chối đơn ${hold.id} & giải phóng vị trí kho!` : `Hold ${hold.id} rejected and capacity released.`)
                                }}
                              >
                                ✕ {lang === 'vi' ? 'Từ chối' : 'Reject'}
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  staffReviewReservation(hold.id, true, user, 'Phê duyệt ngoại lệ: Đủ điều kiện, cấp 15 phút thanh toán cọc.')
                                  showToast(lang === 'vi' ? `Đã duyệt đơn ${hold.id}! Cấp 15 phút thanh toán cọc cho khách.` : `Hold ${hold.id} approved! 15m payment timer started.`)
                                }}
                              >
                                 {lang === 'vi' ? 'Phê duyệt' : 'Approve'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Full Reservations Table */}
          <Card>
            <div className="p-4 border-b border-stone-200 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm text-stone-900">{lang === 'vi' ? 'Tất Cả Đơn Đặt Giữ Kho' : 'All Reservations'}</h4>
                <p className="text-xs text-stone-500">{lang === 'vi' ? 'Bao gồm đơn tự động duyệt (AUTO), chờ đóng cọc và ngoại lệ' : 'Including auto-approved, awaiting deposit and exception reviews'}</p>
              </div>
              <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">{scopedHolds.length} {lang === 'vi' ? 'bản ghi' : 'records'}</span>
            </div>
            <Table>
              <Thead>
                <tr>
                  <Th>{lang === 'vi' ? 'Mã Đơn' : 'Hold ID'}</Th>
                  <Th>{lang === 'vi' ? 'Khách Hàng' : 'Customer'}</Th>
                  <Th>{lang === 'vi' ? 'Loại Kho & Gian Kho' : 'Unit Type & Unit'}</Th>
                  <Th>{lang === 'vi' ? 'Hàng Hóa & DIM' : 'Cargo & DIM'}</Th>
                  <Th>{lang === 'vi' ? 'Thời Hạn Timer' : 'Timer SLA'}</Th>
                  <Th>{lang === 'vi' ? 'Trạng Thái' : 'Status'}</Th>
                  <Th>{lang === 'vi' ? 'Thao Tác' : 'Action'}</Th>
                </tr>
              </Thead>
              <Tbody>
                {scopedHolds.map(hold => {
                  const timerTarget = hold.status === 'review_required' ? hold.reviewExpiresAt : hold.status === 'awaiting_deposit' ? hold.paymentExpiresAt : null
                  const countdown = formatCountdown(timerTarget || undefined)

                  return (
                    <Tr key={hold.id}>
                      <Td><span className="font-mono text-xs font-semibold text-stone-700">{hold.id}</span></Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Avatar name={hold.customerName} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-slate-800">{hold.customerName}</p>
                            <p className="text-xs text-slate-400">{hold.customerPhone}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <p className="font-bold text-sm text-stone-900">{hold.unitTypeName || hold.unitId}</p>
                        <p className="text-xs text-slate-500">
                          {hold.assignedUnitId ? (
                            <span className="font-mono font-semibold text-emerald-700">{lang === 'vi' ? 'Kho' : 'Unit'}: {hold.assignedUnitId}</span>
                          ) : (
                            <span className="text-amber-700 italic">{lang === 'vi' ? 'Chưa gán kho' : 'Unit not assigned'}</span>
                          )} · {hold.facilityName}
                        </p>
                      </Td>
                      <Td>
                        <p className="text-xs font-semibold text-stone-800">{hold.goods.category}</p>
                        <p className="text-[11px] text-stone-500">
                          {hold.goods.packageCount} {lang === 'vi' ? 'kiện' : 'pkgs'} · {hold.goods.weightKg}kg · {Math.round((hold.goods.lengthCm * hold.goods.widthCm * hold.goods.heightCm * hold.goods.packageCount) / 1000) / 1000} m³
                        </p>
                      </Td>
                      <Td>
                        {timerTarget ? (
                          <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${countdown.isUrgent ? 'bg-red-100 text-red-700 font-bold' : 'bg-stone-100 text-stone-700'}`}>
                             {countdown.text}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-400">—</span>
                        )}
                      </Td>
                      <Td>
                        {s(hold.status, {
                          CREATED: 'muted',
                          DEPOSIT_PAID: 'warning',
                          UNIT_RESERVED: 'purple',
                          READY_FOR_CHECKIN: 'info',
                          COMPLETED: 'success',
                          CANCELLED: 'error',
                          EXPIRED: 'error',
                          approved: 'success',
                          confirmed: 'success',
                          scheduled: 'purple',
                          checked_in: 'success',
                          review_required: 'warning',
                          awaiting_review: 'warning',
                          awaiting_deposit: 'warning',
                          awaiting_payment: 'warning',
                          rejected: 'error',
                          expired: 'error'
                        })}
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => { setSelectedHold(hold); setHoldModal(true) }}>
                            {lang === 'vi' ? 'Chi tiết' : 'View'}
                          </Button>
                          {(hold.status === 'review_required' || hold.status === 'awaiting_review') && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                staffReviewReservation(hold.id, true, user)
                                showToast(lang === 'vi' ? `Đã duyệt đơn ${hold.id}! Cấp 15 phút nộp cọc.` : `Hold ${hold.id} approved!`)
                              }}
                            >
                               {lang === 'vi' ? 'Duyệt' : 'Approve'}
                            </Button>
                          )}
                          {['UNIT_RESERVED', 'READY_FOR_CHECKIN'].includes(hold.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => {
                                try {
                                  expireReservation(hold.id, 'NO_SHOW', user)
                                  showToast(lang === 'vi' ? `Đã báo No-Show đơn ${hold.id} & giải phóng vị trí kho!` : `Hold ${hold.id} marked as expired (No-Show). Unit released!`)
                                } catch (err: any) {
                                  showToast(err?.message || 'Error expiring reservation')
                                }
                              }}
                            >
                              {lang === 'vi' ? 'No-Show / Hết hạn' : 'No-Show'}
                            </Button>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ── CHECK-IN / HANDOVER (P0.5: All 5 conditions required) ─ */}
      {page === 'checkin' && (
        <div className="fade-in space-y-4">
          <SectionHeader
            title={lang === 'vi' ? 'Bàn Giao & Check-in Kho' : 'Check-in / Handover'}
            subtitle={lang === 'vi' ? 'Đối chiếu CCCD, cân đo thực tế, kiểm tra hiện trạng và cấp mã mở cửa' : 'Verify ID, measure actual cargo, inspect space and issue gate PIN'}
          />

          <div className="space-y-3">
            {scopedCheckins.map(c => (
              <Card key={c.id} className="p-5">
                <div className="flex flex-wrap items-center gap-4 justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <Avatar name={c.customerName} size="sm" />
                      <div>
                        <h3 className="font-semibold text-slate-900">{c.customerName}</h3>
                        <p className="text-xs text-slate-500">{lang === 'vi' ? 'Gian kho' : 'Unit'} <b>{c.unitId}</b> · {lang === 'vi' ? 'Lịch hẹn' : 'Appointment'}: <b>{c.scheduledDate} ({c.scheduledTime})</b></p>
                        <p className="mt-1 text-xs text-slate-600">
                          {c.actualMeasurements?.lengthCm ?? 0}×{c.actualMeasurements?.widthCm ?? 0}×{c.actualMeasurements?.heightCm ?? 0}cm · {lang === 'vi' ? 'Cân thực' : 'Actual weight'}: {c.actualMeasurements?.weightKg ?? 0}kg · {lang === 'vi' ? 'Thể tích' : 'Volume'}: {typeof c.actualMeasurements?.actualVolumeM3 === 'number' ? c.actualMeasurements.actualVolumeM3.toFixed(2) : ((((c.actualMeasurements?.lengthCm ?? 0) * (c.actualMeasurements?.widthCm ?? 0) * (c.actualMeasurements?.heightCm ?? 0)) / 1000000).toFixed(2))} m³
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {s(c.status, { scheduled: 'info', completed: 'success' })}
                    {c.status !== 'completed' && (
                      <Button variant="primary" size="sm" onClick={() => openCheckinProcess(c)}>
                         {lang === 'vi' ? 'Thực hiện Check-in' : 'Process Check-in'}
                      </Button>
                    )}
                    {c.status === 'completed' && (
                      <div className="flex items-center gap-2">
                        <Badge variant="success"> {lang === 'vi' ? 'Đã bàn giao' : 'Handed over'}</Badge>
                        <span className="font-mono text-xs bg-stone-100 px-2 py-1 rounded">PIN: {c.accessCodeIssued}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── RETURN INSPECTION & SETTLEMENT (P0.6) ──────────────── */}
      {page === 'return' && (
        <div className="fade-in space-y-4">
          <SectionHeader
            eyebrow={lang === 'vi' ? 'CỔNG NHÂN VIÊN · KIỂM KÊ & BẰNG CHỨNG' : 'STAFF PORTAL · INVENTORY & EVIDENCE'}
            title={lang === 'vi' ? 'Nghiệm Thu Trả Kho & Quyết Toán Cọc' : 'Return Inspection'}
            subtitle={lang === 'vi' ? 'Đối chiếu hiện trạng trước–sau, kiểm kê hàng hóa, phân loại hư hại và quyết toán cọc' : 'Compare before/after condition, classify damage and settle security deposit'}
          />

          <Card>
            <Table>
              <Thead>
                <tr>
                  <Th>{lang === 'vi' ? 'Mã Trả' : 'Return ID'}</Th>
                  <Th>{lang === 'vi' ? 'Khách Hàng' : 'Customer'}</Th>
                  <Th>{lang === 'vi' ? 'Kho' : 'Unit'}</Th>
                  <Th>{lang === 'vi' ? 'Ngày Hẹn' : 'Date'}</Th>
                  <Th>{lang === 'vi' ? 'Cọc Đã Giữ' : 'Deposit'}</Th>
                  <Th>{lang === 'vi' ? 'Trạng Thái' : 'Status'}</Th>
                  <Th className="text-right">{lang === 'vi' ? 'Thao Tác' : 'Action'}</Th>
                </tr>
              </Thead>
              <Tbody>
                {scopedReturns.map(r => (
                  <Tr key={r.id}>
                    <Td><span className="font-mono text-xs text-slate-500">{r.id}</span></Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar name={r.customerName} size="sm" />
                        <span className="text-sm font-medium">{r.customerName}</span>
                      </div>
                    </Td>
                    <Td className="font-bold">{r.unitId}</Td>
                    <Td>{r.scheduledDate}</Td>
                    <Td className="font-semibold text-emerald-700">${r.depositAmount}</Td>
                    <Td>{s(r.status, { inspected: 'info', requested: 'warning', scheduled: 'info', completed: 'success' })}</Td>
                    <Td className="text-right">
                      {r.status !== 'completed' ? (
                        <Button variant="primary" size="sm" onClick={() => openReturnInspect(r)}>
                           {lang === 'vi' ? 'Nghiệm thu' : 'Inspect'}
                        </Button>
                      ) : (
                        <Badge variant="muted"> {lang === 'vi' ? `Đã hoàn cọc $${r.netRefundAmount}` : `Refunded $${r.netRefundAmount}`}</Badge>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ── SUPPORT QUEUE ─────────────────────────────────────── */}
      {page === 'support' && (() => {
        const displayedTickets = scopedTickets.filter(t => {
          if (ticketTab === 'Open' || ticketTab === 'Chờ Xử Lý') return t.status === 'open'
          if (ticketTab === 'In Progress' || ticketTab === 'Đang Khắc Phục') return t.status === 'in-progress'
          return t.status === 'resolved'
        })

        return (
          <div className="fade-in space-y-4">
            <SectionHeader
              title={lang === 'vi' ? 'Xử Lý Phiếu Hỗ Trợ Khách Hàng' : 'Support Queue & Dispatch'}
              subtitle={lang === 'vi' ? 'Giải quyết sự cố khóa cửa, hướng dẫn nộp cước và hỗ trợ vận hành' : 'Triage tenant issues, keypad errors and log official resolutions'}
            />

            <div className="flex items-center justify-between">
              <Tabs
                tabs={lang === 'vi' ? ['Chờ Xử Lý', 'Đang Khắc Phục', 'Đã Giải Quyết'] : ['Open', 'In Progress', 'Resolved']}
                active={ticketTab === 'Open' ? (lang === 'vi' ? 'Chờ Xử Lý' : 'Open') : ticketTab}
                onChange={newTab => {
                  if (newTab === 'Chờ Xử Lý' || newTab === 'Open') setTicketTab('Open')
                  else if (newTab === 'Đang Khắc Phục' || newTab === 'In Progress') setTicketTab('In Progress')
                  else setTicketTab('Resolved')
                }}
              />
            </div>

            <Card>
              <Table>
                <Thead>
                  <tr>
                    <Th>{lang === 'vi' ? 'Mã Phiếu' : 'Ticket'}</Th>
                    <Th>{lang === 'vi' ? 'Khách Hàng' : 'Customer'}</Th>
                    <Th>{lang === 'vi' ? 'Tiêu Đề & Kho' : 'Subject & Unit'}</Th>
                    <Th>{lang === 'vi' ? 'Phân Loại' : 'Category'}</Th>
                    <Th>{lang === 'vi' ? 'Trạng Thái' : 'Status'}</Th>
                    <Th className="text-right">{lang === 'vi' ? 'Thao Tác' : 'Action'}</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {displayedTickets.map(tItem => (
                    <Tr key={tItem.id}>
                      <Td><span className="font-mono text-xs font-semibold">{tItem.id}</span></Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Avatar name={tItem.customer} size="sm" />
                          <div>
                            <p className="text-xs font-medium text-stone-900">{tItem.customer}</p>
                            <p className="text-[11px] text-stone-400">{tItem.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <p className="font-semibold text-sm text-stone-900">{tItem.subject}</p>
                        <p className="text-xs text-stone-500">{tItem.facility} · Kho {tItem.unit}</p>
                      </Td>
                      <Td><Badge variant="muted">{tItem.category}</Badge></Td>
                      <Td>{s(tItem.status, { open: 'info', 'in-progress': 'warning', resolved: 'success' })}</Td>
                      <Td className="text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedStaffTicket(tItem)
                            setTicketNewStatus(tItem.status)
                            setRespondModal(true)
                          }}
                        >
                          {lang === 'vi' ? 'Phản hồi' : 'Respond'} ({tItem.messages.length})
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

      {/* ── POLICIES PAGE (QUY CHẾ VẬN HÀNH CHO NHÂN VIÊN) ───── */}
      {page === 'policies' && (
        <div className="fade-in space-y-6">
          <SectionHeader
            title={lang === 'vi' ? 'Quy Định & Quy Trình Nghiệp Vụ Nhân Viên' : 'Operational Policies & Staff Protocols'}
            subtitle={`${user.facility ?? 'Downtown Storage'} · ${lang === 'vi' ? 'Chuẩn mực nghiệp vụ đối chiếu CCCD, cân đo DIM, quy chuẩn nghiệm thu trả kho và an toàn PCCC' : 'Standard operating procedures for identity verification, DIM audit, return inspection and fire safety'}`}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <span className="text-2xl"></span>
              <h3 className="font-bold text-stone-900 text-sm mt-2">{lang === 'vi' ? 'Quy tắc 5 chốt check-in' : '5-Checklist Handover Rule'}</h3>
              <p className="text-xs text-stone-500 mt-1">{lang === 'vi' ? 'Bắt buộc đối chiếu CCCD/hộ chiếu gốc, khách hàng tự chấp thuận điều khoản và cân đo kiện hàng thực tế trước khi cấp PIN.' : 'Verify original ID, ensure tenant signs digital agreement and check DIM measurements before PIN issuance.'}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <span className="text-2xl"></span>
              <h3 className="font-bold text-stone-900 text-sm mt-2">{lang === 'vi' ? 'Nghiệm thu trả kho & hoàn cọc' : 'Clean Return Protocol'}</h3>
              <p className="text-xs text-stone-500 mt-1">{lang === 'vi' ? 'Chụp ảnh bằng chứng 4 góc gian kho, kiểm tra khóa, tường vách và sàn sạch trước khi phê duyệt hoàn cọc 100%.' : 'Take 4-corner condition photos, inspect locks, walls and cleanliness before approving deposit refund.'}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <span className="text-2xl"></span>
              <h3 className="font-bold text-stone-900 text-sm mt-2">{lang === 'vi' ? 'Kiểm soát hàng cấm nghiêm ngặt' : 'Prohibited Goods Zero-Tolerance'}</h3>
              <p className="text-xs text-stone-500 mt-1">{lang === 'vi' ? 'Từ chối ngay lập tức nếu phát hiện chất dễ cháy, pin lithium biến dạng, bình khí nén hoặc thực phẩm tươi sống.' : 'Immediately reject flammable chemicals, damaged lithium batteries, compressed gas or perishable items.'}</p>
            </div>
          </div>

          <Card className="p-5">
            <h3 className="font-bold text-stone-900 text-base mb-3">{lang === 'vi' ? 'Bảng Tham Chiếu Quy Chuẩn Vận Hành Chi Tiết' : 'Operating Rules Reference Matrix'}</h3>
            <Table>
              <Thead>
                <tr>
                  <Th>{lang === 'vi' ? 'Chính Sách' : 'Policy'}</Th>
                  <Th>{lang === 'vi' ? 'Mô Tả & Quy Định' : 'Description'}</Th>
                  <Th>{lang === 'vi' ? 'Giá Trị Tiêu Chuẩn' : 'Standard Value'}</Th>
                  <Th>{lang === 'vi' ? 'Phạm Vi Áp Dụng' : 'Scope'}</Th>
                </tr>
              </Thead>
              <Tbody>
                {POLICIES.map(p => (
                  <Tr key={p.id}>
                    <Td><span className="font-bold text-sm text-stone-900">{p.name}</span></Td>
                    <Td><p className="text-xs text-stone-600 max-w-lg">{lang === 'vi' ? p.descriptionVi : p.description}</p></Td>
                    <Td><span className="font-mono font-bold text-amber-800">{p.value}</span></Td>
                    <Td><Badge variant="muted">{p.scope}</Badge></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
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

      {/* ── MODAL: HOLD DETAIL & REVIEW ───────────────────────── */}
      <Modal
        open={holdModal}
        onClose={() => setHoldModal(false)}
        size="xl"
        title={lang === 'vi' ? 'Chi Tiết Hồ Sơ Giữ Kho & Khai Báo' : 'Storage Hold Verification'}
      >
        {selectedHold && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{lang === 'vi' ? 'Khách hàng' : 'Customer'}</p><b>{selectedHold.customerName}</b><p className="text-xs">{selectedHold.customerPhone}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Email</p><b>{selectedHold.customerEmail}</b><p className="text-xs">{selectedHold.emailVerification.verified ? (lang === 'vi' ? ' Đã xác nhận' : ' Verified') : (lang === 'vi' ? ' Chưa xác nhận' : ' Not verified')}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{lang === 'vi' ? 'Gian kho' : 'Unit'}</p><b>{selectedHold.unitId} · {selectedHold.facilityName}</b><p className="text-xs">{lang === 'vi' ? `Kỳ thuê: ${selectedHold.rentalMonths} tháng` : `Lease term: ${selectedHold.rentalMonths} months`}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{lang === 'vi' ? 'CCCD khách khai' : 'Declared ID'}</p><b>{selectedHold.identityId}</b><p className="text-xs">{lang === 'vi' ? 'Đối chiếu bản gốc khi check-in' : 'Verify the original document at check-in'}</p></div>
            </div>

            <div className="rounded-lg border border-stone-200 p-4 text-xs space-y-1.5 bg-stone-50/50">
              <p className="font-bold text-sm text-stone-900">{lang === 'vi' ? 'Chi tiết hàng hóa & Đối chiếu dung tích kho' : 'Cargo Details & Storage Capacity Check'}</p>
              <p>{lang === 'vi' ? 'Loại hàng' : 'Category'}: <b>{selectedHold.goods.category}</b> · {lang === 'vi' ? 'Chất liệu' : 'Material'}: <b>{selectedHold.goods.material}</b></p>
              <p>{lang === 'vi' ? 'Số kiện' : 'Packages'}: <b>{selectedHold.goods.packageCount}</b> · {lang === 'vi' ? 'Tổng khối lượng thực tế' : 'Total actual weight'}: <b>{selectedHold.goods.weightKg} kg</b></p>
              <p>{lang === 'vi' ? 'Kích thước kiện lớn nhất' : 'Largest package dimensions'}: <b>{selectedHold.goods.lengthCm} × {selectedHold.goods.widthCm} × {selectedHold.goods.heightCm} cm</b></p>
              <p>{lang === 'vi' ? 'Tổng thể tích kiện hàng' : 'Total cargo volume'}: <b>{Math.round((selectedHold.goods.lengthCm * selectedHold.goods.widthCm * selectedHold.goods.heightCm * selectedHold.goods.packageCount) / 1000) / 1000} m³</b></p>
              <p className="text-emerald-800 font-semibold">{lang === 'vi' ? 'Tiền thuê tháng đầu' : 'First-month rent'}: ${selectedHold.quote.baseMonthlyPrice} · {lang === 'vi' ? 'Tiền cọc hoàn lại' : 'Refundable deposit'}: ${selectedHold.quote.depositAmount} · {lang === 'vi' ? 'Tổng cước' : 'Total due'}: ${selectedHold.quote.totalFirstPayment}</p>
              <p className="text-stone-500 pt-1 border-t border-stone-200">{lang === 'vi' ? 'Hiện trạng khai báo' : 'Declared condition'}: {selectedHold.goods.condition}</p>
            </div>

            <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
              <Button variant="outline" onClick={() => setHoldModal(false)}>{lang === 'vi' ? 'Đóng' : 'Close'}</Button>
              {selectedHold.status === 'awaiting_review' && (
                <>
                  <Button
                    variant="danger"
                    onClick={() => {
                      reviewStorageHold(selectedHold.id, false, user, 'Từ chối do hàng hóa không hợp lệ')
                      setHoldModal(false)
                      showToast(lang === 'vi' ? 'Đã từ chối đơn giữ kho và giải phóng kho trống!' : 'Hold rejected and unit released!')
                    }}
                  >
                    ✕ {lang === 'vi' ? 'Từ chối' : 'Reject'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      reviewStorageHold(selectedHold.id, true, user, 'Hàng hóa hợp lệ, kho phù hợp')
                      setHoldModal(false)
                      showToast(lang === 'vi' ? 'Đã duyệt hồ sơ! Chuyển trạng thái sang chờ khách nộp cọc.' : 'Hold approved!')
                    }}
                  >
                     {lang === 'vi' ? 'Duyệt đơn giữ kho' : 'Approve'}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL: CHECK-IN & HANDOVER (P0.5: 5 Checklist condition locks) ─ */}
      <Modal
        open={checkinModal}
        onClose={() => setCheckinModal(false)}
        size="xl"
        title={lang === 'vi' ? 'Đối Chiếu & Biên Bản Bàn Giao Check-in' : 'Move-in Check-in & Handover'}
      >
        {selectedCheckin && (() => {
          const hold = holds.find(h => h.id === selectedCheckin.holdId)
          const assignedRoom = hold?.assignedUnitId
          const assignedUnit = units.find(u => u.id === assignedRoom)
          const hasAssignedUnit = Boolean(assignedUnit && (assignedUnit.status === 'reserved' || assignedUnit.status === 'available') && hold?.assignedUnitId === assignedUnit.id)
          const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })
          const depositReady = Boolean(hold && (hold.reservationDepositAmount ?? hold.payment.amount ?? 0) > 0 && hold.payment.status === 'paid')
          const contract = contracts.find(c => c.id === hold?.contractId && c.status === 'SIGNED')
          const contractReady = Boolean(contract?.scannedFileUrl)
          const balanceReady = Boolean(hold && (hold.remainingAmount ?? 0) <= 0)
          const paymentReady = Boolean(depositReady && balanceReady)
          const dateReady = selectedCheckin.scheduledDate === today
          const pinCred = accessCredentials.find(ac => ac.reservationId === hold?.id && ac.type === 'PIN')
          const activePin = hold?.generatedAccessPin || pinCred?.pinCode || '4921#'
          const allChecklistDone = Boolean(chkIdVerified && depositReady && contractReady && balanceReady && hasAssignedUnit && chkUnitWalkthrough && chkAccessCodeIssued)

          return (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-3 text-xs grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-500">{lang === 'vi' ? 'Khách hàng:' : 'Customer:'}</p>
                  <p className="font-bold text-sm text-stone-900">{selectedCheckin.customerName}</p>
                </div>
                <div>
                  <p className="text-slate-500">{lang === 'vi' ? 'Gian kho bàn giao:' : 'Assigned Unit:'}</p>
                  <p className="font-bold text-sm">
                    {assignedRoom ? (
                      <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {lang === 'vi' ? 'Kho' : 'Unit'} {assignedRoom}
                      </span>
                    ) : (
                      <span className="text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded">
                         {lang === 'vi' ? 'Chưa phân bổ kho!' : 'Unit not assigned!'}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Deposit separation & financial breakdown */}
              <div className="rounded-lg border border-stone-200 p-3 text-xs space-y-2">
                <p className="font-bold text-stone-900">{lang === 'vi' ? 'Booking · Cọc Giữ Chỗ & Cọc Bảo Đảm · Hợp Đồng' : 'Booking · Deposits & Contract'}</p>
                <p className="text-stone-500">{selectedCheckin.holdId} · {lang === 'vi' ? 'Ngày check-in' : 'Check-in date'}: {selectedCheckin.scheduledDate}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  <div>
                    <span className="text-stone-500 block text-[11px]">{lang === 'vi' ? '1. Cọc giữ chỗ (20% đã cọc online):' : '1. Reservation deposit (20% paid):'}</span>
                    <b className="text-emerald-700 font-mono text-sm">${hold?.reservationDepositAmount ?? 36}</b>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">{lang === 'vi' ? '2. Cọc bảo đảm (chuyển đổi khi ký HĐ):' : '2. Security deposit (converted):'}</span>
                    <b className="text-blue-700 font-mono text-sm">${hold?.securityDepositAmount ?? hold?.quote.depositAmount ?? 89}</b>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">{lang === 'vi' ? '3. Còn lại cần thanh toán tại cơ sở:' : '3. Remaining balance on site:'}</span>
                    <b className={(hold?.remainingAmount ?? 0) > 0 ? 'text-amber-700 font-mono text-sm' : 'text-emerald-700 font-mono text-sm'}>
                      ${hold?.remainingAmount ?? 0}
                    </b>
                  </div>
                </div>

                <p className={contractReady ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>
                  {contractReady ? '✓ ' : '✕ '} {lang === 'vi' ? 'Hợp đồng giấy đã ký và lưu scan' : 'Signed paper contract scan'}: {contract?.contractNumber ?? (lang === 'vi' ? 'Chưa lưu scan hợp đồng' : 'Not scanned')}
                </p>
                {contract && <p><a href={contract.scannedFileUrl} target="_blank" rel="noopener noreferrer" className="underline text-amber-800">{lang === 'vi' ? 'Xem bản scan hợp đồng' : 'View contract scan'}</a> · {lang === 'vi' ? 'Tải lên bởi' : 'Uploaded by'} {contract.uploadedBy} · {contract.uploadedAt}</p>}
                {payments.filter(p => p.reservationId === hold?.id).map(p => (
                  <p key={p.id} className="text-stone-600">
                    • {p.type === 'RESERVATION_DEPOSIT' ? (lang === 'vi' ? 'Cọc giữ chỗ 20%' : 'Reservation deposit (20%)') : (lang === 'vi' ? 'Thanh toán tiền thuê ban đầu' : 'Initial rent balance')}: ${p.amount} ({p.paymentMethod}) · Mã: {p.transactionReference || p.id}
                  </p>
                ))}
                {!dateReady && <p className="text-amber-700 font-semibold">{lang === 'vi' ? 'Lưu ý: Chỉ hoàn tất check-in vào đúng ngày hẹn.' : 'Note: Finalize check-in on appointment date only.'}</p>}
              </div>

              {!hasAssignedUnit && (
                <div className="rounded-lg border border-amber-300 bg-amber-50/90 p-3 text-xs space-y-2">
                   {lang === 'vi' ? 'Facility Manager cần phân kho trước khi nhân viên bàn giao.' : 'Facility Manager must assign the unit before handover.'}
                </div>
              )}

              {!contractReady && (
                <div className="rounded-lg border border-stone-200 p-3 space-y-2 text-xs">
                  <p className="font-bold">{lang === 'vi' ? 'Hợp đồng giấy ký tại cơ sở' : 'Paper contract signed on site'}</p>
                  <Input label={lang === 'vi' ? 'Số hợp đồng' : 'Contract number'} value={contractNumber} onChange={e => setContractNumber(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label={lang === 'vi' ? 'Ngày ký' : 'Signed date'} type="date" value={contractSignedAt} onChange={e => setContractSignedAt(e.target.value)} />
                    <Input label={lang === 'vi' ? 'Ngày bắt đầu' : 'Start date'} type="date" value={contractStartAt} onChange={e => setContractStartAt(e.target.value)} />
                    <Input label={lang === 'vi' ? 'Ngày kết thúc' : 'End date'} type="date" value={contractEndAt} onChange={e => setContractEndAt(e.target.value)} />
                    <Input label={lang === 'vi' ? 'Tiền thuê mỗi kỳ' : 'Monthly rent'} value={String(hold?.discountedMonthlyRate ?? hold?.quote.baseMonthlyPrice ?? 0)} readOnly />
                  </div>
                  <p>{lang === 'vi' ? 'Cọc bảo đảm' : 'Security deposit'}: ${hold?.quote.depositAmount ?? 0}</p>
                  <label className="block">{lang === 'vi' ? 'Bản scan đã ký (PDF/JPG, tối đa 1 MB)' : 'Signed scan (PDF/JPG, max 1 MB)'}
                    <input className="block mt-1" type="file" accept="application/pdf,image/jpeg" onChange={e => {
                      const file = e.target.files?.[0]
                      if (!file || !['application/pdf', 'image/jpeg'].includes(file.type) || file.size > 1_000_000) { setContractFileData(''); setContractFileName(''); showToast(lang === 'vi' ? 'Chỉ nhận PDF/JPG tối đa 1 MB.' : 'PDF/JPG only, max 1 MB.'); return }
                      const reader = new FileReader()
                      reader.onload = () => { setContractFileData(String(reader.result)); setContractFileName(file.name) }
                      reader.readAsDataURL(file)
                    }} />
                  </label>
                  <Button size="sm" disabled={!chkIdVerified || !contractNumber.trim() || !contractSignedAt || !contractStartAt || !contractEndAt || !contractFileData} onClick={() => {
                    try { signPaperContract({ holdId: selectedCheckin.holdId, staffUser: user, identityVerified: chkIdVerified, contractNumber, signedAt: contractSignedAt, startDate: contractStartAt, endDate: contractEndAt, scannedFileUrl: contractFileData, scannedFileName: contractFileName }); showToast(lang === 'vi' ? 'Đã lưu hợp đồng giấy đã ký.' : 'Signed paper contract saved.') }
                    catch (err: any) { showToast(err?.message || 'Could not save contract') }
                  }}>{lang === 'vi' ? 'Lưu hợp đồng đã ký' : 'Save signed contract'}</Button>
                </div>
              )}

              {/* Formal Remaining Balance Payment Form */}
              {contractReady && !balanceReady && (
                <div className="rounded-lg border border-amber-300 bg-amber-50/70 p-3 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-amber-950 uppercase tracking-wide">
                      {lang === 'vi' ? 'Ghi nhận thanh toán phần còn lại tại cơ sở' : 'Record Remaining Payment on Site'}
                    </p>
                    <span className="font-mono text-sm font-bold text-red-700">
                      {lang === 'vi' ? 'Còn phải thu:' : 'Amount due:'} ${hold?.remainingAmount ?? 0}
                    </span>
                  </div>
                  <p className="text-stone-600 text-[11px]">
                    {lang === 'vi'
                      ? 'Khi khách thanh toán đủ tiền thuê ban đầu, cọc giữ chỗ 20% sẽ chính thức chuyển đổi thành cọc bảo đảm của hợp đồng.'
                      : 'Upon paying remaining balance, reservation deposit converts to contract security deposit.'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="font-medium text-stone-700 block mb-1">{lang === 'vi' ? 'Phương thức thanh toán' : 'Payment Method'}</label>
                      <select
                        value={remPayMethod}
                        onChange={e => setRemPayMethod(e.target.value as any)}
                        className="w-full border border-stone-300 rounded p-1.5 bg-white text-xs"
                      >
                        <option value="CASH">{lang === 'vi' ? 'Tiền mặt tại quầy (CASH)' : 'Cash at counter'}</option>
                        <option value="BANK_TRANSFER">{lang === 'vi' ? 'Chuyển khoản VietQR / Ngân hàng' : 'Bank Transfer / QR'}</option>
                      </select>
                    </div>
                    <div>
                      <Input
                        label={lang === 'vi' ? 'Mã biên nhận / Mã GD ngân hàng' : 'Receipt No. / Bank Ref'}
                        value={remPayRef}
                        onChange={e => setRemPayRef(e.target.value)}
                        placeholder="PT-2026-001"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      disabled={!remPayRef.trim()}
                      onClick={() => {
                        try {
                          recordRemainingPayment(selectedCheckin.holdId, user, {
                            amount: hold?.remainingAmount || 0,
                            paymentMethod: remPayMethod,
                            transactionReference: remPayRef.trim(),
                            proofImage: remPayProof.trim() || undefined
                          })
                          showToast(lang === 'vi' ? `Đã lập phiếu thu $${hold?.remainingAmount} (${remPayMethod}). Cọc giữ chỗ chuyển thành cọc bảo đảm.` : 'Payment recorded! Deposit converted.')
                        } catch (err: any) {
                          showToast(err?.message || 'Payment failed')
                        }
                      }}
                    >
                      {lang === 'vi' ? 'Lập phiếu thu & Chuyển đổi cọc bảo đảm' : 'Record Payment & Convert Deposit'}
                    </Button>
                  </div>
                </div>
              )}

              {/* System-Generated PIN Display */}
              <div className="rounded-lg border border-emerald-300 bg-emerald-50/80 p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950">
                    {lang === 'vi' ? 'Mã PIN mở khóa kho (Hệ thống tự sinh):' : 'System-generated Access PIN:'}
                  </span>
                  <span className="font-mono text-base font-bold bg-white text-emerald-900 border border-emerald-300 px-3 py-0.5 rounded shadow-sm">
                    {activePin}
                  </span>
                </div>
                <p className="text-stone-600 text-[11px]">
                  {lang === 'vi'
                    ? 'Mã PIN đang ở trạng thái PENDING_ACTIVATION. Nhân viên bàn giao mã này cùng chìa/thẻ cho khách. PIN sẽ tự động kích hoạt (ACTIVE) ngay khi bấm Xác nhận Check-in.'
                    : 'PIN is PENDING_ACTIVATION. Hand it over to tenant. It activates upon check-in confirmation.'}
                </p>
              </div>

              {/* System prerequisites and three staff handover checks */}
              <div className="rounded-lg border border-amber-300 bg-amber-50/70 p-4 space-y-2.5">
                <p className="font-bold text-xs uppercase tracking-wider text-amber-900">
                  {lang === 'vi' ? 'Nhân viên xác minh và bàn giao (3 bước):' : 'Staff verification and handover (3 steps):'}
                </p>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-amber-600"
                    checked={chkIdVerified}
                    onChange={e => setChkIdVerified(e.target.checked)}
                  />
                  <span className="text-xs font-medium text-stone-800">
                    1. {lang === 'vi' ? 'Đã đối chiếu bản gốc CCCD/Hộ chiếu khách hàng trùng khớp hồ sơ' : 'Verified original customer photo ID/Passport'}
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-amber-600"
                    checked={chkUnitWalkthrough}
                    onChange={e => setChkUnitWalkthrough(e.target.checked)}
                  />
                  <span className="text-xs font-medium text-stone-800">
                    2. {lang === 'vi' ? 'Đã cùng khách hàng nghiệm thu trực tiếp hiện trạng gian kho, cửa và đèn' : 'Walked through unit condition, doors and lights with tenant'}
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-amber-600"
                    checked={chkAccessCodeIssued}
                    onChange={e => setChkAccessCodeIssued(e.target.checked)}
                  />
                  <span className="text-xs font-medium text-stone-800">
                    3. {lang === 'vi' ? `Đã bàn giao mã PIN (${activePin}) và chìa khóa/thẻ vật lý cho khách` : `Handed over PIN (${activePin}) and physical keys/cards to tenant`}
                  </span>
                </label>
              </div>

              <div className="rounded-lg border border-stone-200 p-3 space-y-2">
                <p className="font-bold text-xs text-stone-800">{lang === 'vi' ? 'Thông tin hàng hóa bàn giao' : 'Goods handed over'}</p>
                <div className="grid grid-cols-3 gap-2">
                  <Input label={lang === 'vi' ? 'Số kiện' : 'Packages'} type="number" value={goodsCount.toString()} onChange={e => setGoodsCount(Number(e.target.value))} />
                  <Input label={lang === 'vi' ? 'Loại hàng' : 'Goods type'} value={goodsCategory} onChange={e => setGoodsCategory(e.target.value)} />
                  <Input label={lang === 'vi' ? 'Khối lượng ước tính (kg)' : 'Estimated weight (kg)'} type="number" value={goodsWeight.toString()} onChange={e => setGoodsWeight(Number(e.target.value))} />
                </div>
                <Input label={lang === 'vi' ? 'Ghi chú hàng hóa' : 'Goods notes'} value={goodsNotes} onChange={e => setGoodsNotes(e.target.value)} />
                <Input label={lang === 'vi' ? 'Ảnh hiện trạng (đường dẫn/mã ảnh)' : 'Condition photo (reference/URL)'} value={handoverPhoto} onChange={e => setHandoverPhoto(e.target.value)} />

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">{lang === 'vi' ? 'Hiện trạng kho ban đầu & ghi chú bàn giao:' : 'Initial condition handover note:'}</label>
                  <textarea
                    rows={2}
                    value={actConditionNotes}
                    onChange={e => setActConditionNotes(e.target.value)}
                    className="w-full border border-stone-300 rounded-lg p-2 text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-4 text-xs">
                  {(['key', 'card'] as const).map(item => <label key={item}><input type="checkbox" checked={handoverItems[item]} onChange={e => setHandoverItems(v => ({ ...v, [item]: e.target.checked }))} /> {item === 'key' ? (lang === 'vi' ? 'Chìa khóa' : 'Key') : (lang === 'vi' ? 'Thẻ' : 'Card')}</label>)}
                </div>
                <label className="block text-xs"><input type="checkbox" checked={checkinCustomerConfirmed} onChange={e => setCheckinCustomerConfirmed(e.target.checked)} /> {lang === 'vi' ? 'Khách đã xác nhận biên bản bàn giao' : 'Customer confirmed handover record'}</label>
              </div>

              <div className="flex justify-between items-center border-t border-stone-100 pt-3">
                <p className="text-xs text-stone-500">
                  {!hasAssignedUnit ? (
                    <span className="text-red-600 font-bold"> {lang === 'vi' ? 'Bắt buộc gán gian kho cụ thể trước khi bàn giao.' : 'A specific unit must be assigned before handover.'}</span>
                  ) : !allChecklistDone ? (
                    <span className="text-red-600 font-semibold">{lang === 'vi' ? 'Cần hợp đồng, thanh toán và 3 bước xác minh/bàn giao.' : 'Complete contract, payment and three staff checks.'}</span>
                  ) : (
                    <span className="text-emerald-700 font-semibold"> {lang === 'vi' ? 'Đã bàn giao PIN; sẵn sàng kích hoạt hồ sơ thuê.' : 'PIN handed over; ready to activate the rental.'}</span>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCheckinModal(false)}>{lang === 'vi' ? 'Hủy' : 'Cancel'}</Button>
                  <Button
                    disabled={!allChecklistDone || !hasAssignedUnit || !dateReady || !checkinCustomerConfirmed || !handoverPhoto.trim() || !actConditionNotes.trim()}
                    onClick={() => {
                      try {
                        completeCheckIn({
                          holdId: selectedCheckin.holdId,
                          staffUser: user,
                          checklist: {
                            identityVerified: chkIdVerified,
                            termsAccepted: Boolean(contractReady),
                            paymentConfirmed: Boolean(paymentReady),
                            unitWalkthrough: chkUnitWalkthrough,
                            accessCodeIssued: chkAccessCodeIssued
                          },
                          actualMeasurements: selectedCheckin.actualMeasurements,
                          initialCondition: actConditionNotes,
                          evidencePhotos: [handoverPhoto.trim()],
                          customerConfirmed: checkinCustomerConfirmed,
                          goodsHandover: { packageCount: goodsCount, category: goodsCategory, estimatedWeightKg: goodsWeight, notes: goodsNotes },
                          handedOverItems: ['pin', ...Object.entries(handoverItems).filter(([, done]) => done).map(([item]) => item)]
                        })
                        setCheckinModal(false)
                        showToast(lang === 'vi' ? 'Đã hoàn tất check-in! Hồ sơ thuê đã kích hoạt và cấp mã PIN cho khách.' : 'Handover complete! Rental activated.')
                      } catch (err: any) {
                        console.error('Error completing check-in:', err)
                        showToast(err?.message || (lang === 'vi' ? 'Lỗi khi hoàn tất check-in' : 'Error completing check-in'))
                      }
                    }}
                  >
                     {lang === 'vi' ? 'Xác nhận Check-in & kích hoạt hợp đồng' : 'Confirm Check-in & Activate Rental'}
                  </Button>
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ── MODAL: RETURN INSPECTION & DEPOSIT SETTLEMENT (P0.6) ─ */}
      <Modal
        open={inspectModal}
        onClose={() => setInspectModal(false)}
        size="xl"
        title={lang === 'vi' ? 'Nghiệm Thu Trả Kho & Quyết Toán Hoàn Cọc' : 'Move-out Inspection & Deposit Settlement'}
      >
        {selectedReturn && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-lg text-xs">
              <div>
                <p className="text-stone-500">{lang === 'vi' ? 'Khách trả kho:' : 'Customer:'}</p>
                <p className="font-bold text-sm">{selectedReturn.customerName}</p>
                <p className="text-stone-500">{lang === 'vi' ? 'Gian kho' : 'Unit'}: <b>{selectedReturn.unitId}</b></p>
              </div>
              <div className="text-right">
                <p className="text-stone-500">{lang === 'vi' ? 'Tiền cọc ban đầu:' : 'Original deposit:'}</p>
                <p className="text-lg font-bold text-emerald-700">${selectedReturn.depositAmount}</p>
              </div>
            </div>
            <div className="rounded-lg border border-stone-200 p-3 text-xs space-y-2">
              <p className="font-bold">{lang === 'vi' ? 'Kiểm kê tài sản & xác nhận trả đúng kho' : 'Asset inventory & unit verification'}</p>
              <p>{lang === 'vi' ? 'Hợp đồng' : 'Rental'}: {selectedReturn.rentalId} · {lang === 'vi' ? 'Kho' : 'Unit'}: {selectedReturn.unitId}</p>
              <div className="flex flex-wrap gap-4">
                {(['key', 'card', 'lock'] as const).map(item => <label key={item}><input type="checkbox" checked={returnedItems[item]} onChange={e => setReturnedItems(v => ({ ...v, [item]: e.target.checked }))} /> {item === 'key' ? (lang === 'vi' ? 'Đã nhận chìa khóa' : 'Key returned') : item === 'card' ? (lang === 'vi' ? 'Đã nhận thẻ' : 'Card returned') : (lang === 'vi' ? 'Đã nhận khóa' : 'Lock returned')}</label>)}
              </div>
              <Input label={lang === 'vi' ? 'Ảnh hiện trạng trả kho (đường dẫn/mã ảnh)' : 'Return condition photo (reference/URL)'} value={returnPhoto} onChange={e => setReturnPhoto(e.target.value)} />
            </div>

            {/* Before / After Comparison */}
            <div className="rounded-lg border border-stone-200 p-3 text-xs space-y-1">
              <p className="font-bold text-stone-900">{lang === 'vi' ? 'Đối chiếu snapshot hiện trạng trước – sau:' : 'Condition Comparison:'}</p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-emerald-50 p-2.5 rounded border border-emerald-200">
                  <p className="font-semibold text-emerald-900">{lang === 'vi' ? 'Lúc nhận bàn giao (Ban đầu):' : 'At handover (Initial):'}</p>
                  <p className="text-stone-700 mt-1">{lang === 'vi' ? selectedReturn.initialConditionSnapshot : (selectedReturn.initialConditionSnapshotEn ?? 'The unit was clean with intact walls and lock at handover.')}</p>
                </div>
                <div className="bg-amber-50 p-2.5 rounded border border-amber-200">
                  <p className="font-semibold text-amber-900">{lang === 'vi' ? 'Lúc trả kho (Hiện tại):' : 'At move-out (Current):'}</p>
                  <textarea
                    rows={2}
                    value={returnStaffNotes}
                    onChange={e => setReturnStaffNotes(e.target.value)}
                    className="w-full text-xs border border-amber-300 rounded p-1.5 mt-1 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Inspection Form Binding */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">{lang === 'vi' ? 'Kết quả kiểm kê hàng hóa' : 'Inventory check result'}</label>
                <select
                  value={invMatch}
                  onChange={e => setInvMatch(e.target.value as any)}
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs bg-white"
                >
                  <option value="match">{lang === 'vi' ? 'Đủ số lượng (Khớp biên bản)' : 'Complete inventory (Matches record)'}</option>
                  <option value="missing">{lang === 'vi' ? 'Thiếu hàng so với khai báo' : 'Items missing from declaration'}</option>
                  <option value="excess">{lang === 'vi' ? 'Có hàng bỏ lại trong kho' : 'Items left in the unit'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">{lang === 'vi' ? 'Phân loại hư hại & hiện trạng' : 'Damage & condition classification'}</label>
                <select
                  value={damageClass}
                  onChange={e => {
                    const val = e.target.value as DamageClassification
                    setDamageClass(val)
                    if (val === 'no_damage') setDamageFee(0)
                    else if (val === 'minor_damage') setDamageFee(25)
                    else if (val === 'major_damage') setDamageFee(selectedReturn.depositAmount)
                  }}
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs bg-white"
                >
                  <option value="no_damage">{lang === 'vi' ? 'Đạt chuẩn – Hoàn 100% cọc (Sạch sẽ, không hư hại)' : 'Pass – Full deposit refund (Clean, no damage)'}</option>
                  <option value="minor_damage">{lang === 'vi' ? 'Hư hỏng nhẹ – Khấu trừ một phần cọc (Vết ố, trầy xước)' : 'Minor damage – Partial deposit deduction'}</option>
                  <option value="major_damage">{lang === 'vi' ? 'Hư hỏng nặng – Khấu trừ toàn bộ cọc' : 'Major damage – Full deposit deduction'}</option>
                  <option value="abandoned_goods">{lang === 'vi' ? 'Hàng hóa bỏ lại – Cần tính phí dọn dẹp' : 'Abandoned goods – Cleanup fee required'}</option>
                </select>
              </div>
            </div>

            {/* Financial Settlement Breakdown */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 text-xs space-y-2">
              <p className="font-bold text-sm text-blue-950">{lang === 'vi' ? 'Quyết toán hoàn cọc bảo đảm' : 'Security Deposit Settlement'}</p>
              <div className="flex justify-between">
                <span>{lang === 'vi' ? 'Tiền cọc đã thu ban đầu:' : 'Original deposit collected:'}</span>
                <b>${selectedReturn.depositAmount}</b>
              </div>
              <div className="flex justify-between items-center">
                <span>{lang === 'vi' ? 'Phí hư hại:' : 'Damage fee:'}</span>
                <input
                  type="number"
                  value={damageFee.toString()}
                  onChange={e => setDamageFee(Math.max(0, Number(e.target.value)))}
                  className="w-24 text-right border border-stone-300 rounded p-1 font-bold text-red-600"
                />
              </div>
              {([
                [lang === 'vi' ? 'Vệ sinh kho' : 'Cleaning', cleaningFee, setCleaningFee],
                [lang === 'vi' ? 'Mất chìa khóa/thẻ' : 'Lost key/card', lostItemFee, setLostItemFee],
                [lang === 'vi' ? 'Quá hạn' : 'Overdue', overdueFee, setOverdueFee],
                [lang === 'vi' ? 'Công nợ khác' : 'Other outstanding balance', outstandingFee, setOutstandingFee]
              ] as [string, number, (value: number) => void][]).map(([label, value, setter]) => <div key={label} className="flex justify-between items-center"><span>{label}:</span><input type="number" min="0" value={value} onChange={e => setter(Math.max(0, Number(e.target.value)))} className="w-24 text-right border border-stone-300 rounded p-1" /></div>)}
              <div className="border-t border-blue-200 pt-2 flex justify-between text-sm font-bold text-stone-900">
                <span>{lang === 'vi' ? 'Dự kiến hoàn cọc (chờ xử lý):' : 'Refund due (pending processing):'}</span>
                <span className="text-emerald-700 font-mono text-base">
                  ${Math.max(0, selectedReturn.depositAmount - damageFee - cleaningFee - lostItemFee - overdueFee - outstandingFee)}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 italic">
                {damageClass === 'no_damage' && cleaningFee === 0 && invMatch !== 'excess' && returnedItems.lock && lostItemFee === 0
                  ? (lang === 'vi' ? ' Gian kho đạt tiêu chuẩn sẽ được giải phóng về trạng thái AVAILABLE ngay.' : ' The unit passes inspection and will return to AVAILABLE immediately.')
                  : (lang === 'vi' ? ' Gian kho có hư hại sẽ tự động chuyển sang trạng thái MAINTENANCE để đội kỹ thuật xử lý.' : ' The damaged unit will move to MAINTENANCE for technical service.')}
              </p>
            </div>
            <label className="block text-xs"><input type="checkbox" checked={returnCustomerConfirmed} onChange={e => setReturnCustomerConfirmed(e.target.checked)} /> {lang === 'vi' ? 'Khách đã xác nhận biên bản trả kho và quyết toán' : 'Customer confirmed return and settlement record'}</label>

            <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
              <Button variant="outline" onClick={() => setInspectModal(false)}>{lang === 'vi' ? 'Hủy' : 'Cancel'}</Button>
              <Button
                disabled={!returnCustomerConfirmed || !returnPhoto.trim() || !returnStaffNotes.trim()}
                onClick={() => {
                  try {
                    completeReturnInspection({
                      returnId: selectedReturn.id, staffUser: user, inventoryMatch: invMatch,
                      damageClassification: damageClass, damageFee, cleaningFee, lostItemFee, overdueFee,
                      outstandingFee, staffNotes: returnStaffNotes, evidencePhotos: [returnPhoto.trim()],
                      returnedItems, customerConfirmed: returnCustomerConfirmed
                    })
                    setInspectModal(false)
                    showToast(lang === 'vi' ? 'Đã đóng hợp đồng, thu hồi PIN; khoản hoàn cọc đang chờ xử lý.' : 'Rental closed, PIN revoked; refund pending processing.')
                  } catch (err: any) {
                    showToast(err?.message || (lang === 'vi' ? 'Không thể hoàn tất trả kho' : 'Could not complete return'))
                  }
                }}
              >
                 {lang === 'vi' ? 'Hoàn tất Check-out & đóng hợp đồng' : 'Complete Check-out & Close Rental'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL: STAFF TICKET RESPONSE ──────────────────────── */}
      <Modal
        open={respondModal}
        onClose={() => setRespondModal(false)}
        title={lang === 'vi' ? 'Phản Hồi & Đổi Trạng Thái Phiếu' : 'Ticket Response'}
      >
        {selectedStaffTicket && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#292a27] p-3 text-white text-xs">
              <p className="text-amber-400 font-mono">{selectedStaffTicket.id} · {selectedStaffTicket.facility}</p>
              <h3 className="font-bold text-sm text-stone-100 mt-0.5">{selectedStaffTicket.subject}</h3>
              <p className="text-stone-300 mt-1">{lang === 'vi' ? 'Khách' : 'Customer'}: {selectedStaffTicket.customer} · {lang === 'vi' ? 'Gian kho' : 'Unit'}: {selectedStaffTicket.unit}</p>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {selectedStaffTicket.messages.map(msg => (
                <div key={msg.id} className="p-2 rounded bg-stone-50 border border-stone-200 text-xs">
                  <div className="flex justify-between text-stone-400 text-[10px]">
                    <b>{msg.sender} ({msg.role})</b>
                    <span>{msg.time}</span>
                  </div>
                  <p className="mt-1">{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">{lang === 'vi' ? 'Cập nhật trạng thái' : 'Update status'}</label>
                <select
                  value={ticketNewStatus}
                  onChange={e => setTicketNewStatus(e.target.value as any)}
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs bg-white"
                >
                  <option value="open">{lang === 'vi' ? 'Mở mới' : 'Open'}</option>
                  <option value="in-progress">{lang === 'vi' ? 'Đang khắc phục' : 'In Progress'}</option>
                  <option value="resolved">{lang === 'vi' ? 'Đã giải quyết' : 'Resolved'}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">{lang === 'vi' ? 'Nhân viên xử lý' : 'Assigned staff'}</label>
                <input
                  type="text"
                  readOnly
                  value={user.name}
                  className="w-full border border-stone-200 rounded-lg p-2 text-xs bg-stone-100"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">{lang === 'vi' ? 'Nội dung trả lời khách' : 'Response to customer'}</label>
              <textarea
                rows={3}
                placeholder={lang === 'vi' ? 'Nhập hướng dẫn, mã PIN cấp lại hoặc thông báo...' : 'Enter instructions, a replacement PIN, or an update...'}
                value={staffReplyText}
                onChange={e => setStaffReplyText(e.target.value)}
                className="w-full border border-stone-300 rounded-lg p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
              <Button variant="outline" onClick={() => setRespondModal(false)}>{lang === 'vi' ? 'Hủy' : 'Cancel'}</Button>
              <Button
                onClick={() => {
                  respondSupportTicket(selectedStaffTicket.id, staffReplyText, ticketNewStatus, user)
                  setRespondModal(false)
                  setStaffReplyText('')
                  showToast(lang === 'vi' ? 'Đã gửi phản hồi đến khách hàng!' : 'Response sent!')
                }}
              >
                {lang === 'vi' ? 'Lưu & Phản hồi' : 'Dispatch'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
