//One object to rule them all
(function(window, undefined) {
	$(".linescontainer").svg()
	Board={};
	Board.components=[];
	Board.components.get=function(name){
		for(var i=0;i<Board.components.length;i++){
			if(Board.components[i].name==name){
				return new Board.component(Board.components[i]);
			}
		}
	}
	Board.components.Draw=function(circuit){
		var componentsBox=$(document.body).find(".components");
		componentsBox.html("");
		for(var i=0;i<Board.components.length;i++){
			var basicItem=$("<div/>").addClass("componentItem").data("componentName",Board.components[i].name),
				componentIcon=$("<div/>")
					.addClass("componentIcon").css("backgroundImage","url("+Board.components[i].symbol+")"),
				componentName=$("<div/>").addClass("componentName").text(Board.components[i].name),
				componentDragPoint=$("<div/>").addClass("componentDragPoint").mousedown(circuit,function(e){
						var obj=e.data;
						var componentToAdd=Board.components.get($(this).parent().data("componentName"));
						obj.addComponent(componentToAdd);
						obj.Update();
						var boxesOffset=obj.componentsDom.offset();
						componentToAdd.x=e.pageX-boxesOffset.left-0.5*componentToAdd.dom.width();
						componentToAdd.y=e.pageY-boxesOffset.top-0.5*componentToAdd.dom.height();
						componentToAdd.Update();
						componentToAdd.dom.trigger(e);
					});
			basicItem.append(componentIcon,componentName,componentDragPoint);
			componentsBox.append(basicItem);
		}
	}
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
		component.parent=this;
	};
	Board.circuit.prototype.removeComponent=function(component){
		if(this.parts.indexOf(component)!==-1){
			this.parts.parent=undefined;
			this.parts.remove(this.parts.indexOf(component));
		}
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
		this.drawIteration++
		var components=$(domElement).find("div");
		this.componentsDom=components;
		var lines=$(".linescontainer").svg("get");
		this.lines=lines;
		components.html("");
		for(var i=0;i<this.parts.length;i++){
			this.parts[i].Draw(components,lines,this.drawIteration);
		}
		Board.components.Draw(this);
	};
	Board.circuit.prototype.drawIteration=0;
	Board.circuit.prototype.Update=function(){
		this.drawIteration++
		for(var i=0;i<this.parts.length;i++){
			if(this.parts[i].dom==undefined){
				this.parts[i].Draw(this.componentsDom,this.lines,this.drawIteration)
			}
			else{
				this.parts[i].Update(this.drawIteration);
			}
		}
		Board.components.Draw(this);
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
		var propertyKeys=Object.keys(properties);
		for(var i=0;i<propertyKeys.length;i++){
			this[propertyKeys[i]]=properties[propertyKeys[i]];
		}
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
		this.inputs.Draw=function(lines,componentDom,drawNo){
			if(this.lastDraw==drawNo)return;
			this.lastDraw=drawNo;
			//draw node
			var connectionNodes=$("<div/>").addClass("inputNodes");
			componentDom.append(connectionNodes);
			for(var i=0;i<this.length;i++){
				this[i].Draw(lines,componentDom,connectionNodes,drawNo);
			}
		}
		this.inputs.Update=function(lastDraw){
			for(var i=0;i<this.length;i++){
				this[i].Update(lastDraw);
			}
		}
		this.outputs=[];
		for(var i=0;i<this.numberOfOutputs;i++){
			this.outputs.push(new Board.output(this));
		}
		this.outputs.Draw=function(lines,componentDom,drawNo){
			//draw node
			var connectionNodes=$("<div/>").addClass("outputNodes");
			componentDom.append(connectionNodes);
			for(var i=0;i<this.length;i++){
				this[i].Draw(lines,componentDom,connectionNodes,drawNo);
			}
		}
		this.outputs.Update=function(lastDraw){
			for(var i=0;i<this.length;i++){
				this[i].Update(lastDraw);
			}
		}
		return this;
	}
	Board.component.prototype.Draw=function(boxes,lines,drawNo){
		if(this.lastDraw==drawNo)return;
		this.lastDraw=drawNo;
		this.dom=$("<div/>").addClass("component").css({
			"left":this.x,
			"top":this.y
		});
		boxes.append(this.dom);
		this.dom.mousedown(this,function(e){
			var obj=e.data;
			boxesOffset=obj.parent.componentsDom.offset();
			obj.clickOffsetX=e.pageX-boxesOffset.left-obj.x;
			obj.clickOffsetY=e.pageY-boxesOffset.top-obj.y;
			obj.parent.componentsDom.parent().mousemove(obj,function(e) {
				var obj=e.data;
				boxesOffset=obj.parent.componentsDom.offset();
				obj.x=e.pageX-obj.clickOffsetX-boxesOffset.left;
				obj.y=e.pageY-obj.clickOffsetY-boxesOffset.top;
				obj.Update();
			});
		});
		this.parent.componentsDom.parent().mouseup(this,function(e){
			var obj=e.data;
			$(this).unbind("mousemove");
			obj.clickOffsetX=undefined;
			obj.clickOffsetY=undefined;
		});
		this.dom.dblclick(this,function(e){
			var obj=e.data;
			obj.dom.append($("<div/>").addClass("deleteComponent").click(obj,function(){
				obj.Destroy();
			}))
		});
		this.inputs.Draw(lines,this.dom,drawNo);
		this.outputs.Draw(lines,this.dom,drawNo);
		this.dom.append($("<div/>").addClass("componentName").text(this.name));
		if(this.postDraw!=undefined)this.postDraw();
	};
	Board.component.prototype.lastDraw=0;
	Board.component.prototype.Update=function(lastDraw){
		if(lastDraw!=undefined&&this.lastDraw==lastDraw)return;
		if(lastDraw==undefined||this.parent.drawIteration!=lastDraw)this.parent.drawIteration++;
		this.lastDraw=this.parent.drawIteration;
		this.dom.css({
			"left":this.x,
			"top":this.y
		})
		this.inputs.Update(this.lastDraw);
		this.outputs.Update(this.lastDraw);
		if(this.postUpdate!=undefined)this.postUpdate();
	};
	Board.component.prototype.Destroy=function(){
		for(var i=0;i<this.inputs.length;i++){
			if(this.inputs[i].pair!=undefined){
				this.inputs[i].pair.Destroy(this.inputs[i]);
			}
		}
		for(var i=0;i<this.outputs.length;i++){
			if(this.outputs[i].length>0){
				for(var ii=0;ii<this.outputs[i].length;ii++){
					this.outputs[i].Destroy(this.outputs[i][ii]);
				}
			}
		}
		this.parent.removeComponent(this);
		this.dom.remove();
		this.dom=undefined;
	}
	
	Board.pointer={};
	Board.pointer.connect=function(from){
		if(from.pair!=undefined){
			if(from.__proto__==Board.input.prototype){
				from.pair.Destroy(from);
			}
			else{
				from.Destroy(from);
			}
		}
		Board.pointer.pair=from;
		if(Board.pointer.pair.__proto__==Board.input.prototype){
			from.connect(Board.pointer);
		}
	}
	Board.pointer.x=function(e,componentsDom){
		var boxesOffset=componentsDom.offset();
		return e.pageX-boxesOffset.left;
	}
	Board.pointer.y=function(e,componentsDom){
		var boxesOffset=componentsDom.offset();
		return e.pageY-boxesOffset.top;
	}
	Board.pointer.Draw=function(e){
		var lines=Board.pointer.pair.parent.parent.lines,
			componentsDom=Board.pointer.pair.parent.parent.componentsDom,
			drawNo=(Board.pointer.pair.parent.parent.drawIteration++);
		//draw connection
		if(Board.pointer.pair.__proto__==Board.output.prototype){
			//draw line from this to other component
			var fromX=Board.pointer.pair.x(),
				fromY=Board.pointer.pair.y(),
				toX=Board.pointer.x(e,componentsDom),
				toY=Board.pointer.y(e,componentsDom);
			var control1=fromX+minimum(150,Math.floor((toX-fromX)/3));
			var control2=toX-minimum(150,Math.floor((toX-fromX)/3));
			var lineArg="M"+fromX+","+fromY+" C"+control1+","+fromY+" ";
				lineArg+=control2+","+toY+" "+toX+","+toY;
			var line=lines.createPath();
			line.move(fromX,fromY);
			line.curveC(control1,fromY,control2,toY,toX,toY);
			Board.pointer.dom=lines.path(line,{fill:"none",stroke:"black",strokeWidth:5});
		}
		else{
			//draw line from this to other component
			var fromX=Board.pointer.x(e,componentsDom),
				fromY=Board.pointer.y(e,componentsDom),
				toX=Board.pointer.pair.x(),
				toY=Board.pointer.pair.y();
			var control1=fromX+minimum(150,Math.floor((toX-fromX)/3));
			var control2=toX-minimum(150,Math.floor((toX-fromX)/3));
			var lineArg="M"+fromX+","+fromY+" C"+control1+","+fromY+" ";
				lineArg+=control2+","+toY+" "+toX+","+toY;
			var line=lines.createPath();
			line.move(fromX,fromY);
			line.curveC(control1,fromY,control2,toY,toX,toY);
			Board.pointer.pair.dom=lines.path(line,{fill:"none",stroke:"black",strokeWidth:5});
		}
		componentsDom.parent().mouseup(componentsDom,Board.pointer.catchMouseUp);
	}
	Board.pointer.catchMouseUp=function(e) {
		Board.pointer.Destroy();
		$(this).unbind("mouseup",e.handleObj.handler);
	}
	Board.pointer.Update=function(e){
		var lines=Board.pointer.pair.parent.parent.lines,
			componentsDom=Board.pointer.pair.parent.parent.componentsDom,
			drawNo=(Board.pointer.pair.parent.parent.drawIteration++);
		//draw connection
		if(Board.pointer.pair.__proto__==Board.output.prototype){
			//draw line from this to other component
			var fromX=Board.pointer.pair.x(),
				fromY=Board.pointer.pair.y(),
				toX=Board.pointer.x(e,componentsDom),
				toY=Board.pointer.y(e,componentsDom);
			var control1=fromX+minimum(150,Math.floor((toX-fromX)/3));
			var control2=toX-minimum(150,Math.floor((toX-fromX)/3));
			var lineArg="M"+fromX+","+fromY+" C"+control1+","+fromY+" ";
				lineArg+=control2+","+toY+" "+toX+","+toY;
			var line=lines.createPath();
			line.move(fromX,fromY);
			line.curveC(control1,fromY,control2,toY,toX,toY);
			Board.pointer.dom.setAttribute("d",line._path);
		}
		else{
			//draw line from this to other component
			var fromX=Board.pointer.x(e,componentsDom),
				fromY=Board.pointer.y(e,componentsDom),
				toX=Board.pointer.pair.x(),
				toY=Board.pointer.pair.y();
			var control1=fromX+minimum(150,Math.floor((toX-fromX)/3));
			var control2=toX-minimum(150,Math.floor((toX-fromX)/3));
			var lineArg="M"+fromX+","+fromY+" C"+control1+","+fromY+" ";
				lineArg+=control2+","+toY+" "+toX+","+toY;
			var line=lines.createPath();
			line.move(fromX,fromY);
			line.curveC(control1,fromY,control2,toY,toX,toY);
			Board.pointer.pair.dom.setAttribute("d",line._path);
		}
	}
	Board.pointer.Destroy=function(){
		if(Board.pointer.pair.__proto__==Board.output.prototype){
			Board.pointer.dom.remove();
			for(var i=0;i<Board.pointer.pair.length;i++){
				if(Board.pointer.pair[i]==Board.pointer){
					Board.pointer.pair[i]=undefined;
				}
			}
			for(var i=0;i<Board.pointer.pair.length;i++){
				if(Board.pointer.pair[i]==undefined){
					Board.pointer.pair[i]=Board.pointer.pair[i+1];
					Board.pointer.pair[i+1]=undefined;
				}
			}
			Board.pointer.pair.length--;
			
		}
		else{
			Board.pointer.pair.dom.remove();
			Board.pointer.pair.pair=undefined;
			Board.pointer.pair=undefined;
		}
	}
	
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
	Board.output.prototype.x=function(){
		return this.parent.x+100;
	}
	Board.output.prototype.y=function(){
		var outputNo=this.parent.outputs.indexOf(this);
		return this.parent.y+20+outputNo*30;
	}
	Board.output.prototype.Draw=function(lines,componentDom,outputsDom,drawNo){
		//draw node
		var connectionNode=$("<div/>").addClass("outputNode");
		outputsDom.append(connectionNode);
		connectionNode.mousedown(this,function(e){
			obj=e.data;
			e.stopPropagation();
			obj.connect(Board.pointer);
			Board.pointer.Draw(e);
			obj.parent.parent.componentsDom.parent().mousemove(this,function(e){
				obj=e.data;
				e.stopPropagation();
				Board.pointer.Update(e);
			});
			componentDom.mouseup(function(){
				$(this).unbind("mousemove");
				$(this).unbind("mouseup",e.handleObj.handler);
			});
		});
		connectionNode.mouseup(this,function(e){
			var obj=e.data;
			if(Board.pointer.pair.__proto__==Board.input.prototype){
				e.stopPropagation();
				obj.connect(Board.pointer.pair);
				obj[obj.length-1].DrawLine(obj.parent.parent.lines);
				obj.parent.parent.componentsDom.parent().unbind("mousemove");
				obj.parent.parent.componentsDom.parent().unbind("mouseup",Board.pointer.catchMouseUp);
			}
		})
	}
	Board.output.prototype.Update=function(lastDraw){
		for(var i=0;i<this.length;i++){
			this[i].Update(lastDraw);
		}
	}
	Board.output.prototype.Destroy=function(pair){
		for(var i=0;i<this.length;i++){
			if(this[i]==pair){
				this[i].Destroy();
				this[i]=undefined;
			}
		}
		for(var i=0;i<this.length;i++){
			if(this[i]==undefined){
				this[i]=this[i+1];
				this[i+1]=undefined;
			}
		}
		this.length--;
	}
	
	//input port of component
	Board.input=function(parent){
		this.parent=parent;
		return this;
	}
	Board.input.prototype.connect=function(from){
		if(this.pair!=undefined)this.pair.Destroy(this);
		this.pair=from;
	}
	Board.input.prototype.x=function(){
		return this.parent.x+20;
	}
	Board.input.prototype.y=function(){
		var inputNo=this.parent.inputs.indexOf(this);
		return this.parent.y+20+inputNo*30;
	}
	Board.input.prototype.Draw=function(lines,componentDom,inputsDom,drawNo){
		//draw node
		var connectionNode=$("<div/>").addClass("inputNode");
		inputsDom.append(connectionNode);
		
		connectionNode.mousedown(this,function(e){
			var obj=e.data;
			e.stopPropagation();
			Board.pointer.connect(obj);
			Board.pointer.Draw(e);
			obj.parent.parent.componentsDom.parent().mousemove(this,function(e){
				obj=e.data;
				e.stopPropagation();
				Board.pointer.Update(e);
			});
			componentDom.mouseup(function(){
				$(this).unbind("mousemove");
				$(this).unbind("mouseup",e.handleObj.handler);
			})
		});
		connectionNode.mouseup(this,function(e){
			var obj=e.data;
			if(Board.pointer.pair.__proto__==Board.output.prototype){
				e.stopPropagation();
				var pair=Board.pointer.pair;
				Board.pointer.Destroy();
				pair.connect(obj);
				obj.DrawLine(obj.parent.parent.lines);
				obj.parent.parent.componentsDom.parent().unbind("mousemove");
				obj.parent.parent.componentsDom.parent().unbind("mouseup",Board.pointer.catchMouseUp);
			}
		})
		
		//draw connection
		if(this.pair!=undefined&&this.pair.parent!=undefined){
			this.DrawLine(lines)
		}
	}
	Board.input.prototype.DrawLine=function(lines){
			//draw line from this to other component
			var fromX=this.pair.x(),
				fromY=this.pair.y(),
				toX=this.x(),
				toY=this.y();
			var control1=fromX+minimum(150,Math.floor((toX-fromX)/3));
			var control2=toX-minimum(150,Math.floor((toX-fromX)/3));
			var lineArg="M"+fromX+","+fromY+" C"+control1+","+fromY+" ";
				lineArg+=control2+","+toY+" "+toX+","+toY;
			var line=lines.createPath();
			line.move(fromX,fromY);
			line.curveC(control1,fromY,control2,toY,toX,toY);
			this.dom=lines.path(line,{fill:"none",stroke:"black",strokeWidth:5});
			$(this.dom).click(this,function(e){
				obj=e.data;
				e.stopPropagation();
				$(document.body).click();
				this.setAttribute("stroke-width",7);
				$(document.body).keydown(obj,Board.input.deleteKeyPress);
				$(document.body).click(obj,Board.input.clickOffLine);
			})
	}
	Board.input.clickOffLine=function(e){
		e.data.dom.setAttribute("stroke-width",5);
		$(document.body).unbind("click",Board.input.clickOffLine);
		$(document.body).unbind("keydown",Board.input.deleteKeyPress);
	}
	Board.input.deleteKeyPress=function(e){
		var obj=e.data;
		//is it delete or backspace key
		if(e.which==8||e.which==46){
			Board.input.clickOffLine(e);
			e.preventDefault();
			obj.pair.Destroy(obj);
		}
	}
	Board.input.prototype.Update=function(lastDraw){
		this.parent.Update(lastDraw);
		//update connection
		if(this.pair!=undefined&&this.pair.parent!=undefined){
			//init draw of other component
			this.pair.parent.Update(lastDraw);
			
			//draw line from this to other component
			var fromX=this.pair.x(),
				fromY=this.pair.y(),
				toX=this.x(),
				toY=this.y();
			var control1=fromX+minimum(150,Math.floor((toX-fromX)/3));
			var control2=toX-minimum(150,Math.floor((toX-fromX)/3));
			var lineArg="M"+fromX+","+fromY+" C"+control1+","+fromY+" ";
				lineArg+=control2+","+toY+" "+toX+","+toY;
			var line=this.parent.parent.lines.createPath();
			line.move(fromX,fromY);
			line.curveC(control1,fromY,control2,toY,toX,toY);
			this.dom.setAttribute("d",line._path);
		}
	};
	Board.input.prototype.Destroy=function(){
		this.pair=undefined;
		if(this.dom!=undefined)this.dom.remove();
		this.dom=undefined;
	}
	Board.input.prototype.lastDraw=0;
	Board.input.prototype.output=function(){
		if(this.pair==undefined)return false;
		return this.pair.parent.output();
	}
	
	//define basic gates
	//
	Board.components.push(new Board.component({
		name:"not",
		numberOfInputs:1,
		output:function(){
			return [!this.inputs[0].output()];
		}
	}));
	Board.components.push(new Board.component({
		name:"and",
		numberOfInputs:2,
		output:function(input,input2){
			return [this.inputs[0].output()&&this.inputs[0].output()]
		}
	}));
	Board.components.push(new Board.component({
		name:"or",
		numberOfInputs:2,
		output:function(){
			return [input||input2];
		}
	}));
	Board.components.push(new Board.component({
		name:"switch",
		numberOfInputs:0,
		state:false,
		output:function(){
			return this.state;
		},
		postDraw:function(boxes,lines,drawNo){
			this.dom.find(".inputNodes").remove();
			this.dom.find(".componentName").remove();
			this.dom.append($("<div/>").addClass("switch")
										.click(this,function(e){
											var obj=e.data;
											obj.state=!obj.state;
											if(obj.state)$(this).addClass("on");
											if(!obj.state)$(this).removeClass("on");
											obj.Update();
										}));
		}
	}));
	Board.components.push(new Board.component({
		name:"output",
		numberOfInputs:1,
		numberOfOutputs:0,
		output:function(){
			var indicator=this.dom.find(".bulb");
			if(this.inputs[0].output()){
				indicator.addClass("on");
			}
			else{
				indicator.removeClass("on");
			}
		},
		postDraw:function(boxes,lines,drawNo){
			this.dom.find(".outputNodes").remove();
			this.dom.find(".componentName").remove();
			this.dom.append($("<div/>").addClass("bulb"));
			this.output();
		},
		postUpdate:function(){
			this.output();
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
			y:400,
			numberOfInputs:1
		}),
		test4=new Board.components.get("or"),
		test5=new Board.components.get("switch");
		test6=new Board.components.get("output");
	testCircuit.addComponent(test1);
	testCircuit.addComponent(test2);
	testCircuit.addComponent(test3);
	testCircuit.addComponent(test4);
	testCircuit.addComponent(test5);
	testCircuit.addComponent(test6);
	test1.outputs[0].connect(test2.inputs[0]);
	test2.outputs[0].connect(test3.inputs[0]);
	testCircuit.Draw($(".board")[0]);
	
})(window);