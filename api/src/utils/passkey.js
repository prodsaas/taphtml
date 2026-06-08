exports.bufferToBase64 = (buffer) => {
    return Buffer.from(buffer).toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
};

exports.base64ToBuffer = (base64) => {
    const b = base64.replace(/-/g, "+").replace(/_/g, "/");
    const nodeBuffer = Buffer.from(b, "base64");
    return nodeBuffer.buffer.slice(
        nodeBuffer.byteOffset,
        nodeBuffer.byteOffset + nodeBuffer.byteLength
    );
};