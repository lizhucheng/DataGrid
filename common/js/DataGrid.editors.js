
(function ($) {
var DataGrid=cb.controls['DataGrid'];
DataGrid.editors={
	'DefaultEditor':Editor,
	'CheckboxEditor':CheckboxEditor,
	'TextBoxEditor':TextBoxEditor,
	'NumberBox':NumberBoxEditor,
	'DateTimeEditor':DateTimeEditor,
	'ComboxEditor':ComboxEditor,
	'ReferEditor':ReferEditor
};
var Editor={
	init: function(container, options){
		if(!this.el){
			this.el=$('<div class="grid-editor"><input type="text" /></div>').appendTo(container);
			this.target=this.el('input');
		}
		//根据配置信息初始化editor
	},
	getValue: function(){
		return this.target.val();
	},
	setValue: function(value){
		this.target.val(value);
	},
	resize: function(width){
		this.el._outerWidth(width);
	},
	destroy: function(){
		this.el.remove();
	}
	
};

var CheckboxEditor=$.extend({},Editor,{
	init: function(container, options){
		if(!this.el){
			this.el=$('<div class="grid-editor"><input type="checkbox" /></div>').appendTo(container);
			this.target=this.el('input');
		}
		//
	},
	getValue: function(){
		return !!this.target[0].checked;
	},
	setValue: function(value){
		this.target[0].checked=!!value;
	}
});
var TextBoxEditor=$.extend({},Editor,{
	init: function(container, options){
		if(!this.el){
			this.el=$('<div class="grid-editor"><input type="text" /></div>').appendTo(container);
			this.target=this.el('input');
		}
		if(options.length){
			this.target.attr('size',options.length);
		}
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

})(jQuery);
