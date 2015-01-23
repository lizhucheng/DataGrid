/// <reference path="Cube.js" />
cb.model.DataState = {
    Add: 2,
    Delete: 3,
    Update: 1,
    Unchanged: 0,
	Missing:undefined//数据不在本地,
};

cb.model.Model3D = function (parent, name, data) {
    cb.model.BaseModel.call(this, parent, name, data);
    this._listeners = [];
    //this._data = data || { Rows: [], Columns: {} }; 基类中赋值,//存储自身的信息，readOnly，disabled等
    this._data.Mode = this._data.Mode || "Local";
	/*Rows数据标识当前视图中展示的数据行；模型中有一个表示按序存储的行数据结构dataSource，代表所有数据，这些数据不一定都已在本地。
	Rows和dataSource交互，从中获取数据，Rows保留dataSource中行数据的引用，使修改同步；dataSource内部和服务端交互，负责从服务端请求页数据和提交本地修改。
	dataSource提供分页配置管理。
	*/
    //this._data.Rows = this._data.Rows || []; //this._data.Rows = [{ ID: { readOnly: true, Value: 111 }, Name: 22, readOnly: true}]
	this._dataSource=[];
	this._data.Rows=[];
    this._data.Columns = this._data.Columns || {}; //this._data.Columns = { ID: { readOnly: true, disabled: true }, Name: {} };
	
	this._data.sortFields=this._data.sortFields||[];//排序信息
	this._data.mergeState=this._data.mergeState||false;//仅浏览态可用
	
    //var 基本的值包涵 = { readOnly: true, disabled: true, Value: 2 }; //原子数据
    //this._focusedRow = this._data.Rows[0] || null;
	
	//当前获取焦点的行在Rows索引位置，只有Rows中的行才能设置为聚焦行
    this._focusedRowIndex = this._data.Rows.length?0:-1;

    this._editRowModel = null;

    this._data.pageInfo = this._data.PageInfo||{};
	delete this._data.PageInfo;
	
    this.get = function (rowIndex, cellName, propertyName) {
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
            var row = rowIndex >= 0 ? this._data.Rows[rowIndex] : null;
            if (!row || !cellName)
                return row; //如果列名称cellName为空，则返回行
            var cell = row[cellName];
            return (cell && typeof cell === "object") ? cell.Value : cell;
        }
        else {
            //如果状态属性propertyName != 空，则表示要获取状态值
            if (rowIndex < 0) {
                //如果传入rowIndex==null and 列名cellName==null，则返回整体状态。
                //如果传入rowIndex==null and 列名cellName!=null，则列状态。
                return cellName ? this._data.Columns[cellName][propertyName] : this._data[propertyName];
            }
            else {
                //如果传入rowIndex!=null and 列名cellName!=null，则返回单元格状态。
                //如果传入rowIndex==null and 列名cellName==null，则行状态。
                if (!cellName)
                    return this._data.Rows[rowIndex][propertyName];
                var cell = this._data.Rows[rowIndex][cellName];
                return cell && cell[propertyName];
            }
        }
        return this;
    };
    this.set = function (rowIndex, cellName, propertyName, value) {
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
            var row = this._data.Rows[rowIndex]; // this.get(rowIndex);
            var cell = row[cellName];
            var cellIsObject = (cell && typeof cell == "object");
            var oldValue = this.get(rowIndex, cellName);
            if (oldValue === value)
                return;

            var context = { Row: rowIndex, CellName: cellName, Value: value, OldValue: oldValue };
            if (!this._before("CellValueChange", context))
                return false;
            if (cellIsObject)
                cell.Value = value;
            else
                row[cellName] = value;
            row.state = cb.model.DataState.Update;

            var args = new cb.model.PropertyChangeArgs(this._name, "CellValueChange", context);
            this.PropertyChange(args);

            this._after("CellValueChange", context); //值变化出发,无焦点要求
        }
        else {
            //获取整个控件状态
            if (rowIndex < 0 && !cellName) {
                var oldValue = this._data[propertyName];
                if (cb.isEqual(oldValue,value))//有时候属性值为对象
                    return false;

                var context = { PropertyName: propertyName, Value: value, OldValue: oldValue };
                if (!this._before("StateChange", context))
                    return false;

                this._data[propertyName] = value;

                /*遍历性能不好,不需要遍历
                //是否需要增加遍历每个单元格的propertyName属性
                for (var i = 0; i < this._data.Rows.length; i++) {
                this.set(i, null, propertyName, value);
                }
                */

                var args = new cb.model.PropertyChangeArgs(this._name, propertyName, value,oldValue);
                this.PropertyChange(args);

                this._after("StateChange", context);

            }
            //获取列状态
            else if (rowIndex < 0 && cellName) {
                var oldValue = this._data.Columns[cellName][propertyName];
                if (oldValue === value)
                    return false;

                var context = { Row: rowIndex, CellName: cellName, PropertyName: propertyName, Value: value, OldValue: oldValue, Columns: this._data.Columns };
                if (!this._before("ColumnStateChange", context))
                    return false;

                this._data.Columns[cellName] = this._data.Columns[cellName] || {};
                this._data.Columns[cellName][propertyName] = value;

                /*遍历性能不好,不需要遍历
                //是否需要增加遍历每个单元格的propertyName属性???
                for (var i = 0; i < this._data.Rows.length; i++) {
                this.set(i, cellName, propertyName, value);
                }
                */
                var args = new cb.model.PropertyChangeArgs(this._name, "ColumnStateChange", context);
                this.PropertyChange(args);

                this._after("ColumnStateChange", context);
            }
            //获取行状态
            else if (rowIndex >= 0 && !cellName) {
                var oldValue = this._data.Rows[rowIndex][propertyName];
                if (oldValue === value)
                    return;

                var context = { Row: rowIndex, PropertyName: propertyName, Value: value, OldValue: oldValue };
                if (!this._before("StateChange", context))
                    return false;

                if (!value && (propertyName == "readOnly" || propertyName == "disabled")) {
                    //如果值==false,
                    delete this._data.Rows[rowIndex][propertyName];
                }
                else {
                    this._data.Rows[rowIndex][propertyName] = value;
                }
                /*遍历性能不好,不需要遍历
                //是否需要增加遍历每个单元格的propertyName属性???
                var columns = this._data.Columns;
                for (var column in columns) {
                this.set(rowIndex, column, propertyName, value);
                }
                */
                var args = new cb.model.PropertyChangeArgs(this._name, "RowStateChange", context);
                this.PropertyChange(args);

                this._after("RowStateChange", context);
            }
            //获取单元格状态
            else if (rowIndex >= 0 && cellName) {
                var cell = this._data.Rows[rowIndex][cellName];
                var isObject = (cell && typeof cell == "object");
                var oldValue = isObject ? cell[propertyName] : undefined;
                if (oldValue === value)
                    return;

                var context = { Row: rowIndex, CellName: cellName, PropertyName: propertyName, Value: value, OldValue: oldValue };
                if (!this._before("CellStateChange", context))
                    return false;

                if (cb.isEmpty(value)) {
                    //如果置空，则列只存值
                    if (isObject)
                        delete cell[propertyName];
                    //this._data.Rows[rowIndex][cellName] = isObject ? cell.Value : cell; //不止一个属性
                }
                else if (!value && (propertyName == "readOnly" || propertyName == "disabled")) {
                    //如果值==false,
                    //this._data.Rows[rowIndex][cellName] = isObject ? cell.Value : cell;
                    if (isObject) {
                        delete cell[propertyName];
                        var hasProperty = false;
                        cb.eachIn(cell, function (attr) { if (attr != "Value" || attr != "value") { hasProperty = true; return; } });
                        if (!hasProperty)
                            this._data.Rows[rowIndex][cellName] = cell.Value;
                    }
                }
                else {
                    if (!isObject)
                        cell = this._data.Rows[rowIndex][cellName] = { Value: cell };
                    cell[propertyName] = value;
                }
                var args = new cb.model.PropertyChangeArgs(this._name, "CellStateChange", context);
                this.PropertyChange(args);

                this._after("CellStateChange", context);
            }
        }

        this.syncEditRowModel(rowIndex, cellName, propertyName, value); //需要优化一下，看放在哪里效率高
    };

	//是否合并单元格控制
	this.setMergeState=function(merge){
		if(this.set('mergeState',!!merge)!==false){//属性变化时才通知视图更新，把和并信息的计算放到绑定器中处理
			var mergeCells=null;
			if(merge){
				mergeCells=this._getMergeCells();
			}
			var args = new cb.model.PropertyChangeArgs(this._name, "mergeInfo",{rows:this._data.Rows,mergeCells:mergeCells});
			this.PropertyChange(args);	
		}
	};
	this.getMergeState=function(){return this.get('mergeState');}

	//返回当前显示行的可合并信息
	/*只统计rowspan>=2的单元格
	数据结构：{
		field1:[{index:0,rowspan:2},{index:2,rowspan:3}],
		field2:[{index:2,rowspan:2}]
	}
	*/
	this._getMergeCells=function(){
		var fields=this._data.fieldNames;
		var count=0;//统计一共有多少可合并的单元格
		var mergeCells={};
		var rows=this._data.Rows;
		var cellsInPreCol=[{index:0,rowspan:rows.length}];//前列中合并的单元格信息
		var cellsInCurCol;//当前列的合并单元格信息，当前列中合并的单元格信息依赖与前列的合并单元格信息
		var field,//当前字段名
			preMergeCell,preVal,val;//当前处理的列参照的前一列中合并的单元格
		for(var i=0,len=fields.length;i<len;i++){
			field=fields[i];
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
	};
	//单页排序设置
	this.setSortFields=function(sortFields,noReflesh){//noReflesh仅内部使用
		sortFields=cb.clone(sortFields);
		if (!this._before("sort")) {//执行前动作被阻止时，使视图和model保持一致
			var args = new cb.model.PropertyChangeArgs(this._name, "sortFields",this._data.sortFields);
			this.PropertyChange(args);
			return;
		}
		if(this.set('sortFields',sortFields)!==false && !noReflesh && sortFields.length){//如果指定不刷新这不重排序
			this._data.Rows = this._sort(this._data.Rows);
			//显示的数据集（包括排序信息）改变后，刷新界面显示
			this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "displayRows", this._data.Rows));
			this._after("sort");
		}
		
	};//应该使用副本数据，避免别处的修改印象model内部状态
	this.getSortFields=function(){return this.get('sortFields');};
	//根据模型设置的排序规则，对数据行排序，返回排序后的行对象数组
	this._sort=function(rows){
		var fields=this.getSortFields();
		if(!fields.length)return rows;
		var model3d=this,
			Model3D=cb.model.Model3D;
			columns=this._data.Columns;
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
	};	
    //#region getState
    this.setRowState = function (rowIndex, propertyName, value) {
        this.setState(rowIndex, null, propertyName, value);
    };
    this.getRowState = function (rowIndex, propertyName) {
        return this.getState(rowIndex, null, propertyName);
    };
    this.setColumnState = function (cellName, propertyName, value) {
        this.setState(null, cellName, propertyName, value);
    };
    this.getColumnState = function (cellName, propertyName) {
        return this.getState(null, cellName, propertyName);
    };
    this.setCellState = function (rowIndex, cellName, propertyName, value) {
        this.set(rowIndex, cellName, propertyName, value);
    };
    this.getCellState = function (rowIndex, cellName, propertyName) {
        return this.get(rowIndex, cellName, propertyName);
    };
    this.getReadOnly = function (rowIndex, cellName) {
        return this.get(rowIndex, cellName, "readOnly");
    };
    this.setReadOnly = function (rowIndex, cellName, value) {
        if (arguments.length == 0)
            return;
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
    };
    this.getDisabled = function (rowIndex, cellName) {
        return this.get(rowIndex, cellName, "disabled");
    };
    this.setDisabled = function (rowIndex, cellName, value) {
        this.set(rowIndex, cellName, "disabled", value);
    };
    this.getState = function (rowIndex, cellName, propertyName) {
        return propertyName ? this.get(rowIndex, cellName, propertyName) : null;
    };
    this.setState = function (rowIndex, cellName, propertyName, value) {
        if (!propertyName)
            return;
        this.set(rowIndex, cellName, propertyName, value);
    };
    //#endregion state

    this.getCellValue = function (rowIndex, cellName) {
        return this.get(rowIndex, cellName);
    };
    this.setCellValue = function (rowIndex, cellName, value) {
        this.set(rowIndex, cellName, null, value);
    };
    //界面录入值变化触发
    this.cellChange = function (rowIndex, cellName, value) {
        var oldValue = this.getCellValue(rowIndex, cellName);
        if (oldValue === value)
            return false;
        var context = { Row: rowIndex, CellName: cellName, Value: value, OldValue: oldValue };
        if (this._before("CellChange", context)) {
            this.setCellValue(rowIndex, cellName, value);
            this._after("CellChange", context)
            return true;
        }
    };
    

    this.setColumns = function (columns) {
        if (!this._before("setColumns", columns))
            return;
        //columns = cb.isArray(columns) ? columns : [columns];
        this._data.Columns = columns;
        this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "Columns", columns));
        this._after("setColumns", columns);
    };
    this.resetColumns = function () {
        this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "resetColumns", this._data.Columns));
    };
    this.getColumns = function () {
        return this._data.Columns;
    }

    this.getRows = function () {
        return this._data.Rows;
    };
    this.setRows = function (rows) {
        if (!this._before("setRows", rows))
            return;
        this._data.Rows = cb.isArray(rows) ? rows : [rows];
        for (var i = 0; i < this._data.Rows.length; i++) {
            this._$setId(this._data.Rows[i]);
            this._processRow(this._data.Rows[i]);
        }
        this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "Rows", this._data.Rows));
        this._after("setRows", rows);
    };

    this._processRow = function (row) {
        var columns = this._data.Columns;
        for (var index in columns) {
            //row[index] = row[index] || columns[index]["defaultValue"];
            if (row[index] == null) row[index] = columns[index]["defaultValue"];
        }
    };
	//根据定义的页数据过滤器，过滤行数据
	this._filter=function(rows){
		return rows;
	};
	/*
	模型中设置数据源，数据源有来源属性（标识数据直接来自远程服务器还是来自本地）；
	分页展示的定义：视图中显示的数据只是数据源的特定部分时，确定的展示方式属于分页展示（分页的具体方式可根据需要定制，例如支持普通的分页和滚动时分页，滚动时
	分页为了是视图有缓冲带，会要求分页数据之间有部分重叠）
	分页是数据展示的一种方式，独立与数据来源。
	*/
	//分页处理
	//初始化行数据状态
	this._getDataSource=function(){return this._dataSource;};
	//设置数据源，同时更新当前页数据
	this.setDataSource=function(ds){
		if(this._isRemote())return;//远程数据源不支持直接修改datasource，可以修改查询代理，间接修改datasource
		
		this._dataSource=ds||[];
		this._refreshDisplayRows();
	};
	
	//更新显示的数据行
	this._refreshDisplayRows=function(){
		var pageRows=this._getCurrentPageRows();
		if(pageRows){
			this._setPageRows(pageRows);
		}else{//数据不全在本地
			var pageServer=this._getPageServer();
			var data={
				pageIndex:this.getPageIndex(),
				pageSize:this.getPageSize()
			};
			pageServer(data,pageServerCallBack);
			
		}
	};
	
	//数据是否直接来源与服务端，如果不是，不接受设置分页查询代理
	this._isRemote=function(){
		return this._mode==='remote';
	};
	//设置分页查询代理，设置后，本地的数据清空
	this.setPageServer=function(pageSever){
		if(!this._isRemote)throw('custom exception:unsupported!');
		this._data.pageSever=pageSever;
		this._data.dataSource=[];
		this._refreshDisplayRows();
	};
	this._getPageServer=function(){
		if(!this._isRemote()||!this._data.pageServer)throw('custom exception:no pageServer');
		return this._data.pageServer.query||this._data.pageServer;
	};
	//分页请求返回后回调,context指定为this
	var pageServerCallBack=$.proxy(function(data){
		if(data.success){
			var data=data.success;
			this._setPageRows(data.Rows);
			//请求数据是肯定指定了pageSize和pageIndex,所以无须再修改
			//this._data.pageInfo.pageSize=data.pageSize;
			//this._data.pageInfo.pageIndex=data.pageIndex;
			this._data.pageInfo.totalCount=data.totalCount;
			
			//通知分页条更新
			this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "pageInfo", this._data.pageInfo));
		}else{
			alert(data.fail.message);
		}
	},this);
	
	var ds=this._getDataSource();
	this._rowsDataState=new Array(ds.length);//记录数据行的状态
	
	for(var i=0;i<ds.length;i++){
		this._rowsDataState[i]=ds[i]?cb.model.DataState.Unchanged:cb.model.DataState.Missing;
	}
	
	this._pagination=this._data.pagination;//属性实例化后就不可变
	if(this._pagination){
		//分页时默认显示第一页且每页显示50条记录
		var pageInfo=this._data.pageInfo||{};
		pageInfo.pageIndex=pageInfo.pageIndex||0;
		pageInfo.pageSize=pageInfo.pageSize||50;
		this._data.pageInfo=pageInfo;
	}
    this._mode=this._data.mode||'local';
	//rows为对应的页数据，根据model的设置（页过滤规则，排序规则），得到页面展示的数据
	this._setPageRows=function(rows){
		this._data.Rows=this._sort(this._filter(rows));
		//刷新视图
		this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "displayRows", this._data.Rows));
	};
	//初始化ds
	this.initDataSource=function(data){
		if(this._isRemote()){
			//data中包含pageSize和pageIndex信息
			data=data||{};
			data.pageSize=data.pageSize||this.getPageSize();
			data.pageIndex=data.pageIndex||this.getPageIndex();
			var pageServer=this._getPageServer();
			//pageServer(data,pageServerCallBack);
			
			pageServer(data,$.proxy(function(response){
				if(response.fail){
					alert(response.fail.message);
					return;
				}
				data=response.success;
				//更新datasource长度和内容
				this._dataSource=new Array(data.totalCount);
				this._rowsDataState=new Array(data.totalCount);
				this._updateDataSource(data.Rows,data.pageIndex,data.pageSize);
				pageServerCallBack(response);
			},this));
		}else{//data为datasource结构
			data=data||[];
			this.setDataSource(data);
		}
	};
	//数据库查询的数据到后更新数据源
	this._updateDataSource=function(rows,pageIndex,pageSize){
		//暂时简单处理，把数据放到指定位置，不考虑客户端的已有修改
		var ds=this._getDataSource();
		var rowsDataState=this._rowsDataState;
		var dataState=cb.model.Unchanged;
		for(var i=pageIndex*pageSize,count=Math.min(pageSize,rows.length);count--;i++){
			ds[i]=rows[i];
			rowsDataState[i]=dataState;
		}
	};
	var countAdded=0;//记录添加的行的数量
	this._setTotalCount=function(totalCount){
		this._data.pageInfo.totalCount=totalCount||0;
	}
	//尝试获取当前页数据，如果当前页数据不全,返回null
	this._getCurrentPageRows=function(){
		var rows=[];
		var ds=this._getDataSource();
		var dataState=cb.model.DataState.Missing;
		var pageIndex=this._data.pageInfo.pageIndex,
			pageSize=this._data.pageInfo.pageSize,
			i=pageSize*pageIndex,
			end=Math.min(pageSize*(pageIndex+1),ds.length);
		for(;i<end;i++){
			if(this._rowsDataState[i]!=dataState){
				rows.push(ds[i]);
			}else{
				return null;
			}
		}
		return rows;
	};
	this.setPageSize = function (pageSize,_inner) {//指定为内部调用时，仅仅更新内部状态，不刷新视图,加'_'前缀的参数只在内部可用
		if(!this._pagination)throw('custom exception:unsupported!');
        if (pageSize == null) {
            return;
        }
        this._data.pageInfo.pageSize = pageSize;
		this._data.pageInfo.pageIndex=0;
		if(!_inner){this._refreshDisplayRows();}
    };
    this.getPageSize = function () {
		if(!this._pagination)throw('custom exception:unsupported!');
        return this._data.pageInfo.pageSize;
    };
	this.setPageIndex=this.gotoPage=function(index,_inner){
		if(!this._pagination)throw('custom exception:unsupported!');
		var pageCount=this.getPageCount();
		if(index>=0&&index<pageCount){
			this._data.pageInfo.pageIndex=index;
			if(!_inner){this._refreshDisplayRows();}
		}
	};
	
	this.getPageIndex=function(){
		if(!this._pagination)throw('custom exception:unsupported!');
		return this._data.pageInfo.pageIndex;
	};
	this.getPageCount=function(){
		if(!this._pagination)throw('custom exception:unsupported!');
		return Math.ceil(this._data.pageInfo.totalCount/this._data.pageInfo.pageSize);
	};
	this.showNextPage=function(){
		var index=this.getPageIndex()+1;
		var pageCount=this.getPageCount();
		if(index<pageCount){
			this.setPageIndex(index);
		}
	};
	
	this.showPreviousPage=function(){
		var index=this.getPageIndex()-1;
		if(index>=0){
			this.setPageIndex(index);
		}
	};
	this.showFirstPage=function(){
		this.setPageIndex(0);
	};
	this.showLastPage=function(){
		var index=this.getPageCount()-1;
		if(index>=0){
			this.setPageIndex(index);
		}
	};
	
////
    this.commitRows = function (rows) {
        if (!this._before("commitRows", rows))
            return;
        rows = cb.isArray(rows) ? rows : [rows];
        var rowIndexes = [];
        cb.each(rows, function (row) {
            var rowIndex = (typeof row == "number") ? row : this._data.Rows.indexOf(row);
            rowIndexes.push(rowIndex);
        }, this);
        this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "commitRows", rowIndexes));
        this._after("commitRows", rowIndexes);
    };

    this.getRow = function (rowIndex) {
        return this._data.Rows[rowIndex];
    };
    this.getRowIndex = function (row) {
        return this._data.Rows.indexOf(row);
    };
    //焦点管理
	this.setFocusedRow = function (index) {
		var rows=this._data.Rows;
		if(index<0&& index>=rows.length){
			this._focusedRowIndex = -1;
            this.getEditRowModel().clear();
            return;
		}
        if (this._focusedRowIndex == index)
            return;

        if (!this._before("setFocusedRow", index))
            return;

        var oldValue = this._focusedRowIndex;
        this._focusedRowIndex = index;

        this.setEditRowModel(this._focusedRowIndex);

        var args = new cb.model.PropertyChangeArgs(this._name, "focusedRow", index, oldValue);
        this.PropertyChange(args);

        this._after("setFocusedRow", index);
    };
    this.getFocusedRow = function () {
        return this._focusedRowIndex;
    };
    //#region 选择、全选支持
    this.select = function (rows) {
		this._before("select", this);
        if (!cb.isArray(rows)) rows = [rows];
        cb.each(rows, function (index) {
            if (index == this._data.Rows.length) return;
            this._data.Rows[index].isSelected = true;
        }, this);
		//由于下面还有使用rows，所以不能直接把rows作为参数传到外部，对象参数可能被修改
        this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "select", cb.clone(rows)));
		rows.length >= 1 ? this.setFocusedRow(rows[0]) : this.setFocusedRow(-1);//使第一个参数对应的行获取焦点
        this._after("select", this);
    };
    this.unselect = function (rows) {
		if(this._before("unselect", this)===false)return;
		if (!cb.isArray(rows)) rows = [rows];	
		
        cb.each(rows, function (index) { this._data.Rows[index].isSelected = false; }, this);
        this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "unselect", rows));
        this._after("unselect", this);
    };

    this.selectAll = function () {
        if(this._before("selectAll", this)===false)return;//内部使用事件名时，用驼峰风格，外边监听事件名时用小写
        cb.each(this._data.Rows, function (row) { row.isSelected = true; }, this);
        this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "selectAll","selectAll"));//changeArgs中当前值不能等于原来的值，所以不能同时为空
        this._after("selectAll", this);
    };
    this.unselectAll = function () {
		if(this._before("unselectAll", this)===false)return;
        cb.each(this._data.Rows, function (row) { row.isSelected = false; }, this);
        this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "unselectAll","unselectAll"));
        this._after("unselectAll", this);
        
    };
	//支持多页选中
	this.getSelectedRows = function () {
        var selectedRows = [];
		var rows=this._data.dataSource;
        for (var i = 0, length = rows.length; i < length; i++) {
            if (rows[i].isSelected) {
                selectedRows.push(rows[i]);
            }
        }
        return selectedRows;
    };
	//获取当前显示的行数据中选中的行,
	this.getPageSelectedIndex=function () {
        var selectedRows = [];
		var rows=this._data.Rows;
        for (var i = 0, length = rows.length; i < length; i++) {
            if (rows[i].isSelected) {
                selectedRows.push(i);
            }
        }
        return selectedRows;
    };
    //#endregion

    //新增空行
    this.addNewRow = function () {
        if (!this._before("addNewRow"))//beforeadd
            return;
        var newRow = { state: cb.model.DataState.Add }; //新增行
        this._data.Rows.push(newRow);
        this._$setId(newRow);
        this.setFocusedRow(newRow);
        this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "addNewRow", newRow));
        this._after("addNewRow");
    };
    this.add = function (rows, isRemoveAll) {
        if (isRemoveAll) {
            this._data.Rows.removeAll();
            this.setFocusedRow(null);
        }
        if (!this._before("add", rows))//beforeadd
            return;
        rows = cb.isArray(rows) ? rows : [rows];
        for (var i = 0; i < rows.length; i++) {
            this._data.Rows.push(rows[i]); //rows可以为多行,[]
            if (!rows[i].state)
                rows[i].state == cb.model.DataState.Add; //新增行
            this._$setId(rows[i]);
        }
        if (!this._focusedRow) {
            this.setFocusedRow(this._data.Rows[0]);
        }
        this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "add", rows));
        this._after("add");
    };
    this.insert = function (rowIndex, row) {
        if (!this._before("insert", { RowIndex: rowIndex, Value: row }))
            return;
        var willSetFocusedRow;
        if (row) willSetFocusedRow = true;
        row = row || {};
        if (!row.state)
            row.state = cb.model.DataState.Add; //新增行

        this._data.Rows.insert(rowIndex, row);

        this._$setId(row);
        this._processRow(row);

        if (willSetFocusedRow == true) {
            this.setFocusedRow(this._data.Rows[rowIndex]);
        }

        //this.setDirty(rowIndex, true);
        //this.set(rowIndex, null, "State", "Add");

        this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "insert", { Row: rowIndex, Value: row }));

        this._after("insert");
    };
    this.remove = function (rows) {
        if (!this._before("remove", rows))
            return;
        var deleteRows = [];
        if (cb.isArray(rows)) {
            for (var j = 0; j < rows.length; j++) {
                var index = (typeof rows[j] == "number") ? rows[j] : this._data.Rows.indexOf(rows[j]);
                deleteRows.push(index);
            }
            deleteRows.sort(function (a, b) { return a < b ? 1 : -1; });
            cb.each(deleteRows, function (k) {
                this._backupDeleteRows(this._data.Rows[k]);
                this._data.Rows.remove(k);
            }, this);
        }
        else {
            var index2 = (typeof rows == "number") ? rows : this._data.Rows.indexOf(rows);
            deleteRows.push(index2);
            this._backupDeleteRows(this._data.Rows[index2]);
            this._data.Rows.remove(index2);
        }

        this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "remove", deleteRows));

        this._after("remove");
    };
    this.updateRow = function (row, modifyData) {
        if (!row || !modifyData)
            return;
        var rowIndex = this.getRowIndex(row);
        if (rowIndex < 0)
            return;
        for (var attr in modifyData) {
            this.set(rowIndex, attr, null, value);
        }
    };
    this._backupDeleteRows = function (row) {
        if (row && row.state != cb.model.DataState.Add) {
            this._data.DeleteRows = this._data.DeleteRows || [];
            row.state = cb.model.DataState.Delete;
            this._data.DeleteRows.push(row);                //删除数据,脏数据处理逻辑，删除？？
        }
    }
    this.removeAll = function () {
        if (!this._before("removeAll"))
            return;

        this._data.Rows.removeAll();
        this.setFocusedRow(null);

        //this.setDirty(true);
        this.PropertyChange(new cb.model.PropertyChangeArgs(this._name, "removeAll", this));

        this._after("removeAll");
    };



    this.setDirty = function (rowIndex, value) {
        //this.set(rowIndex, null, "IsDirty", value);
    };
    this.getDirty = function (rowIndex) {
        if (!rowIndex)
            return this._data["IsDirty"];
        //return this.get(rowIndex, null, "IsDirty");
        var rowState = this.get(rowIndex, null, "State");
        return rowState != null || rowState != cb.model.DataState.Unchanged;
    };

    this.onChangePage = function (pageSize, pageIndex) {

        var cache = this._data.Cache;
        if (cache) {
            var pageCount = this._data.PageInfo.pageCount;
            var totalCount = this._data.PageInfo.totalCount;
            var tempPageCount = totalCount / pageSize;
            if (tempPageCount !== parseInt(tempPageCount)) tempPageCount = parseInt(tempPageCount) + 1;
            if (pageCount !== tempPageCount) this._data.PageInfo.pageCount = pageCount = tempPageCount;
            if (pageSize == this._data.PageInfo.pageSize) {

                var start = pageIndex * pageSize - pageSize;
                var end = pageIndex * pageSize;
                var rows = [];
                for (var i = start; i < end; i++) {
                    if (cache[i])
                        rows.push(cache[i]);
                }
                if (rows.length == pageSize) {
                    this.setPageRows({ pageSize: pageSize, pageIndex: pageIndex, pageCount: pageCount, totalCount: totalCount, currentPageData: rows }, false);
                    return;
                }
            }
            else {
                this._data.Cache = {};
            }
        }

        this.fireEvent("changePage", { pageSize: pageSize, pageIndex: pageIndex });
    };

    this.setGridDataMode = function (mode) {
        this._data.Mode = mode;
    }

    this.getGridDataMode = function () {
        return this._data.Mode;
    }

    this._before = function (eventName, args) {
        return this.excute("before" + eventName, args);
    }
    this._after = function (eventName, args) {
        return this.excute("after" + eventName, args);
    }
    this.fireEvent = function (eventName, args) {
        if (this.excute("before" + eventName, args)) {
            this.excute(eventName, args);
            this.excute("after" + eventName, args);
        }
    };

    this.syncEditRowModel = function (rowIndex, cellName, propertyName, value) {
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
    };
    this.setEditRowModel = function (data) {
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
    }
    this.getEditRowModel = function () {
        if (!this._editRowModel)
            this.setEditRowModel(this._focusedRow);
        return this._editRowModel;
    };

    //原子数据类型 { value: null,readOnly:false,disabled:false }
    this.toAtomicData = function (data) {
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
    };
};

cb.model.Model3D.prototype.getPkName = function () {
	 var columns = this._data.Columns||{};
	 for (var col in columns) {
		colData = columns[col];
		if (!colData || !colData.constructor == Object)
			continue;
		if(colData["key"]==true||colData["isKey"]==true)
			return col
	 }
	 return "id";
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
    if (data.constructor == Array)
        data = { Rows: data };
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
        var rows = this._data.Rows; ////this._data.Cache;???//多页数据怎么处理
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
            var rows = this._data.Rows.clone(); //this._data.Cache;???//多页数据怎么处理
            if (this._data.Rows.length == 0) rows.length = 0;
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
            return this._data.Rows;
        }
    }
}

cb.model.Model3D.prototype = new cb.model.BaseModel();

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