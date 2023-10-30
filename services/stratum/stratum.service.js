const { spawn } = require('child_process');
const AbstractService = require('../abstract-service');
const fs = require('fs');
const path = require('path')

const { Stratum, SubStratum, SubAccount } = require('../../models');
const { STRATUM_SERVICE_STATE } = require('./constants');

// TODO: rename conventions of templates and files to be copied
// const binaryPath = path.resolve(__dirname, '../../btcagent/btcagent'); 
// const configFile = path.resolve(__dirname, '../../btcagent/agent_conf.json'); // Full path to agent_conf.json
// const logFile = path.resolve(__dirname, '../../btcagent/log'); // Full path to log file

const agentConfPath = path.resolve(__dirname, '../../btcagent/agent_conf.json');
const agentConf = require(agentConfPath);

class StratumService extends AbstractService {
  constructor() {
    super();
    this.state = STRATUM_SERVICE_STATE.ENABLED
    this.btcAgentProcess = null; // инстанс процесса btcagent
  }

  /**
     * crete sub account on global pool
     * @param{string} subAccountName
     * @returns {Object}
     */
  async createSubAccount(subAccountName, exisitingOrganization) {
    try {
      const subAccount = await SubAccount.create({
        subAccName: subAccountName,
        orgId: exisitingOrganization.id,
      });
      const btcAgentIsActive = await this.checkBTCAgentHealth()
      if(!btcAgentIsActive) await this.startBTCAgent();
      console.info(`Sub account created with name: ${ subAccountName }`);
      return { subAccount, isSuccess: true };
    } catch (error) {
      return { isSuccess: false, error };
    }
  }

  async createStrata(subAccountId){
    const lastStratum = await Stratum.findOne({
      order: [['createdAt', 'DESC']]
    })

    const stratum = await Stratum.create({
      strCaption: `btcagent_${lastStratum ? lastStratum.intPort : 3333}`
    })

    const subStratum = await SubStratum.create({
      subAccountId,
      stratumId: stratum.id,
      isActive: true
    })

    await this.createBTCAgent()
    return { isSuccess: true }
  }

  async createBTCAgent (){
    agentConf.port = agentConf.port + 1
    const newDirectory = path.resolve(__dirname, `../../btcagent/btcagent_${uniquePortNumber}`);
    fs.mkdirSync(newDirectory);

    // Copy btcagent
    fs.copyFileSync(binaryPath, path.join(newDirectory, 'btcagent'));

    // Copy and modify agent_conf.json if needed
    const newAgentConfPath = path.join(newDirectory, `agent_conf${uniquePortNumber}.json`);
    fs.copyFileSync(agentConfPath, newAgentConfPath);

    // Optionally, modify parameters in newAgentConfPath
    const newAgentConf = require(newAgentConfPath);
    newAgentConf.pool = []; // Modify as needed
    fs.writeFileSync(newAgentConfPath, JSON.stringify(newAgentConf, null, 2));
  
  }

  async startBTCAgent(name, configName) {
    const binaryPath = path.resolve(__dirname, `../../btcagent/btcagent`); 
    const configFile = path.resolve(__dirname, '../../btcagent/agent_conf.json'); // Full path to agent_conf.json
    const logFile = path.resolve(__dirname, '../../btcagent/log'); // Full path to log file

    const args = ['-c', configFile, '-l', logFile, '-alsologtostderr'];
    this.btcAgentProcess = spawn(binaryPath, args);


    this.btcAgentProcess.stdout.on('data', (data) => {
      console.log(`btcagent stdout: ${ data }`);
    });

    this.btcAgentProcess.stderr.on('data', (data) => {
      console.error(`btcagent stderr: ${ data }`);
    });


    this.btcAgentProcess.on('close', (code, signal) => {
      if (code === 0) {
        console.log('btcagent process exited successfully.');
      } else {
        console.error(`btcagent process exited with code ${ code } and signal ${ signal }.`);
      }
    });

    return this.btcAgentProcess;
  }

  async checkBTCAgentHealth() {
    if (!this.btcAgentProcess) {
      return false;
    }
    return true;
  }
}

module.exports = StratumService;
