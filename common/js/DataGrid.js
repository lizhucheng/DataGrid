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

//定义Column类型是为了管理列的默认值
function Column(config,name){	
	$.extend(true,this,config);
	this[FIELDNAME_PROP]=name||config[FIELDNAME_PROP];
	this.title=this.title||this[FIELDNAME_PROP];
}
Column.prototype={
	constructor:Column,
	
	//defaults/~
	headerTextAlign:'center',
	visible:true,	//列是否可见
	resizable:true,	//列是否可拖动改变列宽
	textAlign:'left',	//列文本水分方向对齐方式
	headerTextAlign:'center',	//表头文本水平对齐方式，默认居中
	width:120,	//宽度
	sortable:false,
	//defaults~/
	
	//getName:function(){return this.[FIELDNAME_PROP];},//不提供这个方法了，直接使用this.[FIELDNAME_PROP]避免函数调用
	//cssCls:'',	//列层次的样式定义（通过指定class与css中定义的样式关联）
	//colStyle:function(index){},
	//onclick:function(){}
};

function createColumns(fields){
	var cols=[];
	for(var i=0,len=fields.length;i<len;i++){
		cols.push(new Column(fields[i]));
	}
	return cols;
}
//const/~
DataGrid.CELLPADDING=1;
DataGrid.BORDERWIDTH=1;
DataGrid.ROWNOCOL={
	$name:'__rowNo',
	width:30,
	resizable:false
};
DataGrid.CHECKBOXCOL={
	$name:'__chkBox',
	width:30,
	resizable:false,
	content:'<input type="checkbox" />'
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
	</div>\
</div>'
//const~/
//

function DataGrid(el,options){
	//调用兼容处理
	if(!(this instanceof DataGrid))return new DataGrid(el,options);
	if(typeof el==='string'&& el.charAt(0)!='#'){el='#'+el;}
	
	
		
	this.$el=$(el).first();
	
	//支持延时实例初始化
	if(options){
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
		
		//检查是否有行号列、checkbox列
		if(this.showCheckBox){
			this.cols.unshift(new Column(DataGrid.CHECKBOXCOL));
		}
		if(this.showRowNo){
			this.cols.unshift(new Column(DataGrid.ROWNOCOL));	
		}
		
		this._rebuildColMap();
		this._setFrozenField(this.frozenField||'');
	},
	//只设置状态，不改变视图
	_setFrozenField:function(field){
		var col=this.getColumn(field);
		if(field==DataGrid.ROWNOCOL[FIELDNAME_PROP] || field==DataGrid.ROWNOCOL[FIELDNAME_PROP])return;
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
		
	},
	/*渲染整个表格控件，包括表头和表数据,表尾（注：分页以插件的形势存在，Grid可添加分页插件，为分页插件提供和model交互的接口，通过接口转发分页插件的命令）*/
	render:function(data){
		var $el=this.$el;
		$el.addClass('grid');
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
		
		$el.append(view);
		//记录初始滚动值
		this._lastScrollTop=0;
		this._lastScrollLeft=0;
	
		this._initEvents();
		
		view=null;
		if(data instanceof Array){this.loadData(data);}
	},
	_initEvents:function(){
		//固定列实现
		var view=this.$el.children('.view');
		var dg=this;
		view.scroll(function(evt){
			dg._fixScroll(evt);
		});
		
		//拖动调整列宽
		$('.header .col-resizer',view).drag('drag',function(ev, dd){
			$(this).css('right',-6-dd.deltaX);
			
		}).drag('draginit',function(ev, dd){
			$(this).addClass('active');
			
			var left=dd.offsetX-$('.view .viewBody',dg.$el).offset().left+6;
			$('.view .refLine',dg.$el).css('left',left);
			$('.view .refLine',dg.$el).show();
		}).drag('drag',function(ev, dd){
			//实时显示参照线
			var left=dd.offsetX-$('.view .viewBody',dg.$el).offset().left+6;
			$('.view .refLine',dg.$el).css('left',left);
			
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
		});
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
		this._lastScrollLeft=view[0].scrollLeft;
		
		var tb=$('.viewBody>table',this.$el);
		var slice=[].slice;
		var rows=slice.call($('.viewBody>table',this.$el)[0].rows,0);			
		rows.shift();

		var end=this.frozenIndex+1;		
		var left=view[0].scrollLeft+'px';
		
		$('.viewHeader',view)[0].style.left=left;
		$('.header2>table',view)[0].style.marginLeft=0-view[0].scrollLeft+'px';
		
		
		for(var i=0,len=rows.length;i<len;i++){
			tds=slice.call(rows[i].cells,0,end);
			for(var j=0,q=tds.length;j<q;j++){
				tds[j].firstChild.style.left=left;
				tds[j].lastChild.style.left=left;	
			}
		}
		
	},
	//显示数据行
	loadData:function(data){
		var html=this._getTbodyHtml(data),
			$el=this.$el;
		
		$('.viewBody',$el).hide();
		$('.viewBody tbody',$el).html(html);
		$('.viewBody').show();
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
			frozenColIndex=this.frozenIndex,	
			start=!frozen ? frozenColIndex+1:0,
			end=!frozen ?colCount:frozenColIndex+1,
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
		arr[j++]='<td class="cell" style="width:';
		arr[j++]=col.width;
		arr[j++]='px;" data-field="';
		arr[j++]=col[FIELDNAME_PROP];
		arr[j++]='">';
		arr[j++]='<div class="cellContent">';
		arr[j++]=col.title;
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
			arr[j++]='<tr>';	
			for(i=0;i<colCount;i++){
				field=cols[i][FIELDNAME_PROP];
				if(field!=DataGrid.ROWNOCOL[FIELDNAME_PROP]&&field!=DataGrid.CHECKBOXCOL[FIELDNAME_PROP]){
					value=row[field];
				}else if(field===DataGrid.ROWNOCOL[FIELDNAME_PROP]){
					value=s+1;
				}else{
					value='<input type="checkbox" />'
				}
				arr[j++]=this._getTdCellOuterHtml(this.cols[i],value,i<=frozenIndex?left:0,!i);
			}
			arr[j++]='</tr>';
		}
		
		return arr.join('');
	},
	_getTdCellOuterHtml:function(col,value,left,first){
		//return '<td >'+value+'</td>';
		var arr=new Array(30),j=0;
		arr[j++]='<td class="cell';
		arr[j++]=first?' first':'';
		arr[j++]=col[FIELDNAME_PROP]!==this.frozenField?'':' frozen';
		arr[j++]='">';
		if(!left){
			arr[j++]='<div class="cellContent">';
			arr[j++]=value;	
			arr[j++]='</div><div class="cellBorder" style="background-color:';
			arr[j++]=COLORS[Math.floor(Math.random()*COLORS.length)];
			arr[j++]=';"></div></td>';
		}else{
			arr[j++]='<div class="cellContent" style="left:';
			arr[j++]=left;
			arr[j++]='px;">';
			arr[j++]=value;	
			arr[j++]='</div><div class="cellBorder" style="background-color:';
			arr[j++]=COLORS[Math.floor(Math.random()*COLORS.length)];
			arr[j++]=';left:';
			arr[j++]=left;
			arr[j++]='px;"></div></td>';
		}
		return arr.join('');
	},
	
	
	
	___end:''
}


}(jQuery)