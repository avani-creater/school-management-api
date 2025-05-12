import express from 'express';
import dotenv from 'dotenv';
import db from './db.js';

dotenv.config();

const app = express();
app.use(express.json());

// POST /addSchool
app.post('/addSchool', async (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  if (!name || !address || !latitude || !longitude) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
      [name, address, latitude, longitude]
    );

    res.status(201).json({ message: 'School added successfully!', id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

// GET /listSchools
app.get('/listSchools', async (req, res) => {
  const userLat = parseFloat(req.query.lat);
  const userLng = parseFloat(req.query.lng);

  if (!userLat || !userLng) {
    return res.status(400).json({ error: 'lat and lng query parameters are required.' });
  }

  try {
    const [schools] = await db.execute('SELECT * FROM schools');

    const toRad = deg => deg * Math.PI / 180;
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; 
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const sortedSchools = schools.map(school => {
      const distance = calculateDistance(userLat, userLng, school.latitude, school.longitude);
      return { ...school, distance };
    }).sort((a, b) => a.distance - b.distance);

    res.json(sortedSchools);
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
