const Mysqli = require('mysqli');

let conn = new Mysqli({
    Host: 'localhost',
    post: 3306,
    user: 'mega_user',
    passwd: '12345',
    db:'mega_shop'
});

let db = conn.emit( false, '');

module.exports = {
    database : db
};

