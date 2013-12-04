//One object to rule them all
(function(window, undefined) {
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
		var lines=$(domElement).find("svg");
		var svgns=lines[0].xmlns;
		components.html("");
		lines.html("");
		for(var i=0;i<this.parts.length;i++){
			var componentObj=this.parts[i];
			component=$("<div/>").addClass("component").css({
				"left":componentObj.x,
				"top":componentObj.y
			});
			components.append(component);
			for(var ii=0;ii<componentObj.inputs.length;ii++){
				if(componentObj.inputs[ii].pair!=undefined&&componentObj.inputs[ii].pair.parent!=undefined){
					//draw line from this to other component
					var fromX=componentObj.inputs[ii].pair.parent.x,
						fromY=componentObj.inputs[ii].pair.parent.y,
						toX=componentObj.x,
						toY=componentObj.y;
					var control1=fromX+minimum(40,Math.floor((toX-fromX)/3));
					var control2=toX-minimum(40,Math.floor((toX-fromX)/3));
					var lineArg="M"+fromX+","+fromY+" C"+control1+","+fromY+" ";
						lineArg+=control2+","+toY+" "+toX+","+toY;
					//this basically adds a line but jQuery doesn't work well with SVG so is a bit of a hack
					//http://stackoverflow.com/questions/6698480/
					line=document.createElementNS(svgns,"path");
					line.setAttributeNS(null,"class","connector");
					line.setAttributeNS(null,"d",lineArg);
					lines[0].appendChild(line);
				}
			}
		}
		//this hack is to fix the fact that for some reason unbeknown to me currently it wouldn't show
		lines[0].innerHTML=lines.html();
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
	Board.component.prototype.Draw=function(){};
	
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
			x:200,
			y:50
		}),
		test3=new Board.component({
			name:"test3",
			x:250,
			y:80
		});
	testCircuit.addComponent(test1);
	testCircuit.addComponent(test2);
	testCircuit.addComponent(test3);
	test1.outputs[0].connect(test2.inputs[0]);
	test2.outputs[0].connect(test3.inputs[0]);
	testCircuit.Draw($(".board")[0]);
	
})(window);