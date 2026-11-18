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
    
    if (req.query) {
      message = req.query.msg || req.query.message || req.query.text || req.query.q || '';
    }
    
    if (!message && req.body) {
      if (typeof req.body === 'object') {
        message = req.body.message || req.body.text || req.body.q || req.body.msg || '';
      } else if (typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          message = parsed.message || parsed.text || parsed.q || parsed.msg || '';
        } catch (e) {
          message = req.body;
        }
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

    const msgLower = message.toLowerCase().replace(/\s+/g, ' ').trim();

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
      textoFinal = textoFinal.trim();

      const resposta = '📋 *CAÇADORES NA MISSÃO (' + unicos.length + '):*\n\n' + textoFinal;

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

    if (!global.rpgEstado.missaoAberta) {
      return res.status(200).json({ replies: [] });
    }

    // --- CAPTURA FLEXÍVEL DE PARTICIPANTES ---
    // Pega a mensagem inteira limpa de espaços excessivos nas pontas
    const mensagemCompleta = message.trim();
    
    // Verifica se a mensagem contém QUALQUER um dos emojis de rank em qualquer parte dela (ou no fim)
    const contemEmojiRank = /[✴️🈸🉑🔆⚜️🔱✨]/u.test(mensagemCompleta);

    if (contemEmojiRank) {
      // Evita duplicatas exatas na lista
      if (global.rpgEstado.participantes.indexOf(mensagemCompleta) === -1) {
        global.rpgEstado.participantes.push(mensagemCompleta);
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
