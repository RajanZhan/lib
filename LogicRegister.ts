/** 注册逻辑层方法到系统常量*/
var logic = new Map();
// var global = {$lg:{}}
export default () => {
    if (!$build.logic) {
        return;
    }
    for (let l in $build.logic) {
        let interfaceName = `${l}`;
        let instance = $build.logic[l].default;
        logic.set(interfaceName, instance);
        //console.log("注册logic 类",logic);
        regGlobal("$logicClass",logic);
    }

    //global.$lg = logic;
    regGlobal('$lg', async (name: string, params?: any) => {
        if (!name) throw new Error("无法调用逻辑，因为name为空");
        let arr = name.split('.');
        if (!arr[0] || !arr[1]) {
            throw new Error("无法调用逻辑，因为name格式不正确");
        }
        let lg = logic.get(`${arr[0]}.Logic`);
        //console.log(logic,`${arr[0]}.Logic`);
        if (!lg) throw new Error(`逻辑对象 ${lg} 不存在`);
        lg.setAuthInfo($req.$dopAuth);
        let fn = lg[arr[1]]
        if (!fn) throw new Error(`逻辑方法 ${arr[1]} 不存在`);

        // 调用初始化方法
        let init = lg['_init'];
        if(init)
        {
            params =  await init(params);
        }

        return await fn.call(lg,params)

    })
    //global.$lg = logic;
    regGlobal('$lgc', async (name: string, req:any,params?: any,) => {
        if (!name) throw new Error("无法调用逻辑，因为name为空");
        let arr = name.split('.');
        if (!arr[0] || !arr[1]) {
            throw new Error("无法调用逻辑，因为name格式不正确");
        }
        //let lg = logic.get(`${arr[0]}.Logic`);
        let lg = require(`../logic/${arr[0]}.Logic`);
        
        //console.log(logic,`${arr[0]}.Logic`);
        if (!lg) throw new Error(`逻辑对象 ${lg} 不存在`);
        if(!req || !req.$dopAuth)
        {
            throw new Error(`$lgc error，req.$dopAuth 授权信息不存在 `);
        }
        //console.log(lg,'lg is ');

        let lgc = new lg.default(req);

        //lg.setAuthInfo($req.$dopAuth);
        let fn = lgc[arr[1]]
        if (!fn) throw new Error(`逻辑方法 ${arr[1]} 不存在`);
        
        // 调用初始化方法
        let init = lgc['_init'];
        if(init)
        {
            params =  await init(arr[1],params);
        }
        //return await fn(params);
        let res =  await fn.call(lgc,params);
        return res;

    })
    //console.log("逻辑层注册");
}