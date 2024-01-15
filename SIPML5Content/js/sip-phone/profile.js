// My Profile
// ==========
function ShowMyProfileMenu(obj) {
	var x = window.dhx4.absLeft(obj);
	var y = window.dhx4.absTop(obj);
	var w = obj.offsetWidth;
	var h = obj.offsetHeight;

	HidePopup();
	dhtmlxPopup = new dhtmlXPopup();
	var menu = [
		{
			id: 2,
			name: '<i class="fa fa-refresh"></i> ' + lang.refresh_registration,
			enabled: '',
		},
		{
			id: 3,
			name: '<i class="fa fa-wrench"></i> ' + lang.configure_extension,
			enabled: '',
		},
		dhtmlxPopup.separator,
		{
			id: 4,
			name: '<i class="fa fa-user-plus"></i> ' + lang.add_someone,
			enabled: '',
		},
		{
			id: 5,
			name:
				'<i class="fa fa-users"></i><i class="fa fa-plus" style="font-size:9px"></i> ' +
				lang.create_group,
			enabled: '',
		},
		dhtmlxPopup.separator,
		{
			id: 6,
			name: '<i class="fa fa-phone"></i> ' + lang.auto_answer,
			enabled: AutoAnswerEnabled ? '<i class="fa fa-check"></i>' : '',
		},
		{
			id: 7,
			name: '<i class="fa fa-ban"></i> ' + lang.do_no_disturb,
			enabled: DoNotDisturbEnabled ? '<i class="fa fa-check"></i>' : '',
		},
		{
			id: 8,
			name: '<i class="fa fa-volume-control-phone"></i> ' + lang.call_waiting,
			enabled: CallWaitingEnabled ? '<i class="fa fa-check"></i>' : '',
		},
		{
			id: 9,
			name: '<i class="fa fa-dot-circle-o"></i> ' + lang.record_all_calls,
			enabled: RecordAllCalls ? '<i class="fa fa-check"></i>' : '',
		},
	];
	if (DisableBuddies == true) {
		$.each(menu, function (i, item) {
			if (item.id == 4) {
				menu.splice(i, 1);
				return false;
			}
		});
	}
	if (enabledGroupServices == false) {
		$.each(menu, function (i, item) {
			if (item.id == 5) {
				menu.splice(i, 1);
				return false;
			}
		});
	}
	dhtmlxPopup.attachList('name,enabled', menu);
	dhtmlxPopup.attachEvent('onClick', function (id) {
		HidePopup();

		if (id == 2) RefreshRegistration();
		if (id == 3) ConfigureExtensionWindow();
		// ---
		if (id == 4) AddSomeoneWindow();
		if (id == 5) CreateGroupWindow();
		// ----
		if (id == 6) ToggleAutoAnswer();
		if (id == 7) ToggleDoNoDisturb();
		if (id == 8) ToggleCallWaiting();
		if (id == 9) ToggleRecordAllCalls();
	});
	dhtmlxPopup.show(x, y, w, h);
}
function RefreshRegistration() {
	Unregister();
	console.log('Unregister complete...');
	window.setTimeout(function () {
		console.log('Starting registration...');
		Register();
	}, 1000);
}

function ToggleAutoAnswer() {
	if (AutoAnswerPolicy == 'disabled') {
		AutoAnswerEnabled = false;
		console.warn('Policy AutoAnswer: Disabled');
		return;
	}
	AutoAnswerEnabled = AutoAnswerEnabled == true ? false : true;
	if (AutoAnswerPolicy == 'enabled') AutoAnswerEnabled = true;
	localDB.setItem('AutoAnswerEnabled', AutoAnswerEnabled == true ? '1' : '0');
	console.log('AutoAnswer:', AutoAnswerEnabled);
}
function ToggleDoNoDisturb() {
	if (DoNotDisturbPolicy == 'disabled') {
		DoNotDisturbEnabled = false;
		console.warn('Policy DoNotDisturb: Disabled');
		return;
	}
	DoNotDisturbEnabled = DoNotDisturbEnabled == true ? false : true;
	if (DoNotDisturbPolicy == 'enabled') DoNotDisturbEnabled = true;
	localDB.setItem(
		'DoNotDisturbEnabled',
		DoNotDisturbEnabled == true ? '1' : '0'
	);
	console.log('DoNotDisturb', DoNotDisturbEnabled);
}
function ToggleCallWaiting() {
	if (CallWaitingPolicy == 'disabled') {
		CallWaitingEnabled = false;
		console.warn('Policy CallWaiting: Disabled');
		return;
	}
	CallWaitingEnabled = CallWaitingEnabled == true ? false : true;
	if (CallWaitingPolicy == 'enabled') CallWaitingPolicy = true;
	localDB.setItem('CallWaitingEnabled', CallWaitingEnabled == true ? '1' : '0');
	console.log('CallWaiting', CallWaitingEnabled);
}
function ToggleRecordAllCalls() {
	if (CallRecordingPolicy == 'disabled') {
		RecordAllCalls = false;
		console.warn('Policy CallRecording: Disabled');
		return;
	}
	RecordAllCalls = RecordAllCalls == true ? false : true;
	if (CallRecordingPolicy == 'enabled') RecordAllCalls = true;
	localDB.setItem('RecordAllCalls', RecordAllCalls == true ? '1' : '0');
	console.log('RecordAllCalls', RecordAllCalls);
}

function ShowBuddyProfileMenu(buddy, obj, typeStr) {
	var x = window.dhx4.absLeft(obj);
	var y = window.dhx4.absTop(obj);
	var w = obj.offsetWidth;
	var h = obj.offsetHeight;

	HidePopup();
	dhtmlxPopup = new dhtmlXPopup();

	var buddyObj = FindBuddyByIdentity(buddy);

	if (typeStr == 'extension') {
		var html =
			'<div style="width:200px; cursor:pointer" onclick="EditBuddyWindow(\'' +
			buddy +
			'\')">';
		html +=
			'<div class="buddyProfilePic" style="background-image:url(\'' +
			getPicture(buddy, 'extension') +
			'\')"></div>';
		html +=
			'<div id=ProfileInfo style="text-align:center"><i class="fa fa-spinner fa-spin"></i></div>';
		html += '</div>';
		dhtmlxPopup.attachHTML(html);

		// Done
		$('#ProfileInfo').html('');

		$('#ProfileInfo').append(
			'<div class=ProfileTextLarge style="margin-top:15px">' +
				buddyObj.CallerIDName +
				'</div>'
		);
		$('#ProfileInfo').append(
			'<div class=ProfileTextMedium>' + buddyObj.Desc + '</div>'
		);

		$('#ProfileInfo').append(
			'<div class=ProfileTextSmall style="margin-top:15px">' +
				lang.extension_number +
				':</div>'
		);
		$('#ProfileInfo').append(
			'<div class=ProfileTextMedium>' + buddyObj.ExtNo + ' </div>'
		);

		if (
			buddyObj.Email &&
			buddyObj.Email != 'null' &&
			buddyObj.Email != 'undefined'
		) {
			$('#ProfileInfo').append(
				'<div class=ProfileTextSmall style="margin-top:15px">' +
					lang.email +
					':</div>'
			);
			$('#ProfileInfo').append(
				'<div class=ProfileTextMedium>' + buddyObj.Email + ' </div>'
			);
		}
		if (
			buddyObj.MobileNumber &&
			buddyObj.MobileNumber != 'null' &&
			buddyObj.MobileNumber != 'undefined'
		) {
			$('#ProfileInfo').append(
				'<div class=ProfileTextSmall style="margin-top:15px">' +
					lang.mobile +
					':</div>'
			);
			$('#ProfileInfo').append(
				'<div class=ProfileTextMedium>' + buddyObj.MobileNumber + ' </div>'
			);
		}
		if (
			buddyObj.ContactNumber1 &&
			buddyObj.ContactNumber1 != 'null' &&
			buddyObj.ContactNumber1 != 'undefined'
		) {
			$('#ProfileInfo').append(
				'<div class=ProfileTextSmall style="margin-top:15px">' +
					lang.alternative_contact +
					':</div>'
			);
			$('#ProfileInfo').append(
				'<div class=ProfileTextMedium>' + buddyObj.ContactNumber1 + ' </div>'
			);
		}
		if (
			buddyObj.ContactNumber2 &&
			buddyObj.ContactNumber2 != 'null' &&
			buddyObj.ContactNumber2 != 'undefined'
		) {
			$('#ProfileInfo').append(
				'<div class=ProfileTextSmall style="margin-top:15px">' +
					lang.alternative_contact +
					':</div>'
			);
			$('#ProfileInfo').append(
				'<div class=ProfileTextMedium>' + buddyObj.ContactNumber2 + ' </div>'
			);
		}
	} else if (typeStr == 'contact') {
		var html =
			'<div style="width:200px; cursor:pointer" onclick="EditBuddyWindow(\'' +
			buddy +
			'\')">';
		html +=
			'<div class="buddyProfilePic" style="background-image:url(\'' +
			getPicture(buddy, 'contact') +
			'\')"></div>';
		html +=
			'<div id=ProfileInfo style="text-align:center"><i class="fa fa-spinner fa-spin"></i></div>';
		html += '</div>';
		dhtmlxPopup.attachHTML(html);

		$('#ProfileInfo').html('');
		$('#ProfileInfo').append(
			'<div class=ProfileTextLarge style="margin-top:15px">' +
				buddyObj.CallerIDName +
				'</div>'
		);
		$('#ProfileInfo').append(
			'<div class=ProfileTextMedium>' + buddyObj.Desc + '</div>'
		);

		if (
			buddyObj.Email &&
			buddyObj.Email != 'null' &&
			buddyObj.Email != 'undefined'
		) {
			$('#ProfileInfo').append(
				'<div class=ProfileTextSmall style="margin-top:15px">' +
					lang.email +
					':</div>'
			);
			$('#ProfileInfo').append(
				'<div class=ProfileTextMedium>' + buddyObj.Email + ' </div>'
			);
		}
		if (
			buddyObj.MobileNumber &&
			buddyObj.MobileNumber != 'null' &&
			buddyObj.MobileNumber != 'undefined'
		) {
			$('#ProfileInfo').append(
				'<div class=ProfileTextSmall style="margin-top:15px">' +
					lang.mobile +
					':</div>'
			);
			$('#ProfileInfo').append(
				'<div class=ProfileTextMedium>' + buddyObj.MobileNumber + ' </div>'
			);
		}
		if (
			buddyObj.ContactNumber1 &&
			buddyObj.ContactNumber1 != 'null' &&
			buddyObj.ContactNumber1 != 'undefined'
		) {
			$('#ProfileInfo').append(
				'<div class=ProfileTextSmall style="margin-top:15px">' +
					lang.alternative_contact +
					':</div>'
			);
			$('#ProfileInfo').append(
				'<div class=ProfileTextMedium>' + buddyObj.ContactNumber1 + ' </div>'
			);
		}
		if (
			buddyObj.ContactNumber2 &&
			buddyObj.ContactNumber2 != 'null' &&
			buddyObj.ContactNumber2 != 'undefined'
		) {
			$('#ProfileInfo').append(
				'<div class=ProfileTextSmall style="margin-top:15px">' +
					lang.alternative_contact +
					':</div>'
			);
			$('#ProfileInfo').append(
				'<div class=ProfileTextMedium>' + buddyObj.ContactNumber2 + ' </div>'
			);
		}
	} else if (typeStr == 'group') {
		var html =
			'<div style="width:200px; cursor:pointer" onclick="EditBuddyWindow(\'' +
			buddy +
			'\')">';
		html +=
			'<div class="buddyProfilePic" style="background-image:url(\'' +
			getPicture(buddy, 'group') +
			'\')"></div>';
		html +=
			'<div id=ProfileInfo style="text-align:center"><i class="fa fa-spinner fa-spin"></i></div>';
		html += '</div>';
		dhtmlxPopup.attachHTML(html);

		$('#ProfileInfo').html('');

		$('#ProfileInfo').append(
			'<div class=ProfileTextLarge style="margin-top:15px">' +
				buddyObj.CallerIDName +
				'</div>'
		);
		$('#ProfileInfo').append(
			'<div class=ProfileTextMedium>' + buddyObj.Desc + '</div>'
		);
	}
	dhtmlxPopup.show(x, y, w, h);
}
