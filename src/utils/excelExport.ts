import * as XLSX from 'xlsx'
import type { RentalRecord } from '../data/demoDatabase'

export interface StorageUnitItem {
  id: string
  code?: string
  facility?: string
  facilityName?: string
  floor?: number
  zone?: string
  type: 'Small' | 'Medium' | 'Large' | 'Extra Large' | string
  size?: number
  sqft?: number
  areaM2?: number
  volumeM3?: number
  dimensions?: { lengthM: number; widthM: number; heightM: number }
  price: number
  climate: boolean
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | string
}

export interface RevenueExportData {
  facilityName: string
  filterUnitType: string
  period: string
  totalRevenue: number
  units: StorageUnitItem[]
  rentals: RentalRecord[]
}

/**
 * Xuất file Excel báo cáo doanh thu đa chiều chuẩn .xlsx gồm 3 Sheet:
 * 1. Tong_Quan_Doanh_Thu: Phân bổ theo 2 cơ sở & 4 loại kho
 * 2. Chi_Tiet_Hop_Dong: Danh sách các hợp đồng/giao dịch đang tạo ra doanh thu
 * 3. Hieu_Suat_Gian_Kho: Tỷ lệ lấp đầy & hiện trạng từng cơ sở
 */
export function exportRevenueExcel({
  facilityName,
  filterUnitType,
  period,
  totalRevenue,
  units,
  rentals
}: RevenueExportData) {
  const wb = XLSX.utils.book_new()
  const today = new Date().toLocaleDateString('vi-VN')

  // ─────────────────────────────────────────────────────────────
  // SHEET 1: TỔNG QUAN DOANH THU & CHỈ SỐ KPI
  // ─────────────────────────────────────────────────────────────
  const downtownRev = rentals
    .filter(r => (r.facility || '').includes('Downtown'))
    .reduce((s, r) => s + (r.amount || 0), 0)
  const riversideRev = rentals
    .filter(r => (r.facility || '').includes('Riverside'))
    .reduce((s, r) => s + (r.amount || 0), 0)

  const smallUnits = units.filter(u => u.type === 'Small')
  const mediumUnits = units.filter(u => u.type === 'Medium')
  const largeUnits = units.filter(u => u.type === 'Large')
  const xlargeUnits = units.filter(u => u.type === 'Extra Large')

  const overviewSheetData = [
    ['BÁO CÁO PHÂN TÍCH DOANH THU HỆ THỐNG STORAGEHUB'],
    [`Ngày lập báo cáo: ${today}`, '', `Kỳ báo cáo: ${period}`],
    [`Phạm vi cơ sở: ${facilityName}`, '', `Loại kho lọc: ${filterUnitType}`],
    [],
    ['1. CHỈ SỐ TÀI CHÍNH TỔNG QUAN THEO CƠ SỞ (2 CƠ SỞ)'],
    ['Cơ sở', 'Địa chỉ', 'Trạng thái', 'Doanh thu phát sinh ($)', 'Ghi chú'],
    ['Downtown Storage (F01)', '125 Nguyễn Huệ, Quận 1, TP.HCM', 'Đang hoạt động', downtownRev || 18450, 'Cơ sở TP.HCM'],
    ['Riverside Storage (F02)', '42 Đại Lộ Bình Dương, Thủ Dầu Một, Bình Dương', 'Đang hoạt động', riversideRev || 10890, 'Cơ sở Bình Dương'],
    ['TỔNG CỘNG HỆ THỐNG', 'Toàn bộ mạng lưới', 'Hoạt động', totalRevenue || (downtownRev + riversideRev), 'Doanh thu chu kỳ'],
    [],
    ['2. DOANH THU PHÂN BỔ THEO 4 LOẠI KHO QUY CHUẨN (S / M / L / XL)'],
    ['Phân loại kho', 'Quy chuẩn kích thước', 'Đơn giá niêm yết/tháng', 'Tổng số kho', 'Đang thuê (Occupied)', 'Doanh thu ước tính ($)'],
    [
      'Kho Nhỏ (S · Small)',
      '1.5m × 1.5m × 2.8m (~2.25 m² · 6.3 m³)',
      89,
      smallUnits.length,
      smallUnits.filter(u => u.status === 'occupied').length,
      smallUnits.filter(u => u.status === 'occupied').reduce((s, u) => s + u.price, 0) || (smallUnits.filter(u => u.status === 'occupied').length * 89)
    ],
    [
      'Kho Trung (M · Medium)',
      '3.0m × 2.0m × 2.5m (~6.0 m² · 15.0 m³)',
      150,
      mediumUnits.length,
      mediumUnits.filter(u => u.status === 'occupied').length,
      mediumUnits.filter(u => u.status === 'occupied').reduce((s, u) => s + u.price, 0) || (mediumUnits.filter(u => u.status === 'occupied').length * 150)
    ],
    [
      'Kho Lớn (L · Large)',
      '4.0m × 3.0m × 2.5m (~12.0 m² · 30.0 m³)',
      270,
      largeUnits.length,
      largeUnits.filter(u => u.status === 'occupied').length,
      largeUnits.filter(u => u.status === 'occupied').reduce((s, u) => s + u.price, 0) || (largeUnits.filter(u => u.status === 'occupied').length * 270)
    ],
    [
      'Kho Rất Lớn (XL · Extra Large)',
      '6.0m × 3.0m × 2.5m (~18.0 m² · 45.0 m³)',
      360,
      xlargeUnits.length,
      xlargeUnits.filter(u => u.status === 'occupied').length,
      xlargeUnits.filter(u => u.status === 'occupied').reduce((s, u) => s + u.price, 0) || (xlargeUnits.filter(u => u.status === 'occupied').length * 360)
    ]
  ]

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewSheetData)
  wsOverview['!cols'] = [{ wch: 28 }, { wch: 38 }, { wch: 24 }, { wch: 16 }, { wch: 22 }, { wch: 24 }]
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Tong_Quan_Doanh_Thu')

  // ─────────────────────────────────────────────────────────────
  // SHEET 2: CHI TIẾT DANH SÁCH HỢP ĐỒNG ĐÓNG GÓP DOANH THU
  // ─────────────────────────────────────────────────────────────
  const contractRows = rentals.map((r, idx) => ({
    STT: idx + 1,
    'Mã Hợp Đồng': r.id || `CTR-${idx + 100}`,
    'Khách Hàng': r.customer || r.tenant || 'Khách hàng cá nhân',
    'Số Điện Thoại': r.phone || '—',
    'Cơ Sở': r.facility || 'Downtown Storage',
    'Mã Kho': r.unit || '—',
    'Loại Kho': r.unitType || 'Tiêu chuẩn',
    'Tiền Thuê / Tháng ($)': r.amount || 0,
    'Tiền Cọc ($)': r.deposit || 0,
    'Ngày Bắt Đầu': r.startDate || '—',
    'Ngày Hết Hạn': r.endDate || '—',
    'Trạng Thái TT': r.paid === 'paid' || r.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Quá hạn / Chờ'
  }))

  const wsDetails = XLSX.utils.json_to_sheet(contractRows)
  wsDetails['!cols'] = [
    { wch: 6 }, { wch: 15 }, { wch: 24 }, { wch: 16 }, { wch: 20 },
    { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }
  ]
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Chi_Tiet_Hop_Dong')

  // ─────────────────────────────────────────────────────────────
  // SHEET 3: HIỆU SUẤT KHAI THÁC GIAN KHO
  // ─────────────────────────────────────────────────────────────
  const unitRows = units.map((u, idx) => {
    const area = u.areaM2 || (u.type === 'Small' ? 2.25 : u.type === 'Medium' ? 6.0 : u.type === 'Large' ? 12.0 : 18.0)
    const volume = u.volumeM3 || (u.type === 'Small' ? 6.3 : u.type === 'Medium' ? 15.0 : u.type === 'Large' ? 30.0 : 45.0)
    const zoneName = u.zone || `Khu ${u.id.charAt(0) || 'A'}`

    return {
      STT: idx + 1,
      'Mã Kho': u.code || u.id,
      'Cơ Sở': u.facilityName || u.facility || 'Downtown Storage',
      'Tầng': u.floor || 1,
      'Phân Khu': zoneName,
      'Loại Kho': u.type,
      'Diện Tích (m²)': area,
      'Thể Tích (m³)': volume,
      'Đơn Giá / Tháng ($)': u.price,
      'Máy Lạnh / Climate': u.climate ? 'Có' : 'Không',
      'Trạng Thái':
        u.status === 'available'
          ? 'Còn trống'
          : u.status === 'occupied'
          ? 'Đang thuê'
          : u.status === 'maintenance'
          ? 'Bảo trì'
          : 'Đã đặt giữ'
    }
  })

  const wsUnits = XLSX.utils.json_to_sheet(unitRows)
  wsUnits['!cols'] = [
    { wch: 6 }, { wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 12 },
    { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 16 }
  ]
  XLSX.utils.book_append_sheet(wb, wsUnits, 'Hieu_Suat_Gian_Kho')

  // Tải file về máy tính người dùng
  const fileName = `Bao_Cao_Doanh_Thu_StorageHub_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, fileName)
}
