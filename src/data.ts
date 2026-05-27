import { Chat, DashboardStats } from './types';

export const dummyChats: Chat[] = [
  {
    id: 'c1',
    name: 'Rahul Sharma',
    phone: '+91 9876543210',
    lastMessage: 'I need some help with my recent order, it says delivered but I haven\\\'t received it.',
    timestamp: '10:45 AM',
    unread: 2,
    status: 'needs_approval',
    mood: 'angry',
    messages: [
      { id: 'm1', text: 'Hi, I placed an order yesterday.', sender: 'user', timestamp: '10:40 AM' },
      { id: 'm2', text: 'Hello Rahul! I can help you with that. Could you please share your order number?', sender: 'bot', timestamp: '10:41 AM' },
      { id: 'm3', text: 'It is ORD-99283.', sender: 'user', timestamp: '10:42 AM' },
      { id: 'm4', text: 'Let me check that for you. Ah, I see it was marked as delivered today.', sender: 'bot', timestamp: '10:43 AM' },
      { id: 'm5', text: 'I need some help with my recent order, it says delivered but I haven\\\'t received it. This is unacceptable!', sender: 'user', timestamp: '10:45 AM' },
    ],
  },
  {
    id: 'c2',
    name: 'Priya Patel',
    phone: '+91 8765432109',
    lastMessage: 'Thanks yaar, that was super helpful! \uD83D\uDE0A',
    timestamp: '09:30 AM',
    unread: 0,
    status: 'resolved',
    mood: 'happy',
    messages: [
      { id: 'm1', text: 'Hey, do you guys have the new summer collection in stock?', sender: 'user', timestamp: '09:15 AM' },
      { id: 'm2', text: 'Hey Priya! \uD83D\uDC4B Yes, we just launched it yesterday! You can check it out here: link', sender: 'bot', timestamp: '09:16 AM' },
      { id: 'm3', text: 'Awesome, ordering now.', sender: 'user', timestamp: '09:20 AM' },
      { id: 'm4', text: 'Thanks yaar, that was super helpful! \uD83D\uDE0A', sender: 'user', timestamp: '09:30 AM' },
    ],
  },
  {
    id: 'c3',
    name: 'Amit Kumar',
    phone: '+91 7654321098',
    lastMessage: 'Price details for bulk purchase?',
    timestamp: 'Yesterday',
    unread: 1,
    status: 'active',
    mood: 'neutral',
    messages: [
      { id: 'm1', text: 'Hello, looking for B2B rates.', sender: 'user', timestamp: 'Yesterday' },
      { id: 'm2', text: 'Hi Amit, we do offer special rates for bulk orders. What quantity are you looking for?', sender: 'bot', timestamp: 'Yesterday' },
      { id: 'm3', text: 'Price details for bulk purchase?', sender: 'user', timestamp: 'Yesterday' },
    ],
  },
];

export const dummyStats: DashboardStats = {
  totalChats: 1248,
  autoRepliesSent: 8945,
  pendingApprovals: 12,
  hotLeads: 84,
  angryCustomers: 3,
  missedChats: 0,
  aiConfidenceScore: 94.2,
  whatsappApiStatus: 'online',
};
