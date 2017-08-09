var ajaxOpen = false;

/////////////////////////
//// DRAG AND SCROLL ////
/////////////////////////
// fonte: http://stackoverflow.com/questions/4744261/how-to-scroll-a-webpage-by-clicking-and-dragging-on-the-body-like-touch-device

/*
var curYPos = 0,
	curXPos = 0,
	curDown = false;

$(document).on("mousemove", function (event) {
	if (curDown === true) {
		$(document).scrollTop(parseInt($(document).scrollTop() + (curYPos - event.pageY)));
		$(document).scrollLeft(parseInt($(document).scrollLeft() + (curXPos - event.pageX)));
	}
}).on("mousedown", function (e) {
	if(!ajaxOpen) {
		e.preventDefault();
		curDown = true;
		curYPos = e.pageY;
		curXPos = e.pageX;
	}
});

$(window).on("mouseup", function (e) {
	curDown = false;
});

// Stop dragging if mouse leaves the window (Not essential, can be removed without negative effects)
$(window).on("mouseout", function (e) {
	curDown = false;
});
*/
//// FIM DRAG AND SCROLL ////


Math.map = function(x, in_min, in_max, out_min, out_max) {
	return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}


Math.constrain = function(x, min, max) {
	return ((x) < (min) ? (min) : ((x) > (max) ? (max) : (x)));
}

$(document).ready(function(){

	// ljs.initHighlightingOnLoad(); // Highlight code
	$('pre code').each(function(i, block) {
		hljs.highlightBlock(block);
	});

	/////////////////////
	//// MENU TOGGLE ////
	/////////////////////
	$('#nav-main .nav-content').hide();
	$('#nav-main .toggle').click(function(event){
		event.preventDefault();
		$('#nav-main .nav-content').animate({width:'toggle'}, 350);
	});


	//////////////////////
	//// SERVO SLIDER ////
	//////////////////////

	$('#servo-animation-counter').html('0°');
	$('#servo-slider-counter').html('0');

    $('#servo-slider').slider({
		value: 0,
		min: 0,
		max: 1023,
		step: 1,
		slide: function( event, ui ) {

			var step = Math.round(Math.map(ui.value, 0, 1023, 19, 1));
			var newYPos = step == 19 ? -120 : step * (-120);
			$('#servo-animation .servo-horn').css('backgroundPosition', '0 ' + newYPos + 'px');

			step = Math.round(Math.map(ui.value, 0, 1023, 1, 19));
			$('#servo-animation-counter').html(((step - 1) * 10) + '°');
			$('#servo-slider-counter').html(ui.value);
		}
  	});


	////////////////////////////
	//// VIDEO PROGRESS BAR ////
	////////////////////////////

	$('#matriz video').parent().each(function(){
		$(this).append('<div class="progress-wrapper"><div class="progress-bar"></div></div>');

		var $video = $(this).find('video');
		var $progressbar = $(this).find('.progress-bar');

		$video.bind('timeupdate', videoTimeUpdateHandler);

		function videoTimeUpdateHandler(e) {
			var video = $video.get(0);
			$progressbar.width(Math.floor(100 * video.currentTime / video.duration) + '%');
		}
	});


	///////////////////////////////////////////
	//// HIGHLIGHT TABLE HEADER PLAY VIDEO ////
	///////////////////////////////////////////
	
	// $('video').each(function(){$(this).get(0).play();});

	$('#matriz td video').parent()
		.mouseenter(function(event){
			$(this).parent().find('th').addClass('highlight');
			$(this).parent().parent().find('tr:first th').eq($(this).index()).addClass('highlight');
			$(this).find('video').get(0).play();
		})
		.mouseleave(function(event){
			$(this).parent().find('th').removeClass('highlight');
			$(this).parent().parent().find('tr:first th').eq($(this).index()).removeClass('highlight');
			$(this).find('video').get(0).pause();
		});


	//////////////
	//// AJAX ////
	//////////////

	$('body').append('<section id="ajax"><div class="loader"></div><nav id="ajax-menu"><a class="close" href="javascript:void(0);">&#215;</a></nav><article id="ajax-content"></article></section>');

	$('a.ajax').click(function(event){
		event.preventDefault();
		var url = $(this).attr('href');
		$('body').addClass('fixed-background');
		$('#ajax').fadeIn('fast');
		$('#ajax .loader').show();

		$.ajax({
			url: url,
		}).done(function(data){
			ajaxOpen = true;
			$('#ajax .loader').hide();
			$('#ajax-content').hide().html(data).fadeIn();

			// CODE HIGHLIGHT
			$('#ajax-content pre code').each(function(i, block) {
				hljs.highlightBlock(block);
			});
		});
	});
	$('#ajax-menu a.close').click(function(event){
		event.preventDefault();
		ajaxClose();
	});





	// simulator
	var directory_root = document.location.hostname == "site" ? 'http://site' : 'https://estevamgomes.github.io/mestrado';

	var sim1;

	var scenesPath = directory_root + "/js/files/",
		ext	 = ".trm";

	var assetsPath = directory_root + "/img/";
	trama.loadAssets(assetsPath);

	var divId = "simulator-simples";
	var scene = document.getElementById(divId).getAttribute("data-scene");

	trama.ajax({
		url: scenesPath + scene + ext,
		onload: function(data) {
			sim1 = new trama.Simulator({
				scene: data,
				divId: divId,
				width: "fit",
				height: 350,
				scenesPath: scenesPath // saved scene path
				// mainmenu: false,
				// compmenu: false,
			});
		}
	});

});


//////////////
//// AJAX ////
//////////////

function ajaxClose() {
	$('body').removeClass('fixed-background');
	$('#ajax').hide();
	$('#ajax-content').empty();
	ajaxOpen = false;
}

