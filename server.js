const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = 'https://czkvbphoyznniqkapyma.supabase.co';

app.get('/search', async (req, res) => {
  const { q, threshold = '0.3', count = '5', slim = 'false' } = req.query;
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
    
const data = slim === 'true'
      ? matchRes.data.map(r => ({ id: r.id, content: r.content, similarity: r.similarity, created_at: r.created_at }))
      : matchRes.data;

    // 更新 access_count 和 last_accessed_at
    const ids = matchRes.data.map(r => r.id);
    if (ids.length > 0) {
      await axios.post(SUPABASE_URL + '/rest/v1/rpc/increment_access', {
        memory_ids: ids
      }, { headers: { 'apikey': sbKey, 'Authorization': 'Bearer ' + sbKey } });
    }

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.send('ok'));app.get('/robots.txt', (req, res) => res.send('User-agent: *\nAllow: /'));
app.get('/timeline', async (req, res) => {
  const { q, limit = '20' } = req.query;
  const sbKey = process.env.SB_KEY;
  if (!sbKey) return res.status(500).json({ error: 'keys not set' });
  if (!q) return res.status(400).json({ error: 'missing q' });
  try {
    const searchRes = await axios.get(SUPABASE_URL + '/rest/v1/memories', {
      params: {
        content: `ilike.*${q}*`,
        order: 'created_at.asc',
        limit: parseInt(limit),
        select: 'id,content,created_at,metadata'
      },
      headers: { 'apikey': sbKey, 'Authorization': 'Bearer ' + sbKey }
    });
    res.json(searchRes.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.get('/state', async (req, res) => {
  const sbKey = process.env.SB_KEY;
  if (!sbKey) return res.status(500).json({ error: 'keys not set' });
  try {
    const stateRes = await axios.get(SUPABASE_URL + '/rest/v1/cognitive_state', {
      params: { id: 'eq.1', select: 'content,updated_at' },
      headers: { 'apikey': sbKey, 'Authorization': 'Bearer ' + sbKey }
    });
    res.json(stateRes.data[0] || {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.listen(process.env.PORT || 3333, () => console.log('ready'));
