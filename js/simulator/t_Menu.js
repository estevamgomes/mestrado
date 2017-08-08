/* 
 * classe: MainMenu
 * descrição: 
 */
(function (window) {

 	// contrutor da classe MainMenu
 	function define_MainMenu() {
 		var mobj = function(config) {
 			this.div 	= config.div;
 			this.simObj = config.simObj;

 			this.setup();
 		};

		mobj.prototype.setup = function() {

	 		// html do menu principal
			var menuHtml = '<div class="trama-menu">' 
				menuHtml += '<button class="trama-menu-toggle"></button>';
				menuHtml += '<ul class="trama-menu-list">';
				menuHtml += '<li><button class="trama-button exampleButton" data-name="scene-empty">Nova cena</button></li>';
				menuHtml += '<li><button class="trama-button trama-export"">Download da cena</button></li>';
				menuHtml += '<li><div class="trama-button trama-import"><div class="ui-import-label">Importar cena</div><input class="ui-import-fileholder" type="file" tile="Nenhum arquivo selecionado"></div></li>';
				menuHtml += '<li><button class="trama-button trama-examples-toggle">Exemplos</button></li>';
				menuHtml += '<li><button class="trama-button trama-controls-toggle">Modo de usar</button></li>';
				menuHtml += '</ul>';
				menuHtml += '</div>'; 

	 		// janela com exemplos
			var menuCenas = '<div class="trama-menu-box trama-examples">';
				menuCenas += '<button class="close">×</button>';
				menuCenas += '<h2>Exemplos</h2>';
				menuCenas += '<ul>';
				menuCenas += '<li><button class="exampleButton" data-name="scene">Exemplo 01</button></li>';
				menuCenas += '<li><button class="exampleButton" data-name="scene-homeostat">Homeostato</button></li>';
				menuCenas += '<li><button class="exampleButton" data-name="scene-led">LED</button></li>';
				menuCenas += '<li><button class="exampleButton" data-name="scene-servo">Servo</button></li>';
				menuCenas += '<li><button class="exampleButton" data-name="scene-sonar">Sonar</button></li>';
				menuCenas += '</ul>';
				menuCenas += '</div>';

			// janela com controles
			var controles = '<div class="trama-menu-box trama-controls">';
				controles += '<button class="close">×</button>';
				controles += '<h2>Modo de usar</h2>';
				controles += '<ul>';
				controles += '<li>Clique duas vezes ou clique e segure para abrir o menu</li>';
				controles += '<li>Arraste os componentes para a área com um x no canto inferior direito para apagá-los</li>';
				controles += '<li>Clique no círculo de um dos lados do componente e arraste ou clique em outro círculo para criar uma conexão</li>';
				controles += '<li>Clique duas vezes sobre o fio para desativar a conexão</li>';
				controles += '<li>G = muda o estilo do grid</li>';
				controles += '<li>W = muda o estilo do fio</li>';
				controles += '<li>E = exporta a cena atual</li>';
				controles += '</ul>';
				controles += '</div>';

			var menudiv = document.createElement("div");;
			menudiv.innerHTML = menuHtml + menuCenas + controles;

			this.div.appendChild(menudiv);

			this.menuList 		= menudiv.querySelector(".trama-menu-list");
			this.menuExamples  	= menudiv.querySelector(".trama-examples");
			this.menuControls  	= menudiv.querySelector(".trama-controls");

			var menuToggle 		= menudiv.querySelector(".trama-menu-toggle"),
				exportButton 	= this.menuList.querySelector(".trama-export"),
				importButton 	= this.menuList.querySelector(".trama-import"),
				examplesToggle  = this.menuList.querySelector(".trama-examples-toggle"),
				controlsToggle  = this.menuList.querySelector(".trama-controls-toggle"),

				examplesClose  = this.menuExamples.querySelector(".close"),
				controlsClose  = this.menuControls.querySelector(".close");

			// adiona a ação aos links do exemplo
			var simObj = this.simObj;
			var menuObj = this;
			var exampleLink = menudiv.querySelectorAll(".exampleButton");
			Array.prototype.forEach.call(exampleLink, function(el, i){
				el.addEventListener("click", function(evt) {
					var path = "/js/files/",
						ext	 = ".trm";

					trama.ajax({
						url: path + el.getAttribute("data-name") + ext,
						onload: function(data) {
							simObj.displayContents(data);
							menuObj.close();
						}
					});
				});
			});

			exportButton.addEventListener("click", this.simObj.exportCurrentScene);
			importButton.addEventListener("change", this.simObj.importScene);

			this.addToggle(controlsClose, this.menuControls);
			this.addToggle(examplesClose, this.menuExamples);

			this.addToggle(controlsToggle, this.menuControls);
			this.addToggle(examplesToggle, this.menuExamples);

			this.addToggle(menuToggle, this.menuList,
				function(obj){
					obj.simObj.setPaused(false);
					obj.hide(obj.menuControls);
					obj.hide(obj.menuExamples);
				},
				function(obj){
					obj.simObj.setPaused(true);
				}
			);

		}

		mobj.prototype.addToggle = function(button, target, hideFunct, showFunct) {
			button.addEventListener("click", this.toogle);
			button.toggleTarget = target;
			button.parent = this;
			button.hideFunct = hideFunct;
			button.showFunct = showFunct;
		};

		mobj.prototype.toogle = function(evt) {
			var target = evt.target.toggleTarget,
				parent = evt.target.parent,
				hideFunct = evt.target.hideFunct,
				showFunct = evt.target.showFunct;
			if(target.style.display === "block") {
				parent.hide(target);
				if(hideFunct) hideFunct(parent);
			} else {
				parent.show(target);
				if(showFunct) showFunct(parent);
			}
			parent.alignMiddle(target);
		};

		mobj.prototype.close = function() {
			this.hide(this.menuList);
			this.hide(this.menuControls);
			this.hide(this.menuExamples);
		};

		mobj.prototype.hide = function(el) {
			el.style.display = "none";
		};

		mobj.prototype.show = function(el) {
			el.style.display = "block";
			this.alignMiddle(el);
		};

		mobj.prototype.alignMiddle = function(el) {
			var elStyle = el.style;
			elStyle.left = "50%";
			elStyle.top  = "50%";

			var marginL = -el.offsetWidth / 2,
				marginT = -el.offsetHeight / 2;

			elStyle.marginLeft = marginL + "px";
			elStyle.marginTop  = marginT + "px";
		};

		return mobj;
	}

	//define globally if it doesn't already exist
	if(typeof(MainMenu) === 'undefined'){
		window.MainMenu = define_MainMenu();
	} else {
		console.log("MainMenu already defined.");
	}
}(window));