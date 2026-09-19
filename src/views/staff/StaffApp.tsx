import { useState } from 'react'
import Layout, { getInitialPage, Icon } from '../../components/Layout'
import { Badge, Button, Card, StatCard, Table, Thead, Tbody, Th, Td, Tr, SectionHeader, Modal, Tabs, Avatar, Input } from '../../components/ui'
import ProfileView from '../ProfileView'
import { useLanguage } from '../../i18n/LanguageContext'
import type { User } from '../../types'
import { RESERVATIONS, CHECKINS, RETURNS, SUPPORT_TICKETS } from "../../data/demoDatabase"

const statusLabelMap: Record<string, Record<string, string>> = {
  vi: {
    confirmed: 'Đã xác nhận',
    pending: 'Chờ duyệt',
    rejected: 'Đã từ chối',
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
    rejected: 'Rejected',
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

  const NAV = [
    { id: 'dashboard', label: lang === 'vi' ? 'Tổng quan ca làm việc' : 'Staff Dashboard', icon: Icon.home, group: lang === 'vi' ? 'Ca làm việc' : 'Work Queue' },
    { id: 'tasks', label: lang === 'vi' ? 'Nhiệm vụ trong ngày' : 'Daily Tasks', icon: Icon.tasks, group: lang === 'vi' ? 'Ca làm việc' : 'Work Queue' },
    { id: 'reservations', label: lang === 'vi' ? 'Xác nhận đặt kho' : 'Reservations', icon: Icon.calendar, group: lang === 'vi' ? 'Dịch vụ khách hàng' : 'Customer Service' },
    { id: 'checkin', label: lang === 'vi' ? 'Bàn giao & Nhận kho' : 'Check-in / Handover', icon: Icon.truck, group: lang === 'vi' ? 'Dịch vụ khách hàng' : 'Customer Service' },
    { id: 'return', label: lang === 'vi' ? 'Nghiệm thu trả kho' : 'Return Inspection', icon: Icon.clipboard, group: lang === 'vi' ? 'Dịch vụ khách hàng' : 'Customer Service' },
    { id: 'support', label: lang === 'vi' ? 'Hỗ trợ khách hàng' : 'Support Tickets', icon: Icon.support, group: lang === 'vi' ? 'Chăm sóc & Hỗ trợ' : 'Support' },
  ]

  const [page, setPage] = useState(() => getInitialPage(NAV, 'dashboard'))
  const [reservations, setReservations] = useState(RESERVATIONS)
  const [checkins, setCheckins] = useState(CHECKINS)
  const [returns, setReturns] = useState(RETURNS)
  const [inspectModal, setInspectModal] = useState(false)
  const [checkinModal, setCheckinModal] = useState(false)
  const [reservationModal, setReservationModal] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<typeof RESERVATIONS[0] | null>(null)
  const [selectedReturn, setSelectedReturn] = useState<typeof RETURNS[0] | null>(null)
  const [selectedCheckin, setSelectedCheckin] = useState<typeof CHECKINS[0] | null>(null)
  const [ticketTab, setTicketTab] = useState('Open')
  const [reservationSearch, setReservationSearch] = useState('')
  const [reservationStatus, setReservationStatus] = useState('all')
  const [scheduledReturnIds, setScheduledReturnIds] = useState<Set<string>>(new Set())
  const [returnScheduleDrafts, setReturnScheduleDrafts] = useState<Record<string, string>>({})
  const [checkinChecks, setCheckinChecks] = useState<Record<string, boolean>>({})
  const [checkinEvidence, setCheckinEvidence] = useState('')
  const [checkinNotes, setCheckinNotes] = useState('')
  const [actualDimensions, setActualDimensions] = useState('')
  const [actualWeight, setActualWeight] = useState('')
  const [actualMaterial, setActualMaterial] = useState('')
  const [actualCondition, setActualCondition] = useState('')
  const [returnInventory, setReturnInventory] = useState('match')
  const [returnClassification, setReturnClassification] = useState('no-damage')
  const [returnEvidence, setReturnEvidence] = useState('')
  const [returnNotes, setReturnNotes] = useState('')
  const [returnConfirmed, setReturnConfirmed] = useState(false)

  // Support Tickets state
  const [staffTickets, setStaffTickets] = useState(SUPPORT_TICKETS)
  const [selectedStaffTicket, setSelectedStaffTicket] = useState<typeof SUPPORT_TICKETS[0] | null>(null)
  const [respondModal, setRespondModal] = useState(false)
  const [staffReplyText, setStaffReplyText] = useState('')
  const [ticketNewStatus, setTicketNewStatus] = useState<'open' | 'in-progress' | 'resolved'>('in-progress')
  const [ticketEvidence, setTicketEvidence] = useState('')
  const [ticketEscalated, setTicketEscalated] = useState(false)
  const [ticketEscalationReason, setTicketEscalationReason] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const s = (v: string, map: Record<string, string>) => {
    const label = statusLabelMap[lang]?.[v] || (v.charAt(0).toUpperCase() + v.slice(1).replace(/-/g, ' '))
    return <Badge variant={map[v] ?? 'muted'}>{label}</Badge>
  }

  const normalizedSearch = reservationSearch.trim().toLowerCase()
  const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 }
  const filteredReservations = reservations.filter(r => {
    const matchesStatus = reservationStatus === 'all' || r.status === reservationStatus
    const searchText = [r.id, r.customer, r.phone, r.email, r.identityId, r.facility, r.unit].join(' ').toLowerCase()
    return matchesStatus && (!normalizedSearch || searchText.includes(normalizedSearch))
  })
  const operationalTasks = [
    ...reservations.filter(r => r.status === 'pending').map(r => ({ id: `review-${r.id}`, title: lang === 'vi' ? `Duyệt ngoại lệ ${r.id}` : `Review exception ${r.id}`, customer: r.customer, time: r.moveIn, sla: lang === 'vi' ? 'SLA duyệt: 15 phút' : '15-minute review SLA', priority: 'high', page: 'reservations' })),
    ...checkins.filter(c => c.status !== 'completed').map(c => ({ id: `checkin-${c.id}`, title: lang === 'vi' ? `Check-in & bàn giao ${c.unit}` : `Check-in & handover ${c.unit}`, customer: c.customer, time: `${c.date} ${c.time}`, sla: lang === 'vi' ? 'Theo lịch hẹn' : 'Appointment', priority: 'medium', page: 'checkin' })),
    ...returns.filter(r => r.status !== 'refunded').map(r => ({ id: `return-${r.id}`, title: lang === 'vi' ? `Kiểm tra trả kho ${r.unit}` : `Return inspection ${r.unit}`, customer: r.customer, time: returnScheduleDrafts[r.id] || r.returnDate, sla: scheduledReturnIds.has(r.id) ? (lang === 'vi' ? 'Đã xác nhận lịch' : 'Scheduled') : (lang === 'vi' ? 'Cần xác nhận lịch' : 'Schedule required'), priority: scheduledReturnIds.has(r.id) ? 'medium' : 'high', page: 'return' })),
    ...staffTickets.filter(ticket => ticket.status !== 'resolved').map(ticket => ({ id: `support-${ticket.id}`, title: lang === 'vi' ? `Xử lý hỗ trợ ${ticket.id}` : `Handle support ${ticket.id}`, customer: ticket.customer, time: ticket.created, sla: ticket.priority === 'high' ? (lang === 'vi' ? 'Xử lý ngay' : 'Immediate') : (lang === 'vi' ? 'Trong ca' : 'Within shift'), priority: ticket.priority, page: 'support' }))
  ].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
  const totalCount = operationalTasks.length
  const completedCount = reservations.filter(r => r.status === 'confirmed').length + checkins.filter(c => c.status === 'completed').length + returns.filter(r => r.status === 'inspected' || r.status === 'refunded').length + staffTickets.filter(ticket => ticket.status === 'resolved').length


  return (
    <Layout
      user={user} navItems={NAV} currentPage={page} onNavigate={setPage} onLogout={onLogout}
      roleLabel="Staff" roleColor="bg-green-100 text-green-700"
    >
      {page === 'dashboard' && (
        <div className="fade-in space-y-6">
          <SectionHeader
            eyebrow={lang === 'vi' ? 'CỔNG NHÂN VIÊN · TỔNG QUAN VẬN HÀNH' : 'STAFF PORTAL · OPERATIONS OVERVIEW'}
            title={lang === 'vi' ? 'Tổng Quan Ca Làm Việc' : 'Staff Home / Dashboard'}
            subtitle={`${user.facility ?? (lang === 'vi' ? 'Cơ sở được phân quyền' : 'Authorized facility')} · ${new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}`}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title={lang === 'vi' ? 'Ngoại lệ chờ duyệt' : 'Exception Reviews'} value={reservations.filter(r => r.status === 'pending').length} icon={Icon.alert} iconBg="bg-amber-50" />
            <StatCard title={lang === 'vi' ? 'Check-in sắp tới' : 'Upcoming Check-ins'} value={checkins.filter(c => c.status !== 'completed').length} icon={Icon.truck} iconBg="bg-blue-50" />
            <StatCard title={lang === 'vi' ? 'Trả kho cần xử lý' : 'Returns to Process'} value={returns.filter(r => r.status !== 'refunded').length} icon={Icon.clipboard} iconBg="bg-purple-50" />
            <StatCard title={lang === 'vi' ? 'Hỗ trợ đang mở' : 'Open Support Cases'} value={staffTickets.filter(ticket => ticket.status !== 'resolved').length} icon={Icon.support} iconBg="bg-red-50" />
          </div>
          <Card>
            <div className="p-4 border-b border-stone-200 flex items-center justify-between gap-3"><div><h3 className="font-bold">{lang === 'vi' ? 'Việc ưu tiên theo SLA' : 'Priority Tasks by SLA'}</h3><p className="text-xs text-stone-500">{lang === 'vi' ? 'Ngoại lệ, lịch nhận/trả kho và hỗ trợ cần xử lý.' : 'Exceptions, check-ins, returns and support requiring action.'}</p></div><Button variant="outline" size="sm" onClick={() => setPage('tasks')}>{lang === 'vi' ? 'Xem toàn bộ' : 'View all'}</Button></div>
            <Table><Thead><tr><Th>{lang === 'vi' ? 'Ưu tiên' : 'Priority'}</Th><Th>{lang === 'vi' ? 'Nhiệm vụ' : 'Task'}</Th><Th>{lang === 'vi' ? 'Khách hàng' : 'Customer'}</Th><Th>{lang === 'vi' ? 'Lịch / SLA' : 'Schedule / SLA'}</Th><Th></Th></tr></Thead><Tbody>
              {operationalTasks.slice(0, 6).map(task => <Tr key={task.id}><Td>{s(task.priority, { high: 'error', medium: 'warning', low: 'muted' })}</Td><Td><b>{task.title}</b><p className="text-[11px] text-stone-400">{task.id}</p></Td><Td>{task.customer}</Td><Td><p className="text-xs">{task.time}</p><p className="text-[11px] font-semibold text-amber-700">{task.sla}</p></Td><Td className="text-right"><Button size="sm" variant="outline" onClick={() => setPage(task.page)}>{lang === 'vi' ? 'Xử lý' : 'Open'}</Button></Td></Tr>)}
            </Tbody></Table>
          </Card>
        </div>
      )}

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
            <StatCard title={t('tasks.remaining', 'Remaining')} value={Math.max(0, totalCount)} icon={Icon.alert} iconBg="bg-amber-50" />
          </div>

          <Card><Table><Thead><tr><Th>{lang === 'vi' ? 'Nhiệm vụ được giao' : 'Assigned Task'}</Th><Th>{lang === 'vi' ? 'Khách hàng' : 'Customer'}</Th><Th>{lang === 'vi' ? 'Lịch' : 'Schedule'}</Th><Th>SLA</Th><Th>{lang === 'vi' ? 'Ưu tiên' : 'Priority'}</Th><Th></Th></tr></Thead><Tbody>
            {operationalTasks.map(task => <Tr key={task.id}><Td><b>{task.title}</b></Td><Td>{task.customer}</Td><Td className="text-xs">{task.time}</Td><Td className="text-xs font-semibold text-amber-700">{task.sla}</Td><Td>{s(task.priority, { high: 'error', medium: 'warning', low: 'muted' })}</Td><Td className="text-right"><Button size="sm" variant="outline" onClick={() => setPage(task.page)}>{lang === 'vi' ? 'Mở hồ sơ' : 'Open record'}</Button></Td></Tr>)}
          </Tbody></Table></Card>
        </div>
      )}

      {/* ── RESERVATIONS ──────────────────────────────────────── */}
      {page === 'reservations' && (
        <div className="fade-in">
          <SectionHeader
            title={lang === 'vi' ? 'Tìm Kiếm & Duyệt Ngoại Lệ Đặt Kho' : 'Search Reservations & Review Exceptions'}
            subtitle={lang === 'vi' ? 'Tìm theo mã, khách hàng, điện thoại, email, CCCD, cơ sở hoặc kho; chỉ hồ sơ chờ duyệt mới có thao tác phê duyệt.' : 'Search by code, customer, phone, email, ID, facility or unit; approval actions are limited to pending reviews.'}
          />
          <Card className="p-4 mb-4"><div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3"><Input label={lang === 'vi' ? 'Tìm hồ sơ' : 'Search records'} value={reservationSearch} onChange={event => setReservationSearch(event.target.value)} placeholder={lang === 'vi' ? 'Mã đơn, tên, SĐT, email, CCCD, cơ sở, mã kho' : 'Code, name, phone, email, ID, facility, unit'} /><div><label className="text-sm font-medium text-stone-700">{lang === 'vi' ? 'Trạng thái' : 'Status'}</label><select value={reservationStatus} onChange={event => setReservationStatus(event.target.value)} className="mt-1 w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"><option value="all">{lang === 'vi' ? 'Tất cả' : 'All'}</option><option value="pending">{lang === 'vi' ? 'Chờ duyệt ngoại lệ' : 'Review required'}</option><option value="confirmed">{lang === 'vi' ? 'Đã duyệt' : 'Approved'}</option><option value="rejected">{lang === 'vi' ? 'Đã từ chối' : 'Rejected'}</option></select></div></div><p className="mt-2 text-xs text-stone-500">{filteredReservations.length}/{reservations.length} {lang === 'vi' ? 'hồ sơ phù hợp' : 'matching records'}</p></Card>
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
                {filteredReservations.map(r => (
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
                        {r.status === 'pending' && <><Button variant="danger" size="sm" onClick={() => {
                          setReservations(items => items.map(item => item.id === r.id ? { ...item, status: 'rejected', evidence: [...item.evidence, `STAFF-${Date.now()} · ${user.name} từ chối ngoại lệ và giải phóng kho`] } : item))
                          showToast(lang === 'vi' ? 'Đã từ chối ngoại lệ và giải phóng vị trí kho.' : 'Exception rejected and unit released.')
                        }}>{lang === 'vi' ? 'Từ chối' : 'Reject'}</Button><Button variant="primary" size="sm" onClick={() => {
                          setReservations(items => items.map(item => item.id === r.id ? { ...item, status: 'confirmed', evidence: [...item.evidence, `STAFF-${Date.now()} · ${user.name} xác nhận giữ kho`] } : item))
                          showToast(lang === 'vi' ? 'Đã xác nhận yêu cầu giữ kho; không ký thay khách hàng.' : 'Storage hold confirmed; no contract was signed on the customer’s behalf.')
                        }}>{lang === 'vi' ? 'Phê duyệt' : 'Approve'}</Button></>}
                      </div>
                    </Td>
                  </Tr>
                ))}
                {filteredReservations.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-stone-500">{lang === 'vi' ? 'Không có hồ sơ phù hợp.' : 'No matching reservations.'}</td></tr>}
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
          <div className="space-y-3">
            {checkins.map(c => (
              <Card key={c.id} className="p-5">
                <div className="flex flex-wrap items-center gap-4 justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <Avatar name={c.customer} size="sm" />
                      <div>
                        <h3 className="font-semibold text-slate-900">{c.customer}</h3>
                        <p className="text-xs text-slate-500">{c.phone} · {c.email}</p>
                        <p className="text-xs text-slate-500">{c.facility} · Kho {c.unit} · {c.date} at {c.time}</p>
                        <p className="mt-1 text-xs font-medium text-slate-600">{c.goodsType} · {c.packageCount} kiện · {c.weightKg} kg · DIM {c.dimWeightKg} kg</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {s(c.status, { scheduled: 'info', 'pending-payment': 'warning', completed: 'success' })}
                    {c.status !== 'completed' && (
                      <Button variant="primary" size="sm" onClick={() => {
                        setSelectedCheckin(c)
                        setCheckinChecks({ identity: false, reservation: false, payment: c.status !== 'pending-payment', measurement: false, condition: false, credential: false, customer: false })
                        setActualDimensions(c.dimensionsCm)
                        setActualWeight(String(c.weightKg))
                        setActualMaterial(c.material)
                        setActualCondition(c.initialCondition)
                        setCheckinEvidence('')
                        setCheckinNotes('')
                        setCheckinModal(true)
                      }}>
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

      {/* ── RETURN INSPECTION ────────────────────────────────── */}
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
                    <Td className="font-medium">{r.unit}</Td>
                    <Td>{r.status === 'pending' && !scheduledReturnIds.has(r.id) ? <input value={returnScheduleDrafts[r.id] ?? r.returnDate} onChange={event => setReturnScheduleDrafts(previous => ({ ...previous, [r.id]: event.target.value }))} className="w-32 rounded border border-stone-300 px-2 py-1 text-xs" aria-label={lang === 'vi' ? 'Lịch kiểm tra trả kho' : 'Return inspection schedule'} /> : (returnScheduleDrafts[r.id] ?? r.returnDate)}</Td>
                    <Td>
                      {r.condition === 'good'
                        ? <Badge variant="success">{lang === 'vi' ? 'Tốt' : 'Good'}</Badge>
                        : <Badge variant="error">{lang === 'vi' ? 'Hư hỏng' : 'Damaged'}</Badge>}
                      {r.damageNotes && <p className="text-xs text-red-500 mt-0.5">{r.damageNotes}</p>}
                    </Td>
                    <Td className="font-semibold">${r.deposit}</Td>
                    <Td>{s(r.status, { inspected: 'info', pending: 'warning', refunded: 'success' })}</Td>
                    <Td>
                      {r.status === 'pending' && !scheduledReturnIds.has(r.id) && <Button variant="primary" size="sm" onClick={() => { setScheduledReturnIds(previous => new Set(previous).add(r.id)); showToast(lang === 'vi' ? 'Đã xác nhận lịch kiểm tra trả kho.' : 'Return inspection schedule confirmed.') }}>{lang === 'vi' ? 'Xác nhận lịch' : 'Confirm schedule'}</Button>}
                      {r.status === 'pending' && scheduledReturnIds.has(r.id) && (
                        <Button variant="primary" size="sm" onClick={() => { setSelectedReturn(r); setReturnInventory('match'); setReturnClassification('no-damage'); setReturnEvidence(''); setReturnNotes(r.finalCondition); setReturnConfirmed(false); setInspectModal(true) }}>
                          {t('return.action.inspect', 'Inspect')}
                        </Button>
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
        const openCount = staffTickets.filter(tItem => tItem.status === 'open').length
        const inProgressCount = staffTickets.filter(tItem => tItem.status === 'in-progress').length
        const resolvedCount = staffTickets.filter(tItem => tItem.status === 'resolved').length

        const currentActiveTab = ticketTab === 'Open' || ticketTab === 'Chờ Xử Lý'
          ? 'open'
          : ticketTab === 'In Progress' || ticketTab === 'Đang Khắc Phục'
            ? 'in-progress'
            : 'resolved'

        const displayedTickets = staffTickets.filter(tItem => tItem.status === currentActiveTab)

        const tabList = lang === 'vi' ? ['Chờ Xử Lý', 'Đang Khắc Phục', 'Đã Giải Quyết'] : ['Open', 'In Progress', 'Resolved']
        const tabActive = currentActiveTab === 'open' ? tabList[0] : currentActiveTab === 'in-progress' ? tabList[1] : tabList[2]

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
                tabs={tabList}
                active={tabActive}
                onChange={newTab => {
                  const idx = tabList.indexOf(newTab)
                  setTicketTab(idx === 0 ? 'Open' : idx === 1 ? 'In Progress' : 'Resolved')
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
                        </Td>
                        <Td className="max-w-xs">
                          <p className="font-medium text-sm text-stone-800 truncate">{tItem.subject}</p>
                          <p className="text-xs text-stone-400">{tItem.facility} · Unit {tItem.unit}</p>
                        </Td>
                        <Td><Badge variant="muted">{tItem.category}</Badge></Td>
                        <Td>{s(tItem.priority, { high: 'error', medium: 'warning', low: 'muted' })}</Td>
                        <Td className="text-xs text-stone-500">{tItem.created}</Td>
                        <Td>{s(tItem.status, { open: 'info', 'in-progress': 'warning', resolved: 'success' })}</Td>
                        <Td className="text-right">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedStaffTicket(tItem)
                              setTicketNewStatus(tItem.status)
                              setTicketEvidence('')
                              setTicketEscalated(false)
                              setTicketEscalationReason('')
                              setRespondModal(true)
                            }}
                          >
                            {t('support.respond', 'Respond')} ({tItem.messages?.length ?? 1})
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
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

      <Modal open={inspectModal} onClose={() => setInspectModal(false)} size="xl" title={lang === 'vi' ? 'Nghiệm Thu Phòng Kho Trả' : 'Unit Inspection'}>
        {selectedReturn && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('return.col.customer', 'Customer')}</span>
                <span className="font-medium">{selectedReturn.customer}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-500">{t('return.col.unit', 'Unit')}</span>
                <span className="font-medium">{selectedReturn.unit}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-500">{t('return.col.deposit', 'Deposit')}</span>
                <span className="font-semibold">${selectedReturn.deposit}</span>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="mb-2 font-semibold">Đối chiếu giao dịch trước – sau</p>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-slate-500">Lúc check-in</p><p>{selectedReturn.initialCondition}</p><p>{selectedReturn.packageCount} kiện · {selectedReturn.initialWeightKg} kg</p></div>
                <div><p className="text-xs text-slate-500">Lúc trả kho</p><p>{selectedReturn.finalCondition}</p><p>{selectedReturn.packageCount} kiện · {selectedReturn.finalWeightKg} kg</p></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">{lang === 'vi' ? 'Kết quả kiểm kê' : 'Inventory result'}</label><select value={returnInventory} onChange={event => setReturnInventory(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="match">{lang === 'vi' ? 'Khớp khai báo' : 'Matches declaration'}</option><option value="missing">{lang === 'vi' ? 'Thiếu / đã lấy ra' : 'Missing / removed'}</option><option value="damaged">{lang === 'vi' ? 'Có hàng hư hỏng' : 'Damaged goods'}</option><option value="abandoned">{lang === 'vi' ? 'Có hàng bỏ lại' : 'Abandoned goods'}</option></select></div>
              <div><label className="text-sm font-medium">{lang === 'vi' ? 'Phân loại hiện trạng' : 'Condition classification'}</label><select value={returnClassification} onChange={event => setReturnClassification(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="no-damage">{lang === 'vi' ? 'Không hư hại' : 'No Damage'}</option><option value="minor-damage">{lang === 'vi' ? 'Hư hại nhẹ' : 'Minor Damage'}</option><option value="major-damage">{lang === 'vi' ? 'Hư hại nặng' : 'Major Damage'}</option><option value="requires-maintenance">{lang === 'vi' ? 'Cần bảo trì' : 'Requires Maintenance'}</option></select></div>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900"><b>{lang === 'vi' ? 'Bằng chứng bàn giao ban đầu (bất biến)' : 'Immutable initial handover evidence'}:</b> {selectedReturn.evidence.join(' · ')}</div>
            <Input label={lang === 'vi' ? 'Ảnh/bằng chứng trả kho mới (mã tệp hoặc đường dẫn)' : 'New return evidence (file reference or URL)'} value={returnEvidence} onChange={event => setReturnEvidence(event.target.value)} />
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                {lang === 'vi' ? 'Biên Bản Ghi Chú Hiện Trường' : 'Inspection Notes'}
              </label>
              <textarea
                rows={3}
                value={returnNotes}
                onChange={event => setReturnNotes(event.target.value)}
                placeholder={lang === 'vi' ? 'Ghi rõ chi tiết hư hại, đồ còn sót lại hoặc vết bẩn...' : 'Document any damage or issues...'}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={returnConfirmed} onChange={event => setReturnConfirmed(event.target.checked)} /> {lang === 'vi' ? 'Khách đã xác nhận biên bản trả kho và kết quả đối chiếu' : 'Customer confirmed the return inspection and comparison result'}</label>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setInspectModal(false)}>{t('btn.cancel', 'Cancel')}</Button>
              <Button
                variant="primary"
                disabled={!returnEvidence.trim() || !returnNotes.trim() || !returnConfirmed}
                onClick={() => {
                  setReturns(items => items.map(item => item.id === selectedReturn.id ? { ...item, status: 'inspected', finalCondition: returnNotes.trim(), classification: returnClassification, evidence: [...item.evidence, returnEvidence.trim(), `EV-OUT-${Date.now()} · ${user.name} xác nhận kiểm kê ${returnInventory}, phân loại ${returnClassification}`] } : item))
                  setInspectModal(false)
                  showToast(lang === 'vi' ? 'Đã lưu biên bản, hiện trạng sau và bằng chứng kiểm kê!' : 'Inspection, final condition and evidence saved!')
                }}
              >
                {t('return.submit', 'Submit Inspection')}
              </Button>
            </div>
          </div>
        )}
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
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"><b>{lang === 'vi' ? 'Khai báo cần đối chiếu' : 'Declared goods'}:</b> {selectedCheckin.dimensionsCm} cm · {selectedCheckin.weightKg} kg · {selectedCheckin.material} · {selectedCheckin.initialCondition}</div>
            <div className="rounded-lg border border-stone-200 p-3 space-y-3"><p className="font-semibold text-sm">{lang === 'vi' ? 'Số đo và tình trạng thực tế' : 'Actual goods measurement & condition'}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Input label={lang === 'vi' ? 'Kích thước thực tế (D × R × C cm)' : 'Actual dimensions (L × W × H cm)'} value={actualDimensions} onChange={event => setActualDimensions(event.target.value)} /><Input label={lang === 'vi' ? 'Khối lượng thực tế (kg)' : 'Actual weight (kg)'} type="number" value={actualWeight} onChange={event => setActualWeight(event.target.value)} /><Input label={lang === 'vi' ? 'Vật liệu thực tế' : 'Actual material'} value={actualMaterial} onChange={event => setActualMaterial(event.target.value)} /><Input label={lang === 'vi' ? 'Hiện trạng kho ban đầu / hư hại có sẵn' : 'Initial unit condition / existing damage'} value={actualCondition} onChange={event => setActualCondition(event.target.value)} /></div><Input label={lang === 'vi' ? 'Ảnh/bằng chứng bàn giao (mã tệp hoặc đường dẫn)' : 'Handover evidence (file reference or URL)'} value={checkinEvidence} onChange={event => setCheckinEvidence(event.target.value)} /></div>
            <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
              {([
                ['identity', lang === 'vi' ? 'Đã đối chiếu CCCD/Hộ chiếu gốc' : 'Original ID/passport verified'],
                ['reservation', lang === 'vi' ? 'Reservation CONFIRMED, đúng cơ sở, kho và lịch thuê' : 'Confirmed reservation, facility, unit and rental period verified'],
                ['payment', lang === 'vi' ? 'Điều kiện thanh toán đã đáp ứng' : 'Payment conditions satisfied'],
                ['measurement', lang === 'vi' ? 'Đã đo hàng thực tế và xử lý chênh lệch' : 'Actual goods measured and variances reviewed'],
                ['condition', lang === 'vi' ? 'Đã kiểm tra tường, sàn, cửa, khóa, đèn, vệ sinh và hư hại sẵn có' : 'Walls, floor, door, lock, lighting, cleanliness and existing damage checked'],
                ['credential', lang === 'vi' ? `Đã cấp PIN/thẻ/chìa khóa cho kho ${selectedCheckin.unit}` : `PIN/card/key issued for unit ${selectedCheckin.unit}`],
                ['customer', lang === 'vi' ? 'Khách đã xác nhận biên bản bàn giao' : 'Customer confirmed handover record']
              ] as Array<[string, string]>).map(([key, label]) => <label key={key} className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={Boolean(checkinChecks[key])} onChange={event => setCheckinChecks(previous => ({ ...previous, [key]: event.target.checked }))} className="w-4 h-4 accent-blue-600" /><span className="text-sm text-slate-700">{label}</span></label>)}
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs"><b>{lang === 'vi' ? 'Thông tin credential' : 'Credential record'}:</b> {`PIN-${selectedCheckin.id}`} · {selectedCheckin.unit} · {selectedCheckin.customer} · {user.name} · {lang === 'vi' ? 'kích hoạt khi hoàn tất check-in' : 'activates on check-in completion'}</div>
            <div className="space-y-1"><label className="text-sm font-medium text-slate-700">{lang === 'vi' ? 'Ghi chú bàn giao' : 'Handover notes'}</label><textarea rows={2} value={checkinNotes} onChange={event => setCheckinNotes(event.target.value)} placeholder={lang === 'vi' ? 'Ghi rõ chênh lệch hàng hóa hoặc lưu ý vận hành...' : 'Record goods variances or operational notes...'} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCheckinModal(false)}>{t('btn.cancel', 'Cancel')}</Button>
              <Button
                variant="primary"
                disabled={!Object.values(checkinChecks).every(Boolean) || !actualDimensions.trim() || Number(actualWeight) <= 0 || !actualMaterial.trim() || !actualCondition.trim() || !checkinEvidence.trim()}
                onClick={() => {
                  setCheckins(items => items.map(item => item.id === selectedCheckin.id ? { ...item, status: 'completed', dimensionsCm: actualDimensions.trim(), weightKg: Number(actualWeight), material: actualMaterial.trim(), initialCondition: actualCondition.trim(), evidence: [...item.evidence, checkinEvidence.trim(), `CHECKIN-${Date.now()} · ${user.name} xác nhận đối chiếu, cấp credential và bàn giao${checkinNotes.trim() ? ` · ${checkinNotes.trim()}` : ''}`] } : item))
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

            {/* Conversation Log */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {selectedStaffTicket.messages?.map(msg => (
                <div key={msg.id} className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                  <div className="flex justify-between text-stone-400 mb-1">
                    <span className="font-semibold text-stone-800">{msg.sender} ({msg.role})</span>
                    <span>{msg.time}</span>
                  </div>
                  <p className="text-stone-700">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Status Changer */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  {lang === 'vi' ? 'Cập Nhật Trạng Thái' : 'Update Ticket Status'}
                </label>
                <select
                  value={ticketNewStatus}
                  onChange={e => setTicketNewStatus(e.target.value as any)}
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="open">{lang === 'vi' ? 'Mở Mới / Chờ xử lý' : 'Open / Awaiting Action'}</option>
                  <option value="in-progress">{lang === 'vi' ? 'Đang Khắc Phục' : 'In Progress / Investigating'}</option>
                  <option value="resolved">{lang === 'vi' ? 'Đã Giải Quyết Xong' : 'Resolved / Case Closed'}</option>
                </select>
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

            <Input label={lang === 'vi' ? 'Bằng chứng đính kèm (mã tệp/đường dẫn)' : 'Evidence attachment (file reference/URL)'} value={ticketEvidence} onChange={event => setTicketEvidence(event.target.value)} />
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2"><label className="text-xs font-semibold text-amber-900"><input type="checkbox" checked={ticketEscalated} onChange={event => { setTicketEscalated(event.target.checked); if (event.target.checked) setTicketNewStatus('in-progress') }} /> {lang === 'vi' ? 'Chuyển cấp cho quản lý/đội kỹ thuật' : 'Escalate to manager/technical team'}</label>{ticketEscalated && <Input label={lang === 'vi' ? 'Lý do chuyển cấp' : 'Escalation reason'} value={ticketEscalationReason} onChange={event => setTicketEscalationReason(event.target.value)} />}</div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <Button variant="outline" onClick={() => setRespondModal(false)}>{t('btn.cancel', 'Cancel')}</Button>
              <Button
                variant="primary"
                disabled={!staffReplyText.trim() || (ticketEscalated && !ticketEscalationReason.trim())}
                onClick={() => {
                  const newMsg = staffReplyText.trim() ? {
                    id: `msg-${Date.now()}`,
                    sender: user.name,
                    role: 'staff' as const,
                    time: lang === 'vi' ? 'Vừa xong' : 'Just now',
                    text: `${staffReplyText.trim()}${ticketEvidence.trim() ? `\n[Evidence: ${ticketEvidence.trim()}]` : ''}${ticketEscalated ? `\n[Escalated: ${ticketEscalationReason.trim()}]` : ''}`
                  } : null

                  setStaffTickets(prev =>
                    prev.map(ticket => {
                      if (ticket.id !== selectedStaffTicket.id) return ticket
                      return {
                        ...ticket,
                        status: ticketEscalated ? 'in-progress' as const : ticketNewStatus,
                        messages: newMsg ? [...(ticket.messages || []), newMsg] : ticket.messages
                      }
                    })
                  )
                  setRespondModal(false)
                  setStaffReplyText('')
                  showToast(lang === 'vi' ? `Đã cập nhật yêu cầu ${selectedStaffTicket.id}!` : `Ticket ${selectedStaffTicket.id} updated!`)
                }}
              >
                {t('support.modal.dispatch', 'Save & Dispatch Response')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
