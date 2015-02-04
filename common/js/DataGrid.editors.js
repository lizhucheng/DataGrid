
(function ($) {
var DataGrid=cb.controls['DataGrid'];

var Editor={
	init: function(container, options){
		if(!this.el){
			this.el=$('<div class="cellEdtior"><input type="text" /></div>').appendTo(container)[0];
			this.target=this.el.firstChild;
		}else{
			container.appendChild(this.el);
		}
		//根据配置信息初始化editor
	},
	getValue: function(){
		return $(this.target).val();
	},
	setValue: function(value){
		$(this.target).val(value);
	},
	resize: function(width){
		$(this.el)._outerWidth(width);
	},
	destroy: function(){
		$(this.el).remove();
	}
	
};

var CheckboxEditor=$.extend({},Editor,{
	init: function(container, options){
		if(!this.el){
			this.el=$('<div class="cellEdtior CheckboxEditor"><input type="checkbox" /></div>').appendTo(container)[0];
			this.target=this.el.firstChild;
		}else{
			container.appendChild(this.el);
		}
		//
	},
	getValue: function(){
		return this.target.checked;
	},
	setValue: function(value){
		this.target.checked=!!value;
	}
});
var TextBoxEditor=$.extend({},Editor,{
	init: function(container, options){
		if(!this.el){
			this.el=$('<table border=0 class="cellEdtior TextBoxEditor"><tr><td><input type="text" /></div></td></tr><table>').appendTo(container)[0];
			this.target=$(this.el).find('input')[0];
			//时间处理
		}else{
			container.appendChild(this.el);
		}
		options=options||{};
		if(options.length){
			$(this.target).attr('size',options.length);
		}
		this.target.focus();
		//根据配置信息初始化editor
	}
});
var DefaultEditor=TextBoxEditor;

var ComboxEditor=$.extend({},Editor,{

});

var NumberBoxEditor=$.extend({},Editor,{

});
var DateTimeEditor=$.extend({},Editor,{

});
var ReferEditor=$.extend({},Editor,{

});
DataGrid.editors={
	'DefaultEditor':Editor,
	'CheckboxEditor':CheckboxEditor,
	'TextBoxEditor':TextBoxEditor,
	'NumberBoxEditor':NumberBoxEditor,
	'DateTimeEditor':DateTimeEditor,
	'ComboxEditor':ComboxEditor,
	'ReferEditor':ReferEditor
};
})(jQuery);
