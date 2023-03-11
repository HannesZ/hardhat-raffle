After creating the new project:

```bash
yarn add --dev hardhat
```

```bash
yarn hardhat
```

Select the empty js project and install all the dependencies:

```bash
yarn add --dev @nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers ethers @nomiclabs/hardhat-etherscan @nomiclabs/hardhat-waffle chai ethereum-waffle hardhat hardhat-contract-sizer hardhat-deploy hardhat-gas-reporter prettier prettier-plugin-solidity solhint solidity-coverage dotenv
```

edit requirements in `hardhat.config.js`:

```bash
code hardhat.config.js
```

...and add the following to the top of the script

```javascript
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()
```

Change the solidity version:

```javascript
module.exports = {
    solidity: "0.8.7",
}
```

add prettier:

```bash
touch .prettierrc
code .prettierrc
```

paste the following:

```javascript
{
  "tabWidth": 4,
  "useTabs": false,
  "semi": false,
  "singleQuote": false,
  "printWidth": 100
}
```

# Contract

Create the contracts-folder an the contract file:

```bash
mkdir contracts
touch contracts/Raffle.sol
code contracts/Raffle.sol
```

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract Raffle {
    constructor() {}
}
```

Test if things look good:

```bash
yarn hardhat compile
```

Now continue with the contract:

Add the entrance fee as immutable private:

## entrance fee

```solidity
uint256 private immutable i_entranceFee;
```

and add a get-function at the bottom of the contract brackets:

```solidity
function getEntranceFee() public view returns (uint256) {
    return i_entranceFee;
}
```

Now add to the contructor the entrance fee:

```solidity
constructor(uint256 entranceFee) {
    s_entranceFee = entranceFee;
}
```

## enterRaffle

Now edit `enterRaffle`:

```solidity
function enterRaffle() {
    if (msg.value < i_entranceFee) {
        revert Raffle__NotEnoughETHEntered();
    }
}
```

and enter the error-code just above the contract declaration:

```solidity
error Raffle__NotEnoughETHEntered();
```

Now add the players array to the state variables:

```solidity
address payable[] private s_players;
```

and add to the `enterRaffle`-function:

```solidity
function enterRaffle() public payable {
    if (msg.value < i_entranceFee) {
        revert Raffle__NotEnoughETHEntered();
    }
    s_players.push(payable(msg.sender));
}
```

This is the contract so far [youtube t=50036](https://youtu.be/gyMwXuJrbJQ?t=50036)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

error Raffle__NotEnoughETHEntered();

contract Raffle {
    /* State variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;

    constructor(uint256 entranceFee) {
        i_entranceFee = entranceFee;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughETHEntered();
        }
        s_players.push(payable(msg.sender));
    }

    // function pickRandomWinner()

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }
}
```

test with:

```bash
yarn hardhat compile
```

## events

Under the state-variables add:

```solidity
/*Events */
event RaffleEnter(address indexed player);
```

and at the end of our `enterRaffle`-function:

```solidity
emit RaffleEnter(msg.sender);
```

## pickRandomWinner

Add these two function stubs:

```solidity
function requestRandomWinner() external {}

function fulfillRandomWords() internal override {}
```

Now, we have to import `VRFConsumerBase`:

```solidity
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
```

and add it in the project:

```bash
yarn add --dev @chainlink/contracts
```

adjust the contract signature:

```solidity
contract Raffle is VRFConsumerBaseV2
```

add a state variable:

```solidity
VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
```

...and the contructor:

```solidity
constructor(address vrfCoordinatorV2, uint256 entranceFee) VRFConsumerBaseV2(vrfCoordinatorV2) {
    i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    i_entranceFee = entranceFee;
}
```

## requestRandomWinner

Add state variables:

```solidity
bytes32 private immutable i_gasLane;
uint64 private immutable i_subscriptionId;
uint32 private immutable i_callbackGasLimit;
uint16 private constant REQUEST_CONFIRMATIONS = 3;
uint32 private constant NUM_WORDS = 1;
```

make the necessary additions to the constructor:

```solidity
constructor(
    address vrfCoordinatorV2,
    uint256 entranceFee,
    bytes32 gasLane,
    uint64 subId,
    uint32 callbackGasLimit
) VRFConsumerBaseV2(vrfCoordinatorV2) {
    i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    i_entranceFee = entranceFee;
    i_gasLane = gasLane;
    i_subscriptionId = subId;
    i_callbackGasLimit = callbackGasLimit;
}
```

...and add the `requestRandomWinner`-function:

```solidity
function requestRandomWinner() external {
    uint256 requestId = i_vrfCoordinator.requestRandomWords(
        i_gasLane,
        i_subscriptionId,
        REQUEST_CONFIRMATIONS,
        i_callbackGasLimit,
        NUM_WORDS
    );
    emit RequestedRaffleWinner(requestId);
}
```

here is the whole `Raffle.sol` contract so far [youtube t=51762](https://youtu.be/gyMwXuJrbJQ?t=51762)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

error Raffle__NotEnoughETHEntered();

contract Raffle is VRFConsumerBaseV2 {
    /* State variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    /*Events */
    event RaffleEnter(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);

    constructor(
        address vrfCoordinatorV2,
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subId,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_entranceFee = entranceFee;
        i_gasLane = gasLane;
        i_subscriptionId = subId;
        i_callbackGasLimit = callbackGasLimit;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughETHEntered();
        }

        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    function requestRandomWinner() external {
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {}

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }
}
```

## fulfill random words

Get random winner by using modulo. Edit the `fulfillRandomWords` function

```solidity
function fulfillRandomWords(uint256 /*requestId*/, uint256[] memory randomWords) internal override {
    uint256 indexOfWinner = randomWords[0] % s_players.length;
    address payable recentWinner = s_players[indexOfWinner];
    s_recentWinner = recentWinner;
    (bool success, ) = recentWinner.call{value: address(this).balance}("")
    if (!success) {
        revert Raffle__Transferfailed();
    }
    emit WinnerPicked(recentWinner);
    s_players = new address payable[](0);
}
```

adding the following after the state variables:

```solidity
/* Lottery variables */
address private s_recentWinner;
```

and a corresponding get-function:

```solidity
function getRecentWinner() public view returns (address) {
    return s_recentWinner;
}
```

[youtube t=52106](https://youtu.be/gyMwXuJrbJQ?t=52106)

## Chainlink keeper

add this to the imports:

```solidity
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
```

### Raffle state

add an enum:

```solidity
/* Type declarations */
enum RaffleState {
    OPEN,
    CALCULATING
/* State variables */
.
.
.
RaffleState private s_raffleState;
}
```

in the `enterRaffle`-function, we can add this if-clause:

```solidity
if (!(s_raffleState == RaffleState.OPEN)) {
    revert Raffle__RaffleStateNotOpen();
}
```

and the correspoding error to the error-definitions. To our `requestRandomWinner`function we add

```solidity
s_raffleState = RaffleState.CALCULATING;
```

and to `fulfillRandomWords`, we add

```solidity
s_raffleState = RaffleState.OPEN;
```

[youtube t=52946](https://youtu.be/gyMwXuJrbJQ?t=52946)

### timestamp

create a new state variable

```solidity
uint256 private s_lastTimeStamp;
```

add to the constructor:

```solidity
s_lastTimeStamp = block.timestamp;
```

and a new global variable:

```solidity
uint256 private immutable i_interval;
```

and to the constructor

```solidity
constructor(..., uint256 interval){
    .
    .
    .
    i_interval = interval;
}
```

add to `fulfillRandomWords`-function:

```solidity
s_lastTimeStamp = block.timestamp;
```

## checkupkeep

add the function `checkUpkeep`.

```solidity
function checkUpkeep(
    bytes memory /*performdata*/
) public override returns (bool upkeepNeeded, bytes memory /*performdata*/) {
    bool isOpen = (RaffleState.OPEN == s_raffleState);
    bool hasPlayers = (s_players.length >= 1);
    bool enoughTimePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
    bool hasBalance = (address(this).balance > 0);
    upkeepNeeded = (isOpen && hasPlayers && enoughTimePassed && hasBalance);
}
```

## performUpkeep

Rename the `requestRandomWinner`function into `performUpkeep` to comply with the `KeeperCompatibleInterface` module. Change the visibility of `checkUpkeep` to `public`.

Add a new error

```solidity
error Raffle__UpkeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);
```

and add the following to `performUpkeep`:

```solidity
(bool upkeepNeeded, ) = checkUpkeep("");
if (!(upkeepNeeded)) {
    revert Raffle__UpkeepNotNeeded(
        address(this).balance,
        s_players.length,
        uint256(s_raffleState)
    );
}
```

here is the full contract so far:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error Raffle__NotEnoughETHEntered();
error Raffle__Transferfailed();
error Raffle__RaffleStateNotOpen();
error Raffle__UpkeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);

/**
 * @title A sample raffle contract
 * @author Patrick
 * @notice This implements Chainlink VRF v2 and Chainlink Keepers.
 */

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /* Type declarations */
    enum RaffleState {
        OPEN,
        CALCULATING
    }
    /* State variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    RaffleState private s_raffleState;
    uint256 private s_lastTimeStamp;

    /* Lottery variables */
    address private s_recentWinner;
    uint256 private immutable i_interval;

    /*Events */
    event RaffleEnter(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    constructor(
        address vrfCoordinatorV2,
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_entranceFee = entranceFee;
        i_gasLane = gasLane;
        i_subscriptionId = subId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughETHEntered();
        }
        if (!(s_raffleState == RaffleState.OPEN)) {
            revert Raffle__RaffleStateNotOpen();
        }

        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    /**
     * @dev This is the function, that the chainlink keepers nodes call. They look for the function to return true.
     * The following should be true in order to return true.
     * 1. The time interval should have passed
     * 2. The lottery should have at least one plaer
     * 3. Our subscription is funded with LINK
     * 4. The lottery should be in an "open" state.
     */
    function checkUpkeep(
        bytes memory /*performdata*/
    ) public override returns (bool upkeepNeeded, bytes memory /*performdata*/) {
        bool isOpen = (RaffleState.OPEN == s_raffleState);
        bool hasPlayers = (s_players.length >= 1);
        bool enoughTimePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasBalance = (address(this).balance > 0);
        upkeepNeeded = (isOpen && hasPlayers && enoughTimePassed && hasBalance);
    }

    function performUpkeep(bytes calldata /*performdata*/) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!(upkeepNeeded)) {
            revert Raffle__UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );
        }
        s_raffleState = RaffleState.CALCULATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(
        uint256 /*requestId*/,
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_raffleState = RaffleState.OPEN;
        (bool success, ) = recentWinner.call{ value: address(this).balance }("");
        if (!success) {
            revert Raffle__Transferfailed();
        }
        emit WinnerPicked(recentWinner);
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getNumPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimestamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getRequestConfirmations() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS;
    }
}
```

[youtube t=53757](https://youtu.be/gyMwXuJrbJQ?t=53757)

# deploy

Before we start with the deployments, let's get `hardhat.config.js` ready first.

```bash
code hardhat.config.js
```

paste the following code:

```javascript
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const MAINNET_RPC_URL =
    process.env.MAINNET_RPC_URL ||
    process.env.ALCHEMY_MAINNET_RPC_URL ||
    "https://eth-mainnet.alchemyapi.io/v2/your-api-key"
const GOERLI_RPC_URL =
    process.env.GOERLI_RPC_URL || "https://eth-goerli.alchemyapi.io/v2/your-api-key"
const POLYGON_MAINNET_RPC_URL =
    process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-mainnet.alchemyapi.io/v2/your-api-key"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x"
// optional
const MNEMONIC = process.env.MNEMONIC || "your mnemonic"

// Your API key for Etherscan, obtain one at https://etherscan.io/
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "Your etherscan API key"
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "Your polygonscan API key"
const REPORT_GAS = process.env.REPORT_GAS || false

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            // // If you want to do some forking, uncomment this
            // forking: {
            //   url: MAINNET_RPC_URL
            // }
            chainId: 31337,
        },
        localhost: {
            chainId: 31337,
        },
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            //   accounts: {
            //     mnemonic: MNEMONIC,
            //   },
            saveDeployments: true,
            chainId: 5,
        },
        mainnet: {
            url: MAINNET_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            //   accounts: {
            //     mnemonic: MNEMONIC,
            //   },
            saveDeployments: true,
            chainId: 1,
        },
        polygon: {
            url: POLYGON_MAINNET_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            saveDeployments: true,
            chainId: 137,
        },
    },
    etherscan: {
        // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
        apiKey: {
            goerli: ETHERSCAN_API_KEY,
            polygon: POLYGONSCAN_API_KEY,
        },
        customChains: [
            {
                network: "goerli",
                chainId: 5,
                urls: {
                    apiURL: "https://api-goerli.etherscan.io/api",
                    browserURL: "https://goerli.etherscan.io",
                },
            },
        ],
    },
    gasReporter: {
        enabled: REPORT_GAS,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    contractSizer: {
        runOnCompile: false,
        only: ["Raffle"],
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
        player: {
            default: 1,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.7",
            },
            {
                version: "0.4.24",
            },
        ],
    },
    mocha: {
        timeout: 500000, // 500 seconds max for running tests
    },
}
```

Now add a `.env`-file:

```bash
touch .env
code .env
```

```
COINMARKETCAP_API_KEY = YOUR COINMARKETCAP API KEY

GOERLI_RPC_URL = "https://eth-goerli.g.alchemy.com/v2/YOUR GOERLI API KEY"

PRIVATE_KEY = qwuetnqotuq0q34r9u3_YOUR_PRIVATE_KEY_72038457203457nc203455n2034

ETHERSCAN_API_KEY = YOUR_ETHERSCAN_API_KEY
```

```bash
mkdir deploy
```

Looking at the constructor of our `Raffle.sol` file, we can see which contracts are invoked. For those contracts we might have to deploy some mocks.

```bash
touch deploy/01-deploy-raffle.js
code deploy/01-deploy-raffle.js
```

```javascript
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
}
```

saving should automatically import the dependencies. Continue adding:

```javascript
const raffle = await deploy("Raffle", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
})

if (developmentChains.includes(networkConfig[chainId]["name"])) {
    const vrfCoordinatorV2 = await ethers.getContract("VRFCoordinatorV2Mock")
    await vrfCoordinatorV2.addConsumer(subscriptionId, raffle.address)
}
```

The last bit is not discussed in the youtube course, however it prevents a bug when doing the unit tests as discussed here: [Github InvalidConsumer()' #1565](https://github.com/smartcontractkit/full-blockchain-solidity-course-js/discussions/1565)

[youtube t=54076](https://youtu.be/gyMwXuJrbJQ?t=54076)

## Mocks

```bash
touch helper-hardhat-config.js
code helper-hardhat-config.js
```

copy & paste from the Github-Repo:

```javascript
const { ethers } = require("hardhat")

const networkConfig = {
    default: {
        name: "hardhat",
        keepersUpdateInterval: "30",
    },
    31337: {
        name: "localhost",
        subscriptionId: "588",
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        keepersUpdateInterval: "30",
        entranceFee: ethers.utils.parseEther("0.01"), // 0.01 ETH
        callbackGasLimit: "500000", // 500,000 gas
    },
    5: {
        name: "goerli",
        subscriptionId: "9771",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // 30 gwei
        keepersUpdateInterval: "30",
        entranceFee: ethers.utils.parseEther("0.01"), // 0.01 ETH
        callbackGasLimit: "500000", // 500,000 gas
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    },
    1: {
        name: "mainnet",
        keepersUpdateInterval: "30",
    },
}

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6
const frontEndContractsFile = "../nextjs-smartcontract-lottery-fcc/constants/contractAddresses.json"
const frontEndAbiFile = "../nextjs-smartcontract-lottery-fcc/constants/abi.json"

module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    frontEndContractsFile,
    frontEndAbiFile,
}
```

Now create a new mock-deploy file:

```bash
touch 00-deploy-mocks.js
code 00-deploy-mocks.js
```

Now start with this deploy-mock file:

```javascript
const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("./helper-hardhat-config")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    if (developmentChains.includes(networkConfig[chainId]["name"])) {
        log("Local network detected. Deploying mocks....")
    }
}
```

```bash
mkdir contracts/test
touch contracts/test/VRFCoordinatorV2Mock.sol
```

```solidity
// SPDX-License-Identifier: MIT
// A mock for testing code that relies on VRFCoordinatorV2.
pragma solidity ^0.8.4;
import "@chainlink/contracts/src/v0.8/mocks/VRFCoordinatorV2Mock.sol";
```

[youtube t=54328](https://youtu.be/gyMwXuJrbJQ?t=54328)

Finishing 1.Part of `01-deploy-raffle.js`:

```javascript
const { deployments, getNamedAccounts, network, ethers } = require("hardhat")
const {
    developmentChains,
    networkConfig,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const VRF_SUB_FUN_AMOUNT = ethers.utils.parseEther("1")
    let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock

    if (developmentChains.includes(networkConfig[chainId]["name"])) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = transactionReceipt.events[0].args.subId
        // Fund the subscription
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUN_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["keepersUpdateInterval"]

    const args = [
        vrfCoordinatorV2Address,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
```

[youtube t=55091](https://youtu.be/gyMwXuJrbJQ?t=55091)

## verification

```bash
mkdir utils
touch utils/verify.js
code utils/verify.js
```

paste the following into the file:

```javascript
// we can't have these functions in our `helper-hardhat-config`
// since these use the hardhat library
// and it would be a circular dependency
const { run } = require("hardhat")

const verify = async (contractAddress, args) => {
    console.log("Verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!")
        } else {
            console.log(e)
        }
    }
}

module.exports = {
    verify,
}
```

Import the verify script to `01-deploy-raffle.js`:

```javascript
if (!developmentChains.includes(networkConfig[chainId]["name"]) && process.env.ETHERSCAN_API_KEY) {
    log("Verifying...")
    await verify(raffle.address, args)
}

log("----------------------------------------------------------------------------------------")
```

Now if the `ethers`-version is too new, we have to downgrade it before our deploy-scripts work:

```bash
yarn add ethers@5.5.1
```

Check if everything works fine:

```bash
yarn hardhat deploy
```

[youtube t=55195](https://youtu.be/gyMwXuJrbJQ?t=55195)

```bash
mkdir test
mkdir test/unit
touch test/unit/Raffle.test.js
code test/unit/Raffle.test.js
```

First part of `Raffle.test.js`:

```javascript
const { assert } = require("chai")
const { getNamedAccounts } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

chainId = network.config.chainId
!developmentChains.includes(networkConfig[chainId]["name"])
    ? describe.skip
    : describe("Raffle unit test", async function () {
          let raffle, vrfCoordinatorV2Mock
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
          })

          describe("constructor", async function () {
              it("initializes the raffle correctly", async function () {
                  const raffleState = await raffle.getRaffleState()
                  const interval = await raffle.getInterval()
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(interval.toString(), networkConfig[chainId]["keepersUpdateInterval"])
              })
          })

          describe("enterRaffle", async function () {})
      })
```

test that the `gas-report.txt` works, if need be:

```bash
code .env
```

and add:

```script
REPORT_GAS = true
```

run

```bash
yarn hardhat test
```

it should show one passed test and create a `gas-report.txt` file.

[youtube t=55627](https://youtu.be/gyMwXuJrbJQ?t=55627)

After completing all the tests for developmentChains, `01-deploy-raffle.js` is as follows:

```javascript
const { assert, expect } = require("chai")
const { getNamedAccounts, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

chainId = network.config.chainId
!developmentChains.includes(networkConfig[chainId]["name"])
    ? describe.skip
    : describe("Raffle unit test", function () {
          let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, deployer, interval
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("constructor", function () {
              it("initializes the raffle correctly", async function () {
                  const raffleState = await raffle.getRaffleState()
                  interval = await raffle.getInterval()
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(interval.toString(), networkConfig[chainId]["keepersUpdateInterval"])
              })
          })

          describe("enterRaffle", function () {
              it("reverts when you don't pay enough", async function () {
                  await expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle__NotEnoughETHEntered"
                  )
              })

              it("records players in the database", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const playerFromContract = await raffle.getPlayer(0)
                  assert.equal(playerFromContract, deployer)
              })

              it("emits an event on enter", async function () {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
                      raffle,
                      "RaffleEnter"
                  )
              })

              it("doesn't allow entrance when raffle-state is calculating", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpkeep([])
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
                      "Raffle__RaffleStateNotOpen"
                  )
              })
          })

          describe("checkUpkeep", function () {
              it("returns false if people haven't send any ETH", async function () {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeed } = await raffle.callStatic.checkUpkeep([])
                  assert(!upkeepNeed)
              })
              it("returns false if raffle isn't open", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpkeep("0x")
                  const raffleState = await raffle.getRaffleState()
                  const { upkeepNeed } = await raffle.callStatic.checkUpkeep([])
                  assert.equal(raffleState.toString(), "1")
                  assert(!upkeepNeed)
              })
              it("returns false if enough time hasn't passed", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() - 5]) // use a higher number here if this test fails
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(!upkeepNeeded)
              })
              it("returns true if enough time has passed, has players, eth, and is open", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(upkeepNeeded)
              })
          })

          describe("performUpkeep", function () {
              it("can only run if checkupkeep is true", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const tx = await raffle.performUpkeep([])
                  assert(tx)
              })
              it("reverts when upkeep is not needed", async function () {
                  await expect(raffle.performUpkeep([])).to.be.revertedWith(
                      "Raffle__UpkeepNotNeeded"
                  )
              })
              it("updates the raffle state, emits an event and calls the vrfCoordinator", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const txResponse = await raffle.performUpkeep([])
                  const txReceipt = await txResponse.wait(1)
                  const requestId = txReceipt.events[1].args.requestId
                  const raffleState = await raffle.getRaffleState()

                  assert(requestId.toNumber() > 0)
                  assert.equal(raffleState, 1)
              })
          })

          describe("fulfillRandomWords", function () {
              beforeEach(async function () {
                  let interval
                  interval = await raffle.getInterval()
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
              })

              it("can only be called after performUpkeep", async function () {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
                  ).to.be.revertedWith("nonexistent request")

                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
                  ).to.be.revertedWith("nonexistent request")
              })

              it("picks a winner, resets the lottery and sends money", async function () {
                  const additionalEntrances = 3
                  const startingAccountIndex = 1
                  const accounts = await ethers.getSigners()
                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additionalEntrances;
                      i++
                  ) {
                      const accountConnectedRaffle = raffle.connect(accounts[i])
                      await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee })
                  }
                  const startingTimeStamp = await raffle.getLatestTimestamp()

                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("Found the event!")
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              //console.log(recentWinner)
                              console.log(accounts[2].address)
                              console.log(accounts[0].address)
                              console.log(accounts[1].address)
                              console.log(accounts[3].address)
                              const raffleState = await raffle.getRaffleState()
                              const endingTimeStamp = await raffle.getLatestTimestamp()
                              const numPlayers = await raffle.getNumPlayers()
                              const WinnerEndingBalance = await accounts[1].getBalance()
                              assert.equal(numPlayers, 0)
                              assert.equal(raffleState.toString(), "0")
                              assert(endingTimeStamp > startingTimeStamp)

                              assert.equal(
                                  WinnerEndingBalance.toString(),
                                  winnerStartingBalance.add(
                                      raffleEntranceFee
                                          .mul(additionalEntrances)
                                          .add(raffleEntranceFee)
                                          .toString()
                                  )
                              )
                          } catch (e) {
                              reject(e)
                          }
                          resolve()
                      })

                      const tx = await raffle.performUpkeep([])
                      const txReceipt = await tx.wait(1)
                      const winnerStartingBalance = await accounts[1].getBalance()
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId,
                          raffle.address
                      )
                  })
              })
          })
      })
```

[youtube t=57897](https://youtu.be/gyMwXuJrbJQ?t=57897)

## staging

```bash
mkdir test/staging
touch test/staging/Raffle.staging.test.js
code test/staging/Raffle.staging.test.js
```

```javascript
const { assert, expect } = require("chai")
const { getNamedAccounts, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

chainId = network.config.chainId
developmentChains.includes(networkConfig[chainId]["name"])
    ? describe.skip
    : describe("Raffle unit test", function () {
          let raffle, raffleEntranceFee, deployer, interval

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
                  const startingTimeStamp = await raffle.getLatestTimeStamp()
                  const accounts = await ethers.getSigner()
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await accounts[0].getBalance() //recentWinner.getBalance()
                              const endingTimeStamp = await raffle.getLatestTimeStamp()

                              await expect(raffle.getPlayer(0)).to.be.reverted

                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(raffleEntranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })

                      await raffle.enterRaffle({ value: raffleEntranceFee })
                      const winnerStartingBalance = await accounts[0].getBalance()
                  })
              })
          })
      })
```

[youtube t=59032](https://youtu.be/gyMwXuJrbJQ?t=59032)

Now the the `enter.js`script from the Github-Repo:

```bash
mkdir scripts
touch scripts/enter.js
code scripts/enter.js
```

and paste:

```javascript
const { ethers } = require("hardhat")

async function enterRaffle() {
    const raffle = await ethers.getContract("Raffle")
    const entranceFee = await raffle.getEntranceFee()
    await raffle.enterRaffle({ value: entranceFee + 1 })
    console.log("Entered!")
}

enterRaffle()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
```
