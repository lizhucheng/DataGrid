/// <reference path="../Control.js" />
cb.controls.widget("TextBox", function (controlType) {
    var _shieldChar;
    var control = function (id, options) {
        cb.controls.Control.call(this, id, options);
        this.getElement().on("change", this, function (e, args) {
            e.data.execute("change");
        });
        this.getElement().on("keydown", this, function (e, args) {
            if (e.keyCode != 13) return;
            e.data.execute("enter");
        });
    };
    control.prototype = new cb.controls.Control();
    control.prototype.controlType = controlType;
    control.prototype.getValue = function () {
        if (this.getElement().is(":text"))
            return this.getElement().val();
        else
            return this.getElement().html();
    };
    control.prototype.setValue = function (val) {
        this.getElement().is(":text") ? this.getElement().val(val) : this.getElement().html(val);
    };
    control.prototype.setData = function (data) {
        for (var attr in data) {
            var attrValue = data[attr];
            switch (attr) {
                case "value":
                    this.setValue(attrValue);
                    break;
                case "defaultValue":
                    this.setValue(attrValue);
                    break;
                case "readOnly":
                    this.setReadOnly(attrValue);
                    break;
                case "nullable":
                    this.setNullable(attrValue);
                    break;
                case "shieldChar":
                    _shieldChar = attrValue;
                    break;
                case "tips":
                    this.setTips(attrValue);
                    break;
                case "maxlength":
                    this.setMaxLength(attrValue);
                    break;
                case "isfocus":
                    this.setFocus(attrValue);
                    break;
                case "tabindex":
                    this.setTabIndex(attrValue);
                    break;
            }
        }
    };
    //设置最大输入长度
    control.prototype.setMaxLength = function (val) {
        this.set("maxlength", val)
    };
    //检测屏蔽字符
    control.prototype.setCheckShield = function (val) {
        var charList = (_shieldChar || val).split(',');
        var arrlength = charList.length;
        var val = this.getElement().val();
        var result = false;
        for (var i = 0; i < arrlength; i++) {
            if (val.indexOf(charList[i]) > 0) {
                result = true;
                break;
            }
        }
        return result;
    };

    return control;
});