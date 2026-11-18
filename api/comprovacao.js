// Controla se a missão está aceitando capturas no momento
let missaoAberta = false;

// Armazena os nicks únicos capturados
let participantes = new Set();

// Senha secreta exigida para comandos de ADM
const SENHA_ADM = 'kaeldecalcinha';

// Tabela de pesos dos emojis para ordenar do menor para o maior rank
const PESO_RANKS = {
  '✴️': 1, // Rank E
  '🈸': 2, // Rank D
  '🉑': 3, // Rank C
  '🔆': 4, // Rank B
  '⚜️': 5, // Rank A
  '🔱': 6  // Rank S
};

// Emojis de descendência válidos extraídos do lore oficial do RPG
const EMOJIS_DESCENDENCIA = ['👁‍🗨', '❄️', '🐾', '🐉', '🔥', '🕷️', '🧬', '🌸', '⏳', '🐞', '⚙️', '🌐', '🦅', '📛', '🌑'];

// Regex para validar o modelo completo: "[Emoji Descendência] + Nome + [Emoji Rank]"
// Exemplo: 👁‍🗨 Ashborn 🔱
const PADRAO_COMPLETO = /^([👁‍🗨❄️🐾🐉🔥🕷️🧬🌸⏳🐞⚙️🌐🦅📛🌑])\s+(.+?)\s+([✴️🈸🉑🔆⚜️🔱])$/u;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const data = req.body || {};
    const query = data.query || {};
    
    const sender = (query.sender || '').trim();
    const message = (query.message || '').trim();
    const partes = message.split(/\s+/);
    const comando = partes[0].toLowerCase();
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
            { message: `⚠️ *${sender || 'Usuário'}*, comando negado. Você precisa informar a senha secreta correta (Ex: \`${comando} ${SENHA_ADM}\`).` }
          ]
        });
      }
    }

    // ==========================================
    // 1. COMANDOS DE CONTROLE DA MISSÃO (Com Senha)
    // ==========================================
    if (comando === '/iniciarmissao') {
      missaoAberta = true;
      participantes.clear();
      return res.status(200).json({
        replies: [
          { message: '🟢 *Missão Iniciada!* O bot está validando o padrão com Descendência e Rank.' }
        ]
      });
    }

    if (comando === '/fecharmissao' || comando === '!lista') {
      if (participantes.size === 0) {
        return res.status(200).json({
          replies: [{ message: '📭 Nenhum caçador registrado nesta missão.' }]
        });
      }

      const listaArray = Array.from(participantes).map((item) => {
        const match = item.match(PADRAO_COMPLETO);
        const nickNome = match ? match[2].trim() : item;

        return {
          textoCompleto: item,
          nickOrdenacao: nickNome,
          peso: match && PESO_RANKS[match[3]] ? PESO_RANKS[match[3]] : 1
        };
      });

      // Ordena por rank (maior para menor) e alfabeticamente pelo nick
      listaArray.sort((a, b) => {
        if (b.peso !== a.peso) {
          return b.peso - a.peso;
        }
        return a.nickOrdenacao.localeCompare(b.nickOrdenacao, 'pt-BR', { sensitivity: 'base' });
      });

      const textoFinal = listaArray.map((item) => `• ${item.textoCompleto}`).join('\n');

      const resposta = [
        `📋 *CAÇADORES NA MISSÃO (${participantes.size}):*\n`,
        textoFinal
      ].join('\n');

      if (comando === '/fecharmissao') {
        missaoAberta = false;
        return res.status(200).json({
          replies: [
            {
              message:
                '🔴 *Missão Encerrada!* Aqui está a lista final ordenada por rank:\n\n' + resposta
            }
          ]
        });
      }

      return res.status(200).json({
        replies: [{ message: resposta }]
      });
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

    let nickValido = null;
    const primeiraLinhaMsg = message.split('\n')[0].trim();

    if (PADRAO_COMPLETO.test(primeiraLinhaMsg)) {
      nickValido = primeiraLinhaMsg;
    } else if (PADRAO_COMPLETO.test(sender)) {
      nickValido = sender;
    }

    if (nickValido) {
      if (!participantes.has(nickValido)) {
        participantes.add(nickValido);
        
        return res.status(200).json({
          replies: [
            {
              reaction: "✅"
            }
          ]
        });
      } else {
        return res.status(200).json({ replies: [] });
      }
    }

    return res.status(200).json({ replies: [] });

  } catch (error) {
    console.error('Erro crítico no webhook:', error);
    return res.status(200).json({
      replies: [
        { message: '⚠️ Ocorreu um erro interno ao processar o comando no bot.' }
      ]
    });
  }
}
