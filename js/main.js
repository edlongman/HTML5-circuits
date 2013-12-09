//One object to rule them all
(function(window, undefined) {
	$(".linescontainer").svg()
	Board={};
	Board.components=[];
	
	//holds positions of components
	Board.circuit=function(components){
		this.parts=[];
		if(typeof(components)=="object"&&components.toString!="[object Object]"){
			for(var i=0;i<components.length;i++){
				this.parts[i]=components[i];
			}
		}
		return this;
	};
	Board.circuit.prototype.addComponent=function(component){
		this.parts.push(component);
	};
	Board.circuit.prototype.addConnector=function(from,to){
		//check from and to
		if(from.type==to.type){
			//can't draw that line
			return false;
		}
		from.connect(to);
	};
	//doesn't let the value go below minimum
	function minimum(min,arg){
		return (min<arg)?arg:min;
	}
	Board.circuit.prototype.Draw=function(domElement){
		var components=$(domElement).find("div");
		var lines=$(".linescontainer").svg("get");
		components.html("");
		for(var i=0;i<this.parts.length;i++){
			this.parts[i].Draw(components,lines);
		}
	};
	componentProperties={
		symbol:"path/to/img.png",
		name:"name",
		components:new Board.circuit(),
		numberOfInputs:2,
		numberOfOutputs:1,
		x:0,
		y:0,
		output:function(){
			
		}
	}
	Board.component=function(){}
	Board.component=function(properties){
		var propertyKeys=Object.keys(componentProperties);
		for(var i=0;i<propertyKeys.length;i++){
			this[propertyKeys[i]]=componentProperties[propertyKeys[i]];
			if(typeof(properties[propertyKeys[i]])==typeof(this[propertyKeys[i]])){
				this[propertyKeys[i]]=properties[propertyKeys[i]];
			}
			else{
				this[propertyKeys[i]]=componentProperties[propertyKeys[i]];
			}
		}
		this.inputs=[];
		for(var i=0;i<this.numberOfInputs;i++){
			this.inputs.push(new Board.input(this));
		}
		this.outputs=[];
		for(var i=0;i<this.numberOfOutputs;i++){
			this.outputs.push(new Board.output(this));
		}
		return this;
	}
	Board.component.prototype.Draw=function(boxes,lines){
		this.dom=$("<div/>").addClass("component").css({
			"left":this.x,
			"top":this.y
		});
		boxes.append(this.dom);
		for(var i=0;i<this.inputs.length;i++){
			this.inputs[i].Draw(lines,this.dom);
		}};
	
	//output port of component
	Board.output=function(parent){
		this.parent=parent;
		this.length=0;
		return this;
	}
	Board.output.prototype.connect=function(to){
		to.connect(this);
		this[this.length]=to;
		this.length++;
	}
	
	//input port of component
	Board.input=function(parent){
		this.parent=parent;
		return this;
	}
	Board.input.prototype.connect=function(from){
		this.pair=from;
	}
	Board.input.prototype.Draw=function(lines,componentDom){
		if(this.pair!=undefined&&this.pair.parent!=undefined){
			//draw line from this to other component
			var fromX=this.pair.parent.x,
				fromY=this.pair.parent.y,
				toX=this.parent.x,
				toY=this.parent.y;
			var control1=fromX+minimum(40,Math.floor((toX-fromX)/3));
			var control2=toX-minimum(40,Math.floor((toX-fromX)/3));
			var lineArg="M"+fromX+","+fromY+" C"+control1+","+fromY+" ";
				lineArg+=control2+","+toY+" "+toX+","+toY;
			var line=lines.createPath();
			line.move(fromX,fromY);
			line.curveC(control1,fromY,control2,toY,toX,toY);
			lines.path(line,{fill:"none",stroke:"black",strokeWidth:5});
		}
	}
	
	//define basic gates
	//
	Board.components.push(new Board.component({
		name:"not",
		numberOfInputs:1,
		output:function(input){
			return !input;
		}
	}));
	Board.components.push(new Board.component({
		name:"and",
		numberOfInputs:2,
		output:function(input,input2){
			if(input&&input2)return true;
			return false;
		}
	}));
	Board.components.push(new Board.component({
		name:"or",
		numberOfInputs:2,
		output:function(input,input2){
			if(input|input2)return true;
			return false;
		}
	}));
	
	
	
	
	var testCircuit=new Board.circuit();
	var test1=new Board.component({
			name:"test1",
			x:30,
			y:50
		}),
		test2=new Board.component({
			name:"test2",
			x:300,
			y:250
		}),
		test3=new Board.component({
			name:"test3",
			x:250,
			y:400
		});
	testCircuit.addComponent(test1);
	testCircuit.addComponent(test2);
	testCircuit.addComponent(test3);
	test1.outputs[0].connect(test2.inputs[0]);
	test2.outputs[0].connect(test3.inputs[0]);
	testCircuit.Draw($(".board")[0]);
	
})(window);