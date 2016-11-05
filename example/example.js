var url = require('url');
var Traverse = require('../src/Traverse.js');

var list = [];

var traverse = new Traverse();

var index = 'http://localhost:8060/index.htm';

traverse.url(index, 1, 'index')
.perMinute(60)
.delay(500)
.concurrent(3);

traverse.on('scrape', function ($, traverse, entry) {

	if (entry.data === 'index') {

		$('.pagination > a').each((i, anchor) => {
			anchor = $(anchor);

			if (anchor.html() != 'next') {
				return;
			}

			let href = anchor.attr('href');

			if (href) {
				traverse.url(
					url.resolve(index, href), 1, 'index'
				);
			}
		});

		$('.pages-list a').each((i, anchor) => {
			anchor = $(anchor);

			let href = anchor.attr('href');

			if (href) {
				traverse.url(
					url.resolve(index, href)
				);
			}
		});

	} else {
		$('.num-list > li').each((i, item) => {
			list.push(parseInt($(item).html()));
		});
	}

	traverse.pause();
});

traverse.start();

traverse.on('done', () => {
	console.log('DONE');
});

// setInterval(() => {
// 	console.log(traverse.__requests.length);
// }, 1000);
