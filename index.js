const fs = require('fs')
const request = require('request')
const cheerio = require('cheerio')
// 保存华为云返回的 token
let token = fs.readFileSync("./token.txt").toString()

// 获取token的请求体
const user = {
    auth: {
        identity: {
            methods: ["password"],
            password: {
                user: {
                    name: "hw20994458",
                    password: "32sznr518000",
                    domain: {
                        name: "hw20994458"
                    }
                }
            }
        },
        scope: {
            project: {
                name: "cn-south-1"
            }
        }
    }
}


// 获取token接口 地区: 华南/广州
// https://iam.cn-south-1.myhuaweicloud.com/v3/auth/tokens

// const getToken = async () => {
//     try {
//         const result = await request({
//             url: "https://iam.cn-south-1.myhuaweicloud.com/v3/auth/tokens?nocatalog=true",
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json;charset=utf8"
//             },
//             body: JSON.stringify(user)
//         })
        
//         const token = result['x-subject-token']
//         console.log(token)
//         console.log(result)
//         fs.writeFileSync('./token.txt', token + '')
//     } catch(err) {
//         console.log(err)
//     }
// }
// getToken()
const getToken = () => {
    request({
        url: "https://iam.cn-south-1.myhuaweicloud.com/v3/auth/tokens?nocatalog=true",
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf8"
        },
        body: JSON.stringify(user)
    }, function(error, response, body) {
        if(error) {
            console.log(error)
        } else {
            token = response.headers['x-subject-token']
            try{
                fs.writeFileSync('./token.txt', token)
            } catch(err) {

            }
        }
    })
}

if(!token) {
    getToken()
}

const output = (e) => {
    fs.writeFileSync(`${new Date().getTime()}.json`, JSON.stringify(e, null, 2))
}

const dns = {
    name: "test80.xyz",  //域名（必选String）
    description: "测试环境的域名",  //域名的描述信息（可选String）
    zone_type: "public",  //域名类型（可选String）
    email: "2205623938@qq.com",  //管理该域名的管理员邮箱（可选String）
    ttl: 300,   //默认生成的SOA记录中有效缓存时间（可选String）
}

let zone_id = "8aace3ba763e2fd50176e17d720b6686"

const getZoneId = () => {
    const target = 'test80.xyz.'
    const dnsUrl = 'https://dns.cn-south-1.myhuaweicloud.com/v2/zones'
    request({
        url: dnsUrl,
        headers: {
            "Content-Type": "application/json;charset=utf8",
            "X-Auth-Token": token
        },
    }, function(err, response, body) {
        if(err) {
            console.log(err)
        } else {
            body = JSON.parse(body)            
            const targetid = body.zones.filter(item => {
                if(item.name === target) {
                    return item
                }
            })[0].id

            return targetid
        }
    })
}
// getZoneId()

const getRecordSet = (zone_id) => {
    request({
        url: `https://dns.cn-south-1.myhuaweicloud.com/v2/zones/${zone_id}/recordsets`,
        headers: {
            "Content-Type": "application/json;charset=utf8",
            "X-Auth-Token": token
        },
    }, (err, response, body) => {
        if(err) {
            console.log(err)
        } else {
            body = JSON.parse(body)
            let recordsetList = body.recordsets.filter(item => {
                if(item.type === 'A' && item.id) {
                    return item
                }
            });
            return recordsetList[0].id
        }
    })
}
// getRecordSet(zone_id)

const RecordSet_id = '8aace3ba763e2fd50176e18100e66856'

const setRecordVal = (zone_id, RecordSet_id) => {
    request({
        method: "PUT",
        url: `https://dns.cn-south-1.myhuaweicloud.com/v2/zones/${zone_id}/recordsets/${RecordSet_id}`,
        headers: {
            "Content-Type": "application/json;charset=utf8",
            "X-Auth-Token": token
        },
        body: JSON.stringify({
            description: "ddns服务器，搭建完成",
            records: [
                "113.110.226.39"
            ]
        })
    }, (err, response, body) => {
        if(err) {
            console.log(err)
        } else {
            body = JSON.parse(body)
            output(body)
            // let recordsetList = body.recordsets.filter(item => {
            //     if(item.type === 'A' && item.id) {
            //         return item
            //     }
            // });
            // return recordsetList[0].id
        }
    })
}

// setRecordVal(zone_id, RecordSet_id)
function verifyIP(ip) {
    if(typeof ip !== 'string') { return false }
    const v1 = ip.split('.')
    if(v1.length === 4 && ip.length >= 8 && ip.length <= 16) {
        return ip
    } else {
        return false
    }
}
const getIP = () => {
    return request({
        url: "https://2021.ip138.com/"
    }, function (err,rep, html) {
        var $ = cheerio.load(html)
        let ip
        $('a').each((i, ele) => {
            let is = $(ele).text()
            if(verifyIP(is)) {
                ip = is
            }
        })
        return ip
    })
}

const a = async () => {
    const e = await getIP()
    console.log(e)
}
a()