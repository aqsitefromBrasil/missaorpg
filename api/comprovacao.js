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
    let message = '';

    if (req.body) {
      let bodyObj = req.body;
      if (typeof bodyObj === 'string') {
        try {
          bodyObj = JSON.parse(bodyObj);
        } catch (e) {
          message = bodyObj;
        }
      }

      if (typeof bodyObj === 'object' && bodyObj !== null) {
        if (bodyObj.query && typeof bodyObj.query === 'object') {
          message = bodyObj.query.message || bodyObj.query.text || '';
        }
        if (!message) {
          message = bodyObj.message || bodyObj.text || bodyObj.q || bodyObj.msg || '';
        }
      }
    }

    if (!message && req.query) {
      message = req.query.msg || req.query.message || req.query.text || req.query.q || '';
    }

    message = String(message).trim();

    if (!message || message === '[message]') {
      return res.status(200).json({ replies: [] });
    }

    const msgLower = message.toLowerCase().replace(/\s+/g, ' ').trim();

    // --- COMANDOS DE ADMIN ---
    if (msgLower.indexOf('/iniciarmissao') === 0) {
      if (msgLower.indexOf(SENHA_ADM) === -1) {
        return res.status(200).json({ replies: [{ message: '⚠️ Senha incorreta!' }] });
      }
      global.rpgEstado.missaoAberta = true;
      global.rpgEstado.participantes = [];
      return res.status(200).json({ replies: [{ message: '🟢 *Missão Iniciada!* Captura restrita aos ranks oficiais.' }] });
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

      if (!global.rpgEstado.participantes || global.rpgEstado.participantes.length === 0) {
        return res.status(200).json({ replies: [{ message: '📭 Nenhum caçador registrado nesta missão.' }] });
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
        return res.status(200).json({ replies: [{ message: '🔴 *Missão Encerrada!* Lista final:\n\n' + resposta }] });
      }

      return res.status(200).json({ replies: [{ message: resposta }] });
    }

    if (!global.rpgEstado.missaoAberta) {
      return res.status(200).json({ replies: [] });
    }

    // --- FILTRO RIGOROSO DE RANKS ---
    // Verifica se a mensagem possui obrigatoriamente um dos emojis de rank oficiais no texto
    const regexRanksOficiais = /[✴️🈸🉑🔆⚜️🔱✨]/u;
    
    // Lista de emojis comuns que NÃO devem acionar o registro sozinhos
    const temEmojiPermitido = regexRanksOficiais.test(message);

    if (temEmojiPermitido) {
      // Evita registrar se a mensagem for apenas um emoji solto do tipo ❤️, 🙌, etc. sem o rank junto
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
      replies: [{ message: '❌ ERRO INTERNO: ' + err.message }]
    });
  }
};
