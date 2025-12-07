export default async function handler(req, res) {
  try {
    const { tag } = req.query;

    if (!tag) {
      return res.status(400).json({ error: 'Tag do clã ausente.' });
    }

    const encodedTag = encodeURIComponent(tag.replace("#", "%23"));
    const token = process.env.COC_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: 'Variável COC_TOKEN não configurada no Vercel.'
      });
    }

    const apiUrl = `https://api.clashofclans.com/v1/clans/${encodedTag}`;

    const resp = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      method: 'GET'
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({
        error: 'Erro da API Clash',
        details: text
      });
    }

    const data = await resp.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({
      error: 'Erro interno',
      details: String(err)
    });
  }
}
