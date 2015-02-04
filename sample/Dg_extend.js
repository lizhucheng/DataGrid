/// <reference path="../../common/js/Cube.js" />
/// <reference path="Dg.js" />

var DgViewModel_Extend = {
    doAction: function (name, viewModel) {
        if (this[name])
            this[name](viewModel);
    },
	product:function (name, viewModel) {
        
    },
	init_extend:function(viewModel){
		var gridModel = viewModel.getproduct();
		gridModel.setColumns(columns);
		gridModel.setColumnState('itaxrate','formatter','PercentFormatter');
		gridModel.setColumnState('itaxrate','textAlign','right');
		gridModel.setPageSize(5);
		gridModel.setDataSource(pageQuery,{param1:11,param2:'name'});
	}
};
