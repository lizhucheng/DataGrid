
(function ($) {
var DataGrid=cb.controls['DataGrid'];
DataGrid.Formatters={
	'CheckboxFormatter':CheckboxFormatter,
	'PercentFormatter':PercentFormatter,
	
	'defaultFormatter':defaultFormatter
};
//格式化方法的执行上下文为列对象

function defaultFormatter(value,dataContext) {
      if (value == null) {
        return "";
      } else {
        return (value + "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
      }
}
function CheckboxFormatter(value,dataContext){
	return !!value?'<input type="checkbox" readonly disabled checked/>':'<input type="checkbox" readonly disabled/>'
}
function PercentFormatter(value,dataContext){
	return value+'%';
}

})(jQuery);
