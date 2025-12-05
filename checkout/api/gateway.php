<?php
//DUTTY
header('Content-Type: application/json');

if(isset($_GET['acao']) && !empty($_GET['acao'])) {
	$acao = $_GET['acao'];
	//$gateway_api = "https://app.duttyfy.com.br/api-pix/sua_chave_encriptada"; - já é puxado a partir do arquivo nlo-config.php
    //$gateway_api = "https://app.duttyfy.com.br/api-pix/mnlaIlqETJVILkXtC3p8lSRBtBIfVdY65Rs6hTPX731bRCp-QfvMwHzVnZVLCK4GucgFAvPZ1hn-lmJKZJW27g"; //NLO testes

    //chama a chave api $gateway_api de um arquivo universal de config
    include_once('../nlo-config.php');

	$retornar = array();
	$params = array();

	switch($acao){
		case "criar":
			//criar pagamento
			$endpoint = "";

			$oferta = "tiktok";
			$nome = $_GET['nome'];
			$email = $_GET['email'];
			$telefone = $_GET['telefone'];
			$cpf = $_GET['cpf'];
			$utm = urldecode($_GET['utm']);
			$up = (int)$_GET['up'];

			if(empty($oferta) || empty($nome) || empty($telefone) || empty($cpf)){
				$erro = 1;
				$erroMsg = "Parâmetro(s) obrigatório(s) faltando";
			};

			switch($oferta){
				case "oferta demo":
					$ofertaNome = "Oferta Demo - NLO";
					$valor = $_GET['valor'];
					$valor = number_format($valor, 2, '.', '');
					$valor = str_replace('.', '', $valor);
					$valor = (int)$valor;
				break;

				case "tiktok":
                    if(isset($up) && !empty($up)) {
    					$ofertaNome = $nome_up . " " . $up; //puxa de nlo-config.php
                    } else {
    					$ofertaNome = $nome_front; //puxa de nlo-config.php
                    };
					$valor = $_GET['valor'];
					$valor = number_format($valor, 2, '.', '');
					$valor = str_replace('.', '', $valor);
					$valor = (int)$valor;
				break;

				break;

				default:
					$erro = 1;
					$erroMsg = "Oferta não encontrada.";
				break;
			};

			//DEBUG - valores variáveis ficticios
			//$nome = "Vanessa da Silva";
			//$telefone = "85999999999"; //sem DDDI, com DDD
			//$cpf = "05399935309";
			//$utm = "";

			// Dados para envio
			$postfields = [
				"utm" => $utm,
				"item" => [
					"price" => $valor,
					"title" => $ofertaNome,
					"quantity" => 1
				],
				"amount" => $valor,
				"customer" => [
					"name" => $nome,
					"email" => $email,
					"phone" => $telefone,
					"document" => $cpf
				],
				"description" => "Pagamento via Pix", // aparecerá na cobrança
				"paymentMethod" => "PIX"
			];
		break;

		case "verificar":
			//verificar pagamento
			$endpoint = "";
			if(isset($_GET['payment_id']) && !empty($_GET['payment_id'])){
				$payment_id = $_GET['payment_id'];
				$params['transactionId'] = $payment_id;
			} else {
				$erro = 1;
				$erroMsg = "Parâmetro obrigatório faltando";
			};
		break;

		default:
			$erro = 1;
			$erroMsg = "Ação não encontrada.";
		break;
	};

	if(isset($erro) && $erro == 1){
		$retornar['erro'] = $erro;
		$retornar['erroMsg'] = $erroMsg;
		echo(json_encode($retornar, JSON_UNESCAPED_UNICODE));
		die();
	};

	$query = http_build_query($params);
	$ch = curl_init($gateway_api . $endpoint . "?" . $query);

	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_ENCODING,  'deflate');
	curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);

	curl_setopt($ch, CURLOPT_HTTPHEADER, [
		"Content-Type: application/json"
	]);
	
	if($acao == "verificar"){
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
	} elseif($acao == "criar") {
		curl_setopt($ch, CURLOPT_POST, true);
		curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postfields));
	};

	$result = curl_exec($ch);

	if (curl_errno($ch)) {
		$erro = 1;
		$erroMsg = curl_error($ch);
		$retornar['erro'] = $erro;
		$retornar['erroMsg'] = $erroMsg;
		echo(json_encode($retornar, JSON_UNESCAPED_UNICODE));
		die();
	} else {
		$result = json_decode($result, true);
		//DEBUG
		//echo json_encode($postfields);

		//echo "Resposta: <br><br>";
		//var_dump($result);
		//print_r($result);

		if(isset($result['message'])){
			$retornar['erro'] = 1;
			$retornar['erroMsg'] = $result['message'];
			$retornar['erroCode'] = $result['code'];
		} else {
			if($acao == "criar"){
				if(!is_null($result['transactionId'])){
					$retornar['payment_id'] = $result['transactionId'];
					$retornar['pixCode'] = $result['pixCode'];
					$retornar['status'] = $result['status'];
				} else {
					$erro = 1;
					$erroMsg = "API retornou id nulo por algum motivo. Resposta da API: " . json_encode($result, true);
					$retornar['erro'] = $erro;
					$retornar['erroMsg'] = $erroMsg;
					$retornar['detalhes'] = json_encode($result, true);
				};
			} elseif ($acao == "verificar"){
				if(!$result['error']){
					if(!is_null($result['status'])){
						$retornar['status'] = $result['status'];
					} else {
						$erro = 1;
						$erroMsg = "Não retornou erro mas tem ID nulo"; //isso aqui provavelmente nunca vai ser usado
						$retornar['erro'] = $erro;
						$retornar['erroMsg'] = $erroMsg;
						$retornar['detalhes'] = json_encode($result, true);
					};
				} else {
					$erro = 1;
					$erroMsg = "Erro: " . $result['error'];
					$retornar['erro'] = $erro;
					$retornar['erroMsg'] = $erroMsg;
					$retornar['detalhes'] = json_encode($result, true);
				};
			};
		};
		// dados retornados em json
		echo(json_encode($retornar, JSON_UNESCAPED_UNICODE));
	};
	curl_close($ch);
} else {
	$erro = 1;
	$erroMsg = "Ação não especificada";
	$retornar['erro'] = $erro;
	$retornar['erroMsg'] = $erroMsg;
	echo(json_encode($retornar, JSON_UNESCAPED_UNICODE));
};
?>