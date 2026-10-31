import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Mail,
  Search,
  Send,
  X,
} from 'lucide-react';
import {
  type Conversation,
  type Message,
  formatChatTime,
  formatMessageTime,
} from '@/lib/messaging';
import './messages.css';
import { useMessaging } from '@/lib/useMessaging';

type FilterKey = 'All' | 'Unread' | 'Active';

const filters: FilterKey[] = ['All', 'Unread', 'Active'];

type Props = {
  userId: string | undefined;
  onOpenBooking: (bookingRef: string) => void;
  initialConversationId?: string;
  initialDraft?: string;
};

export default function MessagesPage({ userId, onOpenBooking, initialConversationId, initialDraft }: Props) {
  const { conversations, loading, error, getMessages, sendMessage, markRead } = useMessaging(userId);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');
  const [showChatMobile, setShowChatMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const handledInitialChatRef = useRef<string | null>(null);
  const greetingAttemptedRef = useRef<Set<string>>(new Set());

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2400);
  };

  const filteredConversations = useMemo(() => {
    const q = search.toLowerCase();
    return conversations.filter((c) => Boolean(c.last_message && c.last_message.trim())).filter((c) => {
      const matchesSearch = !q ||
        c.professional_name.toLowerCase().includes(q) ||
        c.service_name.toLowerCase().includes(q) ||
        (c.last_message ?? '').toLowerCase().includes(q);
      const matchesFilter =
        filter === 'All' ||
        (filter === 'Unread' && c.unread_count > 0) ||
        (filter === 'Active' && ['Confirmed', 'Pending', 'In Progress'].includes(c.booking_status));
      return matchesSearch && matchesFilter;
    });
  }, [conversations, search, filter]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    if (loading || !initialConversationId || handledInitialChatRef.current === initialConversationId) return;
    if (!conversations.some((c) => c.id === initialConversationId)) return;
    handledInitialChatRef.current = initialConversationId;
    setSelectedId(initialConversationId);
    setInput(initialDraft || '');
    setShowChatMobile(true);
  }, [loading, conversations, initialConversationId, initialDraft]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    let inFlight = false;
    const refreshMessages = async () => {
      if (inFlight || document.visibilityState !== 'visible') return;
      inFlight = true;
      try {
        const msgs = await getMessages(selectedId);
        if (active) setMessages(msgs);
      } finally { inFlight = false; }
    };
    void (async () => {
      let msgs = await getMessages(selectedId);
      if (!active) return;
      // A booking-originated chat sends its first "Hi" only when the thread is genuinely empty.
      if (initialDraft?.trim().toLowerCase() === 'hi') {
        setInput('');
        if (msgs.length === 0 && !greetingAttemptedRef.current.has(selectedId)) {
          greetingAttemptedRef.current.add(selectedId);
          const result = await sendMessage(selectedId, 'Hi');
          if (result.error) showToast(`Could not send greeting: ${result.error}`);
          else msgs = await getMessages(selectedId);
        }
      }
      if (!active) return;
      setMessages(msgs);
      void markRead(selectedId);
      setShowChatMobile(true);
    })();
    const timer = window.setInterval(() => { void refreshMessages(); }, 4000);
    const onVisible = () => { if (document.visibilityState === 'visible') void refreshMessages(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [selectedId, getMessages, markRead, initialDraft, sendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !selectedId || sending) return;
    setSending(true);
    const localMsg: Message = {
      id: 'pending-' + Date.now(),
      conversation_id: selectedId,
      sender: 'customer',
      content: trimmed,
      read_by_customer: true,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, localMsg]);
    setInput('');
    const { error: sendError } = await sendMessage(selectedId, trimmed);
    if (sendError) {
      showToast('Could not send: ' + sendError);
      setMessages((prev) => prev.filter((m) => m.id !== localMsg.id));
    } else {
      const refreshed = await getMessages(selectedId);
      setMessages(refreshed);
      showToast('Message sent.');
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (loading) {
    return <div className="messages-loading">Loading your conversations...</div>;
  }

  return (
    <div className="messages-page">
      <div className="messages-header">
        <div>
          <span className="eyebrow">Inbox</span>
          <h1>Messages</h1>
          <p className="messages-subtitle">Chat with your HomeServe professionals. Messages are saved to your HomeServe database.</p>
        </div>
      </div>

      {error && <div className="messages-error">Could not load messages from the database: {error}</div>}

      <div className={`messages-layout ${showChatMobile && selected ? 'show-chat' : ''}`}>
        <div className="messages-list-column">
          <div className="messages-search-wrap">
            <label className="messages-search">
              <Search size={18} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..." aria-label="Search conversations" />
              {search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}
            </label>
          </div>
          <div className="messages-filters">
            {filters.map((f) => (
              <button key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>

          {filteredConversations.length === 0 ? (
            <div className="messages-empty-list">
              <Mail size={28} />
              <p>No messages yet. Open a booking and choose Contact → Message to start a conversation.</p>
            </div>
          ) : (
            <div className="conversation-list">
              {filteredConversations.map((c) => (
                <ConversationItem
                  key={c.id}
                  conversation={c}
                  active={selectedId === c.id}
                  onClick={() => setSelectedId(c.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="messages-chat-column">
          {selected ? (
            <>
              <div className="chat-header">
                <button className="chat-back" onClick={() => setShowChatMobile(false)} aria-label="Back to conversations"><ArrowLeft size={20} /></button>
                {selected.professional_avatar ? (
                  <img src={selected.professional_avatar} alt={selected.professional_name} className="chat-avatar" />
                ) : (
                  <span className="chat-avatar-fallback">{selected.professional_name[0]}</span>
                )}
                <div className="chat-header-info">
                  <h3>{selected.professional_name}</h3>
                  <p>{selected.service_name} • {selected.category}</p>
                </div>
                {selected.booking_reference && (
                  <button className="chat-booking-link" onClick={() => onOpenBooking(selected.booking_reference ?? '')}>
                    <CalendarDays size={14} /> {selected.booking_reference}
                  </button>
                )}
              </div>

              <div className="chat-messages">
                {messages.map((m) => (
                  <div key={m.id} className={`message-row ${m.sender === 'customer' ? 'sent' : 'received'}`}>
                    <div className="message-bubble">
                      <p>{m.content}</p>
                      <span className="message-time">{formatChatTime(m.created_at)}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-bar" onSubmit={handleSend}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  aria-label="Message input"
                  rows={1}
                  disabled={sending}
                />
                <button type="submit" className="chat-send" disabled={!input.trim() || sending} aria-label="Send message">
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="chat-placeholder">
              <Mail size={40} />
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the list to start chatting with your service professional.</p>
            </div>
          )}
        </div>
      </div>

      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  );
}

function ConversationItem({ conversation, active, onClick }: { conversation: Conversation; active: boolean; onClick: () => void }) {
  return (
    <button className={`conversation-item ${active ? 'selected' : ''}`} onClick={onClick}>
      {conversation.professional_avatar ? (
        <img src={conversation.professional_avatar} alt={conversation.professional_name} className="conv-avatar" />
      ) : (
        <span className="conv-avatar-fallback">{conversation.professional_name[0]}</span>
      )}
      <div className="conv-body">
        <div className="conv-top-row">
          <strong>{conversation.professional_name}</strong>
          <span className="conv-time">{conversation.last_message_at ? formatMessageTime(conversation.last_message_at) : ''}</span>
        </div>
        <div className="conv-service">{conversation.service_name} {conversation.booking_reference && <span className="conv-ref">{conversation.booking_reference}</span>}</div>
        <div className="conv-bottom-row">
          <span className="conv-preview">{conversation.last_message ?? 'No messages yet'}</span>
          {conversation.unread_count > 0 && <span className="conv-unread">{conversation.unread_count}</span>}
        </div>
      </div>
    </button>
  );
}
