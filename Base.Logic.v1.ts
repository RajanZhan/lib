/**
 * 逻辑层 基础类
 * 
 * */
export default class {

    
    authInfo:null;
    reqInfo:any;
    constructor(authInfo:any)
    {
        this.authInfo = authInfo.$dopAuth;
        this.reqInfo = authInfo;// 设置请求的数据
    }

    // 读取授权信息
    getAuthInfo()
    {
        return this.authInfo;
    }

    setAuthInfo(authInfo)
    {
        this.authInfo = authInfo;
    }

    //读取req info 
    getReq()
    {
        return this.reqInfo;
    }

}