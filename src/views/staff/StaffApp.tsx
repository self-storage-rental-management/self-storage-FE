import { useState } from 'react'
import Layout, { getInitialPage, Icon } from '../../components/Layout'
import { Badge, Button, Card, StatCard, Table, Thead, Tbody, Th, Td, Tr, SectionHeader, Modal, Tabs, Avatar } from '../../components/ui'
import ProfileView from '../ProfileView'
import { useLanguage } from '../../i18n/LanguageContext'
import type { User } from '../../types'
import { TASKS, RESERVATIONS, CHECKINS, RETURNS, SUPPORT_TICKETS } from "../../data/demoDatabase"

const taskTitleVi: Record<string, string> = {
  't1': 'Kiểm tra hệ thống cảm biến nhiệt độ & độ ẩm Tầng 2',
  't2': 'Nghiệm thu kho B-04 chuẩn bị thủ tục trả kho cho khách',
  't3': 'Hỗ trợ khách hàng đổi mã PIN và kích hoạt thẻ từ cổng',
  't4': 'Đi tuần tra kiểm tra an ninh toàn bộ khuôn viên kho',
  't5': 'Rà soát danh sách chốt khóa kho nợ quá hạn'
}

const statusLabelMap: Record<string, Record<string, string>> = {
  vi: {
    confirmed: 'Đã xác nhận',
    pending: 'Chờ duyệt',
    completed: 'Hoàn tất',
    scheduled: 'Đã lên lịch',
    'pending-payment': 'Chờ thanh toán',
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
    confirmed: 'Confirmed',
    pending: 'Pending',
    completed: 'Completed',
    scheduled: 'Scheduled',
    'pending-payment': 'Pending Payment',
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
    rentals,
    returns,
    renewals,
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
    completeReturnRefund,
    completeRenewalAtFacility,
    respondSupportTicket
  } = useStorageHub()

  const NAV = [
    { id: 'tasks', label: lang === 'vi' ? 'Nhiệm vụ trong ngày' : 'Daily Tasks', icon: Icon.tasks, group: lang === 'vi' ? 'Ca làm việc' : 'Work Queue' },
    { id: 'reservations', label: lang === 'vi' ? 'Xác nhận đặt kho' : 'Reservations', icon: Icon.calendar, group: lang === 'vi' ? 'Dịch vụ khách hàng' : 'Customer Service' },
    { id: 'checkin', label: lang === 'vi' ? 'Bàn giao & Nhận kho' : 'Check-in / Handover', icon: Icon.truck, group: lang === 'vi' ? 'Dịch vụ khách hàng' : 'Customer Service' },
    { id: 'renewals', label: lang === 'vi' ? 'Ký & thu tiền gia hạn' : 'Renewal signing', icon: Icon.calendar, group: lang === 'vi' ? 'Dịch vụ khách hàng' : 'Customer Service' },
    { id: 'return', label: lang === 'vi' ? 'Nghiệm thu trả kho' : 'Return Inspection', icon: Icon.clipboard, group: lang === 'vi' ? 'Dịch vụ khách hàng' : 'Customer Service' },
    { id: 'support', label: lang === 'vi' ? 'Hỗ trợ khách hàng' : 'Support Tickets', icon: Icon.support, group: lang === 'vi' ? 'Chăm sóc & Hỗ trợ' : 'Support' },
  ]

  const [page, setPage] = useState(() => getInitialPage(NAV, 'tasks'))
  const [tasks, setTasks] = useState(TASKS)
  const [reservations, setReservations] = useState(RESERVATIONS)
  const [checkins, setCheckins] = useState(CHECKINS)
  const [returns, setReturns] = useState(RETURNS)
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
  const [renewalContractForms, setRenewalContractForms] = useState<Record<string, {
    transactionReference: string
    contractNumber: string
    signedAt: string
    identityVerified: boolean
    unitAndTermsVerified: boolean
    scannedFileUrl: string
    scannedFileName: string
  }>>({})

  // Support Tickets state
  const [staffTickets, setStaffTickets] = useState(SUPPORT_TICKETS)
  const [selectedStaffTicket, setSelectedStaffTicket] = useState<typeof SUPPORT_TICKETS[0] | null>(null)
  const [respondModal, setRespondModal] = useState(false)
  const [staffReplyText, setStaffReplyText] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const s = (v: string, map: Record<string, string>) => {
    const label = statusLabelMap[lang]?.[v] || (v.charAt(0).toUpperCase() + v.slice(1).replace(/-/g, ' '))
    return <Badge variant={map[v] ?? 'muted'}>{label}</Badge>
  }

  // Facility Scoping (P1.4): staff sees items belonging to user.facility
  const demoAllFacilities = user.id === 'demo-staff' || user.email.toLowerCase().endsWith('@storagehub.demo')
  const scopedFacility = !demoAllFacilities && user.facility && user.facility !== 'All facilities' ? user.facility : null
  const scopedHolds = holds.filter(h => !scopedFacility || h.facilityName === scopedFacility)
  // A reservation is the authoritative source for the latest appointment,
  // assigned unit and customer details. Older saved check-in records may still
  // contain the values captured before a reschedule or unit reassignment.
  const reservationCheckins = checkins.map(raw => {
    const checkin = normalizeCheckin(raw)
    const hold = holds.find(item => item.id === checkin.holdId)
    if (!hold) return checkin
    return {
      ...checkin,
      unitId: hold.assignedUnitId || checkin.unitId,
      facilityId: hold.facilityId || checkin.facilityId,
      customerId: hold.customerId || checkin.customerId,
      customerName: hold.customerName || checkin.customerName,
      scheduledDate: hold.appointmentDate || hold.moveInDate || checkin.scheduledDate,
      scheduledTime: hold.appointmentTime || checkin.scheduledTime
    }
  })
  const checkinHoldIds = new Set(reservationCheckins.map(item => item.holdId))
  const recoveredCheckins = holds
    .filter(hold => hold.assignedUnitId && hold.appointmentDate && hold.appointmentTime && !checkinHoldIds.has(hold.id) && !['CANCELLED', 'EXPIRED', 'COMPLETED'].includes(hold.status))
    .map(hold => normalizeCheckin({
      id: `CHK-${hold.id}`,
      holdId: hold.id,
      unitId: hold.assignedUnitId!,
      facilityId: hold.facilityId,
      customerId: hold.customerId,
      customerName: hold.customerName,
      staffId: '',
      staffName: lang === 'vi' ? 'Chưa phân công' : 'Unassigned',
      scheduledDate: hold.appointmentDate!,
      scheduledTime: hold.appointmentTime!,
      status: 'scheduled',
      checklist: { identityVerified: false, termsAccepted: false, paymentConfirmed: hold.payment.status === 'paid', unitWalkthrough: false, accessCodeIssued: false },
      actualMeasurements: { lengthCm: hold.goods.lengthCm, widthCm: hold.goods.widthCm, heightCm: hold.goods.heightCm, weightKg: hold.goods.weightKg, actualVolumeM3: (hold.goods.lengthCm * hold.goods.widthCm * hold.goods.heightCm * hold.goods.packageCount) / 1_000_000, varianceAccepted: false },
      initialCondition: '',
      evidencePhotos: []
    }))
  const scopedCheckins = [...recoveredCheckins, ...reservationCheckins].filter(c => {
    const hold = holds.find(h => h.id === c.holdId)
    return !scopedFacility || hold?.facilityName === scopedFacility
  })
  const scopedReturns = returns.filter(r => !scopedFacility || r.facilityName === scopedFacility)
  const scopedRenewals = renewals.filter(item => !scopedFacility || rentals.find(rental => rental.id === item.rentalId)?.facilityName === scopedFacility)
  const scopedTickets = tickets.filter(t => !scopedFacility || t.facility === scopedFacility || t.relatedType === 'general')

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

  // Keep an already-open Staff check-in form in sync when the Customer
  // reschedules from another page/tab. Previously the modal retained the
  // appointment snapshot captured when it was opened, so its date validation
  // could continue disabling Check-in against the old schedule.
  useEffect(() => {
    if (!checkinModal || !selectedCheckin) return

    const latestRaw = checkins.find(item => item.holdId === selectedCheckin.holdId)
    if (!latestRaw) return

    const normalizedLatest = normalizeCheckin(latestRaw)
    const latestHold = holds.find(item => item.id === selectedCheckin.holdId)
    const latest = latestHold
      ? {
          ...normalizedLatest,
          unitId: latestHold.assignedUnitId || normalizedLatest.unitId,
          facilityId: latestHold.facilityId || normalizedLatest.facilityId,
          customerId: latestHold.customerId || normalizedLatest.customerId,
          customerName: latestHold.customerName || normalizedLatest.customerName,
          scheduledDate: latestHold.appointmentDate || latestHold.moveInDate || normalizedLatest.scheduledDate,
          scheduledTime: latestHold.appointmentTime || normalizedLatest.scheduledTime
        }
      : normalizedLatest
    const scheduleChanged = latest.scheduledDate !== selectedCheckin.scheduledDate
      || latest.scheduledTime !== selectedCheckin.scheduledTime
    const recordChanged = scheduleChanged
      || latest.status !== selectedCheckin.status
      || latest.unitId !== selectedCheckin.unitId

    if (!recordChanged) return

    const previousScheduledDate = selectedCheckin.scheduledDate
    setSelectedCheckin(latest)

    if (scheduleChanged) {
      // Preserve Staff-entered dates, but move the untouched defaults to the
      // Customer's newly selected appointment date.
      setContractSignedAt(current => !current || current === previousScheduledDate ? latest.scheduledDate : current)
      setContractStartAt(current => !current || current === previousScheduledDate ? latest.scheduledDate : current)
      showToast(
        lang === 'vi'
          ? `Lịch Check-in vừa được cập nhật: ${latest.scheduledDate} · ${latest.scheduledTime}`
          : `Check-in schedule updated: ${latest.scheduledDate} · ${latest.scheduledTime}`
      )
    }
  }, [checkins, holds, checkinModal, selectedCheckin, lang])

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
      user={user} navItems={NAV} currentPage={page} onNavigate={setPage} onLogout={onLogout}
      roleLabel="Staff" roleColor="bg-green-100 text-green-700"
    >
      {/* ── DAILY TASKS ───────────────────────────────────────── */}
      {page === 'tasks' && (
        <div className="fade-in">
          <SectionHeader
            eyebrow={lang === 'vi' ? 'CỔNG NHÂN VIÊN · XÁC NHẬN NGHIỆP VỤ' : 'STAFF PORTAL · OPERATIONAL VERIFICATION'}
            title={t('tasks.title', 'Daily Tasks')}
            subtitle={`${new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
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
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${tItem.done ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-blue-400'
                    }`}
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

      {/* ── RESERVATIONS ──────────────────────────────────────── */}
      {page === 'reservations' && (
        <div className="fade-in">
          <SectionHeader
            title={t('reservations.title', 'Reservation Verification')}
            subtitle={t('reservations.subtitle', 'Review and confirm incoming reservations')}
          />
          <Card>
            <Table>
              <Thead>
                <tr>
                  <Th>{t('reservations.col.id', 'Reservation')}</Th>
                  <Th>{t('reservations.col.customer', 'Customer')}</Th>
                  <Th>{t('reservations.col.unit', 'Unit')}</Th>
                  <Th>{t('reservations.col.moveIn', 'Move-in')}</Th>
                  <Th>{t('reservations.col.payment', 'Payment')}</Th>
                  <Th>{t('reservations.col.status', 'Status')}</Th>
                  <Th>{t('reservations.col.actions', 'Actions')}</Th>
                </tr>
              </Thead>
              <Tbody>
                {reservations.map(r => (
                  <Tr key={r.id}>
                    <Td><span className="font-mono text-xs text-slate-500">{r.id}</span></Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar name={r.customer} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{r.customer}</p>
                          <p className="text-xs text-slate-400">{r.phone}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <p className="font-medium">{r.unit}</p>
                      <p className="text-xs text-slate-400">{r.size} ft²</p>
                    </Td>
                    <Td>{r.moveIn}</Td>
                    <Td>{r.paid ? <Badge variant="success">{t('reservations.paid', 'Paid')}</Badge> : <Badge variant="error">{t('reservations.unpaid', 'Unpaid')}</Badge>}</Td>
                    <Td>{s(r.status, { confirmed: 'success', pending: 'warning' })}</Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedReservation(r); setReservationModal(true) }}>{t('reservations.view', 'View')}</Button>
                        {r.status === 'pending' && <Button variant="primary" size="sm" onClick={() => {
                          setReservations(items => items.map(item => item.id === r.id ? { ...item, status: 'confirmed', evidence: [...item.evidence, `STAFF-${Date.now()} · ${user.name} xác nhận giữ kho`] } : item))
                          showToast(lang === 'vi' ? 'Đã xác nhận yêu cầu giữ kho; không ký thay khách hàng.' : 'Storage hold confirmed; no contract was signed on the customer’s behalf.')
                        }}>{lang === 'vi' ? 'Xác nhận giữ kho' : 'Confirm hold'}</Button>}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ── CHECK-IN / HANDOVER ───────────────────────────────── */}
      {page === 'checkin' && (
        <div className="fade-in">
          <SectionHeader
            title={t('checkin.title', 'Check-in / Handover')}
            subtitle={t('checkin.subtitle', 'Process customer move-ins and unit handovers')}
          />
          <div className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900"><b>{lang === 'vi' ? 'Khung giờ Check-in 24/7 đang được bật để kiểm thử.' : '24/7 check-in is enabled for testing.'}</b> {lang === 'vi' ? 'Staff có thể thực hiện bàn giao vào mọi giờ đã được Customer đặt; hạn Check-in trong 14 ngày sau khi đóng cọc vẫn giữ nguyên.' : 'Staff may process handover at any customer-selected time; the 14-day deadline after deposit remains unchanged.'}</div>

          <div className="space-y-3">
            {checkins.map(c => (
              <Card key={c.id} className="p-5">
                <div className="flex flex-wrap items-center gap-4 justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <Avatar name={c.customer} size="sm" />
                      <div>
                        <h3 className="font-semibold text-slate-900">{c.customerName}</h3>
                        <p className="text-xs font-semibold text-amber-700">{c.holdId}</p>
                        <p className="text-xs text-slate-500">{lang === 'vi' ? 'Gian kho' : 'Unit'} <b>{c.unitId}</b> · {lang === 'vi' ? 'Lịch hẹn' : 'Appointment'}: <b>{c.scheduledDate} ({c.scheduledTime})</b></p>
                        <p className="mt-1 text-xs text-slate-600">
                          {c.actualMeasurements?.lengthCm ?? 0}×{c.actualMeasurements?.widthCm ?? 0}×{c.actualMeasurements?.heightCm ?? 0}cm · {lang === 'vi' ? 'Cân thực' : 'Actual weight'}: {c.actualMeasurements?.weightKg ?? 0}kg · {lang === 'vi' ? 'Thể tích' : 'Volume'}: {typeof c.actualMeasurements?.actualVolumeM3 === 'number' ? c.actualMeasurements.actualVolumeM3.toFixed(2) : ((((c.actualMeasurements?.lengthCm ?? 0) * (c.actualMeasurements?.widthCm ?? 0) * (c.actualMeasurements?.heightCm ?? 0)) / 1000000).toFixed(2))} m³
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {s(c.status, { scheduled: 'info', 'pending-payment': 'warning', completed: 'success' })}
                    {c.status !== 'completed' && (
                      <Button variant="primary" size="sm" onClick={() => { setSelectedCheckin(c); setCheckinModal(true) }}>
                        {t('checkin.process', 'Process Check-in')}
                      </Button>
                    )}
                    {c.status === 'completed' && <Button variant="ghost" size="sm">{t('checkin.viewRecord', 'View Record')}</Button>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {page === 'renewals' && (
        <div className="fade-in space-y-4">
          <SectionHeader title={lang === 'vi' ? 'Ký Hợp Đồng & Thu Tiền Gia Hạn' : 'Renewal Contract & Payment'} subtitle={lang === 'vi' ? 'Đối chiếu lại hồ sơ như Check-in, ký hợp đồng gia hạn mới, tải bản ký và thu phần tiền còn lại.' : 'Recheck the file as at check-in, sign and upload a new renewal contract, then collect the remaining payment.'} />
          <div className="space-y-3">
            {scopedRenewals.filter(item => item.status === 'appointment_scheduled').map(item => {
              const amountDue = Math.round(((item.remainingAmount || 0) + (item.lateFeeAmount || 0)) * 100) / 100
              const form = renewalContractForms[item.id] || { transactionReference: '', contractNumber: '', signedAt: '', identityVerified: false, unitAndTermsVerified: false, scannedFileUrl: '', scannedFileName: '' }
              const updateForm = (updates: Partial<typeof form>) => setRenewalContractForms(current => ({ ...current, [item.id]: { ...form, ...updates } }))
              const ready = form.transactionReference.trim() && form.contractNumber.trim() && form.signedAt && form.identityVerified && form.unitAndTermsVerified && form.scannedFileUrl
              return <Card key={item.id} className="p-5">
                <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
                  <div>
                    <p className="font-bold text-stone-950">{item.id} · {item.customerName}</p>
                    <p className="mt-1 text-sm text-stone-600">{lang === 'vi' ? 'Gian kho' : 'Unit'} {item.unitId} · {item.oldEndDate} → {item.newEndDate}</p>
                    <p className="mt-2 font-semibold text-blue-800">{lang === 'vi' ? `Lịch ký: ${item.appointmentDate} lúc ${item.appointmentTime}` : `Signing: ${item.appointmentDate} at ${item.appointmentTime}`}</p>
                    <div className="mt-3 grid gap-1 text-xs text-stone-600 sm:grid-cols-2"><p>{lang === 'vi' ? 'Đã cọc 20%' : '20% deposit paid'}: <b>${item.bookingDepositAmount}</b></p><p>{lang === 'vi' ? '80% còn lại' : 'Remaining 80%'}: <b>${item.remainingAmount}</b></p><p>{lang === 'vi' ? 'Số ngày trễ' : 'Late days'}: <b>{item.overdueDays || 0}</b></p><p>{lang === 'vi' ? 'Phụ thu trễ' : 'Late fee'}: <b>${item.lateFeeAmount || 0}</b></p></div>
                    <div className="mt-4 rounded-lg bg-amber-50 p-3"><p className="text-xs text-amber-800">{lang === 'vi' ? 'Tổng cần thu tại cơ sở' : 'Total due on site'}</p><p className="text-2xl font-extrabold text-amber-950">${amountDue}</p></div>
                  </div>
                  <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-stone-700">{lang === 'vi' ? 'Kiểm tra và phát hành hợp đồng gia hạn mới' : 'Verify and issue a new renewal contract'}</p>
                    <label className="flex items-start gap-2 text-xs text-stone-700"><input type="checkbox" className="mt-0.5" checked={form.identityVerified} onChange={event => updateForm({ identityVerified: event.target.checked })} /><span>{lang === 'vi' ? 'Đã đối chiếu CCCD/Hộ chiếu và thông tin khách hàng.' : 'Customer identity and profile have been verified.'}</span></label>
                    <label className="flex items-start gap-2 text-xs text-stone-700"><input type="checkbox" className="mt-0.5" checked={form.unitAndTermsVerified} onChange={event => updateForm({ unitAndTermsVerified: event.target.checked })} /><span>{lang === 'vi' ? 'Đã kiểm tra gian kho, thời hạn, đơn giá và điều khoản của kỳ gia hạn.' : 'Unit, term, rate and renewal conditions have been verified.'}</span></label>
                    <div className="grid gap-3 sm:grid-cols-2"><Input label={lang === 'vi' ? 'Số hợp đồng gia hạn mới' : 'New renewal contract number'} value={form.contractNumber} onChange={event => updateForm({ contractNumber: event.target.value })} placeholder="VD: HD-RNW-001" /><Input label={lang === 'vi' ? 'Ngày ký hợp đồng' : 'Contract signing date'} type="date" value={form.signedAt} onChange={event => updateForm({ signedAt: event.target.value })} /></div>
                    <Input label={lang === 'vi' ? 'Mã phiếu thu / mã giao dịch' : 'Receipt / transaction reference'} value={form.transactionReference} onChange={event => updateForm({ transactionReference: event.target.value })} placeholder="VD: PT-RNW-001" />
                    <label className="block rounded-lg border border-dashed border-stone-300 bg-white p-3 text-xs"><span className="font-semibold text-stone-700">{lang === 'vi' ? 'Bản hợp đồng gia hạn đã ký (PDF/JPG, tối đa 1 MB)' : 'Signed renewal contract (PDF/JPG, max 1 MB)'}</span><input className="mt-2 block w-full" type="file" accept="application/pdf,image/jpeg" onChange={event => { const file = event.target.files?.[0]; if (!file || !['application/pdf', 'image/jpeg'].includes(file.type) || file.size > 1_000_000) { updateForm({ scannedFileUrl: '', scannedFileName: '' }); showToast(lang === 'vi' ? 'Chỉ nhận PDF/JPG tối đa 1 MB.' : 'PDF/JPG only, max 1 MB.'); return } const reader = new FileReader(); reader.onload = () => updateForm({ scannedFileUrl: String(reader.result), scannedFileName: file.name }); reader.readAsDataURL(file) }} />{form.scannedFileName && <span className="mt-2 block font-semibold text-emerald-700">✓ {form.scannedFileName}</span>}</label>
                    <Button className="w-full" disabled={!ready} onClick={() => { if (!window.confirm(lang === 'vi' ? `Xác nhận đã kiểm tra hồ sơ, ký hợp đồng gia hạn mới và thu $${amountDue}?` : `Confirm verification, new renewal contract and $${amountDue} payment?`)) return; try { completeRenewalAtFacility({ renewalId: item.id, staffUser: user, transactionReference: form.transactionReference.trim(), identityVerified: form.identityVerified, unitAndTermsVerified: form.unitAndTermsVerified, contractNumber: form.contractNumber.trim(), signedAt: form.signedAt, scannedFileUrl: form.scannedFileUrl, scannedFileName: form.scannedFileName }); showToast(lang === 'vi' ? `Đã phát hành hợp đồng ${form.contractNumber} và hoàn tất gia hạn.` : `Contract ${form.contractNumber} issued and renewal completed.`) } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể hoàn tất gia hạn.') } }}>{lang === 'vi' ? 'Xác nhận hợp đồng mới & đã thu đủ' : 'Confirm new contract & payment'}</Button>
                  </div>
                </div>
              </Card>
            })}
            {!scopedRenewals.some(item => item.status === 'appointment_scheduled') && <Card className="p-8 text-center text-sm text-stone-500">{lang === 'vi' ? 'Chưa có lịch ký gia hạn cần xử lý.' : 'No renewal signing appointments to process.'}</Card>}
          </div>
        </div>
      )}

      {/* ── RETURN INSPECTION & SETTLEMENT (P0.6) ──────────────── */}
      {page === 'return' && (
        <div className="fade-in">
          <SectionHeader
            eyebrow={lang === 'vi' ? 'CỔNG NHÂN VIÊN · KIỂM KÊ & BẰNG CHỨNG' : 'STAFF PORTAL · INVENTORY & EVIDENCE'}
            title={t('return.title', 'Return Inspection')}
            subtitle={lang === 'vi' ? 'Đối chiếu hiện trạng trước–sau, kiểm kê hàng hóa, phân loại và lưu bằng chứng' : 'Compare before/after condition, inventory goods, classify and retain evidence'}
          />
          <Card>
            <Table>
              <Thead>
                <tr>
                  <Th>{t('return.col.id', 'Return ID')}</Th>
                  <Th>{t('return.col.customer', 'Customer')}</Th>
                  <Th>{t('return.col.unit', 'Unit')}</Th>
                  <Th>{t('return.col.date', 'Return Date')}</Th>
                  <Th>{t('return.col.condition', 'Condition')}</Th>
                  <Th>{t('return.col.deposit', 'Deposit')}</Th>
                  <Th>{t('return.col.status', 'Status')}</Th>
                  <Th></Th>
                </tr>
              </Thead>
              <Tbody>
                {returns.map(r => (
                  <Tr key={r.id}>
                    <Td><span className="font-mono text-xs text-slate-500">{r.id}</span></Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar name={r.customer} size="sm" />
                        <span className="text-sm font-medium">{r.customer}</span>
                      </div>
                    </Td>
                    <Td className="font-bold">{r.unitId}</Td>
                    <Td>{r.scheduledDate}</Td>
                    <Td className="font-semibold text-emerald-700">${r.depositAmount}</Td>
                    <Td>{s(r.status, { inspected: 'info', requested: 'warning', scheduled: 'info', completed: 'success' })}</Td>
                    <Td className="text-right">
                      {['requested', 'scheduled', 'inspected'].includes(r.status) ? (
                        <Button variant="primary" size="sm" onClick={() => openReturnInspect(r)}>
                           {lang === 'vi' ? 'Nghiệm thu' : 'Inspect'}
                        </Button>
                      ) : r.status === 'awaiting_customer_confirmation' ? (
                        <Badge variant="warning">{lang === 'vi' ? 'Chờ khách xác nhận' : 'Awaiting customer'}</Badge>
                      ) : r.status === 'disputed' ? (
                        <Badge variant="error">{lang === 'vi' ? 'Khách yêu cầu xem lại' : 'Customer disputed'}</Badge>
                      ) : r.status === 'payment_due' ? (
                        <Badge variant="error">{lang === 'vi' ? `Chờ khách đóng thêm $${r.amountDueFromCustomer || 0}` : `Awaiting $${r.amountDueFromCustomer || 0} payment`}</Badge>
                      ) : r.status === 'refund_pending' ? (
                        <Button size="sm" onClick={() => { const reference = window.prompt(lang === 'vi' ? 'Nhập mã giao dịch ngân hàng hoàn cọc:' : 'Enter the refund bank transaction reference:'); if (!reference?.trim()) return; try { completeReturnRefund(r.id, user, reference.trim()); showToast(lang === 'vi' ? 'Đã xác nhận chuyển hoàn cọc cho Customer.' : 'Refund transfer confirmed.') } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể xác nhận hoàn cọc.') } }}>{lang === 'vi' ? 'Xác nhận đã hoàn cọc' : 'Confirm refund'}</Button>
                      ) : (
                        <Badge variant="muted"> {lang === 'vi' ? `Đã hoàn cọc $${r.netRefundAmount}` : `Refunded $${r.netRefundAmount}`}</Badge>
                      )}
                      {r.status !== 'pending' && <Button variant="ghost" size="sm">{t('return.action.details', 'Details')}</Button>}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ── SUPPORT ───────────────────────────────────────────── */}
      {page === 'support' && (() => {
        const displayedTickets = scopedTickets.filter(t => {
          if (ticketTab === 'All' || ticketTab === 'Tất Cả') return true
          if (ticketTab === 'Open' || ticketTab === 'Chờ Xử Lý') return t.status === 'open'
          if (ticketTab === 'In Progress' || ticketTab === 'Đang Khắc Phục') return t.status === 'in-progress'
          return t.status === 'resolved'
        })

        return (
          <div className="fade-in space-y-5">
            <SectionHeader
              title={t('support.title', 'Support Queue & Dispatch')}
              subtitle={t('support.subtitle', 'Triage incoming tenant inquiries, resolve access glitches, and log resolutions')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title={t('support.stat.awaiting', 'Awaiting Response')}
                value={openCount}
                delta={openCount > 0 ? (lang === 'vi' ? 'Cần xử lý gấp' : 'Urgent triage') : (lang === 'vi' ? 'Đã giải quyết hết' : 'Clear queue')}
                deltaPositive={openCount === 0}
                icon={Icon.alert}
                iconBg="bg-amber-50 text-amber-800"
              />
              <StatCard
                title={t('support.stat.inProgress', 'In Progress')}
                value={inProgressCount}
                icon={Icon.refresh}
                iconBg="bg-blue-50 text-blue-700"
              />
              <StatCard
                title={t('support.stat.resolved', 'Resolved Tickets')}
                value={resolvedCount}
                icon={Icon.check}
                iconBg="bg-emerald-50 text-emerald-700"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Tabs
                tabs={lang === 'vi' ? ['Tất Cả', 'Chờ Xử Lý', 'Đang Khắc Phục', 'Đã Giải Quyết'] : ['All', 'Open', 'In Progress', 'Resolved']}
                active={ticketTab === 'All' ? (lang === 'vi' ? 'Tất Cả' : 'All') : ticketTab === 'Open' ? (lang === 'vi' ? 'Chờ Xử Lý' : 'Open') : ticketTab === 'In Progress' ? (lang === 'vi' ? 'Đang Khắc Phục' : 'In Progress') : (lang === 'vi' ? 'Đã Giải Quyết' : 'Resolved')}
                onChange={newTab => {
                  if (newTab === 'Tất Cả' || newTab === 'All') setTicketTab('All')
                  else if (newTab === 'Chờ Xử Lý' || newTab === 'Open') setTicketTab('Open')
                  else if (newTab === 'Đang Khắc Phục' || newTab === 'In Progress') setTicketTab('In Progress')
                  else setTicketTab('Resolved')
                }}
              />
            </div>

            <Card>
              <Table>
                <Thead>
                  <tr>
                    <Th>{t('support.col.id', 'Ticket ID')}</Th>
                    <Th>{t('support.col.tenant', 'Tenant Customer')}</Th>
                    <Th>{t('support.col.subject', 'Subject & Facility')}</Th>
                    <Th>{t('support.col.category', 'Category')}</Th>
                    <Th>{t('support.col.priority', 'Priority')}</Th>
                    <Th>{t('support.col.opened', 'Opened Date')}</Th>
                    <Th>{t('support.col.status', 'Status')}</Th>
                    <Th className="text-right">{t('support.col.action', 'Action')}</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {displayedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-stone-400 text-sm">
                        {t('support.empty', 'No tickets currently in this queue.')}
                      </td>
                    </tr>
                  ) : (
                    displayedTickets.map(tItem => (
                      <Tr key={tItem.id}>
                        <Td><span className="font-mono text-xs font-semibold text-stone-600">{tItem.id}</span></Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <Avatar name={tItem.customer} size="sm" />
                            <div>
                              <span className="text-sm font-medium text-stone-900 block">{tItem.customer}</span>
                              <span className="text-[11px] text-stone-400">{tItem.email}</span>
                            </div>
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
                            setRespondModal(true)
                          }}
                        >
                          {lang === 'vi' ? 'Phản hồi' : 'Respond'} ({tItem.messages.length})
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                  {!displayedTickets.length && <Tr><Td className="py-10 text-center" colSpan={6}>{lang === 'vi' ? 'Không có phiếu hỗ trợ trong trạng thái này.' : 'No support tickets in this status.'}</Td></Tr>}
                </Tbody>
              </Table>
            </Card>
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
      <Modal open={reservationModal} onClose={() => setReservationModal(false)} size="xl" title={lang === 'vi' ? 'Hồ Sơ Yêu Cầu Giữ Kho' : 'Storage Hold Request'}>
        {selectedReservation && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Khách hàng</p><b>{selectedReservation.customer}</b><p className="text-xs">{selectedReservation.phone}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Email</p><b>{selectedReservation.email}</b><p className="text-xs">{selectedReservation.emailVerified ? '✓ Đã xác nhận' : '⚠ Chưa xác nhận'}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Cơ sở / kho</p><b>{selectedReservation.facility} · {selectedReservation.unit}</b><p className="text-xs">{selectedReservation.facilityAddress}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">CCCD</p><b>{selectedReservation.identityId}</b><p className="text-xs">Đối chiếu bản gốc khi check-in</p></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><p className="text-xs text-slate-500">Loại hàng</p><b>{selectedReservation.goodsType}</b></div>
              <div><p className="text-xs text-slate-500">Chất liệu</p><b>{selectedReservation.material}</b></div>
              <div><p className="text-xs text-slate-500">Số kiện / cân thực</p><b>{selectedReservation.packageCount} / {selectedReservation.weightKg} kg</b></div>
              <div><p className="text-xs text-slate-500">Kích thước / DIM</p><b>{selectedReservation.dimensionsCm} cm / {selectedReservation.dimWeightKg} kg</b></div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm"><b>Hiện trạng khai báo ban đầu:</b> {selectedReservation.initialCondition}</div>
            <div><p className="mb-2 text-sm font-semibold">Dẫn chứng hoạt động</p>{selectedReservation.evidence.map(item => <p key={item} className="mb-1 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-900">✓ {item}</p>)}</div>
            {!selectedReservation.emailVerified && <Button onClick={() => showToast(`Đã gửi lại email xác nhận đến ${selectedReservation.email}`)}>Gửi lại email xác nhận</Button>}
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
          const scheduledDay = new Date(`${selectedCheckin.scheduledDate}T00:00:00`)
          const todayDay = new Date(`${today}T00:00:00`)
          const deadlineDay = hold?.checkInDeadline ? new Date(hold.checkInDeadline) : null
          const dateTooEarly = todayDay.getTime() < scheduledDay.getTime()
          const dateExpired = Boolean(deadlineDay && todayDay.getTime() > deadlineDay.getTime())
          const dateReady = !dateTooEarly && !dateExpired
          const pinCred = accessCredentials.find(ac => ac.reservationId === hold?.id && ac.type === 'PIN')
          const activePin = hold?.generatedAccessPin || pinCred?.pinCode || '4921#'
          const allChecklistDone = Boolean(chkIdVerified && depositReady && contractReady && balanceReady && hasAssignedUnit && chkUnitWalkthrough && chkAccessCodeIssued)
          const handoverEvidenceReady = Boolean(handoverPhoto.trim() && actConditionNotes.trim())
          const canCompleteCheckIn = allChecklistDone && dateReady && handoverEvidenceReady

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
                <p className="text-stone-500">{selectedCheckin.holdId} · {lang === 'vi' ? 'Lịch Check-in' : 'Check-in schedule'}: {selectedCheckin.scheduledDate} · <b>{selectedCheckin.scheduledTime || '—'}</b></p>
                <p className="mt-1 text-[11px] font-semibold text-blue-700">{lang === 'vi' ? 'Khung giờ 24/7 đang được bật để kiểm thử.' : '24/7 check-in is temporarily enabled for testing.'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  <div>
                    <span className="text-stone-500 block text-[11px]">{lang === 'vi' ? '1. Cọc giữ chỗ (20% đã cọc online):' : '1. Reservation deposit (20% paid):'}</span>
                    <b className="text-emerald-700 font-mono text-sm">${hold?.reservationDepositAmount ?? 36}</b>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">{lang === 'vi' ? '2. Tiền đảm bảo kho (thu riêng tại Check-in):' : '2. Storage security deposit (collected at check-in):'}</span>
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
                {dateTooEarly && <p className="rounded-md bg-red-50 p-2 font-semibold text-red-700">{lang === 'vi' ? `Chưa đến ngày hẹn. Hôm nay ${today}, lịch Check-in là ${selectedCheckin.scheduledDate}. Customer cần đổi lịch về hôm nay nếu muốn Check-in sớm.` : `Too early. Today is ${today}; the appointment is ${selectedCheckin.scheduledDate}. The customer must reschedule to today for an earlier check-in.`}</p>}
                {dateExpired && <p className="rounded-md bg-red-50 p-2 font-semibold text-red-700">{lang === 'vi' ? 'Đã quá hạn Check-in 14 ngày sau khi đóng cọc. Không thể kích hoạt hồ sơ.' : 'The 14-day check-in deadline has passed. The rental cannot be activated.'}</p>}
                {dateReady && selectedCheckin.scheduledDate !== today && <p className="rounded-md bg-amber-50 p-2 font-semibold text-amber-800">{lang === 'vi' ? `Khách đến sau lịch hẹn ${selectedCheckin.scheduledDate}; vẫn còn trong hạn Check-in nên Staff có thể tiếp tục.` : `The customer arrived after the ${selectedCheckin.scheduledDate} appointment but is still within the check-in deadline.`}</p>}
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
                  <p>{lang === 'vi' ? 'Tiền đảm bảo kho' : 'Storage security deposit'}: ${hold?.quote.depositAmount ?? 0}</p>
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
                      ? 'Cọc giữ chỗ 20% được trừ vào tiền thuê; tiền đảm bảo kho là khoản riêng được thu tại Check-in.'
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
                          showToast(lang === 'vi' ? `Đã lập phiếu thu $${hold?.remainingAmount} (${remPayMethod}), gồm tiền thuê còn lại và tiền đảm bảo kho.` : 'Payment recorded, including the remaining rent and storage security deposit.')
                        } catch (err: any) {
                          showToast(err?.message || 'Payment failed')
                        }
                      }}
                    >
                      {lang === 'vi' ? 'Lập phiếu thu tiền còn lại & tiền đảm bảo kho' : 'Record Balance & Security Deposit'}
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
                <p className="rounded-lg bg-blue-50 p-2 text-xs text-blue-800">
                  {lang === 'vi' ? 'Sau khi Staff hoàn tất bàn giao, Customer sẽ tự xác nhận đã nhận kho trong hồ sơ thuê.' : 'After staff completes handover, the customer confirms unit receipt from their rental record.'}
                </p>
              </div>

              <div className="flex justify-between items-center border-t border-stone-100 pt-3">
                <p className="text-xs text-stone-500">
                  {!hasAssignedUnit ? (
                    <span className="text-red-600 font-bold"> {lang === 'vi' ? 'Bắt buộc gán gian kho cụ thể trước khi bàn giao.' : 'A specific unit must be assigned before handover.'}</span>
                  ) : !allChecklistDone ? (
                    <span className="text-red-600 font-semibold">{lang === 'vi' ? 'Cần hợp đồng, thanh toán và 3 bước xác minh/bàn giao.' : 'Complete contract, payment and three staff checks.'}</span>
                  ) : dateTooEarly ? (
                    <span className="text-red-600 font-semibold">{lang === 'vi' ? `Chưa thể Check-in: lịch hẹn là ${selectedCheckin.scheduledDate}, hôm nay là ${today}.` : `Check-in is not available before ${selectedCheckin.scheduledDate}. Today is ${today}.`}</span>
                  ) : dateExpired ? (
                    <span className="text-red-600 font-semibold">{lang === 'vi' ? 'Không thể Check-in: đơn đã quá hạn 14 ngày.' : 'Check-in unavailable: the 14-day deadline has expired.'}</span>
                  ) : !handoverEvidenceReady ? (
                    <span className="text-red-600 font-semibold">{lang === 'vi' ? 'Cần nhập ảnh hiện trạng và ghi chú bàn giao.' : 'Condition evidence and handover notes are required.'}</span>
                  ) : (
                    <span className="text-emerald-700 font-semibold"> {lang === 'vi' ? 'Đã bàn giao PIN; sẵn sàng kích hoạt hồ sơ thuê.' : 'PIN handed over; ready to activate the rental.'}</span>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCheckinModal(false)}>{lang === 'vi' ? 'Hủy' : 'Cancel'}</Button>
                  <Button
                    disabled={!canCompleteCheckIn}
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
        {selectedReturn && (() => {
          const returnRental = rentals.find(rental => rental.id === selectedReturn.rentalId)
          const contractEnd = returnRental ? new Date(`${returnRental.endDate}T00:00:00`) : new Date()
          const today = new Date(); today.setHours(0, 0, 0, 0)
          const automaticOverdueDays = today.getTime() > contractEnd.getTime() ? Math.floor((today.getTime() - contractEnd.getTime()) / 86_400_000) : 0
          const automaticLateFeePerDay = returnRental ? Math.round(((returnRental.monthlyRate / 30) * 0.5) * 100) / 100 : 0
          const automaticOverdueFee = Math.round(automaticOverdueDays * automaticLateFeePerDay * 100) / 100
          const totalReturnFees = damageFee + cleaningFee + lostItemFee + automaticOverdueFee + outstandingFee
          const expectedRefund = Math.max(0, Math.round((selectedReturn.depositAmount - totalReturnFees) * 100) / 100)
          const additionalPayment = Math.max(0, Math.round((totalReturnFees - selectedReturn.depositAmount) * 100) / 100)
          return <div className="space-y-4">
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
              <p className="font-bold text-sm text-blue-950">{lang === 'vi' ? 'Quyết toán hoàn tiền đảm bảo kho' : 'Security Deposit Settlement'}</p>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('return.col.customer', 'Customer')}</span>
                <span className="font-medium">{selectedReturn.customer}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-500">{t('return.col.unit', 'Unit')}</span>
                <span className="font-medium">{selectedReturn.unit}</span>
              </div>
              {([
                [lang === 'vi' ? 'Vệ sinh kho' : 'Cleaning', cleaningFee, setCleaningFee],
                [lang === 'vi' ? 'Mất chìa khóa/thẻ' : 'Lost key/card', lostItemFee, setLostItemFee],
                [lang === 'vi' ? 'Công nợ khác' : 'Other outstanding balance', outstandingFee, setOutstandingFee]
              ] as [string, number, (value: number) => void][]).map(([label, value, setter]) => <div key={label} className="flex justify-between items-center"><span>{label}:</span><input type="number" min="0" value={value} onChange={e => setter(Math.max(0, Number(e.target.value)))} className="w-24 text-right border border-stone-300 rounded p-1" /></div>)}
              <div className="flex justify-between rounded bg-red-50 px-2 py-1.5 text-red-800"><span>{lang === 'vi' ? `Phí quá hạn tự động (${automaticOverdueDays} ngày × $${automaticLateFeePerDay}):` : `Automatic overdue fee (${automaticOverdueDays} days × $${automaticLateFeePerDay}):`}</span><b>${automaticOverdueFee}</b></div>
              <div className="border-t border-blue-200 pt-2 flex justify-between text-sm font-bold text-stone-900">
                <span>{lang === 'vi' ? 'Dự kiến hoàn cọc (chờ xử lý):' : 'Refund due (pending processing):'}</span>
                <span className="text-emerald-700 font-mono text-base">
                  ${expectedRefund}
                </span>
              </div>
              {additionalPayment > 0 && <div className="flex justify-between rounded-lg border border-red-300 bg-red-100 p-3 text-sm font-bold text-red-900"><span>{lang === 'vi' ? 'Tiền đảm bảo không đủ · Khách phải đóng thêm:' : 'Deposit insufficient · Customer must pay:'}</span><span className="font-mono text-base">${additionalPayment}</span></div>}
              <p className="text-[11px] text-stone-500 italic">
                {damageClass === 'no_damage' && cleaningFee === 0 && invMatch !== 'excess' && returnedItems.lock && lostItemFee === 0
                  ? (lang === 'vi' ? ' Gian kho đạt kiểm tra ban đầu nhưng vẫn chờ Manager nghiệm thu cuối trước khi chuyển sang AVAILABLE.' : ' The unit passes the initial inspection but still awaits final Manager approval before becoming AVAILABLE.')
                  : (lang === 'vi' ? ' Gian kho có hư hại sẽ tự động chuyển sang trạng thái MAINTENANCE để đội kỹ thuật xử lý.' : ' The damaged unit will move to MAINTENANCE for technical service.')}
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{lang === 'vi' ? 'Sau khi lưu kết quả nghiệm thu, khách hàng sẽ tự xem và xác nhận hoặc yêu cầu xem xét lại quyết toán trên tài khoản của họ.' : 'After inspection is saved, the customer reviews and accepts or disputes the settlement from their account.'}</div>

            <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
              <Button variant="outline" onClick={() => setInspectModal(false)}>{lang === 'vi' ? 'Hủy' : 'Cancel'}</Button>
              <Button
                disabled={!returnPhoto.trim() || !returnStaffNotes.trim()}
                onClick={() => {
                  try {
                    completeReturnInspection({
                      returnId: selectedReturn.id, staffUser: user, inventoryMatch: invMatch,
                      damageClassification: damageClass, damageFee, cleaningFee, lostItemFee, overdueFee: automaticOverdueFee,
                      outstandingFee, staffNotes: returnStaffNotes, evidencePhotos: [returnPhoto.trim()],
                      returnedItems
                    })
                    setInspectModal(false)
                    showToast(lang === 'vi' ? 'Đã lưu kết quả nghiệm thu và gửi quyết toán cho khách xác nhận.' : 'Inspection saved and settlement sent to the customer.')
                  } catch (err: any) {
                    showToast(err?.message || (lang === 'vi' ? 'Không thể hoàn tất trả kho' : 'Could not complete return'))
                  }
                }}
              >
                 {lang === 'vi' ? 'Gửi kết quả cho khách xác nhận' : 'Send result for customer confirmation'}
              </Button>
            </div>
          </div>
        })()}
      </Modal>

      <Modal open={checkinModal} onClose={() => setCheckinModal(false)} size="xl" title={lang === 'vi' ? 'Đối Chiếu & Xác Nhận Check-in Kho' : 'Verify Storage Check-in'}>
        {selectedCheckin && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('reservations.col.customer', 'Customer')}</span>
                <span className="font-medium">{selectedCheckin.customer}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-500">{t('reservations.col.unit', 'Unit')}</span>
                <span className="font-medium">{selectedCheckin.unit}</span>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-1 border-t border-slate-200 pt-2 sm:grid-cols-2">
                <span><b>Email:</b> {selectedCheckin.email}</span><span><b>SĐT:</b> {selectedCheckin.phone}</span>
                <span><b>CCCD:</b> {selectedCheckin.identityId}</span><span><b>Cơ sở:</b> {selectedCheckin.facility}</span>
                <span><b>Hàng:</b> {selectedCheckin.goodsType}</span><span><b>Chất liệu:</b> {selectedCheckin.material}</span>
                <span><b>Số kiện:</b> {selectedCheckin.packageCount}</span><span><b>Cân thực / DIM:</b> {selectedCheckin.weightKg} / {selectedCheckin.dimWeightKg} kg</span>
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"><b>Hiện trạng ban đầu cần đối chiếu:</b> {selectedCheckin.initialCondition}</div>
            <div className="space-y-2">
              {(lang === 'vi'
                ? [
                    'Đã đối chiếu giấy tờ tùy thân (CCCD / Hộ chiếu)',
                    'Đã xác nhận khách hàng tự chấp thuận điều khoản thuê kho (nhân viên không ký thay)',
                    'Đã thu tiền cọc và tiền thuê tháng đầu',
                    'Đã kích hoạt thẻ từ & cấp mã PIN mở cửa',
                    'Đã cùng khách nghiệm thu thực tế kho'
                  ]
                : ['ID verified', 'Customer acceptance confirmed (staff does not sign)', 'Payment confirmed', 'Access code issued', 'Unit walkthrough complete']
              ).map(step => (
                <label key={step} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm text-slate-700">{step}</span>
                </label>
              ))}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                {lang === 'vi' ? 'Ghi Chú Nhân Viên' : 'Staff Notes'}
              </label>
              <textarea
                rows={2}
                placeholder={lang === 'vi' ? 'Ghi chú thêm nếu có...' : 'Optional notes...'}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCheckinModal(false)}>{t('btn.cancel', 'Cancel')}</Button>
              <Button
                variant="primary"
                onClick={() => {
                  setCheckins(items => items.map(item => item.id === selectedCheckin.id ? { ...item, status: 'completed', evidence: [...item.evidence, `CHECKIN-${Date.now()} · ${user.name} xác nhận đối chiếu và bàn giao`] } : item))
                  setCheckinModal(false)
                  showToast(lang === 'vi' ? 'Đã xác nhận check-in, lưu hiện trạng ban đầu và bằng chứng bàn giao!' : 'Check-in, initial condition and handover evidence saved!')
                }}
              >
                {t('checkin.complete', 'Complete Check-in')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Staff Ticket Resolution Modal */}
      <Modal open={respondModal} onClose={() => setRespondModal(false)} title={t('support.modal.title', 'Staff Ticket Response & Resolution')}>
        {selectedStaffTicket && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#292a27] p-4 text-white">
              <div className="flex justify-between items-center text-xs font-mono text-[#e9a12c]">
                <span>{selectedStaffTicket.id}</span>
                <span>{selectedStaffTicket.facility}</span>
              </div>
              <h3 className="font-bold text-base mt-1 text-stone-100">{selectedStaffTicket.subject}</h3>
              <p className="text-xs text-stone-300 mt-1">
                {lang === 'vi' ? 'Khách thuê: ' : 'Tenant: '}{selectedStaffTicket.customer} ({selectedStaffTicket.email}) · Unit {selectedStaffTicket.unit}
              </p>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {(tickets.find(ticket => ticket.id === selectedStaffTicket.id)?.messages || selectedStaffTicket.messages).map(msg => {
                const isMine = msg.role === 'staff' && msg.sender !== selectedStaffTicket.customer
                return <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs shadow-sm ${isMine ? 'rounded-br-sm bg-blue-700 text-white' : 'rounded-bl-sm border border-amber-200 bg-amber-50 text-amber-950'}`}><div className={`mb-1 flex items-center gap-3 text-[10px] ${isMine ? 'justify-end text-blue-100' : 'justify-between text-amber-700'}`}><b>{isMine ? (lang === 'vi' ? 'Bạn · Staff' : 'You · Staff') : msg.sender}</b><span>{msg.time}</span></div><p className="whitespace-pre-wrap leading-5">{msg.text}</p></div></div>
              })}
            </div>

            {/* Status Changer */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">{lang === 'vi' ? 'Trạng thái hiện tại' : 'Current status'}</label>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs font-bold text-amber-900">{selectedStaffTicket.status === 'resolved' ? (lang === 'vi' ? 'Đã xử lý thành công' : 'Resolved successfully') : selectedStaffTicket.status === 'in-progress' ? (lang === 'vi' ? 'Đang xử lý' : 'In progress') : (lang === 'vi' ? 'Chờ Staff tiếp nhận' : 'Awaiting staff')}</div>
                <p className="mt-1 text-[11px] text-stone-500">{lang === 'vi' ? 'Chọn một trong hai hành động bên dưới sau khi nhập nội dung.' : 'Choose one of the actions below after entering a response.'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  {lang === 'vi' ? 'Nhân Viên Tiếp Nhận' : 'Assigned Handler'}
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${user.name} (${lang === 'vi' ? 'Nhân viên trực' : 'Current Staff'})`}
                  className="w-full border border-stone-200 rounded-lg p-2 text-xs bg-stone-100 text-stone-600"
                />
              </div>
            </div>

            {/* Staff Reply */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">
                {lang === 'vi' ? 'Nội Dung Phản Hồi Chính Thức Tới Khách' : 'Official Staff Response to Tenant'}
              </label>
              <textarea
                rows={3}
                placeholder={lang === 'vi' ? 'Nhập hướng dẫn khắc phục sự cố, cấp lại mã PIN hoặc thông báo cho khách...' : 'Type resolution instructions, gate code update, or notes for tenant...'}
                value={staffReplyText}
                onChange={e => setStaffReplyText(e.target.value)}
                className="w-full border border-stone-300 rounded-lg p-2.5 text-xs text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-3">
              <Button variant="outline" onClick={() => setRespondModal(false)}>{lang === 'vi' ? 'Hủy' : 'Cancel'}</Button>
              <Button
                variant="secondary"
                disabled={!staffReplyText.trim()}
                onClick={() => {
                  try {
                    respondSupportTicket(selectedStaffTicket.id, staffReplyText, 'in-progress', user)
                    setRespondModal(false)
                    setStaffReplyText('')
                    showToast(lang === 'vi' ? 'Đã gửi phản hồi. Phiếu đang được xử lý.' : 'Response sent. Request remains in progress.')
                  } catch (error) {
                    showToast(error instanceof Error ? error.message : 'Không thể gửi phản hồi.')
                  }
                }}
              >
                {lang === 'vi' ? 'Gửi phản hồi · Tiếp tục xử lý' : 'Reply · Keep in progress'}
              </Button>
              <Button
                disabled={!staffReplyText.trim()}
                onClick={() => {
                  try {
                    respondSupportTicket(selectedStaffTicket.id, staffReplyText, 'resolved', user)
                    setRespondModal(false)
                    setStaffReplyText('')
                    showToast(lang === 'vi' ? 'Đã xác nhận xử lý thành công và thông báo cho Customer.' : 'Marked as resolved and notified the customer.')
                  } catch (error) {
                    showToast(error instanceof Error ? error.message : 'Không thể hoàn tất yêu cầu.')
                  }
                }}
              >
                {lang === 'vi' ? 'Xác nhận xử lý thành công' : 'Confirm successful resolution'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
