/// <reference path="Cube.js" />
cb.model.DataState = {
    Add: 2,
    Delete: 3,
    Update: 1,
    Unchanged: 0,
	Missing:undefined//数据不在本地,
};
//实例化时，要构建出模型的结构
cb.model.Model3D = function (parent, name, data) {
    cb.model.BaseModel.call(this, parent, name, data);
    this._listeners = [];
	var defaults={
		columns:{},
		ds:[],
		editable:true,
		editMode:'Cell',	//编辑模式:行编辑，单元格编辑
		//readOnly:true,	//等价于editable属性
		autoWrap:true,	//自动换行设置
		mergeState:false,	//合并显示设置
		multiSort:true,
		sortFields:[],
		showCheckBox:true,	//是否显示checkbox列
		showRowNo:true,		//是否显示行号
		//frozenField:undefined,
		mode:'Remote',//默认数据源来自于远程 'Remote'/'Local'
		//pageServer: '',//远程数据须指定对应的数据服务
		pageSize:50,//-1表示不分页
		pageIndex:0,
		pager:'.pager'//默认分页条视图为viewmodel下的 .pager元素,
		
	};
	this._data=$.extend(defaults,this._data);
	
	//字段的显示顺序
	this._data.fieldNames=this._data.fieldNames||this._getFieldNames();
	/*Rows数据标识当前视图中展示的数据行；模型中有一个表示按序存储的行数据结构dataSource，代表所有数据，这些数据不一定都已在本地。
	Rows和dataSource交互，从中获取数据，Rows保留dataSource中行数据的引用，使修改同步；dataSource内部和服务端交互，负责从服务端请求页数据和提交本地修改。
	dataSource提供分页配置管理。
	*/
	this._dataSource=this._data.ds||[];
	delete this._data.ds;
	//当前页面展示的数据
	this._data.rows=[];
	//初始化行数据状态
	this._initRowState();

	//当前获取焦点的行在Rows索引位置，只有Rows中的行才能设置为聚焦行
    this._focusedRowIndex =-1;
    this._editRowModel = null;
	
	//数据记录总数量（如果分页信息返回的总数量和当前值不一致，说明远程数据源有修改，提示保存刷新后再操作）
	//this._currentTotalCount=undefined;
	
	//分页请求返回后回调,context指定为this
	this._pageServerCallBack=$.proxy(function(success,fail){
		if(success){
			var data=success;
			if(this._dataSource.length!==data.totalCount){alert('grid中数据已过期，保存刷新后再处理');return;}
			if(data._pageStart==undefined){
				var pageInfo=this._getRemotePageInfo(this.getPageSize(),this.getPageIndex());
				data._pageStart=pageInfo.pageStart;
				data._dsStart=pageInfo.dsStart;
			}
			this._updateDataSource(data.currentPageData,data._dsStart,data._pageStart);
			this._setPageRows(this._getCurrentPageRows());
			
			//通知分页条更新
			this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "pageInfo", this.getPageInfo()));
		}else{
			alert(fail.message);
		}
	},this);
	

	//this._countAdded=0;//记录客户端添加的行的数量
	
	
	//非只读模式下关闭一些不能用的功能
	if(!this._data.editable){
		delete this._data.mergeState;
		delete this._data.sortFields;
	}
};
cb.model.Model3D.prototype = new cb.model.BaseModel();
cb.model.Model3D.prototype.getPkName = function () {
	 var columns = this._getColumns()
	 for (var col in columns) {
		colData = columns[col];
		if (!colData || !colData.constructor == Object)
			continue;
		if(colData["key"]==true||colData["isKey"]==true)
			return col
	 }
	 return "id";
};
cb.model.Model3D.prototype.getTsName = function(){
	return "ts";
};
//支持数据对象，考虑跟set合并成一个方法 支持setData(Rows),支持setData({}),支持setData(propertyName,value)
cb.model.Model3D.prototype.setData = function (data) {
    cb.console.log("Model3D.setData", this);
    if (arguments.length == 0)
        return;
    if (!arguments[0] || !data)
        return;
    if (arguments.length == 1 && !typeof data == "object") //if (data.constructor != Object || data.constructor != Array)
        return;
    if (arguments.length == 2) {
        var tempData = {};
        tempData[arguments[0]] = arguments[1];
        data = tempData;
    }
    //var _data = { readOnly: true, Columns: { ID: {}, Code: {} }, Rows: [{ ID: 1, Code: 111 }, { ID: 222, Code: { value: 12, readOnly: 1}}], FocusedRow: null, FocusedIndex: 1 };
    if (data.Rows) {
        //this.add(data.Rows, true);
        this.setRows(data.Rows);
        delete data.Rows;
    }
    if (data.Columns) {
        for (var column in data.Columns) {
            columnData = data.Columns[column];
            if (!columnData || !columnData.constructor == Object)
                continue;
            for (var propertyName in columnData) {
                this.setColumnState(column, propertyName, columnData[propertyName]); //需要考虑批量操作
            }
        }
        delete data.Columns;
    }
    for (var attr in data) {
        value = data[attr];
        if (typeof value == "function") {
            this.on(attr, value);
        }
        else if (this._data.hasOwnProperty(attr) || !cb.isEmpty(value)) {
            this.set(attr, value); //需要考虑批量操作
        }
    }
    //this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, propertyName, value, oldValue));//后期改成批量操作，操作传递到前台用批量方式
    cb.console.log("Model3D.setData", this);
}

cb.model.Model3D.prototype.getData = function (propertyName, onlyCollectDirtyData) {
    var pkName = this.getPkName();
    var tsName = this.getTsName();
    if (onlyCollectDirtyData && propertyName == "value") {
        var datas = [];
        var rows = this._data.rows; ////this._data.Cache;???//多页数据怎么处理
        var length = rows.length;
        for (var i = 0; i < length; i++) {
            var tempData = {};
            if (rows[i].state != cb.model.DataState.Unchanged && this._parent.isDirty(this, i)) { // this._parent.isDirty(this, i),需要修改
                for (var attr in rows[i]) {
                    if (attr != "readOnly" && attr != "disabled" && typeof rows[i][attr] != "function") {
                        if (attr == pkName || attr == tsName || this._parent.isDirty(this, i, attr)) {
                            tempData[attr] = (cb.isEmpty(rows[i][attr]) || typeof rows[i][attr] != "object") ? rows[i][attr] : rows[i][attr].Value;
                        }
                    }
                }
                tempData.state = rows[i].state;
            }
            else { //下面数据可以不传递
                var pkColVal = rows[i][pkName];
                var tsColVal = rows[i][tsName];
                tempData[pkName] = (cb.isEmpty(pkColVal) || typeof pkColVal != "object") ? pkColVal : pkColVal.Value;
                tempData[tsName] = (cb.isEmpty(tsColVal) || typeof tsColVal != "object") ? tsColVal : tsColVal.Value;
                tempData.state = cb.model.DataState.Unchanged;
            }
            datas.push(tempData);
        }

        var deleteRows = this._data.DeleteRows || [];   //删除行的处理,删除行只收集id、ts、state
        for (var i = 0; i < deleteRows.length; i++) {
            var cell = deleteRows[i]["ts"];
            var tsValue = (cb.isEmpty(cell) || typeof cell != "object") ? cell : cell.Value;
            cell = deleteRows[i]["id"];
            var idValue = (cb.isEmpty(cell) || typeof cell != "object") ? cell : cell.Value;
            var data = {
                state: cb.model.DataState.Delete,
                ts: tsValue,
                ts: idValue
            };
            datas.push(data);
        }

        return datas;
    }
    else {
        if (propertyName == "value") {
            var rows = this._data.rows.clone(); //this._data.Cache;???//多页数据怎么处理
            if (this._data.rows.length == 0) rows.length = 0;
            for (var i = 0; i < rows.length; i++) {
                delete rows[i].readOnly;
                delete rows[i].disabled;
                for (var attr in rows[i]) {
                    var cell = rows[i][attr];
                    rows[i][attr] = (cb.isEmpty(cell) || typeof cell != "object") ? cell : cell.Value;
                }
                rows[i].state = rows[i].state == null ? cb.model.DataState.Unchanged : rows[i].state;
            }
            //删除行的处理,删除行只收集id、ts、state
            var deleteRows = this._data.DeleteRows || [];
            for (var i = 0; i < deleteRows.length; i++) {
                delete deleteRows[i].readOnly;
                delete deleteRows[i].disabled;
                for (var attr in deleteRows[i]) {
                    var cell = deleteRows[i][attr];
                    deleteRows[i][attr] = (cb.isEmpty(cell) || typeof cell != "object") ? cell : cell.Value;
                }
                deleteRows[i].state = cb.model.DataState.Delete;
                rows.push(deleteRows[i]);
            }
            return rows;
        }
        else {
            return this._data.rows;
        }
    }
}


$.extend(cb.model.Model3D.prototype,{
	//初始化行数据状态
	_initRowState:function(){
		var ds=this._getDataSource();
		this._rowsDataState=new Array(ds.length);//记录数据行的状态
		for(var i=0;i<ds.length;i++){
			this._rowsDataState[i]=ds[i]?cb.model.DataState.Unchanged:cb.model.DataState.Missing;
		}
	},
	_getColumns:function(){
		return this._data.columns;
	},
	_getFieldNames:function(){
		var fieldNames=[],
			cols=this._getColumns();
		for(var prop in cols){
			fieldNames.push(prop);
		}
		return fieldNames;
	},
	get:function (rowIndex, cellName, propertyName) {
		if (arguments.length == 1) {
			//增加判断，如果只传递了1个参数，则按propertyName处理
			propertyName = rowIndex;
			rowIndex = -1;
			cellName = null;
		}
		if (rowIndex == null)
			rowIndex = -1; //容错
		if (!propertyName || propertyName.toLowerCase() === "value") {
			//如果状态属性propertyName==空，则表示要获取行或列的值
			var row = rowIndex >= 0 ? this._data.rows[rowIndex] : null;
			if (!row || !cellName)
				return row; //如果列名称cellName为空，则返回行
			var cell = row[cellName];
			return (cell && typeof cell === "object") ? cell.value : cell;
		}
		else {
			//如果状态属性propertyName != 空，则表示要获取状态值
			if (rowIndex < 0) {
				//如果传入rowIndex==null and 列名cellName==null，则返回整体状态。
				//如果传入rowIndex==null and 列名cellName!=null，则列状态。
				return cellName ? this._data.columns[cellName][propertyName] : this._data[propertyName];
			}
			else {
				//如果传入rowIndex!=null and 列名cellName!=null，则返回单元格状态。
				//如果传入rowIndex==null and 列名cellName==null，则行状态。
				if (!cellName)
					return this._data.rows[rowIndex][propertyName];
				var cell = this._data.rows[rowIndex][cellName];
				return cell && cell[propertyName];
			}
		}
		return this;
	},
	set:function (rowIndex, cellName, propertyName, value) {
		if (arguments.length == 2) {
			//增加判断，如果只传递了2个参数，则按propertyName, value处理
			propertyName = rowIndex;
			value = cellName;
			rowIndex = -1;
			cellName = null;
		}
		if (rowIndex == null)
			rowIndex = -1; //容错

		if (!propertyName) {
			if (rowIndex < 0 || !cellName)
				return;
			var row = this._data.rows[rowIndex]; // this.get(rowIndex);
			var cell = row[cellName];
			var cellIsObject = (cell && typeof cell == "object");
			var oldValue = this.get(rowIndex, cellName);
			if (oldValue === value)
				return;

			var data = { rowIndex: rowIndex, cellName: cellName, value: value, oldValue: oldValue };
			if (!this._before("CellValueChange", data))
				return false;
			if (cellIsObject)
				cell.value = value;
			else
				row[cellName] = value;
			row.state = cb.model.DataState.Update;

			var args = new cb.model.PropertyChangeArgs(this._name, "CellValueChange", data);
			this.PropertyChange(args);

			this._after("CellValueChange", data); //值变化出发,无焦点要求
		}
		else {
			//设置控件状态
			if (rowIndex < 0 && !cellName) {
				var oldValue = this._data[propertyName];
				if (cb.isEqual(oldValue,value))//有时候属性值为对象
					return false;

				var data = { propertyName: propertyName, value: value, oldValue: oldValue };
				if (!this._before("StateChange", data))
					return false;

				this._data[propertyName] = value;

				var args = new cb.model.PropertyChangeArgs(this._name, propertyName, value,oldValue);
				this.PropertyChange(args);

				this._after("StateChange", data);

			}
			//设置列状态
			else if (rowIndex < 0 && cellName) {
				var oldValue = this._data.columns[cellName][propertyName];
				if (oldValue === value)
					return false;

				var data = { rowIndex: rowIndex, cellName: cellName, propertyName: propertyName, value: value, oldValue: oldValue, columns: cb.clone(this._data.columns) };
				if (!this._before("ColumnStateChange", data))
					return false;
				
				
				this._data.columns[cellName] = this._data.columns[cellName] || {};//这样可能会增加新列
				this._data.columns[cellName][propertyName] = value;

				var args = new cb.model.PropertyChangeArgs(this._name, "ColumnStateChange", data);
				this.PropertyChange(args);

				this._after("ColumnStateChange", data);
			}
			//设置行状态
			else if (rowIndex >= 0 && !cellName) {
				var oldValue = this._data.rows[rowIndex][propertyName];
				if (oldValue === value)
					return;

				var data = { rowIndex: rowIndex, propertyName: propertyName, value: value, oldValue: oldValue };
				if (!this._before("StateChange", data))
					return false;

				if (!value && (propertyName == "readOnly" || propertyName == "disabled")) {
					//如果值==false,
					delete this._data.rows[rowIndex][propertyName];
				}
				else {
					this._data.rows[rowIndex][propertyName] = value;
				}

				var args = new cb.model.PropertyChangeArgs(this._name, "RowStateChange", data);
				this.PropertyChange(args);

				this._after("RowStateChange", data);
			}
			//设置单元格状态
			else if (rowIndex >= 0 && cellName) {
				var cell = this._data.rows[rowIndex][cellName];
				var isObject = (cell && typeof cell == "object");
				var oldValue = isObject ? cell[propertyName] : undefined;
				if (oldValue === value)
					return;

				var data = { rowIndex: rowIndex, cellName: cellName, propertyName: propertyName, value: value, oldValue: oldValue };
				if (!this._before("CellStateChange", data))
					return false;

				if (cb.isEmpty(value)) {
					//如果置空，则列只存值
					if (isObject)
						delete cell[propertyName];
					//this._data.rows[rowIndex][cellName] = isObject ? cell.Value : cell; //不止一个属性
				}
				else if (!value && (propertyName == "readOnly" || propertyName == "disabled")) {
					//如果值==false,
					//this._data.rows[rowIndex][cellName] = isObject ? cell.Value : cell;
					if (isObject) {
						delete cell[propertyName];
						var hasProperty = false;
						cb.eachIn(cell, function (attr) { if (attr != "Value" || attr != "value") { hasProperty = true; return; } });
						if (!hasProperty)
							this._data.rows[rowIndex][cellName] = cell.Value;
					}
				}
				else {
					if (!isObject)
						cell = this._data.rows[rowIndex][cellName] = { value: cell };
					cell[propertyName] = value;
				}
				var args = new cb.model.PropertyChangeArgs(this._name, "CellStateChange", data);
				this.PropertyChange(args);

				this._after("CellStateChange", data);
			}
		}

		//this.syncEditRowModel(rowIndex, cellName, propertyName, value); //需要优化一下，看放在哪里效率高
	},
		
	//自动换行
	setAutoWrap:function(autoWrap){
		if(this.set('autoWrap',!!autoWrap)!==false){//属性变化时才通知视图更新，把和并信息的计算放到绑定器中处理
			var args = new cb.model.PropertyChangeArgs(this._name, "autoWrap",!!autoWrap);
			this.PropertyChange(args);	
		}
	},
	//todo:设置固定列边界
	setFrozenField:function(field){
		var col=this.get(null,field);
	},
	//是否合并单元格控制
	setMergeState:function(merge){
		if(this.set('mergeState',!!merge)!==false){//属性变化时才通知视图更新，把和并信息的计算放到绑定器中处理
			var mergeCells=null;
			if(merge){
				mergeCells=this._getMergeCells();
			}
			var args = new cb.model.PropertyChangeArgs(this._name, "mergeInfo",{rows:this._data.rows,mergeCells:mergeCells});
			this.PropertyChange(args);	
		}
	},
	getMergeState:function(){return this.get('mergeState');},

		//返回当前显示行的可合并信息
		/*只统计rowspan>=2的单元格
		数据结构：{
			field1:[{index:0,rowspan:2},{index:2,rowspan:3}],
			field2:[{index:2,rowspan:2}]
		}
		*/
	_getMergeCells:function(){
		var fields=this._getFieldNames();
		var count=0;//统计一共有多少可合并的单元格
		var mergeCells={};
		var rows=this._data.rows;
		var cellsInPreCol=[{index:0,rowspan:rows.length}];//前列中合并的单元格信息
		var cellsInCurCol;//当前列的合并单元格信息，当前列中合并的单元格信息依赖与前列的合并单元格信息
		var field,//当前字段名
			preMergeCell,preVal,val;//当前处理的列参照的前一列中合并的单元格
		var cols=this._getColumns();
		for(var i=0,len=fields.length;i<len;i++){		
			field=fields[i];
			//if(!cols[field].annexable)break;
			cellsInCurCol=[];
			for(var j=0;j<cellsInPreCol.length;j++){
				preMergeCell=cellsInPreCol[j];
				var k=preMergeCell['index'],end=k+preMergeCell.rowspan;
				var rowspan=0;
				do{
					val=this.get(k,field);
					if(!rowspan){
						rowspan++;
						preVal=val;	
							
					}else{
						if(val!==preVal){//如果和前面的只不相等，则只合并前面扫描过的行单元格
							if(rowspan>1){
								cellsInCurCol.push({index:k-rowspan,rowspan:rowspan});
								count++;
							}
							rowspan=1;//从这个不一样的值开始重新计数,且记录当前值
							preVal=val;
						}else{
							rowspan++;//合并,
							//当最后的几行可以可并时
							if(rowspan>1&&k==end-1){
								cellsInCurCol.push({index:k-rowspan+1,rowspan:rowspan});
								count++;
							}
						}
					}
					k++;
				}while(k<end);
				
			}
			if(cellsInCurCol.length){
				cellsInPreCol=mergeCells[field]=cellsInCurCol;
			}else{//如果某列没有可合并的单元格，则终止搜索
				break;
			}
		}
		//console.log('mergeCells:',JSON.stringify(mergeCells,null,4));
		return count?mergeCells:null;
	},
	//单页排序设置
	setSortFields:function(sortFields,noReflesh){//noReflesh仅内部使用
		sortFields=cb.clone(sortFields);
		if (!this._before("sort")) {//执行前动作被阻止时，使视图和model保持一致
			var args = new cb.model.PropertyChangeArgs(this._name, "sortFields",this._data.sortFields);
			this.PropertyChange(args);
			return;
		}
		if(this.set('sortFields',sortFields)!==false && !noReflesh && sortFields.length){//如果指定不刷新这不重排序
			this._data.rows = this._sort(this._data.rows);
			//显示的数据集（包括排序信息）改变后，刷新界面显示
			this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "displayRows", this._data.rows));
			this._after("sort");
		}
		
	},
	//应该使用副本数据，避免别处的修改印象model内部状态
	getSortFields:function(){return this.get('sortFields');},
		//根据模型设置的排序规则，对数据行排序，返回排序后的行对象数组
	_sort:function(rows){
		var fields=this.getSortFields();
		if(!fields.length)return rows;
		var model3d=this,
			Model3D=cb.model.Model3D;
			columns=this._getColumns();
		var fn=function(itemA, itemB){
				var valA,valB;
				for(var i=0,len=fields.length;i<len;i++){
					var field=fields[i][0];//字段名
					var col=columns[field];
					if(!col)continue;
					
					//提取行数据中对应字段的值
					valA=itemA[field]&&typeof itemA[field]=='object'?itemA[field].value:itemA[field];
					valB=itemB[field]&&typeof itemB[field]=='object'?itemB[field].value:itemB[field];
					
					//可在列信息中指定排序规则，指定排序规则时可通过名称引用已有的排序方式，也可以通过比较器定义排序规则
					var comparator=col.comparator;
					//如果未指定comparator，或指定无效的类型数据（既不是字符串，也不是函数）
					if(!comparator||(typeof comparator!=='string'&& Object.prototype.toString.call(comparator)=='[object Function]')){
						comparator=null;
					}
					//如果指定了预定义的比较器名称，则使用名称对应的比较器
					comparator=typeof comparator==='string'?Model3D.comparators[comparator]:comparator;
					//如果还没有确定比较器，则使用类型默认的排序方式,如果类型没有默认的排序方式
					comparator=comparator||Model3D.comparators[col.type||'String'];//未指定字段类型时，默认为字符串类型

					var direction=fields[i][1];
					//如果没有比较器，这保持原有顺序
					var result=comparator?(direction===1?comparator(valA, valB):0-comparator(valA, valB)):0;//direction:1 asc,-1 des;					
					
					if(result)return result;
				}
			};
		
		rows.sort(fn);
		return rows;
	},
	//#region getState
	setRowState:function (rowIndex, propertyName, value) {
		this.setState(rowIndex, null, propertyName, value);
	},
	getRowState:function (rowIndex, propertyName) {
		return this.getState(rowIndex, null, propertyName);
	},
	setColumnState:function (cellName, propertyName, value) {
		this.setState(null, cellName, propertyName, value);
	},
	getColumnState:function (cellName, propertyName) {
		return this.getState(null, cellName, propertyName);
	},
	setCellState:function (rowIndex, cellName, propertyName, value) {
		this.set(rowIndex, cellName, propertyName, value);
	},
	getCellState:function (rowIndex, cellName, propertyName) {
		return this.get(rowIndex, cellName, propertyName);
	},
	getReadOnly:function (rowIndex, cellName) {
		return this.get(rowIndex, cellName, "readOnly");
	},
	setReadOnly:function (rowIndex, cellName, value) {
		if (arguments.length == 0)
			return;
		//使支持 setReadOnly(value),setReadOnly(rowIndex,value),setReadOnly(cellName,value)
		if (arguments.length == 1) {
			value = arguments[0];
			rowIndex = -1;
			cellName = null;
		}
		else if (arguments.length == 2) {
			value = arguments[1];
			if (typeof arguments[0] == "number") {
				rowIndex = arguments[0];
				cellName = null;
			}
			else if (typeof arguments[0] == "string") {
				cellName = arguments[0];
				rowIndex = -1;
			}
		}

		this.set(rowIndex, cellName, "readOnly", value);
	},
	getDisabled:function (rowIndex, cellName) {
		return this.get(rowIndex, cellName, "disabled");
	},
	setDisabled:function (rowIndex, cellName, value) {
		this.set(rowIndex, cellName, "disabled", value);
	},
	getState:function (rowIndex, cellName, propertyName) {
		return propertyName ? this.get(rowIndex, cellName, propertyName) : null;
	},
	setState:function (rowIndex, cellName, propertyName, value) {
		if (!propertyName)
			return;
		this.set(rowIndex, cellName, propertyName, value);
	},
	//#endregion state

	getCellValue:function (rowIndex, cellName) {
		return this.get(rowIndex, cellName);
	},
	setCellValue:function (rowIndex, cellName, value) {
		this.set(rowIndex, cellName, null, value);
	},
	//界面录入值变化触发
	cellChange:function (rowIndex, cellName, value) {
		var oldValue = this.getCellValue(rowIndex, cellName);
		if (oldValue === value)
			return false;
		var data = { rowIndex: rowIndex, cellName: cellName, value: value, oldValue: oldValue };
		if (this._before("CellChange", data)) {
			this.setCellValue(rowIndex, cellName, value);
			this._after("CellChange", data)
			return true;
		}
	},


	setColumns:function (columns,fieldNames) {
		if (!this._before("setColumns", columns))
			return;
		//columns = cb.isArray(columns) ? columns : [columns];
		this._data.columns = columns;
		this._data.fieldNames=fieldNames||this._getFieldNames();
		this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "columns", cb.clone(this._data)));
		this._after("setColumns", columns);
	},

	//根据定义的页数据过滤器，过滤行数据
	_filter:function(rows){
		return rows;
	},
	/*
	模型中设置数据源，数据源有来源属性（标识数据直接来自远程服务器还是来自本地）；
	分页展示的定义：视图中显示的数据只是数据源的特定部分时，确定的展示方式属于分页展示（分页的具体方式可根据需要定制，例如支持普通的分页和滚动时分页，滚动时
	分页为了是视图有缓冲带，会要求分页数据之间有部分重叠）
	分页是数据展示的一种方式，独立与数据来源。
	*/
	
	
	//更新显示的数据行
	_refreshDisplay:function(){
		var pageRows=this._getCurrentPageRows();
		if(pageRows){
			this._setPageRows(pageRows);
			//通知分页条更新
			this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "pageInfo", this.getPageInfo()));
		}else{//数据不全在本地
			var pageServer=this._getPageServer();
			var params=$.extend({},this._queryParams);
			var pageInfo=this._getRemotePageInfo(this.getPageSize(),this.getPageIndex());
			params.pageSize=pageInfo.pageSize;
			params.pageIndex=pageInfo.pageIndex+1;
			pageServer(params,this._pageServerCallBack);
			
		}
	},
	_getPageServer:function(){
		return this._pageServer;
	},
	//数据是否直接来源与服务端，如果不是，不接受设置分页查询代理
	_isRemote:function(){
		return this.get('mode').toLowerCase()==='remote';
	},

	//rows为对应的页数据，根据model的设置（页过滤规则，排序规则），得到页面展示的数据
	_setPageRows:function(rows){
		this._data.rows=this._sort(this._filter(rows));
		//刷新视图
		this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "displayRows", this._data.rows));
	},
	
	//初始化ds（初始化datasource后要更新rowsInView）
	//使用本地数据时，调用setDataSource时传递的参数为一个记录数组；
	//设置远程数据源时，参数为：请求数据的查询方法，查询参数，也可以传递一个可选的单页数据对象{currentPageData:[],pageIndex:pageIndex,pageSize:pageSize,totalCount:pageSize}
	//如果没提供单页数据时，自动请求一页数据
	setDataSource:function(pageServer,queryParams,pageData,callback){
		if(this._isRemote()){
			
			queryParams=queryParams||{};
			this._pageServer=pageServer;
			this._queryParams=queryParams;

			if(pageData){//有一页数据了，就不自动请求
				var data=pageData;
				//更新datasource长度和内容
				this._dataSource=new Array(data.totalCount);
				this._rowsDataState=new Array(data.totalCount);
				pageData._pageStart=0;
				pageData._dsStart=0;
			
				this._pageServerCallBack(data);
				if(callback)callback();
			}else{//自动请求一页数据
				var params=$.extend({},queryParams);
				params.pageSize=this.getPageSize();
				params.pageIndex=this.getPageIndex()+1;//服务器pageIndex从1开始
				//把本地分页信息转换为远程分页参数
				
				pageServer(params,$.proxy(function(success,fail){
					if(fail){
						alert(fail.message);
						return;
					}
					var data=success;
					
					//更新datasource长度和内容
					this._dataSource=new Array(data.totalCount);
					this._rowsDataState=new Array(data.totalCount);
					var remotePageInfo=this._getRemotePageInfo(this.getPageSize(),this.getPageIndex());
					data._dsStart=remotePageInfo.dsStart;
					data._pageStart=remotePageInfo.pageStart;

					this._pageServerCallBack(data);
					if(callback)callback();
				},this));
			}
		}else{//data为datasource结构
			this._dataSource=cb.isArray(data)?data:[];
			this._refreshDisplay();
			if(callback)callback();
		}
	},
	_getDataSource:function(){return this._dataSource;},

	//数据库查询的数据到后更新数据源
	_updateDataSource:function(rows,dsStart,pageStart){
		//暂时简单处理，把数据放到指定位置，不考虑客户端的已有修改
		var ds=this._getDataSource();
		var rowsDataState=this._rowsDataState;
		var Unchanged=cb.model.DataState.Unchanged,
			Missing=cb.model.DataState.Missing,
			Add=cb.model.DataState.Add;
		//如果数据之前为加载，则把数据更新到对应位置
		for(var i=pageStart,indexInDs=dsStart,len=rows.length;i<len;){
			var rowState=rowsDataState[indexInDs];
			while(rowState==Add){//跳过用户编辑过程中添加的行
				indexInDs++;
			}
			if(rowState==Missing){
				ds[indexInDs]=rows[i];
				rowsDataState[indexInDs]=Unchanged;
			}
			i++;
			indexInDs++;
		}
	},
	/*
	由于分页在用户视角下是相对于本地数据源的，当grid可以编辑时，在编辑过程的一个时间点，数据源中数据可能既有由于编辑中添加的，也有还为同步到本地的，同步到
	本地的数据可能有被删除的，这时候翻页操作时，可能没有对应的页的完整数据（可能只有部分），这时需要去服务器请求在服务器中的数据，但此时要请求的数据并不一定是
	远程数据源中的同一页数据，需要根据本地数据源和远程数据源的映射关系，计算出应该请求哪一页数据，请求的页大小按当前客户端的页大小时，请求的数据不一定能完全填充
	缺失的数据。这时需要适当的调大pageSize，然后从返回的远程数据中截取需要的部分数据。
	*/
	//@return {pageIndex:pageIndex,pageSize:pageSize,dsStart:dsStart,pageStart:pageStart}
	_getRemotePageInfo:function(pageSize,pageIndex){
		var indexInfo=this._getIndexInDs(pageSize*pageIndex);
		var rowDataState=this._rowsDataState;
		var count=0,needCount;
		var Missing=cb.model.DataState.Missing;
		var Delete=cb.model.DataState.Delete;
		var indexInds=indexInfo.indexInDs;
		var i=indexInfo;
		while(rowDataState[i]!==Missing){
			if(rowDataState[i]!==Delete)count++;
			i++;
		}
		needCount=Math.max(0,pageSize-count);//需要请求的记录数
		var pageIndexInRemote,pageSizeInRemote;
		var startIndexInRemote=indexInfo.remoteRowCountBefore;
		var pageCountBefore=Math.ceil((startIndexInRemote+1)/needCount)+1;//看要请求的第一条记录在第几页中
		if((startIndexInRemote+1)%needCount)pageCountBefore--;
		//要请求的第一条数据在返回页中的索引
		var indexInResponse;
		if((pageCountBefore-1)%2===0){//如果要请求的第一条记录在基数页中，则pageIndex指向这条记录所在页的前一页
			pageSizeInRemote=2*needCount;
			pageIndexInRemote=(pageCountBefore-1)/2;
			indexInResponse=startIndexInRemote%pageSizeInRemote;
		}else if((pageCountBefore-1)%3===0){//在偶数页中，且前面有3的整数倍页，则pagesise设为当前页的3倍
			pageSizeInRemote=3*needCount;
			pageIndexInRemote=(pageCountBefore-1)/3;
			indexInResponse=startIndexInRemote%pageSizeInRemote;
		}else{
			pageSizeInRemote=2*needCount;
			pageIndexInRemote=pageCountBefore/2-1;
			indexInResponse=startIndexInRemote%pageSizeInRemote;
		}
		return {
			pageIndex:pageIndexInRemote,
			pageSize:pageSizeInRemote,
			pageStart:indexInResponse,
			dsStart:indexInds
		};
		
	},
	//尝试获取当前页数据，如果当前页数据不全,返回null
	_getCurrentPageRows:function(){
		var rows=[];
		var ds=this._getDataSource();
		var Missing=cb.model.DataState.Missing;
		var Delete=cb.model.DataState.Delete;
		var pageIndex=this._data.pageIndex,
			pageSize=this._data.pageSize,
			i=this._getIndexInDs(pageSize*pageIndex).indexInDs,
			count=pageSize;
		for(var len=ds.length;i<len&&count>0;i++){
			if(this._rowsDataState[i]!==Delete){//如果这条数据被来自于远程的数据在编辑过程中被删除了，则已经不再本地数据源中了
				if(this._rowsDataState[i]!=Missing){
					rows.push(ds[i]);
					count--;
				}else{
					return null;
				}
			}
		}
		return rows;
	},
	//获取用户视角下数据索引对应的数据在本地datasource中的index,顺便统计ds中对应的位置之前有多少远程数据
	_getIndexInDs:function(index){
		var rowDataState=this._rowsDataState;
		var num=index+1;//序数
		var count=0,remoteRowCountBefore=0;
		var Delete=cb.model.DataState.Delete,
			Add=cb.model.DataState.Add;
		for(var i=-1,len=rowDataState.length;i<len&&count<num;){
			i++;
			if(rowDataState[i]!==Delete)count++;
		}
		var indexInDs=i;
		for(var i=0,len=rowDataState.length;i<indexInDs;i++){
			if(rowDataState[i]!==Add)remoteRowCountBefore++;
		}
		return {
				indexInDs:indexInDs,
				remoteRowCountBefore:remoteRowCountBefore//本地ds中index对应位置前的远程数据的数量
			};
	},
	//处理分页
	getPageInfo:function(){
		return {
			pageIndex:this.getPageIndex(),
			pageSize:this.getPageSize(),
			totalCount:this.getTotalCount()
		};
	},
	setPageSize:function (pageSize,_inner) {//指定为内部调用时，仅仅更新内部状态，不刷新视图,加'_'前缀的参数只在内部可用
		if (typeof pageSize !== 'number') {return;}
		
		pageSize=Math.max(-1,pageSize);
		this._data.pageSize = pageSize;
		this._data.pageIndex=0;
		if(!_inner){this._refreshDisplay();}
	},
	getPageSize:function () {
		return this._data.pageSize;
	},
	setPageIndex:function(index,_inner){
		var pageCount=this.getPageCount();
		if(index>=0&&index<pageCount){
			this._data.pageIndex=index;
			if(!_inner){this._refreshDisplay();}
		}
	},
	getTotalCount:function(){
		return this._getDataSource().length;
	},
	gotoPage:this.setPageIndex,
	getPageIndex:function(){
		return this._data.pageIndex;
	},
	getPageCount:function(){
		return this._data.pageSize!=-1?Math.ceil(this._dataSource.length/this._data.pageSize):+!!this._dataSource.length;
	},
	showNextPage:function(){
		var index=this.getPageIndex()+1;
		var pageCount=this.getPageCount();
		if(index<pageCount){
			this.setPageIndex(index);
		}
	},

	showPreviousPage:function(){
		var index=this.getPageIndex()-1;
		if(index>=0){
			this.setPageIndex(index);
		}
	},
	showFirstPage:function(){
		this.setPageIndex(0);
	},
	showLastPage:function(){
		var index=this.getPageCount()-1;
		if(index>=0){
			this.setPageIndex(index);
		}
	},
	/////

	commitRows:function (rows) {
		if (!this._before("commitRows", rows))
			return;
		rows = cb.isArray(rows) ? rows : [rows];
		var rowIndexes = [];
		cb.each(rows, function (row) {
			var rowIndex = (typeof row == "number") ? row : this._data.rows.indexOf(row);
			rowIndexes.push(rowIndex);
		}, this);
		this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "commitRows", rowIndexes));
		this._after("commitRows", rowIndexes);
	},

	//焦点行，选中行操作、管理(通过索引操作，应用开发人员不能直接操作model总的行数据，只能通过api操作，获取的行数据为数据副本)
	
	getRow:function (rowIndex) {
		return cb.clone(this._data.rows[rowIndex]);
	},
	//焦点管理
	setFocusedIndex:function (index) {
		var rows=this._data.rows;
		if(index<0||index>=rows.length){
			this._focusedRowIndex = -1;
			//this.getEditRowModel().clear();
			return;
		}
		if (this._focusedRowIndex == index)
			return;

		if (!this._before("setFocusedIndex", index))
			return;

		var oldValue = this._focusedRowIndex;
		this._focusedRowIndex = index;

		//this.setEditRowModel(this._focusedRowIndex);

		var args = new cb.model.PropertyChangeArgs(this._name, "focusedIndex", index, oldValue);
		this.PropertyChange(args);

		this._after("setFocusedIndex", index);
	},
	//获取焦点行的索引
	getFocusedIndex:function () {
		return this._focusedRowIndex;
	},
	//获取焦点行对应的记录数据
	getFocusedRow:function () {
		return cb.clone(this._data.rows[this._focusedRowIndex]);
	},
	
	//#region 选择、全选支持
	select:function (rowIndexs) {
		var rows=rowIndexs;
		this._before("select", this);
		if (!cb.isArray(rows)) rows = [rows];
		cb.each(rows, function (index) {
			if (index == this._data.rows.length) return;
			this._data.rows[index].isSelected = true;
		}, this);
		//由于下面还有使用rows，所以不能直接把rows作为参数传到外部，对象参数可能被修改
		this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "select", cb.clone(rows)));
		rows.length >= 1 ? this.setFocusedIndex(rows[0]) : this.setFocusedIndex(-1);//使第一个参数对应的行获取焦点
		this._after("select", this);
	},
	unselect:function (rowIndexs) {
		var rows=rowIndexs;
		if(this._before("unselect", this)===false)return;
		if (!cb.isArray(rows)) rows = [rows];	
		
		cb.each(rows, function (index) { this._data.rows[index].isSelected = false; }, this);
		this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "unselect", rows));
		this._after("unselect", this);
	},

	selectAll:function () {
		if(this._before("selectAll", this)===false)return;//内部使用事件名时，用驼峰风格，外边监听事件名时用小写
		cb.each(this._data.rows, function (row) { row.isSelected = true; }, this);
		this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "selectAll","selectAll"));//changeArgs中当前值不能等于原来的值，所以不能同时为空
		this._after("selectAll", this);
	},
	unselectAll:function () {
		if(this._before("unselectAll", this)===false)return;
		cb.each(this._data.rows, function (row) { row.isSelected = false; }, this);
		this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "unselectAll","unselectAll"));
		this._after("unselectAll", this);
		
	},
	//支持多页选中
	getSelectedRows:function () {
		var selectedRows = [];
		var rows=this._dataSource;
		for (var i = 0, length = rows.length; i < length; i++) {
			if (rows[i]&&rows[i].isSelected) {//可能还有远程数据
				selectedRows.push(cb.clone(rows[i]));
			}
		}
		return selectedRows;
	},
	//获取当前显示的行数据中选中的行的索引,
	getPageSelectedIndexs:function () {
		var selectedRows = [];
		var rows=this._data.rows;
		for (var i = 0, length = rows.length; i < length; i++) {
			if (rows[i].isSelected) {
				selectedRows.push(i);
			}
		}
		return selectedRows;
	},
	//获取当前页选中的记录数据
	getPageSelectedRows:function(){
		var selectedIndexs=this.getPageSelectedIndexs();
		var selectedRows=[];
		for(var i=0,len=selectedIndexs.length;i<len;i++){
			selectedRows.push(this.getRow(selectedIndexs[i]));
		}
		return selectedRows;
	},
	//#endregion

	//新增空行
	addNewRow:function () {
		if (!this._before("addNewRow"))//beforeadd
			return;
		var newRow = { state: cb.model.DataState.Add }; //新增行
		this._data.rows.push(newRow);
		this._$setId(newRow);
		this.setFocusedRow(newRow);
		this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "addNewRow", newRow));
		this._after("addNewRow");
	},
	add:function (rows, isRemoveAll) {
		if (isRemoveAll) {
			this._data.rows.removeAll();
			this.setFocusedRow(null);
		}
		if (!this._before("add", rows))//beforeadd
			return;
		rows = cb.isArray(rows) ? rows : [rows];
		for (var i = 0; i < rows.length; i++) {
			this._data.rows.push(rows[i]); //rows可以为多行,[]
			if (!rows[i].state)
				rows[i].state == cb.model.DataState.Add; //新增行
			this._$setId(rows[i]);
		}
		if (!this._focusedRow) {
			this.setFocusedRow(this._data.rows[0]);
		}
		this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "add", rows));
		this._after("add");
	},
	insert:function (rowIndex, row) {
		if (!this._before("insert", { RowIndex: rowIndex, Value: row }))
			return;
		var willSetFocusedRow;
		if (row) willSetFocusedRow = true;
		row = row || {};
		if (!row.state)
			row.state = cb.model.DataState.Add; //新增行

		this._data.rows.insert(rowIndex, row);

		this._$setId(row);
		this._processRow(row);

		if (willSetFocusedRow == true) {
			this.setFocusedRow(this._data.rows[rowIndex]);
		}

		//this.setDirty(rowIndex, true);
		//this.set(rowIndex, null, "State", "Add");

		this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "insert", { Row: rowIndex, Value: row }));

		this._after("insert");
	},
	remove:function (rows) {
		if (!this._before("remove", rows))
			return;
		var deleteRows = [];
		if (cb.isArray(rows)) {
			for (var j = 0; j < rows.length; j++) {
				var index = (typeof rows[j] == "number") ? rows[j] : this._data.rows.indexOf(rows[j]);
				deleteRows.push(index);
			}
			deleteRows.sort(function (a, b) { return a < b ? 1 : -1; });
			cb.each(deleteRows, function (k) {
				this._backupDeleteRows(this._data.rows[k]);
				this._data.rows.remove(k);
			}, this);
		}
		else {
			var index2 = (typeof rows == "number") ? rows : this._data.rows.indexOf(rows);
			deleteRows.push(index2);
			this._backupDeleteRows(this._data.rows[index2]);
			this._data.rows.remove(index2);
		}

		this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "remove", deleteRows));

		this._after("remove");
	},
	updateRow:function (row, modifyData) {
		if (!row || !modifyData)
			return;
		var rowIndex = this.getRowIndex(row);
		if (rowIndex < 0)
			return;
		for (var attr in modifyData) {
			this.set(rowIndex, attr, null, value);
		}
	},
	_backupDeleteRows:function (row) {
		if (row && row.state != cb.model.DataState.Add) {
			this._data.DeleteRows = this._data.DeleteRows || [];
			row.state = cb.model.DataState.Delete;
			this._data.DeleteRows.push(row);                //删除数据,脏数据处理逻辑，删除？？
		}
	},
	removeAll:function () {
		if (!this._before("removeAll"))
			return;

		this._data.rows.removeAll();
		this.setFocusedRow(null);

		//this.setDirty(true);
		this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "removeAll", this));

		this._after("removeAll");
	},
	setDirty:function (rowIndex, value) {
		//this.set(rowIndex, null, "IsDirty", value);
	},
	getDirty:function (rowIndex) {
		if (!rowIndex)
			return this._data["IsDirty"];
		//return this.get(rowIndex, null, "IsDirty");
		var rowState = this.get(rowIndex, null, "State");
		return rowState != null || rowState != cb.model.DataState.Unchanged;
	},

	setGridDataMode:function (mode) {
		this._data.Mode = mode;
	},
	getGridDataMode:function () {
		return this._data.Mode;
	},
	_before:function (eventName, args) {
		return this.execute("before" + eventName, args);
	},
	_after:function (eventName, args) {
		return this.execute("after" + eventName, args);
	},
	fireEvent:function (eventName, args) {
		if (this.execute("before" + eventName, args)) {
			this.execute(eventName, args);
			this.execute("after" + eventName, args);
		}
	},
	syncEditRowModel:function (rowIndex, cellName, propertyName, value) {
		if (rowIndex != this._focusedRowIndex || !cellName) {
			if (propertyName == "readOnly" || propertyName == "disabled")
				this.getEditRowModel().set(propertyName, value);    //readOnly、disabled
			return;
		}
		var property = this.getEditRowModel().get(cellName);
		if (!property)
			return;
		propertyName = propertyName || "value";
		var oldValue = property.get(propertyName);
		if (oldValue === value)
			return;
		property.set(propertyName, value);
	},
	setEditRowModel:function (data) {
		if (!this._editRowModel) {
			this._editRowModel = cb.viewmodel.create(this.toAtomicData(data));
			this._editRowModel._parent = this;
			var rowModel = this._editRowModel;
			//            cb.each(this._data.Columns, function (column) {
			//                var setMethod = rowModel["set" + column["data"]];
			//                if (!setMethod) {
			//                    rowModel.add(column["data"], new cb.model.SimpleModel(this, column["data"], Object.clone("")));
			//                }
			//            }, this);
			for (var column in this._data.Columns) {
				var setMethod = rowModel["set" + column];
				if (!setMethod) {
					//rowModel.add(column, new cb.model.SimpleModel(this, column, Object.clone( )));
					rowModel.add(column, new cb.model.SimpleModel(this, column, Object.clone(this._data.Columns[column])));
				}
			}
		}
		else {
			if (data == null) {
				this._editRowModel.clear();
				return;
			}

			var atomicData = this.toAtomicData(data);
			cb.eachIn(atomicData, function (attr, attrValue) {
				if (typeof attrValue != "object")
					return;
				var setMethod = this._editRowModel["set" + attr];
				if (setMethod)
					setMethod.call(this._editRowModel, attrValue);
				else
					this._editRowModel.add(attr, new cb.model.SimpleModel(this, attr, Object.clone(attrValue)));
			}, this);

			this._editRowModel.initListeners(); //cb.each(this._editRowModel._listeners, function (listener) { listener.init(); }, this);
		}
	},
	getEditRowModel:function () {
		if (!this._editRowModel)
			this.setEditRowModel(this._focusedRow);
		return this._editRowModel;
	},

	//原子数据类型 { value: null,readOnly:false,disabled:false }
	toAtomicData:function (data) {
		if (!data)
			return {};
		var dataCopy = { hasData: false };
		cb.eachIn(data, function (attr, attrValue) {
			this.hasData = true;
			if (cb.meta.AtomicData.hasOwnProperty(attr))
				this[attr] = attrValue;
			else if (typeof attrValue != "object")
				this[attr] = { value: attrValue };
			else
				cb.eachIn(attrValue, function (propertyName, propertyValue) { this[propertyName] = propertyValue; }, this[attr] = {});
		}, dataCopy);

		if (!dataCopy.hasData) {
			cb.eachIn(this._data.Columns, function (column, columnValue) {
				cb.eachIn(columnValue, function (propertyName, propertyValue) { this[propertyName] = propertyValue; }, this[column] = {});
			}, dataCopy);
		}
		delete dataCopy.hasData;
		return dataCopy;
	}
});
//内置的排序方式
cb.model.Model3D.comparators={
	'Number':function(num1,num2){return num1-num2;},
	'String':function(strA,strB){return strA>strB?1:(strA<strB?-1:0);},
	'String.IgnoreCase':function(a,b){
		var strA=a.toLowerCase(),
			strB=b.toLowerCase();
		return strA>strB?1:(strA<strB?-1:0);
	}
};
cb.model.Model3D.comparators['Boolean']=cb.model.Model3D.comparators['Number'];
//覆盖cb.clone错误的clone方法
cb.clone = function clone(obj) {
    //支持数组项内的扩展
    var extend = function (post, back) {
        if (!back || typeof back != 'object') return;
        post = post || {};
        var src, target;
        //处理数组的扩展
        if (back instanceof Array) {
            post = post instanceof Array ? post : [];
        }
        for (var i in back) {
            src = back[i];
            target = post[i];
            if (src && typeof src == 'object') {
                if (typeof target != 'object') target = {};
                post[i] = extend(target, src);
            } else if (src != null) {
                post[i] = src;
            }
        }
        return post;
    };
    return extend({}, obj);
};