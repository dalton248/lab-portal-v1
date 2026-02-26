import { User, Lab, Case, Message, TeamMember } from './types';

export const mockLab: Lab = {
  id: 'lab-1',
  name: 'Precision Dental Lab',
  logo: undefined,
};

export const mockUsers: Record<string, User> = {
  dentist: {
    id: 'user-1',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@dental.com',
    role: 'dentist',
    labId: 'lab-1',
  },
  labAdmin: {
    id: 'user-2',
    name: 'Michael Chen',
    email: 'michael.chen@precisionlab.com',
    role: 'lab_admin',
    labId: 'lab-1',
  },
};

export const mockCases: Case[] = [
  {
    id: '1',
    caseId: 'CS-2024-001',
    patientName: 'John Smith',
    caseType: 'Crown',
    shade: 'A2',
    status: 'in_progress',
    dueDate: '2024-03-15',
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: '2024-02-23T14:30:00Z',
    dentistId: 'user-1',
    dentistName: 'Dr. Sarah Johnson',
    labId: 'lab-1',
    notes: 'Upper right first molar. Patient prefers natural shade.',
  },
  {
    id: '2',
    caseId: 'CS-2024-002',
    patientName: 'Emily Davis',
    caseType: 'Bridge',
    shade: 'B1',
    status: 'submitted',
    dueDate: '2024-03-20',
    createdAt: '2024-02-22T09:15:00Z',
    updatedAt: '2024-02-22T09:15:00Z',
    dentistId: 'user-1',
    dentistName: 'Dr. Sarah Johnson',
    labId: 'lab-1',
    notes: '3-unit bridge, teeth 14-16.',
  },
  {
    id: '7',
    caseId: 'CS-2024-007',
    patientName: 'Michael Chang',
    caseType: 'Crown',
    shade: 'A2',
    status: 'on_hold',
    dueDate: '2024-03-22',
    createdAt: '2024-02-20T14:00:00Z',
    updatedAt: '2024-02-24T11:15:00Z',
    dentistId: 'user-1',
    dentistName: 'Dr. Sarah Johnson',
    labId: 'lab-1',
    notes: 'Awaiting confirmation on prep margins from dentist.',
  },
  {
    id: '3',
    caseId: 'CS-2024-003',
    patientName: 'Robert Martinez',
    caseType: 'Denture',
    status: 'completed',
    dueDate: '2024-02-28',
    createdAt: '2024-02-10T11:20:00Z',
    updatedAt: '2024-02-28T16:45:00Z',
    dentistId: 'user-3',
    dentistName: 'Dr. James Wilson',
    labId: 'lab-1',
    notes: 'Complete upper denture.',
  },
  {
    id: '4',
    caseId: 'CS-2024-004',
    patientName: 'Lisa Anderson',
    caseType: 'Crown',
    shade: 'A3',
    status: 'in_progress',
    dueDate: '2024-03-18',
    createdAt: '2024-02-21T13:45:00Z',
    updatedAt: '2024-02-24T10:20:00Z',
    dentistId: 'user-3',
    dentistName: 'Dr. James Wilson',
    labId: 'lab-1',
  },
  {
    id: '5',
    caseId: 'CS-2024-005',
    patientName: 'David Thompson',
    caseType: 'Implant Crown',
    shade: 'A1',
    status: 'submitted',
    dueDate: '2024-03-25',
    createdAt: '2024-02-23T15:00:00Z',
    updatedAt: '2024-02-23T15:00:00Z',
    dentistId: 'user-1',
    dentistName: 'Dr. Sarah Johnson',
    labId: 'lab-1',
    notes: 'Implant crown on #19. Abutment attached.',
  },
  {
    id: '8',
    caseId: 'CS-2024-008',
    patientName: 'Rachel Brooks',
    caseType: 'Denture',
    status: 'on_hold',
    dueDate: '2024-03-28',
    createdAt: '2024-02-19T10:45:00Z',
    updatedAt: '2024-02-24T16:30:00Z',
    dentistId: 'user-3',
    dentistName: 'Dr. James Wilson',
    labId: 'lab-1',
    notes: 'Patient scheduling conflict - waiting for new appointment date.',
  },
  {
    id: '6',
    caseId: 'CS-2024-006',
    patientName: 'Jennifer Lee',
    caseType: 'Veneer',
    shade: 'B1',
    status: 'rejected',
    dueDate: '2024-03-10',
    createdAt: '2024-02-18T12:30:00Z',
    updatedAt: '2024-02-25T09:00:00Z',
    dentistId: 'user-3',
    dentistName: 'Dr. James Wilson',
    labId: 'lab-1',
    notes: 'Shade mismatch - needs remake.',
  },
];

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    caseId: '1',
    senderId: 'user-1',
    senderName: 'Dr. Sarah Johnson',
    senderRole: 'dentist',
    message: 'Hi, I uploaded the impressions for John Smith. Please let me know if you need any additional information.',
    createdAt: '2024-02-20T10:30:00Z',
  },
  {
    id: 'msg-2',
    caseId: '1',
    senderId: 'user-2',
    senderName: 'Michael Chen',
    senderRole: 'lab_admin',
    message: 'Thanks Dr. Johnson. The impressions look good. We\'ve started work on the crown. ETA is March 14th.',
    createdAt: '2024-02-21T14:15:00Z',
  },
  {
    id: 'msg-3',
    caseId: '1',
    senderId: 'user-1',
    senderName: 'Dr. Sarah Johnson',
    senderRole: 'dentist',
    message: 'Perfect, that works well with the patient\'s schedule. Thank you!',
    createdAt: '2024-02-21T15:00:00Z',
  },
  {
    id: 'msg-4',
    caseId: '1',
    senderId: 'user-2',
    senderName: 'Michael Chen',
    senderRole: 'lab_admin',
    message: 'Crown is now in the final finishing stage. Will ship tomorrow.',
    createdAt: '2024-02-23T14:30:00Z',
  },
];

export const mockTeamMembers: TeamMember[] = [
  {
    id: 'user-1',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@dental.com',
    status: 'active',
    joinedAt: '2023-10-15',
  },
  {
    id: 'user-3',
    name: 'Dr. James Wilson',
    email: 'james.wilson@dental.com',
    status: 'active',
    joinedAt: '2023-11-20',
  },
  {
    id: 'user-4',
    name: 'Dr. Maria Garcia',
    email: 'maria.garcia@dental.com',
    status: 'pending',
    joinedAt: '2024-02-25',
  },
];

let currentUser: User = mockUsers.dentist;

export const getCurrentUser = (): User => currentUser;

export const setCurrentUser = (role: 'dentist' | 'labAdmin'): void => {
  currentUser = mockUsers[role];
};

export const getCasesForCurrentUser = (): Case[] => {
  const user = getCurrentUser();
  if (user.role === 'lab_admin') {
    return mockCases;
  }
  return mockCases.filter(c => c.dentistId === user.id);
};

export const getCaseById = (id: string): Case | undefined => {
  return mockCases.find(c => c.id === id);
};

export const getMessagesForCase = (caseId: string): Message[] => {
  return mockMessages.filter(m => m.caseId === caseId);
};

export const searchCases = (query: string, cases: Case[]): Case[] => {
  if (!query.trim()) return cases;

  const lowerQuery = query.toLowerCase();

  return cases.filter(caseItem =>
    caseItem.caseId.toLowerCase().includes(lowerQuery) ||
    caseItem.patientName.toLowerCase().includes(lowerQuery) ||
    caseItem.dentistName.toLowerCase().includes(lowerQuery) ||
    caseItem.status.toLowerCase().includes(lowerQuery)
  );
};
