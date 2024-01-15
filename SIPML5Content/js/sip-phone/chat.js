// Buddy: Chat / Instant Message / XMPP
// ====================================
function InitinaliseStream(buddy) {
	var template = { TotalRows: 0, DataCollection: [] };
	localDB.setItem(buddy + '-stream', JSON.stringify(template));
	return JSON.parse(localDB.getItem(buddy + '-stream'));
}
function SendChatMessage(buddy) {
	if (userAgent == null) return;
	if (!userAgent.isRegistered()) return;

	var message = $('#contact-' + buddy + '-ChatMessage').val();
	message = $.trim(message);
	if (message == '') {
		Alert(lang.alert_empty_text_message, lang.no_message);
		return;
	}
	// Note: AMI has this limit, but only if you use AMI to transmit
	// if(message.length > 755){
	//     Alert("Asterisk has a limit on the message size (755). This message is too long, and connot be delivered.", "Message Too Long");
	//     return;
	// }

	var messageId = uID();
	var buddyObj = FindBuddyByIdentity(buddy);
	if (buddyObj.type == 'extension' || buddyObj.type == 'group') {
		var chatBuddy = buddyObj.ExtNo + '@' + wssServer;
		console.log('MESSAGE: ' + chatBuddy + ' (extension)');
		var messageObj = userAgent.message(chatBuddy, message);
		messageObj.data.direction = 'outbound';
		messageObj.data.messageId = messageId;
		messageObj.on('accepted', function (response, cause) {
			if (response.status_code == 202) {
				console.log('Message Accepted:', messageId);

				// Update DB
				var currentStream = JSON.parse(localDB.getItem(buddy + '-stream'));
				if (currentStream != null || currentStream.DataCollection != null) {
					$.each(currentStream.DataCollection, function (i, item) {
						if (item.ItemType == 'MSG' && item.ItemId == messageId) {
							// Found
							item.Sent = true;
							return false;
						}
					});
					localDB.setItem(buddy + '-stream', JSON.stringify(currentStream));

					RefreshStream(buddyObj);
				}
			} else {
				console.warn('Message Error', response.status_code, cause);

				// Update DB
				var currentStream = JSON.parse(localDB.getItem(buddy + '-stream'));
				if (currentStream != null || currentStream.DataCollection != null) {
					$.each(currentStream.DataCollection, function (i, item) {
						if (item.ItemType == 'MSG' && item.ItemId == messageId) {
							// Found
							item.Sent = false;
							return false;
						}
					});
					localDB.setItem(buddy + '-stream', JSON.stringify(currentStream));

					RefreshStream(buddyObj);
				}
			}
		});

		// Custom Web hook
		if (typeof web_hook_on_message !== 'undefined')
			web_hook_on_message(messageObj);
	}

	// Update Stream
	var DateTime = moment.utc().format('YYYY-MM-DD HH:mm:ss UTC');
	var currentStream = JSON.parse(localDB.getItem(buddy + '-stream'));
	if (currentStream == null) currentStream = InitinaliseStream(buddy);

	// Add New Message
	var newMessageJson = {
		ItemId: messageId,
		ItemType: 'MSG',
		ItemDate: DateTime,
		SrcUserId: profileUserID,
		Src: '"' + profileName + '" <' + profileUser + '>',
		DstUserId: buddy,
		Dst: '',
		MessageData: message,
	};

	currentStream.DataCollection.push(newMessageJson);
	currentStream.TotalRows = currentStream.DataCollection.length;
	localDB.setItem(buddy + '-stream', JSON.stringify(currentStream));

	// Post Add Activity
	$('#contact-' + buddy + '-ChatMessage').val('');
	$('#contact-' + buddy + '-dictate-message').hide();
	$('#contact-' + buddy + '-emoji-menu').hide();

	if (buddyObj.recognition != null) {
		buddyObj.recognition.abort();
		buddyObj.recognition = null;
	}

	ClearChatPreview(buddy);
	UpdateBuddyActivity(buddy);
	RefreshStream(buddyObj);
}
function ReceiveMessage(message) {
	var callerID = message.remoteIdentity.displayName;
	var did = message.remoteIdentity.uri.user;

	console.log('New Incoming Message!', '"' + callerID + '" <' + did + '>');

	message.data.direction = 'inbound';

	if (did.length > DidLength) {
		// Contacts cannot receive Test Messages, because they cannot reply
		// This may change with FAX, Email, WhatsApp etc
		console.warn('DID length greater then extensions length');
		return;
	}

	var CurrentCalls = countSessions('0');

	var buddyObj = FindBuddyByDid(did);
	// Make new contact of its not there
	if (buddyObj == null) {
		var json = JSON.parse(localDB.getItem(profileUserID + '-Buddies'));
		if (json == null) json = InitUserBuddies();

		// Add Extension
		var id = uID();
		var dateNow = utcDateNow();
		json.DataCollection.push({
			Type: 'extension',
			LastActivity: dateNow,
			ExtensionNumber: did,
			MobileNumber: '',
			ContactNumber1: '',
			ContactNumber2: '',
			uID: id,
			cID: null,
			gID: null,
			DisplayName: callerID,
			Position: '',
			Description: '',
			Email: '',
			MemberCount: 0,
		});
		buddyObj = new Buddy(
			'extension',
			id,
			callerID,
			did,
			'',
			'',
			'',
			dateNow,
			'',
			''
		);
		AddBuddy(buddyObj, true, CurrentCalls == 0, true);

		// Update Size:
		json.TotalRows = json.DataCollection.length;

		// Save To DB
		localDB.setItem(profileUserID + '-Buddies', JSON.stringify(json));
	}

	var origionalMessage = message.body;
	var formattedMessage = ReformatMessage(origionalMessage); // Check if its Json ??
	var messageId = uID();
	var DateTime = utcDateNow();

	// Get the actual Person sending (since all group messages come from the group)
	var ActualSender = '';
	if (buddyObj.type == 'group') {
		var assertedIdentity =
			message.request.headers['P-Asserted-Identity'][0].raw; // Name Surname <ExtNo>
		// console.log(assertedIdentity);
		var bits = assertedIdentity.split(' <');
		var CallerID = bits[0];
		var CallerIDNum = bits[1].replace('>', '');

		ActualSender = CallerID; // P-Asserted-Identity;
	}

	// Current Stream
	var currentStream = JSON.parse(
		localDB.getItem(buddyObj.identity + '-stream')
	);
	if (currentStream == null)
		currentStream = InitinaliseStream(buddyObj.identity);

	// Add New Message
	var newMessageJson = {
		ItemId: messageId,
		ItemType: 'MSG',
		ItemDate: DateTime,
		SrcUserId: buddyObj.identity,
		Src: '"' + buddyObj.CallerIDName + '" <' + buddyObj.ExtNo + '>',
		DstUserId: profileUserID,
		Dst: '',
		MessageData: origionalMessage,
	};

	currentStream.DataCollection.push(newMessageJson);
	currentStream.TotalRows = currentStream.DataCollection.length;
	localDB.setItem(buddyObj.identity + '-stream', JSON.stringify(currentStream));

	// Update Last Activity
	// ====================
	UpdateBuddyActivity(buddyObj.identity);
	RefreshStream(buddyObj);

	// Handle Stream Not visible
	// =========================
	var streamVisible = $('#stream-' + buddyObj.identity).is(':visible');
	if (!streamVisible) {
		// Add or Increase the Badge
		IncreaseMissedBadge(buddyObj.identity);
		if ('Notification' in window) {
			if (Notification.permission === 'granted') {
				var imageUrl = getPicture(buddyObj.identity);
				var noticeOptions = {
					body: origionalMessage.substring(0, 250),
					icon: imageUrl,
				};
				var inComingChatNotification = new Notification(
					lang.message_from + ' : ' + buddyObj.CallerIDName,
					noticeOptions
				);
				inComingChatNotification.onclick = function (event) {
					// Show Message
					SelectBuddy(buddyObj.identity);
				};
			}
		}
		// Play Alert
		console.log('Audio:', audioBlobs.Alert.url);
		var rinnger = new Audio(audioBlobs.Alert.blob);
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
		message.data.rinngerObj = rinnger; // Will be attached to this object until its disposed.
	} else {
		// Message window is active.
	}
}
function AddCallMessage(buddy, session, reasonCode, reasonText) {
	var currentStream = JSON.parse(localDB.getItem(buddy + '-stream'));
	if (currentStream == null) currentStream = InitinaliseStream(buddy);

	var CallEnd = moment.utc(); // Take Now as the Hangup Time
	var callDuration = 0;
	var totalDuration = 0;
	var ringTime = 0;

	var CallStart = moment.utc(session.data.callstart.replace(' UTC', '')); // Actual start (both inbound and outbound)
	var CallAnswer = null; // On Accept when inbound, Remote Side when Outbound
	if (session.startTime) {
		// The time when WE answered the call (May be null - no answer)
		// or
		// The time when THEY answered the call (May be null - no answer)
		CallAnswer = moment.utc(session.startTime); // Local Time gets converted to UTC

		callDuration = moment.duration(CallEnd.diff(CallAnswer));
		ringTime = moment.duration(CallAnswer.diff(CallStart));
	}
	totalDuration = moment.duration(CallEnd.diff(CallStart));

	console.log(session.data.reasonCode + '(' + session.data.reasonText + ')');

	var srcId = '';
	var srcCallerID = '';
	var dstId = '';
	var dstCallerID = '';
	if (session.data.calldirection == 'inbound') {
		srcId = buddy;
		dstId = profileUserID;
		srcCallerID =
			'<' +
			session.remoteIdentity.uri.user +
			'> ' +
			session.remoteIdentity.displayName;
		dstCallerID = '<' + profileUser + '> ' + profileName;
	} else if (session.data.calldirection == 'outbound') {
		srcId = profileUserID;
		dstId = buddy;
		srcCallerID = '<' + profileUser + '> ' + profileName;
		dstCallerID = session.remoteIdentity.uri.user;
	}

	var callDirection = session.data.calldirection;
	var withVideo = session.data.withvideo;
	var sessionId = session.id;
	var hanupBy = session.data.terminateby;

	var newMessageJson = {
		CdrId: uID(),
		ItemType: 'CDR',
		ItemDate: CallStart.format('YYYY-MM-DD HH:mm:ss UTC'),
		CallAnswer: CallAnswer
			? CallAnswer.format('YYYY-MM-DD HH:mm:ss UTC')
			: null,
		CallEnd: CallEnd.format('YYYY-MM-DD HH:mm:ss UTC'),
		SrcUserId: srcId,
		Src: srcCallerID,
		DstUserId: dstId,
		Dst: dstCallerID,
		RingTime: ringTime != 0 ? ringTime.asSeconds() : 0,
		Billsec: callDuration != 0 ? callDuration.asSeconds() : 0,
		TotalDuration: totalDuration != 0 ? totalDuration.asSeconds() : 0,
		ReasonCode: reasonCode,
		ReasonText: reasonText,
		WithVideo: withVideo,
		SessionId: sessionId,
		CallDirection: callDirection,
		Terminate: hanupBy,
		// CRM
		MessageData: null,
		Tags: [],
		//Reporting
		Transfers: session.data.transfer ? session.data.transfer : [],
		Mutes: session.data.mute ? session.data.mute : [],
		Holds: session.data.hold ? session.data.hold : [],
		Recordings: session.data.recordings ? session.data.recordings : [],
		ConfCalls: session.data.confcalls ? session.data.confcalls : [],
		QOS: [],
	};

	console.log('New CDR', newMessageJson);

	currentStream.DataCollection.push(newMessageJson);
	currentStream.TotalRows = currentStream.DataCollection.length;
	localDB.setItem(buddy + '-stream', JSON.stringify(currentStream));

	UpdateBuddyActivity(buddy);
}

// TODO
function SendImageDataMessage(buddy, ImgDataUrl) {
	if (userAgent == null) return;
	if (!userAgent.isRegistered()) return;

	// Ajax Upload
	// ===========

	var DateTime = moment.utc().format('YYYY-MM-DD HH:mm:ss UTC');
	var formattedMessage =
		'<IMG class=previewImage onClick="PreviewImage(this)" src="' +
		ImgDataUrl +
		'">';
	var messageString =
		'<table class=ourChatMessage cellspacing=0 cellpadding=0><tr><td style="width: 80px">' +
		'<div class=messageDate>' +
		DateTime +
		'</div>' +
		'</td><td>' +
		'<div class=ourChatMessageText>' +
		formattedMessage +
		'</div>' +
		'</td></tr></table>';
	$('#contact-' + buddy + '-ChatHistory').append(messageString);
	updateScroll(buddy);

	ImageEditor_Cancel(buddy);

	UpdateBuddyActivity(buddy);
}
// TODO
function SendFileDataMessage(buddy, FileDataUrl, fileName, fileSize) {
	if (userAgent == null) return;
	if (!userAgent.isRegistered()) return;

	var fileID = uID();

	// Ajax Upload
	// ===========
	$.ajax({
		type: 'POST',
		url: '/api/',
		data: '<XML>' + FileDataUrl + '</XML>',
		xhr: function (e) {
			var myXhr = $.ajaxSettings.xhr();
			if (myXhr.upload) {
				myXhr.upload.addEventListener(
					'progress',
					function (event) {
						var percent = (event.loaded / event.total) * 100;
						console.log(
							'Progress for upload to ' + buddy + ' (' + fileID + '):' + percent
						);
						$('#FileProgress-Bar-' + fileID).css('width', percent + '%');
					},
					false
				);
			}
			return myXhr;
		},
		success: function (data, status, jqXHR) {
			// console.log(data);
			$('#FileUpload-' + fileID).html('Sent');
			$('#FileProgress-' + fileID).hide();
			$('#FileProgress-Bar-' + fileID).css('width', '0%');
		},
		error: function (data, status, error) {
			// console.log(data);
			$('#FileUpload-' + fileID).html('Failed (' + data.status + ')');
			$('#FileProgress-' + fileID).hide();
			$('#FileProgress-Bar-' + fileID).css('width', '100%');
		},
	});

	// Add To Message Stream
	// =====================
	var DateTime = utcDateNow();

	var showReview = false;
	var fileIcon = '<i class="fa fa-file"></i>';
	// Image Icons
	if (fileName.toLowerCase().endsWith('.png')) {
		fileIcon = '<i class="fa fa-file-image-o"></i>';
		showReview = true;
	}
	if (fileName.toLowerCase().endsWith('.jpg')) {
		fileIcon = '<i class="fa fa-file-image-o"></i>';
		showReview = true;
	}
	if (fileName.toLowerCase().endsWith('.jpeg')) {
		fileIcon = '<i class="fa fa-file-image-o"></i>';
		showReview = true;
	}
	if (fileName.toLowerCase().endsWith('.bmp')) {
		fileIcon = '<i class="fa fa-file-image-o"></i>';
		showReview = true;
	}
	if (fileName.toLowerCase().endsWith('.gif')) {
		fileIcon = '<i class="fa fa-file-image-o"></i>';
		showReview = true;
	}
	// video Icons
	if (fileName.toLowerCase().endsWith('.mov'))
		fileIcon = '<i class="fa fa-file-video-o"></i>';
	if (fileName.toLowerCase().endsWith('.avi'))
		fileIcon = '<i class="fa fa-file-video-o"></i>';
	if (fileName.toLowerCase().endsWith('.mpeg'))
		fileIcon = '<i class="fa fa-file-video-o"></i>';
	if (fileName.toLowerCase().endsWith('.mp4'))
		fileIcon = '<i class="fa fa-file-video-o"></i>';
	if (fileName.toLowerCase().endsWith('.mvk'))
		fileIcon = '<i class="fa fa-file-video-o"></i>';
	if (fileName.toLowerCase().endsWith('.webm'))
		fileIcon = '<i class="fa fa-file-video-o"></i>';
	// Audio Icons
	if (fileName.toLowerCase().endsWith('.wav'))
		fileIcon = '<i class="fa fa-file-audio-o"></i>';
	if (fileName.toLowerCase().endsWith('.mp3'))
		fileIcon = '<i class="fa fa-file-audio-o"></i>';
	if (fileName.toLowerCase().endsWith('.ogg'))
		fileIcon = '<i class="fa fa-file-audio-o"></i>';
	// Compressed Icons
	if (fileName.toLowerCase().endsWith('.zip'))
		fileIcon = '<i class="fa fa-file-archive-o"></i>';
	if (fileName.toLowerCase().endsWith('.rar'))
		fileIcon = '<i class="fa fa-file-archive-o"></i>';
	if (fileName.toLowerCase().endsWith('.tar.gz'))
		fileIcon = '<i class="fa fa-file-archive-o"></i>';
	// Pdf Icons
	if (fileName.toLowerCase().endsWith('.pdf'))
		fileIcon = '<i class="fa fa-file-pdf-o"></i>';

	var formattedMessage =
		'<DIV><SPAN id="FileUpload-' +
		fileID +
		'">Sending</SPAN>: ' +
		fileIcon +
		' ' +
		fileName +
		'</DIV>';
	formattedMessage +=
		'<DIV id="FileProgress-' +
		fileID +
		'" class="progressBarContainer"><DIV id="FileProgress-Bar-' +
		fileID +
		'" class="progressBarTrack"></DIV></DIV>';
	if (showReview) {
		formattedMessage +=
			'<DIV><IMG class=previewImage onClick="PreviewImage(this)" src="' +
			FileDataUrl +
			'"></DIV>';
	}

	var messageString =
		'<table class=ourChatMessage cellspacing=0 cellpadding=0><tr><td style="width: 80px">' +
		'<div class=messageDate>' +
		DateTime +
		'</div>' +
		'</td><td>' +
		'<div class=ourChatMessageText>' +
		formattedMessage +
		'</div>' +
		'</td></tr></table>';
	$('#contact-' + buddy + '-ChatHistory').append(messageString);
	updateScroll(buddy);

	ImageEditor_Cancel(buddy);

	// Update Last Activity
	// ====================
	UpdateBuddyActivity(buddy);
}
function updateLineScroll(lineNum) {
	RefreshLineActivity(lineNum);

	var element = $('#line-' + lineNum + '-CallDetails').get(0);
	element.scrollTop = element.scrollHeight;
}
function updateScroll(buddy) {
	var history = $('#contact-' + buddy + '-ChatHistory');
	if (history.children().length > 0)
		history.children().last().get(0).scrollIntoView(false);
	history.get(0).scrollTop = history.get(0).scrollHeight;
}
function PreviewImage(obj) {
	OpenWindow(obj.src, 'Preview Image', 600, 800, false, true); //no close, no resize
}
