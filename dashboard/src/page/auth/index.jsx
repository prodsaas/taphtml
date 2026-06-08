import "./styles.css";
import { useLocation } from "wouter";

export default function Auth({ authMap }) {
    const [location] = useLocation();
    const Component = authMap[location.slice(1)] || null;

    return (
        <div className="layout">
            <div className="auth">{Component && <Component />}</div>
        </div>
    )
}