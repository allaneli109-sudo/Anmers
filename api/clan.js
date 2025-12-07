// api/clan.js  — servidor serverless para Vercel (usa fetch nativo)
// Commit message sugerida: feat(api): adicionar endpoint /api/clan (Clash API proxy)

export default async function handler(req, res) {
  // CORS simples (permitir chamadas do front)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.CLASH_API_TOKEN || '';
  const clanTag = process.env.CLAN_TAG || '';

  // Fallback mock se não houver token ou clan tag
  if (!token || !clanTag) {
    const mock = {
      clan: { name: 'Aimmers (mock)', tag: '#MOCK', members: 42 },
      members: [
        { name: 'Jog1', tag: '#AAA', townHallLevel: 17, role: 'member' },
        { name: 'Jog2', tag: '#AAB', townHallLevel: 18, role: 'coLeader' },
        { name: 'Jog3', tag: '#AAC', townHallLevel: 16, role: 'elder' },
      ],
      warlog: [
        { opponent: 'Clã Teste', teamSize: 15, result: 'win', season: 'mock' }
      ],
      note: 'MOCK_RESPONSE - set CLASH_API_TOKEN and CLAN_TAG to enable real data'
    };
    return res.status(200).json(mock);
  }

  try {
    // API Clash: /v1/clans/{clanTag}  and /v1/clans/{clanTag}/warlog
    const clanUrl = `https://api.clashofclans.com/v1/clans/${encodeURIComponent(clanTag)}`;
    const clanResp = await fetch(clanUrl, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });

    if (!clanResp.ok) {
      const text = await clanResp.text();
      return res.status(502).json({ error: 'Failed to fetch clan', status: clanResp.status, body: text });
    }
    const clanData = await clanResp.json();

    // Tentativa de buscar warlog (se disponível)
    const warlogUrl = `https://api.clashofclans.com/v1/clans/${encodeURIComponent(clanTag)}/warlog`;
    let warlogData = [];
    try {
      const warResp = await fetch(warlogUrl, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      if (warResp.ok) warlogData = await warResp.json();
    } catch (e) {
      // silently ignore warlog errors
      warlogData = [];
    }

    // O Clash API retorna memberList em clanData? normalmente retorna `memberList` em /clans/{tag}
    // Construir resposta simplificada para o frontend
    const simplified = {
      clan: { name: clanData.name, tag: clanData.tag, members: clanData.members },
      members: clanData.memberList || clanData.memberlist || clanData.members || [],
      warlog: warlogData.items || warlogData || []
    };

    return res.status(200).json(simplified);
  } catch (err) {
    console.error('api/clan error', err);
    return res.status(500).json({ error: 'server error', message: String(err) });
  }
}
