/// <reference path="../../common/js/Cube.js" />
var DgViewModel = function (name) {
    cb.model.ContainerModel.call(this, null, name || "DgViewModel");
    this.init();
};
DgViewModel.prototype = new cb.model.ContainerModel();
DgViewModel.prototype.constructor = DgViewModel;

DgViewModel.prototype.init = function () {
    var fields = {
        ViewModelName: "DgViewModel",
		
        date:new cb.model.SimpleModel(),
		status:new cb.model.SimpleModel({dataSource:[{text:"未发货",value:"0"},{text:"部分发货",value:"1"},{text:"发货完毕",value:"2"}]}),
		
		product:new cb.model.Model3D(options)
		
		
		};
		
    this.setData(fields);
    this.setDirty(false);

    
    //this.getproduct().on("click", function (args) { DgViewModel_Extend.product(this.getParent(), args); });
	/*
	var proxyConfig = {
        GetMenu: { url: "u8services/classes/UAP/com.yonyou.u8.framework.server.service.base.MenuService?method=GetMenu", method: "Get" }
    };
	*/
    //this.setProxy(proxyConfig);
    this.initData();
};

DgViewModel.prototype.initData = function () {
    DgViewModel_Extend.doAction("init_extend", this);
};
