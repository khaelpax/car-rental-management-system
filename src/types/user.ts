export type UserRole = 'admin' | 'customer';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  id?: string;
  displayName?: string;
}
