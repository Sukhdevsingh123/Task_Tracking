// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;



contract ExpenseTracker {

    

    struct Expense {

        uint256 amount;      // Amount in USD (or whole units)

        string category;     // e.g., "Business", "Food"

        string description;  // e.g., "Domain Name"

        uint256 timestamp;

    }



    // Map User Wallet -> List of Expenses

    mapping(address => Expense[]) public userExpenses;



    event ExpenseLogged(address indexed user, uint256 amount, string category, string description);



    function logExpense(uint256 _amount, string memory _category, string memory _description) external {

        userExpenses[msg.sender].push(Expense({

            amount: _amount,

            category: _category,

            description: _description,

            timestamp: block.timestamp

        }));



        emit ExpenseLogged(msg.sender, _amount, _category, _description);

    }



    function getMyExpenses() external view returns (Expense[] memory) {

        return userExpenses[msg.sender];

    }

}


//contract address:-0xa63250936c5Cf634854045b54E43dcfAFB29D704
//wallet address:-0xfdd343dbd6a87e760c20b4fb1721b2e2497b53eb
//private key:-1679dee3c2e71271597d37a69691d204b590181374418fd583046a85f4a885bd