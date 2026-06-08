import { create } from "zustand";
import { io } from "socket.io-client";

const useSocketStore = create((set, get) => ({
    socket: null,
    chats: [],
    chatsLoaded: false,
    chatActive: "",
    chatLoaded: "",
    messages: [],
    visitorStatus: {},

    connectSocket: () => {
        if (get().socket) return;

        const socket = io(import.meta.env.VITE_SERVER_URL, {
            query: { role: "ADMIN" },
            transports: ["websocket"],
            reconnection: true,
            withCredentials: true
        });

        socket.on("connect", () => {
            console.clear();
            socket.emit("admin:chats");
        });

        socket.on("admin:chats:response", (chats) => {
            set({
                chats,
                chatsLoaded: true
            });
        });

        socket.on("admin:chat:response", (response) => {
            if (response.chat) set({ chatLoaded: get().chatActive });
            else set({ chatLoaded: null });
            set({ messages: response.messages });
        });

        socket.on("admin:chat:read", (chatID) => {
            set((state) => ({
                chats: state.chats.map(c => c.chat_id === chatID ? { ...c, unread: 0 } : c)
            }));
        });

        socket.on("admin:message:response", (chatData) => {
            get().appendMessage(chatData);
        });

        socket.on("visitor:online", (visitor_id) => {
            set((state) => ({ visitorStatus: { ...state.visitorStatus, [visitor_id]: true } }));
        });

        socket.on("visitor:offline", (visitor_id) => {
            set((state) => {
                const newStatus = { ...state.visitorStatus };
                delete newStatus[visitor_id];
                return { visitorStatus: newStatus };
            });
        });

        socket.on("disconnect", () => {
            console.error("Server Disconnected");
        });

        socket.on("connect_error", () => {
            console.error("Server Disconnected");
        });

        set({ socket });
    },

    disconnectSocket: () => {
        const socket = get().socket;
        if (socket) socket.disconnect();

        set({
            socket: null,
            chats: [],
            chatsLoaded: false,
            chatActive: "",
            chatLoaded: "",
            messages: [],
            visitorStatus: {}
        });
    },

    setChatActive: (id) => {
        const socket = get().socket;
        if (!socket) return;

        set((state) => ({
            chats: state.chats.map(c => c.chat_id === id ? { ...c, unread: 0 } : c),
            chatActive: id ?? "",
            chatLoaded: "",
            messages: []
        }));

        if (id) {
            socket.emit("admin:chat", id);
        }
    },

    appendMessage: (chatData) => {
        set((state) => {
            const existing = state.chats.find(c => c.chat_id === chatData.chat_id);

            const incrementUnread =
                state.chatActive !== chatData.chat_id &&
                !chatData.is_read &&
                chatData.sender_type === "VISITOR" &&
                chatData.message !== "New Chat Request";

            const chats = [
                {
                    chat_id: chatData.chat_id,
                    visitor_id: chatData.visitor_id ?? existing?.visitor_id,
                    email: chatData.email ?? existing?.email,
                    country: chatData.country ?? existing?.country,
                    message: chatData.message,
                    unread: incrementUnread ? (existing?.unread || 0) + 1 : (existing?.unread || 0),
                    created_at: chatData.created_at
                },
                ...state.chats.filter(c => c.chat_id !== chatData.chat_id)
            ];

            if (state.chatActive !== chatData.chat_id) {
                return { chats };
            }

            const messages = [
                ...state.messages,
                {
                    sender_type: chatData.sender_type,
                    message: chatData.message,
                    created_at: chatData.created_at,
                    ...(chatData.admin_id && { admin_id: chatData.admin_id }),
                    ...(chatData.admin_name && { admin_name: chatData.admin_name })
                }
            ];

            return { chats, messages };
        });
    },
}));

export default useSocketStore;