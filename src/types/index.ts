export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  usn: string;
  branch: string;
  year: string;
  isLeader?: boolean;
}

export interface RegisteredTeam {
  id: string; // e.g. IDN-0104
  teamName: string;
  college: string;
  city: string;
  department: string;
  course: 'B.E / B.Tech' | 'M.Tech' | 'MCA';
  members: TeamMember[];
  primaryTrack: string;
  backupTrack: string;
  ideaTitle: string;
  ideaSummary: string;
  paymentStatus: 'Pending' | 'Verified' | 'Rejected';
  paymentTransactionId: string;
  paymentScreenshotUrl?: string;
  paymentRemarks?: string;
  registeredAt: string;
  checkedIn: boolean;
  checkedInAt?: string;
}

export interface DomainTrack {
  id: string;
  title: string;
  iconName: 'leaf' | 'city' | 'drone' | 'health' | 'iot' | 'lightbulb';
  shortDesc: string;
  fullDesc: string;
  sampleProblems: string[];
  suggestedTools: string[];
  colorTheme: string;
  active: boolean;
}

export interface PrizeItem {
  id: string;
  title: string;
  amount: number;
  perks: string;
  subtitle: string;
  highlight?: boolean;
  iconType: 'trophy' | 'medal' | 'award' | 'star';
}

export interface ScheduleEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  day: 'Day 1 (18 Nov)' | 'Day 2 (19 Nov)';
  category: 'Milestone' | 'Mentoring' | 'Food & Break' | 'Judging' | 'Ceremony';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'Update' | 'Deadline' | 'Result' | 'Urgent';
  pinned: boolean;
  date: string;
  author: string;
}

export interface CoreTeamMember {
  id: string;
  name: string;
  role: string;
  category: 'Faculty' | 'Student Co-ordinator' | 'Contact Helpline';
  phone?: string;
  email?: string;
  showPhonePublicly: boolean;
  order: number;
}

export interface RuleItem {
  id: string;
  category: string;
  title: string;
  details: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface EventConfig {
  eventName: string;
  tagline: string;
  subline: string;
  dates: string;
  dateStart: string; // ISO
  dateEnd: string;
  venue: string;
  format: string;
  teamSize: string;
  entryFee: number;
  prizePoolAmount: number;
  eligibility: string;
  collegeName: string;
  clubName: string;
  registrationOpen: boolean;
  registrationDeadline: string;
  maxTeamsLimit: number;
  upiId: string;
  upiPayeeName: string;
}
