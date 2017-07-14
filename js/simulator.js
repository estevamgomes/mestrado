//variáveis
var stage,			// objeto root level onde outros elementos serão fixados e renderizados
	stageWidth,		// largura da tela
	stageHeight,	// altura da tela
	preload, 		// loader do PreloadJs
	wire;			// armazena o desenho dos fios

var messageField;	// campo para exibir as mensagens

var component  = [], // componentes
	connection = []; // conexões

var cellSize  = 10;
var fontStyle = "bold 1.4rem 'Overpass Mono', monospace";

var paleta = {
	preto: 		"#000000",
	grid: 		"#f8f8f8",
	branco: 	"#ffffff",
	vermelho: 	"#EB3964",
	azul: 		"#645ED7", 
	amarelo: 	"#ffde00",
	roxo: 		"#7f3fa5", 
	rosaclaro:  "#f490c7",
	rosa: 		"#e51a80",
	verdeclaro: "#bef4e9",
	verde: 		"#76ceb5"
};

/* 
 * função: init()
 * descrição: primeira função a ser executada no código;
 *			  é executada apenas uma vez;
 *			  essa função deve ser chamada no atributo onLoad="init()" da tag body;
 */
function init() {

	// mostra as mensagens de erro
	if (!createjs.Sound.initializeDefaultPlugins()) {
		document.getElementById("error").style.display = "block";
		document.getElementById("content").style.display = "none";
		return;
	}

	if (createjs.BrowserDetect.isIOS || createjs.BrowserDetect.isAndroid || createjs.BrowserDetect.isBlackberry) {
		document.getElementById("mobile").style.display = "block";
		document.getElementById("content").style.display = "none";
		return;
	}

	// cria um objeto stage do createjs a partir de um canvas
	stage = new createjs.Stage("simulatorCanvas");

	// ativa o evento mouseOver
	stage.enableMouseOver();

	// salva a largura e altura do canvas para cálculos posteriores
	stageWidth = stage.canvas.width;
	stageHeight = stage.canvas.height;

	// mensagem de loading
	messageField = new createjs.Text("CARREGANDO", fontStyle, paleta.preto);
		messageField.maxWidth = 1000;
		messageField.textAlign = "center";
		messageField.textBaseline = "middle";
		messageField.x = stageWidth / 2;
		messageField.y = stageHeight / 2;
	stage.addChild(messageField);
	stage.update(); 	//update the stage to show text

	// array com os arquivos que serão carregados
	var imagesPath = "./img/";
	var images = [
		// componentes
		{id: "servo",	src: "icones_servo-ani-lg.png"},
	];

	// carrega os arquivos selecionados
	preload = new createjs.LoadQueue(false);
	preload.addEventListener("complete", doneLoading);		// chama a função doneLoading() quando termina de carregar os arquivos
	preload.addEventListener("progress", updateLoading);	// enquanto carrega atualiza a barra de progresso
	preload.loadManifest(images, true, imagesPath); 		// carrega as imagens
}


/* 
 * função: updateLoading()
 * descrição: função executada enquanto os arquivos estão sendo carregados;
 * 			  usada para mostrar a barra de progresso;
 */
function updateLoading() {
	messageField.text = "CARREGANDO " + (preload.progress * 100 | 0) + "%";
	stage.update();
}


/* 
 * função: doneLoading()
 * descrição: função executada após todos os arquivos serem carregados;
 *			  é executada apenas uma vez;
 */
function doneLoading() {
	messageField.text = "SIMULADOR DE SISTEMAS"; // altera o texto
	stage.update(); // aplica as alterações no stage

	start(); // inicia o simulador
}


/* 
 * função: start()
 * descrição: inicia o simulator;
 *			  reinicia o simulador;
 */
function start() {
	// remove tudo que estava no stage
	stage.removeAllChildren();
	// apaga qualquer coisa desenhada no stage
	stage.clear();

	// input = new Input({paleta: paleta});
	// input.x = 200;
	// input.y = 200;

	// cria o componente 
	component[0] = new Component({
		label: "SERVO",
		sprite: preload.getResult("servo"),
		paleta: paleta,
		cellSize: cellSize,
		fontStyle: fontStyle,
		valueSize: 3
	});

	component[1] = new Component({
		label: "SERVO",
		sprite: preload.getResult("servo"),
		paleta: paleta,
		cellSize: cellSize,
		fontStyle: fontStyle,
		valueSize: 1
	});

	component[2] = new Component({
		label: "SERVO",
		sprite: preload.getResult("servo"),
		paleta: paleta,
		cellSize: cellSize,
		fontStyle: fontStyle,
		valueSize: 0
	});

	component[3] = new Actuator({
		label: "SERVO",
		sprite: preload.getResult("servo"),
		paleta: paleta,
		cellSize: cellSize,
		fontStyle: fontStyle,
		valueSize: 0
	});

	// desenha a grid
	var grid = new createjs.Shape();
	grid.graphics.beginStroke(paleta.grid).setStrokeStyle(1);
	for (var x = 0; x < stageWidth; x += cellSize) {
		grid.graphics
			.moveTo(x, 0)
			.lineTo(x, stageHeight);
	};
	for (var y = 0; y < stageHeight; y += cellSize) {
		grid.graphics
			.moveTo(0, y)
			.lineTo(stageWidth, y);
	};

	// cria um shape para armazenar o fio que representa a conexão
	wire = new createjs.Shape();

	// adiciona os componentes
	stage.addChild(grid);
	for (var i = 0; i < component.length; i++) {
		component[i].x = Math.randomInt(0, stageWidth);
		component[i].y = Math.randomInt(0, stageHeight);
		stage.addChild(component[i]);
	};
	stage.addChild(wire);

	// aplica as alterações no stage
	stage.update();

	//start game timer
	// inicializa o loop (tick)
	
	if (!createjs.Ticker.hasEventListener("tick")) {
		createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
		createjs.Ticker.framerate = 60;
		createjs.Ticker.addEventListener("tick", tick);
	}
	
	createjs.Ticker.on("tick", stage);

	stage.on("stagemousemove", stagemousemove);
	stage.on("stagemouseup", stagemouseup);
	stage.on("stagemousedown", stagemousedown);
}

var tmpWire = {
	on: false,
	startObjId: null,
	startNode: {x: 0, y: 0},
	endNode: {x: 0, y: 0},
};

function stagemousemove(event) {
	if(tmpWire.on) {
		tmpWire.endNode = {
			x: event.stageX,
			y: event.stageY,
		};
	}
}

function stagemouseup(event) {
	tmpWire.on = false;

	var obj = stage.getObjectUnderPoint(event.stageX, event.stageY, 2);

	if(obj != null && obj.parent.constructor.name == "Input") {
		connection.push({
			in: tmpWire.startObjId,
			out: obj.parent.id
		});
	}
}

function stagemousedown(event) {
	var obj = stage.getObjectUnderPoint(event.stageX, event.stageY, 2);

	if(obj != null && obj.parent.constructor.name == "Input") {
		tmpWire.startObjId = obj.parent.id;
		tmpWire.on = true;
		tmpWire.startNode = {
			x: event.stageX,
			y: event.stageY,
		};
		tmpWire.endNode = tmpWire.startNode;
	}
}

/* 
 * função: tick()
 * descrição: função que executa o loop;
 */
function tick(event) {
	wire.graphics.clear().beginStroke(this.paleta.rosa).setStrokeStyle(2);

	if(connection.length > 0) {
		for (var i = 0; i < connection.length; i++) {
			var startNode = stage.getChildAt(connection[i].out);
			var endNode   = stage.getChildAt(connection[i].in);
			// console.log(stage.getChildAt(32));
			// drawWire(startNode, endNode);
		};
	}

	if(tmpWire.on) {
		drawWire(tmpWire.startNode, tmpWire.endNode);
	}
}


/* 
 * função: drawWire()
 * descrição: função que desenha um fio usando uma curva bezier entre dois pontos
 */
function drawWire(startPoint, endPoint) {
	// atualiza o valor do nó
	// endPoint.value = startPoint.value;

	var startPos = {
		x: startPoint.x,
		y: startPoint.y
	}

	var endPos = {
		x: endPoint.x,
		y: endPoint.y
	}

	// distancia entre o ponto inicial e final
	var dist = Math.dist(startPos, endPos);

	// control point 1
	var cp1 = {
		x: startPos.x + 0.55 * dist,
		y: startPos.y
	};

	// controle point 2
	var cp2 = {
		x: endPos.x - 0.55 * dist,
		y: endPos.y
	};

	wire.graphics			
		.moveTo(startPos.x, startPos.y)
		.bezierCurveTo(
			cp1.x, cp1.y,
			cp2.x, cp2.y,
			endPos.x, endPos.y
		);
}