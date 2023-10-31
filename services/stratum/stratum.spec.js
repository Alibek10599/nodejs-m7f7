const StratumService = require('./stratum.service')

const stratumService = new StratumService()

const {Stratum} = require('../../models')


 const start = async() =>{
    try{
        const stratum = await Stratum.findByPk(9)
        console.log(stratum)
        await stratumService.startBTCAgent(stratum)
        } catch (err){
            console.error(err)
        }
 }   
 
describe(

    it('should start BTC agent', async ()=>{
        const stratum = await Stratum.findByPk(9)
        console.log(stratum)
        const process = await stratumService.startBTCAgent(stratum)
        expect(process).toBeDefined()
    })

)
        
