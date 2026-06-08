import "./styles.css";
import { useEffect } from "preact/hooks";
import useFetchSetting from "../../hook/setting/useFetchSetting";
import useAdminStore from "../../store/adminStore";
import { Skeleton } from "../../component/loader";
import Account from "./account";
import Gmail from "./gmail";
import Notification from "./notification";
import Delete from "./delete";
import Logout from "./logout";

export default function Settings() {
  const { fetchSetting } = useFetchSetting();

  const gmail = useAdminStore((s) => s.gmail);
  const notifications = useAdminStore((s) => s.notifications);
  const isSettingLoading = useAdminStore((s) => s.isSettingLoading);

  useEffect(() => {
    if (gmail === undefined || !notifications) fetchSetting();
  }, [gmail, notifications, fetchSetting]);

  return (
    <div className="layout" tabIndex="-1">
      <h3>Settings</h3>

      <div className="setting">
        <div className="setting-sidebar">
          <a href="#account">Account</a>
          <a href="#gmail">Gmail</a>
          <a href="#notification">Notification</a>
          <a href="#delete">Delete</a>
          <a href="#logout">Logout</a>
        </div>
        {isSettingLoading ? (
          <div className="setting-body"><div><Skeleton /><Skeleton /><Skeleton /></div></div>
        ) : (
          <div
            ref={(el) => el && window.location.hash && (window.location.hash = `${window.location.hash}`)}
            className="setting-body"
          >
            <Account />
            <Gmail />
            <Notification />
            <Delete />
            <Logout />
          </div>
        )}
      </div>
    </div>
  )
}