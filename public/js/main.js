// uncomment line below to register offline cache service worker
// navigator.serviceWorker.register('../serviceworker.js');

if (typeof fin !== "undefined") {
    init();
} else {
    document.querySelector("#of-version").innerText =
        "The fin API is not available - you are probably running in a browser.";
}

// once the DOM has loaded and the OpenFin API is ready
async function init() {
    // get a reference to the current Application.
    const app = await fin.Application.getCurrent();
    const win = await fin.Window.getCurrent();

    const ofVersion = document.querySelector("#of-version");
    ofVersion.innerText = await fin.System.getVersion();

    // only launch new windows from the main window.
    if (win.identity.name === app.identity.uuid) {
        // create the channel provider from the main window
        createChannel();

        // subscribing to the run-requested events will allow us to react to secondary launches, clicking on the icon once the Application is running for example.
        // for this app we will  launch a child window the first the user clicks on the desktop.
        const createWindowBtn = document.querySelector("#create-window");
        createWindowBtn.addEventListener("click", async e => {
            e.preventDefault();
            await fin.Window.create({
                name: `child-${new Date(Date.now())
                    .toTimeString()
                    .slice(0, 8)}`,
                url: location.href,
                defaultWidth: 320,
                defaultHeight: 320,
                autoShow: true
            });
        });
    } else {
        // if we aren't in the main window, join the channel
        joinChannel();
    }
}

async function createChannel() {
    const channel = await fin.InterApplicationBus.Channel.create("example");
    console.log(channel);
    const providerIdentity = document.querySelector("#provider-identity");
    providerIdentity.innerText = `${JSON.stringify(
        channel.providerIdentity,
        null,
        4
    )}`;

    const clientConnections = document.querySelector("#client-connections");

    console.log("Channel created");
    channel.setDefaultAction((action, payload, identity) => {
        console.log(`Someone sent a message`, { action, payload, identity });
        channel.send(identity, action, payload);
    });
    channel.onConnection(identity => {
        console.log(`Someone connected`, identity);
        clientConnections.innerText = `${JSON.stringify(
            channel.connections,
            null,
            4
        )}`;
    });
}

async function joinChannel() {
    console.log("Connecting..");
    const client = await fin.InterApplicationBus.Channel.connect("example", {
        wait: true
    });

    console.log("Connected to a channel");
    client.setDefaultAction((action, payload) => {
        console.log("Received a message", { action, payload });
    });

    client.dispatch("my-action", "my-payload");
}
