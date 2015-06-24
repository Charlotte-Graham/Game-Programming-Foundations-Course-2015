//Exit sign
var Exit = function(x, y) {
	
	this.sprite = new Sprite("signExit.png");
	this.sprite.buildAnimation(1, 1, 70, 70, 1, [0]);
	this.sprite.setAnimationOffset(0, 0, -35);
	
	this.position = new Vector2();
	this.position.set(x, y);
	
};


Exit.prototype.update = function(deltaTime)
{
	this.sprite.update(deltaTime);
}

Exit.prototype.draw = function()
{
	this.sprite.draw(context, this.position.x - worldOffsetX, this.position.y);
}