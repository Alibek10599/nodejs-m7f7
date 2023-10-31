// const { exec } = require('child_process');

// exec('ps aux | grep btcagent', (error, stdout, stderr) => {
//   if (error) {
//     console.error(`Error: ${error.message}`);
//     return;
//   }
//   if (stderr) {
//     console.error(`Error: ${stderr}`);
//     return;
//   }
//   console.log(`Running processes:\n${stdout}`);
// });

const ps = require('ps-node');

ps.lookup({ arguments: '-alsologtostderr' }, function(err, resultList ) {
  if (err) {
      throw new Error( err );
  }

  console.log('res is: ', resultList)
  var process = resultList[ 0 ];

  if( process ){

      console.log( 'PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );
  }
  else {
      console.log( 'No such process found!' );
  }
});
