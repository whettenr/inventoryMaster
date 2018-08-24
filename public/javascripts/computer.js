function goBack() {
    $("#cardInfo").css('display', 'block');
    $("#computerInfo").css('display', 'none');
}
function showMain() {
    $("#mainInfo").css('display', 'block');
    $("#otherInfo").css('display', 'none');
    $("#hardwareInfo").css('display', 'none');
}
function showOther() {
    $("#mainInfo").css('display', 'none');
    $("#otherInfo").css('display', 'block');
    $("#hardwareInfo").css('display', 'none');
    $("#showOtherInfo").css('display', 'none');
    $("#showHardwareInfo").css('display', 'block');

}
function showHardware() {
    $("#mainInfo").css('display', 'none');
    $("#otherInfo").css('display', 'none');
    $("#hardwareInfo").css('display', 'block');
    $("#showHardwareInfo").css('display', 'none');
    $("#submit").css('display', 'block');

}
function newModel() {
    if($("#model").val() === "Add a New Option") {
        let model = prompt("New Model:");
        if (model !== null && model !== "") {
            console.log(model);
            $("#model").append(new Option(model, model));
            $("#model").val(model);
        }
    }
    else {
        $.ajax({
            type: "GET",
            url: "#{location}/getProcessorOptions?model=" + $("#model").val(),
            data: {format: 'html'}
        }).done(function (data) {
            $("#processorType").html(data);
            newProcessorType();
            newProcessorSpeed();
            newMemory();
            newHardDrive();
        });
    }
}
function newProcessorType() {
    if ($("#processorType").val() === "Add a New Option") {
        let add = prompt("New Processor Type:");
        if (add !== null && add !== "") {
            console.log(add);
            $("#processorType").append(new Option(add, add));
            $("#processorType").val(add);
        }
    }
    else {
        $.ajax({
            type: "GET",
            url: "#{location}/getProcessorSpeedOptions?processorType=" + $("#processorType").val(),
            data: {format: 'html'}
        }).done(function (data) {
            $("#processorSpeed").html(data);
        });
    }
}
function newProcessorSpeed() {
    if ($("#processorSpeed").val() === "Add a New Option") {
        let add = prompt("New Processor Speed:");
        if (add !== null && add !== "") {
            console.log(add);
            $("#processorSpeed").append(new Option(add, add));
            $("#processorSpeed").val(add);
        }
    }
    else {
        $.ajax({
            type: "GET",
            url: "#{location}/getMemoryOptions?model=" + $("#model").val(),
            data: {format: 'html'}
        }).done(function (data) {
            $("#memory").html(data);
        });
    }
}
function newMemory() {
    if ($("#memory").val() === "Add a New Option") {
        let add = prompt("New Memory:");
        if (add !== null && add !== "") {
            console.log(add);
            $("#memory").append(new Option(add, add));
            $("#memory").val(add);
        }
    }
    else {
        $.ajax({
            type: "GET",
            url: "#{location}/getHardDriveOptions?model=" + $("#model").val(),
            data: {format: 'html'}
        }).done(function (data) {
            $("#hardDrive").html(data);
        });
    }
}
function newHardDrive() {
    if ($("#hardDrive").val() === "Add a New Option") {
        let add = prompt("New Hard Drive:");
        if (add !== null && add !== "") {
            console.log(add);
            $("#hardDrive").append(new Option(add, add));
            $("#hardDrive").val(add);
        }
    }
    else {
        $.ajax({
            type: "GET",
            url: "#{location}/getGraphicsCardOptions?model=" + $("#model").val(),
            data: {format: 'html'}
        }).done(function (data) {
            $("#graphicsCard").html(data);
        });
    }
}
function newGraphicsCard() {
    if ($("#graphicsCard").val() === "Add a New Option") {
        let add = prompt("New Hard Drive:");
        if (add !== null && add !== "") {
            console.log(add);
            $("#graphicsCard").append(new Option(add, add));
            $("#graphicsCard").val(add);
        }
    }
}
function refreshModelOptions() {
    if($("#make").val() === "Add a New Option"){
        let make = prompt("New Make:");
        if(make !== null && make !== ""){
            console.log(make);
            $("#make").append(new Option(make, make));
            $("#make").val(make);
            newModel();
        }
    }
    else{
        $.ajax({
            type: "GET",
            url: "#{location}/getModelOptions?type=Computer&make=" + $("#make").val(),
            data: {format: 'html'}
        }).done(function (data) {
            $("#model").html(data);
        });
    }
}

function stopBounce(id) {
    console.log(id);
    $('#' + id.id).css('display', 'none');
}

function go() {
    $("#form").submit();

}