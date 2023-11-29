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

const { STRATUM_IS_ACTIVE } = process.env;

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

  async openRemotePort(intPort) {
    try {
      console.log(`Current user: ${process.env.USER}`);

      const scriptPath = path.resolve(__dirname, '../../scripts/create_iptables_rule.sh')
      console.info('Script path is : ', scriptPath)
      const command = `sudo sh ${scriptPath} ${intPort}`

      return this.runShellCommand(command)
    } catch (error) {
      console.error(`Error at openRemotePort withb port number ${intPort} :`, error)
    }
  }

  async closeRemotePort(intPort) {
    try {
      const scriptPath = path.resolve(__dirname, '../../scripts/delete_iptables_rule.sh')
      console.info('Script path is : ', scriptPath)
      const command = `sudo sh ${scriptPath} ${intPort}`

      return this.runShellCommand(command)
    } catch (error) {
      console.error(`Error at closeRemotePort withb port number ${intPort} :`, error)
    }
  }

  /**
     * crete sub account on global pool
     * @param{string} subAccountName
     * @returns {Object}
     */
  async createSubAccount(subAccount) {
    try {
      await this.createStrata(subAccount)
      console.info(`Sub account created with name: ${subAccount.subAccName}`);
      return { isSuccess: true };
    } catch (error) {
      console.log('Error on stratumService.createSubAccount: ', error)
      return { isSuccess: false, error };
    }
  }

  async createStrata(subAccount) {
    try {
      const lastStratum = await Stratum.findOne({
        order: [['createdAt', 'DESC']]
      })

      const stratum = await Stratum.create({
        strCaption: `btcagent_${lastStratum ? lastStratum.intPort + 1 : 3333}`,
        intPort: lastStratum ? lastStratum.intPort + 1 : 3333,
        isActive: true
      })

      await SubStratum.create({
        subAccountId: subAccount.id,
        stratumId: stratum.id,
        isActive: true
      })

      await this.createBTCAgent(stratum, subAccount.subAccName)
      const { isSuccess } = await this.startBtcAgentService(stratum)

      if (isSuccess) return { isSuccess: true }
      return { isSuccess: false, error: `Error upon ` }
    } catch (error) {
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
        ["eu1.sbicrypto.com", 1800, subAccountName],   //
        ["eu1.sbicrypto.com", 443, subAccountName],
        ["eu1.sbicrypto.com", 3333, subAccountName]
      ]; // Modify as needed

      await fsPromises.writeFile(newAgentConfPath, JSON.stringify(agentConf, null, 2));

      await this.createBTCAgentService(stratum.intPort);

      return { isSuccess: true };
    } catch (error) {
      console.error('error on createBTCAgent : ', error);
      return { isSuccess: false, error };
    }
  }

  async createBTCAgentService(intPort) {
    try {
      const binaryPath = path.resolve(__dirname, `../../btcagent/btcagent_${intPort}/btcagent_${intPort}`);
      const configFile = path.resolve(__dirname, `../../btcagent/btcagent_${intPort}/agent_conf_${intPort}.json`); // Full path to agent_conf.json
      const logFile = path.resolve(__dirname, `../../btcagent/btcagent_${intPort}/log_${intPort}`);

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

      const serviceFilePath = `/etc/systemd/system/btcagent_${intPort}.service`;

      await fsPromises.writeFile(serviceFilePath, serviceFileContent)


    } catch (error) {
      throw new Error(`error on creating systemd btcagent service with port ${intPort}`, error.message)
    }
  }

  async startBtcAgentService(stratum) {
    try {
      const { intPort } = stratum
      const serviceName = `btcagent_${intPort}`;

      const binaryPath = path.resolve(__dirname, `../../btcagent/btcagent_${intPort}/btcagent_${intPort}`);
      const configFile = path.resolve(__dirname, `../../btcagent/btcagent_${intPort}/agent_conf_${intPort}.json`); // Full path to agent_conf.json
      const logFile = path.resolve(__dirname, `../../btcagent/btcagent_${intPort}/log_${intPort}`);

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

      const serviceFilePath = `/etc/systemd/system/btcagent_${intPort}.service`;

      await fsPromises.writeFile(serviceFilePath, serviceFileContent)


      if (STRATUM_IS_ACTIVE) {
        const unmaskServiceCommand = `sudo systemctl unmask ${serviceName}` // unmask service to avoid app priveledge issues
        // Command to start the service
        const startServiceCommand = `sudo systemctl start ${serviceName}`

        // Command to enable the service to start automatically
        const enableServiceCommand = `sudo systemctl enable ${serviceName}`


        await Promise.all([
          this.runShellCommand(startServiceCommand),
          this.runShellCommand(enableServiceCommand),
          this.runShellCommand(unmaskServiceCommand),
          this.openRemotePort(intPort)
        ])
      }

      return { isSuccess: true }
    } catch (error) {
      console.error(`Error upon starting ${serviceName} service: `, error)
      return { isSuccess: false, error }
    }
  }

  async deactivateBtcAgentService(stratum) {
    try {
      const { intPort } = stratum
      const serviceName = `btcagent_${intPort}`
      const stopServiceCommand = `sudo systemctl stop ${serviceName}`
      const disableServiceCommand = `sudo systemctl disable ${serviceName}`

      await Promise.all([
        this.runShellCommand(stopServiceCommand),
        this.runShellCommand(disableServiceCommand),
        this.closeRemotePort(intPort)
      ])

    } catch (error) {
      console.error(`Error upon deactivating ${serviceName} service: `, error)
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
