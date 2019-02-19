const Validate = require("../common/validate");
/**
 * 表单数据验证
 * @param {array} -  需要进行检测对象数组，对象的结构为 {data:{string},handler:{function},require:{bool}}  data 为验证的数据，handler 为 验证的方法，require 为是否可以为空
 * @return {array} - 返回的结果 [{bool},{string}}] 例如[true,"验证通过"]、[false,"验证失败"]
 */
interface Task {
    require: boolean,
    data: any,
    msg: string,
    handler: any,
    dataType: any,
    exParams: any
}
export default async (task: Array<Task>, data: object) => {

    if (!$common.isArray(task)) {
        //return [false, ]
        throw new Error("validate 验证异常，请传入数组对象");
    }
    if (task.length == 0) {
        return true;
    }

    for (let i in task) {
        let t = task[i];
        if (!t.data) {
            // return [false, `第 ${i + 1} 个参数data字段不能为空`]
            throw new Error(`第 ${i + 1} 个参数data字段不能为空`);
        }

        if (t.require) {
            if ((!data[t.data]) || (data[t.data] == "undefined")) {
                if (t.msg)
                    //return [false, `${t.msg}`]
                    throw new Error(`${t.msg}`);
                else
                    //return [false, `${t.data} 不能为空`]
                    throw new Error(`${t.data} 不能为空`);
            }
        }

        // 数据类型的检测
        if (t.dataType) {
            let func = $common.getType()[t.dataType];//[t.dataType](data[t.data] );
            //console.log(type,"type is ");
            if (!func) {
                throw new Error(`数据验证方法 ${t.dataType}，不存在,支持的方法有 isArray isNumber isObject isBoolean isString isUndefined isNull isFunction isRegExp
                `)
            }
            if (t.dataType == 'isNumber') {
                let tmp = Number(data[t.data]);
                if (isNaN(tmp)) {
                    throw new Error(`${t.data} 数据验证失败，期望类型${t.dataType}`);
                }

            }
            else if(t.dataType == 'isObject')
            {
                if(typeof data[t.data] == 'string')
                {
                 data[t.data]  = JSON.parse(data[t.data]);
                }
                
                let typeCheck = func(data[t.data]);
            }
            else {
                let typeCheck = func(data[t.data]);
                if (!typeCheck) {
                    throw new Error(`${t.data} 数据验证失败，期望类型${t.dataType},输入类型：${Object.prototype.toString.call(data[t.data])}`);
                }
            }

        }

        if (t.handler) {
            if (!data[t.data]) return [true]

            if ((typeof t.handler) == "function") {
                let res = await t.handler(data[t.data]);
                if (!res[0]) {
                    //return res;
                    throw new Error(res[1]);
                }
            } else if ((typeof t.handler) == "string") {
                let func = null;
                let splitStr = "@";
                if (t.handler.indexOf(splitStr) != -1) {
                    let arr = t.handler.split(splitStr);
                    if (arr.length < 2) {
                        //return [false, "处理函数层级不合法"]
                        throw new Error("处理函数层级不合法");
                    }
                    if ((!arr[0]) || (!arr[1])) {
                        //return [false, "处理函数的层级数据不合法"]
                        throw new Error("处理函数的层级数据不合法");
                    }
                    func = Validate[arr[0]][arr[1]]
                } else {
                    func = Validate[t.handler];
                }

                if (!func) {
                    //return [false, `${t.handler} handler 函数 未定义`]
                    throw new Error(`${t.handler} handler 函数 未定义`);
                }
                //console.log("func type is ", typeof func);
                let res = await func(data[t.data], t.exParams);
                if (!res[0]) {
                    //return res;
                    throw new Error(res[1]);
                }
            } else {
                //return [false, `${t.data} handler 函数异常`]
                throw new Error(`${t.data} handler 函数异常`);
            }
            //return [false,`${t.data} handler参数不能为空`]
        }

    }
    return true;

}