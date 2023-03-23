'use strict';

require('dotenv').config();

const TokenDeployer = require('../artifacts/contracts/TokenDeployer.sol/TokenDeployer.json');

const BytecodeServer = require('../artifacts/contracts/BytecodeServer.sol/BytecodeServer.json');
const Token = require('../artifacts/contracts/ERC20BurnableMintable.sol/ERC20BurnableMintable.json');
const TokenProxy = require('../artifacts/contracts/proxies/TokenProxy.sol/TokenProxy.json');
const { deployContract } = require('@axelar-network/axelar-gmp-sdk-solidity/scripts/utils');
const { setJSON } = require('@axelar-network/axelar-local-dev');
const { ContractFactory } = require('ethers');
const chains = require(`../info/${process.env.ENV}.json`);

async function deployTokenDeployer(chain, wallet) {
    if (chain.tokenDeployer) return;

    console.log(`Deploying ERC20BurnableMintable.`);
    const token = await deployContract(wallet, Token, []);
    chain.tokenImplementation = token.address;
    console.log(`Deployed at: ${token.address}`);

    console.log(`Deploying Bytecode Server.`);
    const factory = new ContractFactory(TokenProxy);
    const bytecode = factory.getDeployTransaction(chain.tokenImplementation).data;
    const bytecodeServer = await deployContract(wallet, BytecodeServer, [bytecode]);
    chain.bytecodeServer = bytecodeServer.address;
    console.log(`Deployed at: ${bytecodeServer.address}`);

    console.log(`Deploying Token Deployer.`);
    const tokenDeployer = await deployContract(wallet, TokenDeployer, [chain.create3Deployer, bytecodeServer.address]);
    chain.tokenDeployer = tokenDeployer.address;
    console.log(`Deployed at: ${tokenDeployer.address}`);

    setJSON(chains, `./info/${process.env.ENV}.json`);
}

module.exports = {
    deployTokenDeployer,
};
