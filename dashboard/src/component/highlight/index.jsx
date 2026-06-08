import { memo } from "preact/compat";

const HighlightText = ({ text = "", query = "" }) => {
    if (!query || !text) return text;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "ig");
    const parts = text.split(regex);

    return parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? <mark key={index}>{part}</mark> : part
    )
}

export default memo(HighlightText);