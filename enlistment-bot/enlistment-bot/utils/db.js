const { MongoClient } = require('mongodb');

const uri    = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db = null;

async function connect() {
  if (db) return db;
  await client.connect();
  db = client.db('enlistment_bot');
  console.log('✅  Connected to MongoDB Atlas');
  return db;
}

async function getCollection(name) {
  const database = await connect();
  return database.collection(name);
}

module.exports = { connect, getCollection };
