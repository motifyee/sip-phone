// Buddy & Contacts
// ================
var Buddy = function (
	type,
	identity,
	CallerIDName,
	ExtNo,
	MobileNumber,
	ContactNumber1,
	ContactNumber2,
	lastActivity,
	desc,
	Email
) {
	this.type = type; // extension | contact | group
	this.identity = identity;
	this.CallerIDName = CallerIDName;
	this.Email = Email;
	this.Desc = desc;
	this.ExtNo = ExtNo;
	this.MobileNumber = MobileNumber;
	this.ContactNumber1 = ContactNumber1;
	this.ContactNumber2 = ContactNumber2;
	this.lastActivity = lastActivity; // Full Date as string eg "1208-03-21 15:34:23 UTC"
	this.devState = 'dotOffline';
	this.presence = 'Unknown';
	this.missed = 0;
	this.IsSelected = false;
	this.imageObjectURL = '';
};
function InitUserBuddies() {
	var template = { TotalRows: 0, DataCollection: [] };
	localDB.setItem(profileUserID + '-Buddies', JSON.stringify(template));
	return JSON.parse(localDB.getItem(profileUserID + '-Buddies'));
}
function MakeBuddy(type, update, focus, subscribe, callerID, did) {
	var json = JSON.parse(localDB.getItem(profileUserID + '-Buddies'));
	if (json == null) json = InitUserBuddies();

	var buddyObj = null;
	if (type == 'contact') {
		var id = uID();
		var dateNow = utcDateNow();
		json.DataCollection.push({
			Type: 'contact',
			LastActivity: dateNow,
			ExtensionNumber: '',
			MobileNumber: '',
			ContactNumber1: did,
			ContactNumber2: '',
			uID: null,
			cID: id,
			gID: null,
			DisplayName: callerID,
			Position: '',
			Description: '',
			Email: '',
			MemberCount: 0,
		});
		buddyObj = new Buddy(
			'contact',
			id,
			callerID,
			'',
			'',
			did,
			'',
			dateNow,
			'',
			''
		);
		AddBuddy(buddyObj, update, focus);
	} else {
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
		AddBuddy(buddyObj, update, focus, subscribe);
	}
	// Update Size:
	json.TotalRows = json.DataCollection.length;

	// Save To DB
	localDB.setItem(profileUserID + '-Buddies', JSON.stringify(json));

	// Return new buddy
	return buddyObj;
}
function UpdateBuddyCalerID(buddyObj, callerID) {
	buddyObj.CallerIDName = callerID;

	var buddy = buddyObj.identity;
	// Update DB
	var json = JSON.parse(localDB.getItem(profileUserID + '-Buddies'));
	if (json != null) {
		$.each(json.DataCollection, function (i, item) {
			if (item.uID == buddy || item.cID == buddy || item.gID == buddy) {
				item.DisplayName = callerID;
				return false;
			}
		});
		// Save To DB
		localDB.setItem(profileUserID + '-Buddies', JSON.stringify(json));
	}

	UpdateBuddyList();
}
function AddBuddy(buddyObj, update, focus, subscribe) {
	Buddies.push(buddyObj);
	if (update == true) UpdateBuddyList();
	AddBuddyMessageStream(buddyObj);
	if (subscribe == true) SubscribeBuddy(buddyObj);
	if (focus == true) SelectBuddy(buddyObj.identity);
}
function PopulateBuddyList() {
	console.log('Clearing Buddies...');
	Buddies = new Array();
	console.log('Adding Buddies...');
	var json = JSON.parse(localDB.getItem(profileUserID + '-Buddies'));
	if (json == null) return;

	console.log('Total Buddies: ' + json.TotalRows);
	$.each(json.DataCollection, function (i, item) {
		if (item.Type == 'extension') {
			// extension
			var buddy = new Buddy(
				'extension',
				item.uID,
				item.DisplayName,
				item.ExtensionNumber,
				item.MobileNumber,
				item.ContactNumber1,
				item.ContactNumber2,
				item.LastActivity,
				item.Position,
				item.Email
			);
			AddBuddy(buddy, false, false);
		} else if (item.Type == 'contact') {
			// contact
			var buddy = new Buddy(
				'contact',
				item.cID,
				item.DisplayName,
				'',
				item.MobileNumber,
				item.ContactNumber1,
				item.ContactNumber2,
				item.LastActivity,
				item.Description,
				item.Email
			);
			AddBuddy(buddy, false, false);
		} else if (item.Type == 'group') {
			// group
			var buddy = new Buddy(
				'group',
				item.gID,
				item.DisplayName,
				item.ExtensionNumber,
				'',
				'',
				'',
				item.LastActivity,
				item.MemberCount + ' member(s)',
				item.Email
			);
			AddBuddy(buddy, false, false);
		}
	});

	// Update List (after add)
	console.log('Updating Buddy List...');
	UpdateBuddyList();
}
function UpdateBuddyList() {
	var filter = $('#txtFindBuddy').val();

	$('#myContacts').empty();

	for (var l = 0; l < Lines.length; l++) {
		var classStr = Lines[l].IsSelected ? 'buddySelected' : 'buddy';
		if (Lines[l].SipSession != null)
			classStr = Lines[l].SipSession.local_hold
				? 'buddyActiveCallHollding'
				: 'buddyActiveCall';

		var html =
			'<div id="line-' +
			Lines[l].LineNumber +
			'" class=' +
			classStr +
			' onclick="SelectLine(\'' +
			Lines[l].LineNumber +
			'\')">';
		html += '<div class=lineIcon>' + Lines[l].LineNumber + '</div>';
		html +=
			'<div class=contactNameText><i class="fa fa-phone"></i> ' +
			lang.line +
			' ' +
			Lines[l].LineNumber +
			'</div>';
		html +=
			'<div id="Line-' +
			Lines[l].ExtNo +
			'-datetime" class=contactDate>&nbsp;</div>';
		html +=
			'<div class=presenceText>' +
			Lines[l].DisplayName +
			' <' +
			Lines[l].DisplayNumber +
			'>' +
			'</div>';
		html += '</div>';
		$('#myContacts').append(html);
	}

	if ((Lines.length > 0) & (Buddies.length > 0)) {
		$('#myContacts').append(
			'<hr style="height:1px; background-color:#696969">'
		);
	}

	// Sort and shuffle Buddy List
	// ===========================
	Buddies.sort(function (a, b) {
		var aMo = moment.utc(a.lastActivity.replace(' UTC', ''));
		var bMo = moment.utc(b.lastActivity.replace(' UTC', ''));
		if (aMo.isSameOrAfter(bMo, 'second')) {
			return -1;
		} else return 1;
	});

	for (var b = 0; b < Buddies.length; b++) {
		var buddyObj = Buddies[b];

		if (filter && filter.length >= 1) {
			// Perform Filter Display
			var display = false;
			if (
				buddyObj.CallerIDName.toLowerCase().indexOf(filter.toLowerCase()) > -1
			)
				display = true;
			if (buddyObj.ExtNo.toLowerCase().indexOf(filter.toLowerCase()) > -1)
				display = true;
			if (buddyObj.Desc.toLowerCase().indexOf(filter.toLowerCase()) > -1)
				display = true;
			if (!display) continue;
		}

		var today = moment.utc();
		var lastActivity = moment.utc(buddyObj.lastActivity.replace(' UTC', ''));
		var displayDateTime = '';
		if (lastActivity.isSame(today, 'day')) {
			displayDateTime = lastActivity.local().format(DisplayTimeFormat);
		} else {
			displayDateTime = lastActivity.local().format(DisplayDateFormat);
		}

		var classStr = buddyObj.IsSelected ? 'buddySelected' : 'buddy';
		if (buddyObj.type == 'extension') {
			var friendlyState = buddyObj.presence;
			if (friendlyState == 'Unknown') friendlyState = lang.state_unknown;
			if (friendlyState == 'Not online') friendlyState = lang.state_not_online;
			if (friendlyState == 'Ready') friendlyState = lang.state_ready;
			if (friendlyState == 'On the phone')
				friendlyState = lang.state_on_the_phone;
			if (friendlyState == 'Ringing') friendlyState = lang.state_ringing;
			if (friendlyState == 'On hold') friendlyState = lang.state_on_hold;
			if (friendlyState == 'Unavailable')
				friendlyState = lang.state_unavailable;

			// An extension on the same system
			var html =
				'<div id="contact-' +
				buddyObj.identity +
				'" class=' +
				classStr +
				' onmouseenter="ShowBuddyDial(this, \'' +
				buddyObj.identity +
				'\')" onmouseleave="HideBuddyDial(this, \'' +
				buddyObj.identity +
				'\')" onclick="SelectBuddy(\'' +
				buddyObj.identity +
				"', 'extension')\">";
			html +=
				'<span id="contact-' +
				buddyObj.identity +
				'-devstate" class="' +
				buddyObj.devState +
				'"></span>';
			if (EnableVideoCalling) {
				html +=
					'<span id="contact-' +
					buddyObj.identity +
					'-audio-dial" class=quickDial style="right: 44px; display:none" title=' +
					lang.audio_call +
					' onclick="QuickDialAudio(\'' +
					buddyObj.identity +
					'\', this, event)"><i class="fa fa-phone"></i></span>';
				html +=
					'<span id="contact-' +
					buddyObj.identity +
					'-video-dial" class=quickDial style="right: 23px; display:none" title=' +
					lang.video_call +
					' onclick="QuickDialVideo(\'' +
					buddyObj.identity +
					"', '" +
					buddyObj.ExtNo +
					'\', event)"><i class="fa fa-video-camera"></i></span>';
			} else {
				html +=
					'<span id="contact-' +
					buddyObj.identity +
					'-audio-dial" class=quickDial style="right: 23px; display:none" title=' +
					lang.audio_call +
					' onclick="QuickDialAudio(\'' +
					buddyObj.identity +
					'\', this, event)"><i class="fa fa-phone"></i></span>';
			}
			html +=
				'<span id="contact-' +
				buddyObj.identity +
				'-missed" class=missedNotifyer style="display:none">' +
				buddyObj.missed +
				'</span>';
			html +=
				'<div class=buddyIcon style="background-image: url(\'' +
				getPicture(buddyObj.identity) +
				'\')"></div>';
			html +=
				'<div class=contactNameText><i class="fa fa-phone-square"></i> ' +
				buddyObj.ExtNo +
				' - ' +
				buddyObj.CallerIDName +
				'</div>';
			html +=
				'<div id="contact-' +
				buddyObj.identity +
				'-datetime" class=contactDate>' +
				displayDateTime +
				'</div>';
			html +=
				'<div id="contact-' +
				buddyObj.identity +
				'-presence" class=presenceText>' +
				friendlyState +
				'</div>';
			html += '</div>';
			$('#myContacts').append(html);
		} else if (buddyObj.type == 'contact') {
			// An Addressbook Contact
			var html =
				'<div id="contact-' +
				buddyObj.identity +
				'" class=' +
				classStr +
				' onmouseenter="ShowBuddyDial(this, \'' +
				buddyObj.identity +
				'\')" onmouseleave="HideBuddyDial(this, \'' +
				buddyObj.identity +
				'\')" onclick="SelectBuddy(\'' +
				buddyObj.identity +
				"', 'contact')\">";
			html +=
				'<span id="contact-' +
				buddyObj.identity +
				'-audio-dial" class=quickDial style="right: 23px; display:none" title=' +
				lang.audio_call +
				' onclick="QuickDialAudio(\'' +
				buddyObj.identity +
				'\', this, event)"><i class="fa fa-phone"></i></span>';
			html +=
				'<span id="contact-' +
				buddyObj.identity +
				'-missed" class=missedNotifyer style="display:none">0</span>';
			html +=
				'<div class=buddyIcon style="background-image: url(\'' +
				getPicture(buddyObj.identity, 'contact') +
				'\')"></div>';
			html +=
				'<div class=contactNameText><i class="fa fa-address-card"></i> ' +
				buddyObj.CallerIDName +
				'</div>';
			html +=
				'<div id="contact-' +
				buddyObj.identity +
				'-datetime" class=contactDate>' +
				displayDateTime +
				'</div>';
			html += '<div class=presenceText>' + buddyObj.Desc + '</div>';
			html += '</div>';
			$('#myContacts').append(html);
		} else if (buddyObj.type == 'group') {
			// A collection of extensions and contacts
			var html =
				'<div id="contact-' +
				buddyObj.identity +
				'" class=' +
				classStr +
				' onmouseenter="ShowBuddyDial(this, \'' +
				buddyObj.identity +
				'\')" onmouseleave="HideBuddyDial(this, \'' +
				buddyObj.identity +
				'\')" onclick="SelectBuddy(\'' +
				buddyObj.identity +
				"', 'group')\">";
			html +=
				'<span id="contact-' +
				buddyObj.identity +
				'-audio-dial" class=quickDial style="right: 23px; display:none" title=' +
				lang.audio_call +
				' onclick="QuickDialAudio(\'' +
				buddyObj.identity +
				'\', this, event)"><i class="fa fa-phone"></i></span>';
			// html += "<span id=\"contact-"+ buddyObj.identity +"-video-dial\" class=quickDial style=\"right: 23px; display:none\" title="+ lang.video_call +"><i class=\"fa fa-video-camera\"></i></span>";
			html +=
				'<span id="contact-' +
				buddyObj.identity +
				'-missed" class=missedNotifyer style="display:none">0</span>';
			html +=
				'<div class=buddyIcon style="background-image: url(\'' +
				getPicture(buddyObj.identity, 'group') +
				'\')"></div>';
			html +=
				'<div class=contactNameText><i class="fa fa-users"></i> ' +
				buddyObj.CallerIDName +
				'</div>';
			html +=
				'<div id="contact-' +
				buddyObj.identity +
				'-datetime" class=contactDate>' +
				displayDateTime +
				'</div>';
			html += '<div class=presenceText>' + buddyObj.Desc + '</div>';
			html += '</div>';
			$('#myContacts').append(html);
		}
	}

	// Make Select
	// ===========
	for (var b = 0; b < Buddies.length; b++) {
		if (Buddies[b].IsSelected) {
			SelectBuddy(Buddies[b].identity, Buddies[b].type);
			break;
		}
	}
}
function AddBuddyMessageStream(buddyObj) {
	var html =
		'<table id="stream-' +
		buddyObj.identity +
		'" class=stream cellspacing=5 cellpadding=0>';
	html += '<tr><td class=streamSection style="height: 48px;">';

	// Close|Return|Back Button
	html +=
		'<div style="float:left; margin:0px; padding:5px; height:38px; line-height:38px">';
	html +=
		'<button id="contact-' +
		buddyObj.identity +
		'-btn-back" onclick="CloseBuddy(\'' +
		buddyObj.identity +
		'\')" class=roundButtons title="' +
		lang.back +
		'"><i class="fa fa-chevron-left"></i></button> ';
	html += '</div>';

	// Profile UI
	html +=
		'<div class=contact style="float: left; position: absolute; left: 47px; right: 160px;" onclick="ShowBuddyProfileMenu(\'' +
		buddyObj.identity +
		"', this, '" +
		buddyObj.type +
		'\')">';
	if (buddyObj.type == 'extension') {
		html +=
			'<span id="contact-' +
			buddyObj.identity +
			'-devstate-main" class="' +
			buddyObj.devState +
			'"></span>';
	}

	if (buddyObj.type == 'extension') {
		html +=
			'<div id="contact-' +
			buddyObj.identity +
			'-picture-main" class=buddyIcon style="background-image: url(\'' +
			getPicture(buddyObj.identity) +
			'\')"></div>';
	} else if (buddyObj.type == 'contact') {
		html +=
			'<div class=buddyIcon style="background-image: url(\'' +
			getPicture(buddyObj.identity, 'contact') +
			'\')"></div>';
	} else if (buddyObj.type == 'group') {
		html +=
			'<div class=buddyIcon style="background-image: url(\'' +
			getPicture(buddyObj.identity, 'group') +
			'\')"></div>';
	}

	if (buddyObj.type == 'extension') {
		html +=
			'<div class=contactNameText style="margin-right: 0px;"><i class="fa fa-phone-square"></i> ' +
			buddyObj.ExtNo +
			' - ' +
			buddyObj.CallerIDName +
			'</div>';
	} else if (buddyObj.type == 'contact') {
		html +=
			'<div class=contactNameText style="margin-right: 0px;"><i class="fa fa-address-card"></i> ' +
			buddyObj.CallerIDName +
			'</div>';
	} else if (buddyObj.type == 'group') {
		html +=
			'<div class=contactNameText style="margin-right: 0px;"><i class="fa fa-users"></i> ' +
			buddyObj.CallerIDName +
			'</div>';
	}
	if (buddyObj.type == 'extension') {
		var friendlyState = buddyObj.presence;
		if (friendlyState == 'Unknown') friendlyState = lang.state_unknown;
		if (friendlyState == 'Not online') friendlyState = lang.state_not_online;
		if (friendlyState == 'Ready') friendlyState = lang.state_ready;
		if (friendlyState == 'On the phone')
			friendlyState = lang.state_on_the_phone;
		if (friendlyState == 'Ringing') friendlyState = lang.state_ringing;
		if (friendlyState == 'On hold') friendlyState = lang.state_on_hold;
		if (friendlyState == 'Unavailable') friendlyState = lang.state_unavailable;

		html +=
			'<div id="contact-' +
			buddyObj.identity +
			'-presence-main" class=presenceText>' +
			friendlyState +
			'</div>';
	} else {
		html +=
			'<div id="contact-' +
			buddyObj.identity +
			'-presence-main" class=presenceText>' +
			buddyObj.Desc +
			'</div>';
	}
	html += '</div>';

	// Action Buttons
	html += '<div style="float:right; line-height: 46px;">';
	html +=
		'<button id="contact-' +
		buddyObj.identity +
		'-btn-audioCall" onclick="AudioCallMenu(\'' +
		buddyObj.identity +
		'\', this)" class=roundButtons title="' +
		lang.audio_call +
		'"><i class="fa fa-phone"></i></button> ';
	if (buddyObj.type == 'extension' && EnableVideoCalling) {
		html +=
			'<button id="contact-' +
			buddyObj.identity +
			"-btn-videoCall\" onclick=\"DialByLine('video', '" +
			buddyObj.identity +
			"', '" +
			buddyObj.ExtNo +
			'\');" class=roundButtons title="' +
			lang.video_call +
			'"><i class="fa fa-video-camera"></i></button> ';
	}
	html +=
		'<button id="contact-' +
		buddyObj.identity +
		'-btn-search" onclick="FindSomething(\'' +
		buddyObj.identity +
		'\')" class=roundButtons title="' +
		lang.find_something +
		'"><i class="fa fa-search"></i></button> ';
	html +=
		'<button id="contact-' +
		buddyObj.identity +
		'-btn-remove" onclick="RemoveBuddy(\'' +
		buddyObj.identity +
		'\')" class=roundButtons title="' +
		lang.remove +
		'"><i class="fa fa-trash"></i></button> ';
	html += '</div>';

	// Separator --------------------------------------------------------------------------
	html += '<div style="clear:both; height:0px"></div>';

	// Calling UI --------------------------------------------------------------------------
	html += '<div id="contact-' + buddyObj.identity + '-calling">';

	// Gneral Messages
	html +=
		'<div id="contact-' +
		buddyObj.identity +
		'-timer" style="float: right; margin-top: 5px; margin-right: 10px; display:none;"></div>';
	html +=
		'<div id="contact-' +
		buddyObj.identity +
		'-msg" class=callStatus style="display:none">...</div>';

	// Call Answer UI
	html +=
		'<div id="contact-' +
		buddyObj.identity +
		'-AnswerCall" class=answerCall style="display:none">';
	html += '<div>';
	html +=
		'<button onclick="AnswerAudioCall(\'' +
		buddyObj.identity +
		'\')" class=answerButton><i class="fa fa-phone"></i> ' +
		lang.answer_call +
		'</button> ';
	if (buddyObj.type == 'extension' && EnableVideoCalling) {
		html +=
			'<button id="contact-' +
			buddyObj.identity +
			'-answer-video" onclick="AnswerVideoCall(\'' +
			buddyObj.identity +
			'\')" class=answerButton><i class="fa fa-video-camera"></i> ' +
			lang.answer_call_with_video +
			'</button> ';
	}
	html +=
		'<button onclick="RejectCall(\'' +
		buddyObj.identity +
		'\')" class=hangupButton><i class="fa fa-phone" style="transform: rotate(135deg);"></i> ' +
		lang.reject_call +
		'</button> ';
	html += '</div>';
	html += '</div>';

	html += '</div>';

	// Search & Related Elements
	html +=
		'<div id="contact-' +
		buddyObj.identity +
		'-search" style="margin-top:6px; display:none">';
	html +=
		'<span class=searchClean style="width:100%"><input type=text style="width:90%" autocomplete=none oninput=SearchStream(this,\'' +
		buddyObj.identity +
		'\') placeholder="' +
		lang.find_something_in_the_message_stream +
		'"></span>';
	html += '</div>';

	html += '</td></tr>';
	html +=
		'<tr><td class="streamSection streamSectionBackground" style="background-image:url(\'' +
		hostingPrefex +
		'../SIPML5Content/wp_1.png\')">';

	html +=
		'<div id="contact-' +
		buddyObj.identity +
		'-ChatHistory" class="chatHistory cleanScroller" ondragenter="setupDragDrop(event, \'' +
		buddyObj.identity +
		'\')" ondragover="setupDragDrop(event, \'' +
		buddyObj.identity +
		'\')" ondragleave="cancelDragDrop(event, \'' +
		buddyObj.identity +
		'\')" ondrop="onFileDragDrop(event, \'' +
		buddyObj.identity +
		'\')">';
	// Previous Chat messages
	html += '</div>';

	html += '</td></tr>';
	if (
		(buddyObj.type == 'extension' || buddyObj.type == 'group') &&
		EnableTextMessaging
	) {
		html += '<tr><td  class=streamSection style="height:80px">';

		// Send Paste Image
		html +=
			'<div id="contact-' +
			buddyObj.identity +
			'-imagePastePreview" class=sendImagePreview style="display:none" tabindex=0></div>';
		// Preview
		html +=
			'<div id="contact-' +
			buddyObj.identity +
			'-msgPreview" class=sendMessagePreview style="display:none">';
		html +=
			'<table class=sendMessagePreviewContainer cellpadding=0 cellspacing=0><tr>';
		html +=
			'<td style="text-align:right"><div id="contact-' +
			buddyObj.identity +
			'-msgPreviewhtml" class="sendMessagePreviewHtml cleanScroller"></div></td>';
		html +=
			'<td style="width:40px"><button onclick="SendChatMessage(\'' +
			buddyObj.identity +
			'\')" class="roundButtons" title="' +
			lang.send +
			'"><i class="fa fa-paper-plane"></i></button></td>';
		html += '</tr></table>';
		html += '</div>';

		// Send File
		html +=
			'<div id="contact-' +
			buddyObj.identity +
			'-fileShare" style="display:none">';
		html += '<input type=file multiple onchange="console.log(this)" />';
		html += '</div>';

		// Send Audio Recording
		html +=
			'<div id="contact-' +
			buddyObj.identity +
			'-audio-recording" style="display:none"></div>';

		// Send Video Recording
		html +=
			'<div id="contact-' +
			buddyObj.identity +
			'-video-recording" style="display:none"></div>';

		// Dictate Message
		html +=
			'<div id="contact-' +
			buddyObj.identity +
			'-dictate-message" style="display:none"></div>';

		// Emoji Menu Bar
		html +=
			'<div id="contact-' +
			buddyObj.identity +
			'-emoji-menu" style="display:none"></div>';

		// =====================================
		// Type Area
		html +=
			'<table class=sendMessageContainer cellpadding=0 cellspacing=0><tr>';
		html +=
			'<td><textarea id="contact-' +
			buddyObj.identity +
			'-ChatMessage" class="chatMessage cleanScroller" placeholder="' +
			lang.type_your_message_here +
			'" onkeydown="chatOnkeydown(event, this,\'' +
			buddyObj.identity +
			'\')" onkeyup="chatOnkeyup(event, this,\'' +
			buddyObj.identity +
			'\')" oninput="chatOnkeyup(event, this,\'' +
			buddyObj.identity +
			'\')" onpaste="chatOnbeforepaste(event, this,\'' +
			buddyObj.identity +
			'\')"></textarea></td>';
		html +=
			'<td style="width:40px"><button onclick="AddMenu(this, \'' +
			buddyObj.identity +
			'\')" class=roundButtons title="' +
			lang.menu +
			'"><i class="fa fa-ellipsis-h"></i></button></td>';
		html += '</tr></table>';

		html += '</td></tr>';
	}
	html += '</table>';

	$('#rightContent').append(html);
}
function RemoveBuddyMessageStream(buddyObj) {
	CloseBuddy(buddyObj.identity);

	UpdateBuddyList();

	// Remove Stream
	$('#stream-' + buddyObj.identity).remove();
	var stream = JSON.parse(localDB.getItem(buddyObj.identity + '-stream'));
	localDB.removeItem(buddyObj.identity + '-stream');

	// Remove Buddy
	var json = JSON.parse(localDB.getItem(profileUserID + '-Buddies'));
	var x = 0;
	$.each(json.DataCollection, function (i, item) {
		if (
			item.uID == buddyObj.identity ||
			item.cID == buddyObj.identity ||
			item.gID == buddyObj.identity
		) {
			x = i;
			return false;
		}
	});
	json.DataCollection.splice(x, 1);
	json.TotalRows = json.DataCollection.length;
	localDB.setItem(profileUserID + '-Buddies', JSON.stringify(json));

	// Remove Images
	localDB.removeItem('img-' + buddyObj.identity + '-extension');
	localDB.removeItem('img-' + buddyObj.identity + '-contact');
	localDB.removeItem('img-' + buddyObj.identity + '-group');

	// Remove Call Recordings
	if (stream && stream.DataCollection && stream.DataCollection.length >= 1) {
		DeleteCallRecordings(buddyObj.identity, stream);
	}

	// Remove QOS Data
	DeleteQosData(buddyObj.identity);
}
function DeleteCallRecordings(buddy, stream) {
	var indexedDB = window.indexedDB;
	var request = indexedDB.open('CallRecordings');
	request.onerror = function (event) {
		console.error('IndexDB Request Error:', event);
	};
	request.onupgradeneeded = function (event) {
		console.warn(
			'Upgrade Required for IndexDB... probably because of first time use.'
		);
		// If this is the case, there will be no call recordings
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

		// Loop and Delete
		$.each(stream.DataCollection, function (i, item) {
			if (item.Recordings && item.Recordings.length) {
				$.each(item.Recordings, function (i, recording) {
					console.log('Deleting Call Recording: ', recording.uID);
					var objectStore = IDB.transaction(
						['Recordings'],
						'readwrite'
					).objectStore('Recordings');
					try {
						var deleteRequest = objectStore.delete(recording.uID);
						deleteRequest.onsuccess = function (event) {
							console.log('Call Recording Deleted: ', recording.uID);
						};
					} catch (e) {
						console.log('Call Recording Delete failed: ', e);
					}
				});
			}
		});
	};
}

function MakeUpName() {
	var shortname = 4;
	var longName = 12;
	var letters = [
		'A',
		'B',
		'C',
		'D',
		'E',
		'F',
		'G',
		'H',
		'I',
		'J',
		'K',
		'L',
		'M',
		'N',
		'O',
		'P',
		'Q',
		'R',
		'S',
		'T',
		'U',
		'V',
		'W',
		'X',
		'Y',
		'Z',
	];
	var rtn = '';
	rtn += letters[Math.floor(Math.random() * letters.length)];
	for (var n = 0; n < Math.floor(Math.random() * longName) + shortname; n++) {
		rtn += letters[Math.floor(Math.random() * letters.length)].toLowerCase();
	}
	rtn += ' ';
	rtn += letters[Math.floor(Math.random() * letters.length)];
	for (var n = 0; n < Math.floor(Math.random() * longName) + shortname; n++) {
		rtn += letters[Math.floor(Math.random() * letters.length)].toLowerCase();
	}
	return rtn;
}
function MakeUpNumber() {
	var numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
	var rtn = '0';
	for (var n = 0; n < 9; n++) {
		rtn += numbers[Math.floor(Math.random() * numbers.length)];
	}
	return rtn;
}
function MakeUpBuddies(int) {
	for (var i = 0; i < int; i++) {
		var buddyObj = new Buddy(
			'contact',
			uID(),
			MakeUpName(),
			'',
			'',
			MakeUpNumber(),
			'',
			utcDateNow(),
			'Testing',
			''
		);
		AddBuddy(buddyObj, false, false);
	}
	UpdateBuddyList();
}

function SelectBuddy(buddy) {
	var buddyObj = FindBuddyByIdentity(buddy);
	if (buddyObj == null) return;

	for (var b = 0; b < Buddies.length; b++) {
		if (Buddies[b].IsSelected == true && Buddies[b].identity == buddy) {
			// Nothing to do, you re-selected the same buddy;
			return;
		}
	}

	console.log('Selecting Buddy: ' + buddy);

	selectedBuddy = buddyObj;

	// Can only display one thing on the Right
	$('.streamSelected').each(function () {
		$(this).prop('class', 'stream');
	});
	$('#stream-' + buddy).prop('class', 'streamSelected');

	// Update Lines List
	for (var l = 0; l < Lines.length; l++) {
		var classStr = 'buddy';
		if (Lines[l].SipSession != null)
			classStr = Lines[l].SipSession.local_hold
				? 'buddyActiveCallHollding'
				: 'buddyActiveCall';
		$('#line-' + Lines[l].LineNumber).prop('class', classStr);
		Lines[l].IsSelected = false;
	}

	ClearMissedBadge(buddy);
	// Update Buddy List
	for (var b = 0; b < Buddies.length; b++) {
		var classStr = Buddies[b].identity == buddy ? 'buddySelected' : 'buddy';
		$('#contact-' + Buddies[b].identity).prop('class', classStr);

		$('#contact-' + Buddies[b].identity + '-ChatHistory').empty();

		Buddies[b].IsSelected = Buddies[b].identity == buddy;
	}

	// Change to Stream if in Narrow view
	UpdateUI();

	// Refresh Stream
	// console.log("Refreshing Stream for you(" + profileUserID + ") and : " + buddyObj.identity);
	RefreshStream(buddyObj);

	try {
		$('#contact-' + buddy)
			.get(0)
			.scrollIntoViewIfNeeded();
	} catch (e) {}

	// Save Selected
	localDB.setItem('SelectedBuddy', buddy);
}
function CloseBuddy(buddy) {
	// Lines and Buddies (Left)
	$('.buddySelected').each(function () {
		$(this).prop('class', 'buddy');
	});
	// Streams (Right)
	$('.streamSelected').each(function () {
		$(this).prop('class', 'stream');
	});

	console.log('Closing Buddy: ' + buddy);
	for (var b = 0; b < Buddies.length; b++) {
		Buddies[b].IsSelected = false;
	}
	selectedBuddy = null;
	for (var l = 0; l < Lines.length; l++) {
		Lines[l].IsSelected = false;
	}
	selectedLine = null;

	// Save Selected
	localDB.setItem('SelectedBuddy', null);

	// Change to Stream if in Narrow view
	UpdateUI();
}
function RemoveBuddy(buddy) {
	// Check if you are on the phone etc
	Confirm(lang.confirm_remove_buddy, lang.remove_buddy, function () {
		for (var b = 0; b < Buddies.length; b++) {
			if (Buddies[b].identity == buddy) {
				RemoveBuddyMessageStream(Buddies[b]);
				UnsubscribeBuddy(Buddies[b]);
				Buddies.splice(b, 1);
				break;
			}
		}
		UpdateBuddyList();
	});
}
function FindBuddyByDid(did) {
	// Used only in Inboud
	for (var b = 0; b < Buddies.length; b++) {
		if (
			Buddies[b].ExtNo == did ||
			Buddies[b].MobileNumber == did ||
			Buddies[b].ContactNumber1 == did ||
			Buddies[b].ContactNumber2 == did
		) {
			return Buddies[b];
		}
	}
	return null;
}
function FindBuddyByExtNo(ExtNo) {
	for (var b = 0; b < Buddies.length; b++) {
		if (Buddies[b].type == 'extension' && Buddies[b].ExtNo == ExtNo)
			return Buddies[b];
	}
	return null;
}
function FindBuddyByNumber(number) {
	// Number could be: +XXXXXXXXXX
	// Any special characters must be removed prior to adding
	for (var b = 0; b < Buddies.length; b++) {
		if (
			Buddies[b].MobileNumber == number ||
			Buddies[b].ContactNumber1 == number ||
			Buddies[b].ContactNumber2 == number
		) {
			return Buddies[b];
		}
	}
	return null;
}
function FindBuddyByIdentity(identity) {
	for (var b = 0; b < Buddies.length; b++) {
		if (Buddies[b].identity == identity) return Buddies[b];
	}
	return null;
}
function SearchStream(obj, buddy) {
	var q = obj.value;

	var buddyObj = FindBuddyByIdentity(buddy);
	if (q == '') {
		console.log('Restore Stream');
		RefreshStream(buddyObj);
	} else {
		RefreshStream(buddyObj, q);
	}
}
function RefreshStream(buddyObj, filter) {
	$('#contact-' + buddyObj.identity + '-ChatHistory').empty();

	var json = JSON.parse(localDB.getItem(buddyObj.identity + '-stream'));
	if (json == null || json.DataCollection == null) return;

	// Sort DataCollection (Newest items first)
	json.DataCollection.sort(function (a, b) {
		var aMo = moment.utc(a.ItemDate.replace(' UTC', ''));
		var bMo = moment.utc(b.ItemDate.replace(' UTC', ''));
		if (aMo.isSameOrAfter(bMo, 'second')) {
			return -1;
		} else return 1;
	});

	// Filter
	if (filter && filter != '') {
		// TODO: Maybe some room for improvement here
		console.log(
			'Rows without filter (' + filter + '): ',
			json.DataCollection.length
		);
		json.DataCollection = json.DataCollection.filter(function (item) {
			if (filter.indexOf('date: ') != -1) {
				// Apply Date Filter
				var dateFilter = getFilter(filter, 'date');
				if (dateFilter != '' && item.ItemDate.indexOf(dateFilter) != -1)
					return true;
			}
			if (item.MessageData && item.MessageData.length > 1) {
				if (item.MessageData.toLowerCase().indexOf(filter.toLowerCase()) != -1)
					return true;
				if (filter.toLowerCase().indexOf(item.MessageData.toLowerCase()) != -1)
					return true;
			}
			if (item.ItemType == 'MSG') {
				// Special search??
			} else if (item.ItemType == 'CDR') {
				// Tag Search
				if (item.Tags && item.Tags.length > 1) {
					var tagFilter = getFilter(filter, 'tag');
					if (tagFilter != '') {
						if (
							item.Tags.some(function (i) {
								if (
									tagFilter.toLowerCase().indexOf(i.value.toLowerCase()) != -1
								)
									return true;
								if (
									i.value.toLowerCase().indexOf(tagFilter.toLowerCase()) != -1
								)
									return true;
								return false;
							}) == true
						)
							return true;
					}
				}
			} else if (item.ItemType == 'FILE') {
				// Not yest implemented
			} else if (item.ItemType == 'SMS') {
				// Not yest implemented
			}
			// return true to keep;
			return false;
		});
		console.log('Rows After Filter: ', json.DataCollection.length);
	}

	// Create Buffer
	if (json.DataCollection.length > StreamBuffer) {
		console.log(
			'Rows:',
			json.DataCollection.length,
			' (will be trimed to ' + StreamBuffer + ')'
		);
		// Always limit the Stream to {StreamBuffer}, users much search for messages further back
		json.DataCollection.splice(StreamBuffer);
	}

	$.each(json.DataCollection, function (i, item) {
		var IsToday = moment
			.utc(item.ItemDate.replace(' UTC', ''))
			.isSame(moment.utc(), 'day');
		var DateTime = moment
			.utc(item.ItemDate.replace(' UTC', ''))
			.local()
			.calendar(null, { sameElse: DisplayDateFormat });
		if (IsToday)
			DateTime = moment
				.utc(item.ItemDate.replace(' UTC', ''))
				.local()
				.format(DisplayTimeFormat);

		if (item.ItemType == 'MSG') {
			// Add Chat Message
			// ===================

			//Billsec: "0"
			//Dst: "sip:800"
			//DstUserId: "8D68C1D442A96B4"
			//ItemDate: "2019-05-14 09:42:15"
			//ItemId: "89"
			//ItemType: "MSG"
			//MessageData: "........."
			//Src: ""Keyla James" <100>"
			//SrcUserId: "8D68B3EFEC8D0F5"

			var deliveryStatus =
				'<i class="fa fa-question-circle-o SendingMessage"></i>';
			if (item.Sent == true)
				deliveryStatus = '<i class="fa fa-check SentMessage"></i>';
			if (item.Sent == false)
				deliveryStatus =
					'<i class="fa fa-exclamation-circle FailedMessage"></i>';
			if (item.Delivered)
				deliveryStatus += '<i class="fa fa-check DeliveredMessage"></i>';

			var formattedMessage = ReformatMessage(item.MessageData);
			var longMessage = formattedMessage.length > 1000;

			if (item.SrcUserId == profileUserID) {
				// You are the source (sending)
				var messageString =
					'<table class=ourChatMessage cellspacing=0 cellpadding=0><tr>';
				messageString +=
					'<td class=ourChatMessageText onmouseenter="ShowChatMenu(this)" onmouseleave="HideChatMenu(this)">';
				messageString +=
					"<span onclick=\"ShowMessgeMenu(this,'MSG','" +
					item.ItemId +
					"', '" +
					buddyObj.identity +
					'\')" class=chatMessageDropdown style="display:none"><i class="fa fa-chevron-down"></i></span>';
				messageString +=
					'<div id=msg-text-' +
					item.ItemId +
					' class=messageText style="' +
					(longMessage ? 'max-height:190px; overflow:hidden' : '') +
					'">' +
					formattedMessage +
					'</div>';
				if (longMessage) {
					messageString +=
						'<div id=msg-readmore-' +
						item.ItemId +
						' class=messageReadMore><span onclick="ExpandMessage(this,\'' +
						item.ItemId +
						"', '" +
						buddyObj.identity +
						'\')">' +
						lang.read_more +
						'</span></div>';
				}
				messageString +=
					'<div class=messageDate>' +
					DateTime +
					' ' +
					deliveryStatus +
					'</div>';
				messageString += '</td>';
				messageString += '</tr></table>';
			} else {
				// You are the destination (receiving)
				var ActualSender = ''; //TODO
				var messageString =
					'<table class=theirChatMessage cellspacing=0 cellpadding=0><tr>';
				messageString +=
					'<td class=theirChatMessageText onmouseenter="ShowChatMenu(this)" onmouseleave="HideChatMenu(this)">';
				messageString +=
					"<span onclick=\"ShowMessgeMenu(this,'MSG','" +
					item.ItemId +
					"', '" +
					buddyObj.identity +
					'\')" class=chatMessageDropdown style="display:none"><i class="fa fa-chevron-down"></i></span>';
				if (buddyObj.type == 'group') {
					messageString += '<div class=messageDate>' + ActualSender + '</div>';
				}
				messageString +=
					'<div id=msg-text-' +
					item.ItemId +
					' class=messageText style="' +
					(longMessage ? 'max-height:190px; overflow:hidden' : '') +
					'">' +
					formattedMessage +
					'</div>';
				if (longMessage) {
					messageString +=
						'<div id=msg-readmore-' +
						item.ItemId +
						' class=messageReadMore><span onclick="ExpandMessage(this,\'' +
						item.ItemId +
						"', '" +
						buddyObj.identity +
						'\')">' +
						lang.read_more +
						'</span></div>';
				}
				messageString += '<div class=messageDate>' + DateTime + '</div>';
				messageString += '</td>';
				messageString += '</tr></table>';
			}
			$('#contact-' + buddyObj.identity + '-ChatHistory').prepend(
				messageString
			);
		} else if (item.ItemType == 'CDR') {
			// Add CDR
			// =======

			// CdrId = uID(),
			// ItemType: "CDR",
			// ItemDate: "...",
			// SrcUserId: srcId,
			// Src: srcCallerID,
			// DstUserId: dstId,
			// Dst: dstCallerID,
			// Billsec: duration.asSeconds(),
			// MessageData: ""
			// ReasonText:
			// ReasonCode:
			// Flagged
			// Tags: [""", "", "", ""]
			// Transfers: [{}],
			// Mutes: [{}],
			// Holds: [{}],
			// Recordings: [{ uID, startTime, mediaType, stopTime: utcDateNow, size}],
			// QOS: [{}]

			var iconColor = item.Billsec > 0 ? 'green' : 'red';
			var formattedMessage = '';

			// Flagged
			var flag =
				'<span id=cdr-flagged-' +
				item.CdrId +
				' style="' +
				(item.Flagged ? '' : 'display:none') +
				'">';
			flag += '<i class="fa fa-flag FlagCall"></i> ';
			flag += '</span>';

			// Comment
			var callComment = '';
			if (item.MessageData) callComment = item.MessageData;

			// Tags
			if (!item.Tags) item.Tags = [];
			var CallTags =
				'<ul id=cdr-tags-' +
				item.CdrId +
				' class=tags style="' +
				(item.Tags && item.Tags.length > 0 ? '' : 'display:none') +
				'">';
			$.each(item.Tags, function (i, tag) {
				CallTags +=
					'<li onclick="TagClick(this, \'' +
					item.CdrId +
					"', '" +
					buddyObj.identity +
					'\')">' +
					tag.value +
					'</li>';
			});
			CallTags +=
				'<li class=tagText><input maxlength=24 type=text onkeypress="TagKeyPress(event, this, \'' +
				item.CdrId +
				"', '" +
				buddyObj.identity +
				'\')" onfocus="TagFocus(this)"></li>';
			CallTags += '</ul>';

			// Call Type
			var callIcon = item.WithVideo ? 'fa-video-camera' : 'fa-phone';
			formattedMessage +=
				'<i class="fa ' + callIcon + '" style="color:' + iconColor + '"></i>';
			var audioVideo = item.WithVideo ? lang.a_video_call : lang.an_audio_call;

			// Recordings
			var recordingsHtml = '';
			if (item.Recordings && item.Recordings.length >= 1) {
				$.each(item.Recordings, function (i, recording) {
					if (recording.uID) {
						var StartTime = moment
							.utc(recording.startTime.replace(' UTC', ''))
							.local();
						var StopTime = moment
							.utc(recording.stopTime.replace(' UTC', ''))
							.local();
						var recordingDuration = moment.duration(StopTime.diff(StartTime));
						recordingsHtml += '<div class=callRecording>';
						if (item.WithVideo) {
							if (recording.Poster) {
								var posterWidth = recording.Poster.width;
								var posterHeight = recording.Poster.height;
								var posterImage = recording.Poster.posterBase64;
								recordingsHtml +=
									'<div><IMG src="' +
									posterImage +
									'"><button onclick="PlayVideoCallRecording(this, \'' +
									item.CdrId +
									"', '" +
									recording.uID +
									'\')" class=videoPoster><i class="fa fa-play"></i></button></div>';
							} else {
								recordingsHtml +=
									'<div><button onclick="PlayVideoCallRecording(this, \'' +
									item.CdrId +
									"', '" +
									recording.uID +
									"', '" +
									buddyObj.identity +
									'\')"><i class="fa fa-video-camera"></i></button></div>';
							}
						} else {
							recordingsHtml +=
								'<div><button onclick="PlayAudioCallRecording(this, \'' +
								item.CdrId +
								"', '" +
								recording.uID +
								"', '" +
								buddyObj.identity +
								'\')"><i class="fa fa-play"></i></button></div>';
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
						recordingsHtml += '<div>';
						recordingsHtml +=
							'<span id="cdr-video-meta-width-' +
							item.CdrId +
							'-' +
							recording.uID +
							'"></span>';
						recordingsHtml +=
							'<span id="cdr-video-meta-height-' +
							item.CdrId +
							'-' +
							recording.uID +
							'"></span>';
						recordingsHtml +=
							'<span id="cdr-media-meta-size-' +
							item.CdrId +
							'-' +
							recording.uID +
							'"></span>';
						recordingsHtml +=
							'<span id="cdr-media-meta-codec-' +
							item.CdrId +
							'-' +
							recording.uID +
							'"></span>';
						recordingsHtml += '</div>';
						recordingsHtml += '</div>';
					}
				});
			}

			if (item.SrcUserId == profileUserID) {
				// (Outbound) You(profileUserID) initiated a call
				if (item.Billsec == '0') {
					formattedMessage +=
						' ' +
						lang.you_tried_to_make +
						' ' +
						audioVideo +
						' (' +
						item.ReasonText +
						').';
				} else {
					formattedMessage +=
						' ' +
						lang.you_made +
						' ' +
						audioVideo +
						', ' +
						lang.and_spoke_for +
						' ' +
						formatDuration(item.Billsec) +
						'.';
				}
				var messageString =
					'<table class=ourChatMessage cellspacing=0 cellpadding=0><tr>';
				messageString += '<td style="padding-right:4px;">' + flag + '</td>';
				messageString +=
					'<td class=ourChatMessageText onmouseenter="ShowChatMenu(this)" onmouseleave="HideChatMenu(this)">';
				messageString +=
					"<span onClick=\"ShowMessgeMenu(this,'CDR','" +
					item.CdrId +
					"', '" +
					buddyObj.identity +
					'\')" class=chatMessageDropdown style="display:none"><i class="fa fa-chevron-down"></i></span>';
				messageString += '<div>' + formattedMessage + '</div>';
				messageString += '<div>' + CallTags + '</div>';
				messageString +=
					'<div id=cdr-comment-' +
					item.CdrId +
					' class=cdrComment>' +
					callComment +
					'</div>';
				messageString +=
					'<div class=callRecordings>' + recordingsHtml + '</div>';
				messageString += '<div class=messageDate>' + DateTime + '</div>';
				messageString += '</td>';
				messageString += '</tr></table>';
			} else {
				// (Inbound) you(profileUserID) received a call
				if (item.Billsec == '0') {
					formattedMessage +=
						' ' + lang.you_missed_a_call + ' (' + item.ReasonText + ').';
				} else {
					formattedMessage +=
						' ' +
						lang.you_recieved +
						' ' +
						audioVideo +
						', ' +
						lang.and_spoke_for +
						' ' +
						formatDuration(item.Billsec) +
						'.';
				}
				var messageString =
					'<table class=theirChatMessage cellspacing=0 cellpadding=0><tr>';
				messageString +=
					'<td class=theirChatMessageText onmouseenter="ShowChatMenu(this)" onmouseleave="HideChatMenu(this)">';
				messageString +=
					"<span onClick=\"ShowMessgeMenu(this,'CDR','" +
					item.CdrId +
					"', '" +
					buddyObj.identity +
					'\')" class=chatMessageDropdown style="display:none"><i class="fa fa-chevron-down"></i></span>';
				messageString +=
					'<div style="text-align:left">' + formattedMessage + '</div>';
				messageString += '<div>' + CallTags + '</div>';
				messageString +=
					'<div id=cdr-comment-' +
					item.CdrId +
					' class=cdrComment>' +
					callComment +
					'</div>';
				messageString +=
					'<div class=callRecordings>' + recordingsHtml + '</div>';
				messageString += '<div class=messageDate> ' + DateTime + '</div>';
				messageString += '</td>';
				messageString += '<td style="padding-left:4px">' + flag + '</td>';
				messageString += '</tr></table>';
			}
			// Messges are repended here, and appended when logging
			$('#contact-' + buddyObj.identity + '-ChatHistory').prepend(
				messageString
			);
		} else if (item.ItemType == 'FILE') {
			// TODO
		} else if (item.ItemType == 'SMS') {
			// TODO
		}
	});

	// For some reason, the first time this fires, it doesnt always work
	updateScroll(buddyObj.identity);
	window.setTimeout(function () {
		updateScroll(buddyObj.identity);
	}, 300);
}
function ShowChatMenu(obj) {
	$(obj).children('span').show();
}
function HideChatMenu(obj) {
	$(obj).children('span').hide();
}
function ExpandMessage(obj, ItemId, buddy) {
	$('#msg-text-' + ItemId).css('max-height', '');
	$('#msg-text-' + ItemId).css('overflow', '');
	$('#msg-readmore-' + ItemId).remove();

	HidePopup(500);
}
function ShowBuddyDial(obj, buddy) {
	$('#contact-' + buddy + '-audio-dial').show();
	$('#contact-' + buddy + '-video-dial').show();
}
function HideBuddyDial(obj, buddy) {
	$('#contact-' + buddy + '-audio-dial').hide();
	$('#contact-' + buddy + '-video-dial').hide();
}
function QuickDialAudio(buddy, obj, event) {
	AudioCallMenu(buddy, obj);
	event.stopPropagation();
}
function QuickDialVideo(buddy, ExtNo, event) {
	event.stopPropagation();
	window.setTimeout(function () {
		DialByLine('video', buddy, ExtNo);
	}, 300);
}
