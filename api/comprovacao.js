// Controla se a missão está aceitando capturas no momento
let missaoAberta = false;

// Armazena os nicks únicos capturados
let participantes = new Set();

// Senha secreta exigida para comandos de ADM
const SENHA_ADM = 'kaeldecalcinha';

// Tabela de pesos dos emojis de rank para ordenar do menor para o maior
const PESO_RANKS = {
  '✴️': 1, // Rank E
  '🈸': 2, // Rank D
  '🉑': 3, // Rank C
  '🔆': 4, // Rank B
  '⚜️': 5, // Rank A
  '🔱': 6  // Rank S
};

// Regex atualizada para o modelo: [Nick][Emoji Descendência][Emoji Rank]
// Exemplo: nidhogg👁‍🗨🔱 (ou com espaços opcionais)
const PADRAO_MODELO = /^(.+?)([\p{So}\p{Symbol}]+)([✴️🈸🉑🔆⚜️🔱])$/u;

export default async function handler(req, res) {
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
            { message: `⚠️ Comando negado. Use a senha correta (Ex: \`${comando} ${SENHA_ADM}\`).` }
          ]
        });
      }
    }

    // ==========================================
    // 1. COMANDOS DE CONTROLE DA MISSÃO
    // ==========================================
    if (comando === '/iniciarmissao') {
      missaoAberta = true;
      participantes.clear();
      return res.status(200).json({
        replies: [{ message: '🟢 *Missão Iniciada!* O bot está capturando no modelo `nidhogg👁‍🗨🔱`.' }]
      });
    }

    if (comando === '/fecharmissao' || comando === '!lista') {
      if (participantes.size === 0) {
        return res.status(200).json({
          replies: [{ message: '📭 Nenhum caçador registrado nesta missão.' }]
        });
      }

      const listaArray = Array.from(participantes).map((item) => {
        const match = item.match(PADRAO_MODELO);
        const nickNome = match ? match[1].trim() : item;
        const rankEmoji = match ? match[3] : '✴️';
        
        return {
          textoCompleto: item,
          peso: PESO_RANKS[rankEmoji] || 1,
          nomeLimpo: nickNome.replace(/^[^\p{L}\p{N}]+/u, '').trim()
        };
      });

      // Ordena por Rank (S até E) e alfabeticamente pelo nick
      listaArray.sort((a, b) => {
        if (b.peso !== a.peso) return b.peso - a.peso;
        return a.nomeLimpo.localeCompare(b.nomeLimpo, 'pt-BR', { sensitivity: 'base' });
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

    // ==========================================
    // 2. CAPTURA AUTOMÁTICA E REAÇÃO (Com missão aberta)
    // ==========================================
    if (!missaoAberta) {
      return res.status(200).json({ replies: [] });
    }

    const primeiraLinha = message.split('\n')[0].trim();
    let nickValido = null;

    if (PADRAO_MODELO.test(primeiraLinha)) {
      nickValido = primeiraLinha;
    } else if (PADRAO_MODELO.test(message)) {
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
}
