import "./styles.css";
import { useRef, useState } from "preact/hooks";
import useUploadLogo from "../../hook/widget/useUploadLogo";
import useDeleteLogo from "../../hook/widget/useDeleteLogo";
import useCustomizeWidget from "../../hook/widget/useCustomizeWidget";
import useAdminStore from "../../store/adminStore";
import Widget from "../../component/widget";
import ColorPicker from "../../component/color";
import { Spinner } from "../../component/loader";

export default function Customize() {
    const { isUploading, uploadLogo } = useUploadLogo();
    const { isDeleting, deleteLogo } = useDeleteLogo();
    const { isCustomizing, customizeWidget } = useCustomizeWidget();

    const widget = useAdminStore((s) => s.widget);

    const fileInputRef = useRef(null);
    const [form, setForm] = useState({
        logo_url: widget?.logo_url ?? "",
        widget_bg: widget?.widget_bg ?? "#ffffff",
        widget_border: widget?.widget_border ?? "#e2e8f0",
        title_color: widget?.title_color ?? "#29292f",
        hover_title: widget?.hover_title ?? "Hello there 👋 Need help?",
        open_title: widget?.open_title ?? "Support",
        status_color: widget?.status_color ?? "#40566d",
        online_text: widget?.online_text ?? "Online",
        offline_text: widget?.offline_text ?? "Offline",
        arrow_color: widget?.arrow_color ?? "#6b7280",
        chat_bg: widget?.chat_bg ?? "#f5f5f7",
        date_color: widget?.date_color ?? "#40566d",
        visitor_bg: widget?.visitor_bg ?? "#ffffff",
        visitor_color: widget?.visitor_color ?? "#29292f",
        visitor_shadow: widget?.visitor_shadow ?? "#00000029",
        admin_bg: widget?.admin_bg ?? "#182346",
        admin_color: widget?.admin_color ?? "#ffffff",
        admin_shadow: widget?.admin_shadow ?? "#00000029",
        time_color: widget?.time_color ?? "#40566d",
        input_bg: widget?.input_bg ?? "#ffffff",
        input_color: widget?.input_color ?? "#000000",
        send_bg: widget?.send_bg ?? "#ffffff",
        send_color: widget?.send_color ?? "#182346",
        send_border: widget?.send_border ?? "#dadce0",
        send_shadow: widget?.send_shadow ?? "#00000029"
    });

    const handleUploadLogo = async (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        await uploadLogo(selectedFile, setForm);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemoveLogo = async () => {
        if (!form.logo_url) return;

        await deleteLogo(form.logo_url, setForm);
    };

    return (
        <div className="layout">
            <h3>
                Customize
                <button
                    disabled={isCustomizing}
                    onClick={() => customizeWidget(form)}
                    className="customize-btn"
                >
                    {isCustomizing ? <Spinner /> : "Save Changes"}
                </button>
            </h3>

            <div className="customize">
                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Logo</h4>
                            <p>Upload your widget logo (Max 5MB)</p>
                        </div>
                        <div className="customize-upload">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleUploadLogo}
                                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                            />
                            <button
                                type="button"
                                disabled={isUploading}
                                onClick={() => fileInputRef.current?.click()}
                                className="upload-btn"
                            >
                                {isUploading ? "Uploading..." : "Choose Image"}
                            </button>

                            {form.logo_url && (
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={handleRemoveLogo}
                                    className="delete-btn"
                                >
                                    {isDeleting ? "Removing..." : "Remove Logo"}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="closed"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Widget Background</h4>
                            <p>Pick widget background color</p>
                        </div>
                        <ColorPicker
                            value={form.widget_bg}
                            onChange={(newColor) => setForm({ ...form, widget_bg: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="hovering"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Widget Border</h4>
                            <p>Pick widget border color</p>
                        </div>
                        <ColorPicker
                            value={form.widget_border}
                            onChange={(newColor) => setForm({ ...form, widget_border: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="hovering"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Title Color</h4>
                            <p>Pick widget title color</p>
                        </div>
                        <ColorPicker
                            value={form.title_color}
                            onChange={(newColor) => setForm({ ...form, title_color: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="hovering"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Hover Title</h4>
                            <p>Shown when hovering on widget</p>
                        </div>
                        <input
                            value={form.hover_title}
                            onChange={(e) => setForm({ ...form, hover_title: e.target.value })}
                            placeholder="Hello there 👋 Need help?"
                            className="customize-input"
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="hovering"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Open Title</h4>
                            <p>Shown when widget is opened</p>
                        </div>
                        <input
                            value={form.open_title}
                            onChange={(e) => setForm({ ...form, open_title: e.target.value })}
                            placeholder="Support"
                            className="customize-input"
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Status Color</h4>
                            <p>Pick widget status color</p>
                        </div>
                        <ColorPicker
                            value={form.status_color}
                            onChange={(newColor) => setForm({ ...form, status_color: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="hovering"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Online Text</h4>
                            <p>Shown when support team is online</p>
                        </div>
                        <input
                            value={form.online_text}
                            onChange={(e) => setForm({ ...form, online_text: e.target.value })}
                            placeholder="Online"
                            className="customize-input"
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="hovering"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Offline Text</h4>
                            <p>Shown when support team is offline</p>
                        </div>
                        <input
                            value={form.offline_text}
                            onChange={(e) => setForm({ ...form, offline_text: e.target.value })}
                            placeholder="Offline"
                            className="customize-input"
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="hovering"
                            settings={form}
                            isOnline={false}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Open/Close Button Icon Color</h4>
                            <p>Pick open/close button icon color</p>
                        </div>
                        <ColorPicker
                            value={form.arrow_color}
                            onChange={(newColor) => setForm({ ...form, arrow_color: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="hovering"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Chat Background</h4>
                            <p>Pick chat background color</p>
                        </div>
                        <ColorPicker
                            value={form.chat_bg}
                            onChange={(newColor) => setForm({ ...form, chat_bg: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Date Color</h4>
                            <p>Pick date color</p>
                        </div>
                        <ColorPicker
                            value={form.date_color}
                            onChange={(newColor) => setForm({ ...form, date_color: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Visitor Message Background</h4>
                            <p>Pick visitor message background color</p>
                        </div>
                        <ColorPicker
                            value={form.visitor_bg}
                            onChange={(newColor) => setForm({ ...form, visitor_bg: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Visitor Message Color</h4>
                            <p>Pick visitor message color</p>
                        </div>
                        <ColorPicker
                            value={form.visitor_color}
                            onChange={(newColor) => setForm({ ...form, visitor_color: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Visitor Message Shadow Color</h4>
                            <p>Pick visitor message shadow color</p>
                        </div>
                        <ColorPicker
                            value={form.visitor_shadow}
                            onChange={(newColor) => setForm({ ...form, visitor_shadow: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Admin Message Background</h4>
                            <p>Pick admin message background color</p>
                        </div>
                        <ColorPicker
                            value={form.admin_bg}
                            onChange={(newColor) => setForm({ ...form, admin_bg: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Admin Message Color</h4>
                            <p>Pick admin message color</p>
                        </div>
                        <ColorPicker
                            value={form.admin_color}
                            onChange={(newColor) => setForm({ ...form, admin_color: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Admin Message Shadow Color</h4>
                            <p>Pick admin message shadow color</p>
                        </div>
                        <ColorPicker
                            value={form.admin_shadow}
                            onChange={(newColor) => setForm({ ...form, admin_shadow: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Time Color</h4>
                            <p>Pick time color</p>
                        </div>
                        <ColorPicker
                            value={form.time_color}
                            onChange={(newColor) => setForm({ ...form, time_color: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Input Background</h4>
                            <p>Pick input background color</p>
                        </div>
                        <ColorPicker
                            value={form.input_bg}
                            onChange={(newColor) => setForm({ ...form, input_bg: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Input Color</h4>
                            <p>Pick input color</p>
                        </div>
                        <ColorPicker
                            value={form.input_color}
                            onChange={(newColor) => setForm({ ...form, input_color: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Send Button Background</h4>
                            <p>Pick send button background color</p>
                        </div>
                        <ColorPicker
                            value={form.send_bg}
                            onChange={(newColor) => setForm({ ...form, send_bg: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Send Button Icon Color</h4>
                            <p>Pick send button icon color</p>
                        </div>
                        <ColorPicker
                            value={form.send_color}
                            onChange={(newColor) => setForm({ ...form, send_color: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Send Button Border</h4>
                            <p>Pick send button border color</p>
                        </div>
                        <ColorPicker
                            value={form.send_border}
                            onChange={(newColor) => setForm({ ...form, send_border: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>

                <div className="customize-card">
                    <div className="customize-left">
                        <div>
                            <h4>Send Button Shadow Color</h4>
                            <p>Pick send button shadow color</p>
                        </div>
                        <ColorPicker
                            value={form.send_shadow}
                            onChange={(newColor) => setForm({ ...form, send_shadow: newColor })}
                        />
                    </div>
                    <div className="customize-right">
                        <Widget
                            ui="opened"
                            settings={form}
                        />
                    </div>
                </div>
            </div>
        </div >
    )
}