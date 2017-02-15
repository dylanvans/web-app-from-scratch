(function(){ 
// ========================================================
// App 
// ========================================================
var App = function() {
	this.init();
}

App.prototype.init = function() {
	this.getData();
	new Routes();
}

App.prototype.getData = function() {
	var apiKey = 'cca1dc44-8318-4823-b2e8-ae009aa3941a';
	new Request('GET', 'http://content.guardianapis.com/search?section=world&show-blocks=all&api-key=' + apiKey)
		.then(function() {
			this.data = data.response.results;

			this.data.map(function(obj) {
				obj.id = obj.webTitle.replace(/ /g,"_");
			});

			new ListTemplate(this.data);
		})
		.catch(function(err) {
			console.error('Oeps error: ', err.statusText);
		});
}



// ========================================================
// Request 
// ========================================================
var Request = function(type, url) {
	/* Resource xhr promise: https://stackoverflow.com/questions/30008114/how-do-i-promisify-native-xhr */
	return new Promise(function (resolve, reject) {
		var httpRequest = new XMLHttpRequest();

		httpRequest.onload = function() {
			if (httpRequest.readyState == XMLHttpRequest.DONE) {
				if (httpRequest.status >= 200 && httpRequest.status < 400) {
					data = JSON.parse(httpRequest.responseText);
					resolve(httpRequest.response);
				} else {
					reject({
			        	status: this.status,
			        	statusText: httpRequest.statusText
			        });
					console.log('Server reached, but returned error');
				}
			}
		}

		httpRequest.onerror = function() {
			reject({
				status: this.status,
				statusText: httpRequest.statusText
			});
		}

		httpRequest.open(type, url);
		httpRequest.send();
	});
}



// ========================================================
// Routes 
// ========================================================
var Routes = function() {
	this.init();
}

Routes.prototype.init = function() {
	window.onhashchange = function() {
		routie({
		    'view-home': function() {
		    	setView(this.path);
		    },
		    'view-list': function() {
		    	setView(this.path);
		    },
		    'view-detail/:id': function(id) {
				setView('view-detail');
				data.forEach(function(data){
					if(id == data.id) {
						new DetailTemplate(data);
					}
				});
		    }
		});
	}

	var setView = function(activeViewId) {
		this.hideClass = 'js-hide';
		this.activeViewEl = activeViewId;
		this.viewEl = document.getElementsByClassName('view');

		for (var i = 0; i < this.viewEl.length; i++) {
			if(this.activeViewEl == this.viewEl[i].id) {
				this.viewEl[i].classList.remove(this.hideClass);
			} else {
				this.viewEl[i].classList.add(this.hideClass);
			}
		}
	} 

	// If there is no hashchange, set the view
	if(!window.location.hash) {
		setView('view-home');
	} else {
		setView(window.location.hash.split('#')[1]);
	}
}



// ========================================================
// ListTemplate
// ========================================================
var ListTemplate = function(data) {
	data.forEach(function(data) {
	    var template = document.getElementById('list-template').innerHTML;
	    var el = document.createElement('section');

		el.innerHTML = template;

	    el.getElementsByClassName('list-title')[0].innerHTML += data.webTitle;
	    el.getElementsByClassName('list-section')[0].innerHTML += data.webPublicationDate;
	   	el.getElementsByClassName('detail-link')[0].href = '#view-detail/' + data.id;
	   	el.getElementsByClassName('detail-link')[0].innerHTML = data.webTitle;

	    document.querySelector('.container-articles').appendChild(el);
	});
}



// ========================================================
// DetailTemplate
// ========================================================
var DetailTemplate = function(data) {
	var templateContainer = document.querySelector('.detail-article');
    var template = document.getElementById('detail-template').innerHTML;
    var el = document.createElement('section');

	el.innerHTML = template;

	el.getElementsByClassName('detail-title')[0].innerHTML += data.webTitle;
	el.getElementsByClassName('detail-text')[0].innerHTML += data.blocks.body[0].bodyHtml;

	templateContainer.innerHTML = '';
	templateContainer.appendChild(el);
}

new App();
}()); 