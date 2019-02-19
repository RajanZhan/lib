/** 注册model层方法到系统常量*/
var model = new Map();
// var global = {$lg:{}}
export default () => {

    try {
        if (!$build.model) {
            return;
        }
        var arr = [];
        //console.log($build.model);
        for (let l in $build.model) {
            arr = l.split('.');
            if (!arr[0] || !arr[1]) {
                console.log("注册model 失败");
                continue;
            }
            let interfaceName = `${l}`;
            //console.log($build.model[l],l,'model is');
            let instance = null;
            if ($build.model[l].default) {
                instance = new $build.model[l].default({});
            }
            else {
                instance = new $build.model[l][arr[0]]({});
            }

            model.set(interfaceName, instance);

            //console.log(interfaceName,instance,'haha');
        }
    }
    catch (err) {
        console.log("注册model 异常", arr);
        throw err;
    }
    //global.$lg = logic;
    regGlobal('$model', async (name: string, params?: any) => {
        if (!name) throw new Error("无法调用model，因为name为空");
        let arr = name.split('.');
        if (!arr[0] || !arr[1]) {
            throw new Error("无法调用model，因为name格式不正确");
        }
        let lg = model.get(`${arr[0]}.Model`);
        //console.log(lg,'model instance ');
        if (!lg) throw new Error(`model对象 ${arr[0]}.Model 不存在`);
        let fn = lg[arr[1]]
        if (!fn) throw new Error(`model方法 ${arr[1]} 不存在`);
        let init = lg['_init'];
        if (init) {
            params = await init(arr[1], params);
        }

        return await fn.call(lg, params)
    })
    /**
     * @param name 模型
     * @param logic 逻辑对象
     * @param params 参数
     */
    regGlobal('$mdl', async (name: string, logic: any, params?: any) => {

        if (!logic) throw new Error("逻辑层对象不能为空");

        if (!name) throw new Error("无法调用model，因为name为空");
        let arr = name.split('.');
        if (!arr[0] || !arr[1]) {
            throw new Error("无法调用model，因为name格式不正确");
        }

        let lg = null
        if ($build.model[`${arr[0]}.Model`].default) {
            lg = new $build.model[`${arr[0]}.Model`].default({});
        }
        else {
            lg = new $build.model[`${arr[0]}.Model`][arr[0]]({});
        }

        lg.setLogic(logic);

        if (!lg) throw new Error(`model对象 ${arr[0]}.Model 不存在`);
        let fn = lg[arr[1]]
        if (!fn) throw new Error(`model方法 ${arr[1]} 不存在`);
        let init = lg['_init'];
        if (init) {
            params = await init(arr[1], params);
        }
        return await fn.call(lg, params)
    })
    //console.log("model层注册");
}