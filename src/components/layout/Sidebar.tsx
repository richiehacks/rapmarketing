import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  Users,
  Mail,
  Video,
  Target,
  Upload,
  Settings,
  Home,
  Zap,
  Database,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Data Management', href: '/data', icon: Database },
  { name: 'LinkedIn Campaigns', href: '/linkedin', icon: Users },
  { name: 'Email Campaigns', href: '/email', icon: Mail },
  { name: 'Webinars', href: '/webinars', icon: Video },
  { name: 'Other Campaigns', href: '/campaigns', icon: Target },
  { name: 'Data Upload', href: '/upload', icon: Upload },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">RAP Dashboard</h1>
            <p className="text-xs text-muted-foreground">Marketing Analytics</p>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.name} to={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start space-x-2',
                    isActive && 'bg-secondary font-medium'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}