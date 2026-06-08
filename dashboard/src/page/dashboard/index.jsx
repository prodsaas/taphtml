import "./styles.css";
import { useState, useMemo, useEffect } from "preact/hooks";
import useFetchDashboard from "../../hook/dashboard/useFetchDashboard";
import useAdminStore from "../../store/adminStore";
import { countryFlag, countryName } from "../../data/countries";
import { Skeleton } from "../../component/loader";

export default function Dashboard() {
    const { fetchDashboard } = useFetchDashboard();

    const dashboard = useAdminStore((s) => s.dashboard);
    const isDashboardLoading = useAdminStore((s) => s.isDashboardLoading);

    const chats = dashboard?.chats;
    const heatmapData = chats?.heatmap;

    const chatChartData = useMemo(() => {
        if (chats?.week?.length) return chats.week;
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return { day: d.toISOString().split("T")[0], count: 0 };
        });
    }, [chats]);

    const chatMaxCount = useMemo(() => {
        return Math.max(...chatChartData.map((w) => Number(w.count) || 0), 1);
    }, [chatChartData]);

    const heatmapSVG = useMemo(() => {
        if (!heatmapData?.length) return { path: "", pts: [] };

        const max = Math.max(...heatmapData.map(h => Number(h.count)), 1);
        const len = heatmapData.length;

        const pts = heatmapData.map((h, i) => ({
            x: ((i + 0.5) / len) * 100,
            y: 100 - (Number(h.count) / max * 85),
            count: Number(h.count)
        }));

        let d = `M 0,${pts[0].y} L ${pts[0].x},${pts[0].y}`;

        for (let i = 0; i < pts.length - 1; i++) {
            const curr = pts[i], next = pts[i + 1];
            const midX = (curr.x + next.x) / 2;
            d += ` C ${midX},${curr.y} ${midX},${next.y} ${next.x},${next.y}`;
        }

        d += ` L 100,${pts[pts.length - 1].y}`;

        return { path: d, pts };
    }, [heatmapData]);

    useEffect(() => {
        if (!dashboard) fetchDashboard();
    }, [dashboard, fetchDashboard]);

    return (
        <div className="layout">
            <h3>Dashboard</h3>

            <div className="dashboard">
                <div className="dashboard-card count-card">
                    <div className="count-box">
                        <span className="count-title">Total Chats</span>
                        <span className="count-val">
                            {isDashboardLoading ? <Skeleton /> : chats?.total || 0}
                        </span>
                    </div>
                    <div className="count-box">
                        <span className="count-title">Today</span>
                        <span className="count-val">
                            {isDashboardLoading ? <Skeleton /> : chats?.today || 0}
                        </span>
                    </div>
                    <div className="count-box">
                        <span className="count-title">Active (24h)</span>
                        <span className="count-val">
                            {isDashboardLoading ? <Skeleton /> : chats?.active || 0}
                        </span>
                    </div>
                </div>

                <div className="dashboard-card traffic-card">
                    <div className="card-title">Traffic (Past 7 days)</div>
                    <div className="traffic-box">
                        {isDashboardLoading ? (
                            <>
                                <div className="traffic-col"><Skeleton /><Skeleton /></div>
                                <div className="traffic-col"><Skeleton /><Skeleton /></div>
                                <div className="traffic-col"><Skeleton /><Skeleton /></div>
                                <div className="traffic-col"><Skeleton /><Skeleton /></div>
                                <div className="traffic-col"><Skeleton /><Skeleton /></div>
                                <div className="traffic-col"><Skeleton /><Skeleton /></div>
                                <div className="traffic-col"><Skeleton /><Skeleton /></div>
                            </>
                        ) : chatChartData.map((d) => {
                            const val = Number(d.count) || 0;
                            const h = (val / chatMaxCount) * 100;
                            return (
                                <div key={d.day} className="traffic-col">
                                    <div className="traffic-bar">
                                        <div
                                            className="traffic-val"
                                            style={{ height: `${val > 0 ? Math.max(h, 4) : 0}%` }}
                                        >
                                            {val > 0 && <div className="bar-hint">{val} {val === 1 ? "chat" : "chats"}</div>}
                                        </div>
                                    </div>
                                    <span className="traffic-date">
                                        {new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(d.day))}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="dashboard-card country-card">
                    <div className="card-title">Top Countries</div>
                    <div className="country-box">
                        {isDashboardLoading ? (
                            <div className="country-item"><Skeleton /><Skeleton /></div>
                        ) : !chats?.country?.length ? (
                            <div className="country-empty">No location data</div>
                        ) : chats.country.map((c) => (
                            <div className="country-item" key={c.country}>
                                <div className="country-info">
                                    <span className="country-flag">{countryFlag[c.country] ?? "🏳️"}</span>
                                    <span className="country-name">{countryName.of(c.country) || c.country}</span>
                                </div>
                                <span className="country-val">{c.total}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dashboard-card peak-card">
                    <div className="card-title">Peak Hours</div>
                    {isDashboardLoading ? <Skeleton /> : (
                        <div className="peak-box">
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d={heatmapSVG.path} fill="none" stroke="var(--secondary-color)" strokeWidth="2" strokeLinecap="round" /></svg>
                            <div className="peak-overlay">
                                {heatmapData?.map((h, i) => {
                                    const dotY = heatmapSVG.pts[i]?.y || 0;
                                    return (
                                        <div key={i} className="peak-col">
                                            <div className="peak-dot" style={{ top: `${dotY}%` }} />
                                            <div className="bar-hint" style={{ top: `${dotY}%` }}>
                                                {Number(h.count) > 0 && <p>{h.count} {Number(h.count) === 1 ? "message" : "messages"}</p>}
                                                <p>{h.hour % 12 || 12} {h.hour >= 12 ? "PM" : "AM"} - {(h.hour + 1) % 12 || 12} {(h.hour + 1) % 24 >= 12 ? "PM" : "AM"}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    <div className="peak-time">
                        {["12 AM", "6 AM", "12 PM", "6 PM", "12 AM"].map((l, i) => <span key={i}>{l}</span>)}
                    </div>
                </div>
            </div>
        </div>
    )
}