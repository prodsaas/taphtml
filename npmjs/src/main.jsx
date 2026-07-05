import { render } from "preact";
import Chat from "./chat";
import CSS from "./chat.css?inline";

if (!window.__taphtml) {
    window.__taphtml = true;

    const initWidget = () => {
        const widgetID = document.querySelector("script[data-id]")?.dataset.id;

        let container = document.getElementById("taphtml");
        if (!container) {
            container = document.createElement("div");
            container.id = "taphtml";
            document.body.appendChild(container);
        }

        if (container.__taphtml) return;
        container.__taphtml = true;

        const shadow = container.attachShadow({ mode: "closed" });
        const mountNode = document.createElement("div");

        const style = document.createElement("style");
        style.textContent = CSS;
        shadow.appendChild(style);

        shadow.appendChild(mountNode);

        const serverUrl = import.meta.env.VITE_SERVER_URL;
        render(<Chat widgetID={widgetID} serverUrl={serverUrl} />, mountNode);
    };

    const runWhenIdle = () => {
        if ("requestIdleCallback" in window) requestIdleCallback(() => initWidget(), { timeout: 1500 });
        else setTimeout(initWidget, 100);
    };

    if (document.readyState === "complete") runWhenIdle();
    else window.addEventListener("load", runWhenIdle, { once: true });
}