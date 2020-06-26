const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
const Web3EthContract = require('web3-eth-contract');
const contract = require('./contract_abi');

class RoksTransfer {
  constructor(contract_abi, network, network_provider, contract_address, roks_src_address, roks_src_priv_key, gas_limit) {
    this.contract_abi = contract_abi;
    this.network = network;
    this.network_provider = network_provider;
    this.contract_address = contract_address;
    this.roks_src_address = roks_src_address;
    this.roks_src_priv_key = roks_src_priv_key;
    this.gas_limit = gas_limit;
    this.private_key = new Buffer(roks_src_priv_key, 'hex');
    this.web3 = null;
    this.contract = null;
  }

  async init(){
    this.web3 = await this.setUpWeb3(this.network_provider);
    console.log("Web3 is set up...")
    this.contract = await this.setupContract(this.contract_abi, this.contract_address, this.roks_src_address);
    console.log("Contract is set up...")
    console.log("RoksTransfer initialization done.");
  }

  async setUpWeb3(network_provider){
    return new Web3(network_provider);
  }

  async setupContract(contract_abi, contract_address, roks_src_address){
    return new Web3EthContract(contract_abi, contract_address, {from: roks_src_address});
  }

  async transfer(recipient, amount){
    const { web3, contract} = this;

    const count = await web3.eth.getTransactionCount(this.roks_src_address);
    const nonce = web3.utils.toHex(count);
    const data = contract.methods.transfer(recipient, Web3.utils.toWei(amount.toString(), 'ether')).encodeABI();

    const gasPrice = await web3.eth.getGasPrice().then((result) => {
      return result;
    })

    const txObj = {
      nonce,
      'gasPrice': web3.utils.toHex(gasPrice.toString()),
      'gasLimit':  web3.utils.toHex(this.gas_limit),
      "value": "0x00",
      "data": data,
      "to": this.contract_address
    }

    const tx = new Tx(txObj, {'chain':this.network});
    tx.sign(this.private_key);
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
}

module.exports.RoksTransfer = RoksTransfer;
module.exports.RoksContract = contract.contract;