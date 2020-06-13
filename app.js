const http = require('http');
const transfer = require('./transfer');

const hostname = '127.0.0.1';
const port = 3000;

let web3 = null;
let contract = null;

const server = http.createServer((req, res) => {
  let body = [];
  req.on('error', (err) => {
    res.statusCode = 500;
    res.end();
    console.error(err);
  }).on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    body = JSON.parse(Buffer.concat(body).toString());
    const { recipient, amount } = body;
    transfer.transfer(web3, contract, recipient, amount);
  });
  res.statusCode = 200;
  res.end();
});

async function init(){
  web3 = await transfer.setUpWeb3();
  contract = await transfer.setupContract();
}

server.listen(port, hostname, () => {
  init();
  console.log(`Server running at http://${hostname}:${port}/`);
});