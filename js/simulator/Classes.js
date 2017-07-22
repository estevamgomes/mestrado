/* 
 * classe: Wire
 * descrição: classe com propriedades e funções comuns à todos os inputs
 */
(function (window) {

 	// contrutor da classe output
 	function Wire(config) {
		this.Container_constructor();

		this.startPos = config.startPos;
		this.endPos = config.endPos;
		this.color = config.color;

		// cria um shape para armazenar o fio que representa a conexão
		this.wire = new createjs.Shape();
		this.drawWire();
		this.addChild(this.wire);

 	};
	var p = createjs.extend(Wire, createjs.Container);

	/* 
	 * função: drawWire()
	 * descrição: função que desenha um fio usando uma curva bezier entre dois pontos
	 */
	p.drawWire = function() {
		this.wire.graphics.clear().beginStroke(this.color).setStrokeStyle(2);

		// distancia entre o ponto inicial e final
		var dist = Math.dist(this.startPos, this.endPos);

		// control point 1
		var cp1 = {
			x: this.startPos.x + 0.55 * dist,
			y: this.startPos.y
		};

		// controle point 2
		var cp2 = {
			x: this.endPos.x - 0.55 * dist,
			y: this.endPos.y
		};

		this.wire.graphics			
			.moveTo(this.startPos.x, this.startPos.y)
			.bezierCurveTo(
				cp1.x, cp1.y,
				cp2.x, cp2.y,
				this.endPos.x, this.endPos.y
			);
	}

	window.Wire = createjs.promote(Wire, "Container");

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

		this.width = config.width == "auto" ? config.canvasWidth : config.width;
		this.height = config.height == "auto" ? config.canvasHeight : config.height;

		// garante que o tamanho da workarea seja múltiplo do tamanho da célula
		this.width = Math.floor(this.width / config.cellSize) * config.cellSize;
		this.height = Math.floor(this.height / config.cellSize) * config.cellSize;

		// área visível, ou seja, o tamanho do elemento canvas
		this.visibleArea = {
			width: config.canvasWidth,
			height: config.canvasHeight
		};

		// alinha a workarea ao centro da visible area		
		this.alignCenter();

		// informações para o grid
		this.cellSize 	 = config.cellSize;
		this.colorScheme = config.colorScheme;
		this.gridStyle 	 = config.gridStyle || "dotted"; // crosshair, line, dotted, none

		// desenhar grid
		this.grid = new createjs.Shape();
		this.drawGrid();

		//  desenha o background
		background = new createjs.Shape();
		background.graphics
			// .beginStroke(this.gridColor)
			// .setStrokeStyle(1)
			.beginFill(this.colorScheme.background)
			.drawRect(0, 0, this.width, this.height);

		// adiciona o background e o grid
		this.addChild(background, this.grid);

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
		hit.graphics
			.beginFill("#000")
			.drawRect(0, 0, this.width, this.height);

		this.dragArea = new createjs.Container();
		this.dragArea.hitArea = hit;
		this.addChild(this.dragArea); 

		// adiciona as funções do mouse à área definida de intração
		this.on("pressup", this.pressup);
		this.dragArea.on("mousedown", this.mouseDown);
		this.dragArea.on("pressmove", this.mousePressmove);

 	};
	var p = createjs.extend(Workarea, createjs.Container);

	/* 
	 * função: drawGrid()
	 * descrição: função que desenha o grid
	 */
	p.drawGrid = function() {
		var gridG = this.grid.graphics;
		gridG.clear(); // limpa o que estiver desenhado

		// line grid
		if(this.gridStyle == "line") {
			gridG.beginStroke(this.colorScheme.grid);
			var gridCell = this.cellSize;
			var line = 1;
			var boldLine = 10; // criar uma linha mais grossa a cada 10 linhas

			// linhas verticais
			for (var x = gridCell; x < this.width; x += gridCell) {
				if(line % boldLine == 0) {
					gridG.setStrokeStyle(2);
				} else {
					gridG.setStrokeStyle(1);
				}
				line += 1;
				gridG
					.moveTo(x, 0)
					.lineTo(x, this.height);
			};

			// linhas horizontais
			line = 1;
			for (var y = gridCell; y < this.height; y += gridCell) {
				if(line % boldLine == 0) {
					gridG.setStrokeStyle(2);
				} else {
					gridG.setStrokeStyle(1);
				}
				line += 1;
				gridG
					.moveTo(0, y)
					.lineTo(this.width, y);
			};
		}

		// crosshair
		if(this.gridStyle == "crosshair") {
			gridG.beginStroke(this.colorScheme.grid).setStrokeStyle(1);
			var gridCell = this.cellSize * 3;
			var dash = this.cellSize;
			for (var x = 0; x <= this.width; x += gridCell) {
				for (var y = 0; y <= this.height; y += gridCell) {
					gridG
						.moveTo(x - dash / 2, y)
						.lineTo(x + dash / 2, y)
						.moveTo(x, y - dash / 2)
						.lineTo(x, y + dash / 2);
				};
			};
		}

		// dotted grid
		if(this.gridStyle == "dotted") {
			var gridCell = this.cellSize;
			gridG.beginFill(this.colorScheme.grid);
			for (var x = 0; x <= this.width; x += gridCell) {
				for (var y = 0; y <= this.height; y += gridCell) {
					gridG.moveTo(x, y).drawCircle(x, y, 1);
				};
			};
		}
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
		this.x = this.visibleArea.width / 2 - this.width / 2;
		this.y = this.visibleArea.height / 2 - this.height / 2;
	};
	
	/* 
	 * função: pressup()
	 * descrição: funções que tratam do movimento do stage
	 */
	p.pressup = function(event) {
		this.dragging = false;
	};

	/* 
	 * função: mouseDown(), mousePressmove()
	 * descrição: funções que tratam do movimento do stage
	 */
	p.mouseDown = function(event) {
		// salva a diferença entre a posição do mouse e a origem do componente
		this.parent.delta.x = this.parent.x - event.stageX;
		this.parent.delta.y = this.parent.y - event.stageY;
	};

	p.mousePressmove = function(event) {
		var obj = this.parent;

		// atualiza a nova posição 
		var newPos = {
			x: event.stageX + obj.delta.x,
			y: event.stageY + obj.delta.y
		}

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

		this.fontStyle   	= config.fontStyle;
		this.colorScheme 	= config.colorScheme;
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
		if(this.subMenuDraft != null) {
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
				startAngle: angle,
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

		this.currentColor = this.colorScheme.default;

		this.name 			= config.draft.name;
		this.componentName	= config.draft.componentName;
		this.subMenuDraft 	= config.draft.subMenu;
		this.startAngle 	= config.startAngle;
		this.cursor 		= "pointer";
		this.componentArray = config.componentArray;
	
		this.button = new MenuButton({
			fontStyle: this.fontStyle,
			colorScheme: this.colorScheme,
			radius: this.childrenRadius,
			name: this.name,
		});
		this.addChild(this.button);

		this.button.on("mousedown", this.mousedown);

		this.setup();
	}
	var p = createjs.extend(MenuItem, MenuRoot);

	p.setup = function() {
		if(this.subMenuDraft != null) {
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
		this.enable();
		this.showItens();
	};

	p.disable = function() {
		this.close();
		this.button.disable();
	};

	p.enable = function() {
		this.button.enable();
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
			obj.enableSiblings();
			obj.close();
		} else {
			obj.disableSiblings();
			obj.open();
		}

		// adiciona o elemento
		if(!obj.hasChildren) {
			var root = obj.getRoot();
			obj.componentArray.add({
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
			if(parent.constructor.name == "MenuRoot") return parent;
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

		this.colorScheme  = config.colorScheme;
		this.currentColor = this.colorScheme.default;
		this.fontStyle    = config.fontStyle;
		this.radius 	  = config.radius;
		this.disabled	  = false;
		this.name		  = config.name;

		this.background = new createjs.Shape();
		this.text 	= new createjs.Text();
		this.addChild(this.background, this.text);

		this.updateUI();

		// hover
		this.on("rollover", this.rollover);
		this.on("rollout",  this.rollout);
 	}
	var p = createjs.extend(MenuButton, createjs.Container);

	p.updateUI = function(colorScheme) {
		if(colorScheme != null) this.currentColor = colorScheme;

		// cria um circulo
		this.background.graphics.clear()
			// .beginStroke(this.currentColor.border)
			// .setStrokeStyle(2)
			.beginFill(this.currentColor.background)
			.drawCircle(0, 0, this.radius, this.radius);
		this.background.shadow = new createjs.Shadow(this.currentColor.shadow, 2, 2, 6);

		// cria campo de texto para o nome do componente
		this.text.set({
			text: this.name,
			font: this.fontStyle,
			color: this.currentColor.text,
			x: 0,
			y: 0,
			textBaseline: "middle",
			textAlign: "center",
		});
	};

	p.rollover = function(event) {
		if(!this.disabled) {
			this.updateUI(this.colorScheme.hover);
		}
	};

	p.rollout = function(event) {
		if(!this.disabled) {
			this.updateUI(this.colorScheme.default);
		}
	};

	p.disable = function() {
		this.disabled = true;
		this.updateUI(this.colorScheme.disabled);
	};

	p.enable = function() {
		this.disabled = false;
		this.updateUI(this.colorScheme.default);
	};

	window.MenuButton = createjs.promote(MenuButton, "Container");
}(window));