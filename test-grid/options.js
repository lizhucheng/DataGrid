console._debug=true;

//DataGrid实例内部维护控件状态信息以及单页数据（datasource）,model内部维护需要的状态信息并负责和服务器交互，
//控件中的数据根据定义的映射约定和model中的row数据关联
//model和控件之间通过互发消息保持同步

//用于测试的DataGrid实例配置定义
var options={
		//表是否可编辑（grid本质上只只读的展示数据，编辑功能也不过是提供编辑途径，在编辑后刷新显示）
		//在编辑态时会响应一些交互事件，而浏览态时往往不会
		editable:false,	
		showCheckBox:true,	//是否显示checkbox列
		showRowNo:true,		//是否显示行号
		multiSort:true,		//是否支持多列排序，默认true
		//fieldNames:['duration','effortDriven','start','finish','percentComplete','title','number'],//说明字段排序
		frozenField:'duration',	//冻结的列在列序列中的索引好（不考虑行号列和checkbox列）
		mergeState:false,
		/*remote /local，表示数据源直接来源，本地提供行数据还是远程提供行数据，如果是直接远程数据源，
		则必需在pageQuery指定分页查询代理（不提供远程不分页处理,远程不分页数据源，可等数据源到达本地后，把本地的数据作为grid的直接数据源）
		*/
		mode:'remote',
		//第一个元素表示用于请求数据的方法，第二个元素表示查询前用于收集查询参数的方法，每次请求
		pageServer:{'query':pageQuery},
		pageInfo:{
			pageSize:50,
			pageIndex:0
		},
		pagination:true,//是否分页展示\\初始化后不能再修改
		pager:'.pager1',
		//所有列的定义(有序)
		Columns:{
			
			'title':{
				type:'String',
				title:'title',	//表头显示的文本
				visible:true,	//列是否可见
				resizable:true,	//列是否可拖动改变列宽
				textAlign:'left',	//列文本水分方向对齐方式
				headerTextAlign:'center',	//表头文本水平对齐方式，默认居中
				width:120,	//宽度
				sortable:true,	//默认false
				annexable:true,//列数据是否可合并，有时候同列的数据表示的意义不同，列内不支持合并（例如不同币种下的数值，此时合并会破坏数据意义）,默认true。
				cssCls:'',	//列层次的样式定义（通过指定class与css中定义的样式关联）
				colStyle:function(index){},
				onclick:function(){}
			},
			'duration':{
				type:'String',
				sortable:false,
				title:'duration'
			},
			'number':{
				type:'Number',
				title:'number'
			},
			'percentComplete':{
				type:'Number',
				formatter:'PercentFormatter',
				title:'percentComplete'
			},
			'start':{
				type:'Date',
				title:'start'
			},
			'finish':{
				type:'Date',
				title:'finish'
			},
			'effortDriven':{
				type:'Boolean',
				formatter:'CheckboxFormatter',
				title:'effortDriven'
			}	
		},
		
		autoWrap:true,
		//提供grid层次上对行样式控制机制（可根据行序和行数据特征进行样式控制），每次有行改变（grid视图上的改变，包括行移动和行内容改动）时都要重新渲染。
		//约定通过rowStyler设置时只能通过设置class关联样式，且class名带前缀 "rowStyler-"；
		//cellStyler类似 class名带前缀"cellStyler-"
		rowStyler:function(rowNo,record){},//rowNo为行序号，record为行数据记录（json对象）
		cellStyler:function(rowNo,colNo){},
		//Rows:getTestData(10)
	};

//模拟的服务端
function pageQuery(pageInfo,callback){
	var pageSize=pageInfo.pageSize,
		pageIndex=pageInfo.pageIndex;
	var total=1125;
	var datasource=getTestData(total);
	
	var rows=[];
	var end=Math.min(total,(pageIndex+1)*pageSize);
	for(var i=pageSize*pageIndex;i<end;i++){
		rows.push(datasource[i]);
	}
	var data={};
	data.Rows=rows;
	data.totalCount=total;
	data.pageSize=pageSize;
	data.pageIndex=pageIndex;
	
	//处理回调
	if(callback){
		callback({success:data});
	}
}

function getTestData(count){
	var data=[];
	var rowCount=count;
	for (var i = 0; i <rowCount ; i++) {
	  data[i] = {
		title: "Task " + i,
		duration: "5 days",
		percentComplete: Math.round(Math.random() * 100),
		start: "01/01/2009",
		finish: "01/05/2009",
		effortDriven: (i % 5 == 0),
		number:i+1,
		
		title2: "Task " + i,
		duration2: "5 days",
		percentComplete2: Math.round(Math.random() * 100),
		start2: "01/01/2009",
		finish2: "01/05/2009",
		effortDriven2: (i % 5 == 0),
		
		title3: "Task " + i,
		duration3: "5 days",
		percentComplete3: Math.round(Math.random() * 100),
		start3: "01/01/2009",
		finish3: "01/05/2009",
		effortDriven3: (i % 5 == 0),
		
		title4: "Task " + i,
		duration4: "5 days",
		percentComplete4: Math.round(Math.random() * 100),
		start4: "01/01/2009",
		finish4: "01/05/2009",
		effortDriven4: (i % 5 == 0)
	  };
	}
	return data;
}
options.columns={
	ts:{title:"时间戳",ctrlType:"DateTimeBox",alwaysReadOnly:true,visible:false,owner:"somain 订单主表"},
	dr:{title:"删除标记",ctrlType:"CheckBox",alwaysReadOnly:true,visible:false,owner:"somain 订单主表"},
	pk_so_somain:{title:"订单主表pk",length:20,nullable:false,ctrlType:"TextBox",key:true,visible:false,owner:"somain 订单主表"},
	pk_so_somain_b:{title:"订单子表pk",length:0,refKey:"pk_so_sodetails",ctrlType:"DataGrid",visible:false,owner:"somain 订单主表"},
	billno:{title:"单据号",length:50,ctrlType:"TextBox",owner:"somain 订单主表"},
	vtrantypecode:{title:"单据类型编码",length:50,ctrlType:"TextBox",owner:"somain 订单主表"},
	vtrantype:{title:"订单类型",length:20,refKey:"pk_billtypeid",refCode:"pk_billtypecode",refName:"billtypename",ctrlType:"Refer",refId:"4848",refShowMode:"Name",owner:"somain 订单主表"},
	billdate:{title:"单据日期",nullable:false,ctrlType:"TextBox",owner:"somain 订单主表"},
	busitype:{title:"业务流程",length:20,refKey:"pk_busitype",refCode:"busicode",refName:"businame",ctrlType:"Refer",refId:"4849",refShowMode:"Name",owner:"somain 订单主表"},
	pk_group:{title:"集团",length:20,nullable:false,refKey:"pk_group",refCode:"code",refName:"name",ctrlType:"Refer",refId:"600001",refShowMode:"Name",owner:"somain 订单主表"},
	pk_org:{title:"组织",length:20,refKey:"pk_org",refCode:"code",refName:"name",ctrlType:"Refer",refId:"600015",refShowMode:"Name",owner:"somain 订单主表"},
	pk_org_v:{title:"组织版本",length:20,refKey:"pk_vid",refCode:"code",refName:"name",ctrlType:"Refer",refId:"600700",refShowMode:"Name",owner:"somain 订单主表"},
	pk_dept:{title:"部门",length:20,refKey:"pk_dept",refCode:"code",refName:"name",ctrlType:"Refer",refId:"600905",refShowMode:"Name",owner:"somain 订单主表"},
	pk_dept_v:{title:"部门版本",length:20,refKey:"pk_vid",refCode:"code",refName:"name",ctrlType:"Refer",refId:"600949",refShowMode:"Name",owner:"somain 订单主表"},
	billmaker:{title:"制单人",length:20,alwaysReadOnly:true,refKey:"cuserid",refCode:"user_code",refName:"user_name",ctrlType:"Refer",refId:"600026",refShowMode:"Name",owner:"somain 订单主表"},
	approver:{title:"审批人",length:20,alwaysReadOnly:true,refKey:"cuserid",refCode:"user_code",refName:"user_name",ctrlType:"Refer",refId:"600026",refShowMode:"Name",owner:"somain 订单主表"},
	approvestatus:{title:"单据状态",length:50,ctrlType:"TextBox",enumType:"uap.BillstatusEnum",owner:"somain 订单主表"},
	approvedate:{title:"审批时间",alwaysReadOnly:true,ctrlType:"DateTimeBox",owner:"somain 订单主表"},
	creator:{title:"创建人",length:20,alwaysReadOnly:true,refKey:"cuserid",refCode:"user_code",refName:"user_name",ctrlType:"Refer",refId:"600026",refShowMode:"Name",owner:"somain 订单主表"},
	creationtime:{title:"制单时间",alwaysReadOnly:true,ctrlType:"DateTimeBox",owner:"somain 订单主表"},
	modifier:{title:"修改人",length:20,alwaysReadOnly:true,refKey:"cuserid",refCode:"user_code",refName:"user_name",ctrlType:"Refer",refId:"600026",refShowMode:"Name",owner:"somain 订单主表"},
	modifiedtime:{title:"修改时间",alwaysReadOnly:true,ctrlType:"DateTimeBox",owner:"somain 订单主表"},
	billcloser:{title:"关闭人",length:20,refKey:"cuserid",refCode:"user_code",refName:"user_name",ctrlType:"Refer",refId:"600026",refShowMode:"Name",owner:"somain 订单主表"},
	billclosetime:{title:"关闭自然时间",ctrlType:"DateTimeBox",owner:"somain 订单主表"},
	lastprintor:{title:"最近打印人",length:20,refKey:"cuserid",refCode:"user_code",refName:"user_name",ctrlType:"Refer",refId:"600026",refShowMode:"Name",owner:"somain 订单主表"},
	lastprinttime:{title:"最近打印时间",ctrlType:"DateTimeBox",owner:"somain 订单主表"},
	ccuscode:{title:"客户编码",length:20,refKey:"ccuscode_pk",refCode:"code",refName:"name",ctrlType:"Refer",refId:"customer",refShowMode:"Code",refRelation:"ccusname=name,ccusabbname=ccusabbname,cvconperson=ccusperson,cvshipaddress=ccusoaddress,cpersoncode=ccuspperson,cperson=ccuspperson.name",owner:"somain 订单主表"},
	ccusname:{title:"客户全称",length:50,ctrlType:"TextBox",owner:"somain 订单主表"},
	ccusabbname:{title:"客户简称",length:50,ctrlType:"TextBox",owner:"somain 订单主表"},
	cvconperson:{title:"客户联系人",length:50,ctrlType:"TextBox",owner:"somain 订单主表"},
	cvshipaddress:{title:"联系地址",length:50,ctrlType:"TextBox",owner:"somain 订单主表"},
	cpersoncode:{title:"业务员编码",length:20,refKey:"person_pk",refCode:"code",refName:"name",ctrlType:"Refer",refId:"person",refShowMode:"Code",refRelation:"cperson=name",owner:"somain 订单主表"},
	cperson:{title:"业务员",length:50,ctrlType:"TextBox",owner:"somain 订单主表"},
	cexch_name:{title:"币种",length:20,refKey:"id",refCode:"code",refName:"name",ctrlType:"Refer",refId:"foreigncurrency",refShowMode:"Name",owner:"somain 订单主表"},
	iexchrate:{title:"汇率",minValue:"-100000000000000000000.00000000",maxValue:"100000000000000000000.00000000",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	btax:{title:"报价是否含税",length:1,defaultValue:"false",ctrlType:"CheckBox",owner:"somain 订单主表"},
	itaxrate:{title:"税率",length:50,ctrlType:"TextBox",owner:"somain 订单主表"},
	cmemo:{title:"备注",length:50,ctrlType:"TextBox",owner:"somain 订单主表"},
	idispstate:{title:"发货状态",length:50,ctrlType:"ComboBox",enumType:"u8.idispstateEnum",owner:"somain 订单主表",dataSource:[{text:"未发货",value:"0"},{text:"部分发货",value:"1"},{text:"发货完毕",value:"2"}]},
	ioutstate:{title:"出库状态",length:50,ctrlType:"ComboBox",enumType:"u8.ioutstateEnum",owner:"somain 订单主表",dataSource:[{text:"未出库",value:"0"},{text:"部分出库",value:"1"},{text:"出库完毕",value:"2"}]},
	ddispdate:{title:"表头预发货日期",ctrlType:"DateTimeBox",owner:"somain 订单主表"},
	def1:{title:"自定义项1",length:101,ctrlType:"TextBox",visible:false,owner:"somain 订单主表"},
	def2:{title:"自定义项2",length:101,ctrlType:"TextBox",visible:false,owner:"somain 订单主表"},
	def3:{title:"自定义项3",length:101,ctrlType:"TextBox",visible:false,owner:"somain 订单主表"},
	def4:{title:"自定义项4",length:101,ctrlType:"TextBox",visible:false,owner:"somain 订单主表"},
	def5:{title:"自定义项5",length:101,ctrlType:"TextBox",visible:false,owner:"somain 订单主表"},
	pk_so_somain_b_ts:{title:"时间戳",ctrlType:"DateTimeBox",alwaysReadOnly:true,visible:false,owner:"somain 订单主表"},
	pk_so_somain_b_dr:{title:"删除标记",ctrlType:"CheckBox",alwaysReadOnly:true,owner:"somain 订单主表"},
	pk_so_somain_b_pk_so_sodetails:{title:"订单表体pk",length:20,nullable:false,ctrlType:"TextBox",key:true,visible:false,owner:"somain 订单主表"},
	pk_so_somain_b_crowno:{title:"行号",length:50,ctrlType:"TextBox",owner:"somain 订单主表"},
	pk_so_somain_b_pk_group:{title:"集团",length:20,refKey:"pk_group",refCode:"code",refName:"name",ctrlType:"Refer",refId:"600001",refShowMode:"Code",owner:"somain 订单主表"},
	pk_so_somain_b_pk_org:{title:"组织",length:20,refKey:"pk_org",refCode:"code",refName:"name",ctrlType:"Refer",refId:"600015",refShowMode:"Code",owner:"somain 订单主表"},
	pk_so_somain_b_cinvcode:{title:"存货编码",length:20,refKey:"pk_inventory",refCode:"code",refName:"name",ctrlType:"Refer",refId:"inventory",refShowMode:"Code",refRelation:"cinvname=name",owner:"somain 订单主表"},
	pk_so_somain_b_cinvname:{title:"存货名称",length:50,ctrlType:"TextBox",owner:"somain 订单主表"},
	pk_so_somain_b_iquantity:{title:"数量",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_inum:{title:"件数",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_cunitcode:{title:"辅助计量单位编码",length:20,refKey:"id",refCode:"code",refName:"name",ctrlType:"Refer",refId:"Computation",refShowMode:"Code",owner:"somain 订单主表"},
	pk_so_somain_b_iinvexchrate:{title:"换算率",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_iquounitprice:{title:"报价",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_brtax:{title:"报价行是否含税",length:1,ctrlType:"CheckBox",owner:"somain 订单主表"},
	pk_so_somain_b_iunitprice:{title:"无税单价",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_itaxunitprice:{title:"含税单价",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_imoney:{title:"无税金额",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_itax:{title:"税金",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_isum:{title:"价税合计",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_idiscountrate:{title:"扣率",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_idiscount:{title:"折扣",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_inatunitprice:{title:"无税本币单价",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_inattaxunitprice:{title:"含税本币单价",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_inatmoney:{title:"无税本币金额",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_inattax:{title:"本币税金",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_inatsum:{title:"本币价税合计",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_inatdiscount:{title:"本币折扣",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_drowplandispdate:{title:"计划发货日期",ctrlType:"DateTimeBox",owner:"somain 订单主表"},
	pk_so_somain_b_idispqty:{title:"累计发货数量",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_ioutqty:{title:"累计出库数量",scale:8,ctrlType:"NumberBox",precision:28,owner:"somain 订单主表"},
	pk_so_somain_b_dmindispdate:{title:"最早发货日期",ctrlType:"DateTimeBox",owner:"somain 订单主表"},
	pk_so_somain_b_dminoutdate:{title:"最早出库日期",ctrlType:"DateTimeBox",owner:"somain 订单主表"},
	pk_so_somain_b_def1:{title:"自定义项1",length:101,ctrlType:"TextBox",visible:false,owner:"somain 订单主表"},
	pk_so_somain_b_def2:{title:"自定义项2",length:101,ctrlType:"TextBox",visible:false,owner:"somain 订单主表"},
	pk_so_somain_b_def3:{title:"自定义项3",length:101,ctrlType:"TextBox",visible:false,owner:"somain 订单主表"},
	pk_so_somain_b_def4:{title:"自定义项4",length:101,ctrlType:"TextBox",visible:false,owner:"somain 订单主表"},
	pk_so_somain_b_def5:{title:"自定义项5",length:101,ctrlType:"TextBox",visible:false,owner:"somain 订单主表"}
};
