import "./styles.css";
import { useToast } from "../../context/toastContext";
import useAdminStore from "../../store/adminStore";

export default function Installation() {
    const { toast } = useToast();

    const widget = useAdminStore((s) => s.widget);

    const handleCopy = () => {
        const code = `<script async type="module" src="${import.meta.env.VITE_WIDGET_URL}" data-id="${widget?.id}"></script>`;
        navigator.clipboard.writeText(code);
        toast.success("Script copied to clipboard");
    };

    return (
        <div className="layout">
            <h3>Installation</h3>

            <div className="install">
                <div>
                    <p>1. Copy the script shown below.</p>
                    <div className="code">
                        <pre className="code-box">
                            <code><span className="symbol-1">&lt;</span><span className="color-1">script</span><br />    <span className="color-2">async</span><br />    <span className="color-2">type</span><span className="symbol-2">=</span><span className="symbol-3">"</span><span className="color-3">module</span><span className="symbol-3">"</span><br />    <span className="color-2">src</span><span className="symbol-2">=</span><span className="symbol-3">"<span className="color-3 link">{import.meta.env.VITE_WIDGET_URL}</span>"</span><br />    <span className="color-2">data-id</span><span className="symbol-2">=</span><span className="symbol-3">"<span className="color-3">{widget?.id}</span>"</span><br /><span className="symbol-1">&gt;</span><span className="symbol-1">&lt;/</span><span className="color-1">script</span><span className="symbol-1">&gt;</span></code>
                        </pre>
                        <button
                            onClick={handleCopy}
                            className="copy-btn"
                        >
                            Copy
                        </button>
                    </div>
                </div>

                <div>
                    <p>2. Paste the copied script inside the <span className="symbol-1">&lt;</span><span>head</span><span className="symbol-1">&gt;</span> or <span className="symbol-1">&lt;</span><span>body</span><span className="symbol-1">&gt;</span> of your website.</p>
                    <div className="codes">
                        <pre className="code-box">
                            <code>
                                <span className="symbol-1">&lt;</span><span className="symbol-1">!</span><span className="color-1">DOCTYPE</span> <span className="color-2">html</span><span className="symbol-1">&gt;</span><br />
                                <span className="symbol-1">&lt;</span><span className="color-1">html</span> <span className="color-2">lang</span><span className="symbol-2">=</span><span className="symbol-3"><span className="color-3">"en"</span></span><span className="symbol-1">&gt;</span><br />
                                <br />
                                <span className="symbol-1">&lt;</span><span className="color-1">head</span><span className="symbol-1">&gt;</span><br />
                                {`    `}<span className="comment">&lt;!-- TapHTML script inside {`<head>`} --&gt;</span><br />
                                {`    `}<span className="symbol-1">&lt;</span><span className="color-1">script</span><br />        <span className="color-2">async</span><br />        <span className="color-2">type</span><span className="symbol-2">=</span><span className="symbol-3">"</span><span className="color-3">module</span><span className="symbol-3">"</span><br />        <span className="color-2">src</span><span className="symbol-2">=</span><span className="symbol-3">"<span className="color-3 link">{import.meta.env.VITE_WIDGET_URL}</span>"</span><br />        <span className="color-2">data-id</span><span className="symbol-2">=</span><span className="symbol-3">"<span className="color-3">{widget?.id}</span>"</span><br />    <span className="symbol-1">&gt;</span><span className="symbol-1">&lt;/</span><span className="color-1">script</span><span className="symbol-1">&gt;</span><br />
                                <span className="symbol-1">&lt;/</span><span className="color-1">head</span><span className="symbol-1">&gt;</span><br />
                                <br />
                                <span className="symbol-1">&lt;/</span><span className="color-1">html</span><span className="symbol-1">&gt;</span><br />
                            </code>
                        </pre>
                        <pre className="code-box">
                            <code>
                                <span className="symbol-1">&lt;</span><span className="symbol-1">!</span><span className="color-1">DOCTYPE</span> <span className="color-2">html</span><span className="symbol-1">&gt;</span><br />
                                <span className="symbol-1">&lt;</span><span className="color-1">html</span> <span className="color-2">lang</span><span className="symbol-2">=</span><span className="symbol-3"><span className="color-3">"en"</span></span><span className="symbol-1">&gt;</span><br />
                                <br />
                                <span className="symbol-1">&lt;</span><span className="color-1">body</span><span className="symbol-1">&gt;</span><br />
                                {`    `}<span className="comment">&lt;!-- TapHTML script inside {`<body>`} --&gt;</span><br />
                                {`    `}<span className="symbol-1">&lt;</span><span className="color-1">script</span><br />        <span className="color-2">async</span><br />        <span className="color-2">type</span><span className="symbol-2">=</span><span className="symbol-3">"</span><span className="color-3">module</span><span className="symbol-3">"</span><br />        <span className="color-2">src</span><span className="symbol-2">=</span><span className="symbol-3">"<span className="color-3 link">{import.meta.env.VITE_WIDGET_URL}</span>"</span><br />        <span className="color-2">data-id</span><span className="symbol-2">=</span><span className="symbol-3">"<span className="color-3">{widget?.id}</span>"</span><br />    <span className="symbol-1">&gt;</span><span className="symbol-1">&lt;/</span><span className="color-1">script</span><span className="symbol-1">&gt;</span><br />
                                <span className="symbol-1">&lt;/</span><span className="color-1">body</span><span className="symbol-1">&gt;</span><br />
                                <br />
                                <span className="symbol-1">&lt;/</span><span className="color-1">html</span><span className="symbol-1">&gt;</span><br />
                            </code>
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    )
}