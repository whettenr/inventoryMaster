let cas = require('byu-cas');
let config = require('../routes/config');
let location = config.getLocation();
let URL = config.getURL();
const axios = require('axios');

function checkUser(user) {
    if (location === '/inventory') {
        for (let i in user.memberOf) {
            if (user.memberOf[i] === 'RICHARD_CROOKSTON--RBC9') {
                return true;
            }
        }
        return false;
    }
    else {
        let possiblities = ['mmcourt', 'bquinlan', 'rbc9', 'mr28'];
        for (let i in possiblities) {
            if (possiblities[i] === user.netId) {
                return true;
            }
        }
        return false;
    }

}

module.exports = function (req, res, next) {
    if (req.path === '/getTicket') {
        let ticket = req.query.ticket;
        let goTo = req.query.goTo;
        // console.log("goto2: " + goTo);
        let service = URL + '/getTicket?goTo=' + goTo;
        let user = '';
        let query = req.query;
        // let count = 0;
        // for (let i in query) {
        //     if(count !== 0 && i !== 'ticket') {
        //         console.log(i);
        //         console.log(query[i]);
        //         service += '?' + i + '=' + query[i];
        //     }
        //     count++;
        // }
        cas.validate(ticket, service)
            .then(function success(response) {
                console.log("Ticket valid! Hello, " + response.username);
                user = response.attributes;
            })
            .then(() => {
                if (checkUser(user)) {
                    req.session.user = user;
                    req.session.cookie.user = user;
                    req.session.user.maxAge = 24 * 60 * 60 * 1000;
                    res.redirect(location + goTo);
                }
                else {
                    res.redirect(location + '/login');
                }
            })
            .catch(function error(e) {
                console.log("Invalid ticket. Error message was: " + e.message);
                // res.redirect(location + '/login');
            });
    }
    else {
        if (!req.session || !req.session.user) {
            let parameters = '';
            let query = req.query;
            let goTo = req.originalUrl;
            if (goTo = '/cas?goTo=') {
                goTo = '/';
            }
            for (let i in query) {
                console.log(i);
                console.log(query[i]);
                parameters += '?' + i + '=' + query[i];
            }
            // axios.get('https://cas.byu.edu/cas/login?service=' + encodeURIComponent(URL + '/getTicket?goTo=' + goTo)
            //     .then(function (response) {
            //         // handle success
            //         console.log(response);
            //     })
            //     .catch(function (error) {
            //         // handle error
            //         console.log(error);
            //     })
            //     .then(function () {
            //         // always executed
            //     });
            res.redirect('https://cas.byu.edu/cas/login?service=' + encodeURIComponent(URL + '/getTicket?goTo=' + goTo));
        }
        else {
            next();
        }
    }

};
