const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
const Web3EthContract = require('web3-eth-contract');

const contract = require('./contract_abi');
const CONTRACT_ABI = contract.contract;

const properties = require('./properties');
const CONTRACT_ADDRESS = properties.contract_address;
const NETWORK_PROVIDER = properties.network_provider;
const ROKS_SRC_ADDRESS = properties.roks_src_address;
const ROKS_SRC_PRIV_KEY = properties.roks_src_priv_key;
const GAS_LIMIT = properties.gas_limit;
const NETWORK = properties.network;

const privateKey = new Buffer(ROKS_SRC_PRIV_KEY, 'hex');

async function setUpWeb3(){
  return new Web3(NETWORK_PROVIDER);
}

async function setupContract(){
  return new Web3EthContract(CONTRACT_ABI, CONTRACT_ADDRESS, {from: ROKS_SRC_ADDRESS});
}

async function transfer(web3, contract, recipient, amount){
  if (web3 === null){
    web3 = setUpWeb3();
  }
  if (contract === null){
    contract = setupContract();
  }

  const count = await web3.eth.getTransactionCount(ROKS_SRC_ADDRESS);
  const nonce = web3.utils.toHex(count);
  const data = contract.methods.transfer(recipient, Web3.utils.toWei(amount.toString(), 'ether')).encodeABI();

  const gasPrice = await web3.eth.getGasPrice().then((result) => {
    return result;
  })

  const txObj = {
    nonce,
    'gasPrice': web3.utils.toHex(gasPrice.toString()),
    'gasLimit':  web3.utils.toHex(GAS_LIMIT),
    "value": "0x00",
    "data": data,
    "to": CONTRACT_ADDRESS
  }

  const tx = new Tx(txObj, {'chain':NETWORK});
  tx.sign(privateKey);
  const serializedTx = tx.serialize();
  web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    .once('transactionHash', function(hash){ console.log("Hash: ", hash) })
    .once('receipt', function(receipt){ console.log("Receipt: ", receipt) })
    .on('confirmation', function(confNumber, receipt){ console.log("Confirmation: ", receipt, " Confirmation Number: ", confNumber) })
    .on('error', function(error){ console.log("Error: ", error) })
    .then(function(receipt){
      console.log("Receipt: ", receipt);
    });
}

module.exports.setUpWeb3 = setUpWeb3;
module.exports.setupContract = setupContract;
module.exports.transfer = transfer;



