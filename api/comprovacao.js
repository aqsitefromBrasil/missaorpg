let missaoAberta = false;
let participantes = [];
const SENHA_ADM = 'kaeldecalcinha';

const PESO_RANKS = {
  '✴️': 1,
  '🈸': 2,
  '🉑': 3,
  '🔆': 4,
  '⚜️': 5,
  '🔱': 6,
  '✨': 6
};

export default function handler(req, res) {
  try {
    // Garante que aceita GET e POST sem crashar
    const query = req.query || {};
    let body = {};
    
    try {
      if (typeof req.body === 'object' && req.body !== null) {
        body = req.body;
      } else if (typeof req.body === 'string' && req.body.trim() !== '') {
        body = JSON.parse(req.body);
      }
    } catch (e) {
      body = {};
    }

    // Extrai a mensagem de qualquer lugar possível sem risco de erro
    const message = (query.msg || query.message || body.message || body.text || body.q || '').trim();

    if (!message) {
      return res.status(200).json({ status: 'ok', message: 'Bot ativo e pronto.' });
    }

    const partes = message.split(/\s+/);
    const comando = partes[0] ? partes[0].toLowerCase() : '';
    const senhaInformada = partes[1] || '';

    const ehComando =
      comando === '/iniciarmissao' ||
      comando === '/fecharmissao' ||
      comando === '!lista' ||
      comando === '/limpar';

    if (ehComando) {
      if (senhaInformada !== SENHA_ADM) {
        return res.status(200).json({
          replies: [
            { message: `⚠️ Senha incorreta para o comando ${comando}. Use: ${comando} ${SENHA_ADM}` }
          ]
        });
      }

      if (comando === '/iniciarmissao') {
        missaoAberta = true;
        participantes = [];
        return res.status(200).json({
          replies: [{ message: '🟢 *Missão Iniciada!* O bot está capturando as comprovações.' }]
        });
      }

      if (comando === '/limpar') {
        missaoAberta = false;
        participantes = [];
        return res.status(200).json({
          replies: [{ message: '🧹 Lista zerada e missão fechada!' }]
        });
      }

      if (comando === '/fecharmissao' || comando === '!lista') {
        if (participantes.length === 0) {
          return res.status(200).json({
            replies: [{ message: '📭 Nenhum caçador registrado nesta missão.' }]
          });
        }

        const unicos = [...new Set(participantes)];

        unicos.sort((a, b) => {
          const matchA = a.match(/([✴️🈸🉑🔆⚜️🔱✨]+)$/u);
          const matchB = b.match(/([✴️🈸🉑🔆⚜️🔱✨]+)$/u);
          const pesoA = matchA && PESO_RANKS[matchA[1].slice(-2)] ? PESO_RANKS[matchA[1].slice(-2)] : 1;
          const pesoB = matchB && PESO_RANKS[matchB[1].slice(-2)] ? PESO_RANKS[matchB[1].slice(-2)] : 1;
          return pesoB - pesoA;
        });

        const textoFinal = unicos.map((item) => `• ${item}`).join('\n');
        const resposta = `📋 *CAÇADORES NA MISSÃO (${unicos.length}):*\n\n${textoFinal}`;

        if (comando === '/fecharmissao') {
          missaoAberta = false;
          return res.status(200).json({
            replies: [{ message: '🔴 *Missão Encerrada!* Lista final:\n\n' + resposta }]
          });
        }

        return res.status(200).json({
          replies: [{ message: resposta }]
        });
      }
    }

    if (!missaoAberta) {
      return res.status(200).json({ replies: [] });
    }

    const primeiraLinha = message.split('\n')[0].trim();
    const temEmojisNoFim = /[✴️🈸🉑🔆⚜️🔱✨]+$/u.test(primeiraLinha);

    if (temEmojisNoFim) {
      if (!participantes.includes(primeiraLinha)) {
        participantes.push(primeiraLinha);
        return res.status(200).json({
          replies: [{ reaction: "✅" }]
        });
      }
    }

    return res.status(200).json({ replies: [] });

  } catch (err) {
    // Retorna sempre status 200 para impedir qualquer erro 500 no AutoResponder
    return res.status(200).json({ replies: [] });
  }
}
