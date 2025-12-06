/**
 * API centralizada para verificação de pagamento
 *
 * Este arquivo pode ser incluído em qualquer página de pagamento
 * e sempre usará os endpoints centralizados
 */

(function () {
  "use strict";

  // Detecta o caminho base baseado na estrutura de pastas
  function getBasePath() {
    const path = window.location.pathname;

    // Remove a barra inicial e divide o path
    const parts = path.split("/").filter((p) => p);

    // Se está em uma subpasta (upsell1/pagamento/, upsell2/pagamento/, etc)
    if (path.includes("/upsell") && path.includes("/pagamento/")) {
      // Conta quantos níveis acima precisa subir para chegar na raiz
      // Exemplo: /TikTokPay/upsell1/pagamento/index.html
      // parts = ['TikTokPay', 'upsell1', 'pagamento', 'index.html']
      // Precisa subir 2 níveis (../..) para chegar em TikTokPay/
      // Depois adiciona 'pagamento/'
      const upsellIndex = parts.findIndex((p) => p.startsWith("upsell"));
      if (upsellIndex !== -1) {
        // Se está em upsellX/pagamento/, precisa subir 2 níveis
        return "../../pagamento/";
      }
    }

    // Se está na pasta pagamento raiz (não dentro de upsell)
    // Exemplo: /TikTokPay/pagamento/index.html
    if (path.includes("/pagamento/") && !path.includes("/upsell")) {
      return "";
    }

    // Fallback: assume que está na raiz e precisa ir para pagamento/
    return "pagamento/";
  }

  const BASE_PATH = getBasePath();

  /**
   * Verifica o status de um pagamento
   * @param {string} transactionId - ID da transação
   * @param {string|null} paymentId - ID do pagamento (opcional)
   * @returns {Promise} Promise com os dados do pagamento
   */
  window.verifyPayment = function (transactionId, paymentId = null) {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {};

    // Captura parâmetros UTM
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ].forEach((key) => {
      if (urlParams.has(key)) {
        utmParams[key] = urlParams.get(key);
      }
    });

    const requestData = {
      id: transactionId,
      ...(paymentId && { payment_id: paymentId }),
      ...(Object.keys(utmParams).length > 0 && { utmQuery: utmParams }),
    };

    const verifyUrl = BASE_PATH + "verifyPayment.php";

    console.log("📤 Verificando pagamento:", {
      url: verifyUrl,
      data: requestData,
    });

    return fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(`HTTP ${response.status}: ${text}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("📥 Resposta da verificação:", data);
        return data;
      })
      .catch((error) => {
        console.error("❌ Erro ao verificar pagamento:", error);
        throw error;
      });
  };

  /**
   * Verifica se o pagamento está pago
   * @param {Object} data - Dados retornados pela verificação
   * @returns {boolean}
   */
  window.isPaymentPaid = function (data) {
    return (
      data.paid === true ||
      data.status === "completed" ||
      data.status === "COMPLETED" ||
      data.status === "paid" ||
      data.status === "PAID" ||
      data.status === "approved" ||
      data.status === "APPROVED" ||
      data.status === "confirmado" ||
      data.status === "CONFIRMADO" ||
      data.status === "aprovado" ||
      data.status === "APROVADO" ||
      data.status === "pago" ||
      data.status === "PAGO"
    );
  };

  /**
   * Identifica qual produto/upsell baseado na URL
   * @returns {string} Identificador do produto (ex: 'upsell1', 'upsell3', 'pagamento')
   */
  function identifyProductFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/\/upsell(\d+)\//);
    if (match) {
      return "upsell" + match[1];
    }
    if (path.includes("/pagamento/") && !path.includes("/upsell")) {
      return "pagamento";
    }
    return "pagamento"; // fallback
  }

  /**
   * Garante que TODOS os parâmetros UTM (incluindo ttclid) estejam presentes na URL atual
   * Se não estiverem na URL mas estiverem no localStorage, adiciona à URL
   * Isso garante que todos os parâmetros UTM estarão sempre disponíveis para captura
   * IMPORTANTE: Preserva todos os parâmetros UTMify (utm_source, utm_medium, utm_campaign, utm_term, utm_content, ttclid, etc)
   */
  function ensureTtclidInUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    let urlUpdated = false;

    // Lista de todos os parâmetros UTM que devem ser preservados
    const utmFields = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ttclid",
      "click_id",
      "fbclid",
      "gclid",
      "msclkid"
    ];

    // Tenta obter do localStorage
    try {
      const storedUtm = localStorage.getItem("utm_params");
      if (storedUtm) {
        const utmData = JSON.parse(storedUtm);

        // Para cada parâmetro UTM, verifica se está na URL
        // Se não estiver, adiciona do localStorage
        utmFields.forEach((param) => {
          const valueInUrl = urlParams.get(param);
          const valueInStorage = utmData[param] || null;

          // Se não está na URL mas está no localStorage, adiciona
          if (!valueInUrl && valueInStorage) {
            urlParams.set(param, valueInStorage);
            urlUpdated = true;
            console.log(`✅✅✅ ${param} adicionado à URL do localStorage:`, valueInStorage);
          }
        });

        // Se algum parâmetro foi adicionado, atualiza a URL
        if (urlUpdated) {
          const newUrl = window.location.pathname + "?" + urlParams.toString() + window.location.hash;
          window.history.replaceState({}, "", newUrl);
          console.log("✅✅✅ Parâmetros UTM adicionados à URL para garantir captura!");
        }
      }
    } catch (e) {
      console.warn("Erro ao garantir parâmetros UTM na URL:", e);
    }
  }

  /**
   * Extrai ttclid da URL ou de outras fontes
   * @returns {string|null} TikTok Click ID ou null
   */
  function getTtclidFromUrl() {
    let ttclid = null;

    // 1. Tenta da URL atual (prioridade máxima)
    const urlParams = new URLSearchParams(window.location.search);
    ttclid = urlParams.get("ttclid") || urlParams.get("click_id") || null;

    if (ttclid) {
      console.log("✅ ttclid encontrado na URL:", ttclid);
      // Salva imediatamente para preservar
      try {
        const currentUtm = JSON.parse(localStorage.getItem("utm_params") || "{}");
        currentUtm.ttclid = ttclid;
        currentUtm.click_id = ttclid;
        localStorage.setItem("utm_params", JSON.stringify(currentUtm));
      } catch (e) {
        console.warn("Erro ao salvar ttclid:", e);
      }
      return ttclid;
    }

    // 2. Tenta do localStorage (pode ter sido salvo anteriormente)
    try {
      const storedUtm = localStorage.getItem("utm_params");
      if (storedUtm) {
        const utmData = JSON.parse(storedUtm);
        ttclid = utmData.ttclid || utmData.click_id || null;
        if (ttclid) {
          console.log("✅ ttclid encontrado no localStorage:", ttclid);
          return ttclid;
        }
      }
    } catch (e) {
      console.warn("Erro ao ler localStorage:", e);
    }

    // 3. Tenta do sessionStorage também
    try {
      const sessionUtm = sessionStorage.getItem("utm_params");
      if (sessionUtm) {
        const utmData = JSON.parse(sessionUtm);
        ttclid = utmData.ttclid || utmData.click_id || null;
        if (ttclid) {
          console.log("✅ ttclid encontrado no sessionStorage:", ttclid);
          // Migra para localStorage para persistir
          try {
            const currentUtm = JSON.parse(localStorage.getItem("utm_params") || "{}");
            currentUtm.ttclid = ttclid;
            currentUtm.click_id = ttclid;
            localStorage.setItem("utm_params", JSON.stringify(currentUtm));
          } catch (e) {
            console.warn("Erro ao migrar ttclid para localStorage:", e);
          }
          return ttclid;
        }
      }
    } catch (e) {
      console.warn("Erro ao ler sessionStorage:", e);
    }

    // 4. Tenta do cookie (alguns sistemas salvam assim)
    try {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === "ttclid" || name === "click_id") {
          ttclid = decodeURIComponent(value);
          if (ttclid) {
            console.log("✅ ttclid encontrado no cookie:", ttclid);
            // Salva no localStorage
            try {
              const currentUtm = JSON.parse(localStorage.getItem("utm_params") || "{}");
              currentUtm.ttclid = ttclid;
              currentUtm.click_id = ttclid;
              localStorage.setItem("utm_params", JSON.stringify(currentUtm));
            } catch (e) {
              console.warn("Erro ao salvar ttclid do cookie:", e);
            }
            return ttclid;
          }
        }
      }
    } catch (e) {
      console.warn("Erro ao ler cookies:", e);
    }

    // 5. Tenta do referrer (última tentativa)
    if (!ttclid && document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        ttclid = referrerUrl.searchParams.get("ttclid") || referrerUrl.searchParams.get("click_id");
        if (ttclid) {
          console.log("✅ ttclid encontrado no referrer:", ttclid);
          // Salva no localStorage
          try {
            const currentUtm = JSON.parse(localStorage.getItem("utm_params") || "{}");
            currentUtm.ttclid = ttclid;
            currentUtm.click_id = ttclid;
            localStorage.setItem("utm_params", JSON.stringify(currentUtm));
          } catch (e) {
            console.warn("Erro ao salvar ttclid do referrer:", e);
          }
          return ttclid;
        }
      } catch (e) {
        console.warn("Erro ao ler referrer:", e);
      }
    }

    if (!ttclid) {
      console.error("❌ ttclid NÃO ENCONTRADO em nenhuma fonte! Evento pode não ser atribuído à campanha.");
    }

    return ttclid;
  }

  /**
   * Mapeia identificador de produto para content_id do TikTok
   * @param {string} productIdentifier - Identificador do produto
   * @returns {string} Content ID do TikTok
   */
  function getContentIdForProduct(productIdentifier) {
    const productMap = {
      pagamento: "tiktokpay_main",
      upsell1: "tiktokpay_upsell1",
      upsell3: "tiktokpay_upsell3",
      upsell4: "tiktokpay_upsell4",
      upsell5: "tiktokpay_upsell5",
      upsell6: "tiktokpay_upsell6",
      upsell7: "tiktokpay_upsell7",
      upsell8: "tiktokpay_upsell8",
      upsell9: "tiktokpay_upsell9",
      upsell10: "tiktokpay_upsell10",
    };
    return productMap[productIdentifier] || "tiktokpay_main";
  }

  /**
   * Função para hash SHA-256 (para dados PII)
   * @param {string} message - Mensagem para hash
   * @returns {Promise<string>} Hash SHA-256 em hexadecimal
   */
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  }

  /**
   * Identifica usuário com dados PII (hash SHA-256)
   * @param {Object} options - Opções do evento
   * @param {string} [options.email] - Email do cliente (será hasheado)
   * @param {string} [options.phone_number] - Telefone do cliente (será hasheado)
   * @param {string} [options.external_id] - ID externo do cliente (será hasheado)
   */
  window.trackTikTokIdentify = async function (options) {
    // Garante que ttq existe (pode ser array ou objeto)
    if (typeof window.ttq === "undefined") {
      window.ttq = [];
    }

    const identifyData = {};

    // Normaliza email - usa string vazia se inválido (não faz hash de string vazia)
    const normalizedEmail = normalizeEmail(options.email || "");
    if (normalizedEmail) {
      try {
        identifyData.email = await sha256(normalizedEmail);
      } catch (error) {
        console.error("Erro ao fazer hash do email:", error);
      }
    }

    // Normaliza telefone para E.164 antes de fazer hash
    const normalizedPhone = formatPhoneToE164(options.phone_number || "");
    if (normalizedPhone) {
      try {
        // Remove o + antes de fazer hash
        const phoneForHash = normalizedPhone.replace(/^\+/, "");
        identifyData.phone_number = await sha256(phoneForHash);
      } catch (error) {
        console.error("Erro ao fazer hash do telefone:", error);
      }
    }

    // External ID - normaliza antes de fazer hash
    if (options.external_id) {
      const externalId = String(options.external_id).trim();
      if (externalId) {
        try {
          identifyData.external_id = await sha256(externalId);
        } catch (error) {
          console.error("Erro ao fazer hash do external_id:", error);
        }
      }
    }

    if (Object.keys(identifyData).length > 0) {
      // Função para disparar o identify
      function dispatchIdentify() {
        if (
          typeof window.ttq !== "undefined" &&
          typeof window.ttq.identify === "function"
        ) {
          window.ttq.identify(identifyData);
          console.log("✅ TikTok Identify enviado:", identifyData);
        } else {
          // Se identify não existe ainda, adiciona à fila
          window.ttq.push(["identify", identifyData]);
          console.log("✅ TikTok Identify adicionado à fila:", identifyData);
        }
      }

      // Tenta usar ready() se disponível, senão dispara diretamente
      if (
        typeof window.ttq !== "undefined" &&
        typeof window.ttq.ready === "function"
      ) {
        window.ttq.ready(function () {
          dispatchIdentify();
        });
      } else {
        // Dispara diretamente (funciona tanto na fila quanto quando carregado)
        dispatchIdentify();
      }
    }
  };

  /**
   * Gera um event_id único para eventos do TikTok
   * @param {string} prefix - Prefixo para o event_id (ex: "purchase", "checkout", "view")
   * @returns {string} Event ID único (garantido não vazio e sem espaços)
   */
  function generateEventId(prefix = "event") {
    // Normaliza o prefix: remove espaços e garante que não seja vazio
    let normalizedPrefix = String(prefix || "event").trim().replace(/\s+/g, "");

    // Se o prefix normalizado for vazio, usa "event" como padrão
    if (!normalizedPrefix || normalizedPrefix.length === 0) {
      normalizedPrefix = "event";
    }

    // Gera componentes do event_id
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 15);
    const random3 = Math.random().toString(36).substring(2, 10);

    // Constrói o event_id sem espaços
    let eventId = `${normalizedPrefix}_${timestamp}_${random1}${random2}${random3}`;

    // Remove TODOS os espaços (incluindo espaços no meio)
    eventId = eventId.replace(/\s+/g, "");

    // Validação final: garante que o event_id tenha pelo menos 10 caracteres válidos
    if (!eventId || eventId.length < 10) {
      // Fallback robusto: gera um novo ID garantidamente válido
      const fallbackTimestamp = Date.now();
      const fallbackRandom = Math.random().toString(36).substring(2, 20);
      const fallbackRandom2 = Math.random().toString(36).substring(2, 20);
      eventId = `event_${fallbackTimestamp}_${fallbackRandom}${fallbackRandom2}`.replace(/\s+/g, "");
    }

    // Validação final crítica: se ainda estiver vazio ou inválido, força um valor
    if (!eventId || eventId.trim().length === 0 || eventId.replace(/[^a-zA-Z0-9_]/g, "").length < 5) {
      // Último recurso: gera um ID simples mas garantidamente válido
      eventId = `evt_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    }

    // Retorna o event_id sem espaços e validado
    return eventId.replace(/\s+/g, "");
  }

  /**
   * Formata telefone para formato E.164 (padrão internacional)
   * @param {string} phone - Número de telefone
   * @returns {string} Telefone formatado em E.164 ou string vazia
   */
  function formatPhoneToE164(phone) {
    if (!phone) return "";

    // Remove todos os caracteres não numéricos
    let cleaned = phone.toString().replace(/\D/g, "");

    // Se estiver vazio após limpeza, retorna string vazia
    if (!cleaned || cleaned.length === 0) return "";

    // Se já começar com +, mantém
    if (phone.toString().trim().startsWith("+")) {
      cleaned = phone.toString().trim().replace(/\D/g, "");
      if (cleaned.length > 0 && cleaned[0] !== "+") {
        cleaned = "+" + cleaned;
      }
      return cleaned;
    }

    // Se não tiver código do país e for número brasileiro (10 ou 11 dígitos), adiciona +55
    if (cleaned.length === 10 || cleaned.length === 11) {
      // Remove o 0 inicial se houver (formato antigo brasileiro)
      if (cleaned.length === 11 && cleaned[0] === "0") {
        cleaned = cleaned.substring(1);
      }
      return "+55" + cleaned;
    }

    // Se já tiver código do país (mais de 11 dígitos), adiciona +
    if (cleaned.length > 11) {
      return "+" + cleaned;
    }

    // Fallback: retorna como está com +
    return "+" + cleaned;
  }

  /**
   * Normaliza email - retorna string vazia se inválido
   * @param {string} email - Email para normalizar
   * @returns {string} Email válido ou string vazia
   */
  function normalizeEmail(email) {
    if (!email) return "";

    const emailStr = email.toString().trim();

    // Se for vazio, undefined, null ou apenas espaços, retorna string vazia
    if (!emailStr || emailStr.length === 0) return "";

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      return ""; // Retorna string vazia se email inválido
    }

    return emailStr.toLowerCase();
  }

  /**
   * Obtém User Agent do navegador
   * @returns {string} User Agent ou string vazia
   */
  function getUserAgent() {
    if (typeof navigator !== "undefined" && navigator.userAgent) {
      return navigator.userAgent;
    }
    return "";
  }

  /**
   * Obtém IP address (o TikTok pode obter automaticamente, mas incluímos se disponível)
   * @returns {string} IP address ou string vazia
   */
  function getIPAddress() {
    // O TikTok geralmente obtém o IP automaticamente do servidor
    // Mas podemos tentar obter via WebRTC se necessário
    // Por enquanto, retornamos vazio e deixamos o TikTok obter automaticamente
    return "";
  }

  /**
   * Prepara dados do cliente para EMQ (Enhanced Match Quality)
   * @param {Object} customer - Dados do cliente
   * @returns {Object} Dados normalizados para EMQ
   */
  function prepareEMQData(customer = {}) {
    const emqData = {};

    // Email: normaliza e retorna string vazia se inválido
    emqData.email = normalizeEmail(customer.email);

    // Telefone: formata para E.164
    emqData.phone_number = formatPhoneToE164(customer.phone);

    // External ID: usa documento se disponível
    if (customer.document) {
      emqData.external_id = customer.document.toString().trim();
    } else {
      emqData.external_id = "";
    }

    // User Agent
    emqData.user_agent = getUserAgent();

    // IP Address (geralmente obtido automaticamente pelo TikTok)
    const ipAddress = getIPAddress();
    if (ipAddress) {
      emqData.ip = ipAddress;
    }

    return emqData;
  }

  /**
   * Mapeia content_id para content_name (nome do produto)
   * @param {string} contentId - Content ID do produto
   * @returns {string} Nome do produto
   */
  function getContentNameForProduct(contentId) {
    const nameMap = {
      tiktokpay_main: "Taxa de confirmação de identidade",
      tiktokpay_upsell1: "Taxa de transferência de saldo",
      tiktokpay_upsell3: "Tarifa simbólica anti-fraude",
      tiktokpay_upsell4: "Antecipação de saque",
      tiktokpay_upsell5: "Liberação de bônus extra",
      tiktokpay_upsell6: "Proteção anti-reversão",
      tiktokpay_upsell7: "Recebimento imediato",
      tiktokpay_upsell8: "Liberação de saldo retido em revisão",
      tiktokpay_upsell9: "Garantia total de liberação",
      tiktokpay_upsell10: "Conversão em saldo duplicado",
    };
    return nameMap[contentId] || "Produto TikTokPay";
  }

  /**
   * Aguarda o pixel TikTok estar completamente carregado
   * @param {number} maxWait - Tempo máximo de espera em ms (padrão: 5000ms)
   * @returns {Promise} Promise que resolve quando o pixel está carregado
   */
  function waitForTikTokPixel(maxWait = 5000) {
    return new Promise(function (resolve, reject) {
      const startTime = Date.now();

      function checkPixel() {
        // Verifica se o script do pixel foi carregado
        const scriptLoaded = document.querySelector(
          'script[src*="analytics.tiktok.com/i18n/pixel/events.js"]'
        );

        // Verifica se ttq.track está disponível como função
        const trackAvailable =
          typeof window.ttq !== "undefined" &&
          typeof window.ttq.track === "function";

        if (trackAvailable || scriptLoaded) {
          console.log("✅ Pixel TikTok detectado como carregado");
          resolve();
          return;
        }

        // Verifica timeout
        if (Date.now() - startTime > maxWait) {
          console.warn(
            "⚠️ Timeout aguardando pixel TikTok, mas continuando mesmo assim..."
          );
          resolve(); // Resolve mesmo assim para não bloquear
          return;
        }

        // Tenta novamente após 100ms
        setTimeout(checkPixel, 100);
      }

      checkPixel();
    });
  }

  /**
   * Dispara evento InitiateCheckout do TikTok Pixel via navegador
   * @param {Object} options - Opções do evento
   * @param {string} options.transactionId - ID da transação
   * @param {number} options.amount - Valor em reais
   * @param {Object} options.customer - Dados do cliente {email, phone, name, document}
   * @param {string} [options.contentId] - Content ID do produto (opcional, será detectado automaticamente)
   * @param {string} [options.contentName] - Nome do produto (opcional, será detectado automaticamente)
   */
  window.trackTikTokInitiateCheckout = function (options) {
    // Garante que ttq existe (pode ser array ou objeto)
    if (typeof window.ttq === "undefined") {
      window.ttq = [];
    }

    // Identifica produto automaticamente se não fornecido
    const productIdentifier = identifyProductFromUrl();
    const contentId =
      options.contentId || getContentIdForProduct(productIdentifier);
    const contentName =
      options.contentName || getContentNameForProduct(contentId);

    // Captura ttclid para incluir no evento
    const ttclid = getTtclidFromUrl();

    // Gera event_id único para evitar duplicação
    // Valida se options.event_id é válido (não vazio e não apenas espaços)
    let eventId = options.event_id;
    if (!eventId || typeof eventId !== "string" || eventId.trim().replace(/\s+/g, "").length === 0) {
      eventId = generateEventId("checkout");
    } else {
      // Remove espaços e valida novamente
      eventId = eventId.replace(/\s+/g, "");
      if (eventId.length === 0) {
        eventId = generateEventId("checkout");
      }
    }

    const eventData = {
      contents: [
        {
          content_id: contentId,
          content_type: "product",
          content_name: contentName,
        },
      ],
      value: parseFloat(options.amount) || 0,
      currency: options.currency || "BRL",
      event_id: eventId,
    };

    // Prepara dados EMQ (Enhanced Match Quality)
    const emqData = options.customer ? prepareEMQData(options.customer) : prepareEMQData({});

    // Adiciona dados EMQ ao evento - SEMPRE inclui, mesmo que vazio (string vazia)
    // Isso garante cobertura >90% conforme recomendação do TikTok
    eventData.email = emqData.email || ""; // String vazia se não disponível
    eventData.phone_number = emqData.phone_number || ""; // String vazia se não disponível
    eventData.external_id = emqData.external_id || ""; // String vazia se não disponível

    // User Agent - sempre inclui se disponível
    if (emqData.user_agent) {
      eventData.user_agent = emqData.user_agent;
    }

    // Adiciona ttclid (Click ID) no nível raiz - TikTok precisa para atribuição de campanha
    // IMPORTANTE: ttclid deve estar no nível raiz, não em properties
    if (ttclid) {
      eventData.ttclid = ttclid;
      console.log("🔗 ttclid incluído no InitiateCheckout:", ttclid);
    } else {
      console.warn("⚠️ ttclid não encontrado - evento pode não ser atribuído à campanha!");
    }

    console.log("🆔 Event ID gerado para InitiateCheckout:", eventId);
    console.log("📊 Dados EMQ:", {
      email: eventData.email ? "✓" : "✗ (vazio)",
      phone: eventData.phone_number ? "✓" : "✗ (vazio)",
      external_id: eventData.external_id ? "✓" : "✗ (vazio)",
      user_agent: eventData.user_agent ? "✓" : "✗",
      ttclid: eventData.ttclid ? "✓" : "✗ (AUSENTE - CRÍTICO!)"
    });

    console.log("📊 Disparando TikTok InitiateCheckout:", eventData);
    console.log("🔍 Estado do ttq:", {
      existe: typeof window.ttq !== "undefined",
      tipo: typeof window.ttq,
      temTrack: typeof window.ttq.track,
      temReady: typeof window.ttq.ready,
      isArray: Array.isArray(window.ttq),
    });

    // Função para disparar o evento
    function dispatchEvent() {
      try {
        // Verifica se ttq.track é uma função (pixel carregou)
        if (
          typeof window.ttq !== "undefined" &&
          typeof window.ttq.track === "function"
        ) {
          // Pixel carregou, usa track() diretamente
          window.ttq.track("InitiateCheckout", eventData);
          console.log(
            "✅ TikTok InitiateCheckout enviado via track():",
            eventData
          );
          console.log("✅ Verifique no Pixel Helper se o evento apareceu!");
          return true;
        } else if (Array.isArray(window.ttq)) {
          // Pixel ainda não carregou, adiciona à fila
          window.ttq.push(["track", "InitiateCheckout", eventData]);
          console.log(
            "✅ TikTok InitiateCheckout adicionado à fila (será processado quando pixel carregar):",
            eventData
          );
          console.log("📋 Fila atual:", window.ttq);
          return true;
        } else {
          // Caso especial: ttq existe mas não é array nem tem track
          console.warn(
            "⚠️ ttq existe mas não tem formato esperado, tentando push..."
          );
          if (typeof window.ttq.push === "function") {
            window.ttq.push(["track", "InitiateCheckout", eventData]);
            console.log(
              "✅ TikTok InitiateCheckout adicionado via push():",
              eventData
            );
            return true;
          } else {
            // Último recurso: tenta criar array e adicionar
            window.ttq = window.ttq || [];
            window.ttq.push(["track", "InitiateCheckout", eventData]);
            console.log(
              "✅ TikTok InitiateCheckout adicionado (fallback):",
              eventData
            );
            return true;
          }
        }
      } catch (error) {
        console.error("❌ Erro ao disparar InitiateCheckout:", error);
        console.error("Stack:", error.stack);
        // Fallback: tenta adicionar à fila mesmo com erro
        try {
          if (typeof window.ttq === "undefined") {
            window.ttq = [];
          }
          window.ttq.push(["track", "InitiateCheckout", eventData]);
          console.log(
            "✅ TikTok InitiateCheckout adicionado à fila (fallback após erro):",
            eventData
          );
          return true;
        } catch (e) {
          console.error("❌ Erro crítico ao adicionar à fila:", e);
          return false;
        }
      }
    }

    // Estratégia múltipla para garantir que o evento seja disparado
    let eventDispatched = false;

    // 1. Primeiro, adiciona à fila imediatamente (sempre funciona)
    console.log("⚡ Adicionando evento à fila imediatamente...");
    eventDispatched = dispatchEvent();

    // 2. Aguarda pixel carregar e tenta disparar diretamente
    waitForTikTokPixel(3000).then(function () {
      // Tenta usar ready() se disponível
      if (
        typeof window.ttq !== "undefined" &&
        typeof window.ttq.ready === "function"
      ) {
        console.log("⏳ Aguardando pixel carregar via ready()...");
        window.ttq.ready(function () {
          console.log(
            "✅ Pixel carregado via ready()! Disparando evento diretamente..."
          );
          // Dispara diretamente também para garantir
          if (
            typeof window.ttq !== "undefined" &&
            typeof window.ttq.track === "function"
          ) {
            try {
              window.ttq.track("InitiateCheckout", eventData);
              console.log(
                "✅ InitiateCheckout disparado diretamente via track()!"
              );
            } catch (e) {
              console.error("❌ Erro ao disparar diretamente:", e);
            }
          }
        });
      } else {
        // Se ready() não existe, tenta disparar diretamente se track() estiver disponível
        if (
          typeof window.ttq !== "undefined" &&
          typeof window.ttq.track === "function"
        ) {
          try {
            window.ttq.track("InitiateCheckout", eventData);
            console.log(
              "✅ InitiateCheckout disparado diretamente via track()!"
            );
          } catch (e) {
            console.error("❌ Erro ao disparar diretamente:", e);
          }
        }
      }
    });

    // Se tem dados do cliente, também identifica
    if (options.customer) {
      window.trackTikTokIdentify({
        email: options.customer.email,
        phone_number: options.customer.phone,
        external_id: options.customer.document,
      });
    }
  };

  /**
   * Dispara evento Purchase do TikTok Pixel via navegador
   * @param {Object} options - Opções do evento
   * @param {string} options.transactionId - ID da transação
   * @param {number} options.amount - Valor em reais
   * @param {Object} [options.customer] - Dados do cliente {email, phone, name, document}
   * @param {string} [options.contentId] - Content ID do produto (opcional, será detectado automaticamente)
   * @param {string} [options.contentName] - Nome do produto (opcional, será detectado automaticamente)
   */
  window.trackTikTokPurchase = function (options) {
    // Garante que ttq existe (pode ser array ou objeto)
    if (typeof window.ttq === "undefined") {
      window.ttq = [];
    }

    // CRÍTICO: Garante que o ttclid esteja na URL antes de tentar capturar
    // Isso aumenta drasticamente as chances de captura bem-sucedida
    ensureTtclidInUrl();

    // Identifica produto automaticamente se não fornecido
    const productIdentifier = identifyProductFromUrl();
    const contentId =
      options.contentId || getContentIdForProduct(productIdentifier);
    const contentName =
      options.contentName || getContentNameForProduct(contentId);

    // Captura ttclid para incluir no evento
    // IMPORTANTE: Usa let para permitir reatribuição se necessário
    let ttclid = getTtclidFromUrl();

    // Se não encontrou, tenta múltiplas fontes com prioridade
    if (!ttclid) {
      console.log("🔄 ttclid não encontrado na primeira tentativa, tentando outras fontes...");

      // Tenta ler diretamente do localStorage (pode ter sido salvo pelo UTMify ou código anterior)
      try {
        const storedUtm = localStorage.getItem("utm_params");
        if (storedUtm) {
          const utmData = JSON.parse(storedUtm);
          ttclid = utmData.ttclid || utmData.click_id || null;
          if (ttclid) {
            console.log("✅ ttclid encontrado no localStorage (segunda tentativa):", ttclid);
          }
        }
      } catch (e) {
        console.warn("Erro ao ler localStorage na segunda tentativa:", e);
      }

      // Se ainda não encontrou, tenta da URL novamente (pode ter sido adicionado dinamicamente)
      if (!ttclid) {
        const urlParams = new URLSearchParams(window.location.search);
        ttclid = urlParams.get("ttclid") || urlParams.get("click_id") || null;
        if (ttclid) {
          console.log("✅ ttclid encontrado na URL (terceira tentativa):", ttclid);
          // Salva imediatamente
          try {
            const currentUtm = JSON.parse(localStorage.getItem("utm_params") || "{}");
            currentUtm.ttclid = ttclid;
            currentUtm.click_id = ttclid;
            localStorage.setItem("utm_params", JSON.stringify(currentUtm));
          } catch (e) {
            console.warn("Erro ao salvar ttclid:", e);
          }
        }
      }
    }

    // Gera order_id único se não fornecido
    const orderId = options.transactionId || options.order_id || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Gera event_id único para evitar duplicação
    // Valida se options.event_id é válido (não vazio e não apenas espaços)
    let eventId = options.event_id;
    if (!eventId || typeof eventId !== "string" || eventId.trim().replace(/\s+/g, "").length === 0) {
      eventId = generateEventId("purchase");
    } else {
      // Remove espaços e valida novamente
      eventId = eventId.replace(/\s+/g, "");
      if (eventId.length === 0) {
        eventId = generateEventId("purchase");
      }
    }

    // Garante que o valor seja um número válido
    const valorVenda = parseFloat(options.amount) || 0;

    const eventData = {
      contents: [
        {
          content_id: contentId,
          content_type: "product",
          content_name: contentName,
          quantity: options.quantity || 1,
        },
      ],
      value: valorVenda,
      currency: options.currency || "BRL",
      event_id: eventId,
    };

    // Adiciona order_id se disponível (alguns formatos do TikTok aceitam)
    if (orderId) {
      eventData.order_id = orderId;
    }

    console.log("🆔 Event ID gerado para Purchase:", eventId);

    // Prepara dados EMQ (Enhanced Match Quality)
    const emqData = options.customer ? prepareEMQData(options.customer) : prepareEMQData({});

    // Adiciona dados EMQ ao evento - SEMPRE inclui, mesmo que vazio (string vazia)
    // Isso garante cobertura >90% conforme recomendação do TikTok
    eventData.email = emqData.email || ""; // String vazia se não disponível
    eventData.phone_number = emqData.phone_number || ""; // String vazia se não disponível
    eventData.external_id = emqData.external_id || ""; // String vazia se não disponível

    // User Agent - sempre inclui se disponível
    if (emqData.user_agent) {
      eventData.user_agent = emqData.user_agent;
    }

    // Adiciona ttclid (Click ID) no nível raiz - TikTok precisa para atribuição de campanha
    // IMPORTANTE: ttclid deve estar no nível raiz, não em properties
    // CRÍTICO: Sem ttclid, o TikTok NÃO consegue atribuir a venda à campanha!
    if (ttclid) {
      eventData.ttclid = ttclid;
      // Também adiciona em properties como backup (alguns formatos aceitam)
      eventData.properties = eventData.properties || {};
      eventData.properties.ttclid = ttclid;
      console.log("🔗✅✅✅ ttclid incluído no Purchase (nível raiz + properties):", ttclid);
      console.log("🔗✅✅✅ Este ttclid é ESSENCIAL para atribuição de campanha no TikTok!");
    } else {
      console.error("❌❌❌ CRÍTICO: ttclid NÃO ENCONTRADO - evento NÃO será atribuído à campanha!");
      console.error("❌ Verifique se o ttclid está sendo passado na URL ou salvo no localStorage");
      console.error("❌ Sem ttclid, as vendas aparecerão como 0 na lista de campanhas do TikTok!");
    }

    console.log("📊 Dados EMQ no Purchase:", {
      email: eventData.email ? "✓" : "✗ (vazio)",
      phone: eventData.phone_number ? "✓" : "✗ (vazio)",
      external_id: eventData.external_id ? "✓" : "✗ (vazio)",
      user_agent: eventData.user_agent ? "✓" : "✗",
      ttclid: eventData.ttclid ? "✓" : "✗ (AUSENTE - CRÍTICO!)"
    });

    console.log("📊 ========================================");
    console.log("📊 DISPARANDO TIKTOK PURCHASE EVENT");
    console.log("📊 Valor:", parseFloat(options.amount) || 0);
    console.log("📊 Moeda:", options.currency || "BRL");
    console.log("📊 Content ID:", contentId);
    console.log("📊 Content Name:", contentName);
    console.log("📊 Order ID:", orderId);
    console.log("📊 Event ID:", eventId);
    console.log("📊 TTCLID:", ttclid || "❌ AUSENTE - CRÍTICO PARA ATRIBUIÇÃO!");
    console.log("📊 Event Data:", JSON.stringify(eventData, null, 2));
    console.log("📊 ========================================");
    console.log("🔍 Estado do ttq:", {
      existe: typeof window.ttq !== "undefined",
      tipo: typeof window.ttq,
      temTrack: typeof window.ttq.track,
      temReady: typeof window.ttq.ready,
      isArray: Array.isArray(window.ttq),
    });

    // Função para disparar o evento
    function dispatchEvent() {
      try {
        // Garante que ttq existe
        if (typeof window.ttq === "undefined") {
          window.ttq = [];
        }

        // Se ttq.track existe como função, usa diretamente
        if (typeof window.ttq.track === "function") {
          window.ttq.track("Purchase", eventData);
          console.log("✅ TikTok Purchase enviado via track():", eventData);
          console.log("✅ Verifique no Pixel Helper se o evento apareceu!");
          return true;
        } else {
          // Se não, adiciona à fila (funciona quando pixel ainda não carregou)
          if (Array.isArray(window.ttq)) {
            window.ttq.push(["track", "Purchase", eventData]);
            console.log("✅ TikTok Purchase adicionado à fila:", eventData);
            console.log("📋 Fila atual do ttq:", window.ttq);
            return true;
          } else {
            // Fallback: converte para array
            window.ttq = [window.ttq];
            window.ttq.push(["track", "Purchase", eventData]);
            console.log("✅ TikTok Purchase adicionado à fila (conversão):", eventData);
            return true;
          }
        }
      } catch (error) {
        console.error("❌ Erro ao disparar Purchase:", error);
        // Fallback: tenta adicionar à fila mesmo com erro
        try {
          if (typeof window.ttq === "undefined") {
            window.ttq = [];
          }
          window.ttq.push(["track", "Purchase", eventData]);
          console.log(
            "✅ TikTok Purchase adicionado à fila (fallback após erro):",
            eventData
          );
          return true;
        } catch (e) {
          console.error("❌ Erro crítico ao adicionar à fila:", e);
          return false;
        }
      }
    }

    // Estratégia múltipla para garantir que o evento seja disparado
    // SEMPRE adiciona à fila primeiro (garante que será processado)
    console.log("⚡ Adicionando Purchase à fila do TikTok Pixel...");
    console.log("🔍 Verificando ttclid antes de disparar:", ttclid || "NÃO ENCONTRADO");

    // Se não tem ttclid no eventData, tenta capturar novamente (última tentativa)
    if (!eventData.ttclid) {
      console.warn("⚠️ ttclid ausente no eventData! Tentando capturar novamente (última tentativa)...");
      ttclid = getTtclidFromUrl();

      // Se ainda não encontrou, tenta localStorage diretamente
      if (!ttclid) {
        try {
          const storedUtm = localStorage.getItem("utm_params");
          if (storedUtm) {
            const utmData = JSON.parse(storedUtm);
            ttclid = utmData.ttclid || utmData.click_id || null;
          }
        } catch (e) {
          console.warn("Erro ao ler localStorage na última tentativa:", e);
        }
      }

      if (ttclid) {
        eventData.ttclid = ttclid;
        if (eventData.properties) {
          eventData.properties.ttclid = ttclid;
        } else {
          eventData.properties = { ttclid: ttclid };
        }
        console.log("✅✅✅ ttclid capturado com sucesso na última tentativa:", ttclid);
        console.log("✅✅✅ Agora o Purchase será atribuído à campanha!");
      } else {
        console.error("❌❌❌ CRÍTICO: ttclid ainda não encontrado após todas as tentativas!");
        console.error("❌❌❌ O Purchase NÃO será atribuído à campanha no TikTok!");
        console.error("❌❌❌ As vendas continuarão aparecendo como 0 na lista de campanhas!");
      }
    }

    // CRÍTICO: Garante que o ttclid está presente antes de enviar
    // Esta é a última chance de adicionar o ttclid antes de enviar o evento
    if (!eventData.ttclid) {
      if (ttclid) {
        eventData.ttclid = ttclid;
        if (!eventData.properties) {
          eventData.properties = {};
        }
        eventData.properties.ttclid = ttclid;
        console.log("🔗✅✅✅ ttclid adicionado ao eventData antes de enviar:", ttclid);
      } else {
        // Última tentativa desesperada: tenta ler do localStorage uma última vez
        try {
          const storedUtm = localStorage.getItem("utm_params");
          if (storedUtm) {
            const utmData = JSON.parse(storedUtm);
            const lastTtclid = utmData.ttclid || utmData.click_id || null;
            if (lastTtclid) {
              eventData.ttclid = lastTtclid;
              if (!eventData.properties) {
                eventData.properties = {};
              }
              eventData.properties.ttclid = lastTtclid;
              console.log("🔗✅✅✅ ttclid encontrado no localStorage (última tentativa):", lastTtclid);
            }
          }
        } catch (e) {
          console.error("❌ Erro na última tentativa de capturar ttclid:", e);
        }
      }
    }

    // Log final do estado do ttclid antes de enviar
    if (eventData.ttclid) {
      console.log("✅✅✅ CONFIRMADO: ttclid presente no Purchase:", eventData.ttclid);
      console.log("✅✅✅ O Purchase SERÁ atribuído à campanha no TikTok!");
    } else {
      console.error("❌❌❌ ALERTA FINAL: ttclid AINDA AUSENTE no Purchase!");
      console.error("❌❌❌ O Purchase NÃO será atribuído à campanha!");
    }

    // Dispara o evento imediatamente
    dispatchEvent();

    // Aguarda pixel carregar e dispara diretamente também para garantir
    waitForTikTokPixel(3000).then(function () {
      if (
        typeof window.ttq !== "undefined" &&
        typeof window.ttq.track === "function"
      ) {
        try {
          // Verifica ttclid novamente antes de disparar
          if (!eventData.ttclid) {
            const lastTtclid = getTtclidFromUrl();
            if (lastTtclid) {
              eventData.ttclid = lastTtclid;
              console.log("✅ ttclid adicionado antes do disparo final:", lastTtclid);
            }
          }

          window.ttq.track("Purchase", eventData);
          console.log(
            "✅ Purchase disparado diretamente após pixel carregar!",
            eventData
          );
          console.log("🔍 TTCLID no evento final:", eventData.ttclid || "AUSENTE");
        } catch (e) {
          console.error("❌ Erro ao disparar após carregar:", e);
        }
      }
    });

    // Tenta usar ready() se disponível para garantir que o evento seja processado
    if (
      typeof window.ttq !== "undefined" &&
      typeof window.ttq.ready === "function"
    ) {
      window.ttq.ready(function () {
        console.log("✅ Pixel TikTok pronto! Disparando Purchase via ready()...");
        try {
          // Verifica ttclid novamente antes de disparar
          if (!eventData.ttclid) {
            const lastTtclid = getTtclidFromUrl();
            if (lastTtclid) {
              eventData.ttclid = lastTtclid;
              console.log("✅ ttclid adicionado antes do ready():", lastTtclid);
            }
          }

          if (typeof window.ttq.track === "function") {
            window.ttq.track("Purchase", eventData);
            console.log("✅ Purchase disparado via ready()!", eventData);
            console.log("🔍 TTCLID no evento ready():", eventData.ttclid || "AUSENTE");
          }
        } catch (e) {
          console.error("❌ Erro ao disparar via ready():", e);
        }
      });
    }

    // Se tem dados do cliente, também identifica com dados EMQ
    if (options.customer) {
      const emqData = prepareEMQData(options.customer);
      window.trackTikTokIdentify({
        email: emqData.email,
        phone_number: emqData.phone_number,
        external_id: emqData.external_id,
      });
    }
  };

  /**
   * Dispara evento ViewContent do TikTok Pixel
   * Deve ser chamado quando o usuário visualiza um produto/página
   * @param {Object} options - Opções do evento
   * @param {string} [options.contentId] - Content ID do produto (opcional, será detectado automaticamente)
   * @param {string} [options.contentName] - Nome do produto (opcional, será detectado automaticamente)
   * @param {number} [options.value] - Valor do produto (opcional)
   * @param {string} [options.currency] - Moeda (padrão: BRL)
   */
  window.trackTikTokViewContent = function (options = {}) {
    // Garante que ttq existe
    if (typeof window.ttq === "undefined") {
      window.ttq = [];
    }

    // Identifica produto automaticamente se não fornecido
    const productIdentifier = identifyProductFromUrl();
    const contentId =
      options.contentId || getContentIdForProduct(productIdentifier);
    const contentName =
      options.contentName || getContentNameForProduct(contentId);

    // Gera event_id único para evitar duplicação
    // Valida se options.event_id é válido (não vazio e não apenas espaços)
    let eventId = options.event_id;
    if (!eventId || typeof eventId !== "string" || eventId.trim().replace(/\s+/g, "").length === 0) {
      eventId = generateEventId("view");
    } else {
      // Remove espaços e valida novamente
      eventId = eventId.replace(/\s+/g, "");
      if (eventId.length === 0) {
        eventId = generateEventId("view");
      }
    }

    const eventData = {
      contents: [
        {
          content_id: contentId,
          content_type: "product",
          content_name: contentName,
        },
      ],
      currency: options.currency || "BRL",
      event_id: eventId,
    };

    // Adiciona valor se fornecido
    if (options.value !== undefined) {
      eventData.value = parseFloat(options.value) || 0;
    }

    console.log("📊 Disparando TikTok ViewContent:", eventData);
    console.log("🆔 Event ID gerado para ViewContent:", eventId);

    // Função para disparar o evento
    function dispatchEvent() {
      try {
        if (typeof window.ttq.track === "function") {
          window.ttq.track("ViewContent", eventData);
          console.log("✅ TikTok ViewContent enviado via track():", eventData);
          return true;
        } else {
          if (Array.isArray(window.ttq)) {
            window.ttq.push(["track", "ViewContent", eventData]);
            console.log("✅ TikTok ViewContent adicionado à fila:", eventData);
            return true;
          }
        }
      } catch (error) {
        console.error("❌ Erro ao disparar ViewContent:", error);
        try {
          if (typeof window.ttq === "undefined") {
            window.ttq = [];
          }
          window.ttq.push(["track", "ViewContent", eventData]);
          return true;
        } catch (e) {
          console.error("❌ Erro crítico ao adicionar ViewContent à fila:", e);
          return false;
        }
      }
    }

    // Dispara imediatamente
    dispatchEvent();

    // Aguarda pixel carregar e dispara novamente para garantir
    waitForTikTokPixel(2000).then(function () {
      if (
        typeof window.ttq !== "undefined" &&
        typeof window.ttq.track === "function"
      ) {
        try {
          window.ttq.track("ViewContent", eventData);
          console.log("✅ ViewContent disparado após pixel carregar!");
        } catch (e) {
          console.error("❌ Erro ao disparar ViewContent após carregar:", e);
        }
      }
    });

    // Usa ready() se disponível
    if (
      typeof window.ttq !== "undefined" &&
      typeof window.ttq.ready === "function"
    ) {
      window.ttq.ready(function () {
        try {
          if (typeof window.ttq.track === "function") {
            window.ttq.track("ViewContent", eventData);
            console.log("✅ ViewContent disparado via ready()!");
          }
        } catch (e) {
          console.error("❌ Erro ao disparar ViewContent via ready():", e);
        }
      });
    }
  };

  /**
   * Dispara evento PageView melhorado do TikTok Pixel
   * Inclui dados contextuais da página
   * @param {Object} options - Opções do evento
   * @param {string} [options.contentId] - Content ID da página (opcional)
   * @param {string} [options.contentName] - Nome da página (opcional)
   */
  window.trackTikTokPageView = function (options = {}) {
    // Garante que ttq existe
    if (typeof window.ttq === "undefined") {
      window.ttq = [];
    }

    // Identifica produto automaticamente se não fornecido
    const productIdentifier = identifyProductFromUrl();
    const contentId =
      options.contentId || getContentIdForProduct(productIdentifier);
    const contentName =
      options.contentName || getContentNameForProduct(contentId);

    // Gera event_id único para evitar duplicação
    // Valida se options.event_id é válido (não vazio e não apenas espaços)
    let eventId = options.event_id;
    if (!eventId || typeof eventId !== "string" || eventId.trim().replace(/\s+/g, "").length === 0) {
      eventId = generateEventId("pageview");
    } else {
      // Remove espaços e valida novamente
      eventId = eventId.replace(/\s+/g, "");
      if (eventId.length === 0) {
        eventId = generateEventId("pageview");
      }
    }

    const eventData = {
      contents: [
        {
          content_id: contentId,
          content_type: "product",
          content_name: contentName,
        },
      ],
      event_id: eventId,
    };

    console.log("📊 Disparando TikTok PageView melhorado:", eventData);
    console.log("🆔 Event ID gerado para PageView:", eventId);

    // Função para disparar o evento
    function dispatchEvent() {
      try {
        if (typeof window.ttq.page === "function") {
          window.ttq.page(eventData);
          console.log("✅ TikTok PageView melhorado enviado:", eventData);
          return true;
        } else {
          if (Array.isArray(window.ttq)) {
            window.ttq.push(["page", eventData]);
            console.log("✅ TikTok PageView melhorado adicionado à fila:", eventData);
            return true;
          }
        }
      } catch (error) {
        console.error("❌ Erro ao disparar PageView:", error);
        try {
          if (typeof window.ttq === "undefined") {
            window.ttq = [];
          }
          window.ttq.push(["page", eventData]);
          return true;
        } catch (e) {
          console.error("❌ Erro crítico ao adicionar PageView à fila:", e);
          return false;
        }
      }
    }

    // Dispara imediatamente
    dispatchEvent();

    // Aguarda pixel carregar e dispara novamente para garantir
    waitForTikTokPixel(2000).then(function () {
      if (
        typeof window.ttq !== "undefined" &&
        typeof window.ttq.page === "function"
      ) {
        try {
          window.ttq.page(eventData);
          console.log("✅ PageView melhorado disparado após pixel carregar!");
        } catch (e) {
          console.error("❌ Erro ao disparar PageView após carregar:", e);
        }
      }
    });

    // Usa ready() se disponível
    if (
      typeof window.ttq !== "undefined" &&
      typeof window.ttq.ready === "function"
    ) {
      window.ttq.ready(function () {
        try {
          if (typeof window.ttq.page === "function") {
            window.ttq.page(eventData);
            console.log("✅ PageView melhorado disparado via ready()!");
          }
        } catch (e) {
          console.error("❌ Erro ao disparar PageView via ready():", e);
        }
      });
    }
  };

  console.log("✅ Payment API carregada. Base path:", BASE_PATH);
})();

