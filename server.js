const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = 'https://czkvbphoyznniqkapyma.supabase.co';

app.get('/search', async (req, res) => {
  const { q, threshold = '0.3', count = '5' } = req.query;
  const sfKey = process.env.SF_KEY;
  const sbKey = process.env.SB_KEY;
  if (!sfKey || !sbKey) return res.status(500).json({ error: 'keys not set' });
  if (!q) return res.status(400).json({ error: 'missing q' });
  try {
    const embedRes = await axios.post('https://api.siliconflow.cn/v1/embeddings', {
      model: 'BAAI/bge-large-zh-v1.5',
      input: q,
      encoding_format: 'float'
    }, { headers: { 'Authorization': 'Bearer ' + sfKey } });
    const embedding = embedRes.data.data[0].embedding;
    const matchRes = await axios.post(SUPABASE_URL + '/rest/v1/rpc/match_memories', {
      query_embedding: embedding,
      match_threshold: parseFloat(threshold),
      match_count: parseInt(count)
    }, { headers: { 'apikey': sbKey, 'Authorization': 'Bearer ' + sbKey } });
    res.json(matchRes.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.send('ok'));

app.listen(process.env.PORT || 3333, () => console.log('ready'));
