/* 
 * classe: ConnectionContainer
 * descrição: classe do container das conexões
 */
(function (window) {

 	// contrutor da classe ConnectionContainer
 	function ConnectionContainer(config) {
		this.Container_constructor();

		this.styleScheme = config.styleScheme;
		this.workarea	 = config.workarea;
		this.lastChild;
		this.componentContainer;
 	};
	var p = createjs.extend(ConnectionContainer, createjs.Container);

	p.tick = function() {
		for (var i = 0; i < this.numChildren; i++) {
			this.getChildAt(i).tick();
		};
	};


	p.hasTemporaryConnection = function() {
		if(this.numChildren > 0) {
			this.lastChild = this.getChildAt(this.numChildren - 1);
			if(!this.lastChild.isAttached()) return true;
		}
		return false;
	};


	p.startConnection = function(node) {
		var config = {
			styleScheme: this.styleScheme,
			workarea: this.workarea,
			node: {}
		};
		config.node[node.type] = node;
		this.addChild(new Connection(config));
	};


	p.mousemove = function(event) {
		for (var i = 0; i < this.numChildren; i++) {
			this.getChildAt(i).mousemove(event);
		};
	};


	/* 
	 * função: mouseDownOverObj()
	 * descrição: quando o evento mousedown ocorre no stage ele chama essa função
	 *			  e passa o objeto no qual o mouse clicou
	 */
	p.mouseDownOverObj = function(obj) {
		// se clicar sobre outra coisa que não seja o terminal apagar a conexão temporária
		if(obj.parent.constructor.name != "Terminal") {
			if(this.hasTemporaryConnection()) this.removeChild(this.lastChild);
		}
	};


	p.addConnection = function(connection) {
		var cIn = this.componentContainer.getChildByName(connection.inputName);
		var cInNode = cIn.getChildByName(connection.inputNodeName);

		var cOut = this.componentContainer.getChildByName(connection.outputName);
		var cOutNode = cOut.getChildByName(connection.outputNodeName);

		this.addChild(new Connection({
			styleScheme: this.styleScheme,
			workarea: this.workarea,
			node: {
				input: cInNode,
				output: cOutNode
			}
		}));
	};


	p.terminalClick = function(node) {
		if(this.hasTemporaryConnection()) {
			this.lastChild.setNode(node);
		} else {
			this.startConnection(node);
		}
	};


	p.terminalMagnet = function(node, on) {
		if(this.hasTemporaryConnection()) this.lastChild.magnet(node, on);
	};


	p.removeConnectionsFrom = function(node) {
		for (var i = this.numChildren - 1; i >= 0; i--) {
			var child = this.getChildAt(i);
			if(child.node.input == node || child.node.output == node) {
				this.removeChild(child);
			}
		}
	};


	p.removeOverlappedConnections = function(connection) {
		for (var i = this.numChildren - 1; i >= 0; i--) {
			var child = this.getChildAt(i);
			if(child != connection) {
				if(child.node.input == connection.node.input) {
					this.removeChild(child);
				}
			}
		}
	};


	p.exportCurrentState = function() {
		var connections = [];
		for (var i = this.numChildren - 1; i >= 0; i--) {
			var node = this.getChildAt(i).node;
			connections.push({
				inputName: node.input.parent.name,
				inputNodeName: node.input.name,
				outputName: node.output.parent.name,
				outputNodeName: node.output.name,
			});
		};
		return connections;
	};

	window.ConnectionContainer = createjs.promote(ConnectionContainer, "Container");

}(window));




/* 
 * classe: Connection
 * descrição: Classe das conexões
 */
(function (window) {

 	// contrutor da classe Connection
 	function Connection(config) {
		this.Container_constructor();

		this.styleScheme = config.styleScheme;
		this.workarea	 = config.workarea;
		this.state 		 = "temporary";

		this.node = {
			input:  null, // terminal do tipo input
			output: null, // terminal do tipo output
			magnet: null  // terminal que está próximo do mouse
		};
		this.mousePos;

		Object.assign(this.node, config.node);

		// cria um shape para armazenar o fio que representa a conexão
		this.wire = new createjs.Shape();
		this.hit = new createjs.Shape();

		this.hitArea = this.hit;
		this.cursor = "pointer";

		this.addChild(this.wire);
		this.updateUI();

		this.on("mouseover", this.mouseover);
		this.on("mouseout", this.mouseout);
		this.on("dblclick", this.mousedblclick);

		if(this.isAttached()) this.setState("default");
 	};
	var p = createjs.extend(Connection, createjs.Container);


	/* 
	 * função: mouseclick()
	 * descrição: 
	 */
	p.mousedblclick = function() {
		this.removeConnection();
	};


	/* 
	 * função: mouseclick()
	 * descrição: 
	 */
	p.removeConnection = function() {
		this.parent.removeChild(this);
	};


	/* 
	 * função: mouseover()
	 * descrição: 
	 */
	p.mouseover = function() {
		this.setState("hover");
	};


	/* 
	 * função: mouseout()
	 * descrição: 
	 */
	p.mouseout = function() {
		this.setState("default");
	};


	/* 
	 * função: isAttached()
	 * descrição: 
	 */
	p.isAttached = function() {
		return this.node.output != null && this.node.input != null;
	};


	/* 
	 * função: setNode()
	 * descrição: 
	 */
	p.setNode = function(node) {
		this.node[node.type] = node;

		// verifica se os dois nodes pertencem ao componente
		// e impede a conexão
		if(this.isAttached()) {
			if(this.node.input.parent == this.node.output.parent) {
				this.node[node.type] = null;
			}
		}

		if(this.isAttached()) {
			this.setState("default");
			this.parent.removeOverlappedConnections(this);
		}
	};


	/* 
	 * função: magnet()
	 * descrição: 
	 */
	p.magnet = function(node, on) {
		if((node.type == "input" && this.node.output != null) ||
		   (node.type == "output" && this.node.input != null)) {
			if(on) {
				this.node.magnet = node;
				this.setState("active");
			} else {
				this.node.magnet = null;
				this.setState("temporary");
			}
		}
	};


	/* 
	 * função: setState()
	 * descrição: 
	 */
	p.setState = function(state) {
		this.state = state;
		this.updateUI();
	};


	/* 
	 * função: getMousePos()
	 * descrição: 
	 */
	p.getMousePos = function() {
		return Math.subVector(this.mousePos, this.workarea);
	};


	/* 
	 * função: mousemove()
	 * descrição: 
	 */
	p.mousemove = function(event) {
		this.mousePos = {
			x: event.stageX,
			y: event.stageY
		};
		this.updateUI();
	};


	/* 
	 * função: tick()
	 * descrição: 
	 */
	p.tick = function() {
		if(this.isAttached()) {
			this.node.input.setValue(this.node.output.value);
			this.updateUI();
		}
	};


	/* 
	 * função: updateUI()
	 * descrição: função que desenha um fio usando uma curva bezier entre dois pontos
	 */
	p.updateUI = function() {
		// define o esqueme de cores e o estilo da linha
		var currentStyle = Object.assign({}, this.styleScheme.default);

		if(this.styleScheme[this.state] != null) {
			Object.assign(currentStyle, this.styleScheme[this.state]);
		}

		this.wire.graphics.clear()
			.beginStroke(currentStyle.wire)
			.setStrokeStyle(currentStyle.size, currentStyle.caps);

		if(currentStyle.dash) this.wire.graphics.setStrokeDash([5, 2], 0);

		// define a posição incial e final com base nos Nodes e no mouse
		var startPos, endPos;

		if(this.node.input != null) {
			endPos = Math.addVector(this.node.input, this.node.input.parent);
		} else if(this.node.magnet != null) {
			endPos = Math.addVector(this.node.magnet, this.node.magnet.parent);
		} else if(this.mousePos != null) {
			endPos = this.getMousePos();
		}

		if(this.node.output != null) {
			startPos = Math.addVector(this.node.output, this.node.output.parent);
		} else if(this.node.magnet != null) {
			startPos = Math.addVector(this.node.magnet, this.node.magnet.parent);
		} else if(this.mousePos != null) {
			startPos = this.getMousePos();
		}

		if(startPos != null && endPos != null) {
			var g;
			switch(currentStyle.wireType) {
				case "line":
					g = this.drawWireLine(startPos, endPos);
					break;
				case "ortho":
					g = this.drawWireOrtho(startPos, endPos);
					break;
				default:
					g = this.drawWireBezier(startPos, endPos);
			}

			this.hit.graphics.clear().beginStroke("#ffffff").setStrokeStyle(10);
			for (var i = 0; i < g._activeInstructions.length; i++) {
				this.wire.graphics.append(g._activeInstructions[i]);
				this.hit.graphics.append(g._activeInstructions[i]);
			};
		}
	};


	/* 
	 * função: drawWireBezier()
	 * descrição: 
	 */
	p.drawWireBezier = function(startPos, endPos) {
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

		var g = new createjs.Graphics();
		g.moveTo(startPos.x, startPos.y)
			.bezierCurveTo(
				cp1.x, cp1.y,
				cp2.x, cp2.y,
				endPos.x, endPos.y
			);
		return g;
	};


	/* 
	 * função: drawWireLine()
	 * descrição: 
	 */
	p.drawWireLine = function(startPos, endPos) {
		var g = new createjs.Graphics();
		g.moveTo(startPos.x, startPos.y)
			.lineTo(endPos.x, endPos.y);
		return g;
	};


	/* 
	 * função: drawWireOrtho()
	 * descrição: 
	 */
	p.drawWireOrtho = function(startPos, endPos) {
		var middlePos = {
			x: startPos.x + (endPos.x - startPos.x) / 2,
			y: startPos.y + (endPos.y - startPos.y) / 2
		};

		var dirY = endPos.y > startPos.y ? 1 : -1;
		var arcRadiusX = Math.abs(startPos.x - endPos.x) / 2;	
		var arcRadiusY = Math.abs(startPos.y - endPos.y) / 4;
		var arcRadiusMin = 20;
		var arcRadius = Math.min(arcRadiusX, arcRadiusY, arcRadiusMin);

		var seg = 12;

		var g = new createjs.Graphics();
		if(endPos.x > startPos.x && Math.abs(startPos.x - endPos.x) > (seg * 2 + arcRadiusMin * 2)) {
			g.moveTo(startPos.x, startPos.y)
				.lineTo(middlePos.x - arcRadius, startPos.y)
				.arcTo(
					middlePos.x, startPos.y,
					middlePos.x, startPos.y + arcRadius * dirY,
					arcRadius
				)
				.lineTo(middlePos.x, endPos.y - arcRadius * dirY)
				.arcTo(
					middlePos.x, endPos.y,
					middlePos.x + arcRadius, endPos.y,
					arcRadius
				)
				.lineTo(endPos.x, endPos.y);
		} else {
			arcRadiusX = Math.abs((startPos.x + (seg + arcRadiusMin) * 2) - endPos.x) / 2;	
			arcRadius = Math.min(arcRadiusX, arcRadiusY, arcRadiusMin);		
			arcRadiusY = Math.min(arcRadiusY, arcRadiusMin);
			g.moveTo(startPos.x, startPos.y)
				.lineTo(startPos.x + seg, startPos.y)
				.arcTo(
					startPos.x + (seg + arcRadiusMin), startPos.y,
					startPos.x + (seg + arcRadiusMin), startPos.y + arcRadiusMin * dirY,
					arcRadiusY
				)
				.arcTo(
					startPos.x + (seg + arcRadiusMin), middlePos.y,
					startPos.x + (seg - arcRadius), middlePos.y,
					arcRadius
				)
				.arcTo(
					endPos.x - (seg + arcRadiusMin), middlePos.y,
					endPos.x - (seg + arcRadiusMin), middlePos.y + arcRadius * dirY,
					arcRadius
				)
				.arcTo(
					endPos.x - (seg + arcRadiusMin), endPos.y,
					endPos.x - seg, endPos.y,
					arcRadiusY
				)
				.lineTo(endPos.x, endPos.y);
		}
		return g;
	};

	window.Connection = createjs.promote(Connection, "Container");

}(window));