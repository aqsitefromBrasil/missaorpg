// Controla se a missão está aceitando capturas no momento
let missaoAberta = false;

// Armazena os nicks únicos capturados
let participantes = new Set();

// ==========================================
// LISTA DE ADMINISTRADORES AUTORIZADOS
// ==========================================
const ADMINS_AUTORIZADOS = new Set([
  '558591197017',
  '5585991197017',
  '5521971835736',
  '552171835736',
  '5599991913839',
  '559991913839'
]);

// Tabela de pesos dos emojis para ordenar do menor para o maior rank
const PESO_RANKS = {
  '✴️': 1, // Rank E
  '🈸': 2, // Rank D
  '🉑': 3, // Rank C
  '🔆': 4, // Rank B
  '⚜️': 5, // Rank A
  '🔱': 6  // Rank S
};

// Regex para validar o modelo: "Nome + Espaço + Emoji do Rank"
const PADRAO_NICK_RANK = /^([A-Za-zÀ-ÖØ-öø-ÿ0-9_'-]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ0-9_'-]+)*)\s+([✴️🈸🉑🔆⚜️🔱])$/u;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const data = req.body;
    const sender = data?.query?.sender?.trim() || '';
    const message = data?.query?.message?.trim() || '';
    const comando = message.toLowerCase();

    const senderPhone = (data?.query?.senderPhone || data?.query?.author || '').replace(/\D/g, '');

    const ehComando =
      comando === '/iniciarmissao' ||
      comando === '/fecharmissao' ||
      comando === '!lista' ||
      comando === '/limpar';
if (ehComando) {
      const ehAdm = ADMINS_AUTORIZADOS.has(senderPhone);

      if (!ehAdm) {
        return res.status(200).json({
          replies: [
            { message: `⚠️ *${sender}*, seu número detectado foi: *${senderPhone}*. Você não é reconhecido como ADM.` }
          ]
        });
      }
    }
      if (!ehAdm) {
        return res.status(200).json({
          replies: [
            { message: `⚠️ *${sender}*, apenas membros da Equipe Gestora podem usar este comando.` }
          ]
        });
      }
    }

    // ==========================================
    // 1. COMANDOS DE CONTROLE DA MISSÃO (Apenas ADMs)
    // ==========================================
    if (comando === '/iniciarmissao') {
      missaoAberta = true;
      participantes.clear();
      return res.status(200).json({
        replies: [
          { message: '🟢 *Missão Iniciada!* O bot agora está capturando as comprovações no modelo oficial.' }
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
        const match = item.match(PADRAO_NICK_RANK);
        return {
          textoCompleto: item,
          nick: match ? match[1].trim() : item,
          emoji: match ? match[2] : '✴️',
          peso: match && PESO_RANKS[match[2]] ? PESO_RANKS[match[2]] : 1
        };
      });

      listaArray.sort((a, b) => {
        if (b.peso !== a.peso) {
          return b.peso - a.peso;
        }
        return a.nick.localeCompare(b.nick, 'pt-BR', { sensitivity: 'base' });
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
    if (PADRAO_NICK_RANK.test(sender)) {
      nickValido = sender;
    } else if (PADRAO_NICK_RANK.test(message)) {
      nickValido = message;
    }

    if (nickValido) {
      // Se ainda não estava na lista, adiciona e reage com ✅ na mensagem do jogador
      if (!participantes.has(nickValido)) {
        participantes.add(nickValido);
        
        return res.status(200).json({
          replies: [
            {
              reaction: "✅" // O AutoResponder vai dar a reação de correto na mensagem enviada
            }
          ]
        });
      } else {
        // Se o mesmo jogador mandar de novo, podemos dar uma reação neutra ou só ignorar
        // Aqui deixamos sem resposta para não spammar se ele mandar a print duplicada
        return res.status(200).json({ replies: [] });
      }
    }

    return res.status(200).json({ replies: [] });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.status(500).json({ replies: [] });
  }
}
