/// <reference path="../Control.js" />

cb.controls.widget("DateTimeBox", function (controlType) {

    var control = function (id, options) {
        cb.controls.Control.call(this, id, options);
        //if (!this.getElement().datetimepicker) return;
        var defaults = {
            format: "yyyy-mm-dd",
            language: "zh-CN",
            weekStart: 1,
            todayBtn: 1,
            autoclose: 1,
            todayHighlight: 1,
            startView: 2,
            minView: 2,
            forceParse: 0
        };
        this.options = defaults;
        this.getElement().on({
            focus: $.proxy(this._focus, this),
            keydown: $.proxy(this._keydown, this),
            keyup: $.proxy(this._keyup, this),
            change: $.proxy(this._onchange, this),
        });
        this.getElement().on("change", this, function (e, args) {
            e.data.execute("change");
        });
    };
    control.prototype = new cb.controls.Control();
    control.prototype.controlType = controlType;
    control.prototype.getValue = function () {
        if (this.getElement().val() != "")
            return cb.util.formatDateTime(this.getElement().val());
    };
    control.prototype.setValue = function (val) {
        if (val == "@SYSDATE")
            val = new Date();
        if (this.getElement().attr("type") == "date") {
            if (val != null)
                this.getElement().val(cb.util.formatDate(val));
            else
                this.getElement().val(val);
        }
        else
            this.getElement().val(val);
        if (this.getElement().datetimepicker) {
            if (val != null && val != "")
                this.getElement().datetimepicker({"setDate":new Date(val),CustomFormat:"yyy-mm-dd"});
        }
    };
    control.prototype.setData = function (data) {
        for (var attr in data) {
            var attrValue = data[attr];
            if (attr == "value" || attr == "defaultValue") this.setValue(attrValue);
            else if (attr == "readOnly") this.setReadOnly(attrValue);
            else if (attr == "nullable") this.setNullable(attrValue);
            else if (attr == "formatType") this._formatType = attrValue;
        }
    };
    control.prototype.setReadOnly = function (val) {
        if (val) {
            this.getElement().attr("disabled", "disabled");
        }
        else {
            this.getElement().attr("disabled", false);
        }
    };
    //设置控件的时间格式（分三种格式：Date短日期型，DateTime长日期型，Time时间型）
    control.prototype.setDateFormat = function (val) {
        //this.getElement().CustomFormat("yyy-mm-dd") 
        var _formatType = this._formatType || 'datetime';
        if (!!_formatType) {
            val = (_formatType == 'datetime' && cb.util.formatDateTime(val)) || (_formatType == 'time' && cb.util.formatTime(val)) || (_formatType == 'date' && cb.util.formatDate(val));
            this.setValue(val);
        }
    };
    $.extend(control.prototype, {
        _focus: function (evt) {
            DateTimePicker.eventHandler(this, evt, 'focus.input');
        },
        _keydown: function (evt) {
            DateTimePicker.eventHandler(this, evt, 'keydown.input');
        },
        _keyup: function (evt) {
            DateTimePicker.eventHandler(this, evt, 'keyup.input');
        },
        _click: function (evt) {
            DateTimePicker.eventHandler(this, evt, 'click.input');
        },
    });
    return control;
});