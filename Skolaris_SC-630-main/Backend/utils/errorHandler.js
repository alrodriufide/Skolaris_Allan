const handleError = (res, error, message) => {
    console.error(`❌ ${message}:`, error);
    res.status(500).json({ error: message });
};

const handleNotFound = (res, entity) => {
    res.status(404).json({ error: `${entity} no encontrado` });
};

module.exports = { handleError, handleNotFound };