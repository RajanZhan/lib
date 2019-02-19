/** 注册本应用到平台 */
const http = require("axios");
export default async ()=>{

    if(!$config.type || $config.type != 'app' || $config.debug== 1 || $config.appRegister.use != 1)
    {
        return;
    }
    let rights = [];
    //let keys =  $appRights.keys();
    //console.log(typeof $appRights);
    for(let r in $appRights)
    {
        rights.push({
            path:r,
            children:$appRights[r]
        })
    }
    let reInfo = {secret:$config.appRegister.secret,name:$config.appRegister.appName,appId:$config.name,
        url:$config.appRegister.url,icon:$config.appRegister.icon,remark:$config.appRegister.desc,rights:rights};
    let reServer = '';
    // 启动应用注册
    if($config.debug == 1)
    {
        reServer = `http://${$config.host}:${$config.port}/api/app/registerApp` ;
        
    }
    else
    {
        if(!$config.appRegister.serverName || !$config.appRegister.secret)
        {
            throw new Error("无法启动插件，因为注册服务地址 或者 注册token为空");
        }
        reServer = `${$config.appRegister.serverName}`;
    }
    
    console.log("应用注册中...",);
    let res = await http.post(reServer,reInfo);
    console.log("应用注册完成,状态码：",res.status);
}