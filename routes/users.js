'use strict';

module.exports = Users;

function Users() {
    const users = {};
    let possiblities = ['mmcourt', 'bquinlan'];
    users.create = function(netid, password, name, email) {
        console.log(netid);
    };

    users.authenticate = function(netid) {
      for(let i in possiblities){
        if(possiblities[i] === netid){
          return true;
        }
      }
        return false;
    };

    users.exists = function(netid) {
        console.log(netid);

    };

    users.getUser = function(netid) {
        console.log(netid);

    };

    return users;
}