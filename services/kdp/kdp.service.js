const xml2js = require('xml2js');
const xmlFilePath = './kdp.xml';

let requestXML;

const xmlTemplate = fs.readFileSync(xmlFilePath, 'utf-8');

// Parse the XML template
xml2js.parseString(xmlTemplate, (err, result) => {
    if (err) {
        console.error('Error parsing XML template:', err);
        return;
    }

    result["soap:Envelope"]["soap:Body"][0].SendMessage[0].request[0].requestInfo[0].messageDate[0] = generateFormattedDate()
    result["soap:Envelope"]["soap:Body"][0].SendMessage[0].request[0].requestInfo[0].messageId[0] = generateUUID()
    result["soap:Envelope"]["soap:Body"][0].SendMessage[0].request[0].requestInfo[0].sessionId[0] = `{${generateUUID()}}`
    result["soap:Envelope"]["soap:Body"][0].SendMessage[0].request[0].requestData[0].data[0].uin[0] = ''

    // Convert the modified XML back to a string
    const xmlBuilder = new xml2js.Builder();
    requestXML = xmlBuilder.buildObject(result);

})

const sendXml = async () => {
    try {
        const response = await axios.post('http://178.170.221.19:8081/api/sign', requestXML, {
            headers: {
                'Content-Type': 'text/xml'
            }
        })
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.message);
    }
}  