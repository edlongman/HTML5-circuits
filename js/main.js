//One object to rule them all
(function(window, undefined) {
	Board={};
	Board.components=[];
	
	//holds positions of components
	Board.circuit=function(components){
		if(typeof(components)=="object"&&components.toString!="[object Object]"){
			for(var i=0;i<components.length;i++){
				this[i]=components[i];
			}
		}
		
		return [];
	};
	Board.circuit.prototype.addComponent=function(component){
		this.push(component);
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
		components.html("");
		lines.html("");
		for(var i;i<this.length;i++){
			component=$("<div/>").addClass("component").css({
				"left":this[i].x,
				"top":this[i].y
			});
			components.append(component);
			for(var ii=0;ii<this[i].inputs.length;ii++){
				//draw line from this to other component
				var fromX=inputs[i].parent.x,
					fromY=inputs[i].parent.y,
					toX=this.x,
					toY=this.y;
				var control1=fromX+minimum(40,floor((fromY-fromX)/3));
				var control2=toX-minimum(40,floor((fromY-fromX)/3));
				var lineArg="M"+fromX+","+fromY+" C"+control1+","+fromY+" ";
					lineArg+=control2+","+toY+" "+toX+","+toY;
				line=$("<line class='connector' d='"+lineArg+"'>");
				lines.append(line);
			}
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
		var returnProperties=componentProperties;
		var propertyKeys=Object.keys(returnProperties);
		for(var i=0;i<propertyKeys;i++){
			if(typeof(properties[propertyKeys[i]])==typeof(returnProperties[propertyKeys[i]])){
				returnProperties[propertyKeys[i]]=properties[propertyKeys[i]];
			}
		}
		returnProperties.inputs=[];
		for(var i=0;i<returnProperties.numberOfInputs;i++){
			returnProperties.inputs.push(new Board.input(this));
		}
		returnProperties.outputs=[];
		for(var i=0;i<returnProperties.numberOfOutputs;i++){
			returnProperties.outputs.push(new Board.output(this));
		}
		return returnProperties;
	}
	Board.component.prototype.Draw=function(){};
	
	//output port of component
	Board.output=function(parent){
		this.parent=parent;
		return [];
	}
	Board.output.prototype.connect=function(to){
		to.connect(this);
		this.push(to);
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
})(window);