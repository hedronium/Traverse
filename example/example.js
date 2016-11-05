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

traverse.on('scrape:index', function ($, traverse) {
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
