const { Platform } = require('react-native');

if (Platform.OS === 'android') {
    require('./src/widgets/remote-processing/model/androidBatchService').registerAndroidBatchService();
    if (process.env.EXPO_PUBLIC_TRANSLATION_SERVICE_PROBE === 'true') {
        require('./test-support/androidTranslationServiceProbe').runProbe();
    }
}
require('expo-router/entry');
