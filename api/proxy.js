export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, url, rss_url } = req.body;

  try {
    // --- fetch_rss ---
    if (action === 'fetch_rss') {
      const response = await fetch(rss_url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RSS reader/1.0)' },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) return res.json({ error: `HTTP ${response.status}` });
      const rss = await response.text();
      return res.json({ rss });
    }

    // --- fetch_images ---
    if (action === 'fetch_images') {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) return res.json({ images: [] });
      const html = await response.text();
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      const images = [];
      let m;
      while ((m = imgRegex.exec(html)) !== null) {
        const src = m[1];
        if (src.startsWith('http') && !images.includes(src)) images.push(src);
        if (images.length >= 10) break;
      }
      return res.json({ images });
    }

    // --- fetch_image_b64 ---
    if (action === 'fetch_image_b64') {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) return res.json({ error: `HTTP ${response.status}` });
      const mime = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      const b64 = Buffer.from(arrayBuffer).toString('base64');
      const filename = url.split('/').pop().split('?')[0] || 'image.jpg';
      return res.json({ b64, mime, filename });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    return res.json({ error: e.message });
  }
}
