//One object to rule them all
(function(window, undefined) {
	Board={};
	Board.components=[];
	
	//holds positions of components
	Board.circuit=function(){
		return {};
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
	Board.circuit.prototype.Draw=function(){
		
	};
	componentProperties={
		symbol:"path/to/img.png",
		name:"name",
		components:new Board.circuit(),
		numberOfInputs:2,
		numberOfOutputs:1,
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
		returnProperties.inputs={};
		for(var i=0;i<returnProperties.numberOfInputs;i++){
			returnProperties.push(new Board.input());
		}
		returnProperties.outputs={};
		for(var i=0;i<returnProperties.numberOfOutputs;i++){
			returnProperties.push(new Board.output());
		}
		return returnProperties;
	}
	Board.component.prototype.Draw=function(){};
	Board.output=function(){
		return {};
	}
	Board.output.prototype.connect(to){
		to.connect(this);
		this.push(to);
	}
	Board.input=function(){
		return this;
	}
	Board.input.prototype.connect(from){
		this=from;
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