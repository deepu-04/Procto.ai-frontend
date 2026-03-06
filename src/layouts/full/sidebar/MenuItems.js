import {
  IconLayoutDashboard,
  IconTypography,
  IconCopy,
  IconFileText,
  IconVideo,
  IconMicrophone,
  IconMoodHappy,
  IconLogin,
  IconUserPlus,
  IconHelp,
  IconSettings,
  IconReportAnalytics, // Added for Analytics
} from '@tabler/icons-react';

import { uniqueId } from 'lodash';

/**
 * Menuitems definition
 * roles: ['student', 'teacher'] determines visibility in the Sidebar component
 */
const Menuitems = [
  {
    navlabel: true,
    subheader: 'Menu',
  },
  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/dashboard',
    roles: ['student', 'teacher'],
  },

  // --- STUDENT AREA (Only visible to Students) ---
  {
    navlabel: true,
    subheader: 'Student Area',
    roles: ['student'],
  },
  {
    id: uniqueId(),
    title: 'Exams',
    icon: IconTypography,
    href: '/candidate/ai-exam',
    roles: ['student'],
  },
  {
    id: uniqueId(),
    title: 'Analytics',
    icon: IconReportAnalytics, // New Analytics Icon
    href: '/candidate/analytics', // Route matches the Analytics page
    roles: ['student'],
  },
  {
    id: uniqueId(),
    title: 'Result',
    icon: IconCopy,
    href: '/result',
    roles: ['student'],
  },
  {
    id: uniqueId(),
    title: 'Resume Based Exam',
    icon: IconFileText,
    href: '/candidate/resume-exam',
    roles: ['student'],
  },
  {
    id: uniqueId(),
    title: 'AI Interview Room',
    icon: IconVideo,
    href: '/candidate/procto-interview', // Ensure this is exactly /candidate/procto-interview
    roles: ['student'],
  },
  {
    id: uniqueId(),
    title: 'Help & Support',
    icon: IconHelp,
    href: '/candidate/help-support',
    roles: ['student'],
  },

  // --- TEACHER AREA (Only visible to Teachers) ---
  {
    navlabel: true,
    subheader: 'Teacher Area',
    roles: ['teacher'],
  },
  // {
  //   id: uniqueId(),
  //   title: 'Conduct Interview', 
  //   icon: IconMicrophone,
  //   href: '/teacher/conduct-interview',
  //   roles: ['teacher'], // Strict access
  // },
  {
    id: uniqueId(),
    title: 'Create Exam',
    icon: IconMoodHappy,
    href: '/create-exam',
    roles: ['teacher'],
  },
  {
    id: uniqueId(),
    title: 'Add Questions',
    icon: IconLogin,
    href: '/add-questions',
    roles: ['teacher'],
  },
  {
    id: uniqueId(),
    title: 'Exam Logs',
    icon: IconUserPlus,
    href: '/exam-log',
    roles: ['teacher'],
  },
  // {
  //   id: uniqueId(),
  //   title: 'Proctoring Settings',
  //   icon: IconSettings,
  //   href: '/teacher/settings',
  //   roles: ['teacher'],
  // },
];

export default Menuitems;