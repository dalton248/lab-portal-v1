export type UserRole = 'lab_admin' | 'dentist';

export type CaseStatus = 'submitted' | 'in_progress' | 'on_hold' | 'completed' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  labId: string;
  avatar?: string;
}

export interface Lab {
  id: string;
  name: string;
  logo?: string;
}

export interface Case {
  id: string;
  caseId: string;
  patientName: string;
  caseType: string;
  shade?: string;
  status: CaseStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  dentistId: string;
  dentistName: string;
  labId: string;
  notes?: string;
}

export interface Message {
  id: string;
  caseId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'pending';
  joinedAt: string;
}
