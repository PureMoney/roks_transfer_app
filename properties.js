// Change hostname and port as needed
const hostname = '127.0.0.1';
const port = 2000;

// Change these values according to environment (prod / dev)
const network = 'ropsten' // default is mainnet;
const network_provider = 'network-provider here e.g. infura';
const contract_address = 'change to the smart contract address';
const roks_src_address = 'address of the source of ROKS';
const roks_src_priv_key = 'private key of the source of ROKS';

// Change the gas limit as per requirement
const gas_limit = '900000';

exports.hostname = hostname;
exports.port = port;

exports.contract_address = contract_address;
exports.network = network;
exports.network_provider = network_provider;
exports.roks_src_address = roks_src_address;
exports.roks_src_priv_key = roks_src_priv_key;
exports.gas_limit = gas_limit;