// Sessions
// ========
function ExpandVideoArea(lineNum) {
	$('#line-' + lineNum + '-ActiveCall').prop('class', 'FullScreenVideo');
	$('#line-' + lineNum + '-VideoCall').css('height', 'calc(100% - 100px)');
	$('#line-' + lineNum + '-VideoCall').css('margin-top', '0px');

	$('#line-' + lineNum + '-preview-container').prop(
		'class',
		'PreviewContainer PreviewContainer_FS'
	);
	$('#line-' + lineNum + '-stage-container').prop(
		'class',
		'StageContainer StageContainer_FS'
	);

	$('#line-' + lineNum + '-restore').show();
	$('#line-' + lineNum + '-expand').hide();

	$('#line-' + lineNum + '-monitoring').hide();
}
function RestoreVideoArea(lineNum) {
	$('#line-' + lineNum + '-ActiveCall').prop('class', '');
	$('#line-' + lineNum + '-VideoCall').css('height', '');
	$('#line-' + lineNum + '-VideoCall').css('margin-top', '10px');

	$('#line-' + lineNum + '-preview-container').prop(
		'class',
		'PreviewContainer'
	);
	$('#line-' + lineNum + '-stage-container').prop('class', 'StageContainer');

	$('#line-' + lineNum + '-restore').hide();
	$('#line-' + lineNum + '-expand').show();

	$('#line-' + lineNum + '-monitoring').show();
}
function MuteSession(lineNum) {
	$('#line-' + lineNum + '-btn-Unmute').show();
	$('#line-' + lineNum + '-btn-Mute').hide();

	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) return;

	var session = lineObj.SipSession;
	var pc = session.sessionDescriptionHandler.peerConnection;
	pc.getSenders().forEach(function (RTCRtpSender) {
		if (RTCRtpSender.track.kind == 'audio') {
			if (RTCRtpSender.track.IsMixedTrack == true) {
				if (
					session.data.AudioSourceTrack &&
					session.data.AudioSourceTrack.kind == 'audio'
				) {
					console.log(
						'Muting Audio Track : ' + session.data.AudioSourceTrack.label
					);
					session.data.AudioSourceTrack.enabled = false;
				}
			} else {
				console.log('Muting Audio Track : ' + RTCRtpSender.track.label);
				RTCRtpSender.track.enabled = false;
			}
		}
	});

	if (!session.data.mute) session.data.mute = [];
	session.data.mute.push({ event: 'mute', eventTime: utcDateNow() });
	session.data.ismute = true;

	$('#line-' + lineNum + '-msg').html(lang.call_on_mute);

	updateLineScroll(lineNum);

	// Custom Web hook
	if (typeof web_hook_on_modify !== 'undefined')
		web_hook_on_modify('mute', session);
}
function UnmuteSession(lineNum) {
	$('#line-' + lineNum + '-btn-Unmute').hide();
	$('#line-' + lineNum + '-btn-Mute').show();

	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) return;

	var session = lineObj.SipSession;
	var pc = session.sessionDescriptionHandler.peerConnection;
	pc.getSenders().forEach(function (RTCRtpSender) {
		if (RTCRtpSender.track.kind == 'audio') {
			if (RTCRtpSender.track.IsMixedTrack == true) {
				if (
					session.data.AudioSourceTrack &&
					session.data.AudioSourceTrack.kind == 'audio'
				) {
					console.log(
						'Unmuting Audio Track : ' + session.data.AudioSourceTrack.label
					);
					session.data.AudioSourceTrack.enabled = true;
				}
			} else {
				console.log('Unmuting Audio Track : ' + RTCRtpSender.track.label);
				RTCRtpSender.track.enabled = true;
			}
		}
	});

	if (!session.data.mute) session.data.mute = [];
	session.data.mute.push({ event: 'unmute', eventTime: utcDateNow() });
	session.data.ismute = false;

	$('#line-' + lineNum + '-msg').html(lang.call_off_mute);

	updateLineScroll(lineNum);

	// Custom Web hook
	if (typeof web_hook_on_modify !== 'undefined')
		web_hook_on_modify('unmute', session);
}
function ShowDtmfMenu(obj, lineNum) {
	var x = window.dhx4.absLeft(obj);
	var y = window.dhx4.absTop(obj);
	var w = obj.offsetWidth;
	var h = obj.offsetHeight;

	HidePopup();
	dhtmlxPopup = new dhtmlXPopup();
	var html = '<div style="margin-top:15px; margin-bottom:15px">';
	html +=
		'<table cellspacing=10 cellpadding=0 style="margin-left:auto; margin-right: auto">';
	html +=
		'<tr><td><button class=dtmfButtons onclick="sendDTMF(\'' +
		lineNum +
		"', '1')\"><div>1</div><span>&nbsp;</span></button></td>";
	html +=
		'<td><button class=dtmfButtons onclick="sendDTMF(\'' +
		lineNum +
		"', '2')\"><div>2</div><span>ABC</span></button></td>";
	html +=
		'<td><button class=dtmfButtons onclick="sendDTMF(\'' +
		lineNum +
		"', '3')\"><div>3</div><span>DEF</span></button></td></tr>";
	html +=
		'<tr><td><button class=dtmfButtons onclick="sendDTMF(\'' +
		lineNum +
		"', '4')\"><div>4</div><span>GHI</span></button></td>";
	html +=
		'<td><button class=dtmfButtons onclick="sendDTMF(\'' +
		lineNum +
		"', '5')\"><div>5</div><span>JKL</span></button></td>";
	html +=
		'<td><button class=dtmfButtons onclick="sendDTMF(\'' +
		lineNum +
		"', '6')\"><div>6</div><span>MNO</span></button></td></tr>";
	html +=
		'<tr><td><button class=dtmfButtons onclick="sendDTMF(\'' +
		lineNum +
		"', '7')\"><div>7</div><span>PQRS</span></button></td>";
	html +=
		'<td><button class=dtmfButtons onclick="sendDTMF(\'' +
		lineNum +
		"', '8')\"><div>8</div><span>TUV</span></button></td>";
	html +=
		'<td><button class=dtmfButtons onclick="sendDTMF(\'' +
		lineNum +
		"', '9')\"><div>9</div><span>WXYZ</span></button></td></tr>";
	html +=
		'<tr><td><button class=dtmfButtons onclick="sendDTMF(\'' +
		lineNum +
		"', '*')\">*</button></td>";
	html +=
		'<td><button class=dtmfButtons onclick="sendDTMF(\'' +
		lineNum +
		"', '0')\">0</button></td>";
	html +=
		'<td><button class=dtmfButtons onclick="sendDTMF(\'' +
		lineNum +
		"', '#')\">#</button></td></tr>";
	html += '</table>';
	html += '</div>';
	dhtmlxPopup.attachHTML(html);
	dhtmlxPopup.show(x, y, w, h);
}

// Session Wireup
// ==============
function wireupAudioSession(lineObj) {
	if (lineObj == null) return;

	var MessageObjId = '#line-' + lineObj.LineNumber + '-msg';
	var session = lineObj.SipSession;

	session.on('progress', function (response) {
		// Provisional 1xx
		if (response.status_code == 100) {
			$(MessageObjId).html(lang.trying);
		} else if (response.status_code == 180) {
			$(MessageObjId).html(lang.ringing);

			var soundFile = audioBlobs.EarlyMedia_European;
			if (UserLocale().indexOf('us') > -1) soundFile = audioBlobs.EarlyMedia_US;
			if (UserLocale().indexOf('gb') > -1) soundFile = audioBlobs.EarlyMedia_UK;
			if (UserLocale().indexOf('au') > -1)
				soundFile = audioBlobs.EarlyMedia_Australia;
			if (UserLocale().indexOf('jp') > -1)
				soundFile = audioBlobs.EarlyMedia_Japan;

			// Play Early Media
			console.log('Audio:', soundFile.url);
			var earlyMedia = new Audio(soundFile.blob);
			earlyMedia.preload = 'auto';
			earlyMedia.loop = true;
			earlyMedia.oncanplaythrough = function (e) {
				if (
					typeof earlyMedia.sinkId !== 'undefined' &&
					getAudioOutputID() != 'default'
				) {
					earlyMedia
						.setSinkId(getAudioOutputID())
						.then(function () {
							console.log('Set sinkId to:', getAudioOutputID());
						})
						.catch(function (e) {
							console.warn('Failed not apply setSinkId.', e);
						});
				}
				earlyMedia
					.play()
					.then(function () {
						// Audio Is Playing
					})
					.catch(function (e) {
						console.warn('Unable to play audio file.', e);
					});
			};
			session.data.earlyMedia = earlyMedia;
		} else {
			$(MessageObjId).html(response.reason_phrase + '...');
		}

		// Custom Web hook
		if (typeof web_hook_on_modify !== 'undefined')
			web_hook_on_modify('progress', session);
	});
	session.on('trackAdded', function () {
		var pc = session.sessionDescriptionHandler.peerConnection;

		// Gets Remote Audio Track (Local audio is setup via initial GUM)
		var remoteStream = new MediaStream();
		pc.getReceivers().forEach(function (receiver) {
			if (receiver.track && receiver.track.kind == 'audio') {
				remoteStream.addTrack(receiver.track);
			}
		});
		var remoteAudio = $('#line-' + lineObj.LineNumber + '-remoteAudio').get(0);
		remoteAudio.srcObject = remoteStream;
		remoteAudio.onloadedmetadata = function (e) {
			if (typeof remoteAudio.sinkId !== 'undefined') {
				remoteAudio
					.setSinkId(getAudioOutputID())
					.then(function () {
						console.log('sinkId applied: ' + getAudioOutputID());
					})
					.catch(function (e) {
						console.warn('Error using setSinkId: ', e);
					});
			}
			remoteAudio.play();
		};

		// Custom Web hook
		if (typeof web_hook_on_modify !== 'undefined')
			web_hook_on_modify('trackAdded', session);
	});
	session.on('accepted', function (data) {
		if (session.data.earlyMedia) {
			session.data.earlyMedia.pause();
			session.data.earlyMedia.removeAttribute('src');
			session.data.earlyMedia.load();
			session.data.earlyMedia = null;
		}

		window.clearInterval(session.data.callTimer);
		var startTime = moment.utc();
		session.data.callTimer = window.setInterval(function () {
			var now = moment.utc();
			var duration = moment.duration(now.diff(startTime));
			$('#line-' + lineObj.LineNumber + '-timer').html(
				formatShortDuration(duration.asSeconds())
			);
		}, 1000);

		if (RecordAllCalls || CallRecordingPolicy == 'enabled') {
			StartRecording(lineObj.LineNumber);
		}

		$('#line-' + lineObj.LineNumber + '-progress').hide();
		$('#line-' + lineObj.LineNumber + '-VideoCall').hide();
		$('#line-' + lineObj.LineNumber + '-ActiveCall').show();

		// Audo Monitoring
		lineObj.LocalSoundMeter = StartLocalAudioMediaMonitoring(
			lineObj.LineNumber,
			session
		);
		lineObj.RemoteSoundMeter = StartRemoteAudioMediaMonitoring(
			lineObj.LineNumber,
			session
		);

		$(MessageObjId).html(lang.call_in_progress);

		updateLineScroll(lineObj.LineNumber);

		// Custom Web hook
		if (typeof web_hook_on_modify !== 'undefined')
			web_hook_on_modify('accepted', session);
	});
	session.on('rejected', function (response, cause) {
		// Should only apply befor answer
		$(MessageObjId).html(lang.call_rejected + ': ' + cause);
		console.log('Call rejected: ' + cause);
		teardownSession(lineObj, response.status_code, response.reason_phrase);
	});
	session.on('failed', function (response, cause) {
		$(MessageObjId).html(lang.call_failed + ': ' + cause);
		console.log('Call failed: ' + cause);
		teardownSession(lineObj, 0, 'Call failed');
	});
	session.on('cancel', function () {
		$(MessageObjId).html(lang.call_cancelled);
		console.log('Call Cancelled');
		teardownSession(lineObj, 0, 'Cancelled by caller');
	});
	// referRequested
	// replaced
	session.on('bye', function () {
		$(MessageObjId).html(lang.call_ended);
		console.log('Call ended, bye!');
		teardownSession(lineObj, 16, 'Normal Call clearing');
	});
	session.on('terminated', function (message, cause) {
		console.log('Session terminated');
	});
	session.on('reinvite', function (session) {
		console.log('Session reinvited!');
	});
	//dtmf
	session.on('directionChanged', function () {
		var direction = session.sessionDescriptionHandler.getDirection();
		console.log('Direction Change: ', direction);

		// Custom Web hook
		if (typeof web_hook_on_modify !== 'undefined')
			web_hook_on_modify('directionChanged', session);
	});

	$('#line-' + lineObj.LineNumber + '-btn-settings').removeAttr('disabled');
	$('#line-' + lineObj.LineNumber + '-btn-audioCall').prop(
		'disabled',
		'disabled'
	);
	$('#line-' + lineObj.LineNumber + '-btn-videoCall').prop(
		'disabled',
		'disabled'
	);
	$('#line-' + lineObj.LineNumber + '-btn-search').removeAttr('disabled');
	$('#line-' + lineObj.LineNumber + '-btn-remove').prop('disabled', 'disabled');

	$('#line-' + lineObj.LineNumber + '-progress').show();
	$('#line-' + lineObj.LineNumber + '-msg').show();

	if (lineObj.BuddyObj.type == 'group') {
		$('#line-' + lineObj.LineNumber + '-conference').show();
		MonitorBuddyConference(lineObj);
	} else {
		$('#line-' + lineObj.LineNumber + '-conference').hide();
	}

	updateLineScroll(lineObj.LineNumber);

	UpdateUI();
}
function wireupVideoSession(lineObj) {
	if (lineObj == null) return;

	var MessageObjId = '#line-' + lineObj.LineNumber + '-msg';
	var session = lineObj.SipSession;

	session.on('trackAdded', function () {
		// Gets remote tracks
		var pc = session.sessionDescriptionHandler.peerConnection;
		var remoteAudioStream = new MediaStream();
		var remoteVideoStream = new MediaStream();
		pc.getReceivers().forEach(function (receiver) {
			if (receiver.track) {
				if (receiver.track.kind == 'audio') {
					remoteAudioStream.addTrack(receiver.track);
				}
				if (receiver.track.kind == 'video') {
					remoteVideoStream.addTrack(receiver.track);
				}
			}
		});
		var remoteAudio = $('#line-' + lineObj.LineNumber + '-remoteAudio').get(0);
		remoteAudio.srcObject = remoteAudioStream;
		remoteAudio.onloadedmetadata = function (e) {
			if (typeof remoteAudio.sinkId !== 'undefined') {
				remoteAudio
					.setSinkId(getAudioOutputID())
					.then(function () {
						console.log('sinkId applied: ' + getAudioOutputID());
					})
					.catch(function (e) {
						console.warn('Error using setSinkId: ', e);
					});
			}
			remoteAudio.play();
		};

		var remoteVideo = $('#line-' + lineObj.LineNumber + '-remoteVideo').get(0);
		remoteVideo.srcObject = remoteVideoStream;
		remoteVideo.onloadedmetadata = function (e) {
			remoteVideo.play();
		};

		// Note: There appears to be a bug in the peerConnection.getSenders()
		// The array returns but may or may not be fully populated by the RTCRtpSender
		// The track property appears to be null initially and then moments later populated.
		// This does not appear to be the case when oritionisting a call, mostly when receiving a call.
		window.setTimeout(function () {
			var localVideoStream = new MediaStream();
			var pc = session.sessionDescriptionHandler.peerConnection;
			pc.getSenders().forEach(function (sender) {
				if (sender.track && sender.track.kind == 'video') {
					localVideoStream.addTrack(sender.track);
				}
			});
			var localVideo = $('#line-' + lineObj.LineNumber + '-localVideo').get(0);
			localVideo.srcObject = localVideoStream;
			localVideo.onloadedmetadata = function (e) {
				localVideo.play();
			};
		}, 1000);

		// Custom Web hook
		if (typeof web_hook_on_modify !== 'undefined')
			web_hook_on_modify('trackAdded', session);
	});
	session.on('progress', function (response) {
		// Provisional 1xx
		if (response.status_code == 100) {
			$(MessageObjId).html(lang.trying);
		} else if (response.status_code == 180) {
			$(MessageObjId).html(lang.ringing);

			var soundFile = audioBlobs.EarlyMedia_European;
			if (UserLocale().indexOf('us') > -1) soundFile = audioBlobs.EarlyMedia_US;
			if (UserLocale().indexOf('gb') > -1) soundFile = audioBlobs.EarlyMedia_UK;
			if (UserLocale().indexOf('au') > -1)
				soundFile = audioBlobs.EarlyMedia_Australia;
			if (UserLocale().indexOf('jp') > -1)
				soundFile = audioBlobs.EarlyMedia_Japan;

			// Play Early Media
			console.log('Audio:', soundFile.url);
			var earlyMedia = new Audio(soundFile.blob);
			earlyMedia.preload = 'auto';
			earlyMedia.loop = true;
			earlyMedia.oncanplaythrough = function (e) {
				if (
					typeof earlyMedia.sinkId !== 'undefined' &&
					getAudioOutputID() != 'default'
				) {
					earlyMedia
						.setSinkId(getAudioOutputID())
						.then(function () {
							console.log('Set sinkId to:', getAudioOutputID());
						})
						.catch(function (e) {
							console.warn('Failed not apply setSinkId.', e);
						});
				}
				earlyMedia
					.play()
					.then(function () {
						// Audio Is Playing
					})
					.catch(function (e) {
						console.warn('Unable to play audio file.', e);
					});
			};
			session.data.earlyMedia = earlyMedia;
		} else {
			$(MessageObjId).html(response.reason_phrase + '...');
		}

		// Custom Web hook
		if (typeof web_hook_on_modify !== 'undefined')
			web_hook_on_modify('progress', session);
	});
	session.on('accepted', function (data) {
		if (session.data.earlyMedia) {
			session.data.earlyMedia.pause();
			session.data.earlyMedia.removeAttribute('src');
			session.data.earlyMedia.load();
			session.data.earlyMedia = null;
		}

		window.clearInterval(session.data.callTimer);
		$('#line-' + lineObj.LineNumber + '-timer').show();
		var startTime = moment.utc();
		session.data.callTimer = window.setInterval(function () {
			var now = moment.utc();
			var duration = moment.duration(now.diff(startTime));
			$('#line-' + lineObj.LineNumber + '-timer').html(
				formatShortDuration(duration.asSeconds())
			);
		}, 1000);

		if (RecordAllCalls || CallRecordingPolicy == 'enabled') {
			StartRecording(lineObj.LineNumber);
		}

		$('#line-' + lineObj.LineNumber + '-progress').hide();
		$('#line-' + lineObj.LineNumber + '-VideoCall').show();
		$('#line-' + lineObj.LineNumber + '-ActiveCall').show();

		$('#line-' + lineObj.LineNumber + '-btn-Conference').hide(); // Cannot conference a Video Call (Yet...)
		$('#line-' + lineObj.LineNumber + '-btn-CancelConference').hide();
		$('#line-' + lineObj.LineNumber + '-Conference').hide();

		$('#line-' + lineObj.LineNumber + '-btn-Transfer').hide(); // Cannot transfer a Video Call (Yet...)
		$('#line-' + lineObj.LineNumber + '-btn-CancelTransfer').hide();
		$('#line-' + lineObj.LineNumber + '-Transfer').hide();

		// Default to use Camera
		$('#line-' + lineObj.LineNumber + '-src-camera').prop('disabled', true);
		$('#line-' + lineObj.LineNumber + '-src-canvas').prop('disabled', false);
		$('#line-' + lineObj.LineNumber + '-src-desktop').prop('disabled', false);
		$('#line-' + lineObj.LineNumber + '-src-video').prop('disabled', false);

		updateLineScroll(lineObj.LineNumber);

		// Start Audio Monitoring
		lineObj.LocalSoundMeter = StartLocalAudioMediaMonitoring(
			lineObj.LineNumber,
			session
		);
		lineObj.RemoteSoundMeter = StartRemoteAudioMediaMonitoring(
			lineObj.LineNumber,
			session
		);

		$(MessageObjId).html(lang.call_in_progress);

		if (StartVideoFullScreen) ExpandVideoArea(lineObj.LineNumber);

		// Custom Web hook
		if (typeof web_hook_on_modify !== 'undefined')
			web_hook_on_modify('accepted', session);
	});
	session.on('rejected', function (response, cause) {
		// Should only apply befor answer
		$(MessageObjId).html(lang.call_rejected + ': ' + cause);
		console.log('Call rejected: ' + cause);
		teardownSession(lineObj, response.status_code, response.reason_phrase);
	});
	session.on('failed', function (response, cause) {
		$(MessageObjId).html(lang.call_failed + ': ' + cause);
		console.log('Call failed: ' + cause);
		teardownSession(lineObj, 0, 'call failed');
	});
	session.on('cancel', function () {
		$(MessageObjId).html(lang.call_cancelled);
		console.log('Call Cancelled');
		teardownSession(lineObj, 0, 'Cancelled by caller');
	});
	// referRequested
	// replaced
	session.on('bye', function () {
		$(MessageObjId).html(lang.call_ended);
		console.log('Call ended, bye!');
		teardownSession(lineObj, 16, 'Normal Call clearing');
	});
	session.on('terminated', function (message, cause) {
		console.log('Session terminated');
	});
	session.on('reinvite', function (session) {
		console.log('Session reinvited!');
	});
	// dtmf
	session.on('directionChanged', function () {
		var direction = session.sessionDescriptionHandler.getDirection();
		console.log('Direction Change: ', direction);

		// Custom Web hook
		if (typeof web_hook_on_modify !== 'undefined')
			web_hook_on_modify('directionChanged', session);
	});

	$('#line-' + lineObj.LineNumber + '-btn-settings').removeAttr('disabled');
	$('#line-' + lineObj.LineNumber + '-btn-audioCall').prop(
		'disabled',
		'disabled'
	);
	$('#line-' + lineObj.LineNumber + '-btn-videoCall').prop(
		'disabled',
		'disabled'
	);
	$('#line-' + lineObj.LineNumber + '-btn-search').removeAttr('disabled');
	$('#line-' + lineObj.LineNumber + '-btn-remove').prop('disabled', 'disabled');

	$('#line-' + lineObj.LineNumber + '-progress').show();
	$('#line-' + lineObj.LineNumber + '-msg').show();

	updateLineScroll(lineObj.LineNumber);

	UpdateUI();
}
function teardownSession(lineObj, reasonCode, reasonText) {
	if (lineObj == null || lineObj.SipSession == null) return;

	var session = lineObj.SipSession;
	if (session.data.teardownComplete == true) return;
	session.data.teardownComplete = true; // Run this code only once

	session.data.reasonCode = reasonCode;
	session.data.reasonText = reasonText;
	// Call UI
	HidePopup();

	// End any child calls
	if (session.data.childsession) {
		try {
			if (session.data.childsession.status == SIP.Session.C.STATUS_CONFIRMED) {
				session.data.childsession.bye();
			} else {
				session.data.childsession.cancel();
			}
		} catch (e) {}
	}
	session.data.childsession = null;

	// Mixed Tracks
	if (
		session.data.AudioSourceTrack &&
		session.data.AudioSourceTrack.kind == 'audio'
	) {
		session.data.AudioSourceTrack.stop();
		session.data.AudioSourceTrack = null;
	}
	// Stop any Early Media
	if (session.data.earlyMedia) {
		session.data.earlyMedia.pause();
		session.data.earlyMedia.removeAttribute('src');
		session.data.earlyMedia.load();
		session.data.earlyMedia = null;
	}

	// Stop Recording if we are
	StopRecording(lineObj.LineNumber, true);

	// Audio Meters
	if (lineObj.LocalSoundMeter != null) {
		lineObj.LocalSoundMeter.stop();
		lineObj.LocalSoundMeter = null;
	}
	if (lineObj.RemoteSoundMeter != null) {
		lineObj.RemoteSoundMeter.stop();
		lineObj.RemoteSoundMeter = null;
	}

	// End timers
	window.clearInterval(session.data.videoResampleInterval);
	window.clearInterval(session.data.callTimer);

	// Add to stream
	AddCallMessage(lineObj.BuddyObj.identity, session, reasonCode, reasonText);

	// Close up the UI
	window.setTimeout(function () {
		RemoveLine(lineObj);
	}, 1000);

	UpdateBuddyList();
	UpdateUI();

	// Custom Web hook
	if (typeof web_hook_on_terminate !== 'undefined')
		web_hook_on_terminate(session);
}

// Conference Monitor
// ==================
// TODO
function MonitorBuddyConference(buddy) {
	var buddyObj = FindBuddyByIdentity(buddy);
	if (buddyObj.type == 'group') {
		var server = 'wss://' + wssServer + ':65501';
		console.log('Connecting to WebSocket Server: ' + server);
		var websocket = new WebSocket(server);
		websocket.onopen = function (evt) {
			console.warn('WebSocket Connection Open, sending subscribe...');
			websocket.send('<xml><subscribe>Confbridge</subscribe></xml>');
		};
		websocket.onclose = function (evt) {
			console.warn('WebSocket Closed');
		};
		websocket.onmessage = function (evt) {
			var JsonEvent = JSON.parse('{}');
			try {
				JsonEvent = JSON.parse(evt.data);
			} catch (e) {}

			// JsonEvent.Conference
			// JsonEvent.Channel
			// JsonEvent.TalkingStatus: "on" | "off"
			// JsonEvent.Event: "ConfbridgeStart" | "ConfbridgeJoin" | "ConfbridgeTalking" | "ConfbridgeLeave" | "ConfbridgeEnd"
			// CallerIDName: "Alfredo Dixon"
			// CallerIDNum: "800"

			if (JsonEvent.Conference == buddyObj.identity) {
				console.log(JsonEvent);

				var mutedHTML =
					'Muted: <span style="color:red"><i class="fa fa-microphone-slash"></i> ' +
					lang.yes +
					'</span>';
				var unMutedHTML =
					'Muted: <span style="color:green"><i class="fa fa-microphone-slash"></i>  ' +
					lang.no +
					'</span>';

				var channel = JsonEvent.Channel ? JsonEvent.Channel : ''; // Local/" + attendee.LocalDialNumber + "@from-extensions | SIP/webrtc-00000007
				if (channel.indexOf('@') > -1) channel = channel.split('@')[0]; // Local/+24524352 | Local/800 | SIP/name-00000000
				if (channel.indexOf('/') > -1) channel = channel.split('/')[1]; // 800 | name-000000000 | +24524352
				if (channel.indexOf('-') > -1) channel = channel.split('-')[0]; // 800 | name | +24524352
				if (channel.indexOf('+') > -1) channel = channel.split('+')[1]; // 800 | name | 24524352

				if (JsonEvent.Event == 'ConfbridgeStart') {
					$('#contact-' + buddy + '-conference').empty();
				} else if (JsonEvent.Event == 'ConfbridgeJoin') {
					var isMuted = JsonEvent.Muted != 'No';

					console.log(
						'Buddy: ' +
							JsonEvent.CallerIDNum +
							' Joined Conference ' +
							JsonEvent.Conference
					);
					var confBuddyObj = FindBuddyByExtNo(JsonEvent.CallerIDNum);
					var html =
						'<div id="cp-' +
						JsonEvent.Conference +
						'-' +
						channel +
						'" class=ConferenceParticipant>';
					html +=
						" <IMG id=picture class=NotTalking src='" +
						getPicture(confBuddyObj != null ? confBuddyObj.identity : '-') +
						"'>"; // Convert Extension Number to uID
					html +=
						' <div>' +
						JsonEvent.CallerIDNum +
						' - ' +
						JsonEvent.CallerIDName +
						'</div>';
					html +=
						JsonEvent.Muted == 'No'
							? '<div class=presenceText id=Muted>' + unMutedHTML + '</div>'
							: '<div class= id=Muted>' + mutedHTML + '</div>';
					html += '</div>';
					$('#contact-' + buddy + '-conference').append(html);
				} else if (JsonEvent.Event == 'ConfbridgeTalking') {
					if (JsonEvent.TalkingStatus == 'on') {
						console.log(
							'Buddy: ' +
								JsonEvent.CallerIDNum +
								' is Talking in Conference ' +
								JsonEvent.Conference
						);
						$(
							'#contact-' +
								buddy +
								'-conference #cp-' +
								JsonEvent.Conference +
								'-' +
								channel +
								' #picture'
						).prop('class', 'Talking');
					} else {
						console.log(
							'Buddy: ' +
								JsonEvent.CallerIDNum +
								' is Not Talking in Conference ' +
								JsonEvent.Conference
						);
						$(
							'#contact-' +
								buddy +
								'-conference #cp-' +
								JsonEvent.Conference +
								'-' +
								channel +
								' #picture'
						).prop('class', 'NotTalking');
					}
				} else if (JsonEvent.Event == 'ConfbridgeLeave') {
					console.log(
						'Buddy: ' +
							JsonEvent.CallerIDNum +
							' Left Conference ' +
							JsonEvent.Conference
					);
					$(
						'#contact-' +
							buddy +
							'-conference #cp-' +
							JsonEvent.Conference +
							'-' +
							channel
					).remove();
				} else if (JsonEvent.Event == 'ConfbridgeMute') {
					$(
						'#contact-' +
							buddy +
							'-conference #cp-' +
							JsonEvent.Conference +
							'-' +
							channel +
							' #Muted'
					).html(mutedHTML);
				} else if (JsonEvent.Event == 'ConfbridgeUnmute') {
					$(
						'#contact-' +
							buddy +
							'-conference #cp-' +
							JsonEvent.Conference +
							'-' +
							channel +
							' #Muted'
					).html(unMutedHTML);
				} else if (JsonEvent.Event == 'ConfbridgeEnd') {
					console.log(
						'Conference ' + buddyObj.identity + ' ended, closing WebSocket'
					);
					websocket.close(1000);
				}
				//ConfbridgeList
				//ConfbridgeMute
				//ConfbridgeRecord
				//ConfbridgeStopRecord
			}
		};
		websocket.onerror = function (evt) {
			console.error('WebSocket Error: ' + evt.data);
		};

		// Get the Group Details via API first
		$('#contact-' + buddy + '-conference').empty();
	} else {
		console.log('Somehow this is not a Group, so cant monitor the conference');
	}
}
