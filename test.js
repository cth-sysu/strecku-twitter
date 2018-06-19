const request = require('request-promise');
const config = require('config');

require('./server');

request({
  uri: 'https://strecku.festu.se/api/v1/purchases?limit=1',
  headers: { Authorization: config.get('auth.strecku') },
  json: true
})
.then(({ purchases }) => purchases[0])
.then(purchase => request({
  method: 'POST',
  uri: 'http://localhost:5101/purchases?dryrun=true',
  body: purchase,
  json: true
}))
.then(() => process.exit(0))
.catch(err => process.exit(1));
