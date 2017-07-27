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
		var cOut = this.componentContainer.getChildByName(connection.outputName);

		if(cIn != null && cOut != null) {
			var cInNode = cIn.getChildByName(connection.inputNodeName);
			var cOutNode = cOut.getChildByName(connection.outputNodeName);

			this.addChild(new Connection({
				styleScheme: this.styleScheme,
				workarea: this.workarea,
				node: {
					input: cInNode,
					output: cOutNode
				},
				wireTypeIndex: connection.wireTypeIndex,
				customWireType: connection.customWireType,
			}));
		}
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


	p.exportCurrentScene = function() {
		var connections = [];
		for (var i = this.numChildren - 1; i >= 0; i--) {
			var child = this.getChildAt(i);
			var node = child.node;
			connections.push({
				inputName: node.input.parent.name,
				inputNodeName: node.input.name,
				outputName: node.output.parent.name,
				outputNodeName: node.output.name,
				wireTypeIndex: child.wireTypeIndex,
				customWireType: child.customWireType,
			});
		};
		console.log(connections);
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

		// wire type
		this.wireTypeArray  = ["bezier", "ortho", "orthoB", "orthoC", "diagonal", "diagonalRect", "line"];
		this.wireTypeIndex  = config.wireTypeIndex != null ? config.wireTypeIndex : this.wireTypeArray.indexOf(this.styleScheme.default.wireType);
		this.customWireType = config.customWireType != null ? config.customWireType : false;

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
		this.on("click", this.mouseclick);

		if(this.isAttached()) this.setState("default");
 	};
	var p = createjs.extend(Connection, createjs.Container);


	/* 
	 * função: mouseclick()
	 * descrição: 
	 */
	p.mouseclick = function() {
		this.changeWireType();
	};

	p.changeWireType = function () {
		this.customWireType = true;
		this.wireTypeIndex = this.wireTypeIndex < this.wireTypeArray.length - 1 ? this.wireTypeIndex + 1 : 0;
	};


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
		if(this.isAttached()) {
			this.setState("hover");
			this.bringToFront();
		}
	};


	/* 
	 * função: bringToFront()
	 * descrição: move o elemento para topo da lista de renderização
	 */
	p.bringToFront = function() {
		if(this.parent.hasTemporaryConnection()) {
			var newIndex = this.parent.numChildren - 2;
		} else {
			var newIndex = this.parent.numChildren - 1;
		}
		this.parent.setChildIndex(this, newIndex);
	};


	/* 
	 * função: mouseout()
	 * descrição: 
	 */
	p.mouseout = function() {
		if(this.isAttached()) {
			this.setState("default");
		}
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
			var radius = this.workarea.cellSize * 3;
			var seg = radius + this.workarea.cellSize * 3;
			var wireType = this.customWireType ? this.wireTypeArray[this.wireTypeIndex] : currentStyle.wireType;
			switch(wireType) {
				case "line":
					g = this.drawWireLine(startPos, endPos);
					break;
				case "ortho":
					g = this.drawWireOrtho(startPos, endPos, radius, seg);
					break;
				case "orthoB":
					g = this.drawWireOrthoB(startPos, endPos, radius, seg);
					break;
				case "orthoC":
					g = this.drawWireOrthoC(startPos, endPos, radius, seg);
					break;
				case "diagonal":
					g = this.drawWireDiagonal(startPos, endPos, radius, seg);
					break;
				case "diagonalRect":
					g = this.drawWireDiagonalRect(startPos, endPos, radius, seg);
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
	 * função: drawWireDiagonalRect()
	 * descrição: limita a inclinação do segmento médio à 45 graus
	 */
	p.drawWireDiagonalRect = function(startPos, endPos, radius, seg) {
		var middlePos = {
			x: (endPos.x + startPos.x) / 2,
			y: (endPos.y + startPos.y) / 2
		};

		var distY = Math.abs(startPos.y - endPos.y);

		// pos x dos segmentos verticais
		var verSegSX = startPos.x + seg;
		var verSegEX = endPos.x   - seg;

		verSegSX = Math.max(verSegSX, middlePos.x - distY / 2);
		verSegEX = Math.min(verSegEX, middlePos.x + distY / 2);

		var point = [
			startPos,
			{
				x: verSegSX,
				y: startPos.y
			}, { 
				x: verSegEX,
				y: endPos.y,
			},
			endPos
		];

		return this.pointToLine(point, radius);
	};



	/* 
	 * função: drawWireDiagonal()
	 * descrição: 
	 */
	p.drawWireDiagonal = function(startPos, endPos, radius, seg) {
		// pos x dos segmentos verticais
		var verSegSX = startPos.x + seg;
		var verSegEX = endPos.x   - seg;

		var point = [
			startPos,
			{
				x: verSegSX,
				y: startPos.y
			}, { 
				x: verSegEX,
				y: endPos.y,
			},
			endPos
		];

		return this.pointToLine(point, radius);
	};


	/* 
	 * função: drawWireOrtho()
	 * descrição: 
	 */
	p.drawWireOrtho = function(startPos, endPos, radius, seg) {
		var middlePos = {
			x: (endPos.x + startPos.x) / 2,
			y: (endPos.y + startPos.y) / 2
		};

		var dirx = endPos.x - seg * 2 > startPos.x ? 1 : -1;

		// pos x dos segmentos verticais
		var verSegSX = startPos.x + seg;
		var verSegEX = endPos.x   - seg;

		var point = [
			startPos,
			{
				x: verSegSX,
				y: startPos.y
			}, {
				x: verSegSX,
				y: middlePos.y
			}, {
				x: verSegEX,
				y: middlePos.y 
			}, { 
				x: verSegEX,
				y: endPos.y,
			},
			endPos
		];

		return this.pointToLine(point, radius);
	};


	/* 
	 * função: drawWireOrthoB()
	 * descrição: 
	 */
	p.drawWireOrthoB = function(startPos, endPos, radius, seg) {
		var middlePos = {
			x: (endPos.x + startPos.x) / 2,
			y: (endPos.y + startPos.y) / 2
		};

		var dirx = endPos.x - seg * 2 > startPos.x ? 1 : -1;

		// pos x dos segmentos verticais
		var verSegSX = startPos.x + seg;
		var verSegEX = endPos.x   - seg;

		var point = [
			startPos,
			{
				x: verSegSX,
				y: startPos.y
			}, {
				x: verSegSX,
				y: middlePos.y
			}, {
				x: verSegEX,
				y: middlePos.y 
			}, { 
				x: verSegEX,
				y: endPos.y,
			},
			endPos
		];

		if(dirx > 0) {
			point[1].x = middlePos.x;
			point[2].x = middlePos.x;
			point[3].x = middlePos.x;
			point[4].x = middlePos.x;
		}

		return this.pointToLine(point, radius);
	};


	/* 
	 * função: drawWireOrthoC()
	 * descrição: 
	 */
	p.drawWireOrthoC = function(startPos, endPos, radius, seg) {
		var middlePos = {
			x: (endPos.x + startPos.x) / 2,
			y: (endPos.y + startPos.y) / 2
		};

		var dirY = endPos.y > startPos.y ? 1 : -1;

		// pos x dos segmentos verticais
		var newStartPosX = startPos.x + seg;
		var newEndPosX 	 = endPos.x - seg;

		var height = Math.abs((startPos.y - endPos.y) / 4);

		var verSegSX = startPos.x + seg;
		var verSegEX = endPos.x   - seg;

		var arcRadius = Math.min(height, radius);
		var arcRadiusD = arcRadius * dirY;

		var minDeltaX = - 2 * arcRadius;
		var maxDeltaX = 2 * arcRadius;
		var deltaX = newEndPosX - newStartPosX;
		var deltaX = Math.constrain(deltaX, minDeltaX, maxDeltaX);
		var dirX = Math.map(deltaX, minDeltaX, maxDeltaX, 1, -1);

		var xtoY = 1 - Math.abs(dirX);

		var point = [
			startPos, {
				x: newStartPosX,
				y: startPos.y
			}, {
				x: verSegSX,
				y: middlePos.y - (arcRadiusD * xtoY)
			}, {
				x: verSegEX,
				y: middlePos.y + (arcRadiusD * xtoY)
			}, {
				x: newEndPosX,
				y: endPos.y,
			},
			endPos
		];

		return this.pointToLine(point, radius);
	};

	p.pointToLine = function(points, radius) {
		if(radius <= 0) this.pointToLineHardCorner(points);

		var g = new createjs.Graphics();
		g.moveTo(points[0].x, points[0].y);
		for (var i = 1; i < points.length - 1; i++) {
			var pa = points[i - 1]; // Previous point
			var pb = points[i + 1]; // Next point
			var corner = points[i];	// current point

			var angleCorner = Math.angleFromPoints(corner, pa, pb);
			
			// if the point is not a corner jump the point
			if(!isNaN(angleCorner)) {
				var distFromCorner = radius / Math.tan(angleCorner / 2);

				var lineA = [corner, pa];
				var lineALength = Math.lineLength(lineA);

				var lineB = [corner, pb];
				var lineBLength = Math.lineLength(lineB);

				// limita o raio
				distFromCorner = Math.min(distFromCorner, lineALength / 2, lineBLength / 2);

				var startPoint = Math.pointInLine(lineA, distFromCorner);
				var endPoint = Math.pointInLine(lineB, distFromCorner);

				g.lineTo(startPoint.x, startPoint.y);

				// arc
				var limitedRadius = distFromCorner * Math.tan(angleCorner / 2);
				g.arcTo(corner.x, corner.y, endPoint.x, endPoint.y, limitedRadius);

				// bezier
				// g.quadraticCurveTo(corner.x, corner.y, endPoint.x, endPoint.y);

				// debug points
				// g.moveTo(startPoint.x, startPoint.y).drawCircle(startPoint.x, startPoint.y, 1);
				// g.moveTo(corner.x, corner.y).drawCircle(corner.x, corner.y, 1);
				// g.moveTo(endPoint.x, endPoint.y).drawCircle(endPoint.x, endPoint.y, 1);
				// g.moveTo(endPoint.x, endPoint.y);
			}
		};
		var lastPoint = points[points.length - 1];
		g.lineTo(lastPoint.x, lastPoint.y);
		return g;
	};

	p.pointToLineHardCorner = function(points) {
		var g = new createjs.Graphics();
		g.moveTo(points[0].x, points[0].y);
		for (var i = 1; i < points.length; i++) {
			g.lineTo(points[i].x, points[i].y);
		};
		return g;
	};

	window.Connection = createjs.promote(Connection, "Container");

}(window));