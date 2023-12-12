const path = require('path');
const xml2js = require('xml2js');
const axios = require('axios');
const { readFile } = require('../../utils/fs-promises')
const { KDP_SERVICE_URL, KDP_SENDER_ID, KDP_SENDER_PASSWORD } = process.env
const xmlFilePath = path.resolve(__dirname, './kdp.xml');

const { generateFormattedDate, has15MinutesPassed } = require('../../utils/date')
const generateUUID = require('../../utils/generateUUID')
const { KDP_RESPONSE } = require('./constants');
const nullOrUndefined = require('../../utils/nullOrUndefined');

class KdpService {

    async generateXML(iin, messageDate, messageId, sessionId) {
        try {
            const isAnyUndefined = nullOrUndefined(messageDate) || nullOrUndefined(messageId) || nullOrUndefined(sessionId);
            const isNewParametersEnabled = has15MinutesPassed(messageDate) || isAnyUndefined
            const reqMessageDate = isNewParametersEnabled ? generateFormattedDate() : messageDate
            const reqMessageId = isNewParametersEnabled ? generateUUID() : messageId
            const reqSessionId = isNewParametersEnabled ? `{${generateUUID()}}` : sessionId

            const xmlTemplate = await readFile(xmlFilePath, 'utf-8');
            let requestXML

            xml2js.parseString(xmlTemplate, (err, result) => {
                if (err) {
                    console.error('Error parsing XML template:', err);
                    return;
                }

                result["soap:Envelope"]["soap:Body"][0].SendMessage[0].request[0].requestInfo[0].sender[0].senderId[0] = KDP_SENDER_ID
                result["soap:Envelope"]["soap:Body"][0].SendMessage[0].request[0].requestInfo[0].sender[0].password[0] = KDP_SENDER_PASSWORD

                result["soap:Envelope"]["soap:Body"][0].SendMessage[0].request[0].requestInfo[0].messageDate[0] = reqMessageDate
                result["soap:Envelope"]["soap:Body"][0].SendMessage[0].request[0].requestInfo[0].messageId[0] = reqMessageId
                result["soap:Envelope"]["soap:Body"][0].SendMessage[0].request[0].requestInfo[0].sessionId[0] = reqSessionId
                result["soap:Envelope"]["soap:Body"][0].SendMessage[0].request[0].requestData[0].data[0].uin[0] = iin

                // Convert the modified XML back to a string
                const xmlBuilder = new xml2js.Builder()
                requestXML = xmlBuilder.buildObject(result)
            })

            return { requestXML, messageDate: reqMessageDate, messageId: reqMessageId, sessionId: reqSessionId }
        } catch (e) {
            console.error('Error generating XML file: ' + e.message)
        }
    }

    async sendXml(iin, sentMessageDate, sentMessageId, sentSessionId) {
        try {
            let kdpStatus, tokenEgov, publicKey, isSuccess
            const { requestXML, messageDate, messageId, sessionId } = await this.generateXML(iin, sentMessageDate, sentMessageId, sentSessionId)
            const response = await axios.post(KDP_SERVICE_URL, requestXML, {
                headers: {
                    'Content-Type': 'text/xml'
                }
            })
            console.info('KDP Response:', response.data);

            xml2js.parseString(response.data, (err, result) => {
                if (err) {
                    console.error('Error parsing XML response:', err);
                    return;
                }

                kdpStatus = result["soap:Envelope"]["soap:Body"][0]["ns2:SendMessageResponse"][0].response[0].responseData[0].data[0]["ns3:status"][0]

                // TODO: delete or implement logic with status at info tag in future
                //const infoStatus = result["soap:Envelope"]["soap:Body"][0]["ns2:SendMessageResponse"][0].response[0].responseInfo[0].status[0].message[0]

                if (kdpStatus === KDP_RESPONSE.PENDING) {
                    isSuccess = true
                } else if (kdpStatus === KDP_RESPONSE.VALID) {
                    isSuccess = true
                    tokenEgov = result["soap:Envelope"]["soap:Body"][0]["ns2:SendMessageResponse"][0].response[0].responseData[0].data[0]["ns3:code"][0]
                    publicKey = result["soap:Envelope"]["soap:Body"][0]["ns2:SendMessageResponse"][0].response[0].responseData[0].data[0]["ns3:public-key"][0]
                } else {
                    console.error(`Error on sending KDP request failed with status: ${kdpStatus}`)
                    isSuccess = false
                }
            })

            return { isSuccess, data: { messageDate, messageId, sessionId, kdpStatus, tokenEgov, publicKey } }
        } catch (error) {
            console.error('Error:', error.message);
        }
    }
}

module.exports = KdpService