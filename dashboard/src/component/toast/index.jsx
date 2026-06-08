import "./styles.css";
import { useState, useCallback, useMemo, useEffect } from "preact/hooks";
import { ToastContext } from "../../context/toastContext";

export default function ToastProvider({ children }) {
    const [status, setStatus] = useState({ action: "", message: "" });

    const showToast = useCallback((action, message) => {
        setStatus({ action, message });
    }, []);

    const hideToast = useCallback(() => {
        setStatus({ action: "", message: "" });
    }, []);

    const toast = useMemo(
        () => ({
            success: (msg) => showToast("success", msg),
            error: (msg) => showToast("error", msg),
            warn: (msg) => showToast("warn", msg),
            info: (msg) => showToast("info", msg),
            load: (msg) => showToast("load", msg),
            hide: hideToast
        }),
        [showToast, hideToast]
    );

    useEffect(() => {
        if (!status.action || status.action === "load") return;
        const timer = setTimeout(hideToast, 5000);
        return () => clearTimeout(timer);
    }, [status.action, hideToast]);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {status.action && (
                <div className={`toast ${status.action}`} role="alert">
                    {status.message}
                </div>
            )}
        </ToastContext.Provider>
    )
}