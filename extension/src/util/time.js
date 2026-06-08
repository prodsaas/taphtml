export function formatDate(isoString) {
    const date = new Date(isoString);
    const today = new Date();

    const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

    if (isToday) return "Today";

    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
}

export function formatTime(isoString) {
    const date = new Date(isoString);

    return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "numeric",
        hour12: true
    });
}