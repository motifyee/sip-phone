// Image Editor
// ============
function CreateImageEditor(buddy, placeholderImage) {
	// Show Interface
	// ==============
	console.log('Setting Up ImageEditor...');
	if ($('#contact-' + buddy + '-imagePastePreview').is(':visible')) {
		console.log('Resetting ImageEditor...');
		$('#contact-' + buddy + '-imagePastePreview').empty();
		RemoveCanvas('contact-' + buddy + '-imageCanvas');
	} else {
		$('#contact-' + buddy + '-imagePastePreview').show();
	}
	// Create UI
	// =========

	var toolBarDiv = $('<div/>');
	toolBarDiv.css('margin-bottom', '5px');
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Select" onclick="ImageEditor_Select(\'' +
			buddy +
			'\')"><i class="fa fa-mouse-pointer"></i></button>'
	);
	toolBarDiv.append('&nbsp;|&nbsp;');
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Draw" onclick="ImageEditor_FreedrawPen(\'' +
			buddy +
			'\')"><i class="fa fa-pencil"></i></button>'
	);
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Paint" onclick="ImageEditor_FreedrawPaint(\'' +
			buddy +
			'\')"><i class="fa fa-paint-brush"></i></button>'
	);
	toolBarDiv.append('&nbsp;|&nbsp;');
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Select Line Color" onclick="ImageEditor_SetectLineColor(\'' +
			buddy +
			'\')"><i class="fa fa-pencil-square-o" style="color:rgb(255, 0, 0)"></i></button>'
	);
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Select Fill Color" onclick="ImageEditor_SetectFillColor(\'' +
			buddy +
			'\')"><i class="fa fa-pencil-square" style="color:rgb(255, 0, 0)"></i></button>'
	);
	toolBarDiv.append('&nbsp;|&nbsp;');
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Add Circle" onclick="ImageEditor_AddCircle(\'' +
			buddy +
			'\')"><i class="fa fa-circle"></i></button>'
	);
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Add Rectangle" onclick="ImageEditor_AddRectangle(\'' +
			buddy +
			'\')"><i class="fa fa-stop"></i></button>'
	);
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Add Triangle" onclick="ImageEditor_AddTriangle(\'' +
			buddy +
			'\')"><i class="fa fa-play"></i></button>'
	);
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Add Emoji" onclick="ImageEditor_SetectEmoji(\'' +
			buddy +
			'\')"><i class="fa fa-smile-o"></i></button>'
	);
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Add Text" onclick="ImageEditor_AddText(\'' +
			buddy +
			'\')"><i class="fa fa-font"></i></button>'
	);
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Delete Selected Items" onclick="ImageEditor_Clear(\'' +
			buddy +
			'\')"><i class="fa fa-times"></i></button>'
	);
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Clear All" onclick="ImageEditor_ClearAll(\'' +
			buddy +
			'\')"><i class="fa fa-trash"></i></button>'
	);
	toolBarDiv.append('&nbsp;|&nbsp;');
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Pan" onclick="ImageEditor_Pan(\'' +
			buddy +
			'\')"><i class="fa fa-hand-paper-o"></i></button>'
	);
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Zoom In" onclick="ImageEditor_ZoomIn(\'' +
			buddy +
			'\')"><i class="fa fa-search-plus"></i></button>'
	);
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Zoom Out" onclick="ImageEditor_ZoomOut(\'' +
			buddy +
			'\')"><i class="fa fa-search-minus"></i></button>'
	);
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Reset Pan & Zoom" onclick="ImageEditor_ResetZoom(\'' +
			buddy +
			'\')"><i class="fa fa-search" aria-hidden="true"></i></button>'
	);
	toolBarDiv.append('&nbsp;|&nbsp;');
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Cancel" onclick="ImageEditor_Cancel(\'' +
			buddy +
			'\')"><i class="fa fa-times-circle"></i></button>'
	);
	toolBarDiv.append(
		'<button class="toolBarButtons" title="Send" onclick="ImageEditor_Send(\'' +
			buddy +
			'\')"><i class="fa fa-paper-plane"></i></button>'
	);
	$('#contact-' + buddy + '-imagePastePreview').append(toolBarDiv);

	// Create the canvas
	// =================
	var newCanvas = $('<canvas/>');
	newCanvas.prop('id', 'contact-' + buddy + '-imageCanvas');
	newCanvas.css('border', '1px solid #CCCCCC');
	$('#contact-' + buddy + '-imagePastePreview').append(newCanvas);
	console.log('Canvas for ImageEditor created...');

	var imgWidth = placeholderImage.width;
	var imgHeight = placeholderImage.height;
	var maxWidth = $('#contact-' + buddy + '-imagePastePreview').width() - 2; // for the border
	var maxHeight = 480;
	$('#contact-' + buddy + '-imageCanvas').prop('width', maxWidth);
	$('#contact-' + buddy + '-imageCanvas').prop('height', maxHeight);

	// Handle Initial Zoom
	var zoomToFitImage = 1;
	var zoomWidth = 1;
	var zoomHeight = 1;
	if (imgWidth > maxWidth || imgHeight > maxHeight) {
		if (imgWidth > maxWidth) {
			zoomWidth = maxWidth / imgWidth;
		}
		if (imgHeight > maxHeight) {
			zoomHeight = maxHeight / imgHeight;
			console.log('Scale to fit height: ' + zoomHeight);
		}
		zoomToFitImage = Math.min(zoomWidth, zoomHeight); // need the smallest because less is more zoom.
		console.log('Scale down to fit: ' + zoomToFitImage);

		// Shape the canvas to fit the image and the new zoom
		imgWidth = imgWidth * zoomToFitImage;
		imgHeight = imgHeight * zoomToFitImage;
		console.log('resizing canvas to fit new image size...');
		$('#contact-' + buddy + '-imageCanvas').prop('width', imgWidth);
		$('#contact-' + buddy + '-imageCanvas').prop('height', imgHeight);
	} else {
		console.log('Image is able to fit, resizing canvas...');
		$('#contact-' + buddy + '-imageCanvas').prop('width', imgWidth);
		$('#contact-' + buddy + '-imageCanvas').prop('height', imgHeight);
	}

	// $("#contact-" + buddy + "-imageCanvas").css("cursor", "zoom-in");

	// Fabric Canvas API
	// =================
	console.log('Creating fabric API...');
	var canvas = new fabric.Canvas('contact-' + buddy + '-imageCanvas');
	canvas.id = 'contact-' + buddy + '-imageCanvas';
	canvas.ToolSelected = 'None';
	canvas.PenColour = 'rgb(255, 0, 0)';
	canvas.PenWidth = 2;
	canvas.PaintColour = 'rgba(227, 230, 3, 0.6)';
	canvas.PaintWidth = 10;
	canvas.FillColour = 'rgb(255, 0, 0)';
	canvas.isDrawingMode = false;

	canvas.selectionColor = 'rgba(112,179,233,0.25)';
	canvas.selectionBorderColor = 'rgba(112,179,233, 0.8)';
	canvas.selectionLineWidth = 1;

	// canvas.setCursor('default');
	// canvas.rotationCursor = 'crosshair';
	// canvas.notAllowedCursor = 'not-allowed'
	// canvas.moveCursor = 'move';
	// canvas.hoverCursor = 'move';
	// canvas.freeDrawingCursor = 'crosshair';
	// canvas.defaultCursor = 'move';

	// canvas.selection = false; // Indicates whether group selection should be enabled
	// canvas.selectionKey = 'shiftKey' // Indicates which key or keys enable multiple click selection

	// Zoom to fit Width or Height
	// ===========================
	canvas.setZoom(zoomToFitImage);

	// Canvas Events
	// =============
	canvas.on('mouse:down', function (opt) {
		var evt = opt.e;

		if (this.ToolSelected == 'Pan') {
			this.isDragging = true;
			this.selection = false;
			this.lastPosX = evt.clientX;
			this.lastPosY = evt.clientY;
		}
		// Make nicer grab handles
		if (opt.target != null) {
			if (evt.altKey === true) {
				opt.target.lockMovementX = true;
			}
			if (evt.shiftKey === true) {
				opt.target.lockMovementY = true;
			}
			opt.target.set({
				transparentCorners: false,
				borderColor: 'rgba(112,179,233, 0.4)',
				cornerColor: 'rgba(112,179,233, 0.8)',
				cornerSize: 6,
			});
		}
	});
	canvas.on('mouse:move', function (opt) {
		if (this.isDragging) {
			var e = opt.e;
			this.viewportTransform[4] += e.clientX - this.lastPosX;
			this.viewportTransform[5] += e.clientY - this.lastPosY;
			this.requestRenderAll();
			this.lastPosX = e.clientX;
			this.lastPosY = e.clientY;
		}
	});
	canvas.on('mouse:up', function (opt) {
		this.isDragging = false;
		this.selection = true;
		if (opt.target != null) {
			opt.target.lockMovementX = false;
			opt.target.lockMovementY = false;
		}
	});
	canvas.on('mouse:wheel', function (opt) {
		var delta = opt.e.deltaY;
		var pointer = canvas.getPointer(opt.e);
		var zoom = canvas.getZoom();
		zoom = zoom + delta / 200;
		if (zoom > 10) zoom = 10;
		if (zoom < 0.1) zoom = 0.1;
		canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
		opt.e.preventDefault();
		opt.e.stopPropagation();
	});

	// Add Image
	// ==========
	canvas.backgroundImage = new fabric.Image(placeholderImage);

	CanvasCollection.push(canvas);

	// Add Key Press Events
	// ====================
	$('#contact-' + buddy + '-imagePastePreview').keydown(function (evt) {
		evt = evt || window.event;
		var key = evt.keyCode;
		console.log('Key press on Image Editor (' + buddy + '): ' + key);

		// Delete Key
		if (key == 46) ImageEditor_Clear(buddy);
	});

	console.log('ImageEditor: ' + canvas.id + ' created');

	ImageEditor_FreedrawPen(buddy);
}
function GetCanvas(canvasId) {
	for (var c = 0; c < CanvasCollection.length; c++) {
		try {
			if (CanvasCollection[c].id == canvasId) return CanvasCollection[c];
		} catch (e) {
			console.warn('CanvasCollection.id not available');
		}
	}
	return null;
}
function RemoveCanvas(canvasId) {
	for (var c = 0; c < CanvasCollection.length; c++) {
		try {
			if (CanvasCollection[c].id == canvasId) {
				console.log('Found Old Canvas, Disposing...');

				CanvasCollection[c].clear();
				CanvasCollection[c].dispose();

				CanvasCollection[c].id = '--deleted--';

				console.log('CanvasCollection.splice(' + c + ', 1)');
				CanvasCollection.splice(c, 1);
				break;
			}
		} catch (e) {}
	}
	console.log('There are ' + CanvasCollection.length + ' canvas now.');
}
var ImageEditor_Select = function (buddy) {
	var canvas = GetCanvas('contact-' + buddy + '-imageCanvas');
	if (canvas != null) {
		canvas.ToolSelected = 'none';
		canvas.isDrawingMode = false;
		return true;
	}
	return false;
};
var ImageEditor_FreedrawPen = function (buddy) {
	var canvas = GetCanvas('contact-' + buddy + '-imageCanvas');
	if (canvas != null) {
		canvas.freeDrawingBrush.color = canvas.PenColour;
		canvas.freeDrawingBrush.width = canvas.PenWidth;
		canvas.ToolSelected = 'Draw';
		canvas.isDrawingMode = true;
		console.log(canvas);
		return true;
	}
	return false;
};
var ImageEditor_FreedrawPaint = function (buddy) {
	var canvas = GetCanvas('contact-' + buddy + '-imageCanvas');
	if (canvas != null) {
		canvas.freeDrawingBrush.color = canvas.PaintColour;
		canvas.freeDrawingBrush.width = canvas.PaintWidth;
		canvas.ToolSelected = 'Paint';
		canvas.isDrawingMode = true;
		return true;
	}
	return false;
};
var ImageEditor_Pan = function (buddy) {
	var canvas = GetCanvas('contact-' + buddy + '-imageCanvas');
	if (canvas != null) {
		canvas.ToolSelected = 'Pan';
		canvas.isDrawingMode = false;
		return true;
	}
	return false;
};
var ImageEditor_ResetZoom = function (buddy) {
	var canvas = GetCanvas('contact-' + buddy + '-imageCanvas');
	if (canvas != null) {
		canvas.setZoom(1);
		canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
		// canvas.viewportTransform[4] = 0;
		// canvas.viewportTransform[5] = 0;
		return true;
	}
	return false;
};
var ImageEditor_ZoomIn = function (buddy) {
	var canvas = GetCanvas('contact-' + buddy + '-imageCanvas');
	if (canvas != null) {
		var zoom = canvas.getZoom();
		zoom = zoom + 0.5;
		if (zoom > 10) zoom = 10;
		if (zoom < 0.1) zoom = 0.1;

		var point = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
		var center = fabric.util.transformPoint(point, canvas.viewportTransform);

		canvas.zoomToPoint(point, zoom);

		return true;
	}
	return false;
};
var ImageEditor_ZoomOut = function (buddy) {
	var canvas = GetCanvas('contact-' + buddy + '-imageCanvas');
	if (canvas != null) {
		var zoom = canvas.getZoom();
		zoom = zoom - 0.5;
		if (zoom > 10) zoom = 10;
		if (zoom < 0.1) zoom = 0.1;

		var point = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
		var center = fabric.util.transformPoint(point, canvas.viewportTransform);

		canvas.zoomToPoint(point, zoom);

		return true;
	}
	return false;
};
var ImageEditor_AddCircle = function (buddy) {
	var canvas = GetCanvas('contact-' + buddy + '-imageCanvas');
	if (canvas != null) {
		canvas.ToolSelected = 'none';
		canvas.isDrawingMode = false;
		var circle = new fabric.Circle({
			radius: 20,
			fill: canvas.FillColour,
		});
		canvas.add(circle);
		canvas.centerObject(circle);
		canvas.setActiveObject(circle);
		return true;
	}
	return false;
};
var ImageEditor_AddRectangle = function (buddy) {
	var canvas = GetCanvas('contact-' + buddy + '-imageCanvas');
	if (canvas != null) {
		canvas.ToolSelected = 'none';
		canvas.isDrawingMode = false;
		var rectangle = new fabric.Rect({
			width: 40,
			height: 40,
			fill: canvas.FillColour,
		});
		canvas.add(rectangle);
		canvas.centerObject(rectangle);
		canvas.setActiveObject(rectangle);
		return true;
	}
	return false;
};
var ImageEditor_AddTriangle = function (buddy) {
	var canvas = GetCanvas('contact-' + buddy + '-imageCanvas');
	if (canvas != null) {
		canvas.ToolSelected = 'none';
		canvas.isDrawingMode = false;
		var triangle = new fabric.Triangle({
			width: 40,
			height: 40,
			fill: canvas.FillColour,
		});
		canvas.add(triangle);
		canvas.centerObject(triangle);
		canvas.setActiveObject(triangle);
		return true;
	}
	return false;
};
var ImageEditor_AddEmoji = function (buddy) {
	var canvas = GetCanvas('contact-' + buddy + '-imageCanvas');
	if (canvas != null) {
		canvas.ToolSelected = 'none';
		canvas.isDrawingMode = false;
		var text = new fabric.Text(String.fromCodePoint(0x1f642), { fontSize: 24 });
		canvas.add(text);
		canvas.centerObject(text);
		canvas.setActiveObject(text);
		return true;
	}
	return false;
};
var ImageEditor_AddText = function (buddy, textString) {
	var canvas = GetCanvas('contact-' + buddy + '-imageCanvas');
	if (canvas != null) {
		canvas.ToolSelected = 'none';
		canvas.isDrawingMode = false;
		var text = new fabric.IText(textString, {
			fill: canvas.FillColour,
			fontFamily: 'arial',
			fontSize: 18,
		});
		canvas.add(text);
		canvas.centerObject(text);
		canvas.setActiveObject(text);
		return true;
	}
	return false;
};
var ImageEditor_Clear = function (buddy) {
	var canvas = GetCanvas('contact-' + buddy + '-imageCanvas');
	if (canvas != null) {
		canvas.ToolSelected = 'none';
		canvas.isDrawingMode = false;

		var activeObjects = canvas.getActiveObjects();
		for (var i = 0; i < activeObjects.length; i++) {
			canvas.remove(activeObjects[i]);
		}
		canvas.discardActiveObject();

		return true;
	}
	return false;
};
var ImageEditor_ClearAll = function (buddy) {
	var canvas = GetCanvas('contact-' + buddy + '-imageCanvas');
	if (canvas != null) {
		var savedBgImage = canvas.backgroundImage;

		canvas.ToolSelected = 'none';
		canvas.isDrawingMode = false;
		canvas.clear();

		canvas.backgroundImage = savedBgImage;
		return true;
	}
	return false;
};
var ImageEditor_Cancel = function (buddy) {
	console.log('Removing ImageEditor...');

	$('#contact-' + buddy + '-imagePastePreview').empty();
	RemoveCanvas('contact-' + buddy + '-imageCanvas');
	$('#contact-' + buddy + '-imagePastePreview').hide();
};
var ImageEditor_Send = function (buddy) {
	var canvas = GetCanvas('contact-' + buddy + '-imageCanvas');
	if (canvas != null) {
		var imgData = canvas.toDataURL({ format: 'png' });
		SendImageDataMessage(buddy, imgData);
		return true;
	}
	return false;
};
