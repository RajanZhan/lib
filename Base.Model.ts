
const sequelize = require("Sequelize");
export class BaseModel {

    models: any;
    callLoigc: any;//调用当前model的logic


    constructor() {
        this.models = $db.models;
    }

    /**
     * 设置调用的逻辑
     * @param logic 调用的逻辑
     */
    setLogic(logic) {
        //console.log("set logic", logic);
        this.callLoigc = logic;
    }

    getLogic() {
        return this.callLoigc;
    }

    /**
     * 
     * @param modelName 模型模型名
     * @param prams 调用参数
     * @returns any 返回任
     */
    protected async callModel(modelName: string, prams?: any) {
        if (!modelName) throw new Error("模型名不能为空");
        let arr = modelName.split(".");
        if (!arr[0] || !arr[1]) {
            throw new Error("模型名参数不合法");
        }
        return await $mdl(modelName, this.getLogic(), prams)
    }



    // 调动数据数据模型
    $m(dataModelName: string) {
        return $db.models[dataModelName]
    }

    /**
    * 完成数据字段的映射 从虚拟字段 转为 真实字段
    * @param fields  字段列表
    * @param modelname 模型名称
    * @returns data 映射完成后的数据对象
    */
    changeToRealField(fields: Array<any>, modelname: string) {

        // console.log(typeof fields);
        // console.log(fields);
        if (!$common.isArray(fields)) {
            console.log(fields, modelname);
            throw new Error("fields 只能为数组 ，in changeToRealField in Base.model.model:");
        }
        if (!$modelFieldMap) {
            throw new Error("$modelFieldMap 变量为空 ，无法转换字段映射 model:" + modelname);
        }
        let modelMap = <any>$modelFieldMap.get(modelname);
        if (!modelMap) {
            throw new Error("该数据模型的字段映射不存在 ，无法转换字段映射 model:" + modelname);
        }
        let tmparr = [];
        for (let f of fields) {
            if (f) {
                let real = modelMap.get(f);
                if (real) {
                    tmparr.push(real);
                }
            }
        }
        return tmparr;
    }


    /**
     * 调用数据模型，并且重写findOne findAll 方法 用于数据字段的映射
     * @param dataModelName  数据模型名
     * @returns {findOne:function,findAll:function}
     */
    model(dataModelName: string): { findOne: any, findAll: any, create: any, destroy: any, update: any } {

        var _this = this;

        // 改变数据体的字段为真实字段
        let changeDataFieldToReal = (data: any, dataModelName: string) => {
            let dtmp = {};
            let vtrMap = <any>$modelFieldMap.get(dataModelName);
            //console.log("字段映射",vtrMap);
            for (let k in data) {
                let rf = vtrMap.get(k);// 读取虚拟字段
                if (!rf) {
                    throw new Error(`changeDataFieldToReal vtr字段映射失败 model:${dataModelName},字段:${k}`);
                }
                dtmp[`${rf}`] = data[k];
            }
            return dtmp;
        }

        // 处理数据查询的列
        let getAttribute = (obj: any, dataModelName: string) => {
            let realFields = [];
            // 如果没有查询的列，则默认只查询主键 
            let primaryKey = <any>$modelPrimaryKeyMap.get(dataModelName);
            if (!primaryKey) {
                throw new Error("模型主键查询失败，model " + dataModelName);
            }
            if (obj.$fields) {
                realFields = _this.changeToRealField(obj.$fields, dataModelName);
                realFields.unshift(primaryKey.realField);
            }
            else {

                realFields = [`${primaryKey.realField}`]
            }
            return realFields;
        }

        var checker = (obj, type) => {


            if (type == 'findOne') {

                obj['attributes'] = getAttribute(obj, dataModelName); // 读取查询的数据列
                obj['where'] = changeDataFieldToReal(obj.where ? obj.where : {}, dataModelName);
                //console.log(obj);
                return obj;
            }
            else if (type == 'findAll') {


                let limit = null;
                let offset = null;
                let pagnition = <any>$common.getPageForSql(obj.page, obj.psize);
                limit = pagnition.limit;
                offset = pagnition.offset;

                obj['attributes'] = getAttribute(obj, dataModelName);;
                obj['where'] = changeDataFieldToReal(obj.where ? obj.where : {}, dataModelName);
                obj['limit'] = limit;
                obj['offset'] = offset;
                return obj;
            }
            else if (type == 'create') {
                let data = changeDataFieldToReal(obj, dataModelName);
                return data;
            }
            else if (type == 'update') {
                let data = changeDataFieldToReal(obj, dataModelName);
                return data;
            }
            else if (type == 'destroy') {
                return {
                    where: obj.where
                }
            }
            else {
                throw new Error("Base.Model error in checker,未知查询类型");
            }

        }
        // 处理查询的结果
        var dealResult = (data: any, dataModelName: string) => {

            // let fastJson = require('fast-json-stringify');
            // console.log(fastJson);
            if (!data) {
                return data
            }
            let rtvMap = <any>$realFieldToVfieldMap.get(dataModelName);
            if ($common.isArray(data)) {
                let res = []
                for (let d of data) {
                    if (d) {
                        let dtmp = {};
                        for (let k in d.dataValues) {
                            let vf = rtvMap.get(k);// 读取虚拟字段
                            if (!vf) {
                                // throw new Error(`虚拟字段读取失败 model:${dataModelName},字段:${k}`);
                                dtmp[`${k}`] = d.dataValues[k];
                            }
                            else {
                                dtmp[`${vf}`] = d.dataValues[k];
                            }

                        }
                        res.push(dtmp);
                    }
                }
                return res;
                //return JSON.parse(JSON.stringify(res));
            }
            else {
                let dtmp = {};
                for (let k in data.dataValues) {
                    let vf = rtvMap.get(k);// 读取虚拟字段
                    if (!vf) {
                        // throw new Error(`虚拟字段读取失败 model:${dataModelName},字段:${k}`);
                        dtmp[`${k}`] = data.dataValues[k];;
                    }
                    else {
                        dtmp[`${vf}`] = data.dataValues[k];;
                    }
                }
                return dtmp;
                //return JSON.parse(JSON.stringify(dtmp));
            }
        }

        let findOne = async (obj: any) => {
            let data = checker(obj, 'findOne');
            let res = <any>await $db.models[dataModelName].findOne(data);
            //根据结果处理 将真实的字段转换为将虚拟字段
            res = dealResult(res, dataModelName);
            return res;
        }

        let findAll = async (obj: any) => {
            let data = <any>checker(obj, 'findAll');
            //console.log("查询条件", data);
            let res = <any>await $db.models[dataModelName].findAll(data);
            let where = data.where;
            let count = <any>await $db.models[dataModelName].count({ where: where });
            //根据结果处理 将真实的字段转换为将虚拟字段
            res = dealResult(res, dataModelName);
            return { res, count };
        }

        let create = async (obj: any, opt?: any) => {
            let data = {};
            let igoreField = opt.$ignoreFields;
            if (igoreField || igoreField.length > 0) {
                let set = new Set(igoreField);
                for (let i in obj) {
                    if (set.has(i)) {
                        continue;
                    }
                    data[i] = obj[i]
                }

            }
            data = checker(data, 'create');
            console.log("创建的数据", data);
            let res = <any>await $db.models[dataModelName].create(data, opt);
            //根据结果处理 将真实的字段转换为将虚拟字段
            res = dealResult(res, dataModelName);
            return res;
        }

        let destroy = async (obj: any, opt: any) => {
            let data = checker(obj, 'destroy');
            //console.log("删除条件",data);
            let res = <any>await $db.models[dataModelName].destroy(data, opt);
            return res;
        }

        let update = async (obj: any, where: any, ) => {
            let data = checker(obj, 'update');

            let ignoreFields = where.$ignoreFields;

            if (ignoreFields) {

                // 转换为真实的字段
                ignoreFields = _this.changeToRealField(ignoreFields, dataModelName);

                // 读取所有真实的字段
                let vtrMap = <any>$modelFieldMap.get(dataModelName);
                let vfs = vtrMap.values();

                // 忽略的字段 
                let ignrField = new Set(ignoreFields);

                // 本次修改的字段
                var tmpField = [];

                for (let v of vfs) {

                    if (!ignrField.has(v)) {
                        tmpField.push(v);
                    }
                }
                where['fields'] = tmpField
                //console.log("本次修改的字段", where);
            }
            //console.log(ignoreFields);
            let res = <any>await $db.models[dataModelName].update(data, where);
            return res;
        }

        return {
            findAll,
            findOne,
            create,
            update,
            destroy,
        }
    }


    /**
     * 获取开启事物对象 
     */
    async getTransaction() {
        return new Promise((resolve, reject) => {
            $db.transaction((t) => {
                resolve(t)
            });
        })
    }

    /**
     * 默认首先的执行的方法 在这里需要对参数进行 字段映射的还原 
     * @param action  调用的方法
     * @param params  对应的参数
     */
    async _init(action, params) {
        console.log("父类的 init");
        return params;
    }
}

