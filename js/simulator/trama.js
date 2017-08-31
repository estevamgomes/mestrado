(function(window, document){
	// Read about 'use strict': <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode>
	"use strict";

	function define_trama() {
		var o = {};

		// carrega e armazena os assets para que sejam acessados
		// por todas as instâncias do jogo na mesma página

		var preload, 	// loader do PreloadJs
			simulatorArray = [];

		/* 
		 * função: loadAssets()
		 * descrição: inicia o carregamento dos arquivos externos
		 */
		o.loadAssets = function(path) {
			// array com os arquivos que serão carregados
			var imagesPath = path || "./img/";
			var images = [
				// componentes
				{id: "servo", src: "icones_servo-ani-lg-90.png"},
				{id: "led",	  src: "icones_led-sim.png"},
				{id: "sonar", src: "icones_sonar.png"},
				// {id: "background", src: "background_dot.png"}
				{id: "background", src: "background_dot_03.png"}
				// {id: "background", src: "bg-grid-01.png"}
				// {id: "background", src: "bg-grid-02.png"}
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
			for (var i = 0; i < simulatorArray.length; i++) {
				simulatorArray[i].updateLoading();
			};
		}


		/* 
		 * função: doneLoading()
		 * descrição: função executada após todos os arquivos serem carregados;
		 *			  é executada apenas uma vez;
		 */
		function doneLoading() {
			for (var i = 0; i < simulatorArray.length; i++) {
				simulatorArray[i].doneLoading();
			};
		}


		// register key functions
		document.onkeypress = handleKeyPress;
		document.onkeyup = handleKeyUp;
		// document.onkeydown = handleKeyDown;


		/* 
		 * função: updateLoading()
		 * descrição: função executada enquanto os arquivos estão sendo carregados;
		 * 			  usada para mostrar a barra de progresso;
		 */
		function handleKeyPress(e) {
			for (var i = 0; i < simulatorArray.length; i++) {
				if(!simulatorArray[i].paused) simulatorArray[i].handleKeyPress(e);
			};
		}


		/* 
		 * função: doneLoading()
		 * descrição: função executada após todos os arquivos serem carregados;
		 *			  é executada apenas uma vez;
		 */
		function handleKeyUp(e) {
			for (var i = 0; i < simulatorArray.length; i++) {
				if(!simulatorArray[i].paused) simulatorArray[i].handleKeyUp(e);
			};
		}


		/* 
		 * função: pauseChildren()
		 * descrição: 
		 */
		o.pauseChildren = function() {
			for (var i = 0; i < simulatorArray.length; i++) {
				simulatorArray[i].setPaused(true);
			};
		}


		/* 
		 * função: windowResize()
		 * descrição: 
		 */
		// o evento "resize" é chamado toda vez que o browser mudar de tamanho
		// ou o dispositivo móvel mudar de orientação (já que vai mudar o tamanho da tela)
		window.addEventListener('resize', windowResize); // adiciona o listener à janela
		function windowResize() {
			for (var i = 0; i < simulatorArray.length; i++) {
				simulatorArray[i].resize();
			};
		}
		

		/* 
		 * função: windowScroll()
		 * descrição: 
		 */
		window.addEventListener('scroll', windowScroll); // adiciona o listener à janela
		function windowScroll() {
			for (var i = 0; i < simulatorArray.length; i++) {
				simulatorArray[i].checkCanvasPos();
			};
		}


		/* 
		 * função: windowScroll()
		 * descrição: 
		 */
		window.addEventListener('blur', windowBlur); // adiciona o listener à janela
		function windowBlur() {
			o.pauseChildren();
		}


		/* 
		 * função: addClass(elemento, nome da classe)
		 * descrição: adiciona uma classe à um elemento
		 */
		o.addClass = function(el, className) {
			if (el.classList) {
				el.classList.add(className);
			} else {
				el.className += ' ' + className;
			}
		}


		/* 
		 * função: ajax()
		 * descrição: 
		 */
		o.ajax = function(config) {
			var request = new XMLHttpRequest();
			request.open('GET', config.url, true);

			request.onload = function() {
				if (this.status >= 200 && this.status < 400) {
					// Success!
					var data = JSON.parse(this.response);
					console.log(data);
					config.onload(data);
				} else {
					// We reached our target server, but it returned an error
				}
			};

			request.onerror = function() {
				// There was a connection error of some sort
			};

			request.send();
		}


		/* 
		 * classe: Simulator
		 * descrição: 
		 */
		o.Simulator = function(config) {
			simulatorArray.push(this);

			// variáveis
			var stage,  // objeto raiz onde outros elementos serão fixados e renderizados

				canvas, // canvas é o elemento html onde as coisas são desenhadas
				minWidth  = 200,
				minHeight = 200,
				width 	  = config.width  || "fit",
				height 	  = config.height || minHeight * 2,

				workarea, // area de trabalho
				workareaWidth  = config.workareaWidth || false,
				workareaHeight = config.workareaHeight || false,

				compmenu = config.hasOwnProperty("compmenu") ? config.compmenu : true, // objeto do menu

				mainmenu = config.hasOwnProperty("mainmenu") ? config.mainmenu : true,
				scenesPath = config.scenesPath || "",
				mouseTimer,	// objeto que armazena o timer do mouse

				bin,		// lixeira
				simObj = this,
				autoplay = config.hasOwnProperty("autoplay") ? config.autoplay : true,

				componentContainer,  // objeto que armazena os componentes
				connectionContainer, // objeto que armazena as conexões

				messageField,	// campo para exibir as mensagens
				overshadow,
				framerate;
			
			this.paused = false;
			this.styleScheme = JSON.parse(JSON.stringify(defaultStyleScheme));

			var scene = config.scene || false,
				div   = document.getElementById(config.divId) || false;

			if(!div) {
				console.log("Error: DIV not found");
				return false;
			}

			// adiciona a classe .trama-wrapper à div
			o.addClass(div, "trama-wrapper");
			
			// adiciona um canvas e um menu ao div
			var canvasHtml = '<canvas class="trama-canvas" width="' + getCWidth() + '" height="' + getCHeight() + '"><p>Your browser does not support the canvas tag.</p></canvas>';
			div.innerHTML += canvasHtml;

			// stage: cria um objeto stage do createjs a partir de um canvas
			stage = new createjs.Stage(div.querySelectorAll("canvas")[0]);
			stage.enableMouseOver(); // ativa o evento mouseOver
			
			// canvas
			canvas = stage.canvas;
			canvas.style.backgroundColor = this.styleScheme.main.background; // altera a cor do canvas


			// mensagem de loading
			messageField = new createjs.Text();
			messageField.set({
				text: "CARREGANDO",
				font: this.styleScheme.main.loadingFont,
				color: this.styleScheme.main.loadingText,
				maxWidth: 1000,
				textAlign: "center",
				textBaseline: "middle",
				x: canvas.width / 2,
				y: canvas.height / 2
			})
			stage.addChild(messageField);
			stage.update(); 	//update the stage to show text

			if(preload.loaded) {
				this.start();
			}


			/* 
			 * função: updateLoading()
			 * descrição: função executada enquanto os arquivos estão sendo carregados;
			 * 			  usada para mostrar a barra de progresso;
			 */
			this.updateLoading = function() {
				messageField.text = "CARREGANDO " + (preload.progress * 100 | 0) + "%";  // altera o texto
				stage.update(); // aplica as alterações no stage
			}


			/* 
			 * função: doneLoading()
			 * descrição: função executada após todos os arquivos serem carregados;
			 *			  é executada apenas uma vez;
			 */
			this.doneLoading = function() {
				messageField.text = "SIMULADOR DE SISTEMAS\n\nclique para iniciar"; // altera o texto
				stage.update(); // aplica as alterações no stage

				this.start(); // inicia o simulador
			}

			/* 
			 * função: start()
			 * descrição: inicia o simulador;
			 *			  reinicia o simulador;
			 */
			this.start = function() {

				// cria o menu principal
				if(mainmenu) {
					mainmenu = new MainMenu({
						div: div,
						simObj: this,
						scenesPath: scenesPath
					});
				}

				// remove todos os elementos conectados ao stage
				stage.removeAllChildren();
				// apaga qualquer coisa desenhada no stage
				stage.clear();
				stage.snapToPixelEnabled = true;

				// atualiza o esquema de estilo a partir do arquivo carregado
				// if(scene) Object.assign(this.styleScheme, scene.styleScheme);

				//////////////////
				//// workarea ////
				//////////////////
				var workareaConfig = {
					// altura e largura da área de trabalho
					width:  workareaWidth  || canvas.width,
					height: workareaHeight || canvas.height,

					// altura e largura da área visível, correpondetnte ao canvas
					canvasWidth: canvas.width,
					canvasHeight: canvas.height,
					// tamanho da célula do grid
					cellSize: 10,
					// cores e estilo da grid
					styleScheme: this.styleScheme.workarea,
					background: preload.getResult("background")
				};
				if(scene) Object.assign(workareaConfig, scene.workarea);
				workarea = new Workarea(workareaConfig);

				//////////////////
				//// conexões ////
				//////////////////

				connectionContainer = new ConnectionContainer({
					styleScheme: this.styleScheme.connection,
					workarea: workarea
				});
				workarea.addChild(connectionContainer);


				/////////////////////
				//// componentes ////
				/////////////////////

				componentContainer = new ComponentContainer({
					componentDefinitions: componentDefinitions,
					componentAssets: {
						servo: preload.getResult("servo"),
						sonar: preload.getResult("sonar"),
						led: preload.getResult("led")
					},
					styleScheme: this.styleScheme.component,
					workarea: workarea,
					connectionContainer: connectionContainer
				});
				workarea.addChild(componentContainer);

				connectionContainer.componentContainer = componentContainer;


				//////////////
				//// menu ////
				//////////////

				// component menu
				if(compmenu) {
					compmenu = new MenuRoot({
						styleScheme: this.styleScheme.menu,
						draft: 	menuDraft,
						radius: 20,
						componentContainer: componentContainer
					});

					// timer para abrir o menu com o clique do mouse
					mouseTimer = new MouseTimer({
						styleScheme: this.styleScheme.mouseTimer,
					});
					workarea.addChild(mouseTimer, compmenu);
				}


				////////////////////////////////
				//// carrega os componentes ////
				////////////////////////////////

				// cria os componentes a partir do arquivo carregado 
				if(scene) {
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
					styleScheme: this.styleScheme.bin,
					workarea: workarea,
					componentContainer: componentContainer,
					// altura e largura da área visível, correpondetnte ao canvas
					canvasWidth: canvas.width,
					canvasHeight: canvas.height
				});


				////////////////////////////////
				//// mostrador do framerate ////
				////////////////////////////////

				framerate = new createjs.Text();
				framerate.set({
					text: "Framerate",
					font: this.styleScheme.main.framerateFont,
					color: this.styleScheme.main.framerateText,
					maxWidth: 1000,
					textAlign: "left",
					textBaseline: "top",
					x: 10,
					y: 10
				});


				////////////////////////////////////////////////
				//// retangulo que cobre a área de trabalho ////
				////////////////////////////////////////////////

				overshadow = new createjs.Shape();
				messageField.alpha = 0;

				// adiciona a workarea ao stage
				stage.addChild(workarea, bin, framerate, overshadow, messageField);

				// aplica as alterações no stage
				stage.update();

				// inicializa o loop (tick)	
				if (!createjs.Ticker.hasEventListener("tick")) {
					createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
					createjs.Ticker.framerate = 60;
				}

				createjs.Ticker.addEventListener("tick", tick);
				createjs.Ticker.addEventListener("tick", stage);

				// associa as funções criadas aos eventos do mouse sobre o stage
				stage.on("stagemousemove", stagemousemove);
				stage.on("stagemousedown", stagemousedown);
				stage.on("stagemouseup", stagemouseup);
				workarea.dragArea.on("dblclick", workareaDblclick);

				this.checkCanvasPos();
			}

			/* 
			 * função: stagemousemove()
			 * descrição: 
			 */
			function stagemousemove(event) {

				workarea.mouseMove(event);

				// atualiza a posição dos componentes caso estejam sendo arrastados
				componentContainer.followMouse(event);
				connectionContainer.mousemove(event);

				if(compmenu) {
					if(workarea.dragging) {
						compmenu.close();
					}
					mouseTimer.mousemove(event);
				}
			}


			/* 
			 * função: stagemouseup()
			 * descrição: 
			 */
			function stagemouseup(event) {
				var obj = stage.getObjectUnderPoint(event.stageX, event.stageY, 2);
				
				if(obj){
					if(connectionContainer.hasTemporaryConnection() &&
						obj.parent.constructor.name === "Terminal") {
						obj.parent.mouseup(event);
					}
				}

				if(compmenu) {
					if(mouseTimer.complete) {
						compmenu.open(event.stageX - workarea.x, event.stageY - workarea.y);
					}
					mouseTimer.mouseup(event);
				}
			}


			/* 
			 * função: stagemousedown()
			 * descrição: 
			 */
			function stagemousedown(event) {
				var obj = stage.getObjectUnderPoint(event.stageX, event.stageY, 2);

				if(obj) {
					connectionContainer.mouseDownOverObj(obj);

					if(compmenu) {
						if(!workarea.dragging && obj.parent === workarea) {
							mouseTimer.mousedown(event);
						}

						if(compmenu.isOpen) {
							if(obj.parent === workarea) {
								compmenu.close();
							} else if(obj.parent.constructor.name !== "MenuButton") {
								compmenu.close();
							}
						}
					}
				}

				o.pauseChildren();
				if(simObj.paused) simObj.setPaused(false);
			}


			/* 
			 * função: workareaDblclick()
			 * descrição: 
			 */
			function workareaDblclick(event) {
				if(!workarea.dragging) {
					// se clicar sobre a workarea mas não sobre outro objeto abre o menu
					if(compmenu && !compmenu.isOpen) {
						compmenu.open(event.stageX - workarea.x, event.stageY - workarea.y);
					}
				}
			}


			/* 
			 * função: setPaused(boolean)
			 * descrição: 
			 */
			this.setPaused = function(value) {
				this.paused = value;
				if(this.paused) {
					if(overshadow) {
						overshadow.alpha = .8; // altera o texto
						overshadow.graphics.clear()
							.beginFill(this.styleScheme.main.overshadow)
							.drawRect(0, 0, canvas.width, canvas.height);
					}

					messageField.set({
						alpha: 1,
						lineHeight: 20,
						lineWidth: 220,
						x: canvas.width / 2,
						y: canvas.height / 2,
						text: "CLIQUE PARA CONTINUAR"
					});
				} else {
					if(mainmenu && typeof mainmenu.close === 'function') mainmenu.close();
					if(overshadow) overshadow.alpha = 0; // altera o texto
					messageField.alpha = 0; // altera o texto
				}
			}


			/* 
			 * função: tick()
			 * descrição: função que executa o loop;
			 */
			function tick(event) {
				if(!simObj.paused) {
					framerate.text = Math.roundTo(createjs.Ticker.getMeasuredFPS(), 2) + " / " + Math.roundTo(createjs.Ticker.framerate, 2);
					if(compmenu) mouseTimer.tick();
					connectionContainer.tick();
					componentContainer.tick();
				}
			}


			/* 
			 * função: resize()
			 * descrição: 
			 */
			this.resize = function() { 
				canvas.width  = getCWidth();  // update width
				canvas.height = getCHeight(); // update height

				if(workarea) workarea.resize(canvas);
				if(bin) bin.resize(canvas);

				if(overshadow) {
					overshadow.graphics.clear()
						.beginFill(this.styleScheme.main.overshadow)
						.drawRect(0, 0, canvas.width, canvas.height);
				}

				messageField.set({
					x: canvas.width / 2,
					y: canvas.height / 2,
				});
			}

			function getCWidth() {
				var newWidth; 
				if(isNumeric(width)) {
					newWidth = width;
				} else {
					switch(width) {
						case "fit":
							return document.documentElement.clientWidth;
							break;
					}
				}
				if(newWidth < minWidth) newWidth = minWidth
				return newWidth;
			}

			function getCHeight() {
				var newHeight; 
				if(isNumeric(height)) {
					newHeight = height;
				} else {
					switch(height) {
						case "fit":
							return document.documentElement.clientHeight;
							break;
					}
				}
				if(newHeight < minHeight) newHeight = minHeight
				return newHeight;
			}

			function isNumeric(n) {
				return !isNaN(parseFloat(n)) && isFinite(n);
			}



			this.checkCanvasPos = function() {
				var box = div.getBoundingClientRect();
				var viewportHeight = document.documentElement.clientHeight;
				// pausa caso parte do canvas tenha saído da tela
				if((box.top + box.height / 4) < 0 || box.top > (viewportHeight - box.height / 4)) {
					this.setPaused(true);
				}

				if(autoplay) {
					if(box.top >= 0 && box.top <= viewportHeight - box.height) {
						o.pauseChildren();
						this.setPaused(false);
					}
				}
			}

			/* 
			 * função: 
			 * descrição: 
			 */
			// keycodes
			var KEYCODE_W = 87,
				KEYCODE_w = 119,
				KEYCODE_G = 71,
				KEYCODE_g = 103,
				KEYCODE_E = 69,
				KEYCODE_e = 101,

				KEYCODE_DELETE 	  = 46,
				KEYCODE_CTRL 	  = 17,
				KEYCODE_BACKSPACE = 8;

			var CTRL = false;

			/* 
			 * função: handleKeyPress()
			 * descrição: 
			 */
			this.handleKeyPress = function(e) {
				//cross browser issues exist
				if (!e) {
					var e = window.event;
				}

				switch (e.keyCode) {
					case KEYCODE_W:
					case KEYCODE_w:
						changeWireType();
						return false;
					case KEYCODE_E:
					case KEYCODE_e:
						this.exportCurrentScene();
						return false;
				}

				componentContainer.updateComponentText(e);
			}

			// Instead of keypress, use the keyup or keydown event:
			// keypress is meant for PRINTABLE characters, whereas
			// keydown will capture non-printing key presses including
			// delete, backspace, and return

			/* 
			 * função: handleKeyUp()
			 * descrição: 
			 */
			this.handleKeyUp = function(e) {

				//cross browser issues exist
				if (!e) {
					var e = window.event;
				}

				switch (e.keyCode) {
					case KEYCODE_DELETE:
						componentContainer.removeActiveComponent();
						return false;
					case KEYCODE_BACKSPACE:
						componentContainer.updateComponentText(e);
						return false;
				}
			}



			/* 
			 * função: exportCurrentScene()
			 * descrição: 
			 */
			this.exportCurrentScene = function() {
				var scene = {
					component: componentContainer.exportCurrentScene(),
					connection: connectionContainer.exportCurrentScene(),
					workarea: workarea.exportCurrentScene(),
					styleScheme: this.styleScheme,
				};

				var data = {a:1, b:2, c:3};
				var json = JSON.stringify(scene);
				var blob = new Blob([json], {type: "application/json"});
				var url  = URL.createObjectURL(blob);

				var a = document.createElement('a');
				a.download    = "scene.trm";
				a.href        = url;
				a.click();
			}


			/* 
			 * função: importScene()
			 * descrição: 
			 */
			this.importScene = function(e) {
				readSingleFile(e);	// 
				e.srcElement.value = ""; 	// apaga o arquivo do input
			}

			function readSingleFile(e) {
			  var file = e.target.files[0];
			  if (!file) return;
			  var reader = new FileReader();
			  reader.onload = function(e) {
			    var contents = e.target.result;
			    jsonToObj(contents);
			  };
			  reader.readAsText(file);
			}

			function jsonToObj(json) {
				simObj.displayContents(JSON.parse(json));
			}

			this.displayContents = function(newScene) {
				scene = newScene;
				simObj.start();
			}


			/* 
			 * função: changeWireType()
			 * descrição: 
			 */
			var wireType = ["bezier", "ortho", "diagonal", "line"];
			function changeWireType() {
				var index = wireType.indexOf(simObj.styleScheme.connection.default.wireType);
				index = index < wireType.length - 1 ? index + 1 : 0;
				simObj.styleScheme.connection.default.wireType = wireType[index];
			}

		}

		return o;
	}

	//define globally if it doesn't already exist
	if(typeof(trama) === 'undefined'){
		window.trama = define_trama();
	} else {
		console.log("trama already defined.");
	}
}(window, document));