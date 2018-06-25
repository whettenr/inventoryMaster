let express = require('express');
let mysql = require('mysql');
let router = express.Router();
let fs = require('fs');
let csv = require('fast-csv');
var cas = require('byu-cas');

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

let filters = [];
let employeeFilters = [];
let finalQuery = "";
/* GET home page. */
router.get('/employeesTable', function (req, res, next) {
    let database = new Database(config.getConfig());
    if(req.query.clear){
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
        .then(()=> {
            res.render('index', {title: 'Employees', employees: employees, filters: employeeFilters});
        })
        .catch(err => {
            throw(err);
        })
});

router.get('/computerTable', function (req, res, next) {
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
            res.render('computers', {title: 'Computers', computers: computers, filters: filters});
        })
        .catch(err => {
            console.log(err);
        });


});

router.get('/employees', function (req, res, next) {
    let database = new Database(config.getConfig());
    let employees = {};

    database.query('Select * FROM Employee WHERE EmployeeID < 88 OR (EmployeeID > 199 AND EmployeeID < 300) ORDER BY EmployeeID')
        .then(rows => {
            employees = rows;
        })
        .then(() => {
            res.render('employees', {title: 'Employees', employees: employees});

        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/otherSlots', function (req, res, next) {
    let database = new Database(config.getConfig());
    let employees = {};

    database.query('Select * FROM Employee WHERE EmployeeID >= 88 AND (EmployeeID <= 199 OR EmployeeID >= 300) ORDER BY EmployeeID')
        .then(rows => {
            employees = rows;
        })
        .then(() => {
            res.render('index', {title: 'Employees', employees: employees});

        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/card', function (req, res, next) {

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
            res.render('card', {
                employee: employeeRows[0],
                computers: computerRows,
                monitors: monitorRows,
                printers: printerRows,
                peripherals: peripheralRows
            })
        })
        .catch(err => {
            console.log(err);
        });


    // res.render('card')
});

router.get('/getModelOptions', function (req, res, next) {
    let Make = req.query.make;
    let database = new Database(config.getConfig());

    let modelOptions = {};

    database.query('SELECT DISTINCT Model FROM Computer WHERE Make = ? ORDER BY Model', [Make])
        .then(rows => {
            modelOptions = rows;
            modelOptions[modelOptions.length] = {Model: 'Add a New Option'};

            database.close();
        })
        .then(() => {
            res.render('getModelOptions', {modelOptions});
        })
        .catch(err => {
            console.log(err);
        })
});

router.get('/getPeripheralModelOptions', function (req, res, next) {
    let Make = req.query.make;
    let database = new Database(config.getConfig());

    let modelOptions = {};

    database.query('SELECT DISTINCT Model FROM Peripheral WHERE Make = ? ORDER BY Model', [Make])
        .then(rows => {
            modelOptions = rows;
            modelOptions[modelOptions.length] = {Model: 'Add a New Option'};

            database.close();
        })
        .then(() => {
            res.render('getModelOptions', {modelOptions});
        })
        .catch(err => {
            console.log(err);
        })
});

router.get('/item', function (req, res, next) {

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
            res.render('item', {title: 'Welcome', categories: categories, computer: computer[0]})
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/computer', function (req, res, next) {
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
            return database.query('Select FirstName, LastName FROM Employee WHERE EmployeeID = ' + EmployeeID)
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
                title: 'Welcome',
                makeOptions,
                modelOptions,
                employees,
                computer,
                typeOptions,
                hardware,
                employee,
                processorTypeOptions
            })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/monitor', function (req, res, next) {
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
            return database.query('Select FirstName, LastName FROM Employee WHERE EmployeeID = ' + EmployeeID)
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
                makeOptions,
                modelOptions,
                employees,
                monitor,
                employee,
            })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/printer', function (req, res, next) {
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
            return database.query('Select FirstName, LastName FROM Employee WHERE EmployeeID = ' + EmployeeID)
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
            })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/peripheral', function (req, res, next) {
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
            return database.query('Select FirstName, LastName FROM Employee WHERE EmployeeID = ' + EmployeeID)
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
            })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/newPeripheral', function (req, res, next) {
    let ICN = 0;
    let EmployeeID = parseInt(req.query.EmployeeID);
    let makeOptions = {};
    let modelOptions = {};
    let employees = {};
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
            return database.query('Select FirstName, LastName FROM Employee WHERE EmployeeID = ' + EmployeeID)
        })
        .then(rows => {
            employee = rows[0];
            return database.query('SELECT * FROM Peripheral ORDER BY ICN DESC LIMIT 1');
        })
        .then(rows => {
            ICN = rows[0].ICN + 1;
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
            res.render('newPeripheral', {
                ICN,
                EmployeeID,
                makeOptions,
                modelOptions,
                itemOptions,
                employees,
                employee,
            })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/newComputer', function (req, res, next) {
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
            return database.query('Select FirstName, LastName FROM Employee WHERE EmployeeID = ' + EmployeeID);
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
            return database.query('SELECT DISTINCT ProcessorType FROM hardware ORDER BY ProcessorType')
        })
        .then(rows => {
            processorTypeOptions = rows;
            processorTypeOptions[processorTypeOptions.length] = {ProcessorType: 'None'};
            processorTypeOptions[processorTypeOptions.length] = {ProcessorType: 'Add a New Option'};
            return database.query('SELECT DISTINCT ProcessorSpeed FROM hardware ORDER BY ProcessorSpeed')

        })
        .then(rows => {
            processorSpeedOptions = rows;
            processorSpeedOptions[processorSpeedOptions.length] = {ProcessorSpeed: 'None'};
            processorSpeedOptions[processorSpeedOptions.length] = {ProcessorSpeed: 'Add a New Option'};
            return database.query('SELECT DISTINCT Memory FROM hardware ORDER BY Memory')

        })
        .then(rows => {
            memoryOptions = rows;
            memoryOptions[memoryOptions.length] = {Memory: 'None'};
            memoryOptions[memoryOptions.length] = {Memory: 'Add a New Option'};
            return database.query('SELECT DISTINCT HardDrive FROM hardware ORDER BY HardDrive')

        })
        .then(rows => {
            hardDriveOptions = rows;
            hardDriveOptions[hardDriveOptions.length] = {HardDrive: 'None'};
            hardDriveOptions[hardDriveOptions.length] = {HardDrive: 'Add a New Option'};
            return database.query('SELECT DISTINCT VCName FROM hardware ORDER BY VCName')

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
                graphicsCardOptions
            })
        })
        .catch(err => {
            console.log(err);
        })
});

router.get('/newMonitor', function (req, res, next) {
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
            return database.query('Select FirstName, LastName FROM Employee WHERE EmployeeID = ' + EmployeeID)
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
                EmployeeID
            })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/download/rotation', function (req, res, next) {
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

router.post('/newComputer', function (req, res, next) {
    let database = new Database(config.getConfig());
    let hardwareId = -1;

    database.query('SELECT * FROM hardware WHERE ProcessorType = ? and ProcessorSpeed = ? and Memory = ? and HardDrive = ? and VCName = ?', [req.body.processorType, req.body.processorSpeed, req.body.memory, req.body.hardDrive, req.body.graphicsCard])
        .then(rows => {
            if (rows.length > 0) {
                hardwareId = rows[0].HardwareID;
            }
            else
                return database.query('INSERT INTO hardware (ProcessorType, ProcessorSpeed, Memory, HardDrive, VCName) VALUES (?)', [[req.body.processorType, req.body.processorSpeed, req.body.memory, req.body.hardDrive, req.body.graphicsCard]])
        })
        .then(rows => {
            if (hardwareId === -1) {
                hardwareId = rows.insertId;
            }
            return database.query("INSERT INTO Computer (ICN, EmployeeID, Make, Model, SerialNumber, ServiceTag, HardwareID, ExpressServiceCode, Type, DateAcquired, Warranty, HomeCheckout, Notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                [req.body.icn, req.body.EmployeeID, req.body.make, req.body.model, req.body.serialNumber, req.body.serviceTag, hardwareId, req.body.expressServiceCode, req.body.type, req.body.dateAcquired, req.body.warranty, req.body.homeCheckout, req.body.notes, req.body.icn])

        })
        .then(() => {
            return database.close();
        })
        .then(() => {
            res.redirect('/employees');

        })
        .catch(err => {
            console.log(err);
        });
});

router.post('/newMonitor', function (req, res, next) {
    let database = new Database(config.getConfig());

    database.query('INSERT INTO Monitor (ICN, EmployeeID, Item, Make, Model, Notes, SerialNumber, DateAcquired, Warranty, HomeCheckout) VALUES (?)', [[req.body.icn, req.body.EmployeeID, req.body.item, req.body.make, req.body.model, req.body.notes, req.body.serialNumber, req.body.dateAcquired, req.body.warranty, req.body.homeCheckout]])
        .then(rows => {
            if(rows)
                console.log(rows);
            return database.close();
        })
        .then(() => {
            res.redirect('/employees');

        })
        .catch(err => {
            console.log(err);
        });
});

router.post('/newPeripheral', function (req, res, next) {
    let database = new Database(config.getConfig());

    database.query('INSERT INTO Peripheral (ICN, EmployeeID, Item, Make, Model, Notes, SerialNumber, DateAcquired, Warranty, HomeCheckout) VALUES (?)', [[req.body.icn, req.body.employeeId, req.body.item, req.body.make, req.body.model, req.body.notes, req.body.serialNumber, req.body.dateAcquired, req.body.warranty, req.body.homeCheckout]])
        .then(rows => {
            if(rows){
                console.log(rows);
                console.log('INSERT INTO Peripheral (ICN, EmployeeID, Item, Make, Model, Notes, SerialNumber, DateAcquired, Warranty, HomeCheckout) VALUES (?,?,?,?,?,?,?,?,?,?)'+req.body.icn+req.body.employeeId+req.body.item+req.body.make+req.body.model+req.body.notes+req.body.serialNumber+req.body.dateAcquired+req.body.warranty+req.body.homeCheckout);
            }
            return database.close();
        })
        .then(() => {
            res.redirect('/employees');

        })
        .catch(err => {
            console.log(err);
        });
});

router.post('/form', function (req, res, next) {
    let database = new Database(config.getConfig());
    database.query("UPDATE Computer Set EmployeeID = ?, Make = ?, Model = ?, SerialNumber = ?, ServiceTag = ?, ExpressServiceCode = ?, Type = ?, DateAcquired = ?, Warranty = ?, HomeCheckout = ?, Notes = ? WHERE ICN = ?",
        [req.body.employeeId, req.body.make, req.body.model, req.body.serialNumber, req.body.serviceTag, req.body.expressServiceCode, req.body.type, req.body.dateAcquired, req.body.warranty, req.body.homeCheckout, req.body.notes, req.body.icn])
        .then(rows => {
            return database.close();
        })
        .then(() => {
            res.redirect('/employees');
        })
        .catch(err => {
            console.log(err);
        });
    // res.render('home', {title: 'Welcome', name: 'McKay'})
});

router.post('/monitor', function (req, res, next) {
    let database = new Database(config.getConfig());
    database.query("UPDATE Monitor SET EmployeeID = ?, Make = ?, Model = ?, DateAcquired = ?, Warranty = ?, HomeCheckout = ?, Notes = ?, History = ? WHERE ICN = ?",
        [req.body.employeeId, req.body.make, req.body.model, req.body.dateAcquired, req.body.warranty, req.body.homeCheckout, req.body.notes, req.body.history, req.body.icn])
        .then(rows => {
            return database.close();
        })
        .then(() => {
            res.redirect('/employees');
        })
        .catch(err => {
            console.log(err);
        });
    // res.render('home', {title: 'Welcome', name: 'McKay'})
});

router.post('/peripheral', function (req, res, next) {
    let database = new Database(config.getConfig());
    database.query("UPDATE Peripheral SET EmployeeID = ?, Item = ?, Make = ?, Model = ?, SerialNumber = ?, DateAcquired = ?, Warranty = ?, HomeCheckout = ?, Notes = ?, History = ? WHERE ICN = ?",
        [req.body.employeeId, req.body.item, req.body.make, req.body.model, req.body.serialNumber, req.body.dateAcquired, req.body.warranty, req.body.homeCheckout, req.body.notes, req.body.history, req.body.icn])
        .then(rows => {
            return database.close();
        })
        .then(() => {
            res.redirect('/employees');
        })
        .catch(err => {
            console.log(err);
        });
    // res.render('home', {title: 'Welcome', name: 'McKay'})
});

router.get('/', function (req, res, next) {
    res.render('home', {title: 'Welcome', name: 'McKay'})
});

router.get('/jsbSurplus', function (req, res, next) {
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
                employee: employeeRows[0],
                computers: computerRows,
                monitors: monitorRows,
                printers: printerRows,
                peripherals: peripheralRows
            })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/updateDates', function (req, res, next) {
    let database = new Database(config.getConfig());
    let employeeIds = {};
    database.query("SELECT EmployeeID FROM Employee")
        .then(rows => {
            employeeIds = rows;
            for(let i in employeeIds){
                console.log("SELECT DateAcquired FROM Computer WHERE EmployeeID = " + employeeIds[i].EmployeeID + " AND Type = 'On Rotation'");
            }
        })
        .catch(err => {
            console.log(err);
        });

    res.render('home', {title: 'Welcome', name: 'McKay'})
});

router.get('/test', function (req, res, next) {

    res.redirect('https://cas.byu.edu/login?service=' + encodeURIComponent('https://religion.byu.edu'));
});

router.get('/getTicket', function (req, res, next) {
    let ticket = req.body.ticket;
    res.redirect('/');
});

module.exports = router;
