import {
  House, MagnifyingGlass, Briefcase, ChatCircle, Truck, Star, Gear,
  Users, CheckCircle, ChartBar, WarningCircle, FileText, SquaresFour,
  PlusCircle, List, Bell, TrendUp, User
} from '@phosphor-icons/react';

export const ADMIN_LINKS = [
  { to: '/dashboard/admin/overview', icon: SquaresFour, label: 'Overview' },
  { to: '/dashboard/admin/analytics', icon: ChartBar, label: 'Analytics' },
  { to: '/dashboard/admin/users', icon: Users, label: 'User Management' },
  { to: '/dashboard/admin/approvals', icon: CheckCircle, label: 'Job Approvals' },
  { to: '/dashboard/admin/monitoring', icon: MagnifyingGlass, label: 'Job Monitoring' },
  { to: '/dashboard/admin/delivery', icon: Truck, label: 'Delivery Management' },
  { to: '/dashboard/admin/revenue', icon: ChartBar, label: 'Payments & Revenue' },
  { to: '/dashboard/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/dashboard/admin/complaints', icon: WarningCircle, label: 'Complaints' },
  { to: '/dashboard/admin/communications', icon: ChatCircle, label: 'Communications' },
  { to: '/dashboard/admin/reports', icon: FileText, label: 'Reports' },
];

export const STUDENT_LINKS = [
  { to: '/dashboard/student/analytics', icon: TrendUp, label: 'Analytics' },
  { to: '/dashboard/student/applications', icon: Briefcase, label: 'My Applications' },
  { to: '/dashboard/student/past-history', icon: List, label: 'Past History' },
  { to: '/dashboard/student/delivery', icon: Truck, label: 'Deliveries' },
  { to: '/dashboard/student/messages', icon: ChatCircle, label: 'Messages' },
  { to: '/dashboard/student/notifications', icon: Bell, label: 'Notifications' },
  { to: '/dashboard/student/reviews', icon: Star, label: 'Reviews' },
  { to: '/dashboard/student/settings', icon: Gear, label: 'Profile Settings' },
];

export const CLIENT_LINKS = [
  { to: '/dashboard/client/home', icon: House, label: 'Home' },
  { to: '/dashboard/client/post', icon: PlusCircle, label: 'Post a Job' },
  { to: '/dashboard/client/listings', icon: List, label: 'My Job Listings' },
  { to: '/dashboard/client/applicants', icon: Users, label: 'Applicants' },
  { to: '/dashboard/client/delivery', icon: Truck, label: 'Delivery Orders' },
  { to: '/dashboard/client/messages', icon: ChatCircle, label: 'Messages' },
  { to: '/dashboard/client/ratings', icon: Star, label: 'Rating & Review' },
  { to: '/dashboard/client/notifications', icon: Bell, label: 'Notifications' },
  { to: '/dashboard/client/settings', icon: Gear, label: 'Profile Settings' },
];


export const DELIVERY_LINKS = [
  { to: '/dashboard/delivery', icon: SquaresFour, label: 'Overview' },
  { to: '/dashboard/delivery/management', icon: Truck, label: 'Delivery Management' },
  { to: '/dashboard/delivery/notifications', icon: Bell, label: 'Notifications' },
  { to: '/dashboard/delivery/profile', icon: User, label: 'My Profile' },
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
