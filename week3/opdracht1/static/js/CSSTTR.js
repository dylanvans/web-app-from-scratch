(function(){
	var inputEl = document.querySelectorAll('.login-form input');
	inputEl.forEach(function(el) {
		el.oninput = function() {
			el.setAttribute('data-empty', !el.value);
		}
	});
	
}()); 