const mongoose = require('mongoose');

async function connect() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB has been connected successfully');
    console.log('MongoURI:', process.env.MONGO_URI)
  } catch (error) {
    console.log('Connect failed!!!');
  }
}

module.exports = { connect };
