(() => {
	'use strict';
	// ========================================================
	// App 
	// ========================================================
	class App {
		constructor() {
			this.request = new Request();
			this.router = new Router(this);
			this.views = new Views(this);
			this.readtimefilter = new ReadtimeFilter(this);
			this.analyseText = new AnalyseText(this);
		}

		init() {
			this.getData();
		}

		getData() {
			const apiKey = 'cca1dc44-8318-4823-b2e8-ae009aa3941a';
			const section = 'film';
			const url = `https://content.guardianapis.com/search?section=${section}&show-blocks=all&api-key=${apiKey}`;

			this.request.make('GET', url)
				.then(function(data) {
					this.data = data.response.results;
					this.analyseText.getAnalysis();
					this.views.listTemplate(this.data);
					this.router.init();
					this.readtimefilter.setReadtime();
				}.bind(this))  
				// .catch((err) => { console.error(`Oeps error: ${err}`); });
		}
	}

	// ========================================================
	// Request 
	// ========================================================
	class Request {
		make(type, url) {
			/* Resource request promise: https://stackoverflow.com/questions/30008114/how-do-i-promisify-native-xhr */
			return new Promise((resolve, reject) => {
				const httpRequest = new XMLHttpRequest();

				httpRequest.onload = () => {
					if (httpRequest.readyState == XMLHttpRequest.DONE) {
						if (httpRequest.status >= 200 && httpRequest.status < 400) {
							const data = JSON.parse(httpRequest.responseText);
							resolve(data);
						} else {
							reject({
					        	status: this.status,
					        	statusText: httpRequest.statusText
					        });
						}
					}
				}

				httpRequest.onerror = () => {
					reject({
						status: this.status,
						statusText: httpRequest.statusText
					});
				}

				httpRequest.open(type, url, true); // true -> async
				httpRequest.send();
			});
		}
	}

	// ========================================================
	// Router 
	// ========================================================
	class Router {
		constructor(app) {
			this.app = app;
		}

		init() {
			routie({
			    'view-home': function() {
			    	app.views.set(this.path);
			    },
			    'view-list': function() {
			    	app.views.set(this.path);
			    },
			    'view-detail/:id': function(id) {
			    	app.views.set('view-detail', id);
			    }
			});
		}
	}

	// ========================================================
	// Views 
	// ========================================================
	class Views {
		constructor(app) {
			this.app = app;
			this.hideClass = 'js-hide';
			this.viewEl = document.querySelectorAll('.view');
		}

		set(activeViewId, id) {
			if(activeViewId == 'view-detail') {
				this.app.data.forEach(function(data){
					if(id == data.blocks.body[0].id) { this.detailTemplate(data); }
				}.bind(this));
			}

			for(var i = 0; i < this.viewEl.length; i++) {
				this.viewEl[i].id == activeViewId ? 
					this.viewEl[i].classList.remove(this.hideClass) :
					this.viewEl[i].classList.add(this.hideClass);
			}
		}

		listTemplate(data) {
			const containerEl = document.querySelector('.container-articles');
			const template = document.getElementById('list-template').innerHTML;

			containerEl.innerHTML = ''; //Empty html, so the old elements are removed

			data.forEach(function(article) {
				const el = document.createElement('section');

				el.innerHTML = template; // Fil the element with the template elements
			    el.querySelector('.list-title').innerHTML += article.webTitle;
			   	el.querySelector('.detail-link').href = `#view-detail/${article.blocks.body[0].id}`;

			   	if(article.blocks.main) { // Some articles come without a main object
			   	   	el.querySelector('.list-figure').innerHTML += article.blocks.main.bodyHtml;
			   	}
			   	// el.querySelector('.list-article-concept1').innerHTML += article.analysis.concepts[0].text;
			   	// el.querySelector('.list-article-concept2').innerHTML += article.analysis.concepts[0].text;

			    containerEl.appendChild(el);
			}.bind(this));
		}

		detailTemplate(article) {
			const containerEl = document.querySelector('.detail-article');
		    const template = document.getElementById('detail-template').innerHTML;
		    const el = document.createElement('section');

			el.innerHTML = template; // Fil the element with the template elements
			el.querySelector('.detail-title').innerHTML += article.webTitle;
			el.querySelector('.detail-text').innerHTML += article.blocks.body[0].bodyHtml;

			if(article.blocks.main) { // Some articles come without a main object
				el.querySelector('.detail-figure').innerHTML += article.blocks.main.bodyHtml;
			}

			containerEl.innerHTML = ''; //Empty html, so the old element is removed
			containerEl.appendChild(el);
		}
	}

	// ========================================================
	// ReadtimeFilter 
	// ========================================================
	class ReadtimeFilter {
		constructor(app) {
			this.app = app;
			this.formEl = document.querySelector('.readtime-form');
			this.inputEl = document.querySelector('.readtime-input');

			this.formEl.onsubmit = function(e) {
				e.preventDefault();
				this.app.views.listTemplate(this.filterOnReadtime());
			}.bind(this);
		}

		setReadtime() {
			this.app.data.map((obj) => {
				const totalWords = obj.blocks.body[0].bodyHtml.split(' ').length; // Make array of all words and get length
				const averageReadspeed = 230; // words per minute

				// Readtime in minutes
				totalWords <= averageReadspeed ? obj.readtime = 1 : obj.readtime = Math.round(totalWords/averageReadspeed);
			});
		}

		filterOnReadtime() {
			const inputValue = parseInt(this.inputEl.value)
			const data = this.app.data.filter(enoughTime)

			function enoughTime(obj) {
				return (obj.readtime <= inputValue);
			}
			return data;
		}
	}

	// ========================================================
	// AnalyseText 
	// ========================================================
	class AnalyseText {
		constructor(app) {
			this.app = app;
		}

		getAnalysis() {
			const apiKey = '48b969b8b495acea94df04523e22ba22e84ab262';
			const extract = 'concepts,doc-emotion,entities,doc-sentiment';
			const maxRetrieve = 20;

			this.app.data.map(function(obj) {
				this.app.request.make('GET', `https://gateway-a.watsonplatform.net/calls/url/URLGetCombinedData?quotations=1&maxRetrieve=${maxRetrieve}&extract=${extract}&apikey=${apiKey}&outputMode=json&url=${obj.webUrl}`)
					.then(function(data){
						obj.analysis = data;
					}.bind(this))
					.catch(function(err) {						
						console.error(err)
					});
			}.bind(this));
		}
	}

	const app = new App();
	app.init();
})();