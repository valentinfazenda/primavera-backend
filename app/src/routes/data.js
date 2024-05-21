const express = require('express');
const axios = require('axios');
const { spawn } = require('child_process');
const authenticateToken = require('../middlewares/auth');
const Symbol = require('../models/Data_Crypto');
const { download_crypto_data } = require('../functions/download_crypto_data');
const router = express.Router();

router.post('/train', authenticateToken, (req, res) => {
  const process = spawn('python', ['app/src/scripts/train.py']);

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

router.post('/collect', authenticateToken, async (req, res) => {
  try {
    const apiUrl = 'https://api.binance.com/api/v3/exchangeInfo';
    const response = await axios.get(apiUrl);
    const symbols = response.data.symbols;

    if (!symbols || symbols.length === 0) {
      res.status(404).json({ error: 'No symbols found' });
      return;
    }

    const symbolPromises = symbols.map(async (symbol) => {
      const symbolName = symbol.symbol;
      if (symbolName.endsWith('USDT')) {
        const trimmedSymbolName = symbolName.slice(0, -4);

        try {
          await Symbol.create({ name: trimmedSymbolName });
        } catch (err) {
          if (err.code !== 11000) {
            throw err;
          }
        }
      }
    });

    await Promise.all(symbolPromises);

    res.status(200).json({ message: `Symbols saved in MongoDB` });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/download', authenticateToken, async (req, res) => {
  try {
    await download_crypto_data();
    res.status(200).json({ message: 'Crypto data downloaded successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/process', authenticateToken, (req, res) => {
  const process = spawn('python', ['app/src/scripts/process.py']);

  process.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  process.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  process.on('close', (code) => {
    if (code === 0) {
      res.status(200).json({ message: 'Process started successfully' });
    } else {
      res.status(500).json({ error: `Process failed with code ${code}` });
    }
  });
  
  req.on('close', () => {
    console.log('Request closed, terminating Python process.');
    process.kill();
  });
});

module.exports = router;
