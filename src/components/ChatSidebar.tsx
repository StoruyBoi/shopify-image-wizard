
import React, { useState } from 'react';
import { History, PanelLeft, Settings, LogOut, Crown, Plus, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar
} from './ui/sidebar';

interface ChatHistoryItem {
  id: string;
  title: string;
  date: string;
}

// Group chat history by date
const groupChatsByDate = (chats: ChatHistoryItem[]) => {
  const grouped: Record<string, ChatHistoryItem[]> = {};
  
  chats.forEach(chat => {
    if (!grouped[chat.date]) {
      grouped[chat.date] = [];
    }
    grouped[chat.date].push(chat);
  });
  
  return grouped;
};

const ChatSidebar = () => {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([
    { id: '1', title: 'CORS issue fix', date: 'Today' },
    { id: '2', title: 'cm to feet conversion', date: 'Today' },
    { id: '3', title: 'Shopify SEO Poster Design', date: 'Yesterday' },
    { id: '4', title: 'Claude API Shopify Theme', date: 'Yesterday' },
    { id: '5', title: 'Claude API Integration Fix', date: 'Yesterday' },
    { id: '6', title: 'Remove Git from project', date: 'Yesterday' },
    { id: '7', title: 'Add project to GitHub', date: 'Yesterday' },
    { id: '8', title: 'AI Shopify Code Generator', date: 'Yesterday' },
    { id: '9', title: 'Shopify Code Generator App', date: 'Previous 7 Days' },
    { id: '10', title: 'Shopify Template Banner Design', date: 'Previous 7 Days' },
    { id: '11', title: 'Integral Solving Steps', date: 'Previous 7 Days' },
  ]);

  const groupedChats = groupChatsByDate(chatHistory);
  
  return (
    <>
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-4 left-4 z-50 lg:hidden"
          onClick={() => setOpenMobile(true)}
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      )}
      
      <Sidebar>
        <SidebarHeader className="flex flex-col gap-0 p-0">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">Shopify Wizard</span>
            </div>
            <SidebarTrigger />
          </div>
          
          <div className="p-2">
            <Button variant="outline" className="w-full justify-start gap-2" size="sm">
              <Plus className="h-4 w-4" />
              <span>New chat</span>
            </Button>
          </div>
        </SidebarHeader>
        
        <SidebarContent className="overflow-y-auto pb-20">
          {Object.entries(groupedChats).map(([date, chats]) => (
            <SidebarGroup key={date}>
              <SidebarGroupLabel>{date}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {chats.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton tooltip={chat.title}>
                        <History className="h-4 w-4" />
                        <span>{chat.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        
        <SidebarFooter className="absolute bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur">
          <div className="p-3">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-primary" 
              size="sm"
            >
              <Crown className="h-4 w-4" />
              <span className="font-medium">Upgrade plan</span>
              <span className="text-xs ml-auto opacity-60">More features</span>
            </Button>
            
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>US</AvatarFallback>
                </Avatar>
                <div className="text-sm font-medium">User Account</div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  );
};

export default ChatSidebar;
