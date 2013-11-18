//One object to rule them all
(function(window, undefined) {
	Board={};
	Board.component=function(){}
	Board.components={};
	Board.circuit={};//holds positions of components
	Board.circuit.prototype.Draw=function(){};
	componentProperties={
		symbol:"path/to/img.png",
		name:"name",
		components:new circuit(),
		output:function(){
			
		}
	}
	Board.component=function(properties){
		var returnProperties=componentProperties;
		var propertyKeys=Object.keys(returnProperties);
		for(var i=0;i<propertyKeys;i++){
			if(typeof(properties[propertyKeys[i]])==typeof(returnProperties[propertyKeys[i]])){
				returnProperties[propertyKeys[i]]=properties[propertyKeys[i]];
			}
		}
		return new returnProperties;
	}
	Board.component.prototype.Draw=function(){};
	
	//define basic gates
	//
	Board.componenents.push_back(new Board.component({
		name:"not",
		output:function(input){
			return !input;
		}
	}));
	Board.componenents.push_back(new Board.component({
		name:"and",
		output:function(input,input2){
			if(input&&input2)return true;
			return false;
		}
	}));
	Board.componenents.push_back(new Board.component({
		name:"or",
		output:function(input,input2){
			if(input|input2)return true;
			return false;
		}
	}));
})(window);