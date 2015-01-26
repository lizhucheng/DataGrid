!function (){
cb.controls['Pager']=Pager;
var template=[],j=0;
//template[j++]='<div class="pager">';
template[j++]='<div class="pager-left">共<span class="pager-totalCount">1000</span>条，每页<input class="pager-size"  type="text" data-controltype="TextBox"/>条</div>';
template[j++]='<div class="pager-right">';
template[j++]='<span><input class="pager-currentPage" type="text" data-controltype="TextBox"/>/<span class="pager-pageCount">10</span>';
template[j++]='<span>';
template[j++]='<a class="pager-btn pager-first" title="第一页"></a><a class="pager-btn pager-previous" title="上一页"></a><a class="pager-btn pager-next" title="下一页"></a><a class="pager-btn pager-last" title="最后一页"></a>';
template[j++]='</span>';
template[j++]='</div>';
//template[j++]='</div>';	
template=template.join('');
		
function Pager(el,model3d){
	this.el=$(el);
	this.el.addClass('pager');
	this.el.html(template);
	
	this.ctrlPageIndex=new cb.controls['TextBox'](this.el.find('.pager-currentPage'));
	this.ctrlPageSize=new cb.controls['TextBox'](this.el.find('.pager-size'));
	this.pageCount=this.el.find('.pager-pageCount');
	this.totalCount=this.el.find('.pager-totalCount');
	model3d=model3d||cb.model.Model3D();
	//事件处理
	this.ctrlPageSize.on('change',function(){
		model3d.setPageSize(+this.getValue());
	},this.ctrlPageSize);
	this.ctrlPageIndex.on('change',function(){
		model3d.setPageIndex(this.getValue()-1);
	},this.ctrlPageIndex);
	
	(this.first=this.el.find('.pager-first')).click(function(){
		model3d.showFirstPage();
	});
	(this.previous=this.el.find('.pager-previous')).click(function(){
		model3d.showPreviousPage();
	});
	(this.next=this.el.find('.pager-next')).click(function(){
		model3d.showNextPage();
	});
	(this.last=this.el.find('.pager-last')).click(function(){
		model3d.showLastPage();
	});
}
Pager.prototype={
	constructor:Pager,
	update:function(pageInfo){
		var pageSize=pageInfo.pageSize,
			pageIndex=pageInfo.pageIndex,
			totalCount=pageInfo.totalCount,
			pageCount=Math.ceil(totalCount/pageSize);
			
		this.totalCount.html(totalCount);
		this.ctrlPageSize.setValue(pageSize);
		this.ctrlPageIndex.setValue(pageIndex+1);
		this.pageCount.html(pageCount);
		
		this.next.toggleClass('disabled',pageIndex>=pageCount-1);
		this.previous.toggleClass('disabled',pageIndex<=0);
	}
};
}();
