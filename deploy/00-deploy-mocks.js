const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

const BASE_FEE = "250000000000000000" //ethers.utils.parseEther("0.25")
const GAS_PRICE_LINK = 1e9

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(networkConfig[chainId]["name"])) {
        log("Local network detected. Deploying mocks....")
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        log("Mocks deployed!")
        log("________________________________________________________________________________")
    }
}

module.exports.tags = ["all", "mocks"]
