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
const ROKS_GAS_LIMIT = properties.roks_gas_limit;
const NETWORK = properties.network;

const ETH_SRC_ADDRESS = properties.eth_src_address;
const ETH_SRC_PRIV_KEY = properties.eth_src_priv_key;
const ETH_GAS_LIMIT = properties.roks_gas_limit;

const NONCE_HELPER = require('./index').nonce_helper;

const RoksTransfer = require('./roks_transfer').RoksTransfer;
const EthTransfer = require('./eth_transfer').EthTransfer;
const roksTransfer = new RoksTransfer(CONTRACT_ABI, NETWORK, NETWORK_PROVIDER, CONTRACT_ADDRESS, ROKS_SRC_ADDRESS, ROKS_SRC_PRIV_KEY, ROKS_GAS_LIMIT, ROKS_SRC_ADDRESS === ETH_SRC_ADDRESS, NONCE_HELPER);
const ethTransfer = new EthTransfer(NETWORK, NETWORK_PROVIDER, CONTRACT_ADDRESS, ETH_SRC_ADDRESS, ETH_SRC_PRIV_KEY, ETH_GAS_LIMIT, ROKS_SRC_ADDRESS === ETH_SRC_ADDRESS, NONCE_HELPER);

const server = http.createServer((req, res) => {
    let body = [];
    req.on('error', (err) => {
      res.statusCode = 500;
      res.end();
      console.error(err);
    }).on('data', (chunk) => {
      body.push(chunk);
    }).on('end', async () => {
      body = JSON.parse(Buffer.concat(body).toString());
      const { recipient, amount, tx_type } = body;
      if (tx_type === 'roks') {
        console.log('sending roks.....');
        const result = await roksTransfer.transfer(recipient, amount);
        if (!result){
          res.statusCode = 500;
        } else {
          res.statusCode = 200;
        }
      } else if (tx_type === 'eth') {
        console.log('sending eth.....');
        const result = await ethTransfer.transfer(recipient, amount);
        if (!result){
          res.statusCode = 500;
        } else {
          res.statusCode = 200;
        }
      }
      res.end();
    });
});

server.listen(HOST_PORT, HOST_NAME, () => {
  roksTransfer.init();
  ethTransfer.init();
  console.log(`Server running at http://${HOST_NAME}:${HOST_PORT}/`);
});