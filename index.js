const fs = require('fs')
const cheerio = require('cheerio')
const { userBody, Endpoint, domainName, recordValueType } = require('./config')
const axios = require('axios')

console.time('start')

// 获取token接口 地区: 华南/广州
// https://iam.cn-south-1.myhuaweicloud.com/v3/auth/tokens

let token, ip, zone_id, record_id

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
        body: JSON.stringify({
            description: `ddns server, updateTime: ${new Date() + ''}`,
            records: [ target_ip ]
        })
    }).then(result => {
        console.log(result)
        // TODO: 完成时的提醒
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
    
    const $ = cheerio.load(result.data)
    let new_ip

    $('a').each((i, ele) => {
        let value = $(ele).text()
        if(verifyIP(value)) {
            new_ip = value
        }
    })

    if(new_ip && new_ip !== ip) {
        let isGetToken
        if(token) {
            isGetToken = false
        } else {
            isGetToken = true
        }

        ddnsProcess(new_ip, isGetToken)
        console.timeEnd('start')
    }
}

const _init = (isTest) => {
    if(isTest) {
        getIP()
    } else {
        setInterval(getIP, 1000)
    }
}
_init(true)