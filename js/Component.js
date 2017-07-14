
/* 
 * classe: Component
 * descrição: classe com propriedades e funções comuns à todos os componentes
 */
(function (window) {

 	// contrutor da classe Component
 	function Component(config) {
		this.Container_constructor();

		this.label 		= config.label; 	// nome
		this.paleta		= config.paleta; 	// paleta de cores
		this.fontStyle	= config.fontStyle; // estilo da fonte
		this.cellSize 	= config.cellSize;  // tamanho do grid

		this.outputValue = 0;

		if(config.valueSize != null && config.valueSize > 0) {
			this.inputValue  = [];
			for (var i = 0; i < config.valueSize; i++) {
				this.inputValue[i] = 0;
				var input = new Input({paleta: this.paleta});
				input.y = i * this.cellSize * 2;
				this.addChild(input);
			}
		} else {
			this.inputValue = false;
		}

		// quando clica sobre o componente essa variável armazena a diferença
		// enter a posição do mouse e a origen do componente 
		this.delta = {
			x: this.x,
			y: this.y
		};

		/// tamanho
		this.size = {
			width: 8 * this.cellSize,
			height: 4 * this.cellSize
		};

		this.setup();
 	};
	var p = createjs.extend(Component, createjs.Container);


	/* 
	* função: setup()
	* descrição: função executada uma vez na criação do componente;
	*/
	p.setup = function() {

		this.labelText = new createjs.Text(this.label, this.fontStyle, "#000");
		this.labelText.textBaseline = "bottom";
		this.labelText.textAlign = "center";
		this.labelText.x = this.size.width / 2;
		this.labelText.y = this.size.height / 2;

		this.valueText = new createjs.Text(this.value, this.fontStyle, "#000");
		this.valueText.textBaseline = "top";
		this.valueText.textAlign = "center";
		this.valueText.x = this.size.width / 2;
		this.valueText.y = this.size.height / 2;

		this.border = new createjs.Shape();
		this.border.graphics
			.beginStroke(this.paleta.verdeclaro)
			.setStrokeStyle(2)
			.drawRect(10, 0, this.size.width - 20, this.size.height);

		this.background = new createjs.Shape();
		this.background.graphics
			.beginFill(this.paleta.verdeclaro)
			.setStrokeStyle(2)
			.drawRect(10, 0, this.size.width - 20, this.size.height);

		var hit = new createjs.Shape();
		hit.graphics
			.beginFill(this.paleta.branco)
			.drawRect(10, 0, this.size.width - 20, this.size.height);

		this.dragArea = new createjs.Container();
		this.dragArea.hitArea = hit;

		// adiciona o sprite
		this.addChild(this.background, this.border, this.labelText, this.valueText, this.dragArea); 

		// interação com o mouse
		// hover
		this.on("rollover", this.handleRollOver);
		this.on("rollout", 	this.handleRollOver);

		// drag
		this.dragArea.on("pressup",   this.pressUp);
		this.dragArea.on("mousedown", this.mouseDown);
		this.dragArea.on("pressmove", this.mousePressmove);

		// cursor
		// this.cursor = "move";
	}

	p.handleRollOver = function(event) {
		if(event.type == "rollover") {
			this.background.alpha = 1;
		}

		if(event.type == "rollout") {
			this.background.alpha = 0;
		}
		this.valueText.text = this.outputValue;
	};

	p.mouseDown = function(event) {
		// salva a diferença entre a posição do mouse e a origem do componente
		this.parent.delta.x = this.parent.x - event.stageX;
		this.parent.delta.y = this.parent.y - event.stageY;
	};

	p.mousePressmove = function(event) {
		var newPos = {
			x: event.stageX + this.parent.delta.x,
			y: event.stageY + this.parent.delta.y
		}
		this.parent.x = newPos.x;
		this.parent.y = newPos.y;
	};

	p.pressUp = function(event) {
		// arredonda a posição do componente para alinhar à grid
		this.parent.x = Math.round(this.parent.x / this.parent.cellSize) * this.parent.cellSize;
		this.parent.y = Math.round(this.parent.y / this.parent.cellSize) * this.parent.cellSize;
	};

	window.Component = createjs.promote(Component, "Container");

}(window));




/* 
 * classe: Actuator
 * descrição: classe com propriedades e funções comuns à todos os componentes
 */
(function (window) {

 	// contrutor da classe Actuator
 	function Actuator(config) {
		this.Container_constructor();

		this.label 		= config.label; 	// nome
		this.paleta		= config.paleta; 	// paleta de cores
		this.fontStyle	= config.fontStyle; // estilo da fonte
		this.cellSize 	= config.cellSize;  // tamanho do grid

		this.value		= 90;
		this.maxValue	= 180;
		this.minValue	= 0;

		// quando clica sobre o componente essa variável armazena a diferença
		// enter a posição do mouse e a origen do componente 
		this.delta = {
			x: this.x,
			y: this.y
		};

		/// tamanho
		this.size = {
			width: 120,
			height: 120
		};

		// sprite
		this.spriteSheet = new createjs.SpriteSheet({
			framerate: 12,
			images: [config.sprite],
			frames: {
				width:  120,
				height: 120,
				count:   18,
				regY:     0, // regX & regY indicate the registration point or "origin" of the frames
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

		this.setup();
 	};
	var p = createjs.extend(Actuator, createjs.Container);


	/* 
	* função: setup()
	* descrição: função executada uma vez na criação do componente;
	*/
	p.setup = function() {

		this.input = new Input({paleta: this.paleta});

		this.labelText = new createjs.Text(this.label, this.fontStyle, "#000");
		this.labelText.textBaseline = "top";
		this.labelText.textAlign = "center";
		this.labelText.x = this.size.width / 2;
		this.labelText.y = this.size.height - 20;

		this.border = new createjs.Shape();
		this.border.graphics
			.beginStroke(this.paleta.verdeclaro)
			.setStrokeStyle(2)
			.drawCircle(this.size.width / 2, this.size.height / 2, this.size.width * 0.6);

		var hit = new createjs.Shape();
		hit.graphics
			.beginFill(this.paleta.branco)
			.drawCircle(this.size.width / 2, this.size.height / 2, this.size.width * 0.6);

		this.dragArea = new createjs.Container();
		this.dragArea.hitArea = hit;

		this.componentBase = new createjs.Sprite(this.spriteSheet, "base");
		this.componentHorn = new createjs.Sprite(this.spriteSheet, "horn");
		
		// adiciona o sprite
		this.addChild(this.border, this.componentBase, this.componentHorn, this.labelText, this.input, this.dragArea); 

		// interação com o mouse
		// hover
		this.on("rollover", this.handleRollOver);
		this.on("rollout", 	this.handleRollOver);

		// drag
		this.dragArea.on("pressup",   this.pressUp);
		this.dragArea.on("mousedown", this.mouseDown);
		this.dragArea.on("pressmove", this.mousePressmove);

		// cursor
		// this.cursor = "move";
	}

	p.handleRollOver = function(event) {
		if(event.type == "rollover") {
			this.border.alpha = 1;
			this.labelText.alpha = 1;
		}

		if(event.type == "rollout") {
			this.border.alpha = 0;
			this.labelText.alpha = 0;
		}

		this.value = Math.constrain(this.value, this.minValue, this.maxValue);
		this.componentHorn.gotoAndStop(Math.round(Math.map(this.value, this.minValue, this.maxValue, 1, 17)));
	};

	p.mouseDown = function(event) {
		// salva a diferença entre a posição do mouse e a origem do componente
		this.parent.delta.x = this.parent.x - event.stageX;
		this.parent.delta.y = this.parent.y - event.stageY;
	};

	p.mousePressmove = function(event) {
		var newPos = {
			x: event.stageX + this.parent.delta.x,
			y: event.stageY + this.parent.delta.y
		}
		this.parent.x = newPos.x;
		this.parent.y = newPos.y;
	};

	p.pressUp = function(event) {
		// arredonda a posição do componente para alinhar à grid
		this.parent.x = Math.round(this.parent.x / this.parent.cellSize) * this.parent.cellSize;
		this.parent.y = Math.round(this.parent.y / this.parent.cellSize) * this.parent.cellSize;
	};

	window.Actuator = createjs.promote(Actuator, "Container");

}(window));





/* 
 * classe: Input
 * descrição: classe com propriedades e funções comuns à todos os inputs
 */
(function (window) {

 	// contrutor da classe Input
 	function Input(config) {
		this.Container_constructor();

		this.paleta	= config.paleta;

		this.setup();
 	};
	var p = createjs.extend(Input, createjs.Container);

	/* 
	* função: setup()
	* descrição: função executada uma vez na criação do componente;
	*/
	p.setup = function() {

		this.input = new createjs.Shape();
		this.input.graphics
			.beginFill(this.paleta.branco)
			.beginStroke(this.paleta.roxo)
			.setStrokeStyle(2)
			.drawCircle(0, 0, 3);
		
		this.addChild(this.input); // adiciona o sprite

		this.cursor = "pointer";
	}

	p.handleRollOver = function(event) {
	};

	window.Input = createjs.promote(Input, "Container");

}(window));
