const db = require('./utils/db');
const { fetchBoobs, fetchAss } = require('./utils/api');

async function runTests() {
    console.log('Testing DB...');
    db.set('testKey', 'testValue');
    console.log('DB Set testKey:', db.get('testKey') === 'testValue' ? 'PASS' : 'FAIL');
    db.delete('testKey');
    console.log('DB Delete testKey:', db.has('testKey') === false ? 'PASS' : 'FAIL');

    console.log('Testing APIs...');
    const b = await fetchBoobs(1);
    console.log('Boobs API get 1:', b ? 'PASS' : 'FAIL', b);

    const a = await fetchAss(1);
    console.log('Ass API get 1:', a ? 'PASS' : 'FAIL', a);
}

runTests();
