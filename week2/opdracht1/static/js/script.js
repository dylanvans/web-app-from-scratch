(function(){ 
// ========================================================
// App 
// ========================================================
var App = function() {
	this.init();
}

App.prototype.init = function() {
	this.getData();
}

App.prototype.getData = function() {
	this.apiKey = 'cca1dc44-8318-4823-b2e8-ae009aa3941a';

	//section=world

	new Request('GET', 'http://content.guardianapis.com/search?show-blocks=all&api-key=' + this.apiKey)
		.then(function() {
			this.data = data.response.results;

			this.mapData(this.data)

			new Routes(this.data);
			new ReadtimeFilter(this.data);
			new ListTemplate(this.data);
		}.bind(this))
		.catch(function(err) {
			console.error('Oeps error: ', err.statusText);
		});
}

App.prototype.mapData = function(data) {
	data.map(function(obj) {
		obj.id = obj.webTitle.replace(/ /g,"_");
	});
}


// ========================================================
// Request 
// ========================================================
var Request = function(type, url) {
	/* Resource request promise: https://stackoverflow.com/questions/30008114/how-do-i-promisify-native-xhr */
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
var Routes = function(data) {
	this.data = data;
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
				setView('view-detail', id);
		    }
		});
	};

	var setView = function(activeViewId, id) {
		if(activeViewId == 'view-detail') {
			this.data.forEach(function(data){
				if(id == data.id) {
					new DetailTemplate(data);
				}
			});
		}

		this.hideClass = 'js-hide';
		this.activeViewEl = activeViewId;
		this.viewEl = document.getElementsByClassName('view');

		for(var i = 0; i < this.viewEl.length; i++) {
			if(this.activeViewEl == this.viewEl[i].id) {
				this.viewEl[i].classList.remove(this.hideClass);
			} else {
				this.viewEl[i].classList.add(this.hideClass);
			}
		}
	}.bind(this) 

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
	this.containerEl = document.querySelector('.container-articles');
	this.template = document.getElementById('list-template').innerHTML;

	this.containerEl.innerHTML = '';

	data.forEach(function(data) {
	    var el = document.createElement('section');

		el.innerHTML = this.template;

	    el.getElementsByClassName('list-title')[0].innerHTML += data.webTitle;
	    el.getElementsByClassName('list-section')[0].innerHTML += data.webPublicationDate;
	   	el.getElementsByClassName('detail-link')[0].href = '#view-detail/' + data.id;

	    this.containerEl.appendChild(el);
	}.bind(this));
}



// ========================================================
// DetailTemplate
// ========================================================
var DetailTemplate = function(data) {
	this.containerEl = document.querySelector('.detail-article');
    this.template = document.getElementById('detail-template').innerHTML;
    this.el = document.createElement('section');

	this.el.innerHTML = this.template;

	this.el.getElementsByClassName('detail-title')[0].innerHTML += data.webTitle;
	this.el.getElementsByClassName('detail-text')[0].innerHTML += data.blocks.body[0].bodyHtml;

	this.containerEl.innerHTML = '';
	this.containerEl.appendChild(this.el);
}



// ========================================================
// ReadtimeFilter 
// ========================================================
var ReadtimeFilter = function(data) {
	this.data = data
	this.formEl = document.querySelector('.readtime-form')
	this.inputEl = document.querySelector('.readtime-input');
	
	this.setReadtimeArticles();

	this.formEl.onsubmit = function(e) {
		e.preventDefault();
		new ListTemplate(this.filterArticlesOnReadtime());
	}.bind(this);
}

ReadtimeFilter.prototype.setReadtimeArticles = function() {
	this.data.map(function(obj) {
		var totalWords = obj.blocks.body[0].bodyHtml.split(' ').length;
		if(totalWords <= 250) {
			obj.readtime = 1; // in minutes
		} else {
			obj.readtime = Math.round(totalWords/250);
		}
	});
}

ReadtimeFilter.prototype.filterArticlesOnReadtime = function() {
	var inputValue = parseInt(this.inputEl.value);
	var data = this.data.filter(enoughTime);

	function enoughTime(obj) {
		return (obj.readtime <= inputValue);
	}

	return data;
}


new App();
}()); 