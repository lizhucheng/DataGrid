!function($){
$.extend(true, window, {
	"cb": {
		"controls": {
			"DataGrid": DataGrid
		}
	}
});
//Enum/~
var TextAlign={'LEFT':'left','RIGHT':'right','CENTER':'center'},
	VAlign={'TOP':'top','MIDDLE':'middle','BOTTOM':'bottom'};
	
//Enum~/

DataGrid.defaults={
	colWidth:120,
	frozenIndex:0,
	showCheckBox:false,
	showRowNo:true
};
//const/~
DataGrid.CELLPADDING=1;
DataGrid.BORDERWIDTH=1;
DataGrid.ROWNOCOL={
	fieldNm:'__rowNo',
	width:30,
	resizable:false
};
DataGrid.CHECKBOXCOL={
	fieldNm:'__chkBox',
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

function DataGrid(el,options){
	//调用兼容处理
	if(!(this instanceof DataGrid))return new DataGrid(el,options);
	if(typeof el==='string'&& el.chartAt(0)!='#'){el='#el';}
	
	
	this.init=function(opts){
		this.opts=$.extend(true,{},DataGrid.defaults);
		this.opts=$.extend(true,this.opts,options);
		
		//检查是否有行号列、checkbox列
		this.frozenIndexFix=0;
		if(this.showRowNo){this.fields.unshift(DataGrid.CHECKBOXCOL);this.frozenIndexFix++;}
		if(this.showCheckBox){this.fields.unshift(DataGrid.ROWNOCOL);this.frozenIndexFix++;}
	}	
	this.$el=$(el).first();
	
	//支持延时实例初始化
	if(!options||typeof options!='object'){
		return null;
	}else{
		this.init(options);
	}
}
DataGrid.prototype={
	constructor:DataGrid,
	/*渲染整个表格控件，包括表头和表数据,表尾（注：分页以插件的形势存在，Grid可添加分页插件，为分页插件提供和model交互的接口，通过接口转发分页插件的命令）*/
	render:function(data){
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
		$el.append(view);
		view=null;
		if(data instanceof Array){this.loadData(data);}
	},
	//显示数据行
	loadData:function(data){
		//$('.',$el)
	},
	_getTheaderHtml:function(frozen){//frozen标识是否获取固定列对应的表头
		var colCount=this.fields.length,
			arr=new Array(30),
			frozenColIndex=this.frozenIndex+this.frozenIndexFix,	
			start=!frozen ? frozenColIndex+1:0,
			end=!frozen ?colCount:frozenColIndex+1,
			j=0,
			i=start;
			
		arr[j++]='<tr>';
		for(;i<end;i++){
			arr[j++]=this._getThCellOuterHtml(this.fieldNms[i])
		}
		arr[j++]='<tr>';
		return arr.join('');
	},
	_getThCellOuterHtml:function(fieldNm){	
		var field=this.fields[fieldNm];
		if(!field){
			throw('expection message:列'+fieldNm+'不存在!');
		};
		
		if(fieldNm===DataGrid.CHECKBOXCOL.fieldNm){
			return '<th class="rowNoCol chkAll" data-field="'+fieldNm+'"></th>';
		}
		if(fieldNm===DataGrid.ROWNOCOL.fieldNm){
			return '<th class="chkCol" data-field="'+fieldNm+'"><input type="checkbox" /></th>';
		}
		
		var arr=new Array(10);
		var j=0;
		arr[j++]='<th style="';
		arr[j++]=field.width;
		arr[j++]='px;" data-field="';
		arr[j++]=fields.title;
		arr[j++]='">';
		if(field.resizable){
			arr[j++]='<span class="col-resizer"></span>';
		}
		arr[j++]='</th>';
		return arr.join('');
	},
	_getTbodyHtml:function(data,frozen){
		
	}
	
}

}(jQuery)