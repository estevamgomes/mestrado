/* 
 * classe: Component
 * descrição: classe com propriedades e funções comuns à todos os componentes
 */
(function (window) {

 	// contrutor da classe ComponentArray
 	function ComponentArray(config) {
		this.Container_constructor();

		this.componentDefinitions = config.componentDefinitions;
		this.componentContainer = new createjs.Container();
		this.component = [];

		this.componentAssets = config.componentAssets;

		// configuração padrão dos componentes
		this.defaultConfig = {
			colorScheme: config.colorScheme,
			fontStyle: config.fontStyle,
			workarea: config.workarea
		};

		this.addChild(this.componentContainer);
	}
	var p = createjs.extend(ComponentArray, createjs.Container);

	// cria e adiciona os componentes ao stage
	p.add = function(customConfig) {
		var config = Object.assign({}, this.defaultConfig, customConfig);
		var tmpComponent;

		// verifica se o tipo de componente existe na lista de componentes predefinidos
		if(this.componentDefinitions[config.type] != null) {
			// caso o componente exista ele soma as configurações e gera o componente
			tmpComponent = new Component(Object.assign({},
				config,
				this.componentDefinitions[config.type]));
		} else {
			// caso não exista ele gera um componente genérico
			switch(config.type) {
				case "servo":
					tmpComponent = new Servo(Object.assign({},
						config,
						{ sprite: this.componentAssets.servo }));
					break;
				case "slider":
					tmpComponent = new Slider(config);
					break;
				default:
					tmpComponent = new Component(config);
					break;
			}
		}

		var index = this.component.push(tmpComponent) - 1;
		this.addChild(this.component[index]);
		this.component[index].constrainPos();
	}

	p.followMouse = function(event) {
		for (var i = 0; i < this.component.length; i++) {
			if(this.component[i].grabbing) this.component[i].followMouse(event);
		};
	}

	window.ComponentArray = createjs.promote(ComponentArray, "Container");
}(window));



/* 
 * classe: Component
 * descrição: classe com propriedades e funções comuns à todos os componentes
 */
(function (window) {

 	// contrutor da classe Component
 	function Component(config) {
		this.Container_constructor();

		this.label 		= config.label; 	// nome
		this.fontStyle	= config.fontStyle; // estilo da fonte
		this.workarea 	= config.workarea;  // tamanho do grid
		this.cellSize 	= this.workarea.cellSize;  // tamanho do grid
		this.grabbing 	= false;			// determina se está arrastando o elemento

		this.grabStart 	= {x: this.x, y: this.y};		// posição em que começou a arrastar
		this.run 		= config.run || function() {};	// ação do objeto

		this.inputSize = config.inputSize || 0;
		this.outputSize = config.outputSize || 0;

		this.colorScheme  = config.colorScheme; 			 // colorScheme de cores
		this.currentColor = this.colorScheme.default; 	 // colorScheme de cores

		// quando clica sobre o componente essa variável armazena a diferença
		// entre a posição do mouse e a origem do componente 
		this.delta = {
			x: this.x,
			y: this.y
		};

		// largura do componente
		this.width = (2 + this.label.length) * this.cellSize;

		// altura do componente com base no número de inputs e outputs
		if(this.inputSize > 0 || this.outputSize > 0) {
			if(this.inputSize > this.outputSize) {
				this.height = this.inputSize * 2 * this.cellSize;
			} else {
				this.height = this.outputSize * 2 * this.cellSize;
			}
		} else {
			this.height = 2 * this.cellSize;			
		}

		// posicao
		var randomPos = {
			x: Math.randomInt(0, 200),
			y: Math.randomInt(0, 200)
		};
		this.x = config.x - this.width / 2 || randomPos.x;
		this.y = config.y - this.height / 2 || randomPos.y;
		this.alignToGrid();

		// origem para alinhar as coisas a partir do centro
		this.center = {
			x: this.width / 2,
			y: this.height / 2
		};

		this.setup();
	}
	var p = createjs.extend(Component, createjs.Container);

	p.setup = function() {

		// cria elementos
		this.border 	= new createjs.Shape(); // borda
		this.background = new createjs.Shape(); // fundo
		this.labelBg 	= new createjs.Shape(); // fundo do label

		// cria campo de texto para o nome do componente
		this.labelText = new createjs.Text(this.label, this.fontStyle, this.currentColor.labelText);
		this.labelText.set({
			x: this.center.x,
			y: this.center.y,
			textBaseline: "middle",
			textAlign: "center",
		});

		// adiciona os elementos
		this.addChild(this.background, this.labelBg, this.border, this.labelText);

		// terminais dos inputs
		this.input = [];
		for (var i = 0; i < this.inputSize; i++) {
			this.input[i] = new Terminal({
				colorScheme: this.colorScheme,
				type: "input",
				cellSize: this.cellSize,
				fontStyle: this.fontStyle
			});
			this.input[i].x = 0;
			this.input[i].y = this.center.y + i * this.cellSize * 2 - (this.inputSize - 1) * this.cellSize;
			this.addChild(this.input[i]);
		}

		// terminais dos outputs
		this.output = [];
		for (var i = 0; i < this.outputSize; i++) {
			this.output[i] = new Terminal({
				colorScheme: this.colorScheme,
				type: "output",
				cellSize: this.cellSize,
				fontStyle: this.fontStyle
			});
			this.output[i].x = this.width;
			this.output[i].y = this.center.y + i * this.cellSize * 2 - (this.outputSize - 1) * this.cellSize;
			this.addChild(this.output[i]);				
		}

		this.updateUI();
		
		// área de contato invisível para movimentar o componente
		this.dragArea = new createjs.Container();
		this.dragArea.hitArea = this.labelBg;
		this.addChild(this.dragArea); 

		// interação com o mouse
		// hover
		this.dragArea.on("rollover", this.rollover);
		this.dragArea.on("rollout",  this.rollout);

		// drag
		this.dragArea.on("mousedown", this.mouseDown);
		this.dragArea.on("pressup",   this.pressUp);
		this.dragArea.on("pressmove", this.mousePressmove);
	};

	p.updateUI = function() {
		this.border.graphics.clear()
			.beginStroke(this.currentColor.border)
			.setStrokeStyle(2)
			.drawRoundRect(0, 0, this.width, this.height, this.cellSize / 2);

		this.background.graphics.clear()
			.beginFill(this.currentColor.background)
			.setStrokeStyle(2)
			.drawRoundRect(0, 0, this.width, this.height, this.cellSize / 2);
		this.background.shadow = new createjs.Shadow(this.currentColor.shadow, 1, 1, 2);

		this.labelBg.graphics.clear()
			.beginFill(this.currentColor.label)
			.drawRect(0 + this.cellSize, 0, this.width - this.cellSize * 2, this.height);

		// atualiza os inputs e outputs
		for (var i = 0; i < this.inputSize; i++) this.input[i].updateUI();
		for (var i = 0; i < this.outputSize; i++) this.output[i].updateUI();
	};

	p.rollover = function(event) {
		var obj = this.parent;
		obj.currentColor = obj.colorScheme.hover;
		obj.updateUI();
	};

	p.rollout = function(event) {
		var obj = this.parent;
		obj.currentColor = obj.colorScheme.default;
		obj.updateUI();
	};

	p.mouseDown = function(event) {
		var obj = this.parent;
		// salva a diferença entre a posição do mouse e a origem do componente
		obj.delta.x = obj.x - event.stageX;
		obj.delta.y = obj.y - event.stageY;

		if(obj.grabbing) {
			obj.grabbing = false;
			obj.currentColor = obj.colorScheme.hover;
			obj.updateUI();
		} else {
			obj.grabbing = true;
			obj.parent.setChildIndex(obj, obj.parent.getNumChildren() - 1);
			obj.grabStart = {x: obj.x, y: obj.y};
			obj.currentColor = obj.colorScheme.grabbing;
			obj.updateUI();
		}
	};

	p.mousePressmove = function(event) {
		this.parent.followMouse(event);
	};

	p.followMouse = function(event) {
		var newPos = {
			x: event.stageX + this.delta.x,
			y: event.stageY + this.delta.y
		}
		this.x = newPos.x;
		this.y = newPos.y;
		this.constrainPos();
	};

	p.pressUp = function(event) {
		var obj = this.parent;
		if(obj.grabStart.x != obj.x && obj.grabStart.y != obj.y) {
			obj.grabbing = false;
			obj.currentColor = obj.colorScheme.hover;
			obj.updateUI();
		}
		// alinha o componente à grid
		obj.alignToGrid();
	};

	/* 
	 * função: alignToGrid()
	 * descrição: função alinha o ponto à uma grid
	 * 			  ponto = {x: x, y: y}
	 */
	p.alignToGrid = function() {
		this.x = Math.round(this.x / this.cellSize) * this.cellSize;
		this.y = Math.round(this.y / this.cellSize) * this.cellSize;
	}

	/* 
	 * função: constrainPos()
	 * descrição: limita o movimento ao tamanho do componente pai
	 */
	p.constrainPos = function() {
		this.x = Math.constrain(this.x, 0, this.workarea.width - this.width);
		this.y = Math.constrain(this.y, 0, this.workarea.height - this.height);
	}

	window.Component = createjs.promote(Component, "Container");

}(window));



/* 
 * classe: Servo
 * descrição: classe com propriedades e funções comuns à todos os componentes
 */
(function (window) {

 	// contrutor da classe Servo
 	function Servo(config) {
 		// configuração que precisam passar para o construtor da superclasse
 		config.label = "SERVO";
 		config.inputSize = 1;
 		config.outputSize = 0;

 		// chama a superclasse
		this.Component_constructor(config);

		/// tamanho
		this.spriteWidth = 120;
		this.spriteHeight = 120;

		// sprite
		this.spriteSheet = new createjs.SpriteSheet({
			framerate: 12,
			images: [config.sprite],
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

		this.run = function() {
			this.componentHorn.gotoAndStop(Math.round(Math.map(this.input[0].value, 0, 100, 1, 17)));
		};
 	};
	var p = createjs.extend(Servo, Component);

	window.Servo = createjs.promote(Servo, "Component");

}(window));



/* 
 * classe: Slider
 * descrição: classe com propriedades e funções comuns à todos os componentes
 */
(function (window) {

 	// contrutor da classe Slider
 	function Slider(config) {
 		// configuração que precisam passar para o construtor da superclasse
 		config.label = "SLIDER";
 		config.inputSize = 0;
 		config.outputSize = 1;

 		// chama a superclasse
		this.Component_constructor(config);

		/// tamanho
		this.slider = new createjs.Container();
		this.slider.height = this.cellSize * 2;
		this.slider.width = this.width - this.cellSize * 2;
		this.slider.x = this.cellSize;
		this.slider.y = - this.slider.height - this.cellSize;
		this.slider.handleWidth = this.cellSize;

		this.slider.maxX = this.slider.width - this.slider.handleWidth;
		this.slider.constrain = function(posx) {
			if(posx < 0) return 0;
			if(posx > this.maxX) return this.maxX;
			return posx;
		};
		this.slider.moveHandle = function(newX) {
			this.handle.x = this.constrain(newX - this.handleWidth / 2);
			var newValue = Math.round(Math.map(this.handle.x, 0, this.maxX, 0, 100));
			this.parent.output[0].setValue(newValue);
			this.parent.labelText.text = newValue;
		};
		
		this.sliderBackground = new createjs.Shape();
		this.sliderBackground.graphics
			.beginFill(this.currentColor.label)
			.setStrokeStyle(2)
			.beginStroke(this.currentColor.border)
			.drawRect(0, 8, this.slider.width, this.cellSize / 2);

		this.slider.handle = new createjs.Shape();
		this.slider.handle.graphics
			.beginFill(this.currentColor.background)
			.drawRect(0, 0, this.slider.handleWidth, this.slider.height);
		this.slider.handle.cursor = "pointer";

		// adiciona o sprite
		this.addChild(this.slider);
		this.slider.addChild(this.sliderBackground, this.slider.handle);

		// drag slider
		this.slider.on("mousedown", this.handleMousedown);
		this.slider.on("pressmove", this.handleMousePressmove);
 	};
	var p = createjs.extend(Slider, Component);

	p.handleMousedown = function(event) {
		this.moveHandle(event.localX);
	};

	p.handleMousePressmove = function(event) {
		this.moveHandle(event.localX);
	};

	window.Slider = createjs.promote(Slider, "Component");

}(window));



/* 
 * classe: Terminal
 * descrição: terminal são os elementos onde os fios são conectados
 */
(function (window) {

 	// contrutor da classe output
 	function Terminal(config) {
		this.Container_constructor();

		this.colorScheme	= config.colorScheme;
		this.currentColor	= this.colorScheme.default;
		this.fontStyle 	= config.fontStyle;
		this.type 		= config.type || "input"; // "input", "output"
		this.value 		= 0;
		this.cellSize 	= config.cellSize;

		this.setup();
 	};
	var p = createjs.extend(Terminal, createjs.Container);

	/* 
	* função: setup()
	* descrição: função executada uma vez na criação do componente
	*/
	p.setup = function() {
		// texto indicando o valor do terminal
		this.debugText = new createjs.Text(this.value, this.fontStyle, this.currentColor.terminalText);
		var padding = 5;
		if(this.type == "input") {
			this.debugText.set({
				x: -padding,
				y: -padding,
				textBaseline: "bottom",
				textAlign: "right",
			});
		} else {
			this.debugText.set({
				x: padding,
				y: -padding,
				textBaseline: "bottom",
				textAlign: "left",
			});
		}
		this.debugText.text = this.value;
		this.debugText.alpha = 0;

		// desenha o terminal
		this.output = new createjs.Shape();

		// cria uma área de interação que vai além da área desenhada
		var hit = new createjs.Shape();
		hit.graphics
			.beginFill("#ffffff")
			.drawRect(-this.cellSize, -this.cellSize, this.cellSize * 2, this.cellSize * 2);
		this.output.hitArea = hit;
		
		this.addChild(this.output, this.debugText);

		this.cursor = "pointer";

		// interação com o mouse
		// hover
		this.on("rollover", this.rollover);
		this.on("rollout", 	this.rollout);

		this.updateUI();
	};

	p.updateUI = function() {
		this.output.graphics.clear()
			.beginStroke(this.currentColor.terminalBorder)
			.beginFill(this.currentColor.terminal)
			.setStrokeStyle(2)
			.drawCircle(0, 0, this.cellSize / 3);

		this.debugText.text = this.value;
	};

	p.rollover = function(event) {
		this.debugText.alpha = 1;
		this.currentColor = this.colorScheme.hover;
		this.updateUI();
	};

	p.rollout = function(event) {
		this.debugText.alpha = 0;
		this.currentColor = this.colorScheme.default;
		this.updateUI();
	};

	p.setValue = function(value) {
		this.value = value;
		this.updateUI();
		this.parent.run();
	};

	window.Terminal = createjs.promote(Terminal, "Container");

}(window));
