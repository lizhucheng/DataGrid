/// <reference path="../Control.js" />

cb.controls.widget("Refer", function (controlType) {

    var _readOnly = function () { return false; }

    var control = function (id, options) {

        var self = this;
        cb.controls.Control.call(this, id, options);

        var $child = self.getElement();
        var $input = $child.children().first();
        var $icon = $child.find("img").last();
        var $close = $child.find("img").first();

        this._set_data("refData", { key: "", name: "" });
        this._set_data("$child", $child);
        this._set_data("$input", $input);
        this._set_data("$icon", $icon);
        this._set_data("events", {});

        this._set_data("$close", $close);

        // event.stopPropagation()
        // event.preventDefault()
        // return false = event.stopPropagation() + event.preventDefault()
        function handleKeyPress(e, args) {

        }

       

        if ($input.is("input")) {
            $input.on("focus", function () {
                $child.toggleClass("Refer-focus");
                $input.val().length > 0 ? $close.css({ visibility: "visible" }) : $close.css({ visibility: "hidden" });
                
            });
            $input.on("blur", function () {
                $child.toggleClass("Refer-focus");
            });
            /*
            $input.on("input propertychange", function (e) {
                $input.val().length > 0 ? $close.css({ visibility: "visible" }) : $close.css({ visibility: "hidden" });
            });
            */
            $input.bind("change", function (e, args) {
                var currentVal = $(e.target).val();
                self._onchange(currentVal);                
                $input.val().length > 0 ? $close.css({ visibility: "visible" }) : $close.css({ visibility: "hidden" });
            });    


            $icon.click(function () {
                self._onclick();
            });
            //清空参照后，相关的信息不处理，注：清空时并不会触发input的change事件，因为input并为活动焦点
            $close.click(function () {
                $input.val("");
            });
        }
        
    };
    control.prototype = new cb.controls.Control();
    control.prototype.controlType = controlType;
    control.prototype.getValue = function () {
        return this._get_data("refData").key;
    };
    control.prototype.setValue = function (key, name) {
        this._get_data("refData").key = key;
        this._get_data("refData").name = name;

        this._get_data("$input").is("input") ? this._get_data("$input").val(name) : this._get_data("$input").html(name);
    };

    control.prototype.getText = function () {
        return this._get_data("$input").is("input") ? this._get_data("$input").val() :"";
    };

    control.prototype.select = function () {
        if (this._get_data("$input").is("input")) {
            this._get_data("$input").select();
        }
    }

    control.prototype.setReadOnly = function (val) {
        if (this._get_data("$input").is("input")) {
            if (val) {
                this._get_data("$input").attr("readOnly", "readonly");
                this.getElement().attr("readOnly", "readonly");
            }
            else {
                this._get_data("$input").removeAttr("readOnly");
                this.getElement().removeAttr("readOnly");
            }
        }
        else {
            val ? this.getElement().bind("click", _readOnly) : this.getElement().unbind("click", _readOnly);
        }
    };

    control.prototype.getReadOnly = function () {
        if (this._get_data("$input").is("input"))
            return this._get_data("$input").attr("readOnly") == "readonly" ? true : false;
        else {
            var events = $._data(this._get_data("$input").get(0), "events");
            var clickEvents = events && events["click"];
            if (!clickEvents || !clickEvents.length) return false;
            for (var i = 0; i < clickEvents.length; i++) {
                if (clickEvents[i].handler == _readOnly) return true;
            }
            return false;
        }
    };

    control.prototype.setNullable = function (val) {
        var $label = this.getElement().prev();
        $label.toggleClass("mustinput", !val);
    };
    control.prototype.setNoinput = function (val) {
        var $label = this.getElement().prev();
        var $parent;
        if (this._get_data("$input").is("input")) $parent = this.getElement();
        else $parent = this._get_data("$input");
        $label.toggleClass("mustinput-noinput", val);
        $parent.toggleClass("parentdiv-noinput", val);
    };


    $.extend(control.prototype, cb.events);

    $.extend(control.prototype, {
        _onclick:function () {
            if(this.getReadOnly()) return;

            var refCode = this._opts["refId"];
            var refPath = this._opts["refPath"];
            if (!refCode) return;

            var filterValue = this.getText();

            var parentViewModelName = this.getElement().closest('[data-viewmodel]').data('viewmodel');
           
            var parentViewModel = cb.cache.get(parentViewModelName);
            if (!parentViewModel) return;

            //zhangxub
            if (refPath && refPath.length > 0) {
                cb.route.loadPageViewPart(parentViewModel, refPath);
                return;
            }

            cb.route.loadPageViewPart(parentViewModel, cb.route.CommonAppEnum.Refer, { queryString: { refCode: refCode }, "refCode": refCode, "filters": filterValue, callBack: $.proxy(this._callBack,this) });
        },
        _callBack: function (args) {//args为一条或多条记录

            var keyField = this._opts["refKey"] || "pk_org";
            var codeField = this._opts["refCode"] || "code";
            var nameField = this._opts["refName"] || "name";

            var data = cb.clone(args&&args.data&&args.data);
            //var refReturnData = { keyField: keyField, codeField: codeField, nameField: nameField, data: data };
            //if (cb.isEqual(refReturnData, this._opts['refReturnData']) return;

            //参照值改变后，准备携带数据

            /*第一步直接从返回结果中取数据，取不到的，再发请求到服务器取数据*/
            var refRelation = this._opts["refRelation"] || '';
            //var refData = this._opts['refReturnData'].data.data;
            var noExists = new Array();

            var relations = refRelation.split(",");
            for (var i = 0; i < relations.length; i++) {
                var st = relations[i].split("=");
                if (st.length != 2) continue;
                var source = st[0];
                var target = st[1];
                /*
                //var targetModel = model.getParent().get(source);
                if (targetModel) {
                    if (targetModel.get("ctrlType") && targetModel.get("ctrlType").toLocaleLowerCase() === "refer") {
                        noExists.push(relations[i]);
                    } else {
                        var fieldValue = refData.data.data[target];
                        if (fieldValue) {
                            targetModel.setValue(fieldValue);
                        }
                        else {
                            noExists.push(relations[i]);
                        }
                    }
                }
                */
                //如果返回的值中没有要携带的字段值
                if (!data[source]) {
                    noExists.push(relations[i]);
                }
            }
            //判断参照是否有变化
            if (!cb.isArray(data)&&data[keyField]==this.getValue()) {return; }

            //处理参照携带
            if (!noExists.length) {
                this.execute('change',data);
            } else {
                this._getReferCarrier(noExists, data[keyField],data);
            }
            

        },
        _getReferCarrier:function (noExists, primaryKey,data) {
            var refCode =this._opts["refId"];
            if (!refCode) return;

            var that = this;

            if (noExists.length > 0) {
                var rela = noExists.join(",");

                this._getReferServices(function () {
                    if (ReferLoader) {
                        ReferLoader.loadCarrier(refCode, primaryKey, rela, function (sucess, fail) {
                            if (fail) return;

                            //that._setReferCarrier(sucess);
                            //处理携带的信息
                            var targets = sucess;
                            if (cb.isArray(targets)) {//每个数组项表示一个字段的信息
                                //[{targetFld:'department',targetFldType:'1',targetData:{keyField:'id',codeField:'code',nameField:'name',data:[{id:'资金科',code:'1111',name:'1001ZZ10000000002J23'}]}},
                                //{targetFld:'persondate',targetFldType:'0',targetData:'2014-04-29 20:40:28']
                                for (var i = 0; i < targets.length; i++) {
                                    var target = targets[i];
                                    if (target.targetData) {
                                        data[target.targetFld] = target.targetData;
                                    }
                                }
                            }
                            that.execute('change',data);

                        });
                    }
                });
            }
        },

        _getReferServices:function (callBack) {
            var url = "apps/common/refer/ReferLoader.js"
            if (!cb.loader.hasScript(url)) {
                cb.loader.loadScript(url, callBack);
            }
            else {
                callBack;
            }
        },
        _onchange:function (refReturnData) {
            var model = this.getModel();
            if (!model) return;
            if (typeof refReturnData !== "object") {
                if (refReturnData === "") {
                    model.setValue("");
                }
                else {
                    this._loadRefer();
                }
                //model.setValue(refReturnData);
                return;
            }
            var refColumn = model.get("refColumn");
            if (!refColumn) return;
            var keyValue = refReturnData.data[refReturnData.keyField];
            model.set("refReturnData", refReturnData);
            model.setValue(keyValue);
        },
        _onenter:function (event) {
            cb.console.log("_onenter start: ", this);
            event = event || window.event;
            if (event.keyCode = 13) {
                if (control.getText() != "") {
                    this._loadRefer();
                }
            }
        },

        _onkeydown:function (event) {

            cb.console.log("_onkeydown start: ", this);
            event = event || window.event;
            if (event.keyCode == 13) {
                if (control.getText().length == 0) {
                    //如果没有任何输入，直接回车，则弹出参照界面
                    this._onclick();
                }
            }
            cb.console.log("_onkeydown end: ", this);
        },
       
        _afterSelectItem:function (primaryKey) {
            var that = this;
            
        },

        setData:function(opts){
            this._opts=$.extend(true,{},opts);//保存参照关联的信息refId,refKey,refCode,refName,refRelation,refPath
        },

        __end:''

    });

    return control;
});