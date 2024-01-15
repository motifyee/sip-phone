// Missed Item Notification
// ========================
function IncreaseMissedBadge(buddy) {
	var buddyObj = FindBuddyByIdentity(buddy);
	if (buddyObj == null) return;

	// Up the Missed Count
	// ===================
	buddyObj.missed += 1;

	// Take Out
	var json = JSON.parse(localDB.getItem(profileUserID + '-Buddies'));
	if (json != null) {
		$.each(json.DataCollection, function (i, item) {
			if (item.uID == buddy || item.cID == buddy || item.gID == buddy) {
				item.missed = item.missed + 1;
				return false;
			}
		});
		// Put Back
		localDB.setItem(profileUserID + '-Buddies', JSON.stringify(json));
	}

	// Update Badge
	// ============
	$('#contact-' + buddy + '-missed').text(buddyObj.missed);
	$('#contact-' + buddy + '-missed').show();
	console.log('Set Missed badge for ' + buddy + ' to: ' + buddyObj.missed);
}
function UpdateBuddyActivity(buddy) {
	var buddyObj = FindBuddyByIdentity(buddy);
	if (buddyObj == null) return;

	// Update Last Activity Time
	// =========================
	var timeStamp = utcDateNow();
	buddyObj.lastActivity = timeStamp;
	console.log('Last Activity is now: ' + timeStamp);

	// Take Out
	var json = JSON.parse(localDB.getItem(profileUserID + '-Buddies'));
	if (json != null) {
		$.each(json.DataCollection, function (i, item) {
			if (item.uID == buddy || item.cID == buddy || item.gID == buddy) {
				item.LastActivity = timeStamp;
				return false;
			}
		});
		// Put Back
		localDB.setItem(profileUserID + '-Buddies', JSON.stringify(json));
	}

	// List Update
	// ===========
	UpdateBuddyList();
}
function ClearMissedBadge(buddy) {
	var buddyObj = FindBuddyByIdentity(buddy);
	if (buddyObj == null) return;

	buddyObj.missed = 0;

	// Take Out
	var json = JSON.parse(localDB.getItem(profileUserID + '-Buddies'));
	if (json != null) {
		$.each(json.DataCollection, function (i, item) {
			if (item.uID == buddy || item.cID == buddy || item.gID == buddy) {
				item.missed = 0;
				return false;
			}
		});
		// Put Back
		localDB.setItem(profileUserID + '-Buddies', JSON.stringify(json));
	}

	$('#contact-' + buddy + '-missed').text(buddyObj.missed);
	$('#contact-' + buddy + '-missed').hide(400);
}

// Outbound Calling
// ================
function VideoCall(lineObj, dialledNumber) {
	if (userAgent == null) return;
	if (!userAgent.isRegistered()) return;
	if (lineObj == null) return;

	if (HasAudioDevice == false) {
		Alert(lang.alert_no_microphone);
		return;
	}

	if (HasVideoDevice == false) {
		console.warn('No video devices (webcam) found, switching to audio call.');
		AudioCall(lineObj, dialledNumber);
		return;
	}

	var supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
	var spdOptions = {
		sessionDescriptionHandlerOptions: {
			constraints: {
				audio: { deviceId: 'default' },
				video: { deviceId: 'default' },
			},
		},
	};

	// Configure Audio
	var currentAudioDevice = getAudioSrcID();
	if (currentAudioDevice != 'default') {
		var confirmedAudioDevice = false;
		for (var i = 0; i < AudioinputDevices.length; ++i) {
			if (currentAudioDevice == AudioinputDevices[i].deviceId) {
				confirmedAudioDevice = true;
				break;
			}
		}
		if (confirmedAudioDevice) {
			spdOptions.sessionDescriptionHandlerOptions.constraints.audio.deviceId = {
				exact: currentAudioDevice,
			};
		} else {
			console.warn(
				'The audio device you used before is no longer available, default settings applied.'
			);
			localDB.setItem('AudioSrcId', 'default');
		}
	}
	// Add additional Constraints
	if (supportedConstraints.autoGainControl) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.autoGainControl =
			AutoGainControl;
	}
	if (supportedConstraints.echoCancellation) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.echoCancellation =
			EchoCancellation;
	}
	if (supportedConstraints.noiseSuppression) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.noiseSuppression =
			NoiseSuppression;
	}

	// Configure Video
	var currentVideoDevice = getVideoSrcID();
	if (currentVideoDevice != 'default') {
		var confirmedVideoDevice = false;
		for (var i = 0; i < VideoinputDevices.length; ++i) {
			if (currentVideoDevice == VideoinputDevices[i].deviceId) {
				confirmedVideoDevice = true;
				break;
			}
		}
		if (confirmedVideoDevice) {
			spdOptions.sessionDescriptionHandlerOptions.constraints.video.deviceId = {
				exact: currentVideoDevice,
			};
		} else {
			console.warn(
				'The video device you used before is no longer available, default settings applied.'
			);
			localDB.setItem('VideoSrcId', 'default'); // resets for later and subsequent calls
		}
	}
	// Add additional Constraints
	if (supportedConstraints.frameRate && maxFrameRate != '') {
		spdOptions.sessionDescriptionHandlerOptions.constraints.video.frameRate =
			maxFrameRate;
	}
	if (supportedConstraints.height && videoHeight != '') {
		spdOptions.sessionDescriptionHandlerOptions.constraints.video.height =
			videoHeight;
	}
	console.log(supportedConstraints);
	console.log(supportedConstraints.aspectRatio);
	console.log(videoAspectRatio);
	if (supportedConstraints.aspectRatio && videoAspectRatio != '') {
		spdOptions.sessionDescriptionHandlerOptions.constraints.video.aspectRatio =
			videoAspectRatio;
	}

	$('#line-' + lineObj.LineNumber + '-msg').html(lang.starting_video_call);
	$('#line-' + lineObj.LineNumber + '-timer').show();

	// Invite
	console.log('INVITE (video): ' + dialledNumber + '@' + wssServer, spdOptions);
	lineObj.SipSession = userAgent.invite(
		'sip:' + dialledNumber + '@' + wssServer,
		spdOptions
	);

	var startTime = moment.utc();
	lineObj.SipSession.data.line = lineObj.LineNumber;
	lineObj.SipSession.data.buddyId = lineObj.BuddyObj.identity;
	lineObj.SipSession.data.calldirection = 'outbound';
	lineObj.SipSession.data.dst = dialledNumber;
	lineObj.SipSession.data.callstart = startTime.format(
		'YYYY-MM-DD HH:mm:ss UTC'
	);
	lineObj.SipSession.data.callTimer = window.setInterval(function () {
		var now = moment.utc();
		var duration = moment.duration(now.diff(startTime));
		$('#line-' + lineObj.LineNumber + '-timer').html(
			formatShortDuration(duration.asSeconds())
		);
	}, 1000);
	lineObj.SipSession.data.VideoSourceDevice = getVideoSrcID();
	lineObj.SipSession.data.AudioSourceDevice = getAudioSrcID();
	lineObj.SipSession.data.AudioOutputDevice = getAudioOutputID();
	lineObj.SipSession.data.terminateby = 'them';
	lineObj.SipSession.data.withvideo = true;

	updateLineScroll(lineObj.LineNumber);

	// Do Nessesary UI Wireup
	wireupVideoSession(lineObj);

	// Custom Web hook
	if (typeof web_hook_on_invite !== 'undefined')
		web_hook_on_invite(lineObj.SipSession);
}
function AudioCallMenu(buddy, obj) {
	var x = window.dhx4.absLeft(obj);
	var y = window.dhx4.absTop(obj);
	var w = obj.offsetWidth;
	var h = obj.offsetHeight;

	if (dhtmlxPopup != null) {
		dhtmlxPopup.hide();
		dhtmlxPopup.unload();
		dhtmlxPopup = null;
	}
	dhtmlxPopup = new dhtmlXPopup();

	var buddyObj = FindBuddyByIdentity(buddy);
	if (buddyObj.type == 'extension') {
		// Extension
		var items = [
			{
				id: 1,
				name: '<i class="fa fa-phone-square"></i> ' + lang.call_extension,
				number: buddyObj.ExtNo,
			},
		];
		if (buddyObj.MobileNumber != null && buddyObj.MobileNumber != '')
			items.push({
				id: 2,
				name: '<i class="fa fa-mobile"></i> ' + lang.call_mobile,
				number: buddyObj.MobileNumber,
			});
		if (buddyObj.ContactNumber1 != null && buddyObj.ContactNumber1 != '')
			items.push({
				id: 3,
				name: '<i class="fa fa-phone"></i> ' + lang.call_number,
				number: buddyObj.ContactNumber1,
			});
		if (buddyObj.ContactNumber2 != null && buddyObj.ContactNumber2 != '')
			items.push({
				id: 4,
				name: '<i class="fa fa-phone"></i> ' + lang.call_number,
				number: buddyObj.ContactNumber2,
			});
		dhtmlxPopup.attachList('name,number', items);
		dhtmlxPopup.attachEvent('onClick', function (id) {
			var NumberToDial = dhtmlxPopup.getItemData(id).number;
			console.log('Menu click AudioCall(' + buddy + ', ' + NumberToDial + ')');
			dhtmlxPopup.hide();
			DialByLine('audio', buddy, NumberToDial);
		});
	} else if (buddyObj.type == 'contact') {
		// Contact
		var items = [];
		if (buddyObj.MobileNumber != null && buddyObj.MobileNumber != '')
			items.push({
				id: 1,
				name: '<i class="fa fa-mobile"></i> ' + lang.call_mobile,
				number: buddyObj.MobileNumber,
			});
		if (buddyObj.ContactNumber1 != null && buddyObj.ContactNumber1 != '')
			items.push({
				id: 2,
				name: '<i class="fa fa-phone"></i> ' + lang.call_number,
				number: buddyObj.ContactNumber1,
			});
		if (buddyObj.ContactNumber2 != null && buddyObj.ContactNumber2 != '')
			items.push({
				id: 3,
				name: '<i class="fa fa-phone"></i> ' + lang.call_number,
				number: buddyObj.ContactNumber2,
			});
		dhtmlxPopup.attachList('name,number', items);
		dhtmlxPopup.attachEvent('onClick', function (id) {
			var NumberToDial = dhtmlxPopup.getItemData(id).number;
			console.log('Menu click AudioCall(' + buddy + ', ' + NumberToDial + ')');
			dhtmlxPopup.hide();
			DialByLine('audio', buddy, NumberToDial);
		});
	} else if (buddyObj.type == 'group') {
		dhtmlxPopup.attachList('name,number', [
			{
				id: 1,
				name: '<i class="fa fa-users"></i> ' + lang.call_group,
				number: buddyObj.ExtNo,
			},
		]);
		dhtmlxPopup.attachEvent('onClick', function (id) {
			console.log('Menu click AudioCallGroup(' + buddy + ')');
			dhtmlxPopup.hide();
			DialByLine('audio', buddy, dhtmlxPopup.getItemData(id).number);
		});
	}
	dhtmlxPopup.show(x, y, w, h);
}
function AudioCall(lineObj, dialledNumber) {
	if (userAgent == null) return;
	if (userAgent.isRegistered() == false) return;
	if (lineObj == null) return;

	if (HasAudioDevice == false) {
		Alert(lang.alert_no_microphone);
		return;
	}

	var supportedConstraints = navigator.mediaDevices.getSupportedConstraints();

	var spdOptions = {
		sessionDescriptionHandlerOptions: {
			constraints: {
				audio: { deviceId: 'default' },
				video: false,
			},
		},
	};
	// Configure Audio
	var currentAudioDevice = getAudioSrcID();
	if (currentAudioDevice != 'default') {
		var confirmedAudioDevice = false;
		for (var i = 0; i < AudioinputDevices.length; ++i) {
			if (currentAudioDevice == AudioinputDevices[i].deviceId) {
				confirmedAudioDevice = true;
				break;
			}
		}
		if (confirmedAudioDevice) {
			spdOptions.sessionDescriptionHandlerOptions.constraints.audio.deviceId = {
				exact: currentAudioDevice,
			};
		} else {
			console.warn(
				'The audio device you used before is no longer available, default settings applied.'
			);
			localDB.setItem('AudioSrcId', 'default');
		}
	}
	// Add additional Constraints
	if (supportedConstraints.autoGainControl) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.autoGainControl =
			AutoGainControl;
	}
	if (supportedConstraints.echoCancellation) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.echoCancellation =
			EchoCancellation;
	}
	if (supportedConstraints.noiseSuppression) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.noiseSuppression =
			NoiseSuppression;
	}

	// Set ICE/STUN Server
	// spdOptions.sessionDescriptionHandlerOptions.options.peerConnectionOptions.rtcConfiguration.iceServers = [{urls: 'stun:stun.l.google.com:9999'}]

	$('#line-' + lineObj.LineNumber + '-msg').html(lang.starting_audio_call);
	$('#line-' + lineObj.LineNumber + '-timer').show();

	// Invite
	console.log('INVITE (audio): ' + dialledNumber + '@' + wssServer);
	lineObj.SipSession = userAgent.invite(
		'sip:' + dialledNumber + '@' + wssServer,
		spdOptions
	);

	var startTime = moment.utc();
	lineObj.SipSession.data.line = lineObj.LineNumber;
	lineObj.SipSession.data.buddyId = lineObj.BuddyObj.identity;
	lineObj.SipSession.data.calldirection = 'outbound';
	lineObj.SipSession.data.dst = dialledNumber;
	lineObj.SipSession.data.callstart = startTime.format(
		'YYYY-MM-DD HH:mm:ss UTC'
	);
	lineObj.SipSession.data.callTimer = window.setInterval(function () {
		var now = moment.utc();
		var duration = moment.duration(now.diff(startTime));
		$('#line-' + lineObj.LineNumber + '-timer').html(
			formatShortDuration(duration.asSeconds())
		);
	}, 1000);
	lineObj.SipSession.data.VideoSourceDevice = null;
	lineObj.SipSession.data.AudioSourceDevice = getAudioSrcID();
	lineObj.SipSession.data.AudioOutputDevice = getAudioOutputID();
	lineObj.SipSession.data.terminateby = 'them';
	lineObj.SipSession.data.withvideo = false;

	updateLineScroll(lineObj.LineNumber);

	// Do Nessesary UI Wireup
	wireupAudioSession(lineObj);

	// Custom Web hook
	if (typeof web_hook_on_invite !== 'undefined')
		web_hook_on_invite(lineObj.SipSession);
}

// Sessions & During Call Activity
// ===============================
function getSession(buddy) {
	if (userAgent == null) {
		console.warn('userAgent is null');
		return;
	}
	if (userAgent.isRegistered() == false) {
		console.warn('userAgent is not registered');
		return;
	}

	var rtnSession = null;
	$.each(userAgent.sessions, function (i, session) {
		if (session.data.buddyId == buddy) {
			rtnSession = session;
			return false;
		}
	});
	return rtnSession;
}
function countSessions(id) {
	var rtn = 0;
	if (userAgent == null) {
		console.warn('userAgent is null');
		return 0;
	}
	$.each(userAgent.sessions, function (i, session) {
		if (id != session.id) rtn++;
	});
	return rtn;
}
function StartRecording(lineNum) {
	if (CallRecordingPolicy == 'disabled') {
		console.warn('Policy Disabled: Call Recording');
		return;
	}
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null) return;

	$('#line-' + lineObj.LineNumber + '-btn-start-recording').hide();
	$('#line-' + lineObj.LineNumber + '-btn-stop-recording').show();

	var session = lineObj.SipSession;
	if (session == null) {
		console.warn('Could not find session');
		return;
	}

	var id = uID();

	if (!session.data.recordings) session.data.recordings = [];
	session.data.recordings.push({
		uID: id,
		startTime: utcDateNow(),
		stopTime: utcDateNow(),
	});

	if (!session.data.mediaRecorder) {
		console.log('Creating call recorder...');

		var recordStream = new MediaStream();
		var pc = session.sessionDescriptionHandler.peerConnection;
		pc.getSenders().forEach(function (RTCRtpSender) {
			if (RTCRtpSender.track && RTCRtpSender.track.kind == 'audio') {
				console.log(
					'Adding sender audio track to record:',
					RTCRtpSender.track.label
				);
				recordStream.addTrack(RTCRtpSender.track);
			}
		});
		pc.getReceivers().forEach(function (RTCRtpReceiver) {
			if (RTCRtpReceiver.track && RTCRtpReceiver.track.kind == 'audio') {
				console.log(
					'Adding receiver audio track to record:',
					RTCRtpReceiver.track.label
				);
				recordStream.addTrack(RTCRtpReceiver.track);
			}
			if (session.data.withvideo) {
				if (RTCRtpReceiver.track && RTCRtpReceiver.track.kind == 'video') {
					console.log(
						'Adding receiver video track to record:',
						RTCRtpReceiver.track.label
					);
					recordStream.addTrack(RTCRtpReceiver.track);
				}
			}
		});

		// Resample the Video Recording
		if (session.data.withvideo) {
			var recordingWidth = 640;
			var recordingHeight = 360;
			var pnpVideSize = 100;
			if (RecordingVideoSize == 'HD') {
				recordingWidth = 1280;
				recordingHeight = 720;
				pnpVideSize = 144;
			}
			if (RecordingVideoSize == 'FHD') {
				recordingWidth = 1920;
				recordingHeight = 1080;
				pnpVideSize = 240;
			}

			// them-pnp
			var pnpVideo = $('#line-' + lineObj.LineNumber + '-localVideo').get(0);
			var mainVideo = $('#line-' + lineObj.LineNumber + '-remoteVideo').get(0);
			if (RecordingLayout == 'us-pnp') {
				pnpVideo = $('#line-' + lineObj.LineNumber + '-remoteVideo').get(0);
				mainVideo = $('#line-' + lineObj.LineNumber + '-localVideo').get(0);
			}
			var recordingCanvas = $('<canvas/>').get(0);
			recordingCanvas.width =
				RecordingLayout == 'side-by-side'
					? recordingWidth * 2 + 5
					: recordingWidth;
			recordingCanvas.height = recordingHeight;
			var recordingContext = recordingCanvas.getContext('2d');

			window.clearInterval(session.data.recordingRedrawInterval);
			session.data.recordingRedrawInterval = window.setInterval(function () {
				// Main Video
				var videoWidth =
					mainVideo.videoWidth > 0 ? mainVideo.videoWidth : recordingWidth;
				var videoHeight =
					mainVideo.videoHeight > 0 ? mainVideo.videoHeight : recordingHeight;

				if (videoWidth >= videoHeight) {
					// Landscape / Square
					var scale = recordingWidth / videoWidth;
					videoWidth = recordingWidth;
					videoHeight = videoHeight * scale;
					if (videoHeight > recordingHeight) {
						var scale = recordingHeight / videoHeight;
						videoHeight = recordingHeight;
						videoWidth = videoWidth * scale;
					}
				} else {
					// Portrait
					var scale = recordingHeight / videoHeight;
					videoHeight = recordingHeight;
					videoWidth = videoWidth * scale;
				}
				var offsetX =
					videoWidth < recordingWidth ? (recordingWidth - videoWidth) / 2 : 0;
				var offsetY =
					videoHeight < recordingHeight
						? (recordingHeight - videoHeight) / 2
						: 0;
				if (RecordingLayout == 'side-by-side')
					offsetX = recordingWidth + 5 + offsetX;

				// Picture-in-Picture Video
				var pnpVideoHeight = pnpVideo.videoHeight;
				var pnpVideoWidth = pnpVideo.videoWidth;
				if (pnpVideoHeight > 0) {
					if (pnpVideoWidth >= pnpVideoHeight) {
						var scale = pnpVideSize / pnpVideoHeight;
						pnpVideoHeight = pnpVideSize;
						pnpVideoWidth = pnpVideoWidth * scale;
					} else {
						var scale = pnpVideSize / pnpVideoWidth;
						pnpVideoWidth = pnpVideSize;
						pnpVideoHeight = pnpVideoHeight * scale;
					}
				}
				var pnpOffsetX = 10;
				var pnpOffsetY = 10;
				if (RecordingLayout == 'side-by-side') {
					pnpVideoWidth = pnpVideo.videoWidth;
					pnpVideoHeight = pnpVideo.videoHeight;
					if (pnpVideoWidth >= pnpVideoHeight) {
						// Landscape / Square
						var scale = recordingWidth / pnpVideoWidth;
						pnpVideoWidth = recordingWidth;
						pnpVideoHeight = pnpVideoHeight * scale;
						if (pnpVideoHeight > recordingHeight) {
							var scale = recordingHeight / pnpVideoHeight;
							pnpVideoHeight = recordingHeight;
							pnpVideoWidth = pnpVideoWidth * scale;
						}
					} else {
						// Portrait
						var scale = recordingHeight / pnpVideoHeight;
						pnpVideoHeight = recordingHeight;
						pnpVideoWidth = pnpVideoWidth * scale;
					}
					pnpOffsetX =
						pnpVideoWidth < recordingWidth
							? (recordingWidth - pnpVideoWidth) / 2
							: 0;
					pnpOffsetY =
						pnpVideoHeight < recordingHeight
							? (recordingHeight - pnpVideoHeight) / 2
							: 0;
				}

				// Draw Elements
				recordingContext.fillRect(
					0,
					0,
					recordingCanvas.width,
					recordingCanvas.height
				);
				if (mainVideo.videoHeight > 0) {
					recordingContext.drawImage(
						mainVideo,
						offsetX,
						offsetY,
						videoWidth,
						videoHeight
					);
				}
				if (
					pnpVideo.videoHeight > 0 &&
					(RecordingLayout == 'side-by-side' ||
						RecordingLayout == 'us-pnp' ||
						RecordingLayout == 'them-pnp')
				) {
					// Only Draw the Pnp Video when needed
					recordingContext.drawImage(
						pnpVideo,
						pnpOffsetX,
						pnpOffsetY,
						pnpVideoWidth,
						pnpVideoHeight
					);
				}
			}, Math.floor(1000 / RecordingVideoFps));
			var recordingVideoMediaStream =
				recordingCanvas.captureStream(RecordingVideoFps);
		}

		var mixedAudioVideoRecordStream = new MediaStream();
		mixedAudioVideoRecordStream.addTrack(
			MixAudioStreams(recordStream).getAudioTracks()[0]
		);
		if (session.data.withvideo) {
			// mixedAudioVideoRecordStream.addTrack(recordStream.getVideoTracks()[0]);
			mixedAudioVideoRecordStream.addTrack(
				recordingVideoMediaStream.getVideoTracks()[0]
			);
		}

		var mediaType = 'audio/webm';
		if (session.data.withvideo) mediaType = 'video/webm';
		var options = {
			mimeType: mediaType,
		};
		var mediaRecorder = new MediaRecorder(mixedAudioVideoRecordStream, options);
		mediaRecorder.data = {};
		mediaRecorder.data.id = '' + id;
		mediaRecorder.data.sessionId = '' + session.id;
		mediaRecorder.data.buddyId = '' + lineObj.BuddyObj.identity;
		mediaRecorder.ondataavailable = function (event) {
			console.log(
				'Got Call Recording Data: ',
				event.data.size + 'Bytes',
				this.data.id,
				this.data.buddyId,
				this.data.sessionId
			);
			// Save the Audio/Video file
			SaveCallRecording(
				event.data,
				this.data.id,
				this.data.buddyId,
				this.data.sessionId
			);
		};

		console.log('Starting Call Recording', id);
		session.data.mediaRecorder = mediaRecorder;
		session.data.mediaRecorder.start(); // Safari does not support timeslice
		session.data.recordings[session.data.recordings.length - 1].startTime =
			utcDateNow();

		$('#line-' + lineObj.LineNumber + '-msg').html(lang.call_recording_started);

		updateLineScroll(lineNum);
	} else if (session.data.mediaRecorder.state == 'inactive') {
		session.data.mediaRecorder.data = {};
		session.data.mediaRecorder.data.id = '' + id;
		session.data.mediaRecorder.data.sessionId = '' + session.id;
		session.data.mediaRecorder.data.buddyId = '' + lineObj.BuddyObj.identity;

		console.log('Starting Call Recording', id);
		session.data.mediaRecorder.start();
		session.data.recordings[session.data.recordings.length - 1].startTime =
			utcDateNow();

		$('#line-' + lineObj.LineNumber + '-msg').html(lang.call_recording_started);

		updateLineScroll(lineNum);
	} else {
		console.warn('Recorder is in an unknow state');
	}
}
function SaveCallRecording(blob, id, buddy, sessionid) {
	var indexedDB = window.indexedDB;
	var request = indexedDB.open('CallRecordings');
	request.onerror = function (event) {
		console.error('IndexDB Request Error:', event);
	};
	request.onupgradeneeded = function (event) {
		console.warn(
			'Upgrade Required for IndexDB... probably because of first time use.'
		);
		var IDB = event.target.result;

		// Create Object Store
		if (IDB.objectStoreNames.contains('Recordings') == false) {
			var objectStore = IDB.createObjectStore('Recordings', { keyPath: 'uID' });
			objectStore.createIndex('sessionid', 'sessionid', { unique: false });
			objectStore.createIndex('bytes', 'bytes', { unique: false });
			objectStore.createIndex('type', 'type', { unique: false });
			objectStore.createIndex('mediaBlob', 'mediaBlob', { unique: false });
		} else {
			console.warn('IndexDB requested upgrade, but object store was in place');
		}
	};
	request.onsuccess = function (event) {
		console.log('IndexDB connected to CallRecordings');

		var IDB = event.target.result;
		if (IDB.objectStoreNames.contains('Recordings') == false) {
			console.warn('IndexDB CallRecordings.Recordings does not exists');
			return;
		}
		IDB.onerror = function (event) {
			console.error('IndexDB Error:', event);
		};

		// Prepare data to write
		var data = {
			uID: id,
			sessionid: sessionid,
			bytes: blob.size,
			type: blob.type,
			mediaBlob: blob,
		};
		// Commit Transaction
		var transaction = IDB.transaction(['Recordings'], 'readwrite');
		var objectStoreAdd = transaction.objectStore('Recordings').add(data);
		objectStoreAdd.onsuccess = function (event) {
			console.log(
				'Call Recording Sucess: ',
				id,
				blob.size,
				blob.type,
				buddy,
				sessionid
			);
		};
	};
}
function StopRecording(lineNum, noConfirm) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) return;

	var session = lineObj.SipSession;
	if (noConfirm == true) {
		// Called at the end of a caill
		$('#line-' + lineObj.LineNumber + '-btn-start-recording').show();
		$('#line-' + lineObj.LineNumber + '-btn-stop-recording').hide();

		if (session.data.mediaRecorder) {
			if (session.data.mediaRecorder.state == 'recording') {
				console.log('Stopping Call Recording');
				session.data.mediaRecorder.stop();
				session.data.recordings[session.data.recordings.length - 1].stopTime =
					utcDateNow();
				window.clearInterval(session.data.recordingRedrawInterval);

				$('#line-' + lineObj.LineNumber + '-msg').html(
					lang.call_recording_stopped
				);

				updateLineScroll(lineNum);
			} else {
				console.warn('Recorder is in an unknow state');
			}
		}
		return;
	} else {
		// User attempts to end call recording
		if (CallRecordingPolicy == 'enabled') {
			console.log('Policy Enabled: Call Recording');
		}

		Confirm(lang.confirm_stop_recording, lang.stop_recording, function () {
			$('#line-' + lineObj.LineNumber + '-btn-start-recording').show();
			$('#line-' + lineObj.LineNumber + '-btn-stop-recording').hide();

			if (session.data.mediaRecorder) {
				if (session.data.mediaRecorder.state == 'recording') {
					console.log('Stopping Call Recording');
					session.data.mediaRecorder.stop();
					session.data.recordings[session.data.recordings.length - 1].stopTime =
						utcDateNow();
					window.clearInterval(session.data.recordingRedrawInterval);

					$('#line-' + lineObj.LineNumber + '-msg').html(
						lang.call_recording_stopped
					);

					updateLineScroll(lineNum);
				} else {
					console.warn('Recorder is in an unknow state');
				}
			}
		});
	}
}
function PlayAudioCallRecording(obj, cdrId, uID) {
	var container = $(obj).parent();
	container.empty();

	var audioObj = new Audio();
	audioObj.autoplay = false;
	audioObj.controls = true;

	// Make sure you are playing out via the correct device
	var sinkId = getAudioOutputID();
	if (typeof audioObj.sinkId !== 'undefined') {
		audioObj
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

	container.append(audioObj);

	// Get Call Recording
	var indexedDB = window.indexedDB;
	var request = indexedDB.open('CallRecordings');
	request.onerror = function (event) {
		console.error('IndexDB Request Error:', event);
	};
	request.onupgradeneeded = function (event) {
		console.warn(
			'Upgrade Required for IndexDB... probably because of first time use.'
		);
	};
	request.onsuccess = function (event) {
		console.log('IndexDB connected to CallRecordings');

		var IDB = event.target.result;
		if (IDB.objectStoreNames.contains('Recordings') == false) {
			console.warn('IndexDB CallRecordings.Recordings does not exists');
			return;
		}

		var transaction = IDB.transaction(['Recordings']);
		var objectStoreGet = transaction.objectStore('Recordings').get(uID);
		objectStoreGet.onerror = function (event) {
			console.error('IndexDB Get Error:', event);
		};
		objectStoreGet.onsuccess = function (event) {
			$('#cdr-media-meta-size-' + cdrId + '-' + uID).html(
				' Size: ' + formatBytes(event.target.result.bytes)
			);
			$('#cdr-media-meta-codec-' + cdrId + '-' + uID).html(
				' Codec: ' + event.target.result.type
			);

			// Play
			audioObj.src = window.URL.createObjectURL(event.target.result.mediaBlob);
			audioObj.oncanplaythrough = function () {
				audioObj
					.play()
					.then(function () {
						console.log('Playback started');
					})
					.catch(function (e) {
						console.error('Error playing back file: ', e);
					});
			};
		};
	};
}
function PlayVideoCallRecording(obj, cdrId, uID, buddy) {
	var container = $(obj).parent();
	container.empty();

	var videoObj = $('<video>').get(0);
	videoObj.id = 'callrecording-video-' + cdrId;
	videoObj.autoplay = false;
	videoObj.controls = true;
	videoObj.ontimeupdate = function (event) {
		$('#cdr-video-meta-width-' + cdrId + '-' + uID).html(
			lang.width + ' : ' + event.target.videoWidth + 'px'
		);
		$('#cdr-video-meta-height-' + cdrId + '-' + uID).html(
			lang.height + ' : ' + event.target.videoHeight + 'px'
		);
	};

	var sinkId = getAudioOutputID();
	if (typeof videoObj.sinkId !== 'undefined') {
		videoObj
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

	container.append(videoObj);

	// Get Call Recording
	var indexedDB = window.indexedDB;
	var request = indexedDB.open('CallRecordings');
	request.onerror = function (event) {
		console.error('IndexDB Request Error:', event);
	};
	request.onupgradeneeded = function (event) {
		console.warn(
			'Upgrade Required for IndexDB... probably because of first time use.'
		);
	};
	request.onsuccess = function (event) {
		console.log('IndexDB connected to CallRecordings');

		var IDB = event.target.result;
		if (IDB.objectStoreNames.contains('Recordings') == false) {
			console.warn('IndexDB CallRecordings.Recordings does not exists');
			return;
		}

		var transaction = IDB.transaction(['Recordings']);
		var objectStoreGet = transaction.objectStore('Recordings').get(uID);
		objectStoreGet.onerror = function (event) {
			console.error('IndexDB Get Error:', event);
		};
		objectStoreGet.onsuccess = function (event) {
			$('#cdr-media-meta-size-' + cdrId + '-' + uID).html(
				' Size: ' + formatBytes(event.target.result.bytes)
			);
			$('#cdr-media-meta-codec-' + cdrId + '-' + uID).html(
				' Codec: ' + event.target.result.type
			);

			// Play
			videoObj.src = window.URL.createObjectURL(event.target.result.mediaBlob);
			videoObj.oncanplaythrough = function () {
				try {
					videoObj.scrollIntoViewIfNeeded(false);
				} catch (e) {}
				videoObj
					.play()
					.then(function () {
						console.log('Playback started');
					})
					.catch(function (e) {
						console.error('Error playing back file: ', e);
					});

				// Create a Post Image after a second
				if (buddy) {
					window.setTimeout(function () {
						var canvas = $('<canvas>').get(0);
						var videoWidth = videoObj.videoWidth;
						var videoHeight = videoObj.videoHeight;
						if (videoWidth > videoHeight) {
							// Landscape
							if (videoHeight > 225) {
								var p = 225 / videoHeight;
								videoHeight = 225;
								videoWidth = videoWidth * p;
							}
						} else {
							// Portrait
							if (videoHeight > 225) {
								var p = 225 / videoWidth;
								videoWidth = 225;
								videoHeight = videoHeight * p;
							}
						}
						canvas.width = videoWidth;
						canvas.height = videoHeight;
						canvas
							.getContext('2d')
							.drawImage(videoObj, 0, 0, videoWidth, videoHeight);
						canvas.toBlob(
							function (blob) {
								var reader = new FileReader();
								reader.readAsDataURL(blob);
								reader.onloadend = function () {
									var Poster = {
										width: videoWidth,
										height: videoHeight,
										posterBase64: reader.result,
									};
									console.log('Capturing Video Poster...');

									// Update DB
									var currentStream = JSON.parse(
										localDB.getItem(buddy + '-stream')
									);
									if (
										currentStream != null ||
										currentStream.DataCollection != null
									) {
										$.each(currentStream.DataCollection, function (i, item) {
											if (item.ItemType == 'CDR' && item.CdrId == cdrId) {
												// Found
												if (item.Recordings && item.Recordings.length >= 1) {
													$.each(item.Recordings, function (r, recording) {
														if (recording.uID == uID) recording.Poster = Poster;
													});
												}
												return false;
											}
										});
										localDB.setItem(
											buddy + '-stream',
											JSON.stringify(currentStream)
										);
										console.log('Capturing Video Poster, Done');
									}
								};
							},
							'image/jpeg',
							PosterJpegQuality
						);
					}, 1000);
				}
			};
		};
	};
}

// Stream Manipulations
// ====================
function MixAudioStreams(MultiAudioTackStream) {
	// Takes in a MediaStream with any mumber of audio tracks and mixes them together

	var audioContext = null;
	try {
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		audioContext = new AudioContext();
	} catch (e) {
		console.warn('AudioContext() not available, cannot record');
		return MultiAudioTackStream;
	}
	var mixedAudioStream = audioContext.createMediaStreamDestination();
	MultiAudioTackStream.getAudioTracks().forEach(function (audioTrack) {
		var srcStream = new MediaStream();
		srcStream.addTrack(audioTrack);
		var streamSourceNode = audioContext.createMediaStreamSource(srcStream);
		streamSourceNode.connect(mixedAudioStream);
	});

	return mixedAudioStream.stream;
}

// Call Transfer & Conference
// ============================
function QuickFindBuddy(obj) {
	var x = window.dhx4.absLeft(obj);
	var y = window.dhx4.absTop(obj);
	var w = obj.offsetWidth;
	var h = obj.offsetHeight;

	HidePopup();

	var filter = obj.value;
	if (filter == '') return;

	console.log('Find Buddy: ', filter);

	Buddies.sort(function (a, b) {
		if (a.CallerIDName < b.CallerIDName) return -1;
		if (a.CallerIDName > b.CallerIDName) return 1;
		return 0;
	});

	dhtmlxPopup = new dhtmlXPopup();

	var visibleItems = 0;
	var menu = [];
	for (var b = 0; b < Buddies.length; b++) {
		var buddyObj = Buddies[b];

		// Perform Filter Display
		var display = false;
		if (buddyObj.CallerIDName.toLowerCase().indexOf(filter.toLowerCase()) > -1)
			display = true;
		if (buddyObj.ExtNo.toLowerCase().indexOf(filter.toLowerCase()) > -1)
			display = true;
		if (buddyObj.Desc.toLowerCase().indexOf(filter.toLowerCase()) > -1)
			display = true;
		if (buddyObj.MobileNumber.toLowerCase().indexOf(filter.toLowerCase()) > -1)
			display = true;
		if (
			buddyObj.ContactNumber1.toLowerCase().indexOf(filter.toLowerCase()) > -1
		)
			display = true;
		if (
			buddyObj.ContactNumber2.toLowerCase().indexOf(filter.toLowerCase()) > -1
		)
			display = true;
		if (display) {
			// Filtered Results
			var iconColor = '#404040';
			if (
				buddyObj.presence == 'Unknown' ||
				buddyObj.presence == 'Not online' ||
				buddyObj.presence == 'Unavailable'
			)
				iconColor = '#666666';
			if (buddyObj.presence == 'Ready') iconColor = '#3fbd3f';
			if (
				buddyObj.presence == 'On the phone' ||
				buddyObj.presence == 'Ringing' ||
				buddyObj.presence == 'On hold'
			)
				iconColor = '#c99606';
			menu.push({
				id: b,
				name: '<b>' + buddyObj.CallerIDName + '</b>',
				number: null,
			});
			if (buddyObj.ExtNo != '')
				menu.push({
					id: 'e' + b,
					name:
						'<i class="fa fa-phone-square" style="color:' +
						iconColor +
						'"></i> ' +
						lang.extension +
						' (' +
						buddyObj.presence +
						'): ' +
						buddyObj.ExtNo,
					number: buddyObj.ExtNo,
				});
			if (buddyObj.MobileNumber != '')
				menu.push({
					id: 'm' + b,
					name:
						'<i class="fa fa-mobile"></i> ' +
						lang.mobile +
						': ' +
						buddyObj.MobileNumber,
					number: buddyObj.MobileNumber,
				});
			if (buddyObj.ContactNumber1 != '')
				menu.push({
					id: 'c1' + b,
					name:
						'<i class="fa fa-phone"></i> ' +
						lang.call +
						': ' +
						buddyObj.ContactNumber1,
					number: buddyObj.ContactNumber1,
				});
			if (buddyObj.ContactNumber2 != '')
				menu.push({
					id: 'c2' + b,
					name:
						'<i class="fa fa-phone"></i> ' +
						lang.call +
						': ' +
						buddyObj.ContactNumber2,
					number: buddyObj.ContactNumber2,
				});
			menu.push(dhtmlxPopup.separator);
			visibleItems++;
		}
		if (visibleItems >= 5) break;
	}

	if (menu.length > 1) {
		dhtmlxPopup.attachList('name', menu);
		dhtmlxPopup.attachEvent('onClick', function (id) {
			var data = dhtmlxPopup.getItemData(id);
			if (data.number) obj.value = data.number;
		});
		dhtmlxPopup.show(x, y, w, h);
	}
}

// Call Transfer
// =============
function StartTransferSession(lineNum) {
	$('#line-' + lineNum + '-btn-Transfer').hide();
	$('#line-' + lineNum + '-btn-CancelTransfer').show();

	holdSession(lineNum);
	$('#line-' + lineNum + '-txt-FindTransferBuddy').val('');
	$('#line-' + lineNum + '-txt-FindTransferBuddy')
		.parent()
		.show();

	$('#line-' + lineNum + '-btn-blind-transfer').show();
	$('#line-' + lineNum + '-btn-attended-transfer').show();
	$('#line-' + lineNum + '-btn-complete-transfer').hide();
	$('#line-' + lineNum + '-btn-cancel-transfer').hide();

	$('#line-' + lineNum + '-transfer-status').hide();

	$('#line-' + lineNum + '-Transfer').show();

	updateLineScroll(lineNum);
}
function CancelTransferSession(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		console.warn('Null line or session');
		return;
	}
	var session = lineObj.SipSession;
	if (session.data.childsession) {
		console.log(
			'Child Transfer call detected:',
			session.data.childsession.status
		);
		try {
			if (session.data.childsession.status == SIP.Session.C.STATUS_CONFIRMED) {
				session.data.childsession.bye();
			} else {
				session.data.childsession.cancel();
			}
		} catch (e) {}
	}

	$('#line-' + lineNum + '-btn-Transfer').show();
	$('#line-' + lineNum + '-btn-CancelTransfer').hide();

	unholdSession(lineNum);
	$('#line-' + lineNum + '-Transfer').hide();

	updateLineScroll(lineNum);
}
function BlindTransfer(lineNum) {
	var dstNo = $('#line-' + lineNum + '-txt-FindTransferBuddy')
		.val()
		.replace(/[^0-9\*\#\+]/g, '');
	if (dstNo == '') {
		console.warn('Cannot transfer, must be [0-9*+#]');
		return;
	}

	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		console.warn('Null line or session');
		return;
	}
	var session = lineObj.SipSession;

	if (!session.data.transfer) session.data.transfer = [];
	session.data.transfer.push({
		type: 'Blind',
		to: dstNo,
		transferTime: utcDateNow(),
		disposition: 'refer',
		dispositionTime: utcDateNow(),
		accept: {
			complete: null,
			eventTime: null,
			disposition: '',
		},
	});
	var transferid = session.data.transfer.length - 1;

	var transferOptions = {
		receiveResponse: function doReceiveResponse(response) {
			console.log('Blind transfer response: ', response.reason_phrase);

			session.data.terminateby = 'refer';
			session.data.transfer[transferid].accept.disposition =
				response.reason_phrase;
			session.data.transfer[transferid].accept.eventTime = utcDateNow();

			$('#line-' + lineNum + '-msg').html('Call Blind Transfered (Accepted)');

			updateLineScroll(lineNum);
		},
	};
	console.log('REFER: ', dstNo + '@' + wssServer);
	session.refer('sip:' + dstNo + '@' + wssServer, transferOptions);
	$('#line-' + lineNum + '-msg').html(lang.call_blind_transfered);

	updateLineScroll(lineNum);
}
function AttendedTransfer(lineNum) {
	var dstNo = $('#line-' + lineNum + '-txt-FindTransferBuddy')
		.val()
		.replace(/[^0-9\*\#\+]/g, '');
	if (dstNo == '') {
		console.warn('Cannot transfer, must be [0-9*+#]');
		return;
	}

	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		console.warn('Null line or session');
		return;
	}
	var session = lineObj.SipSession;

	HidePopup();

	$('#line-' + lineNum + '-txt-FindTransferBuddy')
		.parent()
		.hide();
	$('#line-' + lineNum + '-btn-blind-transfer').hide();
	$('#line-' + lineNum + '-btn-attended-transfer').hide();

	$('#line-' + lineNum + '-btn-complete-attended-transfer').hide();
	$('#line-' + lineNum + '-btn-cancel-attended-transfer').hide();
	$('#line-' + lineNum + '-btn-terminate-attended-transfer').hide();

	var newCallStatus = $('#line-' + lineNum + '-transfer-status');
	newCallStatus.html(lang.connecting);
	newCallStatus.show();

	if (!session.data.transfer) session.data.transfer = [];
	session.data.transfer.push({
		type: 'Attended',
		to: dstNo,
		transferTime: utcDateNow(),
		disposition: 'invite',
		dispositionTime: utcDateNow(),
		accept: {
			complete: null,
			eventTime: null,
			disposition: '',
		},
	});
	var transferid = session.data.transfer.length - 1;

	updateLineScroll(lineNum);

	// SDP options
	var supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
	var spdOptions = {
		sessionDescriptionHandlerOptions: {
			constraints: {
				audio: { deviceId: 'default' },
				video: false,
			},
		},
	};
	if (session.data.AudioSourceDevice != 'default') {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.deviceId = {
			exact: session.data.AudioSourceDevice,
		};
	}
	// Add additional Constraints
	if (supportedConstraints.autoGainControl) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.autoGainControl =
			AutoGainControl;
	}
	if (supportedConstraints.echoCancellation) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.echoCancellation =
			EchoCancellation;
	}
	if (supportedConstraints.noiseSuppression) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.noiseSuppression =
			NoiseSuppression;
	}

	// Not sure if its possible to transfer a Video call???
	if (session.data.withvideo) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.video = true;
		if (session.data.VideoSourceDevice != 'default') {
			spdOptions.sessionDescriptionHandlerOptions.constraints.video.deviceId = {
				exact: session.data.VideoSourceDevice,
			};
		}
		// Add additional Constraints
		if (supportedConstraints.frameRate && maxFrameRate != '') {
			spdOptions.sessionDescriptionHandlerOptions.constraints.video.frameRate =
				maxFrameRate;
		}
		if (supportedConstraints.height && videoHeight != '') {
			spdOptions.sessionDescriptionHandlerOptions.constraints.video.height =
				videoHeight;
		}
		if (supportedConstraints.aspectRatio && videoAspectRatio != '') {
			spdOptions.sessionDescriptionHandlerOptions.constraints.video.aspectRatio =
				videoAspectRatio;
		}
	}

	// Create new call session
	console.log('INVITE: ', 'sip:' + dstNo + '@' + wssServer);
	var newSession = userAgent.invite(
		'sip:' + dstNo + '@' + wssServer,
		spdOptions
	);
	session.data.childsession = newSession;
	newSession.on('progress', function (response) {
		newCallStatus.html(lang.ringing);
		session.data.transfer[transferid].disposition = 'progress';
		session.data.transfer[transferid].dispositionTime = utcDateNow();

		$('#line-' + lineNum + '-msg').html(lang.attended_transfer_call_started);

		var CancelAttendedTransferBtn = $(
			'#line-' + lineNum + '-btn-cancel-attended-transfer'
		);
		CancelAttendedTransferBtn.off('click');
		CancelAttendedTransferBtn.on('click', function () {
			newSession.cancel();
			newCallStatus.html(lang.call_cancelled);
			console.log('New call session canceled');

			session.data.transfer[transferid].accept.complete = false;
			session.data.transfer[transferid].accept.disposition = 'cancel';
			session.data.transfer[transferid].accept.eventTime = utcDateNow();

			$('#line-' + lineNum + '-msg').html(
				lang.attended_transfer_call_cancelled
			);

			updateLineScroll(lineNum);
		});
		CancelAttendedTransferBtn.show();

		updateLineScroll(lineNum);
	});
	newSession.on('accepted', function (response) {
		newCallStatus.html(lang.call_in_progress);
		$('#line-' + lineNum + '-btn-cancel-attended-transfer').hide();
		session.data.transfer[transferid].disposition = 'accepted';
		session.data.transfer[transferid].dispositionTime = utcDateNow();

		var CompleteTransferBtn = $(
			'#line-' + lineNum + '-btn-complete-attended-transfer'
		);
		CompleteTransferBtn.off('click');
		CompleteTransferBtn.on('click', function () {
			var transferOptions = {
				receiveResponse: function doReceiveResponse(response) {
					console.log('Attended transfer response: ', response.reason_phrase);

					session.data.terminateby = 'refer';
					session.data.transfer[transferid].accept.disposition =
						response.reason_phrase;
					session.data.transfer[transferid].accept.eventTime = utcDateNow();

					$('#line-' + lineNum + '-msg').html(
						lang.attended_transfer_complete_accepted
					);

					updateLineScroll(lineNum);
				},
			};

			// Send REFER
			session.refer(newSession, transferOptions);

			newCallStatus.html(lang.attended_transfer_complete);
			console.log('Attended transfer complete');
			// Call will now teardown...

			session.data.transfer[transferid].accept.complete = true;
			session.data.transfer[transferid].accept.disposition = 'refer';
			session.data.transfer[transferid].accept.eventTime = utcDateNow();

			$('#line-' + lineNum + '-msg').html(lang.attended_transfer_complete);

			updateLineScroll(lineNum);
		});
		CompleteTransferBtn.show();

		updateLineScroll(lineNum);

		var TerminateAttendedTransferBtn = $(
			'#line-' + lineNum + '-btn-terminate-attended-transfer'
		);
		TerminateAttendedTransferBtn.off('click');
		TerminateAttendedTransferBtn.on('click', function () {
			newSession.bye();
			newCallStatus.html(lang.call_ended);
			console.log('New call session end');

			session.data.transfer[transferid].accept.complete = false;
			session.data.transfer[transferid].accept.disposition = 'bye';
			session.data.transfer[transferid].accept.eventTime = utcDateNow();

			$('#line-' + lineNum + '-msg').html(lang.attended_transfer_call_ended);

			updateLineScroll(lineNum);
		});
		TerminateAttendedTransferBtn.show();

		updateLineScroll(lineNum);
	});
	newSession.on('trackAdded', function () {
		var pc = newSession.sessionDescriptionHandler.peerConnection;

		// Gets Remote Audio Track (Local audio is setup via initial GUM)
		var remoteStream = new MediaStream();
		pc.getReceivers().forEach(function (receiver) {
			if (receiver.track && receiver.track.kind == 'audio') {
				remoteStream.addTrack(receiver.track);
			}
		});
		var remoteAudio = $('#line-' + lineNum + '-transfer-remoteAudio').get(0);
		remoteAudio.srcObject = remoteStream;
		remoteAudio.onloadedmetadata = function (e) {
			if (typeof remoteAudio.sinkId !== 'undefined') {
				remoteAudio
					.setSinkId(session.data.AudioOutputDevice)
					.then(function () {
						console.log('sinkId applied: ' + session.data.AudioOutputDevice);
					})
					.catch(function (e) {
						console.warn('Error using setSinkId: ', e);
					});
			}
			remoteAudio.play();
		};
	});
	newSession.on('rejected', function (response, cause) {
		console.log('New call session rejected: ', cause);
		newCallStatus.html(lang.call_rejected);
		session.data.transfer[transferid].disposition = 'rejected';
		session.data.transfer[transferid].dispositionTime = utcDateNow();

		$('#line-' + lineNum + '-txt-FindTransferBuddy')
			.parent()
			.show();
		$('#line-' + lineNum + '-btn-blind-transfer').show();
		$('#line-' + lineNum + '-btn-attended-transfer').show();

		$('#line-' + lineNum + '-btn-complete-attended-transfer').hide();
		$('#line-' + lineNum + '-btn-cancel-attended-transfer').hide();
		$('#line-' + lineNum + '-btn-terminate-attended-transfer').hide();

		$('#line-' + lineNum + '-msg').html(lang.attended_transfer_call_rejected);

		updateLineScroll(lineNum);

		window.setTimeout(function () {
			newCallStatus.hide();
			updateLineScroll(lineNum);
		}, 1000);
	});
	newSession.on('terminated', function (response, cause) {
		console.log('New call session terminated: ', cause);
		newCallStatus.html(lang.call_ended);
		session.data.transfer[transferid].disposition = 'terminated';
		session.data.transfer[transferid].dispositionTime = utcDateNow();

		$('#line-' + lineNum + '-txt-FindTransferBuddy')
			.parent()
			.show();
		$('#line-' + lineNum + '-btn-blind-transfer').show();
		$('#line-' + lineNum + '-btn-attended-transfer').show();

		$('#line-' + lineNum + '-btn-complete-attended-transfer').hide();
		$('#line-' + lineNum + '-btn-cancel-attended-transfer').hide();
		$('#line-' + lineNum + '-btn-terminate-attended-transfer').hide();

		$('#line-' + lineNum + '-msg').html(lang.attended_transfer_call_terminated);

		updateLineScroll(lineNum);

		window.setTimeout(function () {
			newCallStatus.hide();
			updateLineScroll(lineNum);
		}, 1000);
	});
}

// Conference Calls
// ================
function StartConferenceCall(lineNum) {
	$('#line-' + lineNum + '-btn-Conference').hide();
	$('#line-' + lineNum + '-btn-CancelConference').show();

	holdSession(lineNum);
	$('#line-' + lineNum + '-txt-FindConferenceBuddy').val('');
	$('#line-' + lineNum + '-txt-FindConferenceBuddy')
		.parent()
		.show();

	$('#line-' + lineNum + '-btn-conference-dial').show();
	$('#line-' + lineNum + '-btn-cancel-conference-dial').hide();
	$('#line-' + lineNum + '-btn-join-conference-call').hide();
	$('#line-' + lineNum + '-btn-terminate-conference-call').hide();

	$('#line-' + lineNum + '-conference-status').hide();

	$('#line-' + lineNum + '-Conference').show();

	updateLineScroll(lineNum);
}
function CancelConference(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		console.warn('Null line or session');
		return;
	}
	var session = lineObj.SipSession;
	if (session.data.childsession) {
		try {
			if (session.data.childsession.status == SIP.Session.C.STATUS_CONFIRMED) {
				session.data.childsession.bye();
			} else {
				session.data.childsession.cancel();
			}
		} catch (e) {}
	}

	$('#line-' + lineNum + '-btn-Conference').show();
	$('#line-' + lineNum + '-btn-CancelConference').hide();

	unholdSession(lineNum);
	$('#line-' + lineNum + '-Conference').hide();

	updateLineScroll(lineNum);
}
function ConferenceDail(lineNum) {
	var dstNo = $('#line-' + lineNum + '-txt-FindConferenceBuddy')
		.val()
		.replace(/[^0-9\*\#\+]/g, '');
	if (dstNo == '') {
		console.warn('Cannot transfer, must be [0-9*+#]');
		return;
	}

	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		console.warn('Null line or session');
		return;
	}
	var session = lineObj.SipSession;

	HidePopup();

	$('#line-' + lineNum + '-txt-FindConferenceBuddy')
		.parent()
		.hide();

	$('#line-' + lineNum + '-btn-conference-dial').hide();
	$('#line-' + lineNum + '-btn-cancel-conference-dial');
	$('#line-' + lineNum + '-btn-join-conference-call').hide();
	$('#line-' + lineNum + '-btn-terminate-conference-call').hide();

	var newCallStatus = $('#line-' + lineNum + '-conference-status');
	newCallStatus.html(lang.connecting);
	newCallStatus.show();

	if (!session.data.confcalls) session.data.confcalls = [];
	session.data.confcalls.push({
		to: dstNo,
		startTime: utcDateNow(),
		disposition: 'invite',
		dispositionTime: utcDateNow(),
		accept: {
			complete: null,
			eventTime: null,
			disposition: '',
		},
	});
	var confcallid = session.data.confcalls.length - 1;

	updateLineScroll(lineNum);

	// SDP options
	var supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
	var spdOptions = {
		sessionDescriptionHandlerOptions: {
			constraints: {
				audio: { deviceId: 'default' },
				video: false,
			},
		},
	};
	if (session.data.AudioSourceDevice != 'default') {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.deviceId = {
			exact: session.data.AudioSourceDevice,
		};
	}
	// Add additional Constraints
	if (supportedConstraints.autoGainControl) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.autoGainControl =
			AutoGainControl;
	}
	if (supportedConstraints.echoCancellation) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.echoCancellation =
			EchoCancellation;
	}
	if (supportedConstraints.noiseSuppression) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.noiseSuppression =
			NoiseSuppression;
	}

	// Unlikely this will work
	if (session.data.withvideo) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.video = true;
		if (session.data.VideoSourceDevice != 'default') {
			spdOptions.sessionDescriptionHandlerOptions.constraints.video.deviceId = {
				exact: session.data.VideoSourceDevice,
			};
		}
		// Add additional Constraints
		if (supportedConstraints.frameRate && maxFrameRate != '') {
			spdOptions.sessionDescriptionHandlerOptions.constraints.video.frameRate =
				maxFrameRate;
		}
		if (supportedConstraints.height && videoHeight != '') {
			spdOptions.sessionDescriptionHandlerOptions.constraints.video.height =
				videoHeight;
		}
		if (supportedConstraints.aspectRatio && videoAspectRatio != '') {
			spdOptions.sessionDescriptionHandlerOptions.constraints.video.aspectRatio =
				videoAspectRatio;
		}
	}

	// Create new call session
	console.log('INVITE: ', 'sip:' + dstNo + '@' + wssServer);
	var newSession = userAgent.invite(
		'sip:' + dstNo + '@' + wssServer,
		spdOptions
	);
	session.data.childsession = newSession;
	newSession.on('progress', function (response) {
		newCallStatus.html(lang.ringing);
		session.data.confcalls[confcallid].disposition = 'progress';
		session.data.confcalls[confcallid].dispositionTime = utcDateNow();

		$('#line-' + lineNum + '-msg').html(lang.conference_call_started);

		var CancelConferenceDialBtn = $(
			'#line-' + lineNum + '-btn-cancel-conference-dial'
		);
		CancelConferenceDialBtn.off('click');
		CancelConferenceDialBtn.on('click', function () {
			newSession.cancel();
			newCallStatus.html(lang.call_cancelled);
			console.log('New call session canceled');

			session.data.confcalls[confcallid].accept.complete = false;
			session.data.confcalls[confcallid].accept.disposition = 'cancel';
			session.data.confcalls[confcallid].accept.eventTime = utcDateNow();

			$('#line-' + lineNum + '-msg').html(lang.canference_call_cancelled);

			updateLineScroll(lineNum);
		});
		CancelConferenceDialBtn.show();

		updateLineScroll(lineNum);
	});
	newSession.on('accepted', function (response) {
		newCallStatus.html(lang.call_in_progress);
		$('#line-' + lineNum + '-btn-cancel-conference-dial').hide();
		session.data.confcalls[confcallid].complete = true;
		session.data.confcalls[confcallid].disposition = 'accepted';
		session.data.confcalls[confcallid].dispositionTime = utcDateNow();

		// Join Call
		var JoinCallBtn = $('#line-' + lineNum + '-btn-join-conference-call');
		JoinCallBtn.off('click');
		JoinCallBtn.on('click', function () {
			// Merge Call Audio
			if (!session.data.childsession) {
				console.warn('Conference session lost');
				return;
			}

			var outputStreamForSession = new MediaStream();
			var outputStreamForConfSession = new MediaStream();

			var pc = session.sessionDescriptionHandler.peerConnection;
			var confPc =
				session.data.childsession.sessionDescriptionHandler.peerConnection;

			// Get conf call input channel
			confPc.getReceivers().forEach(function (RTCRtpReceiver) {
				if (RTCRtpReceiver.track && RTCRtpReceiver.track.kind == 'audio') {
					console.log('Adding conference session:', RTCRtpReceiver.track.label);
					outputStreamForSession.addTrack(RTCRtpReceiver.track);
				}
			});

			// Get session input channel
			pc.getReceivers().forEach(function (RTCRtpReceiver) {
				if (RTCRtpReceiver.track && RTCRtpReceiver.track.kind == 'audio') {
					console.log('Adding conference session:', RTCRtpReceiver.track.label);
					outputStreamForConfSession.addTrack(RTCRtpReceiver.track);
				}
			});

			// Replace tracks of Parent Call
			pc.getSenders().forEach(function (RTCRtpSender) {
				if (RTCRtpSender.track && RTCRtpSender.track.kind == 'audio') {
					console.log('Switching to mixed Audio track on session');

					session.data.AudioSourceTrack = RTCRtpSender.track;
					outputStreamForSession.addTrack(RTCRtpSender.track);
					var mixedAudioTrack = MixAudioStreams(
						outputStreamForSession
					).getAudioTracks()[0];
					mixedAudioTrack.IsMixedTrack = true;

					RTCRtpSender.replaceTrack(mixedAudioTrack);
				}
			});
			// Replace tracks of Child Call
			confPc.getSenders().forEach(function (RTCRtpSender) {
				if (RTCRtpSender.track && RTCRtpSender.track.kind == 'audio') {
					console.log('Switching to mixed Audio track on conf call');

					session.data.childsession.data.AudioSourceTrack = RTCRtpSender.track;
					outputStreamForConfSession.addTrack(RTCRtpSender.track);
					var mixedAudioTrackForConf = MixAudioStreams(
						outputStreamForConfSession
					).getAudioTracks()[0];
					mixedAudioTrackForConf.IsMixedTrack = true;

					RTCRtpSender.replaceTrack(mixedAudioTrackForConf);
				}
			});

			newCallStatus.html(lang.call_in_progress);
			console.log('Conference Call In Progress');

			session.data.confcalls[confcallid].accept.complete = true;
			session.data.confcalls[confcallid].accept.disposition = 'join';
			session.data.confcalls[confcallid].accept.eventTime = utcDateNow();

			$('#line-' + lineNum + '-btn-terminate-conference-call').show();

			$('#line-' + lineNum + '-msg').html(lang.conference_call_in_progress);

			// Take the parent call off hold
			unholdSession(lineNum);

			JoinCallBtn.hide();

			updateLineScroll(lineNum);
		});
		JoinCallBtn.show();

		updateLineScroll(lineNum);

		// End Call
		var TerminateAttendedTransferBtn = $(
			'#line-' + lineNum + '-btn-terminate-conference-call'
		);
		TerminateAttendedTransferBtn.off('click');
		TerminateAttendedTransferBtn.on('click', function () {
			newSession.bye();
			newCallStatus.html(lang.call_ended);
			console.log('New call session end');

			// session.data.confcalls[confcallid].accept.complete = false;
			session.data.confcalls[confcallid].accept.disposition = 'bye';
			session.data.confcalls[confcallid].accept.eventTime = utcDateNow();

			$('#line-' + lineNum + '-msg').html(lang.conference_call_ended);

			updateLineScroll(lineNum);
		});
		TerminateAttendedTransferBtn.show();

		updateLineScroll(lineNum);
	});
	newSession.on('trackAdded', function () {
		var pc = newSession.sessionDescriptionHandler.peerConnection;

		// Gets Remote Audio Track (Local audio is setup via initial GUM)
		var remoteStream = new MediaStream();
		pc.getReceivers().forEach(function (receiver) {
			if (receiver.track && receiver.track.kind == 'audio') {
				remoteStream.addTrack(receiver.track);
			}
		});
		var remoteAudio = $('#line-' + lineNum + '-conference-remoteAudio').get(0);
		remoteAudio.srcObject = remoteStream;
		remoteAudio.onloadedmetadata = function (e) {
			if (typeof remoteAudio.sinkId !== 'undefined') {
				remoteAudio
					.setSinkId(session.data.AudioOutputDevice)
					.then(function () {
						console.log('sinkId applied: ' + session.data.AudioOutputDevice);
					})
					.catch(function (e) {
						console.warn('Error using setSinkId: ', e);
					});
			}
			remoteAudio.play();
		};
	});
	newSession.on('rejected', function (response, cause) {
		console.log('New call session rejected: ', cause);
		newCallStatus.html(lang.call_rejected);
		session.data.confcalls[confcallid].disposition = 'rejected';
		session.data.confcalls[confcallid].dispositionTime = utcDateNow();

		$('#line-' + lineNum + '-txt-FindConferenceBuddy')
			.parent()
			.show();
		$('#line-' + lineNum + '-btn-conference-dial').show();

		$('#line-' + lineNum + '-btn-cancel-conference-dial').hide();
		$('#line-' + lineNum + '-btn-join-conference-call').hide();
		$('#line-' + lineNum + '-btn-terminate-conference-call').hide();

		$('#line-' + lineNum + '-msg').html(lang.conference_call_rejected);

		updateLineScroll(lineNum);

		window.setTimeout(function () {
			newCallStatus.hide();
			updateLineScroll(lineNum);
		}, 1000);
	});
	newSession.on('terminated', function (response, cause) {
		console.log('New call session terminated: ', cause);
		newCallStatus.html(lang.call_ended);
		session.data.confcalls[confcallid].disposition = 'terminated';
		session.data.confcalls[confcallid].dispositionTime = utcDateNow();

		// Ends the mixed audio, and releases the mic
		if (
			session.data.childsession.data.AudioSourceTrack &&
			session.data.childsession.data.AudioSourceTrack.kind == 'audio'
		) {
			session.data.childsession.data.AudioSourceTrack.stop();
		}
		// Restore Audio Stream is it was changed
		if (
			session.data.AudioSourceTrack &&
			session.data.AudioSourceTrack.kind == 'audio'
		) {
			var pc = session.sessionDescriptionHandler.peerConnection;
			pc.getSenders().forEach(function (RTCRtpSender) {
				if (RTCRtpSender.track && RTCRtpSender.track.kind == 'audio') {
					RTCRtpSender.replaceTrack(session.data.AudioSourceTrack)
						.then(function () {
							if (session.data.ismute) {
								RTCRtpSender.track.enabled = false;
							}
						})
						.catch(function () {
							console.error(e);
						});
					session.data.AudioSourceTrack = null;
				}
			});
		}
		$('#line-' + lineNum + '-txt-FindConferenceBuddy')
			.parent()
			.show();
		$('#line-' + lineNum + '-btn-conference-dial').show();

		$('#line-' + lineNum + '-btn-cancel-conference-dial').hide();
		$('#line-' + lineNum + '-btn-join-conference-call').hide();
		$('#line-' + lineNum + '-btn-terminate-conference-call').hide();

		$('#line-' + lineNum + '-msg').html(lang.conference_call_terminated);

		updateLineScroll(lineNum);

		window.setTimeout(function () {
			newCallStatus.hide();
			updateLineScroll(lineNum);
		}, 1000);
	});
}

function cancelSession(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) return;

	lineObj.SipSession.data.terminateby = 'us';

	console.log('Cancelling session : ' + lineNum);
	lineObj.SipSession.cancel();

	$('#line-' + lineNum + '-msg').html(lang.call_cancelled);
}
function holdSession(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) return;

	console.log('Putting Call on hold: ' + lineNum);
	if (lineObj.SipSession.local_hold == false) {
		lineObj.SipSession.hold();
	}
	// Log Hold
	if (!lineObj.SipSession.data.hold) lineObj.SipSession.data.hold = [];
	lineObj.SipSession.data.hold.push({ event: 'hold', eventTime: utcDateNow() });

	$('#line-' + lineNum + '-btn-Hold').hide();
	$('#line-' + lineNum + '-btn-Unhold').show();
	$('#line-' + lineNum + '-msg').html(lang.call_on_hold);

	updateLineScroll(lineNum);
}
function unholdSession(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) return;

	console.log('Taking call off hold: ' + lineNum);
	if (lineObj.SipSession.local_hold == true) {
		lineObj.SipSession.unhold();
	}
	// Log Hold
	if (!lineObj.SipSession.data.hold) lineObj.SipSession.data.hold = [];
	lineObj.SipSession.data.hold.push({
		event: 'unhold',
		eventTime: utcDateNow(),
	});

	$('#line-' + lineNum + '-msg').html(lang.call_in_progress);
	$('#line-' + lineNum + '-btn-Hold').show();
	$('#line-' + lineNum + '-btn-Unhold').hide();

	updateLineScroll(lineNum);
}
function endSession(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) return;

	console.log('Ending call with: ' + lineNum);
	lineObj.SipSession.data.terminateby = 'us';
	lineObj.SipSession.bye();

	$('#line-' + lineNum + '-msg').html(lang.call_ended);
	$('#line-' + lineNum + '-ActiveCall').hide();

	updateLineScroll(lineNum);
}
function sendDTMF(lineNum, itemStr) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) return;

	console.log('Sending DTMF (' + itemStr + '): ' + lineNum);
	lineObj.SipSession.dtmf(itemStr);

	$('#line-' + lineNum + '-msg').html(lang.send_dtmf + ': ' + itemStr);

	updateLineScroll(lineNum);

	// Custom Web hook
	if (typeof web_hook_on_dtmf !== 'undefined')
		web_hook_on_dtmf(itemStr, lineObj.SipSession);
}
function switchVideoSource(lineNum, srcId) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		console.warn('Line or Session is Null');
		return;
	}
	var session = lineObj.SipSession;

	$('#line-' + lineNum + '-msg').html(lang.switching_video_source);

	var supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
	var constraints = {
		audio: false,
		video: { deviceId: 'default' },
	};
	if (srcId != 'default') {
		constraints.video.deviceId = { exact: srcId };
	}

	// Add additional Constraints
	if (supportedConstraints.frameRate && maxFrameRate != '') {
		constraints.video.frameRate = maxFrameRate;
	}
	if (supportedConstraints.height && videoHeight != '') {
		constraints.video.height = videoHeight;
	}
	if (supportedConstraints.aspectRatio && videoAspectRatio != '') {
		constraints.video.aspectRatio = videoAspectRatio;
	}

	session.data.VideoSourceDevice = srcId;

	var pc = session.sessionDescriptionHandler.peerConnection;

	var localStream = new MediaStream();
	navigator.mediaDevices
		.getUserMedia(constraints)
		.then(function (newStream) {
			var newMediaTrack = newStream.getVideoTracks()[0];
			// var pc = session.sessionDescriptionHandler.peerConnection;
			pc.getSenders().forEach(function (RTCRtpSender) {
				if (RTCRtpSender.track && RTCRtpSender.track.kind == 'video') {
					console.log(
						'Switching Video Track : ' +
							RTCRtpSender.track.label +
							' to ' +
							newMediaTrack.label
					);
					RTCRtpSender.track.stop();
					RTCRtpSender.replaceTrack(newMediaTrack);
					localStream.addTrack(newMediaTrack);
				}
			});
		})
		.catch(function (e) {
			console.error('Error on getUserMedia', e, constraints);
		});

	// Restore Audio Stream is it was changed
	if (
		session.data.AudioSourceTrack &&
		session.data.AudioSourceTrack.kind == 'audio'
	) {
		pc.getSenders().forEach(function (RTCRtpSender) {
			if (RTCRtpSender.track && RTCRtpSender.track.kind == 'audio') {
				RTCRtpSender.replaceTrack(session.data.AudioSourceTrack)
					.then(function () {
						if (session.data.ismute) {
							RTCRtpSender.track.enabled = false;
						}
					})
					.catch(function () {
						console.error(e);
					});
				session.data.AudioSourceTrack = null;
			}
		});
	}

	// Set Preview
	console.log('Showing as preview...');
	var localVideo = $('#line-' + lineNum + '-localVideo').get(0);
	localVideo.srcObject = localStream;
	localVideo.onloadedmetadata = function (e) {
		localVideo.play();
	};
}
function SendCanvas(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		console.warn('Line or Session is Null');
		return;
	}
	var session = lineObj.SipSession;

	$('#line-' + lineNum + '-msg').html(lang.switching_to_canvas);

	// Create scratch Pad
	RemoveScratchpad(lineNum);

	var newCanvas = $('<canvas/>');
	newCanvas.prop('id', 'line-' + lineNum + '-scratchpad');
	$('#line-' + lineNum + '-scratchpad-container').append(newCanvas);
	$('#line-' + lineNum + '-scratchpad').css('display', 'inline-block');
	$('#line-' + lineNum + '-scratchpad').css('width', '640px'); // SD
	$('#line-' + lineNum + '-scratchpad').css('height', '360px'); // SD
	$('#line-' + lineNum + '-scratchpad').prop('width', 640); // SD
	$('#line-' + lineNum + '-scratchpad').prop('height', 360); // SD
	$('#line-' + lineNum + '-scratchpad-container').show();

	console.log('Canvas for Scratchpad created...');

	scratchpad = new fabric.Canvas('line-' + lineNum + '-scratchpad');
	scratchpad.id = 'line-' + lineNum + '-scratchpad';
	scratchpad.backgroundColor = '#FFFFFF';
	scratchpad.isDrawingMode = true;
	scratchpad.renderAll();
	scratchpad.redrawIntrtval = window.setInterval(function () {
		scratchpad.renderAll();
	}, 1000);

	CanvasCollection.push(scratchpad);

	// Get The Canvas Stream
	var canvasMediaStream = $('#line-' + lineNum + '-scratchpad')
		.get(0)
		.captureStream(25);
	var canvasMediaTrack = canvasMediaStream.getVideoTracks()[0];

	// Switch Tracks
	var pc = session.sessionDescriptionHandler.peerConnection;
	pc.getSenders().forEach(function (RTCRtpSender) {
		if (RTCRtpSender.track && RTCRtpSender.track.kind == 'video') {
			console.log(
				'Switching Track : ' +
					RTCRtpSender.track.label +
					' to Scratchpad Canvas'
			);
			RTCRtpSender.track.stop();
			RTCRtpSender.replaceTrack(canvasMediaTrack);
		}
	});

	// Restore Audio Stream is it was changed
	if (
		session.data.AudioSourceTrack &&
		session.data.AudioSourceTrack.kind == 'audio'
	) {
		pc.getSenders().forEach(function (RTCRtpSender) {
			if (RTCRtpSender.track && RTCRtpSender.track.kind == 'audio') {
				RTCRtpSender.replaceTrack(session.data.AudioSourceTrack)
					.then(function () {
						if (session.data.ismute) {
							RTCRtpSender.track.enabled = false;
						}
					})
					.catch(function () {
						console.error(e);
					});
				session.data.AudioSourceTrack = null;
			}
		});
	}

	// Set Preview
	// ===========
	console.log('Showing as preview...');
	var localVideo = $('#line-' + lineNum + '-localVideo').get(0);
	localVideo.srcObject = canvasMediaStream;
	localVideo.onloadedmetadata = function (e) {
		localVideo.play();
	};
}
function SendVideo(lineNum, src) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		console.warn('Line or Session is Null');
		return;
	}
	var session = lineObj.SipSession;

	$('#line-' + lineNum + '-src-camera').prop('disabled', false);
	$('#line-' + lineNum + '-src-canvas').prop('disabled', false);
	$('#line-' + lineNum + '-src-desktop').prop('disabled', false);
	$('#line-' + lineNum + '-src-video').prop('disabled', true);
	$('#line-' + lineNum + '-src-blank').prop('disabled', false);

	$('#line-' + lineNum + '-msg').html(lang.switching_to_shared_video);

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

	$('#line-' + lineNum + '-localVideo').hide();
	$('#line-' + lineNum + '-remoteVideo').appendTo(
		'#line-' + lineNum + '-preview-container'
	);

	// Create Video Object
	var newVideo = $('#line-' + lineNum + '-sharevideo');
	newVideo.prop('src', src);
	newVideo.off('loadedmetadata');
	newVideo.on('loadedmetadata', function () {
		console.log('Video can play now... ');

		// Resample Video
		var ResampleSize = 360;
		if (VideoResampleSize == 'HD') ResampleSize = 720;
		if (VideoResampleSize == 'FHD') ResampleSize = 1080;

		var videoObj = newVideo.get(0);
		var resampleCanvas = $('<canvas/>').get(0);

		var videoWidth = videoObj.videoWidth;
		var videoHeight = videoObj.videoHeight;
		if (videoWidth >= videoHeight) {
			// Landscape / Square
			if (videoHeight > ResampleSize) {
				var p = ResampleSize / videoHeight;
				videoHeight = ResampleSize;
				videoWidth = videoWidth * p;
			}
		} else {
			// Portrate... (phone turned on its side)
			if (videoWidth > ResampleSize) {
				var p = ResampleSize / videoWidth;
				videoWidth = ResampleSize;
				videoHeight = videoHeight * p;
			}
		}

		resampleCanvas.width = videoWidth;
		resampleCanvas.height = videoHeight;
		var resampleContext = resampleCanvas.getContext('2d');

		window.clearInterval(session.data.videoResampleInterval);
		session.data.videoResampleInterval = window.setInterval(function () {
			resampleContext.drawImage(videoObj, 0, 0, videoWidth, videoHeight);
		}, 40); // 25frames per second

		// Capture the streams
		var videoMediaStream = null;
		if ('captureStream' in videoObj) {
			videoMediaStream = videoObj.captureStream();
		} else if ('mozCaptureStream' in videoObj) {
			// This doesnt really work?
			// see: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/captureStream
			videoMediaStream = videoObj.mozCaptureStream();
		} else {
			// This is not supported??.
			// videoMediaStream = videoObj.webkitCaptureStream();
			console.warn(
				'Cannot capture stream from video, this will result in no audio being transmitted.'
			);
		}
		var resampleVideoMediaStream = resampleCanvas.captureStream(25);

		// Get the Tracks
		var videoMediaTrack = resampleVideoMediaStream.getVideoTracks()[0];
		var audioTrackFromVideo =
			videoMediaStream != null ? videoMediaStream.getAudioTracks()[0] : null;

		// Switch & Merge Tracks
		var pc = session.sessionDescriptionHandler.peerConnection;
		pc.getSenders().forEach(function (RTCRtpSender) {
			if (RTCRtpSender.track && RTCRtpSender.track.kind == 'video') {
				console.log('Switching Track : ' + RTCRtpSender.track.label);
				RTCRtpSender.track.stop();
				RTCRtpSender.replaceTrack(videoMediaTrack);
			}
			if (RTCRtpSender.track && RTCRtpSender.track.kind == 'audio') {
				console.log('Switching to mixed Audio track on session');

				session.data.AudioSourceTrack = RTCRtpSender.track;

				var mixedAudioStream = new MediaStream();
				if (audioTrackFromVideo) mixedAudioStream.addTrack(audioTrackFromVideo);
				mixedAudioStream.addTrack(RTCRtpSender.track);
				var mixedAudioTrack =
					MixAudioStreams(mixedAudioStream).getAudioTracks()[0];
				mixedAudioTrack.IsMixedTrack = true;

				RTCRtpSender.replaceTrack(mixedAudioTrack);
			}
		});

		// Set Preview
		console.log('Showing as preview...');
		var localVideo = $('#line-' + lineNum + '-localVideo').get(0);
		localVideo.srcObject = videoMediaStream;
		localVideo.onloadedmetadata = function (e) {
			localVideo
				.play()
				.then(function () {
					console.log('Playing Preview Video File');
				})
				.catch(function (e) {
					console.error('Cannot play back video', e);
				});
		};
		// Play the video
		console.log('Starting Video...');
		$('#line-' + lineNum + '-sharevideo')
			.get(0)
			.play();
	});

	$('#line-' + lineNum + '-sharevideo').show();
	console.log('Video for Sharing created...');
}
function ShareScreen(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		console.warn('Line or Session is Null');
		return;
	}
	var session = lineObj.SipSession;

	$('#line-' + lineNum + '-msg').html(lang.switching_to_shared_screeen);

	var localStream = new MediaStream();
	var pc = session.sessionDescriptionHandler.peerConnection;

	// TODO: Remove legasy ones
	if (navigator.getDisplayMedia) {
		// EDGE, legasy support
		var screenShareConstraints = { video: true, audio: false };
		navigator
			.getDisplayMedia(screenShareConstraints)
			.then(function (newStream) {
				console.log('navigator.getDisplayMedia');
				var newMediaTrack = newStream.getVideoTracks()[0];
				pc.getSenders().forEach(function (RTCRtpSender) {
					if (RTCRtpSender.track && RTCRtpSender.track.kind == 'video') {
						console.log(
							'Switching Video Track : ' +
								RTCRtpSender.track.label +
								' to Screen'
						);
						RTCRtpSender.track.stop();
						RTCRtpSender.replaceTrack(newMediaTrack);
						localStream.addTrack(newMediaTrack);
					}
				});

				// Set Preview
				// ===========
				console.log('Showing as preview...');
				var localVideo = $('#line-' + lineNum + '-localVideo').get(0);
				localVideo.srcObject = localStream;
				localVideo.onloadedmetadata = function (e) {
					localVideo.play();
				};
			})
			.catch(function (err) {
				console.error('Error on getUserMedia');
			});
	} else if (navigator.mediaDevices.getDisplayMedia) {
		// New standard
		var screenShareConstraints = { video: true, audio: false };
		navigator.mediaDevices
			.getDisplayMedia(screenShareConstraints)
			.then(function (newStream) {
				console.log('navigator.mediaDevices.getDisplayMedia');
				var newMediaTrack = newStream.getVideoTracks()[0];
				pc.getSenders().forEach(function (RTCRtpSender) {
					if (RTCRtpSender.track && RTCRtpSender.track.kind == 'video') {
						console.log(
							'Switching Video Track : ' +
								RTCRtpSender.track.label +
								' to Screen'
						);
						RTCRtpSender.track.stop();
						RTCRtpSender.replaceTrack(newMediaTrack);
						localStream.addTrack(newMediaTrack);
					}
				});

				// Set Preview
				// ===========
				console.log('Showing as preview...');
				var localVideo = $('#line-' + lineNum + '-localVideo').get(0);
				localVideo.srcObject = localStream;
				localVideo.onloadedmetadata = function (e) {
					localVideo.play();
				};
			})
			.catch(function (err) {
				console.error('Error on getUserMedia');
			});
	} else {
		// Firefox, apparently
		var screenShareConstraints = {
			video: { mediaSource: 'screen' },
			audio: false,
		};
		navigator.mediaDevices
			.getUserMedia(screenShareConstraints)
			.then(function (newStream) {
				console.log('navigator.mediaDevices.getUserMedia');
				var newMediaTrack = newStream.getVideoTracks()[0];
				pc.getSenders().forEach(function (RTCRtpSender) {
					if (RTCRtpSender.track && RTCRtpSender.track.kind == 'video') {
						console.log(
							'Switching Video Track : ' +
								RTCRtpSender.track.label +
								' to Screen'
						);
						RTCRtpSender.track.stop();
						RTCRtpSender.replaceTrack(newMediaTrack);
						localStream.addTrack(newMediaTrack);
					}
				});

				// Set Preview
				console.log('Showing as preview...');
				var localVideo = $('#line-' + lineNum + '-localVideo').get(0);
				localVideo.srcObject = localStream;
				localVideo.onloadedmetadata = function (e) {
					localVideo.play();
				};
			})
			.catch(function (err) {
				console.error('Error on getUserMedia');
			});
	}

	// Restore Audio Stream is it was changed
	if (
		session.data.AudioSourceTrack &&
		session.data.AudioSourceTrack.kind == 'audio'
	) {
		pc.getSenders().forEach(function (RTCRtpSender) {
			if (RTCRtpSender.track && RTCRtpSender.track.kind == 'audio') {
				RTCRtpSender.replaceTrack(session.data.AudioSourceTrack)
					.then(function () {
						if (session.data.ismute) {
							RTCRtpSender.track.enabled = false;
						}
					})
					.catch(function () {
						console.error(e);
					});
				session.data.AudioSourceTrack = null;
			}
		});
	}
}
function DisableVideoStream(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		console.warn('Line or Session is Null');
		return;
	}
	var session = lineObj.SipSession;

	var pc = session.sessionDescriptionHandler.peerConnection;
	pc.getSenders().forEach(function (RTCRtpSender) {
		if (RTCRtpSender.track && RTCRtpSender.track.kind == 'video') {
			console.log('Disable Video Track : ' + RTCRtpSender.track.label + '');
			RTCRtpSender.track.enabled = false; //stop();
		}
		if (RTCRtpSender.track && RTCRtpSender.track.kind == 'audio') {
			if (
				session.data.AudioSourceTrack &&
				session.data.AudioSourceTrack.kind == 'audio'
			) {
				RTCRtpSender.replaceTrack(session.data.AudioSourceTrack)
					.then(function () {
						if (session.data.ismute) {
							RTCRtpSender.track.enabled = false;
						}
					})
					.catch(function () {
						console.error(e);
					});
				session.data.AudioSourceTrack = null;
			}
		}
	});

	// Set Preview
	console.log('Showing as preview...');
	var localVideo = $('#line-' + lineNum + '-localVideo').get(0);
	localVideo.pause();
	localVideo.removeAttribute('src');
	localVideo.load();

	$('#line-' + lineNum + '-msg').html(lang.video_disabled);
}

// Inbound Calls
// =============
var didnotify = '';
function ReceiveCall(session) {
	var did = session.remoteIdentity.uri.user;
	var callerID = session.remoteIdentity.displayName;

	$.ajax({
		url: '/Home/GetCallerName',
		type: 'GET',
		dataType: 'json',
		data: {
			Phone: did,
		},

		contentType: 'application/json; charset=utf-8',
		success: function (result) {
			callerID = result;
			didnotify = callerID;
			console.log('New Incoming Call!', callerID + ' <' + did + '>');

			var CurrentCalls = countSessions(session.id);
			console.log('Current Call Count:', CurrentCalls);

			var buddyObj = FindBuddyByDid(did);
			// Make new contact of its not there
			if (buddyObj == null) {
				var buddyType = did.length > DidLength ? 'contact' : 'extension';
				var focusOnBuddy = CurrentCalls == 0;
				buddyObj = MakeBuddy(
					buddyType,
					true,
					focusOnBuddy,
					true,
					callerID,
					did
				);
			} else {
				// Double check that the buddy has the same caller ID as the incoming call
				// With Buddies that are contacts, eg +441234567890 <+441234567890> leave as as
				if (buddyObj.type == 'extension' && buddyObj.CallerIDName != callerID) {
					UpdateBuddyCalerID(buddyObj, callerID);
				} else if (
					buddyObj.type == 'contact' &&
					callerID != did &&
					buddyObj.CallerIDName != callerID
				) {
					UpdateBuddyCalerID(buddyObj, callerID);
				}
			}
			var buddy = buddyObj.identity;

			// Time Stamp
			window.clearInterval(session.data.callTimer);
			var startTime = moment.utc();
			session.data.callstart = startTime.format('YYYY-MM-DD HH:mm:ss UTC');
			$('#contact-' + buddy + '-timer').show();
			session.data.callTimer = window.setInterval(function () {
				var now = moment.utc();
				var duration = moment.duration(now.diff(startTime));
				$('#contact-' + buddy + '-timer').html(
					formatShortDuration(duration.asSeconds())
				);
			}, 1000);
			session.data.buddyId = buddy;
			session.data.calldirection = 'inbound';
			session.data.terminateby = 'them';
			session.data.withvideo = false;
			var videoInvite = false;
			if (session.request.body) {
				// Asterisk 13 PJ_SIP always sends m=video if endpoint has video codec,
				// even if origional invite does not specify video.
				if (session.request.body.indexOf('m=video') > -1) videoInvite = true;
			}

			// Inbound You or They Rejected
			session.on('rejected', function (response, cause) {
				console.log('Call rejected: ' + cause);

				session.data.reasonCode = response.status_code;
				session.data.reasonText = cause;

				AddCallMessage(buddy, session, response.status_code, cause);

				// Custom Web hook
				if (typeof web_hook_on_terminate !== 'undefined')
					web_hook_on_terminate(session);
			});
			// They cancelled (Gets called regardless)
			session.on('terminated', function (response, cause) {
				// Stop the ringtone
				if (session.data.rinngerObj) {
					session.data.rinngerObj.pause();
					session.data.rinngerObj.removeAttribute('src');
					session.data.rinngerObj.load();
					session.data.rinngerObj = null;
				}

				CloseWindow();

				console.log('Call terminated');

				window.clearInterval(session.data.callTimer);

				$('#contact-' + buddy + '-timer').html('');
				$('#contact-' + buddy + '-timer').hide();
				$('#contact-' + buddy + '-msg').html('');
				$('#contact-' + buddy + '-msg').hide();
				$('#contact-' + buddy + '-AnswerCall').hide();

				RefreshStream(buddyObj);
				updateScroll(buddyObj.identity);
				UpdateBuddyList();

				// Once the call is answered into a line, you can then teardown
				// teardownSession(buddyObj.identity, session, 0, "Call Cancelled");
			});

			// Start Handle Call
			if (DoNotDisturbEnabled || DoNotDisturbPolicy == 'enabled') {
				console.log('Do Not Disturb Enabled, rejecting call.');
				RejectCall(buddyObj.identity);
				return;
			}
			if (CurrentCalls >= 1) {
				if (CallWaitingEnabled == false || CallWaitingEnabled == 'disabled') {
					console.log('Call Waiting Disabled, rejecting call.');
					RejectCall(buddyObj.identity);
					return;
				}
			}
			if (AutoAnswerEnabled || AutoAnswerPolicy == 'enabled') {
				if (CurrentCalls == 0) {
					// There are no other calls, so you can answer
					console.log('Auto Answer Call...');
					var buddyId = buddyObj.identity;
					window.setTimeout(function () {
						// If the call is with video, assume the auto answer is also
						// In order for this to work nicely, the recipient maut be "ready" to accept video calls
						// In order to ensure video call compatibility (i.e. the recipient must have their web cam in, and working)
						// The NULL video sould be configured
						// https://github.com/InnovateAsterisk/Browser-Phone/issues/26
						if (videoInvite) {
							AnswerVideoCall(buddyId);
						} else {
							AnswerAudioCall(buddyId);
						}
					}, 1000);

					// Select Buddy
					SelectBuddy(buddyObj.identity);
					return;
				} else {
					console.warn('Could not auto answer call, already on a call.');
				}
			}

			// Show the Answer Thingy
			$('#contact-' + buddyObj.identity + '-msg').html(
				lang.incomming_call_from + ' ' + callerID + ' &lt;' + did + '&gt;'
			);
			$('#contact-' + buddyObj.identity + '-msg').show();
			if (videoInvite) {
				$('#contact-' + buddyObj.identity + '-answer-video').show();
			} else {
				$('#contact-' + buddyObj.identity + '-answer-video').hide();
			}
			$('#contact-' + buddyObj.identity + '-AnswerCall').show();
			updateScroll(buddyObj.identity);

			// Play Ring Tone if not on the phone
			if (CurrentCalls >= 1) {
				// Play Alert
				console.log('Audio:', audioBlobs.CallWaiting.url);
				var rinnger = new Audio(audioBlobs.CallWaiting.blob);
				rinnger.preload = 'auto';
				rinnger.loop = false;
				rinnger.oncanplaythrough = function (e) {
					if (
						typeof rinnger.sinkId !== 'undefined' &&
						getRingerOutputID() != 'default'
					) {
						rinnger
							.setSinkId(getRingerOutputID())
							.then(function () {
								console.log('Set sinkId to:', getRingerOutputID());
							})
							.catch(function (e) {
								console.warn('Failed not apply setSinkId.', e);
							});
					}
					// If there has been no interaction with the page at all... this page will not work
					rinnger
						.play()
						.then(function () {
							// Audio Is Playing
						})
						.catch(function (e) {
							console.warn('Unable to play audio file.', e);
						});
				};
				session.data.rinngerObj = rinnger;
			} else {
				// Play Ring Tone
				console.log('Audio:', audioBlobs.Ringtone.url);
				var rinnger = new Audio(audioBlobs.Ringtone.blob);
				rinnger.preload = 'auto';
				rinnger.loop = true;
				rinnger.oncanplaythrough = function (e) {
					if (
						typeof rinnger.sinkId !== 'undefined' &&
						getRingerOutputID() != 'default'
					) {
						rinnger
							.setSinkId(getRingerOutputID())
							.then(function () {
								console.log('Set sinkId to:', getRingerOutputID());
							})
							.catch(function (e) {
								console.warn('Failed not apply setSinkId.', e);
							});
					}
					// If there has been no interaction with the page at all... this page will not work
					rinnger
						.play()
						.then(function () {
							// Audio Is Playing
						})
						.catch(function (e) {
							console.warn('Unable to play audio file.', e);
						});
				};
				session.data.rinngerObj = rinnger;
			}

			// Check if that buddy is not already on a call??
			var streamVisible = $('#stream-' + buddyObj.identity).is(':visible');
			if (streamVisible) {
				// Remove anything distracting
				HidePopup();
			} else {
				CloseWindow(); // If something else was there, close it.
				// Show Call Answer Window
				var callAnswerHtml =
					'<div class="UiWindowField scroller" style="text-align:center">';
				callAnswerHtml +=
					'<div style="font-size: 18px; margin-top:05px">' + callerID + '<div>';
				if (callerID != did) {
					callAnswerHtml +=
						'<div style="font-size: 18px; margin-top:05px">&lt;' +
						did +
						'&gt;<div>';
				}
				callAnswerHtml +=
					'<div class=callAnswerBuddyIcon style="background-image: url(' +
					getPicture(buddyObj.identity) +
					'); margin-top:15px"></div>';
				callAnswerHtml +=
					'<div style="margin-top:5px"><button onclick="AnswerAudioCall(\'' +
					buddyObj.identity +
					'\')" class=answerButton><i class="fa fa-phone"></i> ' +
					lang.answer_call +
					'</button></div>';
				if (videoInvite) {
					callAnswerHtml +=
						'<div style="margin-top:15px"><button onclick="AnswerVideoCall(\'' +
						buddyObj.identity +
						'\')" class=answerButton><i class="fa fa-video-camera"></i> ' +
						lang.answer_call_with_video +
						'</button></div>';
				}
				callAnswerHtml += '</div>';
				OpenWindow(
					callAnswerHtml,
					lang.incomming_call_from,
					350,
					300,
					true,
					false,
					lang.reject_call,
					function () {
						// Reject the call
						RejectCall(buddyObj.identity);
						CloseWindow();
					},
					'Close',
					function () {
						// Let it ring
						CloseWindow();
					},
					null,
					null
				);

				// Add a notification badge
				IncreaseMissedBadge(buddyObj.identity);

				// Show notification
				// =================
				if ('Notification' in window) {
					if (Notification.permission === 'granted') {
						var noticeOptions = {
							body:
								lang.incomming_call_from + ' ' + callerID + ' <' + did + '>',
							icon: getPicture(buddyObj.identity),
						};
						var inComingCallNotification = new Notification(
							lang.incomming_call,
							noticeOptions
						);
						inComingCallNotification.onclick = function (event) {
							var buddyId = buddyObj.identity;
							window.setTimeout(function () {
								// https://github.com/InnovateAsterisk/Browser-Phone/issues/26
								if (videoInvite) {
									AnswerVideoCall(buddyId);
								} else {
									AnswerAudioCall(buddyId);
								}
							}, 1000);

							// Select Buddy
							SelectBuddy(buddyObj.identity);

							return;
						};
					}
				}
			}
		},
		error: function (ex) {
			alert('حدث خطا ما ');
		},
	});
}
function AnswerAudioCall(buddy) {
	CloseWindow();

	var buddyObj = FindBuddyByIdentity(buddy);
	if (buddyObj == null) {
		console.warn('Audio Answer failed, null buddy');
		$('#contact-' + buddy + '-msg').html(lang.call_failed);
		$('#contact-' + buddy + '-AnswerCall').hide();
		return;
	}

	var session = getSession(buddy);
	if (session == null) {
		console.warn('Audio Answer failed, null session');
		$('#contact-' + buddy + '-msg').html(lang.call_failed);
		$('#contact-' + buddy + '-AnswerCall').hide();
		return;
	}

	// Stop the ringtone
	if (session.data.rinngerObj) {
		session.data.rinngerObj.pause();
		session.data.rinngerObj.removeAttribute('src');
		session.data.rinngerObj.load();
		session.data.rinngerObj = null;
	}

	// Check vitals
	if (HasAudioDevice == false) {
		Alert(lang.alert_no_microphone);
		$('#contact-' + buddy + '-msg').html(lang.call_failed);
		$('#contact-' + buddy + '-AnswerCall').hide();
		return;
	}
	$('#contact-' + buddy + '-timer').html('');
	$('#contact-' + buddy + '-timer').hide();
	$('#contact-' + buddy + '-msg').html('');
	$('#contact-' + buddy + '-msg').hide();
	$('#contact-' + buddy + '-AnswerCall').hide();

	// Create a new Line and move the session over to the line
	var callerID = session.remoteIdentity.displayName;
	var did = session.remoteIdentity.uri.user;
	var newLineNumber = Lines.length + 1;
	lineObj = new Line(newLineNumber, callerID, did, buddyObj);
	lineObj.SipSession = session;
	lineObj.SipSession.data.line = lineObj.LineNumber;
	lineObj.SipSession.data.buddyId = lineObj.BuddyObj.identity;
	Lines.push(lineObj);
	AddLineHtml(lineObj);
	SelectLine(newLineNumber);
	UpdateBuddyList();

	var supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
	var spdOptions = {
		sessionDescriptionHandlerOptions: {
			constraints: {
				audio: { deviceId: 'default' },
				video: false,
			},
		},
	};

	// Configure Audio
	var currentAudioDevice = getAudioSrcID();
	if (currentAudioDevice != 'default') {
		var confirmedAudioDevice = false;
		for (var i = 0; i < AudioinputDevices.length; ++i) {
			if (currentAudioDevice == AudioinputDevices[i].deviceId) {
				confirmedAudioDevice = true;
				break;
			}
		}
		if (confirmedAudioDevice) {
			spdOptions.sessionDescriptionHandlerOptions.constraints.audio.deviceId = {
				exact: currentAudioDevice,
			};
		} else {
			console.warn(
				'The audio device you used before is no longer available, default settings applied.'
			);
			localDB.setItem('AudioSrcId', 'default');
		}
	}
	// Add additional Constraints
	if (supportedConstraints.autoGainControl) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.autoGainControl =
			AutoGainControl;
	}
	if (supportedConstraints.echoCancellation) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.echoCancellation =
			EchoCancellation;
	}
	if (supportedConstraints.noiseSuppression) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.noiseSuppression =
			NoiseSuppression;
	}

	// Send Answer
	lineObj.SipSession.accept(spdOptions);
	lineObj.SipSession.data.withvideo = false;
	lineObj.SipSession.data.VideoSourceDevice = null;
	lineObj.SipSession.data.AudioSourceDevice = getAudioSrcID();
	lineObj.SipSession.data.AudioOutputDevice = getAudioOutputID();

	// Wire up UI
	wireupAudioSession(lineObj);
	$('#contact-' + buddy + '-msg').html(lang.call_in_progress);

	// Clear Answer Buttons
	$('#contact-' + buddy + '-AnswerCall').hide();
}
function AnswerVideoCall(buddy) {
	CloseWindow();

	var buddyObj = FindBuddyByIdentity(buddy);
	if (buddyObj == null) {
		console.warn('Audio Answer failed, null buddy');
		$('#contact-' + buddy + '-msg').html(lang.call_failed);
		$('#contact-' + buddy + '-AnswerCall').hide();
		return;
	}

	var session = getSession(buddy);
	if (session == null) {
		console.warn('Video Answer failed, null session');
		$('#contact-' + buddy + '-msg').html(lang.call_failed);
		$('#contact-' + buddy + '-AnswerCall').hide();
		return;
	}

	// Stop the ringtone
	if (session.data.rinngerObj) {
		session.data.rinngerObj.pause();
		session.data.rinngerObj.removeAttribute('src');
		session.data.rinngerObj.load();
		session.data.rinngerObj = null;
	}

	// Check vitals
	if (HasAudioDevice == false) {
		Alert(lang.alert_no_microphone);
		$('#contact-' + buddy + '-msg').html(lang.call_failed);
		$('#contact-' + buddy + '-AnswerCall').hide();
		return;
	}
	if (HasVideoDevice == false) {
		console.warn('No video devices (webcam) found, switching to audio call.');
		AnswerAudioCall(buddy);
		return;
	}
	$('#contact-' + buddy + '-timer').html('');
	$('#contact-' + buddy + '-timer').hide();
	$('#contact-' + buddy + '-msg').html('');
	$('#contact-' + buddy + '-msg').hide();
	$('#contact-' + buddy + '-AnswerCall').hide();

	// Create a new Line and move the session over to the line
	var callerID = session.remoteIdentity.displayName;
	var did = session.remoteIdentity.uri.user;
	var newLineNumber = Lines.length + 1;
	lineObj = new Line(newLineNumber, callerID, did, buddyObj);
	lineObj.SipSession = session;
	lineObj.SipSession.data.line = lineObj.LineNumber;
	lineObj.SipSession.data.buddyId = lineObj.BuddyObj.identity;
	Lines.push(lineObj);
	AddLineHtml(lineObj);
	SelectLine(newLineNumber);
	UpdateBuddyList();

	var supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
	var spdOptions = {
		sessionDescriptionHandlerOptions: {
			constraints: {
				audio: { deviceId: 'default' },
				video: { deviceId: 'default' },
			},
		},
	};

	// Configure Audio
	var currentAudioDevice = getAudioSrcID();
	if (currentAudioDevice != 'default') {
		var confirmedAudioDevice = false;
		for (var i = 0; i < AudioinputDevices.length; ++i) {
			if (currentAudioDevice == AudioinputDevices[i].deviceId) {
				confirmedAudioDevice = true;
				break;
			}
		}
		if (confirmedAudioDevice) {
			spdOptions.sessionDescriptionHandlerOptions.constraints.audio.deviceId = {
				exact: currentAudioDevice,
			};
		} else {
			console.warn(
				'The audio device you used before is no longer available, default settings applied.'
			);
			localDB.setItem('AudioSrcId', 'default');
		}
	}
	// Add additional Constraints
	if (supportedConstraints.autoGainControl) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.autoGainControl =
			AutoGainControl;
	}
	if (supportedConstraints.echoCancellation) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.echoCancellation =
			EchoCancellation;
	}
	if (supportedConstraints.noiseSuppression) {
		spdOptions.sessionDescriptionHandlerOptions.constraints.audio.noiseSuppression =
			NoiseSuppression;
	}

	// Configure Video
	var currentVideoDevice = getVideoSrcID();
	if (currentVideoDevice != 'default') {
		var confirmedVideoDevice = false;
		for (var i = 0; i < VideoinputDevices.length; ++i) {
			if (currentVideoDevice == VideoinputDevices[i].deviceId) {
				confirmedVideoDevice = true;
				break;
			}
		}
		if (confirmedVideoDevice) {
			spdOptions.sessionDescriptionHandlerOptions.constraints.video.deviceId = {
				exact: currentVideoDevice,
			};
		} else {
			console.warn(
				'The video device you used before is no longer available, default settings applied.'
			);
			localDB.setItem('VideoSrcId', 'default'); // resets for later and subsequent calls
		}
	}
	// Add additional Constraints
	if (supportedConstraints.frameRate && maxFrameRate != '') {
		spdOptions.sessionDescriptionHandlerOptions.constraints.video.frameRate =
			maxFrameRate;
	}
	if (supportedConstraints.height && videoHeight != '') {
		spdOptions.sessionDescriptionHandlerOptions.constraints.video.height =
			videoHeight;
	}
	if (supportedConstraints.aspectRatio && videoAspectRatio != '') {
		spdOptions.sessionDescriptionHandlerOptions.constraints.video.aspectRatio =
			videoAspectRatio;
	}

	// Send Answer
	lineObj.SipSession.accept(spdOptions);
	lineObj.SipSession.data.withvideo = true;
	lineObj.SipSession.data.VideoSourceDevice = getVideoSrcID();
	lineObj.SipSession.data.AudioSourceDevice = getAudioSrcID();
	lineObj.SipSession.data.AudioOutputDevice = getAudioOutputID();

	// Wire up UI
	wireupVideoSession(lineObj);
	$('#contact-' + buddy + '-msg').html(lang.call_in_progress);

	// Clear Answer Buttons
	$('#contact-' + buddy + '-AnswerCall').hide();

	if (StartVideoFullScreen) ExpandVideoArea(lineObj.LineNumber);
}

function RejectCall(buddy) {
	var session = getSession(buddy);
	if (session == null) {
		console.warn('Reject failed, null session');
		$('#contact-' + buddy + '-msg').html(lang.call_failed);
		$('#contact-' + buddy + '-AnswerCall').hide();
	}
	session.data.terminateby = 'us';
	session.reject({
		statusCode: 486,
		reasonPhrase: 'Busy Here',
	});
	$('#contact-' + buddy + '-msg').html(lang.call_rejected);
}
