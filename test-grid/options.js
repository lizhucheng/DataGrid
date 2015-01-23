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
		fieldNames:['duration','effortDriven','start','finish','percentComplete','title','number'],//说明字段排序
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
				cssCls:'',	//列层次的样式定义（通过指定class与css中定义的样式关联）
				colStyle:function(index){},
				onclick:function(){}
			},
			'duration':{
				type:'Number',
				sortable:false,
				title:'duration'
			},
			'number':{
				type:'Number',
				title:'number'
			},
			'percentComplete':{
				type:'Number',
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

