const cache = {};

function set(key, value, ttlInSeconds) {
    const expiresAt = Date.now() + ttlInSeconds * 1000;
    cache[key] = { value, expiresAt };
}

function get(key) {
    const item = cache[key];
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
        delete cache[key]; // expired
        return null;
    }
    return item.value;
}

module.exports = { set, get };
