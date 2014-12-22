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
        
		product:new cb.model.Model3D({title:"子行",ctrlType:"DataGrid",owner:"DeliveryDetail 发货单详情",Columns:{
			cusmaterialname:{title:"料品",ctrlType:"Refer",owner:"DeliveryDetailSubLine 发货单子行"},
			finalpriceincludetax:{title:"金额",ctrlType:"NumberBox",owner:"DeliveryDetailSubLine 发货单子行"},
			quotation:{title:"报价",ctrlType:"NumberBox",owner:"DeliveryDetailSubLine 发货单子行"},
			volume:{title:"数量",ctrlType:"TextBox",owner:"DeliveryDetailSubLine 发货单子行"}
		}}),
		
    };
    this.setData(fields);
    this.setDirty(false);

    
    this.getproduct().on("click", function (args) { DgViewModel_Extend.product(this.getParent(), args); });
	
	var proxyConfig = {
        GetMenu: { url: "u8services/classes/UAP/com.yonyou.u8.framework.server.service.base.MenuService?method=GetMenu", method: "Get" }
    };
    this.setProxy(proxyConfig);
    this.initData();
};

DgViewModel.prototype.initData = function () {
    DgViewModel_Extend.doAction("init_Extend", this);
};
