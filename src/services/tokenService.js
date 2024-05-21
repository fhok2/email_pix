const NodeCache = require("node-cache");
const pegarToken = require("./pegarToken");

const tokenCache = new NodeCache({ stdTTL: 3000 }); // TTL de 50 minutos

async function getToken() {
  let token = tokenCache.get("sessionToken");
  
  if (!token) {
    token = await pegarToken();
    tokenCache.set("sessionToken", token);
  }

  return token;
}

module.exports = getToken;
