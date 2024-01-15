// Presence / Subscribe
// ====================
function SubscribeAll() {
	console.log('Subscribe to voicemail Messages...');

	// conference, message-summary, dialog, presence, presence.winfo, xcap-diff, dialog.winfo, refer

	// Voicemail notice TODO: Make this optional
	var vmOptions = { expires: 300 };
	voicemailSubs = userAgent.subscribe(
		SipUsername + '@' + wssServer,
		'message-summary',
		vmOptions
	); // message-summary = voicemail messages
	voicemailSubs.on('notify', function (notification) {
		// You have voicemail:
		// Message-Account: sip:alice@example.com
		// Messages-Waiting: no
		// Fax-Message: 2/4
		// Voice-Message: 0/0 (0/0)   <-- new/old (new & urgent/ old & urgent)

		var messagesWaitng = false;
		$.each(notification.request.body.split('\n'), function (i, line) {
			if (line.indexOf('Messages-Waiting:') != -1) {
				messagesWaitng = $.trim(line.replace('Messages-Waiting:', '')) == 'yes';
			}
		});

		if (messagesWaitng) {
			// Notify user of voicemail
			console.log('You have voicemail!');

			// TODO:
			// Check if already notified
			// Use Alert
			// Use Notification if allowed
			// Add Icon to User section
		}
	});

	// Dialog Subscription (This version isnt as nice as PIDF)
	// var dialogOptions = { expires: 300, extraHeaders: ['Accept: application/dialog-info+xml'] }

	// PIDF Subscription TODO: make this an option.
	var dialogOptions = {
		expires: 300,
		extraHeaders: ['Accept: application/pidf+xml'],
	};
	// var dialogOptions = { expires: 300, extraHeaders: ['Accept: application/pidf+xml', 'application/xpidf+xml', 'application/simple-message-summary', 'application/im-iscomposing+xml'] }

	// Start subscribe all
	console.log(
		'Starting Subscribe of all (' + Buddies.length + ') Extension Buddies...'
	);
	for (var b = 0; b < Buddies.length; b++) {
		var buddyObj = Buddies[b];
		if (buddyObj.type == 'extension') {
			console.log('SUBSCRIBE: ' + buddyObj.ExtNo + '@' + wssServer);
			var blfObj = userAgent.subscribe(
				buddyObj.ExtNo + '@' + wssServer,
				'presence',
				dialogOptions
			);
			blfObj.data.buddyId = buddyObj.identity;
			blfObj.on('notify', function (notification) {
				RecieveBlf(notification);
			});
			BlfSubs.push(blfObj);
		}
	}
}
function SubscribeBuddy(buddyObj) {
	var dialogOptions = {
		expires: 300,
		extraHeaders: ['Accept: application/pidf+xml'],
	};
	// var dialogOptions = { expires: 300, extraHeaders: ['Accept: application/pidf+xml', 'application/xpidf+xml', 'application/simple-message-summary', 'application/im-iscomposing+xml'] }

	if (buddyObj.type == 'extension') {
		console.log('SUBSCRIBE: ' + buddyObj.ExtNo + '@' + wssServer);
		var blfObj = userAgent.subscribe(
			buddyObj.ExtNo + '@' + wssServer,
			'presence',
			dialogOptions
		);
		blfObj.data.buddyId = buddyObj.identity;
		blfObj.on('notify', function (notification) {
			RecieveBlf(notification);
		});
		BlfSubs.push(blfObj);
	}
}
function RecieveBlf(notification) {
	if (userAgent == null || !userAgent.isRegistered()) return;

	var ContentType = notification.request.headers['Content-Type'][0].parsed;
	if (ContentType == 'application/pidf+xml') {
		// Handle Presence
		/*
        // Asteriks chan_sip
        <?xml version="1.0" encoding="ISO-8859-1"?>
        <presence
            xmlns="urn:ietf:params:xml:ns:pidf" 
            xmlns:pp="urn:ietf:params:xml:ns:pidf:person" 
            xmlns:es="urn:ietf:params:xml:ns:pidf:rpid:status:rpid-status"
            xmlns:ep="urn:ietf:params:xml:ns:pidf:rpid:rpid-person"
            entity="sip:webrtc@192.168.88.98">

            <pp:person>
                <status>
                    <ep:activities>
                        <ep:away/>
                    </ep:activities>
                </status>
            </pp:person>

            <note>Not online</note>
            <tuple id="300">
                <contact priority="1">sip:300@192.168.88.98</contact>
                <status>
                    <basic>open | closed</basic>
                </status>
            </tuple>
        </presence>

        // Asterisk chan_pjsip
        <?xml version="1.0" encoding="UTF-8"?>
        <presence 
            entity="sip:300@192.168.88.40:443;transport=ws" 
            xmlns="urn:ietf:params:xml:ns:pidf" 
            xmlns:dm="urn:ietf:params:xml:ns:pidf:data-model" 
            xmlns:rpid="urn:ietf:params:xml:ns:pidf:rpid">
            <note>Ready</note>
            <tuple id="300">
                <status>
                    <basic>open</basic>
                </status>
                <contact priority="1">sip:User1@raspberrypi.local</contact>
            </tuple>
            <dm:person />
        </presence>
        */

		var xml = $($.parseXML(notification.request.body));

		var Entity = xml.find('presence').attr('entity');
		var Contact = xml.find('presence').find('tuple').find('contact').text();
		if (
			SipUsername == Entity.split('@')[0].split(':')[1] ||
			SipUsername == Contact.split('@')[0].split(':')[1]
		) {
			// Message is for you.
		} else {
			console.warn('presence message not for you.', xml);
			return;
		}

		var buddy = xml.find('presence').find('tuple').attr('id');

		var statusObj = xml.find('presence').find('tuple').find('status');
		var availability = xml
			.find('presence')
			.find('tuple')
			.find('status')
			.find('basic')
			.text();
		var friendlyState = xml.find('presence').find('note').text();
		var dotClass = 'dotOffline';
		if (friendlyState == 'Not online') dotClass = 'dotOffline';
		if (friendlyState == 'Ready') dotClass = 'dotOnline';
		if (friendlyState == 'On the phone') dotClass = 'dotInUse';
		if (friendlyState == 'Ringing') dotClass = 'dotRinging';
		if (friendlyState == 'On hold') dotClass = 'dotOnHold';
		if (friendlyState == 'Unavailable') dotClass = 'dotOffline';

		// dotOnline | dotOffline | dotRinging | dotInUse | dotReady | dotOnHold
		var buddyObj = FindBuddyByExtNo(buddy);
		if (buddyObj != null) {
			console.log(
				'Setting Presence for ' + buddyObj.identity + ' to ' + friendlyState
			);
			$('#contact-' + buddyObj.identity + '-devstate').prop('class', dotClass);
			$('#contact-' + buddyObj.identity + '-devstate-main').prop(
				'class',
				dotClass
			);
			buddyObj.devState = dotClass;
			buddyObj.presence = friendlyState;

			if (friendlyState == 'Not online') friendlyState = lang.state_not_online;
			if (friendlyState == 'Ready') friendlyState = lang.state_ready;
			if (friendlyState == 'On the phone')
				friendlyState = lang.state_on_the_phone;
			if (friendlyState == 'Ringing') friendlyState = lang.state_ringing;
			if (friendlyState == 'On hold') friendlyState = lang.state_on_hold;
			if (friendlyState == 'Unavailable')
				friendlyState = lang.state_unavailable;
			$('#contact-' + buddyObj.identity + '-presence').html(friendlyState);
			$('#contact-' + buddyObj.identity + '-presence-main').html(friendlyState);
		}
	} else if (ContentType == 'application/dialog-info+xml') {
		// Handle "Dialog" State

		var xml = $($.parseXML(notification.request.body));

		/*
        <?xml version="1.0"?>
        <dialog-info 
            xmlns="urn:ietf:params:xml:ns:dialog-info" 
            version="0-99999" 
            state="full|partial" 
            entity="sip:xxxx@XXX.XX.XX.XX">
            <dialog id="xxxx">
                <state>trying | proceeding | early | terminated | confirmed</state>
            </dialog>
        </dialog-info>
        */

		var ObservedUser = xml.find('dialog-info').attr('entity');
		var buddy = ObservedUser.split('@')[0].split(':')[1];

		var version = xml.find('dialog-info').attr('version');

		var DialogState = xml.find('dialog-info').attr('state');
		if (DialogState != 'full') return;

		var extId = xml.find('dialog-info').find('dialog').attr('id');
		if (extId != buddy) return;

		var state = xml.find('dialog-info').find('dialog').find('state').text();
		var friendlyState = 'Unknown';
		if (state == 'terminated') friendlyState = 'Ready';
		if (state == 'trying') friendlyState = 'On the phone';
		if (state == 'proceeding') friendlyState = 'On the phone';
		if (state == 'early') friendlyState = 'Ringing';
		if (state == 'confirmed') friendlyState = 'On the phone';

		var dotClass = 'dotOffline';
		if (friendlyState == 'Not online') dotClass = 'dotOffline';
		if (friendlyState == 'Ready') dotClass = 'dotOnline';
		if (friendlyState == 'On the phone') dotClass = 'dotInUse';
		if (friendlyState == 'Ringing') dotClass = 'dotRinging';
		if (friendlyState == 'On hold') dotClass = 'dotOnHold';
		if (friendlyState == 'Unavailable') dotClass = 'dotOffline';

		// The dialog states only report devices states, and cant say online or offline.
		// dotOnline | dotOffline | dotRinging | dotInUse | dotReady | dotOnHold
		var buddyObj = FindBuddyByExtNo(buddy);
		if (buddyObj != null) {
			console.log(
				'Setting Presence for ' + buddyObj.identity + ' to ' + friendlyState
			);
			$('#contact-' + buddyObj.identity + '-devstate').prop('class', dotClass);
			$('#contact-' + buddyObj.identity + '-devstate-main').prop(
				'class',
				dotClass
			);
			buddyObj.devState = dotClass;
			buddyObj.presence = friendlyState;

			if (friendlyState == 'Unknown') friendlyState = lang.state_unknown;
			if (friendlyState == 'Not online') friendlyState = lang.state_not_online;
			if (friendlyState == 'Ready') friendlyState = lang.state_ready;
			if (friendlyState == 'On the phone')
				friendlyState = lang.state_on_the_phone;
			if (friendlyState == 'Ringing') friendlyState = lang.state_ringing;
			if (friendlyState == 'On hold') friendlyState = lang.state_on_hold;
			if (friendlyState == 'Unavailable')
				friendlyState = lang.state_unavailable;
			$('#contact-' + buddyObj.identity + '-presence').html(friendlyState);
			$('#contact-' + buddyObj.identity + '-presence-main').html(friendlyState);
		}
	}
}
function UnsubscribeAll() {
	console.log('Unsubscribing ' + BlfSubs.length + ' subscriptions...');
	for (var blf = 0; blf < BlfSubs.length; blf++) {
		BlfSubs[blf].unsubscribe();
		BlfSubs[blf].close();
	}
	BlfSubs = new Array();

	for (var b = 0; b < Buddies.length; b++) {
		var buddyObj = Buddies[b];
		if (buddyObj.type == 'extension') {
			$('#contact-' + buddyObj.identity + '-devstate').prop(
				'class',
				'dotOffline'
			);
			$('#contact-' + buddyObj.identity + '-devstate-main').prop(
				'class',
				'dotOffline'
			);
			$('#contact-' + buddyObj.identity + '-presence').html(lang.state_unknown);
			$('#contact-' + buddyObj.identity + '-presence-main').html(
				lang.state_unknown
			);
		}
	}
}
function UnsubscribeBuddy(buddyObj) {
	if (buddyObj.type != 'extension') return;

	for (var blf = 0; blf < BlfSubs.length; blf++) {
		var blfObj = BlfSubs[blf];
		if (blfObj.data.buddyId == buddyObj.identity) {
			console.log('Unsubscribing:', buddyObj.identity);
			if (blfObj.dialog != null) {
				blfObj.unsubscribe();
				blfObj.close();
			}
			BlfSubs.splice(blf, 1);
			break;
		}
	}
}
