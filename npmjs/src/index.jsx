import { h, render } from "preact";
import Chat from "./chat";
import CSS from "./chat.css?inline";

if (typeof window !== "undefined" && !customElements.get("taphtml-chat-widget")) {
    class TapHtmlChatWidget extends HTMLElement {
        static observedAttributes = ["widget-id", "widgetid"];

        get widgetID() {
            return this.getAttribute("widget-id") || this.getAttribute("widgetid");
        }
        set widgetID(val) {
            if (val) this.setAttribute("widget-id", val);
            else this.removeAttribute("widget-id");
        }

        connectedCallback() {
            if (this.shadowRoot) return;

            const shadow = this.attachShadow({ mode: "open" });
            const style = document.createElement("style");
            style.textContent = CSS;
            shadow.appendChild(style);

            this.mountNode = document.createElement("div");
            shadow.appendChild(this.mountNode);

            this.renderWidget();
        }

        attributeChangedCallback() {
            this.renderWidget();
        }

        renderWidget() {
            if (!this.mountNode) return;
            
            const id = this.widgetID;
            if (!id) return;

            const serverUrl = import.meta.env.VITE_SERVER_URL;
            render(h(Chat, { widgetID: id, serverUrl }), this.mountNode);
        }

        disconnectedCallback() {
            if (this.mountNode) render(null, this.mountNode);
        }
    }
    customElements.define("taphtml-chat-widget", TapHtmlChatWidget);
}

/** @type {(props: { widgetID: string }) => any} */
const ChatWidget = "taphtml-chat-widget";

export default ChatWidget;