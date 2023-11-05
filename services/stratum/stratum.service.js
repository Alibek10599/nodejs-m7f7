const { spawn } = require('child_process');
const { exec } = require('child_process');

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
  }

  async runShellCommand(command) {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running command: ${command}`);
        console.error(stderr);
        return;
      }
      console.log(stdout);
    });
  }

  /**
     * crete sub account on global pool
     * @param{string} subAccountName
     * @returns {Object}
     */
  async createSubAccount(subAccount) {
    try {
      await this.createStrata(subAccount)
      console.info(`Sub account created with name: ${ subAccount.subAccName }`);
      return { isSuccess: true };
    } catch (error) {
      console.log('Error on stratumService.createSubAccount: ', error)
      return { isSuccess: false, error };
    }
  }

  async createStrata(subAccount){
    try {
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

      await this.createBTCAgent(stratum, subAccount.subAccName)
      const { isSuccess } = await this.startBTCAgent(stratum)
      
      if (isSuccess) return { isSuccess: true }
      return { isSuccess: false }
    } catch (error){
      console.error('Error on createStrata:', error)
      return { isSuccess: false }
    }
  }

async createBTCAgent(stratum, subAccountName) {
  try {
    const newDirectory = path.resolve(__dirname, `../../btcagent/btcagent_${stratum.intPort}`);
    await fsPromises.mkdir(newDirectory);

    const logFileDirectory = path.resolve(__dirname, `../../btcagent/btcagent_${stratum.intPort}/log_${stratum.intPort}`);
    await fsPromises.mkdir(logFileDirectory);

    // Copy btcagent
    await fsPromises.copyFile(binaryPath, path.join(newDirectory, `btcagent_${stratum.intPort}`));

    // Copy and modify agent_conf.json if needed
    const newAgentConfPath = path.join(newDirectory, `agent_conf_${stratum.intPort}.json`);

    agentConf.agent_listen_port = stratum.intPort;
    agentConf.pools = [
      ["eu1.sbicrypto.com", stratum.intPort, subAccountName],
      ["eu1.sbicrypto.com", stratum.intPort, subAccountName],
      ["eu1.sbicrypto.com", stratum.intPort, subAccountName]
    ]; // Modify as needed

    await fsPromises.writeFile(newAgentConfPath, JSON.stringify(agentConf, null, 2));
    
    return { isSuccess: true };
  } catch (error) {
    console.error('error on createBTCAgent : ', err);
    return { isSuccess: false, error: err };
  }
}


  async startBTCAgent(stratum) {
    try{ 
      const binaryPath = path.resolve(__dirname, `../../btcagent/btcagent_${stratum.intPort}/btcagent_${stratum.intPort}`); 
      const configFile = path.resolve(__dirname, `../../btcagent/btcagent_${stratum.intPort}/agent_conf_${stratum.intPort}.json`); // Full path to agent_conf.json
      const logFile = path.resolve(__dirname, `../../btcagent/btcagent_${stratum.intPort}/log_${stratum.intPort}`); // Full path to log file

      exec(`chmod +x "${binaryPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error}`);
          return;
        }
      
        if (stderr) {
          console.error(`Error output: ${stderr}`);
        }
      
        console.log(`File "${binaryPath}" is now executable.`);
      });

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
      return { isSuccess: true };
    } catch (error){
      console.error('error is: ', err);
      return { isSuccess: false, error: err };
    }
  }

  async startBtcAgentService(stratum) {
    try {
      const binaryPath = path.resolve(__dirname, `../../btcagent/btcagent_${stratum.intPort}/btcagent_${stratum.intPort}`); 
      const configFile = path.resolve(__dirname, `../../btcagent/btcagent_${stratum.intPort}/agent_conf_${stratum.intPort}.json`);
      const logFile = path.resolve(__dirname, `../../btcagent/btcagent_${stratum.intPort}/log_${stratum.intPort}`);

      const serviceFileContent = `[Unit]
Description=BTCAgent
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=1
User=root
ExecStart="${binaryPath}" -c "${configFile}" -l "${logFile}"

[Install]
WantedBy=multi-user.target
`;
      const serviceName = `btcagent_${stratum.intPort}}`;  
        
      const serviceFilePath = `/etc/systemd/system/btcagent_${stratum.intPort}.service`;
    
      fs.writeFile(serviceFilePath, serviceFileContent, (err) => {
        if (err) {
          console.error(`Error creating service file: ${err}`);
          return;
        }
    
        console.log(`Service file ${serviceName} successfully at ${serviceFilePath}`);
      });

      // Command to start the service
      const startServiceCommand = `systemctl start ${serviceName}`;

      // Command to enable the service to start automatically
      const enableServiceCommand = `systemctl enable ${serviceName}`;

      await this.runShellCommand(startServiceCommand);
      await this.runShellCommand(enableServiceCommand);
      
      return { isSuccess: true }
    } catch (error) {
      console.error('Error upon starting btcagent service: ', error);
      return { isSuccess: false, error }
    }
  }

  async checkBTCAgentHealth() {
    if (!this.btcAgentProcess) {
      return false;
    }
    return true;
  }
}

module.exports = StratumService;
