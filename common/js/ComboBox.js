/// <reference path="../Control.js" />

/// <reference path="../Control.js" />
cb.controls.widget("ComboBox", function (controlType) {
    var _shieldChar;
    var control = function (id, options) {
        cb.controls.Control.call(this, id, options);
        this.setFieldType("text");
    };
    control.prototype = new cb.controls.Control();
    control.prototype.controlType = controlType;

    control.prototype.getValue = function () {
        return this._get_data("value");
    };
    control.prototype.setValue = function (val) {
        if (typeof val != "object" || val ==null) {
            var dataSource = this._get_data("dataSource");
            if (!dataSource) return;
            var index = dataSource.find(function () {
                if (this.value === val)
                    return true;
            });
            if (index === -1) return;
            val = dataSource[index];
        }
        this._set_data("value", val.value);
        this.getElement().children("div").children("span").text(val.text);
        this.getElement().children("ul").children().each(function (index, element) {
            $(element).removeClass("checked");
            if ($(element).data("data") === val) {
                $(element).addClass("checked");
            }
        });
    };

    control.prototype.setData = function (data) {
        if (data["dataSource"])
            this.setDataSource(data["dataSource"], !data["fieldType"] ? "text" : data["fieldType"]);
        for (var attr in data) {
            if (attr == "dataSource") continue;
            var attrUpper = attr.substring(0, 1).toUpperCase() + attr.substring(1);
            if (this["set" + attrUpper])
                this["set" + attrUpper](data[attr]);
        }
    };
    control.prototype.getFieldType = function () {
        return this._get_data("fieldType");
    };
    control.prototype.setFieldType = function (val) {
        this._set_data("fieldType", val);
    };
    control.prototype.setDataSource = function (dataSource, fieldType) {
        if (!dataSource || !cb.isArray(dataSource)) return;
        this._set_data("dataSource", dataSource);
        if (!fieldType) {
            fieldType = this.getFieldType();
        }
        this.getElement().empty();
        var $input = $('<div><span></span></div>')
        var $select = $('<ul></ul>');
        for (var i = 0, len = dataSource.length; i < len; i++) {
            var attrValue = dataSource[i];
            if (typeof attrValue != "object") return;
            var image = '';
            if (this.getFieldType() == "text") {
                image = '';
            } else if (this.getFieldType() == "image-text") {
                image = '<img src="' + attrValue.image + '" />';
            }
            var $li = $('<li>' + image + '<span>' + attrValue.text + '</span></li>');
            $li.data("data", attrValue);
            $li.on("click", { control: this, $select: $select }, function (e, args) {
                e.data.control.setValue($(this).data("data"));
                e.data.control.execute("change");
                e.data.$select.css("display", "none");
            });
            $select.append($li);
        }
        $select.css("display", "none");
        $input.on("click", $select, function (e, args) {
            if (e.data.css("display") == 'none') {
                e.data.css("display", "block");
            } else {
                e.data.css("display", "none");
            }
        });
        this.getElement().append($input);
        this.getElement().append($select);
    };
    control.prototype.setReadOnly = function (val) {
        if (val) {
            this.getElement().attr("disabled", "disabled");
            this.getElement().children("select").attr("disabled", "disabled");
        }
        else {
            this.getElement().attr("disabled", false);
            this.getElement().children("select").attr("disabled", false);
        }
    };
    control.prototype.setVisible = function (val) {
        if (val) {
            this.getElement().parent(".ui-field-contain").css("display", "block");
        }
        else {
            this.getElement().parent(".ui-field-contain").css("display", "none");
        }
    };

    return control;
});