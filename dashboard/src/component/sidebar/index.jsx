import "./styles.css";
import { useLocation, useSearch, Link } from "wouter";
import useLogoutAdmin from "../../hook/auth/useLogoutAdmin";
import useAdminStore from "../../store/adminStore";
import Install from "./install";

const Sidebar = () => {
    const [location, navigate] = useLocation();

    const { logoutAdmin } = useLogoutAdmin();

    const isAuthenticated = useAdminStore((s) => s.isAuthenticated);

    const isAppInstalled = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

    const closeSidebar = () => {
        document.querySelector("aside")?.classList.remove("active");
        document.querySelector(".blur")?.classList.remove("active");
    };

    const handleAuth = () => {
        if (isAuthenticated) logoutAdmin();
        else navigate("/login");
        closeSidebar();
    };

    return (
        <>
            <aside>
                <Link
                    to="/"
                    onClick={closeSidebar}
                    className="logo"
                >
                    <div />
                    <p>Tap<span>HTML</span></p>
                </Link>

                <div className="links">
                    <ActiveLink
                        to="/"
                        onClick={closeSidebar}
                    >
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21 7V4a1 1 0 0 0-1-1h-5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1M10 20v-3a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /><path d="M9 12H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1m12 8v-7a1 1 0 0 0-1-1h-5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                        Dashboard
                    </ActiveLink>
                    <ActiveLink
                        to="/chats"
                        onClick={closeSidebar}
                    >
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.81 16.23 20 21l-4.95-2.48A9.8 9.8 0 0 1 12 19c-5 0-9-3.58-9-8s4-8 9-8 9 3.58 9 8a7.5 7.5 0 0 1-2.19 5.23" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                        Chats
                    </ActiveLink>
                    <ActiveLink
                        to="/customize"
                        onClick={closeSidebar}
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.48 18.537H21M4.68 12 3 12.044M4.68 12a2.4 2.4 0 1 0 4.8 0 2.4 2.4 0 0 0-4.8 0Zm5.489.044H21m-8.199-6.493H3m18 0h-2.52M3 18.537h9.801m5.079.063a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0Zm0-13.2a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        Customize
                    </ActiveLink>
                    <ActiveLink
                        to="/install"
                        onClick={closeSidebar}
                    >
                        <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M9.424 2.02a.75.75 0 0 0-.904.556l-2.5 10.5a.75.75 0 0 0 1.46.348l2.5-10.5a.75.75 0 0 0-.556-.904M11.2 4.24a.75.75 0 0 1 1.06-.04l3.5 3.25a.75.75 0 0 1 0 1.1l-3.5 3.25a.75.75 0 1 1-1.02-1.1L14.148 8 11.24 5.3a.75.75 0 0 1-.04-1.06M4.76 5.3a.75.75 0 0 0-1.02-1.1L.24 7.45a.75.75 0 0 0 0 1.1l3.5 3.25a.75.75 0 1 0 1.02-1.1L1.852 8z" /></svg>
                        Installation
                    </ActiveLink>
                    <ActiveLink
                        to="/team"
                        onClick={closeSidebar}
                    >
                        <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M5 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2m1-17.87a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85" /></svg>
                        Team
                    </ActiveLink>
                    <ActiveLink
                        to="/settings"
                        onClick={closeSidebar}
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19.9 12.66a1 1 0 0 1 0-1.32l1.28-1.44a1 1 0 0 0 .12-1.17l-2-3.46a1 1 0 0 0-1.07-.48l-1.88.38a1 1 0 0 1-1.15-.66l-.61-1.83a1 1 0 0 0-.95-.68h-4a1 1 0 0 0-1 .68l-.56 1.83a1 1 0 0 1-1.15.66L5 4.79a1 1 0 0 0-1 .48L2 8.73a1 1 0 0 0 .1 1.17l1.27 1.44a1 1 0 0 1 0 1.32L2.1 14.1a1 1 0 0 0-.1 1.17l2 3.46a1 1 0 0 0 1.07.48l1.88-.38a1 1 0 0 1 1.15.66l.61 1.83a1 1 0 0 0 1 .68h4a1 1 0 0 0 .95-.68l.61-1.83a1 1 0 0 1 1.15-.66l1.88.38a1 1 0 0 0 1.07-.48l2-3.46a1 1 0 0 0-.12-1.17ZM18.41 14l.8.9-1.28 2.22-1.18-.24a3 3 0 0 0-3.45 2L12.92 20h-2.56L10 18.86a3 3 0 0 0-3.45-2l-1.18.24-1.3-2.21.8-.9a3 3 0 0 0 0-4l-.8-.9 1.28-2.2 1.18.24a3 3 0 0 0 3.45-2L10.36 4h2.56l.38 1.14a3 3 0 0 0 3.45 2l1.18-.24 1.28 2.22-.8.9a3 3 0 0 0 0 3.98m-6.77-6a4 4 0 1 0 4 4 4 4 0 0 0-4-4m0 6a2 2 0 1 1 2-2 2 2 0 0 1-2 2" /></svg>
                        <span>Settings</span>
                    </ActiveLink>
                    <button onClick={handleAuth}>
                        {isAuthenticated ? (
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8m4-9-4-4m4 4-4 4m4-4H9" /></svg>
                        ) : (
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9m6-9-4-4m4 4-4 4m4-4H5" /></svg>
                        )}
                        Log{isAuthenticated ? "out" : "in"}
                    </button>
                    <hr />
                    <a
                        onClick={closeSidebar}
                        href="https://github.com/prodsaas/taphtml"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M6.89001 9C7.87001 9.49 8.71001 10.23 9.32001 11.15C9.67001 11.67 9.67001 12.34 9.32001 12.86C8.71001 13.77 7.87001 14.51 6.89001 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M13 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <span>Contribute</span>
                    </a>
                    {!isAppInstalled && (
                        <ActiveLink
                            to={`${location}?app=true`}
                            onClick={closeSidebar}
                        >
                            <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" fill="currentColor" stroke="currentColor" strokeWidth="8"><path d="M224,74H206V64a22,22,0,0,0-22-22H40A22,22,0,0,0,18,64v96a22,22,0,0,0,22,22H154v10a22,22,0,0,0,22,22h48a22,22,0,0,0,22-22V96A22,22,0,0,0,224,74ZM40,170a10,10,0,0,1-10-10V64A10,10,0,0,1,40,54H184a10,10,0,0,1,10,10V74H176a22,22,0,0,0-22,22v74Zm194,22a10,10,0,0,1-10,10H176a10,10,0,0,1-10-10V96a10,10,0,0,1,10-10h48a10,10,0,0,1,10,10ZM134,208a6,6,0,0,1-6,6H88a6,6,0,0,1,0-12h40A6,6,0,0,1,134,208Z" /></svg>
                            <span>Install App</span>
                        </ActiveLink>
                    )}
                </div>
            </aside>

            <div
                onClick={closeSidebar}
                className="blur"
            />

            <Install />
        </>
    )
}

const ActiveLink = ({ to, onClick, children }) => {
    const [location] = useLocation();
    const searchString = useSearch();

    const currentPath = to.includes("?") ? `${location}?${searchString}` : location;

    return (
        <Link
            to={to}
            onClick={onClick}
            className={currentPath === to ? "active" : ""}
        >
            {children}
        </Link>
    )
}

export default Sidebar