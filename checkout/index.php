<?php
/* 
Arquivo que combina o visual do checkout.html com o sistema de API do gateway.php.
Gera dados fictícios e faz requisições para gateway.php como a index.php.
*/

include('./nlo-config.php');

$valor_exibicao = "R$ " . number_format($valor, 2, ',', '.');

// Arrays de nomes e sobrenomes
$primeirosNomes = [
    "Ana", "João", "Maria", "Carlos", "Lucas", "Sofia", "Pedro", "Fernanda", "Eduardo", 
    "Isabela", "Gustavo", "Beatriz", "Ricardo", "Patrícia", "Roberto", "Juliana", 
    "Felipe", "Larissa", "Thiago", "Julio", "Cláudia", "Vitor", "Bruna", "Renato", "Vanessa"
];
$sobrenomes = [
    "Silva", "Santos", "Oliveira", "Costa", "Pereira", "Almeida", "Martins", "Rodrigues", 
    "Melo", "Dias", "Souza", "Nascimento", "Barbosa", "Araujo", "Cavalcanti", "Campos", 
    "Pinto", "Lima", "Carvalho", "Gomes", "Ferreira", "Ribeiro", "Castro", "Mendes", 
    "Azevedo", "Fernandes", "Morais", "Vieira", "Faria", "Pimentel"
];
$terceirosNomes = [
    "Lima", "Gomes", "Ribeiro", "Ferreira", "Mendes", "Azevedo", "Carvalho", "Fernandes", 
    "Figueiredo", "Moura", "Rocha", "Teixeira", "Silveira", "Lopes", "Santana", "Pereira", 
    "Alves", "Sá", "Castro", "Machado", "Fontes", "Mello", "Pimentel", "Tavares", "Barreto", 
    "Assis", "Leal", "Cunha", "Rezende", "Borges"
];

// Gerar nome aleatório
$primeiroNome = $primeirosNomes[array_rand($primeirosNomes)];
$sobrenome = $sobrenomes[array_rand($sobrenomes)];

// Garantir que o terceiro nome não seja igual ao sobrenome
do {
    $terceiroNome = $terceirosNomes[array_rand($terceirosNomes)];
} while ($terceiroNome == $sobrenome);

$nomeCompleto = $primeiroNome . " " . $sobrenome . " " . $terceiroNome;

// Gerar e-mail
$nomeFormatado = strtolower(preg_replace('/\s+/', '', iconv('UTF-8', 'ASCII//TRANSLIT', $nomeCompleto)));
$dataNascimento = str_pad(rand(1, 31), 2, '0', STR_PAD_LEFT) . str_pad(rand(1, 12), 2, '0', STR_PAD_LEFT);
$emailDomains = ["@gmail.com", "@hotmail.com", "@outlook.com", "@yahoo.com", "@icloud.com"];
$dominio = $emailDomains[array_rand($emailDomains)];

$email = $nomeFormatado . $dataNascimento . $dominio;

// Gera o CPF
$cpf = "";

// Gera os 9 primeiros dígitos aleatórios
for ($i = 0; $i < 9; $i++) {
    $cpf .= rand(0, 9);
};

// Calcula os 2 dígitos verificadores
$cpf .= calcularDigitoVerificador($cpf, 1);
$cpf .= calcularDigitoVerificador($cpf, 2);

// Função para calcular o dígito verificador
function calcularDigitoVerificador($cpf, $digito) {
    $soma = 0;
    $multiplicador = ($digito === 1) ? 10 : 11;
    for ($i = 0; $i < strlen($cpf); $i++) {
        $soma += (int)$cpf[$i] * ($multiplicador - $i);
    }

    $resto = $soma % 11;
    $digitoVerificador = ($resto < 2) ? 0 : 11 - $resto;

    return $digitoVerificador;
};

// Gerar um DDD aleatório entre 11 e 99
$ddd = rand(11, 99);

// Decidir se o número terá o dígito 9 ou não (50% de chance)
$comDigito9 = rand(0, 1) === 1;

// Se o número tiver o dígito 9, gerar o número com 9 + 8 dígitos
if ($comDigito9) {
    $telefone = $ddd . "9" . rand(10000000, 99999999);
} else {
    $telefone = $ddd . rand(10000000, 99999999);
};
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>

  <!-- TikTok Pixel Code Start -->
  <script>
    !(function (w, d, t) {
      w.TiktokAnalyticsObject = t;
      var ttq = (w[t] = w[t] || []);
      (ttq.methods = [
        "page",
        "track",
        "identify",
        "instances",
        "debug",
        "on",
        "off",
        "once",
        "ready",
        "alias",
        "group",
        "enableCookie",
        "disableCookie",
        "holdConsent",
        "revokeConsent",
        "grantConsent",
      ]),
        (ttq.setAndDefer = function (t, e) {
          t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          };
        });
      for (var i = 0; i < ttq.methods.length; i++)
        ttq.setAndDefer(ttq, ttq.methods[i]);
      (ttq.instance = function (t) {
        for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++)
          ttq.setAndDefer(e, ttq.methods[n]);
        return e;
      }),
        (ttq.load = function (e, n) {
          var r = "https://analytics.tiktok.com/i18n/pixel/events.js",
            o = n && n.partner;
          (ttq._i = ttq._i || {}),
            (ttq._i[e] = []),
            (ttq._i[e]._u = r),
            (ttq._t = ttq._t || {}),
            (ttq._t[e] = +new Date()),
            (ttq._o = ttq._o || {}),
            (ttq._o[e] = n || {});
          n = document.createElement("script");
          (n.type = "text/javascript"),
            (n.async = !0),
            (n.src = r + "?sdkid=" + e + "&lib=" + t);
          e = document.getElementsByTagName("script")[0];
          e.parentNode.insertBefore(n, e);
        });
      ttq.load("D4L24BRC77UEBGID2NJ0");
      ttq.ready(function() {
        ttq.enableCookie();
        ttq.page();
      });
    })(window, document, "ttq");
  </script>
  <!-- TikTok Pixel Code End -->
  
  <?php echo $pixel_scripts; ?>

  <?php if($track_fb_pixel == 1){ ?>
  <!-- Meta Pixel Code -->
  <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src='https://connect.facebook.net/en_US/fbevents.js';
    s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script');
  
    fbq('init', '<?php echo $fb_pixel; ?>');
    fbq('track', 'PageView');
  </script>
  <noscript>
    <img height="1" width="1" style="display:none"
         src="https://www.facebook.com/tr?id=<?php echo $fb_pixel; ?>&ev=PageView&noscript=1"/>
  </noscript>
  <!-- End Meta Pixel Code -->
  <?php } ?>

  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pagamento via PIX</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
  <link href="css/all.min.css" rel="stylesheet" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
  <!-- Alterando biblioteca QR code para qrcodejs -->
  <script src="https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs/qrcode.min.js"></script>
  <link rel="stylesheet" href="css/css.css" />

  <style>
    .payment-status {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #007bff;
    }
    .status-content {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .status-icon {
      font-size: 24px;
      color: #007bff;
    }
    .status-text {
      flex: 1;
    }
    .status-title {
      margin: 0;
      font-weight: 600;
      color: #333;
      font-size: 16px;
    }
    .status-subtitle {
      margin: 5px 0 0 0;
      font-size: 14px;
      color: #666;
    }
    .payment-status .fa-check-circle {
      color: #28a745;
    }
  </style>

  <script src="js/utm-handler.js" data-token="000368c8e6325a75f97a2f992e409c64" data-click-id-param="click_id"></script>
</head>

<body>
  <header>
    <div class="container" style="padding:0">
      <?php if($logo_ativo == 1 && !empty($logo_url)){ ?>
      <img src="<?php echo $logo_url; ?>" alt="Logo Pagamento PIX" class="logo" />
      <?php } else { ?>
      <img src="images/shein-logo.png" alt="Logo Pagamento PIX" class="logo" />
      <?php } ?>
      <!-- <div class="header-subtitle">
        Transação rápida, segura e sem complicação
      </div> -->
    </div>
  </header>

  <div class="container">
    <div class="payment-container">
      <div class="security-badge">
        <i class="fas fa-lock"></i>
        <span>Ambiente Seguro</span>
      </div>

      <div id="loading" class="loading">
        <div class="spinner"></div>
        <p>Gerando QRCode para pagamento...</p>
      </div>

      <div id="payment-content" style="display: none">
        <div class="qrcode-container">
          <h2 class="section-title">
            <i class="fas fa-mobile-alt"></i>
            Escaneie o QRCode abaixo
          </h2>
          <div id="qrcode"></div>
          <img id="qrcode-img" style="display: none" alt="QR Code PIX" />
        </div>

        <div class="copy-section">
          <h2 class="section-title">
            <i class="far fa-copy"></i>
            Ou copie o código PIX
          </h2>
          <div class="input-group">
            <input type="text" id="pix-code" readonly="" />
            <button class="copy-btn" id="copy-btn">
              <i class="far fa-copy"></i>
              <span>Copiar</span>
            </button>
          </div>
        </div>

        <div class="payment-info">
          <div class="info-item">
            <span class="info-label">
              <i class="fas fa-money-bill-wave"></i>
              Valor:
            </span>
            <span id="amount"><?php echo $valor_exibicao; ?></span>
          </div>
          <div class="info-item">
            <span class="info-label">
              <i class="far fa-clock"></i>
              Válido até:
            </span>
            <span id="expiration">--/--/---- --:--</span>
          </div>
        </div>

        <div class="trust-badges">
          <div class="trust-badge">
            <i class="fas fa-shield-alt text-success"></i>
            <span>Pagamento Seguro</span>
          </div>
          <div class="trust-badge">
            <i class="fas fa-bolt"></i>
            <span>Transação Instantânea</span>
          </div>
          <div class="trust-badge">
            <i class="fas fa-headset"></i>
            <span>Suporte 24/7</span>
          </div>
        </div>

        <!-- Indicador de verificação de pagamento -->
        <div id="payment-status" class="payment-status" style="display: none">
          <div class="status-content">
            <div class="status-icon">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="status-text">
              <p class="status-title">
                Aguardando confirmação do pagamento...
              </p>
              <p class="status-subtitle" id="status-subtitle">
                Verificando a cada 5 segundos
              </p>
            </div>
          </div>
        </div>
      </div>

      <div id="error-message" class="error-message" style="display: none"></div>
    </div>
  </div>

  <script>
    const upsellUrl = "<?php echo $upsell; ?>";
    const oferta = "<?php echo $oferta; ?>";
    let id_transacao = "";
    const valorTotal = parseFloat("<?php echo $valor; ?>");

    // Dados gerados no PHP
    const nomePreDefinido = "<?php echo $nomeCompleto; ?>";
    const emailPreDefinido = "<?php echo $email; ?>";
    const cpfPreDefinido = "<?php echo $cpf; ?>";
    const telefonePreDefinido = "<?php echo $telefone; ?>";
    const valorPreDefinido = <?php echo $valor; ?>;

    // Função para extrair parâmetros UTM da URL
    function getUtmParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const utmParams = {};
      const utmFields = [
        "amount",
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "click_id",
        "fbclid",
        "gclid",
        "msclkid",
        "ttclid",
      ];

      utmFields.forEach((param) => {
        if (urlParams.has(param)) {
          utmParams[param] = urlParams.get(param);
        }
      });

      if (Object.keys(utmParams).length > 0) {
        try {
          localStorage.setItem("utm_params", JSON.stringify(utmParams));
        } catch (e) {
          console.warn("⚠️ Erro ao salvar UTM params no localStorage:", e);
        }
      }

      return utmParams;
    }

    function gerarPix() {
      const params = new URLSearchParams(window.location.search);
      
      // Remover parâmetros específicos do envio de UTM
      params.delete("valor");
      params.delete("up");
      
      // Garantir que algo será enviado, mesmo que vazio
      const utmString = params.toString() || "utm_source=direct";

      const formData = {
        acao: "criar",
        oferta: oferta,
        valor: valorTotal,
        nome: nomePreDefinido,
        email: emailPreDefinido,
        cpf: cpfPreDefinido,
        telefone: telefonePreDefinido,
        utm: encodeURIComponent(utmString),
        up: "<?php echo isset($up) ? $up : ''; ?>"
      };

      const url = new URL("api/gateway.php", window.location);
      Object.keys(formData).forEach(key => {
        url.searchParams.set(key, formData[key]);
      });

      console.log("🌐 Chamando API:", url.toString());

      fetch(url)
        .then((response) => {
          if (!response.ok) {
            return response.text().then((text) => {
              throw new Error(`HTTP ${response.status}: ${text}`);
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log("✅ Resposta da API:", data);

          if (data.erro) {
            showError(data.erroMsg || "Erro ao gerar o PIX. Tente novamente...");
          } else if (data.pixCode && data.payment_id) {
            handlePixSuccess(data);
          } else {
            showError("Erro ao gerar o PIX. Resposta inválida.");
          }
        })
        .catch((error) => {
          console.error("❌ Erro ao chamar API:", error);
          showError("Erro ao gerar o PIX. Tente novamente...");
        });
    }

    function handlePixSuccess(data) {
      console.log("📝 Dados do PIX recebidos:", data);

      id_transacao = data.payment_id;
      const pixCode = data.pixCode;

      console.log("✅ TransactionID:", id_transacao);
      console.log("✅ PIX Code gerado");

      <?php if($track_fb_pixel == 1){ ?>
      if (typeof fbq !== 'undefined') {
        fbq('track', 'InitiateCheckout', {
          value: Number(valorTotal.toFixed(2)),
          currency: 'BRL',
          num_items: 1
        });
        console.log('✅ Evento de InitiateCheckout enviado para o Facebook Pixel');
      }
      <?php } ?>

      document.getElementById("loading").style.display = "none";
      document.getElementById("payment-content").style.display = "block";

      // Formata data de expiração (2 dias)
      const expirationDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const formattedDate = expirationDate.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      document.getElementById("expiration").textContent = formattedDate;

      // Preenche o código PIX
      document.getElementById("pix-code").value = pixCode;

      if (pixCode) {
        const qrcodeElement = document.getElementById("qrcode");
        qrcodeElement.innerHTML = "";
        new QRCode(qrcodeElement, {
          text: pixCode,
          width: 240,
          height: 240,
          correctLevel: QRCode.CorrectLevel.L
        });
      }

      // Configura botão de copiar
      const copyBtn = document.getElementById("copy-btn");
      const newCopyBtn = copyBtn.cloneNode(true);
      copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
      newCopyBtn.addEventListener("click", function () {
        const pixCodeInput = document.getElementById("pix-code");
        pixCodeInput.select();
        pixCodeInput.setSelectionRange(0, 99999);
        
        // Tenta usar a API moderna de clipboard
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(pixCodeInput.value).then(() => {
            newCopyBtn.innerHTML = '<i class="fas fa-check"></i> <span>Copiado!</span>';
            newCopyBtn.classList.add("copied");
            setTimeout(function () {
              newCopyBtn.innerHTML = '<i class="far fa-copy"></i> <span>Copiar</span>';
              newCopyBtn.classList.remove("copied");
            }, 2000);
          });
        } else {
          // Fallback para navegadores mais antigos
          document.execCommand("copy");
          newCopyBtn.innerHTML = '<i class="fas fa-check"></i> <span>Copiado!</span>';
          newCopyBtn.classList.add("copied");
          setTimeout(function () {
            newCopyBtn.innerHTML = '<i class="far fa-copy"></i> <span>Copiar</span>';
            newCopyBtn.classList.remove("copied");
          }, 2000);
        }
      });

      // Inicia verificação de pagamento
      if (id_transacao) {
        iniciarVerificacaoPagamento(id_transacao);
      }
    }

    function iniciarVerificacaoPagamento(payment_id) {
      console.log("🔍 Iniciando verificação de pagamento:", payment_id);

      const statusElement = document.getElementById("payment-status");
      if (statusElement) {
        statusElement.style.display = "block";
      }

      // Função para verificar status do pagamento
      function checkPaymentStatus() {
        const url = new URL("api/gateway.php", window.location);
        url.searchParams.set("acao", "verificar");
        url.searchParams.set("payment_id", payment_id);

        return fetch(url)
          .then((response) => {
            if (!response.ok) {
              return response.text().then((text) => {
                throw new Error(`HTTP ${response.status}: ${text}`);
              });
            }
            return response.json();
          })
          .then((data) => {
            console.log("🔍 Status do pagamento:", data);
            const status = data?.status?.toLowerCase();
            
            if (status === "approved" || status === "completed") {
              return true;
            }
            return false;
          })
          .catch((error) => {
            console.error("❌ Erro na verificação:", error);
            return false;
          });
      }

      // Primeira verificação imediata
      checkPaymentStatus().then((paid) => {
        if (paid) {
          handlePaymentConfirmed(payment_id);
          return;
        }

        // Continua verificando a cada 1.5 segundos
        checkPaymentInterval = setInterval(() => {
          checkPaymentStatus().then((paid) => {
            if (paid) {
              clearInterval(checkPaymentInterval);
              handlePaymentConfirmed(payment_id);
            }
          });
        }, 5000);
      });
    }

    function handlePaymentConfirmed(payment_id) {
      console.log("🎉 Pagamento confirmado! Transaction:", payment_id);

      if (checkPaymentInterval) {
        clearInterval(checkPaymentInterval);
      }

      <?php if($track_fb_pixel == 1){ ?>
      if (typeof fbq !== 'undefined') {
        fbq('track', 'Purchase', {
          currency: 'BRL',
          value: Number(valorTotal.toFixed(2)),
          transaction_id: payment_id
        });
        console.log('✅ Evento de compra enviado para o Facebook Pixel');
      }
      <?php } ?>

      const statusElement = document.getElementById("payment-status");
      if (statusElement) {
        statusElement.innerHTML = `
          <div class="status-content">
            <div class="status-icon" style="color: #28a745;">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="status-text">
              <p class="status-title" style="color: #28a745;">Pagamento confirmado!</p>
              <p class="status-subtitle">Redirecionando...</p>
            </div>
          </div>
        `;
      }

      // Redireciona para o upsell preservando parâmetros UTM
      const upsell = new URL(upsellUrl, window.location.href);
      const currentParams = new URLSearchParams(window.location.search);
      
      for (const [key, value] of currentParams.entries()) {
        if (!upsell.searchParams.has(key)) {
          upsell.searchParams.set(key, value);
        }
      }

      upsell.searchParams.delete("up");

      setTimeout(() => {
        window.location.href = upsell.toString();
      }, 2500);
    }

    function showError(message) {
      document.getElementById("loading").style.display = "none";
      const errorElement = document.getElementById("error-message");
      errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
      errorElement.style.display = "block";
    }

    document.addEventListener("DOMContentLoaded", function () {
      gerarPix();
    });
  </script>
</body>
</html>
