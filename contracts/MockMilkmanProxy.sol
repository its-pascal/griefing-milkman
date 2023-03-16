//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockMilkmanProxy {
    using SafeERC20 for IERC20;

    constructor(address sellToken) {
        IERC20(sellToken).safeApprove(
            0xC92E8bdf79f0507f65a392b0ab4667716BFE0110, // vault relayer
            type(uint256).max
        );
    }

    function isValidSignature(bytes32, bytes calldata) public pure returns (bytes4) {
        return 0x1626ba7e;
    }
}