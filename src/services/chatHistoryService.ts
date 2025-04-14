
export interface ChatItem {
  id: string;
  title: string;
  date: string; // 'Today', 'Yesterday', 'Previous 7 Days'
  messages?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  createdAt: number; // timestamp
}

const STORAGE_KEY = 'shopifyImgWizard_chats';

export const createNewChat = (title = 'New Chat'): ChatItem => {
  const newChat: ChatItem = {
    id: `chat_${Date.now()}`,
    title,
    date: 'Today',
    messages: [],
    createdAt: Date.now()
  };
  
  const chats = getAllChats();
  const updatedChats = [newChat, ...chats];
  saveChats(updatedChats);
  
  return newChat;
};

export const getAllChats = (): ChatItem[] => {
  if (typeof window === 'undefined') return [];
  
  const chatsJson = localStorage.getItem(STORAGE_KEY);
  if (!chatsJson) return [];
  
  try {
    const chats: ChatItem[] = JSON.parse(chatsJson);
    return organizeChatsByDate(chats);
  } catch (e) {
    console.error('Failed to parse chats from localStorage', e);
    return [];
  }
};

export const getChatById = (id: string): ChatItem | undefined => {
  const chats = getAllChats();
  return chats.find(chat => chat.id === id);
};

export const saveChat = (chat: ChatItem): void => {
  const chats = getAllChats();
  const index = chats.findIndex(c => c.id === chat.id);
  
  if (index >= 0) {
    chats[index] = chat;
  } else {
    chats.unshift(chat);
  }
  
  saveChats(chats);
};

export const deleteChat = (id: string): void => {
  const chats = getAllChats();
  const updatedChats = chats.filter(chat => chat.id !== id);
  saveChats(updatedChats);
};

export const clearAllChats = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};

// Helper functions
const saveChats = (chats: ChatItem[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
};

const organizeChatsByDate = (chats: ChatItem[]): ChatItem[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000; // 24 hours in milliseconds
  const lastWeek = today - 86400000 * 7;
  
  return chats.map(chat => {
    const chatDate = new Date(chat.createdAt).getTime();
    
    if (chatDate >= today) {
      return { ...chat, date: 'Today' };
    } else if (chatDate >= yesterday) {
      return { ...chat, date: 'Yesterday' };
    } else if (chatDate >= lastWeek) {
      return { ...chat, date: 'Previous 7 Days' };
    } else {
      return { ...chat, date: 'Older' };
    }
  });
};
