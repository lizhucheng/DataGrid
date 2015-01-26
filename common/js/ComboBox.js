/// <reference path="../Control.js" />

/// <reference path="../Control.js" />
cb.controls.widget("ComboBox", function (controlType) {
    var _shieldChar;
    var control = function (id, options) {
        cb.controls.Control.call(this, id, options);
        var _fieldType='text';
    };
    control.prototype = new cb.controls.Control();
    control.prototype.controlType = controlType;

    control.prototype.getValue = function () {
            return this.getElement().children("div").children("input").val();
    };
    control.prototype.setValue = function (val) {
        this.getElement().children("div").children("input").val(val.value);
        this.getElement().children("div").children("span").text(val.text);
        this.getElement().children("ul>li").each(function (i, n) {
            $(n).removeClass("checked");
            if ($(n).children("input").val() == val.value) {
                $(n).addClass("checked");
            }
        });
        //alert(this.getValue())
    };

    control.prototype.setData = function (data) {
        //this.setSelectOptions(data);
        for (var attr in data) {
            var attrUpper = attr.substring(0, 1).toUpperCase() + attr.substring(1);
            if (this["set" + attrUpper]) {
                if (attrUpper == 'DataSource') {
                    this["set" + attrUpper](data[attr], !data['fieldType'] ? 'text' : data['fieldType']);
                } else {
                    this["set" + attrUpper](data[attr]);
                }
            }
        }
    };
    control.prototype.getFieldType = function () {
        return this._fieldType;
    };
    control.prototype.setFieldType = function (val) {
        this._fieldType = val;
    };
    control.prototype.on = function (eventName, func, context) {
        //var data = { me: this, context: context };
        //debugger;
        var self = this;
        this.getElement().on(eventName, function () {
            debugger;
                func.call(context,self.getValue());
        });
    };
    control.prototype.setDataSource = function (dataSource,fieldType) {
        if (!dataSource || !cb.isArray(dataSource)) return;
        if (fieldType) {
            fieldType = this.getFieldType();
        }
        this.getElement().empty();
        var $input = $('<div><input type="hidden" /><span></span></div>')
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
            var $li = $('<li><input type="hidden" value="' + attrValue.value + '" />' + image + '<span>' + attrValue.text + '</span></li>');

            $this = this;
            $li.on("click", function () {
                //debugger;
                $this.setValue({ 'value': $(this).children('input').val(), 'text': $(this).children('span').text() });
                $this.getElement().trigger("changeValue", { 'value': $(this).children('input').val(), 'text': $(this).children('span').text() });

                $select.children('li').removeClass('checked');
                $(this).addClass('checked');
                $select.css("display", "none");
            });
            $select.append($li);
        }
        $select.css("display", "none");
        $input.on("click", function () {
            debugger;
            if ($this.getElement().children('ul').css("display") == 'none') {
                $this.getElement().children('ul').css("display", "block");
            } else {
                $this.getElement().children('ul').css("display", "none");
            }
        });
       // $input.children("input").on("change", function () {
       //     self.getElement().trigger("selectedIndexChanged", $(this).children('input').val());

      //  });
        this.getElement().append($input);
        this.getElement().append($select);
        $select.css('display', 'none');
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
    control.prototype.setdefaultValue = function (val) {
        this.setValue(val);
    };
   
    return control;
});