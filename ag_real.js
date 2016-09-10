var m = require('mathjs');
var _ = require('underscore');
var MongoClient = require('mongodb').MongoClient, assert = require('assert');

var arrayExperimento = [];
var populacao=[], aptidaoPopulacao=[], aptidaoSomaArray=[], pais=[], filhos=[], melhorIndividuo=[]; 
var melhorPorGeracao = [], piorPorGeracao = [], mediaPorGeracao = [], aptidaoNormalizada = [];
var arrayPopulacaoExperimento = [300, 300, 300, 300, 300, 300, 300, 300, 300, 300];
//var arrayPopulacaoExperimento = [30];
var qtdGeracoes = 100, tcruzamento = 0.75, tmutacao = 0.01, experimento = 1, qtdPopulacao = 0;
var melhorAptidao = 0;

const CANONICO = 1, ELITISMO = 2, NORM_LINEAR = 3, NORM_LIN_ELITISMO = 4, CANONICO_F6_MOD = 5, ELIT_F6_MOD = 6;
var tipoAg = CANONICO;

for(aux1 in arrayPopulacaoExperimento){
	for(aux2 in _.range(3)){
		qtdPopulacao = arrayPopulacaoExperimento[aux1];
		playAg(tipoAg);
		experimento++;
		zerarVariaveis();
	}
}

switch (tipoAg) {
	case CANONICO:
		var collection = 'experimentos_canonico';
		break;	
	case ELITISMO:
		var collection = 'experimentos_elitismo';
		break;	
	case NORM_LINEAR:
		var collection = 'experimentos_norm_linear';
		break;	
	case NORM_LIN_ELITISMO:
		var collection = 'experimentos_norm_linear_elitismo';
		break;	
	case CANONICO_F6_MOD:
		var collection = 'experimentos_canonico_f6modificada';
		break;	
	case ELIT_F6_MOD:
		var collection = 'experimentos_elitismo_f6modificada';
		break;
	default:
		var collection = 'experimentos_canonico';
		break;
}

MongoClient.connect("mongodb://localhost:27017/ag_real", function(err, db) {
	assert.equal(null, err);
	experimento_collection = db.collection(collection);
	for(i in arrayExperimento){
		experimento_collection.insertOne(arrayExperimento[i],{w:1},function(err, r) {
			assert.equal(null, err);
			assert.equal(1, r.insertedCount);
		});
	}
	db.close();
});



////////////////////////////////////////////

function playAg(tipoAg){
	inicializar(qtdPopulacao,tipoAg);
	avaliar(tipoAg);
	for(geracao in _.range(qtdGeracoes)){
		reproduzir(tipoAg);
		avaliar(tipoAg);
		console.log('geração: '+geracao);
	}
	var info_to_insert = {
		'_id': experimento,
		'melhor_individuo': melhorAptidao, 
		'populacao_inicial': qtdPopulacao,
		'melhor_por_geracao': melhorPorGeracao,
		'pior_por_geracao': piorPorGeracao,
		'media_por_geracao': mediaPorGeracao,
	};
	arrayExperimento.push(info_to_insert);
	console.log('Melhor aptidão: '+ melhorAptidao);
}

function zerarVariaveis(){
	populacao=[], aptidaoPopulacao=[], aptidaoSomaArray=[], pais=[], filhos=[], melhorIndividuo=[]; 
	melhorPorGeracao = [], piorPorGeracao = [], mediaPorGeracao = [], aptidaoNormalizada = [];
	melhorAptidao = 0, qtdPopulacao = 0;
}

function inicializar(qtdIndividuos, tipoAg){
	var x, y, individuo = [];
	for(i in _.range(qtdIndividuos)){
		x = m.random(-100, 100);
		y = m.random(-100, 100);
		individuo.push(x);
		individuo.push(y);
		populacao.push(individuo);
		individuo = [];
	}
	if(tipoAg == 3 || tipoAg == 4)
		normLinear();
}

function f6(x,y){
	var scope = {x: x, y: y};
	if(tipoAg == 1 || tipoAg == 2)
		return m.eval('0.5-(((sin(sqrt(x^2+y^2)))^2)-0.5)/(1+0.001*(x^2+y^2))^2',scope);
	else
		return m.eval('999+0.5-(((sin(sqrt(x^2+y^2)))^2)-0.5)/(1+0.001*(x^2+y^2))^2',scope);
}

function avaliar(tipoAg){
	var aptidaoIndividuo, melhorDaGeracao = 0, piorDaGeracao = 1000, somaAptidaoGeracao = 0;
	aptidaoPopulacao = [];
	for(i in populacao){
		aptidaoIndividuo = f6(populacao[i][0],populacao[i][1]);
		aptidaoPopulacao.push(aptidaoIndividuo);
		somaAptidaoGeracao += aptidaoIndividuo;

		if(aptidaoIndividuo > melhorDaGeracao)
			melhorDaGeracao = aptidaoIndividuo;

		if(aptidaoIndividuo < piorDaGeracao)
			piorDaGeracao = aptidaoIndividuo;

		if(aptidaoIndividuo > melhorAptidao){
			melhorAptidao = aptidaoIndividuo;
			melhorIndividuo = populacao[i];
		}
	}
	if(tipoAg == 3 || tipoAg == 4)
		bubbleSortPop(aptidaoPopulacao);

	melhorPorGeracao.push(melhorDaGeracao);
	piorPorGeracao.push(piorDaGeracao);
	mediaPorGeracao.push(somaAptidaoGeracao/populacao.length);
}

function selecionarPais(totalAptidao){
		//console.log(totalAptidao);
	var rand = m.random(0,totalAptidao);

	for(i in aptidaoSomaArray){
		if (aptidaoSomaArray[i] >= m.random(0,totalAptidao)){
			pais.push(populacao[i]);
			rand = m.random(0,totalAptidao);
		}
		if(pais.length == 2)
			break;
	}
	if(pais.length < 2)
		selecionarPais(totalAptidao);
}

function roleta(tipoAg){
	aptidaoSomaArray = [];
	var totalAptidao = 0;

	if(tipoAg == 3 || tipoAg == 4){
		aptidaoPopulacao = []; 
		aptidaoPopulacao = aptidaoNormalizada;
	}
	for(i in aptidaoPopulacao){
		totalAptidao += aptidaoPopulacao[i];
		aptidaoSomaArray.push(totalAptidao);
	}
	return totalAptidao;
}

function reproduzir(tipoAg){
	selecionarPais(roleta(tipoAg));
	while(filhos.length < populacao.length){
		if(Math.random() <= tcruzamento){
			cruzamento();
			selecionarPais(roleta(tipoAg));
		}
	}
	populacao = [];
	populacao = filhos;
	filhos = [];
	mutacao();
	if (tipoAg == 2 || tipoAg == 4 || tipoAg == 6)
		populacao[0] = melhorIndividuo;
}

function cruzamento(){
	var filho=[];
	filho.push((pais[0][0]+pais[1][0])/2);
	filho.push((pais[0][1]+pais[1][1])/2);
	filhos.push(filho);
	filho = [];
	filho.push((pais[1][1]+pais[0][1])/2);
	filho.push((pais[0][0]+pais[1][0])/2);
	filhos.push(filho);
	filho = [];
	pais = [];
}

function mutacao(){
	for(i in populacao){
		for(j in populacao[i]){
			if(Math.random() <= tmutacao){
				populacao[i][j] += m.random(-10, 10);
			}
		}
	}
}

function normLinear(){
	var min=1,max=1.001;
	for(i in _.range(qtdPopulacao))
		aptidaoNormalizada.push(min+(max-min)/(qtdPopulacao-1)*(i-1));
}

function bubbleSortPop(a){
	var swapped, temp, temp_pop;
	do {
		swapped = false;
		for (var i=0; i < a.length-1; i++) {
			if (a[i] > a[i+1]) {
				temp = a[i];
				a[i] = a[i+1];
				a[i+1] = temp;
				
				temp_pop = populacao[i];
				populacao[i] = populacao[i+1];
				populacao[i+1] = temp_pop;

				swapped = true;
			}
		}
	} while (swapped);
}