import "./styles.css";
import { Link } from "wouter";

const Navbar = () => {
    const openSidebar = () => {
        document.querySelector("aside")?.classList.add("active");
        document.querySelector(".blur")?.classList.add("active");
    };

    return (
        <header>
            <Link
                to="/"
                className="logo"
            >
                <div />
            </Link>
            <button onClick={openSidebar}>
                <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
                Menu
            </button>
        </header>
    )
}

export default Navbar