const { spawn } = require('child_process');
const AbstractService = require('../abstract-service');
const path = require('path')

const binaryPath = path.resolve(__dirname, '../../btcagent/btcagent'); 
const configFile = path.resolve(__dirname, '../../btcagent/agent_conf.json'); // Full path to agent_conf.json
const logFile = path.resolve(__dirname, '../../btcagent/log'); // Full path to log file

const args = ['-c', configFile, '-l', logFile, '-alsologtostderr'];

// const args = ['-c', 'agent_conf.json', '-l', 'log', '-alsologtostderr']; relative level

class StratumService extends AbstractService {
  constructor() {
    super();
    this.btcagentProcess = null; // инстанс процесса btcagent
  }

  /**
     * crete sub account on global pool
     * @param{string} subAccountName
     * @returns {Object}
     */
  async createSubAccount(subAccountName) {
    try {
      await this.startBTCAgent();
    } catch (error) {
      return { isSuccess: false, error };
    }
    console.info(`Sub account created with name: ${ subAccountName }`);
    return { isSuccess: true };
  }

  async startBTCAgent() {
    this.btcagentProcess = spawn(binaryPath, args);


    this.btcagentProcess.stdout.on('data', (data) => {
      console.log(`btcagent stdout: ${ data }`);
    });

    this.btcagentProcess.stderr.on('data', (data) => {
      console.error(`btcagent stderr: ${ data }`);
    });


    this.btcagentProcess.on('close', (code, signal) => {
      if (code === 0) {
        console.log('btcagent process exited successfully.');
      } else {
        console.error(`btcagent process exited with code ${ code } and signal ${ signal }.`);
      }
    });

    return this.btcagentProcess;
  }

  async checkBTCAgentHealth() {
    if (!this.btcagentProcess) {
      return false;
    }
    return true;
  }
}

module.exports = StratumService;
