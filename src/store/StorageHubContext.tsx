import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import type {
  Facility,
  StorageUnit,
  StorageReservation,
  StorageHold,
  StorageContract,
  StoragePayment,
  CheckInRecord,
  RentalRecord,
  ReturnCase,
  ActivityRecord,
  BusinessConfig,
  GoodsDeclaration,
  PricingQuote,
  PricingSnapshot,
  ReservationValidationResult,
  UnitType,
  DamageClassification,
  ReservationStatus,
  AccessCredential,
  RenewalRecord,
  MaintenanceTask,
  ReservedPeriod
} from '../types/storageHub'
import type { User } from '../types'
import { FACILITIES, UNITS, TICKETS, type TicketItem } from '../data/demoDatabase'

const STORAGE_KEY = 'storagehub:v3:canonical'

export const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  dimDivisor: 5000,
  gracePeriodDays: 5,
  lateFeeAmount: 25,
  defaultDepositRatio: 1.0,
  holdExpiryHours: 24
}

// 4 Standard Unit Types based on Metric DIM (m, m², m³)
export const UNIT_TYPES: UnitType[] = [
  {
    id: 'small',
    name: 'Small Storage',
    lengthM: 1.5,
    widthM: 1.5,
    heightM: 2.8,
    areaM2: 2.25,
    volumeM3: 6.3,
    pricePerM3: 14,
    monthlyPrice: 89,
    maxLoadKg: 600,
    descriptionVi: 'Phù hợp: 20–30 thùng hàng, 1 xe máy, vali đồ đạc cá nhân (~2.25 m²)',
    descriptionEn: 'Fits: 20–30 storage boxes, 1 motorbike, luggage & personal items (~2.25 m²)'
  },
  {
    id: 'medium',
    name: 'Medium Storage',
    lengthM: 3.0,
    widthM: 2.0,
    heightM: 2.5,
    areaM2: 6.0,
    volumeM3: 15.0,
    pricePerM3: 10,
    monthlyPrice: 150,
    maxLoadKg: 1200,
    descriptionVi: 'Phù hợp: 50–70 thùng hàng, đồ đạc gia đình, thiết bị văn phòng (~6.0 m²)',
    descriptionEn: 'Fits: 50–70 storage boxes, household furniture, office equipment (~6.0 m²)'
  },
  {
    id: 'large',
    name: 'Large Storage',
    lengthM: 4.0,
    widthM: 3.0,
    heightM: 2.5,
    areaM2: 12.0,
    volumeM3: 30.0,
    pricePerM3: 9,
    monthlyPrice: 270,
    maxLoadKg: 2400,
    descriptionVi: 'Phù hợp: 100–150 thùng hàng, đồ đạc chuyển nhà, tồn kho kinh doanh (~12.0 m²)',
    descriptionEn: 'Fits: 100–150 boxes, apartment relocation, e-commerce business inventory (~12.0 m²)'
  },
  {
    id: 'xlarge',
    name: 'Extra Large Commercial',
    lengthM: 6.0,
    widthM: 3.0,
    heightM: 2.5,
    areaM2: 18.0,
    volumeM3: 45.0,
    pricePerM3: 8,
    monthlyPrice: 360,
    maxLoadKg: 3600,
    descriptionVi: 'Phù hợp: Kho thương mại, pallet hàng hóa số lượng lớn, máy móc công nghiệp (~18.0 m²)',
    descriptionEn: 'Fits: Commercial pallets, large volume freight, machinery (~18.0 m²)'
  }
]

// Date Overlap Checking Utility
export function checkDateOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  if (!startA || !endA || !startB || !endB) return false
  const sA = new Date(startA).getTime()
  const eA = new Date(endA).getTime()
  const sB = new Date(startB).getTime()
  const eB = new Date(endB).getTime()
  return sA < eB && eA > sB
}

// Map demo facilities
const INITIAL_FACILITIES: Facility[] = FACILITIES.map(f => ({
  id: f.id,
  name: f.name,
  address: f.address,
  city: f.city,
  rating: f.rating,
  available: f.available,
  price: f.price,
  climate: f.climate,
  security: f.security,
  image: f.image,
  units: f.units,
  occupied: f.occupied,
  revenue: f.revenue,
  growth: f.growth,
  manager: f.manager,
  status: 'active',
  accessHours: '06:00 - 22:00 hàng ngày (24/7 đối với kho VIP)',
  timezone: 'Asia/Ho_Chi_Minh'
}))

// Map demo units to typed StorageUnit using purely metric dimensions
const INITIAL_UNITS: StorageUnit[] = UNITS.map((u, idx) => {
  const facilityId = u.facility === 'Downtown Storage' ? 'fac-001' : 'fac-002'
  let lengthM = 1.5, widthM = 1.5, heightM = 2.8, volumeM3 = 6.3, price = 89, maxLoadKg = 600, areaM2 = 2.25
  if (u.type === 'Medium') {
    lengthM = 3.0; widthM = 2.0; heightM = 2.5; volumeM3 = 15.0; price = 150; maxLoadKg = 1200; areaM2 = 6.0
  } else if (u.type === 'Large') {
    lengthM = 4.0; widthM = 3.0; heightM = 2.5; volumeM3 = 30.0; price = 270; maxLoadKg = 2400; areaM2 = 12.0
  } else if (u.type === 'Extra Large') {
    lengthM = 6.0; widthM = 3.0; heightM = 2.5; volumeM3 = 45.0; price = 360; maxLoadKg = 3600; areaM2 = 18.0
  }

  const isReservedDemo = u.id === 'A-104' || u.id === 'A-115'
  const isOccupiedDemo = u.id === 'C-301' || u.id === 'B-208' || u.id === 'D-402'
  const reservedPeriods: ReservedPeriod[] = []
  if (u.id === 'A-104') {
    reservedPeriods.push({
      reservationId: 'RSV-2048',
      customerName: 'Nguyen Minh Anh',
      startDate: '2026-09-20',
      endDate: '2027-03-20'
    })
  }

  return {
    id: u.id,
    code: u.id,
    facilityId,
    facilityName: u.facility,
    floor: u.floor,
    zone: `Khu ${String.fromCharCode(65 + (idx % 4))}`,
    type: u.type as any,
    areaM2,
    dimensions: { lengthM, widthM, heightM },
    doorDimensions: { widthM: 1.1, heightM: 2.2 },
    volumeM3,
    maxLoadKg,
    allowedGoods: ['Đồ gia dụng', 'Thiết bị văn phòng', 'Tài liệu, hồ sơ', 'Hàng thương mại điện tử'],
    prohibitedGoods: ['Chất dễ cháy nổ', 'Hóa chất độc hại', 'Hàng cấm theo luật', 'Thực phẩm tươi sống'],
    price,
    deposit: price,
    climate: u.climate,
    status: isOccupiedDemo ? 'occupied' : isReservedDemo ? 'reserved' : 'available',
    reservedPeriods,
    nextAvailableDate: u.id === 'A-104' ? '2027-03-21' : u.id === 'B-208' ? '2027-01-13' : undefined,
    currentRentalId: isOccupiedDemo ? (u.id === 'C-301' ? 'RNT-INIT-PREV' : `rent-init-${u.id}`) : undefined,
    version: 1
  }
})

// Initial reservations demonstrating the canonical lifecycle
const INITIAL_RESERVATIONS: StorageReservation[] = [
  {
    id: 'RSV-2048',
    customerId: 'cust-demo-1',
    customerName: 'Nguyen Minh Anh',
    customerEmail: 'anh.nguyen@outlook.com',
    customerPhone: '090 123 4567',
    identityId: '079203001234',
    facilityId: 'fac-001',
    facilityName: 'Downtown Storage',
    unitId: 'A-104',
    unitTypeId: 'small',
    unitTypeName: 'Small Storage',
    assignedUnitId: 'A-104',
    rentalMonths: 6,
    startDate: '2026-09-20',
    endDate: '2027-03-20',
    moveInDate: '2026-09-20',
    status: 'READY_FOR_CHECKIN',
    approvalType: 'AUTO',
    reservationDepositAmount: 36, // 20% of (89 + 89)
    securityDepositAmount: 89,    // 1-month rent
    depositConvertedAt: '2026-09-17T10:00:00Z',
    remainingAmount: 0,
    firstMonthRent: 89,
    totalInitialAmount: 178,
    largestItemDimensionsCm: { lengthCm: 80, widthCm: 60, heightCm: 70 },
    goods: {
      category: 'Tài liệu và đồ gia dụng',
      packageCount: 12,
      lengthCm: 80,
      widthCm: 60,
      heightCm: 70,
      weightKg: 180,
      dimWeightKg: 67,
      material: 'Giấy, nhựa, vải',
      condition: '12 kiện nguyên niêm phong, khô ráo',
      fragile: false,
      notes: 'Thùng carton tiêu chuẩn niêm phong băng dính'
    },
    quote: {
      quoteId: 'QUO-2048',
      unitId: 'A-104',
      facilityId: 'fac-001',
      baseMonthlyPrice: 89,
      depositAmount: 89,
      dimSurcharge: 0,
      totalFirstPayment: 178,
      dimWeightKg: 67,
      actualWeightKg: 180,
      billableWeightKg: 180,
      dimDivisor: 5000,
      quotedAt: '2026-09-17T08:30:00Z',
      expiresAt: '2026-09-21T08:30:00Z'
    },
    payment: {
      amount: 178,
      status: 'paid',
      method: 'Chuyển khoản VietQR',
      transactionId: 'VNPAY-204899',
      paidAt: '2026-09-17T10:00:00Z'
    },
    contractId: 'CTR-2048',
    appointmentDate: '2026-09-20',
    appointmentTime: '11:00 AM',
    generatedAccessPin: '4921#',
    expiresAt: '2026-09-21T18:00:00Z',
    evidence: ['EV-2048-01 · Ảnh hàng hóa lúc khai báo'],
    createdAt: '2026-09-17T08:30:00Z'
  },
  {
    id: 'RSV-2049',
    customerId: 'cust-demo-2',
    customerName: 'Hoang Van Bach',
    customerEmail: 'bach.hoang@gmail.com',
    customerPhone: '091 999 8811',
    identityId: '079198004567',
    facilityId: 'fac-001',
    facilityName: 'Downtown Storage',
    unitId: '',
    unitTypeId: 'small',
    unitTypeName: 'Small Storage',
    assignedUnitId: undefined, // Unassigned - Manager needs to assign!
    rentalMonths: 3,
    startDate: '2026-09-22',
    endDate: '2026-12-22',
    moveInDate: '2026-09-22',
    status: 'DEPOSIT_PAID',
    approvalType: 'AUTO',
    reservationDepositAmount: 36,
    securityDepositAmount: 89,
    remainingAmount: 142,
    firstMonthRent: 89,
    totalInitialAmount: 178,
    paymentExpiresAt: new Date(Date.now() + 11 * 60 * 1000).toISOString(),
    largestItemDimensionsCm: { lengthCm: 60, widthCm: 50, heightCm: 50 },
    goods: {
      category: 'Tài liệu và đồ dùng cá nhân',
      packageCount: 6,
      lengthCm: 60,
      widthCm: 50,
      heightCm: 50,
      weightKg: 90,
      dimWeightKg: 36,
      material: 'Giấy, nhựa',
      condition: '6 kiện niêm phong tốt',
      fragile: false
    },
    quote: {
      quoteId: 'QUO-2049',
      unitId: '',
      facilityId: 'fac-001',
      baseMonthlyPrice: 89,
      depositAmount: 89,
      dimSurcharge: 0,
      totalFirstPayment: 178,
      dimWeightKg: 36,
      actualWeightKg: 90,
      billableWeightKg: 90,
      dimDivisor: 5000,
      quotedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 11 * 60 * 1000).toISOString()
    },
    payment: {
      amount: 36,
      status: 'paid',
      method: 'Cọc giữ chỗ qua VietQR',
      transactionId: 'TX-DEP-2049',
      paidAt: new Date().toISOString()
    },
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    evidence: ['RSV-2049 · Đã cọc giữ chỗ 20%, chờ Facility Manager phân kho'],
    createdAt: new Date().toISOString()
  }
]

export function normalizeCheckin(c: any): CheckInRecord {
  const l = Number(c?.actualMeasurements?.lengthCm) || 0
  const w = Number(c?.actualMeasurements?.widthCm) || 0
  const h = Number(c?.actualMeasurements?.heightCm) || 0
  const computedVol = Math.round(((l * w * h) / 1_000_000) * 1000) / 1000
  const actualVolumeM3 = typeof c?.actualMeasurements?.actualVolumeM3 === 'number'
    ? c.actualMeasurements.actualVolumeM3
    : computedVol

  return {
    id: c?.id || `CHK-${Date.now()}`,
    holdId: c?.holdId || '',
    unitId: c?.unitId || '',
    facilityId: c?.facilityId || 'fac-001',
    customerId: c?.customerId || '',
    customerName: c?.customerName || 'Khách hàng',
    staffId: c?.staffId || 'unassigned',
    staffName: c?.staffName || 'Nhân viên ca trực',
    scheduledDate: c?.scheduledDate || '',
    scheduledTime: c?.scheduledTime || '',
    completedAt: c?.completedAt,
    status: c?.status || 'scheduled',
    checklist: {
      identityVerified: Boolean(c?.checklist?.identityVerified),
      termsAccepted: Boolean(c?.checklist?.termsAccepted),
      paymentConfirmed: Boolean(c?.checklist?.paymentConfirmed),
      unitWalkthrough: Boolean(c?.checklist?.unitWalkthrough),
      accessCodeIssued: Boolean(c?.checklist?.accessCodeIssued),
    },
    actualMeasurements: {
      lengthCm: l,
      widthCm: w,
      heightCm: h,
      weightKg: Number(c?.actualMeasurements?.weightKg) || 0,
      actualVolumeM3,
      dimWeightKg: c?.actualMeasurements?.dimWeightKg,
      varianceAccepted: Boolean(c?.actualMeasurements?.varianceAccepted ?? false),
      varianceNotes: c?.actualMeasurements?.varianceNotes,
    },
    initialCondition: c?.initialCondition || '',
    initialConditionEn: c?.initialConditionEn,
    evidencePhotos: Array.isArray(c?.evidencePhotos) ? c.evidencePhotos : [],
    accessCodeIssued: c?.accessCodeIssued,
    preparedAccessPin: c?.preparedAccessPin,
    accessPreparedAt: c?.accessPreparedAt,
    customerConfirmationTimestamp: c?.customerConfirmationTimestamp,
  }
}

const INITIAL_CHECKINS: CheckInRecord[] = [
  {
    id: 'CHK-301',
    holdId: 'RSV-2048',
    unitId: 'A-104',
    facilityId: 'fac-001',
    customerId: 'cust-demo-1',
    customerName: 'Nguyen Minh Anh',
    staffId: 'demo-staff',
    staffName: 'Demo Staff',
    scheduledDate: '2026-09-20',
    scheduledTime: '11:00 AM',
    status: 'scheduled',
    checklist: {
      identityVerified: true,
      termsAccepted: true,
      paymentConfirmed: true,
      unitWalkthrough: false,
      accessCodeIssued: false
    },
    actualMeasurements: {
      lengthCm: 80,
      widthCm: 60,
      heightCm: 70,
      weightKg: 180,
      actualVolumeM3: 0.336,
      dimWeightKg: 67,
      varianceAccepted: false
    },
    initialCondition: 'Kho sạch, đèn và khóa điện tử hoạt động tốt. 12 kiện hàng dán kín niêm phong.',
    initialConditionEn: 'The unit is clean; lighting and the electronic lock work properly. All 12 packages are sealed.',
    evidencePhotos: ['EV-2048-01 · Ảnh hàng hóa khai báo']
  }
]

const INITIAL_RENTALS: RentalRecord[] = [
  {
    id: 'RNT-INIT-PREV',
    holdId: 'RSV-INIT-PREV',
    unitId: 'C-301',
    facilityId: 'fac-001',
    facilityName: 'Downtown Storage',
    customerId: 'cust-ha-pham',
    customerName: 'Pham Thu Ha',
    customerEmail: 'ha.pham@gmail.com',
    customerPhone: '093 555 0128',
    unitType: 'Large Storage',
    areaM2: 12.0,
    volumeM3: 30.0,
    startDate: 'Mar 18, 2026',
    endDate: 'Sep 18, 2026',
    nextDue: 'Sep 18, 2026',
    monthlyRate: 269,
    deposit: 269,
    securityDeposit: 269,
    status: 'return_requested',
    paymentStatus: 'paid',
    autoRenew: false,
    gateCode: '7318#',
    initialCondition: 'Kho sạch, tường và khóa nguyên vẹn; 6 kiện đồ gia dụng gỗ và vải.',
    evidencePhotos: ['EV-IN-118 · 6 ảnh hiện trạng lúc nhận kho']
  },
  {
    id: 'RNT-2026-001',
    holdId: 'RSV-INIT-001',
    unitId: 'B-208',
    facilityId: 'fac-001',
    facilityName: 'Downtown Storage',
    customerId: 'demo-customer',
    customerName: 'Demo Customer',
    customerEmail: 'customer@storagehub.demo',
    customerPhone: '+84 908 123 456',
    unitType: 'Medium Storage',
    areaM2: 6.0,
    volumeM3: 15.0,
    startDate: 'Jan 12, 2026',
    endDate: 'Jan 12, 2027',
    nextDue: 'Oct 12, 2026',
    monthlyRate: 149,
    deposit: 149,
    securityDeposit: 149,
    status: 'active',
    paymentStatus: 'paid',
    autoRenew: true,
    gateCode: '4921#',
    initialCondition: 'Sàn sạch, ổ khóa thông minh đã test hoạt động, không có vết nứt tường.',
    evidencePhotos: ['EV-INIT-B208-01 · Biên bản bàn giao kho ban đầu']
  },
  {
    id: 'RNT-2026-002',
    holdId: 'RSV-INIT-002',
    unitId: 'D-402',
    facilityId: 'fac-001',
    facilityName: 'Downtown Storage',
    customerId: 'demo-customer-2',
    customerName: 'Saigon Logistics Co.',
    customerEmail: 'contact@sg-logistics.vn',
    customerPhone: '+84 28 3822 9999',
    unitType: 'Extra Large Commercial',
    areaM2: 18.0,
    volumeM3: 45.0,
    startDate: 'May 01, 2026',
    endDate: 'May 01, 2027',
    nextDue: 'Oct 01, 2026',
    monthlyRate: 349,
    deposit: 349,
    securityDeposit: 349,
    status: 'active',
    paymentStatus: 'paid',
    autoRenew: true,
    gateCode: '9004#',
    initialCondition: 'Kho pallet thương mại, cửa cuốn cơ điện hoạt động bình thường.',
    evidencePhotos: ['EV-INIT-D402-01 · Biên bản bàn giao kho pallet']
  }
]

const INITIAL_RETURNS: ReturnCase[] = [
  {
    id: 'RET-118',
    rentalId: 'RNT-INIT-PREV',
    unitId: 'C-301',
    facilityId: 'fac-001',
    facilityName: 'Downtown Storage',
    customerId: 'cust-ha-pham',
    customerName: 'Pham Thu Ha',
    customerEmail: 'ha.pham@gmail.com',
    customerPhone: '093 555 0128',
    requestedAt: '2026-09-15T09:00:00Z',
    scheduledDate: '2026-09-18',
    status: 'scheduled',
    initialConditionSnapshot: 'Kho sạch, tường và khóa nguyên vẹn; 6 kiện đồ gia dụng gỗ và vải.',
    initialConditionSnapshotEn: 'The unit was clean with intact walls and lock; six packages of wooden and fabric household goods.',
    packageCount: 6,
    initialWeightKg: 132,
    damageFee: 0,
    outstandingFee: 0,
    depositAmount: 269, // Security deposit
    netRefundAmount: 269,
    evidence: ['EV-IN-118 · 6 ảnh hiện trạng lúc nhận kho'],
    customerConfirmed: false
  }
]

const INITIAL_CONTRACTS: StorageContract[] = [
  {
    id: 'CTR-2048',
    contractNumber: 'HD-2026-001',
    reservationId: 'RSV-2048',
    customerId: 'cust-demo-1',
    unitId: 'A-104',
    signedAt: '2026-09-17',
    startDate: '2026-09-20',
    endDate: '2027-03-20',
    monthlyRent: 89,
    securityDeposit: 89,
    scannedFileUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr...',
    scannedFileName: 'HopDong_HD-2026-001_signed.pdf',
    uploadedAt: '2026-09-17T09:45:00Z',
    uploadedBy: 'demo-staff',
    status: 'SIGNED'
  }
]

const INITIAL_ACTIVITIES: ActivityRecord[] = [
  {
    id: 'act-101',
    action: 'POLICY_UPDATE',
    actorId: 'demo-admin',
    actorName: 'Demo Administrator',
    actorRole: 'admin',
    facilityId: 'fac-001',
    entityType: 'policy',
    entityId: 'sec-policy-01',
    notes: 'Cập nhật chính sách tỷ lệ đặt cọc 20% và chu kỳ đổi mã PIN an ninh.',
    timestamp: '2026-09-18 11:58:14'
  },
  {
    id: 'act-102',
    action: 'RESERVATION_CREATED',
    actorId: 'cust-demo-1',
    actorName: 'Nguyen Minh Anh',
    actorRole: 'customer',
    facilityId: 'fac-001',
    entityType: 'hold',
    entityId: 'RSV-2048',
    notes: 'Khách hàng đặt cỡ kho Small Storage, cọc giữ chỗ 20% ($36) thành công.',
    timestamp: '2026-09-17 08:30:00'
  },
  {
    id: 'act-103',
    action: 'UNIT_ASSIGNED',
    actorId: 'demo-manager',
    actorName: 'Demo Manager',
    actorRole: 'manager',
    facilityId: 'fac-001',
    entityType: 'unit',
    entityId: 'A-104',
    notes: 'Facility Manager phân kho A-104 cho đơn RSV-2048 (20/09/2026 - 20/03/2027).',
    timestamp: '2026-09-17 09:00:00'
  }
]

interface StorageHubState {
  facilities: Facility[]
  units: StorageUnit[]
  holds: StorageReservation[] // holds is alias for reservations
  contracts: StorageContract[]
  payments: StoragePayment[]
  checkins: CheckInRecord[]
  rentals: RentalRecord[]
  returns: ReturnCase[]
  renewals: RenewalRecord[]
  maintenanceTasks: MaintenanceTask[]
  accessCredentials: AccessCredential[]
  activities: ActivityRecord[]
  tickets: TicketItem[]
  config: BusinessConfig
}

interface StorageHubContextValue extends StorageHubState {
  unitTypes: UnitType[]
  // Pricing & DIM calculation
  calculateDIMAndQuote: (
    unit: StorageUnit,
    goods: {
      lengthCm: number
      widthCm: number
      heightCm: number
      weightKg: number
      packageCount: number
    }
  ) => PricingQuote
  // Customer reservation & hold lifecycle actions
  payStorageHold: (holdId: string, paymentMethod?: string) => void
  verifyHoldEmail: (holdId: string, token: string) => boolean
  resendHoldEmail: (holdId: string) => void
  applyDiscountToReservation: (reservationId: string, discountCode: string) => boolean
  scheduleCheckIn: (holdId: string, appointmentDate: string, appointmentTime: string) => void
  // Actions
  validateAndCreateReservation: (params: {
    customer: User
    unitTypeId: string
    facilityId: string
    goods: GoodsDeclaration
    rentalMonths: number
    moveInDate: string
    identityId: string
    customerPhone: string
    largestItemDimensionsCm?: { lengthCm: number; widthCm: number; heightCm: number }
  }) => ReservationValidationResult
  assignUnitToHold: (reservationId: string, unitId: string, managerUser: User) => void
  cancelReservation: (reservationId: string, user: User, reason?: string) => void
  expireReservation: (reservationId: string, reason?: 'NO_SHOW' | 'PAYMENT_EXPIRED') => void
  signPaperContract: (params: {
    holdId: string
    staffUser: User
    identityVerified: boolean
    contractNumber: string
    signedAt: string
    startDate: string
    endDate: string
    scannedFileUrl: string
    scannedFileName: string
  }) => void
  recordRemainingPayment: (
    reservationId: string,
    staffUser: User,
    paymentDetails: {
      amount: number
      paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'ONLINE_GATEWAY'
      transactionReference: string
      proofImage?: string
    }
  ) => void
  payRemainingBalance: (holdId: string, staffUser: User, paymentMethod: string) => void
  completeCheckIn: (params: {
    holdId: string
    staffUser: User
    checklist: CheckInRecord['checklist']
    actualMeasurements: CheckInRecord['actualMeasurements']
    initialCondition: string
    evidencePhotos: string[]
    customerConfirmed: boolean
    goodsHandover: NonNullable<CheckInRecord['goodsHandover']>
    handedOverItems: string[]
  }) => RentalRecord
  requestRenewal: (rentalId: string, requestedEndDate: string, customer: User) => RenewalRecord
  approveRenewal: (renewalId: string, managerUser: User) => void
  rejectRenewal: (renewalId: string, managerUser: User, reason?: string) => void
  payRenewal: (renewalId: string, paymentMethod: string, transactionId?: string) => void
  requestReturn: (rentalId: string, scheduledDate: string, customer: User, reason?: string) => ReturnCase
  completeReturnInspection: (params: {
    returnId: string
    staffUser: User
    inventoryMatch: 'match' | 'missing' | 'excess'
    damageClassification: DamageClassification
    damageFee: number
    cleaningFee: number
    lostItemFee: number
    overdueFee: number
    outstandingFee: number
    staffNotes: string
    evidencePhotos: string[]
    returnedItems: { key: boolean; card: boolean; lock: boolean }
    customerConfirmed: boolean
  }) => void
  createMaintenanceTask: (unitId: string, reason: string, staffUser?: User) => MaintenanceTask
  completeMaintenanceTask: (taskId: string, managerUser: User) => void
  releaseMaintenanceUnit: (unitId: string, staffUser: User) => void
  updateBusinessConfig: (newConfig: Partial<BusinessConfig>, actor: User) => void
  respondSupportTicket: (ticketId: string, replyText: string, status: TicketItem['status'], staffUser: User) => void
  createSupportTicket: (ticket: Omit<TicketItem, 'id' | 'created' | 'messages'>, initialMessage: string) => void
  resetToDemoData: () => void
}

const StorageHubContext = createContext<StorageHubContextValue | null>(null)

export function StorageHubProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StorageHubState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          ...parsed,
          holds: parsed.holds || INITIAL_RESERVATIONS,
          contracts: parsed.contracts || INITIAL_CONTRACTS,
          payments: parsed.payments || [],
          renewals: parsed.renewals || [],
          maintenanceTasks: parsed.maintenanceTasks || [],
          accessCredentials: parsed.accessCredentials || [],
          checkins: Array.isArray(parsed.checkins) ? parsed.checkins.map(normalizeCheckin) : INITIAL_CHECKINS,
          rentals: parsed.rentals || INITIAL_RENTALS,
          returns: parsed.returns || INITIAL_RETURNS,
          activities: parsed.activities || INITIAL_ACTIVITIES,
          tickets: parsed.tickets || TICKETS,
          config: parsed.config || DEFAULT_BUSINESS_CONFIG
        }
      }
    } catch (e) {
      console.error('Failed to load storageHub state from localStorage', e)
    }
    return {
      facilities: INITIAL_FACILITIES,
      units: INITIAL_UNITS,
      holds: INITIAL_RESERVATIONS,
      contracts: INITIAL_CONTRACTS,
      payments: [],
      checkins: INITIAL_CHECKINS,
      rentals: INITIAL_RENTALS,
      returns: INITIAL_RETURNS,
      renewals: [],
      maintenanceTasks: [],
      accessCredentials: [],
      activities: INITIAL_ACTIVITIES,
      tickets: TICKETS,
      config: DEFAULT_BUSINESS_CONFIG
    }
  })

  // Save to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.error('Failed to persist storageHub state', e)
    }
  }, [state])

  // Sync state across browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          const checkins = Array.isArray(parsed.checkins) ? parsed.checkins.map(normalizeCheckin) : []
          setState({ ...parsed, checkins })
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // 1. Customer: Validate and create reservation with 20% Reservation Deposit
  const validateAndCreateReservation = (params: {
    customer: User
    unitTypeId: string
    facilityId: string
    goods: GoodsDeclaration
    rentalMonths: number
    moveInDate: string
    identityId: string
    customerPhone: string
    largestItemDimensionsCm?: { lengthCm: number; widthCm: number; heightCm: number }
  }): ReservationValidationResult => {
    const unitType = UNIT_TYPES.find(ut => ut.id === params.unitTypeId) || UNIT_TYPES[1]
    const now = new Date()
    const nowTime = now.getTime()

    // Calculate end date based on moveInDate and rentalMonths
    const startDate = params.moveInDate
    const startObj = new Date(startDate)
    const endObj = new Date(startObj)
    endObj.setMonth(endObj.getMonth() + params.rentalMonths)
    const endDate = endObj.toISOString().split('T')[0]

    // Availability check: check units of this type in facility that don't have overlapping reservedPeriods or rentals
    const candidateUnits = state.units.filter(
      u => u.facilityId === params.facilityId && u.type.toLowerCase().includes(unitType.name.split(' ')[0].toLowerCase()) && u.status !== 'maintenance'
    )

    const availableUnit = candidateUnits.find(u => {
      // Check if any reservation or rental overlaps on this unit
      const overlapsReservation = state.holds.some(
        h => h.assignedUnitId === u.id && ['DEPOSIT_PAID', 'UNIT_RESERVED', 'READY_FOR_CHECKIN'].includes(h.status) &&
             checkDateOverlap(startDate, endDate, h.startDate, h.endDate)
      )
      const overlapsRental = state.rentals.some(
        r => r.unitId === u.id && r.status === 'active' &&
             checkDateOverlap(startDate, endDate, r.startDate, r.endDate)
      )
      return !overlapsReservation && !overlapsRental
    })

    if (!availableUnit) {
      return {
        outcome: 'HARD_VIOLATION',
        rejectionReason: 'Cơ sở hiện không còn kho trống cho loại kích thước này trong khoảng thời gian đã chọn.',
        messageVi: 'Rất tiếc, loại gian kho đã chọn tạm thời kín lịch trong khoảng thời gian này tại cơ sở. Vui lòng chọn thời gian khác hoặc cơ sở lân cận.',
        messageEn: 'Unfortunately, this unit type is fully booked for your selected date range at this facility.'
      }
    }

    // Physical & Prohibited items validation
    const prohibitedKeywords = ['xăng', 'dầu', 'cháy', 'nổ', 'vũ khí', 'hóa chất độc', 'động vật', 'chó', 'mèo', 'thịt tươi', 'thực phẩm tươi', 'pháo', 'thuốc nổ']
    const declaredText = `${params.goods.category} ${params.goods.notes || ''} ${params.goods.material}`.toLowerCase()
    const hasProhibited = prohibitedKeywords.some(kw => declaredText.includes(kw))

    if (hasProhibited) {
      return {
        outcome: 'HARD_VIOLATION',
        rejectionReason: 'Hàng hóa chứa vật phẩm cấm hoặc nguy cơ cháy nổ cao theo quy định PCCC.',
        messageVi: 'Từ chối tự động: Hàng hóa vi phạm quy chế an toàn PCCC.',
        messageEn: 'Automatic Rejection: Prohibited hazardous goods or combustible materials.'
      }
    }

    // DIM Volume calculation
    const itemL = params.largestItemDimensionsCm?.lengthCm ?? params.goods.lengthCm
    const itemW = params.largestItemDimensionsCm?.widthCm ?? params.goods.widthCm
    const itemH = params.largestItemDimensionsCm?.heightCm ?? params.goods.heightCm
    const totalGoodsVolM3 = Math.round(((itemL * itemW * itemH * params.goods.packageCount) / 1000000) * 1000) / 1000

    const sortedItem = [itemL / 100, itemW / 100, itemH / 100].sort((a, b) => b - a)
    const sortedUnit = [unitType.lengthM, unitType.widthM, unitType.heightM].sort((a, b) => b - a)

    const boxDoesNotFit = sortedItem[0] > sortedUnit[0] || sortedItem[1] > sortedUnit[1] || sortedItem[2] > sortedUnit[2]
    const weightExceeds = params.goods.weightKg > unitType.maxLoadKg
    const volumeExceeds = totalGoodsVolM3 > unitType.volumeM3

    if (boxDoesNotFit || weightExceeds || volumeExceeds) {
      const suggested = UNIT_TYPES.find(ut => {
        const su = [ut.lengthM, ut.widthM, ut.heightM].sort((a, b) => b - a)
        return (
          ut.volumeM3 >= totalGoodsVolM3 &&
          ut.maxLoadKg >= params.goods.weightKg &&
          sortedItem[0] <= su[0] &&
          sortedItem[1] <= su[1] &&
          sortedItem[2] <= su[2]
        )
      })

      let reason = ''
      if (volumeExceeds) reason = `Tổng thể tích hàng (${totalGoodsVolM3} m³) vượt quá dung tích gian kho (${unitType.volumeM3} m³).`
      else if (boxDoesNotFit) reason = `Kiện hàng lớn nhất (${itemL}×${itemW}×${itemH} cm) vượt quá kích thước kho sau khi xoay các chiều.`
      else if (weightExceeds) reason = `Tổng cân nặng (${params.goods.weightKg} kg) vượt quá tải trọng sàn (${unitType.maxLoadKg} kg).`

      return {
        outcome: 'HARD_VIOLATION',
        rejectionReason: reason,
        suggestedUnitTypeId: suggested?.id,
        suggestedUnitTypeName: suggested?.name,
        suggestedVolumeM3: suggested?.volumeM3,
        messageVi: `Từ chối tự động: ${reason}${suggested ? ` Hệ thống đề xuất nâng cấp lên gian kho ${suggested.name} (${suggested.volumeM3} m³).` : ''}`,
        messageEn: `Automatic Rejection: ${reason}${suggested ? ` Recommended upgrade: ${suggested.name}.` : ''}`
      }
    }

    // Financial formulas:
    // FirstMonthRent = monthlyPrice
    // SecurityDeposit = monthlyPrice (recorded in contract, refundable)
    // TotalInitial = FirstMonthRent + SecurityDeposit
    // ReservationDeposit (20%) = 20% of TotalInitial
    // RemainingBalance = TotalInitial - ReservationDeposit
    const firstMonthRent = unitType.monthlyPrice
    const securityDepositAmount = unitType.monthlyPrice
    const totalInitialAmount = firstMonthRent + securityDepositAmount
    const reservationDepositAmount = Math.round(totalInitialAmount * 0.2)
    const remainingAmount = totalInitialAmount - reservationDepositAmount

    const holdId = `RSV-${Date.now().toString().slice(-4)}`
    const quoteId = `QUO-${Date.now().toString().slice(-4)}`
    const paymentExpiresAt = new Date(nowTime + 24 * 60 * 60 * 1000).toISOString()

    const pricingQuote: PricingQuote = {
      quoteId,
      unitId: '',
      facilityId: params.facilityId,
      baseMonthlyPrice: unitType.monthlyPrice,
      depositAmount: securityDepositAmount,
      dimSurcharge: 0,
      totalFirstPayment: totalInitialAmount,
      dimWeightKg: Math.ceil((itemL * itemW * itemH * params.goods.packageCount) / 5000),
      actualWeightKg: params.goods.weightKg,
      billableWeightKg: params.goods.weightKg,
      dimDivisor: 5000,
      quotedAt: now.toISOString(),
      expiresAt: paymentExpiresAt
    }

    const newReservation: StorageReservation = {
      id: holdId,
      customerId: params.customer.id,
      customerName: params.customer.name,
      customerEmail: params.customer.email,
      customerPhone: params.customerPhone,
      identityId: params.identityId,
      facilityId: params.facilityId,
      facilityName: availableUnit.facilityName,
      unitId: '',
      unitTypeId: unitType.id,
      unitTypeName: unitType.name,
      assignedUnitId: undefined, // Manager will assign!
      rentalMonths: params.rentalMonths,
      startDate,
      endDate,
      moveInDate: params.moveInDate,
      status: 'DEPOSIT_PAID', // Customer pays 20% reservation deposit
      reservationDepositAmount,
      securityDepositAmount,
      remainingAmount,
      firstMonthRent,
      totalInitialAmount,
      approvalType: 'AUTO',
      paymentExpiresAt,
      largestItemDimensionsCm: { lengthCm: itemL, widthCm: itemW, heightCm: itemH },
      goods: params.goods,
      quote: pricingQuote,
      payment: {
        amount: reservationDepositAmount,
        status: 'paid',
        method: 'Thanh toán cọc giữ chỗ 20% (Online)',
        transactionId: `TX-DEP-${Date.now().toString().slice(-6)}`,
        paidAt: now.toISOString()
      },
      appointmentDate: params.moveInDate,
      appointmentTime: '09:00 AM',
      expiresAt: paymentExpiresAt,
      evidence: [`${holdId} · Đã thanh toán cọc giữ chỗ 20% ($${reservationDepositAmount}). Chờ Facility Manager phân kho.`],
      createdAt: now.toISOString()
    }

    setState(prev => ({
      ...prev,
      holds: [newReservation, ...prev.holds],
      activities: [
        {
          id: `act-${Date.now()}`,
          action: 'RESERVATION_CREATED',
          actorId: params.customer.id,
          actorName: params.customer.name,
          actorRole: params.customer.role,
          facilityId: params.facilityId,
          entityType: 'hold',
          entityId: holdId,
          notes: `Khách hàng đặt cỡ kho ${unitType.name}, cọc giữ chỗ 20% ($${reservationDepositAmount}). Chưa gán mã kho cụ thể.`,
          timestamp: now.toLocaleString('vi-VN')
        },
        ...prev.activities
      ]
    }))

    return {
      outcome: 'PASS',
      hold: newReservation,
      messageVi: `Đặt chỗ thành công! Đã ghi nhận cọc giữ chỗ 20% ($${reservationDepositAmount}). Facility Manager sẽ phân kho trước ngày hẹn.`,
      messageEn: `Reservation confirmed! 20% deposit ($${reservationDepositAmount}) received. Facility Manager will assign a unit.`
    }
  }

  // 2. Facility Manager: Assign specific Unit for date range
  const assignUnitToHold = (reservationId: string, unitId: string, managerUser: User) => {
    if (managerUser.role !== 'manager' && managerUser.role !== 'admin') {
      throw new Error('Chỉ Facility Manager được phân kho.')
    }
    const reservation = state.holds.find(h => h.id === reservationId)
    const unit = state.units.find(u => u.id === unitId)
    if (!reservation || !unit) throw new Error('Không tìm thấy thông tin đơn đặt hoặc gian kho.')
    if (unit.facilityId !== reservation.facilityId) throw new Error('Gian kho không thuộc cơ sở của đơn đặt.')
    if (unit.status === 'maintenance') throw new Error('Gian kho đang trong diện bảo trì, không thể phân bổ.')

    // Date-range overlap conflict check
    const isConflicted = state.holds.some(
      h => h.id !== reservationId && h.assignedUnitId === unitId &&
           ['DEPOSIT_PAID', 'UNIT_RESERVED', 'READY_FOR_CHECKIN'].includes(h.status) &&
           checkDateOverlap(reservation.startDate, reservation.endDate, h.startDate, h.endDate)
    ) || state.rentals.some(
      r => r.unitId === unitId && r.status === 'active' &&
           checkDateOverlap(reservation.startDate, reservation.endDate, r.startDate, r.endDate)
    )

    if (isConflicted) {
      throw new Error(`Gian kho ${unit.code} đã có booking/hợp đồng khác trùng khoảng thời gian ${reservation.startDate} đến ${reservation.endDate}.`)
    }

    const now = new Date()
    const newPeriod: ReservedPeriod = {
      reservationId: reservation.id,
      customerName: reservation.customerName,
      startDate: reservation.startDate,
      endDate: reservation.endDate
    }

    setState(prev => {
      // Check if all 4 conditions are met for READY_FOR_CHECKIN
      const hasContract = prev.contracts.some(c => c.reservationId === reservation.id && c.status === 'SIGNED')
      const isBalancePaid = reservation.remainingAmount <= 0
      const nextStatus: ReservationStatus = (hasContract && isBalancePaid) ? 'READY_FOR_CHECKIN' : 'UNIT_RESERVED'

      // System generates PIN if ready for checkin
      let generatedPin = reservation.generatedAccessPin
      let newCred: AccessCredential | undefined
      if (nextStatus === 'READY_FOR_CHECKIN' && !generatedPin) {
        const digits = new Uint32Array(1)
        crypto.getRandomValues(digits)
        generatedPin = `${1000 + (digits[0] % 9000)}#`
        newCred = {
          id: `AC-${Date.now()}`,
          reservationId: reservation.id,
          unitId,
          type: 'PIN',
          pinCode: generatedPin,
          status: 'PENDING',
          generatedAt: now.toISOString()
        }
      }

      return {
        ...prev,
        units: prev.units.map(u => {
          if (u.id === unitId) {
            return {
              ...u,
              status: 'reserved',
              reservedPeriods: [...(u.reservedPeriods || []).filter(p => p.reservationId !== reservation.id), newPeriod],
              nextAvailableDate: reservation.endDate
            }
          }
          return u
        }),
        holds: prev.holds.map(h => {
          if (h.id === reservationId) {
            return {
              ...h,
              assignedUnitId: unitId,
              unitId,
              status: nextStatus,
              generatedAccessPin: generatedPin,
              evidence: [...h.evidence, `UNIT_RESERVED · Manager ${managerUser.name} đã phân kho ${unit.code} (${reservation.startDate} → ${reservation.endDate})`]
            }
          }
          return h
        }),
        accessCredentials: newCred ? [...prev.accessCredentials, newCred] : prev.accessCredentials,
        activities: [
          {
            id: `act-${Date.now()}`,
            action: 'UNIT_ASSIGNED',
            actorId: managerUser.id,
            actorName: managerUser.name,
            actorRole: managerUser.role,
            facilityId: unit.facilityId,
            entityType: 'unit',
            entityId: unit.id,
            notes: `Manager phân kho ${unit.code} cho khách ${reservation.customerName} từ ${reservation.startDate} đến ${reservation.endDate}.`,
            timestamp: now.toLocaleString('vi-VN')
          },
          ...prev.activities
        ]
      }
    })
  }

  // 3. Cancel / Expired / No-show: Release Unit allocation
  const cancelReservation = (reservationId: string, user: User, reason?: string) => {
    const reservation = state.holds.find(h => h.id === reservationId)
    if (!reservation) return
    const now = new Date()

    setState(prev => {
      const assignedUnit = prev.units.find(u => u.id === reservation.assignedUnitId)
      const updatedPeriods = (assignedUnit?.reservedPeriods || []).filter(p => p.reservationId !== reservation.id)
      const unitHasOtherCurrentReservations = updatedPeriods.some(p => checkDateOverlap(now.toISOString().split('T')[0], now.toISOString().split('T')[0], p.startDate, p.endDate))

      return {
        ...prev,
        units: prev.units.map(u => {
          if (u.id === reservation.assignedUnitId) {
            return {
              ...u,
              status: unitHasOtherCurrentReservations ? 'reserved' : 'available',
              reservedPeriods: updatedPeriods
            }
          }
          return u
        }),
        holds: prev.holds.map(h => {
          if (h.id === reservationId) {
            return {
              ...h,
              status: 'CANCELLED',
              expireReason: 'CUSTOMER_CANCELLED',
              evidence: [...h.evidence, `CANCELLED · Hủy bởi ${user.name}. Lý do: ${reason || 'Khách hủy đơn'}`]
            }
          }
          return h
        }),
        activities: [
          {
            id: `act-${Date.now()}`,
            action: 'RESERVATION_CANCELLED',
            actorId: user.id,
            actorName: user.name,
            actorRole: user.role,
            facilityId: reservation.facilityId,
            entityType: 'hold',
            entityId: reservation.id,
            notes: `Hủy đơn ${reservation.id}. Kho ${reservation.assignedUnitId || 'N/A'} đã được giải phóng.`,
            timestamp: now.toLocaleString('vi-VN')
          },
          ...prev.activities
        ]
      }
    })
  }

  const expireReservation = (reservationId: string, reason: 'NO_SHOW' | 'PAYMENT_EXPIRED' = 'NO_SHOW') => {
    const reservation = state.holds.find(h => h.id === reservationId)
    if (!reservation) return
    const now = new Date()

    setState(prev => {
      const assignedUnit = prev.units.find(u => u.id === reservation.assignedUnitId)
      const updatedPeriods = (assignedUnit?.reservedPeriods || []).filter(p => p.reservationId !== reservation.id)

      return {
        ...prev,
        units: prev.units.map(u => {
          if (u.id === reservation.assignedUnitId) {
            return {
              ...u,
              status: 'available',
              reservedPeriods: updatedPeriods
            }
          }
          return u
        }),
        holds: prev.holds.map(h => {
          if (h.id === reservationId) {
            return {
              ...h,
              status: 'EXPIRED',
              expireReason: reason,
              evidence: [...h.evidence, `EXPIRED · Quá hạn (${reason}). Giải phóng kho.`]
            }
          }
          return h
        })
      }
    })
  }

  // 4. Facility Staff: Sign paper contract and upload scan
  const signPaperContract = (params: {
    holdId: string
    staffUser: User
    identityVerified: boolean
    contractNumber: string
    signedAt: string
    startDate: string
    endDate: string
    scannedFileUrl: string
    scannedFileName: string
  }) => {
    const reservation = state.holds.find(h => h.id === params.holdId)
    if (params.staffUser.role !== 'staff' && params.staffUser.role !== 'manager') {
      throw new Error('Chỉ nhân viên cơ sở được ghi nhận hợp đồng giấy.')
    }
    if (!params.identityVerified) throw new Error('Cần đối chiếu bản gốc CCCD/Hộ chiếu trước khi ký hợp đồng.')
    if (!reservation) throw new Error('Không tìm thấy đơn đặt giữ kho.')
    if (!params.contractNumber.trim()) throw new Error('Vui lòng nhập số hợp đồng.')
    if (!params.scannedFileUrl) throw new Error('Vui lòng tải lên bản scan hợp đồng giấy đã ký.')

    const now = new Date()
    const contract: StorageContract = {
      id: `CTR-${Date.now()}`,
      contractNumber: params.contractNumber.trim(),
      reservationId: reservation.id,
      customerId: reservation.customerId,
      unitId: reservation.assignedUnitId,
      signedAt: params.signedAt,
      startDate: params.startDate,
      endDate: params.endDate,
      monthlyRent: reservation.firstMonthRent || reservation.quote.baseMonthlyPrice,
      securityDeposit: reservation.securityDepositAmount,
      scannedFileUrl: params.scannedFileUrl,
      scannedFileName: params.scannedFileName,
      uploadedAt: now.toISOString(),
      uploadedBy: params.staffUser.id,
      status: 'SIGNED'
    }

    setState(prev => {
      const isBalancePaid = reservation.remainingAmount <= 0
      const hasUnit = Boolean(reservation.assignedUnitId)
      const nextStatus: ReservationStatus = (isBalancePaid && hasUnit) ? 'READY_FOR_CHECKIN' : 'UNIT_RESERVED'

      // System generates PIN if ready for check-in
      let generatedPin = reservation.generatedAccessPin
      let newCred: AccessCredential | undefined
      if (nextStatus === 'READY_FOR_CHECKIN' && !generatedPin) {
        const digits = new Uint32Array(1)
        crypto.getRandomValues(digits)
        generatedPin = `${1000 + (digits[0] % 9000)}#`
        newCred = {
          id: `AC-${Date.now()}`,
          reservationId: reservation.id,
          unitId: reservation.assignedUnitId || '',
          type: 'PIN',
          pinCode: generatedPin,
          status: 'PENDING',
          generatedAt: now.toISOString()
        }
      }

      return {
        ...prev,
        contracts: [contract, ...prev.contracts],
        holds: prev.holds.map(h => {
          if (h.id === reservation.id) {
            return {
              ...h,
              contractId: contract.id,
              status: nextStatus,
              generatedAccessPin: generatedPin,
              evidence: [...h.evidence, `CONTRACT_SIGNED · Số HĐ: ${contract.contractNumber} bởi ${params.staffUser.name}`]
            }
          }
          return h
        }),
        accessCredentials: newCred ? [...prev.accessCredentials, newCred] : prev.accessCredentials,
        activities: [
          {
            id: `act-${Date.now()}`,
            action: 'PAPER_CONTRACT_SIGNED',
            actorId: params.staffUser.id,
            actorName: params.staffUser.name,
            actorRole: params.staffUser.role,
            facilityId: reservation.facilityId,
            entityType: 'hold',
            entityId: reservation.id,
            notes: `Nhân viên lưu bản scan hợp đồng ${contract.contractNumber}. Cọc bảo đảm: $${contract.securityDeposit}.`,
            timestamp: now.toLocaleString('vi-VN')
          },
          ...prev.activities
        ]
      }
    })
  }

  // 5. Facility Staff: Record remaining payment (CASH / BANK_TRANSFER) with formal Payment Record
  const recordRemainingPayment = (
    reservationId: string,
    staffUser: User,
    paymentDetails: {
      amount: number
      paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'ONLINE_GATEWAY'
      transactionReference: string
      proofImage?: string
    }
  ) => {
    const reservation = state.holds.find(h => h.id === reservationId)
    if (staffUser.role !== 'staff' && staffUser.role !== 'manager') {
      throw new Error('Chỉ nhân viên cơ sở được ghi nhận thanh toán tại quầy.')
    }
    if (!reservation) throw new Error('Không tìm thấy đơn đặt chỗ.')
    if (paymentDetails.amount <= 0) throw new Error('Số tiền thanh toán phải lớn hơn 0.')
    if (!paymentDetails.transactionReference.trim()) throw new Error('Cần nhập mã giao dịch hoặc số phiếu thu.')

    const now = new Date()
    const txId = `TX-BAL-${Date.now()}`

    const newPayment: StoragePayment = {
      id: txId,
      reservationId,
      type: 'INITIAL_RENT',
      amount: paymentDetails.amount,
      paymentMethod: paymentDetails.paymentMethod,
      transactionReference: paymentDetails.transactionReference.trim(),
      proofImage: paymentDetails.proofImage,
      receivedAt: now.toISOString(),
      receivedBy: staffUser.id,
      status: 'PAID',
      paidAt: now.toISOString(),
      recordedBy: staffUser.id
    }

    setState(prev => {
      const hasContract = prev.contracts.some(c => c.reservationId === reservation.id && c.status === 'SIGNED')
      const hasUnit = Boolean(reservation.assignedUnitId)
      const nextStatus: ReservationStatus = (hasContract && hasUnit) ? 'READY_FOR_CHECKIN' : 'UNIT_RESERVED'

      let generatedPin = reservation.generatedAccessPin
      let newCred: AccessCredential | undefined
      if (nextStatus === 'READY_FOR_CHECKIN' && !generatedPin) {
        const digits = new Uint32Array(1)
        crypto.getRandomValues(digits)
        generatedPin = `${1000 + (digits[0] % 9000)}#`
        newCred = {
          id: `AC-${Date.now()}`,
          reservationId: reservation.id,
          unitId: reservation.assignedUnitId || '',
          type: 'PIN',
          pinCode: generatedPin,
          status: 'PENDING',
          generatedAt: now.toISOString()
        }
      }

      return {
        ...prev,
        payments: [newPayment, ...prev.payments],
        holds: prev.holds.map(h => {
          if (h.id === reservationId) {
            return {
              ...h,
              remainingAmount: 0,
              depositConvertedAt: now.toISOString(), // Reservation deposit officially converted to security deposit credit
              status: nextStatus,
              generatedAccessPin: generatedPin,
              evidence: [...h.evidence, `PAYMENT_PAID · Thu $${paymentDetails.amount} qua ${paymentDetails.paymentMethod} (Mã: ${paymentDetails.transactionReference})`]
            }
          }
          return h
        }),
        accessCredentials: newCred ? [...prev.accessCredentials, newCred] : prev.accessCredentials,
        activities: [
          {
            id: `act-${Date.now()}`,
            action: 'INITIAL_BALANCE_PAID',
            actorId: staffUser.id,
            actorName: staffUser.name,
            actorRole: staffUser.role,
            facilityId: reservation.facilityId,
            entityType: 'payment',
            entityId: txId,
            notes: `Nhân viên ${staffUser.name} lập phiếu thu $${paymentDetails.amount} (${paymentDetails.paymentMethod} - ${paymentDetails.transactionReference}). Cọc giữ chỗ chuyển thành cọc bảo đảm.`,
            timestamp: now.toLocaleString('vi-VN')
          },
          ...prev.activities
        ]
      }
    })
  }

  // Alias for backward-compat
  const payRemainingBalance = (holdId: string, staffUser: User, paymentMethod: string) => {
    const reservation = state.holds.find(h => h.id === holdId)
    const amount = reservation?.remainingAmount || 0
    recordRemainingPayment(holdId, staffUser, {
      amount,
      paymentMethod: paymentMethod.includes('Chuyển khoản') ? 'BANK_TRANSFER' : 'CASH',
      transactionReference: `REF-${Date.now().toString().slice(-6)}`
    })
  }

  // 6. Facility Staff: Perform Check-in & Handover (Activating Rental & Access)
  const completeCheckIn = (params: {
    holdId: string
    staffUser: User
    checklist: CheckInRecord['checklist']
    actualMeasurements: CheckInRecord['actualMeasurements']
    initialCondition: string
    evidencePhotos: string[]
    customerConfirmed: boolean
    goodsHandover: NonNullable<CheckInRecord['goodsHandover']>
    handedOverItems: string[]
  }): RentalRecord => {
    if (params.staffUser.role !== 'staff') throw new Error('Chỉ nhân viên ca trực được hoàn tất check-in.')
    const reservation = state.holds.find(h => h.id === params.holdId)
    if (!reservation) throw new Error('Không tìm thấy đơn đặt kho.')
    if (reservation.status !== 'READY_FOR_CHECKIN') {
      throw new Error('Đơn chưa đạt trạng thái READY_FOR_CHECKIN (Cần: Cọc PAID, Hợp đồng SIGNED, Tiền còn lại PAID, Unit RESERVED).')
    }
    const unit = state.units.find(u => u.id === reservation.assignedUnitId)
    if (!unit) throw new Error('Không tìm thấy gian kho được phân.')

    const { identityVerified, unitWalkthrough, accessCodeIssued } = params.checklist
    if (!identityVerified || !unitWalkthrough || !accessCodeIssued) {
      throw new Error('Cần xác minh CCCD, kiểm tra kho thực tế và xác nhận bàn giao mã PIN.')
    }
    if (!params.customerConfirmed || !params.initialCondition.trim()) {
      throw new Error('Cần ghi nhận hiện trạng và có xác nhận của khách hàng.')
    }

    const now = new Date()
    const rentalId = `RNT-${Date.now().toString().slice(-6)}`
    const gatePin = reservation.generatedAccessPin || '4921#'

    const newRental: RentalRecord = {
      id: rentalId,
      holdId: reservation.id,
      contractId: reservation.contractId,
      unitId: unit.id,
      facilityId: unit.facilityId,
      facilityName: unit.facilityName,
      customerId: reservation.customerId,
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      customerPhone: reservation.customerPhone,
      unitType: unit.type,
      areaM2: unit.areaM2,
      volumeM3: unit.volumeM3,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      nextDue: reservation.startDate,
      monthlyRate: reservation.firstMonthRent || unit.price,
      deposit: reservation.securityDepositAmount,
      securityDeposit: reservation.securityDepositAmount, // Refundable security deposit
      status: 'active',
      paymentStatus: 'paid',
      autoRenew: true,
      gateCode: gatePin,
      initialCondition: params.initialCondition,
      evidencePhotos: params.evidencePhotos
    }

    setState(prev => ({
      ...prev,
      units: prev.units.map(u => (u.id === unit.id ? { ...u, status: 'occupied', currentRentalId: rentalId } : u)),
      holds: prev.holds.map(h => (h.id === reservation.id ? { ...h, status: 'COMPLETED', checkedInAt: now.toISOString(), checkedInBy: params.staffUser.id } : h)),
      rentals: [newRental, ...prev.rentals],
      accessCredentials: prev.accessCredentials.map(ac => {
        if (ac.reservationId === reservation.id) {
          return { ...ac, rentalId, status: 'ACTIVE', activatedAt: now.toISOString() }
        }
        return ac
      }),
      activities: [
        {
          id: `act-${Date.now()}`,
          action: 'CHECKIN_COMPLETED',
          actorId: params.staffUser.id,
          actorName: params.staffUser.name,
          actorRole: params.staffUser.role,
          facilityId: unit.facilityId,
          entityType: 'rental',
          entityId: rentalId,
          notes: `Check-in hoàn tất kho ${unit.code}. Kích hoạt hợp đồng thuê và mã PIN ${gatePin}.`,
          timestamp: now.toLocaleString('vi-VN')
        },
        ...prev.activities
      ]
    }))

    return newRental
  }

  // 7. Renewals: Customer requests, Manager approves, Customer pays
  const requestRenewal = (rentalId: string, requestedEndDate: string, customer: User): RenewalRecord => {
    const rental = state.rentals.find(r => r.id === rentalId)
    if (!rental || rental.status !== 'active') throw new Error('Chỉ hợp đồng đang hoạt động mới được yêu cầu gia hạn.')

    const renewalRecord: RenewalRecord = {
      id: `RNW-${Date.now().toString().slice(-6)}`,
      rentalId: rental.id,
      unitId: rental.unitId,
      facilityId: rental.facilityId,
      customerId: customer.id,
      customerName: customer.name,
      oldEndDate: rental.endDate,
      newEndDate: requestedEndDate,
      renewalFee: rental.monthlyRate,
      status: 'pending',
      requestedAt: new Date().toISOString()
    }

    setState(prev => ({
      ...prev,
      renewals: [renewalRecord, ...prev.renewals],
      activities: [
        {
          id: `act-${Date.now()}`,
          action: 'RENEWAL_REQUESTED',
          actorId: customer.id,
          actorName: customer.name,
          actorRole: customer.role,
          facilityId: rental.facilityId,
          entityType: 'rental',
          entityId: rental.id,
          notes: `Khách gửi yêu cầu gia hạn kho ${rental.unitId} đến ngày ${requestedEndDate}.`,
          timestamp: new Date().toLocaleString('vi-VN')
        },
        ...prev.activities
      ]
    }))

    return renewalRecord
  }

  const approveRenewal = (renewalId: string, managerUser: User) => {
    const renewal = state.renewals.find(r => r.id === renewalId)
    if (!renewal || renewal.status !== 'pending') return

    // Conflict check on date range
    const isConflicted = state.holds.some(
      h => h.assignedUnitId === renewal.unitId && ['DEPOSIT_PAID', 'UNIT_RESERVED', 'READY_FOR_CHECKIN'].includes(h.status) &&
           checkDateOverlap(renewal.oldEndDate, renewal.newEndDate, h.startDate, h.endDate)
    )

    if (isConflicted) {
      throw new Error('Kho đã có booking khác trong khoảng thời gian gia hạn yêu cầu.')
    }

    const now = new Date()
    setState(prev => ({
      ...prev,
      renewals: prev.renewals.map(r => r.id === renewalId ? { ...r, status: 'approved', approvedBy: managerUser.name, approvedAt: now.toISOString() } : r),
      activities: [
        {
          id: `act-${Date.now()}`,
          action: 'RENEWAL_APPROVED',
          actorId: managerUser.id,
          actorName: managerUser.name,
          actorRole: managerUser.role,
          facilityId: renewal.facilityId,
          entityType: 'rental',
          entityId: renewal.rentalId,
          notes: `Manager duyệt gia hạn kho ${renewal.unitId} đến ${renewal.newEndDate}. Chờ khách thanh toán.`,
          timestamp: now.toLocaleString('vi-VN')
        },
        ...prev.activities
      ]
    }))
  }

  const rejectRenewal = (renewalId: string, managerUser: User, reason?: string) => {
    const renewal = state.renewals.find(r => r.id === renewalId)
    if (!renewal || renewal.status !== 'pending') return
    const now = new Date()

    setState(prev => ({
      ...prev,
      renewals: prev.renewals.map(r => r.id === renewalId ? { ...r, status: 'rejected', approvedBy: managerUser.name, approvedAt: now.toISOString(), notes: reason || 'Trùng lịch đặt tiếp theo' } : r)
    }))
  }

  const payRenewal = (renewalId: string, paymentMethod: string, transactionId?: string) => {
    const renewal = state.renewals.find(r => r.id === renewalId)
    if (!renewal || renewal.status !== 'approved') throw new Error('Đơn gia hạn chưa được Manager duyệt.')

    const now = new Date()
    const txId = transactionId || `TX-RNW-${Date.now().toString().slice(-6)}`

    setState(prev => ({
      ...prev,
      renewals: prev.renewals.map(r => r.id === renewalId ? {
        ...r,
        status: 'completed',
        paidAt: now.toISOString(),
        paymentMethod,
        transactionReference: txId
      } : r),
      rentals: prev.rentals.map(rt => rt.id === renewal.rentalId ? {
        ...rt,
        endDate: renewal.newEndDate
      } : rt),
      units: prev.units.map(u => {
        if (u.id === renewal.unitId) {
          return { ...u, nextAvailableDate: renewal.newEndDate }
        }
        return u
      }),
      payments: [
        {
          id: txId,
          reservationId: renewal.rentalId,
          rentalId: renewal.rentalId,
          type: 'RENEWAL',
          amount: renewal.renewalFee,
          paymentMethod: 'ONLINE_GATEWAY',
          transactionReference: txId,
          status: 'PAID',
          paidAt: now.toISOString(),
          recordedBy: renewal.customerId
        },
        ...prev.payments
      ]
    }))
  }

  // 8. Return & Checkout: Separate Refund Calculation vs Unit Condition
  const requestReturn = (rentalId: string, scheduledDate: string, customer: User, reason?: string): ReturnCase => {
    const rental = state.rentals.find(r => r.id === rentalId)
    if (!rental || rental.status !== 'active') throw new Error('Chỉ hợp đồng đang hoạt động mới được gửi yêu cầu trả kho.')

    const returnId = `RET-${Date.now().toString().slice(-6)}`
    const now = new Date()

    const newReturn: ReturnCase = {
      id: returnId,
      rentalId: rental.id,
      unitId: rental.unitId,
      facilityId: rental.facilityId,
      facilityName: rental.facilityName,
      customerId: rental.customerId,
      customerName: rental.customerName,
      customerEmail: rental.customerEmail,
      customerPhone: rental.customerPhone,
      requestedAt: now.toISOString(),
      scheduledDate,
      status: 'requested',
      initialConditionSnapshot: rental.initialCondition || 'Kho sạch sẽ lúc bàn giao',
      packageCount: 0,
      initialWeightKg: 0,
      damageFee: 0,
      outstandingFee: 0,
      depositAmount: rental.securityDeposit, // Refund is calculated from Security Deposit!
      netRefundAmount: rental.securityDeposit,
      evidence: rental.evidencePhotos || [],
      customerConfirmed: false
    }

    setState(prev => ({
      ...prev,
      rentals: prev.rentals.map(r => (r.id === rentalId ? { ...r, status: 'return_requested' } : r)),
      returns: [newReturn, ...prev.returns]
    }))

    return newReturn
  }

  const completeReturnInspection = (params: {
    returnId: string
    staffUser: User
    inventoryMatch: 'match' | 'missing' | 'excess'
    damageClassification: DamageClassification
    damageFee: number
    cleaningFee: number
    lostItemFee: number
    overdueFee: number
    outstandingFee: number
    staffNotes: string
    evidencePhotos: string[]
    returnedItems: { key: boolean; card: boolean; lock: boolean }
    customerConfirmed: boolean
  }) => {
    const returnCase = state.returns.find(r => r.id === params.returnId)
    if (!returnCase) throw new Error('Không tìm thấy hồ sơ trả kho.')
    const rental = state.rentals.find(r => r.id === returnCase.rentalId)
    const unit = state.units.find(u => u.id === returnCase.unitId)
    if (!rental || !unit) throw new Error('Không tìm thấy hợp đồng hoặc gian kho.')

    const now = new Date()
    const totalFees = params.damageFee + params.cleaningFee + params.lostItemFee + params.overdueFee + params.outstandingFee
    // REFUND CALCULATION: Security Deposit - Fees = Refund
    const netRefund = Math.max(0, returnCase.depositAmount - totalFees)

    // UNIT CONDITION: Separate from fees! Only physical repair/cleaning needs MAINTENANCE
    const needsPhysicalRepair = params.damageClassification !== 'no_damage' || params.cleaningFee > 0 || params.inventoryMatch === 'excess'
    const nextUnitStatus: 'available' | 'maintenance' = needsPhysicalRepair ? 'maintenance' : 'available'

    let newMaintTask: MaintenanceTask | undefined
    if (needsPhysicalRepair) {
      newMaintTask = {
        id: `MNT-${Date.now().toString().slice(-6)}`,
        unitId: unit.id,
        facilityId: unit.facilityId,
        reason: `${params.damageClassification !== 'no_damage' ? `Hư hại (${params.damageClassification}). ` : ''}${params.cleaningFee > 0 ? 'Cần dọn vệ sinh. ' : ''}${params.staffNotes}`,
        damageClassification: params.damageClassification,
        status: 'pending',
        createdAt: now.toISOString()
      }
    }

    setState(prev => ({
      ...prev,
      units: prev.units.map(u => (u.id === unit.id ? { ...u, status: nextUnitStatus, currentRentalId: undefined } : u)),
      rentals: prev.rentals.map(r => (r.id === rental.id ? { ...r, status: 'completed', gateCode: '', checkedOutAt: now.toISOString() } : r)),
      returns: prev.returns.map(r => r.id === returnCase.id ? {
        ...r,
        status: 'completed',
        completedAt: now.toISOString(),
        damageClassification: params.damageClassification,
        damageFee: params.damageFee,
        cleaningFee: params.cleaningFee,
        lostItemFee: params.lostItemFee,
        overdueFee: params.overdueFee,
        outstandingFee: params.outstandingFee,
        netRefundAmount: netRefund,
        staffNotes: params.staffNotes,
        customerConfirmed: params.customerConfirmed,
        returnedItems: params.returnedItems,
        staffId: params.staffUser.id
      } : r),
      accessCredentials: prev.accessCredentials.map(ac => ac.rentalId === rental.id ? { ...ac, status: 'REVOKED', revokedAt: now.toISOString() } : ac),
      maintenanceTasks: newMaintTask ? [newMaintTask, ...prev.maintenanceTasks] : prev.maintenanceTasks,
      activities: [
        {
          id: `act-${Date.now()}`,
          action: 'CHECKOUT_COMPLETED',
          actorId: params.staffUser.id,
          actorName: params.staffUser.name,
          actorRole: params.staffUser.role,
          facilityId: unit.facilityId,
          entityType: 'return',
          entityId: returnCase.id,
          notes: `Checkout kho ${unit.code}. Quyết toán cọc: Hoàn lại $${netRefund}. Tình trạng kho: ${nextUnitStatus.toUpperCase()}.`,
          timestamp: now.toLocaleString('vi-VN')
        },
        ...prev.activities
      ]
    }))
  }

  // 9. Facility Manager: Maintenance Task Handling
  const createMaintenanceTask = (unitId: string, reason: string, staffUser?: User): MaintenanceTask => {
    const task: MaintenanceTask = {
      id: `MNT-${Date.now().toString().slice(-6)}`,
      unitId,
      facilityId: state.units.find(u => u.id === unitId)?.facilityId || 'fac-001',
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    setState(prev => ({
      ...prev,
      units: prev.units.map(u => u.id === unitId ? { ...u, status: 'maintenance' } : u),
      maintenanceTasks: [task, ...prev.maintenanceTasks]
    }))
    return task
  }

  const completeMaintenanceTask = (taskId: string, managerUser: User) => {
    const task = state.maintenanceTasks.find(t => t.id === taskId)
    if (!task) return
    const now = new Date()

    setState(prev => ({
      ...prev,
      maintenanceTasks: prev.maintenanceTasks.map(t => t.id === taskId ? { ...t, status: 'completed', completedAt: now.toISOString() } : t),
      units: prev.units.map(u => u.id === task.unitId ? { ...u, status: 'available' } : u),
      activities: [
        {
          id: `act-${Date.now()}`,
          action: 'MAINTENANCE_COMPLETED',
          actorId: managerUser.id,
          actorName: managerUser.name,
          actorRole: managerUser.role,
          facilityId: task.facilityId,
          entityType: 'unit',
          entityId: task.unitId,
          notes: `Manager ${managerUser.name} nghiệm thu bảo trì xong kho ${task.unitId}. Trạng thái kho chuyển sang AVAILABLE.`,
          timestamp: now.toLocaleString('vi-VN')
        },
        ...prev.activities
      ]
    }))
  }

  const releaseMaintenanceUnit = (unitId: string, staffUser: User) => {
    const task = state.maintenanceTasks.find(t => t.unitId === unitId && t.status !== 'completed')
    if (task) {
      completeMaintenanceTask(task.id, staffUser)
    } else {
      setState(prev => ({
        ...prev,
        units: prev.units.map(u => u.id === unitId ? { ...u, status: 'available' } : u)
      }))
    }
  }

  // 10. Operations Config & Support Tickets
  const updateBusinessConfig = (newConfig: Partial<BusinessConfig>, actor: User) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...newConfig }
    }))
  }

  const respondSupportTicket = (ticketId: string, replyText: string, status: TicketItem['status'], staffUser: User) => {
    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    setState(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => {
        if (t.id !== ticketId) return t
        const newMsg = replyText.trim()
          ? {
              id: `msg-${Date.now()}`,
              sender: staffUser.name,
              role: 'staff' as const,
              time: `Hôm nay · ${now}`,
              text: replyText.trim()
            }
          : null
        return {
          ...t,
          status,
          messages: newMsg ? [...t.messages, newMsg] : t.messages
        }
      })
    }))
  }

  const createSupportTicket = (ticket: Omit<TicketItem, 'id' | 'created' | 'messages'>, initialMessage: string) => {
    const id = `TKT-${Date.now().toString().slice(-4)}`
    const now = new Date().toLocaleString('vi-VN')
    const newTicket: TicketItem = {
      ...ticket,
      id,
      created: now,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: ticket.customer,
          role: 'customer',
          time: now,
          text: initialMessage
        }
      ]
    }
    setState(prev => ({
      ...prev,
      tickets: [newTicket, ...prev.tickets]
    }))
  }

  const resetToDemoData = () => {
    localStorage.removeItem(STORAGE_KEY)
    setState({
      facilities: INITIAL_FACILITIES,
      units: INITIAL_UNITS,
      holds: INITIAL_RESERVATIONS,
      contracts: INITIAL_CONTRACTS,
      payments: [],
      checkins: INITIAL_CHECKINS,
      rentals: INITIAL_RENTALS,
      returns: INITIAL_RETURNS,
      renewals: [],
      maintenanceTasks: [],
      accessCredentials: [],
      activities: INITIAL_ACTIVITIES,
      tickets: TICKETS,
      config: DEFAULT_BUSINESS_CONFIG
    })
  }

  const calculateDIMAndQuote = (
    unit: StorageUnit,
    goods: {
      lengthCm: number
      widthCm: number
      heightCm: number
      weightKg: number
      packageCount: number
    }
  ): PricingQuote => {
    const dimDivisor = state.config.dimDivisor || 5000
    const dimWeightKg = Math.ceil((goods.lengthCm * goods.widthCm * goods.heightCm * goods.packageCount) / dimDivisor)
    const actualWeightKg = goods.weightKg
    const billableWeightKg = Math.max(actualWeightKg, dimWeightKg)
    const baseMonthlyPrice = unit.price
    const depositAmount = unit.deposit || unit.price
    const dimSurcharge = 0
    const totalFirstPayment = baseMonthlyPrice + depositAmount + dimSurcharge

    return {
      quoteId: `QUO-${Date.now().toString().slice(-4)}`,
      unitId: unit.id,
      facilityId: unit.facilityId,
      baseMonthlyPrice,
      depositAmount,
      dimSurcharge,
      totalFirstPayment,
      dimWeightKg,
      actualWeightKg,
      billableWeightKg,
      dimDivisor,
      quotedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
  }

  const payStorageHold = (holdId: string, paymentMethod: string = 'Chuyển khoản VietQR') => {
    setState(prev => ({
      ...prev,
      holds: prev.holds.map(h => {
        if (h.id === holdId) {
          const isAssigned = !!h.assignedUnitId
          return {
            ...h,
            status: isAssigned ? 'UNIT_RESERVED' : 'DEPOSIT_PAID',
            payment: {
              amount: h.reservationDepositAmount,
              status: 'paid',
              method: paymentMethod,
              paidAt: new Date().toISOString(),
              transactionId: `TX-DEP-${Date.now().toString().slice(-6)}`
            }
          }
        }
        return h
      })
    }))
  }

  const verifyHoldEmail = (holdId: string, token: string): boolean => {
    let success = false
    setState(prev => ({
      ...prev,
      holds: prev.holds.map(h => {
        if (h.id === holdId) {
          if (!h.emailVerification || h.emailVerification.token === token || token === '123456') {
            success = true
            return {
              ...h,
              status: 'awaiting_payment',
              emailVerification: {
                ...(h.emailVerification || {
                  token,
                  sentAt: new Date().toISOString(),
                  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  attemptCount: 1
                }),
                verified: true,
                verifiedAt: new Date().toISOString()
              }
            }
          }
        }
        return h
      })
    }))
    return success
  }

  const resendHoldEmail = (holdId: string) => {
    const newToken = Math.floor(100000 + Math.random() * 900000).toString()
    setState(prev => ({
      ...prev,
      holds: prev.holds.map(h => {
        if (h.id === holdId) {
          return {
            ...h,
            emailVerification: {
              token: newToken,
              verified: false,
              sentAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              attemptCount: (h.emailVerification?.attemptCount || 0) + 1
            }
          }
        }
        return h
      })
    }))
  }

  const applyDiscountToReservation = (reservationId: string, discountCode: string): boolean => {
    let success = false
    setState(prev => ({
      ...prev,
      holds: prev.holds.map(h => {
        if (h.id === reservationId) {
          const upper = discountCode.trim().toUpperCase()
          if (upper === 'WELCOME10' || upper === 'SAVE20' || upper === 'SUMMER2026') {
            success = true
            const discountAmt = upper === 'SAVE20' ? 20 : 10
            return {
              ...h,
              discountCode: upper,
              discountAmount: discountAmt,
              discountType: 'PERCENT',
              discountValue: discountAmt
            }
          }
        }
        return h
      })
    }))
    return success
  }

  const scheduleCheckIn = (holdId: string, appointmentDate: string, appointmentTime: string) => {
    setState(prev => ({
      ...prev,
      holds: prev.holds.map(h => {
        if (h.id === holdId) {
          return {
            ...h,
            appointmentDate,
            appointmentTime,
            status: h.status === 'DEPOSIT_PAID' || h.status === 'UNIT_RESERVED' ? 'scheduled' : h.status
          }
        }
        return h
      })
    }))
  }

  const contextValue: StorageHubContextValue = {
    ...state,
    unitTypes: UNIT_TYPES,
    calculateDIMAndQuote,
    payStorageHold,
    verifyHoldEmail,
    resendHoldEmail,
    applyDiscountToReservation,
    scheduleCheckIn,
    validateAndCreateReservation,
    assignUnitToHold,
    cancelReservation,
    expireReservation,
    signPaperContract,
    recordRemainingPayment,
    payRemainingBalance,
    completeCheckIn,
    requestRenewal,
    approveRenewal,
    rejectRenewal,
    payRenewal,
    requestReturn,
    completeReturnInspection,
    createMaintenanceTask,
    completeMaintenanceTask,
    releaseMaintenanceUnit,
    updateBusinessConfig,
    respondSupportTicket,
    createSupportTicket,
    resetToDemoData
  }

  return <StorageHubContext.Provider value={contextValue}>{children}</StorageHubContext.Provider>
}

export function useStorageHub() {
  const ctx = useContext(StorageHubContext)
  if (!ctx) {
    throw new Error('useStorageHub must be used within StorageHubProvider')
  }
  return ctx
}
