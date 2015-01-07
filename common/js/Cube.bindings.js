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

        this._onclick = function () {
            cb.console.log("_onclick", this);
            var model = this.getModel();
            if (!model) return;
            if (model.getReadOnly() || model.getDisabled()) return;
            var refCode = model.get("refId");
            if (!refCode) return;
            cb.cache.set("referModel", model);
            var parentViewModelName = model.getParent().get("ViewModelName");
            while (!parentViewModelName) {
                model = model.getParent();
                parentViewModelName = model.getParent().get("ViewModelName");
            };
            var parentViewModel = cb.cache.get(parentViewModelName);
            if (!parentViewModel) return;
            parentViewModel.loadPageView("common.refer.ReferApp", { queryString: { refCode: refCode } });
        };

        this._onchange = function (refReturnData) {
            var model = this.getModel();
            if (!model) return;
            if (typeof refReturnData !== "object") {
                model.setValue(refReturnData);
                return;
            }
            var refColumn = model.get("refColumn");
            if (!refColumn) return;
            var keyValue = refReturnData.data[refReturnData.keyField];
            model.set("refReturnData", refReturnData);
            model.setValue(keyValue);
        };

        this._onkeydown = function (event) {
            cb.console.log("_onkeydown start: ", this);
            event = event || window.event;
            if (event.keyCode == 13) {
                this._onclick();
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
        val = val + " 00:00:00";
        model._data["defaultValue"] = val;
        model.setValue(val);
    }
    if (control.setData) control.setData(model._data);
};

cb.binding.ComboBoxBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);
    this._onclick = function (val) {
        var model = this.getModel();
        if (!model) return;
        model.setValue(val);
    };

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.un("changeValue", this._onchange);
            control.on("changeValue", this._onchange, this);
        }
        model.addListener(this);
    };
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

cb.binding.PermissionPersonListBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this._addRow = function (args) {
        var model = this.getModel();
        if (!model) return;
    }

    this._rowClicked = function (args) {
        var model = this.getModel();
        if (!model) return;
    }
    this.appleBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;
        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            control.on("rowClicked", this._rowClicked, this);
            control.on("addRow", this._addRow, this);
        }
        model.addListener(this);
    }
}
cb.binding.PermissionPersonListBinding.prototype = new cb.binding.BaseBinding();

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