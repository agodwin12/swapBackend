const Redis = require("ioredis");

const redis = new Redis({
    host: "127.0.0.1",
    port: 6379, // default
    // password: "your-password" // if secured
});

module.exports = redis;
