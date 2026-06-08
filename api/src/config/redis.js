const redis = require("redis");

const client = redis.createClient(
    process.env.REDIS_URL ? {
        url: process.env.REDIS_URL
    } : {
        socket: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        }
    }
);

const connectRedis = async () => {
    try {
        await client.connect();
        console.log("Redis connected");
    }
    catch (error) {
        throw new Error(`Redis Error: ${error.message}`);
    }
};

module.exports = { client, connectRedis };