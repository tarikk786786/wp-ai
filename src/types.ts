export type Chat = {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  status: 'active' | 'resolved' | 'needs_approval';
  mood?: 'happy' | 'confused' | 'angry' | 'urgent' | 'neutral';
  messages: Message[];
};

export type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'human';
  timestamp: string;
};

export type DashboardStats = {
  totalChats: number;
  autoRepliesSent: number;
  pendingApprovals: number;
  hotLeads: number;
  angryCustomers: number;
  missedChats: number;
  aiConfidenceScore: number;
  whatsappApiStatus: 'online' | 'offline' | 'degraded';
};
