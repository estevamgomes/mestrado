
///////////////
//// Cores ////
///////////////

var color = {
	preto: 		"#000000",
	cinzaescuro:"#999999",
	cinza: 		"#cccccc",
	cinzamedio:	"#deddd9",
	cinzaclaro:	"#f5f4f0",
	branco: 	"#ffffff",
	vermelho: 	"#EB3964",
	azul: 		"#645ED7", 
	azulclaro:	"#7D76FF", 
	amarelo: 	"#ffde00",
	roxo: 		"#7f3fa5", 
	rosaclaro:  "#f490c7",
	rosa: 		"#e51a80",
	verdeclaro: "#bef4e9",
	verde: 		"#76ceb5"
};



/////////////////////////
//// Folha de estilo ////
/////////////////////////

var styleScheme = {
	// cor do fundo do canvas
	background: color.cinzaclaro,

	// tela de carregamento
	loading: {
		font: "bold 1.4rem 'Overpass Mono', monospace",
		text: color.preto,
	},

	// conexoes
	connection: {
		default: {
			wire: color.vermelho,
			wireType: "diagonalRect", // estilo do fio = ["bezier", "ortho", "orthoB", "orthoC", "diagonal", "diagonalRect", "line"];
			size: 2,
			caps: "butt", // butt, round, square,
			dash: false
		},
		temporary: {
			wire: color.preto,
			dash: true,
		},
		active: {
			wire: color.preto,
			size: 3,
			caps: "round",
		},
		hover: {
			wire: color.azul,
			size: 3
		}
	},

	// lixeira
	bin: {
		default: {
			background: this.background,
			border: color.cinzaescuro
		},
		hover: {
			background: color.vermelho,
			border: color.branco
		}
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
			cursor: "pointer",
			// cursor: "url(img/grab.png), pointer",
			labelFont: "bold 1rem 'Overpass Mono', monospace",
			sensorRange: color.azul,
			sensorRangeAlpha: 0
		},
		grabbing: {
			background: color.azulclaro,
			border: color.azulclaro,
		},
		hover: {
			background: color.azul,
			border: color.azul,
			terminalBorder: color.vermelho,
			sensorRangeAlpha: 1
		},
		remove: {
			background: color.vermelho,
			border: color.vermelho,
			labelText: color.vermelho,
		}
	},

	// cor da área de trabalho
	workarea: {
		background: color.cinzaclaro,
		grid: color.cinzamedio,
		gridType: "dotted", // line, crosshair, dotted
	},

	// cor do menu
	menu: {
		default: {
			background: color.branco,
			text: color.preto,
			border: color.preto,
			shadow: color.cinzaescuro,
			font: "bold 1rem 'Overpass Mono', monospace",
		},
		hover: {
			background: color.vermelho,
			text: color.branco,
			border: color.vermelho,
		},
		disabled: {
			background: color.cinza,
			text: color.branco,
			border: color.branco,
		},
		selected: {
			background: color.preto,
			text: color.branco,
		},
	},

	mouseTimer: {
		default: {
			click: color.cinza,
			timer: color.cinza,
			shadow: color.cinzaescuro,
		},
		complete: {
			timer: color.vermelho,
		},
	}
};



//////////////////////////////////////////////
//// Componentes separados por categorias ////
//////////////////////////////////////////////

var predefinedComponent = [
	{
		categoryName: "control",
		categoryLabel: "|o|",
		components: [
		{
			type: "min",
			menuLabel: "min",
			label: "MIN",
			description: "Retorna o menor valor",

			inputSize: 3,
			outputSize: 1,

			run: function() {
				this.output[0].value = Math.min(this.input[0].value, this.input[1].value, this.input[2].value);
			}
		}, {
			type: "max",
			menuLabel: "max",
			label: "MAX",
			description: "Retorna o maior valor",

			inputSize: 3,
			outputSize: 1,

			run: function() {
				this.output[0].value = Math.max(this.input[0].value, this.input[1].value, this.input[2].value);
			}
		}, {
			type: "domain",
			menuLabel: "domain",
			label: "[A, B]",
			description: "Cria um domain a partir de dois valores",

			inputSize: 2,
			outputSize: 1,

			run: function() {
				this.output[0].value = [
					this.input[0].value,
					this.input[1].value
				];
			}
		}, {
			type: "homeostat",
			menuLabel: "ashby",
			label: "ASHBY",
			description: "Homeostato do Ashby",

			inputSize: 3,
			outputSize: 1,

			// component variables
			customConstructor: function(config) {
				this.inputCommutator = [];
				this.inputPotentiometer = [];
				this.uniselectorIndex = [];
				this.uniselector = [];
				this.uniselectorState = [];
				this.uniselectorLastChange  = 0; // last step when the uniselector was changed
				this.uniselectorDelay		= 500; // delay between changes at the uniselector in milliseconds
				for (var i = this.inputSize - 1; i >= 0; i--) {
					this.inputCommutator[i] = 1;
					this.inputPotentiometer[i] = 1;

					this.uniselectorState[i] = true;
					this.uniselectorIndex[i] = 0;
					this.uniselector[i] = [];
					// acrescenta valores para o uniselector
					for (var j = 0; j < 25; j++) {
						this.uniselector[i][j] = Math.roundTo(Math.random() * 2 - 1, 3);
					}
				};

				// velocidade de atualização
				this.lastUpdate = 0;
				this.updateRate = 10; // quantidade de updates por segundo
				this.updateDelay = 1000 / this.updateRate; // em milisegundos

				this.sMax = 100;  // valor máximo do output
				this.sMin = -100; // valor mínimo do output

				this.manualOutput = false;  // é verdadeiro caso o usuário esteja manipulando o output com o mouse
				this.outputLimit  = 0.5;	// se o output estiver entre +outputLimit e -outputLimit o homeostato está em equilíbrio

				////////////////
				//// SLIDER ////
				////////////////

				// slider para manipular e visualizar output
				this.slider = new createjs.Container();
				var s = this.slider;
				s.height = this.cellSize * 2;
				s.width = this.width - this.cellSize * 2;
				s.x = this.cellSize;
				s.y = - this.slider.height - this.cellSize;
				s.handleWidth = this.cellSize;

				s.maxX = this.slider.width - s.handleWidth; // posicao x máxima
				s.constrain = function(posx) {
					if(posx < 0) return 0;
					if(posx > this.maxX) return this.maxX;
					return posx;
				};
				s.moveHandle = function(newX) {
					this.handle.x = this.constrain(newX - this.handleWidth / 2);
					var newValue = Math.round(Math.map(this.handle.x, 0, this.maxX, this.parent.sMin, this.parent.sMax));
					this.parent.output[0].setValue(newValue);
					this.parent.label = newValue;
					this.parent.manualOutput = true;
				};
				s.setValue = function(value) {
					var newX = Math.round(Math.map(value, this.parent.sMin, this.parent.sMax, 0, this.maxX));
					this.handle.x = this.constrain(newX);
				};

				this.sliderBackground = new createjs.Shape();
				this.sliderBackground.graphics
					.beginFill(this.styleScheme.default.label)
					.setStrokeStyle(2)
					.beginStroke(this.styleScheme.default.border)
					.drawRect(0, 8, this.slider.width, this.cellSize / 2);

				s.handle = new createjs.Shape();
				s.handle.graphics
					.beginFill(this.styleScheme.default.background)
					.drawRect(0, 0, s.handleWidth, s.height);
				this.slider.handle.cursor = "pointer";

				// adiciona o sprite
				this.addChild(s);
				s.addChild(this.sliderBackground, s.handle);

				// drag slider
				s.on("mousedown", this.sliderMousedown);
				s.on("pressmove", this.sliderMousePressmove);
				s.on("pressup", this.sliderPressup);
			},
			sliderMousedown: function(event) {
				this.moveHandle(event.localX);
			},
			sliderMousePressmove: function(event) {
				this.moveHandle(event.localX);
			},
			sliderPressup: function(event) {
				this.parent.manualOutput = false;
			},
			run: function() {
				var timeSinceUpdate = createjs.Ticker.getTime() - this.lastUpdate;
				if(timeSinceUpdate > this.updateDelay && this.manualOutput == false) {
					var inputTotal = 0;
					var newOutput = 0;
					inputTotal += this.output[0].value; // feedback
					for (var i = this.input.length - 1; i >= 0; i--) {
						var newValue = 0;
						if(!this.uniselectorState[i]) {
							newValue = this.input[i].value * this.inputCommutator[i] * this.inputPotentiometer[i];
						} else {
							newValue = this.input[i].value * this.uniselector[i][this.uniselectorIndex[i]];
						}
						inputTotal += newValue;
					};
					newOutput = Math.roundTo(inputTotal / (this.input.length + 1), 5);

					// update output
					this.output[0].value = newOutput;
					this.slider.setValue(this.output[0].value);
					this.label = Math.roundTo(this.output[0].value, 2);
					this.lastUpdate = createjs.Ticker.getTime();
				}

				// uniselector auto change
				var timeSinceUniUpdate = createjs.Ticker.getTime() - this.uniselectorLastChange;
				if((newOutput > this.outputLimit || newOutput < -this.outputLimit) && timeSinceUniUpdate > this.uniselectorDelay) {
					for (var i = 0; i < this.input.length; i++) {
					// funcionamento da forma como foi descrito
					if(this.uniselectorIndex[i] < this.uniselector[i].length - 1) {
						this.uniselectorIndex[i]++;
					} else {
						this.uniselectorIndex[i] = 0;
					}
					// alteração randomica
					// this.uniselectorIndex[i] = Math.floor(Math.random() * this.uniselector[i].length);
					}
					this.uniselectorLastChange = createjs.Ticker.getTime();
				}
			}
		}, {
			type: "map",
			menuLabel: "map",
			label: "MAP",
			description: "Mapeia um valor de um domínio para o outro",

			inputSize: 3,
			outputSize: 1,

			run: function() {
				var value = this.input[0].value,
					fromDomain = this.input[1].value,
					toDomain = this.input[2].value;

				this.output[0].value = Math.map(value, fromDomain[0], fromDomain[1], toDomain[0], toDomain[1]);
			}
		}, {
			type: "division",
			menuLabel: "div",
			label: "A / B",
			description: "Dividir 'a' por 'b'",

			inputSize: 2,
			outputSize: 1,

			run: function() {
				this.output[0].value = this.input[0].value / this.input[1].value;
			}
		}, {
			type: "multiply",
			menuLabel: "mult",
			label: "A * B",
			description: "Multiplicar 'a' por 'b'",

			inputSize: 2,
			outputSize: 1,

			run: function() {
				this.output[0].value = this.input[0].value * this.input[1].value;
			}
		}, {
			type: "add",
			label: "A + B",
			description: "Somar 'a' com 'b'",

			inputSize: 2,
			outputSize: 1,

			run: function() {
				this.output[0].value = this.input[0].value + this.input[1].value;
			}
		}, {
			type: "subtract",
			label: "A - B",
			description: "Subtrair 'b' de 'a'",
			menuLabel: "sub",

			inputSize: 2,
			outputSize: 1,
			run: function() {
				this.output[0].value = this.input[0].value - this.input[1].value;
			}
		}, {
			type: "round",
			label: "ROUND",
			description: "Arredondar 'a'",
			menuLabel: "round",

			inputSize: 1,
			outputSize: 1,

			run: function() {
				this.output[0].value = Math.round(this.input[0].value);
			}
		}, {
			type: "absolute",
			label: "ABS",
			description: "Módulo de 'a'",
			menuLabel: "abs",

			inputSize: 1,
			outputSize: 1,

			run: function() {
				this.output[0].value = Math.abs(this.input[0].value);
			}
		}]
	}, {
		categoryName: "sensor",
		categoryLabel: ">|",
		components: [{
			type: "int",
			label: "TYPE HERE",
			description: "Campo para adicionar um número",
			menuLabel: "int",

			inputSize: 0,
			outputSize: 1,

			// component variables
			customConstructor: function(config) {
				this.styleScheme = Object.assign({}, config.styleScheme);
				this.styleScheme.default.cursor = "text";

				this.editableTextField = true;
				this.startLabel = this.label;
			},
			updateText: function(e) {
				// 0-9 only
				var keyBackspace = e.keyCode == KEYCODE_BACKSPACE,
					keyNumber = e.keyCode >= 48 && e.keyCode <= 57;

				var maxSize = 8;

				if((keyBackspace || keyNumber) && this.label === this.startLabel) {
					this.label = "";
				}

				if(keyBackspace) {
					this.label = this.label.slice(0, this.label.length - 1);
					if(this.label.length == 0) this.label = "0";
				}

				if (keyNumber && this.label.length < maxSize) {
					var inputChar = String.fromCharCode(e.keyCode);
					if(this.label.charAt(0) == "0") {
						this.label = inputChar;
					} else {
						this.label += inputChar;
					}
				}

				var newValue = parseInt(this.label);
				this.output[0].value = isNaN(newValue) ? 0 : newValue;
			}
		}, {
			type: "clock",
			label: "CLOCK",
			description: "Contador de tempo",
			menuLabel: "clock",

			inputSize: 0,
			outputSize: 2,

			// component variables
			customConstructor: function(config) {
				this.timestart = createjs.Ticker.getTime();
				this.domain = [-100, 100];

				this.clockRadius = this.cellSize;

				var clock = new createjs.Container();
				clock.x = this.width / 2;
				clock.y = -this.clockRadius - this.cellSize;

				this.clockBorder = new createjs.Shape();
				this.clockArrow = new createjs.Shape();

				clock.addChild(this.clockBorder, this.clockArrow);
				this.addChild(clock);
			},
			run: function() {
				this.output[0].value = Math.round(((createjs.Ticker.getTime() - this.timestart) / 10) % (this.domain[1] - this.domain[0])) + this.domain[0];
				this.output[1].value = this.domain;
				this.label = this.output[0].value;
			},
			customUpdateUI: function(currentStyle) {
				var angle = Math.map(this.output[0].value, this.domain[0], this.domain[1], 0, 2 * Math.PI);

				this.clockBorder.graphics.clear()
					.beginFill(currentStyle.labelText)
					.moveTo(0, 0)
					.drawCircle(0, 0, this.clockRadius);

				var arrowRadius = this.clockRadius * 0.7;
				this.clockArrow.graphics.clear()
					.beginStroke(currentStyle.label)
					.setStrokeStyle(2)
					.moveTo(0, 0)
					.lineTo(Math.cos(angle) * arrowRadius, Math.sin(angle) * arrowRadius);		
			}
		}, {
			type: "oscillator",
			label: "OSC SINE",
			description: "Oscilador: gera uma onda senoidal",
			menuLabel: "sine",

			inputSize: 2,
			outputSize: 2,

			// component variables
			customConstructor: function(config) {
				this.timestart = createjs.Ticker.getTime();
				this.speed = 5;
				this.domain = [0, 255];
				this.input[1].value = this.domain;

				this.clockRadius = this.cellSize;

				var clock = new createjs.Container();
				clock.x = this.width / 2;
				clock.y = -this.clockRadius - this.cellSize;

				this.clockBorder = new createjs.Shape();
				this.clockArrow = new createjs.Shape();

				clock.addChild(this.clockBorder, this.clockArrow);
				this.addChild(clock);
			},
			run: function() {
				this.speed = this.input[0].value > 1 ? this.input[0].value : 1;
				var angle = (createjs.Ticker.getTime() - this.timestart) / (100 * this.speed);
				this.output[0].value = Math.round(Math.map(Math.sin(angle), -1, 1, this.domain[0], this.domain[1]));

				if(Array.isArray(this.input[1].value)) this.domain = this.input[1].value;
				this.output[1].value = this.domain;
			},
			customUpdateUI: function(currentStyle) {
				var angle = Math.map(this.output[0].value, this.domain[0], this.domain[1], 0, 2 * Math.PI);

				this.clockBorder.graphics.clear()
					.beginFill(currentStyle.labelText)
					.moveTo(0, 0)
					.drawCircle(0, 0, this.clockRadius);

				var arrowRadius = this.clockRadius * 0.7;
				this.clockArrow.graphics.clear()
					.beginStroke(currentStyle.label)
					.setStrokeStyle(2)
					.moveTo(0, 0)
					.lineTo(Math.cos(angle) * arrowRadius, Math.sin(angle) * arrowRadius);		
			}
		}, {
			type: "slider",
			label: "SLIDER",
			description: "",
			menuLabel: "slider",
			category: "sensor",

			inputSize: 0,
			outputSize: 1,

			/// tamanho
			slider: null,
			customConstructor: function(config) {
				this.slider = new createjs.Container();
				var s = this.slider;
				s.height = this.cellSize * 2;
				s.width = this.width - this.cellSize * 2;
				s.x = this.cellSize;
				s.y = - this.slider.height - this.cellSize;
				s.handleWidth = this.cellSize;

				s.maxX = this.slider.width - s.handleWidth;
				s.constrain = function(posx) {
					if(posx < 0) return 0;
					if(posx > this.maxX) return this.maxX;
					return posx;
				};
				s.moveHandle = function(newX) {
					this.handle.x = this.constrain(newX - this.handleWidth / 2);
					var newValue = Math.round(Math.map(this.handle.x, 0, this.maxX, 0, 100));
					this.parent.output[0].setValue(newValue);
					this.parent.label = newValue;
				};

				this.sliderBackground = new createjs.Shape();
				this.sliderBackground.graphics
					.beginFill(this.styleScheme.default.label)
					.setStrokeStyle(2)
					.beginStroke(this.styleScheme.default.border)
					.drawRect(0, 8, this.slider.width, this.cellSize / 2);

				s.handle = new createjs.Shape();
				s.handle.graphics
					.beginFill(this.styleScheme.default.background)
					.drawRect(0, 0, s.handleWidth, s.height);
				this.slider.handle.cursor = "pointer";

				// adiciona o sprite
				this.addChild(s);
				s.addChild(this.sliderBackground, s.handle);

				// drag slider
				s.on("mousedown", this.handleMousedown);
				s.on("pressmove", this.handleMousePressmove);
			},
			handleMousedown: function(event) {
				this.moveHandle(event.localX);
			},
			handleMousePressmove: function(event) {
				this.moveHandle(event.localX);
			},
			run: function() {}
		}, {	
			type: "sonar",
			label: "SONAR",
			description: "",
			menuLabel: "sonar",

			inputSize: 0,
			outputSize: 2,

			customConstructor: function(config) {
				/// tamanho
				this.spriteWidth  = 60;
				this.spriteHeight = 60;
				this.sensorRange  = this.cellSize * 10;
				this.domain 	  = [0, 300];

				// sprite
				this.spriteSheet = new createjs.SpriteSheet({
					framerate: 12,
					images: [config.componentAssets.sonar],
					frames: {
						width:   60,
						height:  60,
						count:    1,
						regY:     0, // regX & regY indicate the registration point of the frames
						regX:     0, //
					},
					animations: {    
					//  "nome":     [frama inicio, frame fim, próxima animação, velocidade]
						"base": 	[  0,  0, "base", 1],
					}
				});

				this.componentBase = new createjs.Sprite(this.spriteSheet, "base");

				var centerX = this.center.x - this.spriteWidth / 2;
				var centerY = this.center.y - this.height / 2 - this.spriteHeight;

				this.componentBase.set({
					x: centerX,
					y: centerY
				});

				this.sensorRangeG = new createjs.Shape();

				// adiciona o sprite
				this.addChildAt(this.sensorRangeG, this.componentBase, 0); 
			},
			customUpdateUI: function(currentStyle) {
				this.sensorRangeG.set({
					x: this.center.x,
					y: this.center.y - this.height / 2 - this.spriteHeight / 2,
					alpha: currentStyle.sensorRangeAlpha
				}).graphics.clear()
					.beginStroke(currentStyle.sensorRange)
					.setStrokeStyle(1)
					.setStrokeDash([5,5])
					.drawCircle(0, 0, this.sensorRange);
			},
			run: function() {
				var spriteCenter = Math.addVector(this.componentBase, {
					x: this.spriteWidth / 2,
					y: this.spriteHeight / 2
				});
				var absPos = Math.addVector(spriteCenter, this);
				var mouseDist = Math.dist({ x: mouseWorkareaX, y: mouseWorkareaY }, absPos);
				mouseDist = Math.constrain(mouseDist, this.domain[0], this.domain[1]);
				this.output[0].value = Math.roundTo(Math.map(mouseDist, 0, this.sensorRange, this.domain[0], this.domain[1]), 2);
				this.output[1].value = this.domain;
			}
		}]
	}, {
		categoryName: "atuador",
		categoryLabel: "|>",
		components: [{	
			type: "servo",
			label: "SERVO",
			description: "",
			menuLabel: "servo",

			inputSize: 1,
			outputSize: 1,

			customConstructor: function(config) {
				/// tamanho
				this.spriteWidth = 120;
				this.spriteHeight = 120;
				this.domain = [0, 180];

				// sprite
				this.spriteSheet = new createjs.SpriteSheet({
					framerate: 12,
					images: [config.componentAssets.servo],
					frames: {
						width:  120,
						height: 120,
						count:   18,
						regY:     0, // regX & regY indicate the registration point of the frames
						regX:     0, //
					},
					animations: {    
					//  "nome":     [frama inicio, frame fim, próxima animação, valocidade]
						"base": 	[  0,  0, "base", 1],
						"horn": 	[  1,  1, "horn", 1],
						"horn-cw": 	[  1, 17, "horn-ccw", 1],
						"horn-ccw": [ 17,  1, "horn-cw", 1],
					}
				});

				this.componentBase = new createjs.Sprite(this.spriteSheet, "base");
				this.componentHorn = new createjs.Sprite(this.spriteSheet, "horn");

				this.componentBase.x = this.center.x - this.spriteWidth / 2;
				this.componentBase.y = this.center.y - this.spriteHeight;

				this.componentHorn.x = this.center.x - this.spriteWidth / 2;
				this.componentHorn.y = this.center.y - this.spriteHeight;

				// adiciona o sprite
				this.addChild(this.componentBase, this.componentHorn); 
			},
			run: function() {
				var value = Math.constrain(this.input[0].value, this.domain[0], this.domain[1]);
				this.componentHorn.gotoAndStop(Math.round(Math.map(value, this.domain[0], this.domain[1], 1, 17)));
				this.output[0].value = this.domain;
			}
		}, {	
			type: "led",
			label: "LED",
			description: "",
			menuLabel: "led",

			inputSize: 1,
			outputSize: 1,

			customConstructor: function(config) {
				/// tamanho
				this.spriteWidth = 60;
				this.spriteHeight = 60;
				this.effectRadius = this.cellSize * 10;
				this.effectResolution = 10;
				this.domain = [0, 255];

				// sprite
				this.spriteSheet = new createjs.SpriteSheet({
					framerate: 12,
					images: [config.componentAssets.led],
					frames: {
						width:   60,
						height:  60,
						count:    2,
						regY:     0, // regX & regY indicate the registration point of the frames
						regX:     0, //
					},
					animations: {    
					//  "nome":     [frama inicio, frame fim, próxima animação, velocidade]
						"base": 	[  0,  0, "base", 1],
						"light": 	[  1,  1, "light", 1],
					}
				});

				var ledSprite = new createjs.Container();

				var componentBase = new createjs.Sprite(this.spriteSheet, "base");
				this.componentLight = new createjs.Sprite(this.spriteSheet, "light");

				ledSprite.x = this.center.x - this.spriteWidth / 2;
				ledSprite.y = this.center.y - this.height / 2 - this.spriteHeight;

				//
				this.light = new createjs.Container();
				var radiusStep = this.effectRadius / this.effectResolution;
				for (var i = 0; i < this.effectResolution; i++) {
					var newCircle = new createjs.Shape();
					var startAngle = Math.radians(-135);
					var endAngle = Math.radians(-45);
					newCircle.set({alpha: 0, x: 30, y: 26}).graphics
						.beginFill("#f00")
						.moveTo(0, 0)
						.arc(0, 0, this.effectRadius - radiusStep * i, startAngle, endAngle);
					this.light.addChild(newCircle);
				};

				// adiciona o sprite
				ledSprite.addChild(this.light, this.componentLight, componentBase); 
				this.addChildAt(ledSprite, 0); 
			},
			customUpdateUI: function(currentStyle) {
			},
			run: function() {
				var obj = this.light;
				var max = Math.floor(Math.map(this.input[0].value, this.domain[0], this.domain[1], 0, obj.numChildren));
				for (var i = 0; i < obj.numChildren; i++) {
					var child = obj.getChildAt(i);
					if(i > max) {
						child.alpha = 1 / (obj.numChildren - 1);
					} else {
						child.alpha = 0;
					}
				};
				this.output[0].value = this.domain;
			}
		}]
	}];

// componentes
var componentDefinitions = {};
var menuDraft = [];

for (var i = predefinedComponent.length - 1; i >= 0; i--) {
	var compArray = predefinedComponent[i];
	var menuLenght = menuDraft.push({
		label: compArray.categoryLabel,
		subMenu: []
	});
	var menuIndex = menuLenght - 1;

	for (var j = compArray.components.length - 1; j >= 0; j--) {
		var comp = compArray.components[j];
		componentDefinitions[comp.type] = comp;
		menuDraft[menuIndex].subMenu.push({
			label: comp.menuLabel != null ? comp.menuLabel : comp.type,
			componentName: comp.type
		});
	};
};