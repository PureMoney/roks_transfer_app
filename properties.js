// Change hostname and port as needed
const hostname = '127.0.0.1';
const port = 2000;

// Change these values according to environment (prod / dev)
const network = 'ropsten' // default is mainnet;
const network_provider = 'network-provider here e.g. infura';
// ROKS Transfer
const contract_address = 'change to the smart contract address';
const roks_src_address = 'address of the source of ROKS';
const roks_src_priv_key = 'private key of the source of ROKS';
// ETH Transfer
const eth_src_address = 'address of the source of ETH';
const eth_src_priv_key = 'private key of the source of ETH';

// Change the gas limit as per requirement
const roks_gas_limit = '900000';
const eth_gas_limit = '21000';

const http_options = {
  keepAlive: true,
  timeout: 20000, // milliseconds,
  withCredentials: false,
};

exports.hostname = hostname;
exports.port = port;

exports.contract_address = contract_address;
exports.network = network;
exports.network_provider = network_provider;
exports.roks_src_address = roks_src_address;
exports.roks_src_priv_key = roks_src_priv_key;
exports.roks_gas_limit = roks_gas_limit;
exports.eth_src_address = eth_src_address;
exports.eth_src_priv_key = eth_src_priv_key;
exports.eth_gas_limit = eth_gas_limit;
exports.http_options = http_options;