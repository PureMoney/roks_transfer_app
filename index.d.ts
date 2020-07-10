declare module "@bcabansay/roks_transfer_app" {
    export class RoksTransfer {
        constructor(
            contract_abi: any,
            network: string,
            network_provider: string,
            contract_address: string,
            roks_src_address: string,
            roks_src_priv_key: string,
            gas_limit: number,
            roks_eth_src_same: boolean,
            nonce_helper: () => {}
          )
          
          init(): void
          setUpWeb3(network_provider: string): void
          setupContract(contract_abi: any, contract_address: string, roks_src_address: string, web3: any): void
          transfer(recipient: any, amount: number): void
    }

    export const RoksContract: any;

    export class EthTransfer {
        constructor(
            network: string,
            network_provider: string,
            contract_address: string,
            eth_src_address: string,
            eth_src_priv_key: string,
            gas_limit: number,
            roks_eth_src_same: boolean,
            nonce_helper: () => {}
          )
          
          init(): void
          setUpWeb3(network_provider: string): void
          transfer(recipient: string, amount: number): void
    }
}