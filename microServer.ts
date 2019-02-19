/** 微服务注册 */
//拦截器
// function Checker(action, instance) {
//     return async (params, authInfo?: any) => {
//         //console.log("拦截到的信息",params,authInfo);
//         instance.setAuthInfo(authInfo);
//         //action.prototype = instance;
//         return await action(params);
//     }
// }

function Checker(action, logicCls) {
    // return ()=>{
    //     return '微服务测试'
    // }
    return async (params, authInfo?: any) => {
        //console.log("拦截到的信息",params,authInfo);
        let instance = new logicCls({ $dopAuth: authInfo });
        if (!instance[action]) {
            throw new Error(`微服务方法${action} 为空，无法调用`);
        }
        //instance.setAuthInfo(authInfo);
        //action.prototype = instance;
        console.log("微服务接口被调用",action,params,authInfo);
        console.log("微服务逻辑层",instance,instance[action]);

        return await instance[action](params);
    }
}

export default () => {
    const { RpcServer } = require('sofa-rpc-node').server;
    const { ZookeeperRegistry } = require('sofa-rpc-node').registry;
    const logger = console;
    const fs = require("fs");
    //const path = require("path");

    // 1. 创建 zk 注册中心客户端
    const registry = new ZookeeperRegistry({
        logger,
        address: $config.msServer.zkHost, // 需要本地启动一个 zkServer
    });
    // 2. 创建 RPC Server 实例
    const server = new RpcServer({
        logger,
        registry, // 传入注册中心客户端
        //port: Number($config.msServer.msPort)+ ( Number(Math.random().toFixed(3)) * 1000) ,
        port: Number($config.msServer.msPort),
    });
    if (!$config.msServer.servers) {
        throw new Error("微服务注册失败，config.msServer.servers 为空");
    }

    //let logicName = l.split('.');
    if (!$config.msServer.servers) {
        return;
    }
    for (let i in $config.msServer.servers) {

        let clas = $logicClass.get(`${i}.Logic`);
        //console.log("微服务注册的logic",clas); 
        //let logicInstance = new clas({});
        for (let logicfunc of $config.msServer.servers[i]) {
            let interfaceName = `${$config.name}.${i}`;
            let ms = {};
            ms[logicfunc] = Checker(logicfunc, clas);
            server.addService({
                interfaceName: interfaceName
            }, ms);
            //console.log(ms);
            console.log("注册微服务 服务...", `App name ${$config.name} interfaceName ${interfaceName}`);
        }
    }
    server.start()
        .then(() => {
            server.publish();
        });
    return;
}