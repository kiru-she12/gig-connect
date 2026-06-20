export const INITIAL_STUDENTS = [
  {
    id: 'std_1',
    name: 'Kirushika Thavanesan',
    email: 'cst23080@std.uwu.ac.lk',
    role: 'student',
    skills: ['Web Dev', 'Design'],
    rating: 4.8,
    pastJobs: 12,
    avatar: 'KT',
    availability: ['Weekdays', 'Weekends'],
    phone: '+94 77 123 4567',
    deliveryEnabled: false
  },
  {
    id: 'std_2',
    name: 'Nogini Sureshkumar',
    email: 'cst23074@std.uwu.ac.lk',
    role: 'student',
    skills: ['Data Entry', 'Translation'],
    rating: 4.5,
    pastJobs: 8,
    avatar: 'NS',
    availability: ['Weekends', 'Evenings'],
    phone: '+94 77 234 5678',
    deliveryEnabled: false
  },
  {
    id: 'std_3',
    name: 'Hilmanraj Saminthanraj',
    email: 'cst23073@std.uwu.ac.lk',
    role: 'student',
    skills: ['Photography', 'Design'],
    rating: 4.7,
    pastJobs: 15,
    avatar: 'HS',
    availability: ['Weekdays', 'Evenings'],
    phone: '+94 77 345 6789',
    deliveryEnabled: false
  }
];

export const INITIAL_CLIENTS = [
  {
    id: 'cli_1',
    name: 'Badulla Tech Solutions',
    email: 'badulla@tech.lk',
    role: 'client',
    verified: true,
    type: 'on-site',
    businessName: 'Badulla Tech Solutions',
    nic: '199512345678',
    avatar: 'BT'
  },
  {
    id: 'cli_2',
    name: 'Uva Creatives',
    email: 'info@uvacreatives.lk',
    role: 'client',
    verified: true,
    type: 'remote',
    businessName: 'Uva Creatives',
    nic: '198887654321',
    avatar: 'UC'
  }
];

export const INITIAL_JOBS = [
  {
    id: 'job_1',
    title: 'Design a Logo',
    clientId: 'cli_2',
    clientName: 'Uva Creatives',
    category: 'Design',
    type: 'Remote',
    pay: 3500,
    duration: '1 Day',
    status: 'Active',
    skills: ['Design'],
    description: 'We need a modern logo for our new startup. Should be clean and minimalist.',
    postedAt: '2026-05-10T10:00:00Z'
  },
  {
    id: 'job_2',
    title: 'Data Entry for Survey',
    clientId: 'cli_2',
    clientName: 'Uva Creatives',
    category: 'Data Entry',
    type: 'Remote',
    pay: 2000,
    duration: 'Few Hours',
    status: 'Active',
    skills: ['Data Entry'],
    description: 'Transfer survey data from paper forms to Excel spreadsheet.',
    postedAt: '2026-05-11T09:00:00Z'
  },
  {
    id: 'job_3',
    title: 'Product Photography',
    clientId: 'cli_1',
    clientName: 'Badulla Tech Solutions',
    category: 'Photography',
    type: 'On-site',
    pay: 5000,
    duration: '1 Day',
    status: 'Pending Approval',
    skills: ['Photography'],
    description: 'Need a photographer to take high-quality shots of our new tech gadgets.',
    address: 'Passara Road, Badulla',
    postedAt: '2026-05-12T08:00:00Z'
  },
  {
    id: 'job_4',
    title: 'Website Landing Page',
    clientId: 'cli_1',
    clientName: 'Badulla Tech Solutions',
    category: 'Web Dev',
    type: 'Remote',
    pay: 8000,
    duration: '3 Days',
    status: 'Active',
    skills: ['Web Dev'],
    description: 'Build a responsive landing page using React and Tailwind.',
    postedAt: '2026-05-11T14:00:00Z'
  },
  {
    id: 'job_5',
    title: 'Translate Documents',
    clientId: 'cli_2',
    clientName: 'Uva Creatives',
    category: 'Translation',
    type: 'Remote',
    pay: 1500,
    duration: 'Few Hours',
    status: 'Completed',
    skills: ['Translation'],
    description: 'Translate a short technical manual from English to Sinhala.',
    postedAt: '2026-05-09T11:00:00Z'
  }
];

export const INITIAL_APPLICATIONS = [
  {
    id: 'app_1',
    jobId: 'job_1',
    studentId: 'std_1',
    status: 'Shortlisted',
    appliedAt: '2026-05-10T11:00:00Z'
  },
  {
    id: 'app_2',
    jobId: 'job_2',
    studentId: 'std_2',
    status: 'Accepted',
    appliedAt: '2026-05-11T10:00:00Z'
  },
  {
    id: 'app_3',
    jobId: 'job_3',
    studentId: 'std_3',
    status: 'Applied',
    appliedAt: '2026-05-12T09:00:00Z'
  }
];

export const INITIAL_DELIVERY_STAFF = [
  {
    id: 'del_1',
    name: 'Rajan Kumar',
    email: 'delivery@gigconnect.lk',
    role: 'delivery',
    phone: '+94 71 456 7890',
    vehicle: 'Motorbike',
    status: 'active',
    activeDelivery: 'job_3'
  }
];

export const CATEGORIES = [
  'Creative & Content', 'Academic & Tutoring', 'On-site/Physical', 'languages', 'Local Services', 'tourism', 'Other'
];

export const SKILLS_LIST = [
  'Graphic Design',
  'Video Editing',
  'Social Media Management',
  'UI/UX Design',
  'Mobile App Development',
  'WordPress',
  'Excel/Spreadsheets',
  'AI Tools (ChatGPT, etc.)',
  'Creative & Content',
  'Academic & Tutoring',
  'On-site/Physical',
  'languages',
  'Local Services',
  'tourism'
];
