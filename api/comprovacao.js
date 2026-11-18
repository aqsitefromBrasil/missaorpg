try {
      message = decodeURIComponent(message).trim();
    } catch (e) {
      message = String(message).trim();
    }

    if (!message) {
      return res.status(200).json({ status: 'ok', message: 'Aguardando mensagem...' });
    }

    // Normaliza qualquer espaço duplo ou codificado para espaço simples
    const mensagemLimpa = message.replace(/\s+/g, ' ').trim();
    
    // Identifica o comando e a senha de forma flexível
    const partes = mensagemLimpa.split(' ');
    const comando = partes[0] ? partes[0].toLowerCase() : '';
    // Pega tudo o que vier depois do primeiro espaço como senha (caso tenha espaços extras)
    const senhaInformada = partes.slice(1).join(' ').trim();

    const ehComando =
      comando === '/iniciarmissao' ||
      comando === '/fecharmissao' ||
      comando === '!lista' ||
      comando === '/limpar';

    if (ehComando) {
      if (comando !== '/iniciarmissao' && senhaInformada !== SENHA_ADM) {
        return res.status(200).json({
          replies: [{ message: '⚠️ Senha incorreta ou faltando! Use: ' + comando + ' ' + SENHA_ADM }]
        });
      }

      if (comando === '/iniciarmissao') {
        if (senhaInformada !== SENHA_ADM) {
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
