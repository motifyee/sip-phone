// Global Settings
// ===============
var enabledExtendedServices = false; // TODO: Send: Image, Recording, Video, SMS, Email
var enabledGroupServices = false; // TODO: Group calling functionality - requires Asterisks config
// Set the following to null to disable
var welcomeScreen =
	'<div class="UiWindowField scroller"><pre style="font-size: 12px">';
welcomeScreen +=
	'===========================================================================\n';
welcomeScreen += 'Copyright © 2020 - All Rights Reserved\n';
welcomeScreen +=
	'===========================================================================\n';
welcomeScreen += '\n';
welcomeScreen += '                            NO WARRANTY\n';
welcomeScreen += '\n';
welcomeScreen += '\n';
welcomeScreen +=
	'============================================================================\n</pre>';
welcomeScreen += '</div>';

// Lanaguage Packs (lang/xx.json)
// ===============
// Note: The following should correspond to files on your server.
// eg: If you list "fr" then you need to add the file "fr.json".
// Use the "en.json" as a template.
// More specific lanagauge must be first. ie: "zh-hans" should be before "zh".
// "en.json" is always loaded by default
var availableLang = ['ja', 'zh-hans', 'zh', 'ru', 'tr', 'nl'];

// User Settings & Defaults
// =============================================================================

var wssServer = '';
var profileUserID = 10;
var profileName = '';
var WebSocketPort = '';
var ServerPath = '';
var profileUser = '';
var SipUsername = '';
var SipPassword = '';

function loadDataFromSQLServer() {
	$.ajax({
		url: '/Home/GetSeverData',
		type: 'GET',
		dataType: 'json',

		data: {},
		contentType: 'application/json; charset=utf-8',
		success: function (result) {
			wssServer = result.serverurl.serverip;
			profileUserID = '10';
			profileName = result.account.name;
			WebSocketPort = result.serverurl.prioxyurl;
			ServerPath = result.serverurl.websocketurl;
			profileUser = result.account.name;
			SipUsername = result.account.identity;
			SipPassword = result.account.pass;
			InitUi();
		},

		error: function (ex) {
			alert("Error: couldn't load server data!");
		},
	});
}

// =============================================================================
//var wssServer = 'ppbx.vroot.com';           //
//var profileUserID = getDbItem("profileUserID", null);   // Internal reference ID. (DON'T CHANGE THIS!)
//var profileName = getDbItem("profileName", null);
//var WebSocketPort = 8089;
//var ServerPath = '/ws';
//var profileUser = getDbItem("profileUser", null);       // eg: 100
//var SipUsername = getDbItem("SipUsername", null);       // eg: webrtc
//var SipPassword = getDbItem("SipPassword", null);       // eg: webrtc

// =============================================================================

var TransportConnectionTimeout = parseInt(
	getDbItem('TransportConnectionTimeout', 15)
); // The timeout in seconds for the initial connection to make on the web socket port
var TransportReconnectionAttempts = parseInt(
	getDbItem('TransportReconnectionAttempts', 99)
); // The number of times to attempt to reconnect to a WebSocket when the connection drops.
var TransportReconnectionTimeout = parseInt(
	getDbItem('TransportReconnectionTimeout', 15)
); // The time in seconds to wait between WebSocket reconnection attempts.

var userAgentStr = getDbItem('UserAgentStr', 'VROOT ERP'); // Set this to whatever you want.
var hostingPrefex = getDbItem('HostingPrefex', ''); // Use if hosting off root directiory. eg: "/phone/" or "/static/"
var RegisterExpires = parseInt(getDbItem('RegisterExpires', 300)); // Registration expiry time (in seconds)
var WssInTransport = getDbItem('WssInTransport', '1') == '1'; // Set the transport parameter to wss when used in SIP URIs. (Required for Asterisk as it doesnt support Path)
var IpInContact = getDbItem('IpInContact', '1') == '1'; // Set a random IP address as the host value in the Contact header field and Via sent-by parameter. (Suggested for Asterisk)
var IceStunServerProtocol = getDbItem('IceStunServerProtocol', 'stun'); // Set the ICE/STUN server protocol. Either 'stun', 'turn' or 'turns'
var IceStunServerAddress = getDbItem(
	'IceStunServerAddress',
	'stun.l.google.com'
); // Set the URL for the ICE/STUN Server
var IceStunServerPort = getDbItem('IceStunServerPort', '19302'); // Set the ICE/STUN server port
var IceStunCheckTimeout = parseInt(getDbItem('IceStunCheckTimeout', 500)); // Set amount of time in milliseconds to wait for the ICE/STUN server

var AutoAnswerEnabled = getDbItem('AutoAnswerEnabled', '0') == '1'; // Automatically answers the phone when the call comes in, if you are not on a call already
var DoNotDisturbEnabled = getDbItem('DoNotDisturbEnabled', '0') == '1'; // Rejects any inbound call, while allowing outbound calls
var CallWaitingEnabled = getDbItem('CallWaitingEnabled', '1') == '1'; // Rejects any inbound call if you are on a call already.
var RecordAllCalls = getDbItem('RecordAllCalls', '0') == '1'; // Starts Call Recording when a call is established.
var StartVideoFullScreen = getDbItem('StartVideoFullScreen', '1') == '1'; // Starts a vdeo call in the full screen (browser screen, not dektop)

var AutoGainControl = getDbItem('AutoGainControl', '1') == '1'; // Attempts to adjust the microphone volume to a good audio level. (OS may be better at this)
var EchoCancellation = getDbItem('EchoCancellation', '1') == '1'; // Attemots to remove echo over the line.
var NoiseSuppression = getDbItem('NoiseSuppression', '1') == '1'; // Attempts to clear the call qulity of noise.
var MirrorVideo = getDbItem('VideoOrientation', 'rotateY(180deg)'); // Displays the self-preview in normal or mirror view, to better present the preview.
var maxFrameRate = getDbItem('FrameRate', ''); // Suggests a frame rate to your webcam if possible.
var videoHeight = getDbItem('VideoHeight', ''); // Suggests a video height (and therefor picture quality) to your webcam.
var videoAspectRatio = getDbItem('AspectRatio', ''); // Suggests an aspect ratio (1:1 | 4:3 | 16:9) to your webcam.
var NotificationsActive = getDbItem('Notifications', '0') == '1';

var StreamBuffer = parseInt(getDbItem('StreamBuffer', 50)); // The amount of rows to buffer in the Buddy Stream
var PosterJpegQuality = parseFloat(getDbItem('PosterJpegQuality', 0.6)); // The image quality of the Video Poster images
var VideoResampleSize = getDbItem('VideoResampleSize', 'HD'); // The resample size (height) to re-render video that gets presented (sent). (SD = ???x360 | HD = ???x720 | FHD = ???x1080)
var RecordingVideoSize = getDbItem('RecordingVideoSize', 'HD'); // The size/quality of the video track in the recodings (SD = 640x360 | HD = 1280x720 | FHD = 1920x1080)
var RecordingVideoFps = parseInt(getDbItem('RecordingVideoFps', 12)); // The Frame Per Second of the Video Track recording
var RecordingLayout = getDbItem('RecordingLayout', 'them-pnp'); // The Layout of the Recording Video Track (side-by-side | us-pnp | them-pnp | us-only | them-only)

var DidLength = parseInt(getDbItem('DidLength', 6)); // DID length from which to decide if an incoming caller is a "contact" or an "extension".
var MaxDidLength = parseInt(getDbItem('maximumNumberLength', 16)); // Maximum langth of any DID number including international dialled numbers.
var DisplayDateFormat = getDbItem('DateFormat', 'YYYY-MM-DD'); // The display format for all dates. https://momentjs.com/docs/#/displaying/
var DisplayTimeFormat = getDbItem('TimeFormat', 'h:mm:ss A'); // The display format for all times. https://momentjs.com/docs/#/displaying/
var Language = getDbItem('Language', 'auto'); // Overrides the langauage selector or "automatic". Must be one of availableLang[]. If not defaults to en. Testing: zh-Hans-CN, zh-cmn-Hans-CN, zh-Hant, de, de-DE, en-US, fr, fr-FR, es-ES, sl-IT-nedis, hy-Latn-IT-arevela

// Permission Settings
var EnableTextMessaging = getDbItem('EnableTextMessaging', '1') == '1'; // Enables the Text Messaging
var DisableFreeDial = getDbItem('DisableFreeDial', '0') == '1'; // Removes the Dial icon in the profile area, users will need to add buddies in order to dial.
var DisableBuddies = getDbItem('DisableBuddies', '0') == '1'; // Removes the Add Someone menu item and icon from the profile area. Buddies will still be created automatically.
var EnableTransfer = getDbItem('EnableTransfer', '1') == '1'; // Controls Transfering during a call
var EnableConference = getDbItem('EnableConference', '1') == '1'; // Controls Conference during a call
var AutoAnswerPolicy = getDbItem('AutoAnswerPolicy', 'allow'); // allow = user can choose | disabled = feature is disabled | enabled = feature is always on
var DoNotDisturbPolicy = getDbItem('DoNotDisturbPolicy', 'allow'); // allow = user can choose | disabled = feature is disabled | enabled = feature is always on
var CallWaitingPolicy = getDbItem('CallWaitingPolicy', 'allow'); // allow = user can choose | disabled = feature is disabled | enabled = feature is always on
var CallRecordingPolicy = getDbItem('CallRecordingPolicy', 'allow'); // allow = user can choose | disabled = feature is disabled | enabled = feature is always on
var EnableAccountSettings = getDbItem('EnableAccountSettings', '1') == '1'; // Controls the Account tab in Settings
var EnableAudioVideoSettings =
	getDbItem('EnableAudioVideoSettings', '1') == '1'; // Controls the Audio & Video tab in Settings
var EnableAppearanceSettings =
	getDbItem('EnableAppearanceSettings', '1') == '1'; // Controls the Appearance tab in Settings
var EnableNotificationSettings =
	getDbItem('EnableNotificationSettings', '1') == '1'; // Controls the Notifications tab in Settings
var EnableAlphanumericDial = getDbItem('EnableAlphanumericDial', '0') == '1'; // Allows calling /[^\da-zA-Z\*\#\+]/g default is /[^\d\*\#\+]/g
var EnableVideoCalling = getDbItem('EnableVideoCalling', '1') == '1'; // Enables Video during a call

// ===================================================
// Rather don't fiddle with anything beyond this point
// ===================================================

// System variables
// ================
var localDB = window.localStorage;
var userAgent = null;
var voicemailSubs = null;
var BlfSubs = [];
var CanvasCollection = [];
var Buddies = [];
var isReRegister = false;
var dhtmlxPopup = null;
var selectedBuddy = null;
var selectedLine = null;
var alertObj = null;
var confirmObj = null;
var promptObj = null;
var windowsCollection = null;
var messagingCollection = null;
var HasVideoDevice = false;
var HasAudioDevice = false;
var HasSpeakerDevice = false;
var AudioinputDevices = [];
var VideoinputDevices = [];
var SpeakerDevices = [];
var Lines = [];
var lang = {};
var audioBlobs = {};

// Upgrade Pataches
// ================
// Version: 0.0.1 => Version: 0.0.2
var oldUserBuddies = localDB.getItem('UserBuddiesJson');
if (oldUserBuddies != null && profileUserID != null) {
	localDB.setItem(profileUserID + '-Buddies', oldUserBuddies);
	localDB.removeItem('UserBuddiesJson');
}
oldUserBuddies = null;

// Window and Document Events
// ==========================
$(window).on('beforeunload', function () {
	Unregister();
});
$(window).on('resize', function () {
	UpdateUI();
});

// Document Ready
// ==============
$(document).ready(function () {
	// Load Langauge File
	// ==================
	$.getJSON(hostingPrefex + '../SIPML5Content/lang/en2.json', function (data) {
		lang = data;
		var userLang = GetAlternateLanguage();
		if (userLang != '') {
			$.getJSON(
				hostingPrefex + 'lang/' + userLang + '.json',
				function (altdata) {
					lang = altdata;
				}
			).always(function () {
				console.log('Alternate Lanaguage Pack loaded: ', lang);
				loadDataFromSQLServer();
				// InitUi();
			});
		} else {
			console.log('Lanaguage Pack already loaded: ', lang);
			loadDataFromSQLServer();
			//InitUi();
		}
	});
});

DetectDevices();
window.setInterval(function () {
	DetectDevices();
}, 10000);

// STATUS_NULL: 0
// STATUS_INVITE_SENT: 1
// STATUS_1XX_RECEIVED: 2
// STATUS_INVITE_RECEIVED: 3
// STATUS_WAITING_FOR_ANSWER: 4
// STATUS_ANSWERED: 5
// STATUS_WAITING_FOR_PRACK: 6
// STATUS_WAITING_FOR_ACK: 7
// STATUS_CANCELED: 8
// STATUS_TERMINATED: 9
// STATUS_ANSWERED_WAITING_FOR_PRACK: 10
// STATUS_EARLY_MEDIA: 11
// STATUS_CONFIRMED: 12

// =================================================================================
// End Of File
