const express = require('express');
const cors = require('cors');

const cookieParser = require('cookie-parser');
const corsOptions = require('./utils/corsOptions');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const orgRoutes = require('./routes/orgRoutes');
const subAccountRoutes = require('./routes/subAccountRoutes');
const walletRoutes = require('./routes/walletRoutes');
const logRoutes = require('./routes/logRoutes');
const globalPoolRoutes = require('./routes/globalPoolRoutes');
const workerRoutes = require('./routes/workerRoutes');
const telegramRoutes = require('./routes/telegramRoutes');
const earningRoutes = require('./routes/earningRoutes');

const subUserRoutes = require('./routes/subUsersRoutes');

const { spawn } = require('child_process');

require('dotenv').config();

const Container = require('./container');
const ComponentFactory = require('./component/factory');
const ServiceFactory = require('./services/factory');
const findAndSendUndeliveredMessages = require('./notifications/mail-sender/jobs/message-queue-job');
const deleteDeliveredMessages = require('./notifications/mail-sender/jobs/delete-delivered-messages-job');

const cron = require('node-cron');

const { NODE_ENV } = process.env;

(async () => {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(`${ __dirname }/../client/public`));
  app.use(cookieParser());

  app.use(cors((corsOptions)));

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/user', userRoutes);
  app.use('/api/v1/organization', orgRoutes);
  app.use('/api/v1/subaccount', subAccountRoutes);
  app.use('/api/v1/wallet', walletRoutes);
  app.use('/api/v1/log', logRoutes);
  app.use('/api/v1/globalPool', globalPoolRoutes);
  app.use('/api/v1/worker', workerRoutes);
  app.use('/api/v1/notifications', telegramRoutes);
  app.use('/api/v1/earning', earningRoutes);

  app.use('/api/v1/subuser' , subUserRoutes);

  const container = await Container.create();

  process.on('unhandledRejection', (reason) => {
    console.warn(reason);
  });

  process.on('uncaughtException', (reason) => {
    console.error(reason);
  });

  if ( NODE_ENV === 'production') {
    cron.schedule('* * * * *', () => {
      console.log('########## matching active subAccount every minute');
      console.log('Running heartbeat jobs script...');
      const psProcess = spawn('node', ['./ps.js']); // Replace 'path_to_ps.js' with the actual path to your ps.js script
    
      psProcess.stdout.on('data', (data) => {
        console.log(`ps.js stdout: ${data}`);
      });
    
      psProcess.stderr.on('data', (data) => {
        console.error(`ps.js stderr: ${data}`);
      });
    
      psProcess.on('close', (code) => {
        if (code === 0) {
          console.log('ps.js script exited successfully.');
        } else {
          console.error(`ps.js script exited with code ${code}.`);
        }
      });
    });
  }

  /*
  * This cron jobs send again undelivered messages every minute, you can change schedule time in prod
  * */

  cron.schedule('* * * * *',  () => {
    console.log('########## send again undelivered messages every minute');
    console.log("Undelivered message queue job started");
    findAndSendUndeliveredMessages()
  });

  /*
  * This cron jobs delete all delivered messages to clean up DB every two hours, you can change schedule time in prod
  * */

  cron.schedule('0 0 */2 * * *',  () => {
    console.log('########## clean up delivered messages in db every 2 hours');
    console.log("Delete delivered messages job started");
    deleteDeliveredMessages()
  });

  const components = await ComponentFactory.fromContainer(container);
  const services = await ServiceFactory.fromContainer(container);
  const { beforeLoad, afterLoad } = container.$config.$express.hook || {};

  await ServiceFactory.register(services, container);
  await ServiceFactory.afterRegistration(services);

  if (beforeLoad && typeof beforeLoad === 'function') {
    await beforeLoad(app, container);
  }

  await ComponentFactory.load(components, container, app);
  await ComponentFactory.assign(components, container, app);

  if (afterLoad && typeof afterLoad === 'function') {
    await afterLoad(app, container);
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://10.20.1.4:${ PORT }/`);
  });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
