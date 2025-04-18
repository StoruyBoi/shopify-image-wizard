import React, { useState, useEffect } from 'react';
import { History, PanelLeft, Settings, LogOut, Crown, Plus, X, Trash2, LogIn, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { 
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/use-user';
import { supabase } from '@/lib/supabase';
import UserSettingsMenu from './UserSettingsMenu';

interface ChatHistoryItem {
  id: string;
  title: string;
  date: string;
  content?: string;
}

const ChatSidebar = () => {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isLoggedIn, activeChat, setActiveChat, user } = useUser();

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchChatHistory();
    } else {
      setChatHistory([]);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (activeChat) {
      loadChatDetails(activeChat);
    }
  }, [activeChat]);

  const fetchChatHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('id, title, date')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setChatHistory(data);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatDetails = async (chatId: string) => {
    setIsLoading(true);
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
        
      if (messagesError) throw messagesError;
      
      const { data: imageData, error: imageError } = await supabase
        .from('chat_images')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
        
      if (imageError) throw imageError;
      
      const { data: chatData, error: chatError } = await supabase
        .from('chat_history')
        .select('*')
        .eq('id', chatId)
        .single();
        
      if (chatError) throw chatError;
      
      toast({
        title: 'Chat loaded',
        description: `Loaded: ${chatData.title}`,
      });
      
    } catch (error) {
      console.error('Error loading chat details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveChat(null);
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
  };

  const openDeleteDialog = (event: React.MouseEvent, chatId: string) => {
    event.stopPropagation();
    setChatToDelete(chatId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteChat = async () => {
    if (!chatToDelete) return;
    
    setIsLoading(true);

    try {
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('chat_id', chatToDelete);
      
      if (messagesError) throw messagesError;
      
      const { error: imagesError } = await supabase
        .from('chat_images')
        .delete()
        .eq('chat_id', chatToDelete);
      
      if (imagesError) throw imagesError;
      
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('id', chatToDelete);
      
      if (error) throw error;
      
      if (activeChat === chatToDelete) {
        setActiveChat(null);
      }
      
      setChatHistory(prev => prev.filter(chat => chat.id !== chatToDelete));
      
      toast({
        title: 'Chat deleted',
        description: 'Chat history has been removed',
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete chat',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setChatToDelete(null);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute left-4 top-4 z-40 md:hidden">
            <PanelLeft className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 pt-10 w-[280px]">
          <SidebarContent 
            chatHistory={chatHistory}
            activeChat={activeChat}
            onNewChat={handleNewChat}
            onChatSelect={handleChatSelect}
            onDeleteClick={openDeleteDialog}
            isLoggedIn={isLoggedIn}
            onLoginClick={() => setIsLoginDialogOpen(true)}
            isLoading={isLoading}
          />
          <SheetClose className="absolute right-4 top-4">
            <X className="h-4 w-4" />
          </SheetClose>
        </SheetContent>
      </Sheet>

      <div className="hidden md:flex md:w-[280px] flex-col border-r border-border h-screen sticky top-0">
        <SidebarContent 
          chatHistory={chatHistory}
          activeChat={activeChat}
          onNewChat={handleNewChat}
          onChatSelect={handleChatSelect}
          onDeleteClick={openDeleteDialog}
          isLoggedIn={isLoggedIn}
          onLoginClick={() => setIsLoginDialogOpen(true)}
          isLoading={isLoading}
        />
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteChat}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sign in to access your chats</DialogTitle>
            <DialogDescription>
              Create an account or sign in to save your chat history
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <UserSettingsMenu onClose={() => setIsLoginDialogOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const SidebarContent = ({ 
  chatHistory, 
  activeChat, 
  onNewChat, 
  onChatSelect, 
  onDeleteClick,
  isLoggedIn,
  onLoginClick,
  isLoading
}: { 
  chatHistory: ChatHistoryItem[];
  activeChat: string | null;
  onNewChat: () => void;
  onChatSelect: (chatId: string) => void;
  onDeleteClick: (e: React.MouseEvent, chatId: string) => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  isLoading: boolean;
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-border flex justify-between items-center">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Chat History
        </h3>
        {isLoggedIn ? (
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0"
            onClick={onNewChat}
            disabled={isLoading}
          >
            {isLoading ? 
              <Loader2 className="h-4 w-4 animate-spin" /> : 
              <Plus className="h-4 w-4" />
            }
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3"
            onClick={onLoginClick}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Login
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto py-2">
        {isLoading && chatHistory.length === 0 && (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        
        {isLoggedIn ? (
          chatHistory.length > 0 ? (
            <ul className="space-y-1 px-2">
              {chatHistory.map((chat) => (
                <li 
                  key={chat.id}
                  className={`rounded-md px-3 py-2 cursor-pointer group flex justify-between items-center ${
                    activeChat === chat.id ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                  onClick={() => onChatSelect(chat.id)}
                >
                  <div className="text-sm truncate flex-1">
                    <p className="font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-muted-foreground">{chat.date}</p>
                  </div>
                  <button 
                    className="text-muted-foreground hover:text-destructive p-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => onDeleteClick(e, chat.id)}
                    disabled={isLoading}
                  >
                    {isLoading && activeChat === chat.id ? 
                      <Loader2 className="h-4 w-4 animate-spin" /> : 
                      <Trash2 className="h-4 w-4" />
                    }
                  </button>
                </li>
              ))}
            </ul>
          ) : !isLoading ? (
            <div className="text-center px-4 py-8">
              <p className="text-muted-foreground text-sm mb-4">No chat history yet</p>
              <Button variant="outline" size="sm" onClick={onNewChat}>
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          ) : null
        ) : (
          <div className="text-center px-4 py-8">
            <p className="text-muted-foreground text-sm mb-4">Sign in to view your chat history</p>
            <Button variant="outline" size="sm" onClick={onLoginClick}>
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Button>
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-border p-4 space-y-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start text-primary"
          onClick={onLoginClick}
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to Pro
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;
