/* 
 * função: dist(ponto 1, ponto 2)
 * descrição: calcula a distância entre dois pontos
 *			 ponto tem que seguir na sintaxe:
 *			 ponto 1 = {x: valor_da_coordenada_x, y: valor_da_coordenada_y}
 */
Math.dist = function(p1, p2) {
	var deltaX = p1.x - p2.x;
	var deltaY = p1.y - p2.y;
	return Math.sqrt( deltaX * deltaX + deltaY * deltaY );	
};


/* 
 * função: constrain(valor, limite mínimo, limite máximo)
 * descrição: limita o valor à um intervalo específico
 */
Math.constrain = function(value, min, max) {
	value = value > max ? max : value;
	value = value < min ? min : value;
	return value;
};


/* 
 * função: map(valor, valor mínimo do intervalo de origem, valor máximo do intervalo de origem,
 * 			   valor mímimo do intervalo de destinho, valor máximo do intervalo de destino)
 * descrição: mapeia o valor de um intervalo para outro intervalo
 */
Math.map = function(value, inMin, inMax, outMin, outMax) {
	return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
};


/* 
 * função: randomInt(valor mínimo, valor máximo)
 * descrição: retorna um número inteiro pseudo-aleatório em um intervalo definido
 */
Math.randomInt = function(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
};


/* 
 * função: addVector(vetor 1, vetor 2)
 * descrição: retorna a soma dos dois vetores
 */
Math.addVector = function(v1, v2) {
	var x = v1.x + v2.x;
	var y = v1.y + v2.y;
	return {x: x, y: y};
};


/* 
 * função: radians(ângulo em graus)
 * descrição: converte uma ângulo de graus para radianos
 */
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
 

/* 
 * função: degrees(ângulo em radianos)
 * descrição: converte uma ângulo de radianos para graus
 */
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

/* 
 * função: roundTo(número, quantidade de casas decimais)
 * descrição: arredonda um número mantendo o número de casas decimais
 */
Math.roundTo = function(x, digits) {
	if (digits === undefined || digits < 1) {
		digits = 1;
	}
	var d = digits * 10;
	return Math.round(x * d) / d;
};
