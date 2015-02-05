/// <reference path="Cube.js" />

cb.binding.CheckBoxBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.CheckBoxBinding.prototype = new cb.binding.BaseBinding();

cb.binding.ButtonBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.ButtonBinding.prototype = new cb.binding.BaseBinding();

cb.binding.ImageButtonBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.ImageButtonBinding.prototype = new cb.binding.BaseBinding();

cb.binding.TitleBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.TitleBinding.prototype = new cb.binding.BaseBinding();


cb.binding.RadioBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
    this._onclick = function (val) {
        var model = this.getModel();
        if (!model) return;
        model.setValue(val);
        model.fireEvent("click", model);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("click", this._onclick);
            control.on("click", this._onclick, this);
        }
        model.addListener(this);
    };
};
cb.binding.RadioBinding.prototype = new cb.binding.BaseBinding();

cb.binding.ImageListBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.ImageListBinding.prototype = new cb.binding.BaseBinding();

cb.binding.AttachmentListBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.AttachmentListBinding.prototype = new cb.binding.BaseBinding();

cb.binding.ImageSlideBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.ImageSlideBinding.prototype = new cb.binding.BaseBinding();

cb.binding.LoadPageBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
    this._onclick = function (val) {
        var model = this.getModel();
        if (!model) return;
        model.setValue(val);
        model.fireEvent("click", model);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("click", this._onclick);
            control.on("click", this._onclick, this);
        }
        model.addListener(this);
    };
};
cb.binding.LoadPageBinding.prototype = new cb.binding.BaseBinding();


cb.binding.NumberBoxBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.NumberBoxBinding.prototype = new cb.binding.BaseBinding();

cb.binding.TextBoxBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.TextBoxBinding.prototype = new cb.binding.BaseBinding();

cb.binding.ReferBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;

        var that = this;

        this._onclick = function () {
            cb.console.log("_onclick", this);
            var model = this.getModel();
            if (!model) return;
            if (model.getReadOnly() || model.getDisabled()) return;

            //   model.set("refId", "tb_canzhao");
            //  model.set("refRelation", "handlingclerk=name");

            var refCode = model.get("refId");
            var refPath = model.get("refPath");
            if (!refCode) return;

            var filterValue = control.getText();

            var parentViewModelName = model.getParent().get("ViewModelName");
            while (!parentViewModelName) {
                model = model.getParent();
                parentViewModelName = model.getParent().get("ViewModelName");
            };
            var parentViewModel = cb.cache.get(parentViewModelName);
            if (!parentViewModel) return;

            //zhangxub
            if (refPath && refPath.length > 0) {
                cb.route.loadPageViewPart(parentViewModel, refPath);
                return;
            }

            cb.route.loadPageViewPart(parentViewModel, cb.route.CommonAppEnum.Refer, { queryString: { refCode: refCode }, "refCode": refCode, "filters": filterValue, callBack: this._callBack });
        };

        this._callBack = function (args) {

            var keyField = model.get("refKey") || "pk_org";
            var codeField = model.get("refCode") || "code";
            var nameField = model.get("refName") || "name";

            var data = args;
            var refReturnData = { keyField: keyField, codeField: codeField, nameField: nameField, data: data };

            debugger;

            //需要触发界面改变事件
            model.set("refReturnData", refReturnData);
            if (model.change(data && data.data[keyField])) {
                that._afterSelectItem(data.data[keyField]);
            }

        };

        this._getReferServices = function (callBack) {
            var url = "apps/common/refer/ReferLoader.js"
            if (!cb.loader.hasScript(url)) {
                cb.loader.loadScript(url, callBack);
            }
            else {
                callBack;
            }
        };

        this._setReferCarrier = function (targets) {
            if (cb.isArray(targets)) {
                //[{targetFld:'department',targetFldType:'1',targetData:{keyField:'id',codeField:'code',nameField:'name',data:[{id:'资金科',code:'1111',name:'1001ZZ10000000002J23'}]}},
                //{targetFld:'persondate',targetFldType:'0',targetData:'2014-04-29 20:40:28']
                for (var i = 0; i < targets.length; i++) {
                    var target = targets[i];
                    var targetModel = model.getParent().get(target.targetFld);
                    if (targetModel != null) {
                        if (target.targetData) {
                            if (target.targetFldType == "1") {
                                debugger;

                                var keyField = target.targetData.keyField;
                                var codeField = target.targetData.codeField;
                                var nameField = target.targetData.nameField;
                                var refrdata = { keyField: keyField, codeField: codeField, nameField: nameField };
                                refrdata.data = target.targetData;
                                targetModel.set("refReturnData", refrdata);
                                var data = target.targetData.data; // && target.targetData.data[0];
                                targetModel.setValue(data && data[target.targetData.keyField]);
                            }
                            else {
                                targetModel.setValue(target.targetData);
                            }
                        }
                    }
                } //for
            } //if
        };

        this._getReferCarrier = function (noExists, primaryKey) {
            var refCode = model.get("refId");
            if (!refCode) return;

            var that = this;

            if (noExists.length > 0) {
                var rela = noExists.toString(",");

                this._getReferServices(function () {
                    if (ReferLoader) {
                        ReferLoader.loadCarrier(refCode, primaryKey, rela, function (sucess, fail) {
                            if (fail) return;

                            that._setReferCarrier(sucess);

                        });
                    }
                });
            }
        };

        this._afterSelectItem = function (primaryKey) {
            var that = this;
            //选择一条数据后，调用服务，后去参照携带
            if (!model.get("refRelation")) return;
            /*第一步直接从返回结果中取数据，取不到的，再发请求到服务器取数据*/
            var refRelation = model.get("refRelation");
            var refData = model.get("refReturnData");
            var noExists = new Array();

            var relations = refRelation.split(",");
            for (var i = 0; i < relations.length; i++) {
                var st = relations[i].split("=");
                if (st.length != 2) continue;
                var source = st[0];
                var target = st[1];
                var targetModel = model.getParent().get(source);
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
            }
            //处理参照携带
            this._getReferCarrier(noExists, primaryKey);
        };

        this._onchange = function (refReturnData) {
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
        };

        this._loadRefer = function () {
            cb.console.log("_loadRefer start: ", this);
            var refCode = model.get("refId");
            if (!refCode) return;
            var filter = control.getText();
            //否则，调用服务
            this._getReferServices(function () {
                if (ReferLoader) {

                    ReferLoader.loadRefer(refCode, filter, function (sucess, fail) {
                        if (fail) return;
                        //取得数据后，相当于在参照界面中选择某条数据，按确定
                        if (sucess.table && sucess.table.currentPageData) {
                            var cData = sucess.table.currentPageData;
                            if ($.isArray(cData) && cData.length > 0) {
                                var data = { "data": sucess.table.currentPageData[0] }
                                that._callBack(data);
                            } else {
                                control.select();
                            }
                        }
                    });
                }
            });
        },

        this._onenter = function (event) {
            cb.console.log("_onenter start: ", this);
            event = event || window.event;
            if (event.keyCode = 13) {
                if (control.getText() != "") {
                    this._loadRefer();
                }
            }
        };

        this._onkeydown = function (event) {

            cb.console.log("_onkeydown start: ", this);
            event = event || window.event;
            if (event.keyCode == 13) {
                if (control.getText().length == 0) {
                    //如果没有任何输入，直接回车，则弹出参照界面
                    this._onclick();
                }
            }
            cb.console.log("_onkeydown end: ", this);
        };

        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            if (this._onchange && (model.change || model.hasEvent("beforechange") || model.hasEvent("afterchange"))) {
                if (control.un) control.un("onchange", this._onchange);
                if (control.on) control.on("onchange", this._onchange, this);
            }
            if (this._onkeydown) {
                if (control.un) control.un("onkeydown", this._onkeydown);
                if (control.on) control.on("onkeydown", this._onkeydown, this);
            }
            if (this._onenter) {
                if (control.un) control.un("onenter", this._onenter);
                if (control.on) control.on("onenter", this._onenter, this);
            }


        }

        if (this._onclick && (model.click || model.hasEvent("beforeclick") || model.hasEvent("afterclick"))) {
            if (control.un) control.un("onclick", this._onclick);
            if (control.on) control.on("onclick", this._onclick, this);
        }

        model.addListener(this);
    };
};
cb.binding.ReferBinding.prototype = new cb.binding.BaseBinding();
cb.binding.ReferBinding.prototype._set_value = function (control, propertyValue) {
    var model = this.getModel();
    if (!model || !control) return;
    if (propertyValue === "") {
        control.setValue("");
        model.set("refReturnData", null);
        return;
    }

    var showMode = model.get("refShowMode") || "Name";
    var returnData = model.get("refReturnData"); // 参照返回数据

    var keyFld = model.getModelName() + "_" + (model.get("refKey") || "").toLowerCase();
    var codeFld = model.getModelName() + "_" + (model.get("refCode") || "").toLowerCase();
    var nameFld = model.getModelName() + "_" + (model.get("refName") || "").toLowerCase();

    var keyModel = model.getParent().get(keyFld) || model;
    var codeModel = model.getParent().get(codeFld);
    var nameModel = model.getParent().get(nameFld);

    var keyValue = null, codeValue = null, nameValue = null;
    if (returnData && returnData.data) {
        keyValue = returnData.data.data[returnData.keyField];
        codeValue = returnData.data.data[returnData.codeField];
        nameValue = returnData.data.data[returnData.nameField];
    }
    else {
        keyValue = (keyModel && keyModel.getValue) ? keyModel.getValue() : keyModel;
        codeValue = (codeModel && codeModel.getValue) ? codeModel.getValue() : codeModel;
        nameValue = (nameModel && nameModel.getValue) ? nameModel.getValue() : nameModel;
    }

    var displayText = (showMode === "Code" ? codeValue : (showMode === "CodeName" ? ("(" + codeValue + ")" + nameValue) : nameValue));
    if (propertyValue == null) control.setValue(propertyValue, propertyValue);
    else control.setValue(propertyValue, displayText || propertyValue);
};

cb.binding.DateTimeBoxBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.DateTimeBoxBinding.prototype = new cb.binding.BaseBinding();
cb.binding.DateTimeBoxBinding.prototype.initData = function () {
    var model = this.getModel();
    var control = this.getControl();
    if (!model || !control) return;
    var val;
    if (model._data["defaultValue"]) {
        if (model._data["defaultValue"] === "@SYSDATE") model._data["defaultValue"] = new Date();
        val = cb.util.formatDate(model._data["defaultValue"]);
    }
    if (model._data["value"]) {
        if (model._data["value"] === "@SYSDATE") model._data["value"] = new Date();
        val = cb.util.formatDate(model._data["value"]);
    }
    if (val) {
        //val = val ;
        model._data["defaultValue"] = val;
        model.setValue(val);
    }
    if (control.setData) control.setData(model._data);
};

cb.binding.ComboBoxBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.ComboBoxBinding.prototype = new cb.binding.BaseBinding();

cb.binding.TreeBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._select = function (row, previousRow) {
        model.setFocusedRow(row);
    };

    this._click = function (row) {
        if (row != null) model.click(row);
    };

    this._doubleclick = function (row) {
        if (row != null) model.doubleClick(row);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("select", this._select);
            control.on("select", this._select, this);
            control.un("click", this._click);
            control.on("click", this._click, this);
            control.un("doubleclick", this._doubleclick);
            control.on("doubleClick", this._doubleclick, this);
        }
        model.addListener(this);
    };

    this._set_rows = function (control, propertyValue) {
        if (propertyValue instanceof Array) {
            var model = this.getModel();
            if (model._data.KeyColumn != "" && model._data.DisplayColumn != "") {
                control.setOption({ keyField: model._data.KeyColumn, displayField: model._data.DisplayColumn });
                control.loadData(propertyValue);
            }
        }
    };

    this._set_selected = function (control, propertyValue) {
        for (var attr in propertyValue) {
            control.selectNodeById(attr);
        }
    };

    this._set_expand = function (control, propertyValue) {
        if (propertyValue.Expanded) control.openNode(propertyValue);
        else control.closeNode(propertyValue);
    };

    this._get_focusedrow = function (control) {
        return control.getSelectedRow();
    };

    this._set_focusedrow = function (control, propertyValue) {
        if (propertyValue == -1) return;
        control.selectNode(propertyValue);
    };

    this._set_addbefore = function (control, propertyValue) {
        control.addNodeBefore(propertyValue.row, propertyValue.row_exist);
    };

    this._set_addafter = function (control, propertyValue) {
        control.addNodeAfter(propertyValue.row, propertyValue.row_exist);
    };

    this._set_remove = function (control, propertyValue) {
        control.removeNode(propertyValue);
    };

    this._set_add = function (control, propertyValue) {
        control.appendNode(propertyValue.row, propertyValue.parent);
    };
};
cb.binding.TreeBinding.prototype = new cb.binding.BaseBinding();

cb.binding.DataGridBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._onCellChange = function (rowIndex, cellName, cellValue) {
        var model = this.getModel();
        if (!model) return;
        if (model.cellChange) model.cellChange(rowIndex, cellName, cellValue);
    };

    this._onSort = function (args) {
        var model = this.getModel();
        if (!model) return;
        if (model.sort) {
            if (!args) model.sort();
            else model.sort(args["field"], args["direction"]);
        }
    };

    this._onSelectedRowsChanged = function (selectedRows) {
        var model = this.getModel();
        if (!model) return;
        if (model.onSelect) model.onSelect(selectedRows);
    };

    this._onAddNewRow = function (rowIndex) {
        var model = this.getModel();
        if (!model) return;
        if (rowIndex == null) rowIndex = model.getRows().length;
        if (model.insert) model.insert(rowIndex);
    };

    this._onDeleteRows = function (rowIndexes) {
        var model = this.getModel();
        if (!model) return;
        if (model.remove) model.remove(rowIndexes);
    };

    this._onShowCardView = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        control.showCardView(model);
    };

    this._onCellEditorLoad = function (column, controlId) {
        var model = this.getModel();
        if (!model) return;
        var viewBinding = this._getEditRowModelContainerBinding(model.getEditRowModel());
        viewBinding.add({ controlId: controlId, controlType: column.columnType, propertyName: column.id, bindingMode: "TwoWay" });
    };

    this._onCellEditorDestroy = function (controlId) {
        var model = this.getModel();
        if (!model) return;
        var viewBinding = this._getEditRowModelContainerBinding(model.getEditRowModel());
        viewBinding.remove(controlId);
    };

    this._getEditRowModelContainerBinding = function (viewModel) {
        this._editRowModelContainerBinding = this._editRowModelContainerBinding || cb.viewbinding.create("cell", viewModel);
        return this._editRowModelContainerBinding;
    };

    this._onChangePage = function (pageSize, pageIndex) {
        var model = this.getModel();
        if (!model) return;
        if (model.onChangePage) model.onChangePage(pageSize, pageIndex);
    };

    this._onActiveRowClick = function (args) {
        var model = this.getModel();
        if (!model || !model.fireEvent) return;
        var activeRowIndex = args.row;
        if (activeRowIndex == null) return;
        var activeRow = model.getRows()[activeRowIndex];
        if (!activeRow) return;
        model.fireEvent("onActiveRowClick", activeRow);
    };

    this._onQuerySchemeChanged = function (args) {
        var model = this.getModel();
        if (!model || !model.fireEvent) return;
        model.fireEvent("onQuerySchemeChanged", args);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("onCellChange", this._onCellChange);
            control.on("onCellChange", this._onCellChange, this);
            control.un("onSort", this._onSort);
            control.on("onSort", this._onSort, this);
            control.un("onSelectedRowsChanged", this._onSelectedRowsChanged);
            control.on("onSelectedRowsChanged", this._onSelectedRowsChanged, this);
            control.un("onAddNewRow", this._onAddNewRow);
            control.on("onAddNewRow", this._onAddNewRow, this);
            control.un("onDeleteRows", this._onDeleteRows);
            control.on("onDeleteRows", this._onDeleteRows, this);
            control.un("onShowCardView", this._onShowCardView);
            control.on("onShowCardView", this._onShowCardView, this);
            control.un("onCellEditorLoad", this._onCellEditorLoad);
            control.on("onCellEditorLoad", this._onCellEditorLoad, this);
            control.un("onCellEditorDestroy", this._onCellEditorDestroy);
            control.on("onCellEditorDestroy", this._onCellEditorDestroy, this);
            control.un("onChangePage", this._onChangePage);
            control.on("onChangePage", this._onChangePage, this);
            control.un("onActiveRowClick", this._onActiveRowClick);
            control.on("onActiveRowClick", this._onActiveRowClick, this);
            control.un("onQuerySchemeChanged", this._onQuerySchemeChanged);
            control.on("onQuerySchemeChanged", this._onQuerySchemeChanged, this);
        }
        model.addListener(this);
    };
};
cb.binding.DataGridBinding.prototype = new cb.binding.BaseBinding();

cb.binding.SearchBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._onInput = function (val) {
        var model = this.getModel();
        if (!model) return;
        model.setValue(val);
        model.fireEvent("input", model);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("input", this._onInput);
            control.on("input", this._onInput, this);
        }
        model.addListener(this);
    };
}
cb.binding.SearchBinding.prototype = new cb.binding.BaseBinding();

cb.binding.ListViewBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._onSort = function (data) {
        var model = this.getModel();
        if (!model) return;
        if (model.sort) {
            if (!data) model.sort();
            else model.sort(data["field"], data["direction"]);
        }
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("sort", this._onSort);
            control.on("sort", this._onSort, this);
        }
        model.addListener(this);
    };
};
cb.binding.ListViewBinding.prototype = new cb.binding.BaseBinding();

cb.binding.FooterToolbarBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
}
cb.binding.FooterToolbarBinding.prototype = new cb.binding.BaseBinding();

cb.binding.ToolBarBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
}
cb.binding.ToolBarBinding.prototype = new cb.binding.BaseBinding();

cb.binding.SimpleListViewBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
    this._onClick = function (data) {
        var model = this.getModel();
        if (!model) return;
        model.fireEvent("click", data);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("click", this._onClick);
            control.on("click", this._onClick, this);
        }
        model.addListener(this);
    };
};
cb.binding.SimpleListViewBinding.prototype = new cb.binding.BaseBinding();

cb.binding.TabContentBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._onClick = function (args) {
        var model = this.getModel();
        if (!model) return;
        model.setValue(args);
        model.fireEvent("click", args);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("click", this._onClick);
            control.on("click", this._onClick, this);
        }
        model.addListener(this);
    };
};
cb.binding.TabContentBinding.prototype = new cb.binding.BaseBinding();
cb.binding.TabContentBinding.prototype.initData = function () {
    var model = this.getModel();
    var control = this.getControl();
    if (!model || !control) return;
    if (control.setData) control.setData(model._data);
    var dataSource = model._data.dataSource;
    if (!dataSource || dataSource.length == null) return;
    for (var i = 0; i < dataSource.length; i++) {
        if (dataSource[i].isSelected) {
            model.setValue(dataSource[i].content);
            model.click(dataSource[i].content);
        }
    }
};

cb.binding.ImageBoxBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.ImageBoxBinding.prototype = new cb.binding.BaseBinding();

cb.binding.ProcessBarBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.ProcessBarBinding.prototype = new cb.binding.BaseBinding();


cb.binding.ListCardBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._onItemClick = function (args) {
        var model = this.getModel();
        if (!model) return;
        if (model.onSelect && args && args.type && args.data) {
            var selectedIndex = model.getRows().indexOf(args.data);
            model.onSelect(selectedIndex);
        }
        model.fireEvent("click", args);
    };

    this._onChangePage = function (args) {
        var model = this.getModel();
        if (!model) return;
        if (model.onChangePage) model.onChangePage(args.pageSize, args.pageIndex);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("itemClick", this._onItemClick);
            control.on("itemClick", this._onItemClick, this);
            control.un("changePage", this._onChangePage);
            control.on("changePage", this._onChangePage, this);
        }
        model.addListener(this);
    };
};
cb.binding.ListCardBinding.prototype = new cb.binding.BaseBinding();

cb.binding.TimeLineBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._onItemClick = function (args) {
        var model = this.getModel();
        if (!model) return;
        model.fireEvent("click", args);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("itemClick", this._onItemClick);
            control.on("itemClick", this._onItemClick, this);
        }
        model.addListener(this);
    };
};
cb.binding.TimeLineBinding.prototype = new cb.binding.BaseBinding();

cb.binding.TextAreaBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.TextAreaBinding.prototype = new cb.binding.BaseBinding();

cb.binding.PassWordBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.PassWordBinding.prototype = new cb.binding.BaseBinding();

cb.binding.AccondionBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._onItemClick = function (args) {
        var model = this.getModel();
        if (!model) return;
        var control = this.getControl();
        if (control) cb.cache.set("clickElement", control.$elem.get(0).id);

        model.set("selectedItem", args);
        model.fireEvent("click", args);
    };

    this._onBeforeExpand = function (args) {
        var model = this.getModel();
        if (!model) return;

        var control = this.getControl();
        model.fireEvent("beforeExpand", args)
    };
    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("itemClick", this._onItemClick);
            control.on("itemClick", this._onItemClick, this);
            control.un("beforeExpand", this._onBeforeExpand);
            control.on("beforeExpand", this._onBeforeExpand, this);
        }
        model.addListener(this);
    };
};
cb.binding.AccondionBinding.prototype = new cb.binding.BaseBinding();


cb.binding.SearchBoxBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._onSearch = function (val) {
        var model = this.getModel();
        if (!model) return;
        model.setValue(val);
        model.fireEvent("search", val);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("search", this._onSearch);
            control.on("search", this._onSearch, this);
        }
        model.addListener(this);
    };
};
cb.binding.SearchBoxBinding.prototype = new cb.binding.BaseBinding();

cb.binding.DropDownBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._onItemClick = function (args) {
        var model = this.getModel();
        if (!model) return;
        model.fireEvent("click", args);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("itemClick", this._onItemClick);
            control.on("itemClick", this._onItemClick, this);
        }
        model.addListener(this);
    };
};
cb.binding.DropDownBinding.prototype = new cb.binding.BaseBinding();

cb.binding.LabelBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.LabelBinding.prototype = new cb.binding.BaseBinding();

cb.binding.DropDownButtonBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.DropDownButtonBinding.prototype = new cb.binding.BaseBinding();


//zhangxub
cb.binding.TimeLineControlBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
}
cb.binding.TimeLineControlBinding.prototype = new cb.binding.BaseBinding();

cb.binding.SumListBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
}
cb.binding.SumListBinding.prototype = new cb.binding.BaseBinding();

cb.binding.RejectListBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._selectedIndexChanged = function (args) {
        var model = this.getModel();
        if (!model) return;
        model.setValue(args);
    };
    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            //control.un("selectedIndexChanged", this._itemChecked);
            control.on("selectedIndexChanged", this._selectedIndexChanged, this);
        }
        model.addListener(this);
    };
}
cb.binding.RejectListBinding.prototype = new cb.binding.BaseBinding();

cb.binding.CheckListBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
    this._itemChecked = function (args) {
        var model = this.getModel();
        if (!model) return;
        model.fireEvent('checkChange', args);
    }
    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.on("itemChecked", this._itemChecked, this);
        }
        model.addListener(this);
    }
}
cb.binding.CheckListBinding.prototype = new cb.binding.BaseBinding();

cb.binding.PermissionPersonListBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._addSensitiveObj = function (args) {
        var model = this.getModel();
        if (!model) return;
        model.fireEvent('sensitiveObjAdded', args);
        //alert(args);
    }
    this._loadBusField = function (args) {
        var model = this.getModel();
        if (!model) return;
        //alert(args);
        model.setValue(args);
        model.fireEvent('loadBusField', args);
    }
    this._setAuthority = function (args) {
        var model = this.getModel();
        if (!model) return;
        //model.setValue(args);
        alert(args);
        model.fireEvent('setAuthority', args);
    }

    this._deleteSensitiveObj = function (args) {
        var model = this.getModel();
        if (!model) return;
        model.fireEvent('deleteSensObj', args);
    }

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.on("loadBusField", this._loadBusField, this);
            control.on("sensitiveObjAdded", this._addSensitiveObj, this);
            control.on("setAuthority", this._setAuthority, this);
            control.on("deleteSensitiveObj", this._deleteSensitiveObj, this);
        }
        model.addListener(this);
    }
}
cb.binding.PermissionPersonListBinding.prototype = new cb.binding.BaseBinding();

cb.binding.BatchModifyBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._btnClicked = function (args) {
        var model = this.getModel();
        if (!model) return;
        model.setValue(args);
        //model._parent.updateData(args);
        model.fireEvent('updateData', args);
    }

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.on("btnClicked", this._btnClicked, this);
        }
        model.addListener(this);
    }
}
cb.binding.BatchModifyBinding.prototype = new cb.binding.BaseBinding();

cb.binding.SimpleListBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._itemChecked = function (args) {
        var model = this.getModel();
        if (!model) return;
        model.fireEvent("itemChecked", args);
    };

    this._itemUnChecked = function (args) {
        var model = this.getModel();
        if (!model) return;
        model.fireEvent("itemUnChecked", args);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("itemChecked", this._itemChecked);
            control.on("itemChecked", this._itemChecked, this);
            control.un("itemUnChecked", this._itemUnChecked);
            control.on("itemUnChecked", this._itemUnChecked, this);
        }
        model.addListener(this);
    };
}
cb.binding.SimpleListBinding.prototype = new cb.binding.BaseBinding();

cb.binding.CatalogBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._onItemClick = function (args) {
        var model = this.getModel();
        if (!model) return;
        model.fireEvent("click", args);
        var control = this.getControl();

        var item = control.getSelectedItem();
        if (item && item.length > 0) {
            model.setData("selectedItem", item.data("data"));
        }
    };


    this._onMoreClick = function (args) {
        var model = this.getModel();
        if (!model) return;
        model.fireEvent("moreClick", args);
    };

    this._onBeforeExpand = function (args) {
        var model = this.getModel();
        if (!model) return;
        model.fireEvent("beforeExpand", args);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("itemClick", this._onItemClick);
            control.on("itemClick", this._onItemClick, this);

            control.un("moreClick", this._onMoreClick);
            control.on("moreClick", this._onMoreClick, this);
            control.un("beforeExpand", this._onBeforeExpand);
            control.on("beforeExpand", this._onBeforeExpand, this);
        }
        model.addListener(this);
    };
};
cb.binding.CatalogBinding.prototype = new cb.binding.BaseBinding();

cb.binding.PanoramaBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._onItemClick = function (args) {
        var model = this.getModel();
        if (!model) return;
        model.fireEvent("itemClick", args);
    };


    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("itemClick", this._onItemClick);
            control.on("itemClick", this._onItemClick, this);
        }
        model.addListener(this);
    };
};

cb.binding.PanoramaBinding.prototype = new cb.binding.BaseBinding();

cb.binding.StatusBarBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.StatusBarBinding.prototype = new cb.binding.BaseBinding();

cb.binding.ScaleBarBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.ScaleBarBinding.prototype = new cb.binding.BaseBinding();

cb.binding.StatusBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
};
cb.binding.StatusBinding.prototype = new cb.binding.BaseBinding();
cb.binding.StatusBinding.prototype.initData = function () {
    var model = this.getModel();
    var control = this.getControl();
    if (!model || !control) return;
    var val;
    var defaultValue = model._data["defaultValue"];
    if (defaultValue != null) {
        if (typeof defaultValue === "number") {
            val = defaultValue;
        }
        else if (typeof defaultValue === "string") {
            val = parseInt(defaultValue);
        }
    }
    if (val != null) model.set("defaultValue", val);
    var value = model._data["value"];
    if (value != null) {
        if (typeof value === "number") {
            val = value;
        }
        else if (typeof value === "string") {
            val = parseInt(value);
        }
    }
    if (val != null) model.setValue(val);
    if (control.setData) control.setData(model._data);
};

cb.binding.ListControlBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._onItemClick = function (args) {
        var model = this.getModel();
        if (!model) return;
        model.fireEvent("click", args);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("itemClick", this._onItemClick);
            control.on("itemClick", this._onItemClick, this);
        }
        model.addListener(this);
    };
};
cb.binding.ListControlBinding.prototype = new cb.binding.BaseBinding();
