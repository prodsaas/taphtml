import "./styles.css";
import { useRef, useState, useEffect } from "preact/hooks";

export default function ColorPicker({ value = "#4F46E5", onChange }) {
    const lastEmittedValue = useRef(value.toUpperCase());
    const [isOpen, setIsOpen] = useState(false);
    const [hsva, setHsva] = useState(hexToHsva(value));
    const [hexInput, setHexInput] = useState(value.toUpperCase());
    const [alphaInput, setAlphaInput] = useState(Math.round(hsva.a * 100).toString());

    const update = (overrides, isTyping = false) => {
        const nextHsva = { ...hsva, ...overrides };
        const nextHex = hsvaToHex(nextHsva);

        setHsva(nextHsva);
        if (!isTyping) {
            setHexInput(nextHex);
            setAlphaInput(Math.round(nextHsva.a * 100).toString());
        }

        if (onChange && nextHex !== lastEmittedValue.current) {
            lastEmittedValue.current = nextHex;
            onChange(nextHex);
        }
    };

    const handleDrag = (e, callback) => {
        const target = e.currentTarget;
        target.setPointerCapture(e.pointerId);
        const onMove = (move) => {
            const rect = target.getBoundingClientRect();
            callback(move, rect);
        };
        target.addEventListener("pointermove", onMove);
        target.addEventListener("pointerup", () => target.removeEventListener("pointermove", onMove), { once: true });
        onMove(e);
    };

    useEffect(() => {
        const incoming = value.toUpperCase();
        if (incoming !== lastEmittedValue.current) {
            const newHsva = hexToHsva(incoming);
            setHsva(newHsva);
            setHexInput(incoming);
            setAlphaInput(Math.round(newHsva.a * 100).toString());
            lastEmittedValue.current = incoming;
        }
    }, [value]);

    return (
        <div className="picker">
            <button
                type="button"
                className="picker-btn"
                onClick={() => setIsOpen(!isOpen)}
                style={{ backgroundColor: value }}
            />

            {isOpen && (
                <div className="popover">
                    <div
                        className="saturation"
                        style={{ backgroundColor: `hsl(${hsva.h}, 100%, 50%)` }}
                        onPointerDown={(e) => handleDrag(e, (ev, rect) => {
                            const s = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
                            const v = clamp(1 - (ev.clientY - rect.top) / rect.height, 0, 1);
                            update({ s, v });
                        })}
                    >
                        <div style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%` }} />
                    </div>

                    <div className="controls">
                        <div
                            className="slider hue"
                            onPointerDown={(e) => handleDrag(e, (ev, rect) => {
                                const h = clamp(((ev.clientX - rect.left) / rect.width) * 360, 0, 360);
                                update({ h });
                            })}
                        >
                            <div style={{ left: `${(hsva.h / 360) * 100}%` }} />
                        </div>

                        <div
                            className="slider alpha"
                            style={{ "--current-hue": `hsl(${hsva.h}, 100%, 50%)` }}
                            onPointerDown={(e) => handleDrag(e, (ev, rect) => {
                                const a = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
                                update({ a });
                            })}
                        >
                            <div style={{ left: `${hsva.a * 100}%` }} />
                        </div>
                    </div>

                    <div className="picker-inputs">
                        <input
                            className="picker-input hex"
                            value={hexInput}
                            onInput={(e) => {
                                const val = e.target.value.toUpperCase();
                                setHexInput(val);
                                update(hexToHsva(val), true);
                            }}
                            onBlur={() => update({})}
                        />
                        <input
                            className="picker-input alpha"
                            value={alphaInput}
                            onInput={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                setAlphaInput(val);
                                const num = parseInt(val);
                                update({ a: num / 100 }, true);
                            }}
                            onBlur={() => update({})}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

const clamp = (val, min, max) => Math.max(min, Math.min(val, max));

function hexToHsva(hex) {
    let cleanHex = hex.replace("#", "");

    if (cleanHex.length === 3 || cleanHex.length === 4) {
        cleanHex = cleanHex.split("").map(char => char + char).join("");
    }

    const red = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const green = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const blue = parseInt(cleanHex.substring(4, 6), 16) / 255;
    const alpha = cleanHex.length === 8 ? parseInt(cleanHex.substring(6, 8), 16) / 255 : 1;

    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;

    let hue = 0;
    if (delta !== 0) {
        if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0);
        else if (max === green) hue = (blue - red) / delta + 2;
        else hue = (red - green) / delta + 4;
        hue = hue / 6;
    }

    return {
        h: hue * 360,
        s: max === 0 ? 0 : delta / max,
        v: max,
        a: isNaN(alpha) ? 1 : alpha
    };
}

function hsvaToHex({ h, s, v, a }) {
    const hueSection = h / 60;
    const chroma = v * s;
    const x = chroma * (1 - Math.abs((hueSection % 2) - 1));
    const m = v - chroma;

    let red = 0, green = 0, blue = 0;

    if (hueSection >= 0 && hueSection < 1) red = chroma, green = x;
    else if (hueSection >= 1 && hueSection < 2) red = x, green = chroma;
    else if (hueSection >= 2 && hueSection < 3) green = chroma, blue = x;
    else if (hueSection >= 3 && hueSection < 4) green = x, blue = chroma;
    else if (hueSection >= 4 && hueSection < 5) red = x, blue = chroma;
    else red = chroma, blue = x;

    const toHex = (value) => {
        const hex = Math.round((value + m) * 255).toString(16).toUpperCase();
        return hex.padStart(2, "0");
    };

    const alpha = a < 1 ? Math.round(a * 255).toString(16).toUpperCase().padStart(2, "0") : "";

    return `#${toHex(red)}${toHex(green)}${toHex(blue)}${alpha}`;
}