// utils/cache.js
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 30, checkperiod: 60 }); // TTL: 30 seconds

module.exports = cache;
