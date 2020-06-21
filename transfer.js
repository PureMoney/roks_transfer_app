const Web3 = require('web3');
var Tx = require('ethereumjs-tx').Transaction;
const Web3EthContract = require('web3-eth-contract');

// Change values here
const contract = require('./contract_abi');
const CONTRACT_ABI = contract.contract;
const CONTRACT_ADDRESS = '0x89031D05bf46458d5E907AFAae91584e19C50FB9';
const PRIVATE_KEY = 'AA7BE917A05F15FC70AA4ACBC3A3120372FD560A6D643BF09A614251C75DB9A7';
const INFURA = 'infura websocket url here';
const PREMINTED_ADDRESS = 'address of designated sender here';

var privateKey = new Buffer(PRIVATE_KEY, 'hex');

async function setUpWeb3(){
  return new Web3(INFURA);
}

async function setupContract(){
  return new Web3EthContract(CONTRACT_ABI, CONTRACT_ADDRESS, {from: PREMINTED_ADDRESS});
}

async function transfer(web3, contract, recipient, amount){
  if (web3 === null){
    web3 = setUpWeb3();
  }
  if (contract === null){
    contract = setupContract();
  }

  const count = await web3.eth.getTransactionCount(PREMINTED_ADDRESS);
  const nonce = web3.utils.toHex(count);
  const data = contract.methods.transfer(recipient, Web3.utils.toWei(amount.toString(), 'ether')).encodeABI();

  const gasPrice = await web3.eth.getGasPrice().then((result) => {
    return result;
  })

  const txObj = {
    nonce,
    'gasPrice': web3.utils.toHex(gasPrice.toString()),
    'gasLimit':  web3.utils.toHex('900000'),
    "value": "0x00",
    "data": data,
    "to": CONTRACT_ADDRESS
  }

  const tx = new Tx(txObj, {'chain':'ropsten'});
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



