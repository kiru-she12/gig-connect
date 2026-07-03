import {
  Home, Search, Briefcase, MessageSquare, Truck, Star, Settings,
  Users, CheckCircle, BarChart2, AlertCircle, FileText, LayoutDashboard,
  PlusCircle, List, MapPin, Bell, LogOut, TrendingUp
} from 'lucide-react';

export const ADMIN_LINKS = [
  { to: '/dashboard/admin/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/admin/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/dashboard/admin/users', icon: Users, label: 'User Management' },
  { to: '/dashboard/admin/approvals', icon: CheckCircle, label: 'Job Approvals' },
  { to: '/dashboard/admin/monitoring', icon: Search, label: 'Job Monitoring' },
  { to: '/dashboard/admin/delivery', icon: Truck, label: 'Delivery Management' },
  { to: '/dashboard/admin/revenue', icon: BarChart2, label: 'Payments & Revenue' },
  { to: '/dashboard/admin/communications', icon: MessageSquare, label: 'Communications' },
  { to: '/dashboard/admin/complaints', icon: AlertCircle, label: 'Complaints & Alerts' },
  { to: '/dashboard/admin/reports', icon: FileText, label: 'Reports' },
];

export const STUDENT_LINKS = [
  { to: '/dashboard/student/analytics', icon: TrendingUp, label: 'Analytics' },
  { to: '/dashboard/student/applications', icon: Briefcase, label: 'My Applications' },
  { to: '/dashboard/student/past-history', icon: List, label: 'Past History' },
  { to: '/dashboard/student/delivery', icon: Truck, label: 'Deliveries' },
  { to: '/dashboard/student/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/dashboard/student/notifications', icon: Bell, label: 'Notifications' },
  { to: '/dashboard/student/reviews', icon: Star, label: 'Reviews' },
  { to: '/dashboard/student/settings', icon: Settings, label: 'Profile Settings' },
];

export const CLIENT_LINKS = [
  { to: '/dashboard/client/home', icon: Home, label: 'Home' },
  { to: '/dashboard/client/post', icon: PlusCircle, label: 'Post a Job' },
  { to: '/dashboard/client/listings', icon: List, label: 'My Job Listings' },
  { to: '/dashboard/client/applicants', icon: Users, label: 'Applicants' },
  { to: '/dashboard/client/delivery', icon: Truck, label: 'Delivery Orders' },
  { to: '/dashboard/client/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/dashboard/client/ratings', icon: Star, label: 'Ratings' },
  { to: '/dashboard/client/settings', icon: Settings, label: 'Profile Settings' },
];


export const DELIVERY_LINKS = [
  { to: '/dashboard/delivery/active', icon: Truck, label: 'Active Deliveries' },
  { to: '/dashboard/delivery/history', icon: List, label: 'Delivery History' },
  { to: '/dashboard/delivery/earnings', icon: BarChart2, label: 'My Earnings' },
  { to: '/dashboard/delivery/profile', icon: Settings, label: 'Profile Settings' },
];

export const getLinksByRole = (role) => {
  switch (role) {
    case 'admin':
      return ADMIN_LINKS;
    case 'manager':
      return ADMIN_LINKS.filter(link => link.label !== 'Reports');
    case 'student':
      return STUDENT_LINKS;
    case 'client':
      return CLIENT_LINKS;
    case 'delivery_staff':
      return DELIVERY_LINKS;
    default:
      return [];
  }
};
