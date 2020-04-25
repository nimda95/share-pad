/**
 * QUICK DISCLAIMER /!\
 * You may see the see the use of some methods that some 
 * of you might argue that it's not best practice, but it was used primarely 
 * to save on bandwidth, like the use of Integers to identify different commands,
 * it's this way because it has the smallest size footprint (ino, I can use 
 * compression, but in my opinion, It'll just use more useless processing power, 
 * which we should preserve for the users that have device which may not be powerful 
 * enough or may stutter)
 * Aso, again, the minimum of libraries was used to preserve bandwidth and/or 
 * processing recourses.
 * P.S : I'm no better in optimization than you, so a PR with your suggestions 
 * would be the most welcome
 */

let canvas = document.getElementById('canvas');
let canvasContainer = document.getElementsByClassName("draw-area")[0];
let ctx = canvas.getContext('2d');
let pointsToSend = [];

let canDraw = false;
let isMaster = false;
let actionId = 0;

let socket = undefined;


let showJoinSessionContainer = () => {
    document.querySelector(".role-selection-buttons").style['opacity'] = 0;
    setTimeout(() => {
        document.querySelector(".role-selection-buttons").style['display'] = "none";
        document.querySelector(".viewer-input-form").style['display'] = "block";
        setTimeout(() => {
            document.querySelector(".viewer-input-form").style['opacity'] = "1";
        }, 1)
    }, 600)
}
let backToRoleSelection = () => {
    document.querySelector(".viewer-input-form").style['opacity'] = "0";
    setTimeout(() => {
        document.querySelector(".role-selection-buttons").style['display'] = "block";
        document.querySelector(".viewer-input-form").style['display'] = "none";
        setTimeout(() => {
            document.querySelector(".role-selection-buttons").style['opacity'] = "1";
        }, 1)
    }, 600)
}

let wsCommands = (drawEvent, sendNow = false) => {
    actionId++;
    pointsToSend.push(actionId + "," + drawEvent.join(","))
    if (pointsToSend.length === 5 || sendNow) {
        socket.send(pointsToSend.join(";"))
        pointsToSend = [];
    }
}

let drawEvents = {
    move: (e) => {
        if (!canDraw) return;

        e.x = e.x == undefined ? e.touches[0].pageX : e.x
        e.y = e.y == undefined ? e.touches[0].pageY : e.y
        //EXPLANATION : This is 5 px safety area. To see the effect comment lines in this condition, refresh the page 
        if (e.x < 5 || e.y < 5 || e.x > canvasContainer.offsetWidth - 5 || e.y > canvasContainer.offsetHeight - 5) {
            events.up(e)
            return;
        }
        ctx.lineTo(e.x, e.y)
        if (e.target !== undefined)
            wsCommands([1, e.x, e.y])
        ctx.stroke()
    },
    down: (e) => {
        ctx.beginPath()

        e.x = e.x == undefined ? e.touches[0].pageX : e.x
        e.y = e.y == undefined ? e.touches[0].pageY : e.y
        ctx.moveTo(e.x, e.y)
        if (e.target !== undefined)
            wsCommands([0, e.x, e.y])
        canDraw = true
    },
    up: (e) => {
        ctx.closePath()
        if (e.target !== undefined)
            wsCommands([2])
        canDraw = false
    },
    debugEvents: (e) => {
        console.log(e)
    }
}
//TODO: Check using this ID if all of the actions have been received, if not request them from the server.
let lastReceiedId = 0;
let socketEvents = {
    onopen: (e) => {
        wsCommands([3, canvasContainer.offsetHeight, canvasContainer.offsetWidth], true)
        //FIXME:  # send config data #
        //TODO: retreive any lost data durring the outage if there was any
        //TODO: retreive any past data for the late comers
    },
    onmessage: (e) => {
        commands = e.data.split(';')
        for (var id in e.data) {
            if (commands[id] !== undefined) {
                commands[id] = commands[id].split(',')
                if (lastReceiedId + 1 != parseInt(commands[id][0])) {
                    //TODO: get updates from the server and save them locally them some how ???
                }
                switch (commands[id][1].trim()) {
                    case "0":
                        //Put down the pen on the whiteboard
                        drawEvents.down({
                            x: commands[id][2],
                            y: commands[id][3]
                        })
                        break;
                    case "1":
                        //move the pen on the white board (will draw the line obviously)
                        drawEvents.move({
                            x: commands[id][2],
                            y: commands[id][3]
                        })
                        break;
                    case "2":
                        //lift the pen off the drawing borad
                        drawEvents.up({
                            target: "not null :D"
                        })
                        break;
                    case "3":
                        //Setup drawing area with data comming from the server

                        //FIXME ? all the users must have the same aspect ratio.
                        canvas.setAttribute('width', parseFloat(commands[id][2]));
                        canvas.setAttribute('height', parseFloat(commands[id][3]));

                        document.querySelector('.page-selection').style['display'] = 'block';
                        setTimeout(() => {
                            document.querySelector('.page-selection').style['opacity'] = '1';
                        }, 1)

                        if (commands[id][4] == "1" || commands[id][4] == "2") {
                            //Mouse input
                            canvas.addEventListener('mousemove', drawEvents.move, false);
                            canvas.addEventListener('mousedown', drawEvents.down, false);
                            canvas.addEventListener('mouseup', drawEvents.up, false);
                            //FIXME:  a point is not rendered when clicking
                            canvas.addEventListener('click', drawEvents.debugEvents, false);

                            //touchscreen input
                            canvas.addEventListener("touchmove", drawEvents.move, false);
                            canvas.addEventListener("touchstart", drawEvents.down, false);
                            canvas.addEventListener("touchend", drawEvents.up, false);
                            canvas.addEventListener("touchcancel", drawEvents.up, false);

                            if (!!timeouts.toolbarShowHide) clearInterval(timeouts.toolbarShowHide)
                            document.querySelector('.toolbar').style['display'] = 'block';
                            timeouts.toolbarShowHide = setTimeout(() => {
                                document.querySelector('.toolbar').style['opacity'] = '1';
                            }, 1)
                        } else {
                            //Disables draw possibilities
                            canvas.removeEventListener('mousemove');
                            canvas.removeEventListener('mousedown');
                            canvas.removeEventListener('mouseup');
                            canvas.removeEventListener('click');
                            canvas.removeEventListener("touchstart");
                            canvas.removeEventListener("touchend");
                            canvas.removeEventListener("touchcancel");
                            canvas.removeEventListener("touchmove");

                            if (!!timeouts.toolbarShowHide) clearInterval(timeouts.toolbarShowHide)
                            document.querySelector('.toolbar').style['opacity'] = '0';
                            timeouts.toolbarShowHide = setTimeout(() => {
                                document.querySelector('.toolbar').style['display'] = 'none';
                                timeouts.toolbarShowHide = undefined;
                            }, 300)
                        }
                        break;
                    case "4":
                        //TODO: revert to a draw command (by syncId)
                        break;
                    case "5":
                        localStorage.setItem('client_id', commands[id][2])
                        break;
                    default:
                        console.warn("Undefined command", commands[id][1])
                        //FIXME: Add github repo url (README.md file preferably)
                        console.info("Please check the commands list from the github page", "URL")
                }
            }
        }
    },
    onclose: (e) => {
        //reconnect immediately
        connectWs()
    }
}
let timeouts = {}
let connectWs = () => {
    //TODO: implement somekind of load balancing that detects which websocket endpoint to connect to it
    let baseWebSocketUrl = "ws" + (document.location.protocol.startsWith("https") ? "s" : "") +
        "://ws." + document.location.host.split(":")[0] + ":9000/" + padPath;
    socket = new WebSocket(baseWebSocketUrl)
    socket.onopen = socketEvents.onopen
    socket.onclose = socketEvents.onclose
    socket.onmessage = socketEvents.onmessage
}

document.getElementById('id-input').addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        accessPad()
    }
})

let padPath = "";
let accessPad = () => {
    if (socket !== undefined) {
        padIdInput = document.getElementById('id-input');
        padPath = padIdInput.value;
        padIdInput.value = "";
        connectWs()
    }
}