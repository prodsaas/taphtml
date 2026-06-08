import { useEffect } from "preact/hooks";
import useAdminStore from "./store/adminStore";
import Chats from "./component/chats";
import Login from "./component/login";
import { Loader } from "./component/loader";

export function App() {
  const isAuthenticating = useAdminStore((s) => s.isAuthenticating);
  const admin = useAdminStore((s) => s.admin);
  const fetchSession = useAdminStore((s) => s.fetchSession);

  useEffect(() => {
    fetchSession();

    window.addEventListener("focus", fetchSession);
    return () => window.removeEventListener("focus", fetchSession);
  }, [fetchSession]);

  return (
    <main>
      {isAuthenticating
        ? <Loader />
        : admin
          ? <Chats />
          : <Login />
      }
    </main>
  )
}