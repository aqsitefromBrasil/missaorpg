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

module.exports = function (req, res) {
  try {
    // Configura os headers para aceitar JSON e evitar cache agressivo da Vercel
    res.setHeader('Content-Type', 'application/json');

    const query = req.query || {};
    let message = query.msg || query.message || query.text || '';
    
    if (req.body) {
      if (typeof req.body === 'object' && req.body.message) {
        message = req.body.message;
      } else if (typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          if (parsed.message) message = parsed.message;
        } catch (e) {}
      }
    }

    try {
      message = decodeURIComponent(message).trim();
    } catch (e) {
      message = String(message).trim();
    }

    if (!message) {
      return res.status(200).json({ status: 'ok', message: 'Aguardando mensagem...' });
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
            { message: '⚠️ Senha incorreta para o comando ' + comando + '. Use: ' + comando + ' ' + SENHA_ADM }
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

        const unicos = [];
        for (let i = 0; i < participantes.length; i++) {
          if (unicos.indexOf(participantes[i]) === -1) {
            unicos.push(participantes[i]);
          }
        }

        unicos.sort(function (a, b) {
          const matchA = a.match(/([✴️🈸🉑🔆⚜️🔱✨]+)$/u);
          const matchB = b.match(/([✴️🈸🉑🔆⚜️🔱✨]+)$/u);
          const pesoA = matchA && PESO_RANKS[matchA[1].slice(-2)] ? PESO_RANKS[matchA[1].slice(-2)] : 1;
          const pesoB = matchB && PESO_RANKS[matchB[1].slice(-2)] ? PESO_RANKS[matchB[1].slice(-2)] : 1;
          return pesoB - pesoA;
        });

        let textoFinal = '';
        for (let j = 0; j < unicos.length; j++) {
          textoFinal += '• ' + unicos[j] + '\n';
        }
        textoFinal = textoFinal.trim();

        const resposta = '📋 *CAÇADORES NA MISSÃO (' + unicos.length + '):*\n\n' + textoFinal;

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
      if (participantes.indexOf(primeiraLinha) === -1) {
        participantes.push(primeiraLinha);
        return res.status(200).json({
          replies: [{ reaction: "✅" }]
        });
      }
    }

    return res.status(200).json({ replies: [] });

  } catch (err) {
    return res.status(200).json({ replies: [] });
  }
};
