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
}