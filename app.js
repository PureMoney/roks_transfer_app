const http = require('http');

const contract = require('./contract_abi');
const CONTRACT_ABI = contract.contract;

const properties = require('./properties');
const HOST_NAME = properties.hostname;
const HOST_PORT = properties.port;
const CONTRACT_ADDRESS = properties.contract_address;
const NETWORK_PROVIDER = properties.network_provider;
const ROKS_SRC_ADDRESS = properties.roks_src_address;
const ROKS_SRC_PRIV_KEY = properties.roks_src_priv_key;
const GAS_LIMIT = properties.gas_limit;
const NETWORK = properties.network;

const RoksTransfer = require('./transfer').RoksTransfer;
const roksTransfer = new RoksTransfer(CONTRACT_ABI, NETWORK, NETWORK_PROVIDER, CONTRACT_ADDRESS, ROKS_SRC_ADDRESS, ROKS_SRC_PRIV_KEY, GAS_LIMIT);

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
    roksTransfer.transfer(recipient, amount);
  });
  res.statusCode = 200;
  res.end();
});

server.listen(HOST_PORT, HOST_NAME, () => {
  roksTransfer.init();
  console.log(`Server running at http://${HOST_NAME}:${HOST_PORT}/`);
});