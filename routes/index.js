let express = require('express');
let mysql = require('mysql');
let router = express.Router();
let fs = require('fs');
let csv = require('fast-csv');
let cas = require('byu-cas');
let cookieParser = require('cookie-parser');
let LocalStrategy = require('passport-local').Strategy;
let passport = require('passport');
let session = require('express-session');
const bodyParser = require('body-parser');
// let users = require('./users')();
// let axios = require('axios');

class Database {
    constructor(config) {
        this.connection = mysql.createConnection(config);
    }

    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if (err)
                    return reject(err);
                resolve(rows);
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    }
}

let config = require('./config');
let URL = config.getURL();

let location = config.getLocation();


// router.set('trust proxy', 1);
router.use(session({secret: 'keyboard cat', cookie: {maxAge: 3600000}, resave: false, saveUninitialized: false}));

// router.use('/api/users',
//     bodyParser.urlencoded({ extended: true }),
//     bodyParser.json(),
//     userRouter);


let filters = [];
let monitorFilters = [];
let employeeFilters = [];
let printerFilters = [];
let finalQuery = "";

/* GET home page. */

function checkUser(user) {
    if(location === '/inventory'){
        for(let i in user.memberOf){
            if(user.memberOf[i] === 'RICHARD_CROOKSTON--RBC9'){
                return true;
            }
        }
        return false;
    }
    else{
        let possiblities = ['mmcourt', 'bquinlan', 'rbc9', 'mr28'];
        for (let i in possiblities) {
            if (possiblities[i] === user.netId) {
                return true;
            }
        }
        return false;
    }

}

router.get('/employeesTable', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/employeesTable');
    let database = new Database(config.getConfig());
    if (req.query.clear) {
        employeeFilters = [];
    }
    let query = 'Select * FROM Employee';
    if (req.query.remove) {
        let splice = parseInt(req.query.remove);
        employeeFilters.splice(splice, 1);
    }
    if (req.query.not) {
        if (employeeFilters[req.query.not].includes('!='))
            employeeFilters[req.query.not] = employeeFilters[req.query.not].replace('!=', '=');
        else
            employeeFilters[req.query.not] = employeeFilters[req.query.not].replace('=', '!=');
    }
    if (req.query.where) {
        let check = true;
        for (let i = 0; i < employeeFilters.length; i++) {
            if (employeeFilters[i] === req.query.where) {
                check = false;
            }
        }
        if (check) {
            employeeFilters.push(req.query.where);
        }
    }
    if (employeeFilters.length > 0) {
        query += " WHERE ";
        for (let filter in employeeFilters) {
            query += employeeFilters[filter];
            query += ' and ';
        }
        query = query.substr(0, query.length - 5);
    }


    if (req.query.sortby === 'employeeId') {
        query += ' Order BY EmployeeID';
    }
    else if (req.query.sortby === 'firstName') {
        query += ' ORDER BY FirstName';
    }
    else if (req.query.sortby === 'lastName') {
        query += ' ORDER BY LastName';
    }
    else if (req.query.sortby === 'rotationGroup') {
        query += ' ORDER BY RotationGroup';
    }
    else if (req.query.sortby === 'dateSwitched') {
        query += ' ORDER BY DateSwitched';
    }
    else {
        query += ' Order BY EmployeeID';
    }

    let employees = {};

    finalQuery = query;

    database.query(query)
        .then(rows => {
            employees = rows;
            // for(let i in employees){
            //     employees[i].DateSwitched = new Date(employees[i].DateSwitched);
            // }
            // console.log("test");
        })
        .then(() => {
            res.render('index', {
                title: 'Employees',
                employees: employees,
                filters: employeeFilters,
                user: req.session.user,
                location
            });
        })
        .catch(err => {
            throw(err);
        })
});

router.get('/computerTable', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/computerTable');
    let connection = mysql.createConnection(config.getConfig());
    let database = new Database(config.getConfig());
    let computers = {};

    let query = 'SELECT * FROM Computer LEFT JOIN Employee on Computer.EmployeeID = Employee.employeeId';
    if (req.query.remove) {
        let splice = parseInt(req.query.remove);
        filters.splice(splice, 1);

    }
    if (req.query.not) {
        if (filters[req.query.not].includes('!='))
            filters[req.query.not] = filters[req.query.not].replace('!=', '=');
        else
            filters[req.query.not] = filters[req.query.not].replace('=', '!=');
    }
    if (req.query.where) {
        let check = true;
        for (let i = 0; i < filters.length; i++) {
            if (filters[i] === req.query.where) {
                check = false;
            }
        }
        if (check) {
            filters.push(req.query.where);
        }
    }
    if (filters.length > 0) {
        query += " WHERE Computer.";
        for (let filter in filters) {
            query += filters[filter];
            query += ' and Computer.';
            console.log(filter);
        }
        query = query.substr(0, query.length - 14);
    }

    if (req.query.sortby === 'ICN') {
        query += ' Order BY ICN';
    }
    else if (req.query.sortby === 'EmployeeID') {
        query += ' ORDER BY EmployeeID';
    }
    else if (req.query.sortby === 'Make') {
        query += ' ORDER BY Make';
    }
    else if (req.query.sortby === 'firstName') {
        query += ' ORDER BY firstName';
    }
    else if (req.query.sortby === 'lastName') {
        query += ' ORDER BY lastName';
    }
    else {
        query += ' Order BY ICN';
    }
    console.log(query);


    database.query(query)
        .then(rows => {
            computers = rows;
        })
        .then(() => {
            res.render('computers', {
                title: 'Computers',
                computers: computers,
                filters: filters,
                user: req.session.user,
                location
            });
        })
        .catch(err => {
            console.log(err);
        });


});

router.get('/monitorsTable', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/monitorsTable');
    let connection = mysql.createConnection(config.getConfig());
    let database = new Database(config.getConfig());
    let monitors = {};

    let query = 'SELECT * FROM Monitor LEFT JOIN Employee on Monitor.EmployeeID = Employee.employeeId';
    if (req.query.remove) {
        let splice = parseInt(req.query.remove);
        monitorFilters.splice(splice, 1);

    }
    if (req.query.not) {
        if (monitorFilters[req.query.not].includes('!='))
            monitorFilters[req.query.not] = monitorFilters[req.query.not].replace('!=', '=');
        else
            monitorFilters[req.query.not] = monitorFilters[req.query.not].replace('=', '!=');
    }
    if (req.query.where) {
        let check = true;
        for (let i = 0; i < monitorFilters.length; i++) {
            if (monitorFilters[i] === req.query.where) {
                check = false;
            }
        }
        if (check) {
            monitorFilters.push(req.query.where);
        }
    }
    if (monitorFilters.length > 0) {
        query += " WHERE Monitor.";
        for (let filter in monitorFilters) {
            query += monitorFilters[filter];
            query += ' and Monitor.';
            console.log(filter);
        }
        query = query.substr(0, query.length - 13);
    }

    if (req.query.sortby === 'ICN') {
        query += ' Order BY ICN';
    }
    else if (req.query.sortby === 'EmployeeID') {
        query += ' ORDER BY EmployeeID';
    }
    else if (req.query.sortby === 'Make') {
        query += ' ORDER BY Make';
    }
    else if (req.query.sortby === 'Model') {
        query += ' ORDER BY Model';
    }
    else if (req.query.sortby === 'firstName') {
        query += ' ORDER BY firstName';
    }
    else if (req.query.sortby === 'lastName') {
        query += ' ORDER BY lastName';
    }
    else {
        query += ' Order BY ICN';
    }
    console.log(query);


    database.query(query)
        .then(rows => {
            monitors = rows;
        })
        .then(() => {
            res.render('monitorsTable', {
                title: 'Monitors',
                monitors: monitors,
                filters: monitorFilters,
                user: req.session.user,
                location
            });
        })
        .catch(err => {
            console.log(err);
        });


});

router.get('/printerTable', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/printerTable');
    let connection = mysql.createConnection(config.getConfig());
    let database = new Database(config.getConfig());
    let printers = {};

    let query = 'SELECT * FROM Printer LEFT JOIN Employee on Printer.EmployeeID = Employee.employeeId';
    if (req.query.remove) {
        let splice = parseInt(req.query.remove);
        printerFilters.splice(splice, 1);

    }
    if (req.query.not) {
        if (printerFilters[req.query.not].includes('!='))
            printerFilters[req.query.not] = printerFilters[req.query.not].replace('!=', '=');
        else
            printerFilters[req.query.not] = printerFilters[req.query.not].replace('=', '!=');
    }
    if (req.query.where) {
        let check = true;
        for (let i = 0; i < printerFilters.length; i++) {
            if (printerFilters[i] === req.query.where) {
                check = false;
            }
        }
        if (check) {
            printerFilters.push(req.query.where);
        }
    }
    if (printerFilters.length > 0) {
        query += " WHERE Monitor.";
        for (let filter in printerFilters) {
            query += printerFilters[filter];
            query += ' and Monitor.';
            console.log(filter);
        }
        query = query.substr(0, query.length - 13);
    }

    if (req.query.sortby === 'ICN') {
        query += ' Order BY ICN';
    }
    else if (req.query.sortby === 'EmployeeID') {
        query += ' ORDER BY EmployeeID';
    }
    else if (req.query.sortby === 'Make') {
        query += ' ORDER BY Make';
    }
    else if (req.query.sortby === 'Model') {
        query += ' ORDER BY Model';
    }
    else if (req.query.sortby === 'firstName') {
        query += ' ORDER BY firstName';
    }
    else if (req.query.sortby === 'lastName') {
        query += ' ORDER BY lastName';
    }
    else {
        query += ' Order BY ICN';
    }
    console.log(query);


    database.query(query)
        .then(rows => {
            printers = rows;
        })
        .then(() => {
            res.render('printerTable', {
                title: 'Printers',
                printers: printers,
                filters: printerFilters,
                user: req.session.user,
                location
            });
        })
        .catch(err => {
            console.log(err);
        });


});

router.get('/employees', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/employees');
    let database = new Database(config.getConfig());
    let employees = {};

    database.query('Select * FROM Employee WHERE EmployeeID < 88 OR (EmployeeID > 199 AND EmployeeID < 300) ORDER BY LastName')
        .then(rows => {
            employees = rows;
        })
        .then(() => {
            res.render('employees', {title: 'Employees', employees: employees, user: req.session.user, location});

        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/otherSlots', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/otherSlots');
    let database = new Database(config.getConfig());
    let employees = {};

    database.query('Select * FROM Employee WHERE EmployeeID >= 88 AND (EmployeeID <= 199 OR EmployeeID >= 300) ORDER BY EmployeeID')
        .then(rows => {
            employees = rows;
        })
        .then(() => {
            res.render('index', {title: 'Other Slots', employees: employees, user: req.session.user, location});

        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/card', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/card?employeeId=' + req.query.employeeId);
    let employeeId = req.query.employeeId;
    let employeeRows = {};
    let computerRows = {};
    let monitorRows = {};
    let printerRows = {};
    let peripheralRows = {};
    let employees;

    let database = new Database(config.getConfig());

    database.query('SELECT * FROM Employee WHERE employeeId = ' + employeeId)
        .then(rows => {
            employeeRows = rows;
            return database.query('SELECT * FROM Computer WHERE EmployeeId = ' + employeeId);
        })
        .then(rows => {
            computerRows = rows;
            return database.query('SELECT * FROM Monitor WHERE EmployeeId = ' + employeeId);
        })
        .then(rows => {
            monitorRows = rows;
            return database.query('SELECT * FROM Printer WHERE EmployeeId = ' + employeeId);
        })
        .then(rows => {
            printerRows = rows;
            return database.query('SELECT * FROM Peripheral WHERE EmployeeId = ' + employeeId);
        })
        .then(rows => {
            peripheralRows = rows;
            return database.close();
        })
        .then(() => {
            // do something with someRows and otherRows
            res.render('card', {
                employee: employeeRows[0],
                computers: computerRows,
                monitors: monitorRows,
                printers: printerRows,
                peripherals: peripheralRows,
                location,
                user: req.session.user,
                title: employeeRows[0].FirstName + ' ' + employeeRows[0].LastName + "'s Stuff"
            })
        })
        .catch(err => {
            console.log(err);
        });


    // res.render('card')
});

router.get('/getModelOptions', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/getModelOptions');
    let Type = req.query.type;
    let Make = req.query.make;
    let database = new Database(config.getConfig());

    let modelOptions = {};

    database.query('SELECT DISTINCT Model FROM ?? WHERE Make = ? ORDER BY Model', [Type, Make])
        .then(rows => {
            modelOptions = rows;
            modelOptions[modelOptions.length] = {Model: 'None'};
            modelOptions[modelOptions.length] = {Model: 'Add a New Option'};

            database.close();
        })
        .then(() => {
            res.render('getModelOptions', {modelOptions, location});
        })
        .catch(err => {
            console.log(err);
        })
});

router.get('/getProcessorOptions', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/getProcessorOptions');
    let Model = req.query.model;
    let database = new Database(config.getConfig());

    let processorOptions = {};

    database.query('SELECT DISTINCT ProcessorType FROM Computer LEFT JOIN Hardware ON Computer.HardwareID = Hardware.HardwareID WHERE Model = ?', [Model])
        .then(rows => {
            processorOptions = rows;
            processorOptions[processorOptions.length] = {ProcessorType: 'Add a New Option'};

            database.close();
        })
        .then(() => {
            res.render('getProcessorOptions', {processorOptions, location});
        })
        .catch(err => {
            console.log(err);
        })
});

router.get('/getProcessorSpeedOptions', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/getProcessorSpeedOptions');
    let ProcessorType = req.query.processorType;
    let database = new Database(config.getConfig());

    let processorSpeedOptions = {};

    database.query('SELECT DISTINCT ProcessorSpeed FROM Computer LEFT JOIN Hardware ON Computer.HardwareID = Hardware.HardwareID WHERE ProcessorType = ?', [ProcessorType])
        .then(rows => {
            processorSpeedOptions = rows;
            processorSpeedOptions[processorSpeedOptions.length] = {ProcessorSpeed: 'Add a New Option'};

            database.close();
        })
        .then(() => {
            res.render('getProcessorSpeedOptions', {processorSpeedOptions, location});
        })
        .catch(err => {
            console.log(err);
        })
});

router.get('/getMemoryOptions', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/getMemoryOptions');
    let Model = req.query.model;
    let database = new Database(config.getConfig());

    let memoryOptions = {};

    database.query('SELECT DISTINCT Memory FROM Computer LEFT JOIN Hardware ON Computer.HardwareID = Hardware.HardwareID WHERE Model = ?', [Model])
        .then(rows => {
            memoryOptions = rows;
            memoryOptions[memoryOptions.length] = {Memory: 'Add a New Option'};

            database.close();
        })
        .then(() => {
            res.render('getMemoryOptions', {memoryOptions, location});
        })
        .catch(err => {
            console.log(err);
        })
});

router.get('/getHardDriveOptions', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/getHardDriveOptions');
    let Model = req.query.model;
    let database = new Database(config.getConfig());

    let hardDriveOptions = {};

    database.query('SELECT DISTINCT HardDrive FROM Computer LEFT JOIN Hardware ON Computer.HardwareID = Hardware.HardwareID WHERE Model = ?', [Model])
        .then(rows => {
            hardDriveOptions = rows;
            hardDriveOptions[hardDriveOptions.length] = {HardDrive: 'Add a New Option'};

            database.close();
        })
        .then(() => {
            res.render('getHardDriveOptions', {hardDriveOptions, location});
        })
        .catch(err => {
            console.log(err);
        })
});

router.get('/getGraphicsCardOptions', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/getGraphicsCardOptions');
    let Model = req.query.model;
    let database = new Database(config.getConfig());

    let graphicsCardOptions = {};

    database.query('SELECT DISTINCT VCName FROM Computer LEFT JOIN Hardware ON Computer.HardwareID = Hardware.HardwareID WHERE Model = ?', [Model])
        .then(rows => {
            graphicsCardOptions = rows;
            graphicsCardOptions[graphicsCardOptions.length] = {VCName: 'Add a New Option'};

            database.close();
        })
        .then(() => {
            res.render('getGraphicsCardOptions', {graphicsCardOptions, location});
        })
        .catch(err => {
            console.log(err);
        })
});

router.get('/getPeripheralModelOptions', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/getPeripheralModelOptions');
    let Make = req.query.make;
    let database = new Database(config.getConfig());

    let modelOptions = {};

    database.query('SELECT DISTINCT Model FROM Peripheral WHERE Make = ? ORDER BY Model', [Make])
        .then(rows => {
            modelOptions = rows;
            modelOptions[modelOptions.length] = {Model: 'None'};
            modelOptions[modelOptions.length] = {Model: 'Add a New Option'};

            database.close();
        })
        .then(() => {
            res.render('getModelOptions', {modelOptions, location});
        })
        .catch(err => {
            console.log(err);
        })
});

router.get('/getItemOptions', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/getItemOptions');
    let Model = req.query.model;
    let database = new Database(config.getConfig());

    let itemOptions = {};

    database.query('SELECT DISTINCT Item FROM Peripheral WHERE Model = ? ORDER BY Item', [Model])
        .then(rows => {
            itemOptions = rows;
            itemOptions[itemOptions.length] = {Item: 'None'};
            itemOptions[itemOptions.length] = {Item: 'Add a New Option'};

            database.close();
        })
        .then(() => {
            res.render('getItemOptions', {itemOptions, location});
        })
        .catch(err => {
            console.log(err);
        })
});

router.get('/item', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/item');
    let ICN = 10540;
    let categories = {};
    let Computer = {};

    let database = new Database(config.getConfig());
    database.query('SHOW COLUMNS FROM Computer')
        .then(rows => {
            categories = rows;
            console.log(categories[0].Field);
            return database.query('SELECT * FROM Computer WHERE ICN = ' + ICN);
        })
        .then(rows => {
            computer = rows;
            console.log(computer[0]);
            return database.close();
        })
        .then(() => {
            res.render('item', {
                title: 'Welcome',
                categories: categories,
                computer: computer[0],
                user: req.session.user,
                location
            })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/computer', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/computer?EmployeeID' + req.query.EmployeeID + "&ICN=" + req.query.ICN);
    let ICN = req.query.ICN;
    let EmployeeID = req.query.EmployeeID;
    let makeOptions = {};
    let modelOptions = {};
    let employees = {};
    let typeOptions = {};
    let computer = {};
    let employee = {};
    let hardware = {};
    let processorTypeOptions = {};

    let database = new Database(config.getConfig());

    database.query('SELECT DISTINCT Make FROM Computer')
        .then(rows => {
            makeOptions = rows;
            return database.query('Select * FROM Employee ORDER BY LastName');
        })
        .then(rows => {
            employees = rows;
            return database.query('Select * FROM Employee WHERE EmployeeID = ' + EmployeeID)
        })
        .then(rows => {
            employee = rows[0];
            return database.query('Select DISTINCT Type FROM Computer');
        })
        .then(rows => {
            typeOptions = rows;
            return database.query('SELECT * FROM Computer WHERE ICN = ' + ICN);
        })
        .then(rows => {
            computer = rows[0];
            return database.query('SELECT DISTINCT Model FROM Computer');
        })
        .then(rows => {
            modelOptions = rows;
            return database.query('SELECT * FROM Hardware WHERE HardwareID = ' + computer.HardwareID);
        })
        .then(rows => {
            hardware = rows[0];
            return database.query('SELECT DISTINCT ProcessorType FROM Hardware ORDER BY ProcessorType')
        })
        .then(rows => {
            processorTypeOptions = rows;
            return database.close();
        })
        .then(() => {
            res.render('form', {
                title: employee.FirstName + " " + employee.LastName + "'s Computer",
                makeOptions,
                modelOptions,
                employees,
                computer,
                typeOptions,
                hardware,
                employee,
                processorTypeOptions,
                user: req.session.user,
                location
            })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/monitor', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/monitor?EmployeeID=' + req.query.EmployeeID + "&ICN=" + req.query.ICN);
    let ICN = req.query.ICN;
    let EmployeeID = req.query.EmployeeID;
    let makeOptions = {};
    let modelOptions = {};
    let employees = {};
    let monitor = {};
    let employee = {};

    let database = new Database(config.getConfig());

    database.query('SELECT DISTINCT Make FROM Monitor')
        .then(rows => {
            makeOptions = rows;
            return database.query('Select * FROM Employee ORDER BY LastName');
        })
        .then(rows => {
            employees = rows;
            return database.query('Select * FROM Employee WHERE EmployeeID = ' + EmployeeID)
        })
        .then(rows => {
            employee = rows[0];
            return database.query('SELECT * FROM Monitor WHERE ICN = ' + ICN);
        })
        .then(rows => {
            monitor = rows[0];
            return database.query('SELECT DISTINCT Model FROM Monitor');
        })
        .then(rows => {
            modelOptions = rows;
            return database.close();
        })
        .then(() => {
            res.render('monitor', {
                title: employee.FirstName + " " + employee.LastName + "'s Monitor",
                makeOptions,
                modelOptions,
                employees,
                monitor,
                employee,
                user: req.session.user,
                location
            })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/printer', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/printer?EmployeeID=' + req.query.EmployeeID + "&ICN=" + req.query.ICN);
    let ICN = req.query.ICN;
    let EmployeeID = req.query.EmployeeID;
    let makeOptions = {};
    let modelOptions = {};
    let employees = {};
    let printer = {};
    let employee = {};

    let database = new Database(config.getConfig());

    database.query('SELECT DISTINCT Make FROM Printer')
        .then(rows => {
            makeOptions = rows;
            return database.query('Select * FROM Employee ORDER BY LastName');
        })
        .then(rows => {
            employees = rows;
            return database.query('Select * FROM Employee WHERE EmployeeID = ' + EmployeeID)
        })
        .then(rows => {
            employee = rows[0];
            return database.query('SELECT * FROM Printer WHERE ICN = ' + ICN);
        })
        .then(rows => {
            printer = rows[0];
            return database.query('SELECT DISTINCT Model FROM Printer');
        })
        .then(rows => {
            modelOptions = rows;
            return database.close();
        })
        .then(() => {
            res.render('printer', {
                makeOptions,
                modelOptions,
                employees,
                printer,
                employee,
                user: req.session.user,
                location
            })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/peripheral', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/peripheral?EmployeeID=' + req.query.EmployeeID + "&ICN=" + req.query.ICN);
    let ICN = req.query.ICN;
    let EmployeeID = req.query.EmployeeID;
    let makeOptions = {};
    let modelOptions = {};
    let employees = {};
    let peripheral = {};
    let employee = {};
    let itemOptions = {};

    let database = new Database(config.getConfig());

    database.query('SELECT DISTINCT Make FROM Peripheral')
        .then(rows => {
            makeOptions = rows;
            return database.query('Select * FROM Employee ORDER BY LastName');
        })
        .then(rows => {
            employees = rows;
            return database.query('Select * FROM Employee WHERE EmployeeID = ' + EmployeeID)
        })
        .then(rows => {
            employee = rows[0];
            return database.query('SELECT * FROM Peripheral WHERE ICN = ' + ICN);
        })
        .then(rows => {
            peripheral = rows[0];
            return database.query('SELECT DISTINCT Model FROM Peripheral');
        })
        .then(rows => {
            modelOptions = rows;
            return database.query('SELECT DISTINCT Item FROM Peripheral')
        })
        .then(rows => {
            itemOptions = rows;
            return database.close();
        })
        .then(() => {
            res.render('peripheral', {
                makeOptions,
                modelOptions,
                itemOptions,
                employees,
                peripheral,
                employee,
                user: req.session.user,
                location
            })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/newPeripheral', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/newPeripheral?EmployeeID=' + req.query.EmployeeID);
    let ICN = 0;
    let EmployeeID = parseInt(req.query.EmployeeID);
    let makeOptions = {};
    let modelOptions = {};
    let employees = {};
    let employee = {};
    let itemOptions = {};

    let database = new Database(config.getConfig());

    database.query('SELECT DISTINCT Make FROM Peripheral ORDER BY Make')
        .then(rows => {
            makeOptions = rows;
            makeOptions[makeOptions.length] = {Make: 'None'};
            makeOptions[makeOptions.length] = {Make: 'Add a New Option'};
            return database.query('Select * FROM Employee ORDER BY LastName');
        })
        .then(rows => {
            employees = rows;
            return database.query('Select * FROM Employee WHERE EmployeeID = ' + EmployeeID)
        })
        .then(rows => {
            employee = rows[0];
            return database.query('SELECT * FROM Peripheral ORDER BY ICN DESC LIMIT 1');
        })
        .then(rows => {
            ICN = rows[0].ICN + 1;
            return database.query('SELECT DISTINCT Model FROM Peripheral ORDER BY Model');
        })
        .then(rows => {
            modelOptions = rows;
            return database.query('SELECT DISTINCT Item FROM Peripheral ORDER BY Item')
        })
        .then(rows => {
            itemOptions = rows;
            return database.close();
        })
        .then(() => {
            res.render('newPeripheral', {
                ICN,
                EmployeeID,
                makeOptions,
                modelOptions,
                itemOptions,
                employees,
                employee,
                user: req.session.user,
                location
            })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/newComputer', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/newComputer?EmployeeID=' + req.query.EmployeeID);
    let ICN = 0;
    let EmployeeID = parseInt(req.query.EmployeeID);
    let employee = {};
    let employees = {};
    let makeOptions = {};
    let modelOptions = {0: {Model: "Please choose a Make"}};
    let typeOptions = {};
    let processorTypeOptions = {};
    let processorSpeedOptions = {};
    let memoryOptions = {};
    let hardDriveOptions = {};
    let graphicsCardOptions = {};

    let database = new Database(config.getConfig());
    database.query('SELECT * FROM Computer ORDER BY ICN DESC LIMIT 1')
        .then(rows => {
            ICN = rows[0].ICN + 1;
            return database.query('Select * FROM Employee WHERE EmployeeID = ' + EmployeeID);
        })
        .then(rows => {
            employee = rows[0];
            return database.query('SELECT DISTINCT Make FROM Computer ORDER BY Make');
        })
        .then(rows => {
            makeOptions = rows;
            makeOptions[makeOptions.length] = {Make: 'None'};
            makeOptions[makeOptions.length] = {Make: 'Add a New Option'};
            // return database.query('SELECT DISTINCT Model FROM computer');
        })
        .then(rows => {
            // modelOptions = rows;
            return database.query('Select DISTINCT Type FROM Computer ORDER BY Type');
        })
        .then(rows => {
            typeOptions = rows;
            typeOptions[typeOptions.length] = {Type: 'None'};
            return database.query('Select * FROM Employee ORDER BY lastName');
        })
        .then(rows => {
            employees = rows;
            return database.query('SELECT DISTINCT ProcessorType FROM Hardware ORDER BY ProcessorType')
        })
        .then(rows => {
            processorTypeOptions = rows;
            processorTypeOptions[processorTypeOptions.length] = {ProcessorType: 'None'};
            processorTypeOptions[processorTypeOptions.length] = {ProcessorType: 'Add a New Option'};
            return database.query('SELECT DISTINCT ProcessorSpeed FROM Hardware ORDER BY ProcessorSpeed')

        })
        .then(rows => {
            processorSpeedOptions = rows;
            processorSpeedOptions[processorSpeedOptions.length] = {ProcessorSpeed: 'None'};
            processorSpeedOptions[processorSpeedOptions.length] = {ProcessorSpeed: 'Add a New Option'};
            return database.query('SELECT DISTINCT Memory FROM Hardware ORDER BY Memory')

        })
        .then(rows => {
            memoryOptions = rows;
            memoryOptions[memoryOptions.length] = {Memory: 'None'};
            memoryOptions[memoryOptions.length] = {Memory: 'Add a New Option'};
            return database.query('SELECT DISTINCT HardDrive FROM Hardware ORDER BY HardDrive')

        })
        .then(rows => {
            hardDriveOptions = rows;
            hardDriveOptions[hardDriveOptions.length] = {HardDrive: 'None'};
            hardDriveOptions[hardDriveOptions.length] = {HardDrive: 'Add a New Option'};
            return database.query('SELECT DISTINCT VCName FROM Hardware ORDER BY VCName')

        })
        .then(rows => {
            graphicsCardOptions = rows;
            graphicsCardOptions[graphicsCardOptions.length] = {VCName: 'None'};
            graphicsCardOptions[graphicsCardOptions.length] = {VCName: 'Add a New Option'};
            return database.close();
        })
        .then(() => {
            res.render('newComputer', {
                title: 'Welcome',
                makeOptions,
                modelOptions,
                typeOptions,
                employee,
                employees,
                ICN,
                EmployeeID,
                processorTypeOptions,
                processorSpeedOptions,
                memoryOptions,
                hardDriveOptions,
                graphicsCardOptions,
                user: req.session.user,
                location
            })
        })
        .catch(err => {
            console.log(err);
        })
});

router.get('/newMonitor', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/newMonitor?EmployeeID=' + req.query.EmployeeID);
    let ICN = 0;
    let EmployeeID = parseInt(req.query.EmployeeID);
    let makeOptions = {};
    let modelOptions = {};
    let employees = {};
    let monitor = {};
    let employee = {};

    let database = new Database(config.getConfig());

    database.query('SELECT DISTINCT Make FROM Monitor')
        .then(rows => {
            makeOptions = rows;
            return database.query('Select * FROM Employee ORDER BY LastName');
        })
        .then(rows => {
            employees = rows;
            return database.query('Select * FROM Employee WHERE EmployeeID = ' + EmployeeID)
        })
        .then(rows => {
            employee = rows[0];
            return database.query('SELECT DISTINCT Model FROM Monitor');
        })
        .then(rows => {
            modelOptions = rows;
            return database.query('SELECT * FROM Monitor ORDER BY ICN DESC LIMIT 1');
        })
        .then(rows => {
            ICN = rows[0].ICN + 1;
            return database.close();
        })
        .then(() => {
            res.render('newMonitor', {
                ICN,
                makeOptions,
                modelOptions,
                employees,
                employee,
                EmployeeID,
                user: req.session.user,
                location
            })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/download/rotation', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/download/rotation');
    let rotation = req.query.rotation;
    let Rows = {};

    let database = new Database(config.getConfig());
    database.query('SELECT employeeId, firstName, lastName, category, officeLocation, building, username, dateSwitched, notes FROM Employee WHERE rotationGroup = ' + rotation + ' ORDER BY employeeId;')
        .then(rows => {
            Rows = rows;
            return database.close();
        })
        .then(() => {
            let csvStream = csv.createWriteStream({headers: true}),
                writableStream = fs.createWriteStream("Rotation " + rotation + ".csv");

            writableStream.on("finish", function () {
                console.log("DONE!");
                let file = __dirname + '/../Rotation ' + rotation + '.csv';
                res.download(file);
            });

            csvStream.pipe(writableStream);
            for (let i = 0; i < Rows.length; i++) {
                csvStream.write(Rows[i]);
            }
            csvStream.end();
        })


});

router.get('/download/monitors', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/download/monitors');
    let Rows = {};
    let query = 'SELECT * FROM Monitor LEFT JOIN Employee on Monitor.EmployeeID = Employee.employeeId';
    if (req.query.remove) {
        let splice = parseInt(req.query.remove);
        monitorFilters.splice(splice, 1);

    }
    if (req.query.not) {
        if (monitorFilters[req.query.not].includes('!='))
            monitorFilters[req.query.not] = monitorFilters[req.query.not].replace('!=', '=');
        else
            monitorFilters[req.query.not] = monitorFilters[req.query.not].replace('=', '!=');
    }
    if (req.query.where) {
        let check = true;
        for (let i = 0; i < monitorFilters.length; i++) {
            if (monitorFilters[i] === req.query.where) {
                check = false;
            }
        }
        if (check) {
            monitorFilters.push(req.query.where);
        }
    }
    if (monitorFilters.length > 0) {
        query += " WHERE Monitor.";
        for (let filter in monitorFilters) {
            query += monitorFilters[filter];
            query += ' and Monitor.';
            console.log(filter);
        }
        query = query.substr(0, query.length - 13);
    }

    if (req.query.sortby === 'ICN') {
        query += ' Order BY ICN';
    }
    else if (req.query.sortby === 'EmployeeID') {
        query += ' ORDER BY EmployeeID';
    }
    else if (req.query.sortby === 'Make') {
        query += ' ORDER BY Make';
    }
    else if (req.query.sortby === 'firstName') {
        query += ' ORDER BY firstName';
    }
    else if (req.query.sortby === 'lastName') {
        query += ' ORDER BY lastName';
    }
    else {
        query += ' Order BY ICN';
    }
    let database = new Database(config.getConfig());

    database.query(query)
        .then(rows => {
            Rows = rows;
            return database.close();
        })
        .then(() => {
            let csvStream = csv.createWriteStream({headers: true}),
                writableStream = fs.createWriteStream("Monitors.csv");

            writableStream.on("finish", function () {
                console.log("DONE!");
                let file = __dirname + '/../bin/Monitors.csv';
                console.log(file);
                res.download(file);
            });

            csvStream.pipe(writableStream);
            for (let i = 0; i < Rows.length; i++) {
                csvStream.write(Rows[i]);
            }
            csvStream.end();
        })


});

router.get('/tables', function (req, res, next) {
    res.render('tables', {title: 'Tables', user: req.session.user, location})
});

router.get('/login', function (req, res) {
    res.render('login', {
        location
    });
});

router.get('/logout', function (req, res) {
    req.session.user = null;
    res.render('login', {
        location
    });
});

router.get('/', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/');
    let database = new Database(config.getConfig());
    if (req.query.clear) {
        employeeFilters = [];
    }
    let query = 'Select * FROM Employee';
    if (req.query.remove) {
        let splice = parseInt(req.query.remove);
        employeeFilters.splice(splice, 1);
    }
    if (req.query.not) {
        if (employeeFilters[req.query.not].includes('!='))
            employeeFilters[req.query.not] = employeeFilters[req.query.not].replace('!=', '=');
        else
            employeeFilters[req.query.not] = employeeFilters[req.query.not].replace('=', '!=');
    }
    if (req.query.where) {
        let check = true;
        for (let i = 0; i < employeeFilters.length; i++) {
            if (employeeFilters[i] === req.query.where) {
                check = false;
            }
        }
        if (check) {
            employeeFilters.push(req.query.where);
        }
    }
    if (employeeFilters.length > 0) {
        query += " WHERE ";
        for (let filter in employeeFilters) {
            query += employeeFilters[filter];
            query += ' and ';
        }
        query = query.substr(0, query.length - 5);
    }


    if (req.query.sortby === 'employeeId') {
        query += ' Order BY EmployeeID';
    }
    else if (req.query.sortby === 'firstName') {
        query += ' ORDER BY FirstName';
    }
    else if (req.query.sortby === 'lastName') {
        query += ' ORDER BY LastName';
    }
    else if (req.query.sortby === 'rotationGroup') {
        query += ' ORDER BY RotationGroup';
    }
    else if (req.query.sortby === 'dateSwitched') {
        query += ' ORDER BY DateSwitched';
    }
    else {
        query += ' Order BY EmployeeID';
    }

    let employees = {};

    finalQuery = query;

    database.query(query)
        .then(rows => {
            employees = rows;
            // for(let i in employees){
            //     employees[i].DateSwitched = new Date(employees[i].DateSwitched);
            // }
            // console.log("test");
        })
        .then(() => {
            res.render('index', {
                title: 'Welcome to Inventory',
                employees: employees,
                filters: employeeFilters,
                user: req.session.user,
                location
            });
        })
        .catch(err => {
            throw(err);
        })
});

// router.get('/undefined', function (req, res, next) {
//     res.redirect(location + '/');
// });

router.get('/jsbSurplus', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/jsbSurplus');
    let employeeId = 300;
    let employeeRows = {};
    let computerRows = {};
    let monitorRows = {};
    let printerRows = {};
    let peripheralRows = {};
    let employees;

    let database = new Database(config.getConfig());

    database.query('SELECT * FROM Employee WHERE employeeId = ' + employeeId)
        .then(rows => {
            employeeRows = rows;
            return database.query('SELECT * FROM Computer WHERE EmployeeId = ' + employeeId);
        })
        .then(rows => {
            computerRows = rows;
            return database.query('SELECT * FROM Monitor WHERE EmployeeId = ' + employeeId)
        })
        .then(rows => {
            monitorRows = rows;
            return database.query('SELECT * FROM Printer WHERE EmployeeId = ' + employeeId)
        })
        .then(rows => {
            printerRows = rows;
            return database.query('SELECT * FROM Peripheral WHERE EmployeeId = ' + employeeId)
        })
        .then(rows => {
            peripheralRows = rows;
            return database.close();
        })
        .then(() => {
            // do something with someRows and otherRows
            res.render('jsbSurplus', {
                title: 'JSB Storage',
                employee: employeeRows[0],
                computers: computerRows,
                monitors: monitorRows,
                printers: printerRows,
                peripherals: peripheralRows,
                user: req.session.user,
                location
            })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/updateDates', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/');
    let database = new Database(config.getConfig());
    let datesAcquired = {};
    database.query("SELECT DISTINCT DateAcquired FROM Computer")
        .then(rows => {
            datesAcquired = rows;
            for (let i in datesAcquired) {
                if (datesAcquired[i].DateAcquired) {
                    let dateArray = new Date(datesAcquired[i].DateAcquired);
                    let year = "";
                    let month = dateArray.getMonth() + 1;
                    let day = dateArray.getUTCDay();

                    // if (dateArray.getFullYear() === 2)
                    //     year = "20" + dateArray.getFullYear();
                    // else
                    //     year = dateArray.getFullYear();
                    if (month.toString().length === 1)
                        month = "0" + month;
                    if (day.toString().length === 1)
                        day = "0" + day;

                    let newDate = dateArray.getFullYear() + '-' + month + '-' + day;
                    console.log("UPDATE Computer SET DateAcquired = '" + newDate + "' WHERE DateAcquired = '" + datesAcquired[i].DateAcquired + "';");
                }
            }
        })
        .catch(err => {
            console.log(err);
        });

    res.render('home', {title: 'Welcome', user: 'McKay'})
});

router.get('/cas', function (req, res, next) {
    let goTo = req.query.goTo;
    console.log("goto1: " + goTo);
    res.redirect('https://cas.byu.edu/cas/login?service=' + encodeURIComponent(URL + '/getTicket?goTo=' + goTo));
});

router.get('/search', function (req, res, next) {
    console.log(req.query.searchTerms);
    let searchTerms = "%" + req.query.searchTerms + "%";
    let database = new Database(config.getConfig());
    let employeeRows = {};
    let computerRows = {};
    let monitorRows = {};
    let printerRows = {};
    let peripheralRows = {};
    database.query("SELECT * FROM Employee WHERE FirstName LIKE ? OR LastName LIKE ? OR Notes LIKE ?", [searchTerms, searchTerms, searchTerms])
        .then(rows => {
            employeeRows = rows;
            console.log(rows);
            return database.query("SELECT * FROM Computer JOIN Hardware ON Computer.HardwareID = Hardware.HardwareID WHERE Computer.ICN LIKE ? OR Computer.SerialNumber LIKE ? OR Computer.Make LIKE ? OR Computer.Model LIKE ? OR Computer.Type LIKE ? OR Computer.NOTES LIKE ? OR Hardware.ProcessorType LIKE ? OR Hardware.ProcessorSpeed LIKE ? OR Hardware.HardDrive LIKE ? OR Hardware.VCName LIKE ?", [searchTerms, searchTerms, searchTerms, searchTerms, searchTerms, searchTerms, searchTerms, searchTerms, searchTerms, searchTerms])
        })
        .then(rows => {
            console.log(rows);
            computerRows = rows;
            return database.query('SELECT * FROM Monitor WHERE ICN LIKE ? OR SerialNumber LIKE ? OR Make LIKE ? OR Model LIKE ? OR NOTES LIKE ?', [searchTerms, searchTerms, searchTerms, searchTerms, searchTerms])
        })
        .then(rows => {
            monitorRows = rows;
            console.log(rows);
            return database.query('SELECT * FROM Printer WHERE ICN LIKE ? OR SerialNumber LIKE ? OR Make LIKE ? OR Model LIKE ? OR NOTES LIKE ?', [searchTerms, searchTerms, searchTerms, searchTerms, searchTerms])
        })
        .then(rows => {
            printerRows = rows;
            console.log(rows);
            return database.query('SELECT * FROM Peripheral WHERE ICN LIKE ? OR SerialNumber LIKE ? OR Make LIKE ? OR Model LIKE ? OR NOTES LIKE ?', [searchTerms, searchTerms, searchTerms, searchTerms, searchTerms])
        })
        .then(rows => {
            peripheralRows = rows;
            return database.close();
        })
        .then(() =>{
            if(employeeRows.length === 1){
                res.redirect(location + '/card?employeeId=' + employeeRows[0].EmployeeID);
            }
            else if(computerRows.length === 1 && !employeeRows.length && !monitorRows.length && !printerRows.length && !peripheralRows.length){
                res.redirect(location + '/computer?ICN=' + computerRows[0].ICN + "&EmployeeID=" + computerRows[0].EmployeeID);
            }
            else if(monitorRows.length === 1 && !employeeRows.length && !computerRows.length && !printerRows.length && !peripheralRows.length){
                res.redirect(location + '/monitor?ICN=' + monitorRows[0].ICN + "&EmployeeID=" + monitorRows[0].EmployeeID);
            }
            else if(printerRows.length === 1 && !employeeRows.length && !computerRows.length && !monitorRows.length && !peripheralRows.length){
                res.redirect(location + '/printer?ICN=' + printerRows[0].ICN + "&EmployeeID=" + printerRows[0].EmployeeID);
            }
            else if(peripheralRows.length === 1 && !employeeRows.length && !computerRows.length && !monitorRows.length && !printerRows.length){
                res.redirect(location + '/peripheral?ICN=' + peripheralRows[0].ICN + "&EmployeeID=" + peripheralRows[0].EmployeeID);
            }
        })
        .then(() => {
            res.render('card', {
                employees: employeeRows,
                computers: computerRows,
                monitors: monitorRows,
                printers: printerRows,
                peripherals: peripheralRows,
                location,
                user: req.session.user,
                title: "Search: " + req.query.searchTerms
            })
        })
        .catch(err => {
            console.log(err);
        });


});

router.get('/getTicket', function (req, res, next) {
    let ticket = req.query.ticket;
    let goTo = req.query.goTo;
    console.log("goto2: " + goTo);
    let service = URL + '/getTicket?goTo=' + goTo;
    let user = '';
    cas.validate(ticket, service)
        .then(function success(response) {
        console.log("Ticket valid! Hello, " + response.username);
        user = response.attributes;
        // console.dir(response.attributes);
        })
        .then(() => {
            if (checkUser(user)) {
                req.session.user = user;
                res.redirect(goTo);
            }
            else {
                res.redirect(location + '/login');
            }
        })
        .catch(function error(e) {
            console.log("Invalid ticket. Error message was: " + e.message);
            res.redirect(location + '/login');
        });


});

router.post('/newComputer', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/');
    let database = new Database(config.getConfig());
    let hardwareId = -1;

    database.query('SELECT * FROM Hardware WHERE ProcessorType = ? and ProcessorSpeed = ? and Memory = ? and HardDrive = ? and VCName = ?', [req.body.processorType, req.body.processorSpeed, req.body.memory, req.body.hardDrive, req.body.graphicsCard])
        .then(rows => {
            if (rows.length > 0) {
                hardwareId = rows[0].HardwareID;
            }
            else
                return database.query('INSERT INTO Hardware (ProcessorType, ProcessorSpeed, Memory, HardDrive, VCName) VALUES (?)', [[req.body.processorType, req.body.processorSpeed, req.body.memory, req.body.hardDrive, req.body.graphicsCard]])
        })
        .then(rows => {
            if (hardwareId === -1) {
                hardwareId = rows.insertId;
            }
            return database.query("INSERT INTO Computer (ICN, EmployeeID, Make, Model, SerialNumber, ServiceTag, HardwareID, ExpressServiceCode, Type, DateAcquired, Warranty, HomeCheckout, Notes, History) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                [req.body.icn, req.body.EmployeeID, req.body.make, req.body.model, req.body.serialNumber, req.body.serviceTag, hardwareId, req.body.expressServiceCode, req.body.type, req.body.dateAcquired, req.body.warranty, req.body.homeCheckout, req.body.notes, ""])

        })
        .then(() => {
            return database.close();
        })
        .then(() => {
            res.redirect(location + '/card?employeeId='+req.body.EmployeeID);

        })
        .catch(err => {
            console.log(err);
        });
});

router.post('/newMonitor', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/');
    let database = new Database(config.getConfig());

    database.query('INSERT INTO Monitor (ICN, EmployeeID, Make, Model, Notes, SerialNumber, DateAcquired, Warranty, HomeCheckout) VALUES (?)', [[req.body.icn, req.body.employeeId, req.body.make, req.body.model, req.body.notes, req.body.serialNumber, req.body.dateAcquired, req.body.warranty, req.body.homeCheckout]])
        .then(rows => {
            if (rows)
                console.log(rows);
            return database.close();
        })
        .then(() => {
            res.redirect(location + '/card?employeeId='+req.body.employeeId);

        })
        .catch(err => {
            console.log(err);
        });
});

router.post('/newPeripheral', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/');
    let database = new Database(config.getConfig());

    database.query('INSERT INTO Peripheral (ICN, EmployeeID, Item, Make, Model, Notes, SerialNumber, DateAcquired, Warranty, HomeCheckout, History) VALUES (?)', [[req.body.icn, req.body.employeeId, req.body.item, req.body.make, req.body.model, req.body.notes, req.body.serialNumber, req.body.dateAcquired, req.body.warranty, req.body.homeCheckout, ""]])
        .then(rows => {
            if (rows) {
                console.log(rows);
                console.log('INSERT INTO Peripheral (ICN, EmployeeID, Item, Make, Model, Notes, SerialNumber, DateAcquired, Warranty, HomeCheckout, History) VALUES (?,?,?,?,?,?,?,?,?,?,?)' + req.body.icn + req.body.employeeId + req.body.item + req.body.make + req.body.model + req.body.notes + req.body.serialNumber + req.body.dateAcquired + req.body.warranty + req.body.homeCheckout, "");
            }
            return database.close();
        })
        .then(() => {
            res.redirect(location + '/card?employeeId='+req.body.employeeId);

        })
        .catch(err => {
            console.log(err);
        });
});

router.post('/form', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/');
    let database = new Database(config.getConfig());
    database.query("UPDATE Computer Set EmployeeID = ?, Make = ?, Model = ?, SerialNumber = ?, ServiceTag = ?, ExpressServiceCode = ?, Type = ?, DateAcquired = ?, Warranty = ?, HomeCheckout = ?, Notes = ?, History = ? WHERE ICN = ?",
        [req.body.employeeId, req.body.make, req.body.model, req.body.serialNumber, req.body.serviceTag, req.body.expressServiceCode, req.body.type, req.body.dateAcquired, req.body.warranty, req.body.homeCheckout, req.body.notes, req.body.history, req.body.icn])
        .then(rows => {
            return database.close();
        })
        .then(() => {
            res.redirect(location + '/card?employeeId='+req.body.employeeId);
        })
        .catch(err => {
            console.log(err);
        });
    // res.render('home', {title: 'Welcome', user: 'McKay'})
});

router.post('/monitor', function (req, res, next) {
    console.log(req.session.user);
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/');
    let database = new Database(config.getConfig());
    database.query("UPDATE Monitor SET EmployeeID = ?, Make = ?, Model = ?, DateAcquired = ?, Warranty = ?, HomeCheckout = ?, Notes = ?, History = ? WHERE ICN = ?",
        [req.body.employeeId, req.body.make, req.body.model, req.body.dateAcquired, req.body.warranty, req.body.homeCheckout, req.body.notes, req.body.history, req.body.icn])
        .then(rows => {
            console.log(rows);
            return database.close();
        })
        .then(() => {
            res.redirect(location + '/card?employeeId='+req.body.employeeId);
        })
        .catch(err => {
            console.log(err);
        });
    // res.render('home', {title: 'Welcome', user: 'McKay'})
});

router.post('/peripheral', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/');
    let database = new Database(config.getConfig());
    database.query("UPDATE Peripheral SET EmployeeID = ?, Item = ?, Make = ?, Model = ?, SerialNumber = ?, DateAcquired = ?, Warranty = ?, HomeCheckout = ?, Notes = ?, History = ? WHERE ICN = ?",
        [req.body.employeeId, req.body.item, req.body.make, req.body.model, req.body.serialNumber, req.body.dateAcquired, req.body.warranty, req.body.homeCheckout, req.body.notes, req.body.history, req.body.icn])
        .then(rows => {
            return database.close();
        })
        .then(() => {
            res.redirect(location + '/card?employeeId='+req.body.employeeId);
        })
        .catch(err => {
            console.log(err);
        });
    // res.render('home', {title: 'Welcome', user: 'McKay'})
});

router.post('/printer', function (req, res, next) {
    if (!req.session.user)
        res.redirect(location + '/cas?goTo=' + location + '/');
    let database = new Database(config.getConfig());
    database.query("UPDATE Printer SET EmployeeID = ?, LesOlsonID = ?, Make = ?, Model = ?, SerialNumber = ?, DateAcquired = ?, Warranty = ?, Notes = ?, History = ? WHERE ICN = ?",
        [req.body.employeeId, req.body.lesOlsonId, req.body.make, req.body.model, req.body.serialNumber, req.body.dateAcquired, req.body.warranty, req.body.notes, req.body.history, req.body.icn])
        .then(rows => {
            return database.close();
        })
        .then(() => {
            res.redirect(location + '/card?employeeId='+req.body.employeeId);
        })
        .catch(err => {
            console.log(err);
        });
    // res.render('home', {title: 'Welcome', user: 'McKay'})
});


module.exports = router;
