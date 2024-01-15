// UI Elements
// ===========
function OpenWindow(
	html,
	title,
	height,
	width,
	hideCloseButton,
	allowResize,
	button1_Text,
	button1_onClick,
	button2_Text,
	button2_onClick,
	DoOnLoad,
	OnClose
) {
	console.log('Open Window: ' + title);

	// Close any windows that may already be open
	try {
		windowsCollection.window('window').close();
	} catch (e) {}

	// Create Window
	var windowObj = windowsCollection.createWindow(
		'window',
		100,
		0,
		width,
		height
	);
	windowObj.setText(title);
	if (allowResize) {
		windowObj.allowResize();
	} else {
		windowObj.denyResize();
	}
	windowObj.setModal(true);
	windowObj.button('park').hide();
	windowObj.button('park').disable();

	if (allowResize) {
		windowObj.button('minmax').show();
	} else {
		windowObj.button('minmax').hide();
	}

	if (hideCloseButton) {
		windowObj.button('close').hide();
		windowObj.button('close').disable();
	}

	windowObj.button('help').hide();
	windowObj.button('help').disable();

	windowObj.attachHTMLString(html);

	if (DoOnLoad) DoOnLoad();
	if (OnClose) {
		windowObj.attachEvent('onClose', function (win) {
			return OnClose(win);
		});
	}

	var windowWidth = $(window).outerWidth();
	var windowHeight = $(window).outerHeight();
	if (windowWidth <= width || windowHeight <= height) {
		console.log('Window width is small, consider fullscreen');
		windowObj.allowResize();
		windowObj.maximize();
		windowObj.denyResize();
	}
	windowObj.center();

	var buttonHtml = '<div class=UiWindowButtonBar>';
	if (button1_Text)
		buttonHtml += '<button id=WindowButton1>' + button1_Text + '</button>';
	if (button2_Text)
		buttonHtml += '<button id=WindowButton2>' + button2_Text + '</button>';
	buttonHtml += '</div>';
	windowObj.attachStatusBar({ text: buttonHtml });

	$('#WindowButton1').click(function () {
		console.log('Window Button 1 clicked');
		if (button1_onClick) button1_onClick();
	});
	$('#WindowButton2').click(function () {
		console.log('Window Button 2 clicked');
		if (button2_onClick) button2_onClick();
	});

	windowObj.show();
}
function CloseWindow() {
	console.log('Call to close any open window');

	try {
		windowsCollection.window('window').close();
	} catch (e) {}
}
function WindowProgressOn() {
	try {
		windowsCollection.window('window').progressOn();
	} catch (e) {}
}
function WindowProgressOff() {
	try {
		windowsCollection.window('window').progressOff();
	} catch (e) {}
}
function Alert(messageStr, TitleStr, onOk) {
	if (confirmObj != null) {
		confirmObj.close();
		confirmObj = null;
	}
	if (promptObj != null) {
		promptObj.close();
		promptObj = null;
	}
	if (alertObj != null) {
		console.error(
			'Alert not null, while Alert called: ' +
				TitleStr +
				', saying:' +
				messageStr
		);
		return;
	} else {
		console.log(
			'Alert called with Title: ' + TitleStr + ', saying: ' + messageStr
		);
	}

	alertObj = messagingCollection.createWindow('alert', 0, 0, 300, 300);
	alertObj.setText(TitleStr);
	alertObj.center();
	alertObj.denyResize();
	alertObj.setModal(true);

	alertObj.button('park').hide();
	alertObj.button('park').disable();

	alertObj.button('minmax').hide();
	alertObj.button('minmax').disable();

	alertObj.button('close').hide();
	alertObj.button('close').disable();

	var html = '<div class=NoSelect>';
	html +=
		'<div class=UiText style="padding: 10px" id=AllertMessageText>' +
		messageStr +
		'</div>';
	html +=
		'<div class=UiButtonBar><button id=AlertOkButton style="width:80px">' +
		lang.ok +
		'</button></div>';
	html += '</div>';
	alertObj.attachHTMLString(html);
	var offsetTextHeight = $('#AllertMessageText').outerHeight();

	$('#AlertOkButton').click(function () {
		console.log('Alert OK clicked');
		if (onOk) onOk();
		alertObj.close();
		alertObj = null;
	});

	alertObj.setDimension(300, offsetTextHeight + 100);
	alertObj.show();

	$('#AlertOkButton').focus();
}
function Confirm(messageStr, TitleStr, onOk, onCancel) {
	if (alertObj != null) {
		alertObj.close();
		alertObj = null;
	}
	if (promptObj != null) {
		promptObj.close();
		promptObj = null;
	}
	if (confirmObj != null) {
		console.error(
			'Confirm not null, while Confrim called with Title: ' +
				TitleStr +
				', saying: ' +
				messageStr
		);
		return;
	} else {
		console.log(
			'Confirm called with Title: ' + TitleStr + ', saying: ' + messageStr
		);
	}

	confirmObj = messagingCollection.createWindow('confirm', 0, 0, 300, 300);
	confirmObj.setText(TitleStr);
	confirmObj.center();
	confirmObj.denyResize();
	confirmObj.setModal(true);

	confirmObj.button('park').hide();
	confirmObj.button('park').disable();

	confirmObj.button('minmax').hide();
	confirmObj.button('minmax').disable();

	confirmObj.button('close').hide();
	confirmObj.button('close').disable();

	var html = '<div class=NoSelect>';
	html +=
		'<div class=UiText style="padding: 10px" id=ConfrimMessageText>' +
		messageStr +
		'</div>';
	html +=
		'<div class=UiButtonBar><button id=ConfirmOkButton style="width:80px">' +
		lang.ok +
		'</button><button id=ConfrimCancelButton style="width:80px">' +
		lang.cancel +
		'</button></div>';
	html += '</div>';
	confirmObj.attachHTMLString(html);
	var offsetTextHeight = $('#ConfrimMessageText').outerHeight();

	$('#ConfirmOkButton').click(function () {
		console.log('Confrim OK clicked');
		if (onOk) onOk();
		confirmObj.close();
		confirmObj = null;
	});
	$('#ConfrimCancelButton').click(function () {
		console.log('Confirm Cancel clicked');
		if (onCancel) onCancel();
		confirmObj.close();
		confirmObj = null;
	});

	confirmObj.setDimension(300, offsetTextHeight + 100);
	confirmObj.show();

	$('#ConfrimOkButton').focus();
}
function Prompt(
	messageStr,
	TitleStr,
	FieldText,
	defaultValue,
	dataType,
	placeholderText,
	onOk,
	onCancel
) {
	if (alertObj != null) {
		alertObj.close();
		alertObj = null;
	}
	if (confirmObj != null) {
		confirmObj.close();
		confirmObj = null;
	}
	if (promptObj != null) {
		console.error(
			'Prompt not null, while Prompt called with Title: ' +
				TitleStr +
				', saying: ' +
				messageStr
		);
		return;
	} else {
		console.log(
			'Prompt called with Title: ' + TitleStr + ', saying: ' + messageStr
		);
	}

	promptObj = messagingCollection.createWindow('prompt', 0, 0, 350, 350);
	promptObj.setText(TitleStr);
	promptObj.center();
	promptObj.denyResize();
	promptObj.setModal(true);

	promptObj.button('park').hide();
	promptObj.button('park').disable();

	promptObj.button('minmax').hide();
	promptObj.button('minmax').disable();

	promptObj.button('close').hide();
	promptObj.button('close').disable();

	var html = '<div class=NoSelect>';
	html += '<div class=UiText style="padding: 10px" id=PromptMessageText>';
	html += messageStr;
	html += '<div style="margin-top:10px">' + FieldText + ' : </div>';
	html +=
		'<div style="margin-top:5px"><INPUT id=PromptValueField type=' +
		dataType +
		' value="' +
		defaultValue +
		'" placeholder="' +
		placeholderText +
		'" style="width:98%"></div>';
	html += '</div>';
	html +=
		'<div class=UiButtonBar><button id=PromptOkButton style="width:80px">' +
		lang.ok +
		'</button>&nbsp;<button id=PromptCancelButton class=UiButton style="width:80px">' +
		lang.cancel +
		'</button></div>';
	html += '</div>';
	promptObj.attachHTMLString(html);
	var offsetTextHeight = $('#PromptMessageText').outerHeight();

	$('#PromptOkButton').click(function () {
		console.log(
			'Prompt OK clicked, with value: ' + $('#PromptValueField').val()
		);
		if (onOk) onOk($('#PromptValueField').val());
		promptObj.close();
		promptObj = null;
	});

	$('#PromptCancelButton').click(function () {
		console.log('Prompt Cancel clicked');
		if (onCancel) onCancel();
		promptObj.close();
		promptObj = null;
	});

	promptObj.setDimension(350, offsetTextHeight + 100);
	promptObj.show();

	$('#PromptOkButton').focus();
}
function HidePopup(timeout) {
	if (timeout) {
		window.setTimeout(function () {
			if (dhtmlxPopup != null) {
				dhtmlxPopup.hide();
				dhtmlxPopup.unload();
				dhtmlxPopup = null;
			}
		}, timeout);
	} else {
		if (dhtmlxPopup != null) {
			dhtmlxPopup.hide();
			dhtmlxPopup.unload();
			dhtmlxPopup = null;
		}
	}
}
