// variáveis
var stage,			// objeto root level onde outros elementos serão fixados e renderizados
	canvas,			// canvas é o elemento html onde as coisas são desenhadas
	preload, 		// loader do PreloadJs
	workarea, 		// area de trabalho
	componentArray, // objeto que armazena os componentes
	menu, 			// objeto do menu
	wire;			// armazena o desenho dos fios

var messageField;	// campo para exibir as mensagens

var component  = [], // componentes
	connection = []; // conexões

var fontStyle = "bold 1.4rem 'Overpass Mono', monospace",
	componentFontStyle = "bold 1rem 'Overpass Mono', monospace";

var color = {
	preto: 		"#000000",
	cinzaescuro:"#999999",
	cinza: 		"#cccccc",
	cinzamedio:	"#d8d8d8",
	cinzaclaro:	"#f6f6f6",
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

var colorScheme = {
	// cor do fundo do canvas
	background: color.cinzaclaro, 

	wire: {
		temporary: color.preto,
		active: color.preto,
		attached: color.vermelho,
	},

	// cor do componente
	component: {	
		default: {
			background: color.preto,
			border: color.preto,
			label: color.branco,
			labelText: color.preto,
			terminal: color.branco,
			terminalBorder: color.preto,
			terminalText: color.azul,
			shadow: color.cinzaescuro,
		},
		/*
		// falta implementar cores para sensores e cores para atuadores
		sensor: {
			label: color.azul,
			labelText: color.branco,
		},
		actuator: {
			label: color.vermelho,
			labelText: color.branco,
		},
		*/
		grabbing: {
			background: color.vermelho,
			border: color.vermelho,
			label: color.branco,
			labelText: color.preto,
			terminal: color.branco,
			terminalBorder: color.vermelho,
			terminalText: color.azul,
			shadow: color.cinzaescuro,
		},
		hover: {
			background: color.azul,
			border: color.azul,
			label: color.branco,
			labelText: color.preto,
			terminal: color.branco,
			terminalBorder: color.vermelho,
			terminalText: color.azul,
			shadow: color.cinzaescuro,
		}
	},

	// cor da área de trabalho
	workarea: {
		background: color.cinzaclaro,
		grid: color.cinzamedio,
	},

	// cor do menu
	menu: {
		default: {
			background: color.branco,
			text: color.preto,
			border: color.preto,
			shadow: color.cinzaescuro,
		},
		hover: {
			background: color.vermelho,
			text: color.branco,
			border: color.vermelho,
			shadow: color.cinzaescuro,
		},
		disabled: {
			background: color.cinza,
			text: color.branco,
			border: color.branco,
			shadow: color.cinzaescuro,
		}
	},

	mouseTimer: {
		default: color.preto,
		complete: color.vermelho,
	}

};

var mouseTimer = {
	on: false,
	maxRadius: 20,
	timeStart: 0,
	timeElapsed: 0,
	timeComplete: 400,
	timeMin: 250,
	complete: false,
	radius: 5,
	colorScheme: colorScheme.mouseTimer,
	currentColor: this.colorScheme.default,
	g: new createjs.Shape(),
	start: function(x, y) {
		this.on = true;
		this.timeStart = createjs.Ticker.getTime();
		this.g.x = x;
		this.g.y = y;
	},
	stop: function() {
		this.timeStart = 0;
		this.radius = 0;
		this.on = false;
		this.complete = false;
		this.g.graphics.clear();
		this.currentColor = this.colorScheme.default;
	},
	getTimeElapsed: function() {
		return createjs.Ticker.getTime() - this.timeStart;
	},
	updateUI: function() {
		this.timeElapsed = this.getTimeElapsed();
		if(this.timeElapsed >= this.timeComplete) {
			this.complete = true;
			this.currentColor = this.colorScheme.complete;
		}
		if(this.timeElapsed >= this.timeMin) {
			this.radius += (this.maxRadius - this.radius) / 10;
			this.g.graphics.clear()
				// .beginFill(this.currentColor)
				.beginStroke(this.currentColor)
				.setStrokeStyle(2)
				.drawCircle(0, 0, this.radius);
		}
	}
};

var predefinedComponent = {
	add: {
		label: "A + B",
		description: "Somar 'a' com 'b'",
		inputSize: 2,
		outputSize: 1,
		run: function() {
			this.output[0].value = this.input[0].value + this.input[1].value;
		}
	},
	subtract: {
		label: "A - B",
		description: "Subtrair 'b' de 'a'",
		inputSize: 2,
		outputSize: 1,
		run: function() {
			this.output[0].value = this.input[0].value - this.input[1].value;
		}
	},
	round: {
		label: "ROUND",
		description: "Arredondar 'a'",
		inputSize: 1,
		outputSize: 1,
		run: function() {
			this.output[0].value = Math.round(this.input[0].value);
		}
	},
	absolute: {
		label: "ABS",
		description: "Módulo de 'a'",
		inputSize: 1,
		outputSize: 1,
		run: function() {
			this.output[0].value = Math.abs(this.input[0].value);
		}
	}
};

var menuDraft = [
	{
		// input
		name: ">|",
		subMenu: [
			{ 
				name: "slider",
				componentName: "slider"
			},
		]
	}, {
		// output
		name: "|>",
		subMenu: [
			{
				name: "servo",
				componentName: "servo"
			},
		]
	}, {
		// controle
		name: "|o|",
		subMenu: [
			{
				name: "sub",
				componentName: "subtract"
			},
			{
				name: "add",
				componentName: "add"
			},
			{
				name: "round",
				componentName: "round"
			},
			{
				name: "abs",
				componentName: "absolute"
			},
		]
	}
];


/* 
 * função: init()
 * descrição: primeira função a ser executada no código;
 *			  é executada apenas uma vez;
 *			  essa função deve ser chamada no atributo onLoad="init()" da tag body;
 */
function init() {

	// exibe mensagens em caso de erro
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
	canvas = stage.canvas;
	stage.canvas.style.backgroundColor = colorScheme.background; // altera a cor do canvas

	// atualiza o tamanho do canvas para o tamanho da janela
	// essa função deve ser chamado depois do stage
	resize(); 

	// ativa o evento mouseOver
	stage.enableMouseOver();

	// mensagem de loading
	messageField = new createjs.Text("CARREGANDO", fontStyle, colorScheme.preto);
		messageField.maxWidth = 1000;
		messageField.textAlign = "center";
		messageField.textBaseline = "middle";
		messageField.x = canvas.width / 2;
		messageField.y = canvas.height / 2;
	stage.addChild(messageField);
	stage.update(); 	//update the stage to show text

	// load external files
	loadFiles();
}



/* 
 * função: loadFiles()
 * descrição: inicia o carregamento dos arquivos externos
 */
function loadFiles() {
	// array com os arquivos que serão carregados
	var imagesPath = "./img/";
	var images = [
		// componentes
		{id: "servo",	src: "icones_servo-ani-lg.png"},
	];

	// array com o level
	var filesPath = "./js/simulator/files/";
	var files = [
		{ id: "level", src: "level.json" },
	];

	// carrega os arquivos selecionados
	preload = new createjs.LoadQueue(false);
	preload.addEventListener("complete", doneLoading);		// chama a função doneLoading() quando termina de carregar os arquivos
	preload.addEventListener("progress", updateLoading);	// enquanto carrega atualiza a barra de progresso
	preload.loadManifest(images, true, imagesPath); 		// carrega as imagens
	preload.loadManifest(files, true, filesPath); 			// carrega as imagens
}



/* 
 * função: updateLoading()
 * descrição: função executada enquanto os arquivos estão sendo carregados;
 * 			  usada para mostrar a barra de progresso;
 */
function updateLoading() {
	messageField.text = "CARREGANDO " + (preload.progress * 100 | 0) + "%";  // altera o texto
	stage.update(); // aplica as alterações no stage
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
 * descrição: inicia o simulador;
 *			  reinicia o simulador;
 */
function start() {
	// remove todos os elementos conectados ao stage
	stage.removeAllChildren();
	// apaga qualquer coisa desenhada no stage
	stage.clear();

	workarea = new Workarea({
		// altura e largura da área de trabalho
		width: 600,
		height: canvas.height,
		// altura e largura da área visível, correpondetnte ao canvas
		canvasWidth: canvas.width,
		canvasHeight: canvas.height,
		// tamanho da célula do grid
		cellSize: 10,
		// cores e estilo da grid
		colorScheme: colorScheme.workarea,
		gridStyle: "dotted", // line, crosshair, dotted || default: dotted
	});

	// cria um shape para armazenar o fio que representa a conexão
	wire = new createjs.Shape();
	workarea.addChild(wire);


	// cria a array que armazena os componentes
	componentArray = new ComponentArray({
		componentDefinitions: predefinedComponent,
		componentAssets: {
			servo: preload.getResult("servo")
		},
		colorScheme: colorScheme.component,
		fontStyle: componentFontStyle,
		workarea: workarea
	});
	workarea.addChild(componentArray);

	// cria o menu
	menu = new MenuRoot({
		colorScheme: colorScheme.menu,
		fontStyle: componentFontStyle,
		draft: 	menuDraft,
		radius: 20,
		componentArray: componentArray
	});
	workarea.addChild(menu, mouseTimer.g);

	// carrega as configurações iniciais (quais componentes existem e suas conexões)
	// e salva na variável level
	var level = preload.getResult("level");

	// cria os componentes a partir do arquivo carregado 
	if(level != null) {
		for (var i = 0; i < level.component.length; i++) {
			componentArray.add(level.component[i]);
		};
	}

	// adiciona a workarea ao stage
	stage.addChild(workarea);

	// aplica as alterações no stage
	stage.update();

	// inicializa o loop (tick)	
	if (!createjs.Ticker.hasEventListener("tick")) {
		createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
		createjs.Ticker.framerate = 60;
		createjs.Ticker.addEventListener("tick", tick);
	}

	createjs.Ticker.setFPS(60);
	createjs.Ticker.addEventListener("tick", stage);

	// associa as funções criadas aos eventos do mouse sobre o stage
	stage.on("stagemousemove", stagemousemove);
	stage.on("stagemousedown", stagemousedown);
	stage.on("stagemouseup", stagemouseup);
	stage.on("dblclick", stagedblclick);
}

var tmpWire = {
	on: false,
	connected: false,
	fromObj: null,
	toObj: null,
	fromNode: {x: 0, y: 0},
	toNode: {x: 0, y: 0},
	reset: function() {
		this.on = false;
		this.connected = false;
		this.fromObj = null;
		this.toObj = null;
		this.fromNode = {x: 0, y: 0};
		this.toNode = {x: 0, y: 0};
	}
};

function stagemousemove(event) {
	// atualiza a posição dos componentes caso estejam sendo arrastados
	componentArray.followMouse(event);

	// atualiza o fio temporário
	if(tmpWire.on) {

		var obj = stage.getObjectUnderPoint(event.stageX, event.stageY, 2);

		if(obj != null &&
		   ((obj.parent.type == "input" && tmpWire.fromObj != null) ||
		   (obj.parent.type == "output" && tmpWire.toObj != null)))
		{
			tmpWire.connected = true;

			if(obj.parent.type == "input" && tmpWire.fromObj != null) {
				tmpWire.toNode = Math.addVector(obj.parent, obj.parent.parent);
			} else if(obj.parent.type == "output" && tmpWire.toObj != null) {
				tmpWire.fromNode = Math.addVector(obj.parent, obj.parent.parent);
			}

		} else {
			tmpWire.connected = false;

			if(tmpWire.toObj != null) {
				tmpWire.fromNode = {
					x: event.stageX - workarea.x,
					y: event.stageY - workarea.y
				};
			} else {
				tmpWire.toNode = {
					x: event.stageX - workarea.x,
					y: event.stageY - workarea.y
				};
			}
		}
	}

	if(workarea.dragging) {
		menu.close();
	}

	mouseTimer.stop();
}

function stagemouseup(event) {
	var obj = stage.getObjectUnderPoint(event.stageX, event.stageY, 2);
	if(obj != null && tmpWire.on) checkForConnection(obj);
	
	if(mouseTimer.complete) {
		menu.open(event.stageX - workarea.x, event.stageY - workarea.y);
	}
	mouseTimer.stop();
}

function stagemousedown(event) {

	var obj = stage.getObjectUnderPoint(event.stageX, event.stageY, 2);

	if(obj != null) {
		if(tmpWire.on) {
			checkForConnection(obj);
			removeConnection(obj);
			tmpWire.reset();
		} else {
			if(obj.parent.type == "input") {
				tmpWire.fromObj = null;
				tmpWire.toObj = obj.parent;
				tmpWire.on = true;
				tmpWire.toNode = Math.addVector(obj.parent, obj.parent.parent);
				tmpWire.fromNode = tmpWire.toNode;
			}

			if(obj.parent.type == "output") {
				tmpWire.fromObj = obj.parent;
				tmpWire.toObj = null;
				tmpWire.on = true;
				tmpWire.fromNode = Math.addVector(obj.parent, obj.parent.parent);
				tmpWire.toNode = tmpWire.fromNode;
			}

			if(!workarea.dragging && obj.parent == workarea) {
				mouseTimer.start(event.stageX - workarea.x, event.stageY - workarea.y);
			}

			if(menu.isOpen) {
				if(obj.parent == workarea) {
					menu.close();
				} else if(obj.parent.constructor.name != "MenuButton") {
					menu.close();
				}
			}
		}
	}
}

function stagedblclick(event) {
	var obj = stage.getObjectUnderPoint(event.stageX, event.stageY, 2);

	if(obj != null && !tmpWire.on && !workarea.dragging) {
		// se clicar sobre a workarea mas não sobre outro objeto abre o menu e o fio estiver desligado
		if(obj.parent == workarea && !menu.isOpen) {
			menu.open(event.stageX - workarea.x, event.stageY - workarea.y);
		}
	}
}


/* 
 * função: removeConnection()
 * descrição: no caso de clicar duas vezes sobre o mesmo termial
 *			  remove uma conexão
 */
function removeConnection(obj) {
	// apaga o fio caso clique em cima do mesmo terminal
	if(tmpWire.fromObj != null && obj.parent === tmpWire.fromObj) {
		var objIndex = searchArrayObj(obj.parent, "from", connection);
		if(objIndex > -1) connection.splice(objIndex, 1);
	}

	if(tmpWire.toObj != null && obj.parent === tmpWire.toObj) {
		var objIndex = searchArrayObj(obj.parent, "to", connection);
		if(objIndex > -1) connection.splice(objIndex, 1);
	}
}


/* 
 * função: checkForConnection()
 * descrição: avalia se é possível conectar dois terminais e, se for,
 *			  conecta o terminal do objeto salvo ao terminal
 *			  do objeto que o usuário acaba de interagir
 */
function checkForConnection(obj) {
	// conecta
	if(obj.parent.type == "input" && tmpWire.fromObj != null) {

		var indexTo = searchArrayObj(obj.parent, "to", connection);
		if(indexTo > -1) {
			connection.splice(indexTo, 1);
		}

		connection.push({
			from: tmpWire.fromObj,
			to: obj.parent,
		});

		tmpWire.reset();
	}

	if(obj.parent.type == "output" && tmpWire.toObj != null) {

		var indexTo = searchArrayObj(tmpWire.toObj, "to", connection);
		if(indexTo > -1) {
			connection.splice(indexTo, 1);
		}

		connection.push({
			from: obj.parent,
			to: tmpWire.toObj,
		});

		tmpWire.reset();
	}
}



/* 
 * função: searchArrayObj()
 * descrição: procura por um valor na propriedade escolhida de um objeto
 *			  dentro de um array. retorna o index do primeiro objeto
 */
function searchArrayObj(value, property, myArray) {
	for (var i = 0; i < myArray.length; i++) {
		if(myArray[i][property] != null) {
			if (myArray[i][property] === value) {
				return i;
			}
		}
	}
	return -1;
}



/* 
 * função: tick()
 * descrição: função que executa o loop;
 */
function tick(event) {
	wire.graphics.clear().beginStroke(colorScheme.wire.attached).setStrokeStyle(2);

	if(mouseTimer.on) {
		mouseTimer.updateUI();
	}

	if(connection.length > 0) {
		for (var i = 0; i < connection.length; i++) {
			var fromNode = Math.addVector(connection[i].from, connection[i].from.parent);
			var toNode   = Math.addVector(connection[i].to, connection[i].to.parent);
			if(fromNode != undefined && toNode != undefined) {
				drawWire(fromNode, toNode);
				connection[i].to.setValue(connection[i].from.value);
			}
		};
	}

	if(tmpWire.on) {
		wire.graphics.beginStroke(colorScheme.wire.temporary);
		if(!tmpWire.connected) {
			wire.graphics.setStrokeStyle(2).setStrokeDash([5, 2], 0);
		} else {
			wire.graphics.setStrokeStyle(3,"round");
		}
		drawWire(tmpWire.fromNode, tmpWire.toNode);
	}
}


// o evento "resize" é chamado toda vez que o browser mudar de tamanho
// ou o dispositivo móvel mudar de orientação (já que vai mudar o tamanho da tela)
window.addEventListener('resize', resize, false); // adiciona o listener à janela
var resizeType = "width";

function resize() { 
	if(resizeType == "width"  || resizeType == "both") stage.canvas.width  = window.innerWidth;  // update width
	if(resizeType == "height" || resizeType == "both") stage.canvas.height = window.innerHeight; // update height
	if(workarea != null) workarea.resize(stage.canvas);
}


/* 
 * função: drawWire()
 * descrição: função que desenha um fio usando uma curva bezier entre dois pontos
 */
function drawWire(startPoint, endPoint) {
	// atualiza o valor do nó

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

