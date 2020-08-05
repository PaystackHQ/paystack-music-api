const mongoose = require('mongoose');
const { db: { uri: databaseURI } } = require('./config');

mongoose.connect(databaseURI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('open', () => {
  console.log('Database Connected');
})
  .on('error', (err) => {
    console.log(`Connection error: ${err.message}`);
  });
