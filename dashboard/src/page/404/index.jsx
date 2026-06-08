import "./styles.css";
import { Link } from "wouter";

export default function NotFound() {
    return (
        <div className="layout">
            <div className="lost">
                <p>Page Not Found</p>
                <Link to="/">Return home</Link>
            </div>
        </div>
    )
}