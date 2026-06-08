import { lazy, Suspense } from "preact/compat";
import { useEffect } from "preact/hooks";
import { Switch, Route } from "wouter";
import useFetchSession from "./hook/auth/useFetchSession";
import ToastProvider from "./component/toast";
import Navbar from "./component/navbar";
import Sidebar from "./component/sidebar";
import ProtectedRoute from "./protected";
import { Progress } from "./component/loader";

const Dashboard = lazy(() => import("./page/dashboard"));
const Chats = lazy(() => import("./page/chats"));
const Customize = lazy(() => import("./page/customize"));
const Installation = lazy(() => import("./page/installation"));
const Team = lazy(() => import("./page/team"));
const Settings = lazy(() => import("./page/settings"));
const Auth = lazy(() => import("./page/auth"));
const Login = lazy(() => import("./page/auth/login"));
const Signup = lazy(() => import("./page/auth/signup"));
const Passkey = lazy(() => import("./page/auth/passkey"));
const Forgot = lazy(() => import("./page/auth/forgot"))
const NotFound = lazy(() => import("./page/404"));

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
          <Suspense fallback={<Progress />}>
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
          </Suspense>
        </ProtectedRoute>
      </main>
    </ToastProvider>
  )
}