// Device and Settings
// ===================
function ChangeSettings(lineNum, obj) {
	var x = window.dhx4.absLeft(obj);
	var y = window.dhx4.absTop(obj);
	var w = obj.offsetWidth;
	var h = obj.offsetHeight;

	HidePopup();

	// Check if you are in a call
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) return;
	var session = lineObj.SipSession;

	dhtmlxPopup = new dhtmlXPopup();
	dhtmlxPopup.attachHTML(
		'<div id=DeviceSelector style="width:250px">' + lang.loading + '</DIV>'
	);
	dhtmlxPopup.show(x, y, w, h);

	var audioSelect = $('<select/>');
	audioSelect.prop('id', 'audioSrcSelect');
	audioSelect.css('width', '100%');

	var videoSelect = $('<select/>');
	videoSelect.prop('id', 'videoSrcSelect');
	videoSelect.css('width', '100%');

	var speakerSelect = $('<select/>');
	speakerSelect.prop('id', 'audioOutputSelect');
	speakerSelect.css('width', '100%');

	var ringerSelect = $('<select/>');
	ringerSelect.prop('id', 'ringerSelect');
	ringerSelect.css('width', '100%');

	// Handle Audio Source changes (Microphone)
	audioSelect.change(function () {
		console.log('Call to change Microphone: ', this.value);

		HidePopup();

		// First Stop Recording the call
		var mustRestartRecording = false;
		if (
			session.data.mediaRecorder &&
			session.data.mediaRecorder.state == 'recording'
		) {
			StopRecording(lineNum, true);
			mustRestartRecording = true;
		}

		// Stop Monitoring
		if (lineObj.LocalSoundMeter) lineObj.LocalSoundMeter.stop();

		// Save Setting
		session.data.AudioSourceDevice = this.value;

		var constraints = {
			audio: {
				deviceId: this.value != 'default' ? { exact: this.value } : 'default',
			},
			video: false,
		};
		navigator.mediaDevices
			.getUserMedia(constraints)
			.then(function (newStream) {
				// Assume that since we are selecting from a dropdown, this is possible
				var newMediaTrack = newStream.getAudioTracks()[0];
				var pc = session.sessionDescriptionHandler.peerConnection;
				pc.getSenders().forEach(function (RTCRtpSender) {
					if (RTCRtpSender.track && RTCRtpSender.track.kind == 'audio') {
						console.log(
							'Switching Audio Track : ' +
								RTCRtpSender.track.label +
								' to ' +
								newMediaTrack.label
						);
						RTCRtpSender.track.stop(); // Must stop, or this mic will stay in use
						RTCRtpSender.replaceTrack(newMediaTrack)
							.then(function () {
								// Start Recording again
								if (mustRestartRecording) StartRecording(lineNum);
								// Monitor Adio Stream
								lineObj.LocalSoundMeter = StartLocalAudioMediaMonitoring(
									lineNum,
									session
								);
							})
							.catch(function (e) {
								console.error('Error replacing track: ', e);
							});
					}
				});
			})
			.catch(function (e) {
				console.error('Error on getUserMedia');
			});
	});

	// Handle output change (speaker)
	speakerSelect.change(function () {
		console.log('Call to change Speaker: ', this.value);

		HidePopup();

		// Save Setting
		session.data.AudioOutputDevice = this.value;

		// Also change the sinkId
		// ======================
		var sinkId = this.value;
		console.log(
			'Attempting to set Audio Output SinkID for line ' +
				lineNum +
				' [' +
				sinkId +
				']'
		);

		// Remote Audio
		var element = $('#line-' + lineNum + '-remoteAudio').get(0);
		if (element) {
			if (typeof element.sinkId !== 'undefined') {
				element
					.setSinkId(sinkId)
					.then(function () {
						console.log('sinkId applied: ' + sinkId);
					})
					.catch(function (e) {
						console.warn('Error using setSinkId: ', e);
					});
			} else {
				console.warn('setSinkId() is not possible using this browser.');
			}
		}
	});

	// Handle video input change (WebCam)
	videoSelect.change(function () {
		console.log('Call to change WebCam');

		HidePopup();

		switchVideoSource(lineNum, this.value);
	});

	// Load Devices
	if (!navigator.mediaDevices) {
		console.warn('navigator.mediaDevices not possible.');
		return;
	}

	for (var i = 0; i < AudioinputDevices.length; ++i) {
		var deviceInfo = AudioinputDevices[i];
		var devideId = deviceInfo.deviceId;
		var DisplayName = deviceInfo.label ? deviceInfo.label : '';
		if (DisplayName.indexOf('(') > 0)
			DisplayName = DisplayName.substring(0, DisplayName.indexOf('('));

		// Create Option
		var option = $('<option/>');
		option.prop('value', devideId);
		option.text(DisplayName != '' ? DisplayName : 'Microphone');
		if (session.data.AudioSourceDevice == devideId)
			option.prop('selected', true);
		audioSelect.append(option);
	}
	for (var i = 0; i < VideoinputDevices.length; ++i) {
		var deviceInfo = VideoinputDevices[i];
		var devideId = deviceInfo.deviceId;
		var DisplayName = deviceInfo.label ? deviceInfo.label : '';
		if (DisplayName.indexOf('(') > 0)
			DisplayName = DisplayName.substring(0, DisplayName.indexOf('('));

		// Create Option
		var option = $('<option/>');
		option.prop('value', devideId);
		option.text(DisplayName != '' ? DisplayName : 'Webcam');
		if (session.data.VideoSourceDevice == devideId)
			option.prop('selected', true);
		videoSelect.append(option);
	}
	if (HasSpeakerDevice) {
		for (var i = 0; i < SpeakerDevices.length; ++i) {
			var deviceInfo = SpeakerDevices[i];
			var devideId = deviceInfo.deviceId;
			var DisplayName = deviceInfo.label ? deviceInfo.label : '';
			if (DisplayName.indexOf('(') > 0)
				DisplayName = DisplayName.substring(0, DisplayName.indexOf('('));

			// Create Option
			var option = $('<option/>');
			option.prop('value', devideId);
			option.text(DisplayName != '' ? DisplayName : 'Speaker');
			if (session.data.AudioOutputDevice == devideId)
				option.prop('selected', true);
			speakerSelect.append(option);
		}
	}
	// Show Popup
	// ==========
	dhtmlxPopup.attachHTML('<div id=DeviceSelector style="width:250px"></DIV>');

	// Mic Serttings
	$('#DeviceSelector').append(
		'<div style="margin-top:20px">' + lang.microphone + ': </div>'
	);
	$('#DeviceSelector').append(audioSelect);

	// Speaker
	if (HasSpeakerDevice) {
		$('#DeviceSelector').append(
			'<div style="margin-top:20px">' + lang.speaker + ': </div>'
		);
		$('#DeviceSelector').append(speakerSelect);
	}
	// Camera
	if (session.data.withvideo == true) {
		$('#DeviceSelector').append(
			'<div style="margin-top:20px">' + lang.camera + ': </div>'
		);
		$('#DeviceSelector').append(videoSelect);
	}

	// Show Menu
	dhtmlxPopup.show(x, y, w, h);
}
