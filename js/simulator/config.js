
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
			wireType: "bezier", // estilo do fio = bezier || ortho || line
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
			labelFont: "bold 1rem 'Overpass Mono', monospace"
		},
		grabbing: {
			background: color.azulclaro,
			border: color.azulclaro,
		},
		hover: {
			background: color.azul,
			border: color.azul,
			terminalBorder: color.vermelho,
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
			type: "label",
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
		}, {
			type: "counter",
			label: "COUNTER",
			description: "Contador de tempo",
			menuLabel: "count",

			inputSize: 0,
			outputSize: 1,

			// component variables
			customConstructor: function(config) {
				this.timestart = createjs.Ticker.getTime();
			},
			run: function() {
				this.output[0].value = Math.round(((createjs.Ticker.getTime() - this.timestart) / 10) % 100);
				this.label = this.output[0].value;
			}
		}]
	}, {
		categoryName: "sensor",
		categoryLabel: ">|",
		components: [{
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
		}]
	}, {
		categoryName: "atuador",
		categoryLabel: "|>",
		components: [{	
			type: "servo",
			label: "SERVO",
			description: "",
			menuLabel: "servo",
			category: "actuator",

			inputSize: 1,
			outputSize: 0,

			customConstructor: function(config) {
				/// tamanho
				this.spriteWidth = 120;
				this.spriteHeight = 120;

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
				this.componentHorn.gotoAndStop(Math.round(Math.map(this.input[0].value, 0, 100, 1, 17)));
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