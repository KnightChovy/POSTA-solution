const createBasicAuthHeader = (username, password) => {
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${credentials}`;
};

module.exports = { createBasicAuthHeader }