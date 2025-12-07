import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Route, Customer, RouteStop, User } from '@/types';

interface DataContextType {
  routes: Route[];
  customers: Customer[];
  routeStops: RouteStop[];
  drivers: User[];
  addRoute: (route: Omit<Route, 'id' | 'createdAt'>) => Route;
  updateRoute: (id: string, updates: Partial<Route>) => void;
  deleteRoute: (id: string) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addRouteStop: (stop: Omit<RouteStop, 'id'>) => RouteStop;
  addRouteStops: (stops: Omit<RouteStop, 'id'>[]) => RouteStop[];
  updateRouteStop: (id: string, updates: Partial<RouteStop>) => void;
  deleteRouteStop: (id: string) => void;
  getRouteStops: (routeId: string) => RouteStop[];
  getCustomerById: (id: string) => Customer | undefined;
  getDriverById: (id: string) => User | undefined;
  getRoutesByDriver: (driverId: string, date?: string) => Route[];
  getRoutesByDate: (date: string) => Route[];
  getTodayRouteForDriver: (driverId: string) => Route | undefined;
  getTodayRoutesForDriver: (driverId: string) => Route[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [routes, setRoutes] = useLocalStorage<Route[]>('routeapp_routes', []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('routeapp_customers', []);
  const [routeStops, setRouteStops] = useLocalStorage<RouteStop[]>('routeapp_stops', []);

  // Get drivers from users list
  const getDrivers = (): User[] => {
    const users = JSON.parse(localStorage.getItem('routeapp_users') || '[]');
    return users.filter((u: User) => u.role === 'driver');
  };

  const drivers = getDrivers();

  const addRoute = (routeData: Omit<Route, 'id' | 'createdAt'>): Route => {
    const newRoute: Route = {
      ...routeData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setRoutes(prev => [...prev, newRoute]);
    return newRoute;
  };

  const updateRoute = (id: string, updates: Partial<Route>) => {
    setRoutes(prev => prev.map(route => 
      route.id === id ? { ...route, ...updates } : route
    ));
  };

  const deleteRoute = (id: string) => {
    setRoutes(prev => prev.filter(route => route.id !== id));
    setRouteStops(prev => prev.filter(stop => stop.routeId !== id));
  };

  const addCustomer = (customerData: Omit<Customer, 'id'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: crypto.randomUUID(),
    };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === id ? { ...customer, ...updates } : customer
    ));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id));
  };

  const addRouteStop = (stopData: Omit<RouteStop, 'id'>): RouteStop => {
    const newStop: RouteStop = {
      ...stopData,
      id: crypto.randomUUID(),
    };
    setRouteStops(prev => [...prev, newStop]);
    return newStop;
  };

  const addRouteStops = (stopsData: Omit<RouteStop, 'id'>[]): RouteStop[] => {
    const newStops: RouteStop[] = stopsData.map(stopData => ({
      ...stopData,
      id: crypto.randomUUID(),
    }));
    setRouteStops(prev => [...prev, ...newStops]);
    return newStops;
  };

  const updateRouteStop = (id: string, updates: Partial<RouteStop>) => {
    setRouteStops(prev => prev.map(stop => 
      stop.id === id ? { ...stop, ...updates } : stop
    ));
  };

  const deleteRouteStop = (id: string) => {
    setRouteStops(prev => prev.filter(stop => stop.id !== id));
  };

  const getRouteStops = (routeId: string): RouteStop[] => {
    return routeStops
      .filter(stop => stop.routeId === routeId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const getCustomerById = (id: string): Customer | undefined => {
    return customers.find(c => c.id === id);
  };

  const getDriverById = (id: string): User | undefined => {
    const users = JSON.parse(localStorage.getItem('routeapp_users') || '[]');
    return users.find((u: User) => u.id === id);
  };

  const getRoutesByDriver = (driverId: string, date?: string): Route[] => {
    return routes.filter(r => {
      if (r.driverId !== driverId) return false;
      if (date && r.date !== date) return false;
      return true;
    });
  };

  const getRoutesByDate = (date: string): Route[] => {
    return routes.filter(r => r.date === date);
  };

  const getTodayRouteForDriver = (driverId: string): Route | undefined => {
    const today = new Date().toISOString().split('T')[0];
    return routes.find(r => r.driverId === driverId && r.date === today);
  };

  const getTodayRoutesForDriver = (driverId: string): Route[] => {
    const today = new Date().toISOString().split('T')[0];
    return routes.filter(r => r.driverId === driverId && r.date === today);
  };

  return (
    <DataContext.Provider value={{
      routes,
      customers,
      routeStops,
      drivers,
      addRoute,
      updateRoute,
      deleteRoute,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addRouteStop,
      addRouteStops,
      updateRouteStop,
      deleteRouteStop,
      getRouteStops,
      getCustomerById,
      getDriverById,
      getRoutesByDriver,
      getRoutesByDate,
      getTodayRouteForDriver,
      getTodayRoutesForDriver,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
