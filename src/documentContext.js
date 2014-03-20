/* jslint node: true */
'use strict';

/**
* Creates an instance of DocumentContext - a store for current x, y positions and available width/height.
* It facilitates column divisions and vertical sync
*/
function DocumentContext(pageSize, pageMargins, addFirstPageAutomatically) {
	this.pages = [];

	this.pageSize = pageSize;
	this.pageMargins = pageMargins;

	this.x = pageMargins.left;
	this.availableWidth = pageSize.width - pageMargins.left - pageMargins.right;
	this.availableHeight = 0;
	this.page = -1;

	this.snapshots = [];

	this.endingCell = null;

	if (addFirstPageAutomatically) this.addPage();
}

DocumentContext.prototype.beginColumnGroup = function() {
	this.snapshots.push({
		x: this.x,
		y: this.y,
		availableHeight: this.availableHeight,
		availableWidth: this.availableWidth,
		page: this.page,
		bottomMost: { y: this.y, page: this.page },
		endingCell: this.endingCell
	});

	this.lastColumnWidth = 0;
};

DocumentContext.prototype.beginColumn = function(width, offset, endingCell) {
	var saved = this.snapshots[this.snapshots.length - 1];

	this.calculateBottomMost(saved);

  this.endingCell = endingCell;
	this.page = saved.page;
	this.x = this.x + this.lastColumnWidth + (offset || 0);
	this.y = saved.y;
	this.availableWidth = width;	//saved.availableWidth - offset;
	this.availableHeight = saved.availableHeight;

	this.lastColumnWidth = width;
};

DocumentContext.prototype.calculateBottomMost = function(destContext) {
	if (this.endingCell) {
		this.saveContextInEndingCell(this.endingCell);
		this.endingCell = null;
	} else {
		destContext.bottomMost = bottomMostContext(this, destContext.bottomMost);
	}
};

DocumentContext.prototype.markEnding = function(endingCell) {
	this.page = endingCell._columnEndingContext.page;
	this.x = endingCell._columnEndingContext.x;
	this.y = endingCell._columnEndingContext.y;
	this.availableWidth = endingCell._columnEndingContext.availableWidth;
	this.availableHeight = endingCell._columnEndingContext.availableHeight;
	this.lastColumnWidth = endingCell._columnEndingContext.lastColumnWidth;
};

DocumentContext.prototype.saveContextInEndingCell = function(endingCell) {
	endingCell._columnEndingContext = {
		page: this.page,
		x: this.x,
		y: this.y,
		availableHeight: this.availableHeight,
		availableWidth: this.availableWidth,
		lastColumnWidth: this.lastColumnWidth
	};
};

DocumentContext.prototype.completeColumnGroup = function() {
	var saved = this.snapshots.pop();

	this.calculateBottomMost(saved);

	this.endingCell = null;
	this.x = saved.x;
	this.y = saved.bottomMost.y;
	this.page = saved.bottomMost.page;
	this.availableWidth = saved.availableWidth;
	this.availableHeight = saved.bottomMost.availableHeight;
};

DocumentContext.prototype.addMargin = function(left, right) {
	this.x += left;
	this.availableWidth -= left + (right || 0);
};

DocumentContext.prototype.moveDown = function(offset) {
	this.y += offset;
	this.availableHeight -= offset;

	return this.availableHeight > 0;
};

DocumentContext.prototype.moveToPageTop = function() {
	this.y = this.pageMargins.top;
	this.availableHeight = this.pageSize.height - this.pageMargins.top - this.pageMargins.bottom;
};

DocumentContext.prototype.addPage = function() {
	var page = { lines: [], vectors: [], images: [] };
	this.pages.push(page);
	this.page = this.pages.length - 1;
	this.moveToPageTop();

	return page;
};

DocumentContext.prototype.getCurrentPage = function() {
	if (this.page < 0 || this.page >= this.pages.length) return null;

	return this.pages[this.page];
};

function bottomMostContext(c1, c2) {
	var r;

	if (c1.page > c2.page) r = c1;
	else if (c2.page > c1.page) r = c2;
	else r = (c1.y > c2.y) ? c1 : c2;

	return {
		page: r.page,
		x: r.x,
		y: r.y,
		availableHeight: r.availableHeight,
		availableWidth: r.availableWidth
	};
}

/****TESTS**** (add a leading '/' to uncomment)
DocumentContext.bottomMostContext = bottomMostContext;
// */

module.exports = DocumentContext;
