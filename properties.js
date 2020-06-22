// Change hostname and port as needed
const hostname = '127.0.0.1';
const port = 2000;

// Change these values according to environment (prod / dev)
const network = 'ropsten' // default is mainnet;
const contract_address = '0x89031D05bf46458d5E907AFAae91584e19C50FB9';
const network_provider = 'wss://ropsten.infura.io/ws/v3/13138ea84bd84a0cbd95f88a7e12c054';
const roks_src_address = '0x0d606668Fcf49942F19Fdfd5A3aFB01eA5163EF5';
const roks_src_priv_key = 'AA7BE917A05F15FC70AA4ACBC3A3120372FD560A6D643BF09A614251C75DB9A7';

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