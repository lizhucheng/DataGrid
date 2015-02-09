!function($){
$.extend(true, window, {
	"cb": {
		"controls": {
			"DataGrid": DataGrid
		}
	}
});
//随机背景，用于测试
var COLORS=['#ff0','#fea','#0fe','#0ff'];
//Enum/~
//DataGrid.TextAlign={'LEFT':'left','RIGHT':'right','CENTER':'center'},
//DataGrid.VAlign={'TOP':'top','MIDDLE':'middle','BOTTOM':'bottom'};

//可排序的列有三种排序状态，递增，递减，不排序
DataGrid.SortStatus={'ASC':'asc','DESC':'desc','NONE':''};	
//Enum~/

//定义存储列标识的属性名称
var FIELDNAME_PROP='$name';
DataGrid.FIELDNAME_PROP=FIELDNAME_PROP;
//控件类型和数值类型适配
var ctrlValTypeMap={
	'CheckBox':'Boolean',
	'TextBox':'String',
	'DateTimeBox':'Date',
	'NumberBox':'Number',
	'ComboBox':'String',
	'Refer':'String'
	
};
var ctrlFormatterMap={
	'CheckBox':'CheckboxFormatter',
	'TextBox':'defaultFormatter',
	'DateTimeBox':'DateTimeFormatter',
	'NumberBox':'NumberFormatter',
	'ComboBox':'defaultFormatter',
	'Refer':'ReferFormatter'
};
//控件类型对应的默认编辑器
var ctrlEditorMap={
	'CheckBox':'CheckboxEditor',
	'TextBox':'TextBoxEditor',
	'DateTimeBox':'DateTimeEditor',
	'NumberBox':'NumberBoxEditor',
	'ComboBox':'ComboxEditor',
	'Refer':'ReferEditor'
};
//定义Column类型是为了管理列的默认值
function Column(config,name){	
	$.extend(true,this,config);
	this[FIELDNAME_PROP]=name||config[FIELDNAME_PROP];
	this.title=this.title||this[FIELDNAME_PROP];
	if(this.ctrlType==='ComboBox'&&this.dataSource){
		//生成实例默认的格式化方法
		this.formatter=function(ds){
			return function(value){
				for(var i=0,len=ds.length;i<len;i++){
					if(ds[i].value==value){return ds[i].text;}//2=='2'
				}
				return value;
			};
		}(this.dataSource);
	}
}
Column.prototype={
	constructor:Column,
	
	//defaults/~
	visible:true,	//列是否可见
	resizable:true,	//列是否可拖动改变列宽
	textAlign:'left',	//列文本水分方向对齐方式
	headerTextAlign:'center',	//表头文本水平对齐方式，默认居中
	width:120,	//宽度
	sortable:true,
	annexable:true,//列数据是否可合并，有时候同列的数据表示的意义不同，列内不支持合并（例如不同币种下的数值，此时合并会破坏数据意义）
	order:'none',// 'asc','desc'
	//formatter:'',
	//sortStatus:0,//字段当前排序状态；值0、1、2分别表示未排序，递增排序，递减排序；这个信息在模型内部管理
	autoWrap:false,//内容是否自动换行
	//defaults~/
	type:'String',//列数据类型，默认为字符串类型
	//getName:function(){return this.[FIELDNAME_PROP];},//不提供这个方法了，直接使用this.[FIELDNAME_PROP]避免函数调用
	//cssCls:'',	//列层次的样式定义（通过指定class与css中定义的样式关联）
	//colStyle:function(index){},
	//onclick:function(){}
	/*如果自定义了格式化方法就用自定义的格式化函数格式化，如果通过名字指定了一个内置的格式格式化方法，
	则用对应的内置格式化方法，如果没有使用列数值类型默认的格式化方法，最后使用平凡的格式化方法*/
	getFormatter:function(){
		return typeof this.formatter==='function'?this.formatter:DataGrid.formatters[this.formatter||ctrlFormatterMap[this.ctrlType]]||DataGrid.formatters['defaultFormatter'];
	},
	//获取当前列的列对齐方式
	getTextAlign:function(){
		var alignClsMap={
			left:'textAlignLeft',
			right:'textAlignRight',
			center:'textAlignCenter'
		};
		var textAlign=this.textAlign.toLowerCase();
		if(!this.hasOwnProperty('textAlign')||!textAlign||!alignClsMap[textAlign]){//如果列没定义对齐方式，或定义的对齐方式无效，则根据类型使用类型默认的对齐方式
			switch(ctrlValTypeMap[this.ctrlType]){
				case 'Number':textAlign='right';break;
				case 'Boolean':textAlign='center';break;
				default:textAlign='left';break;
			}
		}
		return textAlign==='right'||textAlign==='center'?alignClsMap[textAlign]:'';//默认居左,不设置className
	},
	isEditable:function(){
		return !(this.alwaysReadOnly||this.readOnly);
	},
	getField:function(){
		return this[FIELDNAME_PROP];
	}
};

function createColumns(fields){
	var cols=[];
	for(var i=0,len=fields.length;i<len;i++){
		cols.push(new Column(fields[i]));
	}
	return cols;
}
//排序状态表
var sortStatus={
	'none':{
		next:'asc',
		//direction:0,
		//cls:''
	},
	'asc':{
		next:'desc',
		direction:1,
		cls:'sortAsc'
	},
	'desc':{
		next:'none',
		direction:-1,
		cls:'sortDesc'
	}
};
var valToStatus={
	'1':'asc',
	'-1':'desc'
};
//const/~
DataGrid.CELLPADDING=1;
DataGrid.BORDERWIDTH=1;
DataGrid.ROWNOCOL={
	$name:'__rowNo',
	type:'Number',
	width:35,
	readOnly:true,
	sortable:false,
	resizable:false
};
DataGrid.CHECKBOXCOL={
	$name:'__chkBox',
	type:'Boolean',
	width:35,
	readOnly:true,
	sortable:false,
	resizable:false,
	formatter:function(value,dataContext){
		return '<input type="checkbox" class="checkable" />';
	}
};
DataGrid.TEMPLATE='<div class="view">\
	<div class="viewHeader">\
		<div class="header">\
			<div class="header1"><table border="0"><thead></thead></table></div>\
			<div class="header2"><table border="0"><thead></thead></table></div>\
		</div>\
	</div>\
	<div class="viewBody">\
		<table><thead></thead><tbody></tbody></table>\
		<div class="refLine"></div>\
		<div class="frozenBoundary"><div></div></div>\
	</div>\
</div>'
//const~/
//
function DataGrid(el,options){
	//调用兼容处理
	if(!(this instanceof DataGrid))return new DataGrid(el,options);
	if(typeof el==='string'&& el.charAt(0)!='#'){el='#'+el;}

	this.$el=$(el).first();
	this.$el.addClass('grid');
	this._initEvents();
	//支持延时实例初始化
	if(typeof options==='object'){
		this.init(options);
	}
}
DataGrid.prototype={
	constructor:DataGrid,
	//defaults
	frozenIndex:-1,//不考虑行号列和checkbox列
	showCheckBox:false,
	showRowNo:true,
	multiSort:true,//是否支持多列排序
	//用于列集变动后同步field和Column映射关系（建立索引是为了方便查询）
	_rebuildColMap:function(){
		this._nameColMap={};
		var cols=this.cols;
		for(var i=0,len=cols.length;i<len;i++){
			this._nameColMap[cols[i][FIELDNAME_PROP]]=cols[i];
		}
	},
	getColumn:function(field){
		return this._nameColMap[field];
	},
	init:function(opts){
		opts=opts||{};
		var fields=opts.fields||[];
		delete opts.fields;
		$.extend(true,this,opts);
		this.cols=createColumns(fields);
		
		var frozenField='';
		//检查是否有行号列、checkbox列
		if(this.showCheckBox){
			this.cols.unshift(new Column(DataGrid.CHECKBOXCOL));
			frozenField=DataGrid.CHECKBOXCOL[FIELDNAME_PROP];
		}
		if(this.showRowNo){
			this.cols.unshift(new Column(DataGrid.ROWNOCOL));	
			frozenField=frozenField||DataGrid.ROWNOCOL[FIELDNAME_PROP];
		}
		this.autoWrap=!!opts.autoWrap;
		this._rebuildColMap();
		//初始化固定列边界
		//如果指定的列存在，则用指定的列作为边界，否则根据是否显示行序号列和checkbox选择相应的列作为固定边界。
		frozenField=this.getColumn(this.frozenField||'')?this.frozenField:frozenField;
		this._setFrozenField(frozenField,true);
		
		this.sortFields=[];//元素为数组，数组第一个分量为字段名，第二个为1或-1;
		this.render(opts.rows);
		
		if(this.editable&&this.editMode=='CellEditor'&&!this.editors){
			this._cellEditors=$.extend(true,{},DataGrid.cellEditors);//创建每种类型的编辑器实例;//避免被模型中的属性覆盖，加_;
		}
	},
	//只设置状态，不改变视图
	_setFrozenField:function(field,inner){
		var col=this.getColumn(field);
		//if(!inner){//使在内部支持设置行序列和checkbox列为固定列边界
			//if(field==DataGrid.ROWNOCOL[FIELDNAME_PROP] || field==DataGrid.ROWNOCOL[FIELDNAME_PROP])return;
		//}
		if(col){
			this.frozenField=field;
			this.frozenIndex=this.cols.indexOf(col);
		}	
	},
	//按指定的索引，固定索引对应的列（-1时没有固定列）
	_frozeColByIndex:function(index){
		index=Math.min(Math.max(-1,index),this.cols.length-1);
		var original=this.frozenIndex;
		this.frozenField=index>0 && index<this.cols.length?this.cols[index][FIELDNAME_PROP]:'';
		this.frozenIndex=index;
		
		var diff=index-original;
		if(diff){
			this._fixFrozenColumn(original);
		}
	},
	frozeColumn:function(field){
		if(!this.getColumn(field)){return;}
		
		var original=this.frozenIndex;
		this._setFrozenField(field);
		var diff=this.frozenIndex-original;
		if(diff){
			this._fixFrozenColumn(original);
		}
	},
	//左右两个视图中列之间的移动操作（把左边的最后面的指定列数移动到右边，把右边的前面的列移动到左边的最后），用于实现固定列操作辅组方法
	_moveColumn:function(count){
		if(!count)return;
		var ltr=!!(count<0);
		count=Math.abs(count);
		
		var $el=this.$el;
		//默认从右移到左
		var from='.header2 tr',to='.header1 tr';
		
		var index=count;
		var select='td:lt('+index+')';
		var insertTo='appendTo';
		var $to=$(to,$el);
		var $from=$(from,$el);
		if(ltr){
			var temp=from;
			from=to;
			to=temp;
			temp=$from;
			$from=$to;
			$to=temp;
			index=$from.first().find('>td').length-count-1;
			select='td:gt('+index+')';
			if(index==-1){select='td';}//jQuery 使用:gt(-1)会出问题
			insertTo='prependTo';
		}
		
		$from.each(function(i,tr){
			$(select,tr)[insertTo]($to[i]);
		});
	},
	_fixFrozenColumn:function(original){
		var index=this.frozenIndex;
		//调整表头
		this._moveColumn(index-original);
		//调整表体
		var tb=$('.viewBody>table',this.$el);
		var slice=[].slice;
		var rows=slice.call($('.viewBody>table',this.$el)[0].rows,0);			
		rows.shift();
		
		var td,
			left=this.$el.children('.view')[0].scrollLeft+'px';
		console.log('left:',left);
		for(var i=0,len=rows.length;i<len;i++){
			$(rows[i].cells[original]).toggleClass('frozen');
			$(rows[i].cells[index]).toggleClass('frozen');
			//调整td内容位置
			for(var j=0;j<=index;j++){
				td=rows[i].cells[j];
				td.firstChild.style.left=left;
				td.lastChild.style.left=left;
			}
			for(var j=index+1;j<=original;j++){
				td=rows[i].cells[j];
				td.firstChild.style.left=0;
				td.lastChild.style.left=0;
			}
		}
		this.$el[this.frozenIndex==-1?'addClass':'removeClass']('noFrozen');
		this._fixFrozenHandlerPosition();
	},
	/*渲染整个表格控件，包括表头和表数据,表尾（注：分页以插件的形势存在，Grid可添加分页插件，为分页插件提供和model交互的接口，通过接口转发分页插件的命令）*/
	render:function(data){
		var $el=this.$el;

		this.$el.html('');
		var view=$(DataGrid.TEMPLATE),
			frozenCols=this._getTheaderHtml(true,true),
			otherCols=this._getTheaderHtml(false,true);
			
		$('.header1 thead',view).each(function(i,ele){
			//ele.innerHTML='<tr>'+frozenCols+'</tr>';
			$(ele).html('<tr>'+frozenCols+'</tr>');
		});
		$('.header2 thead',view).each(function(i,ele){
			//ele.innerHTML='<tr>'+otherCols+'</tr>';
			$(ele).html('<tr>'+otherCols+'</tr>');
		});
		
		$('.viewBody thead',view).each(function(i,ele){
			//ele.innerHTML='<tr>'+frozenCols+otherCols+'</tr>';
			$(ele).html('<tr>'+frozenCols+otherCols+'</tr>');
		});
		if (this.autoWrap) {
		    view.addClass('autoWrap');
		}
		$el.append(view);
		//记录初始滚动值
		this._lastScrollTop=0;
		this._lastScrollLeft=0;
	
		this._initEventsAfterRender();
		//调整固定边界位置
		this._fixFrozenHandlerPosition();
		
		view=null;
		if(data instanceof Array){this.loadData(data);}
	},
	//根据当前固定列位置，调整固定边界操作区域位置
	_fixFrozenHandlerPosition:function(){
		var left=0;
		for(var i=0,len=this.frozenIndex;i<=len;i++){
			if(this.cols[i].visible){
				left+=this.cols[i].width;
			}
		}
		var view=this.$el.children('.view');
		$('.frozenBoundary',view).css('left',left+view[0].scrollLeft+'px');
	},
	_initEventsAfterRender:function(){
		var dg=this;
		var view=this.$el.children('.view');
		view.off('scroll');
		view.scroll(function(evt){
			dg._fixScroll(evt);
		});
		
		//复选框事件处理
		if(this.showCheckBox){
			this.$el.on('click','.header .chkAll input',function(evt){
				if(this.checked){
					dg.selectAll();
				}else{
					dg.unselectAll();
				}
			});
			
			//内容行checkbox点击事件处理
			this.$el.on('click','input.checkable',function(evt){
				var row=$(this).closest('tr')[0],
					rows=dg._getRows(),
					index=rows.indexOf(row);
				if(this.checked){					
					dg.select(index);
				}else{
					dg.unselect(index);
				}
			});
		}
		//拖动调整列宽
		$('.header .col-resizer',view).drag('draginit',function(ev, dd){
			$(this).addClass('active');
			
			var left=dd.offsetX-$('.view .viewBody',dg.$el).offset().left+6;
			$('.view .refLine',dg.$el).css('left',left+'px');
			$('.view .refLine',dg.$el).show();
		}).drag('drag',function(ev, dd){
			$(this).css('right',-6-dd.deltaX);
			//实时显示参照线
			var left=dd.offsetX-$('.view .viewBody',dg.$el).offset().left+6;
			$('.view .refLine',dg.$el).css('left',left+'px');
			
		}).drag('dragend',function(ev, dd){
			$(this).addClass('active');
			var $col=$(this).closest('[data-field]');
			var field=$col.data('field');
			var colWidth=parseInt($col[0].style.width);//此处不能用col.width();chrome中获取通过这种方式获取宽度时有问题。
			var width=dd.deltaX+colWidth;//避免宽度设置为负数
			console.log('field,width:',field,',',width);
			dg.setColWidth(field,width);
			$(this).css('right',-6);
			$(this).removeClass('active');
			$('.view .refLine',dg.$el).hide();
		}).on('dblclick',function(evt){
			var view = dg.$el.children('.view');

		    if (dg.autoWrap) view.removeClass('autoWrap');
		    view.addClass('autoLayout');
			var field=$(this).closest('td').data('field');
			var width=0;
			view.find('thead td[data-field='+field+']').each(function(i,td){
				width=Math.max(width,$(td).width());
			});
			if (dg.autoWrap) view.addClass('autoWrap');
			view.removeClass('autoLayout');
			
			$('.view .refLine',dg.$el).hide();
			dg.setColWidth(field,width);
		});
		//拖动固定列边界，设置固定列位置
		$('.frozenBoundary',view).drag('draginit',function(ev, dd){
			$('.view',dg.$el)[0].scrollLeft=0;
		}).drag('drag',function(ev, dd){
			var left=dd.offsetX-$('.view .viewBody',dg.$el).offset().left;
			$(this).css('left',left+'px');		
		}).drag('dragend',function(ev, dd){
			var left=dd.offsetX-$('.view .viewBody',dg.$el).offset().left;
			
			//确定边界所在的列
			var cols=dg.cols;
			var width=0;
			var i=-1;
			while(width<left){
				i++;
				if(cols[i].visible){
					width+=cols[i].width;
				}
			}

			if(i<dg.showCheckBox+dg.showRowNo-1){
				//使不能把固定列设置在checkbox列之前
				i=dg.showCheckBox+dg.showRowNo-1;
				width=0;
				for(var j=0;j<=i;j++){
					if(cols[i].visible){
						width+=cols[i].width;
					}
				}
			}
			$(this).css('left',width+'px');
			dg._frozeColByIndex(i);
		});
	},
	_initEvents:function(){
		var dg=this;
		$(document).click(function(evt){
			//dg._currentEditor表示当前活动的编辑器
			if(dg._currentEditor&&!dg._documentIgnoreThisClick){
				dg._commitCellChange();
			}else{
				delete dg._documentIgnoreThisClick;
			}
		});
		this.$el.on('click','.viewHeader .cell',function(evt){
			//拖动手柄上的点击不处理
			if($(evt.target).is('.col-resizer'))return;
			if(dg.editable)return;
			var sortFields;
			var cell=$(this);
			var field=cell.data('field');

			var col=dg.getColumn(field);
			//忽略不可排序列上的排序动作
			if(!col.sortable){return;}
			
			var nextStatus=sortStatus[col['order']||'none'].next;
			
			if(!evt.ctrlKey){
				if(nextStatus!=='none'){
					sortFields=[[field,sortStatus[nextStatus].direction]];
				}else{
					sortFields=[];
				}
				
			}else{
				
				//本来这个地方应该使用副本的，此处不处理状态，只收集参数数据；但考虑到，事件后肯定要更新状态，所以就容忍局部的状态不统一了
				sortFields=clone(dg.getSortFields());
				var existed=false;
				$.each(sortFields,function(i,item){
					if(item[0]===field){
						existed=i;
						return false;
					}
				});
				
				if(existed!==false){	
					if(nextStatus==='none'){
						sortFields.splice(existed,1);
					}else{
						sortFields[existed][1]=sortStatus[nextStatus].direction;
					}
					
				}else{//如果之前没有参与排序，则点击后的排序状态肯定非none
					sortFields.push([field,sortStatus[nextStatus].direction])
				}	
				
			}
			
			//如果点击后变为列排序状态变为不排序，则不从model刷新视图
			dg._sortBy(sortFields,nextStatus==='none'?true:false);
		});
		
		//点击行时，行获得焦点
		this.$el.on('click','.viewBody tr[data-role=row]',function(evt){
				if($(evt.target).closest('.cellEditorWrapper').length)return;
				var row=$(this).closest('tr')[0],
					rows=dg._getRows(),
					index=rows.indexOf(row);
				dg.setFocusedRow(index);
				dg.execute('clickRow',index);//对外提供点击行事件
			});
		//双击行
		this.$el.on('dblclick','.viewBody tr[data-role=row]',function(evt){
				var row=$(this).closest('tr')[0],
					rows=dg._getRows(),
					index=rows.indexOf(row);
				dg.execute('dblClickRow',index);//对外提供点击行事件
			});
		//点击单元格
		this.$el.on('click','.viewBody .cell',function(evt){
			if($(evt.target).closest('.cellEditorWrapper').length)return;
			var field=$(this).data('field');
			var rowIndex=$(this.parentNode).index();
		
			//处理之前编辑的单元格
			if(dg._currentEditor&&(dg._editRowIndex!==rowIndex||dg._editingField!==field)){
				dg._commitCellChange();
			}
			if(dg.editable&&!dg.getColumn(field).readOnly){
				dg.execute('beforeCellEditing',{rowIndex:rowIndex,field:field});
				dg._documentIgnoreThisClick=true;//标记这次点击触发了beforeCellEditing
			}
			//evt.stopPropagation();
		});
	},
	//提交字段的修改(当在处于编辑态的单元格外点击时，触发提交修改)
	_commitCellChange:function(){
		var currentValue=dg._currentEditor.getValue(),
			initValue=dg._currentEditor.initValue;
		//移除编辑器
		
		var lastEditedCell=$(dg.cellEditorWrapper).closest('.cell');
		var lastEditedRow=lastEditedCell.parent(),
			lastCellIndex=lastEditedCell.index();
		dg._docFragment.appendChild(dg.cellEditorWrapper);
		dg._docFragment.appendChild(dg._currentEditor.el);
		lastEditedCell.removeClass('editing');
		delete dg._currentEditor.initValue;
		delete dg._currentEditor;
		//如果值有改变，同步到model
		if(currentValue!==initValue){
			//尝试修改model
			dg.execute('cellChange',{field:dg._editingField,rowIndex:dg._editRowIndex,value:currentValue});
			
		}
		//如果值被修改了，整个td会被更新，这时候之前的td已经不存在，所以下面的
		$('.cellContent',lastEditedRow[0].cells[lastCellIndex]).css('visibility','visible');//显示内容
	},
	_fixScroll:function(evt){
		var view=this.$el.children('.view');
		//console.log(evt);
		//处理垂直滚动
		if(view[0].scrollTop!=this._lastScrollTop){
			$('.viewHeader',view)[0].style.top=view[0].scrollTop+'px';
			this._lastScrollTop=view[0].scrollTop;
		}
		
		if(view[0].scrollLeft==this._lastScrollLeft){
			console.log('垂直滚动，不处理水平定位');
			return;
		}
		var scrollDelta=view[0].scrollLeft-this._lastScrollLeft;
		this._lastScrollLeft=view[0].scrollLeft;
		
		var tb=$('.viewBody>table',this.$el);
		var slice=[].slice;
		var rows=slice.call($('.viewBody>table',this.$el)[0].rows,0);			
		rows.shift();

		var end=this.frozenIndex+1;		
		var left=view[0].scrollLeft+'px';
		
		$('.viewHeader',view)[0].style.left=left;
		$('.header2>table',view)[0].style.marginLeft=0-view[0].scrollLeft+'px';
		//处理固定列边界
		var frozenBoundary=$('.frozenBoundary',view);
		if(frozenBoundary){
			frozenBoundary[0].style.left=scrollDelta+(parseInt(frozenBoundary.css('left'))||0)+'px';
		}

		var rowSpan=new Array(end-1);
		$.each(rowSpan,function(i,item){item=0;});
		for(var i=0,len=rows.length;i<len;i++){
			tds=slice.call(rows[i].cells,0,end);
			for(var j=0;j<end;j++){				
				if(!rowSpan[j]){
					var td=tds.shift();
					td.firstChild.style.left=left;
					td.lastChild.style.left=left;
					if(td.rowSpan){
						rowSpan[j]=td.rowSpan-1;
					}
				}else{//同列中前面的行的rowSpan到达当前位置时，这个td不存在，不需要处理
					rowSpan[j]--;
				}
			}
		}
		
	},
	//显示数据行
	loadData:function(data){
		var html=this._getTbodyHtml(data),
			$el=this.$el;
		
		$('.viewBody',$el).hide();
		$('.viewBody tbody',$el).html(html);
		if(this.getMergeState()){
			this.mergeCells(this._getMergeCells(data));
		}
		$('.viewBody').show();
	},
	_getMergeCells:function(data){
		var cols=this.cols;
		var count=0;//统计一共有多少可合并的单元格
		var mergeCells={};
		var rows=data;
		var cellsInPreCol=[{index:0,rowspan:rows.length}];//前列中合并的单元格信息
		var cellsInCurCol;//当前列的合并单元格信息，当前列中合并的单元格信息依赖与前列的合并单元格信息
		var field,//当前字段名
			preMergeCell,preVal,val;//当前处理的列参照的前一列中合并的单元格
		var i=0+this.showCheckBox+this.showRowNo;
		
		for(var i=0+this.showCheckBox+this.showRowNo,len=cols.length;i<len;i++){
			if(!cols[i].annexable)break;
			field=cols[i][FIELDNAME_PROP];
			cellsInCurCol=[];
			for(var j=0;j<cellsInPreCol.length;j++){
				preMergeCell=cellsInPreCol[j];
				var k=preMergeCell['index'],end=k+preMergeCell.rowspan;
				var rowspan=0;
				do{
					//val=this.get(k,field);
					val=rows[k][field]&&typeof rows[k][field]=='object'?rows[k][field].value:rows[k][field];
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
	setColWidth:function(field,width){
		if(!this._nameColMap[field])return;
		
		
		//改变表头宽度
		width=Math.max(50,width);//避免列太窄
		//var delta=width-$('[data-field='+field+']').width();
		var delta=width-parseInt($('.header [data-field='+field+']:eq(0)',this.$el)[0].style.width);
		$('[data-field='+field+']:eq(0)',this.$el.find('.header,.viewBody')).width(width);
		
		var index=this.cols.indexOf(this._nameColMap[field]);
		//更新列width属性
		this.cols[index].width=width;
		//更新固定列边界位置
		if(index<=this.frozenIndex){
			var frozenBoundary=$('.frozenBoundary',this.$el);
			if(frozenBoundary){
				frozenBoundary[0].style.left=delta+(parseInt(frozenBoundary.css('left'))||0)+'px';
			}
		}
		
	},
	_getColIndex:function(field){
		var col=this._nameColMap[field];
		return col?this.cols.indexOf(col) : -1;
	},
	
	_setColVisible:function(field,visible){
		var index=this._getColIndex(field);
		visible=!!visible;
		var display=visible?'':'none';
		//列存在且要设置的visible状态和当前状态不一致时才处理
		if(index>-1&&this.cols[index].visible!==visible){
			this.cols[index].visible=visible;
			
			var headerColIndex=index,//指定列在表头的索引
				bodyColIndex=index;
			var tables='.header1>table,.viewBody>table';
			if(index>this.frozenIndex){
				headerColIndex=index-this.frozenIndex-1;
				tables='.header2>table,.viewBody>table';
			}	
			this.$el.find(tables).each(function(i,el){
				var index=i?bodyColIndex:headerColIndex;
				//table.rows并不是数组，而是一个HTMLCollection对象，所以不能直接用数组的迭代方法
				Array.prototype.slice.call(el.rows,0).forEach(function(tr,i){
					tr.cells[index].style.display=display;
				});
			});
		}
	},
	showColumn:function(field){
		this._setColVisible(field,true);
	},
	hideColumn:function(field){
		this._setColVisible(field,false);
	},
	_toggleColumn:function(field){//方便测试时使用
		var col=this._nameColMap[field];
		this._setColVisible(field,col&&!col.visible);
	},
	_getTheaderHtml:function(frozen,noTr){//frozen标识是否获取固定列对应的表头
		var colCount=this.cols.length,
			arr=new Array(30),
			frozenIndex=this.frozenIndex,	
			start=!frozen ? frozenIndex+1:0,
			end=!frozen ?colCount:frozenIndex+1,
			j=0,
			i=start;
			
		if(!noTr){arr[j++]='<tr>';}
		for(;i<end;i++){
			arr[j++]=this._getThCellOuterHtml(this.cols[i])
		}
		if(!noTr){arr[j++]='</tr>';}
		return arr.join('');
	},
	_getThCellOuterHtml:function(field){	
		var col;
		//参数兼容处理，使支持Column对象
		if(field instanceof Column){
			col=field;
			field=col[FIELDNAME_PROP];}
		else{
			col=this.getColumn(field);
		}
		if(!col){
			throw('expection message:列'+field+'不存在!');
		};

		if(col[FIELDNAME_PROP]===DataGrid.ROWNOCOL[FIELDNAME_PROP]){
			return '<td class="cell rowNoCol" style="width:'+col.width+'px;" data-field="'+field+'"><div class="cellBorder"></div></td>';
		}
		if(col[FIELDNAME_PROP]===DataGrid.CHECKBOXCOL[FIELDNAME_PROP]){
			return '<td class="cell chkCol chkAll" style="width:'+col.width+'px;" data-field="'+field+'"><div class="cellContent"><input type="checkbox" /></div><div class="cellBorder"></div></td>';
		}
		
		var arr=new Array(10);
		var j=0;
		arr[j++] = '<td class="cell';
		arr[j++] = !col.visible ? ' hidden" style="width:' : '" style="width:';
		arr[j++]=col.width;
		arr[j++]='px;" data-field="';
		arr[j++]=col[FIELDNAME_PROP];
		arr[j++]='">';
		arr[j++]='<div class="cellContent"><span class="title">';
		arr[j++]=col.title;
		arr[j++]='</span>';
		if(col.sortable){
			arr[j++]='<span class="sortIcon"></span>';
		}
		if(col.resizable){
			arr[j++]='<span class="col-resizer"></span>';
		}
		arr[j++]='</div><div class="cellBorder"></div></td>';
		return arr.join('');
	},
	_getTbodyHtml:function(data){
		var cols=this.cols,
			colCount=cols.length,
			arr=new Array(100),
			
			j=0,
			i,field,row,value;
		var left=this.$el.find('.view')[0].scrollLeft;
		var frozenIndex=this.frozenIndex;
		for(var s=0,len=data.length;s<len;s++){
			row=data[s];
			arr[j++]='<tr data-role="row">';	
			for(i=0;i<colCount;i++){
				field=cols[i][FIELDNAME_PROP];
				if(field!=DataGrid.ROWNOCOL[FIELDNAME_PROP]&&field!=DataGrid.CHECKBOXCOL[FIELDNAME_PROP]){
					value=row[field];
				}else if(field===DataGrid.ROWNOCOL[FIELDNAME_PROP]){
					value=s+1;
				}
				arr[j++]=this._getTdCellOuterHtml(this.cols[i],value,row,i<=frozenIndex?left:0,!i);
			}
			arr[j++]='</tr>';
		}
		
		return arr.join('');
	},
	//判断指定列是否固定
	_isFrozenedColumn:function(col){
		if(typeof col==='string'){
			col=this._nameColMap[col];
		}
		return this.cols.indexOf(col)<=this.frozenIndex;
	},
	//判断是否是显示的第一列
	_isFirstColumn:function(col){
		if(typeof col==='string'){
			col=this._nameColMap[col];
		}
		var cols=this.cols;
		var firstVisible=null;
		for(var i=0,len=cols.length;i<len;i++){
			if(cols[i].visible){firstVisible=cols[i];break;}
		}
		return firstVisible&&col===firstVisible;
	},
	_getTdCellOuterHtml2:function(col,value,dataContext){
		var first=this._isFirstColumn(col);
		var left=this._isFrozenedColumn(col);
		var html=this._getTdCellOuterHtml(col,value,dataContext,left,first);
		return html;
	},
	_getTdCellOuterHtml:function(col,value,dataContext,left,first){
		//todo:后续需支持具体到单元格的格式化，这时候fomatter信息有行数据指定。
		var contentHtml=col.getFormatter().call(col,value,dataContext);
		var arr=new Array(30),j=0;
		arr[j++]='<td class="cell field';
		arr[j++]=' '+col.getTextAlign();
		arr[j++]=first?' first':'';
		arr[j++] = !col.visible ? ' hidden' : '';
		arr[j++]=col[FIELDNAME_PROP]!==this.frozenField?'':' frozen';
		arr[j++]='" data-field="'+col[FIELDNAME_PROP]+'">';//每个数据容器记录field信息，方便定位数据对应的字段
		if(!left){
			arr[j++]='<div class="cellContent">';
			arr[j++]=contentHtml;	
			arr[j++]='</div><div class="cellBorder" style="background-color:';
			//arr[j++]=COLORS[Math.floor(Math.random()*COLORS.length)];
			arr[j++]=';"></div></td>';
		}else{
			arr[j++]='<div class="cellContent" style="left:';
			arr[j++]=left;
			arr[j++]='px;">';
			arr[j++]=contentHtml;	
			arr[j++]='</div><div class="cellBorder" style="background-color:';
			//arr[j++]=COLORS[Math.floor(Math.random()*COLORS.length)];
			arr[j++]=';left:';
			arr[j++]=left;
			arr[j++]='px;"></div></td>';
		}
		return arr.join('');
	},
	setAutoWrap:function(wrap){
		this.$el.children('.view').toggleClass('autoWrap',this.autoWrap=!!wrap);
	},
	//按指定字段集的排序规则排序
	_sortBy:function(fields,noReflesh){
		//改变视图
		var fieldName,direction;
		
		//更新表头样式、更新列order属性
		$('.header .cell',this.$el).removeClass('sortDesc sortAsc');
		$.each(this.cols,function(i,col){
			col.order='none';
		});
		var dg=this;
		for(var i=fields.length-1;i>=0;i--){
			//过滤掉不可排序的列
			var field=fields[i];
			var col=dg.getColumn(field[0]);
			if(!col.sortable){
				fields.splice(i,1);
			}else{
				var cell=$('.header td[data-field='+field[0]+']:eq(0)',this.$el);
				cell.addClass(sortStatus[valToStatus[field[1]]].cls);
				col.order=valToStatus[field[1]];
			}
		}

		this.sortFields=clone(fields);
		var args={sortFields:fields,noReflesh:false};
		//说明不刷新数据和没指定排序字段时不更新model
		if(noReflesh ||!fields.length){
			args.noReflesh=true;
		}
		this.execute('sortFieldsChange',args);
	},
	setData:function(data){
		//数据适配
		var options=$.extend({},data);		
		var fields=[];
		
		var fieldName,fieldInfo;
		
		for(var i=0,len=data.fieldNames.length;i<len;i++){
			fieldName=data.fieldNames[i];
			fieldInfo={};
			fieldInfo[FIELDNAME_PROP]=fieldName;
			fields.push($.extend(fieldInfo,data.columns[fieldName]));
		}
		
		options.fields=fields;
		//console.log(JSON.stringify(options,null,4));
		this.init(options);
	},
	setSortFields:function(sortFields){
		if(Object.prototype.toString.call(sortFields)!=='[object Array]')return;
		if(cb.isEqual(sortFields,this.sortFields))return;
		
		this._sortBy(sortFields);
	},
	sortBy:this.setSortFields,
	getSortFields:function(){
		return this.sortFields;
	},
	setMergeState:function(merge){
		merge=!!merge;	
		if(this.mergeState===merge){return;}
		this.mergeState=merge;
		this.execute('mergeStateChange',merge);
	},
	getMergeState:function(){
		return this.mergeState;
	},
	//根据指定合并信息合并单元格
	mergeCells:function(mergeInfo){
		if(!mergeInfo)return;
		//去掉表头行,且转换为数组
		var rows=this._getRows();
		//合并时要从后面的列开始合并，否则不好定位要合并的单元格的水平索引
		var cols=this.cols;
		for(var k=cols.length-1;k>0;k--){
			var field=cols[k][FIELDNAME_PROP];
			if(mergeInfo[field]){
				var cellsInCol=mergeInfo[field];
				for(var i=cellsInCol.length-1;i>=0;i--){
					var cell=cellsInCol[i];
					//先删除将被合并的单元格
					var j=cell.index+1,end=cell.index+cell.rowspan;
					for(;j<end;j++){
						//如果当前被合并的单元格处于固定列边界，则边界前移
						if($(rows[j].cells[k]).is('.frozen')){
							rows[j].cells[k-1]&&$(rows[j].cells[k-1]).addClass('frozen');
						}
						rows[j].removeChild(rows[j].cells[k]);
					}
					rows[cell.index].cells[k].setAttribute('rowspan',cell.rowspan);
				}
			}
		}
	},
	//选择行，焦点管理
	select:function(rowIndexs){
		if(!cb.isArray(rowIndexs)){
			rowIndexs=[rowIndexs];
		}
		var rows=this._getRows();
		var arr=[];
		$.each(rowIndexs,function(i,rowIndex){
			arr.push(rows[rowIndex]);
		});
		$.fn.addClass.call(arr,SELECTED);
		if(this.showCheckBox){
			var chkFieldIndex=this._getColIndex(DataGrid.CHECKBOXCOL[FIELDNAME_PROP]);
			$.each(arr,function(i,row){
				row.cells[chkFieldIndex].getElementsByTagName('input')[0].checked=true;
			});
			if(this._isAllChecked()){
				//此处不能用.attr('checked',true),浏览器存在bug，只有第一次通过属性设置checkbox/radio的checked属性时有效
				$('.header .chkAll input',this.$el)[0].checked=true;
			}
		}
		
		this.execute('select',rowIndexs);
	},
	unselect:function(rowIndexs){
		if(!cb.isArray(rowIndexs)){
			rowIndexs=[rowIndexs];
		}
		var rows=this._getRows();
		var arr=[];
		$.each(rowIndexs,function(i,rowIndex){
			arr.push(rows[rowIndex]);
		});
		$.fn.removeClass.call(arr,SELECTED);
		if(this.showCheckBox){
			var chkFieldIndex=this._getColIndex(DataGrid.CHECKBOXCOL[FIELDNAME_PROP]);
			$.each(arr,function(i,row){
				row.cells[chkFieldIndex].getElementsByTagName('input')[0].checked=false;
			});
			$('.header .chkAll input',this.$el).attr('checked',false);
		}
		this.execute('unselect',rowIndexs);
	},
	selectAll:function(){
		this._selectAll();
		this.execute('selectAll');
	},
	unselectAll:function(){//是否内部调用
		this._unselectAll();
		this.execute('unselectAll');
	},
	//控件内部使用的方法，不抛出事件
	_selectAll:function(){
		var rows=this._getRows(),len=rows.length;
		$.fn.addClass.call(rows,SELECTED);
		if(this.showCheckBox){
			var chkFieldIndex=this._getColIndex(DataGrid.CHECKBOXCOL[FIELDNAME_PROP]);
			$.each(rows,function(i,row){
				row.cells[chkFieldIndex].getElementsByTagName('input')[0].checked=true;
			});
			$('.header .chkAll input',this.$el)[0].checked=true;
		}
		
	},
	_unselectAll:function(){
		var rows=this._getRows(),len=rows.length;
		$.fn.removeClass.call(rows,SELECTED);

		if(this.showCheckBox){
			var chkFieldIndex=this._getColIndex(DataGrid.CHECKBOXCOL[FIELDNAME_PROP]);
			$.each(rows,function(i,row){
				row.cells[chkFieldIndex].getElementsByTagName('input')[0].checked=false;
			});
			$('.header .chkAll input',this.$el)[0].checked=false;
		}
	},
	setFocusedRow:function(index){
		var rows=this._getRows(),len=rows.length;
		if(index<0||index>=len)index=-1;
		
		$.fn.removeClass.call(rows,FOCUSED);
		if(index>=0){
			rows[index].className+=' '+FOCUSED;
		}
		this.execute('focusChange',index);
	},
	//获取选中行的索引
	getSelectedRows:function(){
		var rows=this._getRows(),
			selected=[];
		var dg=this;
		$.each(rows,function(i,row){
			if(dg._isSelected(row)){
				selected.push(i);
			}
		});
		return selected;
	},
	_isSelected:function(tr){
		return tr.className.split(rwhitespace).indexOf(SELECTED)>-1;
	},
	//获取数据行对应的tr数组
	_getRows:function(){
		return [].slice.call($('.viewBody table',this.$el)[0].rows,1);
	},
	//判断是否选中了所有展示的行
	_isAllChecked:function(){
		return this.getSelectedRows().length===this._getRows().length;
	},
	//单元格编辑模式下，一个时间点最多有一个编辑器；cellEditorWrapper控制样式，提供一个环境；
	_setCellEditing:function(field,rowIndex,dataContext){
		var dg=this;
		if(!this.cellEditorWrapper){//第一次调用时，生成编辑器包装
			this.cellEditorWrapper=$('<table class="cellEditorWrapper"><tbody><tr><td></td></tr></tbody></table>')[0];
			$(this.cellEditorWrapper).on('click',function(evt){
				evt.stopPropagation()
			});
		}
		var col=this.getColumn(field);
		var container=this._getEditorContainer(rowIndex,field);
		container.appendChild(this.cellEditorWrapper);
		
		//增加单元格的层级
		$(container).closest('.cell').addClass('editing');
		//隐藏内容
		$(container).closest('td').children('.cellContent').css('visibility','hidden');
		var td=this.cellEditorWrapper.rows[0].cells[0];
		//td.innerHTML='';//不能直接清空，上一次使用的编辑器视图元素必需保留
		this._docFragment=this._docFragment||document.createDocumentFragment();
		if(this._currentEditor&&this._currentEditor.el)this._docFragment.appendChild(this._currentEditor.el);
		
		this._currentEditor=this._getFieldEditor(col,dataContext);//保存对编辑器的引用
		this._currentEditor.init(td,col);
		this._currentEditor.initValue=dataContext[field];
		this._currentEditor.setValue(dataContext[field]);
		this._editingField=field;
		this._editRowIndex=rowIndex;
		
	},
	//支持获取具名的编辑器（具名的编辑器包括Grid内置的编辑器和用户通过registerFieldEditor方法注册的自定义编辑器）
	_getFieldEditor:function(config,dataContext){
		var name;
		if(typeof config==='object'){
			var ctrlType=config.ctrlType;
			name=ctrlEditorMap[ctrlType];
		}else{
			name=config;
		}
		return this._getFieldEditorByName(name);
	},
	//注册grid实例用的编辑器(不能注册同内置编辑器同名的编辑器，否则会被覆盖)
	registerFieldEditor:function(name,def){
		this._cellEditors[name]=$.extend({},DataGrid.cellEditors['DefaultEditor'],def);
	},
	//获取编辑器，如果grid实例中有定义则用实例自己的编辑器，否则到内置的公用编辑器中查询，如果还是未找到名称对应的编辑器，则返回默认编辑器。
	_getFieldEditorByName:function(name){
		if(!name)name='';
		return this._cellEditors[name]||this._cellEditors['DefaultEditor'];
	},
	_getEditorContainer:function(rowIndex,field){
		var row=this._getRow(rowIndex);
		var container=$(row).find('[data-field='+field+'] .cellBorder');
		return container[0];
	},
	_getRow:function(index){
		return this.$el.find('.viewBody table')[0].rows[index+1];//不计算表头行
	},
	updateCell:function(rowIndex,field,value,rowData){
		var td=this._getEditorContainer(rowIndex,field).parentNode;
		var col=this._nameColMap[field];
		var html=this._getTdCellOuterHtml2(this.getColumn(field),value,rowData);
		$(td).replaceWith(html);
	},
	
	___end:''
}
//支持数组项内的扩展
function extend(post,back) {
	if (!back || typeof back != 'object') return;
	post=post||{};
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
}
//(特别地，支持对象和数组的深度复制)
function clone(obj){
	return extend({},obj);
}
//选中行classname和当前焦点行classname
var SELECTED='selected',FOCUSED='focused';
var rwhitespace=/\s+/;
//自定义事件机制
$.extend(DataGrid.prototype,cb.events);
}(jQuery)