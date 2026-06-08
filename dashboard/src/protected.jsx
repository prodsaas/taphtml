import { useLocation, Redirect } from "wouter";
import useAdminStore from "./store/adminStore";
import { Loader } from "./component/loader";

export default function ProtectedRoute({ children, authRoutes }) {
    const [location] = useLocation();
    const query = window.location.search;

    const isAuthenticated = useAdminStore((s) => s.isAuthenticated);
    const isAuthenticating = useAdminStore((s) => s.isAuthenticating);

    const isHomePage = location === "/";
    const isAuthPage = authRoutes.includes(location.slice(1));

    if (isAuthenticating) {
        return <Loader />;
    }
    else if (isAuthenticated && isHomePage) {
        const page = new URLSearchParams(query).get("page");
        if (page) return <Redirect to={page} />;
        return children;
    }
    else if (isAuthenticated && isAuthPage) {
        const redirectTo = sessionStorage.getItem("saveRoute") || "/";
        sessionStorage.removeItem("saveRoute");
        return <Redirect to={redirectTo} />;
    }
    else if (!isAuthenticated && isHomePage) {
        return <Redirect to={`/login${query}`} />;
    }
    else if (!isAuthenticated && !isAuthPage) {
        const route = location + (window.location.hash || "");
        sessionStorage.setItem("saveRoute", route);
        return <Redirect to={`/login${query}`} />;
    }
    else {
        return children;
    }
}