cat > ~/memory-proxy/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/embed', async (req, res) => {
  const { text } = req.body;
  const apiKey = process.env.SF_KEY;
  if (!apiKey) return res.status(500).json({ error: 'SF_KEY not set' });
  try {
    const response = await axios.post('https://api.siliconflow.cn/v1/embeddings', {
      model: 'BAAI/bge-large-zh-v1.5',
      input: text,
      encoding_format: 'float'
    }, {
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' }
    });
    res.json({ embedding: response.data.data[0].embedding });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3333, () => console.log('ready'));
EOF
