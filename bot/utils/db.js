const { MongoClient, ServerApiVersion } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: false,
  },
});

let db = null;

async function connect() {
  if (db) return db;
  await client.connect();
  db = client.db('grenadiers');
  console.log('✅  MongoDB connected');
  return db;
}

async function col(name) {
  const database = await connect();
  return database.collection(name);
}

module.exports = { connect, col };
