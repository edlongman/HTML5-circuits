//One object to rule them all
(function(window, undefined) {
	Board={};
	Board.components=[];
	
	//holds positions of components
	Board.circuit=function(domElement,components){
		this.domElement=domElement;
		if(typeof(components)=="object"&&components.toString!="object Object"){
			for(var i=0;i<components.length;i++){
				this[i]=components[i];
			}
		}
		
		return this;
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
		returnProperties.inputs=[];
		for(var i=0;i<returnProperties.numberOfInputs;i++){
			returnProperties.inputs.push(new Board.input());
		}
		returnProperties.outputs=[];
		for(var i=0;i<returnProperties.numberOfOutputs;i++){
			returnProperties.outputs.push(new Board.output());
		}
		return returnProperties;
	}
	Board.component.prototype.Draw=function(){};
	
	//output port of component
	Board.output=function(){
		return {};
	}
	Board.output.prototype.connect=function(to){
		to.connect(this);
		this.push(to);
	}
	
	//input port of component
	Board.input=function(){
		return this;
	}
	Board.input.prototype.connect=function(from){
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