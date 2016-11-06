const Request = require('request-promise');
const Cheerio = require('cheerio');

module.exports = function (options, entry, success, failiure, finish) {
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
