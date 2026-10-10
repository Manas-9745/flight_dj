const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'AeroMate Backend',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`✈️ AeroMate backend running on port ${PORT}`);
});
