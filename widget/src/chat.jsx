import { memo } from "preact/compat";
import { useRef, useState, useMemo, useEffect } from "preact/hooks";
import { io } from "socket.io-client";

const isTouch = typeof window !== "undefined" && "ontouchstart" in window;

export default function Chat({ widgetID }) {
  const socketRef = useRef(null);
  const widgetRef = useRef(null);
  const messagesRef = useRef(null);

  const [ui, setUI] = useState("closed");
  const [widget, setWidget] = useState(null);
  const [chatID, setChatID] = useState(null);
  const [mode, setMode] = useState("email");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [online, setOnline] = useState(false);

  const sendMessage = (e) => {
    e.preventDefault();

    const content = input.trim();
    if (!content) return;

    if (mode === "email") {
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(content)) return;

      setMessages(prev => [...prev, {
        sender_type: "VISITOR",
        message: content,
        created_at: new Date().toISOString()
      }]);

      socketRef.current?.emit("visitor:email", { email: content });
    }
    else if (mode === "message") {
      setMessages(prev => [...prev, {
        sender_type: "VISITOR",
        message: content,
        created_at: new Date().toISOString()
      }]);

      socketRef.current?.emit("visitor:message:send", {
        chatID,
        message: content
      });
    }

    setInput("");
  };

  const datedMessages = useMemo(() => {
    if (!messages.length) return [];

    const groups = {};
    for (const m of messages) {
      const date = formatDate(m.created_at);
      (groups[date] ||= []).push(m);
    }

    return Object.entries(groups);
  }, [messages.length]);

  useEffect(() => {
    const storageKey = `taphtml_visitor_id:${widgetID}`;
    const visitorID = localStorage.getItem(storageKey);

    const socket = io(import.meta.env.VITE_SERVER_URL, {
      query: {
        role: "VISITOR",
        widgetID,
        ...(visitorID && visitorID !== "null" && visitorID !== "undefined" && { visitorID }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null
      },
      transports: ["websocket"],
      reconnection: true
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("visitor:init");
    });

    socket.on("visitor:init:response", (data) => {
      localStorage.setItem(storageKey, data?.visitorID);
      setWidget(data?.widget);
      setChatID(data?.chatID);
      setMode(data?.email ? "message" : "email");
      setMessages(data?.messages || []);
    });

    socket.on("visitor:email:response", (data) => {
      localStorage.setItem(storageKey, data.visitorID);
      setChatID(data.chatID);
      setMode("message");
      setMessages(prev => [...prev, {
        sender_type: "ADMIN",
        message: "Thanks! We have received your email. Let us know how we can help.",
        created_at: new Date().toISOString()
      }]);
    });

    socket.on("visitor:message", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on("admin:online", () => {
      setOnline(true);
    });

    socket.on("admin:offline", () => {
      setOnline(false);
    });

    socket.on("widget:update", (widget) => {
      setWidget(widget);
    });

    socket.on("connect_error", (err) => {
      setWidget(null);
      console.error(err?.message || err);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [widgetID]);

  useEffect(() => {
    if (!isTouch) return;

    const el = widgetRef.current;
    const done = (e) => {
      if (e.propertyName === "width" && ui === "hovering") {
        setUI("opened");
      }
    };

    el.addEventListener("transitionend", done);
    return () => el.removeEventListener("transitionend", done);
  }, [ui]);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const handleOpen = () => ui === "closed" && setUI("hovering");
  const handleClose = () => (setUI("closing"), setTimeout(() => setUI("closed"), 600));

  if (!widget) return null;
  return (
    <div
      ref={widgetRef}
      className={`widget ${ui}`}
      tabIndex={ui === "closed" ? "0" : "-1"}
      onMouseEnter={() => ui === "closed" && setUI("hovering")}
      onMouseLeave={() => ui === "hovering" && setUI("closed")}
      onClick={() => {
        if (ui === "opened" || ui === "closing") return;
        isTouch ? handleOpen() : setUI("opened");
      }}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.blur();
            !["opened", "closing"].includes(ui) && setUI("opened");
          }
        }
      }}
      style={{
        "--widget-bg": widget?.widget_bg,
        "--widget-border": widget?.widget_border,
        "--title-color": widget?.title_color,
        "--status-color": widget?.status_color,
        "--arrow-color": widget?.arrow_color,
        "--chat-bg": widget?.chat_bg,
        "--date-color": widget?.date_color,
        "--visitor-bg": widget?.visitor_bg,
        "--visitor-color": widget?.visitor_color,
        "--visitor-shadow": widget?.visitor_shadow,
        "--admin-bg": widget?.admin_bg,
        "--admin-color": widget?.admin_color,
        "--admin-shadow": widget?.admin_shadow,
        "--time-color": widget?.time_color,
        "--input-bg": widget?.input_bg,
        "--input-color": widget?.input_color,
        "--send-bg": widget?.send_bg,
        "--send-color": widget?.send_color,
        "--send-border": widget?.send_border,
        "--send-shadow": widget?.send_shadow
      }}
    >
      <div className="header">
        <div className="logo">
          <img
            src={`${import.meta.env.VITE_SERVER_URL}/${widget?.logo_url}`}
            alt=""
            style={{ display: widget?.logo_url ? "block" : "none" }}
            onError={(e) => (e.currentTarget.style.display = "none")}
            onLoad={(e) => (e.currentTarget.style.display = "block")}
          />
        </div>
        <div className="title">
          <p>
            {ui === "opened"
              ? widget?.open_title ?? "Support"
              : widget?.hover_title ?? "Hello there 👋 Need help?"
            }
          </p>
          <span className={online ? "online" : ""}>
            {online
              ? widget?.online_text ?? "Online"
              : widget?.offline_text ?? "Offline"
            }
          </span>
        </div>
        <button
          className="arrow"
          onClick={() => ui === "opened" ? handleClose() : setUI("opened")}
        >
          <div />
        </button>
      </div>

      <div className="body">
        <div ref={messagesRef} className="messages">
          <MessageList messages={datedMessages} />
        </div>

        <form onSubmit={sendMessage}>
          {mode === "email" ? (
            <input
              type="email"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your email address"
            />
          ) : (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send us message..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
            />
          )}
          <button type="submit"><div /></button>
        </form>
      </div>
    </ div>
  )
}

const MessageList = memo(({ messages }) => (
  messages.map(([date, msgs]) => (
    <div key={date} className="dates">
      <p className="date">{date}</p>

      {msgs.map((m, i) => (
        <div key={i} className={`msg ${m.sender_type}`}>
          <p>{m.message}</p>
          <p>{formatTime(m.created_at)}</p>
        </div>
      ))}
    </div>
  ))
))

function formatDate(isoString) {
  const date = new Date(isoString);
  const today = new Date();

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) return "Today";

  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

function formatTime(isoString) {
  const date = new Date(isoString);

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "numeric",
    hour12: true
  });
}