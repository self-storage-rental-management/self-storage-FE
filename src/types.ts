export type Role = 'customer' | 'staff' | 'manager' | 'business' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  facility?: string
}
