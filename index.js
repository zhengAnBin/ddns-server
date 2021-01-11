const fs = require('fs')
const cheerio = require('cheerio')
const { userBody, Endpoint, domainName, recordValueType } = require('./config')
const axios = require('axios')
const schedule = require('node-schedule');
// 获取token接口 地区: 华南/广州
// https://iam.cn-south-1.myhuaweicloud.com/v3/auth/tokens

let token, ip = '119.139.199.45', zone_id, record_id

const getToken = () => {
    return axios({
        url: "https://iam.cn-south-1.myhuaweicloud.com/v3/auth/tokens?nocatalog=true",
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        data: JSON.stringify(userBody)
    }).then(result => result.headers['x-subject-token'])
}

const analysisNoneId = (data, domainName) => {
    return data.zones.filter(item => {
        if(item.name === domainName) {
            return item
        }
    })[0].id
}

const getZoneId = () => {
    const dnsUrl = 'https://dns.cn-south-1.myhuaweicloud.com/v2/zones'
    return axios({
        url: dnsUrl,
        headers: {
            "Content-Type": "application/json;charset=utf8",
            "X-Auth-Token": token
        }
    }).then(result => analysisNoneId(result.data, domainName))
}

const analysisRecordValue = (data, recordValueType) => {
    return data.recordsets.filter(item => {
        if(item.type === recordValueType && item.id) {
            return item
        }
    })
}

const getRecordValue = (zone_id) => {
    return axios({
        method: "GET",
        url: `https://dns.cn-south-1.myhuaweicloud.com/v2/zones/${zone_id}/recordsets`,
        headers: {
            "Content-Type": "application/json;charset=utf8",
            "X-Auth-Token": token
        },
    }).then(result => analysisRecordValue(result.data, recordValueType))
}

const setRecordVal = (zone_id, record_id, target_ip) => {
    axios({
        method: "PUT",
        url: `https://dns.cn-south-1.myhuaweicloud.com/v2/zones/${zone_id}/recordsets/${record_id}`,
        headers: {
            "Content-Type": "application/json;charset=utf8",
            "X-Auth-Token": token
        },
        data: JSON.stringify({
            description: `ddns server, updateTime: ${new Date() + ''}`,
            records: [ target_ip ]
        })
    }).then(result => {
        if(String(result.status).startWith('2')) {
            const content = `
                ${new Date()}
                ${result.data}
            `
            fs.writeFileSync('./success.txt', content)
        }
    })
}

const verifyIP = (ip) => {
    if(typeof ip !== 'string') { return false }
    const v1 = ip.split('.')
    if(v1.length === 4 && ip.length >= 8 && ip.length <= 16) {
        return ip
    } else {
        return false
    }
}

const ddnsProcess = async (new_ip, isGetToken) => {
    if(isGetToken) {
        token = await getToken()
    }
    zone_id = await getZoneId()
    record_id = await getRecordValue(zone_id)
    record_id.forEach((record) => setRecordVal(zone_id, record.id, new_ip));
}

const getIP = async () => {
    
    const result = await axios.get('https://2021.ip138.com/')
    fs.writeFileSync('./html.txt', `${result.data}`)

    const $ = cheerio.load(result.data)
    let new_ip

    $('a').each((i, ele) => {
        let value = $(ele).text()
        if(verifyIP(value)) {
            new_ip = value
        }
    })

    if(new_ip && new_ip !== ip) {
        ip = new_ip
        let isGetToken
        if(token) {
            isGetToken = false
        } else {
            isGetToken = true
        }
        ddnsProcess(new_ip, isGetToken)
        fs.writeFileSync('./record.txt', `稳定执行! 时间:${new Date() + ''}, 最新ip为: ${new_ip}`)
    }
}

const  scheduleCronstyle = ()=>{
    // 每天的凌晨1点1分30秒触发
    schedule.scheduleJob('30 * * * * *', getIP);
}

scheduleCronstyle()