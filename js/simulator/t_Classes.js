/* 
 * classe: Bin
 * descrição: classe com propriedades e funções comuns à todos os inputs
 */
(function (window) {

 	// contrutor da classe Wire
 	function Bin(config) {
		this.Container_constructor();

		this.componentContainer = config.componentContainer;
		this.workarea 			= config.workarea;
		this.styleScheme 		= config.styleScheme;
		this.state 				= "default";

		this.size = this.workarea.cellSize * 2;
		this.setPos(config.canvasWidth, config.canvasHeight);

		this.binArea = new createjs.Shape();
		this.addChild(this.binArea);

		var hit = new createjs.Shape();
		hit.graphics.clear()
			.beginFill("#ffffff")
			.drawRect(0, 0, this.size, this.size);
		this.hitArea = hit;

		this.updateUI();

		this.on("mouseover", this.mouseover);
		this.on("mouseout", this.mouseout);
		this.on("mousedown", this.mousedown);
		this.on("dblclick", this.dblclick);
 	}
	var p = createjs.extend(Bin, createjs.Container);

	p.updateUI = function() {
		var currentStyle = Object.assign({}, this.styleScheme.default);

		if(this.styleScheme[this.state]) {
			Object.assign(currentStyle, this.styleScheme[this.state]);
		}

		var padding = 5;
		this.binArea.graphics.clear()
			.beginFill(currentStyle.background)
			.beginStroke(currentStyle.border)
			.setStrokeStyle(2)
			.drawRect(0, 0, this.size, this.size)
			.moveTo(padding, padding)
			.lineTo(this.size - padding, this.size - padding)
			.moveTo(this.size - padding, padding)
			.lineTo(padding, this.size - padding);

	};

	p.setPos = function(canvasW, canvasH) {
		var posX = canvasW > this.workarea.width ? this.workarea.width + this.workarea.x : canvasW;
		var posY = canvasH > this.workarea.height ? this.workarea.height + this.workarea.y : canvasH;
		this.x = posX - this.workarea.cellSize - this.size;
		this.y = posY - this.workarea.cellSize - this.size;
	};

	p.resize = function(canvas) {
		this.setPos(canvas.width, canvas.height);
		this.updateUI();		
	};

	p.setState = function(state) {
		this.state = state;
		this.updateUI();
	};

	p.mouseover = function(event) {
		this.setState("hover");
	};

	p.mouseout = function(event) {
		this.setState("default");
	};

	p.mousedown = function(event) {
		var obj = this.workarea.parent.getObjectsUnderPoint(event.stageX, event.stageY, 2);
		for (var i = 0; i < obj.length; i++) {
			if(obj[i].parent.parent === this.componentContainer) {
				obj[i].parent.remove();
			}
		};
	};

	p.dblclick = function(event) {
		this.componentContainer.removeAllComponents();
	};

	window.Bin = createjs.promote(Bin, "Container");

}(window));




/* 
 * classe: MouseTimer
 * descrição: 
 */
(function (window) {

 	// contrutor da classe Wire
 	function MouseTimer(config) {
		this.Container_constructor();

		this.styleScheme = config.styleScheme;

		// click tag
		this.gclickMaxRadius = 12;
		this.gclickRadius = 0;
		this.radius = 5;
		this.clickTag = false;
		this.gclick = new createjs.Shape();

		// timer
		this.timerRadius = 16;
		this.timeStart = 0;
		this.timeComplete = 600;
		this.timeMin = 160;
		this.complete = false;
		this.gtimer = new createjs.Shape();

		this.mousepressed = false;
		this.mousePos = {x: 0, y: 0};

		this.addChild(this.gclick, this.gtimer);

		this.setup();
	}
	var p = createjs.extend(MouseTimer, createjs.Container);

	p.setup = function() {
		this.resetClick();
		this.resetTimer();
	};

	p.resetClick = function() {
		this.gclickRadius = 0;
		this.gclick.alpha = 0;
		this.gclick.graphics.clear();
		this.clickTag = false;
	};

	p.resetTimer = function() {
		this.complete = false;
		this.gtimer.graphics.clear();
	};

	p.mousedown = function(event) {
		this.mousepressed = true;

		this.resetClick();
		this.resetTimer();
		this.gclick.alpha = 1;
		this.timeStart = createjs.Ticker.getTime();

		var obj = this.parent; // workarea
		this.x = event.stageX - obj.x;
		this.y = event.stageY - obj.y;
	};

	p.mouseup = function(event) {
		this.mousepressed = false;

		this.resetTimer();

		if(this.mouseStatic() && this.getTimeElapsed() < this.timeMin) {
			this.clickTag = true;
		}

		var obj = this.parent; // workarea
		this.mousePos.x = event.stageX - obj.x;
		this.mousePos.y = event.stageY - obj.y;
	};

	p.mousemove = function(event) {
		if(!this.mouseStatic()) {
			this.resetTimer();
			this.timeStart = createjs.Ticker.getTime();
		}

		var obj = this.parent; // workarea
		this.mousePos.x = event.stageX - obj.x;
		this.mousePos.y = event.stageY - obj.y;
	};

	p.mouseStatic = function() {
		return Math.dist({x: this.x, y: this.y}, this.mousePos) < 4;
	};

	p.getTimeElapsed = function() {
		return createjs.Ticker.getTime() - this.timeStart;
	};

	p.updateUI = function() {
		var timeElapsed = this.getTimeElapsed(); 

		var currentStyle = Object.assign({}, this.styleScheme.default);

		if(this.clickTag) {
			this.gclickRadius += (this.gclickMaxRadius - this.gclickRadius) / 10;
			this.gclick.alpha += (0 - this.gclick.alpha) / 10;
			if(this.gclick.alpha < 0.1) this.resetClick();
			this.gclick.graphics.clear()
				.beginStroke(currentStyle.click)
				.setStrokeStyle(2)
				.drawCircle(0, 0, this.gclickRadius);
		}

		if(this.mousepressed && this.mouseStatic()) {
			if(timeElapsed > this.timeMin) {
				if(timeElapsed >= this.timeComplete) {
					this.complete = true;
					Object.assign(currentStyle, this.styleScheme.complete);
				}

				var angleStart = Math.radians(-90);
				var angle = Math.radians(360 * (timeElapsed - this.timeMin) / (this.timeComplete - this.timeMin)) + angleStart;
				this.gtimer.graphics.clear()
					.beginStroke(currentStyle.timer)
					.setStrokeStyle(3)
					.arc(0, 0, this.timerRadius, angleStart, angle);
				// this.gtimer.shadow = new createjs.Shadow(currentStyle.shadow, 1, 1, 1);
			}
		} else {
			this.resetTimer();
		}
	};

	p.tick = function() {
		if(this.mousepressed || this.gclick.alpha > 0) {
			this.updateUI();
		} 
	};

	window.MouseTimer = createjs.promote(MouseTimer, "Container");

}(window));



/* 
 * classe: Workarea
 * descrição: armazena as propriedades da área de trabalho e do grid e suas funções
 */
(function (window) {

 	// contrutor da classe Workarea
 	function Workarea(config) {
		this.Container_constructor();

		this.dragging = false;

		this.width  = config.width  === "auto" ? config.canvasWidth  : config.width;
		this.height = config.height === "auto" ? config.canvasHeight : config.height;

		// garante que o tamanho da workarea seja múltiplo do tamanho da célula
		this.width = Math.floor(this.width / config.cellSize) * config.cellSize;
		this.height = Math.floor(this.height / config.cellSize) * config.cellSize;

		this.mouseX = 0;
		this.mouseY = 0;

		// área visível, ou seja, o tamanho do elemento canvas
		this.visibleArea = {
			width: config.canvasWidth,
			height: config.canvasHeight
		};

		// componentContainer
		this.componentContainer;

		// alinha a workarea ao centro da visible area		
		this.alignCenter();

		// informações para o grid
		this.cellSize 	 = config.cellSize;
		this.styleScheme = config.styleScheme;

		this.backgroundImage = config.background;
		this.background 	= new createjs.Shape(); // forma para armazenar o fundo
		this.selectionArea  = new createjs.Shape(); // forma para armazenar o fundo

		// adiciona o background e o grid
		this.addChild(this.background,  this.selectionArea);

		this.updateUI();

		// quando clica sobre o componente essa variável armazena a diferença
		// enter a posição do mouse e a origem do componente 
		this.delta = {
			x: this.x,
			y: this.y
		};

		// área de contato invisível para movimentar o stage
		// é um retângulo invisível do tamanho da área de trabalho
		// esse retângulo fica embaixo dos outros elementos
		// sem ele a interação com os componentes ficaria sobreposta
		// com a interação para movimentar a área de trabalho 
		var hit = new createjs.Shape();
		hit.graphics.clear()
			.beginFill("#000")
			.drawRect(0, 0, this.width, this.height);

		this.dragArea = new createjs.Container();
		this.dragArea.hitArea = hit;
		this.addChild(this.dragArea); 

		// adiciona as funções do mouse à área definida de intração
		this.on("pressup", this.pressup);
		this.dragArea.on("mousedown", this.mousedown);
		this.dragArea.on("pressmove", this.mousePressmove);

 	};
	var p = createjs.extend(Workarea, createjs.Container);

	/* 
	 * função: mouseMove()
	 * descrição: 
	 */
	p.mouseMove = function(event) {
		this.mouseX = event.stageX - this.x;
		this.mouseY = event.stageY - this.y;
	};

	/* 
	 * função: updateUI()
	 * descrição: função que desenha o grid
	 */
	p.updateUI = function() {

		// escala o tamanho da imagem para correponder ao tamanho da célula
		// var patternScaleX = this.cellSize / this.backgroundImage.width;
		// var patternScaleY = this.cellSize / this.backgroundImage.height;
		var scale = new createjs.Matrix2D()
			// .scale(patternScaleX, patternScaleY)
			.translate(this.backgroundImage.width / 2, this.backgroundImage.height / 2	);

		// fundo
		this.background.set({ alpha: .5 }).graphics.clear()
			.beginBitmapFill(this.backgroundImage, "repeat", scale)
			.drawRect(0, 0, this.width, this.height);
	};
	
	p.exportCurrentScene = function() {
		return {
			width: this.width,
			height: this.height,
			cellSize: this.cellSize
		};
	};

	/* 
	 * função: resize()
	 * descrição: atualiza o tamanho da workarea para preencher todo o canvas
	 */
	p.resize = function(canvas) {
		// atualiza a área visível
		this.visibleArea = {
			width: canvas.width,
			height: canvas.height
		};

		// centraliza a área de trabalho na área visível
		this.alignCenter();
	};

	/* 
	 * função: alignCenter()
	 * descrição: centraliza a área de trabalho na área visível
	 */
	p.alignCenter = function() {
		this.x = Math.round(this.visibleArea.width / 2 - this.width / 2);
		this.y = Math.round(this.visibleArea.height / 2 - this.height / 2);
	};
	
	/* 
	 * função: pressup()
	 * descrição: funções que tratam do movimento do stage
	 */
	p.pressup = function(event) {
		this.dragging = false;
		this.selectionStop();
	};

	/* 
	 * função: mousedown(), mousePressmove()
	 * descrição: funções que tratam do movimento do stage
	 */
	p.mousedown = function(event) {
		var obj = this.parent;

		// salva a diferença entre a posição do mouse e a origem do componente
		obj.delta.x = obj.x - event.stageX;
		obj.delta.y = obj.y - event.stageY;

		// remove os elementos selecionados
		obj.getComponentContainer().clearSelection();
	};

	p.mousePressmove = function(event) {
		var obj = this.parent;

		// atualiza a nova posição 
		var newPos = {
			x: event.stageX + obj.delta.x,
			y: event.stageY + obj.delta.y
		}

		obj.selectionUpdate(event);

		var visibleArea = obj.visibleArea;
		var limit = {
			minX: 0,
			minY: 0,
			maxX: visibleArea.width - obj.width,
			maxY: visibleArea.height - obj.height,
		};

		if(obj.width > visibleArea.width) {
			if(newPos.x > limit.minX) newPos.x = limit.minX;
			if(newPos.x < limit.maxX) newPos.x = limit.maxX;
		}
		// if(obj.width < visibleArea.width) {
		// 	if(newPos.x < limit.minX) newPos.x = limit.minX;
		// 	if(newPos.x > limit.maxX) newPos.x = limit.maxX;
		// }

		if(obj.height > visibleArea.height) {
			if(newPos.y > limit.minY) newPos.y = limit.minY;
			if(newPos.y < limit.maxY) newPos.y = limit.maxY;
		}
		// if(obj.height < visibleArea.height) {
		// 	if(newPos.y < limit.minY) newPos.y = limit.minY;
		// 	if(newPos.y > limit.maxX) newPos.y = limit.maxY;
		// }

		if(obj.width  > visibleArea.width)  obj.x = newPos.x;
		if(obj.height > visibleArea.height) obj.y = newPos.y;

		if(obj.width  > visibleArea.width || obj.height > visibleArea.height) obj.dragging = true;

		obj.x = Math.round(obj.x);
		obj.y = Math.round(obj.y);
	};

	p.selectionUpdate = function(event) {
		var startPos = {
			x: - this.delta.x,
			y: - this.delta.y
		}
		var endPos = {
			x: event.stageX + this.delta.x,
			y: event.stageY + this.delta.y
		}

		// coloca a área de seleção sobre os outros elementos
		this.setChildIndex(this.selectionArea, this.getNumChildren() - 1);

		// desenha a área de seleção
		this.selectionArea.set({ alpha: .2 }).graphics.clear()
			.beginFill(this.styleScheme.selectionArea)
			.beginStroke(this.styleScheme.selectionArea)
			.setStrokeStyle(1)
			.drawRect(startPos.x, startPos.y, endPos.x - this.x, endPos.y - this.y);

		// procura por elementos que toque a área de seleção
		this.getComponentContainer().checkSelection(this.selectionArea);
	};

	p.selectionStop = function() {
		this.selectionArea.graphics.clear();
	};

	p.getComponentContainer = function() {
		if(!this.componentContainer) {
			for (var i = this.numChildren - 1; i >= 0; i--) {
				var child = this.getChildAt(i);
				if(child.constructor.name === "ComponentContainer") {
					this.componentContainer = child;
				}
			};
		}
		return this.componentContainer;
	};

	window.Workarea = createjs.promote(Workarea, "Container");

}(window));




/* 
 * classe: MenuRoot
 * descrição: Essa classe contém funções e propriedades do Menu e seus submenus
 */
(function (window) {

 	// contrutor da classe MenuRoot
 	function MenuRoot(config) {
		this.Container_constructor();

		this.config			= config;

		this.styleScheme 	= config.styleScheme;
		this.subMenuDraft 	= config.draft;
		this.subMenu 		= [];
		this.isOpen			= false;
		this.radius 		= config.radius;
		this.childrenRadius = this.radius;
		this.hasChildren	= false;

		this.setup();
	}
	var p = createjs.extend(MenuRoot, createjs.Container);

	p.setup = function() {
		if(this.subMenuDraft) {
			var margin = 2;
			var radius = (this.childrenRadius + margin) / Math.sin(Math.radians(180 / this.subMenuDraft.length));
			var angleStep = 360 / this.subMenuDraft.length;
			var angleStart = 0;

			this.createSubMenu(angleStep, radius, angleStart);
		}
	};

	p.createSubMenu = function(angleStep, radius, angleStart) {
		for (var i = this.subMenuDraft.length - 1; i >= 0; i--) {
			var draft = this.subMenuDraft[i];

			var angle = angleStep * i;
			var angleRadians = Math.radians(angle + angleStart);

			var config = Object.assign({}, this.config, {
				draft: draft,
				startAngle: angle
			});

			this.subMenu[i] = new MenuItem(config);

			this.subMenu[i].x = Math.cos(angleRadians) * radius;
			this.subMenu[i].y = Math.sin(angleRadians) * radius;

			this.subMenu[i].alpha = 0;

			this.addChild(this.subMenu[i]);
		};
		
		if(this.subMenu.length > 0) this.hasChildren = true;
	};

	p.open = function(x, y) {
		// faz este item vir para o topo da lista
		this.parent.setChildIndex(this, this.parent.getNumChildren() - 1);

		// atualiza a posição
		this.x = x;
		this.y = y;

		// exibe os itens
		this.showItens();
	};

	p.showItens = function() {
		if(this.hasChildren) {
			this.isOpen = true;
			for (var i = this.subMenu.length - 1; i >= 0; i--) {
				var centerX = this.subMenu[i].x;
				var centerY = this.subMenu[i].y;
				this.subMenu[i].alpha = 1;
				this.subMenu[i].x = 0;
				this.subMenu[i].y = 0;
				this.subMenu[i].enable();

				var speed = 8;
				if(this.subMenu.length > 1) speed = Math.map(i, 0, this.subMenu.length - 1, 4, 8);

				createjs.Tween.get(this.subMenu[i])
					.to({x: centerX, y: centerY}, 300, createjs.Ease.getPowOut(speed));
			};
		}
	};

	p.close = function() {
		if(this.hasChildren) {
			this.isOpen = false;
			for (var i = 0; i < this.subMenu.length; i++) {
				this.subMenu[i].close();
				this.subMenu[i].alpha = 0;
			};
		}
	};

	window.MenuRoot = createjs.promote(MenuRoot, "Container");

}(window));




/* 
 * classe: MenuItem
 * descrição: 
 */
(function (window) {

 	// contrutor da classe MenuItem
 	function MenuItem(config) {
		this.MenuRoot_constructor(config);

		this.label 			= config.draft.label;
		this.componentName	= config.draft.componentName;
		this.subMenuDraft 	= config.draft.subMenu;
		this.startAngle 	= config.startAngle;
		this.cursor 		= "pointer";

		// objeto que adiciona os componentes
		this.componentContainer = config.componentContainer;
	
		this.button = new MenuButton({
			styleScheme: this.styleScheme,
			radius: this.childrenRadius,
			label: this.label,
		});
		this.addChild(this.button);

		this.button.on("mousedown", this.mousedown);

		this.setup();
	}
	var p = createjs.extend(MenuItem, MenuRoot);

	p.setup = function() {
		if(this.subMenuDraft) {
			var itens = this.subMenuDraft.length > 1 ? this.subMenuDraft.length : 1;
			var margin = 2;
			var minRadius = this.radius + this.childrenRadius + margin;
			var radius = minRadius;

			// calcula o tamanho o do raio relativo à quantidade de itens
			// precisa do itens > 1 pois o Math.sin retorna um número próximo de 0
			if(itens > 1) radius = (this.childrenRadius + margin) / Math.sin(Math.radians(180 / itens));

			var angleStep = 360 / itens;
			var angleStart = 0;

			if(radius <= minRadius) {
				radius = minRadius;
				angleStep = Math.degrees(Math.asin((this.childrenRadius + margin) / (minRadius))) * 2;
				angleStart = this.startAngle - angleStep * (itens - 1) / 2;
			}

			this.createSubMenu(angleStep, radius, angleStart);
		}
	};

	p.open = function(x, y) {
		this.parent.setChildIndex(this, this.parent.getNumChildren() - 1);
		this.showItens();
		this.enable();
	};

	p.disable = function() {
		this.close();
		this.button.disable();
	};

	p.enable = function() {
		if(this.isOpen) {
			this.button.selected();
		} else {
			this.button.enable();
		}
	};

	p.enableSiblings = function() {
		var obj = this.parent;
		if(this.hasChildren) {
			for (var i = 0; i < obj.subMenu.length; i++) {
				obj.subMenu[i].enable();
			};
		}
	};

	p.disableSiblings = function() {
		var obj = this.parent;
		if(this.hasChildren) {
			for (var i = 0; i < obj.subMenu.length; i++) {
				if(obj.subMenu[i] !== this) obj.subMenu[i].disable();
			};
		}
	};

	p.mousedown = function(event) {
		var obj = this.parent;
		if(obj.isOpen) {
			obj.close();
			obj.enableSiblings();
		} else {
			obj.open();
			obj.disableSiblings();
		}

		// adiciona o elemento
		if(!obj.hasChildren) {
			var root = obj.getRoot();
			obj.componentContainer.addComponent({
				type: obj.componentName,
				x: root.x,
				y: root.y
			});
			root.close();
		}
	};

	p.getRoot = function() {
		var parent = this.parent;
		var i = 0;
		var depth = 10;
		for (var i = 0; i < depth; i++) {
			if(parent.constructor.name === "MenuRoot") return parent;
			parent = parent.parent;
		};
		return null;
	};

	window.MenuItem = createjs.promote(MenuItem, "MenuRoot");

}(window));




/* 
 * classe: MenuButton
 * descrição: 
 */
(function (window) {

 	// contrutor da classe MenuButton
 	function MenuButton(config) {
		this.Container_constructor();

		this.styleScheme  = config.styleScheme;
		this.currentColor = this.styleScheme.default;
		this.radius 	  = config.radius;
		this.lastState	  = "default"; // selected, disabled, default, hover
		this.state		  = "default"; // selected, disabled, default, hover
		this.label		  = config.label;

		this.background = new createjs.Shape();
		this.text 		= new createjs.Text();
		this.addChild(this.background, this.text);

		this.updateUI();

		// hover
		this.on("rollover", this.rollover);
		this.on("rollout",  this.rollout);
 	}
	var p = createjs.extend(MenuButton, createjs.Container);

	p.updateUI = function() {
		var currentStyle = Object.assign({}, this.styleScheme.default);

		if(this.styleScheme[this.state]) {
			Object.assign(currentStyle, this.styleScheme[this.state]);
		}

		// cria um circulo
		this.background.graphics.clear()
			// .beginStroke(currentStyle.border)
			// .setStrokeStyle(2)
			.beginFill(currentStyle.background)
			.drawCircle(0, 0, this.radius, this.radius);
		// this.background.shadow = new createjs.Shadow(currentStyle.shadow, 2, 2, 6);

		// cria campo de texto para o nome do componente
		this.text.set({
			text: this.label,
			font: currentStyle.font,
			color: currentStyle.text,
			x: 0,
			y: 0,
			textBaseline: "middle",
			textAlign: "center"
		});
	};

	p.setState = function(state) {
		this.lastState = this.state;
		this.state = state;
		this.updateUI();
	}

	p.rollover = function(event) {
		this.lastState = this.state;
		if(this.state !== "disabled") {
			this.setState("hover");
		}
	};

	p.rollout = function(event) {
		if(this.state === "hover") this.setState(this.lastState);
	};

	p.disable = function() {
		this.setState("disabled");
	};

	p.enable = function() {
		this.setState("default");
	};

	p.selected = function() {
		this.setState("selected");
	};

	window.MenuButton = createjs.promote(MenuButton, "Container");
}(window));