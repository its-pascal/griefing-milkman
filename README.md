# Griefing Milkman

This repository demonstrates an attack vector to grief Milkman orders. 

## On Milkman

[Milkman](https://github.com/charlesndalton/milkman) is a module that allows smart contracts to perform swaps MEV protection. This is done by using cowswap offchain orders.

Milkman flow: 
1. A smart contract calls milkman.requestSwapExactTokensForTokens with swap parameters such as input token, output token, input token amounts, and output address 
2. The milkman contract deploys a proxy contract representing that order and transfers input tokens to that contract. 
3. An off-chain order is submitted to the CoWswap API (this step could be automated with something like Tenderly Actions)
4. A cowswap protocol solver calls the cowswap contracts and that executes the swap, pulling tokens from the proxy and sending tokens to the output addr specified in step 1

Milkman has some usage thus far, most notably by the [ENS Domains treasury recently](https://twitter.com/CoWSwap/status/1623680760522612738)

## Description of Grief Attack + Impact
Attacker submits a quote and order with a custom high value for verificationGasLimit. The verificationGasLimit parameter is for cowswap to collect the appropriate fee based on the gas incurred from verifying signatures. For EIP1271 contract signatures, users are supposed to set this value to the upper bound gas cost for isValidSignature 

When this value is set extraordinarily high, cowswap collects a higher fee from the swap. From the swappers POV, the swap has incurred a higher slippage.

Fortunately, the impact of this attack is bounded by the slippage protection feature of Milkman wherein the user specifies a price oracle and a tolerance based on that. This limits losses to the max slippage tolerance provided. For the earlier example by the ENS treasury, they used a [2% slippage](https://twitter.com/CoWSwap/status/1623680770651947008) which means this attack would have caused a loss of 20ETH. 

I note that althrough the impact is limited by the above, the attacker never needs to make an on-chain call, so the cost of attacking is basically 0. Because of this, I assert that this should be patched

## Proof of Concept
Example testnet attack: [regular swap](https://goerli.etherscan.io/tx/0xc81c71d77fe7afb7245007fe15739c2f995864b34d4df3cd5474cea7cd114f5b) and [attacked swap](https://goerli.etherscan.io/tx/0x5904bf9899d4bdeb753f59430a7b438c7d4f0df5d1aa002ea8c9cf02586b7681)

To run:
1. Set up .env file with goerli RPC, private key and public key like in .env.example
2. Run grief poc via: npx hardhat run scripts/griefPoC.js --network goerli

## Fix
The core issue is that the attacker is able to submit quotes and orders on behalf of the order contract due to a lack of authentication. Digital signatures normally give us authenticity protection out of the box but unfortunately, the implementation of 1271 in milkman does not provide that. From the flow, the on-chain action is done before the off-chain quote/order sequence so we are unable to include expected outputs in the stored hash. Still, there are other ways we can fix this:

Fix 1: Add a commit-reveal type scheme. In step 1 of the milkman flow, we generate 32 bytes of randomness r offchain and store hash(r) in [swapHash](https://github.com/charlesndalton/milkman/blob/main/contracts/Milkman.sol#L78). In isValidSignature, the preimage of hash(r) should be included, and should be hashed to generate swapHash. If swapHash matches what's stored, then the preimage of r was provided and since only the swap creator should have the preimage of r, we get the authentication we need.

This solution is simple and cheap to implement (should be additional <500 gas to request and isValidSignature). However, theres a trust assumption that off-chain orders are not accessible by malicious solvers. If thats the case, the malicious solver can grab the preimage r from submitted orders and generate + fill a valid shit order with that preimage 

Fix 2: Add a ecdsa signature covering the order. In isValidSignature, we do an ecrecover and make sure it covers the fee + output token amounts.

This solution is more gas intensive as the ecrecover operation would cost 3000 gas, but authentication will be airtight
