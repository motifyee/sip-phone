// FileShare an Upload
// ===================
var allowDradAndDrop = function () {
	var div = document.createElement('div');
	return (
		('draggable' in div || ('ondragstart' in div && 'ondrop' in div)) &&
		'FormData' in window &&
		'FileReader' in window
	);
};
function onFileDragDrop(e, buddy) {
	// drop

	var filesArray = e.dataTransfer.files;
	console.log('You are about to upload ' + filesArray.length + ' file.');

	// Clear style
	$('#contact-' + buddy + '-ChatHistory').css('outline', 'none');

	for (var f = 0; f < filesArray.length; f++) {
		var fileObj = filesArray[f];
		var reader = new FileReader();
		reader.onload = function (event) {
			// console.log(event.target.result);

			// Check if the file is under 50MB
			if (fileObj.size <= 52428800) {
				// Add to Stream
				// =============
				SendFileDataMessage(
					buddy,
					event.target.result,
					fileObj.name,
					fileObj.size
				);
			} else {
				alert(
					"The file '" +
						fileObj.name +
						"' is bigger than 50MB, you cannot upload this file"
				);
			}
		};
		console.log(
			'Adding: ' + fileObj.name + ' of size: ' + fileObj.size + 'bytes'
		);
		reader.readAsDataURL(fileObj);
	}

	// Prevent Default
	preventDefault(e);
}
function cancelDragDrop(e, buddy) {
	// dragleave dragend
	$('#contact-' + buddy + '-ChatHistory').css('outline', 'none');
	preventDefault(e);
}
function setupDragDrop(e, buddy) {
	// dragover dragenter
	$('#contact-' + buddy + '-ChatHistory').css('outline', '2px dashed #184369');
	preventDefault(e);
}
function preventDefault(e) {
	e.preventDefault();
	e.stopPropagation();
}
