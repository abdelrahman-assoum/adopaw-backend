// This wraps your existing config/db.js so streams & sockets can use the native DB.
const { MongoClient, ObjectId } = require('mongodb');

// If you already export a native client in config/db.js, you can wire to it here instead.
let client;
async function getClient() {
  if (!client) client = new MongoClient(process.env.MONGODB_URI);
  if (!client.topology || !client.topology.isConnected()) await client.connect();
  return client;
}

module.exports.getDb = async function getDb() {
  const c = await getClient();
  return c.db(process.env.DB_NAME || 'adopaw');
};
module.exports.oid = (s) => new ObjectId(String(s));
