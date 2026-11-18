let missaoAberta = false;
let participantes = new Set();
const SENHA_ADM = 'kaeldecalcinha';

const PESO_RANKS = {
  '✴️': 1,
  '🈸': 2,
  '🉑': 3,
  '🔆': 4,
  '⚜️': 5,
  '🔱': 6,
  '✨': 6 // Incluído caso usem ✨ como rank ou descendência extra
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const data = req.body || {};
    const query = data.query || {};
    
    const message = (query.message || query.text || JSON.stringify(data)).trim();
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
            { message: `⚠️ Senha incorreta. Use: ${comando} ${SENHA_ADM}` }
          ]
        });
      }
    }

    if (comando === '/iniciarmissao') {
      missaoAberta = true;
      participantes.clear();
      return res.status(200).json({
        replies: [{ message: '🟢 *Missão Iniciada!* O bot está pronto para capturar as comprovações.' }]
      });
    }

    if (comando === '/fecharmissao' || comando === '!lista') {
      if (participantes.size === 0) {
        return res.status(200).json({
          replies: [{ message: '📭 Nenhum caçador registrado nesta missão.' }]
        });
      }

      const listaArray = Array.from(participantes).map((item) => {
        // Tenta achar o último emoji da linha para usar como peso de ordenação
        const matchRank = item.match(/([✴️🈸🉑🔆⚜️🔱✨]+)$/u);
        const rankEmoji = matchRank ? matchRank[1].slice(-2) : '✴️';

        return {
          textoCompleto: item,
          peso: PESO_RANKS[rankEmoji] || 1,
          nickLimpo: item.replace(/^[^\p{L}\p{N}]+/u, '').trim()
        };
      });

      listaArray.sort((a, b) => {
        if (b.peso !== a.peso) return b.peso - a.peso;
        return a.nickLimpo.localeCompare(b.nickLimpo, 'pt-BR', { sensitivity: 'base' });
      });

      const textoFinal = listaArray.map((item) => `• ${item.textoCompleto}`).join('\n');
      const resposta = `📋 *CAÇADORES NA MISSÃO (${participantes.size}):*\n\n${textoFinal}`;

      if (comando === '/fecharmissao') {
        missaoAberta = false;
        return res.status(200).json({
          replies: [{ message: '🔴 *Missão Encerrada!* Lista final:\n\n' + resposta }]
        });
      }

      return res.status(200).json({ replies: [{ message: resposta }] });
    }

    if (comando === '/limpar') {
      participantes.clear();
      missaoAberta = false;
      return res.status(200).json({
        replies: [{ message: '🧹 Lista zerada e missão fechada!' }]
      });
    }

    if (!missaoAberta) {
      return res.status(200).json({ replies: [] });
    }

    // Valida mensagens que começam com texto/emoji e terminam com emojis (o padrão do print)
    const primeiraLinha = message.split('\n')[0].trim();
    // Regex flexível: aceita qualquer texto que tenha emojis no início e/ou fim
    const regexValida = /^(.+?)[✴️🈸🉑🔆⚜️🔱✨]+$/u;

    let nickValido = null;
    if (regexValida.test(primeiraLinha)) {
      nickValido = primeiraLinha;
    } else if (regexValida.test(message)) {
      nickValido = message;
    }

    if (nickValido) {
      if (!participantes.has(nickValido)) {
        participantes.add(nickValido);
        return res.status(200).json({
          replies: [{ reaction: "✅" }]
        });
      }
    }

    return res.status(200).json({ replies: [] });

  } catch (error) {
    console.error('Erro:', error);
    return res.status(200).json({ replies: [] });
  }
};
