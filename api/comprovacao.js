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

    // 1. Leitura do formato padrão POST do AutoResponder.ai (ex: { query: { message: "..." } })
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

    // 2. Fallback caso algum dado venha via GET na URL
    if (!message && req.query) {
      message = req.query.msg || req.query.message || req.query.text || req.query.q || '';
    }

    message = String(message).trim();

    // Ignora se vier vazio ou se vier a tag literal não substituída
    if (!message || message === '[message]') {
      return res.status(200).json({ replies: [] });
    }

    const msgLower = message.toLowerCase().replace(/\s+/g, ' ').trim();

    // --- COMANDO: INICIAR MISSÃO ---
    if (msgLower.indexOf('/iniciarmissao') === 0) {
      if (msgLower.indexOf(SENHA_ADM) === -1) {
        return res.status(200).json({
          replies: [{ message: '⚠️ Senha incorreta! Use: /iniciarmissao ' + SENHA_ADM }]
        });
      }
      global.rpgEstado.missaoAberta = true;
      global.rpgEstado.participantes = [];
      return res.status(200).json({
        replies: [{ message: '🟢 *Missão Iniciada!* O bot está capturando as comprovações.' }]
      });
    }

    // --- COMANDO: LIMPAR LISTA ---
    if (msgLower.indexOf('/limpar') === 0) {
      if (msgLower.indexOf(SENHA_ADM) === -1) {
        return res.status(200).json({
          replies: [{ message: '⚠️ Senha incorreta! Use: /limpar ' + SENHA_ADM }]
        });
      }
      global.rpgEstado.missaoAberta = false;
      global.rpgEstado.participantes = [];
      return res.status(200).json({
        replies: [{ message: '🧹 Lista zerada e missão fechada!' }]
      });
    }

    // --- COMANDO: FECHAR MISSÃO OU VER LISTA ---
    if (msgLower.indexOf('/fecharmissao') === 0 || msgLower.indexOf('!lista') === 0) {
      const ehFechamento = msgLower.indexOf('/fecharmissao') === 0;

      if (ehFechamento && msgLower.indexOf(SENHA_ADM) === -1) {
        return res.status(200).json({
          replies: [{ message: '⚠️ Senha incorreta! Use: /fecharmissao ' + SENHA_ADM }]
        });
      }

      if (!global.rpgEstado.participantes || global.rpgEstado.participantes.length === 0) {
        return res.status(200).json({
          replies: [{ message: '📭 Nenhum caçador registrado nesta missão.' }]
        });
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
        const linhaLimpa = String(unicos[j]).replace(/[\r\n]+/g, ' ').trim();
        textoFinal += '• ' + linhaLimpa + '\n';
      }

      const resposta = '📋 *CAÇADORES NA MISSÃO (' + unicos.length + '):*\n\n' + textoFinal.trim();

      if (ehFechamento) {
        global.rpgEstado.missaoAberta = false;
        return res.status(200).json({
          replies: [{ message: '🔴 *Missão Encerrada!* Lista final:\n\n' + resposta }]
        });
      }

      return res.status(200).json({
        replies: [{ message: resposta }]
      });
    }

    // Se a missão estiver fechada, ignora mensagens comuns
    if (!global.rpgEstado.missaoAberta) {
      return res.status(200).json({ replies: [] });
    }

    // --- CAPTURA DE COMPROVAÇÕES ---
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
      replies: [{ message: '❌ ERRO INTERNO: ' + err.message }]
    });
  }
};
