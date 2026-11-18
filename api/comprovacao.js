global.rpgEstado = global.rpgEstado || {
  missaoAberta: false,
  participantes: []
};

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
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    // Captura o texto enviado pelo AutoResponder via POST (corpo da requisição) ou GET
    let message = '';

    if (req.body) {
      if (typeof req.body === 'object') {
        message = req.body.q || req.body.message || req.body.text || req.body.msg || '';
      } else if (typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          message = parsed.q || parsed.message || parsed.text || parsed.msg || '';
        } catch (e) {
          message = req.body;
        }
      }
    }

    if (!message && req.query) {
      message = req.query.msg || req.query.message || req.query.text || req.query.q || '';
    }

    message = String(message).trim();

    // Se por acaso vier a tag literal [message], limpa para não travar
    if (message === '[message]' || !message) {
      return res.status(200).json({ replies: [] });
    }

    const msgLower = message.toLowerCase().replace(/\s+/g, ' ').trim();

    if (msgLower.indexOf('/iniciarmissao') === 0) {
      if (msgLower.indexOf(SENHA_ADM) === -1) {
        return res.status(200).json({ replies: [{ message: '⚠️ Senha incorreta!' }] });
      }
      global.rpgEstado.missaoAberta = true;
      global.rpgEstado.participantes = [];
      return res.status(200).json({ replies: [{ message: '🟢 *Missão Iniciada!* Escutando comprovações.' }] });
    }

    if (msgLower.indexOf('/limpar') === 0) {
      if (msgLower.indexOf(SENHA_ADM) === -1) {
        return res.status(200).json({ replies: [{ message: '⚠️ Senha incorreta!' }] });
      }
      global.rpgEstado.missaoAberta = false;
      global.rpgEstado.participantes = [];
      return res.status(200).json({ replies: [{ message: '🧹 Lista zerada!' }] });
    }

    if (msgLower.indexOf('/fecharmissao') === 0 || msgLower.indexOf('!lista') === 0) {
      const ehFechamento = msgLower.indexOf('/fecharmissao') === 0;
      
      if (ehFechamento && msgLower.indexOf(SENHA_ADM) === -1) {
        return res.status(200).json({ replies: [{ message: '⚠️ Senha incorreta!' }] });
      }

      if (global.rpgEstado.participantes.length === 0) {
        return res.status(200).json({ replies: [{ message: '📭 Nenhum caçador registrado.' }] });
      }

      const unicos = [];
      for (let i = 0; i < global.rpgEstado.participantes.length; i++) {
        if (unicos.indexOf(global.rpgEstado.participantes[i]) === -1) {
          unicos.push(global.rpgEstado.participantes[i]);
        }
      }

      unicos.sort(function (a, b) {
        const matchA = a.match(/([✴️🈸🉑🔆⚜️🔱✨]+)/u);
        const matchB = b.match(/([✴️🈸🉑🔆⚜️🔱✨]+)/u);
        const pesoA = matchA && PESO_RANKS[matchA[1].slice(-2)] ? PESO_RANKS[matchA[1].slice(-2)] : 1;
        const pesoB = matchB && PESO_RANKS[matchB[1].slice(-2)] ? PESO_RANKS[matchB[1].slice(-2)] : 1;
        return pesoB - pesoA;
      });

      let textoFinal = '';
      for (let j = 0; j < unicos.length; j++) {
        textoFinal += '• ' + unicos[j] + '\n';
      }

      const resposta = '📋 *CAÇADORES NA MISSÃO (' + unicos.length + '):*\n\n' + textoFinal.trim();

      if (ehFechamento) {
        global.rpgEstado.missaoAberta = false;
        return res.status(200).json({ replies: [{ message: '🔴 *Missão Encerrada!* Lista:\n\n' + resposta }] });
      }

      return res.status(200).json({ replies: [{ message: resposta }] });
    }

    if (!global.rpgEstado.missaoAberta) {
      return res.status(200).json({ replies: [] });
    }

    // Validação de emojis da comprovação
    const contemEmojiRank = /[✴️🈸🉑🔆⚜️🔱✨]/u.test(message);

    if (contemEmojiRank) {
      if (global.rpgEstado.participantes.indexOf(message) === -1) {
        global.rpgEstado.participantes.push(message);
        return res.status(200).json({
          replies: [{ reaction: "✅" }]
        });
      }
    }

    return res.status(200).json({ replies: [] });

  } catch (err) {
    return res.status(200).json({
      replies: [{ message: '❌ ERRO: ' + err.message }]
    });
  }
};
