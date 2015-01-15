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
            model.sort(args);
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
