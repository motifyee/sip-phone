// Chatting
// ========
function chatOnbeforepaste(event, obj, buddy) {
	console.log('Handle paste, checking for Images...');
	var items = (event.clipboardData || event.originalEvent.clipboardData).items;

	// find pasted image among pasted items
	var preventDefault = false;
	for (var i = 0; i < items.length; i++) {
		if (items[i].type.indexOf('image') === 0) {
			console.log('Image found! Opening image editor...');

			var blob = items[i].getAsFile();

			// read the image in
			var reader = new FileReader();
			reader.onload = function (event) {
				// Image has loaded, open Image Preview editer
				// ===========================================
				console.log('Image loaded... setting placeholder...');
				var placeholderImage = new Image();
				placeholderImage.onload = function () {
					console.log('Placeholder loaded... CreateImageEditor...');

					CreateImageEditor(buddy, placeholderImage);
				};
				placeholderImage.src = event.target.result;

				// $("#contact-" + buddy + "-msgPreviewhtml").html("<img src=\""+ event.target.result +"\" style=\"max-width:320px; max-height:240px\" />");
				// $("#contact-" + buddy + "-msgPreview").show();
			};
			reader.readAsDataURL(blob);

			preventDefault = true;
			continue;
		}
	}

	// Pevent default if you found an image
	if (preventDefault) event.preventDefault();
}
function chatOnkeydown(event, obj, buddy) {
	var keycode = event.keyCode ? event.keyCode : event.which;
	if (keycode == '13') {
		if (event.shiftKey || event.ctrlKey) {
			// Leave as is
			// Windows and Mac react differently here.
		} else {
			event.preventDefault();

			SendChatMessage(buddy);
			return false;
		}
	}

	// handle paste, etc
	RefreshChatPreview(event, $.trim($(obj).val()), buddy);
}
function chatOnInput(event, obj, buddy) {
	console.log(event);
	RefreshChatPreview(event, $.trim($(obj).val()), buddy);
}
function chatOnkeyup(event, obj, buddy) {
	RefreshChatPreview(event, $.trim($(obj).val()), buddy);
}
function RefreshChatPreview(event, str, buddy) {
	if (str != '') {
		var chatMessage = ReformatMessage(str);

		$('#contact-' + buddy + '-msgPreviewhtml').html(chatMessage);
		$('#contact-' + buddy + '-msgPreview').show();
	} else {
		ClearChatPreview(buddy);
	}

	updateScroll(buddy);
}
function ClearChatPreview(buddy) {
	$('#contact-' + buddy + '-msgPreviewhtml').html('');
	$('#contact-' + buddy + '-msgPreview').hide();
}
function ReformatMessage(str) {
	var msg = str;
	// Simple tex=>HTML
	msg = msg.replace(/</gi, '&lt;');
	msg = msg.replace(/>/gi, '&gt;');
	msg = msg.replace(/\n/gi, '<br>');
	// Emojy
	// Skype: :) :( :D :O ;) ;( (:| :| :P :$ :^) |-) |-( :x ]:)
	// (cool) (hearteyes) (stareyes) (like) (unamused) (cwl) (xd) (pensive) (weary) (hysterical) (flushed) (sweatgrinning) (disappointed) (loudlycrying) (shivering) (expressionless) (relieved) (inlove) (kiss) (yawn) (puke) (doh) (angry) (wasntme) (worry) (confused) (veryconfused) (mm) (nerd) (rainbowsmile) (devil) (angel) (envy) (makeup) (think) (rofl) (happy) (smirk) (nod) (shake) (waiting) (emo) (donttalk) (idea) (talk) (swear) (headbang) (learn) (headphones) (morningafter) (selfie) (shock) (ttm) (dream)
	msg = msg.replace(/(:\)|:\-\)|:o\))/g, String.fromCodePoint(0x1f642)); // :) :-) :o)
	msg = msg.replace(/(:\(|:\-\(|:o\()/g, String.fromCodePoint(0x1f641)); // :( :-( :o(
	msg = msg.replace(/(;\)|;\-\)|;o\))/g, String.fromCodePoint(0x1f609)); // ;) ;-) ;o)
	msg = msg.replace(/(:'\(|:'\-\()/g, String.fromCodePoint(0x1f62a)); // :'( :'‑(
	msg = msg.replace(/(:'\(|:'\-\()/g, String.fromCodePoint(0x1f602)); // :') :'‑)
	msg = msg.replace(/(:\$)/g, String.fromCodePoint(0x1f633)); // :$
	msg = msg.replace(/(>:\()/g, String.fromCodePoint(0x1f623)); // >:(
	msg = msg.replace(/(:\×)/g, String.fromCodePoint(0x1f618)); // :×
	msg = msg.replace(/(:\O|:\‑O)/g, String.fromCodePoint(0x1f632)); // :O :‑O
	msg = msg.replace(/(:P|:\-P|:p|:\-p)/g, String.fromCodePoint(0x1f61b)); // :P :-P :p :-p
	msg = msg.replace(/(;P|;\-P|;p|;\-p)/g, String.fromCodePoint(0x1f61c)); // ;P ;-P ;p ;-p
	msg = msg.replace(/(:D|:\-D)/g, String.fromCodePoint(0x1f60d)); // :D :-D

	msg = msg.replace(/(\(like\))/g, String.fromCodePoint(0x1f44d)); // (like)

	// Make clickable Hyperlinks
	msg = msg.replace(
		/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/gi,
		function (x) {
			var niceLink = x.length > 50 ? x.substring(0, 47) + '...' : x;
			var rtn =
				'<A target=_blank class=previewHyperlink href="' +
				x +
				'">' +
				niceLink +
				'</A>';
			return rtn;
		}
	);
	return msg;
}
function getPicture(buddy, typestr) {
	if (buddy == 'profilePicture') {
		// Special handling for profile image
		var dbImg = localDB.getItem('profilePicture');
		if (dbImg == null) {
			return hostingPrefex + '../SIPML5Content/default.png';
		} else {
			return dbImg;
			// return URL.createObjectURL(base64toBlob(dbImg, 'image/png'));
		}
	}

	typestr = typestr ? typestr : 'extension';
	var buddyObj = FindBuddyByIdentity(buddy);
	if (buddyObj.imageObjectURL != '') {
		// Use Cache
		return buddyObj.imageObjectURL;
	}
	var dbImg = localDB.getItem('img-' + buddy + '-' + typestr);
	if (dbImg == null) {
		return hostingPrefex + '../SIPML5Content/default.png';
	} else {
		buddyObj.imageObjectURL = URL.createObjectURL(
			base64toBlob(dbImg, 'image/png')
		);
		return buddyObj.imageObjectURL;
	}
}
