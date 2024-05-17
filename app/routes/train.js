const express = require('express');
const { spawn } = require('child_process');
const router = express.Router();

router.post('/api/heroku/train', (req, res) => {
  const process = spawn('python', ['app/scripts/train.py']);

  process.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  process.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  process.on('close', (code) => {
    if (code === 0) {
      res.status(200).json({ message: 'Training started successfully' });
    } else {
      res.status(500).json({ error: `Training failed with code ${code}` });
    }
  });
});

module.exports = router;
