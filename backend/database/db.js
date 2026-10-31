// ============================================
// FATA University Hostel - Database Connection
// (replaces api/db.php - MySQLi -> MongoDB / Mongoose)
// ============================================
const mongoose = require('mongoose');

// Cache the connection so serverless platforms (Vercel) reuse it between invocations
let cached = global.__mongooseConn;
if (!cached) cached = global.__mongooseConn = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined. Add it to your .env file.');
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000 })
      .then(m => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}

module.exports = connectDB;
