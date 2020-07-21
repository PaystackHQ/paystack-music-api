const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const url = process.env.DB_URI

mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection
db.on('open', () => {
    console.log('Database Connected');
})
  .on('error', (err) => {
    console.log(`Connection error: ${err.message}`);
});
