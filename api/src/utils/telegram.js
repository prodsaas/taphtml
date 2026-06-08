const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;

let offset = 0;

async function pollTelegram() {
    if (!TOKEN) return;

    while (true) {
        let timeoutID;
        try {
            const controller = new AbortController();
            timeoutID = setTimeout(() => controller.abort(), 35000);

            const res = await fetch(
                `${BASE_URL}/getUpdates?timeout=30&offset=${offset}`,
                { signal: controller.signal }
            );

            clearTimeout(timeoutID);

            if (!res.ok) {
                console.error(new Error(`Telegram Error: Server responded with HTTP status ${res.status}`));
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            const data = await res.json();
            if (!data.ok) {
                console.error(new Error(`Telegram Error: ${data.description || "No description provided"}`));
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            for (const update of data.result) {
                offset = update.update_id + 1;

                const msg = update.message;
                if (!msg?.chat?.id) continue;

                const chat_id = msg.chat.id;

                if (msg.text?.startsWith("/start")) {
                    await fetch(`${BASE_URL}/sendMessage`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            chat_id,
                            text: `Chat ID: <code>${chat_id}</code>`,
                            parse_mode: "HTML"
                        })
                    });
                }
            }
        }
        catch (error) {
            clearTimeout(timeoutID);
            console.error("Telegram Error: ", error);
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

module.exports = pollTelegram;