import "./styles.css";
import { memo } from "preact/compat";
import { useRef, useState, useMemo, useEffect } from "preact/hooks";
import { useRoute, Link } from "wouter";
import useSendMail from "../../hook/chat/useSendMail";
import useAdminStore from "../../store/adminStore";
import useSocketStore from "../../store/socketStore";
import { Skeleton, Spinner } from "../../component/loader";
import HighlightText from "../../component/highlight";
import { countryFlag } from "../../data/countries";
import { formatDate, formatTime } from "../../util/time";

const isTouch = typeof window !== "undefined" && "ontouchstart" in window;

export default function Chats() {
    const [match, params] = useRoute("/chats/:id");

    const { isMailLoading, sendMail } = useSendMail();

    const admin = useAdminStore((s) => s.admin);
    const socket = useSocketStore((s) => s.socket);
    const chats = useSocketStore((s) => s.chats);
    const chatsLoaded = useSocketStore((s) => s.chatsLoaded);
    const chatLoaded = useSocketStore((s) => s.chatLoaded);
    const messages = useSocketStore((s) => s.messages);
    const visitorStatus = useSocketStore((s) => s.visitorStatus);
    const setChatActive = useSocketStore((s) => s.setChatActive);
    const appendMessage = useSocketStore((s) => s.appendMessage);

    const chatID = match ? params.id : null;
    const chat = useMemo(() => chats.find(c => c.chat_id === chatID), [chats, chatID]);

    const messagesRef = useRef(null);
    const [showGmail, setShowGmail] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [messageInput, setMessageInput] = useState(() => {
        const savedMsg = sessionStorage.getItem(chatID);
        if (!savedMsg) return "";
        sessionStorage.removeItem(chatID);
        return savedMsg;
    });

    const sendMessage = (e) => {
        e.preventDefault();

        const content = messageInput.trim();
        if (!content) return;

        const chatData = {
            chat_id: chatID,
            sender_type: "ADMIN",
            admin_id: admin.id,
            admin_name: admin.name,
            message: content,
            created_at: new Date().toISOString()
        };

        appendMessage(chatData);

        socket.emit("admin:message", {
            chatID,
            message: content
        });

        setMessageInput("");
    }

    const gmailAuth = () => {
        sessionStorage.setItem(chatID, messageInput);
        window.location.href = `${import.meta.env.VITE_SERVER_URL}/chat/google?chatID=${chatID}`;
    };

    const filteredChats = useMemo(() => {
        if (!chats?.length) return [];

        const query = searchValue.toLowerCase();
        if (!query) return chats;

        return chats.filter(c => c.email?.toLowerCase().includes(query));
    }, [chats, searchValue]);

    const datedMessages = useMemo(() => {
        if (!messages.length) return [];

        const groups = {};
        for (const m of messages) {
            const date = formatDate(m.created_at);
            (groups[date] ||= []).push(m);
        }

        return Object.entries(groups);
    }, [messages]);

    useEffect(() => {
        setChatActive(chatID);
    }, [chatID, setChatActive]);

    useEffect(() => {
        const el = messagesRef.current;
        if (!el) return;

        el.scrollTop = el.scrollHeight;
    }, [messages.length]);

    useEffect(() => {
        const t = setTimeout(() => {
            setSearchValue(searchInput);
        }, 250);

        return () => clearTimeout(t);
    }, [searchInput]);

    return (
        <div className={`chat-layout ${chatID ? "messages" : "chats"}`}>
            <div className="chat-sidebar">
                <h3>Chats</h3>

                <div className="search">
                    <form onSubmit={(e) => e.preventDefault()}>
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search email"
                        />
                    </form>
                </div>

                {!chatsLoaded ? (
                    <div className="chat-links">
                        <div className="chat-link">
                            <div><Skeleton /><Skeleton /></div>
                            <div><Skeleton /><Skeleton /></div>
                        </div>
                    </div>
                ) : !filteredChats.length ? (
                    <div className="none"><div />No chats yet...</div>
                ) : (
                    <div className="chat-links">
                        <ChatList
                            chats={filteredChats}
                            search={searchValue}
                            chatID={chatID}
                            visitorStatus={visitorStatus}
                        />
                    </div>
                )}
            </div>

            {chatID && (
                <div className="chat-body">
                    <div className="chat-head">
                        <Link to="/chats"><div /></Link>
                        {chatLoaded === "" ? (
                            <h4><Skeleton /><Skeleton /></h4>
                        ) : chatLoaded === null ? (
                            <h4>
                                Chat not found<br />
                                <span>Go back</span>
                            </h4>
                        ) : chat && (
                            <h4>
                                {countryFlag[chat.country] ?? ""} {chat.email}<br />
                                <span className={visitorStatus[chat.visitor_id] ? "active" : ""}>
                                    {visitorStatus[chat.visitor_id] ? "Online" : "Offline"}
                                </span>
                            </h4>
                        )}
                    </div>

                    {chatLoaded === "" ? (
                        <div className="chat-messages">
                            <div className="dates">
                                <div className="date"><Skeleton /></div>
                                <div className="msg VISITOR"><Skeleton /><Skeleton /></div>
                                <div className="msg ADMIN"><Skeleton /><Skeleton /></div>
                            </div>
                        </div>
                    ) : chatLoaded === null ? (
                        null
                    ) : !messages.length ? (
                        <div className="none"><div />No messages yet...</div>
                    ) : (
                        <div ref={messagesRef} className="chat-messages">
                            <MessageList
                                messages={datedMessages}
                                adminID={admin?.id}
                            />
                        </div>
                    )}

                    {!["", null].includes(chatLoaded) && (
                        <form onSubmit={sendMessage}>
                            <textarea
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder={`Type message${!isTouch ? ` and press "Enter"` : "..."}`}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage(e);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                title="Send message"
                            >
                                <div className="send-icon" />
                            </button>
                            <button
                                disabled={isMailLoading}
                                type="button"
                                onClick={() => sendMail(chat.chat_id, messageInput, setMessageInput, setShowGmail)}
                                title="Send via Gmail"
                            >
                                {isMailLoading ? <Spinner /> : <div className="gmail-icon" />}
                            </button>
                        </form>
                    )}
                </div>
            )}

            {showGmail && (
                <div
                    onClick={() => setShowGmail(false)}
                    className="modal"
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="modal-content"
                    >
                        <div className="modal-head">
                            <p>Connect Gmail</p>
                            <button onClick={() => setShowGmail(false)} />
                        </div>
                        <div className="modal-body">
                            <p>Connect your Gmail to reply to visitors directly via email. TapHTML only use this to send the specific messages you write here. We will <b>never</b> read your inbox or send unauthorized mail from your account.</p>
                            <div className="modal-btns">
                                <button
                                    type="button"
                                    onClick={() => setShowGmail(null)}
                                    className="modal-btn tertiary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    onClick={gmailAuth}
                                    className="modal-btn primary"
                                >
                                    Connect
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const ChatList = memo(({ chats, search, chatID, visitorStatus }) => (
    chats.map((c) => (
        <ChatLink
            key={c.chat_id}
            chat={c}
            search={search}
            isActive={chatID === c.chat_id}
            isOnline={!!visitorStatus[c.visitor_id]}
        />
    ))
))

const ChatLink = memo(({ chat, search, isActive, isOnline }) => (
    <Link
        to={`/chats/${chat.chat_id}`}
        className={`chat-link ${isActive ? "active" : ""}`}
    >
        <div>
            <p className={isOnline ? "active" : ""}>
                <HighlightText
                    text={`${countryFlag[chat.country] ?? ""} ${chat.email}`}
                    query={search}
                />
            </p>
            {chat.created_at && <span>{formatDate(chat.created_at)}</span>}
        </div>
        <div>
            {chat.unread > 0 ? (
                <span className="active">
                    {chat.unread} Unread {chat.unread === 1 ? "Message" : "Messages"}
                </span>
            ) : (
                <span className={!chat.message || chat.message === "New Chat Request" ? "active" : ""}>
                    {chat.message || "New Chat Request"}
                </span>
            )}
            {chat.created_at && <span>{formatTime(chat.created_at)}</span>}
        </div>
    </Link>
))

const MessageList = memo(({ messages, adminID }) => (
    messages.map(([date, msgs]) => (
        <div key={date} className="dates">
            <p className="date">{date}</p>

            {msgs.map((m, i) => (
                <div key={i} className={`msg ${m.sender_type}`}>
                    <p>{m.message}</p>
                    <p>
                        {m.sender_type === "ADMIN" && (
                            m.admin_id === adminID
                                ? <>You<span /></>
                                : <>{m.admin_name}<span /></>
                        )}
                        {formatTime(m.created_at)}
                    </p>
                </div>
            ))}
        </div>
    ))
))