(() => {
	'use strict';
	// ========================================================
	// App 
	// ========================================================
	class App {
		constructor() {
			this.request = new Request(this);
			this.router = new Router(this);
			this.views = new Views(this);
			this.readtimefilter = new ReadtimeFilter(this);
			this.analyseText = new AnalyseText(this);

			// Dom elements
			this.loaderEl = document.querySelector('.container-loader');
		}

		init() {
			this.getData();
			this.router.init();
		}

		getData(categorie) {
			const apiKey = 'cca1dc44-8318-4823-b2e8-ae009aa3941a';
			const section = categorie ? categorie : 'extra'; // query= 'section=''
			const url = `https://content.guardianapis.com/search?section=${section}&show-blocks=all&api-key=${apiKey}`;

			// When the data is received fire other functions that uses this data
			const callback = function(data) {
				this.data = data.response.results;
				this.views.listTemplate(this.data);
				this.readtimefilter.setReadtime();
			}.bind(this);

			this.request.make('GET', url, callback)
		}
	}

	// ========================================================
	// Request 
	// ========================================================
	class Request {
		constructor(app) {
			this.app = app
			this.activeLoaderClass = 'active-loader';
		}

		make(type, url, callback) {
			this.app.loaderEl.classList.add(this.activeLoaderClass);

			const httpRequest = new XMLHttpRequest();

			httpRequest.onload = () => {
				if (httpRequest.readyState == XMLHttpRequest.DONE) {
					if (httpRequest.status >= 200 && httpRequest.status < 400) {
						// Parse the responseText to JSON
						const data = JSON.parse(httpRequest.responseText);

						this.app.loaderEl.classList.remove(this.activeLoaderClass);
						callback(data);
					} else {
						// console.error(err);
					}
				}
			}

			httpRequest.onerror = (err) => {
				console.error(err);
			}

			httpRequest.open(type, url, true); // true -> async
			httpRequest.send();
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
			// Sets correct view when the hash changes
			routie({
			    'view-home': function() {
			    	app.views.set(this.path);
			    },
			    'view-list': function() {
			    	app.views.set(this.path);
			    },
			    'view-list/:categorie': function(categorie) {
			    	app.getData(categorie);
			    	app.views.listTemplate(app.data)
			    	app.views.set('view-list');
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
			// Set view template for the article that is navigated to
			if(activeViewId == 'view-detail') {
				this.app.data.forEach(function(data){
					if(id == data.blocks.body[0].id) {
						this.app.analyseText.getAnalysis(data);
					}
				}.bind(this));
			}

			// Toggle the hideclass so the right views are hidden
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
				el.classList.add('media-item');
				const linkEl = el.querySelector('.detail-link');
				const headerEl = el.querySelector('.list-title');

			    headerEl.innerHTML += article.webTitle;
			   	linkEl.href = `#view-detail/${article.blocks.body[0].id}`;

			   	if(article.blocks.main) { // Some articles come without a main object
			   	   	el.querySelector('.list-figure').innerHTML += article.blocks.main.bodyHtml;
			   	}
			  
			    containerEl.appendChild(el);
			}.bind(this));
		}

		detailTemplate(article) {
			const containerEl = document.querySelector('.detail-article');
		    const template = document.getElementById('detail-template').innerHTML;
		    const el = document.createElement('section');
		    el.classList.add('detail-article');

			el.innerHTML = template; // Fil the element with the template elements
			el.querySelector('.detail-title').innerHTML += article.webTitle;
			el.querySelector('.detail-text').innerHTML += article.blocks.body[0].bodyHtml;

			if(article.blocks.main) { // Some articles come without a main object
				el.querySelector('.detail-figure').innerHTML += article.blocks.main.bodyHtml;
			}

			// Analysis templating
			el.querySelector('.emotion-anger span').innerHTML = article.analysis.docEmotions.anger;
			el.querySelector('.emotion-disgust span').innerHTML = article.analysis.docEmotions.disgust;
			el.querySelector('.emotion-fear span').innerHTML = article.analysis.docEmotions.fear;
			el.querySelector('.emotion-joy span').innerHTML = article.analysis.docEmotions.joy;
			el.querySelector('.emotion-sadness span').innerHTML = article.analysis.docEmotions.sadness;

			el.querySelector('.article-sentiment').innerHTML = article.analysis.docSentiment.type;

			for (let i = 0; i < 3; i++) { // Analysis top 3's
				const entitieEl =  el.querySelector('.list-article-entitie'+ (i+1));
				const conceptEl = el.querySelector('.list-article-concept' + (i+1));

				conceptEl.innerHTML += article.analysis.concepts[i].text;

				if(article.analysis.entities[i].disambiguated) {
					if(article.analysis.entities[i].disambiguated.dbpedia) {
						const linkEl = document.createElement('a');

						linkEl.href = article.analysis.entities[i].disambiguated.dbpedia;
						linkEl.innerHTML += article.analysis.entities[i].text;
						entitieEl.appendChild(linkEl);
					} else {
						entitieEl.innerHTML += article.analysis.entities[i].text;
					}
				} else {
					entitieEl.innerHTML += article.analysis.entities[i].text;
				}
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
				e.preventDefault(); // Prevent from really submitting the form
				this.app.views.listTemplate(this.filterOnReadtime()); // Set template again for the filtered articles
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

		getAnalysis(data) {
			const apiKey = '48b969b8b495acea94df04523e22ba22e84ab262';
			const extract = 'concepts,doc-emotion,entities,doc-sentiment';
			const maxRetrieve = 20;

			const callback = function(results) {
				data.analysis = results;
				console.log(data)
				this.app.views.detailTemplate(data);
			}.bind(this);

			this.app.request.make('GET', `https://gateway-a.watsonplatform.net/calls/url/URLGetCombinedData?quotations=1&maxRetrieve=${maxRetrieve}&extract=${extract}&apikey=${apiKey}&outputMode=json&url=${data.webUrl}`, callback);
		}
	}

	const app = new App();
	app.init();
})();