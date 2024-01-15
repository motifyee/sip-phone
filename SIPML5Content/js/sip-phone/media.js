// Media Presentation
// ==================
function PresentCamera(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		console.warn('Line or Session is Null.');
		return;
	}
	var session = lineObj.SipSession;

	$('#line-' + lineNum + '-src-camera').prop('disabled', true);
	$('#line-' + lineNum + '-src-canvas').prop('disabled', false);
	$('#line-' + lineNum + '-src-desktop').prop('disabled', false);
	$('#line-' + lineNum + '-src-video').prop('disabled', false);
	$('#line-' + lineNum + '-src-blank').prop('disabled', false);

	$('#line-' + lineNum + '-scratchpad-container').hide();
	RemoveScratchpad(lineNum);
	$('#line-' + lineNum + '-sharevideo').hide();
	$('#line-' + lineNum + '-sharevideo')
		.get(0)
		.pause();
	$('#line-' + lineNum + '-sharevideo')
		.get(0)
		.removeAttribute('src');
	$('#line-' + lineNum + '-sharevideo')
		.get(0)
		.load();
	window.clearInterval(session.data.videoResampleInterval);

	$('#line-' + lineNum + '-localVideo').show();
	$('#line-' + lineNum + '-remoteVideo').appendTo(
		'#line-' + lineNum + '-stage-container'
	);

	switchVideoSource(lineNum, session.data.VideoSourceDevice);
}
function PresentScreen(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		console.warn('Line or Session is Null.');
		return;
	}
	var session = lineObj.SipSession;

	$('#line-' + lineNum + '-src-camera').prop('disabled', false);
	$('#line-' + lineNum + '-src-canvas').prop('disabled', false);
	$('#line-' + lineNum + '-src-desktop').prop('disabled', true);
	$('#line-' + lineNum + '-src-video').prop('disabled', false);
	$('#line-' + lineNum + '-src-blank').prop('disabled', false);

	$('#line-' + lineNum + '-scratchpad-container').hide();
	RemoveScratchpad(lineNum);
	$('#line-' + lineNum + '-sharevideo').hide();
	$('#line-' + lineNum + '-sharevideo')
		.get(0)
		.pause();
	$('#line-' + lineNum + '-sharevideo')
		.get(0)
		.removeAttribute('src');
	$('#line-' + lineNum + '-sharevideo')
		.get(0)
		.load();
	window.clearInterval(session.data.videoResampleInterval);

	$('#line-' + lineNum + '-localVideo').hide();
	$('#line-' + lineNum + '-remoteVideo').appendTo(
		'#line-' + lineNum + '-stage-container'
	);

	ShareScreen(lineNum);
}
function PresentScratchpad(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		console.warn('Line or Session is Null.');
		return;
	}
	var session = lineObj.SipSession;

	$('#line-' + lineNum + '-src-camera').prop('disabled', false);
	$('#line-' + lineNum + '-src-canvas').prop('disabled', true);
	$('#line-' + lineNum + '-src-desktop').prop('disabled', false);
	$('#line-' + lineNum + '-src-video').prop('disabled', false);
	$('#line-' + lineNum + '-src-blank').prop('disabled', false);

	$('#line-' + lineNum + '-scratchpad-container').hide();
	RemoveScratchpad(lineNum);
	$('#line-' + lineNum + '-sharevideo').hide();
	$('#line-' + lineNum + '-sharevideo')
		.get(0)
		.pause();
	$('#line-' + lineNum + '-sharevideo')
		.get(0)
		.removeAttribute('src');
	$('#line-' + lineNum + '-sharevideo')
		.get(0)
		.load();
	window.clearInterval(session.data.videoResampleInterval);

	$('#line-' + lineNum + '-localVideo').hide();
	$('#line-' + lineNum + '-remoteVideo').appendTo(
		'#line-' + lineNum + '-preview-container'
	);

	SendCanvas(lineNum);
}
function PresentVideo(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		console.warn('Line or Session is Null.');
		return;
	}
	var session = lineObj.SipSession;

	var html =
		'<div class="UiWindowField"><input type=file  accept="video/*" id=SelectVideoToSend></div>';
	OpenWindow(
		html,
		lang.select_video,
		150,
		360,
		false,
		false,
		null,
		null,
		lang.cancel,
		function () {
			// Cancel
			CloseWindow();
		},
		function () {
			// Do OnLoad
			$('#SelectVideoToSend').on('change', function (event) {
				var input = event.target;
				if (input.files.length >= 1) {
					CloseWindow();

					// Send Video (Can only send one file)
					SendVideo(lineNum, URL.createObjectURL(input.files[0]));
				} else {
					console.warn('Please Select a file to present.');
				}
			});
		},
		null
	);
}
function PresentBlank(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		console.warn('Line or Session is Null.');
		return;
	}
	var session = lineObj.SipSession;

	$('#line-' + lineNum + '-src-camera').prop('disabled', false);
	$('#line-' + lineNum + '-src-canvas').prop('disabled', false);
	$('#line-' + lineNum + '-src-desktop').prop('disabled', false);
	$('#line-' + lineNum + '-src-video').prop('disabled', false);
	$('#line-' + lineNum + '-src-blank').prop('disabled', true);

	$('#line-' + lineNum + '-scratchpad-container').hide();
	RemoveScratchpad(lineNum);
	$('#line-' + lineNum + '-sharevideo').hide();
	$('#line-' + lineNum + '-sharevideo')
		.get(0)
		.pause();
	$('#line-' + lineNum + '-sharevideo')
		.get(0)
		.removeAttribute('src');
	$('#line-' + lineNum + '-sharevideo')
		.get(0)
		.load();
	window.clearInterval(session.data.videoResampleInterval);

	$('#line-' + lineNum + '-localVideo').hide();
	$('#line-' + lineNum + '-remoteVideo').appendTo(
		'#line-' + lineNum + '-stage-container'
	);

	DisableVideoStream(lineNum);
}
function RemoveScratchpad(lineNum) {
	var scratchpad = GetCanvas('line-' + lineNum + '-scratchpad');
	if (scratchpad != null) {
		window.clearInterval(scratchpad.redrawIntrtval);

		RemoveCanvas('line-' + lineNum + '-scratchpad');
		$('#line-' + lineNum + '-scratchpad-container').empty();

		scratchpad = null;
	}
}

// Device Detection
// ================
function DetectDevices() {
	navigator.mediaDevices
		.enumerateDevices()
		.then(function (deviceInfos) {
			// deviceInfos will not have a populated lable unless to accept the permission
			// during getUserMedia. This normally happens at startup/setup
			// so from then on these devices will be with lables.
			HasVideoDevice = false;
			HasAudioDevice = false;
			HasSpeakerDevice = false; // Safari and Firefox don't have these
			AudioinputDevices = [];
			VideoinputDevices = [];
			SpeakerDevices = [];
			for (var i = 0; i < deviceInfos.length; ++i) {
				if (deviceInfos[i].kind === 'audioinput') {
					HasAudioDevice = true;
					AudioinputDevices.push(deviceInfos[i]);
				} else if (deviceInfos[i].kind === 'audiooutput') {
					HasSpeakerDevice = true;
					SpeakerDevices.push(deviceInfos[i]);
				} else if (deviceInfos[i].kind === 'videoinput') {
					HasVideoDevice = true;
					VideoinputDevices.push(deviceInfos[i]);
				}
			}
			// console.log(AudioinputDevices, VideoinputDevices);
		})
		.catch(function (e) {
			console.error('Error enumerating devices', e);
		});
}
