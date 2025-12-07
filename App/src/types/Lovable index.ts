export type UserRole = 'admin' | 'driver';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  addressFull: string;
  street?: string;
  city?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  isActive: boolean;
}

export type RouteStopStatus = 'PLANNED' | 'VISITED' | 'SKIPPED';

export interface RouteStop {
  id: string;
  routeId: string;
  orderIndex: number;
  customerId: string;
  status: RouteStopStatus;
  driverNotes?: string;
  arrivalTime?: string;
  completionTime?: string;
}

export interface Route {
  id: string;
  date: string;
  driverId: string;
  startLocationAddress: string;
  createdByAdminId: string;
  totalEstimatedDistance?: string;
  totalEstimatedTime?: string;
  createdAt: string;
}

export interface DailyStats {
  date: string;
  driverId: string;
  totalStops: number;
  visitedStops: number;
  skippedStops: number;
}
