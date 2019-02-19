
export default {
    AUTH: {},
	 async _init(params) {
        //console.log("logic init ",params);
        return params;
    },
   async setAuthInfo(auth: any) {
        console.log("设置auth");
        // 设置 主账号信息
        
        let mainUserInfo = {};
        if (auth.userInfo.type == 'main') {
            mainUserInfo = auth.userInfo;
        }
        else
        {
            mainUserInfo = await $model("User.getMainUserInfoById",auth.userInfo.uid)
        }
        //console.log("set main User info ", mainUserInfo);
        regGlobal("$mainUserInfo", mainUserInfo)
        this.AUTH = auth;
    },
    getAuthInfo() {

        return this.AUTH;
    },

    //通过logic 访问 的方法，默认 主 账号信息读取出来
}