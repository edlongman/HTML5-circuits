//One object to rule them all
(function(window, undefined) {
	$(".linescontainer").svg();
	Board={};
	Board.components=[];
	Board.components.get=function(name){
		for(var i=0;i<Board.components.length;i++){
			if(Board.components[i].name==name){
				return new Board.component(Board.components[i]);
			}
		}
	};
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
	};
	//holds positions of components
	Board.circuit=function(components){
		this.parts=[];
		if(typeof(components)=="object"&&components.toString!="[object Object]"){
			for(var i=0;i<components.length;i++){
				this.parts[i]=components[i];
			}
		}
		this.inputs=[];
		this.outputs=[];
		return this;
	};
	Board.circuit.prototype.addIOProperty=function(noOfInputs,noOfOutputs){
		this.inputs=[];
		for(var i=0;i<noOfInputs;i++){
			this.inputs.push(new Board.components.get("switch"));
			this.inputs[i].parent=this;
		}
		this.outputs=[];
		for(var i=0;i<noOfOutputs;i++){
			this.outputs.push(new Board.components.get("output"));
		}
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
		if(from instanceof(Board.component))from=from.getFirstOutput();
		if(to instanceof(Board.component))to=to.getFirstInput();
		//check from and to
		if(from.__proto__==to.__proto__||to.parent==from.parent){
			//can't draw that line
			return false;
		}
		from.connect(to);
		return this;
	};
	//doesn't let the value go below minimum
	function minimum(min,arg){
		return (min<arg)?arg:min;
	}
	Board.circuit.prototype.Draw=function(domElement){
		this.drawIteration++;
		var components=$(domElement).find("div");
		this.componentsDom=components;
		var lines=$(".linescontainer").svg("get");
		this.lines=lines;
		components.html("");
		for(var i=0;i<this.parts.length;i++){
			this.parts[i].Draw(components,lines,this.drawIteration);
		}
		Board.components.Draw(this);
		Board.componentSelector(this);
	};
	Board.circuit.prototype.drawIteration=0;
	Board.circuit.prototype.Update=function(){
		this.drawIteration++;
		for(var i=0;i<this.parts.length;i++){
			if(this.parts[i].dom==undefined){
				this.parts[i].Draw(this.componentsDom,this.lines,this.drawIteration);
			}
			else{
				this.parts[i].Update(this.drawIteration);
			}
		}
		Board.components.Draw(this);
	};
	Board.circuit.prototype.SelectAll=function(){
		for(var i=0;i<this.parts.length;i++){
			this.parts[i].Select();
		}
	};
	Board.circuit.prototype.DeselectAll=function(){
		for(var i=0;i<this.parts.length;i++){
			this.parts[i].Deselect();
		}
		Board.componentSelector.extractSelected(this);
	};
	
	Board.selection={
		"parts":[]
	};
	Board.selection.isSelected=function(part){
		return (this.parts.indexOf(part)!=-1);
	};
	Board.selection.extract=function(){
		//get broken inputs
		var inputs=[],
			outputs=[],
			componentCircuit=new Board.circuit(),
			componentToAdd,
			newComponent,
			outputPair,
			inputPair;
		function sortByY(parts){
			if(parts.length<=1){
				return parts;
			}
			var pivot=Math.ceil(parts.length/2),
				pivotPart=parts[pivot],
				abovePivot=[],
				belowPivot=[],
				sorted;
			parts.remove(pivot);
			for(var i=0;i<parts.length;i++){
				if(parts[i].y()>pivotPart.y()){
					abovePivot.push(parts[i]);
				}
				else{
					belowPivot.push(parts[i]);
				}
			}
			sorted=sortByY(belowPivot);
			sorted.push(pivotPart);
			return sorted.concat(sortByY(abovePivot));
			
		}
		for(var i=0;i<Board.selection.parts.length;i++){
			componentToAdd=$.extend({},Board.selection.parts[i]);
			componentToAdd.dom=null;
			componentCircuit.addComponent(componentToAdd);
		}
		for(var i=0;i<componentCircuit.parts.length;i++){
			var part=componentCircuit.parts[i];
			for(var ii=0;ii<part.inputs.length;ii++){
				if(part.inputs[ii].selected=="split"){
					inputs.push(part.inputs[ii]);
				}
			}
			for(var ii=0;ii<part.outputs.length;ii++){
				for(var iii=0;iii<part.outputs[ii].length;iii++){
					if(part.outputs[ii][iii].selected=="split"){
						outputs.push(part.outputs[ii]);
					}
				}
			}
		}
		
		//add IO to component
		componentCircuit.addIOProperty(inputs.length,outputs.length);
		newComponent=new Board.component({
			"name":"createdComponent",
			"numberOfInputs":inputs.length,
			"numberOfOutputs":outputs.length,
			"components":componentCircuit
		});
		inputs=sortByY(inputs);
		outputs=sortByY(outputs);
		for(var i=0;i<inputs.length;i++){
			inputs[i].pair.connect(newComponent.inputs[i]);
			componentCircuit.inputs[i].connect(inputs[i]);
		}
		/*for(var i=0;i<outputs.length;i++){
			outputs[i].connect(newComponent.inputs[i]);
			componentCircuit.inputs[i].connect(inputs[i]);
		}*/
		for(var i=0;i<Board.selection.count();i++){
			Board.selection.parts[i].Destroy();
		}
		
	};
	Board.selection.add=function(what){
		Board.selection.remove(what);
		for(var i=0;i<this.parts.length;i++){
			if(this.parts.length==what)return;
		}
		this.parts.push(what);
		Board.menu.empty();
		Board.menu.addOption({
			name: "Extract",
			callback: Board.selection.extract
		});
		Board.menu.Draw();
		Board.menu.show();
	};
	Board.selection.remove=function(what){
		for(var i=0;i<this.parts.length;){
			if(this.parts[i]==what){
				this.parts.remove(i);
			}
			else{
				i++;
			}
		}
		if(this.count()==0){
			Board.menu.hide();
		}
	};
	Board.selection.count=function(){
		return this.parts.length;
	};
	
	Board.componentSelector=function(circuit){
		$(document.body).unbind("mousemove",Board.componentSelector.changeSelection)
						.unbind("mouseup",Board.componentSelector.endSelection);
		$(circuit.lines._svg).mousedown(circuit,Board.componentSelector.startSelection);
		$(circuit.lines._svg).click(circuit,Board.componentSelector.deselectOnClick);
	};
	Board.componentSelector.checkForSelection=function(circuit){
		var fromX=(circuit.dragData.startX<circuit.dragData.x)?circuit.dragData.startX:circuit.dragData.x,
			toX=(circuit.dragData.startX<circuit.dragData.x)?circuit.dragData.x:circuit.dragData.startX,
			fromY=(circuit.dragData.startY<circuit.dragData.y)?circuit.dragData.startY:circuit.dragData.y,
			toY=(circuit.dragData.startY<circuit.dragData.y)?circuit.dragData.y:circuit.dragData.startY;
		for(var i=0;i<circuit.parts.length;i++){
			circuit.parts[i].checkSelectStatus(fromX,fromY,toX,toY);
		}
	};
	Board.componentSelector.deselectOnClick=function(e){
		obj=e.data;
		obj.DeselectAll();
	};
	Board.componentSelector.startSelection=function(e){
		var obj=e.data;
		e.stopPropagation();
		if(!e.shiftKey){
			obj.DeselectAll();
		}
		var boxesOffset=obj.componentsDom.offset();
		obj.dragData={
			startX:e.pageX-boxesOffset.left,
			startY:e.pageY-boxesOffset.top
		};
		$(".selectionBox").css({
			"top":obj.dragData.startY+boxesOffset.top,
			"left":obj.dragData.startX+boxesOffset.left
		});
		$(obj.lines._svg).unbind("mousedown",Board.componentSelector.startSelection);
		$(document.body).mousemove(obj,Board.componentSelector.changeSelection)
						.mouseup(obj,Board.componentSelector.endSelection);
	};
	Board.componentSelector.changeSelection=function(e){
		var obj=e.data;
		var boxesOffset=obj.componentsDom.offset();
		obj.dragData.x=e.pageX-boxesOffset.left;
		obj.dragData.y=e.pageY-boxesOffset.top;
		if(obj.dragData.x<obj.dragData.startX){
			$(".selectionBox").css({
				"left":obj.dragData.x+boxesOffset.left + "px",
				"width":obj.dragData.startX-obj.dragData.x + "px",
				"z-index":"0"
			});
		}
		else{
			$(".selectionBox").css({
				"left":obj.dragData.startX+boxesOffset.left + "px",
				"width":obj.dragData.x-obj.dragData.startX + "px",
				"z-index":"0"
			});
		}
		if(obj.dragData.y<obj.dragData.startY){
			$(".selectionBox").css({
				"top":obj.dragData.y+boxesOffset.top + "px",
				"height":obj.dragData.startY-obj.dragData.y + "px",
				"z-index":"0"
			});
		}
		else{
			$(".selectionBox").css({
				"top":obj.dragData.startY+boxesOffset.top + "px",
				"height":obj.dragData.y-obj.dragData.startY + "px",
				"z-index":"0"
			});
		}
		Board.componentSelector.checkForSelection(obj);
	};
	Board.componentSelector.endSelection=function(e){
		var obj=e.data;
		e.stopPropagation();
		$(document.body).unbind("mousemove",Board.componentSelector.changeSelection)
						.unbind("mouseup",Board.componentSelector.endSelection);
		$(obj.lines._svg).mousedown(obj,Board.componentSelector.startSelection);
		$(".selectionBox").css({
			"left":"-2px",
			"top":"-2px",
			"width":"0px",
			"height":"0px",
			"z-index":"-1"
		});
		obj.dragData=undefined;
		Board.componentSelector.extractSelected(obj);
	};
	Board.componentSelector.extractSelected=function(circuit){
		for(var i=0;i<circuit.parts.length;i++){
			if(circuit.parts[i].selected){
				Board.selection.add(circuit.parts[i]);
			}
			else{
				Board.selection.remove(circuit.parts[i]);
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
		selected:false,
		output:function(){
			for(var i=0;i<this.inputs.length;i++){
				if(this.components.inputs[i]!=undefined){
					this.components.inputs[i].state=this.inputs[i].output();
				}
			}
			var result=[];
			for(var i=0;i<this.components.outputs.length;i++){
				if(this.components.outputs[i]!=undefined){
					result.push(this.components.outputs[i].output());
				}
			}
			return result;
		}
	};
	Board.component=function(){};
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
		};
		this.inputs.Update=function(lastDraw){
			for(var i=0;i<this.length;i++){
				this[i].Update(lastDraw);
			}
		};
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
		};
		this.outputs.Update=function(lastDraw){
			for(var i=0;i<this.length;i++){
				this[i].Update(lastDraw);
			}
		};
		return this;
	};
	//get first un-taken output and if there is none then take the first
	Board.component.prototype.getFirstOutput=function(){
		for(var i=0;i<this.outputs.length;i++){
			if(this.outputs[i].length==0){
				return this.outputs[i];
			}
		}
		return this.outputs[0];
	};
	//get first un-taken input and if there is none then take the first
	Board.component.prototype.getFirstInput=function(){
		for(var i=0;i<this.inputs.length;i++){
			if(this.inputs[i].pair==undefined){
				return this.inputs[i];
			}
		}
		return this.inputs[0];
	};
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
			obj.parent.componentsDom.parent().mousemove(obj,Board.component.updateDrag);
			obj.parent.componentsDom.parent().mouseup(obj,Board.component.stopDrag);
		});
		this.dom.dblclick(this,function(e){
			var obj=e.data;
			$(document.body).click(obj,function(e){
				if (e.data.dom!=undefined) {
					e.data.dom.find(".deleteComponent").remove();
				}
				$(this).unbind("click",e.handleObj.handler);
			});
			obj.dom.append($("<div/>").addClass("deleteComponent").click(obj,function(){
				obj.Destroy();
			}));
		});
		this.dom.click(this,Board.component.clickToSelect);
		this.inputs.Draw(lines,this.dom,drawNo);
		this.outputs.Draw(lines,this.dom,drawNo);
		this.dom.append($("<div/>").addClass("componentName").text(this.name));
		if(this.postDraw!=undefined)this.postDraw();
	};
	Board.component.clickToSelect=function(e){
		var obj=e.data;
		if(obj.clickOffsetX!=undefined){
			//must have just finished drag so ignore
			return;
		}
		if(!e.shiftKey){
			obj.parent.DeselectAll();
		}
		if(obj.selected){
			obj.Deselect();
			Board.selection.remove(obj);
		}
		else{
			obj.Select();
			Board.selection.add(obj);
		}
	};
	Board.component.updateDrag=function(e) {
		var obj=e.data;
		obj.dom.unbind("click",Board.component.clickToSelect);
		boxesOffset=obj.parent.componentsDom.offset();
		obj.x=e.pageX-obj.clickOffsetX-boxesOffset.left;
		obj.y=e.pageY-obj.clickOffsetY-boxesOffset.top;
		obj.Update();
	};
	Board.component.stopDrag=function(e){
		var obj=e.data;
		$(this).unbind("mousemove",Board.component.updateDrag);
		obj.clickOffsetX=undefined;
		obj.clickOffsetY=undefined;
		$(this).click(obj,function(e){
			var obj=e.data;
			$(this).unbind("click",e.handleObj.handler);
			if(obj.dom!=undefined)obj.dom.click(obj,Board.component.clickToSelect);
		});
	};
	Board.component.prototype.lastDraw=0;
	Board.component.prototype.Update=function(lastDraw){
		if(lastDraw!=undefined&&this.lastDraw==lastDraw)return;
		if(lastDraw==undefined||this.parent.drawIteration!=lastDraw)this.parent.drawIteration++;
		this.lastDraw=this.parent.drawIteration;
		this.dom.css({
			"left":this.x,
			"top":this.y
		});
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
	};
	Board.component.prototype.checkSelectStatus=function(fromX,fromY,toX,toY){
		var aPos=this.dom.position();
		var bPos={
			"left":aPos.left+this.dom.width(),
			"top":aPos.top+this.dom.height()
		};
		if(!Board.selection.isSelected(this)){
			if((fromX<aPos.left&&toX>aPos.left)||(fromX<bPos.left&&toX>bPos.left)){
				if((fromY<aPos.top&&toY>aPos.top)||(fromY<bPos.top&&toY>bPos.top)){
					//selection box and component intersect
					this.Select();
				}
				else{
					this.Deselect();
				}
			}
			else{
				this.Deselect();
			}
		}
		for(var i=0;i<this.inputs.length;i++){
			this.inputs[i].checkSelectStatus();
		}
		for(var i=0;i<this.outputs.length;i++){
			this.outputs[i].checkSelectStatus();
		}
	};
	Board.component.prototype.Select=function(){
		this.selected=true;
		this.dom.css({
			"background":"rgba(255,200,50,1)"
		});
		for(var i=0;i<this.inputs.length;i++){
			this.inputs[i].checkSelectStatus();
		}
		for(var i=0;i<this.outputs.length;i++){
			this.outputs[i].checkSelectStatus();
		}
	};
	Board.component.prototype.Deselect=function(){
		this.selected=false;
		this.dom.css({
			"background":""
		});
		for(var i=0;i<this.inputs.length;i++){
			this.inputs[i].checkSelectStatus();
		}
		for(var i=0;i<this.outputs.length;i++){
			this.outputs[i].checkSelectStatus();
		}
		Board.selection.remove(this);
	};
	
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
	};
	Board.pointer.x=function(e,componentsDom){
		var boxesOffset=componentsDom.offset();
		return e.pageX-boxesOffset.left;
	};
	Board.pointer.y=function(e,componentsDom){
		var boxesOffset=componentsDom.offset();
		return e.pageY-boxesOffset.top;
	};
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
	};
	Board.pointer.catchMouseUp=function(e) {
		Board.pointer.Destroy();
		$(this).unbind("mouseup",e.handleObj.handler);
		$(this).unbind("mousemove",Board.pointer.Update);
	};
	Board.pointer.Update=function(e){
		e.stopPropagation();
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
	};
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
	};
	
	Board.menu={};
	Board.menu.options=[];
	Board.menu.addOption=function(options){
		if(options.length){
			for(var i=0;i<options.length;i++){
				this.addOption(options[i]);
			}
		}
		this.options.push(options);
	};
	Board.menu.empty=function(){
		this.options=[];
		this.hide();
	};
	Board.menu.hide=function(){
		if(this.dom==undefined){return;}
		this.dom.fadeOut(200);
	};
	Board.menu.show=function(){
		if(this.dom==undefined)return;
		this.dom.fadeIn();
	};
	Board.menu.Draw=function(){
		this.dom=$(".menu");
		this.dom.html("");
		for(var i=0;i<this.options.length;i++){
			this.dom.append($("<div/>").addClass("menuItem")
										.text(this.options[i].name)
										.click(this.options[i].callback));
		}
	};
		
		
	//output port of component
	Board.output=function(parent){
		this.parent=parent;
		this.length=0;
		return this;
	};
	Board.output.prototype.connect=function(to){
		to.connect(this);
		this[this.length]=to;
		this.length++;
	};
	Board.output.prototype.x=function(){
		return this.parent.x+100;
	};
	Board.output.prototype.y=function(){
		var outputNo=this.parent.outputs.indexOf(this);
		return this.parent.y+20+outputNo*30;
	};
	Board.output.prototype.Draw=function(lines,componentDom,outputsDom,drawNo){
		//draw node
		var connectionNode=$("<div/>").addClass("outputNode");
		outputsDom.append(connectionNode);
		connectionNode.mousedown(this,function(e){
			obj=e.data;
			e.stopPropagation();
			obj.connect(Board.pointer);
			Board.pointer.Draw(e);
			obj.parent.parent.componentsDom.parent().mousemove(this,Board.pointer.Update);;
			componentDom.mouseup(function(){
				$(this).unbind("mousemove");
				$(this).unbind("mouseup",e.handleObj.handler);
			});
		});
		connectionNode.mouseup(this,function(e){
			var obj=e.data;
			if(obj.parent.parent.addConnector(obj,Board.pointer.pair)){
				e.stopPropagation();
				obj[obj.length-1].DrawLine(obj.parent.parent.lines);
				obj.parent.parent.componentsDom.parent().unbind("mousemove");
				obj.parent.parent.componentsDom.parent().unbind("mouseup",Board.pointer.catchMouseUp);
				obj.parent.Update();
			}
		});
	};
	Board.output.prototype.Update=function(lastDraw){
		for(var i=0;i<this.length;i++){
			this[i].Update(lastDraw);
		}
	};
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
	};
	Board.output.prototype.checkSelectStatus=function(){
		for(var i=0;i<this.length;i++){
			this[i].checkSelectStatus();
		}
	};
	
	//input port of component
	Board.input=function(parent){
		this.parent=parent;
		return this;
	};
	Board.input.prototype.connect=function(from){
		if(this.pair!=undefined)this.pair.Destroy(this);
		this.pair=from;
	};
	Board.input.prototype.x=function(){
		return this.parent.x+20;
	};
	Board.input.prototype.y=function(){
		var inputNo=this.parent.inputs.indexOf(this);
		return this.parent.y+20+inputNo*30;
	};
	Board.input.prototype.Draw=function(lines,componentDom,inputsDom,drawNo){
		//draw node
		var connectionNode=$("<div/>").addClass("inputNode");
		inputsDom.append(connectionNode);
		
		connectionNode.mousedown(this,function(e){
			var obj=e.data;
			e.stopPropagation();
			Board.pointer.connect(obj);
			Board.pointer.Draw(e);
			obj.parent.parent.componentsDom.parent().mousemove(this,Board.pointer.Update);
			componentDom.mouseup(function(){
				$(this).unbind("mousemove");
				$(this).unbind("mouseup",e.handleObj.handler);
			});
		});
		connectionNode.mouseup(this,function(e){
			var obj=e.data;
			if(obj.parent.parent.addConnector(Board.pointer.pair,obj)){
				e.stopPropagation();
				var pair=Board.pointer.pair;
				Board.pointer.Destroy();
				obj.DrawLine(obj.parent.parent.lines);
				obj.parent.parent.componentsDom.parent().unbind("mousemove");
				obj.parent.parent.componentsDom.parent().unbind("mouseup",Board.pointer.catchMouseUp);
				obj.parent.Update();
			}
		});
		
		//draw connection
		if(this.pair!=undefined&&this.pair.parent!=undefined){
			this.DrawLine(lines);
		}
	};
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
			$(this.dom).click(this,Board.input.clickToSelect);
	};
	Board.input.clickToSelect=function(e){
		e.stopPropagation();
		var obj=e.data;
		if(!e.shiftKey){
			obj.parent.parent.DeselectAll();
		}
		if(obj.selected){
			obj.Deselect();
		}
		else{
			obj.Select();
		}
		$(document.body).keydown(obj,Board.input.deleteKeyPress);
	};
	Board.input.prototype.Select=function(){
		this.selected=true;
		this.dom.setAttribute("stroke-width",7);
		this.dom.setAttribute("stroke-opacity",1);
		this.dom.setAttribute("stroke-dasharray","");
	};
	Board.input.prototype.Split=function(){
		this.selected="split";
		this.dom.setAttribute("stroke-width",5);
		this.dom.setAttribute("stroke-opacity",1);
		this.dom.setAttribute("stroke-dasharray",10);
	};
	Board.input.prototype.Deselect=function(){
		this.selected=false;
		if(this.dom!=undefined){
			this.dom.setAttribute("stroke-width",5);
			this.dom.setAttribute("stroke-opacity",0.9);
			this.dom.setAttribute("stroke-dasharray","");
		}
		$(document.body).unbind("click",this.Deselect);
		$(document.body).unbind("keydown",Board.input.deleteKeyPress);
	};
	Board.input.deleteKeyPress=function(e){
		var obj=e.data;
		//is it delete or backspace key
		if(e.which==8||e.which==46){
			obj.Deselect();
			e.preventDefault();
			obj.pair.Destroy(obj);
		}
	};
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
	};
	Board.input.prototype.lastDraw=0;
	Board.input.prototype.output=function(){
		if(this.pair==undefined)return false;
		for(var i=0;i<this.pair.parent.outputs.length;i++){
			if(this.pair.parent.outputs[i]==this.pair)break;
		}
		return this.pair.parent.output()[i];
	};
	Board.input.prototype.checkSelectStatus=function(){
		if(this.pair==undefined){}
		else if(this.parent.selected&&this.pair.parent.selected){
			this.Select();
		}
		else if(this.parent.selected||this.pair.parent.selected){
			this.Split();
		}
		else{
			this.Deselect();
		}
	};
	
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
			return [this.inputs[0].output()&&this.inputs[1].output()];
		}
	}));
	Board.components.push(new Board.component({
		name:"or",
		numberOfInputs:2,
		output:function(){
			return [this.inputs[0].output()||this.inputs[1].output()];
		}
	}));
	Board.components.push(new Board.component({
		name:"switch",
		numberOfInputs:0,
		state:false,
		output:function(){
			return [this.state];
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
			if(this.dom==undefined){
				return this.inputs[0].output();
			}
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
		t3_and1=new Board.components.get("and"),
		t3_and2=new Board.components.get("and"),
		t3_not=new Board.components.get("not"),
		t3_or=new Board.components.get("or");
	var t3_components=new Board.circuit([
				t3_and1,
				t3_not,
				t3_or,
				t3_and2,
			]);
	t3_components.addIOProperty(2,1);
	t3_components.addConnector(t3_components.inputs[0],t3_and1)
				 .addConnector(t3_components.inputs[1],t3_and1)
				 .addConnector(t3_components.inputs[0],t3_or)
				 .addConnector(t3_components.inputs[1],t3_or)
				 .addConnector(t3_and1,t3_not)
				 .addConnector(t3_not,t3_and2)
				 .addConnector(t3_or,t3_and2)
				 .addConnector(t3_and2,t3_components.outputs[0]);
	var test3=new Board.component({
			name:"test3",
			x:250,
			y:400,
			numberOfInputs:2,
			components:t3_components
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