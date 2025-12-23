const databaseService = require('./database');

const dbTest = new databaseService('testNamespace', 120);

dbTest.set('testKey', 'testValue').then(() => {
    dbTest.get('testKey').then(value => {
        console.log('Retrieved value:', value);
    }).catch(err => {
        console.error('Error getting value:', err);
    });
}).catch(err => {
    console.error('Error setting value:', err);
});
