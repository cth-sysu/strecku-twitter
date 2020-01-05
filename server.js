
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

const Twitter = require('twitter');
const express = require('express');
const request = require('request-promise');
const bodyParser = require('body-parser');
const config = require('config');

const credentials = {
  consumer_key: config.get('consumer_key'),
  consumer_secret: config.get('consumer_secret'),
  access_token_key: config.get('access_token_key'),
  access_token_secret: config.get('access_token_secret')
};

const client = new Twitter(credentials);

module.exports = express()
.use(bodyParser.json())
.use(bodyParser.urlencoded({extended: true}))
.post('/purchases', (req, res, next) => {
  const purchase = req.body;
  if (!purchase.product) {
    return res.status(400).end();
  }
  const dryrun = !!req.query.dryrun;
  const time = new Date(purchase.time);
  const hh = ('0' + time.getHours()).substr(-2);
  const mm = ('0' + time.getMinutes()).substr(-2);
  Promise.all([
    // OrvU name (fallback to strecku user name)
    request({
      uri: `https://festu.se/api/members/name?mail=${purchase.user.email}`,
      headers: { authorization: config.get('auth.festu') },
      json: true
    })
    .catch(() => purchase.user),
    // Get purchase count for user
    request({
      uri: `https://strecku.festu.se/api/v1/purchases/count?user=${purchase.user._id}&product=${purchase.product._id}`,
      headers: { Authorization: config.get('auth.strecku') },
      json: true
    })
  ])
  .then(([{ name }, { count }]) => `${name} bought a ${purchase.product.name} #${count} (${hh}:${mm})`)
  .then(status => {
    console.log(status);
    if (!dryrun) {
      client.post('statuses/update', { status });
    }
    res.end();
  })
  .catch(err => res.status(503).end());
})
.listen(5101, 'localhost');
