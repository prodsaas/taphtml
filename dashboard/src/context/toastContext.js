import { createContext } from "preact";
import { useContext } from "preact/hooks";

export const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);