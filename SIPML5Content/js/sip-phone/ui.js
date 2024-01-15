// User Interface
// ==============
function UpdateUI() {
	if ($(window).outerWidth() < 920) {
		// Narrow Layout
		if ((selectedBuddy == null) & (selectedLine == null)) {
			// Nobody Selected
			$('#rightContent').hide();

			$('#leftContent').css('width', '100%');
			$('#leftContent').show();
		} else {
			$('#rightContent').css('margin-left', '0px');
			$('#rightContent').show();

			$('#leftContent').hide();

			if (selectedBuddy != null) updateScroll(selectedBuddy.identity);
		}
	} else {
		// Wide Screen Layout
		if ((selectedBuddy == null) & (selectedLine == null)) {
			$('#leftContent').css('width', '100%');
			$('#rightContent').css('margin-left', '0px');
			$('#leftContent').show();
			$('#rightContent').hide();
		} else {
			$('#leftContent').css('width', '320px');
			$('#rightContent').css('margin-left', '320px');
			$('#leftContent').show();
			$('#rightContent').show();

			if (selectedBuddy != null) updateScroll(selectedBuddy.identity);
		}
	}
	for (var l = 0; l < Lines.length; l++) {
		updateLineScroll(Lines[l].LineNumber);
	}
	HidePopup();
}

// UI Windows
// ==========
function AddSomeoneWindow(numberStr) {
	HidePopup();

	var html = "<div border=0 class='UiWindowField scroller'>";

	html += '<div class=UiText>' + lang.full_name + ':</div>';
	html +=
		"<div><input id=AddSomeone_Name class=UiInputText type=text placeholder='" +
		lang.eg_full_name +
		"'></div>";

	html += '<div class=UiText>' + lang.title_description + ':</div>';
	html +=
		"<div><input id=AddSomeone_Desc class=UiInputText type=text placeholder='" +
		lang.eg_general_manager +
		"'></div>";

	html += '<div class=UiText>' + lang.internal_subscribe_extension + ':</div>';
	if (
		numberStr &&
		numberStr.length > 1 &&
		numberStr.length < DidLength &&
		numberStr.substring(0, 1) != '*'
	) {
		html +=
			'<div><input id=AddSomeone_Exten class=UiInputText type=text value=' +
			numberStr +
			" placeholder='" +
			lang.eg_internal_subscribe_extension +
			"'></div>";
	} else {
		html +=
			"<div><input id=AddSomeone_Exten class=UiInputText type=text placeholder='" +
			lang.eg_internal_subscribe_extension +
			"'></div>";
	}

	html += '<div class=UiText>' + lang.mobile_number + ':</div>';
	html +=
		"<div><input id=AddSomeone_Mobile class=UiInputText type=text placeholder='" +
		lang.eg_mobile_number +
		"'></div>";

	html += '<div class=UiText>' + lang.email + ':</div>';
	html +=
		"<div><input id=AddSomeone_Email class=UiInputText type=text placeholder='" +
		lang.eg_email +
		"'></div>";

	html += '<div class=UiText>' + lang.contact_number_1 + ':</div>';
	if (numberStr && numberStr.length > 1) {
		html +=
			'<div><input id=AddSomeone_Num1 class=UiInputText type=text value=' +
			numberStr +
			" placeholder='" +
			lang.eg_contact_number_1 +
			"'></div>";
	} else {
		html +=
			"<div><input id=AddSomeone_Num1 class=UiInputText type=text placeholder='" +
			lang.eg_contact_number_1 +
			"'></div>";
	}

	html += '<div class=UiText>' + lang.contact_number_2 + ':</div>';
	html +=
		"<div><input id=AddSomeone_Num2 class=UiInputText type=text placeholder='" +
		lang.eg_contact_number_2 +
		"'></div>";
	html += '</div>';
	OpenWindow(
		html,
		lang.add_someone,
		480,
		640,
		false,
		true,
		lang.add,
		function () {
			// Add Contact / Extension
			var json = JSON.parse(localDB.getItem(profileUserID + '-Buddies'));
			if (json == null) json = InitUserBuddies();

			if ($('#AddSomeone_Exten').val() == '') {
				// Add Regular Contact
				var id = uID();
				var dateNow = utcDateNow();
				json.DataCollection.push({
					Type: 'contact',
					LastActivity: dateNow,
					ExtensionNumber: '',
					MobileNumber: $('#AddSomeone_Mobile').val(),
					ContactNumber1: $('#AddSomeone_Num1').val(),
					ContactNumber2: $('#AddSomeone_Num2').val(),
					uID: null,
					cID: id,
					gID: null,
					DisplayName: $('#AddSomeone_Name').val(),
					Position: '',
					Description: $('#AddSomeone_Desc').val(),
					Email: $('#AddSomeone_Email').val(),
					MemberCount: 0,
				});
				var buddyObj = new Buddy(
					'contact',
					id,
					$('#AddSomeone_Name').val(),
					'',
					$('#AddSomeone_Mobile').val(),
					$('#AddSomeone_Num1').val(),
					$('#AddSomeone_Num2').val(),
					dateNow,
					$('#AddSomeone_Desc').val(),
					$('#AddSomeone_Email').val()
				);
				AddBuddy(buddyObj, false, false);
			} else {
				// Add Extension
				var id = uID();
				var dateNow = utcDateNow();
				json.DataCollection.push({
					Type: 'extension',
					LastActivity: dateNow,
					ExtensionNumber: $('#AddSomeone_Exten').val(),
					MobileNumber: $('#AddSomeone_Mobile').val(),
					ContactNumber1: $('#AddSomeone_Num1').val(),
					ContactNumber2: $('#AddSomeone_Num2').val(),
					uID: id,
					cID: null,
					gID: null,
					DisplayName: $('#AddSomeone_Name').val(),
					Position: $('#AddSomeone_Desc').val(),
					Description: '',
					Email: $('#AddSomeone_Email').val(),
					MemberCount: 0,
				});
				var buddyObj = new Buddy(
					'extension',
					id,
					$('#AddSomeone_Name').val(),
					$('#AddSomeone_Exten').val(),
					$('#AddSomeone_Mobile').val(),
					$('#AddSomeone_Num1').val(),
					$('#AddSomeone_Num2').val(),
					dateNow,
					$('#AddSomeone_Desc').val(),
					$('#AddSomeone_Email').val()
				);
				AddBuddy(buddyObj, false, false, true);
			}
			// Update Size:
			json.TotalRows = json.DataCollection.length;

			// Save To DB
			localDB.setItem(profileUserID + '-Buddies', JSON.stringify(json));

			UpdateBuddyList();

			CloseWindow();
		},
		lang.cancel,
		function () {
			CloseWindow();
		}
	);
}
function CreateGroupWindow() {
	HidePopup();

	OpenWindow(
		'',
		lang.create_group,
		480,
		640,
		false,
		true,
		null,
		function () {
			// Create Group

			CloseWindow();
		},
		'Cancel',
		function () {
			CloseWindow();
		}
	);
}
function ConfigureExtensionWindow() {
	HidePopup();

	OpenWindow(
		'...',
		lang.configure_extension,
		480,
		640,
		false,
		true,
		lang.save,
		function () {
			// 1 Account
			if (localDB.getItem('profileUserID') == null)
				localDB.setItem('profileUserID', uID()); // For first time only
			localDB.setItem('wssServer', $('#Configure_Account_wssServer').val());
			localDB.setItem(
				'WebSocketPort',
				$('#Configure_Account_WebSocketPort').val()
			);
			localDB.setItem('ServerPath', $('#Configure_Account_ServerPath').val());
			localDB.setItem('profileUser', $('#Configure_Account_profileUser').val());
			localDB.setItem('profileName', $('#Configure_Account_profileName').val());
			localDB.setItem('SipUsername', $('#Configure_Account_SipUsername').val());
			localDB.setItem('SipPassword', $('#Configure_Account_SipPassword').val());

			// 2 Audio & Video
			localDB.setItem('AudioOutputId', $('#playbackSrc').val());
			localDB.setItem('VideoSrcId', $('#previewVideoSrc').val());
			localDB.setItem(
				'VideoHeight',
				$('input[name=Settings_Quality]:checked').val()
			);
			localDB.setItem(
				'FrameRate',
				$('input[name=Settings_FrameRate]:checked').val()
			);
			localDB.setItem(
				'AspectRatio',
				$('input[name=Settings_AspectRatio]:checked').val()
			);
			localDB.setItem(
				'VideoOrientation',
				$('input[name=Settings_Oriteation]:checked').val()
			);
			localDB.setItem('AudioSrcId', $('#microphoneSrc').val());
			localDB.setItem(
				'AutoGainControl',
				$('#Settings_AutoGainControl').is(':checked') ? '1' : '0'
			);
			localDB.setItem(
				'EchoCancellation',
				$('#Settings_EchoCancellation').is(':checked') ? '1' : '0'
			);
			localDB.setItem(
				'NoiseSuppression',
				$('#Settings_NoiseSuppression').is(':checked') ? '1' : '0'
			);
			localDB.setItem('RingOutputId', $('#ringDevice').val());

			// 3 Appearance
			$('#ImageCanvas')
				.croppie('result', {
					type: 'base64',
					size: 'viewport',
					format: 'png',
					quality: 1,
					circle: false,
				})
				.then(function (base64) {
					localDB.setItem('profilePicture', base64);
				});

			// 4 Notifications
			localDB.setItem(
				'Notifications',
				$('#Settings_Notifications').is(':checked') ? '1' : '0'
			);

			Alert(lang.alert_settings, lang.reload_required, function () {
				window.location.reload();
			});

			// CloseWindow();
		},
		lang.cancel,
		function () {
			CloseWindow();
		},
		function () {
			// DoOnLoad
		},
		function () {
			// OnClose

			var localVideo = $('#local-video-preview').get(0);
			try {
				var tracks = localVideo.srcObject.getTracks();
				tracks.forEach(function (track) {
					track.stop();
				});
				localVideo.srcObject = null;
			} catch (e) {}

			try {
				var tracks = window.SettingsMicrophoneStream.getTracks();
				tracks.forEach(function (track) {
					track.stop();
				});
			} catch (e) {}
			window.SettingsMicrophoneStream = null;

			try {
				var soundMeter = window.SettingsMicrophoneSoundMeter;
				soundMeter.stop();
			} catch (e) {}
			window.SettingsMicrophoneSoundMeter = null;

			try {
				window.SettingsOutputAudio.pause();
			} catch (e) {}
			window.SettingsOutputAudio = null;

			try {
				var tracks = window.SettingsOutputStream.getTracks();
				tracks.forEach(function (track) {
					track.stop();
				});
			} catch (e) {}
			window.SettingsOutputStream = null;

			try {
				var soundMeter = window.SettingsOutputStreamMeter;
				soundMeter.stop();
			} catch (e) {}
			window.SettingsOutputStreamMeter = null;

			return true;
		}
	);

	// Write HTML to Tabs
	var windowObj = windowsCollection.window('window');
	var ConfigureTabbar = windowObj.attachTabbar({
		tabs: [
			{ id: '1', text: lang.account, active: true },
			{ id: '2', text: lang.audio_video, active: false },
			{ id: '3', text: lang.appearance, active: false },
			{ id: '4', text: lang.notifications, active: false },
		],
	});
	if (EnableAccountSettings == false) ConfigureTabbar.tabs('1').hide();
	if (EnableAudioVideoSettings == false) ConfigureTabbar.tabs('2').hide();
	if (EnableAppearanceSettings == false) ConfigureTabbar.tabs('3').hide();
	if (EnableNotificationSettings == false) ConfigureTabbar.tabs('4').hide();

	// 1 Account
	// ==================================================================================
	var AccountHtml = '<div class="UiWindowField scroller">';
	//    AccountHtml += "<div class=UiText>"+ lang.asterisk_server_address +":</div>";
	//    AccountHtml += "<div><input id=Configure_Account_wssServer class=UiInputText type=text placeholder='"+ lang.eg_asterisk_server_address +"' value='"+ getDbItem("wssServer", "") +"'></div>";

	//   AccountHtml += "<div class=UiText>"+ lang.websocket_port +":</div>";
	//   AccountHtml += "<div><input id=Configure_Account_WebSocketPort class=UiInputText type=text placeholder='"+ lang.eg_websocket_port +"' value='"+ getDbItem("WebSocketPort", "") +"'></div>";

	//   AccountHtml += "<div class=UiText>"+ lang.websocket_path +":</div>";
	//   AccountHtml += "<div><input id=Configure_Account_ServerPath class=UiInputText type=text placeholder='"+ lang.eg_websocket_path +"' value='"+ getDbItem("ServerPath", "") +"'></div>";

	//   AccountHtml += "<div class=UiText>"+ lang.internal_subscribe_extension +":</div>";
	//   AccountHtml += "<div><input id=Configure_Account_profileUser class=UiInputText type=text placeholder='"+ lang.eg_internal_subscribe_extension +"' value='"+ getDbItem("profileUser", "") +"'></div>";

	AccountHtml += '<div class=UiText>' + lang.full_name + ':</div>';
	AccountHtml +=
		"<div><input id=Configure_Account_profileName class=UiInputText type=text placeholder='" +
		lang.eg_full_name +
		"' value='" +
		getDbItem('profileName', '') +
		"'></div>";

	AccountHtml += '<div class=UiText>' + lang.sip_username + ':</div>';
	AccountHtml +=
		"<div><input id=Configure_Account_SipUsername class=UiInputText type=text placeholder='" +
		lang.eg_sip_username +
		"' value='" +
		getDbItem('SipUsername', '') +
		"'></div>";

	AccountHtml += '<div class=UiText>' + lang.sip_password + ':</div>';
	AccountHtml +=
		"<div><input id=Configure_Account_SipPassword class=UiInputText type=password placeholder='" +
		lang.eg_sip_password +
		"' value='" +
		getDbItem('SipPassword', '') +
		"'></div>";
	AccountHtml += '<br><br></div>';

	ConfigureTabbar.tabs('1').attachHTMLString(AccountHtml);

	// 2 Audio & Video
	// ==================================================================================
	var AudioVideoHtml = '<div class="UiWindowField scroller">';

	AudioVideoHtml += '<div class=UiText>' + lang.speaker + ':</div>';
	AudioVideoHtml +=
		'<div style="text-align:center"><select id=playbackSrc style="width:100%"></select></div>';
	AudioVideoHtml +=
		'<div class=Settings_VolumeOutput_Container><div id=Settings_SpeakerOutput class=Settings_VolumeOutput></div></div>';
	AudioVideoHtml +=
		'<div><button class=on_white id=preview_output_play><i class="fa fa-play"></i></button></div>';

	AudioVideoHtml += '<div class=UiText>' + lang.microphone + ':</div>';
	AudioVideoHtml +=
		'<div style="text-align:center"><select id=microphoneSrc style="width:100%"></select></div>';
	AudioVideoHtml +=
		'<div class=Settings_VolumeOutput_Container><div id=Settings_MicrophoneOutput class=Settings_VolumeOutput></div></div>';
	AudioVideoHtml +=
		'<div><input type=checkbox id=Settings_AutoGainControl><label for=Settings_AutoGainControl> ' +
		lang.auto_gain_control +
		'<label></div>';
	AudioVideoHtml +=
		'<div><input type=checkbox id=Settings_EchoCancellation><label for=Settings_EchoCancellation> ' +
		lang.echo_cancellation +
		'<label></div>';
	AudioVideoHtml +=
		'<div><input type=checkbox id=Settings_NoiseSuppression><label for=Settings_NoiseSuppression> ' +
		lang.noise_suppression +
		'<label></div>';

	AudioVideoHtml += '<div class=UiText>' + lang.camera + ':</div>';
	AudioVideoHtml +=
		'<div style="text-align:center"><select id=previewVideoSrc style="width:100%"></select></div>';

	AudioVideoHtml += '<div class=UiText>' + lang.frame_rate + ':</div>';
	AudioVideoHtml += '<div class=pill-nav>';
	AudioVideoHtml +=
		'<input name=Settings_FrameRate id=r40 type=radio value="2"><label class=radio_pill for=r40>2</label>';
	AudioVideoHtml +=
		'<input name=Settings_FrameRate id=r41 type=radio value="5"><label class=radio_pill for=r41>5</label>';
	AudioVideoHtml +=
		'<input name=Settings_FrameRate id=r42 type=radio value="10"><label class=radio_pill for=r42>10</label>';
	AudioVideoHtml +=
		'<input name=Settings_FrameRate id=r43 type=radio value="15"><label class=radio_pill for=r43>15</label>';
	AudioVideoHtml +=
		'<input name=Settings_FrameRate id=r44 type=radio value="20"><label class=radio_pill for=r44>20</label>';
	AudioVideoHtml +=
		'<input name=Settings_FrameRate id=r45 type=radio value="25"><label class=radio_pill for=r45>25</label>';
	AudioVideoHtml +=
		'<input name=Settings_FrameRate id=r46 type=radio value="30"><label class=radio_pill for=r46>30</label>';
	AudioVideoHtml +=
		'<input name=Settings_FrameRate id=r47 type=radio value=""><label class=radio_pill for=r47><i class="fa fa-trash"></i></label>';
	AudioVideoHtml += '</div>';

	AudioVideoHtml += '<div class=UiText>' + lang.quality + ':</div>';
	AudioVideoHtml += '<div class=pill-nav>';
	AudioVideoHtml +=
		'<input name=Settings_Quality id=r30 type=radio value="160"><label class=radio_pill for=r30><i class="fa fa-video-camera" style="transform: scale(0.4)"></i> HQVGA</label>';
	AudioVideoHtml +=
		'<input name=Settings_Quality id=r31 type=radio value="240"><label class=radio_pill for=r31><i class="fa fa-video-camera" style="transform: scale(0.6)"></i> QVGA</label>';
	AudioVideoHtml +=
		'<input name=Settings_Quality id=r32 type=radio value="480"><label class=radio_pill for=r32><i class="fa fa-video-camera" style="transform: scale(0.8)"></i> VGA</label>';
	AudioVideoHtml +=
		'<input name=Settings_Quality id=r33 type=radio value="720"><label class=radio_pill for=r33><i class="fa fa-video-camera" style="transform: scale(1)"></i> HD</label>';
	AudioVideoHtml +=
		'<input name=Settings_Quality id=r34 type=radio value=""><label class=radio_pill for=r34><i class="fa fa-trash"></i></label>';
	AudioVideoHtml += '</div>';

	AudioVideoHtml += '<div class=UiText>' + lang.image_orientation + ':</div>';
	AudioVideoHtml += '<div class=pill-nav>';
	AudioVideoHtml +=
		'<input name=Settings_Oriteation id=r20 type=radio value="rotateY(0deg)"><label class=radio_pill for=r20><i class="fa fa-address-card" style="transform: rotateY(0deg)"></i> Normal</label>';
	AudioVideoHtml +=
		'<input name=Settings_Oriteation id=r21 type=radio value="rotateY(180deg)"><label class=radio_pill for=r21><i class="fa fa-address-card" style="transform: rotateY(180deg)"></i> Mirror</label>';
	AudioVideoHtml += '</div>';

	AudioVideoHtml += '<div class=UiText>' + lang.aspect_ratio + ':</div>';
	AudioVideoHtml += '<div class=pill-nav>';
	AudioVideoHtml +=
		'<input name=Settings_AspectRatio id=r10 type=radio value="1"><label class=radio_pill for=r10><i class="fa fa-square-o" style="transform: scaleX(1); margin-left: 7px; margin-right: 7px"></i> 1:1</label>';
	AudioVideoHtml +=
		'<input name=Settings_AspectRatio id=r11 type=radio value="1.33"><label class=radio_pill for=r11><i class="fa fa-square-o" style="transform: scaleX(1.33); margin-left: 5px; margin-right: 5px;"></i> 4:3</label>';
	AudioVideoHtml +=
		'<input name=Settings_AspectRatio id=r12 type=radio value="1.77"><label class=radio_pill for=r12><i class="fa fa-square-o" style="transform: scaleX(1.77); margin-right: 3px;"></i> 16:9</label>';
	AudioVideoHtml +=
		'<input name=Settings_AspectRatio id=r13 type=radio value=""><label class=radio_pill for=r13><i class="fa fa-trash"></i></label>';
	AudioVideoHtml += '</div>';

	AudioVideoHtml += '<div class=UiText>' + lang.preview + ':</div>';
	AudioVideoHtml +=
		'<div style="text-align:center; margin-top:10px"><video id=local-video-preview class=previewVideo></video></div>';

	// TODO
	// AudioVideoHtml += "<div class=UiText>"+ lang.ringtone +":</div>";
	// AudioVideoHtml += "<div style=\"text-align:center\"><select id=ringTone style=\"width:100%\"></select></div>";
	// AudioVideoHtml += "<div>Play</div>";

	AudioVideoHtml += '<div id=RingDeviceSection>';
	AudioVideoHtml += '<div class=UiText>' + lang.ring_device + ':</div>';
	AudioVideoHtml +=
		'<div style="text-align:center"><select id=ringDevice style="width:100%"></select></div>';
	AudioVideoHtml += '</div>';

	AudioVideoHtml += '<BR><BR></div>';

	ConfigureTabbar.tabs('2').attachHTMLString(AudioVideoHtml);

	// Output
	var selectAudioScr = $('#playbackSrc');

	var playButton = $('#preview_output_play');

	// Microphone
	var selectMicScr = $('#microphoneSrc');
	$('#Settings_AutoGainControl').prop('checked', AutoGainControl);
	$('#Settings_EchoCancellation').prop('checked', EchoCancellation);
	$('#Settings_NoiseSuppression').prop('checked', NoiseSuppression);

	// Webcam
	var selectVideoScr = $('#previewVideoSrc');

	// Orientation
	var OriteationSel = $('input[name=Settings_Oriteation]');
	OriteationSel.each(function () {
		if (this.value == MirrorVideo) $(this).prop('checked', true);
	});
	$('#local-video-preview').css('transform', MirrorVideo);

	// Frame Rate
	var frameRateSel = $('input[name=Settings_FrameRate]');
	frameRateSel.each(function () {
		if (this.value == maxFrameRate) $(this).prop('checked', true);
	});

	// Quality
	var QualitySel = $('input[name=Settings_Quality]');
	QualitySel.each(function () {
		if (this.value == videoHeight) $(this).prop('checked', true);
	});

	// Aspect Ratio
	var AspectRatioSel = $('input[name=Settings_AspectRatio]');
	AspectRatioSel.each(function () {
		if (this.value == videoAspectRatio) $(this).prop('checked', true);
	});

	// Ring Tone
	var selectRingTone = $('#ringTone');
	// TODO

	// Ring Device
	var selectRingDevice = $('#ringDevice');
	// TODO

	// Handle Aspect Ratio Change
	AspectRatioSel.change(function () {
		console.log('Call to change Aspect Ratio (' + this.value + ')');

		var localVideo = $('#local-video-preview').get(0);
		localVideo.muted = true;
		localVideo.playsinline = true;
		localVideo.autoplay = true;

		var tracks = localVideo.srcObject.getTracks();
		tracks.forEach(function (track) {
			track.stop();
		});

		var constraints = {
			audio: false,
			video: {
				deviceId:
					selectVideoScr.val() != 'default'
						? { exact: selectVideoScr.val() }
						: 'default',
			},
		};
		if ($('input[name=Settings_FrameRate]:checked').val() != '') {
			constraints.video.frameRate = $(
				'input[name=Settings_FrameRate]:checked'
			).val();
		}
		if ($('input[name=Settings_Quality]:checked').val() != '') {
			constraints.video.height = $(
				'input[name=Settings_Quality]:checked'
			).val();
		}
		if (this.value != '') {
			constraints.video.aspectRatio = this.value;
		}
		console.log('Constraints:', constraints);
		var localStream = new MediaStream();
		if (navigator.mediaDevices) {
			navigator.mediaDevices
				.getUserMedia(constraints)
				.then(function (newStream) {
					var videoTrack = newStream.getVideoTracks()[0];
					localStream.addTrack(videoTrack);
					localVideo.srcObject = localStream;
					localVideo.onloadedmetadata = function (e) {
						localVideo.play();
					};
				})
				.catch(function (e) {
					console.error(e);
					Alert(lang.alert_error_user_media, lang.error);
				});
		}
	});

	// Handle Video Height Change
	QualitySel.change(function () {
		console.log('Call to change Video Height (' + this.value + ')');

		var localVideo = $('#local-video-preview').get(0);
		localVideo.muted = true;
		localVideo.playsinline = true;
		localVideo.autoplay = true;

		var tracks = localVideo.srcObject.getTracks();
		tracks.forEach(function (track) {
			track.stop();
		});

		var constraints = {
			audio: false,
			video: {
				deviceId:
					selectVideoScr.val() != 'default'
						? { exact: selectVideoScr.val() }
						: 'default',
			},
		};
		if ($('input[name=Settings_FrameRate]:checked').val() != '') {
			constraints.video.frameRate = $(
				'input[name=Settings_FrameRate]:checked'
			).val();
		}
		if (this.value) {
			constraints.video.height = this.value;
		}
		if ($('input[name=Settings_AspectRatio]:checked').val() != '') {
			constraints.video.aspectRatio = $(
				'input[name=Settings_AspectRatio]:checked'
			).val();
		}
		console.log('Constraints:', constraints);
		var localStream = new MediaStream();
		if (navigator.mediaDevices) {
			navigator.mediaDevices
				.getUserMedia(constraints)
				.then(function (newStream) {
					var videoTrack = newStream.getVideoTracks()[0];
					localStream.addTrack(videoTrack);
					localVideo.srcObject = localStream;
					localVideo.onloadedmetadata = function (e) {
						localVideo.play();
					};
				})
				.catch(function (e) {
					console.error(e);
					Alert(lang.alert_error_user_media, lang.error);
				});
		}
	});

	// Handle Frame Rate Change
	frameRateSel.change(function () {
		console.log('Call to change Frame Rate (' + this.value + ')');

		var localVideo = $('#local-video-preview').get(0);
		localVideo.muted = true;
		localVideo.playsinline = true;
		localVideo.autoplay = true;

		var tracks = localVideo.srcObject.getTracks();
		tracks.forEach(function (track) {
			track.stop();
		});

		var constraints = {
			audio: false,
			video: {
				deviceId:
					selectVideoScr.val() != 'default'
						? { exact: selectVideoScr.val() }
						: 'default',
			},
		};
		if (this.value != '') {
			constraints.video.frameRate = this.value;
		}
		if ($('input[name=Settings_Quality]:checked').val() != '') {
			constraints.video.height = $(
				'input[name=Settings_Quality]:checked'
			).val();
		}
		if ($('input[name=Settings_AspectRatio]:checked').val() != '') {
			constraints.video.aspectRatio = $(
				'input[name=Settings_AspectRatio]:checked'
			).val();
		}
		console.log('Constraints:', constraints);
		var localStream = new MediaStream();
		if (navigator.mediaDevices) {
			navigator.mediaDevices
				.getUserMedia(constraints)
				.then(function (newStream) {
					var videoTrack = newStream.getVideoTracks()[0];
					localStream.addTrack(videoTrack);
					localVideo.srcObject = localStream;
					localVideo.onloadedmetadata = function (e) {
						localVideo.play();
					};
				})
				.catch(function (e) {
					console.error(e);
					Alert(lang.alert_error_user_media, lang.error);
				});
		}
	});

	// Handle Audio Source changes (Microphone)
	selectMicScr.change(function () {
		console.log('Call to change Microphone (' + this.value + ')');

		// Change and update visual preview
		try {
			var tracks = window.SettingsMicrophoneStream.getTracks();
			tracks.forEach(function (track) {
				track.stop();
			});
			window.SettingsMicrophoneStream = null;
		} catch (e) {}

		try {
			soundMeter = window.SettingsMicrophoneSoundMeter;
			soundMeter.stop();
			window.SettingsMicrophoneSoundMeter = null;
		} catch (e) {}

		// Get Microphone
		var constraints = {
			audio: {
				deviceId: { exact: this.value },
			},
			video: false,
		};
		var localMicrophoneStream = new MediaStream();
		navigator.mediaDevices
			.getUserMedia(constraints)
			.then(function (mediaStream) {
				var audioTrack = mediaStream.getAudioTracks()[0];
				if (audioTrack != null) {
					// Display Micrphone Levels
					localMicrophoneStream.addTrack(audioTrack);
					window.SettingsMicrophoneStream = localMicrophoneStream;
					window.SettingsMicrophoneSoundMeter = MeterSettingsOutput(
						localMicrophoneStream,
						'Settings_MicrophoneOutput',
						'width',
						50
					);
				}
			})
			.catch(function (e) {
				console.log('Failed to getUserMedia', e);
			});
	});

	// Handle output change (speaker)
	selectAudioScr.change(function () {
		console.log('Call to change Speaker (' + this.value + ')');

		var audioObj = window.SettingsOutputAudio;
		if (audioObj != null) {
			if (typeof audioObj.sinkId !== 'undefined') {
				audioObj
					.setSinkId(this.value)
					.then(function () {
						console.log('sinkId applied to audioObj:', this.value);
					})
					.catch(function (e) {
						console.warn('Failed not apply setSinkId.', e);
					});
			}
		}
	});

	// play button press
	playButton.click(function () {
		try {
			window.SettingsOutputAudio.pause();
		} catch (e) {}
		window.SettingsOutputAudio = null;

		try {
			var tracks = window.SettingsOutputStream.getTracks();
			tracks.forEach(function (track) {
				track.stop();
			});
		} catch (e) {}
		window.SettingsOutputStream = null;

		try {
			var soundMeter = window.SettingsOutputStreamMeter;
			soundMeter.stop();
		} catch (e) {}
		window.SettingsOutputStreamMeter = null;

		// Load Sample
		console.log('Audio:', audioBlobs.speech_orig.url);
		var audioObj = new Audio(audioBlobs.speech_orig.blob);
		audioObj.preload = 'auto';
		audioObj.onplay = function () {
			var outputStream = new MediaStream();
			if (typeof audioObj.captureStream !== 'undefined') {
				outputStream = audioObj.captureStream();
			} else if (typeof audioObj.mozCaptureStream !== 'undefined') {
				return;
			} else if (typeof audioObj.webkitCaptureStream !== 'undefined') {
				outputStream = audioObj.webkitCaptureStream();
			} else {
				console.warn('Cannot display Audio Levels');
				return;
			}
			// Monitor Output
			window.SettingsOutputStream = outputStream;
			window.SettingsOutputStreamMeter = MeterSettingsOutput(
				outputStream,
				'Settings_SpeakerOutput',
				'width',
				50
			);
		};
		audioObj.oncanplaythrough = function (e) {
			if (typeof audioObj.sinkId !== 'undefined') {
				audioObj
					.setSinkId(selectAudioScr.val())
					.then(function () {
						console.log('Set sinkId to:', selectAudioScr.val());
					})
					.catch(function (e) {
						console.warn('Failed not apply setSinkId.', e);
					});
			}
			// Play
			audioObj
				.play()
				.then(function () {
					// Audio Is Playing
				})
				.catch(function (e) {
					console.warn('Unable to play audio file', e);
				});
			console.log('Playing sample audio file... ');
		};

		window.SettingsOutputAudio = audioObj;
	});

	// Change Video Image
	OriteationSel.change(function () {
		console.log('Call to change Orientation (' + this.value + ')');
		$('#local-video-preview').css('transform', this.value);
	});

	// Handle video input change (WebCam)
	selectVideoScr.change(function () {
		console.log('Call to change WebCam (' + this.value + ')');

		var localVideo = $('#local-video-preview').get(0);
		localVideo.muted = true;
		localVideo.playsinline = true;
		localVideo.autoplay = true;

		var tracks = localVideo.srcObject.getTracks();
		tracks.forEach(function (track) {
			track.stop();
		});

		var constraints = {
			audio: false,
			video: {
				deviceId: this.value != 'default' ? { exact: this.value } : 'default',
			},
		};
		if ($('input[name=Settings_FrameRate]:checked').val() != '') {
			constraints.video.frameRate = $(
				'input[name=Settings_FrameRate]:checked'
			).val();
		}
		if ($('input[name=Settings_Quality]:checked').val() != '') {
			constraints.video.height = $(
				'input[name=Settings_Quality]:checked'
			).val();
		}
		if ($('input[name=Settings_AspectRatio]:checked').val() != '') {
			constraints.video.aspectRatio = $(
				'input[name=Settings_AspectRatio]:checked'
			).val();
		}
		console.log('Constraints:', constraints);
		var localStream = new MediaStream();
		if (navigator.mediaDevices) {
			navigator.mediaDevices
				.getUserMedia(constraints)
				.then(function (newStream) {
					var videoTrack = newStream.getVideoTracks()[0];
					localStream.addTrack(videoTrack);
					localVideo.srcObject = localStream;
					localVideo.onloadedmetadata = function (e) {
						localVideo.play();
					};
				})
				.catch(function (e) {
					console.error(e);
					Alert(lang.alert_error_user_media, lang.error);
				});
		}
	});

	// Note: Only works over HTTPS or via localhost!!
	var localVideo = $('#local-video-preview').get(0);
	localVideo.muted = true;
	localVideo.playsinline = true;
	localVideo.autoplay = true;

	var localVideoStream = new MediaStream();
	var localMicrophoneStream = new MediaStream();

	if (navigator.mediaDevices) {
		navigator.mediaDevices
			.enumerateDevices()
			.then(function (deviceInfos) {
				var savedVideoDevice = getVideoSrcID();
				var videoDeviceFound = false;

				var savedAudioDevice = getAudioSrcID();
				var audioDeviceFound = false;

				var MicrophoneFound = false;
				var SpeakerFound = false;
				var VideoFound = false;

				for (var i = 0; i < deviceInfos.length; ++i) {
					console.log(
						'Found Device (' + deviceInfos[i].kind + '): ',
						deviceInfos[i].label
					);

					// Check Devices
					if (deviceInfos[i].kind === 'audioinput') {
						MicrophoneFound = true;
						if (
							savedAudioDevice != 'default' &&
							deviceInfos[i].deviceId == savedAudioDevice
						) {
							audioDeviceFound = true;
						}
					} else if (deviceInfos[i].kind === 'audiooutput') {
						SpeakerFound = true;
					} else if (deviceInfos[i].kind === 'videoinput') {
						VideoFound = true;
						if (
							savedVideoDevice != 'default' &&
							deviceInfos[i].deviceId == savedVideoDevice
						) {
							videoDeviceFound = true;
						}
					}
				}

				var contraints = {
					audio: MicrophoneFound,
					video: VideoFound,
				};

				if (MicrophoneFound) {
					contraints.audio = { deviceId: 'default' };
					if (audioDeviceFound)
						contraints.audio.deviceId = { exact: savedAudioDevice };
				}
				if (VideoFound) {
					contraints.video = { deviceId: 'default' };
					if (videoDeviceFound)
						contraints.video.deviceId = { exact: savedVideoDevice };
				}
				// Additional
				if ($('input[name=Settings_FrameRate]:checked').val() != '') {
					contraints.video.frameRate = $(
						'input[name=Settings_FrameRate]:checked'
					).val();
				}
				if ($('input[name=Settings_Quality]:checked').val() != '') {
					contraints.video.height = $(
						'input[name=Settings_Quality]:checked'
					).val();
				}
				if ($('input[name=Settings_AspectRatio]:checked').val() != '') {
					contraints.video.aspectRatio = $(
						'input[name=Settings_AspectRatio]:checked'
					).val();
				}
				console.log('Get User Media', contraints);
				// Get User Media
				navigator.mediaDevices
					.getUserMedia(contraints)
					.then(function (mediaStream) {
						// Handle Video
						var videoTrack =
							mediaStream.getVideoTracks().length >= 1
								? mediaStream.getVideoTracks()[0]
								: null;
						if (VideoFound && videoTrack != null) {
							localVideoStream.addTrack(videoTrack);
							// Display Preview Video
							localVideo.srcObject = localVideoStream;
							localVideo.onloadedmetadata = function (e) {
								localVideo.play();
							};
						} else {
							console.warn(
								'No video / webcam devices found. Video Calling will not be possible.'
							);
						}

						// Handle Audio
						var audioTrack =
							mediaStream.getAudioTracks().length >= 1
								? mediaStream.getAudioTracks()[0]
								: null;
						if (MicrophoneFound && audioTrack != null) {
							localMicrophoneStream.addTrack(audioTrack);
							// Display Micrphone Levels
							window.SettingsMicrophoneStream = localMicrophoneStream;
							window.SettingsMicrophoneSoundMeter = MeterSettingsOutput(
								localMicrophoneStream,
								'Settings_MicrophoneOutput',
								'width',
								50
							);
						} else {
							console.warn(
								'No microphone devices found. Calling will not be possible.'
							);
						}

						// Display Output Levels
						$('#Settings_SpeakerOutput').css('width', '0%');
						if (!SpeakerFound) {
							console.log(
								'No speaker devices found, make sure one is plugged in.'
							);
							$('#playbackSrc').hide();
							$('#RingDeviceSection').hide();
						}

						// Return .then()
						return navigator.mediaDevices.enumerateDevices();
					})
					.then(function (deviceInfos) {
						for (var i = 0; i < deviceInfos.length; ++i) {
							console.log(
								'Found Device (' + deviceInfos[i].kind + ') Again: ',
								deviceInfos[i].label,
								deviceInfos[i].deviceId
							);

							var deviceInfo = deviceInfos[i];
							var devideId = deviceInfo.deviceId;
							var DisplayName = deviceInfo.label;
							if (DisplayName.indexOf('(') > 0)
								DisplayName = DisplayName.substring(
									0,
									DisplayName.indexOf('(')
								);

							var option = $('<option/>');
							option.prop('value', devideId);

							if (deviceInfo.kind === 'audioinput') {
								option.text(DisplayName != '' ? DisplayName : 'Microphone');
								if (getAudioSrcID() == devideId) option.prop('selected', true);
								selectMicScr.append(option);
							} else if (deviceInfo.kind === 'audiooutput') {
								option.text(DisplayName != '' ? DisplayName : 'Speaker');
								if (getAudioOutputID() == devideId)
									option.prop('selected', true);
								selectAudioScr.append(option);
								selectRingDevice.append(option.clone());
							} else if (deviceInfo.kind === 'videoinput') {
								if (getVideoSrcID() == devideId) option.prop('selected', true);
								option.text(DisplayName != '' ? DisplayName : 'Webcam');
								selectVideoScr.append(option);
							}
						}
						// Add "Default" option
						if (selectVideoScr.children('option').length > 0) {
							var option = $('<option/>');
							option.prop('value', 'default');
							if (
								getVideoSrcID() == 'default' ||
								getVideoSrcID() == '' ||
								getVideoSrcID() == 'null'
							)
								option.prop('selected', true);
							option.text('(Default)');
							selectVideoScr.append(option);
						}
					})
					.catch(function (e) {
						console.error(e);
						Alert(lang.alert_error_user_media, lang.error);
					});
			})
			.catch(function (e) {
				console.error('Error getting Media Devices', e);
			});
	} else {
		Alert(lang.alert_media_devices, lang.error);
	}

	// 3 Appearance
	// ==================================================================================
	var AppearanceHtml = '<div class="UiWindowField scroller">';
	AppearanceHtml +=
		'<div id=ImageCanvas style="width:150px; height:150px"></div>';
	AppearanceHtml +=
		'<div style="float:left; margin-left:200px;"><input id=fileUploader type=file></div>';
	AppearanceHtml += '<div style="margin-top: 50px"></div>';
	AppearanceHtml += '<div>';

	ConfigureTabbar.tabs('3').attachHTMLString(AppearanceHtml);

	cropper = $('#ImageCanvas').croppie({
		viewport: { width: 150, height: 150, type: 'circle' },
	});

	// Preview Existing Image
	$('#ImageCanvas')
		.croppie('bind', { url: getPicture('profilePicture') })
		.then();

	// Wireup File Change
	$('#fileUploader').change(function () {
		var filesArray = $(this).prop('files');

		if (filesArray.length == 1) {
			var uploadId = Math.floor(Math.random() * 1000000000);
			var fileObj = filesArray[0];
			var fileName = fileObj.name;
			var fileSize = fileObj.size;

			if (fileSize <= 52428800) {
				console.log(
					'Adding (' +
						uploadId +
						'): ' +
						fileName +
						' of size: ' +
						fileSize +
						'bytes'
				);

				var reader = new FileReader();
				reader.Name = fileName;
				reader.UploadId = uploadId;
				reader.Size = fileSize;
				reader.onload = function (event) {
					$('#ImageCanvas').croppie('bind', {
						url: event.target.result,
					});
				};

				// Use onload for this
				reader.readAsDataURL(fileObj);
			} else {
				Alert(lang.alert_file_size, lang.error);
			}
		} else {
			Alert(lang.alert_single_file, lang.error);
		}
	});

	// 4 Notifications
	// ==================================================================================
	var NotificationsHtml = '<div class="UiWindowField scroller">';
	NotificationsHtml += '<div class=UiText>' + lang.notifications + ':</div>';
	NotificationsHtml +=
		'<div><input type=checkbox id=Settings_Notifications><label for=Settings_Notifications> ' +
		lang.enable_onscreen_notifications +
		'<label></div>';
	NotificationsHtml += '<div>';

	ConfigureTabbar.tabs('4').attachHTMLString(NotificationsHtml);

	var NotificationsCheck = $('#Settings_Notifications');
	NotificationsCheck.prop('checked', NotificationsActive);
	NotificationsCheck.change(function () {
		if (this.checked) {
			if (Notification.permission != 'granted') {
				if (checkNotificationPromise()) {
					Notification.requestPermission().then(function (p) {
						console.log(p);
						HandleNotifyPermission(p);
					});
				} else {
					Notification.requestPermission(function (p) {
						console.log(p);
						HandleNotifyPermission(p);
					});
				}
			}
		}
	});
}
function checkNotificationPromise() {
	try {
		Notification.requestPermission().then();
	} catch (e) {
		return false;
	}
	return true;
}
function HandleNotifyPermission(p) {
	if (p == 'granted') {
		// Good
	} else {
		Alert(lang.alert_notification_permission, lang.permission, function () {
			console.log('Attempting to uncheck the checkbox...');
			$('#Settings_Notifications').prop('checked', false);
		});
	}
}
function EditBuddyWindow(buddy) {
	try {
		dhtmlxPopup.hide();
	} catch (e) {}

	var buddyObj = null;
	var itemId = -1;
	var json = JSON.parse(localDB.getItem(profileUserID + '-Buddies'));
	$.each(json.DataCollection, function (i, item) {
		if (item.uID == buddy || item.cID == buddy || item.gID == buddy) {
			buddyObj = item;
			itemId = i;
			return false;
		}
	});

	if (buddyObj == null) {
		Alert(lang.alert_not_found, lang.error);
		return;
	}

	var cropper;

	var html = "<div border=0 class='UiWindowField scroller'>";

	html += '<div id=ImageCanvas style="width:150px; height:150px"></div>';
	html +=
		'<div style="float:left; margin-left:200px;"><input id=fileUploader type=file></div>';
	html += '<div style="margin-top: 50px"></div>';

	html += '<div class=UiText>' + lang.full_name + ':</div>';
	html +=
		"<div><input id=AddSomeone_Name class=UiInputText type=text placeholder='" +
		lang.eg_full_name +
		"' value='" +
		(buddyObj.DisplayName &&
		buddyObj.DisplayName != 'null' &&
		buddyObj.DisplayName != 'undefined'
			? buddyObj.DisplayName
			: '') +
		"'></div>";

	html += '<div class=UiText>' + lang.title_description + ':</div>';
	if (buddyObj.Type == 'extension') {
		html +=
			"<div><input id=AddSomeone_Desc class=UiInputText type=text placeholder='" +
			lang.eg_general_manager +
			"' value='" +
			(buddyObj.Position &&
			buddyObj.Position != 'null' &&
			buddyObj.Position != 'undefined'
				? buddyObj.Position
				: '') +
			"'></div>";
	} else {
		html +=
			"<div><input id=AddSomeone_Desc class=UiInputText type=text placeholder='" +
			lang.eg_general_manager +
			"' value='" +
			(buddyObj.Description &&
			buddyObj.Description != 'null' &&
			buddyObj.Description != 'undefined'
				? buddyObj.Description
				: '') +
			"'></div>";
	}
	html += '<div class=UiText>' + lang.mobile_number + ':</div>';
	html +=
		"<div><input id=AddSomeone_Mobile class=UiInputText type=text placeholder='" +
		lang.eg_mobile_number +
		"' value='" +
		(buddyObj.MobileNumber &&
		buddyObj.MobileNumber != 'null' &&
		buddyObj.MobileNumber != 'undefined'
			? buddyObj.MobileNumber
			: '') +
		"'></div>";

	html += '<div class=UiText>' + lang.email + ':</div>';
	html +=
		"<div><input id=AddSomeone_Email class=UiInputText type=text placeholder='" +
		lang.email +
		"' value='" +
		(buddyObj.Email && buddyObj.Email != 'null' && buddyObj.Email != 'undefined'
			? buddyObj.Email
			: '') +
		"'></div>";

	html += '<div class=UiText>' + lang.contact_number_1 + ':</div>';
	html +=
		"<div><input id=AddSomeone_Num1 class=UiInputText type=text placeholder='" +
		lang.eg_contact_number_1 +
		"' value='" +
		(buddyObj.ContactNumber1 &&
		buddyObj.ContactNumber1 != 'null' &&
		buddyObj.ContactNumber1 != 'undefined'
			? buddyObj.ContactNumber1
			: '') +
		"'></div>";

	html += '<div class=UiText>' + lang.contact_number_2 + ':</div>';
	html +=
		"<div><input id=AddSomeone_Num2 class=UiInputText type=text placeholder='" +
		lang.eg_contact_number_2 +
		"' value='" +
		(buddyObj.ContactNumber2 &&
		buddyObj.ContactNumber2 != 'null' &&
		buddyObj.ContactNumber2 != 'undefined'
			? buddyObj.ContactNumber2
			: '') +
		"'></div>";
	html += '</div>';
	OpenWindow(
		html,
		lang.edit,
		480,
		640,
		false,
		true,
		lang.save,
		function () {
			buddyObj.LastActivity = utcDateNow();
			buddyObj.DisplayName = $('#AddSomeone_Name').val();
			if (buddyObj.Type == 'extension') {
				buddyObj.Position = $('#AddSomeone_Desc').val();
			} else {
				buddyObj.Description = $('#AddSomeone_Desc').val();
			}
			buddyObj.MobileNumber = $('#AddSomeone_Mobile').val();
			buddyObj.Email = $('#AddSomeone_Email').val();
			buddyObj.ContactNumber1 = $('#AddSomeone_Num1').val();
			buddyObj.ContactNumber2 = $('#AddSomeone_Num2').val();

			// Update Image
			var constraints = {
				type: 'base64',
				size: 'viewport',
				format: 'png',
				quality: 1,
				circle: false,
			};
			$('#ImageCanvas')
				.croppie('result', constraints)
				.then(function (base64) {
					if (buddyObj.Type == 'extension') {
						localDB.setItem('img-' + buddyObj.uID + '-extension', base64);
						$('#contact-' + buddyObj.uID + '-picture-main').css(
							'background-image',
							'url(' + getPicture(buddyObj.uID, 'extension') + ')'
						);
					} else if (buddyObj.Type == 'contact') {
						localDB.setItem('img-' + buddyObj.cID + '-contact', base64);
						$('#contact-' + buddyObj.cID + '-picture-main').css(
							'background-image',
							'url(' + getPicture(buddyObj.cID, 'contact') + ')'
						);
					} else if (buddyObj.Type == 'group') {
						localDB.setItem('img-' + buddyObj.gID + '-group', base64);
						$('#contact-' + buddyObj.gID + '-picture-main').css(
							'background-image',
							'url(' + getPicture(buddyObj.gID, 'group') + ')'
						);
					}
					// Update
					UpdateBuddyList();
				});

			// Update:
			json.DataCollection[itemId] = buddyObj;

			// Save To DB
			localDB.setItem(profileUserID + '-Buddies', JSON.stringify(json));

			// Update the Memory Array, so that the UpdateBuddyList can make the changes
			for (var b = 0; b < Buddies.length; b++) {
				if (buddyObj.Type == 'extension') {
					if (buddyObj.uID == Buddies[b].identity) {
						Buddies[b].lastActivity = buddyObj.LastActivity;
						Buddies[b].CallerIDName = buddyObj.DisplayName;
						Buddies[b].Desc = buddyObj.Position;
					}
				} else if (buddyObj.Type == 'contact') {
					if (buddyObj.cID == Buddies[b].identity) {
						Buddies[b].lastActivity = buddyObj.LastActivity;
						Buddies[b].CallerIDName = buddyObj.DisplayName;
						Buddies[b].Desc = buddyObj.Description;
					}
				} else if (buddyObj.Type == 'group') {
				}
			}

			CloseWindow();
		},
		lang.cancel,
		function () {
			CloseWindow();
		},
		function () {
			// DoOnLoad
			cropper = $('#ImageCanvas').croppie({
				viewport: { width: 150, height: 150, type: 'circle' },
			});

			// Preview Existing Image
			if (buddyObj.Type == 'extension') {
				$('#ImageCanvas')
					.croppie('bind', { url: getPicture(buddyObj.uID, 'extension') })
					.then();
			} else if (buddyObj.Type == 'contact') {
				$('#ImageCanvas')
					.croppie('bind', { url: getPicture(buddyObj.cID, 'contact') })
					.then();
			} else if (buddyObj.Type == 'group') {
				$('#ImageCanvas')
					.croppie('bind', { url: getPicture(buddyObj.gID, 'group') })
					.then();
			}

			// Wireup File Change
			$('#fileUploader').change(function () {
				var filesArray = $(this).prop('files');

				if (filesArray.length == 1) {
					var uploadId = Math.floor(Math.random() * 1000000000);
					var fileObj = filesArray[0];
					var fileName = fileObj.name;
					var fileSize = fileObj.size;

					if (fileSize <= 52428800) {
						console.log(
							'Adding (' +
								uploadId +
								'): ' +
								fileName +
								' of size: ' +
								fileSize +
								'bytes'
						);

						var reader = new FileReader();
						reader.Name = fileName;
						reader.UploadId = uploadId;
						reader.Size = fileSize;
						reader.onload = function (event) {
							$('#ImageCanvas').croppie('bind', {
								url: event.target.result,
							});
						};
						reader.readAsDataURL(fileObj);
					} else {
						Alert(lang.alert_file_size, lang.error);
					}
				} else {
					Alert(lang.alert_single_file, lang.error);
				}
			});
		}
	);
}

// Init UI
// =======

function InitUi() {
	var phone = $('#Phone');
	phone.empty();
	phone.attr('class', 'pageContainer');

	// Left Section
	var leftSection = $('<div>');
	leftSection.attr('id', 'leftContent');
	leftSection.attr('style', 'float:left; height: 100%; width:320px');

	leftSection.load(hostingPrefex + './SIPML5Content/left.html');

	leftSection.html(leftHTML);

	// Right Section
	var rightSection = $('<div>');
	rightSection.attr('id', 'rightContent');
	rightSection.attr('style', 'margin-left: 320px; height: 100%');

	phone.append(leftSection);
	phone.append(rightSection);

	// Setup Windows
	windowsCollection = new dhtmlXWindows('material');
	messagingCollection = new dhtmlXWindows('material');

	if (DisableFreeDial == true) $('#BtnFreeDial').hide();
	if (DisableBuddies == true) $('#BtnAddSomeone').hide();
	if (enabledGroupServices == false) $('#BtnCreateGroup').hide();

	$('#UserDID').html(SipUsername);
	$('#UserCallID').html(profileName);
	$('#UserProfilePic').css(
		'background-image',
		"url('" + getPicture('profilePicture') + "')"
	);

	$('#txtFindBuddy').attr('placeholder', lang.find_someone);
	$('#txtFindBuddy').on('keyup', function (event) {
		UpdateBuddyList();
	});
	$('#BtnFreeDial').attr('title', lang.call);
	$('#BtnFreeDial').on('click', function (event) {
		ShowDial(this);
	});
	$('#BtnAddSomeone').attr('title', lang.add_someone);
	$('#BtnAddSomeone').on('click', function (event) {
		AddSomeoneWindow();
	});
	$('#BtnCreateGroup').attr('title', lang.create_group);
	$('#BtnCreateGroup').on('click', function (event) {
		CreateGroupWindow();
	});
	$('#UserProfile').on('click', function (event) {
		ShowMyProfileMenu(this);
	});

	UpdateUI();

	// Check if you account is created
	if (profileUserID == null) {
		ConfigureExtensionWindow();
		return; // Don't load any more, after applying settings, the page must reload.
	}

	PopulateBuddyList();

	// Select Last user
	if (localDB.getItem('SelectedBuddy') != null) {
		console.log(
			'Selecting previously selected buddy...',
			localDB.getItem('SelectedBuddy')
		);
		SelectBuddy(localDB.getItem('SelectedBuddy'));
		UpdateUI();
	}

	// Show Welcome Screen
	if (welcomeScreen) {
		if (localDB.getItem('WelcomeScreenAccept') != 'yes') {
			OpenWindow(
				welcomeScreen,
				lang.welcome,
				480,
				800,
				true,
				false,
				lang.accept,
				function () {
					localDB.setItem('WelcomeScreenAccept', 'yes');
					CloseWindow();
				},
				null,
				null,
				null,
				null
			);
		}
	}

	PreloadAudioFiles();

	CreateUserAgent();
}

function PreloadAudioFiles() {
	audioBlobs.Alert = {
		file: 'Alert.mp3',
		url: hostingPrefex + '../SIPML5Content/media/Alert.mp3',
	};
	audioBlobs.Ringtone = {
		file: 'Ringtone_1.mp3',
		url: hostingPrefex + '../SIPML5Content/media/Ringtone_1.mp3',
	};
	audioBlobs.speech_orig = {
		file: 'speech_orig.mp3',
		url: hostingPrefex + '../SIPML5Content/media/speech_orig.mp3',
	};
	audioBlobs.Busy_UK = {
		file: 'Tone_Busy-UK.mp3',
		url: hostingPrefex + '../SIPML5Content/media/Tone_Busy-UK.mp3',
	};
	audioBlobs.Busy_US = {
		file: 'Tone_Busy-US.mp3',
		url: hostingPrefex + '../SIPML5Content/media/Tone_Busy-US.mp3',
	};
	audioBlobs.CallWaiting = {
		file: 'Tone_CallWaiting.mp3',
		url: hostingPrefex + '../SIPML5Content/media/Tone_CallWaiting.mp3',
	};
	audioBlobs.Congestion_UK = {
		file: 'Tone_Congestion-UK.mp3',
		url: hostingPrefex + '../SIPML5Content/media/Tone_Congestion-UK.mp3',
	};
	audioBlobs.Congestion_US = {
		file: 'Tone_Congestion-US.mp3',
		url: hostingPrefex + '../SIPML5Content/media/Tone_Congestion-US.mp3',
	};
	audioBlobs.EarlyMedia_Australia = {
		file: 'Tone_EarlyMedia-Australia.mp3',
		url: hostingPrefex + '../SIPML5Content/media/Tone_EarlyMedia-Australia.mp3',
	};
	audioBlobs.EarlyMedia_European = {
		file: 'Tone_EarlyMedia-European.mp3',
		url: hostingPrefex + '../SIPML5Content/media/Tone_EarlyMedia-European.mp3',
	};
	audioBlobs.EarlyMedia_Japan = {
		file: 'Tone_EarlyMedia-Japan.mp3',
		url: hostingPrefex + '../SIPML5Content/media/Tone_EarlyMedia-Japan.mp3',
	};
	audioBlobs.EarlyMedia_UK = {
		file: 'Tone_EarlyMedia-UK.mp3',
		url: hostingPrefex + '../SIPML5Content/media/Tone_EarlyMedia-UK.mp3',
	};
	audioBlobs.EarlyMedia_US = {
		file: 'Tone_EarlyMedia-US.mp3',
		url: hostingPrefex + '../SIPML5Content/media/Tone_EarlyMedia-US.mp3',
	};

	$.each(audioBlobs, function (i, item) {
		var oReq = new XMLHttpRequest();
		oReq.open('GET', item.url, true);
		oReq.responseType = 'blob';
		oReq.onload = function (oEvent) {
			var reader = new FileReader();
			reader.readAsDataURL(oReq.response);
			reader.onload = function () {
				item.blob = reader.result;
			};
		};
		oReq.send();
	});
	// console.log(audioBlobs);
}
