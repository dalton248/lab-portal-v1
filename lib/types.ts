export type UserRole = 'lab_admin' | 'dentist';

export type CaseStatus = 'submitted' | 'in_progress' | 'on_hold' | 'completed' | 'rejected';

export type PrepType = 'monolithic' | 'layered' | 'digital' | 'traditional';

export type WhatNeeded = 'implant' | 'denture' | 'partial' | 'crown' | 'nightguard' | 'retainer' | 'custom';

export type CaseInputMethod = 'upload' | 'pickup' | 'shipping';

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
  address?: string;
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
  teeth_numbers?: string[];
  additional_info?: string;
  stl_links?: { name: string; url: string; size?: string }[];
  submitted_date?: string;
  unn?: string;
  n8n_failed?: boolean;
  threeShapeId?: string;
  prep_type?: PrepType;
  what_needed?: WhatNeeded;
  input_method?: CaseInputMethod;
  recipient_id?: string;
  recipient_email?: string;
  price?: number;
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

export interface Partnership {
  id: string;
  labId: string;
  userId: string;
  status: string;
  agreementAccepted: boolean;
  dentistName?: string;
  dentistEmail?: string;
  officeName?: string;
  createdAt?: string;
}

export interface Service {
  id: string;
  lab_id: string;
  name: string;
  description?: string;
  base_price: number;
  category: string;
  created_at?: string;
}
