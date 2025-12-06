export default async function handler(req, res) {
  // Configurações
  const GATEWAY_API = "https://www.pagamentos-seguros.app/api-pix/DHen6fi21EJLygcTXa3BAeMLQrhjeiFpInjCouCDVxEExnp_627WhTHG9HxoGbpm0FG5wtGfL-ebfcSqFTe-Ag";

  // Configuração CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { acao } = req.query;

  if (!acao) {
    return res.status(400).json({ erro: 1, erroMsg: "Ação não especificada" });
  }

  try {
    let endpoint = "";
    let queryParams = new URLSearchParams();
    let method = "GET";
    let body = null;

    if (acao === "criar") {
      method = "POST";
      
      const { nome, email, telefone, cpf, utm, up, valor } = req.query;

      // Lógica de oferta baseada no 'up'
      let ofertaNome = "Depósito";
      const upInt = parseInt(up);
      
      if (up && !isNaN(upInt)) {
        ofertaNome = `Depósito Bônus ${upInt}`;
      }

      // Validação básica
      if (!nome || !telefone || !cpf) {
        return res.status(400).json({ erro: 1, erroMsg: "Parâmetros obrigatórios faltando" });
      }

      // Formata valor
      let valorFormatado = valor;
      if (typeof valor === 'string') {
        valorFormatado = valor.replace('.', '').replace(',', '');
      }
      
      const postfields = {
        utm: utm || "",
        item: {
          price: parseInt(valorFormatado),
          title: ofertaNome,
          quantity: 1
        },
        amount: parseInt(valorFormatado),
        customer: {
          name: nome,
          email: email,
          phone: telefone,
          document: cpf
        },
        description: "Pagamento via Pix",
        paymentMethod: "PIX"
      };

      body = JSON.stringify(postfields);

    } else if (acao === "verificar") {
      const { payment_id } = req.query;
      if (!payment_id) {
        return res.status(400).json({ erro: 1, erroMsg: "Payment ID faltando" });
      }
      queryParams.append("transactionId", payment_id);
    } else {
      return res.status(400).json({ erro: 1, erroMsg: "Ação desconhecida" });
    }

    // Monta URL final
    const apiUrl = `${GATEWAY_API}${endpoint}?${queryParams.toString()}`;

    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    if (body) {
      options.body = body;
    }

    const response = await fetch(apiUrl, options);
    const data = await response.json();

    // Normaliza resposta para o frontend
    if (acao === "criar") {
        if (data.transactionId) {
            return res.status(200).json({
                payment_id: data.transactionId,
                pixCode: data.pixCode,
                status: data.status
            });
        } else if (data.message) {
             return res.status(400).json({ erro: 1, erroMsg: data.message });
        }
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Erro no gateway:", error);
    return res.status(500).json({ erro: 1, erroMsg: "Erro interno no servidor: " + error.message });
  }
}
