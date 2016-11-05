var PriorityQueue = require('js-priority-queue');
var Request = require('request-promise');
var Cheerio = require('cheerio');

class Traverse {
  constructor() {
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

    this.__processor = function ($, traverse, entry, options, state) {
      throw new Error(`Must define a processor.`);
    };

    this.__middleware = function (entry, state) {
      return {
        url: entry.url
      }
    };

    this.__scraper = function (options, entry, success, failiure, finish) {
      console.log(entry);

      Request(options).then(function (data) {
        let usable = Cheerio.load(data);
        success(usable, data, options, entry);
      }).catch(function(error) {
        failiure(error, options, entry);
      }).finally(function () {
        finish(options, entry);
      });
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
  }

  state(obj) {
    this.state = obj;
  }

  perMinute(number) {
    if (number*1 <= 0) {
      throw new Error(`Requests per minute must be a positive numeric value.`);
    }

    this.__rpm = number*1;
  }

  concurrent(number) {
    if (number*1 <= 0) {
      throw new Error(`Requests per minute must be a positive numeric value.`);
    }

    this.__concurrent = number*1;
  }

  delay(milisecs) {
    this.__delay = milisecs*1;
  }

  middleware(func) {
    if (!(func instanceof Function)) {
      throw new Error(`Middleware must be a function.`);
    }

    this.__middleware = func;
  }

  processor(func) {
    if (!(func instanceof Function)) {
      throw new Error(`Processor must be a function.`);
    }

    this.__processor = func;
  }

  __startRequest() {
    if (!this.__queue.length) {
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

    this.__scraper(options, entry, (usable, data, options, entry) => { // Success

      this.__processor(usable, this, entry, options, this.state);

    }, (error, options, entry) => { // Fail

      this.__fails += 1;

    }, (options, entry) => { // Finish

      this.__currently_running -= 1;
      this.__finished += 1;
      this.__startRequest();

    });

    this.__delayed_till = now + this.__delay;

    setTimeout(() => {
      this.__startRequest();
    }, this.__delay);
  }

  start() {
    this.__start_time = (new Date).getTime();
    this.__startRequest();
  }
}

module.exports = Traverse;
