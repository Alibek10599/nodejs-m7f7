const xml2js = require('xml2js');
const { KDP_SERVICE_URL } = process.env
const xmlFilePath = './kdp.xml';

class KdpService {

    constructor() {
        this.xmlTemplate = fs.readFile(xmlFilePath, 'utf-8');
    }

    async generateXML(iin) {
        let requestXML
        xml2js.parseString(this.xmlTemplate, (err, result) => {
            if (err) {
                console.error('Error parsing XML template:', err);
                return;
            }

            const messageDate = generateFormattedDate()
            const messageId = generateUUID()
            const sessionId = `{${generateUUID()}}`

            result["soap:Envelope"]["soap:Body"][0].SendMessage[0].request[0].requestInfo[0].messageDate[0] = messageDate
            result["soap:Envelope"]["soap:Body"][0].SendMessage[0].request[0].requestInfo[0].messageId[0] = messageId
            result["soap:Envelope"]["soap:Body"][0].SendMessage[0].request[0].requestInfo[0].sessionId[0] = sessionId
            result["soap:Envelope"]["soap:Body"][0].SendMessage[0].request[0].requestData[0].data[0].uin[0] = iin

            // Convert the modified XML back to a string
            const xmlBuilder = new xml2js.Builder()
            requestXML = xmlBuilder.buildObject(result)


        })

        return { requestXML, messageDate, messageId, sessionId }
    }

    async sendXml(iin) {
        try {
            const { requestXML, messageDate, messageId, sessionId } = await this.generateXML(iin)
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

                const dataStatus = result["soap:Envelope"]["soap:Body"][0]["ns2:SendMessageResponse"][0].response[0].responseData[0].data[0]["ns3:status"][0]
                const infoStatus = result["soap:Envelope"]["soap:Body"][0]["ns2:SendMessageResponse"][0].response[0].responseInfo[0].status[0].message[0]
            })

            return { messageDate, messageId, sessionId }
        } catch (error) {
            console.error('Error:', error.message);
        }
    }
}

module.exports = KdpService