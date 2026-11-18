module.exports = function (req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  const textoRecebido = (req.query && req.query.msg) || (req.body && req.body.message) || 'NADA RECEBIDO';
  
  return res.status(200).json({
    replies: [
      { message: '🤖 *TESTE OK!* O servidor recebeu: ' + textoRecebido }
    ]
  });
};
