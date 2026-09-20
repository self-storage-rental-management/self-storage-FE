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

  const NAV = [
    { id: 'tasks', label: lang === 'vi' ? 'Nhiệm vụ trong ngày' : 'Daily Tasks', icon: Icon.tasks, group: lang === 'vi' ? 'Ca làm việc' : 'Work Queue' },
    { id: 'reservations', label: lang === 'vi' ? 'Xác nhận đặt kho' : 'Reservations', icon: Icon.calendar, group: lang === 'vi' ? 'Dịch vụ khách hàng' : 'Customer Service' },
    { id: 'checkin', label: lang === 'vi' ? 'Bàn giao & Nhận kho' : 'Check-in / Handover', icon: Icon.truck, group: lang === 'vi' ? 'Dịch vụ khách hàng' : 'Customer Service' },
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
  const [reservationModal, setReservationModal] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<typeof RESERVATIONS[0] | null>(null)
  const [selectedReturn, setSelectedReturn] = useState<typeof RETURNS[0] | null>(null)
  const [selectedCheckin, setSelectedCheckin] = useState<typeof CHECKINS[0] | null>(null)
  const [ticketTab, setTicketTab] = useState('Open')

  // Support Tickets state
  const [staffTickets, setStaffTickets] = useState(SUPPORT_TICKETS)
  const [selectedStaffTicket, setSelectedStaffTicket] = useState<typeof SUPPORT_TICKETS[0] | null>(null)
  const [respondModal, setRespondModal] = useState(false)
  const [staffReplyText, setStaffReplyText] = useState('')
  const [ticketNewStatus, setTicketNewStatus] = useState<'open' | 'in-progress' | 'resolved'>('in-progress')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const s = (v: string, map: Record<string, string>) => {
    const label = statusLabelMap[lang]?.[v] || (v.charAt(0).toUpperCase() + v.slice(1).replace(/-/g, ' '))
    return <Badge variant={map[v] ?? 'muted'}>{label}</Badge>
  }

  const completedCount = tasks.filter(t => t.done).length
  const totalCount = tasks.length


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
                    <Td>{r.returnDate}</Td>
                    <Td>
                      {r.condition === 'good'
                        ? <Badge variant="success">{lang === 'vi' ? 'Tốt' : 'Good'}</Badge>
                        : <Badge variant="error">{lang === 'vi' ? 'Hư hỏng' : 'Damaged'}</Badge>}
                      {r.damageNotes && <p className="text-xs text-red-500 mt-0.5">{r.damageNotes}</p>}
                    </Td>
                    <Td className="font-semibold">${r.deposit}</Td>
                    <Td>{s(r.status, { inspected: 'info', pending: 'warning', refunded: 'success' })}</Td>
                    <Td>
                      {r.status === 'pending' && (
                        <Button variant="primary" size="sm" onClick={() => { setSelectedReturn(r); setInspectModal(true) }}>
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
              <div><label className="text-sm font-medium">Kết quả kiểm kê</label><select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>Đủ số lượng</option><option>Thiếu hàng</option><option>Thừa hàng</option></select></div>
              <div><label className="text-sm font-medium">Phân loại sau kiểm kê</label><select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>Đạt – hoàn cọc</option><option>Hư hỏng nhẹ</option><option>Hư hỏng nặng</option><option>Hàng bỏ lại cần xử lý</option></select></div>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900"><b>Bằng chứng hiện có:</b> {selectedReturn.evidence.join(' · ')}<br/>Khi hoàn tất, hệ thống tạo mã biên bản, ảnh sau kiểm kê và dấu thời gian nhân viên xác nhận.</div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                {lang === 'vi' ? 'Tình Trạng Kho' : 'Unit Condition'}
              </label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option>{lang === 'vi' ? 'Tốt – Không có hư hại' : 'Good – No damage'}</option>
                <option>{lang === 'vi' ? 'Hư hỏng nhẹ – Khấu trừ một phần cọc' : 'Minor damage – Partial deduction'}</option>
                <option>{lang === 'vi' ? 'Hư hỏng nặng – Khấu trừ toàn bộ cọc' : 'Major damage – Full deduction'}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                {lang === 'vi' ? 'Biên Bản Ghi Chú Hiện Trường' : 'Inspection Notes'}
              </label>
              <textarea
                rows={3}
                placeholder={lang === 'vi' ? 'Ghi rõ chi tiết hư hại, đồ còn sót lại hoặc vết bẩn...' : 'Document any damage or issues...'}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setInspectModal(false)}>{t('btn.cancel', 'Cancel')}</Button>
              <Button
                variant="primary"
                onClick={() => {
                  setReturns(items => items.map(item => item.id === selectedReturn.id ? { ...item, status: 'inspected', finalCondition: 'Đã kiểm kê và phân loại', classification: 'Đạt – hoàn cọc', evidence: [...item.evidence, `EV-OUT-${Date.now()} · Biên bản trả kho do ${user.name} xác nhận`] } : item))
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

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <Button variant="outline" onClick={() => setRespondModal(false)}>{t('btn.cancel', 'Cancel')}</Button>
              <Button
                variant="primary"
                onClick={() => {
                  const newMsg = staffReplyText.trim() ? {
                    id: `msg-${Date.now()}`,
                    sender: user.name,
                    role: 'staff' as const,
                    time: lang === 'vi' ? 'Vừa xong' : 'Just now',
                    text: staffReplyText.trim()
                  } : null

                  setStaffTickets(prev =>
                    prev.map(ticket => {
                      if (ticket.id !== selectedStaffTicket.id) return ticket
                      return {
                        ...ticket,
                        status: ticketNewStatus,
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
