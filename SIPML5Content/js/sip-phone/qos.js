// QOS
// ===
function SaveQosData(QosData, sessionId, buddy) {
	var indexedDB = window.indexedDB;
	var request = indexedDB.open('CallQosData');
	request.onerror = function (event) {
		console.error('IndexDB Request Error:', event);
	};
	request.onupgradeneeded = function (event) {
		console.warn(
			'Upgrade Required for IndexDB... probably because of first time use.'
		);
		var IDB = event.target.result;

		// Create Object Store
		if (IDB.objectStoreNames.contains('CallQos') == false) {
			var objectStore = IDB.createObjectStore('CallQos', { keyPath: 'uID' });
			objectStore.createIndex('sessionid', 'sessionid', { unique: false });
			objectStore.createIndex('buddy', 'buddy', { unique: false });
			objectStore.createIndex('QosData', 'QosData', { unique: false });
		} else {
			console.warn('IndexDB requested upgrade, but object store was in place');
		}
	};
	request.onsuccess = function (event) {
		console.log('IndexDB connected to CallQosData');

		var IDB = event.target.result;
		if (IDB.objectStoreNames.contains('CallQos') == false) {
			console.warn('IndexDB CallQosData.CallQos does not exists');
			return;
		}
		IDB.onerror = function (event) {
			console.error('IndexDB Error:', event);
		};

		// Prepare data to write
		var data = {
			uID: uID(),
			sessionid: sessionId,
			buddy: buddy,
			QosData: QosData,
		};
		// Commit Transaction
		var transaction = IDB.transaction(['CallQos'], 'readwrite');
		var objectStoreAdd = transaction.objectStore('CallQos').add(data);
		objectStoreAdd.onsuccess = function (event) {
			console.log('Call CallQos Sucess: ', sessionId);
		};
	};
}
function DisplayQosData(sessionId) {
	var indexedDB = window.indexedDB;
	var request = indexedDB.open('CallQosData');
	request.onerror = function (event) {
		console.error('IndexDB Request Error:', event);
	};
	request.onupgradeneeded = function (event) {
		console.warn(
			'Upgrade Required for IndexDB... probably because of first time use.'
		);
	};
	request.onsuccess = function (event) {
		console.log('IndexDB connected to CallQosData');

		var IDB = event.target.result;
		if (IDB.objectStoreNames.contains('CallQos') == false) {
			console.warn('IndexDB CallQosData.CallQos does not exists');
			return;
		}

		var transaction = IDB.transaction(['CallQos']);
		var objectStoreGet = transaction
			.objectStore('CallQos')
			.index('sessionid')
			.getAll(sessionId);
		objectStoreGet.onerror = function (event) {
			console.error('IndexDB Get Error:', event);
		};
		objectStoreGet.onsuccess = function (event) {
			if (event.target.result && event.target.result.length == 2) {
				// This is the correct data

				var QosData0 = event.target.result[0].QosData;
				// ReceiveBitRate: (8) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
				// ReceiveJitter: (8) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
				// ReceiveLevels: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
				// ReceivePacketLoss: (8) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
				// ReceivePacketRate: (8) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
				// SendBitRate: []
				// SendPacketRate: []
				var QosData1 = event.target.result[1].QosData;
				// ReceiveBitRate: []
				// ReceiveJitter: []
				// ReceiveLevels: []
				// ReceivePacketLoss: []
				// ReceivePacketRate: []
				// SendBitRate: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
				// SendPacketRate: (9) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]

				Chart.defaults.global.defaultFontSize = 12;

				var ChatHistoryOptions = {
					responsive: true,
					maintainAspectRatio: false,
					animation: false,
					scales: {
						yAxes: [
							{
								ticks: { beginAtZero: true }, //, min: 0, max: 100
							},
						],
						xAxes: [
							{
								display: false,
							},
						],
					},
				};

				// ReceiveBitRateChart
				var labelset = [];
				var dataset = [];
				var data =
					QosData0.ReceiveBitRate.length > 0
						? QosData0.ReceiveBitRate
						: QosData1.ReceiveBitRate;
				$.each(data, function (i, item) {
					labelset.push(
						moment
							.utc(item.timestamp.replace(' UTC', ''))
							.local()
							.format(DisplayDateFormat + ' ' + DisplayTimeFormat)
					);
					dataset.push(item.value);
				});
				var ReceiveBitRateChart = new Chart($('#cdr-AudioReceiveBitRate'), {
					type: 'line',
					data: {
						labels: labelset,
						datasets: [
							{
								label: lang.receive_kilobits_per_second,
								data: dataset,
								backgroundColor: 'rgba(168, 0, 0, 0.5)',
								borderColor: 'rgba(168, 0, 0, 1)',
								borderWidth: 1,
								pointRadius: 1,
							},
						],
					},
					options: ChatHistoryOptions,
				});

				// ReceivePacketRateChart
				var labelset = [];
				var dataset = [];
				var data =
					QosData0.ReceivePacketRate.length > 0
						? QosData0.ReceivePacketRate
						: QosData1.ReceivePacketRate;
				$.each(data, function (i, item) {
					labelset.push(
						moment
							.utc(item.timestamp.replace(' UTC', ''))
							.local()
							.format(DisplayDateFormat + ' ' + DisplayTimeFormat)
					);
					dataset.push(item.value);
				});
				var ReceivePacketRateChart = new Chart(
					$('#cdr-AudioReceivePacketRate'),
					{
						type: 'line',
						data: {
							labels: labelset,
							datasets: [
								{
									label: lang.receive_packets_per_second,
									data: dataset,
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

				// AudioReceivePacketLossChart
				var labelset = [];
				var dataset = [];
				var data =
					QosData0.ReceivePacketLoss.length > 0
						? QosData0.ReceivePacketLoss
						: QosData1.ReceivePacketLoss;
				$.each(data, function (i, item) {
					labelset.push(
						moment
							.utc(item.timestamp.replace(' UTC', ''))
							.local()
							.format(DisplayDateFormat + ' ' + DisplayTimeFormat)
					);
					dataset.push(item.value);
				});
				var AudioReceivePacketLossChart = new Chart(
					$('#cdr-AudioReceivePacketLoss'),
					{
						type: 'line',
						data: {
							labels: labelset,
							datasets: [
								{
									label: lang.receive_packet_loss,
									data: dataset,
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

				// AudioReceiveJitterChart
				var labelset = [];
				var dataset = [];
				var data =
					QosData0.ReceiveJitter.length > 0
						? QosData0.ReceiveJitter
						: QosData1.ReceiveJitter;
				$.each(data, function (i, item) {
					labelset.push(
						moment
							.utc(item.timestamp.replace(' UTC', ''))
							.local()
							.format(DisplayDateFormat + ' ' + DisplayTimeFormat)
					);
					dataset.push(item.value);
				});
				var AudioReceiveJitterChart = new Chart($('#cdr-AudioReceiveJitter'), {
					type: 'line',
					data: {
						labels: labelset,
						datasets: [
							{
								label: lang.receive_jitter,
								data: dataset,
								backgroundColor: 'rgba(0, 38, 168, 0.5)',
								borderColor: 'rgba(0, 38, 168, 1)',
								borderWidth: 1,
								pointRadius: 1,
							},
						],
					},
					options: ChatHistoryOptions,
				});

				// AudioReceiveLevelsChart
				var labelset = [];
				var dataset = [];
				var data =
					QosData0.ReceiveLevels.length > 0
						? QosData0.ReceiveLevels
						: QosData1.ReceiveLevels;
				$.each(data, function (i, item) {
					labelset.push(
						moment
							.utc(item.timestamp.replace(' UTC', ''))
							.local()
							.format(DisplayDateFormat + ' ' + DisplayTimeFormat)
					);
					dataset.push(item.value);
				});
				var AudioReceiveLevelsChart = new Chart($('#cdr-AudioReceiveLevels'), {
					type: 'line',
					data: {
						labels: labelset,
						datasets: [
							{
								label: lang.receive_audio_levels,
								data: dataset,
								backgroundColor: 'rgba(140, 0, 168, 0.5)',
								borderColor: 'rgba(140, 0, 168, 1)',
								borderWidth: 1,
								pointRadius: 1,
							},
						],
					},
					options: ChatHistoryOptions,
				});

				// SendPacketRateChart
				var labelset = [];
				var dataset = [];
				var data =
					QosData0.SendPacketRate.length > 0
						? QosData0.SendPacketRate
						: QosData1.SendPacketRate;
				$.each(data, function (i, item) {
					labelset.push(
						moment
							.utc(item.timestamp.replace(' UTC', ''))
							.local()
							.format(DisplayDateFormat + ' ' + DisplayTimeFormat)
					);
					dataset.push(item.value);
				});
				var SendPacketRateChart = new Chart($('#cdr-AudioSendPacketRate'), {
					type: 'line',
					data: {
						labels: labelset,
						datasets: [
							{
								label: lang.send_packets_per_second,
								data: dataset,
								backgroundColor: 'rgba(0, 121, 19, 0.5)',
								borderColor: 'rgba(0, 121, 19, 1)',
								borderWidth: 1,
								pointRadius: 1,
							},
						],
					},
					options: ChatHistoryOptions,
				});

				// AudioSendBitRateChart
				var labelset = [];
				var dataset = [];
				var data =
					QosData0.SendBitRate.length > 0
						? QosData0.SendBitRate
						: QosData1.SendBitRate;
				$.each(data, function (i, item) {
					labelset.push(
						moment
							.utc(item.timestamp.replace(' UTC', ''))
							.local()
							.format(DisplayDateFormat + ' ' + DisplayTimeFormat)
					);
					dataset.push(item.value);
				});
				var AudioSendBitRateChart = new Chart($('#cdr-AudioSendBitRate'), {
					type: 'line',
					data: {
						labels: labelset,
						datasets: [
							{
								label: lang.send_kilobits_per_second,
								data: dataset,
								backgroundColor: 'rgba(0, 121, 19, 0.5)',
								borderColor: 'rgba(0, 121, 19, 1)',
								borderWidth: 1,
								pointRadius: 1,
							},
						],
					},
					options: ChatHistoryOptions,
				});
			} else {
				console.warn('Result not expected', event.target.result);
			}
		};
	};
}
function DeleteQosData(buddy) {
	var indexedDB = window.indexedDB;
	var request = indexedDB.open('CallQosData');
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
		console.log('IndexDB connected to CallQosData');

		var IDB = event.target.result;
		if (IDB.objectStoreNames.contains('CallQos') == false) {
			console.warn('IndexDB CallQosData.CallQos does not exists');
			return;
		}
		IDB.onerror = function (event) {
			console.error('IndexDB Error:', event);
		};

		// Loop and Delete
		console.log('Deleting CallQosData: ', buddy);
		var transaction = IDB.transaction(['CallQos'], 'readwrite');
		var objectStore = transaction.objectStore('CallQos');
		var objectStoreGet = objectStore.index('buddy').getAll(buddy);

		objectStoreGet.onerror = function (event) {
			console.error('IndexDB Get Error:', event);
		};
		objectStoreGet.onsuccess = function (event) {
			if (event.target.result && event.target.result.length > 0) {
				// There sre some rows to delete
				$.each(event.target.result, function (i, item) {
					// console.log("Delete: ", item.uID);
					try {
						objectStore.delete(item.uID);
					} catch (e) {
						console.log('Call CallQosData Delete failed: ', e);
					}
				});
			}
		};
	};
}
