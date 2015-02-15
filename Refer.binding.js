/// <reference path="Cube.js" />

cb.binding.ReferBinding = function (mapping, parent) {
    cb.binding.BaseBinding.call(this, mapping, parent);

    this.applyBindings = function () {
        var model = this.getModel();
        var control = this.getControl();
        if (!model || !control) return;

        var that = this;

        this._onchange = function (data) {
            cb.console.log("_onchange", this);
            var model = this.getModel();
            if (!model) return;
            if (model.getReadOnly() || model.getDisabled()) return;

            var refKey = model.get('refKey'),
                refCode = model.get('refCode'),
                refName = model.get('refName'),
                refRelation = model.get('refRelation');
            //目前表单中的参照只支持单选，后续需支持多选
            if (cb.isArray(data)) data = data[0];
            model.set('refKeyValue', data[refKey]);
            model.setData('relData',cb.clone(data));
            model.setValue(data[refKey]);

        };



        if (this._mapping.bindingMode == cb.binding.BindingMode.TwoWay) {
            if (this._onchange && (model.change || model.hasEvent("beforechange") || model.hasEvent("afterchange"))) {
                if (control.un) control.un("change", this._onchange);
                if (control.on) control.on("change", this._onchange, this);
            }

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
        model.set("relData", null);
        return;
    }

    var showMode = model.get("refShowMode") || "Name";
    var relData = model.get("relData"); // 参照相关数据

    var keyValue = null, codeValue = null, nameValue = null;
    if (relData) {
        var refKey = model.get('refKey'),
            refCode = model.get('refCode'),
            refName = model.get('refName');
        keyValue = relData[refKey];
        codeValue = relData[refCode];
        nameValue = relData[refName];

        //更新关联信息
        var refRelation = model.get('refRelation')||'';
        var relations = refRelation.split(",");
        for (var i = 0; i < relations.length; i++) {
            var st = relations[i].split("=");
            if (st.length != 2) continue;
            var target = st[0];
            var source = st[1];
            
            var targetModel = model.getParent().get(target);
            if (targetModel) {
                if (relData[source] && relData[source].targetFldType == 1) {//参照
                    targetModel.setData(relData[source]);
                } else {
                    targetModel.setValue(relData[source]);
                }
                
            }
        }
    }
    else {//页面初始化时使用以前的方式，把数据放在参照相关的code，name model中
        //var keyFld = model.getModelName() + "_" + (model.get("refKey") || "").toLowerCase();
        var codeFld = model.getModelName() + "_" + (model.get("refCode") || "").toLowerCase();
        var nameFld = model.getModelName() + "_" + (model.get("refName") || "").toLowerCase();

        //var keyModel = model.getParent().get(keyFld) || model;//参照的model即为refKey对应的model
        var codeModel = model.getParent().get(codeFld);
        var nameModel = model.getParent().get(nameFld);

        //keyValue = (keyModel && keyModel.getValue) ? keyModel.getValue() : keyModel;
        keyValue = model.getValue();
        codeValue = (codeModel && codeModel.getValue) ? codeModel.getValue() : codeModel;
        nameValue = (nameModel && nameModel.getValue) ? nameModel.getValue() : nameModel;
    }

    var displayText = (showMode === "Code" ? codeValue : (showMode === "CodeName" ? ("(" + codeValue + ")" + nameValue) : nameValue));
    if (propertyValue == null) control.setValue(propertyValue, propertyValue);
    else control.setValue(propertyValue, displayText || propertyValue);
};

