/// <reference path="../../common/js/Cube.js" />
/// <reference path="somainListApp_M.js" />

var somainListViewModel_Extend = {
    doAction: function (name, viewModel) {
        if (this[name])
            this[name](viewModel);
    },
    loadDetailView: function (viewModel, params) {
        var symbol = viewModel.getSymbol();
        if (!symbol) return;
        cb.route.loadArchiveViewPart(viewModel, symbol + "App", params);
    },
    loadDetailTabView: function (viewModel, params) {
        var symbol = viewModel.getSymbol();
        if (!symbol) return;
        cb.route.loadTabViewPart(viewModel, symbol + "App", params);
    },
    menuItemClick: function (viewModel, args) {
        if (!args || !args.type || !args.data || !args.data.appId) return;
        var url = args.data.appId;
        if (url === "homepage") location.href = cb.route.getHomepageUrl();
        else location.href = cb.route.getPageUrl(url);
    },
    cardAction: function (viewModel) {
        this.loadDetailView(viewModel, { "mode": "add" });
    },
    queryScheme: function (viewModel, args) {
        var symbol = viewModel.getSymbol();
        if (symbol != null) {
            var listCard = viewModel.getModel3D();
            var querySchemeID = args && args.queryschemeID;
            listCard.set("querySchemeID", querySchemeID);
            var pageSize = listCard.getPageSize();
            var pageIndex = 1;
            cb.data.CommonProxy(symbol).Query({
                "querySchemeID": querySchemeID,
                "pageSize": pageSize,
                "pageIndex": pageIndex
            }, function (success, fail) {
                if (fail) {
                    alert("查询列表数据失败");
                    return;
                }
                success.mode = "override";
                listCard.setPageRows(success);
            });
        }
    },
    searchAction: function (viewModel, args) {
        alert("搜索" + args + "...");
    },
    queryAction: function (viewModel) {
        cb.route.loadViewPart(viewModel, cb.route.CommonAppEnum.QueryScheme, cb.route.ViewPartType.QueryScheme);
    },
    expandAction: function (viewModel) {
        cb.route.toggleViewPart(viewModel, cb.route.CommonAppEnum.QueryScheme, cb.route.ViewPartType.QueryScheme, { animation: { mode: "toggle"} });
    },
    timeItemClick: function (viewModel, args) {
        if (args && args.title) alert(args.title);
    },
    itemClick: function (viewModel, args) {
        /// <param name="viewModel" type="somainListViewModel">viewModel类型为somainListViewModel</param>
        if (!args || !args.type || !args.data) return;
        var pk = "pk_so_somain";
        var id = args.data[pk];
        if (id == null) {
            alert("id为空");
            return;
        }
        switch (args.type) {
            case "submit":
                alert("提交" + id);
                break;
            case "interest":
                alert("关注" + id);
                break;
            case "copy":
                alert("复制" + id);
                break;
            case "edit":
                alert("修改" + id);
                break;
            case "delete":
                alert("删除" + id);
                break;
            default:
                this.loadDetailView(viewModel, { "mode": "view", "id": id });
                break;
        }
    },
    activeRowClick: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        if (!args) return;
        var pk = "pk_so_somain";
        var id = args[pk];
        if (id == null) {
            alert("id为空");
            return;
        }
        this.loadDetailTabView(viewModel, { "mode": "view", "id": id });
    },
    /*
    changePage: function (viewModel, args) {
        /// <param name="viewModel" type="somainListViewModel">viewModel类型为somainListViewModel</param>
        var symbol = viewModel.getSymbol();
        if (symbol != null) {
            var listCard = viewModel.getModel3D();
            var querySchemeID = listCard.get("querySchemeID");
            var pageSize = args.pageSize;
            var pageIndex = args.pageIndex;
            cb.data.CommonProxy(symbol).Query({
                "querySchemeID": querySchemeID,
                "pageSize": pageSize,
                "pageIndex": pageIndex
            }, function (success, fail) {
                if (fail) {
                    alert("查询列表数据失败");
                    return;
                }
                success.mode = "append";
                listCard.setPageRows(success);
            });
        }
    },*/
    addAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        this.loadDetailTabView(viewModel, { "mode": "add" });
    },
    submitAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        
    },
    withdrawAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        
    },
    approveAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        
    },
    unapproveAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        
    },
    closeAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        alert(args + "功能正在开发中...");
    },
    inventoryAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        alert(args + "功能正在开发中...");
    },
    deliveryAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        alert(args + "功能正在开发中...");
    },
    outboundAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        alert(args + "功能正在开发中...");
    },
    deleteAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        
    },
    bizAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        alert(args + "功能正在开发中...");
    },
    printAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        alert(args + "功能正在开发中...");
    },
    outputAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        alert(args + "功能正在开发中...");
    },
    sortAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        alert(args + "功能正在开发中...");
    },
    filterAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        alert(args + "功能正在开发中...");
    },
    setAction: function (viewModel, args) {
        /// <param name="viewModel" type="DeliveryViewModel">viewModel类型为DeliveryViewModel</param>
        alert(args + "功能正在开发中...");
    },
    init_Extend: function (viewModel) {
        /// <param name="viewModel" type="somainListViewModel">viewModel类型为somainListViewModel</param>
        cb.route.initViewPart(viewModel);
		//viewModel.Symbol = "u8.somain";
        var queryScheme = viewModel.getqueryScheme();
        queryScheme.setData({
            "mode": "slide",
			"fields": {
                "valueField": "pk_queryscheme",
                "textField": "name"
            }
        });
        var symbol = viewModel.getSymbol();
        if (symbol != null) {
            var listCard = viewModel.getsomains();
            var pageSize = listCard.getPageSize();
            var params = { "loadDefaultData": true, "pageSize": pageSize };

            cb.data.CommonProxy(symbol).LoadSchemeList(params , function (success, fail) {
			    if (fail) {
                    alert("获取查询方案列表失败");
                    return;
                }
                var schemeList = success.schemeList;
                if (schemeList) {
                    queryScheme.setDataSource(schemeList);
                    var querySchemeIds = [];
                    for (var i = 0, len = schemeList.length; i < len; i++) {
                        querySchemeIds.push(schemeList[i].queryschemeID);
                    }
                    cb.data.CommonProxy(symbol).LoadSchemeDataCount(querySchemeIds, function (success, fail) {
                        if (fail) {
                            alert("获取查询方案数据记录数失败");
                            return;
                        }
                        queryScheme.set("dataCount", success);
                    });
                }
                var defaultSchemeID = success.defaultSchemeID;
                if (defaultSchemeID) listCard.set("querySchemeID", defaultSchemeID);
                var defaultSchemeData = success.defaultSchemeData;
                //if (defaultSchemeData) {
                //    defaultSchemeData.mode = "override";
                //    listCard.setPageRows(defaultSchemeData);
                //}
                
            });
            var querySchemeID = listCard.get("querySchemeID");
            listCard.setPageServer(cb.data.CommonProxy(symbol).Query);
            listCard.setDataSource({
                "querySchemeID": querySchemeID,
                "pageSize": 10,
                "pageIndex": 2
            });
            
        }

        var timeLine = viewModel.gettimeLine();
        timeLine.setDataSource(TimeLineData);
    }
};
