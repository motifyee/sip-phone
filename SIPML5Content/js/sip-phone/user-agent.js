// Create User Agent
// =================
function CreateUserAgent() {
	try {
		console.log('Creating User Agent...');
		userAgent = new SIP.UA({
			displayName: profileName,
			uri: SipUsername + '@' + wssServer,
			transportOptions: {
				wsServers: 'wss://' + wssServer + ':' + WebSocketPort + '' + ServerPath,
				traceSip: false,
				connectionTimeout: TransportConnectionTimeout,
				maxReconnectionAttempts: TransportReconnectionAttempts,
				reconnectionTimeout: TransportReconnectionTimeout,
			},
			sessionDescriptionHandlerFactoryOptions: {
				peerConnectionOptions: {
					alwaysAcquireMediaFirst: true, // Better for firefox, but seems to have no effect on others
					iceCheckingTimeout: IceStunCheckTimeout,
					rtcConfiguration: {
						iceServers: [
							{
								urls:
									IceStunServerProtocol +
									':' +
									IceStunServerAddress +
									':' +
									IceStunServerPort,
							},
						],
					},
				},
			},
			authorizationUser: SipUsername,
			password: SipPassword,
			registerExpires: RegisterExpires,
			hackWssInTransport: WssInTransport,
			hackIpInContact: IpInContact,
			userAgentString: userAgentStr,
			autostart: false,
			register: false,
		});
		console.log('Creating User Agent... Done');
	} catch (e) {
		console.error('Error creating User Agent: ' + e);
		$('#regStatus').html(lang.error_user_agant);
		alert(e.message);
		return;
	}

	// UA Register events
	userAgent.on('registered', function () {
		console.log('Registered!');
		$('#regStatus').html(lang.registered);

		$('#reglink').hide();
		$('#dereglink').show();

		// Start Subscribe Loop
		if (!isReRegister) {
			SubscribeAll();
		}
		isReRegister = true;

		// Custom Web hook
		if (typeof web_hook_on_register !== 'undefined')
			web_hook_on_register(userAgent);
	});
	userAgent.on('registrationFailed', function (response, cause) {
		console.log('Registration Failed: ' + cause);
		$('#regStatus').html(lang.registration_failed);

		$('#reglink').show();
		$('#dereglink').hide();

		// Custom Web hook
		if (typeof web_hook_on_registrationFailed !== 'undefined')
			web_hook_on_registrationFailed(cause);
	});
	userAgent.on('unregistered', function () {
		console.log('Unregistered, bye!');
		$('#regStatus').html(lang.unregistered);

		$('#reglink').show();
		$('#dereglink').hide();

		// Custom Web hook
		if (typeof web_hook_on_unregistered !== 'undefined')
			web_hook_on_unregistered();
	});

	// UA transport
	userAgent.on('transportCreated', function (transport) {
		console.log('Transport Object Created');

		// Transport Events
		transport.on('connected', function () {
			console.log('Connected to Web Socket!');
			$('#regStatus').html(lang.connected_to_web_socket);

			$('#WebRtcFailed').hide();

			// Auto start register
			Register();
		});
		transport.on('disconnected', function () {
			console.log('Disconnected from Web Socket!');
			$('#regStatus').html(lang.disconnected_from_web_socket);
		});
		transport.on('transportError', function () {
			console.log('Web Socket error!');
			$('#regStatus').html(lang.web_socket_error);

			$('#WebRtcFailed').show();

			// Custom Web hook
			if (typeof web_hook_on_transportError !== 'undefined')
				web_hook_on_transportError(transport, userAgent);
		});
	});

	// Inbound Calls
	userAgent.on('invite', function (session) {
		ReceiveCall(session);
		//alert("link");
		var stack_top_left = { dir1: 'down', dir2: 'right', push: 'top' };
		new PNotify({
			title: 'Notification',
			text: didnotify,
			addclass: 'bg-info stack-top-right',
			stack: stack_top_left,
		});
		// Custom Web hook
		if (typeof web_hook_on_invite !== 'undefined') web_hook_on_invite(session);
	});

	// Inbound Text Message
	userAgent.on('message', function (message) {
		ReceiveMessage(message);

		// Custom Web hook
		if (typeof web_hook_on_message !== 'undefined')
			web_hook_on_message(message);
	});

	// Start the WebService Connection loop
	console.log('Connecting to Web Socket...');
	$('#regStatus').html(lang.connecting_to_web_socket);
	userAgent.start();

	// Register Buttons
	$('#reglink').on('click', Register);
	$('#dereglink').on('click', Unregister);

	// WebRTC Error Page
	$('#WebRtcFailed').on('click', function () {
		Confirm(
			lang.error_connecting_web_socket,
			lang.web_socket_error,
			function () {
				window.open(
					'https://' + wssServer + ':' + WebSocketPort + '/httpstatus'
				);
			},
			null
		);
	});
}

// Registration
// ============
function Register() {
	if (userAgent == null || userAgent.isRegistered()) return;

	console.log('Sending Registration...');
	$('#regStatus').html(lang.sending_registration);
	userAgent.register();
}
function Unregister() {
	if (userAgent == null || !userAgent.isRegistered()) return;

	console.log('Unsubscribing...');
	$('#regStatus').html(lang.unsubscribing);
	try {
		UnsubscribeAll();
	} catch (e) {}

	console.log('Disconnecting...');
	$('#regStatus').html(lang.disconnecting);
	userAgent.unregister();

	isReRegister = false;
}
