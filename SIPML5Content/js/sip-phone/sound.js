// Mic and Speaker Levels
// ======================
function StartRemoteAudioMediaMonitoring(lineNum, session) {
	console.log('Creating RemoteAudio AudioContext on Line:' + lineNum);

	// Create local SoundMeter
	var soundMeter = new SoundMeter(session.id, lineNum);
	if (soundMeter == null) {
		console.warn('AudioContext() RemoteAudio not available... it fine.');
		return null;
	}

	// Ready the getStats request
	var remoteAudioStream = new MediaStream();
	var audioReceiver = null;
	var pc = session.sessionDescriptionHandler.peerConnection;
	pc.getReceivers().forEach(function (RTCRtpReceiver) {
		if (RTCRtpReceiver.track && RTCRtpReceiver.track.kind == 'audio') {
			if (audioReceiver == null) {
				remoteAudioStream.addTrack(RTCRtpReceiver.track);
				audioReceiver = RTCRtpReceiver;
			} else {
				console.log('Found another Track, but audioReceiver not null');
				console.log(RTCRtpReceiver);
				console.log(RTCRtpReceiver.track);
			}
		}
	});

	// Setup Charts
	var maxDataLength = 100;
	soundMeter.startTime = Date.now();
	Chart.defaults.global.defaultFontSize = 12;

	var ChatHistoryOptions = {
		responsive: false,
		maintainAspectRatio: false,
		devicePixelRatio: 1,
		animation: false,
		scales: {
			yAxes: [
				{
					ticks: { beginAtZero: true }, //, min: 0, max: 100
				},
			],
		},
	};

	// Receive Kilobits per second
	soundMeter.ReceiveBitRateChart = new Chart(
		$('#line-' + lineNum + '-AudioReceiveBitRate'),
		{
			type: 'line',
			data: {
				labels: MakeDataArray('', maxDataLength),
				datasets: [
					{
						label: lang.receive_kilobits_per_second,
						data: MakeDataArray(0, maxDataLength),
						backgroundColor: 'rgba(168, 0, 0, 0.5)',
						borderColor: 'rgba(168, 0, 0, 1)',
						borderWidth: 1,
						pointRadius: 1,
					},
				],
			},
			options: ChatHistoryOptions,
		}
	);
	soundMeter.ReceiveBitRateChart.lastValueBytesReceived = 0;
	soundMeter.ReceiveBitRateChart.lastValueTimestamp = 0;

	// Receive Packets per second
	soundMeter.ReceivePacketRateChart = new Chart(
		$('#line-' + lineNum + '-AudioReceivePacketRate'),
		{
			type: 'line',
			data: {
				labels: MakeDataArray('', maxDataLength),
				datasets: [
					{
						label: lang.receive_packets_per_second,
						data: MakeDataArray(0, maxDataLength),
						backgroundColor: 'rgba(168, 0, 0, 0.5)',
						borderColor: 'rgba(168, 0, 0, 1)',
						borderWidth: 1,
						pointRadius: 1,
					},
				],
			},
			options: ChatHistoryOptions,
		}
	);
	soundMeter.ReceivePacketRateChart.lastValuePacketReceived = 0;
	soundMeter.ReceivePacketRateChart.lastValueTimestamp = 0;

	// Receive Packet Loss
	soundMeter.ReceivePacketLossChart = new Chart(
		$('#line-' + lineNum + '-AudioReceivePacketLoss'),
		{
			type: 'line',
			data: {
				labels: MakeDataArray('', maxDataLength),
				datasets: [
					{
						label: lang.receive_packet_loss,
						data: MakeDataArray(0, maxDataLength),
						backgroundColor: 'rgba(168, 99, 0, 0.5)',
						borderColor: 'rgba(168, 99, 0, 1)',
						borderWidth: 1,
						pointRadius: 1,
					},
				],
			},
			options: ChatHistoryOptions,
		}
	);
	soundMeter.ReceivePacketLossChart.lastValuePacketLoss = 0;
	soundMeter.ReceivePacketLossChart.lastValueTimestamp = 0;

	// Receive Jitter
	soundMeter.ReceiveJitterChart = new Chart(
		$('#line-' + lineNum + '-AudioReceiveJitter'),
		{
			type: 'line',
			data: {
				labels: MakeDataArray('', maxDataLength),
				datasets: [
					{
						label: lang.receive_jitter,
						data: MakeDataArray(0, maxDataLength),
						backgroundColor: 'rgba(0, 38, 168, 0.5)',
						borderColor: 'rgba(0, 38, 168, 1)',
						borderWidth: 1,
						pointRadius: 1,
					},
				],
			},
			options: ChatHistoryOptions,
		}
	);

	// Receive Audio Levels
	soundMeter.ReceiveLevelsChart = new Chart(
		$('#line-' + lineNum + '-AudioReceiveLevels'),
		{
			type: 'line',
			data: {
				labels: MakeDataArray('', maxDataLength),
				datasets: [
					{
						label: lang.receive_audio_levels,
						data: MakeDataArray(0, maxDataLength),
						backgroundColor: 'rgba(140, 0, 168, 0.5)',
						borderColor: 'rgba(140, 0, 168, 1)',
						borderWidth: 1,
						pointRadius: 1,
					},
				],
			},
			options: ChatHistoryOptions,
		}
	);

	// Connect to Source
	soundMeter.connectToSource(remoteAudioStream, function (e) {
		if (e != null) return;

		// Create remote SoundMeter
		console.log(
			'SoundMeter for RemoteAudio Connected, displaying levels for Line: ' +
				lineNum
		);
		soundMeter.levelsInterval = window.setInterval(function () {
			// Calculate Levels
			//value="0" max="1" high="0.25" (this seems low... )
			var level = soundMeter.instant * 4.0;
			if (level > 1) level = 1;
			var instPercent = level * 100;

			$('#line-' + lineNum + '-Speaker').css(
				'height',
				instPercent.toFixed(2) + '%'
			);
		}, 50);
		soundMeter.networkInterval = window.setInterval(function () {
			// Calculate Network Conditions
			if (audioReceiver != null) {
				audioReceiver.getStats().then(function (stats) {
					stats.forEach(function (report) {
						var theMoment = utcDateNow();
						var ReceiveBitRateChart = soundMeter.ReceiveBitRateChart;
						var ReceivePacketRateChart = soundMeter.ReceivePacketRateChart;
						var ReceivePacketLossChart = soundMeter.ReceivePacketLossChart;
						var ReceiveJitterChart = soundMeter.ReceiveJitterChart;
						var ReceiveLevelsChart = soundMeter.ReceiveLevelsChart;
						var elapsedSec = Math.floor(
							(Date.now() - soundMeter.startTime) / 1000
						);

						if (report.type == 'inbound-rtp') {
							if (ReceiveBitRateChart.lastValueTimestamp == 0) {
								ReceiveBitRateChart.lastValueTimestamp = report.timestamp;
								ReceiveBitRateChart.lastValueBytesReceived =
									report.bytesReceived;

								ReceivePacketRateChart.lastValueTimestamp = report.timestamp;
								ReceivePacketRateChart.lastValuePacketReceived =
									report.packetsReceived;

								ReceivePacketLossChart.lastValueTimestamp = report.timestamp;
								ReceivePacketLossChart.lastValuePacketLoss = report.packetsLost;

								return;
							}
							// Receive Kilobits Per second
							var kbitsPerSec =
								(8 *
									(report.bytesReceived -
										ReceiveBitRateChart.lastValueBytesReceived)) /
								1000;

							ReceiveBitRateChart.lastValueTimestamp = report.timestamp;
							ReceiveBitRateChart.lastValueBytesReceived = report.bytesReceived;

							soundMeter.ReceiveBitRate.push({
								value: kbitsPerSec,
								timestamp: theMoment,
							});
							ReceiveBitRateChart.data.datasets[0].data.push(kbitsPerSec);
							ReceiveBitRateChart.data.labels.push('');
							if (
								ReceiveBitRateChart.data.datasets[0].data.length > maxDataLength
							) {
								ReceiveBitRateChart.data.datasets[0].data.splice(0, 1);
								ReceiveBitRateChart.data.labels.splice(0, 1);
							}
							ReceiveBitRateChart.update();

							// Receive Packets Per Second
							var PacketsPerSec =
								report.packetsReceived -
								ReceivePacketRateChart.lastValuePacketReceived;

							ReceivePacketRateChart.lastValueTimestamp = report.timestamp;
							ReceivePacketRateChart.lastValuePacketReceived =
								report.packetsReceived;

							soundMeter.ReceivePacketRate.push({
								value: PacketsPerSec,
								timestamp: theMoment,
							});
							ReceivePacketRateChart.data.datasets[0].data.push(PacketsPerSec);
							ReceivePacketRateChart.data.labels.push('');
							if (
								ReceivePacketRateChart.data.datasets[0].data.length >
								maxDataLength
							) {
								ReceivePacketRateChart.data.datasets[0].data.splice(0, 1);
								ReceivePacketRateChart.data.labels.splice(0, 1);
							}
							ReceivePacketRateChart.update();

							// Receive Packet Loss
							var PacketsLost =
								report.packetsLost - ReceivePacketLossChart.lastValuePacketLoss;

							ReceivePacketLossChart.lastValueTimestamp = report.timestamp;
							ReceivePacketLossChart.lastValuePacketLoss = report.packetsLost;

							soundMeter.ReceivePacketLoss.push({
								value: PacketsLost,
								timestamp: theMoment,
							});
							ReceivePacketLossChart.data.datasets[0].data.push(PacketsLost);
							ReceivePacketLossChart.data.labels.push('');
							if (
								ReceivePacketLossChart.data.datasets[0].data.length >
								maxDataLength
							) {
								ReceivePacketLossChart.data.datasets[0].data.splice(0, 1);
								ReceivePacketLossChart.data.labels.splice(0, 1);
							}
							ReceivePacketLossChart.update();

							// Receive Jitter
							soundMeter.ReceiveJitter.push({
								value: report.jitter,
								timestamp: theMoment,
							});
							ReceiveJitterChart.data.datasets[0].data.push(report.jitter);
							ReceiveJitterChart.data.labels.push('');
							if (
								ReceiveJitterChart.data.datasets[0].data.length > maxDataLength
							) {
								ReceiveJitterChart.data.datasets[0].data.splice(0, 1);
								ReceiveJitterChart.data.labels.splice(0, 1);
							}
							ReceiveJitterChart.update();
						}
						if (report.type == 'track') {
							// Receive Audio Levels
							var levelPercent = report.audioLevel * 100;
							soundMeter.ReceiveLevels.push({
								value: levelPercent,
								timestamp: theMoment,
							});
							ReceiveLevelsChart.data.datasets[0].data.push(levelPercent);
							ReceiveLevelsChart.data.labels.push('');
							if (
								ReceiveLevelsChart.data.datasets[0].data.length > maxDataLength
							) {
								ReceiveLevelsChart.data.datasets[0].data.splice(0, 1);
								ReceiveLevelsChart.data.labels.splice(0, 1);
							}
							ReceiveLevelsChart.update();
						}
					});
				});
			}
		}, 1000);
	});

	return soundMeter;
}
function StartLocalAudioMediaMonitoring(lineNum, session) {
	console.log('Creating LocalAudio AudioContext on line ' + lineNum);

	// Create local SoundMeter
	var soundMeter = new SoundMeter(session.id, lineNum);
	if (soundMeter == null) {
		console.warn('AudioContext() LocalAudio not available... its fine.');
		return null;
	}

	// Ready the getStats request
	var localAudioStream = new MediaStream();
	var audioSender = null;
	var pc = session.sessionDescriptionHandler.peerConnection;
	pc.getSenders().forEach(function (RTCRtpSender) {
		if (RTCRtpSender.track && RTCRtpSender.track.kind == 'audio') {
			if (audioSender == null) {
				console.log('Adding Track to Monitor: ', RTCRtpSender.track.label);
				localAudioStream.addTrack(RTCRtpSender.track);
				audioSender = RTCRtpSender;
			} else {
				console.log('Found another Track, but audioSender not null');
				console.log(RTCRtpSender);
				console.log(RTCRtpSender.track);
			}
		}
	});

	// Setup Charts
	var maxDataLength = 100;
	soundMeter.startTime = Date.now();
	Chart.defaults.global.defaultFontSize = 12;
	var ChatHistoryOptions = {
		responsive: false,
		maintainAspectRatio: false,
		devicePixelRatio: 1,
		animation: false,
		scales: {
			yAxes: [
				{
					ticks: { beginAtZero: true },
				},
			],
		},
	};

	// Send Kilobits Per Second
	soundMeter.SendBitRateChart = new Chart(
		$('#line-' + lineNum + '-AudioSendBitRate'),
		{
			type: 'line',
			data: {
				labels: MakeDataArray('', maxDataLength),
				datasets: [
					{
						label: lang.send_kilobits_per_second,
						data: MakeDataArray(0, maxDataLength),
						backgroundColor: 'rgba(0, 121, 19, 0.5)',
						borderColor: 'rgba(0, 121, 19, 1)',
						borderWidth: 1,
						pointRadius: 1,
					},
				],
			},
			options: ChatHistoryOptions,
		}
	);
	soundMeter.SendBitRateChart.lastValueBytesSent = 0;
	soundMeter.SendBitRateChart.lastValueTimestamp = 0;

	// Send Packets Per Second
	soundMeter.SendPacketRateChart = new Chart(
		$('#line-' + lineNum + '-AudioSendPacketRate'),
		{
			type: 'line',
			data: {
				labels: MakeDataArray('', maxDataLength),
				datasets: [
					{
						label: lang.send_packets_per_second,
						data: MakeDataArray(0, maxDataLength),
						backgroundColor: 'rgba(0, 121, 19, 0.5)',
						borderColor: 'rgba(0, 121, 19, 1)',
						borderWidth: 1,
						pointRadius: 1,
					},
				],
			},
			options: ChatHistoryOptions,
		}
	);
	soundMeter.SendPacketRateChart.lastValuePacketSent = 0;
	soundMeter.SendPacketRateChart.lastValueTimestamp = 0;

	// Connect to Source
	soundMeter.connectToSource(localAudioStream, function (e) {
		if (e != null) return;

		console.log(
			'SoundMeter for LocalAudio Connected, displaying levels for Line: ' +
				lineNum
		);
		soundMeter.levelsInterval = window.setInterval(function () {
			// Calculate Levels
			//value="0" max="1" high="0.25" (this seems low... )
			var level = soundMeter.instant * 4.0;
			if (level > 1) level = 1;
			var instPercent = level * 100;
			$('#line-' + lineNum + '-Mic').css(
				'height',
				instPercent.toFixed(2) + '%'
			);
		}, 50);
		soundMeter.networkInterval = window.setInterval(function () {
			// Calculate Network Conditions
			// Sending Audio Track
			if (audioSender != null) {
				audioSender.getStats().then(function (stats) {
					stats.forEach(function (report) {
						var theMoment = utcDateNow();
						var SendBitRateChart = soundMeter.SendBitRateChart;
						var SendPacketRateChart = soundMeter.SendPacketRateChart;
						var elapsedSec = Math.floor(
							(Date.now() - soundMeter.startTime) / 1000
						);

						if (report.type == 'outbound-rtp') {
							if (SendBitRateChart.lastValueTimestamp == 0) {
								SendBitRateChart.lastValueTimestamp = report.timestamp;
								SendBitRateChart.lastValueBytesSent = report.bytesSent;

								SendPacketRateChart.lastValueTimestamp = report.timestamp;
								SendPacketRateChart.lastValuePacketSent = report.packetsSent;
								return;
							}

							// Send Kilobits Per second
							var kbitsPerSec =
								(8 * (report.bytesSent - SendBitRateChart.lastValueBytesSent)) /
								1000;

							SendBitRateChart.lastValueTimestamp = report.timestamp;
							SendBitRateChart.lastValueBytesSent = report.bytesSent;

							soundMeter.SendBitRate.push({
								value: kbitsPerSec,
								timestamp: theMoment,
							});
							SendBitRateChart.data.datasets[0].data.push(kbitsPerSec);
							SendBitRateChart.data.labels.push('');
							if (
								SendBitRateChart.data.datasets[0].data.length > maxDataLength
							) {
								SendBitRateChart.data.datasets[0].data.splice(0, 1);
								SendBitRateChart.data.labels.splice(0, 1);
							}
							SendBitRateChart.update();

							// Send Packets Per Second
							var PacketsPerSec =
								report.packetsSent - SendPacketRateChart.lastValuePacketSent;

							SendPacketRateChart.lastValueTimestamp = report.timestamp;
							SendPacketRateChart.lastValuePacketSent = report.packetsSent;

							soundMeter.SendPacketRate.push({
								value: PacketsPerSec,
								timestamp: theMoment,
							});
							SendPacketRateChart.data.datasets[0].data.push(PacketsPerSec);
							SendPacketRateChart.data.labels.push('');
							if (
								SendPacketRateChart.data.datasets[0].data.length > maxDataLength
							) {
								SendPacketRateChart.data.datasets[0].data.splice(0, 1);
								SendPacketRateChart.data.labels.splice(0, 1);
							}
							SendPacketRateChart.update();
						}
						if (report.type == 'track') {
							// Bug/security consern... this seems always to report "0"
							// Possible reason: When applied to isolated streams, media metrics may allow an application to infer some characteristics of the isolated stream, such as if anyone is speaking (by watching the audioLevel statistic).
							// console.log("Audio Sender: " + report.audioLevel);
						}
					});
				});
			}
		}, 1000);
	});

	return soundMeter;
}

// Sounds Meter Class
// ==================
class SoundMeter {
	constructor(sessionId, lineNum) {
		var audioContext = null;
		try {
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			audioContext = new AudioContext();
		} catch (e) {
			console.warn('AudioContext() LocalAudio not available... its fine.');
		}
		if (audioContext == null) return null;

		this.lineNum = lineNum;
		this.sessionId = sessionId;
		this.levelsInterval = null;
		this.networkInterval = null;
		this.startTime = 0;
		this.ReceiveBitRateChart = null;
		this.ReceiveBitRate = [];
		this.ReceivePacketRateChart = null;
		this.ReceivePacketRate = [];
		this.ReceivePacketLossChart = null;
		this.ReceivePacketLoss = [];
		this.ReceiveJitterChart = null;
		this.ReceiveJitter = [];
		this.ReceiveLevelsChart = null;
		this.ReceiveLevels = [];
		this.SendBitRateChart = null;
		this.SendBitRate = [];
		this.SendPacketRateChart = null;
		this.SendPacketRate = [];
		this.context = audioContext;
		this.instant = 0.0;
		this.script = audioContext.createScriptProcessor(2048, 1, 1);
		const that = this;
		this.script.onaudioprocess = function (event) {
			const input = event.inputBuffer.getChannelData(0);
			let i;
			let sum = 0.0;
			for (i = 0; i < input.length; ++i) {
				sum += input[i] * input[i];
			}
			that.instant = Math.sqrt(sum / input.length);
		};
	}
	connectToSource(stream, callback) {
		console.log('SoundMeter connecting...');
		try {
			this.mic = this.context.createMediaStreamSource(stream);
			this.mic.connect(this.script);
			// necessary to make sample run, but should not be.
			this.script.connect(this.context.destination);
			callback(null);
		} catch (e) {
			console.error(e); // Probably not audio track
			callback(e);
		}
	}
	stop() {
		console.log('Disconnecting SoundMeter...');
		try {
			window.clearInterval(this.levelsInterval);
			this.levelsInterval = null;
		} catch (e) {}
		try {
			window.clearInterval(this.networkInterval);
			this.networkInterval = null;
		} catch (e) {}
		this.mic.disconnect();
		this.script.disconnect();
		this.mic = null;
		this.script = null;
		try {
			this.context.close();
		} catch (e) {}
		this.context = null;

		// Save to IndexDb
		var lineObj = FindLineByNumber(this.lineNum);
		var QosData = {
			ReceiveBitRate: this.ReceiveBitRate,
			ReceivePacketRate: this.ReceivePacketRate,
			ReceivePacketLoss: this.ReceivePacketLoss,
			ReceiveJitter: this.ReceiveJitter,
			ReceiveLevels: this.ReceiveLevels,
			SendBitRate: this.SendBitRate,
			SendPacketRate: this.SendPacketRate,
		};
		SaveQosData(QosData, this.sessionId, lineObj.BuddyObj.identity);
	}
}
function MeterSettingsOutput(audioStream, objectId, direction, interval) {
	var soundMeter = new SoundMeter(null, null);
	soundMeter.startTime = Date.now();
	soundMeter.connectToSource(audioStream, function (e) {
		if (e != null) return;

		console.log('SoundMeter Connected, displaying levels to:' + objectId);
		soundMeter.levelsInterval = window.setInterval(function () {
			// Calculate Levels
			//value="0" max="1" high="0.25" (this seems low... )
			var level = soundMeter.instant * 4.0;
			if (level > 1) level = 1;
			var instPercent = level * 100;

			$('#' + objectId).css(direction, instPercent.toFixed(2) + '%'); // Settings_MicrophoneOutput "width" 50
		}, interval);
	});

	return soundMeter;
}
