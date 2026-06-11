import { useEffect } from "preact/hooks";
import { Switch, Route } from "wouter";
import useFetchSession from "./hook/auth/useFetchSession";
import ToastProvider from "./component/toast";
import Navbar from "./component/navbar";
import Sidebar from "./component/sidebar";
import ProtectedRoute from "./protected";
import Dashboard from "./page/dashboard";
import Chats from "./page/chats";
import Customize from "./page/customize";
import Installation from "./page/installation";
import Team from "./page/team";
import Settings from "./page/settings";
import Auth from "./page/auth";
import Login from "./page/auth/login";
import Signup from "./page/auth/signup";
import Passkey from "./page/auth/passkey";
import Forgot from "./page/auth/forgot";
import NotFound from "./page/404";

const AUTH_MAP = { login: Login, signup: Signup, passkey: Passkey, forgot: Forgot };
const AUTH_ROUTES = Object.keys(AUTH_MAP);

export function App() {
  const { fetchSession } = useFetchSession();

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return (
    <ToastProvider>
      <Navbar />
      <Sidebar />
      <main>
        <ProtectedRoute authRoutes={AUTH_ROUTES}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/chats" component={Chats} />
            <Route path="/chats/:id" component={Chats} />
            <Route path="/customize" component={Customize} />
            <Route path="/install" component={Installation} />
            <Route path="/team" component={Team} />
            <Route path="/settings" component={Settings} />
            <Route path={`/(${AUTH_ROUTES.join("|")})`}>
              <Auth authMap={AUTH_MAP} />
            </Route>
            <Route component={NotFound} />
          </Switch>
        </ProtectedRoute>
      </main>
    </ToastProvider>
  )
}