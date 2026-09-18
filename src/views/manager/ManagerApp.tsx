import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import Layout, { getInitialPage, Icon } from '../../components/Layout'
import { Badge, Button, Card, StatCard, Table, Thead, Tbody, Th, Td, Tr, SectionHeader, Modal, Select, ProgressBar, Avatar, Input, Tabs } from '../../components/ui'
import type { User } from '../../types'
import { OCCUPANCY_DATA, REVENUE_DATA, UNIT_TYPE_DATA, UNITS, RENTALS, STAFF_LIST, OVERDUE, UTILIZATION, SUPPORT_METRICS } from "../../data/demoDatabase"
import { useLanguage } from '../../i18n/LanguageContext'

import ProfileView from '../ProfileView'
import type { RentalRecord, OverdueAccount } from '../../data/demoDatabase'

export default function ManagerApp({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { lang, t } = useLanguage()

  const NAV = [
    { id: 'dashboard', label: lang === 'vi' ? 'Bảng điều khiển' : 'Dashboard', icon: Icon.home, group: lang === 'vi' ? 'Tổng quan' : 'Overview' },
    { id: 'reports', label: lang === 'vi' ? 'Báo cáo cơ sở' : 'Facility Reports', icon: Icon.chart, group: lang === 'vi' ? 'Tổng quan' : 'Overview' },
    { id: 'units', label: lang === 'vi' ? 'Quản lý gian kho' : 'Unit Management', icon: Icon.box, group: lang === 'vi' ? 'Vận hành cơ sở' : 'Facility Operations' },
    { id: 'staff', label: lang === 'vi' ? 'Phân công nhân viên' : 'Staff Assignment', icon: Icon.users, group: lang === 'vi' ? 'Vận hành cơ sở' : 'Facility Operations' },
    { id: 'rentals', label: lang === 'vi' ? 'Hợp đồng & Cước' : 'Rentals & Payments', icon: Icon.dollar, group: lang === 'vi' ? 'Hợp đồng & Tài chính' : 'Rentals & Finance' },
    { id: 'overdue', label: lang === 'vi' ? 'Quản lý nợ quá hạn' : 'Overdue Management', icon: Icon.alert, group: lang === 'vi' ? 'Hợp đồng & Tài chính' : 'Rentals & Finance' },
  ]

  const sb = (v: string) => {
    const m: Record<string, string> = { occupied: 'info', available: 'success', maintenance: 'warning', reserved: 'purple', active: 'success', overdue: 'error', paid: 'success', pending: 'warning', 'on-duty': 'success', 'off-duty': 'muted' }
    const viLabels: Record<string, string> = {
      occupied: 'Đã thuê',
      available: 'Còn trống',
      maintenance: 'Bảo trì',
      reserved: 'Đã đặt',
      active: 'Hiệu lực',
      overdue: 'Quá hạn',
      paid: 'Đã đóng',
      pending: 'Chờ xử lý',
      'on-duty': 'Đang trực',
      'off-duty': 'Nghỉ ca'
    }
    return <Badge variant={m[v] ?? 'muted'}>{lang === 'vi' && viLabels[v] ? viLabels[v] : v.charAt(0).toUpperCase() + v.slice(1)}</Badge>
  }

  const [page, setPage] = useState(() => getInitialPage(NAV, 'dashboard'))
  const [unitTab, setUnitTab] = useState('All')
  const [editModal, setEditModal] = useState(false)
  const [reminderModal, setReminderModal] = useState(false)
  const [selectedOverdue, setSelectedOverdue] = useState<OverdueAccount | null>(null)

  // Rentals interactive state
  const [rentalsList, setRentalsList] = useState<RentalRecord[]>(RENTALS)
  const [rentalSearch, setRentalSearch] = useState('')
  const [rentalTab, setRentalTab] = useState('All')
  const [selectedRental, setSelectedRental] = useState<RentalRecord | null>(null)
  const [viewRentalModal, setViewRentalModal] = useState(false)
  const [recordPaymentModal, setRecordPaymentModal] = useState(false)
  const [newLeaseModal, setNewLeaseModal] = useState(false)
  const [newTenantName, setNewTenantName] = useState('')
  const [newTenantEmail, setNewTenantEmail] = useState('')
  const [newTenantPhone, setNewTenantPhone] = useState('')
  const [newTenantUnit, setNewTenantUnit] = useState('A-104')
  const [newTenantAmount, setNewTenantAmount] = useState('89')

  // Overdue interactive state
  const [overdueList, setOverdueList] = useState<OverdueAccount[]>(OVERDUE)
  const [overdueSearch, setOverdueSearch] = useState('')
  const [overdueTab, setOverdueTab] = useState('All')
  const [reminderTemplate, setReminderTemplate] = useState('Friendly Reminder')

  // Toast
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filteredUnits = UNITS.filter(u => {
    if (unitTab === 'All' || unitTab === 'Tất cả') return true
    if (unitTab === 'Available' || unitTab === 'Còn trống') return u.status === 'available'
    if (unitTab === 'Occupied' || unitTab === 'Đã thuê') return u.status === 'occupied'
    if (unitTab === 'Maintenance' || unitTab === 'Bảo trì') return u.status === 'maintenance'
    if (unitTab === 'Reserved' || unitTab === 'Đã đặt') return u.status === 'reserved'
    return u.status === unitTab.toLowerCase()
  })
  const occupiedCount = UNITS.filter(u => u.status === 'occupied').length
  const totalUnits = UNITS.length

  return (
    <Layout
      user={user} navItems={NAV} currentPage={page} onNavigate={setPage} onLogout={onLogout}
      roleLabel={lang === 'vi' ? 'Quản Lý Cơ Sở' : 'Facility Manager'} roleColor="bg-purple-100 text-purple-700"
    >
      {/* ── DASHBOARD ─────────────────────────────────────────── */}
      {page === 'dashboard' && (
        <div className="fade-in space-y-6">
          <SectionHeader
            title={lang === 'vi' ? 'Bảng Điều Khiển Cơ Sở' : 'Facility Dashboard'}
            subtitle={user.facility ?? (lang === 'vi' ? 'Chưa chỉ định cơ sở' : 'No facility assigned')}
            action={<Button variant="outline" size="sm" onClick={() => showToast(lang === 'vi' ? 'Đang kết xuất báo cáo cơ sở...' : 'Exporting facility report...')}>{lang === 'vi' ? 'Xuất báo cáo' : 'Export Report'}</Button>}
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title={lang === 'vi' ? 'Tổng gian kho' : 'Total Units'} value={totalUnits} icon={Icon.box} iconBg="bg-blue-50" />
            <StatCard title={lang === 'vi' ? 'Tỷ lệ lấp đầy' : 'Occupancy'} value={`${totalUnits ? Math.round((occupiedCount / totalUnits) * 100) : 0}%`} icon={Icon.chart} iconBg="bg-green-50" />
            <StatCard title={lang === 'vi' ? 'Doanh thu tháng' : 'Monthly Revenue'} value="$14,280" icon={Icon.dollar} iconBg="bg-purple-50" />
            <StatCard title={lang === 'vi' ? 'Nợ quá hạn' : 'Overdue Accounts'} value={OVERDUE.length} icon={Icon.alert} iconBg="bg-red-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 p-5">
              <h3 className="font-semibold text-slate-800 mb-4">{lang === 'vi' ? 'Doanh Thu Hàng Tháng' : 'Monthly Revenue'}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={REVENUE_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={((v: number) => [`$${v.toLocaleString()}`, lang === 'vi' ? 'Doanh thu' : 'Revenue']) as any} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-slate-800 mb-4">{lang === 'vi' ? 'Cơ Cấu Gian Kho' : 'Unit Mix'}</h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={UNIT_TYPE_DATA} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2}>
                    {UNIT_TYPE_DATA.map(d => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={((v: number) => [`${v} ${lang === 'vi' ? 'gian' : 'units'}`]) as any} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {UNIT_TYPE_DATA.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-slate-600 flex-1 truncate">{d.name}</span>
                    <span className="font-semibold text-slate-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="p-5">
              <h3 className="font-semibold text-slate-800 mb-4">{lang === 'vi' ? 'Xu Hướng Lấp Đầy Kho' : 'Occupancy Trend'}</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={OCCUPANCY_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[60, 100]} />
                  <Tooltip formatter={((v: number) => [`${v}%`, lang === 'vi' ? 'Lấp đầy' : 'Occupancy']) as any} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-slate-800 mb-3">{lang === 'vi' ? 'Tài Khoản Quá Hạn Gần Đây' : 'Overdue Accounts'}</h3>
              <div className="space-y-3">
                {OVERDUE.slice(0, 3).map(o => (
                  <div key={o.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{o.customer}</p>
                      <p className="text-xs text-slate-400">{lang === 'vi' ? `Kho ${o.unit} · Quá hạn ${o.overdueDays} ngày` : `${o.unit} · ${o.overdueDays} days overdue`}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">${o.amount + o.lateFee}</p>
                      <p className="text-xs text-slate-400">{lang === 'vi' ? 'gồm phí phạt' : 'incl. late fee'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => setPage('overdue')}>
                {lang === 'vi' ? 'Xử Lý Nợ Quá Hạn →' : 'Manage All Overdue →'}
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* ── UNIT MANAGEMENT ───────────────────────────────────── */}
      {page === 'units' && (
        <div className="fade-in">
          <SectionHeader
            title={lang === 'vi' ? 'Quản Lý Gian Kho' : 'Unit Management'}
            subtitle={lang === 'vi' ? `Tổng cộng ${totalUnits} gian kho · ${occupiedCount} đang có khách thuê` : `${totalUnits} units total · ${occupiedCount} occupied`}
            action={<Button variant="primary" size="sm" onClick={() => setEditModal(true)}>{Icon.plus} {lang === 'vi' ? 'Thêm Gian Kho' : 'Add Unit'}</Button>}
          />
          <div className="mb-4">
            <Tabs
              tabs={lang === 'vi' ? ['Tất cả', 'Còn trống', 'Đã thuê', 'Bảo trì', 'Đã đặt'] : ['All', 'Available', 'Occupied', 'Maintenance', 'Reserved']}
              active={unitTab === 'All' && lang === 'vi' ? 'Tất cả' : unitTab}
              onChange={val => {
                if (val === 'Tất cả') setUnitTab('All')
                else if (val === 'Còn trống') setUnitTab('Available')
                else if (val === 'Đã thuê') setUnitTab('Occupied')
                else if (val === 'Bảo trì') setUnitTab('Maintenance')
                else if (val === 'Đã đặt') setUnitTab('Reserved')
                else setUnitTab(val)
              }}
            />
          </div>
          <Card>
            <Table>
              <Thead>
                <tr>
                  <Th>{lang === 'vi' ? 'Gian Kho' : 'Unit'}</Th>
                  <Th>{lang === 'vi' ? 'Kích Thước' : 'Size'}</Th>
                  <Th>{lang === 'vi' ? 'Tầng' : 'Floor'}</Th>
                  <Th>{lang === 'vi' ? 'Điều Hòa' : 'Climate'}</Th>
                  <Th>{lang === 'vi' ? 'Khách Thuê' : 'Tenant'}</Th>
                  <Th>{lang === 'vi' ? 'Giá/tháng' : 'Price/mo'}</Th>
                  <Th>{lang === 'vi' ? 'Kỳ Thu Tới' : 'Next Due'}</Th>
                  <Th>{lang === 'vi' ? 'Trạng Thái' : 'Status'}</Th>
                  <Th className="text-right">{lang === 'vi' ? 'Thao Tác' : 'Action'}</Th>
                </tr>
              </Thead>
              <Tbody>
                {filteredUnits.map(u => (
                  <Tr key={u.id}>
                    <Td><span className="font-mono font-semibold text-slate-800">{u.id}</span></Td>
                    <Td>{u.size} ft</Td>
                    <Td>{lang === 'vi' ? `Tầng ${u.floor}` : `Floor ${u.floor}`}</Td>
                    <Td>{u.climate ? <Badge variant="info">{lang === 'vi' ? 'Có' : 'Yes'}</Badge> : <span className="text-slate-400 text-xs">{lang === 'vi' ? 'Không' : 'No'}</span>}</Td>
                    <Td>{u.tenant ?? <span className="text-slate-400">—</span>}</Td>
                    <Td className="font-semibold">${u.price}</Td>
                    <Td>{u.nextDue ?? <span className="text-slate-400">—</span>}</Td>
                    <Td>{sb(u.status)}</Td>
                    <Td className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditModal(true)}>{lang === 'vi' ? 'Sửa' : 'Edit'}</Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ── RENTALS & PAYMENTS ───────────────────────────────── */}
      {/* ── RENTALS & PAYMENTS ───────────────────────────────── */}
      {page === 'rentals' && (() => {
        const activeRentals = rentalsList.filter(r => r.status === 'active')
        const paidRentals = rentalsList.filter(r => r.paid === 'paid')
        const overdueRentals = rentalsList.filter(r => r.paid === 'overdue')
        const mrr = activeRentals.reduce((sum, r) => sum + r.amount, 0)

        const filteredRentals = rentalsList.filter(r => {
          const matchTab =
            rentalTab === 'All' || rentalTab === 'Tất cả' ||
            ((rentalTab === 'active' || rentalTab === 'Hiệu lực') && r.status === 'active') ||
            ((rentalTab === 'paid' || rentalTab === 'Đã nộp') && r.paid === 'paid') ||
            ((rentalTab === 'overdue' || rentalTab === 'Quá hạn') && r.paid === 'overdue') ||
            ((rentalTab === 'pending' || rentalTab === 'Chờ xử lý') && (r.status === 'pending' || r.paid === 'pending'))
          const query = rentalSearch.toLowerCase().trim()
          const matchSearch =
            !query ||
            r.customer.toLowerCase().includes(query) ||
            r.unit.toLowerCase().includes(query) ||
            r.id.toLowerCase().includes(query) ||
            r.phone.includes(query)
          return matchTab && matchSearch
        })

        return (
          <div className="fade-in space-y-6">
            <SectionHeader
              title={lang === 'vi' ? 'Giám Sát Hợp Đồng Thuê & Cước Phí' : 'Rentals & Payment Monitoring'}
              subtitle={lang === 'vi' ? 'Sổ cái tổng hợp các hợp đồng thuê kho, kỳ thu cước định kỳ và quyết toán thu ngân' : 'Comprehensive ledger of facility leases, recurring billings, and payment settlements'}
              action={
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => showToast(lang === 'vi' ? 'Đã xuất dữ liệu hợp đồng ra file CSV!' : 'Lease records exported to CSV!')}>
                    {lang === 'vi' ? 'Xuất file CSV' : 'Export CSV'}
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setNewLeaseModal(true)}>
                    {Icon.plus} {lang === 'vi' ? 'Hợp đồng mới' : 'New Agreement'}
                  </Button>
                </div>
              }
            />

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title={lang === 'vi' ? 'Hợp đồng hiệu lực' : 'Active Leases'}
                value={activeRentals.length}
                delta={lang === 'vi' ? '+2 trong tháng' : '+2 this month'}
                deltaPositive
                icon={Icon.key}
                iconBg="bg-blue-50 text-blue-700"
              />
              <StatCard
                title={lang === 'vi' ? 'Đã thu trong tháng' : 'Paid MTD'}
                value={`${paidRentals.length} / ${rentalsList.length}`}
                delta={`${Math.round((paidRentals.length / (rentalsList.length || 1)) * 100)}% ${lang === 'vi' ? 'đã thu' : 'collected'}`}
                deltaPositive
                icon={Icon.check}
                iconBg="bg-emerald-50 text-emerald-700"
              />
              <StatCard
                title={lang === 'vi' ? 'Chờ thu / Quá hạn' : 'Pending / Overdue'}
                value={overdueRentals.length}
                delta={lang === 'vi' ? 'Cần xử lý' : 'Requires attention'}
                deltaPositive={false}
                icon={Icon.alert}
                iconBg="bg-red-50 text-red-700"
              />
              <StatCard
                title={lang === 'vi' ? 'Doanh thu tháng (MRR)' : 'Projected MRR'}
                value={`$${mrr.toLocaleString()}`}
                delta={lang === 'vi' ? '+$420 so với tháng trước' : '+$420 vs last month'}
                deltaPositive
                icon={Icon.dollar}
                iconBg="bg-amber-50 text-amber-800"
              />
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Tabs
                tabs={lang === 'vi' ? ['Tất cả', 'Hiệu lực', 'Đã nộp', 'Quá hạn', 'Chờ xử lý'] : ['All', 'active', 'paid', 'overdue', 'pending']}
                active={
                  rentalTab === 'All' && lang === 'vi' ? 'Tất cả' :
                  rentalTab === 'active' && lang === 'vi' ? 'Hiệu lực' :
                  rentalTab === 'paid' && lang === 'vi' ? 'Đã nộp' :
                  rentalTab === 'overdue' && lang === 'vi' ? 'Quá hạn' :
                  rentalTab === 'pending' && lang === 'vi' ? 'Chờ xử lý' : rentalTab
                }
                onChange={val => {
                  if (val === 'Tất cả') setRentalTab('All')
                  else if (val === 'Hiệu lực') setRentalTab('active')
                  else if (val === 'Đã nộp') setRentalTab('paid')
                  else if (val === 'Quá hạn') setRentalTab('overdue')
                  else if (val === 'Chờ xử lý') setRentalTab('pending')
                  else setRentalTab(val)
                }}
              />
              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder={lang === 'vi' ? 'Tìm theo khách, phòng, SĐT, mã...' : 'Search tenant, unit, phone, ID...'}
                  value={rentalSearch}
                  onChange={e => setRentalSearch(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Rentals Table */}
            <Card>
              <Table>
                <Thead>
                  <tr>
                    <Th>{lang === 'vi' ? 'Mã Hợp Đồng' : 'Agreement'}</Th>
                    <Th>{lang === 'vi' ? 'Khách Thuê' : 'Tenant Details'}</Th>
                    <Th>{lang === 'vi' ? 'Thông Số Kho' : 'Unit Specs'}</Th>
                    <Th>{lang === 'vi' ? 'Kỳ Hợp Đồng' : 'Contract Dates'}</Th>
                    <Th>{lang === 'vi' ? 'Cước Tháng' : 'Monthly Rate'}</Th>
                    <Th>{lang === 'vi' ? 'Trạng Thái Cước' : 'Payment Status'}</Th>
                    <Th>{lang === 'vi' ? 'Tự Động Trừ' : 'Auto-Pay'}</Th>
                    <Th className="text-right">{lang === 'vi' ? 'Thao Tác' : 'Actions'}</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {filteredRentals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-stone-400 text-sm">
                        {lang === 'vi' ? 'Không tìm thấy hợp đồng nào theo bộ lọc hiện tại.' : 'No lease agreements found matching current filters.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRentals.map(r => (
                      <Tr key={r.id}>
                        <Td>
                          <span className="font-mono text-xs font-semibold text-stone-600">{r.id}</span>
                          <p className="text-[11px] text-stone-400">{r.facility}</p>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={r.customer} size="sm" />
                            <div>
                              <p className="font-medium text-sm text-stone-900">{r.customer}</p>
                              <p className="text-xs text-stone-400">{r.phone}</p>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-xs">
                              {r.unit}
                            </span>
                            <span className="text-xs text-stone-500">{r.unitType}</span>
                          </div>
                          <p className="text-[11px] text-stone-400">{r.size} ft {lang === 'vi' ? 'kho' : 'unit'}</p>
                        </Td>
                        <Td>
                          <div className="text-xs">
                            <p className="text-stone-700">{lang === 'vi' ? 'Từ' : 'From'}: {r.startDate}</p>
                            <p className="text-stone-400">{lang === 'vi' ? 'Hạn' : 'Due'}: <span className="font-semibold text-stone-800">{r.nextDue}</span></p>
                          </div>
                        </Td>
                        <Td>
                          <span className="font-bold text-sm text-stone-900">${r.amount}</span>
                          <span className="text-xs text-stone-400">/{lang === 'vi' ? 'th' : 'mo'}</span>
                        </Td>
                        <Td>
                          {r.paid === 'paid' && <Badge variant="success">{lang === 'vi' ? 'Đã đóng' : 'Paid'}</Badge>}
                          {r.paid === 'pending' && <Badge variant="warning">{lang === 'vi' ? 'Chờ xử lý' : 'Pending'}</Badge>}
                          {r.paid === 'overdue' && <Badge variant="error">{lang === 'vi' ? 'Quá hạn' : 'Overdue'}</Badge>}
                        </Td>
                        <Td>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${r.autoRenew ? 'text-emerald-700' : 'text-stone-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${r.autoRenew ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                            {lang === 'vi' ? (r.autoRenew ? 'Kích hoạt' : 'Thủ công') : (r.autoRenew ? 'Enrolled' : 'Manual')}
                          </span>
                        </Td>
                        <Td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRental(r)
                                setViewRentalModal(true)
                              }}
                            >
                              {lang === 'vi' ? 'Chi tiết' : 'Details'}
                            </Button>
                            {r.paid !== 'paid' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedRental(r)
                                  setRecordPaymentModal(true)
                                }}
                              >
                                {lang === 'vi' ? 'Thu cước' : 'Collect'}
                              </Button>
                            )}
                          </div>
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

      {/* ── STAFF ASSIGNMENT ─────────────────────────────────── */}
      {page === 'staff' && (
        <div className="fade-in">
          <SectionHeader
            title={lang === 'vi' ? 'Phân Công Nhân Viên Ca Trực' : 'Staff Assignment'}
            subtitle={lang === 'vi' ? 'Quản lý lịch trực ca, phân bổ khu vực và nhiệm vụ vận hành kho bãi' : 'Manage staff shifts and task assignments'}
          />
          <div className="space-y-4">
            {STAFF_LIST.map(s => (
              <Card key={s.id} className="p-5">
                <div className="flex flex-wrap items-center gap-4 justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} size="lg" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{s.name}</h3>
                        {sb(s.status)}
                      </div>
                      <p className="text-sm text-slate-500">
                        {s.role} · {lang === 'vi' ? `Ca ${s.shift === 'Morning' ? 'Sáng' : s.shift === 'Evening' ? 'Chiều' : 'Đêm'}` : `${s.shift} Shift`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-900">{s.tasks}</p>
                      <p className="text-xs text-slate-400">{lang === 'vi' ? 'nhiệm vụ hôm nay' : 'tasks today'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => showToast(lang === 'vi' ? `Đã mở lịch trực của ${s.name}` : `Opened schedule for ${s.name}`)}>
                        {lang === 'vi' ? 'Sửa ca trực' : 'Edit Schedule'}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => showToast(lang === 'vi' ? `Đã gửi giao việc mới cho ${s.name}` : `Dispatched task to ${s.name}`)}>
                        {lang === 'vi' ? 'Giao việc' : 'Assign Task'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── OVERDUE MANAGEMENT ───────────────────────────────── */}
      {page === 'overdue' && (() => {
        const totalOverdueRent = overdueList.reduce((sum, o) => sum + o.baseAmount, 0)
        const totalLateFees = overdueList.reduce((sum, o) => sum + o.lateFee, 0)
        const totalDueCombined = totalOverdueRent + totalLateFees
        const overlockedCount = overdueList.filter(o => o.overlocked).length
        const criticalCount = overdueList.filter(o => o.overdueDays >= 15).length

        const filteredOverdue = overdueList.filter(o => {
          const matchTab =
            overdueTab === 'All' || overdueTab === 'Tất cả' ||
            ((overdueTab === 'grace' || overdueTab.includes('Gia hạn')) && o.stage === 'grace') ||
            ((overdueTab === 'notice' || overdueTab.includes('Thông báo')) && o.stage === 'notice') ||
            ((overdueTab === 'overlocked' || overdueTab.includes('Khóa cổng')) && (o.stage === 'overlocked' || o.overlocked)) ||
            ((overdueTab === 'lien' || overdueTab.includes('Đấu giá')) && o.stage === 'lien')
          const query = overdueSearch.toLowerCase().trim()
          const matchSearch =
            !query ||
            o.customer.toLowerCase().includes(query) ||
            o.unit.toLowerCase().includes(query) ||
            o.email.toLowerCase().includes(query) ||
            o.phone.includes(query)
          return matchTab && matchSearch
        })

        const toggleOverlockStatus = (account: OverdueAccount) => {
          const updated = !account.overlocked
          setOverdueList(prev =>
            prev.map(item =>
              item.id === account.id
                ? {
                    ...item,
                    overlocked: updated,
                    stage: updated ? 'overlocked' : item.overdueDays >= 30 ? 'lien' : item.overdueDays >= 8 ? 'notice' : 'grace'
                  }
                : item
            )
          )
          showToast(
            updated
              ? (lang === 'vi' ? `Đã khóa cổng gian kho ${account.unit}. Vô hiệu mã PIN.` : `Overlock placed on Unit ${account.unit}. Gate PIN disabled.`)
              : (lang === 'vi' ? `Đã gỡ khóa cổng gian kho ${account.unit}. Khôi phục quyền ra vào.` : `Overlock removed from Unit ${account.unit}. Access restored.`)
          )
        }

        const handleApplyLateFee = (account: OverdueAccount) => {
          setOverdueList(prev =>
            prev.map(item =>
              item.id === account.id ? { ...item, lateFee: item.lateFee + 25 } : item
            )
          )
          showToast(lang === 'vi' ? `Đã tính thêm $25.00 phí phạt trễ hạn cho ${account.customer}` : `Applied $25.00 late penalty fee to ${account.customer}`)
        }

        const handleWaiveLateFee = (account: OverdueAccount) => {
          setOverdueList(prev =>
            prev.map(item =>
              item.id === account.id ? { ...item, lateFee: 0 } : item
            )
          )
          showToast(lang === 'vi' ? `Đã miễn toàn bộ phí phạt trễ hạn cho ${account.customer}` : `Waived late penalty fees for ${account.customer}`)
        }

        const handleSettleAccount = (account: OverdueAccount) => {
          setOverdueList(prev => prev.filter(item => item.id !== account.id))
          // Also mark paid in rentalsList
          setRentalsList(prev =>
            prev.map(r => r.unit === account.unit ? { ...r, paid: 'paid', paymentStatus: 'paid' } : r)
          )
          showToast(lang === 'vi' ? `Đã tất toán toàn bộ dư nợ cho gian kho ${account.unit}!` : `Full balance collected for Unit ${account.unit}! Account resolved.`)
        }

        return (
          <div className="fade-in space-y-6">
            <SectionHeader
              title={lang === 'vi' ? 'Quản Trị Nợ Quá Hạn & Thu Hồi' : 'Delinquency & Collections Management'}
              subtitle={lang === 'vi' ? 'Theo dõi tài khoản chậm nộp, áp dụng khóa cổng điện tử và gửi thông báo leo thang' : 'Monitor delinquent accounts, enforce digital gate overlocks, and track collection notices'}
              action={
                <Button variant="outline" size="sm" onClick={() => showToast(lang === 'vi' ? 'Đã xuất sổ nhật ký theo dõi nợ!' : 'Delinquency aging report exported!')}>
                  {lang === 'vi' ? 'Xuất sổ nợ' : 'Export Delinquency Log'}
                </Button>
              }
            />

            {/* Overview Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title={lang === 'vi' ? 'Tài khoản nợ quá hạn' : 'Delinquent Accounts'}
                value={overdueList.length}
                delta={lang === 'vi' ? `${criticalCount} trường hợp nghiêm trọng` : `${criticalCount} at high risk`}
                deltaPositive={false}
                icon={Icon.alert}
                iconBg="bg-red-50 text-red-700"
              />
              <StatCard
                title={lang === 'vi' ? 'Tổng dư nợ quá hạn' : 'Total Past Due'}
                value={`$${totalDueCombined.toLocaleString()}`}
                delta={lang === 'vi' ? `$${totalLateFees} tiền phạt trễ` : `$${totalLateFees} in late fees`}
                icon={Icon.dollar}
                iconBg="bg-amber-50 text-amber-800"
              />
              <StatCard
                title={lang === 'vi' ? 'Kho đang bị khóa cổng' : 'Units Overlocked'}
                value={overlockedCount}
                delta={lang === 'vi' ? 'Đã khóa quyền mở cổng' : 'Access denied at gate'}
                icon={Icon.shield}
                iconBg="bg-stone-100 text-stone-800"
              />
              <StatCard
                title={lang === 'vi' ? 'Nguy cơ đấu giá (30n+)' : 'Lien Stage (30d+)'}
                value={overdueList.filter(o => o.overdueDays >= 30).length}
                delta={lang === 'vi' ? 'Cần thông báo pháp lý' : 'Legal notice required'}
                deltaPositive={false}
                icon={Icon.policy}
                iconBg="bg-rose-50 text-rose-800"
              />
            </div>

            {/* Delinquency Aging Stage Summary Bar */}
            <Card className="p-4 bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-red-50/70 border-amber-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="eyebrow text-amber-900">{lang === 'vi' ? 'Quy Trình Xử Lý Nợ Quá Hạn' : 'Delinquency Protocol'}</p>
                  <p className="text-sm font-semibold text-stone-900 mt-0.5">
                    {lang === 'vi' ? 'Khung Thời Gian Leo Thang Pháp Lý Tiêu Chuẩn' : 'Standard Facility Escalation Timeline'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-medium">{lang === 'vi' ? '1–7n: Gia hạn nhắc nhở' : '1–7d: Grace'}</span>
                  <span className="px-2.5 py-1 rounded bg-orange-100 text-orange-900 font-medium">{lang === 'vi' ? '8–14n: Thông báo + Phạt' : '8–14d: Notice'}</span>
                  <span className="px-2.5 py-1 rounded bg-red-100 text-red-900 font-medium">{lang === 'vi' ? '15–30n: Khóa cổng số' : '15–30d: Overlock'}</span>
                  <span className="px-2.5 py-1 rounded bg-rose-200 text-rose-950 font-bold">{lang === 'vi' ? '30n+: Niêm phong đấu giá' : '30d+: Lien Auction'}</span>
                </div>
              </div>
            </Card>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Tabs
                tabs={lang === 'vi' ? ['Tất cả', 'Gia hạn (1-7n)', 'Thông báo (8-14n)', 'Khóa cổng (15-30n)', 'Đấu giá (30n+)'] : ['All', 'grace', 'notice', 'overlocked', 'lien']}
                active={
                  overdueTab === 'All' && lang === 'vi' ? 'Tất cả' :
                  overdueTab === 'grace' && lang === 'vi' ? 'Gia hạn (1-7n)' :
                  overdueTab === 'notice' && lang === 'vi' ? 'Thông báo (8-14n)' :
                  overdueTab === 'overlocked' && lang === 'vi' ? 'Khóa cổng (15-30n)' :
                  overdueTab === 'lien' && lang === 'vi' ? 'Đấu giá (30n+)' : overdueTab
                }
                onChange={val => {
                  if (val === 'Tất cả') setOverdueTab('All')
                  else if (val.includes('Gia hạn')) setOverdueTab('grace')
                  else if (val.includes('Thông báo')) setOverdueTab('notice')
                  else if (val.includes('Khóa cổng')) setOverdueTab('overlocked')
                  else if (val.includes('Đấu giá')) setOverdueTab('lien')
                  else setOverdueTab(val)
                }}
              />
              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder={lang === 'vi' ? 'Tìm theo khách nợ, gian kho, SĐT...' : 'Search delinquent tenant, unit, phone...'}
                  value={overdueSearch}
                  onChange={e => setOverdueSearch(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Delinquent Cards List */}
            <div className="space-y-4">
              {filteredOverdue.length === 0 ? (
                <Card className="p-10 text-center text-stone-400">
                  <p className="text-base font-semibold text-stone-700">{lang === 'vi' ? 'Không có tài khoản quá hạn trong mục này' : 'No overdue accounts in this category'}</p>
                  <p className="text-xs mt-1">{lang === 'vi' ? 'Tất cả khách hàng trong danh mục đã được thanh toán hoặc ở trạng thái tốt.' : 'All tenant accounts within this filter are settled or in good standing.'}</p>
                </Card>
              ) : (
                filteredOverdue.map(o => (
                  <Card
                    key={o.id}
                    className={`p-5 transition-all border-l-4 ${
                      o.overdueDays >= 30
                        ? 'border-l-rose-700 bg-rose-50/20'
                        : o.overdueDays >= 15
                        ? 'border-l-red-500 bg-red-50/15'
                        : o.overdueDays >= 8
                        ? 'border-l-amber-500'
                        : 'border-l-yellow-400'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Tenant Profile */}
                      <div className="flex items-start gap-3.5">
                        <Avatar name={o.customer} size="md" />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-stone-900 text-base">{o.customer}</h3>
                            <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-stone-100 text-stone-800">
                              {lang === 'vi' ? `Kho ${o.unit}` : `Unit ${o.unit}`}
                            </span>
                            <Badge variant={o.overdueDays >= 30 ? 'error' : o.overdueDays >= 15 ? 'error' : 'warning'}>
                              {lang === 'vi' ? (o.overdueDays >= 30 ? 'Niêm phong đấu giá' : o.overdueDays >= 15 ? 'Khóa cổng số' : o.overdueDays >= 8 ? 'Thông báo lần 2' : 'Gia hạn nhắc nhở') : o.stageLabel}
                            </Badge>
                            {o.overlocked && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                                🔒 {lang === 'vi' ? 'ĐÃ KHÓA CỔNG' : 'OVERLOCKED'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 mt-1">
                            {o.email} • {o.phone} • {o.facility}
                          </p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            {lang === 'vi' ? 'Lần thông báo gần nhất:' : 'Last notice dispatch:'} <span className="text-stone-600 font-medium">{o.lastContact}</span> ({lang === 'vi' ? 'Đã gửi:' : 'Total reminders:'} {o.remindersSent})
                          </p>
                        </div>
                      </div>

                      {/* Middle: Financial Breakdown */}
                      <div className="flex items-center gap-5 bg-white px-4 py-2 rounded-lg border border-stone-200/80">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-stone-400 font-mono">{lang === 'vi' ? 'Số ngày trễ' : 'Days Past'}</p>
                          <p className="text-base font-bold text-red-600">{o.overdueDays} {lang === 'vi' ? 'ngày' : 'days'}</p>
                        </div>
                        <div className="h-8 w-px bg-stone-200" />
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-stone-400 font-mono">{lang === 'vi' ? 'Cước gốc' : 'Base Rent'}</p>
                          <p className="text-base font-semibold text-stone-700">${o.baseAmount}</p>
                        </div>
                        <div className="h-8 w-px bg-stone-200" />
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-stone-400 font-mono">{lang === 'vi' ? 'Phí phạt trễ' : 'Late Penalty'}</p>
                          <p className="text-base font-semibold text-red-700">+${o.lateFee}</p>
                        </div>
                        <div className="h-8 w-px bg-stone-200" />
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-stone-400 font-mono">{lang === 'vi' ? 'Tổng cần nộp' : 'Total Due'}</p>
                          <p className="text-lg font-bold text-stone-900">${o.baseAmount + o.lateFee}</p>
                        </div>
                      </div>

                      {/* Right: Operational Actions */}
                      <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
                        <Button
                          variant={o.overlocked ? 'secondary' : 'danger'}
                          size="sm"
                          onClick={() => toggleOverlockStatus(o)}
                        >
                          {lang === 'vi' ? (o.overlocked ? 'Mở khóa cổng' : 'Khóa cổng') : (o.overlocked ? 'Release Lock' : 'Overlock Unit')}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOverdue(o)
                            setReminderModal(true)
                          }}
                        >
                          {lang === 'vi' ? 'Gửi thông báo' : 'Send Notice'}
                        </Button>

                        {o.lateFee === 0 ? (
                          <Button variant="ghost" size="sm" onClick={() => handleApplyLateFee(o)}>
                            {lang === 'vi' ? '+ Phạt' : '+ Fee'}
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => handleWaiveLateFee(o)}>
                            {lang === 'vi' ? 'Miễn phạt' : 'Waive Fee'}
                          </Button>
                        )}

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSettleAccount(o)}
                        >
                          {lang === 'vi' ? 'Tất toán' : 'Settle'}
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar indicator */}
                    <div className="mt-3 pt-3 border-t border-stone-100">
                      <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                        <span>{lang === 'vi' ? `Chỉ số quá hạn (${o.overdueDays} / 45 ngày tối đa trước khi niêm phong đấu giá)` : `Delinquency Aging Index (${o.overdueDays} / 45 days max before public auction)`}</span>
                        <span className="font-semibold text-stone-600">
                          {o.overdueDays >= 30 ? (lang === 'vi' ? 'Giai đoạn đấu giá tài sản · Cần hành động ngay' : 'Lien Stage · Action Required') : o.overdueDays >= 15 ? (lang === 'vi' ? 'Quá hạn nghiêm trọng' : 'Severe Delinquency') : (lang === 'vi' ? 'Chậm nộp thông thường' : 'Moderate Late')}
                        </span>
                      </div>
                      <ProgressBar
                        value={o.overdueDays}
                        max={45}
                        color={o.overdueDays >= 30 ? 'bg-rose-700' : o.overdueDays >= 15 ? 'bg-red-500' : 'bg-amber-500'}
                      />
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )
      })()}

      {/* ── REPORTS ───────────────────────────────────────────── */}
      {page === 'reports' && (
        <div className="fade-in space-y-5">
          <SectionHeader
            title={lang === 'vi' ? 'Báo Cáo & Phân Tích Cơ Sở' : 'Facility Reports'}
            subtitle={lang === 'vi' ? `Hiệu suất vận hành trong ${REVENUE_DATA.length} tháng qua` : `${REVENUE_DATA.length} months of facility performance`}
            action={<Button variant="outline" size="sm" onClick={() => showToast(lang === 'vi' ? 'Đã tải xuống file PDF báo cáo cơ sở!' : 'Downloaded PDF report!')}>{lang === 'vi' ? 'Tải PDF' : 'Download PDF'}</Button>}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title={lang === 'vi' ? 'Tỷ lệ lấp đầy TB' : 'Avg Occupancy'} value="88.5%" icon={Icon.chart} iconBg="bg-blue-50" />
            <StatCard title={lang === 'vi' ? 'Doanh thu lũy kế' : 'YTD Revenue'} value="$168,400" icon={Icon.dollar} iconBg="bg-green-50" />
            <StatCard title={lang === 'vi' ? 'Lượt nhận kho' : 'Move-ins'} value="34" icon={Icon.truck} iconBg="bg-purple-50" />
            <StatCard title={lang === 'vi' ? 'Lượt trả kho' : 'Move-outs'} value="8" icon={Icon.refresh} iconBg="bg-amber-50" />
          </div>
          <Card className="p-5">
            <h3 className="font-semibold text-slate-800 mb-4">{lang === 'vi' ? 'Doanh Thu Theo Từng Tháng' : 'Revenue by Month'}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={REVENUE_DATA} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={((v: number) => [`$${v.toLocaleString()}`, lang === 'vi' ? 'Doanh thu' : 'Revenue']) as any} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="p-5">
              <h3 className="font-semibold text-slate-800 mb-4">{lang === 'vi' ? 'Tỷ Lệ Lấp Đầy Theo Loại Gian' : 'Unit Utilization'}</h3>
              {UTILIZATION.map(r => (
                <div key={r.label} className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{r.label}</span>
                    <span className="font-semibold text-slate-800">{r.used}/{r.total} <span className="text-slate-400 font-normal">({Math.round(r.used/r.total*100)}%)</span></span>
                  </div>
                  <ProgressBar value={r.used} max={r.total} color={r.color} />
                </div>
              ))}
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-slate-800 mb-4">{lang === 'vi' ? 'Chỉ Số Hỗ Trợ Khách Hàng' : 'Support Metrics'}</h3>
              <div className="space-y-4">
                {SUPPORT_METRICS.map(m => (
                  <div key={m.label} className="flex justify-between items-start border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {lang === 'vi' ? (
                          m.label === 'Avg First Response' ? 'Thời gian phản hồi đầu tiên' :
                          m.label === 'Resolution Rate' ? 'Tỷ lệ giải quyết dứt điểm' :
                          m.label === 'Customer Satisfaction' ? 'Độ hài lòng của khách (CSAT)' : m.label
                        ) : m.label}
                      </p>
                      <p className="text-xs text-slate-400">
                        {lang === 'vi' ? (
                          m.sub.includes('target') ? 'Đạt mục tiêu SLA' :
                          m.sub.includes('resolved') ? 'Trong vòng 24 giờ' :
                          m.sub.includes('reviews') ? 'Dựa trên 48 đánh giá' : m.sub
                        ) : m.sub}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{m.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── PROFILE PAGE ─────────────────────────────────────── */}
      {page === 'profile' && (
        <div className="fade-in">
          <ProfileView user={user} />
        </div>
      )}

      {/* ── TOAST MESSAGE ──────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#292a27] text-white px-5 py-3 rounded-lg shadow-2xl border border-amber-500/50 flex items-center gap-3 fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-[#e9a12c] animate-ping" />
          <p className="text-sm font-medium">{toast}</p>
        </div>
      )}

      {/* ── MODALS ────────────────────────────────────────────── */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title={lang === 'vi' ? 'Chỉnh Sửa Thông Số Gian Kho' : 'Edit Unit Specifications'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label={lang === 'vi' ? 'Mã gian kho' : 'Unit ID'} placeholder="U-XXX" />
            <Input label={lang === 'vi' ? 'Kích thước (ft)' : 'Size (ft)'} placeholder="10x10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label={lang === 'vi' ? 'Tầng' : 'Floor'}><option>1</option><option>2</option><option>3</option><option>4</option></Select>
            <Select label={lang === 'vi' ? 'Trạng thái' : 'Status'}>
              <option>{lang === 'vi' ? 'Còn trống' : 'Available'}</option>
              <option>{lang === 'vi' ? 'Đã thuê' : 'Occupied'}</option>
              <option>{lang === 'vi' ? 'Bảo trì' : 'Maintenance'}</option>
              <option>{lang === 'vi' ? 'Đã đặt' : 'Reserved'}</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label={lang === 'vi' ? 'Giá thuê/tháng ($)' : 'Monthly Price ($)'} placeholder="89" type="number" />
            <Select label={lang === 'vi' ? 'Hệ thống điều hòa' : 'Climate Control'}>
              <option>{lang === 'vi' ? 'Có điều hòa' : 'Yes'}</option>
              <option>{lang === 'vi' ? 'Không' : 'No'}</option>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setEditModal(false)}>
              {lang === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button variant="primary" onClick={() => { setEditModal(false); showToast(lang === 'vi' ? 'Đã lưu thay đổi thông số gian kho!' : 'Unit specifications saved!') }}>
              {lang === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lease Details Modal */}
      <Modal open={viewRentalModal} onClose={() => setViewRentalModal(false)} title={lang === 'vi' ? 'Chi Tiết Hợp Đồng & Mã Cổng' : 'Lease Agreement & Access Details'}>
        {selectedRental && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#292a27] p-4 text-white">
              <div className="flex justify-between items-center text-xs font-mono text-[#e9a12c]">
                <span>{lang === 'vi' ? 'HỢP ĐỒNG' : 'AGREEMENT'} {selectedRental.id}</span>
                <span className="uppercase">{selectedRental.facility}</span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold font-mono">{lang === 'vi' ? `Kho ${selectedRental.unit}` : `Unit ${selectedRental.unit}`}</p>
                  <p className="text-xs text-stone-300">{selectedRental.unitType} · {selectedRental.size} ft</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-amber-300">${selectedRental.amount}<span className="text-xs text-stone-400">/{lang === 'vi' ? 'th' : 'mo'}</span></p>
                  <p className="text-[11px] text-stone-400">{lang === 'vi' ? 'Đặt cọc' : 'Deposit'}: ${selectedRental.deposit}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-3 rounded-lg border border-stone-200">
              <div>
                <span className="text-stone-400 block">{lang === 'vi' ? 'Tên khách thuê' : 'Tenant Name'}</span>
                <span className="font-semibold text-stone-800 text-sm">{selectedRental.customer}</span>
              </div>
              <div>
                <span className="text-stone-400 block">{lang === 'vi' ? 'Số điện thoại' : 'Contact Phone'}</span>
                <span className="font-semibold text-stone-800 text-sm">{selectedRental.phone}</span>
              </div>
              <div>
                <span className="text-stone-400 block">{lang === 'vi' ? 'Ngày bắt đầu' : 'Start Date'}</span>
                <span className="font-medium text-stone-700">{selectedRental.startDate}</span>
              </div>
              <div>
                <span className="text-stone-400 block">{lang === 'vi' ? 'Hạn kỳ tiếp theo' : 'Current Expiry / Term'}</span>
                <span className="font-medium text-stone-700">{selectedRental.endDate}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-900">{lang === 'vi' ? 'Mã Khóa Cổng Số (Digital PIN)' : 'Digital Gate PIN Passcode'}</p>
                <p className="text-xs text-amber-700 font-mono font-bold mt-0.5">{selectedRental.gateCode}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast(lang === 'vi' ? `Mã PIN ${selectedRental.gateCode} đã được tạo mới & gửi SMS đến khách!` : `Gate PIN ${selectedRental.gateCode} regenerated & dispatched via SMS!`)}
              >
                {lang === 'vi' ? 'Đặt lại mã PIN' : 'Reset PIN'}
              </Button>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-stone-100 text-xs text-stone-500">
              <span>{lang === 'vi' ? 'Tự động trừ nợ:' : 'Auto-Pay:'} {selectedRental.autoRenew ? (lang === 'vi' ? 'Đã kích hoạt' : 'Active (Visa ending 4242)') : (lang === 'vi' ? 'Chưa bật' : 'Disabled')}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewRentalModal(false)}>
                  {lang === 'vi' ? 'Đóng' : 'Close'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setRentalsList(prev => prev.map(r => r.id === selectedRental.id ? { ...r, status: 'terminated' } : r))
                    setViewRentalModal(false)
                    showToast(lang === 'vi' ? `Hợp đồng thuê ${selectedRental.id} đã được chấm dứt.` : `Lease agreement ${selectedRental.id} terminated.`)
                  }}
                >
                  {lang === 'vi' ? 'Chấm dứt hợp đồng' : 'Terminate Lease'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal open={recordPaymentModal} onClose={() => setRecordPaymentModal(false)} title={lang === 'vi' ? 'Ghi Nhận Thu Cước Thuê Kho' : 'Record Rent Settlement'}>
        {selectedRental && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-sm flex justify-between items-center">
              <div>
                <p className="font-semibold text-emerald-900">{lang === 'vi' ? `Kho ${selectedRental.unit}` : `Unit ${selectedRental.unit}`} · {selectedRental.customer}</p>
                <p className="text-xs text-emerald-700">{lang === 'vi' ? 'Hạn thu:' : 'Next Due:'} {selectedRental.nextDue}</p>
              </div>
              <p className="text-xl font-bold text-emerald-900">${selectedRental.amount}.00</p>
            </div>

            <Select label={lang === 'vi' ? 'Phương thức thanh toán' : 'Payment Method'}>
              <option>{lang === 'vi' ? 'Tiền mặt tại quầy' : 'Cash at Counter'}</option>
              <option>{lang === 'vi' ? 'Chuyển khoản VietQR' : 'Bank Transfer / VietQR'}</option>
              <option>{lang === 'vi' ? 'Quẹt thẻ máy POS' : 'POS Terminal Card Swipe'}</option>
              <option>{lang === 'vi' ? 'Thanh toán trực tuyến thẻ quốc tế' : 'Manual Card Charge'}</option>
            </Select>

            <Input
              label={lang === 'vi' ? 'Mã chứng từ / Biên lai' : 'Receipt / Transaction Reference'}
              placeholder="REC-2026-XXXX"
              defaultValue={`REC-${Date.now().toString().slice(-5)}`}
            />

            <div className="flex gap-2 justify-end pt-2 border-t border-stone-100">
              <Button variant="outline" onClick={() => setRecordPaymentModal(false)}>
                {lang === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setRentalsList(prev =>
                    prev.map(r => r.id === selectedRental.id ? { ...r, paid: 'paid', paymentStatus: 'paid' } : r)
                  )
                  setRecordPaymentModal(false)
                  showToast(lang === 'vi' ? `Đã ghi nhận thu $${selectedRental.amount} thành công cho gian kho ${selectedRental.unit}!` : `Payment of $${selectedRental.amount} recorded successfully for Unit ${selectedRental.unit}!`)
                }}
              >
                {lang === 'vi' ? 'Xác nhận thu cước' : 'Confirm Settlement'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Lease Agreement Modal */}
      <Modal open={newLeaseModal} onClose={() => setNewLeaseModal(false)} title={lang === 'vi' ? 'Tạo Hợp Đồng Thuê Kho Mới' : 'Create New Lease Agreement'}>
        <div className="space-y-4">
          <Input
            label={lang === 'vi' ? 'Họ và tên khách thuê' : 'Tenant Full Name'}
            placeholder="e.g. Nguyễn Thu Trang"
            value={newTenantName}
            onChange={e => setNewTenantName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              placeholder="tenant@email.com"
              value={newTenantEmail}
              onChange={e => setNewTenantEmail(e.target.value)}
            />
            <Input
              label={lang === 'vi' ? 'Số điện thoại' : 'Phone Number'}
              placeholder="+84 900 000 000"
              value={newTenantPhone}
              onChange={e => setNewTenantPhone(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={lang === 'vi' ? 'Chỉ định gian kho' : 'Assign Unit'}
              value={newTenantUnit}
              onChange={e => setNewTenantUnit(e.target.value)}
            >
              <option value="A-104">{lang === 'vi' ? 'Gian A-104 (5 ft Nhỏ · $89/tháng)' : 'Unit A-104 (5 ft Small · $89/mo)'}</option>
              <option value="C-301">{lang === 'vi' ? 'Gian C-301 (20 ft Lớn · $269/tháng)' : 'Unit C-301 (20 ft Large · $269/mo)'}</option>
              <option value="B-112">{lang === 'vi' ? 'Gian B-112 (10 ft Vừa · $155/tháng)' : 'Unit B-112 (10 ft Medium · $155/mo)'}</option>
            </Select>
            <Input
              label={lang === 'vi' ? 'Giá thuê/tháng ($)' : 'Monthly Rate ($)'}
              value={newTenantAmount}
              onChange={e => setNewTenantAmount(e.target.value)}
              type="number"
            />
          </div>
          <div className="flex gap-2 justify-end pt-3 border-t border-stone-100">
            <Button variant="outline" onClick={() => setNewLeaseModal(false)}>
              {lang === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              disabled={!newTenantName.trim()}
              onClick={() => {
                const newRec: RentalRecord = {
                  id: `RNT-2026-${Math.floor(100 + Math.random() * 900)}`,
                  customer: newTenantName,
                  tenant: newTenantName,
                  email: newTenantEmail || 'tenant@demo.storagehub',
                  phone: newTenantPhone || '+84 908 000 111',
                  unit: newTenantUnit,
                  unitType: 'Standard Climate',
                  size: 10,
                  facility: 'Downtown Storage',
                  amount: Number(newTenantAmount) || 89,
                  deposit: Number(newTenantAmount) || 89,
                  status: 'active',
                  paid: 'paid',
                  paymentStatus: 'paid',
                  startDate: 'Sep 18, 2026',
                  nextDue: 'Oct 18, 2026',
                  dueDate: 'Oct 18, 2026',
                  endDate: 'Sep 18, 2027',
                  autoRenew: true,
                  gateCode: `${Math.floor(1000 + Math.random() * 9000)}#`
                }
                setRentalsList([newRec, ...rentalsList])
                setNewLeaseModal(false)
                setNewTenantName('')
                showToast(lang === 'vi' ? `Hợp đồng mới ${newRec.id} cho khách ${newRec.customer} đã được kích hoạt!` : `New lease ${newRec.id} executed for ${newRec.customer}!`)
              }}
            >
              {lang === 'vi' ? 'Phát hành hợp đồng' : 'Issue Lease Contract'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Enhanced Overdue Reminder Modal */}
      <Modal open={reminderModal} onClose={() => setReminderModal(false)} title={lang === 'vi' ? 'Gửi Thông Báo Leo Thang Nợ Quá Hạn' : 'Delinquency Collection Notice Dispatch'}>
        {selectedOverdue && (
          <div className="space-y-4">
            <div className="bg-stone-50 rounded-lg p-3 text-sm space-y-1.5 border border-stone-200">
              <div className="flex justify-between">
                <span className="text-stone-500">{lang === 'vi' ? 'Khách hàng nhận' : 'Recipient'}</span>
                <span className="font-semibold text-stone-900">{selectedOverdue.customer} ({selectedOverdue.email})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{lang === 'vi' ? 'Mã gian kho' : 'Unit Number'}</span>
                <span className="font-mono font-bold text-stone-800">{selectedOverdue.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{lang === 'vi' ? 'Tổng nợ quá hạn' : 'Total Outstanding'}</span>
                <span className="font-bold text-red-600">${selectedOverdue.amount + selectedOverdue.lateFee} ({selectedOverdue.overdueDays} {lang === 'vi' ? 'ngày trễ' : 'days late'})</span>
              </div>
            </div>

            <Select
              label={lang === 'vi' ? 'Mẫu thông báo' : 'Notice Template'}
              value={reminderTemplate}
              onChange={e => setReminderTemplate(e.target.value)}
            >
              <option value="Friendly Reminder">{lang === 'vi' ? 'Nhắc nhở nhẹ nhàng (SMS & Email)' : 'Friendly Reminder (SMS & Email)'}</option>
              <option value="Second Notice">{lang === 'vi' ? 'Thông báo lần 2 (Cảnh báo phí phạt chậm nộp)' : 'Second Formal Notice (Late fee warning)'}</option>
              <option value="Overlock Warning">{lang === 'vi' ? 'Cảnh báo khóa cổng điện tử (Hạn 48 giờ)' : 'Digital Gate Overlock Warning (48-hour cutoff)'}</option>
              <option value="Lien Notice">{lang === 'vi' ? 'Thông báo pháp lý niêm phong & đấu giá tài sản' : 'Final Legal Notice of Lien & Public Auction'}</option>
            </Select>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">{lang === 'vi' ? 'Nội dung thông báo dự kiến' : 'Notice Body Preview'}</label>
              <textarea
                rows={4}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs font-mono text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                defaultValue={
                  reminderTemplate.includes('Friendly') || reminderTemplate.includes('Nhắc')
                    ? (lang === 'vi' ? `Xin chào ${selectedOverdue.customer}, ban quản lý StorageHub xin nhắc cước phí thuê gian kho ${selectedOverdue.unit} với số tiền $${selectedOverdue.amount + selectedOverdue.lateFee} đã đến hạn thanh toán ngày ${selectedOverdue.dueDate}. Vui lòng thanh toán trực tuyến hoặc liên hệ quầy lễ tân.` : `Hi ${selectedOverdue.customer}, this is a polite reminder from Downtown Storage that rent of $${selectedOverdue.amount + selectedOverdue.lateFee} for unit ${selectedOverdue.unit} was due on ${selectedOverdue.dueDate}. Please click here to settle online.`)
                    : reminderTemplate.includes('Overlock') || reminderTemplate.includes('khóa')
                    ? (lang === 'vi' ? `CẢNH BÁO KHẨN: Quý khách ${selectedOverdue.customer}, gian kho ${selectedOverdue.unit} đã quá hạn ${selectedOverdue.overdueDays} ngày. Nếu không thanh toán trong 48 giờ tới, hệ thống sẽ tự động khóa cổng số (Overlock).` : `URGENT NOTICE: Tenant ${selectedOverdue.customer}, unit ${selectedOverdue.unit} is ${selectedOverdue.overdueDays} days past due. If not settled within 48 hours, digital gate keypad access will be suspended (Overlocked).`)
                    : (lang === 'vi' ? `THÔNG BÁO NIÊM PHONG PHÁP LÝ: Căn cứ quy chế thuê kho StorageHub, tài sản tại gian kho ${selectedOverdue.unit} sẽ bị niêm phong và tiến hành các thủ tục đấu giá công khai để thu hồi nợ đọng $${selectedOverdue.amount + selectedOverdue.lateFee}.` : `OFFICIAL LIEN NOTICE: Pursuant to the Self-Storage Facility Act, your stored property in unit ${selectedOverdue.unit} is subject to a possessory lien for unpaid rent of $${selectedOverdue.amount + selectedOverdue.lateFee}. Immediate payment is required.`)
                }
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-stone-100">
              <Button variant="outline" onClick={() => setReminderModal(false)}>
                {lang === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setReminderModal(false)
                  showToast(lang === 'vi' ? `Thông báo đã được gửi thành công đến ${selectedOverdue.customer} qua SMS & Email!` : `Notice successfully dispatched to ${selectedOverdue.customer} via Email & SMS!`)
                }}
              >
                {lang === 'vi' ? 'Gửi thông báo ngay' : 'Dispatch Notice Now'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
