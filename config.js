
// 地区: 华南/广州
const scopeName = "cn-south-1"
const Endpoint = `https://ecs.${scopeName}.myhuaweicloud.com`
const domainName = "test80.xyz." // 后面必须加点
const recordValueType = 'A'
// 获取token的请求体
const userBody = {
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
              name: scopeName
          }
      }
  }
}


module.exports = {
  userBody,
  Endpoint,
  domainName,
  recordValueType
}