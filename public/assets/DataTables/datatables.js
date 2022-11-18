/*
 * This combined file was created by the DataTables downloader builder:
 *   https://datatables.net/download
 *
 * To rebuild or modify this file with the latest versions of the included
 * software please visit:
 *   https://datatables.net/download/#bs4/af-2.4.0/b-2.2.3/b-colvis-2.2.3/date-1.1.2/sb-1.3.4/sp-2.0.2/sl-1.4.0/sr-1.1.1
 *
 * Included libraries:
 *   AutoFill 2.4.0, Buttons 2.2.3, Column visibility 2.2.3, DateTime 1.1.2, SearchBuilder 1.3.4, SearchPanes 2.0.2, Select 1.4.0, StateRestore 1.1.1
 */

/*! AutoFill 2.4.0
 * ©2008-2022 SpryMedia Ltd - datatables.net/license
 */

/**
 * @summary     AutoFill
 * @description Add Excel like click and drag auto-fill options to DataTables
 * @version     2.4.0
 * @author      SpryMedia Ltd (www.sprymedia.co.uk)
 * @copyright   SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   MIT license - http://datatables.net/license/mit
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: http://www.datatables.net
 */
(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


var _instance = 0;

/** 
 * AutoFill provides Excel like auto-fill features for a DataTable
 *
 * @class AutoFill
 * @constructor
 * @param {object} oTD DataTables settings object
 * @param {object} oConfig Configuration object for AutoFill
 */
var AutoFill = function( dt, opts )
{
	if ( ! DataTable.versionCheck || ! DataTable.versionCheck( '1.10.8' ) ) {
		throw( "Warning: AutoFill requires DataTables 1.10.8 or greater");
	}

	// User and defaults configuration object
	this.c = $.extend( true, {},
		DataTable.defaults.autoFill,
		AutoFill.defaults,
		opts
	);

	/**
	 * @namespace Settings object which contains customisable information for AutoFill instance
	 */
	this.s = {
		/** @type {DataTable.Api} DataTables' API instance */
		dt: new DataTable.Api( dt ),

		/** @type {String} Unique namespace for events attached to the document */
		namespace: '.autoFill'+(_instance++),

		/** @type {Object} Cached dimension information for use in the mouse move event handler */
		scroll: {},

		/** @type {integer} Interval object used for smooth scrolling */
		scrollInterval: null,

		handle: {
			height: 0,
			width: 0
		},

		/**
		 * Enabled setting
		 * @type {Boolean}
		 */
		enabled: false
	};


	/**
	 * @namespace Common and useful DOM elements for the class instance
	 */
	this.dom = {
		closeButton: $('<div class="dtaf-popover-close">x</div>'),

		/** @type {jQuery} AutoFill handle */
		handle: $('<div class="dt-autofill-handle"/>'),

		/**
		 * @type {Object} Selected cells outline - Need to use 4 elements,
		 *   otherwise the mouse over if you back into the selected rectangle
		 *   will be over that element, rather than the cells!
		 */
		select: {
			top:    $('<div class="dt-autofill-select top"/>'),
			right:  $('<div class="dt-autofill-select right"/>'),
			bottom: $('<div class="dt-autofill-select bottom"/>'),
			left:   $('<div class="dt-autofill-select left"/>')
		},

		/** @type {jQuery} Fill type chooser background */
		background: $('<div class="dt-autofill-background"/>'),

		/** @type {jQuery} Fill type chooser */
		list: $('<div class="dt-autofill-list">'+this.s.dt.i18n('autoFill.info', '')+'<ul/></div>'),

		/** @type {jQuery} DataTables scrolling container */
		dtScroll: null,

		/** @type {jQuery} Offset parent element */
		offsetParent: null
	};


	/* Constructor logic */
	this._constructor();
};



$.extend( AutoFill.prototype, {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public methods (exposed via the DataTables API below)
	 */
	enabled: function ()
	{
		return this.s.enabled;
	},


	enable: function ( flag )
	{
		var that = this;

		if ( flag === false ) {
			return this.disable();
		}

		this.s.enabled = true;

		this._focusListener();

		this.dom.handle.on( 'mousedown touchstart', function (e) {
			that._mousedown( e );
			return false;
		} );

		$(window).on('resize', function() {
			var handle = $('div.dt-autofill-handle');
			if(handle.length > 0 && that.dom.attachedTo !== undefined) {
				that._attach(that.dom.attachedTo)
			}
		})

		let orientationReset = function() {
			that.s.handle = {
				height: false,
				width: false
			};
			$(that.dom.handle).css({
				'height': '',
				'width': ''
			})
			if(that.dom.attachedTo !== undefined) {
				that._attach(that.dom.attachedTo)
			}
		}

		$(window)
			.on('orientationchange', function() {
				setTimeout(function() {
					orientationReset();
					setTimeout(orientationReset, 150);
				}, 50);
			});

		return this;
	},

	disable: function ()
	{
		this.s.enabled = false;

		this._focusListenerRemove();

		return this;
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Constructor
	 */

	/**
	 * Initialise the RowReorder instance
	 *
	 * @private
	 */
	_constructor: function ()
	{
		var that = this;
		var dt = this.s.dt;
		var dtScroll = $('div.dataTables_scrollBody', this.s.dt.table().container());

		// Make the instance accessible to the API
		dt.settings()[0].autoFill = this;

		if ( dtScroll.length ) {
			this.dom.dtScroll = dtScroll;

			// Need to scroll container to be the offset parent
			if ( dtScroll.css('position') === 'static' ) {
				dtScroll.css( 'position', 'relative' );
			}
		}

		if ( this.c.enable !== false ) {
			this.enable();
		}

		dt.on( 'destroy.autoFill', function () {
			that._focusListenerRemove();
		} );
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private methods
	 */

	/**
	 * Display the AutoFill drag handle by appending it to a table cell. This
	 * is the opposite of the _detach method.
	 *
	 * @param  {node} node TD/TH cell to insert the handle into
	 * @private
	 */
	_attach: function ( node )
	{
		var dt = this.s.dt;
		var idx = dt.cell( node ).index();
		var handle = this.dom.handle;
		var handleDim = this.s.handle;

		if ( ! idx || dt.columns( this.c.columns ).indexes().indexOf( idx.column ) === -1 ) {
			this._detach();
			return;
		}

		if ( ! this.dom.offsetParent ) {
			// We attach to the table's offset parent
			this.dom.offsetParent = $( dt.table().node() ).offsetParent();
		}

		if ( ! handleDim.height || ! handleDim.width ) {
			// Append to document so we can get its size. Not expecting it to
			// change during the life time of the page
			handle.appendTo( 'body' );
			handleDim.height = handle.outerHeight();
			handleDim.width = handle.outerWidth();
		}

		// Might need to go through multiple offset parents
		var offset = this._getPosition( node, this.dom.offsetParent );
		
		this.dom.attachedTo = node;
		handle
			.css( {
				top: offset.top + node.offsetHeight - handleDim.height,
				left: offset.left + node.offsetWidth - handleDim.width
			} )
			.appendTo( this.dom.offsetParent );
	},


	/**
	 * Determine can the fill type should be. This can be automatic, or ask the
	 * end user.
	 *
	 * @param {array} cells Information about the selected cells from the key
	 *     up function
	 * @private
	 */
	_actionSelector: function ( cells )
	{
		var that = this;
		var dt = this.s.dt;
		var actions = AutoFill.actions;
		var available = [];

		// "Ask" each plug-in if it wants to handle this data
		$.each( actions, function ( key, action ) {
			if ( action.available( dt, cells ) ) {
				available.push( key );
			}
		} );

		if ( available.length === 1 && this.c.alwaysAsk === false ) {
			// Only one action available - enact it immediately
			var result = actions[ available[0] ].execute( dt, cells );
			this._update( result, cells );
		}
		else if ( available.length > 1 ) {
			// Multiple actions available - ask the end user what they want to do
			var list = this.dom.list.children('ul').empty();

			// Add a cancel option
			available.push( 'cancel' );

			$.each( available, function ( i, name ) {
				list.append( $('<li/>')
					.append(
						'<div class="dt-autofill-question">'+
							actions[ name ].option( dt, cells )+
						'<div>'
					)
					.append( $('<div class="dt-autofill-button">' ).append( $('<button class="'+AutoFill.classes.btn+'">'+dt.i18n('autoFill.button', '&gt;')+'</button>')))
					.on( 'click', function () {
						var result = actions[ name ].execute(
							dt, cells, $(this).closest('li')
						);
						that._update( result, cells );

						that.dom.background.remove();
						that.dom.list.remove();
					} )
				);
			} );

			this.dom.background.appendTo( 'body' );
			this.dom.background.one('click', () => {
				this.dom.background.remove();
				this.dom.list.remove();
			})
			this.dom.list.appendTo( 'body' );

			if (this.c.closeButton) {
				this.dom.list.prepend(this.dom.closeButton).addClass(AutoFill.classes.closeable)
				this.dom.closeButton.on('click', () => this.dom.background.click())
			}

			this.dom.list.css( 'margin-top', this.dom.list.outerHeight()/2 * -1 );
		}
	},


	/**
	 * Remove the AutoFill handle from the document
	 *
	 * @private
	 */
	_detach: function ()
	{
		this.dom.attachedTo = null;
		this.dom.handle.detach();
	},


	/**
	 * Draw the selection outline by calculating the range between the start
	 * and end cells, then placing the highlighting elements to draw a rectangle
	 *
	 * @param  {node}   target End cell
	 * @param  {object} e      Originating event
	 * @private
	 */
	_drawSelection: function ( target, e )
	{
		// Calculate boundary for start cell to this one
		var dt = this.s.dt;
		var start = this.s.start;
		var startCell = $(this.dom.start);
		var end = {
			row: this.c.vertical ?
				dt.rows( { page: 'current' } ).nodes().indexOf( target.parentNode ) :
				start.row,
			column: this.c.horizontal ?
				$(target).index() :
				start.column
		};
		var colIndx = dt.column.index( 'toData', end.column );
		var endRow =  dt.row( ':eq('+end.row+')', { page: 'current' } ); // Workaround for M581
		var endCell = $( dt.cell( endRow.index(), colIndx ).node() );

		// Be sure that is a DataTables controlled cell
		if ( ! dt.cell( endCell ).any() ) {
			return;
		}

		// if target is not in the columns available - do nothing
		if ( dt.columns( this.c.columns ).indexes().indexOf( colIndx ) === -1 || end.row === -1) {
			return;
		}

		this.s.end = end;

		var top, bottom, left, right, height, width;

		top    = start.row    < end.row    ? startCell : endCell;
		bottom = start.row    < end.row    ? endCell   : startCell;
		left   = start.column < end.column ? startCell : endCell;
		right  = start.column < end.column ? endCell   : startCell;

		top    = this._getPosition( top.get(0) ).top;
		left   = this._getPosition( left.get(0) ).left;
		height = this._getPosition( bottom.get(0) ).top + bottom.outerHeight() - top;
		width  = this._getPosition( right.get(0) ).left + right.outerWidth() - left;

		var select = this.dom.select;
		select.top.css( {
			top: top,
			left: left,
			width: width
		} );

		select.left.css( {
			top: top,
			left: left,
			height: height
		} );

		select.bottom.css( {
			top: top + height,
			left: left,
			width: width
		} );

		select.right.css( {
			top: top,
			left: left + width,
			height: height
		} );
	},


	/**
	 * Use the Editor API to perform an update based on the new data for the
	 * cells
	 *
	 * @param {array} cells Information about the selected cells from the key
	 *     up function
	 * @private
	 */
	_editor: function ( cells )
	{
		var dt = this.s.dt;
		var editor = this.c.editor;

		if ( ! editor ) {
			return;
		}

		// Build the object structure for Editor's multi-row editing
		var idValues = {};
		var nodes = [];
		var fields = editor.fields();

		for ( var i=0, ien=cells.length ; i<ien ; i++ ) {
			for ( var j=0, jen=cells[i].length ; j<jen ; j++ ) {
				var cell = cells[i][j];

				// Determine the field name for the cell being edited
				var col = dt.settings()[0].aoColumns[ cell.index.column ];
				var fieldName = col.editField;

				if ( fieldName === undefined ) {
					var dataSrc = col.mData;

					// dataSrc is the `field.data` property, but we need to set
					// using the field name, so we need to translate from the
					// data to the name
					for ( var k=0, ken=fields.length ; k<ken ; k++ ) {
						var field = editor.field( fields[k] );

						if ( field.dataSrc() === dataSrc ) {
							fieldName = field.name();
							break;
						}
					}
				}

				if ( ! fieldName ) {
					throw 'Could not automatically determine field data. '+
						'Please see https://datatables.net/tn/11';
				}

				if ( ! idValues[ fieldName ] ) {
					idValues[ fieldName ] = {};
				}

				var id = dt.row( cell.index.row ).id();
				idValues[ fieldName ][ id ] = cell.set;

				// Keep a list of cells so we can activate the bubble editing
				// with them
				nodes.push( cell.index );
			}
		}

		// Perform the edit using bubble editing as it allows us to specify
		// the cells to be edited, rather than using full rows
		editor
			.bubble( nodes, false )
			.multiSet( idValues )
			.submit();
	},


	/**
	 * Emit an event on the DataTable for listeners
	 *
	 * @param  {string} name Event name
	 * @param  {array} args Event arguments
	 * @private
	 */
	_emitEvent: function ( name, args )
	{
		this.s.dt.iterator( 'table', function ( ctx, i ) {
			$(ctx.nTable).triggerHandler( name+'.dt', args );
		} );
	},


	/**
	 * Attach suitable listeners (based on the configuration) that will attach
	 * and detach the AutoFill handle in the document.
	 *
	 * @private
	 */
	_focusListener: function ()
	{
		var that = this;
		var dt = this.s.dt;
		var namespace = this.s.namespace;
		var focus = this.c.focus !== null ?
			this.c.focus :
			dt.init().keys || dt.settings()[0].keytable ?
				'focus' :
				'hover';

		// All event listeners attached here are removed in the `destroy`
		// callback in the constructor
		if ( focus === 'focus' ) {
			dt
				.on( 'key-focus.autoFill', function ( e, dt, cell ) {
					that._attach( cell.node() );
				} )
				.on( 'key-blur.autoFill', function ( e, dt, cell ) {
					that._detach();
				} );
		}
		else if ( focus === 'click' ) {
			$(dt.table().body()).on( 'click'+namespace, 'td, th', function (e) {
				that._attach( this );
			} );

			$(document.body).on( 'click'+namespace, function (e) {
				if ( ! $(e.target).parents().filter( dt.table().body() ).length ) {
					that._detach();
				}
			} );
		}
		else {
			$(dt.table().body())
				.on( 'mouseenter'+namespace+' touchstart'+namespace, 'td, th', function (e) {
					that._attach( this );
				} )
				.on( 'mouseleave'+namespace+'touchend'+namespace, function (e) {
					if ( $(e.relatedTarget).hasClass('dt-autofill-handle') ) {
						return;
					}

					that._detach();
				} );

			
		}
	},


	_focusListenerRemove: function ()
	{
		var dt = this.s.dt;

		dt.off( '.autoFill' );
		$(dt.table().body()).off( this.s.namespace );
		$(document.body).off( this.s.namespace );
	},


	/**
	 * Get the position of a node, relative to another, including any scrolling
	 * offsets.
	 * @param  {Node}   node         Node to get the position of
	 * @param  {jQuery} targetParent Node to use as the parent
	 * @return {object}              Offset calculation
	 * @private
	 */
	_getPosition: function ( node, targetParent )
	{
		var
			currNode = node,
			currOffsetParent,
			top = 0,
			left = 0;

		if ( ! targetParent ) {
			targetParent = $( $( this.s.dt.table().node() )[0].offsetParent );
		}

		do {
			// Don't use jQuery().position() the behaviour changes between 1.x and 3.x for
			// tables
			var positionTop = currNode.offsetTop;
			var positionLeft = currNode.offsetLeft;

			// jQuery doesn't give a `table` as the offset parent oddly, so use DOM directly
			currOffsetParent = $( currNode.offsetParent );

			top += positionTop + parseInt( currOffsetParent.css('border-top-width') || 0 ) * 1;
			left += positionLeft + parseInt( currOffsetParent.css('border-left-width') || 0 ) * 1;

			// Emergency fall back. Shouldn't happen, but just in case!
			if ( currNode.nodeName.toLowerCase() === 'body' ) {
				break;
			}

			currNode = currOffsetParent.get(0); // for next loop
		}
		while ( currOffsetParent.get(0) !== targetParent.get(0) )

		return {
			top: top,
			left: left
		};
	},


	/**
	 * Start mouse drag - selects the start cell
	 *
	 * @param  {object} e Mouse down event
	 * @private
	 */
	_mousedown: function ( e )
	{
		var that = this;
		var dt = this.s.dt;

		this.dom.start = this.dom.attachedTo;
		this.s.start = {
			row: dt.rows( { page: 'current' } ).nodes().indexOf( $(this.dom.start).parent()[0] ),
			column: $(this.dom.start).index()
		};

		$(document.body)
			.on( 'mousemove.autoFill touchmove.autoFill', function (e) {
				that._mousemove( e );
				// If it is a touch event then when the touch ends we need to remove the handle
				if(e.type === 'touchmove') {
					$(document.body).one('touchend.autoFill', function() {
						that._detach();
					})
				}
			} )
			.on( 'mouseup.autoFill touchend.autoFill', function (e) {
				that._mouseup( e );
			} );

		var select = this.dom.select;
		var offsetParent = $( dt.table().node() ).offsetParent();
		select.top.appendTo( offsetParent );
		select.left.appendTo( offsetParent );
		select.right.appendTo( offsetParent );
		select.bottom.appendTo( offsetParent );

		this._drawSelection( this.dom.start, e );

		this.dom.handle.css( 'display', 'none' );

		// Cache scrolling information so mouse move doesn't need to read.
		// This assumes that the window and DT scroller will not change size
		// during an AutoFill drag, which I think is a fair assumption
		var scrollWrapper = this.dom.dtScroll;
		this.s.scroll = {
			windowHeight: $(window).height(),
			windowWidth:  $(window).width(),
			dtTop:        scrollWrapper ? scrollWrapper.offset().top : null,
			dtLeft:       scrollWrapper ? scrollWrapper.offset().left : null,
			dtHeight:     scrollWrapper ? scrollWrapper.outerHeight() : null,
			dtWidth:      scrollWrapper ? scrollWrapper.outerWidth() : null
		};
	},


	/**
	 * Mouse drag - selects the end cell and update the selection display for
	 * the end user
	 *
	 * @param  {object} e Mouse move event
	 * @private
	 */
	_mousemove: function ( e )
	{	
		var that = this;
		var dt = this.s.dt;
		var target = !e.type.includes('touch') ? e.target : document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
		var name = target.nodeName.toLowerCase();
		if ( name !== 'td' && name !== 'th' ) {
			return;
		}

		this._drawSelection( target, e );
		this._shiftScroll( e );
	},


	/**
	 * End mouse drag - perform the update actions
	 *
	 * @param  {object} e Mouse up event
	 * @private
	 */
	_mouseup: function ( e )
	{
		$(document.body).off( '.autoFill' );

		var that = this;
		var dt = this.s.dt;
		var select = this.dom.select;
		select.top.remove();
		select.left.remove();
		select.right.remove();
		select.bottom.remove();

		this.dom.handle.css( 'display', 'block' );

		// Display complete - now do something useful with the selection!
		var start = this.s.start;
		var end = this.s.end;

		// Haven't selected multiple cells, so nothing to do
		if ( start.row === end.row && start.column === end.column ) {
			return;
		}

		var startDt = dt.cell( ':eq('+start.row+')', start.column+':visible', {page:'current'} );

		// If Editor is active inside this cell (inline editing) we need to wait for Editor to
		// submit and then we can loop back and trigger the fill.
		if ( $('div.DTE', startDt.node()).length ) {
			var editor = dt.editor();

			editor
				.on( 'submitSuccess.dtaf close.dtaf', function () {
					editor.off( '.dtaf');

					setTimeout( function () {
						that._mouseup( e );
					}, 100 );
				} )
				.on( 'submitComplete.dtaf preSubmitCancelled.dtaf close.dtaf', function () {
					editor.off( '.dtaf');
				} );

			// Make the current input submit
			editor.submit();

			return;
		}

		// Build a matrix representation of the selected rows
		var rows       = this._range( start.row, end.row );
		var columns    = this._range( start.column, end.column );
		var selected   = [];
		var dtSettings = dt.settings()[0];
		var dtColumns  = dtSettings.aoColumns;
		var enabledColumns = dt.columns( this.c.columns ).indexes();

		// Can't use Array.prototype.map as IE8 doesn't support it
		// Can't use $.map as jQuery flattens 2D arrays
		// Need to use a good old fashioned for loop
		for ( var rowIdx=0 ; rowIdx<rows.length ; rowIdx++ ) {
			selected.push(
				$.map( columns, function (column) {
					var row = dt.row( ':eq('+rows[rowIdx]+')', {page:'current'} ); // Workaround for M581
					var cell = dt.cell( row.index(), column+':visible' );
					var data = cell.data();
					var cellIndex = cell.index();
					var editField = dtColumns[ cellIndex.column ].editField;

					if ( editField !== undefined ) {
						data = dtSettings.oApi._fnGetObjectDataFn( editField )( dt.row( cellIndex.row ).data() );
					}

					if ( enabledColumns.indexOf(cellIndex.column) === -1 ) {
						return;
					}

					return {
						cell:  cell,
						data:  data,
						label: cell.data(),
						index: cellIndex
					};
				} )
			);
		}

		this._actionSelector( selected );
		
		// Stop shiftScroll
		clearInterval( this.s.scrollInterval );
		this.s.scrollInterval = null;
	},


	/**
	 * Create an array with a range of numbers defined by the start and end
	 * parameters passed in (inclusive!).
	 * 
	 * @param  {integer} start Start
	 * @param  {integer} end   End
	 * @private
	 */
	_range: function ( start, end )
	{
		var out = [];
		var i;

		if ( start <= end ) {
			for ( i=start ; i<=end ; i++ ) {
				out.push( i );
			}
		}
		else {
			for ( i=start ; i>=end ; i-- ) {
				out.push( i );
			}
		}

		return out;
	},


	/**
	 * Move the window and DataTables scrolling during a drag to scroll new
	 * content into view. This is done by proximity to the edge of the scrolling
	 * container of the mouse - for example near the top edge of the window
	 * should scroll up. This is a little complicated as there are two elements
	 * that can be scrolled - the window and the DataTables scrolling view port
	 * (if scrollX and / or scrollY is enabled).
	 *
	 * @param  {object} e Mouse move event object
	 * @private
	 */
	_shiftScroll: function ( e )
	{
		var that = this;
		var dt = this.s.dt;
		var scroll = this.s.scroll;
		var runInterval = false;
		var scrollSpeed = 5;
		var buffer = 65;

		// Different values if using a touchscreen
		var pageX = !e.type.includes('touch') ? e.pageX - window.scrollX :e.touches[0].clientX;
		var pageY = !e.type.includes('touch') ? e.pageY - window.scrollY :e.touches[0].clientY;
		var
			windowY = pageY,
			windowX = pageX,
			windowVert, windowHoriz,
			dtVert, dtHoriz;

		// Window calculations - based on the mouse position in the window,
		// regardless of scrolling
		if ( windowY < buffer ) {
			windowVert = scrollSpeed * -1;
		}
		else if ( windowY > scroll.windowHeight - buffer ) {
			windowVert = scrollSpeed;
		}

		if ( windowX < buffer ) {
			windowHoriz = scrollSpeed * -1;
		}
		else if ( windowX > scroll.windowWidth - buffer ) {
			windowHoriz = scrollSpeed;
		}

		// DataTables scrolling calculations - based on the table's position in
		// the document and the mouse position on the page
		if ( scroll.dtTop !== null && pageY < scroll.dtTop + buffer ) {
			dtVert = scrollSpeed * -1;
		}
		else if ( scroll.dtTop !== null && pageY > scroll.dtTop + scroll.dtHeight - buffer ) {
			dtVert = scrollSpeed;
		}

		if ( scroll.dtLeft !== null && pageX < scroll.dtLeft + buffer ) {
			dtHoriz = scrollSpeed * -1;
		}
		else if ( scroll.dtLeft !== null && pageX > scroll.dtLeft + scroll.dtWidth - buffer ) {
			dtHoriz = scrollSpeed;
		}

		// This is where it gets interesting. We want to continue scrolling
		// without requiring a mouse move, so we need an interval to be
		// triggered. The interval should continue until it is no longer needed,
		// but it must also use the latest scroll commands (for example consider
		// that the mouse might move from scrolling up to scrolling left, all
		// with the same interval running. We use the `scroll` object to "pass"
		// this information to the interval. Can't use local variables as they
		// wouldn't be the ones that are used by an already existing interval!
		if ( windowVert || windowHoriz || dtVert || dtHoriz ) {
			scroll.windowVert = windowVert;
			scroll.windowHoriz = windowHoriz;
			scroll.dtVert = dtVert;
			scroll.dtHoriz = dtHoriz;
			runInterval = true;
		}
		else if ( this.s.scrollInterval ) {
			// Don't need to scroll - remove any existing timer
			clearInterval( this.s.scrollInterval );
			this.s.scrollInterval = null;
		}

		// If we need to run the interval to scroll and there is no existing
		// interval (if there is an existing one, it will continue to run)
		if ( ! this.s.scrollInterval && runInterval ) {
			this.s.scrollInterval = setInterval( function () {
				// Don't need to worry about setting scroll <0 or beyond the
				// scroll bound as the browser will just reject that.
				window.scrollTo(window.scrollX + (scroll.windowHoriz ? scroll.windowHoriz : 0), window.scrollY + (scroll.windowVert ? scroll.windowVert : 0))

				// DataTables scrolling
				if ( scroll.dtVert || scroll.dtHoriz ) {
					var scroller = that.dom.dtScroll[0];

					if ( scroll.dtVert ) {
						scroller.scrollTop += scroll.dtVert;
					}
					if ( scroll.dtHoriz ) {
						scroller.scrollLeft += scroll.dtHoriz;
					}
				}
			}, 20 );
		}
	},


	/**
	 * Update the DataTable after the user has selected what they want to do
	 *
	 * @param  {false|undefined} result Return from the `execute` method - can
	 *   be false internally to do nothing. This is not documented for plug-ins
	 *   and is used only by the cancel option.
	 * @param {array} cells Information about the selected cells from the key
	 *     up function, argumented with the set values
	 * @private
	 */
	_update: function ( result, cells )
	{
		// Do nothing on `false` return from an execute function
		if ( result === false ) {
			return;
		}

		var dt = this.s.dt;
		var cell;
		var columns = dt.columns( this.c.columns ).indexes();

		// Potentially allow modifications to the cells matrix
		this._emitEvent( 'preAutoFill', [ dt, cells ] );

		this._editor( cells );

		// Automatic updates are not performed if `update` is null and the
		// `editor` parameter is passed in - the reason being that Editor will
		// update the data once submitted
		var update = this.c.update !== null ?
			this.c.update :
			this.c.editor ?
				false :
				true;

		if ( update ) {
			for ( var i=0, ien=cells.length ; i<ien ; i++ ) {
				for ( var j=0, jen=cells[i].length ; j<jen ; j++ ) {
					cell = cells[i][j];

					if ( columns.indexOf(cell.index.column) !== -1 ) {
						cell.cell.data( cell.set );
					}
				}
			}

			dt.draw(false);
		}

		this._emitEvent( 'autoFill', [ dt, cells ] );
	}
} );


/**
 * AutoFill actions. The options here determine how AutoFill will fill the data
 * in the table when the user has selected a range of cells. Please see the
 * documentation on the DataTables site for full details on how to create plug-
 * ins.
 *
 * @type {Object}
 */
AutoFill.actions = {
	increment: {
		available: function ( dt, cells ) {
			var d = cells[0][0].label;

			// is numeric test based on jQuery's old `isNumeric` function
			return !isNaN( d - parseFloat( d ) );
		},

		option: function ( dt, cells ) {
			return dt.i18n(
				'autoFill.increment',
				'Increment / decrement each cell by: <input type="number" value="1">'
			);
		},

		execute: function ( dt, cells, node ) {
			var value = cells[0][0].data * 1;
			var increment = $('input', node).val() * 1;

			for ( var i=0, ien=cells.length ; i<ien ; i++ ) {
				for ( var j=0, jen=cells[i].length ; j<jen ; j++ ) {
					cells[i][j].set = value;

					value += increment;
				}
			}
		}
	},

	fill: {
		available: function ( dt, cells ) {
			return true;
		},

		option: function ( dt, cells ) {
			return dt.i18n('autoFill.fill', 'Fill all cells with <i>%d</i>', cells[0][0].label );
		},

		execute: function ( dt, cells, node ) {
			var value = cells[0][0].data;

			for ( var i=0, ien=cells.length ; i<ien ; i++ ) {
				for ( var j=0, jen=cells[i].length ; j<jen ; j++ ) {
					cells[i][j].set = value;
				}
			}
		}
	},

	fillHorizontal: {
		available: function ( dt, cells ) {
			return cells.length > 1 && cells[0].length > 1;
		},

		option: function ( dt, cells ) {
			return dt.i18n('autoFill.fillHorizontal', 'Fill cells horizontally' );
		},

		execute: function ( dt, cells, node ) {
			for ( var i=0, ien=cells.length ; i<ien ; i++ ) {
				for ( var j=0, jen=cells[i].length ; j<jen ; j++ ) {
					cells[i][j].set = cells[i][0].data;
				}
			}
		}
	},

	fillVertical: {
		available: function ( dt, cells ) {
			return cells.length > 1;
		},

		option: function ( dt, cells ) {
			return dt.i18n('autoFill.fillVertical', 'Fill cells vertically' );
		},

		execute: function ( dt, cells, node ) {
			for ( var i=0, ien=cells.length ; i<ien ; i++ ) {
				for ( var j=0, jen=cells[i].length ; j<jen ; j++ ) {
					cells[i][j].set = cells[0][j].data;
				}
			}
		}
	},

	// Special type that does not make itself available, but is added
	// automatically by AutoFill if a multi-choice list is shown. This allows
	// sensible code reuse
	cancel: {
		available: function () {
			return false;
		},

		option: function ( dt ) {
			return dt.i18n('autoFill.cancel', 'Cancel' );
		},

		execute: function () {
			return false;
		}
	}
};


/**
 * AutoFill version
 * 
 * @static
 * @type      String
 */
AutoFill.version = '2.4.0';


/**
 * AutoFill defaults
 * 
 * @namespace
 */
AutoFill.defaults = {
	/** @type {Boolean} Ask user what they want to do, even for a single option */
	alwaysAsk: false,

	closeButton: true,

	/** @type {string|null} What will trigger a focus */
	focus: null, // focus, click, hover

	/** @type {column-selector} Columns to provide auto fill for */
	columns: '', // all

	/** @type {Boolean} Enable AutoFill on load */
	enable: true,

	/** @type {boolean|null} Update the cells after a drag */
	update: null, // false is editor given, true otherwise

	/** @type {DataTable.Editor} Editor instance for automatic submission */
	editor: null,

	/** @type {boolean} Enable vertical fill */
	vertical: true,

	/** @type {boolean} Enable horizontal fill */
	horizontal: true
};


/**
 * Classes used by AutoFill that are configurable
 * 
 * @namespace
 */
AutoFill.classes = {
	/** @type {String} Class used by the selection button */
	btn: 'btn',

	closeable: 'dtaf-popover-closeable'
};


/*
 * API
 */
var Api = $.fn.dataTable.Api;

// Doesn't do anything - Not documented
Api.register( 'autoFill()', function () {
	return this;
} );

Api.register( 'autoFill().enabled()', function () {
	var ctx = this.context[0];

	return ctx.autoFill ?
		ctx.autoFill.enabled() :
		false;
} );

Api.register( 'autoFill().enable()', function ( flag ) {
	return this.iterator( 'table', function ( ctx ) {
		if ( ctx.autoFill ) {
			ctx.autoFill.enable( flag );
		}
	} );
} );

Api.register( 'autoFill().disable()', function () {
	return this.iterator( 'table', function ( ctx ) {
		if ( ctx.autoFill ) {
			ctx.autoFill.disable();
		}
	} );
} );


// Attach a listener to the document which listens for DataTables initialisation
// events so we can automatically initialise
$(document).on( 'preInit.dt.autofill', function (e, settings, json) {
	if ( e.namespace !== 'dt' ) {
		return;
	}

	var init = settings.oInit.autoFill;
	var defaults = DataTable.defaults.autoFill;

	if ( init || defaults ) {
		var opts = $.extend( {}, init, defaults );

		if ( init !== false ) {
			new AutoFill( settings, opts  );
		}
	}
} );


// Alias for access
DataTable.AutoFill = AutoFill;
DataTable.AutoFill = AutoFill;


return AutoFill;
}));


/*! Bootstrap integration for DataTables' AutoFill
 * ©2015 SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net-bs4', 'datatables.net-autofill'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net-bs4')(root, $).$;
			}

			if ( ! $.fn.dataTable.AutoFill ) {
				require('datatables.net-autofill')(root, $);
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


DataTable.AutoFill.classes.btn = 'btn btn-primary';


return DataTable;
}));

/*! Buttons for DataTables 2.2.3
 * ©2016-2022 SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


// Used for namespacing events added to the document by each instance, so they
// can be removed on destroy
var _instCounter = 0;

// Button namespacing counter for namespacing events on individual buttons
var _buttonCounter = 0;

var _dtButtons = DataTable.ext.buttons;

// Allow for jQuery slim
function _fadeIn(el, duration, fn) {
	if ($.fn.animate) {
		el
			.stop()
			.fadeIn( duration, fn );

	}
	else {
		el.css('display', 'block');

		if (fn) {
			fn.call(el);
		}
	}
}

function _fadeOut(el, duration, fn) {
	if ($.fn.animate) {
		el
			.stop()
			.fadeOut( duration, fn );
	}
	else {
		el.css('display', 'none');
		
		if (fn) {
			fn.call(el);
		}
	}
}

/**
 * [Buttons description]
 * @param {[type]}
 * @param {[type]}
 */
var Buttons = function( dt, config )
{
	// If not created with a `new` keyword then we return a wrapper function that
	// will take the settings object for a DT. This allows easy use of new instances
	// with the `layout` option - e.g. `topLeft: $.fn.dataTable.Buttons( ... )`.
	if ( !(this instanceof Buttons) ) {
		return function (settings) {
			return new Buttons( settings, dt ).container();
		};
	}

	// If there is no config set it to an empty object
	if ( typeof( config ) === 'undefined' ) {
		config = {};	
	}
	
	// Allow a boolean true for defaults
	if ( config === true ) {
		config = {};
	}

	// For easy configuration of buttons an array can be given
	if ( Array.isArray( config ) ) {
		config = { buttons: config };
	}

	this.c = $.extend( true, {}, Buttons.defaults, config );

	// Don't want a deep copy for the buttons
	if ( config.buttons ) {
		this.c.buttons = config.buttons;
	}

	this.s = {
		dt: new DataTable.Api( dt ),
		buttons: [],
		listenKeys: '',
		namespace: 'dtb'+(_instCounter++)
	};

	this.dom = {
		container: $('<'+this.c.dom.container.tag+'/>')
			.addClass( this.c.dom.container.className )
	};

	this._constructor();
};


$.extend( Buttons.prototype, {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public methods
	 */

	/**
	 * Get the action of a button
	 * @param  {int|string} Button index
	 * @return {function}
	 *//**
	 * Set the action of a button
	 * @param  {node} node Button element
	 * @param  {function} action Function to set
	 * @return {Buttons} Self for chaining
	 */
	action: function ( node, action )
	{
		var button = this._nodeToButton( node );

		if ( action === undefined ) {
			return button.conf.action;
		}

		button.conf.action = action;

		return this;
	},

	/**
	 * Add an active class to the button to make to look active or get current
	 * active state.
	 * @param  {node} node Button element
	 * @param  {boolean} [flag] Enable / disable flag
	 * @return {Buttons} Self for chaining or boolean for getter
	 */
	active: function ( node, flag ) {
		var button = this._nodeToButton( node );
		var klass = this.c.dom.button.active;
		var jqNode = $(button.node);

		if ( flag === undefined ) {
			return jqNode.hasClass( klass );
		}

		jqNode.toggleClass( klass, flag === undefined ? true : flag );

		return this;
	},

	/**
	 * Add a new button
	 * @param {object} config Button configuration object, base string name or function
	 * @param {int|string} [idx] Button index for where to insert the button
	 * @param {boolean} [draw=true] Trigger a draw. Set a false when adding
	 *   lots of buttons, until the last button.
	 * @return {Buttons} Self for chaining
	 */
	add: function ( config, idx, draw )
	{
		var buttons = this.s.buttons;

		if ( typeof idx === 'string' ) {
			var split = idx.split('-');
			var base = this.s;

			for ( var i=0, ien=split.length-1 ; i<ien ; i++ ) {
				base = base.buttons[ split[i]*1 ];
			}

			buttons = base.buttons;
			idx = split[ split.length-1 ]*1;
		}

		this._expandButton(
			buttons,
			config,
			config !== undefined ? config.split : undefined,
			(config === undefined || config.split === undefined || config.split.length === 0) && base !== undefined,
			false,
			idx
		);

		if (draw === undefined || draw === true) {
			this._draw();
		}
	
		return this;
	},

	/**
	 * Clear buttons from a collection and then insert new buttons
	 */
	collectionRebuild: function ( node, newButtons )
	{
		var button = this._nodeToButton( node );
		
		if(newButtons !== undefined) {
			var i;
			// Need to reverse the array
			for (i=button.buttons.length-1; i>=0; i--) {
				this.remove(button.buttons[i].node);
			}
	
			for (i=0; i<newButtons.length; i++) {
				var newBtn = newButtons[i];

				this._expandButton(
					button.buttons,
					newBtn,
					newBtn !== undefined && newBtn.config !== undefined && newBtn.config.split !== undefined,
					true,
					newBtn.parentConf !== undefined && newBtn.parentConf.split !== undefined,
					i,
					newBtn.parentConf
				);
			}
		}

		this._draw(button.collection, button.buttons);
	},

	/**
	 * Get the container node for the buttons
	 * @return {jQuery} Buttons node
	 */
	container: function ()
	{
		return this.dom.container;
	},

	/**
	 * Disable a button
	 * @param  {node} node Button node
	 * @return {Buttons} Self for chaining
	 */
	disable: function ( node ) {
		var button = this._nodeToButton( node );

		$(button.node)
			.addClass( this.c.dom.button.disabled )
			.attr('disabled', true);

		return this;
	},

	/**
	 * Destroy the instance, cleaning up event handlers and removing DOM
	 * elements
	 * @return {Buttons} Self for chaining
	 */
	destroy: function ()
	{
		// Key event listener
		$('body').off( 'keyup.'+this.s.namespace );

		// Individual button destroy (so they can remove their own events if
		// needed). Take a copy as the array is modified by `remove`
		var buttons = this.s.buttons.slice();
		var i, ien;
		
		for ( i=0, ien=buttons.length ; i<ien ; i++ ) {
			this.remove( buttons[i].node );
		}

		// Container
		this.dom.container.remove();

		// Remove from the settings object collection
		var buttonInsts = this.s.dt.settings()[0];

		for ( i=0, ien=buttonInsts.length ; i<ien ; i++ ) {
			if ( buttonInsts.inst === this ) {
				buttonInsts.splice( i, 1 );
				break;
			}
		}

		return this;
	},

	/**
	 * Enable / disable a button
	 * @param  {node} node Button node
	 * @param  {boolean} [flag=true] Enable / disable flag
	 * @return {Buttons} Self for chaining
	 */
	enable: function ( node, flag )
	{
		if ( flag === false ) {
			return this.disable( node );
		}

		var button = this._nodeToButton( node );
		$(button.node)
			.removeClass( this.c.dom.button.disabled )
			.removeAttr('disabled');

		return this;
	},

	/**
	 * Get a button's index
	 * 
	 * This is internally recursive
	 * @param {element} node Button to get the index of
	 * @return {string} Button index
	 */
	index: function ( node, nested, buttons )
	{
		if ( ! nested ) {
			nested = '';
			buttons = this.s.buttons;
		}

		for ( var i=0, ien=buttons.length ; i<ien ; i++ ) {
			var inner = buttons[i].buttons;

			if (buttons[i].node === node) {
				return nested + i;
			}

			if ( inner && inner.length ) {
				var match = this.index(node, i + '-', inner);

				if (match !== null) {
					return match;
				}
			}
		}

		return null;
	},


	/**
	 * Get the instance name for the button set selector
	 * @return {string} Instance name
	 */
	name: function ()
	{
		return this.c.name;
	},

	/**
	 * Get a button's node of the buttons container if no button is given
	 * @param  {node} [node] Button node
	 * @return {jQuery} Button element, or container
	 */
	node: function ( node )
	{
		if ( ! node ) {
			return this.dom.container;
		}

		var button = this._nodeToButton( node );
		return $(button.node);
	},

	/**
	 * Set / get a processing class on the selected button
	 * @param {element} node Triggering button node
	 * @param  {boolean} flag true to add, false to remove, undefined to get
	 * @return {boolean|Buttons} Getter value or this if a setter.
	 */
	processing: function ( node, flag )
	{
		var dt = this.s.dt;
		var button = this._nodeToButton( node );

		if ( flag === undefined ) {
			return $(button.node).hasClass( 'processing' );
		}

		$(button.node).toggleClass( 'processing', flag );

		$(dt.table().node()).triggerHandler( 'buttons-processing.dt', [
			flag, dt.button( node ), dt, $(node), button.conf
		] );

		return this;
	},

	/**
	 * Remove a button.
	 * @param  {node} node Button node
	 * @return {Buttons} Self for chaining
	 */
	remove: function ( node )
	{
		var button = this._nodeToButton( node );
		var host = this._nodeToHost( node );
		var dt = this.s.dt;

		// Remove any child buttons first
		if ( button.buttons.length ) {
			for ( var i=button.buttons.length-1 ; i>=0 ; i-- ) {
				this.remove( button.buttons[i].node );
			}
		}

		button.conf.destroying = true;

		// Allow the button to remove event handlers, etc
		if ( button.conf.destroy ) {
			button.conf.destroy.call( dt.button(node), dt, $(node), button.conf );
		}

		this._removeKey( button.conf );

		$(button.node).remove();

		var idx = $.inArray( button, host );
		host.splice( idx, 1 );

		return this;
	},

	/**
	 * Get the text for a button
	 * @param  {int|string} node Button index
	 * @return {string} Button text
	 *//**
	 * Set the text for a button
	 * @param  {int|string|function} node Button index
	 * @param  {string} label Text
	 * @return {Buttons} Self for chaining
	 */
	text: function ( node, label )
	{
		var button = this._nodeToButton( node );
		var buttonLiner = this.c.dom.collection.buttonLiner;
		var linerTag = button.inCollection && buttonLiner && buttonLiner.tag ?
			buttonLiner.tag :
			this.c.dom.buttonLiner.tag;
		var dt = this.s.dt;
		var jqNode = $(button.node);
		var text = function ( opt ) {
			return typeof opt === 'function' ?
				opt( dt, jqNode, button.conf ) :
				opt;
		};

		if ( label === undefined ) {
			return text( button.conf.text );
		}

		button.conf.text = label;

		if ( linerTag ) {
			jqNode
				.children( linerTag )
				.eq(0)
				.filter(':not(.dt-down-arrow)')
				.html( text(label) );
		}
		else {
			jqNode.html( text(label) );
		}

		return this;
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Constructor
	 */

	/**
	 * Buttons constructor
	 * @private
	 */
	_constructor: function ()
	{
		var that = this;
		var dt = this.s.dt;
		var dtSettings = dt.settings()[0];
		var buttons =  this.c.buttons;

		if ( ! dtSettings._buttons ) {
			dtSettings._buttons = [];
		}

		dtSettings._buttons.push( {
			inst: this,
			name: this.c.name
		} );

		for ( var i=0, ien=buttons.length ; i<ien ; i++ ) {
			this.add( buttons[i] );
		}

		dt.on( 'destroy', function ( e, settings ) {
			if ( settings === dtSettings ) {
				that.destroy();
			}
		} );

		// Global key event binding to listen for button keys
		$('body').on( 'keyup.'+this.s.namespace, function ( e ) {
			if ( ! document.activeElement || document.activeElement === document.body ) {
				// SUse a string of characters for fast lookup of if we need to
				// handle this
				var character = String.fromCharCode(e.keyCode).toLowerCase();

				if ( that.s.listenKeys.toLowerCase().indexOf( character ) !== -1 ) {
					that._keypress( character, e );
				}
			}
		} );
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private methods
	 */

	/**
	 * Add a new button to the key press listener
	 * @param {object} conf Resolved button configuration object
	 * @private
	 */
	_addKey: function ( conf )
	{
		if ( conf.key ) {
			this.s.listenKeys += $.isPlainObject( conf.key ) ?
				conf.key.key :
				conf.key;
		}
	},

	/**
	 * Insert the buttons into the container. Call without parameters!
	 * @param  {node} [container] Recursive only - Insert point
	 * @param  {array} [buttons] Recursive only - Buttons array
	 * @private
	 */
	_draw: function ( container, buttons )
	{
		if ( ! container ) {
			container = this.dom.container;
			buttons = this.s.buttons;
		}

		container.children().detach();

		for ( var i=0, ien=buttons.length ; i<ien ; i++ ) {
			container.append( buttons[i].inserter );
			container.append( ' ' );

			if ( buttons[i].buttons && buttons[i].buttons.length ) {
				this._draw( buttons[i].collection, buttons[i].buttons );
			}
		}
	},

	/**
	 * Create buttons from an array of buttons
	 * @param  {array} attachTo Buttons array to attach to
	 * @param  {object} button Button definition
	 * @param  {boolean} inCollection true if the button is in a collection
	 * @private
	 */
	_expandButton: function ( attachTo, button, split, inCollection, inSplit, attachPoint, parentConf )
	{
		var dt = this.s.dt;
		var buttonCounter = 0;
		var isSplit = false;
		var buttons = ! Array.isArray( button ) ?
			[ button ] :
			button;
		
		if(button === undefined ) {
			buttons = !Array.isArray(split) ?
				[ split ] :
				split;
		}

		if (button !== undefined && button.split !== undefined) {
			isSplit = true;
		}
			
		for ( var i=0, ien=buttons.length ; i<ien ; i++ ) {
			var conf = this._resolveExtends( buttons[i] );

			if ( ! conf ) {
				continue;
			}

			if( conf.config !== undefined && conf.config.split) {
				isSplit = true;
			}
			else {
				isSplit = false;
			}
			
			// If the configuration is an array, then expand the buttons at this
			// point
			if ( Array.isArray( conf ) ) {
				this._expandButton( attachTo, conf, built !== undefined && built.conf !== undefined ? built.conf.split : undefined, inCollection, parentConf !== undefined && parentConf.split !== undefined, attachPoint, parentConf );
				continue;
			}

			var built = this._buildButton( conf, inCollection, conf.split !== undefined || (conf.config !== undefined && conf.config.split !== undefined), inSplit );
			if ( ! built ) {
				continue;
			}

			if ( attachPoint !== undefined && attachPoint !== null ) {
				attachTo.splice( attachPoint, 0, built );
				attachPoint++;
			}
			else {
				attachTo.push( built );
			}

			
			if ( built.conf.buttons || built.conf.split ) {
				built.collection = $('<'+(isSplit ? this.c.dom.splitCollection.tag : this.c.dom.collection.tag)+'/>');

				built.conf._collection = built.collection;

				if(built.conf.split) {
					for(var j = 0; j < built.conf.split.length; j++) {
						if(typeof built.conf.split[j] === "object") {
							built.conf.split[j].parent = parentConf;
							if(built.conf.split[j].collectionLayout === undefined) {
								built.conf.split[j].collectionLayout = built.conf.collectionLayout;
							}
							if(built.conf.split[j].dropup === undefined) {
								built.conf.split[j].dropup = built.conf.dropup;
							}
							if(built.conf.split[j].fade === undefined) {
								built.conf.split[j].fade = built.conf.fade;
							}
						}
					}
				}
				else {
					$(built.node).append($('<span class="dt-down-arrow">'+this.c.dom.splitDropdown.text+'</span>'))
				}

				this._expandButton( built.buttons, built.conf.buttons, built.conf.split, !isSplit, isSplit, attachPoint, built.conf );
			}
			built.conf.parent = parentConf;

			// init call is made here, rather than buildButton as it needs to
			// be selectable, and for that it needs to be in the buttons array
			if ( conf.init ) {
				conf.init.call( dt.button( built.node ), dt, $(built.node), conf );
			}

			buttonCounter++;
		}
	},

	/**
	 * Create an individual button
	 * @param  {object} config            Resolved button configuration
	 * @param  {boolean} inCollection `true` if a collection button
	 * @return {jQuery} Created button node (jQuery)
	 * @private
	 */
	_buildButton: function ( config, inCollection, isSplit, inSplit )
	{
		var buttonDom = this.c.dom.button;
		var linerDom = this.c.dom.buttonLiner;
		var collectionDom = this.c.dom.collection;
		var splitDom = this.c.dom.split;
		var splitCollectionDom = this.c.dom.splitCollection;
		var splitDropdownButton = this.c.dom.splitDropdownButton;
		var dt = this.s.dt;
		var text = function ( opt ) {
			return typeof opt === 'function' ?
				opt( dt, button, config ) :
				opt;
		};

		// Spacers don't do much other than insert an element into the DOM
		if (config.spacer) {
			var spacer = $('<span></span>')
				.addClass('dt-button-spacer ' + config.style + ' ' + buttonDom.spacerClass)
				.html(text(config.text));

			return {
				conf:         config,
				node:         spacer,
				inserter:     spacer,
				buttons:      [],
				inCollection: inCollection,
				isSplit:	  isSplit,
				inSplit:	  inSplit,
				collection:   null
			};
		}

		if ( !isSplit && inSplit && splitCollectionDom ) {
			buttonDom = splitDropdownButton;
		}
		else if ( !isSplit && inCollection && collectionDom.button ) {
			buttonDom = collectionDom.button;
		} 

		if ( !isSplit && inSplit && splitCollectionDom.buttonLiner ) {
			linerDom = splitCollectionDom.buttonLiner
		}
		else if ( !isSplit && inCollection && collectionDom.buttonLiner ) {
			linerDom = collectionDom.buttonLiner;
		}

		// Make sure that the button is available based on whatever requirements
		// it has. For example, PDF button require pdfmake
		if ( config.available && ! config.available( dt, config ) && !config.hasOwnProperty('html') ) {
			return false;
		}

		var button;
		if(!config.hasOwnProperty('html')) {
			var action = function ( e, dt, button, config ) {
				config.action.call( dt.button( button ), e, dt, button, config );
	
				$(dt.table().node()).triggerHandler( 'buttons-action.dt', [
					dt.button( button ), dt, button, config 
				] );
			};

			var tag = config.tag || buttonDom.tag;
			var clickBlurs = config.clickBlurs === undefined
				? true :
				config.clickBlurs;

			button = $('<'+tag+'/>')
				.addClass( buttonDom.className )
				.addClass( inSplit ? this.c.dom.splitDropdownButton.className : '')
				.attr( 'tabindex', this.s.dt.settings()[0].iTabIndex )
				.attr( 'aria-controls', this.s.dt.table().node().id )
				.on( 'click.dtb', function (e) {
					e.preventDefault();
	
					if ( ! button.hasClass( buttonDom.disabled ) && config.action ) {
						action( e, dt, button, config );
					}
					if( clickBlurs ) {
						button.trigger('blur');
					}
				} )
				.on( 'keypress.dtb', function (e) {
					if ( e.keyCode === 13 ) {
						e.preventDefault();

						if ( ! button.hasClass( buttonDom.disabled ) && config.action ) {
							action( e, dt, button, config );
						}
					}
				} );
	
			// Make `a` tags act like a link
			if ( tag.toLowerCase() === 'a' ) {
				button.attr( 'href', '#' );
			}
	
			// Button tags should have `type=button` so they don't have any default behaviour
			if ( tag.toLowerCase() === 'button' ) {
				button.attr( 'type', 'button' );
			}
	
			if ( linerDom.tag ) {
				var liner = $('<'+linerDom.tag+'/>')
					.html( text( config.text ) )
					.addClass( linerDom.className );
	
				if ( linerDom.tag.toLowerCase() === 'a' ) {
					liner.attr( 'href', '#' );
				}
	
				button.append( liner );
			}
			else {
				button.html( text( config.text ) );
			}
	
			if ( config.enabled === false ) {
				button.addClass( buttonDom.disabled );
			}
	
			if ( config.className ) {
				button.addClass( config.className );
			}
	
			if ( config.titleAttr ) {
				button.attr( 'title', text( config.titleAttr ) );
			}
	
			if ( config.attr ) {
				button.attr( config.attr );
			}
	
			if ( ! config.namespace ) {
				config.namespace = '.dt-button-'+(_buttonCounter++);
			}

			if  ( config.config !== undefined && config.config.split ) {
				config.split = config.config.split;
			}
		}
		else {
			button = $(config.html)
		}
	
		var buttonContainer = this.c.dom.buttonContainer;
		var inserter;
		if ( buttonContainer && buttonContainer.tag ) {
			inserter = $('<'+buttonContainer.tag+'/>')
				.addClass( buttonContainer.className )
				.append( button );
		}
		else {
			inserter = button;
		}

		this._addKey( config );

		// Style integration callback for DOM manipulation
		// Note that this is _not_ documented. It is currently
		// for style integration only
		if( this.c.buttonCreated ) {
			inserter = this.c.buttonCreated( config, inserter );
		}

		var splitDiv;
		if(isSplit) {
			splitDiv = $('<div/>').addClass(this.c.dom.splitWrapper.className)
			splitDiv.append(button);
			var dropButtonConfig = $.extend(config, {
				text: this.c.dom.splitDropdown.text,
				className: this.c.dom.splitDropdown.className,
				closeButton: false,
				attr: {
					'aria-haspopup': 'dialog',
					'aria-expanded': false
				},
				align: this.c.dom.splitDropdown.align,
				splitAlignClass: this.c.dom.splitDropdown.splitAlignClass
				
			})

			this._addKey(dropButtonConfig);

			var splitAction = function ( e, dt, button, config ) {
				_dtButtons.split.action.call( dt.button($('div.dt-btn-split-wrapper')[0] ), e, dt, button, config );
	
				$(dt.table().node()).triggerHandler( 'buttons-action.dt', [
					dt.button( button ), dt, button, config 
				] );
				button.attr('aria-expanded', true)
			};
			
			var dropButton = $('<button class="' + this.c.dom.splitDropdown.className + ' dt-button"><span class="dt-btn-split-drop-arrow">'+this.c.dom.splitDropdown.text+'</span></button>')
				.on( 'click.dtb', function (e) {
					e.preventDefault();
					e.stopPropagation();

					if ( ! dropButton.hasClass( buttonDom.disabled )) {
						splitAction( e, dt, dropButton, dropButtonConfig );
					}
					if ( clickBlurs ) {
						dropButton.trigger('blur');
					}
				} )
				.on( 'keypress.dtb', function (e) {
					if ( e.keyCode === 13 ) {
						e.preventDefault();

						if ( ! dropButton.hasClass( buttonDom.disabled ) ) {
							splitAction( e, dt, dropButton, dropButtonConfig );
						}
					}
				} );

			if(config.split.length === 0) {
				dropButton.addClass('dtb-hide-drop');
			}

			splitDiv.append(dropButton).attr(dropButtonConfig.attr);
		}

		return {
			conf:         config,
			node:         isSplit ? splitDiv.get(0) : button.get(0),
			inserter:     isSplit ? splitDiv : inserter,
			buttons:      [],
			inCollection: inCollection,
			isSplit:	  isSplit,
			inSplit:	  inSplit,
			collection:   null
		};
	},

	/**
	 * Get the button object from a node (recursive)
	 * @param  {node} node Button node
	 * @param  {array} [buttons] Button array, uses base if not defined
	 * @return {object} Button object
	 * @private
	 */
	_nodeToButton: function ( node, buttons )
	{
		if ( ! buttons ) {
			buttons = this.s.buttons;
		}

		for ( var i=0, ien=buttons.length ; i<ien ; i++ ) {
			if ( buttons[i].node === node ) {
				return buttons[i];
			}

			if ( buttons[i].buttons.length ) {
				var ret = this._nodeToButton( node, buttons[i].buttons );

				if ( ret ) {
					return ret;
				}
			}
		}
	},

	/**
	 * Get container array for a button from a button node (recursive)
	 * @param  {node} node Button node
	 * @param  {array} [buttons] Button array, uses base if not defined
	 * @return {array} Button's host array
	 * @private
	 */
	_nodeToHost: function ( node, buttons )
	{
		if ( ! buttons ) {
			buttons = this.s.buttons;
		}

		for ( var i=0, ien=buttons.length ; i<ien ; i++ ) {
			if ( buttons[i].node === node ) {
				return buttons;
			}

			if ( buttons[i].buttons.length ) {
				var ret = this._nodeToHost( node, buttons[i].buttons );

				if ( ret ) {
					return ret;
				}
			}
		}
	},

	/**
	 * Handle a key press - determine if any button's key configured matches
	 * what was typed and trigger the action if so.
	 * @param  {string} character The character pressed
	 * @param  {object} e Key event that triggered this call
	 * @private
	 */
	_keypress: function ( character, e )
	{
		// Check if this button press already activated on another instance of Buttons
		if ( e._buttonsHandled ) {
			return;
		}

		var run = function ( conf, node ) {
			if ( ! conf.key ) {
				return;
			}

			if ( conf.key === character ) {
				e._buttonsHandled = true;
				$(node).click();
			}
			else if ( $.isPlainObject( conf.key ) ) {
				if ( conf.key.key !== character ) {
					return;
				}

				if ( conf.key.shiftKey && ! e.shiftKey ) {
					return;
				}

				if ( conf.key.altKey && ! e.altKey ) {
					return;
				}

				if ( conf.key.ctrlKey && ! e.ctrlKey ) {
					return;
				}

				if ( conf.key.metaKey && ! e.metaKey ) {
					return;
				}

				// Made it this far - it is good
				e._buttonsHandled = true;
				$(node).click();
			}
		};

		var recurse = function ( a ) {
			for ( var i=0, ien=a.length ; i<ien ; i++ ) {
				run( a[i].conf, a[i].node );

				if ( a[i].buttons.length ) {
					recurse( a[i].buttons );
				}
			}
		};

		recurse( this.s.buttons );
	},

	/**
	 * Remove a key from the key listener for this instance (to be used when a
	 * button is removed)
	 * @param  {object} conf Button configuration
	 * @private
	 */
	_removeKey: function ( conf )
	{
		if ( conf.key ) {
			var character = $.isPlainObject( conf.key ) ?
				conf.key.key :
				conf.key;

			// Remove only one character, as multiple buttons could have the
			// same listening key
			var a = this.s.listenKeys.split('');
			var idx = $.inArray( character, a );
			a.splice( idx, 1 );
			this.s.listenKeys = a.join('');
		}
	},

	/**
	 * Resolve a button configuration
	 * @param  {string|function|object} conf Button config to resolve
	 * @return {object} Button configuration
	 * @private
	 */
	_resolveExtends: function ( conf )
	{
		var that = this;
		var dt = this.s.dt;
		var i, ien;
		var toConfObject = function ( base ) {
			var loop = 0;

			// Loop until we have resolved to a button configuration, or an
			// array of button configurations (which will be iterated
			// separately)
			while ( ! $.isPlainObject(base) && ! Array.isArray(base) ) {
				if ( base === undefined ) {
					return;
				}

				if ( typeof base === 'function' ) {
					base = base.call( that, dt, conf );

					if ( ! base ) {
						return false;
					}
				}
				else if ( typeof base === 'string' ) {
					if ( ! _dtButtons[ base ] ) {
						return {html: base}
					}

					base = _dtButtons[ base ];
				}

				loop++;
				if ( loop > 30 ) {
					// Protect against misconfiguration killing the browser
					throw 'Buttons: Too many iterations';
				}
			}

			return Array.isArray( base ) ?
				base :
				$.extend( {}, base );
		};

		conf = toConfObject( conf );

		while ( conf && conf.extend ) {
			// Use `toConfObject` in case the button definition being extended
			// is itself a string or a function
			if ( ! _dtButtons[ conf.extend ] ) {
				throw 'Cannot extend unknown button type: '+conf.extend;
			}

			var objArray = toConfObject( _dtButtons[ conf.extend ] );
			if ( Array.isArray( objArray ) ) {
				return objArray;
			}
			else if ( ! objArray ) {
				// This is a little brutal as it might be possible to have a
				// valid button without the extend, but if there is no extend
				// then the host button would be acting in an undefined state
				return false;
			}

			// Stash the current class name
			var originalClassName = objArray.className;

			if (conf.config !== undefined && objArray.config !== undefined) {
				conf.config = $.extend({}, objArray.config, conf.config)
			}

			conf = $.extend( {}, objArray, conf );

			// The extend will have overwritten the original class name if the
			// `conf` object also assigned a class, but we want to concatenate
			// them so they are list that is combined from all extended buttons
			if ( originalClassName && conf.className !== originalClassName ) {
				conf.className = originalClassName+' '+conf.className;
			}

			// Buttons to be added to a collection  -gives the ability to define
			// if buttons should be added to the start or end of a collection
			var postfixButtons = conf.postfixButtons;
			if ( postfixButtons ) {
				if ( ! conf.buttons ) {
					conf.buttons = [];
				}

				for ( i=0, ien=postfixButtons.length ; i<ien ; i++ ) {
					conf.buttons.push( postfixButtons[i] );
				}

				conf.postfixButtons = null;
			}

			var prefixButtons = conf.prefixButtons;
			if ( prefixButtons ) {
				if ( ! conf.buttons ) {
					conf.buttons = [];
				}

				for ( i=0, ien=prefixButtons.length ; i<ien ; i++ ) {
					conf.buttons.splice( i, 0, prefixButtons[i] );
				}

				conf.prefixButtons = null;
			}

			// Although we want the `conf` object to overwrite almost all of
			// the properties of the object being extended, the `extend`
			// property should come from the object being extended
			conf.extend = objArray.extend;
		}

		return conf;
	},

	/**
	 * Display (and replace if there is an existing one) a popover attached to a button
	 * @param {string|node} content Content to show
	 * @param {DataTable.Api} hostButton DT API instance of the button
	 * @param {object} inOpts Options (see object below for all options)
	 */
	_popover: function ( content, hostButton, inOpts, e ) {
		var dt = hostButton;
		var buttonsSettings = this.c;
		var closed = false;
		var options = $.extend( {
			align: 'button-left', // button-right, dt-container, split-left, split-right
			autoClose: false,
			background: true,
			backgroundClassName: 'dt-button-background',
			closeButton: true,
			contentClassName: buttonsSettings.dom.collection.className,
			collectionLayout: '',
			collectionTitle: '',
			dropup: false,
			fade: 400,
			popoverTitle: '',
			rightAlignClassName: 'dt-button-right',
			tag: buttonsSettings.dom.collection.tag
		}, inOpts );

		var hostNode = hostButton.node();

		var close = function () {
			closed = true;

			_fadeOut(
				$('.dt-button-collection'),
				options.fade,
				function () {
					$(this).detach();
				}
			);

			$(dt.buttons( '[aria-haspopup="dialog"][aria-expanded="true"]' ).nodes())
				.attr('aria-expanded', 'false');

			$('div.dt-button-background').off( 'click.dtb-collection' );
			Buttons.background( false, options.backgroundClassName, options.fade, hostNode );

			$(window).off('resize.resize.dtb-collection');
			$('body').off( '.dtb-collection' );
			dt.off( 'buttons-action.b-internal' );
			dt.off( 'destroy' );
		};

		if (content === false) {
			close();
			return;
		}

		var existingExpanded = $(dt.buttons( '[aria-haspopup="dialog"][aria-expanded="true"]' ).nodes());
		if ( existingExpanded.length ) {
			// Reuse the current position if the button that was triggered is inside an existing collection
			if (hostNode.closest('div.dt-button-collection').length) {
				hostNode = existingExpanded.eq(0);
			}

			close();
		}

		// Try to be smart about the layout
		var cnt = $('.dt-button', content).length;
		var mod = '';

		if (cnt === 3) {
			mod = 'dtb-b3';
		}
		else if (cnt === 2) {
			mod = 'dtb-b2';
		}
		else if (cnt === 1) {
			mod = 'dtb-b1';
		}

		var display = $('<div/>')
			.addClass('dt-button-collection')
			.addClass(options.collectionLayout)
			.addClass(options.splitAlignClass)
			.addClass(mod)
			.css('display', 'none')
			.attr({
				'aria-modal': true,
				role: 'dialog'
			});

		content = $(content)
			.addClass(options.contentClassName)
			.attr('role', 'menu')
			.appendTo(display);

		hostNode.attr( 'aria-expanded', 'true' );

		if ( hostNode.parents('body')[0] !== document.body ) {
			hostNode = document.body.lastChild;
		}

		if ( options.popoverTitle ) {
			display.prepend('<div class="dt-button-collection-title">'+options.popoverTitle+'</div>');
		}
		else if ( options.collectionTitle ) {
			display.prepend('<div class="dt-button-collection-title">'+options.collectionTitle+'</div>');
		}

		if (options.closeButton) {
			display.prepend('<div class="dtb-popover-close">x</div>').addClass('dtb-collection-closeable')
		}

		_fadeIn( display.insertAfter( hostNode ), options.fade );

		var tableContainer = $( hostButton.table().container() );
		var position = display.css( 'position' );

		if ( options.span === 'container' || options.align === 'dt-container' ) {
			hostNode = hostNode.parent();
			display.css('width', tableContainer.width());
		}

		// Align the popover relative to the DataTables container
		// Useful for wide popovers such as SearchPanes
		if (position === 'absolute') {
			// Align relative to the host button
			var offsetParent = $(hostNode[0].offsetParent);
			var buttonPosition = hostNode.position();
			var buttonOffset = hostNode.offset();
			var tableSizes = offsetParent.offset();
			var containerPosition = offsetParent.position();
			var computed = window.getComputedStyle(offsetParent[0]);

			tableSizes.height = offsetParent.outerHeight();
			tableSizes.width = offsetParent.width() + parseFloat(computed.paddingLeft);
			tableSizes.right = tableSizes.left + tableSizes.width;
			tableSizes.bottom = tableSizes.top + tableSizes.height;

			// Set the initial position so we can read height / width
			var top = buttonPosition.top + hostNode.outerHeight();
			var left = buttonPosition.left;

			display.css( {
				top: top,
				left: left
			} );

			// Get the popover position
			computed = window.getComputedStyle(display[0]);
			var popoverSizes = display.offset();

			popoverSizes.height = display.outerHeight();
			popoverSizes.width = display.outerWidth();
			popoverSizes.right = popoverSizes.left + popoverSizes.width;
			popoverSizes.bottom = popoverSizes.top + popoverSizes.height;
			popoverSizes.marginTop = parseFloat(computed.marginTop);
			popoverSizes.marginBottom = parseFloat(computed.marginBottom);

			// First position per the class requirements - pop up and right align
			if (options.dropup) {
				top = buttonPosition.top - popoverSizes.height - popoverSizes.marginTop - popoverSizes.marginBottom;
			}

			if (options.align === 'button-right' || display.hasClass( options.rightAlignClassName )) {
				left = buttonPosition.left - popoverSizes.width + hostNode.outerWidth(); 
			}

			// Container alignment - make sure it doesn't overflow the table container
			if (options.align === 'dt-container' || options.align === 'container') {
				if (left < buttonPosition.left) {
					left = -buttonPosition.left;
				}

				if (left + popoverSizes.width > tableSizes.width) {
					left = tableSizes.width - popoverSizes.width;
				}
			}

			// Window adjustment
			if (containerPosition.left + left + popoverSizes.width > $(window).width()) {
				// Overflowing the document to the right
				left = $(window).width() - popoverSizes.width - containerPosition.left;
			}

			if (buttonOffset.left + left < 0) {
				// Off to the left of the document
				left = -buttonOffset.left;
			}

			if (containerPosition.top + top + popoverSizes.height > $(window).height() + $(window).scrollTop()) {
				// Pop up if otherwise we'd need the user to scroll down
				top = buttonPosition.top - popoverSizes.height - popoverSizes.marginTop - popoverSizes.marginBottom;
			}

			if (containerPosition.top + top < $(window).scrollTop()) {
				// Correction for when the top is beyond the top of the page
				top = buttonPosition.top + hostNode.outerHeight();
			}

			// Calculations all done - now set it
			display.css( {
				top: top,
				left: left
			} );
		}
		else {
			// Fix position - centre on screen
			var position = function () {
				var half = $(window).height() / 2;

				var top = display.height() / 2;
				if ( top > half ) {
					top = half;
				}

				display.css( 'marginTop', top*-1 );
			};

			position();

			$(window).on('resize.dtb-collection', function () {
				position();
			});
		}

		if ( options.background ) {
			Buttons.background(
				true,
				options.backgroundClassName,
				options.fade,
				options.backgroundHost || hostNode
			);
		}

		// This is bonkers, but if we don't have a click listener on the
		// background element, iOS Safari will ignore the body click
		// listener below. An empty function here is all that is
		// required to make it work...
		$('div.dt-button-background').on( 'click.dtb-collection', function () {} );

		if ( options.autoClose ) {
			setTimeout( function () {
				dt.on( 'buttons-action.b-internal', function (e, btn, dt, node) {
					if ( node[0] === hostNode[0] ) {
						return;
					}
					close();
				} );
			}, 0);
		}
		
		$(display).trigger('buttons-popover.dt');


		dt.on('destroy', close);

		setTimeout(function() {
			closed = false;
			$('body')
				.on( 'click.dtb-collection', function (e) {
					if (closed) {
						return;
					}

					// andSelf is deprecated in jQ1.8, but we want 1.7 compat
					var back = $.fn.addBack ? 'addBack' : 'andSelf';
					var parent = $(e.target).parent()[0];
	
					if (( ! $(e.target).parents()[back]().filter( content ).length  && !$(parent).hasClass('dt-buttons')) || $(e.target).hasClass('dt-button-background')) {
						close();
					}
				} )
				.on( 'keyup.dtb-collection', function (e) {
					if ( e.keyCode === 27 ) {
						close();
					}
				} )
				.on( 'keydown.dtb-collection', function (e) {
					// Focus trap for tab key
					var elements = $('a, button', content);
					var active = document.activeElement;

					if (e.keyCode !== 9) { // tab
						return;
					}

					if (elements.index(active) === -1) {
						// If current focus is not inside the popover
						elements.first().focus();
						e.preventDefault();
					}
					else if (e.shiftKey) {
						// Reverse tabbing order when shift key is pressed
						if (active === elements[0]) {
							elements.last().focus();
							e.preventDefault();
						}
					}
					else {
						if (active === elements.last()[0]) {
							elements.first().focus();
							e.preventDefault();
						}
					}
				} );
		}, 0);
	}
} );



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Statics
 */

/**
 * Show / hide a background layer behind a collection
 * @param  {boolean} Flag to indicate if the background should be shown or
 *   hidden 
 * @param  {string} Class to assign to the background
 * @static
 */
Buttons.background = function ( show, className, fade, insertPoint ) {
	if ( fade === undefined ) {
		fade = 400;
	}
	if ( ! insertPoint ) {
		insertPoint = document.body;
	}

	if ( show ) {
		_fadeIn(
			$('<div/>')
				.addClass( className )
				.css( 'display', 'none' )
				.insertAfter( insertPoint ),
			fade
		);
	}
	else {
		_fadeOut(
			$('div.'+className),
			fade,
			function () {
				$(this)
					.removeClass( className )
					.remove();
			}
		);
	}
};

/**
 * Instance selector - select Buttons instances based on an instance selector
 * value from the buttons assigned to a DataTable. This is only useful if
 * multiple instances are attached to a DataTable.
 * @param  {string|int|array} Instance selector - see `instance-selector`
 *   documentation on the DataTables site
 * @param  {array} Button instance array that was attached to the DataTables
 *   settings object
 * @return {array} Buttons instances
 * @static
 */
Buttons.instanceSelector = function ( group, buttons )
{
	if ( group === undefined || group === null ) {
		return $.map( buttons, function ( v ) {
			return v.inst;
		} );
	}

	var ret = [];
	var names = $.map( buttons, function ( v ) {
		return v.name;
	} );

	// Flatten the group selector into an array of single options
	var process = function ( input ) {
		if ( Array.isArray( input ) ) {
			for ( var i=0, ien=input.length ; i<ien ; i++ ) {
				process( input[i] );
			}
			return;
		}

		if ( typeof input === 'string' ) {
			if ( input.indexOf( ',' ) !== -1 ) {
				// String selector, list of names
				process( input.split(',') );
			}
			else {
				// String selector individual name
				var idx = $.inArray( input.trim(), names );

				if ( idx !== -1 ) {
					ret.push( buttons[ idx ].inst );
				}
			}
		}
		else if ( typeof input === 'number' ) {
			// Index selector
			ret.push( buttons[ input ].inst );
		}
		else if ( typeof input === 'object' ) {
			// Actual instance selector
			ret.push( input );
		}
	};
	
	process( group );

	return ret;
};

/**
 * Button selector - select one or more buttons from a selector input so some
 * operation can be performed on them.
 * @param  {array} Button instances array that the selector should operate on
 * @param  {string|int|node|jQuery|array} Button selector - see
 *   `button-selector` documentation on the DataTables site
 * @return {array} Array of objects containing `inst` and `idx` properties of
 *   the selected buttons so you know which instance each button belongs to.
 * @static
 */
Buttons.buttonSelector = function ( insts, selector )
{
	var ret = [];
	var nodeBuilder = function ( a, buttons, baseIdx ) {
		var button;
		var idx;

		for ( var i=0, ien=buttons.length ; i<ien ; i++ ) {
			button = buttons[i];

			if ( button ) {
				idx = baseIdx !== undefined ?
					baseIdx+i :
					i+'';

				a.push( {
					node: button.node,
					name: button.conf.name,
					idx:  idx
				} );

				if ( button.buttons ) {
					nodeBuilder( a, button.buttons, idx+'-' );
				}
			}
		}
	};

	var run = function ( selector, inst ) {
		var i, ien;
		var buttons = [];
		nodeBuilder( buttons, inst.s.buttons );

		var nodes = $.map( buttons, function (v) {
			return v.node;
		} );

		if ( Array.isArray( selector ) || selector instanceof $ ) {
			for ( i=0, ien=selector.length ; i<ien ; i++ ) {
				run( selector[i], inst );
			}
			return;
		}

		if ( selector === null || selector === undefined || selector === '*' ) {
			// Select all
			for ( i=0, ien=buttons.length ; i<ien ; i++ ) {
				ret.push( {
					inst: inst,
					node: buttons[i].node
				} );
			}
		}
		else if ( typeof selector === 'number' ) {
			// Main button index selector
			if (inst.s.buttons[ selector ]) {
				ret.push( {
					inst: inst,
					node: inst.s.buttons[ selector ].node
				} );
			}
		}
		else if ( typeof selector === 'string' ) {
			if ( selector.indexOf( ',' ) !== -1 ) {
				// Split
				var a = selector.split(',');

				for ( i=0, ien=a.length ; i<ien ; i++ ) {
					run( a[i].trim(), inst );
				}
			}
			else if ( selector.match( /^\d+(\-\d+)*$/ ) ) {
				// Sub-button index selector
				var indexes = $.map( buttons, function (v) {
					return v.idx;
				} );

				ret.push( {
					inst: inst,
					node: buttons[ $.inArray( selector, indexes ) ].node
				} );
			}
			else if ( selector.indexOf( ':name' ) !== -1 ) {
				// Button name selector
				var name = selector.replace( ':name', '' );

				for ( i=0, ien=buttons.length ; i<ien ; i++ ) {
					if ( buttons[i].name === name ) {
						ret.push( {
							inst: inst,
							node: buttons[i].node
						} );
					}
				}
			}
			else {
				// jQuery selector on the nodes
				$( nodes ).filter( selector ).each( function () {
					ret.push( {
						inst: inst,
						node: this
					} );
				} );
			}
		}
		else if ( typeof selector === 'object' && selector.nodeName ) {
			// Node selector
			var idx = $.inArray( selector, nodes );

			if ( idx !== -1 ) {
				ret.push( {
					inst: inst,
					node: nodes[ idx ]
				} );
			}
		}
	};


	for ( var i=0, ien=insts.length ; i<ien ; i++ ) {
		var inst = insts[i];

		run( selector, inst );
	}

	return ret;
};

/**
 * Default function used for formatting output data.
 * @param {*} str Data to strip
 */
Buttons.stripData = function ( str, config ) {
	if ( typeof str !== 'string' ) {
		return str;
	}

	// Always remove script tags
	str = str.replace( /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '' );

	// Always remove comments
	str = str.replace( /<!\-\-.*?\-\->/g, '' );

	if ( ! config || config.stripHtml ) {
		str = str.replace( /<[^>]*>/g, '' );
	}

	if ( ! config || config.trim ) {
		str = str.replace( /^\s+|\s+$/g, '' );
	}

	if ( ! config || config.stripNewlines ) {
		str = str.replace( /\n/g, ' ' );
	}

	if ( ! config || config.decodeEntities ) {
		_exportTextarea.innerHTML = str;
		str = _exportTextarea.value;
	}

	return str;
};


/**
 * Buttons defaults. For full documentation, please refer to the docs/option
 * directory or the DataTables site.
 * @type {Object}
 * @static
 */
Buttons.defaults = {
	buttons: [ 'copy', 'excel', 'csv', 'pdf', 'print' ],
	name: 'main',
	tabIndex: 0,
	dom: {
		container: {
			tag: 'div',
			className: 'dt-buttons'
		},
		collection: {
			tag: 'div',
			className: ''
		},
		button: {
			tag: 'button',
			className: 'dt-button',
			active: 'active',
			disabled: 'disabled',
			spacerClass: ''
		},
		buttonLiner: {
			tag: 'span',
			className: ''
		},
		split: {
			tag: 'div',
			className: 'dt-button-split',
		},
		splitWrapper: {
			tag: 'div',
			className: 'dt-btn-split-wrapper',
		},
		splitDropdown: {
			tag: 'button',
			text: '&#x25BC;',
			className: 'dt-btn-split-drop',
			align: 'split-right',
			splitAlignClass: 'dt-button-split-left'
		},
		splitDropdownButton: {
			tag: 'button',
			className: 'dt-btn-split-drop-button dt-button',
		},
		splitCollection: {
			tag: 'div',
			className: 'dt-button-split-collection',
		}
	}
};

/**
 * Version information
 * @type {string}
 * @static
 */
Buttons.version = '2.2.3';


$.extend( _dtButtons, {
	collection: {
		text: function ( dt ) {
			return dt.i18n( 'buttons.collection', 'Collection' );
		},
		className: 'buttons-collection',
		closeButton: false,
		init: function ( dt, button, config ) {
			button.attr( 'aria-expanded', false );
		},
		action: function ( e, dt, button, config ) {
			if ( config._collection.parents('body').length ) {
				this.popover(false, config);
			}
			else {
				this.popover(config._collection, config);
			}

			// When activated using a key - auto focus on the
			// first item in the popover
			if (e.type === 'keypress') {
				$('a, button', config._collection).eq(0).focus();
			}
		},
		attr: {
			'aria-haspopup': 'dialog'
		}
		// Also the popover options, defined in Buttons.popover
	},
	split: {
		text: function ( dt ) {
			return dt.i18n( 'buttons.split', 'Split' );
		},
		className: 'buttons-split',
		closeButton: false,
		init: function ( dt, button, config ) {
			return button.attr( 'aria-expanded', false );
		},
		action: function ( e, dt, button, config ) {
			this.popover(config._collection, config);
		},
		attr: {
			'aria-haspopup': 'dialog'
		}
		// Also the popover options, defined in Buttons.popover
	},
	copy: function ( dt, conf ) {
		if ( _dtButtons.copyHtml5 ) {
			return 'copyHtml5';
		}
	},
	csv: function ( dt, conf ) {
		if ( _dtButtons.csvHtml5 && _dtButtons.csvHtml5.available( dt, conf ) ) {
			return 'csvHtml5';
		}
	},
	excel: function ( dt, conf ) {
		if ( _dtButtons.excelHtml5 && _dtButtons.excelHtml5.available( dt, conf ) ) {
			return 'excelHtml5';
		}
	},
	pdf: function ( dt, conf ) {
		if ( _dtButtons.pdfHtml5 && _dtButtons.pdfHtml5.available( dt, conf ) ) {
			return 'pdfHtml5';
		}
	},
	pageLength: function ( dt ) {
		var lengthMenu = dt.settings()[0].aLengthMenu;
		var vals = [];
		var lang = [];
		var text = function ( dt ) {
			return dt.i18n( 'buttons.pageLength', {
				"-1": 'Show all rows',
				_:    'Show %d rows'
			}, dt.page.len() );
		};

		// Support for DataTables 1.x 2D array
		if (Array.isArray( lengthMenu[0] )) {
			vals = lengthMenu[0];
			lang = lengthMenu[1];
		}
		else {
			for (var i=0 ; i<lengthMenu.length ; i++) {
				var option = lengthMenu[i];

				// Support for DataTables 2 object in the array
				if ($.isPlainObject(option)) {
					vals.push(option.value);
					lang.push(option.label);
				}
				else {
					vals.push(option);
					lang.push(option);
				}
			}
		}

		return {
			extend: 'collection',
			text: text,
			className: 'buttons-page-length',
			autoClose: true,
			buttons: $.map( vals, function ( val, i ) {
				return {
					text: lang[i],
					className: 'button-page-length',
					action: function ( e, dt ) {
						dt.page.len( val ).draw();
					},
					init: function ( dt, node, conf ) {
						var that = this;
						var fn = function () {
							that.active( dt.page.len() === val );
						};

						dt.on( 'length.dt'+conf.namespace, fn );
						fn();
					},
					destroy: function ( dt, node, conf ) {
						dt.off( 'length.dt'+conf.namespace );
					}
				};
			} ),
			init: function ( dt, node, conf ) {
				var that = this;
				dt.on( 'length.dt'+conf.namespace, function () {
					that.text( conf.text );
				} );
			},
			destroy: function ( dt, node, conf ) {
				dt.off( 'length.dt'+conf.namespace );
			}
		};
	},
	spacer: {
		style: 'empty',
		spacer: true,
		text: function ( dt ) {
			return dt.i18n( 'buttons.spacer', '' );
		}
	}
} );


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables API
 *
 * For complete documentation, please refer to the docs/api directory or the
 * DataTables site
 */

// Buttons group and individual button selector
DataTable.Api.register( 'buttons()', function ( group, selector ) {
	// Argument shifting
	if ( selector === undefined ) {
		selector = group;
		group = undefined;
	}

	this.selector.buttonGroup = group;

	var res = this.iterator( true, 'table', function ( ctx ) {
		if ( ctx._buttons ) {
			return Buttons.buttonSelector(
				Buttons.instanceSelector( group, ctx._buttons ),
				selector
			);
		}
	}, true );

	res._groupSelector = group;
	return res;
} );

// Individual button selector
DataTable.Api.register( 'button()', function ( group, selector ) {
	// just run buttons() and truncate
	var buttons = this.buttons( group, selector );

	if ( buttons.length > 1 ) {
		buttons.splice( 1, buttons.length );
	}

	return buttons;
} );

// Active buttons
DataTable.Api.registerPlural( 'buttons().active()', 'button().active()', function ( flag ) {
	if ( flag === undefined ) {
		return this.map( function ( set ) {
			return set.inst.active( set.node );
		} );
	}

	return this.each( function ( set ) {
		set.inst.active( set.node, flag );
	} );
} );

// Get / set button action
DataTable.Api.registerPlural( 'buttons().action()', 'button().action()', function ( action ) {
	if ( action === undefined ) {
		return this.map( function ( set ) {
			return set.inst.action( set.node );
		} );
	}

	return this.each( function ( set ) {
		set.inst.action( set.node, action );
	} );
} );

// Collection control
DataTable.Api.registerPlural( 'buttons().collectionRebuild()', 'button().collectionRebuild()', function ( buttons ) {
	return this.each( function ( set ) {
		for(var i = 0; i < buttons.length; i++) {
			if(typeof buttons[i] === 'object') {
				buttons[i].parentConf = set;
			}
		}
		set.inst.collectionRebuild( set.node, buttons );
	} );
} );

// Enable / disable buttons
DataTable.Api.register( ['buttons().enable()', 'button().enable()'], function ( flag ) {
	return this.each( function ( set ) {
		set.inst.enable( set.node, flag );
	} );
} );

// Disable buttons
DataTable.Api.register( ['buttons().disable()', 'button().disable()'], function () {
	return this.each( function ( set ) {
		set.inst.disable( set.node );
	} );
} );

// Button index
DataTable.Api.register( 'button().index()', function () {
	var idx = null;

	this.each( function ( set ) {
		var res = set.inst.index( set.node );

		if (res !== null) {
			idx = res;
		}
	} );

	return idx;
} );

// Get button nodes
DataTable.Api.registerPlural( 'buttons().nodes()', 'button().node()', function () {
	var jq = $();

	// jQuery will automatically reduce duplicates to a single entry
	$( this.each( function ( set ) {
		jq = jq.add( set.inst.node( set.node ) );
	} ) );

	return jq;
} );

// Get / set button processing state
DataTable.Api.registerPlural( 'buttons().processing()', 'button().processing()', function ( flag ) {
	if ( flag === undefined ) {
		return this.map( function ( set ) {
			return set.inst.processing( set.node );
		} );
	}

	return this.each( function ( set ) {
		set.inst.processing( set.node, flag );
	} );
} );

// Get / set button text (i.e. the button labels)
DataTable.Api.registerPlural( 'buttons().text()', 'button().text()', function ( label ) {
	if ( label === undefined ) {
		return this.map( function ( set ) {
			return set.inst.text( set.node );
		} );
	}

	return this.each( function ( set ) {
		set.inst.text( set.node, label );
	} );
} );

// Trigger a button's action
DataTable.Api.registerPlural( 'buttons().trigger()', 'button().trigger()', function () {
	return this.each( function ( set ) {
		set.inst.node( set.node ).trigger( 'click' );
	} );
} );

// Button resolver to the popover
DataTable.Api.register( 'button().popover()', function (content, options) {
	return this.map( function ( set ) {
		return set.inst._popover( content, this.button(this[0].node), options );
	} );
} );

// Get the container elements
DataTable.Api.register( 'buttons().containers()', function () {
	var jq = $();
	var groupSelector = this._groupSelector;

	// We need to use the group selector directly, since if there are no buttons
	// the result set will be empty
	this.iterator( true, 'table', function ( ctx ) {
		if ( ctx._buttons ) {
			var insts = Buttons.instanceSelector( groupSelector, ctx._buttons );

			for ( var i=0, ien=insts.length ; i<ien ; i++ ) {
				jq = jq.add( insts[i].container() );
			}
		}
	} );

	return jq;
} );

DataTable.Api.register( 'buttons().container()', function () {
	// API level of nesting is `buttons()` so we can zip into the containers method
	return this.containers().eq(0);
} );

// Add a new button
DataTable.Api.register( 'button().add()', function ( idx, conf, draw ) {
	var ctx = this.context;

	// Don't use `this` as it could be empty - select the instances directly
	if ( ctx.length ) {
		var inst = Buttons.instanceSelector( this._groupSelector, ctx[0]._buttons );

		if ( inst.length ) {
			inst[0].add( conf, idx , draw);
		}
	}

	return this.button( this._groupSelector, idx );
} );

// Destroy the button sets selected
DataTable.Api.register( 'buttons().destroy()', function () {
	this.pluck( 'inst' ).unique().each( function ( inst ) {
		inst.destroy();
	} );

	return this;
} );

// Remove a button
DataTable.Api.registerPlural( 'buttons().remove()', 'buttons().remove()', function () {
	this.each( function ( set ) {
		set.inst.remove( set.node );
	} );

	return this;
} );

// Information box that can be used by buttons
var _infoTimer;
DataTable.Api.register( 'buttons.info()', function ( title, message, time ) {
	var that = this;

	if ( title === false ) {
		this.off('destroy.btn-info');
		_fadeOut(
			$('#datatables_buttons_info'),
			400,
			function () {
				$(this).remove();
			}
		);
		clearTimeout( _infoTimer );
		_infoTimer = null;

		return this;
	}

	if ( _infoTimer ) {
		clearTimeout( _infoTimer );
	}

	if ( $('#datatables_buttons_info').length ) {
		$('#datatables_buttons_info').remove();
	}

	title = title ? '<h2>'+title+'</h2>' : '';

	_fadeIn(
		$('<div id="datatables_buttons_info" class="dt-button-info"/>')
			.html( title )
			.append( $('<div/>')[ typeof message === 'string' ? 'html' : 'append' ]( message ) )
			.css( 'display', 'none' )
			.appendTo( 'body' )
	);

	if ( time !== undefined && time !== 0 ) {
		_infoTimer = setTimeout( function () {
			that.buttons.info( false );
		}, time );
	}

	this.on('destroy.btn-info', function () {
		that.buttons.info(false);
	});

	return this;
} );

// Get data from the table for export - this is common to a number of plug-in
// buttons so it is included in the Buttons core library
DataTable.Api.register( 'buttons.exportData()', function ( options ) {
	if ( this.context.length ) {
		return _exportData( new DataTable.Api( this.context[0] ), options );
	}
} );

// Get information about the export that is common to many of the export data
// types (DRY)
DataTable.Api.register( 'buttons.exportInfo()', function ( conf ) {
	if ( ! conf ) {
		conf = {};
	}

	return {
		filename: _filename( conf ),
		title: _title( conf ),
		messageTop: _message(this, conf.message || conf.messageTop, 'top'),
		messageBottom: _message(this, conf.messageBottom, 'bottom')
	};
} );



/**
 * Get the file name for an exported file.
 *
 * @param {object}	config Button configuration
 * @param {boolean} incExtension Include the file name extension
 */
var _filename = function ( config )
{
	// Backwards compatibility
	var filename = config.filename === '*' && config.title !== '*' && config.title !== undefined && config.title !== null && config.title !== '' ?
		config.title :
		config.filename;

	if ( typeof filename === 'function' ) {
		filename = filename();
	}

	if ( filename === undefined || filename === null ) {
		return null;
	}

	if ( filename.indexOf( '*' ) !== -1 ) {
		filename = filename.replace( '*', $('head > title').text() ).trim();
	}

	// Strip characters which the OS will object to
	filename = filename.replace(/[^a-zA-Z0-9_\u00A1-\uFFFF\.,\-_ !\(\)]/g, "");

	var extension = _stringOrFunction( config.extension );
	if ( ! extension ) {
		extension = '';
	}

	return filename + extension;
};

/**
 * Simply utility method to allow parameters to be given as a function
 *
 * @param {undefined|string|function} option Option
 * @return {null|string} Resolved value
 */
var _stringOrFunction = function ( option )
{
	if ( option === null || option === undefined ) {
		return null;
	}
	else if ( typeof option === 'function' ) {
		return option();
	}
	return option;
};

/**
 * Get the title for an exported file.
 *
 * @param {object} config	Button configuration
 */
var _title = function ( config )
{
	var title = _stringOrFunction( config.title );

	return title === null ?
		null : title.indexOf( '*' ) !== -1 ?
			title.replace( '*', $('head > title').text() || 'Exported data' ) :
			title;
};

var _message = function ( dt, option, position )
{
	var message = _stringOrFunction( option );
	if ( message === null ) {
		return null;
	}

	var caption = $('caption', dt.table().container()).eq(0);
	if ( message === '*' ) {
		var side = caption.css( 'caption-side' );
		if ( side !== position ) {
			return null;
		}

		return caption.length ?
			caption.text() :
			'';
	}

	return message;
};




var _exportTextarea = $('<textarea/>')[0];
var _exportData = function ( dt, inOpts )
{
	var config = $.extend( true, {}, {
		rows:           null,
		columns:        '',
		modifier:       {
			search: 'applied',
			order:  'applied'
		},
		orthogonal:     'display',
		stripHtml:      true,
		stripNewlines:  true,
		decodeEntities: true,
		trim:           true,
		format:         {
			header: function ( d ) {
				return Buttons.stripData( d, config );
			},
			footer: function ( d ) {
				return Buttons.stripData( d, config );
			},
			body: function ( d ) {
				return Buttons.stripData( d, config );
			}
		},
		customizeData: null
	}, inOpts );

	var header = dt.columns( config.columns ).indexes().map( function (idx) {
		var el = dt.column( idx ).header();
		return config.format.header( el.innerHTML, idx, el );
	} ).toArray();

	var footer = dt.table().footer() ?
		dt.columns( config.columns ).indexes().map( function (idx) {
			var el = dt.column( idx ).footer();
			return config.format.footer( el ? el.innerHTML : '', idx, el );
		} ).toArray() :
		null;
	
	// If Select is available on this table, and any rows are selected, limit the export
	// to the selected rows. If no rows are selected, all rows will be exported. Specify
	// a `selected` modifier to control directly.
	var modifier = $.extend( {}, config.modifier );
	if ( dt.select && typeof dt.select.info === 'function' && modifier.selected === undefined ) {
		if ( dt.rows( config.rows, $.extend( { selected: true }, modifier ) ).any() ) {
			$.extend( modifier, { selected: true } )
		}
	}

	var rowIndexes = dt.rows( config.rows, modifier ).indexes().toArray();
	var selectedCells = dt.cells( rowIndexes, config.columns );
	var cells = selectedCells
		.render( config.orthogonal )
		.toArray();
	var cellNodes = selectedCells
		.nodes()
		.toArray();

	var columns = header.length;
	var rows = columns > 0 ? cells.length / columns : 0;
	var body = [];
	var cellCounter = 0;

	for ( var i=0, ien=rows ; i<ien ; i++ ) {
		var row = [ columns ];

		for ( var j=0 ; j<columns ; j++ ) {
			row[j] = config.format.body( cells[ cellCounter ], i, j, cellNodes[ cellCounter ] );
			cellCounter++;
		}

		body[i] = row;
	}

	var data = {
		header: header,
		footer: footer,
		body:   body
	};

	if ( config.customizeData ) {
		config.customizeData( data );
	}

	return data;
};


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables interface
 */

// Attach to DataTables objects for global access
$.fn.dataTable.Buttons = Buttons;
$.fn.DataTable.Buttons = Buttons;



// DataTables creation - check if the buttons have been defined for this table,
// they will have been if the `B` option was used in `dom`, otherwise we should
// create the buttons instance here so they can be inserted into the document
// using the API. Listen for `init` for compatibility with pre 1.10.10, but to
// be removed in future.
$(document).on( 'init.dt plugin-init.dt', function (e, settings) {
	if ( e.namespace !== 'dt' ) {
		return;
	}

	var opts = settings.oInit.buttons || DataTable.defaults.buttons;

	if ( opts && ! settings._buttons ) {
		new Buttons( settings, opts ).container();
	}
} );

function _init ( settings, options ) {
	var api = new DataTable.Api( settings );
	var opts = options
		? options
		: api.init().buttons || DataTable.defaults.buttons;

	return new Buttons( api, opts ).container();
}

// DataTables `dom` feature option
DataTable.ext.feature.push( {
	fnInit: _init,
	cFeature: "B"
} );

// DataTables 2 layout feature
if ( DataTable.ext.features ) {
	DataTable.ext.features.register( 'buttons', _init );
}


return Buttons;
}));


/*! Bootstrap integration for DataTables' Buttons
 * ©2016 SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net-bs4', 'datatables.net-buttons'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net-bs4')(root, $).$;
			}

			if ( ! $.fn.dataTable.Buttons ) {
				require('datatables.net-buttons')(root, $);
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;

$.extend( true, DataTable.Buttons.defaults, {
	dom: {
		container: {
			className: 'dt-buttons btn-group flex-wrap'
		},
		button: {
			className: 'btn btn-secondary'
		},
		collection: {
			tag: 'div',
			className: 'dropdown-menu',
			closeButton: false,
			button: {
				tag: 'a',
				className: 'dt-button dropdown-item',
				active: 'active',
				disabled: 'disabled'
			}
		},
		splitWrapper: {
			tag: 'div',
			className: 'dt-btn-split-wrapper btn-group',
			closeButton: false,
		},
		splitDropdown: {
			tag: 'button',
			text: '',
			className: 'btn btn-secondary dt-btn-split-drop dropdown-toggle dropdown-toggle-split',
			closeButton: false,
			align: 'split-left',
			splitAlignClass: 'dt-button-split-left'
		},
		splitDropdownButton: {
			tag: 'button',
			className: 'dt-btn-split-drop-button btn btn-secondary',
			closeButton: false
		} 
	},
	buttonCreated: function ( config, button ) {
		return config.buttons ?
			$('<div class="btn-group"/>').append(button) :
			button;
	}
} );

DataTable.ext.buttons.collection.className += ' dropdown-toggle';
DataTable.ext.buttons.collection.rightAlignClassName = 'dropdown-menu-right';

return DataTable.Buttons;
}));


/*!
 * Column visibility buttons for Buttons and DataTables.
 * 2016 SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net', 'datatables.net-buttons'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			if ( ! $.fn.dataTable.Buttons ) {
				require('datatables.net-buttons')(root, $);
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


$.extend( DataTable.ext.buttons, {
	// A collection of column visibility buttons
	colvis: function ( dt, conf ) {
		var node = null;
		var buttonConf = {
			extend: 'collection',
			init: function ( dt, n ) {
				node = n;
			},
			text: function ( dt ) {
				return dt.i18n( 'buttons.colvis', 'Column visibility' );
			},
			className: 'buttons-colvis',
			closeButton: false,
			buttons: [ {
				extend: 'columnsToggle',
				columns: conf.columns,
				columnText: conf.columnText
			} ]
		};

		// Rebuild the collection with the new column structure if columns are reordered
		dt.on( 'column-reorder.dt'+conf.namespace, function (e, settings, details) {
			// console.log(node);
			// console.log('node', dt.button(null, node).node());
			dt.button(null, dt.button(null, node).node()).collectionRebuild([{
				extend: 'columnsToggle',
				columns: conf.columns,
				columnText: conf.columnText
			}]);
		});

		return buttonConf;
	},

	// Selected columns with individual buttons - toggle column visibility
	columnsToggle: function ( dt, conf ) {
		var columns = dt.columns( conf.columns ).indexes().map( function ( idx ) {
			return {
				extend: 'columnToggle',
				columns: idx,
				columnText: conf.columnText
			};
		} ).toArray();

		return columns;
	},

	// Single button to toggle column visibility
	columnToggle: function ( dt, conf ) {
		return {
			extend: 'columnVisibility',
			columns: conf.columns,
			columnText: conf.columnText
		};
	},

	// Selected columns with individual buttons - set column visibility
	columnsVisibility: function ( dt, conf ) {
		var columns = dt.columns( conf.columns ).indexes().map( function ( idx ) {
			return {
				extend: 'columnVisibility',
				columns: idx,
				visibility: conf.visibility,
				columnText: conf.columnText
			};
		} ).toArray();

		return columns;
	},

	// Single button to set column visibility
	columnVisibility: {
		columns: undefined, // column selector
		text: function ( dt, button, conf ) {
			return conf._columnText( dt, conf );
		},
		className: 'buttons-columnVisibility',
		action: function ( e, dt, button, conf ) {
			var col = dt.columns( conf.columns );
			var curr = col.visible();

			col.visible( conf.visibility !== undefined ?
				conf.visibility :
				! (curr.length ? curr[0] : false )
			);
		},
		init: function ( dt, button, conf ) {
			var that = this;
			button.attr( 'data-cv-idx', conf.columns );

			dt
				.on( 'column-visibility.dt'+conf.namespace, function (e, settings) {
					if ( ! settings.bDestroying && settings.nTable == dt.settings()[0].nTable ) {
						that.active( dt.column( conf.columns ).visible() );
					}
				} )
				.on( 'column-reorder.dt'+conf.namespace, function (e, settings, details) {
					// Button has been removed from the DOM
					if ( conf.destroying ) {
						return;
					}

					if ( dt.columns( conf.columns ).count() !== 1 ) {
						return;
					}

					// This button controls the same column index but the text for the column has
					// changed
					that.text( conf._columnText( dt, conf ) );

					// Since its a different column, we need to check its visibility
					that.active( dt.column( conf.columns ).visible() );
				} );

			this.active( dt.column( conf.columns ).visible() );
		},
		destroy: function ( dt, button, conf ) {
			dt
				.off( 'column-visibility.dt'+conf.namespace )
				.off( 'column-reorder.dt'+conf.namespace );
		},

		_columnText: function ( dt, conf ) {
			// Use DataTables' internal data structure until this is presented
			// is a public API. The other option is to use
			// `$( column(col).node() ).text()` but the node might not have been
			// populated when Buttons is constructed.
			var idx = dt.column( conf.columns ).index();
			var title = dt.settings()[0].aoColumns[ idx ].sTitle;

			if (! title) {
				title = dt.column(idx).header().innerHTML;
			}

			title = title
				.replace(/\n/g," ")        // remove new lines
				.replace(/<br\s*\/?>/gi, " ")  // replace line breaks with spaces
				.replace(/<select(.*?)<\/select>/g, "") // remove select tags, including options text
				.replace(/<!\-\-.*?\-\->/g, "") // strip HTML comments
				.replace(/<.*?>/g, "")   // strip HTML
				.replace(/^\s+|\s+$/g,""); // trim

			return conf.columnText ?
				conf.columnText( dt, idx, title ) :
				title;
		}
	},


	colvisRestore: {
		className: 'buttons-colvisRestore',

		text: function ( dt ) {
			return dt.i18n( 'buttons.colvisRestore', 'Restore visibility' );
		},

		init: function ( dt, button, conf ) {
			conf._visOriginal = dt.columns().indexes().map( function ( idx ) {
				return dt.column( idx ).visible();
			} ).toArray();
		},

		action: function ( e, dt, button, conf ) {
			dt.columns().every( function ( i ) {
				// Take into account that ColReorder might have disrupted our
				// indexes
				var idx = dt.colReorder && dt.colReorder.transpose ?
					dt.colReorder.transpose( i, 'toOriginal' ) :
					i;

				this.visible( conf._visOriginal[ idx ] );
			} );
		}
	},


	colvisGroup: {
		className: 'buttons-colvisGroup',

		action: function ( e, dt, button, conf ) {
			dt.columns( conf.show ).visible( true, false );
			dt.columns( conf.hide ).visible( false, false );

			dt.columns.adjust();
		},

		show: [],

		hide: []
	}
} );


return DataTable.Buttons;
}));


/*! DateTime picker for DataTables.net v1.1.2
 *
 * © SpryMedia Ltd, all rights reserved.
 * License: MIT datatables.net/license/mit
 */

/**
 * @summary     DateTime picker for DataTables.net
 * @version     1.1.2
 * @file        dataTables.dateTime.js
 * @author      SpryMedia Ltd
 * @contact     www.datatables.net/contact
 */
(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';

// Supported formatting and parsing libraries:
// * Moment
// * Luxon
// * DayJS
var dateLib;

/*
 * This file provides a DateTime GUI picker (calendar and time input). Only the
 * format YYYY-MM-DD is supported without additional software, but the end user
 * experience can be greatly enhanced by including the momentjs, dayjs or luxon library
 * which provide date / time parsing and formatting options.
 *
 * This functionality is required because the HTML5 date and datetime input
 * types are not widely supported in desktop browsers.
 *
 * Constructed by using:
 *
 *     new DateTime( input, opts )
 *
 * where `input` is the HTML input element to use and `opts` is an object of
 * options based on the `DateTime.defaults` object.
 */
var DateTime = function ( input, opts ) {
	// Attempt to auto detect the formatting library (if there is one). Having it in
	// the constructor allows load order independence.
	if (typeof dateLib === 'undefined') {
		dateLib = window.moment
			? window.moment
			: window.dayjs
				? window.dayjs
				: window.luxon
					? window.luxon
					: null;
	}

	this.c = $.extend( true, {}, DateTime.defaults, opts );
	var classPrefix = this.c.classPrefix;
	var i18n = this.c.i18n;

	// Only IS8601 dates are supported without moment, dayjs or luxon
	if ( ! dateLib && this.c.format !== 'YYYY-MM-DD' ) {
		throw "DateTime: Without momentjs, dayjs or luxon only the format 'YYYY-MM-DD' can be used";
	}

	// Min and max need to be `Date` objects in the config
	if (typeof this.c.minDate === 'string') {
		this.c.minDate = new Date(this.c.minDate);
	}
	if (typeof this.c.maxDate === 'string') {
		this.c.maxDate = new Date(this.c.maxDate);
	}

	var timeBlock = function ( type ) {
		return '<div class="'+classPrefix+'-timeblock">'+
			'</div>';
	};

	var gap = function () {
		return '<span>:</span>';
	};

	// DOM structure
	var structure = $(
		'<div class="'+classPrefix+'">'+
			'<div class="'+classPrefix+'-date">'+
				'<div class="'+classPrefix+'-title">'+
					'<div class="'+classPrefix+'-iconLeft">'+
						'<button type="button" title="'+i18n.previous+'">'+i18n.previous+'</button>'+
					'</div>'+
					'<div class="'+classPrefix+'-iconRight">'+
						'<button type="button" title="'+i18n.next+'">'+i18n.next+'</button>'+
					'</div>'+
					'<div class="'+classPrefix+'-label">'+
						'<span></span>'+
						'<select class="'+classPrefix+'-month"></select>'+
					'</div>'+
					'<div class="'+classPrefix+'-label">'+
						'<span></span>'+
						'<select class="'+classPrefix+'-year"></select>'+
					'</div>'+
				'</div>'+
				'<div class="'+classPrefix+'-buttons">'+
					'<a class="'+classPrefix+'-clear">'+i18n.clear+'</a>'+
					'<a class="'+classPrefix+'-today">'+i18n.today+'</a>'+
				'</div>'+
				'<div class="'+classPrefix+'-calendar"></div>'+
			'</div>'+
			'<div class="'+classPrefix+'-time">'+
				'<div class="'+classPrefix+'-hours"></div>'+
				'<div class="'+classPrefix+'-minutes"></div>'+
				'<div class="'+classPrefix+'-seconds"></div>'+
			'</div>'+
			'<div class="'+classPrefix+'-error"></div>'+
		'</div>'
	);

	this.dom = {
		container: structure,
		date:      structure.find( '.'+classPrefix+'-date' ),
		title:     structure.find( '.'+classPrefix+'-title' ),
		calendar:  structure.find( '.'+classPrefix+'-calendar' ),
		time:      structure.find( '.'+classPrefix+'-time' ),
		error:     structure.find( '.'+classPrefix+'-error' ),
		buttons:     structure.find( '.'+classPrefix+'-buttons' ),
		clear:     structure.find( '.'+classPrefix+'-clear' ),
		today:     structure.find( '.'+classPrefix+'-today' ),
		input:     $(input)
	};

	this.s = {
		/** @type {Date} Date value that the picker has currently selected */
		d: null,

		/** @type {Date} Date of the calendar - might not match the value */
		display: null,

		/** @type {number} Used to select minutes in a range where the range base is itself unavailable */
		minutesRange: null,

		/** @type {number} Used to select minutes in a range where the range base is itself unavailable */
		secondsRange: null,

		/** @type {String} Unique namespace string for this instance */
		namespace: 'dateime-'+(DateTime._instance++),

		/** @type {Object} Parts of the picker that should be shown */
		parts: {
			date:    this.c.format.match( /[YMD]|L(?!T)|l/ ) !== null,
			time:    this.c.format.match( /[Hhm]|LT|LTS/ ) !== null,
			seconds: this.c.format.indexOf( 's' )   !== -1,
			hours12: this.c.format.match( /[haA]/ ) !== null
		}
	};

	this.dom.container
		.append( this.dom.date )
		.append( this.dom.time )
		.append( this.dom.error );

	this.dom.date
		.append( this.dom.title )
		.append( this.dom.buttons )
		.append( this.dom.calendar );

	this._constructor();
};

$.extend( DateTime.prototype, {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public
	 */
	
	/**
	 * Destroy the control
	 */
	destroy: function () {
		this._hide(true);
		this.dom.container.off().empty();
		this.dom.input
			.removeAttr('autocomplete')
			.off('.datetime');
	},

	errorMsg: function ( msg ) {
		var error = this.dom.error;

		if ( msg ) {
			error.html( msg );
		}
		else {
			error.empty();
		}

		return this;
	},

	hide: function () {
		this._hide();

		return this;
	},

	max: function ( date ) {
		this.c.maxDate = typeof date === 'string'
			? new Date(date)
			: date;

		this._optionsTitle();
		this._setCalander();

		return this;
	},

	min: function ( date ) {
		this.c.minDate = typeof date === 'string'
			? new Date(date)
			: date;

		this._optionsTitle();
		this._setCalander();

		return this;
	},

	/**
	 * Check if an element belongs to this control
	 *
	 * @param  {node} node Element to check
	 * @return {boolean}   true if owned by this control, false otherwise
	 */
	owns: function ( node ) {
		return $(node).parents().filter( this.dom.container ).length > 0;
	},

	/**
	 * Get / set the value
	 *
	 * @param  {string|Date} set   Value to set
	 * @param  {boolean} [write=true] Flag to indicate if the formatted value
	 *   should be written into the input element
	 */
	val: function ( set, write ) {
		if ( set === undefined ) {
			return this.s.d;
		}

		if ( set instanceof Date ) {
			this.s.d = this._dateToUtc( set );
		}
		else if ( set === null || set === '' ) {
			this.s.d = null;
		}
		else if ( set === '--now' ) {
			this.s.d = new Date();
		}
		else if ( typeof set === 'string' ) {
			// luxon uses different method names so need to be able to call them
			if(dateLib && dateLib == window.luxon) {
				var luxDT = dateLib.DateTime.fromFormat(set, this.c.format)
				this.s.d = luxDT.isValid ? luxDT.toJSDate() : null;
			}
			else if ( dateLib ) {
				// Use moment, dayjs or luxon if possible (even for ISO8601 strings, since it
				// will correctly handle 0000-00-00 and the like)
				var m = dateLib.utc( set, this.c.format, this.c.locale, this.c.strict );
				this.s.d = m.isValid() ? m.toDate() : null;
			}
			else {
				// Else must be using ISO8601 without a date library (constructor would
				// have thrown an error otherwise)
				var match = set.match(/(\d{4})\-(\d{2})\-(\d{2})/ );
				this.s.d = match ?
					new Date( Date.UTC(match[1], match[2]-1, match[3]) ) :
					null;
			}
		}

		if ( write || write === undefined ) {
			if ( this.s.d ) {
				this._writeOutput();
			}
			else {
				// The input value was not valid...
				this.dom.input.val( set );
			}
		}

		// Need something to display
		this.s.display = this.s.d
			? new Date( this.s.d.toString() )
			: new Date();

		// Set the day of the month to be 1 so changing between months doesn't
        // run into issues when going from day 31 to 28 (for example)
		this.s.display.setUTCDate( 1 );

		// Update the display elements for the new value
		this._setTitle();
		this._setCalander();
		this._setTime();

		return this;
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Constructor
	 */
	
	/**
	 * Build the control and assign initial event handlers
	 *
	 * @private
	 */
	_constructor: function () {
		var that = this;
		var classPrefix = this.c.classPrefix;
		var last = this.dom.input.val();

		var onChange = function () {
			var curr = that.dom.input.val();

			if (curr !== last) {
				that.c.onChange.call( that, curr, that.s.d, that.dom.input );
				last = curr;
			}
		};

		if ( ! this.s.parts.date ) {
			this.dom.date.css( 'display', 'none' );
		}

		if ( ! this.s.parts.time ) {
			this.dom.time.css( 'display', 'none' );
		}

		if ( ! this.s.parts.seconds ) {
			this.dom.time.children('div.'+classPrefix+'-seconds').remove();
			this.dom.time.children('span').eq(1).remove();
		}

		if ( ! this.c.buttons.clear ) {
			this.dom.clear.css( 'display', 'none' );
		}

		if ( ! this.c.buttons.today ) {
			this.dom.today.css( 'display', 'none' );
		}

		// Render the options
		this._optionsTitle();

		$(document).on('i18n.dt', function (e, settings) {
			if (settings.oLanguage.datetime) {
				$.extend(true, that.c.i18n, settings.oLanguage.datetime);
				that._optionsTitle();
			}
		});

		// When attached to a hidden input, we always show the input picker, and
		// do so inline
		if (this.dom.input.attr('type') === 'hidden') {
			this.dom.container.addClass('inline');
			this.c.attachTo = 'input';

			this.val( this.dom.input.val(), false );
			this._show();
		}

		// Set the initial value
		if (last) {
			this.val( last, false );
		}

		// Trigger the display of the widget when clicking or focusing on the
		// input element
		this.dom.input
			.attr('autocomplete', 'off')
			.on('focus.datetime click.datetime', function () {
				// If already visible - don't do anything
				if ( that.dom.container.is(':visible') || that.dom.input.is(':disabled') ) {
					return;
				}

				// In case the value has changed by text
				that.val( that.dom.input.val(), false );

				that._show();
			} )
			.on('keyup.datetime', function () {
				// Update the calendar's displayed value as the user types
				if ( that.dom.container.is(':visible') ) {
					that.val( that.dom.input.val(), false );
				}
			} );

		// Main event handlers for input in the widget
		this.dom.container
			.on( 'change', 'select', function () {
				var select = $(this);
				var val = select.val();

				if ( select.hasClass(classPrefix+'-month') ) {
					// Month select
					that._correctMonth( that.s.display, val );
					that._setTitle();
					that._setCalander();
				}
				else if ( select.hasClass(classPrefix+'-year') ) {
					// Year select
					that.s.display.setUTCFullYear( val );
					that._setTitle();
					that._setCalander();
				}
				else if ( select.hasClass(classPrefix+'-hours') || select.hasClass(classPrefix+'-ampm') ) {
					// Hours - need to take account of AM/PM input if present
					if ( that.s.parts.hours12 ) {
						var hours = $(that.dom.container).find('.'+classPrefix+'-hours').val() * 1;
						var pm = $(that.dom.container).find('.'+classPrefix+'-ampm').val() === 'pm';

						that.s.d.setUTCHours( hours === 12 && !pm ?
							0 :
							pm && hours !== 12 ?
								hours + 12 :
								hours
						);
					}
					else {
						that.s.d.setUTCHours( val );
					}

					that._setTime();
					that._writeOutput( true );

					onChange();
				}
				else if ( select.hasClass(classPrefix+'-minutes') ) {
					// Minutes select
					that.s.d.setUTCMinutes( val );
					that._setTime();
					that._writeOutput( true );

					onChange();
				}
				else if ( select.hasClass(classPrefix+'-seconds') ) {
					// Seconds select
					that.s.d.setSeconds( val );
					that._setTime();
					that._writeOutput( true );

					onChange();
				}

				that.dom.input.focus();
				that._position();
			} )
			.on( 'click', function (e) {
				var d = that.s.d;
				var nodeName = e.target.nodeName.toLowerCase();
				var target = nodeName === 'span' ?
					e.target.parentNode :
					e.target;

				nodeName = target.nodeName.toLowerCase();

				if ( nodeName === 'select' ) {
					return;
				}

				e.stopPropagation();

				if ( nodeName === 'a' ) {
					e.preventDefault();

					if ($(target).hasClass(classPrefix+'-clear')) {
						// Clear the value and don't change the display
						that.s.d = null;
						that.dom.input.val('');
						that._writeOutput();
						that._setCalander();
						that._setTime();

						onChange();
					}
					else if ($(target).hasClass(classPrefix+'-today')) {
						// Don't change the value, but jump to the month
						// containing today
						that.s.display = new Date();

						that._setTitle();
						that._setCalander();
					}
				}
				if ( nodeName === 'button' ) {
					var button = $(target);
					var parent = button.parent();

					if ( parent.hasClass('disabled') && ! parent.hasClass('range') ) {
						button.blur();
						return;
					}

					if ( parent.hasClass(classPrefix+'-iconLeft') ) {
						// Previous month
						that.s.display.setUTCMonth( that.s.display.getUTCMonth()-1 );
						that._setTitle();
						that._setCalander();

						that.dom.input.focus();
					}
					else if ( parent.hasClass(classPrefix+'-iconRight') ) {
						// Next month
						that._correctMonth( that.s.display, that.s.display.getUTCMonth()+1 );
						that._setTitle();
						that._setCalander();

						that.dom.input.focus();
					}
					else if ( button.parents('.'+classPrefix+'-time').length ) {
						var val = button.data('value');
						var unit = button.data('unit');

						d = that._needValue();

						if ( unit === 'minutes' ) {
							if ( parent.hasClass('disabled') && parent.hasClass('range') ) {
								that.s.minutesRange = val;
								that._setTime();
								return;
							}
							else {
								that.s.minutesRange = null;
							}
						}

						if ( unit === 'seconds' ) {
							if ( parent.hasClass('disabled') && parent.hasClass('range') ) {
								that.s.secondsRange = val;
								that._setTime();
								return;
							}
							else {
								that.s.secondsRange = null;
							}
						}

						// Specific to hours for 12h clock
						if ( val === 'am' ) {
							if ( d.getUTCHours() >= 12 ) {
								val = d.getUTCHours() - 12;
							}
							else {
								return;
							}
						}
						else if ( val === 'pm' ) {
							if ( d.getUTCHours() < 12 ) {
								val = d.getUTCHours() + 12;
							}
							else {
								return;
							}
						}

						var set = unit === 'hours' ?
							'setUTCHours' :
							unit === 'minutes' ?
								'setUTCMinutes' :
								'setSeconds';

						d[set]( val );
						that._setTime();
						that._writeOutput( true );
						onChange();
					}
					else {
						// Calendar click
						d = that._needValue();

						// Can't be certain that the current day will exist in
						// the new month, and likewise don't know that the
						// new day will exist in the old month, But 1 always
						// does, so we can change the month without worry of a
						// recalculation being done automatically by `Date`
						d.setUTCDate( 1 );
						d.setUTCFullYear( button.data('year') );
						d.setUTCMonth( button.data('month') );
						d.setUTCDate( button.data('day') );

						that._writeOutput( true );

						// Don't hide if there is a time picker, since we want to
						// be able to select a time as well.
						if ( ! that.s.parts.time ) {
							// This is annoying but IE has some kind of async
							// behaviour with focus and the focus from the above
							// write would occur after this hide - resulting in the
							// calendar opening immediately
							setTimeout( function () {
								that._hide();
							}, 10 );
						}
						else {
							that._setCalander();
						}

						onChange();
					}
				}
				else {
					// Click anywhere else in the widget - return focus to the
					// input element
					that.dom.input.focus();
				}
			} );
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private
	 */

	/**
	 * Compare the date part only of two dates - this is made super easy by the
	 * toDateString method!
	 *
	 * @param  {Date} a Date 1
	 * @param  {Date} b Date 2
	 * @private
	 */
	_compareDates: function( a, b ) {
		// Can't use toDateString as that converts to local time
		// luxon uses different method names so need to be able to call them
		return dateLib && dateLib == window.luxon
			? dateLib.DateTime.fromJSDate(a).toISODate() === dateLib.DateTime.fromJSDate(b).toISODate()
			: this._dateToUtcString(a) === this._dateToUtcString(b);
	},

	/**
	 * When changing month, take account of the fact that some months don't have
	 * the same number of days. For example going from January to February you
	 * can have the 31st of Jan selected and just add a month since the date
	 * would still be 31, and thus drop you into March.
	 *
	 * @param  {Date} date  Date - will be modified
	 * @param  {integer} month Month to set
	 * @private
	 */
	_correctMonth: function ( date, month ) {
		var days = this._daysInMonth( date.getUTCFullYear(), month );
		var correctDays = date.getUTCDate() > days;

		date.setUTCMonth( month );

		if ( correctDays ) {
			date.setUTCDate( days );
			date.setUTCMonth( month );
		}
	},

	/**
	 * Get the number of days in a method. Based on
	 * http://stackoverflow.com/a/4881951 by Matti Virkkunen
	 *
	 * @param  {integer} year  Year
	 * @param  {integer} month Month (starting at 0)
	 * @private
	 */
	_daysInMonth: function ( year, month ) {
		// 
		var isLeap = ((year % 4) === 0 && ((year % 100) !== 0 || (year % 400) === 0));
		var months = [31, (isLeap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

		return months[month];
	},

	/**
	 * Create a new date object which has the UTC values set to the local time.
	 * This allows the local time to be used directly for the library which
	 * always bases its calculations and display on UTC.
	 *
	 * @param  {Date} s Date to "convert"
	 * @return {Date}   Shifted date
	 */
	_dateToUtc: function ( s ) {
		return new Date( Date.UTC(
			s.getFullYear(), s.getMonth(), s.getDate(),
			s.getHours(), s.getMinutes(), s.getSeconds()
		) );
	},

	/**
	 * Create a UTC ISO8601 date part from a date object
	 *
	 * @param  {Date} d Date to "convert"
	 * @return {string} ISO formatted date
	 */
	_dateToUtcString: function ( d ) {
		// luxon uses different method names so need to be able to call them
		return dateLib && dateLib == window.luxon
			? dateLib.DateTime.fromJSDate(d).toISODate()
			: d.getUTCFullYear()+'-'+
				this._pad(d.getUTCMonth()+1)+'-'+
				this._pad(d.getUTCDate());
	},

	/**
	 * Hide the control and remove events related to its display
	 *
	 * @private
	 */
	_hide: function (destroy) {
		if (! destroy && this.dom.input.attr('type') === 'hidden') {
			return;
		}

		var namespace = this.s.namespace;

		this.dom.container.detach();

		$(window).off( '.'+namespace );
		$(document).off( 'keydown.'+namespace );
		$('div.dataTables_scrollBody').off( 'scroll.'+namespace );
		$('div.DTE_Body_Content').off( 'scroll.'+namespace );
		$('body').off( 'click.'+namespace );
		$(this.dom.input[0].offsetParent).off('.'+namespace);
	},

	/**
	 * Convert a 24 hour value to a 12 hour value
	 *
	 * @param  {integer} val 24 hour value
	 * @return {integer}     12 hour value
	 * @private
	 */
	_hours24To12: function ( val ) {
		return val === 0 ?
			12 :
			val > 12 ?
				val - 12 :
				val;
	},

	/**
	 * Generate the HTML for a single day in the calendar - this is basically
	 * and HTML cell with a button that has data attributes so we know what was
	 * clicked on (if it is clicked on) and a bunch of classes for styling.
	 *
	 * @param  {object} day Day object from the `_htmlMonth` method
	 * @return {string}     HTML cell
	 */
	_htmlDay: function( day )
	{
		if ( day.empty ) {
			return '<td class="empty"></td>';
		}

		var classes = [ 'selectable' ];
		var classPrefix = this.c.classPrefix;

		if ( day.disabled ) {
			classes.push( 'disabled' );
		}

		if ( day.today ) {
			classes.push( 'now' );
		}

		if ( day.selected ) {
			classes.push( 'selected' );
		}

		return '<td data-day="' + day.day + '" class="' + classes.join(' ') + '">' +
				'<button class="'+classPrefix+'-button '+classPrefix+'-day" type="button" ' +'data-year="' + day.year + '" data-month="' + day.month + '" data-day="' + day.day + '">' +
					'<span>'+day.day+'</span>'+
				'</button>' +
			'</td>';
	},


	/**
	 * Create the HTML for a month to be displayed in the calendar table.
	 * 
	 * Based upon the logic used in Pikaday - MIT licensed
	 * Copyright (c) 2014 David Bushell
	 * https://github.com/dbushell/Pikaday
	 *
	 * @param  {integer} year  Year
	 * @param  {integer} month Month (starting at 0)
	 * @return {string} Calendar month HTML
	 * @private
	 */
	_htmlMonth: function ( year, month ) {
		var now    = this._dateToUtc( new Date() ),
			days   = this._daysInMonth( year, month ),
			before = new Date( Date.UTC(year, month, 1) ).getUTCDay(),
			data   = [],
			row    = [];

		if ( this.c.firstDay > 0 ) {
			before -= this.c.firstDay;

			if (before < 0) {
				before += 7;
			}
		}

		var cells = days + before,
			after = cells;

		while ( after > 7 ) {
			after -= 7;
		}

		cells += 7 - after;

		var minDate = this.c.minDate;
		var maxDate = this.c.maxDate;

		if ( minDate ) {
			minDate.setUTCHours(0);
			minDate.setUTCMinutes(0);
			minDate.setSeconds(0);
		}

		if ( maxDate ) {
			maxDate.setUTCHours(23);
			maxDate.setUTCMinutes(59);
			maxDate.setSeconds(59);
		}

		for ( var i=0, r=0 ; i<cells ; i++ ) {
			var day      = new Date( Date.UTC(year, month, 1 + (i - before)) ),
				selected = this.s.d ? this._compareDates(day, this.s.d) : false,
				today    = this._compareDates(day, now),
				empty    = i < before || i >= (days + before),
				disabled = (minDate && day < minDate) ||
				           (maxDate && day > maxDate);

			var disableDays = this.c.disableDays;
			if ( Array.isArray( disableDays ) && $.inArray( day.getUTCDay(), disableDays ) !== -1 ) {
				disabled = true;
			}
			else if ( typeof disableDays === 'function' && disableDays( day ) === true ) {
				disabled = true;
			}

			var dayConfig = {
				day:      1 + (i - before),
				month:    month,
				year:     year,
				selected: selected,
				today:    today,
				disabled: disabled,
				empty:    empty
			};

			row.push( this._htmlDay(dayConfig) );

			if ( ++r === 7 ) {
				if ( this.c.showWeekNumber ) {
					row.unshift( this._htmlWeekOfYear(i - before, month, year) );
				}

				data.push( '<tr>'+row.join('')+'</tr>' );
				row = [];
				r = 0;
			}
		}

		var classPrefix = this.c.classPrefix;
		var className = classPrefix+'-table';
		if ( this.c.showWeekNumber ) {
			className += ' weekNumber';
		}

		// Show / hide month icons based on min/max
		if ( minDate ) {
			var underMin = minDate >= new Date( Date.UTC(year, month, 1, 0, 0, 0 ) );

			this.dom.title.find('div.'+classPrefix+'-iconLeft')
				.css( 'display', underMin ? 'none' : 'block' );
		}

		if ( maxDate ) {
			var overMax = maxDate < new Date( Date.UTC(year, month+1, 1, 0, 0, 0 ) );

			this.dom.title.find('div.'+classPrefix+'-iconRight')
				.css( 'display', overMax ? 'none' : 'block' );
		}

		return '<table class="'+className+'">' +
				'<thead>'+
					this._htmlMonthHead() +
				'</thead>'+
				'<tbody>'+
					data.join('') +
				'</tbody>'+
			'</table>';
	},

	/**
	 * Create the calendar table's header (week days)
	 *
	 * @return {string} HTML cells for the row
	 * @private
	 */
	_htmlMonthHead: function () {
		var a = [];
		var firstDay = this.c.firstDay;
		var i18n = this.c.i18n;

		// Take account of the first day shift
		var dayName = function ( day ) {
			day += firstDay;

			while (day >= 7) {
				day -= 7;
			}

			return i18n.weekdays[day];
		};
		
		// Empty cell in the header
		if ( this.c.showWeekNumber ) {
			a.push( '<th></th>' );
		}

		for ( var i=0 ; i<7 ; i++ ) {
			a.push( '<th>'+dayName( i )+'</th>' );
		}

		return a.join('');
	},

	/**
	 * Create a cell that contains week of the year - ISO8601
	 *
	 * Based on https://stackoverflow.com/questions/6117814/ and
	 * http://techblog.procurios.nl/k/n618/news/view/33796/14863/
	 *
	 * @param  {integer} d Day of month
	 * @param  {integer} m Month of year (zero index)
	 * @param  {integer} y Year
	 * @return {string}   
	 * @private
	 */
	_htmlWeekOfYear: function ( d, m, y ) {
		var date = new Date( y, m, d, 0, 0, 0, 0 );

		// First week of the year always has 4th January in it
		date.setDate( date.getDate() + 4 - (date.getDay() || 7) );

		var oneJan = new Date( y, 0, 1 );
		var weekNum = Math.ceil( ( ( (date - oneJan) / 86400000) + 1)/7 );

		return '<td class="'+this.c.classPrefix+'-week">' + weekNum + '</td>';
	},

	/**
	 * Check if the instance has a date object value - it might be null.
	 * If is doesn't set one to now.
	 * @returns A Date object
	 * @private
	 */
	_needValue: function () {
		if ( ! this.s.d ) {
			this.s.d = this._dateToUtc( new Date() );
		}

		return this.s.d;
	},

	/**
	 * Create option elements from a range in an array
	 *
	 * @param  {string} selector Class name unique to the select element to use
	 * @param  {array} values   Array of values
	 * @param  {array} [labels] Array of labels. If given must be the same
	 *   length as the values parameter.
	 * @private
	 */
	_options: function ( selector, values, labels ) {
		if ( ! labels ) {
			labels = values;
		}

		var select = this.dom.container.find('select.'+this.c.classPrefix+'-'+selector);
		select.empty();

		for ( var i=0, ien=values.length ; i<ien ; i++ ) {
			select.append( '<option value="'+values[i]+'">'+labels[i]+'</option>' );
		}
	},

	/**
	 * Set an option and update the option's span pair (since the select element
	 * has opacity 0 for styling)
	 *
	 * @param  {string} selector Class name unique to the select element to use
	 * @param  {*}      val      Value to set
	 * @private
	 */
	_optionSet: function ( selector, val ) {
		var select = this.dom.container.find('select.'+this.c.classPrefix+'-'+selector);
		var span = select.parent().children('span');

		select.val( val );

		var selected = select.find('option:selected');
		span.html( selected.length !== 0 ?
			selected.text() :
			this.c.i18n.unknown
		);
	},

	/**
	 * Create time options list.
	 *
	 * @param  {string} unit Time unit - hours, minutes or seconds
	 * @param  {integer} count Count range - 12, 24 or 60
	 * @param  {integer} val Existing value for this unit
	 * @param  {integer[]} allowed Values allow for selection
	 * @param  {integer} range Override range
	 * @private
	 */
	_optionsTime: function ( unit, count, val, allowed, range ) {
		var classPrefix = this.c.classPrefix;
		var container = this.dom.container.find('div.'+classPrefix+'-'+unit);
		var i, j;
		var render = count === 12 ?
			function (i) { return i; } :
			this._pad;
		var classPrefix = this.c.classPrefix;
		var className = classPrefix+'-table';
		var i18n = this.c.i18n;

		if ( ! container.length ) {
			return;
		}

		var a = '';
		var span = 10;
		var button = function (value, label, className) {
			// Shift the value for PM
			if ( count === 12 && typeof value === 'number' ) {
				if (val >= 12 ) {
					value += 12;
				}

				if (value == 12) {
					value = 0;
				}
				else if (value == 24) {
					value = 12;
				}
			}

			var selected = val === value || (value === 'am' && val < 12) || (value === 'pm' && val >= 12) ?
				'selected' :
				'';
			
			if (allowed && $.inArray(value, allowed) === -1) {
				selected += ' disabled';
			}

			if ( className ) {
				selected += ' '+className;
			}

			return '<td class="selectable '+selected+'">' +
				'<button class="'+classPrefix+'-button '+classPrefix+'-day" type="button" data-unit="'+unit+'" data-value="'+value+ '">' +
					'<span>'+label+'</span>'+
				'</button>' +
			'</td>';
		}

		if ( count === 12 ) {
			// Hours with AM/PM
			a += '<tr>';
			
			for ( i=1 ; i<=6 ; i++ ) {
				a += button(i, render(i));
			}
			a += button('am', i18n.amPm[0]);

			a += '</tr>';
			a += '<tr>';

			for ( i=7 ; i<=12 ; i++ ) {
				a += button(i, render(i));
			}
			a += button('pm', i18n.amPm[1]);
			a += '</tr>';

			span = 7;
		}
		else if ( count === 24 ) {
			// Hours - 24
			var c = 0;
			for (j=0 ; j<4 ; j++ ) {
				a += '<tr>';
				for ( i=0 ; i<6 ; i++ ) {
					a += button(c, render(c));
					c++;
				}
				a += '</tr>';
			}

			span = 6;
		}
		else {
			// Minutes and seconds
			a += '<tr>';
			for (j=0 ; j<60 ; j+=10 ) {
				a += button(j, render(j), 'range');
			}
			a += '</tr>';
			
			// Slight hack to allow for the different number of columns
			a += '</tbody></thead><table class="'+className+' '+className+'-nospace"><tbody>';

			var start = range !== null ?
				range :
				Math.floor( val / 10 )*10;

			a += '<tr>';
			for (j=start+1 ; j<start+10 ; j++ ) {
				a += button(j, render(j));
			}
			a += '</tr>';

			span = 6;
		}

		container
			.empty()
			.append(
				'<table class="'+className+'">'+
					'<thead><tr><th colspan="'+span+'">'+
						i18n[unit] +
					'</th></tr></thead>'+
					'<tbody>'+
						a+
					'</tbody>'+
				'</table>'
			);
	},

	/**
	 * Create the options for the month and year
	 *
	 * @param  {integer} year  Year
	 * @param  {integer} month Month (starting at 0)
	 * @private
	 */
	_optionsTitle: function () {
		var i18n = this.c.i18n;
		var min = this.c.minDate;
		var max = this.c.maxDate;
		var minYear = min ? min.getFullYear() : null;
		var maxYear = max ? max.getFullYear() : null;

		var i = minYear !== null ? minYear : new Date().getFullYear() - this.c.yearRange;
		var j = maxYear !== null ? maxYear : new Date().getFullYear() + this.c.yearRange;

		this._options( 'month', this._range( 0, 11 ), i18n.months );
		this._options( 'year', this._range( i, j ) );
	},

	/**
	 * Simple two digit pad
	 *
	 * @param  {integer} i      Value that might need padding
	 * @return {string|integer} Padded value
	 * @private
	 */
	_pad: function ( i ) {
		return i<10 ? '0'+i : i;
	},

	/**
	 * Position the calendar to look attached to the input element
	 * @private
	 */
	_position: function () {
		var offset = this.c.attachTo === 'input' ? this.dom.input.position() : this.dom.input.offset();
		var container = this.dom.container;
		var inputHeight = this.dom.input.outerHeight();

		if (container.hasClass('inline')) {
			container.insertAfter( this.dom.input );
			return;
		}

		if ( this.s.parts.date && this.s.parts.time && $(window).width() > 550 ) {
			container.addClass('horizontal');
		}
		else {
			container.removeClass('horizontal');
		}

		if(this.c.attachTo === 'input') {
			container
				.css( {
					top: offset.top + inputHeight,
					left: offset.left
				} )
				.insertAfter( this.dom.input );
		}
		else {
			container
				.css( {
					top: offset.top + inputHeight,
					left: offset.left
				} )
				.appendTo( 'body' );
		}

		var calHeight = container.outerHeight();
		var calWidth = container.outerWidth();
		var scrollTop = $(window).scrollTop();

		// Correct to the bottom
		if ( offset.top + inputHeight + calHeight - scrollTop > $(window).height() ) {
			var newTop = offset.top - calHeight;

			container.css( 'top', newTop < 0 ? 0 : newTop );
		}

		// Correct to the right
		if ( calWidth + offset.left > $(window).width() ) {
			var newLeft = $(window).width() - calWidth;

			// Account for elements which are inside a position absolute element
			if (this.c.attachTo === 'input') {
				newLeft -= $(container).offsetParent().offset().left;
			}

			container.css( 'left', newLeft < 0 ? 0 : newLeft );
		}
	},

	/**
	 * Create a simple array with a range of values
	 *
	 * @param  {integer} start   Start value (inclusive)
	 * @param  {integer} end     End value (inclusive)
	 * @param  {integer} [inc=1] Increment value
	 * @return {array}           Created array
	 * @private
	 */
	_range: function ( start, end, inc ) {
		var a = [];

		if ( ! inc ) {
			inc = 1;
		}

		for ( var i=start ; i<=end ; i+=inc ) {
			a.push( i );
		}

		return a;
	},

	/**
	 * Redraw the calendar based on the display date - this is a destructive
	 * operation
	 *
	 * @private
	 */
	_setCalander: function () {
		if ( this.s.display ) {
			this.dom.calendar
				.empty()
				.append( this._htmlMonth(
					this.s.display.getUTCFullYear(),
					this.s.display.getUTCMonth()
				) );
		}
	},

	/**
	 * Set the month and year for the calendar based on the current display date
	 *
	 * @private
	 */
	_setTitle: function () {
		this._optionSet( 'month', this.s.display.getUTCMonth() );
		this._optionSet( 'year', this.s.display.getUTCFullYear() );
	},

	/**
	 * Set the time based on the current value of the widget
	 *
	 * @private
	 */
	_setTime: function () {
		var that = this;
		var d = this.s.d;
		
		// luxon uses different method names so need to be able to call them. This happens a few time later in this method too
		var luxDT = null
		if (dateLib && dateLib == window.luxon) {
			luxDT = dateLib.DateTime.fromJSDate(d);
		}

		var hours = luxDT != null
			? luxDT.hour
			: d
				? d.getUTCHours()
				: 0;

		var allowed = function ( prop ) { // Backwards compt with `Increment` option
			return that.c[prop+'Available'] ?
				that.c[prop+'Available'] :
				that._range( 0, 59, that.c[prop+'Increment'] );
		}

		this._optionsTime( 'hours', this.s.parts.hours12 ? 12 : 24, hours, this.c.hoursAvailable )
		this._optionsTime(
			'minutes',
			60,
			luxDT != null
				? luxDT.minute
				: d
					? d.getUTCMinutes()
					: 0, allowed('minutes'),
			this.s.minutesRange
		);
		this._optionsTime(
			'seconds',
			60,
			luxDT != null
				? luxDT.second
				: d
					? d.getSeconds()
					: 0,
			allowed('seconds'),
			this.s.secondsRange
		);
	},

	/**
	 * Show the widget and add events to the document required only while it
	 * is displayed
	 * 
	 * @private
	 */
	_show: function () {
		var that = this;
		var namespace = this.s.namespace;

		this._position();

		// Need to reposition on scroll
		$(window).on( 'scroll.'+namespace+' resize.'+namespace, function () {
			that._position();
		} );

		$('div.DTE_Body_Content').on( 'scroll.'+namespace, function () {
			that._position();
		} );

		$('div.dataTables_scrollBody').on( 'scroll.'+namespace, function () {
			that._position();
		} );

		var offsetParent = this.dom.input[0].offsetParent;

		if ( offsetParent !== document.body ) {
			$(offsetParent).on( 'scroll.'+namespace, function () {
				that._position();
			} );
		}

		// On tab focus will move to a different field (no keyboard navigation
		// in the date picker - this might need to be changed).
		$(document).on( 'keydown.'+namespace, function (e) {
			if (
				e.keyCode === 9  || // tab
				e.keyCode === 27 || // esc
				e.keyCode === 13    // return
			) {
				that._hide();
			}
		} );

		// Hide if clicking outside of the widget - but in a different click
		// event from the one that was used to trigger the show (bubble and
		// inline)
		setTimeout( function () {
			$('body').on( 'click.'+namespace, function (e) {
				var parents = $(e.target).parents();

				if ( ! parents.filter( that.dom.container ).length && e.target !== that.dom.input[0] ) {
					that._hide();
				}
			} );
		}, 10 );
	},

	/**
	 * Write the formatted string to the input element this control is attached
	 * to
	 *
	 * @private
	 */
	_writeOutput: function ( focus ) {
		var date = this.s.d;
		var out = '';

		// Use moment, dayjs or luxon if possible - otherwise it must be ISO8601 (or the
		// constructor would have thrown an error)
		// luxon uses different method names so need to be able to call them.
		if (date) {
			out = dateLib && dateLib == window.luxon
			? dateLib.DateTime.fromJSDate(this.s.d).toFormat(this.c.format)
			: dateLib ?
				dateLib.utc( date, undefined, this.c.locale, this.c.strict ).format( this.c.format ) :
				date.getUTCFullYear() +'-'+
					this._pad(date.getUTCMonth() + 1) +'-'+
					this._pad(date.getUTCDate());
		}

		this.dom.input
			.val( out )
			.trigger('change', {write: date});
		
		if ( this.dom.input.attr('type') === 'hidden' ) {
			this.val(out, false);
		}

		if ( focus ) {
			this.dom.input.focus();
		}
	}
} );

/**
 * Use a specificmoment compatible date library
 */
DateTime.use = function (lib) {
	dateLib = lib;
};

/**
 * For generating unique namespaces
 *
 * @type {Number}
 * @private
 */
DateTime._instance = 0;

/**
 * Defaults for the date time picker
 *
 * @type {Object}
 */
DateTime.defaults = {
	attachTo: 'body',

	buttons: {
		clear: false,
		today: false
	},

	// Not documented - could be an internal property
	classPrefix: 'dt-datetime',

	// function or array of ints
	disableDays: null,

	// first day of the week (0: Sunday, 1: Monday, etc)
	firstDay: 1,

	format: 'YYYY-MM-DD',

	hoursAvailable: null,

	i18n: {
		clear:    'Clear',
		previous: 'Previous',
		next:     'Next',
		months:   [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
		weekdays: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
		amPm:     [ 'am', 'pm' ],
		hours:    'Hour',
		minutes:  'Minute',
		seconds:  'Second',
		unknown:  '-',
		today:    'Today'
	},

	maxDate: null,

	minDate: null,

	minutesAvailable: null,

	minutesIncrement: 1, // deprecated

	strict: true,

	locale: 'en',

	onChange: function () {},

	secondsAvailable: null,

	secondsIncrement: 1, // deprecated

	// show the ISO week number at the head of the row
	showWeekNumber: false,

	// overruled by max / min date
	yearRange: 25
};

DateTime.version = '1.1.2';

// Global export - if no conflicts
if (! window.DateTime) {
	window.DateTime = DateTime;
}

// Make available via jQuery
$.fn.dtDateTime = function (options) {
	return this.each(function() {
		new DateTime(this, options);
	});
}

// Attach to DataTables if present
if ($.fn.dataTable) {
	$.fn.dataTable.DateTime = DateTime;
	$.fn.DataTable.DateTime = DateTime;

	if ($.fn.dataTable.Editor) {
		$.fn.dataTable.Editor.DateTime = DateTime;
	}
}

return DateTime;

}));


/*! SearchBuilder 1.3.4
 * ©SpryMedia Ltd - datatables.net/license/mit
 */
(function () {
    'use strict';

    var $$2;
    var dataTable$2;
    function moment() {
        return window.moment;
    }
    function luxon() {
        return window.luxon;
    }
    /**
     * Sets the value of jQuery for use in the file
     *
     * @param jq the instance of jQuery to be set
     */
    function setJQuery$2(jq) {
        $$2 = jq;
        dataTable$2 = jq.fn.dataTable;
    }
    /**
     * The Criteria class is used within SearchBuilder to represent a search criteria
     */
    var Criteria = /** @class */ (function () {
        function Criteria(table, opts, topGroup, index, depth, serverData) {
            var _this = this;
            if (index === void 0) { index = 0; }
            if (depth === void 0) { depth = 1; }
            if (serverData === void 0) { serverData = undefined; }
            // Check that the required version of DataTables is included
            if (!dataTable$2 || !dataTable$2.versionCheck || !dataTable$2.versionCheck('1.10.0')) {
                throw new Error('SearchPane requires DataTables 1.10 or newer');
            }
            this.classes = $$2.extend(true, {}, Criteria.classes);
            // Get options from user and any extra conditions/column types defined by plug-ins
            this.c = $$2.extend(true, {}, Criteria.defaults, $$2.fn.dataTable.ext.searchBuilder, opts);
            var i18n = this.c.i18n;
            this.s = {
                condition: undefined,
                conditions: {},
                data: undefined,
                dataIdx: -1,
                dataPoints: [],
                dateFormat: false,
                depth: depth,
                dt: table,
                filled: false,
                index: index,
                origData: undefined,
                preventRedraw: false,
                serverData: serverData,
                topGroup: topGroup,
                type: '',
                value: []
            };
            this.dom = {
                buttons: $$2('<div/>')
                    .addClass(this.classes.buttonContainer),
                condition: $$2('<select disabled/>')
                    .addClass(this.classes.condition)
                    .addClass(this.classes.dropDown)
                    .addClass(this.classes.italic)
                    .attr('autocomplete', 'hacking'),
                conditionTitle: $$2('<option value="" disabled selected hidden/>')
                    .html(this.s.dt.i18n('searchBuilder.condition', i18n.condition)),
                container: $$2('<div/>')
                    .addClass(this.classes.container),
                data: $$2('<select/>')
                    .addClass(this.classes.data)
                    .addClass(this.classes.dropDown)
                    .addClass(this.classes.italic),
                dataTitle: $$2('<option value="" disabled selected hidden/>')
                    .html(this.s.dt.i18n('searchBuilder.data', i18n.data)),
                defaultValue: $$2('<select disabled/>')
                    .addClass(this.classes.value)
                    .addClass(this.classes.dropDown)
                    .addClass(this.classes.select)
                    .addClass(this.classes.italic),
                "delete": $$2('<button/>')
                    .html(this.s.dt.i18n('searchBuilder.delete', i18n["delete"]))
                    .addClass(this.classes["delete"])
                    .addClass(this.classes.button)
                    .attr('title', this.s.dt.i18n('searchBuilder.deleteTitle', i18n.deleteTitle))
                    .attr('type', 'button'),
                inputCont: $$2('<div/>')
                    .addClass(this.classes.inputCont),
                // eslint-disable-next-line no-useless-escape
                left: $$2('<button/>')
                    .html(this.s.dt.i18n('searchBuilder.left', i18n.left))
                    .addClass(this.classes.left)
                    .addClass(this.classes.button)
                    .attr('title', this.s.dt.i18n('searchBuilder.leftTitle', i18n.leftTitle))
                    .attr('type', 'button'),
                // eslint-disable-next-line no-useless-escape
                right: $$2('<button/>')
                    .html(this.s.dt.i18n('searchBuilder.right', i18n.right))
                    .addClass(this.classes.right)
                    .addClass(this.classes.button)
                    .attr('title', this.s.dt.i18n('searchBuilder.rightTitle', i18n.rightTitle))
                    .attr('type', 'button'),
                value: [
                    $$2('<select disabled/>')
                        .addClass(this.classes.value)
                        .addClass(this.classes.dropDown)
                        .addClass(this.classes.italic)
                        .addClass(this.classes.select)
                ],
                valueTitle: $$2('<option value="--valueTitle--" disabled selected hidden/>')
                    .html(this.s.dt.i18n('searchBuilder.value', i18n.value))
            };
            // If the greyscale option is selected then add the class to add the grey colour to SearchBuilder
            if (this.c.greyscale) {
                this.dom.data.addClass(this.classes.greyscale);
                this.dom.condition.addClass(this.classes.greyscale);
                this.dom.defaultValue.addClass(this.classes.greyscale);
                for (var _i = 0, _a = this.dom.value; _i < _a.length; _i++) {
                    var val = _a[_i];
                    val.addClass(this.classes.greyscale);
                }
            }
            $$2(window).on('resize.dtsb', dataTable$2.util.throttle(function () {
                _this.s.topGroup.trigger('dtsb-redrawLogic');
            }));
            this._buildCriteria();
            return this;
        }
        /**
         * Escape html characters within a string
         *
         * @param txt the string to be escaped
         * @returns the escaped string
         */
        Criteria._escapeHTML = function (txt) {
            return txt
                .toString()
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"');
        };
        /**
         * Parses formatted numbers down to a form where they can be compared
         *
         * @param val the value to convert
         * @returns the converted value
         */
        Criteria.parseNumFmt = function (val) {
            return +val.replace(/(?!^-)[^0-9.]/g, '');
        };
        /**
         * Adds the left button to the criteria
         */
        Criteria.prototype.updateArrows = function (hasSiblings) {
            if (hasSiblings === void 0) { hasSiblings = false; }
            // Empty the container and append all of the elements in the correct order
            this.dom.container.children().detach();
            this.dom.container
                .append(this.dom.data)
                .append(this.dom.condition)
                .append(this.dom.inputCont);
            this.setListeners();
            // Trigger the inserted events for the value elements as they are inserted
            if (this.dom.value[0] !== undefined) {
                this.dom.value[0].trigger('dtsb-inserted');
            }
            for (var i = 1; i < this.dom.value.length; i++) {
                this.dom.inputCont.append(this.dom.value[i]);
                this.dom.value[i].trigger('dtsb-inserted');
            }
            // If this is a top level criteria then don't let it move left
            if (this.s.depth > 1) {
                this.dom.buttons.append(this.dom.left);
            }
            // If the depthLimit of the query has been hit then don't add the right button
            if ((this.c.depthLimit === false || this.s.depth < this.c.depthLimit) && hasSiblings) {
                this.dom.buttons.append(this.dom.right);
            }
            else {
                this.dom.right.remove();
            }
            this.dom.buttons.append(this.dom["delete"]);
            this.dom.container.append(this.dom.buttons);
        };
        /**
         * Destroys the criteria, removing listeners and container from the dom
         */
        Criteria.prototype.destroy = function () {
            // Turn off listeners
            this.dom.data.off('.dtsb');
            this.dom.condition.off('.dtsb');
            this.dom["delete"].off('.dtsb');
            for (var _i = 0, _a = this.dom.value; _i < _a.length; _i++) {
                var val = _a[_i];
                val.off('.dtsb');
            }
            // Remove container from the dom
            this.dom.container.remove();
        };
        /**
         * Passes in the data for the row and compares it against this single criteria
         *
         * @param rowData The data for the row to be compared
         * @returns boolean Whether the criteria has passed
         */
        Criteria.prototype.search = function (rowData, rowIdx) {
            var condition = this.s.conditions[this.s.condition];
            if (this.s.condition !== undefined && condition !== undefined) {
                var filter = rowData[this.s.dataIdx];
                // This check is in place for if a custom decimal character is in place
                if (this.s.type.includes('num') &&
                    (this.s.dt.settings()[0].oLanguage.sDecimal !== '' ||
                        this.s.dt.settings()[0].oLanguage.sThousands !== '')) {
                    var splitRD = [rowData[this.s.dataIdx]];
                    if (this.s.dt.settings()[0].oLanguage.sDecimal !== '') {
                        splitRD = rowData[this.s.dataIdx].split(this.s.dt.settings()[0].oLanguage.sDecimal);
                    }
                    if (this.s.dt.settings()[0].oLanguage.sThousands !== '') {
                        for (var i = 0; i < splitRD.length; i++) {
                            splitRD[i] = splitRD[i].replace(this.s.dt.settings()[0].oLanguage.sThousands, ',');
                        }
                    }
                    filter = splitRD.join('.');
                }
                // If orthogonal data is in place we need to get it's values for searching
                if (this.c.orthogonal.search !== 'filter') {
                    var settings = this.s.dt.settings()[0];
                    filter = settings.oApi._fnGetCellData(settings, rowIdx, this.s.dataIdx, typeof this.c.orthogonal === 'string' ?
                        this.c.orthogonal :
                        this.c.orthogonal.search);
                }
                if (this.s.type === 'array') {
                    // Make sure we are working with an array
                    if (!Array.isArray(filter)) {
                        filter = [filter];
                    }
                    filter.sort();
                    for (var _i = 0, filter_1 = filter; _i < filter_1.length; _i++) {
                        var filt = filter_1[_i];
                        if (filt && typeof filt === 'string') {
                            filt = filt.replace(/[\r\n\u2028]/g, ' ');
                        }
                    }
                }
                else if (filter !== null && typeof filter === 'string') {
                    filter = filter.replace(/[\r\n\u2028]/g, ' ');
                }
                if (this.s.type.includes('html') && typeof filter === 'string') {
                    filter = filter.replace(/(<([^>]+)>)/ig, '');
                }
                // Not ideal, but jqueries .val() returns an empty string even
                // when the value set is null, so we shall assume the two are equal
                if (filter === null) {
                    filter = '';
                }
                return condition.search(filter, this.s.value, this);
            }
        };
        /**
         * Gets the details required to rebuild the criteria
         */
        Criteria.prototype.getDetails = function (deFormatDates) {
            if (deFormatDates === void 0) { deFormatDates = false; }
            // This check is in place for if a custom decimal character is in place
            if (this.s.type !== null &&
                this.s.type.includes('num') &&
                (this.s.dt.settings()[0].oLanguage.sDecimal !== '' || this.s.dt.settings()[0].oLanguage.sThousands !== '')) {
                for (var i = 0; i < this.s.value.length; i++) {
                    var splitRD = [this.s.value[i].toString()];
                    if (this.s.dt.settings()[0].oLanguage.sDecimal !== '') {
                        splitRD = this.s.value[i].split(this.s.dt.settings()[0].oLanguage.sDecimal);
                    }
                    if (this.s.dt.settings()[0].oLanguage.sThousands !== '') {
                        for (var j = 0; j < splitRD.length; j++) {
                            splitRD[j] = splitRD[j].replace(this.s.dt.settings()[0].oLanguage.sThousands, ',');
                        }
                    }
                    this.s.value[i] = splitRD.join('.');
                }
            }
            else if (this.s.type !== null && deFormatDates) {
                if (this.s.type.includes('date') ||
                    this.s.type.includes('time')) {
                    for (var i = 0; i < this.s.value.length; i++) {
                        if (this.s.value[i].match(/^\d{4}-([0]\d|1[0-2])-([0-2]\d|3[01])$/g) === null) {
                            this.s.value[i] = '';
                        }
                    }
                }
                else if (this.s.type.includes('moment')) {
                    for (var i = 0; i < this.s.value.length; i++) {
                        if (this.s.value[i] &&
                            this.s.value[i].length > 0 &&
                            moment()(this.s.value[i], this.s.dateFormat, true).isValid()) {
                            this.s.value[i] = moment()(this.s.value[i], this.s.dateFormat).format('YYYY-MM-DD HH:mm:ss');
                        }
                    }
                }
                else if (this.s.type.includes('luxon')) {
                    for (var i = 0; i < this.s.value.length; i++) {
                        if (this.s.value[i] &&
                            this.s.value[i].length > 0 &&
                            luxon().DateTime.fromFormat(this.s.value[i], this.s.dateFormat).invalid === null) {
                            this.s.value[i] = luxon().DateTime.fromFormat(this.s.value[i], this.s.dateFormat).toFormat('yyyy-MM-dd HH:mm:ss');
                        }
                    }
                }
            }
            if (this.s.type.includes('num') && this.s.dt.page.info().serverSide) {
                for (var i = 0; i < this.s.value.length; i++) {
                    this.s.value[i] = this.s.value[i].replace(/[^0-9.]/g, '');
                }
            }
            return {
                condition: this.s.condition,
                data: this.s.data,
                origData: this.s.origData,
                type: this.s.type,
                value: this.s.value.map(function (a) { return a !== null && a !== undefined ? a.toString() : a; })
            };
        };
        /**
         * Getter for the node for the container of the criteria
         *
         * @returns JQuery<HTMLElement> the node for the container
         */
        Criteria.prototype.getNode = function () {
            return this.dom.container;
        };
        /**
         * Populates the criteria data, condition and value(s) as far as has been selected
         */
        Criteria.prototype.populate = function () {
            this._populateData();
            // If the column index has been found attempt to select a condition
            if (this.s.dataIdx !== -1) {
                this._populateCondition();
                // If the condittion has been found attempt to select the values
                if (this.s.condition !== undefined) {
                    this._populateValue();
                }
            }
        };
        /**
         * Rebuilds the criteria based upon the details passed in
         *
         * @param loadedCriteria the details required to rebuild the criteria
         */
        Criteria.prototype.rebuild = function (loadedCriteria) {
            // Check to see if the previously selected data exists, if so select it
            var foundData = false;
            var dataIdx;
            this._populateData();
            // If a data selection has previously been made attempt to find and select it
            if (loadedCriteria.data !== undefined) {
                var italic_1 = this.classes.italic;
                var data_1 = this.dom.data;
                this.dom.data.children('option').each(function () {
                    if (!foundData &&
                        ($$2(this).text() === loadedCriteria.data ||
                            loadedCriteria.origData && $$2(this).prop('origData') === loadedCriteria.origData)) {
                        $$2(this).prop('selected', true);
                        data_1.removeClass(italic_1);
                        foundData = true;
                        dataIdx = $$2(this).val();
                    }
                    else {
                        $$2(this).removeProp('selected');
                    }
                });
            }
            // If the data has been found and selected then the condition can be populated and searched
            if (foundData) {
                this.s.data = loadedCriteria.data;
                this.s.origData = loadedCriteria.origData;
                this.s.dataIdx = dataIdx;
                this.c.orthogonal = this._getOptions().orthogonal;
                this.dom.dataTitle.remove();
                this._populateCondition();
                this.dom.conditionTitle.remove();
                var condition = void 0;
                // Check to see if the previously selected condition exists, if so select it
                var options = this.dom.condition.children('option');
                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (var i = 0; i < options.length; i++) {
                    var option = $$2(options[i]);
                    if (loadedCriteria.condition !== undefined &&
                        option.val() === loadedCriteria.condition &&
                        typeof loadedCriteria.condition === 'string') {
                        option.prop('selected', true);
                        condition = option.val();
                    }
                    else {
                        option.removeProp('selected');
                    }
                }
                this.s.condition = condition;
                // If the condition has been found and selected then the value can be populated and searched
                if (this.s.condition !== undefined) {
                    this.dom.conditionTitle.removeProp('selected');
                    this.dom.conditionTitle.remove();
                    this.dom.condition.removeClass(this.classes.italic);
                    // eslint-disable-next-line @typescript-eslint/prefer-for-of
                    for (var i = 0; i < options.length; i++) {
                        var option = $$2(options[i]);
                        if (option.val() !== this.s.condition) {
                            option.removeProp('selected');
                        }
                    }
                    this._populateValue(loadedCriteria);
                }
                else {
                    this.dom.conditionTitle.prependTo(this.dom.condition).prop('selected', true);
                }
            }
        };
        /**
         * Sets the listeners for the criteria
         */
        Criteria.prototype.setListeners = function () {
            var _this = this;
            this.dom.data
                .unbind('change')
                .on('change.dtsb', function () {
                _this.dom.dataTitle.removeProp('selected');
                // Need to go over every option to identify the correct selection
                var options = _this.dom.data.children('option.' + _this.classes.option);
                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (var i = 0; i < options.length; i++) {
                    var option = $$2(options[i]);
                    if (option.val() === _this.dom.data.val()) {
                        _this.dom.data.removeClass(_this.classes.italic);
                        option.prop('selected', true);
                        _this.s.dataIdx = +option.val();
                        _this.s.data = option.text();
                        _this.s.origData = option.prop('origData');
                        _this.c.orthogonal = _this._getOptions().orthogonal;
                        // When the data is changed, the values in condition and
                        // value may also change so need to renew them
                        _this._clearCondition();
                        _this._clearValue();
                        _this._populateCondition();
                        // If this criteria was previously active in the search then
                        // remove it from the search and trigger a new search
                        if (_this.s.filled) {
                            _this.s.filled = false;
                            _this.s.dt.draw();
                            _this.setListeners();
                        }
                        _this.s.dt.state.save();
                    }
                    else {
                        option.removeProp('selected');
                    }
                }
            });
            this.dom.condition
                .unbind('change')
                .on('change.dtsb', function () {
                _this.dom.conditionTitle.removeProp('selected');
                // Need to go over every option to identify the correct selection
                var options = _this.dom.condition.children('option.' + _this.classes.option);
                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (var i = 0; i < options.length; i++) {
                    var option = $$2(options[i]);
                    if (option.val() === _this.dom.condition.val()) {
                        _this.dom.condition.removeClass(_this.classes.italic);
                        option.prop('selected', true);
                        var condDisp = option.val();
                        // Find the condition that has been selected and store it internally
                        for (var _i = 0, _a = Object.keys(_this.s.conditions); _i < _a.length; _i++) {
                            var cond = _a[_i];
                            if (cond === condDisp) {
                                _this.s.condition = condDisp;
                                break;
                            }
                        }
                        // When the condition is changed, the value selector may switch between
                        // a select element and an input element
                        _this._clearValue();
                        _this._populateValue();
                        for (var _b = 0, _c = _this.dom.value; _b < _c.length; _b++) {
                            var val = _c[_b];
                            // If this criteria was previously active in the search then remove
                            // it from the search and trigger a new search
                            if (_this.s.filled && val !== undefined && _this.dom.inputCont.has(val[0]).length !== 0) {
                                _this.s.filled = false;
                                _this.s.dt.draw();
                                _this.setListeners();
                            }
                        }
                        if (_this.dom.value.length === 0 ||
                            _this.dom.value.length === 1 && _this.dom.value[0] === undefined) {
                            _this.s.dt.draw();
                        }
                    }
                    else {
                        option.removeProp('selected');
                    }
                }
            });
        };
        Criteria.prototype.setupButtons = function () {
            if (window.innerWidth > 550) {
                this.dom.container.removeClass(this.classes.vertical);
                this.dom.buttons.css('left', null);
                this.dom.buttons.css('top', null);
                return;
            }
            this.dom.container.addClass(this.classes.vertical);
            this.dom.buttons.css('left', this.dom.data.innerWidth());
            this.dom.buttons.css('top', this.dom.data.position().top);
        };
        /**
         * Builds the elements of the dom together
         */
        Criteria.prototype._buildCriteria = function () {
            // Append Titles for select elements
            this.dom.data.append(this.dom.dataTitle);
            this.dom.condition.append(this.dom.conditionTitle);
            // Add elements to container
            this.dom.container
                .append(this.dom.data)
                .append(this.dom.condition);
            this.dom.inputCont.empty();
            for (var _i = 0, _a = this.dom.value; _i < _a.length; _i++) {
                var val = _a[_i];
                val.append(this.dom.valueTitle);
                this.dom.inputCont.append(val);
            }
            // Add buttons to container
            this.dom.buttons
                .append(this.dom["delete"])
                .append(this.dom.right);
            this.dom.container.append(this.dom.inputCont).append(this.dom.buttons);
            this.setListeners();
        };
        /**
         * Clears the condition select element
         */
        Criteria.prototype._clearCondition = function () {
            this.dom.condition.empty();
            this.dom.conditionTitle.prop('selected', true).attr('disabled', 'true');
            this.dom.condition.prepend(this.dom.conditionTitle).prop('selectedIndex', 0);
            this.s.conditions = {};
            this.s.condition = undefined;
        };
        /**
         * Clears the value elements
         */
        Criteria.prototype._clearValue = function () {
            if (this.s.condition !== undefined) {
                if (this.dom.value.length > 0 && this.dom.value[0] !== undefined) {
                    var _loop_1 = function (val) {
                        if (val !== undefined) {
                            // Timeout is annoying but because of IOS
                            setTimeout(function () {
                                val.remove();
                            }, 50);
                        }
                    };
                    // Remove all of the value elements
                    for (var _i = 0, _a = this.dom.value; _i < _a.length; _i++) {
                        var val = _a[_i];
                        _loop_1(val);
                    }
                }
                // Call the init function to get the value elements for this condition
                this.dom.value = [].concat(this.s.conditions[this.s.condition].init(this, Criteria.updateListener));
                if (this.dom.value.length > 0 && this.dom.value[0] !== undefined) {
                    this.dom.inputCont
                        .empty()
                        .append(this.dom.value[0])
                        .insertAfter(this.dom.condition);
                    this.dom.value[0].trigger('dtsb-inserted');
                    // Insert all of the value elements
                    for (var i = 1; i < this.dom.value.length; i++) {
                        this.dom.inputCont.append(this.dom.value[i]);
                        this.dom.value[i].trigger('dtsb-inserted');
                    }
                }
            }
            else {
                var _loop_2 = function (val) {
                    if (val !== undefined) {
                        // Timeout is annoying but because of IOS
                        setTimeout(function () {
                            val.remove();
                        }, 50);
                    }
                };
                // Remove all of the value elements
                for (var _b = 0, _c = this.dom.value; _b < _c.length; _b++) {
                    var val = _c[_b];
                    _loop_2(val);
                }
                // Append the default valueTitle to the default select element
                this.dom.valueTitle
                    .prop('selected', true);
                this.dom.defaultValue
                    .append(this.dom.valueTitle)
                    .insertAfter(this.dom.condition);
            }
            this.s.value = [];
            this.dom.value = [
                $$2('<select disabled/>')
                    .addClass(this.classes.value)
                    .addClass(this.classes.dropDown)
                    .addClass(this.classes.italic)
                    .addClass(this.classes.select)
                    .append(this.dom.valueTitle.clone())
            ];
        };
        /**
         * Gets the options for the column
         *
         * @returns {object} The options for the column
         */
        Criteria.prototype._getOptions = function () {
            var table = this.s.dt;
            return $$2.extend(true, {}, Criteria.defaults, table.settings()[0].aoColumns[this.s.dataIdx].searchBuilder);
        };
        /**
         * Populates the condition dropdown
         */
        Criteria.prototype._populateCondition = function () {
            var conditionOpts = [];
            var conditionsLength = Object.keys(this.s.conditions).length;
            var colInits = this.s.dt.settings()[0].aoColumns;
            var column = +this.dom.data.children('option:selected').val();
            // If there are no conditions stored then we need to get them from the appropriate type
            if (conditionsLength === 0) {
                this.s.type = this.s.dt.columns().type().toArray()[column];
                if (colInits !== undefined) {
                    var colInit = colInits[column];
                    if (colInit.searchBuilderType !== undefined && colInit.searchBuilderType !== null) {
                        this.s.type = colInit.searchBuilderType;
                    }
                    else if (this.s.type === undefined || this.s.type === null) {
                        this.s.type = colInit.sType;
                    }
                }
                // If the column type is still unknown, call a draw to try reading it again
                if (this.s.type === null || this.s.type === undefined) {
                    $$2.fn.dataTable.ext.oApi._fnColumnTypes(this.s.dt.settings()[0]);
                    this.s.type = this.s.dt.columns().type().toArray()[column];
                }
                // Enable the condition element
                this.dom.condition
                    .removeAttr('disabled')
                    .empty()
                    .append(this.dom.conditionTitle)
                    .addClass(this.classes.italic);
                this.dom.conditionTitle
                    .prop('selected', true);
                var decimal = this.s.dt.settings()[0].oLanguage.sDecimal;
                // This check is in place for if a custom decimal character is in place
                if (decimal !== '' && this.s.type.indexOf(decimal) === this.s.type.length - decimal.length) {
                    if (this.s.type.includes('num-fmt')) {
                        this.s.type = this.s.type.replace(decimal, '');
                    }
                    else if (this.s.type.includes('num')) {
                        this.s.type = this.s.type.replace(decimal, '');
                    }
                }
                // Select which conditions are going to be used based on the column type
                var conditionObj = this.c.conditions[this.s.type] !== undefined ?
                    this.c.conditions[this.s.type] :
                    this.s.type.includes('moment') ?
                        this.c.conditions.moment :
                        this.s.type.includes('luxon') ?
                            this.c.conditions.luxon :
                            this.c.conditions.string;
                // If it is a moment format then extract the date format
                if (this.s.type.includes('moment')) {
                    this.s.dateFormat = this.s.type.replace(/moment-/g, '');
                }
                else if (this.s.type.includes('luxon')) {
                    this.s.dateFormat = this.s.type.replace(/luxon-/g, '');
                }
                // Add all of the conditions to the select element
                for (var _i = 0, _a = Object.keys(conditionObj); _i < _a.length; _i++) {
                    var condition = _a[_i];
                    if (conditionObj[condition] !== null) {
                        // Serverside processing does not supply the options for the select elements
                        // Instead input elements need to be used for these instead
                        if (this.s.dt.page.info().serverSide && conditionObj[condition].init === Criteria.initSelect) {
                            var col = colInits[column];
                            if (this.s.serverData && this.s.serverData[col.data]) {
                                conditionObj[condition].init = Criteria.initSelectSSP;
                                conditionObj[condition].inputValue = Criteria.inputValueSelect;
                                conditionObj[condition].isInputValid = Criteria.isInputValidSelect;
                            }
                            else {
                                conditionObj[condition].init = Criteria.initInput;
                                conditionObj[condition].inputValue = Criteria.inputValueInput;
                                conditionObj[condition].isInputValid = Criteria.isInputValidInput;
                            }
                        }
                        this.s.conditions[condition] = conditionObj[condition];
                        var condName = conditionObj[condition].conditionName;
                        if (typeof condName === 'function') {
                            condName = condName(this.s.dt, this.c.i18n);
                        }
                        conditionOpts.push($$2('<option>', {
                            text: condName,
                            value: condition
                        })
                            .addClass(this.classes.option)
                            .addClass(this.classes.notItalic));
                    }
                }
            }
            // Otherwise we can just load them in
            else if (conditionsLength > 0) {
                this.dom.condition.empty().removeAttr('disabled').addClass(this.classes.italic);
                for (var _b = 0, _c = Object.keys(this.s.conditions); _b < _c.length; _b++) {
                    var condition = _c[_b];
                    var condName = this.s.conditions[condition].conditionName;
                    if (typeof condName === 'function') {
                        condName = condName(this.s.dt, this.c.i18n);
                    }
                    var newOpt = $$2('<option>', {
                        text: condName,
                        value: condition
                    })
                        .addClass(this.classes.option)
                        .addClass(this.classes.notItalic);
                    if (this.s.condition !== undefined && this.s.condition === condName) {
                        newOpt.prop('selected', true);
                        this.dom.condition.removeClass(this.classes.italic);
                    }
                    conditionOpts.push(newOpt);
                }
            }
            else {
                this.dom.condition
                    .attr('disabled', 'true')
                    .addClass(this.classes.italic);
                return;
            }
            for (var _d = 0, conditionOpts_1 = conditionOpts; _d < conditionOpts_1.length; _d++) {
                var opt = conditionOpts_1[_d];
                this.dom.condition.append(opt);
            }
            // Selecting a default condition if one is set
            if (colInits[column].searchBuilder && colInits[column].searchBuilder.defaultCondition) {
                var defaultCondition = colInits[column].searchBuilder.defaultCondition;
                // If it is a number just use it as an index
                if (typeof defaultCondition === 'number') {
                    this.dom.condition.prop('selectedIndex', defaultCondition);
                    this.dom.condition.trigger('change');
                }
                // If it is a string then things get slightly more tricly
                else if (typeof defaultCondition === 'string') {
                    // We need to check each condition option to see if any will match
                    for (var i = 0; i < conditionOpts.length; i++) {
                        // Need to check against the stored conditions so we can match the token "cond" to the option
                        for (var _e = 0, _f = Object.keys(this.s.conditions); _e < _f.length; _e++) {
                            var cond = _f[_e];
                            var condName = this.s.conditions[cond].conditionName;
                            if (
                            // If the conditionName matches the text of the option
                            (typeof condName === 'string' ? condName : condName(this.s.dt, this.c.i18n)) ===
                                conditionOpts[i].text() &&
                                // and the tokens match
                                cond === defaultCondition) {
                                // Select that option
                                this.dom.condition
                                    .prop('selectedIndex', this.dom.condition.children().toArray().indexOf(conditionOpts[i][0]))
                                    .removeClass(this.classes.italic);
                                this.dom.condition.trigger('change');
                                i = conditionOpts.length;
                                break;
                            }
                        }
                    }
                }
            }
            // If not default set then default to 0, the title
            else {
                this.dom.condition.prop('selectedIndex', 0);
            }
        };
        /**
         * Populates the data select element
         */
        Criteria.prototype._populateData = function () {
            var _this = this;
            this.dom.data.empty().append(this.dom.dataTitle);
            // If there are no datas stored then we need to get them from the table
            if (this.s.dataPoints.length === 0) {
                this.s.dt.columns().every(function (index) {
                    // Need to check that the column can be filtered on before adding it
                    if (_this.c.columns === true ||
                        _this.s.dt.columns(_this.c.columns).indexes().toArray().includes(index)) {
                        var found = false;
                        for (var _i = 0, _a = _this.s.dataPoints; _i < _a.length; _i++) {
                            var val = _a[_i];
                            if (val.index === index) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            var col = _this.s.dt.settings()[0].aoColumns[index];
                            var opt = {
                                index: index,
                                origData: col.data,
                                text: (col.searchBuilderTitle === undefined ?
                                    col.sTitle :
                                    col.searchBuilderTitle).replace(/(<([^>]+)>)/ig, '')
                            };
                            _this.s.dataPoints.push(opt);
                            _this.dom.data.append($$2('<option>', {
                                text: opt.text,
                                value: opt.index
                            })
                                .addClass(_this.classes.option)
                                .addClass(_this.classes.notItalic)
                                .prop('origData', col.data)
                                .prop('selected', _this.s.dataIdx === opt.index ? true : false));
                            if (_this.s.dataIdx === opt.index) {
                                _this.dom.dataTitle.removeProp('selected');
                            }
                        }
                    }
                });
            }
            // Otherwise we can just load them in
            else {
                var _loop_3 = function (data) {
                    this_1.s.dt.columns().every(function (index) {
                        var col = _this.s.dt.settings()[0].aoColumns[index];
                        if ((col.searchBuilderTitle === undefined ?
                            col.sTitle :
                            col.searchBuilderTitle).replace(/(<([^>]+)>)/ig, '') === data.text) {
                            data.index = index;
                            data.origData = col.data;
                        }
                    });
                    var newOpt = $$2('<option>', {
                        text: data.text.replace(/(<([^>]+)>)/ig, ''),
                        value: data.index
                    })
                        .addClass(this_1.classes.option)
                        .addClass(this_1.classes.notItalic)
                        .prop('origData', data.origData);
                    if (this_1.s.data === data.text) {
                        this_1.s.dataIdx = data.index;
                        this_1.dom.dataTitle.removeProp('selected');
                        newOpt.prop('selected', true);
                        this_1.dom.data.removeClass(this_1.classes.italic);
                    }
                    this_1.dom.data.append(newOpt);
                };
                var this_1 = this;
                for (var _i = 0, _a = this.s.dataPoints; _i < _a.length; _i++) {
                    var data = _a[_i];
                    _loop_3(data);
                }
            }
        };
        /**
         * Populates the Value select element
         *
         * @param loadedCriteria optional, used to reload criteria from predefined filters
         */
        Criteria.prototype._populateValue = function (loadedCriteria) {
            var _this = this;
            var prevFilled = this.s.filled;
            this.s.filled = false;
            // Remove any previous value elements
            // Timeout is annoying but because of IOS
            setTimeout(function () {
                _this.dom.defaultValue.remove();
            }, 50);
            var _loop_4 = function (val) {
                // Timeout is annoying but because of IOS
                setTimeout(function () {
                    if (val !== undefined) {
                        val.remove();
                    }
                }, 50);
            };
            for (var _i = 0, _a = this.dom.value; _i < _a.length; _i++) {
                var val = _a[_i];
                _loop_4(val);
            }
            var children = this.dom.inputCont.children();
            if (children.length > 1) {
                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (var i = 0; i < children.length; i++) {
                    $$2(children[i]).remove();
                }
            }
            // Find the column with the title matching the data for the criteria and take note of the index
            if (loadedCriteria !== undefined) {
                this.s.dt.columns().every(function (index) {
                    if (_this.s.dt.settings()[0].aoColumns[index].sTitle === loadedCriteria.data) {
                        _this.s.dataIdx = index;
                    }
                });
            }
            // Initialise the value elements based on the condition
            this.dom.value = [].concat(this.s.conditions[this.s.condition].init(this, Criteria.updateListener, loadedCriteria !== undefined ? loadedCriteria.value : undefined));
            if (loadedCriteria !== undefined && loadedCriteria.value !== undefined) {
                this.s.value = loadedCriteria.value;
            }
            this.dom.inputCont.empty();
            // Insert value elements and trigger the inserted event
            if (this.dom.value[0] !== undefined) {
                this.dom.value[0]
                    .appendTo(this.dom.inputCont)
                    .trigger('dtsb-inserted');
            }
            for (var i = 1; i < this.dom.value.length; i++) {
                this.dom.value[i]
                    .insertAfter(this.dom.value[i - 1])
                    .trigger('dtsb-inserted');
            }
            // Check if the criteria can be used in a search
            this.s.filled = this.s.conditions[this.s.condition].isInputValid(this.dom.value, this);
            this.setListeners();
            // If it can and this is different to before then trigger a draw
            if (!this.s.preventRedraw && prevFilled !== this.s.filled) {
                // If using SSP we want to restrict the amount of server calls that take place
                //  and this will already have taken place
                if (!this.s.dt.page.info().serverSide) {
                    this.s.dt.draw();
                }
                this.setListeners();
            }
        };
        /**
         * Provides throttling capabilities to SearchBuilder without having to use dt's _fnThrottle function
         * This is because that function is not quite suitable for our needs as it runs initially rather than waiting
         *
         * @param args arguments supplied to the throttle function
         * @returns Function that is to be run that implements the throttling
         */
        Criteria.prototype._throttle = function (fn, frequency) {
            if (frequency === void 0) { frequency = 200; }
            var last = null;
            var timer = null;
            var that = this;
            if (frequency === null) {
                frequency = 200;
            }
            return function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var now = +new Date();
                if (last !== null && now < last + frequency) {
                    clearTimeout(timer);
                }
                else {
                    last = now;
                }
                timer = setTimeout(function () {
                    last = null;
                    fn.apply(that, args);
                }, frequency);
            };
        };
        Criteria.version = '1.1.0';
        Criteria.classes = {
            button: 'dtsb-button',
            buttonContainer: 'dtsb-buttonContainer',
            condition: 'dtsb-condition',
            container: 'dtsb-criteria',
            data: 'dtsb-data',
            "delete": 'dtsb-delete',
            dropDown: 'dtsb-dropDown',
            greyscale: 'dtsb-greyscale',
            input: 'dtsb-input',
            inputCont: 'dtsb-inputCont',
            italic: 'dtsb-italic',
            joiner: 'dtsp-joiner',
            left: 'dtsb-left',
            notItalic: 'dtsb-notItalic',
            option: 'dtsb-option',
            right: 'dtsb-right',
            select: 'dtsb-select',
            value: 'dtsb-value',
            vertical: 'dtsb-vertical'
        };
        /**
         * Default initialisation function for select conditions
         */
        Criteria.initSelect = function (that, fn, preDefined, array) {
            if (preDefined === void 0) { preDefined = null; }
            if (array === void 0) { array = false; }
            var column = that.dom.data.children('option:selected').val();
            var indexArray = that.s.dt.rows().indexes().toArray();
            var settings = that.s.dt.settings()[0];
            that.dom.valueTitle.prop('selected', true);
            // Declare select element to be used with all of the default classes and listeners.
            var el = $$2('<select/>')
                .addClass(Criteria.classes.value)
                .addClass(Criteria.classes.dropDown)
                .addClass(Criteria.classes.italic)
                .addClass(Criteria.classes.select)
                .append(that.dom.valueTitle)
                .on('change.dtsb', function () {
                $$2(this).removeClass(Criteria.classes.italic);
                fn(that, this);
            });
            if (that.c.greyscale) {
                el.addClass(Criteria.classes.greyscale);
            }
            var added = [];
            var options = [];
            // Add all of the options from the table to the select element.
            // Only add one option for each possible value
            for (var _i = 0, indexArray_1 = indexArray; _i < indexArray_1.length; _i++) {
                var index = indexArray_1[_i];
                var filter = settings.oApi._fnGetCellData(settings, index, column, typeof that.c.orthogonal === 'string' ?
                    that.c.orthogonal :
                    that.c.orthogonal.search);
                var value = {
                    filter: typeof filter === 'string' ?
                        filter.replace(/[\r\n\u2028]/g, ' ') : // Need to replace certain characters to match search values
                        filter,
                    index: index,
                    text: settings.oApi._fnGetCellData(settings, index, column, typeof that.c.orthogonal === 'string' ?
                        that.c.orthogonal :
                        that.c.orthogonal.display)
                };
                // If we are dealing with an array type, either make sure we are working with arrays, or sort them
                if (that.s.type === 'array') {
                    value.filter = !Array.isArray(value.filter) ? [value.filter] : value.filter;
                    value.text = !Array.isArray(value.text) ? [value.text] : value.text;
                }
                // Function to add an option to the select element
                var addOption = function (filt, text) {
                    if (that.s.type.includes('html') && filt !== null && typeof filt === 'string') {
                        filt.replace(/(<([^>]+)>)/ig, '');
                    }
                    // Add text and value, stripping out any html if that is the column type
                    var opt = $$2('<option>', {
                        type: Array.isArray(filt) ? 'Array' : 'String',
                        value: filt
                    })
                        .data('sbv', filt)
                        .addClass(that.classes.option)
                        .addClass(that.classes.notItalic)
                        // Have to add the text this way so that special html characters are not escaped - &amp; etc.
                        .html(typeof text === 'string' ?
                        text.replace(/(<([^>]+)>)/ig, '') :
                        text);
                    var val = opt.val();
                    // Check that this value has not already been added
                    if (added.indexOf(val) === -1) {
                        added.push(val);
                        options.push(opt);
                        if (preDefined !== null && Array.isArray(preDefined[0])) {
                            preDefined[0] = preDefined[0].sort().join(',');
                        }
                        // If this value was previously selected as indicated by preDefined, then select it again
                        if (preDefined !== null && opt.val() === preDefined[0]) {
                            opt.prop('selected', true);
                            el.removeClass(Criteria.classes.italic);
                            that.dom.valueTitle.removeProp('selected');
                        }
                    }
                };
                // If this is to add the individual values within the array we need to loop over the array
                if (array) {
                    for (var i = 0; i < value.filter.length; i++) {
                        addOption(value.filter[i], value.text[i]);
                    }
                }
                // Otherwise the value that is in the cell is to be added
                else {
                    addOption(value.filter, Array.isArray(value.text) ? value.text.join(', ') : value.text);
                }
            }
            options.sort(function (a, b) {
                if (that.s.type === 'array' ||
                    that.s.type === 'string' ||
                    that.s.type === 'html') {
                    if (a.val() < b.val()) {
                        return -1;
                    }
                    else if (a.val() > b.val()) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                }
                else if (that.s.type === 'num' ||
                    that.s.type === 'html-num') {
                    if (+a.val().replace(/(<([^>]+)>)/ig, '') < +b.val().replace(/(<([^>]+)>)/ig, '')) {
                        return -1;
                    }
                    else if (+a.val().replace(/(<([^>]+)>)/ig, '') > +b.val().replace(/(<([^>]+)>)/ig, '')) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                }
                else if (that.s.type === 'num-fmt' || that.s.type === 'html-num-fmt') {
                    if (+a.val().replace(/[^0-9.]/g, '') < +b.val().replace(/[^0-9.]/g, '')) {
                        return -1;
                    }
                    else if (+a.val().replace(/[^0-9.]/g, '') > +b.val().replace(/[^0-9.]/g, '')) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                }
            });
            for (var _a = 0, options_1 = options; _a < options_1.length; _a++) {
                var opt = options_1[_a];
                el.append(opt);
            }
            return el;
        };
        /**
         * Default initialisation function for select conditions
         */
        Criteria.initSelectSSP = function (that, fn, preDefined) {
            if (preDefined === void 0) { preDefined = null; }
            that.dom.valueTitle.prop('selected', true);
            // Declare select element to be used with all of the default classes and listeners.
            var el = $$2('<select/>')
                .addClass(Criteria.classes.value)
                .addClass(Criteria.classes.dropDown)
                .addClass(Criteria.classes.italic)
                .addClass(Criteria.classes.select)
                .append(that.dom.valueTitle)
                .on('change.dtsb', function () {
                $$2(this).removeClass(Criteria.classes.italic);
                fn(that, this);
            });
            if (that.c.greyscale) {
                el.addClass(Criteria.classes.greyscale);
            }
            var options = [];
            for (var _i = 0, _a = that.s.serverData[that.s.origData]; _i < _a.length; _i++) {
                var option = _a[_i];
                var value = option.value;
                var label = option.label;
                // Function to add an option to the select element
                var addOption = function (filt, text) {
                    if (that.s.type.includes('html') && filt !== null && typeof filt === 'string') {
                        filt.replace(/(<([^>]+)>)/ig, '');
                    }
                    // Add text and value, stripping out any html if that is the column type
                    var opt = $$2('<option>', {
                        type: Array.isArray(filt) ? 'Array' : 'String',
                        value: filt
                    })
                        .data('sbv', filt)
                        .addClass(that.classes.option)
                        .addClass(that.classes.notItalic)
                        // Have to add the text this way so that special html characters are not escaped - &amp; etc.
                        .html(typeof text === 'string' ?
                        text.replace(/(<([^>]+)>)/ig, '') :
                        text);
                    options.push(opt);
                    // If this value was previously selected as indicated by preDefined, then select it again
                    if (preDefined !== null && opt.val() === preDefined[0]) {
                        opt.prop('selected', true);
                        el.removeClass(Criteria.classes.italic);
                        that.dom.valueTitle.removeProp('selected');
                    }
                };
                addOption(value, label);
            }
            for (var _b = 0, options_2 = options; _b < options_2.length; _b++) {
                var opt = options_2[_b];
                el.append(opt);
            }
            return el;
        };
        /**
         * Default initialisation function for select array conditions
         *
         * This exists because there needs to be different select functionality for contains/without and equals/not
         */
        Criteria.initSelectArray = function (that, fn, preDefined) {
            if (preDefined === void 0) { preDefined = null; }
            return Criteria.initSelect(that, fn, preDefined, true);
        };
        /**
         * Default initialisation function for input conditions
         */
        Criteria.initInput = function (that, fn, preDefined) {
            if (preDefined === void 0) { preDefined = null; }
            // Declare the input element
            var searchDelay = that.s.dt.settings()[0].searchDelay;
            var el = $$2('<input/>')
                .addClass(Criteria.classes.value)
                .addClass(Criteria.classes.input)
                .on('input.dtsb keypress.dtsb', that._throttle(function (e) {
                var code = e.keyCode || e.which;
                return fn(that, this, code);
            }, searchDelay === null ? 100 : searchDelay));
            if (that.c.greyscale) {
                el.addClass(Criteria.classes.greyscale);
            }
            // If there is a preDefined value then add it
            if (preDefined !== null) {
                el.val(preDefined[0]);
            }
            // This is add responsive functionality to the logic button without redrawing everything else
            that.s.dt.one('draw.dtsb', function () {
                that.s.topGroup.trigger('dtsb-redrawLogic');
            });
            return el;
        };
        /**
         * Default initialisation function for conditions requiring 2 inputs
         */
        Criteria.init2Input = function (that, fn, preDefined) {
            if (preDefined === void 0) { preDefined = null; }
            // Declare all of the necessary jQuery elements
            var searchDelay = that.s.dt.settings()[0].searchDelay;
            var els = [
                $$2('<input/>')
                    .addClass(Criteria.classes.value)
                    .addClass(Criteria.classes.input)
                    .on('input.dtsb keypress.dtsb', that._throttle(function (e) {
                    var code = e.keyCode || e.which;
                    return fn(that, this, code);
                }, searchDelay === null ? 100 : searchDelay)),
                $$2('<span>')
                    .addClass(that.classes.joiner)
                    .html(that.s.dt.i18n('searchBuilder.valueJoiner', that.c.i18n.valueJoiner)),
                $$2('<input/>')
                    .addClass(Criteria.classes.value)
                    .addClass(Criteria.classes.input)
                    .on('input.dtsb keypress.dtsb', that._throttle(function (e) {
                    var code = e.keyCode || e.which;
                    return fn(that, this, code);
                }, searchDelay === null ? 100 : searchDelay))
            ];
            if (that.c.greyscale) {
                els[0].addClass(Criteria.classes.greyscale);
                els[2].addClass(Criteria.classes.greyscale);
            }
            // If there is a preDefined value then add it
            if (preDefined !== null) {
                els[0].val(preDefined[0]);
                els[2].val(preDefined[1]);
            }
            // This is add responsive functionality to the logic button without redrawing everything else
            that.s.dt.one('draw.dtsb', function () {
                that.s.topGroup.trigger('dtsb-redrawLogic');
            });
            return els;
        };
        /**
         * Default initialisation function for date conditions
         */
        Criteria.initDate = function (that, fn, preDefined) {
            if (preDefined === void 0) { preDefined = null; }
            var searchDelay = that.s.dt.settings()[0].searchDelay;
            // Declare date element using DataTables dateTime plugin
            var el = $$2('<input/>')
                .addClass(Criteria.classes.value)
                .addClass(Criteria.classes.input)
                .dtDateTime({
                attachTo: 'input',
                format: that.s.dateFormat ? that.s.dateFormat : undefined
            })
                .on('change.dtsb', that._throttle(function () {
                return fn(that, this);
            }, searchDelay === null ? 100 : searchDelay))
                .on('input.dtsb keypress.dtsb', function (e) {
                that._throttle(function () {
                    var code = e.keyCode || e.which;
                    return fn(that, this, code);
                }, searchDelay === null ? 100 : searchDelay);
            });
            if (that.c.greyscale) {
                el.addClass(Criteria.classes.greyscale);
            }
            // If there is a preDefined value then add it
            if (preDefined !== null) {
                el.val(preDefined[0]);
            }
            // This is add responsive functionality to the logic button without redrawing everything else
            that.s.dt.one('draw.dtsb', function () {
                that.s.topGroup.trigger('dtsb-redrawLogic');
            });
            return el;
        };
        Criteria.initNoValue = function (that) {
            // This is add responsive functionality to the logic button without redrawing everything else
            that.s.dt.one('draw.dtsb', function () {
                that.s.topGroup.trigger('dtsb-redrawLogic');
            });
        };
        Criteria.init2Date = function (that, fn, preDefined) {
            var _this = this;
            if (preDefined === void 0) { preDefined = null; }
            var searchDelay = that.s.dt.settings()[0].searchDelay;
            // Declare all of the date elements that are required using DataTables dateTime plugin
            var els = [
                $$2('<input/>')
                    .addClass(Criteria.classes.value)
                    .addClass(Criteria.classes.input)
                    .dtDateTime({
                    attachTo: 'input',
                    format: that.s.dateFormat ? that.s.dateFormat : undefined
                })
                    .on('change.dtsb', searchDelay !== null ?
                    that.s.dt.settings()[0].oApi._fnThrottle(function () {
                        return fn(that, this);
                    }, searchDelay) :
                    function () {
                        fn(that, _this);
                    })
                    .on('input.dtsb keypress.dtsb', function (e) {
                    that.s.dt.settings()[0].oApi._fnThrottle(function () {
                        var code = e.keyCode || e.which;
                        return fn(that, this, code);
                    }, searchDelay === null ? 0 : searchDelay);
                }),
                $$2('<span>')
                    .addClass(that.classes.joiner)
                    .html(that.s.dt.i18n('searchBuilder.valueJoiner', that.c.i18n.valueJoiner)),
                $$2('<input/>')
                    .addClass(Criteria.classes.value)
                    .addClass(Criteria.classes.input)
                    .dtDateTime({
                    attachTo: 'input',
                    format: that.s.dateFormat ? that.s.dateFormat : undefined
                })
                    .on('change.dtsb', searchDelay !== null ?
                    that.s.dt.settings()[0].oApi._fnThrottle(function () {
                        return fn(that, this);
                    }, searchDelay) :
                    function () {
                        fn(that, _this);
                    })
                    .on('input.dtsb keypress.dtsb', !that.c.enterSearch &&
                    !(that.s.dt.settings()[0].oInit.search !== undefined &&
                        that.s.dt.settings()[0].oInit.search["return"]) &&
                    searchDelay !== null ?
                    that.s.dt.settings()[0].oApi._fnThrottle(function () {
                        return fn(that, this);
                    }, searchDelay) :
                    function (e) {
                        var code = e.keyCode || e.which;
                        fn(that, _this, code);
                    })
            ];
            if (that.c.greyscale) {
                els[0].addClass(Criteria.classes.greyscale);
                els[2].addClass(Criteria.classes.greyscale);
            }
            // If there are and preDefined values then add them
            if (preDefined !== null && preDefined.length > 0) {
                els[0].val(preDefined[0]);
                els[2].val(preDefined[1]);
            }
            // This is add responsive functionality to the logic button without redrawing everything else
            that.s.dt.one('draw.dtsb', function () {
                that.s.topGroup.trigger('dtsb-redrawLogic');
            });
            return els;
        };
        /**
         * Default function for select elements to validate condition
         */
        Criteria.isInputValidSelect = function (el) {
            var allFilled = true;
            // Check each element to make sure that the selections are valid
            for (var _i = 0, el_1 = el; _i < el_1.length; _i++) {
                var element = el_1[_i];
                if (element.children('option:selected').length ===
                    element.children('option').length -
                        element.children('option.' + Criteria.classes.notItalic).length &&
                    element.children('option:selected').length === 1 &&
                    element.children('option:selected')[0] === element.children('option')[0]) {
                    allFilled = false;
                }
            }
            return allFilled;
        };
        /**
         * Default function for input and date elements to validate condition
         */
        Criteria.isInputValidInput = function (el) {
            var allFilled = true;
            // Check each element to make sure that the inputs are valid
            for (var _i = 0, el_2 = el; _i < el_2.length; _i++) {
                var element = el_2[_i];
                if (element.is('input') && element.val().length === 0) {
                    allFilled = false;
                }
            }
            return allFilled;
        };
        /**
         * Default function for getting select conditions
         */
        Criteria.inputValueSelect = function (el) {
            var values = [];
            // Go through the select elements and push each selected option to the return array
            for (var _i = 0, el_3 = el; _i < el_3.length; _i++) {
                var element = el_3[_i];
                if (element.is('select')) {
                    values.push(Criteria._escapeHTML(element.children('option:selected').data('sbv')));
                }
            }
            return values;
        };
        /**
         * Default function for getting input conditions
         */
        Criteria.inputValueInput = function (el) {
            var values = [];
            // Go through the input elements and push each value to the return array
            for (var _i = 0, el_4 = el; _i < el_4.length; _i++) {
                var element = el_4[_i];
                if (element.is('input')) {
                    values.push(Criteria._escapeHTML(element.val()));
                }
            }
            return values;
        };
        /**
         * Function that is run on each element as a call back when a search should be triggered
         */
        Criteria.updateListener = function (that, el, code) {
            // When the value is changed the criteria is now complete so can be included in searches
            // Get the condition from the map based on the key that has been selected for the condition
            var condition = that.s.conditions[that.s.condition];
            that.s.filled = condition.isInputValid(that.dom.value, that);
            that.s.value = condition.inputValue(that.dom.value, that);
            if (!that.s.filled) {
                if (!that.c.enterSearch &&
                    !(that.s.dt.settings()[0].oInit.search !== undefined &&
                        that.s.dt.settings()[0].oInit.search["return"]) ||
                    code === 13) {
                    that.s.dt.draw();
                }
                return;
            }
            if (!Array.isArray(that.s.value)) {
                that.s.value = [that.s.value];
            }
            for (var i = 0; i < that.s.value.length; i++) {
                // If the value is an array we need to sort it
                if (Array.isArray(that.s.value[i])) {
                    that.s.value[i].sort();
                }
                // Otherwise replace the decimal place character for i18n
                else if (that.s.type.includes('num') &&
                    (that.s.dt.settings()[0].oLanguage.sDecimal !== '' ||
                        that.s.dt.settings()[0].oLanguage.sThousands !== '')) {
                    var splitRD = [that.s.value[i].toString()];
                    if (that.s.dt.settings()[0].oLanguage.sDecimal !== '') {
                        splitRD = that.s.value[i].split(that.s.dt.settings()[0].oLanguage.sDecimal);
                    }
                    if (that.s.dt.settings()[0].oLanguage.sThousands !== '') {
                        for (var j = 0; j < splitRD.length; j++) {
                            splitRD[j] = splitRD[j].replace(that.s.dt.settings()[0].oLanguage.sThousands, ',');
                        }
                    }
                    that.s.value[i] = splitRD.join('.');
                }
            }
            // Take note of the cursor position so that we can refocus there later
            var idx = null;
            var cursorPos = null;
            for (var i = 0; i < that.dom.value.length; i++) {
                if (el === that.dom.value[i][0]) {
                    idx = i;
                    if (el.selectionStart !== undefined) {
                        cursorPos = el.selectionStart;
                    }
                }
            }
            if (!that.c.enterSearch &&
                !(that.s.dt.settings()[0].oInit.search !== undefined &&
                    that.s.dt.settings()[0].oInit.search["return"]) ||
                code === 13) {
                // Trigger a search
                that.s.dt.draw();
            }
            // Refocus the element and set the correct cursor position
            if (idx !== null) {
                that.dom.value[idx].removeClass(that.classes.italic);
                that.dom.value[idx].focus();
                if (cursorPos !== null) {
                    that.dom.value[idx][0].setSelectionRange(cursorPos, cursorPos);
                }
            }
        };
        // The order of the conditions will make eslint sad :(
        // Has to be in this order so that they are displayed correctly in select elements
        // Also have to disable member ordering for this as the private methods used are not yet declared otherwise
        // eslint-disable-next-line @typescript-eslint/member-ordering
        Criteria.dateConditions = {
            '=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.equals', i18n.conditions.date.equals);
                },
                init: Criteria.initDate,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    value = value.replace(/(\/|-|,)/g, '-');
                    return value === comparison[0];
                }
            },
            // eslint-disable-next-line sort-keys
            '!=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.not', i18n.conditions.date.not);
                },
                init: Criteria.initDate,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    value = value.replace(/(\/|-|,)/g, '-');
                    return value !== comparison[0];
                }
            },
            '<': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.before', i18n.conditions.date.before);
                },
                init: Criteria.initDate,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    value = value.replace(/(\/|-|,)/g, '-');
                    return value < comparison[0];
                }
            },
            '>': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.after', i18n.conditions.date.after);
                },
                init: Criteria.initDate,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    value = value.replace(/(\/|-|,)/g, '-');
                    return value > comparison[0];
                }
            },
            'between': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.between', i18n.conditions.date.between);
                },
                init: Criteria.init2Date,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    value = value.replace(/(\/|-|,)/g, '-');
                    if (comparison[0] < comparison[1]) {
                        return comparison[0] <= value && value <= comparison[1];
                    }
                    else {
                        return comparison[1] <= value && value <= comparison[0];
                    }
                }
            },
            // eslint-disable-next-line sort-keys
            '!between': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.notBetween', i18n.conditions.date.notBetween);
                },
                init: Criteria.init2Date,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    value = value.replace(/(\/|-|,)/g, '-');
                    if (comparison[0] < comparison[1]) {
                        return !(comparison[0] <= value && value <= comparison[1]);
                    }
                    else {
                        return !(comparison[1] <= value && value <= comparison[0]);
                    }
                }
            },
            'null': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.empty', i18n.conditions.date.empty);
                },
                init: Criteria.initNoValue,
                inputValue: function () {
                    return;
                },
                isInputValid: function () {
                    return true;
                },
                search: function (value) {
                    return value === null || value === undefined || value.length === 0;
                }
            },
            // eslint-disable-next-line sort-keys
            '!null': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.notEmpty', i18n.conditions.date.notEmpty);
                },
                init: Criteria.initNoValue,
                inputValue: function () {
                    return;
                },
                isInputValid: function () {
                    return true;
                },
                search: function (value) {
                    return !(value === null || value === undefined || value.length === 0);
                }
            }
        };
        // The order of the conditions will make eslint sad :(
        // Has to be in this order so that they are displayed correctly in select elements
        // Also have to disable member ordering for this as the private methods used are not yet declared otherwise
        // eslint-disable-next-line @typescript-eslint/member-ordering
        Criteria.momentDateConditions = {
            '=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.equals', i18n.conditions.date.equals);
                },
                init: Criteria.initDate,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison, that) {
                    return moment()(value, that.s.dateFormat).valueOf() ===
                        moment()(comparison[0], that.s.dateFormat).valueOf();
                }
            },
            // eslint-disable-next-line sort-keys
            '!=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.not', i18n.conditions.date.not);
                },
                init: Criteria.initDate,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison, that) {
                    return moment()(value, that.s.dateFormat).valueOf() !==
                        moment()(comparison[0], that.s.dateFormat).valueOf();
                }
            },
            '<': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.before', i18n.conditions.date.before);
                },
                init: Criteria.initDate,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison, that) {
                    return moment()(value, that.s.dateFormat).valueOf() < moment()(comparison[0], that.s.dateFormat).valueOf();
                }
            },
            '>': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.after', i18n.conditions.date.after);
                },
                init: Criteria.initDate,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison, that) {
                    return moment()(value, that.s.dateFormat).valueOf() > moment()(comparison[0], that.s.dateFormat).valueOf();
                }
            },
            'between': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.between', i18n.conditions.date.between);
                },
                init: Criteria.init2Date,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison, that) {
                    var val = moment()(value, that.s.dateFormat).valueOf();
                    var comp0 = moment()(comparison[0], that.s.dateFormat).valueOf();
                    var comp1 = moment()(comparison[1], that.s.dateFormat).valueOf();
                    if (comp0 < comp1) {
                        return comp0 <= val && val <= comp1;
                    }
                    else {
                        return comp1 <= val && val <= comp0;
                    }
                }
            },
            // eslint-disable-next-line sort-keys
            '!between': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.notBetween', i18n.conditions.date.notBetween);
                },
                init: Criteria.init2Date,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison, that) {
                    var val = moment()(value, that.s.dateFormat).valueOf();
                    var comp0 = moment()(comparison[0], that.s.dateFormat).valueOf();
                    var comp1 = moment()(comparison[1], that.s.dateFormat).valueOf();
                    if (comp0 < comp1) {
                        return !(+comp0 <= +val && +val <= +comp1);
                    }
                    else {
                        return !(+comp1 <= +val && +val <= +comp0);
                    }
                }
            },
            'null': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.empty', i18n.conditions.date.empty);
                },
                init: Criteria.initNoValue,
                inputValue: function () {
                    return;
                },
                isInputValid: function () {
                    return true;
                },
                search: function (value) {
                    return value === null || value === undefined || value.length === 0;
                }
            },
            // eslint-disable-next-line sort-keys
            '!null': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.notEmpty', i18n.conditions.date.notEmpty);
                },
                init: Criteria.initNoValue,
                inputValue: function () {
                    return;
                },
                isInputValid: function () {
                    return true;
                },
                search: function (value) {
                    return !(value === null || value === undefined || value.length === 0);
                }
            }
        };
        // The order of the conditions will make eslint sad :(
        // Has to be in this order so that they are displayed correctly in select elements
        // Also have to disable member ordering for this as the private methods used are not yet declared otherwise
        // eslint-disable-next-line @typescript-eslint/member-ordering
        Criteria.luxonDateConditions = {
            '=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.equals', i18n.conditions.date.equals);
                },
                init: Criteria.initDate,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison, that) {
                    return luxon().DateTime.fromFormat(value, that.s.dateFormat).ts
                        === luxon().DateTime.fromFormat(comparison[0], that.s.dateFormat).ts;
                }
            },
            // eslint-disable-next-line sort-keys
            '!=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.not', i18n.conditions.date.not);
                },
                init: Criteria.initDate,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison, that) {
                    return luxon().DateTime.fromFormat(value, that.s.dateFormat).ts
                        !== luxon().DateTime.fromFormat(comparison[0], that.s.dateFormat).ts;
                }
            },
            '<': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.before', i18n.conditions.date.before);
                },
                init: Criteria.initDate,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison, that) {
                    return luxon().DateTime.fromFormat(value, that.s.dateFormat).ts
                        < luxon().DateTime.fromFormat(comparison[0], that.s.dateFormat).ts;
                }
            },
            '>': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.after', i18n.conditions.date.after);
                },
                init: Criteria.initDate,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison, that) {
                    return luxon().DateTime.fromFormat(value, that.s.dateFormat).ts
                        > luxon().DateTime.fromFormat(comparison[0], that.s.dateFormat).ts;
                }
            },
            'between': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.between', i18n.conditions.date.between);
                },
                init: Criteria.init2Date,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison, that) {
                    var val = luxon().DateTime.fromFormat(value, that.s.dateFormat).ts;
                    var comp0 = luxon().DateTime.fromFormat(comparison[0], that.s.dateFormat).ts;
                    var comp1 = luxon().DateTime.fromFormat(comparison[1], that.s.dateFormat).ts;
                    if (comp0 < comp1) {
                        return comp0 <= val && val <= comp1;
                    }
                    else {
                        return comp1 <= val && val <= comp0;
                    }
                }
            },
            // eslint-disable-next-line sort-keys
            '!between': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.notBetween', i18n.conditions.date.notBetween);
                },
                init: Criteria.init2Date,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison, that) {
                    var val = luxon().DateTime.fromFormat(value, that.s.dateFormat).ts;
                    var comp0 = luxon().DateTime.fromFormat(comparison[0], that.s.dateFormat).ts;
                    var comp1 = luxon().DateTime.fromFormat(comparison[1], that.s.dateFormat).ts;
                    if (comp0 < comp1) {
                        return !(+comp0 <= +val && +val <= +comp1);
                    }
                    else {
                        return !(+comp1 <= +val && +val <= +comp0);
                    }
                }
            },
            'null': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.empty', i18n.conditions.date.empty);
                },
                init: Criteria.initNoValue,
                inputValue: function () {
                    return;
                },
                isInputValid: function () {
                    return true;
                },
                search: function (value) {
                    return value === null || value === undefined || value.length === 0;
                }
            },
            // eslint-disable-next-line sort-keys
            '!null': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.date.notEmpty', i18n.conditions.date.notEmpty);
                },
                init: Criteria.initNoValue,
                inputValue: function () {
                    return;
                },
                isInputValid: function () {
                    return true;
                },
                search: function (value) {
                    return !(value === null || value === undefined || value.length === 0);
                }
            }
        };
        // The order of the conditions will make eslint sad :(
        // Has to be in this order so that they are displayed correctly in select elements
        // Also have to disable member ordering for this as the private methods used are not yet declared otherwise
        // eslint-disable-next-line @typescript-eslint/member-ordering
        Criteria.numConditions = {
            '=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.equals', i18n.conditions.number.equals);
                },
                init: Criteria.initSelect,
                inputValue: Criteria.inputValueSelect,
                isInputValid: Criteria.isInputValidSelect,
                search: function (value, comparison) {
                    return +value === +comparison[0];
                }
            },
            // eslint-disable-next-line sort-keys
            '!=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.not', i18n.conditions.number.not);
                },
                init: Criteria.initSelect,
                inputValue: Criteria.inputValueSelect,
                isInputValid: Criteria.isInputValidSelect,
                search: function (value, comparison) {
                    return +value !== +comparison[0];
                }
            },
            '<': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.lt', i18n.conditions.number.lt);
                },
                init: Criteria.initInput,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    return +value < +comparison[0];
                }
            },
            '<=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.lte', i18n.conditions.number.lte);
                },
                init: Criteria.initInput,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    return +value <= +comparison[0];
                }
            },
            '>=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.gte', i18n.conditions.number.gte);
                },
                init: Criteria.initInput,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    return +value >= +comparison[0];
                }
            },
            // eslint-disable-next-line sort-keys
            '>': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.gt', i18n.conditions.number.gt);
                },
                init: Criteria.initInput,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    return +value > +comparison[0];
                }
            },
            'between': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.between', i18n.conditions.number.between);
                },
                init: Criteria.init2Input,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    if (+comparison[0] < +comparison[1]) {
                        return +comparison[0] <= +value && +value <= +comparison[1];
                    }
                    else {
                        return +comparison[1] <= +value && +value <= +comparison[0];
                    }
                }
            },
            // eslint-disable-next-line sort-keys
            '!between': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.notBetween', i18n.conditions.number.notBetween);
                },
                init: Criteria.init2Input,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    if (+comparison[0] < +comparison[1]) {
                        return !(+comparison[0] <= +value && +value <= +comparison[1]);
                    }
                    else {
                        return !(+comparison[1] <= +value && +value <= +comparison[0]);
                    }
                }
            },
            'null': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.empty', i18n.conditions.number.empty);
                },
                init: Criteria.initNoValue,
                inputValue: function () {
                    return;
                },
                isInputValid: function () {
                    return true;
                },
                search: function (value) {
                    return value === null || value === undefined || value.length === 0;
                }
            },
            // eslint-disable-next-line sort-keys
            '!null': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.notEmpty', i18n.conditions.number.notEmpty);
                },
                init: Criteria.initNoValue,
                inputValue: function () {
                    return;
                },
                isInputValid: function () {
                    return true;
                },
                search: function (value) {
                    return !(value === null || value === undefined || value.length === 0);
                }
            }
        };
        // The order of the conditions will make eslint sad :(
        // Has to be in this order so that they are displayed correctly in select elements
        // Also have to disable member ordering for this as the private methods used are not yet declared otherwise
        // eslint-disable-next-line @typescript-eslint/member-ordering
        Criteria.numFmtConditions = {
            '=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.equals', i18n.conditions.number.equals);
                },
                init: Criteria.initSelect,
                inputValue: Criteria.inputValueSelect,
                isInputValid: Criteria.isInputValidSelect,
                search: function (value, comparison) {
                    return Criteria.parseNumFmt(value) === Criteria.parseNumFmt(comparison[0]);
                }
            },
            // eslint-disable-next-line sort-keys
            '!=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.not', i18n.conditions.number.not);
                },
                init: Criteria.initSelect,
                inputValue: Criteria.inputValueSelect,
                isInputValid: Criteria.isInputValidSelect,
                search: function (value, comparison) {
                    return Criteria.parseNumFmt(value) !== Criteria.parseNumFmt(comparison[0]);
                }
            },
            '<': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.lt', i18n.conditions.number.lt);
                },
                init: Criteria.initInput,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    return Criteria.parseNumFmt(value) < Criteria.parseNumFmt(comparison[0]);
                }
            },
            '<=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.lte', i18n.conditions.number.lte);
                },
                init: Criteria.initInput,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    return Criteria.parseNumFmt(value) <= Criteria.parseNumFmt(comparison[0]);
                }
            },
            '>=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.gte', i18n.conditions.number.gte);
                },
                init: Criteria.initInput,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    return Criteria.parseNumFmt(value) >= Criteria.parseNumFmt(comparison[0]);
                }
            },
            // eslint-disable-next-line sort-keys
            '>': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.gt', i18n.conditions.number.gt);
                },
                init: Criteria.initInput,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    return Criteria.parseNumFmt(value) > Criteria.parseNumFmt(comparison[0]);
                }
            },
            'between': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.between', i18n.conditions.number.between);
                },
                init: Criteria.init2Input,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    var val = Criteria.parseNumFmt(value);
                    var comp0 = Criteria.parseNumFmt(comparison[0]);
                    var comp1 = Criteria.parseNumFmt(comparison[1]);
                    if (+comp0 < +comp1) {
                        return +comp0 <= +val && +val <= +comp1;
                    }
                    else {
                        return +comp1 <= +val && +val <= +comp0;
                    }
                }
            },
            // eslint-disable-next-line sort-keys
            '!between': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.notBetween', i18n.conditions.number.notBetween);
                },
                init: Criteria.init2Input,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    var val = Criteria.parseNumFmt(value);
                    var comp0 = Criteria.parseNumFmt(comparison[0]);
                    var comp1 = Criteria.parseNumFmt(comparison[1]);
                    if (+comp0 < +comp1) {
                        return !(+comp0 <= +val && +val <= +comp1);
                    }
                    else {
                        return !(+comp1 <= +val && +val <= +comp0);
                    }
                }
            },
            'null': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.empty', i18n.conditions.number.empty);
                },
                init: Criteria.initNoValue,
                inputValue: function () {
                    return;
                },
                isInputValid: function () {
                    return true;
                },
                search: function (value) {
                    return value === null || value === undefined || value.length === 0;
                }
            },
            // eslint-disable-next-line sort-keys
            '!null': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.number.notEmpty', i18n.conditions.number.notEmpty);
                },
                init: Criteria.initNoValue,
                inputValue: function () {
                    return;
                },
                isInputValid: function () {
                    return true;
                },
                search: function (value) {
                    return !(value === null || value === undefined || value.length === 0);
                }
            }
        };
        // The order of the conditions will make eslint sad :(
        // Has to be in this order so that they are displayed correctly in select elements
        // Also have to disable member ordering for this as the private methods used are not yet declared otherwise
        // eslint-disable-next-line @typescript-eslint/member-ordering
        Criteria.stringConditions = {
            '=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.string.equals', i18n.conditions.string.equals);
                },
                init: Criteria.initSelect,
                inputValue: Criteria.inputValueSelect,
                isInputValid: Criteria.isInputValidSelect,
                search: function (value, comparison) {
                    return value === comparison[0];
                }
            },
            // eslint-disable-next-line sort-keys
            '!=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.string.not', i18n.conditions.string.not);
                },
                init: Criteria.initSelect,
                inputValue: Criteria.inputValueSelect,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    return value !== comparison[0];
                }
            },
            'starts': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.string.startsWith', i18n.conditions.string.startsWith);
                },
                init: Criteria.initInput,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    return value.toLowerCase().indexOf(comparison[0].toLowerCase()) === 0;
                }
            },
            // eslint-disable-next-line sort-keys
            '!starts': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.string.notStartsWith', i18n.conditions.string.notStartsWith);
                },
                init: Criteria.initInput,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    return value.toLowerCase().indexOf(comparison[0].toLowerCase()) !== 0;
                }
            },
            // eslint-disable-next-line sort-keys
            'contains': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.string.contains', i18n.conditions.string.contains);
                },
                init: Criteria.initInput,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    return value.toLowerCase().includes(comparison[0].toLowerCase());
                }
            },
            // eslint-disable-next-line sort-keys
            '!contains': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.string.notContains', i18n.conditions.string.notContains);
                },
                init: Criteria.initInput,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    return !value.toLowerCase().includes(comparison[0].toLowerCase());
                }
            },
            'ends': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.string.endsWith', i18n.conditions.string.endsWith);
                },
                init: Criteria.initInput,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    return value.toLowerCase().endsWith(comparison[0].toLowerCase());
                }
            },
            // eslint-disable-next-line sort-keys
            '!ends': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.string.notEndsWith', i18n.conditions.string.notEndsWith);
                },
                init: Criteria.initInput,
                inputValue: Criteria.inputValueInput,
                isInputValid: Criteria.isInputValidInput,
                search: function (value, comparison) {
                    return !value.toLowerCase().endsWith(comparison[0].toLowerCase());
                }
            },
            'null': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.string.empty', i18n.conditions.string.empty);
                },
                init: Criteria.initNoValue,
                inputValue: function () {
                    return;
                },
                isInputValid: function () {
                    return true;
                },
                search: function (value) {
                    return value === null || value === undefined || value.length === 0;
                }
            },
            // eslint-disable-next-line sort-keys
            '!null': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.string.notEmpty', i18n.conditions.string.notEmpty);
                },
                init: Criteria.initNoValue,
                inputValue: function () {
                    return;
                },
                isInputValid: function () {
                    return true;
                },
                search: function (value) {
                    return !(value === null || value === undefined || value.length === 0);
                }
            }
        };
        // The order of the conditions will make eslint sad :(
        // Also have to disable member ordering for this as the private methods used are not yet declared otherwise
        // eslint-disable-next-line @typescript-eslint/member-ordering
        Criteria.arrayConditions = {
            'contains': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.array.contains', i18n.conditions.array.contains);
                },
                init: Criteria.initSelectArray,
                inputValue: Criteria.inputValueSelect,
                isInputValid: Criteria.isInputValidSelect,
                search: function (value, comparison) {
                    return value.includes(comparison[0]);
                }
            },
            'without': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.array.without', i18n.conditions.array.without);
                },
                init: Criteria.initSelectArray,
                inputValue: Criteria.inputValueSelect,
                isInputValid: Criteria.isInputValidSelect,
                search: function (value, comparison) {
                    return value.indexOf(comparison[0]) === -1;
                }
            },
            // eslint-disable-next-line sort-keys
            '=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.array.equals', i18n.conditions.array.equals);
                },
                init: Criteria.initSelect,
                inputValue: Criteria.inputValueSelect,
                isInputValid: Criteria.isInputValidSelect,
                search: function (value, comparison) {
                    if (value.length === comparison[0].length) {
                        for (var i = 0; i < value.length; i++) {
                            if (value[i] !== comparison[0][i]) {
                                return false;
                            }
                        }
                        return true;
                    }
                    return false;
                }
            },
            // eslint-disable-next-line sort-keys
            '!=': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.array.not', i18n.conditions.array.not);
                },
                init: Criteria.initSelect,
                inputValue: Criteria.inputValueSelect,
                isInputValid: Criteria.isInputValidSelect,
                search: function (value, comparison) {
                    if (value.length === comparison[0].length) {
                        for (var i = 0; i < value.length; i++) {
                            if (value[i] !== comparison[0][i]) {
                                return true;
                            }
                        }
                        return false;
                    }
                    return true;
                }
            },
            'null': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.array.empty', i18n.conditions.array.empty);
                },
                init: Criteria.initNoValue,
                inputValue: function () {
                    return;
                },
                isInputValid: function () {
                    return true;
                },
                search: function (value) {
                    return value === null || value === undefined || value.length === 0;
                }
            },
            // eslint-disable-next-line sort-keys
            '!null': {
                conditionName: function (dt, i18n) {
                    return dt.i18n('searchBuilder.conditions.array.notEmpty', i18n.conditions.array.notEmpty);
                },
                init: Criteria.initNoValue,
                inputValue: function () {
                    return;
                },
                isInputValid: function () {
                    return true;
                },
                search: function (value) {
                    return value !== null && value !== undefined && value.length !== 0;
                }
            }
        };
        // eslint will be sad because we have to disable member ordering for this as the
        // private static properties used are not yet declared otherwise
        // eslint-disable-next-line @typescript-eslint/member-ordering
        Criteria.defaults = {
            columns: true,
            conditions: {
                'array': Criteria.arrayConditions,
                'date': Criteria.dateConditions,
                'html': Criteria.stringConditions,
                'html-num': Criteria.numConditions,
                'html-num-fmt': Criteria.numFmtConditions,
                'luxon': Criteria.luxonDateConditions,
                'moment': Criteria.momentDateConditions,
                'num': Criteria.numConditions,
                'num-fmt': Criteria.numFmtConditions,
                'string': Criteria.stringConditions
            },
            depthLimit: false,
            enterSearch: false,
            filterChanged: undefined,
            greyscale: false,
            i18n: {
                add: 'Add Condition',
                button: {
                    0: 'Search Builder',
                    _: 'Search Builder (%d)'
                },
                clearAll: 'Clear All',
                condition: 'Condition',
                data: 'Data',
                "delete": '&times',
                deleteTitle: 'Delete filtering rule',
                left: '<',
                leftTitle: 'Outdent criteria',
                logicAnd: 'And',
                logicOr: 'Or',
                right: '>',
                rightTitle: 'Indent criteria',
                title: {
                    0: 'Custom Search Builder',
                    _: 'Custom Search Builder (%d)'
                },
                value: 'Value',
                valueJoiner: 'and'
            },
            logic: 'AND',
            orthogonal: {
                display: 'display',
                search: 'filter'
            },
            preDefined: false
        };
        return Criteria;
    }());

    var $$1;
    var dataTable$1;
    /**
     * Sets the value of jQuery for use in the file
     *
     * @param jq the instance of jQuery to be set
     */
    function setJQuery$1(jq) {
        $$1 = jq;
        dataTable$1 = jq.fn.dataTable;
    }
    /**
     * The Group class is used within SearchBuilder to represent a group of criteria
     */
    var Group = /** @class */ (function () {
        function Group(table, opts, topGroup, index, isChild, depth, serverData) {
            if (index === void 0) { index = 0; }
            if (isChild === void 0) { isChild = false; }
            if (depth === void 0) { depth = 1; }
            if (serverData === void 0) { serverData = undefined; }
            // Check that the required version of DataTables is included
            if (!dataTable$1 || !dataTable$1.versionCheck || !dataTable$1.versionCheck('1.10.0')) {
                throw new Error('SearchBuilder requires DataTables 1.10 or newer');
            }
            this.classes = $$1.extend(true, {}, Group.classes);
            // Get options from user
            this.c = $$1.extend(true, {}, Group.defaults, opts);
            this.s = {
                criteria: [],
                depth: depth,
                dt: table,
                index: index,
                isChild: isChild,
                logic: undefined,
                opts: opts,
                preventRedraw: false,
                serverData: serverData,
                toDrop: undefined,
                topGroup: topGroup
            };
            this.dom = {
                add: $$1('<button/>')
                    .addClass(this.classes.add)
                    .addClass(this.classes.button)
                    .attr('type', 'button'),
                clear: $$1('<button>&times</button>')
                    .addClass(this.classes.button)
                    .addClass(this.classes.clearGroup)
                    .attr('type', 'button'),
                container: $$1('<div/>')
                    .addClass(this.classes.group),
                logic: $$1('<button><div/></button>')
                    .addClass(this.classes.logic)
                    .addClass(this.classes.button)
                    .attr('type', 'button'),
                logicContainer: $$1('<div/>')
                    .addClass(this.classes.logicContainer)
            };
            // A reference to the top level group is maintained throughout any subgroups and criteria that may be created
            if (this.s.topGroup === undefined) {
                this.s.topGroup = this.dom.container;
            }
            this._setup();
            return this;
        }
        /**
         * Destroys the groups buttons, clears the internal criteria and removes it from the dom
         */
        Group.prototype.destroy = function () {
            // Turn off listeners
            this.dom.add.off('.dtsb');
            this.dom.logic.off('.dtsb');
            // Trigger event for groups at a higher level to pick up on
            this.dom.container
                .trigger('dtsb-destroy')
                .remove();
            this.s.criteria = [];
        };
        /**
         * Gets the details required to rebuild the group
         */
        // Eslint upset at empty object but needs to be done
        // eslint-disable-next-line @typescript-eslint/ban-types
        Group.prototype.getDetails = function (deFormatDates) {
            if (deFormatDates === void 0) { deFormatDates = false; }
            if (this.s.criteria.length === 0) {
                return {};
            }
            var details = {
                criteria: [],
                logic: this.s.logic
            };
            // NOTE here crit could be either a subgroup or a criteria
            for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
                var crit = _a[_i];
                details.criteria.push(crit.criteria.getDetails(deFormatDates));
            }
            return details;
        };
        /**
         * Getter for the node for the container of the group
         *
         * @returns Node for the container of the group
         */
        Group.prototype.getNode = function () {
            return this.dom.container;
        };
        /**
         * Rebuilds the group based upon the details passed in
         *
         * @param loadedDetails the details required to rebuild the group
         */
        Group.prototype.rebuild = function (loadedDetails) {
            // If no criteria are stored then just return
            if (loadedDetails.criteria === undefined ||
                loadedDetails.criteria === null ||
                Array.isArray(loadedDetails.criteria) && loadedDetails.criteria.length === 0) {
                return;
            }
            this.s.logic = loadedDetails.logic;
            this.dom.logic.children().first().html(this.s.logic === 'OR'
                ? this.s.dt.i18n('searchBuilder.logicOr', this.c.i18n.logicOr)
                : this.s.dt.i18n('searchBuilder.logicAnd', this.c.i18n.logicAnd));
            // Add all of the criteria, be it a sub group or a criteria
            if (Array.isArray(loadedDetails.criteria)) {
                for (var _i = 0, _a = loadedDetails.criteria; _i < _a.length; _i++) {
                    var crit = _a[_i];
                    if (crit.logic !== undefined) {
                        this._addPrevGroup(crit);
                    }
                    else if (crit.logic === undefined) {
                        this._addPrevCriteria(crit);
                    }
                }
            }
            // For all of the criteria children, update the arrows incase they require changing and set the listeners
            for (var _b = 0, _c = this.s.criteria; _b < _c.length; _b++) {
                var crit = _c[_b];
                if (crit.criteria instanceof Criteria) {
                    crit.criteria.updateArrows(this.s.criteria.length > 1);
                    this._setCriteriaListeners(crit.criteria);
                }
            }
        };
        /**
         * Redraws the Contents of the searchBuilder Groups and Criteria
         */
        Group.prototype.redrawContents = function () {
            if (this.s.preventRedraw) {
                return;
            }
            // Clear the container out and add the basic elements
            this.dom.container.children().detach();
            this.dom.container
                .append(this.dom.logicContainer)
                .append(this.dom.add);
            // Sort the criteria by index so that they appear in the correct order
            this.s.criteria.sort(function (a, b) {
                if (a.criteria.s.index < b.criteria.s.index) {
                    return -1;
                }
                else if (a.criteria.s.index > b.criteria.s.index) {
                    return 1;
                }
                return 0;
            });
            this.setListeners();
            for (var i = 0; i < this.s.criteria.length; i++) {
                var crit = this.s.criteria[i].criteria;
                if (crit instanceof Criteria) {
                    // Reset the index to the new value
                    this.s.criteria[i].index = i;
                    this.s.criteria[i].criteria.s.index = i;
                    // Add to the group
                    this.s.criteria[i].criteria.dom.container.insertBefore(this.dom.add);
                    // Set listeners for various points
                    this._setCriteriaListeners(crit);
                    this.s.criteria[i].criteria.s.preventRedraw = this.s.preventRedraw;
                    this.s.criteria[i].criteria.rebuild(this.s.criteria[i].criteria.getDetails());
                    this.s.criteria[i].criteria.s.preventRedraw = false;
                }
                else if (crit instanceof Group && crit.s.criteria.length > 0) {
                    // Reset the index to the new value
                    this.s.criteria[i].index = i;
                    this.s.criteria[i].criteria.s.index = i;
                    // Add the sub group to the group
                    this.s.criteria[i].criteria.dom.container.insertBefore(this.dom.add);
                    // Redraw the contents of the group
                    crit.s.preventRedraw = this.s.preventRedraw;
                    crit.redrawContents();
                    crit.s.preventRedraw = false;
                    this._setGroupListeners(crit);
                }
                else {
                    // The group is empty so remove it
                    this.s.criteria.splice(i, 1);
                    i--;
                }
            }
            this.setupLogic();
        };
        /**
         * Resizes the logic button only rather than the entire dom.
         */
        Group.prototype.redrawLogic = function () {
            for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
                var crit = _a[_i];
                if (crit.criteria instanceof Group) {
                    crit.criteria.redrawLogic();
                }
            }
            this.setupLogic();
        };
        /**
         * Search method, checking the row data against the criteria in the group
         *
         * @param rowData The row data to be compared
         * @returns boolean The result of the search
         */
        Group.prototype.search = function (rowData, rowIdx) {
            if (this.s.logic === 'AND') {
                return this._andSearch(rowData, rowIdx);
            }
            else if (this.s.logic === 'OR') {
                return this._orSearch(rowData, rowIdx);
            }
            return true;
        };
        /**
         * Locates the groups logic button to the correct location on the page
         */
        Group.prototype.setupLogic = function () {
            // Remove logic button
            this.dom.logicContainer.remove();
            this.dom.clear.remove();
            // If there are no criteria in the group then keep the logic removed and return
            if (this.s.criteria.length < 1) {
                if (!this.s.isChild) {
                    this.dom.container.trigger('dtsb-destroy');
                    // Set criteria left margin
                    this.dom.container.css('margin-left', 0);
                }
                return;
            }
            this.dom.clear.height('0px');
            this.dom.logicContainer.append(this.dom.clear);
            // Prepend logic button
            this.dom.container.prepend(this.dom.logicContainer);
            for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
                var crit = _a[_i];
                if (crit.criteria instanceof Criteria) {
                    crit.criteria.setupButtons();
                }
            }
            // Set width, take 2 for the border
            var height = this.dom.container.outerHeight() - 1;
            this.dom.logicContainer.width(height);
            this._setLogicListener();
            // Set criteria left margin
            this.dom.container.css('margin-left', this.dom.logicContainer.outerHeight(true));
            var logicOffset = this.dom.logicContainer.offset();
            // Set horizontal alignment
            var currentLeft = logicOffset.left;
            var groupLeft = this.dom.container.offset().left;
            var shuffleLeft = currentLeft - groupLeft;
            var newPos = currentLeft - shuffleLeft - this.dom.logicContainer.outerHeight(true);
            this.dom.logicContainer.offset({ left: newPos });
            // Set vertical alignment
            var firstCrit = this.dom.logicContainer.next();
            var currentTop = logicOffset.top;
            var firstTop = $$1(firstCrit).offset().top;
            var shuffleTop = currentTop - firstTop;
            var newTop = currentTop - shuffleTop;
            this.dom.logicContainer.offset({ top: newTop });
            this.dom.clear.outerHeight(this.dom.logicContainer.height());
            this._setClearListener();
        };
        /**
         * Sets listeners on the groups elements
         */
        Group.prototype.setListeners = function () {
            var _this = this;
            this.dom.add.unbind('click');
            this.dom.add.on('click.dtsb', function () {
                // If this is the parent group then the logic button has not been added yet
                if (!_this.s.isChild) {
                    _this.dom.container.prepend(_this.dom.logicContainer);
                }
                _this.addCriteria();
                _this.dom.container.trigger('dtsb-add');
                _this.s.dt.state.save();
                return false;
            });
            for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
                var crit = _a[_i];
                crit.criteria.setListeners();
            }
            this._setClearListener();
            this._setLogicListener();
        };
        /**
         * Adds a criteria to the group
         *
         * @param crit Instance of Criteria to be added to the group
         */
        Group.prototype.addCriteria = function (crit) {
            if (crit === void 0) { crit = null; }
            var index = crit === null ? this.s.criteria.length : crit.s.index;
            var criteria = new Criteria(this.s.dt, this.s.opts, this.s.topGroup, index, this.s.depth, this.s.serverData);
            // If a Criteria has been passed in then set the values to continue that
            if (crit !== null) {
                criteria.c = crit.c;
                criteria.s = crit.s;
                criteria.s.depth = this.s.depth;
                criteria.classes = crit.classes;
            }
            criteria.populate();
            var inserted = false;
            for (var i = 0; i < this.s.criteria.length; i++) {
                if (i === 0 && this.s.criteria[i].criteria.s.index > criteria.s.index) {
                    // Add the node for the criteria at the start of the group
                    criteria.getNode().insertBefore(this.s.criteria[i].criteria.dom.container);
                    inserted = true;
                }
                else if (i < this.s.criteria.length - 1 &&
                    this.s.criteria[i].criteria.s.index < criteria.s.index &&
                    this.s.criteria[i + 1].criteria.s.index > criteria.s.index) {
                    // Add the node for the criteria in the correct location
                    criteria.getNode().insertAfter(this.s.criteria[i].criteria.dom.container);
                    inserted = true;
                }
            }
            if (!inserted) {
                criteria.getNode().insertBefore(this.dom.add);
            }
            // Add the details for this criteria to the array
            this.s.criteria.push({
                criteria: criteria,
                index: index
            });
            this.s.criteria = this.s.criteria.sort(function (a, b) { return a.criteria.s.index - b.criteria.s.index; });
            for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
                var opt = _a[_i];
                if (opt.criteria instanceof Criteria) {
                    opt.criteria.updateArrows(this.s.criteria.length > 1);
                }
            }
            this._setCriteriaListeners(criteria);
            criteria.setListeners();
            this.setupLogic();
        };
        /**
         * Checks the group to see if it has any filled criteria
         */
        Group.prototype.checkFilled = function () {
            for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
                var crit = _a[_i];
                if (crit.criteria instanceof Criteria && crit.criteria.s.filled ||
                    crit.criteria instanceof Group && crit.criteria.checkFilled()) {
                    return true;
                }
            }
            return false;
        };
        /**
         * Gets the count for the number of criteria in this group and any sub groups
         */
        Group.prototype.count = function () {
            var count = 0;
            for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
                var crit = _a[_i];
                if (crit.criteria instanceof Group) {
                    count += crit.criteria.count();
                }
                else {
                    count++;
                }
            }
            return count;
        };
        /**
         * Rebuilds a sub group that previously existed
         *
         * @param loadedGroup The details of a group within this group
         */
        Group.prototype._addPrevGroup = function (loadedGroup) {
            var idx = this.s.criteria.length;
            var group = new Group(this.s.dt, this.c, this.s.topGroup, idx, true, this.s.depth + 1, this.s.serverData);
            // Add the new group to the criteria array
            this.s.criteria.push({
                criteria: group,
                index: idx,
                logic: group.s.logic
            });
            // Rebuild it with the previous conditions for that group
            group.rebuild(loadedGroup);
            this.s.criteria[idx].criteria = group;
            this.s.topGroup.trigger('dtsb-redrawContents');
            this._setGroupListeners(group);
        };
        /**
         * Rebuilds a criteria of this group that previously existed
         *
         * @param loadedCriteria The details of a criteria within the group
         */
        Group.prototype._addPrevCriteria = function (loadedCriteria) {
            var idx = this.s.criteria.length;
            var criteria = new Criteria(this.s.dt, this.s.opts, this.s.topGroup, idx, this.s.depth, this.s.serverData);
            criteria.populate();
            // Add the new criteria to the criteria array
            this.s.criteria.push({
                criteria: criteria,
                index: idx
            });
            // Rebuild it with the previous conditions for that criteria
            criteria.s.preventRedraw = this.s.preventRedraw;
            criteria.rebuild(loadedCriteria);
            criteria.s.preventRedraw = false;
            this.s.criteria[idx].criteria = criteria;
            if (!this.s.preventRedraw) {
                this.s.topGroup.trigger('dtsb-redrawContents');
            }
        };
        /**
         * Checks And the criteria using AND logic
         *
         * @param rowData The row data to be checked against the search criteria
         * @returns boolean The result of the AND search
         */
        Group.prototype._andSearch = function (rowData, rowIdx) {
            // If there are no criteria then return true for this group
            if (this.s.criteria.length === 0) {
                return true;
            }
            for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
                var crit = _a[_i];
                // If the criteria is not complete then skip it
                if (crit.criteria instanceof Criteria && !crit.criteria.s.filled) {
                    continue;
                }
                // Otherwise if a single one fails return false
                else if (!crit.criteria.search(rowData, rowIdx)) {
                    return false;
                }
            }
            // If we get to here then everything has passed, so return true for the group
            return true;
        };
        /**
         * Checks And the criteria using OR logic
         *
         * @param rowData The row data to be checked against the search criteria
         * @returns boolean The result of the OR search
         */
        Group.prototype._orSearch = function (rowData, rowIdx) {
            // If there are no criteria in the group then return true
            if (this.s.criteria.length === 0) {
                return true;
            }
            // This will check to make sure that at least one criteria in the group is complete
            var filledfound = false;
            for (var _i = 0, _a = this.s.criteria; _i < _a.length; _i++) {
                var crit = _a[_i];
                if (crit.criteria instanceof Criteria && crit.criteria.s.filled) {
                    // A completed criteria has been found so set the flag
                    filledfound = true;
                    // If the search passes then return true
                    if (crit.criteria.search(rowData, rowIdx)) {
                        return true;
                    }
                }
                else if (crit.criteria instanceof Group && crit.criteria.checkFilled()) {
                    filledfound = true;
                    if (crit.criteria.search(rowData, rowIdx)) {
                        return true;
                    }
                }
            }
            // If we get here we need to return the inverse of filledfound,
            //  as if any have been found and we are here then none have passed
            return !filledfound;
        };
        /**
         * Removes a criteria from the group
         *
         * @param criteria The criteria instance to be removed
         */
        Group.prototype._removeCriteria = function (criteria, group) {
            if (group === void 0) { group = false; }
            // If removing a criteria and there is only then then just destroy the group
            if (this.s.criteria.length <= 1 && this.s.isChild) {
                this.destroy();
            }
            else {
                // Otherwise splice the given criteria out and redo the indexes
                var last = void 0;
                for (var i = 0; i < this.s.criteria.length; i++) {
                    if (this.s.criteria[i].index === criteria.s.index &&
                        (!group || this.s.criteria[i].criteria instanceof Group)) {
                        last = i;
                    }
                }
                // We want to remove the last element with the desired index, as its replacement will be inserted before it
                if (last !== undefined) {
                    this.s.criteria.splice(last, 1);
                }
                for (var i = 0; i < this.s.criteria.length; i++) {
                    this.s.criteria[i].index = i;
                    this.s.criteria[i].criteria.s.index = i;
                }
            }
        };
        /**
         * Sets the listeners in group for a criteria
         *
         * @param criteria The criteria for the listeners to be set on
         */
        Group.prototype._setCriteriaListeners = function (criteria) {
            var _this = this;
            criteria.dom["delete"]
                .unbind('click')
                .on('click.dtsb', function () {
                _this._removeCriteria(criteria);
                criteria.dom.container.remove();
                for (var _i = 0, _a = _this.s.criteria; _i < _a.length; _i++) {
                    var crit = _a[_i];
                    if (crit.criteria instanceof Criteria) {
                        crit.criteria.updateArrows(_this.s.criteria.length > 1);
                    }
                }
                criteria.destroy();
                _this.s.dt.draw();
                _this.s.topGroup.trigger('dtsb-redrawContents');
                return false;
            });
            criteria.dom.right
                .unbind('click')
                .on('click.dtsb', function () {
                var idx = criteria.s.index;
                var group = new Group(_this.s.dt, _this.s.opts, _this.s.topGroup, criteria.s.index, true, _this.s.depth + 1, _this.s.serverData);
                // Add the criteria that is to be moved to the new group
                group.addCriteria(criteria);
                // Update the details in the current groups criteria array
                _this.s.criteria[idx].criteria = group;
                _this.s.criteria[idx].logic = 'AND';
                _this.s.topGroup.trigger('dtsb-redrawContents');
                _this._setGroupListeners(group);
                return false;
            });
            criteria.dom.left
                .unbind('click')
                .on('click.dtsb', function () {
                _this.s.toDrop = new Criteria(_this.s.dt, _this.s.opts, _this.s.topGroup, criteria.s.index, undefined, _this.s.serverData);
                _this.s.toDrop.s = criteria.s;
                _this.s.toDrop.c = criteria.c;
                _this.s.toDrop.classes = criteria.classes;
                _this.s.toDrop.populate();
                // The dropCriteria event mutates the reference to the index so need to store it
                var index = _this.s.toDrop.s.index;
                _this.dom.container.trigger('dtsb-dropCriteria');
                criteria.s.index = index;
                _this._removeCriteria(criteria);
                // By tracking the top level group we can directly trigger a redraw on it,
                //  bubbling is also possible, but that is slow with deep levelled groups
                _this.s.topGroup.trigger('dtsb-redrawContents');
                _this.s.dt.draw();
                return false;
            });
        };
        /**
         * Set's the listeners for the group clear button
         */
        Group.prototype._setClearListener = function () {
            var _this = this;
            this.dom.clear
                .unbind('click')
                .on('click.dtsb', function () {
                if (!_this.s.isChild) {
                    _this.dom.container.trigger('dtsb-clearContents');
                    return false;
                }
                _this.destroy();
                _this.s.topGroup.trigger('dtsb-redrawContents');
                return false;
            });
        };
        /**
         * Sets listeners for sub groups of this group
         *
         * @param group The sub group that the listeners are to be set on
         */
        Group.prototype._setGroupListeners = function (group) {
            var _this = this;
            // Set listeners for the new group
            group.dom.add
                .unbind('click')
                .on('click.dtsb', function () {
                _this.setupLogic();
                _this.dom.container.trigger('dtsb-add');
                return false;
            });
            group.dom.container
                .unbind('dtsb-add')
                .on('dtsb-add.dtsb', function () {
                _this.setupLogic();
                _this.dom.container.trigger('dtsb-add');
                return false;
            });
            group.dom.container
                .unbind('dtsb-destroy')
                .on('dtsb-destroy.dtsb', function () {
                _this._removeCriteria(group, true);
                group.dom.container.remove();
                _this.setupLogic();
                return false;
            });
            group.dom.container
                .unbind('dtsb-dropCriteria')
                .on('dtsb-dropCriteria.dtsb', function () {
                var toDrop = group.s.toDrop;
                toDrop.s.index = group.s.index;
                toDrop.updateArrows(_this.s.criteria.length > 1);
                _this.addCriteria(toDrop);
                return false;
            });
            group.setListeners();
        };
        /**
         * Sets up the Group instance, setting listeners and appending elements
         */
        Group.prototype._setup = function () {
            this.setListeners();
            this.dom.add.html(this.s.dt.i18n('searchBuilder.add', this.c.i18n.add));
            this.dom.logic.children().first().html(this.c.logic === 'OR'
                ? this.s.dt.i18n('searchBuilder.logicOr', this.c.i18n.logicOr)
                : this.s.dt.i18n('searchBuilder.logicAnd', this.c.i18n.logicAnd));
            this.s.logic = this.c.logic === 'OR' ? 'OR' : 'AND';
            if (this.c.greyscale) {
                this.dom.logic.addClass(this.classes.greyscale);
            }
            this.dom.logicContainer.append(this.dom.logic).append(this.dom.clear);
            // Only append the logic button immediately if this is a sub group,
            //  otherwise it will be prepended later when adding a criteria
            if (this.s.isChild) {
                this.dom.container.append(this.dom.logicContainer);
            }
            this.dom.container.append(this.dom.add);
        };
        /**
         * Sets the listener for the logic button
         */
        Group.prototype._setLogicListener = function () {
            var _this = this;
            this.dom.logic
                .unbind('click')
                .on('click.dtsb', function () {
                _this._toggleLogic();
                _this.s.dt.draw();
                for (var _i = 0, _a = _this.s.criteria; _i < _a.length; _i++) {
                    var crit = _a[_i];
                    crit.criteria.setListeners();
                }
            });
        };
        /**
         * Toggles the logic for the group
         */
        Group.prototype._toggleLogic = function () {
            if (this.s.logic === 'OR') {
                this.s.logic = 'AND';
                this.dom.logic.children().first().html(this.s.dt.i18n('searchBuilder.logicAnd', this.c.i18n.logicAnd));
            }
            else if (this.s.logic === 'AND') {
                this.s.logic = 'OR';
                this.dom.logic.children().first().html(this.s.dt.i18n('searchBuilder.logicOr', this.c.i18n.logicOr));
            }
        };
        Group.version = '1.1.0';
        Group.classes = {
            add: 'dtsb-add',
            button: 'dtsb-button',
            clearGroup: 'dtsb-clearGroup',
            greyscale: 'dtsb-greyscale',
            group: 'dtsb-group',
            inputButton: 'dtsb-iptbtn',
            logic: 'dtsb-logic',
            logicContainer: 'dtsb-logicContainer'
        };
        Group.defaults = {
            columns: true,
            conditions: {
                'date': Criteria.dateConditions,
                'html': Criteria.stringConditions,
                'html-num': Criteria.numConditions,
                'html-num-fmt': Criteria.numFmtConditions,
                'luxon': Criteria.luxonDateConditions,
                'moment': Criteria.momentDateConditions,
                'num': Criteria.numConditions,
                'num-fmt': Criteria.numFmtConditions,
                'string': Criteria.stringConditions
            },
            depthLimit: false,
            enterSearch: false,
            filterChanged: undefined,
            greyscale: false,
            i18n: {
                add: 'Add Condition',
                button: {
                    0: 'Search Builder',
                    _: 'Search Builder (%d)'
                },
                clearAll: 'Clear All',
                condition: 'Condition',
                data: 'Data',
                "delete": '&times',
                deleteTitle: 'Delete filtering rule',
                left: '<',
                leftTitle: 'Outdent criteria',
                logicAnd: 'And',
                logicOr: 'Or',
                right: '>',
                rightTitle: 'Indent criteria',
                title: {
                    0: 'Custom Search Builder',
                    _: 'Custom Search Builder (%d)'
                },
                value: 'Value',
                valueJoiner: 'and'
            },
            logic: 'AND',
            orthogonal: {
                display: 'display',
                search: 'filter'
            },
            preDefined: false
        };
        return Group;
    }());

    var $;
    var dataTable;
    /**
     * Sets the value of jQuery for use in the file
     *
     * @param jq the instance of jQuery to be set
     */
    function setJQuery(jq) {
        $ = jq;
        dataTable = jq.fn.DataTable;
    }
    /**
     * SearchBuilder class for DataTables.
     * Allows for complex search queries to be constructed and implemented on a DataTable
     */
    var SearchBuilder = /** @class */ (function () {
        function SearchBuilder(builderSettings, opts) {
            var _this = this;
            // Check that the required version of DataTables is included
            if (!dataTable || !dataTable.versionCheck || !dataTable.versionCheck('1.10.0')) {
                throw new Error('SearchBuilder requires DataTables 1.10 or newer');
            }
            var table = new dataTable.Api(builderSettings);
            this.classes = $.extend(true, {}, SearchBuilder.classes);
            // Get options from user
            this.c = $.extend(true, {}, SearchBuilder.defaults, opts);
            this.dom = {
                clearAll: $('<button type="button">' + table.i18n('searchBuilder.clearAll', this.c.i18n.clearAll) + '</button>')
                    .addClass(this.classes.clearAll)
                    .addClass(this.classes.button)
                    .attr('type', 'button'),
                container: $('<div/>')
                    .addClass(this.classes.container),
                title: $('<div/>')
                    .addClass(this.classes.title),
                titleRow: $('<div/>')
                    .addClass(this.classes.titleRow),
                topGroup: undefined
            };
            this.s = {
                dt: table,
                opts: opts,
                search: undefined,
                serverData: undefined,
                topGroup: undefined
            };
            // If searchbuilder is already defined for this table then return
            if (table.settings()[0]._searchBuilder !== undefined) {
                return;
            }
            table.settings()[0]._searchBuilder = this;
            // If using SSP we want to include the previous state in the very first server call
            if (this.s.dt.page.info().serverSide) {
                this.s.dt.on('preXhr.dtsb', function (e, settings, data) {
                    var loadedState = _this.s.dt.state.loaded();
                    if (loadedState && loadedState.searchBuilder) {
                        data.searchBuilder = _this._collapseArray(loadedState.searchBuilder);
                    }
                });
                this.s.dt.on('xhr.dtsb', function (e, settings, json) {
                    if (json && json.searchBuilder && json.searchBuilder.options) {
                        _this.s.serverData = json.searchBuilder.options;
                    }
                });
            }
            // Run the remaining setup when the table is initialised
            if (this.s.dt.settings()[0]._bInitComplete) {
                this._setUp();
            }
            else {
                table.one('init.dt', function () {
                    _this._setUp();
                });
            }
            return this;
        }
        /**
         * Gets the details required to rebuild the SearchBuilder as it currently is
         */
        // eslint upset at empty object but that is what it is
        // eslint-disable-next-line @typescript-eslint/ban-types
        SearchBuilder.prototype.getDetails = function (deFormatDates) {
            if (deFormatDates === void 0) { deFormatDates = false; }
            return this.s.topGroup.getDetails(deFormatDates);
        };
        /**
         * Getter for the node of the container for the searchBuilder
         *
         * @returns JQuery<HTMLElement> the node of the container
         */
        SearchBuilder.prototype.getNode = function () {
            return this.dom.container;
        };
        /**
         * Rebuilds the SearchBuilder to a state that is provided
         *
         * @param details The details required to perform a rebuild
         */
        SearchBuilder.prototype.rebuild = function (details) {
            this.dom.clearAll.click();
            // If there are no details to rebuild then return
            if (details === undefined || details === null) {
                return this;
            }
            this.s.topGroup.s.preventRedraw = true;
            this.s.topGroup.rebuild(details);
            this.s.topGroup.s.preventRedraw = false;
            this._checkClear();
            this._updateTitle(this.s.topGroup.count());
            this.s.topGroup.redrawContents();
            this.s.dt.draw(false);
            this.s.topGroup.setListeners();
            return this;
        };
        /**
         * Applies the defaults to preDefined criteria
         *
         * @param preDef the array of criteria to be processed.
         */
        SearchBuilder.prototype._applyPreDefDefaults = function (preDef) {
            var _this = this;
            if (preDef.criteria !== undefined && preDef.logic === undefined) {
                preDef.logic = 'AND';
            }
            var _loop_1 = function (crit) {
                // Apply the defaults to any further criteria
                if (crit.criteria !== undefined) {
                    crit = this_1._applyPreDefDefaults(crit);
                }
                else {
                    this_1.s.dt.columns().every(function (index) {
                        if (_this.s.dt.settings()[0].aoColumns[index].sTitle === crit.data) {
                            crit.dataIdx = index;
                        }
                    });
                }
            };
            var this_1 = this;
            for (var _i = 0, _a = preDef.criteria; _i < _a.length; _i++) {
                var crit = _a[_i];
                _loop_1(crit);
            }
            return preDef;
        };
        /**
         * Set's up the SearchBuilder
         */
        SearchBuilder.prototype._setUp = function (loadState) {
            var _this = this;
            if (loadState === void 0) { loadState = true; }
            // Register an Api method for getting the column type
            $.fn.DataTable.Api.registerPlural('columns().type()', 'column().type()', function () {
                return this.iterator('column', function (settings, column) {
                    return settings.aoColumns[column].sType;
                }, 1);
            });
            // Check that DateTime is included, If not need to check if it could be used
            // eslint-disable-next-line no-extra-parens
            if (!dataTable.DateTime) {
                var types = this.s.dt.columns().type().toArray();
                if (types === undefined || types.includes(undefined) || types.includes(null)) {
                    types = [];
                    for (var _i = 0, _a = this.s.dt.settings()[0].aoColumns; _i < _a.length; _i++) {
                        var colInit = _a[_i];
                        types.push(colInit.searchBuilderType !== undefined ? colInit.searchBuilderType : colInit.sType);
                    }
                }
                var columnIdxs = this.s.dt.columns().toArray();
                // If the types are not yet set then draw to see if they can be retrieved then
                if (types === undefined || types.includes(undefined) || types.includes(null)) {
                    $.fn.dataTable.ext.oApi._fnColumnTypes(this.s.dt.settings()[0]);
                    types = this.s.dt.columns().type().toArray();
                }
                for (var i = 0; i < columnIdxs[0].length; i++) {
                    var column = columnIdxs[0][i];
                    var type = types[column];
                    if (
                    // Check if this column can be filtered
                    (this.c.columns === true ||
                        Array.isArray(this.c.columns) &&
                            this.c.columns.includes(i)) &&
                        // Check if the type is one of the restricted types
                        (type.includes('date') ||
                            type.includes('moment') ||
                            type.includes('luxon'))) {
                        alert('SearchBuilder Requires DateTime when used with dates.');
                        throw new Error('SearchBuilder requires DateTime');
                    }
                }
            }
            this.s.topGroup = new Group(this.s.dt, this.c, undefined, undefined, undefined, undefined, this.s.serverData);
            this._setClearListener();
            this.s.dt.on('stateSaveParams.dtsb', function (e, settings, data) {
                data.searchBuilder = _this.getDetails();
                if (!data.scroller) {
                    data.page = _this.s.dt.page();
                }
                else {
                    data.start = _this.s.dt.state().start;
                }
            });
            this.s.dt.on('stateLoadParams.dtsb', function (e, settings, data) {
                _this.rebuild(data.searchBuilder);
            });
            this._build();
            this.s.dt.on('preXhr.dtsb', function (e, settings, data) {
                if (_this.s.dt.page.info().serverSide) {
                    data.searchBuilder = _this._collapseArray(_this.getDetails(true));
                }
            });
            this.s.dt.on('column-reorder', function () {
                _this.rebuild(_this.getDetails());
            });
            if (loadState) {
                var loadedState = this.s.dt.state.loaded();
                // If the loaded State is not null rebuild based on it for statesave
                if (loadedState !== null && loadedState.searchBuilder !== undefined) {
                    this.s.topGroup.rebuild(loadedState.searchBuilder);
                    this.s.topGroup.dom.container.trigger('dtsb-redrawContents');
                    // If using SSP we want to restrict the amount of server calls that take place
                    //  and this information will already have been processed
                    if (!this.s.dt.page.info().serverSide) {
                        if (loadedState.page) {
                            this.s.dt.page(loadedState.page).draw('page');
                        }
                        else if (this.s.dt.scroller && loadedState.scroller) {
                            this.s.dt.scroller().scrollToRow(loadedState.scroller.topRow);
                        }
                    }
                    this.s.topGroup.setListeners();
                }
                // Otherwise load any predefined options
                else if (this.c.preDefined !== false) {
                    this.c.preDefined = this._applyPreDefDefaults(this.c.preDefined);
                    this.rebuild(this.c.preDefined);
                }
            }
            this._setEmptyListener();
            this.s.dt.state.save();
        };
        SearchBuilder.prototype._collapseArray = function (criteria) {
            if (criteria.logic === undefined) {
                if (criteria.value !== undefined) {
                    criteria.value.sort(function (a, b) {
                        if (!isNaN(+a)) {
                            a = +a;
                            b = +b;
                        }
                        if (a < b) {
                            return -1;
                        }
                        else if (b < a) {
                            return 1;
                        }
                        else {
                            return 0;
                        }
                    });
                    criteria.value1 = criteria.value[0];
                    criteria.value2 = criteria.value[1];
                }
            }
            else {
                for (var i = 0; i < criteria.criteria.length; i++) {
                    criteria.criteria[i] = this._collapseArray(criteria.criteria[i]);
                }
            }
            return criteria;
        };
        /**
         * Updates the title of the SearchBuilder
         *
         * @param count the number of filters in the SearchBuilder
         */
        SearchBuilder.prototype._updateTitle = function (count) {
            this.dom.title.html(this.s.dt.i18n('searchBuilder.title', this.c.i18n.title, count));
        };
        /**
         * Builds all of the dom elements together
         */
        SearchBuilder.prototype._build = function () {
            var _this = this;
            // Empty and setup the container
            this.dom.clearAll.remove();
            this.dom.container.empty();
            var count = this.s.topGroup.count();
            this._updateTitle(count);
            this.dom.titleRow.append(this.dom.title);
            this.dom.container.append(this.dom.titleRow);
            this.dom.topGroup = this.s.topGroup.getNode();
            this.dom.container.append(this.dom.topGroup);
            this._setRedrawListener();
            var tableNode = this.s.dt.table(0).node();
            if (!$.fn.dataTable.ext.search.includes(this.s.search)) {
                // Custom search function for SearchBuilder
                this.s.search = function (settings, searchData, dataIndex) {
                    if (settings.nTable !== tableNode) {
                        return true;
                    }
                    return _this.s.topGroup.search(searchData, dataIndex);
                };
                // Add SearchBuilder search function to the dataTables search array
                $.fn.dataTable.ext.search.push(this.s.search);
            }
            this.s.dt.on('destroy.dtsb', function () {
                _this.dom.container.remove();
                _this.dom.clearAll.remove();
                var searchIdx = $.fn.dataTable.ext.search.indexOf(_this.s.search);
                while (searchIdx !== -1) {
                    $.fn.dataTable.ext.search.splice(searchIdx, 1);
                    searchIdx = $.fn.dataTable.ext.search.indexOf(_this.s.search);
                }
                _this.s.dt.off('.dtsb');
                $(_this.s.dt.table().node()).off('.dtsb');
            });
        };
        /**
         * Checks if the clearAll button should be added or not
         */
        SearchBuilder.prototype._checkClear = function () {
            if (this.s.topGroup.s.criteria.length > 0) {
                this.dom.clearAll.insertAfter(this.dom.title);
                this._setClearListener();
            }
            else {
                this.dom.clearAll.remove();
            }
        };
        /**
         * Update the count in the title/button
         *
         * @param count Number of filters applied
         */
        SearchBuilder.prototype._filterChanged = function (count) {
            var fn = this.c.filterChanged;
            if (typeof fn === 'function') {
                fn(count, this.s.dt.i18n('searchBuilder.button', this.c.i18n.button, count));
            }
        };
        /**
         * Set the listener for the clear button
         */
        SearchBuilder.prototype._setClearListener = function () {
            var _this = this;
            this.dom.clearAll.unbind('click');
            this.dom.clearAll.on('click.dtsb', function () {
                _this.s.topGroup = new Group(_this.s.dt, _this.c, undefined, undefined, undefined, undefined, _this.s.serverData);
                _this._build();
                _this.s.dt.draw();
                _this.s.topGroup.setListeners();
                _this.dom.clearAll.remove();
                _this._setEmptyListener();
                _this._filterChanged(0);
                return false;
            });
        };
        /**
         * Set the listener for the Redraw event
         */
        SearchBuilder.prototype._setRedrawListener = function () {
            var _this = this;
            this.s.topGroup.dom.container.unbind('dtsb-redrawContents');
            this.s.topGroup.dom.container.on('dtsb-redrawContents.dtsb', function () {
                _this._checkClear();
                _this.s.topGroup.redrawContents();
                _this.s.topGroup.setupLogic();
                _this._setEmptyListener();
                var count = _this.s.topGroup.count();
                _this._updateTitle(count);
                _this._filterChanged(count);
                // If using SSP we want to restrict the amount of server calls that take place
                //  and this information will already have been processed
                if (!_this.s.dt.page.info().serverSide) {
                    _this.s.dt.draw();
                }
                _this.s.dt.state.save();
            });
            this.s.topGroup.dom.container.unbind('dtsb-redrawContents-noDraw');
            this.s.topGroup.dom.container.on('dtsb-redrawContents-noDraw.dtsb', function () {
                _this._checkClear();
                _this.s.topGroup.s.preventRedraw = true;
                _this.s.topGroup.redrawContents();
                _this.s.topGroup.s.preventRedraw = false;
                _this.s.topGroup.setupLogic();
                _this._setEmptyListener();
                var count = _this.s.topGroup.count();
                _this._updateTitle(count);
                _this._filterChanged(count);
            });
            this.s.topGroup.dom.container.unbind('dtsb-redrawLogic');
            this.s.topGroup.dom.container.on('dtsb-redrawLogic.dtsb', function () {
                _this.s.topGroup.redrawLogic();
                var count = _this.s.topGroup.count();
                _this._updateTitle(count);
                _this._filterChanged(count);
            });
            this.s.topGroup.dom.container.unbind('dtsb-add');
            this.s.topGroup.dom.container.on('dtsb-add.dtsb', function () {
                var count = _this.s.topGroup.count();
                _this._updateTitle(count);
                _this._filterChanged(count);
            });
            this.s.dt.on('postEdit.dtsb postCreate.dtsb postRemove.dtsb', function () {
                _this.s.topGroup.redrawContents();
            });
            this.s.topGroup.dom.container.unbind('dtsb-clearContents');
            this.s.topGroup.dom.container.on('dtsb-clearContents.dtsb', function () {
                _this._setUp(false);
                _this._filterChanged(0);
                _this.s.dt.draw();
            });
        };
        /**
         * Sets listeners to check whether clearAll should be added or removed
         */
        SearchBuilder.prototype._setEmptyListener = function () {
            var _this = this;
            this.s.topGroup.dom.add.on('click.dtsb', function () {
                _this._checkClear();
            });
            this.s.topGroup.dom.container.on('dtsb-destroy.dtsb', function () {
                _this.dom.clearAll.remove();
            });
        };
        SearchBuilder.version = '1.3.4';
        SearchBuilder.classes = {
            button: 'dtsb-button',
            clearAll: 'dtsb-clearAll',
            container: 'dtsb-searchBuilder',
            inputButton: 'dtsb-iptbtn',
            title: 'dtsb-title',
            titleRow: 'dtsb-titleRow'
        };
        SearchBuilder.defaults = {
            columns: true,
            conditions: {
                'date': Criteria.dateConditions,
                'html': Criteria.stringConditions,
                'html-num': Criteria.numConditions,
                'html-num-fmt': Criteria.numFmtConditions,
                'luxon': Criteria.luxonDateConditions,
                'moment': Criteria.momentDateConditions,
                'num': Criteria.numConditions,
                'num-fmt': Criteria.numFmtConditions,
                'string': Criteria.stringConditions
            },
            depthLimit: false,
            enterSearch: false,
            filterChanged: undefined,
            greyscale: false,
            i18n: {
                add: 'Add Condition',
                button: {
                    0: 'Search Builder',
                    _: 'Search Builder (%d)'
                },
                clearAll: 'Clear All',
                condition: 'Condition',
                conditions: {
                    array: {
                        contains: 'Contains',
                        empty: 'Empty',
                        equals: 'Equals',
                        not: 'Not',
                        notEmpty: 'Not Empty',
                        without: 'Without'
                    },
                    date: {
                        after: 'After',
                        before: 'Before',
                        between: 'Between',
                        empty: 'Empty',
                        equals: 'Equals',
                        not: 'Not',
                        notBetween: 'Not Between',
                        notEmpty: 'Not Empty'
                    },
                    // eslint-disable-next-line id-blacklist
                    number: {
                        between: 'Between',
                        empty: 'Empty',
                        equals: 'Equals',
                        gt: 'Greater Than',
                        gte: 'Greater Than Equal To',
                        lt: 'Less Than',
                        lte: 'Less Than Equal To',
                        not: 'Not',
                        notBetween: 'Not Between',
                        notEmpty: 'Not Empty'
                    },
                    // eslint-disable-next-line id-blacklist
                    string: {
                        contains: 'Contains',
                        empty: 'Empty',
                        endsWith: 'Ends With',
                        equals: 'Equals',
                        not: 'Not',
                        notContains: 'Does Not Contain',
                        notEmpty: 'Not Empty',
                        notEndsWith: 'Does Not End With',
                        notStartsWith: 'Does Not Start With',
                        startsWith: 'Starts With'
                    }
                },
                data: 'Data',
                "delete": '&times',
                deleteTitle: 'Delete filtering rule',
                left: '<',
                leftTitle: 'Outdent criteria',
                logicAnd: 'And',
                logicOr: 'Or',
                right: '>',
                rightTitle: 'Indent criteria',
                title: {
                    0: 'Custom Search Builder',
                    _: 'Custom Search Builder (%d)'
                },
                value: 'Value',
                valueJoiner: 'and'
            },
            logic: 'AND',
            orthogonal: {
                display: 'display',
                search: 'filter'
            },
            preDefined: false
        };
        return SearchBuilder;
    }());

    /*! SearchBuilder 1.3.4
     * ©SpryMedia Ltd - datatables.net/license/mit
     */
    // DataTables extensions common UMD. Note that this allows for AMD, CommonJS
    // (with window and jQuery being allowed as parameters to the returned
    // function) or just default browser loading.
    (function (factory) {
        if (typeof define === 'function' && define.amd) {
            // AMD
            define(['jquery', 'datatables.net'], function ($) {
                return factory($, window, document);
            });
        }
        else if (typeof exports === 'object') {
            // CommonJS
            module.exports = function (root, $) {
                if (!root) {
                    root = window;
                }
                if (!$ || !$.fn.dataTable) {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    $ = require('datatables.net')(root, $).$;
                }
                return factory($, root, root.document);
            };
        }
        else {
            // Browser - assume jQuery has already been loaded
            // eslint-disable-next-line no-extra-parens
            factory(window.jQuery, window, document);
        }
    }(function ($, window, document) {
        setJQuery($);
        setJQuery$1($);
        setJQuery$2($);
        var dataTable = $.fn.dataTable;
        // eslint-disable-next-line no-extra-parens
        $.fn.dataTable.SearchBuilder = SearchBuilder;
        // eslint-disable-next-line no-extra-parens
        $.fn.DataTable.SearchBuilder = SearchBuilder;
        // eslint-disable-next-line no-extra-parens
        $.fn.dataTable.Group = Group;
        // eslint-disable-next-line no-extra-parens
        $.fn.DataTable.Group = Group;
        // eslint-disable-next-line no-extra-parens
        $.fn.dataTable.Criteria = Criteria;
        // eslint-disable-next-line no-extra-parens
        $.fn.DataTable.Criteria = Criteria;
        // eslint-disable-next-line no-extra-parens
        var apiRegister = $.fn.dataTable.Api.register;
        // Set up object for plugins
        $.fn.dataTable.ext.searchBuilder = {
            conditions: {}
        };
        $.fn.dataTable.ext.buttons.searchBuilder = {
            action: function (e, dt, node, config) {
                this.popover(config._searchBuilder.getNode(), {
                    align: 'container',
                    span: 'container'
                });
                var topGroup = config._searchBuilder.s.topGroup;
                // Need to redraw the contents to calculate the correct positions for the elements
                if (topGroup !== undefined) {
                    topGroup.dom.container.trigger('dtsb-redrawContents-noDraw');
                }
                if (topGroup.s.criteria.length === 0) {
                    $('.' + $.fn.dataTable.Group.classes.add.replace(/ /g, '.')).click();
                }
            },
            config: {},
            init: function (dt, node, config) {
                var sb = new $.fn.dataTable.SearchBuilder(dt, $.extend({
                    filterChanged: function (count, text) {
                        dt.button(node).text(text);
                    }
                }, config.config));
                dt.button(node).text(config.text || dt.i18n('searchBuilder.button', sb.c.i18n.button, 0));
                config._searchBuilder = sb;
            },
            text: null
        };
        apiRegister('searchBuilder.getDetails()', function (deFormatDates) {
            if (deFormatDates === void 0) { deFormatDates = false; }
            var ctx = this.context[0];
            // If SearchBuilder has not been initialised on this instance then return
            return ctx._searchBuilder ?
                ctx._searchBuilder.getDetails(deFormatDates) :
                null;
        });
        apiRegister('searchBuilder.rebuild()', function (details) {
            var ctx = this.context[0];
            // If SearchBuilder has not been initialised on this instance then return
            if (ctx._searchBuilder === undefined) {
                return null;
            }
            ctx._searchBuilder.rebuild(details);
            return this;
        });
        apiRegister('searchBuilder.container()', function () {
            var ctx = this.context[0];
            // If SearchBuilder has not been initialised on this instance then return
            return ctx._searchBuilder ?
                ctx._searchBuilder.getNode() :
                null;
        });
        /**
         * Init function for SearchBuilder
         *
         * @param settings the settings to be applied
         * @param options the options for SearchBuilder
         * @returns JQUERY<HTMLElement> Returns the node of the SearchBuilder
         */
        function _init(settings, options) {
            var api = new dataTable.Api(settings);
            var opts = options
                ? options
                : api.init().searchBuilder || dataTable.defaults.searchBuilder;
            var searchBuilder = new SearchBuilder(api, opts);
            var node = searchBuilder.getNode();
            return node;
        }
        // Attach a listener to the document which listens for DataTables initialisation
        // events so we can automatically initialise
        $(document).on('preInit.dt.dtsp', function (e, settings) {
            if (e.namespace !== 'dt') {
                return;
            }
            if (settings.oInit.searchBuilder ||
                dataTable.defaults.searchBuilder) {
                if (!settings._searchBuilder) {
                    _init(settings);
                }
            }
        });
        // DataTables `dom` feature option
        dataTable.ext.feature.push({
            cFeature: 'Q',
            fnInit: _init
        });
        // DataTables 2 layout feature
        if (dataTable.ext.features) {
            dataTable.ext.features.register('searchBuilder', _init);
        }
    }));

})();


(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery', 'datatables.net-bs4', 'datatables.net-searchbuilder'], function ($) {
            return factory($);
        });
    }
    else if (typeof exports === 'object') {
        // CommonJS
        module.exports = function (root, $) {
            if (!root) {
                root = window;
            }
            if (!$ || !$.fn.dataTable) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                $ = require('datatables.net-bs4')(root, $).$;
            }
            if (!$.fn.dataTable.searchBuilder) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                require('datatables.net-searchbuilder')(root, $);
            }
            return factory($);
        };
    }
    else {
        // Browser
        factory(jQuery);
    }
}(function ($) {
    'use strict';
    var dataTable = $.fn.dataTable;
    $.extend(true, dataTable.SearchBuilder.classes, {
        clearAll: 'btn btn-light dtsb-clearAll'
    });
    $.extend(true, dataTable.Group.classes, {
        add: 'btn btn-light dtsb-add',
        clearGroup: 'btn btn-light dtsb-clearGroup',
        logic: 'btn btn-light dtsb-logic'
    });
    $.extend(true, dataTable.Criteria.classes, {
        condition: 'form-control dtsb-condition',
        data: 'form-control dtsb-data',
        "delete": 'btn btn-light dtsb-delete',
        left: 'btn btn-light dtsb-left',
        right: 'btn btn-light dtsb-right',
        value: 'form-control dtsb-value'
    });
    return dataTable.searchPanes;
}));


/*! SearchPanes 2.0.2
 * 2019-2022 SpryMedia Ltd - datatables.net/license
 */
(function () {
    'use strict';

    var $$4;
    var dataTable$1;
    function setJQuery$4(jq) {
        $$4 = jq;
        dataTable$1 = jq.fn.dataTable;
    }
    var SearchPane = /** @class */ (function () {
        /**
         * Creates the panes, sets up the search function
         *
         * @param paneSettings The settings for the searchPanes
         * @param opts The options for the default features
         * @param index the index of the column for this pane
         * @param panesContainer The overall container for SearchPanes that this pane will be attached to
         * @param panes The custom pane settings if this is a custom pane
         * @returns {object} the pane that has been created, including the table and the index of the pane
         */
        function SearchPane(paneSettings, opts, index, panesContainer, panes) {
            var _this = this;
            if (panes === void 0) { panes = null; }
            // Check that the required version of DataTables is included
            if (!dataTable$1 || !dataTable$1.versionCheck || !dataTable$1.versionCheck('1.10.0')) {
                throw new Error('SearchPane requires DataTables 1.10 or newer');
            }
            // Check that Select is included
            // eslint-disable-next-line no-extra-parens
            if (!dataTable$1.select) {
                throw new Error('SearchPane requires Select');
            }
            var table = new dataTable$1.Api(paneSettings);
            this.classes = $$4.extend(true, {}, SearchPane.classes);
            // Get options from user
            this.c = $$4.extend(true, {}, SearchPane.defaults, opts);
            if (opts && opts.hideCount && opts.viewCount === undefined) {
                this.c.viewCount = !this.c.hideCount;
            }
            var rowLength = table.columns().eq(0).toArray().length;
            this.s = {
                colExists: index < rowLength,
                colOpts: undefined,
                customPaneSettings: panes,
                displayed: false,
                dt: table,
                dtPane: undefined,
                firstSet: true,
                index: index,
                indexes: [],
                listSet: false,
                name: undefined,
                rowData: {
                    arrayFilter: [],
                    arrayOriginal: [],
                    bins: {},
                    binsOriginal: {},
                    filterMap: new Map(),
                    totalOptions: 0
                },
                scrollTop: 0,
                searchFunction: undefined,
                selections: [],
                serverSelect: [],
                serverSelecting: false,
                tableLength: null,
                updating: false
            };
            this.s.colOpts = this.s.colExists ? this._getOptions() : this._getBonusOptions();
            this.dom = {
                buttonGroup: $$4('<div/>').addClass(this.classes.buttonGroup),
                clear: $$4('<button type="button">&#215;</button>')
                    .attr('disabled', 'true')
                    .addClass(this.classes.disabledButton)
                    .addClass(this.classes.paneButton)
                    .addClass(this.classes.clearButton)
                    .html(this.s.dt.i18n('searchPanes.clearPane', this.c.i18n.clearPane)),
                collapseButton: $$4('<button type="button"><span class="' + this.classes.caret + '">&#x5e;</span></button>')
                    .addClass(this.classes.paneButton)
                    .addClass(this.classes.collapseButton),
                container: $$4('<div/>')
                    .addClass(this.classes.container)
                    .addClass(this.s.colOpts.className)
                    .addClass(this.classes.layout +
                    (parseInt(this.c.layout.split('-')[1], 10) < 10 ?
                        this.c.layout :
                        this.c.layout.split('-')[0] + '-9'))
                    .addClass(this.s.customPaneSettings && this.s.customPaneSettings.className
                    ? this.s.customPaneSettings.className
                    : ''),
                countButton: $$4('<button type="button"></button>')
                    .addClass(this.classes.paneButton)
                    .addClass(this.classes.countButton),
                dtP: $$4('<table><thead><tr><th>' +
                    (this.s.colExists
                        ? $$4(this.s.dt.column(this.s.index).header()).text()
                        : this.s.customPaneSettings.header || 'Custom Pane') + '</th><th/></tr></thead></table>'),
                lower: $$4('<div/>').addClass(this.classes.subRow2).addClass(this.classes.narrowButton),
                nameButton: $$4('<button type="button"></button>')
                    .addClass(this.classes.paneButton)
                    .addClass(this.classes.nameButton),
                panesContainer: panesContainer,
                searchBox: $$4('<input/>').addClass(this.classes.paneInputButton).addClass(this.classes.search),
                searchButton: $$4('<button type = "button"/>')
                    .addClass(this.classes.searchIcon)
                    .addClass(this.classes.paneButton),
                searchCont: $$4('<div/>').addClass(this.classes.searchCont),
                searchLabelCont: $$4('<div/>').addClass(this.classes.searchLabelCont),
                topRow: $$4('<div/>').addClass(this.classes.topRow),
                upper: $$4('<div/>').addClass(this.classes.subRow1).addClass(this.classes.narrowSearch)
            };
            // Set the value of name incase ordering is desired
            if (this.s.colOpts.name) {
                this.s.name = this.s.colOpts.name;
            }
            else if (this.s.customPaneSettings && this.s.customPaneSettings.name) {
                this.s.name = this.s.customPaneSettings.name;
            }
            else {
                this.s.name = this.s.colExists ?
                    $$4(this.s.dt.column(this.s.index).header()).text() :
                    this.s.customPaneSettings.header || 'Custom Pane';
            }
            var tableNode = this.s.dt.table(0).node();
            // Custom search function for table
            this.s.searchFunction = function (settings, searchData, dataIndex) {
                // If no data has been selected then show all
                if (_this.s.selections.length === 0) {
                    return true;
                }
                if (settings.nTable !== tableNode) {
                    return true;
                }
                var filter = null;
                if (_this.s.colExists) {
                    // Get the current filtered data
                    filter = searchData[_this.s.index];
                    if (_this.s.colOpts.orthogonal.filter !== 'filter') {
                        // get the filter value from the map
                        filter = _this.s.rowData.filterMap.get(dataIndex);
                        if (filter instanceof $$4.fn.dataTable.Api) {
                            // eslint-disable-next-line no-extra-parens
                            filter = filter.toArray();
                        }
                    }
                }
                return _this._search(filter, dataIndex);
            };
            $$4.fn.dataTable.ext.search.push(this.s.searchFunction);
            // If the clear button for this pane is clicked clear the selections
            if (this.c.clear) {
                this.dom.clear.on('click.dtsp', function () {
                    var searches = _this.dom.container.find('.' + _this.classes.search.replace(/\s+/g, '.'));
                    searches.each(function () {
                        $$4(this).val('').trigger('input');
                    });
                    _this.clearPane();
                });
            }
            // Sometimes the top row of the panes containing the search box and ordering buttons appears
            //  weird if the width of the panes is lower than expected, this fixes the design.
            // Equally this may occur when the table is resized.
            this.s.dt.on('draw.dtsp', function () { return _this.adjustTopRow(); });
            this.s.dt.on('buttons-action.dtsp', function () { return _this.adjustTopRow(); });
            // When column-reorder is present and the columns are moved, it is necessary to
            //  reassign all of the panes indexes to the new index of the column.
            this.s.dt.on('column-reorder.dtsp', function (e, settings, details) {
                _this.s.index = details.mapping[_this.s.index];
            });
            return this;
        }
        /**
         * Adds a row to the panes table
         *
         * @param display the value to be displayed to the user
         * @param filter the value to be filtered on when searchpanes is implemented
         * @param shown the number of rows in the table that are currently visible matching this criteria
         * @param total the total number of rows in the table that match this criteria
         * @param sort the value to be sorted in the pane table
         * @param type the value of which the type is to be derived from
         */
        SearchPane.prototype.addRow = function (display, filter, sort, type, className, total, shown) {
            if (!total) {
                total = this.s.rowData.bins[filter] ?
                    this.s.rowData.bins[filter] :
                    0;
            }
            if (!shown) {
                shown = this._getShown(filter);
            }
            var index;
            for (var _i = 0, _a = this.s.indexes; _i < _a.length; _i++) {
                var entry = _a[_i];
                if (entry.filter === filter) {
                    index = entry.index;
                }
            }
            if (index === undefined) {
                index = this.s.indexes.length;
                this.s.indexes.push({ filter: filter, index: index });
            }
            return this.s.dtPane.row.add({
                className: className,
                display: display !== '' ?
                    display :
                    this.emptyMessage(),
                filter: filter,
                index: index,
                shown: shown,
                sort: sort,
                total: total,
                type: type
            });
        };
        /**
         * Adjusts the layout of the top row when the screen is resized
         */
        SearchPane.prototype.adjustTopRow = function () {
            var subContainers = this.dom.container.find('.' + this.classes.subRowsContainer.replace(/\s+/g, '.'));
            var subRow1 = this.dom.container.find('.' + this.classes.subRow1.replace(/\s+/g, '.'));
            var subRow2 = this.dom.container.find('.' + this.classes.subRow2.replace(/\s+/g, '.'));
            var topRow = this.dom.container.find('.' + this.classes.topRow.replace(/\s+/g, '.'));
            // If the width is 0 then it is safe to assume that the pane has not yet been displayed.
            //  Even if it has, if the width is 0 it won't make a difference if it has the narrow class or not
            if (($$4(subContainers[0]).width() < 252 || $$4(topRow[0]).width() < 252) && $$4(subContainers[0]).width() !== 0) {
                $$4(subContainers[0]).addClass(this.classes.narrow);
                $$4(subRow1[0]).addClass(this.classes.narrowSub).removeClass(this.classes.narrowSearch);
                $$4(subRow2[0]).addClass(this.classes.narrowSub).removeClass(this.classes.narrowButton);
            }
            else {
                $$4(subContainers[0]).removeClass(this.classes.narrow);
                $$4(subRow1[0]).removeClass(this.classes.narrowSub).addClass(this.classes.narrowSearch);
                $$4(subRow2[0]).removeClass(this.classes.narrowSub).addClass(this.classes.narrowButton);
            }
        };
        /**
         * In the case of a rebuild there is potential for new data to have been included or removed
         * so all of the rowData must be reset as a precaution.
         */
        SearchPane.prototype.clearData = function () {
            this.s.rowData = {
                arrayFilter: [],
                arrayOriginal: [],
                bins: {},
                binsOriginal: {},
                filterMap: new Map(),
                totalOptions: 0
            };
        };
        /**
         * Clear the selections in the pane
         */
        SearchPane.prototype.clearPane = function () {
            // Deselect all rows which are selected and update the table and filter count.
            this.s.dtPane.rows({ selected: true }).deselect();
            this.updateTable();
            return this;
        };
        /**
         * Collapses the pane so that only the header is displayed
         */
        SearchPane.prototype.collapse = function () {
            var _this = this;
            if (!this.s.displayed ||
                (
                // If collapsing is disabled globally, and not enabled specifically for this column
                !this.c.collapse && this.s.colOpts.collapse !== true ||
                    // OR, collapsing could be enabled globally and this column specifically
                    // is not to be collapsed.
                    // We can't just take !this.s.colOpts.collapse here as if it is undefined
                    // then the global should be used
                    this.s.colOpts.collapse === false)) {
                return;
            }
            $$4(this.s.dtPane.table().container()).addClass(this.classes.hidden);
            this.dom.topRow.addClass(this.classes.bordered);
            this.dom.nameButton.addClass(this.classes.disabledButton);
            this.dom.countButton.addClass(this.classes.disabledButton);
            this.dom.searchButton.addClass(this.classes.disabledButton);
            this.dom.collapseButton.addClass(this.classes.rotated);
            this.dom.topRow.one('click.dtsp', function () { return _this.show(); });
        };
        /**
         * Strips all of the SearchPanes elements from the document and turns all of the listeners for the buttons off
         */
        SearchPane.prototype.destroy = function () {
            if (this.s.dtPane) {
                this.s.dtPane.off('.dtsp');
            }
            this.s.dt.off('.dtsp');
            this.dom.clear.off('.dtsp');
            this.dom.nameButton.off('.dtsp');
            this.dom.countButton.off('.dtsp');
            this.dom.searchButton.off('.dtsp');
            this.dom.collapseButton.off('.dtsp');
            $$4(this.s.dt.table().node()).off('.dtsp');
            this.dom.container.detach();
            var searchIdx = $$4.fn.dataTable.ext.search.indexOf(this.s.searchFunction);
            while (searchIdx !== -1) {
                $$4.fn.dataTable.ext.search.splice(searchIdx, 1);
                searchIdx = $$4.fn.dataTable.ext.search.indexOf(this.s.searchFunction);
            }
            // If the datatables have been defined for the panes then also destroy these
            if (this.s.dtPane) {
                this.s.dtPane.destroy();
            }
            this.s.listSet = false;
        };
        /**
         * Getting the legacy message is a little complex due a legacy parameter
         */
        SearchPane.prototype.emptyMessage = function () {
            var def = this.c.i18n.emptyMessage;
            // Legacy parameter support
            if (this.c.emptyMessage) {
                def = this.c.emptyMessage;
            }
            // Override per column
            if (this.s.colOpts.emptyMessage !== false && this.s.colOpts.emptyMessage !== null) {
                def = this.s.colOpts.emptyMessage;
            }
            return this.s.dt.i18n('searchPanes.emptyMessage', def);
        };
        /**
         * Updates the number of filters that have been applied in the title
         */
        SearchPane.prototype.getPaneCount = function () {
            return this.s.dtPane ?
                this.s.dtPane.rows({ selected: true }).data().toArray().length :
                0;
        };
        /**
         * Rebuilds the panes from the start having deleted the old ones
         *
         * @param? dataIn data to be used in buildPane
         * @param? maintainSelection Whether the current selections are to be maintained over rebuild
         */
        SearchPane.prototype.rebuildPane = function (dataIn, maintainSelection) {
            if (dataIn === void 0) { dataIn = null; }
            if (maintainSelection === void 0) { maintainSelection = false; }
            this.clearData();
            var selectedRows = [];
            this.s.serverSelect = [];
            var prevEl = null;
            // When rebuilding strip all of the HTML Elements out of the container and start from scratch
            if (this.s.dtPane) {
                if (maintainSelection) {
                    if (!this.s.dt.page.info().serverSide) {
                        selectedRows = this.s.dtPane.rows({ selected: true }).data().toArray();
                    }
                    else {
                        this.s.serverSelect = this.s.dtPane.rows({ selected: true }).data().toArray();
                    }
                }
                this.s.dtPane.clear().destroy();
                prevEl = this.dom.container.prev();
                this.destroy();
                this.s.dtPane = undefined;
                $$4.fn.dataTable.ext.search.push(this.s.searchFunction);
            }
            this.dom.container.removeClass(this.classes.hidden);
            this.s.displayed = false;
            this._buildPane(!this.s.dt.page.info().serverSide ?
                selectedRows :
                this.s.serverSelect, dataIn, prevEl);
            return this;
        };
        /**
         * Resizes the pane based on the layout that is passed in
         *
         * @param layout the layout to be applied to this pane
         */
        SearchPane.prototype.resize = function (layout) {
            this.c.layout = layout;
            this.dom.container
                .removeClass()
                .addClass(this.classes.show)
                .addClass(this.classes.container)
                .addClass(this.s.colOpts.className)
                .addClass(this.classes.layout +
                (parseInt(layout.split('-')[1], 10) < 10 ?
                    layout :
                    layout.split('-')[0] + '-9'))
                .addClass(this.s.customPaneSettings !== null && this.s.customPaneSettings.className
                ? this.s.customPaneSettings.className
                : '');
            this.adjustTopRow();
        };
        /**
         * Sets the listeners for the pane.
         *
         * Having it in it's own function makes it easier to only set them once
         */
        SearchPane.prototype.setListeners = function () {
            var _this = this;
            if (!this.s.dtPane) {
                return;
            }
            this.s.dtPane.select.style(this.s.colOpts.dtOpts && this.s.colOpts.dtOpts.select && this.s.colOpts.dtOpts.select.style
                ? this.s.colOpts.dtOpts.select.style
                : this.c.dtOpts && this.c.dtOpts.select && this.c.dtOpts.select.style
                    ? this.c.dtOpts.select.style
                    : 'os');
            // When an item is selected on the pane, add these to the array which holds selected items.
            // Custom search will perform.
            this.s.dtPane.off('select.dtsp').on('select.dtsp', function () {
                clearTimeout(_this.s.deselectTimeout);
                _this._updateSelection(!_this.s.updating);
                _this.dom.clear.removeClass(_this.classes.disabledButton).removeAttr('disabled');
            });
            // When an item is deselected on the pane, re add the currently selected items to the array
            // which holds selected items. Custom search will be performed.
            this.s.dtPane.off('deselect.dtsp').on('deselect.dtsp', function () {
                _this.s.deselectTimeout = setTimeout(function () {
                    _this._updateSelection(true);
                    if (_this.s.dtPane.rows({ selected: true }).data().toArray().length === 0) {
                        _this.dom.clear.addClass(_this.classes.disabledButton).attr('disabled', 'true');
                    }
                }, 50);
            });
            // If we attempty to turn off this event then it will ruin behaviour in other panes
            //  so need to make sure that it is only done once
            if (this.s.firstSet) {
                this.s.firstSet = false;
                // When saving the state store all of the selected rows for preselection next time around
                this.s.dt.on('stateSaveParams.dtsp', function (e, settings, data) {
                    // If the data being passed in is empty then state clear must have occured
                    // so clear the panes state as well
                    if ($$4.isEmptyObject(data)) {
                        _this.s.dtPane.state.clear();
                        return;
                    }
                    var bins;
                    var order;
                    var selected = [];
                    var collapsed;
                    var searchTerm;
                    var arrayFilter;
                    // Get all of the data needed for the state save from the pane
                    if (_this.s.dtPane) {
                        selected = _this.s.dtPane
                            .rows({ selected: true })
                            .data()
                            .map(function (item) { return item.filter.toString(); })
                            .toArray();
                        searchTerm = _this.dom.searchBox.val();
                        order = _this.s.dtPane.order();
                        bins = _this.s.rowData.binsOriginal;
                        arrayFilter = _this.s.rowData.arrayOriginal;
                        collapsed = _this.dom.collapseButton.hasClass(_this.classes.rotated);
                    }
                    if (data.searchPanes === undefined) {
                        data.searchPanes = {};
                    }
                    if (data.searchPanes.panes === undefined) {
                        data.searchPanes.panes = [];
                    }
                    for (var i = 0; i < data.searchPanes.panes.length; i++) {
                        if (data.searchPanes.panes[i].id === _this.s.index) {
                            data.searchPanes.panes.splice(i, 1);
                            i--;
                        }
                    }
                    // Add the panes data to the state object
                    data.searchPanes.panes.push({
                        arrayFilter: arrayFilter,
                        bins: bins,
                        collapsed: collapsed,
                        id: _this.s.index,
                        order: order,
                        searchTerm: searchTerm,
                        selected: selected
                    });
                });
            }
            this.s.dtPane.off('user-select.dtsp').on('user-select.dtsp', function (e, _dt, type, cell, originalEvent) {
                originalEvent.stopPropagation();
            });
            this.s.dtPane.off('draw.dtsp').on('draw.dtsp', function () { return _this.adjustTopRow(); });
            // When the button to order by the name of the options is clicked then
            //  change the ordering to whatever it isn't currently
            this.dom.nameButton.off('click.dtsp').on('click.dtsp', function () {
                var currentOrder = _this.s.dtPane.order()[0][1];
                _this.s.dtPane.order([0, currentOrder === 'asc' ? 'desc' : 'asc']).draw();
                // This state save is required so that the ordering of the panes is maintained
                _this.s.dt.state.save();
            });
            // When the button to order by the number of entries in the column is clicked then
            //  change the ordering to whatever it isn't currently
            this.dom.countButton.off('click.dtsp').on('click.dtsp', function () {
                var currentOrder = _this.s.dtPane.order()[0][1];
                _this.s.dtPane.order([1, currentOrder === 'asc' ? 'desc' : 'asc']).draw();
                // This state save is required so that the ordering of the panes is maintained
                _this.s.dt.state.save();
            });
            // When the button to order by the number of entries in the column is clicked then
            //  change the ordering to whatever it isn't currently
            this.dom.collapseButton.off('click.dtsp').on('click.dtsp', function (e) {
                e.stopPropagation();
                var container = $$4(_this.s.dtPane.table().container());
                // Toggle the classes
                container.toggleClass(_this.classes.hidden);
                _this.dom.topRow.toggleClass(_this.classes.bordered);
                _this.dom.nameButton.toggleClass(_this.classes.disabledButton);
                _this.dom.countButton.toggleClass(_this.classes.disabledButton);
                _this.dom.searchButton.toggleClass(_this.classes.disabledButton);
                _this.dom.collapseButton.toggleClass(_this.classes.rotated);
                if (container.hasClass(_this.classes.hidden)) {
                    _this.dom.topRow.on('click.dtsp', function () { return _this.dom.collapseButton.click(); });
                }
                else {
                    _this.dom.topRow.off('click.dtsp');
                }
                _this.s.dt.state.save();
            });
            // When the clear button is clicked reset the pane
            this.dom.clear.off('click.dtsp').on('click.dtsp', function () {
                var searches = _this.dom.container.find('.' + _this.classes.search.replace(/ /g, '.'));
                searches.each(function () {
                    // set the value of the search box to be an empty string and then search on that, effectively reseting
                    $$4(this).val('').trigger('input');
                });
                _this.clearPane();
            });
            // When the search button is clicked then draw focus to the search box
            this.dom.searchButton.off('click.dtsp').on('click.dtsp', function () { return _this.dom.searchBox.focus(); });
            // When a character is inputted into the searchbox search the pane for matching values.
            // Doing it this way means that no button has to be clicked to trigger a search, it is done asynchronously
            this.dom.searchBox.off('click.dtsp').on('input.dtsp', function () {
                var searchval = _this.dom.searchBox.val();
                _this.s.dtPane.search(searchval).draw();
                if (typeof searchval === 'string' &&
                    (searchval.length > 0 ||
                        searchval.length === 0 && _this.s.dtPane.rows({ selected: true }).data().toArray().length > 0)) {
                    _this.dom.clear.removeClass(_this.classes.disabledButton).removeAttr('disabled');
                }
                else {
                    _this.dom.clear.addClass(_this.classes.disabledButton).attr('disabled', 'true');
                }
                // This state save is required so that the searching on the panes is maintained
                _this.s.dt.state.save();
            });
            // WORKAROUND
            // If this line is removed, the select listeners aren't present on
            // the panes for some reason when a rebuild occurs
            this.s.dtPane.select.style(this.s.colOpts.dtOpts && this.s.colOpts.dtOpts.select && this.s.colOpts.dtOpts.select.style
                ? this.s.colOpts.dtOpts.select.style
                : this.c.dtOpts && this.c.dtOpts.select && this.c.dtOpts.select.style
                    ? this.c.dtOpts.select.style
                    : 'os');
        };
        /**
         * Populates the SearchPane based off of the data that has been recieved from the server
         *
         * This method is overriden by SearchPaneST
         *
         * @param dataIn The data that has been sent from the server
         */
        SearchPane.prototype._serverPopulate = function (dataIn) {
            if (dataIn.tableLength) {
                this.s.tableLength = dataIn.tableLength;
                this.s.rowData.totalOptions = this.s.tableLength;
            }
            else if (this.s.tableLength === null || this.s.dt.rows()[0].length > this.s.tableLength) {
                this.s.tableLength = this.s.dt.rows()[0].length;
                this.s.rowData.totalOptions = this.s.tableLength;
            }
            var colTitle = this.s.dt.column(this.s.index).dataSrc();
            // If there is SP data for this column add it to the data array and bin
            if (dataIn.searchPanes.options[colTitle]) {
                for (var _i = 0, _a = dataIn.searchPanes.options[colTitle]; _i < _a.length; _i++) {
                    var dataPoint = _a[_i];
                    this.s.rowData.arrayFilter.push({
                        display: dataPoint.label,
                        filter: dataPoint.value,
                        sort: dataPoint.label,
                        type: dataPoint.label
                    });
                    this.s.rowData.bins[dataPoint.value] = dataPoint.total;
                }
            }
            var binLength = Object.keys(this.s.rowData.bins).length;
            var uniqueRatio = this._uniqueRatio(binLength, this.s.tableLength);
            // Don't show the pane if there isnt enough variance in the data, or there is only 1 entry for that pane
            if (this.s.displayed === false &&
                ((this.s.colOpts.show === undefined && this.s.colOpts.threshold === null ?
                    uniqueRatio > this.c.threshold :
                    uniqueRatio > this.s.colOpts.threshold) ||
                    this.s.colOpts.show !== true && binLength <= 1)) {
                this.dom.container.addClass(this.classes.hidden);
                this.s.displayed = false;
                return;
            }
            // Store the original data
            this.s.rowData.arrayOriginal = this.s.rowData.arrayFilter;
            this.s.rowData.binsOriginal = this.s.rowData.bins;
            // Flag this pane as being displayed
            this.s.displayed = true;
        };
        /**
         * Expands the pane from the collapsed state
         */
        SearchPane.prototype.show = function () {
            if (!this.s.displayed) {
                return;
            }
            this.dom.topRow.removeClass(this.classes.bordered);
            this.dom.nameButton.removeClass(this.classes.disabledButton);
            this.dom.countButton.removeClass(this.classes.disabledButton);
            this.dom.searchButton.removeClass(this.classes.disabledButton);
            this.dom.collapseButton.removeClass(this.classes.rotated);
            $$4(this.s.dtPane.table().container()).removeClass(this.classes.hidden);
        };
        /**
         * Finds the ratio of the number of different options in the table to the number of rows
         *
         * @param bins the number of different options in the table
         * @param rowCount the total number of rows in the table
         * @returns {number} returns the ratio
         */
        SearchPane.prototype._uniqueRatio = function (bins, rowCount) {
            if (rowCount > 0 &&
                (this.s.rowData.totalOptions > 0 && !this.s.dt.page.info().serverSide ||
                    this.s.dt.page.info().serverSide && this.s.tableLength > 0)) {
                return bins / this.s.rowData.totalOptions;
            }
            return 1;
        };
        /**
         * Updates the panes if one of the options to do so has been set to true
         * rather than the filtered message when using viewTotal.
         */
        SearchPane.prototype.updateTable = function () {
            var selectedRows = this.s.dtPane.rows({ selected: true }).data().toArray().map(function (el) { return el.filter; });
            this.s.selections = selectedRows;
            this._searchExtras();
        };
        /**
         * Adds the custom options to the pane
         *
         * @returns {Array} Returns the array of rows which have been added to the pane
         */
        SearchPane.prototype._getComparisonRows = function () {
            // Find the appropriate options depending on whether this is a pane for a specific column or a custom pane
            var options = this.s.colOpts.options
                ? this.s.colOpts.options
                : this.s.customPaneSettings && this.s.customPaneSettings.options
                    ? this.s.customPaneSettings.options
                    : undefined;
            if (options === undefined) {
                return;
            }
            var allRows = this.s.dt.rows();
            var tableValsTotal = allRows.data().toArray();
            var rows = [];
            // Clear all of the other rows from the pane, only custom options are to be displayed when they are defined
            this.s.dtPane.clear();
            this.s.indexes = [];
            for (var _i = 0, options_1 = options; _i < options_1.length; _i++) {
                var comp = options_1[_i];
                // Initialise the object which is to be placed in the row
                var insert = comp.label !== '' ?
                    comp.label :
                    this.emptyMessage();
                var comparisonObj = {
                    className: comp.className,
                    display: insert,
                    filter: typeof comp.value === 'function' ? comp.value : [],
                    sort: insert,
                    total: 0,
                    type: insert
                };
                // If a custom function is in place
                if (typeof comp.value === 'function') {
                    // Count the number of times the function evaluates to true for the original data in the Table
                    for (var i = 0; i < tableValsTotal.length; i++) {
                        if (comp.value.call(this.s.dt, tableValsTotal[i], allRows[0][i])) {
                            comparisonObj.total++;
                        }
                    }
                    // Update the comparisonObj
                    if (typeof comparisonObj.filter !== 'function') {
                        comparisonObj.filter.push(comp.filter);
                    }
                }
                rows.push(this.addRow(comparisonObj.display, comparisonObj.filter, comparisonObj.sort, comparisonObj.type, comparisonObj.className, comparisonObj.total));
            }
            return rows;
        };
        SearchPane.prototype._getMessage = function (row) {
            return this.s.dt.i18n('searchPanes.count', this.c.i18n.count).replace(/{total}/g, row.total);
        };
        /**
         * Overridden in SearchPaneViewTotal and SearchPaneCascade to get the number of times a specific value is shown
         *
         * Here it is blanked so that it takes no action
         *
         * @param filter The filter value
         * @returns undefined
         */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        SearchPane.prototype._getShown = function (filter) {
            return undefined;
        };
        /**
         * Get's the pane config appropriate to this class
         *
         * @returns The config needed to create a pane of this type
         */
        SearchPane.prototype._getPaneConfig = function () {
            var _this = this;
            // eslint-disable-next-line no-extra-parens
            var haveScroller = dataTable$1.Scroller;
            var langOpts = this.s.dt.settings()[0].oLanguage;
            langOpts.url = undefined;
            langOpts.sUrl = undefined;
            return {
                columnDefs: [
                    {
                        className: 'dtsp-nameColumn',
                        data: 'display',
                        render: function (data, type, row) {
                            if (type === 'sort') {
                                return row.sort;
                            }
                            else if (type === 'type') {
                                return row.type;
                            }
                            var message = _this._getMessage(row);
                            // We are displaying the count in the same columne as the name of the search option.
                            // This is so that there is not need to call columns.adjust()
                            //  which in turn speeds up the code
                            var pill = '<span class="' + _this.classes.pill + '">' + message + '</span>';
                            if (!_this.c.viewCount || !_this.s.colOpts.viewCount) {
                                pill = '';
                            }
                            if (type === 'filter') {
                                return typeof data === 'string' && data.match(/<[^>]*>/) !== null ?
                                    data.replace(/<[^>]*>/g, '') :
                                    data;
                            }
                            return '<div class="' + _this.classes.nameCont + '"><span title="' +
                                (typeof data === 'string' && data.match(/<[^>]*>/) !== null ?
                                    data.replace(/<[^>]*>/g, '') :
                                    data) +
                                '" class="' + _this.classes.name + '">' +
                                data + '</span>' +
                                pill + '</div>';
                        },
                        targets: 0,
                        // Accessing the private datatables property to set type based on the original table.
                        // This is null if not defined by the user, meaning that automatic type detection
                        //  would take place
                        type: this.s.dt.settings()[0].aoColumns[this.s.index] ?
                            this.s.dt.settings()[0].aoColumns[this.s.index]._sManualType :
                            null
                    },
                    {
                        className: 'dtsp-countColumn ' + this.classes.badgePill,
                        data: 'total',
                        searchable: false,
                        targets: 1,
                        visible: false
                    }
                ],
                deferRender: true,
                dom: 't',
                info: false,
                language: langOpts,
                paging: haveScroller ? true : false,
                scrollX: false,
                scrollY: '200px',
                scroller: haveScroller ? true : false,
                select: true,
                stateSave: this.s.dt.settings()[0].oFeatures.bStateSave ? true : false
            };
        };
        /**
         * This method allows for changes to the panes and table to be made when a selection or a deselection occurs
         */
        SearchPane.prototype._makeSelection = function () {
            this.updateTable();
            this.s.updating = true;
            this.s.dt.draw();
            this.s.updating = false;
        };
        /**
         * Populates an array with all of the data for the table
         *
         * @param rowIdx The current row index to be compared
         * @param arrayFilter The array that is to be populated with row Details
         * @param settings The DataTable settings object
         * @param bins The bins object that is to be populated with the row counts
         */
        SearchPane.prototype._populatePaneArray = function (rowIdx, arrayFilter, settings, bins) {
            if (bins === void 0) { bins = this.s.rowData.bins; }
            // Retrieve the rendered data from the cell using the fnGetCellData function
            // rather than the cell().render API method for optimisation
            if (typeof this.s.colOpts.orthogonal === 'string') {
                var rendered = settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, this.s.colOpts.orthogonal);
                this.s.rowData.filterMap.set(rowIdx, rendered);
                this._addOption(rendered, rendered, rendered, rendered, arrayFilter, bins);
                this.s.rowData.totalOptions++;
            }
            else {
                var filter = settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, this.s.colOpts.orthogonal.search);
                // Null and empty string are to be considered the same value
                if (filter === null) {
                    filter = '';
                }
                if (typeof filter === 'string') {
                    filter = filter.replace(/<[^>]*>/g, '');
                }
                this.s.rowData.filterMap.set(rowIdx, filter);
                if (!bins[filter]) {
                    bins[filter] = 1;
                    this._addOption(filter, settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, this.s.colOpts.orthogonal.display), settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, this.s.colOpts.orthogonal.sort), settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, this.s.colOpts.orthogonal.type), arrayFilter, bins);
                    this.s.rowData.totalOptions++;
                }
                else {
                    bins[filter]++;
                    this.s.rowData.totalOptions++;
                }
            }
        };
        /**
         * Reloads all of the previous selects into the panes
         *
         * @param loadedFilter The loaded filters from a previous state
         */
        SearchPane.prototype._reloadSelect = function (loadedFilter) {
            // If the state was not saved don't selected any
            if (loadedFilter === undefined) {
                return;
            }
            var idx;
            // For each pane, check that the loadedFilter list exists and is not null,
            // find the id of each search item and set it to be selected.
            for (var i = 0; i < loadedFilter.searchPanes.panes.length; i++) {
                if (loadedFilter.searchPanes.panes[i].id === this.s.index) {
                    idx = i;
                    break;
                }
            }
            if (idx) {
                var table = this.s.dtPane;
                var rows = table.rows({ order: 'index' }).data().map(function (item) { return item.filter !== null ?
                    item.filter.toString() :
                    null; }).toArray();
                for (var _i = 0, _a = loadedFilter.searchPanes.panes[idx].selected; _i < _a.length; _i++) {
                    var filter = _a[_i];
                    var id = -1;
                    if (filter !== null) {
                        id = rows.indexOf(filter.toString());
                    }
                    if (id > -1) {
                        this.s.serverSelecting = true;
                        table.row(id).select();
                        this.s.serverSelecting = false;
                    }
                }
            }
        };
        /**
         * Notes the rows that have been selected within this pane and stores them internally
         *
         * @param notUpdating Whether the panes are updating themselves or not
         */
        SearchPane.prototype._updateSelection = function (notUpdating) {
            this.s.scrollTop = $$4(this.s.dtPane.table().node()).parent()[0].scrollTop;
            if (this.s.dt.page.info().serverSide && !this.s.updating) {
                if (!this.s.serverSelecting) {
                    this.s.serverSelect = this.s.dtPane.rows({ selected: true }).data().toArray();
                    this.s.dt.draw(false);
                }
            }
            else if (notUpdating) {
                this._makeSelection();
            }
        };
        /**
         * Takes in potentially undetected rows and adds them to the array if they are not yet featured
         *
         * @param filter the filter value of the potential row
         * @param display the display value of the potential row
         * @param sort the sort value of the potential row
         * @param type the type value of the potential row
         * @param arrayFilter the array to be populated
         * @param bins the bins to be populated
         */
        SearchPane.prototype._addOption = function (filter, display, sort, type, arrayFilter, bins) {
            // If the filter is an array then take a note of this, and add the elements to the arrayFilter array
            if (Array.isArray(filter) || filter instanceof dataTable$1.Api) {
                // Convert to an array so that we can work with it
                if (filter instanceof dataTable$1.Api) {
                    filter = filter.toArray();
                    display = display.toArray();
                }
                if (filter.length === display.length) {
                    for (var i = 0; i < filter.length; i++) {
                        // If we haven't seen this row before add it
                        if (!bins[filter[i]]) {
                            bins[filter[i]] = 1;
                            arrayFilter.push({
                                display: display[i],
                                filter: filter[i],
                                sort: sort[i],
                                type: type[i]
                            });
                        }
                        // Otherwise just increment the count
                        else {
                            bins[filter[i]]++;
                        }
                        this.s.rowData.totalOptions++;
                    }
                    return;
                }
                throw new Error('display and filter not the same length');
            }
            // If the values were affected by othogonal data and are not an array then check if it is already present
            else if (typeof this.s.colOpts.orthogonal === 'string') {
                if (!bins[filter]) {
                    bins[filter] = 1;
                    arrayFilter.push({
                        display: display,
                        filter: filter,
                        sort: sort,
                        type: type
                    });
                    this.s.rowData.totalOptions++;
                }
                else {
                    bins[filter]++;
                    this.s.rowData.totalOptions++;
                }
            }
            // Otherwise we must just be adding an option
            else {
                arrayFilter.push({
                    display: display,
                    filter: filter,
                    sort: sort,
                    type: type
                });
            }
        };
        /**
         * Method to construct the actual pane.
         *
         * @param selectedRows previously selected Rows to be reselected
         * @param dataIn Data that should be used to populate this pane
         * @param prevEl Reference to the previous element, used to ensure insert is in the correct location
         * @returns boolean to indicate whether this pane was the last one to have a selection made
         */
        SearchPane.prototype._buildPane = function (selectedRows, dataIn, prevEl) {
            var _this = this;
            if (selectedRows === void 0) { selectedRows = []; }
            if (dataIn === void 0) { dataIn = null; }
            if (prevEl === void 0) { prevEl = null; }
            // Aliases
            this.s.selections = [];
            // Other Variables
            var loadedFilter = this.s.dt.state.loaded();
            // If the listeners have not been set yet then using the latest state may result in funny errors
            if (this.s.listSet) {
                loadedFilter = this.s.dt.state();
            }
            // If it is not a custom pane in place
            if (this.s.colExists) {
                var idx = -1;
                if (loadedFilter && loadedFilter.searchPanes && loadedFilter.searchPanes.panes) {
                    for (var i = 0; i < loadedFilter.searchPanes.panes.length; i++) {
                        if (loadedFilter.searchPanes.panes[i].id === this.s.index) {
                            idx = i;
                            break;
                        }
                    }
                }
                // Perform checks that do not require populate pane to run
                if ((this.s.colOpts.show === false ||
                    this.s.colOpts.show !== undefined && this.s.colOpts.show !== true) &&
                    idx === -1) {
                    this.dom.container.addClass(this.classes.hidden);
                    this.s.displayed = false;
                    return false;
                }
                else if (this.s.colOpts.show === true || idx !== -1) {
                    this.s.displayed = true;
                }
                if (!this.s.dt.page.info().serverSide &&
                    (!dataIn ||
                        !dataIn.searchPanes ||
                        !dataIn.searchPanes.options)) {
                    // Only run populatePane if the data has not been collected yet
                    if (this.s.rowData.arrayFilter.length === 0) {
                        this.s.rowData.totalOptions = 0;
                        this._populatePane();
                        this.s.rowData.arrayOriginal = this.s.rowData.arrayFilter;
                        this.s.rowData.binsOriginal = this.s.rowData.bins;
                    }
                    var binLength = Object.keys(this.s.rowData.binsOriginal).length;
                    var uniqueRatio = this._uniqueRatio(binLength, this.s.dt.rows()[0].length);
                    // Don't show the pane if there isn't enough variance in the data, or there is only 1 entry
                    //  for that pane
                    if (this.s.displayed === false &&
                        ((this.s.colOpts.show === undefined && this.s.colOpts.threshold === null ?
                            uniqueRatio > this.c.threshold :
                            uniqueRatio > this.s.colOpts.threshold) ||
                            this.s.colOpts.show !== true && binLength <= 1)) {
                        this.dom.container.addClass(this.classes.hidden);
                        this.s.displayed = false;
                        return;
                    }
                    this.dom.container.addClass(this.classes.show);
                    this.s.displayed = true;
                }
                else if (dataIn && dataIn.searchPanes && dataIn.searchPanes.options) {
                    this._serverPopulate(dataIn);
                }
            }
            else {
                this.s.displayed = true;
            }
            // If the variance is accceptable then display the search pane
            this._displayPane();
            if (!this.s.listSet) {
                // Here, when the state is loaded if the data object on the original table is empty,
                //  then a state.clear() must have occurred, so delete all of the panes tables state objects too.
                this.dom.dtP.on('stateLoadParams.dtsp', function (e, settings, data) {
                    if ($$4.isEmptyObject(_this.s.dt.state.loaded())) {
                        $$4.each(data, function (index) {
                            delete data[index];
                        });
                    }
                });
            }
            // Add the container to the document in its original location
            if (prevEl !== null && this.dom.panesContainer.has(prevEl).length > 0) {
                this.dom.container.insertAfter(prevEl);
            }
            else {
                this.dom.panesContainer.prepend(this.dom.container);
            }
            // Declare the datatable for the pane
            var errMode = $$4.fn.dataTable.ext.errMode;
            $$4.fn.dataTable.ext.errMode = 'none';
            // eslint-disable-next-line no-extra-parens
            this.s.dtPane = this.dom.dtP.DataTable($$4.extend(true, this._getPaneConfig(), this.c.dtOpts, this.s.colOpts ? this.s.colOpts.dtOpts : {}, this.s.colOpts.options || !this.s.colExists ?
                {
                    createdRow: function (row, data) {
                        $$4(row).addClass(data.className);
                    }
                } :
                undefined, this.s.customPaneSettings !== null && this.s.customPaneSettings.dtOpts ?
                this.s.customPaneSettings.dtOpts :
                {}, $$4.fn.dataTable.versionCheck('2')
                ? {
                    layout: {
                        bottomLeft: null,
                        bottomRight: null,
                        topLeft: null,
                        topRight: null
                    }
                }
                : {}));
            this.dom.dtP.addClass(this.classes.table);
            // Getting column titles is a little messy
            var headerText = 'Custom Pane';
            if (this.s.customPaneSettings && this.s.customPaneSettings.header) {
                headerText = this.s.customPaneSettings.header;
            }
            else if (this.s.colOpts.header) {
                headerText = this.s.colOpts.header;
            }
            else if (this.s.colExists) {
                headerText = $$4.fn.dataTable.versionCheck('2')
                    ? this.s.dt.column(this.s.index).title()
                    : this.s.dt.settings()[0].aoColumns[this.s.index].sTitle;
            }
            headerText = this._escapeHTML(headerText);
            this.dom.searchBox.attr('placeholder', headerText);
            // As the pane table is not in the document yet we must initialise select ourselves
            // eslint-disable-next-line no-extra-parens
            $$4.fn.dataTable.select.init(this.s.dtPane);
            $$4.fn.dataTable.ext.errMode = errMode;
            // If it is not a custom pane
            if (this.s.colExists) {
                // Add all of the search options to the pane
                for (var i = 0, ien = this.s.rowData.arrayFilter.length; i < ien; i++) {
                    if (this.s.dt.page.info().serverSide) {
                        var row = this.addRow(this.s.rowData.arrayFilter[i].display, this.s.rowData.arrayFilter[i].filter, this.s.rowData.arrayFilter[i].sort, this.s.rowData.arrayFilter[i].type);
                        for (var _i = 0, _a = this.s.serverSelect; _i < _a.length; _i++) {
                            var option = _a[_i];
                            if (option.filter === this.s.rowData.arrayFilter[i].filter) {
                                this.s.serverSelecting = true;
                                row.select();
                                this.s.serverSelecting = false;
                            }
                        }
                    }
                    else if (!this.s.dt.page.info().serverSide && this.s.rowData.arrayFilter[i]) {
                        this.addRow(this.s.rowData.arrayFilter[i].display, this.s.rowData.arrayFilter[i].filter, this.s.rowData.arrayFilter[i].sort, this.s.rowData.arrayFilter[i].type);
                    }
                    else if (!this.s.dt.page.info().serverSide) {
                        // Just pass an empty string as the message will be calculated based on that in addRow()
                        this.addRow('', '', '', '');
                    }
                }
            }
            // eslint-disable-next-line no-extra-parens
            dataTable$1.select.init(this.s.dtPane);
            // If there are custom options set or it is a custom pane then get them
            if (this.s.colOpts.options ||
                this.s.customPaneSettings && this.s.customPaneSettings.options) {
                this._getComparisonRows();
            }
            // Display the pane
            this.s.dtPane.draw();
            this.s.dtPane.table().node().parentNode.scrollTop = this.s.scrollTop;
            this.adjustTopRow();
            this.setListeners();
            this.s.listSet = true;
            for (var _b = 0, selectedRows_1 = selectedRows; _b < selectedRows_1.length; _b++) {
                var selection = selectedRows_1[_b];
                if (selection) {
                    for (var _c = 0, _d = this.s.dtPane.rows().indexes().toArray(); _c < _d.length; _c++) {
                        var row = _d[_c];
                        if (this.s.dtPane.row(row).data() &&
                            selection.filter === this.s.dtPane.row(row).data().filter) {
                            // If this is happening when serverSide processing is happening then
                            //  different behaviour is needed
                            if (this.s.dt.page.info().serverSide) {
                                this.s.serverSelecting = true;
                                this.s.dtPane.row(row).select();
                                this.s.serverSelecting = false;
                            }
                            else {
                                this.s.dtPane.row(row).select();
                            }
                        }
                    }
                }
            }
            //  If SSP and the table is ready, apply the search for the pane
            if (this.s.dt.page.info().serverSide) {
                this.s.dtPane.search(this.dom.searchBox.val()).draw();
            }
            if ((this.c.initCollapsed && this.s.colOpts.initCollapsed !== false ||
                this.s.colOpts.initCollapsed) &&
                (this.c.collapse && this.s.colOpts.collapse !== false ||
                    this.s.colOpts.collapse)) {
                // If the pane has not initialised yet then we need to wait for it to do so before collapsing
                // Otherwise the container that the class is added to does not exist
                if (this.s.dtPane.settings()[0]._bInitComplete) {
                    this.collapse();
                }
                else {
                    this.s.dtPane.one('init', function () { return _this.collapse(); });
                }
            }
            // Reload the selection, searchbox entry and ordering from the previous state
            // Need to check here if SSP that this is the first draw, otherwise it will infinite loop
            if (loadedFilter &&
                loadedFilter.searchPanes &&
                loadedFilter.searchPanes.panes &&
                (!dataIn ||
                    dataIn.draw === 1)) {
                this._reloadSelect(loadedFilter);
                for (var _e = 0, _f = loadedFilter.searchPanes.panes; _e < _f.length; _e++) {
                    var pane = _f[_e];
                    if (pane.id === this.s.index) {
                        // Save some time by only triggering an input if there is a value
                        if (pane.searchTerm && pane.searchTerm.length > 0) {
                            this.dom.searchBox.val(pane.searchTerm).trigger('input');
                        }
                        if (pane.order) {
                            this.s.dtPane.order(pane.order).draw();
                        }
                        // Is the pane to be hidden or shown?
                        if (pane.collapsed) {
                            this.collapse();
                        }
                        else {
                            this.show();
                        }
                    }
                }
            }
            return true;
        };
        /**
         * Appends all of the HTML elements to their relevant parent Elements
         */
        SearchPane.prototype._displayPane = function () {
            // Empty everything to start again
            this.dom.dtP.empty();
            this.dom.topRow.empty().addClass(this.classes.topRow);
            // If there are more than 3 columns defined then make there be a smaller gap between the panes
            if (parseInt(this.c.layout.split('-')[1], 10) > 3) {
                this.dom.container.addClass(this.classes.smallGap);
            }
            this.dom.topRow
                .addClass(this.classes.subRowsContainer)
                .append(this.dom.upper.append(this.dom.searchCont))
                .append(this.dom.lower.append(this.dom.buttonGroup));
            // If no selections have been made in the pane then disable the clear button
            if (this.c.dtOpts.searching === false ||
                this.s.colOpts.dtOpts && this.s.colOpts.dtOpts.searching === false ||
                (!this.c.controls || !this.s.colOpts.controls) ||
                this.s.customPaneSettings &&
                    this.s.customPaneSettings.dtOpts &&
                    this.s.customPaneSettings.dtOpts.searching !== undefined &&
                    !this.s.customPaneSettings.dtOpts.searching) {
                this.dom.searchBox
                    .removeClass(this.classes.paneInputButton)
                    .addClass(this.classes.disabledButton)
                    .attr('disabled', 'true');
            }
            this.dom.searchBox.appendTo(this.dom.searchCont);
            // Create the contents of the searchCont div. Worth noting that this function will change when using semantic ui
            this._searchContSetup();
            // If the clear button is allowed to show then display it
            if (this.c.clear && this.c.controls && this.s.colOpts.controls) {
                this.dom.clear.appendTo(this.dom.buttonGroup);
            }
            if (this.c.orderable && this.s.colOpts.orderable && this.c.controls && this.s.colOpts.controls) {
                this.dom.nameButton.appendTo(this.dom.buttonGroup);
            }
            // If the count column is hidden then don't display the ordering button for it
            if (this.c.viewCount &&
                this.s.colOpts.viewCount &&
                this.c.orderable &&
                this.s.colOpts.orderable &&
                this.c.controls &&
                this.s.colOpts.controls) {
                this.dom.countButton.appendTo(this.dom.buttonGroup);
            }
            if ((this.c.collapse && this.s.colOpts.collapse !== false ||
                this.s.colOpts.collapse) &&
                this.c.controls && this.s.colOpts.controls) {
                this.dom.collapseButton.appendTo(this.dom.buttonGroup);
            }
            this.dom.container.prepend(this.dom.topRow).append(this.dom.dtP).show();
        };
        /**
         * Escape html characters within a string
         *
         * @param txt the string to be escaped
         * @returns the escaped string
         */
        SearchPane.prototype._escapeHTML = function (txt) {
            return txt
                .toString()
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"');
        };
        /**
         * Gets the options for the row for the customPanes
         *
         * @returns {object} The options for the row extended to include the options from the user.
         */
        SearchPane.prototype._getBonusOptions = function () {
            // We need to reset the thresholds as if they have a value in colOpts then that value will be used
            var defaultMutator = {
                threshold: null
            };
            return $$4.extend(true, {}, SearchPane.defaults, defaultMutator, this.c ? this.c : {});
        };
        /**
         * Gets the options for the row for the customPanes
         *
         * @returns {object} The options for the row extended to include the options from the user.
         */
        SearchPane.prototype._getOptions = function () {
            var table = this.s.dt;
            // We need to reset the thresholds as if they have a value in colOpts then that value will be used
            var defaultMutator = {
                collapse: null,
                emptyMessage: false,
                initCollapsed: null,
                threshold: null
            };
            var columnOptions = table.settings()[0].aoColumns[this.s.index].searchPanes;
            var colOpts = $$4.extend(true, {}, SearchPane.defaults, defaultMutator, columnOptions);
            if (columnOptions && columnOptions.hideCount && columnOptions.viewCount === undefined) {
                colOpts.viewCount = !columnOptions.hideCount;
            }
            return colOpts;
        };
        /**
         * Fill the array with the values that are currently being displayed in the table
         */
        SearchPane.prototype._populatePane = function () {
            this.s.rowData.arrayFilter = [];
            this.s.rowData.bins = {};
            var settings = this.s.dt.settings()[0];
            if (!this.s.dt.page.info().serverSide) {
                for (var _i = 0, _a = this.s.dt.rows().indexes().toArray(); _i < _a.length; _i++) {
                    var index = _a[_i];
                    this._populatePaneArray(index, this.s.rowData.arrayFilter, settings);
                }
            }
        };
        /**
         * This method decides whether a row should contribute to the pane or not
         *
         * @param filter the value that the row is to be filtered on
         * @param dataIndex the row index
         */
        SearchPane.prototype._search = function (filter, dataIndex) {
            var colOpts = this.s.colOpts;
            var table = this.s.dt;
            // For each item selected in the pane, check if it is available in the cell
            for (var _i = 0, _a = this.s.selections; _i < _a.length; _i++) {
                var colSelect = _a[_i];
                if (typeof colSelect === 'string' && typeof filter === 'string') {
                    // The filter value will not have the &amp; in place but a &,
                    // so we need to do a replace to make sure that they will match
                    colSelect = this._escapeHTML(colSelect);
                }
                // if the filter is an array then is the column present in it
                if (Array.isArray(filter)) {
                    if (colOpts.combiner === 'and') {
                        if (!filter.includes(colSelect)) {
                            return false;
                        }
                    }
                    else if (filter.includes(colSelect)) {
                        return true;
                    }
                }
                // if the filter is a function then does it meet the criteria of that function or not
                else if (typeof colSelect === 'function') {
                    if (colSelect.call(table, table.row(dataIndex).data(), dataIndex)) {
                        if (colOpts.combiner === 'or') {
                            return true;
                        }
                    }
                    // If the combiner is an "and" then we need to check against all possible selections
                    // so if it fails here then the and is not met and return false
                    else if (colOpts.combiner === 'and') {
                        return false;
                    }
                }
                // otherwise if the two filter values are equal then return true
                else if (filter === colSelect ||
                    // Loose type checking incase number type in column comparing to a string
                    // eslint-disable-next-line eqeqeq
                    !(typeof filter === 'string' && filter.length === 0) && filter == colSelect ||
                    colSelect === null && typeof filter === 'string' && filter === '') {
                    return true;
                }
            }
            // If the combiner is an and then we need to check against all possible selections
            // so return true here if so because it would have returned false earlier if it had failed
            if (colOpts.combiner === 'and') {
                return true;
            }
            // Otherwise it hasn't matched with anything by this point so it must be false
            return false;
        };
        /**
         * Creates the contents of the searchCont div
         *
         * NOTE This is overridden when semantic ui styling in order to integrate the search button into the text box.
         */
        SearchPane.prototype._searchContSetup = function () {
            if (this.c.controls && this.s.colOpts.controls) {
                this.dom.searchButton.appendTo(this.dom.searchLabelCont);
            }
            if (!(this.c.dtOpts.searching === false ||
                this.s.colOpts.dtOpts.searching === false ||
                this.s.customPaneSettings &&
                    this.s.customPaneSettings.dtOpts &&
                    this.s.customPaneSettings.dtOpts.searching !== undefined &&
                    !this.s.customPaneSettings.dtOpts.searching)) {
                this.dom.searchLabelCont.appendTo(this.dom.searchCont);
            }
        };
        /**
         * Adds outline to the pane when a selection has been made
         */
        SearchPane.prototype._searchExtras = function () {
            var updating = this.s.updating;
            this.s.updating = true;
            var filters = this.s.dtPane.rows({ selected: true }).data().pluck('filter').toArray();
            var nullIndex = filters.indexOf(this.emptyMessage());
            var container = $$4(this.s.dtPane.table().container());
            // If null index is found then search for empty cells as a filter.
            if (nullIndex > -1) {
                filters[nullIndex] = '';
            }
            // If a filter has been applied then outline the respective pane, remove it when it no longer is.
            if (filters.length > 0) {
                container.addClass(this.classes.selected);
            }
            else if (filters.length === 0) {
                container.removeClass(this.classes.selected);
            }
            this.s.updating = updating;
        };
        SearchPane.version = '2.0.0-dev';
        SearchPane.classes = {
            bordered: 'dtsp-bordered',
            buttonGroup: 'dtsp-buttonGroup',
            buttonSub: 'dtsp-buttonSub',
            caret: 'dtsp-caret',
            clear: 'dtsp-clear',
            clearAll: 'dtsp-clearAll',
            clearButton: 'clearButton',
            collapseAll: 'dtsp-collapseAll',
            collapseButton: 'dtsp-collapseButton',
            container: 'dtsp-searchPane',
            countButton: 'dtsp-countButton',
            disabledButton: 'dtsp-disabledButton',
            hidden: 'dtsp-hidden',
            hide: 'dtsp-hide',
            layout: 'dtsp-',
            name: 'dtsp-name',
            nameButton: 'dtsp-nameButton',
            nameCont: 'dtsp-nameCont',
            narrow: 'dtsp-narrow',
            paneButton: 'dtsp-paneButton',
            paneInputButton: 'dtsp-paneInputButton',
            pill: 'dtsp-pill',
            rotated: 'dtsp-rotated',
            search: 'dtsp-search',
            searchCont: 'dtsp-searchCont',
            searchIcon: 'dtsp-searchIcon',
            searchLabelCont: 'dtsp-searchButtonCont',
            selected: 'dtsp-selected',
            smallGap: 'dtsp-smallGap',
            subRow1: 'dtsp-subRow1',
            subRow2: 'dtsp-subRow2',
            subRowsContainer: 'dtsp-subRowsContainer',
            title: 'dtsp-title',
            topRow: 'dtsp-topRow'
        };
        // Define SearchPanes default options
        SearchPane.defaults = {
            clear: true,
            collapse: true,
            combiner: 'or',
            container: function (dt) {
                return dt.table().container();
            },
            controls: true,
            dtOpts: {},
            emptyMessage: null,
            hideCount: false,
            i18n: {
                clearPane: '&times;',
                count: '{total}',
                emptyMessage: '<em>No data</em>'
            },
            initCollapsed: false,
            layout: 'auto',
            name: undefined,
            orderable: true,
            orthogonal: {
                display: 'display',
                filter: 'filter',
                hideCount: false,
                search: 'filter',
                show: undefined,
                sort: 'sort',
                threshold: 0.6,
                type: 'type',
                viewCount: true
            },
            preSelect: [],
            threshold: 0.6,
            viewCount: true
        };
        return SearchPane;
    }());

    var __extends$4 = (window && window.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var SearchPaneST = /** @class */ (function (_super) {
        __extends$4(SearchPaneST, _super);
        function SearchPaneST(paneSettings, opts, index, panesContainer, panes) {
            return _super.call(this, paneSettings, opts, index, panesContainer, panes) || this;
        }
        /**
         * Populates the SearchPane based off of the data that has been recieved from the server
         *
         * This method overrides SearchPane's _serverPopulate() method
         *
         * @param dataIn The data that has been sent from the server
         */
        SearchPaneST.prototype._serverPopulate = function (dataIn) {
            this.s.rowData.binsShown = {};
            this.s.rowData.arrayFilter = [];
            if (dataIn.tableLength !== undefined) {
                this.s.tableLength = dataIn.tableLength;
                this.s.rowData.totalOptions = this.s.tableLength;
            }
            else if (this.s.tableLength === null || this.s.dt.rows()[0].length > this.s.tableLength) {
                this.s.tableLength = this.s.dt.rows()[0].length;
                this.s.rowData.totalOptions = this.s.tableLength;
            }
            var colTitle = this.s.dt.column(this.s.index).dataSrc();
            // If there is SP data for this column add it to the data array and bin
            if (dataIn.searchPanes.options[colTitle] !== undefined) {
                for (var _i = 0, _a = dataIn.searchPanes.options[colTitle]; _i < _a.length; _i++) {
                    var dataPoint = _a[_i];
                    this.s.rowData.arrayFilter.push({
                        display: dataPoint.label,
                        filter: dataPoint.value,
                        shown: +dataPoint.count,
                        sort: dataPoint.label,
                        total: +dataPoint.total,
                        type: dataPoint.label
                    });
                    this.s.rowData.binsShown[dataPoint.value] = +dataPoint.count;
                    this.s.rowData.bins[dataPoint.value] = +dataPoint.total;
                }
            }
            var binLength = Object.keys(this.s.rowData.bins).length;
            var uniqueRatio = this._uniqueRatio(binLength, this.s.tableLength);
            // Don't show the pane if there isnt enough variance in the data, or there is only 1 entry for that pane
            if (!this.s.colOpts.show &&
                this.s.displayed === false &&
                ((this.s.colOpts.show === undefined && this.s.colOpts.threshold === null ?
                    uniqueRatio > this.c.threshold :
                    uniqueRatio > this.s.colOpts.threshold) ||
                    this.s.colOpts.show !== true && binLength <= 1)) {
                this.dom.container.addClass(this.classes.hidden);
                this.s.displayed = false;
                return;
            }
            // Store the original data
            this.s.rowData.arrayOriginal = this.s.rowData.arrayFilter;
            this.s.rowData.binsOriginal = this.s.rowData.bins;
            // Flag this pane as being displayed
            this.s.displayed = true;
            // If the pane exists
            if (this.s.dtPane) {
                // Not the selections that have been made and remove all of the rows
                var selected = this.s.serverSelect;
                this.s.dtPane.rows().remove();
                // Add the rows that are to be shown into the pane
                for (var _b = 0, _c = this.s.rowData.arrayFilter; _b < _c.length; _b++) {
                    var data = _c[_b];
                    if (this._shouldAddRow(data)) {
                        var row = this.addRow(data.display, data.filter, data.sort, data.type);
                        // Select the row if it was selected before
                        for (var i = 0; i < selected.length; i++) {
                            var selection = selected[i];
                            if (selection.filter === data.filter) {
                                // This flag stops another request being made to the server
                                this.s.serverSelecting = true;
                                row.select();
                                this.s.serverSelecting = false;
                                // Remove the selection from the to select list and add it to the selected list
                                selected.splice(i, 1);
                                this.s.selections.push(data.filter);
                                break;
                            }
                        }
                    }
                }
                // Remake any selections that are no longer present
                for (var _d = 0, selected_1 = selected; _d < selected_1.length; _d++) {
                    var selection = selected_1[_d];
                    for (var _e = 0, _f = this.s.rowData.arrayOriginal; _e < _f.length; _e++) {
                        var data = _f[_e];
                        if (data.filter === selection.filter) {
                            var row = this.addRow(data.display, data.filter, data.sort, data.type);
                            this.s.serverSelecting = true;
                            row.select();
                            this.s.serverSelecting = false;
                            this.s.selections.push(data.filter);
                        }
                    }
                }
                // Store the selected rows
                this.s.serverSelect = this.s.dtPane.rows({ selected: true }).data().toArray();
                // Update the pane
                this.s.dtPane.draw();
            }
        };
        /**
         * This method updates the rows and their data within the SearchPanes
         *
         * SearchPaneCascade overrides this method
         */
        SearchPaneST.prototype.updateRows = function () {
            if (!this.s.dt.page.info().serverSide) {
                // Get the latest count values from the table
                this.s.rowData.binsShown = {};
                for (var _i = 0, _a = this.s.dt.rows({ search: 'applied' }).indexes().toArray(); _i < _a.length; _i++) {
                    var index = _a[_i];
                    this._updateShown(index, this.s.dt.settings()[0], this.s.rowData.binsShown);
                }
            }
            // Update the rows data to show the current counts
            for (var _b = 0, _c = this.s.dtPane.rows().data().toArray(); _b < _c.length; _b++) {
                var row = _c[_b];
                row.shown = typeof this.s.rowData.binsShown[row.filter] === 'number' ?
                    this.s.rowData.binsShown[row.filter] :
                    0;
                this.s.dtPane.row(row.index).data(row);
            }
            // Show updates in the pane
            this.s.dtPane.draw();
            this.s.dtPane.table().node().parentNode.scrollTop = this.s.scrollTop;
        };
        /**
         * Remove functionality from makeSelection - needs to be more advanced when tracking selections
         */
        SearchPaneST.prototype._makeSelection = function () {
            return;
        };
        /**
         * Blank method to remove reloading of selected rows - needs to be more advanced when tracking selections
         */
        SearchPaneST.prototype._reloadSelect = function () {
            return;
        };
        /**
         * Decides if a row should be added when being added from the server
         *
         * Overridden by SearchPaneCascade
         *
         * @param data the row data
         * @returns boolean indicating if the row should be added or not
         */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        SearchPaneST.prototype._shouldAddRow = function (data) {
            return true;
        };
        /**
         * Updates the server selection list where appropriate
         */
        SearchPaneST.prototype._updateSelection = function () {
            if (this.s.dt.page.info().serverSide && !this.s.updating && !this.s.serverSelecting) {
                this.s.serverSelect = this.s.dtPane.rows({ selected: true }).data().toArray();
            }
        };
        /**
         * Used when binning the data for a column
         *
         * @param rowIdx The current row that is to be added to the bins
         * @param settings The datatables settings object
         * @param bins The bins object that is to be incremented
         */
        SearchPaneST.prototype._updateShown = function (rowIdx, settings, bins) {
            if (bins === void 0) { bins = this.s.rowData.binsShown; }
            var orth = typeof this.s.colOpts.orthogonal === 'string'
                ? this.s.colOpts.orthogonal
                : this.s.colOpts.orthogonal.search;
            var filter = settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, orth);
            var add = function (f) {
                if (!bins[f]) {
                    bins[f] = 1;
                }
                else {
                    bins[f]++;
                }
            };
            if (Array.isArray(filter)) {
                for (var _i = 0, filter_1 = filter; _i < filter_1.length; _i++) {
                    var f = filter_1[_i];
                    add(f);
                }
            }
            else {
                add(filter);
            }
        };
        return SearchPaneST;
    }(SearchPane));

    var __extends$3 = (window && window.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var $$3;
    function setJQuery$3(jq) {
        $$3 = jq;
    }
    var SearchPaneViewTotal = /** @class */ (function (_super) {
        __extends$3(SearchPaneViewTotal, _super);
        function SearchPaneViewTotal(paneSettings, opts, index, panesContainer, panes) {
            var _this = this;
            var override = {
                i18n: {
                    countFiltered: '{shown} ({total})'
                }
            };
            _this = _super.call(this, paneSettings, $$3.extend(override, opts), index, panesContainer, panes) || this;
            return _this;
        }
        /**
         * Gets the message that is to be used to indicate the count for each SearchPane row
         *
         * This method overrides _getMessage() in SearchPane and is overridden by SearchPaneCascadeViewTotal
         *
         * @param row The row object that is being processed
         * @returns string - the message that is to be shown for the count of each entry
         */
        SearchPaneViewTotal.prototype._getMessage = function (row) {
            var countMessage = this.s.dt.i18n('searchPanes.count', this.c.i18n.count);
            var filteredMessage = this.s.dt.i18n('searchPanes.countFiltered', this.c.i18n.countFiltered);
            return (this.s.filteringActive ? filteredMessage : countMessage)
                .replace(/{total}/g, row.total)
                .replace(/{shown}/g, row.shown);
        };
        /**
         * Overrides the blank method in SearchPane to return the number of times a given value is currently being displayed
         *
         * @param filter The filter value
         * @returns number - The number of times the value is shown
         */
        SearchPaneViewTotal.prototype._getShown = function (filter) {
            return this.s.rowData.binsShown && this.s.rowData.binsShown[filter] ?
                this.s.rowData.binsShown[filter] :
                0;
        };
        return SearchPaneViewTotal;
    }(SearchPaneST));

    var __extends$2 = (window && window.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var $$2;
    function setJQuery$2(jq) {
        $$2 = jq;
    }
    var SearchPaneCascade = /** @class */ (function (_super) {
        __extends$2(SearchPaneCascade, _super);
        function SearchPaneCascade(paneSettings, opts, index, panesContainer, panes) {
            var _this = this;
            var override = {
                i18n: {
                    count: '{shown}'
                }
            };
            _this = _super.call(this, paneSettings, $$2.extend(override, opts), index, panesContainer, panes) || this;
            return _this;
        }
        /**
         * This method updates the rows and their data within the SearchPanes
         *
         * This overrides the method in SearchPane
         */
        SearchPaneCascade.prototype.updateRows = function () {
            // Note the currently selected values in the pane and remove all of the rows
            var selected = this.s.dtPane.rows({ selected: true }).data().toArray();
            if (this.s.colOpts.options ||
                this.s.customPaneSettings && this.s.customPaneSettings.options) {
                // If there are custom options set or it is a custom pane then get them
                this._getComparisonRows();
                var rows = this.s.dtPane.rows().toArray()[0];
                for (var i = 0; i < rows.length; i++) {
                    var row = this.s.dtPane.row(rows[i]);
                    var rowData = row.data();
                    if (rowData === undefined) {
                        continue;
                    }
                    if (rowData.shown === 0) {
                        row.remove();
                        rows = this.s.dtPane.rows().toArray()[0];
                        i--;
                        continue;
                    }
                    for (var _i = 0, selected_1 = selected; _i < selected_1.length; _i++) {
                        var selection = selected_1[_i];
                        if (rowData.filter === selection.filter) {
                            row.select();
                            selected.splice(i, 1);
                            this.s.selections.push(rowData.filter);
                            break;
                        }
                    }
                }
            }
            else {
                if (!this.s.dt.page.info().serverSide) {
                    // Get the latest count values from the table
                    this._activePopulatePane();
                    this.s.rowData.binsShown = {};
                    for (var _a = 0, _b = this.s.dt.rows({ search: 'applied' }).indexes().toArray(); _a < _b.length; _a++) {
                        var index = _b[_a];
                        this._updateShown(index, this.s.dt.settings()[0], this.s.rowData.binsShown);
                    }
                }
                this.s.dtPane.rows().remove();
                // Go over all of the rows that could be displayed
                for (var _c = 0, _d = this.s.rowData.arrayFilter; _c < _d.length; _c++) {
                    var data = _d[_c];
                    // Cascade - If there are no rows present in the table don't show the option
                    if (data.shown === 0) {
                        continue;
                    }
                    // Add the row to the pane
                    var row = this.addRow(data.display, data.filter, data.sort, data.type, undefined);
                    // Check if this row was selected
                    for (var i = 0; i < selected.length; i++) {
                        var selection = selected[i];
                        if (selection.filter === data.filter) {
                            row.select();
                            // Remove the row from the to find list and then add it to the selections list
                            selected.splice(i, 1);
                            this.s.selections.push(data.filter);
                            break;
                        }
                    }
                }
                // Add all of the rows that were previously selected but aren't any more
                for (var _e = 0, selected_2 = selected; _e < selected_2.length; _e++) {
                    var selection = selected_2[_e];
                    for (var _f = 0, _g = this.s.rowData.arrayOriginal; _f < _g.length; _f++) {
                        var data = _g[_f];
                        if (data.filter === selection.filter) {
                            var row = this.addRow(data.display, data.filter, data.sort, data.type, undefined);
                            row.select();
                            this.s.selections.push(data.filter);
                        }
                    }
                }
            }
            // Show updates in the pane
            this.s.dtPane.draw();
            this.s.dtPane.table().node().parentNode.scrollTop = this.s.scrollTop;
            // If client side updated the tables results
            if (!this.s.dt.page.info().serverSide) {
                this.s.dt.draw();
            }
        };
        /**
         * Fill the array with the values that are currently being displayed in the table
         */
        SearchPaneCascade.prototype._activePopulatePane = function () {
            this.s.rowData.arrayFilter = [];
            this.s.rowData.bins = {};
            var settings = this.s.dt.settings()[0];
            if (!this.s.dt.page.info().serverSide) {
                for (var _i = 0, _a = this.s.dt.rows({ search: 'applied' }).indexes().toArray(); _i < _a.length; _i++) {
                    var index = _a[_i];
                    this._populatePaneArray(index, this.s.rowData.arrayFilter, settings);
                }
            }
        };
        SearchPaneCascade.prototype._getComparisonRows = function () {
            // Find the appropriate options depending on whether this is a pane for a specific column or a custom pane
            var options = this.s.colOpts.options
                ? this.s.colOpts.options
                : this.s.customPaneSettings && this.s.customPaneSettings.options
                    ? this.s.customPaneSettings.options
                    : undefined;
            if (options === undefined) {
                return;
            }
            var allRows = this.s.dt.rows();
            var shownRows = this.s.dt.rows({ search: 'applied' });
            var tableValsTotal = allRows.data().toArray();
            var tableValsShown = shownRows.data().toArray();
            var rows = [];
            // Clear all of the other rows from the pane, only custom options are to be displayed when they are defined
            this.s.dtPane.clear();
            this.s.indexes = [];
            for (var _i = 0, options_1 = options; _i < options_1.length; _i++) {
                var comp = options_1[_i];
                // Initialise the object which is to be placed in the row
                var insert = comp.label !== '' ?
                    comp.label :
                    this.emptyMessage();
                var comparisonObj = {
                    className: comp.className,
                    display: insert,
                    filter: typeof comp.value === 'function' ? comp.value : [],
                    shown: 0,
                    sort: insert,
                    total: 0,
                    type: insert
                };
                // If a custom function is in place
                if (typeof comp.value === 'function') {
                    // Count the number of times the function evaluates to true for the original data in the Table
                    for (var i = 0; i < tableValsTotal.length; i++) {
                        if (comp.value.call(this.s.dt, tableValsTotal[i], allRows[0][i])) {
                            comparisonObj.total++;
                        }
                    }
                    for (var i = 0; i < tableValsShown.length; i++) {
                        if (comp.value.call(this.s.dt, tableValsShown[i], shownRows[0][i])) {
                            comparisonObj.shown++;
                        }
                    }
                    // Update the comparisonObj
                    if (typeof comparisonObj.filter !== 'function') {
                        comparisonObj.filter.push(comp.filter);
                    }
                }
                rows.push(this.addRow(comparisonObj.display, comparisonObj.filter, comparisonObj.sort, comparisonObj.type, comparisonObj.className, comparisonObj.total, comparisonObj.shown));
            }
            return rows;
        };
        /**
         * Gets the message that is to be used to indicate the count for each SearchPane row
         *
         * This method overrides _getMessage() in SearchPane and is overridden by SearchPaneCascadeViewTotal
         *
         * @param row The row object that is being processed
         * @returns string - the message that is to be shown for the count of each entry
         */
        SearchPaneCascade.prototype._getMessage = function (row) {
            return this.s.dt.i18n('searchPanes.count', this.c.i18n.count)
                .replace(/{total}/g, row.total)
                .replace(/{shown}/g, row.shown);
        };
        /**
         * Overrides the blank method in SearchPane to return the number of times a given value is currently being displayed
         *
         * @param filter The filter value
         * @returns number - The number of times the value is shown
         */
        SearchPaneCascade.prototype._getShown = function (filter) {
            return this.s.rowData.binsShown && this.s.rowData.binsShown[filter] ?
                this.s.rowData.binsShown[filter] :
                0;
        };
        /**
         * Decides if a row should be added when being added from the server
         *
         * Overrides method in by SearchPaneST
         *
         * @param data the row data
         * @returns boolean indicating if the row should be added or not
         */
        SearchPaneCascade.prototype._shouldAddRow = function (data) {
            return data.shown > 0;
        };
        return SearchPaneCascade;
    }(SearchPaneST));

    var __extends$1 = (window && window.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var $$1;
    function setJQuery$1(jq) {
        $$1 = jq;
    }
    var SearchPaneCascadeViewTotal = /** @class */ (function (_super) {
        __extends$1(SearchPaneCascadeViewTotal, _super);
        function SearchPaneCascadeViewTotal(paneSettings, opts, index, panesContainer, panes) {
            var _this = this;
            var override = {
                i18n: {
                    count: '{total}',
                    countFiltered: '{shown} ({total})'
                }
            };
            _this = _super.call(this, paneSettings, $$1.extend(override, opts), index, panesContainer, panes) || this;
            return _this;
        }
        /**
         * Fill the array with the values that are currently being displayed in the table
         *
         * This method overrides _activePopulatePane() in SearchPaneCascade
         */
        SearchPaneCascadeViewTotal.prototype._activePopulatePane = function () {
            this.s.rowData.arrayFilter = [];
            this.s.rowData.binsShown = {};
            var settings = this.s.dt.settings()[0];
            if (!this.s.dt.page.info().serverSide) {
                for (var _i = 0, _a = this.s.dt.rows({ search: 'applied' }).indexes().toArray(); _i < _a.length; _i++) {
                    var index = _a[_i];
                    this._populatePaneArray(index, this.s.rowData.arrayFilter, settings, this.s.rowData.binsShown);
                }
            }
        };
        /**
         * Gets the message that is to be used to indicate the count for each SearchPane row
         *
         * This method overrides _getMessage() in SearchPaneCascade
         *
         * @param row The row object that is being processed
         * @returns string - the message that is to be shown for the count of each entry
         */
        SearchPaneCascadeViewTotal.prototype._getMessage = function (row) {
            var countMessage = this.s.dt.i18n('searchPanes.count', this.c.i18n.count);
            var filteredMessage = this.s.dt.i18n('searchPanes.countFiltered', this.c.i18n.countFiltered);
            return (this.s.filteringActive ? filteredMessage : countMessage)
                .replace(/{total}/g, row.total)
                .replace(/{shown}/g, row.shown);
        };
        return SearchPaneCascadeViewTotal;
    }(SearchPaneCascade));

    var $;
    var dataTable;
    function setJQuery(jq) {
        $ = jq;
        dataTable = jq.fn.dataTable;
    }
    var SearchPanes = /** @class */ (function () {
        function SearchPanes(paneSettings, opts, fromPreInit, paneClass) {
            var _this = this;
            if (fromPreInit === void 0) { fromPreInit = false; }
            if (paneClass === void 0) { paneClass = SearchPane; }
            // Check that the required version of DataTables is included
            if (!dataTable || !dataTable.versionCheck || !dataTable.versionCheck('1.10.0')) {
                throw new Error('SearchPane requires DataTables 1.10 or newer');
            }
            // Check that Select is included
            // eslint-disable-next-line no-extra-parens
            if (!dataTable.select) {
                throw new Error('SearchPane requires Select');
            }
            var table = new dataTable.Api(paneSettings);
            this.classes = $.extend(true, {}, SearchPanes.classes);
            // Get options from user
            this.c = $.extend(true, {}, SearchPanes.defaults, opts);
            // Add extra elements to DOM object including clear
            this.dom = {
                clearAll: $('<button type="button"/>')
                    .addClass(this.classes.clearAll)
                    .html(table.i18n('searchPanes.clearMessage', this.c.i18n.clearMessage)),
                collapseAll: $('<button type="button"/>')
                    .addClass(this.classes.collapseAll)
                    .html(table.i18n('searchPanes.collapseMessage', this.c.i18n.collapseMessage)),
                container: $('<div/>').addClass(this.classes.panes).html(table.i18n('searchPanes.loadMessage', this.c.i18n.loadMessage)),
                emptyMessage: $('<div/>').addClass(this.classes.emptyMessage),
                panes: $('<div/>').addClass(this.classes.container),
                showAll: $('<button type="button"/>')
                    .addClass(this.classes.showAll)
                    .addClass(this.classes.disabledButton)
                    .attr('disabled', 'true')
                    .html(table.i18n('searchPanes.showMessage', this.c.i18n.showMessage)),
                title: $('<div/>').addClass(this.classes.title),
                titleRow: $('<div/>').addClass(this.classes.titleRow)
            };
            this.s = {
                colOpts: [],
                dt: table,
                filterCount: 0,
                minPaneWidth: 260.0,
                page: 0,
                paging: false,
                pagingST: false,
                paneClass: paneClass,
                panes: [],
                selectionList: [],
                serverData: {},
                stateRead: false,
                updating: false
            };
            // Do not reinitialise if already initialised on table
            if (table.settings()[0]._searchPanes) {
                return;
            }
            this._getState();
            if (this.s.dt.page.info().serverSide) {
                var hostSettings = this.s.dt.settings()[0];
                // Listener to get the data into the server request before it is made
                this.s.dt.on('preXhr.dtsps', function (e, settings, data) {
                    if (hostSettings !== settings) {
                        return;
                    }
                    if (data.searchPanes === undefined) {
                        data.searchPanes = {};
                    }
                    if (data.searchPanes_null === undefined) {
                        data.searchPanes_null = {};
                    }
                    var src;
                    for (var _i = 0, _a = _this.s.selectionList; _i < _a.length; _i++) {
                        var selection = _a[_i];
                        src = _this.s.dt.column(selection.column).dataSrc();
                        if (data.searchPanes[src] === undefined) {
                            data.searchPanes[src] = {};
                        }
                        if (data.searchPanes_null[src] === undefined) {
                            data.searchPanes_null[src] = {};
                        }
                        for (var i = 0; i < selection.rows.length; i++) {
                            data.searchPanes[src][i] = selection.rows[i];
                            if (data.searchPanes[src][i] === null) {
                                data.searchPanes_null[src][i] = true;
                            }
                        }
                    }
                    if (_this.s.selectionList.length > 0) {
                        data.searchPanesLast = src;
                    }
                });
            }
            this._setXHR();
            table.settings()[0]._searchPanes = this;
            if (this.s.dt.settings()[0]._bInitComplete || fromPreInit) {
                this._paneDeclare(table, paneSettings, opts);
            }
            else {
                table.one('preInit.dtsps', function () {
                    _this._paneDeclare(table, paneSettings, opts);
                });
            }
            return this;
        }
        /**
         * Clear the selections of all of the panes
         */
        SearchPanes.prototype.clearSelections = function () {
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.dtPane) {
                    pane.s.scrollTop = pane.s.dtPane.table().node().parentNode.scrollTop;
                }
            }
            // Load in all of the searchBoxes in the documents
            var searches = this.dom.container.find('.' + this.classes.search.replace(/\s+/g, '.'));
            // For each searchBox set the input text to be empty and then trigger
            // an input on them so that they no longer filter the panes
            searches.each(function () {
                $(this).val('').trigger('input');
            });
            // Clear the selectionList
            this.s.selectionList = [];
            var returnArray = [];
            for (var _b = 0, _c = this.s.panes; _b < _c.length; _b++) {
                var pane = _c[_b];
                if (pane.s.dtPane) {
                    returnArray.push(pane.clearPane());
                }
            }
            return returnArray;
        };
        /**
         * returns the container node for the searchPanes
         */
        SearchPanes.prototype.getNode = function () {
            return this.dom.container;
        };
        /**
         * rebuilds all of the panes
         */
        SearchPanes.prototype.rebuild = function (targetIdx, maintainSelection) {
            if (targetIdx === void 0) { targetIdx = false; }
            if (maintainSelection === void 0) { maintainSelection = false; }
            this.dom.emptyMessage.detach();
            // As a rebuild from scratch is required, empty the searchpanes container.
            if (targetIdx === false) {
                this.dom.panes.empty();
            }
            // Rebuild each pane individually, if a specific pane has been selected then only rebuild that one
            var returnArray = [];
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (targetIdx === false || pane.s.index === targetIdx) {
                    pane.clearData();
                    pane.rebuildPane(this.s.dt.page.info().serverSide ?
                        this.s.serverData :
                        undefined, maintainSelection);
                    this.dom.panes.append(pane.dom.container);
                    returnArray.push(pane);
                }
            }
            this._updateSelection();
            // Attach panes, clear buttons, and title bar to the document
            this._updateFilterCount();
            this._attachPaneContainer();
            this._initSelectionListeners(false);
            // If the selections are to be maintained, then it is safe to assume that paging is also to be maintained
            // Otherwise, the paging should be reset
            this.s.dt.draw(!maintainSelection);
            // Resize the panes incase there has been a change
            this.resizePanes();
            // If a single pane has been rebuilt then return only that pane
            return returnArray.length === 1 ? returnArray[0] : returnArray;
        };
        /**
         * Resizes all of the panes
         */
        SearchPanes.prototype.resizePanes = function () {
            if (this.c.layout === 'auto') {
                var contWidth = $(this.s.dt.searchPanes.container()).width();
                var target = Math.floor(contWidth / this.s.minPaneWidth); // The neatest number of panes per row
                var highest_1 = 1;
                var highestmod_1 = 0;
                // Get the indexes of all of the displayed panes
                var dispIndex = [];
                for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                    var pane = _a[_i];
                    if (pane.s.displayed) {
                        dispIndex.push(pane.s.index);
                    }
                }
                var displayCount = dispIndex.length;
                // If the neatest number is the number we have then use this.
                if (target === displayCount) {
                    highest_1 = target;
                }
                else {
                    // Go from the target down and find the value with the most panes left over, this will be the best fit
                    for (var ppr = target; ppr > 1; ppr--) {
                        var rem = displayCount % ppr;
                        if (rem === 0) {
                            highest_1 = ppr;
                            highestmod_1 = 0;
                            break;
                        }
                        // If there are more left over at this amount of panes per row (ppr)
                        // then it fits better so new values
                        else if (rem > highestmod_1) {
                            highest_1 = ppr;
                            highestmod_1 = rem;
                        }
                    }
                }
                // If there is a perfect fit then none are to be wider
                var widerIndexes_1 = highestmod_1 !== 0 ? dispIndex.slice(dispIndex.length - highestmod_1, dispIndex.length) : [];
                this.s.panes.forEach(function (pane) {
                    // Resize the pane with the new layout
                    if (pane.s.displayed) {
                        pane.resize('columns-' + (!widerIndexes_1.includes(pane.s.index) ? highest_1 : highestmod_1));
                    }
                });
            }
            else {
                for (var _b = 0, _c = this.s.panes; _b < _c.length; _b++) {
                    var pane = _c[_b];
                    pane.adjustTopRow();
                }
            }
            return this;
        };
        /**
         * Holder method that is userd in SearchPanesST to set listeners that have an effect on other panes
         *
         * @param isPreselect boolean to indicate if the preselect array is to override the current selection list.
         */
        SearchPanes.prototype._initSelectionListeners = function (isPreselect) {
            return;
        };
        /**
         * Blank method that is overridden in SearchPanesST to retrieve the totals from the server data
         */
        SearchPanes.prototype._serverTotals = function () {
            return;
        };
        /**
         * Set's the xhr listener so that SP can extact appropriate data from the response
         */
        SearchPanes.prototype._setXHR = function () {
            var _this = this;
            var hostSettings = this.s.dt.settings()[0];
            var run = function (json) {
                if (json && json.searchPanes && json.searchPanes.options) {
                    _this.s.serverData = json;
                    _this.s.serverData.tableLength = json.recordsTotal;
                    _this._serverTotals();
                }
            };
            // We are using the xhr event to rebuild the panes if required due to viewTotal being enabled
            // If viewTotal is not enabled then we simply update the data from the server
            this.s.dt.on('xhr.dtsps', function (e, settings, json) {
                if (hostSettings === settings) {
                    run(json);
                }
            });
            // Account for the initial JSON fetch having already completed
            run(this.s.dt.ajax.json());
        };
        /**
         * Set's the function that is to be performed when a state is loaded
         *
         * Overridden by the method in SearchPanesST
         */
        SearchPanes.prototype._stateLoadListener = function () {
            var _this = this;
            this.s.dt.on('stateLoadParams.dtsps', function (e, settings, data) {
                if (data.searchPanes === undefined) {
                    return;
                }
                _this.clearSelections();
                // Set the selection list for the panes so that the correct
                // rows can be reselected and in the right order
                _this.s.selectionList =
                    data.searchPanes.selectionList ?
                        data.searchPanes.selectionList :
                        [];
                // Find the panes that match from the state and the actual instance
                if (data.searchPanes.panes) {
                    for (var _i = 0, _a = data.searchPanes.panes; _i < _a.length; _i++) {
                        var loadedPane = _a[_i];
                        for (var _b = 0, _c = _this.s.panes; _b < _c.length; _b++) {
                            var pane = _c[_b];
                            if (loadedPane.id === pane.s.index && pane.s.dtPane) {
                                // Set the value of the searchbox
                                pane.dom.searchBox.val(loadedPane.searchTerm);
                                // Set the value of the order
                                pane.s.dtPane.order(loadedPane.order);
                            }
                        }
                    }
                }
                _this._makeSelections(_this.s.selectionList);
            });
        };
        /**
         * Updates the selectionList when cascade is not in place
         *
         * Overridden in SearchPanesST
         */
        SearchPanes.prototype._updateSelection = function () {
            this.s.selectionList = [];
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.dtPane) {
                    var rows = pane.s.dtPane.rows({ selected: true }).data().toArray().map(function (el) { return el.filter; });
                    if (rows.length) {
                        this.s.selectionList.push({
                            column: pane.s.index,
                            rows: rows
                        });
                    }
                }
            }
        };
        /**
         * Attach the panes, buttons and title to the document
         */
        SearchPanes.prototype._attach = function () {
            var _this = this;
            this.dom.titleRow
                .removeClass(this.classes.hide)
                .detach()
                .append(this.dom.title);
            // If the clear button is permitted attach it
            if (this.c.clear) {
                this.dom.clearAll
                    .appendTo(this.dom.titleRow)
                    .on('click.dtsps', function () { return _this.clearSelections(); });
            }
            if (this.c.collapse) {
                this.dom.showAll.appendTo(this.dom.titleRow);
                this.dom.collapseAll.appendTo(this.dom.titleRow);
                this._setCollapseListener();
            }
            // Attach the container for each individual pane to the overall container
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                this.dom.panes.append(pane.dom.container);
            }
            // Attach everything to the document
            this.dom.container
                .text('')
                .removeClass(this.classes.hide)
                .append(this.dom.titleRow)
                .append(this.dom.panes);
            // WORKAROUND
            this.s.panes.forEach(function (pane) { return pane.setListeners(); });
            if ($('div.' + this.classes.container).length === 0) {
                this.dom.container.prependTo(this.s.dt);
            }
        };
        /**
         * If there are no panes to display then this method is called to either
         * display a message in their place or hide them completely.
         */
        SearchPanes.prototype._attachMessage = function () {
            // Create a message to display on the screen
            var message;
            try {
                message = this.s.dt.i18n('searchPanes.emptyPanes', this.c.i18n.emptyPanes);
            }
            catch (error) {
                message = null;
            }
            // If the message is an empty string then searchPanes.emptyPanes is undefined,
            // therefore the pane container should be removed from the display
            if (message === null) {
                this.dom.container.addClass(this.classes.hide);
                this.dom.titleRow.removeClass(this.classes.hide);
                return;
            }
            // Otherwise display the message
            this.dom.container.removeClass(this.classes.hide);
            this.dom.titleRow.addClass(this.classes.hide);
            this.dom.emptyMessage.html(message).appendTo(this.dom.container);
        };
        /**
         * Attaches the panes to the document and displays a message or hides if there are none
         */
        SearchPanes.prototype._attachPaneContainer = function () {
            // If a pane is to be displayed then attach the normal pane output
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.displayed === true) {
                    this._attach();
                    return;
                }
            }
            // Otherwise attach the custom message or remove the container from the display
            this._attachMessage();
        };
        /**
         * Checks which panes are collapsed and then performs relevant actions to the collapse/show all buttons
         */
        SearchPanes.prototype._checkCollapse = function () {
            var disableClose = true;
            var disableShow = true;
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.displayed) {
                    // If the pane is not collapsed
                    if (!pane.dom.collapseButton.hasClass(pane.classes.rotated)) {
                        // Enable the collapse all button
                        this.dom.collapseAll.removeClass(this.classes.disabledButton).removeAttr('disabled');
                        disableClose = false;
                    }
                    else {
                        // Otherwise enable the show all button
                        this.dom.showAll.removeClass(this.classes.disabledButton).removeAttr('disabled');
                        disableShow = false;
                    }
                }
            }
            // If this flag is still true, no panes are open so the close button should be disabled
            if (disableClose) {
                this.dom.collapseAll.addClass(this.classes.disabledButton).attr('disabled', 'true');
            }
            // If this flag is still true, no panes are closed so the show button should be disabled
            if (disableShow) {
                this.dom.showAll.addClass(this.classes.disabledButton).attr('disabled', 'true');
            }
        };
        /**
         * Attaches the message to the document but does not add any panes
         */
        SearchPanes.prototype._checkMessage = function () {
            // If a pane is to be displayed then attach the normal pane output
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.displayed === true) {
                    // Ensure that the empty message is removed if a pane is displayed
                    this.dom.emptyMessage.detach();
                    this.dom.titleRow.removeClass(this.classes.hide);
                    return;
                }
            }
            // Otherwise attach the custom message or remove the container from the display
            this._attachMessage();
        };
        /**
         * Collapses all of the panes
         */
        SearchPanes.prototype._collapseAll = function () {
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                pane.collapse();
            }
        };
        /**
         * Finds a pane based upon the name of that pane
         *
         * @param name string representing the name of the pane
         * @returns SearchPane The pane which has that name
         */
        SearchPanes.prototype._findPane = function (name) {
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (name === pane.s.name) {
                    return pane;
                }
            }
        };
        /**
         * Gets the selection list from the previous state and stores it in the selectionList Property
         */
        SearchPanes.prototype._getState = function () {
            var loadedFilter = this.s.dt.state.loaded();
            if (loadedFilter && loadedFilter.searchPanes && loadedFilter.searchPanes.selectionList) {
                this.s.selectionList = loadedFilter.searchPanes.selectionList;
            }
        };
        SearchPanes.prototype._makeSelections = function (selectList) {
            for (var _i = 0, selectList_1 = selectList; _i < selectList_1.length; _i++) {
                var selection = selectList_1[_i];
                var pane = void 0;
                for (var _a = 0, _b = this.s.panes; _a < _b.length; _a++) {
                    var p = _b[_a];
                    if (p.s.index === selection.column) {
                        pane = p;
                        break;
                    }
                }
                if (pane && pane.s.dtPane) {
                    for (var j = 0; j < pane.s.dtPane.rows().data().toArray().length; j++) {
                        if (selection.rows.includes(typeof pane.s.dtPane.row(j).data().filter === 'function' ?
                            pane.s.dtPane.cell(j, 0).data() :
                            pane.s.dtPane.row(j).data().filter)) {
                            pane.s.dtPane.row(j).select();
                        }
                    }
                    pane.updateTable();
                }
            }
        };
        /**
         * Declares the instances of individual searchpanes dependant on the number of columns.
         * It is necessary to run this once preInit has completed otherwise no panes will be
         * created as the column count will be 0.
         *
         * @param table the DataTable api for the parent table
         * @param paneSettings the settings passed into the constructor
         * @param opts the options passed into the constructor
         */
        SearchPanes.prototype._paneDeclare = function (table, paneSettings, opts) {
            var _this = this;
            // Create Panes
            table
                .columns(this.c.columns.length > 0 ? this.c.columns : undefined)
                .eq(0)
                .each(function (idx) {
                _this.s.panes.push(new _this.s.paneClass(paneSettings, opts, idx, _this.dom.panes));
            });
            // If there is any extra custom panes defined then create panes for them too
            var colCount = table.columns().eq(0).toArray().length;
            for (var i = 0; i < this.c.panes.length; i++) {
                var id = colCount + i;
                this.s.panes.push(new this.s.paneClass(paneSettings, opts, id, this.dom.panes, this.c.panes[i]));
            }
            // If a custom ordering is being used
            if (this.c.order.length > 0) {
                // Make a new Array of panes based upon the order
                this.s.panes = this.c.order.map(function (name) { return _this._findPane(name); });
            }
            // If this internal property is true then the DataTable has been initialised already
            if (this.s.dt.settings()[0]._bInitComplete) {
                this._startup(table);
            }
            else {
                // Otherwise add the paneStartup function to the list of functions
                // that are to be run when the table is initialised. This will garauntee that the
                // panes are initialised before the init event and init Complete callback is fired
                this.s.dt.settings()[0].aoInitComplete.push({
                    fn: function () { return _this._startup(table); }
                });
            }
        };
        /**
         * Sets the listeners for the collapse and show all buttons
         * Also sets and performs checks on current panes to see if they are collapsed
         */
        SearchPanes.prototype._setCollapseListener = function () {
            var _this = this;
            this.dom.collapseAll.on('click.dtsps', function () {
                _this._collapseAll();
                _this.dom.collapseAll.addClass(_this.classes.disabledButton).attr('disabled', 'true');
                _this.dom.showAll.removeClass(_this.classes.disabledButton).removeAttr('disabled');
                _this.s.dt.state.save();
            });
            this.dom.showAll.on('click.dtsps', function () {
                _this._showAll();
                _this.dom.showAll.addClass(_this.classes.disabledButton).attr('disabled', 'true');
                _this.dom.collapseAll.removeClass(_this.classes.disabledButton).removeAttr('disabled');
                _this.s.dt.state.save();
            });
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                // We want to make the same check whenever there is a collapse/expand
                pane.dom.collapseButton.on('click.dtsps', function () { return _this._checkCollapse(); });
            }
            this._checkCollapse();
        };
        /**
         * Shows all of the panes
         */
        SearchPanes.prototype._showAll = function () {
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                pane.show();
            }
        };
        /**
         * Initialises the tables previous/preset selections and initialises callbacks for events
         *
         * @param table the parent table for which the searchPanes are being created
         */
        SearchPanes.prototype._startup = function (table) {
            var _this = this;
            // Attach clear button and title bar to the document
            this._attach();
            this.dom.panes.empty();
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                pane.rebuildPane(Object.keys(this.s.serverData).length > 0 ? this.s.serverData : undefined);
                this.dom.panes.append(pane.dom.container);
            }
            // If the layout is set to auto then the panes need to be resized to their best fit
            if (this.c.layout === 'auto') {
                this.resizePanes();
            }
            var loadedFilter = this.s.dt.state.loaded();
            // Reset the paging if that has been saved in the state
            if (!this.s.stateRead && loadedFilter) {
                this.s.dt
                    .page(loadedFilter.start / this.s.dt.page.len())
                    .draw('page');
            }
            this.s.stateRead = true;
            this._checkMessage();
            // When a draw is called on the DataTable, update all of the panes incase the data in the DataTable has changed
            table.on('preDraw.dtsps', function () {
                // Check that the panes are not updating to avoid infinite loops
                // Also check that this draw is not due to paging
                if (!_this.s.updating && !_this.s.paging) {
                    _this._updateFilterCount();
                    _this._updateSelection();
                }
                // Paging flag reset - we only need to dodge the draw once
                _this.s.paging = false;
            });
            $(window).on('resize.dtsps', dataTable.util.throttle(function () { return _this.resizePanes(); }));
            // Whenever a state save occurs store the selection list in the state object
            this.s.dt.on('stateSaveParams.dtsps', function (e, settings, data) {
                if (data.searchPanes === undefined) {
                    data.searchPanes = {};
                }
                data.searchPanes.selectionList = _this.s.selectionList;
            });
            this._stateLoadListener();
            // Listener for paging on main table
            table.off('page.dtsps page-nc.dtsps').on('page.dtsps page-nc.dtsps', function (e, s) {
                _this.s.paging = true;
                // This is an indicator to any selection tracking classes that paging has occured
                // It has to happen here so that we don't stack event listeners unnecessarily
                // The value is only ever set back to false in the SearchPanesST class
                // Equally it is never read in this class
                _this.s.pagingST = true;
                _this.s.page = _this.s.dt.page();
            });
            if (this.s.dt.page.info().serverSide) {
                table.off('preXhr.dtsps').on('preXhr.dtsps', function (e, settings, data) {
                    if (!data.searchPanes) {
                        data.searchPanes = {};
                    }
                    if (!data.searchPanes_null) {
                        data.searchPanes_null = {};
                    }
                    // Count how many filters are being applied
                    var filterCount = 0;
                    for (var _i = 0, _a = _this.s.panes; _i < _a.length; _i++) {
                        var pane = _a[_i];
                        var src = _this.s.dt.column(pane.s.index).dataSrc();
                        if (!data.searchPanes[src]) {
                            data.searchPanes[src] = {};
                        }
                        if (!data.searchPanes_null[src]) {
                            data.searchPanes_null[src] = {};
                        }
                        if (pane.s.dtPane) {
                            var rowData = pane.s.dtPane.rows({ selected: true }).data().toArray();
                            for (var i = 0; i < rowData.length; i++) {
                                data.searchPanes[src][i] = rowData[i].filter;
                                if (!data.searchPanes[src][i]) {
                                    data.searchPanes_null[src][i] = true;
                                }
                                filterCount++;
                            }
                        }
                    }
                    // If there is a filter to be applied, then we need to read from the start of the result set
                    // and set the paging to 0. This matches the behaviour of client side processing
                    if (filterCount > 0) {
                        // If the number of filters has changed we need to read from the start of the
                        // result set and reset the paging
                        if (filterCount !== _this.s.filterCount) {
                            data.start = 0;
                            _this.s.page = 0;
                        }
                        // Otherwise it is a paging request and we need to read from whatever the paging has been set to
                        else {
                            data.start = _this.s.page * _this.s.dt.page.len();
                        }
                        _this.s.dt.page(_this.s.page);
                        _this.s.filterCount = filterCount;
                    }
                    if (_this.s.selectionList.length > 0) {
                        data.searchPanesLast = _this.s.dt
                            .column(_this.s.selectionList[_this.s.selectionList.length - 1].column)
                            .dataSrc();
                    }
                });
            }
            else {
                table.on('preXhr.dtsps', function () { return _this.s.panes.forEach(function (pane) { return pane.clearData(); }); });
            }
            // If the data is reloaded from the server then it is possible that it has changed completely,
            // so we need to rebuild the panes
            this.s.dt.on('xhr.dtsps', function (e, settings) {
                if (settings.nTable !== _this.s.dt.table().node()) {
                    return;
                }
                if (!_this.s.dt.page.info().serverSide) {
                    var processing_1 = false;
                    _this.s.dt.one('preDraw.dtsps', function () {
                        if (processing_1) {
                            return;
                        }
                        var page = _this.s.dt.page();
                        processing_1 = true;
                        _this.s.updating = true;
                        _this.dom.panes.empty();
                        for (var _i = 0, _a = _this.s.panes; _i < _a.length; _i++) {
                            var pane = _a[_i];
                            pane.clearData(); // Clears all of the bins and will mean that the data has to be re-read
                            // Pass a boolean to say whether this is the last choice made for maintaining selections
                            // when rebuilding
                            pane.rebuildPane(undefined, true);
                            _this.dom.panes.append(pane.dom.container);
                        }
                        if (!_this.s.dt.page.info().serverSide) {
                            _this.s.dt.draw();
                        }
                        _this.s.updating = false;
                        _this._updateSelection();
                        _this._checkMessage();
                        _this.s.dt.one('draw.dtsps', function () {
                            _this.s.updating = true;
                            _this.s.dt.page(page).draw(false);
                            _this.s.updating = false;
                        });
                    });
                }
            });
            // PreSelect any selections which have been defined using the preSelect option
            var selectList = this.c.preSelect;
            if (loadedFilter && loadedFilter.searchPanes && loadedFilter.searchPanes.selectionList) {
                selectList = loadedFilter.searchPanes.selectionList;
            }
            this._makeSelections(selectList);
            // Update the title bar to show how many filters have been selected
            this._updateFilterCount();
            // If the table is destroyed and restarted then clear the selections so that they do not persist.
            table.on('destroy.dtsps', function () {
                for (var _i = 0, _a = _this.s.panes; _i < _a.length; _i++) {
                    var pane = _a[_i];
                    pane.destroy();
                }
                table.off('.dtsps');
                _this.dom.showAll.off('.dtsps');
                _this.dom.clearAll.off('.dtsps');
                _this.dom.collapseAll.off('.dtsps');
                $(table.table().node()).off('.dtsps');
                _this.dom.container.detach();
                _this.clearSelections();
            });
            if (this.c.collapse) {
                this._setCollapseListener();
            }
            // When the clear All button has been pressed clear all of the selections in the panes
            if (this.c.clear) {
                this.dom.clearAll.on('click.dtsps', function () { return _this.clearSelections(); });
            }
            table.settings()[0]._searchPanes = this;
            // This state save is required so that state is maintained over multiple refreshes if no actions are made
            this.s.dt.state.save();
        };
        /**
         * Updates the number of filters that have been applied in the title
         */
        SearchPanes.prototype._updateFilterCount = function () {
            var filterCount = 0;
            // Add the number of all of the filters throughout the panes
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.dtPane) {
                    filterCount += pane.getPaneCount();
                }
            }
            // Run the message through the internationalisation method to improve readability
            this.dom.title.html(this.s.dt.i18n('searchPanes.title', this.c.i18n.title, filterCount));
            if (this.c.filterChanged && typeof this.c.filterChanged === 'function') {
                this.c.filterChanged.call(this.s.dt, filterCount);
            }
            if (filterCount === 0) {
                this.dom.clearAll.addClass(this.classes.disabledButton).attr('disabled', 'true');
            }
            else {
                this.dom.clearAll.removeClass(this.classes.disabledButton).removeAttr('disabled');
            }
        };
        SearchPanes.version = '2.0.2';
        SearchPanes.classes = {
            clear: 'dtsp-clear',
            clearAll: 'dtsp-clearAll',
            collapseAll: 'dtsp-collapseAll',
            container: 'dtsp-searchPanes',
            disabledButton: 'dtsp-disabledButton',
            emptyMessage: 'dtsp-emptyMessage',
            hide: 'dtsp-hidden',
            panes: 'dtsp-panesContainer',
            search: 'dtsp-search',
            showAll: 'dtsp-showAll',
            title: 'dtsp-title',
            titleRow: 'dtsp-titleRow'
        };
        // Define SearchPanes default options
        SearchPanes.defaults = {
            clear: true,
            collapse: true,
            columns: [],
            container: function (dt) {
                return dt.table().container();
            },
            filterChanged: undefined,
            i18n: {
                clearMessage: 'Clear All',
                clearPane: '&times;',
                collapse: {
                    0: 'SearchPanes',
                    _: 'SearchPanes (%d)'
                },
                collapseMessage: 'Collapse All',
                count: '{total}',
                emptyMessage: '<em>No data</em>',
                emptyPanes: 'No SearchPanes',
                loadMessage: 'Loading Search Panes...',
                showMessage: 'Show All',
                title: 'Filters Active - %d'
            },
            layout: 'auto',
            order: [],
            panes: [],
            preSelect: []
        };
        return SearchPanes;
    }());

    var __extends = (window && window.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var SearchPanesST = /** @class */ (function (_super) {
        __extends(SearchPanesST, _super);
        function SearchPanesST(paneSettings, opts, fromPreInit) {
            if (fromPreInit === void 0) { fromPreInit = false; }
            var _this = this;
            var paneClass;
            if (opts.cascadePanes && opts.viewTotal) {
                paneClass = SearchPaneCascadeViewTotal;
            }
            else if (opts.cascadePanes) {
                paneClass = SearchPaneCascade;
            }
            else if (opts.viewTotal) {
                paneClass = SearchPaneViewTotal;
            }
            _this = _super.call(this, paneSettings, opts, fromPreInit, paneClass) || this;
            var loadedFilter = _this.s.dt.state.loaded();
            var loadFn = function () { return _this._initSelectionListeners(true, loadedFilter && loadedFilter.searchPanes && loadedFilter.searchPanes.selectionList ?
                loadedFilter.searchPanes.selectionList :
                _this.c.preSelect); };
            _this.s.dt.off('init.dtsps').on('init.dtsps', loadFn);
            return _this;
        }
        /**
         * Ensures that the correct selection listeners are set for selection tracking
         *
         * @param preSelect Any values that are to be preselected
         */
        SearchPanesST.prototype._initSelectionListeners = function (isPreselect, preSelect) {
            if (isPreselect === void 0) { isPreselect = true; }
            if (preSelect === void 0) { preSelect = []; }
            if (isPreselect) {
                this.s.selectionList = preSelect;
            }
            // Set selection listeners for each pane
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.displayed) {
                    pane.s.dtPane
                        .off('select.dtsp')
                        .on('select.dtsp', this._update(pane))
                        .off('deselect.dtsp')
                        .on('deselect.dtsp', this._updateTimeout(pane));
                }
            }
            // Update on every draw
            this.s.dt.off('draw.dtsps').on('draw.dtsps', this._update());
            // Also update right now as table has just initialised
            this._updateSelectionList();
        };
        /**
         * Retrieve the total values from the server data
         */
        SearchPanesST.prototype._serverTotals = function () {
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.colOpts.show) {
                    var colTitle = this.s.dt.column(pane.s.index).dataSrc();
                    var blockVT = true;
                    // If any of the counts are not equal to the totals filtering must be active
                    if (this.s.serverData.searchPanes.options[colTitle]) {
                        for (var _b = 0, _c = this.s.serverData.searchPanes.options[colTitle]; _b < _c.length; _b++) {
                            var data = _c[_b];
                            if (data.total !== data.count) {
                                blockVT = false;
                                break;
                            }
                        }
                    }
                    // Set if filtering is present on the pane and populate the data arrays
                    pane.s.filteringActive = !blockVT;
                    pane._serverPopulate(this.s.serverData);
                }
            }
        };
        /**
         * Set's the function that is to be performed when a state is loaded
         *
         * Overrides the method in SearchPanes
         */
        SearchPanesST.prototype._stateLoadListener = function () {
            var _this = this;
            var stateLoadFunction = function (e, settings, data) {
                if (data.searchPanes === undefined) {
                    return;
                }
                // Set the selection list for the panes so that the correct
                // rows can be reselected and in the right order
                _this.s.selectionList =
                    data.searchPanes.selectionList ?
                        data.searchPanes.selectionList :
                        [];
                // Find the panes that match from the state and the actual instance
                if (data.searchPanes.panes) {
                    for (var _i = 0, _a = data.searchPanes.panes; _i < _a.length; _i++) {
                        var loadedPane = _a[_i];
                        for (var _b = 0, _c = _this.s.panes; _b < _c.length; _b++) {
                            var pane = _c[_b];
                            if (loadedPane.id === pane.s.index && pane.s.dtPane) {
                                // Set the value of the searchbox
                                pane.dom.searchBox.val(loadedPane.searchTerm);
                                // Set the value of the order
                                pane.s.dtPane.order(loadedPane.order);
                            }
                        }
                    }
                }
                _this._updateSelectionList();
            };
            this.s.dt.off('stateLoadParams.dtsps', stateLoadFunction).on('stateLoadParams.dtsps', stateLoadFunction);
        };
        /**
         * Remove the function's actions when using cascade
         *
         * Overrides the method in SearchPanes
         */
        SearchPanesST.prototype._updateSelection = function () {
            return;
        };
        /**
         * Returns a function that updates the selection list based on a specific pane
         * Also clears the timeout to stop the deselect from running
         *
         * @param pane the pane that is to have it's selections loaded
         */
        SearchPanesST.prototype._update = function (pane) {
            var _this = this;
            if (pane === void 0) { pane = undefined; }
            return function () {
                if (pane) {
                    clearTimeout(pane.s.deselectTimeout);
                }
                _this._updateSelectionList(pane);
            };
        };
        /**
         * Returns a function that updates the selection list based on a specific pane
         * Also sets a timeout incase a select is about to be made
         *
         * @param pane the pane that is to have it's selections loaded
         */
        SearchPanesST.prototype._updateTimeout = function (pane) {
            var _this = this;
            if (pane === void 0) { pane = undefined; }
            return function () { return pane ?
                pane.s.deselectTimeout = setTimeout(function () { return _this._updateSelectionList(pane); }, 50) :
                _this._updateSelectionList(); };
        };
        /**
         * Updates the selection list to include the latest selections for a given pane
         *
         * @param index The index of the pane that is to be updated
         * @param selected Which rows are selected within the pane
         */
        SearchPanesST.prototype._updateSelectionList = function (paneIn) {
            if (paneIn === void 0) { paneIn = undefined; }
            // Bail if any of these flags are set
            if (this.s.pagingST) {
                // Reset pagingST flag
                this.s.pagingST = false;
                return;
            }
            else if (this.s.updating || paneIn && paneIn.s.serverSelecting) {
                return;
            }
            if (paneIn !== undefined) {
                if (this.s.dt.page.info().serverSide) {
                    paneIn._updateSelection();
                }
                // Get filter values for all of the rows and the selections
                var rows = paneIn.s.dtPane.rows({ selected: true }).data().toArray().map(function (el) { return el.filter; });
                this.s.selectionList = this.s.selectionList.filter(function (selection) { return selection.column !== paneIn.s.index; });
                if (rows.length > 0) {
                    this.s.selectionList.push({
                        column: paneIn.s.index,
                        rows: rows
                    });
                    paneIn.dom.clear.removeClass(this.classes.disabledButton).removeAttr('disabled');
                }
                else {
                    paneIn.dom.clear.addClass(this.classes.disabledButton).attr('disabled', 'true');
                }
                if (this.s.dt.page.info().serverSide) {
                    this.s.dt.draw(false);
                }
            }
            this._remakeSelections();
            this._updateFilterCount();
        };
        /**
         * Remake the selections that were present before new data or calculations have occured
         */
        SearchPanesST.prototype._remakeSelections = function () {
            this.s.updating = true;
            if (!this.s.dt.page.info().serverSide) {
                var tmpSL = this.s.selectionList;
                var anotherFilter = false;
                this.clearSelections();
                this.s.dt.draw();
                // When there are no selections present if the length of the data does not match the searched data
                // then another filter is present
                if (this.s.dt.rows().toArray()[0].length > this.s.dt.rows({ search: 'applied' }).toArray()[0].length) {
                    anotherFilter = true;
                }
                this.s.selectionList = tmpSL;
                // Update the rows in each pane
                for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                    var pane = _a[_i];
                    if (pane.s.displayed) {
                        pane.s.filteringActive = anotherFilter;
                        pane.updateRows();
                    }
                }
                for (var _b = 0, _c = this.s.selectionList; _b < _c.length; _b++) {
                    var selection = _c[_b];
                    var pane = void 0;
                    for (var _d = 0, _e = this.s.panes; _d < _e.length; _d++) {
                        var paneCheck = _e[_d];
                        if (paneCheck.s.index === selection.column) {
                            pane = paneCheck;
                            break;
                        }
                    }
                    if (!pane.s.dtPane) {
                        continue;
                    }
                    var ids = pane.s.dtPane.rows().indexes().toArray();
                    // Select the rows that are present in the selection list
                    for (var i = 0; i < selection.rows.length; i++) {
                        var rowFound = false;
                        for (var _f = 0, ids_1 = ids; _f < ids_1.length; _f++) {
                            var id = ids_1[_f];
                            var currRow = pane.s.dtPane.row(id);
                            var data = currRow.data();
                            if (selection.rows[i] === data.filter) {
                                currRow.select();
                                rowFound = true;
                            }
                        }
                        if (!rowFound) {
                            selection.rows.splice(i, 1);
                            i--;
                        }
                    }
                    pane.s.selections = selection.rows;
                    // If there are no rows selected then don't bother continuing past here
                    // Will just increase processing time and skew the rows that are shown in the table
                    if (selection.rows.length === 0) {
                        continue;
                    }
                    // Update the table to display the current results
                    this.s.dt.draw();
                    var filteringActive = false;
                    var filterCount = 0;
                    var prevSelectedPanes = 0;
                    var selectedPanes = 0;
                    // Add the number of all of the filters throughout the panes
                    for (var _g = 0, _h = this.s.panes; _g < _h.length; _g++) {
                        var currPane = _h[_g];
                        if (currPane.s.dtPane) {
                            filterCount += currPane.getPaneCount();
                            if (filterCount > prevSelectedPanes) {
                                selectedPanes++;
                                prevSelectedPanes = filterCount;
                            }
                        }
                    }
                    filteringActive = filterCount > 0;
                    for (var _j = 0, _k = this.s.panes; _j < _k.length; _j++) {
                        var currPane = _k[_j];
                        if (currPane.s.displayed) {
                            // Set the filtering active flag
                            if (anotherFilter || pane.s.index !== currPane.s.index || !filteringActive) {
                                currPane.s.filteringActive = filteringActive || anotherFilter;
                            }
                            else if (selectedPanes === 1) {
                                currPane.s.filteringActive = false;
                            }
                            // Update the rows to show correct counts
                            if (currPane.s.index !== pane.s.index) {
                                currPane.updateRows();
                            }
                        }
                    }
                }
                // Update table to show final search results
                this.s.dt.draw();
            }
            else {
                // Identify the last pane to have a change in selection
                var pane = void 0;
                if (this.s.selectionList.length > 0) {
                    pane = this.s.panes[this.s.selectionList[this.s.selectionList.length - 1].column];
                }
                // Update the rows of all of the other panes
                for (var _l = 0, _m = this.s.panes; _l < _m.length; _l++) {
                    var currPane = _m[_l];
                    if (currPane.s.displayed && (!pane || currPane.s.index !== pane.s.index)) {
                        currPane.updateRows();
                    }
                }
            }
            this.s.updating = false;
        };
        return SearchPanesST;
    }(SearchPanes));

    /*! SearchPanes 2.0.2
     * 2019-2022 SpryMedia Ltd - datatables.net/license
     */
    // DataTables extensions common UMD. Note that this allows for AMD, CommonJS
    // (with window and jQuery being allowed as parameters to the returned
    // function) or just default browser loading.
    (function (factory) {
        if (typeof define === 'function' && define.amd) {
            // AMD
            define(['jquery', 'datatables.net'], function ($) {
                return factory($, window, document);
            });
        }
        else if (typeof exports === 'object') {
            // CommonJS
            module.exports = function (root, $) {
                if (!root) {
                    root = window;
                }
                if (!$ || !$.fn.dataTable) {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    $ = require('datatables.net')(root, $).$;
                }
                return factory($, root, root.document);
            };
        }
        else {
            // Browser - assume jQuery has already been loaded
            // eslint-disable-next-line no-extra-parens
            factory(window.jQuery, window, document);
        }
    }(function ($, window, document) {
        setJQuery$4($);
        setJQuery($);
        setJQuery$3($);
        setJQuery$2($);
        setJQuery$1($);
        var dataTable = $.fn.dataTable;
        // eslint-disable-next-line no-extra-parens
        $.fn.dataTable.SearchPanes = SearchPanes;
        // eslint-disable-next-line no-extra-parens
        $.fn.DataTable.SearchPanes = SearchPanes;
        // eslint-disable-next-line no-extra-parens
        $.fn.dataTable.SearchPanesST = SearchPanesST;
        // eslint-disable-next-line no-extra-parens
        $.fn.DataTable.SearchPanesST = SearchPanesST;
        // eslint-disable-next-line no-extra-parens
        $.fn.dataTable.SearchPane = SearchPane;
        // eslint-disable-next-line no-extra-parens
        $.fn.DataTable.SearchPane = SearchPane;
        // eslint-disable-next-line no-extra-parens
        $.fn.dataTable.SearchPaneViewTotal = SearchPaneViewTotal;
        // eslint-disable-next-line no-extra-parens
        $.fn.DataTable.SearchPaneViewTotal = SearchPaneViewTotal;
        // eslint-disable-next-line no-extra-parens
        $.fn.dataTable.SearchPaneCascade = SearchPaneCascade;
        // eslint-disable-next-line no-extra-parens
        $.fn.DataTable.SearchPaneCascade = SearchPaneCascade;
        // eslint-disable-next-line no-extra-parens
        $.fn.dataTable.SearchPaneCascadeViewTotal = SearchPaneCascadeViewTotal;
        // eslint-disable-next-line no-extra-parens
        $.fn.DataTable.SearchPaneCascadeViewTotal = SearchPaneCascadeViewTotal;
        // eslint-disable-next-line no-extra-parens
        var apiRegister = $.fn.dataTable.Api.register;
        apiRegister('searchPanes()', function () {
            return this;
        });
        apiRegister('searchPanes.clearSelections()', function () {
            return this.iterator('table', function (ctx) {
                if (ctx._searchPanes) {
                    ctx._searchPanes.clearSelections();
                }
            });
        });
        apiRegister('searchPanes.rebuildPane()', function (targetIdx, maintainSelections) {
            return this.iterator('table', function (ctx) {
                if (ctx._searchPanes) {
                    ctx._searchPanes.rebuild(targetIdx, maintainSelections);
                }
            });
        });
        apiRegister('searchPanes.resizePanes()', function () {
            var ctx = this.context[0];
            return ctx._searchPanes ?
                ctx._searchPanes.resizePanes() :
                null;
        });
        apiRegister('searchPanes.container()', function () {
            var ctx = this.context[0];
            return ctx._searchPanes
                ? ctx._searchPanes.getNode()
                : null;
        });
        $.fn.dataTable.ext.buttons.searchPanesClear = {
            action: function (e, dt) {
                dt.searchPanes.clearSelections();
            },
            text: 'Clear Panes'
        };
        $.fn.dataTable.ext.buttons.searchPanes = {
            action: function (e, dt, node, config) {
                this.popover(config._panes.getNode(), {
                    align: 'container',
                    span: 'container'
                });
                config._panes.rebuild(undefined, true);
            },
            config: {},
            init: function (dt, node, config) {
                var buttonOpts = $.extend({
                    filterChanged: function (count) {
                        dt.button(node).text(dt.i18n('searchPanes.collapse', dt.context[0].oLanguage.searchPanes !== undefined ?
                            dt.context[0].oLanguage.searchPanes.collapse :
                            dt.context[0]._searchPanes.c.i18n.collapse, count));
                    }
                }, config.config);
                var panes = buttonOpts && (buttonOpts.cascadePanes || buttonOpts.viewTotal) ?
                    new $.fn.dataTable.SearchPanesST(dt, buttonOpts) :
                    new $.fn.dataTable.SearchPanes(dt, buttonOpts);
                dt.button(node).text(config.text || dt.i18n('searchPanes.collapse', panes.c.i18n.collapse, 0));
                config._panes = panes;
            },
            text: null
        };
        function _init(settings, options, fromPre) {
            if (options === void 0) { options = null; }
            if (fromPre === void 0) { fromPre = false; }
            var api = new dataTable.Api(settings);
            var opts = options
                ? options
                : api.init().searchPanes || dataTable.defaults.searchPanes;
            var searchPanes = opts && (opts.cascadePanes || opts.viewTotal) ?
                new SearchPanesST(api, opts, fromPre) :
                new SearchPanes(api, opts, fromPre);
            var node = searchPanes.getNode();
            return node;
        }
        // Attach a listener to the document which listens for DataTables initialisation
        // events so we can automatically initialise
        $(document).on('preInit.dt.dtsp', function (e, settings) {
            if (e.namespace !== 'dt') {
                return;
            }
            if (settings.oInit.searchPanes ||
                dataTable.defaults.searchPanes) {
                if (!settings._searchPanes) {
                    _init(settings, null, true);
                }
            }
        });
        // DataTables `dom` feature option
        dataTable.ext.feature.push({
            cFeature: 'P',
            fnInit: _init
        });
        // DataTables 2 layout feature
        if (dataTable.ext.features) {
            dataTable.ext.features.register('searchPanes', _init);
        }
    }));

})();


/*! Bootstrap integration for DataTables' SearchPanes
 * ©2016 SpryMedia Ltd - datatables.net/license
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery', 'datatables.net-bs4', 'datatables.net-searchpanes'], function ($) {
            return factory($);
        });
    }
    else if (typeof exports === 'object') {
        // CommonJS
        module.exports = function (root, $) {
            if (!root) {
                root = window;
            }
            if (!$ || !$.fn.dataTable) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                $ = require('datatables.net-bs4')(root, $).$;
            }
            if (!$.fn.dataTable.SearchPanes) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                require('datatables.net-searchpanes')(root, $);
            }
            return factory($);
        };
    }
    else {
        // Browser
        factory(jQuery);
    }
}(function ($) {
    'use strict';
    var dataTable = $.fn.dataTable;
    $.extend(true, dataTable.SearchPane.classes, {
        buttonGroup: 'btn-group',
        disabledButton: 'disabled',
        narrow: 'col',
        pane: {
            container: 'table'
        },
        paneButton: 'btn btn-light',
        pill: 'pill badge badge-pill badge-secondary',
        search: 'form-control search',
        searchCont: 'input-group',
        searchLabelCont: 'input-group-append',
        subRow1: 'dtsp-subRow1',
        subRow2: 'dtsp-subRow2',
        table: 'table table-sm table-borderless',
        topRow: 'dtsp-topRow'
    });
    $.extend(true, dataTable.SearchPanes.classes, {
        clearAll: 'dtsp-clearAll btn btn-light',
        collapseAll: 'dtsp-collapseAll btn btn-light',
        container: 'dtsp-searchPanes',
        disabledButton: 'disabled',
        panes: 'dtsp-panes dtsp-panesContainer',
        showAll: 'dtsp-showAll btn btn-light',
        title: 'dtsp-title',
        titleRow: 'dtsp-titleRow'
    });
    return dataTable.searchPanes;
}));


/*! Select for DataTables 1.4.0
 * 2015-2021 SpryMedia Ltd - datatables.net/license/mit
 */

/**
 * @summary     Select for DataTables
 * @description A collection of API methods, events and buttons for DataTables
 *   that provides selection options of the items in a DataTable
 * @version     1.4.0
 * @file        dataTables.select.js
 * @author      SpryMedia Ltd (www.sprymedia.co.uk)
 * @contact     datatables.net/forums
 * @copyright   Copyright 2015-2021 SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   MIT license - http://datatables.net/license/mit
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: http://www.datatables.net/extensions/select
 */
(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


// Version information for debugger
DataTable.select = {};

DataTable.select.version = '1.4.0';

DataTable.select.init = function ( dt ) {
	var ctx = dt.settings()[0];

	if (ctx._select) {
		return;
	}

	var savedSelected = dt.state.loaded();

	var selectAndSave = function(e, settings, data) {
		if(data === null || data.select === undefined) {
			return;
		}

		// Clear any currently selected rows, before restoring state
		// None will be selected on first initialisation
		if (dt.rows({selected: true}).any()) {
			dt.rows().deselect();
		}
		if (data.select.rows !== undefined) {
			dt.rows(data.select.rows).select();
		}

		if (dt.columns({selected: true}).any()) {
			dt.columns().deselect();
		}
		if (data.select.columns !== undefined) {
			dt.columns(data.select.columns).select();
		}

		if (dt.cells({selected: true}).any()) {
			dt.cells().deselect();
		}
		if (data.select.cells !== undefined) {
			for(var i = 0; i < data.select.cells.length; i++) {
				dt.cell(data.select.cells[i].row, data.select.cells[i].column).select();
			}
		}
		dt.state.save();
	}
	
	dt.one('init', function() {
		dt.on('stateSaveParams', function(e, settings, data) {
			data.select = {};
			data.select.rows = dt.rows({selected:true}).ids(true).toArray();
			data.select.columns = dt.columns({selected:true})[0];
			data.select.cells = dt.cells({selected:true})[0].map(function(coords) {
				return {row: dt.row(coords.row).id(true), column: coords.column}
			});
		})
		
		selectAndSave(undefined, undefined, savedSelected)
		dt.on('stateLoaded stateLoadParams', selectAndSave)
	})

	var init = ctx.oInit.select;
	var defaults = DataTable.defaults.select;
	var opts = init === undefined ?
		defaults :
		init;

	// Set defaults
	var items = 'row';
	var style = 'api';
	var blurable = false;
	var toggleable = true;
	var info = true;
	var selector = 'td, th';
	var className = 'selected';
	var setStyle = false;

	ctx._select = {};

	// Initialisation customisations
	if ( opts === true ) {
		style = 'os';
		setStyle = true;
	}
	else if ( typeof opts === 'string' ) {
		style = opts;
		setStyle = true;
	}
	else if ( $.isPlainObject( opts ) ) {
		if ( opts.blurable !== undefined ) {
			blurable = opts.blurable;
		}
		
		if ( opts.toggleable !== undefined ) {
			toggleable = opts.toggleable;
		}

		if ( opts.info !== undefined ) {
			info = opts.info;
		}

		if ( opts.items !== undefined ) {
			items = opts.items;
		}

		if ( opts.style !== undefined ) {
			style = opts.style;
			setStyle = true;
		}
		else {
			style = 'os';
			setStyle = true;
		}

		if ( opts.selector !== undefined ) {
			selector = opts.selector;
		}

		if ( opts.className !== undefined ) {
			className = opts.className;
		}
	}

	dt.select.selector( selector );
	dt.select.items( items );
	dt.select.style( style );
	dt.select.blurable( blurable );
	dt.select.toggleable( toggleable );
	dt.select.info( info );
	ctx._select.className = className;


	// Sort table based on selected rows. Requires Select Datatables extension
	$.fn.dataTable.ext.order['select-checkbox'] = function ( settings, col ) {
		return this.api().column( col, {order: 'index'} ).nodes().map( function ( td ) {
			if ( settings._select.items === 'row' ) {
				return $( td ).parent().hasClass( settings._select.className );
			} else if ( settings._select.items === 'cell' ) {
				return $( td ).hasClass( settings._select.className );
			}
			return false;
		});
	};

	// If the init options haven't enabled select, but there is a selectable
	// class name, then enable
	if ( ! setStyle && $( dt.table().node() ).hasClass( 'selectable' ) ) {
		dt.select.style( 'os' );
	}
};

/*

Select is a collection of API methods, event handlers, event emitters and
buttons (for the `Buttons` extension) for DataTables. It provides the following
features, with an overview of how they are implemented:

## Selection of rows, columns and cells. Whether an item is selected or not is
   stored in:

* rows: a `_select_selected` property which contains a boolean value of the
  DataTables' `aoData` object for each row
* columns: a `_select_selected` property which contains a boolean value of the
  DataTables' `aoColumns` object for each column
* cells: a `_selected_cells` property which contains an array of boolean values
  of the `aoData` object for each row. The array is the same length as the
  columns array, with each element of it representing a cell.

This method of using boolean flags allows Select to operate when nodes have not
been created for rows / cells (DataTables' defer rendering feature).

## API methods

A range of API methods are available for triggering selection and de-selection
of rows. Methods are also available to configure the selection events that can
be triggered by an end user (such as which items are to be selected). To a large
extent, these of API methods *is* Select. It is basically a collection of helper
functions that can be used to select items in a DataTable.

Configuration of select is held in the object `_select` which is attached to the
DataTables settings object on initialisation. Select being available on a table
is not optional when Select is loaded, but its default is for selection only to
be available via the API - so the end user wouldn't be able to select rows
without additional configuration.

The `_select` object contains the following properties:

```
{
	items:string       - Can be `rows`, `columns` or `cells`. Defines what item 
	                     will be selected if the user is allowed to activate row
	                     selection using the mouse.
	style:string       - Can be `none`, `single`, `multi` or `os`. Defines the
	                     interaction style when selecting items
	blurable:boolean   - If row selection can be cleared by clicking outside of
	                     the table
	toggleable:boolean - If row selection can be cancelled by repeated clicking
	                     on the row
	info:boolean       - If the selection summary should be shown in the table
	                     information elements
}
```

In addition to the API methods, Select also extends the DataTables selector
options for rows, columns and cells adding a `selected` option to the selector
options object, allowing the developer to select only selected items or
unselected items.

## Mouse selection of items

Clicking on items can be used to select items. This is done by a simple event
handler that will select the items using the API methods.

 */


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Local functions
 */

/**
 * Add one or more cells to the selection when shift clicking in OS selection
 * style cell selection.
 *
 * Cell range is more complicated than row and column as we want to select
 * in the visible grid rather than by index in sequence. For example, if you
 * click first in cell 1-1 and then shift click in 2-2 - cells 1-2 and 2-1
 * should also be selected (and not 1-3, 1-4. etc)
 * 
 * @param  {DataTable.Api} dt   DataTable
 * @param  {object}        idx  Cell index to select to
 * @param  {object}        last Cell index to select from
 * @private
 */
function cellRange( dt, idx, last )
{
	var indexes;
	var columnIndexes;
	var rowIndexes;
	var selectColumns = function ( start, end ) {
		if ( start > end ) {
			var tmp = end;
			end = start;
			start = tmp;
		}
		
		var record = false;
		return dt.columns( ':visible' ).indexes().filter( function (i) {
			if ( i === start ) {
				record = true;
			}
			
			if ( i === end ) { // not else if, as start might === end
				record = false;
				return true;
			}

			return record;
		} );
	};

	var selectRows = function ( start, end ) {
		var indexes = dt.rows( { search: 'applied' } ).indexes();

		// Which comes first - might need to swap
		if ( indexes.indexOf( start ) > indexes.indexOf( end ) ) {
			var tmp = end;
			end = start;
			start = tmp;
		}

		var record = false;
		return indexes.filter( function (i) {
			if ( i === start ) {
				record = true;
			}
			
			if ( i === end ) {
				record = false;
				return true;
			}

			return record;
		} );
	};

	if ( ! dt.cells( { selected: true } ).any() && ! last ) {
		// select from the top left cell to this one
		columnIndexes = selectColumns( 0, idx.column );
		rowIndexes = selectRows( 0 , idx.row );
	}
	else {
		// Get column indexes between old and new
		columnIndexes = selectColumns( last.column, idx.column );
		rowIndexes = selectRows( last.row , idx.row );
	}

	indexes = dt.cells( rowIndexes, columnIndexes ).flatten();

	if ( ! dt.cells( idx, { selected: true } ).any() ) {
		// Select range
		dt.cells( indexes ).select();
	}
	else {
		// Deselect range
		dt.cells( indexes ).deselect();
	}
}

/**
 * Disable mouse selection by removing the selectors
 *
 * @param {DataTable.Api} dt DataTable to remove events from
 * @private
 */
function disableMouseSelection( dt )
{
	var ctx = dt.settings()[0];
	var selector = ctx._select.selector;

	$( dt.table().container() )
		.off( 'mousedown.dtSelect', selector )
		.off( 'mouseup.dtSelect', selector )
		.off( 'click.dtSelect', selector );

	$('body').off( 'click.dtSelect' + _safeId(dt.table().node()) );
}

/**
 * Attach mouse listeners to the table to allow mouse selection of items
 *
 * @param {DataTable.Api} dt DataTable to remove events from
 * @private
 */
function enableMouseSelection ( dt )
{
	var container = $( dt.table().container() );
	var ctx = dt.settings()[0];
	var selector = ctx._select.selector;
	var matchSelection;

	container
		.on( 'mousedown.dtSelect', selector, function(e) {
			// Disallow text selection for shift clicking on the table so multi
			// element selection doesn't look terrible!
			if ( e.shiftKey || e.metaKey || e.ctrlKey ) {
				container
					.css( '-moz-user-select', 'none' )
					.one('selectstart.dtSelect', selector, function () {
						return false;
					} );
			}

			if ( window.getSelection ) {
				matchSelection = window.getSelection();
			}
		} )
		.on( 'mouseup.dtSelect', selector, function() {
			// Allow text selection to occur again, Mozilla style (tested in FF
			// 35.0.1 - still required)
			container.css( '-moz-user-select', '' );
		} )
		.on( 'click.dtSelect', selector, function ( e ) {
			var items = dt.select.items();
			var idx;

			// If text was selected (click and drag), then we shouldn't change
			// the row's selected state
			if ( matchSelection ) {
				var selection = window.getSelection();

				// If the element that contains the selection is not in the table, we can ignore it
				// This can happen if the developer selects text from the click event
				if ( ! selection.anchorNode || $(selection.anchorNode).closest('table')[0] === dt.table().node() ) {
					if ( selection !== matchSelection ) {
						return;
					}
				}
			}

			var ctx = dt.settings()[0];
			var wrapperClass = dt.settings()[0].oClasses.sWrapper.trim().replace(/ +/g, '.');

			// Ignore clicks inside a sub-table
			if ( $(e.target).closest('div.'+wrapperClass)[0] != dt.table().container() ) {
				return;
			}

			var cell = dt.cell( $(e.target).closest('td, th') );

			// Check the cell actually belongs to the host DataTable (so child
			// rows, etc, are ignored)
			if ( ! cell.any() ) {
				return;
			}

			var event = $.Event('user-select.dt');
			eventTrigger( dt, event, [ items, cell, e ] );

			if ( event.isDefaultPrevented() ) {
				return;
			}

			var cellIndex = cell.index();
			if ( items === 'row' ) {
				idx = cellIndex.row;
				typeSelect( e, dt, ctx, 'row', idx );
			}
			else if ( items === 'column' ) {
				idx = cell.index().column;
				typeSelect( e, dt, ctx, 'column', idx );
			}
			else if ( items === 'cell' ) {
				idx = cell.index();
				typeSelect( e, dt, ctx, 'cell', idx );
			}

			ctx._select_lastCell = cellIndex;
		} );

	// Blurable
	$('body').on( 'click.dtSelect' + _safeId(dt.table().node()), function ( e ) {
		if ( ctx._select.blurable ) {
			// If the click was inside the DataTables container, don't blur
			if ( $(e.target).parents().filter( dt.table().container() ).length ) {
				return;
			}

			// Ignore elements which have been removed from the DOM (i.e. paging
			// buttons)
			if ( $(e.target).parents('html').length === 0 ) {
			 	return;
			}

			// Don't blur in Editor form
			if ( $(e.target).parents('div.DTE').length ) {
				return;
			}

			var event = $.Event('select-blur.dt');
			eventTrigger( dt, event, [ e.target, e ] );

			if ( event.isDefaultPrevented() ) {
				return;
			}

			clear( ctx, true );
		}
	} );
}

/**
 * Trigger an event on a DataTable
 *
 * @param {DataTable.Api} api      DataTable to trigger events on
 * @param  {boolean}      selected true if selected, false if deselected
 * @param  {string}       type     Item type acting on
 * @param  {boolean}      any      Require that there are values before
 *     triggering
 * @private
 */
function eventTrigger ( api, type, args, any )
{
	if ( any && ! api.flatten().length ) {
		return;
	}

	if ( typeof type === 'string' ) {
		type = type +'.dt';
	}

	args.unshift( api );

	$(api.table().node()).trigger( type, args );
}

/**
 * Update the information element of the DataTable showing information about the
 * items selected. This is done by adding tags to the existing text
 * 
 * @param {DataTable.Api} api DataTable to update
 * @private
 */
function info ( api )
{
	var ctx = api.settings()[0];

	if ( ! ctx._select.info || ! ctx.aanFeatures.i ) {
		return;
	}

	if ( api.select.style() === 'api' ) {
		return;
	}

	var rows    = api.rows( { selected: true } ).flatten().length;
	var columns = api.columns( { selected: true } ).flatten().length;
	var cells   = api.cells( { selected: true } ).flatten().length;

	var add = function ( el, name, num ) {
		el.append( $('<span class="select-item"/>').append( api.i18n(
			'select.'+name+'s',
			{ _: '%d '+name+'s selected', 0: '', 1: '1 '+name+' selected' },
			num
		) ) );
	};

	// Internal knowledge of DataTables to loop over all information elements
	$.each( ctx.aanFeatures.i, function ( i, el ) {
		el = $(el);

		var output  = $('<span class="select-info"/>');
		add( output, 'row', rows );
		add( output, 'column', columns );
		add( output, 'cell', cells  );

		var exisiting = el.children('span.select-info');
		if ( exisiting.length ) {
			exisiting.remove();
		}

		if ( output.text() !== '' ) {
			el.append( output );
		}
	} );
}

/**
 * Initialisation of a new table. Attach event handlers and callbacks to allow
 * Select to operate correctly.
 *
 * This will occur _after_ the initial DataTables initialisation, although
 * before Ajax data is rendered, if there is ajax data
 *
 * @param  {DataTable.settings} ctx Settings object to operate on
 * @private
 */
function init ( ctx ) {
	var api = new DataTable.Api( ctx );
	ctx._select_init = true;

	// Row callback so that classes can be added to rows and cells if the item
	// was selected before the element was created. This will happen with the
	// `deferRender` option enabled.
	// 
	// This method of attaching to `aoRowCreatedCallback` is a hack until
	// DataTables has proper events for row manipulation If you are reviewing
	// this code to create your own plug-ins, please do not do this!
	ctx.aoRowCreatedCallback.push( {
		fn: function ( row, data, index ) {
			var i, ien;
			var d = ctx.aoData[ index ];

			// Row
			if ( d._select_selected ) {
				$( row ).addClass( ctx._select.className );
			}

			// Cells and columns - if separated out, we would need to do two
			// loops, so it makes sense to combine them into a single one
			for ( i=0, ien=ctx.aoColumns.length ; i<ien ; i++ ) {
				if ( ctx.aoColumns[i]._select_selected || (d._selected_cells && d._selected_cells[i]) ) {
					$(d.anCells[i]).addClass( ctx._select.className );
				}
			}
		},
		sName: 'select-deferRender'
	} );

	// On Ajax reload we want to reselect all rows which are currently selected,
	// if there is an rowId (i.e. a unique value to identify each row with)
	api.on( 'preXhr.dt.dtSelect', function (e, settings) {
		if (settings !== api.settings()[0]) {
			// Not triggered by our DataTable!
			return;
		}

		// note that column selection doesn't need to be cached and then
		// reselected, as they are already selected
		var rows = api.rows( { selected: true } ).ids( true ).filter( function ( d ) {
			return d !== undefined;
		} );

		var cells = api.cells( { selected: true } ).eq(0).map( function ( cellIdx ) {
			var id = api.row( cellIdx.row ).id( true );
			return id ?
				{ row: id, column: cellIdx.column } :
				undefined;
		} ).filter( function ( d ) {
			return d !== undefined;
		} );

		// On the next draw, reselect the currently selected items
		api.one( 'draw.dt.dtSelect', function () {
			api.rows( rows ).select();

			// `cells` is not a cell index selector, so it needs a loop
			if ( cells.any() ) {
				cells.each( function ( id ) {
					api.cells( id.row, id.column ).select();
				} );
			}
		} );
	} );

	// Update the table information element with selected item summary
	api.on( 'draw.dtSelect.dt select.dtSelect.dt deselect.dtSelect.dt info.dt', function () {
		info( api );
		api.state.save();
	} );

	// Clean up and release
	api.on( 'destroy.dtSelect', function () {
		api.rows({selected: true}).deselect();

		disableMouseSelection( api );
		api.off( '.dtSelect' );
		$('body').off('.dtSelect' + _safeId(api.table().node()));
	} );
}

/**
 * Add one or more items (rows or columns) to the selection when shift clicking
 * in OS selection style
 *
 * @param  {DataTable.Api} dt   DataTable
 * @param  {string}        type Row or column range selector
 * @param  {object}        idx  Item index to select to
 * @param  {object}        last Item index to select from
 * @private
 */
function rowColumnRange( dt, type, idx, last )
{
	// Add a range of rows from the last selected row to this one
	var indexes = dt[type+'s']( { search: 'applied' } ).indexes();
	var idx1 = $.inArray( last, indexes );
	var idx2 = $.inArray( idx, indexes );

	if ( ! dt[type+'s']( { selected: true } ).any() && idx1 === -1 ) {
		// select from top to here - slightly odd, but both Windows and Mac OS
		// do this
		indexes.splice( $.inArray( idx, indexes )+1, indexes.length );
	}
	else {
		// reverse so we can shift click 'up' as well as down
		if ( idx1 > idx2 ) {
			var tmp = idx2;
			idx2 = idx1;
			idx1 = tmp;
		}

		indexes.splice( idx2+1, indexes.length );
		indexes.splice( 0, idx1 );
	}

	if ( ! dt[type]( idx, { selected: true } ).any() ) {
		// Select range
		dt[type+'s']( indexes ).select();
	}
	else {
		// Deselect range - need to keep the clicked on row selected
		indexes.splice( $.inArray( idx, indexes ), 1 );
		dt[type+'s']( indexes ).deselect();
	}
}

/**
 * Clear all selected items
 *
 * @param  {DataTable.settings} ctx Settings object of the host DataTable
 * @param  {boolean} [force=false] Force the de-selection to happen, regardless
 *     of selection style
 * @private
 */
function clear( ctx, force )
{
	if ( force || ctx._select.style === 'single' ) {
		var api = new DataTable.Api( ctx );
		
		api.rows( { selected: true } ).deselect();
		api.columns( { selected: true } ).deselect();
		api.cells( { selected: true } ).deselect();
	}
}

/**
 * Select items based on the current configuration for style and items.
 *
 * @param  {object}             e    Mouse event object
 * @param  {DataTables.Api}     dt   DataTable
 * @param  {DataTable.settings} ctx  Settings object of the host DataTable
 * @param  {string}             type Items to select
 * @param  {int|object}         idx  Index of the item to select
 * @private
 */
function typeSelect ( e, dt, ctx, type, idx )
{
	var style = dt.select.style();
	var toggleable = dt.select.toggleable();
	var isSelected = dt[type]( idx, { selected: true } ).any();
	
	if ( isSelected && ! toggleable ) {
		return;
	}

	if ( style === 'os' ) {
		if ( e.ctrlKey || e.metaKey ) {
			// Add or remove from the selection
			dt[type]( idx ).select( ! isSelected );
		}
		else if ( e.shiftKey ) {
			if ( type === 'cell' ) {
				cellRange( dt, idx, ctx._select_lastCell || null );
			}
			else {
				rowColumnRange( dt, type, idx, ctx._select_lastCell ?
					ctx._select_lastCell[type] :
					null
				);
			}
		}
		else {
			// No cmd or shift click - deselect if selected, or select
			// this row only
			var selected = dt[type+'s']( { selected: true } );

			if ( isSelected && selected.flatten().length === 1 ) {
				dt[type]( idx ).deselect();
			}
			else {
				selected.deselect();
				dt[type]( idx ).select();
			}
		}
	} else if ( style == 'multi+shift' ) {
		if ( e.shiftKey ) {
			if ( type === 'cell' ) {
				cellRange( dt, idx, ctx._select_lastCell || null );
			}
			else {
				rowColumnRange( dt, type, idx, ctx._select_lastCell ?
					ctx._select_lastCell[type] :
					null
				);
			}
		}
		else {
			dt[ type ]( idx ).select( ! isSelected );
		}
	}
	else {
		dt[ type ]( idx ).select( ! isSelected );
	}
}

function _safeId( node ) {
	return node.id.replace(/[^a-zA-Z0-9\-\_]/g, '-');
}



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables selectors
 */

// row and column are basically identical just assigned to different properties
// and checking a different array, so we can dynamically create the functions to
// reduce the code size
$.each( [
	{ type: 'row', prop: 'aoData' },
	{ type: 'column', prop: 'aoColumns' }
], function ( i, o ) {
	DataTable.ext.selector[ o.type ].push( function ( settings, opts, indexes ) {
		var selected = opts.selected;
		var data;
		var out = [];

		if ( selected !== true && selected !== false ) {
			return indexes;
		}

		for ( var i=0, ien=indexes.length ; i<ien ; i++ ) {
			data = settings[ o.prop ][ indexes[i] ];

			if ( (selected === true && data._select_selected === true) ||
			     (selected === false && ! data._select_selected )
			) {
				out.push( indexes[i] );
			}
		}

		return out;
	} );
} );

DataTable.ext.selector.cell.push( function ( settings, opts, cells ) {
	var selected = opts.selected;
	var rowData;
	var out = [];

	if ( selected === undefined ) {
		return cells;
	}

	for ( var i=0, ien=cells.length ; i<ien ; i++ ) {
		rowData = settings.aoData[ cells[i].row ];

		if ( (selected === true && rowData._selected_cells && rowData._selected_cells[ cells[i].column ] === true) ||
		     (selected === false && ( ! rowData._selected_cells || ! rowData._selected_cells[ cells[i].column ] ) )
		) {
			out.push( cells[i] );
		}
	}

	return out;
} );



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables API
 *
 * For complete documentation, please refer to the docs/api directory or the
 * DataTables site
 */

// Local variables to improve compression
var apiRegister = DataTable.Api.register;
var apiRegisterPlural = DataTable.Api.registerPlural;

apiRegister( 'select()', function () {
	return this.iterator( 'table', function ( ctx ) {
		DataTable.select.init( new DataTable.Api( ctx ) );
	} );
} );

apiRegister( 'select.blurable()', function ( flag ) {
	if ( flag === undefined ) {
		return this.context[0]._select.blurable;
	}

	return this.iterator( 'table', function ( ctx ) {
		ctx._select.blurable = flag;
	} );
} );

apiRegister( 'select.toggleable()', function ( flag ) {
	if ( flag === undefined ) {
		return this.context[0]._select.toggleable;
	}

	return this.iterator( 'table', function ( ctx ) {
		ctx._select.toggleable = flag;
	} );
} );

apiRegister( 'select.info()', function ( flag ) {
	if ( flag === undefined ) {
		return this.context[0]._select.info;
	}

	return this.iterator( 'table', function ( ctx ) {
		ctx._select.info = flag;
	} );
} );

apiRegister( 'select.items()', function ( items ) {
	if ( items === undefined ) {
		return this.context[0]._select.items;
	}

	return this.iterator( 'table', function ( ctx ) {
		ctx._select.items = items;

		eventTrigger( new DataTable.Api( ctx ), 'selectItems', [ items ] );
	} );
} );

// Takes effect from the _next_ selection. None disables future selection, but
// does not clear the current selection. Use the `deselect` methods for that
apiRegister( 'select.style()', function ( style ) {
	if ( style === undefined ) {
		return this.context[0]._select.style;
	}

	return this.iterator( 'table', function ( ctx ) {
		if ( ! ctx._select ) {
			DataTable.select.init( new DataTable.Api(ctx) );
		}

		if ( ! ctx._select_init ) {
			init(ctx);
		}

		ctx._select.style = style;

		// Add / remove mouse event handlers. They aren't required when only
		// API selection is available
		var dt = new DataTable.Api( ctx );
		disableMouseSelection( dt );
		
		if ( style !== 'api' ) {
			enableMouseSelection( dt );
		}

		eventTrigger( new DataTable.Api( ctx ), 'selectStyle', [ style ] );
	} );
} );

apiRegister( 'select.selector()', function ( selector ) {
	if ( selector === undefined ) {
		return this.context[0]._select.selector;
	}

	return this.iterator( 'table', function ( ctx ) {
		disableMouseSelection( new DataTable.Api( ctx ) );

		ctx._select.selector = selector;

		if ( ctx._select.style !== 'api' ) {
			enableMouseSelection( new DataTable.Api( ctx ) );
		}
	} );
} );



apiRegisterPlural( 'rows().select()', 'row().select()', function ( select ) {
	var api = this;

	if ( select === false ) {
		return this.deselect();
	}

	this.iterator( 'row', function ( ctx, idx ) {
		clear( ctx );

		ctx.aoData[ idx ]._select_selected = true;
		$( ctx.aoData[ idx ].nTr ).addClass( ctx._select.className );
	} );

	this.iterator( 'table', function ( ctx, i ) {
		eventTrigger( api, 'select', [ 'row', api[i] ], true );
	} );

	return this;
} );

apiRegister( 'row().selected()', function () {
	var ctx = this.context[0];

	if (
		ctx &&
		this.length &&
		ctx.aoData[this[0]] &&
		ctx.aoData[this[0]]._select_selected
	) {
		return true;
	}

	return false;
} );

apiRegisterPlural( 'columns().select()', 'column().select()', function ( select ) {
	var api = this;

	if ( select === false ) {
		return this.deselect();
	}

	this.iterator( 'column', function ( ctx, idx ) {
		clear( ctx );

		ctx.aoColumns[ idx ]._select_selected = true;

		var column = new DataTable.Api( ctx ).column( idx );

		$( column.header() ).addClass( ctx._select.className );
		$( column.footer() ).addClass( ctx._select.className );

		column.nodes().to$().addClass( ctx._select.className );
	} );

	this.iterator( 'table', function ( ctx, i ) {
		eventTrigger( api, 'select', [ 'column', api[i] ], true );
	} );

	return this;
} );

apiRegister( 'column().selected()', function () {
	var ctx = this.context[0];

	if (
		ctx &&
		this.length &&
		ctx.aoColumns[this[0]] &&
		ctx.aoColumns[this[0]]._select_selected
	) {
		return true;
	}

	return false;
} );

apiRegisterPlural( 'cells().select()', 'cell().select()', function ( select ) {
	var api = this;

	if ( select === false ) {
		return this.deselect();
	}

	this.iterator( 'cell', function ( ctx, rowIdx, colIdx ) {
		clear( ctx );

		var data = ctx.aoData[ rowIdx ];

		if ( data._selected_cells === undefined ) {
			data._selected_cells = [];
		}

		data._selected_cells[ colIdx ] = true;

		if ( data.anCells ) {
			$( data.anCells[ colIdx ] ).addClass( ctx._select.className );
		}
	} );

	this.iterator( 'table', function ( ctx, i ) {
		eventTrigger( api, 'select', [ 'cell', api.cells(api[i]).indexes().toArray() ], true );
	} );

	return this;
} );

apiRegister( 'cell().selected()', function () {
	var ctx = this.context[0];

	if (ctx && this.length) {
		var row = ctx.aoData[this[0][0].row];

		if (row && row._selected_cells && row._selected_cells[this[0][0].column]) {
			return true;
		}
	}

	return false;
} );


apiRegisterPlural( 'rows().deselect()', 'row().deselect()', function () {
	var api = this;

	this.iterator( 'row', function ( ctx, idx ) {
		ctx.aoData[ idx ]._select_selected = false;
		ctx._select_lastCell = null;
		$( ctx.aoData[ idx ].nTr ).removeClass( ctx._select.className );
	} );

	this.iterator( 'table', function ( ctx, i ) {
		eventTrigger( api, 'deselect', [ 'row', api[i] ], true );
	} );

	return this;
} );

apiRegisterPlural( 'columns().deselect()', 'column().deselect()', function () {
	var api = this;

	this.iterator( 'column', function ( ctx, idx ) {
		ctx.aoColumns[ idx ]._select_selected = false;

		var api = new DataTable.Api( ctx );
		var column = api.column( idx );

		$( column.header() ).removeClass( ctx._select.className );
		$( column.footer() ).removeClass( ctx._select.className );

		// Need to loop over each cell, rather than just using
		// `column().nodes()` as cells which are individually selected should
		// not have the `selected` class removed from them
		api.cells( null, idx ).indexes().each( function (cellIdx) {
			var data = ctx.aoData[ cellIdx.row ];
			var cellSelected = data._selected_cells;

			if ( data.anCells && (! cellSelected || ! cellSelected[ cellIdx.column ]) ) {
				$( data.anCells[ cellIdx.column  ] ).removeClass( ctx._select.className );
			}
		} );
	} );

	this.iterator( 'table', function ( ctx, i ) {
		eventTrigger( api, 'deselect', [ 'column', api[i] ], true );
	} );

	return this;
} );

apiRegisterPlural( 'cells().deselect()', 'cell().deselect()', function () {
	var api = this;

	this.iterator( 'cell', function ( ctx, rowIdx, colIdx ) {
		var data = ctx.aoData[ rowIdx ];

		if(data._selected_cells !== undefined) {
			data._selected_cells[ colIdx ] = false;
		}

		// Remove class only if the cells exist, and the cell is not column
		// selected, in which case the class should remain (since it is selected
		// in the column)
		if ( data.anCells && ! ctx.aoColumns[ colIdx ]._select_selected ) {
			$( data.anCells[ colIdx ] ).removeClass( ctx._select.className );
		}
	} );

	this.iterator( 'table', function ( ctx, i ) {
		eventTrigger( api, 'deselect', [ 'cell', api[i] ], true );
	} );

	return this;
} );



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Buttons
 */
function i18n( label, def ) {
	return function (dt) {
		return dt.i18n( 'buttons.'+label, def );
	};
}

// Common events with suitable namespaces
function namespacedEvents ( config ) {
	var unique = config._eventNamespace;

	return 'draw.dt.DT'+unique+' select.dt.DT'+unique+' deselect.dt.DT'+unique;
}

function enabled ( dt, config ) {
	if ( $.inArray( 'rows', config.limitTo ) !== -1 && dt.rows( { selected: true } ).any() ) {
		return true;
	}

	if ( $.inArray( 'columns', config.limitTo ) !== -1 && dt.columns( { selected: true } ).any() ) {
		return true;
	}

	if ( $.inArray( 'cells', config.limitTo ) !== -1 && dt.cells( { selected: true } ).any() ) {
		return true;
	}

	return false;
}

var _buttonNamespace = 0;

$.extend( DataTable.ext.buttons, {
	selected: {
		text: i18n( 'selected', 'Selected' ),
		className: 'buttons-selected',
		limitTo: [ 'rows', 'columns', 'cells' ],
		init: function ( dt, node, config ) {
			var that = this;
			config._eventNamespace = '.select'+(_buttonNamespace++);

			// .DT namespace listeners are removed by DataTables automatically
			// on table destroy
			dt.on( namespacedEvents(config), function () {
				that.enable( enabled(dt, config) );
			} );

			this.disable();
		},
		destroy: function ( dt, node, config ) {
			dt.off( config._eventNamespace );
		}
	},
	selectedSingle: {
		text: i18n( 'selectedSingle', 'Selected single' ),
		className: 'buttons-selected-single',
		init: function ( dt, node, config ) {
			var that = this;
			config._eventNamespace = '.select'+(_buttonNamespace++);

			dt.on( namespacedEvents(config), function () {
				var count = dt.rows( { selected: true } ).flatten().length +
				            dt.columns( { selected: true } ).flatten().length +
				            dt.cells( { selected: true } ).flatten().length;

				that.enable( count === 1 );
			} );

			this.disable();
		},
		destroy: function ( dt, node, config ) {
			dt.off( config._eventNamespace );
		}
	},
	selectAll: {
		text: i18n( 'selectAll', 'Select all' ),
		className: 'buttons-select-all',
		action: function () {
			var items = this.select.items();
			this[ items+'s' ]().select();
		}
	},
	selectNone: {
		text: i18n( 'selectNone', 'Deselect all' ),
		className: 'buttons-select-none',
		action: function () {
			clear( this.settings()[0], true );
		},
		init: function ( dt, node, config ) {
			var that = this;
			config._eventNamespace = '.select'+(_buttonNamespace++);

			dt.on( namespacedEvents(config), function () {
				var count = dt.rows( { selected: true } ).flatten().length +
				            dt.columns( { selected: true } ).flatten().length +
				            dt.cells( { selected: true } ).flatten().length;

				that.enable( count > 0 );
			} );

			this.disable();
		},
		destroy: function ( dt, node, config ) {
			dt.off( config._eventNamespace );
		}
	}
} );

$.each( [ 'Row', 'Column', 'Cell' ], function ( i, item ) {
	var lc = item.toLowerCase();

	DataTable.ext.buttons[ 'select'+item+'s' ] = {
		text: i18n( 'select'+item+'s', 'Select '+lc+'s' ),
		className: 'buttons-select-'+lc+'s',
		action: function () {
			this.select.items( lc );
		},
		init: function ( dt ) {
			var that = this;

			dt.on( 'selectItems.dt.DT', function ( e, ctx, items ) {
				that.active( items === lc );
			} );
		}
	};
} );



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Initialisation
 */

// DataTables creation - check if select has been defined in the options. Note
// this required that the table be in the document! If it isn't then something
// needs to trigger this method unfortunately. The next major release of
// DataTables will rework the events and address this.
$(document).on( 'preInit.dt.dtSelect', function (e, ctx) {
	if ( e.namespace !== 'dt' ) {
		return;
	}

	DataTable.select.init( new DataTable.Api( ctx ) );
} );


return DataTable.select;
}));


/*! StateRestore 1.1.1
 * 2019-2022 SpryMedia Ltd - datatables.net/license
 */
(function () {
    'use strict';

    var $$1;
    var dataTable$1;
    function setJQuery$1(jq) {
        $$1 = jq;
        dataTable$1 = jq.fn.dataTable;
    }
    var StateRestore = /** @class */ (function () {
        function StateRestore(settings, opts, identifier, state, isPreDefined, successCallback) {
            if (state === void 0) { state = undefined; }
            if (isPreDefined === void 0) { isPreDefined = false; }
            if (successCallback === void 0) { successCallback = function () { return null; }; }
            // Check that the required version of DataTables is included
            if (!dataTable$1 || !dataTable$1.versionCheck || !dataTable$1.versionCheck('1.10.0')) {
                throw new Error('StateRestore requires DataTables 1.10 or newer');
            }
            // Check that Select is included
            // eslint-disable-next-line no-extra-parens
            if (!dataTable$1.Buttons) {
                throw new Error('StateRestore requires Buttons');
            }
            var table = new dataTable$1.Api(settings);
            this.classes = $$1.extend(true, {}, StateRestore.classes);
            // Get options from user
            this.c = $$1.extend(true, {}, StateRestore.defaults, opts);
            this.s = {
                dt: table,
                identifier: identifier,
                isPreDefined: isPreDefined,
                savedState: null,
                tableId: state && state.stateRestore ? state.stateRestore.tableId : undefined
            };
            this.dom = {
                background: $$1('<div class="' + this.classes.background + '"/>'),
                closeButton: $$1('<div class="' + this.classes.closeButton + '">x</div>'),
                confirmation: $$1('<div class="' + this.classes.confirmation + '"/>'),
                confirmationButton: $$1('<button class="' + this.classes.confirmationButton + ' ' + this.classes.dtButton + '">'),
                confirmationTitleRow: $$1('<div class="' + this.classes.confirmationTitleRow + '"></div>'),
                dtContainer: $$1(this.s.dt.table().container()),
                duplicateError: $$1('<span class="' + this.classes.modalError + '">' +
                    this.s.dt.i18n('stateRestore.duplicateError', this.c.i18n.duplicateError) +
                    '</span>'),
                emptyError: $$1('<span class="' + this.classes.modalError + '">' +
                    this.s.dt.i18n('stateRestore.emptyError', this.c.i18n.emptyError) +
                    '</span>'),
                removeContents: $$1('<div class="' + this.classes.confirmationText + '"><span>' +
                    this.s.dt
                        .i18n('stateRestore.removeConfirm', this.c.i18n.removeConfirm)
                        .replace(/%s/g, this.s.identifier) +
                    '</span></div>'),
                removeError: $$1('<span class="' + this.classes.modalError + '">' +
                    this.s.dt.i18n('stateRestore.removeError', this.c.i18n.removeError) +
                    '</span>'),
                removeTitle: $$1('<h2 class="' + this.classes.confirmationTitle + '">' +
                    this.s.dt.i18n('stateRestore.removeTitle', this.c.i18n.removeTitle) +
                    '</h2>'),
                renameContents: $$1('<div class="' + this.classes.confirmationText + ' ' + this.classes.renameModal + '">' +
                    '<label class="' + this.classes.confirmationMessage + '">' +
                    this.s.dt
                        .i18n('stateRestore.renameLabel', this.c.i18n.renameLabel)
                        .replace(/%s/g, this.s.identifier) +
                    '</label>' +
                    '</div>'),
                renameInput: $$1('<input class="' + this.classes.input + '" type="text"></input>'),
                renameTitle: $$1('<h2 class="' + this.classes.confirmationTitle + '">' +
                    this.s.dt.i18n('stateRestore.renameTitle', this.c.i18n.renameTitle) +
                    '</h2>')
            };
            // When a StateRestore instance is created the current state of the table should also be saved.
            this.save(state, successCallback);
        }
        /**
         * Removes a state from storage and then triggers the dtsr-remove event
         * so that the StateRestoreCollection class can remove it's references as well.
         *
         * @param skipModal Flag to indicate if the modal should be skipped or not
         */
        StateRestore.prototype.remove = function (skipModal) {
            var _a;
            var _this = this;
            if (skipModal === void 0) { skipModal = false; }
            // Check if removal of states is allowed
            if (!this.c.remove) {
                return false;
            }
            var removeFunction;
            var ajaxData = {
                action: 'remove',
                stateRestore: (_a = {},
                    _a[this.s.identifier] = this.s.savedState,
                    _a)
            };
            var successCallback = function () {
                _this.dom.confirmation.trigger('dtsr-remove');
                $$1(_this.s.dt.table().node()).trigger('stateRestore-change');
                _this.dom.background.click();
                _this.dom.confirmation.remove();
                $$1(document).unbind('keyup', function (e) { return _this._keyupFunction(e); });
                _this.dom.confirmationButton.off('click');
            };
            // If the remove is not happening over ajax remove it from local storage and then trigger the event
            if (!this.c.ajax) {
                removeFunction = function () {
                    try {
                        localStorage.removeItem('DataTables_stateRestore_' + _this.s.identifier + '_' + location.pathname +
                            (_this.s.tableId ? '_' + _this.s.tableId : ''));
                        successCallback();
                    }
                    catch (e) {
                        _this.dom.confirmation.children('.' + _this.classes.modalError).remove();
                        _this.dom.confirmation.append(_this.dom.removeError);
                        return 'remove';
                    }
                    return true;
                };
            }
            // Ajax property has to be a string, not just true
            // Also only want to save if the table has been initialised and the states have been loaded in
            else if (typeof this.c.ajax === 'string' && this.s.dt.settings()[0]._bInitComplete) {
                removeFunction = function () {
                    $$1.ajax({
                        data: ajaxData,
                        success: successCallback,
                        type: 'POST',
                        url: _this.c.ajax
                    });
                    return true;
                };
            }
            else if (typeof this.c.ajax === 'function') {
                removeFunction = function () {
                    if (typeof _this.c.ajax === 'function') {
                        _this.c.ajax.call(_this.s.dt, ajaxData, successCallback);
                    }
                    return true;
                };
            }
            // If the modal is to be skipped then remove straight away
            if (skipModal) {
                this.dom.confirmation.appendTo(this.dom.dtContainer);
                $$1(this.s.dt.table().node()).trigger('dtsr-modal-inserted');
                removeFunction();
                this.dom.confirmation.remove();
            }
            // Otherwise display the modal
            else {
                this._newModal(this.dom.removeTitle, this.s.dt.i18n('stateRestore.removeSubmit', this.c.i18n.removeSubmit), removeFunction, this.dom.removeContents);
            }
            return true;
        };
        /**
         * Compares the state held within this instance with a state that is passed in
         *
         * @param state The state that is to be compared against
         * @returns boolean indicating if the states match
         */
        StateRestore.prototype.compare = function (state) {
            // Order
            if (!this.c.saveState.order) {
                state.order = undefined;
            }
            // Search
            if (!this.c.saveState.search) {
                state.search = undefined;
            }
            // Columns
            if (this.c.saveState.columns && state.columns) {
                for (var i = 0, ien = state.columns.length; i < ien; i++) {
                    // Visibility
                    if (typeof this.c.saveState.columns !== 'boolean' && !this.c.saveState.columns.visible) {
                        state.columns[i].visible = undefined;
                    }
                    // Search
                    if (typeof this.c.saveState.columns !== 'boolean' && !this.c.saveState.columns.search) {
                        state.columns[i].search = undefined;
                    }
                }
            }
            else if (!this.c.saveState.columns) {
                state.columns = undefined;
            }
            // Paging
            if (!this.c.saveState.paging) {
                state.page = undefined;
            }
            // SearchBuilder
            if (!this.c.saveState.searchBuilder) {
                state.searchBuilder = undefined;
            }
            // SearchPanes
            if (!this.c.saveState.searchPanes) {
                state.searchPanes = undefined;
            }
            // Select
            if (!this.c.saveState.select) {
                state.select = undefined;
            }
            // ColReorder
            if (!this.c.saveState.colReorder) {
                state.ColReorder = undefined;
            }
            // Scroller
            if (!this.c.saveState.scroller) {
                state.scroller = undefined;
                if (dataTable$1.Scroller !== undefined) {
                    state.start = 0;
                }
            }
            // Paging
            if (!this.c.saveState.paging) {
                state.start = 0;
            }
            // Page Length
            if (!this.c.saveState.length) {
                state.length = undefined;
            }
            // Need to delete properties that we do not want to compare
            delete state.time;
            var copyState = this.s.savedState;
            delete copyState.time;
            delete copyState.c;
            delete copyState.stateRestore;
            // Perform a deep compare of the two state objects
            return this._deepCompare(state, copyState);
        };
        /**
         * Removes all of the dom elements from the document
         */
        StateRestore.prototype.destroy = function () {
            Object.values(this.dom).forEach(function (node) { return node.off().remove(); });
        };
        /**
         * Loads the state referenced by the identifier from storage
         *
         * @param state The identifier of the state that should be loaded
         * @returns the state that has been loaded
         */
        StateRestore.prototype.load = function () {
            var _this = this;
            var loadedState = this.s.savedState;
            var settings = this.s.dt.settings()[0];
            // Always want the states stored here to be loaded in - regardless of when they were created
            loadedState.time = +new Date();
            settings.oLoadedState = $$1.extend(true, {}, loadedState);
            // Click on a background if there is one to shut the collection
            $$1('div.dt-button-background').click();
            // Call the internal datatables function to implement the state on the table
            $$1.fn.dataTable.ext.oApi._fnImplementState(settings, loadedState, function () {
                var correctPaging = function (e, preSettings) {
                    setTimeout(function () {
                        var currpage = preSettings._iDisplayStart / preSettings._iDisplayLength;
                        var intendedPage = loadedState.start / loadedState.length;
                        // If the paging is incorrect then we have to set it again so that it is correct
                        // This happens when a searchpanes filter is removed
                        // This has to happen in a timeout because searchpanes only deselects after a timeout
                        if (currpage >= 0 && intendedPage >= 0 && currpage !== intendedPage) {
                            _this.s.dt.page(intendedPage).draw(false);
                        }
                    }, 50);
                };
                _this.s.dt.one('preDraw', correctPaging);
                _this.s.dt.draw(false);
            });
            return loadedState;
        };
        /**
         * Shows a modal that allows a state to be renamed
         *
         * @param newIdentifier Optional. The new identifier for this state
         */
        StateRestore.prototype.rename = function (newIdentifier, currentIdentifiers) {
            var _this = this;
            if (newIdentifier === void 0) { newIdentifier = null; }
            // Check if renaming of states is allowed
            if (!this.c.rename) {
                return;
            }
            var renameFunction = function () {
                var _a;
                if (newIdentifier === null) {
                    var tempIdentifier = $$1('input.' + _this.classes.input.replace(/ /g, '.')).val();
                    if (tempIdentifier.length === 0) {
                        _this.dom.confirmation.children('.' + _this.classes.modalError).remove();
                        _this.dom.confirmation.append(_this.dom.emptyError);
                        return 'empty';
                    }
                    else if (currentIdentifiers.includes(tempIdentifier)) {
                        _this.dom.confirmation.children('.' + _this.classes.modalError).remove();
                        _this.dom.confirmation.append(_this.dom.duplicateError);
                        return 'duplicate';
                    }
                    else {
                        newIdentifier = tempIdentifier;
                    }
                }
                var ajaxData = {
                    action: 'rename',
                    stateRestore: (_a = {},
                        _a[_this.s.identifier] = newIdentifier,
                        _a)
                };
                var successCallback = function () {
                    _this.s.identifier = newIdentifier;
                    _this.save(_this.s.savedState, function () { return null; }, false);
                    _this.dom.removeContents = $$1('<div class="' + _this.classes.confirmationText + '"><span>' +
                        _this.s.dt
                            .i18n('stateRestore.removeConfirm', _this.c.i18n.removeConfirm)
                            .replace(/%s/g, _this.s.identifier) +
                        '</span></div>');
                    _this.dom.confirmation.trigger('dtsr-rename');
                    _this.dom.background.click();
                    _this.dom.confirmation.remove();
                    $$1(document).unbind('keyup', function (e) { return _this._keyupFunction(e); });
                    _this.dom.confirmationButton.off('click');
                };
                if (!_this.c.ajax) {
                    try {
                        localStorage.removeItem('DataTables_stateRestore_' + _this.s.identifier + '_' + location.pathname +
                            (_this.s.tableId ? '_' + _this.s.tableId : ''));
                        successCallback();
                    }
                    catch (e) {
                        _this.dom.confirmation.children('.' + _this.classes.modalError).remove();
                        _this.dom.confirmation.append(_this.dom.removeError);
                        return false;
                    }
                }
                else if (typeof _this.c.ajax === 'string' && _this.s.dt.settings()[0]._bInitComplete) {
                    $$1.ajax({
                        data: ajaxData,
                        success: successCallback,
                        type: 'POST',
                        url: _this.c.ajax
                    });
                }
                else if (typeof _this.c.ajax === 'function') {
                    _this.c.ajax.call(_this.s.dt, ajaxData, successCallback);
                }
                return true;
            };
            // Check if a new identifier has been provided, if so no need for a modal
            if (newIdentifier !== null) {
                if (currentIdentifiers.includes(newIdentifier)) {
                    throw new Error(this.s.dt.i18n('stateRestore.duplicateError', this.c.i18n.duplicateError));
                }
                else if (newIdentifier.length === 0) {
                    throw new Error(this.s.dt.i18n('stateRestore.emptyError', this.c.i18n.emptyError));
                }
                else {
                    this.dom.confirmation.appendTo(this.dom.dtContainer);
                    $$1(this.s.dt.table().node()).trigger('dtsr-modal-inserted');
                    renameFunction();
                    this.dom.confirmation.remove();
                }
            }
            else {
                this.dom.renameInput.val(this.s.identifier);
                this.dom.renameContents.append(this.dom.renameInput);
                this._newModal(this.dom.renameTitle, this.s.dt.i18n('stateRestore.renameButton', this.c.i18n.renameButton), renameFunction, this.dom.renameContents);
            }
        };
        /**
         * Saves the tables current state using the identifier that is passed in.
         *
         * @param state Optional. If provided this is the state that will be saved rather than using the current state
         */
        StateRestore.prototype.save = function (state, passedSuccessCallback, callAjax) {
            var _a;
            var _this = this;
            if (callAjax === void 0) { callAjax = true; }
            // Check if saving states is allowed
            if (!this.c.save) {
                if (passedSuccessCallback) {
                    passedSuccessCallback.call(this);
                }
                return;
            }
            // this.s.dt.state.save();
            var savedState;
            // If no state has been provided then create a new one from the current state
            this.s.dt.state.save();
            if (state === undefined) {
                savedState = this.s.dt.state();
            }
            else if (typeof state !== 'object') {
                return;
            }
            else {
                savedState = state;
            }
            if (savedState.stateRestore) {
                savedState.stateRestore.isPreDefined = this.s.isPreDefined;
                savedState.stateRestore.state = this.s.identifier;
                savedState.stateRestore.tableId = this.s.tableId;
            }
            else {
                savedState.stateRestore = {
                    isPreDefined: this.s.isPreDefined,
                    state: this.s.identifier,
                    tableId: this.s.tableId
                };
            }
            this.s.savedState = savedState;
            // Order
            if (!this.c.saveState.order) {
                this.s.savedState.order = undefined;
            }
            // Search
            if (!this.c.saveState.search) {
                this.s.savedState.search = undefined;
            }
            // Columns
            if (this.c.saveState.columns && this.s.savedState.columns) {
                for (var i = 0, ien = this.s.savedState.columns.length; i < ien; i++) {
                    // Visibility
                    if (typeof this.c.saveState.columns !== 'boolean' && !this.c.saveState.columns.visible) {
                        this.s.savedState.columns[i].visible = undefined;
                    }
                    // Search
                    if (typeof this.c.saveState.columns !== 'boolean' && !this.c.saveState.columns.search) {
                        this.s.savedState.columns[i].search = undefined;
                    }
                }
            }
            else if (!this.c.saveState.columns) {
                this.s.savedState.columns = undefined;
            }
            // SearchBuilder
            if (!this.c.saveState.searchBuilder) {
                this.s.savedState.searchBuilder = undefined;
            }
            // SearchPanes
            if (!this.c.saveState.searchPanes) {
                this.s.savedState.searchPanes = undefined;
            }
            // Select
            if (!this.c.saveState.select) {
                this.s.savedState.select = undefined;
            }
            // ColReorder
            if (!this.c.saveState.colReorder) {
                this.s.savedState.ColReorder = undefined;
            }
            // Scroller
            if (!this.c.saveState.scroller) {
                this.s.savedState.scroller = undefined;
                if (dataTable$1.Scroller !== undefined) {
                    this.s.savedState.start = 0;
                }
            }
            // Paging
            if (!this.c.saveState.paging) {
                this.s.savedState.start = 0;
            }
            // Page Length
            if (!this.c.saveState.length) {
                this.s.savedState.length = undefined;
            }
            this.s.savedState.c = this.c;
            // Need to remove the parent reference before we save the state
            // Its not needed to rebuild, but it does cause a circular reference when converting to JSON
            if (this.s.savedState.c.splitSecondaries.length) {
                for (var _i = 0, _b = this.s.savedState.c.splitSecondaries; _i < _b.length; _i++) {
                    var secondary = _b[_i];
                    if (secondary.parent) {
                        secondary.parent = undefined;
                    }
                }
            }
            // If the state is predefined there is no need to save it over ajax or to local storage
            if (this.s.isPreDefined) {
                if (passedSuccessCallback) {
                    passedSuccessCallback.call(this);
                }
                return;
            }
            var ajaxData = {
                action: 'save',
                stateRestore: (_a = {},
                    _a[this.s.identifier] = this.s.savedState,
                    _a)
            };
            var successCallback = function () {
                if (passedSuccessCallback) {
                    passedSuccessCallback.call(_this);
                }
                _this.dom.confirmation.trigger('dtsr-save');
                $$1(_this.s.dt.table().node()).trigger('stateRestore-change');
            };
            if (!this.c.ajax) {
                localStorage.setItem('DataTables_stateRestore_' + this.s.identifier + '_' + location.pathname +
                    (this.s.tableId ? '_' + this.s.tableId : ''), JSON.stringify(this.s.savedState));
                successCallback();
            }
            else if (typeof this.c.ajax === 'string' && callAjax) {
                if (this.s.dt.settings()[0]._bInitComplete) {
                    $$1.ajax({
                        data: ajaxData,
                        success: successCallback,
                        type: 'POST',
                        url: this.c.ajax
                    });
                }
                else {
                    this.s.dt.one('init', function () {
                        $$1.ajax({
                            data: ajaxData,
                            success: successCallback,
                            type: 'POST',
                            url: _this.c.ajax
                        });
                    });
                }
            }
            else if (typeof this.c.ajax === 'function' && callAjax) {
                this.c.ajax.call(this.s.dt, ajaxData, successCallback);
            }
        };
        /**
         * Performs a deep compare of two state objects, returning true if they match
         *
         * @param state1 The first object to compare
         * @param state2 The second object to compare
         * @returns boolean indicating if the objects match
         */
        StateRestore.prototype._deepCompare = function (state1, state2) {
            // Put keys and states into arrays as this makes the later code easier to work
            var states = [state1, state2];
            var keys = [Object.keys(state1).sort(), Object.keys(state2).sort()];
            // If scroller is included then we need to remove the start value
            //  as it can be different but yield the same results
            if (keys[0].includes('scroller')) {
                var startIdx = keys[0].indexOf('start');
                if (startIdx) {
                    keys[0].splice(startIdx, 1);
                }
            }
            if (keys[1].includes('scroller')) {
                var startIdx = keys[1].indexOf('start');
                if (startIdx) {
                    keys[1].splice(startIdx, 1);
                }
            }
            // We want to remove any private properties within the states
            for (var i = 0; i < keys[0].length; i++) {
                if (keys[0][i].indexOf('_') === 0) {
                    keys[0].splice(i, 1);
                    i--;
                    continue;
                }
                // If scroller is included then we need to remove the following values
                //  as they can be different but yield the same results
                if (keys[0][i] === 'baseRowTop' ||
                    keys[0][i] === 'baseScrollTop' ||
                    keys[0][i] === 'scrollTop' ||
                    (!this.c.saveState.paging && keys[0][i] === 'page')) {
                    keys[0].splice(i, 1);
                    i--;
                    continue;
                }
            }
            for (var i = 0; i < keys[1].length; i++) {
                if (keys[1][i].indexOf('_') === 0) {
                    keys[1].splice(i, 1);
                    i--;
                    continue;
                }
                if (keys[1][i] === 'baseRowTop' ||
                    keys[1][i] === 'baseScrollTop' ||
                    keys[1][i] === 'scrollTop' ||
                    (!this.c.saveState.paging && keys[0][i] === 'page')) {
                    keys[1].splice(i, 1);
                    i--;
                    continue;
                }
            }
            if (keys[0].length === 0 && keys[1].length > 0 ||
                keys[1].length === 0 && keys[0].length > 0) {
                return false;
            }
            // We are only going to compare the keys that are common between both states
            for (var i = 0; i < keys[0].length; i++) {
                if (!keys[1].includes(keys[0][i])) {
                    keys[0].splice(i, 1);
                    i--;
                }
            }
            for (var i = 0; i < keys[1].length; i++) {
                if (!keys[0].includes(keys[1][i])) {
                    keys[1].splice(i, 1);
                    i--;
                }
            }
            // Then each key and value has to be checked against each other
            for (var i = 0; i < keys[0].length; i++) {
                // If the keys dont equal, or their corresponding types are different we can return false
                if (keys[0][i] !== keys[1][i] || typeof states[0][keys[0][i]] !== typeof states[1][keys[1][i]]) {
                    return false;
                }
                // If the type is an object then further deep comparisons are required
                if (typeof states[0][keys[0][i]] === 'object') {
                    if (!this._deepCompare(states[0][keys[0][i]], states[1][keys[1][i]])) {
                        return false;
                    }
                }
                else if (typeof states[0][keys[0][i]] === 'number' && typeof states[1][keys[1][i]] === 'number') {
                    if (Math.round(states[0][keys[0][i]]) !== Math.round(states[1][keys[1][i]])) {
                        return false;
                    }
                }
                // Otherwise we can just check the value
                else if (states[0][keys[0][i]] !== states[1][keys[1][i]]) {
                    return false;
                }
            }
            // If we get all the way to here there are no differences so return true for this object
            return true;
        };
        StateRestore.prototype._keyupFunction = function (e) {
            // If enter same action as pressing the button
            if (e.key === 'Enter') {
                this.dom.confirmationButton.click();
            }
            // If escape close modal
            else if (e.key === 'Escape') {
                $$1('div.' + this.classes.background.replace(/ /g, '.')).click();
            }
        };
        /**
         * Creates a new confirmation modal for the user to approve an action
         *
         * @param title The title that is to be displayed at the top of the modal
         * @param buttonText The text that is to be displayed in the confirmation button of the modal
         * @param buttonAction The action that should be taken when the confirmation button is pressed
         * @param modalContents The contents for the main body of the modal
         */
        StateRestore.prototype._newModal = function (title, buttonText, buttonAction, modalContents) {
            var _this = this;
            this.dom.background.appendTo(this.dom.dtContainer);
            this.dom.confirmationTitleRow.empty().append(title);
            this.dom.confirmationButton.html(buttonText);
            this.dom.confirmation
                .empty()
                .append(this.dom.confirmationTitleRow)
                .append(modalContents)
                .append($$1('<div class="' + this.classes.confirmationButtons + '"></div>')
                .append(this.dom.confirmationButton))
                .appendTo(this.dom.dtContainer);
            $$1(this.s.dt.table().node()).trigger('dtsr-modal-inserted');
            var inputs = modalContents.children('input');
            // If there is an input focus on that
            if (inputs.length > 0) {
                $$1(inputs[0]).focus();
            }
            // Otherwise focus on the confirmation button
            else {
                this.dom.confirmationButton.focus();
            }
            var background = $$1('div.' + this.classes.background.replace(/ /g, '.'));
            if (this.c.modalCloseButton) {
                this.dom.confirmation.append(this.dom.closeButton);
                this.dom.closeButton.on('click', function () { return background.click(); });
            }
            // When the button is clicked, call the appropriate action,
            // remove the background and modal from the screen and unbind the keyup event.
            this.dom.confirmationButton.on('click', function () { return buttonAction(); });
            this.dom.confirmation.on('click', function (e) {
                e.stopPropagation();
            });
            // When the button is clicked, remove the background and modal from the screen and unbind the keyup event.
            background.one('click', function () {
                _this.dom.background.remove();
                _this.dom.confirmation.remove();
                $$1(document).unbind('keyup', function (e) { return _this._keyupFunction(e); });
            });
            $$1(document).on('keyup', function (e) { return _this._keyupFunction(e); });
        };
        /**
         * Convert from camelCase notation to the internal Hungarian.
         * We could use the Hungarian convert function here, but this is cleaner
         *
         * @param {object} obj Object to convert
         * @returns {object} Inverted object
         * @memberof DataTable#oApi
         */
        StateRestore.prototype._searchToHung = function (obj) {
            return {
                bCaseInsensitive: obj.caseInsensitive,
                bRegex: obj.regex,
                bSmart: obj.smart,
                sSearch: obj.search
            };
        };
        StateRestore.version = '1.1.1';
        StateRestore.classes = {
            background: 'dtsr-background',
            closeButton: 'dtsr-popover-close',
            confirmation: 'dtsr-confirmation',
            confirmationButton: 'dtsr-confirmation-button',
            confirmationButtons: 'dtsr-confirmation-buttons',
            confirmationMessage: 'dtsr-confirmation-message dtsr-name-label',
            confirmationText: 'dtsr-confirmation-text',
            confirmationTitle: 'dtsr-confirmation-title',
            confirmationTitleRow: 'dtsr-confirmation-title-row',
            dtButton: 'dt-button',
            input: 'dtsr-input',
            modalError: 'dtsr-modal-error',
            renameModal: 'dtsr-rename-modal'
        };
        StateRestore.defaults = {
            _createInSaved: false,
            ajax: false,
            create: true,
            creationModal: false,
            i18n: {
                creationModal: {
                    button: 'Create',
                    colReorder: 'Column Order:',
                    columns: {
                        search: 'Column Search:',
                        visible: 'Column Visibility:'
                    },
                    length: 'Page Length:',
                    name: 'Name:',
                    order: 'Sorting:',
                    paging: 'Paging:',
                    scroller: 'Scroll Position:',
                    search: 'Search:',
                    searchBuilder: 'SearchBuilder:',
                    searchPanes: 'SearchPanes:',
                    select: 'Select:',
                    title: 'Create New State',
                    toggleLabel: 'Includes:'
                },
                duplicateError: 'A state with this name already exists.',
                emptyError: 'Name cannot be empty.',
                emptyStates: 'No saved states',
                removeConfirm: 'Are you sure you want to remove %s?',
                removeError: 'Failed to remove state.',
                removeJoiner: ' and ',
                removeSubmit: 'Remove',
                removeTitle: 'Remove State',
                renameButton: 'Rename',
                renameLabel: 'New Name for %s:',
                renameTitle: 'Rename State'
            },
            modalCloseButton: true,
            remove: true,
            rename: true,
            save: true,
            saveState: {
                colReorder: true,
                columns: {
                    search: true,
                    visible: true
                },
                length: true,
                order: true,
                paging: true,
                scroller: true,
                search: true,
                searchBuilder: true,
                searchPanes: true,
                select: true
            },
            splitSecondaries: [
                'updateState',
                'renameState',
                'removeState'
            ],
            toggle: {
                colReorder: false,
                columns: {
                    search: false,
                    visible: false
                },
                length: false,
                order: false,
                paging: false,
                scroller: false,
                search: false,
                searchBuilder: false,
                searchPanes: false,
                select: false
            }
        };
        return StateRestore;
    }());

    var $;
    var dataTable;
    function setJQuery(jq) {
        $ = jq;
        dataTable = jq.fn.dataTable;
    }
    var StateRestoreCollection = /** @class */ (function () {
        function StateRestoreCollection(settings, opts) {
            var _this = this;
            // Check that the required version of DataTables is included
            if (!dataTable || !dataTable.versionCheck || !dataTable.versionCheck('1.10.0')) {
                throw new Error('StateRestore requires DataTables 1.10 or newer');
            }
            // Check that Select is included
            // eslint-disable-next-line no-extra-parens
            if (!dataTable.Buttons) {
                throw new Error('StateRestore requires Buttons');
            }
            var table = new dataTable.Api(settings);
            this.classes = $.extend(true, {}, StateRestoreCollection.classes);
            if (table.settings()[0]._stateRestore !== undefined) {
                return;
            }
            // Get options from user
            this.c = $.extend(true, {}, StateRestoreCollection.defaults, opts);
            this.s = {
                dt: table,
                hasColReorder: dataTable.ColReorder !== undefined,
                hasScroller: dataTable.Scroller !== undefined,
                hasSearchBuilder: dataTable.SearchBuilder !== undefined,
                hasSearchPanes: dataTable.SearchPanes !== undefined,
                hasSelect: dataTable.select !== undefined,
                states: []
            };
            this.s.dt.on('xhr', function (e, xhrsettings, json) {
                // Has staterestore been used before? Is there anything to load?
                if (json && json.stateRestore) {
                    _this._addPreDefined(json.stateRestore);
                }
            });
            this.dom = {
                background: $('<div class="' + this.classes.background + '"/>'),
                closeButton: $('<div class="' + this.classes.closeButton + '">x</div>'),
                colReorderToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.colReorderToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.colReorder', this.c.i18n.creationModal.colReorder) +
                    '</label>' +
                    '</div>'),
                columnsSearchToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.columnsSearchToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.columns.search', this.c.i18n.creationModal.columns.search) +
                    '</label>' +
                    '</div>'),
                columnsVisibleToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + ' ' + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.columnsVisibleToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.columns.visible', this.c.i18n.creationModal.columns.visible) +
                    '</label>' +
                    '</div>'),
                confirmation: $('<div class="' + this.classes.confirmation + '"/>'),
                confirmationTitleRow: $('<div class="' + this.classes.confirmationTitleRow + '"></div>'),
                createButtonRow: $('<div class="' + this.classes.formRow + ' ' + this.classes.modalFoot + '">' +
                    '<button class="' + this.classes.creationButton + ' ' + this.classes.dtButton + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.button', this.c.i18n.creationModal.button) +
                    '</button>' +
                    '</div>'),
                creation: $('<div class="' + this.classes.creation + '"/>'),
                creationForm: $('<div class="' + this.classes.creationForm + '"/>'),
                creationTitle: $('<div class="' + this.classes.creationText + '">' +
                    '<h2 class="' + this.classes.creationTitle + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.title', this.c.i18n.creationModal.title) +
                    '</h2>' +
                    '</div>'),
                dtContainer: $(this.s.dt.table().container()),
                duplicateError: $('<span class="' + this.classes.modalError + '">' +
                    this.s.dt.i18n('stateRestore.duplicateError', this.c.i18n.duplicateError) +
                    '</span>'),
                emptyError: $('<span class="' + this.classes.modalError + '">' +
                    this.s.dt.i18n('stateRestore.emptyError', this.c.i18n.emptyError) +
                    '</span>'),
                lengthToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.lengthToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.length', this.c.i18n.creationModal.length) +
                    '</label>' +
                    '</div>'),
                nameInputRow: $('<div class="' + this.classes.formRow + '">' +
                    '<label class="' + this.classes.nameLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.name', this.c.i18n.creationModal.name) +
                    '</label>' +
                    '<input class="' + this.classes.nameInput + '" type="text">' +
                    '</div>'),
                orderToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.orderToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.order', this.c.i18n.creationModal.order) +
                    '</label>' +
                    '</div>'),
                pagingToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.pagingToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.paging', this.c.i18n.creationModal.paging) +
                    '</label>' +
                    '</div>'),
                removeContents: $('<div class="' + this.classes.confirmationText + '"><span></span></div>'),
                removeTitle: $('<div class="' + this.classes.creationText + '">' +
                    '<h2 class="' + this.classes.creationTitle + '">' +
                    this.s.dt.i18n('stateRestore.removeTitle', this.c.i18n.removeTitle) +
                    '</h2>' +
                    '</div>'),
                scrollerToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.scrollerToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.scroller', this.c.i18n.creationModal.scroller) +
                    '</label>' +
                    '</div>'),
                searchBuilderToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.searchBuilderToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.searchBuilder', this.c.i18n.creationModal.searchBuilder) +
                    '</label>' +
                    '</div>'),
                searchPanesToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.searchPanesToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.searchPanes', this.c.i18n.creationModal.searchPanes) +
                    '</label>' +
                    '</div>'),
                searchToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.searchToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.search', this.c.i18n.creationModal.search) +
                    '</label>' +
                    '</div>'),
                selectToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.selectToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.select', this.c.i18n.creationModal.select) +
                    '</label>' +
                    '</div>'),
                toggleLabel: $('<label class="' + this.classes.nameLabel + ' ' + this.classes.toggleLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.toggleLabel', this.c.i18n.creationModal.toggleLabel) +
                    '</label>')
            };
            table.settings()[0]._stateRestore = this;
            this._searchForStates();
            // Has staterestore been used before? Is there anything to load?
            this._addPreDefined(this.c.preDefined);
            var ajaxFunction;
            var ajaxData = {
                action: 'load'
            };
            if (typeof this.c.ajax === 'function') {
                ajaxFunction = function () {
                    if (typeof _this.c.ajax === 'function') {
                        _this.c.ajax.call(_this.s.dt, ajaxData, function (s) { return _this._addPreDefined(s); });
                    }
                };
            }
            else if (typeof this.c.ajax === 'string') {
                ajaxFunction = function () {
                    $.ajax({
                        data: ajaxData,
                        success: function (data) {
                            _this._addPreDefined(data);
                        },
                        type: 'POST',
                        url: _this.c.ajax
                    });
                };
            }
            if (typeof ajaxFunction === 'function') {
                if (this.s.dt.settings()[0]._bInitComplete) {
                    ajaxFunction();
                }
                else {
                    this.s.dt.one('preInit.dtsr', function () {
                        ajaxFunction();
                    });
                }
            }
            this.s.dt.on('destroy.dtsr', function () {
                _this.destroy();
            });
            this.s.dt.on('draw.dtsr buttons-action.dtsr', function () { return _this.findActive(); });
            return this;
        }
        /**
         * Adds a new StateRestore instance to the collection based on the current properties of the table
         *
         * @param identifier The value that is used to identify a state.
         * @returns The state that has been created
         */
        StateRestoreCollection.prototype.addState = function (identifier, currentIdentifiers, options) {
            var _this = this;
            // If creation/saving is not allowed then return
            if (!this.c.create || !this.c.save) {
                return;
            }
            // Check if the state exists before creating a new ones
            var state = this.getState(identifier);
            var createFunction = function (id, toggles) {
                if (id.length === 0) {
                    return 'empty';
                }
                else if (currentIdentifiers.includes(id)) {
                    return 'duplicate';
                }
                _this.s.dt.state.save();
                var that = _this;
                var successCallback = function () {
                    that.s.states.push(this);
                    that._collectionRebuild();
                };
                var currState = _this.s.dt.state();
                currState.stateRestore = {
                    isPredefined: false,
                    state: id,
                    tableId: _this.s.dt.table().node().id
                };
                if (toggles.saveState) {
                    var opts = _this.c.saveState;
                    // We don't want to extend, but instead AND all properties of the saveState option
                    for (var _i = 0, _a = Object.keys(toggles.saveState); _i < _a.length; _i++) {
                        var key = _a[_i];
                        if (!toggles.saveState[key]) {
                            opts[key] = false;
                        }
                    }
                    _this.c.saveState = opts;
                }
                var newState = new StateRestore(_this.s.dt.settings()[0], $.extend(true, {}, _this.c, options), id, currState, false, successCallback);
                $(_this.s.dt.table().node()).on('dtsr-modal-inserted', function () {
                    newState.dom.confirmation.one('dtsr-remove', function () { return _this._removeCallback(newState.s.identifier); });
                    newState.dom.confirmation.one('dtsr-rename', function () { return _this._collectionRebuild(); });
                    newState.dom.confirmation.one('dtsr-save', function () { return _this._collectionRebuild(); });
                });
                return true;
            };
            // If there isn't already a state with this identifier
            if (state === null) {
                if (this.c.creationModal || options !== undefined && options.creationModal) {
                    this._creationModal(createFunction, identifier, options);
                }
                else {
                    var success = createFunction(identifier, {});
                    if (success === 'empty') {
                        throw new Error(this.s.dt.i18n('stateRestore.emptyError', this.c.i18n.emptyError));
                    }
                    else if (success === 'duplicate') {
                        throw new Error(this.s.dt.i18n('stateRestore.duplicateError', this.c.i18n.duplicateError));
                    }
                }
            }
            else {
                throw new Error(this.s.dt.i18n('stateRestore.duplicateError', this.c.i18n.duplicateError));
            }
        };
        /**
         * Removes all of the states, showing a modal to the user for confirmation
         *
         * @param removeFunction The action to be taken when the action is confirmed
         */
        StateRestoreCollection.prototype.removeAll = function (removeFunction) {
            // There are no states to remove so just return
            if (this.s.states.length === 0) {
                return;
            }
            var ids = this.s.states.map(function (state) { return state.s.identifier; });
            var replacementString = ids[0];
            if (ids.length > 1) {
                replacementString = ids.slice(0, -1).join(', ') +
                    this.s.dt.i18n('stateRestore.removeJoiner', this.c.i18n.removeJoiner) +
                    ids.slice(-1);
            }
            $(this.dom.removeContents.children('span')).html(this.s.dt
                .i18n('stateRestore.removeConfirm', this.c.i18n.removeConfirm)
                .replace(/%s/g, replacementString));
            this._newModal(this.dom.removeTitle, this.s.dt.i18n('stateRestore.removeSubmit', this.c.i18n.removeSubmit), removeFunction, this.dom.removeContents);
        };
        /**
         * Removes all of the dom elements from the document for the collection and the stored states
         */
        StateRestoreCollection.prototype.destroy = function () {
            for (var _i = 0, _a = this.s.states; _i < _a.length; _i++) {
                var state = _a[_i];
                state.destroy();
            }
            Object.values(this.dom).forEach(function (node) {
                node.off();
                node.remove();
            });
            this.s.states = [];
            this.s.dt.off('.dtsr');
            $(this.s.dt.table().node()).off('.dtsr');
        };
        /**
         * Identifies active states and updates their button to reflect this.
         *
         * @returns An array containing objects with the details of currently active states
         */
        StateRestoreCollection.prototype.findActive = function () {
            // Make sure that the state is up to date
            this.s.dt.state.save();
            var currState = this.s.dt.state();
            // Make all of the buttons inactive so that only any that match will be marked as active
            var buttons = $('button.' + $.fn.DataTable.Buttons.defaults.dom.button.className.replace(/ /g, '.'));
            // Some of the styling libraries use a tags instead of buttons
            if (buttons.length === 0) {
                buttons = $('a.' + $.fn.DataTable.Buttons.defaults.dom.button.className.replace(/ /g, '.'));
            }
            for (var _i = 0, buttons_1 = buttons; _i < buttons_1.length; _i++) {
                var button = buttons_1[_i];
                this.s.dt.button($(button).parent()[0]).active(false);
            }
            var results = [];
            // Go through all of the states comparing if their state is the same to the current one
            for (var _a = 0, _b = this.s.states; _a < _b.length; _a++) {
                var state = _b[_a];
                if (state.compare(currState)) {
                    results.push({
                        data: state.s.savedState,
                        name: state.s.identifier
                    });
                    // If so, find the corresponding button and mark it as active
                    for (var _c = 0, buttons_2 = buttons; _c < buttons_2.length; _c++) {
                        var button = buttons_2[_c];
                        if ($(button).text() === state.s.identifier) {
                            this.s.dt.button($(button).parent()[0]).active(true);
                            break;
                        }
                    }
                }
            }
            return results;
        };
        /**
         * Gets a single state that has the identifier matching that which is passed in
         *
         * @param identifier The value that is used to identify a state
         * @returns The state that has been identified or null if no states have been identified
         */
        StateRestoreCollection.prototype.getState = function (identifier) {
            for (var _i = 0, _a = this.s.states; _i < _a.length; _i++) {
                var state = _a[_i];
                if (state.s.identifier === identifier) {
                    return state;
                }
            }
            return null;
        };
        /**
         * Gets an array of all of the states
         *
         * @returns Any states that have been identified
         */
        StateRestoreCollection.prototype.getStates = function (ids) {
            if (ids === undefined) {
                return this.s.states;
            }
            else {
                var states = [];
                for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
                    var id = ids_1[_i];
                    var found = false;
                    for (var _a = 0, _b = this.s.states; _a < _b.length; _a++) {
                        var state = _b[_a];
                        if (id === state.s.identifier) {
                            states.push(state);
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        states.push(undefined);
                    }
                }
                return states;
            }
        };
        /**
         * Reloads states that are set via datatables config or over ajax
         *
         * @param preDefined Object containing the predefined states that are to be reintroduced
         */
        StateRestoreCollection.prototype._addPreDefined = function (preDefined) {
            var _this = this;
            // There is a potential issue here if sorting where the string parts of the name are the same,
            // only the number differs and there are many states - but this wouldn't be usfeul naming so
            // more of a priority to sort alphabetically
            var states = Object.keys(preDefined).sort(function (a, b) { return a > b ? 1 : a < b ? -1 : 0; });
            var _loop_1 = function (state) {
                for (var i = 0; i < this_1.s.states.length; i++) {
                    if (this_1.s.states[i].s.identifier === state) {
                        this_1.s.states.splice(i, 1);
                    }
                }
                var that = this_1;
                var successCallback = function () {
                    that.s.states.push(this);
                    that._collectionRebuild();
                };
                var loadedState = preDefined[state];
                var newState = new StateRestore(this_1.s.dt, $.extend(true, {}, this_1.c, loadedState.c !== undefined ?
                    { saveState: loadedState.c.saveState } :
                    undefined, true), state, loadedState, true, successCallback);
                newState.s.savedState = loadedState;
                $(this_1.s.dt.table().node()).on('dtsr-modal-inserted', function () {
                    newState.dom.confirmation.one('dtsr-remove', function () { return _this._removeCallback(newState.s.identifier); });
                    newState.dom.confirmation.one('dtsr-rename', function () { return _this._collectionRebuild(); });
                    newState.dom.confirmation.one('dtsr-save', function () { return _this._collectionRebuild(); });
                });
            };
            var this_1 = this;
            for (var _i = 0, states_1 = states; _i < states_1.length; _i++) {
                var state = states_1[_i];
                _loop_1(state);
            }
        };
        /**
         * Rebuilds all of the buttons in the collection of states to make sure that states and text is up to date
         */
        StateRestoreCollection.prototype._collectionRebuild = function () {
            var button = this.s.dt.button('SaveStateRestore:name');
            var stateButtons = button[0] !== undefined && button[0].inst.c.buttons[0].buttons !== undefined ?
                button[0].inst.c.buttons[0].buttons :
                [];
            // remove any states from the previous rebuild - if they are still there they will be added later
            for (var i = 0; i < stateButtons.length; i++) {
                if (stateButtons[i].extend === 'stateRestore') {
                    stateButtons.splice(i, 1);
                    i--;
                }
            }
            if (this.c._createInSaved) {
                stateButtons.push('createState');
            }
            var emptyText = '<span class="' + this.classes.emptyStates + '">' +
                this.s.dt.i18n('stateRestore.emptyStates', this.c.i18n.emptyStates) +
                '</span>';
            // If there are no states display an empty message
            if (this.s.states.length === 0) {
                // Don't want the empty text included more than twice
                if (!stateButtons.includes(emptyText)) {
                    stateButtons.push(emptyText);
                }
            }
            else {
                // There are states to add so there shouldn't be any empty text left!
                while (stateButtons.includes(emptyText)) {
                    stateButtons.splice(stateButtons.indexOf(emptyText), 1);
                }
                // There is a potential issue here if sorting where the string parts of the name are the same,
                // only the number differs and there are many states - but this wouldn't be usfeul naming so
                // more of a priority to sort alphabetically
                this.s.states = this.s.states.sort(function (a, b) {
                    var aId = a.s.identifier;
                    var bId = b.s.identifier;
                    return aId > bId ?
                        1 :
                        aId < bId ?
                            -1 :
                            0;
                });
                // Construct the split property of each button
                for (var _i = 0, _a = this.s.states; _i < _a.length; _i++) {
                    var state = _a[_i];
                    var split = Object.assign([], this.c.splitSecondaries);
                    if (split.includes('updateState') && (!this.c.save || !state.c.save)) {
                        split.splice(split.indexOf('updateState'), 1);
                    }
                    if (split.includes('renameState') &&
                        (!this.c.save || !state.c.save || !this.c.rename || !state.c.rename)) {
                        split.splice(split.indexOf('renameState'), 1);
                    }
                    if (split.includes('removeState') && (!this.c.remove || !state.c.remove)) {
                        split.splice(split.indexOf('removeState'), 1);
                    }
                    if (split.length > 0 &&
                        !split.includes('<h3>' + state.s.identifier + '</h3>')) {
                        split.unshift('<h3>' + state.s.identifier + '</h3>');
                    }
                    stateButtons.push({
                        _stateRestore: state,
                        attr: {
                            title: state.s.identifier
                        },
                        config: {
                            split: split
                        },
                        extend: 'stateRestore',
                        text: state.s.identifier
                    });
                }
            }
            button.collectionRebuild(stateButtons);
            // Need to disable the removeAllStates button if there are no states and it is present
            var buttons = this.s.dt.buttons();
            for (var _b = 0, buttons_3 = buttons; _b < buttons_3.length; _b++) {
                var butt = buttons_3[_b];
                if ($(butt.node).hasClass('dtsr-removeAllStates')) {
                    if (this.s.states.length === 0) {
                        this.s.dt.button(butt.node).disable();
                    }
                    else {
                        this.s.dt.button(butt.node).enable();
                    }
                }
            }
        };
        /**
         * Displays a modal that is used to get information from the user to create a new state.
         *
         * @param buttonAction The action that should be taken when the button is pressed
         * @param identifier The default identifier for the next new state
         */
        StateRestoreCollection.prototype._creationModal = function (buttonAction, identifier, options) {
            var _this = this;
            this.dom.creation.empty();
            this.dom.creationForm.empty();
            this.dom.nameInputRow.children('input').val(identifier);
            this.dom.creationForm.append(this.dom.nameInputRow);
            var tableConfig = this.s.dt.settings()[0].oInit;
            var togglesToInsert = [];
            var toggleDefined = options !== undefined && options.toggle !== undefined;
            // Order toggle - check toggle and saving enabled
            if (((!toggleDefined || options.toggle.order === undefined) && this.c.toggle.order ||
                toggleDefined && options.toggle.order) &&
                this.c.saveState.order &&
                (tableConfig.ordering === undefined || tableConfig.ordering)) {
                togglesToInsert.push(this.dom.orderToggle);
            }
            // Search toggle - check toggle and saving enabled
            if (((!toggleDefined || options.toggle.search === undefined) && this.c.toggle.search ||
                toggleDefined && options.toggle.search) &&
                this.c.saveState.search &&
                (tableConfig.searching === undefined || tableConfig.searching)) {
                togglesToInsert.push(this.dom.searchToggle);
            }
            // Paging toggle - check toggle and saving enabled
            if (((!toggleDefined || options.toggle.paging === undefined) && this.c.toggle.paging ||
                toggleDefined && options.toggle.paging) &&
                this.c.saveState.paging &&
                (tableConfig.paging === undefined || tableConfig.paging)) {
                togglesToInsert.push(this.dom.pagingToggle);
            }
            // Page Length toggle - check toggle and saving enabled
            if (((!toggleDefined || options.toggle.length === undefined) && this.c.toggle.length ||
                toggleDefined && options.toggle.length) &&
                this.c.saveState.length &&
                (tableConfig.length === undefined || tableConfig.length)) {
                togglesToInsert.push(this.dom.lengthToggle);
            }
            // ColReorder toggle - check toggle and saving enabled
            if (this.s.hasColReorder &&
                ((!toggleDefined || options.toggle.colReorder === undefined) && this.c.toggle.colReorder ||
                    toggleDefined && options.toggle.colReorder) &&
                this.c.saveState.colReorder) {
                togglesToInsert.push(this.dom.colReorderToggle);
            }
            // Scroller toggle - check toggle and saving enabled
            if (this.s.hasScroller &&
                ((!toggleDefined || options.toggle.scroller === undefined) && this.c.toggle.scroller ||
                    toggleDefined && options.toggle.scroller) &&
                this.c.saveState.scroller) {
                togglesToInsert.push(this.dom.scrollerToggle);
            }
            // SearchBuilder toggle - check toggle and saving enabled
            if (this.s.hasSearchBuilder &&
                ((!toggleDefined || options.toggle.searchBuilder === undefined) && this.c.toggle.searchBuilder ||
                    toggleDefined && options.toggle.searchBuilder) &&
                this.c.saveState.searchBuilder) {
                togglesToInsert.push(this.dom.searchBuilderToggle);
            }
            // SearchPanes toggle - check toggle and saving enabled
            if (this.s.hasSearchPanes &&
                ((!toggleDefined || options.toggle.searchPanes === undefined) && this.c.toggle.searchPanes ||
                    toggleDefined && options.toggle.searchPanes) &&
                this.c.saveState.searchPanes) {
                togglesToInsert.push(this.dom.searchPanesToggle);
            }
            // Select toggle - check toggle and saving enabled
            if (this.s.hasSelect &&
                ((!toggleDefined || options.toggle.select === undefined) && this.c.toggle.select ||
                    toggleDefined && options.toggle.select) &&
                this.c.saveState.select) {
                togglesToInsert.push(this.dom.selectToggle);
            }
            // Columns toggle - check toggle and saving enabled
            if (typeof this.c.toggle.columns === 'boolean' &&
                ((!toggleDefined || options.toggle.order === undefined) && this.c.toggle.columns ||
                    toggleDefined && options.toggle.order) &&
                this.c.saveState.columns) {
                togglesToInsert.push(this.dom.columnsSearchToggle);
                togglesToInsert.push(this.dom.columnsVisibleToggle);
            }
            else if ((!toggleDefined || options.toggle.columns === undefined) && typeof this.c.toggle.columns !== 'boolean' ||
                typeof options.toggle.order !== 'boolean') {
                if (typeof this.c.saveState.columns !== 'boolean' && this.c.saveState.columns) {
                    // Column search toggle - check toggle and saving enabled
                    if ((
                    // columns.search is defined when passed in
                    toggleDefined &&
                        options.toggle.columns !== undefined &&
                        typeof options.toggle.columns !== 'boolean' &&
                        options.toggle.columns.search ||
                        // Columns search is not defined when passed in but is in defaults
                        (!toggleDefined ||
                            options.toggle.columns === undefined ||
                            typeof options.toggle.columns !== 'boolean' && options.toggle.columns.search === undefined) &&
                            typeof this.c.toggle.columns !== 'boolean' &&
                            this.c.toggle.columns.search) &&
                        this.c.saveState.columns.search) {
                        togglesToInsert.push(this.dom.columnsSearchToggle);
                    }
                    // Column visiblity toggle - check toggle and saving enabled
                    if ((
                    // columns.visible is defined when passed in
                    toggleDefined &&
                        options.toggle.columns !== undefined &&
                        typeof options.toggle.columns !== 'boolean' &&
                        options.toggle.columns.visible ||
                        // Columns visible is not defined when passed in but is in defaults
                        (!toggleDefined ||
                            options.toggle.columns === undefined ||
                            typeof options.toggle.columns !== 'boolean' && options.toggle.columns.visible === undefined) &&
                            typeof this.c.toggle.columns !== 'boolean' &&
                            this.c.toggle.columns.visible) &&
                        this.c.saveState.columns.visible) {
                        togglesToInsert.push(this.dom.columnsVisibleToggle);
                    }
                }
                else if (this.c.saveState.columns) {
                    togglesToInsert.push(this.dom.columnsSearchToggle);
                    togglesToInsert.push(this.dom.columnsVisibleToggle);
                }
            }
            // Make sure that the toggles are displayed alphabetically
            togglesToInsert.sort(function (a, b) {
                var aVal = a.children('label.dtsr-check-label')[0].innerHTML;
                var bVal = b.children('label.dtsr-check-label')[0].innerHTML;
                if (aVal < bVal) {
                    return -1;
                }
                else if (aVal > bVal) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            // Append all of the toggles that are to be inserted
            for (var _i = 0, togglesToInsert_1 = togglesToInsert; _i < togglesToInsert_1.length; _i++) {
                var toggle = togglesToInsert_1[_i];
                this.dom.creationForm.append(toggle);
            }
            // Insert the toggle label next to the first check box
            $(this.dom.creationForm.children('div.' + this.classes.checkRow)[0]).prepend(this.dom.toggleLabel);
            // Insert the creation modal and the background
            this.dom.background.appendTo(this.dom.dtContainer);
            this.dom.creation
                .append(this.dom.creationTitle)
                .append(this.dom.creationForm)
                .append(this.dom.createButtonRow)
                .appendTo(this.dom.dtContainer);
            $(this.s.dt.table().node()).trigger('dtsr-modal-inserted');
            var _loop_2 = function (toggle) {
                $(toggle.children('label:last-child')).on('click', function () {
                    toggle.children('input').prop('checked', !toggle.children('input').prop('checked'));
                });
            };
            // Allow the label to be clicked to toggle the checkbox
            for (var _a = 0, togglesToInsert_2 = togglesToInsert; _a < togglesToInsert_2.length; _a++) {
                var toggle = togglesToInsert_2[_a];
                _loop_2(toggle);
            }
            var creationButton = $('button.' + this.classes.creationButton.replace(/ /g, '.'));
            var inputs = this.dom.creationForm.find('input');
            // If there is an input focus on that
            if (inputs.length > 0) {
                $(inputs[0]).focus();
            }
            // Otherwise focus on the confirmation button
            else {
                creationButton.focus();
            }
            var background = $('div.' + this.classes.background.replace(/ /g, '.'));
            var keyupFunction = function (e) {
                if (e.key === 'Enter') {
                    creationButton.click();
                }
                else if (e.key === 'Escape') {
                    background.click();
                }
            };
            if (this.c.modalCloseButton) {
                this.dom.creation.append(this.dom.closeButton);
                this.dom.closeButton.on('click', function () { return background.click(); });
            }
            creationButton.on('click', function () {
                // Get the values of the checkBoxes
                var saveState = {
                    colReorder: _this.dom.colReorderToggle.children('input').is(':checked'),
                    columns: {
                        search: _this.dom.columnsSearchToggle.children('input').is(':checked'),
                        visible: _this.dom.columnsVisibleToggle.children('input').is(':checked')
                    },
                    length: _this.dom.lengthToggle.children('input').is(':checked'),
                    order: _this.dom.orderToggle.children('input').is(':checked'),
                    paging: _this.dom.pagingToggle.children('input').is(':checked'),
                    scroller: _this.dom.scrollerToggle.children('input').is(':checked'),
                    search: _this.dom.searchToggle.children('input').is(':checked'),
                    searchBuilder: _this.dom.searchBuilderToggle.children('input').is(':checked'),
                    searchPanes: _this.dom.searchPanesToggle.children('input').is(':checked'),
                    select: _this.dom.selectToggle.children('input').is(':checked')
                };
                // Call the buttons functionality passing in the identifier and what should be saved
                var success = buttonAction($('input.' + _this.classes.nameInput.replace(/ /g, '.')).val(), { saveState: saveState });
                if (success === true) {
                    // Remove the dom elements as operation has completed
                    _this.dom.background.remove();
                    _this.dom.creation.remove();
                    // Unbind the keyup function  - don't want it to run unnecessarily on every keypress that occurs
                    $(document).unbind('keyup', keyupFunction);
                }
                else {
                    _this.dom.creation.children('.' + _this.classes.modalError).remove();
                    _this.dom.creation.append(_this.dom[success + 'Error']);
                }
            });
            background.one('click', function () {
                // Remove the dome elements as operation has been cancelled
                _this.dom.background.remove();
                _this.dom.creation.remove();
                // Unbind the keyup function - don't want it to run unnecessarily on every keypress that occurs
                $(document).unbind('keyup', keyupFunction);
                // Rebuild the collection to ensure that the latest changes are present
                _this._collectionRebuild();
            });
            // Have to listen to the keyup event as `escape` doesn't trigger keypress
            $(document).on('keyup', keyupFunction);
            // Need to save the state before the focus is lost when the modal is interacted with
            this.s.dt.state.save();
        };
        /**
         * This callback is called when a state is removed.
         * This removes the state from storage and also strips it's button from the container
         *
         * @param identifier The value that is used to identify a state
         */
        StateRestoreCollection.prototype._removeCallback = function (identifier) {
            for (var i = 0; i < this.s.states.length; i++) {
                if (this.s.states[i].s.identifier === identifier) {
                    this.s.states.splice(i, 1);
                    i--;
                }
            }
            this._collectionRebuild();
            return true;
        };
        /**
         * Creates a new confirmation modal for the user to approve an action
         *
         * @param title The title that is to be displayed at the top of the modal
         * @param buttonText The text that is to be displayed in the confirmation button of the modal
         * @param buttonAction The action that should be taken when the confirmation button is pressed
         * @param modalContents The contents for the main body of the modal
         */
        StateRestoreCollection.prototype._newModal = function (title, buttonText, buttonAction, modalContents) {
            var _this = this;
            this.dom.background.appendTo(this.dom.dtContainer);
            this.dom.confirmationTitleRow.empty().append(title);
            var confirmationButton = $('<button class="' + this.classes.confirmationButton + ' ' + this.classes.dtButton + '">' +
                buttonText +
                '</button>');
            this.dom.confirmation
                .empty()
                .append(this.dom.confirmationTitleRow)
                .append(modalContents)
                .append($('<div class="' + this.classes.confirmationButtons + '"></div>')
                .append(confirmationButton))
                .appendTo(this.dom.dtContainer);
            $(this.s.dt.table().node()).trigger('dtsr-modal-inserted');
            var inputs = modalContents.children('input');
            // If there is an input focus on that
            if (inputs.length > 0) {
                $(inputs[0]).focus();
            }
            // Otherwise focus on the confirmation button
            else {
                confirmationButton.focus();
            }
            var background = $('div.' + this.classes.background.replace(/ /g, '.'));
            var keyupFunction = function (e) {
                // If enter same action as pressing the button
                if (e.key === 'Enter') {
                    confirmationButton.click();
                }
                // If escape close modal
                else if (e.key === 'Escape') {
                    background.click();
                }
            };
            // When the button is clicked, call the appropriate action,
            // remove the background and modal from the screen and unbind the keyup event.
            confirmationButton.on('click', function () {
                var success = buttonAction(true);
                if (success === true) {
                    _this.dom.background.remove();
                    _this.dom.confirmation.remove();
                    $(document).unbind('keyup', keyupFunction);
                    confirmationButton.off('click');
                }
                else {
                    _this.dom.confirmation.children('.' + _this.classes.modalError).remove();
                    _this.dom.confirmation.append(_this.dom[success + 'Error']);
                }
            });
            this.dom.confirmation.on('click', function (e) {
                e.stopPropagation();
            });
            // When the button is clicked, remove the background and modal from the screen and unbind the keyup event.
            background.one('click', function () {
                _this.dom.background.remove();
                _this.dom.confirmation.remove();
                $(document).unbind('keyup', keyupFunction);
            });
            $(document).on('keyup', keyupFunction);
        };
        /**
         * Private method that checks for previously created states on initialisation
         */
        StateRestoreCollection.prototype._searchForStates = function () {
            var _this = this;
            var keys = Object.keys(localStorage);
            var _loop_3 = function (key) {
                // eslint-disable-next-line no-useless-escape
                if (key.match(new RegExp('^DataTables_stateRestore_.*_' + location.pathname.replace(/\//g, '/') + '$')) ||
                    key.match(new RegExp('^DataTables_stateRestore_.*_' + location.pathname.replace(/\//g, '/') +
                        '_' + this_2.s.dt.table().node().id + '$'))) {
                    var loadedState_1 = JSON.parse(localStorage.getItem(key));
                    if (loadedState_1.stateRestore.isPreDefined ||
                        (loadedState_1.stateRestore.tableId &&
                            loadedState_1.stateRestore.tableId !== this_2.s.dt.table().node().id)) {
                        return "continue";
                    }
                    var that_1 = this_2;
                    var successCallback = function () {
                        this.s.savedState = loadedState_1;
                        that_1.s.states.push(this);
                        that_1._collectionRebuild();
                    };
                    var newState_1 = new StateRestore(this_2.s.dt, $.extend(true, {}, this_2.c, { saveState: loadedState_1.c.saveState }), loadedState_1.stateRestore.state, loadedState_1, false, successCallback);
                    $(this_2.s.dt.table().node()).on('dtsr-modal-inserted', function () {
                        newState_1.dom.confirmation.one('dtsr-remove', function () { return _this._removeCallback(newState_1.s.identifier); });
                        newState_1.dom.confirmation.one('dtsr-rename', function () { return _this._collectionRebuild(); });
                        newState_1.dom.confirmation.one('dtsr-save', function () { return _this._collectionRebuild(); });
                    });
                }
            };
            var this_2 = this;
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                _loop_3(key);
            }
        };
        StateRestoreCollection.version = '1.0.0';
        StateRestoreCollection.classes = {
            background: 'dtsr-background',
            checkBox: 'dtsr-check-box',
            checkLabel: 'dtsr-check-label',
            checkRow: 'dtsr-check-row',
            closeButton: 'dtsr-popover-close',
            colReorderToggle: 'dtsr-colReorder-toggle',
            columnsSearchToggle: 'dtsr-columns-search-toggle',
            columnsVisibleToggle: 'dtsr-columns-visible-toggle',
            confirmation: 'dtsr-confirmation',
            confirmationButton: 'dtsr-confirmation-button',
            confirmationButtons: 'dtsr-confirmation-buttons',
            confirmationMessage: 'dtsr-confirmation-message dtsr-name-label',
            confirmationText: 'dtsr-confirmation-text',
            confirmationTitle: 'dtsr-confirmation-title',
            confirmationTitleRow: 'dtsr-confirmation-title-row',
            creation: 'dtsr-creation',
            creationButton: 'dtsr-creation-button',
            creationForm: 'dtsr-creation-form',
            creationText: 'dtsr-creation-text',
            creationTitle: 'dtsr-creation-title',
            dtButton: 'dt-button',
            emptyStates: 'dtsr-emptyStates',
            formRow: 'dtsr-form-row',
            leftSide: 'dtsr-left',
            lengthToggle: 'dtsr-length-toggle',
            modalError: 'dtsr-modal-error',
            modalFoot: 'dtsr-modal-foot',
            nameInput: 'dtsr-name-input',
            nameLabel: 'dtsr-name-label',
            orderToggle: 'dtsr-order-toggle',
            pagingToggle: 'dtsr-paging-toggle',
            rightSide: 'dtsr-right',
            scrollerToggle: 'dtsr-scroller-toggle',
            searchBuilderToggle: 'dtsr-searchBuilder-toggle',
            searchPanesToggle: 'dtsr-searchPanes-toggle',
            searchToggle: 'dtsr-search-toggle',
            selectToggle: 'dtsr-select-toggle',
            toggleLabel: 'dtsr-toggle-title'
        };
        StateRestoreCollection.defaults = {
            _createInSaved: false,
            ajax: false,
            create: true,
            creationModal: false,
            i18n: {
                creationModal: {
                    button: 'Create',
                    colReorder: 'Column Order',
                    columns: {
                        search: 'Column Search',
                        visible: 'Column Visibility'
                    },
                    length: 'Page Length',
                    name: 'Name:',
                    order: 'Sorting',
                    paging: 'Paging',
                    scroller: 'Scroll Position',
                    search: 'Search',
                    searchBuilder: 'SearchBuilder',
                    searchPanes: 'SearchPanes',
                    select: 'Select',
                    title: 'Create New State',
                    toggleLabel: 'Includes:'
                },
                duplicateError: 'A state with this name already exists.',
                emptyError: 'Name cannot be empty.',
                emptyStates: 'No saved states',
                removeConfirm: 'Are you sure you want to remove %s?',
                removeError: 'Failed to remove state.',
                removeJoiner: ' and ',
                removeSubmit: 'Remove',
                removeTitle: 'Remove State',
                renameButton: 'Rename',
                renameLabel: 'New Name for %s:',
                renameTitle: 'Rename State'
            },
            modalCloseButton: true,
            preDefined: {},
            remove: true,
            rename: true,
            save: true,
            saveState: {
                colReorder: true,
                columns: {
                    search: true,
                    visible: true
                },
                length: true,
                order: true,
                paging: true,
                scroller: true,
                search: true,
                searchBuilder: true,
                searchPanes: true,
                select: true
            },
            splitSecondaries: [
                'updateState',
                'renameState',
                'removeState'
            ],
            toggle: {
                colReorder: false,
                columns: {
                    search: false,
                    visible: false
                },
                length: false,
                order: false,
                paging: false,
                scroller: false,
                search: false,
                searchBuilder: false,
                searchPanes: false,
                select: false
            }
        };
        return StateRestoreCollection;
    }());

    /*! StateRestore 1.1.1
     * 2019-2022 SpryMedia Ltd - datatables.net/license
     */
    // DataTables extensions common UMD. Note that this allows for AMD, CommonJS
    // (with window and jQuery being allowed as parameters to the returned
    // function) or just default browser loading.
    (function (factory) {
        if (typeof define === 'function' && define.amd) {
            // AMD
            define(['jquery', 'datatables.net'], function ($) {
                return factory($, window, document);
            });
        }
        else if (typeof exports === 'object') {
            // CommonJS
            module.exports = function (root, $) {
                if (!root) {
                    root = window;
                }
                if (!$ || !$.fn.dataTable) {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    $ = require('datatables.net')(root, $).$;
                }
                return factory($, root, root.document);
            };
        }
        else {
            // Browser - assume jQuery has already been loaded
            factory(window.jQuery, window, document);
        }
    }(function ($, window, document) {
        setJQuery$1($);
        setJQuery($);
        var dataTable = $.fn.dataTable;
        $.fn.dataTable.StateRestore = StateRestore;
        $.fn.DataTable.StateRestore = StateRestore;
        $.fn.dataTable.StateRestoreCollection = StateRestoreCollection;
        $.fn.DataTable.StateRestoreCollection = StateRestoreCollection;
        var apiRegister = $.fn.dataTable.Api.register;
        apiRegister('stateRestore()', function () {
            return this;
        });
        apiRegister('stateRestore.state()', function (identifier) {
            var ctx = this.context[0];
            if (!ctx._stateRestore) {
                var api = $.fn.DataTable.Api(ctx);
                var src = new $.fn.dataTable.StateRestoreCollection(api, {});
                _stateRegen(api, src);
            }
            this[0] = ctx._stateRestore.getState(identifier);
            return this;
        });
        apiRegister('stateRestore.state.add()', function (identifier, options) {
            var ctx = this.context[0];
            if (!ctx._stateRestore) {
                var api = $.fn.DataTable.Api(ctx);
                var src = new $.fn.dataTable.StateRestoreCollection(api, {});
                _stateRegen(api, src);
            }
            if (!ctx._stateRestore.c.create) {
                return this;
            }
            if (ctx._stateRestore.addState) {
                var states = ctx._stateRestore.s.states;
                var ids = [];
                for (var _i = 0, states_1 = states; _i < states_1.length; _i++) {
                    var intState = states_1[_i];
                    ids.push(intState.s.identifier);
                }
                ctx._stateRestore.addState(identifier, ids, options);
                return this;
            }
        });
        apiRegister('stateRestore.states()', function (ids) {
            var ctx = this.context[0];
            if (!ctx._stateRestore) {
                var api = $.fn.DataTable.Api(ctx);
                var src = new $.fn.dataTable.StateRestoreCollection(api, {});
                _stateRegen(api, src);
            }
            this.length = 0;
            this.push.apply(this, ctx._stateRestore.getStates(ids));
            return this;
        });
        apiRegister('stateRestore.state().save()', function () {
            var ctx = this[0];
            // Check if saving states is allowed
            if (ctx.c.save) {
                ctx.save();
            }
            return this;
        });
        apiRegister('stateRestore.state().rename()', function (newIdentifier) {
            var ctx = this.context[0];
            var state = this[0];
            // Check if renaming states is allowed
            if (state.c.save) {
                var states = ctx._stateRestore.s.states;
                var ids = [];
                for (var _i = 0, states_2 = states; _i < states_2.length; _i++) {
                    var intState = states_2[_i];
                    ids.push(intState.s.identifier);
                }
                state.rename(newIdentifier, ids);
            }
            return this;
        });
        apiRegister('stateRestore.state().load()', function () {
            var ctx = this[0];
            ctx.load();
            return this;
        });
        apiRegister('stateRestore.state().remove()', function (skipModal) {
            var ctx = this[0];
            // Check if removal of states is allowed
            if (ctx.c.remove) {
                ctx.remove(skipModal);
            }
            return this;
        });
        apiRegister('stateRestore.states().remove()', function (skipModal) {
            var _this = this;
            var removeAllCallBack = function (skipModalIn) {
                var success = true;
                var that = _this.toArray();
                while (that.length > 0) {
                    var set = that[0];
                    if (set !== undefined && set.c.remove) {
                        var tempSuccess = set.remove(skipModalIn);
                        if (tempSuccess !== true) {
                            success = tempSuccess;
                        }
                        else {
                            that.splice(0, 1);
                        }
                    }
                    else {
                        break;
                    }
                }
                return success;
            };
            if (this.context[0]._stateRestore.c.remove) {
                if (skipModal) {
                    removeAllCallBack(skipModal);
                }
                else {
                    this.context[0]._stateRestore.removeAll(removeAllCallBack);
                }
            }
            return this;
        });
        apiRegister('stateRestore.activeStates()', function () {
            var ctx = this.context[0];
            this.length = 0;
            if (!ctx._stateRestore) {
                var api = $.fn.DataTable.Api(ctx);
                var src = new $.fn.dataTable.StateRestoreCollection(api, {});
                _stateRegen(api, src);
            }
            if (ctx._stateRestore) {
                this.push.apply(this, ctx._stateRestore.findActive());
            }
            return this;
        });
        $.fn.dataTable.ext.buttons.stateRestore = {
            action: function (e, dt, node, config) {
                config._stateRestore.load();
                node.blur();
            },
            config: {
                split: ['updateState', 'renameState', 'removeState']
            },
            text: function (dt) {
                return dt.i18n('buttons.stateRestore', 'State %d', dt.stateRestore.states()[0].length + 1);
            }
        };
        $.fn.dataTable.ext.buttons.updateState = {
            action: function (e, dt, node, config) {
                $('div.dt-button-background').click();
                config.parent._stateRestore.save();
            },
            text: function (dt) {
                return dt.i18n('buttons.updateState', 'Update');
            }
        };
        $.fn.dataTable.ext.buttons.savedStates = {
            buttons: [],
            extend: 'collection',
            init: function (dt, node, config) {
                dt.on('stateRestore-change', function () {
                    dt.button(node).text(dt.i18n('buttons.savedStates', 'Saved States', dt.stateRestore.states().length));
                });
                if (dt.settings()[0]._stateRestore === undefined) {
                    _buttonInit(dt, config);
                }
            },
            name: 'SaveStateRestore',
            text: function (dt) {
                return dt.i18n('buttons.savedStates', 'Saved States', 0);
            }
        };
        $.fn.dataTable.ext.buttons.savedStatesCreate = {
            buttons: [],
            extend: 'collection',
            init: function (dt, node, config) {
                dt.on('stateRestore-change', function () {
                    dt.button(node).text(dt.i18n('buttons.savedStates', 'Saved States', dt.stateRestore.states().length));
                });
                if (dt.settings()[0]._stateRestore === undefined) {
                    if (config.config === undefined) {
                        config.config = {};
                    }
                    config.config._createInSaved = true;
                    _buttonInit(dt, config);
                }
            },
            name: 'SaveStateRestore',
            text: function (dt) {
                return dt.i18n('buttons.savedStates', 'Saved States', 0);
            }
        };
        $.fn.dataTable.ext.buttons.createState = {
            action: function (e, dt, node, config) {
                e.stopPropagation();
                var stateRestoreOpts = dt.settings()[0]._stateRestore.c;
                var language = dt.settings()[0].oLanguage;
                // If creation/saving is not allowed then return
                if (!stateRestoreOpts.create || !stateRestoreOpts.save) {
                    return;
                }
                var prevStates = dt.stateRestore.states().toArray();
                // Create a replacement regex based on the i18n values
                var defaultString = language.buttons !== undefined && language.buttons.stateRestore !== undefined ?
                    language.buttons.stateRestore :
                    'State ';
                var replaceRegex;
                if (defaultString.indexOf('%d') === defaultString.length - 3) {
                    replaceRegex = new RegExp(defaultString.replace(/%d/g, ''));
                }
                else {
                    var splitString = defaultString.split('%d');
                    replaceRegex = [];
                    for (var _i = 0, splitString_1 = splitString; _i < splitString_1.length; _i++) {
                        var split = splitString_1[_i];
                        replaceRegex.push(new RegExp(split));
                    }
                }
                var getId = function (identifier) {
                    var id;
                    if (Array.isArray(replaceRegex)) {
                        id = identifier;
                        for (var _i = 0, replaceRegex_1 = replaceRegex; _i < replaceRegex_1.length; _i++) {
                            var reg = replaceRegex_1[_i];
                            id = id.replace(reg, '');
                        }
                    }
                    else {
                        id = identifier.replace(replaceRegex, '');
                    }
                    // If the id after replacement is not a number, or the length is the same as before,
                    //  it has been customised so return 0
                    if (isNaN(+id) || id.length === identifier) {
                        return 0;
                    }
                    // Otherwise return the number that has been assigned previously
                    else {
                        return +id;
                    }
                };
                // Extract the numbers from the identifiers that use the standard naming convention
                var identifiers = prevStates
                    .map(function (state) { return getId(state.s.identifier); })
                    .sort(function (a, b) { return +a < +b ?
                    1 :
                    +a > +b ?
                        -1 :
                        0; });
                var lastNumber = identifiers[0];
                dt.stateRestore.state.add(dt.i18n('buttons.stateRestore', 'State %d', lastNumber !== undefined ? lastNumber + 1 : 1), config.config);
                var states = dt.stateRestore.states().sort(function (a, b) {
                    var aId = +getId(a.s.identifier);
                    var bId = +getId(b.s.identifier);
                    return aId > bId ?
                        1 :
                        aId < bId ?
                            -1 :
                            0;
                });
                var button = dt.button('SaveStateRestore:name');
                var stateButtons = button[0] !== undefined && button[0].inst.c.buttons[0].buttons !== undefined ?
                    button[0].inst.c.buttons[0].buttons :
                    [];
                // remove any states from the previous rebuild - if they are still there they will be added later
                for (var i = 0; i < stateButtons.length; i++) {
                    if (stateButtons[i].extend === 'stateRestore') {
                        stateButtons.splice(i, 1);
                        i--;
                    }
                }
                if (stateRestoreOpts._createInSaved) {
                    stateButtons.push('createState');
                    stateButtons.push('');
                }
                for (var _a = 0, states_3 = states; _a < states_3.length; _a++) {
                    var state = states_3[_a];
                    var split = Object.assign([], stateRestoreOpts.splitSecondaries);
                    if (split.includes('updateState') && !stateRestoreOpts.save) {
                        split.splice(split.indexOf('updateState'), 1);
                    }
                    if (split.includes('renameState') &&
                        (!stateRestoreOpts.save || !stateRestoreOpts.rename)) {
                        split.splice(split.indexOf('renameState'), 1);
                    }
                    if (split.includes('removeState') && !stateRestoreOpts.remove) {
                        split.splice(split.indexOf('removeState'), 1);
                    }
                    if (split.length > 0 &&
                        !split.includes('<h3>' + state.s.identifier + '</h3>')) {
                        split.unshift('<h3>' + state.s.identifier + '</h3>');
                    }
                    stateButtons.push({
                        _stateRestore: state,
                        attr: {
                            title: state.s.identifier
                        },
                        config: {
                            split: split
                        },
                        extend: 'stateRestore',
                        text: state.s.identifier
                    });
                }
                dt.button('SaveStateRestore:name').collectionRebuild(stateButtons);
                node.blur();
                // Need to disable the removeAllStates button if there are no states and it is present
                var buttons = dt.buttons();
                for (var _b = 0, buttons_1 = buttons; _b < buttons_1.length; _b++) {
                    var butt = buttons_1[_b];
                    if ($(butt.node).hasClass('dtsr-removeAllStates')) {
                        if (states.length === 0) {
                            dt.button(butt.node).disable();
                        }
                        else {
                            dt.button(butt.node).enable();
                        }
                    }
                }
            },
            init: function (dt, node, config) {
                if (dt.settings()[0]._stateRestore === undefined && dt.button('SaveStateRestore:name').length > 1) {
                    _buttonInit(dt, config);
                }
            },
            text: function (dt) {
                return dt.i18n('buttons.createState', 'Create State');
            }
        };
        $.fn.dataTable.ext.buttons.removeState = {
            action: function (e, dt, node, config) {
                config.parent._stateRestore.remove();
                node.blur();
            },
            text: function (dt) {
                return dt.i18n('buttons.removeState', 'Remove');
            }
        };
        $.fn.dataTable.ext.buttons.removeAllStates = {
            action: function (e, dt, node) {
                dt.stateRestore.states().remove(true);
                node.blur();
            },
            className: 'dt-button dtsr-removeAllStates',
            init: function (dt, node) {
                if (dt.stateRestore.states().length === 0) {
                    $(node).addClass('disabled');
                }
            },
            text: function (dt) {
                return dt.i18n('buttons.removeAllStates', 'Remove All States');
            }
        };
        $.fn.dataTable.ext.buttons.renameState = {
            action: function (e, dt, node, config) {
                var states = dt.settings()[0]._stateRestore.s.states;
                var ids = [];
                for (var _i = 0, states_4 = states; _i < states_4.length; _i++) {
                    var state = states_4[_i];
                    ids.push(state.s.identifier);
                }
                config.parent._stateRestore.rename(undefined, ids);
                node.blur();
            },
            text: function (dt) {
                return dt.i18n('buttons.renameState', 'Rename');
            }
        };
        function _init(settings, options) {
            if (options === void 0) { options = null; }
            var api = new dataTable.Api(settings);
            var opts = options
                ? options
                : api.init().stateRestore || dataTable.defaults.stateRestore;
            var stateRestore = new StateRestoreCollection(api, opts);
            _stateRegen(api, stateRestore);
            return stateRestore;
        }
        /**
         * Initialisation function if initialising using a button
         *
         * @param dt The datatables instance
         * @param config the config for the button
         */
        function _buttonInit(dt, config) {
            var SRC = new $.fn.dataTable.StateRestoreCollection(dt, config.config);
            _stateRegen(dt, SRC);
        }
        function _stateRegen(dt, src) {
            var states = dt.stateRestore.states();
            var button = dt.button('SaveStateRestore:name');
            var stateButtons = button[0] !== undefined && button[0].inst.c.buttons[0].buttons !== undefined ?
                button[0].inst.c.buttons[0].buttons :
                [];
            var stateRestoreOpts = dt.settings()[0]._stateRestore.c;
            // remove any states from the previous rebuild - if they are still there they will be added later
            for (var i = 0; i < stateButtons.length; i++) {
                if (stateButtons[i].extend === 'stateRestore') {
                    stateButtons.splice(i, 1);
                    i--;
                }
            }
            if (stateRestoreOpts._createInSaved) {
                stateButtons.push('createState');
            }
            if (states === undefined || states.length === 0) {
                stateButtons.push('<span class="' + src.classes.emptyStates + '">' +
                    dt.i18n('stateRestore.emptyStates', src.c.i18n.emptyStates) +
                    '</span>');
            }
            else {
                for (var _i = 0, states_5 = states; _i < states_5.length; _i++) {
                    var state = states_5[_i];
                    var split = Object.assign([], stateRestoreOpts.splitSecondaries);
                    if (split.includes('updateState') && !stateRestoreOpts.save) {
                        split.splice(split.indexOf('updateState'), 1);
                    }
                    if (split.includes('renameState') &&
                        (!stateRestoreOpts.save || !stateRestoreOpts.rename)) {
                        split.splice(split.indexOf('renameState'), 1);
                    }
                    if (split.includes('removeState') && !stateRestoreOpts.remove) {
                        split.splice(split.indexOf('removeState'), 1);
                    }
                    if (split.length > 0 &&
                        !split.includes('<h3>' + state.s.identifier + '</h3>')) {
                        split.unshift('<h3>' + state.s.identifier + '</h3>');
                    }
                    stateButtons.push({
                        _stateRestore: state,
                        attr: {
                            title: state.s.identifier
                        },
                        config: {
                            split: split
                        },
                        extend: 'stateRestore',
                        text: state.s.identifier
                    });
                }
            }
            dt.button('SaveStateRestore:name').collectionRebuild(stateButtons);
            // Need to disable the removeAllStates button if there are no states and it is present
            var buttons = dt.buttons();
            for (var _a = 0, buttons_2 = buttons; _a < buttons_2.length; _a++) {
                var butt = buttons_2[_a];
                if ($(butt.node).hasClass('dtsr-removeAllStates')) {
                    if (states.length === 0) {
                        dt.button(butt.node).disable();
                    }
                    else {
                        dt.button(butt.node).enable();
                    }
                }
            }
        }
        // Attach a listener to the document which listens for DataTables initialisation
        // events so we can automatically initialise
        $(document).on('preInit.dt.dtsr', function (e, settings) {
            if (e.namespace !== 'dt') {
                return;
            }
            if (settings.oInit.stateRestore ||
                dataTable.defaults.stateRestore) {
                if (!settings._stateRestore) {
                    _init(settings, null);
                }
            }
        });
    }));

})();


/*! Bootstrap integration for DataTables' StateRestore
 * ©2016 SpryMedia Ltd - datatables.net/license
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery', 'datatables.net-bs4', 'datatables.net-staterestore'], function ($) {
            return factory($);
        });
    }
    else if (typeof exports === 'object') {
        // CommonJS
        module.exports = function (root, $) {
            if (!root) {
                root = window;
            }
            if (!$ || !$.fn.dataTable) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                $ = require('datatables.net-bs4')(root, $).$;
            }
            if (!$.fn.dataTable.StateRestore) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                require('datatables.net-staterestore')(root, $);
            }
            return factory($);
        };
    }
    else {
        // Browser
        factory(jQuery);
    }
}(function ($) {
    'use strict';
    var dataTable = $.fn.dataTable;
    $.extend(true, dataTable.StateRestoreCollection.classes, {
        checkBox: 'dtsr-check-box form-check-input',
        creationButton: 'dtsr-creation-button btn btn-secondary',
        creationForm: 'dtsr-creation-form modal-body',
        creationText: 'dtsr-creation-text modal-header',
        creationTitle: 'dtsr-creation-title modal-title',
        nameInput: 'dtsr-name-input form-control'
    });
    $.extend(true, dataTable.StateRestore.classes, {
        confirmationButton: 'dtsr-confirmation-button btn btn-secondary',
        input: 'dtsr-input form-control'
    });
    return dataTable.stateRestore;
}));


