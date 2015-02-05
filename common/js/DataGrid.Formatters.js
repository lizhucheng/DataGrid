
(function ($) {
var DataGrid=cb.controls['DataGrid'];
DataGrid.formatters={
	'CheckboxFormatter':CheckboxFormatter,
	'PercentFormatter':PercentFormatter,
	'NumberFormatter':NumberFormatter,
	'DateTimeFormatter':DateTimeFormatter,
	'ReferFormatter':ReferFormatter,
	'defaultFormatter':defaultFormatter
};
//格式化方法的执行上下文为列对象或一个包含格式信息的对象

function defaultFormatter(value,dataContext) {
	return value!=null?(value + "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):'';
}
function PercentFormatter(value,dataContext){
	return value?value+'%':value==0?0:'';
}

function CheckboxFormatter(value,dataContext){
	return !!value?'<input type="checkbox" readonly disabled checked/>':'<input type="checkbox" readonly disabled/>'
}

//按指定精度和小数位显示
function NumberFormatter(value,dataContext){//scale:小数位数，precision：精度，两者冲突时以小数位为准
	if(value==undefined)return '';
	var scale=+this.scale,
		precision=+this.precision;
		
	value=Math.floor(value*Math.pow(10,scale+1));//整数化到小数位后面一位
	value=(value/10+value%10/5)/Math.pow(10,scale);//保留scale位小数，且scale后面位四舍五入
	var pointIndex=(value+'').indexOf('.');
	if(pointIndex<0){//没有小数点
		value=value+'.';
		pointIndex=value.length-1;
	}
	value+='000000000000000000000000';
	return value.slice(0,pointIndex+scale+1);
}
//
function DateTimeFormatter(value,dataContext){
	if(value==undefined)return '';
	return value;
}
//引用数据的格式化时，数据来自dataContext 中的{refKey}_{refCode}，{refKey}_{refName},refShowMode决定是显示{refKey}_{refCode}值还是{refKey}_{refName}属性值,value为refKey
function ReferFormatter(value,dataContext){//length:20,refKey:"id",refCode:"code",refName:"name",ctrlType:"Refer",refId:"Computation",refShowMode:"Code"
	var field=this[DataGrid.FIELDNAME_PROP];
	var showValue=dataContext[field+'_'+this[this.refShowMode=='Name'?'refName':'refCode']]||''
	return '<a class="referData">'+showValue+'</a>';//需要相应点击事件
}
})(jQuery);
