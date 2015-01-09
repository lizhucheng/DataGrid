!function($){
$.extend(true, window, {
	"cb": {
		"controls": {
			"DataGrid": DataGrid
		}
	}
});
//随机背景，用于测试
var COLORS=['#ff0','#fea','#0fe','#123'];
//Enum/~
//DataGrid.TextAlign={'LEFT':'left','RIGHT':'right','CENTER':'center'},
//DataGrid.VAlign={'TOP':'top','MIDDLE':'middle','BOTTOM':'bottom'};
	
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
	<div class="veiwHeader">\
		<div class="header">\
			<div class="header1"><table border="1"><thead></thead></table></div>\
			<div class="header2"><table border="1"><thead></thead></table></div>\
		</div>\
	</div>\
	<div class="viewBody nowrap">\
		<div class="content1"><table border="1"><thead></thead><tbody></tbody></table></div>\
		<div class="content2"><table border="1"><thead></thead><tbody></tbody></table></div>\
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
	//用于列集变动后同步field和Column映射关系（建立索引是为了方便查询）
	_rebuildColMap:function(){
		this._nameColMap={};
		var cols=this.cols;
		for(var i=0,len=cols.length;i<len;i++){
			this._nameColMap[cols[i][FIELDNAME_PROP]]=cols[i];
		}
	},
	getCol:function(field){
		return this._nameColMap[field];
	},
	init:function(opts){
		opts=opts||{};
		var fields=opts.fields||[];
		delete opts.fields;
		$.extend(true,this,opts);
		this.cols=createColumns(fields);
		
		//检查是否有行号列、checkbox列
		if(this.showRowNo){
			this.cols.unshift(new Column(DataGrid.ROWNOCOL));	
		}
		if(this.showCheckBox){
			this.cols.unshift(new Column(DataGrid.CHECKBOXCOL));
		}	
		this._rebuildColMap();
		this._setFrozenCol(this.frozenCol||'');
	},
	//只设置状态，不改变视图
	_setFrozenCol:function(field){
		var col=this.getCol(field);
		if(field==DataGrid.ROWNOCOL[FIELDNAME_PROP] || field==DataGrid.ROWNOCOL[FIELDNAME_PROP])return;
		if(col){
			this.frozenCol=field;
			this.frozenIndex=this.cols.indexOf(col);
		}	
	},
	//按指定的索引，固定索引对应的列（-1时没有固定列）
	_frozeColByIndex:function(index){
		index=Math.min(Math.max(-1,index),this.cols.length-1);
		var original=this.frozenIndex;
		this.frozenCol=index>0 && index<this.cols.length?this.cols[index][FIELDNAME_PROP]:'';
		this.frozenIndex=index;
		
		var diff=index-original;
		if(diff){
			this._moveCol(diff);
			this._fixMarginLeft();
		}
	},
	frozeCol:function(field){
		var original=this.frozenIndex;
		this._setFrozenCol(field);
		var diff=this.frozenIndex-original;
		if(diff){
			this._moveCol(diff);
			this._fixMarginLeft();
		}
	},
	//左右两个视图中列之间的移动操作（把左边的最后面的指定列数移动到右边，把右边的前面的列移动到左边的最后），用于实现固定列操作辅组方法
	_moveCol:function(count){
		if(!count)return;
		var ltr=!!(count<0);
		count=Math.abs(count);
		
		var $el=this.$el;
		//默认从右移到左
		var from='.header2 tr,.content2 tr',to='.header1 tr,.content1 tr';
		
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
			if(index=-1){select='td';}//jQuery 使用:gt(-1)会出问题
			insertTo='prependTo';
		}
		
		$from.each(function(i,tr){
			$(select,tr)[insertTo]($to[i]);
		});
	},
	/*渲染整个表格控件，包括表头和表数据,表尾（注：分页以插件的形势存在，Grid可添加分页插件，为分页插件提供和model交互的接口，通过接口转发分页插件的命令）*/
	render:function(data){
		var $el=this.$el;
		$el.addClass('grid');
		var view=$(DataGrid.TEMPLATE),
			frozenCols=this._getTheaderHtml(true),
			otherCols=this._getTheaderHtml(false);
		$('.header1 thead,.content1 thead',view).each(function(i,ele){
			ele.innerHTML=frozenCols;
		});
		$('.header2 thead,.content2 thead',view).each(function(i,ele){
			ele.innerHTML=otherCols;
		});
		$('.content2',view).css('margin-left',this._getFrozenWidth()+'px');
		$el.append(view);
		
		this._initEvents();
		
		view=null;
		if(data instanceof Array){this.loadData(data);}
	},
	_initEvents:function(){
		//固定列实现
		var view=this.$el.find('.view');
		var dg=this;
		view.scroll(function(){
			//console.log(this.scrollLeft);
			$('.content1',this).get(0).style.left=this.scrollLeft+'px';
			$('.header2>table')[0].style.marginLeft=0-this.scrollLeft+'px';
			$('.veiwHeader',this)[0].style.marginLeft=this.scrollLeft+'px';
			$('.veiwHeader',this)[0].style.top=this.scrollTop+'px';
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
			var colWidth=Number.parseInt($col[0].style.width);//此处不能用col.width();chrome中获取通过这种方式获取宽度时有问题。
			var width=dd.deltaX+colWidth;//避免宽度设置为负数
			console.log('field,width:',field,',',width);
			dg.setColWidth(field,width);
			$(this).css('right',-6);
			$(this).removeClass('active');
			$('.view .refLine',dg.$el).hide();
		});
	},
	//显示数据行
	loadData:function(data){
		var frozenCols=this._getTbodyHtml(data,true),
			otherCols=this._getTbodyHtml(data)
			$el=this.$el;
		
		$('.viewBody',$el).hide();
		$('.viewBody .content1 tbody',$el).html(frozenCols);
		$('.viewBody .content2 tbody',$el).html(otherCols);
		$('.viewBody').show();
	},
	setColWidth:function(field,width){
		if(!this._nameColMap[field])return;
		
		
		//改变表头宽度
		width=Math.max(50,width);//避免列太窄
		//var delta=width-$('[data-field='+field+']').width();
		var delta=width-Number.parseInt($('.header [data-field='+field+']:eq(0)',this.$el)[0].style.width);
		$('[data-field='+field+']:eq(0)',this.$el.find('.header,.viewBody')).width(width);
		
		var index=this.cols.indexOf(this._nameColMap[field]);
		//更新列width属性
		this.cols[index].width=width;
		//如果列为固定列，这调整可滚动区的margin-left
		if(index<=this.frozenIndex){
			this._fixMarginLeft();
		}
	},
	_getColIndex:function(field){
		var col=this._nameColMap[field];
		return col?this.cols.indexOf(col) : -1;
	},
	hideColumn:function(field){
		var index=this._getColIndex(field);
		if(index>-1&&this.cols[index].visible){
			this.cols[index].visible=false;
			
			var trs='.header1 tr,.content1 tr';
			if(index>this.frozenIndex){
				index=index-this.frozenIndex-1;
				trs='.header2 tr,.content2 tr';
			}		
			$('>td:eq('+index+')',this.$el.find(trs)).hide();
			this._fixMarginLeft();
		}
		
	},
	showColumn:function(field){
		var index=this._getColIndex(field);
		if(index>-1&&!this.cols[index].visible){
			this.cols[index].visible=true;
			
			var trs='.header1 tr,.content1 tr';
			if(index>this.frozenIndex){
				index=index-this.frozenIndex-1;
				trs='.header2 tr,.content2 tr';
			}		
			$('>td:eq('+index+')',this.$el.find(trs)).show();
			this._fixMarginLeft();
		}
	},
	_getFrozenWidth:function(){
		var width=0,cols=this.cols,i=0,hasFrozenCol=false;
			end=this.frozenIndex+1,
			fix=2*DataGrid.CELLPADDING+DataGrid.BORDERWIDTH;
	
		for(;i<end;i++){
			if(cols[i].visible){
				width+=cols[i].width+fix;
			}
		}
		width=width?width+1:width;//width!=0说明有固定列
		console.log('margin-left:',width);
		return width;
	},
	_fixMarginLeft:function(){
		this.$el.find('.content2').css('margin-left',this._getFrozenWidth()+'px');
	},
	_getTheaderHtml:function(frozen){//frozen标识是否获取固定列对应的表头
		var colCount=this.cols.length,
			arr=new Array(30),
			frozenColIndex=this.frozenIndex,	
			start=!frozen ? frozenColIndex+1:0,
			end=!frozen ?colCount:frozenColIndex+1,
			j=0,
			i=start;
			
		arr[j++]='<tr>';
		for(;i<end;i++){
			arr[j++]=this._getThCellOuterHtml(this.cols[i])
		}
		arr[j++]='</tr>';
		return arr.join('');
	},
	_getThCellOuterHtml:function(field){	
		var col;
		//参数兼容处理，使支持Column对象
		if(field instanceof Column){
			col=field;
			field=col[FIELDNAME_PROP];}
		else{
			col=this.getCol(field);
		}
		if(!col){
			throw('expection message:列'+field+'不存在!');
		};
		
		if(col[FIELDNAME_PROP]===DataGrid.CHECKBOXCOL[FIELDNAME_PROP]){
			return '<td class="rowNoCol chkAll" style="width:'+col.width+'px;" data-field="'+field+'"></td>';
		}
		if(col[FIELDNAME_PROP]===DataGrid.ROWNOCOL[FIELDNAME_PROP]){
			return '<td class="chkCol" style="width:'+col.width+'px;" data-field="'+field+'"><input type="checkbox" /></td>';
		}
		
		var arr=new Array(10);
		var j=0;
		arr[j++]='<td style="width:';
		arr[j++]=col.width;
		arr[j++]='px;" data-field="';
		arr[j++]=col[FIELDNAME_PROP];
		arr[j++]='">';
		arr[j++]=col.title;
		if(col.resizable){
			arr[j++]='<span class="col-resizer"></span>';
		}
		arr[j++]='</td>';
		return arr.join('');
	},
	_getTbodyHtml:function(data,frozen){
		var cols=this.cols,
			colCount=cols.length,
			arr=new Array(100),
			frozenColIndex=this.frozenIndex,	
			start=!frozen ? frozenColIndex+1:0,
			end=!frozen ?colCount:frozenColIndex+1,
			j=0,
			i,field,row,value;

		for(var s=0,len=data.length;s<len;s++){
			row=data[s];
			arr[j++]='<tr>';	
			for(i=start;i<end;i++){
				field=cols[i][FIELDNAME_PROP];
				if(field!=DataGrid.ROWNOCOL[FIELDNAME_PROP]&&field!=DataGrid.CHECKBOXCOL[FIELDNAME_PROP]){
					value=row[field];
				}else if(field!=DataGrid.ROWNOCOL[FIELDNAME_PROP]){
					value=s+1;
				}else{
					value='<input type="checkbox" />'
				}
				arr[j++]=this._getTdCellOuterHtml(this.cols[i],value);
			}
			arr[j++]='</tr>';
		}
		
		return arr.join('');
	},
	_getTdCellOuterHtml:function(col,value){
		//return '<td >'+value+'</td>';
		return '<td style="background-color:'+COLORS[Math.floor(Math.random()*COLORS.length)]+'">'+value+'</td>';
	},
	
	
	
	___end:''
}



}(jQuery)