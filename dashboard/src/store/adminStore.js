import { create } from "zustand";
import useSocketStore from "./socketStore";

const useAdminStore = create((set) => ({
    isAuthenticating: true,
    setAuthenticating: (state) => set({ isAuthenticating: state }),

    isAuthenticated: false,
    setAuthenticated: (state) => set({ isAuthenticated: state }),

    admin: null,
    setAdmin: (adminData) => set({ admin: adminData }),

    widget: null,
    setWidget: (widgetData) => set({ widget: widgetData }),

    isDashboardLoading: true,
    setDashboardLoading: (state) => set({ isDashboardLoading: state }),

    dashboard: null,
    setDashboard: (data) => set({ dashboard: data }),

    isTeamLoading: true,
    setTeamLoading: (state) => set({ isTeamLoading: state }),

    teams: null,
    setTeams: (teamsData) => set({ teams: teamsData }),

    isSettingLoading: true,
    setSettingLoading: (state) => set({ isSettingLoading: state }),

    gmail: undefined,
    setGmail: (gmailData) => set({ gmail: gmailData }),

    notifications: null,
    setNotifications: (notificationsData) => set({ notifications: notificationsData }),

    removeSession: () => {
        useSocketStore.getState().disconnectSocket();
        
        set({
            isAuthenticating: false,
            isAuthenticated: false,
            admin: null,
            widget: null,
            dashboard: null,
            teams: null,
            gmail: null,
            notifications: null
        });
    }
}));

export default useAdminStore;