global.rpgEstado = global.rpgEstado || {
  missaoAberta: false,
  participantes: []
};

const SENHA_ADM = 'kaeldecalcinha';

module.exports = function (req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    // Tenta puxar a mensagem de absolutamente QUALQUER lugar possível que o AutoResponder mande
    let dadosBrutos = '';
    
    if (req.query && Object.keys(req.query).length > 0) {
      dadosBrutos = JSON.stringify(req.query);
    } else if (req.body) {
      if (typeof req.body === 'object') {
        dadosBrutos = JSON.stringify(req.body);
      } else {
        dadosBrutos = String(req.body);
      }
    }

    // Extrai o texto principal para tentarmos salvar
    let message = '';
    if (req.query) {
      message = req.query.msg || req.query.message || req.query.text || req.query.q || '';
    }
    if (!message && req.body) {
      if (typeof req.body === 'object') {
        message = req.body.message || req.body.text || req.body.q || req.body.msg || '';
      } else {
        try {
          const parsed = JSON.parse(req.body);
          message = parsed.message || parsed.text || parsed.q || parsed.msg || '';
        } catch (e) {
          message = req.body;
        }
      }
    }

    message = String(message).trim();

    // COMANDOS DE ADMIN (continuam funcionando igual)
    const msgLower = message.toLowerCase();
    if (msgLower.indexOf('/iniciarmissao') === 0) {
      global.rpgEstado.missaoAberta = true;
      global.rpgEstado.participantes = [];
      return res.status(200).json({ replies: [{ message: '🟢 *Missão Iniciada!* O bot está escutando.' }] });
    }
    if (msgLower.indexOf('/limpar') === 0) {
      global.rpgEstado.missaoAberta = false;
      global.rpgEstado.participantes = [];
      return res.status(200).json({ replies: [{ message: '🧹 Lista limpa e missão fechada!' }] });
    }
    if (msgLower.indexOf('/fecharmissao') === 0 || msgLower.indexOf('!lista') === 0) {
      if (global.rpgEstado.participantes.length === 0) {
        return res.status(200).json({ replies: [{ message: '📭 Nenhum caçador na lista ainda.' }] });
      }
      let listaTxt = '';
      for (let i = 0; i < global.rpgEstado.participantes.length; i++) {
        listaTxt += '• ' + global.rpgEstado.participantes[i] + '\n';
      }
      return res.status(200).json({ replies: [{ message: '📋 *LISTA (' + global.rpgEstado.participantes.length + '):*\n\n' + listaTxt.trim() }] });
    }

    if (!global.rpgEstado.missaoAberta) {
      return res.status(200).json({ replies: [] });
    }

    // SE CHEGOU AQUI COM A MISSÃO ABERTA: Vamos forçar registrar qualquer mensagem que tenha emojis ou texto para ver se grava
    if (message.length > 0) {
      // Salva a mensagem bruta para vermos o que o membro mandou
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
