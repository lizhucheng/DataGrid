console._debug=true;

//DataGridʵ���ڲ�ά���ؼ�״̬��Ϣ�Լ���ҳ���ݣ�datasource��,model�ڲ�ά����Ҫ��״̬��Ϣ������ͷ�����������
//�ؼ��е����ݸ��ݶ����ӳ��Լ����model�е�row���ݹ���
//model�Ϳؼ�֮��ͨ��������Ϣ����ͬ��

//���ڲ��Ե�DataGridʵ�����ö���
var options={
		//���Ƿ�ɱ༭��grid������ֻֻ����չʾ���ݣ��༭����Ҳ�������ṩ�༭;�����ڱ༭��ˢ����ʾ��
		//�ڱ༭̬ʱ����ӦһЩ�����¼��������̬ʱ��������
		editable:fasle,	
		showCheckBox:true,	//�Ƿ���ʾcheckbox��
		showRowNo:true,		//�Ƿ���ʾ�к�
		//�����еĶ���
		fieldNms:['title','duration','percentComplete','start','finish','effortDriven'],//˵�������ֶε���ʾ˳��
		fields:{
			//�ж���
			'title':{
				title:'title',	//��ͷ��ʾ���ı�
				visible:true,	//���Ƿ�ɼ�
				resizable:true,	//���Ƿ���϶��ı��п�
				textAlign:TextAlign.LEFT,	//���ı�ˮ�ַ�����뷽ʽ
				headerTextAlign:TextAlign.CENTER,	//��ͷ�ı�ˮƽ���뷽ʽ��Ĭ�Ͼ���
				width:120,	//���
				cssCls:'',	//�в�ε���ʽ���壨ͨ��ָ��class��css�ж������ʽ������
				colStyle:function(index){},
				onclick:function(){}
			},
			'duration':{
				title:'duration'
			},
			'percentComplete':{
				title:'percentComplete'
			},
			'start':{
				title:'start'
			},
			'finish':{
				title:'finish'
			},
			'effortDriven':{
				title:'effortDriven'
			}
		},
		frozenIndex:0,	//����������������е������ã��������к��к�checkbox�У�
		
		//�ṩgrid����϶�����ʽ���ƻ��ƣ��ɸ������������������������ʽ���ƣ���ÿ�����иı䣨grid��ͼ�ϵĸı䣬�������ƶ��������ݸĶ���ʱ��Ҫ������Ⱦ��
		//Լ��ͨ��rowStyler����ʱֻ��ͨ������class������ʽ����class����ǰ׺ "rowStyler-"��
		//cellStyler���� class����ǰ׺"cellStyler-"
		rowStyler:function(rowNo,record){},//rowNoΪ����ţ�recordΪ�����ݼ�¼��json����
		cellStyler:function(rowNo,colNo){},
	};

var data=[];
var rowCount=500;
for (var i = 0; i <rowCount ; i++) {
  data[i] = {
	title: "Task " + i,
	duration: "5 days",
	percentComplete: Math.round(Math.random() * 100),
	start: "01/01/2009",
	finish: "01/05/2009",
	effortDriven: (i % 5 == 0),
	
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