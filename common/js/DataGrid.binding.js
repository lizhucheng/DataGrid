cb.isEqual=function(obj1,obj2){
		var isEqual=cb.isEqual;
		//相等直接返回
		if(obj1==obj2){return true;}
		//不等且有一个为普通类型时，返回
		if(typeof obj1!=='object'||typeof obj2!=='object'){
			return false;
		}
		
		//如果两个都是对象，分数组和普通对象分别处理
		var type1=Object.prototype.toString.apply(obj1),
			type2=Object.prototype.toString.apply(obj2);
		//有一个为数组时	
		if(type1==='[object Array]' || type2==='[object Array]'){
			if(type1===type2){//都为数组
				if(obj1.length!==obj2.length)return false;
				for(var i=obj1.length-1;i>=0;i--){
					if(!isEqual(obj1[i],obj2[i]))return false;
				}
				return true;
			}else{
				return false;
			}
		}else{//都为对象
			var equalProps={};
			for(var p in obj1){
				if(!isEqual(obj1[p],obj2[p])){
					return false;
				}else{
					//记录这个属性，避免重复比较
					equalProps[p]=true;
				}
			}
			for(var p in obj2){
				if(!equalProps[p] && !isEqual(obj1[p],obj2[p])){
					return false;
				}
			}
			return true;
		}
		
	};
cb.binding.DataGridBinding = function (mapping, parent) {
	
    cb.binding.BaseBinding.call(this, mapping, parent);
	//重写PropertyChangeEvent、get_method方法
	cb.binding.DataGridBinding.prototype.Model2UI = cb.binding.DataGridBinding.prototype.PropertyChangeEvent = function (evt) {
		cb.console.log("PropertyChangeEvent", evt);
		if (!evt) return;
		var control = this.getControl();
		if (!control) return;
		if (cb.isEqual(this.getProperty(control, evt.PropertyName) ,evt.PropertyValue))//如果属性值相等，则不触发刷新
			return;
		this.setProperty(control, evt.PropertyName, evt.PropertyValue);

		cb.console.log("PropertyChangeEvent", evt);
	}
	cb.binding.DataGridBinding.prototype.get_method = function (prefix, control, propertyName) {
		if (!control || !propertyName || !prefix) return;
		var propertyNameLower = String.toLowerCase(propertyName);
		if (!propertyNameLower) return;
		if (propertyNameLower.indexOf(prefix) == 0)
			propertyNameLower = propertyNameLower.substring(3);
		propertyName=propertyName.substring(0, 1).toLowerCase() + propertyName.substring(1, propertyName.length);
		var method = this["_" + prefix + "_" + propertyName];
		if (method) return method;

		var controlMethodName = prefix + propertyName.substring(0, 1).toUpperCase() + propertyName.substring(1, propertyName.length);
		if (!control[controlMethodName]) return;

		//动态创建方法
		method = this["_" + prefix + "_" + propertyNameLower] = function (ctrl, propertyValue) {
			if (ctrl[controlMethodName])
				ctrl[controlMethodName].call(ctrl, propertyValue);
		};
		return method;
	};
    this._onSortFieldsChange = function (args) {
        var model = this.getModel();
        if (!model) return;
		model.setSortFields(args.sortFields,args.noReflesh);
    };
	this._onMergeStateChange=function(merge){
		var model = this.getModel();
		model.setMergeState(merge);
	};
	
	this._set_displayRows=function(control,rows){
		control.loadData(rows);
		//每次重新加载数据后要重新同步选中状态，及焦点状态
		var model=this.getModel();
		control.select(model.getPageSelectedIndex());
		control.setFocusedRow(model.getFocusedRow());
	};
	//合并状态修改后，处理显示
	this._set_mergeInfo=function(control,args){
		if(args.mergeCells){
			control.mergeCells(args.mergeCells);
		}else{
			control.loadData(args.rows);
			var model=this.getModel();
			control.select(model.getPageSelectedIndex());
			control.setFocusedRow(model.getFocusedRow());
		}
	};
	//处理model的行选择事件,焦点管理
	this._set_select=function(control,rowIndexs){
		if(this._isSelectedSyc())return;
		
		control.select(rowIndexs);
	};
	this._set_unselect=function(control,rowIndexs){
		if(this._isSelectedSyc())return;
		
		control.unselect(rowIndexs);
	};
	this._set_selectAll=function(control){
		if(this._isSelectedSyc())return;
		
		control.selectAll();
	};
	this._set_unselectAll=function(control){
		if(this._isSelectedSyc())return;
		
		control.unselectAll();
	};
	
	this._set_focusedRow=function(control,rowIndex){
		control.setFocusedRow(rowIndex);
	};
	//选中状态是否已经同步（内部辅组方法）
	this._isSelectedSyc=function(){
		return cb.isEqual(this.getControl().getSelectedRows(),this.getModel().getPageSelectedIndex());
	};
	//处理控件触发的行选择和焦点改变事件
	this._onSelect=function(rowIndexs){
		if(this._isSelectedSyc())return;
		
		var model = this.getModel();
		model.select(rowIndexs);
	};
	this._onUnselect=function(rowIndexs){
		if(this._isSelectedSyc())return;
		
		var model = this.getModel();
		model.unselect(rowIndexs);
	};
	this._onSelectAll=function(){
		if(this._isSelectedSyc())return;
		
		var model = this.getModel();
		model.selectAll();
	};
	this._onUnselectAll=function(){
		if(this._isSelectedSyc())return;
		
		var model = this.getModel();
		model.unselectAll();
	};
	this._onFocusChange=function(index){
		var model = this.getModel();
		model.setFocusedRow(index);
	};
	//
	this._set_pageInfo=function(control,pageInfo){
		//更新视图
		var model = this.getModel();
		model._pager
		if(model._pager){
			model._pager.update(pageInfo);
		}
	},
	
	this._onCellChange = function (rowIndex, cellName, cellValue) {
        var model = this.getModel();
        if (!model) return;
        if (model.cellChange) model.cellChange(rowIndex, cellName, cellValue);
    };

    this._onAddNewRow = function (rowIndex) {
        var model = this.getModel();
        if (!model) return;
        if (rowIndex == null) rowIndex = model.getRows().length;
        if (model.insert) model.insert(rowIndex);
    };

    this._onDeleteRows = function (rowIndexes) {
        var model = this.getModel();
        if (!model) return;
        if (model.remove) model.remove(rowIndexes);
    };

    this._onShowCardView = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        control.showCardView(model);
    };

    this._onCellEditorLoad = function (column, controlId) {
        var model = this.getModel();
        if (!model) return;
        var viewBinding = this._getEditRowModelContainerBinding(model.getEditRowModel());
        viewBinding.add({ controlId: controlId, controlType: column.columnType, propertyName: column.id, bindingMode: "TwoWay" });
    };

    this._onCellEditorDestroy = function (controlId) {
        var model = this.getModel();
        if (!model) return;
        var viewBinding = this._getEditRowModelContainerBinding(model.getEditRowModel());
        viewBinding.remove(controlId);
    };

    this._getEditRowModelContainerBinding = function (viewModel) {
        this._editRowModelContainerBinding = this._editRowModelContainerBinding || cb.viewbinding.create("cell", viewModel);
        return this._editRowModelContainerBinding;
    };

    this._onChangePage = function (pageSize, pageIndex) {
        var model = this.getModel();
        if (!model) return;
        if (model.onChangePage) model.onChangePage(pageSize, pageIndex);
    };

    this._onActiveRowClick = function (args) {
        var model = this.getModel();
        if (!model || !model.fireEvent) return;
        var activeRowIndex = args.row;
        if (activeRowIndex == null) return;
        var activeRow = model.getRows()[activeRowIndex];
        if (!activeRow) return;
        model.fireEvent("onActiveRowClick", activeRow);
    };

    this._onQuerySchemeChanged = function (args) {
        var model = this.getModel();
        if (!model || !model.fireEvent) return;
        model.fireEvent("onQuerySchemeChanged", args);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {

			control.un("mergeStateChange", this._onMergeStateChange);
            control.on("mergeStateChange", this._onMergeStateChange, this);
            control.un("sortFieldsChange", this._onSortFieldsChange);
            control.on("sortFieldsChange", this._onSortFieldsChange, this);
			
            control.un("select", this._onSelect);
            control.on("select", this._onSelect, this);
			control.un("unselect", this._onUnselect);
            control.on("unselect", this._onUnselect, this);
			control.un("selectAll", this._onSelectAll);
            control.on("selectAll", this._onSelectAll, this);
			control.un("unselectAll", this._onUnselectAll);
            control.on("unselectAll", this._onUnselectAll, this);
			control.un("focusChange", this._onFocusChange);
            control.on("focusChange", this._onFocusChange, this);
			
			//
			control.un("onCellChange", this._onCellChange);
            control.on("onCellChange", this._onCellChange, this);
			
            control.un("onAddNewRow", this._onAddNewRow);
            control.on("onAddNewRow", this._onAddNewRow, this);
            control.un("onDeleteRows", this._onDeleteRows);
            control.on("onDeleteRows", this._onDeleteRows, this);
            control.un("onShowCardView", this._onShowCardView);
            control.on("onShowCardView", this._onShowCardView, this);
            control.un("onCellEditorLoad", this._onCellEditorLoad);
            control.on("onCellEditorLoad", this._onCellEditorLoad, this);
            control.un("onCellEditorDestroy", this._onCellEditorDestroy);
            control.on("onCellEditorDestroy", this._onCellEditorDestroy, this);
            control.un("onChangePage", this._onChangePage);
            control.on("onChangePage", this._onChangePage, this);
            control.un("onActiveRowClick", this._onActiveRowClick);
            control.on("onActiveRowClick", this._onActiveRowClick, this);
            control.un("onQuerySchemeChanged", this._onQuerySchemeChanged);
            control.on("onQuerySchemeChanged", this._onQuerySchemeChanged, this);
        }
        model.addListener(this);
		//
		if(model._pagination&& model._data.pager){
			var pager=new cb.controls['Pager']($(model._data.pager),model);
			pager.update(model._data.pageInfo);
			model._pager=pager;
		}
    };
};
cb.binding.DataGridBinding.prototype = new cb.binding.BaseBinding();
