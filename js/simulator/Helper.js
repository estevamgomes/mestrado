/* 
 * função: dist(ponto 1, ponto 2)
 * descrição: calcula a distância entre dois pontos
 *			  ponto deve seguir a sintaxe:
 *			  ponto 1 = {x: valor_da_coordenada_x, y: valor_da_coordenada_y}
 */
Math.dist = function(p1, p2) {
	var deltaX = p1.x - p2.x;
	var deltaY = p1.y - p2.y;
	return Math.sqrt( deltaX * deltaX + deltaY * deltaY );	
};


/* 
 * função: angleFromPoints(ponto C, ponto A, ponto B)
 * descrição: calcula o ângulo (em radianos) do ponto C em relação aos outros dois pontos
 *			  ponto deve seguir a sintaxe:
 *			  ponto 1 = {x: valor_da_coordenada_x, y: valor_da_coordenada_y}
 */
Math.angleFromPoints = function(px, pa, pb) {
	// lei dos cossenos
	var ab = Math.dist(pa, pb),
		ax = Math.dist(pa, px),
		bx = Math.dist(pb, px);
	// angulo no ponto X
	return Math.acos( ((bx * bx) + (ax * ax) - (ab * ab)) / (2 * bx * ax) );
};


/* 
 * função: pointInLine(linha, distância do começo da linha)
 * descrição: retorna um ponto na linha com a distância especificada do começo da linha
 *			  linha deve seguir a sintaxe:
 *			  linha = [ponto 1, ponto 2]
 */
Math.pointInLine = function(line, distFromStart) {
	var lineLength = Math.lineLength(line);
	return {
		x: distFromStart * (line[1].x - line[0].x) / lineLength + line[0].x,
		y: distFromStart * (line[1].y - line[0].y) / lineLength + line[0].y
	};
};


/* 
 * função: lineLength(linha)
 * descrição: retorna o comprimento de uma linha
 *			  linha deve seguir a sintaxe:
 *			  linha = [ponto 1, ponto 2]
 */
Math.lineLength = function(line) {
	return Math.dist(line[0], line[1]);
}


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
 * função: subVector(vetor 1, vetor 2)
 * descrição: retorna a subtração de dois vetores
 */
Math.subVector = function(v1, v2) {
	var x = v1.x - v2.x;
	var y = v1.y - v2.y;
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
