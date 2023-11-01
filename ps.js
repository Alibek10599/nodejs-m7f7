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
    const isBTCAgentShutDown = resultList.find(item =>{
        const regex = new RegExp(`${stratum.intPort}$`); // new RegExp(`\\b${stratum.intPort}\\b`); 
        console.log('Searching for port:', stratum.intPort);
        console.log('Item arguments:', item.arguments[1]);
        if (regex.test(item.arguments[1])) return item
    })

    try{
        if (!isBTCAgentShutDown) await stratumService.startBTCAgent(stratum)
    } catch (error){
        console.error('Error heartbeat schedule service: ', error)
    }
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
