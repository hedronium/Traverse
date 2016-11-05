const EventEmitter = require('events');
const PriorityQueue = require('js-priority-queue');
const Request = require('request-promise');
const Cheerio = require('cheerio');

class Traverse extends EventEmitter {
	constructor() {
		super();

		this.__queue = null;
		this.__rpm = 60;
		this.__concurrent = 2;
		this.__delay = 0;

		this.__currently_running = 0;
		this.__finished = 0;

		this.__requests_this_minute = 0;
		this.__last_minute = 0;
		this.__delayed_till = 0;
		this.__fails = 0;
		this.__start_time = false;
		this.__paused = false;
		this.__requests = [];
		this.__scheduled_till = 0;

		this.__middleware = function (entry, state) {
			return {
				url: entry.url
			}
		};

		this.__scraper = function (options, entry, success, failiure, finish) {
			console.log(entry);

			let req = Request(options).then(function (data) {
				let usable = Cheerio.load(data);
				success(usable, data, options, entry);
			}).catch(function(error) {
				failiure(error, options, entry);
			}).finally(function () {
				finish(options, entry);
			});

			return req;
		};

		this.__fail = function (error, options, entry) {

		};

		this.state = {};

		this.__queue = new PriorityQueue({
			strategy: PriorityQueue.BinaryHeapStrategy,
			comparator: function(a, b) {
				return b.priority - a.priority;
			}
		});
	}

	url(url, priority = 0, data = {}) {
		if (typeof url !== 'string') {
			throw new Error('URL must be a string');
		}

		this.__queue.queue({url, priority: priority*1, data});

		if (this.__start_time !== false) {
			this.__startRequest();
		}

		return this;
	}

	state(obj) {
		this.state = obj;

		return this;
	}

	perMinute(number) {
		if (number*1 <= 0) {
			throw new Error(`Requests per minute must be a positive numeric value.`);
		}

		this.__rpm = number*1;

		return this;
	}

	concurrent(number) {
		if (number*1 <= 0) {
			throw new Error(`Requests per minute must be a positive numeric value.`);
		}

		this.__concurrent = number*1;

		return this;
	}

	delay(milisecs) {
		this.__delay = milisecs*1;

		return this;
	}

	middleware(func) {
		if (!(func instanceof Function)) {
			throw new Error(`Middleware must be a function.`);
		}

		this.__middleware = func;

		return this;
	}

	__startRequest() {
		if (!this.__queue.length || this.__paused) {
			return;
		}

		if (this.__currently_running >= this.__concurrent) {
			return;
		}

		let now = (new Date).getTime();
		let milis = now - this.__start_time;
		let mins = milis/60000;
		let this_min = Math.floor(mins);

		if (this_min === this.__last_minute) {
			if (this.__requests_this_minute >= this.__rpm) {
				setTimeout(() => {
					this.__startRequest();
				}, 60000 - milis%60000 + 20);

				return;
			}
		} else {
			this.__last_minute = this_min;
			this.__requests_this_minute = 0;
		}

		if (now < this.__delayed_till) {
			return;
		}

		let entry = this.__queue.dequeue();
		let options = this.__middleware(entry, this.state);

		this.__currently_running += 1;
		this.__requests_this_minute += 1;

		let req = this.__scraper(options, entry, (usable, data, options, entry) => { // Success

			this.emit('scrape', usable, this, entry, options, this.state);

		}, (error, options, entry) => { // Fail

			this.__fails += 1;

		}, (options, entry) => { // Finish

			this.__requests = this.__requests.filter((r) => {
				return r !== req;
			});

			this.__currently_running -= 1;
			this.__finished += 1;
			this.__startRequest();

			if (this.__currently_running == 0 && this.__queue.length == 0 && (new Date).getTime() > this.__scheduled_till) {
				this.emit('done');
			}
		});

		this.__requests.push(req);

		this.__delayed_till = now + this.__delay;

		setTimeout(() => {
			this.__startRequest();
		}, this.__delay);
	}

	start() {
		if (!this.__start_time) {
			this.__start_time = (new Date).getTime();
		}

		this.__paused = false;
		this.__startRequest();
	}

	pause() {
		this.__paused = true;
	}

	cancel() {
		for (let req of this.__requests) {
			req.cancel();
		}

		this.__requests = [];
	}
}

module.exports = Traverse;
