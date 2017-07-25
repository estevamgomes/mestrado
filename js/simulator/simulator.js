// variáveis
var stage,			// objeto root lrvrl onde outros elementos serão fixados e renderizados
	canvas,			// canvas é o elemento html onde as coisas são desenhadas
	preload, 		// loader do PreloadJs
	workarea, 		// area de trabalho
	menu, 			// objeto do menu
	mousetimer,		// objeto que armazena o timer do mouse
	bin,			// lixeira

	componentContainer,  // objeto que armazena os componentes
	connectionContainer; // objeto que armazena as conexões

var messageField;	// campo para exibir as mensagens

/* 
 * função: init()
 * descrição: primeira função a ser executada no código;
 *			  é executada apenas uma vez;
 *			  essa função deve ser chamada no atributo onLoad="init()" da tag body;
 */
function init() {

	// exibe mensagens em caso de erro
	/*
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
	*/

	// cria um objeto stage do createjs a partir de um canvas
	stage = new createjs.Stage("simulatorCanvas");
	canvas = stage.canvas;
	stage.canvas.style.backgroundColor = styleScheme.background; // altera a cor do canvas

	// atualiza o tamanho do canvas para o tamanho da janela
	// essa função deve ser chamado depois do stage
	resize(); 

	// ativa o evento mouseOver
	stage.enableMouseOver();

	// mensagem de loading
	messageField = new createjs.Text();
	messageField.set({
		text: "CARREGANDO",
		font: styleScheme.loading.font,
		color: styleScheme.loading.text,
		maxWidth: 1000,
		textAlign: "center",
		textBaseline: "middle",
		x: canvas.width / 2,
		y: canvas.height / 2
	})
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

	// array com o scene
	var filesPath = "./js/simulator/files/";
	var files = [
		{ id: "scene", src: "scene.json" },
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

	// carrega as configurações iniciais (quais componentes existem e suas conexões)
	// e salva na variável scene
	var scene = preload.getResult("scene");

	// atualiza as cores da cena a partir do arquivo carregado
	// Object.assign(styleScheme, scene.styleScheme);

	//////////////////
	//// workarea ////
	//////////////////
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
		styleScheme: styleScheme.workarea,
	});


	//////////////////
	//// conexões ////
	//////////////////

	connectionContainer = new ConnectionContainer({
		styleScheme: styleScheme.connection,
		workarea: workarea
	});
	workarea.addChild(connectionContainer);


	/////////////////////
	//// componentes ////
	/////////////////////

	componentContainer = new ComponentContainer({
		componentDefinitions: componentDefinitions,
		componentAssets: {
			servo: preload.getResult("servo")
		},
		styleScheme: styleScheme.component,
		workarea: workarea,
		connectionContainer: connectionContainer
	});
	workarea.addChild(componentContainer);

	connectionContainer.componentContainer = componentContainer;


	//////////////
	//// menu ////
	//////////////

	// menu
	menu = new MenuRoot({
		styleScheme: styleScheme.menu,
		draft: 	menuDraft,
		radius: 20,
		componentContainer: componentContainer
	});

	// timer para abrir o menu com o clique do mouse
	mouseTimer = new MouseTimer({
		styleScheme: styleScheme.mouseTimer,
	});
	workarea.addChild(mouseTimer, menu);


	////////////////////////////////
	//// carrega os componentes ////
	////////////////////////////////

	// cria os componentes a partir do arquivo carregado 
	if(scene != null) {
		for (var i = 0; i < scene.component.length; i++) {
			componentContainer.addComponent(scene.component[i]);
		};
		for (var i = 0; i < scene.connection.length; i++) {
			connectionContainer.addConnection(scene.connection[i]);
		};
	}


	/////////////////
	//// lixeira ////
	/////////////////

	// lixeira
	bin = new Bin({
		styleScheme: styleScheme.bin,
		workarea: workarea,
		componentContainer: componentContainer,
		// altura e largura da área visível, correpondetnte ao canvas
		canvasWidth: canvas.width,
		canvasHeight: canvas.height,
	});

	// adiciona a workarea ao stage
	stage.addChild(workarea, bin);

	// aplica as alterações no stage
	stage.update();

	// inicializa o loop (tick)	
	if (!createjs.Ticker.hasEventListener("tick")) {
		createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
		createjs.Ticker.framerate = 60;
		createjs.Ticker.addEventListener("tick", tick);
		createjs.Ticker.addEventListener("tick", stage);
	}

	// associa as funções criadas aos eventos do mouse sobre o stage
	stage.on("stagemousemove", stagemousemove);
	stage.on("stagemousedown", stagemousedown);
	stage.on("stagemouseup", stagemouseup);
	workarea.dragArea.on("dblclick", workareaDblclick);
}


/* 
 * função: stagemousemove()
 * descrição: 
 */
function stagemousemove(event) {
	// atualiza a posição dos componentes caso estejam sendo arrastados
	componentContainer.followMouse(event);
	connectionContainer.mousemove(event);

	if(workarea.dragging) {
		menu.close();
	}

	mouseTimer.mousemove(event);
}


/* 
 * função: stagemouseup()
 * descrição: 
 */
function stagemouseup(event) {
	var obj = stage.getObjectUnderPoint(event.stageX, event.stageY, 2);
	
	if(obj != null){
		if(connectionContainer.hasTemporaryConnection() &&
			obj.parent.constructor.name == "Terminal") {
			obj.parent.mouseup(event);
		}
	}

	if(mouseTimer.complete) {
		menu.open(event.stageX - workarea.x, event.stageY - workarea.y);
	}

	mouseTimer.mouseup(event);
}


/* 
 * função: stagemousedown()
 * descrição: 
 */
function stagemousedown(event) {
	var obj = stage.getObjectUnderPoint(event.stageX, event.stageY, 2);

	if(obj != null) {
		connectionContainer.mouseDownOverObj(obj);

		if(!workarea.dragging && obj.parent == workarea) {
			mouseTimer.mousedown(event);
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


/* 
 * função: workareaDblclick()
 * descrição: 
 */
function workareaDblclick(event) {
	if(!workarea.dragging) {
		// se clicar sobre a workarea mas não sobre outro objeto abre o menu
		if(!menu.isOpen) {
			menu.open(event.stageX - workarea.x, event.stageY - workarea.y);
		}
	}
}


/* 
 * função: tick()
 * descrição: função que executa o loop;
 */
function tick(event) {
	mouseTimer.tick();
	connectionContainer.tick();
	componentContainer.tick();
}


/* 
 * função: resize()
 * descrição: 
 */

// o evento "resize" é chamado toda vez que o browser mudar de tamanho
// ou o dispositivo móvel mudar de orientação (já que vai mudar o tamanho da tela)
window.addEventListener('resize', resize, false); // adiciona o listener à janela
var resizeType = "width";

function resize() { 
	if(resizeType == "width"  || resizeType == "both") stage.canvas.width  = document.documentElement.clientWidth;  // update width
	if(resizeType == "height" || resizeType == "both") stage.canvas.height = document.documentElement.clientHeight; // update height
	if(workarea != null) workarea.resize(stage.canvas);
	if(bin != null) bin.resize(stage.canvas);
}




/* 
 * função: 
 * descrição: 
 */
// keycodes
var KEYCODE_W = 119,
	KEYCODE_G = 103,
	KEYCODE_E = 101;

// register key functions
document.onkeypress = handleKeyPress;
// document.onkeydown = handleKeyDown;
// document.onkeyup = handleKeyUp;

/* 
 * função: handleKeyPress()
 * descrição: 
 */
function handleKeyPress(e) {
	//cross browser issues exist
	if (!e) {
		var e = window.event;
	}

	switch (e.keyCode) {
		case KEYCODE_G:
			changeGridType();
			return false;
		case KEYCODE_W:
			changeWireType();
			return false;
		case KEYCODE_E:
			exportCurrentState();
			return false;
	}
}


/* 
 * função: exportCurrentState()
 * descrição: 
 */
function exportCurrentState() {
	var scene = {
		component: componentContainer.exportCurrentState(),
		connection: connectionContainer.exportCurrentState(),
		styleScheme: styleScheme
	};

	var data = {a:1, b:2, c:3};
	var json = JSON.stringify(scene);
	var blob = new Blob([json], {type: "application/json"});
	var url  = URL.createObjectURL(blob);


	var a = document.createElement('a');
	a.download    = "scene.json";
	a.href        = url;
	a.click();
}


/* 
 * função: changeWireType()
 * descrição: 
 */
var wireType = ["bezier", "ortho", "line"];
function changeWireType() {
	var index = wireType.indexOf(styleScheme.connection.default.wireType);
	index = index < wireType.length - 1 ? index + 1 : 0;
	styleScheme.connection.default.wireType = wireType[index];
}


/* 
 * função: changeGridType()
 * descrição: 
 */
var gridType = ["line", "crosshair", "dotted", "null"];
function changeGridType() {
	var index = gridType.indexOf(styleScheme.workarea.gridType);
	index = index < gridType.length - 1 ? index + 1 : 0;
	styleScheme.workarea.gridType = gridType[index];
	workarea.updateUI();
}