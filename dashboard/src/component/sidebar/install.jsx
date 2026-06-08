import { useState, useEffect } from "preact/hooks";
import { useSearchParams } from "wouter";

const BROWSERS = {
    safari: {
        label: "Safari",
        content: (isMobile) => isMobile ? (
            <ol>
                <li>Click the <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg> icon in the toolbar.</li>
                <li>Scroll down and click <b>Add to Home Screen</b>.</li>
            </ol>
        ) : (
            <ol>
                <li>Click <b>File</b> in the menu bar at the top of your screen.</li>
                <li>Click <b>Add to Dock...</b> to run it as a macOS application.</li>
            </ol>
        )
    },
    chrome: {
        label: "Chrome",
        content: (isMobile) => isMobile ? (
            <ol>
                <li>Click the <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg> icon.</li>
                <li>Click <b>Add to Home screen</b> or <b>Install app</b>.</li>
            </ol>
        ) : (
            <ol>
                <li>Click the <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg> icon in the top right.</li>
                <li>Navigate to <b>Cast, save, and share</b> &rarr; click <b>Install page as app...</b> (or <b>Install TapHTML...</b>).</li>
            </ol>
        )
    },
    firefox: {
        label: "Firefox",
        content: (isMobile) => isMobile ? (
            <ol>
                <li>Click the <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg> icon.</li>
                <li>Click <b>Install</b> or <b>Add to Home screen</b>.</li>
            </ol>
        ) : (
            <p>Firefox Desktop doesn't support web app installation. To run this app on your desktop, please switch to another browser.</p>
        )
    },
    brave: {
        label: "Brave",
        content: (isMobile) => isMobile ? (
            <ol>
                <li>Click the <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg> icon.</li>
                <li>Click <b>Add to Home screen</b>.</li>
            </ol>
        ) : (
            <ol>
                <li>Click the <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg> icon.</li>
                <li>Navigate to <b>Save and share</b> &rarr; click <b>Install TapHTML...</b></li>
            </ol>
        )
    },
    edge: {
        label: "Microsoft Edge",
        content: (isMobile) => isMobile ? (
            <ol>
                <li>Click the <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg> icon at the bottom.</li>
                <li>Scroll down and click <b>Add to phone</b>.</li>
            </ol>
        ) : (
            <ol>
                <li>Click the <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg> icon.</li>
                <li>Navigate to the <b>Apps</b> &rarr; click <b>Install this site as an app</b> (or <b>Install TapHTML...</b>).</li>
            </ol>
        )
    }
};

const detectBrowser = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("edg/")) return "edge";
    if (ua.includes("brave") || navigator.brave) return "brave";
    if (ua.includes("firefox") && !ua.includes("seamonkey")) return "firefox";
    if (ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium")) return "safari";
    if (ua.includes("chrome") && !ua.includes("chromium")) return "chrome";
    return "";
};

const detectMobile = () => {
    const ua = navigator.userAgent.toLowerCase();
    return /mobi|android|iphone|ipad|ipod/.test(ua);
};

const Install = () => {
    const [params, setParams] = useSearchParams();

    const showInstall = params.get("app") === "true";
    const [browser, setBrowser] = useState(detectBrowser);
    const [isMobile] = useState(detectMobile);
    const [canInstall, setCanInstall] = useState(!!window.deferredInstallPrompt);

    const handleInstallClick = async () => {
        const prompt = window.deferredInstallPrompt;
        if (!prompt) return;

        prompt.prompt();

        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") {
            window.deferredInstallPrompt = null;
            setParams("");
            setCanInstall(false);
        }
    };

    useEffect(() => {
        const allowInstall = (e) => {
            e.preventDefault();
            window.deferredInstallPrompt = e;
            setCanInstall(true);
        };

        const denyInstall = () => setCanInstall(false);

        window.addEventListener("beforeinstallprompt", allowInstall);
        window.addEventListener("appinstalled", denyInstall);

        return () => {
            window.removeEventListener("beforeinstallprompt", allowInstall);
            window.removeEventListener("appinstalled", denyInstall);
        };
    }, []);

    return showInstall && (
        <div
            onClick={() => setParams("")}
            className="modal"
        >
            <div
                onClick={e => e.stopPropagation()}
                className="modal-content"
            >
                <div className="modal-head">
                    <p>Install App <span>({isMobile ? "Mobile" : "Desktop"})</span></p>
                    <button onClick={() => setParams("")} />
                </div>
                <div className="modal-body">
                    <select
                        value={browser}
                        onChange={e => setBrowser(e.target.value)}
                    >
                        <option value="" disabled>Select your browser</option>
                        {Object.entries(BROWSERS).map(([key, value]) => (
                            <option key={key} value={key}>{value.label}</option>
                        ))}
                    </select>

                    {BROWSERS[browser] && BROWSERS[browser].content(isMobile)}

                    {canInstall && (
                        <div className="modal-btns">
                            <button
                                onClick={handleInstallClick}
                                className="modal-btn primary"
                            >
                                Install App
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Install