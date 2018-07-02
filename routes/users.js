'use strict';

module.exports = Users;

function Users() {
    const users = {};
    let possiblities = ['mmcourt', 'bquinlan'];
    users.create = async function(netid, password, name, email) {
        console.log(netid);
    };

    users.authenticate = async function(netid) {
      for(let i in possiblities){
        if(possiblities[i] === netid){
          return true;
        }
      }
        return false;
    };

    users.exists = async function(netid) {
        console.log(netid);

    };

    users.getUser = async function(netid) {
        console.log(netid);

    };

    return users;
}