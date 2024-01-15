// Utilities
// =========
function uID() {
	return (
		Date.now() +
		Math.floor(Math.random() * 10000)
			.toString(16)
			.toUpperCase()
	);
}
function utcDateNow() {
	return moment().utc().format('YYYY-MM-DD HH:mm:ss UTC');
}
function getDbItem(itemIndex, defaultValue) {
	var localDB = window.localStorage;
	if (localDB.getItem(itemIndex) != null) return localDB.getItem(itemIndex);
	return defaultValue;
}
function getAudioSrcID() {
	var id = localDB.getItem('AudioSrcId');
	return id != null ? id : 'default';
}
function getAudioOutputID() {
	var id = localDB.getItem('AudioOutputId');
	return id != null ? id : 'default';
}
function getVideoSrcID() {
	var id = localDB.getItem('VideoSrcId');
	return id != null ? id : 'default';
}
function getRingerOutputID() {
	var id = localDB.getItem('RingerOutputId');
	return id != null ? id : 'default';
}
function formatDuration(seconds) {
	var sec = Math.floor(parseFloat(seconds));
	if (sec < 0) {
		return sec;
	} else if (sec >= 0 && sec < 60) {
		return sec + ' ' + (sec > 1 ? lang.seconds_plural : lang.second_single);
	} else if (sec >= 60 && sec < 60 * 60) {
		// greater then a minute and less then an hour
		var duration = moment.duration(sec, 'seconds');
		return (
			duration.minutes() +
			' ' +
			(duration.minutes() > 1 ? lang.minutes_plural : lang.minute_single) +
			' ' +
			duration.seconds() +
			' ' +
			(duration.seconds() > 1 ? lang.seconds_plural : lang.second_single)
		);
	} else if (sec >= 60 * 60 && sec < 24 * 60 * 60) {
		// greater than an hour and less then a day
		var duration = moment.duration(sec, 'seconds');
		return (
			duration.hours() +
			' ' +
			(duration.hours() > 1 ? lang.hours_plural : lang.hour_single) +
			' ' +
			duration.minutes() +
			' ' +
			(duration.minutes() > 1 ? lang.minutes_plural : lang.minute_single) +
			' ' +
			duration.seconds() +
			' ' +
			(duration.seconds() > 1 ? lang.seconds_plural : lang.second_single)
		);
	}
	//  Otherwise.. this is just too long
}
function formatShortDuration(seconds) {
	var sec = Math.floor(parseFloat(seconds));
	if (sec < 0) {
		return sec;
	} else if (sec >= 0 && sec < 60) {
		return '00:' + (sec > 9 ? sec : '0' + sec);
	} else if (sec >= 60 && sec < 60 * 60) {
		// greater then a minute and less then an hour
		var duration = moment.duration(sec, 'seconds');
		return (
			(duration.minutes() > 9 ? duration.minutes() : '0' + duration.minutes()) +
			':' +
			(duration.seconds() > 9 ? duration.seconds() : '0' + duration.seconds())
		);
	} else if (sec >= 60 * 60 && sec < 24 * 60 * 60) {
		// greater than an hour and less then a day
		var duration = moment.duration(sec, 'seconds');
		return (
			(duration.hours() > 9 ? duration.hours() : '0' + duration.hours()) +
			':' +
			(duration.minutes() > 9 ? duration.minutes() : '0' + duration.minutes()) +
			':' +
			(duration.seconds() > 9 ? duration.seconds() : '0' + duration.seconds())
		);
	}
	//  Otherwise.. this is just too long
}
function formatBytes(bytes, decimals) {
	if (bytes === 0) return '0 ' + lang.bytes;
	var k = 1024;
	var dm = decimals && decimals >= 0 ? decimals : 2;
	var sizes = [
		lang.bytes,
		lang.kb,
		lang.mb,
		lang.gb,
		lang.tb,
		lang.pb,
		lang.eb,
		lang.zb,
		lang.yb,
	];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
function UserLocale() {
	var language = window.navigator.userLanguage || window.navigator.language; // "en", "en-US", "fr", "fr-FR", "es-ES", etc.
	// langtag = language["-"script]["-" region] *("-" variant) *("-" extension) ["-" privateuse]
	// TODO Needs work
	langtag = language.split('-');
	if (langtag.length == 1) {
		return '';
	} else if (langtag.length == 2) {
		return langtag[1].toLowerCase(); // en-US => us
	} else if (langtag.length >= 3) {
		return langtag[1].toLowerCase(); // en-US => us
	}
}
function GetAlternateLanguage() {
	var userLanguage = window.navigator.userLanguage || window.navigator.language; // "en", "en-US", "fr", "fr-FR", "es-ES", etc.
	// langtag = language["-"script]["-" region] *("-" variant) *("-" extension) ["-" privateuse]
	if (Language != 'auto') userLanguage = Language;
	userLanguage = userLanguage.toLowerCase();
	if (userLanguage == 'en' || userLanguage.indexOf('en-') == 0) return ''; // English is already loaded

	for (l = 0; l < availableLang.length; l++) {
		if (userLanguage.indexOf(availableLang[l].toLowerCase()) == 0) {
			console.log('Alternate Language detected: ', userLanguage);
			// Set up Moment with the same langugae settings
			moment.locale(userLanguage);
			return availableLang[l].toLowerCase();
		}
	}
	return '';
}
function getFilter(filter, keyword) {
	if (
		filter.indexOf(',', filter.indexOf(keyword + ': ') + keyword.length + 2) !=
		-1
	) {
		return filter.substring(
			filter.indexOf(keyword + ': ') + keyword.length + 2,
			filter.indexOf(',', filter.indexOf(keyword + ': ') + keyword.length + 2)
		);
	} else {
		return filter.substring(
			filter.indexOf(keyword + ': ') + keyword.length + 2
		);
	}
}
function base64toBlob(base64Data, contentType) {
	if (base64Data.indexOf(',' != -1)) base64Data = base64Data.split(',')[1]; // [data:image/png;base64] , [xxx...]
	var byteCharacters = atob(base64Data);
	var slicesCount = Math.ceil(byteCharacters.length / 1024);
	var byteArrays = new Array(slicesCount);
	for (var s = 0; s < slicesCount; ++s) {
		var begin = s * 1024;
		var end = Math.min(begin + 1024, byteCharacters.length);
		var bytes = new Array(end - begin);
		for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
			bytes[i] = byteCharacters[offset].charCodeAt(0);
		}
		byteArrays[s] = new Uint8Array(bytes);
	}
	return new Blob(byteArrays, { type: contentType });
}
function MakeDataArray(defaultValue, count) {
	var rtnArray = new Array(count);
	for (var i = 0; i < rtnArray.length; i++) {
		rtnArray[i] = defaultValue;
	}
	return rtnArray;
}
