
export type Student = {
  id: string;
  name: string;
  attendance: number;
  overallGrade: string;
};

export type Material = {
  id: string;
  title: string;
  type: 'Notes' | 'DPP' | 'Test' | 'Solution';
  subject: string;
  chapter: string;
  date: string;
  isNew?: boolean;
};

export const teacherData = {
  name: "Dr. Evelyn Reed",
  id: "TID-84321",
  avatarUrl: 'https://picsum.photos/seed/teacher-avatar/100/100',
  studentRequests: [
    { id: 'S003', name: 'Charlie Davis', avatarUrl: 'https://picsum.photos/seed/S003/40/40' },
    { id: 'S004', name: 'Diana Prince', avatarUrl: 'https://picsum.photos/seed/S004/40/40' },
  ],
  enrolledStudents: [
    { id: 'S001', name: 'Alice Johnson', grade: 'A', attendance: 95, avatarUrl: 'https://picsum.photos/seed/S001/40/40', batch: 'Morning Physics' },
    { id: 'S002', name: 'Bob Williams', grade: 'B', attendance: 88, avatarUrl: 'https://picsum.photos/seed/S002/40/40', batch: 'Evening Chemistry' },
  ],
  schedule: {
    '2024-07-29': { status: 'Open', topic: 'Algebra Basics' },
    '2024-07-30': { status: 'Open', topic: 'Linear Equations' },
    '2024-07-31': { status: 'Holiday', topic: 'Summer Break' },
  },
  classStatus: 'Open',
  subjects: ['Mathematics', 'Physics', 'Chemistry'],
  batches: [
    { id: 'batch1', name: 'Morning Physics', createdAt: new Date() },
    { id: 'batch2', name: 'Evening Chemistry', createdAt: new Date() },
  ],
  studyMaterials: [
    { id: 'M01', title: 'Algebra Chapter 1 Notes', type: 'Notes', subject: 'Math', chapter: '1', date: '3 days ago', isNew: true },
    { id: 'M02', title: 'DPP - Linear Equations', type: 'DPP', subject: 'Math', chapter: '2', date: '2 days ago', isNew: true },
    { id: 'M03', title: 'Physics Chapter 1 Test', type: 'Test', subject: 'Physics', chapter: '1', date: '1 day ago', isNew: true },
    { id: 'M04', title: 'Chemistry Formula Sheet', type: 'Notes', subject: 'Chemistry', chapter: 'Revision', date: '5 days ago' },
    { id: 'M05', title: 'DPP - Kinematics', type: 'DPP', subject: 'Physics', chapter: '3', date: '4 days ago', isNew: false },
  ],
  performance: [
    { name: 'Unit 1', score: 85 },
    { name: 'Unit 2', score: 92 },
    { name: 'Midterm', score: 88 },
    { name: 'Unit 3', score: 95 },
    { name: 'Final', score: 91 },
  ],
  attendanceRecords: [
    { date: '2024-07-29', status: 'Present' },
    { date: '2024-07-28', status: 'Present' },
    { date: '2024-07-27', status: 'Absent' },
    { date: '2024-07-26', status: 'Present' },
  ]
};

export const studentData = {
  name: "Alice Johnson",
  id: "SID-12345",
  avatarUrl: 'https://picsum.photos/seed/student-avatar/100/100',
  isConnected: false,
  stats: {
    newDpps: 2,
    pendingSubmissions: 1,
    attendance: 95,
  },
  // Data below will be replaced by teacher data upon connection
  performance: teacherData.performance,
  studyMaterials: teacherData.studyMaterials,
  attendanceRecords: teacherData.attendanceRecords,
};

export const parentData = {
    name: 'Mr. Johnson',
    avatarUrl: 'https://picsum.photos/seed/parent-avatar/100/100',
};

export const tutorsData = [
    {
        id: 'TUT01',
        name: 'Dr. Evelyn Reed',
        avatarUrl: 'https://picsum.photos/seed/teacher-avatar/100/100',
        subjects: ['Mathematics', 'Physics'],
        experience: '5 Years',
        location: 'New York, NY',
        qualification: 'Ph.D. in Physics',
        gender: 'Female',
        availableTime: 'Weekdays 4pm-8pm',
        fees: '$50/hr',
        isVerified: true,
    },
    {
        id: 'TUT02',
        name: 'Johnathan Doe',
        avatarUrl: 'https://picsum.photos/seed/tutor2/100/100',
        subjects: ['Chemistry', 'Biology'],
        experience: '8 Years',
        location: 'Boston, MA',
        qualification: 'M.Sc. in Chemistry',
        gender: 'Male',
        availableTime: 'Weekends 10am-6pm',
        fees: '$60/hr',
        isVerified: true,
    },
    {
        id: 'TUT03',
        name: 'Maria Garcia',
        avatarUrl: 'https://picsum.photos/seed/tutor3/100/100',
        subjects: ['English', 'History'],
        experience: '10 Years',
        location: 'San Francisco, CA',
        qualification: 'M.A. in English Literature',
        gender: 'Female',
        availableTime: 'Tue/Thu 5pm-9pm',
        fees: '$45/hr',
        isVerified: false,
    }
];

export const shopItemsData = [
  {
    id: 'shop01',
    title: 'Advanced Mathematics Textbook',
    category: 'Textbook',
    price: '$75.00',
    imageUrl: 'https://picsum.photos/seed/book1/300/200'
  },
  {
    id: 'shop02',
    title: 'Comprehensive Physics Video Course',
    category: 'Video Course',
    price: '$120.00',
    imageUrl: 'https://picsum.photos/seed/course1/300/200'
  },
  {
    id: 'shop03',
    title: 'Organic Chemistry Practice Problems',
    category: 'Practice Book',
    price: '$45.00',
    imageUrl: 'https://picsum.photos/seed/book2/300/200'
  }
];
