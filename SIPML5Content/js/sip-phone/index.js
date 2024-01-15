let loadScript = scr =>
	$.getScript(`./SIPML5Content/js/sip-phone/${scr}.js`, () => {
		console.log(`${scr} loaded`);
	});

let scripts = [
	'buddy',
	'call',
	'chat',
	'chatting',
	'file-share',
	'image-editor',
	'media',
	'phone',
	'presence',
	'profile',
	'qos',
	'session',
	'settings',
	'sound',
	'statistics',
	'stream',
	'ui',
	'ui-elements',
	'user-agent',
	'util',
	'load',
].forEach(loadScript);
