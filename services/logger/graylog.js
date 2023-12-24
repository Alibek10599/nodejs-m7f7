const graylog2 = require("graylog2");
const os = require('os')
const { GRAYLOG_HOST, GRAYLOG_PORT } = process.env


const graylog = new graylog2.graylog({
    servers: [
        { 'host': GRAYLOG_HOST, port: GRAYLOG_PORT },
    ],
    hostname: os.hostname(),
    facility: 'Node.js',
    bufferSize: 1350
});

graylog.on('error', function (error) {
    console.error('Error while trying to write to graylog2:', error);
});

module.exports = graylog