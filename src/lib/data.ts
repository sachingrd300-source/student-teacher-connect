
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
  studentRequests: [],
  enrolledStudents: [
    { id: 'S001', name: 'Alice Johnson', grade: 'A', attendance: 95, avatarUrl: 'https://picsum.photos/seed/S001/40/40', batch: 'Morning Physics' },
    { id: 'S002', name: 'Bob Williams', grade: 'B', attendance: 88, avatarUrl: 'https://picsum.photos/seed/S002/40/40', batch: 'Evening Chemistry' },
    { id: 'S003', name: 'Charlie Davis', avatarUrl: 'https://picsum.photos/seed/S003/40/40', grade: 'N/A', attendance: 100, createdAt: new Date('2023-10-27T10:00:00Z') },
    { id: 'S004', name: 'Diana Prince', avatarUrl: 'https://picsum.photos/seed/S004/40/40', grade: 'N/A', attendance: 100, createdAt: new Date('2023-10-27T10:00:00Z') }
  ],
  schedule: [
    { id: 'sch-1', topic: 'Algebra Basics', subject: 'Mathematics', date: new Date(new Date().setDate(new Date().getDate() + 1)), time: '10:00 AM', type: 'Online', locationOrLink: 'https://meet.google.com/xyz-abc-pqr', status: 'Scheduled' },
    { id: 'sch-2', topic: 'Linear Equations', subject: 'Mathematics', date: new Date(new Date().setDate(new Date().getDate() + 2)), time: '11:00 AM', type: 'Offline', locationOrLink: 'Classroom 5', status: 'Scheduled' },
    { id: 'sch-3', topic: 'Thermodynamics', subject: 'Physics', date: new Date(new Date().setDate(new Date().getDate() + 3)), time: '02:00 PM', type: 'Online', locationOrLink: 'https://meet.google.com/def-ghi-jkl', status: 'Scheduled' }
  ],
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
  schedule: teacherData.schedule,
};

export const parentData = {
    name: 'Mr. Johnson',
    avatarUrl: 'https://picsum.photos/seed/parent-avatar/100/100',
};
