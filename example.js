'use strict'

let Traverse = require('./index');
let scraper = new Traverse();

scraper.on('scrape:product', ($, scraper, entry, options) => {


    // GET THE DATA.
    let title = $('#productTitle').text().trim();

    console.log('');
    console.log(`Product: ${title}`);
    console.log('');





    

    // Queue the other product links for scraping.
    //// Find the product links.
    let products = $('#sponsored-products-dp_feature_div li.a-carousel-card .sp_dpOffer > a');
    
    console.log(`--- Found ${products.length} more products.`);




    //// Push the links to the queue.
    products.each((i, product) => {
        let url = 'https://www.amazon.com' + $(product).attr('href');

        scraper.push({
            url: url,
            tag: 'product'
        });
    });


});

scraper.push({
    url: 'https://www.amazon.com/AmazonBasics-Apple-Certified-Lightning-Cable/dp/B010S9N6OO/',
    tag: 'product'
});

scraper.start();