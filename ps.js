const { Stratum } = require('./models')
const ps = require('ps-node');

const StratumService = require('./services/stratum/stratum.service')
const stratumService = new StratumService()

ps.lookup({ arguments: '-alsologtostderr' }, async function(err, resultList ) {
  if (err) {
      throw new Error( err );
  }

  const activeStrata = await Stratum.findAll({
    where: {
        isActive: true
    }
  })

  for (const stratum of activeStrata){
    const isBTCAgentShutDown = resultList.find((item) => stratum.intPort === +item.command.slice(-4))

    console.log('isBTCagentshut down variable: ', isBTCAgentShutDown)

    try{
        if (isBTCAgentShutDown === undefined) {
            console.log('############ btcagent for given subaccount is shut down ........', isBTCAgentShutDown)
            await stratumService.startBtcAgentService(stratum)
        }
    } catch (error){
        console.error('Error heartbeat schedule service: ', error)
    }
  }

  const inactiveStrata = await Stratum.findAll({
    where: {
        isActive: false
    }
  })

  for (const stratum of inactiveStrata){
    const isBTCAgentActive = resultList.find((item) => stratum.intPort === +item.command.slice(-4))

    console.log('ps object: isBTCAgentActive: ', isBTCAgentActive)
    // if(isBTCAgentActive !== undefined) isBTCAgentActive.kill()
  }

  console.log('res is: ', resultList, resultList.length)
  var process = resultList[ 0 ];

  if( process ){

      console.log( 'PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );
  }
  else {
      console.log( 'No such process found!' );
  }
});
