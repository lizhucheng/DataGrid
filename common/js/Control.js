/// <reference path="../jquery/jquery.js" />
/// <reference path="Cube.js" />
if (typeof cb.controls == "undefined") {
    window.cb = {};
    cb.controls = {};
}
if (typeof cb.controls.widget == "undefined") {
    cb.controls.widget = function (controlType, func) {
        cb.controls[controlType] = func(controlType);
    };

    cb.controls.extend = function (controlType, baseClass, init) {
        var ctrl = function (id, options) {
            baseClass.call(this, id, options);
            if (this.init)
                this.init();
        };
        ctrl.prototype = new baseClass();
        ctrl.prototype.controlType = controlType;
        if (init)
            ctrl.prototype.init = init;
        cb.controls[controlType] = ctrl;
        return cb.controls[controlType];
    }
}

cb.controls.widget("Control", function (controlType) {
    var control = function (id, options) {
        var _data = options || {};
        _data.id = id;
        
        if (typeof (id) == "string") {
            _data.elem = $("#" + id);
        }
        else {
            _data.elem = id;
        }
        //_data.elem = $("#" + id);

        this._get_data = function (attr) {
            return _data[attr];
        };
        this._set_data = function (attr, val) {
            _data[attr] = val;
        };
    };
    control.prototype.controlType = controlType;
    control.prototype.controlTypeTag = "data-controlType";
    control.prototype.propertyNameTag = "data-propertyname";
    control.prototype.getId = function () {
        return this._get_data("id");
    };
    control.prototype.setId = function (val) {
        this._set_data("id", val);
    };
    control.prototype.getElement = function () {
        return this._get_data("elem");
    };
    control.prototype.getLabel = function () {
        return this.getElement().parent().prev();
    };
    control.prototype.getparentDiv = function () {
        return this.getElement().parent();
    };
    control.prototype.getControlType = function () {
        return this.controlType || this.getElement().attr(this.controlTypeTag) || $("#" + this.getId() + " [" + this.controlTypeTag + "]").attr(this.controlTypeTag);
    };
    control.prototype.getPropertyName = function () {
        return this.getElement().attr(this.propertyNameTag) || $("#" + this.getId() + " [" + this.propertyNameTag + "]").attr(this.propertyNameTag);
    };
    control.prototype.get = control.prototype.getAttribute = function (attr) {
        return this.getElement().attr(attr);
    };
    control.prototype.set = control.prototype.setAttribute = function (attr, val) {
        this.getElement().attr(attr, val);
    };
    control.prototype.getValue = function () {
        return this.getElement().val();
    };
    control.prototype.setValue = function (val) {
        this.getElement().val(val);
    };
    control.prototype.getReadOnly = function () {
        return this.getAttribute("readonly");
        //return this.getAttribute("disabled");
    };
    control.prototype.setReadOnly = function (readonly) {
        this.setAttribute("readonly", readonly);
        //this.setAttribute("disabled", readonly === true ? "disabled" : false);
    };
    control.prototype.setAlwaysReadOnly = function (val) {
       // debugger;
        //this.getElement().css("border", "1px solid #cccccc");
    };
    control.prototype.getDisabled = function () {
        return this.getAttribute("disabled");
    };
    control.prototype.setDisabled = function (disabled) {
        this.setAttribute("disabled", disabled);
    };
    control.prototype.getVisible = function () {
        // return this.getAttribute("display")==="none";
    };
    control.prototype.setVisible = function (visible) {
        //this.setAttribute("display", visible ? "block" : "none");
    };
    control.prototype.getTitle = function () {
        return this.getAttribute("title");
    };
    control.prototype.setTitle = function (title) {
        this.setAttribute("title", title);
    };
    control.prototype.getText = function () {
        this.getAttribute("innerText");
    };
    control.prototype.setText = function (text) {
        this.setAttribute("innerText", text);
    };
    control.prototype.getHtml = function () {
        return this.getElement().html();
    };
    control.prototype.setHtml = function (html) {
        this.getElement().html(html);
    };
    control.prototype.setNullable = function (val) {
        var labelObj = this.getLabel();
        labelObj.toggleClass("mustinput", !val);
    };
    control.prototype.setNoinput = function (val) {
        var labelObj = this.getLabel();
        var divObj = this.getparentDiv();
        labelObj.toggleClass("mustinput-noinput", val);
        divObj.toggleClass("parentdiv-noinput", val);
    };
    control.prototype.on = function (eventName, func, context) {
        if (eventName.indexOf("on") == 0)
            eventName = eventName.substr(2);
        var me = this;
        //var data = { me: this, context: context };
        this.getElement().on(eventName, function () {
            func.call(context, me.getValue());
        });
    };
    control.prototype.un = function (eventName, func) {
        if (eventName.indexOf("on") == 0)
            eventName = eventName.substr(2);
        this.getElement().unbind(eventName);
    };

    //fengwba 0825
    //设置提示信息Tips
    control.prototype.setTips = function (val) {
        supportPlaceholder = 'placeholder' in document.createElement('input');//检测浏览器是否兼容placeholder
        var self = this;
        if (!supportPlaceholder) {
            this.getElement().focus(function () {
                if (self.getValue() == val)
                    self.setValue('');
            });
            this.getElement().blur(function () {
                if (self.getValue() == '') {
                    self.setValue(val);
                }
            });
        }
        else
            this.set("placeholder", val);
    };
    //获取控件的提示信息Tips
    control.prototype.getTips = function () {
        return this.get("placeholder");
    };
    //设置控件内文字的对齐方式
    control.prototype.setTextAlign = function (val) {
        if (val != '') {
            this.set("text-align", val)
        }
        else
            this.set("text-align", "left");
    };
    //获取控件内文字的对齐方式
    control.prototype.getTextAlign = function () {
        return this.get("text-align");
    };
    //设置焦点（val：true设置焦点/false不设置焦点）
    control.prototype.setFocus = function (val) {
        if (val)
            this.getElement().focus();
    };
    //设置tab键索引
    control.prototype.setTabIndex = function (index) {
        if (index >= 0)
            this.set("tabindex", index);
        else
            this.set("tabindex", "-1");
    };
    //获取控件的tab键索引
    control.prototype.getTabIndex = function () {
        return this.get("tabindex");
    };
    //fengwba end

    return control;
});