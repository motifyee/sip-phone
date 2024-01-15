// Stream Functionality
// =====================
function ShowMessgeMenu(obj, typeStr, cdrId, buddy) {
	var x = window.dhx4.absLeft(obj);
	var y = window.dhx4.absTop(obj);
	var w = obj.offsetWidth;
	var h = obj.offsetHeight;

	HidePopup();
	dhtmlxPopup = new dhtmlXPopup();

	var menu = null;
	// CDR's Menu
	if (typeStr == 'CDR') {
		var TagState = $('#cdr-flagged-' + cdrId).is(':visible');
		var TagText = TagState ? lang.clear_flag : lang.flag_call;
		menu = [
			{
				id: 1,
				name:
					'<i class="fa fa-external-link"></i> ' + lang.show_call_detail_record,
			},
			{ id: 2, name: '<i class="fa fa-tags"></i> ' + lang.tag_call },
			{ id: 3, name: '<i class="fa fa-flag"></i> ' + TagText },
			{ id: 4, name: '<i class="fa fa-quote-left"></i> ' + lang.edit_comment },
		];
		// menu.push({ id: 20, name: "Delete CDR" });
		// menu.push({ id: 21, name: "Remove Poster Images" });
	}
	if (typeStr == 'MSG') {
		menu = [
			{ id: 10, name: '<i class="fa fa-clipboard"></i> ' + lang.copy_message },
			// { id: 11, name: "<i class=\"fa fa-pencil\"></i> Edit Message" },
			{
				id: 12,
				name: '<i class="fa fa-quote-left"></i> ' + lang.quote_message,
			},
		];
	}

	dhtmlxPopup.attachList('name', menu);
	dhtmlxPopup.attachEvent('onClick', function (id) {
		HidePopup();

		// CDR messages
		if (id == 1) {
			var cdr = null;
			var currentStream = JSON.parse(localDB.getItem(buddy + '-stream'));
			if (currentStream != null || currentStream.DataCollection != null) {
				$.each(currentStream.DataCollection, function (i, item) {
					if (item.ItemType == 'CDR' && item.CdrId == cdrId) {
						// Found
						cdr = item;
						return false;
					}
				});
			}
			if (cdr == null) return;

			var callDetails = [];
			var html = '<div class="UiWindowField scroller">';

			// Billsec: 2.461
			// CallAnswer: "2020-06-22 09:47:52 UTC"
			// CallDirection: "outbound"
			// CallEnd: "2020-06-22 09:47:54 UTC"
			// CdrId: "15928192748351E9D"
			// ConfCalls: []
			// Dst: "*65"
			// DstUserId: "15919450411467CC"
			// Holds: []
			// ItemDate: "2020-06-22 09:47:50 UTC"
			// ItemType: "CDR"
			// MessageData: null
			// Mutes: []
			// QOS: []
			// ReasonCode: 16
			// ReasonText: "Normal Call clearing"
			// Recordings: [{…}]
			// RingTime: 2.374
			// SessionId: "67sv8o86msa7df23bulpnjrca7fton"
			// Src: "<100> Conrad de Wet"
			// SrcUserId: "17186D5983F"
			// Tags: []
			// Terminate: "us"
			// TotalDuration: 4.835
			// Transfers: []
			// WithVideo: false

			var CallDate = moment
				.utc(cdr.ItemDate.replace(' UTC', ''))
				.local()
				.format(DisplayDateFormat + ' ' + DisplayTimeFormat);
			var CallAnswer = cdr.CallAnswer
				? moment
						.utc(cdr.CallAnswer.replace(' UTC', ''))
						.local()
						.format(DisplayDateFormat + ' ' + DisplayTimeFormat)
				: null;
			var ringTime = cdr.RingTime ? cdr.RingTime : 0;
			var CallEnd = moment
				.utc(cdr.CallEnd.replace(' UTC', ''))
				.local()
				.format(DisplayDateFormat + ' ' + DisplayTimeFormat);

			var srcCallerID = '';
			var dstCallerID = '';
			if (cdr.CallDirection == 'inbound') {
				srcCallerID = cdr.Src;
			} else if (cdr.CallDirection == 'outbound') {
				dstCallerID = cdr.Dst;
			}
			html +=
				'<div class=UiText><b>SIP CallID</b> : ' + cdr.SessionId + '</div>';
			html +=
				'<div class=UiText><b>' +
				lang.call_direction +
				'</b> : ' +
				cdr.CallDirection +
				'</div>';
			html +=
				'<div class=UiText><b>' +
				lang.call_date_and_time +
				'</b> : ' +
				CallDate +
				'</div>';
			html +=
				'<div class=UiText><b>' +
				lang.ring_time +
				'</b> : ' +
				formatDuration(ringTime) +
				' (' +
				ringTime +
				')</div>';
			html +=
				'<div class=UiText><b>' +
				lang.talk_time +
				'</b> : ' +
				formatDuration(cdr.Billsec) +
				' (' +
				cdr.Billsec +
				')</div>';
			html +=
				'<div class=UiText><b>' +
				lang.call_duration +
				'</b> : ' +
				formatDuration(cdr.TotalDuration) +
				' (' +
				cdr.TotalDuration +
				')</div>';
			html +=
				'<div class=UiText><b>' +
				lang.video_call +
				'</b> : ' +
				(cdr.WithVideo ? lang.yes : lang.no) +
				'</div>';
			html +=
				'<div class=UiText><b>' +
				lang.flagged +
				'</b> : ' +
				(cdr.Flagged
					? '<i class="fa fa-flag FlagCall"></i> ' + lang.yes
					: lang.no) +
				'</div>';
			html += '<hr>';
			html += '<h2 style="font-size: 16px">' + lang.call_tags + '</h2>';
			html += '<hr>';
			$.each(cdr.Tags, function (item, tag) {
				html += '<span class=cdrTag>' + tag.value + '</span>';
			});

			html += '<h2 style="font-size: 16px">' + lang.call_notes + '</h2>';
			html += '<hr>';
			if (cdr.MessageData) {
				html += '"' + cdr.MessageData + '"';
			}

			html += '<h2 style="font-size: 16px">' + lang.activity_timeline + '</h2>';
			html += '<hr>';

			var withVideo = cdr.WithVideo ? '(' + lang.with_video + ')' : '';
			var startCallMessage =
				cdr.CallDirection == 'inbound'
					? lang.you_received_a_call_from + ' ' + srcCallerID + ' ' + withVideo
					: lang.you_made_a_call_to + ' ' + dstCallerID + ' ' + withVideo;
			callDetails.push({
				Message: startCallMessage,
				TimeStr: cdr.ItemDate,
			});
			if (CallAnswer) {
				var answerCallMessage =
					cdr.CallDirection == 'inbound'
						? lang.you_answered_after +
						  ' ' +
						  ringTime +
						  ' ' +
						  lang.seconds_plural
						: lang.they_answered_after +
						  ' ' +
						  ringTime +
						  ' ' +
						  lang.seconds_plural;
				callDetails.push({
					Message: answerCallMessage,
					TimeStr: cdr.CallAnswer,
				});
			}
			$.each(cdr.Transfers, function (item, transfer) {
				var msg =
					transfer.type == 'Blind'
						? lang.you_started_a_blind_transfer_to + ' ' + transfer.to + '. '
						: lang.you_started_an_attended_transfer_to +
						  ' ' +
						  transfer.to +
						  '. ';
				if (transfer.accept && transfer.accept.complete == true) {
					msg += lang.the_call_was_completed;
				} else if (transfer.accept.disposition != '') {
					msg +=
						lang.the_call_was_not_completed +
						' (' +
						transfer.accept.disposition +
						')';
				}
				callDetails.push({
					Message: msg,
					TimeStr: transfer.transferTime,
				});
			});
			$.each(cdr.Mutes, function (item, mute) {
				callDetails.push({
					Message:
						mute.event == 'mute'
							? lang.you_put_the_call_on_mute
							: lang.you_took_the_call_off_mute,
					TimeStr: mute.eventTime,
				});
			});
			$.each(cdr.Holds, function (item, hold) {
				callDetails.push({
					Message:
						hold.event == 'hold'
							? lang.you_put_the_call_on_hold
							: lang.you_took_the_call_off_hold,
					TimeStr: hold.eventTime,
				});
			});
			$.each(cdr.ConfCalls, function (item, confCall) {
				var msg =
					lang.you_started_a_conference_call_to + ' ' + confCall.to + '. ';
				if (confCall.accept && confCall.accept.complete == true) {
					msg += lang.the_call_was_completed;
				} else if (confCall.accept.disposition != '') {
					msg +=
						lang.the_call_was_not_completed +
						' (' +
						confCall.accept.disposition +
						')';
				}
				callDetails.push({
					Message: msg,
					TimeStr: confCall.startTime,
				});
			});
			$.each(cdr.Recordings, function (item, recording) {
				var StartTime = moment
					.utc(recording.startTime.replace(' UTC', ''))
					.local();
				var StopTime = moment
					.utc(recording.stopTime.replace(' UTC', ''))
					.local();
				var recordingDuration = moment.duration(StopTime.diff(StartTime));

				var msg = lang.call_is_being_recorded;
				if (recording.startTime != recording.stopTime) {
					msg += '(' + formatShortDuration(recordingDuration.asSeconds()) + ')';
				}
				callDetails.push({
					Message: msg,
					TimeStr: recording.startTime,
				});
			});
			callDetails.push({
				Message:
					cdr.Terminate == 'us' ? 'You ended the call.' : 'They ended the call',
				TimeStr: cdr.CallEnd,
			});

			callDetails.sort(function (a, b) {
				var aMo = moment.utc(a.TimeStr.replace(' UTC', ''));
				var bMo = moment.utc(b.TimeStr.replace(' UTC', ''));
				if (aMo.isSameOrAfter(bMo, 'second')) {
					return 1;
				} else return -1;
			});
			$.each(callDetails, function (item, detail) {
				var Time = moment
					.utc(detail.TimeStr.replace(' UTC', ''))
					.local()
					.format(DisplayTimeFormat);
				var messageString =
					'<table class=timelineMessage cellspacing=0 cellpadding=0><tr>';
				messageString += '<td class=timelineMessageArea>';
				messageString +=
					'<div class=timelineMessageDate style="color: #333333"><i class="fa fa-circle timelineMessageDot"></i>' +
					Time +
					'</div>';
				messageString +=
					'<div class=timelineMessageText style="color: #000000">' +
					detail.Message +
					'</div>';
				messageString += '</td>';
				messageString += '</tr></table>';
				html += messageString;
			});

			html += '<h2 style="font-size: 16px">' + lang.call_recordings + '</h2>';
			html += '<hr>';
			var recordingsHtml = '';
			$.each(cdr.Recordings, function (r, recording) {
				if (recording.uID) {
					var StartTime = moment
						.utc(recording.startTime.replace(' UTC', ''))
						.local();
					var StopTime = moment
						.utc(recording.stopTime.replace(' UTC', ''))
						.local();
					var recordingDuration = moment.duration(StopTime.diff(StartTime));
					recordingsHtml += '<div>';
					if (cdr.WithVideo) {
						recordingsHtml +=
							'<div><video id="callrecording-video-' +
							recording.uID +
							'" controls style="width: 100%"></div>';
					} else {
						recordingsHtml +=
							'<div><audio id="callrecording-audio-' +
							recording.uID +
							'" controls style="width: 100%"></div>';
					}
					recordingsHtml +=
						'<div>' +
						lang.started +
						': ' +
						StartTime.format(DisplayTimeFormat) +
						' <i class="fa fa-long-arrow-right"></i> ' +
						lang.stopped +
						': ' +
						StopTime.format(DisplayTimeFormat) +
						'</div>';
					recordingsHtml +=
						'<div>' +
						lang.recording_duration +
						': ' +
						formatShortDuration(recordingDuration.asSeconds()) +
						'</div>';
					recordingsHtml +=
						'<div><a id="download-' +
						recording.uID +
						'">' +
						lang.save_as +
						'</a> (' +
						lang.right_click_and_select_save_link_as +
						')</div>';
					recordingsHtml += '</div>';
				}
			});
			html += recordingsHtml;

			html += '<h2 style="font-size: 16px">' + lang.send_statistics + '</h2>';
			html += '<hr>';
			html +=
				'<div style="position: relative; margin: auto; height: 160px; width: 100%;"><canvas id="cdr-AudioSendBitRate"></canvas></div>';
			html +=
				'<div style="position: relative; margin: auto; height: 160px; width: 100%;"><canvas id="cdr-AudioSendPacketRate"></canvas></div>';

			html +=
				'<h2 style="font-size: 16px">' + lang.receive_statistics + '</h2>';
			html += '<hr>';
			html +=
				'<div style="position: relative; margin: auto; height: 160px; width: 100%;"><canvas id="cdr-AudioReceiveBitRate"></canvas></div>';
			html +=
				'<div style="position: relative; margin: auto; height: 160px; width: 100%;"><canvas id="cdr-AudioReceivePacketRate"></canvas></div>';
			html +=
				'<div style="position: relative; margin: auto; height: 160px; width: 100%;"><canvas id="cdr-AudioReceivePacketLoss"></canvas></div>';
			html +=
				'<div style="position: relative; margin: auto; height: 160px; width: 100%;"><canvas id="cdr-AudioReceiveJitter"></canvas></div>';
			html +=
				'<div style="position: relative; margin: auto; height: 160px; width: 100%;"><canvas id="cdr-AudioReceiveLevels"></canvas></div>';

			html += '<br><br></div>';
			OpenWindow(
				html,
				lang.call_detail_record,
				480,
				640,
				false,
				true,
				null,
				null,
				lang.cancel,
				function () {
					CloseWindow();
				},
				function () {
					// Queue video and audio
					$.each(cdr.Recordings, function (r, recording) {
						var mediaObj = null;
						if (cdr.WithVideo) {
							mediaObj = $('#callrecording-video-' + recording.uID).get(0);
						} else {
							mediaObj = $('#callrecording-audio-' + recording.uID).get(0);
						}
						var downloadURL = $('#download-' + recording.uID);

						// Playback device
						var sinkId = getAudioOutputID();
						if (typeof mediaObj.sinkId !== 'undefined') {
							mediaObj
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
								console.warn(
									'IndexDB CallRecordings.Recordings does not exists'
								);
								return;
							}

							var transaction = IDB.transaction(['Recordings']);
							var objectStoreGet = transaction
								.objectStore('Recordings')
								.get(recording.uID);
							objectStoreGet.onerror = function (event) {
								console.error('IndexDB Get Error:', event);
							};
							objectStoreGet.onsuccess = function (event) {
								var mediaBlobUrl = window.URL.createObjectURL(
									event.target.result.mediaBlob
								);
								mediaObj.src = mediaBlobUrl;

								// Download Link
								if (cdr.WithVideo) {
									downloadURL.prop(
										'download',
										'Video-Call-Recording-' + recording.uID + '.webm'
									);
								} else {
									downloadURL.prop(
										'download',
										'Audio-Call-Recording-' + recording.uID + '.webm'
									);
								}
								downloadURL.prop('href', mediaBlobUrl);
							};
						};
					});

					// Display QOS data
					DisplayQosData(cdr.SessionId);
				}
			);
		}
		if (id == 2) {
			$('#cdr-tags-' + cdrId).show();
		}
		if (id == 3) {
			// Tag / Untag Call
			var TagState = $('#cdr-flagged-' + cdrId).is(':visible');
			if (TagState) {
				console.log('Clearing Flag from: ', cdrId);
				$('#cdr-flagged-' + cdrId).hide();

				// Update DB
				var currentStream = JSON.parse(localDB.getItem(buddy + '-stream'));
				if (currentStream != null || currentStream.DataCollection != null) {
					$.each(currentStream.DataCollection, function (i, item) {
						if (item.ItemType == 'CDR' && item.CdrId == cdrId) {
							// Found
							item.Flagged = false;
							return false;
						}
					});
					localDB.setItem(buddy + '-stream', JSON.stringify(currentStream));
				}
			} else {
				console.log('Flag Call: ', cdrId);
				$('#cdr-flagged-' + cdrId).show();

				// Update DB
				var currentStream = JSON.parse(localDB.getItem(buddy + '-stream'));
				if (currentStream != null || currentStream.DataCollection != null) {
					$.each(currentStream.DataCollection, function (i, item) {
						if (item.ItemType == 'CDR' && item.CdrId == cdrId) {
							// Found
							item.Flagged = true;
							return false;
						}
					});
					localDB.setItem(buddy + '-stream', JSON.stringify(currentStream));
				}
			}
		}
		if (id == 4) {
			var currentText = $('#cdr-comment-' + cdrId).text();
			$('#cdr-comment-' + cdrId).empty();

			var textboxObj = $('<input maxlength=500 type=text>').appendTo(
				'#cdr-comment-' + cdrId
			);
			textboxObj.on('focus', function () {
				HidePopup(500);
			});
			textboxObj.on('blur', function () {
				var newText = $(this).val();
				SaveComment(cdrId, buddy, newText);
			});
			textboxObj.keypress(function (event) {
				window.setTimeout(function () {
					if (dhtmlxPopup != null) {
						dhtmlxPopup.hide();
						dhtmlxPopup.unload();
						dhtmlxPopup = null;
					}
				}, 500);

				var keycode = event.keyCode ? event.keyCode : event.which;
				if (keycode == '13') {
					event.preventDefault();

					var newText = $(this).val();
					SaveComment(cdrId, buddy, newText);
				}
			});
			textboxObj.val(currentText);
			textboxObj.focus();
		}

		// Text Messages
		if (id == 10) {
			var msgtext = $('#msg-text-' + cdrId).text();
			navigator.clipboard
				.writeText(msgtext)
				.then(function () {
					console.log('Text coppied to the clipboard:', msgtext);
				})
				.catch(function () {
					console.error('Error writing to the clipboard:', e);
				});
		}
		if (id == 11) {
			// TODO...
			// Involves sharing a message ID, then on change, sent update request
			// So that both parties share the same update.
		}
		if (id == 12) {
			var msgtext = $('#msg-text-' + cdrId).text();
			msgtext = '"' + msgtext + '"';
			var textarea = $('#contact-' + buddy + '-ChatMessage');
			console.log('Quote Message:', msgtext);
			textarea.val(msgtext + '\n' + textarea.val());
			RefreshChatPreview(null, textarea.val(), buddy);
		}

		// Delete CDR
		if (id == 20) {
			var currentStream = JSON.parse(localDB.getItem(buddy + '-stream'));
			if (currentStream != null || currentStream.DataCollection != null) {
				$.each(currentStream.DataCollection, function (i, item) {
					if (item.ItemType == 'CDR' && item.CdrId == cdrId) {
						// Found
						currentStream.DataCollection.splice(i, 1);
						return false;
					}
				});
				localDB.setItem(buddy + '-stream', JSON.stringify(currentStream));
				RefreshStream(FindBuddyByIdentity(buddy));
			}
		}
		// Delete Poster Image
		if (id == 21) {
			var currentStream = JSON.parse(localDB.getItem(buddy + '-stream'));
			if (currentStream != null || currentStream.DataCollection != null) {
				$.each(currentStream.DataCollection, function (i, item) {
					if (item.ItemType == 'CDR' && item.CdrId == cdrId) {
						// Found
						if (item.Recordings && item.Recordings.length >= 1) {
							$.each(item.Recordings, function (r, recording) {
								recording.Poster = null;
							});
						}
						console.log('Poster Imagers Deleted');
						return false;
					}
				});
				localDB.setItem(buddy + '-stream', JSON.stringify(currentStream));
				RefreshStream(FindBuddyByIdentity(buddy));
			}
		}
	});
	dhtmlxPopup.show(x, y, w, h);
}
function SaveComment(cdrId, buddy, newText) {
	console.log('Setting Comment:', newText);

	$('#cdr-comment-' + cdrId).empty();
	$('#cdr-comment-' + cdrId).append(newText);

	// Update DB
	var currentStream = JSON.parse(localDB.getItem(buddy + '-stream'));
	if (currentStream != null || currentStream.DataCollection != null) {
		$.each(currentStream.DataCollection, function (i, item) {
			if (item.ItemType == 'CDR' && item.CdrId == cdrId) {
				// Found
				item.MessageData = newText;
				return false;
			}
		});
		localDB.setItem(buddy + '-stream', JSON.stringify(currentStream));
	}
}
function TagKeyPress(event, obj, cdrId, buddy) {
	HidePopup(500);

	var keycode = event.keyCode ? event.keyCode : event.which;
	if (keycode == '13' || keycode == '44') {
		event.preventDefault();

		if ($(obj).val() == '') return;

		console.log('Adding Tag:', $(obj).val());

		$('#cdr-tags-' + cdrId + ' li:last').before(
			'<li onclick="TagClick(this, \'' +
				cdrId +
				"', '" +
				buddy +
				'\')">' +
				$(obj).val() +
				'</li>'
		);
		$(obj).val('');

		// Update DB
		UpdateTags(cdrId, buddy);
	}
}
function TagClick(obj, cdrId, buddy) {
	window.setTimeout(function () {
		if (dhtmlxPopup != null) {
			dhtmlxPopup.hide();
			dhtmlxPopup.unload();
			dhtmlxPopup = null;
		}
	}, 500);

	console.log('Removing Tag:', $(obj).text());
	$(obj).remove();

	// Dpdate DB
	UpdateTags(cdrId, buddy);
}
function UpdateTags(cdrId, buddy) {
	var currentStream = JSON.parse(localDB.getItem(buddy + '-stream'));
	if (currentStream != null || currentStream.DataCollection != null) {
		$.each(currentStream.DataCollection, function (i, item) {
			if (item.ItemType == 'CDR' && item.CdrId == cdrId) {
				// Found
				item.Tags = [];
				$('#cdr-tags-' + cdrId)
					.children('li')
					.each(function () {
						if ($(this).prop('class') != 'tagText')
							item.Tags.push({ value: $(this).text() });
					});
				return false;
			}
		});
		localDB.setItem(buddy + '-stream', JSON.stringify(currentStream));
	}
}

function TagFocus(obj) {
	HidePopup(500);
}
function AddMenu(obj, buddy) {
	var x = window.dhx4.absLeft(obj);
	var y = window.dhx4.absTop(obj);
	var w = obj.offsetWidth;
	var h = obj.offsetHeight;

	HidePopup();
	dhtmlxPopup = new dhtmlXPopup();

	var menu = [
		{ id: 1, name: '<i class="fa fa-smile-o"></i> ' + lang.select_expression },
		{ id: 2, name: '<i class="fa fa-microphone"></i> ' + lang.dictate_message },
	];
	if (enabledExtendedServices) {
		menu.push({ id: 3, name: '<i class="fa fa-share-alt"></i> Share File' });
		menu.push({ id: 4, name: '<i class="fa fa-camera"></i> Take Picture' });
		menu.push({
			id: 5,
			name: '<i class="fa fa-file-audio-o"></i> Record Audio Message',
		});
		menu.push({
			id: 6,
			name: '<i class="fa fa-file-video-o"></i> Record Video Message',
		});
	}

	dhtmlxPopup.attachList('name', menu);
	dhtmlxPopup.attachEvent('onClick', function (id) {
		dhtmlxPopup.hide();
		dhtmlxPopup.unload();
		dhtmlxPopup = null;

		// Emoji Bar
		if (id == '1') {
			ShowEmojiBar(buddy);
		}
		// Disctate Message
		if (id == '2') {
			ShowDictate(buddy);
		}
		//
	});
	dhtmlxPopup.show(x, y, w, h);
}
function ShowEmojiBar(buddy) {
	var messageContainer = $('#contact-' + buddy + '-emoji-menu');
	var textarea = $('#contact-' + buddy + '-ChatMessage');

	var menuBar = $('<div>');
	menuBar.prop('class', 'emojiButton');
	var emojis = [
		'😀',
		'😁',
		'😂',
		'😃',
		'😄',
		'😅',
		'😆',
		'😇',
		'😈',
		'😉',
		'😊',
		'😋',
		'😌',
		'😍',
		'😎',
		'😏',
		'😐',
		'😑',
		'😒',
		'😓',
		'😔',
		'😕',
		'😖',
		'😗',
		'😘',
		'😙',
		'😚',
		'😛',
		'😜',
		'😝',
		'😞',
		'😟',
		'😠',
		'😡',
		'😢',
		'😣',
		'😤',
		'😥',
		'😦',
		'😧',
		'😨',
		'😩',
		'😪',
		'😫',
		'😬',
		'😭',
		'😮',
		'😯',
		'😰',
		'😱',
		'😲',
		'😳',
		'😴',
		'😵',
		'😶',
		'😷',
		'🙁',
		'🙂',
		'🙃',
		'🙄',
		'🤐',
		'🤑',
		'🤒',
		'🤓',
		'🤔',
		'🤕',
		'🤠',
		'🤡',
		'🤢',
		'🤣',
		'🤤',
		'🤥',
		'🤧',
		'🤨',
		'🤩',
		'🤪',
		'🤫',
		'🤬',
		'🤭',
		'🤮',
		'🤯',
		'🧐',
	];
	$.each(emojis, function (i, e) {
		var emoji = $('<button>');
		emoji.html(e);
		emoji.on('click', function () {
			var i = textarea.prop('selectionStart');
			var v = textarea.val();
			textarea.val(
				v.substring(0, i) + $(this).html() + v.substring(i, v.length)
			);
			RefreshChatPreview(null, textarea.val(), buddy);
			messageContainer.hide();

			updateScroll(buddy);
		});
		menuBar.append(emoji);
	});

	messageContainer.empty();
	messageContainer.append(menuBar);
	messageContainer.show();

	updateScroll(buddy);
}
function ShowDictate(buddy) {
	var buddyObj = FindBuddyByIdentity(buddy);
	if (buddyObj == null) {
		return;
	}

	if (buddyObj.recognition != null) {
		buddyObj.recognition.abort();
		buddyObj.recognition = null;
	}
	try {
		// Limitation: This opbject can only be made once on the page
		// Generally this is fine, as you can only really dictate one message at a time.
		// It will use the most recently created object.
		var SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;
		buddyObj.recognition = new SpeechRecognition();
	} catch (e) {
		console.error(e);
		Alert(lang.alert_speech_recognition, lang.speech_recognition);
		return;
	}

	var instructions = $('<div>');
	var messageContainer = $('#contact-' + buddy + '-dictate-message');
	var textarea = $('#contact-' + buddy + '-ChatMessage');

	buddyObj.recognition.continuous = true;
	buddyObj.recognition.onstart = function () {
		instructions.html(
			'<i class="fa fa-microphone" style="font-size: 21px"></i><i class="fa fa-cog fa-spin" style="font-size:10px; vertical-align:text-bottom; margin-left:2px"></i> ' +
				lang.im_listening
		);
		updateScroll(buddy);
	};
	buddyObj.recognition.onspeechend = function () {
		instructions.html(lang.msg_silence_detection);
		window.setTimeout(function () {
			messageContainer.hide();
			updateScroll(buddy);
		}, 1000);
	};
	buddyObj.recognition.onerror = function (event) {
		if (event.error == 'no-speech') {
			instructions.html(lang.msg_no_speech);
		} else {
			if (buddyObj.recognition) {
				console.warn('SpeechRecognition Error: ', event);
				buddyObj.recognition.abort();
			}
			buddyObj.recognition = null;
		}
		window.setTimeout(function () {
			messageContainer.hide();
			updateScroll(buddy);
		}, 1000);
	};
	buddyObj.recognition.onresult = function (event) {
		var transcript = event.results[event.resultIndex][0].transcript;
		if (
			(event.resultIndex == 1 &&
				transcript == event.results[0][0].transcript) == false
		) {
			if (
				$.trim(textarea.val()).endsWith('.') ||
				$.trim(textarea.val()) == ''
			) {
				if (
					transcript == '\r' ||
					transcript == '\n' ||
					transcript == '\r\n' ||
					transcript == '\t'
				) {
					// WHITESPACE ONLY
				} else {
					transcript = $.trim(transcript);
					transcript = transcript.replace(
						/^./,
						' ' + transcript[0].toUpperCase()
					);
				}
			}
			console.log('Dictate:', transcript);
			textarea.val(textarea.val() + transcript);
			RefreshChatPreview(null, textarea.val(), buddy);
		}
	};

	messageContainer.empty();
	messageContainer.append(instructions);
	messageContainer.show();

	updateScroll(buddy);

	buddyObj.recognition.start();
}

// Find something in the message stream
// ====================================
function FindSomething(buddy) {
	$('#contact-' + buddy + '-search').toggle();
	if ($('#contact-' + buddy + '-search').is(':visible') == false) {
		RefreshStream(FindBuddyByIdentity(buddy));
	}
	updateScroll(buddy);
}
