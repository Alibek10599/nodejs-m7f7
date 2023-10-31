const { spawn } = require('child_process');
const AbstractService = require('../abstract-service');
const fs = require('fs');
const path = require('path')

const util = require('util');
const fsPromises = {
  mkdir: util.promisify(fs.mkdir),
  copyFile: util.promisify(fs.copyFile),
  writeFile: util.promisify(fs.writeFile),
};

const { Stratum, SubStratum, SubAccount } = require('../../models');
const { STRATUM_SERVICE_STATE } = require('./constants');

// TODO: rename conventions of templates and files to be copied
const binaryPath = path.resolve(__dirname, '../../btcagent/btcagent'); 
// const configFile = path.resolve(__dirname, '../../btcagent/agent_conf.json'); // Full path to agent_conf.json
// const logFile = path.resolve(__dirname, '../../btcagent/log'); // Full path to log file

const agentConfPath = path.resolve(__dirname, '../../btcagent/agent_conf.json');
const agentConf = require(agentConfPath);

class StratumService extends AbstractService {
  constructor() {
    super();
    this.state = STRATUM_SERVICE_STATE.ENABLED
    this.btcAgentProcess = []; // инстансы процессов btcagent
  }

  /**
     * crete sub account on global pool
     * @param{string} subAccountName
     * @returns {Object}
     */
  async createSubAccount(subAccount) {
    try {
      await this.createStrata(subAccount)
      const btcAgentIsActive = await this.checkBTCAgentHealth()
      console.info(`Sub account created with name: ${ subAccount.subAccName }`);
      return { isSuccess: true };
    } catch (error) {
      return { isSuccess: false, error };
    }
  }

  async createStrata(subAccount){
    const lastStratum = await Stratum.findOne({
      order: [['createdAt', 'DESC']]
    })

    const stratum = await Stratum.create({
      strCaption: `btcagent_${lastStratum ? lastStratum.intPort + 1 : 3333}`,
      intPort: lastStratum ? lastStratum.intPort + 1 : 3333,
      isActive: true
    })

    const subStratum = await SubStratum.create({
      subAccountId: subAccount.id,
      stratumId: stratum.id,
      isActive: true
    })

    // await this.createBTCAgent(stratum, subAccount.subAccName)
    return { isSuccess: true }
  }

async createBTCAgent(stratum, subAccountName) {
  try {
    const newDirectory = path.resolve(__dirname, `../../btcagent/btcagent_${stratum.intPort}`);
    await fsPromises.mkdir(newDirectory);

    // Copy btcagent
    await fsPromises.copyFile(binaryPath, path.join(newDirectory, `btcagent_${stratum.intPort}`));

    // Copy and modify agent_conf.json if needed
    const newAgentConfPath = path.join(newDirectory, `agent_conf_${stratum.intPort}.json`);

    agentConf.agent_listen_port = stratum.intPort;
    agentConf.pools = [
      ["us.ss.btc.com", 1800, subAccountName],
      ["us.ss.btc.com", 443, subAccountName],
      ["us.ss.btc.com", stratum.intPort, subAccountName]
    ]; // Modify as needed

    await fsPromises.writeFile(newAgentConfPath, JSON.stringify(agentConf, null, 2));
    
    return { isSuccess: true };
  } catch (err) {
    console.error('error is: ', err);
    return { isSuccess: false, error: err };
  }
}


  async startBTCAgent(stratum) {
    const binaryPath = path.resolve(__dirname, `../../btcagent/btcagent_${stratum.intPort}/btcagent_${stratum.intPort}`); 
    const configFile = path.resolve(__dirname, `../../btcagent/btcagent_${stratum.intPort}/agent_conf_${stratum.intPort}.json`); // Full path to agent_conf.json
    const logFile = path.resolve(__dirname, `../../btcagent/btcagent_${stratum.intPort}/log_${stratum.intPort}`); // Full path to log file

    const args = ['-c', configFile, '-l', logFile, '-alsologtostderr'];
    const btcAgentProcess = spawn(binaryPath, args);


    btcAgentProcess.stdout.on('data', (data) => {
      console.log(`btcagent stdout: ${ data }`);
    });

    btcAgentProcess.stderr.on('data', (data) => {
      console.error(`btcagent stderr: ${ data }`);
    });


    btcAgentProcess.on('close', (code, signal) => {
      if (code === 0) {
        console.log('btcagent process exited successfully.');
      } else {
        console.error(`btcagent process exited with code ${ code } and signal ${ signal }.`);
      }
    });

    this.btcAgentProcess.push(btcAgentProcess)
    return btcAgentProcess;
  }

  async checkBTCAgentHealth() {
    if (!this.btcAgentProcess) {
      return false;
    }
    return true;
  }
}

module.exports = StratumService;
