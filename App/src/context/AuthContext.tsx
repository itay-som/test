import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, role: UserRole, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('routeapp_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const users = JSON.parse(localStorage.getItem('routeapp_users') || '[]');
    const foundUser = users.find((u: User & { password: string }) => u.email === email);
    
    if (!foundUser) {
      return { success: false, error: 'משתמש לא נמצא' };
    }
    
    if (foundUser.password !== password) {
      return { success: false, error: 'סיסמה שגויה' };
    }

    const { password: _, ...userWithoutPassword } = foundUser;
    setUser(userWithoutPassword);
    localStorage.setItem('routeapp_user', JSON.stringify(userWithoutPassword));
    return { success: true };
  };

  const register = async (
    email: string, 
    password: string, 
    name: string, 
    role: UserRole,
    phone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const users = JSON.parse(localStorage.getItem('routeapp_users') || '[]');
    
    if (users.some((u: User) => u.email === email)) {
      return { success: false, error: 'כתובת האימייל כבר רשומה' };
    }

    const newUser: User & { password: string } = {
      id: crypto.randomUUID(),
      email,
      password,
      name,
      phone,
      role,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem('routeapp_users', JSON.stringify(users));

    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('routeapp_user', JSON.stringify(userWithoutPassword));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('routeapp_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
