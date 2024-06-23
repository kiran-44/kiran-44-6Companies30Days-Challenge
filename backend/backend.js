const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Hard-coded credentials for login
const credentials = {
  bus1: '1234',
  bus2: '9876'
};

// POST endpoint for user login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if the username exists and the password matches
  if (credentials[username] && credentials[username] === password) {
    res.send(username);
  } else {
    res.status(401).send('Invalid username or password');
  }
});

// MongoDB connection URL and Database Name
const username = encodeURIComponent('sai_75');
const password = encodeURIComponent('sai@2003');
const clusterUrl = 'cluster0.9tk5c2e.mongodb.net';
const dbName = 'geolocationDB';
const url = `mongodb+srv://${username}:${password}@${clusterUrl}/?retryWrites=true&w=majority`;

let db;

// Function to connect to MongoDB
const connectToMongoDB = async () => {
  try {
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
};

// Connect to MongoDB and then start the server
connectToMongoDB().then(() => {
  // Define routes after MongoDB connection is established
  app.post('/coords', (req, res) => {
    const { lat, long } = req.body;

    if (typeof lat !== 'number' || typeof long !== 'number') {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const collection = db.collection('coordinates');

    collection.updateOne(
      {}, // filter criteria to find the document
      { $set: { lat, long } }, // update operation
      { upsert: true }, // options
      (err, result) => {
        if (err) {
          console.error('Error updating/inserting document', err);
          return res.status(500).json({ error: 'Failed to store data in MongoDB' });
        }

        res.status(200).json({ message: 'Data stored successfully in MongoDB', result });
      }
    );
  });

  // Get route to fetch coordinates
  app.get('/coords', async (req, res) => {
    try {
      const collection = db.collection('coordinates');
      const coords = await collection.findOne({});

      res.json(coords);
    } catch (error) {
      console.error('Error in fetching coordinates', error);
      res.status(500).json({ error: 'Failed to fetch data from MongoDB' });
    }
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});

