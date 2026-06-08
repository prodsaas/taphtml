const webpush = require("web-push");

const { EMAIL_ADDRESS, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
const isPushEnvSet = Boolean(EMAIL_ADDRESS && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (isPushEnvSet) {
    webpush.setVapidDetails(
        `mailto:${EMAIL_ADDRESS}`,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
}

module.exports = { webpush, isPushEnvSet };