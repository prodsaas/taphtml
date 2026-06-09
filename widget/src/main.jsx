import { render } from "preact";
import CSS from "./chat.css?url";

if (!window.__taphtml) {
  window.__taphtml = true;

  const initWidget = async () => {
    const widgetID =
      document.querySelector("script[data-id]")?.dataset.id
      ?? import.meta.env.VITE_WIDGET_ID;

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

    const [ChatModule] = await Promise.all([
      import("./chat"),
      new Promise((resolve, reject) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = CSS;
        link.onload = resolve;
        link.onerror = reject;
        shadow.appendChild(link);
      })
    ]);

    shadow.appendChild(mountNode);
    render(<ChatModule.default widgetID={widgetID} />, mountNode);
  };

  const runWhenIdle = () => {
    if ("requestIdleCallback" in window) requestIdleCallback(() => initWidget(), { timeout: 1500 });
    else setTimeout(initWidget, 100);
  };

  if (document.readyState === "complete") runWhenIdle();
  else window.addEventListener("load", runWhenIdle, { once: true });
}