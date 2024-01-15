// Phone Lines
// ===========
var Line = function (lineNumber, displayName, displayNumber, buddyObj) {
	this.LineNumber = lineNumber;
	this.DisplayName = displayName;
	this.DisplayNumber = displayNumber;
	this.IsSelected = false;
	this.BuddyObj = buddyObj;
	this.SipSession = null;
	this.LocalSoundMeter = null;
	this.RemoteSoundMeter = null;
};
function ShowDial(obj) {
	var x = window.dhx4.absLeft(obj);
	var y = window.dhx4.absTop(obj);
	var w = obj.offsetWidth;
	var h = obj.offsetHeight;

	HidePopup();
	dhtmlxPopup = new dhtmlXPopup();
	var html =
		'<div><input id=dialText class=dialTextInput oninput="handleDialInput(this, event)" style="width:160px; margin-top:15px"></div>';
	html +=
		'<table cellspacing=10 cellpadding=0 style="margin-left:auto; margin-right: auto">';
	html +=
		'<tr><td><button class=dtmfButtons onclick="KeyPress(\'1\')"><div>1</div><span>&nbsp;</span></button></td>';
	html +=
		'<td><button class=dtmfButtons onclick="KeyPress(\'2\')"><div>2</div><span>ABC</span></button></td>';
	html +=
		'<td><button class=dtmfButtons onclick="KeyPress(\'3\')"><div>3</div><span>DEF</span></button></td></tr>';
	html +=
		'<tr><td><button class=dtmfButtons onclick="KeyPress(\'4\')"><div>4</div><span>GHI</span></button></td>';
	html +=
		'<td><button class=dtmfButtons onclick="KeyPress(\'5\')"><div>5</div><span>JKL</span></button></td>';
	html +=
		'<td><button class=dtmfButtons onclick="KeyPress(\'6\')"><div>6</div><span>MNO</span></button></td></tr>';
	html +=
		'<tr><td><button class=dtmfButtons onclick="KeyPress(\'7\')"><div>7</div><span>PQRS</span></button></td>';
	html +=
		'<td><button class=dtmfButtons onclick="KeyPress(\'8\')"><div>8</div><span>TUV</span></button></td>';
	html +=
		'<td><button class=dtmfButtons onclick="KeyPress(\'9\')"><div>9</div><span>WXYZ</span></button></td></tr>';
	html +=
		'<tr><td><button class=dtmfButtons onclick="KeyPress(\'*\')">*</button></td>';
	html +=
		'<td><button class=dtmfButtons onclick="KeyPress(\'0\')">0</button></td>';
	html +=
		'<td><button class=dtmfButtons onclick="KeyPress(\'#\')">#</button></td></tr>';
	html += '</table>';
	html += '<div style="text-align: center; margin-bottom:15px">';
	html +=
		'<button class="roundButtons dialButtons" id=dialAudio style="width:48px; height:48px;" title="' +
		lang.audio_call +
		'" onclick="DialByLine(\'audio\')"><i class="fa fa-phone"></i></button>';
	if (EnableVideoCalling) {
		html +=
			'<button class="roundButtons dialButtons" id=dialVideo style="width:48px; height:48px; margin-left:20px" title="' +
			lang.video_call +
			'" onclick="DialByLine(\'video\')"><i class="fa fa-video-camera"></i></button>';
	}
	html += '</div>';

	dhtmlxPopup.attachHTML(html);
	dhtmlxPopup.show(x, y, w, h);
}
function handleDialInput(obj, event) {
	if (EnableAlphanumericDial) {
		$('#dialText').val(
			$('#dialText')
				.val()
				.replace(/[^\da-zA-Z\*\#\+]/g, '')
				.substring(0, MaxDidLength)
		);
	} else {
		$('#dialText').val(
			$('#dialText')
				.val()
				.replace(/[^\d\*\#\+]/g, '')
				.substring(0, MaxDidLength)
		);
	}
	$('#dialVideo').prop('disabled', $('#dialText').val().length >= DidLength);
}
function KeyPress(num) {
	$('#dialText').val(($('#dialText').val() + num).substring(0, MaxDidLength));
	$('#dialVideo').prop('disabled', $('#dialText').val().length >= DidLength);
}
function DialByLine(type, buddy, numToDial, CallerID) {
	if (userAgent == null || userAgent.isRegistered() == false) {
		ConfigureExtensionWindow();
		return;
	}

	var numDial = numToDial ? numToDial : $('#dialText').val();
	if (EnableAlphanumericDial) {
		numDial = numDial
			.replace(/[^\da-zA-Z\*\#\+]/g, '')
			.substring(0, MaxDidLength);
	} else {
		numDial = numDial.replace(/[^\d\*\#\+]/g, '').substring(0, MaxDidLength);
	}
	if (numDial.length == 0) {
		console.warn('Enter number to dial');
		return;
	}

	// Create a Buddy if one is not already existing
	var buddyObj = buddy ? FindBuddyByIdentity(buddy) : FindBuddyByDid(numDial);
	if (buddyObj == null) {
		var buddyType = numDial.length > DidLength ? 'contact' : 'extension';
		// Assumption but anyway: If the number starts with a * or # then its probably not a subscribable did,
		// and is probably a feature code.
		if (buddyType.substring(0, 1) == '*' || buddyType.substring(0, 1) == '#')
			buddyType = 'contact';
		buddyObj = MakeBuddy(
			buddyType,
			true,
			false,
			true,
			CallerID ? CallerID : numDial,
			numDial
		);
	}

	// Create a Line
	var newLineNumber = Lines.length + 1;
	lineObj = new Line(newLineNumber, buddyObj.CallerIDName, numDial, buddyObj);
	Lines.push(lineObj);
	AddLineHtml(lineObj);
	SelectLine(newLineNumber);
	UpdateBuddyList();

	// Start Call Invite
	if (type == 'audio') {
		AudioCall(lineObj, numDial);
	} else {
		VideoCall(lineObj, numDial);
	}

	try {
		$('#line-' + newLineNumber)
			.get(0)
			.scrollIntoViewIfNeeded();
	} catch (e) {}
}
function SelectLine(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null) return;

	for (var l = 0; l < Lines.length; l++) {
		if (
			Lines[l].IsSelected == true &&
			Lines[l].LineNumber == lineObj.LineNumber
		) {
			// Nothing to do, you re-selected the same buddy;
			return;
		}
	}

	console.log('Selecting Line : ' + lineObj.LineNumber);

	// Can only display one thing on the Right
	$('.streamSelected').each(function () {
		$(this).prop('class', 'stream');
	});
	$('#line-ui-' + lineObj.LineNumber).prop('class', 'streamSelected');

	// Switch the SIP Sessions
	SwitchLines(lineObj.LineNumber);

	// Update Lines List
	for (var l = 0; l < Lines.length; l++) {
		var classStr =
			Lines[l].LineNumber == lineObj.LineNumber ? 'buddySelected' : 'buddy';
		if (Lines[l].SipSession != null)
			classStr = Lines[l].SipSession.local_hold
				? 'buddyActiveCallHollding'
				: 'buddyActiveCall';

		$('#line-' + Lines[l].LineNumber).prop('class', classStr);
		Lines[l].IsSelected = Lines[l].LineNumber == lineObj.LineNumber;
	}
	// Update Buddy List
	for (var b = 0; b < Buddies.length; b++) {
		$('#contact-' + Buddies[b].identity).prop('class', 'buddy');
		Buddies[b].IsSelected = false;
	}

	// Change to Stream if in Narrow view
	UpdateUI();
}
function FindLineByNumber(lineNum) {
	for (var l = 0; l < Lines.length; l++) {
		if (Lines[l].LineNumber == lineNum) return Lines[l];
	}
	return null;
}
function AddLineHtml(lineObj) {
	var html =
		'<table id="line-ui-' +
		lineObj.LineNumber +
		'" class=stream cellspacing=5 cellpadding=0>';
	html += '<tr><td class=streamSection style="height: 48px;">';

	// Close|Return|Back Button
	html +=
		'<div style="float:left; margin:0px; padding:5px; height:38px; line-height:38px">';
	html +=
		'<button id="line-' +
		lineObj.LineNumber +
		'-btn-back" onclick="CloseLine(\'' +
		lineObj.LineNumber +
		'\')" class=roundButtons title="' +
		lang.back +
		'"><i class="fa fa-chevron-left"></i></button> ';
	html += '</div>';

	// Profile UI
	html += '<div class=contact style="float: left;">';
	html += '<div class=lineIcon>' + lineObj.LineNumber + '</div>';
	html +=
		'<div class=contactNameText><i class="fa fa-phone"></i> ' +
		lang.line +
		' ' +
		lineObj.LineNumber +
		'</div>';
	html +=
		'<div class=presenceText>' +
		lineObj.DisplayName +
		' <' +
		lineObj.DisplayNumber +
		'></div>';
	html += '</div>';

	// Action Buttons
	html += '<div style="float:right; line-height: 46px;">';
	// html += "<button id=\"line-"+ lineObj.LineNumber +"-btn-videoCall\" onclick=\"VideoCall('"+ lineObj.LineNumber+"')\" class=roundButtons title=\""+ lang.video_call +"\"><i class=\"fa fa-video-camera\"></i></button> ";
	html += '</div>';

	// Separator --------------------------------------------------------------------------
	html += '<div style="clear:both; height:0px"></div>';

	// Calling UI --------------------------------------------------------------------------
	html += '<div id="line-' + lineObj.LineNumber + '-calling">';

	// Gneral Messages
	html +=
		'<div id="line-' +
		lineObj.LineNumber +
		'-timer" style="float: right; margin-top: 5px; margin-right: 10px; display:none;"></div>';
	html +=
		'<div id="line-' +
		lineObj.LineNumber +
		'-msg" class=callStatus style="display:none">...</div>';

	// Dialing Out Progress
	html +=
		'<div id="line-' +
		lineObj.LineNumber +
		'-progress" style="display:none; margin-top: 10px">';
	html += '<div class=progressCall>';
	html +=
		'<button onclick="cancelSession(\'' +
		lineObj.LineNumber +
		'\')" class=hangupButton><i class="fa fa-phone" style="transform: rotate(135deg);"></i> ' +
		lang.cancel +
		'</button>';
	html += '</div>';
	html += '</div>';

	// Active Call UI
	html +=
		'<div id="line-' +
		lineObj.LineNumber +
		'-ActiveCall" style="display:none; margin-top: 10px;">';

	// Group Call
	html +=
		'<div id="line-' +
		lineObj.LineNumber +
		'-conference" style="display:none"></div>';

	// Video UI
	if (lineObj.BuddyObj.type == 'extension') {
		html +=
			'<div id="line-' +
			lineObj.LineNumber +
			'-VideoCall" class=videoCall style="display:none">';

		// Presentation
		html +=
			'<div style="height:35px; line-height:35px; text-align: right">' +
			lang.present +
			': ';
		html += '<div class=pill-nav style="border-color:#333333">';
		html +=
			'<button id="line-' +
			lineObj.LineNumber +
			'-src-camera" onclick="PresentCamera(\'' +
			lineObj.LineNumber +
			'\')" title="' +
			lang.camera +
			'" disabled><i class="fa fa-video-camera"></i></button>';
		html +=
			'<button id="line-' +
			lineObj.LineNumber +
			'-src-canvas" onclick="PresentScratchpad(\'' +
			lineObj.LineNumber +
			'\')" title="' +
			lang.scratchpad +
			'"><i class="fa fa-pencil-square"></i></button>';
		html +=
			'<button id="line-' +
			lineObj.LineNumber +
			'-src-desktop" onclick="PresentScreen(\'' +
			lineObj.LineNumber +
			'\')" title="' +
			lang.screen +
			'"><i class="fa fa-desktop"></i></button>';
		html +=
			'<button id="line-' +
			lineObj.LineNumber +
			'-src-video" onclick="PresentVideo(\'' +
			lineObj.LineNumber +
			'\')" title="' +
			lang.video +
			'"><i class="fa fa-file-video-o"></i></button>';
		html +=
			'<button id="line-' +
			lineObj.LineNumber +
			'-src-blank" onclick="PresentBlank(\'' +
			lineObj.LineNumber +
			'\')" title="' +
			lang.blank +
			'"><i class="fa fa-ban"></i></button>';
		html += '</div>';
		html +=
			'&nbsp;<button id="line-' +
			lineObj.LineNumber +
			'-expand" onclick="ExpandVideoArea(\'' +
			lineObj.LineNumber +
			'\')"><i class="fa fa-expand"></i></button>';
		html +=
			'<button id="line-' +
			lineObj.LineNumber +
			'-restore" onclick="RestoreVideoArea(\'' +
			lineObj.LineNumber +
			'\')" style="display:none"><i class="fa fa-compress"></i></button>';
		html += '</div>';

		// Preview
		html +=
			'<div id="line-' +
			lineObj.LineNumber +
			'-preview-container" class=PreviewContainer>';
		html +=
			'<video id="line-' + lineObj.LineNumber + '-localVideo" muted></video>'; // Default Display
		html += '</div>';

		// Stage
		html +=
			'<div id="line-' +
			lineObj.LineNumber +
			'-stage-container" class=StageContainer>';
		html +=
			'<video id="line-' + lineObj.LineNumber + '-remoteVideo" muted></video>'; // Default Display
		html +=
			'<div id="line-' +
			lineObj.LineNumber +
			'-scratchpad-container" style="display:none"></div>';
		html +=
			'<video id="line-' +
			lineObj.LineNumber +
			'-sharevideo" controls muted style="display:none; object-fit: contain;"></video>';
		html += '</div>';

		html += '</div>';
	}

	// Audio Call
	html +=
		'<div id="line-' +
		lineObj.LineNumber +
		'-AudioCall" style="display:none;">';
	html += '<audio id="line-' + lineObj.LineNumber + '-remoteAudio"></audio>';
	html += '</div>';

	// In Call Buttons
	html += '<div style="text-align:center">';
	html += '<div style="margin-top:10px">';
	html +=
		'<button id="line-' +
		lineObj.LineNumber +
		'-btn-ShowDtmf" onclick="ShowDtmfMenu(this, \'' +
		lineObj.LineNumber +
		'\')" class="roundButtons inCallButtons" title="' +
		lang.show_key_pad +
		'"><i class="fa fa-keyboard-o"></i></button>';
	html +=
		'<button id="line-' +
		lineObj.LineNumber +
		'-btn-Mute" onclick="MuteSession(\'' +
		lineObj.LineNumber +
		'\')" class="roundButtons inCallButtons" title="' +
		lang.mute +
		'"><i class="fa fa-microphone-slash"></i></button>';
	html +=
		'<button id="line-' +
		lineObj.LineNumber +
		'-btn-Unmute" onclick="UnmuteSession(\'' +
		lineObj.LineNumber +
		'\')" class="roundButtons inCallButtons" title="' +
		lang.unmute +
		'" style="color: red; display:none"><i class="fa fa-microphone"></i></button>';
	if (
		typeof MediaRecorder != 'undefined' &&
		(CallRecordingPolicy == 'allow' || CallRecordingPolicy == 'enabled')
	) {
		// Safari: must enable in Develop > Experimental Features > MediaRecorder
		html +=
			'<button id="line-' +
			lineObj.LineNumber +
			'-btn-start-recording" onclick="StartRecording(\'' +
			lineObj.LineNumber +
			'\')" class="roundButtons inCallButtons" title="' +
			lang.start_call_recording +
			'"><i class="fa fa-dot-circle-o"></i></button>';
		html +=
			'<button id="line-' +
			lineObj.LineNumber +
			'-btn-stop-recording" onclick="StopRecording(\'' +
			lineObj.LineNumber +
			'\')" class="roundButtons inCallButtons" title="' +
			lang.stop_call_recording +
			'" style="color: red; display:none"><i class="fa fa-circle"></i></button>';
	}
	if (EnableTransfer) {
		html +=
			'<button id="line-' +
			lineObj.LineNumber +
			'-btn-Transfer" onclick="StartTransferSession(\'' +
			lineObj.LineNumber +
			'\')" class="roundButtons inCallButtons" title="' +
			lang.transfer_call +
			'"><i class="fa fa-reply" style="transform: rotateY(180deg)"></i></button>';
		html +=
			'<button id="line-' +
			lineObj.LineNumber +
			'-btn-CancelTransfer" onclick="CancelTransferSession(\'' +
			lineObj.LineNumber +
			'\')" class="roundButtons inCallButtons" title="' +
			lang.cancel_transfer +
			'" style="color: red; display:none"><i class="fa fa-reply" style="transform: rotateY(180deg)"></i></button>';
	}
	if (EnableConference) {
		html +=
			'<button id="line-' +
			lineObj.LineNumber +
			'-btn-Conference" onclick="StartConferenceCall(\'' +
			lineObj.LineNumber +
			'\')" class="roundButtons inCallButtons" title="' +
			lang.conference_call +
			'"><i class="fa fa-users"></i></button>';
		html +=
			'<button id="line-' +
			lineObj.LineNumber +
			'-btn-CancelConference" onclick="CancelConference(\'' +
			lineObj.LineNumber +
			'\')" class="roundButtons inCallButtons" title="' +
			lang.cancel_conference +
			'" style="color: red; display:none"><i class="fa fa-users"></i></button>';
	}
	html +=
		'<button id="line-' +
		lineObj.LineNumber +
		'-btn-Hold" onclick="holdSession(\'' +
		lineObj.LineNumber +
		'\')" class="roundButtons inCallButtons"  title="' +
		lang.hold_call +
		'"><i class="fa fa-pause-circle"></i></button>';
	html +=
		'<button id="line-' +
		lineObj.LineNumber +
		'-btn-Unhold" onclick="unholdSession(\'' +
		lineObj.LineNumber +
		'\')" class="roundButtons inCallButtons" title="' +
		lang.resume_call +
		'" style="color: red; display:none"><i class="fa fa-play-circle"></i></button>';
	html +=
		'<button id="line-' +
		lineObj.LineNumber +
		'-btn-End" onclick="endSession(\'' +
		lineObj.LineNumber +
		'\')" class="roundButtons inCallButtons hangupButton" title="' +
		lang.end_call +
		'"><i class="fa fa-phone" style="transform: rotate(135deg);"></i></button>';
	html += '</div>';
	// Call Transfer
	html +=
		'<div id="line-' + lineObj.LineNumber + '-Transfer" style="display:none">';
	html += '<div style="margin-top:10px">';
	html +=
		'<span class=searchClean><input id="line-' +
		lineObj.LineNumber +
		'-txt-FindTransferBuddy" oninput="QuickFindBuddy(this,\'' +
		lineObj.LineNumber +
		'\')" type=text autocomplete=none style="width:150px;" autocomplete=none placeholder="' +
		lang.search_or_enter_number +
		'"></span>';
	html +=
		' <button id="line-' +
		lineObj.LineNumber +
		'-btn-blind-transfer" onclick="BlindTransfer(\'' +
		lineObj.LineNumber +
		'\')"><i class="fa fa-reply" style="transform: rotateY(180deg)"></i> ' +
		lang.blind_transfer +
		'</button>';
	html +=
		' <button id="line-' +
		lineObj.LineNumber +
		'-btn-attended-transfer" onclick="AttendedTransfer(\'' +
		lineObj.LineNumber +
		'\')"><i class="fa fa-reply-all" style="transform: rotateY(180deg)"></i> ' +
		lang.attended_transfer +
		'</button>';
	html +=
		' <button id="line-' +
		lineObj.LineNumber +
		'-btn-complete-attended-transfer" style="display:none"><i class="fa fa-reply-all" style="transform: rotateY(180deg)"></i> ' +
		lang.complete_transfer +
		'</buuton>';
	html +=
		' <button id="line-' +
		lineObj.LineNumber +
		'-btn-cancel-attended-transfer" style="display:none"><i class="fa fa-phone" style="transform: rotate(135deg);"></i> ' +
		lang.cancel_transfer +
		'</buuton>';
	html +=
		' <button id="line-' +
		lineObj.LineNumber +
		'-btn-terminate-attended-transfer" style="display:none"><i class="fa fa-phone" style="transform: rotate(135deg);"></i> ' +
		lang.end_transfer_call +
		'</buuton>';
	html += '</div>';
	html +=
		'<div id="line-' +
		lineObj.LineNumber +
		'-transfer-status" class=callStatus style="margin-top:10px; display:none">...</div>';
	html +=
		'<audio id="line-' +
		lineObj.LineNumber +
		'-transfer-remoteAudio" style="display:none"></audio>';
	html += '</div>';
	// Call Conference
	html +=
		'<div id="line-' +
		lineObj.LineNumber +
		'-Conference" style="display:none">';
	html += '<div style="margin-top:10px">';
	html +=
		'<span class=searchClean><input id="line-' +
		lineObj.LineNumber +
		'-txt-FindConferenceBuddy" oninput="QuickFindBuddy(this,\'' +
		lineObj.LineNumber +
		'\')" type=text autocomplete=none style="width:150px;" autocomplete=none placeholder="' +
		lang.search_or_enter_number +
		'"></span>';
	html +=
		' <button id="line-' +
		lineObj.LineNumber +
		'-btn-conference-dial" onclick="ConferenceDail(\'' +
		lineObj.LineNumber +
		'\')"><i class="fa fa-phone"></i> ' +
		lang.call +
		'</button>';
	html +=
		' <button id="line-' +
		lineObj.LineNumber +
		'-btn-cancel-conference-dial" style="display:none"><i class="fa fa-phone" style="transform: rotate(135deg);"></i> ' +
		lang.cancel_call +
		'</buuton>';
	html +=
		' <button id="line-' +
		lineObj.LineNumber +
		'-btn-join-conference-call" style="display:none"><i class="fa fa-users"></i> ' +
		lang.join_conference_call +
		'</buuton>';
	html +=
		' <button id="line-' +
		lineObj.LineNumber +
		'-btn-terminate-conference-call" style="display:none"><i class="fa fa-phone" style="transform: rotate(135deg);"></i> ' +
		lang.end_conference_call +
		'</buuton>';
	html += '</div>';
	html +=
		'<div id="line-' +
		lineObj.LineNumber +
		'-conference-status" class=callStatus style="margin-top:10px; display:none">...</div>';
	html +=
		'<audio id="line-' +
		lineObj.LineNumber +
		'-conference-remoteAudio" style="display:none"></audio>';
	html += '</div>';

	// Monitoring
	html +=
		'<div  id="line-' +
		lineObj.LineNumber +
		'-monitoring" style="margin-top:10px">';
	html +=
		'<span style="vertical-align: middle"><i class="fa fa-microphone"></i></span> ';
	html += '<span class=meterContainer title="' + lang.microphone_levels + '">';
	html +=
		'<span id="line-' +
		lineObj.LineNumber +
		'-Mic" class=meterLevel style="height:0%"></span>';
	html += '</span> ';
	html +=
		'<span style="vertical-align: middle"><i class="fa fa-volume-up"></i></span> ';
	html += '<span class=meterContainer title="' + lang.speaker_levels + '">';
	html +=
		'<span id="line-' +
		lineObj.LineNumber +
		'-Speaker" class=meterLevel style="height:0%"></span>';
	html += '</span> ';
	html +=
		'<button id="line-' +
		lineObj.LineNumber +
		'-btn-settings" onclick="ChangeSettings(\'' +
		lineObj.LineNumber +
		'\', this)"><i class="fa fa-cogs"></i> ' +
		lang.device_settings +
		'</button>';
	html +=
		'<button id="line-' +
		lineObj.LineNumber +
		'-call-stats" onclick="ShowCallStats(\'' +
		lineObj.LineNumber +
		'\', this)"><i class="fa fa-area-chart"></i> ' +
		lang.call_stats +
		'</button>';
	html += '</div>';

	html +=
		'<div id="line-' +
		lineObj.LineNumber +
		'-AdioStats" class="audioStats cleanScroller" style="display:none">';
	html +=
		'<div style="text-align:right"><button onclick="HideCallStats(\'' +
		lineObj.LineNumber +
		'\', this)"><i class="fa fa-times"></i></button></div>';
	html += '<fieldset class=audioStatsSet>';
	html += '<legend>' + lang.send_statistics + '</legend>';
	html +=
		'<canvas id="line-' +
		lineObj.LineNumber +
		'-AudioSendBitRate" class=audioGraph width=600 height=160 style="width:600px; height:160px"></canvas>';
	html +=
		'<canvas id="line-' +
		lineObj.LineNumber +
		'-AudioSendPacketRate" class=audioGraph width=600 height=160 style="width:600px; height:160px"></canvas>';
	html += '</fieldset>';
	html += '<fieldset class=audioStatsSet>';
	html += '<legend>' + lang.receive_statistics + '</legend>';
	html +=
		'<canvas id="line-' +
		lineObj.LineNumber +
		'-AudioReceiveBitRate" class=audioGraph width=600 height=160 style="width:600px; height:160px"></canvas>';
	html +=
		'<canvas id="line-' +
		lineObj.LineNumber +
		'-AudioReceivePacketRate" class=audioGraph width=600 height=160 style="width:600px; height:160px"></canvas>';
	html +=
		'<canvas id="line-' +
		lineObj.LineNumber +
		'-AudioReceivePacketLoss" class=audioGraph width=600 height=160 style="width:600px; height:160px"></canvas>';
	html +=
		'<canvas id="line-' +
		lineObj.LineNumber +
		'-AudioReceiveJitter" class=audioGraph width=600 height=160 style="width:600px; height:160px"></canvas>';
	html +=
		'<canvas id="line-' +
		lineObj.LineNumber +
		'-AudioReceiveLevels" class=audioGraph width=600 height=160 style="width:600px; height:160px"></canvas>';
	html += '</fieldset>';
	html += '</div>';

	html += '</div>';
	html += '</div>';
	html += '</div>';

	html += '</td></tr>';
	html +=
		'<tr><td class="streamSection streamSectionBackground" style="background-image:url(\'' +
		hostingPrefex +
		'../SIPML5Content/wp_1.png\')">';

	html +=
		'<div id="line-' +
		lineObj.LineNumber +
		'-CallDetails" class="chatHistory cleanScroller">';
	// In Call Activity
	html += '</div>';

	html += '</td></tr>';
	html += '</table>';

	$('#rightContent').append(html);
}
function RemoveLine(lineObj) {
	if (lineObj == null) return;

	for (var l = 0; l < Lines.length; l++) {
		if (Lines[l].LineNumber == lineObj.LineNumber) {
			Lines.splice(l, 1);
			break;
		}
	}

	CloseLine(lineObj.LineNumber);
	$('#line-ui-' + lineObj.LineNumber).remove();

	UpdateBuddyList();

	// Ratehr than showing nothing, go to the last Buddy Selected
	// Select Last user
	if (localDB.getItem('SelectedBuddy') != null) {
		console.log(
			'Selecting previously selected buddy...',
			localDB.getItem('SelectedBuddy')
		);
		SelectBuddy(localDB.getItem('SelectedBuddy'));
		UpdateUI();
	}
}
function CloseLine(lineNum) {
	// Lines and Buddies (Left)
	$('.buddySelected').each(function () {
		$(this).prop('class', 'buddy');
	});
	// Streams (Right)
	$('.streamSelected').each(function () {
		$(this).prop('class', 'stream');
	});

	SwitchLines(0);

	console.log('Closing Line: ' + lineNum);
	for (var l = 0; l < Lines.length; l++) {
		Lines[l].IsSelected = false;
	}
	selectedLine = null;
	for (var b = 0; b < Buddies.length; b++) {
		Buddies[b].IsSelected = false;
	}
	selectedBuddy = null;

	// Save Selected
	// localDB.setItem("SelectedBuddy", null);

	// Change to Stream if in Narrow view
	UpdateUI();
}
function SwitchLines(lineNum) {
	$.each(userAgent.sessions, function (i, session) {
		// All the other calls, not on hold
		if (session.local_hold == false && session.data.line != lineNum) {
			console.log(
				'Putting an active call on hold: Line: ' +
					session.data.line +
					' buddy: ' +
					session.data.buddyId
			);
			session.hold(); // Check state

			// Log Hold
			if (!session.data.hold) session.data.hold = [];
			session.data.hold.push({ event: 'hold', eventTime: utcDateNow() });
		}
		$('#line-' + session.data.line + '-btn-Hold').hide();
		$('#line-' + session.data.line + '-btn-Unhold').show();
		session.data.IsCurrentCall = false;
	});

	var lineObj = FindLineByNumber(lineNum);
	if (lineObj != null && lineObj.SipSession != null) {
		var session = lineObj.SipSession;
		if (session.local_hold == true) {
			console.log(
				'Taking call off hold:  Line: ' +
					lineNum +
					' buddy: ' +
					session.data.buddyId
			);
			session.unhold();

			// Log Hold
			if (!session.data.hold) session.data.hold = [];
			session.data.hold.push({ event: 'unhold', eventTime: utcDateNow() });
		}
		$('#line-' + lineNum + '-btn-Hold').show();
		$('#line-' + lineNum + '-btn-Unhold').hide();
		session.data.IsCurrentCall = true;
	}
	selectedLine = lineNum;

	RefreshLineActivity(lineNum);
}
function RefreshLineActivity(lineNum) {
	var lineObj = FindLineByNumber(lineNum);
	if (lineObj == null || lineObj.SipSession == null) {
		return;
	}
	var session = lineObj.SipSession;

	$('#line-' + lineNum + '-CallDetails').empty();

	var callDetails = [];

	var ringTime = 0;
	var CallStart = moment.utc(session.data.callstart.replace(' UTC', ''));
	var CallAnswer = null;
	if (session.startTime) {
		CallAnswer = moment.utc(session.startTime);
		ringTime = moment.duration(CallAnswer.diff(CallStart));
	}
	CallStart = CallStart.format('YYYY-MM-DD HH:mm:ss UTC');
	(CallAnswer = CallAnswer
		? CallAnswer.format('YYYY-MM-DD HH:mm:ss UTC')
		: null),
		(ringTime = ringTime != 0 ? ringTime.asSeconds() : 0);

	var srcCallerID = '';
	var dstCallerID = '';
	if (session.data.calldirection == 'inbound') {
		srcCallerID =
			'<' +
			session.remoteIdentity.uri.user +
			'> ' +
			session.remoteIdentity.displayName;
	} else if (session.data.calldirection == 'outbound') {
		dstCallerID = session.remoteIdentity.uri.user;
	}

	var withVideo = session.data.withvideo ? '(' + lang.with_video + ')' : '';
	var startCallMessage =
		session.data.calldirection == 'inbound'
			? lang.you_received_a_call_from + ' ' + srcCallerID + ' ' + withVideo
			: lang.you_made_a_call_to + ' ' + dstCallerID + ' ' + withVideo;
	callDetails.push({
		Message: startCallMessage,
		TimeStr: CallStart,
	});
	if (CallAnswer) {
		var answerCallMessage =
			session.data.calldirection == 'inbound'
				? lang.you_answered_after + ' ' + ringTime + ' ' + lang.seconds_plural
				: lang.they_answered_after + ' ' + ringTime + ' ' + lang.seconds_plural;
		callDetails.push({
			Message: answerCallMessage,
			TimeStr: CallAnswer,
		});
	}

	var Transfers = session.data.transfer ? session.data.transfer : [];
	$.each(Transfers, function (item, transfer) {
		var msg =
			transfer.type == 'Blind'
				? lang.you_started_a_blind_transfer_to + ' ' + transfer.to + '. '
				: lang.you_started_an_attended_transfer_to + ' ' + transfer.to + '. ';
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
	var Mutes = session.data.mute ? session.data.mute : [];
	$.each(Mutes, function (item, mute) {
		callDetails.push({
			Message:
				mute.event == 'mute'
					? lang.you_put_the_call_on_mute
					: lang.you_took_the_call_off_mute,
			TimeStr: mute.eventTime,
		});
	});
	var Holds = session.data.hold ? session.data.hold : [];
	$.each(Holds, function (item, hold) {
		callDetails.push({
			Message:
				hold.event == 'hold'
					? lang.you_put_the_call_on_hold
					: lang.you_took_the_call_off_hold,
			TimeStr: hold.eventTime,
		});
	});
	var Recordings = session.data.recordings ? session.data.recordings : [];
	$.each(Recordings, function (item, recording) {
		var msg = lang.call_is_being_recorded;
		if (recording.startTime != recording.stopTime) {
			msg += '(' + lang.now_stopped + ')';
		}
		callDetails.push({
			Message: msg,
			TimeStr: recording.startTime,
		});
	});
	var ConfCalls = session.data.confcalls ? session.data.confcalls : [];
	$.each(ConfCalls, function (item, confCall) {
		var msg = lang.you_started_a_conference_call_to + ' ' + confCall.to + '. ';
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

	callDetails.sort(function (a, b) {
		var aMo = moment.utc(a.TimeStr.replace(' UTC', ''));
		var bMo = moment.utc(b.TimeStr.replace(' UTC', ''));
		if (aMo.isSameOrAfter(bMo, 'second')) {
			return -1;
		} else return 1;
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
			'<div class=timelineMessageDate><i class="fa fa-circle timelineMessageDot"></i>' +
			Time +
			'</div>';
		messageString +=
			'<div class=timelineMessageText>' + detail.Message + '</div>';
		messageString += '</td>';
		messageString += '</tr></table>';
		$('#line-' + lineNum + '-CallDetails').prepend(messageString);
	});
}
