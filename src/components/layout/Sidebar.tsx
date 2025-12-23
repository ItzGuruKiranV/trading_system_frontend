/**
 * ============================================================
 * SIDEBAR COMPONENT
 * ============================================================
 * Purpose: Main navigation sidebar for the trading platform
 * 
 * Features:
 * - Collapsible/expandable design
 * - Active route highlighting
 * - User profile section
 * - Logout functionality
 * 
 * Navigation includes:
 * - Home/Dashboard
 * - Charts
 * - Systems
 * - Journal
 * - Backtest Results
 * - Trade Opportunities
 * - Calculator (NEW)
 * - News (NEW)
 * - Settings
 * ============================================================
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  LineChart, 
  Cog, 
  BookOpen, 
  BarChart3, 
  Lightbulb, 
  Settings, 
  LogOut,
  TrendingUp,
  Menu,
  X,
  Calculator,
  Newspaper
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Navigation items configuration
 * Each item has a path, label, and icon
 */
const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/charts', label: 'Charts', icon: LineChart },
  { path: '/systems', label: 'Systems', icon: Cog },
  { path: '/journal', label: 'Journal', icon: BookOpen },
  { path: '/backtests', label: 'Backtest Results', icon: BarChart3 },
  { path: '/opportunities', label: 'Trade Opportunities', icon: Lightbulb },
  { path: '/calculator', label: 'Calculator', icon: Calculator },
  { path: '/news', label: 'News', icon: Newspaper },
  { path: '/settings', label: 'Settings', icon: Settings },
];

/**
 * Sidebar props interface
 */
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Sidebar Component
 */
const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();

  // Get display name from profile or email
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header with logo */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">TradePro</span>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </Button>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-2 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    "nav-link",
                    isActive && "active",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={signOut}
            className="w-full text-muted-foreground hover:text-destructive"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
