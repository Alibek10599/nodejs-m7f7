const axios = require('axios')

const {
    SBI_URL,
    SBI_API_KEY,
    SBI_API_SECRET,
    MIDAS_GLOBAL_POOL_ADDRESS
    } = process.env

class SbiService {
    constructor() {
        this.client = axios.create({
        baseURL: SBI_URL,
        headers: {
            'x-api-key': SBI_API_KEY,
            'x-api-secret': SBI_API_SECRET
        },
        })
    }

    createCollector(subAccName, organization, walletName){
        const dblFeesRate = organization.feesRate ? organization.feesRate : 0
        const vsub2_allocation= dblFeesRate/100 * 1000000000000000
        const vsub1_allocation= 1000000000000000 - vsub2_allocation


        const collectorRequest = {
            "name": subAccName,
            "miningCurrency": "BTC",
            "withdrawAddress": MIDAS_GLOBAL_POOL_ADDRESS,
            "isPaymentEnabled": true,
            "virtualSubaccounts": [
                {
                    "name": "vsub1",
                    "withdrawAddress": walletName,
                    "allocation": vsub1_allocation,
                    "tier": 1,
                    "isPaymentEnabled": true
                },
                {
                    "name": "vsub2",
                    "withdrawAddress": MIDAS_GLOBAL_POOL_ADDRESS,
                    "allocation": vsub2_allocation,
                    "tier": 1,
                    "isPaymentEnabled": true
                }
            ]
        }

        return this.client.post('api/external/v1/subaccount', collectorRequest)
        
    }

    getSubAccounts(){
        return this.client.get('api/external/v1/subaccounts')
    }

    getCollector(collectorId, query){
        return this.client.get(`/api/external/v1/subaccount/${collectorId}/virtual`, {
            params: query
        })
    }

    updateCollector(collectorData){
        return this.client.patch('/api/external/v1/subaccount/virtual', collectorData)
    }
}

module.exports = SbiService
