import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, Package, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'ראשי' },
  { href: '/routes', icon: MapPin, label: 'מסלולים' },
  { href: '/deliveries', icon: Package, label: 'משלוחים' },
  { href: '/customers', icon: Users, label: 'לקוחות' },
  { href: '/analytics', icon: BarChart3, label: 'סטטיסטיקות' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-200",
                isActive && "gradient-primary shadow-soft"
              )}>
                <Icon className={cn(
                  "w-5 h-5",
                  isActive && "text-primary-foreground"
                )} />
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
