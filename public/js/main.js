$(document).ready(function(){
	$('.slide').click(function(){
		if($(this).hasClass('i1')){
			$('.i1').css("display", "none");
			$('.i2').css("display", "block");
		} else if($(this).hasClass('i2')){
			$('.i2').css("display", "none");
			$('.i3').css("display", "block");
		} else if($(this).hasClass('i3')){
			$('.i3').css("display", "none");
			$('.i1').css("display", "block");
		} 
	})
});