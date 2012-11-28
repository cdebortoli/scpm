Date.prototype.addDays = function(days) {
  this.setDate(this.getDate()+days);
  };

Date.prototype.diffInDays = function(d2) {
  var t2 = d2.getTime();
  var t1 = this.getTime();
  return parseInt((t2-t1)/(24*3600*1000));
  };

var Task = Class.create ({
  initialize: function(planning, task) {
    this.planning         = planning;
    this.name             = task.name
    this.start_date       = new Date(task.start_date);
    this.duration         = task.duration_in_day;
    this.vertTitleSpacing = 12;
    this.taskHeight       = this.planning.taskHeight-2;
    this.leftCoords       = {x: null, y: null} // top left
    this.rightCoords      = {x: null, y: null} // bottom right
    this.titleColor       = 'blue';
    this.setMouseOutShape();
    },

  draw: function (y) {
    this.planning.ctx.fillStyle   = this.titleColor;
    this.planning.ctx.fillText(this.name, 2, y + this.planning.dateHeaderHeight + this.vertTitleSpacing);
    //this.drawTitle(y);
    x = this.planning.getTaskX(this);
    limRight =  this.planning.canvas.width -this.planning.canvasEndBorder;
    if(x > limRight) // out of the canvas
      return;
    lim    = this.planning.taskTitleWidth
    length = this.duration*this.planning.pixelsForOneDay;
    if(x+length < lim) return; // out of the canvas
    if(x < lim) {
      length -= lim-x; // reduce length
      x = lim; // do not draw the start of the task that is out of the left limit
      }
    if(x+length > limRight) // do not draw the rest of the task that is out the canvas (on the right)
      length -= (x+length - limRight)
    // save the coordinates (to be able to get the tasks under the click, for example)
    this.leftCoords.x  = x;
    this.leftCoords.y  = y + this.planning.dateHeaderHeight;
    this.rightCoords.x = x + length;
    this.rightCoords.y = y + this.planning.dateHeaderHeight + this.taskHeight;

    this.planning.ctx.fillStyle   = this.color;
    this.planning.ctx.fillRect(x, y + this.planning.dateHeaderHeight, length, this.taskHeight);
    },
  drawTitle: function(y) {
    // var input   = document.createElement("input");
    // input.top   = y;
    // input.value = this.name;
    },
  reactToMouseOver: function(coords) {
    if(coords.x < this.leftCoords.x || coords.x > this.rightCoords.x || coords.y < this.leftCoords.y || coords.y > this.rightCoords.y) {
      this.setMouseOutShape();
      return false;
      }
    else {
      this.setMouseInShape();
      return true;
      }
    },
  setMouseInShape: function() {
    this.color = "rgba(100, 100, 255, 1.0)";
    },
  setMouseOutShape: function() {
    this.color = "rgba(100, 100, 255, 0.9)";
    }
});

var Planning = Class.create({
  initialize: function(canvas_id,tasks) {
    // Actually start initializing defaults etc.
    window.Planning         = this; // define this class global, so it is accessible from event handlers
    this.canvas_id          = canvas_id || "planning";
    this.canvas             = $(this.canvas_id);
    this.ctx                = this.canvas.getContext("2d");
    this.taskTitleWidth     = 150;
    this.canvasEndBorder    = 25;
    this.taskBarMaxWidth    = this.canvas.width - this.taskTitleWidth - this.canvasEndBorder
    this.dateHeaderHeight   = 30;
    this.start_date         = new Date();
    this.setPlanningWidthInDay(60);
    this.months             = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.mouseCoords        = null; // current mouse coords
    this.fromCoords         = null; // down event ouse coords
    this.mouseState         = null;
    this.taskHeight         = 20;
    HTMLCanvasElement.prototype.relMouseCoords = this.relMouseCoords;

    // tasks
    this.tasks = new Array();
    for(var i=0; i < tasks.length; i++) {
      this.tasks.push(new Task(this, tasks[i].task));
      }

    // Draw the grid
    this.draw();

    // listen to the mouse clicks
    this.canvas.addEventListener("mousedown", this.onMouseDown, false);
    this.canvas.addEventListener("mouseup",   this.onMouseUp, false);
    this.canvas.addEventListener("mousemove", this.onMouseMove, false);
    this.canvas.addEventListener("mouseout",  this.onMouseOut, false);
    },

  setPlanningWidthInDay: function(days) {
    if(days < 10 || days > 90) return;
    this.planningWidthInDay = days;
    this.end_date           = new Date(this.start_date.valueOf());
    this.end_date.addDays(this.planningWidthInDay);
    this.pixelsForOneDay    = this.taskBarMaxWidth / this.planningWidthInDay;
    },

  draw: function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle   = "rgba(100, 100, 255, 1.0)";
    this.ctx.font        = "12px Helvetica";
    this.ctx.lineWidth   = 1;
    this.ctx.strokeStyle = "black";
    this.drawGrid();
    for(var i=0; i < this.tasks.length; i++) {
      this.tasks[i].draw(1+i*this.taskHeight);
      }
    },

  drawGrid: function() {
    this.drawDateHeader();
    // top horizontal line
    this.ctx.beginPath();
    this.ctx.moveTo(0,this.dateHeaderHeight-0.5);
    this.ctx.lineTo(this.canvas.width-this.canvasEndBorder, this.dateHeaderHeight-0.5);
    this.ctx.stroke();
    // bottom horizontal line
    this.ctx.beginPath();
    this.ctx.moveTo(0,this.canvas.height-0.5);
    this.ctx.lineTo(this.canvas.width-this.canvasEndBorder, this.canvas.height-0.5);
    this.ctx.stroke();
    // vertical lines for days
    for(var i=0; i <= this.planningWidthInDay; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.taskTitleWidth+i*this.pixelsForOneDay-0.5,this.dateHeaderHeight);
      this.ctx.lineTo(this.taskTitleWidth+i*this.pixelsForOneDay-0.5,this.canvas.height);
      this.ctx.stroke();
      }
    },

  drawDateHeader: function() {
    this.ctx.fillText(this.myDateFormat(this.start_date), this.taskTitleWidth-15, 20);
    this.ctx.fillText(this.myDateFormat(this.end_date), this.canvas.width-this.canvasEndBorder - 15, 20);
    },

  myDateFormat: function(date) {
    return date.getDate() + '-' + this.months[date.getMonth()];
    },

  onMouseDown: function(event) {
    window.Planning.fromCoords  = this.relMouseCoords(event);
    window.Planning.mouseState  = 'down';
    },

  onMouseUp: function(event) {
    window.Planning.mouseCoords = this.relMouseCoords(event);
    window.Planning.mouseState  = 'up';
    },

  onMouseOut: function(event) {
    window.Planning.mouseState  = 'up';
    },

  mouseOver: function(coords) {
    // rv = false;
    for(var i=0; i < this.tasks.length; i++) {
      // rv = rv || this.tasks[i].reactToMouseOver(coords);
      this.tasks[i].reactToMouseOver(coords);
      }
    //if(rv)
    this.draw();
    },

  onMouseMove: function(event) {
    if(window.Planning.mouseState!='down') {
      window.Planning.mouseOver(this.relMouseCoords(event));
      return;
      }
    window.Planning.mouseCoords = this.relMouseCoords(event);
    moved = false;

    // tasks translation (horizontal move)
    delta = (window.Planning.fromCoords.x - window.Planning.mouseCoords.x)*1.1 / window.Planning.pixelsForOneDay;
    if(Math.abs(delta) >= 1) {
      if(delta < 0) delta = Math.ceil(delta);
      else          delta = Math.floor(delta);
      window.Planning.start_date.addDays(delta);
      window.Planning.end_date.addDays(delta);
      moved = true;
      }
    else {
      // zoom
      delta = (window.Planning.mouseCoords.y - window.Planning.fromCoords.y) / 3;
      if(Math.abs(delta) >= 1) {
        window.Planning.setPlanningWidthInDay(window.Planning.planningWidthInDay+delta);
        moved = true;
        }
      }
    if(moved) {
      window.Planning.fromCoords = this.relMouseCoords(event);
      window.Planning.draw();
      }
    },

  relMouseCoords: function (e){
    var cx;
    var cy;
    if (e.pageX || e.pageY) {
      cx = e.pageX;
      cy = e.pageY;
      }
    else {
      cx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      cy = e.clientY + document.body.scrollTop  + document.documentElement.scrollTop;
    }
    cx -= this.offsetLeft;
    cy -= this.offsetTop;
    return {x:cx, y:cy}
  },

  // given a task, return the absolute task abscissa (in pixels)
  getTaskX: function(task) {
    days = this.start_date.diffInDays(task.start_date) * this.pixelsForOneDay;
    return this.taskTitleWidth + days;
    }

});