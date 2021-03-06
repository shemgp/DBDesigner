Column = function() {
	//If the constructor gets a ColumnModel object as first parameter, it is set as the model
	//otherwise a new model is created
	
	if(arguments.length > 0 && arguments[0] instanceof ColumnModel) this.setModel(arguments[0]);
	else this.setModel(new ColumnModel());
	
	this.setUI(new ColumnUI(this));
};

$.extend(Column.prototype, DBObject);

Column.createFromJSON = function(json, parent){
	return new Column(ColumnModel.createFromJSON(json, parent));
};

Column.prototype.modelPropertyChanged = function(event){
	switch(event.property){
		case 'dropped':
			this.getUI().drop();
			this.trigger(DBObject.Event.DBOBJECT_DROPPED);
			break;
		case 'parent':
			this.getUI().updateParent();
			break;
		case 'stopEditing':
			this.modelChanged();
			break;
		default:
			this.modelChanged(event.property, this.getUI().updateView);
			break;
	}
};

Column.prototype.alterColumn = function(){
	this.trigger(Column.Event.ALTER_REQUEST);
};

Column.prototype.isPrimaryKey = function(){
	return this.getModel().isPrimaryKey();
};

Column.prototype.isUniqueKey = function(){
	return this.getModel().isUniqueKey();
};

Column.prototype.isArray = function(){
	return this.getModel().isArray();
};

Column.prototype.setHighLight = function(b){
	this.getUI().setHighLight(b);
};

Column.prototype.setForeignKey = function(b){
	this.getModel().setForeignKey(b);
};

Column.prototype.setUniqueKey = function(b){
	this.getModel().setUniqueKey(b);
};

Column.prototype.setLength = function(length){
	this.getModel().setLength(length);
};

Column.prototype.setType = function(type){
	this.getModel().setType(type);
};

Column.prototype.setArray = function(b){
	this.getModel().setArray(b);
};

Column.prototype.getType = function(){
	return this.getModel().getType();
};

Column.prototype.getLength = function(){
	return this.getModel().getLength();
};

Column.prototype.move = function(dir){
	this.getUI().move(dir);
};

Column.prototype.drop = function(){
	this.getModel().drop();
};

Column.prototype.getParent = function(){
	return this.getModel().getParent();
};

Column.prototype.getDefault = function(){
	return this.getModel().getDefault();
};

Column.prototype.getFullType = function(){
	return this.getModel().getFullType();
};

Column.prototype.isNotNull = function(){
	return this.getModel().isNotNull();
};

Column.prototype.toString = function(){
	return this.getName();
};

Column.prototype.serialize = function(){
	return this.getModel().serialize();
};

// *****************************************************************************



ColumnModel = function(){};
$.extend(ColumnModel.prototype, DBObjectModel);

ColumnModel.createFromJSON = function(json, parent){
	json.array = $.parseBool(json.array);
	json.primaryKey = $.parseBool(json.primaryKey);
	json.notNull = $.parseBool(json.notNull);
	
	var model = new ColumnModel();
	model.setParent(parent);
	model.setName(json.name);
	model.setComment(json.comment);
	model.setType(json.type);
	model.setDefault(json.defaultDef);
	model.setLength(json.length);
	model.setColumnFlags({
		array: json.array,
		primaryKey: json.primaryKey,
		notNull: json.notNull
	});
	return model;
};

ColumnModel.prototype.setColumnFlags = function(attrs){
	var flags = 0;
	if(attrs.array) flags |= ColumnModel.Flag.ARRAY;
	if(attrs.primaryKey) flags |= ColumnModel.Flag.PRIMARY_KEY;
	if(attrs.uniqueKey) flags |= ColumnModel.Flag.UNIQUE_KEY;
	if(attrs.notNull) flags |= ColumnModel.Flag.NOTNULL;
	if(attrs.foreignKey) flags |= ColumnModel.Flag.FOREIGN_KEY;
	this.setFlags(flags);
};

ColumnModel.prototype.setType = function(type){
	var oldValue = this.getType();
	if(oldValue != type){
		this._type = type;
		this.trigger(DBDesigner.Event.PROPERTY_CHANGED, {property: 'type', newValue: type, oldValue: oldValue});
	}
};
ColumnModel.prototype.getType = function(){
	if(typeof this._type == 'undefined') this._type = 'SERIAL';
	return this._type;
};

ColumnModel.prototype.getFullType = function(){
	var type = this.getType();
	var isArray = this.isArray();
	var length = this.getLength();
	if(length != '') type += '(' + length + ')';
	if(isArray) type += '[]';
	return type;
};

ColumnModel.prototype.setLength = function(length){
	var oldValue = this.getLength();
	if(oldValue != length){
		this._length = length;
		this.trigger(DBDesigner.Event.PROPERTY_CHANGED, {property: 'length', newValue: length, oldValue: oldValue});
	}
};

ColumnModel.prototype.getLength = function(){
	if(typeof this._length == 'undefined') this._length = '';
	return this._length;
};

ColumnModel.prototype.setDefault = function(def){
	var oldValue = this.getDefault();
	if(oldValue != def){
		this._default = def;
		this.trigger(DBDesigner.Event.PROPERTY_CHANGED, {property: 'default', newValue: def, oldValue: oldValue});
	}
};

ColumnModel.prototype.getDefault = function(){
	if(typeof this._default == 'undefined') this._default = '';
	return this._default;
};

ColumnModel.prototype.setArray = function(b){
	this.setFlagState(ColumnModel.Flag.ARRAY, b);
};

ColumnModel.prototype.isArray = function(){
	return (this.getFlags() & ColumnModel.Flag.ARRAY) != 0;
};

ColumnModel.prototype.setPrimaryKey = function(b){
	this.setFlagState(ColumnModel.Flag.PRIMARY_KEY, b);
};

ColumnModel.prototype.isPrimaryKey = function(){
	return (this.getFlags() & ColumnModel.Flag.PRIMARY_KEY) != 0;
};

ColumnModel.prototype.setForeignKey = function(b){
	if(typeof this._foreignKeyCount == 'undefined') this._foreignKeyCount = 0;
	this._foreignKeyCount += b? 1 : -1;
	if((this._foreignKeyCount == 0 && !b) || (this._foreignKeyCount == 1 && b)){
		this.setFlagState(ColumnModel.Flag.FOREIGN_KEY, b);
	}
};

ColumnModel.prototype.isForeignKey = function(){
	return (this.getFlags() & ColumnModel.Flag.FOREIGN_KEY) != 0;
};

ColumnModel.prototype.setUniqueKey = function(b){
	if(typeof this._uniqueKeyCount == 'undefined') this._uniqueKeyCount = 0;
	this._uniqueKeyCount += b? 1 : -1;
	if((this._uniqueKeyCount == 0 && !b) || (this._uniqueKeyCount == 1 && b)){
		this.setFlagState(ColumnModel.Flag.UNIQUE_KEY, b);
	}
};

ColumnModel.prototype.isUniqueKey = function(){
	return (this.getFlags() & ColumnModel.Flag.UNIQUE_KEY) != 0;
};

ColumnModel.prototype.setNotNull = function(b){
	this.setFlagState(ColumnModel.Flag.NOTNULL, b);
};

ColumnModel.prototype.isNotNull = function(){
	return (this.getFlags() & ColumnModel.Flag.NOTNULL) != 0;
};

ColumnModel.prototype.setParent = function(table){
	this._parent = table;
	this.trigger(DBDesigner.Event.PROPERTY_CHANGED, {property: 'parent', newValue: table, oldValue: null});
};

ColumnModel.prototype.getParent = function(){
	if(typeof this._parent == 'undefined') this._parent = null;
	return this._parent;
};

ColumnModel.prototype.drop = function(){
	this.trigger(DBDesigner.Event.PROPERTY_CHANGED, {property: 'dropped'});
};

ColumnModel.prototype.serialize = function(){
	return {
		name: this.getName(),
		comment: this.getComment(),
		type: this.getType(),
		array: this.isArray(),
		primaryKey: this.isPrimaryKey(),
		notNull: this.isNotNull(),
		defaultDef: this.getDefault(),
		length: this.getLength()
	};
};

// *****************************************************************************

ColumnUI = function(controller){
	this.setTemplateID('Column');
	this.setController(controller);
	this.init();
	this.getDom().data('dbobject', controller);
	this.updateView();
	this.updateParent();
};
$.extend(ColumnUI.prototype, ComponentUI);

ColumnUI.prototype.updateView = function(){
	var model = this.getController().getModel();
	var dom = this.getDom();
	var $keys = dom.find('span.keys');
	var def = model.getName() + ' : ' + model.getFullType();
	
	dom.find('span.definition').text(def);
	if(model.isPrimaryKey() && model.isForeignKey()) $keys.attr('class', 'keys pk-fk');
	else if(model.isUniqueKey() && model.isForeignKey()) $keys.attr('class', 'keys uk-fk');
	else if(model.isPrimaryKey()) $keys.attr('class', 'keys pk');
	else if(model.isUniqueKey()) $keys.attr('class', 'keys uk');
	else if(model.isForeignKey()) $keys.attr('class', 'keys fk');
	else $keys.attr('class', 'keys');
	
	if(model.isNotNull() || model.isPrimaryKey()) dom.addClass('notnull');
	else dom.removeClass('notnull');
	model.getParent().refresh();
};

ColumnUI.prototype.updateParent = function(){
	var table = this.getController().getModel().getParent();
	if(table != null) this.getDom().appendTo(table.getUI().find('div.column-container'));
	table.refresh();
};

ColumnUI.prototype.onDblClick = function(){
	this.getController().alterColumn();
};

ColumnUI.prototype.bindEvents = function(){};

ColumnUI.prototype.setHighLight = function(b){
	var dom = this.getDom();
	if(b) dom.addClass('db-column-highlight');
	else dom.removeClass('db-column-highlight');
};

ColumnUI.prototype.move = function(dir){
	var dom = this.getDom();
	if(dir == 'up') dom.insertBefore(dom.prev());
	else dom.insertAfter(dom.next());
};

ColumnUI.prototype.drop = function() {
	this.getDom().remove();
	this.getController().getModel().getParent().refresh();
};
