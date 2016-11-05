var url = require('url');
var Traverse = require('../src/Traverse.js');

var list = [];

var traverse = new Traverse();

var index = 'http://localhost:8060/index.htm';
traverse.url(index, 1, 'index');
traverse.perMinute(60);
traverse.delay(500);
traverse.concurrent(1);
traverse.processor(function ($, traverse, entry) {

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
});

traverse.start();


setTimeout(() => {
  console.log(list.sort((a,b) => { return a-b }));
}, 8000);
