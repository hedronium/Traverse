var url = require('url');
var Traverse = require('../src/Traverse.js');

var list = [];

var traverse = new Traverse();

var index = 'http://localhost:8060/index.htm';

traverse.push({
	url: index,
	tag: 'index'
}).perMinute(60).delay(200).concurrent(3);

traverse.on('scrape', ($) => {
	console.log(`Scraped ${$('title').html()}.`);
});

traverse.on('scrape:index', ($, traverse) => {
	$('.pages-list a').each((i, anchor) => {
		anchor = $(anchor);

		let href = anchor.attr('href');

		if (href) {
			traverse.push({
				url: url.resolve(index, href)
			});
		}
	});

	$('.pagination > a').each((i, anchor) => {
		anchor = $(anchor);

		if (anchor.html() != 'next') {
			return;
		}

		let href = anchor.attr('href');

		if (href) {
			traverse.push({
				url: url.resolve(index, href),
				priority: 1,
				tag: 'index'
			});
		}
	});
});

traverse.on('scrape:default', ($, traverse) => {
	$('.num-list > li').each((i, item) => {
		list.push(parseInt($(item).html()));
	});
});

traverse.push({
	url: 'http://localhost:8060/potato.htm'
});

traverse.timeout({
	url: 'http://localhost:8060/'
}, 6000);

traverse.on('fail', (error, entry) => {
	console.log(`Error while scraping ${entry.url}.`);
});

traverse.on('ended', (data) => {
	console.log(`------------------------`);
	console.log(`Scraped ${data.finished} pages.`);
	console.log(`------------------------`);
	console.log('Scraped Numbers: ');
	console.log(...list.sort((a, b) => {
		return a-b;
	}));
});

traverse.start();
