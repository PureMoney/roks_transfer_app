const Web3 = require('web3');
const { default_http_options, default_ws_options } = require('./properties');
const contract = require('./contract_abi');
const Big = require('big.js');
const { EthTransfer } = require('./eth_transfer');

class RoksTransfer extends EthTransfer {
  constructor(
    contract_abi,
    network,
    network_provider,
    contract_address,
    roks_src_address,
    roks_src_priv_key,
    gas_limit,
    roks_eth_src_same,
    nonce_helper = null,
    http_options = default_http_options,
    ws_options = default_ws_options,
    src_mnemonic = null
  )
 {
   super(
    network,
    network_provider,
    contract_address,
    roks_src_address,
    roks_src_priv_key,
    gas_limit,
    roks_eth_src_same,
    nonce_helper,
    http_options,
    ws_options,
    src_mnemonic
  )
    this.contract_abi = contract_abi;
  }

  async init() {
    await super.init()
    this.contract = await this.setupContract(this.contract_abi, this.contract_address, this.roks_src_address, this.web3);
    console.log("ROKS Contract is set up...");
  }

  async setupContract(contract_abi, contract_address, roks_src_address, web3) {
    return await new web3.eth.Contract(contract_abi, contract_address, {from: roks_src_address});
  }

  async transfer(recipient, amount) {
    await this.prepareTxData(recipient, amount);

    // overwrite some propertis of txData
    const {
      web3,
      contract,
      roks_src_address,
    } = this;

    // Get current ROKS balance of source address
    const weiBalance = await contract.methods.balanceOf(roks_src_address).call();
    const balance = web3.utils.fromWei(weiBalance);
    console.log("Balance: ", balance, " Type:", typeof balance);
    console.log("Amount: ", amount, " Type:", typeof amount);

    const bigBalance = Big(balance);

    // Balance should not be less than the amount
    if (bigBalance.lt(bigAmount)){
      console.log("Invalid amount (greater than current balance).");
      throw new Error("Invalid amount (greater than current balance).");
    }

    const data = contract.methods.transfer(recipient, Web3.utils.toWei(amount.toString(), 'ether')).encodeABI();

    // this.txData = {
    //   "value": "0x00",
    //   "data": data,
    //   "to": this.contract_address,
    //   ...this.txData
    // };
    this.txData.value = '0x0';
    this.txData.data = data;
    this.txData.to = this.contract_address;

    await this.signAndTransfer();
  }
}

module.exports.RoksTransfer = RoksTransfer;
module.exports.RoksContract = contract.contract;