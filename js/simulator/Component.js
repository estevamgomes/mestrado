/* 
 * classe: ComponentContainer
 * descrição: classe do objeto que armazena e adiciona os componentes
 */
(function (window) {

 	// contrutor da classe ComponentContainer
 	function ComponentContainer(config) {
		this.Container_constructor();

		this.componentDefinitions = config.componentDefinitions; // características de cada componente

		// configuração padrão dos componentes
		this.defaultConfig = config;
	}
	var p = createjs.extend(ComponentContainer, createjs.Container);

	// cria e adiciona os componentes ao stage
	p.addComponent = function(customConfig) {
		var config = Object.assign({}, this.defaultConfig, customConfig);

		// verifica se o tipo de componente existe na lista de componentes predefinidos
		if(this.componentDefinitions[config.type] != null) {
			// caso o componente exista ele soma as configurações e gera o componente
			this.addChild(new Component(Object.assign({},
				config, this.componentDefinitions[config.type])))
				.constrainPos();
		}

	};

	p.exportCurrentScene = function() {
		var components = [];
		for (var i = this.numChildren - 1; i >= 0; i--) {
			var obj = this.getChildAt(i)
			components.push({
				"name": obj.name,
				"type": obj.type,
				"x": obj.x + obj.width / 2,
				"y": obj.y + obj.height / 2
			});
		};
		return components;
	};

	p.removeAllComponents = function() {
		for (var i = this.numChildren - 1; i >= 0; i--) {
			this.getChildAt(0).remove();
		};
	};

	p.followMouse = function(event) {
		for (var i = this.numChildren - 1; i >= 0; i--) {
			var child = this.getChildAt(i);
			if(child.isGrabbing != null && child.isGrabbing()) child.followMouse(event);
		};
	};

	p.tick = function() {
		for (var i = this.numChildren - 1; i >= 0; i--) {
			this.getChildAt(i).tick();
		};
	};

	p.removeActiveComponent = function() {
		for (var i = this.numChildren - 1; i >= 0; i--) {
			var child = this.getChildAt(i);
			if(child.isActive()) child.remove();
		};
	};

	p.updateComponentText = function(e) {
		for (var i = this.numChildren - 1; i >= 0; i--) {
			var child = this.getChildAt(i);
			if(child.isActive() && child.isEditable()) {
				child.updateText(e);
			}
		};
	};

	window.ComponentContainer = createjs.promote(ComponentContainer, "Container");
}(window));



/* 
 * classe: Component
 * descrição: classe com propriedades e funções comuns à todos os componentes
 */
(function (window) {

 	// contrutor da classe Component
 	function Component(config) {
		this.Container_constructor();

		this.run = function() {};	// ação do objeto
		this.label = "NO LABEL"; 	// etiqueta
		this.name = config.type + this.id; // nome
		this.editableTextField = false;    // se tem um campo de texto editável

		this.inputSize = 0;
		this.outputSize = 0;

		Object.assign(this, config); // junta as configurações do objeto com as configurações enviadas

		this.cellSize 	= this.workarea.cellSize; // tamanho do grid
		this.state = "default"; // estado atual do componente: default || hover || grabbing
		this.grabStart 	= {x: this.x, y: this.y}; // posição em que começou a arrastar

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
		this.x = config.x - this.width / 2;
		this.y = config.y - this.height / 2;
		this.alignToGrid();

		// origem para alinhar as coisas a partir do centro
		this.center = {
			x: this.width / 2,
			y: this.height / 2
		};


		// cria elementos
		this.border 	= new createjs.Shape(); // borda
		this.background = new createjs.Shape(); // fundo
		this.labelBg 	= new createjs.Shape(); // fundo do label
		this.labelText  = new createjs.Text();	// cria campo de texto para o nome do componente

		// adiciona os elementos
		this.addChild(this.background, this.labelBg, this.border, this.labelText);

		// terminais dos inputs
		this.input = [];
		var terminalDefaultConfig = {
			styleScheme: this.styleScheme,
			type: "input",
			cellSize: this.cellSize,
			connectionContainer: this.connectionContainer
		};
		for (var i = 0; i < this.inputSize; i++) {
			this.input[i] = new Terminal(Object.assign({}, terminalDefaultConfig, { type: "input", name: this.name + "-in-" + i }));
			this.input[i].x = 0;
			this.input[i].y = this.center.y + i * this.cellSize * 2 - (this.inputSize - 1) * this.cellSize;
			this.addChild(this.input[i]);
		}

		// terminais dos outputs
		this.output = [];
		for (var i = 0; i < this.outputSize; i++) {
			this.output[i] = new Terminal(Object.assign({}, terminalDefaultConfig, { type: "output", name: this.name + "-out-" + i }));
			this.output[i].x = this.width;
			this.output[i].y = this.center.y + i * this.cellSize * 2 - (this.outputSize - 1) * this.cellSize;
			this.addChild(this.output[i]);				
		}
		
		// área de contato invisível para movimentar o componente
		this.dragArea = new createjs.Container();
		this.dragArea.hitArea = this.labelBg;
		this.addChild(this.dragArea); 

		// reseta as variáveis conforme a função específica
		if(this.customConstructor != null) this.customConstructor(config);

		// desenha a interface gráfica
		this.updateUI();
		
		// interação com o mouse
		// hover
		this.dragArea.on("rollover", this.rollover);
		this.dragArea.on("rollout",  this.rollout);

		// drag
		this.dragArea.on("mousedown", this.mouseDown);
		this.dragArea.on("pressup",   this.pressUp);
		this.dragArea.on("pressmove", this.mousePressmove);
	}
	var p = createjs.extend(Component, createjs.Container);

	p.tick = function() {
		this.run();
		this.updateUI();
	};

	p.updateUI = function() {
		var currentStyle = Object.assign({}, this.styleScheme.default);

		if(this.styleScheme[this.state] != null) {
			Object.assign(currentStyle, this.styleScheme[this.state]);
		}

		this.dragArea.cursor = currentStyle.cursor;

		// desenha a borda
		this.border.graphics.clear()
			.beginStroke(currentStyle.border)
			.setStrokeStyle(2)
			.drawRoundRect(0, 0, this.width, this.height, this.cellSize / 2);

		// desenha o fundo
		this.background.graphics.clear()
			.beginFill(currentStyle.background)
			.setStrokeStyle(2)
			.drawRoundRect(0, 0, this.width, this.height, this.cellSize / 2);
		// this.background.shadow = new createjs.Shadow(currentStyle.shadow, 1, 1, 2);

		// desenha o fundo do label
		this.labelBg.graphics.clear()
			.beginFill(currentStyle.label)
			.drawRect(0 + this.cellSize, 0, this.width - this.cellSize * 2, this.height);

		// desenha o nome do componente
		this.labelText.set({
			text: this.label,
			font: currentStyle.labelFont,
			color: currentStyle.labelText,
			x: this.center.x,
			y: this.center.y,
			textBaseline: "middle",
			textAlign: "center",
		});

		// acrescenta qualquer alteração na UI
		if(this.customUpdateUI != null) this.customUpdateUI(currentStyle);

		// atualiza os inputs e outputs
		for (var i = 0; i < this.inputSize; i++) this.input[i].updateUI();
		for (var i = 0; i < this.outputSize; i++) this.output[i].updateUI();
	};

	p.isGrabbing = function() {
		return this.state == "grabbing" || this.state == "remove";
	};

	p.isActive = function() {
		return this.isGrabbing();
	};

	p.isEditable = function() {
		return this.editableTextField;
	};
	
	p.setState = function(state) {
		this.state = state;
		this.updateUI();
	};

	p.rollover = function(event) {
		var obj = this.parent;
		if(!obj.isGrabbing()) {
			obj.setState("hover");
		} else if(obj.state == "remove") {
			obj.setState("grabbing");
		}
	};

	p.rollout = function(event) {
		var obj = this.parent;
		var underMouse = obj.underMouse(event.stageX, event.stageY);
		if(underMouse != null && underMouse.constructor.name == "Bin") {
			obj.setState("remove");
		} else if(!obj.isGrabbing()) {
			obj.setState("default");
		
		}
	};

	p.mouseDown = function(event) {
		var obj = this.parent;
		// salva a diferença entre a posição do mouse e a origem do componente
		obj.delta.x = obj.x - event.stageX;
		obj.delta.y = obj.y - event.stageY;

		if(obj.isGrabbing()) {
			obj.setState("hover");
		} else {
			obj.bringToFront();
			obj.grabStart = {x: obj.x, y: obj.y};
			obj.setState("grabbing");
		}
	};

	/* 
	 * função: bringToFront()
	 * descrição: move o elemento para topo da lista de renderização
	 */
	p.bringToFront = function() {
		this.parent.setChildIndex(this, this.parent.numChildren - 1);
	};

	p.mousePressmove = function(event) {
		this.parent.followMouse(event);
	};

	p.pressUp = function(event) {
		var obj = this.parent;

		if(obj.underMouse(event.stageX, event.stageY).constructor.name == "Bin") {
			obj.remove();
		}

		if(obj.grabStart.x != obj.x && obj.grabStart.y != obj.y) {
			obj.setState("hover");
		}
		// alinha o componente à grid
		obj.alignToGrid();
	};

	p.remove = function() {
		this.removeAllConnections();
		this.parent.removeChild(this);
	};


	/* 
	 * função: removeAllConnections()
	 * descrição: 
	 */
	p.removeAllConnections = function() {
		for (var i = 0; i < this.input.length; i++) {
			this.input[i].removeAllConnections();
		}
		for (var i = 0; i < this.output.length; i++) {
			this.output[i].removeAllConnections();
		}
	};


	/* 
	 * função: followMouse()
	 * descrição: atualiza a posição seguindo a posição do mouse
	 */
	p.followMouse = function(event) {
		var newPos = {
			x: event.stageX + this.delta.x,
			y: event.stageY + this.delta.y
		}
		this.x = newPos.x;
		this.y = newPos.y;
		this.constrainPos();
	};

	/* 
	 * função: underMouse()
	 * descrição: verifica qual objeto está embaixo do mouse
	 */
	p.underMouse = function(x, y) {
		return this.workarea.parent.getObjectUnderPoint(x, y, 2);
	};

	/* 
	 * função: alignToGrid()
	 * descrição: função alinha o ponto à uma grid
	 * 			  ponto = {x: x, y: y}
	 */
	p.alignToGrid = function() {
		this.x = Math.round(this.x / this.cellSize) * this.cellSize;
		this.y = Math.round(this.y / this.cellSize) * this.cellSize;
	};

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
 * classe: Terminal
 * descrição: terminal são os elementos onde os fios são conectados
 */
(function (window) {

 	// contrutor da classe output
 	function Terminal(config) {
		this.Container_constructor();

		Object.assign(this, config);

		this.value 		 = 0;
		this.state 		 = "default"; // estado atual: default || hover

		this.connectionContainer = config.connectionContainer;

		this.setup();
 	};
	var p = createjs.extend(Terminal, createjs.Container);

	/* 
	* função: setup()
	* descrição: função executada uma vez na criação do componente
	*/
	p.setup = function() {
		
		this.debugText = new createjs.Text();	// texto indicando o valor do terminal
		this.debugText.alpha = 0;

		this.output = new createjs.Shape();		// desenha o terminal

		// cria uma área de interação que vai além da área desenhada
		var hit = new createjs.Shape();
		hit.graphics
			.beginFill("#ffffff")
			.drawRect(-this.cellSize, -this.cellSize, this.cellSize * 2, this.cellSize * 2);
		this.output.hitArea = hit;
		
		this.addChild(this.output, this.debugText);

		this.cursor = "pointer";

		// interação com o mouse
		this.on("mousedown", this.mousedown);

		// hover
		this.on("rollover", this.rollover);
		this.on("rollout", 	this.rollout);

		this.updateUI();
	};

	p.updateUI = function() {
		var styleScheme = Object.assign({}, this.styleScheme.default);

		if(this.styleScheme[this.state] != null) {
			Object.assign(styleScheme, this.styleScheme[this.state]);
		}

		this.output.graphics.clear()
			.beginStroke(styleScheme.terminalBorder)
			.beginFill(styleScheme.terminal)
			.setStrokeStyle(2)
			.drawCircle(0, 0, this.cellSize / 3);

		var padding = 5;
		this.debugText.set({
			text: this.value,
			font: styleScheme.labelFont,
			color: styleScheme.terminalText,
			y: -padding,
			textBaseline: "bottom",
		});

		if(this.type == "input") {
			this.debugText.set({
				x: -padding,
				textAlign: "right",
			});
		} else {
			this.debugText.set({
				x: padding,
				textAlign: "left",
			});
		}
	};

	p.setState = function(state) {
		this.state = state;
		this.updateUI();
	};

	p.rollover = function(event) {
		this.debugText.alpha = 1;
		this.setState("hover");
		this.connectionContainer.terminalMagnet(this, true);
	};

	p.rollout = function(event) {
		this.debugText.alpha = 0;
		this.setState("default");
		this.connectionContainer.terminalMagnet(this, false);
	};

	p.mousedown = function(event) {
		this.connectionContainer.terminalClick(this);
	};

	p.mouseup = function(event) {
		this.connectionContainer.terminalClick(this);
	};

	p.removeAllConnections = function() {
		this.connectionContainer.removeConnectionsFrom(this);
	};

	p.setValue = function(value) {
		this.value = value;
		this.updateUI();
		this.parent.run();
	};

	window.Terminal = createjs.promote(Terminal, "Container");

}(window));
