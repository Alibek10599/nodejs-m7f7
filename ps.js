const { Stratum } = require('./models')
const { exec } = require('child_process');

const StratumService = require('./services/stratum/stratum.service')
const graylog = require('./services/logger/graylog')
const stratumService = new StratumService()

const heartbeatService = async () => {
  const child = exec('systemctl --type=service --state=running', async (error, stdout, stderr) => {
    if (error) {
      reject(error);
      return;
    }

    // Process the stdout as needed (e.g., parsing or filtering)
    const runningServices = stdout.split('\n').filter(service => service.trim() !== '').filter(serviceName => serviceName.includes('btcagent'));

    console.log('runningServices : ', runningServices)
    graylog.log(`runningServices : ${runningServices}`)


    const activeStrata = await Stratum.findAll({
      where: {
        isActive: true
      }
    })

    for (const stratum of activeStrata) {
      const isBTCAgentShutDown = runningServices.find((item) => item.includes(`btcagent_${stratum.intPort}.service`))

      console.log('isBTCagentShutDown variable: ', isBTCAgentShutDown)
      graylog.log(`isBTCagentShutDown variable: ${isBTCAgentShutDown}`)

      try {
        if (isBTCAgentShutDown === undefined) {
          console.log('############ btcagent for given subaccount is shut down ........', isBTCAgentShutDown)
          await stratumService.startBtcAgentService(stratum)
        }
      } catch (error) {
        console.error('Error heartbeat schedule service: ', error)
        graylog.emergency(`Error heartbeat schedule service: ${JSON.stringify(error)}`)
      }
    }

    const inactiveStrata = await Stratum.findAll({
      where: {
        isActive: false
      }
    })

    for (const stratum of inactiveStrata) {
      const isBTCAgentActive = runningServices.find((item) => item.includes(`btcagent_${stratum.intPort}.service`))

      console.log(`isBTCAgentActive among inactive stratum: ${JSON.stringify(stratum)} `, isBTCAgentActive)
      graylog.log(`isBTCAgentActive among inactive stratum: ${JSON.stringify(stratum)} `)
      if (isBTCAgentActive !== undefined) await stratumService.deactivateBtcAgentService(stratum)
    }

    if (stderr) graylog.error(stderr)
  });

  process.kill(-child.pid)
}

module.exports = heartbeatService
